import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createTranslator, normalizeLanguage, resolveLanguage } from '../src/cli-i18n.mjs';
import { formatUpdateTree } from '../src/linux-cli.mjs';
import { detectBrowser } from '../src/browser.mjs';
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
