#!/usr/bin/env node
// Generates placeholder PNG icons for TabFlow using raw PNG encoding (no deps)
import { createWriteStream } from 'fs';
import { deflateSync } from 'zlib';
import { mkdirSync } from 'fs';

mkdirSync('public', { recursive: true });

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.concat([typeBytes, data]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(crcBuf));
  return Buffer.concat([len, typeBytes, data, crcVal]);
}

function makePNG(size) {
  const bg = [9, 11, 16];       // #090B10
  const accent = [62, 232, 137]; // #3EE889

  // Draw pixels
  const pixels = [];
  for (let y = 0; y < size; y++) {
    pixels.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      // Rounded rect background
      const cx = size / 2, cy = size / 2;
      const r = size * 0.42;
      const dx = x - cx + 0.5, dy = y - cy + 0.5;
      const inCircle = Math.sqrt(dx * dx + dy * dy) < r;

      // Lightning bolt shape (simplified)
      const nx = (x + 0.5) / size;
      const ny = (y + 0.5) / size;
      const inBolt = (
        (nx > 0.55 && nx < 0.75 && ny > 0.15 && ny < 0.5) ||
        (nx > 0.35 && nx < 0.65 && ny > 0.45 && ny < 0.6) ||
        (nx > 0.25 && nx < 0.45 && ny > 0.5 && ny < 0.85)
      );

      if (inCircle && inBolt) {
        pixels.push(...accent, 255);
      } else if (inCircle) {
        pixels.push(...bg, 255);
      } else {
        pixels.push(0, 0, 0, 0); // transparent
      }
    }
  }

  const rawData = Buffer.from(pixels);
  const compressed = deflateSync(rawData);

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [16, 48, 128]) {
  const png = makePNG(size);
  const ws = createWriteStream(`public/icon-${size}.png`);
  ws.write(png);
  ws.end();
  console.log(`Generated public/icon-${size}.png`);
}
