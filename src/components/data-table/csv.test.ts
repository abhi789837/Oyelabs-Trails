import { describe, expect, test } from "vitest";

import { csvFileName, escapeCsvCell, toCsv } from "./csv";

/**
 * A CSV export of a people table is a file that lands in someone's spreadsheet, and a spreadsheet
 * executes what looks like a formula. Most of these tests are about that.
 */

describe("cell escaping", () => {
  test("plain text passes through untouched", () => {
    expect(escapeCsvCell("Ada Bose")).toBe("Ada Bose");
    expect(escapeCsvCell(42)).toBe("42");
    expect(escapeCsvCell(true)).toBe("true");
    expect(escapeCsvCell(0)).toBe("0");
  });

  test("null and undefined are empty cells, not the words", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  test("delimiters, quotes and newlines are quoted", () => {
    expect(escapeCsvCell("Rao, Chitra")).toBe('"Rao, Chitra"');
    expect(escapeCsvCell('She said "no"')).toBe('"She said ""no"""');
    expect(escapeCsvCell("line one\nline two")).toBe('"line one\nline two"');
    // A trailing carriage return only needs quoting — the formula guard reads the first character.
    expect(escapeCsvCell("carriage\r")).toBe('"carriage\r"');
  });

  test("a cell that a spreadsheet would execute is neutralised", () => {
    // The payloads that matter: formulas, links, and the DDE command-execution family.
    expect(escapeCsvCell("=1+1")).toBe("'=1+1");
    expect(escapeCsvCell('=HYPERLINK("http://evil.test","Click")')).toBe(
      `"'=HYPERLINK(""http://evil.test"",""Click"")"`,
    );
    expect(escapeCsvCell("+44 20 7946 0000")).toBe("'+44 20 7946 0000");
    expect(escapeCsvCell("-1")).toBe("'-1");
    expect(escapeCsvCell("@SUM(A1:A9)")).toBe("'@SUM(A1:A9)");
    // A tab is not a delimiter in a comma-separated file, so it is prefixed but needs no quotes.
    expect(escapeCsvCell("\tTabbed")).toBe("'\tTabbed");
  });

  test("the guard is on the first character only, so ordinary text keeps its symbols", () => {
    expect(escapeCsvCell("A = B")).toBe("A = B");
    expect(escapeCsvCell("well-known")).toBe("well-known");
    expect(escapeCsvCell("user@oyelabs.test")).toBe("user@oyelabs.test");
  });
});

describe("rows", () => {
  interface Row {
    name: string;
    years: number | null;
    note: string;
  }

  const rows: Row[] = [
    { name: "Ada Bose", years: 9, note: "fine" },
    { name: "Rao, Chitra", years: null, note: '=cmd|"/c calc"!A0' },
  ];

  const columns = [
    { header: "Name", value: (row: Row) => row.name },
    { header: "Years", value: (row: Row) => row.years },
    { header: "Note", value: (row: Row) => row.note },
  ];

  test("writes a header row and CRLF line endings", () => {
    const csv = toCsv(rows, columns);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Name,Years,Note");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe("Ada Bose,9,fine");
  });

  test("escapes inside rows, not only in isolation", () => {
    const csv = toCsv(rows, columns);
    expect(csv).toContain('"Rao, Chitra"');
    expect(csv).toContain(`"'=cmd|""/c calc""!A0"`);
    // A null year is an empty cell, so the column count still lines up.
    expect(csv.split("\r\n")[2]!.split(",").length).toBeGreaterThanOrEqual(3);
  });

  test("no rows still produces the header, so the file is not mysteriously empty", () => {
    expect(toCsv([], columns)).toBe("Name,Years,Note");
  });
});

describe("file names", () => {
  test("slug plus date", () => {
    expect(csvFileName("people", new Date(2026, 8, 24))).toBe("people-2026-09-24.csv");
    expect(csvFileName("AI calls", new Date(2026, 0, 5))).toBe("ai-calls-2026-01-05.csv");
    expect(csvFileName("  audit/log  ", new Date(2026, 11, 31))).toBe("audit-log-2026-12-31.csv");
  });

  test("a name with nothing usable in it still produces a file name", () => {
    expect(csvFileName("///", new Date(2026, 0, 1))).toBe("export-2026-01-01.csv");
  });
});
