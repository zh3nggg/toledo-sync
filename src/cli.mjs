#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import { initializeConfig, loadConfig, saveConfig, statePath } from './config.mjs';
import { launchBrowser } from './browser.mjs';
import { discoverCourses } from './discover.mjs';
import { ask } from './prompt.mjs';
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
Toledo Sync 0.1.0

Usage:
  toledo-sync init --vault <Obsidian vault>
                   --output <download root>
                   [--academic-year 2026-2027]
                   [--courses G0S96A,G0S83A,...]
  toledo-sync configure --config <config.json>
                        [--output <download directory>]
                        [--academic-year 2026-2027]
                        [--courses G0S96A,G0S83A,...]
  toledo-sync list --config <config.json>
  toledo-sync login --config <config.json>
  toledo-sync discover --config <config.json>
  toledo-sync sync --config <config.json> [--course G0S96A]
  toledo-sync set-calendar --config <config.json>
  toledo-sync sync-calendar --config <config.json>

The login command never asks for your KU Leuven password. Complete SSO/MFA in the browser.
`;

async function main() {
  const { positional, options } = parseArgs(process.argv.slice(2));
  const command = positional[0];
  if (!command || command === 'help' || options.help) {
    console.log(HELP.trim());
    return;
  }

  if (command === 'init') {
    if (!options.vault) throw new Error('init requires --vault <path>');
    if (!options.output) throw new Error('init requires --output <download root>');
    const selectedCodes = options.courses ? String(options.courses).split(',').map((value) => value.trim()).filter(Boolean) : undefined;
    const result = await initializeConfig(options.vault, options.config && path.resolve(options.config), {
      outputRoot: options.output,
      academicYear: options['academic-year'],
      selectedCodes
    });
    console.log(`Created config: ${result.configPath}`);
    console.log(`Download directory: ${result.config.download.outputRoot}`);
    console.log('Next: run login, then discover.');
    return;
  }

  const { config, configPath } = await loadConfig(options.config);
  if (command === 'configure') {
    if (options.output) config.download.outputRoot = path.resolve(options.output);
    if (options['academic-year']) {
      config.filters.academicYears = [String(options['academic-year'])];
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
    console.log(`Academic year: ${config.filters.academicYears.join(', ')}`);
    console.log(`Selected courses: ${config.courses.filter((course) => course.selected).map((course) => course.code).join(', ') || 'none'}`);
    return;
  }
  if (command === 'list') {
    console.log(`Download directory: ${config.download.outputRoot}`);
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
    const result = await discoverCourses(config, configPath, { auto: Boolean(options.auto) });
    for (const match of result.matches) console.log(`${match.code}: ${match.selectedUrl ?? '未匹配'}`);
    console.log(`Discovery evidence: ${result.runDirectory}`);
    return;
  }
  if (command === 'sync') {
    const results = await syncCourses(config, options.course || null);
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
