import type { Catalog } from "@shared/catalog";
import { PRIORITY_CHOICE_SLIDER, type PriorityChoice } from "@shared/onboardPreview";
import { EXPERIENCE_LABELS, type Slider } from "@shared/setup";

import { sortedGoals } from "./goals";
import { toSaveRequest, withGoals, type SetupState } from "./helpers";

/**
 * v4.4 Phase 6: the pure parts of the onboarding summary card ("Here's the plan for Rahul"):
 * the title, the "What they do now" line, the numbered "What you want" list and its priority
 * drop-down. Kept out of the component so they are tested without a DOM.
 */

/** "Here's the plan for Rahul": the first name as typed; never a guessed pronoun. */
export function planTitle(displayName: string): string {
  const first = displayName.trim().split(/\s+/)[0] ?? "";
  return first ? `Here's the plan for ${first}` : "Here's the plan";
}

/** "Frontend engineer · about 1 year" from the current role (or the setup's track and experience). */
export function currentRoleLine(state: SetupState, catalog: Pick<Catalog, "tracks" | "departments">): string | null {
  const role = state.intents?.find((i) => i.type === "current_role" && i.status !== "left_out");
  const trackId = role?.trackId ?? state.trackId;
  const track = catalog.tracks.find((t) => t.id === trackId);
  const department = catalog.departments.find((d) => d.id === state.departmentId);
  const what = track ? (department?.assessmentFormat === "coding" && !/\b(engineer|developer|dev)\b/i.test(track.name) ? `${track.name} engineer` : track.name) : null;
  const years = role?.years;
  const how =
    years != null
      ? years < 1
        ? "less than a year"
        : `about ${Number.isInteger(years) ? years : years.toFixed(1)} year${years === 1 ? "" : "s"}`
      : state.experienceBand
        ? EXPERIENCE_LABELS[state.experienceBand].toLowerCase()
        : null;
  if (!what && !how) return null;
  return [what, how].filter(Boolean).join(" · ");
}

export interface WantedItem {
  /** The intent id, or the goal row's key when the goal has no intent. */
  key: string;
  statement: string;
  slider: number;
  /** The goal rows this line stands for. */
  goalKeys: string[];
}

/**
 * "What you want": one line per thing the admin asked for (a role move, an area, a real task), the
 * most important first. Goals the description did not produce (added by hand) are listed too.
 */
export function wantedItems(state: SetupState): WantedItem[] {
  const goals = sortedGoals(state.goals);
  const items: (WantedItem & { order: number })[] = [];
  const used = new Set<string>();
  (state.intents ?? []).forEach((intent, order) => {
    if (intent.status === "left_out" || !["move_role", "improve_area", "case"].includes(intent.type)) return;
    const rows = goals.filter((g) => g.intentId === intent.id);
    rows.forEach((r) => used.add(r.key));
    const slider = rows.length ? Math.max(...rows.map((r) => r.slider)) : intent.slider;
    items.push({ key: intent.id, statement: intent.statement.replace(/\.$/, ""), slider, goalKeys: rows.map((r) => r.key), order });
  });
  goals
    .filter((g) => !used.has(g.key) && g.status !== "achieved")
    .forEach((g, i) => items.push({ key: g.key, statement: (g.outcome || g.originalText).replace(/\.$/, ""), slider: g.slider, goalKeys: [g.key], order: 100 + i }));
  return items.sort((a, b) => b.slider - a.slider || a.order - b.order).map(({ order: _order, ...item }) => item);
}

/** The drop-down changed: the line's goals (and its intent) take the choice's priority. */
export function setWantedPriority(state: SetupState, item: Pick<WantedItem, "key" | "goalKeys">, choice: PriorityChoice): SetupState {
  const slider = PRIORITY_CHOICE_SLIDER[choice] as Slider;
  const keys = new Set(item.goalKeys);
  const goals = state.goals.map((g) => (keys.has(g.key) ? { ...g, slider } : g));
  const intents = state.intents?.map((i) => (i.id === item.key ? { ...i, slider } : i));
  return withGoals({ ...state, intents }, goals);
}

/** The preview request for a setup: what Save would send, minus the account and the assign flag. */
export function previewRequest(state: SetupState) {
  const { assign: _assign, ...rest } = toSaveRequest(state, false);
  return rest;
}

/** A stable key for the preview, so it re-runs only when what it reads changed. */
export function previewKey(state: SetupState): string {
  return JSON.stringify(previewRequest(state));
}
