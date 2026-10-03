import { normaliseSkillText } from "../../../shared/catalog";
import { asOutcome, type GoalInput, type GoalInterpretation, type SuggestedGoal } from "../../../shared/goals";
import { experienceBandFromYears, levelFromExperience, type ExperienceBand } from "../../../shared/setup";

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
}

type Intent = "weak" | "want" | "now";

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
    };
    return {
      departmentId: c.department,
      tracks: c.tracks.map(([id, name]) => ({ id, name })),
      stacks: c.stacks.map(([id, name, aliases]) => ({ id, name, aliases })),
      skills: c.skills.map(([id, name, area, aliases, defaultSlider]) => ({ id, name, area, aliases, defaultSlider })),
      outcomes: c.cases.map(([id, title, level, skillIds, aliases]) => ({ id, title, statement: title, level, skillIds, aliases })),
    };
  } catch {
    return null;
  }
}


const WEAK = /\b(weak|weaker|struggles?|struggling|poor|bad at|lacks?|lacking|gaps? in|not (good|great|strong|confident)|rusty|needs? help)\b/;
const WANT = /\b(wants?|wanted|should|needs? to|need (him|her|them)|learn|learning|move (to|into)|moving (to|into)|doing|grow (into|in)|focus (on)?|upskill|own|take over|start|pick up|get into|switch(ing)? to|become|goal)\b/;
const NOW = /\b(\d+(\.\d+)?\s*\+?\s*(yrs?|years?)|experienced?|knows?|good (at|with)|strong (in|at|with)|currently|works? (on|with|in)|dev|developer|engineer|background)\b/;

export function clauses(description: string): { text: string; intent: Intent }[] {
  const parts = description
    .toLowerCase()
    .split(/[,;.\n]|\s\+\s|\s&\s|\band\b|\bbut\b|\bwhile\b/)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: { text: string; intent: Intent }[] = [];
  let carried: Intent = "now";
  for (const part of parts) {
    const intent: Intent = WEAK.test(part) ? "weak" : WANT.test(part) ? "want" : NOW.test(part) ? "now" : carried;
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
}

/** Longest-first, non-overlapping matches of any of each candidate's phrases in `text`. */
function matchPhrases(text: string, candidates: readonly { id: string; phrases: readonly string[] }[]): string[] {
  const hay = padded(text);
  const found: Match[] = [];
  for (const c of candidates) {
    for (const phrase of c.phrases) {
      const p = normaliseSkillText(phrase);
      if (p.length < 2 || (p.length < 3 && !/[+#]/.test(p))) continue;
      let at = hay.indexOf(` ${p} `);
      while (at >= 0) {
        found.push({ id: c.id, start: at + 1, length: p.length });
        at = hay.indexOf(` ${p} `, at + 1);
      }
    }
  }
  found.sort((a, b) => b.length - a.length || a.start - b.start);
  const taken: [number, number][] = [];
  const ids: { id: string; start: number }[] = [];
  for (const m of found) {
    const end = m.start + m.length;
    if (taken.some(([s, e]) => m.start < e && end > s)) continue;
    taken.push([m.start, end]);
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
  goals: GoalInput[];
}

const SLIDER: Record<Exclude<Intent, "now">, number> = { weak: 5, want: 4 };

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

export function rulesProfile(cat: RulesCatalog, description: string): RulesProfile {
  const parts = clauses(description);
  const experienceBand = readExperience(description);
  const level = experienceBand ? levelFromExperience(experienceBand) : null;
  const target = targetFor(level);
  const stackIds = matchPhrases(description, cat.stacks.map((s) => ({ id: s.id, phrases: [s.name, ...s.aliases] })));

  const tracks = trackPhrases(cat);
  let trackId: string | null = null;
  for (const intent of ["weak", "want", "now"] as const) {
    if (trackId) break;
    for (const part of parts.filter((p) => p.intent === intent)) {
      const found = matchPhrases(part.text, tracks)[0];
      if (found) {
        trackId = found;
        break;
      }
    }
  }

  const skillName = new Map(cat.skills.map((s) => [s.id, s.name]));
  const goals: GoalInput[] = [];
  const used = new Set<string>();
  const usedCases = new Set<string>();
  for (const part of parts) {
    if (part.intent === "now") continue;
    const slider = SLIDER[part.intent];
    const kase = bestCase(cat, part.text);
    if (kase && !usedCases.has(kase.id)) {
      usedCases.add(kase.id);
      kase.skillIds.forEach((id) => used.add(id));
      goals.push({ type: "case", originalText: kase.title, outcome: kase.statement, skillIds: kase.skillIds, targetLevel: kase.level, caseId: kase.id, slider });
      continue;
    }
    const direct = matchPhrases(part.text, skillPhrases(cat));
    // A track named as a want ("doing backend") with no skill: that track's entry skills in their
    // stack; else an area named ("AI-driven work"): that area's entry skills.
    const trackHere = direct.length ? null : matchPhrases(part.text, tracks)[0];
    const fromTrack = trackHere
      ? cat.skills.filter((s) => s.trackIds?.includes(trackHere) && s.levelMin === "beginner" && !used.has(s.id) && (!s.stackIds?.length || s.stackIds.some((x) => stackIds.includes(x)))).slice(0, 2).map((s) => s.id)
      : [];
    const ids = direct.length ? direct : fromTrack.length ? fromTrack : areaMatches(cat, part.text, used);
    for (const id of ids) {
      if (used.has(id)) continue;
      used.add(id);
      goals.push({ type: "skill", originalText: (skillName.get(id) ?? id).slice(0, 300), outcome: asOutcome(`apply ${skillName.get(id) ?? id} at work`), skillIds: [id], targetLevel: target, caseId: null, slider });
    }
  }

  // Fill a thin list from the department's suggested sliders, so Suggest never comes back empty.
  if (goals.length < 3) {
    const defaults = cat.skills
      .filter((s) => s.defaultSlider != null && !used.has(s.id))
      .map((s, index) => ({ s, index }))
      .sort((a, b) => (b.s.defaultSlider ?? 0) - (a.s.defaultSlider ?? 0) || a.index - b.index)
      .slice(0, 6 - goals.length);
    for (const { s } of defaults) {
      used.add(s.id);
      goals.push({ type: "skill", originalText: s.name.slice(0, 300), outcome: asOutcome(`apply ${s.name} at work`), skillIds: [s.id], targetLevel: target, caseId: null, slider: s.defaultSlider ?? 3 });
    }
  }

  return {
    trackId,
    stackIds,
    experienceBand,
    level,
    hoursPerWeek: readHours(description),
    goals: goals.map((g, i) => ({ g, i })).sort((a, b) => b.g.slider - a.g.slider || a.i - b.i).map((x) => x.g),
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
