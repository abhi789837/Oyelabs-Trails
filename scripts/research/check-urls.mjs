#!/usr/bin/env node
// Checks reference URLs: final status after redirects, and whether the page may be shown
// in an <iframe> on another site (X-Frame-Options / CSP frame-ancestors).
//
//   node scripts/research/check-urls.mjs <url> [url...]
//   node scripts/research/check-urls.mjs --file urls.txt
//
// Prints one JSON line per URL: { url, status, finalUrl, embeddable, reason }.

import fs from "node:fs";
import { pathToFileURL } from "node:url";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

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

export async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml", "accept-language": "en-US,en;q=0.9" },
      signal: AbortSignal.timeout(20000),
    });
    const verdict = frameVerdict(res.headers);
    // Consume a little of the body so the connection closes cleanly.
    await res.body?.cancel();
    return { url, status: res.status, finalUrl: res.url, ...verdict };
  } catch (err) {
    return { url, status: 0, finalUrl: null, embeddable: false, reason: `request failed: ${err.message}` };
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
const args = isMain ? process.argv.slice(2) : [];
if (args.length) {
  const urls = args[0] === "--file" ? fs.readFileSync(args[1], "utf8").split(/\s+/).filter(Boolean) : args;
  const results = await Promise.all(urls.map(checkUrl));
  for (const r of results) console.log(JSON.stringify(r));
}
