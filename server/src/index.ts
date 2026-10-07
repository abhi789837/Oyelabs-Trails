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
import { evaluateHandler } from "./assessment/evaluateJob";
import { requeueOrphanedEvaluations, sweepOnce } from "./assessment/sweeper";
import { startDailyMaintenance } from "./maintenance/retention";
import { startNightlyStreaks } from "./v5/streak/repo";
import { startMotivationScheduler } from "./v5/notify/scheduler";
import { bankFillHandler } from "./bank/fillJob";
import { bankRevalidateHandler } from "./handbook/revalidate";
import { personaliseHandler } from "./assessment/personalise/job";
import { batchPollHandler } from "./ai/batches";
import { ensurePistonPackages } from "./sandbox/pistonSetup";
import { enqueue } from "./jobs/queue";
import { buildPathHandler } from "./jobs/handlers/buildPath";
import { courseGenerateHandler } from "./builder/autoCourse";
import { recheckBlocked } from "./builder/connection";
import { refineWeekHandler } from "./jobs/handlers/refineWeek";
import { checkLinksHandler } from "./jobs/handlers/checkLinks";
import { verifyCredentialHandler } from "./jobs/handlers/verifyCredential";
import { fillHandler as topicTestFillHandler, recheckHandler as topicTestRecheckHandler, syncAllTopicTests } from "./topicTests/engine";
import { JobWorker } from "./jobs/worker";
import { transcribeHandler } from "./speech/transcribeJob";
import { ensureBootRescore, rescoreHandler } from "./assessment/rescoreJob";
import { publishGenerationLine } from "./routes/admin/live";
import { createSandbox } from "./sandbox";
import { oyelabsJobHandlers, startOyelabsSchedulers } from "./oyelabs/jobs";

