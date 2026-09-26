import path from 'node:path';
import { FILE_EXTENSIONS } from './constants.mjs';
import { sanitizeFileName } from './utils.mjs';

const transient = new Set([0, 408, 429, 500, 502, 503, 504]);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export class ContentReadError extends Error {
  constructor(message, status = 0, endpoint = '') {
    super(message); this.name = 'ContentReadError'; this.status = status; this.endpoint = endpoint;
  }
}

export function courseIdFromUrl(value) {
  try {
    const url = new URL(value);
    return url.pathname.match(/\/ultra\/courses\/([^/]+)/i)?.[1]
      ?? (url.pathname.startsWith('/ultra/') ? url.searchParams.get('courseId') : null);
  } catch { return null; }
}

export function isLoginUrl(value) {
  try {
    const url = new URL(value);
    return /^(idp|account)\.kuleuven\.be$/i.test(url.hostname)
      || /\/(?:webapps\/login|login|signin)(?:\/|$)/i.test(url.pathname);
  } catch { return false; }
}

export function isLikelyFileLink(value) {
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && (/bbcswebdav|attachment|download|contentfile|resource\//i.test(url.href)
      || FILE_EXTENSIONS.has(path.extname(url.pathname).toLowerCase()));
  } catch { return false; }
}

function decodeHtml(value = '') {
  return String(value).replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => {
    const n = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
  }).replaceAll('&quot;', '"').replaceAll('&apos;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
}

export function extractUltraFileLinks(content, baseUrl) {
  const links = new Map();
  function add(href, title, force = false) {
    try {
      const url = new URL(decodeHtml(href), baseUrl);
      if (!/^https?:$/.test(url.protocol) || (!force && !isLikelyFileLink(url.href))) return;
      links.set(url.href, { href: url.href, title: decodeHtml(title || ''), text: content.title || '', contentId: content.id });
    } catch { /* One malformed author link must not hide other attachments. */ }
  }
  const file = content?.contentDetail?.['resource/x-bb-file']?.file;
  if (file?.permanentUrl || file?.viewerUrl) add(file.permanentUrl || file.viewerUrl, file.fileName || content.title, true);
  for (const attachment of content.attachments ?? []) {
    if (attachment.downloadUrl || attachment.permanentUrl) add(attachment.downloadUrl || attachment.permanentUrl, attachment.fileName || attachment.name, true);
  }
  const bodies = typeof content.body === 'string' ? [content.body] : [content.body?.rawText, content.body?.displayText];
  for (const html of bodies.filter(v => typeof v === 'string')) {
    for (const match of html.matchAll(/<(?:a|iframe|embed|object)\b[^>]*?\b(?:href|src|data)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/gi)) {
      const tag = decodeHtml(match[0]);
      const name = tag.match(/(?:linkName|displayName)"\s*:\s*"([^"]+)"/i)?.[1];
      add(match[1] ?? match[2] ?? match[3], name || content.title);
    }
  }
  return [...links.values()];
}

function failResponse(result, endpoint) {
  const status = result.status;
  const hint = status === 401 || result.login ? 'Sign in to Toledo again.'
    : status === 403 ? 'Access denied. The course or item may be closed or unavailable to this account.'
      : 'The course could not be read completely. Retry the check.';
  return new ContentReadError(`Content request failed (${status || 'network error'}${result.invalidJson ? ', expected JSON' : ''}). ${hint}`, status, endpoint);
}

// Only GET requests, only on the course origin. Never log cookies, headers or response bodies.
export function createContentReader(page, context, { timeoutMs = 120000, attempts = 3, onProgress = () => {}, diagnostics = [], wait = sleep } = {}) {
  const origin = new URL(page.url()).origin;
  return async function readJson(value) {
    const url = new URL(value, origin);
    if (url.origin !== origin || !url.pathname.startsWith('/learn/api/')) throw new ContentReadError('Rejected an unexpected content API location.');
    let last;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      for (const transport of ['browser', 'request']) {
        try {
          if (transport === 'browser') {
            last = await page.evaluate(async ({ url, timeoutMs }) => {
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), timeoutMs);
              try {
                const r = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, signal: controller.signal });
                const body = await r.json().catch(() => null);
                return { status: r.status, body, invalidJson: body === null, retryAfter: r.headers.get('retry-after'), finalUrl: r.url };
              } finally { clearTimeout(timer); }
            }, { url: url.href, timeoutMs });
          } else {
            const r = await context.request.get(url.href, { timeout: timeoutMs, failOnStatusCode: false, headers: { Accept: 'application/json', Referer: page.url(), 'X-Requested-With': 'XMLHttpRequest' } });
            try {
              const body = await r.json().catch(() => null);
              last = { status: r.status(), body, invalidJson: body === null, retryAfter: r.headers()['retry-after'], finalUrl: r.url() };
            } finally { await r.dispose?.(); }
          }
          last.login = isLoginUrl(last.finalUrl);
        } catch { last = { status: 0, body: null }; }
        diagnostics.push({ endpoint: url.pathname, transport, attempt, status: last.status, invalidJson: Boolean(last.invalidJson), login: Boolean(last.login) });
        if (last.status >= 200 && last.status < 300 && last.body && !last.login) return last.body;
        // Do not double the server load on rate limits or server errors.
        if (transient.has(last.status) && last.status !== 0) break;
      }
      // A newly opened Ultra SPA may still be exchanging its SSO session.
      if (attempt === attempts || (!transient.has(last.status) && last.status !== 401 && !(last.status === 200 && last.invalidJson))) break;
      const seconds = Number(last.retryAfter);
      const dateDelay = Date.parse(last.retryAfter) - Date.now();
      const delay = Math.min(30000, Math.max(1000 * 2 ** (attempt - 1), Number.isFinite(seconds) ? seconds * 1000 : dateDelay || 0));
      onProgress(`Content request interrupted; retry ${attempt}/${attempts - 1} in ${Math.ceil(delay / 1000)}s`);
      await wait(delay);
    }
    throw failResponse(last, url.pathname);
  };
}

