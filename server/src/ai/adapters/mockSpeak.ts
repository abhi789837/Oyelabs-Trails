/**
 * TEST STAND-IN for `grade_speak` (schema "speak_grade"), used by `MockProvider` only.
 *
 * Deterministic from the answer's length, so tests can steer it: under 8 words is "not yet" at A2;
 * otherwise met, B1 up to 30 words, B2 up to 60, C1 beyond. An answer containing "NOT YET" is
 * always "not yet" (for tests of the not-yet path with a long answer).
 */
export function fixtureSpeakGrade(user: string) {
  const mode = /Mode: typed/.test(user) ? "typed" : "spoken";
  const answer = /"""\n([\s\S]*?)\n"""/.exec(user)?.[1] ?? "";
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const forcedNo = /NOT YET/.test(answer);
  const met = words >= 8 && !forcedNo;
  const englishLevel = words < 8 ? "A2" : words <= 30 ? "B1" : words <= 60 ? "B2" : "C1";
  const s = met ? 2 : 1;
  return {
    observations: `The ${mode} answer has ${words} words${met ? " and covers the main point" : " and leaves out what was asked"}.`,
    criteria: { task: s, clarity: s, range: s, accuracy: s, fluency: s, audience: s },
    met,
    englishLevel,
    reason: met ? "You covered what was asked in a clear order." : "The answer leaves out what the listener needed.",
    tip: met ? "Lead with the main point in your first sentence." : "Say the main point first, then one detail and the next step.",
  };
}
