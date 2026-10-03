import type { BankItem } from "./bank";

/**
 * Designed to finish on time (v4.1 §1c).
 *
 * Every item gets a deterministic time estimate from what it asks the learner to read and do, and
 * must fit hard size limits. The assembler then makes the 25 items add up to 26–32 minutes. The
 * constants are calibrated weekly from real answer times (`timing.constants` in app_meta).
 */

export interface TimingConstants {
  /** Prose reading speed. */
  readWpm: number;
  /** Seconds to read one line of code. */
  codeLineSec: number;
  /** Seconds to write or change one line of code. */
  writeLineSec: number;
  /** Seconds per spreadsheet cell to fill. */
  cellSec: number;
  /** Writing speed for written answers. */
  writeWpm: number;
  /** Fixed thinking time per item. */
  thinkSec: number;
}

export const DEFAULT_TIMING: TimingConstants = { readWpm: 200, codeLineSec: 6, writeLineSec: 10, cellSec: 8, writeWpm: 25, thinkSec: 15 };

export const TOTAL_MIN_SEC = 26 * 60;
export const TOTAL_MAX_SEC = 32 * 60;
/** A slot's ceiling. Hands-on items aim for 60–80 s, MCQs for 30–50 s. */
export const SLOT_TARGET_SEC = { handsOn: 80, mcq: 50 } as const;
export const SLOT_FLOOR_SEC = { handsOn: 45, mcq: 20 } as const;

export const SIZE_LIMITS = {
  promptWords: 60,
  starterLines: 15,
  changedLines: 5,
  snippetLines: 12,
  optionWords: 15,
  writeWords: 80,
  excelCells: 10,
  rankItems: 6,
  /** v4.2 simulations, sized for one 80 s slot. */
  categorizeItems: 6,
  formFields: 3,
  formContextWords: 80,
  roleplayTurns: 3,
} as const;

/** v4.2: seconds per form field to fill, and per typed role-play reply. */
export const FORM_FIELD_SEC = 20;
export const ROLEPLAY_TURN_SEC = 25;
/** v4.3: seconds per terminal command to recall and type. */
export const TERMINAL_COMMAND_SEC = 15;

export function words(text: string): number {
  return text.replace(/```[\s\S]*?```/g, " ").trim() ? text.replace(/```[\s\S]*?```/g, " ").trim().split(/\s+/).length : 0;
}

function lines(code: string | null | undefined): number {
  if (!code) return 0;
  return code.replace(/\s+$/, "").split("\n").filter((l) => l.trim().length > 0).length;
}

function codeBlockLines(text: string): number {
  return [...text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].reduce((sum, m) => sum + lines(m[1]), 0);
}

/** Lines that differ between starter and reference: roughly what the learner must write. */
export function changedLines(starter: string, reference: string): number {
  const a = starter.split("\n").map((l) => l.trim()).filter(Boolean);
  const b = reference.split("\n").map((l) => l.trim()).filter(Boolean);
  const inA = new Map<string, number>();
  for (const l of a) inA.set(l, (inA.get(l) ?? 0) + 1);
  let changed = 0;
  for (const l of b) {
    const n = inA.get(l) ?? 0;
    if (n > 0) inA.set(l, n - 1);
    else changed += 1;
  }
  return changed;
}

/** What the item asks the learner to touch, for the size limits and the estimate. */
export interface ItemShape {
  promptWords: number;
  readCodeLines: number;
  starterLines: number;
  changedLines: number;
  snippetLines: number;
  options: number;
  maxOptionWords: number;
  writeWords: number;
  cells: number;
  rankItems: number;
  /** Other reading: segments, steps, scenario text, table cells. */
  extraWords: number;
  decisions: number;
  /** v4.2: form fields to fill (~20 s each). */
  formFields: number;
  /** v4.2: role-play replies to type (~25 s each). */
  turns: number;
  /** v4.2: items to categorise (~8 s each, counted as decisions). */
  categorizeItems: number;
  /** v4.3: terminal commands to type (~15 s each). */
  commands: number;
}

