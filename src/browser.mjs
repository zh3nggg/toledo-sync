import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { ensureDirectory } from './utils.mjs';

async function exists(filePath) {
  try { await fs.access(filePath); return true; } catch { return false; }
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
      '/usr/bin/chromium', '/usr/bin/chromium-browser'
    );
  }

  for (const candidate of [...new Set(candidates.filter(Boolean))]) {
    if (await exists(candidate)) return candidate;
  }
  throw new Error([
    'No supported Chrome, Edge, or Chromium executable was found.',
    'Install one, set browser.executablePath in config.json, or set TOLEDO_BROWSER_PATH.'
  ].join(' '));
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
