# The Laravel Ecosystem research notes (2026-09-23)

Seventh camp of the PHP & Laravel track. 14 topics, all `quiz`, 151 questions.

**Scope decision.** The brief lists 16 things to cover and caps the camp at 14 topics, so two
merges were made rather than dropping anything:

- **Cashier + Socialite** became one topic (`lv-eco-cashier-socialite`). They share a shape —
  a third party owns state your app mirrors, the provider calls you back, and the package stops
  exactly where the interesting decisions start (account linking; plan-to-feature mapping). The
  judgement transfers, so teaching them together is stronger than two thin feature tours.
- **Pint + Sail** became one topic (`lv-eco-pint-sail`) as "the local toolchain": the two
  first-party tools that never reach production.
- The **Livewire vs Inertia vs separate SPA** decision was folded into the Inertia topic
  (`lv-eco-inertia`, milestone) rather than given its own, matching the brief's wording
  ("Inertia and when you'd pick it over Livewire or a separate SPA"). The Livewire topic carries
  the server-driven model and its security consequences; the Inertia topic carries the mechanism
  plus the three-way choice.
- The closing topic (`lv-eco-choosing`, milestone, expert) is about restraint — an adoption
  ordering, an "on-call test" and a "removal test" — not a recap.

Milestones: `lv-eco-inertia` (advanced), `lv-eco-octane` (expert), `lv-eco-choosing` (expert).

Nothing from the neighbouring camps was duplicated: queue mechanics stayed with
`laravel-queues-events` (Horizon here is "what Horizon is for"), auth internals with
`laravel-auth` (Fortify appears only as the thing starter kits sit on), broadcasting events are
framed from the Reverb/operations side, and deployment infrastructure was left to
`laravel-deploy` (only `octane:reload`, `horizon:terminate`, `pulse:restart`, `reverb:restart`
appear, and only as consequences of long-lived processes).

## Videos

Every id came from `yt.mjs search` and was confirmed with `yt.mjs info`; all report
`embeddable: true`. Durations below are `info`'s, not the search listing's.

- `lv-eco-starter-kits` — **SefjBZvKhTw** "Laravel Just Dropped Brand New Starter Kits"
  (Laracasts, 12:44, Feb 2025). Focused and from the launch. Alternate **AbPSAt46Ja0**
  "Laravel Starter Kits: What's New w/ Wendell Adriel" (Laravel, 1:08:01, Apr 2026) is the
  current, Laravel-13-era view for anyone who wants depth.
- `lv-eco-vite` — **nuWSYP-BOKI** "Bundling Assets with Laravel Vite" (Laracasts, 18:50).
  **Four years old**, and knowingly chosen: it is the only focused, authoritative treatment of
  the Laravel plugin, and the mechanics it teaches (`@vite`, the `hot` file, the manifest, HMR)
  have not changed. Everything newer in the search results was low-view, non-English, or a
  "fix this error" clip. Flagged here so it can be replaced when Laracasts refreshes it.
- `lv-eco-livewire` — **9Ya6MvJPQ54** "Livewire in 11 Minutes" (Laravel Daily, 11:08, Apr 2025);
  its chapter list includes a "Livewire mechanics analysis" segment, but the video starts at 0
  because the build-up is what makes that segment land. Alternate **M60-nxlrePc**
  "Livewire 4 Revealed | Caleb Porzio Laracon US 2025" (Laravel, 43:35) for the creator's own
  framing.
- `lv-eco-inertia` — **6ZmypXuwcLU** "Laravel Livewire vs. React/Svelte/Vue (Inertia)"
  (Josh Cirre, 12:44) — the comparison is the topic. Alternates: **OpXLWJd2iO0**
  "Inertia 2.0: It's like Next but better" (Theo, 19:01) for an outsider's read against Next.js,
  and **ibnzNYFDofM** "Livewire vs Vue vs React (showdown)" (Laravel Daily, 14:18) for the same
  project built three ways.
- `lv-eco-telescope` — **ribLN3pRyQc** "Telescope - Debug locally like a pro" (Laravel, 4:12,
  Dec 2025). Short but official and current; the reading and quiz carry the depth. Alternate
  **rrqNbzR_0pk** (Laravel Daily, 2:48) for the slow-query angle.
