import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../app";
import { openDb, type Db } from "../db";
import { loadEnv, type Env } from "../env";

export interface TestContext {
  app: FastifyInstance;
  db: Db;
  env: Env;
  close: () => Promise<void>;
}

/**
 * Builds a fully wired app against a fresh in-memory database with migrations applied.
 *
 * Each call gets its own throwaway data directory, because `loadEnv` writes a dev master key and
 * session secret there; sharing one would let tests leak state into each other.
 */
export async function createTestApp(overrides: Partial<NodeJS.ProcessEnv> = {}): Promise<TestContext> {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "trails-test-"));
  const env = loadEnv({
    NODE_ENV: "test",
    DATA_DIR: dataDir,
    // Point the SPA lookup at a directory that will not exist, so tests exercise the API-only path.
    CLIENT_DIST: path.join(dataDir, "no-dist"),
    ...overrides,
  } as NodeJS.ProcessEnv);

  const { db, sqlite } = openDb(env, { file: ":memory:" });
  const app = await buildApp({ env, db, logger: false });
  await app.ready();

  return {
    app,
    db,
    env,
    close: async () => {
      await app.close();
      sqlite.close();
      fs.rmSync(dataDir, { recursive: true, force: true });
    },
  };
}
