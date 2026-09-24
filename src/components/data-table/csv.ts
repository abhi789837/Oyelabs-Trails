/**
 * CSV export.
 *
 * Two things here are not obvious and both matter.
 *
 * **Formula injection.** A CSV is opened in Excel, Sheets or Numbers, and every one of them will
 * *evaluate* a cell beginning with `=`, `+`, `-`, `@` or a control character. A display name of
 * `=HYPERLINK("https://…","Click")` — or worse, a `=cmd|…` DDE payload — becomes a live formula in
 * the recipient's spreadsheet. Since these exports are lists of people and audit entries whose
 * text came from a form, every risky cell is prefixed with an apostrophe, which spreadsheets read
 * as "this is text" and strip on display. This is the OWASP-recommended mitigation and it is the
 * single most important line in the file.
 *
 * **Line endings and the BOM.** `\r\n` and a UTF-8 byte-order mark, because Excel on Windows
 * opens a BOM-less UTF-8 file as the system code page and turns every non-ASCII name into mojibake.
 * The BOM costs three bytes and fixes it everywhere that matters.
 */

/** Cells starting with any of these are executed by at least one major spreadsheet. */
const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = typeof value === "string" ? value : String(value);

  if (FORMULA_PREFIXES.some((prefix) => text.startsWith(prefix))) text = `'${text}`;

  // Quote whenever the cell contains a delimiter, a quote or a newline; double any inner quotes.
  if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export interface CsvColumn<TRow> {
  header: string;
  value: (row: TRow) => unknown;
}

export function toCsv<TRow>(rows: readonly TRow[], columns: readonly CsvColumn<TRow>[]): string {
  const lines = [columns.map((column) => escapeCsvCell(column.header)).join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => escapeCsvCell(column.value(row))).join(","));
  }
  return lines.join("\r\n");
}

/** `people-2026-09-24.csv` — dated, because an export is a snapshot and its age matters. */
export function csvFileName(base: string, at: Date = new Date()): string {
  const stamp = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`;
  const slug = base.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "export";
  return `${slug}-${stamp}.csv`;
}

/**
 * Hands the file to the browser.
 *
 * Kept out of `toCsv` so the string-building half stays testable in Node, where there is no
 * `Blob`, no `URL.createObjectURL` and no document to append a link to.
 */
export function downloadCsv(csv: string, fileName: string): void {
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoking immediately can cancel the download in Safari; a tick is enough everywhere.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
