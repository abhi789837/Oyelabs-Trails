import { createHash } from "node:crypto";

import type { ModulePassage, ModuleSourceKind, PassageLocator } from "../../../../shared/moduleTests";

/**
 * Turning extracted text into citable passages (PLAN §4.3).
 *
 * Every extractor returns `TextBlock`s: a paragraph (or a slide, a sheet row group, a caption
 * segment) with where it sits. `toPassages` packs consecutive blocks from the same place (page,
 * slide, sheet, section) into passages of about 800–1,200 characters, never splitting a code
 * block, and numbers them `<prefix><source code>.<n>`.
 *
 * Ids are stable for unchanged text: the same input always gives the same blocks and therefore the
 * same ids, so an item's citation survives a re-read of a source that did not change. The source
 * code is a short hash of the source id rather than its position, so reordering docs in the editor
 * does not renumber anything.
 */

export interface TextBlock {
  text: string;
  locator: PassageLocator;
}

export interface SourceRef {
  kind: ModuleSourceKind;
  id: string;
  title: string;
}

export const PASSAGE_TARGET_CHARS = 800;
export const PASSAGE_MAX_CHARS = 1200;
/** The passage schema's hard cap; a code block longer than this is split by lines. */
const PASSAGE_HARD_MAX = 6000;

const PREFIX: Record<ModuleSourceKind, string> = { doc: "doc", doc_link: "doc", video: "vid", note: "note", description: "desc" };

export function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

/** `doc3fa2`, `vid91c0`, `note5b1e`: short and stable per source. */
export function sourceCode(kind: ModuleSourceKind, sourceId: string): string {
  return `${PREFIX[kind]}${sha256(`${kind}:${sourceId}`).slice(0, 4)}`;
}

/** Collapses spaces inside lines, keeps line breaks (code and lists need them), trims. */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isCode(text: string): boolean {
  return /^\s*```/.test(text);
}

/** Splits an over-long paragraph: code by lines, prose by sentences, without losing a character. */
function splitLong(text: string): string[] {
  const limit = isCode(text) ? PASSAGE_HARD_MAX : PASSAGE_MAX_CHARS;
  if (text.length <= limit) return [text];
  const parts = isCode(text) ? text.split(/(?<=\n)/) : text.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  let current = "";
  for (const part of parts) {
    if (current && current.length + part.length + 1 > limit) {
      out.push(current.trim());
      current = "";
    }
    if (part.length > limit) {
      for (let i = 0; i < part.length; i += limit) out.push(part.slice(i, i + limit).trim());
      continue;
    }
    current += (current && !isCode(text) ? " " : "") + part;
  }
  if (current.trim()) out.push(current.trim());
  return out.filter(Boolean);
}

function placeKey(l: PassageLocator): string {
  return JSON.stringify([l.page ?? null, l.slide ?? null, l.sheet ?? null, l.section ?? null]);
}

function mergeLocator(a: PassageLocator, b: PassageLocator): PassageLocator {
  const out: PassageLocator = { ...a };
  if (b.startSec !== undefined) out.startSec = Math.min(a.startSec ?? b.startSec, b.startSec);
  if (b.endSec !== undefined) out.endSec = Math.max(a.endSec ?? b.endSec, b.endSec);
  return out;
}

function cleanLocator(l: PassageLocator): PassageLocator {
  const out: PassageLocator = {};
  if (l.page !== undefined) out.page = l.page;
  if (l.slide !== undefined) out.slide = l.slide;
  if (l.sheet) out.sheet = l.sheet.slice(0, 120);
  if (l.section) out.section = l.section.replace(/\s+/g, " ").trim().slice(0, 200);
  if (l.startSec !== undefined) out.startSec = Math.max(0, Math.round(l.startSec * 10) / 10);
  if (l.endSec !== undefined) out.endSec = Math.max(0, Math.round(l.endSec * 10) / 10);
  return out;
}

/** Packs blocks into passages. `startAt` continues the numbering (transcripts arrive in chunks). */
export function toPassages(blocks: TextBlock[], source: SourceRef, startAt = 0): ModulePassage[] {
  const code = sourceCode(source.kind, source.id);
  const out: ModulePassage[] = [];
  let buffer: string[] = [];
  let locator: PassageLocator | null = null;
  let key = "";

  const flush = () => {
    if (!locator || buffer.length === 0) return;
    out.push({
      id: `${code}.${startAt + out.length + 1}`,
      sourceKind: source.kind,
      sourceId: source.id.slice(0, 64),
      sourceTitle: (source.title || "Untitled").slice(0, 200),
      locator: cleanLocator(locator),
      text: buffer.join("\n\n"),
    });
    buffer = [];
    locator = null;
  };

  for (const block of blocks) {
    const text = cleanText(block.text);
    if (!text) continue;
    for (const piece of splitLong(text)) {
      const k = placeKey(block.locator);
      const size = buffer.reduce((n, b) => n + b.length + 2, 0);
      if (locator && (k !== key || size >= PASSAGE_TARGET_CHARS || size + piece.length > PASSAGE_MAX_CHARS)) flush();
      key = k;
      locator = locator ? mergeLocator(locator, block.locator) : { ...block.locator };
      buffer.push(piece);
    }
  }
  flush();
  return out;
}

/** Paragraphs of Markdown or plain text, with `#` headings as sections. Code fences stay whole. */
export function markdownBlocks(markdown: string, markdownHeadings = true): TextBlock[] {
  const blocks: TextBlock[] = [];
  let section: string | undefined;
  let current: string[] = [];
  let inFence = false;
  const push = () => {
    const text = current.join("\n").trim();
    if (text) blocks.push({ text, locator: section ? { section } : {} });
    current = [];
  };
  for (const line of markdown.replace(/\r\n?/g, "\n").split("\n")) {
    if (/^\s*```/.test(line)) {
      if (!inFence) push();
      inFence = !inFence;
      current.push(line);
      if (!inFence) push();
      continue;
    }
    if (inFence) {
      current.push(line);
      continue;
    }
    const heading = markdownHeadings ? /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/.exec(line) : null;
    if (heading) {
      push();
      section = heading[1].trim();
      continue;
    }
    if (line.trim() === "") {
      push();
      continue;
    }
    current.push(line);
  }
  push();
  return blocks;
}

/** Total characters of passage text. */
export function passageChars(passages: readonly Pick<ModulePassage, "text">[]): number {
  return passages.reduce((n, p) => n + p.text.length, 0);
}
