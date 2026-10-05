import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { ensureSkillEdgesSeed } from "../catalog/graph";
import { ensureCatalogSeed } from "../catalog/repo";
import { applyDepartmentDefaults, applyV42PmDefaults, migrateLegacyPriorities } from "../setup/repo";
import { ensureBankSeed } from "../bank/repo";
import { ensureHandbookSeed } from "../handbook/repo";
import { ensureBundleSeed } from "../goals/bundles";
import { ensureOutcomeSeed } from "../goals/outcomes";
import { migrateV43Goals } from "../goals/repo";
import type { Env } from "../env";
import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema>;
export { schema };

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Migrations live next to the schema so the bundled server and the tsx dev server find them by
 * the same relative walk. `dist-server/` keeps the folder alongside the bundle.
 */
export function migrationsFolder(): string {
  const candidates = [
    path.resolve(here, "../../drizzle"), // server/src/db -> server/drizzle
    path.resolve(here, "../drizzle"), // dist-server/db -> dist-server/drizzle
    path.resolve(process.cwd(), "server/drizzle"),
  ];
  const found = candidates.find((dir) => fs.existsSync(dir));
  if (!found) throw new Error(`Could not find the migrations folder. Looked in:\n  ${candidates.join("\n  ")}`);
  return found;
}

export interface OpenDbOptions {
  /** ":memory:" for tests. */
  file?: string;
  runMigrations?: boolean;
  /**
   * Tests: an already migrated and seeded database image (`sqlite.serialize()`), opened in memory.
   * Migrating and seeding ~4,000 catalog and bank rows per test was half a second each time.
   */
  template?: Buffer;
}

/**
 * Opens the database with the pragmas the app depends on.
 *
 * - WAL so a long-running read (a report) never blocks a write (an integrity event).
 * - `foreign_keys` is OFF by default in SQLite and must be enabled per connection, otherwise the
 *   `references()` in the schema are decorative.
 * - `busy_timeout` so a concurrent write waits instead of throwing SQLITE_BUSY.
 */
export function openDb(env: Env, options: OpenDbOptions = {}): { db: Db; sqlite: Database.Database } {
  const file = options.file ?? env.dbPath;
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });

  const sqlite = options.template ? new Database(options.template) : new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("synchronous = NORMAL");

  const db = drizzle(sqlite, { schema });
  if (options.runMigrations !== false && !options.template) {
    backupBeforeMigrating(sqlite, file, env);
    migrate(db, { migrationsFolder: migrationsFolder() });
    // Seed rows are inserted only when absent, so this never undoes an admin's edit.
    ensureCatalogSeed(db);
    // v4.3 skill graph: catalog prerequisites plus the seed progressions; never re-adds a deleted edge.
    ensureSkillEdgesSeed(db);
    // Once per database: v3 targets and must-have lists become slider rows.
    migrateLegacyPriorities(db);
    // v4.2 handbook: before the bank, so seed items can cite the entries' current versions.
    // Invalid entries are logged and skipped; boot never fails on a seed.
    ensureHandbookSeed(db);
    // v4 question bank: validated seed items, inserted when absent.
    ensureBankSeed(db);
    // v4.1: department default sliders for learners nobody has set priorities for (once).
    applyDepartmentDefaults(db);
    // v4.2: process academy defaults for PM skills and untouched PM learners (once).
    applyV42PmDefaults(db);
    // v4.3: the practical-outcomes library (upserted; invalid entries are logged and skipped), then
    // every existing priority becomes a skill goal (once).
    ensureOutcomeSeed(db);
    migrateV43Goals(db);
    // v4.4: skill groups ("full stack" for a frontend dev, "soft skills"…); only missing ids are
    // inserted, so admin edits survive.
    ensureBundleSeed(db);
  }
  return { db, sqlite };
}

/**
 * Copies the database aside before any migration it has not had yet is applied.
 *
 * This is what makes `git pull && docker compose up -d --build` a safe deploy on its own: the
 * first boot of a release that changes the schema leaves `backups/pre-migrate-<time>.db` behind,
 * taken with `VACUUM INTO` so it is consistent even in WAL mode. Boots with nothing to migrate
 * write nothing.
 */
function backupBeforeMigrating(sqlite: Database.Database, file: string, env: Env): void {
  if (file === ":memory:") return;
  const hasTable = sqlite.prepare("select 1 from sqlite_master where type='table' and name='__drizzle_migrations'").get();
  if (!hasTable) return; // A brand-new database has nothing to lose.
  const applied = (sqlite.prepare("select count(*) as n from __drizzle_migrations").get() as { n: number }).n;
  const journal = JSON.parse(fs.readFileSync(path.join(migrationsFolder(), "meta", "_journal.json"), "utf8")) as { entries: unknown[] };
  if (journal.entries.length <= applied) return;
  fs.mkdirSync(env.backupsDir, { recursive: true });
  const target = path.join(env.backupsDir, `pre-migrate-${new Date().toISOString().replace(/[:.]/g, "-")}.db`);
  sqlite.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
  console.log(`[oyelearn] database backed up before migrating (${applied} -> ${journal.entries.length}): ${target}`);
}
