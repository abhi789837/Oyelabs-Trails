import {
  TRACKING_FOR_KIND,
  type DocLinkKind,
  type PlayerKind,
  type TrackingMode,
  type VideoSourceKind,
} from "../../../../shared/videoSources";

/**
 * v4.5 Phase 2: the pure half of the link resolver. Turns a pasted link into the best playable form
 * without touching the network. `resolve.ts` then checks, with no credentials, whether it really
 * plays for anyone with the link.
 *
 * Every provider's link shapes are matched on the parsed URL (host + path), never by substring on
 * the raw text, so "https://evil.example/?u=drive.google.com/file/d/x" is a generic page.
 */

export interface ParsedVideoLink {
  kind: VideoSourceKind;
  /** YouTube/Vimeo/Loom id, Drive file id, Box shared name, …; null for direct files and pages. */
  providerId: string | null;
  playerKind: PlayerKind;
  tracking: TrackingMode;
  /** iframe `src` (no autoplay parameters). */
  embedUrl: string | null;
  /** HTML5 `src`. */
  playbackUrl: string | null;
  thumbnailUrl: string | null;
  /** The URL the sharing check reads (the provider's own page or file). */
  checkUrl: string;
  /** A short link (1drv.ms) that must be expanded by following its redirect before it can embed. */
  needsExpand?: boolean;
  /** S3/R2/GCS presigned URL expiry (ms), when the link says. */
  expiresAt?: number;
  /** A link we recognise but cannot play (a Dropbox folder, a private Box file page). */
  unsupported?: "folder" | "box_file";
}

const YT_ID = /^[\w-]{11}$/;
const DIRECT_EXTENSIONS: Record<string, PlayerKind> = { mp4: "html5", m4v: "html5", webm: "html5", mov: "html5", m3u8: "hls" };

/** `new URL` that accepts a missing scheme ("drive.google.com/…") and refuses everything but http(s). */
export function toUrl(input: string): URL | null {
  const value = input.trim();
  if (!value || /\s/.test(value)) return null;
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!url.hostname || !url.hostname.includes(".") && url.hostname !== "localhost") return null;
  return url;
}

