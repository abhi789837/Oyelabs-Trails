import { sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import type { HealthResponse } from "../../../shared/api";
import { internal } from "../lib/errors";

/** Read from package.json at boot so the health endpoint reports what is actually deployed. */
const VERSION = process.env.npm_package_version ?? "3.0.0";

const startedAt = Date.now();

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Used by the Docker healthcheck (brief §16), so it touches the database: a process that is
   * up but cannot read its own data is not healthy.
   */
  app.get("/api/health", async (): Promise<HealthResponse> => {
    try {
      app.db.get<{ one: number }>(sql`select 1 as one`);
    } catch (error) {
      app.log.error({ err: error }, "health check could not read the database");
      throw internal("The database is not reachable.");
    }
    return {
      ok: true,
      name: "oyelearn",
      version: VERSION,
      uptimeSec: Math.round((Date.now() - startedAt) / 1000),
      db: "ok",
    };
  });
}
