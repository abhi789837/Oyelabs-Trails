# Deploying Laravel research notes (2026-09-23)

Eighth and final camp of the v3 PHP & Laravel track. Scope: everything between "the app works on
my machine" and "the app is serving users and I can change it safely". Core framework mechanics
(`laravel-foundations`), Eloquent (`laravel-eloquent`), auth (`laravel-auth`), API resources
(`laravel-apis`), the queue *system* (`laravel-queues-events`), testing (`laravel-testing`) and
ecosystem packages (`laravel-ecosystem`) belong to the other camps. Queues appear here only as
"what a deploy does to a running worker"; Horizon appears only as `horizon:terminate`.

13 topics, all **quiz** (133 questions). The sandbox is a V8 isolate and cannot grade PHP, so
difficulty is carried by predict-the-failure scenarios ("the deploy reports success and the
workers keep running old code — why"), configuration-default questions checked against the
framework source, and questions about ordering and blast radius rather than syntax. Every topic
has ≥2 `isEdgeCaseOrInterviewQuestion` and ≥1 multi-select.

Two merges kept the count inside 10–13 while covering every item the brief named. Logging,
the health route and monitoring are one topic (`lv-deploy-logging-monitoring`) — they are the same
question, "how do I know what is happening in there". Maintenance mode and rollback live inside
`lv-deploy-zero-downtime`, because both are answers to the same problem and rollback *is* the
symlink flip. File permissions and the deploy user are folded into `lv-deploy-storage-permissions`,
since `storage/` and `bootstrap/cache/` are the only two things that need write access and the
public-disk symlink is the other half of the same story.

Deliberate overlap with `php-web`'s `php-web-production-config`: that topic owns production
`php.ini`, OPcache defaults and PHP's error-handler trio. This camp only touches OPcache where it
interacts with symlink releases (`$realpath_root`, `validate_timestamps=0`, the CLI's separate
cache), and points at the plain-PHP topic for the rest.

## Topics

1. `lv-deploy-server-stack` — The Production Server Stack and the Document Root (advanced)
2. `lv-deploy-composer-production` — Composer in Production (intermediate)
3. `lv-deploy-optimize-caches` — `artisan optimize`: the Config, Route, View and Event Caches (advanced)
4. `lv-deploy-env-config-cache` — Environment Variables and Why `env()` Returns Null in Production
   (advanced, **milestone**, 12 questions)
5. `lv-deploy-storage-permissions` — Storage, the Public Disk and File Permissions (intermediate)
6. `lv-deploy-migrations` — Running Migrations on Deploy (advanced)
7. `lv-deploy-queue-workers` — Queue Workers Across a Deploy (advanced)
8. `lv-deploy-scheduler-cron` — The Scheduler as a Single Cron Entry (intermediate)
9. `lv-deploy-cache-redis` — Production Caching: the Application Cache and Redis (advanced)
10. `lv-deploy-logging-monitoring` — Logging, Health Checks and Monitoring (advanced)
11. `lv-deploy-zero-downtime` — Zero-Downtime Deploys, Maintenance Mode and Rollback (expert,
    **milestone**, 12 questions)
12. `lv-deploy-docker` — Containerising Laravel (advanced)
13. `lv-deploy-managed-platforms` — Forge, Vapor and Cloud: When Managed Wins (intermediate)

## Videos

Every id came from `scripts/research/yt.mjs search` and was confirmed with
`yt.mjs info <id> --chapters`: all report `embeddable: true`, and every title, channel and
duration below is copied from that output. No search-URL fallbacks. No video is used as the
primary for two topics; `c6ZsjOvGMGM` and `9gEsqgO05ZE` are each used at two *different*
`startSeconds`, which §3 rule 4 allows.

- `lv-deploy-server-stack` → **`c6ZsjOvGMGM`** "Deploy Laravel on Ubuntu Nginx server" (Susan B.,
  18:57) at **922 s**, chapter "Configure Nginx to load application". The only video found that
  actually walks the nginx server block with `root … /public`. Alternate: **`1yQubrkwzz4`**
  "PHP-FPM vs FrankenPHP Classic Performance: What is faster?" (Tideways, 19:34, published Oct
  2025) — the most current treatment of the FPM-vs-FrankenPHP choice.
- `lv-deploy-composer-production` → **`c6ZsjOvGMGM`** at **555 s**, chapter "Build vendor
  directory with Composer". Alternate: **`9gEsqgO05ZE`** "10+ Mistakes When Deploying Laravel
  Project to Production" (Laravel Daily, 11:12, Aug 2025) at **478 s**, chapter "Software version
  consistency" — the PHP-version-parity half of the platform story.
- `lv-deploy-optimize-caches` → **`wT1lcJ_zn18`** "How to Boost Your Laravel App in Minutes"
  (Laracasts, 14:37, Aug 2025, 61k views). No chapters, but it is current and from the strongest
  available source. Alternate: **`3bReOYxzhpE`** "Artisan Cache Commands" (WebDevMatics, 11:46) at
  **515 s**, chapter "The optimize commands".
- `lv-deploy-env-config-cache` → **`AWTUpT7krAs`** "Why You Should NOT Use env() in Laravel
  Controllers?" (Laravel Daily, 2:38). Short and four years old, but it is *precisely* this
  milestone's subject and the behaviour has not changed. Alternates: **`9gEsqgO05ZE`** at **150 s**
  ("Configuring the .env file") and **`2ogZV0qdGNc`** "Environments in Laravel: How APP_ENV Works"
  (Laravel Daily, 5:17).
- `lv-deploy-storage-permissions` → **`HgKUtsO6qig`** "Laravel permissions for storage and
  bootstrap/cache (Apache or Nginx)" (Susan B., 3:52). Exactly the topic, including identifying
  the web-server user. Alternate: **`9gEsqgO05ZE`** at **271 s**, chapter "Handling app URLs and
  paths".
- `lv-deploy-migrations` → **`ONSCQWLD9d0`** "Every engineer should know this.. (Expand-Contract
  Pattern)" (Software Developer Diaries, 6:35, published **Aug 2026**, 49k views) — the freshest
  video in the camp and the clearest walk-through of expand/contract. Alternate: **`cw5K2O4AHJc`**
  "How do software projects achieve zero downtime database migrations?" (Web Dev Cody, 7:05).
  Both are framework-agnostic; the Laravel specifics (`--force`, `--isolated`, `--pretend`,
  `shouldRun()`, `instant()`/`inplace()`/`lock()`/`online()`) are carried by the summary and quiz.
