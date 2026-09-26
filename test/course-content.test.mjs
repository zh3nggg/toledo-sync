import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ContentReadError, collectCourseContent, createContentReader, courseIdFromUrl, extractUltraFileLinks, readCoursePage } from '../src/course-content.mjs';
import { downloadFile } from '../src/sync.mjs';
import { sha256 } from '../src/utils.mjs';
import { missingSessionCookies } from '../src/browser.mjs';

test('old login export cannot overwrite refreshed browser cookies or restore expired cookies', () => {
  const cookie = { name: 'session', domain: 'ultra.example', path: '/', value: 'old', expires: -1 };
  assert.deepEqual(missingSessionCookies([cookie], [{ ...cookie, value: 'refreshed' }]), []);
  assert.deepEqual(missingSessionCookies([{ ...cookie, expires: 10 }], [], 20), []);
  assert.deepEqual(missingSessionCookies([cookie], []), [cookie]);
});

const base = 'https://ultra.example/ultra/courses/_1_1/outline';
const root = { id: 'root', title: 'ROOT', contentHandler: 'resource/x-bb-folder' };
const folder = { id: 'folder', title: 'Week 1', contentHandler: 'resource/x-bb-folder' };
const doc = { id: 'doc', title: 'Notes', contentHandler: 'resource/x-bb-document', body: { rawText: '<a href="/bbcswebdav/notes.pdf">Notes</a>' } };
function reader(routes) {
  return async value => {
    const url = new URL(value, base), key = url.pathname.replace('/learn/api/v1/courses/_1_1/contents', '') + url.search;
    if (!Object.hasOwn(routes, key)) throw new Error(`Unexpected endpoint ${key}`);
    if (routes[key] instanceof Error) throw routes[key];
    return routes[key];
  };
}
test('root access denial cannot become an empty successful course', async () => {
  const calls = [];
  await assert.rejects(collectCourseContent(async url => { calls.push(url); throw new ContentReadError('Access denied', 403); }, base, '_1_1'), /Access denied/);
  assert.equal(calls.length, 2);
  assert.match(calls[1], /public\/v1/);
});
test('complete traversal retains hierarchy, pagination and duplicate protection', async () => {
  const result = await collectCourseContent(reader({
    '/ROOT': root, '/ROOT/children?limit=100': { results: [folder], paging: { nextPage: '?offset=100' } },
    '/ROOT/children?offset=100': { results: [folder] }, '/folder': folder,
    '/folder/children?limit=100': { results: [doc] }, '/doc': doc
  }), base, '_1_1');
  assert.equal(result.records.length, 3);
  assert.equal(result.files.length, 1);
  assert.deepEqual(result.files[0].pathSegments, ['Week 1']);
});
test('child API failure and malformed lists fail the complete check', async () => {
  for (const response of [new ContentReadError('Unavailable', 503), {}]) {
    await assert.rejects(collectCourseContent(reader({ '/ROOT': root, '/ROOT/children?limit=100': response }), base, '_1_1'));
  }
});
test('a genuinely empty course has a validated empty children response', async () => {
  const result = await collectCourseContent(reader({ '/ROOT': root, '/ROOT/children?limit=100': { results: [] } }), base, '_1_1');
  assert.equal(result.files.length, 0);
  assert.equal(result.records.length, 1);
});
test('cyclic pagination is reported rather than looping or truncating', async () => {
  await assert.rejects(collectCourseContent(reader({ '/ROOT': root, '/ROOT/children?limit=100': { results: [], paging: { nextPage: '?limit=100' } } }), base, '_1_1'), /pagination/);
});
test('public content fallback enumerates attachments when private endpoint is absent', async () => {
  const result = await collectCourseContent(async value => {
    if (!value.includes('/public/')) throw new ContentReadError('Not found', 404);
    const url = new URL(value, base);
    if (url.pathname.endsWith('/attachments')) return { results: [{ id: 'file1', fileName: 'Sheet.pdf' }] };
    if (url.pathname.endsWith('/doc')) return { id: 'doc', title: 'Sheet', contentHandler: { id: 'resource/x-bb-file' } };
    return { results: [{ id: 'doc' }] };
  }, base, '_1_1');
  assert.equal(result.source, 'public-api');
  assert.match(result.files[0].href, /attachments\/file1\/download$/);
});
test('malformed and non-HTTP links do not hide valid embedded files', () => {
  const links = extractUltraFileLinks({ id: 'doc', body: '<a href="http://[broken">bad</a><a href="javascript:download()">bad</a><iframe src="/notes.pdf?x=1&#38;y=2"></iframe>' }, base);
  assert.equal(links.length, 1);
  assert.equal(links[0].href, 'https://ultra.example/notes.pdf?x=1&y=2');
});
test('read transport retries rate limits with progress and a bounded delay', async () => {
  let calls = 0; const waits = [], progress = [], diagnostics = [];
  const page = { url: () => base, evaluate: async () => ++calls === 1 ? { status: 429, retryAfter: '2' } : { status: 200, body: root } };
  const read = createContentReader(page, {}, { wait: async ms => waits.push(ms), onProgress: s => progress.push(s), diagnostics });
  assert.equal((await read('/learn/api/v1/root')).id, 'root');
  assert.deepEqual(waits, [2000]);
  assert.equal(progress.length, 1);
  assert.equal(diagnostics[0].status, 429);
});
test('browser failure can recover through the context request without ignoring HTTP errors', async () => {
  const page = { url: () => base, evaluate: async () => ({ status: 401 }) };
  const context = { request: { get: async () => ({ status: () => 200, json: async () => root, headers: () => ({}), url: () => base }) } };
  assert.equal((await createContentReader(page, context)('/learn/api/v1/root')).id, 'root');
  await assert.rejects(createContentReader(page, context)('https://unrelated.example/learn/api/v1/root'), /unexpected/);
});
test('HTML login responses are never interpreted as empty JSON contents', async () => {
  const page = { url: () => base, evaluate: async () => ({ status: 200, body: null, invalidJson: true, finalUrl: 'https://idp.kuleuven.be/login' }) };
  const context = { request: { get: async () => ({ status: () => 200, json: async () => { throw new Error(); }, headers: () => ({}), url: () => 'https://idp.kuleuven.be/login' }) } };
  await assert.rejects(createContentReader(page, context, { attempts: 1 })('/learn/api/v1/root'), /Sign in/);
});
test('deep notification links identify the course independently of interface language', () => {
  assert.equal(courseIdFromUrl('https://ultra.example/ultra/redirect?courseId=_1_1&contentId=_9_1'), '_1_1');
  assert.equal(courseIdFromUrl('https://ultra.example/ultra/courses/_1_1/outline/document/_9_1'), '_1_1');
});
test('course page readiness requires no English label or DOM text', async () => {
  let current = base, listener;
  const page = {
    url: () => current, on: (_, fn) => { listener = fn; }, off: () => {},
    goto: async url => { current = url; listener({ url: () => 'https://ultra.example/learn/api/v1/courses/_1_1/contents/ROOT' }); },
    waitForURL: async predicate => assert.equal(predicate(new URL(current)), true),
    evaluate: async (_, { url }) => ({ status: 200, body: url.endsWith('/ROOT') ? root : { results: [] } })
  };
  const result = await readCoursePage(page, {}, `${base}/document/_9_1`);
  assert.equal(result.referer, base);
  assert.equal(current, base);
});
test('login HTML at a PDF URL is neither cached nor written', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'toledo-html-'));
  const output = path.join(temp, 'target'), cache = path.join(temp, 'cache');
  try {
    const response = { status: () => 200, ok: () => true, headers: () => ({ 'content-type': 'text/html' }), body: async () => Buffer.from('<html><input type="password"></html>') };
    const result = await downloadFile({ request: { get: async () => response } }, { href: 'https://ultra.example/file.pdf', title: 'file.pdf' }, output, base, { dryRun: true, cacheDirectory: cache });
    assert.equal(result.status, 'error');
    assert.deepEqual(await fs.readdir(temp), []);
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
});
test('checked bytes are reused without a second download; edited local file is retained', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'toledo-cache-'));
  try {
    const output = path.join(temp, 'target'), cache = path.join(temp, 'cache'), cacheIndex = {};
    let requests = 0; const bytes = Buffer.from('%PDF remote');
    const context = { request: { get: async () => { requests++; return { status: () => 200, ok: () => true, headers: () => ({ 'content-type': 'application/pdf' }), body: async () => bytes }; } } };
    const link = { href: 'https://ultra.example/file.pdf', title: 'file.pdf' };
    await downloadFile(context, link, output, base, { dryRun: true, cacheDirectory: cache, cacheIndex });
    await assert.rejects(fs.access(output));
    await fs.mkdir(output); await fs.writeFile(path.join(output, 'file.pdf'), 'my annotations');
    const result = await downloadFile(context, link, output, base, { cacheIndex });
    assert.equal(requests, 1); assert.equal(result.fromCache, true); assert.equal(result.status, 'local-modified');
    assert.equal(await fs.readFile(path.join(output, 'file.pdf'), 'utf8'), 'my annotations');
    assert.equal(sha256(await fs.readFile(path.join(output, result.file))), sha256(bytes));
    await fs.writeFile(Object.values(cacheIndex)[0].path, 'corrupt');
    await assert.rejects(downloadFile(context, link, output, base, { cacheIndex }), /damaged/);
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
});
