import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { ensureBankSeed } from "../bank/repo";
import { ensureCatalogSeed } from "../catalog/repo";
import { migrateLegacyPriorities } from "../setup/repo";
import { migrationsFolder } from "./index";
import * as schema from "./schema";

/**
 * Upgrading a real database to v4, on a copy, with before/after counts (Phase 10).
 *
 * The production deploy runs the same steps at boot; this exists so they can be rehearsed on a
 * backup first and so the test suite can prove "never lose data" on a v3-shaped database.
 */

const PERSONAL_TABLES = [
  "users",
  "learner_profiles",
  "assessments",
  "assessment_items",
  "integrity_events",
  "evaluations",
  "learning_plans",
  "topic_progress",
  "topic_attempts",
  "certificates",
  "course_progress",
  "learning_paths",
  "path_items",
  "weekly_plans",
  "weekly_plan_items",
  "learner_targets",
  "learner_priorities",
] as const;

export interface MigrationReport {
  migrationsBefore: number;
  migrationsAfter: number;
  before: Record<string, number>;
  after: Record<string, number>;
  /** Tables whose row count went down. Must be empty. */
  lost: string[];
  learners: number;
  learnersInEngineering: number;
  priorityRows: number;
  bankActive: number;
  skills: number;
}

function counts(sqlite: Database.Database): Record<string, number> {
  const out: Record<string, number> = {};
  for (const table of PERSONAL_TABLES) {
    const exists = sqlite.prepare("select 1 from sqlite_master where type='table' and name=?").get(table);
    out[table] = exists ? (sqlite.prepare(`select count(*) n from ${table}`).get() as { n: number }).n : 0;
  }
  return out;
}

/** Copies `file` to a temp path, upgrades the copy, and reports. The original is never opened for writing. */
export function rehearseMigration(file: string): MigrationReport {
  const copy = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "oyelearn-migrate-")), "copy.db");
  const source = new Database(file, { readonly: true, fileMustExist: true });
  // A consistent snapshot even if the source is in WAL mode with a writer attached.
  source.exec(`VACUUM INTO '${copy.replace(/'/g, "''")}'`);
  source.close();

  const sqlite = new Database(copy);
  sqlite.pragma("foreign_keys = ON");
  const migrationsBefore = (sqlite.prepare("select count(*) n from __drizzle_migrations").get() as { n: number }).n;
  const before = counts(sqlite);

  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: migrationsFolder() });
  ensureCatalogSeed(db);
  migrateLegacyPriorities(db);
  ensureBankSeed(db);

  const after = counts(sqlite);
  const learners = (sqlite.prepare("select count(*) n from users where role='learner'").get() as { n: number }).n;
  const report: MigrationReport = {
    migrationsBefore,
    migrationsAfter: (sqlite.prepare("select count(*) n from __drizzle_migrations").get() as { n: number }).n,
    before,
    after,
    lost: PERSONAL_TABLES.filter((t) => after[t] < before[t]),
    learners,
    learnersInEngineering: (
      sqlite.prepare("select count(*) n from learner_profiles p join users u on u.id = p.user_id where u.role='learner' and p.department_id='engineering'").get() as { n: number }
    ).n,
    priorityRows: (sqlite.prepare("select count(*) n from learner_skill_priorities").get() as { n: number }).n,
    bankActive: (sqlite.prepare("select count(*) n from question_bank where status='active'").get() as { n: number }).n,
    skills: (sqlite.prepare("select count(*) n from skills").get() as { n: number }).n,
  };
  sqlite.close();
  fs.rmSync(path.dirname(copy), { recursive: true, force: true });
  return report;
}
