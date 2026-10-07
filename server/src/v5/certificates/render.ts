import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { encode } from "uqr";

import { formatIssueDate, qrPathData } from "../../../../shared/certificates";
import { pick, runtimeImport } from "../../oyelabs/extract/runtime";
import { A4_POINTS, COLOURS, FONT_FAMILY, layoutCertificate, PAGE, parseTemplate, type CertificateInput, type CertificateLayout, type FontSpec, type Measure, type ParsedTemplate, type TemplateOp } from "./template";

/**
 * Draws the certificate (template.ts) with `@napi-rs/canvas` (Skia; already a production dependency
 * for document extraction, prebuilt for the Docker image's linux-x64-gnu). One drawing function,
 * two surfaces:
 *
 * - **PDF**: Skia's PDF backend. Vector paths, and real text in Outfit (static TTFs, subset and
 *   embedded as TrueType, so names stay selectable and searchable), with a link on the verify line.
 * - **PNG**: the same calls on a raster canvas at 2× the template (3508 × 2480) for sharing, or 1×
 *   (1754 × 1240) for the verify page and link previews.
 *
 * The canvas module is a native addon, so it is loaded at run time (as extraction does) and never
 * bundled; nothing here runs until a certificate file is first asked for.
 */

type CanvasModule = typeof import("@napi-rs/canvas");
type Ctx = import("@napi-rs/canvas").CanvasRenderingContext2D;

const here = path.dirname(fileURLToPath(import.meta.url));

/** server/assets/certificates in dev and tests; dist-server/assets/certificates in the image. */
export function certificateAssetsDir(): string {
  const candidates = [path.resolve(here, "../../../assets/certificates"), path.resolve(here, "assets/certificates"), path.resolve(process.cwd(), "server/assets/certificates")];
  const found = candidates.find((dir) => fs.existsSync(path.join(dir, "certificate-template-a4.svg")));
  if (!found) throw new Error(`Could not find the certificate template. Looked in:\n  ${candidates.join("\n  ")}`);
  return found;
}

export const FONT_FILES = { 400: "Outfit-Regular.ttf", 500: "Outfit-Medium.ttf", 600: "Outfit-SemiBold.ttf" } as const;

let loaded: Promise<{ canvas: CanvasModule; template: ParsedTemplate }> | null = null;

/** The canvas module with Outfit registered, and the parsed kit template. Loaded once. */
export function certificateRuntime(): Promise<{ canvas: CanvasModule; template: ParsedTemplate }> {
  loaded ??= (async () => {
    const canvas = pick<CanvasModule>(await runtimeImport<CanvasModule>("@napi-rs/canvas"));
    const dir = certificateAssetsDir();
    for (const file of Object.values(FONT_FILES)) {
      if (!canvas.GlobalFonts.registerFromPath(path.join(dir, "fonts", file), FONT_FAMILY)) throw new Error(`Could not load the certificate font ${file}`);
    }
    const template = parseTemplate(fs.readFileSync(path.join(dir, "certificate-template-a4.svg"), "utf8"));
    return { canvas, template };
  })().catch((error: unknown) => {
    loaded = null;
    throw error;
  });
  return loaded;
}

export function fontCss(font: FontSpec): string {
  return `${font.weight} ${font.size}px ${FONT_FAMILY}`;
}

function applyFont(ctx: Ctx, font: FontSpec): void {
  ctx.font = fontCss(font);
  ctx.letterSpacing = `${font.letterSpacing ?? 0}px`;
}

