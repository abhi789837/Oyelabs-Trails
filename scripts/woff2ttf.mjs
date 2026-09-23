#!/usr/bin/env node
/**
 * WOFF 1.0 -> TTF, for the certificate PDF's fonts.
 *
 * `@react-pdf/renderer` uses fontkit, which cannot parse the WOFF files `@fontsource` ships, so
 * the certificate needs plain sfnt copies (see src/assets/fonts/README.md). WOFF 1.0 is just an
 * sfnt with each table zlib-deflated and a different header, so unwrapping it is lossless: the
 * table data that comes out is byte-for-byte what went in.
 *
 *   node scripts/woff2ttf.mjs <input.woff> <output.ttf>
 *
 * WOFF 2.0 is a different format (Brotli plus a transformed glyf/loca) and is NOT handled here;
 * the script rejects it rather than producing a corrupt file.
 */
import fs from "node:fs";
import zlib from "node:zlib";

function convert(woff) {
  if (woff.length < 44 || woff.toString("latin1", 0, 4) !== "wOFF") {
    throw new Error(woff.toString("latin1", 0, 4) === "wOF2" ? "This is WOFF 2.0, which this script does not handle." : "Not a WOFF 1.0 file.");
  }

  const flavor = woff.readUInt32BE(4);
  const numTables = woff.readUInt16BE(12);

  const entries = [];
  for (let i = 0; i < numTables; i++) {
    const base = 44 + i * 20;
    entries.push({
      tag: woff.subarray(base, base + 4),
      offset: woff.readUInt32BE(base + 4),
      compLength: woff.readUInt32BE(base + 8),
      origLength: woff.readUInt32BE(base + 12),
      checksum: woff.readUInt32BE(base + 16),
    });
  }

  for (const e of entries) {
    const raw = woff.subarray(e.offset, e.offset + e.compLength);
    // A table is stored uncompressed when the compressed length equals the original length.
    e.data = e.compLength === e.origLength ? Buffer.from(raw) : zlib.inflateSync(raw);
    if (e.data.length !== e.origLength) {
      throw new Error(`Table ${e.tag.toString("latin1")} inflated to ${e.data.length}, expected ${e.origLength}.`);
    }
  }

  // sfnt requires the directory sorted by tag, and each table 4-byte aligned.
  entries.sort((a, b) => a.tag.compare(b.tag));

  const headerSize = 12 + numTables * 16;
  const pad = (n) => (4 - (n % 4)) % 4;
  let offset = headerSize;
  for (const e of entries) {
    e.outOffset = offset;
    offset += e.data.length + pad(e.data.length);
  }

  const out = Buffer.alloc(offset);
  const maxPow2 = Math.floor(Math.log2(numTables));
  const searchRange = 16 * 2 ** maxPow2;
  out.writeUInt32BE(flavor, 0);
  out.writeUInt16BE(numTables, 4);
  out.writeUInt16BE(searchRange, 6);
  out.writeUInt16BE(maxPow2, 8);
  out.writeUInt16BE(numTables * 16 - searchRange, 10);

  entries.forEach((e, i) => {
    const base = 12 + i * 16;
    e.tag.copy(out, base);
    out.writeUInt32BE(e.checksum, base + 4);
    out.writeUInt32BE(e.outOffset, base + 8);
    out.writeUInt32BE(e.data.length, base + 12);
    e.data.copy(out, e.outOffset);
  });

  return out;
}

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: node scripts/woff2ttf.mjs <input.woff> <output.ttf>");
  process.exit(1);
}
fs.writeFileSync(output, convert(fs.readFileSync(input)));
console.log(`${input} -> ${output}`);
