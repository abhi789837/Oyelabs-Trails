import { catalogFromPrompt, rulesInterpret, rulesIntents, rulesProfile } from "../../goals/rules";

/**
 * v4.3/v4.4 mock answers for quick onboarding's Suggest and the free-text goal reading.
 *
 * Deterministic and description-aware: they read the catalog (and skill groups) out of the cached
 * system prompt and run the same rules the fallback uses, then answer in the model's shape. To
 * exercise the server's checks on every test run, Suggest's answer also carries one skill id that
 * does not exist and one intent whose phrase is not a quote of the description (both are dropped
 * by code). For the v4.4 reference description the kept answer is exactly its three intents.
 */

export const MOCK_UNKNOWN_SKILL = "mock-unknown-skill";
/** A quote that is never in a description: the grounding check must drop it. */
export const MOCK_UNGROUNDED_PHRASE = "mock phrase that is not in the description";

export function fixtureOnboardSuggest(system: string, userJson: string) {
  const catalog = catalogFromPrompt(system);
  let description = "";
  try {
    description = String((JSON.parse(userJson) as { description?: unknown }).description ?? "");
  } catch {
    description = userJson;
  }
  const profile = catalog ? rulesProfile(catalog, description) : null;
  const read = catalog ? rulesIntents(catalog, description) : null;
  const intents = (read?.intents ?? []).map((i) => ({
    phrase: i.phrase,
    type: i.type,
    statement: i.statement,
    bundleId: i.bundleId ?? null,
    // A bundle intent names the group only (the server expands it); others list their skills.
    skillIds: i.bundleId ? [] : i.type === "current_role" || i.type === "constraint" ? [] : [...i.skillIds, MOCK_UNKNOWN_SKILL].slice(0, 12),
    caseId: i.caseId ?? null,
    targetLevel: i.targetLevel,
    slider: i.slider,
    trackId: i.trackId ?? null,
    years: i.years ?? null,
    hoursPerWeek: i.constraint?.hoursPerWeek ?? null,
    deadlineWeeks: i.constraint?.deadlineWeeks ?? null,
  }));
  const has = (type: string) => (intents.some((i) => i.type === type) ? intents.filter((i) => i.type === type).map((i) => i.phrase).join("; ").slice(0, 200) : "none");
  return {
    checklist: { current_role: has("current_role"), role_move: has("move_role"), skill_areas: has("improve_area"), cases: has("case"), constraints: has("constraint") },
    intents: [
      ...intents,
      {
        phrase: MOCK_UNGROUNDED_PHRASE,
        type: "improve_area" as const,
        statement: "Something the description never said",
        bundleId: null,
        skillIds: [MOCK_UNKNOWN_SKILL],
        caseId: null,
        targetLevel: 3,
        slider: 3,
        trackId: null,
        years: null,
        hoursPerWeek: null,
        deadlineWeeks: null,
      },
    ],
    trackId: profile?.trackId ?? null,
    stackIds: profile?.stackIds ?? [],
    experienceBand: profile?.experienceBand ?? null,
    level: profile?.level ?? null,
    hoursPerWeek: profile?.hoursPerWeek ?? null,
  };
}

export function fixtureGoalInterpret(system: string, userJson: string) {
  const catalog = catalogFromPrompt(system);
  let text = "";
  try {
    text = String((JSON.parse(userJson) as { goal?: unknown }).goal ?? "");
  } catch {
    text = userJson;
  }
  const read = catalog ? rulesInterpret(catalog, text) : null;
  if (!read) return { outcome: `Can ${text || "do it"}.`.slice(0, 300), skillIds: [MOCK_UNKNOWN_SKILL], targetLevel: 3, caseId: null };
  return { ...read, skillIds: [...read.skillIds, MOCK_UNKNOWN_SKILL].slice(0, 6) };
}
