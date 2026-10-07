import { z } from "zod";

import { isAreaDepartment } from "../../../../shared/catalog";
import { phraseWords } from "../../../../shared/intents";
import type { SuggestSkillsRequest, SuggestSkillsResponse } from "../../../../shared/oyelabsCourses";
import type { AiService } from "../../ai/service";
import { getCatalog } from "../../catalog/repo";
import type { Db } from "../../db";

/**
 * "Suggest" skills for an Oyelabs course from its title, description and module titles.
 *
 * One small Haiku call (task `course_skill_suggest`). The system prompt is the instructions plus
 * the candidate skills as compact JSON, identical for every call with the same departments, so the
 * provider caches it. The answer may only name candidate ids (an enum in the schema, which also
 * makes the mock provider pick real ids). Any AI failure, or no AI connected, falls back to word
 * matching, so the button always does something useful.
 */

export const MAX_SUGGESTED_SKILLS = 5;

export const SKILL_SUGGEST_SYSTEM = `You help an admin of a software agency tag an internal training course with the
skills it teaches. You get the course title, its short description and its module titles, and a
catalog of skills. Pick at most ${MAX_SUGGESTED_SKILLS} skills the course clearly teaches, best first. Use only ids from the
catalog. For each, give a reason of at most 12 plain words that points at the course text
("The modules cover sprint planning"). Pick none rather than a weak match. Return JSON only.`;

interface Candidate {
  id: string;
  name: string;
  area: string;
  aliases: string[];
}

/** Active skills of the chosen departments, plus skill areas (soft skills) everyone can use. All departments = every skill. */
export function candidateSkills(db: Db, departmentIds: readonly string[]): Candidate[] {
  const catalog = getCatalog(db);
  const areas = new Set(catalog.departments.filter((d) => isAreaDepartment(d)).map((d) => d.id));
  const chosen = new Set(departmentIds);
  return catalog.skills
    .filter((s) => s.status === "active" && (chosen.size === 0 || chosen.has(s.departmentId) || areas.has(s.departmentId)))
    .map((s) => ({ id: s.id, name: s.name, area: s.area, aliases: s.aliases }));
}

function courseText(request: SuggestSkillsRequest): string {
  return [request.title, request.description, ...request.moduleTitles].filter(Boolean).join("\n");
}

/** Word matching over names and aliases: the fallback, and what a no-AI install uses. Pure. */
export function suggestByWords(request: SuggestSkillsRequest, candidates: readonly Candidate[]): SuggestSkillsResponse {
  const text = new Set(phraseWords(courseText(request)));
  if (text.size === 0) return { skills: [] };
  const scored = candidates
    .map((c) => {
      let best = 0;
      for (const phrase of [c.name, ...c.aliases]) {
        const words = phraseWords(phrase);
        if (words.length === 0) continue;
        const hit = words.filter((w) => text.has(w)).length / words.length;
        best = Math.max(best, hit);
      }
      return { c, best };
    })
    .filter((x) => x.best >= 0.5)
    .sort((a, b) => b.best - a.best || a.c.name.localeCompare(b.c.name))
    .slice(0, MAX_SUGGESTED_SKILLS);
  return { skills: scored.map(({ c }) => ({ skillId: c.id, name: c.name, reason: `Your course text mentions ${c.name}.` })) };
}

export async function suggestSkills(db: Db, ai: AiService, request: SuggestSkillsRequest): Promise<SuggestSkillsResponse> {
  const candidates = candidateSkills(db, request.departmentIds);
  if (candidates.length === 0 || courseText(request).trim().length < 3) return { skills: [] };
  if (!ai.isConfigured()) return suggestByWords(request, candidates);

  const ids = candidates.map((c) => c.id) as [string, ...string[]];
  const schema = z.object({
    skills: z.array(z.object({ skillId: z.enum(ids), reason: z.string().max(160) })).max(MAX_SUGGESTED_SKILLS),
  });
  const catalog = JSON.stringify(candidates.map((c) => ({ id: c.id, name: c.name, area: c.area, ...(c.aliases.length ? { aliases: c.aliases.slice(0, 4) } : {}) })));
  try {
    const result = await ai.generateJson({
      purpose: "course_skill_suggest",
      task: "course_skill_suggest",
      schemaName: "course_skill_suggest",
      system: `${SKILL_SUGGEST_SYSTEM}\n\nCatalog:\n${catalog}`,
      user: `Title: ${request.title}\nDescription: ${request.description || "(none)"}\nModules:\n${request.moduleTitles.map((t) => `- ${t}`).join("\n") || "(none yet)"}`,
      schema,
      timeoutMs: 30_000,
      meta: {},
    });
    const byId = new Map(candidates.map((c) => [c.id, c]));
    const seen = new Set<string>();
    const skills = result.data.skills
      .filter((s) => byId.has(s.skillId) && !seen.has(s.skillId) && seen.add(s.skillId))
      .map((s) => ({ skillId: s.skillId, name: byId.get(s.skillId)!.name, reason: s.reason.trim() || "Fits the course text." }));
    return skills.length ? { skills } : suggestByWords(request, candidates);
  } catch {
    return suggestByWords(request, candidates);
  }
}
