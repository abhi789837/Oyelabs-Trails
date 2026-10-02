import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { Term } from "../../../shared/handbook";
import { MockProvider } from "../ai/adapters/mock";
import { citedRefs } from "../bank/repo";
import type { GenerateJsonRequest, GenerateJsonResult } from "../ai/types";
import { schema } from "../db";
import { ensureHandbookSeed, getRow, handbookFolder, loadHandbookSeed, rowsOf } from "../handbook/repo";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";
import { nextBox } from "./handbook";

// ---------------------------------------------------------------------------
// Fixture: a tiny seed folder. Ids start with `zz-` so they never collide with the real seeds.
// ---------------------------------------------------------------------------

const term = (id: string, name: string, extra: Partial<Term> = {}) => ({
  id,
  name,
  aka: [],
  category: "scope",
  projectTypes: ["custom"],
  definition: `${name}: the industry definition.`,
  oyelabsMeaning: "[Oyelabs SOP – admin to confirm] What we call it.",
  example: "A client asks for a new report after sign-off.",
  clientSentence: "This is new work, so it needs its own estimate.",
  impact: "Typically adds time and cost.",
  ...extra,
});

const FIXTURE = {
  "terms-zz.json": [
    term("zz-change", "ZZ Change request", { status: "to-confirm" }),
    term("zz-bug", "ZZ Bug", { category: "quality" }),
    { id: "zz-broken", name: "Missing everything" },
  ],
  "rules.json": [
    {
      id: "zz-cr-rule",
      name: "ZZ When a CR is needed",
      category: "scope",
      projectTypes: ["custom", "whitelabel"],
      statement: "A change request is needed when the client asks for behaviour outside the signed scope.",
      terms: ["zz-change"],
    },
  ],
  "stages.json": [
    {
      id: "zz-stage-two",
      projectType: "custom",
      order: 2,
      name: "ZZ Discovery",
      purpose: "Turn the SOW into stories.",
      entryCriteria: ["SOW signed"],
      exitCriteria: ["Requirements signed off"],
      raci: [{ activity: "Write stories", responsible: "BA", accountable: "PM" }],
      clientTouchpoints: ["Workshop"],
      typicalDuration: "Typically 1–2 weeks",
      pitfalls: ["Skipping sign-off"],
    },
    {
      id: "zz-stage-one",
      projectType: "custom",
      order: 1,
      name: "ZZ Handover",
      purpose: "BD hands the project to delivery.",
      entryCriteria: ["Deal won"],
      exitCriteria: ["Handover done"],
      raci: [],
      clientTouchpoints: [],
      typicalDuration: "Typically 1–3 days",
      pitfalls: [],
    },
  ],
  "templates.json": [
    {
      id: "zz-cr-form",
      name: "ZZ Change request form",
      purpose: "Record a change request and its impact.",
      format: "docx",
      sections: ["Summary", "Impact on time", "Impact on cost"],
      example: [
        ["Summary", "Add CSV export to the orders screen."],
        ["Requested by", "Client PM"],
      ],
    },
    {
      id: "zz-raid-log",
      name: "ZZ RAID log",
      purpose: "Track risks, assumptions, issues and dependencies.",
      format: "xlsx",
      sections: ["ID", "Type", "Description", "Owner"],
      example: [
        ["ID", "R-01"],
        ["Type", "Risk"],
        ["Description", "Store review may take a week."],
      ],
    },
  ],
};

function writeFixture(dir: string, files: Record<string, unknown> = FIXTURE): void {
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, value] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), JSON.stringify(value));
}

