import { describe, expect, test } from "vitest";

import type { Intent } from "./intents";
import { choiceForSlider, firstStepsFrom, listWords, PRIORITY_CHOICE_LABELS, PRIORITY_CHOICE_SLIDER, PRIORITY_CHOICES, testChecksFrom, type PreviewSkill } from "./onboardPreview";

const intent = (over: Partial<Intent>): Intent => ({ id: "i1", phrase: "x", type: "improve_area", statement: "Do x", skillIds: [], targetLevel: 3, slider: 3, status: "mapped", ...over }) as Intent;

const skills = new Map<string, PreviewSkill>([
  ["eng-react", { name: "React", area: "Frontend frameworks", trackIds: ["frontend"] }],
  ["eng-node-runtime", { name: "Node.js runtime", area: "Backend", trackIds: ["backend"] }],
  ["eng-express", { name: "Express", area: "Backend", trackIds: ["backend"] }],
  ["eng-sql", { name: "SQL", area: "Data & databases", trackIds: ["backend"] }],
  ["ss-spoken-english", { name: "Spoken English at work", area: "Speaking", trackIds: ["soft-every-role"] }],
  ["ss-workplace-writing", { name: "Workplace writing", area: "Writing", trackIds: ["soft-every-role"] }],
]);
const intents: Intent[] = [
  intent({ id: "i1", type: "current_role", trackId: "frontend", slider: 0 }),
  intent({ id: "i2", type: "move_role", statement: "Become a full-stack developer", skillIds: ["eng-node-runtime", "eng-express"], slider: 4 }),
  intent({ id: "i3", type: "improve_area", statement: "Better soft skills", skillIds: ["ss-spoken-english", "ss-workplace-writing"], slider: 3 }),
];

describe("the priority drop-down", () => {
  test("maps each choice to a priority, and back", () => {
    expect(PRIORITY_CHOICES.map((c) => PRIORITY_CHOICE_LABELS[c])).toEqual(["Most important", "Important", "Nice to have"]);
    expect(PRIORITY_CHOICE_SLIDER).toEqual({ most: 5, important: 3, nice: 2 });
    expect([5, 4, 3, 2, 1].map(choiceForSlider)).toEqual(["most", "most", "important", "nice", "nice"]);
    for (const c of PRIORITY_CHOICES) expect(choiceForSlider(PRIORITY_CHOICE_SLIDER[c])).toBe(c);
  });
});

describe("plain wording", () => {
  test("lists words with commas and 'and'", () => {
    expect(listWords([])).toBe("");
    expect(listWords(["a"])).toBe("a");
    expect(listWords(["a", "b", "c"])).toBe("a, b and c");
  });

  test("test checks: one line per thing asked for, spoken answers counted", () => {
    const checks = testChecksFrom({
      questions: [
        { skillId: "eng-node-runtime", subtype: "code" },
        { skillId: "eng-express", subtype: "code" },
        { skillId: "ss-spoken-english", subtype: "speak" },
        { skillId: "ss-spoken-english", subtype: "speak" },
        { skillId: "ss-workplace-writing", subtype: "write" },
        { skillId: "eng-react", subtype: "code" },
      ],
      skills,
      intents,
      coreSkillIds: ["eng-react"],
      trackName: "Frontend",
    });
    expect(checks).toEqual(["Frontend basics used every day", "The first steps of backend work", "Spoken English (2 short recordings) and work emails"]);
  });

  test("first steps: own-role gaps first, a prerequisite belongs to what it leads to", () => {
    const steps = firstStepsFrom({ pathSkillIds: ["eng-sql", "eng-node-runtime", "eng-express", "ss-spoken-english"], skills, intents, coreSkillIds: ["eng-react"], trackId: "frontend", trackName: "Frontend" });
    expect(steps).toEqual(["Frontend gaps", "Backend basics", "Speaking & writing at work"]);
  });

  test("first steps: more than four become an ellipsis", () => {
    const many = ["eng-sql", "eng-node-runtime", "ss-spoken-english"];
    const steps = firstStepsFrom({ pathSkillIds: many, skills, intents: [], coreSkillIds: ["eng-react"], trackId: "frontend", trackName: "Frontend", max: 2 });
    expect(steps).toEqual(["Frontend gaps", "Data & databases basics", "…"]);
  });
});