export function shapeOf(item: Pick<BankItem, "type" | "prompt" | "coding" | "mcq" | "task">): ItemShape {
  const shape: ItemShape = {
    promptWords: words(item.prompt),
    readCodeLines: codeBlockLines(item.prompt),
    starterLines: 0,
    changedLines: 0,
    snippetLines: 0,
    options: 0,
    maxOptionWords: 0,
    writeWords: 0,
    cells: 0,
    rankItems: 0,
    extraWords: 0,
    decisions: 0,
    formFields: 0,
    turns: 0,
    categorizeItems: 0,
    commands: 0,
  };
  if (item.coding) {
    shape.starterLines = lines(item.coding.starterCode);
    shape.changedLines = Math.max(1, changedLines(item.coding.starterCode, item.coding.referenceSolution));
  }
  if (item.mcq) {
    shape.snippetLines = lines(item.mcq.snippet);
    shape.options = item.mcq.options.length;
    shape.maxOptionWords = Math.max(0, ...item.mcq.options.map(words));
    shape.extraWords = item.mcq.options.reduce((s, o) => s + words(o), 0);
  }
  const t = item.task as Record<string, unknown> | null;
  if (t) {
    switch (t.kind) {
      case "write":
        shape.writeWords = Number(t.wordLimit ?? 0);
        shape.extraWords = words(String(t.context ?? ""));
        break;
      case "rank":
        shape.rankItems = (t.items as unknown[]).length;
        shape.extraWords = (t.items as { label: string }[]).reduce((s, i) => s + words(i.label), 0);
        break;
      case "calculate":
        shape.decisions = (t.fields as unknown[]).length;
        shape.extraWords = ((t.table as { rows: string[][] } | null)?.rows.flat().length ?? 0) * 1;
        break;
      case "scenario":
        shape.decisions = (t.steps as unknown[]).length;
        shape.extraWords = (t.steps as { question: string; options: string[] }[]).reduce((s, st) => s + words(st.question) + st.options.reduce((x, o) => x + words(o), 0), 0);
        break;
      case "spot":
        shape.extraWords = (t.segments as { text: string }[]).reduce((s, seg) => s + words(seg.text), 0);
        shape.decisions = 1;
        break;
      case "excel":
        shape.cells = (t.editable as unknown[] | undefined)?.length ?? 0;
        shape.extraWords = ((t.grid as unknown[][] | undefined)?.flat().length ?? 0) * 0.5;
        break;
      case "allocate":
        shape.cells = ((t.people as unknown[]).length || 0) * ((t.projects as unknown[]).length || 0);
        break;
      case "sim": {
        // Rows are objects ({ id, cells, issue }), so count their cells, plus the questions' text.
        const rows = (t.rows as { cells: string[] }[] | undefined) ?? [];
        const questions = (t.questions as { question: string; options: string[] }[] | undefined) ?? [];
        shape.extraWords = rows.reduce((s, r) => s + r.cells.length, 0) + questions.reduce((s, q) => s + words(q.question) + q.options.reduce((x, o) => x + words(o), 0), 0);
        shape.decisions = questions.length || 1;
        break;
      }
      case "categorize": {
        const items = (t.items as { text: string }[] | undefined) ?? [];
        const categories = (t.categories as { label: string }[] | undefined) ?? [];
        shape.categorizeItems = items.length;
        shape.decisions = items.length;
        shape.extraWords = items.reduce((s, i) => s + words(i.text), 0) + categories.reduce((s, c) => s + words(c.label), 0);
        break;
      }
      case "form": {
        const fields = (t.fields as { label: string }[] | undefined) ?? [];
        shape.formFields = fields.length;
        shape.extraWords = words(String(t.context ?? "")) + fields.reduce((s, f) => s + words(f.label), 0);
        break;
      }
      case "roleplay":
        shape.turns = Number(t.maxTurns ?? 0);
        shape.extraWords = words(String(t.brief ?? ""));
        break;
      case "terminal": {
        // The intro is terminal output to read; files are code to read, and each checked file is
        // an edit (resolving a conflict is a couple of lines).
        const files = (t.files as { content: string }[] | undefined) ?? [];
        shape.commands = ((t.steps as unknown[] | undefined) ?? []).length;
        shape.extraWords = words(String(t.intro ?? ""));
        shape.readCodeLines += files.reduce((sum, f) => sum + lines(f.content), 0);
        shape.changedLines = ((t.fileChecks as unknown[] | undefined) ?? []).length * 2;
        break;
      }
    }
  }
  return shape;
}

