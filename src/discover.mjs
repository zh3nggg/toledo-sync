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

export function courseTitleFromText(value, code) {
  let title = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (code) title = title.replace(new RegExp(`\\b${code}\\b`, 'ig'), ' ');
  title = title.replace(/\b20\d{2}\s*[-/]\s*(?:20\d{2}|\d{2})\b/g, ' ')
    .replace(/\b\d{4}\b/g, ' ')
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
    const score = (years.includes(academicYear) ? 20 : 0)
      + (link.text ? 10 : 0)
      + (/learningUnits\/ultraLink|redirectType=nautilus&courseId=/i.test(link.href) ? 20 : 0);
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

    const links = await page.locator('a[href]').evaluateAll((anchors) => anchors.map((anchor) => {
      const ownText = (anchor.innerText || anchor.textContent || '').trim();
      const container = anchor.closest('[data-testid*="course" i], [class*="course" i], li, article')
        ?? anchor.parentElement;
      const containerText = (container?.innerText || '').trim();
      return {
        href: anchor.href,
        text: ownText,
        context: containerText,
        title: (anchor.getAttribute('aria-label') || anchor.getAttribute('title') || '').trim()
      };
    }).filter((link) => link.href));

    const uniqueLinks = [...new Map(links.map((link) => [link.href, link])).values()];
    const academicYear = config.filters?.academicYears?.[0] ?? '';
    const portalCourses = discoverPortalCourses(uniqueLinks, academicYear);
    report({ stage: 'discover', message: `Course list loaded; found ${portalCourses.length} Toledo courses for ${academicYear || 'the selected year'}` });
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
