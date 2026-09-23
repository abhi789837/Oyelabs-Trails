import type { Module } from "@/types/curriculum";

export default {
  id: "laravel-auth",
  trackId: "php",
  name: "Laravel Auth & Authorization",
  description:
    "Who the user is, and what they are allowed to do. Guards and providers, session login, hashing, password reset, Sanctum's two very different products, gates and policies, and the hardening — CSRF, throttling, password confirmation, 2FA — that separates a login form from a login system.",
  refs: [
    { label: "Laravel 13: Authentication", url: "https://laravel.com/framework/docs/13.x/authentication", kind: "docs" },
    { label: "Laravel 13: Authorization", url: "https://laravel.com/framework/docs/13.x/authorization", kind: "docs" },
    { label: "OWASP: Authentication Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", kind: "article" },
    { label: "OWASP Top 10:2025 — A01 Broken Access Control", url: "https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/", kind: "article" },
  ],
  topics: [
    {
      id: "lv-auth-guards-providers",
      moduleId: "laravel-auth",
      trackId: "php",
      title: "Guards, Providers and config/auth.php",
      summary:
        "Laravel's auth system is two pluggable halves. A guard answers \"how is the caller identified on this request?\" — the `session` guard reads a user id out of the session, Sanctum's guard reads a bearer token, a custom guard could read anything. A provider answers \"given some credentials or an id, where do I fetch the user from?\" — `eloquent` (a model) or `database` (the query builder). Every guard names a provider, which is why `auth:admin` can authenticate a completely different model from `auth:web` with no other code changes.\n\nThe default `config/auth.php` ships one guard, `web` (driver `session`, provider `users`), and one provider pointing at `App\\Models\\User`. There is no `api` guard until you add one; `php artisan install:api` is what adds the Sanctum guard. `auth.defaults.guard` decides which guard the bare `Auth::user()` and the bare `auth` middleware use, and this is the single most common source of \"my admin is logged in but `Auth::user()` returns the customer\" bugs — `Auth::guard('admin')->user()` and `Auth::user()` are different sessions under different keys.\n\nThe contracts are worth reading once. `UserProvider` has six methods (`retrieveById`, `retrieveByToken`, `updateRememberToken`, `retrieveByCredentials`, `validateCredentials`, `rehashPasswordIfRequired`) and `Authenticatable` has seven; implement those two and Laravel's entire auth stack — middleware, password reset, remember-me, rehash-on-login — works against an LDAP directory or an HTTP API without knowing it. The design cost is that guards resolve lazily and independently, so two guards each hitting the database means two `SELECT`s per request unless you are deliberate about which one you ask.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel 13: Authentication", url: "https://laravel.com/framework/docs/13.x/authentication", kind: "docs" },
        { label: "Laravel 13: Configuration", url: "https://laravel.com/framework/docs/13.x/configuration", kind: "docs" },
        { label: "Laravel API: Illuminate\\Contracts\\Auth\\UserProvider", url: "https://api.laravel.com/docs/13.x/Illuminate/Contracts/Auth/UserProvider.html", kind: "spec" },
        { label: "OWASP: Authentication Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "Laravel 12 Multi Authentication with Guards 🔐",
        channel: "Hardik Savani(ItSolutionStuff)",
        url: "https://www.youtube.com/watch?v=6tB-Eo6pPjw",
        videoId: "6tB-Eo6pPjw",
        startSeconds: 314,
        chapterLabel: "Configuring auth guards",
        durationLabel: "18:16",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-auth-guards-providers-q1",
          prompt: "What is the division of labour between a guard and a provider?",
          options: [
            "The guard decides how a request is authenticated; the provider decides where users are loaded from",
            "The guard decides what a user may do; the provider decides who they are",
            "The guard is the middleware; the provider is the controller",
            "The guard hashes passwords; the provider compares them",
          ],
          correctIndex: 0,
          explanation:
            "Guards are `session`, `sanctum`, a custom token reader — the mechanism of identification. Providers are `eloquent` or `database` — the storage lookup. \"What may they do\" is authorization (gates and policies), a separate system entirely.",
        },
        {
          id: "lv-auth-guards-providers-q2",
          prompt: "A fresh Laravel 13 application's `config/auth.php` defines which guards?",
          options: [
            "Only `web`, with driver `session` and provider `users`",
            "`web` and `api`, with drivers `session` and `token`",
            "`web`, `api` and `sanctum`",
            "None — guards are registered in `bootstrap/app.php`",
          ],
          correctIndex: 0,
          explanation:
            "The published file ships a single `web` guard, and the skeleton does not require Sanctum. The `sanctum` guard is registered by Sanctum's own service provider once `php artisan install:api` pulls the package in — until then, `auth:sanctum` throws \"Auth guard [sanctum] is not defined\".",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-guards-providers-q3",
          prompt:
            "An admin logs in with `Auth::guard('admin')->attempt($credentials)`. Later, a controller calls `Auth::user()` with no guard argument. What does it return?",
          options: [
            "The `web` guard's user — probably `null`, because the admin was logged into a different guard",
            "The admin, because the last successful login sets the default guard",
            "The admin, because all guards share one session key",
            "It throws, because two guards are authenticated at once",
          ],
          correctIndex: 0,
          explanation:
            "`Auth::user()` resolves `auth.defaults.guard`, which is `web`. Each guard stores its user id under its own session key, so the guards are genuinely independent. Always name the guard once your app has more than one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-guards-providers-q4",
          prompt: "Which statements about the `eloquent` and `database` providers are true? (Select all that apply.)",
          options: [
            "`eloquent` is configured with a model class; `database` is configured with a table name",
            "Both must ultimately return something implementing `Illuminate\\Contracts\\Auth\\Authenticatable`",
            "`database` uses the query builder, so model events, casts and global scopes do not apply",
            "`database` is faster because it caches users in the session",
            "Only `eloquent` supports the remember-me token",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`database` returns a `GenericUser` built by the query builder, which is why casts, accessors and global scopes are bypassed. Both providers implement `updateRememberToken`, and neither caches the user object across requests.",
        },
        {
          id: "lv-auth-guards-providers-q5",
          prompt:
            "You need to authenticate against a legacy HTTP identity service instead of a database table. What is the smallest correct change?",
          options: [
            "Write a `UserProvider` implementation, register it with `Auth::provider('legacy', ...)`, and point a guard's `provider` at it",
            "Override `Auth::attempt()` in a service provider",
            "Add a `legacy` driver to the `guards` array and leave `providers` alone",
            "Replace the `User` model's `find()` method with an HTTP call",
          ],
          correctIndex: 0,
          explanation:
            "\"Where do users come from\" is exactly the provider's job, and the contract is six methods. Nothing above it — the session guard, `auth` middleware, password reset, rehash-on-login — needs to know you changed it.",
        },
        {
          id: "lv-auth-guards-providers-q6",
          prompt: "What does `Auth::viaRequest('custom-token', fn (Request $request) => ...)` give you?",
          options: [
            "A closure-based guard driver: return a user instance or `null`, and reference it as a guard's `driver`",
            "A middleware that runs before every request",
            "A way to override how the `web` guard reads the session",
            "A custom user provider registered under the name `custom-token`",
          ],
          correctIndex: 0,
          explanation:
            "It is the quickest way to build a stateless, request-inspecting guard — the closure receives the request and returns a user or null. A provider would be registered with `Auth::provider()` instead.",
        },
        {
          id: "lv-auth-guards-providers-q7",
          prompt: "`auth.defaults.passwords` points at an entry in the `passwords` array. What are its `expire` and `throttle` values measured in?",
          options: [
            "`expire` is in minutes (default 60); `throttle` is in seconds (default 60)",
            "Both are in minutes",
            "Both are in seconds",
            "`expire` is in hours; `throttle` is in requests per minute",
          ],
          correctIndex: 0,
          explanation:
            "The units differ, which catches people out: a reset token is valid for 60 minutes, and a user must wait 60 seconds before requesting another link. Both live under `config/auth.php` in `passwords.users`, not in the guards array.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-guards-providers-q8",
          prompt: "Which methods must an `Authenticatable` implementation provide? (Select all that apply.)",
          options: [
            "`getAuthIdentifier()` — the primary key value",
            "`getAuthPassword()` — the stored hash",
            "`getRememberToken()` and `setRememberToken()`",
            "`checkPassword($plain)` — compares a plain password to the hash",
            "`getRoles()` — the user's role names",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The contract is deliberately tiny: identifier, password-column name and value, and the remember token. Comparing the password is the provider's job (`validateCredentials`), and roles are not part of Laravel's auth contracts at all.",
        },
        {
          id: "lv-auth-guards-providers-q9",
          prompt: "Attaching `->middleware('auth:admin')` to a route does what, exactly?",
          options: [
            "Runs the `Authenticate` middleware against the `admin` guard, redirecting or 401-ing if that guard has no user",
            "Requires the authenticated user to have the `admin` role",
            "Switches `auth.defaults.guard` to `admin` for the rest of the request",
            "Authenticates with `web` first and falls back to `admin`",
          ],
          correctIndex: 0,
          explanation:
            "The argument after the colon is a guard name, not a role. It is easy to misread `auth:admin` as a role check — Laravel has no built-in role concept, so that reading is always wrong.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-guards-providers-q10",
          prompt: "A session guard is asked for `Auth::user()` five times in one request. How many database queries does that cause?",
          options: [
            "One — the guard resolves the user once and memoises it for the rest of the request",
            "Five — the guard is stateless and re-queries each time",
            "Zero — the user object is serialised into the session",
            "One per call, but they are served from the query cache",
          ],
          correctIndex: 0,
          explanation:
            "`SessionGuard` caches the resolved user on the instance for the life of the request. Only the id is stored in the session, never the model, so a user edited elsewhere is picked up on the next request.",
        },
      ],
    },

    {
      id: "lv-auth-session-login",
      moduleId: "laravel-auth",
      trackId: "php",
      title: "Session Login: Auth::attempt, Logout and Session Fixation",
      summary:
        "`Auth::attempt(['email' => ..., 'password' => ...])` does four things: it builds a query from every credential key that does not contain the string `password`, fetches one user, runs `Hash::check()` against the `password` key, and on success calls `Auth::login()`. You never hash the incoming password yourself — passing `Hash::make($request->password)` into `attempt()` is the classic bug that makes every login fail, because the framework hashes it again before comparing.\n\nThe whole attempt is wrapped in a `Timebox` with a fixed 200 ms budget, so a failed attempt takes the same wall-clock time whether the email exists or not. That is deliberate anti-enumeration engineering, and it is why you should not \"optimise\" login by returning early when the user is missing, and why your own error message must be generic too. `Auth::login()` then calls `session()->regenerate(true)`: a new session id is issued, the old session record is destroyed and the CSRF token is rotated — session fixation is handled by the framework, and the `$request->session()->regenerate()` the docs show in the controller is belt-and-braces rather than the actual fix.\n\nLogging out is the asymmetric part. `Auth::logout()` only clears the user from the guard and cycles the remember token; the session itself keeps its data and its id. The documented sequence is `Auth::logout()`, then `$request->session()->invalidate()`, then `$request->session()->regenerateToken()` — skip the second and a shared-computer user's flash data and cart survive; skip the third and the next visitor's forms carry the previous session's CSRF token. Remember-me is a separate, long-lived encrypted cookie keyed to `users.remember_token`, so a remembered session outlives `session.lifetime` — which is exactly why sensitive routes should also require `password.confirm`, and why `Auth::viaRemember()` exists.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "Laravel 13: Authentication — Manually Authenticating Users", url: "https://laravel.com/framework/docs/13.x/authentication", kind: "docs" },
        { label: "Laravel 13: Session", url: "https://laravel.com/framework/docs/13.x/session", kind: "docs" },
        { label: "OWASP: Session Management Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", kind: "article" },
        { label: "OWASP Top 10:2025 — A07 Authentication Failures", url: "https://top10.owasp.org/2025/A07_2025-Authentication_Failures/", kind: "article" },
      ],
      video: {
        title: "Build Laravel Login & Registration from Scratch",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=QtKZxNNPT_U",
        videoId: "QtKZxNNPT_U",
        startSeconds: 185,
        chapterLabel: "Login",
        durationLabel: "27:37",
      },
      alternateVideos: [
        {
          title: "30 Days to Learn Laravel, Ep 22 - Make a Login and Registration System From Scratch: Part 2",
          channel: "Laracasts",
          url: "https://www.youtube.com/watch?v=M8Vfm7hxqXA",
          videoId: "M8Vfm7hxqXA",
          startSeconds: 1139,
          chapterLabel: "Session security",
          durationLabel: "23:51",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-auth-session-login-q1",
          prompt:
            "Why does this always fail?\n\n```php\nAuth::attempt([\n    'email' => $request->email,\n    'password' => Hash::make($request->password),\n]);\n```",
          options: [
            "`attempt()` hashes the `password` value itself, so it compares a hash of a hash against the stored hash",
            "`Hash::make()` returns `false` inside a controller",
            "`attempt()` requires the password key to be named `plain_password`",
            "Bcrypt hashes cannot be passed through an array",
          ],
          correctIndex: 0,
          explanation:
            "The docs are explicit: do not hash the incoming password. The provider calls `Hash::check($credentials['password'], $user->getAuthPassword())`, and every fresh `Hash::make()` uses a new salt, so the comparison can never succeed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-session-login-q2",
          prompt:
            "The Eloquent provider builds its lookup query from the credentials array, minus some keys. Which keys are excluded?",
          options: [
            "Every key whose name contains `password` — so `password` and `password_confirmation` are both dropped",
            "Only the key named exactly `password`",
            "Every key not present as a column on the users table",
            "Nothing is excluded; the password column is queried as a hash",
          ],
          correctIndex: 0,
          explanation:
            "`retrieveByCredentials()` filters with `str_contains($key, 'password')`. That is why passing extra fields through is usually harmless, and why a column genuinely called `password_hint` would be silently ignored in the lookup.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-session-login-q3",
          prompt: "What protects against session fixation when a user logs in?",
          options: [
            "`Auth::login()` internally calls `session()->regenerate(true)`, issuing a new id, destroying the old session and rotating the CSRF token",
            "Nothing automatic — without `$request->session()->regenerate()` the attacker's planted session id stays valid",
            "The `StartSession` middleware regenerates the id on every request",
            "Laravel binds the session to the client's IP address",
          ],
          correctIndex: 0,
          explanation:
            "`SessionGuard::updateSession()` regenerates with destroy set to true. The extra `regenerate()` in the documented controller is harmless defence in depth, but the framework has already rotated the id by the time `attempt()` returns.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-session-login-q4",
          prompt: "Which of these are true of `Auth::logout()` on its own? (Select all that apply.)",
          options: [
            "It clears the guard's user id from the session",
            "It cycles the user's `remember_token`, invalidating remember-me cookies",
            "It leaves the rest of the session data and the session id intact",
            "It regenerates the CSRF token",
            "It deletes the session record from the session store",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`logout()` removes the auth keys and cycles the remember token, nothing more. `$request->session()->invalidate()` flushes the data and migrates to a new id, and `regenerateToken()` rotates the CSRF token; both are separate calls for a reason.",
        },
        {
          id: "lv-auth-session-login-q5",
          prompt: "`Auth::attempt()` is wrapped in a `Timebox` with a 200 ms budget. What is that for?",
          options: [
            "So a failed attempt takes constant time whether or not the email exists, closing a user-enumeration timing channel",
            "To cap how long bcrypt may take before the request is aborted",
            "To rate-limit logins to five per second per process",
            "To give the session driver time to flush before redirecting",
          ],
          correctIndex: 0,
          explanation:
            "Without it, \"no such user\" would return in microseconds while \"wrong password\" would pay the full bcrypt cost, and an attacker could harvest valid addresses from the difference. Your response body and status must be equally uninformative.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-session-login-q6",
          prompt:
            "You want to reject suspended users at login. Which of these actually prevent a suspended user from getting a session? (Select all that apply.)",
          options: [
            "`Auth::attempt(['email' => $e, 'password' => $p, 'suspended' => 0])`",
            "`Auth::attemptWhen($credentials, fn (User $u) => ! $u->suspended)`",
            "Passing a closure in the credentials array that adds a `where` to the lookup query",
            "Checking `Auth::user()->suspended` in the controller after `attempt()` returns true",
            "Adding a `suspended` accessor to the `User` model",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Extra scalar credentials, closures in the credentials array and `attemptWhen()` all run before the session is created. Checking afterwards is too late — the user already has a session, and forgetting the `Auth::logout()` in that branch is a real bug.",
        },
        {
          id: "lv-auth-session-login-q7",
          prompt: "What does `Auth::once($credentials)` do differently from `Auth::attempt()`?",
          options: [
            "It authenticates for this request only — no session, no cookie, and no `Login` event",
            "It allows exactly one login attempt before throttling kicks in",
            "It logs the user in but expires the session after one minute",
            "It authenticates without checking the password",
          ],
          correctIndex: 0,
          explanation:
            "`once()` is for stateless flows — a one-off API call or a console task. Because no session is written, nothing persists to the next request, and listeners on `Login` never fire.",
        },
        {
          id: "lv-auth-session-login-q8",
          prompt: "Passing `true` as the second argument to `Auth::attempt()` enables remember-me. What does that require and imply?",
          options: [
            "A `remember_token` string column on the users table, and a long-lived encrypted cookie that outlives `session.lifetime`",
            "A `remember_me` boolean column, and a session with no expiry",
            "Nothing extra — Laravel stores the flag in the session",
            "A second session cookie scoped to the login route",
          ],
          correctIndex: 0,
          explanation:
            "The recaller cookie carries the user id and the `remember_token`, so the user is re-authenticated after the session expires. `Auth::viaRemember()` tells you the current request came in that way — useful for demanding password confirmation before anything sensitive.",
        },
        {
          id: "lv-auth-session-login-q9",
          prompt:
            "A user changes their password and you want every other device logged out but this one kept. What is needed?",
          options: [
            "The `auth.session` middleware on the routes, then `Auth::logoutOtherDevices($currentPassword)`",
            "`Auth::logout()` followed by `Auth::login($user)`",
            "`$request->session()->invalidate()` on every row in the sessions table",
            "Setting `session.expire_on_close` to true",
          ],
          correctIndex: 0,
          explanation:
            "`AuthenticateSession` (aliased `auth.session`) keeps a password-derived value in the session and compares it on each request; `logoutOtherDevices()` changes it so every other session fails that comparison. Without the middleware the call does nothing useful.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-session-login-q10",
          prompt: "Where does `redirect()->intended('dashboard')` get the destination from?",
          options: [
            "The URL the `auth` middleware stored in the session when it intercepted the unauthenticated request",
            "The HTTP `Referer` header of the login POST",
            "A hidden `intended` field the login form must submit",
            "The `redirectUsersTo` value in `bootstrap/app.php`",
          ],
          correctIndex: 0,
          explanation:
            "`Authenticate` puts the blocked URL in the session before redirecting to the `login` route; `intended()` pops it and falls back to the argument. Because it comes from the session rather than a request parameter, it is not an open-redirect vector.",
        },
        {
          id: "lv-auth-session-login-q11",
          prompt: "How do you change where unauthenticated users are sent in Laravel 13?",
          options: [
            "`$middleware->redirectGuestsTo('/login')` inside `->withMiddleware()` in `bootstrap/app.php`",
            "Override the `redirectTo()` method of `app/Http/Middleware/Authenticate.php`",
            "Set `auth.redirect` in `config/auth.php`",
            "Add a `login` entry to the `$except` array of the CSRF middleware",
          ],
          correctIndex: 0,
          explanation:
            "There has been no `app/Http/Kernel.php` or published `Authenticate` middleware since Laravel 11 — middleware is configured in `bootstrap/app.php`. `redirectUsersTo()` is the mirror image, for the `guest` middleware.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-session-login-q12",
          prompt: "An unauthenticated request hits a route protected by `auth` and sends `Accept: application/json`. What comes back?",
          options: [
            "A 401 JSON response, because the middleware only redirects when the client expects HTML",
            "A 302 redirect to `/login`, always",
            "A 403, because authentication failed",
            "A 419, because the session is missing",
          ],
          correctIndex: 0,
          explanation:
            "`AuthenticationException` renders as a redirect for browser requests and a 401 for JSON ones. 403 means \"authenticated but not allowed\", and 419 is Laravel's CSRF-mismatch status — different failures, different codes.",
        },
      ],
    },

    {
      id: "lv-auth-hashing",
      moduleId: "laravel-auth",
      trackId: "php",
      title: "The Hash Facade, Drivers and Rehash-on-Login",
      summary:
        "The `php-web` camp covered PHP's `password_hash()` and `password_verify()`. Laravel wraps them in a `Hash` facade backed by a configured driver — `bcrypt` by default, with `argon` and `argon2id` available when PHP was built with Argon2 support. The point of the indirection is that the parameters live in configuration rather than at call sites: `config/hashing.php` sets bcrypt `rounds` (default 12, via `BCRYPT_ROUNDS`) and Argon's `memory`, `time` and `threads`, so raising the work factor across an entire codebase is one environment variable.\n\nThat only pays off because of rehash-on-login. `'rehash_on_login' => true` (the default) makes the Eloquent provider call `Hash::needsRehash()` on every successful `Auth::attempt()`, and when the stored hash's cost no longer matches the configured cost it re-hashes the plaintext you are holding for that one moment and saves it. Existing users migrate as they sign in; nobody has to reset anything. The tradeoff is an extra `UPDATE` on the login request for each not-yet-migrated user, which is fine, and that it only works through the framework's own login path — a hand-rolled `Hash::check()` login skips it entirely.\n\nTwo Laravel-specific sharp edges. First, `Hash::check()` verifies the algorithm before verifying the password: if the stored hash was made with a different driver than the one configured, it throws a `RuntimeException` rather than returning false. That is a deliberate defence against hash-algorithm manipulation, and it is why migrating from bcrypt to Argon2 needs `HASH_VERIFY=false` for the transition window. Second, bcrypt's 72-byte truncation still applies underneath, so Laravel exposes a `limit` option (`BCRYPT_LIMIT`) that makes over-long inputs throw instead of being silently cut — off by default, and worth turning on.",
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        { label: "Laravel 13: Hashing", url: "https://laravel.com/framework/docs/13.x/hashing", kind: "docs" },
        { label: "PHP Manual: password_needs_rehash", url: "https://www.php.net/manual/en/function.password-needs-rehash.php", kind: "docs" },
        { label: "OWASP: Password Storage Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "30 Days to Learn Laravel, Ep 22 - Make a Login and Registration System From Scratch: Part 2",
        channel: "Laracasts",
        url: "https://www.youtube.com/watch?v=M8Vfm7hxqXA",
        videoId: "M8Vfm7hxqXA",
        startSeconds: 527,
        chapterLabel: "Password hashing",
        durationLabel: "23:51",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-auth-hashing-q1",
          prompt: "Which hashing driver does a default Laravel 13 application use, and where is its work factor set?",
          options: [
            "`bcrypt`, with `rounds` from `config/hashing.php` (default 12, overridable with `BCRYPT_ROUNDS`)",
            "`argon2id`, with `memory` and `time` from `config/auth.php`",
            "`bcrypt`, hard-coded at cost 10 inside the framework",
            "Whatever `PASSWORD_DEFAULT` resolves to in the running PHP build",
          ],
          correctIndex: 0,
          explanation:
            "Laravel passes `PASSWORD_BCRYPT` explicitly rather than following `PASSWORD_DEFAULT`, so the algorithm does not change under you when PHP changes its default. `HASH_DRIVER` switches it to `argon` or `argon2id`.",
        },
        {
          id: "lv-auth-hashing-q2",
          prompt: "With `rehash_on_login` enabled, when is a user's stored hash upgraded after you raise `BCRYPT_ROUNDS`?",
          options: [
            "On their next successful `Auth::attempt()`, using the plaintext supplied for that login",
            "By a scheduled job that walks the users table",
            "Immediately for every user, when the config cache is rebuilt",
            "Never — the cost is baked into each hash and cannot change",
          ],
          correctIndex: 0,
          explanation:
            "A hash cannot be strengthened without the plaintext, and login is the only moment the application legitimately holds it. `EloquentUserProvider::rehashPasswordIfRequired()` checks `Hash::needsRehash()` and saves the new hash.",
        },
        {
          id: "lv-auth-hashing-q3",
          prompt:
            "Your login controller does `if (Hash::check($request->password, $user->password)) { Auth::login($user); }` instead of `Auth::attempt()`. What do you lose? (Select all that apply.)",
          options: [
            "Automatic rehash-on-login",
            "The `Attempting`, `Validated` and `Failed` authentication events",
            "The constant-time `Timebox` around the credential check",
            "Session-id regeneration on login",
            "Password hashing on registration",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Rehashing, the auth events and the timing protection all live in `SessionGuard::attempt()`. Session regeneration survives because it happens inside `Auth::login()`, and registration hashing is unrelated.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-hashing-q4",
          prompt:
            "Your app is configured for bcrypt. A row's `password` column contains an Argon2id hash imported from an old system. What does `Hash::check()` do?",
          options: [
            "Throws a `RuntimeException` — Laravel verifies the hash's algorithm before checking it",
            "Returns `false`, because the formats do not match",
            "Verifies it correctly, because `password_verify()` reads the algorithm from the hash",
            "Rehashes it to bcrypt and returns the comparison result",
          ],
          correctIndex: 0,
          explanation:
            "Hash-algorithm verification is on by default and is meant to catch tampering. To run mixed algorithms during a migration you set `HASH_VERIFY=false`, which falls back to plain `password_verify()` behaviour.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-hashing-q5",
          prompt: "Why does Laravel's users migration make `password` a `string` (255) rather than `char(60)`?",
          options: [
            "So the column still fits if the driver or work factor changes to one producing longer hashes, such as Argon2id",
            "Because MySQL cannot index `char(60)` columns",
            "Because the salt is stored in the remaining bytes of the same column",
            "To leave room for the `remember_token`",
          ],
          correctIndex: 0,
          explanation:
            "Bcrypt happens to be 60 bytes today; Argon2id output is longer. A too-narrow column truncates silently on the day you switch, and every stored hash becomes unverifiable.",
        },
        {
          id: "lv-auth-hashing-q6",
          prompt: "Which are true of `Hash::make()` in Laravel? (Select all that apply.)",
          options: [
            "Two calls with the same input return different strings",
            "It accepts a per-call `['rounds' => n]` override for bcrypt",
            "The algorithm and work factor are encoded inside the returned string",
            "It is safe to compare its output with `===` against a stored hash",
            "It returns `false` when hashing fails",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Per-call salts are the whole point, and the self-describing format is how `check()` and `needsRehash()` work. `===` can never match, and modern PHP throws rather than returning `false`.",
        },
        {
          id: "lv-auth-hashing-q7",
          prompt: "A user sets a 120-character passphrase. With the bcrypt driver and default settings, what happens?",
          options: [
            "Only the first 72 bytes affect the hash — bcrypt truncates, and Laravel's `limit` option is off by default",
            "`Hash::make()` throws immediately because the input exceeds 72 bytes",
            "Laravel pre-hashes long inputs with SHA-512 before bcrypt",
            "The passphrase is rejected by validation before it reaches the hasher",
          ],
          correctIndex: 0,
          explanation:
            "The truncation is bcrypt's, not Laravel's. Setting `BCRYPT_LIMIT` makes over-long values throw an `InvalidArgumentException` instead of being quietly cut, which is the honest behaviour if you are staying on bcrypt.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-hashing-q8",
          prompt: "Your `User` model casts `password` with `'password' => 'hashed'`. What does that change?",
          options: [
            "Assigning a plain string to `$user->password` hashes it on the way in, so a separate `Hash::make()` in controllers becomes redundant",
            "It decrypts the password when read",
            "It forces `Hash::check()` to use the Argon2 driver",
            "It marks the attribute hidden from JSON serialisation",
          ],
          correctIndex: 0,
          explanation:
            "The `hashed` cast is why the default registration flow can write `'password' => $request->password` directly. Hashing yourself as well is not usually fatal, but relying on both at once is the confusing path.",
        },
        {
          id: "lv-auth-hashing-q9",
          prompt: "Why does OWASP put Argon2id ahead of bcrypt, and what stops most Laravel apps switching?",
          options: [
            "Argon2id is memory-hard, which blunts GPU attacks; switching needs PHP built with Argon2 support and a rehash window with `HASH_VERIFY=false`",
            "Argon2id is faster to verify, but Laravel's driver is experimental",
            "Argon2id produces shorter hashes that do not fit the default column",
            "Nothing stops it — `HASH_DRIVER=argon2id` re-hashes every stored password automatically",
          ],
          correctIndex: 0,
          explanation:
            "Memory hardness is the real advantage. Nothing re-hashes existing rows automatically, so you run mixed algorithms until users log in — and algorithm verification has to be relaxed for that window.",
        },
        {
          id: "lv-auth-hashing-q10",
          prompt: "You set `BCRYPT_ROUNDS=15` on a busy site. What is the realistic operational consequence?",
          options: [
            "Each login and registration burns noticeably more CPU, so a login flood becomes a cheap denial-of-service unless throttled",
            "Existing users can no longer log in until they reset their passwords",
            "Hash verification time is unchanged, because cost only affects hashing",
            "Nothing measurable — bcrypt cost is logarithmic in wall-clock time",
          ],
          correctIndex: 0,
          explanation:
            "Each increment roughly doubles the work, and verification pays the cost stored inside the hash, so both sides get slower as users migrate. High cost and rate limiting are complements, not alternatives.",
        },
      ],
    },

    {
      id: "lv-auth-password-reset",
      moduleId: "laravel-auth",
      trackId: "php",
      title: "Password Reset and Email Verification",
      summary:
        "Both flows are \"prove you control this inbox\", and Laravel implements them with two different mechanisms that are worth telling apart. Password reset uses a **password broker**: `Password::sendResetLink()` generates a random token, deletes any existing row for that email, stores a **hash** of the token in `password_reset_tokens` with a `created_at`, and mails the plain token. `Password::reset()` re-hashes the submitted token and compares, checks the `expire` window (60 minutes by default) and only then runs your closure to save the new password. The token is in the database, so it can be invalidated server-side — which is why resetting also cycles the remember token in the documented example.\n\nEmail verification uses no database token at all. The link is a **temporary signed URL** to the `verification.verify` route carrying `id` and `hash`, where `hash` is `sha1()` of the user's email; the signature is an HMAC over the whole URL and query string, and `EmailVerificationRequest::authorize()` compares the route `id` against the **currently authenticated user** and the `hash` against the current email. That has three consequences people trip over: the route needs both `auth` and `signed` middleware, a verification link only works in a browser already logged in as that user, and changing the email invalidates every outstanding link automatically.\n\nThe security decision neither flow makes for you is enumeration. `Password::sendResetLink()` returns `Password::InvalidUser` when the address is unknown, and the default views render that as \"we can't find a user with that email address\" — a free membership oracle. OWASP's guidance is a single generic response for every outcome, plus throttling on the request endpoint (`throttle` in `config/auth.php` is 60 seconds per address, which is about resend abuse, not about enumeration). The resend endpoint for verification emails carries `throttle:6,1` in the docs for the same reason.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel 13: Resetting Passwords", url: "https://laravel.com/framework/docs/13.x/passwords", kind: "docs" },
        { label: "Laravel 13: Email Verification", url: "https://laravel.com/framework/docs/13.x/verification", kind: "docs" },
        { label: "Laravel 13: URL Generation — Signed URLs", url: "https://laravel.com/framework/docs/13.x/urls", kind: "docs" },
        { label: "OWASP: Forgot Password Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "Build Your Own Custom Auth System with Fortify",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=izEIhUXhChU",
        videoId: "izEIhUXhChU",
        startSeconds: 720,
        chapterLabel: "Email Verification",
        durationLabel: "20:13",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-auth-password-reset-q1",
          prompt: "What is stored in the `password_reset_tokens` table?",
          options: [
            "The email, a hash of the reset token, and `created_at`",
            "The email and the plain-text reset token",
            "The user id, the token and an `expires_at` timestamp",
            "Nothing — reset tokens are stateless signed URLs",
          ],
          correctIndex: 0,
          explanation:
            "The token is hashed with the configured hasher before being stored, so a database read does not hand an attacker working reset links. Expiry is computed from `created_at` plus `passwords.users.expire`, not from a stored expiry column.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-password-reset-q2",
          prompt: "A user requests three reset links in a row (spaced far enough apart to dodge throttling). Which of them work?",
          options: [
            "Only the newest — creating a token deletes the existing row for that email first",
            "All three, until each one's 60-minute window expires",
            "Only the oldest, because the row is not overwritten",
            "None, because requesting a second link locks the account",
          ],
          correctIndex: 0,
          explanation:
            "`DatabaseTokenRepository::create()` calls `deleteExisting()` before inserting, and the table is keyed by email. Requesting a new link therefore silently invalidates the previous one — which is the behaviour you want, and which support teams need to know about.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-password-reset-q3",
          prompt: "Which middleware does the `verification.verify` route need, and why?",
          options: [
            "`auth` and `signed` — the request must validate the URL's HMAC signature and be made by the user the link belongs to",
            "`signed` only — the link identifies the user by id",
            "`auth` and `verified` — the user must already be verified to verify",
            "`guest` and `throttle` — the user is not logged in when they click the link",
          ],
          correctIndex: 0,
          explanation:
            "`signed` validates the temporary signature; `auth` is required because `EmailVerificationRequest::authorize()` compares the route `id` to `$this->user()->getKey()`. Without `auth`, the request fails on a null user rather than verifying anyone.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-password-reset-q4",
          prompt: "A user requests a verification email, then changes their address, then clicks the old link. What happens?",
          options: [
            "It fails — the `hash` in the URL is `sha1()` of the old address and no longer matches",
            "It verifies the new address, because the link identifies the user by id",
            "It verifies the old address and leaves the new one unverified",
            "It throws a 500, because the hash column no longer exists",
          ],
          correctIndex: 0,
          explanation:
            "Binding the link to `sha1($user->getEmailForVerification())` is what makes outstanding links self-invalidating when the address changes — an important property, because otherwise an old link could verify an address the user no longer controls.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-password-reset-q5",
          prompt: "Which of these are true about `MustVerifyEmail`? (Select all that apply.)",
          options: [
            "Implementing it on the `User` model makes the framework send a verification email on the `Registered` event",
            "The users table needs a nullable `email_verified_at` column",
            "The `verified` middleware alias maps to `EnsureEmailIsVerified` and redirects to the `verification.notice` route",
            "It blocks login until the address is verified",
            "It automatically adds `verified` to every route in the `web` group",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Laravel registers a `SendEmailVerificationNotification` listener for `Registered`, so a manual registration flow must dispatch that event itself. Verification does not gate authentication — an unverified user is logged in, they are just blocked from `verified` routes.",
        },
        {
          id: "lv-auth-password-reset-q6",
          prompt:
            "Your forgot-password page shows \"We can't find a user with that email address\" when the address is unknown. What is the problem?",
          options: [
            "It is a user-enumeration oracle; OWASP's guidance is one generic \"if that address exists we've sent a link\" message for every outcome",
            "Nothing — the message is required for accessibility",
            "It leaks the reset token's expiry window",
            "It breaks the `Password::InvalidUser` status translation",
          ],
          correctIndex: 0,
          explanation:
            "`sendResetLink()` returns distinct statuses for the application's benefit, not the user's. Rendering `InvalidUser` differently from `ResetLinkSent` tells anyone with a wordlist exactly which of your customers' addresses are registered.",
        },
        {
          id: "lv-auth-password-reset-q7",
          prompt: "Where does the `Password` facade find the user for a given email address?",
          options: [
            "Through the user provider named in `config/auth.php` under `passwords.users.provider`",
            "By querying the `users` table directly with the query builder",
            "From the `web` guard's currently authenticated user",
            "From the `password_reset_tokens` table's `user_id` column",
          ],
          correctIndex: 0,
          explanation:
            "The broker reuses the auth system's providers, which is why a custom provider gets password reset for free. It is also why the broker's provider and your guard's provider must agree, or resets silently target the wrong model.",
        },
        {
          id: "lv-auth-password-reset-q8",
          prompt: "What does the `throttle` value under `config/auth.php` `passwords.users` control?",
          options: [
            "The minimum number of seconds between reset-link requests for one email address (default 60)",
            "The maximum number of reset attempts per IP per minute",
            "How long a reset token remains valid",
            "How often `auth:clear-resets` prunes the table",
          ],
          correctIndex: 0,
          explanation:
            "Exceeding it returns `Password::ResetThrottled`. It is per address and stops mailbox flooding; it does not limit an attacker who is cycling through many addresses, which is what route-level `throttle` middleware is for.",
        },
        {
          id: "lv-auth-password-reset-q9",
          prompt: "Expired reset tokens are not removed automatically. What clears them?",
          options: [
            "The `auth:clear-resets` Artisan command, typically scheduled",
            "A model observer on the `User` model",
            "The database driver's TTL index",
            "`Password::reset()`, which prunes the whole table on every call",
          ],
          correctIndex: 0,
          explanation:
            "The database driver leaves expired rows behind; `auth:clear-resets` deletes them, and the docs suggest scheduling it. The alternative is the `cache` password driver, which stores reset data in a cache store and expires it for you.",
        },
        {
          id: "lv-auth-password-reset-q10",
          prompt: "Why does the documented `Password::reset()` closure also call `setRememberToken(Str::random(60))`?",
          options: [
            "So existing remember-me cookies stop working — otherwise an attacker with a stolen recaller cookie survives the password reset",
            "Because the remember token is used as the salt for the new password",
            "Because `Password::reset()` fails if the remember token is stale",
            "To force the user to verify their email again",
          ],
          correctIndex: 0,
          explanation:
            "A password reset is the canonical \"I think my account is compromised\" action, so every long-lived credential derived from the old password must die with it. Pair it with `AuthenticateSession` if you also want other sessions dropped.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-password-reset-q11",
          prompt: "Why do the password-reset docs specifically mention configuring trusted hosts?",
          options: [
            "The reset URL is built from the request's `Host` header, so an attacker who can spoof it can have the link point at their own domain",
            "Because the mailer refuses to send to untrusted hosts",
            "Because signed URLs embed the host in the signature and fail otherwise",
            "Because the `password_reset_tokens` table stores the host of the requesting client",
          ],
          correctIndex: 0,
          explanation:
            "Host header poisoning turns \"forgot password\" into \"mail the victim a link to my server\". `trustHosts()` in `bootstrap/app.php`, or an equivalent web-server rule, is the fix; it matters most on exactly this endpoint.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "lv-auth-stack-choice",
      moduleId: "laravel-auth",
      trackId: "php",
      title: "Choosing an Auth Stack: Starter Kits, Fortify, Sanctum and Passport",
      summary:
        "Laravel ships four things that all sound like \"authentication\", and choosing badly costs weeks. The **built-in services** (`Auth`, `Session`, the guards) are the engine: they verify credentials and maintain a session, and they are always present. **Fortify** is a headless backend that registers the *routes and controllers* for login, registration, password reset, email verification, password confirmation and two-factor — no views, no opinions about the frontend. **Starter kits** are Fortify plus a real UI (React, Vue, Svelte or Livewire, Inertia-based). **Sanctum** and **Passport** are about API credentials, and neither of them registers a `/register` or `/forgot-password` route.\n\nThe decision tree is short. A server-rendered monolith: built-in services, optionally scaffolded by a starter kit. A separate SPA or a mobile app talking to your own backend: Sanctum, plus Fortify if you do not want to hand-write the registration and reset endpoints. A public API that third parties integrate with using their own users' consent: Passport, because that is what OAuth2 is for — authorization-code flow with PKCE, refresh tokens, consent screens, and an authorization server other people's libraries already understand. An MCP server for AI clients is the newest case in this bucket, since MCP clients expect OAuth.\n\nThe framing people get wrong is treating Sanctum and Passport as the same product at different sizes. Passport is an OAuth2 *authorization server*: it exists so a third party can act on a user's behalf without seeing their password, and it carries the whole spec's weight — clients, grants, scopes, key management. Sanctum has no concept of a third-party client at all; its tokens are personal access tokens the user mints for themselves. If nobody outside your organisation is writing an integration, OAuth2 buys you complexity and no security you did not already have. Note too that Passport's password grant is explicitly no longer recommended: reaching for it is usually a sign Sanctum was the right answer.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Laravel 13: Authentication — Ecosystem Overview", url: "https://laravel.com/framework/docs/13.x/authentication", kind: "docs" },
        { label: "Laravel 13: Starter Kits", url: "https://laravel.com/framework/docs/13.x/starter-kits", kind: "docs" },
        { label: "Laravel 13: Fortify", url: "https://laravel.com/framework/docs/13.x/fortify", kind: "docs" },
        { label: "OAuth 2.0 (oauth.net)", url: "https://oauth.net/2/", kind: "spec" },
      ],
      video: {
        title: "Laravel Passport vs Sanctum: What's the difference?",
        channel: "Andrew Schmelyun",
        url: "https://www.youtube.com/watch?v=edcTejycirk",
        videoId: "edcTejycirk",
        durationLabel: "8:27",
      },
      alternateVideos: [
        {
          title: "Fortify - Frontend-agnostic authentication",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=YojldACcvVQ",
          videoId: "YojldACcvVQ",
          durationLabel: "4:52",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-auth-stack-choice-q1",
          prompt: "What does Fortify actually give you that the built-in auth services do not?",
          options: [
            "Ready-made routes and controllers for registration, login, reset, verification, password confirmation and 2FA — with no views",
            "A different session driver optimised for APIs",
            "Token-based API authentication",
            "A UI built with Tailwind for the whole auth flow",
          ],
          correctIndex: 0,
          explanation:
            "Fortify is deliberately headless: it is the starter kits' backend extracted as a package. The UI is the starter kits' contribution, and API tokens are Sanctum's.",
        },
        {
          id: "lv-auth-stack-choice-q2",
          prompt: "Which are genuine reasons to choose Passport over Sanctum? (Select all that apply.)",
          options: [
            "Third parties will build integrations that act on your users' behalf and need a consent screen",
            "You need the authorization-code grant with PKCE for a public client",
            "You are building an MCP server whose clients expect to authenticate with OAuth",
            "Your API is consumed only by your own React SPA on the same top-level domain",
            "You want tokens that can be revoked",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Delegated third-party access is the problem OAuth2 solves. A first-party SPA is Sanctum's cookie mode, and revocation is not a differentiator — deleting a Sanctum token revokes it just as effectively.",
        },
        {
          id: "lv-auth-stack-choice-q3",
          prompt: "A team says \"we picked Passport because we need login for our mobile app\". What is the counter-argument?",
          options: [
            "A first-party mobile client is Sanctum's documented case: exchange credentials for a personal access token, no OAuth client or grant needed",
            "Passport cannot issue tokens to mobile applications",
            "Mobile apps must use session cookies, which Passport does not support",
            "Passport tokens expire after one hour and cannot be refreshed",
          ],
          correctIndex: 0,
          explanation:
            "The password grant used to be the answer for first-party mobile clients, and it is no longer recommended. Sanctum's device-named token endpoint does the same job with a database table instead of an authorization server.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-stack-choice-q4",
          prompt: "Can Fortify and Sanctum be used together?",
          options: [
            "Yes, and that is the documented pairing for an SPA: Fortify supplies the auth routes, Sanctum supplies the session/token authentication",
            "No — both register a `/login` route and conflict",
            "Only if Passport is also installed to arbitrate between them",
            "Yes, but Fortify must be configured to disable its session driver",
          ],
          correctIndex: 0,
          explanation:
            "They solve different halves. Sanctum never registers registration or reset routes; Fortify never decides how a request is authenticated. The docs call out the confusion explicitly.",
        },
        {
          id: "lv-auth-stack-choice-q5",
          prompt: "Which frontends do Laravel's official starter kits offer?",
          options: [
            "React, Vue, Svelte (all via Inertia) and Livewire",
            "Blade only",
            "React and Angular",
            "Vue and Alpine, with an optional Next.js variant",
          ],
          correctIndex: 0,
          explanation:
            "All four use Fortify underneath, so the auth backend is identical; what differs is the rendering layer. Breeze and Jetstream were the previous generation of this idea.",
        },
        {
          id: "lv-auth-stack-choice-q6",
          prompt: "A monolithic Blade application needs login and registration, and the team does not want an Inertia frontend. What is the leanest sensible choice?",
          options: [
            "The built-in auth services with hand-written routes and Blade views, or Fortify if you would rather not write the controllers",
            "Sanctum in SPA mode",
            "Passport with the client-credentials grant",
            "A starter kit, stripped of its React frontend",
          ],
          correctIndex: 0,
          explanation:
            "Cookie-based session auth is already the whole answer for a server-rendered app. Sanctum adds nothing when there is no separate frontend and no API, and Passport adds an authorization server nobody will talk to.",
        },
        {
          id: "lv-auth-stack-choice-q7",
          prompt: "Which of these does Sanctum explicitly *not* provide?",
          options: [
            "Registration, password reset and email verification endpoints",
            "Bearer-token authentication for API requests",
            "Cookie-based authentication for a first-party SPA",
            "Token abilities, comparable to OAuth scopes",
          ],
          correctIndex: 0,
          explanation:
            "Sanctum authenticates existing users; it has no opinion about how accounts come into existence. That gap is exactly what Fortify or your own controllers fill.",
        },
        {
          id: "lv-auth-stack-choice-q8",
          prompt: "What is the cost of adopting Passport when you did not need OAuth2? (Select all that apply.)",
          options: [
            "Encryption keys that must be generated, stored and rotated as part of deployment",
            "Extra tables for clients, auth codes, access tokens and refresh tokens",
            "A grant-type decision and client registration for every consumer, including your own",
            "Losing the ability to authenticate a browser session with cookies",
            "Losing the ability to use gates and policies for authorization",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The operational surface is the real cost — keys, tables and client management. Cookie sessions and the authorization layer are untouched, because Passport only changes how API requests are authenticated.",
        },
        {
          id: "lv-auth-stack-choice-q9",
          prompt: "Why does the Sanctum documentation say not to use API tokens to authenticate your own first-party SPA?",
          options: [
            "A token has to be stored somewhere JavaScript can read it, so any XSS becomes credential theft; the cookie mode keeps it in an HttpOnly cookie",
            "Because tokens are slower to verify than session lookups",
            "Because Sanctum tokens cannot be used from a browser at all",
            "Because CORS forbids the `Authorization` header",
          ],
          correctIndex: 0,
          explanation:
            "The whole argument for cookie mode is XSS containment plus CSRF protection. That reasoning only applies to a first-party frontend you control on the same site; a third-party consumer has no better option than a bearer token.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-stack-choice-q10",
          prompt: "Your app has a Blade admin panel, a React customer SPA on a subdomain and a public partner API. What is a coherent stack?",
          options: [
            "Built-in session auth for the admin panel, Sanctum cookie mode for the SPA, and Passport for the partner API",
            "Passport for all three, so there is one token format",
            "Sanctum for all three, using bearer tokens everywhere",
            "Three separate Laravel applications, one per audience",
          ],
          correctIndex: 0,
          explanation:
            "These are three genuinely different trust relationships, and the packages are not mutually exclusive — the docs say so explicitly. Forcing one mechanism onto all three either over-engineers the internal cases or under-protects the external one.",
        },
      ],
    },

    {
      id: "lv-auth-sanctum-tokens",
      moduleId: "laravel-auth",
      trackId: "php",
      title: "Sanctum API Tokens and Abilities",
      summary:
        "Sanctum's token half is a single polymorphic table and about two hundred lines of code. `$user->createToken('CI deploy key', ['deploy:write'])` generates 40 random characters plus a CRC32 checksum, stores `hash('sha256', $plain)` in `personal_access_tokens`, and returns `\"{$id}|{$plain}\"` — the id prefix is why lookup is a primary-key fetch followed by a `hash_equals()` comparison rather than a table scan. The plaintext exists exactly once, in that response; there is no \"show me the token again\" because the column holds only a digest.\n\n**Abilities are not enforced by `auth:sanctum`.** The guard authenticates the token and stops there. `$user->tokenCan('deploy:write')` is a check *you* make, or you register the `abilities` / `ability` middleware aliases yourself in `bootstrap/app.php` — they are not registered by default. The other half of that trap is the default: `createToken($name)` with no second argument grants `['*']`, and `PersonalAccessToken::can()` returns true for every ability when `*` is present. A token minted by the obvious one-liner is a full-access token.\n\nTwo operational notes. Expiry has two layers: `sanctum.expiration` (minutes, measured from `created_at`, `null` by default so tokens live forever) and an optional per-token `expires_at`; expired rows stay in the table until `sanctum:prune-expired` removes them, so schedule it. And Sanctum writes `last_used_at` on every authenticated request, which is one `UPDATE` per API call — usually invisible, occasionally the reason a read-heavy endpoint is inexplicably writing to the primary. Setting `SANCTUM_TOKEN_PREFIX` is cheap and worth doing: it lets GitHub's secret scanning recognise your tokens when somebody commits one.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel 13: Sanctum", url: "https://laravel.com/framework/docs/13.x/sanctum", kind: "docs" },
        { label: "laravel/sanctum on GitHub", url: "https://github.com/laravel/sanctum", kind: "repo" },
        { label: "OWASP: REST Security Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "Sanctum - API authentication simplified",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=iXrfSFEXd-M",
        videoId: "iXrfSFEXd-M",
        durationLabel: "5:30",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-auth-sanctum-tokens-q1",
          prompt: "What is stored in the `personal_access_tokens` table's `token` column?",
          options: [
            "A SHA-256 hash of the plain-text token",
            "The plain-text token, encrypted with the app key",
            "A bcrypt hash of the plain-text token",
            "The token's abilities, serialised as JSON",
          ],
          correctIndex: 0,
          explanation:
            "SHA-256 is appropriate here precisely because the token is 40 characters of high-entropy random data — there is nothing to brute-force, so a deliberately slow password hash would only add latency to every API request.",
        },
        {
          id: "lv-auth-sanctum-tokens-q2",
          prompt: "A returned token looks like `7|mB3k...`. What is the leading number for?",
          options: [
            "The token's primary key, so lookup is a single `find()` followed by a `hash_equals()` comparison",
            "The abilities bitmask",
            "The id of the user the token belongs to",
            "The number of the API version the token was issued for",
          ],
          correctIndex: 0,
          explanation:
            "Without it, authenticating would mean hashing the candidate and searching the whole table. Splitting on the pipe also means a token pasted with the id stripped off will not authenticate.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-sanctum-tokens-q3",
          prompt: "What abilities does `$user->createToken('My Token')` grant?",
          options: [
            "`['*']` — every ability, because the second argument defaults to the wildcard",
            "`[]` — none, until abilities are assigned",
            "The abilities of the token used to make the request",
            "`['read']` only",
          ],
          correctIndex: 0,
          explanation:
            "`can()` returns true immediately when `*` is in the array. The convenient call is therefore the least-privileged-by-default call's opposite — pass an explicit ability list whenever the token is scoped to one job.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-sanctum-tokens-q4",
          prompt:
            "A route is protected with `->middleware('auth:sanctum')`, and the caller's token has only the `orders:read` ability. Can it POST to that route?",
          options: [
            "Yes — `auth:sanctum` only authenticates; abilities are not checked unless you check them",
            "No — Sanctum matches abilities to HTTP verbs automatically",
            "No — a token without `*` is rejected by the guard",
            "Only if the route is inside the `api` middleware group",
          ],
          correctIndex: 0,
          explanation:
            "This is the most common Sanctum misconception. Enforce abilities with `$user->tokenCan(...)`, a policy, or the `abilities`/`ability` middleware — which you must first register as aliases in `bootstrap/app.php`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-sanctum-tokens-q5",
          prompt: "Which statements about Sanctum token expiry are true? (Select all that apply.)",
          options: [
            "By default tokens never expire and must be revoked explicitly",
            "`sanctum.expiration` is a number of minutes measured from the token's `created_at`",
            "`createToken()` accepts a per-token expiry as its third argument",
            "Expired token rows are deleted automatically on the next authentication attempt",
            "Setting `sanctum.expiration` also expires first-party session authentication",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Expired rows linger until `sanctum:prune-expired` runs, and the config comment states that first-party sessions are unaffected by the expiration setting.",
        },
        {
          id: "lv-auth-sanctum-tokens-q6",
          prompt: "How do you revoke the token that authenticated the current request?",
          options: [
            "`$request->user()->currentAccessToken()->delete()`",
            "`Auth::logout()`",
            "`$request->user()->tokens()->update(['revoked' => true])`",
            "`Sanctum::revokeCurrentToken()`",
          ],
          correctIndex: 0,
          explanation:
            "Revocation is a row delete; there is no revoked flag. `currentAccessToken()` is available because the guard attaches the token model to the authenticated user.",
        },
        {
          id: "lv-auth-sanctum-tokens-q7",
          prompt: "How should the token be sent on each request?",
          options: [
            "As `Authorization: Bearer {id}|{token}`",
            "As a `sanctum_token` query parameter",
            "In an `X-API-Token` header",
            "In the `XSRF-TOKEN` cookie",
          ],
          correctIndex: 0,
          explanation:
            "Sanctum reads `$request->bearerToken()`. A query parameter would land in access logs, browser history and `Referer` headers, which is why tokens belong in a header.",
        },
        {
          id: "lv-auth-sanctum-tokens-q8",
          prompt: "Sanctum writes `last_used_at` on every token-authenticated request. What is the practical implication?",
          options: [
            "A write on every API call — measurable on a read-heavy endpoint, and it sends traffic to the primary in a read-replica setup",
            "Nothing — the column is updated lazily by a scheduled job",
            "The token is rotated each time it is used",
            "The request is slower because the token must be re-hashed",
          ],
          correctIndex: 0,
          explanation:
            "It is usually negligible and occasionally the surprise in a profile. It is also the only built-in signal for \"which of this user's tokens are actually in use\", so disable it deliberately rather than by accident.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-sanctum-tokens-q9",
          prompt: "What does `SANCTUM_TOKEN_PREFIX` do?",
          options: [
            "Prefixes newly issued tokens with a recognisable string so secret-scanning services can detect leaked tokens in repositories",
            "Namespaces tokens per guard so two guards can issue tokens independently",
            "Adds a version prefix used to expire tokens issued before a deployment",
            "Encrypts the token with a per-tenant prefix key",
          ],
          correctIndex: 0,
          explanation:
            "It is purely about detectability. It does not change how tokens are verified, and existing tokens keep working — but a distinctive prefix turns an accidental commit into an alert instead of a breach.",
        },
        {
          id: "lv-auth-sanctum-tokens-q10",
          prompt: "Why is `tokenCan()` still worth calling inside a policy that already checks ownership?",
          options: [
            "Ownership and delegation are different questions: the user may own the record while the token was only granted read access",
            "Because policies cannot access the authenticated user otherwise",
            "Because `tokenCan()` refreshes the token's `expires_at`",
            "It is not — ownership implies every ability",
          ],
          correctIndex: 0,
          explanation:
            "The documented pattern is `$request->user()->id === $server->user_id && $request->user()->tokenCan('server:update')`. A narrow token is the user deliberately limiting what a script may do on their behalf.",
        },
        {
          id: "lv-auth-sanctum-tokens-q11",
          prompt: "A user lost their token and asks support to look it up. What can you tell them?",
          options: [
            "It cannot be recovered — only a hash is stored, so the only option is to issue a new token and revoke the old one",
            "It can be decrypted with the application key",
            "It is recoverable from `last_used_at` and the token name",
            "It is emailed to them automatically when created",
          ],
          correctIndex: 0,
          explanation:
            "Irreversibility is the design. Show the plaintext once, immediately after creation, with a clear warning — and make revoking and reissuing a one-click action in the UI.",
        },
      ],
    },

    {
      id: "lv-auth-sanctum-spa",
      moduleId: "laravel-auth",
      trackId: "php",
      title: "Sanctum's SPA Cookie Mode",
      summary:
        "Sanctum's second product shares a name with the first and shares almost no code with it. In SPA mode **no token is involved at all**: your React or Vue frontend authenticates against the ordinary `web` session guard and is identified on later requests by the normal, HttpOnly, encrypted session cookie. The benefit is XSS containment — there is no credential in `localStorage` for injected script to exfiltrate — and the cost is that you inherit CSRF, so every mutating request needs a token too.\n\nThe moving parts are specific. `EnsureFrontendRequestsAreStateful` (enabled with `$middleware->statefulApi()` in `bootstrap/app.php`) inspects the request's **`Referer` or `Origin` header**, matches it against `config('sanctum.stateful')`, and if it matches pushes the request through the cookie, session and CSRF middleware that API routes otherwise skip. No `Referer` and no `Origin` means not stateful, which is why the docs tell you to send one. The frontend's opening move is `GET /sanctum/csrf-cookie`, which sets an encrypted `XSRF-TOKEN` cookie; the client then URL-decodes that cookie into an `X-XSRF-TOKEN` header on every subsequent write. Axios does this for you once `withCredentials` and `withXSRFToken` are both true.\n\nThe constraints that break deployments are about cookie scope, not about Laravel. The SPA and the API must share a **top-level domain** — different subdomains are fine, genuinely different domains are not, because the session cookie will never be sent. So `session.domain` needs a leading dot (`.example.com`), CORS needs `supports_credentials => true`, and every stateful host must be listed *with its port* during local development. When it goes wrong the symptom is uniform and unhelpful: a 419 on the login POST (CSRF cookie missing or not echoed back) or a 401 on every request afterwards (the session cookie was not sent, or the request was never treated as stateful).",
      level: "expert",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Laravel 13: Sanctum — SPA Authentication", url: "https://laravel.com/framework/docs/13.x/sanctum", kind: "docs" },
        { label: "Laravel 13: CSRF Protection", url: "https://laravel.com/framework/docs/13.x/csrf", kind: "docs" },
        { label: "MDN: Set-Cookie", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie", kind: "docs" },
        { label: "OWASP: Session Management Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "Laravel Sanctum SPA Auth Overview",
        channel: "cdruc",
        url: "https://www.youtube.com/watch?v=ujDnuzi1t1s",
        videoId: "ujDnuzi1t1s",
        durationLabel: "13:33",
      },
      alternateVideos: [
        {
          title: "Laravel SPA Authentication - setup and common mistakes",
          channel: "cdruc",
          url: "https://www.youtube.com/watch?v=2zKoS8GsKK8",
          videoId: "2zKoS8GsKK8",
          durationLabel: "16:55",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-auth-sanctum-spa-q1",
          prompt: "In Sanctum's SPA mode, what authenticates a request after login?",
          options: [
            "Laravel's ordinary session cookie, via the `web` guard — no token is issued",
            "A short-lived bearer token stored in `localStorage`",
            "The `XSRF-TOKEN` cookie, which doubles as the session identifier",
            "A personal access token with the `spa` ability",
          ],
          correctIndex: 0,
          explanation:
            "The docs state it plainly: for this feature Sanctum does not use tokens of any kind. That is the entire security argument — the credential lives in an HttpOnly cookie that JavaScript cannot read.",
        },
        {
          id: "lv-auth-sanctum-spa-q2",
          prompt: "How does `EnsureFrontendRequestsAreStateful` decide a request is from your own frontend?",
          options: [
            "It matches the request's `Referer` or `Origin` header against `config('sanctum.stateful')`",
            "It compares the client's IP address against a trusted-proxy list",
            "It looks for the `XSRF-TOKEN` cookie",
            "It checks whether the route is inside the `web` middleware group",
          ],
          correctIndex: 0,
          explanation:
            "If neither header is present, the request is not stateful and the session middleware never runs — which is why a curl call with no `Origin` gets a 401 no matter how correct the cookies are.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-sanctum-spa-q3",
          prompt: "What does `GET /sanctum/csrf-cookie` return, and why does the SPA call it before logging in?",
          options: [
            "A 204 that sets an encrypted `XSRF-TOKEN` cookie; the client echoes its decoded value back in `X-XSRF-TOKEN` on every write",
            "A JSON body containing the CSRF token, to be stored in memory",
            "A session cookie that authenticates the user as a guest",
            "A signed URL the login POST must be sent to",
          ],
          correctIndex: 0,
          explanation:
            "Without that round trip the login POST has no CSRF token and fails with a 419. Axios does the decode-and-echo automatically once `withCredentials` and `withXSRFToken` are set.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-sanctum-spa-q4",
          prompt: "Which are required for the SPA and the API to share a session cookie? (Select all that apply.)",
          options: [
            "They must share a top-level domain (different subdomains are fine)",
            "`session.domain` must be set with a leading dot, e.g. `.example.com`",
            "CORS must return `Access-Control-Allow-Credentials: true`",
            "The SPA must be served by the same Laravel application",
            "Both must run on the same port",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The SPA can be a completely separate build on a separate host, as long as the cookie's domain covers both. Ports do not scope cookies — though they must be included in the stateful-domains list, which is a different check.",
        },
        {
          id: "lv-auth-sanctum-spa-q5",
          prompt: "The login POST returns 419. What is the most likely cause?",
          options: [
            "The CSRF token is missing or not echoed back — `/sanctum/csrf-cookie` was not called, or the client is not sending `X-XSRF-TOKEN`",
            "The credentials were wrong",
            "The user's email is unverified",
            "The request was not authenticated, so the session guard rejected it",
          ],
          correctIndex: 0,
          explanation:
            "419 is Laravel's `TokenMismatchException` status. Wrong credentials give a 422, an unverified user gives a redirect or 403, and 401 means unauthenticated — four different failures with four different codes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-sanctum-spa-q6",
          prompt: "Your SPA is on `app.example.com` and the API on `api.example.com`. Which `SANCTUM_STATEFUL_DOMAINS` entry is correct?",
          options: [
            "`app.example.com` — the domain the requests come *from*",
            "`api.example.com` — the domain the requests go *to*",
            "Both, since the middleware checks each end",
            "`.example.com`, because that is what `session.domain` is set to",
          ],
          correctIndex: 0,
          explanation:
            "The list is matched against the `Referer`/`Origin` of the incoming request, which is the frontend's host. Listing the API's own domain is a common misconfiguration that leaves every request stateless.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-sanctum-spa-q7",
          prompt: "Can one application use Sanctum's SPA mode and Sanctum's API tokens at the same time?",
          options: [
            "Yes — the guard checks the session cookie first and falls back to the bearer token",
            "No — the two modes are mutually exclusive per installation",
            "Only if the token routes are in a separate guard",
            "Yes, but the SPA must also send a bearer token",
          ],
          correctIndex: 0,
          explanation:
            "That fallback is why the docs suggest `auth:sanctum` even on `routes/web.php`: the same guard serves your own frontend and a third-party integration, and `tokenCan()` is always safe to call.",
        },
        {
          id: "lv-auth-sanctum-spa-q8",
          prompt: "Why does `$user->tokenCan('anything')` return `true` for a request from your first-party SPA?",
          options: [
            "Session-authenticated users are given a `TransientToken`, whose `can()` always returns true",
            "The SPA is issued a wildcard token behind the scenes",
            "`tokenCan()` returns true whenever no token is present",
            "Because the `web` guard grants all abilities by default",
          ],
          correctIndex: 0,
          explanation:
            "It lets a policy call `tokenCan()` unconditionally without branching on how the request was authenticated. It also means abilities are not a defence against your own UI — pair them with ownership checks.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-sanctum-spa-q9",
          prompt: "Requests from your SPA succeed in Postman but fail in the browser with no cookie sent. What is the usual cause?",
          options: [
            "`withCredentials` is not enabled on the HTTP client, so the browser omits cross-origin cookies",
            "The session driver is set to `array`",
            "Sanctum's migrations have not been run",
            "The API is missing the `auth:sanctum` middleware",
          ],
          correctIndex: 0,
          explanation:
            "Browsers do not attach cookies to cross-origin XHR unless the request opts in and the server answers with `Access-Control-Allow-Credentials`. Postman has no such rule, which is why it hides the bug.",
        },
        {
          id: "lv-auth-sanctum-spa-q10",
          prompt: "What does `EnsureFrontendRequestsAreStateful` add to a matched request?",
          options: [
            "The cookie-encryption, queued-cookie, session-start and CSRF middleware that the `api` group does not include",
            "A bearer token derived from the session id",
            "A CORS preflight response",
            "Route-model binding and rate limiting",
          ],
          correctIndex: 0,
          explanation:
            "API routes are stateless by default, so the middleware pipeline is injected conditionally. It also forces `session.http_only` to true and `session.same_site` to `lax` for that request.",
        },
        {
          id: "lv-auth-sanctum-spa-q11",
          prompt: "An idle SPA starts getting 401 and 419 responses. What should it do?",
          options: [
            "Treat it as an expired session and send the user back to the login screen, re-fetching the CSRF cookie first",
            "Retry with exponential backoff until a request succeeds",
            "Silently refresh by calling `/sanctum/token`",
            "Fall back to bearer-token authentication",
          ],
          correctIndex: 0,
          explanation:
            "Session-based auth has no refresh token; the documented behaviour is to redirect to login. A response interceptor that redirects on 401/419 is the standard piece of SPA plumbing here.",
        },
        {
          id: "lv-auth-sanctum-spa-q12",
          prompt: "Your SPA is on `spa.io` and the API on `api.dev`. Can Sanctum's cookie mode work?",
          options: [
            "No — the session cookie cannot be scoped to two different registrable domains, so token authentication is the only option",
            "Yes, by adding `spa.io` to `SANCTUM_STATEFUL_DOMAINS`",
            "Yes, by setting `session.same_site` to `none`",
            "Yes, by setting `session.domain` to `*`",
          ],
          correctIndex: 0,
          explanation:
            "This is a browser rule, not a framework one: a cookie set by `api.dev` is never sent to a page on `spa.io`. The stateful-domains list and SameSite settings cannot work around it — different top-level domains mean bearer tokens.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "lv-auth-gates",
      moduleId: "laravel-auth",
      trackId: "php",
      title: "Authorization Gates",
      summary:
        "A gate is a named closure that receives the authenticated user and returns whether they may do something: `Gate::define('view-admin-dashboard', fn (User $user) => $user->is_staff)`. Gates are registered in a service provider's `boot()` method and are the right tool for abilities that are not about a particular model — viewing a dashboard, exporting a report, toggling a feature flag. Anything that answers \"may this user do X *to this record*\" belongs in a policy instead; the split mirrors routes and controllers.\n\nThe return value is richer than a boolean. Returning `Response::allow()` or `Response::deny('You must be an administrator.')` attaches a message that `Gate::authorize()` propagates into the 403 response, and `Gate::inspect()` gives you the full response object when you want to show the reason in the UI. `Response::denyAsNotFound()` returns 404 instead of 403 — the right choice whenever admitting a record exists is itself a disclosure. Meanwhile `Gate::allows()` flattens all of this back to a boolean, so a gate that returns a rich response still reads as `true`/`false` at that call site.\n\nThe hooks are where the surprises live. `Gate::before()` runs ahead of every check and short-circuits on any non-null return — the usual \"super admin can do anything\" switch, and the usual reason a carefully written policy is never consulted. `Gate::after()` runs last but can only fill in a result that is still `null`, so it cannot override a deny. Guests are excluded by default: if the request has no authenticated user, the closure is skipped entirely and the check fails, unless the closure's user parameter is declared nullable (`?User $user`). And `Gate::allowIf()` / `Gate::denyIf()` deliberately bypass the before and after hooks, which is exactly what you want for a one-off inline check and exactly what you do not want if the super-admin bypass was supposed to apply.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Laravel 13: Authorization — Gates", url: "https://laravel.com/framework/docs/13.x/authorization", kind: "docs" },
        { label: "OWASP: Authorization Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", kind: "article" },
        { label: "OWASP Top 10:2025 — A01 Broken Access Control", url: "https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/", kind: "article" },
      ],
      video: {
        title: "30 Days to Learn Laravel, Ep 23 - 6 Steps to Authorization Mastery",
        channel: "Laracasts",
        url: "https://www.youtube.com/watch?v=M1HMtm6hj5Q",
        videoId: "M1HMtm6hj5Q",
        startSeconds: 343,
        chapterLabel: "Step 2 Gate",
        durationLabel: "22:54",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-auth-gates-q1",
          prompt: "When should you reach for a gate rather than a policy?",
          options: [
            "When the ability is not about a specific model — an admin dashboard, an export, a global setting",
            "When the check needs to run inside a Blade template",
            "When the user may be a guest",
            "When the ability involves more than one model",
          ],
          correctIndex: 0,
          explanation:
            "Policies group model-centric rules the way controllers group routes. Both work in Blade, both can handle guests, and both can take extra arguments — the distinction is about what the ability is *about*.",
        },
        {
          id: "lv-auth-gates-q2",
          prompt: "`Gate::define('edit-settings', fn (User $user) => ...)` is checked while nobody is logged in. What happens?",
          options: [
            "The closure is never called and the check fails, because a non-nullable `User` parameter excludes guests",
            "The closure runs with `$user` set to `null`",
            "An `AuthenticationException` is thrown and the user is redirected to login",
            "The check passes, because there is no user to deny",
          ],
          correctIndex: 0,
          explanation:
            "Laravel reflects on the parameter: declaring `?User $user` (or giving it a `null` default) opts the gate into running for guests. Otherwise guests are denied without the closure ever executing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-gates-q3",
          prompt: "What is the difference between `Gate::allows()` and `Gate::authorize()`?",
          options: [
            "`allows()` returns a boolean; `authorize()` throws an `AuthorizationException` that renders as a 403",
            "`allows()` checks gates, `authorize()` checks policies",
            "`allows()` runs the `before` hooks, `authorize()` does not",
            "`authorize()` returns a boolean but also logs the denial",
          ],
          correctIndex: 0,
          explanation:
            "Both go through the same resolution path. `authorize()` is the one to prefer in controllers because forgetting to act on a `false` return is a silent authorization bypass; a thrown exception cannot be ignored.",
        },
        {
          id: "lv-auth-gates-q4",
          prompt:
            "A gate returns `Response::deny('You must be an administrator.')`. What does `Gate::allows('edit-settings')` return?",
          options: [
            "`false` — `allows()` flattens the response to a boolean and the message is discarded",
            "The `Response` object, so the message can be shown",
            "`true`, because a `Response` is a non-null object",
            "It throws, because `allows()` cannot handle response objects",
          ],
          correctIndex: 0,
          explanation:
            "Use `Gate::inspect()` when you want the message, or `Gate::authorize()` to let it reach the 403 page. `allows()` is intentionally boolean, which is why rich denials are so often written and never seen.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-gates-q5",
          prompt: "Which statements about `Gate::before()` and `Gate::after()` are true? (Select all that apply.)",
          options: [
            "`before()` short-circuits every other check when it returns a non-null value",
            "`after()` can only supply a result when the check is still undecided (`null`)",
            "A `before()` hook that returns `true` for admins means model policies are never consulted for them",
            "`after()` can turn a denial into an approval",
            "Both hooks run for `Gate::allowIf()` and `Gate::denyIf()`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`after()` uses a null-coalescing assignment, so it cannot override a decided result, and inline authorization deliberately skips both hooks. The third point is the classic \"why is my policy not running?\" answer.",
        },
        {
          id: "lv-auth-gates-q6",
          prompt: "Why would a gate return `Response::denyAsNotFound()` instead of a plain deny?",
          options: [
            "So the response is a 404 — admitting the resource exists can itself leak information",
            "Because 403 responses are cached by browsers",
            "Because a 404 skips the `after` hooks",
            "To let the frontend retry the request automatically",
          ],
          correctIndex: 0,
          explanation:
            "A 403 on `/invoices/9182` confirms that invoice exists. `denyWithStatus()` gives you any status you like, and `denyAsNotFound()` is the shorthand for the common case.",
        },
        {
          id: "lv-auth-gates-q7",
          prompt: "How do you pass extra context to a gate closure that takes more than a user?",
          options: [
            "Pass an array as the second argument: `Gate::check('create-post', [$category, $pinned])`",
            "Bind the values into the container before checking",
            "Call `Gate::withArguments($category, $pinned)` before `check()`",
            "Gates only ever receive the user; use a policy instead",
          ],
          correctIndex: 0,
          explanation:
            "Array elements are spread into the closure after the user. The same array form works for `authorize()`, `can()` and the Blade directives — with policies, the first element also picks the policy class.",
        },
        {
          id: "lv-auth-gates-q8",
          prompt: "Where should `Gate::define()` calls live in a Laravel 13 application?",
          options: [
            "In the `boot()` method of a service provider, typically `AppServiceProvider`",
            "In `app/Providers/AuthServiceProvider.php`, which is generated with every new app",
            "In `bootstrap/app.php` under `->withMiddleware()`",
            "In `config/auth.php` under a `gates` key",
          ],
          correctIndex: 0,
          explanation:
            "The dedicated `AuthServiceProvider` is no longer part of the default skeleton — the docs put gates in `AppServiceProvider::boot()`. You can still create one; it is just not there by default.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-gates-q9",
          prompt: "What does `Gate::forUser($otherUser)->allows('update-post', $post)` let you do?",
          options: [
            "Run the check against a user who is not the currently authenticated one — useful for admin previews and tests",
            "Temporarily log in as that user",
            "Grant that user the ability permanently",
            "Check the ability with the `before` hooks disabled",
          ],
          correctIndex: 0,
          explanation:
            "Gates default to the authenticated user, but nothing forces that. `forUser()` is the clean way to answer \"could this other account do this?\" without touching the session.",
        },
        {
          id: "lv-auth-gates-q10",
          prompt: "`Gate::any(['update-post', 'delete-post'], $post)` returns true when:",
          options: [
            "At least one of the listed abilities is allowed",
            "All of the listed abilities are allowed",
            "Exactly one of the listed abilities is allowed",
            "None of them are explicitly denied",
          ],
          correctIndex: 0,
          explanation:
            "`any()` is an OR and `none()` is its negation; there is no built-in AND helper because chaining two `allows()` calls already reads clearly.",
        },
      ],
    },

    {
      id: "lv-auth-policies",
      moduleId: "laravel-auth",
      trackId: "php",
      title: "Policies",
      summary:
        "A policy is a plain class whose methods answer \"may this user do X to this record?\" — `PostPolicy::update(User $user, Post $post): bool`. Laravel discovers it by convention: a `Post` model in `app/Models` matches `App\\Policies\\PostPolicy` (it checks `app/Models/Policies` first, then `app/Policies`), or you register it explicitly with `Gate::policy()` or the `#[UsePolicy]` attribute on the model. `make:policy --model=Post` stubs `viewAny`, `view`, `create`, `update`, `delete`, `restore` and `forceDelete`, which is the vocabulary the rest of the framework — resource controllers, `authorizeResource`, the `can` middleware — already speaks.\n\nPolicies are resolved through the container, so you can type-hint dependencies in the constructor. Methods that do not act on an instance — `create`, `viewAny` — take only the user, and you invoke them by passing the class name (`$user->can('create', Post::class)`) instead of a model. A `before()` method on the policy short-circuits every method in that class, which is where per-resource admin overrides belong, in preference to a global `Gate::before()` that applies to everything.\n\nThree behaviours are worth knowing exactly. First, if the policy has no method matching the ability, the check **denies** and `before()` is not called — a typo in `@can('updateX', $post)` fails closed, which is right, and silently, which is why tests matter. Second, guests are denied before the method runs unless the user parameter is nullable. Third, policies are where **IDOR** is actually prevented: `Route::get('/invoices/{invoice}')` with implicit model binding will happily load somebody else's invoice, and the only thing that stops the response being sent is an ownership check in `InvoicePolicy::view()`. That, not authentication, is what OWASP's A01 Broken Access Control is about — and it is the reason `viewAny` exists as a separate ability from `view`: index endpoints need scoping by query, not by policy.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "Laravel 13: Authorization — Creating Policies", url: "https://laravel.com/framework/docs/13.x/authorization", kind: "docs" },
        { label: "OWASP: Insecure Direct Object Reference Prevention", url: "https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html", kind: "article" },
        { label: "PortSwigger: Access control vulnerabilities", url: "https://portswigger.net/web-security/access-control", kind: "article" },
      ],
      video: {
        title: "Master Laravel Authorization — Gates & Policies Explained with Real World Example",
        channel: "Programming Fields",
        url: "https://www.youtube.com/watch?v=vSslBJH02Aw",
        videoId: "vSslBJH02Aw",
        startSeconds: 794,
        chapterLabel: "Create Policy in Laravel",
        durationLabel: "1:20:40",
      },
      alternateVideos: [
        {
          title: "30 Days to Learn Laravel, Ep 23 - 6 Steps to Authorization Mastery",
          channel: "Laracasts",
          url: "https://www.youtube.com/watch?v=M1HMtm6hj5Q",
          videoId: "M1HMtm6hj5Q",
          startSeconds: 1111,
          chapterLabel: "Step 6 Policies",
          durationLabel: "22:54",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-auth-policies-q1",
          prompt: "Where does Laravel look for the policy belonging to `App\\Models\\Order`?",
          options: [
            "`App\\Models\\Policies\\OrderPolicy`, then `App\\Policies\\OrderPolicy`",
            "`App\\Policies\\OrderPolicy` only",
            "Wherever `config/auth.php` maps it",
            "Nowhere — policies must always be registered manually",
          ],
          correctIndex: 0,
          explanation:
            "Discovery looks in a `Policies` directory at or above the model's own directory, and requires the `Policy` suffix. `Gate::policy()` or `#[UsePolicy(OrderPolicy::class)]` on the model override the convention.",
        },
        {
          id: "lv-auth-policies-q2",
          prompt: "`PostPolicy` has no `publish` method. What does `$user->can('publish', $post)` return?",
          options: [
            "`false` — the check fails closed, and the policy's `before()` method is not called either",
            "`true` — undefined abilities default to allowed",
            "It throws a `BadMethodCallException`",
            "It falls back to a closure gate named `publish`",
          ],
          correctIndex: 0,
          explanation:
            "Laravel resolves the policy callback only if the method is callable; otherwise the result is a flat false. Failing closed is correct, but the silence is why a renamed policy method needs a test to catch it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-policies-q3",
          prompt: "How do you authorize an ability whose policy method takes no model instance, such as `create`?",
          options: [
            "Pass the class name: `$user->can('create', Post::class)`",
            "Pass a freshly instantiated empty model: `$user->can('create', new Post)`",
            "Use a gate instead — policies always require an instance",
            "Pass `null` as the second argument",
          ],
          correctIndex: 0,
          explanation:
            "The class name selects the policy, and `callPolicyMethod()` drops a leading string argument before invoking the method, so `create(User $user)` receives only the user. `new Post` also works but implies an object that does not exist yet.",
        },
        {
          id: "lv-auth-policies-q4",
          prompt: "Which are true about a policy's `before()` method? (Select all that apply.)",
          options: [
            "Returning `true` authorizes every ability in that policy",
            "Returning `false` denies every ability in that policy",
            "Returning `null` lets the check fall through to the intended policy method",
            "It runs even when the policy has no method matching the ability",
            "It runs after the policy method, so it can override the result",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The tri-state return is the whole design. It is skipped entirely when the ability has no matching method — a detail the docs call out, and a reason a global admin bypass belongs in `Gate::before()` instead if it must cover everything.",
        },
        {
          id: "lv-auth-policies-q5",
          prompt:
            "`Route::get('/invoices/{invoice}', ...)` uses implicit model binding. A customer requests another customer's invoice id. What stops the leak?",
          options: [
            "Nothing, until an ownership check in `InvoicePolicy::view()` (or an equivalent) is enforced on that route",
            "Route-model binding, which scopes queries to the authenticated user",
            "The `auth` middleware, which rejects access to records the user does not own",
            "Eloquent's global scopes, which are applied to bound models automatically",
          ],
          correctIndex: 0,
          explanation:
            "Binding resolves the id to a model; it has no idea who is asking. This is the canonical IDOR, and it is why OWASP's number one category is broken access control rather than broken authentication.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-policies-q6",
          prompt: "Why does the generated policy stub have both `viewAny` and `view`?",
          options: [
            "`viewAny` authorizes the index endpoint, where there is no single model to check; `view` authorizes one record",
            "`viewAny` is for guests and `view` is for authenticated users",
            "`viewAny` checks the collection after it is loaded, record by record",
            "`viewAny` is a legacy alias kept for backwards compatibility",
          ],
          correctIndex: 0,
          explanation:
            "An index is a different question — \"may you see this kind of thing at all?\" — and the list itself still has to be scoped in the query. Running `view` over every row is both slow and the wrong shape.",
        },
        {
          id: "lv-auth-policies-q7",
          prompt: "A policy method is declared `public function update(?User $user, Post $post): bool`. What does the `?` change?",
          options: [
            "Guests now reach the method, with `$user` as `null`, instead of being denied before it runs",
            "It allows the method to be called with a user from another guard",
            "It makes the method optional during policy discovery",
            "It lets the method return `null` to defer to a gate",
          ],
          correctIndex: 0,
          explanation:
            "Laravel reflects on the parameter to decide whether guests are eligible. Once you opt in, the null case is yours to handle — `$user?->id === $post->user_id` is the idiomatic body.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-policies-q8",
          prompt: "A policy method returns `Response::deny('You do not own this post.')`. Where does the message surface?",
          options: [
            "In the 403 produced by `Gate::authorize()` or `$this->authorize()`, and via `Gate::inspect()->message()`",
            "In the application log only",
            "As a validation error on the previous page",
            "Nowhere — policies may only return booleans",
          ],
          correctIndex: 0,
          explanation:
            "`AuthorizationException` carries the response, and the exception handler renders its message. A boolean `false` produces the generic \"This action is unauthorized.\" instead.",
        },
        {
          id: "lv-auth-policies-q9",
          prompt: "Policies are resolved via the service container. What does that buy you?",
          options: [
            "Constructor injection — a policy can type-hint a subscription service or a feature-flag client",
            "Automatic caching of policy results for the request",
            "Policies become singletons shared across requests",
            "Policy methods can be queued",
          ],
          correctIndex: 0,
          explanation:
            "It keeps non-trivial rules testable: inject the collaborator, mock it in tests. There is no result caching, so an expensive policy called in a loop over 200 rows costs 200 evaluations.",
        },
        {
          id: "lv-auth-policies-q10",
          prompt: "Which of these are sensible things to put in a policy? (Select all that apply.)",
          options: [
            "\"The post belongs to the user\"",
            "\"The user's subscription is active\"",
            "\"The post is still within its editable window\"",
            "\"The title is at least 10 characters long\"",
            "\"The slug is unique\"",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Ownership, entitlement and state-based permission are authorization. Field shape and uniqueness are validation — putting them in a policy produces a 403 where the user deserves a 422 and a message.",
        },
        {
          id: "lv-auth-policies-q11",
          prompt:
            "A `FormRequest`'s `authorize()` method returns `false`. What does the client receive, and does the controller run?",
          options: [
            "A 403, and the controller action never runs",
            "A 422 with validation errors, and the controller never runs",
            "A 401, and the controller never runs",
            "A 403, but only after validation has passed",
          ],
          correctIndex: 0,
          explanation:
            "`failedAuthorization()` throws an `AuthorizationException`, which renders as 403. Authorization is checked before the rules run, which is why a request the user may not make never reveals which fields were invalid.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-policies-q12",
          prompt: "An index page renders 50 posts and calls `@can('update', $post)` for each. What is the performance concern?",
          options: [
            "The policy runs 50 times, and if it touches a relationship it will issue 50 queries unless the relation is eager-loaded",
            "Blade caches the first result and reuses it for all 50, producing wrong output",
            "Each call opens a new database transaction",
            "None — Laravel memoises policy results per ability",
          ],
          correctIndex: 0,
          explanation:
            "There is no result cache, so a policy body like `$user->teams->contains($post->team_id)` is an N+1 in disguise. Eager-load what the policy reads, or pre-compute the permitted ids once.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "lv-auth-enforcing",
      moduleId: "laravel-auth",
      trackId: "php",
      title: "Enforcing Authorization: authorize(), can, @can and #[Authorize]",
      summary:
        "Gates and policies decide; something has to *ask*. Laravel gives you five call sites and they are not interchangeable. `Gate::authorize('update', $post)` (or `$this->authorize(...)` in a controller) throws on failure and is the safest default, because a forgotten return value cannot silently allow the action. `$user->can('update', $post)` returns a boolean and is for branching. `@can('update', $post)` in Blade hides UI. The `can` middleware — `->middleware('can:update,post')` or the fluent `->can('update', 'post')` — runs before the controller and resolves route parameters by name. And Laravel 13's `#[Authorize('update', 'post')]` attribute on a controller method is the same middleware, declared where the action is.\n\nThe attribute deserves a close read of its second argument, because it is overloaded. A bare string is a **route parameter name**: `#[Authorize('delete', 'comment')]` on `destroy(Comment $comment)` passes the bound model. An array is `[ModelClass, 'param']`: `#[Authorize('create', [Comment::class, 'post'])]` on `store(Post $post)` selects `CommentPolicy` — because the ability is about creating a comment — while passing the bound `$post` as context. Getting that backwards produces a policy call against the wrong class, which usually fails closed and looks like a bug in the policy.\n\nThe important habit is remembering that hiding a button is not authorization. `@can` is a UX affordance; the POST route behind it is still reachable by anyone who can type a URL, so every `@can` in a template needs a matching check on the server. Equally, route middleware only protects the *route* — a model updated from a queued job, an Artisan command or a nested relationship never passes through it. That is the argument for putting the check in the controller (or the `FormRequest::authorize()`) rather than only on the route, and for treating the policy as the single source of truth that every entry point calls.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel 13: Authorization — Authorizing Actions Using Policies", url: "https://laravel.com/framework/docs/13.x/authorization", kind: "docs" },
        { label: "Laravel 13: Controllers — Authorization Attributes", url: "https://laravel.com/framework/docs/13.x/controllers", kind: "docs" },
        { label: "Laravel 13: Blade Templates", url: "https://laravel.com/framework/docs/13.x/blade", kind: "docs" },
        { label: "OWASP: Authorization Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "Laravel Policies: AuthorizeResource and \"can:ABC\" Usage",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=Q3YQVEJIQbo",
        videoId: "Q3YQVEJIQbo",
        durationLabel: "3:34",
      },
      alternateVideos: [
        {
          title: "30 Days to Learn Laravel, Ep 23 - 6 Steps to Authorization Mastery",
          channel: "Laracasts",
          url: "https://www.youtube.com/watch?v=M1HMtm6hj5Q",
          videoId: "M1HMtm6hj5Q",
          startSeconds: 721,
          chapterLabel: "Step 5 Middleware",
          durationLabel: "22:54",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-auth-enforcing-q1",
          prompt: "Why prefer `Gate::authorize('update', $post)` over `if (! Gate::allows('update', $post)) { abort(403); }`?",
          options: [
            "It cannot be silently ignored — forgetting to act on a boolean is an authorization bypass, while an unhandled exception is not",
            "It is faster, because it skips the `before` hooks",
            "It returns the policy's response object for the view",
            "`allows()` does not work with policies, only gates",
          ],
          correctIndex: 0,
          explanation:
            "Both resolve identically; the difference is failure mode. The throwing form also propagates a `Response::deny()` message into the 403, which the boolean form discards.",
        },
        {
          id: "lv-auth-enforcing-q2",
          prompt: "What does the second argument of `can:update,post` refer to?",
          options: [
            "The name of the route parameter whose bound model is passed to the policy",
            "The name of the policy class, lower-cased",
            "The name of the model's table",
            "The request input field holding the model id",
          ],
          correctIndex: 0,
          explanation:
            "`Authorize::getGateArguments()` resolves each name with `$request->route($name)`, so with implicit binding the policy receives the model. A string containing a backslash is treated as a class name instead.",
        },
        {
          id: "lv-auth-enforcing-q3",
          prompt:
            "Which controller method does `#[Authorize('create', [Comment::class, 'post'])]` belong on, and which policy does it call?",
          options: [
            "`store(Post $post)` — it calls `CommentPolicy::create()`, passing the bound `$post` as context",
            "`store(Comment $comment)` — it calls `PostPolicy::create()` with the comment",
            "`index(Post $post)` — it calls `PostPolicy::create()` with the class name",
            "Any method — the array form only documents the relationship",
          ],
          correctIndex: 0,
          explanation:
            "The array's first element picks the policy (the thing being created), and the rest name route parameters passed as arguments. Swapping them is the usual mistake, and it fails closed against the wrong policy.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-enforcing-q4",
          prompt: "Which of these are equivalent ways to enforce the same policy check? (Select all that apply.)",
          options: [
            "`Route::put('/post/{post}', ...)->middleware('can:update,post')`",
            "`Route::put('/post/{post}', ...)->can('update', 'post')`",
            "`#[Authorize('update', 'post')]` on the controller method",
            "`@can('update', $post)` around the edit form in the Blade view",
            "Adding `update` to the `$fillable` array on the model",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three are the same `Authorize` middleware declared three ways. The Blade directive only decides what is rendered, and `$fillable` is mass-assignment protection, which is a different concern entirely.",
        },
        {
          id: "lv-auth-enforcing-q5",
          prompt: "A page hides the delete button with `@cannot('delete', $post)`. Is the delete route protected?",
          options: [
            "No — Blade only controls rendering; the route needs its own check",
            "Yes, because `@cannot` registers the ability with the router",
            "Yes, provided the route is inside the `web` middleware group",
            "Only for non-JavaScript clients",
          ],
          correctIndex: 0,
          explanation:
            "Hiding UI is an affordance, not a control. Anyone can issue the request directly, which is why every template-level check should have a server-side twin.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-enforcing-q6",
          prompt: "What does `@canany(['update', 'view', 'delete'], $post)` do?",
          options: [
            "Renders its block if at least one of the abilities is allowed",
            "Renders its block only if all three are allowed",
            "Renders once per allowed ability",
            "Checks the abilities against the `can` middleware rather than the gate",
          ],
          correctIndex: 0,
          explanation:
            "It is the Blade counterpart of `Gate::any()`, useful for showing an actions menu when the user can do anything at all with a record. `@elsecanany` provides the fallback branch.",
        },
        {
          id: "lv-auth-enforcing-q7",
          prompt: "`authorizeResource(Post::class, 'post')` in a controller constructor does what?",
          options: [
            "Attaches the `can` middleware to each resource action, mapping `index`→`viewAny`, `show`→`view`, `store`→`create` and so on",
            "Generates a policy class for the model",
            "Registers the controller's routes with `Route::resource()`",
            "Authorizes every action against the `view` ability",
          ],
          correctIndex: 0,
          explanation:
            "It is the bulk version of writing seven `#[Authorize]` attributes, and it is why the generated policy stub uses exactly those method names. Non-resource actions still need their own checks.",
        },
        {
          id: "lv-auth-enforcing-q8",
          prompt: "A model is updated by a queued job. Does route middleware protect that write?",
          options: [
            "No — middleware only runs for HTTP requests; the job must call the policy itself if the rule applies there",
            "Yes, because the job runs inside the same application instance",
            "Yes, if the job is dispatched from a protected route",
            "No, and policies cannot be called outside an HTTP request",
          ],
          correctIndex: 0,
          explanation:
            "Queued jobs, Artisan commands and model events bypass the entire HTTP middleware stack. `Gate::forUser($user)->authorize(...)` works fine in a job when the check genuinely applies to the actor.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-enforcing-q9",
          prompt: "Which middleware alias maps to `Illuminate\\Auth\\Middleware\\Authorize`?",
          options: ["`can`", "`authorize`", "`policy`", "`gate`"],
          correctIndex: 0,
          explanation:
            "The default aliases are `auth`, `auth.basic`, `auth.session`, `can`, `guest`, `password.confirm`, `signed`, `throttle` and `verified`. Anything else has to be registered in `bootstrap/app.php`.",
        },
        {
          id: "lv-auth-enforcing-q10",
          prompt: "How do you authorize an ability that needs extra context, such as the category a post is being moved into?",
          options: [
            "Pass an array: `Gate::authorize('update', [$post, $request->category])` — the first element picks the policy, the rest are extra parameters",
            "Set the context on the request and read it inside the policy",
            "Define a separate gate, since policies take exactly one model",
            "Pass the context as a third argument to `authorize()`",
          ],
          correctIndex: 0,
          explanation:
            "The policy method signature becomes `update(User $user, Post $post, int $category)`. The same array form works for `can()`, the Blade directives and `Gate::check()`.",
        },
        {
          id: "lv-auth-enforcing-q11",
          prompt:
            "A `can` middleware check passes for an admin who is allowed by a global `Gate::before()`, but the same admin gets a 403 from `Gate::allowIf(...)` used inline elsewhere. Why?",
          options: [
            "Inline authorization (`allowIf`/`denyIf`) deliberately skips the `before` and `after` hooks",
            "`allowIf()` only works for gates, not policies",
            "The middleware caches the earlier result for the request",
            "`allowIf()` requires the user to be authenticated via the `web` guard specifically",
          ],
          correctIndex: 0,
          explanation:
            "That is documented behaviour: inline checks evaluate only the condition you give them. It is a reasonable default for a one-off rule, and a genuine trap when a super-admin bypass was expected to apply everywhere.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "lv-auth-roles-permissions",
      moduleId: "laravel-auth",
      trackId: "php",
      title: "Roles and Permissions (and Why Laravel Ships None)",
      summary:
        "Laravel has no `roles` table, no `hasRole()`, no `Role` model. That is a design decision, not an omission: roles are a *data model*, and every application's is different — flat roles, roles scoped to a team, permissions granted directly to users, permissions inherited through a hierarchy. The framework supplies the enforcement point (gates and policies) and leaves the shape of the data to you, which is why the documentation explicitly warns against confusing guards and providers with roles and permissions.\n\nThe clean way to use both is to let roles decide *inputs* and policies decide *outcomes*. A policy method says `return $user->hasPermission('invoice.refund') && $invoice->company_id === $user->company_id;` — the role system answers the coarse question and the policy still enforces ownership. Skipping that second half is how RBAC turns into broken access control: \"is an accountant\" is not the same claim as \"is an accountant *at this company*\", and a pure role check answers only the first. It is also why permission names should describe abilities (`invoice.refund`), not job titles (`is_accountant`) — job titles hard-code today's org chart into every call site.\n\nFor most teams the pragmatic ladder is: start with a single `role` column or an enum and a `Gate::before()` for the admin bypass; move to a permissions table when the answer to \"who can do X?\" stops being a straight function of one column; reach for `spatie/laravel-permission` when you need roles, permissions, direct grants, caching and team scoping and would otherwise build all of it. The package's own guidance is the same — it is a data layer, not an authorization layer, and it expects you to keep asking `$user->can(...)` so that policies remain the single enforcement point. Its one real operational gotcha is the permission cache: changing roles or permissions in code or a seeder without flushing that cache leaves stale answers until the TTL passes.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel 13: Authorization", url: "https://laravel.com/framework/docs/13.x/authorization", kind: "docs" },
        { label: "spatie/laravel-permission: Introduction", url: "https://spatie.be/docs/laravel-permission/v8/introduction", kind: "docs" },
        { label: "spatie/laravel-permission on GitHub", url: "https://github.com/spatie/laravel-permission", kind: "repo" },
        { label: "OWASP: Authorization Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "spatie/laravel-permission: WHEN to Use the Package for Roles?",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=frf55X2q9X0",
        videoId: "frf55X2q9X0",
        durationLabel: "6:48",
      },
      alternateVideos: [
        {
          title: "Authorization Explained: When to Use RBAC, ABAC, ACL & More",
          channel: "Hayk Simonyan",
          url: "https://www.youtube.com/watch?v=DT6Zy1X3ytM",
          videoId: "DT6Zy1X3ytM",
          durationLabel: "11:02",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-auth-roles-permissions-q1",
          prompt: "Why does Laravel not ship a roles-and-permissions system?",
          options: [
            "Roles are a data model that differs per application; the framework supplies the enforcement point and leaves the schema to you",
            "Because roles are handled by Sanctum's abilities",
            "Because the maintainers consider RBAC insecure",
            "Because `config/auth.php` already defines roles through guards",
          ],
          correctIndex: 0,
          explanation:
            "Flat roles, team-scoped roles, direct permissions and hierarchies are all reasonable; no single schema fits. The docs specifically warn against reading guards and providers as roles and permissions.",
        },
        {
          id: "lv-auth-roles-permissions-q2",
          prompt: "What is wrong with `if ($user->role === 'accountant') { $invoice->refund(); }`?",
          options: [
            "It checks the role but not the relationship — an accountant at another company passes",
            "String comparison is slower than an enum comparison",
            "Roles should be checked with `Gate::allows()` rather than `===`",
            "Nothing, provided the role column is indexed",
          ],
          correctIndex: 0,
          explanation:
            "This is broken access control in one line. \"Is an accountant\" and \"is an accountant at this company\" are different claims; the policy has to answer the second.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-roles-permissions-q3",
          prompt: "Which of these are good reasons to add a permissions package rather than a `role` column? (Select all that apply.)",
          options: [
            "Administrators need to change who can do what without a deploy",
            "Users can hold several roles at once, and permissions can also be granted directly",
            "Permissions must be scoped per team or tenant",
            "You want authorization checks to be faster",
            "You want to stop writing policies",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Runtime configurability, many-to-many grants and tenancy are the cases a column cannot cover. A package adds queries rather than removing them, and it is a data layer — policies remain the enforcement point.",
        },
        {
          id: "lv-auth-roles-permissions-q4",
          prompt: "Why name permissions `invoice.refund` rather than `is_accountant`?",
          options: [
            "Permissions describe abilities, so call sites survive a reorganisation that renames or splits the role",
            "Dots are required by `Gate::define()`",
            "Job titles cannot be stored in the database",
            "Because ability names must match policy method names exactly",
          ],
          correctIndex: 0,
          explanation:
            "Job-title checks scatter the org chart across the codebase; the day \"accountant\" splits into two roles you have to touch every call site. Ability names change only when the ability itself does.",
        },
        {
          id: "lv-auth-roles-permissions-q5",
          prompt: "What is the cleanest way to wire a permissions package into Laravel's own authorization?",
          options: [
            "Call the permission check inside policy methods, so `$user->can('refund', $invoice)` stays the only thing controllers use",
            "Replace every policy with a `hasPermissionTo()` check in the controller",
            "Register each permission as a separate guard in `config/auth.php`",
            "Use the package's middleware on every route and skip policies entirely",
          ],
          correctIndex: 0,
          explanation:
            "One enforcement vocabulary means one place to audit. It also keeps the ownership half of the rule next to the permission half, which is exactly where it needs to be.",
        },
        {
          id: "lv-auth-roles-permissions-q6",
          prompt: "You add a global `Gate::before(fn ($user) => $user->isSuperAdmin() ? true : null)`. What is the risk?",
          options: [
            "Every policy is bypassed for super admins, including ones written later that were meant to deny them — such as \"nobody may delete an audit log\"",
            "It causes infinite recursion when a policy calls `$user->can()`",
            "It disables the `can` middleware",
            "It prevents `Gate::inspect()` from returning messages",
          ],
          correctIndex: 0,
          explanation:
            "Returning non-null short-circuits everything. A policy-level `before()` limits the blast radius to one resource, and returning `null` for abilities that should never be bypassed is the surgical fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-roles-permissions-q7",
          prompt: "An index page calls `$user->hasPermissionTo('invoice.view')` inside a loop over 200 invoices. What is the concern?",
          options: [
            "Repeated permission lookups per row — cache the answer once before the loop, or rely on the package's permission cache",
            "The permission check mutates the user model",
            "Permissions cannot be checked more than once per request",
            "Each check opens a transaction",
          ],
          correctIndex: 0,
          explanation:
            "The answer does not vary per row, so hoist it. Permission packages cache their tables, but the per-user relation still has to be loaded, and an unconsidered loop is a classic profile surprise.",
        },
        {
          id: "lv-auth-roles-permissions-q8",
          prompt: "A seeder creates new permissions but the application still denies them. What is the most likely cause?",
          options: [
            "The permission cache was not flushed after the seeder wrote the rows",
            "Permissions must be registered in `config/auth.php` as well",
            "The seeder ran before the migrations",
            "Permission names are case-sensitive and were stored upper-case",
          ],
          correctIndex: 0,
          explanation:
            "Permission tables are cached to keep checks cheap, so writes made outside the package's own API — or from a seeder — leave stale data until the cache is reset. It is the package's single most-reported issue.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-roles-permissions-q9",
          prompt: "How do RBAC and ABAC differ, and where does Laravel sit?",
          options: [
            "RBAC grants by role, ABAC by attributes of user, resource and context; a policy method can express either, and usually expresses both",
            "RBAC is for users and ABAC is for API tokens",
            "Laravel's gates are RBAC and its policies are ABAC",
            "ABAC replaced RBAC and Laravel only supports ABAC",
          ],
          correctIndex: 0,
          explanation:
            "A policy body is arbitrary PHP, so it can read a role, an ownership column, a time window and a subscription state in one expression. Real systems are nearly always a hybrid.",
        },
        {
          id: "lv-auth-roles-permissions-q10",
          prompt: "Your app has exactly two kinds of user, staff and customer, and that will not change. What is the proportionate design?",
          options: [
            "A single column or enum on `users`, a `Gate::before()` or policy checks that read it, and no package",
            "A full roles-and-permissions package, so the schema is future-proof",
            "Two auth guards, one per user type",
            "Sanctum abilities named `staff` and `customer`",
          ],
          correctIndex: 0,
          explanation:
            "A permissions package is warranted when the data genuinely needs it. Separate guards are for separate *identities* (different tables or models), not for two flavours of the same user, and token abilities constrain a client, not a person.",
        },
      ],
    },

    {
      id: "lv-auth-csrf",
      moduleId: "laravel-auth",
      trackId: "php",
      title: "CSRF and PreventRequestForgery",
      summary:
        "CSRF works because browsers attach cookies to cross-site requests automatically: an attacker's page can POST to your `/user/email` route and the victim's session cookie rides along. The defence is to demand something the attacker's page cannot obtain. Laravel 13 replaced `VerifyCsrfToken` with **`PreventRequestForgery`** in the `web` middleware group, and it uses two layers rather than one.\n\nThe first layer is origin verification. Modern browsers send `Sec-Fetch-Site` on every request, and the value is set by the browser, not the page — a cross-site form POST cannot claim `same-origin`. If the header says `same-origin`, the request is allowed with no token at all. Everything else falls through to layer two, the familiar session token: `_token` in the body, `X-CSRF-TOKEN`, or the decrypted `X-XSRF-TOKEN` header, compared with `hash_equals()`. The order of checks in the middleware is read-verb → test environment → excluded URI → origin → token, and a failure throws `TokenMismatchException`, which renders as **419**.\n\nTwo knobs change the shape of this. `preventRequestForgery(originOnly: true)` drops the token fallback entirely — cleaner, no hidden fields, no `XSRF-TOKEN` cookie — but any client that does not send `Sec-Fetch-Site` is locked out, and failures become **403** (`OriginMismatchException`) rather than 419. `allowSameSite: true` accepts `same-site` as well as `same-origin`, which you need when `dashboard.example.com` legitimately receives posts from `example.com`. The trap in both modes is scope: `PreventRequestForgery` only runs for routes in the `web` group, so a route defined outside it — or a Stripe webhook you excluded — has no CSRF protection, which is correct for a webhook authenticated by signature and a hole for anything else. And GET is never checked, so a state-changing GET route is unprotected by construction.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel 13: CSRF Protection", url: "https://laravel.com/framework/docs/13.x/csrf", kind: "docs" },
        { label: "MDN: Sec-Fetch-Site", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site", kind: "docs" },
        { label: "OWASP: Cross-Site Request Forgery Prevention", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "Laravel CSRF explained",
        channel: "cdruc",
        url: "https://www.youtube.com/watch?v=B94PrMw4Eog",
        videoId: "B94PrMw4Eog",
        durationLabel: "9:42",
      },
      alternateVideos: [
        {
          title: "NEW Laravel 13: Main Things You Need to Know",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=KSowC1CsqmQ",
          videoId: "KSowC1CsqmQ",
          durationLabel: "8:45",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-auth-csrf-q1",
          prompt: "Which middleware provides CSRF protection in Laravel 13's `web` group?",
          options: [
            "`Illuminate\\Foundation\\Http\\Middleware\\PreventRequestForgery`",
            "`Illuminate\\Foundation\\Http\\Middleware\\VerifyCsrfToken`",
            "`Illuminate\\Session\\Middleware\\StartSession`",
            "`Illuminate\\Cookie\\Middleware\\EncryptCookies`",
          ],
          correctIndex: 0,
          explanation:
            "`PreventRequestForgery` replaced `VerifyCsrfToken` in the default `web` group and added origin verification alongside the token check. Almost every tutorial online still names the old class.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-csrf-q2",
          prompt: "What is the first thing `PreventRequestForgery` checks after ruling out read verbs, tests and excluded URIs?",
          options: [
            "The `Sec-Fetch-Site` header — `same-origin` passes with no token required",
            "The `_token` field in the request body",
            "The `Referer` header against `app.url`",
            "Whether the session has been started",
          ],
          correctIndex: 0,
          explanation:
            "Origin verification runs first because it is free and cannot be forged by a cross-site page: browsers set `Sec-Fetch-Site` themselves. The token check is the fallback for anything that does not pass it.",
        },
        {
          id: "lv-auth-csrf-q3",
          prompt: "A CSRF token mismatch produces which HTTP status?",
          options: ["419", "403", "401", "422"],
          correctIndex: 0,
          explanation:
            "`TokenMismatchException` maps to 419 — a Laravel convention rather than a standard code. In `originOnly` mode the failure is an `OriginMismatchException`, which maps to 403 instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-csrf-q4",
          prompt: "From which sources will the middleware accept a CSRF token? (Select all that apply.)",
          options: [
            "A `_token` field in the request body",
            "An `X-CSRF-TOKEN` header",
            "An `X-XSRF-TOKEN` header, decrypted from the cookie value",
            "A `csrf_token` query-string parameter",
            "The `XSRF-TOKEN` cookie on its own, with no header",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The cookie alone can never count — the whole point is that the client must *read* it and echo it back, which same-origin policy prevents an attacker's page from doing. A query parameter is not accepted.",
        },
        {
          id: "lv-auth-csrf-q5",
          prompt: "What does `preventRequestForgery(originOnly: true)` change?",
          options: [
            "The token fallback is removed, no `XSRF-TOKEN` cookie is set, and failures return 403 instead of 419",
            "Only the `Origin` header is checked, ignoring `Sec-Fetch-Site`",
            "CSRF protection is disabled for API routes",
            "Tokens are still required, but only for same-origin requests",
          ],
          correctIndex: 0,
          explanation:
            "It is a simpler, tokenless model — and a strict one, because anything not sending `Sec-Fetch-Site` is rejected. The docs note the header is only available over secure connections, so it is not a universal default.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-csrf-q6",
          prompt: "`dashboard.example.com` must accept form posts from `example.com`. What is the correct setting?",
          options: [
            "`preventRequestForgery(allowSameSite: true)`, so `Sec-Fetch-Site: same-site` also passes",
            "Add `example.com` to the `except` array",
            "`preventRequestForgery(originOnly: true)`",
            "Set `session.same_site` to `none`",
          ],
          correctIndex: 0,
          explanation:
            "`same-origin` means identical scheme, host and port; a sibling subdomain reports `same-site`. Excluding the URI would disable the check entirely, which is a much bigger change than widening it by one step.",
        },
        {
          id: "lv-auth-csrf-q7",
          prompt: "Why is it acceptable to exclude a Stripe webhook route from CSRF protection?",
          options: [
            "It is not a browser request with ambient cookies, and it is authenticated by a signature header instead",
            "Because webhooks always use GET",
            "Because Stripe sends `Sec-Fetch-Site: same-origin`",
            "Because the route is inside the `api` group and is exempt anyway",
          ],
          correctIndex: 0,
          explanation:
            "CSRF is specifically about a browser attaching credentials the user did not intend to send. A server-to-server call carries no session cookie, so there is nothing to forge — but it must still verify the signature.",
        },
        {
          id: "lv-auth-csrf-q8",
          prompt: "A route defined outside the `web` middleware group accepts a POST with no token and succeeds. Why?",
          options: [
            "`PreventRequestForgery` is part of the `web` group; a route outside it never runs the check",
            "POST requests are only checked when a session already exists",
            "The middleware skips routes without a `_token` field",
            "CSRF checks are disabled unless `APP_DEBUG` is false",
          ],
          correctIndex: 0,
          explanation:
            "This is the most common accidental hole, and it is also the documented way to exempt webhooks. If the route is reachable by a browser carrying a session cookie, it belongs in the `web` group.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-csrf-q9",
          prompt: "Why does the middleware compare tokens with `hash_equals()` rather than `===`?",
          options: [
            "Constant-time comparison, so response timing cannot reveal how much of the token an attacker guessed correctly",
            "Because `===` fails on strings of different lengths",
            "Because the stored token is hashed and `hash_equals()` unhashes it",
            "For Unicode normalisation before comparing",
          ],
          correctIndex: 0,
          explanation:
            "`===` short-circuits at the first differing byte. The attack is largely theoretical over a network, but constant-time comparison is the correct habit for every secret comparison.",
        },
        {
          id: "lv-auth-csrf-q10",
          prompt: "A route is defined as `Route::get('/posts/{post}/delete', ...)`. What is the CSRF problem?",
          options: [
            "GET is never checked, so a link or image tag on any site can trigger the delete",
            "GET routes cannot receive the `_token` field",
            "GET requests fail origin verification and always 419",
            "None — CSRF only applies to forms",
          ],
          correctIndex: 0,
          explanation:
            "`isReading()` exempts HEAD, GET and OPTIONS because safe methods are not supposed to change state. Routing a destructive action through GET opts out of the protection by construction.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-csrf-q11",
          prompt: "Users who leave a form open for a long time report 419 errors on submit. What is happening, and what helps?",
          options: [
            "The session expired and its token with it; refreshing the token client-side, or warning before expiry, is kinder than a raw error page",
            "The token is single-use and was consumed by a background request",
            "The `XSRF-TOKEN` cookie expires after 10 minutes regardless of the session",
            "The token rotates on every request, so any delay invalidates it",
          ],
          correctIndex: 0,
          explanation:
            "The token lives in the session, so it dies with it; it is not single-use and does not rotate per request. Rendering a useful 419 page that preserves the user's input is the difference between an annoyance and a lost form.",
        },
        {
          id: "lv-auth-csrf-q12",
          prompt: "Why does Laravel also set an `XSRF-TOKEN` cookie when the token is already in the session?",
          options: [
            "So JavaScript clients can read it and echo it in `X-XSRF-TOKEN` — Axios and Angular do this automatically",
            "So the session can be reconstructed if the session cookie is lost",
            "Because the middleware reads the token from that cookie rather than the session",
            "To let subdomains share a single CSRF token",
          ],
          correctIndex: 0,
          explanation:
            "It is a developer convenience for XHR clients, and the reason it is safe is that only same-origin script can read it. Sanctum's `/sanctum/csrf-cookie` endpoint exists to prime exactly this cookie for an SPA.",
        },
      ],
    },

    {
      id: "lv-auth-hardening",
      moduleId: "laravel-auth",
      trackId: "php",
      title: "Login Throttling, Password Confirmation and Two-Factor",
      summary:
        "A correct login endpoint is still an unlocked door if an attacker may try it ten thousand times. Laravel's answer is named rate limiters: `RateLimiter::for('login', fn ($request) => Limit::perMinute(5)->by($request->input('email').$request->ip()))` in a service provider, attached with `->middleware('throttle:login')`. Keying by email *and* IP is deliberate — by IP alone and an office behind one NAT locks itself out; by email alone and an attacker locks legitimate users out on purpose. Returning an array of limits lets you have both a generous global ceiling and a tight per-account one. Exceeding a limit produces a **429** with `Retry-After` and `X-RateLimit-*` headers.\n\nTwo defaults are worth knowing. The `api` middleware group in a fresh Laravel 13 app contains only `SubstituteBindings` — **there is no throttle middleware by default**, so an API is unlimited until you add one. And the bare `throttle:60,1` form keys on the authenticated user id when there is one and on `domain|ip` otherwise, which is exactly the wrong shape for a login route where nobody is authenticated yet. Rate limiting also belongs on password-reset requests, verification resends and anything that sends email or costs CPU; `Limit::perMinute(...)->after(...)` can even count only the responses you care about, such as 404s, to blunt enumeration.\n\nThrottling limits guessing; the other two features limit the damage of a session that is already open. The `password.confirm` middleware demands a recent password re-entry before sensitive routes — `auth.password_timeout` is 10800 seconds (three hours) by default, and the middleware returns **423 Locked** to JSON clients rather than redirecting. Two-factor, provided by Fortify and enabled in the starter kits, adds a TOTP challenge: the user scans a QR code, confirms one code to prove the authenticator is set up, and gets recovery codes for the day the phone is lost. Fortify gates enabling and disabling 2FA behind password confirmation for a reason — without it, an attacker on a hijacked session could bind their own authenticator and lock the real owner out.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel 13: Routing — Rate Limiting", url: "https://laravel.com/framework/docs/13.x/routing", kind: "docs" },
        { label: "Laravel 13: Fortify — Two-Factor Authentication", url: "https://laravel.com/framework/docs/13.x/fortify", kind: "docs" },
        { label: "OWASP: Credential Stuffing Prevention", url: "https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html", kind: "article" },
        { label: "OWASP: Multifactor Authentication Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "Exploring Laravel Rate Limiters: Control Traffic & Secure Actions ⛔",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=5YlJ8DllTFw",
        videoId: "5YlJ8DllTFw",
        durationLabel: "6:42",
      },
      alternateVideos: [
        {
          title: "Two-Factor Authentication Now Available in Laravel Starter Kits",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=4osPfTw-FB0",
          videoId: "4osPfTw-FB0",
          durationLabel: "3:28",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-auth-hardening-q1",
          prompt: "What middleware does a fresh Laravel 13 application's `api` group contain?",
          options: [
            "`SubstituteBindings` only — nothing is throttled until you add it yourself",
            "`throttle:api` and `SubstituteBindings`",
            "`EnsureFrontendRequestsAreStateful`, `throttle:api` and `SubstituteBindings`",
            "The same middleware as the `web` group, minus `StartSession`",
          ],
          correctIndex: 0,
          explanation:
            "Assuming API routes are throttled out of the box is a common and expensive mistake. Adding `throttle` to the api group, or to specific routes, is a deliberate step.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-hardening-q2",
          prompt: "Why does the documented login limiter key on `$request->input('email').$request->ip()` rather than on either alone?",
          options: [
            "By IP alone, one office behind a NAT locks itself out; by email alone, an attacker can deliberately lock a chosen user out",
            "Because the rate limiter requires a composite key",
            "Because the email alone is not unique enough to be a cache key",
            "To avoid storing IP addresses, which is a GDPR requirement",
          ],
          correctIndex: 0,
          explanation:
            "Both failure modes are real: shared egress IPs are normal, and a pure per-account limit turns throttling into a denial-of-service tool. Combining them narrows the bucket to one attacker against one account.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-hardening-q3",
          prompt: "What status and headers does a request that exceeds a rate limit receive?",
          options: [
            "429, with `Retry-After` and `X-RateLimit-Limit` / `X-RateLimit-Remaining`",
            "503, with `Retry-After`",
            "403, with no additional headers",
            "419, with `X-RateLimit-Reset`",
          ],
          correctIndex: 0,
          explanation:
            "429 Too Many Requests is the standard code, and the headers tell a well-behaved client when to come back. `Limit::response()` lets you replace the body while keeping the headers.",
        },
        {
          id: "lv-auth-hardening-q4",
          prompt:
            "A route uses the bare `throttle:60,1`. For unauthenticated requests, what is the bucket keyed on?",
          options: [
            "The route's domain plus the client IP address",
            "The session id",
            "The route name",
            "The `User-Agent` header plus the IP address",
          ],
          correctIndex: 0,
          explanation:
            "`resolveRequestSignature()` uses the authenticated user's id when there is one and falls back to `domain|ip`. That is fine for a general API and wrong for a login route, where a named limiter keyed by credentials is what you want.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-hardening-q5",
          prompt: "Which endpoints deserve their own rate limit beyond login? (Select all that apply.)",
          options: [
            "Password-reset requests, which send email",
            "Email-verification resends",
            "Any endpoint that returns 404 for ids the caller may be enumerating",
            "Static asset routes served by the framework",
            "The health-check endpoint your load balancer polls",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything that costs money, sends mail or reveals existence is worth limiting — `Limit::perMinute(...)->after(...)` can count only the 404s. Throttling a load-balancer health check just makes your app look unhealthy.",
        },
        {
          id: "lv-auth-hardening-q6",
          prompt: "What does the `password.confirm` middleware do, and what is its default window?",
          options: [
            "Requires a recent password re-entry before the route runs, defaulting to three hours (`auth.password_timeout` = 10800 seconds)",
            "Requires the `password_confirmation` field on every POST, with no timeout",
            "Forces a password change every 90 days",
            "Requires the user to confirm their password once per session",
          ],
          correctIndex: 0,
          explanation:
            "`$request->session()->passwordConfirmed()` stamps the session, and the middleware compares against the timeout. It is the right gate for changing an email address, deleting an account or managing 2FA.",
        },
        {
          id: "lv-auth-hardening-q7",
          prompt: "A JSON client hits a `password.confirm`-protected route without having confirmed. What does it get?",
          options: [
            "423 Locked with a `Password confirmation required.` message",
            "302 to the `password.confirm` route",
            "403 Forbidden",
            "401 Unauthorized",
          ],
          correctIndex: 0,
          explanation:
            "The middleware branches on `expectsJson()`: browsers get the redirect, API clients get 423 so an SPA can show a re-authentication modal instead of following a redirect it cannot render.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-hardening-q8",
          prompt: "Why does the documented password-confirmation route also carry `throttle:6,1`?",
          options: [
            "It accepts a password, so it is a brute-force target in its own right — with a valid session already in hand",
            "Because `Hash::check()` is rate-limited internally",
            "To stop the session timestamp being refreshed too often",
            "Because the redirect loop would otherwise never terminate",
          ],
          correctIndex: 0,
          explanation:
            "Any endpoint that compares a password is a guessing oracle. An attacker who has stolen a session but not the password would otherwise have unlimited attempts at the confirmation form.",
        },
        {
          id: "lv-auth-hardening-q9",
          prompt: "In Fortify's 2FA flow, what is the `confirm` step for?",
          options: [
            "The user must submit one valid code before 2FA is actually enabled, proving their authenticator is set up correctly",
            "It confirms the user's email address before 2FA may be enabled",
            "It asks the user to confirm they have saved the recovery codes",
            "It confirms the server clock is synchronised with the authenticator",
          ],
          correctIndex: 0,
          explanation:
            "Without it, a mis-scanned QR code locks the user out of their own account on the next login. The separate `confirmPassword` option is the one that demands the password before enabling or disabling 2FA.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-auth-hardening-q10",
          prompt: "What are recovery codes for, and how should they be treated?",
          options: [
            "Single-use fallbacks for a lost device; they are password-equivalent, so show them once, store them hashed and let the user regenerate them",
            "Backup TOTP seeds the user can import into a second authenticator app",
            "Codes support staff can read out to unlock an account",
            "Time-limited codes emailed when 2FA fails",
          ],
          correctIndex: 0,
          explanation:
            "They bypass the second factor entirely, so they carry the same weight as a password. Fortify's challenge endpoint accepts either a `code` or a `recovery_code` field.",
        },
        {
          id: "lv-auth-hardening-q11",
          prompt: "Fortify throttles login attempts by default. How is that customised?",
          options: [
            "Define a named limiter and point `fortify.limiters.login` at it",
            "Edit `EnsureLoginIsNotThrottled` after publishing it",
            "Set `fortify.throttle` to a requests-per-minute integer",
            "Add `throttle:5,1` to the `web` middleware group",
          ],
          correctIndex: 0,
          explanation:
            "Setting `fortify.limiters.login` swaps Fortify's built-in `EnsureLoginIsNotThrottled` pipe for your own `RateLimiter::for(...)` definition — the same mechanism the starter kits use.",
        },
        {
          id: "lv-auth-hardening-q12",
          prompt: "Which claim about rate limiting and password hashing cost is correct?",
          options: [
            "They are complements: a high bcrypt cost makes each guess expensive for the attacker and for your CPU, so throttling is what keeps the endpoint affordable",
            "A high enough bcrypt cost removes the need for throttling",
            "Throttling removes the need for a high bcrypt cost",
            "Both are redundant once 2FA is enabled",
          ],
          correctIndex: 0,
          explanation:
            "Cost protects the stolen database; throttling protects the live endpoint — and a deliberately slow hash is a denial-of-service amplifier without it. 2FA is a third, independent layer, not a replacement for either.",
        },
      ],
    },
  ],
} satisfies Module;
