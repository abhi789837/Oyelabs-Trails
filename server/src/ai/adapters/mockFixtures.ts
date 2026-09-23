import type { Blueprint, CriticVerdict, GeneratedItem } from "../../../../shared/assessment";

/**
 * Coherent fixtures for the assessment pipeline, used by `MockProvider`.
 *
 * Generic JSON-Schema synthesis produces documents that are *shape*-valid but not *semantically*
 * valid: a `multi` item with one correct option, a `code` item whose reference solution is a
 * sentence. Those are exactly what `validateGeneratedItem` and `verifyCodeItem` are built to
 * reject, so a generically-mocked run would drop every item and prove nothing about the pipeline.
 *
 * These fixtures are therefore *deliberately correct*: real options, real keys, and a code item
 * whose reference solution genuinely passes in the sandbox while the starter genuinely fails.
 * That makes P4-P6 verifiable without a credential.
 *
 * They are still fixtures. They say nothing about whether a real model writes good items — only
 * that if it does, the pipeline keeps them, and if it does not, the pipeline drops them. One
 * intentionally invalid item per batch exercises the drop path.
 */

export interface FixtureContext {
  moduleIds: string[];
  topicIds: string[];
  areaNames?: string[];
  /** Different values produce different-looking output, so batches are not identical. */
  seed: number;
}

const AREA_TEMPLATES = [
  { name: "Language fundamentals", rationale: "The notes describe framework work but say nothing about the language underneath, which is where confident framework users are usually thinnest." },
  { name: "Asynchronous behaviour", rationale: "The notes mention difficulty with a race condition, so this is tested directly rather than inferred." },
  { name: "Component composition", rationale: "Claimed at level 3, and the notes describe shipped UI work, so this area starts higher than the others." },
  { name: "Data and persistence", rationale: "A probe: not claimed, but adjacent to the work described, so it may reveal hidden strength." },
  { name: "Testing and correctness", rationale: "The notes describe shipping quickly with little mention of tests." },
  { name: "Performance and tradeoffs", rationale: "Separates someone who can build from someone who can decide, which is the distinction this level needs." },
];

export function fixtureBlueprint(context: FixtureContext): Blueprint {
  const count = Math.min(AREA_TEMPLATES.length, Math.max(5, context.moduleIds.length >= 6 ? 6 : 5));
  const areas = AREA_TEMPLATES.slice(0, count).map((template, index) => ({
    name: template.name,
    // Spread the available modules across areas, always leaving each area at least one.
    moduleIds: pickModules(context.moduleIds, index, count),
    hypothesisLevel: ([2, 3, 3, 2, 4, 3] as const)[index % 6],
    rationale: template.rationale,
  }));

  return {
    areas,
    timeLimitMinutes: 60,
    targetItemCount: 32,
    summary:
      "A deterministic fixture blueprint. It covers language fundamentals, the areas the notes point at, and one probe area, which is the shape a real blueprint should have.",
  };
}

function pickModules(moduleIds: string[], index: number, total: number): string[] {
  if (moduleIds.length === 0) return [];
  const perArea = Math.max(1, Math.floor(moduleIds.length / total));
  const start = (index * perArea) % moduleIds.length;
  const picked = moduleIds.slice(start, start + perArea);
  return picked.length > 0 ? picked : [moduleIds[index % moduleIds.length]];
}

/** A code challenge whose reference solution really does pass and whose starter really does fail. */
const CODE_ITEM = {
  functionName: "sumEven",
  starterCode: "function sumEven(numbers) {\n  // Your code here\n}\n",
  referenceSolution:
    "function sumEven(numbers) {\n  return numbers.filter((n) => n % 2 === 0).reduce((total, n) => total + n, 0);\n}\n",
  visibleTests: [
    { args: [[1, 2, 3, 4]], expected: 6, description: "adds the even numbers" },
    { args: [[]], expected: 0, description: "an empty list sums to zero" },
  ],
  hiddenTests: [
    { args: [[-2, -1, 0, 1]], expected: -2, description: "handles negatives and zero" },
    { args: [[7, 9, 11]], expected: 0, description: "no even numbers" },
  ],
};

