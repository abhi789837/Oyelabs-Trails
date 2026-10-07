/**
 * The certificate template (rebrand Phase 5): the kit's `09-print/certificate-template-a4.svg`,
 * parsed once, plus the layout of the text that fills it. Pure: no canvas here, so the layout is
 * tested with any `measure` and the renderer (render.ts) draws exactly what this returns.
 *
 * The kit file is copied byte for byte to `server/assets/certificates/` (a test compares them).
 * Everything in it is drawn as it is (the white page, the faint ring device in the corner, the
 * blue and Mist double border, the primary logo, the two signature rules and the ring seal) except
 * its ten placeholder texts, which the kit ships as outlined glyphs: those are dropped and set again
 * in Outfit, at the same sizes, colours and centres, with the learner's own words.
 *
 * Units are the template's: 1754 × 1240 (A4 landscape at 150 dpi). The PDF scales them to points.
 */

import { completionLine, formatIssueDate, signatureLines, verifyDisplay, type CertificateKind, type CertificateSignature } from "../../../../shared/certificates";

export const PAGE = { width: 1754, height: 1240 } as const;
/** A4 landscape in PDF points. */
export const A4_POINTS = { width: 841.89, height: 595.28 } as const;
/** Bump when the drawing changes, so every cached PDF and PNG is drawn again on its next request. */
export const TEMPLATE_VERSION = "brand-p5.1";

/** The kit's colours, as the template uses them. */
export const COLOURS = {
  blue: "#2067D3",
  navy: "#0B2347",
  slate: "#5B6B82",
  /** The template's "Verify:" line. */
  hint: "#8A98AD",
  white: "#FFFFFF",
} as const;

export const FONT_FAMILY = "Outfit";

// ---------------------------------------------------------------------------
// Parsing the kit's SVG (the small subset it uses)
// ---------------------------------------------------------------------------

export type TemplateOp =
  | { kind: "rect"; x: number; y: number; width: number; height: number; rx: number; fill: string | null; stroke: string | null; strokeWidth: number }
  | { kind: "path"; d: string; fill: string | null; stroke: string | null; strokeWidth: number; lineCap: "butt" | "round" }
  | { kind: "circle"; cx: number; cy: number; r: number; fill: string | null }
  | { kind: "group"; translate: [number, number]; scale: number; opacity: number; children: TemplateOp[] };

export interface Placeholder {
  x: number;
  y: number;
  fill: string;
}

export interface ParsedTemplate {
  width: number;
  height: number;
  /** What is drawn as it is, in order. */
  ops: TemplateOp[];
  /** The kit's outlined placeholder texts ([Learner Name], [Date], ...), dropped from `ops`. */
  placeholders: Placeholder[];
  /** The primary logo group (mark + "yelearn"), for the report PDFs' header. */
  logo: Extract<TemplateOp, { kind: "group" }> | null;
}

function attrs(source: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of source.matchAll(/([\w:-]+)="([^"]*)"/g)) out[m[1]!] = m[2]!;
  return out;
}

const num = (v: string | undefined, fallback = 0): number => (v === undefined || v === "" ? fallback : Number(v));
/** SVG's default fill is black; `none` is no paint. */
const fillOf = (v: string | undefined): string | null => (v === undefined ? "#000" : v === "none" ? null : v);
const strokeOf = (v: string | undefined): string | null => (!v || v === "none" ? null : v);

function parseTransform(value: string | undefined): { translate: [number, number]; scale: number } {
  let translate: [number, number] = [0, 0];
  let scale = 1;
  if (!value) return { translate, scale };
  // The kit writes `translate(a b) scale(s)` and nothing else; anything else is a template change
  // this parser must be taught about, so it fails loudly.
  const rest = value
    .replace(/translate\(\s*([-\d.]+)[\s,]+([-\d.]+)\s*\)/, (_, a: string, b: string) => {
      translate = [Number(a), Number(b)];
      return "";
    })
    .replace(/scale\(\s*([-\d.]+)\s*\)/, (_, s: string) => {
      scale = Number(s);
      return "";
    })
    .trim();
  if (rest) throw new Error(`certificate template: unsupported transform "${value}"`);
  return { translate, scale };
}

