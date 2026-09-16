import fs from 'node:fs/promises';
import path from 'node:path';
import { launchBrowser } from './browser.mjs';
import { saveConfig, statePath } from './config.mjs';
import { ask } from './prompt.mjs';
import { ensureDirectory, normalizeText, timestampForFile, writeJson } from './utils.mjs';

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
  const { context, executablePath, profilePath } = await launchBrowser(config);
  try {
    const page = context.pages()[0] ?? await context.newPage();
    await page.goto(config.portalUrl, { waitUntil: 'domcontentloaded' });
    if (!options.auto) {
      await ask('在浏览器中完成登录并打开显示本学期课程列表的页面，然后回到此窗口按 Enter：');
    }
    await page.waitForTimeout(config.sync?.settleTimeMs ?? 2500);

    const links = await page.locator('a[href]').evaluateAll((anchors) => anchors.map((anchor) => ({
      href: anchor.href,
      text: (anchor.innerText || anchor.textContent || '').trim(),
      title: (anchor.getAttribute('aria-label') || anchor.getAttribute('title') || '').trim()
    })).filter((link) => link.href));

    const uniqueLinks = [...new Map(links.map((link) => [link.href, link])).values()];
    const matches = [];
    const coursesToDiscover = options.allCourses ? config.courses : config.courses.filter((item) => item.selected);
    for (const course of coursesToDiscover) {
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
    }
    await saveConfig(configPath, config);

    const runDirectory = statePath(config, 'discovery', timestampForFile());
    await ensureDirectory(runDirectory);
    await fs.writeFile(path.join(runDirectory, 'page.html'), await page.content(), 'utf8');
    await page.screenshot({ path: path.join(runDirectory, 'page.png'), fullPage: true });
    await writeJson(path.join(runDirectory, 'links.json'), uniqueLinks);
    await writeJson(path.join(runDirectory, 'matches.json'), matches);
    return { matches, runDirectory, executablePath, profilePath };
  } finally {
    await context.close();
  }
}
