# Laravel APIs research notes (2026-09-23)

Fourth Laravel camp of the v3 PHP track. Scope decision: everything here is "how Laravel ships an
HTTP API", not "what REST is" — the Backend track's `be-api-design` camp already covers resource
design, pagination theory, idempotency, OpenAPI-as-a-concept, webhooks-as-a-pattern and REST vs
GraphQL, so this camp deliberately stays inside the framework. Where the two touch (pagination
cost, versioning tradeoffs, webhook delivery semantics) the questions here are about Laravel's
implementation and its defaults, not the generic theory.

Boundaries with the sibling Laravel camps: routing/middleware mechanics belong to
`laravel-foundations`, Eloquent to `laravel-eloquent`, Sanctum/Passport and authorization to
`laravel-auth`, queues to `laravel-queues-events`, tests to `laravel-testing`. Sanctum is mentioned
in three places (what `install:api` pulls in, `statefulApi()`, and "send a token instead") but never
taught. `Http::fake()` is covered here because it is part of the HTTP client's own documentation and
is inseparable from using the client responsibly; assertion style and test structure are left to
`laravel-testing`.

13 topics, all `quiz`, 132 questions. Three milestones: `lv-api-jsonapi`, `lv-api-exceptions`,
`lv-api-webhooks-signed-urls`.

## Videos

Every id below was found with `scripts/research/yt.mjs search` and confirmed with
`yt.mjs info <id> --chapters` (title, channel, duration, `embeddable: true`). No search-URL
fallbacks.

**Spine: `_iuxZygxz98`** — "Laravel API for Beginners - A Complete Guide" (**The Codeholic**,
4:55:53, Nov 2025, 68k views). Recorded on Laravel 12, so it shows `bootstrap/app.php` rather than
an HTTP kernel — which is why it was preferred over several older, better-known Laravel API
courses. Its chapter list maps almost one-to-one onto this camp. Markers read off the watch page:
0 Intro, 148 Sponsor, 293 RESTful Design principles, 1264 Setup, **1669 Install Laravel API &
Create Basic Route**, 2089 Artisan, 2363 Tinker, 2646 Postman, 3193 Routes and Controllers,
**3734 API Versioning**, 4039 JSON Request & Response, **4685 Basics of Validation & Status
Codes**, 4981 Models & Migrations/CRUD, **6221 Form Request classes**, 6689 API Resources,
7718 Breeze, 8535 Register/Login/Protected Routes, 10433 Rate Limiting, 10732 Real World API
Project, 12936 Generate API Documentation, **13545 Pagination, Filtering & Sorting**,
**14554 What is CORS**, 15501 Testing, 16646 Deployment, 17726 Conclusion.
Used as the primary video for five topics at different `startSeconds` (install, versioning,
validation, pagination, CORS) and as an alternate for three more (resources 6689, rate limiting
10433, validation 4685). Heavy reuse of one course, but §3.3 explicitly endorses chapter-splitting
and this is the only current, chaptered, free, end-to-end Laravel API course found. The remaining
eight topics use dedicated videos.

Dedicated primaries:

- `lv-api-resources` → **`AY5VkcPbR94`** "Laravel Advanced - Eloquent Api Resource - Complete
  Explanation" (Laratips, 37:09, 25k). Oldest video used here (2022), chosen because the resource
  API has not changed and nothing newer covers collections, wrapping and `additional()` at this
  depth. Codeholic @6689 and `CdwK41cRCTw` (Laravel Daily, re-use vs new resource) as alternates.
- `lv-api-conditional-attributes` → **`Ls7m14eCaSU`** "Laravel API Resources: whenLoaded() To Avoid
  N+1 Queries" (Laravel Daily, 4:38, 13k). Short, but it is precisely the topic's thesis.
- `lv-api-jsonapi` → **`UnvBFcO3Vww`** "What's New in Laravel 13" (**official Laravel channel**,
  23:28, 22k, Mar 2026) at **655s "First-party JSON API support"**. Other chapters, noted for other
  camps: 83 vector search, 563 PHP attributes for classes, 813 AI SDK and agent tools, 1164
  upgrading with Laravel Boost. Alternates `e75PDM-gDSA` (Laravel Daily, the feature when it landed
  in 12.45) and `vrAdzOPSFiE`.
