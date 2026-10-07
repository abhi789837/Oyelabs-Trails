import { describe, expect, test } from "vitest";

import { cardStatus, formatBytes, minutesToSeconds, moveItem, pastedLinks } from "./fieldLogic";

describe("link field logic", () => {
  test("pasted links: one per line, no blanks or repeats", () => {
    expect(pastedLinks("https://youtu.be/a1\n\n  https://drive.google.com/file/d/x/view,\nhttps://youtu.be/a1", ["https://vimeo.com/1"])).toEqual(["https://youtu.be/a1", "https://drive.google.com/file/d/x/view"]);
    expect(pastedLinks("https://vimeo.com/1", ["https://vimeo.com/1"])).toEqual([]);
  });
  test("move", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b"], 1, 5)).toEqual(["a", "b"]);
  });
  test("status lines", () => {
    expect(cardStatus("ok", null, "video").line).toBe("Plays ✓");
    expect(cardStatus("private", { code: "private", message: "This Drive video is private.", fix: "Share…" }, "video")).toEqual({ tone: "problem", line: "Can't play: This Drive video is private.", fix: "Share…" });
    expect(cardStatus(null, null, "doc").tone).toBe("pending");
  });
  test("minutes and sizes", () => {
    expect(minutesToSeconds("12")).toBe(720);
    expect(minutesToSeconds("1,5")).toBe(90);
    expect(minutesToSeconds("")).toBeNull();
    expect(minutesToSeconds("-3")).toBeNull();
    expect(formatBytes(45 * 1024 * 1024)).toBe("45 MB");
    expect(formatBytes(1.2 * 1024 ** 3)).toBe("1.2 GB");
  });
});
