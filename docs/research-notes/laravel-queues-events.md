# Queues, Events & Scheduling research notes (2026-09-23)

Tenth camp of the v3 PHP & Laravel track. Scope decision: everything that runs **outside the
request** — queued jobs and their workers, failure handling, batches and chains, job middleware,
events, listeners and observers, and the scheduler. Routing/middleware belong to
`laravel-foundations`, Eloquent querying to `laravel-eloquent`, auth to `laravel-auth`, API
resources to `laravel-apis`, testing to `laravel-testing` and deployment infrastructure to
`laravel-deploy`; deployment appears here only where it is about keeping a worker alive
(`queue:restart`, Supervisor `stopwaitsecs`, signal handling, `schedule:interrupt`,
`horizon:terminate`).

14 topics, all **quiz** (150 questions). The sandbox is a V8 isolate and cannot grade PHP, so
difficulty is carried by predict-the-behaviour questions, configuration-interaction questions
(`retry_after` vs `--timeout`, Horizon `timeout` vs both) and "which of these actually prevents X"
questions. Every topic has ≥2 `isEdgeCaseOrInterviewQuestion` and ≥1 multi-select; the operational
topics have 4.

## Topics

1. `lv-queue-why-background-work` — Why Work Moves Off the Request (intermediate)
2. `lv-queue-drivers` — Connections, Queues and Choosing a Driver (advanced)
3. `lv-queue-jobs-dispatching` — Writing and Dispatching Jobs (intermediate)
4. `lv-queue-serialization` — Serialised Models and Job Payloads (advanced)
5. `lv-queue-transactions-idempotency` — Transactions, Ordering and Idempotency (expert,
   **milestone**)
6. `lv-queue-retries-failures` — Attempts, Backoff, Timeouts and Failed Jobs (advanced)
7. `lv-queue-job-middleware` — Job Middleware, Rate Limits and Uniqueness (advanced)
8. `lv-queue-routing` — Queue Routing with `Queue::route` (advanced) — **new in Laravel 13**
9. `lv-queue-batches-chains` — Batches and Chains (advanced)
10. `lv-queue-workers-production` — Running Workers in Production (expert, **milestone**)
11. `lv-queue-horizon` — Horizon (advanced)
12. `lv-queue-events-observers` — Events, Listeners and Model Observers (advanced)
13. `lv-queue-queued-listeners-mail` — Queued Listeners, Mail and Notifications (advanced)
14. `lv-queue-scheduling` — Task Scheduling in `routes/console.php` (advanced, **milestone**)

Merges made to fit the 11–14 budget while covering every item the brief named: retries/backoff/
timeouts and the failed-jobs table are one topic (one narrative: what happens when a job goes
wrong); "unique and rate-limited jobs" lives inside `lv-queue-job-middleware`, since
`WithoutOverlapping`, `RateLimited`, `ShouldBeUnique` and `#[DebounceFor]` are the same question
("may this run, now?") asked at execution time and at dispatch time; broadcasting-at-a-glance,
queued mail and queued notifications share one topic with queued listeners because they are
literally the same job machinery; and model observers sit with events rather than getting their
own camp. Queue routing kept its own topic despite being small, because it is new in 13 and the
brief asked for it to be prominent.

## Videos

Every id came from `scripts/research/yt.mjs search` and every entry was re-verified with
`yt.mjs info <id> --chapters`: 36 video entries across 26 distinct videos, all `embeddable: true`,
with titles, channels, durations, `startSeconds` and `chapterLabel` copied verbatim from the tool
output (a scripted diff of the finished module against YouTube reports 0 mismatches). No
search-URL fallbacks. No video is used as a *primary* twice at the same start time.

- `lv-queue-why-background-work` → **`GsdfZ5TfGPw`** "Understanding queues & background processing"
  (Mateus Guimarães, 11:52). Framework-agnostic framing of sync vs async and the payload/worker
  model, which is exactly the "why" this topic needs. Alternate: **`EBsvfjNUUj8`** @504 "Why do we
  use Queues?" from the official Laravel Worldwide Meetup.
