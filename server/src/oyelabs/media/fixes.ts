import { DOC_LINK_LABELS, VIDEO_SOURCE_LABELS, type DocLinkKind, type LinkProblem, type LinkStatus, type VideoSourceKind } from "../../../../shared/videoSources";

/**
 * v4.5 Phase 2: what a preview card and the admin inbox say when a link can't play, and how to fix
 * it. Fixed strings per source × status (PLAN.md §4.2), written for a busy manager
 * (docs/v4.4/COPY_GUIDE.md): what went wrong, then exactly where to click. Every fix ends with
 * "Check again", the button on the card.
 */

type Broken = Exclude<LinkStatus, "ok" | "pending">;

const AGAIN = "Then press Check again.";

const PRIVATE_FIX: Partial<Record<VideoSourceKind, string>> = {
  gdrive: `In Google Drive: Share → General access → 'Anyone with the link' (or 'Oyelabs' if every learner is signed into their Oyelabs Google account) → Viewer. ${AGAIN}`,
  onedrive: `In OneDrive or SharePoint: Share → 'Anyone with the link can view' (or 'People in Oyelabs' if every learner is signed in). ${AGAIN}`,
  dropbox: `In Dropbox: Share → Create link, and set 'Who can access' to 'Anyone with the link'. ${AGAIN}`,
  box: `In Box: Share → Shared link → 'People with the link' (or 'People in your company' if every learner is signed in). ${AGAIN}`,
  youtube: `In YouTube Studio: set the video's visibility to Unlisted or Public, and allow embedding under Details → Show more. ${AGAIN}`,
  vimeo: `In Vimeo: Settings → Privacy → set who can watch to 'Anyone' or 'Only people with the private link', and allow embedding anywhere (or on Oyelearn's domain). ${AGAIN}`,
  loom: `In Loom: Share → set the link to 'Anyone with the link can view' and turn off the password. ${AGAIN}`,
  direct: `The file needs a link that works without signing in. Make the file public, or upload it here instead. ${AGAIN}`,
  embed: `The page needs to work without signing in. Make it public, or upload the video here instead. ${AGAIN}`,
};

const NOT_FOUND_FIX = `Open the link yourself to check it. If the video moved, paste the new link. ${AGAIN}`;

/** The problem shown for a video link that failed its check. */
export function videoProblem(kind: VideoSourceKind, status: Broken, detail?: "folder" | "box_file" | "expired" | "not_video"): LinkProblem {
  const name = kind === "gdrive" ? "Drive" : kind === "direct" || kind === "embed" || kind === "upload" ? "" : VIDEO_SOURCE_LABELS[kind];
  const thing = name ? `This ${name} video` : "This video";
  switch (status) {
    case "private":
      return { code: status, message: `${thing} is private.`, fix: PRIVATE_FIX[kind] ?? PRIVATE_FIX.embed! };
    case "not_found":
      return { code: status, message: `${thing} wasn't found. It may have been deleted or moved.`, fix: NOT_FOUND_FIX };
    case "not_embeddable":
      return kind === "embed"
        ? { code: status, message: "This page doesn't allow other sites to show it.", fix: `Paste a link to the video itself (YouTube, Vimeo, Drive, …) or upload the file here. ${AGAIN}` }
        : { code: status, message: `${thing} can't be shown inside Oyelearn.`, fix: PRIVATE_FIX[kind] ?? `Allow embedding for the video, or upload the file here. ${AGAIN}` };
    case "unsupported":
      if (detail === "folder") return { code: status, message: "This is a link to a folder or a channel, not one video.", fix: "Open the folder, pick the video, and copy that video's own share link." };
      if (detail === "box_file") return { code: status, message: "This is Box's own file page, which needs signing in.", fix: "In Box: Share → Shared link → copy the link that starts with app.box.com/s/." };
      if (detail === "not_video") return { code: status, message: "This link doesn't lead to a video file.", fix: `Paste the share link of the video itself, or upload the file here. ${AGAIN}` };
      return { code: status, message: "We can't play links like this one.", fix: "Paste a YouTube, Vimeo, Loom, Drive, OneDrive, Dropbox or Box link, a link to an .mp4 file, or upload the file here." };
    case "unreachable":
      if (detail === "expired") return { code: status, message: "This file link has expired.", fix: `Make a new link that doesn't expire (or lasts for months), or upload the file here. ${AGAIN}` };
      return { code: status, message: "We couldn't reach this link just now.", fix: `Check the link opens in a private browser window. We'll try again tomorrow, or press Check again.` };
  }
}

/** The problem shown for a document link that failed its check. */
export function docProblem(kind: DocLinkKind, status: Broken): LinkProblem {
  const label = DOC_LINK_LABELS[kind];
  const google = kind === "gdoc" || kind === "gsheet" || kind === "gslides" || kind === "gdrive";
  switch (status) {
    case "private":
      return {
        code: status,
        message: `This ${label} file is private, so we can't read it for the module test.`,
        fix: google
          ? `In ${label}: Share → General access → 'Anyone with the link' → Viewer. Or download it and upload the file here. ${AGAIN}`
          : kind === "onedrive" || kind === "sharepoint"
            ? `In ${label}: Share → 'Anyone with the link can view'. Or download it and upload the file here. ${AGAIN}`
            : kind === "dropbox"
              ? `In Dropbox: Share → set 'Who can access' to 'Anyone with the link'. ${AGAIN}`
              : kind === "notion"
                ? `In Notion: Share → Publish → Publish to web. Or export it as PDF and upload it here. ${AGAIN}`
                : `The page needs to open without signing in. Or save it as PDF and upload it here. ${AGAIN}`,
      };
    case "not_found":
      return { code: status, message: `This ${label} link wasn't found.`, fix: NOT_FOUND_FIX };
    case "unreachable":
      return { code: status, message: "We couldn't reach this link just now.", fix: "We'll try again tomorrow, or press Check again." };
    default:
      return { code: status, message: "We can't read this link.", fix: `Download the file and upload it here instead. ${AGAIN}` };
  }
}
