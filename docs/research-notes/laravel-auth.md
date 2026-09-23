# Laravel Auth & Authorization research notes (2026-09-23)

Eighth camp of the v3 PHP & Laravel track. Scope: who the user is and what they may do. Everything
above it (routing, middleware mechanics, validation) is `laravel-foundations`; Eloquent is
`laravel-eloquent`; API response shaping is `laravel-apis`; queues are `laravel-queues-events`;
testing is `laravel-testing`. Plain-PHP `password_hash()`/`password_verify()` and the plain-PHP
CSRF token pattern stay in `php-web` — this camp's angles on them are the `Hash` facade with a
configured driver plus rehash-on-login, and `PreventRequestForgery`'s two-layer check.

13 topics, all **quiz** (143 questions). The sandbox is a V8 isolate and cannot grade PHP, so
difficulty is carried by predict-the-behaviour questions, "which of these actually stops the
attack" questions, and framework-default questions. Every topic has ≥2
`isEdgeCaseOrInterviewQuestion` and ≥1 multi-select.

## Scope judgements

The brief named 14 items; three merges and one split brought it to 13 topics:

- **Merged** "session authentication and the starter kits" into `lv-auth-session-login`, which
  became the full session story: `Auth::attempt` → `Auth::login` → logout → fixation → remember-me
  → `logoutOtherDevices`. Starter kits moved into `lv-auth-stack-choice`, where the real question
  ("which of these four packages do I install?") lives.
- **Merged** password reset and email verification into one topic. They are the same shape —
  prove control of an inbox — and teaching them together makes the *difference* legible: reset
  uses a hashed database token, verification uses a temporary signed URL with no token row at all.
- **Merged** login throttling, password confirmation and two-factor into `lv-auth-hardening`.
  All three answer "the password was right, now what?" and share the same Fortify/starter-kit
  surface.
- **Split** Sanctum into two topics (`lv-auth-sanctum-tokens`, `lv-auth-sanctum-spa`). The brief
  called the two-products-in-one-package point "a genuinely good topic", and SPA cookie mode is
  the module's expert milestone: it is where cookies, CORS, CSRF and session scope all collide.

Milestones: `lv-auth-session-login` (advanced), `lv-auth-policies` (advanced),
`lv-auth-sanctum-spa` (expert).

## Topics

1. `lv-auth-guards-providers` — Guards, Providers and `config/auth.php` (advanced)
2. `lv-auth-session-login` — Session Login: `Auth::attempt`, Logout and Session Fixation
   (advanced, **milestone**)
3. `lv-auth-hashing` — The `Hash` Facade, Drivers and Rehash-on-Login (advanced)
4. `lv-auth-password-reset` — Password Reset and Email Verification (advanced)
5. `lv-auth-stack-choice` — Choosing an Auth Stack: Starter Kits, Fortify, Sanctum and Passport
   (intermediate)
6. `lv-auth-sanctum-tokens` — Sanctum API Tokens and Abilities (advanced)
7. `lv-auth-sanctum-spa` — Sanctum's SPA Cookie Mode (expert, **milestone**)
8. `lv-auth-gates` — Authorization Gates (intermediate)
9. `lv-auth-policies` — Policies (advanced, **milestone**)
10. `lv-auth-enforcing` — Enforcing Authorization: `authorize()`, `can`, `@can` and `#[Authorize]`
    (advanced)
11. `lv-auth-roles-permissions` — Roles and Permissions (and Why Laravel Ships None) (advanced)
12. `lv-auth-csrf` — CSRF and `PreventRequestForgery` (advanced)
13. `lv-auth-hardening` — Login Throttling, Password Confirmation and Two-Factor (advanced)

## Videos

Every id came from `scripts/research/yt.mjs search` and was confirmed with `yt.mjs info <id>`
(`embeddable: true`; the exact title, channel and duration in the file are copied from that
output). No search-URL fallbacks. Chapter timestamps come from `info --chapters`.