- `lv-deploy-queue-workers` → **`iH4Skwaw-KU`** "How to Set up Laravel Queues on Production"
  (CodingX, 11:56, 20k views). Supervisor-focused; the Supervisor directives it shows are
  unchanged. Alternate: **`r3c_qBvAHXA`** "Laravel Horizon: queue monitoring + configuration"
  (Aaron Francis, 14:53) at **360 s**, chapter "Setting Up Workers and Supervisors".
- `lv-deploy-scheduler-cron` → **`LM4OzsUAevY`** "Laravel 11 Task Scheduling Simplified: New
  Approach Without Kernel.php" (Laravel boy, 4:56). Chosen specifically because every
  higher-view-count scheduler video predates Laravel 11 and demonstrates `app/Console/Kernel.php`,
  which no longer exists. Alternate: **`KBAIWP8wfyQ`** "Laravel Scheduler: 5 'Tricks' You May Not
  Know" (Laravel Daily, 3:17).
- `lv-deploy-cache-redis` → **`ZEH4Ryd96H0`** "Let's Talk About Caching Dos and Don'ts" (official
  Laravel channel, 14:40, May 2025) — covers `Cache::flexible()`, which is the SWR story.
  Alternate: **`1zwsdl0eCwo`** "Ultimate Laravel Optimization Guide!" (David Grzyb, 35:17) at
  **1340 s**, chapter "Redis in Production Environments".
- `lv-deploy-logging-monitoring` → **`MGASWCQ6TJ0`** "Configuring (and viewing!) logs in Laravel"
  (Aaron Francis, 13:16, 24k views). Alternates: **`V40uwtx_usM`** "Pulse - Monitor Your
  Application's Performance in Production" (official Laravel, 4:09, Dec 2025) and **`DTEAN5ADfhs`**
  "Real-time monitoring for Laravel applications" (Aaron Francis, 5:11).