- `lv-api-exceptions` → **`oFzfX2c-IIg`** "Laravel API: Consistent 422 Response from Exceptions?"
  (Laravel Daily, 4:34, Jun 2025). Chosen over `itjTPLojmvA` ("WAY BETTER Exception handling in 10
  minutes", 8k views) because that one predates `bootstrap/app.php` and demonstrates
  `app/Exceptions/Handler.php`, which this camp explicitly teaches no longer exists. Alternates
  `eTOScyTCkiY` (design principle: stop try/catching everywhere — evergreen) and `Tdh4oCe0rlc`
  (override model-not-found for APIs). **Weakest video match in the camp**: no current, full-length
  treatment of `withExceptions()` exists on YouTube that I could verify, so the topic's depth is
  carried by the summary and the 11 questions, all written straight off the 13.x `errors` page.
- `lv-api-rate-limiting` → **`5YlJ8DllTFw`** "Exploring Laravel Rate Limiters" (**official Laravel
  channel**, 6:42). Predates the Laravel 13 `after()` response-based limiter, which the summary and
  quiz cover instead.
- `lv-api-http-client` → **`yxcNpZ9zAvs`** "Top 5 Mistakes with 3rd-Party API Errors in HTTP Client"
  (Laravel Daily, 12:47, Jul 2025). Picked over the much-watched `oEDDZsmMLc0` (58k, 2021) because
  the failure-mode framing is exactly the topic's point; that one is the alternate.
- `lv-api-docs` → **`vrAdzOPSFiE`** "Laravel 13 Demo: JSON:API + Spatie Query Builder + Scramble API
  Docs" (Laravel Daily, 13:48, Mar 2026). Alternates `a3nQrBEtufw` (Scribe) and `p1QAJFXsz8E`
  (Scribe vs Scramble vs Swagger).
- `lv-api-webhooks-signed-urls` → **`N40i3ljGNSI`** "Ep44 - Create Links that will Expire in
  Laravel?! - Signed Route" (Acadea.io, 12:06). Alternates `_kkM802vgbI` (Laratips, URL generation
  + signed URLs, 23:28) and `waojlxMBZ3U` (Laravel Daily, Stripe webhooks end-to-end, 14:03 — 2020,
  used only as an alternate for the inbound-webhook half).

Searched and rejected: every "Laravel exception handling" result from 2023 or earlier (Kernel-era);
`ZLIA7oqqOqw` (Programming Fields, JSON:API, 304 views); `WWnR4xptSRk` (Piyush Garg, CORS, 161k) as
a *primary* for CORS because the camp needs the Laravel configuration, not the protocol — kept as
an alternate; `x_jjhcDrISk` / `oQaJn6RdA3g` (ByteByteGo / ByteMonk webhooks) because `be-api-design`
already uses the former and neither is Laravel-specific.

## References

- All Laravel doc links use the **final** URL: `https://laravel.com/docs/13.x/…` 302s to
  `https://laravel.com/framework/docs/13.x/…`. Slugs verified 200 with `check-urls.mjs`:
  `routing`, `controllers`, `sanctum`, `eloquent-resources`, `eloquent-serialization`,
  `eloquent-relationships`, `responses`, `requests`, `errors`, `validation`, `pagination`,
  `rate-limiting`, `http-client`, `mocking`, `urls`, `csrf`, `middleware`, `releases`, `upgrade`,
  `http-tests`, `precognition`.
- Third-party, all 200: `jsonapi.org/format/`, `spec.openapis.org/oas/v3.2.0.html`,
  `scribe.knuckles.wtf/laravel`, `scramble.dedoc.co/`, `github.com/knuckleswtf/scribe`,
  `github.com/spatie/laravel-query-builder`, `github.com/spatie/laravel-webhook-client`,
  `github.com/fruitcake/php-cors`, `rfc-editor.org/rfc/rfc9457.html`, `docs.stripe.com/webhooks`,
  `stripe.com/blog/api-versioning`, `apisyouwonthate.com/blog/api-versioning-has-no-right-way/`,
  `brandur.org/webhooks`, `blog.cloudflare.com/counting-things-a-lot-of-different-things/`,
  `use-the-index-luke.com/no-offset`, `laravel-news.com/laravel-13`,
  `laravel-news.com/laravel-http-client`,
  `datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers`,
  MDN `…/Status/422` and `…/Guides/CORS`.
