#!/usr/bin/env node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import {
  defaultConfigPath, initializeConfig, loadConfig, normalizeMaterialsLayout,
  normalizeVerificationMode, saveConfig, statePath
} from './config.mjs';
import { detectBrowser, installManagedBrowser, launchBrowser, resetBrowserSession } from './browser.mjs';
import { discoverCourses } from './discover.mjs';
import { ask, askWithDefault, choose, chooseMany, confirm } from './prompt.mjs';
import { setCalendarUrl, syncCalendar } from './calendar.mjs';
import { syncCourses } from './sync.mjs';
import { LANGUAGE_CHOICES, createTranslator, normalizeLanguage, resolveLanguage } from './cli-i18n.mjs';
import { parseArgs, writeJson } from './utils.mjs';

const { version: VERSION } = createRequire(import.meta.url)('../package.json');
const CLI_SETTINGS_PATH = path.join(os.homedir(), '.toledo-sync', 'cli-settings.json');
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let activeTranslator = createTranslator('en');

function promptLabels(t) {
  return {
    select: t('selectPrompt'),
    navigation: t('menuNavigation'),
    yes: t('yes'),
    no: t('no'),
    invalidChoice: (count) => t('invalidChoice', { count }),
    invalidConfirm: t('invalidConfirm')
  };
}

function setLanguage(context, language) {
  context.language = normalizeLanguage(language) ?? 'en';
  context.t = createTranslator(context.language);
  context.labels = promptLabels(context.t);
  activeTranslator = context.t;
}

