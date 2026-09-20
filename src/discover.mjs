import fs from 'node:fs/promises';
import path from 'node:path';
import { launchBrowser } from './browser.mjs';
import { saveConfig, statePath } from './config.mjs';
import { ask } from './prompt.mjs';
import { ensureDirectory, normalizeText, timestampForFile, writeJson } from './utils.mjs';

const COURSE_CODE_PATTERN = /\b[A-Z]\d[A-Z0-9]{4,}\b/gi;
const COURSE_LINK_PATTERN = /learningUnits\/ultraLink|redirectType=nautilus&courseId=|\/ultra\/courses?\/|[?&](?:courseId|course_id)=/i;

export function extractCourseCode(value) {
  return String(value ?? '').match(COURSE_CODE_PATTERN)?.[0]?.toUpperCase() ?? null;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function courseTitleFromText(value, code) {
  let title = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (code) {
    const codePattern = new RegExp(`\\b${escapeRegExp(code)}\\b`, 'i');
    const match = codePattern.exec(title);
    if (match) {
      const beforeCode = title.slice(0, match.index).replace(/[\[\]]+\s*$/, '').trim();
      const afterCode = title.slice(match.index + match[0].length).replace(/^[\[\]]+\s*/, '');
      title = beforeCode || afterCode;
    }
  }
  // Toledo renders status, notification, timetable, room and accessibility
  // labels in the same course-card text. The actual course name comes first.
  title = title
    .split(/\[\s*(?:[x✓]|\d{4})?\s*\]|\bnew\s+update\b|\b\d{1,2}\s*\/\s*\d{1,2}\b|\bULTRA[- ]B[- ]KUL\b/i)[0]
    .replace(/\b\d{1,2}:\d{2}\b/g, ' ')
    .replace(/\b20\d{2}\s*[-/]\s*(?:20\d{2}|\d{2})\b/g, ' ')
    .replace(/\b\d{4}\b/g, ' ')
    .replace(/\b\d{1,3}[A-Z]?\s*\.\s*\d{1,3}\b/g, ' ')
    .replace(/\b\d{2,4}[A-Z]?\b/g, ' ')
    .replace(/^[\s|:;–—-]+|[\s|:;–—-]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return title || code || 'Toledo course';
}
export function discoverPortalCourses(links, academicYear) {
  const candidates = [];
  for (const link of links ?? []) {
    const haystack = `${link.text ?? ''} ${link.context ?? ''} ${link.title ?? ''} ${link.href ?? ''}`;
    const code = extractCourseCode(haystack);
    if (!code || !COURSE_LINK_PATTERN.test(String(link.href ?? ''))) continue;
    const years = extractAcademicYears(haystack);
    if (academicYear && years.length && !years.includes(academicYear)) continue;
    const titleSource = extractCourseCode(link.text) ? link.text : `${link.text ?? ''} ${link.context ?? ''} ${link.title ?? ''}`;
    const title = courseTitleFromText(titleSource, code);
    const isCourseEnrollment = /learningUnits\/ultraLink/i.test(link.href)
      || (/redirectType=nautilus&courseId=/i.test(link.href) && !/[?&]contentId=/i.test(link.href));
    const score = (years.includes(academicYear) ? 20 : 0)
      + (link.text ? 10 : 0)
      + (isCourseEnrollment ? 100 : 0);
    candidates.push({ code, title, academicYear: years[0] ?? academicYear, url: link.href, score, source: link });
  }
  const byCode = new Map();
  for (const candidate of candidates) {
    const previous = byCode.get(candidate.code);
    if (!previous || candidate.score > previous.score || (candidate.score === previous.score && candidate.title.length > previous.title.length)) {
      byCode.set(candidate.code, candidate);
    }
  }
  return [...byCode.values()]
    .sort((left, right) => left.title.localeCompare(right.title, undefined, { sensitivity: 'base' }))
    .map(({ score, source, ...course }, index) => ({ ...course, order: index + 1 }));
}

function apiCourseUrl(course, baseUrl) {
  const direct = (course.links ?? []).find((link) => /alternate|course|ultra/i.test(`${link.rel ?? ''} ${link.title ?? ''}`))?.href;
  if (direct) return new URL(direct, baseUrl).href;
  const id = course.id ?? course.courseId ?? course.pk1;
  return id ? new URL(`/ultra/courses/${encodeURIComponent(id)}/outline`, baseUrl).href : null;
}

export function discoverApiCourses(payload, baseUrl, academicYear = '') {
  const results = Array.isArray(payload?.results) ? payload.results : [];
  const courses = [];
  for (const enrollment of results) {
    const course = enrollment.course ?? enrollment;
    const haystack = JSON.stringify({
      externalId: course.externalId ?? enrollment.externalId,
      courseId: course.courseId ?? enrollment.courseId,
      name: course.name ?? course.title ?? enrollment.name,
      id: course.id ?? enrollment.id
    });
    const code = extractCourseCode(haystack);
    if (!code) continue;
    const years = extractAcademicYears(haystack);
    if (academicYear && years.length && !years.includes(academicYear)) continue;
    const title = courseTitleFromText(course.name ?? course.title ?? enrollment.name ?? code, code);
    const url = apiCourseUrl(course, baseUrl);
    if (!url) continue;
    courses.push({ code, title, academicYear: years[0] ?? academicYear, url, order: courses.length + 1 });
  }
  const byCode = new Map();
  for (const course of courses) {
    const previous = byCode.get(course.code);
    if (!previous || course.title.length > previous.title.length) byCode.set(course.code, course);
  }
  return [...byCode.values()].sort((left, right) => left.title.localeCompare(right.title, undefined, { sensitivity: 'base' }))
    .map((course, index) => ({ ...course, order: index + 1 }));
}

async function fetchApiJson(page, context, url) {
  // Once the directory page is open on the Ultra origin, page.fetch carries
  // exactly the same SSO cookies as the SPA. This is the reliable path for
  // installations where BrowserContext.request receives HTTP 401.
  try {
    const inPage = await page.evaluate(async (target) => {
      const response = await fetch(target, {
        credentials: 'include',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
      });
      let body = null;
      try { body = await response.json(); } catch { /* Non-JSON response. */ }
      return { status: response.status, body };
    }, url);
    if (inPage.status === 200 && inPage.body) return inPage.body;
    if (inPage.status !== 401) return { __status: inPage.status };
  } catch { /* Fall back to the context request below. */ }
  const response = await context.request.get(url, {
    failOnStatusCode: false,
    timeout: 30000,
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', Referer: page.url() }
  });
  if (!response.ok()) return { __status: response.status() };
  return response.json();
}

async function discoverApiCoursesForOrigin(page, context, origin, academicYear, report) {
  const memberships = [];
  const pageSize = 200;
  for (let offset = 0; ; offset += pageSize) {
    const endpoint = new URL('/learn/api/public/v1/users/me/courses', origin);
    endpoint.searchParams.set('limit', String(pageSize));
    endpoint.searchParams.set('offset', String(offset));
    const payload = await fetchApiJson(page, context, endpoint.href);
    if (payload?.__status) {
      report({ stage: 'discover', message: `Course API returned HTTP ${payload.__status}; keeping page-discovered courses.` });
      return [];
    }
    const pageResults = Array.isArray(payload?.results) ? payload.results : [];
    memberships.push(...pageResults);
    report({ stage: 'discover', message: `Course API page offset ${offset}: ${pageResults.length} memberships.` });
    if (pageResults.length < pageSize) break;
  }
  const courses = [];
  const seenIds = new Set();
  for (const membership of memberships) {
    const courseId = membership.courseId ?? membership.course?.id;
    if (!courseId || seenIds.has(courseId)) continue;
    seenIds.add(courseId);
    const detailUrl = new URL(`/learn/api/public/v1/courses/${encodeURIComponent(courseId)}`, origin).href;
    const details = await fetchApiJson(page, context, detailUrl);
    if (!details || details.__status) continue;
    const course = { ...details, id: details.id ?? courseId, courseId: details.courseId ?? membership.courseId };
    const extracted = discoverApiCourses({ results: [course] }, origin, academicYear);
    if (extracted[0]) courses.push(extracted[0]);
  }
  report({ stage: 'discover', message: `Course API returned ${courses.length} enrolled courses.` });
  return courses;
}

async function collectPortalLinks(page) {
  let previousLinkCount = -1;
  let stableRounds = 0;
  for (let round = 0; round < 12 && stableRounds < 2; round += 1) {
    const linkCount = await page.locator('[href]').count();
    stableRounds = linkCount === previousLinkCount ? stableRounds + 1 : 0;
    previousLinkCount = linkCount;
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      for (const element of document.querySelectorAll('*')) {
        if (element.scrollHeight > element.clientHeight + 80) element.scrollTop = element.scrollHeight;
      }
    });
    await page.waitForTimeout(500);
  }
  return page.locator('[href]').evaluateAll((anchors) => anchors.map((anchor) => {
    const ownText = (anchor.innerText || anchor.textContent || '').trim();
    const container = anchor.closest('[data-testid*="course" i], [class*="course" i], li, article')
      ?? anchor.parentElement;
    const containerText = (container?.innerText || '').trim();
    return {
      href: anchor.href || anchor.getAttribute('href') || anchor.getAttribute('data-href'),
      text: ownText,
      context: containerText,
      title: (anchor.getAttribute('aria-label') || anchor.getAttribute('title') || '').trim()
    };
  }).filter((link) => link.href));
}