- **404s found and avoided** (guessed laravel-news slugs — none of these exist):
  `/laravel-api-versioning`, `/laravel-api-resources`, `/api-resources`,
  `/laravel-eloquent-api-resources`, `/json-api-resources-laravel`, `/laravel-rate-limiting`,
  `/laravel-signed-routes`, `/laravel-cors`. Only the two laravel-news URLs that returned 200 are
  used.
- Notable redirect: `rfc-editor.org/rfc/rfc6585` lands on `/info/rfc6585/`; not used in the end.
- **Iframe previews:** `laravel.com` sends `X-Frame-Options: SAMEORIGIN`, so *every* official
  Laravel doc reference in this camp falls back to a link-preview card. Also blocked: MDN
  (`X-Frame-Options: DENY`), GitHub (`CSP frame-ancestors 'none'`), `laravel-news.com`,
  `scramble.dedoc.co`, `stripe.com`, `docs.stripe.com`, `use-the-index-luke.com`,
  `datatracker.ietf.org`. Framing **is** allowed by `jsonapi.org`, `spec.openapis.org`,
  `scribe.knuckles.wtf`, `swagger.io`, `rfc-editor.org`, `brandur.org`, `blog.cloudflare.com` and
  `apisyouwonthate.com`.

## Facts verified

Read off the live Laravel 13.x docs and the `laravel/framework` 13.x source on 2026-09-23, not from
memory. Where a fact comes from source rather than prose, the file is named.

- **`install:api`** (`Illuminate/Foundation/Console/ApiInstallCommand.php`): requires
  `laravel/sanctum:^4.0` via Composer, publishes the `personal_access_tokens` migration and prompts
  to run migrations, copies `stubs/api-routes.stub` to `routes/api.php`, then rewrites
  `bootstrap/app.php` — uncommenting `// api: ` if present, otherwise inserting
  `api: __DIR__.'/../routes/api.php',` after the `web:` line. It prints a reminder to add
  `HasApiTokens` to the `User` model but **does not add it**. Flags: `--force`, `--passport`,
  `--composer=`, `--without-migration-prompt`.
- **The generated `routes/api.php`** (`stubs/api-routes.stub`) is exactly one route:
  `Route::get('/user', fn (Request $request) => $request->user())->middleware('auth:sanctum');`
- **Default middleware groups** (`Illuminate/Foundation/Configuration/Middleware.php`,
  `getMiddlewareGroups()`): `web` = EncryptCookies, AddQueuedCookiesToResponse, StartSession,
  ShareErrorsFromSession, **PreventRequestForgery**, SubstituteBindings (+ `auth.session` if
  `authenticatedSessions()`); `api` = **SubstituteBindings only**, with Sanctum's
  `EnsureFrontendRequestsAreStateful` prepended by `statefulApi()` and `throttle:<limiter>` prepended
  by `throttleApi()`. There is no throttling on API routes out of the box.
- `apiPrefix:` on `->withRouting()` changes the automatic `/api` prefix. `then:` is the hook for
  extra route files.
- **`apiResource`** = `resource` minus `create` and `edit`; `make:controller --api` matches.
- **API Resources:** outermost response wrapped in `data`; `JsonResource::withoutWrapping()` is
  global state set from a provider and affects only the outermost layer; **paginated resource
  collections keep `data` regardless**, because `links` and `meta` are siblings; Laravel never
  double-wraps. `additional()` adds top-level keys; `paginationInformation($request, $paginated,
  $default)` customises the pagination envelope; `toResource()` / `toResourceCollection()` resolve
  the resource class by convention.
- **Conditional helpers:** `when`, `whenHas`, `whenNotNull`, `mergeWhen` (documented restriction:
  not inside arrays mixing string keys with non-sequential numeric keys), `whenLoaded`,
  `whenCounted`, `whenAggregated($relation, $column, 'avg|sum|min|max')`, `whenPivotLoaded`,
  `whenPivotLoadedAs`. `whenLoaded` takes the **relationship name**, not the relation — passing
  `$this->posts` evaluates first and reintroduces the N+1.