export function fixtureItems(context: FixtureContext, area: string): GeneratedItem[] {
  const topic = (offset: number) => {
    const ids = context.topicIds.length ? context.topicIds : ["unknown-topic"];
    return [ids[(context.seed + offset) % ids.length]];
  };

  const items: GeneratedItem[] = [];

  // Two or three items at each difficulty, as the prompt asks for.
  for (let difficulty = 1; difficulty <= 5; difficulty++) {
    const level = difficulty as 1 | 2 | 3 | 4 | 5;

    items.push({
      kind: "mcq",
      difficulty: level,
      topicIds: topic(difficulty),
      prompt: `In ${area}, which statement about behaviour at difficulty ${difficulty} is correct?`,
      options: [
        "The correct explanation, which describes the actual mechanism",
        "A plausible misconception about ordering",
        "A plausible misconception about scope",
        "A plausible misconception about timing",
      ],
      correctIndices: [0],
      rationale: `Shows the candidate can explain the mechanism rather than recall a name (difficulty ${difficulty}).`,
    });

    items.push({
      kind: difficulty <= 2 ? "predict_output" : "find_bug",
      difficulty: level,
      topicIds: topic(difficulty + 1),
      prompt:
        difficulty <= 2
          ? "What does this print?\n\n```js\nconst items = [1, 2, 3];\nconsole.log(items.map((n) => n * 2).join(','));\n```"
          : "This function returns the wrong value for an empty list. Which fix is correct?\n\n```js\nfunction average(xs) {\n  return xs.reduce((a, b) => a + b) / xs.length;\n}\n```",
      ...(difficulty <= 2
        ? { expectedOutput: "2,4,6" }
        : {
            options: [
              "Return 0 when the list is empty, before calling reduce",
              "Pass 0 as reduce's initial value and leave the division alone",
              "Wrap the call in a try/catch and return null",
              "Use forEach with a running total instead",
            ],
            correctIndices: [0],
          }),
      rationale:
        difficulty <= 2
          ? "Tests whether the candidate can read code and predict its output."
          : "Tests whether the candidate spots that reduce throws on an empty array and that the division is also undefined.",
    });

    if (difficulty >= 3) {
      items.push({
        kind: "multi",
        difficulty: level,
        topicIds: topic(difficulty + 2),
        prompt: `Which of these are true of ${area} under load? (Select all that apply.)`,
        options: [
          "A true statement about a tradeoff",
          "A second true statement about a failure mode",
          "A statement that is true only in a different context",
          "A statement that sounds right but reverses cause and effect",
        ],
        correctIndices: [0, 1],
        rationale: "Multi-select, so a candidate who half-understands cannot guess their way through.",
      });
    }
  }

  // One code item per area, as the prompt allows.
  items.push({
    kind: "code",
    difficulty: 3,
    topicIds: topic(7),
    prompt: "Implement `sumEven(numbers)`: return the sum of the even numbers in the array. An empty array sums to 0.",
    language: "javascript",
    ...CODE_ITEM,
    rationale: "Shows the candidate can write a small, correct function including the empty-input case.",
  });

  // One item that must be dropped, so the rejection path is exercised on every run.
  items.push({
    kind: "multi",
    difficulty: 2,
    topicIds: ["this-topic-does-not-exist"],
    prompt: "An item tagged with a topic that is not in the curriculum.",
    options: ["a", "b", "c"],
    correctIndices: [0],
    rationale: "Deliberately invalid, so the drop path is covered on every fixture run.",
  });

  return items;
}

export function fixtureExplainItems(context: FixtureContext, count: number): GeneratedItem[] {
  const prompts = [
    "You add an index and writes get slower. Explain why, and describe a situation where you would accept that.",
    "A colleague proposes caching a value that changes every few seconds. Explain what you would ask before agreeing.",
    "Describe a bug you would expect from retrying a failed request automatically, and how you would prevent it.",
    "Explain the difference between a test that fails intermittently and one that fails consistently, and why the first is worse.",
  ];

  return prompts.slice(0, count).map((prompt, index) => ({
    kind: "explain" as const,
    difficulty: (3 + (index % 3)) as 3 | 4 | 5,
    topicIds: [context.topicIds[(context.seed + index) % Math.max(1, context.topicIds.length)] ?? "unknown-topic"],
    prompt,
    maxChars: 1200,
    rubric: [
      { point: "Names the mechanism rather than restating the question", weight: 0.4 },
      { point: "Describes a concrete situation or tradeoff", weight: 0.4 },
      { point: "Says what they would do, not only what is true", weight: 0.2 },
    ],
    rationale: "A written answer shows reasoning that multiple choice cannot.",
  }));
}

/**
 * Keeps everything except one item per batch, so both the keep and the drop paths run. A real
 * critic disagrees far more often; this is the floor, not a realistic rate.
 */
export function fixtureCritic(items: { length: number }): CriticVerdict[] {
  return Array.from({ length: items.length }, (_, index) => {
    const drop = index === 1 && items.length > 3;
    return {
      index,
      answer: drop ? "A different answer from the one that was keyed" : "The same answer as the key",
      agreesWithKey: !drop,
      issues: drop ? ["The wording allows a second defensible reading."] : [],
      verdict: drop ? ("drop" as const) : ("keep" as const),
    };
  });
}
