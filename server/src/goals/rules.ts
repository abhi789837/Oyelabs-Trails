import { matchBundles, type SkillBundle } from "../../../shared/bundles";
import { normaliseSkillText } from "../../../shared/catalog";
import { asOutcome, type GoalInput, type GoalInterpretation, type SuggestedGoal } from "../../../shared/goals";
import { descriptionPhrases, intentsToGoals, normaliseDescription, phraseWords, type DescriptionPhrase, type Intent } from "../../../shared/intents";
import { EXPERIENCE_LABELS, experienceBandFromYears, levelFromExperience, type ExperienceBand } from "../../../shared/setup";

/**
 * The rules behind Suggest and free-text goals when no AI is configured (or it fails). Pure: they
 * read a compact catalog, so the mock provider can run them too and stay description-aware.
 *
 * What they do, in order:
 * - split the description into clauses and give each an intent: a weakness ("weak on Git") is
 *   Critical, a want ("we want him doing backend") is High, anything else describes who they are
 *   now (their stack and experience) and is not a goal. A clause without a trigger inherits the
 *   previous one's intent ("backend + AI-driven work");
 * - match skill names and aliases (longest match wins, so "react hooks" beats "hooks"), stack and
 *   track names, area names ("AI-driven") and library cases;
 * - read experience ("2 yrs", "senior") and hours per week.
 */

export interface RulesSkill {
  id: string;
  /** v4.4: set for skills from an area department (soft skills), usable by every department. */
  departmentId?: string;
  name: string;
  area: string;
  aliases: string[];
  defaultSlider: number | null;
  prerequisites?: string[];
  trackIds?: string[];
  stackIds?: string[];
  levelMin?: string;
}

export interface RulesCatalog {
  departmentId: string;
  tracks: { id: string; name: string }[];
  stacks: { id: string; name: string; aliases: string[] }[];
  skills: RulesSkill[];
  outcomes: { id: string; title: string; statement: string; level: number; skillIds: string[]; aliases: string[] }[];
  /** v4.4: the department's skill groups, their skills already limited to the usable ones. */
  bundles?: SkillBundle[];
}

type ClauseIntent = "weak" | "want" | "now";

/** Where the catalog JSON starts in a Suggest or interpret system prompt. */
export const CATALOG_MARKER = "CATALOG_JSON:";

/** The inverse, for the mock provider: the catalog back from a system prompt. */
export function catalogFromPrompt(system: string): RulesCatalog | null {
  const at = system.indexOf(CATALOG_MARKER);
  if (at < 0) return null;
  try {
    const c = JSON.parse(system.slice(at + CATALOG_MARKER.length)) as {
      department: string;
      tracks: [string, string][];
      stacks: [string, string, string[]][];
      skills: [string, string, string, string[], number | null][];
      cases: [string, string, number, string[], string[]][];
      bundles?: [string, string, string[], string[], string[], number][];
    };
    return {
      departmentId: c.department,
      tracks: c.tracks.map(([id, name]) => ({ id, name })),
      stacks: c.stacks.map(([id, name, aliases]) => ({ id, name, aliases })),
      skills: c.skills.map(([id, name, area, aliases, defaultSlider]) => ({ id, name, area, aliases, defaultSlider })),
      outcomes: c.cases.map(([id, title, level, skillIds, aliases]) => ({ id, title, statement: title, level, skillIds, aliases })),
      bundles: (c.bundles ?? []).map(([id, name, phrases, skillIds, fromTrackIds, targetLevel]) => ({ id, name, phrases, skillIds, fromTrackIds, targetLevel, departmentId: c.department, active: true })),
    };
  } catch {
    return null;
  }
}


