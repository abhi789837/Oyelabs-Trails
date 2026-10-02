import { describe, expect, test } from "vitest";

import { classify, nextQuestion, OUTCOMES, pathOf, type Classification, type DecisionAnswers } from "./decision";

/**
 * Sample client requests, classified with **typical industry rules** (no Oyelabs process material
 * was provided — see docs/v4.2/DECISIONS.md D1). Each row: the request as a client would say it,
 * the facts a PM would establish, and the expected classification.
 */
const TABLE: { request: string; answers: DecisionAnswers; expected: Classification }[] = [
  // Bugs during delivery: specified, not working, not live yet.
  { request: "The signup button does nothing on staging.", answers: { worksAsSpecified: "no", inScope: "yes", warranty: "not-live" }, expected: "bug" },
  { request: "UAT: the invoice total ignores the discount rule in the acceptance criteria.", answers: { worksAsSpecified: "no", inScope: "yes", warranty: "not-live" }, expected: "bug" },
  { request: "The Arabic layout is not right-to-left, although RTL was in the SOW.", answers: { worksAsSpecified: "no", inScope: "yes", warranty: "not-live" }, expected: "bug" },
  { request: "Password reset emails never arrive in the UAT build.", answers: { worksAsSpecified: "no", inScope: "yes", warranty: "not-live" }, expected: "bug" },
  { request: "The rebranded app still shows the core product's logo on the splash screen.", answers: { worksAsSpecified: "no", inScope: "yes", warranty: "not-live" }, expected: "bug" },
  // Bugs under warranty: live, specified, inside the window.
  { request: "Two weeks after launch, Android users can't upload a profile photo.", answers: { worksAsSpecified: "no", inScope: "yes", warranty: "yes" }, expected: "bug-warranty" },
  { request: "Since go-live the order confirmation SMS has the wrong time zone.", answers: { worksAsSpecified: "no", inScope: "yes", warranty: "yes" }, expected: "bug-warranty" },
  { request: "Live site: the agreed CSV export drops the last row.", answers: { worksAsSpecified: "no", inScope: "yes", warranty: "yes" }, expected: "bug-warranty" },
  { request: "The white-label app crashes on iOS when the cart is empty, a week after release.", answers: { worksAsSpecified: "no", inScope: "yes", warranty: "yes" }, expected: "bug-warranty" },
  // Bugs after warranty: live, specified, past the window.
  { request: "Eight months after launch, the booking calendar double-books a slot.", answers: { worksAsSpecified: "no", inScope: "yes", warranty: "no" }, expected: "bug-support" },
  { request: "A year in, the agreed monthly report emails stopped sending.", answers: { worksAsSpecified: "no", inScope: "yes", warranty: "no" }, expected: "bug-support" },
  { request: "Long after handover, the specified search filter returns duplicates.", answers: { worksAsSpecified: "no", inScope: "yes", warranty: "no" }, expected: "bug-support" },
  // Change requests: works as agreed, client wants different agreed behaviour.
  { request: "Please change checkout from 3 steps to a single page.", answers: { worksAsSpecified: "yes", changeKind: "change" }, expected: "change-request" },
  { request: "We now want delivery fees calculated by distance, not a flat fee as agreed.", answers: { worksAsSpecified: "yes", changeKind: "change" }, expected: "change-request" },
  { request: "Move login from email OTP to password, which we signed off last month.", answers: { worksAsSpecified: "yes", changeKind: "change" }, expected: "change-request" },
  { request: "The approved design has the menu at the bottom; we want a side drawer now.", answers: { worksAsSpecified: "yes", changeKind: "change" }, expected: "change-request" },
  { request: "Refunds should need manager approval, unlike the flow in the PRD.", answers: { worksAsSpecified: "yes", changeKind: "change" }, expected: "change-request" },
  { request: "It's a bug that orders auto-cancel after 30 minutes (the agreed rule) — make it 2 hours.", answers: { worksAsSpecified: "yes", changeKind: "change" }, expected: "change-request" },
  // Enhancements: works as agreed, client wants it improved.
  { request: "Can the dashboard load faster? It's fine, just slow-ish with big accounts.", answers: { worksAsSpecified: "yes", changeKind: "improve" }, expected: "enhancement" },
  { request: "Add sorting by date to the existing orders table.", answers: { worksAsSpecified: "yes", changeKind: "improve" }, expected: "enhancement" },
  { request: "Make the existing PDF invoice look nicer with our logo in colour.", answers: { worksAsSpecified: "yes", changeKind: "improve" }, expected: "enhancement" },
  { request: "Remember the last-used filter on the product list.", answers: { worksAsSpecified: "yes", changeKind: "improve" }, expected: "enhancement" },
  { request: "Add a loading skeleton to the existing feed instead of a spinner.", answers: { worksAsSpecified: "yes", changeKind: "improve" }, expected: "enhancement" },
  // New features: something that does not exist and was never specified.
  { request: "We'd like a loyalty points programme.", answers: { worksAsSpecified: "yes", changeKind: "neither", brandNew: "yes" }, expected: "new-feature" },
  { request: "Add an Apple Watch app.", answers: { worksAsSpecified: "yes", changeKind: "neither", brandNew: "yes" }, expected: "new-feature" },
  { request: "Integrate with our warehouse ERP.", answers: { worksAsSpecified: "yes", changeKind: "neither", brandNew: "yes" }, expected: "new-feature" },
  { request: "The app doesn't support group bookings (never specified) — it's broken!", answers: { worksAsSpecified: "no", inScope: "no", changeKind: "neither", brandNew: "yes" }, expected: "new-feature" },
  { request: "The white-label app has no referral module; our reseller needs one.", answers: { worksAsSpecified: "yes", changeKind: "neither", brandNew: "yes" }, expected: "new-feature" },
  // Not specified, "not working" as the client expected: it's a change, not a bug.
  { request: "Prices should include VAT — it's wrong! (the SOW says ex-VAT)", answers: { worksAsSpecified: "no", inScope: "no", changeKind: "change" }, expected: "change-request" },
  { request: "Search should also match product descriptions; it only matches names, as specified.", answers: { worksAsSpecified: "no", inScope: "no", changeKind: "improve" }, expected: "enhancement" },
  // Clarifications.
  { request: "Why can't a driver accept two orders at once? (by design, agreed in discovery)", answers: { worksAsSpecified: "yes", changeKind: "neither", brandNew: "no" }, expected: "clarification" },
  { request: "Where do I change the app's opening hours? (already in the admin panel)", answers: { worksAsSpecified: "yes", changeKind: "neither", brandNew: "no" }, expected: "clarification" },
  { request: "Is the 5-minute OTP expiry a bug? (it's the agreed setting)", answers: { worksAsSpecified: "yes", changeKind: "neither", brandNew: "no" }, expected: "clarification" },
];

