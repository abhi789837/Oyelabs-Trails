import { z } from "zod";

import { matchBundles } from "../../../shared/bundles";
import { isAreaDepartment, skillUsableBy, trackBasics, type Catalog } from "../../../shared/catalog";
import { asOutcome, goalInterpretationSchema, type GoalInput, type GoalInterpretResult, type OnboardSuggestion } from "../../../shared/goals";
import {
  coverageCheck,
  groundPhrase,
  INTENT_TYPES,
  intentsToGoals,
  LEAVE_OUT_LABEL,
  MAX_INTENT_SKILLS,
  normaliseDescription,
  phraseWords,
  wordOverlap,
  type Intent,
  type Unsure,
  type UnsureOption,
} from "../../../shared/intents";
import { DEFAULT_HOURS_PER_WEEK, experienceBandFromYears, experienceBandSchema, levelFromExperience } from "../../../shared/setup";
import type { AiService } from "../ai/service";
import { getCatalog } from "../catalog/repo";
import type { Db } from "../db";
import { badRequest } from "../lib/errors";
import { listBundles, usableBundleSkills } from "./bundles";
import { listUsableOutcomes } from "./outcomes";
import { bestCase, CATALOG_MARKER, progressionExtras, rulesInterpret, rulesProfile, type RulesCatalog } from "./rules";

/**
 * Quick onboarding's Suggest and the goal box's free-text reading (v4.3 Phase 1, v4.4 Phase 1).
 *
 * One Haiku call each. The system prompt is the instructions plus the department's catalog, skill
 * groups and case library as compact JSON: identical for every call in a department, so the
 * provider caches it and a Suggest pays mostly for the one-line description.
 *
 * v4.4: Suggest returns **intents**, each quoting the exact words it came from. Code then grounds
 * every quote (an intent whose phrase is not in the description is dropped), expands broad phrases
 * through the skill groups, checks every skill id (soft skills are usable by every department), and
 * runs `coverageCheck`: a phrase nothing covers is mapped to the closest catalog item, or becomes
 * an Unsure the admin must answer before Save. Nothing is dropped silently. Any AI failure falls
 * back to the rules, which produce intents the same way.
 */

export const SUGGEST_SYSTEM = `You set up a new employee of a software agency on a learning platform, from the
admin's one-line description of them. Use only ids from the catalog below (skills, tracks, stacks,
skill groups "bundles", cases).

Read the description into INTENTS. Go through this checklist and answer every line in "checklist"
(a few words, or "none"):
- current_role: who they are now (track, years of experience, stack).
- role_move: a role they should move into ("move to the full stack", "doing backend").
- skill_areas: skills or areas to get better at ("weak on Git", "improve the soft skills", "English").
- cases: concrete practical tasks they should be able to do ("resolve merge conflicts").
- constraints: hours a week or a deadline.

Return one intent for EVERY distinct thing the description says. Each intent:
- phrase: the EXACT words from the description it comes from, copied character for character (no
  paraphrase). Phrases that are not exact quotes are thrown away.
- type: current_role | move_role | improve_area | case | constraint.
- statement: plain English, e.g. "Become a full-stack developer", "Get better at soft skills",
  "Frontend, 1-2 years".
- bundleId: the skill group whose phrases match (prefer one over listing skills), else null.
- skillIds: catalog skill ids it needs (max 12; [] for current_role and constraint). Soft skills
  ("ss-*") can be used by every department.
- caseId: a library case for type "case", else null.
- targetLevel 1-5 (2 basics, 3 does it alone, 4 owns it, 5 could teach it).
- slider: 5 Critical (a stated weakness), 4 High (the main ask, a role move), 3 Important (also
  wanted, e.g. "also improve…"); 0 for current_role and constraint.
- trackId: current_role = their current track; move_role = the track they move to; else null.
- years: current_role years of experience, else null.
- hoursPerWeek / deadlineWeeks: constraint only, else null.
Never add an intent the description does not state. Never add a goal for something they are
already good at.

Also return: trackId (their CURRENT track, or the target track if no current role is stated),
stackIds (max 8), experienceBand "0" | "1-2" | "3-5" | "6+" or null, level 1-5 or null, hoursPerWeek
or null.

Example: "frontend engineer with 1 year of experience and also want him to move to the full stack and
also improve the soft skills" gives three intents: current_role "frontend engineer with 1 year of
experience"; move_role "move to the full stack" (the full-stack skill group, slider 4);
improve_area "improve the soft skills" (the soft-skills group, slider 3).`;

