import { describe, expect, it } from "vitest";

import type { GlossaryTerm } from "@shared/handbook";
import { EMPTY_FILTER, filterTerms, groupByLetter } from "./glossaryFilter";

const t = (id: string, name: string, extra: Partial<GlossaryTerm> = {}): GlossaryTerm => ({
  id,
  name,
  aka: [],
  category: "scope",
  projectTypes: ["custom"],
  definition: `${name} definition`,
  oyelabsMeaning: "m",
  clientSentence: "c",
  status: "to-confirm",
  ...extra,
});

const TERMS = [
  t("change-request", "Change request", { aka: ["CR"] }),
  t("scope-creep", "Scope creep", { definition: "Unapproved growth; each piece should have been a CR." }),
  t("sow", "SOW", { category: "commercial", projectTypes: ["custom", "whitelabel"] }),
  t("brand-kit", "Brand kit", { category: "whitelabel", projectTypes: ["whitelabel"] }),
  t("p1-p4", "P1–P4", { category: "quality" }),
];

describe("glossary filter", () => {
  it("searches name, aka and definition, aka and name matches first", () => {
    expect(filterTerms(TERMS, { ...EMPTY_FILTER, query: "cr" }).map((x) => x.id)).toEqual(["change-request", "scope-creep"]);
  });

  it("filters by category and project type", () => {
    expect(filterTerms(TERMS, { ...EMPTY_FILTER, categories: ["commercial", "whitelabel"] }).map((x) => x.id)).toEqual(["sow", "brand-kit"]);
    expect(filterTerms(TERMS, { ...EMPTY_FILTER, projectType: "whitelabel" }).map((x) => x.id)).toEqual(["sow", "brand-kit"]);
  });

  it("groups A–Z with symbols and digits last", () => {
    const groups = groupByLetter([...TERMS, t("10x", "10x rule")]);
    expect(groups.map((g) => g.letter)).toEqual(["B", "C", "P", "S", "#"]);
    expect(groups.find((g) => g.letter === "S")?.terms.map((x) => x.id)).toEqual(["scope-creep", "sow"]);
  });
});
