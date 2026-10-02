import { describe, expect, it } from "vitest";

import {
  editableInOrder,
  evaluateWithEntries,
  formatCellValue,
  gridWithEntries,
  isErrorValue,
  keyToMove,
  looksLikeHeader,
  moveInSheet,
  ragOf,
} from "./sheetGrid";

const grid = [
  ["Name", "Hours", "Billable", "Ann billable", "Status"],
  ["Ann", "30", "Y", "", ""],
  ["Bo", "12", "N", "", ""],
  ["Ann", "15", "Y", "", ""],
];

describe("sheet entries", () => {
  it("only editable cells take the learner's entries", () => {
    const out = gridWithEntries(grid, ["D2"], { D2: " =1+1 ", B2: "999" });
    expect(out[1][3]).toBe("=1+1");
    expect(out[1][1]).toBe("30");
  });

  it("grows the grid for an editable cell past its edge", () => {
    const out = gridWithEntries(grid, ["F5"], { F5: "1" });
    expect(out).toHaveLength(5);
    expect(out[4][5]).toBe("1");
  });

  it("evaluates formulas against the entries", () => {
    const { values } = evaluateWithEntries(grid, ["D2", "E2"], { D2: '=SUMIF(A2:A4,"Ann",B2:B4)', E2: '=IF(D2>40,"Red","Green")' });
    expect(values[1][3]).toBe(45);
    expect(values[1][4]).toBe("Red");
  });

  it("surfaces errors", () => {
    const { values, errors } = evaluateWithEntries(grid, ["D2"], { D2: "=B2/0" });
    expect(errors.D2).toBeTruthy();
    expect(isErrorValue(values[1][3])).toBe(true);
  });
});

describe("grid navigation", () => {
  const editable = ["E3", "D2", "E2", "D3", "B5"];

  it("orders editable cells row by row", () => {
    expect(editableInOrder(editable).map((c) => `${c.row}:${c.col}`)).toEqual(["1:3", "1:4", "2:3", "2:4", "4:1"]);
  });

  it("Tab and Enter go in reading order and stop at the ends", () => {
    expect(moveInSheet(editable, "D2", "next")).toBe("E2");
    expect(moveInSheet(editable, "E2", "next")).toBe("D3");
    expect(moveInSheet(editable, "B5", "next")).toBeNull();
    expect(moveInSheet(editable, "D2", "prev")).toBeNull();
  });

  it("up and down prefer the same column, then the nearest", () => {
    expect(moveInSheet(editable, "D2", "down")).toBe("D3");
    expect(moveInSheet(editable, "D3", "down")).toBe("B5");
    expect(moveInSheet(editable, "E3", "up")).toBe("E2");
    expect(moveInSheet(editable, "D2", "up")).toBeNull();
  });

  it("left and right stay in the row, then wrap in reading order", () => {
    expect(moveInSheet(editable, "D2", "right")).toBe("E2");
    expect(moveInSheet(editable, "E2", "right")).toBe("D3");
    expect(moveInSheet(editable, "D3", "left")).toBe("E2");
  });

  it("left and right move only at the caret's edge", () => {
    expect(keyToMove("ArrowLeft", false, { start: 0, end: 0, length: 4 })).toBe("left");
    expect(keyToMove("ArrowLeft", false, { start: 2, end: 2, length: 4 })).toBeNull();
    expect(keyToMove("ArrowRight", false, { start: 4, end: 4, length: 4 })).toBe("right");
    expect(keyToMove("Tab", true, { start: 0, end: 0, length: 0 })).toBe("prev");
    expect(keyToMove("Enter", false, { start: 0, end: 0, length: 0 })).toBe("next");
    expect(keyToMove("a", false, { start: 0, end: 0, length: 0 })).toBeNull();
  });

  it("from a cell that is not editable", () => {
    expect(moveInSheet(editable, "A1", "next")).toBeNull();
    expect(moveInSheet(editable, "A1", "down")).toBe("B5");
  });
});

describe("cell display", () => {
  it("formats values", () => {
    expect(formatCellValue(45)).toBe("45");
    expect(formatCellValue(1 / 3)).toBe("0.33");
    expect(formatCellValue(true)).toBe("TRUE");
    expect(formatCellValue(null)).toBe("");
  });

  it("reads RAG and errors", () => {
    expect(ragOf(" amber ")).toBe("amber");
    expect(ragOf("Redish")).toBeNull();
    expect(isErrorValue("#DIV/0!")).toBe(true);
    expect(isErrorValue("#NAME?")).toBe(true);
    expect(isErrorValue("#N/A")).toBe(true);
    expect(isErrorValue("#1")).toBe(false);
  });

  it("spots a header row", () => {
    expect(looksLikeHeader(grid[0])).toBe(true);
    expect(looksLikeHeader(grid[1])).toBe(false);
  });
});
