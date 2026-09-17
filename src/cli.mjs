#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import { defaultConfigPath, initializeConfig, loadConfig, normalizeMaterialsLayout, saveConfig, statePath } from './config.mjs';
import { launchBrowser } from './browser.mjs';
import { discoverCourses } from './discover.mjs';
import { ask, askWithDefault, choose, confirm } from './prompt.mjs';
import { setCalendarUrl, syncCalendar } from './calendar.mjs';
import { syncCourses } from './sync.mjs';
import { parseArgs, writeJson } from './utils.mjs';

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForSuccessfulPortalLogin(page, timeoutMs = 10 * 60 * 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const currentUrl = page.url();
    const title = await page.title().catch(() => '');
    const isIdentityProvider = /idp\.kuleuven\.be|account\.kuleuven\.be/i.test(currentUrl);
    const isPortal = /\/portal(?:\/|$)|\/ultra(?:\/|$)/i.test(currentUrl) || /blackboard|toledo portal/i.test(title);
    if (!isIdentityProvider && isPortal) return { currentUrl, title };
    await delay(1000);
  }
  throw new Error('Timed out waiting for Toledo portal login. The browser profile was kept for another attempt.');
}

const HELP = `
Toledo Sync 0.1.17

Usage:
  toledo-sync init --vault <Obsidian vault>
                   --output <download root>
                   [--materials-in-course | --materials-subdirectory <name>]
                   [--academic-year 2026-2027|all]
                   [--courses G0S96A,G0S83A,...]
  toledo-sync configure --config <config.json>
                        [--output <download directory>]
                        [--materials-in-course | --materials-subdirectory <name>]
                        [--academic-year 2026-2027|all]
                        [--courses G0S96A,G0S83A,...]
  toledo-sync list --config <config.json>
  toledo-sync login --config <config.json>
  toledo-sync discover --config <config.json>
  toledo-sync check --config <config.json> [--course G0S96A]
  toledo-sync sync --config <config.json> [--course G0S96A]
  toledo-sync set-calendar --config <config.json>
  toledo-sync sync-calendar --config <config.json>

Interactive mode:
  toledo-sync                         Start the setup / update wizard
  toledo-sync interactive [--config <config.json>]

The login command never asks for your KU Leuven password. Complete SSO/MFA in the browser.
`;

const ACADEMIC_YEARS = ['不限（全部学年）', '2025-2026', '2026-2027', '2027-2028', '2028-2029'];
const normalizeAcademicYearOption = (value) => {
  if (value === undefined || value === null) return value;
  return ['all', 'any', '*', '不限', '不限（全部学年）'].includes(String(value).trim().toLowerCase()) ? '' : String(value).trim();
};

async function runLogin(config) {
  const { context, executablePath, profilePath, authStatePath } = await launchBrowser(config);
  try {
    const page = context.pages()[0] ?? await context.newPage();
    await page.goto('https://toledo.kuleuven.be/', { waitUntil: 'domcontentloaded' });
    const loginLink = page.locator('a[href="/portal/"], a[href="/portal"]').first();
    if (await loginLink.count()) await loginLink.click();
    else await page.goto(config.portalUrl, { waitUntil: 'domcontentloaded' });
    console.log(`浏览器：${executablePath}`);
    console.log('请在打开的浏览器中完成 KU Leuven SSO/MFA。');
    const result = await waitForSuccessfulPortalLogin(page);
    if (authStatePath) {
      await context.storageState({ path: authStatePath });
      try { await fs.chmod(authStatePath, 0o600); } catch { /* ACL applies on Windows. */ }
    }
    await writeJson(statePath(config, 'auth', 'last-login.json'), { verifiedAt: new Date().toISOString(), url: result.currentUrl, title: result.title, browser: executablePath, profilePath, authStatePath });
    console.log(`登录成功：${result.title}`);
  } finally { await context.close(); }
}

