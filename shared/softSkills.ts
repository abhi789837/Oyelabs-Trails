/**
 * v4.4: soft skills shared by client and server.
 *
 * The skill ids are fixed (docs/v4.4/PLAN.md); the catalog rows are seeded from
 * server/src/catalog/seed/softSkills.ts. English levels come from the Council of Europe's
 * descriptors (CEFR Table 3 and the 2020 Companion Volume), rewritten in plain words. The UI says
 * "English level", never the framework's name. Accent never lowers a level: the descriptors talk
 * about how easily the listener understands, not how "native" someone sounds.
 */

import { z } from "zod";

export const SOFT_SKILL_IDS = [
  "ss-spoken-english",
  "ss-workplace-writing",
  "ss-explain-simply",
  "ss-standup-updates",
  "ss-client-team-communication",
  "ss-listening-questions",
  "ss-presenting-demoing",
  "ss-ownership-time",
  "ss-feedback",
  "ss-teamwork",
] as const;
export type SoftSkillId = (typeof SOFT_SKILL_IDS)[number];

export const SOFT_DEPARTMENT_ID = "soft";

export function isSoftSkillId(id: string): id is SoftSkillId {
  return (SOFT_SKILL_IDS as readonly string[]).includes(id);
}

export const ENGLISH_LEVELS = ["below A2", "A2", "B1", "B2", "C1"] as const;
export type EnglishLevel = (typeof ENGLISH_LEVELS)[number];

/**
 * The English level a 0–5 Spoken English skill level stands for: 0 = below A2, 1 = A2, 2 = B1,
 * 3 = B2, 4 = C1, 5 = C1 (the top band, "C1+" in the plan, is still reported as C1). Fractions
 * round to the nearest level; anything out of range is clamped.
 */
export function englishLevelFor(level0to5: number): EnglishLevel {
  if (!Number.isFinite(level0to5)) return "below A2";
  const level = Math.min(5, Math.max(0, Math.round(level0to5)));
  return level === 0 ? "below A2" : level >= 4 ? "C1" : ENGLISH_LEVELS[level]!;
}

/** The lowest 1–5 skill level that means a given English level (the inverse, for targets). */
export function skillLevelForEnglish(level: EnglishLevel): number {
  return ENGLISH_LEVELS.indexOf(level);
}

export interface EnglishLevelDescriptor {
  level: EnglishLevel;
  /** One plain sentence: what someone at this level can do at work. */
  summary: string;
  /** The aspects scored separately (a profile, not one number). */
  range: string;
  accuracy: string;
  fluency: string;
  interaction: string;
  coherence: string;
  /** Judged as listener effort only, never accent. */
  clarity: string;
}

export const ENGLISH_LEVEL_DESCRIPTORS: Record<EnglishLevel, EnglishLevelDescriptor> = {
  "below A2": {
    level: "below A2",
    summary: "Can use single words and a few set phrases; work talk needs a lot of help.",
    range: "Single words and memorised phrases.",
    accuracy: "Few simple structures are correct.",
    fluency: "Very short phrases with long pauses.",
    interaction: "Needs the other person to slow down, repeat and help.",
    coherence: "Words and phrases are not yet linked.",
    clarity: "The listener has to work hard to understand.",
  },
  A2: {
    level: "A2",
    summary: "Can give short, simple answers about familiar work, with help from the listener.",
    range: "Basic sentence patterns and memorised phrases for simple, everyday work.",
    accuracy: "Some simple sentences are right, but basic mistakes are common.",
    fluency: "Short sentences; pauses, false starts and restarts are easy to notice.",
    interaction: "Answers questions and replies to simple statements, but rarely keeps a conversation going alone.",
    coherence: "Links ideas with \"and\", \"but\" and \"because\".",
    clarity: "Clear enough to follow, though people sometimes ask them to repeat.",
  },
  B1: {
    level: "B1",
    summary: "Can get the main point across in familiar work situations, with some pauses.",
    range: "Enough words to talk about their own work, with some searching and going around missing words.",
    accuracy: "Mostly correct in familiar, predictable situations.",
    fluency: "Keeps going and is understood; pauses to plan are noticeable in longer answers.",
    interaction: "Can start, keep up and close a simple conversation, and repeats back to check understanding.",
    coherence: "Tells things in a simple, connected order.",
    clarity: "Generally easy to understand; an accent may be noticeable but does not get in the way.",
  },
  B2: {
    level: "B2",
    summary: "Can explain work clearly and give an opinion with reasons, without much searching for words.",
    range: "Describes clearly and gives views on most work topics, using some longer sentences.",
    accuracy: "Good control; mistakes do not cause misunderstanding and are often self-corrected.",
    fluency: "A fairly even pace with few long pauses.",
    interaction: "Takes turns, checks understanding and invites others in, though not always smoothly.",
    coherence: "Links points with a small set of connecting words; long answers can jump a little.",
    clarity: "Easy to understand; an accent has little or no effect.",
  },
  C1: {
    level: "C1",
    summary: "Can speak fluently and precisely on work topics, choosing the right style for clients and teams.",
    range: "A wide range of language; chooses the right words and tone for the audience.",
    accuracy: "Consistently accurate; rare slips are usually self-corrected.",
    fluency: "Fluent and natural; only hard ideas slow them down.",
    interaction: "Joins in, holds the floor and links their points to what others said.",
    coherence: "Clear, well-structured and easy to follow from start to end.",
    clarity: "Easy to understand throughout; any accent does not affect understanding.",
  },
};

/** The one-line plain descriptor for a 0–5 Spoken English level. */
export function englishLevelSummary(level0to5: number): string {
  return ENGLISH_LEVEL_DESCRIPTORS[englishLevelFor(level0to5)].summary;
}

// ---------------------------------------------------------------------------
// Speak practice on a topic (wired by Phase 3)
// ---------------------------------------------------------------------------

/**
 * A spoken practice on a soft-skills topic ("record a 60-second stand-up update"). Same shape as
 * the planned `speak` task kind (docs/v4.4/PLAN.md, "Speak"), so Phase 3 can hand it to the Speak
 * recorder as is. Until then the topic's `practice` is the same task in writing (`writtenFallback`),
 * which works today.
 */
export const SPEAK_AUDIENCES = ["team", "client", "manager", "interview"] as const;
export const speakPracticeSchema = z.object({
  kind: z.literal("speak"),
  title: z.string().trim().min(1).max(120),
  prompt: z.string().trim().min(1).max(600),
  audience: z.enum(SPEAK_AUDIENCES),
  prepSec: z.literal(20),
  maxSec: z.number().int().min(60).max(90),
  /** What a good answer covers (2–5 plain lines). */
  lookFor: z.array(z.string().trim().min(1).max(200)).min(2).max(5),
  /** The same task as a written prompt, for no mic or a denied mic. */
  writtenFallback: z.string().trim().min(1).max(1500),
  explanation: z.string().trim().min(1).max(1500),
});
export type SpeakPractice = z.infer<typeof speakPracticeSchema>;
