import path from "node:path";

import { describe, expect, test } from "vitest";

import { lessonPassages } from "../../../../shared/lesson";
import { ContentStore } from "../../content/store";
import { buildPassages } from "../../topicTests/grounding";
import { checkedCitations, limitCode, passageLines, tutorSystem, tutorUser } from "./tutor";

const content = ContentStore.load(path.resolve(process.cwd(), "server/content"));
const topic = content.getTopic("lv-api-exceptions")!.topic;

describe("Ask Oye prompts", () => {
  test("the page's passage ids match the grounding ids", () => {
    let checked = 0;
    for (const id of ["lv-api-exceptions", "js-call-stack", "flutter-three-trees", "lv-queue-routing", "js-closures"]) {
      const t = content.getTopic(id)?.topic;
      if (!t) continue;
      expect(lessonPassages(t.summary, t.sections ?? []).map((p) => p.id)).toEqual(buildPassages(t).map((p) => p.id));
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(4);
  });

  test("the lesson goes in the cached system prompt; the question in the user prompt", () => {
    const system = tutorSystem(topic);
    expect(system).toContain(passageLines(buildPassages(topic)));
    expect(system).toContain("[sum.p1] {Summary}");
    const user = tutorUser({ step: "do", question: "Why?", code: "const x = 1;", history: [{ question: "Q1", answer: "A1" }] });
    expect(user).toMatch(/^STEP: do/);
    expect(user).toContain("LEARNER'S CODE:");
    expect(user).toContain("Q: Q1");
    expect(user.endsWith("QUESTION: Why?")).toBe(true);
    expect(system).not.toContain("Why?");
  });

  test("only citations whose quote is really in the passage survive", () => {
    const passage = buildPassages(topic)[0];
    const quote = passage.text.replace(/\s+/g, " ").slice(5, 45);
    const kept = checkedCitations(topic, [
      { passageId: passage.id, quote },
      { passageId: passage.id, quote },
      { passageId: "sum.p99", quote },
      { passageId: passage.id, quote: "this sentence is not in the lesson at all" },
    ]);
    expect(kept).toEqual([{ passageId: passage.id, heading: "Summary", quote: quote.trim() }]);
  });

  test("on the Do step long code blocks are cut to a few lines", () => {
    const answer = "Try this:\n```js\nline1\nline2\nline3\nline4\nline5\n```\nThen test it.";
    expect(limitCode(answer, "do")).toContain("line3\n// …the rest is yours to write");
    expect(limitCode(answer, "do")).not.toContain("line4");
    expect(limitCode(answer, "read")).toBe(answer);
    expect(limitCode("```\na\nb\n```", "do")).toBe("```\na\nb\n```");
  });
});