async function readCliSettings() {
  try { return JSON.parse(await fs.readFile(CLI_SETTINGS_PATH, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

async function saveCliSettings(values) {
  const current = await readCliSettings();
  await writeJson(CLI_SETTINGS_PATH, { ...current, ...values });
}

async function waitForSuccessfulPortalLogin(page, timeoutMs = 10 * 60 * 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const currentUrl = page.url();
    const title = await page.title().catch(() => '');
    const identityProvider = /idp\.kuleuven\.be|account\.kuleuven\.be/i.test(currentUrl);
    const portal = /\/portal(?:\/|$)|\/ultra(?:\/|$)/i.test(currentUrl) || /blackboard|toledo portal/i.test(title);
    if (!identityProvider && portal) return { currentUrl, title };
    await delay(1000);
  }
  throw new Error('Timed out waiting for Toledo login. The browser session was kept for another attempt.');
}

function helpText(t) {
  return `${t('appTitle')} ${VERSION}

Usage:
  toledo-sync                         Interactive setup and update flow
  toledo-sync interactive [--config <config.json>]
  toledo-sync doctor
  toledo-sync install-browser firefox
  toledo-sync init --vault <vault> --output <download-root>
                   [--materials-in-course | --materials-subdirectory <name>]
                   [--verification sha256|filename] [--browser <path|firefox>]
                   [--language en|zh|nl]
  toledo-sync configure --config <config.json> [options]
  toledo-sync login --config <config.json> [--fresh]
  toledo-sync reset-browser --config <config.json>
  toledo-sync discover --config <config.json>
  toledo-sync list --config <config.json>
  toledo-sync check --config <config.json> [--course <code>]
  toledo-sync sync --config <config.json> [--course <code>]
  toledo-sync watch --config <config.json> [--interval <minutes>] [--apply]
  toledo-sync set-calendar --config <config.json>
  toledo-sync sync-calendar --config <config.json>

Global options:
  --language en|zh|nl       Interface language (or TOLEDO_LANG)
  --browser <path|firefox>  Chromium-based executable or Playwright Firefox
  --config <path>           Existing Toledo Sync configuration

${t('copyrightShort')}`;
}

function headlessConfig(config) {
  return {
    ...config,
    filters: { ...config.filters, academicYears: [] },
    browser: { ...config.browser, headless: true }
  };
}

function layoutOptions(options) {
  if (options['materials-in-course'] && options['materials-subdirectory']) {
    throw new Error('Choose either --materials-in-course or --materials-subdirectory, not both.');
  }
  if (options['materials-in-course']) return { materialsPlacement: 'course-root' };
  if (options['materials-subdirectory']) {
    return { materialsPlacement: 'subdirectory', materialsFolderName: String(options['materials-subdirectory']) };
  }
  return {};
}

function availableCourse(course) {
  return Boolean(course.url) && course.available !== false;
}

async function authenticated(config) {
  try {
    await fs.access(statePath(config, 'auth', 'last-login.json'));
    return true;
  } catch { return false; }
}

async function runLogin(config, context, { fresh = false } = {}) {
  if (fresh) {
    await resetBrowserSession(config, { lastLoginPath: statePath(config, 'auth', 'last-login.json') });
  }
  const loginConfig = { ...config, browser: { ...config.browser, headless: false } };
  const { context: browserContext, executablePath, profilePath, authStatePath } = await launchBrowser(loginConfig);
  try {
    const page = browserContext.pages()[0] ?? await browserContext.newPage();
    await page.goto('https://toledo.kuleuven.be/', { waitUntil: 'domcontentloaded' });
    const loginLink = page.locator('a[href="/portal/"], a[href="/portal"]').first();
    if (await loginLink.count()) await loginLink.click();
    else await page.goto(config.portalUrl, { waitUntil: 'domcontentloaded' });
    console.log(context.t('browserLine', { path: executablePath }));
    console.log(context.t('loginInstruction'));
    const result = await waitForSuccessfulPortalLogin(page);
    if (authStatePath) {
      await browserContext.storageState({ path: authStatePath });
      try { await fs.chmod(authStatePath, 0o600); } catch { /* Platform ACL may apply. */ }
    }
    await writeJson(statePath(config, 'auth', 'last-login.json'), {
      verifiedAt: new Date().toISOString(), url: result.currentUrl, title: result.title,
      browser: executablePath, profilePath, authStatePath
    });
    console.log(context.t('loginSuccess', { title: result.title || 'Toledo' }));
  } finally {
    await browserContext.close();
  }
}

async function runDiscovery(config, configPath, context) {
  config.filters = { ...(config.filters ?? {}), academicYears: [] };
  await saveConfig(configPath, config);
  const result = await discoverCourses(headlessConfig(config), configPath, {
    auto: true,
    allCourses: true,
    ignoreAcademicYear: true,
    onProgress: (event) => console.log(`  ${event.message}`)
  });
  console.log(context.t('courseDiscoveryDone'));
  return result;
}

function printCourseList(config, context) {
  console.log(`\n${context.t('coursesTitle')}`);
  config.courses.forEach((course, index) => {
    const usable = availableCourse(course);
    const marker = course.selected && usable ? '[x]' : '[ ]';
    const availability = usable ? context.t('courseAvailable') : context.t('courseUnavailable');
    const year = course.academicYear ? ` · ${course.academicYear}` : '';
    console.log(`  ${String(index + 1).padStart(2, ' ')}. ${marker} ${course.code} ${course.title} · ${availability}${year}`);
  });
}

async function selectCourses(config, configPath, context) {
  if (!config.courses.length) {
    console.log(context.t('noCourses'));
    return;
  }
  const usableCourses = config.courses.filter(availableCourse);
  let selectedCodes;
  if (process.stdin.isTTY && process.stdout.isTTY) {
    const choices = config.courses.map((course) => {
      const availability = course.available === false ? context.t('courseUnavailable') : context.t('courseAvailable');
      const year = course.academicYear ? ` · ${course.academicYear}` : '';
      return {
        value: course.code.toUpperCase(),
        label: `${course.code} ${course.title} · ${availability}${year}`,
        disabled: !availableCourse(course)
      };
    });
    selectedCodes = await chooseMany(context.t('selectionQuestion'), choices,
      usableCourses.filter((course) => course.selected).map((course) => course.code.toUpperCase()),
      {
        multiSelectHelp: context.t('multiSelectHelp'),
        selectedCount: (count) => context.t('selectedCount', { count }),
        unavailable: context.t('courseUnavailable')
      });
    if (selectedCodes === null) return;
  } else {
    printCourseList(config, context);
    console.log(`\n${context.t('selectionHelp')}`);
    const raw = (await ask(`${context.t('selectionQuestion')}: `)).trim();
    if (!raw) return;
    const normalized = raw.toLowerCase();
    if (['all', '全部', 'alles'].includes(normalized)) {
      selectedCodes = new Set(usableCourses.map((course) => course.code.toUpperCase()));
    } else if (['none', '无', 'geen'].includes(normalized)) {
      selectedCodes = new Set();
    } else {
      selectedCodes = new Set();
      const unknown = [];
      for (const token of raw.split(',').map((value) => value.trim()).filter(Boolean)) {
        const course = /^\d+$/.test(token)
          ? config.courses[Number(token) - 1]
          : config.courses.find((item) => item.code.toUpperCase() === token.toUpperCase());
        if (!course || !availableCourse(course)) unknown.push(token);
        else selectedCodes.add(course.code.toUpperCase());
      }
      if (unknown.length) throw new Error(context.t('selectionInvalid', { values: unknown.join(', ') }));
    }
  }
  for (const course of config.courses) {
    course.selected = availableCourse(course) && selectedCodes.has(course.code.toUpperCase());
  }
  await saveConfig(configPath, config);
  console.log(context.t('selectionSaved', { count: selectedCodes.size }));
}

function fileStatusLabel(status, t) {
  if (status === 'new' || status === 'downloaded') return t('statusNew');
  if (status === 'unchanged') return t('statusUnchanged');
  if (status === 'local-modified') return t('statusModified');
  if (status === 'error' || status === 'skipped-non-file') return t('statusError');
  if (status === 'skipped' || status === 'kept-local') return t('statusSkipped');
  return t('statusOther');
}

function updateCounts(results) {
  const files = results.flatMap((result) => result.files ?? []);
  return {
    newCount: files.filter((file) => file.status === 'new' || file.status === 'downloaded').length,
    unchanged: files.filter((file) => file.status === 'unchanged').length,
    modified: files.filter((file) => file.status === 'local-modified').length,
    errors: results.filter(result => result.status === 'scan-error').length + files.filter((file) => file.status === 'error' || file.status === 'skipped-non-file').length
  };
}

export function formatUpdateTree(results, t = createTranslator('en')) {
  const lines = [t('fileTree')];
  for (const result of results) {
    lines.push('', `${result.course.code} ${result.course.title}`);
    if (result.status === 'scan-error') { lines.push(`  └─ ${t('statusError')}: ${result.error}`); continue; }
    const files = [...(result.files ?? [])].sort((left, right) => String(left.file ?? left.url).localeCompare(String(right.file ?? right.url)));
    if (!files.length) {
      lines.push(`  └─ ${t('noUpdates')}`);
      continue;
    }
    files.forEach((file, index) => {
      const branch = index === files.length - 1 ? '└─' : '├─';
      lines.push(`  ${branch} [${fileStatusLabel(file.status, t)}] ${file.file || file.url || 'material'}`);
    });
  }
  return lines.join('\n');
}

async function collectFileDecisions(results, context) {
  const actionable = results.flatMap((result) => (result.files ?? []).map((file) => ({ ...file, course: result.course })))
    .filter((file) => file.status === 'new' || file.status === 'local-modified');
  if (!actionable.length) return {};
  const hasConflicts = actionable.some((file) => file.status === 'local-modified');
  if (!await confirm(context.t('reviewDecisions'), hasConflicts, context.labels)) return {};
  const decisions = {};
  for (const file of actionable) {
    const label = `${file.course.code} · ${file.file || file.url || 'material'}`;
    if (file.status === 'new') {
      const action = await choose(context.t('newFileDecision', { file: label }), [
        { label: context.t('download'), value: 'download' },
        { label: context.t('skip'), value: 'skip' }
      ], 0, context.labels);
      if (action === 'skip') decisions[file.decisionKey] = 'skip';
      continue;
    }
    decisions[file.decisionKey] = await choose(context.t('conflictDecision', { file: label }), [
      { label: context.t('preserveCopy'), value: 'preserve-copy' },
      { label: context.t('keepLocal'), value: 'keep-local' },
      { label: context.t('replaceRemote'), value: 'replace' },
      { label: context.t('skip'), value: 'skip' }
    ], 0, context.labels);
  }
  return decisions;
}

async function checkAndApply(config, selectedCode, context, { apply = true } = {}) {
  const selected = config.courses.filter((course) => course.selected && availableCourse(course));
  if (!selectedCode && !selected.length) throw new Error(context.t('noSelectedCourses'));
  console.log(context.t('checking'));
  const results = await syncCourses(headlessConfig(config), selectedCode, (event) => console.log(`  ${event.message}`), { dryRun: true });
  console.log(`\n${formatUpdateTree(results, context.t)}`);
  const counts = updateCounts(results);
  console.log(`\n${context.t('summary', counts)}`);
  console.log(context.t('checkComplete'));
  if (!apply || (!counts.newCount && !counts.modified)) return results;
  const decisions = await collectFileDecisions(results, context);
  if (Object.values(decisions).includes('replace')
      && !await confirm(context.t('replaceWarning'), false, context.labels)) return results;
  if (!await confirm(context.t('applyUpdates'), true, context.labels)) return results;
  const applied = await syncCourses(headlessConfig(config), selectedCode, (event) => console.log(`  ${event.message}`), { decisions });
  console.log(context.t('updatesApplied'));
  return applied;
}

export function normalizeWatchInterval(value) {
  const minutes = Number(value ?? 60);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
    throw new Error('Watch interval must be a whole number from 1 to 1440 minutes.');
  }
  return minutes;
}

function enabledOption(value) {
  return value === true || ['1', 'true', 'yes', 'on'].includes(String(value ?? '').toLowerCase());
}

async function waitForNextCycle(milliseconds, stop) {
  const deadline = Date.now() + milliseconds;
  while (!stop.requested && Date.now() < deadline) {
    await delay(Math.min(1000, deadline - Date.now()));
  }
}

async function runMonitor(config, configPath, context, { intervalMinutes = 60, apply = false, once = false } = {}) {
  const interval = normalizeWatchInterval(intervalMinutes);
  if (!config.courses.some((course) => course.selected && availableCourse(course))) {
    throw new Error(context.t('noSelectedCourses'));
  }
  const stop = { requested: false };
  const stopHandler = () => { stop.requested = true; };
  process.on('SIGINT', stopHandler);
  console.log(context.t('monitorStarted'));
  try {
    do {
      console.log(`\n${context.t('monitorCycle', { time: new Date().toLocaleString() })}`);
      try {
        await runDiscovery(config, configPath, context);
        ({ config } = await loadConfig(configPath));
        const results = await syncCourses(headlessConfig(config), null, (event) => console.log(`  ${event.message}`), { dryRun: true });
        const counts = updateCounts(results);
        console.log(context.t('summary', counts));
        if (apply && (counts.newCount || counts.modified)) {
          await syncCourses(headlessConfig(config), null, (event) => console.log(`  ${event.message}`));
          console.log(context.t('updatesApplied'));
        }
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
      if (once || stop.requested) break;
      await waitForNextCycle(interval * 60 * 1000, stop);
    } while (!stop.requested);
  } finally {
    process.removeListener('SIGINT', stopHandler);
  }
  console.log(context.t('monitorStopped'));
  return config;
}

async function settingsMenu(config, configPath, context) {
  const action = await choose(context.t('settingsQuestion'), [
    { label: context.t('changeOutput'), value: 'output' },
    { label: context.t('changeLayout'), value: 'layout' },
    { label: context.t('changeVerification'), value: 'verification' },
    { label: context.t('changeBrowser'), value: 'browser' },
    { label: context.t('languageQuestion'), value: 'language' },
    { label: context.t('back'), value: 'back' }
  ], 5, context.labels);
  if (action === 'back') return;
  if (action === 'output') {
    config.download.outputRoot = path.resolve(await askWithDefault(context.t('downloadRoot'), config.download.outputRoot));
  } else if (action === 'layout') {
    const placement = await choose(context.t('materialLayout'), [
      { label: context.t('directLayout'), value: 'course-root' },
      { label: context.t('subdirectoryLayout'), value: 'subdirectory' }
    ], config.download.materialsPlacement === 'course-root' ? 0 : 1, context.labels);
    const folderName = placement === 'subdirectory'
      ? await askWithDefault(context.t('materialsFolderName'), config.download.materialsFolderName || 'Materials')
      : config.download.materialsFolderName;
    Object.assign(config.download, normalizeMaterialsLayout({ materialsPlacement: placement, materialsFolderName: folderName }));
  } else if (action === 'verification') {
    config.sync.verificationMode = await choose(context.t('verificationMode'), [
      { label: context.t('sha256Mode'), value: 'sha256' },
      { label: context.t('filenameMode'), value: 'filename' }
    ], config.sync.verificationMode === 'filename' ? 1 : 0, context.labels);
  } else if (action === 'browser') {
    const current = config.browser.type === 'firefox' ? 'firefox' : config.browser.executablePath || context.t('autoDetect');
    const value = (await ask(`${context.t('browserPath')} [${current}]: `)).trim();
    if (value) setBrowserOption(config, value);
  } else if (action === 'language') {
    const language = await choose(context.t('languageQuestion'), LANGUAGE_CHOICES, LANGUAGE_CHOICES.findIndex((item) => item.value === context.language), context.labels);
    setLanguage(context, language);
    config.ui = { ...(config.ui ?? {}), language };
    await saveCliSettings({ language });
  }
  await saveConfig(configPath, config);
  console.log(context.t('settingsSaved'));
}

function printStatus(config, signedIn, context) {
  const available = config.courses.filter(availableCourse).length;
  const selected = config.courses.filter((course) => course.selected && availableCourse(course)).length;
  console.log(`\n${context.t('status')}: ${signedIn ? context.t('statusSignedIn') : context.t('statusSignInRequired')} · ${context.t('statusCourses', { selected, available, total: config.courses.length })}`);
}

async function initializeInteractiveConfig(configPath, context) {
  const vault = await askWithDefault(context.t('vaultPath'), process.cwd());
  const resolvedConfigPath = configPath ?? defaultConfigPath(vault);
  try {
    const loaded = await loadConfig(resolvedConfigPath);
    return loaded;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const outputRoot = await askWithDefault(context.t('downloadRoot'), path.join(path.resolve(vault), 'Toledo courses'));
  const placement = await choose(context.t('materialLayout'), [
    { label: context.t('directLayout'), value: 'course-root' },
    { label: context.t('subdirectoryLayout'), value: 'subdirectory' }
  ], 1, context.labels);
  const materialsFolderName = placement === 'subdirectory'
    ? await askWithDefault(context.t('materialsFolderName'), 'Materials') : undefined;
  const verificationMode = await choose(context.t('verificationMode'), [
    { label: context.t('sha256Mode'), value: 'sha256' },
    { label: context.t('filenameMode'), value: 'filename' }
  ], 0, context.labels);
  const created = await initializeConfig(vault, resolvedConfigPath, {
    outputRoot, academicYear: '', selectedCodes: [], courseCatalog: [], language: context.language,
    materialsPlacement: placement, materialsFolderName, verificationMode
  });
  console.log(context.t('configCreated', { path: created.configPath }));
  console.log(context.t('copyrightShort'));
  return created;
}

async function runInteractive(options, settings, context) {
  let configPath = options.config ? path.resolve(String(options.config)) : settings.configPath ? path.resolve(settings.configPath) : null;
  let loaded = null;
  if (configPath) {
    try { loaded = await loadConfig(configPath); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      if (!options.config) configPath = null;
    }
  }
  if (!loaded) loaded = await initializeInteractiveConfig(configPath, context);
  let { config } = loaded;
  configPath = loaded.configPath;
  config.filters = { ...(config.filters ?? {}), academicYears: [] };
  config.ui = { ...(config.ui ?? {}), language: context.language };
  if (options.browser) setBrowserOption(config, options.browser);
  await saveConfig(configPath, config);
  await saveCliSettings({ configPath, language: context.language });

  console.log(`\n${context.t('appTitle')} ${VERSION}`);
  console.log(context.t('tagline'));
  while (true) {
    const signedIn = await authenticated(config);
    printStatus(config, signedIn, context);
    const defaultIndex = !signedIn ? 0 : !config.courses.some(availableCourse) ? 1 : 3;
    const action = await choose(context.t('mainQuestion'), [
      { label: context.t('signIn'), value: 'login' },
      { label: context.t('discoverCourses'), value: 'discover' },
      { label: context.t('selectCourses'), value: 'select' },
      { label: context.t('checkUpdates'), value: 'check' },
      { label: context.t('monitorUpdates'), value: 'monitor' },
      { label: context.t('settings'), value: 'settings' },
      { label: context.t('resetBrowser'), value: 'reset' },
      { label: context.t('exit'), value: 'exit' }
    ], defaultIndex, context.labels);
    if (action === 'exit') break;
    try {
      if (action === 'login') {
        await runLogin(config, context);
        if (await confirm(context.t('discoverAfterLogin'), true, context.labels)) {
          await runDiscovery(config, configPath, context);
          ({ config } = await loadConfig(configPath));
          await selectCourses(config, configPath, context);
        }
      } else if (action === 'discover') {
        if (!signedIn) {
          console.log(context.t('statusSignInRequired'));
          continue;
        }
        await runDiscovery(config, configPath, context);
        ({ config } = await loadConfig(configPath));
        await selectCourses(config, configPath, context);
      } else if (action === 'select') {
        await selectCourses(config, configPath, context);
      } else if (action === 'check') {
        if (!signedIn) {
          console.log(context.t('statusSignInRequired'));
          continue;
        }
        await checkAndApply(config, null, context);
      } else if (action === 'monitor') {
        if (!signedIn) {
          console.log(context.t('statusSignInRequired'));
          continue;
        }
        const intervalMinutes = await choose(context.t('monitorInterval'), [
          { label: context.t('interval30'), value: 30 },
          { label: context.t('interval60'), value: 60 },
          { label: context.t('interval360'), value: 360 },
          { label: context.t('interval1440'), value: 1440 }
        ], 1, context.labels);
        const apply = await confirm(context.t('monitorApply'), false, context.labels);
        config = await runMonitor(config, configPath, context, { intervalMinutes, apply });
      } else if (action === 'settings') {
        await settingsMenu(config, configPath, context);
        await saveCliSettings({ configPath, language: context.language });
      } else if (action === 'reset') {
        if (await confirm(context.t('resetConfirm'), false, context.labels)) {
          await resetBrowserSession(config, { lastLoginPath: statePath(config, 'auth', 'last-login.json') });
          console.log(context.t('resetDone'));
        }
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
  console.log(context.t('done'));
}

function printConfig(config, configPath, context) {
  console.log(context.t('updatedConfig', { path: configPath }));
  console.log(context.t('downloadDirectory', { path: config.download.outputRoot }));
  console.log(config.download.materialsPlacement === 'course-root'
    ? context.t('materialsDirect')
    : context.t('materialsNested', { name: config.download.materialsFolderName }));
  console.log(context.t('verificationValue', { mode: config.sync.verificationMode }));
  console.log(context.t('selectedValue', {
    courses: config.courses.filter((course) => course.selected).map((course) => course.code).join(', ') || context.t('none')
  }));
}

async function chooseInitialLanguage(options, settings, interactive) {
  const explicit = options.language ?? options.lang ?? process.env.TOLEDO_LANG;
  if (explicit) return resolveLanguage(explicit);
  if (settings.language) return resolveLanguage(settings.language);
  if (!interactive) return resolveLanguage(process.env.LC_ALL, process.env.LANG, 'en');
  return choose('Language / 语言 / Taal', LANGUAGE_CHOICES, 0, {
    select: 'Select / 选择 / Kies',
    navigation: '↑/↓ move · Enter choose',
    invalidChoice: (count) => `Enter a number from 1 to ${count}.`
  });
}

function setBrowserOption(config, value) {
  const browser = String(value).trim();
  if (browser.toLowerCase() === 'firefox') {
    config.browser.type = 'firefox';
    config.browser.executablePath = null;
    return;
  }
  config.browser.type = null;
  config.browser.executablePath = ['auto', '自动', 'automatisch'].includes(browser.toLowerCase())
    ? null
    : path.resolve(browser);
}

export async function runCli(argv = process.argv.slice(2)) {
  const { positional, options } = parseArgs(argv);
  const command = positional[0];
  const interactive = !command || command === 'interactive';
  const settings = await readCliSettings();
  const context = { language: 'en', t: activeTranslator, labels: promptLabels(activeTranslator) };
  setLanguage(context, await chooseInitialLanguage(options, settings, interactive));

  if (command === 'help' || options.help) {
    console.log(helpText(context.t));
    return;
  }
  if (command === 'doctor') {
    console.log(context.t('doctorTitle'));
    console.log(context.t('doctorPlatform', { platform: `${process.platform} ${process.arch}` }));
    console.log(context.t('doctorNode', { version: process.version }));
    try {
      console.log(context.t('doctorBrowser', { path: await detectBrowser(options.browser) }));
    } catch {
      console.log(context.t('doctorBrowserMissing'));
      console.log(context.t('doctorHint'));
      process.exitCode = 1;
    }
    return;
  }
  if (command === 'install-browser') {
    const browserName = String(positional[1] ?? '').toLowerCase();
    if (browserName !== 'firefox') throw new Error('Usage: toledo-sync install-browser firefox');
    console.log('Installing the Playwright-compatible Firefox build…');
    const result = await installManagedBrowser(browserName);
    console.log(result.installed ? `Firefox is ready: ${result.executablePath}` : `Firefox is already installed: ${result.executablePath}`);
    return;
  }
  if (interactive) {
    await runInteractive(options, settings, context);
    return;
  }
  if (command === 'init') {
    if (!options.vault) throw new Error('init requires --vault <path>');
    if (!options.output) throw new Error('init requires --output <download-root>');
    const selectedCodes = options.courses
      ? String(options.courses).split(',').map((value) => value.trim()).filter(Boolean)
      : [];
    const result = await initializeConfig(options.vault, options.config && path.resolve(String(options.config)), {
      outputRoot: options.output,
      academicYear: '',
      selectedCodes,
      courseCatalog: selectedCodes.length ? undefined : [],
      language: context.language,
      ...layoutOptions(options),
      verificationMode: normalizeVerificationMode(options.verification)
    });
    if (options.browser) {
      setBrowserOption(result.config, options.browser);
      await saveConfig(result.configPath, result.config);
    }
    await saveCliSettings({ configPath: result.configPath, language: context.language });
    console.log(context.t('configCreated', { path: result.configPath }));
    printConfig(result.config, result.configPath, context);
    return;
  }

  const requestedConfig = options.config ?? settings.configPath;
  if (!requestedConfig) throw new Error(context.t('configRequired'));
  let { config, configPath } = await loadConfig(requestedConfig);
  if (!options.language && !options.lang && !process.env.TOLEDO_LANG && config.ui?.language) {
    setLanguage(context, config.ui.language);
  }
  config.filters = { ...(config.filters ?? {}), academicYears: [] };
  if (options.browser) setBrowserOption(config, options.browser);
  await saveCliSettings({ configPath, language: context.language });

  if (command === 'configure') {
    if (options.output) config.download.outputRoot = path.resolve(String(options.output));
    if (options['materials-in-course'] || options['materials-subdirectory']) {
      Object.assign(config.download, normalizeMaterialsLayout({ ...config.download, ...layoutOptions(options) }));
    }
    if (options.verification) config.sync.verificationMode = normalizeVerificationMode(options.verification);
    if (options.language || options.lang) {
      const language = resolveLanguage(options.language ?? options.lang);
      config.ui = { ...(config.ui ?? {}), language };
      setLanguage(context, language);
    }
    if (options.courses) {
      const selected = new Set(String(options.courses).split(',').map((value) => value.trim().toUpperCase()).filter(Boolean));
      const unknown = [...selected].filter((code) => !config.courses.some((course) => course.code.toUpperCase() === code && availableCourse(course)));
      if (unknown.length) throw new Error(context.t('selectionInvalid', { values: unknown.join(', ') }));
      for (const course of config.courses) course.selected = availableCourse(course) && selected.has(course.code.toUpperCase());
    }
    await saveConfig(configPath, config);
    await saveCliSettings({ configPath, language: context.language });
    printConfig(config, configPath, context);
    return;
  }
  if (command === 'list') {
    printCourseList(config, context);
    return;
  }
  if (command === 'login') {
    await runLogin(config, context, { fresh: Boolean(options.fresh) });
    return;
  }
  if (command === 'reset-browser') {
    await resetBrowserSession(config, { lastLoginPath: statePath(config, 'auth', 'last-login.json') });
    console.log(context.t('resetCommandDone'));
    return;
  }
  if (command === 'discover') {
    await runDiscovery(config, configPath, context);
    ({ config } = await loadConfig(configPath));
    printCourseList(config, context);
    return;
  }
  if (command === 'check') {
    await checkAndApply(config, options.course || null, context, { apply: false });
    return;
  }
  if (command === 'sync') {
    const results = await syncCourses(headlessConfig(config), options.course || null, (event) => console.log(event.message));
    console.log(formatUpdateTree(results, context.t));
    return;
  }
  if (command === 'watch') {
    if (!await authenticated(config)) throw new Error(context.t('statusSignInRequired'));
    await runMonitor(config, configPath, context, {
      intervalMinutes: options.interval ?? 60,
      apply: enabledOption(options.apply),
      once: enabledOption(options.once)
    });
    return;
  }
  if (command === 'set-calendar') {
    console.log(`Calendar link: ${await setCalendarUrl(configPath)}`);
    return;
  }
  if (command === 'sync-calendar') {
    const result = await syncCalendar(config, configPath);
    console.log(`Calendar: ${result.eventCount} events → ${result.outputDirectory}`);
    return;
  }
  throw new Error(`Unknown command: ${command}\n\n${helpText(context.t)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runCli().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  });
}