- **JSON:API (Laravel 13):** `php artisan make:resource X --json-api` generates a class extending
  `Illuminate\Http\Resources\JsonApi\JsonApiResource` with `$attributes` and `$relationships`.
  The base class handles resource-object structure, relationship inclusion, sparse fieldsets, lazy
  attribute evaluation and sets **`Content-Type: application/vnd.api+json`**. Type is derived from
  the class name (`PostResource` → `posts`, `BlogPostResource` → `blog-posts`), id from the primary
  key; override with `toType()` / `toId()`. Relationships serialise **only** when requested via
  `?include=`, dot notation for nesting, bounded by `JsonApiResource::maxRelationshipDepth()`.
  Sparse fieldsets use `?fields[posts]=title,created_at`. Escape hatches:
  `ignoreFieldsAndIncludesInQueryString()` and `includePreviouslyLoadedRelationships()`.
  `toLinks()` / `toMeta()` decorate the resource object. Laravel serialises JSON:API; it does not
  parse `filter`/`sort` — the docs point at Spatie's Laravel Query Builder for that.
- **Pagination:** `paginate()` → `LengthAwarePaginator` (extra `COUNT(*)`, `total`/`last_page`);
  `simplePaginate()` → `Paginator` (no count); `cursorPaginate()` → `CursorPaginator` (keyset
  `where`, needs an `order by` on unique non-null columns of the paginated table, no page numbers,
  no query expressions with parameters). A **raw paginator** serialises flat: `total`, `per_page`,
  `current_page`, `last_page`, `current_page_url`, `first_page_url`, `last_page_url`,
  `next_page_url`, `prev_page_url`, `path`, `from`, `to`, `data`. A **resource collection** wrapping
  a paginator produces `data` + `links` (first/last/prev/next) + `meta` (the counters). Different
  shapes — a real breaking change when refactoring. `withQueryString()` re-appends filters to
  generated links.
- **Validation:** `ValidationException` has `public $status = 422`. JSON shape is
  `{"message": "<first error> (and N more errors)", "errors": {"field": ["…"]}}`, with nested keys
  flattened to dot notation (`users.2.email`, `authorization.role`). Non-JSON requests get a redirect
  with a flashed error bag instead. **`php artisan make:request` generates
  `authorize(): bool { return false; }`** (checked against `stubs/request.stub` on 13.x) — a fresh
  form request 403s everything until edited. `failedAuthorization()` throws `AuthorizationException`
  → 403, which is deliberately not 422.
- **`expectsJson()`** matches `/json` *and* `+json` in the first acceptable type, which is why a
  custom `application/vnd.acme.v2+json` media type still renders JSON errors.
- **Error handling:** no `app/Exceptions/Handler.php`; `->withExceptions(fn (Exceptions $e) => …)`
  offers `report()` (+ `->stop()` / `return false`), `context()`, `level()`, `dontReport()`,
  the `Illuminate\Contracts\Debug\ShouldntReport` marker interface, `dontReportWhen()`,
  `dontReportDuplicates()`, `stopIgnoring()`, `render()` (returning nothing falls through to the
  default), `shouldRenderJsonWhen()`, `respond()` and `throttle()` (returns a `Limit` or a
  `Lottery`). Laravel ignores 404s, origin-mismatch 403s and CSRF 419s by default. Exceptions may
  also define their own `report()` / `render()`. Fallback error pages: `4xx.blade.php` /
  `5xx.blade.php`, which do not apply to the statuses with dedicated internal pages.