function hostIs(url: URL, ...domains: string[]): boolean {
  const host = url.hostname.toLowerCase();
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

function base(kind: VideoSourceKind, playerKind: PlayerKind, fields: Partial<ParsedVideoLink> & { checkUrl: string }): ParsedVideoLink {
  return {
    kind,
    providerId: null,
    playerKind,
    tracking: TRACKING_FOR_KIND[kind],
    embedUrl: null,
    playbackUrl: null,
    thumbnailUrl: null,
    ...fields,
  };
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

function youtube(url: URL): ParsedVideoLink | null {
  if (!hostIs(url, "youtube.com", "youtu.be", "youtube-nocookie.com")) return null;
  let id: string | null = null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (hostIs(url, "youtu.be")) id = parts[0] ?? null;
  else if (url.pathname === "/watch") id = url.searchParams.get("v");
  else if (["embed", "shorts", "live", "v", "e"].includes(parts[0] ?? "")) id = parts[1] ?? null;
  if (!id || !YT_ID.test(id)) return null;
  return base("youtube", "youtube", {
    providerId: id,
    embedUrl: `https://www.youtube.com/embed/${id}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    checkUrl: `https://www.youtube.com/watch?v=${id}`,
  });
}

function vimeo(url: URL): ParsedVideoLink | null {
  if (!hostIs(url, "vimeo.com")) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  let id: string | null = null;
  let hash: string | null = url.searchParams.get("h");
  if (hostIs(url, "player.vimeo.com")) {
    if (parts[0] === "video" && /^\d+$/.test(parts[1] ?? "")) id = parts[1]!;
  } else {
    // vimeo.com/123, vimeo.com/123/abcdef (unlisted), vimeo.com/channels/x/123, vimeo.com/showcase/1/video/123
    const at = parts.findIndex((p) => /^\d{3,}$/.test(p));
    if (at >= 0) {
      id = parts[at]!;
      const next = parts[at + 1];
      if (!hash && next && /^[\da-f]{6,}$/i.test(next)) hash = next;
    }
  }
  if (!id) return null;
  const query = hash ? `?h=${encodeURIComponent(hash)}` : "";
  return base("vimeo", "vimeo", {
    providerId: id,
    embedUrl: `https://player.vimeo.com/video/${id}${query}`,
    checkUrl: hash ? `https://vimeo.com/${id}/${hash}` : `https://vimeo.com/${id}`,
  });
}

function loom(url: URL): ParsedVideoLink | null {
  if (!hostIs(url, "loom.com")) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (!["share", "embed"].includes(parts[0] ?? "")) return null;
  const id = parts[1];
  if (!id || !/^[\da-f]{32}$/i.test(id)) return null;
  return base("loom", "iframe", {
    providerId: id,
    embedUrl: `https://www.loom.com/embed/${id}`,
    checkUrl: `https://www.loom.com/share/${id}`,
  });
}

/** The Drive file id in `/file/d/<id>/…`, `open?id=` or `uc?id=`. */
export function driveFileId(url: URL): string | null {
  if (!hostIs(url, "drive.google.com", "docs.google.com")) return null;
  const m = /\/file\/d\/([\w-]{10,})/.exec(url.pathname);
  if (m) return m[1]!;
  if (url.pathname === "/open" || url.pathname === "/uc") {
    const id = url.searchParams.get("id");
    if (id && /^[\w-]{10,}$/.test(id)) return id;
  }
  return null;
}

function gdrive(url: URL): ParsedVideoLink | null {
  if (!hostIs(url, "drive.google.com")) return null;
  const id = driveFileId(url);
  if (!id) return null;
  return base("gdrive", "iframe", {
    providerId: id,
    embedUrl: `https://drive.google.com/file/d/${id}/preview`,
    thumbnailUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w640`,
    checkUrl: `https://drive.google.com/file/d/${id}/view`,
  });
}

function onedrive(url: URL): ParsedVideoLink | null {
  if (hostIs(url, "1drv.ms")) {
    return base("onedrive", "iframe", { checkUrl: url.toString(), needsExpand: true });
  }
  if (hostIs(url, "onedrive.live.com")) {
    // onedrive.live.com/?cid=…&resid=…&authkey=…, /redir?…, /view.aspx?… → /embed?… (same query).
    const q = new URLSearchParams();
    for (const key of ["cid", "resid", "id", "authkey", "ithint"]) {
      const v = url.searchParams.get(key);
      if (v) q.set(key, v);
    }
    if (!q.get("resid") && !q.get("id")) return null;
    return base("onedrive", "iframe", {
      providerId: q.get("resid") ?? q.get("id"),
      embedUrl: `https://onedrive.live.com/embed?${q.toString()}`,
      checkUrl: url.toString(),
    });
  }
  if (hostIs(url, "sharepoint.com")) {
    // Already an embed (`/_layouts/15/embed.aspx?UniqueId=…`): keep it.
    if (/\/_layouts\/15\/embed\.aspx$/i.test(url.pathname)) {
      return base("onedrive", "iframe", { providerId: url.searchParams.get("UniqueId"), embedUrl: url.toString(), checkUrl: url.toString() });
    }
    // A share link (`/:v:/g/personal/…/<token>`, `/:v:/s/<site>/<token>`) or a stream.aspx page:
    // SharePoint renders its own player for `action=embedview`.
    const share = /^\/:[a-z]:\//i.test(url.pathname);
    const stream = /\/_layouts\/15\/(stream|onedrive)\.aspx$/i.test(url.pathname);
    if (!share && !stream) return null;
    const embed = new URL(url.toString());
    embed.searchParams.set("action", "embedview");
    const token = url.pathname.split("/").filter(Boolean).pop() ?? null;
    return base("onedrive", "iframe", { providerId: share ? token : url.searchParams.get("id"), embedUrl: embed.toString(), checkUrl: url.toString() });
  }
  return null;
}

function dropbox(url: URL): ParsedVideoLink | null {
  if (!hostIs(url, "dropbox.com", "dropboxusercontent.com")) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "sh" || (parts[0] === "scl" && parts[1] === "fo")) {
    return base("dropbox", "html5", { checkUrl: url.toString(), unsupported: "folder" });
  }
  const isFile = parts[0] === "s" || (parts[0] === "scl" && parts[1] === "fi") || hostIs(url, "dropboxusercontent.com");
  if (!isFile) return null;
  const play = new URL(url.toString());
  play.searchParams.delete("dl");
  play.searchParams.delete("raw");
  if (!hostIs(url, "dropboxusercontent.com")) play.searchParams.set("raw", "1");
  play.hostname = hostIs(url, "dropboxusercontent.com") ? url.hostname : "www.dropbox.com";
  const name = decodeURIComponent(parts[parts.length - 1] ?? "");
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return base("dropbox", ext === "m3u8" ? "hls" : "html5", {
    providerId: parts[0] === "scl" ? (parts[2] ?? null) : (parts[1] ?? null),
    playbackUrl: play.toString(),
    checkUrl: play.toString(),
  });
}

function box(url: URL): ParsedVideoLink | null {
  if (!hostIs(url, "box.com", "boxcloud.com")) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const host = url.hostname.endsWith("app.box.com") ? url.hostname : "app.box.com";
  if ((parts[0] === "s" || parts[0] === "v") && parts[1]) {
    return base("box", "iframe", { providerId: parts[1], embedUrl: `https://${host}/embed/s/${parts[1]}`, checkUrl: `https://${host}/s/${parts[1]}` });
  }
  if (parts[0] === "embed" && parts[1] === "s" && parts[2]) {
    return base("box", "iframe", { providerId: parts[2], embedUrl: url.toString(), checkUrl: `https://${host}/s/${parts[2]}` });
  }
  if (parts[0] === "file" && parts[1]) {
    return base("box", "iframe", { providerId: parts[1], checkUrl: url.toString(), unsupported: "box_file" });
  }
  return null;
}

/** S3 (`X-Amz-Date` + `X-Amz-Expires`), R2 (the same SigV4 query), GCS (`X-Goog-…`) and CloudFront (`Expires`). */
export function presignedExpiry(url: URL): number | undefined {
  const q = url.searchParams;
  const date = q.get("X-Amz-Date") ?? q.get("X-Goog-Date");
  const expires = q.get("X-Amz-Expires") ?? q.get("X-Goog-Expires");
  if (date && expires) {
    const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(date);
    if (m && /^\d+$/.test(expires)) {
      const start = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6]));
      return start + Number(expires) * 1000;
    }
  }
  const cf = q.get("Expires");
  if (cf && /^\d{9,11}$/.test(cf) && (q.has("Signature") || q.has("Key-Pair-Id"))) return Number(cf) * 1000;
  return undefined;
}

