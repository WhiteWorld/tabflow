#!/usr/bin/env node
// Generates Chrome Web Store promotional screenshots (1280×800)
import { createWriteStream } from 'fs';
import { deflateSync } from 'zlib';
import { mkdirSync } from 'fs';

mkdirSync('screenshots', { recursive: true });

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

function sdRoundedRect(x, y, cx, cy, halfW, halfH, radius) {
  const dx = Math.abs(x - cx) - halfW + radius;
  const dy = Math.abs(y - cy) - halfH + radius;
  const outside = Math.sqrt(Math.max(dx, 0) ** 2 + Math.max(dy, 0) ** 2) - radius;
  const inside = Math.min(Math.max(dx, dy), 0);
  return outside + inside;
}

function coverage(dist, aa = 1.5) {
  return Math.max(0, Math.min(1, 0.5 - dist / aa));
}

// Simple 5x7 pixel font for uppercase letters, digits, and symbols
const FONT = {
  'T': ['11111','00100','00100','00100','00100','00100','00100'],
  'A': ['01110','10001','10001','11111','10001','10001','10001'],
  'B': ['11110','10001','10001','11110','10001','10001','11110'],
  'F': ['11111','10000','10000','11110','10000','10000','10000'],
  'L': ['10000','10000','10000','10000','10000','10000','11111'],
  'O': ['01110','10001','10001','10001','10001','10001','01110'],
  'W': ['10001','10001','10001','10101','10101','11011','10001'],
  'S': ['01111','10000','10000','01110','00001','00001','11110'],
  'M': ['10001','11011','10101','10101','10001','10001','10001'],
  'R': ['11110','10001','10001','11110','10100','10010','10001'],
  'C': ['01110','10001','10000','10000','10000','10001','01110'],
  'E': ['11111','10000','10000','11110','10000','10000','11111'],
  'I': ['01110','00100','00100','00100','00100','00100','01110'],
  'N': ['10001','11001','10101','10011','10001','10001','10001'],
  'D': ['11100','10010','10001','10001','10001','10010','11100'],
  'G': ['01110','10001','10000','10111','10001','10001','01110'],
  'H': ['10001','10001','10001','11111','10001','10001','10001'],
  'K': ['10001','10010','10100','11000','10100','10010','10001'],
  'P': ['11110','10001','10001','11110','10000','10000','10000'],
  'U': ['10001','10001','10001','10001','10001','10001','01110'],
  'V': ['10001','10001','10001','10001','01010','01010','00100'],
  'Y': ['10001','10001','01010','00100','00100','00100','00100'],
  'X': ['10001','01010','00100','00100','00100','01010','10001'],
  'Z': ['11111','00001','00010','00100','01000','10000','11111'],
  'J': ['00111','00010','00010','00010','00010','10010','01100'],
  'Q': ['01110','10001','10001','10001','10101','10010','01101'],
  ' ': ['00000','00000','00000','00000','00000','00000','00000'],
  '-': ['00000','00000','00000','11111','00000','00000','00000'],
  '.': ['00000','00000','00000','00000','00000','01100','01100'],
  ',': ['00000','00000','00000','00000','00000','00100','01000'],
  '+': ['00000','00100','00100','11111','00100','00100','00000'],
  '0': ['01110','10001','10011','10101','11001','10001','01110'],
  '1': ['00100','01100','00100','00100','00100','00100','01110'],
  '7': ['11111','00001','00010','00100','01000','01000','01000'],
  '/': ['00001','00010','00010','00100','01000','01000','10000'],
};

function drawText(pixels, W, text, startX, startY, scale, color) {
  const chars = text.toUpperCase().split('');
  let cursorX = startX;
  for (const ch of chars) {
    const glyph = FONT[ch];
    if (!glyph) { cursorX += 4 * scale; continue; }
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row][col] === '1') {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const px = cursorX + col * scale + sx;
              const py = startY + row * scale + sy;
              if (px >= 0 && px < W && py >= 0) {
                const idx = py * W + px;
                pixels[idx] = color;
              }
            }
          }
        }
      }
    }
    cursorX += 6 * scale;
  }
  return cursorX;
}

