import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';
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
  if (configuredPath) candidates.push(configuredPath);
  if (process.env.TOLEDO_BROWSER_PATH) candidates.push(process.env.TOLEDO_BROWSER_PATH);

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
      '/var/lib/flatpak/exports/bin/org.chromium.Chromium',
      path.join(os.homedir(), '.local', 'share', 'flatpak', 'exports', 'bin', 'org.chromium.Chromium'),
      ...pathExecutables([
        'google-chrome', 'google-chrome-stable', 'microsoft-edge',
        'microsoft-edge-stable', 'chromium', 'chromium-browser', 'brave-browser'
      ])
    );
  }

  for (const candidate of [...new Set(candidates.filter(Boolean))]) {
    if (await exists(candidate)) return candidate;
  }
  throw new Error([
    'No supported Chrome, Edge, Chromium, or Brave executable was found.',
    'Install one, run `toledo-sync doctor`, pass --browser <path>, or set TOLEDO_BROWSER_PATH.'
  ].join(' '));
}

function isInside(parent, target) {
  const relative = path.relative(path.resolve(parent), path.resolve(target));
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export async function resetBrowserSession(config, { lastLoginPath = null } = {}) {
  const appStateRoot = path.join(os.homedir(), '.toledo-sync');
  const profilePath = path.resolve(config.browser?.profilePath ?? path.join(appStateRoot, 'browser-profile'));
  const authStatePath = config.browser?.authStatePath ? path.resolve(config.browser.authStatePath) : null;
  const managedPaths = [profilePath, authStatePath].filter(Boolean);
  const unmanaged = managedPaths.filter((target) => !isInside(appStateRoot, target));
  if (unmanaged.length) {
    throw new Error(`Refusing to remove a browser-session path outside ${appStateRoot}: ${unmanaged.join(', ')}`);
  }
  await fs.rm(profilePath, { recursive: true, force: true });
  if (authStatePath) await fs.rm(authStatePath, { force: true });
  if (lastLoginPath) await fs.rm(path.resolve(lastLoginPath), { force: true });
  return { profilePath, authStatePath };
}

export async function launchBrowser(config) {
  const executablePath = await detectBrowser(config.browser?.executablePath);
  const profilePath = path.resolve(config.browser?.profilePath ?? path.join(os.homedir(), '.toledo-sync', 'browser-profile'));
  await ensureDirectory(profilePath);
  const context = await chromium.launchPersistentContext(profilePath, {
    executablePath,
    headless: Boolean(config.browser?.headless),
    acceptDownloads: true,
    viewport: { width: 1440, height: 1000 },
    locale: 'en-GB'
  });
  const authStatePath = config.browser?.authStatePath;
  if (authStatePath && await exists(authStatePath)) {
    try {
      const state = JSON.parse(await fs.readFile(authStatePath, 'utf8'));
      if (Array.isArray(state.cookies) && state.cookies.length) await context.addCookies(state.cookies);
    } catch (error) {
      throw new Error(`Could not restore local authentication state: ${error.message}`);
    }
  }
  context.setDefaultNavigationTimeout(config.sync?.navigationTimeoutMs ?? 45000);
  return { context, executablePath, profilePath, authStatePath };
}