function direct(url: URL): ParsedVideoLink | null {
  const ext = url.pathname.split(".").pop()?.toLowerCase() ?? "";
  const playerKind = DIRECT_EXTENSIONS[ext];
  if (!playerKind || !url.pathname.includes(".")) return null;
  const expiresAt = presignedExpiry(url);
  return base("direct", playerKind, { playbackUrl: url.toString(), checkUrl: url.toString(), ...(expiresAt ? { expiresAt } : {}) });
}

/**
 * Pasted link → kind, provider id and the embed/playback URL, with no network. Null for anything
 * that is not an http(s) link. Anything unrecognised is a generic embeddable page.
 */
export function parseVideoLink(input: string): ParsedVideoLink | null {
  const url = toUrl(input);
  if (!url) return null;
  for (const parse of [youtube, vimeo, loom, gdrive, onedrive, dropbox, box]) {
    const hit = parse(url);
    if (hit) return hit;
  }
  // A known provider's page we could not read (a YouTube channel, a Drive folder) is not a video.
  if (hostIs(url, "youtube.com", "youtu.be", "drive.google.com", "loom.com")) {
    return base("embed", "iframe", { checkUrl: url.toString(), unsupported: "folder" });
  }
  return direct(url) ?? base("embed", "iframe", { embedUrl: url.toString(), checkUrl: url.toString() });
}

// ---------------------------------------------------------------------------
// Document links
// ---------------------------------------------------------------------------

export interface ParsedDocLink {
  kind: DocLinkKind;
  /** Where text is fetched from (an export URL, a raw download, the page). */
  fetchUrl: string;
  /** The page the sharing check reads. */
  checkUrl: string;
}

/** Pasted doc link → its kind and the URL the text gatherer reads. Null for anything not http(s). */
export function parseDocLink(input: string): ParsedDocLink | null {
  const url = toUrl(input);
  if (!url) return null;
  const href = url.toString();
  if (hostIs(url, "docs.google.com")) {
    const m = /^\/(document|spreadsheets|presentation)\/d\/([\w-]{10,})/.exec(url.pathname);
    if (m) {
      const [, type, id] = m;
      if (type === "document") return { kind: "gdoc", fetchUrl: `https://docs.google.com/document/d/${id}/export?format=txt`, checkUrl: href };
      if (type === "spreadsheets") {
        const gid = /gid=(\d+)/.exec(url.hash + url.search)?.[1];
        return { kind: "gsheet", fetchUrl: `https://docs.google.com/spreadsheets/d/${id}/export?format=csv${gid ? `&gid=${gid}` : ""}`, checkUrl: href };
      }
      return { kind: "gslides", fetchUrl: `https://docs.google.com/presentation/d/${id}/export/pdf`, checkUrl: href };
    }
  }
  const driveId = driveFileId(url);
  if (driveId) return { kind: "gdrive", fetchUrl: `https://drive.google.com/uc?export=download&id=${driveId}`, checkUrl: `https://drive.google.com/file/d/${driveId}/view` };
  if (hostIs(url, "onedrive.live.com", "1drv.ms")) {
    const dl = new URL(href);
    dl.searchParams.set("download", "1");
    return { kind: "onedrive", fetchUrl: dl.toString(), checkUrl: href };
  }
  if (hostIs(url, "sharepoint.com")) {
    const dl = new URL(href);
    dl.searchParams.set("download", "1");
    return { kind: "sharepoint", fetchUrl: dl.toString(), checkUrl: href };
  }
  if (hostIs(url, "dropbox.com")) {
    const dl = new URL(href);
    dl.searchParams.delete("dl");
    dl.searchParams.set("raw", "1");
    return { kind: "dropbox", fetchUrl: dl.toString(), checkUrl: dl.toString() };
  }
  if (hostIs(url, "notion.so", "notion.site")) return { kind: "notion", fetchUrl: href, checkUrl: href };
  if (hostIs(url, "atlassian.net") && url.pathname.startsWith("/wiki")) return { kind: "confluence", fetchUrl: href, checkUrl: href };
  return { kind: "web", fetchUrl: href, checkUrl: href };
}
