import fs from 'node:fs/promises';
import path from 'node:path';
import { FILE_EXTENSIONS } from './constants.mjs';
import { launchBrowser } from './browser.mjs';
import { courseMaterialsPath, statePath } from './config.mjs';
import { courseTitleFromText } from './discover.mjs';
import {
  contentDispositionFileName, ensureDirectory, readJson, sanitizeFileName,
  sha256, stableId, timestampForFile, writeJson
} from './utils.mjs';

const FILE_HINT = /bbcswebdav|attachment|download|contentfile|resource\//i;
const ULTRA_COURSE_PATH = /\/ultra\/courses\/([^/]+)\/outline/i;

export function isLikelyFileLink(urlValue) {
  try {
    const url = new URL(urlValue);
    if (FILE_HINT.test(url.href)) return true;
    return FILE_EXTENSIONS.has(path.extname(url.pathname).toLowerCase());
  } catch { return false; }
}

function isCoursePageLink(urlValue, courseUrl) {
  try {
    const target = new URL(urlValue);
    const root = new URL(courseUrl);
    if (target.origin !== root.origin) return false;
    const courseId = root.pathname.match(/\/courses\/([^/?#]+)/i)?.[1];
    if (courseId && target.href.includes(courseId)) return true;
    return target.pathname.startsWith(root.pathname) && !isLikelyFileLink(target.href);
  } catch { return false; }
}

async function collectLinks(page) {
  return page.locator('a[href]').evaluateAll((anchors) => anchors.map((anchor) => ({
    href: anchor.href,
    text: (anchor.innerText || anchor.textContent || '').trim(),
    title: (anchor.getAttribute('download') || anchor.getAttribute('title') || anchor.getAttribute('aria-label') || '').trim()
  })).filter((link) => link.href));
}

function decodeHtmlEntities(value = '') {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

export function extractUltraFileLinks(content, baseUrl) {
  const links = [];
  const file = content?.contentDetail?.['resource/x-bb-file']?.file;
  if (file?.permanentUrl || file?.viewerUrl) {
    links.push({
      href: new URL(file.permanentUrl || file.viewerUrl, baseUrl).href,
      title: file.fileName || content.title || '',
      text: content.title || '',
      contentId: content.id
    });
  }

  const html = content?.body?.rawText || content?.body?.displayText || '';
  for (const match of html.matchAll(/<a\b[^>]*\bhref=(['"])(.*?)\1[^>]*>/gi)) {
    const tag = match[0];
    const href = decodeHtmlEntities(match[2]);
    if (!isLikelyFileLink(new URL(href, baseUrl).href)) continue;
    const name = tag.match(/(?:linkName|displayName)&quot;:&quot;(.*?)&quot;/i)?.[1];
    links.push({
      href: new URL(href, baseUrl).href,
      title: decodeHtmlEntities(name || content.title || ''),
      text: content.title || '',
      contentId: content.id
    });
  }
  return links;
}

async function getJson(context, url) {
  const response = await context.request.get(url, { failOnStatusCode: false, timeout: 60000 });
  if (!response.ok()) return { status: response.status(), body: null };
  return { status: response.status(), body: await response.json() };
}

async function collectUltraContent(context, baseUrl, courseId, maxItems = 1000) {
  const queue = [{ id: 'ROOT', pathSegments: [] }];
  const visited = new Set();
  const records = [];
  const files = new Map();
  while (queue.length && visited.size < maxItems) {
    const queued = queue.shift();
    if (visited.has(queued.id)) continue;
    visited.add(queued.id);
    const itemUrl = new URL(`/learn/api/v1/courses/${courseId}/contents/${queued.id}`, baseUrl).href;
    const detailResponse = await getJson(context, itemUrl);
    const content = detailResponse.body;
    if (!content) {
      records.push({ id: queued.id, status: detailResponse.status, path: queued.pathSegments });
      continue;
    }

    const isContainer = /^resource\/x-bb-(folder|lesson)$/i.test(content.contentHandler)
      || Object.values(content.contentDetail ?? {}).some((detail) => detail?.isFolder === true);
    const currentPath = isContainer && queued.id !== 'ROOT'
      ? [...queued.pathSegments, sanitizeFileName(content.title, content.id)]
      : queued.pathSegments;
    records.push({
      id: content.id,
      parentId: content.parentId ?? null,
      title: content.title,
      contentHandler: content.contentHandler,
      visibility: content.visibility,
      path: currentPath,
      body: content.body ?? null,
      contentDetail: content.contentDetail ?? null
    });
    for (const link of extractUltraFileLinks(content, baseUrl)) {
      files.set(link.href, { ...link, pathSegments: queued.pathSegments });
    }

    if (!isContainer) continue;
    let childrenUrl = `${itemUrl}/children?%40view=Summary&expand=assignedGroups,selfEnrollmentGroups.group,gradebookCategory&includeInActivityTracking=true&limit=100`;
    while (childrenUrl) {
      const childrenResponse = await getJson(context, childrenUrl);
      if (!childrenResponse.body) break;
      for (const child of childrenResponse.body.results ?? []) {
        queue.push({ id: child.id, pathSegments: currentPath });
      }
      const nextPage = childrenResponse.body.paging?.nextPage;
      childrenUrl = nextPage ? new URL(nextPage, baseUrl).href : null;
    }
  }
  return { records, files: [...files.values()] };
}

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

async function downloadFile(context, link, outputDirectory, referer, {
  dryRun = false,
  verificationMode = 'sha256',
  cacheDirectory = null,
  cacheIndex = {}
} = {}) {
  if (!dryRun) await ensureDirectory(outputDirectory);
  const cacheKey = stableId(link.href);
  let body;
  let headers = {};
  let fromCache = false;
  const cached = cacheIndex[cacheKey];
  if (!dryRun && cached?.path) {
    try {
      body = await fs.readFile(cached.path);
      headers = { 'content-type': cached.contentType ?? '' };
      fromCache = true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  if (body === undefined) {
    const response = await context.request.get(link.href, {
      headers: { Referer: referer },
      timeout: 60000,
      failOnStatusCode: false
    });
    if (!response.ok()) return { status: 'error', url: link.href, httpStatus: response.status() };
    headers = response.headers();
    body = await response.body();
  }
  const contentType = headers['content-type'] ?? '';
  if (/text\/html|application\/json/i.test(contentType) && !FILE_EXTENSIONS.has(path.extname(new URL(link.href).pathname).toLowerCase())) {
    return { status: 'skipped-non-file', url: link.href, contentType };
  }
  const digest = sha256(body);
  const headerName = contentDispositionFileName(headers['content-disposition']);
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
  const destination = await uniqueDestination(outputDirectory, candidateName, digest, verificationMode);
  if (!destination.unchanged && !dryRun) await fs.writeFile(destination.path, body);
  return {
    status: destination.unchanged ? 'unchanged' : destination.localModified ? 'local-modified' : dryRun ? 'new' : 'downloaded',
    url: link.href,
    file: path.relative(outputDirectory, destination.path),
    bytes: body.length,
    sha256: digest,
    contentType,
    fromCache,
    verificationMode
  };
}

export async function syncCourses(config, selectedCode = null, onProgress = () => {}, { dryRun = false } = {}) {
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
      if (!dryRun) await ensureDirectory(outputDirectory);
      await ensureDirectory(snapshotDirectory);
      const previousManifest = await readJson(manifestPath, { files: [] });

      const page = await context.newPage();
      const fileLinks = new Map();
      const pageRecords = [];
      let contentRecords = [];
      let referer = course.url;
      try {
        onProgress({ stage: 'scan', course: course.code, message: `${course.code}: reading course structure and locating files` });
        await page.goto(course.url, { waitUntil: 'domcontentloaded' });
        if (/idp\.kuleuven\.be|account\.kuleuven\.be/i.test(page.url())) {
          throw new Error('Toledo authorization has expired or is no longer accepted. Sign in to Toledo again, then retry.');
        }
        await page.waitForURL(ULTRA_COURSE_PATH, {
          timeout: config.sync?.navigationTimeoutMs ?? 45000,
          waitUntil: 'domcontentloaded'
        }).catch(() => {});
        const ultraMatch = page.url().match(ULTRA_COURSE_PATH);
        if (ultraMatch) {
          await page.waitForFunction(() => document.body.innerText.includes('Course Content'), null, {
            timeout: config.sync?.navigationTimeoutMs ?? 45000
          });
          referer = page.url();
          const ultra = await collectUltraContent(context, referer, ultraMatch[1]);
          contentRecords = ultra.records;
          for (const link of ultra.files) fileLinks.set(link.href, link);
          pageRecords.push({ url: referer, title: await page.title(), contentItems: contentRecords.length, files: fileLinks.size });
        } else {
          await page.waitForTimeout(config.sync?.settleTimeMs ?? 2500);
          const links = await collectLinks(page);
          pageRecords.push({ url: page.url(), title: await page.title(), links: links.length });
          for (const link of links) {
            if (isLikelyFileLink(link.href)) fileLinks.set(link.href, link);
          }
        }
        onProgress({ stage: 'files-found', course: course.code, message: `${course.code}: found ${fileLinks.size} material file${fileLinks.size === 1 ? '' : 's'}` });
        await fs.writeFile(path.join(snapshotDirectory, 'last-page.html'), await page.content(), 'utf8');
        await page.screenshot({ path: path.join(snapshotDirectory, 'last-page.png'), fullPage: true });
        await writeJson(path.join(snapshotDirectory, 'content-tree.json'), contentRecords);
      } finally {
        await page.close();
      }

      const files = [];
      const materialLinks = [...fileLinks.values()];
      for (const [index, link] of materialLinks.entries()) {
        const linkDirectory = path.join(outputDirectory, ...(link.pathSegments ?? []).map((segment) => sanitizeFileName(segment)));
        onProgress({ stage: dryRun ? 'check-file' : 'download', course: course.code, message: `${course.code}: ${dryRun ? 'checking' : 'downloading'} ${index + 1}/${materialLinks.length} — ${link.title || path.basename(new URL(link.href).pathname)}` });
        try {
          const result = await downloadFile(context, link, linkDirectory, referer, {
            dryRun, verificationMode, cacheDirectory, cacheIndex
          });
          if (result.file) result.file = path.relative(outputDirectory, path.join(linkDirectory, result.file));
          files.push(result);
          const sourceNote = result.fromCache ? ' (using cached copy)' : '';
          onProgress({ stage: 'downloaded', course: course.code, message: `${course.code}: ${result.status}${sourceNote} — ${result.file || link.title || 'material'}` });
        }
        catch (error) { files.push({ status: 'error', url: link.href, error: error.message }); onProgress({ stage: 'error', course: course.code, message: `${course.code}: error downloading ${link.title || 'material'} — ${error.message}` }); }
      }
      const manifest = {
        schemaVersion: 1,
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
      onProgress({ stage: 'course-complete', course: course.code, message: `${course.code} ${cleanCourseTitle}: complete (${files.filter((file) => file.status === 'downloaded').length} new, ${files.filter((file) => file.status === 'unchanged').length} unchanged)` });
    }
  } finally {
    await context.close();
  }
  if (!dryRun) await writeJson(statePath(config, 'runs', `${runId}.json`), runResults);
  return runResults;
}
