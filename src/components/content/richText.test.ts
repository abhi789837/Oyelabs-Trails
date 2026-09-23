import { describe, expect, it } from "vitest";

import { parseBlocks, splitInline } from "./RichText";

/**
 * The curriculum's Markdown subset is deliberately tiny, and the inline tokeniser is the part with
 * teeth: it has to pick up emphasis without eating the literal asterisks that appear all over
 * technical prose (`SELECT * FROM`, a `* @param` line, a glob).
 */
describe("splitInline", () => {
  /** What the renderer would actually show: the captured delimiters, in order. */
  const marked = (text: string) => splitInline(text).filter((p) => /^(`|\*)/.test(p));

  it("captures inline code", () => {
    expect(marked("call `foo()` now")).toEqual(["`foo()`"]);
  });

  it("captures bold", () => {
    expect(marked("this is **important** here")).toEqual(["**important**"]);
  });

  it("captures emphasis", () => {
    expect(marked("it does *not* do that")).toEqual(["*not*"]);
  });

  it("does not decompose bold into two emphasis runs", () => {
    // The alternation tries **bold** before *em*, so this must stay one token.
    expect(marked("**both**")).toEqual(["**both**"]);
  });

  it("leaves a literal asterisk followed by a space alone", () => {
    // The classic false positive: two literal asterisks in one line would otherwise pair up.
    expect(marked("SELECT * FROM t WHERE a * b > 0")).toEqual([]);
  });

  it("leaves a JSDoc continuation line alone", () => {
    expect(marked(" * @param {string} pattern e.g. /files/*")).toEqual([]);
  });

  it("does not span a newline", () => {
    expect(marked("a * b\nc * d")).toEqual([]);
  });

  it("handles code and emphasis in the same string", () => {
    expect(marked("`with()` is *not* `load()`")).toEqual(["`with()`", "*not*", "`load()`"]);
  });

  it("keeps the surrounding text", () => {
    expect(splitInline("a *b* c").join("")).toBe("a *b* c");
  });

  it("does not treat an unmatched asterisk as emphasis", () => {
    expect(marked("5 * 3 equals 15")).toEqual([]);
  });
});

describe("parseBlocks", () => {
  it("does not apply inline rules inside a fenced block", () => {
    const blocks = parseBlocks("text\n\n```js\nconst a = 2 * b * c;\n```");
    expect(blocks.map((b) => b.kind)).toEqual(["p", "code"]);
    // The code block keeps its asterisks verbatim; it never reaches the inline tokeniser.
    expect(blocks[1]).toMatchObject({ kind: "code", code: "const a = 2 * b * c;" });
  });

  it("reads bullet lists written with either marker", () => {
    expect(parseBlocks("- one\n- two")).toEqual([{ kind: "ul", items: ["one", "two"] }]);
    expect(parseBlocks("* one\n* two")).toEqual([{ kind: "ul", items: ["one", "two"] }]);
  });

  it("reads numbered lists", () => {
    expect(parseBlocks("1. one\n2. two")).toEqual([{ kind: "ol", items: ["one", "two"] }]);
  });
});
