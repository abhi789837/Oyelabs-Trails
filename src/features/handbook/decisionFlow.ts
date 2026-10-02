import {
  DECISION_OPTIONS,
  DECISION_QUESTIONS,
  pathOf,
  type DecisionAnswers,
  type DecisionQuestionId,
} from "@shared/decision";

/**
 * The decision tool's state transitions, kept pure so the step flow is tested without a DOM.
 * The tree itself (`nextQuestion`, `classify`) lives in `shared/decision.ts`.
 */

/** Answers one question. Anything answered after it is dropped: a changed answer can change the route. */
export function answer(answers: DecisionAnswers, question: DecisionQuestionId, value: string): DecisionAnswers {
  const route = pathOf(answers);
  const at = route.indexOf(question);
  const kept: Record<string, string> = {};
  for (const q of at >= 0 ? route.slice(0, at) : route) {
    const v = answers[q];
    if (v) kept[q] = v;
  }
  kept[question] = value;
  return kept as DecisionAnswers;
}

/** Undoes the last answer on the route. */
export function back(answers: DecisionAnswers): DecisionAnswers {
  const answered = pathOf(answers).filter((q) => answers[q] !== undefined);
  const last = answered.at(-1);
  if (!last) return answers;
  const next = { ...answers };
  delete next[last];
  return next;
}

/** Short question labels for the visible route ("Works as specified? No → In scope? Yes"). */
export const SHORT_QUESTIONS: Record<DecisionQuestionId, string> = {
  worksAsSpecified: "Works as specified?",
  inScope: "In scope?",
  warranty: "Warranty?",
  changeKind: "Change or improve?",
  brandNew: "Brand new?",
};

const SHORT_ANSWERS: Record<string, string> = {
  yes: "Yes",
  no: "No",
  "not-live": "Not live yet",
  change: "Changes agreed behaviour",
  improve: "Improves it",
  neither: "Neither",
};

export interface RouteStep {
  question: DecisionQuestionId;
  label: string;
  answer: string;
}

/** The answered steps, in order. */
export function routeOf(answers: DecisionAnswers): RouteStep[] {
  return pathOf(answers)
    .filter((q) => answers[q] !== undefined)
    .map((q) => ({ question: q, label: SHORT_QUESTIONS[q], answer: SHORT_ANSWERS[answers[q] as string] ?? String(answers[q]) }));
}

/** "Works as specified? No → In scope? Yes" */
export function routeText(answers: DecisionAnswers): string {
  return routeOf(answers)
    .map((s) => `${s.label} ${s.answer}`)
    .join(" → ");
}

export function questionText(q: DecisionQuestionId): string {
  return DECISION_QUESTIONS[q];
}

export function optionsFor(q: DecisionQuestionId): readonly { value: string; label: string }[] {
  return DECISION_OPTIONS[q];
}
