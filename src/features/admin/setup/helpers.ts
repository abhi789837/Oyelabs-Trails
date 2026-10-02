import { matchSkillByText, searchSkills, trackBasics, type Catalog, type Skill } from "@shared/catalog";
import {
  DEFAULT_HOURS_PER_WEEK,
  DEFAULT_SLIDER,
  planAssessmentMix,
  sortPriorities,
  type AssessmentMix,
  type ExperienceBand,
  type LearnerSetup,
  type SaveSetupRequest,
  type SetupAdvanced,
  type Slider,
} from "@shared/setup";

/**
 * The Setup form's state and the pure rules over it, kept apart from the component so the sort,
 * the moves and the exclusivity between the two pickers are tested without a React tree.
 */

export interface PriorityRow {
  skillId: string;
  slider: Slider;
  /** Selection order. Ties between equal sliders keep it; a "move" swaps it with a neighbour. */
  position: number;
}

export interface SetupState {
  departmentId: string;
  trackId: string | null;
  stackIds: string[];
  experienceBand: ExperienceBand | null;
  level: Slider | null;
  /** True once the admin picked a level by hand; until then it follows experience. */
  levelTouched: boolean;
  priorities: PriorityRow[];
  skip: string[];
  hoursPerWeek: number | null;
  advanced: SetupAdvanced;
  /** v4.1: "About this person and what you want" — the profile's notes, which the AI reads. */
  description: string;
}

export const DEFAULT_ADVANCED: SetupAdvanced = { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false, personalisation: "balanced" };

export function initialSetupState(setup: LearnerSetup | null, fallbackDepartment: string): SetupState {
  if (!setup) {
    return {
      departmentId: fallbackDepartment,
      trackId: null,
      stackIds: [],
      experienceBand: null,
      level: null,
      levelTouched: false,
      priorities: [],
      skip: [],
      hoursPerWeek: DEFAULT_HOURS_PER_WEEK,
      advanced: DEFAULT_ADVANCED,
      description: "",
    };
  }
  return {
    departmentId: setup.departmentId,
    trackId: setup.trackId,
    stackIds: [...setup.stackIds],
    experienceBand: setup.experienceBand,
    level: setup.level,
    // A saved level is the admin's, even when it happens to equal the experience default.
    levelTouched: setup.level !== null,
    priorities: sortPriorities(setup.priorities).map((p, index) => ({ skillId: p.skillId, slider: p.slider, position: index })),
    skip: setup.skip.map((s) => s.skillId),
    hoursPerWeek: setup.hoursPerWeek,
    advanced: { ...DEFAULT_ADVANCED, ...setup.advanced },
    description: setup.description ?? "",
  };
}

/** The request body. Priorities go in display order, which the server's stable sort keeps. */
export function toSaveRequest(state: SetupState, assign: boolean): SaveSetupRequest {
  return {
    departmentId: state.departmentId,
    trackId: state.trackId,
    stackIds: state.stackIds,
    experienceBand: state.experienceBand,
    level: state.level,
    priorities: sortedRows(state.priorities).map((p) => ({ skillId: p.skillId, slider: p.slider })),
    skip: state.skip,
    hoursPerWeek: state.hoursPerWeek ?? DEFAULT_HOURS_PER_WEEK,
    advanced: state.advanced,
    description: state.description,
    assign,
  };
}

/**
 * Whether "How the AI understood this" has enough to read: a department plus a track or at least
 * one priority. Anything less and the plan is only the track basics, which says nothing.
 */
export function understandingReady(state: SetupState): boolean {
  return Boolean(state.departmentId) && (state.trackId !== null || state.priorities.length > 0);
}

/** The understand request: the form as it stands, with only what the AI reads. */
export function toUnderstandRequest(state: SetupState) {
  const r = toSaveRequest(state, false);
  return {
    departmentId: r.departmentId,
    trackId: r.trackId,
    stackIds: r.stackIds,
    experienceBand: r.experienceBand,
    level: r.level,
    priorities: r.priorities,
    skip: r.skip,
    description: state.description.trim(),
  };
}

