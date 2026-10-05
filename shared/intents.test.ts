import { describe, expect, test } from "vitest";

import { matchBundles, type SkillBundle } from "./bundles";
import { isAreaDepartment, skillUsableBy, usableSkills, type Skill } from "./catalog";
import { goalInputSchema } from "./goals";
import {
  coverageCheck,
  descriptionPhrases,
  groundPhrase,
  intentCoverage,
  intentsToGoals,
  resolveUnsure,
  unresolvedPhrase,
  unsureMessage,
  type Intent,
} from "./intents";

const REFERENCE = "frontend engineer with 1 year of experience and also want him to move to the full stack and also improve the soft skills";

const REFERENCE_INTENTS: Intent[] = [
  { id: "i1", phrase: "frontend engineer with 1 year of experience", type: "current_role", statement: "Frontend, 1–2 years", skillIds: ["eng-html"], targetLevel: 2, slider: 0, trackId: "frontend", years: 1 },
  { id: "i2", phrase: "move to the full stack", type: "move_role", statement: "Become a full-stack developer", skillIds: ["eng-http", "eng-express"], bundleId: "eng-fullstack-from-frontend", targetLevel: 3, slider: 4, trackId: "fullstack" },
  { id: "i3", phrase: "improve the soft skills", type: "improve_area", statement: "Get better at soft skills", skillIds: ["ss-spoken-english", "ss-teamwork"], bundleId: "soft-skills-engineer", targetLevel: 3, slider: 3 },
];

describe("descriptionPhrases", () => {
  test("splits the reference case into its three phrases, filler trimmed", () => {
    expect(descriptionPhrases(REFERENCE).map((p) => p.text)).toEqual(["frontend engineer with 1 year of experience", "move to the full stack", "improve the soft skills"]);
  });

  test("splits on commas, semicolons, full stops, plus and but; keeps node.js and c++ whole", () => {
    const phrases = descriptionPhrases("Knows node.js; c++ basics. Weak on Git, but good with React + AI-driven work").map((p) => p.text);
    expect(phrases).toEqual(["Knows node.js", "c++ basics", "Weak on Git", "good with React", "AI-driven work"]);
  });

  test("a clause with only filler is not a phrase", () => {
    expect(descriptionPhrases("and he should, also").map((p) => p.text)).toEqual([]);
  });
});

describe("groundPhrase", () => {
  test("accepts exact quotes case-insensitively and with collapsed whitespace, in the description's casing", () => {
    expect(groundPhrase("Frontend   dev, 2 yrs React", "frontend dev")).toBe("Frontend dev");
    expect(groundPhrase(REFERENCE, "  Move to the FULL stack. ")).toBe("move to the full stack");
  });

  test("rejects paraphrases", () => {
    expect(groundPhrase(REFERENCE, "become a full-stack developer")).toBeNull();
    expect(groundPhrase(REFERENCE, "")).toBeNull();
  });
});

describe("coverageCheck", () => {
  test("the reference case's three intents cover every phrase", () => {
    expect(coverageCheck(REFERENCE, REFERENCE_INTENTS)).toEqual({ uncovered: [] });
  });

  test("a missing intent leaves its phrase uncovered", () => {
    expect(coverageCheck(REFERENCE, REFERENCE_INTENTS.slice(0, 2)).uncovered).toEqual(["improve the soft skills"]);
    expect(coverageCheck(REFERENCE, []).uncovered).toHaveLength(3);
  });

  test("a nonsense phrase is never covered by the others", () => {
    const description = `${REFERENCE}, and also learn quantum basket weaving`;
    expect(coverageCheck(description, REFERENCE_INTENTS).uncovered).toEqual(["learn quantum basket weaving"]);
  });

  test("coverage is by position: 'frontend' in one intent does not cover 'frontend testing' elsewhere", () => {
    const description = "frontend engineer, weak at frontend testing";
    const intents = [{ phrase: "frontend engineer" }];
    expect(coverageCheck(description, intents).uncovered).toEqual(["weak at frontend testing"]);
  });

  test("a shorter quote still covers its clause when the rest is filler or experience words", () => {
    expect(coverageCheck("Frontend dev with 2 years of experience", [{ phrase: "Frontend dev" }]).uncovered).toEqual([]);
  });

  test("a left-out phrase counts as covered (the admin chose to ignore it)", () => {
    expect(coverageCheck("weak on Git, likes purple bananas", [{ phrase: "weak on Git" }, { phrase: "likes purple bananas", status: "left_out" }]).uncovered).toEqual([]);
  });

  test("dates and weekdays alone are not goals", () => {
    expect(coverageCheck("New joiner, starts Monday", [{ phrase: "New joiner" }]).uncovered).toEqual([]);
  });
});

