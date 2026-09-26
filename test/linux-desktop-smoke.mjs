// Linux integration test. All courses and files are served by a local fixture;
// no KU Leuven credentials or real course materials are used.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { _electron as electron } from 'playwright-core';
import { statePath } from '../src/config.mjs';

if (process.platform !== 'linux') throw new Error('Run this smoke test on Linux.');
const require = createRequire(import.meta.url);
const testBrowser = process.env.TOLEDO_TEST_BROWSER || 'chromium';
const cliScript = process.env.TOLEDO_TEST_CLI_PATH || 'src/linux-cli.mjs';
assert.ok(['chromium', 'firefox'].includes(testBrowser));
const testRoot = path.resolve(process.env.TOLEDO_TEST_OUTPUT || '_codex/linux-130/gui-smoke');
await fs.mkdir(testRoot, { recursive: true });
const workspace = await fs.mkdtemp(path.join(testRoot, 'run-'));
let downloads = 0;
const remoteBytes = '%PDF-1.4\nFixture lecture\n';
const root = { id: 'ROOT', title: 'ROOT', contentHandler: 'resource/x-bb-folder' };
const doc = { id: 'doc', title: 'Lecture', contentHandler: 'resource/x-bb-document', body: { rawText: '<a href="/bbcswebdav/lecture.pdf">lecture.pdf</a>' } };
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  if (url.pathname.startsWith('/ultra/')) {
    const id = url.pathname.split('/')[3];
    response.setHeader('Content-Type', 'text/html');
    response.end(`<title>Fixture course</title><script>fetch('/learn/api/v1/courses/${id}/contents/ROOT')</script>`);
    return;
  }
  if (url.pathname === '/bbcswebdav/lecture.pdf') {
    downloads++;
    response.setHeader('Content-Type', 'application/pdf');
    response.end(remoteBytes); return;
  }
  response.setHeader('Content-Type', 'application/json');
  if (url.pathname.includes('/_2_1/')) { response.statusCode = 403; response.end('{"message":"Fixture access denied"}'); return; }
  if (url.pathname.endsWith('/ROOT/children')) response.end(JSON.stringify({ results: [doc] }));
  else if (url.pathname.endsWith('/ROOT')) response.end(JSON.stringify(root));
  else if (url.pathname.endsWith('/doc')) response.end(JSON.stringify(doc));
  else { response.statusCode = 404; response.end('{}'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const home = path.join(workspace, 'home');
await fs.mkdir(home, { recursive: true });
const env = { ...process.env, HOME: home, XDG_CONFIG_HOME: path.join(home, '.config'), ELECTRON_RUN_AS_NODE: '' };
let app;
let page;
try {
  app = await electron.launch({
    executablePath: process.env.TOLEDO_ELECTRON_PATH || require('electron'),
    args: process.env.TOLEDO_ELECTRON_PATH ? [] : ['.'],
    env, timeout: 60000
  });
  page = await app.firstWindow();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.waitForFunction(() => document.querySelector('#platform').textContent === 'Linux');
  const presented = await page.evaluate(async ({ vault, output, browser }) => window.toledo.saveConfig({
    vaultPath: vault, outputRoot: output, selectedCodes: [], materialsPlacement: 'course-root',
    verificationMode: 'sha256', browserChoice: browser
  }), { vault: path.join(workspace, 'vault'), output: path.join(workspace, 'courses'), browser: testBrowser });
  const config = JSON.parse(await fs.readFile(presented.configPath, 'utf8'));
  assert.equal(config.courses.length, 0, 'Linux setup must not seed a hardcoded course list');
  config.courses = [
    { code: 'TEST1', title: 'Fixture Course', selected: true, available: true, order: 1, url: `${origin}/ultra/courses/_1_1/outline` },
    { code: 'TEST2', title: 'Denied Course', selected: true, available: true, order: 2, url: `${origin}/ultra/courses/_2_1/outline` }
  ];
  await fs.writeFile(presented.configPath, JSON.stringify(config));
  await fs.mkdir(path.dirname(statePath(config, 'auth', 'last-login.json')), { recursive: true });
  await fs.writeFile(statePath(config, 'auth', 'last-login.json'), '{}');
  const localFile = path.join(config.download.outputRoot, 'TEST1 Fixture Course', 'lecture.pdf');
  await fs.mkdir(path.dirname(localFile), { recursive: true });
  await fs.writeFile(localFile, 'My local annotations');
  // Only discovery is stubbed: update checks and writes below use the real
  // IPC handlers, shared content engine, browser and local fixture server.
  await app.evaluate(({ ipcMain }, data) => {
    ipcMain.removeHandler('toledo:discover');
    ipcMain.handle('toledo:discover', async () => ({ config: data, matches: [] }));
  }, { ...presented, authenticated: true, courses: config.courses.map(course => ({ ...course, discovered: true })) });
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('#discover').disabled);
  for (const language of ['en', 'zh', 'nl']) {
    await page.selectOption('#language', language);
    for (const size of [[720, 540], [860, 660]]) {
      await app.evaluate(({ BrowserWindow }, [width, height]) => BrowserWindow.getAllWindows()[0].setContentSize(width, height), size);
      for (const tab of ['space', 'courses', 'updates', 'automation']) {
        await page.click(`[data-tab="${tab}"]`);
        const geometry = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth,
          height: innerHeight, monitor: document.querySelector('.activity').getBoundingClientRect().toJSON() }));
        assert.ok(geometry.scroll <= geometry.width, `${language}/${tab} has horizontal overflow`);
        assert.ok(geometry.monitor.top >= 0 && geometry.monitor.bottom <= geometry.height + 1, 'Activity monitor must remain visible');
      }
    }
  }
  await page.selectOption('#language', 'en');
  await page.click('[data-tab="courses"]');
  await page.click('#prepareBrowser');
  await page.waitForFunction(() => !document.querySelector('#prepareBrowser').disabled, null, { timeout: 300000 });
  assert.ok((await page.textContent('#results')).includes(`${testBrowser} is ready`));
  await page.click('#discover');
  await page.waitForFunction(() => document.querySelectorAll('#courses input:checked').length === 2);
  await page.click('[data-tab="updates"]');
  await page.click('#checkUpdates');
  await page.waitForFunction(() => !document.querySelector('#checkUpdates').disabled, null, { timeout: 120000 });
  assert.match(await page.textContent('#fileTree'), /403|denied/i);
  assert.equal(await fs.readFile(localFile, 'utf8'), 'My local annotations');
  assert.deepEqual(await fs.readdir(path.dirname(localFile)), ['lecture.pdf'], 'Check must not write course materials');
  const checkedDownloads = downloads;
  assert.ok(checkedDownloads > 0);
  assert.ok(await page.locator('.tree-decision').count() > 0, 'Local edit must have conflict choices');
  await page.click('#applyUpdates');
  await page.waitForFunction(() => !document.querySelector('#checkUpdates').disabled, null, { timeout: 120000 });
  assert.equal(downloads, checkedDownloads, 'Apply must reuse the checked bytes');
  assert.equal(await fs.readFile(localFile, 'utf8'), 'My local annotations');
  assert.equal((await fs.readdir(path.dirname(localFile))).length, 2, 'Remote copy must preserve the annotated original');
  await page.screenshot({ path: path.join(workspace, 'linux-update-center.png') });
  await page.click('[data-tab="automation"]');
  await page.check('#autoStart');
  await page.click('#saveAutomation');
  await page.waitForFunction(() => !document.querySelector('#saveAutomation').disabled);
  const autostart = path.join(home, '.config', 'autostart', 'toledo-sync.desktop');
  assert.match(await fs.readFile(autostart, 'utf8'), /Exec=.*toledo-sync|Exec=.*AppImage/);
  await page.uncheck('#autoStart');
  await page.click('#saveAutomation');
  await page.waitForFunction(() => !document.querySelector('#saveAutomation').disabled);
  await assert.rejects(fs.access(autostart), { code: 'ENOENT' });
  assert.deepEqual(pageErrors, []);
  await app.close(); app = null;
  // The CLI must return failure to schedulers for the same inaccessible course.
  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliScript, 'check', '--config', presented.configPath, '--language', 'en'], { env });
    let output = '';
    child.stdout.on('data', value => { output += value; });
    child.stderr.on('data', value => { output += value; });
    child.on('error', reject); child.on('close', code => resolve({ code, output }));
  });
  assert.equal(result.code, 1);
  assert.match(result.output, /Check incomplete/);
  assert.match(result.output, /403|denied/i);
  const shellQuote = value => `'${String(value).replaceAll("'", "'\\''")}'`;
  const interactive = await new Promise((resolve, reject) => {
    const command = [process.execPath, cliScript, '--config', presented.configPath, '--language', 'en'].map(shellQuote).join(' ');
    const child = spawn('script', ['-q', '-e', '-c', command, '/dev/null'], { env, signal: AbortSignal.timeout(60000) });
    let output = '', buffer = '', phase = 0;
    child.stdout.on('data', chunk => {
      output += chunk; buffer += chunk;
      if (phase === 0 && buffer.includes('What would you like to do?')) { phase++; buffer = ''; child.stdin.write('3'); }
      else if (phase === 1 && buffer.includes('Space toggle')) { phase++; buffer = ''; child.stdin.write('n \r'); }
      else if (phase === 2 && buffer.includes('What would you like to do?')) { phase++; buffer = ''; child.stdin.write('8'); }
    });
    child.stderr.on('data', chunk => { output += chunk; });
    child.on('error', reject); child.on('close', code => resolve({ code, output, phase }));
  });
  assert.equal(interactive.code, 0, interactive.output);
  assert.equal(interactive.phase, 3);
  const selected = JSON.parse(await fs.readFile(presented.configPath, 'utf8')).courses.filter(course => course.selected);
  assert.deepEqual(selected.map(course => course.code), ['TEST1']);
  console.log(JSON.stringify({ passed: true, workspace, downloads, checks: ['Linux window', '3 languages', '4 tabs at 2 sizes', 'browser installation', 'course selection', '403 error visibility', 'cache reuse', 'annotation preservation', 'XDG autostart', 'CLI exit status', 'CLI keyboard checklist'] }));
} catch (error) {
  if (page && !page.isClosed()) {
    console.error(await page.textContent('#results'));
    await page.screenshot({ path: path.join(workspace, 'failure.png') }).catch(() => {});
  }
  throw error;
} finally {
  if (app) await app.close();
  await new Promise(resolve => server.close(resolve));
}
