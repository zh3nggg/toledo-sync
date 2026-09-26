import fs from 'node:fs/promises';
import path from 'node:path';
import { launchBrowser } from './browser.mjs';
import { readCoursePage, isLoginUrl } from './course-content.mjs';
import { courseMaterialsPath, statePath } from './config.mjs';
import { courseTitleFromText } from './discover.mjs';
import {
  contentDispositionFileName, ensureDirectory, readJson, sanitizeFileName,
  sha256, stableId, timestampForFile, writeJson
} from './utils.mjs';

const FILE_ACTIONS = new Set(['keep-local', 'replace', 'skip', 'preserve-copy']);
export function fileDecisionKey(courseCode, url) { return `${courseCode}|${url}`; }
export function normalizeFileAction(value) { return FILE_ACTIONS.has(value) ? value : null; }
export { extractUltraFileLinks, isLikelyFileLink } from './course-content.mjs';

export async function uniqueDestination(directory, fileName, digest, verificationMode = 'sha256') {
  const safeName = sanitizeFileName(fileName, `file-${digest.slice(0, 8)}`);
  const initial = path.join(directory, safeName);
  if (verificationMode === 'filename') {
    try {
      await fs.access(initial);
      return { path: initial, unchanged: true, localModified: false };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    return { path: initial, unchanged: false, localModified: false };
  }
  try {
    const existing = await fs.readFile(initial);
    if (sha256(existing) === digest) return { path: initial, unchanged: true, localModified: false };
  } catch (error) {
    if (error.code === 'ENOENT') return { path: initial, unchanged: false, localModified: false };
    throw error;
  }
  const extension = path.extname(safeName);
  const stem = path.basename(safeName, extension);
  return { path: path.join(directory, `${stem}-${digest.slice(0, 8)}${extension}`), unchanged: false, localModified: true };
}

export async function downloadFile(context, link, outputDirectory, referer, {
  dryRun = false,
  verificationMode = 'sha256',
  cacheDirectory = null,
  cacheIndex = {},
  requestTimeoutMs = 120000,
  action = null,
  decisionKey = null,
  onProgress = () => {}
} = {}) {
  const normalizedAction = normalizeFileAction(action);
  if (!dryRun && (normalizedAction === 'keep-local' || normalizedAction === 'skip')) {
    return {
      status: normalizedAction === 'keep-local' ? 'kept-local' : 'skipped',
      url: link.href,
      file: link.title || path.basename(new URL(link.href).pathname),
      decisionKey,
      decision: normalizedAction,
      verificationMode
    };
  }
  if (!dryRun) await ensureDirectory(outputDirectory);
  const cacheKey = stableId(link.href);
  let body;
  let headers = {};
  let fromCache = false;
  const cached = cacheIndex[cacheKey];
  if (!dryRun && cached?.path) {
    try {
      body = await fs.readFile(cached.path);
      if (!cached.sha256 || sha256(body) !== cached.sha256) throw new Error('The checked cache file is damaged. Check for updates again.');
      headers = { 'content-type': cached.contentType ?? '' };
      fromCache = true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  if (body === undefined) {
    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      try { response = await context.request.get(link.href, {
      headers: { Referer: referer },
      timeout: requestTimeoutMs,
      failOnStatusCode: false
      }); } catch (error) {
        if (attempt === 2) throw error;
        onProgress(`File request interrupted; retry ${attempt + 1}/2`);
        await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
        continue;
      }
      if (![408, 429, 500, 502, 503, 504].includes(response.status()) || attempt === 2) break;
      onProgress(`File request returned HTTP ${response.status()}; retry ${attempt + 1}/2`);
      const retryAfter = Number(response.headers()['retry-after']) || 0;
      await response.dispose?.();
      await new Promise(resolve => setTimeout(resolve, Math.min(30000, Math.max(1000 * 2 ** attempt, retryAfter * 1000))));
    }
    try {
      if (!response.ok()) return { status: 'error', url: link.href, httpStatus: response.status(), error: `File request failed (HTTP ${response.status()}).` };
      if (response.url && isLoginUrl(response.url())) return { status: 'error', url: link.href, error: 'Sign in to Toledo again.' };
      headers = response.headers();
      body = await response.body();
    } finally { await response.dispose?.(); }
  }
  const contentType = headers['content-type'] ?? '';
  const headerName = contentDispositionFileName(headers['content-disposition']);
  const prefix = body.subarray(0, 8192).toString('utf8');
  const html = /text\/html/i.test(contentType) || /^\s*(?:<!doctype html|<html)/i.test(prefix);
  const loginForm = html && /type\s*=\s*["']?password|SAMLRequest|SAMLResponse|\/webapps\/login|idp\.kuleuven\.be/i.test(prefix);
  const expectedExtension = path.extname(headerName || cached?.fileName || link.title || new URL(link.href).pathname).toLowerCase();
  if (loginForm || (html && !['.html', '.htm'].includes(expectedExtension)) || (/application\/json/i.test(contentType) && expectedExtension !== '.json')) {
    return { status: 'error', url: link.href, contentType, error: loginForm ? 'Sign in to Toledo again; the server returned a login page instead of the file.' : 'The server returned a page or API response instead of the requested file.' };
  }
  const digest = sha256(body);
  const cachedName = cached?.fileName;
  const urlName = decodeURIComponent(path.basename(new URL(link.href).pathname));
  const candidateName = headerName || cachedName || link.title || urlName || link.text || `file-${digest.slice(0, 8)}`;
  if (dryRun && cacheDirectory) {
    await ensureDirectory(cacheDirectory);
    const cachePath = path.join(cacheDirectory, `${cacheKey}-${digest.slice(0, 12)}.bin`);
    await fs.writeFile(cachePath, body);
    cacheIndex[cacheKey] = {
      url: link.href, path: cachePath, fileName: candidateName,
      sha256: digest, contentType, createdAt: new Date().toISOString()
    };
  }
  const safeName = sanitizeFileName(candidateName, `file-${digest.slice(0, 8)}`);
  const destination = normalizedAction === 'replace'
    ? { path: path.join(outputDirectory, safeName), unchanged: false, localModified: false }
    : await uniqueDestination(outputDirectory, candidateName, digest, verificationMode);
  if (!destination.unchanged && !dryRun) await fs.writeFile(destination.path, body);
  return {
    status: destination.unchanged ? 'unchanged' : destination.localModified ? 'local-modified' : dryRun ? 'new' : 'downloaded',
    url: link.href,
    file: path.relative(outputDirectory, destination.path),
    bytes: body.length,
    sha256: digest,
    contentType,
    fromCache,
    verificationMode,
    decisionKey,
    decision: normalizedAction
  };
}

export async function syncCourses(config, selectedCode = null, onProgress = () => {}, { dryRun = false, decisions = {} } = {}) {
  const requestedCourses = config.courses
    .filter((course) => selectedCode
      ? course.code.toLowerCase() === selectedCode.toLowerCase()
      : course.selected)
    .filter((course) => !config.filters?.academicYears?.length || config.filters.academicYears.includes(course.academicYear))
    .sort((left, right) => left.order - right.order);
  if (!requestedCourses.length) throw new Error(selectedCode ? `Unknown course: ${selectedCode}` : 'No courses selected for the configured academic-year filter.');
  const missing = requestedCourses.filter((course) => !course.url);
  if (selectedCode && missing.length) throw new Error(`Course ${selectedCode} is not currently available in Toledo; run discover after it becomes accessible.`);
  const courses = requestedCourses.filter((course) => course.url);
  if (!courses.length) throw new Error(`No selected course is currently available in Toledo; unavailable: ${missing.map((course) => course.code).join(', ')}`);

  const { context } = await launchBrowser(config);
  const runId = timestampForFile();
  const verificationMode = config.sync?.verificationMode === 'filename' ? 'filename' : 'sha256';
  const requestTimeoutMs = Math.max(Number(config.sync?.requestTimeoutMs) || 0, 120000);
  const navigationTimeoutMs = Math.max(Number(config.sync?.navigationTimeoutMs) || 0, 120000);
  const cacheDirectory = statePath(config, 'cache');
  const cacheIndexPath = path.join(cacheDirectory, 'index.json');
  const cacheIndex = await readJson(cacheIndexPath, {});
  const runResults = missing.map((course) => ({
    schemaVersion: 1,
    status: dryRun ? 'not-discovered' : 'skipped-unavailable',
    course: { code: course.code, title: course.title, url: null },
    syncedAt: new Date().toISOString(),
    files: []
  }));
  for (const course of missing) onProgress({ stage: 'course-skipped', message: `${course.code}: no current course link; skipped` });
  try {
    for (const course of courses) {
      const cleanCourseTitle = courseTitleFromText(course.title, course.code);
      onProgress({ stage: 'course', course: course.code, message: `${course.code} ${cleanCourseTitle}: opening course` });
      const courseFolder = `${course.code} ${sanitizeFileName(cleanCourseTitle)}`;
      const outputDirectory = courseMaterialsPath(config, courseFolder);
      const snapshotDirectory = statePath(config, dryRun ? 'previews' : 'snapshots', course.code, runId);
      const manifestPath = statePath(config, 'manifests', `${course.code}.json`);
      await ensureDirectory(snapshotDirectory);
      const previousManifest = await readJson(manifestPath, { files: [] });

      const page = await context.newPage();
      const fileLinks = new Map();
      const pageRecords = [];
      let contentRecords = [];
      let referer = course.url;
      const diagnostics = [];
      let scanError = null;
      try {
        onProgress({ stage: 'scan', course: course.code, message: `${course.code}: reading course structure and locating files` });
        const content = await readCoursePage(page, context, course.url, {
          timeoutMs: navigationTimeoutMs, requestTimeoutMs, diagnostics,
          onProgress: message => onProgress({ stage: 'scan', course: course.code, message: `${course.code}: ${message}` })
        });
        referer = content.referer;
        contentRecords = content.records;
        for (const link of content.files) fileLinks.set(link.href, link);
        pageRecords.push({ url: referer, title: await page.title(), contentItems: contentRecords.length, files: fileLinks.size, source: content.source });
        onProgress({ stage: 'files-found', course: course.code, message: `${course.code}: found ${fileLinks.size} material file${fileLinks.size === 1 ? '' : 's'}` });
      } catch (error) {
        scanError = { message: error.message.split('\n')[0], status: error.status ?? 0, endpoint: error.endpoint ?? null };
        onProgress({ stage: 'error', course: course.code, message: `${course.code}: check failed — ${scanError.message}` });
      } finally {
        // Diagnostics must survive failures. Do not save login forms or session-bearing URLs.
        await writeJson(path.join(snapshotDirectory, 'diagnostics.json'), { error: scanError, requests: diagnostics });
        await writeJson(path.join(snapshotDirectory, 'content-tree.json'), contentRecords);
        await page.close();
      }
      if (scanError) {
        runResults.push({ schemaVersion: 1, status: 'scan-error', error: scanError.message, httpStatus: scanError.status,
          course: { code: course.code, title: cleanCourseTitle, url: course.url }, files: [], diagnosticDirectory: snapshotDirectory });
        continue; // Keep previous manifests and local materials intact; continue other courses.
      }

      const files = [];
      const materialLinks = [...fileLinks.values()];
      for (const [index, link] of materialLinks.entries()) {
        const linkDirectory = path.join(outputDirectory, ...(link.pathSegments ?? []).map((segment) => sanitizeFileName(segment)));
        const decisionKey = fileDecisionKey(course.code, link.href);
        const action = normalizeFileAction(decisions?.[decisionKey]);
        onProgress({ stage: dryRun ? 'check-file' : 'download', course: course.code, message: `${course.code}: ${dryRun ? 'checking' : 'downloading'} ${index + 1}/${materialLinks.length} — ${link.title || path.basename(new URL(link.href).pathname)}` });
        try {
          const result = await downloadFile(context, link, linkDirectory, referer, {
            dryRun, verificationMode, cacheDirectory, cacheIndex, requestTimeoutMs, action, decisionKey,
            onProgress: message => onProgress({ stage: 'retry', course: course.code, message: `${course.code}: ${message}` })
          });
          if (result.file) result.file = path.relative(outputDirectory, path.join(linkDirectory, result.file));
          files.push(result);
          const sourceNote = result.fromCache ? ' (using cached copy)' : '';
          onProgress({ stage: 'downloaded', course: course.code, message: `${course.code}: ${result.status}${sourceNote} — ${result.file || link.title || 'material'}` });
        }
        catch (error) { files.push({ status: 'error', url: link.href, error: error.message, decisionKey }); onProgress({ stage: 'error', course: course.code, message: `${course.code}: error downloading ${link.title || 'material'} — ${error.message}` }); }
      }
      const manifest = {
        schemaVersion: 1,
        status: files.some(file => file.status === 'error' || file.status === 'skipped-non-file') ? 'partial-error' : 'complete',
        course: { code: course.code, title: cleanCourseTitle, url: course.url, resolvedUrl: referer },
        syncedAt: new Date().toISOString(),
        outputDirectory,
        pages: pageRecords,
        files,
        previousSync: previousManifest.syncedAt ?? null
      };
      if (!dryRun) {
        await writeJson(manifestPath, manifest);
        await writeJson(path.join(snapshotDirectory, 'pages.json'), pageRecords);
      }
      if (dryRun) await writeJson(cacheIndexPath, cacheIndex);
      runResults.push(manifest);
      onProgress({ stage: 'course-complete', course: course.code, message: `${course.code} ${cleanCourseTitle}: ${manifest.status} (${files.filter((file) => ['new', 'downloaded'].includes(file.status)).length} new, ${files.filter((file) => file.status === 'unchanged').length} unchanged, ${files.filter(file => ['error', 'skipped-non-file'].includes(file.status)).length} errors)` });
    }
  } finally {
    await context.close();
  }
  if (!dryRun) await writeJson(statePath(config, 'runs', `${runId}.json`), runResults);
  return runResults;
}