async function listPages(readJson, initial, baseUrl, maxPages) {
  const results = [], seen = new Set();
  let next = new URL(initial, baseUrl).href;
  while (next) {
    if (seen.has(next) || seen.size >= maxPages) throw new ContentReadError('Content pagination did not finish; the check is incomplete.');
    seen.add(next);
    const body = await readJson(next);
    if (!Array.isArray(body.results)) throw new ContentReadError('Unexpected content-list response; the check is incomplete.');
    results.push(...body.results);
    next = body.paging?.nextPage ? new URL(body.paging.nextPage, next).href : null;
  }
  return results;
}

export async function collectCourseContent(readJson, baseUrl, courseId, { maxItems = 10000, maxPages = 200, onProgress = () => {} } = {}) {
  const prefix = `/learn/api/v1/courses/${encodeURIComponent(courseId)}/contents`;
  const publicPrefix = `/learn/api/public/v1/courses/${encodeURIComponent(courseId)}/contents`;
  let root, publicApi = false, seeds;
  try {
    root = await readJson(`${prefix}/ROOT`);
    if (!root.id || !root.contentHandler) throw new ContentReadError('Unexpected course-root response.');
  } catch (error) {
    if (!(error instanceof ContentReadError) || ![403, 404, 405].includes(error.status)) throw error;
    onProgress('Trying the alternative course-content endpoint');
    seeds = await listPages(readJson, `${publicPrefix}?limit=100`, baseUrl, maxPages);
    publicApi = true;
  }
  const queue = publicApi ? seeds.map(content => ({ content, path: [] })) : [{ content: root, path: [], root: true }];
  const seen = new Set(), files = new Map(), records = [];
  while (queue.length) {
    const item = queue.shift();
    if (!item.content?.id) throw new ContentReadError('A content item has no identifier; the check is incomplete.');
    if (seen.has(item.content.id)) continue;
    if (seen.size >= maxItems) throw new ContentReadError('The content limit was reached; the check is incomplete.');
    seen.add(item.content.id);
    const content = item.root ? root : await readJson(`${publicApi ? publicPrefix : prefix}/${encodeURIComponent(item.content.id)}`);
    if (!content.id || !content.contentHandler) throw new ContentReadError('Unexpected content-item response; the check is incomplete.');
    const handler = typeof content.contentHandler === 'string' ? content.contentHandler : content.contentHandler.id;
    const folder = item.root || /(?:folder|lesson|learning-module)$/i.test(handler || '') || content.hasChildren === true
      || Object.values(content.contentDetail ?? {}).some(detail => detail?.isFolder === true);
    const currentPath = folder && !item.root ? [...item.path, sanitizeFileName(content.title, content.id)] : item.path;
    records.push({ id: content.id, title: content.title, contentHandler: handler, path: currentPath });
    onProgress(`Reading item ${seen.size}: ${content.title || content.id}`);
    const links = extractUltraFileLinks(content, baseUrl);
    if ((publicApi && /(?:file|document|item)$/i.test(handler || '')) || (/x-bb-file$/i.test(handler || '') && !links.length)) {
      const attachments = await listPages(readJson, `${publicPrefix}/${encodeURIComponent(content.id)}/attachments?limit=100`, baseUrl, maxPages);
      for (const a of attachments) {
        if (!a.id) throw new ContentReadError('An attachment has no identifier.');
        links.push({ href: new URL(`${publicPrefix}/${encodeURIComponent(content.id)}/attachments/${encodeURIComponent(a.id)}/download`, baseUrl).href, title: a.fileName || a.name || content.title, contentId: content.id });
      }
    }
    if (/x-bb-file$/i.test(handler || '') && !links.length) throw new ContentReadError('A file item has no readable attachment. The check is incomplete.');
    for (const link of links) files.set(link.href, { ...link, pathSegments: item.path });
    if (folder) {
      const children = await listPages(readJson, `${publicApi ? publicPrefix : prefix}/${item.root ? 'ROOT' : encodeURIComponent(content.id)}/children?limit=100`, baseUrl, maxPages);
      for (const child of children) queue.push({ content: child, path: currentPath });
    }
  }
  return { records, files: [...files.values()], source: publicApi ? 'public-api' : 'course-api' };
}

