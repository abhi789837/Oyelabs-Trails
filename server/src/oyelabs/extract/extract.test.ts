import fs from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { readLinkedDoc, readUploadedDoc } from "./docs";
import { assertPublicUrl, SafeFetchError } from "./fetch";
import { detectFormat, extractByFormat, parseCsv } from "./formats";
import { docFetchPlan, googleExportUrl } from "./google";
import { markdownBlocks, sourceCode, toPassages } from "./passages";
import { captionTracksFrom, parseJson3, parseXmlCaptions, youtubeCaptions } from "./youtube";

/**
 * v4.5 Phase 3 (PLAN §8, builder C): text extraction from the tiny fixtures in ./fixtures.
 * No network: link reads use an injected fetch and DNS lookup.
 */

const fixture = (name: string) => new Uint8Array(fs.readFileSync(path.join(__dirname, "fixtures", name)));
const publicLookup = async () => ["93.184.216.34"];

function respond(map: Record<string, { status?: number; type?: string; body?: string | Uint8Array; location?: string }>): typeof fetch {
  return (async (url: string) => {
    const hit = Object.entries(map).find(([prefix]) => url.startsWith(prefix))?.[1];
    if (!hit) return new Response("missing", { status: 404 });
    const headers: Record<string, string> = { "content-type": hit.type ?? "text/plain" };
    if (hit.location) headers.location = hit.location;
    return new Response(hit.body as ConstructorParameters<typeof Response>[0], { status: hit.status ?? 200, headers });
  }) as unknown as typeof fetch;
}

describe("formats", () => {
  test("a 2-page PDF gives page locators", async () => {
    const out = await extractByFormat("pdf", fixture("process-2-pages.pdf"));
    expect(out.method).toBe("pdf");
    const pages = new Set(out.blocks.map((b) => b.locator.page));
    expect([...pages]).toEqual([1, 2]);
    expect(out.blocks.find((b) => b.locator.page === 2)?.text).toMatch(/Handover checklist/);
  });

  test("a scanned PDF goes through OCR (rendered page → OCR function)", async () => {
    const seen: number[] = [];
    const out = await extractByFormat("pdf", fixture("scanned.pdf"), {
      ocr: async (png) => {
        seen.push(png.byteLength);
        return "Scanned policy: the project manager signs every invoice before it is sent to the client.";
      },
    });
    expect(seen).toHaveLength(1);
    expect(seen[0]).toBeGreaterThan(100);
    expect(out.method).toBe("ocr");
    expect(out.blocks[0]).toMatchObject({ locator: { page: 1 } });
  });

  test("a scanned PDF where OCR reads nothing says so plainly", async () => {
    const out = await extractByFormat("pdf", fixture("scanned.pdf"), { ocr: async () => "" });
    expect(out.blocks).toHaveLength(0);
    expect(out.emptyReason).toMatch(/Scanned PDF/);
  });

  test("DOCX headings become sections", async () => {
    const out = await extractByFormat("docx", fixture("escalations.docx"));
    expect(out.method).toBe("docx");
    expect(out.blocks.map((b) => b.locator.section)).toEqual(["Escalation policy", "Client communication"]);
  });

  test("PPTX gives one block per slide", async () => {
    const out = await extractByFormat("pptx", fixture("rituals.pptx"));
    expect(out.blocks.map((b) => b.locator.slide)).toEqual([1, 2]);
    expect(out.blocks[1].text).toMatch(/change request/);
  });

  test("XLSX rows read as 'Header: value' lines per sheet", async () => {
    const out = await extractByFormat("xlsx", fixture("rates.xlsx"));
    expect(out.blocks.map((b) => b.locator.sheet)).toEqual(["Rates", "Rates", "SLAs"]);
    expect(out.blocks[0].text).toBe("Role: Project manager; Hourly rate: 40; Notes: Billed for client calls");
  });

  test("Markdown headings become sections; TXT keeps # as text", async () => {
    const md = await extractByFormat("md", fixture("notes.md"));
    expect(md.blocks.map((b) => b.locator.section)).toEqual(["Daily stand-up", "Blockers"]);
    const txt = await extractByFormat("txt", new TextEncoder().encode("# Not a heading\n\nPlain line."));
    expect(txt.blocks.map((b) => b.locator.section)).toEqual([undefined, undefined]);
  });

  test("Readability keeps the article and drops navigation and footer", async () => {
    const out = await extractByFormat("html", fixture("page.html"));
    expect(out.method).toBe("readability");
    const text = out.blocks.map((b) => b.text).join(" ");
    expect(text).toMatch(/approving review/);
    expect(text).not.toMatch(/Careers|Copyright/);
    expect(out.blocks.at(-1)?.locator.section).toBe("Merging");
  });

  test("format detection: magic bytes first, then type, then extension", () => {
    expect(detectFormat(fixture("process-2-pages.pdf"), "application/octet-stream", "x.bin")).toBe("pdf");
    expect(detectFormat(fixture("escalations.docx"), null, null)).toBe("docx");
    expect(detectFormat(fixture("rituals.pptx"), null, null)).toBe("pptx");
    expect(detectFormat(fixture("rates.xlsx"), null, null)).toBe("xlsx");
    expect(detectFormat(new Uint8Array([1, 2]), null, "notes.md")).toBe("md");
    expect(detectFormat(new Uint8Array([1, 2]), null, "movie.mov")).toBeNull();
    expect(parseCsv('a,"b ""c""",d\r\n1,2,3')).toEqual([["a", 'b "c"', "d"], ["1", "2", "3"]]);
  });
});

