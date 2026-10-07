import { DOC_LINK_LABELS, isBrokenStatus, type LinkStatus, type ResolvedDocLink, type ResolvedVideo } from "../../../../shared/videoSources";
import { docProblem, videoProblem } from "./fixes";
import { parseDocLink, parseVideoLink, type ParsedVideoLink } from "./parse";
import { BlockedUrlError, safeFetch, type SafeFetchDeps, type SafeResponse } from "./safeFetch";

/**
 * v4.5 Phase 2: the link resolver. `parse.ts` decides what a link is; this checks, from the server
 * and with no credentials, whether it really plays for anyone with the link, and fills in the
 * title, thumbnail and length where the provider tells us (PLAN.md §4.2 table).
 *
 * Never throws for a bad link: every failure is a status with a plain problem and fix.
 */

export interface ResolveDeps extends SafeFetchDeps {
  now?: () => number;
  /** YouTube length from the Data API (when a key is set). */
  youtubeDuration?: (videoId: string) => Promise<number | null>;
  /** Length of a playable file URL (ffprobe), when available. */
  probeDuration?: (url: string) => Promise<number | null>;
  /** For the whole check. Default 8 s. */
  timeoutMs?: number;
}

type Outcome = Pick<ResolvedVideo, "status" | "title" | "thumbnailUrl" | "durationSeconds" | "durationSource"> & {
  detail?: "folder" | "box_file" | "expired" | "not_video";
  /** A short link expanded into its full form. */
  expanded?: ParsedVideoLink;
};

const SIGN_IN_HOSTS = [
  "accounts.google.com",
  "login.microsoftonline.com",
  "login.live.com",
  "login.windows.net",
  "account.box.com",
  "www.dropbox.com/login",
  "vimeo.com/log_in",
  "www.loom.com/login",
];

/** A redirect chain that ends at a sign-in page means the link is not shared with "anyone". */
export function wentToSignIn(chain: readonly string[]): boolean {
  return chain.slice(1).some((href) => {
    try {
      const url = new URL(href);
      const hostPath = `${url.hostname}${url.pathname}`;
      return SIGN_IN_HOSTS.some((h) => (h.includes("/") ? hostPath.startsWith(h) : url.hostname === h)) || /\/(login|signin|sign-in|log_in)(\b|\/|$)/i.test(url.pathname);
    } catch {
      return false;
    }
  });
}

function statusFor(response: SafeResponse): LinkStatus {
  if (wentToSignIn(response.chain)) return "private";
  if (response.status === 401 || response.status === 403) return "private";
  if (response.status === 404 || response.status === 410) return "not_found";
  if (response.status >= 200 && response.status < 300) return "ok";
  return "unreachable";
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));
}

/** og:title, else <title>, with a provider suffix (" - Google Drive", " | Box") removed. */
export function pageTitle(html: string): string | null {
  const og = /<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']{1,300})["']/i.exec(html) ?? /<meta[^>]+content=["']([^"']{1,300})["'][^>]*property=["']og:title["']/i.exec(html);
  const raw = og?.[1] ?? /<title[^>]*>([^<]{1,300})<\/title>/i.exec(html)?.[1];
  if (!raw) return null;
  const title = decodeEntities(raw)
    .replace(/\s+[-|–]\s+(Google Drive|Box|OneDrive|Dropbox|Loom|Vimeo|YouTube)\s*$/i, "")
    .trim();
  return title && !/^(sign in|log in|google drive|box|onedrive|dropbox)$/i.test(title) ? title.slice(0, 200) : null;
}

/** `X-Frame-Options` or CSP `frame-ancestors` forbids other sites from framing the page. */
export function framingForbidden(headers: Headers): boolean {
  const xfo = headers.get("x-frame-options")?.toLowerCase().trim();
  if (xfo && (xfo === "deny" || xfo === "sameorigin" || xfo.startsWith("allow-from"))) return true;
  const csp = headers.get("content-security-policy");
  const ancestors = csp ? /frame-ancestors([^;]*)/i.exec(csp)?.[1]?.trim().split(/\s+/).filter(Boolean) : undefined;
  if (!ancestors) return false;
  if (ancestors.includes("*")) return false;
  if (ancestors.some((s) => s === "https:" || s === "https://*")) return false;
  return true;
}

function json(response: SafeResponse): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(response.body.toString("utf8"));
    return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, 300) : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);

const empty = (status: LinkStatus): Outcome => ({ status, title: null, thumbnailUrl: null, durationSeconds: null, durationSource: null });

