/**
 * Draws /design's certificate preview with the server's own renderer (rebrand Phase 7), so the style
 * guide shows exactly what learners download instead of a hand-made stand-in.
 *
 *   npx tsx scripts/brand/certificate-sample.ts
 *
 * Writes public/brand/certificate/certificate-sample.png (1×, 1754 × 1240, the size of the verify
 * page's preview). Run it again after a template change (TEMPLATE_VERSION in
 * server/src/v5/certificates/template.ts); src/components/brand/logoRules.test.ts fails
 * when the file is missing or the wrong size.
 */
import fs from "node:fs";
import path from "node:path";

import { renderCertificatePng } from "../../server/src/v5/certificates/render";

const out = path.resolve("public/brand/certificate/certificate-sample.png");

const png = await renderCertificatePng(
  {
    holderName: "Rahul Mehta",
    title: "Backend foundations",
    kind: "track",
    issuedAt: Date.UTC(2026, 9, 5, 12),
    // A sample code: it never verifies, and the QR on the picture says so if anyone scans it.
    verifyUrl: "https://learn.oyegen.com/verify/OYL-SAMP-0000-0000-0000",
    signature: null,
  },
  1,
);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log(`wrote ${path.relative(process.cwd(), out)} (${png.length} bytes)`);
