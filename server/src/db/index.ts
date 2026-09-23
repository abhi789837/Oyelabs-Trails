import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

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

  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("synchronous = NORMAL");

  const db = drizzle(sqlite, { schema });
  if (options.runMigrations !== false) migrate(db, { migrationsFolder: migrationsFolder() });
  return { db, sqlite };
}