- `lv-queue-drivers` → **`EBsvfjNUUj8`** @720 "Laravel's Queue system" (Laravel, 1:05:03 — a
  Harris Raftopoulos meetup talk, the most senior-level free Laravel queue material found).
  Alternate: **`DOaDpHh1FsQ`** "Using your Database as a Queue? Good or bad idea?" (CodeOpinion,
  9:31) for the driver-choice tradeoff from outside the Laravel bubble.
- `lv-queue-jobs-dispatching` → **`OhQ_3yaUQRQ`** "30 Days to Learn Laravel, Ep 25 — Queues Are
  Easier Than You Think" (Laracasts, 15:45). Alternate: **`D5tr7r2_i7E`** @234 "Creating custom
  jobs" (Laravel Daily).
- `lv-queue-serialization` → **`PeDiswbjLq8`** @154 "1. Keep arguments small" (Laravel Daily,
  25:05). Alternate: **`0bdRd__xiHc`** @384 "Handling deleted models" (Laravel Daily, 8:48).
- `lv-queue-transactions-idempotency` → **`mXmPTzoXTF8`** @220 "Dispatch job after commit"
  (Laravel, 7:22) — the official explanation of the exact race the topic is built around.
  Alternates: **`PeDiswbjLq8`** @432 "3. Make jobs idempotent" and **`XAccGbtl3Z8`** "Idempotency —
  What it is and How to Implement it" (Alex Hyett, 8:04, 78k views).
- `lv-queue-retries-failures` → **`IR5BSaPg0mE`** "Laravel Queues Lesson 2 — Failed jobs: listing,
  retrying and handling them" (Mateus Guimarães, 8:31). Alternates: **`PeDiswbjLq8`** @689
  "5. Handle retries and backoff" and **`EBsvfjNUUj8`** @2728 "Common mistakes with failed jobs".
- `lv-queue-job-middleware` → **`jGb5zIgwL4c`** "Laravel's atomic locks" (Aaron Francis, 14:12).
  Chosen as the primary because every mechanism in this topic — `WithoutOverlapping`,
  `ShouldBeUnique`, `#[DebounceFor]` — is a cache lock wearing a costume, and this is the only
  video that shows the lock itself (including a "Locks versus queues" chapter). Alternates:
  **`hcleT7NQyjY`** @37 "Make Job Middleware" (Laravel official) and **`PeDiswbjLq8`** @919
  "7. ShouldBeUnique and uniqueId()".
- `lv-queue-routing` → **`LpQHxxpmdP0`** @720 "Queue Routing Simplified" (Code Step By Step, 10:20,
  published Mar 2026). Modest channel (2.6k views) but it is the only video found that covers
  `Queue::route` at all; the Laravel 13 release videos with bigger audiences
  (`UnvBFcO3Vww`, `KSowC1CsqmQ`) have chapters for vector search, attributes and JSON:API but none
  for queue routing. Alternate: **`PeDiswbjLq8`** @301 "2. Every job should declare its queue".
- `lv-queue-batches-chains` → **`HErI5i-a0NI`** "Laravel Job Batch: Show Queue Progress" (Laravel
  Daily, 5:50). Alternates: **`mXmPTzoXTF8`** @34 "Job batches inside a chain" (Laravel) and
  **`PeDiswbjLq8`** @1130 "9. A batchable job must honour cancellation".
- `lv-queue-workers-production` → **`D5tr7r2_i7E`** @516 "Production queue setup" (Laravel Daily,
  Apr 2025 — the most current Supervisor walkthrough found). Alternates: **`iH4Skwaw-KU`** "How to
  Set up Laravel Queues on Production" (CodingX, 11:56) for the full Supervisor config, and
  **`PeDiswbjLq8`** @1331 "11. Keep jobs backwards compatible across deploys".