/** Seconds, from the formula in §1c. Deterministic. */
export function estimateSeconds(item: Pick<BankItem, "type" | "prompt" | "coding" | "mcq" | "task">, c: TimingConstants = DEFAULT_TIMING): number {
  const s = shapeOf(item);
  const reading = ((s.promptWords + s.extraWords) / c.readWpm) * 60 + (s.readCodeLines + s.starterLines + s.snippetLines) * c.codeLineSec;
  const work =
    s.changedLines * c.writeLineSec + s.cells * c.cellSec + (s.writeWords / c.writeWpm) * 60 + s.decisions * 8 + s.rankItems * 3 + s.formFields * FORM_FIELD_SEC + s.turns * ROLEPLAY_TURN_SEC + s.commands * TERMINAL_COMMAND_SEC;
  return Math.round(reading + work + c.thinkSec);
}

/** Hard size limits. Empty = fits. Bank items written before v4.1 may fail some; the assembler prefers ones that fit. */
export function sizeProblems(item: Pick<BankItem, "type" | "prompt" | "coding" | "mcq" | "task">): string[] {
  const s = shapeOf(item);
  const out: string[] = [];
  if (s.promptWords > SIZE_LIMITS.promptWords) out.push(`question text is ${s.promptWords} words (max ${SIZE_LIMITS.promptWords})`);
  if (item.coding) {
    if (s.starterLines > SIZE_LIMITS.starterLines) out.push(`starter code is ${s.starterLines} lines (max ${SIZE_LIMITS.starterLines})`);
    if (s.changedLines > SIZE_LIMITS.changedLines) out.push(`the fix needs ${s.changedLines} lines (max ${SIZE_LIMITS.changedLines})`);
  }
  if (item.mcq) {
    if (s.snippetLines > SIZE_LIMITS.snippetLines) out.push(`snippet is ${s.snippetLines} lines (max ${SIZE_LIMITS.snippetLines})`);
    if (s.maxOptionWords > SIZE_LIMITS.optionWords) out.push(`an option is ${s.maxOptionWords} words (max ${SIZE_LIMITS.optionWords})`);
  }
  if (s.writeWords > SIZE_LIMITS.writeWords) out.push(`asks for ${s.writeWords} words (max ${SIZE_LIMITS.writeWords})`);
  if (s.cells > SIZE_LIMITS.excelCells && (item.task as { kind?: string } | null)?.kind === "excel") out.push(`touches ${s.cells} cells (max ${SIZE_LIMITS.excelCells})`);
  if (s.rankItems > SIZE_LIMITS.rankItems) out.push(`ranks ${s.rankItems} items (max ${SIZE_LIMITS.rankItems})`);
  const kind = (item.task as { kind?: string } | null)?.kind;
  if (kind === "categorize" && s.categorizeItems > SIZE_LIMITS.categorizeItems) out.push(`categorises ${s.categorizeItems} items (max ${SIZE_LIMITS.categorizeItems})`);
  if (kind === "form") {
    if (s.formFields > SIZE_LIMITS.formFields) out.push(`has ${s.formFields} fields (max ${SIZE_LIMITS.formFields})`);
    const contextWords = words(String((item.task as { context?: string }).context ?? ""));
    if (contextWords > SIZE_LIMITS.formContextWords) out.push(`context is ${contextWords} words (max ${SIZE_LIMITS.formContextWords})`);
  }
  if (kind === "roleplay" && s.turns > SIZE_LIMITS.roleplayTurns) out.push(`allows ${s.turns} turns (max ${SIZE_LIMITS.roleplayTurns})`);
  return out;
}

export function slotCeiling(type: BankItem["type"]): number {
  return type === "mcq" ? SLOT_TARGET_SEC.mcq : SLOT_TARGET_SEC.handsOn;
}

export function formatMinutes(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
