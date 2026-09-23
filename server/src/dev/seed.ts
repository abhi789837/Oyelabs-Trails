/**
 * Development seed: creates the three sample learners from `sampleProfiles.ts`, optionally issues
 * an assessment for each, and prints their temporary passwords.
 *
 *   npm run dev:seed            create the learners
 *   npm run dev:seed -- --issue create them and generate an assessment for each
 *
 * Refuses to run in production: it prints passwords to stdout and creates accounts nobody asked
 * for. It is idempotent — an existing username is skipped rather than duplicated.
 */
import crypto from "node:crypto";

import { eq } from "drizzle-orm";

import { MockProvider } from "../ai/adapters/mock";
import { AiService } from "../ai/service";
import { generatePassword, hashPassword } from "../auth/password";
import { announceSeed, seedSuperadmin } from "../auth/seed";
import { blueprintHandler } from "../assessment/blueprintJob";
import { ContentStore } from "../content/store";
import { openDb } from "../db";
import { schema } from "../db";
import { loadEnv } from "../env";
import { enqueue } from "../jobs/queue";
import { JobWorker } from "../jobs/worker";
import { newId, now } from "../lib/ids";
import { createSandbox } from "../sandbox";
import { SAMPLE_LEARNERS } from "./sampleProfiles";

async function main(): Promise<void> {
  const env = loadEnv();
  if (env.isProduction) {
    console.error("dev:seed refuses to run with NODE_ENV=production.");
    process.exit(1);
  }

  const issue = process.argv.includes("--issue");
  const { db, sqlite } = openDb(env);
  const content = ContentStore.load(env.serverContentDir);

  announceSeed(await seedSuperadmin(db, env), (message) => console.log(message));

  const created: { username: string; password: string; id: string }[] = [];

  for (const sample of SAMPLE_LEARNERS) {
    const existing = db.select().from(schema.users).where(eq(schema.users.username, sample.username)).get();
    if (existing) {
      console.log(`- ${sample.username} already exists, skipping`);
      continue;
    }

    const password = generatePassword((n) => crypto.randomBytes(n), 12);
    const id = newId();

    db.insert(schema.users)
      .values({
        id,
        username: sample.username,
        displayName: sample.displayName,
        passwordHash: await hashPassword(password),
        role: "learner",
        status: "active",
        mustChangePassword: true,
        createdAt: now(),
      })
      .run();

    db.insert(schema.learnerProfiles)
      .values({
        userId: id,
        roleTitle: sample.profile.roleTitle,
        yearsExperience: sample.profile.yearsExperience,
        adminNotes: sample.profile.adminNotes,
        claimedSkills: sample.profile.claimedSkills,
        targetTracks: sample.profile.targetTracks,
        updatedAt: now(),
        updatedBy: null,
      })
      .run();

    created.push({ username: sample.username, password, id });
    console.log(`- created ${sample.username} (${sample.displayName})`);
  }

  if (issue) {
    const mock = new MockProvider({
      topicIds: content.orderedTopicIds,
      moduleIds: content.manifest.flatMap((t) => t.modules.filter((m) => m.available).map((m) => m.id)),
    });
    const ai = new AiService(db, env, { mock });
    const sandbox = await createSandbox(env, (m) => console.log(`  ${m}`));

    const worker = new JobWorker({
      db,
      tickMs: 60_000,
      handlers: { "assessment.blueprint": blueprintHandler({ db, ai, content, sandbox, log: (m) => console.log(`  ${m}`) }) },
    });

    for (const sample of SAMPLE_LEARNERS) {
      const user = db.select().from(schema.users).where(eq(schema.users.username, sample.username)).get();
      if (!user) continue;
      const existing = db.select().from(schema.assessments).where(eq(schema.assessments.userId, user.id)).get();
      if (existing) {
        console.log(`- ${sample.username} already has an assessment, skipping`);
        continue;
      }

      const assessmentId = newId();
      db.insert(schema.assessments)
        .values({
          id: assessmentId,
          userId: user.id,
          attemptNo: 1,
          status: "generating",
          config: {},
          hardWarnings: 0,
          softWarnings: 0,
          createdAt: now(),
        })
        .run();
      enqueue(db, { type: "assessment.blueprint", payload: { assessmentId } });
    }

    console.log("\ngenerating assessments…");
    await worker.drain();

    for (const sample of SAMPLE_LEARNERS) {
      const user = db.select().from(schema.users).where(eq(schema.users.username, sample.username)).get();
      if (!user) continue;
      const assessment = db.select().from(schema.assessments).where(eq(schema.assessments.userId, user.id)).get();
      if (!assessment) continue;

      const items = db
        .select()
        .from(schema.assessmentItems)
        .where(eq(schema.assessmentItems.assessmentId, assessment.id))
        .all();
      const kept = items.filter((i) => i.status === "pool");
      const blueprint = assessment.blueprint as { areas: { name: string }[] } | null;

      console.log(
        `  ${sample.username}: ${assessment.status} · ${blueprint?.areas.length ?? 0} areas · ${kept.length} items kept, ${items.length - kept.length} dropped`,
      );
    }
  }

  if (created.length > 0) {
    console.log("\nTemporary passwords (shown once):");
    for (const entry of created) console.log(`  ${entry.username.padEnd(16)} ${entry.password}`);
  }

  sqlite.pragma("wal_checkpoint(TRUNCATE)");
  sqlite.close();
}

main().catch((error: unknown) => {
  console.error("dev:seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
