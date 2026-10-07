import { TRACKING_FOR_KIND, type DocLinkKind, type PlayerKind, type TrackingMode, type VideoSourceKind } from "../../../../shared/videoSources";
import { parseDocLink, parseVideoLink } from "../media/parse";

/**
 * The fields a new `course_videos` / `course_docs` row needs before builder B's link check runs.
 *
 * Saving never waits for the network: the editor stores what B's pure parser reads from the link
 * (kind, player, embed URL, no fetch) and queues `oyelabs.link.check`, which checks sharing, title
 * and length and overwrites these.
 */
export interface ProvisionalVideo {
  kind: VideoSourceKind;
  providerId: string | null;
  playerKind: PlayerKind;
  tracking: TrackingMode;
  embedUrl: string | null;
  playbackUrl: string | null;
  thumbnailUrl: string | null;
}

export function provisionalForLink(url: string): ProvisionalVideo {
  const parsed = parseVideoLink(url);
  if (!parsed) return { kind: "embed", providerId: null, playerKind: "iframe", tracking: TRACKING_FOR_KIND.embed, embedUrl: url, playbackUrl: null, thumbnailUrl: null };
  const { kind, providerId, playerKind, tracking, embedUrl, playbackUrl, thumbnailUrl } = parsed;
  return { kind, providerId, playerKind, tracking, embedUrl, playbackUrl, thumbnailUrl };
}

export function provisionalForUpload(uploadId: string): ProvisionalVideo {
  return {
    kind: "upload",
    providerId: null,
    playerKind: "html5",
    tracking: TRACKING_FOR_KIND.upload,
    embedUrl: null,
    playbackUrl: `/api/v5/oyelabs/media/${encodeURIComponent(uploadId)}`,
    thumbnailUrl: null,
  };
}

export function provisionalDocLink(url: string): { linkKind: DocLinkKind | null; fetchUrl: string | null } {
  const parsed = parseDocLink(url);
  return parsed ? { linkKind: parsed.kind, fetchUrl: parsed.fetchUrl } : { linkKind: null, fetchUrl: null };
}
