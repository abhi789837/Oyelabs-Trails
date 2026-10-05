import { z } from "zod";

import { intentSkillIds, promisedIntents, type Intent } from "./intents";
import { setupSchema, type Slider } from "./setup";
import { isSoftSkillId } from "./softSkills";

/**
 * v4.4 Phase 6: the onboarding summary card's preview, in plain words.
 *
 * Suggest reads the description (`POST /api/admin/onboard/suggest`); the preview
 * (`POST /api/admin/onboard/preview`) then works out, from the suggested setup and with the same
 * code the real test and path use, what the test will check, what comes first after it, and which
 * skills have no course yet. The client calls it one step at a time so its ticks are real.
 */

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

/**
 * `checks`: which skills the 25 questions cover (the real mix planner). `test`: the kind of each
 * question and the time (the real question planner, rules only). `path`: the learning order and
 * the course library. Omitted: all three at once (the priority drop-down's re-run).
 */
export const PREVIEW_STEPS = ["checks", "test", "path"] as const;
export type PreviewStep = (typeof PREVIEW_STEPS)[number];

export const onboardPreviewRequestSchema = setupSchema.extend({
  step: z.enum(PREVIEW_STEPS).optional(),
});
export type OnboardPreviewRequest = z.input<typeof onboardPreviewRequestSchema>;

export interface OnboardPreview {
  /** Plain bullets: what the test will check. */
  testChecks: string[];
  /** About how long the test takes, in minutes (only from the `test` step on). */
  minutes?: number;
  /** Plain path preview: "Frontend gaps", "Backend basics", ... in order. */
  firstSteps: string[];
  /** Names of skills on the path that no course covers yet; Oyelearn will create them. */
  newCourses: string[];
  /** For "Show details": questions per skill, in asking order (from the `test` step on). */
  questions?: { skillId: string; skillName: string; count: number; spoken: number }[];
}

/** The four ticked steps the admin sees while Suggest and the preview run. */
export const SUGGEST_STEP_LABELS = ["Reading your description", "Choosing what to check in the test", "Writing a 30-minute test", "Planning the first weeks"] as const;

// ---------------------------------------------------------------------------
// The priority drop-down
// ---------------------------------------------------------------------------

export const PRIORITY_CHOICES = ["most", "important", "nice"] as const;
export type PriorityChoice = (typeof PRIORITY_CHOICES)[number];

export const PRIORITY_CHOICE_LABELS: Record<PriorityChoice, string> = {
  most: "Most important",
  important: "Important",
  nice: "Nice to have",
};

/**
 * Choice to the 1-5 priority. "Important" is 3, not 4: the test planner puts 4 and 5 together in
 * its main group, so a 4 would make "Important" and "Most important" plan the same test. With 3,
 * what the admin picks is what the test and the path do.
 */
export const PRIORITY_CHOICE_SLIDER: Record<PriorityChoice, Slider> = { most: 5, important: 3, nice: 2 };

/** The choice a 1-5 priority shows as: 4-5 most important, 3 important, 1-2 nice to have. */
export function choiceForSlider(slider: number): PriorityChoice {
  if (slider >= 4) return "most";
  if (slider === 3) return "important";
  return "nice";
}

// ---------------------------------------------------------------------------
// Plain wording
// ---------------------------------------------------------------------------

export interface PreviewSkill {
  name: string;
  area: string;
  trackIds: readonly string[];
}

const lower = (text: string) => (text ? `${text.charAt(0).toLowerCase()}${text.slice(1)}` : text);
const upper = (text: string) => (text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : text);

