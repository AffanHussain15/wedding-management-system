#!/usr/bin/env node
/**
 * Generates the Android and iOS launcher icons from src/assets/images/logo.png.
 *
 * Re-run after replacing the logo: `npm run icons`. Pure Node — the PNG codec
 * and resampler below exist so the project needs no image dependency.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'src/assets/images/logo.png');
const ANDROID_RES = path.join(ROOT, 'android/app/src/main/res');
const IOS_ICONSET = path.join(
  ROOT,
  'ios/WeddingManagementSystem/Images.xcassets/AppIcon.appiconset',
);

/** Android densities, as multipliers of the 48dp baseline. */
const DENSITIES = [
  { dir: 'mipmap-mdpi', scale: 1 },
  { dir: 'mipmap-hdpi', scale: 1.5 },
  { dir: 'mipmap-xhdpi', scale: 2 },
  { dir: 'mipmap-xxhdpi', scale: 3 },
  { dir: 'mipmap-xxxhdpi', scale: 4 },
];

/** iOS slots. `size` is in points, so the pixel size is size * scale. */
const IOS_ICONS = [
  { idiom: 'iphone', size: 20, scale: 2 },
  { idiom: 'iphone', size: 20, scale: 3 },
  { idiom: 'iphone', size: 29, scale: 2 },
  { idiom: 'iphone', size: 29, scale: 3 },
  { idiom: 'iphone', size: 40, scale: 2 },
  { idiom: 'iphone', size: 40, scale: 3 },
  { idiom: 'iphone', size: 60, scale: 2 },
  { idiom: 'iphone', size: 60, scale: 3 },
  { idiom: 'ios-marketing', size: 1024, scale: 1 },
];

// ---------------------------------------------------------------- PNG codec

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

