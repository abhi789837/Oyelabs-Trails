import { describe, expect, test } from "vitest";

import { parseCardText } from "./CardText";

describe("parseCardText", () => {
  test("splits fenced blocks and inline code from text", () => {
    const parts = parseCardText("What does this log? ```js\nfor (var i = 0; i < 3; i++) {}\n``` Use `let`.");
    expect(parts).toEqual([
      { kind: "text", value: "What does this log? " },
      { kind: "block", value: "for (var i = 0; i < 3; i++) {}" },
      { kind: "text", value: " Use " },
      { kind: "code", value: "let" },
      { kind: "text", value: "." },
    ]);
  });

  test("plain text and an unclosed backtick stay text", () => {
    expect(parseCardText("plain")).toEqual([{ kind: "text", value: "plain" }]);
    expect(parseCardText("a ` b")).toEqual([{ kind: "text", value: "a ` b" }]);
  });
});
