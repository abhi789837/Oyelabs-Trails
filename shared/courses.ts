import { z } from "zod";

import { accentTokenSchema } from "./content";

/**
 * Admin-authored courses.
 *
 * A course is what the curriculum is not: written by a person, about something only this company
 * knows — an internal process, a runbook, how an incident is handled here. It has prose, a video
 * and some links, and it is finished when the learner says it is.
 *
 * **There is no quiz, by design.** That was the explicit scope, and it has a consequence worth
 * stating rather than hiding: completion here is self-reported, so it is counted separately from
 * plan progress everywhere. A certificate that mixed "passed a graded challenge" with "ticked a
 * box" would mean less than the one the platform issues today.
 */

export const courseAudienceSchema = z.enum(["everyone", "assigned"]);
export type CourseAudience = z.infer<typeof courseAudienceSchema>;

/** A link on a lesson. Rendered as a link — nothing is fetched or previewed server-side. */
export const courseLinkSchema = z.object({
  label: z.string().trim().min(1).max(120),
  url: z.string().trim().url().max(500),
});
export type CourseLink = z.infer<typeof courseLinkSchema>;

export const courseTopicSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  courseId: z.string(),
  title: z.string(),
  body: z.string(),
  videoId: z.string().nullable(),
  videoTitle: z.string().nullable(),
  links: z.array(courseLinkSchema),
  estMinutes: z.number(),
  position: z.number(),
});
export type CourseTopic = z.infer<typeof courseTopicSchema>;

export const courseSectionSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  summary: z.string(),
  position: z.number(),
  topics: z.array(courseTopicSchema),
});
export type CourseSection = z.infer<typeof courseSectionSchema>;

export const courseSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  accent: accentTokenSchema,
  audience: courseAudienceSchema,
  published: z.boolean(),
  position: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  /** v4. Null on courses that predate levels. */
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]).nullable().default(null),
  /** v4. Null = shown to every department. */
  departmentId: z.string().nullable().default(null),
  sections: z.array(courseSectionSchema),
});
export type Course = z.infer<typeof courseSchema>;

/** A course as the learner's list sees it: the counts, without the body of every lesson. */
export const courseCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  accent: accentTokenSchema,
  topicCount: z.number(),
  completedCount: z.number(),
  estMinutes: z.number(),
});
export type CourseCard = z.infer<typeof courseCardSchema>;

// ---------------------------------------------------------------------------
// Authoring
// ---------------------------------------------------------------------------

export const upsertCourseRequestSchema = z.object({
  title: z.string().trim().min(2).max(120),
  summary: z.string().trim().max(400).default(""),
  accent: accentTokenSchema.default("glacier"),
  audience: courseAudienceSchema.default("everyone"),
  published: z.boolean().default(false),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]).nullable().optional(),
  departmentId: z.string().max(48).nullable().optional(),
});
export type UpsertCourseRequest = z.infer<typeof upsertCourseRequestSchema>;

export const upsertSectionRequestSchema = z.object({
  title: z.string().trim().min(2).max(120),
  summary: z.string().trim().max(400).default(""),
});
export type UpsertSectionRequest = z.infer<typeof upsertSectionRequestSchema>;

/**
 * `video` is whatever the author pasted — a watch URL, a share URL, an embed URL or a bare id.
 * The server extracts the id; see `youtubeId`. Anything it cannot read is rejected rather than
 * stored, so a lesson never renders a player pointed at nothing.
 */
export const upsertCourseTopicRequestSchema = z.object({
  title: z.string().trim().min(2).max(160),
  body: z.string().max(20_000).default(""),
  video: z.string().trim().max(500).optional(),
  videoTitle: z.string().trim().max(160).optional(),
  links: z.array(courseLinkSchema).max(12).default([]),
  estMinutes: z.number().int().min(1).max(600).default(10),
});
export type UpsertCourseTopicRequest = z.infer<typeof upsertCourseTopicRequestSchema>;

/** New order for a course's sections, or a section's topics. Ids only — positions are derived. */
export const reorderRequestSchema = z.object({ ids: z.array(z.string().min(1).max(64)).max(200) });
export type ReorderRequest = z.infer<typeof reorderRequestSchema>;

/**
 * Pulls a YouTube id out of anything an author is likely to paste.
 *
 * Shared so the server and the admin form agree on what counts as a valid video: the form can say
 * "that doesn't look like a YouTube link" while typing instead of waiting for a 400, and it cannot
 * disagree with the server about it.
 *
 * Returns null rather than throwing — the caller decides whether an unreadable value is an error
 * (the server) or a hint not to show yet (the form).
 */
export function youtubeId(input: string): string | null {
  const value = input.trim();
  if (value.length === 0) return null;

  // A bare id: exactly 11 of the id alphabet, and nothing else.
  if (/^[\w-]{11}$/.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  const fromQuery = url.searchParams.get("v");
  if ((host === "youtube.com" || host === "m.youtube.com") && fromQuery && /^[\w-]{11}$/.test(fromQuery)) {
    return fromQuery;
  }
  // youtu.be/<id>, youtube.com/embed/<id>, /shorts/<id>, /live/<id>
  if (host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const last = url.pathname.split("/").filter(Boolean).pop();
    if (last && /^[\w-]{11}$/.test(last)) return last;
  }
  return null;
}