describe("passages", () => {
  test("ids are stable for unchanged text and code blocks are never split", () => {
    const blocks = markdownBlocks(`# Deploy\n\n${"Ship it carefully. ".repeat(80)}\n\n\`\`\`\nnpm run build\nnpm run deploy\n\`\`\`\n`);
    const a = toPassages(blocks, { kind: "doc", id: "doc-1", title: "Deploy.md" });
    const b = toPassages(blocks, { kind: "doc", id: "doc-1", title: "Deploy.md" });
    expect(a).toEqual(b);
    expect(a.every((p) => p.id.startsWith(`${sourceCode("doc", "doc-1")}.`))).toBe(true);
    expect(a.every((p) => p.text.length <= 1200)).toBe(true);
    expect(a.some((p) => p.text.includes("npm run build\nnpm run deploy"))).toBe(true);
    expect(a[0].locator).toEqual({ section: "Deploy" });
  });
});

describe("links", () => {
  test("Google export URL mapping", () => {
    expect(googleExportUrl("https://docs.google.com/document/d/1AbCdEfGhIjKlMn/edit?usp=sharing")?.fetchUrl).toBe("https://docs.google.com/document/d/1AbCdEfGhIjKlMn/export?format=txt");
    expect(googleExportUrl("https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMn/edit#gid=42")?.fetchUrl).toBe("https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMn/export?format=csv&gid=42");
    expect(googleExportUrl("https://docs.google.com/presentation/d/1AbCdEfGhIjKlMn/edit")).toMatchObject({ kind: "gslides", fetchUrl: "https://docs.google.com/presentation/d/1AbCdEfGhIjKlMn/export?format=pdf", expect: "pdf" });
    expect(googleExportUrl("https://drive.google.com/file/d/1AbCdEfGhIjKlMn/view")?.fetchUrl).toBe("https://drive.google.com/uc?export=download&id=1AbCdEfGhIjKlMn");
    expect(docFetchPlan("https://www.dropbox.com/s/abc/Rates.xlsx?dl=0").fetchUrl).toBe("https://www.dropbox.com/s/abc/Rates.xlsx?raw=1");
    expect(docFetchPlan("https://example.com/handbook").kind).toBe("web");
  });

  test("a public Google Doc is read from its text export", async () => {
    const fetchImpl = respond({ "https://docs.google.com/document/d/1AbCdEfGhIjKlMn/export?format=txt": { body: "Kick-off\n\nThe kick-off call happens within two working days of signing." } });
    const out = await readLinkedDoc("https://docs.google.com/document/d/1AbCdEfGhIjKlMn/edit", null, { fetchImpl, lookup: publicLookup });
    expect(out).toMatchObject({ ok: true, method: "google_export" });
    if (out.ok) expect(out.blocks.map((b) => b.text)).toContain("The kick-off call happens within two working days of signing.");
  });

  test("a private Google Doc (sign-in redirect) gives the plain fix", async () => {
    const fetchImpl = respond({
      "https://docs.google.com/document/d/1AbCdEfGhIjKlMn/export": { status: 302, location: "https://accounts.google.com/ServiceLogin?continue=x" },
      "https://accounts.google.com/": { type: "text/html", body: "<title>Sign in - Google Accounts</title>" },
    });
    const out = await readLinkedDoc("https://docs.google.com/document/d/1AbCdEfGhIjKlMn/edit", null, { fetchImpl, lookup: publicLookup });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.reason).toMatch(/isn't shared publicly.*Anyone with the link/);
  });

  test("private and metadata addresses are refused", async () => {
    await expect(assertPublicUrl("http://127.0.0.1/file.mp4")).rejects.toBeInstanceOf(SafeFetchError);
    await expect(assertPublicUrl("http://169.254.169.254/latest/meta-data")).rejects.toBeInstanceOf(SafeFetchError);
    const out = await readLinkedDoc("http://10.0.0.5/secret.pdf", null, { lookup: publicLookup });
    expect(out.ok).toBe(false);
  });

  test("an uploaded file of an unknown kind is refused in plain words", async () => {
    const out = await readUploadedDoc(new Uint8Array([0, 1, 2, 3]), "application/octet-stream", "clip.mov", "sha");
    expect(out).toMatchObject({ ok: false });
  });
});

describe("YouTube captions", () => {
  test("caption tracks, json3 and XML are parsed", async () => {
    const html = `var x = {"captionTracks":[{"baseUrl":"https://www.youtube.com/api/timedtext?v=abc\\u0026lang=en","languageCode":"en","kind":"asr"}],"y":1};`;
    expect(captionTracksFrom(html)).toHaveLength(1);
    expect(parseJson3(JSON.stringify({ events: [{ tStartMs: 1500, dDurationMs: 2000, segs: [{ utf8: "Hello" }, { utf8: " team" }] }] }))).toEqual([{ start: 1.5, end: 3.5, text: "Hello team" }]);
    expect(parseXmlCaptions('<transcript><text start="2" dur="1.5">It&amp;#39;s fine</text></transcript>')).toEqual([{ start: 2, end: 3.5, text: "It's fine" }]);

    const fetchImpl = respond({
      "https://www.youtube.com/watch": { type: "text/html", body: html },
      "https://www.youtube.com/api/timedtext": { type: "application/json", body: JSON.stringify({ events: [{ tStartMs: 0, dDurationMs: 4000, segs: [{ utf8: "Welcome to the kick-off." }] }] }) },
    });
    expect(await youtubeCaptions("abc", { fetchImpl, lookup: publicLookup })).toEqual([{ start: 0, end: 4, text: "Welcome to the kick-off." }]);
    expect(await youtubeCaptions("abc", { fetchImpl: respond({}), lookup: publicLookup })).toBeNull();
  });
});