- `lv-auth-guards-providers` → **`6tB-Eo6pPjw`** "Laravel 12 Multi Authentication with Guards"
  (Hardik Savani, 18:16, Aug 2025) from *Configuring auth guards* at **5:14**. The only recent,
  chaptered, English video that actually opens `config/auth.php` and adds a second guard/provider
  pair. Everything else on this query was either Hindi-language, sub-500 views, or a Breeze
  walkthrough that never shows the config.
- `lv-auth-session-login` → **`QtKZxNNPT_U`** "Build Laravel Login & Registration from Scratch"
  (Laravel official, 27:37, Apr 2025) from *Login* at **3:05**. Alternate **`M8Vfm7hxqXA`**
  (Laracasts, Ep 22) from *Session security* at **18:59**, which is the regenerate/invalidate half.
- `lv-auth-hashing` → **`M8Vfm7hxqXA`** (Laracasts, Ep 22) from *Password hashing* at **8:47**.
  Reused from the previous topic's alternate at a different timestamp; there is no dedicated
  Laravel-hashing video in English on a reputable channel (searches returned Bangla, Portuguese
  and sub-200-view results only), and the Laracasts chapter is the best treatment available.
- `lv-auth-password-reset` → **`izEIhUXhChU`** "Build Your Own Custom Auth System with Fortify"
  (Laravel official, 20:13) from *Email Verification* at **12:00**, which runs straight into
  *Password Reset* at 15:50 — one contiguous watch covering both halves of the topic.
- `lv-auth-stack-choice` → **`edcTejycirk`** "Laravel Passport vs Sanctum: What's the difference?"
  (Andrew Schmelyun, 8:27, 21k views). Three and a half years old, but the Passport/Sanctum
  distinction has not moved; the parts that *have* moved (starter kits replacing Breeze/Jetstream,
  MCP as a Passport case) are carried by the summary and quiz. Alternate **`YojldACcvVQ`**
  "Fortify - Frontend-agnostic authentication" (Laravel official, 4:52, Dec 2025) for the current
  Fortify framing.
- `lv-auth-sanctum-tokens` → **`iXrfSFEXd-M`** "Sanctum - API authentication simplified" (Laravel
  official, 5:30, Dec 2025). The most current Sanctum video anywhere, and it covers the table
  layout and abilities rather than just "how to install".
- `lv-auth-sanctum-spa` → **`ujDnuzi1t1s`** "Laravel Sanctum SPA Auth Overview" (cdruc, 13:33).
  A request-by-request walk through the cookie/CSRF handshake in DevTools — exactly the level the
  topic needs. Alternate **`2zKoS8GsKK8`** "Laravel SPA Authentication - setup and common mistakes"
  (cdruc, 16:55, 75k views) for the misconfiguration catalogue.
- `lv-auth-gates` → **`M1HMtm6hj5Q`** "30 Days to Learn Laravel, Ep 23 - 6 Steps to Authorization
  Mastery" (Laracasts, 22:54) from *Step 2 Gate* at **5:43**.
- `lv-auth-policies` → **`vSslBJH02Aw`** "Master Laravel Authorization — Gates & Policies Explained
  with Real World Example" (Programming Fields, 1:20:40, Nov 2025) from *Create Policy in Laravel*
  at **13:14**. Chosen over reusing Ep 23 a third time as a primary; low view count (2.4k) but
  current and correct. Alternate **`M1HMtm6hj5Q`** from *Step 6 Policies* at **18:31**.
- `lv-auth-enforcing` → **`Q3YQVEJIQbo`** "Laravel Policies: AuthorizeResource and `can:ABC` Usage"
  (Laravel Daily, 3:34). Short, but it is the only video found that is specifically about the
  *call sites* rather than about writing policies. Alternate **`M1HMtm6hj5Q`** from
  *Step 5 Middleware* at **12:01**.
