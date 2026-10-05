/**
 * TEST STAND-IN for the v4.4 met / not-yet rubric judge (`rubric_grade`, used by `gradeWritten` and
 * `gradeForm`). Deterministic: an answer "covers" a rubric line when it shares a content word (by
 * its first five letters, so "send" / "sending" and wording changes still match) with the line's
 * label or description. It meets the standard when it covers at least half the lines, whatever
 * its style, order or length; so a good answer in different words gets full marks.
 */

const STOP = new Set(["about", "their", "there", "which", "would", "should", "could", "answer", "client", "clear", "gives", "names", "states", "points", "weight"]);

function stems(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP.has(w))
      .map((w) => w.slice(0, 5)),
  );
}

export function fixtureRubricGrade(user: string) {
  const answer = /Answer:\n"""\n([\s\S]*?)\n"""/.exec(user)?.[1] ?? "";
  const rubricBlock = /Rubric:\n([\s\S]*?)(?:\n\n|$)/.exec(user)?.[1] ?? "";
  const lines = rubricBlock
    .split("\n")
    .map((line) => /^- (\S+) \(([^,]+),[^)]*\)(?::\s*(.*))?$/.exec(line.trim()))
    .filter((m): m is RegExpExecArray => Boolean(m));
  const said = stems(answer);
  const criteria = lines.map((m) => {
    const covered = [...stems(`${m[2]} ${m[3] ?? ""}`)].some((s) => said.has(s));
    return { id: m[1], score: covered ? 3 : answer.trim() ? 1 : 0 };
  });
  const covered = criteria.filter((c) => c.score === 3).length;
  const met = answer.trim().split(/\s+/).length >= 5 && covered * 2 >= Math.max(1, criteria.length);
  return {
    observations: `The answer covers ${covered} of ${criteria.length} rubric lines.`,
    criteria,
    met,
    reason: met ? "You covered what the task needs." : "You left out part of what the task needs.",
    tip: met ? "Put the ask in the first line." : "Say exactly what you need and by when.",
    feedback: met ? "You covered what the task needs." : "You left out part of what the task needs.",
  };
}
