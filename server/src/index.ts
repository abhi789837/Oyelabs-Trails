import fs from "node:fs";

import { MockProvider } from "./ai/adapters/mock";
import { AiService } from "./ai/service";
import { buildApp } from "./app";
import { announceSeed, seedSuperadmin } from "./auth/seed";
import { purgeExpiredSessions } from "./auth/sessions";
import { ContentStore } from "./content/store";
import { openDb } from "./db";
import { loadEnv } from "./env";
import { blueprintHandler } from "./assessment/blueprintJob";
import { verifyCredentialHandler } from "./jobs/handlers/verifyCredential";
import { JobWorker } from "./jobs/worker";
import { createSandbox } from "./sandbox";

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

  const content = ContentStore.load(env.serverContentDir);
  const sandbox = await createSandbox(env, (message) => console.log(`[trails] ${message}`));
  console.log(`[trails] curriculum: ${content.manifest.length} tracks, ${content.topicCount} topics`);

  /**
   * Development without a credential still needs the AI paths to run end to end, so a
   * deterministic mock stands in. It is only ever built outside production, and the admin UI
   * says so in as many words.
   */
  const useMock = !env.isProduction && process.env.TRAILS_MOCK_AI !== "0";
  const mock = useMock
    ? new MockProvider({
        topicIds: content.orderedTopicIds,
        moduleIds: content.manifest.flatMap((t) => t.modules.filter((m) => m.available).map((m) => m.id)),
      })
    : null;
  const ai = new AiService(db, env, { mock });
  if (useMock) console.log("[trails] AI: deterministic mock provider (development only)");

  const worker = new JobWorker({
    db,
    handlers: {
      "credential.verify": verifyCredentialHandler(db, ai),
      "assessment.blueprint": blueprintHandler({ db, ai, content, sandbox, log: (m) => console.log(`[trails] ${m}`) }),
    },
    log: (message, detail) => console.log(`[trails] ${message}`, detail ?? ""),
  });
  worker.start();

  const app = await buildApp({ env, db, content, sandbox, ai, usingMockProvider: useMock });

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "shutting down");
    try {
      await worker.stop();
      await app.close();
      // Checkpoint the WAL so the .db file is complete for a backup or a container restart.
      sqlite.pragma("wal_checkpoint(TRUNCATE)");
      sqlite.close();
      await sandbox.dispose?.();
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
