import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

import { schema } from "../db";
import { activeLearner, adminSession, createTestApp, type TestContext } from "../test/harness";
import { issueCertificate } from "../v5/certificates/repo";
import { buildCsp } from "./csp";
import { ogDeps, rewriteOgMeta } from "./ogPages";

const repo = path.resolve(__dirname, "../../..");
// The real index.html: its OG tags and its inline theme script are what production rewrites.
const INDEX = fs.readFileSync(path.join(repo, "index.html"), "utf8");

const meta = {
  title: 'Docker: certificate for Ana "A" <Lee> · Oyelearn',
  description: "Ana completed Docker on Oyelearn.",
  url: "https://learn.oyegen.com/verify/OYL-AB12-CD34",
  image: "https://learn.oyegen.com/cert.png",
  imageAlt: "Oyelearn certificate",
};

const content = (html: string, attr: string, key: string) => new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`).exec(html)?.[1];

describe("rewriteOgMeta", () => {
  const out = rewriteOgMeta(INDEX, meta);

  test("sets title, description, og:* and twitter:* (escaped)", () => {
    expect(out).toContain("<title>Docker: certificate for Ana &quot;A&quot; &lt;Lee&gt; · Oyelearn</title>");
    expect(content(out, "property", "og:title")).toBe("Docker: certificate for Ana &quot;A&quot; &lt;Lee&gt; · Oyelearn");
    expect(content(out, "property", "og:description")).toBe(meta.description);
    expect(content(out, "name", "description")).toBe(meta.description);
    expect(content(out, "property", "og:url")).toBe(meta.url);
    expect(content(out, "property", "og:image")).toBe(meta.image);
    expect(content(out, "name", "twitter:image")).toBe(meta.image);
    expect(content(out, "name", "twitter:title")).toContain("certificate for Ana");
    expect(content(out, "property", "og:image:alt")).toBe(meta.imageAlt);
    // Each tag once; unknown image size drops the default's 1200×630.
    expect(out.match(/property="og:image"/g)).toHaveLength(1);
    expect(out).not.toContain('property="og:image:width"');
    expect(rewriteOgMeta(INDEX, { ...meta, imageWidth: 2480, imageHeight: 1754 })).toContain('<meta property="og:image:width" content="2480" />');
  });

  test("only meta and title change: the inline scripts, so the CSP hashes, are identical", () => {
    const scripts = (html: string) => [...html.matchAll(/<script\b[\s\S]*?<\/script>/gi)].map((m) => m[0]);
    expect(scripts(out)).toEqual(scripts(INDEX));
    expect(scripts(INDEX).length).toBeGreaterThan(0);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "og-csp-"));
    try {
      fs.writeFileSync(path.join(dir, "a.html"), INDEX);
      fs.writeFileSync(path.join(dir, "b.html"), out);
      const before = buildCsp({ indexHtmlPath: path.join(dir, "a.html") })["script-src"];
      expect(before.some((s) => s.startsWith("'sha256-"))).toBe(true);
      expect(buildCsp({ indexHtmlPath: path.join(dir, "b.html") })["script-src"]).toEqual(before);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    expect(out.replace(/<title>[^<]*<\/title>|<meta [^>]*>/g, "").replace(/\s+/g, "")).toBe(INDEX.replace(/<title>[^<]*<\/title>|<meta [^>]*>/g, "").replace(/\s+/g, ""));
  });

  test("a missing tag is added inside the head", () => {
    const bare = "<!doctype html><html><head><title>x</title></head><body></body></html>";
    const result = rewriteOgMeta(bare, meta);
    expect(result).toMatch(/<meta property="og:image" content="https:\/\/learn\.oyegen\.com\/cert\.png" \/>\s*<\/head>|<meta property="og:image" [^>]*\/>[\s\S]*<\/head>/);
    expect(result.indexOf("og:title")).toBeLessThan(result.indexOf("</head>"));
  });
});

describe("GET /verify/:id (server-rendered preview)", () => {
  let dist: string;
  let ctx: TestContext;
  let learnerId: string;

  beforeAll(() => {
    dist = fs.mkdtempSync(path.join(os.tmpdir(), "og-dist-"));
    fs.writeFileSync(path.join(dist, "index.html"), INDEX);
  });
  afterAll(() => fs.rmSync(dist, { recursive: true, force: true }));

  beforeEach(async () => {
    ctx = await createTestApp({ CLIENT_DIST: dist, PUBLIC_ORIGIN: "https://learn.oyegen.com" });
    learnerId = (await activeLearner(ctx, await adminSession(ctx))).id;
  });
  const defaultImage = ogDeps.certificateImage;
  afterEach(async () => {
    ogDeps.certificateImage = defaultImage;
    await ctx.close();
  });

  const issue = () =>
    issueCertificate(ctx.db, learnerId, { kind: "course", refId: "c1", title: "Docker in practice", trackId: "", topicIds: [], averageScore: null, at: Date.now() })!;

  test("a valid certificate: its title, holder, URL and its public PNG (Phase 5's preview.png)", async () => {
    const id = issue();
    const res = await ctx.app.inject({ method: "GET", url: `/verify/${id}` });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    const holder = ctx.db.select().from(schema.certificates).where(eq(schema.certificates.id, id)).get()!.learnerName;
    expect(content(res.body, "property", "og:title")).toBe(`Docker in practice: certificate for ${holder} · Oyelearn`);
    expect(content(res.body, "property", "og:description")).toContain(`${holder} completed Docker in practice on Oyelearn.`);
    expect(content(res.body, "property", "og:url")).toBe(`https://learn.oyegen.com/verify/${id}`);
    expect(content(res.body, "property", "og:image")).toBe(`https://learn.oyegen.com/api/v5/certificates/${id}/preview.png`);
    expect(content(res.body, "property", "og:image:width")).toBe("1754");
    expect(content(res.body, "property", "og:image:height")).toBe("1240");
    expect(content(res.body, "property", "og:image:alt")).toBe(`Oyelearn certificate: ${holder}, Docker in practice`);
  });

  test("no certificate image: the default brand image and its size", async () => {
    ogDeps.certificateImage = () => null;
    const id = issue();
    const res = await ctx.app.inject({ method: "GET", url: `/verify/${id}` });
    expect(content(res.body, "property", "og:image")).toBe("https://learn.oyegen.com/og-image.png?v=2");
    expect(content(res.body, "property", "og:image:width")).toBe("1200");
  });

  test("og:image is whatever the certificate image says, made absolute", async () => {
    ogDeps.certificateImage = (certId) => ({ url: `/api/v5/certificates/${certId}/image.png`, width: 2480, height: 1754 });
    const id = issue();
    const res = await ctx.app.inject({ method: "GET", url: `/verify/${id}` });
    expect(content(res.body, "property", "og:image")).toBe(`https://learn.oyegen.com/api/v5/certificates/${id}/image.png`);
    expect(content(res.body, "name", "twitter:image")).toBe(`https://learn.oyegen.com/api/v5/certificates/${id}/image.png`);
    expect(content(res.body, "property", "og:image:width")).toBe("2480");
  });

  test("revoked and unknown certificates get a plain preview, never the holder's name", async () => {
    ogDeps.certificateImage = () => ({ url: "/cert.png" });
    const id = issue();
    ctx.db.update(schema.certificates).set({ revokedAt: Date.now() }).where(eq(schema.certificates.id, id)).run();
    const revoked = await ctx.app.inject({ method: "GET", url: `/verify/${id}` });
    expect(content(revoked.body, "property", "og:title")).toBe("Certificate revoked · Oyelearn");
    expect(content(revoked.body, "property", "og:image")).toBe("https://learn.oyegen.com/og-image.png?v=2");
    const unknown = await ctx.app.inject({ method: "GET", url: "/verify/OYL-ZZZZ-ZZZZ" });
    expect(unknown.statusCode).toBe(200);
    expect(content(unknown.body, "property", "og:title")).toBe("Check a certificate · Oyelearn");
    const junk = await ctx.app.inject({ method: "GET", url: "/verify/%3Cscript%3E" });
    expect(junk.statusCode).toBe(200);
    expect(junk.body).not.toContain("<script>alert");
    expect(content(junk.body, "property", "og:url")).toBe("https://learn.oyegen.com/verify/%3Cscript%3E");
  });

  test("other pages keep index.html's default preview", async () => {
    const res = await ctx.app.inject({ method: "GET", url: "/learn" });
    expect(res.statusCode).toBe(200);
    expect(content(res.body, "property", "og:title")).toBe("Oyelearn");
    expect(content(res.body, "property", "og:image")).toBe("https://learn.oyegen.com/og-image.png?v=2");
  });
});