function courseDirectoryLink(links) {
  return links.find((link) => {
    try {
      const url = new URL(link.href);
      const label = `${link.text ?? ''} ${link.title ?? ''}`;
      return /\/ultra\/courses\/?$/i.test(url.pathname)
        || (/\b(courses|cursussen|cours)\b/i.test(label) && /\/ultra\//i.test(url.pathname));
    } catch { return false; }
  })?.href ?? null;
}

export function scoreCourseLink(course, link) {
  const haystack = normalizeText(`${link.text} ${link.title} ${link.href}`);
  if (!haystack) return 0;
  const explicitYears = extractAcademicYears(`${link.text} ${link.title} ${link.href}`);
  if (course.academicYear && explicitYears.length && !explicitYears.includes(course.academicYear)) return 0;
  const normalizedCode = normalizeText(course.code);
  let score = haystack.includes(normalizedCode) ? 100 : 0;
  for (const alias of [course.title, ...(course.aliases ?? [])]) {
    const normalizedAlias = normalizeText(alias);
    if (normalizedAlias && haystack.includes(normalizedAlias)) score = Math.max(score, 70);
    const importantWords = normalizedAlias.split(' ').filter((word) => word.length >= 5);
    const hits = importantWords.filter((word) => haystack.includes(word)).length;
    if (importantWords.length >= 2 && hits >= Math.ceil(importantWords.length * 0.7)) {
      score = Math.max(score, 30 + hits);
    }
  }
  if (/\/ultra\/courses\/|course_id=|\/courses\//i.test(link.href)) score += 10;
  return score;
}

export function extractAcademicYears(value) {
  const years = new Set();
  const text = String(value ?? '');
  for (const match of text.matchAll(/\b(20\d{2})\s*[-/]\s*(20\d{2}|\d{2})\b/g)) {
    const start = Number(match[1]);
    const rawEnd = Number(match[2]);
    const end = rawEnd < 100 ? Math.floor(start / 100) * 100 + rawEnd : rawEnd;
    years.add(`${start}-${end}`);
  }
  for (const match of text.matchAll(/\b(\d{2})(\d{2})\b/g)) {
    const start = 2000 + Number(match[1]);
    const end = 2000 + Number(match[2]);
    if (end === start + 1) years.add(`${start}-${end}`);
  }
  return [...years];
}

export async function discoverCourses(config, configPath, options = {}) {
  const report = typeof options.onProgress === 'function' ? options.onProgress : () => {};
  const { context, executablePath, profilePath } = await launchBrowser(config);
  try {
    const page = context.pages()[0] ?? await context.newPage();
    report({ stage: 'discover', message: 'Opening Toledo course list…' });
    await page.goto(config.portalUrl, { waitUntil: 'domcontentloaded' });
    if (!options.auto) {
      await ask('在浏览器中完成登录并打开显示本学期课程列表的页面，然后回到此窗口按 Enter：');
    }
    await page.waitForTimeout(config.sync?.settleTimeMs ?? 2500);

    let links = await collectPortalLinks(page);
    const initialUniqueLinks = [...new Map(links.map((link) => [link.href, link])).values()];
    const initialDirectory = courseDirectoryLink(initialUniqueLinks);
    let directoryUrl = initialDirectory;
    if (!directoryUrl) {
      const ultraOrigin = initialUniqueLinks.map((link) => {
        try { return new URL(link.href); } catch { return null; }
      }).find((url) => /ultra|blackboard/i.test(url?.hostname ?? ''))?.origin;
      if (ultraOrigin) directoryUrl = new URL('/ultra/courses', ultraOrigin).href;
    }
    if (directoryUrl && directoryUrl !== page.url()) {
      report({ stage: 'discover', message: 'Opening the full Toledo course directory…' });
      await page.goto(directoryUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForTimeout(config.sync?.settleTimeMs ?? 2500);
      links = [...links, ...(await collectPortalLinks(page))];
    }
    const uniqueLinks = [...new Map(links.map((link) => [link.href, link])).values()];
    report({ stage: 'discover', message: `Read ${uniqueLinks.length} unique links after loading the complete course list.` });
    // Course discovery is intentionally unrestricted. Academic-year filtering
    // belongs to an explicit CLI selection step, never to the GUI's source
    // enumeration; stale config must not hide courses returned by Toledo.
    const academicYear = '';
    const pageCourses = discoverPortalCourses(uniqueLinks, academicYear);
    const ultraOrigin = uniqueLinks.map((link) => {
      try { return new URL(link.href); } catch { return null; }
    }).find((url) => /ultra|blackboard/i.test(url?.hostname ?? ''))?.origin;
    let apiCourses = [];
    if (ultraOrigin) {
      try { apiCourses = await discoverApiCoursesForOrigin(page, context, ultraOrigin, academicYear, report); }
      catch (error) { report({ stage: 'discover', message: `Course API unavailable (${error.message}); keeping page-discovered courses.` }); }
    }
    const byCode = new Map(pageCourses.map((course) => [course.code, course]));
    for (const course of apiCourses) byCode.set(course.code, { ...byCode.get(course.code), ...course });
    const portalCourses = [...byCode.values()].sort((left, right) => left.title.localeCompare(right.title, undefined, { sensitivity: 'base' }))
      .map((course, index) => ({ ...course, order: index + 1 }));
    report({ stage: 'discover', message: `Course list loaded; found ${portalCourses.length} Toledo courses: ${portalCourses.map((course) => course.code).join(', ') || 'none'}` });
    const previousByCode = new Map(config.courses.map((course) => [course.code.toUpperCase(), course]));
    const discoveredCourses = portalCourses.map((course) => {
      const previous = previousByCode.get(course.code.toUpperCase());
      return {
        ...course,
        term: previous?.term ?? `${academicYear}-toledo`,
        aliases: [...new Set([...(previous?.aliases ?? []), course.title])],
        selected: academicYear ? previous?.academicYear === academicYear && Boolean(previous.selected) : Boolean(previous?.selected),
        url: course.url
      };
    });
    // A transient empty page (for example while Toledo is still loading) must
    // never erase the last known course list. A non-empty result is the only
    // point at which the configured list is replaced.
    if (discoveredCourses.length) config.courses = discoveredCourses;
    const matches = [];
    const coursesToDiscover = options.allCourses ? config.courses : config.courses.filter((item) => item.selected);
    for (const course of coursesToDiscover) {
      report({ stage: 'course', course: course.code, message: `Checking ${course.code} ${course.title}…` });
      const previousUrl = course.url;
      const ranked = uniqueLinks
        .map((link) => ({ ...link, score: scoreCourseLink(course, link) }))
        .filter((link) => link.score > 0)
        .sort((left, right) => right.score - left.score);
      const safeCandidates = ranked.filter((candidate) => candidate.score >= 70);
      const preferred = safeCandidates.find((candidate) => /learningUnits\/ultraLink\?batchUid=/i.test(candidate.href))
        ?? safeCandidates.find((candidate) => /redirectType=nautilus&courseId=/i.test(candidate.href))
        ?? safeCandidates[0];
      if (preferred) {
        course.url = preferred.href;
      } else if (options.clearMissing) {
        course.url = null;
      }
      matches.push({
        code: course.code,
        selectedUrl: course.url,
        previousUrl,
        status: preferred ? 'matched' : previousUrl ? 'retained-previous-match' : 'not-found',
        candidates: ranked.slice(0, 5)
      });
      report({ stage: 'course-result', course: course.code, message: `${course.code}: ${preferred ? 'current-year link found' : previousUrl ? 'kept previous link' : 'no current-year link found'}` });
    }
    await saveConfig(configPath, config);

    const runDirectory = statePath(config, 'discovery', timestampForFile());
    await ensureDirectory(runDirectory);
    await fs.writeFile(path.join(runDirectory, 'page.html'), await page.content(), 'utf8');
    await page.screenshot({ path: path.join(runDirectory, 'page.png'), fullPage: true });
    await writeJson(path.join(runDirectory, 'links.json'), uniqueLinks);
    await writeJson(path.join(runDirectory, 'matches.json'), matches);
    await writeJson(path.join(runDirectory, 'courses.json'), discoveredCourses);
    return { matches, courses: discoveredCourses, runDirectory, executablePath, profilePath };
  } finally {
    await context.close();
  }
}
