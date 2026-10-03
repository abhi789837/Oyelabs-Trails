import { catalogFromPrompt, rulesInterpret, rulesProfile } from "../../goals/rules";

/**
 * v4.3 mock answers for quick onboarding's Suggest and the free-text goal reading.
 *
 * Deterministic and description-aware: they read the catalog out of the (cached) system prompt and
 * run the same rules the fallback uses, then answer in the model's shape. Each answer also names one
 * skill id that does not exist, so the server's catalog check is exercised on every test run.
 */

export const MOCK_UNKNOWN_SKILL = "mock-unknown-skill";

export function fixtureOnboardSuggest(system: string, userJson: string) {
  const catalog = catalogFromPrompt(system);
  let description = "";
  try {
    description = String((JSON.parse(userJson) as { description?: unknown }).description ?? "");
  } catch {
    description = userJson;
  }
  const profile = catalog ? rulesProfile(catalog, description) : null;
  return {
    trackId: profile?.trackId ?? null,
    stackIds: profile?.stackIds ?? [],
    experienceBand: profile?.experienceBand ?? null,
    level: profile?.level ?? null,
    hoursPerWeek: profile?.hoursPerWeek ?? null,
    goals: (profile?.goals ?? []).slice(0, 7).map((g) => ({
      caseId: g.caseId,
      skillIds: g.caseId ? [] : [...g.skillIds, MOCK_UNKNOWN_SKILL].slice(0, 6),
      outcome: g.outcome,
      targetLevel: g.targetLevel,
      slider: g.slider,
    })),
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
