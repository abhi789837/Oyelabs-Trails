import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

/**
 * The proctoring engine listens for events that actually exist.
 *
 * This reads source rather than behaviour, which is unusual and is the point — the same reason
 * `features/assessment/consentWiring.test.ts` does. The bug it guards against was not a wrong value
 * or a bad branch: `addEventListener` accepts any string, so `window.addEventListener("blur-sm", …)`
 * registers happily and simply never fires. Nothing throws, nothing logs, and the only symptom is a
 * proctoring signal that silently stops being reported.
 *
 * That is exactly what happened. The Tailwind v3 → v4 migration (0c5ab8d) renamed the `blur` utility
 * class to `blur-sm` across the codebase and caught this DOM event name with it. Alt-tabbing to
 * another window without hiding the tab went unreported from that commit until it was found by
 * reading the file.
 *
 * There is no jsdom in this project (see `vitest.config.ts`), so dispatching a real event is not an
 * option. What can be checked cheaply and exactly is that every name handed to `on(...)` is a DOM
 * event we meant to listen for.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, "browserSignals.ts"), "utf8");

/**
 * Every event the engine is allowed to bind.
 *
 * An allowlist rather than a syntax rule, so adding a listener is a deliberate edit in two places.
 * A typo'd name is not in the list; a renamed one is not either.
 */
const ALLOWED = new Set([
  "visibilitychange",
  "blur",
  "focus",
  "fullscreenchange",
  "webkitfullscreenchange",
  "copy",
  "cut",
  "paste",
  "keyup",
  "keydown",
  "contextmenu",
  "selectstart",
  "mouseout",
  "mouseover",
  "mouseleave",
  "mouseenter",
  "change",
  "resize",
]);

/** The `on(target, "event", handler)` calls, and the standalone `addEventListener` ones. */
function boundEvents(text: string): string[] {
  const names = [
    ...text.matchAll(/\bon\(\s*(?:document|window|[A-Za-z_$][\w$]*)\s*,\s*"([^"]+)"/g),
    ...text.matchAll(/\.addEventListener\(\s*"([^"]+)"/g),
  ].map((match) => match[1]);
  return [...new Set(names)];
}

describe("the events the proctoring engine binds", () => {
  test("are all real DOM events we meant to listen for", () => {
    const bound = boundEvents(source);
    expect(bound.length).toBeGreaterThan(6);

    const unknown = bound.filter((name) => !ALLOWED.has(name));
    expect(
      unknown,
      `browserSignals.ts binds ${unknown.join(", ")}, which is not in the allowlist. A DOM event name ` +
        "that does not exist registers without error and never fires — see the header of this file.",
    ).toEqual([]);
  });

  test("none of them is hyphenated", () => {
    // No DOM event in this engine has a hyphen in it. A hyphen here means a CSS class name got in,
    // which is precisely how `blur` became `blur-sm`.
    for (const name of boundEvents(source)) {
      expect(name, `"${name}" looks like a CSS utility class, not a DOM event`).not.toMatch(/-/);
    }
  });

  test("window blur is still bound", () => {
    /* Named on its own because it is the one that was lost, and because "the allowlist passes" would
       also be true of a file that stopped listening for it altogether. */
    expect(/\bon\(\s*window\s*,\s*"blur"/.test(source)).toBe(true);
    expect(/\bon\(\s*window\s*,\s*"focus"/.test(source)).toBe(true);
  });

  test("the tab-hidden and paste signals are still bound", () => {
    expect(/\bon\(\s*document\s*,\s*"visibilitychange"/.test(source)).toBe(true);
    expect(/\bon\(\s*document\s*,\s*"paste"/.test(source)).toBe(true);
  });
});