/** Answers the re-validation call with a fixed verdict; everything else goes to the normal mock. */
class VerdictProvider extends MockProvider {
  constructor(private readonly agrees: boolean) {
    super();
  }
  override async generateJson<T>(request: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>> {
    if (request.schemaName === "handbook_check") {
      return { data: request.schema.parse({ agrees: this.agrees, reason: "The keyed answer still matches." }), usage: { input: 1, output: 1 }, latencyMs: 1, model: "mock-1" };
    }
    return super.generateJson(request);
  }
}

let ctx: TestContext;
let admin: Session;
let folder: string;
const warnings: string[] = [];

async function setup(options: Parameters<typeof createTestApp>[1] = {}): Promise<void> {
  ctx = await createTestApp({}, options);
  admin = await adminSession(ctx);
  folder = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-handbook-"));
  writeFixture(folder);
  warnings.length = 0;
  ensureHandbookSeed(ctx.db, folder, (m) => warnings.push(m));
}

afterEach(async () => {
  await ctx?.close();
  if (folder) fs.rmSync(folder, { recursive: true, force: true });
});

async function adminEntry(kind: string, id: string) {
  const res = await ctx.app.inject({ method: "GET", url: `/api/admin/handbook?kind=${kind}&q=${id}`, ...as(admin) });
  return (res.json().entries as { id: string; data: Record<string, unknown>; version: number }[]).find((e) => e.id === id)!;
}

function insertBankItem(id: string, refs: { kind: string; id: string; version: number }[], status: "active" | "draft" | "retired" = "active"): void {
  const at = Date.now();
  ctx.db
    .insert(schema.questionBank)
    .values({
      id,
      departmentId: "pm",
      skillId: "pm-proc-terms",
      type: "mcq",
      difficulty: 2,
      prompt: "The client wants a new report after sign-off. What is it?",
      mcq: { options: ["A bug", "A change request", "Warranty work"], correctIndex: 1, explanation: "It is outside the signed scope.", snippet: null, snippetLanguage: null },
      status,
      source: "admin",
      handbookRefs: refs,
      createdAt: at,
      updatedAt: at,
    })
    .run();
}

const bankRow = (id: string) => ctx.db.select().from(schema.questionBank).where(eq(schema.questionBank.id, id)).get()!;

describe("handbook seed loader", () => {
  beforeEach(() => setup());

  test("inserts valid entries, skips invalid ones with a warning, and tolerates a missing folder", () => {
    expect(getRow(ctx.db, "term", "zz-change")?.version).toBe(1);
    expect(getRow(ctx.db, "template", "zz-raid-log")).toBeTruthy();
    expect(getRow(ctx.db, "term", "zz-broken")).toBeUndefined();
    expect(warnings.some((w) => w.includes("terms-zz.json[2]"))).toBe(true);

    expect(ensureHandbookSeed(ctx.db, path.join(folder, "nope"))).toEqual({ inserted: 0, updated: 0 });
    fs.writeFileSync(path.join(folder, "terms-bad.json"), "{ not json");
    const seen: string[] = [];
    expect(() => loadHandbookSeed(folder, (m) => seen.push(m))).not.toThrow();
    expect(seen.some((w) => w.includes("terms-bad.json is not valid JSON"))).toBe(true);
  });

  test("bank seed items cite handbook entries at their current versions", () => {
    const versions = new Map([["term:zz-change", 3]]);
    expect(citedRefs(["term:zz-change", "rule:zz-unknown"], versions)).toEqual([
      { kind: "term", id: "zz-change", version: 3 },
      { kind: "rule", id: "zz-unknown", version: 0 },
    ]);
    expect(citedRefs(undefined, versions)).toEqual([]);
  });

  test("a changed seed refreshes an untouched entry, but an admin edit always wins", async () => {
    // Running again with the same seed changes nothing.
    expect(ensureHandbookSeed(ctx.db, folder, () => {})).toEqual({ inserted: 0, updated: 0 });

    const next = structuredClone(FIXTURE);
    next["terms-zz.json"][0] = term("zz-change", "ZZ Change request", { definition: "A seed rewrite." });
    writeFixture(folder, next);
    expect(ensureHandbookSeed(ctx.db, folder, () => {}).updated).toBe(1);
    expect(getRow(ctx.db, "term", "zz-change")).toMatchObject({ version: 2, updatedBy: null, data: { definition: "A seed rewrite." } });

    const entry = await adminEntry("term", "zz-change");
    const save = await ctx.app.inject({
      method: "PUT",
      url: "/api/admin/handbook/term/zz-change",
      payload: { data: { ...entry.data, definition: "Oyelabs' own definition." } },
      ...as(admin),
    });
    expect(save.statusCode).toBe(200);

    next["terms-zz.json"][0] = term("zz-change", "ZZ Change request", { definition: "Another seed rewrite." });
    writeFixture(folder, next);
    expect(ensureHandbookSeed(ctx.db, folder, () => {}).updated).toBe(0);
    expect(getRow(ctx.db, "term", "zz-change")?.data).toMatchObject({ definition: "Oyelabs' own definition." });
  });
});

describe("the shipped handbook seed", () => {
  beforeEach(() => setup());

  test("every seed file loads cleanly, with at least 150 complete terms in the database", () => {
    const seen: string[] = [];
    const seed = loadHandbookSeed(handbookFolder(), (m) => seen.push(m));
    expect(seen).toEqual([]);
    for (const kind of ["term", "stage", "rule", "template"]) expect(seed.some((e) => e.kind === kind)).toBe(true);

    const terms = rowsOf(ctx.db, "term").filter((r) => !r.archived && !r.id.startsWith("zz-"));
    expect(terms.length).toBeGreaterThanOrEqual(150);
    for (const row of terms) {
      const t = row.data as unknown as Term;
      for (const field of ["name", "definition", "oyelabsMeaning", "example", "clientSentence", "impact"] as const) {
        expect(t[field].trim(), `${row.id}.${field}`).not.toBe("");
      }
      expect(t.projectTypes.length, `${row.id}.projectTypes`).toBeGreaterThan(0);
      expect(t.category, `${row.id}.category`).toBeTruthy();
    }
  });
});

describe("admin handbook editor", () => {
  beforeEach(() => setup());

  test("lists unconfirmed first, filters, and confirm sets the status and bumps the version", async () => {
    const list = await ctx.app.inject({ method: "GET", url: "/api/admin/handbook?kind=term&q=zz-", ...as(admin) });
    expect(list.statusCode).toBe(200);
    const body = list.json();
    expect(body.entries.map((e: { id: string }) => e.id)).toEqual(["zz-bug", "zz-change"]);
    expect(body.counts.toConfirm).toBeGreaterThanOrEqual(2);

    const quality = await ctx.app.inject({ method: "GET", url: "/api/admin/handbook?kind=term&q=zz-&category=quality", ...as(admin) });
    expect(quality.json().entries.map((e: { id: string }) => e.id)).toEqual(["zz-bug"]);

    const entry = await adminEntry("term", "zz-bug");
    const res = await ctx.app.inject({ method: "PUT", url: "/api/admin/handbook/term/zz-bug", payload: { data: entry.data, confirm: true }, ...as(admin) });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ entry: { version: 2, data: { status: "confirmed" } }, revalidating: 0 });

    const after = await ctx.app.inject({ method: "GET", url: "/api/admin/handbook?kind=term&q=zz-", ...as(admin) });
    expect(after.json().entries.map((e: { id: string }) => e.id)).toEqual(["zz-change", "zz-bug"]);
    expect(after.json().counts.confirmed).toBe(body.counts.confirmed + 1);

    const audit = ctx.db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "handbook.confirm")).all();
    expect(audit.map((a) => a.targetId)).toContain("zz-bug");
  });

  test("an invalid edit is a 400; a new entry is created once (409 after)", async () => {
    const bad = await ctx.app.inject({ method: "PUT", url: "/api/admin/handbook/term/zz-bug", payload: { data: { name: "" } }, ...as(admin) });
    expect(bad.statusCode).toBe(400);
    const missing = await ctx.app.inject({ method: "PUT", url: "/api/admin/handbook/term/zz-nope", payload: { data: term("zz-nope", "Nope") }, ...as(admin) });
    expect(missing.statusCode).toBe(404);

    const create = await ctx.app.inject({ method: "POST", url: "/api/admin/handbook/term", payload: { data: term("zz-new", "ZZ New term") }, ...as(admin) });
    expect(create.statusCode).toBe(201);
    expect(create.json().entry).toMatchObject({ id: "zz-new", version: 1, data: { status: "to-confirm" } });
    const again = await ctx.app.inject({ method: "POST", url: "/api/admin/handbook/term", payload: { data: term("zz-new", "ZZ New term") }, ...as(admin) });
    expect(again.statusCode).toBe(409);
  });

  test("archive hides an entry from learners, unarchive brings it back", async () => {
    const learner = await activeLearner(ctx, admin);
    const archive = await ctx.app.inject({ method: "POST", url: "/api/admin/handbook/term/zz-bug/archive", ...as(admin) });
    expect(archive.statusCode).toBe(200);
    expect(archive.json().entry.archived).toBe(true);

    const glossary = await ctx.app.inject({ method: "GET", url: "/api/handbook/glossary", ...as(learner.session) });
    expect(glossary.json().terms.map((t: { id: string }) => t.id)).not.toContain("zz-bug");
    const one = await ctx.app.inject({ method: "GET", url: "/api/handbook/terms/zz-bug", ...as(learner.session) });
    expect(one.statusCode).toBe(404);
    const archivedOnly = await ctx.app.inject({ method: "GET", url: "/api/admin/handbook?kind=term&archived=1", ...as(admin) });
    expect(archivedOnly.json().entries.map((e: { id: string }) => e.id)).toEqual(["zz-bug"]);

    await ctx.app.inject({ method: "POST", url: "/api/admin/handbook/term/zz-bug/unarchive", ...as(admin) });
    const back = await ctx.app.inject({ method: "GET", url: "/api/handbook/terms/zz-bug", ...as(learner.session) });
    expect(back.statusCode).toBe(200);
    expect(ctx.db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "handbook.archive")).all()).toHaveLength(2);
  });

  test("learners cannot use the admin routes", async () => {
    const learner = await activeLearner(ctx, admin);
    const list = await ctx.app.inject({ method: "GET", url: "/api/admin/handbook", ...as(learner.session) });
    expect(list.statusCode).toBe(403);
    const save = await ctx.app.inject({ method: "POST", url: "/api/admin/handbook/term/zz-bug/archive", ...as(learner.session) });
    expect(save.statusCode).toBe(403);
  });
});