- `lv-queue-horizon` → **`r3c_qBvAHXA`** "Laravel Horizon: queue monitoring + configuration" (Aaron
  Francis, 14:53, 40k views) — 21 chapters including "Graceful Termination During Deployment" and
  "When Not to Use Horizon". Alternates: **`Lb6V4yQ2B4s`** (Laravel official, 5:04, Dec 2025) and
  **`LfncFzvnkXI`** Lesson 3 (Mateus Guimarães, 15:14).
- `lv-queue-events-observers` → **`_8Rrq_RtaB0`** "Let's talk about Events and Listeners" (Laravel
  official, 8:23). Alternates deliberately argue the other side: **`A3bmLo77e5M`** "Why Observers
  and Event Listeners are 'Risky'" (Laravel Daily, 8:44, 27k) and **`fqr5aT8oo3w`** "The dangers of
  events and observers in Laravel applications" (Mateus Guimarães, 29:06).
- `lv-queue-queued-listeners-mail` → **`rVx8xKisbr8`** "Laravel Queues 101: Example with Sending
  Emails" (Laravel Daily, 8:43, 83k views). Alternate: **`GGZF9E9mM_E`** "Should You Use a
  Notification or a Mailable?" (Laravel official, 12:48).
- `lv-queue-scheduling` → **`9PuO86iIFdc`** "Laravel 12 | Task Scheduling | Cron Job in Laravel"
  (Novice Developer, 31:45). **Flagged:** only ~1.1k views, but it is the most substantial
  scheduling video that post-dates Laravel 11 and therefore uses `routes/console.php`. Every
  high-view scheduling video found (`_NoWp58pHa4` Laratips 69k, `fUqrE9ZBH_Q` Code Step By Step
  73k, `UEsjzOvOWao` LaraPhant 23k) is five to seven years old and demonstrates
  `app/Console/Kernel.php`, which no longer exists — exactly the failure mode the brief warned
  about. Alternates: **`LM4OzsUAevY`** "Laravel 11 Task Scheduling Simplified: New Approach Without
  Kernel.php" (4:56) and **`KBAIWP8wfyQ`** "Laravel Scheduler: 5 'Tricks' You May Not Know"
  (Laravel Daily, 3:17). If a better scheduling video appears from a large channel, swap the
  primary; the content itself is written to the 13.x docs, not to the video.

`PeDiswbjLq8` ("Laravel Queues: 11 Must-Know Advanced Tips", Laravel Daily, published two days
before this camp was written) is used at six different chapter offsets — twice as a primary
(serialization @154) and four times as an alternate. Its chapter list maps almost one-to-one onto
this module's topics, and no two entries share a start time.

Searched and rejected: `UEsjzOvOWao` (LaraPhant scheduling, 23k views) — `info` reports
`embeddable: false`, so it cannot play in-app; `_NoWp58pHa4`, `fUqrE9ZBH_Q`, `MIljzQp2unM`,
`HL88M86qtIk` — all Kernel-era scheduling; `TIXkLiyz6sM`, `URluTJ8To0U`, `E-RHnSuLBP4`,
`6SSoQnJtRfg`, `VhKkNjbdKK4`, `wlN6h2j1jc4` — Hindi/Urdu; `7Ilm-mSAwFI` (19 views),
`SonR-etWcW0` (21 views), `MeQGulA2Dqo` (208 views) — too small to trust on operational claims;
`n6cb-Vjn0N4`, `N1Kp9Kbx19Q` (Rafael Lunardelli, batching) — Portuguese. No video exists anywhere
for `Queue::route`, `#[DebounceFor]`, `Queue::forward`, the `deferred`/`background` connections or
the `failover` driver beyond the single Laravel 13 round-up above; those are carried by the docs,
the summaries and the quizzes.

## References

All 47 URLs checked with `scripts/research/check-urls.mjs`: every one returns **200**, and the
stored URL is the final one after redirects. Official Laravel docs are first in every topic's list.

