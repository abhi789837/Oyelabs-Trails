import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { eq } from "drizzle-orm";
import { encode } from "uqr";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

import { isCertificateId, verifyUrlFor } from "../../../../shared/certificates";
import { schema } from "../../db";
import { newId, now } from "../../lib/ids";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../../test/harness";
import { certificatesDir } from "./files";
import { certificateAssetsDir, certificateRuntime, measurer, qrFor, renderCertificatePdf, renderCertificatePng } from "./render";
import { certificatesReportPdf } from "./reportPdf";
import { COLOURS, fitText, layoutCertificate, NAME_STEPS, PAGE, parseTemplate, SEAL_TOP, TEXT_MAX_WIDTH, wrapLines, type CertificateInput, type Measure } from "./template";

/**
 * Rebrand Phase 5: the certificate drawn from the kit's template (PDF with Outfit embedded, 2× PNG),
 * long names that shrink and wrap, the QR, and the routes that serve the files and the verify states.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const KIT = path.resolve(here, "../../../../Oyelearn-Brand-Kit/09-print/certificate-template-a4.svg");

let measure: Measure;
beforeAll(async () => {
  const { canvas } = await certificateRuntime();
  measure = measurer(canvas);
});

const base: CertificateInput = {
  holderName: "Asha Learner",
  title: "Docker in practice",
  kind: "course",
  issuedAt: Date.UTC(2026, 9, 7),
  verifyUrl: "https://learn.oyegen.com/verify/OYL-AB12-CD34-EF56-GH78",
  signature: null,
};

describe("the kit template", () => {
  test("is the kit's file byte for byte, with Outfit's licence next to the fonts", () => {
    const dir = certificateAssetsDir();
    if (fs.existsSync(KIT)) expect(fs.readFileSync(path.join(dir, "certificate-template-a4.svg")).equals(fs.readFileSync(KIT))).toBe(true);
    for (const f of ["Outfit-Regular.ttf", "Outfit-Medium.ttf", "Outfit-SemiBold.ttf", "OFL.txt"]) expect(fs.existsSync(path.join(dir, "fonts", f))).toBe(true);
  });

  test("parses: A4 at 150 dpi, ten placeholder texts dropped, the logo, double border, rules and seal kept", () => {
    const t = parseTemplate(fs.readFileSync(path.join(certificateAssetsDir(), "certificate-template-a4.svg"), "utf8"));
    expect([t.width, t.height]).toEqual([PAGE.width, PAGE.height]);
    expect(t.placeholders).toHaveLength(10);
    // [Learner Name] in Night Navy at the kit's position, [Course Title] in Oyelabs Blue.
    expect(t.placeholders).toContainEqual({ x: 571.96, y: 570, fill: COLOURS.navy });
    expect(t.placeholders).toContainEqual({ x: 732.74, y: 730, fill: COLOURS.blue });
    expect(t.logo).not.toBeNull();
    const rects = t.ops.filter((o) => o.kind === "rect");
    expect(rects.some((r) => r.kind === "rect" && r.stroke === COLOURS.blue && r.rx === 24)).toBe(true);
    expect(rects.some((r) => r.kind === "rect" && r.stroke === "#E1EBFA")).toBe(true);
    expect(rects.filter((r) => r.kind === "rect" && r.fill === "#D5DCE8")).toHaveLength(2);
    // The faint ring device (6% opacity) and the full-colour seal.
    const groups = t.ops.filter((o) => o.kind === "group");
    expect(groups.some((g) => g.kind === "group" && g.opacity === 0.06)).toBe(true);
    expect(groups.filter((g) => g.kind === "group" && g.opacity === 1 && g.children.some((c) => c.kind === "circle" && c.fill === "#F59E0B"))).not.toHaveLength(0);
  });

  test("rejects what it doesn't understand instead of drawing it wrong", () => {
    expect(() => parseTemplate('<svg viewBox="0 0 10 10"><text>hi</text></svg>')).toThrow(/unsupported element/);
    expect(() => parseTemplate('<svg viewBox="0 0 10 10"><g transform="rotate(4)"><rect/></g></svg>')).toThrow(/unsupported transform/);
  });
});

describe("fitting long names and titles", () => {
  const widths = (lines: string[], size: number) => lines.map((l) => measure(l, { weight: 600, size }));

  test("a short name and title keep the kit's sizes and positions", () => {
    const l = layoutCertificate(base, measure);
    expect(l.name).toMatchObject({ size: 84, lines: ["Asha Learner"], truncated: false });
    expect(l.title).toMatchObject({ size: 48, lines: ["Docker in practice"] });
    const at = (role: string) => l.runs.find((r) => r.role === role)!;
    expect(Math.round(at("name").y)).toBe(570);
    expect(Math.round(at("connector").y)).toBe(650);
    expect(Math.round(at("title").y)).toBe(730);
    expect(at("heading").text).toBe("CERTIFICATE OF COMPLETION");
    expect(at("connector").text).toBe("has completed");
    expect(at("date").text).toBe("7 October 2026");
    expect(at("signature")).toMatchObject({ text: "Oyelabs" });
    expect(at("signature-label").text).toBe("Issued by");
    expect(at("verify").text).toBe("Verify: learn.oyegen.com/verify/OYL-AB12-CD34-EF56-GH78");
    // Every run is centred on the template's own columns.
    expect(at("name").cx).toBe(877);
    expect(at("date").cx).toBe(360);
    expect(at("signature").cx).toBe(1394);
  });

  test("a long name shrinks on one line first, then wraps; never more than three lines; always inside the margins", () => {
    const medium = layoutCertificate({ ...base, holderName: "Maximiliana Alexandra Fitzgerald-Montgomery" }, measure);
    expect(medium.name.lines).toHaveLength(1);
    expect(medium.name.size).toBeLessThan(84);
    expect(medium.name.size).toBeGreaterThanOrEqual(NAME_STEPS[0]!.min);

    const long = layoutCertificate({ ...base, holderName: "Maximiliana Alexandra Fitzgerald-Montgomery de la Cruz Wolfeschlegelsteinhausen" }, measure);
    expect(long.name.lines.length).toBe(2);
    for (const w of widths(long.name.lines, long.name.size)) expect(w).toBeLessThanOrEqual(TEXT_MAX_WIDTH);
    // Balanced: the two lines are within a third of each other, not "everything" / "one word".
    const [a, b] = widths(long.name.lines, long.name.size);
    expect(Math.min(a!, b!) / Math.max(a!, b!)).toBeGreaterThan(0.6);

    const huge = layoutCertificate({ ...base, holderName: "Wolfeschlegelsteinhausenbergerdorff ".repeat(5).trim() }, measure);
    expect(huge.name.lines.length).toBeLessThanOrEqual(3);
    for (const w of widths(huge.name.lines, huge.name.size)) expect(w).toBeLessThanOrEqual(TEXT_MAX_WIDTH);
  });

  test("a long title wraps at most twice and the block stays above the seal, even with a long name", () => {
    const title = "Designing reliable distributed systems at scale: replication, partitioning, consensus, observability and the operational practices that keep them up at three in the morning";
    const l = layoutCertificate({ ...base, holderName: "Maximiliana Alexandra Fitzgerald-Montgomery de la Cruz Wolfeschlegelsteinhausen", title }, measure);
    expect(l.title.lines.length).toBeGreaterThan(1);
    expect(l.title.lines.length).toBeLessThanOrEqual(3);
    for (const w of widths(l.title.lines, l.title.size)) expect(w).toBeLessThanOrEqual(TEXT_MAX_WIDTH);
    expect(l.contentBottom).toBeLessThan(SEAL_TOP);
    // Nothing is lost: the words on the lines are the title's words.
    expect(l.title.lines.join(" ")).toBe(title);
  });

  test("only text too long for three lines at the smallest size is cut, with an ellipsis", () => {
    const fitted = fitText("word ".repeat(400), measure, { maxWidth: TEXT_MAX_WIDTH, weight: 600, steps: NAME_STEPS });
    expect(fitted.truncated).toBe(true);
    expect(fitted.lines).toHaveLength(3);
    expect(fitted.lines[2]!.endsWith("…")).toBe(true);
  });

  test("wrapLines breaks a word wider than the line between letters", () => {
    const w = (s: string) => s.length * 10;
    expect(wrapLines("aaaaaaaaaaaa bb", 50, w)).toEqual(["aaaaa", "aaaaa", "aa bb"]);
    expect(wrapLines("", 50, w)).toEqual([]);
  });

  test("the signature block shows the admin's signatory when set, and fits a long title", () => {
    const l = layoutCertificate({ ...base, signature: { name: "Abhishek Singh Chauhan", title: "Lead Software Engineer" } }, measure);
    expect(l.runs.find((r) => r.role === "signature")!.text).toBe("Abhishek Singh Chauhan");
    const label = l.runs.find((r) => r.role === "signature-label")!;
    expect(label.text).toBe("Lead Software Engineer, Oyelabs");
    expect(measure(label.text, label.font)).toBeLessThanOrEqual(300);
  });
});

/** Reads the QR back out of the PNG, module by module, and compares it with the expected code. */
async function qrMatches(png: Buffer, scale: number, url: string): Promise<boolean> {
  const { canvas } = await certificateRuntime();
  const img = await canvas.loadImage(png);
  const c = canvas.createCanvas(img.width, img.height);
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const box = layoutCertificate({ ...base, verifyUrl: url }, measure).qr;
  const expected = encode(url, { ecc: "M", border: 0 });
  const step = (box.size * scale) / expected.size;
  for (let y = 0; y < expected.size; y++) {
    for (let x = 0; x < expected.size; x++) {
      const px = ctx.getImageData(Math.floor(box.x * scale + (x + 0.5) * step), Math.floor(box.y * scale + (y + 0.5) * step), 1, 1).data;
      const dark = px[0]! < 128;
      if (dark !== expected.data[y]![x]) return false;
    }
  }
  return true;
}