async function main(): Promise<void> {
  const env = loadEnv();
  fs.mkdirSync(env.dataDir, { recursive: true });
  fs.mkdirSync(env.snapshotsDir, { recursive: true });
  fs.mkdirSync(env.audioDir, { recursive: true });
  fs.mkdirSync(env.backupsDir, { recursive: true });

  const { db, sqlite } = openDb(env);

  // Printed with console.log rather than the app logger: a generated password shown once should
  // not be shaped like a structured log line that a shipper might forward somewhere.
  announceSeed(await seedSuperadmin(db, env), (message) => console.log(message));
  purgeExpiredSessions(db);

  const content = ContentStore.load(env.serverContentDir);
  const sandbox = await createSandbox(env, (message) => console.log(`[oyelearn] ${message}`));
  console.log(`[oyelearn] curriculum: ${content.manifest.length} tracks, ${content.topicCount} topics`);

  /**
   * Development without a credential still needs the AI paths to run end to end, so a
   * deterministic mock stands in. It is only ever built outside production, and the admin UI
   * says so in as many words.
   */
  const useMock = !env.isProduction && process.env.OYELEARN_MOCK_AI !== "0";
  const mock = useMock
    ? new MockProvider({
        topicIds: content.orderedTopicIds,
        moduleIds: content.manifest.flatMap((t) => t.modules.filter((m) => m.available).map((m) => m.id)),
      })
    : null;
  const ai = new AiService(db, env, { mock });
  if (useMock) console.log("[oyelearn] AI: deterministic mock provider (development only)");

  // Built before the worker so the blueprint job can push its progress to whoever is watching
  // the admin live feed. Nothing is served until `listen` below.
  const app = await buildApp({ env, db, content, sandbox, ai, usingMockProvider: useMock });

  const worker = new JobWorker({
    db,
    handlers: {
      "credential.verify": verifyCredentialHandler(db, ai),
      "assessment.blueprint": blueprintHandler({
        db,
        ai,
        content,
        sandbox,
        log: (m) => console.log(`[oyelearn] ${m}`),
        publish: (line) => publishGenerationLine(app, line),
      }),
      "assessment.evaluate": evaluateHandler({ db, ai, content, sandbox, piston: app.piston, log: (m) => console.log(`[oyelearn] ${m}`) }),
      "path.build": buildPathHandler({ db, env, ai, content, log: (m) => console.log(`[oyelearn] ${m}`) }),
      "course.generate": courseGenerateHandler({ db, env, ai, log: (m) => console.log(`[oyelearn] ${m}`) }),
      "links.check": checkLinksHandler({ db, log: (m) => console.log(`[oyelearn] ${m}`) }),
      "week.refine": refineWeekHandler({ db, content, ai, log: (m) => console.log(`[oyelearn] ${m}`) }),
      "bank.fill": bankFillHandler({ db, ai, sandbox, piston: app.piston, log: (m) => console.log(`[oyelearn] ${m}`) }),
      "bank.revalidate": bankRevalidateHandler({ db, ai, log: (m) => console.log(`[oyelearn] ${m}`) }),
      "assessment.personalise": personaliseHandler({ db, ai, sandbox, piston: app.piston, log: (m) => console.log(`[oyelearn] ${m}`) }),
      "ai.batch.poll": batchPollHandler({ db, ai, log: (m) => console.log(`[oyelearn] ${m}`) }),
      "topic_tests.recheck": topicTestRecheckHandler({ db, ai, content, sandbox, log: (m) => console.log(`[oyelearn] ${m}`) }),
      "topic_tests.fill": topicTestFillHandler({ db, ai, content, sandbox, log: (m) => console.log(`[oyelearn] ${m}`) }),
      "speech.transcribe": transcribeHandler({ db, env, log: (m) => console.log(`[oyelearn] ${m}`) }),
      "scoring.rescore": rescoreHandler({ db, log: (m) => console.log(`[oyelearn] ${m}`) }),
      // v4.5 Oyelabs courses (server/src/oyelabs/jobs.ts).
      ...oyelabsJobHandlers({ db, env, ai, log: (m) => console.log(`[oyelearn] ${m}`) }),
    },
    log: (message, detail) => console.log(`[oyelearn] ${message}`, detail ?? ""),
  });
  worker.start();
  // v4.4: re-score stored answers once after the scoring update (queued, never inline).
  if (ensureBootRescore(db)) console.log("[oyelearn] queued a one-time re-score of stored answers");

  // Deadlines and missing heartbeats are noticed on a fixed cadence, not through the queue: a
  // backlog must not delay the checks that notice a stuck test.
  const requeued = requeueOrphanedEvaluations(db);
  if (requeued > 0) console.log(`[oyelearn] requeued ${requeued} orphaned evaluation(s)`);
  const sweeper = setInterval(() => {
    try {
      sweepOnce({ db, log: (m) => console.log(`[oyelearn] ${m}`) });
    } catch (error) {
      console.error("[oyelearn] sweeper failed:", error instanceof Error ? error.message : error);
    }
  }, 60_000);
  sweeper.unref?.();

  /* The weekly link re-check for generated courses. Queued rather than run inline so it goes
     through the same worker, retries and backoff as everything else; the interval only decides
     *when* to ask. Unref'd, so it never holds the process open by itself. */
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const linkCheck = setInterval(() => {
    try {
      enqueue(db, { type: "links.check", payload: {} });
    } catch (error) {
      console.error("[oyelearn] could not queue the link check:", error instanceof Error ? error.message : error);
    }
  }, WEEK_MS);
  linkCheck.unref?.();

  /* v4.5 P0: new courses blocked on the AI or web search are re-checked every 10 minutes (and once
     at boot), reading the settings fresh; saving the settings or a passing Test wakes them at once.
     A blocked course clears on its own: setup that arrives another way (an env key, a restored
     database, a quota that reset) is noticed here. */
  const wakeCourses = () => {
    void recheckBlocked({ db, env, ai })
      .then((woken) => {
        if (woken > 0) console.log(`[oyelearn] ${woken} new course(s) can be made now`);
      })
      .catch((error: unknown) => console.error("[oyelearn] could not re-check waiting courses:", error instanceof Error ? error.message : error));
  };
  wakeCourses();
  const courseWake = setInterval(wakeCourses, 10 * 60 * 1000);
  courseWake.unref?.();

  // v5: weekly streaks and milestone XP, recomputed nightly (reads recompute too).
  const stopStreaks = startNightlyStreaks({ db, content, log: (m) => console.log(`[oyelearn] ${m}`) });
  // v5: reminders, weekly recaps and the email outbox, hourly (P6).
  const stopMotivation = startMotivationScheduler({ db, content, appUrl: env.publicOrigin, log: (m) => console.log(`[oyelearn] ${m}`) });

  // Snapshot retention and the nightly backup (brief §10.6, §15).
  // v4.5: the daily re-check of Oyelabs course video and doc links.
  const stopOyelabs = startOyelabsSchedulers({ db, env, ai, log: (m) => console.log(`[oyelearn] ${m}`) });

  const stopMaintenance = startDailyMaintenance({
    db,
    sqlite,
    env,
    log: (m) => console.log(`[oyelearn] ${m}`),
  });

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "shutting down");
    try {
      clearInterval(sweeper);
      clearInterval(linkCheck);
      clearInterval(courseWake);
      stopMaintenance();
      stopOyelabs();
      stopStreaks();
      stopMotivation();
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

  // v4.3: topic-test grounding and the static quiz import, in the background (idempotent). Serving
  // and grading also do this lazily per topic, so nothing waits on it.
  void syncAllTopicTests(db, content, (m) => console.log(`[oyelearn] ${m}`)).catch((error: unknown) =>
    console.error("[oyelearn] topic test sync failed:", error instanceof Error ? error.message : error),
  );

  // v4: install any missing code-runner languages in the background (first boot only).
  if (env.pistonUrl) void ensurePistonPackages(env.pistonUrl, (m) => console.log(`[oyelearn] ${m}`));

  // v4: read the model ids this credential can use, so the router never sends one it cannot.
  void ai.refreshModels().then((ids) => {
    if (ids) console.log(`[oyelearn] AI models available: ${ids.length}`);
  });
}

main().catch((error: unknown) => {
  console.error("[oyelearn] failed to start:", error instanceof Error ? error.message : error);
  process.exit(1);
});