- **The `laravel.com/docs/13.x/…` → `laravel.com/framework/docs/13.x/…` redirect is real** and the
  final form is what is stored throughout, including on fragment links (`#queue-routing`,
  `#configuring-supervisor`, …). Every fragment used was taken from the `id="…"` attributes of the
  live page, not guessed: `#connections-vs-queues`, `#creating-jobs`, `#class-structure`,
  `#ignoring-missing-models`, `#jobs-and-database-transactions`, `#max-job-attempts-and-timeout`,
  `#dealing-with-failed-jobs`, `#job-middleware`, `#unique-jobs`, `#queue-routing`,
  `#queue-priorities`, `#job-batching`, `#job-chaining`, `#queue-workers-and-deployment`,
  `#configuring-supervisor`, `#job-expirations-and-timeouts`, `#dispatching-jobs`,
  `#queued-event-listeners`, `#dispatching-events-after-database-transactions`, `#queueing-mail`,
  `#queueing-notifications`, `#running-tasks-on-one-server`, `#balancing-strategies`,
  `#deploying-horizon`, `#observers`, `#atomic-locks`, `#method-invocation-and-injection`.
  Note that the Supervisor anchor on the **queues** page is `#configuring-supervisor` (the
  `#supervisor-configuration` form only exists on the Horizon page).
- `https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/` **redirects**
  to `https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/…`; the final URL is stored.
- `…/SQSDeveloperGuide/FIFO-queues.html` redirects to the guide index and was dropped;
  `sqs-visibility-timeout.html` and `standard-queues.html` resolve correctly and are used instead.
- **Iframe previews.** Only 3 of the 47 references can be framed: `brandur.org/idempotency-keys`,
  `supervisord.org/configuration.html` and `man7.org/linux/man-pages/man5/crontab.5.html`. Every
  `laravel.com` and `api.laravel.com` page sends `X-Frame-Options: SAMEORIGIN`, as do
  `docs.aws.amazon.com` and `www.php.net`; `martinfowler.com` sends `DENY`; `learn.microsoft.com`
  and `builder.aws.com` restrict via CSP `frame-ancestors`. So nearly every reference card in this
  camp falls back to a link preview, which matches what `php-web` found.
- **No interview-prep repo.** Same conclusion as the earlier PHP camps: there is no Laravel
  equivalent of `lydiahallie/javascript-questions` worth shipping. The interview weight is carried
  by the edge-case questions themselves, which are all real production failure modes.

## Facts verified

Read off the live Laravel 13.x docs on 2026-09-23, not from memory. Laravel 13 released
17 Mar 2026, requires PHP 8.3–8.5.

### Structure (the thing every old tutorial gets wrong)
- **There is no `app/Console/Kernel.php` and no `app/Http/Kernel.php`.** Scheduled tasks live in
  **`routes/console.php`** via the `Schedule` facade, or in `->withSchedule()` in
  `bootstrap/app.php`. Listener discovery directories are extended with `->withEvents(discover: [])`
  and retry policy with `->withExceptions(fn ($e) => $e->dontRetry([...]))`. No content in this
  camp shows a Kernel.

### New in Laravel 13
- **`Queue::route(ProcessPodcast::class, connection: 'redis', queue: 'podcasts')`** — central
  per-job-class default routing, called from a service provider's `boot()`. Accepts an
  **interface, trait or parent class** as well as a concrete class, plus an array form. "Queue
  routing can still be overridden by the job on a per-job basis."
- **`Queue::forward('reports', 'reports.fifo', 'sqs')`** re-points a queue name at other
  infrastructure. "An explicit connection configured on a job takes precedence over a forwarded
  connection."
- **Queue attributes on the class**: `#[Tries]`, `#[Backoff]` (scalar or array), `#[Timeout]`,
  `#[FailOnTimeout]`, `#[MaxExceptions]`, `#[UniqueFor]`, `#[DeleteWhenMissingModels]`,
  `#[WithoutRelations]` (property or class), `#[DebounceFor(seconds, maxWait:)]`, and on listeners
  also `#[Connection]`, `#[Queue]`, `#[Delay]`.
