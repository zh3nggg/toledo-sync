import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DEFAULT_PORTAL_URL, FALL_2026_COURSES } from './constants.mjs';
import { ensureDirectory, readJson, stableId, writeJson } from './utils.mjs';

const DEFAULT_MATERIALS_DIRECTORY = 'Materials';
const LEGACY_MATERIALS_DIRECTORY = '原始资料';
const DEFAULT_VERIFICATION_MODE = 'sha256';

export function normalizeMaterialsLayout(download, { preserveLegacyDefault = false } = {}) {
  const placement = download?.materialsPlacement === 'course-root' ? 'course-root' : 'subdirectory';
  const name = String(download?.materialsFolderName ?? (preserveLegacyDefault ? LEGACY_MATERIALS_DIRECTORY : DEFAULT_MATERIALS_DIRECTORY)).trim();
  if (!name || name === '.' || name === '..' || /[\\/\u0000-\u001f]/.test(name)) {
    throw new Error('Materials folder name must be a single, non-empty folder name.');
  }
  return { materialsPlacement: placement, materialsFolderName: name };
}


export function normalizeVerificationMode(value) {
  return value === 'filename' ? 'filename' : DEFAULT_VERIFICATION_MODE;
}
export function defaultConfigPath(vaultPath) {
  return path.join(path.resolve(vaultPath), '_codex', 'toledo-sync', 'config.json');
}

export function createConfig(vaultPath, options = {}) {
  const resolvedVault = path.resolve(vaultPath);
  if (!options.outputRoot) throw new Error('Choose the download root with --output <directory>. Course folders are created directly inside it.');
  const selectedCodes = new Set(options.selectedCodes ?? FALL_2026_COURSES.map((course) => course.code));
  const academicYear = options.academicYear ?? '2026-2027';
  return {
    schemaVersion: 2,
    portalUrl: DEFAULT_PORTAL_URL,
    vaultPath: resolvedVault,
    download: {
      outputRoot: path.resolve(options.outputRoot),
      ...normalizeMaterialsLayout({
        materialsPlacement: options.materialsPlacement,
        materialsFolderName: options.materialsFolderName
      })
    },
    filters: {
      academicYears: [academicYear]
    },
    stateRoot: path.join('_codex', 'toledo-sync'),
    browser: {
      executablePath: null,
      headless: false,
      profilePath: path.join(os.homedir(), '.toledo-sync', 'browser-profile'),
      authStatePath: path.join(os.homedir(), '.toledo-sync', 'auth-state.json')
    },
    sync: {
      maxPagesPerCourse: 40,
      navigationTimeoutMs: 45000,
      settleTimeMs: 2500,
      verificationMode: normalizeVerificationMode(options.verificationMode)
    },
    courses: FALL_2026_COURSES.map((course, index) => ({
      ...course,
      order: index + 1,
      term: '2026-fall',
      academicYear,
      selected: selectedCodes.has(course.code),
      url: null
    }))
  };
}

export async function initializeConfig(vaultPath, configPath = defaultConfigPath(vaultPath), options = {}) {
  const config = createConfig(vaultPath, options);
  await ensureDirectory(path.dirname(configPath));
  try {
    await fs.access(configPath);
    throw new Error(`Config already exists: ${configPath}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await writeJson(configPath, config);
  return { config, configPath };
}

export async function loadConfig(configPath) {
  if (!configPath) throw new Error('Pass --config <path>, or run init first.');
  const resolvedPath = path.resolve(configPath);
  const config = await readJson(resolvedPath);
  if (config.schemaVersion !== 2) throw new Error(`Unsupported config schema: ${config.schemaVersion}`);
  config.vaultPath = path.resolve(config.vaultPath);
  config.download.outputRoot = path.resolve(config.download.outputRoot);
  config.sync = { ...(config.sync ?? {}), verificationMode: normalizeVerificationMode(config.sync?.verificationMode) };
  Object.assign(config.download, normalizeMaterialsLayout(config.download, {
    preserveLegacyDefault: config.download.materialsPlacement === undefined && config.download.materialsFolderName === undefined
  }));
  return { config, configPath: resolvedPath };
}

export async function saveConfig(configPath, config) {
  await writeJson(configPath, config);
}

export function statePath(config, ...parts) {
  return path.join(config.vaultPath, config.stateRoot, ...parts);
}

export function materialsPath(config, ...parts) {
  return path.join(config.download.outputRoot, ...parts);
}

export function courseMaterialsPath(config, courseFolder) {
  const download = normalizeMaterialsLayout(config.download);
  return download.materialsPlacement === 'course-root'
    ? materialsPath(config, courseFolder)
    : materialsPath(config, courseFolder, download.materialsFolderName);
}

export function localSecretPath(configPath) {
  return path.join(os.homedir(), '.toledo-sync', 'secrets', `${stableId(path.resolve(configPath))}.json`);
}
