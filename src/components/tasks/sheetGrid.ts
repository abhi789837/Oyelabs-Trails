import { cellRef, evaluateSheet, parseRef, type CellValue, type Evaluated, type Grid } from "@shared/sheet";

/**
 * Pure helpers behind the Excel task's grid: placing the learner's entries, moving between the
 * editable cells from the keyboard, and how a computed value reads. Kept out of the component so
 * they are tested without a DOM.
 */

export interface Coord {
  row: number;
  col: number;
}

/** The grid padded to a rectangle wide and tall enough for every editable cell. */
export function sheetShape(grid: Grid, editable: readonly string[]): { rows: number; cols: number } {
  let rows = grid.length;
  let cols = Math.max(0, ...grid.map((r) => r.length));
  for (const ref of editable) {
    const at = parseRef(ref);
    if (!at) continue;
    rows = Math.max(rows, at.row + 1);
    cols = Math.max(cols, at.col + 1);
  }
  return { rows, cols };
}

/**
 * The grid with the learner's entries in their editable cells — and only there, as the grader
 * does it. Entries for any other reference are ignored.
 */
export function gridWithEntries(grid: Grid, editable: readonly string[], cells: Record<string, string>): Grid {
  const { rows, cols } = sheetShape(grid, editable);
  const out: Grid = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => grid[r]?.[c] ?? ""));
  for (const ref of editable) {
    const at = parseRef(ref);
    if (!at) continue;
    out[at.row][at.col] = (cells[ref] ?? "").trim();
  }
  return out;
}

/** Evaluates the sheet as the learner has filled it. */
export function evaluateWithEntries(grid: Grid, editable: readonly string[], cells: Record<string, string>): Evaluated {
  return evaluateSheet(gridWithEntries(grid, editable, cells));
}

/** Editable cells in reading order (row by row, left to right), deduplicated, normalised to "D2". */
export function editableInOrder(editable: readonly string[]): Coord[] {
  const seen = new Set<string>();
  const out: Coord[] = [];
  for (const ref of editable) {
    const at = parseRef(ref);
    if (!at) continue;
    const key = cellRef(at.row, at.col);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(at);
  }
  return out.sort((a, b) => a.row - b.row || a.col - b.col);
}

export type GridMove = "up" | "down" | "left" | "right" | "next" | "prev";

/**
 * The editable cell a key moves to, or null when there is none that way (Tab then leaves the grid
 * as it normally would).
 *
 * - up/down: the nearest editable cell above/below, preferring the same column, then the closest column.
 * - left/right: the nearest editable cell in the same row; past the row's end, the previous/next in reading order.
 * - next/prev (Tab, Enter): reading order.
 */
export function moveInSheet(editable: readonly string[], from: string, move: GridMove): string | null {
  const cells = editableInOrder(editable);
  const at = parseRef(from);
  if (!at || cells.length === 0) return null;
  const index = cells.findIndex((c) => c.row === at.row && c.col === at.col);
  const ref = (c: Coord | undefined) => (c ? cellRef(c.row, c.col) : null);

  switch (move) {
    case "next":
      return index < 0 ? null : ref(cells[index + 1]);
    case "prev":
      return index < 0 ? null : ref(cells[index - 1]);
    case "left":
    case "right": {
      const dir = move === "right" ? 1 : -1;
      const sameRow = cells
        .filter((c) => c.row === at.row && (c.col - at.col) * dir > 0)
        .sort((a, b) => Math.abs(a.col - at.col) - Math.abs(b.col - at.col));
      if (sameRow[0]) return ref(sameRow[0]);
      return index < 0 ? null : ref(cells[index + dir]);
    }
    case "up":
    case "down": {
      const dir = move === "down" ? 1 : -1;
      const candidates = cells
        .filter((c) => (c.row - at.row) * dir > 0)
        .sort(
          (a, b) =>
            Math.abs(a.col - at.col) - Math.abs(b.col - at.col) ||
            Math.abs(a.row - at.row) - Math.abs(b.row - at.row) ||
            a.col - b.col,
        );
      return ref(candidates[0]);
    }
  }
}

/** Keyboard keys the grid handles, as moves. Arrow keys left/right only move at the text's edge. */
export function keyToMove(
  key: string,
  shift: boolean,
  caret: { start: number | null; end: number | null; length: number },
): GridMove | null {
  switch (key) {
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    case "ArrowLeft":
      return caret.start === 0 && caret.end === 0 ? "left" : null;
    case "ArrowRight":
      return caret.start === caret.length && caret.end === caret.length ? "right" : null;
    case "Tab":
      return shift ? "prev" : "next";
    case "Enter":
      return shift ? "prev" : "next";
    default:
      return null;
  }
}

const ERROR_RE = /^#[A-Z0-9/.]+[!?]$|^#N\/A$/;

export function isErrorValue(value: CellValue): boolean {
  return typeof value === "string" && ERROR_RE.test(value.trim());
}

/** How a computed value reads in a cell: numbers to at most 2 decimals, booleans as TRUE/FALSE. */
export function formatCellValue(value: CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "#NUM!";
    return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
  }
  return value;
}

export type Rag = "red" | "amber" | "green";

/** "Red" / "Amber" / "Green" (any case, trimmed) get a status colour. */
export function ragOf(value: CellValue): Rag | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  return v === "red" || v === "amber" || v === "green" ? v : null;
}

/** A header row: every filled cell is text and at least two are filled. */
export function looksLikeHeader(row: readonly string[] | undefined): boolean {
  if (!row) return false;
  const filled = row.filter((c) => c.trim() !== "");
  return filled.length >= 2 && filled.every((c) => !c.startsWith("=") && Number.isNaN(Number(c)));
}
