import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { defaultConfigPath, initializeConfig, loadConfig, normalizeMaterialsLayout, saveConfig, statePath } from '../src/config.mjs';
import { FALL_2026_COURSES } from '../src/constants.mjs';
import { browserChoice, setBrowserChoice, installManagedBrowser, launchBrowser, resetBrowserSession as resetManagedBrowserSession } from '../src/browser.mjs';
import { linuxAutostartEntry, linuxAutostartPath } from '../src/linux-desktop.mjs';
import { discoverCourses } from '../src/discover.mjs';
import { syncCourses } from '../src/sync.mjs';
import { writeJson } from '../src/utils.mjs';

let mainWindow;
let automationTimer = null;
let automationRunning = false;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const settingsPath = () => path.join(app.getPath('userData'), 'settings.json');

async function readSettings() {
  try { return JSON.parse(await fs.readFile(settingsPath(), 'utf8')); } catch { return {}; }
}

async function saveSettings(settings) {
  await fs.mkdir(path.dirname(settingsPath()), { recursive: true });
  const existing = await readSettings();
  await fs.writeFile(settingsPath(), `${JSON.stringify({ ...existing, ...settings }, null, 2)}\n`, 'utf8');
}

function normalizeAutomation(settings = {}) {
  const allowedIntervals = [0, 30, 60, 360, 1440];
  const periodicCheckMinutes = Number(settings.periodicCheckMinutes);
  return {
    autoStart: Boolean(settings.autoStart),
    autoCheckOnLaunch: Boolean(settings.autoCheckOnLaunch),
    periodicCheckMinutes: allowedIntervals.includes(periodicCheckMinutes) ? periodicCheckMinutes : 0
  };
}

function notify(type, message) {
  mainWindow?.webContents.send('toledo:event', { type, message, at: new Date().toISOString() });
}

function updateSummary(results) {
  return results.map((result) => ({
    code: result.course.code,
    title: result.course.title,
    status: result.status,
    error: result.error,
    newCount: result.files.filter((file) => file.status === 'new' || file.status === 'downloaded').length,
    unchangedCount: result.files.filter((file) => file.status === 'unchanged').length,
    localModifiedCount: result.files.filter((file) => file.status === 'local-modified').length,
    keptCount: result.files.filter((file) => file.status === 'kept-local').length,
    skippedCount: result.files.filter((file) => file.status === 'skipped').length,
    errorCount: (result.status === 'scan-error' ? 1 : 0) + result.files.filter((file) => file.status === 'error' || file.status === 'skipped-non-file').length,
    files: result.files.map((file) => ({
      ...file,
      decisionKey: file.decisionKey ?? `${result.course.code}|${file.url ?? ''}`
    }))
  }));
}

function present(config, configPath, authenticated = false, automation = {}) {
  return {
    configPath,
    vaultPath: config.vaultPath,
    outputRoot: config.download.outputRoot,
    materialsPlacement: config.download.materialsPlacement,
    materialsFolderName: config.download.materialsFolderName,
    authenticated,
    browserChoice: browserChoice(config),
    ...normalizeAutomation(automation),
    academicYear: '',
    verificationMode: config.sync?.verificationMode ?? 'sha256',
    courses: config.courses.map((course) => ({
      code: course.code, title: course.title, selected: course.selected,
      discovered: Boolean(course.url), available: course.available !== false && Boolean(course.url), academicYear: course.academicYear
    }))
  };
}

async function currentConfig() {
  const settings = await readSettings();
  if (!settings.configPath) return null;
  const { config, configPath } = await loadConfig(settings.configPath);
  let authenticated = false;
  try { await fs.access(statePath(config, 'auth', 'last-login.json')); authenticated = true; } catch { /* Login has not been verified yet. */ }
  return { config, configPath, authenticated, automation: normalizeAutomation(settings) };
}

async function waitForSuccessfulPortalLogin(page, timeoutMs = 10 * 60 * 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const url = page.url();
    const title = await page.title().catch(() => '');
    const identityProvider = /idp\.kuleuven\.be|account\.kuleuven\.be/i.test(url);
    const portal = /\/portal(?:\/|$)|\/ultra(?:\/|$)/i.test(url) || /blackboard|toledo portal/i.test(title);
    if (!identityProvider && portal) return { url, title };
    await delay(1000);
  }
  throw new Error('Timed out waiting for Toledo login. Please try again.');
}

