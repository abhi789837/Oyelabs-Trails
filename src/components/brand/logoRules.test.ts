/**
 * The logo rules (brand guidelines p4 and p9), checked on the source so a new screen can't break them
 * (rebrand Phase 7):
 *
 * 1. Never an extra "O": the mark *is* the O of Oyelearn, so `<Mark>` (or the old API's
 *    `<Logo variant="mark">`, or a mark image) must not be followed by the text "Oyelearn"/"yelearn".
 * 2. One identity: nothing points at the old logo kit or its files.
 * 3. Nothing re-types the wordmark: the literal word "Oyelearn" on its own in a heading, or in an
 *    element styled like a logo (display/brand font, logo/wordmark class), is a hand-made logo. Use
 *    `<Logo>` from src/components/brand.
 *
 * The rules look at JSX structure (a tag whose only content is the word, or the word right after the
 * mark), not at prose, so "Welcome to Oyelearn" or "Oyelearn · by Oyelabs" in a sentence passes.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const srcDir = path.join(root, "src");

/** Every .tsx under src, except lesson content (prose about the platform is fine there anyway). */
function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full === path.join(srcDir, "content")) continue;
      out.push(...tsxFiles(full));
    } else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

/** JSX between two pieces of content that renders nothing visible: spaces, `{" "}`, tags opening or closing. */
const GAP = String.raw`(?:\s|\{\s*["'\x60]\s*["'\x60]\s*\}|<\/?[A-Za-z][^<>]*>)*`;
/** The word as JSX text or as a string child: Oyelearn, yelearn. */
const WORD = String.raw`(?:\{\s*["'\x60])?\s*O?yelearn\b`;

/** What renders the mark: the component, the old API's mark variant, or a mark image. */
const MARK = String.raw`(?:<Mark\b[^<>]*\/>|<\/Mark>|<Logo\b[^<>]*variant=["']mark["'][^<>]*\/>|<img\b[^<>]*src=\{?["'\x60][^"'\x60]*\/mark\/[^"'\x60]*["'\x60]\}?[^<>]*\/?>)`;

function markFollowedByWordmark(source: string): string[] {
  return [...source.matchAll(new RegExp(MARK + GAP + WORD, "g"))].map((m) => m[0]);
}

/** The old kit's folder and its seven files (removed in Phases 1 and 7). */
const OLD_LOGO = /Oyelearn-Logo-Kit|oyelearn-(?:horizontal|mark|stacked)-(?:light|dark)-mode|mark-mono-(?:white|black)/;

function oldLogoImages(source: string): string[] {
  // Every string literal: an <img src="…">, and a helper or constant that builds the src.
  return [...source.matchAll(/["'\x60][^"'\x60\n]*["'\x60]/g)].map((m) => m[0]).filter((str) => OLD_LOGO.test(str));
}

