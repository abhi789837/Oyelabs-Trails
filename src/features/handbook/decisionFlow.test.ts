import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { classify, nextQuestion, OUTCOMES, type Classification, type DecisionAnswers } from "@shared/decision";
import { LEGAL_NOTE, type HandbookTemplate, type Rule } from "@shared/handbook";
import { billingFor, ResultCard } from "./DecisionTool";
import { answer, back, routeOf, routeText } from "./decisionFlow";
import { resetGlossary } from "./useGlossary";

afterEach(() => resetGlossary());

/** Answers the tool's questions in the order it asks them, as a learner clicking through would. */
function walk(choices: Record<string, string>): DecisionAnswers {
  let answers: DecisionAnswers = {};
  for (let q = nextQuestion(answers); q; q = nextQuestion(answers)) {
    const value = choices[q];
    if (!value) throw new Error(`no choice for ${q}`);
    answers = answer(answers, q, value);
  }
  return answers;
}

const CASES: { outcome: Classification; choices: Record<string, string>; route: string }[] = [
  {
    outcome: "bug",
    choices: { worksAsSpecified: "no", inScope: "yes", warranty: "not-live" },
    route: "Works as specified? No → In scope? Yes → Warranty? Not live yet",
  },
  { outcome: "bug-warranty", choices: { worksAsSpecified: "no", inScope: "yes", warranty: "yes" }, route: "Works as specified? No → In scope? Yes → Warranty? Yes" },
  { outcome: "bug-support", choices: { worksAsSpecified: "no", inScope: "yes", warranty: "no" }, route: "Works as specified? No → In scope? Yes → Warranty? No" },
  {
    outcome: "change-request",
    choices: { worksAsSpecified: "yes", changeKind: "change" },
    route: "Works as specified? Yes → Change or improve? Changes agreed behaviour",
  },
  { outcome: "enhancement", choices: { worksAsSpecified: "yes", changeKind: "improve" }, route: "Works as specified? Yes → Change or improve? Improves it" },
  {
    outcome: "new-feature",
    choices: { worksAsSpecified: "no", inScope: "no", changeKind: "neither", brandNew: "yes" },
    route: "Works as specified? No → In scope? No → Change or improve? Neither → Brand new? Yes",
  },
  {
    outcome: "clarification",
    choices: { worksAsSpecified: "yes", changeKind: "neither", brandNew: "no" },
    route: "Works as specified? Yes → Change or improve? Neither → Brand new? No",
  },
];

describe("decision tool step flow", () => {
  it.each(CASES)("reaches $outcome with a visible route", ({ outcome, choices, route }) => {
    const answers = walk(choices);
    expect(classify(answers)?.classification).toBe(outcome);
    expect(routeText(answers)).toBe(route);
  });

  it("covers all seven outcomes", () => {
    expect(new Set(CASES.map((c) => c.outcome)).size).toBe(Object.keys(OUTCOMES).length);
  });

  it("Back undoes the last answer only", () => {
    const answers = walk({ worksAsSpecified: "no", inScope: "yes", warranty: "yes" });
    const once = back(answers);
    expect(once).toEqual({ worksAsSpecified: "no", inScope: "yes" });
    expect(nextQuestion(once)).toBe("warranty");
    expect(back(back(once))).toEqual({});
    expect(back({})).toEqual({});
  });

  it("changing an earlier answer drops the answers after it", () => {
    const answers = walk({ worksAsSpecified: "no", inScope: "yes", warranty: "yes" });
    const changed = answer(answers, "worksAsSpecified", "yes");
    expect(changed).toEqual({ worksAsSpecified: "yes" });
    expect(nextQuestion(changed)).toBe("changeKind");
    expect(classify(changed)).toBeNull();
  });

  it("starts with an empty route", () => {
    expect(routeOf({})).toEqual([]);
  });
});

const rule = (id: string, status: Rule["status"]): Rule => ({
  id,
  name: id,
  category: "scope",
  projectTypes: ["custom"],
  statement: `OYELABS RULE for ${id}`,
  terms: [],
  sources: [],
  status,
  contractual: true,
});

describe("billing line", () => {
  it("uses the rule statement only when the rule is confirmed", () => {
    const o = OUTCOMES["change-request"];
    expect(billingFor(o, rule(o.billingRuleId, "confirmed"))).toEqual({ label: "Oyelabs rule", text: `OYELABS RULE for ${o.billingRuleId}`, confirmed: true });
    expect(billingFor(o, rule(o.billingRuleId, "to-confirm")).label).toBe("Typical — Oyelabs to confirm");
    expect(billingFor(o, undefined).text).toBe(o.typicalBilling);
  });
});

describe("result card", () => {
  const template: HandbookTemplate = {
    id: "cr-form",
    name: "Change request form",
    purpose: "p",
    format: "docx",
    stageIds: [],
    sections: ["Scope"],
    example: [],
    status: "to-confirm",
  };
  const render = (classification: Classification, rules: Map<string, Rule>) =>
    renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(ResultCard, { outcome: OUTCOMES[classification], initialRules: rules, initialTemplates: new Map([["cr-form", template]]) })),
    );

  it.each(Object.keys(OUTCOMES) as Classification[])("renders %s with its next step and the legal note", (classification) => {
    const outcome = OUTCOMES[classification];
    const html = render(classification, new Map());
    expect(html).toContain(`data-classification="${classification}"`);
    const esc = (t: string) => t.replace(/'/g, "&#x27;");
    expect(html).toContain(esc(outcome.label));
    expect(html).toContain(esc(outcome.nextStep));
    expect(html).toContain("Typical — Oyelabs to confirm");
    expect(html).toContain(LEGAL_NOTE);
    if (outcome.templateId) {
      expect(html).toContain(`/api/handbook/templates/${outcome.templateId}/download?variant=blank`);
      expect(html).toContain(`/api/handbook/templates/${outcome.templateId}/download?variant=filled`);
    } else {
      expect(html).not.toContain("/download?");
    }
  });

  it("shows the Oyelabs rule once it is confirmed, and the template name", () => {
    const id = OUTCOMES["change-request"].billingRuleId;
    const html = render("change-request", new Map([[id, rule(id, "confirmed")]]));
    expect(html).toContain("Oyelabs rule");
    expect(html).toContain(`OYELABS RULE for ${id}`);
    expect(html).not.toContain("Typical — Oyelabs to confirm");
    expect(html).toContain("Change request form");
  });
});