function ensureDesktopPlatform() {
  if (!['win32', 'linux', 'darwin'].includes(process.platform)) {
    throw new Error('The desktop app supports Windows, macOS, and Linux.');
  }
}

function unrestrictedDesktopConfig(config) {
  return { ...config, filters: { ...config.filters, academicYears: [] } };
}

async function updateConfig({ vaultPath, outputRoot, academicYear, selectedCodes = [], materialsPlacement, materialsFolderName, verificationMode, autoStart, autoCheckOnLaunch, periodicCheckMinutes, browserChoice: requestedBrowser }) {
  ensureDesktopPlatform();
  if (!vaultPath || !outputRoot) throw new Error('Choose both the Obsidian Vault and the download root.');
  const configPath = defaultConfigPath(vaultPath);
  let config;
  let authenticated = false;
  try {
    ({ config } = await loadConfig(configPath));
    try { await fs.access(statePath(config, 'auth', 'last-login.json')); authenticated = true; } catch { /* Login is still required. */ }
    config.download.outputRoot = path.resolve(outputRoot);
    Object.assign(config.download, normalizeMaterialsLayout({ materialsPlacement, materialsFolderName }));
    config.sync.verificationMode = verificationMode === 'filename' ? 'filename' : 'sha256';
    const previousAcademicYear = config.filters.academicYears[0] ?? '';
    // The desktop workflow always discovers the complete Toledo course list.
    // Users choose courses after discovery; the year filter remains a CLI-only
    // compatibility setting.
    config.filters.academicYears = [];
    if (previousAcademicYear !== '') {
      config.courses = [];
    } else {
      for (const course of config.courses) {
        course.selected = selectedCodes.includes(course.code);
      }
    }
    await saveConfig(configPath, config);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const initialSelectedCodes = process.platform === 'linux' ? [] : selectedCodes.length ? selectedCodes : FALL_2026_COURSES.map((course) => course.code);
    ({ config } = await initializeConfig(vaultPath, configPath, { outputRoot, academicYear: '', selectedCodes: initialSelectedCodes, ...(process.platform === 'linux' ? { courseCatalog: [] } : {}), materialsPlacement, materialsFolderName, verificationMode }));
  }
  if (process.platform === 'linux' && requestedBrowser && requestedBrowser !== 'custom'
      && requestedBrowser !== browserChoice(config)) {
    setBrowserChoice(config, requestedBrowser);
    await saveConfig(configPath, config);
    await fs.rm(statePath(config, 'auth', 'last-login.json'), { force: true });
    authenticated = false;
  }
  const automation = normalizeAutomation({ autoStart, autoCheckOnLaunch, periodicCheckMinutes });
  await saveSettings({ configPath, ...automation });
  await configureAutomation(automation);
  return present(config, configPath, authenticated, automation);
}

async function startLogin() {
  ensureDesktopPlatform();
  const current = await currentConfig();
  if (!current) throw new Error('Save the initial settings first.');
  const loginConfig = { ...current.config, browser: { ...current.config.browser, headless: false } };
  notify('info', 'A browser window has opened for KU Leuven SSO/MFA.');
  const { context, executablePath, profilePath, authStatePath } = await launchBrowser(loginConfig);
  try {
    const page = context.pages()[0] ?? await context.newPage();
    await page.goto('https://toledo.kuleuven.be/', { waitUntil: 'domcontentloaded' });
    const portalLink = page.locator('a[href="/portal/"], a[href="/portal"]').first();
    if (await portalLink.count()) await portalLink.click();
    else await page.goto(loginConfig.portalUrl, { waitUntil: 'domcontentloaded' });
    const result = await waitForSuccessfulPortalLogin(page);
    if (authStatePath) {
      await context.storageState({ path: authStatePath });
      try { await fs.chmod(authStatePath, 0o600); } catch { /* Platform ACL may apply. */ }
    }
    await writeJson(statePath(loginConfig, 'auth', 'last-login.json'), {
      verifiedAt: new Date().toISOString(), url: result.url, title: result.title, browser: executablePath, profilePath, authStatePath
    });
    notify('success', 'Toledo login verified.');
    return { title: result.title, url: result.url, authenticated: true };
  } finally { await context.close(); }
}