export const INTERPRET_SYSTEM = `An admin typed one goal for an employee of a software agency ("debug a Laravel
queue in production", "write a CR from a client email"). Read it into: outcome (one "Can ..." sentence
with an observable verb), skillIds (1-4 ids from the catalog below that the goal needs), targetLevel 1-5
(2 basics, 3 does it alone, 4 owns it in production, 5 could teach it) and caseId (the closest library
case if it is a good match, else null). Use only ids from the catalog. Return JSON only.`;

const aiIntentSchema = z.object({
  phrase: z.string().max(300),
  type: z.enum(INTENT_TYPES),
  statement: z.string().max(300),
  bundleId: z.string().max(80).nullable(),
  skillIds: z.array(z.string().max(80)).max(MAX_INTENT_SKILLS),
  caseId: z.string().max(80).nullable(),
  targetLevel: z.number().int().min(1).max(5),
  slider: z.number().int().min(0).max(5),
  trackId: z.string().max(64).nullable(),
  years: z.number().min(0).max(60).nullable(),
  hoursPerWeek: z.number().int().min(1).max(60).nullable(),
  deadlineWeeks: z.number().int().min(1).max(104).nullable(),
});
export type AiIntent = z.infer<typeof aiIntentSchema>;

export const onboardSuggestResponseSchema = z.object({
  checklist: z.object({
    current_role: z.string().max(200),
    role_move: z.string().max(200),
    skill_areas: z.string().max(200),
    cases: z.string().max(200),
    constraints: z.string().max(200),
  }),
  intents: z.array(aiIntentSchema).max(16),
  trackId: z.string().max(64).nullable(),
  stackIds: z.array(z.string().max(64)).max(8),
  experienceBand: experienceBandSchema.nullable(),
  level: z.number().int().min(1).max(5).nullable(),
  hoursPerWeek: z.number().int().min(1).max(60).nullable(),
});
export type OnboardSuggestResponse = z.infer<typeof onboardSuggestResponseSchema>;

/**
 * The department's catalog, skill groups and cases in the compact shape the rules and the prompt
 * share. Skills include the area departments' (soft skills), usable by every department.
 */
export function rulesCatalog(db: Db, departmentId: string): RulesCatalog {
  const catalog = getCatalog(db);
  const department = catalog.departments.find((d) => d.id === departmentId);
  if (!department) throw badRequest("Pick a department.", { departmentId: "Unknown department" });
  if (isAreaDepartment(department)) throw badRequest("Pick the department they work in.", { departmentId: `${department.name} is a skill area, not a department` });
  return {
    departmentId,
    tracks: catalog.tracks.filter((t) => t.departmentId === departmentId && !t.archived).map((t) => ({ id: t.id, name: t.name })),
    stacks: catalog.stacks.filter((s) => s.departmentId === departmentId && !s.archived).map((s) => ({ id: s.id, name: s.name, aliases: s.aliases })),
    skills: catalog.skills
      .filter((s) => s.status === "active" && skillUsableBy(s, departmentId, catalog.departments))
      .map((s) => ({
        id: s.id,
        ...(s.departmentId !== departmentId ? { departmentId: s.departmentId } : {}),
        name: s.name,
        area: s.area,
        aliases: s.aliases,
        defaultSlider: s.departmentId === departmentId ? s.defaultSlider : null,
        prerequisites: s.prerequisites,
        trackIds: s.trackIds,
        stackIds: s.stackIds,
        levelMin: s.levelMin,
      })),
    // The department's own cases, then the area departments' (soft-skills cases).
    outcomes: listUsableOutcomes(db, departmentId).map((o) => ({ id: o.id, title: o.title, statement: o.statement, level: o.level, skillIds: o.skillIds, aliases: o.aliases })),
    bundles: listBundles(db)
      .filter((b) => b.active && (!b.departmentId || b.departmentId === departmentId))
      .map((b) => ({ ...b, skillIds: usableBundleSkills(catalog, b, departmentId) }))
      .filter((b) => b.skillIds.length > 0),
  };
}

