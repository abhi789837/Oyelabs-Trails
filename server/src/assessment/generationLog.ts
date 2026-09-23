import { and, asc, eq, lte, max } from "drizzle-orm";

import type { GenerationLevel, GenerationLogLine, GenerationStage } from "../../../shared/assessment";
import { schema, type Db } from "../db";
import { newId, now } from "../lib/ids";

/**
 * The generation log (brief §13): a line per meaningful thing the blueprint job does, so the
 * superadmin who clicked "Issue assessment" can watch the run instead of staring at `generating`
 * for several minutes.
 *
 * Three rules hold this file together.
 *
 * **Nothing may leak the credential.** Every message goes through the one scrubber this codebase
 * has, `redact`, supplied by the caller. There is deliberately no second scrubber here: a provider
 * error can quote a command line, and that is how a sibling project shipped a token to a browser.
 *
 * **Nothing may leak an answer key.** A line may name an item, its kind, its area and its
 * difficulty, and say whether it was kept or dropped and why — as a fixed tag. It may never carry
 * option text, a correct answer, a rationale or a reference solution. That is why the caller
 * passes a `RejectionCode` rather than the prose drop reason: the prose quotes the expected output
 * and the critic's own answer, which *is* the key. Only the pool preview, which already shows
 * keys, shows the prose.
 *
 * **Nothing may break generation.** A line is a side effect of work that took a model several
 * seconds. It is not worth failing a run over, so every write is swallowed.
 */

/**
 * One run's ceiling. Past it the oldest lines go.
 *
 * A generation writes roughly one line per provider call plus one per dropped item — under a
 * hundred for a healthy run. The cap exists for the pathological one: a job that fails and is
 * retried appends to the same log, and without a bound that is unbounded growth.
 */
export const MAX_GENERATION_LOG_LINES = 400;

export interface GenerationLogOptions {
  db: Db;
  assessmentId: string;
  /** Always `redact`, via `AiService.redactSecrets`. Never a scrubber written for this file. */
  redactLine: (text: string) => string;
  /** Pushes a stored line to the admin's live feed. Optional: the log persists either way. */
  publish?: ((line: GenerationLogLine) => void) | undefined;
}

/** Usage from a finished provider call, so a line can say what it cost. */
export interface CallUsage {
  inputTokens?: number;
  outputTokens?: number;
  elapsedMs?: number;
}

export class GenerationLog {
  /** Continues where a previous job attempt left off, so a retry does not reuse sequence numbers. */
  private seq: number;

  constructor(private readonly options: GenerationLogOptions) {
    this.seq = lastSeq(options.db, options.assessmentId);
  }

  info(stage: GenerationStage, message: string, usage?: CallUsage): void {
    this.write("info", stage, message, usage);
  }

  warn(stage: GenerationStage, message: string): void {
    this.write("warn", stage, message);
  }

  error(stage: GenerationStage, message: string): void {
    this.write("error", stage, message);
  }

  private write(level: GenerationLevel, stage: GenerationStage, message: string, usage?: CallUsage): void {
    try {
      const line: GenerationLogLine = {
        assessmentId: this.options.assessmentId,
        seq: ++this.seq,
        stage,
        level,
        // Truncated as well as redacted: a provider error can carry a whole response body, and
        // the useful part is the start of it.
        message: this.options.redactLine(message).slice(0, 1000),
        inputTokens: usage?.inputTokens ?? null,
        outputTokens: usage?.outputTokens ?? null,
        elapsedMs: usage?.elapsedMs ?? null,
        at: now(),
      };

      this.options.db
        .insert(schema.generationLog)
        .values({
          id: newId(),
          assessmentId: line.assessmentId,
          seq: line.seq,
          stage: line.stage,
          level: line.level,
          message: line.message,
          inputTokens: line.inputTokens,
          outputTokens: line.outputTokens,
          elapsedMs: line.elapsedMs,
          createdAt: line.at,
        })
        .run();

      if (line.seq > MAX_GENERATION_LOG_LINES) {
        this.options.db
          .delete(schema.generationLog)
          .where(
            and(
              eq(schema.generationLog.assessmentId, line.assessmentId),
              lte(schema.generationLog.seq, line.seq - MAX_GENERATION_LOG_LINES),
            ),
          )
          .run();
      }

      this.options.publish?.(line);
    } catch {
      // Deliberately silent. A generation that fails because its log could not be written would
      // be a worse outcome than a generation nobody watched.
    }
  }
}

/** Reads one run's log in order, oldest first. Built field by field, like everything served. */
export function generationLogFor(db: Db, assessmentId: string): GenerationLogLine[] {
  return db
    .select()
    .from(schema.generationLog)
    .where(eq(schema.generationLog.assessmentId, assessmentId))
    .orderBy(asc(schema.generationLog.seq))
    .all()
    .map((row) => ({
      assessmentId: row.assessmentId,
      seq: row.seq,
      stage: row.stage,
      level: row.level,
      message: row.message,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      elapsedMs: row.elapsedMs,
      at: row.createdAt,
    }));
}

function lastSeq(db: Db, assessmentId: string): number {
  try {
    const row = db
      .select({ seq: max(schema.generationLog.seq) })
      .from(schema.generationLog)
      .where(eq(schema.generationLog.assessmentId, assessmentId))
      .get();
    return row?.seq ?? 0;
  } catch {
    return 0;
  }
}