/** A `Measure` on a scratch canvas: advance width, minus the letter spacing canvas adds after the last letter. */
export function measurer(canvas: CanvasModule): Measure {
  const ctx = canvas.createCanvas(8, 8).getContext("2d");
  return (text, font) => {
    applyFont(ctx, font);
    const w = ctx.measureText(text).width;
    return text && font.letterSpacing ? w - font.letterSpacing : w;
  };
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

/** One element of the kit template, drawn as the SVG would draw it. */
export function drawOp(canvas: CanvasModule, ctx: Ctx, op: TemplateOp): void {
  switch (op.kind) {
    case "rect": {
      const path2d = new canvas.Path2D();
      path2d.roundRect(op.x, op.y, op.width, op.height, op.rx);
      if (op.fill) {
        ctx.fillStyle = op.fill;
        ctx.fill(path2d);
      }
      if (op.stroke) {
        ctx.strokeStyle = op.stroke;
        ctx.lineWidth = op.strokeWidth;
        ctx.stroke(path2d);
      }
      return;
    }
    case "path": {
      const path2d = new canvas.Path2D(op.d);
      if (op.fill) {
        ctx.fillStyle = op.fill;
        ctx.fill(path2d);
      }
      if (op.stroke) {
        ctx.strokeStyle = op.stroke;
        ctx.lineWidth = op.strokeWidth;
        ctx.lineCap = op.lineCap;
        ctx.stroke(path2d);
      }
      return;
    }
    case "circle": {
      if (!op.fill) return;
      ctx.beginPath();
      ctx.arc(op.cx, op.cy, op.r, 0, Math.PI * 2);
      ctx.fillStyle = op.fill;
      ctx.fill();
      return;
    }
    case "group": {
      ctx.save();
      ctx.translate(op.translate[0], op.translate[1]);
      ctx.scale(op.scale, op.scale);
      ctx.globalAlpha *= op.opacity;
      for (const child of op.children) drawOp(canvas, ctx, child);
      ctx.restore();
    }
  }
}

/** The QR as one path of module squares, on white, in Night Navy (error correction M). */
export function qrFor(url: string): { modules: number; path: string } {
  const qr = encode(url, { ecc: "M", border: 0 });
  return { modules: qr.size, path: qrPathData(qr.data) };
}

/** Everything, in template units, onto any 2D context (PDF page or raster canvas). */
export function drawCertificate(canvas: CanvasModule, ctx: Ctx, template: ParsedTemplate, layout: CertificateLayout, verifyUrl: string): void {
  // Clip to the page: the faint ring device runs off the bottom-right corner, as in the kit.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, PAGE.width, PAGE.height);
  ctx.clip();
  for (const op of template.ops) drawOp(canvas, ctx, op);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  const measure = measurer(canvas);
  for (const run of layout.runs) {
    applyFont(ctx, run.font);
    ctx.fillStyle = run.colour;
    ctx.fillText(run.text, run.cx - measure(run.text, run.font) / 2, run.y);
  }
  ctx.letterSpacing = "0px";

  const qr = qrFor(verifyUrl);
  const { x, y, size } = layout.qr;
  ctx.fillStyle = COLOURS.white;
  ctx.fillRect(x - 6, y - 6, size + 12, size + 12);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / qr.modules, size / qr.modules);
  ctx.fillStyle = COLOURS.navy;
  ctx.fill(new canvas.Path2D(qr.path));
  ctx.restore();
  ctx.restore();
}

async function prepared(input: CertificateInput) {
  const runtime = await certificateRuntime();
  const layout = layoutCertificate(input, measurer(runtime.canvas));
  return { ...runtime, layout };
}

/** A4 landscape, vector, Outfit embedded, the verify line and the QR are links. */
export async function renderCertificatePdf(input: CertificateInput): Promise<Buffer> {
  const { canvas, template, layout } = await prepared(input);
  const doc = new canvas.PDFDocument({
    title: `Certificate of completion: ${input.title}`,
    author: "Oyelabs",
    subject: `${input.holderName}, ${input.title}, ${formatIssueDate(input.issuedAt)}`,
    keywords: "Oyelearn, Oyelabs, certificate",
    creator: "Oyelearn",
    producer: "Oyelearn",
  });
  const ctx = doc.beginPage(A4_POINTS.width, A4_POINTS.height);
  const k = A4_POINTS.width / PAGE.width;
  ctx.scale(k, k);
  drawCertificate(canvas, ctx, template, layout, input.verifyUrl);
  const box = layout.verifyBox;
  ctx.annotateLinkUrl(box.left, box.top, box.right, box.bottom, input.verifyUrl);
  ctx.annotateLinkUrl(layout.qr.x, layout.qr.y, layout.qr.x + layout.qr.size, layout.qr.y + layout.qr.size, input.verifyUrl);
  doc.endPage();
  return doc.close();
}

/** PNG at `scale` × the template: 2 → 3508 × 2480 (share, download), 1 → 1754 × 1240 (previews). */
export async function renderCertificatePng(input: CertificateInput, scale: 1 | 2 = 2): Promise<Buffer> {
  const { canvas, template, layout } = await prepared(input);
  const surface = canvas.createCanvas(PAGE.width * scale, PAGE.height * scale);
  const ctx = surface.getContext("2d");
  ctx.scale(scale, scale);
  drawCertificate(canvas, ctx, template, layout, input.verifyUrl);
  return surface.encode("png");
}
