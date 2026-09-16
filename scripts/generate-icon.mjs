import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sizes = [16, 24, 32, 48, 64, 128, 256];

function roundedRect(x, y, width, height, radius, px, py) {
  const dx = Math.max(x + radius - px, 0, px - (x + width - radius));
  const dy = Math.max(y + radius - py, 0, py - (y + height - radius));
  return dx * dx + dy * dy <= radius * radius;
}

function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const scale = size / 256;
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const index = (y * size + x) * 4;
    pixels[index] = b; pixels[index + 1] = g; pixels[index + 2] = r; pixels[index + 3] = a;
  };
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const px = (x + 0.5) / scale; const py = (y + 0.5) / scale;
    if (roundedRect(12, 12, 232, 232, 52, px, py)) set(x, y, 0, 95, 158);
    if (roundedRect(51, 48, 112, 150, 18, px, py)) set(x, y, 255, 255, 255);
    if (px >= 137 && px <= 163 && py >= 48 && py <= 81 && py >= px - 89) set(x, y, 184, 228, 247);
    if ((px >= 70 && px <= 144 && py >= 86 && py <= 98) || (px >= 70 && px <= 144 && py >= 113 && py <= 125) || (px >= 70 && px <= 117 && py >= 140 && py <= 152)) set(x, y, 0, 95, 158);
  }
  const line = (x1, y1, x2, y2, thickness, color) => {
    const vx = x2 - x1; const vy = y2 - y1; const length = vx * vx + vy * vy;
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      const px = (x + .5) / scale; const py = (y + .5) / scale;
      const t = Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / length));
      const dx = px - (x1 + t * vx); const dy = py - (y1 + t * vy);
      if (dx * dx + dy * dy <= (thickness / 2) ** 2) set(x, y, ...color);
    }
  };
  line(181, 122, 195, 150, 15, [127, 224, 255]); line(195, 150, 187, 179, 15, [127, 224, 255]); line(187, 179, 161, 195, 15, [127, 224, 255]);
  line(75, 92, 88, 69, 15, [127, 224, 255]); line(88, 69, 113, 60, 15, [127, 224, 255]); line(113, 60, 141, 70, 15, [127, 224, 255]);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const px = (x + .5) / scale; const py = (y + .5) / scale;
    if (px >= 133 && px <= 160 && py >= 196 && py <= 217 && py >= -0.7 * px + 310) set(x, y, 127, 224, 255);
    if (px >= 97 && px <= 124 && py >= 39 && py <= 60 && py <= 0.7 * px - 28) set(x, y, 127, 224, 255);
  }
  const xor = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) pixels.copy(xor, (size - 1 - y) * size * 4, y * size * 4, (y + 1) * size * 4);
  const andMask = Buffer.alloc(Math.ceil(size / 32) * 4 * size);
  const header = Buffer.alloc(40); header.writeUInt32LE(40, 0); header.writeInt32LE(size, 4); header.writeInt32LE(size * 2, 8); header.writeUInt16LE(1, 12); header.writeUInt16LE(32, 14); header.writeUInt32LE(0, 16); header.writeUInt32LE(xor.length, 20);
  return Buffer.concat([header, xor, andMask]);
}

const images = sizes.map((size) => ({ size, data: drawIcon(size) }));
const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
let offset = 6 + images.length * 16;
const entries = images.map(({ size, data }) => { const entry = Buffer.alloc(16); entry[0] = size === 256 ? 0 : size; entry[1] = size === 256 ? 0 : size; entry.writeUInt16LE(1, 4); entry.writeUInt16LE(32, 6); entry.writeUInt32LE(data.length, 8); entry.writeUInt32LE(offset, 12); offset += data.length; return entry; });
await fs.writeFile(path.join(root, 'assets', 'toledo-sync.ico'), Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]));
