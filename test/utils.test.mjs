import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseCalendarEvents } from '../src/calendar.mjs';
import { courseMaterialsPath, createConfig } from '../src/config.mjs';
import { courseTitleFromText, discoverPortalCourses, extractAcademicYears, extractCourseCode, scoreCourseLink } from '../src/discover.mjs';
import { extractUltraFileLinks, isLikelyFileLink, uniqueDestination } from '../src/sync.mjs';
import { sanitizeFileName } from '../src/utils.mjs';

test('uses the selected download directory as the exact course root', () => {
  const outputRoot = path.resolve('chosen-download-root');
  const config = createConfig(path.resolve('vault'), { outputRoot });
  assert.equal(config.download.outputRoot, outputRoot);
  assert.throws(() => createConfig(path.resolve('vault')), /--output/);
});

test('allows direct course materials or a named materials subfolder', () => {
  const vault = path.resolve('vault');
  const direct = createConfig(vault, { outputRoot: path.resolve('downloads'), materialsPlacement: 'course-root' });
  assert.equal(courseMaterialsPath(direct, 'G0S96A Groups and Symmetries'), path.join(direct.download.outputRoot, 'G0S96A Groups and Symmetries'));
  const nested = createConfig(vault, { outputRoot: path.resolve('downloads'), materialsPlacement: 'subdirectory', materialsFolderName: 'Toledo materials' });
  assert.equal(courseMaterialsPath(nested, 'G0S96A Groups and Symmetries'), path.join(nested.download.outputRoot, 'G0S96A Groups and Symmetries', 'Toledo materials'));
  assert.throws(() => createConfig(vault, { outputRoot: path.resolve('downloads'), materialsFolderName: '../outside' }), /single, non-empty/);
});

test('plans a hash-suffixed copy when a local file was edited', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'toledo-plan-'));
  try {
    await fs.writeFile(path.join(directory, 'lecture.pdf'), 'local edit');
    const destination = await uniqueDestination(directory, 'lecture.pdf', 'a'.repeat(64));
    assert.equal(destination.unchanged, false);
    assert.equal(destination.localModified, true);
    assert.match(destination.path, /lecture-a{8}\.pdf$/);
    assert.equal(await fs.readFile(path.join(directory, 'lecture.pdf'), 'utf8'), 'local edit');
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});

test('sanitizes cross-platform filenames', () => {
  assert.equal(sanitizeFileName('Week 1: Intro?.pdf'), 'Week 1_ Intro_.pdf');
});

test('recognizes Blackboard and ordinary file links', () => {
  assert.equal(isLikelyFileLink('https://example.edu/file/lecture.pdf'), true);
  assert.equal(isLikelyFileLink('https://example.edu/bbcswebdav/xid-123'), true);
  assert.equal(isLikelyFileLink('https://example.edu/course/home'), false);
});

test('extracts direct and embedded Ultra files', () => {
  const direct = extractUltraFileLinks({
    id: '_2_1', title: 'Sheet.pdf',
    contentDetail: { 'resource/x-bb-file': { file: { permanentUrl: '/bbcswebdav/xid-2', fileName: 'Sheet.pdf' } } }
  }, 'https://ultra.example/outline');
  assert.equal(direct[0].href, 'https://ultra.example/bbcswebdav/xid-2');
  assert.equal(direct[0].title, 'Sheet.pdf');

  const embedded = extractUltraFileLinks({
    id: '_3_1', title: 'Document', body: {
      rawText: '<a data-bbfile="{&quot;linkName&quot;:&quot;Notes.pdf&quot;}" href="/bbcswebdav/xid-3?x=1&amp;y=2"></a>'
    }
  }, 'https://ultra.example/outline');
  assert.equal(embedded[0].href, 'https://ultra.example/bbcswebdav/xid-3?x=1&y=2');
  assert.equal(embedded[0].title, 'Notes.pdf');
});

test('matches course links by code before title', () => {
  const course = { code: 'G0S96A', title: 'Groups and Symmetries', aliases: [], academicYear: '2026-2027' };
  assert.ok(scoreCourseLink(course, { text: 'G0S96A Groups and Symmetries', title: '', href: 'https://example.edu/ultra/courses/1' }) >= 100);
});

test('extracts and enforces explicit academic years', () => {
  assert.deepEqual(extractAcademicYears('Academic year 2026/27'), ['2026-2027']);
  assert.deepEqual(extractAcademicYears('ULTRA-B-KUL-G0S83a-2526'), ['2025-2026']);
  const course = { code: 'G0S96A', title: 'Groups and Symmetries', aliases: [], academicYear: '2026-2027' };
  assert.equal(scoreCourseLink(course, { text: '2025-2026 G0S96A Groups and Symmetries', title: '', href: 'https://example.edu/ultra/courses/old' }), 0);
});

test('enumerates Toledo course links instead of relying on the bundled course list', () => {
  const links = [
    { href: 'https://toledo.example/learningUnits/ultraLink?batchUid=abc', text: 'H0G03A Emergent Quantum Phenomena 2025-2026', title: '' },
    { href: 'https://toledo.example/learningUnits/ultraLink?batchUid=def', text: 'G0R16A Semiconductor Physics 2026-2027', title: '' },
    { href: 'https://toledo.example/portal/calendar', text: 'Calendar', title: '' },
    { href: 'https://toledo.example/learningUnits/ultraLink?batchUid=old', text: 'H0G03A Emergent Quantum Phenomena 2024-2025', title: '' }
  ];
  assert.equal(extractCourseCode(links[0].text), 'H0G03A');
  assert.equal(courseTitleFromText(links[0].text, 'H0G03A'), 'Emergent Quantum Phenomena');
  const courses = discoverPortalCourses(links, '2025-2026');
  assert.deepEqual(courses.map((course) => course.code), ['H0G03A']);
  assert.equal(courses[0].url, links[0].href);
});

test('parses folded iCalendar events', () => {
  const events = parseCalendarEvents('BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:1\r\nSUMMARY:Problem set\r\nDESCRIPTION:Line one\\nLine two\r\nDTSTART:20261001T120000Z\r\nEND:VEVENT\r\nEND:VCALENDAR');
  assert.equal(events.length, 1);
  assert.equal(events[0].summary, 'Problem set');
  assert.equal(events[0].description, 'Line one\nLine two');
});
