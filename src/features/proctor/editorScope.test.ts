import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { beforeEach, describe, expect, test } from "vitest";

import { fingerprint, rememberCopiedText, rememberedCount, resetCopiedText, wasCopiedFromPage } from "./editorScope";

/**
 * Copying and pasting inside the editor.
 *
 * The rule being held down: a learner editing their own code is not cheating. Copy, cut, undo and
 * selection inside the editor are ordinary work; a paste is judged on whether the text came off this
 * page, not on where the caret is.
 *
 * That matters more than it sounds. Proctoring blocked clipboard events on the whole document with
 * a comment saying code items were deliberately included — so moving a block of code three lines up
 * fired a **hard** warning, and three hard warnings end the assessment. The more fluently somebody
 * edited, the faster they were terminated for it.
 *
 * There is no jsdom here (`vitest.config.ts`), so the DOM half is checked by reading the source the
 * way `browserSignals.test.ts` does. The fingerprinting is pure and is tested directly.
 */

beforeEach(() => resetCopiedText());

describe("recognising text that came off this page", () => {
  test("text copied inside the editor is recognised when pasted back", () => {
    rememberCopiedText("const total = items.reduce((a, b) => a + b, 0);");
    expect(wasCopiedFromPage("const total = items.reduce((a, b) => a + b, 0);")).toBe(true);
  });

  test("text from somewhere else is not", () => {
    rememberCopiedText("const total = 1;");
    expect(wasCopiedFromPage("function solutionFromStackOverflow() {}")).toBe(false);
  });

  test("leading and trailing whitespace does not change the answer", () => {
    // An editor may add a trailing newline on copy. That is not a different piece of text.
    rememberCopiedText("  const x = 1;\n");
    expect(wasCopiedFromPage("const x = 1;")).toBe(true);
  });

  test("windows line endings do not change the answer", () => {
    rememberCopiedText("a\r\nb");
    expect(wasCopiedFromPage("a\nb")).toBe(true);
  });

  test("empty text is never recognised", () => {
    /* Otherwise an empty clipboard would match the empty fingerprint and every paste of nothing
       would be silently allowed — which is harmless, but it would also mean `fingerprint("")`
       collided with a real entry the moment one was stored. */
    rememberCopiedText("");
    expect(wasCopiedFromPage("")).toBe(false);
    expect(rememberedCount()).toBe(0);
  });

  test("the fingerprint is not the text", () => {
    // What a learner copies is their own work. There is no reason to keep a copy of it in memory.
    const code = "const secret = 'my actual answer';";
    expect(fingerprint(code)).not.toContain("secret");
    expect(fingerprint(code).length).toBeLessThan(20);
  });

  test("different text fingerprints differently", () => {
    expect(fingerprint("a = 1")).not.toBe(fingerprint("a = 2"));
  });

  test("what is remembered is bounded", () => {
    for (let i = 0; i < 40; i++) rememberCopiedText(`line ${i}`);
    expect(rememberedCount()).toBeLessThanOrEqual(16);
    // The newest survives; the oldest has fallen out.
    expect(wasCopiedFromPage("line 39")).toBe(true);
    expect(wasCopiedFromPage("line 0")).toBe(false);
  });

  test("copying the same thing twice does not fill the buffer", () => {
    for (let i = 0; i < 10; i++) rememberCopiedText("the same line");
    expect(rememberedCount()).toBe(1);
  });

  test("a reset forgets everything", () => {
    // A second sitting in the same tab must not inherit the first one's clipboard history.
    rememberCopiedText("const x = 1;");
    resetCopiedText();
    expect(wasCopiedFromPage("const x = 1;")).toBe(false);
  });
});

describe("what the signal engine does with it", () => {
  const source = fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "browserSignals.ts"),
    "utf8",
  );

  test("copy and cut inside the editor are neither prevented nor reported", () => {
    const handler = source.slice(source.indexOf("const onCopyOrCut"), source.indexOf('on(document, "copy"'));
    expect(handler).toContain("isInsideEditor(event.target)");
    expect(handler).toContain("rememberCopiedText");
    // The early return comes before `preventDefault`, or the copy never reaches the clipboard.
    expect(handler.indexOf("return;")).toBeLessThan(handler.indexOf("event.preventDefault()"));
  });

  test("a paste is allowed only when it is inside the editor AND came off this page", () => {
    const handler = source.slice(source.indexOf('on(document, "paste"'), source.indexOf('on(document, "keyup"'));
    expect(handler).toMatch(/isInsideEditor\(event\.target\)\s*&&\s*wasCopiedFromPage/);
    // Everything else still gets both.
    expect(handler).toContain("event.preventDefault()");
    expect(handler).toContain('emit("paste_attempt"');
  });

  test("the flagged event says whether it happened in the editor, and never carries the text", () => {
    const handler = source.slice(source.indexOf('on(document, "paste"'), source.indexOf('on(document, "keyup"'));
    expect(handler).toContain("inEditor:");
    expect(handler).toContain("chars: pasted.length");
    expect(handler).not.toMatch(/text:\s*pasted/);
  });

  test("selection inside the editor is not reported", () => {
    const handler = source.slice(source.indexOf('on(document, "selectstart"'));
    expect(handler.slice(0, 400)).toContain("isInsideEditor(event.target)");
  });
});

describe("the editor marks itself", () => {
  test("CodeEditor carries the attribute the engine looks for", () => {
    /* If this ever stops being true the whitelist silently stops applying, and the symptom is
       learners being terminated for editing — which is exactly how this started. */
    const editor = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/challenge/CodeEditor.tsx"),
      "utf8",
    );
    expect(editor).toContain("editorScopeProps()");
  });

  test("the assessment runner no longer blocks paste on the code item itself", () => {
    /* Blocking it there as well would defeat both halves of the rule.

       Comments are stripped before the check, because the line explaining *why* the handler is gone
       names the handler — and a search for the string alone matched that explanation and failed. */
    const runner = fs.readFileSync(
      path.resolve(process.cwd(), "src/features/assessment/ItemRunner.tsx"),
      "utf8",
    );
    const codeBlock = stripComments(runner.slice(runner.indexOf('item.kind === "code" && (')));
    expect(codeBlock.slice(0, 600)).not.toContain("onPaste=");
  });

  test("the other answer fields still block paste", () => {
    // The whitelist is the editor, not the whole runner. A pasted written answer is still a paste.
    const runner = fs.readFileSync(
      path.resolve(process.cwd(), "src/features/assessment/ItemRunner.tsx"),
      "utf8",
    );
    expect(stripComments(runner)).toContain("onPaste={blockPaste}");
  });
});

/** Block and line comments removed, so a check about code cannot be satisfied by prose about code. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}
