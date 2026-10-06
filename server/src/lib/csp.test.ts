import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { createTestApp, type TestContext } from "../test/harness";
import { buildCsp, buildRunnerCsp, RUNNER_PAGE_PATH } from "./csp";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const runnerHtml = path.join(repo, "public", "runner.html");

function scriptHash(file: string): string {
  const html = fs.readFileSync(file, "utf8");
  // A Windows checkout has CRLF; browsers hash the script with LF line breaks.
  const body = /<script>([\s\S]*?)<\/script>/.exec(html)![1].replace(/\r\n?/g, "\n");
  return `'sha256-${crypto.createHash("sha256").update(body, "utf8").digest("base64")}'`;
}

const sha = (text: string) => `'sha256-${crypto.createHash("sha256").update(text, "utf8").digest("base64")}'`;

describe("inline script hashes", () => {
  let dir: string;
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-csp-"));
  });
  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const script = "\n  (function () {\n    document.documentElement.classList.add('dark');\n  })();\n";
  const page = (body: string) => `<!doctype html><html><head><script>${body}</script><script type="module" src="/assets/x.js"></script></head></html>`;

  test("hash the script as the browser does, with LF line breaks, when the file has CRLF", () => {
    const file = path.join(dir, "crlf.html");
    fs.writeFileSync(file, page(script).replace(/\n/g, "\r\n"));
    const sources = buildCsp({ indexHtmlPath: file })["script-src"];
    expect(sources).toContain(sha(script));
    expect(sources).not.toContain(sha(script.replace(/\n/g, "\r\n")));
  });

  test("a lone CR is a line break too, and an LF file is unchanged", () => {
    const cr = path.join(dir, "cr.html");
    fs.writeFileSync(cr, page(script.replace(/\n/g, "\r")));
    expect(buildCsp({ indexHtmlPath: cr })["script-src"]).toContain(sha(script));
    const lf = path.join(dir, "lf.html");
    fs.writeFileSync(lf, page(script));
    const sources = buildCsp({ indexHtmlPath: lf })["script-src"];
    expect(sources).toContain(sha(script));
    // Only the inline script is hashed, not the module with a src.
    expect(sources.filter((s) => s.startsWith("'sha256-"))).toHaveLength(1);
  });
});

describe("app CSP", () => {
  test("never allows eval in the app itself", () => {
    const csp = buildCsp();
    expect(csp["script-src"]).not.toContain("'unsafe-eval'");
    expect(csp["script-src"]).toContain("'wasm-unsafe-eval'");
  });

  test("lets the page frame the same-origin runner, on http too", () => {
    expect(buildCsp()["frame-src"]).toContain("'self'");
  });
});

describe("runner CSP", () => {
  const policy = buildRunnerCsp({ runnerHtmlPath: runnerHtml });
  const directives = new Map(policy.split("; ").map((d) => [d.split(" ")[0], d.split(" ").slice(1)] as const));

  test("allows eval and the page's own inline script by hash, nothing else", () => {
    expect(directives.get("script-src")).toEqual([scriptHash(runnerHtml), "'unsafe-eval'"]);
    expect(directives.get("script-src")).not.toContain("'unsafe-inline'");
  });

  test("has no network, no forms, and can only be framed by the app", () => {
    expect(directives.get("default-src")).toEqual(["'none'"]);
    expect(directives.has("connect-src")).toBe(false);
    expect(directives.get("form-action")).toEqual(["'none'"]);
    expect(directives.get("base-uri")).toEqual(["'none'"]);
    expect(directives.get("frame-ancestors")).toEqual(["'self'"]);
    expect(directives.get("worker-src")).toEqual(["blob:"]);
  });

  test("speaks the same protocol as src/lib/sandboxRunner.ts", () => {
    // Read as text: the client module needs the DOM lib, which the server build doesn't have.
    const client = fs.readFileSync(path.join(repo, "src", "lib", "sandboxRunner.ts"), "utf8");
    const RUNNER_CHANNEL = /export const RUNNER_CHANNEL = "([^"]+)"/.exec(client)![1];
    const RUNNER_PATH = /export const RUNNER_PATH = "([^"]+)"/.exec(client)![1];
    const html = fs.readFileSync(runnerHtml, "utf8");
    expect(RUNNER_PATH).toBe(RUNNER_PAGE_PATH);
    expect(html).toContain(`var CHANNEL = "${RUNNER_CHANNEL}"`);
    for (const type of ['"ready"', '"worker"', '"worker-error"', '"run"']) expect(html).toContain(type);
    // No external script: the page's policy has no source to load one from.
    expect(html).not.toMatch(/<script[^>]+src=/);
  });
});

describe("served headers", () => {
  let ctx: TestContext;
  let dist: string;

  beforeAll(async () => {
    dist = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-csp-"));
    fs.writeFileSync(path.join(dist, "index.html"), "<!doctype html><html><body><div id=root></div></body></html>");
    fs.copyFileSync(runnerHtml, path.join(dist, "runner.html"));
    ctx = await createTestApp({ CLIENT_DIST: dist });
  });

  afterAll(async () => {
    await ctx.close();
    fs.rmSync(dist, { recursive: true, force: true });
  });

  test("/runner.html carries the runner's own policy, not the app's", async () => {
    const res = await ctx.app.inject({ method: "GET", url: "/runner.html" });
    expect(res.statusCode).toBe(200);
    const csp = String(res.headers["content-security-policy"]);
    expect(csp).toBe(buildRunnerCsp({ runnerHtmlPath: path.join(dist, "runner.html") }));
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("default-src 'none'");
  });

  test("every other page keeps the app policy, without eval", async () => {
    for (const url of ["/", "/learn/lesson/js-closures", "/runner.html.bak", "/api/health"]) {
      const res = await ctx.app.inject({ method: "GET", url });
      const csp = String(res.headers["content-security-policy"]);
      expect(csp, url).toContain("default-src 'self'");
      expect(csp, url).not.toContain("'unsafe-eval'");
    }
  });
});