/** "a, b and c". */
export function listWords(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function mostCommon(values: readonly string[]): string | null {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

/** The skill's main area in plain words ("Backend", "Data & databases"). */
function areaOf(skill: PreviewSkill | undefined): string {
  return skill?.area || "Other";
}

/** Which promised intent each skill belongs to (the first one listing it). */
function ownerOf(intents: readonly Intent[], coreSkillIds: readonly string[]): (skillId: string) => Intent | null {
  const promised = promisedIntents(intents).filter((i) => i.type !== "constraint");
  return (skillId) => promised.find((i) => intentSkillIds(i, coreSkillIds).includes(skillId)) ?? null;
}

/** Soft skills in one plain phrase, for the path ("Speaking & writing at work"). */
function softPathLabel(skillIds: readonly string[], skills: ReadonlyMap<string, PreviewSkill>): string {
  const areas = new Set(skillIds.map((id) => skills.get(id)?.area));
  if (areas.has("Speaking") || areas.has("Writing")) return "Speaking & writing at work";
  if (areas.has("Working with people")) return "Working with people";
  return "Owning your work";
}

export interface ChecksInput {
  /** One entry per planned question, in asking order. `subtype` is known from the `test` step on. */
  questions: readonly { skillId: string; subtype?: string }[];
  skills: ReadonlyMap<string, PreviewSkill>;
  intents: readonly Intent[];
  coreSkillIds: readonly string[];
  /** The current role's track name ("Frontend"), for "Frontend basics used every day". */
  trackName: string | null;
}

/**
 * What the test will check, one plain bullet per thing the admin asked for (in the order they
 * said it), then anything else the test plan added. Spoken and written soft-skill questions are
 * named ("Spoken English (2 short recordings) and work emails").
 */
export function testChecksFrom(input: ChecksInput): string[] {
  const owner = ownerOf(input.intents, input.coreSkillIds);
  const byIntent = new Map<string, { skillId: string; subtype?: string }[]>();
  const rest: { skillId: string; subtype?: string }[] = [];
  const core = new Set(input.coreSkillIds);
  for (const q of input.questions) {
    const intent = owner(q.skillId);
    if (intent) byIntent.set(intent.id, [...(byIntent.get(intent.id) ?? []), q]);
    else rest.push(q);
  }
  const lines: string[] = [];
  const basics = input.trackName ? `${input.trackName} basics used every day` : "The basics of their work";
  for (const intent of promisedIntents(input.intents)) {
    const qs = byIntent.get(intent.id);
    if (!qs || qs.length === 0) continue;
    const ids = qs.map((q) => q.skillId);
    if (intent.type === "current_role") lines.push(basics);
    else if (ids.every(isSoftSkillId)) lines.push(softChecks(qs));
    else if (intent.type === "move_role") {
      const area = mostCommon(ids.map((id) => areaOf(input.skills.get(id))));
      lines.push(area ? `The first steps of ${lower(area)} work` : upper(intent.statement));
    } else lines.push(upper(intent.statement.replace(/\.$/, "")));
  }
  // Questions no intent asked for: the role's basics, then what the new skills build on.
  if (rest.some((q) => core.has(q.skillId)) && !lines.includes(basics)) lines.push(basics);
  const others = [...new Set(rest.filter((q) => !core.has(q.skillId)).map((q) => q.skillId))];
  const soft = others.filter(isSoftSkillId);
  const hard = others.filter((id) => !isSoftSkillId(id));
  if (hard.length > 0) {
    const names = hard.map((id) => input.skills.get(id)?.name ?? id);
    lines.push(names.length <= 3 ? upper(listWords(names)) : `${upper(listWords(names.slice(0, 3)))} and ${names.length - 3} more`);
  }
  if (soft.length > 0) lines.push(softChecks(rest.filter((q) => (soft as string[]).includes(q.skillId))));
  return [...new Set(lines)];
}

function softChecks(qs: readonly { skillId: string; subtype?: string }[]): string {
  const known = qs.some((q) => q.subtype);
  if (!known) return "Speaking and writing at work";
  const speak = qs.filter((q) => q.subtype === "speak").length;
  const write = qs.filter((q) => q.subtype === "write").length;
  const other = qs.filter((q) => q.subtype !== "speak" && q.subtype !== "write").length;
  const parts: string[] = [];
  if (speak > 0) {
    const label = qs.some((q) => q.subtype === "speak" && q.skillId === "ss-spoken-english") ? "Spoken English" : "Speaking at work";
    parts.push(`${label} (${speak} short recording${speak === 1 ? "" : "s"})`);
  }
  if (write > 0) parts.push(parts.length ? "work emails" : "Work emails");
  if (other > 0) parts.push(parts.length ? "how they handle everyday team situations" : "How they handle everyday team situations");
  return listWords(parts);
}

export interface FirstStepsInput {
  /** The path's skills in order (the real path planner, before any test result). */
  pathSkillIds: readonly string[];
  skills: ReadonlyMap<string, PreviewSkill>;
  intents: readonly Intent[];
  coreSkillIds: readonly string[];
  trackId: string | null;
  trackName: string | null;
  /** At most this many steps are named; more become "…". */
  max?: number;
}

/**
 * The first weeks in a few plain steps. The test decides the gaps in the person's own role, so they
 * come first ("Frontend gaps"); then each thing the admin asked for, named by what it is, in path order.
 */
export function firstStepsFrom(input: FirstStepsInput): string[] {
  const max = input.max ?? 4;
  const owner = ownerOf(input.intents, input.coreSkillIds);
  const steps: string[] = [];
  if (input.trackName && input.coreSkillIds.length > 0) steps.push(`${input.trackName} gaps`);
  const add = (label: string) => {
    if (!steps.includes(label)) steps.push(label);
  };
  const intentLabel = new Map<string, string>();
  input.pathSkillIds.forEach((id, index) => {
    // A skill nobody asked for is on the path because a later one builds on it: it belongs there.
    const intent = owner(id) ?? (isSoftSkillId(id) || (input.trackId && input.skills.get(id)?.trackIds.includes(input.trackId)) ? null : input.pathSkillIds.slice(index + 1).map(owner).find((o) => o) ?? null);
    const skill = input.skills.get(id);
    if (intent && intent.type === "current_role") {
      if (input.trackName) add(`${input.trackName} gaps`);
      return;
    }
    if (intent) {
      let label = intentLabel.get(intent.id);
      if (!label) {
        const ids = input.pathSkillIds.filter((s) => owner(s)?.id === intent.id);
        if (ids.every(isSoftSkillId)) label = softPathLabel(ids, input.skills);
        else if (intent.type === "move_role") label = `${mostCommon(ids.filter((s) => !isSoftSkillId(s)).map((s) => areaOf(input.skills.get(s)))) ?? "New role"} basics`;
        else label = upper(intent.statement.replace(/\.$/, ""));
        intentLabel.set(intent.id, label);
      }
      add(label);
      return;
    }
    if (isSoftSkillId(id)) add(softPathLabel([id], input.skills));
    else if (input.trackId && skill?.trackIds.includes(input.trackId)) add(input.trackName ? `${input.trackName} gaps` : "Gaps in their own work");
    else add(`${areaOf(skill)} basics`);
  });
  return steps.length > max ? [...steps.slice(0, max), "…"] : steps;
}
