import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { Course } from "@shared/courses";

import { withoutTopic } from "./library/editor/courseOps";
import { createDeferredQueue } from "./parts/deferred";
import { runUndoable, type UndoToasts } from "./parts/undoable";
import { refusedIds, withStatusOverrides, type PersonRow } from "./people/views";
import { navMode, parseNavPref } from "./shell/navPref";
import { isOlderPage } from "./shell/routes";

describe("admin nav width", () => {
  test("follows the screen until the admin chooses", () => {
    expect(navMode(null, true)).toBe("full");
    expect(navMode(null, false)).toBe("rail");
    expect(navMode("rail", true)).toBe("rail");
    expect(navMode("full", false)).toBe("full");
  });
  test("only a known saved value counts", () => {
    expect(parseNavPref("rail")).toBe("rail");
    expect(parseNavPref("full")).toBe("full");
    expect(parseNavPref("wide")).toBeNull();
    expect(parseNavPref(null)).toBeNull();
  });
});

describe("older pages in the v5 frame", () => {
  test("v5 screens are not older pages", () => {
    for (const p of ["/admin", "/admin/", "/admin/people", "/admin/onboard", "/admin/library", "/admin/library/abc/edit", "/admin/reports", "/admin/overview", "/admin/announcements", "/admin/problems", "/admin/tutor-answers"]) {
      expect(isOlderPage(p), p).toBe(false);
    }
  });
  test("everything else under /admin is", () => {
    for (const p of ["/admin/people/u1", "/admin/onboard/classic", "/admin/departments", "/admin/courses/c1", "/admin/curriculum/test-items", "/admin/assessments/a1/integrity"]) {
      expect(isOlderPage(p), p).toBe(true);
    }
    expect(isOlderPage("/learn")).toBe(false);
  });
});

describe("people: optimistic status", () => {
  const row = (id: string, status: PersonRow["status"]) => ({ id, status }) as PersonRow;
  test("overrides show at once and leave other rows alone", () => {
    const rows = [row("a", "active"), row("b", "active"), row("c", "disabled")];
    const out = withStatusOverrides(rows, { a: "archived", c: "disabled" });
    expect(out.map((r) => r.status)).toEqual(["archived", "active", "disabled"]);
    expect(out[1]).toBe(rows[1]);
    expect(out[2]).toBe(rows[2]);
    expect(withStatusOverrides(rows, {})).toBe(rows);
  });
  test("only refused ids go back", () => {
    expect(refusedIds([{ id: "a", ok: true }, { id: "b", ok: false }, { id: "c", ok: false }])).toEqual(["b", "c"]);
    expect(refusedIds([])).toEqual([]);
  });
});

describe("editor: remove a lesson at once", () => {
  test("drops only that lesson, keeps the parts", () => {
    const course = { id: "c", sections: [{ id: "s1", topics: [{ id: "t1" }, { id: "t2" }] }, { id: "s2", topics: [{ id: "t3" }] }] } as unknown as Course;
    const out = withoutTopic(course, "t2");
    expect(out.sections.map((s) => s.topics.map((t) => t.id))).toEqual([["t1"], ["t3"]]);
    expect(course.sections[0]!.topics).toHaveLength(2);
  });
});

describe("runUndoable", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function harness(opts: { send?: () => Promise<unknown>; reverse?: () => Promise<unknown> } = {}) {
    const log: string[] = [];
    let undo: (() => void) | null = null;
    const toasts: UndoToasts = {
      undo: (message, onUndo) => {
        log.push(`toast:${message}`);
        undo = onUndo;
      },
      error: (title, body) => log.push(`error:${title}|${body ?? ""}`),
      info: (message) => log.push(`info:${message}`),
    };
    const queue = createDeferredQueue(1000);
    runUndoable({
      queue,
      id: "x",
      message: "Archived 1.",
      apply: () => log.push("apply"),
      rollback: () => log.push("rollback"),
      send: opts.send ?? (async () => log.push("send")),
      reverse: opts.reverse,
      failTitle: "We couldn't archive them",
      toasts,
      describe: () => "Check your connection.",
    });
    return { log, queue, undo: () => undo?.() };
  }

  test("changes the screen at once and sends after the window", async () => {
    const h = harness();
    expect(h.log).toEqual(["apply", "toast:Archived 1."]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(h.log).toEqual(["apply", "toast:Archived 1.", "send"]);
  });

  test("Undo inside the window cancels the request", async () => {
    const h = harness();
    h.undo();
    await vi.advanceTimersByTimeAsync(2000);
    expect(h.log).toEqual(["apply", "toast:Archived 1.", "rollback"]);
  });

  test("Undo after sending calls the reverse, then rolls back", async () => {
    const h = harness({ reverse: async () => void h.log.push("reverse") });
    await vi.advanceTimersByTimeAsync(1000);
    h.undo();
    await vi.advanceTimersByTimeAsync(0);
    expect(h.log.slice(-3)).toEqual(["send", "reverse", "rollback"]);
  });

  test("the reverse waits for a request still on its way", async () => {
    let finish: () => void = () => undefined;
    const h = harness({
      send: () =>
        new Promise<void>((resolve) => {
          finish = () => {
            h.log.push("sent");
            resolve();
          };
        }),
      reverse: async () => void h.log.push("reverse"),
    });
    await vi.advanceTimersByTimeAsync(1000);
    h.undo();
    await vi.advanceTimersByTimeAsync(0);
    expect(h.log).not.toContain("reverse");
    finish();
    await vi.advanceTimersByTimeAsync(0);
    expect(h.log.slice(-3)).toEqual(["sent", "reverse", "rollback"]);
  });

  test("Undo too late with no reverse says so plainly", async () => {
    const h = harness();
    await vi.advanceTimersByTimeAsync(1000);
    h.undo();
    expect(h.log.at(-1)).toBe("info:That was already done, so it can't be undone here.");
    expect(h.log).not.toContain("rollback");
  });

  test("a failed request rolls back with a plain error", async () => {
    const h = harness({ send: () => Promise.reject(new Error("offline")) });
    await vi.advanceTimersByTimeAsync(1000);
    expect(h.log.slice(-2)).toEqual(["rollback", "error:We couldn't archive them|Check your connection. Nothing changed."]);
  });

  test("leaving the page sends what is waiting", async () => {
    const h = harness();
    await h.queue.flush();
    expect(h.log.at(-1)).toBe("send");
  });
});

describe("chart numbers", () => {
  test("units, money first, small numbers keep two decimals", async () => {
    const { chartValue } = await import("./parts/chartFormat");
    expect(chartValue(0.225, "h")).toBe("0.23h");
    expect(chartValue(4, "$")).toBe("$4");
    expect(chartValue(12.6, "%")).toBe("13%");
    expect(chartValue(0)).toBe("0");
    expect(chartValue("x")).toBe("x");
  });
});
