import type { ResearchProviderId, SearchHit, VideoHit } from "./research";

/**
 * The outside world: three search providers and the YouTube Data API.
 *
 * All four are behind one interface so the pipeline never knows which is configured, and so the
 * tests can hand it a fake without a network. Each adapter is deliberately thin — normalise the
 * response, drop anything without a URL, and get out. Nothing here decides whether a result is
 * *good*; that is `research.ts`, and keeping the two apart means the judgement is tested without
 * standing up an HTTP mock.
 */

export interface SearchClient {
  readonly id: ResearchProviderId;
  search(query: string, limit: number): Promise<SearchHit[]>;
}

export interface VideoClient {
  search(query: string, limit: number): Promise<VideoHit[]>;
  /** Re-checks one video by id, for the weekly link health job. */
  lookup(videoId: string): Promise<VideoHit | null>;
}

/** Fifteen seconds: long enough for a slow provider, short enough not to stall a whole job. */
const TIMEOUT_MS = 15_000;

async function postJson(url: string, body: unknown, headers: Record<string, string>): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`search provider returned ${response.status}`);
  return response.json();
}

async function getJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`provider returned ${response.status}`);
  return response.json();
}

/** Narrows an unknown JSON value to a record, so the adapters can read it without casting twice. */
function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

class TavilyClient implements SearchClient {
  readonly id = "tavily" as const;
  constructor(private readonly key: string) {}

  async search(query: string, limit: number): Promise<SearchHit[]> {
    const body = await postJson(
      "https://api.tavily.com/search",
      { api_key: this.key, query, max_results: limit, search_depth: "basic" },
      {},
    );
    return asArray(asRecord(body).results)
      .map((raw) => {
        const hit = asRecord(raw);
        return {
          url: str(hit.url),
          title: str(hit.title),
          snippet: str(hit.content).slice(0, 500),
          publishedAt: str(hit.published_date) || null,
        };
      })
      .filter((hit) => hit.url.length > 0);
  }
}

class BraveClient implements SearchClient {
  readonly id = "brave" as const;
  constructor(private readonly key: string) {}

  async search(query: string, limit: number): Promise<SearchHit[]> {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${limit}`;
    const body = await getJson(url, { "X-Subscription-Token": this.key, accept: "application/json" });
    return asArray(asRecord(asRecord(body).web).results)
      .map((raw) => {
        const hit = asRecord(raw);
        return {
          url: str(hit.url),
          title: str(hit.title),
          snippet: str(hit.description).slice(0, 500),
          publishedAt: str(hit.age) || null,
        };
      })
      .filter((hit) => hit.url.length > 0);
  }
}

class SerperClient implements SearchClient {
  readonly id = "serper" as const;
  constructor(private readonly key: string) {}

  async search(query: string, limit: number): Promise<SearchHit[]> {
    const body = await postJson("https://google.serper.dev/search", { q: query, num: limit }, { "X-API-KEY": this.key });
    return asArray(asRecord(body).organic)
      .map((raw) => {
        const hit = asRecord(raw);
        return {
          url: str(hit.link),
          title: str(hit.title),
          snippet: str(hit.snippet).slice(0, 500),
          publishedAt: str(hit.date) || null,
        };
      })
      .filter((hit) => hit.url.length > 0);
  }
}

export function makeSearchClient(provider: ResearchProviderId, key: string): SearchClient {
  switch (provider) {
    case "tavily":
      return new TavilyClient(key);
    case "brave":
      return new BraveClient(key);
    case "serper":
      return new SerperClient(key);
  }
}

// ---------------------------------------------------------------------------
// YouTube
// ---------------------------------------------------------------------------

/** `PT12M30S` -> 750. Returns 0 for anything unparseable, which then fails the duration check. */
export function parseIsoDuration(value: string): number {
  const match = /^P(?:([\d.]+)D)?T?(?:([\d.]+)H)?(?:([\d.]+)M)?(?:([\d.]+)S)?$/.exec(value);
  if (!match) return 0;
  const [, days, hours, minutes, seconds] = match;
  return (
    Number(days ?? 0) * 86_400 + Number(hours ?? 0) * 3600 + Number(minutes ?? 0) * 60 + Number(seconds ?? 0)
  );
}

/**
 * The YouTube Data API, in three calls: search, then details, then the channels behind them.
 *
 * Details are a second call because `search.list` returns neither duration nor `embeddable`, and
 * both are disqualifying — a video that cannot be embedded renders as a grey box inside the lesson.
 * Subscriber counts are a third because a channel's traction is the only cheap signal that a
 * tutorial is not one person's first upload.
 */
class YouTubeClient implements VideoClient {
  constructor(private readonly key: string) {}

  async search(query: string, limit: number): Promise<VideoHit[]> {
    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true` +
      `&maxResults=${Math.min(limit, 25)}&q=${encodeURIComponent(query)}&key=${this.key}`;
    const found = await getJson(searchUrl);
    const ids = asArray(asRecord(found).items)
      .map((raw) => str(asRecord(asRecord(raw).id).videoId))
      .filter((id) => id.length > 0);
    if (ids.length === 0) return [];
    return this.details(ids);
  }

  async lookup(videoId: string): Promise<VideoHit | null> {
    const [video] = await this.details([videoId]);
    return video ?? null;
  }

  private async details(ids: string[]): Promise<VideoHit[]> {
    const detailUrl =
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status` +
      `&id=${ids.join(",")}&key=${this.key}`;
    const body = await getJson(detailUrl);
    const items = asArray(asRecord(body).items).map((raw) => asRecord(raw));

    const channelIds = [...new Set(items.map((item) => str(asRecord(item.snippet).channelId)).filter(Boolean))];
    const subscribers = await this.subscriberCounts(channelIds);

    return items.map((item) => {
      const snippet = asRecord(item.snippet);
      const channelId = str(snippet.channelId);
      return {
        videoId: str(item.id),
        title: str(snippet.title),
        channel: str(snippet.channelTitle),
        durationSeconds: parseIsoDuration(str(asRecord(item.contentDetails).duration)),
        viewCount: Number(str(asRecord(item.statistics).viewCount)) || 0,
        subscriberCount: subscribers.get(channelId) ?? 0,
        embeddable: asRecord(item.status).embeddable !== false,
        publishedAt: str(snippet.publishedAt) || null,
      };
    });
  }

  private async subscriberCounts(channelIds: string[]): Promise<Map<string, number>> {
    if (channelIds.length === 0) return new Map();
    try {
      const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds.join(",")}&key=${this.key}`;
      const body = await getJson(url);
      return new Map(
        asArray(asRecord(body).items).map((raw) => {
          const item = asRecord(raw);
          return [str(item.id), Number(str(asRecord(item.statistics).subscriberCount)) || 0] as const;
        }),
      );
    } catch {
      // A channel with hidden subscriber counts, or a quota blip. Zero means the video has to
      // qualify on views alone, which is a fair fallback rather than a disqualification.
      return new Map();
    }
  }
}

export function makeVideoClient(key: string): VideoClient {
  return new YouTubeClient(key);
}