export async function readCoursePage(page, context, url, { timeoutMs = 120000, requestTimeoutMs = 120000, diagnostics = [], onProgress = () => {} } = {}) {
  let bootstrapDone;
  const bootstrap = new Promise(resolve => { bootstrapDone = resolve; });
  const onResponse = response => {
    try {
      if (/\/learn\/api\/v1\/courses\/[^/]+\/contents\/ROOT$/.test(new URL(response.url()).pathname)) bootstrapDone();
    } catch { /* Ignore unrelated network events. */ }
  };
  page.on('response', onResponse);
  try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
  // SSO briefly visits login routes even with a valid session. Let the redirect
  // chain finish before classifying a login page as expired authorization.
  try {
    await page.waitForURL(value => Boolean(courseIdFromUrl(value.href)), { timeout: timeoutMs, waitUntil: 'domcontentloaded' });
  } catch (error) {
    if (isLoginUrl(page.url())) throw new ContentReadError('Toledo authorization has expired. Sign in to Toledo again.', 401);
    throw new ContentReadError('The course did not finish opening. Retry on a stable connection.');
  }
  if (isLoginUrl(page.url())) throw new ContentReadError('Toledo authorization has expired. Sign in to Toledo again.', 401);
  const courseId = courseIdFromUrl(page.url());
  const outline = new URL(`/ultra/courses/${encodeURIComponent(courseId)}/outline`, page.url()).href;
  // Notifications can deep-link to a document. Always enumerate the whole course.
  if (new URL(page.url()).pathname !== new URL(outline).pathname) await page.goto(outline, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
  if (isLoginUrl(page.url())) throw new ContentReadError('Toledo authorization has expired. Sign in to Toledo again.', 401);
  // Readiness follows the SPA's content request, independent of interface language.
  let timer;
  try { await Promise.race([bootstrap, new Promise(resolve => { timer = setTimeout(resolve, Math.min(timeoutMs, 10000)); })]); }
  finally { clearTimeout(timer); }
  const read = createContentReader(page, context, { timeoutMs: requestTimeoutMs, diagnostics, onProgress });
  return { ...await collectCourseContent(read, outline, courseId, { onProgress }), referer: outline };
  } finally { page.off('response', onResponse); }
}
