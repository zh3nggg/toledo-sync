import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { chromium, firefox } from 'playwright-core';
import { ensureDirectory } from './utils.mjs';

async function exists(filePath) {
  try { await fs.access(filePath); return true; } catch { return false; }
}

function pathExecutables(names) {
  return String(process.env.PATH ?? '')
    .split(path.delimiter)
    .filter(Boolean)
    .flatMap((directory) => names.map((name) => path.join(directory, name)));
}

export async function detectBrowser(configuredPath = null) {
  const candidates = [];
  const requested = configuredPath || process.env.TOLEDO_BROWSER_PATH;
  const managedName = String(requested ?? '').toLowerCase();
  if (['chromium', 'firefox'].includes(managedName)) {
    const executable = (managedName === 'firefox' ? firefox : chromium).executablePath();
    if (await exists(executable)) return executable;
    throw browserSetupError(`Install the compatible ${managedName} build in Browser settings, or run toledo-sync install-browser ${managedName}.`);
  }
  if (requested) {
    if (!await exists(requested)) throw browserSetupError(`The selected browser does not exist: ${requested}`);
    if (!isFirefoxPath(requested)) return requested;
    const executable = firefox.executablePath();
    if (await exists(executable)) return executable;
    throw browserSetupError('Firefox requires its Playwright-compatible build. Install it in Browser settings, or run toledo-sync install-browser firefox.');
  }

  if (process.platform === 'win32') {
    for (const root of [process.env['PROGRAMFILES(X86)'], process.env.PROGRAMFILES, process.env.LOCALAPPDATA]) {
      if (!root) continue;
      candidates.push(
        path.join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe')
      );
    }
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    );
  } else {
    candidates.push(
      '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
      '/usr/bin/microsoft-edge', '/usr/bin/microsoft-edge-stable',
      '/usr/bin/chromium', '/usr/bin/chromium-browser',
      '/usr/bin/brave-browser', '/snap/bin/chromium',
      '/usr/bin/firefox', '/usr/bin/firefox-esr', '/snap/bin/firefox',
      '/var/lib/flatpak/exports/bin/org.chromium.Chromium',
      path.join(os.homedir(), '.local', 'share', 'flatpak', 'exports', 'bin', 'org.chromium.Chromium'),
      ...pathExecutables([
        'google-chrome', 'google-chrome-stable', 'microsoft-edge',
        'microsoft-edge-stable', 'chromium', 'chromium-browser', 'brave-browser',
        'firefox', 'firefox-esr'
      ])
    );
  }

  for (const candidate of [...new Set(candidates.filter(Boolean))]) {
    if (await exists(candidate)) {
      // A stock Firefox cannot be automated by Playwright. Keep searching:
      // a later Chromium candidate or a managed browser may still work.
      if (isFirefoxPath(candidate)) continue;
      return candidate;
    }
  }
  for (const browser of [chromium, firefox]) {
    if (await exists(browser.executablePath())) return browser.executablePath();
  }
  throw browserSetupError([
    'No supported Chrome, Edge, Chromium, Brave, or Firefox executable was found.',
    'Choose a browser in Browser settings, or run toledo-sync install-browser chromium.'
  ].join(' '));
}

function browserSetupError(message) {
  return Object.assign(new Error(message), { code: 'BROWSER_SETUP_REQUIRED' });
}

export function browserChoice(config) {
  if (['chromium', 'firefox'].includes(config.browser?.type)) return config.browser.type;
  return config.browser?.executablePath ? 'custom' : 'auto';
}

export function setBrowserChoice(config, choice) {
  if (!['auto', 'chromium', 'firefox'].includes(choice)) throw new Error('Choose auto, chromium, or firefox.');
  config.browser = { ...config.browser, type: choice === 'auto' ? null : choice, executablePath: null };
}

function isFirefoxPath(value) {
  return /(^|[\\/])firefox(?:-esr)?(?:\.exe)?$/i.test(String(value));
}

function browserSessionPaths(config, firefoxSelected) {
  const appStateRoot = path.join(os.homedir(), '.toledo-sync');
  const profileBase = path.resolve(config.browser?.profilePath ?? path.join(appStateRoot, 'browser-profile'));
  const authStateBase = config.browser?.authStatePath ? path.resolve(config.browser.authStatePath) : null;
  return {
    profilePath: firefoxSelected ? `${profileBase}-firefox` : profileBase,
    authStatePath: firefoxSelected && authStateBase ? authStateBase.replace(/\.json$/i, '.firefox.json') : authStateBase
  };
}