describe("learner handbook routes", () => {
  beforeEach(() => setup());

  test("glossary, one term, rules by id, stages by order, templates", async () => {
    const anon = await ctx.app.inject({ method: "GET", url: "/api/handbook/glossary" });
    expect(anon.statusCode).toBe(401);

    const learner = await activeLearner(ctx, admin);
    const glossary = (await ctx.app.inject({ method: "GET", url: "/api/handbook/glossary", ...as(learner.session) })).json();
    const zz = glossary.terms.filter((t: { id: string }) => t.id.startsWith("zz-"));
    expect(zz.map((t: { id: string }) => t.id)).toEqual(["zz-bug", "zz-change"]);
    expect(Object.keys(zz[0]).sort()).toEqual(["aka", "category", "clientSentence", "definition", "id", "name", "oyelabsMeaning", "projectTypes", "status"]);

    const rules = (await ctx.app.inject({ method: "GET", url: "/api/handbook/rules?ids=zz-cr-rule,unknown", ...as(learner.session) })).json();
    expect(rules.rules.map((r: { id: string }) => r.id)).toEqual(["zz-cr-rule"]);

    const stages = (await ctx.app.inject({ method: "GET", url: "/api/handbook/stages?projectType=custom", ...as(learner.session) })).json();
    const zzStages = stages.stages.filter((s: { id: string }) => s.id.startsWith("zz-"));
    expect(zzStages.map((s: { id: string }) => s.id)).toEqual(["zz-stage-one", "zz-stage-two"]);

    const templates = (await ctx.app.inject({ method: "GET", url: "/api/handbook/templates", ...as(learner.session) })).json();
    expect(templates.templates.find((t: { id: string }) => t.id === "zz-cr-form")).toMatchObject({ hasUpload: false });
  });
});

