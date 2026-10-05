import type {
  CodeAttemptResult,
  CodeTestResult,
  QuizAttemptResult,
  QuizQuestionResult,
} from "../../../shared/content";
import { QUIZ_PASS_THRESHOLD } from "../../../shared/content";
import { verdictFor, type ScoringMode } from "../../../shared/scoring";
import type { CodeSandbox } from "../sandbox";
import { correctIndicesOf, visibleTestCount } from "./filter";
import type { AuthoredCodeChallenge, AuthoredQuizQuestion } from "./store";

/**
 * Grading lives on the server from v3 (brief §7.4, §7.5): the answer key never reaches the
 * browser, so this is the only place a score is decided.
 */

/**
 * Answers arrive as *original* option indices. The client shuffles options for display and maps
 * back before sending, so the shuffle is purely cosmetic and the server never has to know the
 * seed. Multi-select is all-or-nothing: the chosen set must equal the correct set exactly.
 */
export function gradeQuiz(
  questions: AuthoredQuizQuestion[],
  answers: Record<string, number[]>,
): QuizAttemptResult {
  const perQuestion: QuizQuestionResult[] = questions.map((question) => {
    const correctIndices = correctIndicesOf(question);
    const chosen = [...new Set(answers[question.id] ?? [])].sort((a, b) => a - b);
    const correct =
      chosen.length === correctIndices.length && chosen.every((value, i) => value === correctIndices[i]);
    return { id: question.id, correct, correctIndices, explanation: question.explanation };
  });

  const correctCount = perQuestion.filter((q) => q.correct).length;
  const total = questions.length;
  const score = total === 0 ? 0 : Math.round((correctCount / total) * 100);

  return {
    kind: "quiz",
    score,
    passed: total > 0 && score >= QUIZ_PASS_THRESHOLD,
    correctCount,
    total,
    perQuestion,
  };
}

/**
 * Runs every test — the ones the learner could run in the browser and the hidden ones — and
 * requires all of them to pass. Hidden tests report only their description and pass/fail: their
 * arguments and expected values stay on the server, or hiding them would be pointless.
 */
export async function gradeCode(
  challenge: AuthoredCodeChallenge,
  code: string,
  sandbox: CodeSandbox,
  mode: ScoringMode = "partial",
): Promise<CodeAttemptResult> {
  const run = await sandbox.run({
    code,
    functionName: challenge.functionName,
    testCases: challenge.testCases,
  });

  const visibleCount = visibleTestCount(challenge.testCases.length);

  const results: CodeTestResult[] = challenge.testCases.map((test, index) => {
    const hidden = index >= visibleCount;
    const outcome = run.outcomes.find((o) => o.index === index);

    const base: CodeTestResult = {
      description: hidden ? `Hidden test ${index - visibleCount + 1}` : test.description,
      passed: outcome?.passed ?? false,
      hidden,
      ...(test.isEdgeCase ? { isEdgeCase: true as const } : {}),
    };

    if (hidden) {
      // Deliberately nothing else: no expected, no actual, no error text. An error message can
      // echo the input, which would hand back the hidden case.
      return base;
    }

    return {
      ...base,
      expected: outcome?.expected ?? JSON.stringify(test.expected),
      ...(outcome?.actual !== undefined ? { actual: outcome.actual } : {}),
      ...(outcome?.error
        ? { error: outcome.error }
        : run.timedOut
          ? { error: "Timed out. Look for an infinite loop." }
          : run.compileError
            ? { error: "Not run: the code didn't load." }
            : {}),
    };
  });

  const passedCount = results.filter((r) => r.passed).length;
  const total = results.length;
  const allPassed = total > 0 && passedCount === total;

  // v4.4 full-marks mode: every core test must pass; a missed edge test is a note, not a fail.
  // Partial mode keeps the old bar (every test, hidden ones included).
  let passed = allPassed;
  const notes: string[] = [];
  if (mode === "full" && !run.compileError) {
    const verdict = verdictFor({
      kind: "code",
      outcomes: results.map((r) => ({ passed: r.passed, tier: r.isEdgeCase ? "edge" : "core", label: r.hidden ? undefined : r.description })),
    });
    passed = verdict?.full ?? false;
    if (passed) {
      for (const r of results) {
        if (r.isEdgeCase && !r.passed) notes.push(r.hidden ? "A hidden edge case did not pass. Check empty, very large and unusual inputs." : `Edge case not handled yet: ${r.description}.`);
      }
    }
  }

  return {
    kind: "code",
    score: total === 0 ? 0 : passed && mode === "full" ? 100 : Math.round((passedCount / total) * 100),
    passed,
    passedCount,
    total,
    results,
    ...(notes.length ? { notes } : {}),
    ...(run.compileError ? { compileError: run.compileError } : {}),
    ...(run.timedOut ? { timedOut: true as const } : {}),
  };
}
