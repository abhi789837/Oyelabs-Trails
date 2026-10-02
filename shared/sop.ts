import { z } from "zod";

/**
 * v4.1: `[Oyelabs SOP – admin to fill]` blocks. The course names what the company must write (a
 * Keka policy, the MoM template); an admin writes it once and every learner sees it in the topic.
 */
export const SOP_MARKER = "[Oyelabs SOP – admin to fill]";
export const SOP_BODY_MAX = 6000;

export interface SopBlock {
  index: number;
  title: string;
  prompt: string;
  /** What the admin wrote, or null while it is still to fill. */
  body: string | null;
  updatedAt: number | null;
}

export interface SopListRow extends SopBlock {
  topicId: string;
  topicTitle: string;
  trackId: string;
  moduleId: string;
}

export const sopParamsSchema = z.object({ topicId: z.string().min(1).max(120), index: z.coerce.number().int().min(0).max(20) });
export const sopTopicParamsSchema = z.object({ topicId: z.string().min(1).max(120) });
export const saveSopRequestSchema = z.object({ body: z.string().trim().max(SOP_BODY_MAX) });
