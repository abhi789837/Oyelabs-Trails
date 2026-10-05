import { z } from "zod";

import { normaliseSkillText } from "./catalog";

/**
 * v4.4 Phase 1: skill groups ("bundles" in code, "Skill groups" in the admin UI).
 *
 * A bundle is what one broad phrase in an admin's description stands for: "move to the full stack"
 * for a frontend developer means the backend progression; "improve the soft skills" means the ten
 * soft skills. Rows live in `skill_bundles` and admins can edit them. The skill graph still decides
 * the final order on the path.
 */

export interface SkillBundle {
  id: string;
  name: string;
  /** Null = usable in any department. */
  departmentId: string | null;
  /** [] = any current track; ["frontend"] = only when the learner's current role is frontend. */
  fromTrackIds: string[];
  /** Lower-case trigger phrases, matched as whole words. */
  phrases: string[];
  /** Ordered catalog skill ids. */
  skillIds: string[];
  targetLevel: number;
  active: boolean;
  /** Null for a seeded row nobody has edited. */
  updatedBy?: string | null;
  updatedAt?: number;
}

export const MAX_BUNDLE_SKILLS = 12;

const idSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Lowercase letters, digits and dashes");

export const bundleInputSchema = z.object({
  id: idSchema.optional(),
  name: z.string().trim().min(2).max(80),
  departmentId: z.string().trim().min(1).max(48).nullable().default(null),
  fromTrackIds: z.array(z.string().trim().min(1).max(64)).max(20).default([]),
  phrases: z
    .array(z.string().trim().min(2).max(60))
    .min(1, "Add at least one phrase")
    .max(20)
    .transform((list) => [...new Set(list.map((p) => p.toLowerCase().replace(/\s+/g, " ").trim()))]),
  skillIds: z.array(z.string().trim().min(1).max(80)).min(1, "Pick at least one skill").max(MAX_BUNDLE_SKILLS),
  targetLevel: z.number().int().min(1).max(5).default(3),
  active: z.boolean().default(true),
});
export type BundleInput = z.infer<typeof bundleInputSchema>;

const padded = (value: string) => ` ${normaliseSkillText(value)} `;

/** The longest of the bundle's phrases found in `text` as whole words, or null. */
export function bundlePhraseIn(bundle: Pick<SkillBundle, "phrases">, text: string): string | null {
  const hay = padded(text);
  let best: string | null = null;
  for (const phrase of bundle.phrases) {
    const p = normaliseSkillText(phrase);
    if (p.length < 2) continue;
    if (hay.includes(` ${p} `) && (!best || p.length > best.length)) best = p;
  }
  return best;
}

/**
 * The active bundles whose phrases occur in `text`, for a learner in `departmentId` whose current
 * track is `currentTrackId`. Best first: the more specific bundle wins (its own department over
 * "any", a matching current track over "any track"), then the longer phrase, then list order.
 * A bundle limited to some current tracks never matches a learner on another track (or none).
 */
export function matchBundles(bundles: readonly SkillBundle[], text: string, departmentId: string, currentTrackId: string | null): SkillBundle[] {
  const scored: { bundle: SkillBundle; score: number; index: number }[] = [];
  bundles.forEach((bundle, index) => {
    if (!bundle.active) return;
    if (bundle.departmentId && bundle.departmentId !== departmentId) return;
    if (bundle.fromTrackIds.length > 0 && (!currentTrackId || !bundle.fromTrackIds.includes(currentTrackId))) return;
    const phrase = bundlePhraseIn(bundle, text);
    if (!phrase) return;
    const score = (bundle.departmentId ? 1000 : 0) + (bundle.fromTrackIds.length > 0 ? 500 : 0) + phrase.length;
    scored.push({ bundle, score, index });
  });
  return scored.sort((a, b) => b.score - a.score || a.index - b.index).map((s) => s.bundle);
}
