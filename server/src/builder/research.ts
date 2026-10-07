/**
 * Research: finding real sources, and proving they are real.
 *
 * The rule this file exists to enforce is simple and absolute: **the model never supplies a URL.**
 * It proposes search queries; a provider returns results; every result is fetched; and only what
 * survives is handed back to the model to write from. An AI asked for "three good articles about
 * cPanel" will happily produce three plausible URLs, and one or two of them will not exist — which
 * is exactly the failure a learner discovers, not us.
 *
 * Nothing here is mocked in production and everything is mockable in tests: the three providers and
 * the fetcher are injected through `ResearchDeps`, so the pipeline tests run without a network.
 */

export type ResearchProviderId = "tavily" | "brave" | "serper";
/** v4.5.1: a search client is a saved service, or the AI connection's own research. */
export type SearchClientId = ResearchProviderId | "ai-web-search" | "ai-knowledge";

export interface SearchHit {
  url: string;
  title: string;
  snippet: string;
  /** ISO date when the provider reports one. Used to prefer recent material. */
  publishedAt: string | null;
}

export interface VideoHit {
  videoId: string;
  title: string;
  channel: string;
  durationSeconds: number;
  viewCount: number;
  subscriberCount: number;
  embeddable: boolean;
  publishedAt: string | null;
}

/** A source that has been fetched and is known to resolve. */
export interface VerifiedSource {
  url: string;
  title: string;
  snippet: string;
  httpStatus: number;
  publishedAt: string | null;
}

export interface ResearchDeps {
  /** Replaced in tests. Real implementation is `fetch` with a timeout. */
  fetchUrl: (url: string, init?: { method?: string }) => Promise<{ status: number; headers: Headers; text: () => Promise<string> }>;
}

// ---------------------------------------------------------------------------
// Judging a link
// ---------------------------------------------------------------------------

/**
 * Hosts whose material is worth preferring.
 *
 * A short allow-list of *preferences*, not a gate — a good article can live anywhere, and a list
 * long enough to be a gate would be a list nobody maintains. It only breaks ties.
 */
const PREFERRED_HOSTS = [
  "developer.mozilla.org",
  "docs.docker.com",
  "kubernetes.io",
  "laravel.com",
  "nodejs.org",
  "reactjs.org",
  "react.dev",
  "docs.cpanel.net",
  "cpanel.net",
  "postgresql.org",
  "redis.io",
  "docs.github.com",
  "web.dev",
  "developer.chrome.com",
  "learn.microsoft.com",
  "docs.aws.amazon.com",
  "digitalocean.com",
  "stackoverflow.com",
];

/**
 * Hosts to refuse outright.
 *
 * Content farms that rank well and teach badly, plus aggregators that wrap someone else's article
 * in ads. A learner sent to one of these learns that the platform's recommendations are worthless.
 */
const BLOCKED_HOSTS = [
  "w3schools.com",
  "tutorialspoint.com",
  "geeksforgeeks.org",
  "javatpoint.com",
  "codegrepper.com",
  "programcreek.com",
  "educba.com",
  "guru99.com",
  "simplilearn.com",
  "intellipaat.com",
  "knowledgehut.com",
  "medium.com",
];

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function isBlockedHost(url: string): boolean {
  const host = hostOf(url);
  if (!host) return true;
  return BLOCKED_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

export function isPreferredHost(url: string): boolean {
  const host = hostOf(url);
  if (!host) return false;
  return PREFERRED_HOSTS.some((preferred) => host === preferred || host.endsWith(`.${preferred}`));
}

/**
 * Signs that a page is a login wall or a paywall.
 *
 * Read from the fetched HTML rather than guessed from the host, because the same publisher serves
 * some articles free and gates others. Deliberately conservative: these phrases appear in the page
 * furniture of a gated article, not in an article that happens to mention subscriptions.
 */
const GATE_MARKERS = [
  "subscribe to continue",
  "subscribers only",
  "members only",
  "create a free account to continue",
  "sign in to continue reading",
  "this content is for members",
  "you have reached your article limit",
  "start your free trial to read",
];

export function looksGated(html: string): boolean {
  const haystack = html.slice(0, 200_000).toLowerCase();
  return GATE_MARKERS.some((marker) => haystack.includes(marker));
}

/** A publish or update date, from the usual meta tags. Its absence is a reason to deprioritise. */
export function extractPublishedAt(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']article:(?:published|modified)_time["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["'](?:date|pubdate|publishdate|last-modified)["'][^>]+content=["']([^"']+)["']/i,
    /<time[^>]+datetime=["']([^"']+)["']/i,
    /"datePublished"\s*:\s*"([^"]+)"/i,
    /"dateModified"\s*:\s*"([^"]+)"/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) {
      const parsed = new Date(match[1]);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
  }
  return null;
}

