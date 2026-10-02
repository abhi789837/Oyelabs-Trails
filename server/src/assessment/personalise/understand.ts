import { eq } from "drizzle-orm";

import { trackBasics, type Catalog } from "../../../../shared/catalog";
import {
  enforceBlueprint,
  splitOf,
  understandingKey,
  understandingResponseSchema,
  type SlotSubtype,
  type Understanding,
} from "../../../../shared/personalise";
import { planAssessmentMix, type LearnerSetup } from "../../../../shared/setup";
import type { AiService } from "../../ai/service";
import { difficultyOrder } from "../../bank/assemble";
import { getCatalog } from "../../catalog/repo";
import type { Db } from "../../db";
import * as schema from "../../db/schema";
import { now } from "../../lib/ids";
import { getSetup } from "../../setup/repo";

/**
 * Step 1 of a personalised assessment: read the admin's intent.
 *
 * One Haiku call over a compact profile (a few hundred tokens), answered as JSON. The result is
 * stored with a hash of its input, so the Setup screen's preview and the generation job never pay
 * twice for the same setup. If the model is unavailable the split still comes from the sliders and
 * the summary says so — the assessment never waits on this.
 */

export const UNDERSTAND_SYSTEM = `You plan a 25-question skills assessment for one employee of a software agency.
You get their department, track, stack/tools, experience, level, the admin's prioritised skills
(slider 5 Critical, 4 High, 3 Medium, 2 Low, 1 Optional), skipped skills, track basics and the
admin's description of the person. Understand what the admin actually wants, not just keywords.

Return JSON:
- intent: 3-5 short bullets of what this assessment should find out, in plain words.
- themes: up to 8 context tags from the description to set questions in (e.g. "international
  clients", "Laravel", "Keka timesheets", "delayed release").
- slots: 25 proposed questions, 18 handsOn and 7 mcq. Use only skill ids given. Put more slots on
  what the description stresses, within the priorities. subtype: for handsOn "code" (engineering)
  or a task kind (write, rank, calculate, scenario, spot, excel, allocate, sim); for mcq "mcq-code"
  or "mcq-text". difficulty 1-5 fitting the level. hint: one short scenario line in the person's
  own context (max 20 words).
Never use a skipped skill. Keep every question small: about 60-80 seconds hands-on, 30-50 MCQ.`;

export interface ProfileInput {
  department: string;
  format: "coding" | "tasks";
  track: string | null;
  stacks: string[];
  experience: string | null;
  level: number | null;
  priorities: { id: string; name: string; slider: number }[];
  skip: string[];
  basics: { id: string; name: string }[];
  description: string;
}

/** The compact profile the model reads, from a setup (saved or still in the form) and the description. */
export function profileFromSetup(cat: Catalog, setup: Pick<LearnerSetup, "departmentId" | "trackId" | "stackIds" | "experienceBand" | "level" | "priorities" | "skip">, description: string): ProfileInput {
  const department = cat.departments.find((d) => d.id === setup.departmentId);
  const basics = trackBasics(cat, setup.departmentId, setup.trackId, setup.stackIds);
  return {
    department: department?.name ?? setup.departmentId,
    format: department?.assessmentFormat ?? "coding",
    track: cat.tracks.find((t) => t.id === setup.trackId)?.name ?? null,
    stacks: setup.stackIds.map((id) => cat.stacks.find((s) => s.id === id)?.name ?? id),
    experience: setup.experienceBand,
    level: setup.level,
    priorities: setup.priorities.map((p) => ({ id: p.skillId, name: p.skillName, slider: p.slider })),
    skip: setup.skip.map((s) => s.skillName),
    basics: basics.map((b) => ({ id: b.id, name: b.name })),
    description: description.slice(0, 600),
  };
}

export function profileFor(db: Db, userId: string, catalog?: Catalog): { setup: LearnerSetup; profile: ProfileInput; catalog: Catalog } {
  const setup = getSetup(db, userId);
  const cat = catalog ?? getCatalog(db, { departmentId: setup.departmentId, includeArchived: true });
  return { setup, catalog: cat, profile: profileFromSetup(cat, setup, setup.description) };
}

/** Sensible default subtypes when the model gave none, by department and skill language. */
export function subtypeDefaults(catalog: Catalog, format: "coding" | "tasks") {
  const skills = new Map(catalog.skills.map((s) => [s.id, s]));
  return {
    handsOn: (skillId: string): SlotSubtype => {
      if (format === "coding") return skills.get(skillId)?.language ? "code" : "spot";
      return "scenario";
    },
    mcq: (skillId: string): SlotSubtype => (format === "coding" && skills.get(skillId)?.language ? "mcq-code" : "mcq-text"),
  };
}

