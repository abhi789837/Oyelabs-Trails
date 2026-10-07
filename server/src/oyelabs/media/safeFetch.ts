import dns from "node:dns/promises";
import net from "node:net";

/**
 * v4.5 Phase 2: the one way Oyelabs code fetches a URL an admin pasted (the link check here, and
 * builder C's text gathering). Shared with C.
 *
 * - **No credentials:** no cookies, no auth headers, the same view as a stranger with the link.
 * - **SSRF guard:** every hop's host is resolved first and refused when any address is private,
 *   loopback, link-local (169.254.x, the cloud metadata address), CGNAT, multicast or reserved,
 *   for IPv4 and IPv6 (including v4-mapped). Redirects are followed by hand, at most
 *   `maxRedirects`, and each new host is checked again.
 * - **Caps:** a time budget for the whole chain and a byte cap on the body (the rest is dropped).
 *
 * The check happens before the request, so a host whose DNS changes between our lookup and the
 * connection could still slip through; only staff can paste links, and the result is only a status
 * line and a title, so this is accepted (DECISIONS.md, Phase 2).
 *
 * Dev and e2e only: `OYELABS_FETCH_STUB=http://127.0.0.1:<port>` sends every request to that stub
 * server instead (`<stub>/__stub/<host><path>?<query>`), so the e2e runs offline; host names are
 * not resolved then, but literal private addresses are still refused. Ignored in production.
 */

export interface SafeFetchOptions {
  method?: "GET" | "HEAD";
  headers?: Record<string, string>;
  /** Default 5. */
  maxRedirects?: number;
  /** For the whole redirect chain. Default 8 s (the editor's preview budget). */
  timeoutMs?: number;
  /** Bytes of body kept. Default 1 MB. The rest is not downloaded. */
  maxBytes?: number;
}

export interface SafeResponse {
  status: number;
  /** The final URL, after redirects. */
  url: string;
  headers: Headers;
  /** Every URL visited, in order, starting with the one asked for. */
  chain: string[];
  body: Buffer;
  truncated: boolean;
}

export type LookupFn = (hostname: string) => Promise<string[]>;

export interface SafeFetchDeps {
  fetchImpl?: typeof fetch;
  lookup?: LookupFn;
}

export class BlockedUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlockedUrlError";
  }
}

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_BYTES = 1024 * 1024;
const USER_AGENT = "Mozilla/5.0 (compatible; OyelearnLinkCheck/1.0; +https://oyelabs.com)";

const defaultLookup: LookupFn = async (hostname) => (await dns.lookup(hostname, { all: true, verbatim: true })).map((a) => a.address);

// ---------------------------------------------------------------------------
// Address rules
// ---------------------------------------------------------------------------

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

const V4_BLOCKED: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