/** A translate-only group around one filled path: how the kit ships a placeholder text. */
function placeholderOf(group: Extract<TemplateOp, { kind: "group" }>): Placeholder | null {
  if (group.scale !== 1 || group.opacity !== 1 || group.children.length !== 1) return null;
  const only = group.children[0]!;
  if (only.kind !== "path" || !only.fill || only.stroke) return null;
  return { x: group.translate[0], y: group.translate[1], fill: only.fill };
}

export function parseTemplate(svg: string): ParsedTemplate {
  const rootAttrs = attrs(/<svg\b([^>]*)>/.exec(svg)?.[1] ?? "");
  const [, , vw, vh] = (rootAttrs.viewBox ?? "").split(/\s+/).map(Number);
  const root: TemplateOp[] = [];
  const stack: Extract<TemplateOp, { kind: "group" }>[] = [];
  const placeholders: Placeholder[] = [];
  const push = (op: TemplateOp) => (stack.length ? stack[stack.length - 1]!.children : root).push(op);

  for (const m of svg.matchAll(/<(\/?)(\w+)([^>]*?)(\/?)>/g)) {
    const [, closing, tag, rawAttrs, selfClosing] = m;
    if (tag === "svg") continue;
    if (closing) {
      if (tag !== "g") continue;
      const group = stack.pop();
      if (!group) throw new Error("certificate template: unbalanced </g>");
      const placeholder = placeholderOf(group);
      if (placeholder) placeholders.push(placeholder);
      else push(group);
      continue;
    }
    const a = attrs(rawAttrs ?? "");
    if (tag === "g") {
      const t = parseTransform(a.transform);
      const group = { kind: "group" as const, translate: t.translate, scale: t.scale, opacity: num(a.opacity, 1), children: [] as TemplateOp[] };
      if (selfClosing) push(group);
      else stack.push(group);
    } else if (tag === "rect") {
      push({ kind: "rect", x: num(a.x), y: num(a.y), width: num(a.width), height: num(a.height), rx: num(a.rx), fill: fillOf(a.fill), stroke: strokeOf(a.stroke), strokeWidth: num(a["stroke-width"], 1) });
    } else if (tag === "path") {
      push({ kind: "path", d: a.d ?? "", fill: fillOf(a.fill), stroke: strokeOf(a.stroke), strokeWidth: num(a["stroke-width"], 1), lineCap: a["stroke-linecap"] === "round" ? "round" : "butt" });
    } else if (tag === "circle") {
      push({ kind: "circle", cx: num(a.cx), cy: num(a.cy), r: num(a.r), fill: fillOf(a.fill) });
    } else {
      throw new Error(`certificate template: unsupported element <${tag}>`);
    }
  }
  if (stack.length) throw new Error("certificate template: unclosed <g>");
  const logo = root.find((op): op is Extract<TemplateOp, { kind: "group" }> => op.kind === "group" && op.children.some((c) => c.kind === "group") && op.children.some((c) => c.kind === "path" && c.fill === COLOURS.navy)) ?? null;
  return { width: vw || PAGE.width, height: vh || PAGE.height, ops: root, placeholders, logo };
}

// ---------------------------------------------------------------------------
// Fitting text
// ---------------------------------------------------------------------------

export type Weight = 400 | 500 | 600;

export interface FontSpec {
  weight: Weight;
  size: number;
  /** Extra space after each letter, in px (the heading's tracking). */
  letterSpacing?: number;
}

/** The advance width of `text` in `font`, without any trailing letter spacing. */
export type Measure = (text: string, font: FontSpec) => number;