async function oembed(endpoint: string, deps: ResolveDeps, timeoutMs: number): Promise<Outcome> {
  const response = await safeFetch(endpoint, { timeoutMs, headers: { accept: "application/json" }, maxBytes: 256 * 1024 }, deps);
  const status = statusFor(response);
  if (status !== "ok") return empty(status);
  const data = json(response);
  if (!data) return empty("unreachable");
  const duration = num(data.duration);
  return {
    status: "ok",
    title: str(data.title),
    thumbnailUrl: str(data.thumbnail_url),
    durationSeconds: duration,
    durationSource: duration ? "provider" : null,
  };
}

const VIDEO_TYPES = /^(video\/|application\/(vnd\.apple\.mpegurl|x-mpegurl|octet-stream|mp4)|audio\/mpegurl)/i;

/** HEAD, falling back to a one-byte Range GET when HEAD is refused (S3 presigned GETs, some CDNs). */
async function headOrRange(url: string, deps: ResolveDeps, timeoutMs: number): Promise<SafeResponse> {
  const head = await safeFetch(url, { method: "HEAD", timeoutMs }, deps);
  if (head.status !== 403 && head.status !== 405 && head.status !== 501) return head;
  return safeFetch(url, { method: "GET", headers: { range: "bytes=0-0" }, timeoutMs, maxBytes: 1 }, deps);
}

async function checkFile(parsed: ParsedVideoLink, deps: ResolveDeps, timeoutMs: number): Promise<Outcome> {
  const response = await headOrRange(parsed.checkUrl, deps, timeoutMs);
  const status = statusFor(response);
  if (status !== "ok") return empty(status);
  const type = response.headers.get("content-type") ?? "";
  if (type && !VIDEO_TYPES.test(type)) return { ...empty("unsupported"), detail: "not_video" };
  const duration = deps.probeDuration ? await deps.probeDuration(response.url).catch(() => null) : null;
  const name = decodeURIComponent(new URL(response.url).pathname.split("/").pop() ?? "").replace(/\.[a-z\d]{2,4}$/i, "");
  return { status: "ok", title: name || null, thumbnailUrl: null, durationSeconds: duration, durationSource: duration ? "probe" : null };
}

async function checkPage(url: string, deps: ResolveDeps, timeoutMs: number, framing: boolean): Promise<Outcome> {
  const response = await safeFetch(url, { timeoutMs, headers: { accept: "text/html,*/*" }, maxBytes: 512 * 1024 }, deps);
  const status = statusFor(response);
  if (status !== "ok") return empty(status);
  if (framing && framingForbidden(response.headers)) return { ...empty("not_embeddable"), title: pageTitle(response.body.toString("utf8")) };
  return { ...empty("ok"), title: pageTitle(response.body.toString("utf8")) };
}

async function check(parsed: ParsedVideoLink, deps: ResolveDeps, timeoutMs: number): Promise<Outcome> {
  if (parsed.unsupported) return { ...empty("unsupported"), detail: parsed.unsupported };
  switch (parsed.kind) {
    case "youtube": {
      const outcome = await oembed(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(parsed.checkUrl)}`, deps, timeoutMs);
      if (outcome.status !== "ok") return outcome;
      const duration = deps.youtubeDuration ? await deps.youtubeDuration(parsed.providerId!).catch(() => null) : null;
      return { ...outcome, thumbnailUrl: parsed.thumbnailUrl, durationSeconds: duration, durationSource: duration ? "provider" : null };
    }
    case "vimeo":
      return oembed(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(parsed.checkUrl)}`, deps, timeoutMs);
    case "loom":
      return oembed(`https://www.loom.com/v1/oembed?url=${encodeURIComponent(parsed.checkUrl)}`, deps, timeoutMs);
    case "gdrive": {
      const outcome = await checkPage(parsed.checkUrl, deps, timeoutMs, false);
      return outcome.status === "ok" ? { ...outcome, thumbnailUrl: parsed.thumbnailUrl } : outcome;
    }
    case "onedrive": {
      const response = await safeFetch(parsed.checkUrl, { timeoutMs, headers: { accept: "text/html,*/*" }, maxBytes: 512 * 1024 }, deps);
      const status = statusFor(response);
      let expanded: ParsedVideoLink | undefined;
      if (parsed.needsExpand) {
        // 1drv.ms → the long onedrive.live.com / sharepoint.com link, which has an embed form.
        const long = response.chain.slice(1).map((href) => parseVideoLink(href)).find((p) => p?.kind === "onedrive" && !p.needsExpand && p.embedUrl);
        if (long) expanded = long;
        else if (status === "ok") return { ...empty("unsupported") };
      }
      return { ...empty(status), title: status === "ok" ? pageTitle(response.body.toString("utf8")) : null, ...(expanded ? { expanded } : {}) };
    }
    case "box":
      return checkPage(parsed.checkUrl, deps, timeoutMs, false);
    case "dropbox":
    case "direct":
      if (parsed.expiresAt && parsed.expiresAt <= (deps.now ?? Date.now)()) return { ...empty("unreachable"), detail: "expired" };
      return checkFile(parsed, deps, timeoutMs);
    case "embed":
      return checkPage(parsed.checkUrl, deps, timeoutMs, true);
    case "upload":
      return empty("ok");
  }
}