function v4Blocked(ip: string): boolean {
  const value = ipv4ToInt(ip);
  return V4_BLOCKED.some(([range, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (value & mask) === (ipv4ToInt(range) & mask);
  });
}

/** Expands an IPv6 address into its eight 16-bit groups. */
function v6Groups(ip: string): number[] | null {
  let text = ip.toLowerCase();
  const zone = text.indexOf("%");
  if (zone >= 0) text = text.slice(0, zone);
  // A trailing dotted IPv4 (::ffff:1.2.3.4) becomes two groups.
  const v4 = /(\d+\.\d+\.\d+\.\d+)$/.exec(text);
  if (v4) {
    const n = ipv4ToInt(v4[1]!);
    text = text.slice(0, -v4[1]!.length) + `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const [head, tail] = text.split("::");
  const a = head ? head.split(":") : [];
  const b = tail !== undefined ? (tail ? tail.split(":") : []) : null;
  const groups = b === null ? a : [...a, ...Array(8 - a.length - b.length).fill("0"), ...b];
  if (groups.length !== 8) return null;
  const out = groups.map((g) => parseInt(g, 16));
  return out.every((g) => Number.isInteger(g) && g >= 0 && g <= 0xffff) ? out : null;
}

function v6Blocked(ip: string): boolean {
  const g = v6Groups(ip);
  if (!g) return true;
  if (g.every((x) => x === 0)) return true; // ::
  if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return true; // ::1
  // v4-mapped (::ffff:a.b.c.d) and v4-compatible / NAT64 (64:ff9b::a.b.c.d): judge the IPv4 part.
  const v4 = `${g[6]! >> 8}.${g[6]! & 0xff}.${g[7]! >> 8}.${g[7]! & 0xff}`;
  if (g.slice(0, 5).every((x) => x === 0) && (g[5] === 0xffff || g[5] === 0)) return v4Blocked(v4);
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return v4Blocked(v4);
  if ((g[0]! & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((g[0]! & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((g[0]! & 0xffc0) === 0xfec0) return true; // fec0::/10 site-local (deprecated)
  if ((g[0]! & 0xff00) === 0xff00) return true; // multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true; // documentation
  return false;
}

/** True for any address a link check must never reach. */
export function isBlockedAddress(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return v4Blocked(ip);
  if (family === 6) return v6Blocked(ip);
  return true;
}

/** Throws `BlockedUrlError` unless the URL is http(s) and every address of its host is public. */
export async function assertPublicUrl(url: URL, lookup: LookupFn = defaultLookup): Promise<void> {
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new BlockedUrlError("Only http and https links can be checked.");
  if (url.username || url.password) throw new BlockedUrlError("Links with a user name or password can't be checked.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host)) {
    if (isBlockedAddress(host)) throw new BlockedUrlError("That address is on a private network.");
    return;
  }
  if (/^localhost$|\.localhost$|\.local$|\.internal$/i.test(host)) throw new BlockedUrlError("That address is on a private network.");
  let addresses: string[];
  try {
    addresses = await lookup(host);
  } catch {
    throw new BlockedUrlError("That address could not be found.");
  }
  if (addresses.length === 0 || addresses.some(isBlockedAddress)) throw new BlockedUrlError("That address is on a private network.");
}

// ---------------------------------------------------------------------------
// The dev/e2e stub
// ---------------------------------------------------------------------------

/** The stub origin, or null. Never in production. */
export function fetchStubOrigin(): string | null {
  if (process.env.NODE_ENV === "production") return null;
  const value = process.env.OYELABS_FETCH_STUB?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.hostname === "127.0.0.1" || url.hostname === "localhost" ? url.origin : null;
  } catch {
    return null;
  }
}

function stubbed(url: URL, origin: string): string {
  return `${origin}/__stub/${url.host}${url.pathname}${url.search}`;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

async function readCapped(response: Response, maxBytes: number): Promise<{ body: Buffer; truncated: boolean }> {
  if (!response.body) return { body: Buffer.alloc(0), truncated: false };
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let size = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = Buffer.from(value);
    if (size + chunk.length > maxBytes) {
      chunks.push(chunk.subarray(0, maxBytes - size));
      size = maxBytes;
      truncated = true;
      await reader.cancel().catch(() => undefined);
      break;
    }
    chunks.push(chunk);
    size += chunk.length;
  }
  return { body: Buffer.concat(chunks), truncated };
}

/**
 * Fetches a pasted URL as a stranger would, refusing private addresses at every hop. Throws
 * `BlockedUrlError` for a refused address, a bad scheme or too many redirects; network failures and
 * timeouts throw as `fetch` does.
 */
export async function safeFetch(input: string | URL, options: SafeFetchOptions = {}, deps: SafeFetchDeps = {}): Promise<SafeResponse> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const lookup = deps.lookup ?? defaultLookup;
  const stub = deps.fetchImpl ? null : fetchStubOrigin();
  const maxRedirects = options.maxRedirects ?? 5;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const signal = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const method = options.method ?? "GET";

  let url = typeof input === "string" ? new URL(input) : input;
  const chain: string[] = [];
  for (let hop = 0; ; hop++) {
    chain.push(url.toString());
    // In stub mode no DNS is done (offline), but literal private addresses are still refused.
    await assertPublicUrl(url, stub ? async () => ["192.0.43.10"] : lookup);
    const response = await fetchImpl(stub ? stubbed(url, stub) : url.toString(), {
      method,
      redirect: "manual",
      credentials: "omit",
      signal,
      headers: { "user-agent": USER_AGENT, accept: "*/*", "accept-language": "en", ...options.headers },
    });
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel().catch(() => undefined);
      if (hop >= maxRedirects) throw new BlockedUrlError("The link redirects too many times.");
      url = new URL(location, url);
      continue;
    }
    const { body, truncated } = method === "HEAD" ? { body: Buffer.alloc(0), truncated: false } : await readCapped(response, maxBytes);
    return { status: response.status, url: url.toString(), headers: response.headers, chain, body, truncated };
  }
}
