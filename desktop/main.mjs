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
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const settingsPath = () => path.join(app.getPath('userData'), 'settings.json');

async function readSettings() {
  try { return JSON.parse(await fs.readFile(settingsPath(), 'utf8')); } catch { return {}; }
}

async function saveSettings(settings) {
  await fs.mkdir(path.dirname(settingsPath()), { recursive: true });
  await fs.writeFile(settingsPath(), `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
}

function notify(type, message) {
  mainWindow?.webContents.send('toledo:event', { type, message, at: new Date().toISOString() });
}

function present(config, configPath) {
  return {
    configPath,
    vaultPath: config.vaultPath,
    outputRoot: config.download.outputRoot,
    materialsPlacement: config.download.materialsPlacement,
    materialsFolderName: config.download.materialsFolderName,
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
  return { config, configPath };
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

async function updateConfig({ vaultPath, outputRoot, academicYear, selectedCodes, materialsPlacement, materialsFolderName }) {
  ensureWindows();
  if (!vaultPath || !outputRoot) throw new Error('Choose both the Obsidian Vault and the download root.');
  const configPath = defaultConfigPath(vaultPath);
  let config;
  try {
    ({ config } = await loadConfig(configPath));
    config.download.outputRoot = path.resolve(outputRoot);
    Object.assign(config.download, normalizeMaterialsLayout({ materialsPlacement, materialsFolderName }));
    config.filters.academicYears = [academicYear];
    for (const course of config.courses) {
      const academicYearChanged = course.academicYear !== academicYear;
      course.academicYear = academicYear;
      course.selected = selectedCodes.includes(course.code);
      if (academicYearChanged) course.url = null;
    }
    await saveConfig(configPath, config);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const initialSelectedCodes = selectedCodes.length ? selectedCodes : FALL_2026_COURSES.map((course) => course.code);
    ({ config } = await initializeConfig(vaultPath, configPath, { outputRoot, academicYear, selectedCodes: initialSelectedCodes, materialsPlacement, materialsFolderName }));
  }
  await saveSettings({ configPath });
  return present(config, configPath);
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
    return { title: result.title, url: result.url };
  } finally { await context.close(); }
}

function registerIpc() {
  ipcMain.handle('app:initial', async () => {
    const current = await currentConfig();
    return { platform: process.platform, config: current ? present(current.config, current.configPath) : null };
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
    const result = await discoverCourses({ ...current.config, browser: { ...current.config.browser, headless: true } }, current.configPath, { auto: true, allCourses: true });
    const refreshed = await loadConfig(current.configPath);
    notify('success', 'Course discovery finished.');
    return { config: present(refreshed.config, refreshed.configPath), matches: result.matches };
  });
  ipcMain.handle('toledo:sync', async (_event, courseCode = null) => {
    const current = await currentConfig();
    if (!current) throw new Error('Save the initial settings first.');
    notify('info', courseCode ? `Syncing ${courseCode}…` : 'Syncing selected courses…');
    const result = await syncCourses({ ...current.config, browser: { ...current.config.browser, headless: true } }, courseCode);
    notify('success', 'Synchronization finished.');
    return result;
  });
  ipcMain.handle('path:open', async (_event, target) => shell.openPath(target));
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1120, height: 760, minWidth: 930, minHeight: 620, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false }
  });
  await mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.show();
}

app.whenReady().then(async () => {
  registerIpc();
  await createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