export async function installManagedBrowser(name, { onProgress = message => process.stdout.write(message) } = {}) {
  if (!['chromium', 'firefox'].includes(name)) throw new Error('Choose chromium or firefox.');
  const executablePath = (name === 'firefox' ? firefox : chromium).executablePath();
  if (await exists(executablePath)) return { name, executablePath, installed: false };
  const { spawn } = await import('node:child_process');
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const packageJson = require.resolve('playwright-core/package.json');
  const cliPath = path.join(path.dirname(packageJson), 'cli.js').replace(/app\.asar([\\/])/, 'app.asar.unpacked$1');
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, 'install', name], {
      env: { ...process.env, ...(process.versions.electron ? { ELECTRON_RUN_AS_NODE: '1' } : {}) },
      stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true
    });
    child.stdout.on('data', chunk => onProgress(chunk.toString()));
    child.stderr.on('data', chunk => onProgress(chunk.toString()));
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`${name} installation failed (exit ${code}). Check the download log and Linux dependencies.`)));
  });
  if (!await exists(executablePath)) throw new Error(`Browser installation completed, but no executable was found at ${executablePath}.`);
  return { name, executablePath, installed: true };
}

function isInside(parent, target) {
  const relative = path.relative(path.resolve(parent), path.resolve(target));
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export async function resetBrowserSession(config, { lastLoginPath = null } = {}) {
  const appStateRoot = path.join(os.homedir(), '.toledo-sync');
  const firefoxSelected = config.browser?.type === 'firefox' || isFirefoxPath(config.browser?.executablePath ?? '');
  const defaults = browserSessionPaths(config, firefoxSelected);
  const profilePaths = [defaults.profilePath];
  const authStatePaths = [defaults.authStatePath].filter(Boolean);
  if (lastLoginPath) {
    try {
      const previousSession = JSON.parse(await fs.readFile(path.resolve(lastLoginPath), 'utf8'));
      if (previousSession.profilePath) profilePaths.push(path.resolve(previousSession.profilePath));
      if (previousSession.authStatePath) authStatePaths.push(path.resolve(previousSession.authStatePath));
    } catch (error) {
      if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
    }
  }
  const uniqueProfilePaths = [...new Set(profilePaths)];
  const uniqueAuthStatePaths = [...new Set(authStatePaths)];
  const managedPaths = [...uniqueProfilePaths, ...uniqueAuthStatePaths];
  const unmanaged = managedPaths.filter((target) => !isInside(appStateRoot, target));
  if (unmanaged.length) {
    throw new Error(`Refusing to remove a browser-session path outside ${appStateRoot}: ${unmanaged.join(', ')}`);
  }
  for (const profilePath of uniqueProfilePaths) await fs.rm(profilePath, { recursive: true, force: true });
  for (const authStatePath of uniqueAuthStatePaths) await fs.rm(authStatePath, { force: true });
  if (lastLoginPath) await fs.rm(path.resolve(lastLoginPath), { force: true });
  return { profilePath: uniqueProfilePaths, authStatePath: uniqueAuthStatePaths };
}

export function missingSessionCookies(savedCookies, currentCookies, now = Date.now() / 1000) {
  const key = cookie => `${cookie.domain}|${cookie.path}|${cookie.name}`;
  const current = new Set(currentCookies.map(key));
  return savedCookies.filter(cookie => !current.has(key(cookie))
    && (cookie.expires === undefined || cookie.expires === -1 || cookie.expires > now));
}

export async function launchBrowser(config) {
  const requestedBrowser = ['firefox', 'chromium'].includes(config.browser?.type) ? config.browser.type : config.browser?.executablePath;
  const executablePath = await detectBrowser(requestedBrowser);
  const firefoxSelected = isFirefoxPath(executablePath) || config.browser?.type === 'firefox';
  const browserType = firefoxSelected ? firefox : chromium;
  const { profilePath, authStatePath } = browserSessionPaths(config, firefoxSelected);
  await ensureDirectory(profilePath);
  const context = await browserType.launchPersistentContext(profilePath, {
    executablePath,
    headless: Boolean(config.browser?.headless),
    acceptDownloads: true,
    viewport: { width: 1440, height: 1000 },
    locale: 'en-GB'
  });
  if (authStatePath && await exists(authStatePath)) {
    try {
      const state = JSON.parse(await fs.readFile(authStatePath, 'utf8'));
      if (Array.isArray(state.cookies) && state.cookies.length) {
        // A login export is only a bootstrap. Do not roll a refreshed browser
        // session back to older cookies on every discovery/check operation.
        const missing = missingSessionCookies(state.cookies, await context.cookies());
        if (missing.length) await context.addCookies(missing);
      }
    } catch (error) {
      await context.close();
      throw new Error(`Could not restore local authentication state: ${error.message}`);
    }
  }
  context.setDefaultNavigationTimeout(config.sync?.navigationTimeoutMs ?? 45000);
  return { context, executablePath, profilePath, authStatePath };
}
