import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { createTestApp, type TestContext } from "../test/harness";

/**
 * Phase 9 performance (docs/v5/QUALITY.md, fix 8): the build writes .br/.gz copies of text assets
 * (vite.config.ts `precompressAssets`), and the static handler sends them on its own, so the app is
 * compressed without a proxy in front. API responses are left alone.
 */
describe("precompressed static assets", () => {
  let ctx: TestContext;
  let dist: string;
  const js = `export const big = ${JSON.stringify("x".repeat(4000))};\n`;

  beforeAll(async () => {
    dist = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-precompressed-"));
    fs.mkdirSync(path.join(dist, "assets"));
    fs.writeFileSync(path.join(dist, "index.html"), "<!doctype html><html><body><div id=root></div></body></html>");
    fs.writeFileSync(path.join(dist, "assets", "app-AbCdEf12.js"), js);
    fs.writeFileSync(path.join(dist, "assets", "app-AbCdEf12.js.br"), zlib.brotliCompressSync(js));
    fs.writeFileSync(path.join(dist, "assets", "app-AbCdEf12.js.gz"), zlib.gzipSync(js));
    // No compressed copy: sent as it is.
    fs.writeFileSync(path.join(dist, "assets", "plain-AbCdEf12.css"), "body{color:red}");
    ctx = await createTestApp({ CLIENT_DIST: dist });
  });

  afterAll(async () => {
    await ctx.close();
    fs.rmSync(dist, { recursive: true, force: true });
  });

  test("sends the brotli copy to a browser that accepts it, with the right type", async () => {
    const res = await ctx.app.inject({ method: "GET", url: "/assets/app-AbCdEf12.js", headers: { "accept-encoding": "gzip, deflate, br" } });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-encoding"]).toBe("br");
    expect(String(res.headers["content-type"])).toMatch(/javascript/);
    expect(String(res.headers.vary)).toMatch(/accept-encoding/i);
    expect(zlib.brotliDecompressSync(res.rawPayload).toString()).toBe(js);
  });

  test("falls back to gzip, then to the file itself", async () => {
    const gz = await ctx.app.inject({ method: "GET", url: "/assets/app-AbCdEf12.js", headers: { "accept-encoding": "gzip" } });
    expect(gz.headers["content-encoding"]).toBe("gzip");
    expect(zlib.gunzipSync(gz.rawPayload).toString()).toBe(js);
    const none = await ctx.app.inject({ method: "GET", url: "/assets/app-AbCdEf12.js", headers: { "accept-encoding": "identity" } });
    expect(none.headers["content-encoding"]).toBeUndefined();
    expect(none.payload).toBe(js);
    const css = await ctx.app.inject({ method: "GET", url: "/assets/plain-AbCdEf12.css", headers: { "accept-encoding": "br, gzip" } });
    expect(css.statusCode).toBe(200);
    expect(css.headers["content-encoding"]).toBeUndefined();
    expect(css.payload).toBe("body{color:red}");
  });

  test("leaves the SPA fallback and the API uncompressed", async () => {
    const page = await ctx.app.inject({ method: "GET", url: "/learn", headers: { "accept-encoding": "br, gzip" } });
    expect(page.statusCode).toBe(200);
    expect(page.headers["content-encoding"]).toBeUndefined();
    const api = await ctx.app.inject({ method: "GET", url: "/api/health", headers: { "accept-encoding": "br, gzip" } });
    expect(api.headers["content-encoding"]).toBeUndefined();
  });
});