- **`deferred` and `background` connections**: `deferred` runs the job in the current process after
  the HTTP response is sent; `background` spawns a separate PHP process so the FPM worker is freed.
  Neither needs a queue worker. "The deferred connection also serves as the default failover queue."
- **`failover` driver** with an ordered `connections` list; dispatches `QueueFailedOver`; you must
  run a worker per real connection; Horizon manages Redis only.
- **SQS overflow storage**: with `overflow.enabled`, payloads of **at least 1 MB** are stored in a
  cache store and a pointer is sent through SQS.
- **SQS FIFO / fair queues**: `->onGroup()`, `messageGroup()`, `deduplicationId()`; without a group
  the queue name is used as the message group id.
- `PreparesForDispatch::prepareForDispatch(): bool` — returning `false` cancels the dispatch.
- `Bus::bulk()` groups jobs by connection and queue and pushes each group in bulk.
- `Interruptible::interrupted(int $signal)` — called only while a job is running when the worker
  receives a signal; explicitly "not a replacement for timeouts or the job's failed method".
- `queue:pause` / `queue:continue` / `queue:resume --all`, and
  `Queue::withoutInterruptionPolling()` (plus `Worker::$restartable` / `Worker::$pausable`) to
  disable the per-iteration cache poll.
- `$exceptions->dontRetry([...])` and `dontRetryWhen(closure)` in `bootstrap/app.php`.
- `FailOnException` middleware; `Skip::when/unless`; `Release::when/unless`.
- `Cache::touch(...)` exists in 13 (extends a TTL without a read-and-rewrite) — noted but not used,
  as it belongs to the cache camp.

### Attempts, timeouts and failure
- **"By default, Laravel will only attempt a job once."** `--tries=0` retries indefinitely.
- An attempt is consumed by: an unhandled exception, `$this->release()`, a middleware release
  (`WithoutOverlapping`, `RateLimited`), a timeout, **and** a successful run — all five are listed
  in the docs.
- **The default job timeout is 60 seconds.** `#[Timeout]` on the class beats `--timeout` on the CLI.
  PCNTL is required. `--timeout` "has no effect when the `queue:work` command is invoked with the
  `--once` option". "A job's timeout value should always be less than its retry after value."
- **`retryUntil` takes precedence over `tries`.**
- `#[FailOnTimeout]`: "By default, when a job times out, it consumes one attempt and is released
  back to the queue (if retries are allowed)" — the attribute makes it fail instead.
- `#[Backoff([1, 5, 10])]`: 1 s, 5 s, 10 s, then 10 s for every subsequent attempt.
- `failed(?Throwable)` runs on a **new instance**: "any class property modifications that may have
  occurred within the handle method will be lost." Exhaustion gives `MaxAttemptsExceededException`;
  timeout gives `TimeoutExceededException`.
- "Synchronously dispatched jobs that fail are not stored in this table and their exceptions are
  immediately handled by the application."
- `queue:failed`, `queue:retry <id|all|--queue=>`, `queue:forget`, `queue:flush [--hours]`,
  `queue:prune-failed [--hours]` (24 h default), `QUEUE_FAILED_DRIVER=null` to discard,
  `Queue::failing()` for the `JobFailed` event. With Horizon use `horizon:forget` / `horizon:clear`.

### Serialisation
- Only the model's **identifier** is serialised; the full model and its **loaded relations** are
  re-retrieved when the job runs, and "any previous relationship constraints … will not be applied
  when the job is deserialized".
- "If a job receives a collection or array of Eloquent models … the models within that collection
  will not have their relationships restored."
- Binary data "should be passed through the `base64_encode` function before being passed to a
  queued job".
- Missing row → `ModelNotFoundException`; `#[DeleteWhenMissingModels]` discards quietly.
- The uninitialised-typed-property claim in `lv-queue-serialization-q7` is PHP language behaviour
  (`unserialize()` restores only the properties present in the payload; reading an uninitialised
  typed property throws `Error`), and matches the docs' advice to keep jobs backward compatible
  across deploys.