/** A stable key for the understand request, so the panel refetches only when its input changed. */
export function understandingKey(state: SetupState): string {
  return JSON.stringify(toUnderstandRequest(state));
}

// ---------------------------------------------------------------------------
// Priority rows
// ---------------------------------------------------------------------------

/** Highest slider first, ties in selection order — `sortPriorities`, the order everything else uses. */
export function sortedRows(rows: readonly PriorityRow[]): PriorityRow[] {
  return sortPriorities(rows);
}

/** Selects a skill at `slider` (Medium by default). A no-op when it is already a priority. */
export function addPriority(rows: readonly PriorityRow[], skillId: string, slider: Slider = DEFAULT_SLIDER): PriorityRow[] {
  if (rows.some((row) => row.skillId === skillId)) return [...rows];
  const position = rows.reduce((max, row) => Math.max(max, row.position), -1) + 1;
  return [...rows, { skillId, slider, position }];
}

export function removePriority(rows: readonly PriorityRow[], skillId: string): PriorityRow[] {
  return rows.filter((row) => row.skillId !== skillId);
}

export function setSlider(rows: readonly PriorityRow[], skillId: string, slider: Slider): PriorityRow[] {
  return rows.map((row) => (row.skillId === skillId ? { ...row, slider } : row));
}

/**
 * The neighbour a row would swap with, or null. Moving only ever happens inside a tie: across
 * slider values the order is the slider's, and a "move" that silently changed a slider would be a
 * second way to set one.
 */
function neighbour(rows: readonly PriorityRow[], skillId: string, delta: -1 | 1): [PriorityRow, PriorityRow] | null {
  const sorted = sortedRows(rows);
  const index = sorted.findIndex((row) => row.skillId === skillId);
  const other = sorted[index + delta];
  if (index < 0 || !other || other.slider !== sorted[index].slider) return null;
  return [sorted[index], other];
}

export function canMove(rows: readonly PriorityRow[], skillId: string, delta: -1 | 1): boolean {
  return neighbour(rows, skillId, delta) !== null;
}

/** Swaps selection order with the tied neighbour above (-1) or below (+1). Unchanged when it can't. */
export function movePriority(rows: readonly PriorityRow[], skillId: string, delta: -1 | 1): PriorityRow[] {
  const pair = neighbour(rows, skillId, delta);
  if (!pair) return [...rows];
  const [self, other] = pair;
  return rows.map((row) =>
    row.skillId === self.skillId
      ? { ...row, position: other.position }
      : row.skillId === other.skillId
        ? { ...row, position: self.position }
        : row,
  );
}

/** A skill is a priority or skipped, never both: picking it in one list takes it out of the other. */
export function pickPriority(state: SetupState, skillId: string, slider: Slider = DEFAULT_SLIDER): SetupState {
  return { ...state, priorities: addPriority(state.priorities, skillId, slider), skip: state.skip.filter((id) => id !== skillId) };
}

export function pickSkip(state: SetupState, skillId: string): SetupState {
  return {
    ...state,
    priorities: removePriority(state.priorities, skillId),
    skip: state.skip.includes(skillId) ? state.skip : [...state.skip, skillId],
  };
}

// ---------------------------------------------------------------------------
// Department changes
// ---------------------------------------------------------------------------

/**
 * Switches department and drops every pick that does not belong to it. A PM skill left on an
 * engineer would be refused by the server anyway; clearing it here means the admin sees it go.
 */
export function changeDepartment(state: SetupState, catalog: Catalog, departmentId: string): SetupState {
  if (departmentId === state.departmentId) return state;
  const inDept = (id: string) => catalog.skills.some((s) => s.id === id && s.departmentId === departmentId);
  return {
    ...state,
    departmentId,
    trackId: catalog.tracks.some((t) => t.id === state.trackId && t.departmentId === departmentId) ? state.trackId : null,
    stackIds: state.stackIds.filter((id) => catalog.stacks.some((s) => s.id === id && s.departmentId === departmentId)),
    priorities: state.priorities.filter((p) => inDept(p.skillId)),
    skip: state.skip.filter(inDept),
  };
}

