import { beforeEach, describe, expect, test } from "vitest";

import { judgeScopedEvent, resetCopiedText, type ScopedEventType } from "./editorScope";

/**
 * The editor whitelist as a pure decision (v4: Monaco, Run/Submit, the task inputs).
 *
 * `browserSignals.ts` hands every clipboard, selection and context-menu event to
 * `judgeScopedEvent`, so these are the rules a learner actually meets. The point being held down:
 * ordinary work inside the editor — typing, copying, pasting your own code back, selecting, clicking
 * Run, moving focus between the question and the editor — never raises a warning, and text from
 * another window still does.
 */

beforeEach(() => resetCopiedText());

describe("inside the editor", () => {
  test("copy then paste of the same code is allowed and not reported", () => {
    const copy = judgeScopedEvent({ type: "copy", inScope: true, copiedTexts: ["function add(a, b) {\n  return a + b;\n}"] });
    expect(copy).toEqual({ signal: null, prevent: false });

    const paste = judgeScopedEvent({ type: "paste", inScope: true, clipboardText: "function add(a, b) {\n  return a + b;\n}" });
    expect(paste).toEqual({ signal: null, prevent: false });
  });

  test("cut then paste (moving a block) is allowed", () => {
    judgeScopedEvent({ type: "cut", inScope: true, copiedTexts: ["const x = 1;"] });
    expect(judgeScopedEvent({ type: "paste", inScope: true, clipboardText: "const x = 1;\n" }).signal).toBeNull();
  });

  test("Monaco's whole-line copy (empty selection) is recognised by any candidate", () => {
    // The model reader returns the line; the clipboard carries it with a trailing newline.
    judgeScopedEvent({ type: "copy", inScope: true, copiedTexts: ["  return total;", "  return total;\n"] });
    expect(judgeScopedEvent({ type: "paste", inScope: true, clipboardText: "  return total;\n" }).signal).toBeNull();
  });

  test("text copied from outside the page and pasted into the editor is flagged and blocked", () => {
    judgeScopedEvent({ type: "copy", inScope: true, copiedTexts: ["const mine = 1;"] });
    const paste = judgeScopedEvent({ type: "paste", inScope: true, clipboardText: "function solutionFromChatGPT() { return 42; }" });
    expect(paste).toEqual({ signal: "paste_attempt", prevent: true });
  });

  test("an empty or non-text paste (an image) is flagged", () => {
    expect(judgeScopedEvent({ type: "paste", inScope: true, clipboardText: "" }).signal).toBe("paste_attempt");
  });

  test("selection is ordinary work", () => {
    expect(judgeScopedEvent({ type: "selectstart", inScope: true })).toEqual({ signal: null, prevent: false });
  });

  test("right-click suppresses the native menu but is not reported", () => {
    expect(judgeScopedEvent({ type: "contextmenu", inScope: true })).toEqual({ signal: null, prevent: true });
  });
});

describe("outside the editor", () => {
  test("copying the question is flagged", () => {
    expect(judgeScopedEvent({ type: "copy", inScope: false })).toEqual({ signal: "copy_cut_attempt", prevent: true });
  });

  test("copying outside does not whitelist the text for a later paste", () => {
    judgeScopedEvent({ type: "copy", inScope: false, copiedTexts: ["question text"] });
    expect(judgeScopedEvent({ type: "paste", inScope: true, clipboardText: "question text" }).signal).toBe("paste_attempt");
  });

  test("pasting outside any scope is flagged even when the text came off this page", () => {
    judgeScopedEvent({ type: "copy", inScope: true, copiedTexts: ["const x = 1;"] });
    expect(judgeScopedEvent({ type: "paste", inScope: false, clipboardText: "const x = 1;" }).signal).toBe("paste_attempt");
  });

  test("selecting question text is a soft signal; a plain text field is not", () => {
    expect(judgeScopedEvent({ type: "selectstart", inScope: false }).signal).toBe("text_selection_attempt");
    expect(judgeScopedEvent({ type: "selectstart", inScope: false, inTextField: true }).signal).toBeNull();
    expect(judgeScopedEvent({ type: "selectstart", inScope: false, allowSelect: true }).signal).toBeNull();
  });

  test("right-click outside is reported", () => {
    expect(judgeScopedEvent({ type: "contextmenu", inScope: false }).signal).toBe("context_menu_attempt");
  });
});

describe("Run, Submit and focus changes", () => {
  const neutral: ScopedEventType[] = ["click", "pointerdown", "focusin", "focusout", "keydown", "input"];

  test.each(neutral)("%s never produces a signal, inside or outside the editor", (type) => {
    expect(judgeScopedEvent({ type, inScope: true })).toEqual({ signal: null, prevent: false });
    expect(judgeScopedEvent({ type, inScope: false })).toEqual({ signal: null, prevent: false });
  });
});
