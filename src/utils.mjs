import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export function parseArgs(argv) {
  const positional = [];
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) {
      positional.push(value);
      continue;
    }
    const [rawKey, inlineValue] = value.slice(2).split('=', 2);
    if (inlineValue !== undefined) {
      options[rawKey] = inlineValue;
    } else if (argv[index + 1] && !argv[index + 1].startsWith('--')) {
      options[rawKey] = argv[index + 1];
      index += 1;
    } else {
      options[rawKey] = true;
    }
  }
  return { positional, options };
}

export function sanitizeFileName(value, fallback = 'unnamed') {
  const cleaned = String(value ?? '')
    .normalize('NFKC')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/[. ]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || fallback;
}

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function stableId(value) {
  return sha256(Buffer.from(String(value))).slice(0, 16);
}

export async function ensureDirectory(directory) {
  await fs.mkdir(directory, { recursive: true });
  return directory;
}

export async function writeJson(filePath, value) {
  await ensureDirectory(path.dirname(filePath));
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fs.rename(tempPath, filePath);
}

export async function readJson(filePath, fallback = undefined) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && fallback !== undefined) return fallback;
    throw error;
  }
}

export function contentDispositionFileName(header) {
  if (!header) return null;
  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8) {
    try { return decodeURIComponent(utf8[1].trim()); } catch { return utf8[1].trim(); }
  }
  const quoted = header.match(/filename="([^"]+)"/i);
  if (quoted) return quoted[1];
  const plain = header.match(/filename=([^;]+)/i);
  return plain ? plain[1].trim() : null;
}

export function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