const WEAK = /\b(weak|weaker|struggles?|struggling|poor|bad at|lacks?|lacking|gaps? in|not (good|great|strong|confident)|rusty|needs? help)\b/;
const WANT = /\b(wants?|wanted|should|needs? to|need (him|her|them)|learn|learning|move (to|into)|moving (to|into)|doing|grow (into|in)|focus (on)?|upskill|own|take over|start|pick up|get into|switch(ing)? to|become|goal)\b/;
const NOW = /\b(\d+(\.\d+)?\s*\+?\s*(yrs?|years?)|experienced?|knows?|good (at|with)|strong (in|at|with)|currently|works? (on|with|in)|dev|developer|engineer|background)\b/;

export function clauses(description: string): { text: string; intent: ClauseIntent }[] {
  const parts = description
    .toLowerCase()
    .split(/[,;.\n]|\s\+\s|\s&\s|\band\b|\bbut\b|\bwhile\b/)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: { text: string; intent: ClauseIntent }[] = [];
  let carried: ClauseIntent = "now";
  for (const part of parts) {
    const intent: ClauseIntent = WEAK.test(part) ? "weak" : WANT.test(part) ? "want" : NOW.test(part) ? "now" : carried;
    carried = intent;
    out.push({ text: part, intent });
  }
  return out;
}

/** " react hooks " style padding, so a match is always whole words. */
const padded = (value: string) => ` ${normaliseSkillText(value)} `;

interface Match {
  id: string;
  start: number;
  length: number;
  /** How strongly the words point at this candidate: 2 = written as is (not a folded plural), +1 = in its own name. */
  rank: number;
}

/**
 * Longest-first, non-overlapping matches of any of each candidate's phrases in `text`.
 *
 * With `dropTies`, words that match two candidates go to the one they point at more strongly:
 * written as is beats a folded plural ("pipelines" is CI/CD's alias, not MongoDB aggregation
 * pipeline's name in the plural), then the candidate's own name beats an alias ("excel": Excel for
 * PMs, not Spreadsheets for PMs). When nothing separates them, neither is picked: the words stay
 * claimed and the caller asks instead.
 * `matched` collects the words that were matched.
 */