- `lv-deploy-zero-downtime` → **`vY2So0OaHCY`** "Deploying Laravel with Deployer" (Daniel Werner,
  13:11) — has chapters covering the server layout, nginx config and Deployer setup, which is the
  whole atomic-release shape. Alternate: **`C9_O9dn7SzY`** "Effortless Continuous Deployment for
  Laravel with GitHub Actions" (Glenn Raya, 15:40, 16k views).
- `lv-deploy-docker` → **`so50k0t7qWo`** "Laravel Docker Nginx + PHP-FPM + op_cache" (Emad Zaamout,
  22:07, 22k views). Alternate: **`d8NiAbqb6aI`** "How to Deploy Laravel with Octane, FrankenPHP
  and Docker on Debian" (DevWithAri, 9:24) for the single-process FrankenPHP shape.
- `lv-deploy-managed-platforms` → **`6zN4w6PMjcw`** "Laravel Cloud: The Complete Guide to Deploying
  and Scaling Your Apps" (official Laravel, 31:28, **Jun 2026**). Alternates: **`AGYKgFc0DUQ`**
  "Getting Started with Laravel Forge" (official, 4:19, Oct 2025) and **`I-WGiX-tQF8`** "Laravel
  Cloud vs. Laravel Forge" (official, 2:18).

### Searched and rejected
- `o_VHFmt4PJM` ("Why env() returns null in Laravel (and how to fix it)") — YouTube's search result
  is a machine translation; `info` shows the real title is Spanish
  ("Por qué env() devuelve null en Laravel"). Perfect topic match, wrong language.
