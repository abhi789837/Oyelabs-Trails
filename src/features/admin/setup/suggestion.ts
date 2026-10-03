import type { OnboardSuggestion } from "@shared/goals";
import { levelFromExperience, type Slider } from "@shared/setup";

import { addSuggestedGoal, type GoalRow } from "./goals";
import { initialSetupState, withGoals, type SetupState } from "./helpers";

export { usernameFrom } from "@shared/bulkOnboard";

/** The setup a Suggest answer describes, as the Setup form's state (quick and bulk onboarding). */
export function stateFromSuggestion(suggestion: OnboardSuggestion, description: string, fallbackDepartment: string): SetupState {
  const base = initialSetupState(null, suggestion.departmentId || fallbackDepartment);
  const level = (suggestion.level ?? (suggestion.experienceBand ? levelFromExperience(suggestion.experienceBand) : null)) as Slider | null;
  const rows = suggestion.goals.reduce<GoalRow[]>((acc, g) => addSuggestedGoal(acc, g), []);
  return withGoals(
    {
      ...base,
      trackId: suggestion.trackId,
      stackIds: suggestion.stackIds,
      experienceBand: suggestion.experienceBand,
      level,
      levelTouched: level !== null,
      hoursPerWeek: suggestion.hoursPerWeek,
      description,
    },
    rows,
  );
}
