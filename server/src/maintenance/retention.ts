import fs from "node:fs";
import path from "node:path";

import { and, eq, isNotNull, lt } from "drizzle-orm";

import { schema, type Db } from "../db";
import type { Env } from "../env";
import { now } from "../lib/ids";

/**
 * Snapshot retention (brief §10.6).
 *
 * These are photographs of people taken while they were being watched. Keeping them indefinitely
 * is not defensible, so they expire — the row survives with `snapshot_path` nulled, because the
 * fact that an event happened is still part of the record even after the image is gone.
 *
 * Default 90 days, set by SNAPSHOT_RETENTION_DAYS.
 */
export interface RetentionResult {
  filesDeleted: number;
  rowsCleared: number;
  directoriesRemoved: number;
  errors: string[];
}

export function runSnapshotRetention(db: Db, env: Env): RetentionResult {
  const cutoff = now() - env.snapshotRetentionDays * 24 * 60 * 60 * 1000;
  const result: RetentionResult = { filesDeleted: 0, rowsCleared: 0, directoriesRemoved: 0, errors: [] };

  const expired = db
    .select()
    .from(schema.integrityEvents)
    .where(and(isNotNull(schema.integrityEvents.snapshotPath), lt(schema.integrityEvents.createdAt, cutoff)))
    .all();

  for (const event of expired) {
    if (!event.snapshotPath) continue;

    // The stored path is relative to the snapshots directory; confirm it still resolves inside it
    // before unlinking anything.
    const full = path.resolve(env.snapshotsDir, event.snapshotPath);
    if (!full.startsWith(path.resolve(env.snapshotsDir) + path.sep)) {
      result.errors.push(`Refused to delete a snapshot path outside the snapshots directory: ${event.snapshotPath}`);
      continue;
    }

    try {
      if (fs.existsSync(full)) {
        fs.unlinkSync(full);
        result.filesDeleted += 1;
      }
      db.update(schema.integrityEvents)
        .set({ snapshotPath: null })
        .where(eq(schema.integrityEvents.id, event.id))
        .run();
      result.rowsCleared += 1;
    } catch (error) {
      result.errors.push(`${event.snapshotPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Tidy up the per-assessment directories left behind.
  try {
    for (const entry of fs.readdirSync(env.snapshotsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(env.snapshotsDir, entry.name);
      if (fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
        result.directoriesRemoved += 1;
      }
    }
  } catch (error) {
    result.errors.push(`Could not tidy snapshot directories: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * Nightly SQLite backup (brief §15).
 *
 * `VACUUM INTO` writes a consistent copy without stopping writes, which a file copy of a WAL
 * database cannot promise. Fourteen are kept, which is enough to notice and recover from a bad
 * migration or a mistaken deletion.
 */
export interface BackupResult {
  file: string | null;
  bytes: number;
  removed: number;
  error?: string;
}

export const BACKUPS_TO_KEEP = 14;

export function runBackup(sqlite: { exec: (sql: string) => unknown }, env: Env): BackupResult {
  fs.mkdirSync(env.backupsDir, { recursive: true });

  // Sortable name, so pruning is a lexicographic sort rather than a stat of every file.
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(env.backupsDir, `oyelearn-${stamp}.db`);

  try {
    // The path is interpolated into SQL, so quote it the way SQLite expects and reject anything
    // that could close the string early.
    if (file.includes("'")) throw new Error("The backup path contains a quote character.");
    sqlite.exec(`VACUUM INTO '${file.replace(/\\/g, "/")}'`);
  } catch (error) {
    return { file: null, bytes: 0, removed: 0, error: error instanceof Error ? error.message : String(error) };
  }

  const bytes = fs.existsSync(file) ? fs.statSync(file).size : 0;

  const backups = fs
    .readdirSync(env.backupsDir)
    .filter((name) => name.startsWith("oyelearn-") && name.endsWith(".db"))
    .sort();

  let removed = 0;
  while (backups.length > BACKUPS_TO_KEEP) {
    const oldest = backups.shift()!;
    try {
      fs.unlinkSync(path.join(env.backupsDir, oldest));
      removed += 1;
    } catch {
      // A backup that cannot be removed is not worth failing the run over.
      break;
    }
  }

  return { file, bytes, removed };
}

/**
 * Both jobs on a daily timer.
 *
 * Deliberately not in the job queue: they must run on a wall-clock cadence whether or not anything
 * else is queued, and a backup delayed behind a ten-minute evaluation is a backup that did not
 * happen when it was supposed to.
 */
export interface MaintenanceOptions {
  db: Db;
  sqlite: { exec: (sql: string) => unknown };
  env: Env;
  log?: (message: string) => void;
  intervalMs?: number;
}

export function startDailyMaintenance(options: MaintenanceOptions): () => void {
  const interval = options.intervalMs ?? 24 * 60 * 60 * 1000;

  const run = () => {
    try {
      const retention = runSnapshotRetention(options.db, options.env);
      if (retention.rowsCleared > 0 || retention.errors.length > 0) {
        options.log?.(
          `snapshot retention: ${retention.filesDeleted} file(s) deleted, ${retention.rowsCleared} row(s) cleared${
            retention.errors.length ? `, ${retention.errors.length} error(s)` : ""
          }`,
        );
      }

      const backup = runBackup(options.sqlite, options.env);
      if (backup.error) options.log?.(`backup failed: ${backup.error}`);
      else options.log?.(`backup: ${path.basename(backup.file!)} (${(backup.bytes / 1024 / 1024).toFixed(1)} MB), ${backup.removed} pruned`);
    } catch (error) {
      options.log?.(`maintenance failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // One run shortly after boot, so a container that restarts daily still backs up.
  const initial = setTimeout(run, 30_000);
  initial.unref?.();
  const timer = setInterval(run, interval);
  timer.unref?.();

  return () => {
    clearTimeout(initial);
    clearInterval(timer);
  };
}
