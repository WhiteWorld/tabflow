#!/usr/bin/env node
// Generates TabFlow PNG icons — browser tab window + clock design
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

// Signed distance to rounded rectangle
function sdRoundedRect(x, y, cx, cy, halfW, halfH, radius) {
  const dx = Math.abs(x - cx) - halfW + radius;
  const dy = Math.abs(y - cy) - halfH + radius;
  const outside = Math.sqrt(Math.max(dx, 0) ** 2 + Math.max(dy, 0) ** 2) - radius;
  const inside = Math.min(Math.max(dx, dy), 0);
  return outside + inside;
}

// Signed distance to a line segment (returns distance, not signed)
function sdSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt((px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2);
}

// Anti-aliased coverage
function coverage(dist, aaWidth = 1.0) {
  return Math.max(0, Math.min(1, 0.5 - dist / aaWidth));
}

function makePNG(size) {
  const S = size;
  const accent = [62, 232, 137];   // #3EE889
  const bgColor = [9, 11, 16];     // #090B10

  const cx = S / 2, cy = S / 2;

  // ── Background: rounded square ──
  const bgHalf = S * 0.44;
  const bgR = S * 0.20;

  // ── Browser window outline ──
  // The window is a rounded rect, drawn as a stroke (outline only)
  const winHalfW = S * 0.32;
  const winHalfH = S * 0.30;
  const winCx = cx;
  const winCy = cy + S * 0.04; // slightly below center to leave room for tab
  const winR = S * 0.06;
  const winStroke = S * 0.045;

  // ── Tab bar line (horizontal line separating tab bar from content) ──
  const tabBarY = winCy - winHalfH + S * 0.13;

  // ── Tab bump on top-left (small rounded rect protruding from top) ──
  const tabW = S * 0.14;   // half-width
  const tabH = S * 0.055;  // half-height
  const tabCx = winCx - winHalfW + S * 0.18;
  const tabCy = tabBarY - tabH;
  const tabR = S * 0.03;

  // (address bar removed)

  // ── Clock ──
  const clockCx = winCx;
  const clockCy = winCy + S * 0.07;
  const clockRadius = S * 0.155;
  const clockStroke = S * 0.035;

  // Clock hands
  const hourAngle = -Math.PI / 3; // ~10 o'clock position
  const hourLen = clockRadius * 0.5;
  const minuteAngle = Math.PI / 6; // ~2 o'clock position
  const minuteLen = clockRadius * 0.75;
  const handThick = S * 0.03;

  // 3x3 supersampling
  const SS = 3;

  const pixels = [];
  for (let y = 0; y < S; y++) {
    pixels.push(0); // filter byte
    for (let x = 0; x < S; x++) {
      let rT = 0, gT = 0, bT = 0, aT = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;

          // Background rounded rect
          const bgDist = sdRoundedRect(px, py, cx, cy, bgHalf, bgHalf, bgR);
          const bgCov = coverage(bgDist, 1.0);
          if (bgCov < 0.001) continue;

          let r = bgColor[0], g = bgColor[1], b = bgColor[2];

          // ── Browser window outline ──
          const winDist = sdRoundedRect(px, py, winCx, winCy, winHalfW, winHalfH, winR);
          const winOuter = coverage(winDist, 0.8);
          const winInner = coverage(winDist + winStroke, 0.8);
          const winFrame = winOuter * (1 - winInner);

          // ── Tab bump ──
          const tabDist = sdRoundedRect(px, py, tabCx, tabCy, tabW, tabH, tabR);
          const tabOuter = coverage(tabDist, 0.8);
          const tabInnerDist = sdRoundedRect(px, py, tabCx, tabCy, tabW - winStroke * 0.8, tabH - winStroke * 0.5, Math.max(tabR - winStroke * 0.3, 0.5));
          const tabInner = coverage(tabInnerDist, 0.8);
          const tabFrame = tabOuter * (1 - tabInner);

          // ── Tab bar horizontal line ──
          const barLineDist = Math.abs(py - tabBarY) - winStroke * 0.45;
          // Only draw within the window horizontally
          const inWinX = px > winCx - winHalfW + winStroke * 0.5 && px < winCx + winHalfW - winStroke * 0.5;
          const barLine = inWinX && py > tabBarY - winStroke && py < tabBarY + winStroke
            ? coverage(barLineDist, 0.8) : 0;

          // ── Clock circle (outline) ──
          const clockDist = Math.sqrt((px - clockCx) ** 2 + (py - clockCy) ** 2);
          const clockRingDist = Math.abs(clockDist - clockRadius) - clockStroke / 2;
          const clockRing = coverage(clockRingDist, 0.8);

          // ── Clock hour hand ──
          const hourEndX = clockCx + hourLen * Math.cos(hourAngle);
          const hourEndY = clockCy + hourLen * Math.sin(hourAngle);
          const hourDist = sdSegment(px, py, clockCx, clockCy, hourEndX, hourEndY);
          const hourHand = coverage(hourDist - handThick / 2, 0.8);

          // ── Clock minute hand ──
          const minEndX = clockCx + minuteLen * Math.cos(minuteAngle);
          const minEndY = clockCy + minuteLen * Math.sin(minuteAngle);
          const minDist = sdSegment(px, py, clockCx, clockCy, minEndX, minEndY);
          const minHand = coverage(minDist - handThick * 0.7 / 2, 0.8);

          // ── Clock center dot ──
          const dotDist = clockDist - handThick * 0.8;
          const dotCov = coverage(dotDist, 0.8);

          // Composite all green elements
          const fgCov = Math.min(1, Math.max(winFrame, tabFrame, barLine, clockRing, hourHand, minHand, dotCov));

          if (fgCov > 0) {
            r = r * (1 - fgCov) + accent[0] * fgCov;
            g = g * (1 - fgCov) + accent[1] * fgCov;
            b = b * (1 - fgCov) + accent[2] * fgCov;
          }

          rT += r * bgCov;
          gT += g * bgCov;
          bT += b * bgCov;
          aT += bgCov;
        }
      }

      const samples = SS * SS;
      if (aT > 0) {
        const finalA = aT / samples;
        pixels.push(
          Math.round(Math.min(255, rT / aT)),
          Math.round(Math.min(255, gT / aT)),
          Math.round(Math.min(255, bT / aT)),
          Math.round(Math.min(255, finalA * 255))
        );
      } else {
        pixels.push(0, 0, 0, 0);
      }
    }
  }

  const rawData = Buffer.from(pixels);
  const compressed = deflateSync(rawData);

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
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
  console.log(`Generated public/icon-${size}.png (${size}x${size})`);
}