describe("generating the files", () => {
  test("PDF: A4 landscape, vector, Outfit embedded as TrueType (not outlines), real text, the verify link", async () => {
    const pdf = await renderCertificatePdf(base);
    const raw = pdf.toString("latin1");
    expect(raw.startsWith("%PDF-")).toBe(true);
    // A4 landscape (Skia rounds 841.89 × 595.28 pt to whole points).
    expect(raw.match(/\/MediaBox \[[^\]]*\]/)?.[0]).toBe("/MediaBox [0 0 842 595]");
    expect([...new Set(raw.match(/\/BaseFont \/[A-Z]{6}\+[\w-]+/g) ?? [])].map((f) => f.split("+")[1]).sort()).toEqual(["Outfit-Regular", "Outfit-SemiBold"]);
    expect(raw.includes("/FontFile2")).toBe(true);
    expect(raw.includes("/Type3")).toBe(false);
    expect(raw.includes(`/URI (${base.verifyUrl})`)).toBe(true);
    const { extractText, getDocumentProxy } = await import("unpdf");
    const { text } = await extractText(await getDocumentProxy(new Uint8Array(pdf)), { mergePages: true });
    // The tracked heading comes back letter-spaced from a text extractor.
    expect(text.replace(/\s+/g, "")).toContain("CERTIFICATEOFCOMPLETION");
    for (const words of ["This certifies that", "Asha Learner", "has completed", "Docker in practice", "7 October 2026", "learn.oyegen.com/verify/OYL-AB12-CD34-EF56-GH78"]) {
      expect(text.replace(/\s+/g, " ")).toContain(words);
    }
  });

  test("PNG at 2× is 3508 × 2480; the preview at 1× is 1754 × 1240", async () => {
    const size = (b: Buffer) => [b.readUInt32BE(16), b.readUInt32BE(20)];
    const two = await renderCertificatePng(base, 2);
    expect(two.readUInt32BE(0)).toBe(0x89504e47);
    expect(size(two)).toEqual([3508, 2480]);
    expect(size(await renderCertificatePng(base, 1))).toEqual([1754, 1240]);
  });

  test("the QR encodes the certificate's verify URL (and not another one)", async () => {
    const png = await renderCertificatePng(base, 2);
    expect(await qrMatches(png, 2, base.verifyUrl)).toBe(true);
    expect(await qrMatches(png, 2, "https://learn.oyegen.com/verify/OYL-ZZZZ-ZZZZ-ZZZZ-ZZZZ")).toBe(false);
    expect(qrFor(base.verifyUrl).modules).toBe(encode(base.verifyUrl, { ecc: "M", border: 0 }).size);
  });

  test("the certificates report: branded, paged, with page numbers", async () => {
    const row = { id: "OYL-AB12-CD34-EF56-GH78", kind: "course" as const, refId: "c", title: "Docker in practice", holderName: "Asha Learner", issuedAt: base.issuedAt, trackId: "", topicCount: 1, averageScore: null, revokedAt: null, verifyPath: "/verify/x", verifyUrl: "x", userId: "u", accountName: "asha" };
    const pdf = await certificatesReportPdf(Array.from({ length: 40 }, () => row), base.issuedAt);
    const { extractText, getDocumentProxy } = await import("unpdf");
    const doc = await getDocumentProxy(new Uint8Array(pdf));
    expect(doc.numPages).toBe(2);
    const { text } = await extractText(doc, { mergePages: false });
    expect(text[0]).toContain("Certificates issued");
    expect(text[0]).toContain("Page 1 of 2");
    expect(text[1]).toContain("Page 2 of 2");
    expect(text[1]).toContain("Oyelearn, the learning platform of Oyelabs");
    expect(/\/BaseFont \/[A-Z]{6}\+Outfit-/.test(pdf.toString("latin1"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

describe("serving certificates", () => {
  let ctx: TestContext;
  let admin: Session;
  let learner: { id: string; username: string; session: Session };

  beforeEach(async () => {
    ctx = await createTestApp();
    admin = await adminSession(ctx);
    learner = await activeLearner(ctx, admin);
  });
  afterEach(async () => {
    await ctx.close();
  });

  const get = (url: string, session: Session | null = learner.session) => ctx.app.inject({ method: "GET", url, ...(session ? as(session) : {}) });

  async function issueGoalCertificate(): Promise<string> {
    const at = now();
    ctx.db
      .insert(schema.learnerGoals)
      .values({ id: newId(), userId: learner.id, type: "text", originalText: "Ship a release", outcome: "Ship a release", skillIds: ["eng-git"], targetLevel: 3, slider: 3, position: 0, status: "achieved", achievedAt: at, source: "admin", createdAt: at, updatedAt: at })
      .run();
    const res = (await get("/api/v5/certificates")).json();
    return res.certificates[0].id as string;
  }

  test("new certificates get 80-bit codes and the full verify link on the configured origin", async () => {
    const id = await issueGoalCertificate();
    expect(id).toMatch(/^OYL-[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/);
    expect(isCertificateId(id)).toBe(true);
    const mine = (await get(`/api/v5/certificates/${id}`)).json().certificate;
    expect(mine.verifyUrl).toBe(verifyUrlFor(ctx.env.publicOrigin, id));
    const me = (await get("/api/v5/me/profile")).json();
    expect(me.certificates[0].verifyUrl).toBe(mine.verifyUrl);
  });

  test("the learner downloads the PDF and the 2× PNG; files are drawn once and served from disk", async () => {
    const id = await issueGoalCertificate();
    const pdf = await get(`/api/v5/certificates/${id}/file.pdf?download=1`);
    expect(pdf.statusCode).toBe(200);
    expect(pdf.headers["content-type"]).toBe("application/pdf");
    expect(pdf.headers["content-disposition"]).toBe(`attachment; filename="oyelearn-certificate-${id}.pdf"`);
    expect(pdf.rawPayload.subarray(0, 5).toString()).toBe("%PDF-");

    const png = await get(`/api/v5/certificates/${id}/file.png`);
    expect(png.statusCode).toBe(200);
    expect(png.headers["content-type"]).toBe("image/png");
    expect(png.headers["content-disposition"]).toMatch(/^inline;/);
    expect(png.rawPayload.readUInt32BE(16)).toBe(3508);

    const dir = certificatesDir(ctx.env.dataDir);
    const before = fs.readdirSync(dir).filter((f) => f.startsWith(id));
    expect(before).toHaveLength(2);
    const again = await get(`/api/v5/certificates/${id}/file.pdf`);
    expect(again.rawPayload.equals(pdf.rawPayload)).toBe(true);
    expect(fs.readdirSync(dir).filter((f) => f.startsWith(id))).toEqual(before);

    // Someone else's is a 404; no session is a 401.
    const other = await activeLearner(ctx, admin, "learner.two");
    expect((await get(`/api/v5/certificates/${id}/file.pdf`, other.session)).statusCode).toBe(404);
    expect((await get(`/api/v5/certificates/${id}/file.pdf`, null)).statusCode).toBe(401);
  });

  test("correcting the name draws new files and deletes the old ones", async () => {
    const id = await issueGoalCertificate();
    await get(`/api/v5/certificates/${id}/file.pdf`);
    const dir = certificatesDir(ctx.env.dataDir);
    const first = fs.readdirSync(dir).filter((f) => f.startsWith(id));
    const res = await ctx.app.inject({ method: "PUT", url: "/api/v5/certificates/name", payload: { name: "Asha  K. Learner" }, ...as(learner.session) });
    expect(res.statusCode).toBe(200);
    const pdf = await get(`/api/v5/certificates/${id}/file.pdf`);
    const { extractText, getDocumentProxy } = await import("unpdf");
    const { text } = await extractText(await getDocumentProxy(new Uint8Array(pdf.rawPayload)), { mergePages: true });
    expect(text).toContain("Asha K. Learner");
    const now2 = fs.readdirSync(dir).filter((f) => f.startsWith(id));
    expect(now2).toHaveLength(1);
    expect(now2[0]).not.toBe(first[0]);
  });

  test("verify: valid shows a public preview; revoked has none (410) and downloads stop; unknown codes are 404", async () => {
    const id = await issueGoalCertificate();
    const pub = (await get(`/api/v5/certificates/${id}/public`, null)).json().certificate;
    expect(pub).toMatchObject({ status: "valid", holderName: "Learner One", title: "Ship a release" });
    expect(Object.keys(pub).sort()).toEqual(["holderName", "id", "issuedAt", "kind", "revokedAt", "status", "title"]);
    const preview = await get(`/api/v5/certificates/${id}/preview.png`, null);
    expect(preview.statusCode).toBe(200);
    expect(preview.headers["cache-control"]).toBe("public, max-age=300");
    expect(preview.rawPayload.readUInt32BE(16)).toBe(1754);

    expect((await ctx.app.inject({ method: "POST", url: `/api/admin/v5/certificates/${id}/revoke`, payload: {}, ...as(admin) })).statusCode).toBe(200);
    expect((await get(`/api/v5/certificates/${id}/public`, null)).json().certificate.status).toBe("revoked");
    expect((await get(`/api/v5/certificates/${id}/preview.png`, null)).statusCode).toBe(410);
    expect((await get(`/api/v5/certificates/${id}/file.pdf`)).statusCode).toBe(410);

    expect((await get("/api/v5/certificates/OYL-0000-0000-0000-0000/public", null)).statusCode).toBe(404);
    expect((await get("/api/v5/certificates/OYL-0000-0000-0000-0000/preview.png", null)).statusCode).toBe(404);
    expect((await get("/api/v5/certificates/not-a-code/preview.png", null)).statusCode).toBe(404);
  });

  test("admin: the signature setting (staff only, audited, a placeholder until set), regenerate, any PDF, the report", async () => {
    const id = await issueGoalCertificate();
    expect((await ctx.app.inject({ method: "PUT", url: "/api/admin/v5/certificates/signature", payload: { name: "X" }, ...as(learner.session) })).statusCode).toBe(403);
    expect((await get("/api/admin/v5/certificates/signature", admin)).json().signature).toBeNull();

    const set = await ctx.app.inject({ method: "PUT", url: "/api/admin/v5/certificates/signature", payload: { name: " Abhishek  Singh Chauhan ", title: "Lead Software Engineer" }, ...as(admin) });
    expect(set.json().signature).toEqual({ name: "Abhishek Singh Chauhan", title: "Lead Software Engineer" });
    const audit = ctx.db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "certificate.signature")).all();
    expect(audit).toHaveLength(1);

    const pdf = await get(`/api/admin/v5/certificates/${id}/file.pdf`, admin);
    expect(pdf.statusCode).toBe(200);
    const { extractText, getDocumentProxy } = await import("unpdf");
    const { text } = await extractText(await getDocumentProxy(new Uint8Array(pdf.rawPayload)), { mergePages: true });
    expect(text).toContain("Abhishek Singh Chauhan");
    expect(text).toContain("Lead Software Engineer, Oyelabs");

    const regen = await ctx.app.inject({ method: "POST", url: `/api/admin/v5/certificates/${id}/regenerate`, payload: {}, ...as(admin) });
    expect(regen.statusCode).toBe(200);
    expect(fs.readdirSync(certificatesDir(ctx.env.dataDir)).filter((f) => f.startsWith(id))).toHaveLength(3);

    // Clearing the name goes back to the neutral placeholder.
    await ctx.app.inject({ method: "PUT", url: "/api/admin/v5/certificates/signature", payload: { name: "", title: "" }, ...as(admin) });
    expect((await get("/api/admin/v5/certificates", admin)).json().signature).toBeNull();

    const report = await get("/api/admin/v5/certificates/report.pdf", admin);
    expect(report.statusCode).toBe(200);
    expect(report.rawPayload.subarray(0, 5).toString()).toBe("%PDF-");
    expect((await get("/api/admin/v5/certificates/report.pdf")).statusCode).toBe(403);
  });
});
