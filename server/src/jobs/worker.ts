import type { JobType } from "../../../shared/enums";
import type { Db } from "../db";
import { claimNext, completeJob, failJob, requeueAllRunning, type Job } from "./queue";

export type JobHandler = (job: Job) => Promise<void>;

export interface WorkerOptions {
  db: Db;
  handlers: Partial<Record<JobType, JobHandler>>;
  /** How often to look for work. */
  tickMs?: number;
  log?: (message: string, detail?: unknown) => void;
}

/**
 * The in-process job worker (brief §2 D10, §8.3).
 *
 * One loop, one job at a time. Blueprint generation and evaluation are minutes-long AI calls, and
 * running several at once against one shared credential is how a rate limit gets hit — the
 * concurrency that matters is already capped inside `AiService`.
 *
 * It ticks rather than sleeping exactly: a queued job is picked up within `tickMs`, and the loop
 * keeps draining while there is work, so a burst does not wait a full tick per job.
 */
export class JobWorker {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private stopped = false;
  private readonly tickMs: number;

  constructor(private readonly options: WorkerOptions) {
    this.tickMs = options.tickMs ?? 1000;
  }

  start(): void {
    // Anything left `running` belongs to a process that died before finishing.
    const requeued = requeueAllRunning(this.options.db);
    if (requeued > 0) this.options.log?.(`requeued ${requeued} job(s) left running by a previous process`);

    this.stopped = false;
    this.timer = setInterval(() => void this.drain(), this.tickMs);
    // Do not hold the process open just for the tick.
    this.timer.unref?.();
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    // Let an in-flight job finish rather than leaving it to be requeued on the next boot.
    while (this.running) await new Promise((resolve) => setTimeout(resolve, 50));
  }

  /** Runs queued jobs until there are none left. Exposed so tests need no timers. */
  async drain(): Promise<number> {
    if (this.running || this.stopped) return 0;
    this.running = true;
    let processed = 0;

    try {
      for (;;) {
        const job = claimNext(this.options.db);
        if (!job) break;

        const handler = this.options.handlers[job.type];
        if (!handler) {
          failJob(this.options.db, { ...job, attempts: job.maxAttempts }, `No handler registered for job type "${job.type}".`);
          continue;
        }

        try {
          await handler(job);
          completeJob(this.options.db, job.id);
          this.options.log?.(`job ${job.type} completed`, { id: job.id });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const { willRetry } = failJob(this.options.db, job, message);
          this.options.log?.(`job ${job.type} failed${willRetry ? ", will retry" : ""}: ${message}`, { id: job.id });
        }

        processed += 1;
        if (this.stopped) break;
      }
    } finally {
      this.running = false;
    }

    return processed;
  }
}
