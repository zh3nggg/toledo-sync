import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createTranslator, normalizeLanguage, resolveLanguage } from '../src/cli-i18n.mjs';
import { formatUpdateTree, normalizeWatchInterval, updateCounts } from '../src/linux-cli.mjs';
import { browserChoice, setBrowserChoice, detectBrowser } from '../src/browser.mjs';
import { linuxAutostartEntry, linuxAutostartPath, quoteDesktopArgument } from '../src/linux-desktop.mjs';
import { createConfig } from '../src/config.mjs';

test('Linux CLI resolves English, Chinese, and Dutch locale variants', () => {
  assert.equal(normalizeLanguage('en_GB.UTF-8'), 'en');
  assert.equal(normalizeLanguage('zh_CN.UTF-8'), 'zh');
  assert.equal(normalizeLanguage('nl_BE.UTF-8'), 'nl');
  assert.equal(resolveLanguage('fr_BE', 'nl_BE'), 'nl');
  assert.equal(createTranslator('en')('signIn'), 'Sign in to Toledo');
  assert.equal(createTranslator('zh')('signIn'), '登录 Toledo');
  assert.equal(createTranslator('nl')('signIn'), 'Aanmelden bij Toledo');
});

test('help and missing-browser guidance use the selected language', async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'toledo-cli-lang-'));
  const cli = path.resolve('src/linux-cli.mjs');
  const samples = [
    { language: 'en', help: 'Global options', doctor: 'No supported Chrome' },
    { language: 'zh', help: '通用选项', doctor: '没有找到受支持的' },
    { language: 'nl', help: 'Algemene opties', doctor: 'Geen ondersteunde' }
  ];
  try {
    for (const { language, help, doctor } of samples) {
      const env = { ...process.env, HOME: home, USERPROFILE: home };
      const helpResult = spawnSync(process.execPath, [cli, 'help', '--language', language], { encoding: 'utf8', env });
      assert.equal(helpResult.status, 0, helpResult.stderr);
      assert.ok(helpResult.stdout.includes(help));

      const missing = path.join(home, 'missing-browser-do-not-create');
      const doctorResult = spawnSync(process.execPath, [cli, 'doctor', '--language', language, '--browser', missing], { encoding: 'utf8', env });
      assert.equal(doctorResult.status, 1);
      assert.ok(doctorResult.stdout.includes(doctor));
      assert.doesNotMatch(doctorResult.stdout, /The selected browser does not exist/);
    }
  } finally {
    if (!home.startsWith(path.join(os.tmpdir(), 'toledo-cli-lang-'))) throw new Error('Unexpected CLI test directory');
    await fs.rm(home, { recursive: true, force: true });
  }
});

test('new CLI configurations discover all years and start without bundled selections', () => {
  const config = createConfig(path.resolve('vault'), {
    outputRoot: path.resolve('downloads'), academicYear: '', selectedCodes: [], courseCatalog: [], language: 'en'
  });
  assert.deepEqual(config.filters.academicYears, []);
  assert.deepEqual(config.courses, []);
  assert.equal(config.courses.some((course) => course.selected), false);
  assert.equal(config.ui.language, 'en');
});

test('update preview renders courses, paths, and localized statuses', () => {
  const tree = formatUpdateTree([{
    course: { code: 'G0R16A', title: 'Semiconductor Physics' },
    files: [
      { status: 'new', file: 'Slides/Week 1.pdf' },
      { status: 'local-modified', file: 'Notes/annotated.pdf' },
      { status: 'unchanged', file: 'Syllabus.pdf' }
    ]
  }], createTranslator('en'));
  assert.match(tree, /G0R16A Semiconductor Physics/);
  assert.match(tree, /\[new\] Slides\/Week 1\.pdf/);
  assert.match(tree, /\[local edit\] Notes\/annotated\.pdf/);
  assert.match(tree, /\[unchanged\] Syllabus\.pdf/);
});

test('browser detection accepts an explicitly configured executable path', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'toledo-browser-'));
  const executable = path.join(directory, 'chromium');
  try {
    await fs.writeFile(executable, 'test');
    assert.equal(await detectBrowser(executable), executable);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('watch intervals are bounded for unattended Linux checks', () => {
  assert.equal(normalizeWatchInterval(undefined), 60);
  assert.equal(normalizeWatchInterval('30'), 30);
  assert.throws(() => normalizeWatchInterval('0'), /1 to 1440/);
  assert.throws(() => normalizeWatchInterval('1.5'), /1 to 1440/);
});

test('a failed course is an error rather than a successful empty update', () => {
  const results = [{ course: { code: 'FAILED', title: 'Unavailable API' }, status: 'scan-error', error: 'HTTP 403', files: [] },
    { course: { code: 'OK', title: 'Readable course' }, status: 'partial-error', files: [{ status: 'new', file: 'slides.pdf' }, { status: 'error', error: 'HTTP 500' }] }];
  assert.deepEqual(updateCounts(results), { newCount: 1, unchanged: 0, modified: 0, errors: 2 });
  assert.match(formatUpdateTree(results), /error.*HTTP 403/);
  for (const language of ['en', 'zh', 'nl']) assert.notEqual(createTranslator(language)('checkIncomplete'), 'checkIncomplete');
});

test('explicit missing browser is not silently replaced with another browser', async () => {
  await assert.rejects(detectBrowser(path.resolve('missing-browser-do-not-create')), { code: 'BROWSER_SETUP_REQUIRED' });
});

test('managed browser selection clears stale executable paths', () => {
  const config = { browser: { executablePath: '/old/chrome', profilePath: '/profile' } };
  setBrowserChoice(config, 'firefox');
  assert.equal(browserChoice(config), 'firefox');
  assert.equal(config.browser.executablePath, null);
  setBrowserChoice(config, 'chromium');
  assert.equal(browserChoice(config), 'chromium');
  setBrowserChoice(config, 'auto');
  assert.equal(browserChoice(config), 'auto');
  assert.equal(config.browser.profilePath, '/profile');
  assert.throws(() => setBrowserChoice(config, 'unknown'));
});

test('Linux autostart handles AppImage, installed app, development and XDG paths', () => {
  const options = { executable: '/opt/Toledo Sync/toledo-sync', appPath: '/project', packaged: true };
  assert.match(linuxAutostartEntry(options), /Exec="\/opt\/Toledo Sync\/toledo-sync"\n/);
  assert.match(linuxAutostartEntry({ ...options, appImage: '/home/user/My Apps/Toledo.AppImage' }), /Exec="\/home\/user\/My Apps\/Toledo.AppImage"\n/);
  assert.match(linuxAutostartEntry({ ...options, packaged: false }), /" "\/project"/);
  assert.equal(linuxAutostartPath('/home/test', {}), path.join('/home/test', '.config', 'autostart', 'toledo-sync.desktop'));
  assert.equal(linuxAutostartPath('/home/test', { XDG_CONFIG_HOME: path.resolve('xdg') }), path.join(path.resolve('xdg'), 'autostart', 'toledo-sync.desktop'));
  assert.match(quoteDesktopArgument('/tmp/100%/app'), /100%%/);
  assert.throws(() => quoteDesktopArgument('/tmp/app\nExec=bad'));
});