async function runInteractive(options = {}) {
  console.log('\nToledo Sync · 交互式向导');
  console.log('所有设置会保存在 Vault/_codex/toledo-sync/；密码不会被程序读取或保存。\n');
  let configPath = options.config ? path.resolve(options.config) : null;
  let config;
  if (!configPath) {
    const vault = await askWithDefault('Obsidian Vault 路径', process.cwd());
    configPath = defaultConfigPath(vault);
  }
  try { ({ config } = await loadConfig(configPath)); } catch (error) {
    if (error.code !== 'ENOENT' && !/Pass --config/.test(error.message)) throw error;
    const outputRoot = await askWithDefault('下载根目录（课程文件夹将直接创建在此目录下）', path.join(process.cwd(), 'Toledo courses'));
    const academicYear = normalizeAcademicYearOption(await choose('学年', ACADEMIC_YEARS, 2));
    const layout = await choose('课程内材料布局', ['直接放在课程文件夹', '放入自定义材料子文件夹'], 1);
    const materialsFolderName = layout === '放入自定义材料子文件夹'
      ? await askWithDefault('材料子文件夹名称', 'Materials') : undefined;
    const created = await initializeConfig(path.dirname(path.dirname(path.dirname(configPath))), configPath, {
      outputRoot, academicYear,
      materialsPlacement: layout === '直接放在课程文件夹' ? 'course-root' : 'subdirectory',
      materialsFolderName
    });
    config = created.config;
    console.log(`\n已创建配置：${configPath}`);
  }
  const next = await choose('下一步', ['登录 Toledo', '发现课程', '检查更新', '退出'], 0);
  if (next === '登录 Toledo') {
    await runLogin(config);
    const proceed = await confirm('登录后立即发现课程？', true);
    if (proceed) await discoverCourses(config, configPath, { auto: true, onProgress: (event) => console.log(`  ${event.message}`) });
  } else if (next === '发现课程') {
    await discoverCourses(config, configPath, { auto: true, onProgress: (event) => console.log(`  ${event.message}`) });
  } else if (next === '检查更新') {
    const results = await syncCourses(config, null, (event) => console.log(`  ${event.message}`), { dryRun: true });
    const actionable = results.flatMap((result) => result.files.filter((file) => ['new', 'local-modified'].includes(file.status)));
    console.log(`\n检查完成：发现 ${actionable.length} 个需要处理的文件；本次没有写入课程材料。`);
    if (actionable.length && await confirm('现在应用这些更新？', true)) {
      await syncCourses(config, null, (event) => console.log(`  ${event.message}`));
      console.log('更新已应用。现有本地修改不会被覆盖。');
    }
  }
  if (next !== '退出' && next !== '检查更新') {
    const discovered = config.courses.filter((course) => course.url);
    if (discovered.length) {
      console.log('\n已发现课程：');
      discovered.forEach((course, index) => console.log(`  ${index + 1}) ${course.code} ${course.title}`));
      const selection = await askWithDefault('要同步哪些课程（编号或课程编号，用逗号分隔；留空为全部）', '');
      if (selection) {
        const tokens = selection.split(',').map((value) => value.trim());
        const selectedCodes = new Set(tokens.map((token) => /^\d+$/.test(token) ? discovered[Number(token) - 1]?.code : token.toUpperCase()).filter(Boolean));
        config.courses.forEach((course) => { course.selected = selectedCodes.has(course.code.toUpperCase()); });
        await saveConfig(configPath, config);
      }
      if (await confirm('先检查更新（推荐）？', true)) {
        const results = await syncCourses(config, null, (event) => console.log(`  ${event.message}`), { dryRun: true });
        const count = results.reduce((sum, result) => sum + result.files.filter((file) => ['new', 'local-modified'].includes(file.status)).length, 0);
        console.log(`\n预览完成：${count} 个文件需要处理；没有覆盖本地文件。`);
        if (count && await confirm('应用更新？', true)) await syncCourses(config, null, (event) => console.log(`  ${event.message}`));
      } else if (await confirm('直接同步？', false)) await syncCourses(config, null, (event) => console.log(`  ${event.message}`));
    }
  }
  console.log('\n完成。下次运行 `toledo-sync` 可继续使用向导；也可查看 `toledo-sync help` 使用命令行参数。');
}