describe("intentsToGoals", () => {
  test("the reference case: two text goals, the frontend track and 1–2 years", () => {
    const out = intentsToGoals(REFERENCE_INTENTS);
    expect(out.trackId).toBe("frontend");
    expect(out.experienceBand).toBe("1-2");
    expect(out.goals).toEqual([
      { type: "text", originalText: "move to the full stack", outcome: "Become a full-stack developer", skillIds: ["eng-http", "eng-express"], targetLevel: 3, caseId: null, slider: 4, intentId: "i2" },
      { type: "text", originalText: "improve the soft skills", outcome: "Get better at soft skills", skillIds: ["ss-spoken-english", "ss-teamwork"], targetLevel: 3, caseId: null, slider: 3, intentId: "i3" },
    ]);
  });

  test("case, constraint and left-out intents", () => {
    const out = intentsToGoals([
      { id: "i1", phrase: "resolve merge conflicts", type: "case", statement: "Can resolve a merge conflict", skillIds: ["eng-git"], caseId: "eng-merge-conflict", targetLevel: 3, slider: 5 },
      { id: "i2", phrase: "10 hours a week", type: "constraint", statement: "10 hours a week", skillIds: [], targetLevel: 3, slider: 0, constraint: { hoursPerWeek: 10 } },
      { id: "i3", phrase: "in 3 months", type: "constraint", statement: "Finish within 12 weeks", skillIds: [], targetLevel: 3, slider: 0, constraint: { deadlineWeeks: 12 } },
      { id: "i4", phrase: "likes cats", type: "improve_area", statement: "Leave it out", skillIds: [], targetLevel: 3, slider: 0, status: "left_out" },
    ]);
    expect(out.goals).toEqual([{ type: "case", originalText: "resolve merge conflicts", outcome: "Can resolve a merge conflict", skillIds: ["eng-git"], targetLevel: 3, caseId: "eng-merge-conflict", slider: 5, intentId: "i1" }]);
    expect(out.hoursPerWeek).toBe(10);
    expect(out.deadlineWeeks).toBe(12);
  });

  test("goal inputs take up to 12 skills (a whole skill group)", () => {
    const ids = Array.from({ length: 12 }, (_, i) => `s-${i}`);
    expect(goalInputSchema.safeParse({ type: "text", originalText: "x", outcome: "y", skillIds: ids, targetLevel: 3, slider: 3 }).success).toBe(true);
    expect(goalInputSchema.safeParse({ type: "text", originalText: "x", outcome: "y", skillIds: [...ids, "s-12"], targetLevel: 3, slider: 3 }).success).toBe(false);
  });
});

describe("Unsure", () => {
  const unsure = { phrase: "learn quantum basket weaving", options: [{ label: "Testing", skillIds: ["eng-unit-testing"] }, { label: "Leave it out", skillIds: [], leaveOut: true }] };

  test("blocks a save, with the plain message", () => {
    expect(unresolvedPhrase({ unsure: [unsure] })).toBe("learn quantum basket weaving");
    expect(unsureMessage("learn quantum basket weaving")).toBe("We weren't sure what you meant by 'learn quantum basket weaving'. Pick an option first.");
  });

  test("intents that leave a phrase uncovered also block; covering intents do not", () => {
    expect(unresolvedPhrase({ description: REFERENCE, intents: REFERENCE_INTENTS.slice(0, 2), unsure: [] })).toBe("improve the soft skills");
    expect(unresolvedPhrase({ description: REFERENCE, intents: REFERENCE_INTENTS, unsure: [] })).toBeNull();
    expect(unresolvedPhrase({ description: REFERENCE })).toBeNull();
  });

  test("an answer becomes an intent with the next id; Leave it out is a left-out intent", () => {
    const picked = resolveUnsure(unsure, unsure.options[0]!, REFERENCE_INTENTS);
    expect(picked).toMatchObject({ id: "i4", phrase: unsure.phrase, type: "improve_area", statement: "Testing", skillIds: ["eng-unit-testing"], status: "mapped" });
    const left = resolveUnsure(unsure, unsure.options[1]!, REFERENCE_INTENTS);
    expect(left).toMatchObject({ status: "left_out", skillIds: [] });
    expect(coverageCheck(`${REFERENCE}, and also learn quantum basket weaving`, [...REFERENCE_INTENTS, left]).uncovered).toEqual([]);
  });
});