### Transactions, locks and uniqueness
- `'after_commit' => true` defers dispatch until open transactions commit, discards on rollback,
  and "will also cause any queued event listeners, mailables, notifications, and broadcast events
  to be dispatched after all open database transactions have been committed". `->afterCommit()` /
  `->beforeCommit()` are the per-dispatch overrides.
- `ShouldQueueAfterCommit` (listener), `ShouldDispatchAfterCommit` (event — the event itself is
  held, so synchronous listeners wait too), `ShouldHandleEventsAfterCommit` (observer).
- **`scoped()` bindings are flushed per Octane request *and* per queued job** — the docs say so
  explicitly, which is what makes it the right cross-topic question for a long-lived worker.
- Atomic locks require a lock-capable cache driver: "memcached, redis, dynamodb, database, file,
  and array".
- `WithoutOverlapping` locks **per job class** by default; `->shared()` applies the key across
  classes; `->expireAfter()` bounds a stranded lock; `->releaseAfter()` / `->dontRelease()`.
- **"Unique job constraints do not apply to jobs within batches."**
- `ShouldBeUniqueUntilProcessing` releases the lock immediately *before* processing begins.
- "Debounced jobs and unique jobs are mutually exclusive"; a superseded debounced job fires
  `JobDebounced` and is removed from the queue.

