import { z } from "zod";

import {
  DOC_LINK_KINDS,
  DURATION_SOURCES,
  ESTIMATED_MAX_SAMPLE_SEC,
  LINK_STATUSES,
  PLAYER_KINDS,
  TRACKING_MODES,
  VIDEO_SOURCE_KINDS,
} from "./videoSourcesCore";

/**
 * v4.5 Phase 2: videos and documents from any drive. The link resolver's contract.
 *
 * The resolver itself (parsing a pasted link, the no-credentials sharing check, oEmbed/metadata
 * lookups, duration detection) is Phase 2's (builder B) and lives in `server/src/oyelabs/media/`.
 * This file is the contract the editor (A), the players (B), the text gathering (C) and the admin
 * inbox all read. The names, wire types and rules live in the zod-free `./videoSourcesCore` (so the
 * lesson player can use them without zod) and are re-exported here with the request schemas.
 */
export * from "./videoSourcesCore";

export const videoSourceKindSchema = z.enum(VIDEO_SOURCE_KINDS);
export const trackingModeSchema = z.enum(TRACKING_MODES);
export const playerKindSchema = z.enum(PLAYER_KINDS);
export const linkStatusSchema = z.enum(LINK_STATUSES);
export const durationSourceSchema = z.enum(DURATION_SOURCES);
export const docLinkKindSchema = z.enum(DOC_LINK_KINDS);

export const linkProblemSchema = z.object({
  code: linkStatusSchema,
  message: z.string().max(300),
  fix: z.string().max(600),
});

export const resolveLinkRequestSchema = z.object({ url: z.string().trim().min(4).max(2000) });
export type ResolveLinkRequest = z.infer<typeof resolveLinkRequestSchema>;

/** One active-time sample for an estimated entry. The server re-caps it (wall clock since the last). */
export const activeTimeSampleSchema = z.object({
  activeSeconds: z.number().min(0).max(ESTIMATED_MAX_SAMPLE_SEC),
  visible: z.boolean(),
  focused: z.boolean(),
});