- `lv-auth-roles-permissions` → **`frf55X2q9X0`** "spatie/laravel-permission: WHEN to Use the
  Package for Roles?" (Laravel Daily, 6:48, Jun 2025) — the "when *not* to reach for it" framing
  the topic is built around. Alternate **`DT6Zy1X3ytM`** "Authorization Explained: When to Use
  RBAC, ABAC, ACL & More" (Hayk Simonyan, 11:02, 71k views) for the model-agnostic vocabulary.
- `lv-auth-csrf` → **`B94PrMw4Eog`** "Laravel CSRF explained" (cdruc, 9:42) — builds a working
  attack page first, which is what makes the defence make sense. It predates `PreventRequestForgery`
  and so covers only the token layer; the origin-verification layer is carried by the summary and
  five of the quiz questions. **No video anywhere covers `PreventRequestForgery` or `Sec-Fetch-Site`
  in Laravel** — the search returns one 13-hour-old zero-view upload. Alternate **`KSowC1CsqmQ`**
  "NEW Laravel 13: Main Things You Need to Know" (Laravel Daily, 8:45, Mar 2026) for the release
  context.
- `lv-auth-hardening` → **`5YlJ8DllTFw`** "Exploring Laravel Rate Limiters" (Laravel official,
  6:42). Alternate **`4osPfTw-FB0`** "Two-Factor Authentication Now Available in Laravel Starter
  Kits" (Laravel official, 3:28, Oct 2025) for the 2FA half.

