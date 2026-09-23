import fs from "node:fs";

import { buildApp } from "./app";
import { announceSeed, seedSuperadmin } from "./auth/seed";
import { purgeExpiredSessions } from "./auth/sessions";
import { openDb } from "./db";
import { loadEnv } from "./env";

async function main(): Promise<void> {
  const env = loadEnv();
  fs.mkdirSync(env.dataDir, { recursive: true });
  fs.mkdirSync(env.snapshotsDir, { recursive: true });
  fs.mkdirSync(env.backupsDir, { recursive: true });

  const { db, sqlite } = openDb(env);

  // Printed with console.log rather than the app logger: a generated password shown once should
  // not be shaped like a structured log line that a shipper might forward somewhere.
  announceSeed(await seedSuperadmin(db, env), (message) => console.log(message));
  purgeExpiredSessions(db);

  const app = await buildApp({ env, db });

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "shutting down");
    try {
      await app.close();
      // Checkpoint the WAL so the .db file is complete for a backup or a container restart.
      sqlite.pragma("wal_checkpoint(TRUNCATE)");
      sqlite.close();
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await app.listen({ port: env.port, host: env.host });
}

main().catch((error: unknown) => {
  console.error("[trails] failed to start:", error instanceof Error ? error.message : error);
  process.exit(1);
});