function layoutOptions(options) {
  if (options['materials-in-course'] && options['materials-subdirectory']) {
    throw new Error('Choose either --materials-in-course or --materials-subdirectory, not both.');
  }
  if (options['materials-in-course']) return { materialsPlacement: 'course-root' };
  if (options['materials-subdirectory']) return { materialsPlacement: 'subdirectory', materialsFolderName: String(options['materials-subdirectory']) };
  return {};
}

async function main() {
  const { positional, options } = parseArgs(process.argv.slice(2));
  const command = positional[0];
  if (!command) {
    await runInteractive(options);
    return;
  }
  if (command === 'interactive') {
    await runInteractive(options);
    return;
  }
  if (command === 'help' || options.help) {
    console.log(HELP.trim());
    return;
  }

  if (command === 'init') {
    if (!options.vault) throw new Error('init requires --vault <path>');
    if (!options.output) throw new Error('init requires --output <download root>');
    const selectedCodes = options.courses ? String(options.courses).split(',').map((value) => value.trim()).filter(Boolean) : undefined;
    const result = await initializeConfig(options.vault, options.config && path.resolve(options.config), {
      outputRoot: options.output,
      academicYear: normalizeAcademicYearOption(options['academic-year']),
      selectedCodes,
      ...layoutOptions(options)
    });
    console.log(`Created config: ${result.configPath}`);
    console.log(`Download directory: ${result.config.download.outputRoot}`);
    console.log(`Course materials: ${result.config.download.materialsPlacement === 'course-root' ? 'directly in each course folder' : `in each course folder/${result.config.download.materialsFolderName}`}`);
    console.log('Next: run login, then discover.');
    return;
  }

  const { config, configPath } = await loadConfig(options.config);
  if (command === 'configure') {
    if (options.output) config.download.outputRoot = path.resolve(options.output);
    if (options['materials-in-course'] || options['materials-subdirectory']) {
      Object.assign(config.download, normalizeMaterialsLayout({ ...config.download, ...layoutOptions(options) }));
    }
    if (options['academic-year']) {
      const academicYear = normalizeAcademicYearOption(options['academic-year']);
      if (config.filters.academicYears[0] !== academicYear) config.courses = [];
      config.filters.academicYears = [academicYear];
    }
    if (options.courses) {
      const selected = new Set(String(options.courses).split(',').map((value) => value.trim().toUpperCase()).filter(Boolean));
      const unknown = [...selected].filter((code) => !config.courses.some((course) => course.code.toUpperCase() === code));
      if (unknown.length) throw new Error(`Unknown course code(s): ${unknown.join(', ')}`);
      for (const course of config.courses) course.selected = selected.has(course.code.toUpperCase());
    }
    await saveConfig(configPath, config);
    console.log(`Updated config: ${configPath}`);
    console.log(`Download directory: ${config.download.outputRoot}`);
    console.log(`Course materials: ${config.download.materialsPlacement === 'course-root' ? 'directly in each course folder' : `in each course folder/${config.download.materialsFolderName}`}`);
    console.log(`Academic year: ${config.filters.academicYears.join(', ')}`);
    console.log(`Selected courses: ${config.courses.filter((course) => course.selected).map((course) => course.code).join(', ') || 'none'}`);
    return;
  }
  if (command === 'list') {
    console.log(`Download directory: ${config.download.outputRoot}`);
    console.log(`Course materials: ${config.download.materialsPlacement === 'course-root' ? 'directly in each course folder' : `in each course folder/${config.download.materialsFolderName}`}`);
    console.log(`Academic-year filter: ${config.filters.academicYears.join(', ')}`);
    for (const course of config.courses.sort((left, right) => left.order - right.order)) {
      console.log(`${course.selected ? '[x]' : '[ ]'} ${course.code} ${course.title} (${course.academicYear})${course.url ? ` -> ${course.url}` : ''}`);
    }
    return;
  }
  if (command === 'login') {
    const { context, executablePath, profilePath, authStatePath } = await launchBrowser(config);
    try {
      if (options.fresh) {
        await context.clearCookies();
        if (authStatePath) await fs.rm(authStatePath, { force: true });
      }
      const page = context.pages()[0] ?? await context.newPage();
      await page.goto('https://toledo.kuleuven.be/', { waitUntil: 'domcontentloaded' });
      const loginLink = page.locator('a[href="/portal/"], a[href="/portal"]').first();
      if (await loginLink.count()) await loginLink.click();
      else await page.goto(config.portalUrl, { waitUntil: 'domcontentloaded' });
      console.log(`Browser: ${executablePath}`);
      console.log(`Local profile: ${profilePath}`);
      console.log('请在浏览器中完成 KU Leuven SSO/MFA；检测到课程门户后浏览器会自动关闭。');
      const result = await waitForSuccessfulPortalLogin(page);
      if (authStatePath) {
        await context.storageState({ path: authStatePath });
        try { await fs.chmod(authStatePath, 0o600); } catch { /* User-profile ACL applies on Windows. */ }
      }
      await writeJson(statePath(config, 'auth', 'last-login.json'), {
        verifiedAt: new Date().toISOString(),
        url: result.currentUrl,
        title: result.title,
        browser: executablePath,
        profilePath,
        authStatePath
      });
      console.log(`Login verified: ${result.title} (${result.currentUrl})`);
    } finally { await context.close(); }
    return;
  }
  if (command === 'discover') {
    const result = await discoverCourses(config, configPath, { auto: Boolean(options.auto), onProgress: (event) => console.log(event.message) });
    for (const course of result.courses ?? config.courses) console.log(`${course.code} ${course.title}: ${course.url ?? '未匹配'}`);
    console.log(`Discovered ${result.courses?.length ?? config.courses.length} course(s) for ${config.filters.academicYears[0]}.`);
    console.log(`Discovery evidence: ${result.runDirectory}`);
    return;
  }
  if (command === 'sync') {
    const results = await syncCourses(config, options.course || null, (event) => console.log(event.message));
    for (const result of results) {
      if (result.status === 'skipped-unavailable') {
        console.log(`${result.course.code}: skipped (not currently available in Toledo)`);
        continue;
      }
      const downloaded = result.files.filter((file) => file.status === 'downloaded').length;
      const unchanged = result.files.filter((file) => file.status === 'unchanged').length;
      const errors = result.files.filter((file) => file.status === 'error').length;
      console.log(`${result.course.code}: new ${downloaded}, unchanged ${unchanged}, errors ${errors}`);
    }
    return;
  }
  if (command === 'check') {
    const results = await syncCourses(config, options.course || null, (event) => console.log(event.message), { dryRun: true });
    for (const result of results) {
      const counts = result.files.reduce((summary, file) => { summary[file.status] = (summary[file.status] ?? 0) + 1; return summary; }, {});
      console.log(`${result.course.code}: ${counts.new ?? 0} new, ${counts.unchanged ?? 0} unchanged, ${counts['local-modified'] ?? 0} locally modified, ${counts.error ?? 0} errors`);
    }
    console.log('Check complete: no course material was written. Run sync to apply the plan.');
    return;
  }
  if (command === 'set-calendar') {
    console.log(`Stored calendar link locally: ${await setCalendarUrl(configPath)}`);
    return;
  }
  if (command === 'sync-calendar') {
    const result = await syncCalendar(config, configPath);
    console.log(`Calendar synced: ${result.eventCount} events -> ${result.outputDirectory}`);
    return;
  }
  throw new Error(`Unknown command: ${command}\n${HELP}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