/**
 * The catalog block of the system prompt. Stable for a department (catalog order, no timestamps),
 * so it is the cached part of every call. Arrays, not objects, to keep it small.
 */
export function catalogPrompt(cat: RulesCatalog): string {
  const compact = {
    department: cat.departmentId,
    tracks: cat.tracks.map((t) => [t.id, t.name]),
    stacks: cat.stacks.map((s) => [s.id, s.name, s.aliases.slice(0, 4)]),
    skills: cat.skills.map((s) => [s.id, s.name, s.area, s.aliases.slice(0, 5), s.defaultSlider]),
    cases: cat.outcomes.map((o) => [o.id, o.title, o.level, o.skillIds, o.aliases.slice(0, 4)]),
    bundles: (cat.bundles ?? []).map((b) => [b.id, b.name, b.phrases, b.skillIds, b.fromTrackIds, b.targetLevel]),
  };
  return `${CATALOG_MARKER}\n${JSON.stringify(compact)}`;
}

// ---------------------------------------------------------------------------
// v4.4: candidates for a phrase (auto-map or Unsure options)
// ---------------------------------------------------------------------------

export interface PhraseCandidate {
  option: UnsureOption;
  /** The intent statement if this candidate is taken. */
  statement: string;
  /** 0..1: share of the phrase's words the candidate covers. */
  score: number;
  /** A bundle phrase, skill name or alias, or a strong case match found verbatim in the phrase. */
  exact: boolean;
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const padded = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim()} `;

/** The closest catalog items to a phrase: skill groups, skills (name, aliases, area) and cases. */
export function phraseCandidates(cat: RulesCatalog, phrase: string, currentTrackId: string | null): PhraseCandidate[] {
  const out: PhraseCandidate[] = [];
  const hay = padded(phrase);
  // An exact match scores by how much of the phrase it spans, so "Docker Compose" beats "compose".
  const span = (found: string) => Math.min(1, found.length / Math.max(1, hay.trim().length));
  const matched = matchBundles(cat.bundles ?? [], phrase, cat.departmentId, currentTrackId);
  for (const b of cat.bundles ?? []) {
    const hit = matched.some((m) => m.id === b.id) ? b.phrases.map((p) => padded(p).trim()).filter((p) => hay.includes(` ${p} `)).sort((x, y) => y.length - x.length)[0] : undefined;
    const exact = hit != null;
    const score = hit != null ? span(hit) : wordOverlap(phrase, [b.name, ...b.phrases].join(" "));
    if (score > 0) out.push({ option: { label: b.name, skillIds: b.skillIds, bundleId: b.id, targetLevel: b.targetLevel }, statement: `Get better at ${lowerFirst(b.name)}`, score, exact });
  }
  for (const s of cat.skills) {
    const names = [s.name, ...s.aliases].map((n) => padded(n).trim()).filter((n) => n.length >= 3 || /[+#]/.test(n));
    // A plural in the phrase still finds the singular name ("proposals" → the alias "proposal").
    const hit = names.filter((n) => hay.includes(` ${n} `) || (/[a-z]$/.test(n) && !n.endsWith("s") && hay.includes(` ${n}s `))).sort((x, y) => y.length - x.length)[0];
    const exact = hit != null;
    const score = hit != null ? span(hit) : wordOverlap(phrase, [s.name, ...s.aliases].join(" "));
    if (score > 0) out.push({ option: { label: s.name, skillIds: [s.id] }, statement: `Get better at ${s.name}`, score, exact });
  }
  const strongCase = bestCase(cat, phrase, 0.75);
  for (const o of cat.outcomes) {
    const exact = strongCase?.id === o.id;
    // Just under a verbatim skill name: a case is a narrower reading of the same words.
    const score = exact ? 0.95 : wordOverlap(phrase, [o.title, ...o.aliases].join(" "));
    if (score > 0) out.push({ option: { label: o.title, skillIds: o.skillIds, caseId: o.id, type: "case", targetLevel: o.level }, statement: o.statement, score, exact });
  }
  return out.sort((a, b) => Number(b.exact) - Number(a.exact) || b.score - a.score || (a.option.bundleId ? -1 : 0) - (b.option.bundleId ? -1 : 0));
}

/**
 * The admin's options for a phrase: the 2 best candidates, then "Leave it out". Strong matches
 * (a third of the words or more) come first; weaker near matches only fill the gap, so the admin
 * still gets 2–3 choices for a phrase the catalog barely knows.
 */
export function unsureFor(cat: RulesCatalog, phrase: string, currentTrackId: string | null, extra: UnsureOption[] = []): Unsure {
  const seen = new Set<string>();
  const options: UnsureOption[] = [];
  const candidates = phraseCandidates(cat, phrase, currentTrackId);
  const strong = candidates.filter((c) => c.score >= 0.34);
  const near = candidates.filter((c) => c.score < 0.34);
  for (const option of [...extra, ...strong.map((c) => c.option), ...near.map((c) => c.option)]) {
    const key = option.bundleId ?? option.caseId ?? option.skillIds.join("+");
    if (seen.has(key) || options.length >= 2) continue;
    seen.add(key);
    options.push(option);
  }
  options.push({ label: LEAVE_OUT_LABEL, skillIds: [], leaveOut: true });
  return { phrase, options };
}

/** An uncovered phrase mapped by code when one candidate is clearly it; else null. */
export function autoMap(cat: RulesCatalog, phrase: string, currentTrackId: string | null): Omit<Intent, "id"> | null {
  const [best, second] = phraseCandidates(cat, phrase, currentTrackId);
  if (!best) return null;
  // Clear = found verbatim (or every word found) and nothing else ties with it.
  const tie = second != null && second.exact === best.exact && second.score >= best.score;
  const clear = !tie && (best.exact || best.score >= 1);
  if (!clear) return null;
  const type = best.option.type ?? "improve_area";
  return {
    phrase,
    type,
    statement: best.statement,
    skillIds: best.option.skillIds.slice(0, MAX_INTENT_SKILLS),
    ...(best.option.bundleId ? { bundleId: best.option.bundleId } : {}),
    ...(best.option.caseId ? { caseId: best.option.caseId } : {}),
    targetLevel: best.option.targetLevel ?? 3,
    slider: 3,
    autoMapped: true,
    status: "mapped",
  };
}

// ---------------------------------------------------------------------------
// v4.4: checking intents (from the model or the rules) against the description and the catalog
// ---------------------------------------------------------------------------

export interface CheckedIntents {
  intents: Intent[];
  unsure: Unsure[];
  /** Quotes that were not in the description (dropped). */
  ungrounded: number;
}

type RawIntent = Omit<AiIntent, "bundleId" | "caseId" | "trackId" | "years" | "hoursPerWeek" | "deadlineWeeks"> & {
  bundleId?: string | null;
  caseId?: string | null;
  trackId?: string | null;
  years?: number | null;
  hoursPerWeek?: number | null;
  deadlineWeeks?: number | null;
  constraint?: { hoursPerWeek?: number; deadlineWeeks?: number };
  autoMapped?: boolean;
};

/**
 * Grounds, expands and validates intents, then runs the coverage check. Never drops silently: an
 * intent whose phrase is real but whose skills are all unknown becomes an Unsure, and every phrase
 * no intent covers is auto-mapped or becomes an Unsure.
 */
export function checkIntents(cat: RulesCatalog, catalog: Pick<Catalog, "skills" | "departments" | "tracks">, description: string, raw: readonly RawIntent[]): CheckedIntents {
  const d = normaliseDescription(description);
  const skills = new Map(cat.skills.map((s) => [s.id, s]));
  const trackIds = new Set(cat.tracks.map((t) => t.id));
  const cases = new Map(cat.outcomes.map((o) => [o.id, o]));
  const bundles = new Map((cat.bundles ?? []).map((b) => [b.id, b]));
  const usable = (id: string) => skills.has(id);
  const intents: Omit<Intent, "id">[] = [];
  const unsure: Unsure[] = [];
  let ungrounded = 0;

  const currentTrackId = raw.find((r) => r.type === "current_role" && r.trackId && trackIds.has(r.trackId))?.trackId ?? null;
  for (const r of raw) {
    const phrase = groundPhrase(d, r.phrase);
    if (!phrase) {
      ungrounded += 1;
      continue;
    }
    if (intents.some((i) => i.phrase.toLowerCase() === phrase.toLowerCase() && i.type === r.type)) continue;
    const base = { phrase, statement: (r.statement || phrase).trim().slice(0, 300), targetLevel: r.targetLevel, ...(r.autoMapped ? { autoMapped: true } : {}) };
    if (r.type === "current_role") {
      const trackId = r.trackId && trackIds.has(r.trackId) ? r.trackId : undefined;
      intents.push({ ...base, type: "current_role", skillIds: [], slider: 0, ...(trackId ? { trackId } : {}), ...(r.years != null ? { years: r.years } : {}) });
      continue;
    }
    if (r.type === "constraint") {
      const hours = r.constraint?.hoursPerWeek ?? r.hoursPerWeek ?? undefined;
      const weeks = r.constraint?.deadlineWeeks ?? r.deadlineWeeks ?? undefined;
      intents.push({ ...base, type: "constraint", skillIds: [], slider: 0, constraint: { ...(hours ? { hoursPerWeek: hours } : {}), ...(weeks ? { deadlineWeeks: weeks } : {}) } });
      continue;
    }
    const slider = Math.min(5, Math.max(1, r.slider || 3));
    const kase = r.caseId ? cases.get(r.caseId) : undefined;
    if (r.type === "case" && kase) {
      intents.push({ ...base, type: "case", skillIds: kase.skillIds.filter(usable), caseId: kase.id, targetLevel: kase.level, slider });
      continue;
    }
    // A broad phrase is expanded through its skill group: the model's group if it is real, else the
    // group whose phrases occur in the quote.
    const bundle = (r.bundleId ? bundles.get(r.bundleId) : undefined) ?? matchBundles(cat.bundles ?? [], phrase, cat.departmentId, currentTrackId)[0];
    const own = [...new Set(r.skillIds.filter(usable))];
    const skillIds = [...new Set([...(bundle?.skillIds ?? []), ...own])].slice(0, MAX_INTENT_SKILLS);
    const type = r.type === "case" ? "improve_area" : r.type;
    if (skillIds.length === 0) {
      unsure.push(unsureFor(cat, phrase, currentTrackId));
      continue;
    }
    const trackId = type === "move_role" && r.trackId && trackIds.has(r.trackId) ? r.trackId : undefined;
    intents.push({ ...base, type, skillIds, ...(bundle ? { bundleId: bundle.id } : {}), ...(trackId ? { trackId } : {}), slider });
  }

  // Coverage, in code: every meaningful phrase must be covered.
  const unsurePhrases = () => unsure.map((u) => u.phrase.toLowerCase());
  for (const phrase of coverageCheck(d, intents).uncovered) {
    if (unsurePhrases().some((u) => u.includes(phrase.toLowerCase()) || phrase.toLowerCase().includes(u))) continue;
    const mapped = autoMap(cat, phrase, currentTrackId);
    if (mapped) intents.push(mapped);
    else unsure.push(unsureFor(cat, phrase, currentTrackId));
  }

  // A current role stands for its core skills: the track basics in their stack.
  const sorted = intents
    .map((intent) => ({ intent, at: d.toLowerCase().indexOf(intent.phrase.toLowerCase()) }))
    .sort((a, b) => a.at - b.at)
    .map(({ intent }, i) => ({ ...intent, id: `i${i + 1}` }) as Intent);
  for (const intent of sorted) {
    if (intent.type !== "current_role") continue;
    intent.skillIds = trackBasics({ skills: catalog.skills }, cat.departmentId, intent.trackId ?? null, []).map((s) => s.id);
  }
  return { intents: sorted, unsure, ungrounded };
}

function sortBySlider(goals: readonly GoalInput[]): GoalInput[] {
  return goals.map((g, i) => ({ g, i })).sort((a, b) => b.g.slider - a.g.slider || a.i - b.i).map((x) => x.g);
}

export async function suggestOnboarding(
  deps: { db: Db; ai: AiService },
  input: { departmentId: string; description: string; name?: string },
): Promise<OnboardSuggestion> {
  const cat = rulesCatalog(deps.db, input.departmentId);
  const catalog = getCatalog(deps.db);
  const rules = rulesProfile(cat, input.description);

  let source: OnboardSuggestion["source"] = "rules";
  let ai: OnboardSuggestResponse | null = null;
  if (deps.ai.isConfigured()) {
    try {
      const result = await deps.ai.generateJson({
        purpose: "onboard_suggest",
        task: "onboard_suggest",
        system: `${SUGGEST_SYSTEM}\n\n${catalogPrompt(cat)}`,
        user: JSON.stringify({ description: input.description, name: input.name ?? null }),
        schema: onboardSuggestResponseSchema,
        schemaName: "onboard_suggest",
        meta: {},
      });
      ai = result.data;
    } catch {
      ai = null;
    }
  }

  let checked = checkIntents(cat, catalog, input.description, rules.intents);
  if (ai) {
    const fromAi = checkIntents(cat, catalog, input.description, ai.intents);
    if (fromAi.intents.some((i) => !i.autoMapped)) {
      checked = fromAi;
      source = "ai";
    }
  }
  const { intents, unsure } = checked;
  const fromIntents = intentsToGoals(intents);

  const trackIds = new Set(cat.tracks.map((t) => t.id));
  const stackIds = new Set(cat.stacks.map((s) => s.id));
  const aiTrack = ai?.trackId && trackIds.has(ai.trackId) ? ai.trackId : null;
  const trackId = fromIntents.trackId ?? (source === "ai" ? (aiTrack ?? rules.trackId) : rules.trackId);
  const aiStacks = (ai?.stackIds ?? []).filter((id) => stackIds.has(id));
  const stacks = aiStacks.length ? [...new Set(aiStacks)] : rules.stackIds;
  const experienceBand = fromIntents.experienceBand ?? (fromIntents.years != null ? experienceBandFromYears(fromIntents.years) : null) ?? ai?.experienceBand ?? rules.experienceBand;
  const level = ai?.level ?? (experienceBand ? levelFromExperience(experienceBand) : rules.level);
  const hours = fromIntents.hoursPerWeek ?? ai?.hoursPerWeek ?? rules.hoursPerWeek;

  // Goals come from the intents. A description that asks for nothing still gets the rules' goals
  // (the department defaults), without an intent link.
  const intentGoals: GoalInput[] = fromIntents.goals.map((g) => ({ ...g }));
  const goals = intentGoals.length ? sortBySlider(intentGoals) : rules.goals.map(({ intentId: _drop, ...g }) => (void _drop, g));

  return {
    departmentId: input.departmentId,
    trackId,
    stackIds: stacks,
    experienceBand,
    level,
    hoursPerWeek: hours ?? DEFAULT_HOURS_PER_WEEK,
    deadlineWeeks: fromIntents.deadlineWeeks,
    goals,
    extras: progressionExtras(cat, goals, trackId, stacks),
    source,
    intents,
    unsure,
  };
}

export async function interpretGoal(deps: { db: Db; ai: AiService }, input: { departmentId: string; text: string }, meta: { userId?: string } = {}): Promise<GoalInterpretResult> {
  const cat = rulesCatalog(deps.db, input.departmentId);
  if (deps.ai.isConfigured()) {
    try {
      const result = await deps.ai.generateJson({
        purpose: "goal_interpret",
        task: "goal_interpret",
        system: `${INTERPRET_SYSTEM}\n\n${catalogPrompt(cat)}`,
        user: JSON.stringify({ goal: input.text }),
        schema: goalInterpretationSchema,
        schemaName: "goal_interpret",
        meta: { subjectUserId: meta.userId },
      });
      const valid = new Set(cat.skills.map((s) => s.id));
      const skillIds = [...new Set(result.data.skillIds.filter((id) => valid.has(id)))];
      const kase = result.data.caseId ? cat.outcomes.find((o) => o.id === result.data.caseId) : undefined;
      if (skillIds.length) {
        return {
          interpretation: { outcome: asOutcome(result.data.outcome), skillIds, targetLevel: result.data.targetLevel, caseId: kase?.id ?? null },
          source: "ai",
        };
      }
    } catch {
      // Falls through to the rules.
    }
  }
  const interpretation = rulesInterpret(cat, input.text);
  return interpretation
    ? { interpretation, source: "rules" }
    : { interpretation: null, source: "rules", message: "Could not link that to a catalog skill. Pick the skills it needs." };
}

/** For tests and tools: the words a phrase is matched on. */
export { phraseWords };