### Batches and chains
- `make:queue-batches-table`; callbacks `before` ("created but no jobs have been added"),
  `progress` ("a single job has completed successfully"), `then` ("all jobs completed
  successfully"), `catch` ("only invoked for the first job that fails within the batch"), `finally`.
- A failure marks the batch cancelled unless `allowFailures()`. Cancelling does not stop queued
  jobs — they must check `$this->batch()->cancelled()` or use `SkipIfBatchCancelled`.
- "All batched jobs must execute within the same connection and queue." Callbacks are serialised,
  so `$this` must not be used. Jobs may be added to a batch **only from within a job in that
  batch**. `Batch` is JSON serialisable; `Bus::findBatch($id)`.
- In a chain, `$this->delete()` does **not** stop the chain — "the chain will only stop executing
  if a job in the chain fails."
- `queue:prune-batches [--hours] [--unfinished] [--cancelled]`, `queue:retry-batch <uuid>`.

### Workers, deployment and Horizon
- `queue:restart` "uses the cache to store restart signals"; workers exit gracefully **after
  finishing the current job**. Redis `block_for => 0` "will also prevent signals such as SIGTERM
  from being handled until the next job has been processed".
- Supervisor: `numprocs`, `autorestart=true`, and "`stopwaitsecs` … greater than the number of
  seconds consumed by your longest running job".
- `--once`, `--max-jobs`, `--max-time`, `--stop-when-empty`, `--sleep`, `--force` (maintenance
  mode), `-v` for job ids. "Daemon queue workers do not reboot the framework before processing each
  job… any static state created or modified by your application will not be automatically reset
  between jobs."
- Horizon is **Redis only** and "is not compatible with Redis Cluster at this time".
  `balance`: `auto` (default) / `simple` / `false`; `autoScalingStrategy`: `time` / `size` / `log`;
  `minProcesses`, `maxProcesses`, `balanceMaxShift`, `balanceCooldown`, `memory` (128 default),
  `maxJobs` (0), `maxTime` (0), `sleep` (3), `rest` (0), `nice` (0).
  **"When using the auto balancing strategy, Horizon does not enforce strict priority between
  queues"** — the order of the queue list is meaningless under `auto`.
  **"If you don't set the tries option, Horizon defaults to a single attempt."**
  "Always ensure the Horizon timeout is greater than any job-level timeout… the timeout value
  should always be at least a few seconds shorter than the `retry_after` value."
  Deploy with `horizon:terminate`; `viewHorizon` gate in `HorizonServiceProvider`; `silenced` /
  `silenced_tags` / the `Silenced` contract.

### Events and observers
- Listener **discovery** scans `app/Listeners` for `handle`/`__invoke` with a type-hinted event
  (union types supported); `event:list`, `event:cache` / `optimize`, `event:clear`;
  `ShouldBeDiscovered::shouldBeDiscovered()` for conditional registration.
- Returning `false` from a listener stops propagation.
- Model events: `retrieved`, `creating`, `created`, `updating`, `updated`, `saving`, `saved`,
  `deleting`, `deleted`, `trashed`, `forceDeleting`, `forceDeleted`, `restoring`, `restored`,
  `replicating`. "`saving` / `saved` … dispatch when a model is created or updated — even if the
  model's attributes have not been changed."
- **"When issuing a mass update or delete query via Eloquent, the `saved`, `updated`, `deleting`,
  and `deleted` model events will not be dispatched."** `Model::insert()` and `DB::table()` bypass
  Eloquent entirely for the same reason.
- `#[ObservedBy([UserObserver::class])]` or `User::observe(...)`; `saveQuietly()`,
  `deleteQuietly()`, `forceDeleteQuietly()`, `restoreQuietly()`, `Model::withoutEvents(closure)`.
- `Event::defer(closure, [events])` defers model events and listeners until a block completes.

### Queued listeners, mail, notifications, broadcasting
- Listener-only hooks: `viaConnection()`, `viaQueue()`, `withDelay($event)`,
  `shouldQueue($event): bool`, `middleware($event)`, `InteractsWithQueue`.
- Mailables: `Mail::to()->queue()`, or `implements ShouldQueue` so "even if you call the send
  method when mailing, the mailable will still be queued"; `$this->afterCommit()` in the
  constructor.
- Notifications: `ShouldQueue` + `Queueable`; `Notification::sendNow()` sends immediately anyway;
  **"a queued job will be created for each recipient and channel combination"** (3 recipients ×
  2 channels = 6 jobs); `viaQueues()` maps channel → queue; `delay()` and `withDelay()` accept
  per-channel arrays.
- `ShouldBroadcast` goes through the queue; `ShouldBroadcastNow` does not.

### Scheduling
- One cron entry: `* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1`.
- `Schedule::command()`, `Schedule::job($job, $queue, $connection)`, `Schedule::call()`,
  `Schedule::exec()`, `schedule:list`, `schedule:work` (local), `Schedule::daily()->group(fn () => …)`.
- Due tasks "execute sequentially based on the order they are defined"; `runInBackground()` is
  available **only** on `command` and `exec`.
- `withoutOverlapping($minutes)` — "By default, the lock will expire after 24 hours";
  `schedule:clear-cache` clears a stranded one.
- `onOneServer()` requires a shared `database`, `memcached`, `dynamodb` or `redis` cache; closures
  and parameterised jobs need `->name()`; `Schedule::useCache('database')` picks the store.
- Sub-minute tasks (`everySecond()` … `everyThirtySeconds()`) make `schedule:run` "continue running
  until the end of the current minute"; deployments should call `schedule:interrupt`; the docs
  recommend sub-minute tasks dispatch queued jobs or background commands.
- `evenInMaintenanceMode()`, `schedule:pause` / `schedule:continue` with `evenWhenPaused()`.
- Timezones: `timezone()`, `schedule_timezone` in `config/app.php`, and the explicit warning that
  DST "may run twice or even not at all… we recommend avoiding timezone scheduling when possible".
- Hooks: `before`, `after`, `onSuccess`, `onFailure` (non-zero exit code; `Stringable $output`),
  `sendOutputTo`, `appendOutputTo`, `emailOutputTo`, `emailOutputOnFailure`, `pingBefore`,
  `thenPing`, `pingOnSuccess`, `pingOnFailure` and their `…If` variants. Events:
  `ScheduledTaskStarting`, `ScheduledTaskFinished`, `ScheduledBackgroundTaskFinished`,
  `ScheduledTaskSkipped`, `ScheduledTaskFailed`.
