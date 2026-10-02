import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { describe, expect, test } from "vitest";

import { migrationsFolder } from "./index";
import { rehearseMigration } from "./migrateV4";

/**
 * The v4 migrations on a v3-shaped database: build one with migrations 0000-0012 only, put live-like
 * data in it, then upgrade a copy. Nothing personal may lose a row, every learner lands in
 * Engineering with their track, and their targets become slider rows.
 */
function v3Database(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-v3-"));
  const partial = path.join(dir, "migrations");
  fs.mkdirSync(path.join(partial, "meta"), { recursive: true });
  const full = migrationsFolder();
  const journal = JSON.parse(fs.readFileSync(path.join(full, "meta", "_journal.json"), "utf8"));
  journal.entries = journal.entries.filter((e: { idx: number }) => e.idx <= 12);
  fs.writeFileSync(path.join(partial, "meta", "_journal.json"), JSON.stringify(journal));
  for (const entry of journal.entries as { tag: string }[]) fs.copyFileSync(path.join(full, `${entry.tag}.sql`), path.join(partial, `${entry.tag}.sql`));

  const file = path.join(dir, "v3.db");
  const sqlite = new Database(file);
  migrate(drizzle(sqlite), { migrationsFolder: partial });
  const now = Date.now();
  sqlite.prepare("insert into users (id, username, display_name, password_hash, role, status, must_change_password, created_at) values (?,?,?,?,?,?,?,?)").run("u1", "rakesh", "Rakesh Gupta", "x", "learner", "active", 0, now);
  sqlite.prepare("insert into users (id, username, display_name, password_hash, role, status, must_change_password, created_at) values (?,?,?,?,?,?,?,?)").run("u2", "abhishek", "Abhishek Singh", "x", "learner", "active", 0, now);
  sqlite.prepare("insert into learner_profiles (user_id, admin_notes, claimed_skills, target_tracks, track, stack, years_experience, updated_at) values (?,?,?,?,?,?,?,?)").run("u1", "", "[]", "[]", "backend", "PHP + Laravel", 2, now);
  sqlite.prepare("insert into learner_profiles (user_id, admin_notes, claimed_skills, target_tracks, track, stack, years_experience, updated_at) values (?,?,?,?,?,?,?,?)").run("u2", "", "[]", "[]", "other", null, 0, now);
  sqlite.prepare("insert into learner_targets (id, user_id, skill, priority, position, created_at) values (?,?,?,?,?,?)").run("t1", "u1", "Docker", "high", 0, now);
  sqlite.prepare("insert into learner_targets (id, user_id, skill, priority, position, created_at) values (?,?,?,?,?,?)").run("t2", "u1", "AI driven development", "high", 1, now);
  sqlite.prepare("insert into topic_progress (user_id, topic_id, status, attempts, updated_at) values (?,?,?,?,?)").run("u1", "js-closures", "completed", 2, now);
  sqlite.prepare("insert into certificates (id, user_id, track_id, learner_name, topic_ids, issued_at) values (?,?,?,?,?,?)").run("OYL-BE-AAAA-BBBB", "u1", "backend", "Rakesh", "[]", now);
  sqlite.close();
  return file;
}

describe("upgrading a v3 database to v4", () => {
  test("loses nothing, moves every learner to Engineering, and carries targets into sliders", () => {
    const report = rehearseMigration(v3Database());
    expect(report.migrationsBefore).toBe(13);
    expect(report.migrationsAfter).toBeGreaterThan(13);
    expect(report.lost).toEqual([]);
    expect(report.after.topic_progress).toBe(1);
    expect(report.after.certificates).toBe(1);
    expect(report.learnersInEngineering).toBe(2);
    expect(report.priorityRows).toBe(2);
    expect(report.bankActive).toBeGreaterThan(1000);
  }, 120_000);
});