function makePNG(W, H) {
  const bg1 = [9, 11, 16];
  const bg2 = [18, 22, 32];
  const accent = [62, 232, 137];
  const white = [255, 255, 255];
  const dimWhite = [180, 185, 195];
  const subtleWhite = [120, 125, 135];

  // Pixel buffer (flat array of [r,g,b])
  const pixelColors = new Array(W * H);

  // Fill background with subtle gradient
  for (let y = 0; y < H; y++) {
    const t = y / H;
    for (let x = 0; x < W; x++) {
      pixelColors[y * W + x] = [
        Math.round(bg1[0] * (1 - t) + bg2[0] * t),
        Math.round(bg1[1] * (1 - t) + bg2[1] * t),
        Math.round(bg1[2] * (1 - t) + bg2[2] * t),
      ];
    }
  }

  // Draw accent glow circle (top right area, subtle)
  const glowCx = W * 0.78, glowCy = H * 0.3, glowR = 300;
  for (let y = Math.max(0, Math.floor(glowCy - glowR)); y < Math.min(H, Math.ceil(glowCy + glowR)); y++) {
    for (let x = Math.max(0, Math.floor(glowCx - glowR)); x < Math.min(W, Math.ceil(glowCx + glowR)); x++) {
      const dist = Math.sqrt((x - glowCx) ** 2 + (y - glowCy) ** 2);
      if (dist < glowR) {
        const intensity = 0.04 * (1 - dist / glowR) ** 2;
        const idx = y * W + x;
        const c = pixelColors[idx];
        pixelColors[idx] = [
          Math.min(255, Math.round(c[0] + accent[0] * intensity)),
          Math.min(255, Math.round(c[1] + accent[1] * intensity)),
          Math.min(255, Math.round(c[2] + accent[2] * intensity)),
        ];
      }
    }
  }

  // ── Left side: Text content ──

  // Logo icon area (small rounded rect)
  const logoX = 100, logoY = 160, logoSize = 48, logoR = 12;
  for (let y = logoY; y < logoY + logoSize; y++) {
    for (let x = logoX; x < logoX + logoSize; x++) {
      const d = sdRoundedRect(x, y, logoX + logoSize/2, logoY + logoSize/2, logoSize/2, logoSize/2, logoR);
      const c = coverage(d);
      if (c > 0) {
        const idx = y * W + x;
        const bg = pixelColors[idx];
        pixelColors[idx] = [
          Math.round(bg[0] * (1 - c) + accent[0] * c),
          Math.round(bg[1] * (1 - c) + accent[1] * c),
          Math.round(bg[2] * (1 - c) + accent[2] * c),
        ];
      }
    }
  }

  // Title: TABFLOW
  drawText(pixelColors, W, 'TABFLOW', logoX + logoSize + 20, logoY + 6, 5, accent);

  // Tagline
  drawText(pixelColors, W, 'SMART TAB LIFECYCLE', 100, 260, 3, white);
  drawText(pixelColors, W, 'MANAGER', 100, 295, 3, white);

  // Features
  const features = [
    'AUTO-CLOSE INACTIVE TABS',
    'ALWAYS RECOVERABLE - 7 DAYS',
    'AI-POWERED ANALYSIS',
    'QUICK SETUP IN 30 SECONDS',
  ];

  const featureStartY = 380;
  features.forEach((text, i) => {
    const y = featureStartY + i * 50;
    // Bullet dot
    const dotCx = 115, dotCy = y + 10;
    for (let dy = -5; dy <= 5; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        if (dx*dx + dy*dy <= 25) {
          const px = dotCx + dx, py = dotCy + dy;
          if (px >= 0 && px < W && py >= 0 && py < H) {
            pixelColors[py * W + px] = accent;
          }
        }
      }
    }
    drawText(pixelColors, W, text, 135, y, 2, dimWhite);
  });

  // Version
  drawText(pixelColors, W, 'V0.1.0', 100, 620, 2, subtleWhite);

  // ── Right side: Simulated popup UI ──
  // Draw a rounded rect representing the popup
  const popW = 360, popH = 520;
  const popCx = W - 240, popCy = H / 2 + 20;
  const popR = 16;

  for (let y = Math.max(0, popCy - popH/2 - 2); y < Math.min(H, popCy + popH/2 + 2); y++) {
    for (let x = Math.max(0, popCx - popW/2 - 2); x < Math.min(W, popCx + popW/2 + 2); x++) {
      const d = sdRoundedRect(x, y, popCx, popCy, popW/2, popH/2, popR);
      const c = coverage(d);
      if (c > 0) {
        const idx = y * W + x;
        const bg = pixelColors[idx];
        const cardBg = [22, 26, 36];
        pixelColors[idx] = [
          Math.round(bg[0] * (1 - c) + cardBg[0] * c),
          Math.round(bg[1] * (1 - c) + cardBg[1] * c),
          Math.round(bg[2] * (1 - c) + cardBg[2] * c),
        ];
      }
    }
  }

  // Popup top bar
  const barY = popCy - popH/2 + 16;
  drawText(pixelColors, W, 'TABFLOW', popCx - popW/2 + 20, barY, 2, accent);

  // Tab pills: NOW  SOON  PAST
  const pillY = barY + 40;
  const pillNames = ['NOW', 'SOON', 'PAST'];
  let pillX = popCx - popW/2 + 20;
  pillNames.forEach((name, i) => {
    const isActive = i === 0;
    const pw = name.length * 12 + 16;
    const ph = 24;
    // Draw pill background
    for (let y = pillY; y < pillY + ph; y++) {
      for (let x = pillX; x < pillX + pw; x++) {
        const d = sdRoundedRect(x, y, pillX + pw/2, pillY + ph/2, pw/2, ph/2, ph/2);
        const c = coverage(d);
        if (c > 0) {
          const idx = y * W + x;
          const bg = pixelColors[idx];
          const col = isActive ? [accent[0]*0.15, accent[1]*0.15, accent[2]*0.15] : [40, 44, 54];
          pixelColors[idx] = [
            Math.min(255, Math.round(bg[0] * (1 - c) + col[0] * c + (isActive ? 8 : 0))),
            Math.min(255, Math.round(bg[1] * (1 - c) + col[1] * c + (isActive ? 24 : 0))),
            Math.min(255, Math.round(bg[2] * (1 - c) + col[2] * c + (isActive ? 12 : 0))),
          ];
        }
      }
    }
    drawText(pixelColors, W, name, pillX + 8, pillY + 5, 2, isActive ? accent : subtleWhite);
    pillX += pw + 12;
  });

  // Simulated tab rows
  const rowStartY = pillY + 50;
  const rowH = 52;
  const tabs = [
    { title: 'GITHUB.COM', sub: 'PULL REQUEST ..' },
    { title: 'STACKOVERFLOW', sub: 'TYPESCRIPT ...' },
    { title: 'DOCS.GOOGLE', sub: 'MEETING NOTES' },
    { title: 'REDDIT.COM', sub: 'FRONT PAGE' },
    { title: 'YOUTUBE.COM', sub: 'TUTORIAL ...' },
  ];

  tabs.forEach((tab, i) => {
    const ry = rowStartY + i * (rowH + 8);
    const rx = popCx - popW/2 + 16;
    const rw = popW - 32;
    // Row background
    for (let y = ry; y < ry + rowH; y++) {
      for (let x = rx; x < rx + rw; x++) {
        const d = sdRoundedRect(x, y, rx + rw/2, ry + rowH/2, rw/2, rowH/2, 9);
        const c = coverage(d);
        if (c > 0) {
          const idx = y * W + x;
          const bg = pixelColors[idx];
          const rowBg = [28, 32, 42];
          pixelColors[idx] = [
            Math.round(bg[0] * (1-c) + rowBg[0] * c),
            Math.round(bg[1] * (1-c) + rowBg[1] * c),
            Math.round(bg[2] * (1-c) + rowBg[2] * c),
          ];
        }
      }
    }
    // Favicon placeholder (small rounded square)
    const favX = rx + 14, favY = ry + 14, favS = 24;
    for (let y = favY; y < favY + favS; y++) {
      for (let x = favX; x < favX + favS; x++) {
        const d = sdRoundedRect(x, y, favX+favS/2, favY+favS/2, favS/2, favS/2, 5);
        const c = coverage(d);
        if (c > 0) {
          const idx = y * W + x;
          const bg = pixelColors[idx];
          const col = [45, 50, 60];
          pixelColors[idx] = [
            Math.round(bg[0]*(1-c)+col[0]*c),
            Math.round(bg[1]*(1-c)+col[1]*c),
            Math.round(bg[2]*(1-c)+col[2]*c),
          ];
        }
      }
    }
    drawText(pixelColors, W, tab.title, favX + favS + 12, ry + 12, 2, white);
    drawText(pixelColors, W, tab.sub, favX + favS + 12, ry + 30, 1, subtleWhite);
  });

  // ── Encode PNG ──
  const rawRows = [];
  for (let y = 0; y < H; y++) {
    rawRows.push(0); // filter byte
    for (let x = 0; x < W; x++) {
      const c = pixelColors[y * W + x];
      rawRows.push(c[0], c[1], c[2], 255);
    }
  }

  const rawData = Buffer.from(rawRows);
  const compressed = deflateSync(rawData, { level: 9 });

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const png = makePNG(1280, 800);
const ws = createWriteStream('screenshots/store-screenshot.png');
ws.write(png);
ws.end();
console.log('Generated screenshots/store-screenshot.png (1280x800)');
