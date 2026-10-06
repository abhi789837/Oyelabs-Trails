/**
 * Quick checks and tasks written in the v5 block editor (src/v5/admin/library/editor/blocks.ts) are
 * saved inside a lesson's Markdown as fenced blocks:
 *
 *   ```quiz
 *   {"question": "...", "options": ["...", "..."], "correct": [1], "why": "..."}
 *   ```
 *   ```task
 *   {"instructions": "...", "doneWhen": "..."}
 *   ```
 *
 * This reads them back for the screens that show lessons: the v5 reading view draws a quick check
 * and a task; the older RichText draws a quiet "Practice" card instead of raw JSON. Anything that
 * doesn't parse (an unfinished draft, hand-written JSON) is null, and the caller shows it as code.
 */

export interface PracticeQuiz {
  kind: "quiz";
  question: string;
  options: string[];
  /** Indexes into `options` of the right answers (one or more). */
  correct: number[];
  why: string;
}

export interface PracticeTask {
  kind: "task";
  instructions: string;
  doneWhen: string;
}

export type PracticeBlock = PracticeQuiz | PracticeTask;

export function isPracticeLang(lang: string): boolean {
  const l = lang.trim().toLowerCase();
  return l === "quiz" || l === "task";
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

export function parsePracticeBlock(lang: string, code: string): PracticeBlock | null {
  const l = lang.trim().toLowerCase();
  if (l !== "quiz" && l !== "task") return null;
  let raw: unknown;
  try {
    raw = JSON.parse(code);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;

  if (l === "task") {
    const instructions = str(r.instructions);
    return instructions ? { kind: "task", instructions, doneWhen: str(r.doneWhen) } : null;
  }

  const question = str(r.question);
  if (!question || !Array.isArray(r.options)) return null;
  // Empty options are dropped, and the right-answer indexes are re-pointed at what's left.
  const kept: { text: string; was: number }[] = [];
  r.options.forEach((o, was) => {
    const text = str(o);
    if (text) kept.push({ text, was });
  });
  if (kept.length < 2) return null;
  const rawCorrect = Array.isArray(r.correct) ? r.correct : typeof r.correct === "number" ? [r.correct] : [];
  const correct = [...new Set(rawCorrect.filter((n): n is number => Number.isInteger(n)))]
    .map((n) => kept.findIndex((k) => k.was === n))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);
  if (!correct.length) return null;
  return { kind: "quiz", question, options: kept.map((k) => k.text), correct, why: str(r.why) };
}

/** Whether a set of chosen options is exactly the right set. */
export function quizAnswerIsRight(quiz: Pick<PracticeQuiz, "correct">, chosen: readonly number[]): boolean {
  const a = [...new Set(chosen)].sort((x, y) => x - y);
  return a.length === quiz.correct.length && a.every((n, i) => n === quiz.correct[i]);
}
