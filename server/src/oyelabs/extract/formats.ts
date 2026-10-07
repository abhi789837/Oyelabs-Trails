import type { ExtractionMethod } from "../../../../shared/moduleTests";
import { markdownBlocks, type TextBlock } from "./passages";
import { pick, runtimeImport } from "./runtime";

/**
 * One extractor per document format (PLAN §4.3, libraries in §5). Each returns `TextBlock`s with
 * locators; `passages.ts` turns them into citable passages.
 *
 *   PDF   unpdf.extractText per page → page; scanned (< 200 chars a page) → OCR, at most 40 pages
 *   DOCX  mammoth → HTML → headings as sections
 *   PPTX  officeparser (v8 AST) → slide
 *   XLSX  exceljs → "Header: value" lines, ≤ 2,000 rows a sheet → sheet
 *   CSV   (Google Sheets export) same rendering as XLSX
 *   HTML  @mozilla/readability over linkedom → headings as sections
 *   TXT/MD as is, Markdown headings as sections
 */

export type DocFormat = "pdf" | "docx" | "pptx" | "xlsx" | "csv" | "txt" | "md" | "html";

export interface Extracted {
  method: ExtractionMethod;
  blocks: TextBlock[];
  /** A title the document gives itself (HTML <title>), when it has one. */
  title?: string;
  /** A plain reason when nothing usable came out ("Scanned PDF, OCR found no text"). */
  emptyReason?: string;
}

/** Reads the text in one page image. Injected in tests; tesseract.js in production (ocr.ts). */
export type OcrFn = (png: Uint8Array) => Promise<string>;

export interface ExtractOptions {
  /** Only consulted for scanned PDFs. Absent: scanned pages are reported, not read. */
  ocr?: OcrFn;
}

export const SCANNED_CHARS_PER_PAGE = 200;
export const OCR_MAX_PAGES = 40;
export const SHEET_MAX_ROWS = 2000;

// ---------------------------------------------------------------------------
// Detecting the format
// ---------------------------------------------------------------------------

const EXT_FORMAT: Record<string, DocFormat> = {
  pdf: "pdf",
  docx: "docx",
  pptx: "pptx",
  xlsx: "xlsx",
  csv: "csv",
  txt: "txt",
  text: "txt",
  md: "md",
  markdown: "md",
  html: "html",
  htm: "html",
};

const MIME_FORMAT: [RegExp, DocFormat][] = [
  [/application\/pdf/, "pdf"],
  [/wordprocessingml/, "docx"],
  [/presentationml/, "pptx"],
  [/spreadsheetml/, "xlsx"],
  [/text\/csv/, "csv"],
  [/text\/markdown/, "md"],
  [/text\/html|application\/xhtml/, "html"],
  [/text\/plain/, "txt"],
];

