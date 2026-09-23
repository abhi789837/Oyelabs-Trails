import type { Module } from "@/types/curriculum";

export default {
  id: "laravel-queues-events",
  trackId: "php",
  name: "Queues, Events & Scheduling",
  description:
    "Everything a Laravel app does outside the request: jobs and the workers that run them, retries, failures, batches, job middleware, events, listeners, observers, and the scheduler. This camp is deliberately operational — the hard parts here are what happens on deploy, under load, and at 3am, not the syntax.",
  refs: [
    { label: "Laravel: Queues", url: "https://laravel.com/framework/docs/13.x/queues", kind: "docs" },
    { label: "Laravel: Events", url: "https://laravel.com/framework/docs/13.x/events", kind: "docs" },
    { label: "Laravel: Task Scheduling", url: "https://laravel.com/framework/docs/13.x/scheduling", kind: "docs" },
    { label: "Laravel: Horizon", url: "https://laravel.com/framework/docs/13.x/horizon", kind: "docs" },
  ],
  topics: [
    {
      id: "lv-queue-why-background-work",
      moduleId: "laravel-queues-events",
      trackId: "php",
      title: "Why Work Moves Off the Request",
      summary:
        "A PHP request is a budget. The SAPI hands a worker to your script, the script runs, the response goes out, and every variable, connection and object is destroyed. There is no thread you can hand a slow task to and no process that outlives the response — shared-nothing gives you crash isolation for free, and takes background work away in the same breath. So \"do it later\" in PHP has to mean \"write it down somewhere durable and let a second process pick it up\". That store is the queue; the second process is a worker started by `php artisan queue:work`, which boots the same application again and loops.\n\nWhat you buy is decoupling: response time stops tracking work duration, retries come built in, and you can scale workers independently of web servers. What you pay is that the work is now asynchronous and invisible. The user's next request may not see the result yet. A failure happens where nobody is looking, so it needs its own alerting. And the job runs in a different process with no session, no request and no authenticated user unless you pass one.\n\nThe contract most people get wrong is delivery. Queues are at-least-once, not exactly-once: a worker that finishes the work and then dies before deleting the message leaves the job to be retried, so anything with a side effect — a charge, an email, a webhook — must be safe to run twice. Laravel's `sync` connection sidesteps all of this by running the job inline, which is why local development can hide every queueing bug you have.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Laravel: Queues — Introduction", url: "https://laravel.com/framework/docs/13.x/queues#introduction", kind: "docs" },
        { label: "Laravel: Request Lifecycle", url: "https://laravel.com/framework/docs/13.x/lifecycle", kind: "docs" },
        { label: "Microsoft: Queue-Based Load Leveling pattern", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling", kind: "article" },
      ],
      video: {
        title: "Understanding queues & background processing",
        channel: "Mateus Guimarães",
        url: "https://www.youtube.com/watch?v=GsdfZ5TfGPw",
        videoId: "GsdfZ5TfGPw",
        durationLabel: "11:52",
      },
      alternateVideos: [
        {
          title: "Laravel Worldwide Meetup - Queues, Jobs, and Workers: Building Resilient Background Processing",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=EBsvfjNUUj8",
          videoId: "EBsvfjNUUj8",
          startSeconds: 504,
          chapterLabel: "Why do we use Queues?",
          durationLabel: "1:05:03",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-queue-why-background-work-q1",
          prompt: "Why can't a classic PHP-FPM application just spawn a thread to finish slow work after the response is sent?",
          options: [
            "The request-per-process model tears down all state when the script ends, and FPM needs that worker back for the next request",
            "PHP has no way to represent a queue of pending work in memory",
            "OPcache disables threading for compiled scripts",
            "Laravel's service container forbids it",
          ],
          correctIndex: 0,
          explanation:
            "Shared-nothing means the interpreter is reset and the FPM worker is returned to the pool as soon as the response is flushed; nothing userland survives. Work that must outlive the response has to be written somewhere external and picked up by a separate process.",
        },
        {
          id: "lv-queue-why-background-work-q2",
          prompt: "A developer has `QUEUE_CONNECTION=sync` locally. What happens when their controller calls `ProcessPodcast::dispatch($podcast)`?",
          options: [
            "The job runs immediately in the same process, before `dispatch()` returns",
            "The job is written to the `jobs` table and runs when a worker is started",
            "The job is silently discarded because no worker is running",
            "The job runs after the HTTP response has been flushed to the browser",
          ],
          correctIndex: 0,
          explanation:
            "The `sync` driver executes the job inline, which is why a slow job makes the local request slow and why an exception inside the job surfaces as a request error. That last option describes Laravel 13's `deferred` connection, not `sync`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-why-background-work-q3",
          prompt: "Which of these are genuinely true once work moves to a queue? (Select all that apply.)",
          options: [
            "The user's response no longer waits for the work to finish",
            "Workers can be scaled independently of the web servers",
            "Failures now happen outside the request, so they need their own alerting",
            "The work is guaranteed to run exactly once",
            "Jobs are guaranteed to be processed in the order they were dispatched",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Queueing buys latency decoupling and independent scaling, and it moves failure out of the user's sight. It does not buy exactly-once delivery or ordering — several workers pull concurrently, and a retried job runs twice.",
        },
        {
          id: "lv-queue-why-background-work-q4",
          prompt: "A job charges a customer's card. The worker completes the charge and is then killed by the OOM killer before the job is deleted from the queue. What happens?",
          options: [
            "Another worker picks the same job up once its reservation expires and charges again, unless the job is idempotent",
            "The job is moved to `failed_jobs` and never runs again",
            "Nothing — the job is deleted from the queue as soon as `handle()` starts",
            "The queue driver rolls the charge back automatically",
          ],
          correctIndex: 0,
          explanation:
            "Deletion happens after `handle()` returns, so a job killed in between is still on the queue and will be retried. This is what \"at-least-once\" means in practice, and it is why side-effecting jobs need a guard rather than good luck.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-why-background-work-q5",
          prompt: "Laravel 13 ships a `deferred` queue connection. What does dispatching to it do?",
          options: [
            "Runs the job in the current PHP process after the HTTP response has been sent to the user",
            "Holds the job until every open database transaction has committed",
            "Pushes the job to Redis with a delay equal to the response time",
            "Spawns a separate PHP process to handle the job so FPM is freed immediately",
          ],
          correctIndex: 0,
          explanation:
            "`deferred` gets the work out of the user's wait without needing a worker, at the cost of holding the FPM process. The last option describes the sibling `background` connection; waiting for a commit is what `afterCommit()` does.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-why-background-work-q6",
          prompt: "A queued job needs to know which user triggered it. What is true inside `handle()`?",
          options: [
            "There is no request and no session, so the job must carry the user (or their id) that was passed in at dispatch time",
            "`auth()->user()` works because Laravel serialises the session into the job payload",
            "The job inherits the container instance of the request that dispatched it",
            "The `Auth` facade throws an exception inside queued jobs",
          ],
          correctIndex: 0,
          explanation:
            "A worker boots the framework once with no HTTP request behind it, so request-scoped state simply isn't there. Pass the id explicitly (or use Laravel's Context) rather than reaching for the auth helper.",
        },
        {
          id: "lv-queue-why-background-work-q7",
          prompt: "Which of these is the *weakest* candidate for moving onto a queue?",
          options: [
            "Computing a total that the same response has to render",
            "Sending a welcome email after registration",
            "Generating a PDF invoice and storing it",
            "Calling a third-party webhook after an order is placed",
          ],
          correctIndex: 0,
          explanation:
            "If the response needs the result, queueing it just means blocking on a round trip through the queue. The other three are classic queue work: slow, side-effecting, and nobody is waiting on the answer.",
        },
        {
          id: "lv-queue-why-background-work-q8",
          prompt: "A nightly report job takes 90 seconds of CPU. What does putting it on a queue actually change about the total work the system does?",
          options: [
            "Nothing — the same work is done, but on machines and at times you choose",
            "The report gets faster because workers are optimised for long tasks",
            "The report is skipped when the system is under load",
            "PHP runs the report in parallel with the request that dispatched it",
          ],
          correctIndex: 0,
          explanation:
            "Queue-based load levelling smooths a peak; it does not reduce work. The value is that the spike lands on worker capacity you can size separately, instead of on the web tier that also has to serve page loads.",
        },
        {
          id: "lv-queue-why-background-work-q9",
          prompt: "Which statement about a `php artisan queue:work` process is true?",
          options: [
            "It boots the framework once and then handles many jobs inside the same long-lived process",
            "It boots the framework fresh for each job, the way PHP-FPM does for each request",
            "It runs inside the web server's PHP-FPM pool",
            "It is started automatically by the first `dispatch()` call",
          ],
          correctIndex: 0,
          explanation:
            "That single boot is why workers are fast, and also why they keep running old code after a deploy and why static state survives between jobs. `queue:listen` does reboot per job, at a significant performance cost.",
        },
      ],
    },
    {
      id: "lv-queue-drivers",
      moduleId: "laravel-queues-events",
      trackId: "php",
      title: "Connections, Queues and Choosing a Driver",
      summary:
        "Two words in `config/queue.php` get confused constantly. A **connection** is a backend — a `database`, `redis`, `sqs` or `beanstalkd` entry with its own credentials and settings. A **queue** is a named pile of jobs *within* one connection. `onConnection('sqs')` changes which system stores the job; `onQueue('emails')` changes which pile it lands in on whatever connection is already selected. Workers consume named queues, and `--queue=high,default` is the only priority mechanism the default worker has.\n\nThe driver choice is a real architectural decision. `database` needs no new infrastructure, is transactional with the rest of your data and is the default connection in a new Laravel app, but every idle worker polls the `jobs` table and throughput is bounded by row contention — fine into the tens of jobs per second, painful beyond. `redis` is fast, supports a blocking pop via `block_for` instead of polling, and is the only driver Horizon can manage; the costs are another service to keep alive and durable, and a Redis Cluster deployment needs a `{hash tag}` in the queue name so all of a queue's keys land in one slot. `sqs` is managed and effectively unbounded, but swaps `retry_after` for a visibility timeout configured in AWS, caps message size (Laravel 13 can spill oversized payloads into a cache store), and takes up to 60 seconds to honour a `queue:clear`.\n\nThe setting that bites everyone is `retry_after`. It is the connection's promise that a job still running after N seconds is presumed dead and may be handed to another worker. If your worker `--timeout` is longer than `retry_after`, a slow job gets picked up a second time while the first copy is still running it. Keep `--timeout` several seconds *below* `retry_after`, always.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel: Queues — Connections vs. Queues", url: "https://laravel.com/framework/docs/13.x/queues#connections-vs-queues", kind: "docs" },
        { label: "Laravel: Queues — Job Expirations and Timeouts", url: "https://laravel.com/framework/docs/13.x/queues#job-expirations-and-timeouts", kind: "docs" },
        { label: "Laravel: Redis", url: "https://laravel.com/framework/docs/13.x/redis", kind: "docs" },
        { label: "AWS: Amazon SQS visibility timeout", url: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html", kind: "docs" },
      ],
      video: {
        title: "Laravel Worldwide Meetup - Queues, Jobs, and Workers: Building Resilient Background Processing",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=EBsvfjNUUj8",
        videoId: "EBsvfjNUUj8",
        startSeconds: 720,
        chapterLabel: "Laravel’s Queue system",
        durationLabel: "1:05:03",
      },
      alternateVideos: [
        {
          title: "Using your Database as a Queue? Good or bad idea?",
          channel: "CodeOpinion",
          url: "https://www.youtube.com/watch?v=DOaDpHh1FsQ",
          videoId: "DOaDpHh1FsQ",
          durationLabel: "9:31",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-queue-drivers-q1",
          prompt: "`ProcessPodcast::dispatch($podcast)->onQueue('emails');` — what did that change?",
          options: [
            "The queue the job lands on, within the currently selected connection",
            "The connection the job is stored on",
            "Both the connection and the queue",
            "Nothing, unless a worker is started with `--queue=emails`",
          ],
          correctIndex: 0,
          explanation:
            "`onQueue` only picks a pile inside the current connection; `onConnection` picks the backend. A worker does have to be told to consume `emails`, but the dispatch itself still changed where the job was written.",
        },
        {
          id: "lv-queue-drivers-q2",
          prompt: "What does `php artisan queue:work redis --queue=high,default` do?",
          options: [
            "Drains every job on `high` before touching `default`, re-checking `high` after each job",
            "Alternates between the two queues, one job at a time",
            "Splits its time proportionally between the two queues",
            "Processes `high` for a while, then permanently switches to `default`",
          ],
          correctIndex: 0,
          explanation:
            "The list is a strict priority order, evaluated on every loop iteration. That also means a sustained flood of `high` jobs can starve `default` entirely — priority is not fairness.",
        },
        {
          id: "lv-queue-drivers-q3",
          prompt: "Which of these are true of the `database` queue driver? (Select all that apply.)",
          options: [
            "It needs no extra infrastructure and is the default connection in a new Laravel application",
            "Idle workers poll the `jobs` table on an interval rather than blocking",
            "Its throughput is limited by contention on the `jobs` table as worker count grows",
            "It supports the `block_for` option for blocking pops",
            "Laravel Horizon can monitor and scale its workers",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`block_for` is a Redis-only option, and Horizon manages Redis queues only — a failover list that includes `database` still needs a plain `queue:work database` process alongside Horizon.",
        },
        {
          id: "lv-queue-drivers-q4",
          prompt: "A connection has `'retry_after' => 90` and the worker runs with `--timeout=120`. A job genuinely takes 100 seconds. What happens?",
          options: [
            "At 90 seconds a second worker picks the same job up and runs it concurrently with the first",
            "The job is killed at 90 seconds and marked as failed",
            "The first worker exits and the job is retried cleanly",
            "Nothing — `retry_after` only applies to jobs that threw an exception",
          ],
          correctIndex: 0,
          explanation:
            "`retry_after` is a reservation expiry, not a kill switch: once it lapses the job becomes visible again while the original worker is still happily running it. The rule is `--timeout` several seconds *below* `retry_after`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-drivers-q5",
          prompt: "Why is `sqs` the one connection in `config/queue.php` with no `retry_after` value?",
          options: [
            "SQS redelivers based on the queue's Default Visibility Timeout, which is configured in AWS rather than in Laravel",
            "SQS never redelivers a message",
            "SQS deletes a message as soon as it is received, so redelivery can't happen",
            "Laravel hard-codes 90 seconds for SQS",
          ],
          correctIndex: 0,
          explanation:
            "Visibility timeout is SQS's own version of the same idea, so the knob lives in the AWS console. You still have to keep your worker `--timeout` under it for exactly the same reason.",
        },
        {
          id: "lv-queue-drivers-q6",
          prompt: "A Redis connection is configured with `'block_for' => 0`. What is the consequence?",
          options: [
            "Workers block indefinitely until a job arrives, and won't handle signals such as SIGTERM until the next job is processed",
            "Workers never block and poll as fast as the CPU allows",
            "Jobs are processed with zero delay and the queue becomes strictly FIFO",
            "The worker exits immediately when the queue is empty",
          ],
          correctIndex: 0,
          explanation:
            "Zero means \"block forever\", which is efficient but makes the process deaf to restarts and deploy signals on an idle queue. A small positive value such as 5 keeps the blocking benefit without that trap.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-drivers-q7",
          prompt: "Why must a queue name contain a hash tag, e.g. `'queue' => '{default}'`, when the Redis connection is a Redis Cluster?",
          options: [
            "So all of the keys Laravel uses for that queue hash to the same slot and can be operated on together",
            "So Horizon can group the queue in its dashboard",
            "Because Redis Cluster rejects queue names without braces",
            "To namespace the queue against other applications sharing the cluster",
          ],
          correctIndex: 0,
          explanation:
            "A queue is several Redis keys (the list, the delayed set, the reserved set). Cluster only allows multi-key operations within one slot, and the `{…}` tag is what forces them there.",
        },
        {
          id: "lv-queue-drivers-q8",
          prompt: "With SQS overflow storage enabled (`overflow.enabled` true, `always` false), what does Laravel do with a very large job payload?",
          options: [
            "Stores payloads of at least 1 MB in the configured cache store and sends only a pointer through SQS",
            "Compresses the payload with gzip before sending it",
            "Splits the payload across several SQS messages and reassembles them",
            "Rejects the dispatch with an exception",
          ],
          correctIndex: 0,
          explanation:
            "The cache store has to retain the payload until a worker processes the job, so it should be a store you control — and ideally a dedicated one if you also enable `flush_on_clear`.",
        },
        {
          id: "lv-queue-drivers-q9",
          prompt: "An application sets `QUEUE_CONNECTION=failover` with `'connections' => ['redis', 'database', 'sync']`. What does that actually give you?",
          options: [
            "If pushing to `redis` fails, the job is pushed to `database` instead — but you must run a worker for each real connection in the list",
            "Jobs are written to all three connections and de-duplicated on read",
            "Failed jobs are automatically retried on the next connection",
            "Workers read from all three connections in priority order",
          ],
          correctIndex: 0,
          explanation:
            "Failover protects the *push*, not the processing: a job that lands on `database` is only ever picked up by a `queue:work database` process. `sync`, `deferred` and `background` need no worker because they run in the current process.",
        },
        {
          id: "lv-queue-drivers-q10",
          prompt: "An `imports` job takes 20 minutes; password-reset emails go through the same worker and are now arriving hours late. What is the cheapest correct fix?",
          options: [
            "Dispatch imports to their own queue and run a separate worker process for it",
            "Raise `--tries` on the shared worker",
            "Raise `--timeout` on the shared worker",
            "Switch the email job to the `sync` connection",
          ],
          correctIndex: 0,
          explanation:
            "A worker handles exactly one job at a time, so a long job blocks everything behind it. Separate queues (and separate worker processes) are how you buy isolation; retries and timeouts don't address head-of-line blocking at all.",
        },
      ],
    },
    {
      id: "lv-queue-jobs-dispatching",
      moduleId: "laravel-queues-events",
      trackId: "php",
      title: "Writing and Dispatching Jobs",
      summary:
        "A job is a small class with a constructor that captures data and a `handle()` method that does the work. `php artisan make:job ProcessPodcast` generates one implementing `ShouldQueue` and using the `Queueable` trait; that interface is the whole difference between \"push this onto a queue\" and \"run this now through the command bus\". `handle()` is resolved through the container, so you can type-hint services on it and get them injected in the worker, at execution time rather than dispatch time.\n\nDispatching has a small vocabulary worth knowing properly: `dispatch()`, `dispatchSync()` (always inline, whatever `QUEUE_CONNECTION` says), `dispatchIf()`/`dispatchUnless()`, `->delay()`, `->onQueue()`, `->onConnection()`, `->withoutDelay()`, and `Bus::bulk()` for pushing many independent jobs in grouped batches without batch tracking. You can also dispatch a closure, whose body is cryptographically signed so it can't be tampered with in transit — convenient for one-offs, but invisible to `make:job`-based tooling and awkward to test.\n\nThe framing that prevents most bugs: the constructor runs in the web process *now*, and `handle()` runs in a worker process *later*. Anything you compute in the constructor is frozen into the payload at dispatch time — a count, a formatted string, a config value — while anything you resolve in `handle()` reflects the world at execution time. Deciding which of those two you want, for each piece of data, is most of the skill. A related trap: `->onQueue()` chained at the call site is applied after the constructor has run, so a call-site setting quietly overrides one the job set on itself.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel: Queues — Creating Jobs", url: "https://laravel.com/framework/docs/13.x/queues#creating-jobs", kind: "docs" },
        { label: "Laravel: Queues — Dispatching Jobs", url: "https://laravel.com/framework/docs/13.x/queues#dispatching-jobs", kind: "docs" },
        { label: "Laravel: Service Container — Method Invocation and Injection", url: "https://laravel.com/framework/docs/13.x/container#method-invocation-and-injection", kind: "docs" },
      ],
      video: {
        title: "30 Days to Learn Laravel, Ep 25 - Queues Are Easier Than You Think",
        channel: "Laracasts",
        url: "https://www.youtube.com/watch?v=OhQ_3yaUQRQ",
        videoId: "OhQ_3yaUQRQ",
        durationLabel: "15:45",
      },
      alternateVideos: [
        {
          title: "Queues in Laravel: Main Things You Need to Know (Two Examples)",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=D5tr7r2_i7E",
          videoId: "D5tr7r2_i7E",
          startSeconds: 234,
          chapterLabel: "Creating custom jobs",
          durationLabel: "12:18",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-queue-jobs-dispatching-q1",
          prompt: "A job class does **not** implement `ShouldQueue`. What does `ProcessPodcast::dispatch($podcast)` do?",
          options: [
            "Handles the job immediately in the current process through the command bus",
            "Pushes it onto the default queue anyway",
            "Throws an exception at dispatch time",
            "Silently does nothing",
          ],
          correctIndex: 0,
          explanation:
            "`ShouldQueue` is the marker the bus checks. Without it you still get a dispatchable command object — it just runs synchronously, which is a perfectly valid pattern and a very common accident.",
        },
        {
          id: "lv-queue-jobs-dispatching-q2",
          prompt: "```php\npublic function handle(AudioProcessor $processor): void\n{\n    // ...\n}\n```\nWhere does `$processor` come from?",
          options: [
            "The service container in the worker process, resolved when the job is executed",
            "The job payload, serialised at dispatch time",
            "The constructor, via property promotion",
            "It must be passed to `dispatch()` as a second argument",
          ],
          correctIndex: 0,
          explanation:
            "Laravel resolves `handle()`'s dependencies through the container at execution time, so services are fresh and never serialised. `bindMethod()` lets you take over that resolution if you need to.",
        },
        {
          id: "lv-queue-jobs-dispatching-q3",
          prompt: "A job's constructor contains `$this->total = Order::count();`. The job is dispatched at 09:00 and a backlogged worker runs it at 09:40. What is `$this->total` inside `handle()`?",
          options: [
            "The count as it was at 09:00, serialised into the payload at dispatch time",
            "The count at 09:40, because the job re-runs its constructor in the worker",
            "Always zero, because integers are not serialised",
            "Null, because the constructor doesn't run in the worker",
          ],
          correctIndex: 0,
          explanation:
            "Constructor work happens once, in the dispatching process, and the resulting property values are frozen into the payload. If you want the value at execution time, query it in `handle()`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-jobs-dispatching-q4",
          prompt: "`QUEUE_CONNECTION=redis`. What does `ProcessPodcast::dispatchSync($podcast)` do?",
          options: [
            "Runs the job inline in the current process, ignoring the configured connection",
            "Pushes it to Redis and blocks until a worker finishes it",
            "Pushes it to Redis on the `sync` queue",
            "Throws, because `dispatchSync` requires `QUEUE_CONNECTION=sync`",
          ],
          correctIndex: 0,
          explanation:
            "`dispatchSync` is a per-call decision, not a connection lookup — useful when one particular job must complete before the response is built. Note that a job failing this way is never recorded in `failed_jobs`.",
        },
        {
          id: "lv-queue-jobs-dispatching-q5",
          prompt: "With `QUEUE_CONNECTION=redis`, which of these actually place work on a queue rather than running it now? (Select all that apply.)",
          options: [
            "`ProcessPodcast::dispatch($podcast)`",
            "`dispatch(function () use ($id) { /* ... */ })`",
            "`ProcessPodcast::dispatchSync($podcast)`",
            "`ProcessPodcast::dispatchIf(false, $podcast)`",
            "`(new ProcessPodcast($podcast))->handle()`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Queued closures are real queue work. `dispatchSync` runs inline, `dispatchIf(false, …)` does nothing at all, and calling `handle()` yourself just invokes a method — no queue, no retries, no container injection.",
        },
        {
          id: "lv-queue-jobs-dispatching-q6",
          prompt: "What does Laravel do to a queued closure before it goes on the queue?",
          options: [
            "Cryptographically signs the closure's code so it cannot be modified in transit",
            "Compiles it to a temporary job class on disk",
            "Rejects it unless it captures no variables",
            "Runs it once to verify it doesn't throw",
          ],
          correctIndex: 0,
          explanation:
            "The signature is what makes it safe to put executable code in a queue store. It does not make the closure easy to test or to find with `make:job`-oriented tooling, which is the usual argument for a class.",
        },
        {
          id: "lv-queue-jobs-dispatching-q7",
          prompt: "A job is dispatched with `->delay(now()->plus(hours: 2))` onto an SQS connection. What happens?",
          options: [
            "SQS caps delivery delay at 15 minutes, so the delay does not behave as written",
            "The job runs exactly two hours later",
            "SQS rejects the message and the dispatch throws",
            "Laravel stores the job locally for two hours and then pushes it",
          ],
          correctIndex: 0,
          explanation:
            "Amazon SQS has a maximum delay of 15 minutes. Long delays on SQS need a different approach — a scheduled dispatcher, or a driver that supports real delayed sets such as Redis or the database.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-jobs-dispatching-q8",
          prompt: "What does `Bus::bulk($users->map(fn ($u) => new ProcessUser($u)))` give you over a `foreach` of `dispatch()` calls?",
          options: [
            "Jobs are grouped by connection and queue and pushed in bulk, cutting the number of round trips",
            "Completion callbacks when all of the jobs have finished",
            "A progress percentage you can query later",
            "A guarantee that the jobs run in the order given",
          ],
          correctIndex: 0,
          explanation:
            "`Bus::bulk` is purely a push optimisation. Callbacks, progress and cancellation are what `Bus::batch` adds — and it needs the `job_batches` table to track them.",
        },
        {
          id: "lv-queue-jobs-dispatching-q9",
          prompt: "A Laravel 13 job implements `PreparesForDispatch` and its `prepareForDispatch()` returns `false`. What happens?",
          options: [
            "The job is not dispatched at all",
            "The job is dispatched but immediately released back to the queue",
            "The job is dispatched and marked as failed",
            "The return value is ignored; the hook exists only for mutation",
          ],
          correctIndex: 0,
          explanation:
            "It's a pre-flight veto that runs in the dispatching process — useful for \"don't queue this if an identical sync is already running\" checks that would otherwise need a wrapper around every call site.",
        },
        {
          id: "lv-queue-jobs-dispatching-q10",
          prompt: "The job's constructor calls `$this->onQueue('processing')`, and the call site dispatches with `->onQueue('urgent')`. Which queue does the job land on?",
          options: [
            "`urgent` — the fluent call is applied after the constructor has run",
            "`processing` — settings on the job class always win",
            "Both, as two copies of the job",
            "The connection's default queue, because the two settings conflict",
          ],
          correctIndex: 0,
          explanation:
            "Construction happens first, then the pending dispatch is configured, so the last writer wins. It's a common source of \"but I set the queue on the job\" confusion — and the reason Laravel 13's central `Queue::route` is easier to reason about.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "lv-queue-serialization",
      moduleId: "laravel-queues-events",
      trackId: "php",
      title: "Serialised Models and Job Payloads",
      summary:
        "Everything you put in a job's constructor has to survive a trip through a queue store as text, so the job object is serialised at dispatch and rebuilt in the worker. Laravel's `Queueable` trait makes one very deliberate exception for Eloquent: instead of serialising a model's attributes it stores the class name and primary key, plus the names of the relations that were loaded, and re-queries on the way back in. The payload stays small and the job sees current data.\n\nThat choice has three consequences people meet the hard way. If the row is deleted while the job waits, the re-query throws `ModelNotFoundException` and burns attempts until the job fails — `#[DeleteWhenMissingModels]` turns that into a quiet discard, which is what you want for \"send a notification about this thing\" and emphatically not what you want for \"reverse this payment\". If you loaded a relation with constraints, those constraints are gone on the way back: the relation is re-retrieved in full, so `$podcast->comments` that was ten approved rows at dispatch can be fifty thousand rows in the worker. Use `withoutRelations()`, the `#[WithoutRelations]` attribute on a property or the whole class, and re-constrain inside `handle()`. Models inside a collection or array never have their relations restored at all, by design.\n\nThe rest is payload hygiene: pass ids rather than big arrays (the payload is written once and read on every attempt), base64-encode binary data so it survives JSON, and add `ShouldBeEncrypted` when the payload contains anything you wouldn't want visible in Redis or an SQS console. The deploy-shaped gotcha: jobs serialised by yesterday's class are unserialised by today's, so adding a non-nullable typed property is a breaking change for every job already on the queue.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel: Queues — Class Structure", url: "https://laravel.com/framework/docs/13.x/queues#class-structure", kind: "docs" },
        { label: "Laravel: Queues — Ignoring Missing Models", url: "https://laravel.com/framework/docs/13.x/queues#ignoring-missing-models", kind: "docs" },
        { label: "PHP Manual: serialize", url: "https://www.php.net/manual/en/function.serialize.php", kind: "docs" },
      ],
      video: {
        title: "Laravel Queues: 11 Must-Know Advanced Tips",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=PeDiswbjLq8",
        videoId: "PeDiswbjLq8",
        startSeconds: 154,
        chapterLabel: "1. Keep arguments small",
        durationLabel: "25:05",
      },
      alternateVideos: [
        {
          title: "Laravel Queue Jobs: Avoid Failures by Double-Checking Everything",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=0bdRd__xiHc",
          videoId: "0bdRd__xiHc",
          startSeconds: 384,
          chapterLabel: "Handling deleted models",
          durationLabel: "8:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-queue-serialization-q1",
          prompt: "A job's constructor takes `public Podcast $podcast`. What is actually written into the queue payload?",
          options: [
            "The model's class name and primary key, plus which relations were loaded",
            "Every attribute of the model, as JSON",
            "A PHP `serialize()` string of the full model object including its connection",
            "Nothing — models must be passed as ids",
          ],
          correctIndex: 0,
          explanation:
            "Laravel stores an identifier and re-retrieves the model when the job runs. That keeps payloads small and means the job operates on current data rather than a snapshot.",
        },
        {
          id: "lv-queue-serialization-q2",
          prompt: "A job holding a `Podcast` is queued, and the podcast row is deleted before a worker picks the job up. What happens by default?",
          options: [
            "Re-retrieving the model throws `ModelNotFoundException`, which consumes attempts and eventually lands the job in `failed_jobs`",
            "The property is set to `null` and `handle()` runs normally",
            "The job is silently deleted from the queue",
            "The worker crashes and restarts",
          ],
          correctIndex: 0,
          explanation:
            "The exception is thrown during deserialisation, before your code runs. `#[DeleteWhenMissingModels]` makes Laravel discard the job quietly instead — appropriate when the work is meaningless without the model, and dangerous when it isn't.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-serialization-q3",
          prompt: "```php\n$podcast->load(['comments' => fn ($q) => $q->where('approved', true)]);\nProcessPodcast::dispatch($podcast);\n```\nInside `handle()`, what does `$this->podcast->comments` contain?",
          options: [
            "Every comment on the podcast — the `approved` constraint is not serialised",
            "The approved comments, exactly as loaded at dispatch time",
            "An empty collection, because relations are never restored",
            "The approved comments as they were, plus any added since",
          ],
          correctIndex: 0,
          explanation:
            "Only the *names* of loaded relations travel; the worker re-retrieves them in full. Re-apply the constraint inside the job, or don't serialise the relation at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-serialization-q4",
          prompt: "Which of these keep a job payload small and free of relation surprises? (Select all that apply.)",
          options: [
            "Calling `$podcast->withoutRelations()` before assigning it to a property",
            "Putting the `#[WithoutRelations]` attribute on the property or on the job class",
            "Passing primary keys and re-querying inside `handle()`",
            "Adding `ShouldBeEncrypted` to the job",
            "Dispatching the job with `dispatchSync()`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Encryption changes who can read the payload, not how big it is — encrypted payloads are slightly larger. `dispatchSync` skips the queue entirely and dodges the question rather than answering it.",
        },
        {
          id: "lv-queue-serialization-q5",
          prompt: "A job's constructor accepts a `Collection` of 500 `User` models, each with `profile` eager-loaded. What happens to those relations in the worker?",
          options: [
            "They are not restored — Laravel deliberately skips relation restoration for collections and arrays of models",
            "They are restored in full, one query per model",
            "They are restored with the original constraints intact",
            "The dispatch throws, because collections cannot be serialised",
          ],
          correctIndex: 0,
          explanation:
            "Restoring relations for every model in a large collection would be a resource disaster, so the framework doesn't. Eager-load what you need inside the job instead.",
        },
        {
          id: "lv-queue-serialization-q6",
          prompt: "A job needs raw image bytes read from a temporary file. What does the documentation tell you to do?",
          options: [
            "Base64-encode the data before passing it into the job",
            "Store it in a `resource` property so PHP streams it",
            "Compress it with `gzcompress()` first",
            "Pass it as a `SplFileObject`",
          ],
          correctIndex: 0,
          explanation:
            "Payloads are serialised to JSON, and arbitrary binary bytes are not valid UTF-8. In practice the better answer is usually to put the file on disk and pass a path, so the payload stays tiny.",
        },
        {
          id: "lv-queue-serialization-q7",
          prompt: "A deploy adds a new promoted property `public int $tier` to a job class. Several hundred jobs serialised by the previous version are still on the queue. What happens when a worker picks one of the old ones up?",
          options: [
            "The old payload never sets `$tier`, so reading it throws an `Error` about a typed property accessed before initialisation",
            "PHP fills `$tier` with `0` because it is an `int`",
            "The job is rejected at deserialisation and moved straight to `failed_jobs`",
            "Nothing — Laravel re-runs the constructor with the stored arguments",
          ],
          correctIndex: 0,
          explanation:
            "Unserialising restores the properties present in the payload and nothing else, and an uninitialised typed property is an error on access, not `null`. Ship new properties nullable (or with a default) and remove old ones a deploy later.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-serialization-q8",
          prompt: "What does adding `ShouldBeEncrypted` to a job class protect against?",
          options: [
            "Anyone with read access to the queue store — Redis, an SQS console, the `jobs` table — seeing the payload's contents",
            "A worker running the job twice",
            "A malicious client modifying the job's arguments before dispatch",
            "The payload exceeding the driver's maximum message size",
          ],
          correctIndex: 0,
          explanation:
            "It encrypts the payload at rest and in transit between your app and the broker using `APP_KEY`. The worker still decrypts and runs it, so it is not a defence against compromised application code.",
        },
        {
          id: "lv-queue-serialization-q9",
          prompt: "Why might \"email the customer their invoice total\" be the wrong kind of job to hand an Eloquent model to?",
          options: [
            "The worker re-queries the row, so the email reflects the total at *execution* time, not the total when the job was dispatched",
            "Eloquent models cannot be serialised into a job at all",
            "The relation would be loaded twice, doubling the total",
            "Mail jobs cannot receive models, only arrays",
          ],
          correctIndex: 0,
          explanation:
            "Re-querying is usually a feature — you want current data. When the job is meant to capture a moment, snapshot the values you need into scalar properties instead.",
        },
        {
          id: "lv-queue-serialization-q10",
          prompt: "A queued event class needs its `Order` property to survive being pushed onto the queue by a queued listener. Which trait does the event class use?",
          options: [
            "`Illuminate\\Queue\\SerializesModels`",
            "`Illuminate\\Bus\\Batchable`",
            "`Illuminate\\Queue\\InteractsWithQueue`",
            "`Illuminate\\Broadcasting\\InteractsWithSockets`",
          ],
          correctIndex: 0,
          explanation:
            "`SerializesModels` gives events the same key-and-re-query behaviour jobs get from `Queueable`. `Batchable` is for batch membership, `InteractsWithQueue` exposes `release()`/`delete()`, and `InteractsWithSockets` is a broadcasting concern.",
        },
      ],
    },
    {
      id: "lv-queue-transactions-idempotency",
      moduleId: "laravel-queues-events",
      trackId: "php",
      title: "Transactions, Ordering and Idempotency",
      summary:
        "These are the most expensive three lines in Laravel:\n\n```php\nDB::transaction(function () {\n    $order = Order::create([...]);\n    ProcessOrder::dispatch($order);\n});\n```\n\n`dispatch()` writes to Redis the instant it is called, and Redis knows nothing about your open transaction. A worker with idle capacity can pop the job, re-query the order, and find nothing — because the `INSERT` has not committed yet. It fails intermittently, only under load, and only in production.\n\nThe fixes are all the same idea applied at different scopes: `'after_commit' => true` on the queue connection defers every dispatch until open transactions commit (and discards them if the transaction rolls back); `->afterCommit()` and `->beforeCommit()` opt individual dispatches in and out; `ShouldQueueAfterCommit` does it for a listener; `ShouldDispatchAfterCommit` holds the *event* itself until commit, so even synchronous listeners wait; `ShouldHandleEventsAfterCommit` does the same for a model observer. Turning `after_commit` on globally also defers queued listeners, mailables, notifications and broadcast events.\n\nCommit ordering is only half the problem. Queues are at-least-once, so every job must tolerate running twice: a timeout, a `retry_after` expiry, or a killed worker can all replay a job whose first run already did some or all of the work. Idempotency means a guard the second run hits — a `processed_at` column checked and set, a unique index on an idempotency key, or an atomic `Cache::add()` — and not a check-then-act pair, which two workers can interleave. Ordering is the other thing queues don't promise: with several workers there is no guarantee that job A dispatched before job B finishes first. If order matters, use a chain, or an SQS FIFO queue with a message group, not hope.",
      level: "expert",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "Laravel: Queues — Jobs & Database Transactions", url: "https://laravel.com/framework/docs/13.x/queues#jobs-and-database-transactions", kind: "docs" },
        { label: "Laravel: Events — Dispatching Events After Database Transactions", url: "https://laravel.com/framework/docs/13.x/events#dispatching-events-after-database-transactions", kind: "docs" },
        { label: "Brandur Leach: Implementing Stripe-like Idempotency Keys", url: "https://brandur.org/idempotency-keys", kind: "article" },
        { label: "AWS: Amazon SQS standard queues (at-least-once delivery)", url: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues.html", kind: "docs" },
      ],
      video: {
        title: "Dispatch after commit, run job batches inside chains & more",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=mXmPTzoXTF8",
        videoId: "mXmPTzoXTF8",
        startSeconds: 220,
        chapterLabel: "Dispatch job after commit",
        durationLabel: "7:22",
      },
      alternateVideos: [
        {
          title: "Laravel Queues: 11 Must-Know Advanced Tips",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=PeDiswbjLq8",
          videoId: "PeDiswbjLq8",
          startSeconds: 432,
          chapterLabel: "3. Make jobs idempotent",
          durationLabel: "25:05",
        },
        {
          title: "Idempotency - What it is and How to Implement it",
          channel: "Alex Hyett",
          url: "https://www.youtube.com/watch?v=XAccGbtl3Z8",
          videoId: "XAccGbtl3Z8",
          durationLabel: "8:04",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-queue-transactions-idempotency-q1",
          prompt: "```php\nDB::transaction(function () {\n    $order = Order::create([/* ... */]);\n    ProcessOrder::dispatch($order);\n});\n```\nWith a Redis connection and default settings, what is the intermittent failure here?",
          options: [
            "A worker can pop the job and re-query the order before the transaction commits, so the row isn't there yet",
            "The job payload is written inside the transaction and rolls back with it",
            "Redis refuses writes while a MySQL transaction is open",
            "The job runs twice — once inside and once after the transaction",
          ],
          correctIndex: 0,
          explanation:
            "The push happens immediately and the commit happens later. Under load a worker wins that race and hits `ModelNotFoundException` — or, worse, reads a stale version of a row the transaction was updating.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-transactions-idempotency-q2",
          prompt: "Which change fixes that race for every dispatch in the application without editing call sites?",
          options: [
            "Set `'after_commit' => true` on the queue connection in `config/queue.php`",
            "Set `'retry_after' => 300` on the queue connection",
            "Wrap every job's `handle()` in `DB::transaction()`",
            "Add `#[Tries(5)]` to every job class",
          ],
          correctIndex: 0,
          explanation:
            "`after_commit` makes the queue wait for open transactions to commit before actually pushing. Retries only paper over the symptom, and they still fail if the transaction never commits.",
        },
        {
          id: "lv-queue-transactions-idempotency-q3",
          prompt: "`after_commit` is `true` globally, but one job must be pushed immediately even though a transaction is open. What do you call?",
          options: [
            "`->beforeCommit()` on the dispatch",
            "`->withoutDelay()` on the dispatch",
            "`dispatchSync()` instead of `dispatch()`",
            "`DB::commit()` before dispatching",
          ],
          correctIndex: 0,
          explanation:
            "`beforeCommit()` is the per-dispatch opt-out, mirroring `afterCommit()` as the per-dispatch opt-in. `withoutDelay()` bypasses a configured delay, which is a different concern entirely.",
        },
        {
          id: "lv-queue-transactions-idempotency-q4",
          prompt: "Setting `'after_commit' => true` on a connection also defers which of these? (Select all that apply.)",
          options: [
            "Queued event listeners",
            "Queued mailables",
            "Broadcast events",
            "Eloquent model observers",
            "Jobs sent with `dispatchSync()`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Everything the framework queues goes through the same path. Observers are not queue work and need `ShouldHandleEventsAfterCommit` of their own, and `dispatchSync` never touches the queue.",
        },
        {
          id: "lv-queue-transactions-idempotency-q5",
          prompt: "A job is dispatched with `->afterCommit()` inside a transaction that then throws and rolls back. What happens to the job?",
          options: [
            "It is discarded and never pushed",
            "It is pushed anyway, since the dispatch already happened",
            "It is pushed with a delay equal to the transaction duration",
            "It is written to `failed_jobs`",
          ],
          correctIndex: 0,
          explanation:
            "The dispatch is held against the transaction, so a rollback drops it. That symmetry is the point: no job should exist for work that was undone.",
        },
        {
          id: "lv-queue-transactions-idempotency-q6",
          prompt: "Two copies of the same job are running concurrently, because the first copy exceeded `retry_after` while still working. Which guard actually prevents the side effect happening twice?",
          options: [
            "`Cache::add($key, true, 3600)` and returning early when it reports the key already existed",
            "`if (Cache::has($key)) return;` followed by `Cache::put($key, true)`",
            "Reading a `processed` flag at the top of `handle()` and writing it at the very end",
            "Dispatching the job with `->delay(10)`",
          ],
          correctIndex: 0,
          explanation:
            "`Cache::add` is atomic — exactly one caller gets `true`. Both check-then-act variants leave a window for the other copy to slip through, and the wider that window, the more reliably it fails under load.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-transactions-idempotency-q7",
          prompt: "What is the difference between `ShouldDispatchAfterCommit` on an *event* and `ShouldQueueAfterCommit` on a *listener*?",
          options: [
            "The first holds the whole event until commit, so even synchronous listeners wait; the second lets the event fire now but holds that listener's queued job",
            "They are aliases for the same behaviour",
            "The first defers the event by one second; the second defers it until the next request",
            "The first applies only to broadcast events; the second only to mail",
          ],
          correctIndex: 0,
          explanation:
            "Choosing between them is choosing what has to wait. If a synchronous listener also reads the uncommitted rows, deferring only the queued listener doesn't help you.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-transactions-idempotency-q8",
          prompt: "Why does Laravel's container offer `scoped()` bindings in addition to `singleton()`?",
          options: [
            "A scoped instance is flushed at the start of each new lifecycle — each Octane request and each queued job — so a long-lived worker can't leak one job's state into the next",
            "Scoped bindings are resolved lazily and singletons are not",
            "Scoped bindings are only available inside service providers",
            "Scoped bindings are automatically serialised into job payloads",
          ],
          correctIndex: 0,
          explanation:
            "A worker process handles thousands of jobs without rebooting, so a `singleton` holding per-job state is a cross-contamination bug waiting to happen. `scoped` (or the `#[Scoped]` attribute) gives you singleton semantics with per-job isolation.",
        },
        {
          id: "lv-queue-transactions-idempotency-q9",
          prompt: "Two jobs are dispatched in order onto the same Redis queue, and five workers are running. Is job A guaranteed to finish before job B?",
          options: [
            "No — workers pop concurrently, so ordering needs a chain, a single worker, or a FIFO queue with a message group",
            "Yes — Redis lists are FIFO, so the ordering is guaranteed",
            "Yes, as long as both jobs have the same `#[Tries]` value",
            "Only if `after_commit` is enabled",
          ],
          correctIndex: 0,
          explanation:
            "Popping is ordered; *completing* is not. Job A can be released and retried while B sails through. `Bus::chain` gives you sequencing, and SQS FIFO with `onGroup()` gives it per group key.",
        },
        {
          id: "lv-queue-transactions-idempotency-q10",
          prompt: "Which of these is the strongest idempotency guard for \"create an invoice for this order\"?",
          options: [
            "A unique index on `invoices.order_id`, catching the duplicate-key error on the second run",
            "Checking `Invoice::where('order_id', $id)->exists()` at the top of `handle()`",
            "Setting `#[Tries(1)]` so the job never retries",
            "Logging a warning when the job runs more than once",
          ],
          correctIndex: 0,
          explanation:
            "The database constraint is the only option that two concurrent workers cannot both pass. `#[Tries(1)]` doesn't stop a `retry_after` expiry from producing a second in-flight copy, and it silently throws away genuinely transient failures.",
        },
      ],
    },
    {
      id: "lv-queue-retries-failures",
      moduleId: "laravel-queues-events",
      trackId: "php",
      title: "Attempts, Backoff, Timeouts and Failed Jobs",
      summary:
        "An *attempt* is not \"a time the job threw\". An attempt is consumed when the job throws, when it calls `$this->release()`, when middleware such as `WithoutOverlapping` or `RateLimited` releases it, when it times out — and when it runs to completion. And the default is **one**: a plain `queue:work` with no `--tries` attempts each job once and then fails it. That default catches out everyone who adds a releasing middleware and watches jobs vanish into `failed_jobs` on their first contention.\n\nLaravel 13 moves these knobs onto the class as attributes: `#[Tries(5)]`, `#[Backoff(3)]` or `#[Backoff([1, 5, 10])]` for exponential delays, `#[Timeout(120)]`, `#[FailOnTimeout]`, `#[MaxExceptions(3)]` to cap real errors while allowing many releases, and a `retryUntil()` method that takes precedence over `tries` entirely. The `--tries`, `--backoff` and `--timeout` CLI switches are worker-wide defaults that the class overrides. Timeouts need the PCNTL extension, are ignored with `--once`, and must sit below the connection's `retry_after` — and blocking IO such as a Guzzle call may not honour the alarm, so set the client's own timeout too.\n\nWhen the attempts run out the payload and exception land in the `failed_jobs` table, and `failed(?Throwable $e)` is called on a **freshly constructed instance**, so anything `handle()` assigned to a property is gone. If the last attempt threw, you get that exception; if the job simply ran out of attempts you get `MaxAttemptsExceededException`, and if it blew the timeout, `TimeoutExceededException`. From there it's `queue:failed`, `queue:retry <id|all>`, `queue:forget`, `queue:flush --hours=48` and a scheduled `queue:prune-failed`. Synchronously dispatched failures are never recorded there at all — they go straight to the application's exception handler.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel: Queues — Max Job Attempts and Timeout", url: "https://laravel.com/framework/docs/13.x/queues#max-job-attempts-and-timeout", kind: "docs" },
        { label: "Laravel: Queues — Dealing With Failed Jobs", url: "https://laravel.com/framework/docs/13.x/queues#dealing-with-failed-jobs", kind: "docs" },
        { label: "AWS Builders' Library: Timeouts, retries and backoff with jitter", url: "https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter", kind: "article" },
      ],
      video: {
        title: "Laravel Queues Lesson 2 — Failed jobs: listing, retrying and handling them",
        channel: "Mateus Guimarães",
        url: "https://www.youtube.com/watch?v=IR5BSaPg0mE",
        videoId: "IR5BSaPg0mE",
        durationLabel: "8:31",
      },
      alternateVideos: [
        {
          title: "Laravel Queues: 11 Must-Know Advanced Tips",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=PeDiswbjLq8",
          videoId: "PeDiswbjLq8",
          startSeconds: 689,
          chapterLabel: "5. Handle retries and backoff",
          durationLabel: "25:05",
        },
        {
          title: "Laravel Worldwide Meetup - Queues, Jobs, and Workers: Building Resilient Background Processing",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=EBsvfjNUUj8",
          videoId: "EBsvfjNUUj8",
          startSeconds: 2728,
          chapterLabel: "Common mistakes with failed jobs",
          durationLabel: "1:05:03",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-queue-retries-failures-q1",
          prompt: "A job class declares no attempt settings and the worker was started with a bare `php artisan queue:work`. The job throws. How many times does Laravel attempt it?",
          options: [
            "Once — then it goes to `failed_jobs`",
            "Three times, Laravel's default",
            "Indefinitely, until it succeeds",
            "Once per worker process currently running",
          ],
          correctIndex: 0,
          explanation:
            "Laravel attempts a job a single time unless you say otherwise, which surprises people who expect a framework default of 3. `--tries=0` is the opposite extreme: retry forever.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-retries-failures-q2",
          prompt: "The job class carries `#[Tries(3)]` and the worker runs with `--tries=10`. How many attempts does the job get?",
          options: ["3", "10", "13", "30"],
          correctIndex: 0,
          explanation:
            "A value on the job class takes precedence over the command line, because the CLI switch is a default for everything that worker processes and the class knows its own needs.",
        },
        {
          id: "lv-queue-retries-failures-q3",
          prompt: "A job declares both `#[Tries(5)]` and a `retryUntil()` method returning `now()->plus(minutes: 30)`. Which wins?",
          options: [
            "`retryUntil()` — the job may be attempted any number of times within the window",
            "`#[Tries(5)]` — attribute settings always win",
            "Whichever limit is reached first",
            "Neither; declaring both throws at dispatch time",
          ],
          correctIndex: 0,
          explanation:
            "Time-based attempts take precedence, which is what makes them a good pairing with `ThrottlesExceptions`: unlimited releases, bounded by a wall-clock deadline instead of a count.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-retries-failures-q4",
          prompt: "A job has `#[Tries(6)]` and `#[Backoff([1, 5, 10])]`, and fails every time. What are the delays before attempts 2 through 6?",
          options: [
            "1, 5, 10, 10, 10 seconds",
            "1, 5, 10, 15, 20 seconds",
            "1, 5, 10, then the job fails immediately",
            "1, 2, 4, 8, 16 seconds",
          ],
          correctIndex: 0,
          explanation:
            "An array of backoff values is consumed in order, and the last value repeats for every remaining attempt. That gives you a fast first retry for blips and a steady plateau for a sustained outage.",
        },
        {
          id: "lv-queue-retries-failures-q5",
          prompt: "The connection has `'retry_after' => 90` and the worker was started with `--timeout=120`. Which statement is correct?",
          options: [
            "A job running longer than 90 seconds can be processed a second time while the first copy is still running",
            "The job is killed at 90 seconds",
            "`--timeout` overrides `retry_after`, so nothing happens until 120 seconds",
            "The worker refuses to start with that combination",
          ],
          correctIndex: 0,
          explanation:
            "The two settings work together: the timeout must fire *before* the reservation expires, or the queue hands the job out again. Keep `--timeout` several seconds below `retry_after`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-retries-failures-q6",
          prompt: "What does adding `#[FailOnTimeout]` to a job change?",
          options: [
            "A timed-out job is marked failed immediately instead of consuming an attempt and being released for a retry",
            "The job's timeout is enforced even without the PCNTL extension",
            "The worker exits cleanly rather than with an error when a job times out",
            "The timeout applies to the whole chain rather than one job",
          ],
          correctIndex: 0,
          explanation:
            "By default a timeout burns an attempt and the job comes back if attempts remain. If a job that hung once will hang again, failing fast is cheaper than three more twelve-minute stalls.",
        },
        {
          id: "lv-queue-retries-failures-q7",
          prompt: "Which of these consume one of a job's attempts? (Select all that apply.)",
          options: [
            "The job throws an unhandled exception",
            "The job calls `$this->release(10)`",
            "`RateLimited` middleware releases the job because the limit was hit",
            "The job is dispatched with `->delay(60)`",
            "The job is pushed as part of a `Bus::bulk()` call",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything that puts the job back on the queue spends an attempt, deliberate releases included. Delaying or bulk-pushing a job is just how it got there and costs nothing.",
        },
        {
          id: "lv-queue-retries-failures-q8",
          prompt: "`handle()` sets `$this->rowsImported = 4200` and then throws on the final attempt. What does `failed()` see in `$this->rowsImported`?",
          options: [
            "Whatever the constructor set — a new instance is built to call `failed()`",
            "4200, because the same object handles both methods",
            "`null`, because properties are cleared before `failed()` runs",
            "4200, but only when the job uses `InteractsWithQueue`",
          ],
          correctIndex: 0,
          explanation:
            "The failure handler is invoked on a freshly deserialised instance, so in-flight state is gone. Persist progress somewhere durable if `failed()` needs it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-retries-failures-q9",
          prompt: "A job with `#[Tries(3)]` is released back to the queue three times by middleware and never throws. What `Throwable` does `failed()` receive?",
          options: [
            "`MaxAttemptsExceededException`",
            "`null`",
            "`TimeoutExceededException`",
            "The exception from the first attempt",
          ],
          correctIndex: 0,
          explanation:
            "When exhaustion rather than a throw ends the job, Laravel synthesises `MaxAttemptsExceededException` — and `TimeoutExceededException` when the cause was the timeout. Both are worth matching on in `failed()`.",
        },
        {
          id: "lv-queue-retries-failures-q10",
          prompt: "A job dispatched with `dispatchSync()` throws. Where does it end up?",
          options: [
            "Nowhere in `failed_jobs` — the exception goes straight to the application's exception handler",
            "In `failed_jobs`, with `sync` as the connection",
            "Back on the default queue for a retry",
            "In the log only, with no exception propagated",
          ],
          correctIndex: 0,
          explanation:
            "Synchronous dispatches are ordinary in-process calls, so their failures behave like any other request-time exception. This is also why `sync` locally hides failure-handling bugs.",
        },
        {
          id: "lv-queue-retries-failures-q11",
          prompt: "Which Artisan command re-queues every record currently in `failed_jobs`?",
          options: [
            "`php artisan queue:retry all`",
            "`php artisan queue:flush`",
            "`php artisan queue:restart`",
            "`php artisan queue:prune-failed --hours=0`",
          ],
          correctIndex: 0,
          explanation:
            "`queue:flush` and `queue:prune-failed` *delete* failed records, and `queue:restart` signals workers. Only `queue:retry` puts the payload back on its queue (and `--queue=name` narrows it).",
        },
        {
          id: "lv-queue-retries-failures-q12",
          prompt: "In Laravel 13, what does `$exceptions->dontRetry([InvalidPodcastSourceException::class])` in `bootstrap/app.php` do?",
          options: [
            "A job that throws that exception is marked failed immediately instead of being retried",
            "That exception is never reported to the logger",
            "Jobs throwing it are silently deleted from the queue",
            "The worker exits when that exception is thrown",
          ],
          correctIndex: 0,
          explanation:
            "Some exceptions mean \"this will never work\" — a bad URL, a revoked permission — and retrying them is just three more log lines. `dontRetryWhen()` takes a closure when the rule needs to inspect the exception.",
        },
      ],
    },
    {
      id: "lv-queue-job-middleware",
      moduleId: "laravel-queues-events",
      trackId: "php",
      title: "Job Middleware, Rate Limits and Uniqueness",
      summary:
        "Job middleware is route middleware for the worker: a `middleware()` method returns objects whose `handle(object $job, Closure $next)` wraps execution, so the concern lives in one class instead of being copy-pasted into every `handle()`. `php artisan make:job-middleware` scaffolds one. The framework ships the ones you'd otherwise write badly: `RateLimited` (backed by a named `RateLimiter::for()` limiter, with a Redis-tuned variant), `WithoutOverlapping` (an atomic lock on an arbitrary key, with `releaseAfter`, `dontRelease`, `expireAfter` and `shared()`), `ThrottlesExceptions` for flaky third parties, `Skip::when()`/`Release::when()`, `FailOnException`, and `SkipIfBatchCancelled`.\n\nThose all act at *execution* time. Their dispatch-time counterparts are `ShouldBeUnique` — refuse a new dispatch while a lock keyed by `uniqueId()` is held, with `#[UniqueFor(3600)]` bounding how long the lock can survive a crash — and, new in Laravel 13, `#[DebounceFor(30, maxWait: 120)]`, which keeps only the *latest* of a burst of dispatches and removes the superseded jobs. `ShouldBeUniqueUntilProcessing` releases the lock as processing begins, which deduplicates the queue without preventing concurrency. All of them need a cache driver that supports atomic locks, and every server must talk to the *same* cache — a per-container file cache silently makes \"unique\" mean \"unique per container\".\n\nThe gotcha that bites first: releasing costs an attempt. With the default of one attempt, a job released by `WithoutOverlapping` has already used it up and goes straight to `failed_jobs` instead of retrying later. Any releasing middleware needs `#[Tries]` or `retryUntil()` raised to match. And unique constraints are simply not applied to jobs inside a batch.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel: Queues — Job Middleware", url: "https://laravel.com/framework/docs/13.x/queues#job-middleware", kind: "docs" },
        { label: "Laravel: Queues — Unique Jobs", url: "https://laravel.com/framework/docs/13.x/queues#unique-jobs", kind: "docs" },
        { label: "Laravel: Cache — Atomic Locks", url: "https://laravel.com/framework/docs/13.x/cache#atomic-locks", kind: "docs" },
      ],
      video: {
        title: "Laravel's atomic locks",
        channel: "Aaron Francis",
        url: "https://www.youtube.com/watch?v=jGb5zIgwL4c",
        videoId: "jGb5zIgwL4c",
        durationLabel: "14:12",
      },
      alternateVideos: [
        {
          title: "New Job Middleware Artisan Command,  Stop Process Pools & More Enum Support",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=hcleT7NQyjY",
          videoId: "hcleT7NQyjY",
          startSeconds: 37,
          chapterLabel: "Make Job Middleware",
          durationLabel: "5:07",
        },
        {
          title: "Laravel Queues: 11 Must-Know Advanced Tips",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=PeDiswbjLq8",
          videoId: "PeDiswbjLq8",
          startSeconds: 919,
          chapterLabel: "7. ShouldBeUnique and uniqueId()",
          durationLabel: "25:05",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-queue-job-middleware-q1",
          prompt: "What signature does a job middleware class implement?",
          options: [
            "`handle(object $job, Closure $next)`",
            "`handle(Request $request, Closure $next)`",
            "`__invoke(Job $job): bool`",
            "`before(object $job)` and `after(object $job)`",
          ],
          correctIndex: 0,
          explanation:
            "It mirrors HTTP middleware, receiving the job instead of a request. Not calling `$next($job)` is how `Skip`, `RateLimited` and `WithoutOverlapping` prevent the job running.",
        },
        {
          id: "lv-queue-job-middleware-q2",
          prompt: "A job returns `[new WithoutOverlapping($this->user->id)]` from `middleware()` and declares no `#[Tries]`. Two copies are queued for the same user. What happens to the second one?",
          options: [
            "It is released, immediately exceeds its single allowed attempt, and is marked failed",
            "It waits in the queue until the lock is free and then runs",
            "It is deleted silently",
            "It runs concurrently — the middleware only logs a warning",
          ],
          correctIndex: 0,
          explanation:
            "Releasing consumes an attempt, and the default is one. Any job with releasing middleware needs its attempts raised, or `retryUntil()` to bound retrying by time instead of count.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-job-middleware-q3",
          prompt: "`ProviderIsUp` and `ProviderIsDown` both use `new WithoutOverlapping(\"status:{$this->provider}\")`. Without any extra call, can they run at the same time?",
          options: [
            "Yes — by default the lock only prevents overlap between jobs of the same class",
            "No — the key is the same, so they block each other",
            "No — Laravel namespaces the lock by queue, and both are on `default`",
            "Only if they are on different connections",
          ],
          correctIndex: 0,
          explanation:
            "The lock key is internally scoped by job class. `->shared()` is what makes the key mean the same thing across classes, which is exactly what a pair like this wants.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-job-middleware-q4",
          prompt: "Why would you add `->expireAfter(180)` to a `WithoutOverlapping` middleware?",
          options: [
            "So a worker that dies mid-job can't leave the lock held forever, blocking every later job on that key",
            "So the job is retried after three minutes",
            "So the lock is only checked every three minutes, reducing cache traffic",
            "So the job is deleted if it runs longer than three minutes",
          ],
          correctIndex: 0,
          explanation:
            "Locks are released when the job finishes — and a SIGKILLed worker never finishes. An expiry is the safety valve; set it above your realistic worst-case runtime.",
        },
        {
          id: "lv-queue-job-middleware-q5",
          prompt: "Which of these actually prevent two copies of the same work from *executing* at the same time? (Select all that apply.)",
          options: [
            "The `WithoutOverlapping` middleware",
            "`ShouldBeUnique` with a `uniqueId()`",
            "`ShouldBeUniqueUntilProcessing`",
            "`#[Tries(1)]` on the job class",
            "`RateLimited('backups')` middleware",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`ShouldBeUniqueUntilProcessing` releases its lock the moment processing starts, so a second copy can be dispatched and run alongside the first — that's the whole point of the variant. Tries and rate limits control retries and throughput, not concurrency.",
        },
        {
          id: "lv-queue-job-middleware-q6",
          prompt: "When is the lock released for a job implementing `ShouldBeUnique` (not the `UntilProcessing` variant)?",
          options: [
            "When the job finishes processing or exhausts all of its retry attempts",
            "As soon as a worker reserves the job",
            "Immediately after the dispatch returns",
            "Only when `#[UniqueFor]` expires",
          ],
          correctIndex: 0,
          explanation:
            "Holding the lock through processing means no duplicate can be queued while the work is under way. `#[UniqueFor]` is the backstop that frees the key if the job dies without releasing it.",
        },
        {
          id: "lv-queue-job-middleware-q7",
          prompt: "A batch is dispatched containing twenty copies of a job that implements `ShouldBeUnique`. How many of them run?",
          options: [
            "All twenty — unique constraints are not applied to jobs inside batches",
            "One — uniqueness is enforced before the batch is created",
            "One per queue the batch spans",
            "None — dispatching a unique job in a batch throws",
          ],
          correctIndex: 0,
          explanation:
            "The documentation states it outright, and it is easy to trip over when you move an existing job into a batch for throughput. If you need deduplication inside a batch, do it in the job's own logic.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-job-middleware-q8",
          prompt: "What is the difference between `Skip::when($condition)` and `Release::when($condition, releaseAfter: 60)` in `middleware()`?",
          options: [
            "`Skip` deletes the job; `Release` puts it back on the queue after 60 seconds and consumes an attempt",
            "`Skip` pauses the queue; `Release` pauses only this job",
            "`Skip` marks the job failed; `Release` marks it complete",
            "They are the same, but `Release` also logs",
          ],
          correctIndex: 0,
          explanation:
            "\"Not now\" and \"not ever\" are different answers. Reaching for `Release` when you meant `Skip` slowly burns attempts and eventually fills `failed_jobs` with work that should simply have been dropped.",
        },
        {
          id: "lv-queue-job-middleware-q9",
          prompt: "`return [new ThrottlesExceptions(10, 5 * 60)];` — what does that do?",
          options: [
            "After ten exceptions, further attempts at the job are delayed for five minutes",
            "The job is retried at most ten times with a five-minute gap between each",
            "The job fails after ten exceptions within any five-minute window",
            "Exceptions are reported at most ten times every five minutes",
          ],
          correctIndex: 0,
          explanation:
            "It's a circuit breaker for an unstable dependency: stop hammering it, back off, come back later. Pair it with `retryUntil()` so the job eventually gives up, and use `by()` to share one bucket across jobs hitting the same API.",
        },
        {
          id: "lv-queue-job-middleware-q10",
          prompt: "A job carries `#[DebounceFor(30, maxWait: 120)]` and a `debounceId()`. The same id is dispatched every 5 seconds for ten minutes. What happens?",
          options: [
            "Only the latest dispatch runs for each debounce window, and `maxWait` caps how long execution can be deferred",
            "Every dispatch runs, but no more than one every 30 seconds",
            "The first dispatch runs and the rest are ignored for 30 seconds",
            "Nothing runs until the dispatches stop for 30 seconds, with no upper bound",
          ],
          correctIndex: 0,
          explanation:
            "Debouncing collapses a burst down to its most recent member and removes the superseded jobs, dispatching a `JobDebounced` event as it does. `maxWait` exists precisely so a continuous stream of dispatches can't defer the work forever.",
        },
        {
          id: "lv-queue-job-middleware-q11",
          prompt: "A job class uses both `#[DebounceFor(30)]` and `implements ShouldBeUnique`. What does the documentation say about that?",
          options: [
            "They are mutually exclusive and should not be combined",
            "Debouncing wins and the unique lock is ignored",
            "The unique lock wins and debouncing is ignored",
            "They compose, giving at most one job per debounce window",
          ],
          correctIndex: 0,
          explanation:
            "Both are dispatch-time deduplication mechanisms built on cache locks, with different semantics for what happens to the earlier dispatch — keeping it versus replacing it. Pick one.",
        },
        {
          id: "lv-queue-job-middleware-q12",
          prompt: "An app runs on four containers, each with `CACHE_STORE=file`. Jobs implement `ShouldBeUnique`. What is the real behaviour?",
          options: [
            "Uniqueness is enforced per container, so up to four identical jobs can be queued",
            "Uniqueness works correctly because the lock key is derived from the payload",
            "Dispatching fails because the file driver has no lock support",
            "Only the container that holds the lock can dispatch the job at all",
          ],
          correctIndex: 0,
          explanation:
            "The `file` driver does support atomic locks, so nothing errors — it just locks against a filesystem nobody else can see. Unique jobs, debounced jobs, `WithoutOverlapping` and `onOneServer()` all need one shared central cache.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "lv-queue-routing",
      moduleId: "laravel-queues-events",
      trackId: "php",
      title: "Queue Routing with Queue::route",
      summary:
        "Before Laravel 13, the answer to \"which queue does this job go on?\" was scattered across three places: the connection's default `queue` value, an `onQueue()` call in the job's constructor, and an `onQueue()` at every call site. Auditing it meant grepping. Laravel 13 adds `Queue::route()`, a central map you declare once in a service provider's `boot()`:\n\n```php\nQueue::route(ProcessPodcast::class, connection: 'redis', queue: 'podcasts');\nQueue::route(RequiresVideo::class, queue: 'video');\nQueue::route(ShouldBroadcast::class, queue: 'events');\n```\n\nThe first argument does not have to be a concrete class. Pass an interface, a trait or a parent class and every job that implements, uses or extends it is routed — which is how you say \"all broadcast work goes to `events`\" in one line instead of decorating dozens of classes. An array form routes several at once, a connection without a queue falls back to that connection's default queue, and a job that sets its own connection or queue still overrides the route. `Queue::forward('reports', 'reports.fifo', 'sqs')` is the migration tool of the pair: it re-points an existing queue name at different infrastructure without touching a single dispatch site.\n\nRouting only pays off if it's matched by workers. The classic failure is routing a category of jobs to `podcasts` while every Supervisor program still runs `queue:work` with no `--queue`, so the jobs pile up untouched and nobody notices until the table is enormous. Routing decides where work is *written*; `--queue=high,default` decides what gets *read*, and in which order. Both halves have to agree.",
      level: "advanced",
      estMinutes: 35,
      webRefs: [
        { label: "Laravel: Queues — Queue Routing", url: "https://laravel.com/framework/docs/13.x/queues#queue-routing", kind: "docs" },
        { label: "Laravel: Queues — Queue Priorities", url: "https://laravel.com/framework/docs/13.x/queues#queue-priorities", kind: "docs" },
        { label: "Laravel: Release Notes (13.x)", url: "https://laravel.com/framework/docs/13.x/releases", kind: "docs" },
      ],
      video: {
        title: "Laravel 13 New Features Explained 2026 🔥 | AI SDK, Queue Routing, JSON API  #laravel13 #laravel",
        channel: "Code Step By Step",
        url: "https://www.youtube.com/watch?v=LpQHxxpmdP0",
        videoId: "LpQHxxpmdP0",
        startSeconds: 720,
        chapterLabel: "Queue Routing Simplified",
        durationLabel: "10:20",
      },
      alternateVideos: [
        {
          title: "Laravel Queues: 11 Must-Know Advanced Tips",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=PeDiswbjLq8",
          videoId: "PeDiswbjLq8",
          startSeconds: 301,
          chapterLabel: "2. Every job should declare its queue",
          durationLabel: "25:05",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-queue-routing-q1",
          prompt: "Where does the documentation say `Queue::route(...)` calls should typically live?",
          options: [
            "In the `boot()` method of a service provider",
            "In `config/queue.php`",
            "In `routes/console.php`, alongside scheduled tasks",
            "In each job class's constructor",
          ],
          correctIndex: 0,
          explanation:
            "It's runtime configuration of the queue manager, so it belongs where other boot-time wiring goes. Keeping it in one provider is what makes the mapping auditable.",
        },
        {
          id: "lv-queue-routing-q2",
          prompt: "`Queue::route(ProcessPodcast::class, connection: 'redis');` — with no `queue` argument, where do those jobs land?",
          options: [
            "On the `redis` connection's configured default queue",
            "On a queue named `ProcessPodcast`",
            "On the `default` queue of the application's default connection",
            "Nowhere — the queue argument is required",
          ],
          correctIndex: 0,
          explanation:
            "Specifying a connection alone just moves the job to another backend and keeps that backend's default pile. You can add the queue later without touching dispatch sites.",
        },
        {
          id: "lv-queue-routing-q3",
          prompt: "A route sends `ProcessPodcast` to the `podcasts` queue, and one controller dispatches it with `->onQueue('urgent')`. Which wins?",
          options: [
            "`urgent` — queue routing can still be overridden by the job on a per-job basis",
            "`podcasts` — central routing takes precedence over call sites",
            "Both, as two separate jobs",
            "Neither; the conflict throws at dispatch time",
          ],
          correctIndex: 0,
          explanation:
            "Routing is a default, not a policy. That flexibility is useful, and it also means a stray `onQueue()` can quietly defeat your routing map — so grep for them when routing doesn't seem to apply.",
        },
        {
          id: "lv-queue-routing-q4",
          prompt: "Jobs are routed to the `podcasts` queue, and the only worker in production is `php artisan queue:work redis`. What happens?",
          options: [
            "The jobs accumulate on `podcasts` and are never processed, because that worker only consumes the connection's default queue",
            "The worker automatically discovers and drains every queue on the connection",
            "The jobs fall back to `default` because no worker is listening",
            "Dispatch fails because the queue does not exist yet",
          ],
          correctIndex: 0,
          explanation:
            "A worker with no `--queue` consumes only the default queue. Every routing change needs a matching worker change — and a queue-depth alert, so an unconsumed queue announces itself.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-routing-q5",
          prompt: "Which of these can be passed as the first argument to `Queue::route()`? (Select all that apply.)",
          options: [
            "A concrete job class name",
            "An interface that jobs implement, such as `ShouldBroadcast`",
            "A trait that jobs use",
            "A queue name, to alias it to another queue",
            "A closure that inspects the job and returns a queue name",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Classes, interfaces, traits and parent classes are all accepted, so you can route whole categories. Aliasing one queue name to another is `Queue::forward()`, and there is no closure form.",
        },
        {
          id: "lv-queue-routing-q6",
          prompt: "What does `Queue::forward('reports', 'reports.fifo', 'sqs')` do?",
          options: [
            "Sends anything dispatched to the `reports` queue to `reports.fifo` on the `sqs` connection instead",
            "Copies jobs from `reports` to `reports.fifo` as they are processed",
            "Moves the jobs currently sitting on `reports` to `reports.fifo`",
            "Makes workers consuming `reports` also consume `reports.fifo`",
          ],
          correctIndex: 0,
          explanation:
            "It is a redirect applied at push time, which is what makes it the tool for migrating infrastructure without editing dispatch sites. An explicit connection set on a job still beats a forwarded one.",
        },
        {
          id: "lv-queue-routing-q7",
          prompt: "`php artisan queue:work --queue=high,default` is running when 10,000 `high` jobs arrive. What happens to `default`?",
          options: [
            "It is starved until `high` is drained, because the list is a strict priority order re-checked every iteration",
            "The worker alternates fairly between them",
            "`default` jobs are moved to `high` automatically",
            "The worker splits into two processes, one per queue",
          ],
          correctIndex: 0,
          explanation:
            "Priority is not fairness. If `default` must keep moving, run a second worker dedicated to it rather than relying on one worker's priority list.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-routing-q8",
          prompt: "Why bother with multiple named queues at all instead of putting everything on `default`?",
          options: [
            "A worker processes one job at a time, so separate queues are how you buy isolation and priority between kinds of work",
            "Each queue gets its own database connection, spreading load",
            "Laravel processes different queues in parallel within one worker",
            "Queue names are required for `failed_jobs` to record the job",
          ],
          correctIndex: 0,
          explanation:
            "Everything on one queue means a slow job blocks every fast one behind it. Queue names are the unit you attach worker counts, priorities and Horizon supervisors to.",
        },
        {
          id: "lv-queue-routing-q9",
          prompt: "`Queue::route(ShouldBroadcast::class, queue: 'events');` — which work does that affect?",
          options: [
            "Every queued job, listener or event in the application that implements the `ShouldBroadcast` contract",
            "Only jobs literally named `ShouldBroadcast`",
            "Only broadcast events dispatched from `routes/channels.php`",
            "Nothing — interfaces are ignored unless registered in `config/queue.php`",
          ],
          correctIndex: 0,
          explanation:
            "Routing by contract is the feature's best trick: one line moves an entire category of work onto its own queue, and new classes that implement the interface are covered automatically.",
        },
      ],
    },
    {
      id: "lv-queue-batches-chains",
      moduleId: "laravel-queues-events",
      trackId: "php",
      title: "Batches and Chains",
      summary:
        "A chain is a sequence: `Bus::chain([new ProcessPodcast, new OptimizePodcast, new ReleasePodcast])->dispatch()` runs each job only after the previous one succeeded, and a failure stops the rest. `catch()` receives the `Throwable`, and a running job can call `prependToChain()` or `appendToChain()` to extend the sequence. Note that `$this->delete()` inside a chained job does *not* stop the chain — only a failure does.\n\nA batch is a fan-out with a finish line. `Bus::batch([...])` needs the `job_batches` table (`make:queue-batches-table`) and gives you `before`, `progress`, `then`, `catch` and `finally` callbacks, a `name()` for Horizon and Telescope, `$batch->progress()` as a percentage, `cancel()`/`cancelled()`, and JSON serialisation so `return Bus::findBatch($id)` from a route is a working progress endpoint. Chains and batches nest in both directions: an array inside `Bus::batch()` is a chain, and `Bus::batch()` inside `Bus::chain()` is a parallel stage.\n\nThe semantics worth memorising: `catch` fires once, for the first job that fails. A failure cancels the whole batch unless you call `allowFailures()`. Cancelling does not kill jobs already running or reserved — every batched job is expected to check `$this->batch()->cancelled()` early, or to use the `SkipIfBatchCancelled` middleware, or a cancelled 10,000-job import quietly keeps importing. All batched jobs must share one connection and queue; callbacks are serialised and executed later, so `$this` is unavailable inside them; jobs can only be added to a batch from inside a job that already belongs to it; and the `job_batches` table grows forever unless `queue:prune-batches` is scheduled, including its `--unfinished` and `--cancelled` options.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel: Queues — Job Batching", url: "https://laravel.com/framework/docs/13.x/queues#job-batching", kind: "docs" },
        { label: "Laravel: Queues — Job Chaining", url: "https://laravel.com/framework/docs/13.x/queues#job-chaining", kind: "docs" },
        { label: "Laravel API: Illuminate\\Bus\\Batch", url: "https://api.laravel.com/docs/13.x/Illuminate/Bus/Batch.html", kind: "docs" },
      ],
      video: {
        title: "Laravel Job Batch: Show Queue Progress",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=HErI5i-a0NI",
        videoId: "HErI5i-a0NI",
        durationLabel: "5:50",
      },
      alternateVideos: [
        {
          title: "Dispatch after commit, run job batches inside chains & more",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=mXmPTzoXTF8",
          videoId: "mXmPTzoXTF8",
          startSeconds: 34,
          chapterLabel: "Job batches inside a chain",
          durationLabel: "7:22",
        },
        {
          title: "Laravel Queues: 11 Must-Know Advanced Tips",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=PeDiswbjLq8",
          videoId: "PeDiswbjLq8",
          startSeconds: 1130,
          chapterLabel: "9. A batchable job must honour cancellation",
          durationLabel: "25:05",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-queue-batches-chains-q1",
          prompt: "A chain of four jobs is dispatched and the second one exhausts its attempts and fails. What happens to jobs three and four?",
          options: [
            "They never run, and the chain's `catch()` callback receives the `Throwable`",
            "They run anyway, since each is an independent queued job",
            "They are moved to `failed_jobs` alongside job two",
            "They are retried from the start of the chain",
          ],
          correctIndex: 0,
          explanation:
            "A chain is \"and then, if that worked\". Failure stops the sequence, which is exactly why you use a chain instead of three independent dispatches.",
        },
        {
          id: "lv-queue-batches-chains-q2",
          prompt: "A job in the middle of a chain calls `$this->delete()` inside `handle()`. What happens to the rest of the chain?",
          options: [
            "It continues — only a failure stops a chain",
            "It stops, the same as a failure",
            "It stops and the `catch()` callback fires",
            "The remaining jobs are re-dispatched as an independent batch",
          ],
          correctIndex: 0,
          explanation:
            "Deleting removes this job from the queue without marking it failed, so the chain treats it as done. If you need to abort the sequence, fail the job or don't chain it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-batches-chains-q3",
          prompt: "A batch of five `ImportCsv` jobs is dispatched and three workers are running. In what order do the jobs complete?",
          options: [
            "In no guaranteed order — batched jobs run in parallel across workers",
            "In the order they were listed in the batch array",
            "In reverse order, because the queue is a stack",
            "In the order they were listed, unless `allowFailures()` is used",
          ],
          correctIndex: 0,
          explanation:
            "Parallelism is the reason to batch. If you need order inside a batch, nest a chain — an array of jobs inside `Bus::batch()` is treated as a chain.",
        },
        {
          id: "lv-queue-batches-chains-q4",
          prompt: "Ten jobs in a batch fail. How many times is the batch's `catch()` callback invoked?",
          options: [
            "Once, for the first job that failed",
            "Ten times, once per failure",
            "Once, after every job in the batch has finished",
            "Never — `catch()` only fires if the whole batch is cancelled",
          ],
          correctIndex: 0,
          explanation:
            "`catch` is a \"something went wrong\" signal, not a per-failure hook. Use `allowFailures(function (Batch $batch, $e) { … })` if you genuinely need to handle every individual failure.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-batches-chains-q5",
          prompt: "What does calling `->allowFailures()` when dispatching a batch change?",
          options: [
            "A failing job no longer marks the batch as cancelled, so the remaining jobs still run",
            "Failed jobs are excluded from `failed_jobs`",
            "The `then` callback runs even though jobs failed",
            "Failed jobs are retried indefinitely",
          ],
          correctIndex: 0,
          explanation:
            "By default the first failure cancels the batch. `allowFailures()` is for fan-outs where partial success is meaningful — importing 10,000 rows where a handful are malformed.",
        },
        {
          id: "lv-queue-batches-chains-q6",
          prompt: "Which of these are true of batch callbacks? (Select all that apply.)",
          options: [
            "They are serialised and executed later by the queue, so `$this` must not be used inside them",
            "Each one receives an `Illuminate\\Bus\\Batch` instance",
            "`progress` is invoked each time a single job completes successfully",
            "`then` runs even when one of the jobs failed",
            "`before` runs after all of the batch's jobs have been added",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`then` means \"all jobs completed successfully\"; `finally` is the one that always runs. `before` fires when the batch has been created but no jobs have been added yet, which is what makes it useful for recording the batch id.",
        },
        {
          id: "lv-queue-batches-chains-q7",
          prompt: "What constraint does Laravel place on the connection and queue of jobs within a single batch?",
          options: [
            "All batched jobs must execute on the same connection and queue",
            "Each job may use any connection, but they must share a queue name",
            "Each job may use any queue, but they must share a connection",
            "There is no constraint",
          ],
          correctIndex: 0,
          explanation:
            "`onConnection()` and `onQueue()` are set on the batch, not per job. Mixed backends would make progress tracking and cancellation unreliable.",
        },
        {
          id: "lv-queue-batches-chains-q8",
          prompt: "A 10,000-job import batch is cancelled by an operator. The jobs do not check anything at the top of `handle()`. What happens?",
          options: [
            "Every job already queued still runs to completion, doing work that was meant to be abandoned",
            "The queue driver deletes the remaining jobs immediately",
            "The remaining jobs fail with a `BatchCancelledException`",
            "The remaining jobs are released back and retried until the batch is un-cancelled",
          ],
          correctIndex: 0,
          explanation:
            "Cancelling flips a flag in `job_batches`; it does not reach into the queue and delete messages. A batched job must check `$this->batch()->cancelled()` early, or carry the `SkipIfBatchCancelled` middleware.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-batches-chains-q9",
          prompt: "Which scheduled command keeps the `job_batches` table from growing without bound?",
          options: [
            "`queue:prune-batches`, optionally with `--unfinished` and `--cancelled`",
            "`queue:flush`",
            "`queue:clear`",
            "`queue:retry-batch`",
          ],
          correctIndex: 0,
          explanation:
            "By default it prunes finished batches older than 24 hours; `--unfinished` and `--cancelled` are needed to clean up batches that never completed. `queue:flush` empties `failed_jobs`, and `queue:clear` deletes pending jobs.",
        },
        {
          id: "lv-queue-batches-chains-q10",
          prompt: "What makes `Route::get('/batch/{id}', fn ($id) => Bus::findBatch($id))` a working progress endpoint?",
          options: [
            "`Batch` instances are JSON serialisable, including `totalJobs`, `pendingJobs`, `failedJobs` and progress",
            "Laravel registers a broadcast channel for every batch automatically",
            "`findBatch()` blocks until the batch finishes and returns the result",
            "Batches are stored in the cache, so the response is always fresh",
          ],
          correctIndex: 0,
          explanation:
            "The counts are tracked in `job_batches` as jobs complete, so a poll of that route is enough for a progress bar. Naming the batch also makes it identifiable in Horizon and Telescope.",
        },
        {
          id: "lv-queue-batches-chains-q11",
          prompt: "Where can you call `$batch->add($moreJobs)` from?",
          options: [
            "Only from inside a job that already belongs to that batch",
            "From anywhere, given the batch id",
            "Only from the batch's `before` callback",
            "Only before the batch has been dispatched",
          ],
          correctIndex: 0,
          explanation:
            "That restriction is what makes the \"loader job\" pattern work: dispatch a few jobs that hydrate the batch with thousands more, instead of building the whole list during a web request.",
        },
      ],
    },
    {
      id: "lv-queue-workers-production",
      moduleId: "laravel-queues-events",
      trackId: "php",
      title: "Running Workers in Production",
      summary:
        "A worker is a long-lived PHP process that boots the framework once and then loops. That single boot is why it is fast, and it is also the source of every operational surprise: the process holds the code it started with, so a deploy changes nothing until the worker restarts; static properties and container singletons survive between jobs, so state leaks where FPM would have cleaned up; and a small per-job leak compounds over thousands of jobs. `queue:listen` reboots per job and avoids all of it at a large performance cost — useful locally, not in production. Instead you run `queue:work` and recycle the process deliberately with `--max-jobs`, `--max-time` and Supervisor's `numprocs`.\n\nDeploying is the part worth getting exactly right. `php artisan queue:restart` does not kill anything: it writes a timestamp to the **cache**, and every worker compares it between jobs and exits cleanly after finishing whatever it is holding. So the cache driver must be configured and shared across every machine running workers, a worker mid-job won't notice until that job returns, and a Redis worker blocked with `block_for => 0` won't notice until a job arrives at all. Supervisor with `autorestart=true` is what brings the process back on the new code, and `stopwaitsecs` must exceed your longest job or `supervisorctl stop` will SIGKILL a worker in the middle of one. Across the deploy window old payloads meet new code, so job classes have to stay backward compatible for at least one release.\n\nSignals: SIGTERM, SIGQUIT and SIGINT all mean \"finish this job and stop\". A long import can react by implementing `Interruptible` and defining `interrupted(int $signal)` to checkpoint its progress — it is called only while a job is actually running and is not a substitute for timeouts or `failed()`. `queue:pause` and `queue:continue` stop consumption without stopping the process, maintenance mode halts processing unless `--force`, and `Queue::withoutInterruptionPolling()` removes the per-iteration cache check at the price of workers no longer answering restart or pause commands.",
      level: "expert",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Laravel: Queues — Queue Workers and Deployment", url: "https://laravel.com/framework/docs/13.x/queues#queue-workers-and-deployment", kind: "docs" },
        { label: "Laravel: Queues — Configuring Supervisor", url: "https://laravel.com/framework/docs/13.x/queues#configuring-supervisor", kind: "docs" },
        { label: "Supervisor: Configuration File", url: "https://supervisord.org/configuration.html", kind: "docs" },
        { label: "Laravel: Deployment", url: "https://laravel.com/framework/docs/13.x/deployment", kind: "docs" },
      ],
      video: {
        title: "Queues in Laravel: Main Things You Need to Know (Two Examples)",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=D5tr7r2_i7E",
        videoId: "D5tr7r2_i7E",
        startSeconds: 516,
        chapterLabel: "Production queue setup",
        durationLabel: "12:18",
      },
      alternateVideos: [
        {
          title: "How to Set up Laravel Queues on Production",
          channel: "CodingX",
          url: "https://www.youtube.com/watch?v=iH4Skwaw-KU",
          videoId: "iH4Skwaw-KU",
          durationLabel: "11:56",
        },
        {
          title: "Laravel Queues: 11 Must-Know Advanced Tips",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=PeDiswbjLq8",
          videoId: "PeDiswbjLq8",
          startSeconds: 1331,
          chapterLabel: "11. Keep jobs backwards compatible across deploys",
          durationLabel: "25:05",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-queue-workers-production-q1",
          prompt: "A deploy ships a bug fix inside a job's `handle()` method, and the deploy script does not restart workers. What runs?",
          options: [
            "The old code — the worker holds the classes it booted with until the process restarts",
            "The new code, because PHP re-reads files on every job",
            "The new code, because OPcache invalidates on file change",
            "Neither; the worker fails with a checksum error",
          ],
          correctIndex: 0,
          explanation:
            "Long-lived processes are the whole trade. Nothing about OPcache or the filesystem helps, because the classes were already loaded into memory when the worker started.",
        },
        {
          id: "lv-queue-workers-production-q2",
          prompt: "How does `php artisan queue:restart` actually reach the running workers?",
          options: [
            "It writes a timestamp to the cache, and workers compare it between jobs and exit when it changes",
            "It sends SIGHUP to every `queue:work` process it can find",
            "It writes a file to `storage/framework/` that workers watch with inotify",
            "It asks Supervisor to restart the program group",
          ],
          correctIndex: 0,
          explanation:
            "That is why the docs insist a cache driver is properly configured, and why every machine running workers must share it. It's also why a worker that never reaches the top of its loop never hears the signal.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-workers-production-q3",
          prompt: "A worker is eight minutes into a twenty-minute job when `queue:restart` runs during a deploy. What happens?",
          options: [
            "It finishes the job on the old code, then exits, and Supervisor starts a fresh worker on the new code",
            "It aborts the job immediately and releases it back to the queue",
            "It finishes the job and then reloads the new code without exiting",
            "It is killed and the job is marked as failed",
          ],
          correctIndex: 0,
          explanation:
            "Graceful means graceful: the in-flight job completes. The consequence is that your job classes must stay compatible with both the old and the new code for the length of that window.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-workers-production-q4",
          prompt: "A Supervisor program has `stopwaitsecs=10` and the application's longest job takes about ten minutes. What is the risk when the program is stopped?",
          options: [
            "Supervisor SIGKILLs the worker mid-job, so the work is lost until the reservation expires and another worker retries it",
            "Supervisor refuses to stop the program",
            "The job is written to `failed_jobs` with a clean exception",
            "Nothing — `stopwaitsecs` only applies to the master process",
          ],
          correctIndex: 0,
          explanation:
            "Supervisor waits `stopwaitsecs` for a graceful exit and then kills. The docs are explicit: make it larger than your longest-running job, or your deploys routinely cut jobs in half.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-workers-production-q5",
          prompt: "Why do production Supervisor commands so often include `--max-time=3600` or `--max-jobs=1000`?",
          options: [
            "To recycle worker processes periodically, bounding memory that has accumulated over many jobs",
            "To limit how long a single job may run",
            "To stop the worker once the queue is empty",
            "To cap how many jobs may be queued per hour",
          ],
          correctIndex: 0,
          explanation:
            "Restarting a healthy process on a schedule is far cheaper than hunting a slow leak. `autorestart=true` is what makes it invisible — the worker exits, Supervisor starts a new one.",
        },
        {
          id: "lv-queue-workers-production-q6",
          prompt: "Which of these cause a `queue:work` process to exit? (Select all that apply.)",
          options: [
            "Reaching the `--max-jobs` limit",
            "Reaching the `--max-time` limit",
            "A `queue:restart` issued after it started",
            "A job throwing an unhandled exception",
            "A `queue:pause` for the queue it is consuming",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A thrown exception is ordinary business — the job is released or failed and the worker carries on. Pausing stops the worker picking up new jobs but deliberately leaves the process alive.",
        },
        {
          id: "lv-queue-workers-production-q7",
          prompt: "What is the real trade-off between `queue:listen` and `queue:work`?",
          options: [
            "`queue:listen` reboots the framework for each job so code changes apply immediately, but it is significantly less efficient",
            "`queue:listen` processes several jobs concurrently; `queue:work` processes one",
            "`queue:listen` only works with the database driver",
            "`queue:listen` retries failed jobs automatically; `queue:work` does not",
          ],
          correctIndex: 0,
          explanation:
            "Paying a full framework boot per job is fine on your laptop and wasteful in production. Production uses `queue:work` plus a restart step in the deploy script.",
        },
        {
          id: "lv-queue-workers-production-q8",
          prompt: "Job A sets a static property on a service class. Job B, processed later by the same worker, reads it. What does B see?",
          options: [
            "A's value — the process was never torn down between the two jobs",
            "The class's default value, because Laravel resets statics between jobs",
            "Null, because statics are not allowed in queued code",
            "A's value only if both jobs are in the same batch",
          ],
          correctIndex: 0,
          explanation:
            "The docs say it plainly: static state created or modified by your application is not reset between jobs. This is where container `scoped()` bindings earn their keep, and where a request-shaped singleton becomes a cross-tenant bug.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-workers-production-q9",
          prompt: "A job implements `Interruptible`. When is its `interrupted(int $signal)` method called?",
          options: [
            "Only when the worker receives a termination signal while that job is actually running",
            "Whenever the job times out",
            "Whenever the job fails, instead of `failed()`",
            "Before every attempt, so the job can decide whether to continue",
          ],
          correctIndex: 0,
          explanation:
            "It's a checkpoint hook for long loops — set a flag, break out, save progress. The docs are explicit that it does not replace timeouts or the `failed()` method.",
        },
        {
          id: "lv-queue-workers-production-q10",
          prompt: "What does `php artisan queue:pause database:default` do?",
          options: [
            "Workers finish their current job and stop picking up new ones from that queue, while the processes stay alive",
            "Stops every worker process on that connection",
            "Prevents new jobs from being dispatched to that queue",
            "Moves the queue's pending jobs to a paused table",
          ],
          correctIndex: 0,
          explanation:
            "Pausing is about consumption, not the process or the producer. `queue:continue` resumes it, and resuming everything with `--all` does not resume queues that were paused individually.",
        },
        {
          id: "lv-queue-workers-production-q11",
          prompt: "The application is put into maintenance mode during a migration. What happens to queued jobs?",
          options: [
            "They are not processed until maintenance mode is lifted, unless workers run with `--force`",
            "They are discarded",
            "They are processed as normal; maintenance mode only affects HTTP",
            "They are moved to `failed_jobs`",
          ],
          correctIndex: 0,
          explanation:
            "Halting workers during a schema change is usually what you want, since the jobs would be running against a half-migrated database. `--force` exists for the cases where it isn't.",
        },
        {
          id: "lv-queue-workers-production-q12",
          prompt: "What do you give up by calling `Queue::withoutInterruptionPolling()` in a service provider?",
          options: [
            "Workers stop responding to `queue:restart` and `queue:pause`, because they no longer poll the cache each iteration",
            "Workers no longer handle SIGTERM gracefully",
            "Jobs are no longer released after a timeout",
            "Failed jobs are no longer recorded",
          ],
          correctIndex: 0,
          explanation:
            "The poll is a small per-iteration cost that buys you deploy control. Disabling it is a throughput micro-optimisation that quietly breaks the mechanism your deploy script depends on.",
        },
      ],
    },
    {
      id: "lv-queue-horizon",
      moduleId: "laravel-queues-events",
      trackId: "php",
      title: "Horizon",
      summary:
        "Horizon replaces hand-written Supervisor blocks with a `config/horizon.php` file that lives in version control, and adds a dashboard showing throughput, runtime, failures, tags and a retry button. It requires Redis and is not compatible with Redis Cluster — if your failover list includes `database`, you still need a plain `queue:work database` process alongside Horizon.\n\nThe configuration is `environments` → supervisors → worker options. `balance` is the interesting one. The default, `auto`, moves processes between the supervisor's queues according to `autoScalingStrategy` (`time` estimates how long each queue needs, `size` counts jobs, `log` dampens a very large queue's share), bounded by `minProcesses` and `maxProcesses` and paced by `balanceMaxShift`/`balanceCooldown`. `simple` splits a fixed `processes` count evenly and never scales. `false` processes queues in strict list order, like the plain worker. The trap is assuming `'queue' => ['high', 'default']` means priority under `auto` — it doesn't; ordering there is meaningless, and strict priority needs either `balance: false` or separate supervisors.\n\nThe other traps are inherited from the plain worker and re-expressed in config. If `tries` is unset, Horizon defaults to a single attempt (a job's own attribute still wins). The supervisor `timeout` must be greater than any job-level timeout — auto balancing force-kills workers it considers hung during scale-down — and still smaller than `retry_after`, or jobs get processed twice. `memory`, `maxJobs` and `maxTime` are the recycling knobs. Deploys use `php artisan horizon:terminate`, letting in-flight jobs finish, with a process monitor restarting the master; and `horizon:forget` and `horizon:clear` replace their `queue:` equivalents.",
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        { label: "Laravel: Horizon", url: "https://laravel.com/framework/docs/13.x/horizon", kind: "docs" },
        { label: "Laravel: Horizon — Balancing Strategies", url: "https://laravel.com/framework/docs/13.x/horizon#balancing-strategies", kind: "docs" },
        { label: "Laravel: Horizon — Deploying Horizon", url: "https://laravel.com/framework/docs/13.x/horizon#deploying-horizon", kind: "docs" },
      ],
      video: {
        title: "Laravel Horizon: queue monitoring + configuration",
        channel: "Aaron Francis",
        url: "https://www.youtube.com/watch?v=r3c_qBvAHXA",
        videoId: "r3c_qBvAHXA",
        durationLabel: "14:53",
      },
      alternateVideos: [
        {
          title: "Horizon - Beautiful queue monitoring",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=Lb6V4yQ2B4s",
          videoId: "Lb6V4yQ2B4s",
          durationLabel: "5:04",
        },
        {
          title: "Laravel Queues Lesson 3 — Laravel Horizon: setting it up, load balancing & handling logs",
          channel: "Mateus Guimarães",
          url: "https://www.youtube.com/watch?v=LfncFzvnkXI",
          videoId: "LfncFzvnkXI",
          durationLabel: "15:14",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-queue-horizon-q1",
          prompt: "Which queue connections can Horizon manage?",
          options: [
            "Redis only, and not Redis Cluster",
            "Redis and the database driver",
            "Any driver, since it reads from `config/queue.php`",
            "Redis and SQS",
          ],
          correctIndex: 0,
          explanation:
            "Horizon's metrics, tags and balancing are built on Redis data structures. A `database` or `sqs` queue in the same application needs its own `queue:work` process supervised the ordinary way.",
        },
        {
          id: "lv-queue-horizon-q2",
          prompt: "A supervisor is configured with `'queue' => ['high', 'default']` and `'balance' => 'auto'`. Are `high` jobs prioritised?",
          options: [
            "No — under auto balancing the order of the queue list has no effect on process assignment",
            "Yes — the first queue in the list always gets workers first",
            "Yes, but only until `balanceCooldown` elapses",
            "Only if `minProcesses` is set to 1",
          ],
          correctIndex: 0,
          explanation:
            "Auto balancing assigns processes by load via `autoScalingStrategy`, not by list position. Real priority needs `balance: false` or, better, a separate supervisor per queue with its own process budget.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-horizon-q3",
          prompt: "`'balance' => 'simple'` with `'processes' => 10` across the queues `['default', 'notifications']` gives you what?",
          options: [
            "Five fixed processes per queue, with no autoscaling",
            "Ten processes per queue",
            "Ten processes that move between the queues as load changes",
            "One process per queue, scaling up to ten",
          ],
          correctIndex: 0,
          explanation:
            "`simple` divides the total evenly and leaves it there. Uneven queues need either `auto`, or separate supervisors with individually sized process counts.",
        },
        {
          id: "lv-queue-horizon-q4",
          prompt: "Which of these are true about Horizon? (Select all that apply.)",
          options: [
            "Worker configuration lives in `config/horizon.php` and is version-controlled with the application",
            "It replaces the need for a separate Supervisor program per queue",
            "You still need a process monitor to keep the `php artisan horizon` master process alive",
            "It removes the need for a `retry_after` value on the connection",
            "It works with the `database` queue driver",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Horizon supervises workers, but something still has to supervise Horizon. `retry_after` is a queue-level guarantee Horizon does not replace — the Horizon `timeout` must stay below it.",
        },
        {
          id: "lv-queue-horizon-q5",
          prompt: "Which command belongs in a deployment script for an application running Horizon?",
          options: [
            "`php artisan horizon:terminate`",
            "`php artisan horizon:pause`",
            "`php artisan queue:restart`",
            "`php artisan horizon:clear`",
          ],
          correctIndex: 0,
          explanation:
            "`horizon:terminate` lets in-flight jobs finish and then stops the master so the monitor restarts it on new code. `horizon:pause` merely stops processing, and `horizon:clear` deletes pending jobs.",
        },
        {
          id: "lv-queue-horizon-q6",
          prompt: "A supervisor's config omits `tries`, and a job uses the `WithoutOverlapping` middleware with no attempts set either. What happens on contention?",
          options: [
            "The released job has already used its single attempt and fails",
            "Horizon defaults to three attempts, so it retries twice more",
            "The job waits for the lock without consuming an attempt",
            "Horizon retries indefinitely until the lock is free",
          ],
          correctIndex: 0,
          explanation:
            "Horizon inherits the framework's single-attempt default, and the docs call out that releasing middleware makes tuning `tries` essential. A job-level attribute still takes precedence over the supervisor value.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-horizon-q7",
          prompt: "How is access to the `/horizon` dashboard controlled outside the `local` environment?",
          options: [
            "By the `viewHorizon` gate defined in `app/Providers/HorizonServiceProvider.php`",
            "By an IP allowlist in `config/horizon.php`",
            "By HTTP basic auth credentials in `.env`",
            "It is never reachable outside `local`",
          ],
          correctIndex: 0,
          explanation:
            "The generated gate returns false for everyone until you edit it, which is the safe default. If you secure the route another way, the closure has to accept a nullable user or Laravel will require authentication.",
        },
        {
          id: "lv-queue-horizon-q8",
          prompt: "What does adding a job class to the `silenced` array in `config/horizon.php` do?",
          options: [
            "Keeps it out of the \"Completed Jobs\" list so high-volume noise doesn't drown the dashboard",
            "Stops the job from being dispatched",
            "Suppresses exceptions the job throws",
            "Excludes it from failure notifications only",
          ],
          correctIndex: 0,
          explanation:
            "It is a display concern, not a behaviour change — failures still show up. Jobs can also opt in themselves via the `Silenced` interface, or be silenced in bulk by tag.",
        },
        {
          id: "lv-queue-horizon-q9",
          prompt: "What does `'autoScalingStrategy' => 'time'` mean, compared to `'size'`?",
          options: [
            "Processes are assigned by the estimated time needed to clear each queue, rather than by raw job count",
            "Processes are rebalanced on a fixed time interval rather than on queue changes",
            "Each queue gets an equal share of worker time",
            "Jobs are prioritised by how long they have been waiting",
          ],
          correctIndex: 0,
          explanation:
            "A queue of 50 slow jobs may need more workers than 5,000 fast ones, which `size` would get backwards. `log` is the middle ground that stops one enormous queue taking every process.",
        },
        {
          id: "lv-queue-horizon-q10",
          prompt: "A supervisor sets `'timeout' => 120` while a job class declares `#[Timeout(180)]`. Why is that a problem?",
          options: [
            "Horizon may force-kill the worker at 120 seconds, terminating a job that was still legitimately running",
            "The job's attribute is ignored and 120 seconds is used silently",
            "Horizon refuses to start with conflicting timeouts",
            "The job is retried at 120 seconds while still running at 180",
          ],
          correctIndex: 0,
          explanation:
            "The Horizon timeout must be greater than any job-level timeout, and still comfortably below `retry_after`. Getting that ordering wrong is how jobs end up half-finished or processed twice.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-horizon-q11",
          prompt: "What do `memory`, `maxJobs` and `maxTime` in a supervisor's configuration control?",
          options: [
            "When a worker process is recycled — by megabytes consumed, jobs processed, or seconds alive",
            "Limits enforced on individual jobs, which fail when they are exceeded",
            "The total resources Horizon may use across all supervisors",
            "How aggressively Horizon scales processes up and down",
          ],
          correctIndex: 0,
          explanation:
            "They are the same bounded-lifetime idea as `--max-jobs` and `--max-time` on the CLI, expressed in config. `balanceMaxShift` and `balanceCooldown` are the knobs that control scaling speed.",
        },
      ],
    },
    {
      id: "lv-queue-events-observers",
      moduleId: "laravel-queues-events",
      trackId: "php",
      title: "Events, Listeners and Model Observers",
      summary:
        "Events are Laravel's observer pattern: an event class is a data container, listeners are independent reactions, and neither knows about the other. Since Laravel 11 listeners are discovered automatically — the framework scans `app/Listeners` for any class with a `handle` or `__invoke` method whose first parameter type-hints an event (union types let one method cover several). `->withEvents(discover: [...])` in `bootstrap/app.php` adds directories, `event:list` shows what got registered, and `event:cache` (part of `optimize`) builds a manifest so production doesn't scan the filesystem. `Event::listen()`, closure listeners, wildcard listeners and subscriber classes cover everything discovery doesn't, and returning `false` from a listener stops propagation to the rest.\n\nEloquent model events run through the same dispatcher with a naming convention: `retrieved`, `creating`, `created`, `updating`, `updated`, `saving`, `saved`, `deleting`, `deleted`, `trashed`, `forceDeleting`, `forceDeleted`, `restoring`, `restored` and `replicating`. `-ing` fires before persistence and can cancel by returning `false`; `-ed` fires after. An observer groups them into one class, registered with the `#[ObservedBy]` attribute or `Model::observe()`.\n\nThe tradeoff is worth being honest about. Observers make `Order::create()` — one line that looks like one insert — do five other things, and the call site gives you no hint. That's excellent for invariants (slugs, UUIDs, audit rows) and painful for business logic you will later need to skip, test in isolation, or explain to someone debugging a seeder. And the sharp edge: mass updates and deletes never fire model events, because `Model::where(...)->update()` never instantiates a model. Neither does `DB::table()` or `Model::insert()`. `saveQuietly()`, `deleteQuietly()` and `withoutEvents()` are the deliberate escape hatches; `ShouldHandleEventsAfterCommit` on an observer makes its handlers wait for the surrounding transaction.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel: Events", url: "https://laravel.com/framework/docs/13.x/events", kind: "docs" },
        { label: "Laravel: Eloquent — Observers", url: "https://laravel.com/framework/docs/13.x/eloquent#observers", kind: "docs" },
        { label: "Martin Fowler: Domain Event", url: "https://martinfowler.com/eaaDev/DomainEvent.html", kind: "article" },
      ],
      video: {
        title: "Let's talk about Events and Listeners",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=_8Rrq_RtaB0",
        videoId: "_8Rrq_RtaB0",
        durationLabel: "8:23",
      },
      alternateVideos: [
        {
          title: "Laravel: Why Observers and Event Listeners are \"Risky\"",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=A3bmLo77e5M",
          videoId: "A3bmLo77e5M",
          durationLabel: "8:44",
        },
        {
          title: "The dangers of events and observers in Laravel applications",
          channel: "Mateus Guimarães",
          url: "https://www.youtube.com/watch?v=fqr5aT8oo3w",
          videoId: "fqr5aT8oo3w",
          durationLabel: "29:06",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-queue-events-observers-q1",
          prompt: "In a default Laravel 13 application, how does a listener class get registered?",
          options: [
            "By discovery — the framework scans `app/Listeners` for `handle`/`__invoke` methods with a type-hinted event parameter",
            "By adding it to the `$listen` array in `app/Providers/EventServiceProvider.php`",
            "By adding it to the `listeners` key of `config/app.php`",
            "By adding a `#[ListensTo]` attribute to the class",
          ],
          correctIndex: 0,
          explanation:
            "`EventServiceProvider` and its `$listen` array are gone from the default skeleton — the type hint is the registration. `Event::listen()` in `AppServiceProvider::boot()` still works for anything outside the scanned directories.",
        },
        {
          id: "lv-queue-events-observers-q2",
          prompt: "Why do the docs recommend running `event:cache` (or `optimize`) as part of deployment?",
          options: [
            "It writes a manifest of discovered listeners so the framework doesn't scan the filesystem on every boot",
            "It pre-warms the queue so listeners start faster",
            "It validates that every event has at least one listener",
            "It compiles listeners into a single class for the opcode cache",
          ],
          correctIndex: 0,
          explanation:
            "Discovery is convenient and costs a directory scan plus reflection. Caching it removes that cost per boot — and means `event:clear` is needed if you add a listener without redeploying.",
        },
        {
          id: "lv-queue-events-observers-q3",
          prompt: "What does returning `false` from a listener's `handle()` method do?",
          options: [
            "Stops the event propagating to any remaining listeners",
            "Marks the listener's queued job as failed",
            "Rolls back the event's database changes",
            "Nothing — return values from listeners are ignored",
          ],
          correctIndex: 0,
          explanation:
            "It's the same veto mechanism `-ing` model events use. It is also easy to trigger accidentally from a method that returns a falsy value by coincidence.",
        },
        {
          id: "lv-queue-events-observers-q4",
          prompt: "A `UserObserver` writes an audit row in its `deleted()` method. An admin action runs `User::where('active', false)->delete();`. How many audit rows are written?",
          options: [
            "None — mass deletes never instantiate models, so no model events fire",
            "One per deleted user, as usual",
            "One, for the query as a whole",
            "One per user, but only if the models were previously retrieved",
          ],
          correctIndex: 0,
          explanation:
            "The docs state it directly: `saved`, `updated`, `deleting` and `deleted` are not dispatched for mass updates or deletes. Fetch and loop when the side effects matter, or move the logic somewhere explicit.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-events-observers-q5",
          prompt: "A data import must not trigger any model events. Which pair of tools is designed for that?",
          options: [
            "`$model->saveQuietly()` for a single model, and `Model::withoutEvents(fn () => ...)` for a block",
            "`$model->save(['quiet' => true])` and `Event::fake()`",
            "`Model::unsetEventDispatcher()` and `Event::forget()`",
            "`$model->saveSilently()` and `DB::withoutEvents()`",
          ],
          correctIndex: 0,
          explanation:
            "`saveQuietly`, `deleteQuietly`, `forceDeleteQuietly` and `restoreQuietly` mute one operation; `withoutEvents()` mutes a whole closure and returns its value. `Event::fake()` is a testing helper, not a production one.",
        },
        {
          id: "lv-queue-events-observers-q6",
          prompt: "An existing model has an attribute changed and `$user->save()` is called. Which events fire? (Select all that apply.)",
          options: ["`saving`", "`updating`", "`saved`", "`creating`", "`created`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`saving`/`saved` wrap both inserts and updates, and `updating`/`updated` fire only for an existing record. `creating`/`created` are reserved for the first save of a new model.",
        },
        {
          id: "lv-queue-events-observers-q7",
          prompt: "What distinguishes the `-ing` model events (`creating`, `updating`, `deleting`) from the `-ed` ones?",
          options: [
            "`-ing` events fire before the change is persisted and can cancel it by returning `false`; `-ed` events fire after",
            "`-ing` events are queued and `-ed` events are synchronous",
            "`-ing` events receive the original model and `-ed` events receive a fresh copy",
            "`-ing` events only fire inside transactions",
          ],
          correctIndex: 0,
          explanation:
            "That before/after split is what makes `creating` the right place to set a UUID and `created` the right place to dispatch a welcome job — the row exists by then.",
        },
        {
          id: "lv-queue-events-observers-q8",
          prompt: "A listener reacts to the `saved` model event. A nightly import calls `Order::insert($tenThousandRows)`. Does the listener run?",
          options: [
            "No — `insert()` is a query-builder call that never instantiates models",
            "Yes, once per row",
            "Yes, once for the whole statement",
            "Only if the model uses the `Batchable` trait",
          ],
          correctIndex: 0,
          explanation:
            "Bulk inserts, `DB::table()` writes and raw SQL all bypass Eloquent's event plumbing entirely. That is precisely why they are fast, and precisely why they quietly skip your invariants.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-events-observers-q9",
          prompt: "How do you register an observer in current Laravel?",
          options: [
            "Put `#[ObservedBy([UserObserver::class])]` on the model, or call `User::observe(UserObserver::class)` in a provider's `boot()`",
            "Add it to the `observers` array in `config/app.php`",
            "Name it `<Model>Observer` and place it in `app/Observers`, which is enough on its own",
            "Implement `Observer` on the class; the framework discovers it automatically",
          ],
          correctIndex: 0,
          explanation:
            "There is no observer auto-discovery by filename — the attribute or the `observe()` call is what wires it up. The attribute has the advantage of being visible on the model you are reading.",
        },
        {
          id: "lv-queue-events-observers-q10",
          prompt: "An observer implements `ShouldHandleEventsAfterCommit`. When do its handlers run?",
          options: [
            "After the surrounding transaction commits — or immediately, if no transaction is in progress",
            "Only inside a transaction; otherwise they are skipped",
            "On the queue, once the transaction commits",
            "Before the transaction commits, so they can cancel it",
          ],
          correctIndex: 0,
          explanation:
            "It is the observer-shaped answer to the same race that `after_commit` solves for jobs: don't react to a row your own transaction hasn't committed yet.",
        },
        {
          id: "lv-queue-events-observers-q11",
          prompt: "When is an observer the wrong tool for a side effect?",
          options: [
            "When the effect is business logic that a reader of the call site needs to see, or that must be skippable in seeders, imports and tests",
            "When the effect touches more than one table",
            "When the model uses soft deletes",
            "When the effect needs to be queued",
          ],
          correctIndex: 0,
          explanation:
            "Invisible-at-the-call-site is the whole value proposition and the whole cost. Invariants belong in an observer; \"charge the card and notify the warehouse\" belongs in an explicit action the caller invokes.",
        },
      ],
    },
    {
      id: "lv-queue-queued-listeners-mail",
      moduleId: "laravel-queues-events",
      trackId: "php",
      title: "Queued Listeners, Mail and Notifications",
      summary:
        "Almost everything Laravel can do in the background is the same machinery wearing a different name. A listener becomes a queued job by implementing `ShouldQueue`. A mailable is queued either by implementing `ShouldQueue` — in which case even `Mail::send()` queues it — or by calling `Mail::to($user)->queue($mailable)`. A notification queues by implementing `ShouldQueue` and using `Queueable`, and `Notification::sendNow()` forces it through immediately regardless.\n\nBecause they're all jobs, they take the same controls: the `#[Connection]`, `#[Queue]` and `#[Delay]` attributes, plus `#[Tries]`, `#[Backoff]`, `#[Timeout]`, `#[FailOnTimeout]`, `#[MaxExceptions]`, a `retryUntil()` method, job `middleware()`, and `InteractsWithQueue` for `release()`/`delete()`. Listeners add a few of their own: `viaConnection()`, `viaQueue()` and `withDelay()` decide at runtime, and `shouldQueue(Event $e): bool` decides whether to queue *at all* based on the event's data. Transactions come back too: `ShouldQueueAfterCommit` on a listener, `$this->afterCommit()` in a mailable's constructor, `ShouldDispatchAfterCommit` on the event itself.\n\nTwo things catch people out. First, a notification sent to several channels becomes a separate queued job per channel, so a Slack outage does not hold up the email — and `viaQueues()` lets you route each channel to a different queue. Second, broadcasting rides on the queue: an event implementing `ShouldBroadcast` is pushed as a job and a worker hands it to Reverb, Pusher or Ably. With no worker running, nothing is ever broadcast, which is the single most common cause of \"my websockets don't work\"; `ShouldBroadcastNow` bypasses the queue at the cost of doing it in the request. And when a queued mailable finally fails, it fails into `failed_jobs`, not into your mail logs.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel: Events — Queued Event Listeners", url: "https://laravel.com/framework/docs/13.x/events#queued-event-listeners", kind: "docs" },
        { label: "Laravel: Mail — Queueing Mail", url: "https://laravel.com/framework/docs/13.x/mail#queueing-mail", kind: "docs" },
        { label: "Laravel: Notifications — Queueing Notifications", url: "https://laravel.com/framework/docs/13.x/notifications#queueing-notifications", kind: "docs" },
        { label: "Laravel: Broadcasting", url: "https://laravel.com/framework/docs/13.x/broadcasting#introduction", kind: "docs" },
      ],
      video: {
        title: "Laravel Queues 101: Example with Sending Emails",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=rVx8xKisbr8",
        videoId: "rVx8xKisbr8",
        durationLabel: "8:43",
      },
      alternateVideos: [
        {
          title: "Should You Use a Notification or a Mailable?",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=GGZF9E9mM_E",
          videoId: "GGZF9E9mM_E",
          durationLabel: "12:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-queue-queued-listeners-mail-q1",
          prompt: "What is the minimum change that makes an existing event listener run on the queue?",
          options: [
            "Add `implements ShouldQueue` to the listener class",
            "Wrap the listener body in `dispatch(function () { ... })`",
            "Register it with `Event::listen(queueable(...))` instead of by discovery",
            "Add the `Queueable` trait to the event class",
          ],
          correctIndex: 0,
          explanation:
            "The dispatcher checks the contract and pushes the listener as a job automatically. `queueable()` is only for closure listeners registered manually.",
        },
        {
          id: "lv-queue-queued-listeners-mail-q2",
          prompt: "A notification class implements `ShouldQueue`. What does `Notification::sendNow($users, new DeploymentCompleted($d))` do?",
          options: [
            "Sends it immediately, in the current process, despite the contract",
            "Queues it with a zero delay",
            "Throws, because the notification is marked as queueable",
            "Queues it on the `now` queue",
          ],
          correctIndex: 0,
          explanation:
            "`sendNow` is the explicit override for cases where the delivery has to happen before the response — a one-time password, say. The `ShouldQueue` contract governs the default path only.",
        },
        {
          id: "lv-queue-queued-listeners-mail-q3",
          prompt: "`class OrderShipped extends Mailable implements ShouldQueue`. What does `Mail::to($user)->send(new OrderShipped($order))` do?",
          options: [
            "Queues the mailable anyway — the contract wins over the method name",
            "Sends it synchronously, because `send()` was called instead of `queue()`",
            "Throws an exception telling you to use `queue()`",
            "Sends it synchronously and logs a deprecation warning",
          ],
          correctIndex: 0,
          explanation:
            "\"Queueing by default\" is the point of putting the contract on the class: no call site can forget. It also means a test asserting on sent mail has to account for the queue.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-queued-listeners-mail-q4",
          prompt: "An `OrderShipped` event has three listeners, one of them queued. The queued listener throws on every attempt and ends up in `failed_jobs`. What happened to the other two?",
          options: [
            "They already ran synchronously when the event was dispatched and are unaffected",
            "They are rolled back along with the failed listener",
            "They are re-run when the failed listener is retried",
            "They never ran, because the dispatcher aborts on the first failure",
          ],
          correctIndex: 0,
          explanation:
            "Each queued listener is an independent job. That independence is the feature — and the reason \"the event succeeded\" tells you nothing about whether its side effects did.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-queued-listeners-mail-q5",
          prompt: "Which attributes can be applied to a queued listener class? (Select all that apply.)",
          options: ["`#[Tries(5)]`", "`#[Backoff(3)]`", "`#[Timeout(120)]`", "`#[ObservedBy([...])]`", "`#[Middleware(...)]`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Queued listeners accept the same queue attributes as jobs, plus `#[Connection]`, `#[Queue]`, `#[Delay]` and `#[FailOnTimeout]`. `#[ObservedBy]` is an Eloquent attribute, and listener middleware comes from a `middleware()` method.",
        },
        {
          id: "lv-queue-queued-listeners-mail-q6",
          prompt: "What does a `shouldQueue(OrderCreated $event): bool` method on a listener let you do?",
          options: [
            "Decide at runtime, from the event's data, whether this listener is queued at all",
            "Decide which queue connection the listener uses",
            "Delay the listener until a condition becomes true",
            "Skip the listener if the queue is currently busy",
          ],
          correctIndex: 0,
          explanation:
            "Returning `false` means the listener is simply not queued for that event — useful for \"only reward orders over $50\". `viaConnection()` and `viaQueue()` are the methods for choosing *where*.",
        },
        {
          id: "lv-queue-queued-listeners-mail-q7",
          prompt: "A listener is queued from inside a database transaction and reads a row created in that transaction. The connection's `after_commit` is `false`. What is the fix on the listener?",
          options: [
            "Implement `ShouldQueueAfterCommit` instead of `ShouldQueue`",
            "Add `#[Delay(5)]` to give the transaction time to commit",
            "Add `#[Tries(10)]` so it retries until the row exists",
            "Move the listener registration into `AppServiceProvider::boot()`",
          ],
          correctIndex: 0,
          explanation:
            "Delays and retries are hope dressed as configuration; the contract is deterministic. `ShouldDispatchAfterCommit` on the event is the bigger hammer, holding the event from synchronous listeners too.",
        },
        {
          id: "lv-queue-queued-listeners-mail-q8",
          prompt: "An event implements `ShouldBroadcast` and the frontend receives nothing, although the event is clearly being dispatched. What is the first thing to check?",
          options: [
            "Whether a queue worker is running — broadcast events are pushed onto the queue and handed to the broadcaster by a worker",
            "Whether the event class uses `SerializesModels`",
            "Whether the event has at least one registered listener",
            "Whether the channel name matches the event class name",
          ],
          correctIndex: 0,
          explanation:
            "`ShouldBroadcast` means \"broadcast via the queue\". No worker, no broadcast — and nothing in the logs to say so. `ShouldBroadcastNow` sends in-process, which is a reasonable diagnostic and a poor default.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-queued-listeners-mail-q9",
          prompt: "A queued notification is delivered over the `mail`, `database` and `slack` channels. How is that processed?",
          options: [
            "As a separate queued job per channel, so one slow channel doesn't hold up the others",
            "As a single job that sends all three in sequence",
            "As a single job per recipient, regardless of channel count",
            "Synchronously for `database` and queued for the other two",
          ],
          correctIndex: 0,
          explanation:
            "Per-channel jobs mean a Slack outage fails only the Slack delivery. The notification's `viaQueues()` method lets you route each channel to a different queue, which is how you keep transactional email off a saturated default queue.",
        },
        {
          id: "lv-queue-queued-listeners-mail-q10",
          prompt: "A customer says an order confirmation email never arrived, and the mailable implements `ShouldQueue`. Where do you look first?",
          options: [
            "The `failed_jobs` table and the queue's failure alerting",
            "The mail driver's logs, since the mailable was handed to it",
            "The `notifications` table",
            "The web server's access log for the request that sent it",
          ],
          correctIndex: 0,
          explanation:
            "If the job never ran, the mail driver was never called and has nothing to report. Queued delivery moves the whole failure surface into the queue, which is why queue alerting is email alerting.",
        },
        {
          id: "lv-queue-queued-listeners-mail-q11",
          prompt: "What does adding the `InteractsWithQueue` trait to a queued listener give you?",
          options: [
            "Access to the underlying job's `release()` and `delete()` methods from inside `handle()`",
            "Automatic retries with exponential backoff",
            "The ability to dispatch the listener manually",
            "Access to the event's original dispatch time",
          ],
          correctIndex: 0,
          explanation:
            "It's the same trait jobs use to talk back to the queue — release this for 30 seconds, or drop it entirely. It is imported by default on generated listeners.",
        },
      ],
    },
    {
      id: "lv-queue-scheduling",
      moduleId: "laravel-queues-events",
      trackId: "php",
      title: "Task Scheduling in routes/console.php",
      summary:
        "The scheduler exists so your recurring work lives in source control instead of in a crontab nobody can find. The server gets exactly one entry — `* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1` — and everything else is PHP. Since Laravel 11 the schedule lives in **`routes/console.php`** using the `Schedule` facade (`app/Console/Kernel.php` no longer exists; `->withSchedule()` in `bootstrap/app.php` is the alternative). `Schedule::command()`, `Schedule::job(new Heartbeat, 'heartbeats', 'sqs')`, `Schedule::call()` and `Schedule::exec()` cover the four shapes, and `schedule:list` prints the resolved schedule with next run times.\n\nThe operational reality is that `schedule:run` executes due tasks **sequentially** in one process. A task that takes twelve minutes delays everything defined after it, so long work should be `Schedule::job()` (handed to a worker) or at least `runInBackground()` (command and exec only). `withoutOverlapping($minutes)` takes a cache lock — default expiry 24 hours, cleared by `schedule:clear-cache` if a crash strands it — so a slow run doesn't stack on itself. `onOneServer()` takes an atomic lock so a three-server fleet runs the task once rather than three times; both need a shared, lock-capable cache, and scheduled closures or jobs dispatched with different parameters need `->name()` to be distinguishable.\n\nThe edges: sub-minute frequencies such as `everyTenSeconds()` make `schedule:run` stay alive for the whole minute, so a deploy must call `schedule:interrupt` or the previous release keeps running until the minute ends. Timezones and DST can make a task run twice or not at all, which is why the docs recommend avoiding per-task timezones. Maintenance mode skips tasks unless `evenInMaintenanceMode()`, `schedule:pause`/`schedule:continue` pause the whole schedule without a deploy, and `onSuccess`/`onFailure` plus `pingOnSuccess`/`pingOnFailure` are how a silent cron becomes an observable one.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "Laravel: Task Scheduling", url: "https://laravel.com/framework/docs/13.x/scheduling", kind: "docs" },
        { label: "Laravel: Task Scheduling — Running Tasks on One Server", url: "https://laravel.com/framework/docs/13.x/scheduling#running-tasks-on-one-server", kind: "docs" },
        { label: "man7: crontab(5)", url: "https://man7.org/linux/man-pages/man5/crontab.5.html", kind: "docs" },
      ],
      video: {
        title: "Laravel 12 | Task Scheduling | Cron Job in Laravel | Daily Database Backup | | NoviceDeveloper",
        channel: "Novice Developer",
        url: "https://www.youtube.com/watch?v=9PuO86iIFdc",
        videoId: "9PuO86iIFdc",
        durationLabel: "31:45",
      },
      alternateVideos: [
        {
          title: "Laravel 11 Task Scheduling Simplified: New Approach Without Kernel.php",
          channel: "Laravel boy",
          url: "https://www.youtube.com/watch?v=LM4OzsUAevY",
          videoId: "LM4OzsUAevY",
          durationLabel: "4:56",
        },
        {
          title: "Laravel Scheduler: 5 \"Tricks\" You May Not Know",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=KBAIWP8wfyQ",
          videoId: "KBAIWP8wfyQ",
          durationLabel: "3:17",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-queue-scheduling-q1",
          prompt: "How many cron entries does a Laravel application with forty scheduled tasks need on the server?",
          options: [
            "One, running `schedule:run` every minute",
            "One per task",
            "One per task frequency, e.g. one for hourly and one for daily",
            "None — the scheduler runs inside the queue worker",
          ],
          correctIndex: 0,
          explanation:
            "`schedule:run` evaluates every definition against the current time and runs whatever is due. That single entry is the whole point: the schedule itself is code, reviewed and deployed like anything else.",
        },
        {
          id: "lv-queue-scheduling-q2",
          prompt: "In a Laravel 13 application, where do scheduled task definitions live?",
          options: [
            "`routes/console.php`, using the `Schedule` facade (or `->withSchedule()` in `bootstrap/app.php`)",
            "The `schedule()` method of `app/Console/Kernel.php`",
            "The `schedule` array in `config/app.php`",
            "A `#[Scheduled]` attribute on each command class",
          ],
          correctIndex: 0,
          explanation:
            "`app/Console/Kernel.php` has not existed since Laravel 11 — any tutorial that opens one is written for Laravel 10 or earlier. That also means routing, middleware and exception configuration moved to `bootstrap/app.php`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-scheduling-q3",
          prompt: "Two tasks are both defined `->daily()`, and the first reliably takes twenty minutes. When does the second run?",
          options: [
            "About twenty minutes late — due tasks execute sequentially in the order they are defined",
            "At midnight, in parallel with the first",
            "At midnight, in a separate `schedule:run` process",
            "It is skipped, because the scheduler has moved past its window",
          ],
          correctIndex: 0,
          explanation:
            "One `schedule:run` invocation runs due tasks one after another. `runInBackground()` (command and exec only) or `Schedule::job()` moves the work off that critical path.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-scheduling-q4",
          prompt: "How long does the lock taken by `withoutOverlapping()` last by default, and how do you clear a stranded one?",
          options: [
            "24 hours, cleared with `php artisan schedule:clear-cache`",
            "One minute, cleared automatically on the next run",
            "Until the process exits; it cannot be stranded",
            "One hour, cleared with `cache:clear`",
          ],
          correctIndex: 0,
          explanation:
            "A server that dies mid-task leaves the lock behind, and 24 hours of silence is a long outage. Pass an explicit expiry — `withoutOverlapping(10)` — sized to the task's realistic maximum.",
        },
        {
          id: "lv-queue-scheduling-q5",
          prompt: "Three application servers each run the standard `schedule:run` cron entry. A `report:generate` task is defined `->fridays()->at('17:00')`. What happens?",
          options: [
            "The report is generated three times, once per server, unless the task uses `onOneServer()`",
            "Only the server that owns the cron lock runs it",
            "Laravel elects a leader automatically for scheduled tasks",
            "It runs once, because the task's cache lock is shared",
          ],
          correctIndex: 0,
          explanation:
            "Every server evaluates the same schedule independently. `onOneServer()` uses an atomic lock so the first server to grab it wins — which requires a shared `database`, `memcached`, `dynamodb` or `redis` cache across the fleet.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-scheduling-q6",
          prompt: "Why does `Schedule::call(fn () => User::resetApiRequestCount())->daily()->onOneServer()` need a `->name()`?",
          options: [
            "The lock key is derived from the task's identity, and closures (or the same job with different arguments) need a name to be told apart",
            "Closures cannot be scheduled without a name",
            "The name becomes the cache store used for the lock",
            "Without it the task runs on every server regardless",
          ],
          correctIndex: 0,
          explanation:
            "Two `CheckUptime` jobs with different URLs would otherwise share one lock and only one would ever run. `->name('check_uptime:laravel.com')` makes each permutation distinct.",
        },
        {
          id: "lv-queue-scheduling-q7",
          prompt: "Which of these rely on the cache store to coordinate? (Select all that apply.)",
          options: [
            "`onOneServer()` on a scheduled task",
            "`withoutOverlapping()` on a scheduled task",
            "`queue:restart` reaching running workers",
            "`runInBackground()` on a scheduled command",
            "`->daily()` frequency evaluation",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Locks and the worker restart signal all live in the cache, which is why a misconfigured or per-server cache breaks them silently. Backgrounding forks a process and frequency evaluation is pure date arithmetic.",
        },
        {
          id: "lv-queue-scheduling-q8",
          prompt: "An application defines `Schedule::job(new DeleteRecentUsers)->everyTenSeconds();`. How does that change `schedule:run`?",
          options: [
            "It keeps running until the end of the current minute instead of exiting immediately",
            "It is invoked six times a minute by cron",
            "It spawns a daemon that outlives the minute",
            "It is ignored — cron cannot schedule below one minute",
          ],
          correctIndex: 0,
          explanation:
            "Cron can only fire once a minute, so Laravel keeps the process alive to fire the sub-minute tasks itself. The consequence for deploys is the next question.",
        },
        {
          id: "lv-queue-scheduling-q9",
          prompt: "Given sub-minute tasks, what must a deployment script do?",
          options: [
            "Run `php artisan schedule:interrupt` after deploying, so an in-flight `schedule:run` stops using the previous release's code",
            "Run `php artisan schedule:clear-cache` before deploying",
            "Disable the cron entry for the duration of the deploy",
            "Nothing — `schedule:run` re-reads the schedule each time it fires a task",
          ],
          correctIndex: 0,
          explanation:
            "A long-lived `schedule:run` holds the code it booted with, exactly like a queue worker. `schedule:interrupt` is the scheduler's `queue:restart`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-queue-scheduling-q10",
          prompt: "Why do the docs recommend that sub-minute tasks dispatch queued jobs rather than doing the work inline?",
          options: [
            "A sub-minute task that overruns delays the later sub-minute tasks in the same minute",
            "Sub-minute tasks are not allowed to touch the database",
            "Closures cannot be used for sub-minute schedules",
            "The scheduler kills any sub-minute task that exceeds ten seconds",
          ],
          correctIndex: 0,
          explanation:
            "Everything in that one-minute loop is sequential. `Schedule::job(...)->everyTenSeconds()` makes the scheduled work a dispatch — microseconds — and puts the real work on a worker.",
        },
        {
          id: "lv-queue-scheduling-q11",
          prompt: "The application is in maintenance mode when a scheduled task is due. What happens?",
          options: [
            "The task does not run, unless it was defined with `evenInMaintenanceMode()`",
            "The task runs as normal; maintenance mode only affects HTTP",
            "The task is queued and runs when maintenance mode is lifted",
            "`schedule:run` exits with an error",
          ],
          correctIndex: 0,
          explanation:
            "The assumption is that maintenance mode means something is mid-change and tasks would interfere. `schedule:pause` and `schedule:continue` are the equivalent controls when you want to stop the schedule without a full maintenance mode, with `evenWhenPaused()` as the exception.",
        },
        {
          id: "lv-queue-scheduling-q12",
          prompt: "Why do the docs recommend avoiding per-task `timezone()` calls where you can?",
          options: [
            "Daylight saving transitions can make a task run twice or not at all",
            "Timezone conversion is expensive and slows `schedule:run`",
            "The `timezone()` method only accepts UTC offsets",
            "Timezones conflict with `onOneServer()` locks",
          ],
          correctIndex: 0,
          explanation:
            "A task at 02:30 local time has two 02:30s on one day of the year and none on another. Schedule in UTC and convert at the edges, or use `schedule_timezone` deliberately and accept the consequence.",
        },
      ],
    },
  ],
} satisfies Module;