- `lv-eco-pulse` — **di9fYHxdZ-8** "Getting Started with Laravel Pulse" (Laravel, 19:09) — a
  proper card-by-card tour. Alternates **oFxcWcP6bVE** "Customizing Laravel Pulse"
  (Aaron Francis, 21:42) and **LNARw-SoTJs** "Laravel Nightwatch vs. Pulse" (Laravel, 2:19),
  which is the build-vs-buy framing in two minutes.
- `lv-eco-horizon` — **r3c_qBvAHXA** "Laravel Horizon: queue monitoring + configuration"
  (Aaron Francis, 14:53). Best single Horizon video found; its chapter list even ends with
  "When Not to Use Horizon", which is the right note for this camp.
- `lv-eco-octane` — **YGBvdAWt0W8** "Laravel Octane: supercharge your Laravel applications"
  (Aaron Francis, 8:33, 79k views) — opens with "How PHP Works", which is the right framing.
  Alternate **dOXXL-98Zbs** "Behind Laravel Octane" (Mateus Guimaraes, Laracon US 2024, 35:31)
  for the expert-level depth the milestone deserves.
- `lv-eco-scout` — **FY_x9_eX1AQ** "Lightning-Fast Laravel Search with Meilisearch"
  (Glenn Raya, 36:18). Alternate **2s5E7tj1YVc** "Scout - Full-text search for Laravel"
  (Laravel, 4:19) as the short official overview.
- `lv-eco-ai-sdk` — **pE2yA25grGo** "Laravel AI SDK Full Review: Agents, Images, Audio, Tools &
  More" (nunomaduro, 9:59, **Feb 2026**) — by a Laravel core member, weeks after the SDK shipped.
  Alternates **8MJ7r6niTus** "Building AI Applications with the Laravel AI SDK" (Laravel,
  2:05:19) and **9VAKbfh13u4** "Human Tool Approval With the Laravel AI SDK" (Laravel, 9:57,
  Aug 2026), which covers the `Approvable` contract the topic argues for.
- `lv-eco-reverb` — **ceOaI0O_LSA** "Build a Real-Time Web App with Laravel Reverb"
  (Laravel, 1:07:48), **chapter-split at 484 s "Integrating Laravel Reverb"** to skip the
  Livewire toggle-switch build-up. Alternate **jMcIE1hnaYw** (Glenn Raya, 24:26, 48k views).
- `lv-eco-cashier-socialite` — **9tCYrrDu04E** "Cashier - Subscription Billing for Laravel"
  (Laravel, 12:31, Dec 2025), with **JKOJpUi1gD0** "Socialite - Social logins in minutes"
  (Laravel, 4:51) as the alternate. The merged topic gets one official video per half.