/**
 * Resolves one pasted video link: the playable form, then the sharing check. With `check: false`
 * only the offline parse runs (status `pending`).
 */
export async function resolveVideoLink(input: string, deps: ResolveDeps = {}, options: { check?: boolean } = {}): Promise<ResolvedVideo> {
  const now = deps.now ?? Date.now;
  const trimmed = input.trim();
  const parsed = parseVideoLink(trimmed);
  if (!parsed) {
    return {
      kind: "embed",
      providerId: null,
      input: trimmed,
      playerKind: "iframe",
      embedUrl: null,
      playbackUrl: null,
      tracking: "estimated",
      title: null,
      thumbnailUrl: null,
      durationSeconds: null,
      durationSource: null,
      status: "unsupported",
      problem: { code: "unsupported", message: "That doesn't look like a link.", fix: "Paste the full link, starting with https://." },
      checkedAt: now(),
    };
  }
  const base = (p: ParsedVideoLink): ResolvedVideo => ({
    kind: p.kind,
    providerId: p.providerId,
    input: trimmed,
    playerKind: p.playerKind,
    embedUrl: p.embedUrl,
    playbackUrl: p.playbackUrl,
    tracking: p.tracking,
    title: null,
    thumbnailUrl: p.thumbnailUrl,
    durationSeconds: null,
    durationSource: null,
    status: "pending",
    problem: null,
    checkedAt: null,
  });
  if (options.check === false) return base(parsed);

  let outcome: Outcome;
  try {
    outcome = await check(parsed, deps, deps.timeoutMs ?? 8_000);
  } catch (error) {
    if (error instanceof BlockedUrlError && /private network/.test(error.message)) {
      return {
        ...base(parsed),
        status: "unsupported",
        problem: { code: "unsupported", message: "This link points to a private network address.", fix: "Use a link anyone on the internet can open, or upload the file here." },
        checkedAt: now(),
      };
    }
    outcome = empty("unreachable");
  }
  const p = outcome.expanded ?? parsed;
  const status = outcome.status;
  return {
    ...base(p),
    title: outcome.title,
    thumbnailUrl: outcome.thumbnailUrl ?? p.thumbnailUrl,
    durationSeconds: outcome.durationSeconds,
    durationSource: outcome.durationSource,
    status,
    problem: isBrokenStatus(status) ? videoProblem(p.kind, status as Exclude<LinkStatus, "ok" | "pending">, outcome.detail) : null,
    checkedAt: now(),
  };
}

/** Resolves one pasted document link: its kind, where its text comes from, and the sharing check. */
export async function resolveDocLink(input: string, deps: ResolveDeps = {}, options: { check?: boolean } = {}): Promise<ResolvedDocLink> {
  const now = deps.now ?? Date.now;
  const trimmed = input.trim();
  const parsed = parseDocLink(trimmed);
  if (!parsed) {
    return {
      kind: "web",
      input: trimmed,
      fetchUrl: trimmed,
      title: null,
      status: "unsupported",
      problem: { code: "unsupported", message: "That doesn't look like a link.", fix: "Paste the full link, starting with https://." },
      checkedAt: now(),
    };
  }
  const base: ResolvedDocLink = { kind: parsed.kind, input: trimmed, fetchUrl: parsed.fetchUrl, title: null, status: "pending", problem: null, checkedAt: null };
  if (options.check === false) return base;
  let status: LinkStatus;
  let title: string | null = null;
  try {
    const response = await safeFetch(parsed.checkUrl, { timeoutMs: deps.timeoutMs ?? 8_000, headers: { accept: "text/html,*/*" }, maxBytes: 512 * 1024 }, deps);
    status = statusFor(response);
    const type = response.headers.get("content-type") ?? "";
    if (status === "ok" && /html/i.test(type)) title = pageTitle(response.body.toString("utf8"));
  } catch (error) {
    status = error instanceof BlockedUrlError && /private network/.test(error.message) ? "unsupported" : "unreachable";
  }
  return {
    ...base,
    title: title ?? (parsed.kind === "web" ? null : DOC_LINK_LABELS[parsed.kind]),
    status,
    problem: isBrokenStatus(status) ? docProblem(parsed.kind, status as Exclude<LinkStatus, "ok" | "pending">) : null,
    checkedAt: now(),
  };
}
