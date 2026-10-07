import { CERTIFICATE_KIND_LABELS, formatIssueDate, type AdminCertificate } from "../../../../shared/certificates";
import { certificateRuntime, drawOp, fontCss } from "./render";
import { COLOURS, type FontSpec, type ParsedTemplate, type TemplateOp } from "./template";

/**
 * Branded report PDFs (rebrand Phase 5.6): every downloadable report shares one header (the
 * primary logo from the kit's certificate template, the report's title, a Mist rule) and one footer
 * (the platform line and "Page N of M"), in Outfit, on white. Drawn with the same Skia PDF backend
 * and fonts as the certificate, so text stays selectable and the logo stays vector.
 *
 * `renderBrandedPdf` is the frame; a report only says how many pages it has and what goes on each.
 */

type CanvasModule = typeof import("@napi-rs/canvas");
type Ctx = import("@napi-rs/canvas").CanvasRenderingContext2D;

export const A4_LANDSCAPE = { width: 841.89, height: 595.28 } as const;
export const A4_PORTRAIT = { width: 595.28, height: 841.89 } as const;
const MARGIN = 40;
const HEADER_BOTTOM = 84;
const FOOTER_TOP_FROM_BOTTOM = 36;

/** Where the page's own content goes, in points. */
export interface ContentArea {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface BrandedPdfOptions {
  title: string;
  /** A short line under the title ("12 certificates, as of 7 October 2026"). */
  subtitle?: string;
  landscape?: boolean;
  pageCount: number;
  drawPage: (ctx: Ctx, page: number, area: ContentArea, tools: DrawTools) => void;
}

export interface DrawTools {
  canvas: CanvasModule;
  /** Sets the font (Outfit) and colour, and draws `text` cut to `maxWidth` with an ellipsis. */
  text: (text: string, x: number, y: number, font: FontSpec, colour: string, maxWidth?: number) => void;
  width: (text: string, font: FontSpec) => number;
}

/** The kit logo's box inside its own group (the wordmark's bounds; the mark starts at 0, 0). */
function logoBox(canvas: CanvasModule, logo: Extract<TemplateOp, { kind: "group" }>): { width: number; height: number } {
  let right = 150;
  let bottom = 150;
  for (const child of logo.children) {
    if (child.kind !== "path") continue;
    const [, , r, b] = new canvas.Path2D(child.d).getBounds();
    right = Math.max(right, r);
    bottom = Math.max(bottom, b);
  }
  return { width: right, height: bottom };
}

function drawLogo(canvas: CanvasModule, ctx: Ctx, template: ParsedTemplate, x: number, y: number, height: number): void {
  const logo = template.logo;
  if (!logo) return;
  const box = logoBox(canvas, logo);
  const s = height / box.height;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  for (const child of logo.children) drawOp(canvas, ctx, child);
  ctx.restore();
}

export async function renderBrandedPdf(opts: BrandedPdfOptions): Promise<Buffer> {
  const { canvas, template } = await certificateRuntime();
  const page = opts.landscape ? A4_LANDSCAPE : A4_PORTRAIT;
  const doc = new canvas.PDFDocument({ title: opts.title, author: "Oyelabs", creator: "Oyelearn", producer: "Oyelearn" });
  const scratch = canvas.createCanvas(8, 8).getContext("2d");
  const width = (text: string, font: FontSpec) => {
    scratch.font = fontCss(font);
    scratch.letterSpacing = "0px";
    return scratch.measureText(text).width;
  };
  const pages = Math.max(1, opts.pageCount);
  for (let i = 0; i < pages; i++) {
    const ctx = doc.beginPage(page.width, page.height);
    const text: DrawTools["text"] = (value, x, y, font, colour, maxWidth) => {
      let out = value;
      if (maxWidth !== undefined && width(out, font) > maxWidth) {
        while (out && width(`${out}…`, font) > maxWidth) out = out.slice(0, -1);
        out = `${out.trimEnd()}…`;
      }
      ctx.font = fontCss(font);
      ctx.letterSpacing = "0px";
      ctx.fillStyle = colour;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(out, x, y);
    };

    // Header: logo top left (clear space: half its height), title top right, a Mist rule.
    ctx.fillStyle = COLOURS.white;
    ctx.fillRect(0, 0, page.width, page.height);
    drawLogo(canvas, ctx, template, MARGIN, 30, 26);
    const titleFont: FontSpec = { weight: 600, size: 15 };
    text(opts.title, page.width - MARGIN - width(opts.title, titleFont), 46, titleFont, COLOURS.navy);
    if (opts.subtitle) {
      const subFont: FontSpec = { weight: 400, size: 9.5 };
      text(opts.subtitle, page.width - MARGIN - width(opts.subtitle, subFont), 62, subFont, COLOURS.slate);
    }
    ctx.fillStyle = "#E1EBFA";
    ctx.fillRect(MARGIN, HEADER_BOTTOM - 12, page.width - MARGIN * 2, 1.5);

    const area: ContentArea = { left: MARGIN, top: HEADER_BOTTOM + 8, right: page.width - MARGIN, bottom: page.height - FOOTER_TOP_FROM_BOTTOM - 10 };
    opts.drawPage(ctx, i, area, { canvas, text, width });

    // Footer: a Mist rule, the platform line left, the page number right.
    const footY = page.height - 20;
    ctx.fillStyle = "#E1EBFA";
    ctx.fillRect(MARGIN, page.height - FOOTER_TOP_FROM_BOTTOM, page.width - MARGIN * 2, 1);
    const footFont: FontSpec = { weight: 400, size: 8.5 };
    text("Oyelearn, the learning platform of Oyelabs", MARGIN, footY, footFont, COLOURS.slate);
    const label = `Page ${i + 1} of ${pages}`;
    text(label, page.width - MARGIN - width(label, footFont), footY, footFont, COLOURS.slate);
    doc.endPage();
  }
  return doc.close();
}

// ---------------------------------------------------------------------------
// The certificates report
// ---------------------------------------------------------------------------

export type ReportCertificate = AdminCertificate & { accountName: string };

const COLUMNS: { label: string; width: number; value: (c: ReportCertificate) => string }[] = [
  { label: "Name on certificate", width: 150, value: (c) => c.holderName },
  { label: "Account", width: 100, value: (c) => c.accountName },
  { label: "For", width: 177, value: (c) => c.title },
  { label: "Kind", width: 52, value: (c) => CERTIFICATE_KIND_LABELS[c.kind] },
  { label: "Issued", width: 90, value: (c) => formatIssueDate(c.issuedAt) },
  { label: "Status", width: 55, value: (c) => (c.revokedAt ? "Revoked" : "Valid") },
  { label: "Code", width: 138, value: (c) => c.id },
];
const ROW = 17;

/** Every certificate (newest first) as a branded, paged table. */
export async function certificatesReportPdf(rows: ReportCertificate[], at = Date.now()): Promise<Buffer> {
  const usable = A4_LANDSCAPE.height - FOOTER_TOP_FROM_BOTTOM - 10 - (HEADER_BOTTOM + 8) - 26;
  const perPage = Math.max(1, Math.floor(usable / ROW));
  const pageCount = Math.max(1, Math.ceil(rows.length / perPage));
  const valid = rows.filter((r) => !r.revokedAt).length;
  return renderBrandedPdf({
    title: "Certificates issued",
    subtitle: `${rows.length} ${rows.length === 1 ? "certificate" : "certificates"}, ${valid} valid, as of ${formatIssueDate(at)}`,
    landscape: true,
    pageCount,
    drawPage: (ctx, page, area, { text }) => {
      const head: FontSpec = { weight: 600, size: 8.5 };
      const body: FontSpec = { weight: 400, size: 8.5 };
      let y = area.top + 12;
      let x = area.left;
      for (const col of COLUMNS) {
        text(col.label, x, y, head, COLOURS.slate, col.width - 8);
        x += col.width;
      }
      ctx.fillStyle = "#D5DCE8";
      ctx.fillRect(area.left, y + 6, area.right - area.left, 0.8);
      y += 6;
      const slice = rows.slice(page * perPage, (page + 1) * perPage);
      if (!slice.length) text("No certificates have been issued yet.", area.left, y + ROW, body, COLOURS.slate);
      for (const row of slice) {
        y += ROW;
        x = area.left;
        for (const col of COLUMNS) {
          text(col.value(row), x, y, body, col.label === "Status" && row.revokedAt ? "#B91C1C" : COLOURS.navy, col.width - 8);
          x += col.width;
        }
      }
    },
  });
}