Searched and rejected: `eMlz_-2frt8` (Coding Pathshala, "Auth Guards in Laravel 13", 355 views);
`jG5TlWtnG3A`, `E3B0sCRCHOo`, `Tw1UTWrgJEs` (Hindi-language); `kZOgH3-0Bko` (Laravel Daily, "Roles
and Permissions: All CORE Things", 249k views but five years old and pre-dates the current starter
kits); `AFgl6yNobGY` ("Laravel 13 PHP Attributes Explained", 706 views — on-topic for
`#[Authorize]` but too thin to carry a topic); `DMNsW-3ekR0` (Laravel Podcast, "Sanctum & Passport
with Taylor Otwell" — good listening, four years old, and audio-only). No English video of any
quality exists for the Laravel password-reset *broker* specifically; the Fortify chapter is the
closest thing.

## References

All 36 URLs checked with `scripts/research/check-urls.mjs`: every one returns **200 with no
redirect**, and the stored URL is the final one.

- **The Laravel docs redirect.** `https://laravel.com/docs/13.x/<slug>` 302s to
  `https://laravel.com/framework/docs/13.x/<slug>`. Every `webRef` stores the `framework/` form,
  so nothing in this module redirects. Slugs verified for this camp: `authentication`,
  `authorization`, `sanctum`, `fortify`, `passwords`, `verification`, `hashing`, `starter-kits`,
  `csrf`, `session`, `routing`, `controllers`, `blade`, `urls`, `configuration`.
- **Anchors are dropped by the checker's `finalUrl`**, so refs point at the page rather than a
  `#section` fragment, and the label names the section instead (e.g. "Authentication — Manually
  Authenticating Users").
- **Iframe previews.** The OWASP cheat sheets (all eight used here), `top10.owasp.org` and
  `oauth.net` frame cleanly. Everything else falls back to a link card: `laravel.com` and
  `api.laravel.com` send `X-Frame-Options: SAMEORIGIN`, MDN sends `DENY`, `github.com` sends
  `CSP frame-ancestors 'none'`, and `spatie.be`, `portswigger.net` and `php.net` send SAMEORIGIN.
- `https://owasp.org/Top10/2025/…` redirects to `https://top10.owasp.org/2025/…`; the final form is
  stored. `https://owasp.org/www-project-top-ten/` redirects to `https://owasp.org/projects/top-ten`
  and is not used.
- `https://developer.mozilla.org/…/Set-Cookie/SameSite` is a **404**; the SameSite material lives on
  the `Set-Cookie` page itself.
- **spatie/laravel-permission is on v8** (`repo.packagist.org/p2/spatie/laravel-permission.json`,
  requires `illuminate/* ^12|^13`), so the docs ref is `/docs/laravel-permission/v8/introduction`,
  not the v6 URL most search results give.
- **No interview-prep repo.** Same conclusion as the other PHP camps: there is no Laravel
  equivalent of `lydiahallie/javascript-questions` worth shipping. The OWASP cheat sheets and
  PortSwigger's access-control material carry that weight.

## Facts verified

Checked against the live Laravel 13.x docs and the `laravel/framework` 13.x, `laravel/sanctum`
and `laravel/laravel` 13.x sources on 2026-09-23 — not from memory. Where a question depends on a
framework internal, the source file is named.

### Configuration defaults (`laravel/framework` `config/auth.php`, `config/hashing.php`)
- Default guard `web` (`driver: session`, `provider: users`); default provider `eloquent` with
  `App\Models\User`. **No `api` guard ships.** `laravel/laravel` 13.x requires only
  `laravel/framework` and `laravel/tinker` — Sanctum is *not* in the skeleton.
- `passwords.users`: table `password_reset_tokens`, **`expire` = 60 (minutes)**,
  **`throttle` = 60 (seconds)** — the units differ.
- `password_timeout` = **10800 seconds (3 hours)**.
- Hashing: `driver` bcrypt, `bcrypt.rounds` **12**, `bcrypt.verify` **true**, `bcrypt.limit`
  **null**, `argon.memory` 65536 / `time` 4 / `threads` 1, **`rehash_on_login` true**.
- `app/Providers/` in the skeleton contains **only `AppServiceProvider.php`** — there is no
  `AuthServiceProvider`, which is why the docs put `Gate::define()` in `AppServiceProvider::boot()`.

### Session guard (`Illuminate/Auth/SessionGuard.php`)
- `attempt()`, `attemptWhen()`, `validate()` and `once()` all run inside a `Timebox` with
  **`$timeboxDuration = 200000` microseconds (200 ms)** — constant-time failure, anti-enumeration.
- `attempt()` → `hasValidCredentials()` → `rehashPasswordIfRequired()` → `login()`.
- **`login()` calls `updateSession()`, which calls `$this->session->regenerate(true)`** — new
  session id, old session destroyed, CSRF token rotated. Session fixation is handled by the
  framework; the controller-level `$request->session()->regenerate()` in the docs is additional.
- `logout()` clears the guard's session keys and cycles the remember token **only**; it does not
  flush session data, migrate the id or rotate the CSRF token.
- `logoutOtherDevices($password)` verifies the password then force-rehashes it;
  `AuthenticateSession` stores a MAC of the password hash under `password_hash_<guard>` and logs
  out any session whose stored value no longer matches.

### Eloquent provider (`Illuminate/Auth/EloquentUserProvider.php`)
- **`retrieveByCredentials()` filters out every key where `str_contains($key, 'password')`** — so
  `password` *and* `password_confirmation` are excluded from the lookup query. Array values become
  `whereIn`, `Closure` values are invoked with the query builder.
- `validateCredentials()` reads `$credentials['password']` (exact key) and returns false if it or
  the stored hash is null.
- `rehashPasswordIfRequired()` uses `Hash::needsRehash()` and `forceFill(...)->save()`.

### Hashing (`Illuminate/Hashing/BcryptHasher.php`, `HasAttributes.php`)
- `BcryptHasher` hashes with **`PASSWORD_BCRYPT` explicitly**, not `PASSWORD_DEFAULT`.
- `check()` returns false for a null/empty stored hash, and **throws `RuntimeException` when
  `verifyAlgorithm` is on and the stored hash uses a different algorithm** (`HASH_VERIFY=false`
  disables it).
- The `limit` option throws `InvalidArgumentException` above N bytes; it is **null by default**, so
  bcrypt's 72-byte truncation applies silently unless you set `BCRYPT_LIMIT`.
- The `hashed` cast calls `Hash::isHashed($value)` first, so it does not double-hash an
  already-hashed value.

### Password reset / email verification
- `DatabaseTokenRepository::create()` calls `deleteExisting()` first, then stores
  **`$this->hasher->make($token)`** — the plaintext token is never persisted. Expiry is
  `created_at + expire`; `exists()` re-hashes and compares. `auth:clear-resets` prunes.
- `VerifyEmail::verificationUrl()` builds `URL::temporarySignedRoute('verification.verify', now()
  ->addMinutes(config('auth.verification.expire', 60)), ['id' => key, 'hash' => sha1(email)])`.
- `EmailVerificationRequest::authorize()` `hash_equals` the route `id` against
  **`$this->user()->getKey()`** and the route `hash` against `sha1($user->getEmailForVerification())`
  — hence the `auth` + `signed` middleware pair, and hence changing the email invalidates
  outstanding links.
- `Password` broker statuses: `ResetLinkSent`, `PasswordReset`, `InvalidUser`, `InvalidToken`,
  `ResetThrottled` (with the older SCREAMING_CASE constants kept as aliases). Rendering
  `InvalidUser` differently from `ResetLinkSent` is the enumeration leak.

### Sanctum (`laravel/sanctum` 4.3.3, which supports Laravel 11–13)
- **`SanctumServiceProvider::register()` writes `auth.guards.sanctum` into the config itself**, so
  `auth:sanctum` works as soon as the package is installed — `install:api` does not edit
  `config/auth.php`. `ApiInstallCommand` requires `laravel/sanctum:^4.0` and publishes the
  migration.
- Token format is **`"{id}|{40 random chars}{crc32b checksum}"`**; the stored column is
  **`hash('sha256', $plainText)`**. `findToken()` splits on `|`, does a primary-key `find()`, then
  `hash_equals()`.
- `createToken($name, $abilities = ['*'], $expiresAt = null)` — **the default is the wildcard**, and
  `PersonalAccessToken::can()` returns true when `*` is present.
- `auth:sanctum` **does not check abilities**. The `abilities` / `ability` middleware aliases are
  not registered by default; the docs tell you to add them in `bootstrap/app.php`.
- `Guard::__invoke()` tries `config('sanctum.guard')` (default `['web']`) **first**, then the
  bearer token. Session-authenticated users get a **`TransientToken`, whose `can()` always returns
  true** — that is why `tokenCan()` is true for first-party UI requests.
- `isValidAccessToken()` checks both `sanctum.expiration` (minutes from `created_at`, **`null` by
  default = never expires**) and the per-token `expires_at`. Expired rows persist until
  `sanctum:prune-expired`.
- `last_used_at` is written on **every** token-authenticated request unless `trackLastUsedAt` is off.
- `EnsureFrontendRequestsAreStateful::fromFrontend()` matches the **`Referer` or `Origin` header**
  (not the host, not the IP) against `sanctum.stateful`; with no such header the request is never
  stateful. When matched it pushes the request through EncryptCookies →
  AddQueuedCookiesToResponse → StartSession → the CSRF middleware → `sanctum.middleware
  .authenticate_session`, and forces `session.http_only = true`, `session.same_site = 'lax'`.

### Authorization (`Illuminate/Auth/Access/Gate.php`, `Middleware/Authorize.php`)
- `raw()` order: `callBeforeCallbacks()` → auth callback → `callAfterCallbacks()`. **`before`
  short-circuits on any non-null return**; `after` uses `$result ??= $afterResult`, so it can only
  decide a still-`null` check.
- `resolvePolicyCallback()` returns **`false` when the policy has no method for the ability**, and
  `callPolicyBefore()` is therefore never reached — matches the documented note.
- Guests: `canBeCalledWithUser()` returns false for a null user unless the closure/method parameter
  is nullable or has a null default.
- `Response::deny($message)`, `denyWithStatus($code)`, `denyAsNotFound()` (404); `Gate::inspect()`
  exposes the message, `Gate::allows()` flattens to a boolean.
- `allowIf()` / `denyIf()` — "Inline authorization does not execute any defined before or after
  authorization hooks."
- `can` middleware = `Illuminate\Auth\Middleware\Authorize`; a model argument containing `\` is
  treated as a class name, otherwise it is a **route parameter name** resolved with
  `$request->route($name)`.
- **`#[Authorize]` is `Illuminate\Routing\Attributes\Controllers\Authorize`** (new in Laravel 13):
  `#[Authorize('delete', 'comment')]` (route parameter) and
  `#[Authorize('create', [Comment::class, 'post'])]` (policy class + route parameter) — both forms
  are in the 13.x controllers docs verbatim.
- `authorizeResource()` maps `index`→`viewAny`, `show`→`view`, `create`/`store`→`create`,
  `edit`/`update`→`update`, `destroy`→`delete` (7 entries).
- `FormRequest::failedAuthorization()` throws `AuthorizationException`; the exception handler maps
  `AuthorizationException` without a status to **403**, `TokenMismatchException` to **419** and
  `OriginMismatchException` to **403**.
- Default middleware aliases: `auth`, `auth.basic`, `auth.session`, `cache.headers`, `can`,
  `guest`, `password.confirm`, `precognitive`, `signed`, `subscribed`, `throttle`, `verified`.

### CSRF (`Illuminate/Foundation/Http/Middleware/PreventRequestForgery.php`)
- **`PreventRequestForgery` is in the default `web` group, replacing `VerifyCsrfToken`.** Both old
  class names still exist in the tree, but the group and the docs use the new one. The default
  **`api` group is `SubstituteBindings` only — no throttle middleware.**
- `handle()` passes if any of: `isReading()` (HEAD/GET/OPTIONS) · running unit tests ·
  URI in the except array · **`hasValidOrigin()`** · `tokensMatch()`. Otherwise it throws
  `TokenMismatchException` → 419.
- `hasValidOrigin()` passes on **`Sec-Fetch-Site: same-origin`**, and on `same-site` only when
  `allowSameSite` is set. With `originOnly` it throws `OriginMismatchException` → **403**, and no
  `XSRF-TOKEN` cookie is written.
- `tokensMatch()` uses **`hash_equals()`**. Token sources: `_token` input, `X-CSRF-TOKEN` header, or
  the decrypted `X-XSRF-TOKEN` header. The cookie alone never counts.

### Rate limiting / password confirmation / 2FA
- `ThrottleRequests::resolveRequestSignature()` keys on the **authenticated user id** when present,
  otherwise **`route domain . '|' . ip`**.
- Headers: `X-RateLimit-Limit` and `X-RateLimit-Remaining` always; `Retry-After` and
  `X-RateLimit-Reset` on rejection. Status **429**.
- `Limit::perMinute(n)->by(...)->after(fn (Response $r) => $r->status() === 404)` — response-based
  limiting, documented on the routing page as an anti-enumeration tool.
- `RequirePassword` defaults to **10800 seconds** and returns **423 Locked** with
  `Password confirmation required.` for `expectsJson()` requests, otherwise redirects to the
  `password.confirm` named route.
- Fortify: `EnsureLoginIsNotThrottled` throttles by username+IP and is swapped out via
  `config('fortify.limiters.login')` + a `RateLimiter::for('login', ...)` definition. 2FA is TOTP
  with a `confirm` step (submit a valid code before 2FA is enabled) and a `confirmPassword` option
  (require password confirmation before enabling/disabling); the challenge endpoint accepts either
  `code` or `recovery_code`.
