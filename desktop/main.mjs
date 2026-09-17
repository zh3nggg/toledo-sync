import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { defaultConfigPath, initializeConfig, loadConfig, normalizeMaterialsLayout, saveConfig, statePath } from '../src/config.mjs';
import { FALL_2026_COURSES } from '../src/constants.mjs';
import { launchBrowser } from '../src/browser.mjs';
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
    newCount: result.files.filter((file) => file.status === 'new' || file.status === 'downloaded').length,
    unchangedCount: result.files.filter((file) => file.status === 'unchanged').length,
    localModifiedCount: result.files.filter((file) => file.status === 'local-modified').length,
    errorCount: result.files.filter((file) => file.status === 'error' || file.status === 'skipped-non-file').length,
    files: result.files
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
    ...normalizeAutomation(automation),
    academicYear: config.filters.academicYears[0] ?? '',
    courses: config.courses.map((course) => ({
      code: course.code, title: course.title, selected: course.selected,
      discovered: Boolean(course.url), academicYear: course.academicYear
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

function ensureWindows() {
  if (process.platform !== 'win32') throw new Error('The desktop app is currently published for Windows. Use the CLI on macOS and Linux.');
}

async function updateConfig({ vaultPath, outputRoot, academicYear, selectedCodes, materialsPlacement, materialsFolderName, autoStart, autoCheckOnLaunch, periodicCheckMinutes }) {
  ensureWindows();
  if (!vaultPath || !outputRoot) throw new Error('Choose both the Obsidian Vault and the download root.');
  const configPath = defaultConfigPath(vaultPath);
  let config;
  let authenticated = false;
  try {
    ({ config } = await loadConfig(configPath));
    try { await fs.access(statePath(config, 'auth', 'last-login.json')); authenticated = true; } catch { /* Login is still required. */ }
    config.download.outputRoot = path.resolve(outputRoot);
    Object.assign(config.download, normalizeMaterialsLayout({ materialsPlacement, materialsFolderName }));
    const previousAcademicYear = config.filters.academicYears[0] ?? '';
    config.filters.academicYears = academicYear ? [academicYear] : [];
    if (previousAcademicYear !== academicYear) {
      // The course list is populated from Toledo after the year changes. Keeping
      // the seed list here made the GUI appear to support only the bundled year.
      config.courses = [];
    } else {
      for (const course of config.courses) {
        course.selected = selectedCodes.includes(course.code);
      }
    }
    await saveConfig(configPath, config);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const initialSelectedCodes = selectedCodes.length ? selectedCodes : FALL_2026_COURSES.map((course) => course.code);
    ({ config } = await initializeConfig(vaultPath, configPath, { outputRoot, academicYear, selectedCodes: initialSelectedCodes, materialsPlacement, materialsFolderName }));
  }
  const automation = normalizeAutomation({ autoStart, autoCheckOnLaunch, periodicCheckMinutes });
  await saveSettings({ configPath, ...automation });
  await configureAutomation(automation);
  return present(config, configPath, authenticated, automation);
}

async function startLogin() {
  ensureWindows();
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
    if (authStatePath) await context.storageState({ path: authStatePath });
    await writeJson(statePath(loginConfig, 'auth', 'last-login.json'), {
      verifiedAt: new Date().toISOString(), url: result.url, title: result.title, browser: executablePath, profilePath
    });
    notify('success', 'Toledo login verified.');
    return { title: result.title, url: result.url, authenticated: true };
  } finally { await context.close(); }
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
  ipcMain.handle('toledo:discover', async () => {
    const current = await currentConfig();
    if (!current) throw new Error('Save the initial settings first.');
    notify('info', 'Discovering programme courses…');
    const result = await discoverCourses({ ...current.config, browser: { ...current.config.browser, headless: true } }, current.configPath, { auto: true, allCourses: true, onProgress: (event) => notify('progress', event.message) });
    const refreshed = await loadConfig(current.configPath);
    notify('success', 'Course discovery finished.');
    return { config: present(refreshed.config, refreshed.configPath, current.authenticated, current.automation), matches: result.matches };
  });
  ipcMain.handle('toledo:sync', async (_event, courseCode = null) => {
    const current = await currentConfig();
    if (!current) throw new Error('Save the initial settings first.');
    notify('info', courseCode ? `Syncing ${courseCode}…` : 'Syncing selected courses…');
    const result = await syncCourses({ ...current.config, browser: { ...current.config.browser, headless: true } }, courseCode, (event) => notify('progress', event.message));
    notify('success', 'Synchronization finished.');
    return result;
  });
  ipcMain.handle('toledo:check-updates', async (_event, courseCode = null) => {
    const current = await currentConfig();
    if (!current) throw new Error('Save the initial settings first.');
    notify('info', courseCode ? `Checking updates for ${courseCode}…` : 'Checking selected courses for updates…');
    const result = await syncCourses({ ...current.config, browser: { ...current.config.browser, headless: true } }, courseCode, (event) => notify('progress', event.message), { dryRun: true });
    notify('success', 'Update check finished. No local material was changed.');
    return { summaries: updateSummary(result), results: result };
  });
  ipcMain.handle('toledo:apply-updates', async (_event, courseCode = null) => {
    const current = await currentConfig();
    if (!current) throw new Error('Save the initial settings first.');
    notify('info', courseCode ? `Applying updates for ${courseCode}…` : 'Applying checked updates…');
    const result = await syncCourses({ ...current.config, browser: { ...current.config.browser, headless: true } }, courseCode, (event) => notify('progress', event.message));
    notify('success', 'Updates written locally. Existing local files were preserved.');
    return { summaries: updateSummary(result), results: result };
  });
  ipcMain.handle('path:open', async (_event, target) => shell.openPath(target));
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
    const discovered = await discoverCourses({ ...current.config, browser: { ...current.config.browser, headless: true } }, current.configPath, { auto: true, allCourses: true, onProgress: (event) => notify('progress', event.message) });
    const refreshed = await loadConfig(current.configPath);
    notify('progress', `${reason}: discovery finished; synchronizing selected courses…`);
    await syncCourses({ ...refreshed.config, browser: { ...refreshed.config.browser, headless: true } }, null, (event) => notify('progress', event.message));
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
  if (process.platform === 'win32') {
    app.setLoginItemSettings({
      openAtLogin: normalized.autoStart,
      path: process.execPath,
      args: app.isPackaged ? [] : [app.getAppPath()]
    });
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
  mainWindow = new BrowserWindow({
    width: demoMode ? 1280 : 860, height: demoMode ? 720 : 660,
    minWidth: demoMode ? 1280 : 720, minHeight: demoMode ? 720 : 540,
    resizable: !demoMode, autoHideMenuBar: demoMode, useContentSize: true, show: false,
    icon: path.join(__dirname, '..', 'assets', 'toledo-sync.ico'),
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
