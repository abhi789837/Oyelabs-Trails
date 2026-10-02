import FormulaParser from "fast-formula-parser";

/**
 * A small spreadsheet for Excel tasks (v4.1 §2c), the same code in the browser grid and the grader.
 *
 * Formulas are evaluated by `fast-formula-parser` (MIT, see docs/v4.1/DECISIONS.md), which covers
 * SUM, AVERAGE, IF, COUNTIF, SUMIF, VLOOKUP, NETWORKDAYS, dates and most of the rest; the five a
 * PM's tracker needs and it lacks — SUMIFS, COUNTIFS, AVERAGEIFS, XLOOKUP and MATCH — are added
 * here. Cells are plain strings: "12", "Ann", or "=SUMIF(A2:A9,"Ann",B2:B9)".
 */

export type CellValue = string | number | boolean | null;
export type Grid = string[][];

export function colName(index: number): string {
  let s = "";
  let n = index + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function cellRef(row: number, col: number): string {
  return `${colName(col)}${row + 1}`;
}

/** "B3" → { row: 2, col: 1 } (0-based). Null for anything that is not a plain cell reference. */
export function parseRef(ref: string): { row: number; col: number } | null {
  const m = /^\$?([A-Z]{1,3})\$?(\d{1,4})$/.exec(ref.trim().toUpperCase());
  if (!m) return null;
  let col = 0;
  for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { row: Number(m[2]) - 1, col: col - 1 };
}

type Arg = { value: unknown };
const flat = (a: Arg): CellValue[] => (Array.isArray(a.value) ? (a.value as CellValue[][]).flat() : [a.value as CellValue]);

/** Excel-style criteria: "Ann", ">5", "<>Y", "=3", ">=2026-01-01" (numbers only for comparisons). */
export function matchesCriteria(value: CellValue, criteria: CellValue): boolean {
  if (typeof criteria === "number") return Number(value) === criteria;
  const text = String(criteria ?? "");
  const m = /^(<>|>=|<=|>|<|=)?(.*)$/.exec(text)!;
  const op = m[1] ?? "=";
  const target = m[2];
  const num = Number(target);
  const isNum = target.trim() !== "" && !Number.isNaN(num);
  if (isNum && op !== "=" && op !== "<>") {
    const v = Number(value);
    if (Number.isNaN(v)) return false;
    return op === ">" ? v > num : op === "<" ? v < num : op === ">=" ? v >= num : v <= num;
  }
  const equal = isNum ? Number(value) === num : String(value ?? "").toLowerCase() === target.toLowerCase();
  return op === "<>" ? !equal : equal;
}

function ifs(args: Arg[], start: number): (i: number) => boolean {
  const pairs: { range: CellValue[]; criteria: CellValue }[] = [];
  for (let i = start; i + 1 < args.length; i += 2) pairs.push({ range: flat(args[i]), criteria: args[i + 1].value as CellValue });
  return (i) => pairs.every((p) => matchesCriteria(p.range[i] ?? null, p.criteria));
}

const extraFunctions = {
  SUMIFS: (...args: Arg[]) => {
    const sum = flat(args[0]);
    const ok = ifs(args, 1);
    return sum.reduce<number>((s, v, i) => (ok(i) && typeof v === "number" ? s + v : s), 0);
  },
  COUNTIFS: (...args: Arg[]) => {
    const first = flat(args[0]);
    const ok = ifs(args, 0);
    return first.reduce<number>((n, _v, i) => (ok(i) ? n + 1 : n), 0);
  },
  AVERAGEIFS: (...args: Arg[]) => {
    const values = flat(args[0]);
    const ok = ifs(args, 1);
    const picked = values.filter((v, i) => ok(i) && typeof v === "number") as number[];
    return picked.length ? picked.reduce((a, b) => a + b, 0) / picked.length : 0;
  },
  XLOOKUP: (lookup: Arg, lookupRange: Arg, returnRange: Arg, ifNotFound?: Arg) => {
    const keys = flat(lookupRange);
    const results = flat(returnRange);
    const i = keys.findIndex((k) => String(k ?? "").toLowerCase() === String(lookup.value ?? "").toLowerCase());
    return i >= 0 ? (results[i] ?? null) : (ifNotFound?.value ?? "#N/A");
  },
  MATCH: (lookup: Arg, range: Arg) => {
    const keys = flat(range);
    const i = keys.findIndex((k) => String(k ?? "").toLowerCase() === String(lookup.value ?? "").toLowerCase());
    return i >= 0 ? i + 1 : "#N/A";
  },
};

function literal(raw: string | undefined): CellValue {
  if (raw === undefined || raw === "") return null;
  const t = raw.trim();
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (/^(true|false)$/i.test(t)) return t.toLowerCase() === "true";
  return raw;
}

export interface Evaluated {
  values: CellValue[][];
  /** "C4": "#DIV/0!" — per formula cell that failed. */
  errors: Record<string, string>;
}

/** Evaluates every cell, formulas included, with references between formulas and a cycle guard. */
export function evaluateSheet(grid: Grid): Evaluated {
  const rows = grid.length;
  const cols = Math.max(0, ...grid.map((r) => r.length));
  const cache = new Map<string, CellValue>();
  const errors: Record<string, string> = {};
  const visiting = new Set<string>();

  const valueAt = (row: number, col: number): CellValue => {
    if (row < 0 || col < 0 || row >= rows || col >= cols) return null;
    const key = `${row}:${col}`;
    if (cache.has(key)) return cache.get(key)!;
    const raw = grid[row]?.[col] ?? "";
    if (!raw.startsWith("=")) {
      const v = literal(raw);
      cache.set(key, v);
      return v;
    }
    if (visiting.has(key)) {
      errors[cellRef(row, col)] = "#CYCLE!";
      return null;
    }
    visiting.add(key);
    let result: CellValue;
    try {
      const out = parser.parse(raw.slice(1), { row: row + 1, col: col + 1, sheet: "Sheet1" }) as unknown;
      result = Array.isArray(out) ? ((out as CellValue[][])[0]?.[0] ?? null) : (out as CellValue);
      if (result && typeof result === "object") {
        const message = String((result as { error?: string; name?: string }).error ?? (result as { name?: string }).name ?? "#ERROR!");
        errors[cellRef(row, col)] = message;
        result = message;
      }
    } catch (error) {
      const message = error && typeof error === "object" && "error" in error ? String((error as { error: unknown }).error) : "#ERROR!";
      errors[cellRef(row, col)] = message;
      result = message;
    }
    visiting.delete(key);
    cache.set(key, result);
    return result;
  };

  const parser = new FormulaParser({
    onCell: ({ row, col }: { row: number; col: number }) => valueAt(row - 1, col - 1),
    onRange: (ref: { from: { row: number; col: number }; to: { row: number; col: number } }) => {
      const out: CellValue[][] = [];
      for (let r = ref.from.row; r <= Math.min(ref.to.row, rows); r += 1) {
        const line: CellValue[] = [];
        for (let c = ref.from.col; c <= Math.min(ref.to.col, cols); c += 1) line.push(valueAt(r - 1, c - 1));
        out.push(line);
      }
      return out;
    },
    functions: extraFunctions,
  });

  const values: CellValue[][] = [];
  for (let r = 0; r < rows; r += 1) {
    const line: CellValue[] = [];
    for (let c = 0; c < cols; c += 1) line.push(valueAt(r, c));
    values.push(line);
  }
  return { values, errors };
}

/** Function names used in a formula, uppercased: "=SUMIF(A1:A3,...)" → ["SUMIF"]. */
export function functionsIn(formula: string): string[] {
  return [...new Set([...formula.toUpperCase().matchAll(/([A-Z][A-Z0-9.]*)\s*\(/g)].map((m) => m[1]))];
}
