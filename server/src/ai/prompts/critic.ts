import type { GeneratedItem } from "../../../../shared/assessment";
import { ITEM_QUALITY_RULES } from "./itemRules";

/**
 * AI call 3 (brief §9.2): an independent review of every generated item.
 *
 * The critic is given the items **without their answer keys** and answers each one itself. Only
 * then is its answer compared with the key. Showing it the key first would turn the exercise into
 * agreement rather than verification — which is the whole point of having a second pass.
 */
export const CRITIC_SYSTEM = `You review assessment items before they are put in front of engineers. You are the last check, and a bad item that reaches a real assessment produces a wrong result for a real person.

For each item:
1. Answer it yourself, from the prompt and options alone. Say what your answer is.
2. Set agreesWithKey — you will be told the keyed answer only after you have given yours, so answer honestly first.
3. List any issues. Be specific and be strict:
   - more than one defensible answer, or no clearly correct one
   - the prompt or an option references option positions
   - the answer is given away by the prompt, by option length, or by the odd-one-out
   - it tests recall of an API name rather than understanding
   - the code does not run as written, or the stated output is wrong
   - the difficulty is clearly wrong for what is being asked
4. verdict: "keep" or "drop". Drop anything you would not want deciding a colleague's placement.

${ITEM_QUALITY_RULES}

An item with no issues and a matching answer is "keep". Anything else is "drop" — there are plenty of items, and a weak one costs more than a missing one.`;

/** The item as the critic sees it: prompt, options and code, but nothing that states the answer. */
function withoutKey(item: GeneratedItem, index: number): string {
  const lines = [
    `### Item ${index}`,
    `kind: ${item.kind} · difficulty: ${item.difficulty} · topics: ${item.topicIds.join(", ")}`,
    "",
    item.prompt,
  ];

  if (item.options?.length) {
    lines.push("", "Options:", ...item.options.map((option, i) => `${i}. ${option}`));
  }
  if (item.kind === "code") {
    if (item.starterCode) lines.push("", "Starter code:", "```js", item.starterCode, "```");
    if (item.visibleTests?.length) {
      lines.push(
        "",
        "Visible tests:",
        ...item.visibleTests.map((t) => `- ${t.description}: ${item.functionName}(${t.args.map((a) => JSON.stringify(a)).join(", ")}) === ${JSON.stringify(t.expected)}`),
      );
    }
  }
  if (item.kind === "explain" && item.rubric?.length) {
    lines.push("", "Rubric points a good answer should hit:", ...item.rubric.map((r) => `- (${r.weight}) ${r.point}`));
  }

  return lines.join("\n");
}

/** What the keyed answer actually is, given after the critic's own answer is requested. */
function keyOf(item: GeneratedItem): string {
  if (item.correctIndices?.length) return `option${item.correctIndices.length > 1 ? "s" : ""} ${item.correctIndices.join(", ")}`;
  if (item.expectedOutput !== undefined) return `output ${JSON.stringify(item.expectedOutput)}`;
  if (item.kind === "code") return "graded by running the tests";
  if (item.kind === "explain") return "graded against the rubric";
  return "(none recorded)";
}

export function buildCriticUser(items: GeneratedItem[]): string {
  const bodies = items.map((item, index) => withoutKey(item, index)).join("\n\n");
  const keys = items.map((item, index) => `- Item ${index}: ${keyOf(item)}`).join("\n");

  return `## Items to review

${bodies}

## Keyed answers

Compare these with the answers you worked out above.

${keys}

Return one verdict per item, using the item's index.`;
}
