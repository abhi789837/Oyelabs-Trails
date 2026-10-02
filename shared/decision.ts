/**
 * v4.2: "Bug, enhancement, change request or new feature?" — the decision tree PMs use on every
 * client request. Pure and deterministic: the drill grader, the standalone tool and the course
 * practice all call `classify`. Billing wording comes from handbook rules (`billingRuleId`), so an
 * admin who confirms Oyelabs' rule changes what every screen says.
 */

export const DECISION_QUESTIONS = {
  worksAsSpecified: "Does it work as specified and accepted?",
  inScope: "Is it in the signed scope or acceptance criteria?",
  warranty: "Is it inside the warranty window?",
  changeKind: "Does it change agreed behaviour, or improve existing behaviour?",
  brandNew: "Is it brand-new functionality?",
} as const;
export type DecisionQuestionId = keyof typeof DECISION_QUESTIONS;

export const DECISION_OPTIONS = {
  worksAsSpecified: [
    { value: "yes", label: "Yes, it does what was specified and accepted" },
    { value: "no", label: "No, it does not" },
  ],
  inScope: [
    { value: "yes", label: "Yes, the scope or acceptance criteria cover it" },
    { value: "no", label: "No, it was never specified" },
  ],
  warranty: [
    { value: "not-live", label: "Not live yet (still in delivery)" },
    { value: "yes", label: "Yes, live and inside the warranty window" },
    { value: "no", label: "No, live and past the warranty window" },
  ],
  changeKind: [
    { value: "change", label: "It changes behaviour that was agreed" },
    { value: "improve", label: "It improves something that already works" },
    { value: "neither", label: "Neither: it asks for something that does not exist" },
  ],
  brandNew: [
    { value: "yes", label: "Yes, brand-new functionality" },
    { value: "no", label: "No, it's a question or a misunderstanding" },
  ],
} as const satisfies Record<DecisionQuestionId, readonly { value: string; label: string }[]>;

export type DecisionAnswers = Partial<{
  worksAsSpecified: "yes" | "no";
  inScope: "yes" | "no";
  warranty: "not-live" | "yes" | "no";
  changeKind: "change" | "improve" | "neither";
  brandNew: "yes" | "no";
}>;

export const CLASSIFICATIONS = ["bug", "bug-warranty", "bug-support", "enhancement", "change-request", "new-feature", "clarification"] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];

export interface DecisionOutcome {
  classification: Classification;
  label: string;
  /** The handbook term the result is about. */
  termId: string;
  /** The handbook rule whose statement is the billing treatment. */
  billingRuleId: string;
  /** Shown when the rule is not confirmed yet. Always phrased as typical. */
  typicalBilling: string;
  nextStep: string;
  /** Handbook template id to use, when there is one. */
  templateId: string | null;
}

export const OUTCOMES: Record<Classification, DecisionOutcome> = {
  bug: {
    classification: "bug",
    label: "Bug (found during delivery)",
    termId: "bug",
    billingRuleId: "billing-bug-in-delivery",
    typicalBilling: "Typically fixed at no extra cost: meeting the agreed specification is part of the delivery.",
    nextStep: "Log it as a bug with steps to reproduce, severity and priority, and fix it within the sprint or release plan.",
    templateId: null,
  },
  "bug-warranty": {
    classification: "bug-warranty",
    label: "Bug under warranty",
    termId: "warranty",
    billingRuleId: "billing-bug-warranty",
    typicalBilling: "Typically fixed free of charge under the warranty, within the agreed response and resolution times.",
    nextStep: "Log it as a warranty bug, confirm the severity with the client, and fix it within the warranty SLA.",
    templateId: "hypercare-log",
  },
  "bug-support": {
    classification: "bug-support",
    label: "Bug after the warranty (support)",
    termId: "support",
    billingRuleId: "billing-bug-after-warranty",
    typicalBilling: "Typically covered by an active support or AMC plan, otherwise quoted and billed as support work.",
    nextStep: "Check the client's support or AMC plan. Handle it under the plan, or quote it as billable support.",
    templateId: null,
  },
  enhancement: {
    classification: "enhancement",
    label: "Enhancement",
    termId: "enhancement",
    billingRuleId: "billing-enhancement",
    typicalBilling: "Typically estimated and billed, or traded against something else in the backlog; small ones may be bundled.",
    nextStep: "Log it in the backlog as an enhancement, estimate it, and agree the priority and cost with the client before starting.",
    templateId: "cr-form",
  },
  "change-request": {
    classification: "change-request",
    label: "Change request",
    termId: "change-request",
    billingRuleId: "billing-change-request",
    typicalBilling: "Typically billable: a CR is estimated, priced and approved in writing before work starts, and may move dates.",
    nextStep: "Raise a CR with the scope, impact on time and cost, and assumptions, and get written approval before starting.",
    templateId: "cr-form",
  },
  "new-feature": {
    classification: "new-feature",
    label: "New feature",
    termId: "new-feature",
    billingRuleId: "billing-new-feature",
    typicalBilling: "Typically estimated as new work: a CR within the current SOW, or a new phase or SOW for larger features.",
    nextStep: "Capture the requirement, estimate it as new work, and propose it as a CR or as the next phase.",
    templateId: "cr-form",
  },
  clarification: {
    classification: "clarification",
    label: "Clarification (no change)",
    termId: "clarification",
    billingRuleId: "billing-clarification",
    typicalBilling: "Typically no charge: explain how the agreed behaviour works, and add it to the documentation if it keeps coming up.",
    nextStep: "Reply with how it works today and where that was agreed, and note it in the FAQ or KT notes.",
    templateId: null,
  },
};

/** The next question to ask, or null once the answers decide the outcome. */
export function nextQuestion(a: DecisionAnswers): DecisionQuestionId | null {
  if (!a.worksAsSpecified) return "worksAsSpecified";
  if (a.worksAsSpecified === "no") {
    if (!a.inScope) return "inScope";
    if (a.inScope === "yes") return a.warranty ? null : "warranty";
    // Not working as the person expects, but it was never specified: it is not a bug.
  }
  if (!a.changeKind) return "changeKind";
  if (a.changeKind === "neither") return a.brandNew ? null : "brandNew";
  return null;
}

/** The outcome for a complete set of answers, or null while a question is still open. */
export function classify(a: DecisionAnswers): DecisionOutcome | null {
  if (nextQuestion(a) !== null) return null;
  if (a.worksAsSpecified === "no" && a.inScope === "yes") {
    if (a.warranty === "not-live") return OUTCOMES.bug;
    return a.warranty === "yes" ? OUTCOMES["bug-warranty"] : OUTCOMES["bug-support"];
  }
  if (a.changeKind === "change") return OUTCOMES["change-request"];
  if (a.changeKind === "improve") return OUTCOMES.enhancement;
  return a.brandNew === "yes" ? OUTCOMES["new-feature"] : OUTCOMES.clarification;
}

/** The questions actually asked for these answers, in order (for showing the learner's route). */
export function pathOf(a: DecisionAnswers): DecisionQuestionId[] {
  const asked: DecisionQuestionId[] = [];
  const partial: DecisionAnswers = {};
  for (let q = nextQuestion(partial); q; q = nextQuestion(partial)) {
    asked.push(q);
    const answer = a[q];
    if (!answer) break;
    (partial as Record<string, string>)[q] = answer;
  }
  return asked;
}