- `nDHBk1n2CSw` ("Learn Zero Downtime Deployment Laravel With Deployer, FrankenPHP and GitHub
  Actions") — same problem: actual title is Indonesian ("Belajar …"). Worth revisiting if the
  platform ever supports non-English content.
- `HjRbVO4HClA` "Laravel Config: The env() Rule That Prevents Production Bugs" — exactly on topic
  and one month old, but 5 views and an unverifiable channel.
- `LA2jgtAn4Sc` (QiroLab, "Config Cache", 16k views) and `-VRBHXvXbo0` (devbits, "The Optimize
  Command") — both from 2018, i.e. before `optimize` was removed in Laravel 5.5 and reinstated in
  Laravel 11 with different contents. Actively misleading now.
- `_NoWp58pHa4` (Laratips, "Task Scheduling - CRON Job", 70k views) and every other high-view
  scheduler video — all demonstrate `app/Console/Kernel.php`.
- `IOLB2jMVSwQ` (Servers for Hackers, "LEMP with PHP-7.1") — the right channel, eight years stale.
- `vohsuhwWvpw` / `lh4RnczaATI` / `hEXBgQ71rvE` (Chris Fidao, Daniel Persson) — good FPM videos,
  but already used by `php-web`'s FPM topics; not reused here.

## References

All URLs checked with `scripts/research/check-urls.mjs`; every one returns 200 and the **final
URL after redirects** is what is stored. Laravel docs are first in every topic list.

- **The `laravel.com/docs/13.x/…` → `laravel.com/framework/docs/13.x/…` redirect is real** and the
  final URL is stored everywhere, as the brief specifies.
- **`laravel.com/docs/13.x/forge` and `/vapor` are 404** — the product docs are no longer in the
  framework manual. Verified replacements: `https://laravel.com/forge/docs/introduction` (the
  final URL of `forge.laravel.com/docs`), `https://docs.vapor.build/introduction` (final URL of
  `docs.vapor.build/`), and `https://laravel.com/cloud` (final URL of `cloud.laravel.com`).
  `laravel.com/vapor` redirects to `vapor.laravel.com/`.
- Anchors were verified by listing the `id="…"` attributes on each docs page rather than guessed.
  Confirmed present and used: `#server-configuration`, `#directory-permissions`, `#optimization`,
  `#the-health-route`, `#deploying-with-cloud-or-forge`, `#server-requirements`,
  `#configuration-caching`, `#environment-configuration`, `#maintenance-mode`,
  `#the-public-disk`, `#running-migrations`, `#ddl-locking`,
  `#queue-workers-and-deployment`, `#supervisor-configuration`, `#running-the-scheduler`,
  `#running-tasks-on-one-server`, `#preventing-task-overlaps`, `#atomic-locks`,
  `#deploying-horizon`, `#configuring-trusted-proxies`.
- `http://supervisord.org/configuration.html` upgrades to `https://` — the https URL is stored.
- **Iframe previews.** These framework-relevant sites all block embedding, so most reference cards
  in this camp will fall back to link previews: `laravel.com` (`X-Frame-Options: SAMEORIGIN`),
  `laravel.com/forge/docs` (`DENY`), `docs.docker.com` (`DENY`), `martinfowler.com` (`DENY`),
  `12factor.net` (SAMEORIGIN), `dev.mysql.com` (SAMEORIGIN), `www.php.net` (SAMEORIGIN),
  `github.com` (`CSP frame-ancestors 'none'`), `postgresql.org` (`frame-ancestors 'none'`),
  `docs.vapor.build` (`frame-ancestors 'self' mintlify`). The ones that **do** frame:
  `nginx.org`, `caddyserver.com`, `frankenphp.dev`, `getcomposer.org`, `supervisord.org`,
  `man7.org`, `redis.io`, `deployer.org`.
- **No interview-prep repo**, same conclusion as the earlier PHP camps: there is no PHP or Laravel
  equivalent of `lydiahallie/javascript-questions` worth shipping. Two `kind: "repo"` refs point at
  the framework source instead (`OptimizeCommand.php`, `OptimizeClearCommand.php`,
  `LoadEnvironmentVariables.php`), which is where the two hardest facts in the camp are settled.

## Facts verified

Checked on 2026-09-23 against the Laravel 13 docs, the `laravel/laravel` 13.x skeleton and the
`laravel/framework` 13.x source — not from memory. Source links are in the topics' `webRefs`.

### Structure (post-Kernel)
- There is **no `app/Http/Kernel.php` or `app/Console/Kernel.php`**. Middleware, routing and
  exception handling are configured in `bootstrap/app.php` via `->withMiddleware()`,
  `->withRouting()`, `->withExceptions()`. **Scheduled tasks live in `routes/console.php`.**
- Trusted proxies are configured with `$middleware->trustProxies(at: [...])` inside
  `->withMiddleware()`; `headers:` takes the `Request::HEADER_X_FORWARDED_*` bitmask.
- The health route is registered through `->withRouting(health: '/up')` and dispatches
  `Illuminate\Foundation\Events\DiagnosingHealth`. It returns 200 if the app booted, 500 otherwise.

### `optimize` and the framework caches (read from the command source)
- `OptimizeCommand::getOptimizeTasks()` returns exactly
  `config => config:cache`, `events => event:cache`, `routes => route:cache`, `views => view:cache`,
  spread with `ServiceProvider::$optimizeCommands`. It takes `-e|--except`.
- `OptimizeClearCommand::getOptimizeClearTasks()` returns `config:clear`, **`cache:clear`**,
  `clear-compiled`, `event:clear`, `route:clear`, `view:clear`, plus
  `ServiceProvider::$optimizeClearCommands`. **`optimize:clear` therefore flushes the application
  cache**, taking the `queue:restart` flag, `withoutOverlapping()`/`onOneServer()` locks and
  cache-driver maintenance mode with it. This is the camp's most useful under-documented fact.
- `ConfigCacheCommand` writes `'<?php return '.var_export($config, true)`, then `require`s the file
  and, on failure, walks `Arr::dot($config)` to name the offending key before throwing
  `LogicException("Your configuration files could not be serialized because the value at \"{key}\"
  is non-serializable.")`. **A closure in a config file is a hard failure.**
- `RouteCacheCommand` calls `Route::prepareForSerialization()`, which in 13.x **serialises closure
  actions with `SerializableClosure::unsigned(...)` rather than throwing.** The widely repeated
  advice that closure routes break `route:cache` is out of date; this is stated version-explicitly
  in the topic.
- Cache paths from `Application`: `bootstrap/cache/config.php`, `cache/routes-v7.php`,
  `cache/events.php`, `cache/services.php`, `cache/packages.php`, each overridable via
  `APP_CONFIG_CACHE`, `APP_ROUTES_CACHE`, `APP_EVENTS_CACHE`, `APP_SERVICES_CACHE`,
  `APP_PACKAGES_CACHE` (relevant to read-only container filesystems).
- **`php artisan reload` is new and real in Laravel 13**: `ReloadCommand::getReloadTasks()` returns
  `queue => queue:restart`, `schedule => schedule:interrupt`, plus
  `ServiceProvider::$reloadCommands`. The deployment docs present it as the one command to cycle
  long-running services.

### The `env()` trap
- `LoadEnvironmentVariables::bootstrap()` begins `if ($app->configurationIsCached()) { return; }`.
  The `.env` file is therefore **never parsed once `bootstrap/cache/config.php` exists**, for web
  requests *and* Artisan commands.
- The docs' exact wording: "the `env` function will only return **external, system level**
  environment variables." So `env()` is not universally null after caching — a systemd
  `Environment=`, a Docker `-e` or an nginx `fastcgi_param` still reaches it. Only values that
  lived solely in `.env` disappear. Both halves are quizzed.
- `.env` reserved values mapped to real types: `true`/`(true)`, `false`/`(false)`, `empty`/`(empty)`,
  `null`/`(null)`. Everything else is a string, which is why `config/app.php` casts with `(bool)`.
- `APP_ENV` (externally provided, or `--env`) selects `.env.[APP_ENV]` **if it exists**, otherwise
  `.env`.
- `env:encrypt` / `env:decrypt` use `LARAVEL_ENV_ENCRYPTION_KEY`; `--readable` keeps variable names
  visible so diffs are reviewable.
- Typed config accessors exist and throw on mismatch: `Config::string/integer/float/boolean/array/collection`.
  `php artisan about`, `about --only=`, and `config:show <file>` are the introspection commands.

### Skeleton defaults (from `laravel/laravel` 13.x `.env.example` and `config/*.php`)
- `CACHE_STORE=database` (**not** `file` — it changed in Laravel 11), `QUEUE_CONNECTION=database`,
  `SESSION_DRIVER=database`, `FILESYSTEM_DISK=local`, `DB_CONNECTION=sqlite`,
  `APP_MAINTENANCE_DRIVER=file`, `BCRYPT_ROUNDS=12`, `REDIS_CLIENT=phpredis`.
- `LOG_CHANNEL=stack`, `LOG_STACK=single`, `LOG_LEVEL=debug`, `LOG_DEPRECATIONS_CHANNEL=null`.
  Channel drivers: `single`, `daily`, `monthly`, `slack`, `syslog`, `errorlog`, `monolog`,
  `custom`, `stack`. A **`stderr`** channel is present in the skeleton (a `monolog` driver with
  `StreamHandler` on `php://stderr`), which is what the container advice points at. `daily`
  retention is `LOG_DAILY_DAYS`, default 14; `monthly` defaults to 3. Slack defaults to `critical`.
- Cache drivers in 13.x: `array`, `database`, `file`, `memcached`, `redis`, `dynamodb`, `storage`,
  `octane`, `session`, `failover`, `null`. Queue drivers: `sync`, `database`, `beanstalkd`, `sqs`,
  `redis`, `deferred`, `background`, `failover`, `null`.
- Filesystem disks: `local` rooted at **`storage/app/private`** (moved there in Laravel 11),
  `public` at `storage/app/public` with `url` built from `APP_URL.'/storage'`, and `links` mapping
  `public_path('storage') => storage_path('app/public')`.

### Queues across a deploy
- `queue:restart` "uses the cache to store restart signals"; workers poll the cache **each job
  iteration**. `Queue::withoutInterruptionPolling()` disables that poll — and with it
  `queue:restart` and `queue:pause`. Documented under "Worker Restart and Pause Signals".
- `queue:pause <connection>:<queue>` / `--all` and `queue:continue` exist; a paused queue lets the
  current job finish and then stops picking up new work.
- `--timeout` defaults to **60 s**; `retry_after` defaults to **90 s** in the skeleton's database,
  beanstalkd and redis connections. The docs state the `--timeout` value "should always be at least
  several seconds shorter than your `retry_after`… If your `--timeout` option is longer … your jobs
  may be processed twice." SQS uses its Default Visibility Timeout instead of `retry_after`.
- `--max-jobs`, `--max-time`, `--stop-when-empty`, `--once`, `--sleep`, `--force` all confirmed.
- The docs' Supervisor sample uses `numprocs=8`, `autostart/autorestart=true`, `stopasgroup=true`,
  `killasgroup=true`, `user=forge`, `redirect_stderr=true` and **`stopwaitsecs=3600`**.
- **Maintenance mode stops queue processing** ("no queued jobs will be handled") unless the worker
  ran with `--force`.
- A job implementing `Illuminate\Contracts\Queue\Interruptible` gets an `interrupted(int $signal)`
  callback when the worker receives SIGQUIT/SIGTERM/SIGINT. `#[FailOnTimeout]` is an attribute.
- Horizon's deploy command is `php artisan horizon:terminate`.

### Scheduler
- The documented cron line is `* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1`.
- `withoutOverlapping()` uses **cache locks**, default expiry 24 h, cleared by `schedule:clear-cache`.
- `onOneServer()` requires `database`, `memcached`, `dynamodb` or `redis` as the **default** cache
  driver and a central cache server shared by all servers.
- Tasks at the same minute run **sequentially in definition order** unless `runInBackground()`
  (only available for `command` and `exec`).
- Scheduled tasks do not run in maintenance mode unless `evenInMaintenanceMode()`.
- `schedule:pause` / `schedule:continue` (with `evenWhenPaused()`) and `schedule:interrupt` exist;
  `schedule:work` is the local foreground runner.
- Sub-minute tasks keep `schedule:run` alive until the end of the current minute.

### Migrations (Laravel 13 additions verified on the migrations docs page)
- `migrate --force` (non-interactive), `--isolated` (atomic cache lock; needs `memcached`, `redis`,
  `dynamodb`, `database`, `file` or `array` as the default store and a shared cache server;
  losers exit with a **success** status), `--pretend` (prints SQL).
- `shouldRun(): bool` on a migration skips it — the docs' example consults a Pennant feature flag.
- **MySQL:** `->instant()` (INSTANT algorithm; append-only, so it cannot be combined with `after()`
  or `first()`; MySQL errors if incompatible), `->inplace()` (INPLACE), `->lock('none'|'shared'|
  'exclusive'|'default')`. **PostgreSQL / SQL Server:** `->online()` on an index emits
  `CREATE INDEX CONCURRENTLY` / `WITH (online = on)`.
- `change()` writes the column's complete new definition: "any missing attribute will be dropped",
  and it does not touch indexes.

### Maintenance mode and deployment
- `down` options confirmed: `--refresh`, `--retry`, `--secret`, `--with-secret`, `--render`,
  `--redirect`. Maintenance mode throws a Symfony `HttpException` with status **503**.
- `APP_MAINTENANCE_DRIVER=cache` + `APP_MAINTENANCE_STORE=…` makes one `down` cover every server;
  the default file driver is per-server.
- `--render` exists because "a significant part of the Laravel framework must boot in order to
  determine your application is in maintenance mode and render the maintenance mode view".
- The deployment docs' nginx sample uses `root …/public`, `try_files $uri $uri/ /index.php?$query_string`,
  **`fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name`**, `fastcgi_hide_header X-Powered-By`
  and a deny rule for dotfiles excepting `/.well-known`. FrankenPHP (`frankenphp php-server -r public/`)
  is now documented alongside nginx.
- Laravel 13 requires **PHP >= 8.3** plus the listed extensions (ctype, curl, dom, fileinfo, filter,
  hash, mbstring, openssl, pcre, pdo, session, tokenizer, xml).
- **OPcache and symlinks:** the CLI SAPI has its own OPcache, so `php -r 'opcache_reset();'` cannot
  clear the FPM pool's shared memory — reload FPM or reset from inside a pool worker. Consistent
  with `php-web`'s `php-web-production-config`, which owns `opcache.validate_timestamps=0`.
  (PHP 8.4 also flipped `opcache.jit` to `disable` by default; that fact belongs to the plain-PHP
  topic and is not repeated here.)

### Deliberately avoided
- No patch-level version numbers anywhere (php.net's feed and php.watch disagree at any moment).
- No Vapor package-size figure or platform pricing — the topic says "a hard limit on deployment
  package size" and argues from engineering cost rather than quoting numbers that go stale.
- No claim about which Laravel version introduced `queue:pause`, `schedule:pause`, `instant()`,
  `online()` or `reload`; the topics state that current Laravel has them, which is what the reader
  needs and what stays true longest.