/**
 * v4.5.1: the page's own description, for candidates that came without a snippet (the AI's web
 * search returns titles and URLs only). The writer is told what each source covers either way.
 */
export function descriptionOf(html: string): string {
  const match =
    /<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']{10,600})["']/i.exec(html) ??
    /<meta[^>]+content=["']([^"']{10,600})["'][^>]+(?:name|property)=["'](?:description|og:description)["']/i.exec(html);
  return match?.[1]?.trim() ?? "";
}

function titleOf(html: string, fallback: string): string {
  const match = /<title[^>]*>([^<]{3,200})<\/title>/i.exec(html);
  return match?.[1]?.trim() ?? fallback;
}

/**
 * Fetches each candidate and keeps the ones that genuinely resolve.
 *
 * Sequential rather than parallel, and capped: this runs inside a background job where finishing a
 * few seconds sooner is worth nothing, and hammering eight hosts at once from a shared VPS is a
 * good way to get the deployment's IP throttled.
 *
 * A link with no date is kept but sorted last. Undated material is usually fine and occasionally
 * ten years old, and the sort is the honest way to express "probably fine, but prefer the others".
 */
export async function verifyLinks(
  candidates: SearchHit[],
  deps: ResearchDeps,
  options: { max?: number } = {},
): Promise<VerifiedSource[]> {
  const max = options.max ?? 8;
  const verified: VerifiedSource[] = [];

  for (const candidate of candidates) {
    if (verified.length >= max) break;
    if (isBlockedHost(candidate.url)) continue;

    try {
      const response = await deps.fetchUrl(candidate.url);
      if (response.status !== 200) continue;

      const type = response.headers.get("content-type") ?? "";
      // A PDF or an image is not a reading reference, whatever the search engine thought.
      if (type && !type.includes("text/html")) continue;

      const html = await response.text();
      if (looksGated(html)) continue;

      verified.push({
        url: candidate.url,
        title: candidate.title || titleOf(html, candidate.url),
        snippet: candidate.snippet || descriptionOf(html),
        httpStatus: response.status,
        publishedAt: candidate.publishedAt ?? extractPublishedAt(html),
      });
    } catch {
      // A timeout, a DNS failure, a refused connection: all mean the same thing here — the learner
      // would not have been able to open it either.
    }
  }

  return sortSources(verified);
}

/** Preferred hosts first, then dated before undated, then newest. */
export function sortSources(sources: VerifiedSource[]): VerifiedSource[] {
  return [...sources].sort((a, b) => {
    const byHost = Number(isPreferredHost(b.url)) - Number(isPreferredHost(a.url));
    if (byHost !== 0) return byHost;
    const byDated = Number(Boolean(b.publishedAt)) - Number(Boolean(a.publishedAt));
    if (byDated !== 0) return byDated;
    if (a.publishedAt && b.publishedAt) return b.publishedAt.localeCompare(a.publishedAt);
    return 0;
  });
}

// ---------------------------------------------------------------------------
// Judging a video
// ---------------------------------------------------------------------------

export const MIN_VIDEO_SECONDS = 5 * 60;
export const MAX_VIDEO_SECONDS = 60 * 60;
const MIN_VIEWS = 5_000;
const MIN_SUBSCRIBERS = 10_000;
const RECENT_YEARS = 3;

/**
 * Whether a video is worth embedding.
 *
 * `embeddable` is the one that is not a matter of taste: a video the owner has disabled embedding
 * for renders as a grey box inside the lesson, which is worse than having no video at all.
 *
 * Age is a preference rather than a rule, and `topicIsStable` is why: the best explanation of how
 * TCP works can be nine years old, while a nine-year-old cPanel walkthrough shows an interface that
 * no longer exists.
 */
export function videoIsUsable(
  video: VideoHit,
  options: { topicIsStable?: boolean; now?: Date } = {},
): boolean {
  if (!video.embeddable) return false;
  if (video.durationSeconds < MIN_VIDEO_SECONDS || video.durationSeconds > MAX_VIDEO_SECONDS) return false;
  if (video.viewCount < MIN_VIEWS && video.subscriberCount < MIN_SUBSCRIBERS) return false;

  if (!options.topicIsStable && video.publishedAt) {
    const published = new Date(video.publishedAt);
    const cutoff = options.now ?? new Date();
    cutoff.setFullYear(cutoff.getFullYear() - RECENT_YEARS);
    if (published < cutoff) return false;
  }
  return true;
}

/** The best usable video, or null. Traction breaks ties, since nothing else separates two good ones. */
export function pickVideo(videos: VideoHit[], options: { topicIsStable?: boolean } = {}): VideoHit | null {
  const usable = videos.filter((video) => videoIsUsable(video, options));
  if (usable.length === 0) return null;
  return usable.sort((a, b) => b.viewCount - a.viewCount)[0];
}