describe("the decision tool (typical rules)", () => {
  test("has at least 30 sample requests covering every outcome", () => {
    expect(TABLE.length).toBeGreaterThanOrEqual(30);
    expect(new Set(TABLE.map((r) => r.expected))).toEqual(new Set(Object.keys(OUTCOMES)));
  });

  test.each(TABLE)("$request → $expected", ({ answers, expected }) => {
    expect(classify(answers)?.classification).toBe(expected);
  });

  test("asks one question at a time and stops as soon as the outcome is decided", () => {
    expect(nextQuestion({})).toBe("worksAsSpecified");
    expect(nextQuestion({ worksAsSpecified: "no" })).toBe("inScope");
    expect(nextQuestion({ worksAsSpecified: "no", inScope: "yes" })).toBe("warranty");
    expect(nextQuestion({ worksAsSpecified: "no", inScope: "no" })).toBe("changeKind");
    expect(nextQuestion({ worksAsSpecified: "yes", changeKind: "change" })).toBeNull();
    expect(classify({ worksAsSpecified: "yes" })).toBeNull();
    expect(pathOf({ worksAsSpecified: "no", inScope: "yes", warranty: "yes", changeKind: "change" })).toEqual(["worksAsSpecified", "inScope", "warranty"]);
  });

  test("every outcome names its billing rule, a next step and typical wording", () => {
    for (const o of Object.values(OUTCOMES)) {
      expect(o.billingRuleId).toMatch(/^billing-/);
      expect(o.typicalBilling).toMatch(/^Typically/);
      expect(o.nextStep.length).toBeGreaterThan(20);
    }
  });
});
