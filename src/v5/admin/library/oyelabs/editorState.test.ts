import { describe, expect, test } from "vitest";

import { draftFromCourseView, draftToCourseInput, type OyelabsCourseView } from "@shared/oyelabsCourses";

import { applyEdit, autosaveLine, emptyDraft, isDirty, moveItem, newerDraftOf, removalNeedsConfirm, withKeys } from "./editorState";

const notes = { type: "doc" as const, content: [{ type: "paragraph", content: [{ type: "text", text: "Hi" }] }] };

function view(over: Partial<OyelabsCourseView> = {}): OyelabsCourseView {
  return {
    id: "c1",
    title: "White-label delivery",
    description: "How we deliver.",
    level: "intermediate",
    departmentIds: ["pm"],
    skillIds: ["s1"],
    published: true,
    version: 2,
    updatedAt: 1000,
    draft: null,
    modules: [
      {
        id: "sec1",
        topicId: "t1",
        position: 0,
        title: "Kick-off",
        notes,
        test: { status: "ready", summary: "8 questions", items: 8, stale: false },
        videos: [
          { id: "v1", position: 0, input: "https://youtu.be/dQw4w9WgXcQ", uploadId: null, kind: "youtube", playerKind: "youtube", tracking: "exact", title: "Found by the checker", titleLocked: false, thumbnailUrl: null, durationSeconds: 212, durationSource: "provider", status: "ok", problem: null, lastCheckedAt: 1 },
          { id: "v2", position: 1, input: "https://example.com/page", uploadId: null, kind: "embed", playerKind: "iframe", tracking: "estimated", title: "My title", titleLocked: true, thumbnailUrl: null, durationSeconds: 300, durationSource: "admin", status: "ok", problem: null, lastCheckedAt: 1 },
        ],
        docs: [{ id: "d1", position: 0, source: "upload", uploadId: "u1", url: null, linkKind: null, title: "Process.pdf", titleLocked: false, mime: "application/pdf", bytes: 10, status: "ok", problem: null, textStatus: "done" }],
      },
    ],
    ...over,
  };
}

describe("editor state", () => {
  test("edits never mutate and keep within limits", () => {
    const start = emptyDraft("k1");
    const next = applyEdit(start, { type: "title", value: "Kick-off" });
    expect(start.title).toBe("");
    expect(next.title).toBe("Kick-off");
    const two = applyEdit(next, { type: "addModule", key: "k2" });
    expect(two.modules.map((m) => m.key)).toEqual(["k1", "k2"]);
    const moved = applyEdit(two, { type: "moveModule", from: 1, to: 0 });
    expect(moved.modules.map((m) => m.key)).toEqual(["k2", "k1"]);
    expect(applyEdit(moved, { type: "removeModule", key: "k2" }).modules.map((m) => m.key)).toEqual(["k1"]);
    expect(applyEdit(two, { type: "moduleTitle", key: "k2", value: "Handover" }).modules[1]!.title).toBe("Handover");
  });

  test("departments: picking one narrows; All clears", () => {
    let d = emptyDraft("k");
    d = applyEdit(d, { type: "toggleDepartment", id: "pm" });
    d = applyEdit(d, { type: "toggleDepartment", id: "bd" });
    expect(d.departmentIds).toEqual(["pm", "bd"]);
    d = applyEdit(d, { type: "toggleDepartment", id: "pm" });
    expect(d.departmentIds).toEqual(["bd"]);
    expect(applyEdit(d, { type: "allDepartments" }).departmentIds).toEqual([]);
  });

  test("skills are unique", () => {
    const d = applyEdit(applyEdit(emptyDraft("k"), { type: "addSkill", id: "s" }), { type: "addSkill", id: "s" });
    expect(d.skillIds).toEqual(["s"]);
  });

  test("moveItem ignores out-of-range moves", () => {
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2, 3], 0, 9)).toEqual([1, 2, 3]);
  });
});

describe("draft ↔ input mapping", () => {
  test("a saved course becomes a draft with ids, keeping only what the admin typed", () => {
    const d = draftFromCourseView(view());
    expect(d.modules[0]).toMatchObject({ id: "sec1", key: "sec1", title: "Kick-off", notes });
    expect(d.modules[0]!.videos).toEqual([
      { id: "v1", url: "https://youtu.be/dQw4w9WgXcQ" },
      { id: "v2", url: "https://example.com/page", title: "My title", durationSeconds: 300 },
    ]);
    expect(d.modules[0]!.docs).toEqual([{ id: "d1", uploadId: "u1" }]);
  });

  test("a complete draft becomes save input; problems are plain and point at the field", () => {
    const ok = draftToCourseInput(draftFromCourseView(view()));
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.input.modules[0]!.videos[0]).toEqual({ id: "v1", url: "https://youtu.be/dQw4w9WgXcQ" });

    const bad = draftToCourseInput({ ...emptyDraft("k"), modules: [{ key: "k", title: "", videos: [{ url: " " }], docs: [], notes: null }] });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.problems.map((p) => p.message)).toEqual([
        "Give the course a title of at least 2 letters.",
        "Pick a level.",
        "Module 1 needs a title of at least 2 letters.",
        "Module 1, video 1: paste a link or upload a file.",
      ]);
      expect(bad.problems[2]!.path).toBe("modules.0.title");
    }
  });

  test("withKeys gives old drafts a key per module", () => {
    expect(withKeys({ ...emptyDraft("x"), modules: [{ id: "a", title: "", videos: [], docs: [], notes: null }] }).modules[0]!.key).toBe("a");
  });
});

describe("dirty and newer-draft logic", () => {
  test("dirty compares content, not keys", () => {
    const base = draftFromCourseView(view());
    expect(isDirty({ ...base, modules: base.modules.map((m) => ({ ...m, key: "other" })) }, base)).toBe(false);
    expect(isDirty(applyEdit(base, { type: "title", value: "New" }), base)).toBe(true);
    expect(isDirty(base, null)).toBe(true);
  });

  test("only a draft newer than the course is offered", () => {
    expect(newerDraftOf(view({ draft: { id: "d", updatedAt: 2000 } }))).toEqual({ id: "d", updatedAt: 2000 });
    expect(newerDraftOf(view({ draft: { id: "d", updatedAt: 500 } }))).toBeNull();
    expect(newerDraftOf(view())).toBeNull();
  });

  test("removing a saved module asks first; a new one doesn't", () => {
    expect(removalNeedsConfirm({ id: "sec1", title: "", videos: [], docs: [], notes: null })).toBe(true);
    expect(removalNeedsConfirm({ key: "k", title: "", videos: [], docs: [], notes: null })).toBe(false);
  });

  test("autosave line", () => {
    const t = () => "10:42";
    expect(autosaveLine({ saving: false, failed: false, savedAt: 1, dirty: false }, t)).toBe("Saved 10:42");
    expect(autosaveLine({ saving: true, failed: false, savedAt: 1, dirty: true }, t)).toBe("Saving…");
    expect(autosaveLine({ saving: false, failed: true, savedAt: 1, dirty: true }, t)).toMatch(/try again/);
  });
});