async function resetBrowserSession() {
  ensureDesktopPlatform();
  const current = await currentConfig();
  if (!current) throw new Error('Save the initial settings first.');
  await resetManagedBrowserSession(current.config, { lastLoginPath: statePath(current.config, 'auth', 'last-login.json') });
  notify('success', 'Browser session reset. Sign in to Toledo again.');
  return { authenticated: false, reset: true };
}

function registerIpc() {
  ipcMain.handle('app:initial', async () => {
    const current = await currentConfig();
    return { platform: process.platform, config: current ? present(current.config, current.configPath, current.authenticated, current.automation) : null };
  });
  ipcMain.handle('dialog:directory', async (_event, title) => {
    const result = await dialog.showOpenDialog(mainWindow, { title, properties: ['openDirectory', 'createDirectory'] });
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle('config:save', async (_event, values) => updateConfig(values));
  ipcMain.handle('toledo:login', async () => startLogin());
  ipcMain.handle('browser:reset', async () => resetBrowserSession());
  ipcMain.handle('browser:install', async (_event, name) => {
    if (process.platform !== 'linux') throw new Error('Browser installation is available in the Linux app.');
    if (!['chromium', 'firefox'].includes(name)) throw new Error('Choose Chromium or Firefox.');
    const current = await currentConfig();
    if (!current) throw new Error('Save the initial settings first.');
    notify('progress', `Preparing ${name}…`);
    await installManagedBrowser(name, { onProgress: message => notify('progress', message.trim()) });
    if (browserChoice(current.config) !== name) {
      setBrowserChoice(current.config, name);
      await saveConfig(current.configPath, current.config);
      await fs.rm(statePath(current.config, 'auth', 'last-login.json'), { force: true });
      current.authenticated = false;
    }
    notify('success', `${name} is ready.`);
    return present(current.config, current.configPath, current.authenticated, current.automation);
  });
  ipcMain.handle('toledo:discover', async () => {
    const current = await currentConfig();
    if (!current) throw new Error('Save the initial settings first.');
    notify('info', 'Discovering programme courses…');
    const result = await discoverCourses({ ...unrestrictedDesktopConfig(current.config), browser: { ...current.config.browser, headless: true } }, current.configPath, { auto: true, allCourses: true, ignoreAcademicYear: true, onProgress: (event) => notify('progress', event.message) });
    const refreshed = await loadConfig(current.configPath);
    notify('success', 'Course discovery finished.');
    return { config: present(refreshed.config, refreshed.configPath, current.authenticated, current.automation), matches: result.matches };
  });
  function configWithSelection(config, selectedCodes) {
    if (!Array.isArray(selectedCodes)) return config;
    const selected = new Set(selectedCodes);
    return { ...config, courses: config.courses.map((course) => ({ ...course, selected: course.available !== false && Boolean(course.url) && selected.has(course.code) })) };
  }
  ipcMain.handle('toledo:sync', async (_event, request = {}) => {
    const { courseCode = null, selectedCodes = null } = request || {};
    const current = await currentConfig();
    if (!current) throw new Error('Save the initial settings first.');
    notify('info', courseCode ? `Syncing ${courseCode}…` : 'Syncing selected courses…');
    const result = await syncCourses({ ...unrestrictedDesktopConfig(configWithSelection(current.config, selectedCodes)), browser: { ...current.config.browser, headless: true } }, courseCode, (event) => notify('progress', event.message));
    notify(result.some(r => /error/.test(r.status ?? '')) ? 'error' : 'success', result.some(r => /error/.test(r.status ?? '')) ? 'Some courses or files could not be read. Review the errors and retry.' : 'Synchronization finished.');
    return result;
  });
  ipcMain.handle('toledo:check-updates', async (_event, request = {}) => {
    const { courseCode = null, selectedCodes = null } = request || {};
    const current = await currentConfig();
    if (!current) throw new Error('Save the initial settings first.');
    notify('info', courseCode ? `Checking updates for ${courseCode}…` : 'Checking selected courses for updates…');
    const result = await syncCourses({ ...unrestrictedDesktopConfig(configWithSelection(current.config, selectedCodes)), browser: { ...current.config.browser, headless: true } }, courseCode, (event) => notify('progress', event.message), { dryRun: true });
    notify(result.some(r => /error/.test(r.status ?? '')) ? 'error' : 'success', result.some(r => /error/.test(r.status ?? '')) ? 'Check incomplete. Review the course errors and retry. No local material was changed.' : 'Update check finished. No local material was changed.');
    return { summaries: updateSummary(result), results: result };
  });
  ipcMain.handle('toledo:apply-updates', async (_event, request = {}) => {
    const { courseCode = null, selectedCodes = null, decisions = {} } = request || {};
    const current = await currentConfig();
    if (!current) throw new Error('Save the initial settings first.');
    notify('info', courseCode ? `Applying updates for ${courseCode}…` : 'Applying checked updates…');
    const result = await syncCourses({ ...unrestrictedDesktopConfig(configWithSelection(current.config, selectedCodes)), browser: { ...current.config.browser, headless: true } }, courseCode, (event) => notify('progress', event.message), { decisions });
    notify(result.some(r => /error/.test(r.status ?? '')) ? 'error' : 'success', result.some(r => /error/.test(r.status ?? '')) ? 'Some updates failed. Review the course errors and retry.' : 'Updates written locally.');
    return { summaries: updateSummary(result), results: result };
  });  ipcMain.handle('path:open', async (_event, target) => shell.openPath(target));
}

async function runAutomaticCheck(reason) {
  if (automationRunning) return;
  automationRunning = true;
  try {
    const current = await currentConfig();
    if (!current) return;
    if (!current.authenticated) {
      notify('info', `${reason}: automatic check skipped; sign in to Toledo first.`);
      return;
    }
    notify('info', `${reason}: checking for course updates…`);
    const discovered = await discoverCourses({ ...unrestrictedDesktopConfig(current.config), browser: { ...current.config.browser, headless: true } }, current.configPath, { auto: true, allCourses: true, ignoreAcademicYear: true, onProgress: (event) => notify('progress', event.message) });
    const refreshed = await loadConfig(current.configPath);
    notify('progress', `${reason}: discovery finished; synchronizing selected courses…`);
    const results = await syncCourses({ ...unrestrictedDesktopConfig(refreshed.config), browser: { ...refreshed.config.browser, headless: true } }, null, (event) => notify('progress', event.message));
    if (results.some(r => /error/.test(r.status ?? ''))) throw new Error('Some courses or files could not be read. Review the errors and retry.');
    notify('success', `${reason}: update check finished.`);
    return discovered;
  } catch (error) {
    notify('error', `${reason}: automatic check failed — ${error.message}`);
  } finally {
    automationRunning = false;
  }
}

async function configureAutomation(automation) {
  const normalized = normalizeAutomation(automation);
  if (process.platform === 'win32' || process.platform === 'darwin') {
    app.setLoginItemSettings({
      openAtLogin: normalized.autoStart,
      path: process.execPath,
      args: app.isPackaged ? [] : [app.getAppPath()]
    });
  } else if (process.platform === 'linux') {
    const desktopFile = linuxAutostartPath(app.getPath('home'));
    if (normalized.autoStart) {
      await fs.mkdir(path.dirname(desktopFile), { recursive: true });
      await fs.writeFile(desktopFile, linuxAutostartEntry({
        executable: process.execPath, appPath: app.getAppPath(), packaged: app.isPackaged, appImage: process.env.APPIMAGE
      }), { encoding: 'utf8', mode: 0o600 });
    } else {
      await fs.rm(desktopFile, { force: true });
    }
  }
  if (automationTimer) clearInterval(automationTimer);
  automationTimer = normalized.periodicCheckMinutes > 0
    ? setInterval(() => { void runAutomaticCheck('Scheduled check'); }, normalized.periodicCheckMinutes * 60 * 1000)
    : null;
}

async function initializeAutomation() {
  const current = await currentConfig();
  if (!current) return;
  await configureAutomation(current.automation);
  if (current.automation.autoCheckOnLaunch) setTimeout(() => { void runAutomaticCheck('Startup check'); }, 1200);
}

async function createWindow() {
  const demoMode = process.env.TOLEDO_DEMO === '1';
  const windowIcon = process.platform === 'win32' ? 'toledo-sync.ico' : 'toledo-sync.png';
  mainWindow = new BrowserWindow({
    width: demoMode ? 1280 : 860, height: demoMode ? 720 : 660,
    minWidth: demoMode ? 1280 : 720, minHeight: demoMode ? 720 : 540,
    resizable: !demoMode, autoHideMenuBar: demoMode, useContentSize: true, show: false,
    icon: path.join(__dirname, '..', 'assets', windowIcon),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false }
  });
  await mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.show();
}

app.whenReady().then(async () => {
  registerIpc();
  await createWindow();
  await initializeAutomation();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
