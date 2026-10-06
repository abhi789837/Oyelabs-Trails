import { createHash } from "node:crypto";

import { z } from "zod";

import type { AiService } from "../../ai/service";
import type { AuthoredTopic } from "../../content/store";
import { gradeCode } from "../../content/grade";
import type { Db } from "../../db";
import type { CodeSandbox } from "../../sandbox";
import { readMeta, writeMeta } from "./meta";

/**
 * A worked solution for a coding Do step.
 *
 * The content has no reference solutions, so one is written by the AI once per challenge and then
 * **run against every test** (visible and hidden) in the same sandbox that grades learners. Only a
 * solution that passes all of them is ever shown, and it is cached in app_meta under the challenge's
 * hash, so it's written once, not once per learner. A failed try is remembered for a day, so a
 * challenge the AI can't solve doesn't cost a call on every request.
 */

export const SOLUTION_SYSTEM = `You write a short, correct, readable JavaScript solution to a coding exercise for a learner who has
already tried it three times. Return JSON: {"code": "...", "explanation": "..."}.
- "code" defines the named function exactly as asked (a plain function declaration), with no imports,
  no console output and no test code. Prefer clarity over cleverness. Handle every edge case the task names.
- "explanation" is 2-4 plain sentences on the idea behind it, for someone who got stuck.`;

export const solutionSchema = z.object({
  code: z.string().min(10).max(12_000),
  explanation: z.string().min(10).max(1500),
});

const FAIL_TTL_MS = 24 * 3600 * 1000;

interface Cached {
  hash: string;
  code: string | null;
  explanation: string | null;
  at: number;
}

export function challengeHash(topic: AuthoredTopic): string {
  return createHash("sha256").update(JSON.stringify(topic.codeChallenge ?? null)).digest("hex").slice(0, 24);
}

function cacheKey(topicId: string): string {
  return `lesson.solution:${topicId}`;
}

function readCached(db: Db, topic: AuthoredTopic): Cached | null {
  const raw = readMeta(db, cacheKey(topic.id));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Cached;
    if (parsed.hash !== challengeHash(topic)) return null;
    if (!parsed.code && Date.now() - parsed.at > FAIL_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function solutionPrompt(topic: AuthoredTopic): string {
  const c = topic.codeChallenge!;
  const visible = c.testCases.slice(0, 6).map((t) => `- ${t.description}: ${JSON.stringify(t.args).slice(0, 300)} -> ${JSON.stringify(t.expected).slice(0, 300)}`);
  return [`Function name: ${c.functionName}`, "", "Task:", c.instructions, "", "Starter code:", c.starterCode, "", "Some checks:", ...visible].join("\n");
}

export interface SolutionDeps {
  db: Db;
  ai: AiService;
  sandbox: CodeSandbox;
}

/** A checked solution, or null (no AI, the AI failed, or what it wrote didn't pass every test). */
export async function checkedSolution(deps: SolutionDeps, topic: AuthoredTopic, subjectUserId: string): Promise<{ code: string; explanation: string } | null> {
  if (topic.challengeType !== "code" || !topic.codeChallenge) return null;
  const cached = readCached(deps.db, topic);
  if (cached) return cached.code ? { code: cached.code, explanation: cached.explanation ?? "" } : null;
  if (!deps.ai.isConfigured()) return null;

  let written: z.infer<typeof solutionSchema>;
  try {
    const { data } = await deps.ai.generateJson({
      purpose: "tutor",
      task: "tutor_solution",
      system: SOLUTION_SYSTEM,
      user: solutionPrompt(topic),
      schema: solutionSchema,
      schemaName: "tutor_solution",
      meta: { subjectUserId },
      timeoutMs: 60_000,
    });
    written = data;
  } catch {
    return null;
  }

  const graded = await gradeCode(topic.codeChallenge, written.code, deps.sandbox, "partial").catch(() => null);
  const passes = Boolean(graded && graded.passedCount === graded.total && graded.total > 0);
  const record: Cached = { hash: challengeHash(topic), code: passes ? written.code : null, explanation: passes ? written.explanation : null, at: Date.now() };
  writeMeta(deps.db, cacheKey(topic.id), JSON.stringify(record));
  return passes ? { code: written.code, explanation: written.explanation } : null;
}