function matchPhrases(
  text: string,
  candidates: readonly { id: string; phrases: readonly string[] }[],
  options: { dropTies?: boolean; matched?: string[] } = {},
): string[] {
  const hay = padded(text);
  const found: Match[] = [];
  for (const c of candidates) {
    const name = c.phrases[0] ? padded(c.phrases[0]) : "";
    for (const phrase of c.phrases) {
      const p = normaliseSkillText(phrase);
      if (p.length < 2 || (p.length < 3 && !/[+#]/.test(p))) continue;
      // A plural in the text matches the singular phrase ("proposals" → "proposal").
      for (const form of /[a-z]$/.test(p) && !p.endsWith("s") ? [p, `${p}s`] : [p]) {
        let at = hay.indexOf(` ${form} `);
        while (at >= 0) {
          found.push({ id: c.id, start: at + 1, length: form.length, rank: (form === p ? 2 : 0) + (name.includes(` ${p} `) ? 1 : 0) });
          at = hay.indexOf(` ${form} `, at + 1);
        }
      }
    }
  }
  found.sort((a, b) => b.length - a.length || b.rank - a.rank || a.start - b.start);
  const taken: [number, number][] = [];
  const ids: { id: string; start: number }[] = [];
  for (const m of found) {
    const end = m.start + m.length;
    if (taken.some(([s, e]) => m.start < e && end > s)) continue;
    taken.push([m.start, end]);
    if (options.dropTies) {
      const tied = found.filter((o) => o.id !== m.id && o.start === m.start && o.length === m.length);
      // `m` sorts first; it wins only when it points at the words more strongly than every other.
      if (tied.some((o) => o.rank >= m.rank)) continue;
    }
    options.matched?.push(hay.slice(m.start, end));
    if (!ids.some((x) => x.id === m.id)) ids.push({ id: m.id, start: m.start });
  }
  return ids.sort((a, b) => a.start - b.start).map((x) => x.id);
}

const skillPhrases = (cat: RulesCatalog) => cat.skills.map((s) => ({ id: s.id, phrases: [s.name, ...s.aliases] }));

function trackPhrases(cat: RulesCatalog) {
  return cat.tracks.map((t) => {
    const n = normaliseSkillText(t.name);
    const phrases = new Set([n, n.replace(/[\s-]+/g, ""), n.replace(/\s+/g, "-"), n.split(" ")[0]]);
    if (n.startsWith("front")) phrases.add("front end");
    if (n.startsWith("back")) phrases.add("back end");
    if (n.includes("full")) phrases.add("full stack");
    return { id: t.id, phrases: [...phrases].filter((p) => p.length >= 3) };
  });
}

/** Area phrases ("ai driven" for "AI-driven development"), mapped to that area's entry skills. */
function areaMatches(cat: RulesCatalog, text: string, exclude: ReadonlySet<string>): string[] {
  const areas = [...new Set(cat.skills.map((s) => s.area))];
  const hay = padded(text);
  const out: string[] = [];
  for (const area of areas) {
    const words = normaliseSkillText(area).split(" ").filter((w) => w.length > 1 && w !== "development");
    const key = words.slice(0, 2).join(" ");
    if (key.length < 4 || !hay.includes(` ${key} `)) continue;
    const entry = cat.skills.filter((s) => s.area === area && !exclude.has(s.id) && s.levelMin !== "advanced" && s.levelMin !== "expert").slice(0, 2);
    out.push(...entry.map((s) => s.id));
  }
  return out;
}

export function readExperience(description: string): ExperienceBand | null {
  const d = description.toLowerCase();
  const years = /(\d+(?:\.\d+)?)\s*\+?\s*(?:yrs?|years?)\b/.exec(d);
  if (years) return experienceBandFromYears(Number(years[1]));
  if (/\b(fresher|intern|trainee|fresh graduate|new grad)\b/.test(d)) return "0";
  if (/\b(junior)\b/.test(d)) return "1-2";
  if (/\b(mid[- ]level|mid)\b/.test(d)) return "3-5";
  if (/\b(senior|lead|principal|staff engineer|architect)\b/.test(d)) return "6+";
  return null;
}

export function readHours(description: string): number | null {
  const m = /(\d{1,2})\s*(?:h|hrs?|hours?)\s*(?:\/|a|per|each)\s*(?:wk|week)\b/.exec(description.toLowerCase());
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 60 ? n : null;
}

/** 2 for basics, 3 for doing it alone, 4 for owning it in production, 5 for teaching it. */
export function readTargetLevel(text: string): number | null {
  const t = text.toLowerCase();
  if (/\b(teach|mentor|expert|coach others)\b/.test(t)) return 5;
  if (/\b(on (his|her|their) own|without help|independently|alone)\b/.test(t)) return 3;
  if (/\b(advanced|complex|production|at scale|lead|own|owning|architect|design the|senior)\b/.test(t)) return 4;
  if (/\b(intermediate|solid|confident(ly)?|independently|on (his|her|their) own|without help|alone)\b/.test(t)) return 3;
  if (/\b(basic|basics|beginner|simple|first|intro|fundamentals?)\b/.test(t)) return 2;
  return null;
}

export interface RulesProfile {
  trackId: string | null;
  stackIds: string[];
  experienceBand: ExperienceBand | null;
  level: number | null;
  hoursPerWeek: number | null;
  /** v4.4: from a constraint intent ("in 3 months"). */
  deadlineWeeks: number | null;
  goals: GoalInput[];
  /** v4.4: every intent the rules read, each quoting its phrase. */
  intents: Intent[];
}


function targetFor(level: number | null): number {
  return level ? Math.min(5, Math.max(2, level + 1)) : 3;
}

/** Scores how well a library case matches some text: share of its title words present. */
function caseScore(outcome: RulesCatalog["outcomes"][number], text: string): number {
  const hay = padded(text);
  const alias = outcome.aliases.some((a) => {
    const p = normaliseSkillText(a);
    return p.length >= 4 && hay.includes(` ${p} `);
  });
  if (alias) return 1;
  const words = normaliseSkillText(outcome.title)
    .split(" ")
    .filter((w) => w.length > 3);
  if (words.length === 0) return 0;
  return words.filter((w) => hay.includes(` ${w}`)).length / words.length;
}

export function bestCase(cat: RulesCatalog, text: string, min = 0.75): RulesCatalog["outcomes"][number] | null {
  let best: { o: RulesCatalog["outcomes"][number]; score: number } | null = null;
  for (const o of cat.outcomes) {
    const score = caseScore(o, text);
    if (score >= min && (!best || score > best.score)) best = { o, score };
  }
  return best?.o ?? null;
}

/** "in 3 months", "within 6 weeks", "by 8 weeks": a deadline in weeks, or null. */
export function readDeadline(text: string): number | null {
  const m = /\b(?:in|within|by|next)\s+(\d{1,3})\s*(weeks?|wks?|months?)\b/i.exec(text);
  if (!m) return null;
  const n = Number(m[1]) * (/^m/i.test(m[2]!) ? 4 : 1);
  return n >= 1 && n <= 104 ? n : null;
}

/** The literal substring that states the hours or the deadline, for a constraint's phrase. */
function constraintSpan(text: string): string | null {
  return (
    /\d{1,2}\s*(?:h|hrs?|hours?)\s*(?:\/|a|per|each)\s*(?:wk|week)\b/i.exec(text)?.[0] ??
    /\b(?:in|within|by|next)\s+\d{1,3}\s*(?:weeks?|wks?|months?)\b/i.exec(text)?.[0] ??
    null
  );
}

function readYears(text: string): number | null {
  const m = /(\d+(?:\.\d+)?)\s*\+?\s*(?:yrs?|years?)\b/i.exec(text);
  return m ? Number(m[1]) : null;
}

/** Words that say "this is who they are" (a role), so a clause belongs to the current-role intent. */
const ROLE_WORDS =
  /\b(dev|devs|developer|engineer|programmer|designer|manager|pm|analyst|lead|intern|fresher|joiner|hire|graduate|trainee|executive|associate|architect|tester|qa|consultant|specialist|coordinator|background)\b/i;
const IMPROVE = /\b(improve|improving|better at|work on|polish|brush up|sharpen|strengthen)\b/i;
const MOVE = /\b(move|moving|switch|switching|transition|become|grow into|doing|take over|step into)\b/i;

/** The intent rules: what each clause of the description asks for, quoting its exact words. */
export interface RulesIntents {
  intents: Intent[];
  /** The learner's current track (from the current-role clauses), else null. */
  currentTrackId: string | null;
  /** The track they are wanted in, when a want clause names one. */
  wantedTrackId: string | null;
  stackIds: string[];
  experienceBand: ExperienceBand | null;
  level: number | null;
}

export function rulesIntents(cat: RulesCatalog, description: string): RulesIntents {
  const d = normaliseDescription(description);
  const phrases = descriptionPhrases(d);
  const experienceBand = readExperience(d);
  const level = experienceBand ? levelFromExperience(experienceBand) : null;
  const target = targetFor(level);
  const stackPhrases = cat.stacks.map((s) => ({ id: s.id, phrases: [s.name, ...s.aliases] }));
  const stackIds = matchPhrases(d, stackPhrases);
  const tracks = trackPhrases(cat);
  const trackName = new Map(cat.tracks.map((t) => [t.id, t.name]));
  const skillName = new Map(cat.skills.map((s) => [s.id, s.name]));

  // Each phrase's kind, read from its whole clause ("want him to…" is trimmed off the phrase).
  let carried: ClauseIntent = "now";
  const kinds = phrases.map((p) => {
    const text = p.clause.toLowerCase();
    const kind: ClauseIntent = WEAK.test(text) ? "weak" : WANT.test(text) || IMPROVE.test(text) ? "want" : NOW.test(text) ? "now" : carried;
    carried = kind;
    return kind;
  });

  const intents: Intent[] = [];
  const add = (intent: Omit<Intent, "id">) => intents.push({ ...intent, id: "" });
  const roleLike = (p: DescriptionPhrase) =>
    ROLE_WORDS.test(p.text) || readYears(p.text) != null || readExperience(p.text) != null || matchPhrases(p.text, tracks).length > 0 || matchPhrases(p.text, stackPhrases).length > 0;

  // Current role: each run of consecutive "now" clauses with role evidence is one intent.
  let currentTrackId: string | null = null;
  let run: DescriptionPhrase[] = [];
  const flush = () => {
    if (run.length === 0) return;
    const phrase = d.slice(run[0]!.start, run.at(-1)!.end);
    const trackId = matchPhrases(phrase, tracks)[0] ?? null;
    const years = readYears(phrase);
    const band = years != null ? experienceBandFromYears(years) : readExperience(phrase);
    currentTrackId ??= trackId;
    const parts = [trackId ? trackName.get(trackId)! : "Their current role", ...(band ? [EXPERIENCE_LABELS[band]] : [])];
    add({
      phrase,
      type: "current_role",
      statement: parts.join(", "),
      skillIds: [],
      targetLevel: band ? levelFromExperience(band) : (level ?? 2),
      slider: 0,
      ...(trackId ? { trackId } : {}),
      ...(years != null ? { years } : {}),
    });
    run = [];
  };
  const asked: { phrase: DescriptionPhrase; kind: ClauseIntent }[] = [];
  phrases.forEach((p, i) => {
    const span = constraintSpan(p.text);
    if (span) {
      flush();
      const hours = readHours(span);
      const weeks = readDeadline(span);
      const statement = hours ? `${hours} hours a week` : `Finish within ${weeks} weeks`;
      add({ phrase: span, type: "constraint", statement, skillIds: [], targetLevel: 3, slider: 0, constraint: { ...(hours ? { hoursPerWeek: hours } : {}), ...(weeks ? { deadlineWeeks: weeks } : {}) } });
      return;
    }
    if (kinds[i] === "now" && roleLike(p)) {
      run.push(p);
      return;
    }
    flush();
    if (kinds[i] !== "now") asked.push({ phrase: p, kind: kinds[i]! });
  });
  flush();

  // What they should get better at or grow into: a skill group, a case, named skills, a track, an area.
  let wantedTrackId: string | null = null;
  const used = new Set<string>();
  for (const { phrase: p, kind } of asked) {
    const slider = kind === "weak" ? 5 : IMPROVE.test(p.clause) ? 3 : 4;
    const namedTrack = matchPhrases(p.text, tracks).find((t) => t !== currentTrackId) ?? null;
    const bundle = matchBundles(cat.bundles ?? [], p.text, cat.departmentId, currentTrackId).find((b) => b.skillIds.length > 0);
    if (bundle) {
      const type = namedTrack || (MOVE.test(p.clause) && !IMPROVE.test(p.clause)) ? "move_role" : "improve_area";
      if (type === "move_role") wantedTrackId ??= namedTrack;
      // Lower-case the first letter for the sentence, but keep acronyms: "AI-driven development",
      // not "aI-driven" (which reads as "al-driven"). Phase 9.2.
      const name = /^[A-Z]{2}/.test(bundle.name) ? bundle.name : bundle.name.charAt(0).toLowerCase() + bundle.name.slice(1);
      bundle.skillIds.forEach((id) => used.add(id));
      add({
        phrase: p.text,
        type,
        statement: type === "move_role" ? `Become a ${name}` : `Get better at ${name}`,
        skillIds: bundle.skillIds.slice(0, 12),
        bundleId: bundle.id,
        targetLevel: bundle.targetLevel,
        slider: type === "move_role" ? Math.max(slider, 4) : slider,
        ...(type === "move_role" && namedTrack ? { trackId: namedTrack } : {}),
      });
      continue;
    }
    const kase = bestCase(cat, p.text);
    if (kase) {
      kase.skillIds.forEach((id) => used.add(id));
      add({ phrase: p.text, type: "case", statement: kase.statement, skillIds: kase.skillIds, caseId: kase.id, targetLevel: kase.level, slider });
      continue;
    }
    // A named skill counts only when its words are at least half of what the phrase says: "handle
    // the zorblax pipeline" is not about pipelines alone, so it is asked about instead.
    const matchedWords: string[] = [];
    const named = matchPhrases(p.text, skillPhrases(cat), { dropTies: true, matched: matchedWords });
    const said = phraseWords(p.text);
    const known = new Set(phraseWords(matchedWords.join(" ")));
    const direct = said.length > 0 && said.filter((w) => known.has(w)).length / said.length < 0.5 ? [] : named.filter((id) => !used.has(id));
    if (direct.length) {
      direct.forEach((id) => used.add(id));
      add({
        phrase: p.text,
        type: "improve_area",
        statement: `Get better at ${direct.map((id) => skillName.get(id) ?? id).join(", ")}`,
        skillIds: direct.slice(0, 12),
        targetLevel: readTargetLevel(p.text) ?? target,
        slider,
      });
      continue;
    }
    if (namedTrack) {
      wantedTrackId ??= namedTrack;
      const entry = cat.skills
        .filter((s) => s.trackIds?.includes(namedTrack) && s.levelMin === "beginner" && !used.has(s.id) && (!s.stackIds?.length || s.stackIds.some((x) => stackIds.includes(x))))
        .slice(0, 3)
        .map((s) => s.id);
      if (entry.length) {
        entry.forEach((id) => used.add(id));
        add({ phrase: p.text, type: "move_role", statement: `Move into ${trackName.get(namedTrack)}`, skillIds: entry, trackId: namedTrack, targetLevel: target, slider: Math.max(slider, 4) });
        continue;
      }
    }
    const area = areaMatches(cat, p.text, used);
    if (area.length) {
      area.forEach((id) => used.add(id));
      add({ phrase: p.text, type: "improve_area", statement: `Get better at ${area.map((id) => skillName.get(id) ?? id).join(", ")}`, skillIds: area, targetLevel: target, slider });
    }
    // Nothing matched: no intent. The coverage check turns the phrase into a question.
  }

  // Ids in the order the phrases appear.
  const at = (phrase: string) => d.toLowerCase().indexOf(phrase.toLowerCase());
  intents.sort((a, b) => at(a.phrase) - at(b.phrase));
  intents.forEach((intent, i) => (intent.id = `i${i + 1}`));
  return { intents, currentTrackId, wantedTrackId, stackIds, experienceBand, level };
}

export function rulesProfile(cat: RulesCatalog, description: string): RulesProfile {
  const read = rulesIntents(cat, description);
  const fromIntents = intentsToGoals(read.intents);
  const target = targetFor(read.level);
  const goals: GoalInput[] = fromIntents.goals.map((g) => ({ ...g }));
  const used = new Set(goals.flatMap((g) => g.skillIds));

  // Fill a thin list from the department's suggested sliders, so Suggest never comes back empty —
  // only when the description asked for nothing at all (each default is then a plain skill goal).
  if (goals.length === 0) {
    const defaults = cat.skills
      .filter((s) => s.defaultSlider != null && !used.has(s.id) && (!s.departmentId || s.departmentId === cat.departmentId))
      .map((s, index) => ({ s, index }))
      .sort((a, b) => (b.s.defaultSlider ?? 0) - (a.s.defaultSlider ?? 0) || a.index - b.index)
      .slice(0, 6);
    for (const { s } of defaults) {
      used.add(s.id);
      goals.push({ type: "skill", originalText: s.name.slice(0, 300), outcome: asOutcome(`apply ${s.name} at work`), skillIds: [s.id], targetLevel: target, caseId: null, slider: s.defaultSlider ?? 3 });
    }
  }

  return {
    // The setup's track is the current role (its basics are the core skills); without one, the
    // track they are wanted in.
    trackId: read.currentTrackId ?? read.wantedTrackId,
    stackIds: read.stackIds,
    experienceBand: fromIntents.experienceBand ?? read.experienceBand,
    level: read.level,
    hoursPerWeek: fromIntents.hoursPerWeek ?? readHours(description),
    deadlineWeeks: fromIntents.deadlineWeeks,
    goals: goals.map((g, i) => ({ g, i })).sort((a, b) => b.g.slider - a.g.slider || a.i - b.i).map((x) => x.g),
    intents: read.intents,
  };
}

/**
 * The "+ Add" suggestions under the goals: what usually comes next for these goals. Skills whose
 * prerequisites are goal skills, library cases on the goal skills a level up, then the track's entry
 * skills. Never something already a goal. At most five.
 */
export function progressionExtras(cat: RulesCatalog, goals: readonly Pick<GoalInput, "skillIds" | "targetLevel" | "caseId">[], trackId: string | null, stackIds: readonly string[]): SuggestedGoal[] {
  const inGoals = new Set(goals.flatMap((g) => g.skillIds));
  const cases = new Set(goals.map((g) => g.caseId).filter(Boolean));
  const name = new Map(cat.skills.map((s) => [s.id, s.name]));
  const out: SuggestedGoal[] = [];
  const add = (goal: SuggestedGoal) => {
    if (out.length >= 5) return;
    if (goal.caseId ? cases.has(goal.caseId) : goal.skillIds.every((id) => inGoals.has(id))) return;
    if (goal.caseId) cases.add(goal.caseId);
    goal.skillIds.forEach((id) => inGoals.add(id));
    out.push(goal);
  };
  const ownStack = (s: RulesSkill) => !s.stackIds?.length || s.stackIds.some((x) => stackIds.includes(x));
  for (const goal of goals) {
    const next = cat.skills.find((s) => !inGoals.has(s.id) && ownStack(s) && (s.prerequisites ?? []).some((p) => goal.skillIds.includes(p)));
    if (next) add({ type: "skill", originalText: next.name, outcome: asOutcome(`apply ${next.name} at work`), skillIds: [next.id], targetLevel: goal.targetLevel, caseId: null, slider: 3, reason: `Builds on ${name.get(goal.skillIds[0]) ?? goal.skillIds[0]}` });
  }
  for (const goal of goals) {
    const kase = cat.outcomes
      .filter((o) => !cases.has(o.id) && o.skillIds.some((id) => goal.skillIds.includes(id)) && o.level >= goal.targetLevel)
      .sort((a, b) => a.level - b.level)[0];
    if (kase) add({ type: "case", originalText: kase.title, outcome: kase.statement, skillIds: kase.skillIds, targetLevel: kase.level, caseId: kase.id, slider: 3, reason: "A practical case on the same skills" });
  }
  if (trackId) {
    for (const s of cat.skills.filter((s) => s.trackIds?.includes(trackId) && s.levelMin === "beginner" && ownStack(s) && !inGoals.has(s.id)).slice(0, 2)) {
      add({ type: "skill", originalText: s.name, outcome: asOutcome(`apply ${s.name} at work`), skillIds: [s.id], targetLevel: 3, caseId: null, slider: 3, reason: "Basics of their track" });
    }
  }
  return out;
}

/** A free-text goal by rules: the closest library case, else the skills it names; the level from its words. */
export function rulesInterpret(cat: RulesCatalog, text: string): GoalInterpretation | null {
  const kase = bestCase(cat, text, 0.6);
  const skills = matchPhrases(text, skillPhrases(cat));
  const area = skills.length ? [] : areaMatches(cat, text, new Set());
  const skillIds = [...new Set([...(kase?.skillIds ?? []), ...skills, ...area])].slice(0, 6);
  if (skillIds.length === 0) return null;
  return {
    outcome: asOutcome(text),
    skillIds,
    targetLevel: readTargetLevel(text) ?? kase?.level ?? 3,
    caseId: kase?.id ?? null,
  };
}