- **Rate limiting:** limiters are registered in **`AppServiceProvider::boot()`** in current docs
  (not `RouteServiceProvider`, which no longer exists). `Limit::perMinute/perHour/perDay/none`,
  `->by()`, `->response(fn (Request $r, array $headers) => …)`, arrays of limits (docs warn to
  prefix identical `by()` values so counters do not collide), and **Laravel 13's `->after(fn
  (Response $r) => bool)`** for response-based counting (the documented example is limiting
  consecutive 404s to stop enumeration). Applied with `throttle:<name>`; `$middleware->throttleApi()`
  and `$middleware->throttleWithRedis()` in `bootstrap/app.php`. Headers, from
  `Routing/Middleware/ThrottleRequests.php`: `X-RateLimit-Limit` and `X-RateLimit-Remaining` on
  every response, plus `Retry-After` and `X-RateLimit-Reset` on the 429; the exception is
  `ThrottleRequestsException('Too Many Attempts.')`. The cache-level facade offers `attempt()`,
  `tooManyAttempts()`, `increment(..., amount:)`, `remaining()`, `availableIn()`, `clear()`; the
  docs recommend checking `increment()`'s return value under concurrency because it is **atomic on
  the redis, memcached and database stores**, unlike check-then-increment. `cache.limiter` selects
  the store.
- **HTTP client:** `guzzlehttp/guzzle` is in `laravel/framework`'s `require` block on 13.x, not a
  suggestion. Defaults: `timeout` **30 s**, `connectTimeout` **10 s**, both raising
  `ConnectionException`. The client **does not throw on 4xx/5xx**; `throw()`, `throwIf()`,
  `throwIfStatus()`, `throwIfClientError()`, `throwIfServerError()` and `onError()` opt in.
  `retry($times, $sleepMs|closure|array, $when, throw: false)` — and a `ConnectionException` is
  still thrown when every attempt fails to connect, even with `throw: false`. `Http::pool(fn (Pool
  $pool) => [...], concurrency: 5)`, indexed positionally or via `as()`; **a pooled request that
  fails at the connection level puts a `ConnectionException` instance in the results array rather
  than throwing**. Testing: `Http::fake()` (empty 200s), `Http::fake([pattern => response])`,
  `Http::sequence()` / `Http::fakeSequence()` with `push`, `pushStatus`, `whenEmpty` (a consumed
  sequence throws), `Http::preventStrayRequests()`, `assertSent`, `assertSentCount`,
  `assertNothingSent`, `recorded()`. `Http::macro()` for named pre-configured clients.
- **CORS:** `Illuminate\Http\Middleware\HandleCors` is in the **global** middleware stack and
  answers `OPTIONS` preflights automatically. `config/cors.php` is not in a fresh app; publish with
  `php artisan config:publish cors`. Framework stub defaults (read from
  `laravel/framework/13.x/config/cors.php`): `paths => ['api/*', 'sanctum/csrf-cookie']`,
  `allowed_methods => ['*']`, `allowed_origins => ['*']`, `allowed_origins_patterns => []`,
  `allowed_headers => ['*']`, `exposed_headers => []`, `max_age => 0`,
  `supports_credentials => false`. Implementation is `fruitcake/php-cors` (a framework `require`).
- **Signed URLs:** `URL::signedRoute($name, $params, absolute: false)`,
  `URL::temporarySignedRoute($name, now()->plus(minutes: 30), $params)`,
  `$request->hasValidSignature()`, `hasValidSignatureWhileIgnoring([...])`, the `signed` /
  `signed:relative` middleware (`Illuminate\Routing\Middleware\ValidateSignature`).
  `InvalidSignatureException extends HttpException` with **403 "Invalid signature."** (checked in
  source; the docs' own example uses `abort(401)` from a manual check, which is the author's choice,
  not the framework's). The signature is an HMAC keyed by `APP_KEY`, so key rotation invalidates
  every outstanding link.
- **CSRF:** `PreventRequestForgery` replaced `VerifyCsrfToken` and is in the `web` group only;
  exclusions go through `$middleware->preventRequestForgery(except: [...])`. This is why inbound
  webhook routes belong in `routes/api.php`.
- Facts asserted in quizzes that come from outside Laravel and were checked independently:
  OpenAPI **3.2** is current (spec.openapis.org); RFC **9457** Problem Details (obsoletes 7807);
  the Fetch standard forbids `Access-Control-Allow-Origin: *` with credentials; `hash_equals()` is
  PHP's constant-time comparison; `Deprecation` / `Sunset` are the standard deprecation headers.

## Assessment shape

All 13 topics are **quiz** — the sandbox runs JavaScript in a V8 isolate and cannot grade PHP, per
the decision logged for `php-foundations`. Difficulty is carried by predict-the-response questions
(what does this resource actually emit, what status does this exception produce, what is in the
pool results array) and by configuration questions with a genuinely surprising answer (the `api`
group has no throttling; `make:request` denies by default; a raw paginator and a resource
collection serialise differently; a pooled connection failure is returned, not thrown). Every topic
has at least two `isEdgeCaseOrInterviewQuestion` and at least one multi-select; the camp totals 132
questions across 13 topics.
