import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { TOKEN_PAIRS, contrastRatio, parseChannels, type Rgb } from "./contrast";

/**
 * The v5 tokens, checked against WCAG from the stylesheet itself (like src/lib/contrast.test.ts
 * does for the old UI). Every pair in `TOKEN_PAIRS` is a combination a v5 component renders:
 * text 4.5:1; focus ring, input border and meaningful fills 3:1. Light and dark.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(here, "tokens.css"), "utf8");

/** The `--v5-*` declarations in the rule that follows `/* tokens:<marker> *\/`. */
function block(marker: string): Map<string, string> {
  const start = css.indexOf(`/* tokens:${marker} */`);
  if (start === -1) throw new Error(`No tokens:${marker} block`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  const out = new Map<string, string>();
  for (const m of css.slice(open, close).matchAll(/--v5-([a-z0-9-]+):\s*([^;]+);/g)) out.set(m[1], m[2].trim());
  return out;
}

/** The derived block (lanes): `--v5-lane-now: var(--v5-danger)`. */
function derived(): Map<string, string> {
  const start = css.indexOf("--v5-lane-now:");
  const open = css.lastIndexOf("{", start);
  const close = css.indexOf("}", start);
  const out = new Map<string, string>();
  for (const m of css.slice(open, close).matchAll(/--v5-([a-z0-9-]+):\s*([^;]+);/g)) out.set(m[1], m[2].trim());
  return out;
}

const light = new Map([...block("light"), ...derived()]);
const dark = new Map([...block("dark"), ...derived()]);

function resolve(tokens: Map<string, string>, name: string): Rgb {
  let value = tokens.get(name);
  const seen = new Set<string>();
  while (value?.startsWith("var(")) {
    const key = value.slice("var(--v5-".length, -1);
    if (seen.has(key)) throw new Error(`cycle at ${key}`);
    seen.add(key);
    value = tokens.get(key);
  }
  if (!value) throw new Error(`No token --v5-${name}`);
  const rgb = parseChannels(value);
  if (!rgb) throw new Error(`--v5-${name} is "${value}", not R G B`);
  return rgb;
}

describe.each([
  ["light", light],
  ["dark", dark],
])("%s theme", (theme, tokens) => {
  test.each(TOKEN_PAIRS)("$fg on $on clears its minimum ($need) — $note", ({ fg, on, need }) => {
    const ratio = contrastRatio(resolve(tokens, fg), resolve(tokens, on));
    const min = need === "text" ? 4.5 : 3;
    expect(ratio, `--v5-${fg} on --v5-${on} is ${ratio.toFixed(2)}:1 in ${theme}, needs ${min}:1`).toBeGreaterThanOrEqual(min);
  });

  test("the light and dark blocks declare the same colour tokens", () => {
    expect([...block("dark").keys()].filter((k) => !k.startsWith("shadow")).sort()).toEqual(
      [...block("light").keys()].filter((k) => !k.startsWith("shadow")).sort(),
    );
  });
});

describe("brand", () => {
  test("the light fill is Oyelabs blue #2067D3 (brand-600)", () => {
    expect(light.get("brand")).toBe("32 103 211");
  });
});

describe("scoping", () => {
  test("every rule in tokens.css is scoped to [data-ui=\"v5\"] or a v5-only class", () => {
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
    // Top-level selectors: text before each "{" that isn't inside @keyframes/@media.
    const selectors: string[] = [];
    let depth = 0;
    let buf = "";
    let inAt = false;
    for (const ch of withoutComments) {
      if (ch === "{") {
        const sel = buf.trim();
        if (depth === 0) {
          if (sel.startsWith("@keyframes") || sel.startsWith("@media")) inAt = true;
          else selectors.push(sel);
        } else if (inAt && depth === 1 && !/^(from|to|\d+%)/.test(sel)) selectors.push(sel);
        depth += 1;
        buf = "";
      } else if (ch === "}") {
        depth -= 1;
        if (depth === 0) inAt = false;
        buf = "";
      } else if (ch === ";" && depth > 0) buf = "";
      else buf += ch;
    }
    expect(selectors.length).toBeGreaterThan(10);
    for (const sel of selectors) {
      for (const part of sel.split(",")) {
        expect(part.trim(), `"${part.trim()}" would apply outside v5`).toMatch(/^(\[data-ui="v5"\]|\.v5-)/);
      }
    }
  });
});