describe("intentCoverage", () => {
  const core = ["eng-html", "eng-css"];

  test("every intent in the test and on the path: nothing missing", () => {
    const c = intentCoverage(REFERENCE_INTENTS, ["eng-css", "eng-http", "ss-teamwork"], ["eng-html", "eng-express", "ss-spoken-english"], {}, { coreSkillIds: core });
    expect(c.missingBlueprint).toEqual([]);
    expect(c.missingPath).toEqual([]);
  });

  test("an intent with no question or no path item is reported", () => {
    const c = intentCoverage(REFERENCE_INTENTS, ["eng-css", "eng-http"], ["eng-express"], {}, { coreSkillIds: core });
    expect(c.missingBlueprint).toEqual(["i3"]);
    expect(c.missingPath).toEqual(["i1", "i3"]);
  });

  test("off the path is fine when every skill already meets its level, with the reason", () => {
    const c = intentCoverage(REFERENCE_INTENTS, ["eng-css", "eng-http", "ss-teamwork"], ["eng-express"], { "ss-spoken-english": 5, "ss-teamwork": 4, "eng-html": 3, "eng-css": 5 }, { coreSkillIds: core });
    expect(c.missingPath).toEqual([]);
    expect(c.lines.find((l) => l.intentId === "i3")?.reason).toBe("Already strong: scored 4/5");
  });

  test("constraints and left-out intents carry no promise", () => {
    const c = intentCoverage(
      [
        { id: "i1", phrase: "10 hours a week", type: "constraint", statement: "10 hours a week", skillIds: [], targetLevel: 3, slider: 0 },
        { id: "i2", phrase: "likes cats", type: "improve_area", statement: "Leave it out", skillIds: [], targetLevel: 3, slider: 0, status: "left_out" },
      ],
      [],
      [],
      {},
    );
    expect(c.lines).toEqual([]);
  });
});

describe("area departments and skill groups", () => {
  const skill = (id: string, departmentId: string) => ({ id, departmentId }) as Skill;

  test("soft skills are usable by every department; other departments' skills are not", () => {
    expect(isAreaDepartment("soft")).toBe(true);
    expect(isAreaDepartment({ id: "x", kind: "area" })).toBe(true);
    expect(isAreaDepartment("engineering", [{ id: "engineering", kind: "role" }])).toBe(false);
    expect(skillUsableBy(skill("ss-teamwork", "soft"), "pm")).toBe(true);
    expect(skillUsableBy(skill("eng-git", "engineering"), "pm")).toBe(false);
    expect(usableSkills([skill("ss-teamwork", "soft"), skill("pm-x", "pm"), skill("eng-git", "engineering")], "pm").map((s) => s.id)).toEqual(["pm-x", "ss-teamwork"]);
  });

  const bundle = (b: Partial<SkillBundle> & { id: string }): SkillBundle => ({ name: b.id, departmentId: null, fromTrackIds: [], phrases: [], skillIds: ["x"], targetLevel: 3, active: true, ...b });
  const bundles = [
    bundle({ id: "backend-any", departmentId: "engineering", phrases: ["backend", "back end"] }),
    bundle({ id: "fullstack-from-fe", departmentId: "engineering", fromTrackIds: ["frontend"], phrases: ["full stack", "fullstack", "backend"] }),
    bundle({ id: "english", phrases: ["english", "spoken english"] }),
    bundle({ id: "off", phrases: ["english"], active: false }),
  ];

  test("matchBundles: whole words, the more specific group first, current-track limits honoured", () => {
    expect(matchBundles(bundles, "move to the full-stack", "engineering", "frontend").map((b) => b.id)).toEqual(["fullstack-from-fe"]);
    expect(matchBundles(bundles, "doing backend", "engineering", "frontend").map((b) => b.id)).toEqual(["fullstack-from-fe", "backend-any"]);
    expect(matchBundles(bundles, "doing backend", "engineering", "mobile").map((b) => b.id)).toEqual(["backend-any"]);
    expect(matchBundles(bundles, "improve spoken English", "pm", null).map((b) => b.id)).toEqual(["english"]);
    expect(matchBundles(bundles, "englishman", "pm", null)).toEqual([]);
  });
});
