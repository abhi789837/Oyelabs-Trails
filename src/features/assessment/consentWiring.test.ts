import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

/**
 * The consent call has a caller, and it happens before `start`.
 *
 * This reads source rather than behaviour, which is unusual and is the point. The bug it guards
 * against was not a wrong value or a bad branch — it was an API function that existed and was never
 * called. `assessmentApi.consent` sat in `api.ts` with zero callers while the pre-flight screen's
 * own doc comment said "the caller posts consent and calls start". Every learner who reached the
 * Start button got "Consent is required before starting."
 *
 * No behavioural test would have caught it. Both endpoints worked in isolation, and there is no DOM
 * test harness in this project to render the page and watch the network. What can be checked
 * cheaply and exactly is the wiring: that the function is reachable, and that whoever starts an
 * assessment also consents to it first.
 *
 * See `docs/bugs/assessment-consent.md`.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, "..", "..");

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    // `src/content` is 715 topics of curriculum prose; nothing in it calls an API.
    if (entry.isDirectory()) return entry.name === "content" ? [] : walk(full);
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts") ? [full] : [];
  });
}

const sources = walk(src).map((file) => ({ file, text: fs.readFileSync(file, "utf8") }));

describe("the consent call is wired up", () => {
  test("`assessmentApi.consent` has at least one caller", () => {
    const callers = sources.filter(
      ({ file, text }) => !file.endsWith(`${path.sep}api.ts`) && /assessmentApi\.consent\s*\(/.test(text),
    );
    expect(
      callers.map(({ file }) => path.relative(src, file)),
      "assessmentApi.consent has no callers — the assessment cannot be started; see docs/bugs/assessment-consent.md",
    ).not.toEqual([]);
  });

  test("anything that starts an assessment consents to it first", () => {
    for (const { file, text } of sources) {
      if (!/assessmentApi\.start\s*\(/.test(text)) continue;

      expect(
        /assessmentApi\.consent\s*\(/.test(text),
        `${path.relative(src, file)} calls assessmentApi.start without calling assessmentApi.consent`,
      ).toBe(true);

      // Order matters, not just presence: consent is what `start` reads back.
      expect(
        text.indexOf("assessmentApi.consent("),
        `${path.relative(src, file)} calls start before consent`,
      ).toBeLessThan(text.indexOf("assessmentApi.start("));
    }
  });

  test("the consent call is awaited", () => {
    // Firing it without awaiting would race the start call, and lose the race often enough to look
    // intermittent — which is worse to diagnose than never working at all.
    for (const { file, text } of sources) {
      if (!/assessmentApi\.consent\s*\(/.test(text) || file.endsWith(`${path.sep}api.ts`)) continue;
      expect(
        /await\s+assessmentApi\.consent\s*\(/.test(text),
        `${path.relative(src, file)} does not await assessmentApi.consent`,
      ).toBe(true);
    }
  });
});