describe("flashcards", () => {
  beforeEach(() => setup());

  test("Leitner boxes: again → 1, good → +1, easy → +2, capped at 5", () => {
    const at = 1_000_000;
    const day = 24 * 60 * 60 * 1000;
    expect(nextBox(1, "good", at)).toEqual({ box: 2, dueAt: at + day });
    expect(nextBox(2, "easy", at)).toEqual({ box: 4, dueAt: at + 7 * day });
    expect(nextBox(4, "easy", at)).toEqual({ box: 5, dueAt: at + 16 * day });
    expect(nextBox(5, "again", at)).toEqual({ box: 1, dueAt: at });
  });

  test("new terms are offered, a reviewed card leaves the due list until its interval passes", async () => {
    const learner = await activeLearner(ctx, admin);
    const first = (await ctx.app.inject({ method: "GET", url: "/api/handbook/flashcards/due?limit=100&category=quality", ...as(learner.session) })).json();
    expect(first.cards).toContainEqual(expect.objectContaining({ termId: "zz-bug", isNew: true }));
    expect(first.dueCount).toBe(0);
    const newBefore = first.newCount;

    const good = await ctx.app.inject({ method: "POST", url: "/api/handbook/flashcards/zz-bug", payload: { result: "good" }, ...as(learner.session) });
    expect(good.statusCode).toBe(200);
    expect(good.json().box).toBe(2);

    const later = (await ctx.app.inject({ method: "GET", url: "/api/handbook/flashcards/due?limit=100&category=quality", ...as(learner.session) })).json();
    expect(later.cards.map((c: { termId: string }) => c.termId)).not.toContain("zz-bug");
    expect(later.newCount).toBe(newBefore - 1);

    // "again" puts it back in box 1, due now, ahead of the new terms.
    await ctx.app.inject({ method: "POST", url: "/api/handbook/flashcards/zz-bug", payload: { result: "again" }, ...as(learner.session) });
    const due = (await ctx.app.inject({ method: "GET", url: "/api/handbook/flashcards/due?limit=1&category=quality", ...as(learner.session) })).json();
    expect(due.cards).toEqual([expect.objectContaining({ termId: "zz-bug", box: 1, isNew: false })]);
    expect(due.dueCount).toBe(1);

    const unknown = await ctx.app.inject({ method: "POST", url: "/api/handbook/flashcards/zz-nope", payload: { result: "good" }, ...as(learner.session) });
    expect(unknown.statusCode).toBe(404);
    const bad = await ctx.app.inject({ method: "POST", url: "/api/handbook/flashcards/zz-bug", payload: { result: "perfect" }, ...as(learner.session) });
    expect(bad.statusCode).toBe(400);
  });
});

