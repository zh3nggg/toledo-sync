import fs from 'node:fs/promises';
import path from 'node:path';
import { localSecretPath, materialsPath, statePath } from './config.mjs';
import { ask } from './prompt.mjs';
import { ensureDirectory, readJson, sha256, writeJson } from './utils.mjs';

export function unfoldIcs(text) {
  return text.replace(/\r?\n[ \t]/g, '');
}

function unescapeIcs(value = '') {
  return value.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

export function parseCalendarEvents(text) {
  const unfolded = unfoldIcs(text);
  const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) ?? [];
  return blocks.map((block) => {
    const event = {};
    for (const line of block.split(/\r?\n/)) {
      const separator = line.indexOf(':');
      if (separator < 0) continue;
      const rawKey = line.slice(0, separator);
      const value = line.slice(separator + 1);
      const key = rawKey.split(';')[0];
      if (['UID', 'SUMMARY', 'DESCRIPTION', 'DTSTART', 'DTEND', 'LOCATION', 'URL', 'LAST-MODIFIED'].includes(key)) {
        event[key.toLowerCase().replace('-', '_')] = unescapeIcs(value);
      }
    }
    return event;
  });
}

export async function setCalendarUrl(configPath) {
  const url = (await ask('粘贴 Toledo/Blackboard 的 Share Calendar 链接（仅保存在本机用户目录）：')).trim();
  if (!/^https:\/\//i.test(url)) throw new Error('Calendar URL must start with https://');
  const secretPath = localSecretPath(configPath);
  await writeJson(secretPath, { calendarUrl: url, updatedAt: new Date().toISOString() });
  try { await fs.chmod(secretPath, 0o600); } catch { /* Windows ACLs are managed by the user profile. */ }
  return secretPath;
}

export async function syncCalendar(config, configPath) {
  const secretPath = localSecretPath(configPath);
  const secret = await readJson(secretPath);
  if (!secret.calendarUrl) throw new Error('No calendar URL stored. Run set-calendar first.');
  const response = await fetch(secret.calendarUrl, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Calendar request failed: HTTP ${response.status}`);
  const body = await response.text();
  const events = parseCalendarEvents(body);
  const outputDirectory = materialsPath(config, '_calendar');
  await ensureDirectory(outputDirectory);
  await fs.writeFile(path.join(outputDirectory, 'toledo.ics'), body, 'utf8');
  await writeJson(path.join(outputDirectory, 'events.json'), events);
  const result = {
    syncedAt: new Date().toISOString(),
    sha256: sha256(Buffer.from(body)),
    eventCount: events.length,
    outputDirectory
  };
  await writeJson(statePath(config, 'calendar', 'last-sync.json'), result);
  return result;
}