- `lv-eco-pint-sail` — **5khyIHIYIK4** "New Laravel Pint: Code Styling Made Easier"
  (Laravel Daily, 7:58). **Also four years old** (Pint's launch), kept because Pint's surface has
  barely moved and nothing newer was both focused and well-viewed. Alternates are the two
  official ~1:45 shorts, **YMQEmBKwfhA** (Pint) and **Vq9ZeN4Yhi0** (Sail).
- `lv-eco-choosing` — **92Xn3NqPGlw** "Everything New with Laravel and Cloud | Taylor Otwell
  Keynote at Laracon US 2026" (Laravel, 1:17:04, **Aug 2026**) — the most current statement of
  what the ecosystem is. Alternate **ip4Spoz6s-Q** "Laravel Pulse, First Party Packages, & the
  Future of Laravel" (Laravel Podcast, 40:32), which is literally about why Laravel ships
  first-party packages.

**No search-URL fallbacks.** Two videos (Vite, Pint) are older than ideal and are flagged above.

Considered and rejected: `O-pqsfzgfIA` / `QyqrYdhSku0` (Laracasts Inertia course, 4 years old,
pre-Inertia-2); `V40uwtx_usM` (Laravel's 4:09 Pulse short — the 19-minute one is better for an
advanced topic); `4K4nkncZ2OQ` (Program With Gio's Sail tutorial, 5 years old); `I96tyvRdmbA`
(Inertia 2.0 in 3 minutes — superseded by Inertia 3).

## References

All URLs checked with `check-urls.mjs`; every one returns 200 at its **final** URL.

- **`laravel.com/docs/13.x/…` 302s to `laravel.com/framework/docs/13.x/…`** — the final URL is
  what is in `webRefs` throughout. Slugs verified for this camp: `starter-kits`, `fortify`,
  `vite`, `telescope`, `pulse`, `horizon`, `octane`, `container`, `scout`, `search`, `billing`,
  `cashier-paddle`, `socialite`, `reverb`, `broadcasting`, `pint`, `sail`, `queues`, `releases`,
  `deployment`, `ai`, `ai-sdk`.
- **The AI SDK is at `/13.x/ai-sdk`, not `/13.x/ai`.** `/13.x/ai` is a different page,
  "AI Assisted Development" (Laravel Boost, MCP, agent guidelines). Both are 200 and both are
  cited, but they are not interchangeable — worth knowing before guessing the slug.
- **`/13.x/echo` is a 404.** Echo is documented inside the broadcasting page.
- **`/13.x/nightwatch` is a 404.** Nightwatch is a product, not a docs page:
  `https://laravel.com/nightwatch` (200).
- **`/13.x/billing` is Cashier Stripe**; Cashier Paddle is `/13.x/cashier-paddle`.
- **Livewire docs redirect to `/docs/4.x/…`** — Livewire 4 is current, so the pinned `4.x` URLs
  are used directly.
- **Inertia docs moved to Mintlify and are versioned at v3**: `inertiajs.com/how-it-works`
  302s to `inertiajs.com/docs/v3/core-concepts/how-it-works`, and `/partial-reloads` lands under
  `/docs/v3/data-props/`. The bare `inertiajs.com/` root sends `X-Frame-Options: deny`.
- `https://developer.paddle.com/concepts/webhooks/overview` **404s** — Stripe's
  `docs.stripe.com/billing/subscriptions/webhooks` is used instead, with Cashier Paddle's own
  docs page covering the Paddle side.
- **Iframe previews:** `laravel.com`, `livewire.laravel.com`, `laravel-news.com`, `alpinejs.dev`
  and `docs.docker.com` all block framing (`X-Frame-Options`); `inertiajs.com`,
  `meilisearch.com/docs`, `docs.stripe.com`, `platform.claude.com` and all `github.com` pages
  block it via CSP `frame-ancestors`. Effectively the whole camp falls back to link previews.
  The three that *do* frame cleanly are `vite.dev/guide/`, `typesense.org/docs/` and
  `frankenphp.dev/docs/`.
- No interview-prep repo: there is no Laravel equivalent worth shipping (same finding as
  `php-foundations`). The edge-case questions carry that weight instead.

## Facts verified

Read off the Laravel 13 docs on 2026-09-23 rather than recalled. Version-dependent claims are
stated with their version in the prompt where they matter.

### Starter kits

- Four kits: **React, Svelte, Vue** (all Inertia) and **Livewire**. Svelte is not in the brief's
  list but is in the docs. React uses Inertia 3 + React 19 + Tailwind 4 + shadcn/ui; Svelte uses
  Inertia 3 + Svelte 5 + shadcn-svelte; Vue uses Inertia 3 + Composition API + shadcn-vue;
  Livewire uses **Flux UI**.
- **All four use Laravel Fortify for authentication.** 2FA is on by default via
  `Features::twoFactorAuthentication()` in `config/fortify.php`; login rate limiting is a
  `RateLimiter::for('login', ...)` in `FortifyServiceProvider`.
- **Email verification is off by default** — uncomment `MustVerifyEmail` on `App\Models\User`.
- Teams support scopes routes to `{current_team}` (e.g. `/{current_team}/dashboard`), registers
  URL defaults so `route('dashboard')` fills the slug in, verifies membership, gives each new
  user a personal team, and rejects reserved team names that would collide with route prefixes.
- **WorkOS AuthKit variant** of each kit: social auth (Google, Microsoft, GitHub, Apple),
  passkeys, "Magic Auth", SSO. Docs recommend disabling email + password *inside WorkOS* so the
  app never handles passwords. Needs `WORKOS_CLIENT_ID` / `WORKOS_API_KEY` /
  `WORKOS_REDIRECT_URL`.
- Created with `laravel new` (the installer prompts); community kits via `--using=vendor/kit`.
  Inertia SSR via `npm run build:ssr` / `composer dev:ssr`.
- **"How do I upgrade?" — you don't.** The docs say there is no need to update the starter kit
  itself; you own the code. **Breeze and Jetstream no longer appear in the docs' package list.**

### Vite

- `@vite` detects the dev server and injects the HMR client; in build mode it loads versioned
  assets from the manifest. `Vite::asset()` + the plugin's `assets` option is how Blade-only
  static files get processed — the `assets` option replaced the old `import.meta.glob` approach
  "due to changes in Vite 8" (plugin v3). `refresh: true` triggers full reloads on Blade changes.
  `Vite::prefetch(concurrency: 3)` in a provider's `boot`; `Vite::prefetch(event: 'vite:prefetch')`
  to control when. `composer run dev` is the bundled multi-process dev script.

### Livewire (4.x docs)

- Properties are **dehydrated to JSON and rehydrated** each request; class names and property
  names are **exposed to the browser**.
- **`#[Locked]`** prevents client-side modification. **An Eloquent model assigned to a property
  is locked automatically** (its ID cannot be changed), but a query constraint such as a `select`
  **is lost on hydration**.
- **`wire:model` is deferred by default** — no network request until an action runs.
  **`.live` debounces 150 ms** by default; `.debounce.Xms`, `.blur`, `.change`, `.enter`,
  `.renderless` (send without re-render; use with `.live`), `.lazy` (v3-compatible alias).
- `wire:key` gives DOM-diffing stable identity; nested components are independent islands.

### Inertia (v3 docs)

- "At its core, Inertia is essentially a client-side routing library." A `<Link>` click is
  intercepted, sent as XHR, and the server returns **JSON with the page component name and its
  props** instead of HTML; the client swaps the component and updates history.
- Features cited: partial reloads, deferred props, merging props, once props, prefetching,
  polling, infinite scroll, SSR, asset versioning, history encryption, CSRF.

### Telescope

- Watchers record queries (with bindings and a configurable `slow` threshold), jobs, mail,
  notifications, cache, HTTP client calls, exceptions, dumps, batches, scheduled tasks.
- **`telescope:prune` defaults to 24 hours**; `--hours=48` to extend. Without it
  `telescope_entries` "can accumulate records very quickly".
- Local-only install is `composer require laravel/telescope --dev`.
- The default generated `Telescope::filter` records everything in `local` and, elsewhere, only
  reportable exceptions, failed jobs, scheduled tasks, slow queries and monitored tags.
  `filterBatch` keeps or drops a whole request's entries together.
- **Docs warning:** "ensure you change your `APP_ENV` to `production`… Otherwise, your Telescope
  installation will be publicly available."

### Pulse

- Cards: application usage, queues, cache, slow queries, exceptions, slow requests, slow jobs,
  slow outgoing requests, servers.
- **`pulse:check`** daemon required for the servers card (and for Reverb's Pulse integration —
  run it on **one** node only when Reverb is horizontally scaled). **`pulse:restart`** belongs in
  the deploy script because `pulse:check` and `pulse:work` are long-lived.
- **Redis ingest**: `PULSE_INGEST_DRIVER=redis` + `pulse:work` to drain the stream; requires
  **Redis 6.2+** and phpredis or predis. Docs: "your Pulse installation should always use a
  different Redis connection than your Redis powered queue".
- Sampling is the documented answer for high-traffic apps (user requests, user jobs, slow jobs
  recorders). Pulse has **no alerting** — `laravel.com/nightwatch` is the hosted product.

### Horizon

- **Redis-only**, and **"not compatible with Redis Cluster at this time."** Reserves a Redis
  connection named `horizon`.
- Balancing strategies **`auto` (default), `simple`, `false`**. Under `auto`,
  `autoScalingStrategy` is **`time` | `size` | `log`** (`log` stops a huge queue taking a
  disproportionate share). **"Horizon does not enforce strict priority between queues. The order
  of queues in a supervisor's configuration does not affect how worker processes are assigned."**
  Real priority = multiple supervisors with their own budgets.
- `maxProcesses: 0` spawns no processes. `balanceMaxShift` / `balanceCooldown` bound scaling speed.
- **Timeout rule (verbatim risk):** with `auto` balancing Horizon force-kills "hanging" workers
  after the Horizon timeout during scale-down; the Horizon timeout must be **greater than any
  job-level timeout** and **at least a few seconds shorter than `retry_after`**, "otherwise your
  jobs may be processed twice".
- `horizon:terminate` for deploys; `horizon:snapshot` every five minutes for the metrics graphs,
  capped by `metrics.trim_snapshots`; `silenced_tags` / the `Silenced` contract for dashboard
  noise; `horizon:forget` for failed jobs.

### Octane

- Servers: **FrankenPHP, RoadRunner, Swoole and Open Swoole**. "Octane boots your application
  once, keeps it in memory, and then feeds it requests."
- **Providers' `register` and `boot` run once per worker boot.** Do not inject the **container**,
  the **request** or the **config repository** into constructors of objects bound as singletons —
  the docs spell out all three, and note that a captured request means "all headers, input, and
  query string data will be incorrect". `Container::getInstance()`, the `app()` helper and the
  `request()` helper always return the current instance; type-hinting `Illuminate\Http\Request`
  on a controller method is explicitly fine.
- **Static arrays leak** ("adding data to a statically maintained array will result in a memory
  leak") — the docs' own example is a controller appending to `Service::$data`.
- **Workers are gracefully restarted after 500 requests by default** (`--max-requests`).
  **One worker per CPU core** by default (`--workers`); `--task-workers` for Swoole.
  `octane:reload` after deployment.
- **`scoped()`** (from the container docs, not the Octane page): like `singleton`, but instances
  "will be flushed whenever the Laravel application starts a new 'lifecycle', such as when a
  Laravel Octane worker processes a new request or when a Laravel queue worker processes a new
  job". `scopedIf()` also exists. This is the mechanism the brief pointed at, and the quiz uses it.
- Octane "will automatically handle resetting any first-party framework state between requests"
  but "does not always know how to reset the global state created by your application".

### Scout

- Drivers: **database** (MySQL/PostgreSQL full-text + `LIKE`, no external service — "For most
  applications, this is all you need"), **collection** (prototypes/tests; loads candidates and
  filters in PHP with `Str::is`), **Algolia, Meilisearch, Typesense, Turbopuffer**, plus custom
  engines. Turbopuffer and vector search are newer additions.
- `Searchable` trait registers a model observer. `'queue' => true` is strongly recommended for
  third-party engines; **even with queueing off, "Algolia and Meilisearch always index records
  asynchronously"**, so a save is not immediately searchable.
- `MakeSearchableUniquely` / `RemoveFromSearchUniquely` use unique job locks to avoid duplicate
  indexing jobs in write-heavy apps.
- Scout's `where()` supports `=`, `!=`, `<`, `>`, `>=`, `<=` — engine-evaluable filters, **not**
  relationship constraints or arbitrary SQL.

### AI SDK (new in Laravel 13)

- `composer require laravel/ai`; publish config + migrations, which create
  `agent_conversations` and `agent_conversation_messages`.
- Providers configured in `config/ai.php`: Anthropic, Azure OpenAI, Cohere, DeepSeek, ElevenLabs,
  Gemini, Groq, Mistral, Ollama, OpenAI, OpenAI-compatible, OpenRouter, Jina, VoyageAI, xAI.
  Custom base URLs (LiteLLM / gateways) supported for OpenAI, Anthropic, Gemini, Groq, Cohere,
  DeepSeek, xAI, OpenRouter.
- **Agents are classes**, generated with `make:agent` (`--structured`), implementing
  `Agent` plus optional `Conversational`, `HasTools`, `HasStructuredOutput`, using the
  `Promptable` trait — `instructions()`, `messages()`, `tools()`, `schema(JsonSchema $schema)`.
  Prompted as `(new SalesCoach)->prompt(...)`. **Note:** the brief mentioned
  `SomeAgent::make()->prompt(...)`; the documented form is `(new Agent)->prompt(...)`, plus an
  `agent()` helper, so the content uses those. Nothing in the module asserts `::make()`.
- `->stream()` returns SSE straight from a route (with `->then()`), `->queue()` runs it in the
  background with `->then()`/`->catch()`. Vercel AI SDK stream protocol supported via
  `usingVercelDataProtocol()`.
- Tools: `make:tool`, generated into `app/Ai/Tools`, with `description()`, `handle(Request)` and
  `schema()`. **Human approval** via the `Approvable` contract + `InteractsWithApprovals` trait;
  "Approvable tools require approval by default". Sub-agents are agents returned from `tools()`.
- Embeddings: `Str::of('…')->toEmbeddings()` and `Embeddings::for([...])->generate()`, with
  `->dimensions()` and multimodal inputs (`Image`, `Audio`, `Video`, `Document`).
- **Failover** takes an array of providers/models and **"only occurs when a `FailoverableException`
  is thrown — such as a rate limit (`RateLimitedException`), an overloaded or unavailable provider
  (`ProviderOverloadedException`), or insufficient credits (`InsufficientCreditsException`).
  Ordinary errors, like a validation or bad request error, will not trigger failover."**
- Testing helpers exist for agents, images, audio, transcriptions, embeddings, reranking, files
  and vector stores. No model names are hard-coded anywhere in the quizzes.

### Reverb & broadcasting

- `install:broadcasting` → `reverb:install`; `reverb:start`, `reverb:restart` (graceful).
  **Reverb uses the Pusher protocol** — Echo needs `pusher-js`, and the starter kits expose a
  `useEcho` hook for React/Vue/Svelte.
- **"All event broadcasting is done via queued jobs"** — a queue worker is required.
  `ShouldBroadcastNow` uses the sync queue instead.
- `broadcastOn()` returns `Channel`, `PrivateChannel` or `PresenceChannel`; private and presence
  channels are authorised by callbacks in `routes/channels.php`. `allowed_origins` in
  `config/reverb.php` rejects handshakes from other origins (one Reverb install can serve
  multiple `apps`).
- **Scaling:** `REVERB_SCALING_ENABLED=true` + a shared central Redis; Reverb publishes incoming
  messages to the other nodes via Redis pub/sub, behind a load balancer.
- **Open-file limits:** "each connection is represented by a file… there are often limits on the
  number of allowed open files" — `ulimit` is the documented thing to raise.

### Cashier & Socialite

- **Two separate packages**: Cashier Stripe (`/13.x/billing`) and Cashier Paddle
  (`/13.x/cashier-paddle`), with different APIs. `Billable` trait on the billable model;
  the `stripe_id` column should be case-sensitive (`utf8_bin`) on MySQL.
- `cashier:webhook` creates the Stripe webhook covering the events Cashier needs;
  `STRIPE_WEBHOOK_SECRET` verifies signatures; there is a documented "Webhooks and CSRF
  Protection" section. Stripe Tax via `calculateTaxes()` in `AppServiceProvider::boot`.
- **Paddle is a merchant of record** — not stated in the Laravel docs, so verified directly on
  `paddle.com`, whose own homepage describes "the only complete Merchant of Record solution".
- Socialite: credentials in **`config/services.php`** under `facebook`, `x`, `linkedin-openid`,
  `google`, `github`, `gitlab`, `bitbucket`, `slack`, `slack-openid`; two routes
  (`->redirect()` and `->user()`); other providers via the community Socialite Providers site.
  Socialite is an OAuth **client**; Passport is the OAuth **server**.

### Pint & Sail

- Pint is **"built on top of PHP CS Fixer"**, ships with new Laravel apps, needs no config.
  Presets: **`laravel`, `per`, `psr12`, `symfony`, `empty`**. Flags used in the quiz: `--test`
  (inspect only, non-zero exit), `--dirty`, `--diff=main`, `--repair` (fix *and* exit non-zero),
  `--parallel` / `--max-processes`, `--config`, and **`--blade`** — Blade formatting is off by
  default.
- Sail: **"a light-weight command-line interface for interacting with Laravel's default Docker
  development environment"**; at its heart `compose.yaml` + the `sail` script. Supported on
  **macOS, Linux and Windows via WSL2**. `sail:install` publishes the compose file, `sail:add`
  adds services, `laravel.test` is the app container; MySQL, Redis, Meilisearch, Typesense,
  Selenium and RustFS (S3-compatible) are among the available services. Nothing in the docs
  positions Sail as a production artefact.

## Assessment shape

All 14 topics are **quiz**; the sandbox is a V8 isolate and cannot grade PHP (same decision as
the rest of the PHP track, logged under `## v3 decisions` in `docs/PROGRESS.md`). 151 questions,
every topic with ≥2 `isEdgeCaseOrInterviewQuestion` and ≥1 multi-select. Because this camp is
about judgement rather than API surface, most questions are scenarios — "the deploy shipped a
`hot` file", "the cancellation webhook never arrived", "the singleton captured the request" —
rather than recall, and several deliberately have a plausible, popular wrong answer
(auto-linking a social login by email; Telescope as production monitoring; `auto` balancing as
queue priority).

`npm run content:check -- --module laravel-ecosystem`: **0 errors, 0 warnings.**
`npm run content:types`: clean.