describe("template files", () => {
  beforeEach(() => setup());

  const isZip = (buf: Buffer) => buf.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));

  test("generated DOCX and XLSX, blank and filled, are valid Office files", async () => {
    const learner = await activeLearner(ctx, admin);
    for (const [id, type] of [
      ["zz-cr-form", "wordprocessingml"],
      ["zz-raid-log", "spreadsheetml"],
    ] as const) {
      for (const variant of ["blank", "filled"]) {
        const res = await ctx.app.inject({ method: "GET", url: `/api/handbook/templates/${id}/download?variant=${variant}`, ...as(learner.session) });
        expect(res.statusCode).toBe(200);
        expect(res.headers["content-type"]).toContain(type);
        expect(res.headers["content-disposition"]).toContain("attachment");
        expect(isZip(res.rawPayload)).toBe(true);
      }
    }
  });

  test("an uploaded replacement is served instead, and revert goes back to the generated file", async () => {
    const learner = await activeLearner(ctx, admin);
    const file = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from("our own template")]);
    const docxType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const notZip = await ctx.app.inject({ method: "PUT", url: "/api/admin/handbook/templates/zz-cr-form/upload", payload: Buffer.from("hello"), headers: { "content-type": docxType }, ...as(admin) });
    expect(notZip.statusCode).toBe(400);
    const asLearner = await ctx.app.inject({ method: "PUT", url: "/api/admin/handbook/templates/zz-cr-form/upload", payload: file, headers: { "content-type": docxType }, ...as(learner.session) });
    expect(asLearner.statusCode).toBe(403);

    const upload = await ctx.app.inject({ method: "PUT", url: "/api/admin/handbook/templates/zz-cr-form/upload", payload: file, headers: { "content-type": docxType }, ...as(admin) });
    expect(upload.statusCode).toBe(200);
    expect(upload.json().entry.hasUpload).toBe(true);
    expect(fs.existsSync(path.join(ctx.env.dataDir, "handbook", "zz-cr-form.docx"))).toBe(true);

    const served = await ctx.app.inject({ method: "GET", url: "/api/handbook/templates/zz-cr-form/download?variant=filled", ...as(learner.session) });
    expect(served.rawPayload.equals(file)).toBe(true);

    const revert = await ctx.app.inject({ method: "DELETE", url: "/api/admin/handbook/templates/zz-cr-form/upload", ...as(admin) });
    expect(revert.json().entry.hasUpload).toBe(false);
    const generated = await ctx.app.inject({ method: "GET", url: "/api/handbook/templates/zz-cr-form/download", ...as(learner.session) });
    expect(generated.rawPayload.equals(file)).toBe(false);
    expect(isZip(generated.rawPayload)).toBe(true);
    expect(ctx.db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "handbook.upload")).all()).toHaveLength(2);
  });
});