/** Format from magic bytes, then MIME type, then file extension. Null when we can't read it. */
export function detectFormat(body: Uint8Array, mime: string | null, name: string | null): DocFormat | null {
  const head = Buffer.from(body.subarray(0, 8)).toString("latin1");
  if (head.startsWith("%PDF")) return "pdf";
  if (head.startsWith("PK\u0003\u0004")) {
    // An OOXML zip: which kind is in the file names near the start of the archive.
    const peek = Buffer.from(body.subarray(0, Math.min(body.length, 64 * 1024))).toString("latin1");
    if (peek.includes("word/")) return "docx";
    if (peek.includes("ppt/")) return "pptx";
    if (peek.includes("xl/")) return "xlsx";
  }
  const byMime = mime ? MIME_FORMAT.find(([re]) => re.test(mime))?.[1] : undefined;
  if (byMime) return byMime;
  const ext = name ? /\.([a-z0-9]+)(?:$|[?#])/i.exec(name)?.[1]?.toLowerCase() : undefined;
  return ext ? (EXT_FORMAT[ext] ?? null) : null;
}

// ---------------------------------------------------------------------------
// PDF (+ OCR)
// ---------------------------------------------------------------------------

type Unpdf = typeof import("unpdf");

export async function extractPdf(body: Uint8Array, options: ExtractOptions = {}): Promise<Extracted> {
  const unpdf = await runtimeImport<Unpdf>("unpdf");
  const pdf = await unpdf.getDocumentProxy(new Uint8Array(body));
  const { totalPages, text } = await unpdf.extractText(pdf, { mergePages: false });
  const chars = text.reduce((n, t) => n + t.replace(/\s+/g, "").length, 0);
  if (totalPages > 0 && chars / totalPages >= SCANNED_CHARS_PER_PAGE) {
    return { method: "pdf", blocks: text.flatMap((pageText, i) => pageBlocks(pageText, i + 1)) };
  }
  // Too little text for its size: a scan. Read the page images.
  if (!options.ocr) {
    const blocks = text.flatMap((pageText, i) => pageBlocks(pageText, i + 1));
    return blocks.length ? { method: "pdf", blocks } : { method: "pdf", blocks: [], emptyReason: "Scanned PDF: we couldn't read text from it." };
  }
  const pages = Math.min(totalPages, OCR_MAX_PAGES);
  const blocks: TextBlock[] = [];
  for (let page = 1; page <= pages; page++) {
    const png = await unpdf.renderPageAsImage(pdf, page, { canvasImport: () => runtimeImport<typeof import("@napi-rs/canvas")>("@napi-rs/canvas"), scale: 2 });
    const read = await options.ocr(new Uint8Array(png));
    blocks.push(...pageBlocks(read, page));
  }
  if (blocks.length === 0) return { method: "ocr", blocks, emptyReason: "Scanned PDF: the text reader found no words in it." };
  return { method: "ocr", blocks };
}

function pageBlocks(pageText: string, page: number): TextBlock[] {
  // pdf.js joins lines with "\n"; paragraphs are separated by blank lines or end with a full stop.
  return pageText
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter((p) => p.length > 0)
    .map((text) => ({ text, locator: { page } }));
}

// ---------------------------------------------------------------------------
// HTML-shaped sources: DOCX (via mammoth) and web pages (via Readability)
// ---------------------------------------------------------------------------

type Linkedom = typeof import("linkedom");

interface DomNode {
  nodeType: number;
  tagName?: string;
  textContent: string | null;
  childNodes: ArrayLike<DomNode>;
}

const BLOCK_TAGS = new Set(["P", "LI", "PRE", "BLOCKQUOTE", "TABLE", "DT", "DD", "FIGCAPTION", "TR"]);
const HEADING = /^H[1-6]$/;

/** Walks an HTML body: headings set the section, block elements become blocks. */
export async function htmlBlocks(html: string): Promise<TextBlock[]> {
  const { parseHTML } = await runtimeImport<Linkedom>("linkedom");
  const { document } = parseHTML(`<!doctype html><html><body>${html}</body></html>`);
  const blocks: TextBlock[] = [];
  let section: string | undefined;
  const walk = (node: DomNode) => {
    const tag = node.tagName?.toUpperCase();
    if (tag && HEADING.test(tag)) {
      const heading = (node.textContent ?? "").replace(/\s+/g, " ").trim();
      if (heading) section = heading;
      return;
    }
    if (tag && BLOCK_TAGS.has(tag) && tag !== "TR") {
      if (tag === "TABLE") {
        for (const row of Array.from((node as unknown as { querySelectorAll(s: string): ArrayLike<DomNode> }).querySelectorAll("tr"))) {
          const cells = Array.from((row as unknown as { querySelectorAll(s: string): ArrayLike<DomNode> }).querySelectorAll("th,td")).map((c) => (c.textContent ?? "").trim());
          const line = cells.filter(Boolean).join(" | ");
          if (line) blocks.push({ text: line, locator: section ? { section } : {} });
        }
        return;
      }
      const text = tag === "PRE" ? `\`\`\`\n${node.textContent ?? ""}\n\`\`\`` : (node.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text.replace(/`/g, "").trim()) blocks.push({ text, locator: section ? { section } : {} });
      return;
    }
    for (const child of Array.from(node.childNodes)) if (child.nodeType === 1) walk(child);
  };
  walk(document.body as unknown as DomNode);
  return blocks;
}

export async function extractDocx(body: Uint8Array): Promise<Extracted> {
  const mammoth = pick<{ convertToHtml(input: { buffer: Buffer }): Promise<{ value: string }> }>(await runtimeImport("mammoth"));
  const { value } = await mammoth.convertToHtml({ buffer: Buffer.from(body) });
  return { method: "docx", blocks: await htmlBlocks(value) };
}

/** A web page's main text (navigation, footers and ads dropped by Readability). */
export async function extractHtml(html: string): Promise<Extracted> {
  const { parseHTML } = await runtimeImport<Linkedom>("linkedom");
  const { Readability } = await runtimeImport<typeof import("@mozilla/readability")>("@mozilla/readability");
  const { document } = parseHTML(html);
  const article = new Readability(document as unknown as ConstructorParameters<typeof Readability>[0]).parse();
  if (!article?.content) return { method: "readability", blocks: [], emptyReason: "We couldn't find the main text on that page." };
  const blocks = await htmlBlocks(article.content);
  return { method: "readability", blocks, ...(article.title ? { title: article.title.trim() } : {}) };
}

// ---------------------------------------------------------------------------
// PPTX (officeparser v8)
// ---------------------------------------------------------------------------

interface OfficeNode {
  type: string;
  text?: string;
  children?: OfficeNode[];
  notes?: OfficeNode[];
  metadata?: { slideNumber?: number };
}

function nodeTexts(node: OfficeNode, out: string[]): void {
  if ((node.type === "paragraph" || node.type === "heading") && node.text?.trim()) {
    out.push(node.text.trim());
    return;
  }
  for (const child of node.children ?? []) nodeTexts(child, out);
}

export async function extractPptx(body: Uint8Array): Promise<Extracted> {
  const { OfficeParser } = await runtimeImport<typeof import("officeparser")>("officeparser");
  const ast = await OfficeParser.parseOffice(Buffer.from(body), { ocr: false, extractAttachments: false, fileType: "pptx" });
  const blocks: TextBlock[] = [];
  (ast.content as unknown as OfficeNode[])
    .filter((n) => n.type === "slide")
    .forEach((slide, i) => {
      const lines: string[] = [];
      nodeTexts(slide, lines);
      const notes: string[] = [];
      for (const note of slide.notes ?? []) nodeTexts(note, notes);
      const text = [...lines, ...(notes.length ? [`Speaker notes: ${notes.join(" ")}`] : [])].join("\n");
      if (text.trim()) blocks.push({ text, locator: { slide: slide.metadata?.slideNumber ?? i + 1 } });
    });
  return { method: "pptx", blocks };
}

// ---------------------------------------------------------------------------
// Spreadsheets
// ---------------------------------------------------------------------------

/** "Header: value; Header: value" per row, so a row reads as a sentence and quotes exactly. */
export function rowLines(rows: string[][], sheet: string): TextBlock[] {
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim()));
  if (nonEmpty.length === 0) return [];
  const [header, ...data] = nonEmpty;
  const names = header.map((h, i) => h.trim() || `Column ${i + 1}`);
  const lines = (data.length ? data : [header]).slice(0, SHEET_MAX_ROWS).map((row) =>
    data.length
      ? row
          .map((cell, i) => (cell.trim() ? `${names[i] ?? `Column ${i + 1}`}: ${cell.trim()}` : ""))
          .filter(Boolean)
          .join("; ")
      : row.filter((c) => c.trim()).join("; "),
  );
  return lines.filter(Boolean).map((text) => ({ text, locator: { sheet } }));
}

export async function extractXlsx(body: Uint8Array): Promise<Extracted> {
  const ExcelJS = pick<typeof import("exceljs")>(await runtimeImport("exceljs"));
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(body) as unknown as ArrayBuffer);
  const blocks: TextBlock[] = [];
  workbook.eachSheet((sheet) => {
    const rows: string[][] = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      if (rows.length > SHEET_MAX_ROWS) return;
      const cells: string[] = [];
      for (let c = 1; c <= sheet.columnCount; c++) cells.push(String(row.getCell(c).text ?? ""));
      rows.push(cells);
    });
    blocks.push(...rowLines(rows, sheet.name));
  });
  return { method: "xlsx", blocks };
}

/** RFC 4180-ish CSV: quoted fields, doubled quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

export async function extractByFormat(format: DocFormat, body: Uint8Array, options: ExtractOptions & { sheetName?: string } = {}): Promise<Extracted> {
  switch (format) {
    case "pdf":
      return extractPdf(body, options);
    case "docx":
      return extractDocx(body);
    case "pptx":
      return extractPptx(body);
    case "xlsx":
      return extractXlsx(body);
    case "csv":
      return { method: "text", blocks: rowLines(parseCsv(Buffer.from(body).toString("utf8")), options.sheetName ?? "Sheet 1") };
    case "md":
      return { method: "text", blocks: markdownBlocks(Buffer.from(body).toString("utf8")) };
    case "txt":
      return { method: "text", blocks: markdownBlocks(Buffer.from(body).toString("utf8"), false) };
    case "html":
      return extractHtml(Buffer.from(body).toString("utf8"));
  }
}
