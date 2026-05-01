#!/usr/bin/env node
/*
 * Generate the AppImage / desktop icon as a 512x512 PNG using only Node
 * built-ins — no ImageMagick, no Sharp, no Cairo dependency.
 *
 * Design: rounded purple-to-indigo gradient square with a stylized white
 * headphone glyph (band + two earpads). Rendered at 4x supersampling for
 * smooth antialiased edges, then box-filtered down to 512x512.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// --- PNG encoder (RGBA, 8-bit) ---------------------------------------------

let CRC_TABLE = null;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)) >>> 0;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // colour type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Each scanline is prefixed with a filter byte (0 = None).
  const stride = width * 4;
  const filtered = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    filtered[y * (stride + 1)] = 0;
    rgba.copy(filtered, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(filtered, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- 2D drawing primitives over a flat RGBA buffer -------------------------

function makeBuffer(w, h) {
  return { w, h, data: Buffer.alloc(w * h * 4) };
}

function setPx(buf, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= buf.w || y >= buf.h) return;
  const i = (y * buf.w + x) * 4;
  // Source-over alpha compositing onto whatever is already there.
  const sa = a / 255;
  const da = buf.data[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa <= 0) return;
  buf.data[i]     = Math.round((r * sa + buf.data[i]     * da * (1 - sa)) / oa);
  buf.data[i + 1] = Math.round((g * sa + buf.data[i + 1] * da * (1 - sa)) / oa);
  buf.data[i + 2] = Math.round((b * sa + buf.data[i + 2] * da * (1 - sa)) / oa);
  buf.data[i + 3] = Math.round(oa * 255);
}

// Signed-distance helpers — we draw a "mask" via SDF and use that for AA
// during the supersample downscale.

function sdRoundedRect(px, py, cx, cy, halfW, halfH, r) {
  const qx = Math.abs(px - cx) - (halfW - r);
  const qy = Math.abs(py - cy) - (halfH - r);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.sqrt(ax * ax + ay * ay) + Math.min(Math.max(qx, qy), 0) - r;
}

function sdCircle(px, py, cx, cy, r) {
  const dx = px - cx, dy = py - cy;
  return Math.sqrt(dx * dx + dy * dy) - r;
}

// Draw a filled shape into `buf` for any pixel where sdf(x, y) <= 0.
function fillSDF(buf, sdf, color) {
  const [r, g, b, a] = color;
  for (let y = 0; y < buf.h; y++) {
    for (let x = 0; x < buf.w; x++) {
      if (sdf(x + 0.5, y + 0.5) <= 0) setPx(buf, x, y, r, g, b, a);
    }
  }
}

// Box-filter downscale by integer factor — collapses the supersample buffer
// into the final image with smooth edges.
function downscale(big, factor) {
  const small = makeBuffer(big.w / factor, big.h / factor);
  for (let y = 0; y < small.h; y++) {
    for (let x = 0; x < small.w; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < factor; sy++) {
        for (let sx = 0; sx < factor; sx++) {
          const i = ((y * factor + sy) * big.w + (x * factor + sx)) * 4;
          r += big.data[i];
          g += big.data[i + 1];
          b += big.data[i + 2];
          a += big.data[i + 3];
        }
      }
      const n = factor * factor;
      const i = (y * small.w + x) * 4;
      small.data[i]     = Math.round(r / n);
      small.data[i + 1] = Math.round(g / n);
      small.data[i + 2] = Math.round(b / n);
      small.data[i + 3] = Math.round(a / n);
    }
  }
  return small;
}

// --- Icon composition ------------------------------------------------------

const FINAL = 512;
const SS = 4;            // 4x supersample
const W = FINAL * SS;
const H = FINAL * SS;

function lerp(a, b, t) { return a + (b - a) * t; }

function paintGradientRoundedSquare(buf) {
  // Diagonal indigo → purple gradient, masked by a rounded square SDF.
  const cx = buf.w / 2, cy = buf.h / 2;
  const halfW = buf.w / 2, halfH = buf.h / 2;
  const radius = buf.w * 0.18;     // ~92px on the 512 grid
  const c1 = [62, 51, 153];        // deep indigo  (#3E3399)
  const c2 = [167, 139, 250];      // soft violet  (#A78BFA)
  for (let y = 0; y < buf.h; y++) {
    for (let x = 0; x < buf.w; x++) {
      const d = sdRoundedRect(x + 0.5, y + 0.5, cx, cy, halfW, halfH, radius);
      if (d > 0) continue;
      // Diagonal gradient parameter (top-left → bottom-right).
      const t = (x + y) / (buf.w + buf.h);
      const r = Math.round(lerp(c1[0], c2[0], t));
      const g = Math.round(lerp(c1[1], c2[1], t));
      const b = Math.round(lerp(c1[2], c2[2], t));
      setPx(buf, x, y, r, g, b, 255);
    }
  }
}

function paintHeadphones(buf) {
  // Coordinates are in supersample space. The 512px design is:
  //   - Headband: an arc (an annulus clipped to its top half)
  //   - Two earcups: rounded rects flanking the arc base
  const cx = buf.w / 2;
  const cy = buf.h * 0.50;
  const bandOuterR = buf.w * 0.30;    // ~154px on 512
  const bandInnerR = buf.w * 0.245;   // ~125px on 512
  const cupHalfW   = buf.w * 0.062;   // ~32px wide
  const cupHalfH   = buf.w * 0.105;   // ~54px tall
  const cupRadius  = buf.w * 0.040;   // rounded cups
  const cupOffsetX = buf.w * 0.273;   // distance from centre
  const cupCenterY = cy + buf.w * 0.060;

  const white = [255, 255, 255, 255];

  // Headband — annulus, but only the upper half. We treat it as filled if the
  // pixel is inside the outer circle, outside the inner circle, AND above a
  // horizontal cut line just above the cup centres.
  const cutY = cy + buf.w * 0.005;
  for (let y = 0; y < buf.h; y++) {
    if (y > cutY) continue;
    for (let x = 0; x < buf.w; x++) {
      const px = x + 0.5, py = y + 0.5;
      const dOuter = sdCircle(px, py, cx, cy, bandOuterR);
      const dInner = sdCircle(px, py, cx, cy, bandInnerR);
      if (dOuter <= 0 && dInner >= 0) {
        setPx(buf, x, y, white[0], white[1], white[2], white[3]);
      }
    }
  }

  // Earcups — two rounded rectangles.
  fillSDF(buf, (px, py) =>
    sdRoundedRect(px, py, cx - cupOffsetX, cupCenterY, cupHalfW, cupHalfH, cupRadius), white);
  fillSDF(buf, (px, py) =>
    sdRoundedRect(px, py, cx + cupOffsetX, cupCenterY, cupHalfW, cupHalfH, cupRadius), white);

  // Inner darker accent inside each cup for visual depth.
  const accent = [109, 90, 207, 255];   // muted purple
  const inset = buf.w * 0.018;
  fillSDF(buf, (px, py) =>
    sdRoundedRect(px, py, cx - cupOffsetX, cupCenterY,
                  cupHalfW - inset, cupHalfH - inset, cupRadius * 0.7), accent);
  fillSDF(buf, (px, py) =>
    sdRoundedRect(px, py, cx + cupOffsetX, cupCenterY,
                  cupHalfW - inset, cupHalfH - inset, cupRadius * 0.7), accent);
}

function main() {
  const big = makeBuffer(W, H);
  paintGradientRoundedSquare(big);
  paintHeadphones(big);
  const final = downscale(big, SS);

  const outDir = path.resolve(__dirname, '..', 'build-resources');
  fs.mkdirSync(outDir, { recursive: true });
  const png = encodePNG(final.w, final.h, final.data);
  const outPath = path.join(outDir, 'icon.png');
  fs.writeFileSync(outPath, png);
  console.log(`Wrote ${outPath} (${final.w}x${final.h}, ${png.length} bytes)`);
}

main();
