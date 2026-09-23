#!/usr/bin/env node
// Checks reference URLs: final status after redirects, whether the page may be shown in an
// <iframe> on another site (X-Frame-Options / CSP frame-ancestors), and whether a 200 is real.
//
//   node scripts/research/check-urls.mjs <url> [url...]
//   node scripts/research/check-urls.mjs --file urls.txt
//
// Prints one JSON line per URL: { url, status, finalUrl, title, bodyLength, embeddable, reason,
// unverifiable? }.
//
// UNVERIFIABLE 200s. Documentation sites built as SPAs — angular.dev and docs.nestjs.com both do
// this — answer *every* path with HTTP 200, so a misremembered URL looks perfectly healthy. Before
// checking a batch this script fetches one deliberately nonsensical path per host, then compares
// each real URL's response against it.
//
// The verdict is deliberately not "broken". Two different things produce the same symptom:
//   - an SSR site serving its homepage for an unknown path (the URL really is wrong), and
//   - a client-rendered site serving one shell for every path (the URL may be perfectly fine,
//     and only JavaScript would tell you).
// HTTP cannot separate them, so a match is reported as `unverifiable: true` and means "check this
// one in a browser", not "delete it". A URL whose response differs from the probe is confirmed.

import fs from "node:fs";
import { pathToFileURL } from "node:url";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

const HEADERS = { "user-agent": UA, accept: "text/html,application/xhtml+xml", "accept-language": "en-US,en;q=0.9" };

export function frameVerdict(headers) {
  const xfo = headers.get("x-frame-options");
  const csp = headers.get("content-security-policy") ?? "";
  const fa = csp
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.toLowerCase().startsWith("frame-ancestors"));
  if (fa) {
    const sources = fa.split(/\s+/).slice(1);
    const allowsAll = sources.includes("*") || sources.some((s) => s === "https:" || s === "https://*");
    return allowsAll
      ? { embeddable: true, reason: `CSP ${fa}` }
      : { embeddable: false, reason: `CSP ${fa}` };
  }
  if (xfo) return { embeddable: false, reason: `X-Frame-Options: ${xfo}` };
  return { embeddable: true, reason: "no framing restrictions" };
}

/** Reads at most `limit` bytes of the body — enough for <head> — then drops the connection. */
async function readHead(res, limit = 64_000) {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (size < limit) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function extractTitle(html) {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!m) return null;
  return m[1].replace(/\s+/g, " ").trim().slice(0, 200) || null;
}

export async function checkUrl(url) {
  try {
    const res = await fetch(url, { redirect: "follow", headers: HEADERS, signal: AbortSignal.timeout(20000) });
    const verdict = frameVerdict(res.headers);
    const html = res.headers.get("content-type")?.includes("html") ? await readHead(res) : "";
    if (!html) await res.body?.cancel().catch(() => {});
    return { url, status: res.status, finalUrl: res.url, title: extractTitle(html), bodyLength: html.length, ...verdict };
  } catch (err) {
    return { url, status: 0, finalUrl: null, title: null, bodyLength: 0, embeddable: false, reason: `request failed: ${err.message}` };
  }
}

/**
 * What a host serves for a path that cannot exist. `null` when the host behaves correctly (a 4xx),
 * which is the common and happy case and makes every URL on it trustworthy at face value.
 */
async function probeMissingPath(origin) {
  const probe = `${origin}/__oyelearn_probe_${Date.now().toString(36)}/does-not-exist`;
  try {
    const res = await fetch(probe, { redirect: "follow", headers: HEADERS, signal: AbortSignal.timeout(20000) });
    if (!res.ok) {
      await res.body?.cancel().catch(() => {});
      return null;
    }
    const html = await readHead(res);
    return { title: extractTitle(html), length: html.length };
  } catch {
    return null;
  }
}

export async function checkUrls(urls) {
  const origins = [...new Set(urls.map((u) => { try { return new URL(u).origin; } catch { return null; } }).filter(Boolean))];
  const probes = new Map(await Promise.all(origins.map(async (o) => [o, await probeMissingPath(o)])));

  return Promise.all(
    urls.map(async (u) => {
      const result = await checkUrl(u);
      let origin = null;
      try { origin = new URL(u).origin; } catch { /* keep null */ }
      const probe = origin ? probes.get(origin) : null;
      if (!probe || !result.title) return result;

      // Within 2% of the probe's length and the same title: this response is not distinguishable
      // from the one a nonexistent path gets.
      const sameTitle = result.title === probe.title;
      const sameSize = probe.length > 0 && Math.abs(result.bodyLength - probe.length) / probe.length < 0.02;
      if (sameTitle && sameSize) {
        return { ...result, unverifiable: true, reason: `${result.reason} — UNVERIFIABLE: this host returns the same response for a nonexistent path, so only a browser can confirm this page exists` };
      }
      return result;
    }),
  );
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
const args = isMain ? process.argv.slice(2) : [];
if (args.length) {
  const urls = args[0] === "--file" ? fs.readFileSync(args[1], "utf8").split(/\s+/).filter(Boolean) : args;
  const results = await checkUrls(urls);
  for (const r of results) console.log(JSON.stringify(r));
  const unverifiable = results.filter((r) => r.unverifiable);
  if (unverifiable.length) {
    console.error(
      `\n${unverifiable.length} URL(s) returned 200 that could not be verified — these hosts answer any path the same way, so open each in a browser before shipping it:`,
    );
    for (const r of unverifiable) console.error(`  ${r.url}`);
  }
  const failed = results.filter((r) => r.status === 0 || r.status >= 400);
  if (failed.length) {
    console.error(`\n${failed.length} URL(s) failed outright:`);
    for (const r of failed) console.error(`  ${r.status}  ${r.url}`);
    process.exitCode = 1;
  }
}
