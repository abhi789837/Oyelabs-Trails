import { z } from "zod";

import { planSourceSchema } from "./enums";

export const planSummarySchema = z.object({
  id: z.string(),
  version: z.number(),
  source: planSourceSchema,
  assessmentId: z.string().nullable(),
  topicIds: z.array(z.string()),
  publishedAt: z.number(),
});
export type PlanSummary = z.infer<typeof planSummarySchema>;

export const planResponseSchema = z.object({
  plan: planSummarySchema.nullable(),
  history: z.array(planSummarySchema),
});
export type PlanResponse = z.infer<typeof planResponseSchema>;

/**
 * Publishing a plan always creates a new version rather than editing one, so the admin's diff
 * view and "what did the AI originally propose" stay answerable (brief §11.2).
 */
export const publishPlanRequestSchema = z.object({
  topicIds: z.array(z.string().min(1).max(120)).min(1, "A plan needs at least one topic").max(400),
  note: z.string().max(2000).optional(),
});
export type PublishPlanRequest = z.infer<typeof publishPlanRequestSchema>;