/** Decodes a non-interlaced 8-bit RGB/RGBA PNG to a flat RGBA buffer. */
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');

  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf[24];
  const colorType = buf[25];
  const interlace = buf[28];

  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth} (need 8)`);
  if (colorType !== 6 && colorType !== 2) {
    throw new Error(`unsupported color type ${colorType} (need 2 or 6)`);
  }
  if (interlace !== 0) throw new Error('interlaced PNGs are not supported');

  const parts = [];
  let offset = 8;
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') parts.push(buf.subarray(offset + 8, offset + 8 + length));
    if (type === 'IEND') break;
    offset += 12 + length;
  }

  const raw = zlib.inflateSync(Buffer.concat(parts));
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const lines = Buffer.alloc(height * stride);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? lines[dst + i - bpp] : 0;
      const b = y > 0 ? lines[dst - stride + i] : 0;
      const c = i >= bpp && y > 0 ? lines[dst - stride + i - bpp] : 0;
      let v = raw[src + i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) v += paeth(a, b, c);
      lines[dst + i] = v & 0xff;
    }
  }

  if (bpp === 4) return { width, height, data: lines };

  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = lines[i * 3];
    rgba[i * 4 + 1] = lines[i * 3 + 1];
    rgba[i * 4 + 2] = lines[i * 3 + 2];
    rgba[i * 4 + 3] = 255;
  }
  return { width, height, data: rgba };
}

/** Encodes RGBA to a PNG. With `alpha: false` the alpha channel is dropped. */
function encodePng(data, width, height, { alpha = true } = {}) {
  const bpp = alpha ? 4 : 3;
  const stride = width * bpp;
  const raw = Buffer.alloc(height * (stride + 1));

  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 4; // Paeth: the best general filter for gradients.
    for (let i = 0; i < stride; i++) {
      const channel = i % bpp;
      const x = (i / bpp) | 0;
      const cur = data[(y * width + x) * 4 + channel];
      const a = x > 0 ? data[(y * width + x - 1) * 4 + channel] : 0;
      const b = y > 0 ? data[((y - 1) * width + x) * 4 + channel] : 0;
      const c = x > 0 && y > 0 ? data[((y - 1) * width + x - 1) * 4 + channel] : 0;
      raw[y * (stride + 1) + 1 + i] = (cur - paeth(a, b, c)) & 0xff;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = alpha ? 6 : 2;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------- resampling

/**
 * Triangle-filter weights for one axis. The support widens when downscaling so
 * every source pixel contributes — a fixed 1px support would alias badly going
 * from 1024 to 48.
 */
function axisWeights(srcLen, dstLen) {
  const scale = dstLen / srcLen;
  const support = scale < 1 ? 1 / scale : 1;
  const rows = [];

  for (let d = 0; d < dstLen; d++) {
    const center = (d + 0.5) / scale - 0.5;
    const from = Math.ceil(center - support);
    const to = Math.floor(center + support);
    const idx = [];
    const w = [];
    let total = 0;

    for (let s = from; s <= to; s++) {
      const weight = 1 - Math.abs((s - center) / support);
      if (weight <= 0) continue;
      idx.push(Math.min(srcLen - 1, Math.max(0, s)));
      w.push(weight);
      total += weight;
    }
    for (let i = 0; i < w.length; i++) w[i] /= total;
    rows.push({ idx, w });
  }
  return rows;
}

/** Resizes RGBA, premultiplying so transparent pixels can't bleed colour in. */
function resize(src, sw, sh, dw, dh) {
  const pm = new Float32Array(sw * sh * 4);
  for (let i = 0; i < sw * sh; i++) {
    const a = src[i * 4 + 3] / 255;
    pm[i * 4] = src[i * 4] * a;
    pm[i * 4 + 1] = src[i * 4 + 1] * a;
    pm[i * 4 + 2] = src[i * 4 + 2] * a;
    pm[i * 4 + 3] = src[i * 4 + 3];
  }

  const cols = axisWeights(sw, dw);
  const mid = new Float32Array(dw * sh * 4);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < dw; x++) {
      const { idx, w } = cols[x];
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let k = 0; k < idx.length; k++) {
        const p = (y * sw + idx[k]) * 4;
        r += pm[p] * w[k];
        g += pm[p + 1] * w[k];
        b += pm[p + 2] * w[k];
        a += pm[p + 3] * w[k];
      }
      const o = (y * dw + x) * 4;
      mid[o] = r;
      mid[o + 1] = g;
      mid[o + 2] = b;
      mid[o + 3] = a;
    }
  }

  const rows = axisWeights(sh, dh);
  const out = Buffer.alloc(dw * dh * 4);
  for (let y = 0; y < dh; y++) {
    const { idx, w } = rows[y];
    for (let x = 0; x < dw; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let k = 0; k < idx.length; k++) {
        const p = (idx[k] * dw + x) * 4;
        r += mid[p] * w[k];
        g += mid[p + 1] * w[k];
        b += mid[p + 2] * w[k];
        a += mid[p + 3] * w[k];
      }
      const o = (y * dw + x) * 4;
      const alpha = Math.max(0, Math.min(255, a));
      const unpm = alpha > 0 ? 255 / alpha : 0;
      out[o] = Math.max(0, Math.min(255, Math.round(r * unpm)));
      out[o + 1] = Math.max(0, Math.min(255, Math.round(g * unpm)));
      out[o + 2] = Math.max(0, Math.min(255, Math.round(b * unpm)));
      out[o + 3] = Math.round(alpha);
    }
  }
  return out;
}

/** Clears everything outside the inscribed circle, antialiasing the edge. */
function circleMask(data, size) {
  const out = Buffer.from(data);
  const r = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - r, y + 0.5 - r);
      const coverage = Math.max(0, Math.min(1, r - d + 0.5));
      const o = (y * size + x) * 4 + 3;
      out[o] = Math.round(out[o] * coverage);
    }
  }
  return out;
}

/** Mean colour of the outer border, used for the adaptive-icon background. */
function borderColor(data, size) {
  const band = Math.max(1, Math.round(size * 0.06));
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const edge = x < band || y < band || x >= size - band || y >= size - band;
      if (!edge) continue;
      const p = (y * size + x) * 4;
      if (data[p + 3] === 0) continue;
      r += data[p];
      g += data[p + 1];
      b += data[p + 2];
      n++;
    }
  }
  const hex = v => Math.round(v / n).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase();
}

// ------------------------------------------------------------------- main

function write(file, buf) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  console.log(`  ${path.relative(ROOT, file).replace(/\\/g, '/')}  (${buf.length} bytes)`);
}

function main() {
  if (!fs.existsSync(SOURCE)) throw new Error(`missing ${SOURCE}`);

  const { width, height, data } = decodePng(fs.readFileSync(SOURCE));
  if (width !== height) throw new Error(`logo must be square, got ${width}x${height}`);
  if (width < 1024) {
    console.warn(`WARNING: logo is ${width}px; 1024px or larger is recommended.\n`);
  }
  console.log(`Source: ${width}x${height}\n`);

  const cache = new Map();
  const at = size => {
    if (!cache.has(size)) cache.set(size, resize(data, width, height, size, size));
    return cache.get(size);
  };

  console.log('Android launcher icons:');
  for (const { dir, scale } of DENSITIES) {
    const size = Math.round(48 * scale);
    write(path.join(ANDROID_RES, dir, 'ic_launcher.png'), encodePng(at(size), size, size));
    write(
      path.join(ANDROID_RES, dir, 'ic_launcher_round.png'),
      encodePng(circleMask(at(size), size), size, size),
    );
  }

  // Adaptive icons are 108dp with only the middle 72dp guaranteed visible. The
  // logo is full-bleed, so the foreground is too and the mark stays inside the
  // safe zone; the background colour only shows if a launcher insets further.
  console.log('\nAndroid adaptive icon:');
  for (const { dir, scale } of DENSITIES) {
    const size = Math.round(108 * scale);
    write(
      path.join(ANDROID_RES, dir, 'ic_launcher_foreground.png'),
      encodePng(at(size), size, size),
    );
  }

  const background = borderColor(data, width);
  // No <monochrome>: themed icons need a silhouette, and a full-bleed logo
  // would come out as a solid blob.
  const adaptive = Buffer.from(`<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`);

  write(path.join(ANDROID_RES, 'mipmap-anydpi-v26/ic_launcher.xml'), adaptive);
  write(path.join(ANDROID_RES, 'mipmap-anydpi-v26/ic_launcher_round.xml'), adaptive);
  write(
    path.join(ANDROID_RES, 'values/ic_launcher_background.xml'),
    Buffer.from(`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${background}</color>
</resources>
`),
  );

  // The App Store rejects icons with an alpha channel, so these are written as
  // opaque RGB. The source is already full-bleed, so nothing is composited.
  console.log('\niOS app icons:');
  const images = IOS_ICONS.map(({ idiom, size, scale }) => {
    const px = size * scale;
    const filename = `icon-${size}@${scale}x.png`;
    write(path.join(IOS_ICONSET, filename), encodePng(at(px), px, px, { alpha: false }));
    return { filename, idiom, scale: `${scale}x`, size: `${size}x${size}` };
  });

  write(
    path.join(IOS_ICONSET, 'Contents.json'),
    Buffer.from(`${JSON.stringify({ images, info: { author: 'xcode', version: 1 } }, null, 2)}\n`),
  );

  console.log(`\nAdaptive-icon background: ${background}`);
  console.log('Done.');
}

if (require.main === module) main();

module.exports = { decodePng, encodePng, resize, circleMask };