/** Classes that make text look like a logo. Colour alone (text-brand) is not enough. */
const LOGO_STYLE = /className=\{?["'\x60][^"'\x60]*\b(?:logo|wordmark|font-display|font-brand|brand-name|text-display)\b/;

function textLogos(source: string): string[] {
  const hits: string[] = [];
  // An element whose whole content is the word.
  const re = /<([A-Za-z][\w.]*)\b([^<>]*)>\s*(?:\{\s*["'\x60])?\s*O?yelearn\s*(?:["'\x60]\s*\})?\s*<\/\1>/g;
  for (const m of source.matchAll(re)) {
    const [whole, tag, attrs] = m;
    if (/^h[1-6]$/.test(tag) || LOGO_STYLE.test(attrs)) hits.push(whole);
  }
  return hits;
}

describe("the rules themselves", () => {
  test("catch a doubled O", () => {
    expect(markFollowedByWordmark(`<Mark size={24} decorative />Oyelearn`)).toHaveLength(1);
    expect(markFollowedByWordmark(`<Mark size={24} />\n  <span className="font-semibold">yelearn</span>`)).toHaveLength(1);
    expect(markFollowedByWordmark(`<Mark />{" "}<span>{"Oyelearn"}</span>`)).toHaveLength(1);
    expect(markFollowedByWordmark(`<Logo variant="mark" className="h-6" /> Oyelearn`)).toHaveLength(1);
    expect(markFollowedByWordmark(`<img src="/brand/mark/oyelearn-mark-light.svg" alt="" /> Oyelearn`)).toHaveLength(1);
  });

  test("leave the mark alone with other words, and the word alone in a sentence", () => {
    expect(markFollowedByWordmark(`<Mark size={56} decorative />\n<h1>This page isn't here</h1>`)).toEqual([]);
    expect(markFollowedByWordmark(`<Mark /> <span>Admin</span>`)).toEqual([]);
    expect(markFollowedByWordmark(`<Mark />\n<p>Something went wrong in Oyelearn.</p>`)).toEqual([]);
    expect(textLogos(`<p>Welcome to Oyelearn</p>`)).toEqual([]);
    expect(textLogos(`<span className="text-small">Oyelearn · by Oyelabs</span>`)).toEqual([]);
    expect(textLogos(`<span className="text-brand-fg">Oyelearn</span>`)).toEqual([]);
  });

  test("catch a re-typed wordmark", () => {
    expect(textLogos(`<h1>Oyelearn</h1>`)).toHaveLength(1);
    expect(textLogos(`<h2 className="text-lg">{"Oyelearn"}</h2>`)).toHaveLength(1);
    expect(textLogos(`<span className="font-display text-2xl font-bold">Oyelearn</span>`)).toHaveLength(1);
    expect(textLogos(`<div className="logo-text">Oyelearn</div>`)).toHaveLength(1);
  });

  test("catch the old logo files, not the new ones", () => {
    expect(oldLogoImages(`<img src="/brand/oyelearn-horizontal-light-mode.svg" alt="Oyelearn" />`)).toHaveLength(1);
    expect(oldLogoImages(`const src = "/Oyelearn-Logo-Kit/web/mark/mark.svg";`)).toHaveLength(1);
    expect(oldLogoImages(`<img src="/brand/logo/oyelearn-light.svg" alt="Oyelearn" />`)).toEqual([]);
    expect(oldLogoImages(`<img src={markSrc("dark")} alt="" />`)).toEqual([]);
  });
});

describe("the app follows the logo rules", () => {
  const files = tsxFiles(srcDir);
  const rel = (f: string) => path.relative(root, f).split(path.sep).join("/");

  test("there are screens to check", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  test("no <Mark> is followed by Oyelearn/yelearn (an extra O)", () => {
    const found = files.flatMap((f) => markFollowedByWordmark(fs.readFileSync(f, "utf8")).map((hit) => `${rel(f)}: ${hit}`));
    expect(found).toEqual([]);
  });

  test("no <img> or src string points at the old logo kit or old logo files", () => {
    const found = files.flatMap((f) => oldLogoImages(fs.readFileSync(f, "utf8")).map((hit) => `${rel(f)}: ${hit}`));
    expect(found).toEqual([]);
    // Nor do the page head and the manifest.
    for (const file of ["index.html", "public/site.webmanifest"]) expect(fs.readFileSync(path.join(root, file), "utf8")).not.toMatch(OLD_LOGO);
  });

  test("no raw Oyelearn text is styled as a logo", () => {
    const found = files.flatMap((f) => textLogos(fs.readFileSync(f, "utf8")).map((hit) => `${rel(f)}: ${hit}`));
    expect(found).toEqual([]);
  });

  test("the old kit folder and files are gone", () => {
    expect(fs.existsSync(path.join(root, "Oyelearn-Logo-Kit"))).toBe(false);
    for (const name of ["horizontal", "mark", "stacked"]) {
      for (const mode of ["light", "dark"]) expect(fs.existsSync(path.join(root, "public/brand", `oyelearn-${name}-${mode}-mode.svg`))).toBe(false);
    }
  });
});

describe("the /design certificate sample", () => {
  test("is the server's drawing at the verify preview size (scripts/brand/certificate-sample.ts)", () => {
    const png = fs.readFileSync(path.join(root, "public/brand/certificate/certificate-sample.png"));
    expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1754, 1240]);
  });
});