/** Greedy word wrap; a word wider than the line is broken between letters. */
export function wrapLines(text: string, maxWidth: number, widthOf: (s: string) => number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  const pushWord = (word: string) => {
    if (widthOf(word) <= maxWidth) return [word];
    const parts: string[] = [];
    let part = "";
    for (const ch of word) {
      if (part && widthOf(part + ch) > maxWidth) {
        parts.push(part);
        part = ch;
      } else part += ch;
    }
    if (part) parts.push(part);
    return parts;
  };
  for (const word of words) {
    for (const piece of pushWord(word)) {
      const next = line ? `${line} ${piece}` : piece;
      if (line && widthOf(next) > maxWidth) {
        lines.push(line);
        line = piece;
      } else line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * The same number of lines, as even as they can be: the narrowest width that still wraps into
 * that many lines (so a two-line name splits near the middle, not "Firstname Middlename" / "X").
 */
function balancedLines(text: string, maxWidth: number, widthOf: (s: string) => number): string[] {
  const target = wrapLines(text, maxWidth, widthOf);
  if (target.length < 2) return target;
  let lo = 0;
  let hi = maxWidth;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (wrapLines(text, mid, widthOf).length <= target.length) hi = mid;
    else lo = mid;
  }
  return wrapLines(text, hi, widthOf);
}

export interface FitStep {
  /** At most this many lines... */
  lines: number;
  /** ...from this size down to `min`, in steps of 2 px. */
  max: number;
  min: number;
}

export interface FittedText {
  size: number;
  lines: string[];
  /** True only when even the last step couldn't hold it and the end was cut with "…". */
  truncated: boolean;
}

/**
 * The largest size, trying one line first, then two, then three ("wraps at most twice"), at which
 * the text fits `maxWidth`. If nothing fits, the last step's smallest size is used and the last
 * line ends in an ellipsis.
 */
export function fitText(text: string, measure: Measure, opts: { maxWidth: number; weight: Weight; steps: FitStep[] }): FittedText {
  const clean = text.trim().replace(/\s+/g, " ");
  for (const step of opts.steps) {
    for (let size = step.max; size >= step.min; size -= 2) {
      const widthOf = (s: string) => measure(s, { weight: opts.weight, size });
      const lines = wrapLines(clean, opts.maxWidth, widthOf);
      if (lines.length <= step.lines) return { size, lines: balancedLines(clean, opts.maxWidth, widthOf), truncated: false };
    }
  }
  const last = opts.steps[opts.steps.length - 1]!;
  const size = last.min;
  const widthOf = (s: string) => measure(s, { weight: opts.weight, size });
  const lines = wrapLines(clean, opts.maxWidth, widthOf).slice(0, last.lines);
  let tail = lines[lines.length - 1] ?? "";
  while (tail && widthOf(`${tail}…`) > opts.maxWidth) tail = tail.slice(0, -1).trimEnd();
  lines[lines.length - 1] = `${tail}…`;
  return { size, lines, truncated: true };
}

// ---------------------------------------------------------------------------
// The layout
// ---------------------------------------------------------------------------

export interface CertificateInput {
  holderName: string;
  title: string;
  kind: CertificateKind;
  issuedAt: number;
  /** The full public link (on PUBLIC_ORIGIN), printed and encoded in the QR. */
  verifyUrl: string;
  signature: CertificateSignature | null;
}

export interface TextRun {
  /** What it is, for tests and the accessible description. */
  role: "heading" | "lead" | "name" | "connector" | "title" | "date" | "date-label" | "signature" | "signature-label" | "verify";
  text: string;
  /** Centre x and baseline y. Every text on the template is centred. */
  cx: number;
  y: number;
  font: FontSpec;
  colour: string;
}

export interface CertificateLayout {
  runs: TextRun[];
  name: FittedText;
  title: FittedText;
  /** The QR square (bottom left, inside the inner border, clear of the date block). */
  qr: { x: number; y: number; size: number };
  /** The clickable area of the verify line (a link in the PDF). */
  verifyBox: { left: number; top: number; right: number; bottom: number };
  /** The lowest baseline of the title block: kept above the seal. */
  contentBottom: number;
}

const CENTRE = PAGE.width / 2;
/** Room for the name and title: the inner border is 1638 wide; this leaves a generous margin. */
export const TEXT_MAX_WIDTH = 1400;
/** The seal's ring starts about here; the title block's last baseline stays above it. */
export const SEAL_TOP = 880;
const DATE_CX = 360;
const SIGNATURE_CX = 1394;
const BLOCK_MAX_WIDTH = 300;

export const NAME_STEPS: FitStep[] = [
  { lines: 1, max: 84, min: 52 },
  { lines: 2, max: 64, min: 44 },
  { lines: 3, max: 44, min: 34 },
];
export const TITLE_STEPS: FitStep[] = [
  { lines: 1, max: 48, min: 34 },
  { lines: 2, max: 40, min: 30 },
  { lines: 3, max: 30, min: 24 },
];

function fitOneLine(text: string, measure: Measure, weight: Weight, max: number, min: number): { text: string; size: number } {
  const fitted = fitText(text, measure, { maxWidth: BLOCK_MAX_WIDTH, weight, steps: [{ lines: 1, max, min }] });
  return { text: fitted.lines[0] ?? "", size: fitted.size };
}

/**
 * Where every word goes. The kit's positions are kept for a short name and title (heading at 330,
 * "This certifies that" 450, name 570, connector 650, title 730, date and signature 1030/1068,
 * verify 1150); a long name or title shrinks first, then wraps, and the lines below move down.
 */
export function layoutCertificate(input: CertificateInput, measure: Measure): CertificateLayout {
  const runs: TextRun[] = [];
  const add = (role: TextRun["role"], text: string, cx: number, y: number, font: FontSpec, colour: string) => runs.push({ role, text, cx, y, font, colour });

  add("heading", "CERTIFICATE OF COMPLETION", CENTRE, 330, { weight: 600, size: 30, letterSpacing: 5.4 }, COLOURS.slate);
  add("lead", "This certifies that", CENTRE, 450, { weight: 400, size: 28 }, COLOURS.slate);

  const name = fitText(input.holderName, measure, { maxWidth: TEXT_MAX_WIDTH, weight: 600, steps: NAME_STEPS });
  // First baseline: 570 for an 84 px name (the kit's), proportionally higher for a smaller one.
  let y = 450 + 38 + name.size * 0.976;
  const nameStep = name.size * 1.12;
  name.lines.forEach((line, i) => add("name", line, CENTRE, y + i * nameStep, { weight: 600, size: name.size }, COLOURS.navy));
  y += (name.lines.length - 1) * nameStep;

  y += 80;
  add("connector", completionLine(input.kind), CENTRE, y, { weight: 400, size: 28 }, COLOURS.slate);

  const title = fitText(input.title, measure, { maxWidth: TEXT_MAX_WIDTH, weight: 600, steps: TITLE_STEPS });
  y += 32 + title.size;
  const titleStep = title.size * 1.2;
  title.lines.forEach((line, i) => add("title", line, CENTRE, y + i * titleStep, { weight: 600, size: title.size }, COLOURS.blue));
  const contentBottom = y + (title.lines.length - 1) * titleStep;

  const date = fitOneLine(formatIssueDate(input.issuedAt), measure, 600, 24, 16);
  add("date", date.text, DATE_CX, 1030, { weight: 600, size: date.size }, COLOURS.navy);
  add("date-label", "Date", DATE_CX, 1068, { weight: 400, size: 18 }, COLOURS.slate);

  const sig = signatureLines(input.signature);
  const above = fitOneLine(sig.above, measure, 600, 24, 16);
  const below = fitOneLine(sig.below, measure, 400, 18, 13);
  add("signature", above.text, SIGNATURE_CX, 1030, { weight: 600, size: above.size }, COLOURS.navy);
  add("signature-label", below.text, SIGNATURE_CX, 1068, { weight: 400, size: below.size }, COLOURS.slate);

  const verifyText = `Verify: ${verifyDisplay(input.verifyUrl)}`;
  const verifyFont: FontSpec = { weight: 400, size: 16 };
  add("verify", verifyText, CENTRE, 1150, verifyFont, COLOURS.hint);
  const vw = measure(verifyText, verifyFont);

  return {
    runs,
    name,
    title,
    qr: { x: 94, y: 1066, size: 96 },
    verifyBox: { left: CENTRE - vw / 2 - 4, top: 1150 - 16, right: CENTRE + vw / 2 + 4, bottom: 1150 + 6 },
    contentBottom,
  };
}
