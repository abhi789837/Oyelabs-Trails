import fs from "node:fs";
import path from "node:path";

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { schema } from "../db";
import { newId, now } from "../lib/ids";
import { createTestApp, type TestContext } from "../test/harness";
import { BACKUPS_TO_KEEP, runBackup, runSnapshotRetention } from "./retention";

let ctx: TestContext;

beforeEach(async () => {
  ctx = await createTestApp();
});

afterEach(async () => {
  await ctx.close();
});

/** Creates an integrity event with a real file on disk, aged as given. */
function seedSnapshot(ageDays: number): { id: string; relative: string; full: string } {
  const assessmentId = newId();
  const dir = path.join(ctx.env.snapshotsDir, assessmentId);
  fs.mkdirSync(dir, { recursive: true });

  const name = `${newId()}.jpg`;
  const full = path.join(dir, name);
  fs.writeFileSync(full, Buffer.from([0xff, 0xd8, 0xff, 0xd9]));

  const id = newId();
  // The event needs an assessment to reference, so make a throwaway one.
  const userId = newId();
  ctx.db
    .insert(schema.users)
    .values({
      id: userId,
      // The full ULID: two generated in the same millisecond share a prefix, so a slice collides.
      username: `snap-${userId.toLowerCase()}`,
      displayName: "Snapshot Subject",
      passwordHash: "x",
      role: "learner",
      createdAt: now(),
    })
    .run();
  ctx.db
    .insert(schema.assessments)
    .values({ id: assessmentId, userId, attemptNo: 1, status: "completed", hardWarnings: 0, softWarnings: 0, createdAt: now() })
    .run();

  ctx.db
    .insert(schema.integrityEvents)
    .values({
      id,
      assessmentId,
      userId,
      type: "phone_in_frame",
      severity: "hard",
      counted: true,
      snapshotPath: path.posix.join(assessmentId, name),
      createdAt: now() - ageDays * 24 * 60 * 60 * 1000,
    })
    .run();

  return { id, relative: path.posix.join(assessmentId, name), full };
}

describe("snapshot retention", () => {
  test("deletes the image past the retention window but keeps the event", () => {
    const old = seedSnapshot(120);
    const recent = seedSnapshot(2);

    const result = runSnapshotRetention(ctx.db, ctx.env);

    expect(result.filesDeleted).toBe(1);
    expect(result.rowsCleared).toBe(1);
    expect(result.errors).toEqual([]);

    expect(fs.existsSync(old.full)).toBe(false);
    expect(fs.existsSync(recent.full)).toBe(true);

    // The event survives: that it happened is still part of the record.
    const oldRow = ctx.db.select().from(schema.integrityEvents).where(eq(schema.integrityEvents.id, old.id)).get()!;
    expect(oldRow.snapshotPath).toBeNull();
    expect(oldRow.type).toBe("phone_in_frame");
    expect(oldRow.counted).toBe(true);

    const recentRow = ctx.db.select().from(schema.integrityEvents).where(eq(schema.integrityEvents.id, recent.id)).get()!;
    expect(recentRow.snapshotPath).toBe(recent.relative);
  });

  test("removes the empty directory it leaves behind", () => {
    const old = seedSnapshot(120);
    runSnapshotRetention(ctx.db, ctx.env);
    expect(fs.existsSync(path.dirname(old.full))).toBe(false);
  });

  test("refuses a stored path that escapes the snapshots directory", () => {
    const seeded = seedSnapshot(120);
    ctx.db
      .update(schema.integrityEvents)
      .set({ snapshotPath: "../../escaped.jpg" })
      .where(eq(schema.integrityEvents.id, seeded.id))
      .run();

    const result = runSnapshotRetention(ctx.db, ctx.env);
    expect(result.errors.join(" ")).toMatch(/outside the snapshots directory/);
    expect(result.filesDeleted).toBe(0);
  });

  test("a missing file is not an error — the row is still cleared", () => {
    const old = seedSnapshot(120);
    fs.unlinkSync(old.full);

    const result = runSnapshotRetention(ctx.db, ctx.env);
    expect(result.errors).toEqual([]);
    expect(result.rowsCleared).toBe(1);
  });

  test("is a no-op when nothing has expired", () => {
    seedSnapshot(1);
    expect(runSnapshotRetention(ctx.db, ctx.env)).toMatchObject({ filesDeleted: 0, rowsCleared: 0 });
  });
});

describe("backups", () => {
  /**
   * The harness runs against an in-memory database, so these use a file-backed one — `VACUUM INTO`
   * is exactly the thing that has to work against real storage.
   */
  function fileBackedSqlite() {
    const Database = require("better-sqlite3") as typeof import("better-sqlite3");
    const file = path.join(ctx.env.dataDir, "backup-test.db");
    const db = new Database(file);
    db.exec("create table t (a integer); insert into t values (1), (2), (3);");
    return db;
  }

  test("writes a backup containing the data", () => {
    const sqlite = fileBackedSqlite();
    try {
      const result = runBackup(sqlite, ctx.env);
      expect(result.error).toBeUndefined();
      expect(result.bytes).toBeGreaterThan(0);

      const Database = require("better-sqlite3") as typeof import("better-sqlite3");
      const restored = new Database(result.file!, { readonly: true });
      expect(restored.prepare("select count(*) as n from t").get()).toEqual({ n: 3 });
      restored.close();
    } finally {
      sqlite.close();
    }
  });

  test(`keeps only the newest ${BACKUPS_TO_KEEP}`, () => {
    // Pre-fill with more than the limit, named so the sort is chronological.
    fs.mkdirSync(ctx.env.backupsDir, { recursive: true });
    for (let i = 0; i < BACKUPS_TO_KEEP + 5; i++) {
      fs.writeFileSync(path.join(ctx.env.backupsDir, `trails-2020-01-${String(i + 1).padStart(2, "0")}.db`), "x");
    }

    const sqlite = fileBackedSqlite();
    try {
      const result = runBackup(sqlite, ctx.env);
      expect(result.removed).toBeGreaterThan(0);

      const remaining = fs.readdirSync(ctx.env.backupsDir).filter((n) => n.startsWith("trails-"));
      expect(remaining.length).toBe(BACKUPS_TO_KEEP);
      // The oldest are the ones that went.
      expect(remaining).not.toContain("trails-2020-01-01.db");
    } finally {
      sqlite.close();
    }
  });

  test("reports a failure rather than throwing", () => {
    const broken = {
      exec: () => {
        throw new Error("disk full");
      },
    };
    const result = runBackup(broken, ctx.env);
    expect(result.error).toMatch(/disk full/);
    expect(result.file).toBeNull();
  });
});
