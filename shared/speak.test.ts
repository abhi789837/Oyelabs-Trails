import { describe, expect, test } from "vitest";

import { enforceBlueprint, MAX_SPEAK_SLOTS, SPEAK_SLOT_SEC, type SlotSubtype } from "./personalise";
import { softTaskKindFor, softWrittenKindFor } from "./softSkills";
import { checkTask, gradeTask, speakAnswered, taskResponseSchema, taskSchema, toLearnerTask, AI_GRADED_KINDS, type SpeakTask } from "./tasks";
import { estimateSeconds, SPEAK_ITEM_SEC } from "./timing";

/** v4.4 Phase 3b: the Speak task kind and the soft-skill slot rules. */

const speak = {
  kind: "speak",
  title: "Explain a two-day delay to the client",
  prompt: "The release is two days late because testing found a payment bug. Tell the client.",
  audience: "client",
  prepSec: 20,
  maxSec: 90,
  lookFor: ["Says the new date first", "One plain reason, no blame", "What happens next"],
  writtenFallback: "Write what you would say to the client.",
  explanation: "Lead with the date, give one reason, end with the next step.",
};

describe("the speak task", () => {
  test("parses, passes checkTask and hides only the explanation from the learner", () => {
    const task = taskSchema.parse(speak) as SpeakTask;
    expect(checkTask(task)).toEqual([]);
    const learner = toLearnerTask(task);
    expect(learner).toMatchObject({ kind: "speak", audience: "client", prepSec: 20, maxSec: 90, writtenFallback: speak.writtenFallback });
    expect("explanation" in learner).toBe(false);
    expect(AI_GRADED_KINDS).toContain("speak");
  });

  test("rejects a bad shape: maxSec outside 60–90, one lookFor line, an unknown audience, a prep other than 20 s", () => {
    for (const bad of [{ maxSec: 120 }, { lookFor: ["only one"] }, { audience: "friends" }, { prepSec: 10 }, { lookFor: ["a", "b", "c", "d", "e", "f"] }]) {
      expect(taskSchema.safeParse({ ...speak, ...bad }).success).toBe(false);
    }
  });

  test("checkTask flags duplicate lookFor lines", () => {
    const task = taskSchema.parse({ ...speak, lookFor: ["Says the date", "says the date"] });
    expect(checkTask(task)).toContain("speak: duplicate lookFor lines");
  });

  test("a recording or a typed answer waits for the grader; nothing at all scores 0", () => {
    const task = taskSchema.parse(speak);
    const recorded = taskResponseSchema.parse({ kind: "speak", recordingId: "r1", durationSec: 42 });
    expect(recorded).toMatchObject({ usedFallback: false, reRecorded: false });
    expect(gradeTask(task, recorded).score).toBeNull();
    const typed = taskResponseSchema.parse({ kind: "speak", usedFallback: true, fallbackText: "The release moves to Friday." });
    expect(speakAnswered(typed as never)).toBe(true);
    expect(gradeTask(task, typed).score).toBeNull();
    expect(gradeTask(task, taskResponseSchema.parse({ kind: "speak", usedFallback: true, fallbackText: "  " })).score).toBe(0);
    expect(gradeTask(task, null).score).toBe(0);
  });

  test("a Speak item is timed at 150 seconds whatever its wording", () => {
    const item = { type: "task" as const, prompt: "word ".repeat(50), coding: null, mcq: null, task: taskSchema.parse(speak) };
    expect(estimateSeconds(item)).toBe(SPEAK_ITEM_SEC);
    expect(SPEAK_ITEM_SEC).toBe(150);
  });
});

describe("soft-skill slots", () => {
  const mixLine = (skillId: string, handsOn: number) => ({ skillId, skillName: skillId, slider: 3, group: "other" as const, count: handsOn, handsOn, mcq: 0 });

  test("enforceBlueprint caps Speak at 2, gives each 150 s and counts it as hands-on", () => {
    const lines = [mixLine("ss-spoken-english", 2), mixLine("ss-standup-updates", 1), mixLine("ss-client-team-communication", 1), mixLine("ss-workplace-writing", 1)];
    const slots = enforceBlueprint({
      proposed: [],
      mix: { lines, total: 5, handsOn: 5, mcq: 0 } as never,
      skip: [],
      skillNames: new Map(),
      format: "coding",
      difficultyOrder: [2, 3, 1],
      defaultHandsOn: (skillId, nth) => (softTaskKindFor(skillId, nth) ?? "spot") as SlotSubtype,
      defaultMcq: () => "mcq-text",
      afterSpeakCap: softWrittenKindFor,
    });
    const spoken = slots.filter((s) => s.subtype === "speak");
    expect(spoken).toHaveLength(MAX_SPEAK_SLOTS);
    expect(spoken.every((s) => s.targetSec === SPEAK_SLOT_SEC && s.type === "task")).toBe(true);
    // The third and fourth would-be Speak slots fall through to a written kind.
    expect(slots.filter((s) => s.subtype !== "speak").every((s) => s.targetSec === 80)).toBe(true);
    expect(slots.some((s) => s.skillId === "ss-workplace-writing" && s.subtype === "write")).toBe(true);
    // The model cannot exceed the cap either.
    const proposed = slots.map((s) => ({ skillId: s.skillId, kind: "handsOn" as const, subtype: "speak" as const, difficulty: 2, hint: "" }));
    const forced = enforceBlueprint({
      proposed,
      mix: { lines, total: 5, handsOn: 5, mcq: 0 } as never,
      skip: [],
      skillNames: new Map(),
      format: "coding",
      difficultyOrder: [2],
      defaultHandsOn: () => "write",
      defaultMcq: () => "mcq-text",
    });
    expect(forced.filter((s) => s.subtype === "speak")).toHaveLength(2);
  });

  test("soft kinds rotate per skill, and writing skills never get Speak", () => {
    expect(softTaskKindFor("ss-spoken-english", 0)).toBe("speak");
    expect(softTaskKindFor("ss-standup-updates", 1)).toBe("rank");
    expect(softTaskKindFor("ss-workplace-writing", 0)).toBe("write");
    expect(softTaskKindFor("ss-explain-simply", 3)).toBe("write");
    expect(softTaskKindFor("eng-react", 0)).toBeNull();
    expect(softWrittenKindFor("ss-presenting-demoing")).toBe("rank");
  });
});