describe("re-validating bank items when an entry changes", () => {
  const ref = { kind: "term", id: "zz-change", version: 1 };

  async function editDefinition(definition: string, confirm = false) {
    const entry = await adminEntry("term", "zz-change");
    return ctx.app.inject({ method: "PUT", url: "/api/admin/handbook/term/zz-change", payload: { data: { ...entry.data, definition }, confirm }, ...as(admin) });
  }

  test("without AI: citing items go to draft and staff are told how many", async () => {
    await setup({ noAi: true });
    insertBankItem("zz-item-one", [ref]);
    insertBankItem("zz-item-two", [ref, { kind: "rule", id: "zz-cr-rule", version: 1 }]);
    insertBankItem("zz-item-retired", [ref], "retired");
    insertBankItem("zz-item-other", [{ kind: "term", id: "zz-bug", version: 1 }]);

    // Confirming alone does not re-check anything.
    const entry = await adminEntry("term", "zz-change");
    const confirm = await ctx.app.inject({ method: "PUT", url: "/api/admin/handbook/term/zz-change", payload: { data: entry.data, confirm: true }, ...as(admin) });
    expect(confirm.json().revalidating).toBe(0);

    const res = await editDefinition("Oyelabs: any request outside the signed SOW.");
    expect(res.json().revalidating).toBe(2);
    expect(bankRow("zz-item-one").status).toBe("draft");
    expect(bankRow("zz-item-two").status).toBe("draft");
    expect(bankRow("zz-item-retired").status).toBe("retired");
    expect(bankRow("zz-item-other").status).toBe("active");

    const notes = ctx.db.select().from(schema.notifications).where(and(eq(schema.notifications.recipientId, admin.user.id), eq(schema.notifications.kind, "handbook.revalidate"))).all();
    expect(notes).toHaveLength(1);
    expect(notes[0]!.body).toBe("2 question-bank items cite ZZ Change request, which changed. Review them in the question bank.");

    // The queued checks leave the items in draft for a person to review.
    await ctx.drainJobs();
    expect(bankRow("zz-item-one").status).toBe("draft");
  });

  test("with AI, an item that still agrees goes back to active at the new version", async () => {
    await setup({ provider: new VerdictProvider(true) });
    insertBankItem("zz-item-one", [ref]);
    const res = await editDefinition("Oyelabs: any request outside the signed SOW.");
    expect(res.json().revalidating).toBe(1);
    expect(bankRow("zz-item-one").status).toBe("draft");

    await ctx.drainJobs();
    const row = bankRow("zz-item-one");
    expect(row.status).toBe("active");
    expect(row.handbookRefs).toEqual([{ ...ref, version: res.json().entry.version }]);
  });

  test("with AI, an item that no longer agrees stays draft and staff are notified", async () => {
    await setup({ provider: new VerdictProvider(false) });
    insertBankItem("zz-item-one", [ref]);
    await editDefinition("Something that contradicts the item.");
    await ctx.drainJobs();
    expect(bankRow("zz-item-one").status).toBe("draft");
    const notes = ctx.db.select().from(schema.notifications).where(eq(schema.notifications.kind, "handbook.revalidate")).all();
    expect(notes.some((n) => n.title.includes("zz-item-one"))).toBe(true);
  });
});