// ---------------------------------------------------------------------------
// The picker
// ---------------------------------------------------------------------------

/** Skills the picker may offer: this department's, active or pending. */
export function pickableSkills(catalog: Catalog | null, departmentId: string): Skill[] {
  return (catalog?.skills ?? []).filter(
    (s) => s.departmentId === departmentId && (s.status === "active" || s.status === "pending"),
  );
}

export interface PickerGroup {
  key: string;
  heading: string;
  skills: Skill[];
}

/** How many rows the picker renders at most. cmdk scores every mounted row on every keystroke. */
export const PICKER_LIMIT = 150;

/**
 * The picker's groups. Unfiltered: "Suggested for <track>" first, then every skill by area.
 * Filtered: the ranked matches, grouped by area in rank order so the best group leads.
 */
export function pickerGroups(skills: readonly Skill[], query: string, track: { id: string; name: string } | null): PickerGroup[] {
  const ranked = searchSkills(skills, query).slice(0, PICKER_LIMIT);
  const groups: PickerGroup[] = [];
  if (!query.trim() && track) {
    const suggested = ranked.filter((s) => s.trackIds.includes(track.id));
    if (suggested.length > 0) groups.push({ key: "suggested", heading: `Suggested for ${track.name}`, skills: suggested });
  }
  const byArea = new Map<string, Skill[]>();
  for (const skill of ranked) {
    const area = skill.area || "General";
    const list = byArea.get(area);
    if (list) list.push(skill);
    else byArea.set(area, [skill]);
  }
  for (const [area, list] of byArea) groups.push({ key: `area:${area}`, heading: area, skills: list });
  return groups;
}

/** The catalog skill a `?add=` value points at: an id first, then an exact name or alias, then the best search hit. */
export function findSkillToAdd(skills: readonly Skill[], add: string): Skill | null {
  const value = add.trim();
  if (!value) return null;
  return skills.find((s) => s.id === value) ?? matchSkillByText(skills, value) ?? searchSkills(skills, value)[0] ?? null;
}

// ---------------------------------------------------------------------------
// The summary card
// ---------------------------------------------------------------------------

/** "≈ 3 h/day" for a five-day week, to the nearest half hour. */
export function hoursPerDayHint(hoursPerWeek: number | null): string | null {
  if (hoursPerWeek === null || !Number.isFinite(hoursPerWeek) || hoursPerWeek <= 0) return null;
  const perDay = Math.max(0.5, Math.round((hoursPerWeek / 5) * 2) / 2);
  return `≈ ${perDay} h/day`;
}

/** The assessment the current form state would produce, from the same function the server uses. */
export function previewMix(state: SetupState, catalog: Catalog | null): AssessmentMix {
  const names = new Map((catalog?.skills ?? []).map((s) => [s.id, s.name]));
  const priorities = sortedRows(state.priorities).map((p) => ({ skillId: p.skillId, skillName: names.get(p.skillId) ?? p.skillId, slider: p.slider }));
  const basics = catalog
    ? trackBasics(catalog, state.departmentId, state.trackId, state.stackIds).map((s) => ({ skillId: s.id, skillName: s.name, slider: 0 }))
    : [];
  return planAssessmentMix(priorities, basics);
}

/** The Critical/High picks the assessment is weighted towards, in order. */
export function focusNames(state: SetupState, catalog: Catalog | null): string[] {
  const names = new Map((catalog?.skills ?? []).map((s) => [s.id, s.name]));
  return sortedRows(state.priorities)
    .filter((p) => p.slider >= 4)
    .map((p) => names.get(p.skillId) ?? p.skillId);
}

/** "AWS, Docker, Kubernetes and 2 more". */
export function listNames(names: readonly string[], max = 3): string {
  if (names.length === 0) return "";
  if (names.length <= max) return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `${names.slice(0, max).join(", ")} and ${names.length - max} more`;
}

/** Whether two states would save the same thing. `levelTouched` is UI state, not data. */
export function sameSetup(a: SetupState, b: SetupState): boolean {
  return JSON.stringify(toSaveRequest(a, false)) === JSON.stringify(toSaveRequest(b, false));
}