/**
 * Understandings by input hash, so the Setup screen's preview and the job that follows "Save &
 * assign" make one model call between them. Small and process-local on purpose.
 */
const recent = new Map<string, Understanding>();
function remember(key: string, value: Understanding): void {
  recent.set(key, value);
  if (recent.size > 200) recent.delete(recent.keys().next().value!);
}

/** Reads a setup (saved or not). Used by the preview endpoint and by `understand`. */
export async function understandSetup(
  deps: { db: Db; ai: AiService },
  input: { setup: Pick<LearnerSetup, "departmentId" | "trackId" | "stackIds" | "experienceBand" | "level" | "priorities" | "skip">; description: string },
  options: { force?: boolean; userId?: string; assessmentId?: string } = {},
): Promise<{ understanding: Understanding; key: string }> {
  const catalog = getCatalog(deps.db, { departmentId: input.setup.departmentId, includeArchived: true });
  const profile = profileFromSetup(catalog, input.setup, input.description);
  const key = understandingKey(profile);
  const cached = recent.get(key);
  if (!options.force && cached && (cached.source === "ai" || !deps.ai.isConfigured())) return { understanding: cached, key };

  const setup = input.setup;
  const basics = profile.basics.map((b) => ({ skillId: b.id, skillName: b.name, slider: 0 }));
  const mix = planAssessmentMix(setup.priorities, basics);
  const names = new Map<string, string>([...setup.priorities.map((p) => [p.skillId, p.skillName] as const), ...profile.basics.map((b) => [b.id, b.name] as const)]);
  const defaults = subtypeDefaults(catalog, profile.format);

  let proposed: { skillId: string; kind: "handsOn" | "mcq"; subtype: SlotSubtype; difficulty: number; hint: string }[] = [];
  let intent: string[] = [];
  let themes: string[] = [];
  let source: Understanding["source"] = "rules";
  if (deps.ai.isConfigured()) {
    try {
      const result = await deps.ai.generateJson({
        purpose: "assessment_plan",
        task: "understand",
        system: UNDERSTAND_SYSTEM,
        user: JSON.stringify(profile),
        schema: understandingResponseSchema,
        schemaName: "assessment_plan",
        meta: { subjectUserId: options.userId, assessmentId: options.assessmentId },
      });
      proposed = result.data.slots;
      intent = result.data.intent;
      themes = result.data.themes;
      source = "ai";
    } catch {
      source = "rules";
    }
  }
  if (source === "rules") {
    intent = [
      ...setup.priorities.filter((p) => p.slider >= 4).slice(0, 3).map((p) => `How solid they are on ${p.skillName}`),
      ...(profile.basics.length ? [`The basics of their ${profile.track ?? "role"}`] : []),
    ].slice(0, 5);
    if (intent.length === 0) intent = ["Where they stand on the basics of their role"];
  }

  const slots = enforceBlueprint({
    proposed,
    mix,
    skip: setup.skip.map((s) => s.skillId),
    skillNames: names,
    format: profile.format,
    difficultyOrder: difficultyOrder(setup.level, setup.experienceBand),
    defaultHandsOn: defaults.handsOn,
    defaultMcq: defaults.mcq,
  });
  const understanding: Understanding = { intent, themes, slots, split: splitOf(slots), source, createdAt: now() };
  remember(key, understanding);
  return { understanding, key };
}

export async function understand(
  deps: { db: Db; ai: AiService },
  userId: string,
  options: { force?: boolean; assessmentId?: string } = {},
): Promise<Understanding> {
  const setup = getSetup(deps.db, userId);
  const stored = deps.db.select().from(schema.learnerPriorities).where(eq(schema.learnerPriorities.userId, userId)).get();
  const catalog = getCatalog(deps.db, { departmentId: setup.departmentId, includeArchived: true });
  const key = understandingKey(profileFromSetup(catalog, setup, setup.description));
  if (!options.force && stored?.understandingHash === key && stored.understanding) {
    const cached = stored.understanding as Understanding;
    if (cached.source === "ai" || !deps.ai.isConfigured()) return cached;
  }
  const { understanding } = await understandSetup(deps, { setup, description: setup.description }, { ...options, userId });
  deps.db.update(schema.learnerPriorities).set({ understanding, understandingHash: key }).where(eq(schema.learnerPriorities.userId, userId)).run();
  return understanding;
}
