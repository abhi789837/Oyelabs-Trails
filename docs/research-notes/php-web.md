# PHP on the Web research notes (2026-09-23)

Fifth camp of the v3 PHP & Laravel track. Scope decision: everything a Laravel developer relies on
*below* the framework — the SAPI/lifecycle, FPM, superglobals, headers, cookies, sessions, uploads,
PDO, password hashing, XSS/CSRF and production `php.ini`. Language-level material stays in
`php-foundations`, objects in `php-oop`, the 8.x tour in `php-modern`, autoloading/PSR in
`php-composer-psr`, and every framework abstraction over these topics (middleware, `Request`,
Eloquent, `@csrf`, Blade escaping, Hashing facade) belongs to the `laravel-*` camps.

12 topics, all **quiz** (129 questions). The sandbox runs JavaScript only, so PHP code challenges
cannot be graded; difficulty is carried by predict-the-output questions, "which of these is the
injectable one" snippets, and configuration-default questions. Every topic has ≥2
`isEdgeCaseOrInterviewQuestion` and ≥1 multi-select.

Two merges were needed to fit the 9–12 budget while still covering every item the brief named:
input validation/filtering lives inside `php-web-superglobals` (it is the same story — "everything
the client sends, and what to do about it"), and output buffering lives inside
`php-web-headers-output` (it is the same story as "headers already sent"). `php.ini` production
settings and production error reporting/logging are one topic for the same reason.

## Topics

1. `php-web-request-lifecycle` — The Request Lifecycle and Shared-Nothing Execution (advanced)
2. `php-web-fpm` — PHP-FPM, mod_php and the Process Model (advanced)
3. `php-web-superglobals` — Superglobals and Untrusted Input (intermediate)
4. `php-web-headers-output` — Headers, Status Codes, Redirects and Output Buffering (intermediate)
5. `php-web-cookies` — Cookies and Their Security Attributes (intermediate)
6. `php-web-sessions` — Sessions: Storage, Locking and Fixation (advanced, **milestone**)
7. `php-web-file-uploads` — Handling File Uploads Safely (advanced)
8. `php-web-pdo-prepared-statements` — PDO and Prepared Statements (advanced, **milestone**)
9. `php-web-pdo-transactions` — Transactions and Connection Handling with PDO (advanced)
10. `php-web-password-hashing` — Password Hashing with `password_hash` (advanced)
11. `php-web-xss-csrf` — XSS and CSRF in Plain PHP (advanced)
12. `php-web-production-config` — Production `php.ini`, OPcache and Error Logging (advanced,
    **milestone**)

## Videos

Every id came from `scripts/research/yt.mjs search` and was confirmed with
`yt.mjs info <id>` (`embeddable: true`, exact title/channel/duration copied from the output).
No search-URL fallbacks; no video is reused as a primary in two topics.

- `php-web-request-lifecycle` → **`lh4RnczaATI`** "How Nginx and PHP-FPM turn a web request into
  code" (Chris Fidao, 7:08). Short and exactly the mental model the topic needs: server → FastCGI →
  worker → script → response.
- `php-web-fpm` → **`hEXBgQ71rvE`** "All you need to know about FastCGI Process Manager (FPM)"
  (Daniel Persson, 12:44). Covers `pm` modes and pool sizing rather than just "how to install it".
  Alternate: **`vohsuhwWvpw`** "Configuring and Troubleshooting PHP-FPM" (Chris Fidao, 4:59), which
  is the practical `pm.max_children` / 502 companion.
- `php-web-superglobals` → **`CF7Yy5cPFVM`** "PHP Superglobals - Basic Routing Using The Server
  Info" (Program With Gio, 12:55). Uses `$_SERVER` for real routing, which is where the "this is
  attacker input" point lands hardest.
- `php-web-headers-output` → **`W7tj0Qlk3rE`** "HTTP Headers In PHP - Request & Response Headers"
  (Program With Gio, 11:59). Alternate: **`6vM-9ou1ARo`** "PHP Sessions & Cookies - Output
  Buffering - Headers Already Sent Warning" (Gio, 14:55) for the buffering half.
- `php-web-cookies` → **`aUF2QCEudPo`** "SameSite Cookie Attribute Explained by Example" (Hussein
  Nasser, 13:56). Not PHP-specific, but the topic is mostly about the HTTP attributes and this is
  the clearest treatment of Strict/Lax/None with live demos; the PHP API side is carried by the
  `setcookie()` reference and the quiz.
- `php-web-sessions` → **`nJWmoetWP0k`** "Session Based Authentication - Session Hijacking &
  Fixation" (Program With Gio, 17:37). The only free PHP video found that treats fixation as a
  first-class topic rather than a footnote.
- `php-web-file-uploads` → **`5PWGAC-mafU`** "PHP File Uploads" (Program With Gio, 8:32).
  Alternate: **`YAFVGQ-lBoM`** "Web Application Hacking - File Upload Attacks Explained" (The Cyber
  Mentors, 17:23) for the attacker's view, which is what makes the defences make sense.
- `php-web-pdo-prepared-statements` → **`wcD5HlEHrnc`** "PHP PDO Tutorial Part 1 - Prepared
  Statements - SQL Injection" (Program With Gio, 25:18).
- `php-web-pdo-transactions` → **`e6yLUvpcOZo`** "PHP PDO Tutorial Part 2 - Transactions - Env
  Variables & PHPDotEnv" (Program With Gio, 17:01). Same series, next episode; the env-variables
  half is out of scope but harmless.
- `php-web-password-hashing` → **`TqXMaj2Z-GQ`** "User Registration & Password Hashing" (Program
  With Gio, 13:19). Alternate: **`qgpsIBLvrGY`** "Password Storage Tier List" (Studying With Alex,
  10:16, 335k views) for the conceptual ordering of MD5 → salted → bcrypt → Argon2.
- `php-web-xss-csrf` → **`EoaDgUgS6QA`** "Cross-Site Scripting (XSS) Explained" (PwnFunction,
  11:27) with **`eWEgUcHPle0`** "Cross-Site Request Forgery (CSRF) Explained" (PwnFunction, 14:11)
  as the alternate. Both are language-agnostic; the PHP specifics (`htmlspecialchars()` defaults,
  `hash_equals()`, the token pattern) are in the summary, refs and quiz. Nothing PHP-specific of
  comparable quality exists — the PHP-labelled XSS/CSRF results were all sub-1k-view channels.
- `php-web-production-config` → **`LcIkUpcaXZc`** "Everything about OPcache to increase PHP
  performance (2026)" (Tideways, 25:20, published Feb 2026 — the most current video in the whole
  camp). Alternates: **`LVEhccXXnOo`** "How To Work With PHPs Configuration File - PHP.INI" (Gio,
  7:25) and **`rQntgj7yink`** "PHP Error Handling & Error Handlers" (Gio, 7:29) for the
  `set_error_handler` half.

Searched and rejected: `tU4Ma7B5nHM` (DevOverclock, "PHP-FPM Lifecycle, Shared-Nothing
Architecture") — on-topic title but 39 views and unverifiable claims; `SbAfPJj0H4g`,
`VXC6LbWMjuI` (CodeWithHarry) — Hindi-language; `UYLie3JEV2Y` (Dave Hollingworth, session
fixation, 4:23) — good but nine years old and superseded by the Gio episode. No suitable
`filter_var`/input-validation video exists at all in English on a reputable channel, which is part
of why validation was folded into the superglobals topic rather than given its own.

## References

All URLs checked with `scripts/research/check-urls.mjs`; every one returned 200 and the final URL
after redirects is what is stored. `php.net` is first in every topic's list.

- Dead/wrong slugs found and avoided: `php.net/manual/en/internals2.structure.lifecycle.php`,
  `internals2.structure.php` and `internals2.php` are all **404** (the internals book section is
  gone from the manual), so the lifecycle topic uses `features.connection-handling.php` plus
  `function.register-shutdown-function.php` instead. `php.net/manual/en/filter.filters.php` and
  `filter.filters.validate.php` are both 404 — the constants live at `filter.constants.php`.
  `php.watch/articles/php-config-recommendations` is 404.
  `www.tideways.io/profiler/blog/...` redirects to `tideways.com/profiler/blog/...`; the final URL
  is stored.
- **Iframe previews.** `php.net` sends `X-Frame-Options: SAMEORIGIN` on every page, MDN sends
  `X-Frame-Options: DENY`, `dev.mysql.com`, `portswigger.net` and `use-the-index-luke.com` send
  SAMEORIGIN, and `datatracker.ietf.org` sets `CSP frame-ancestors 'self' ietf.org …`. So the
  majority of this camp's reference cards will fall back to link previews. The ones that **do**
  frame: every `cheatsheetseries.owasp.org` page, `phpdelusions.net/pdo`,
  `tideways.com/profiler/blog/…` and `frankenphp.dev/docs/worker/`.
- **No interview-prep repo**, same conclusion as `php-foundations`: there is no PHP equivalent of
  `lydiahallie/javascript-questions` worth shipping. The OWASP cheat sheets carry the
  security-interview weight instead, and every topic's edge-case questions are real snippets.

## Facts verified

Checked against php.net, MDN and the MySQL manual on 2026-09-23, not from memory. PHP 8.5 is
current stable; 8.4 is in active support.

### Lifecycle, FPM, config defaults
- **Connection handling:** the default is to abort the script when the client disconnects
  (`ignore_user_abort = 0`), but PHP only *detects* the abort the next time it writes output.
  `max_execution_time` defaults to 30.
- **`max_execution_time` excludes** time spent in system calls, `sleep()`, database queries and the
  upload transfer itself — stated explicitly on the file-upload common-pitfalls page.
- **FPM `pm`** accepts `static`, `ondemand` and `dynamic`; `pm.max_children` is "the limit on the
  number of simultaneous requests that will be served"; `pm.max_requests` defaults to **0**;
  `pm.process_idle_timeout` defaults to 10s (`ondemand` only).
- **Core ini defaults:** `memory_limit` 128M, `post_max_size` 8M, `upload_max_filesize` 2M,
  `max_file_uploads` 20, `max_input_vars` 1000, `max_input_nesting_level` 64, `expose_php` 1,
  `zend.exception_ignore_args` 0, `hard_timeout` 2. **`max_memory_limit` is new in PHP 8.5** and
  caps what `memory_limit` may be set to.
- **Exceeding `post_max_size` leaves BOTH `$_POST` and `$_FILES` empty**, with no upload error code
  — documented on the `post_max_size` page. This is the single most useful upload fact in the camp.
- **OPcache defaults:** `enable` 1, `enable_cli` 0, `memory_consumption` 128, `max_accelerated_files`
  10000, `interned_strings_buffer` 8, `validate_timestamps` 1, `revalidate_freq` 2,
  `preload` available since 7.4. **`opcache.jit` defaults to `disable` as of PHP 8.4** (it was
  `tracing` before, but with `jit_buffer_size` 0, so JIT was effectively off either way).
- **`@` on PHP 8.0+ no longer silences fatal errors**; a custom `set_error_handler()` is still
  called for suppressed diagnostics, and `error_reporting()` inside it now returns
  `E_ERROR|E_CORE_ERROR|E_COMPILE_ERROR|E_USER_ERROR|E_RECOVERABLE_ERROR|E_PARSE` rather than 0.

### Input
- **`filter_input()` reads the original SAPI values**, not the current superglobal — the manual
  warns about this explicitly. Use `filter_var()` for values your own code modified.
- **Return values:** the value on success, `false` when the filter fails, `null` when the variable
  is not set (`FILTER_NULL_ON_FAILURE` swaps the two). `FILTER_DEFAULT` is an alias of
  `FILTER_UNSAFE_RAW`, i.e. no filtering.
- **`FILTER_SANITIZE_STRING` is deprecated as of PHP 8.1**; the manual says use
  `htmlspecialchars()` instead.
- **Dots and spaces in incoming variable names are converted to underscores** (`a.b` → `a_b`),
  still documented on the external-variables page.
- **`request_parse_body()` is PHP 8.4+**: it parses `x-www-form-urlencoded` and `multipart/form-data`
  bodies for non-POST verbs and returns `[$_POST, $_FILES]`. The body can be consumed only once, so
  mixing it with `php://input` yields empty data.
- `$_FILES['x']['type']` is the client-declared MIME type and "is not checked on the PHP side";
  `full_path` was added in **8.1** and "cannot be trusted".

### Cookies and sessions
- **`setcookie()` options-array signature is PHP 7.3+** and is the only form that can set
  `samesite`; **`partitioned` (CHIPS) was added in 8.5** and requires `secure` or throws a
  `ValueError`. Unsupported keys throw a `ValueError` as of 8.0 (an `E_WARNING` before).
  If `samesite` is omitted, **no SameSite attribute is sent at all**.
- **`$_COOKIE` is populated from the incoming request** and is not updated by `setcookie()`.
- **MDN on SameSite:** `Lax` sends the cookie only for top-level navigations using a safe method;
  "some browsers use Lax as the default", and **when Lax is applied as a default it is a more
  permissive variant that still sends the cookie on cross-site POSTs for about two minutes after
  it was set**. `None` requires `Secure`.
- **`__Host-` prefix** requires `Secure`, `Path=/` and **no `Domain`**. Omitting `Domain` gives a
  host-only cookie; setting it widens the cookie to all subdomains.
- **Session ini defaults:** `use_strict_mode` **0**, `cookie_httponly` **0**, `cookie_secure` **0**,
  `cookie_samesite` **""**, `use_only_cookies` 1, `use_trans_sid` 0, `gc_maxlifetime` 1440,
  `gc_probability` 1, `gc_divisor` 100, `sid_length` 32, `cookie_lifetime` 0. `cookie_partitioned`
  is available as of 8.5. Disabling `use_only_cookies`, enabling `use_trans_sid`, and changing
  `sid_length`/`sid_bits_per_character` are all **deprecated as of PHP 8.4**.
- The manual calls enabling `use_strict_mode` "mandatory for general session security", and warns
  that a custom save handler that does not implement `validateId()` disables strict mode silently.
- **Session locking:** documented on `session_write_close` — "session data is locked to prevent
  concurrent writes so only one script may operate on a session at any time".

### PDO
- **`PDO::ERRMODE_EXCEPTION` is the default as of PHP 8.0** (`ERRMODE_SILENT` before).
- **Only literals can be bound.** phpdelusions: "neither an identifier, nor a comma-separated list,
  nor a part of a quoted string literal … can be bound". `ORDER BY` and table/column names need an
  allowlist.
- **`ATTR_EMULATE_PREPARES` is ON by default for MySQL.** With emulation on and values passed as an
  array to `execute()`, everything binds as `PDO::PARAM_STR`, so `LIMIT ?, ?` becomes
  `LIMIT '0', '10'` and fails. Fix: emulation off, or `bindValue(..., PDO::PARAM_INT)`.
- **Charset must be set in the DSN**, not via `SET NAMES`, so PDO knows the encoding it is quoting
  for (the historical GBK injection vector).
- `lastInsertId()` maps to the driver's per-connection last id, so it is concurrency-safe; on MySQL
  a multi-row insert reports the **first** generated id.
- **MySQL DDL causes an implicit commit** (`dev.mysql.com/.../implicit-commit.html`), so schema and
  data changes are not atomic together. A second `beginTransaction()` throws — PDO has no nesting.

### Passwords
- **`PASSWORD_DEFAULT` is currently an alias for `PASSWORD_BCRYPT`**, and the manual says to store
  the result in a column that can grow beyond 60 bytes (255 recommended) because the constant is
  designed to change.
- **bcrypt truncates the password at 72 bytes** (explicit Caution on the `password_hash` page).
- **The default bcrypt `cost` was raised from 10 to 12 in PHP 8.4.**
- The salt is generated per call and encoded in the hash; **an explicitly supplied salt is ignored
  as of PHP 8.0** and the option is deprecated. As of 8.0 `password_hash()` throws a `ValueError`
  rather than returning `false`.
- `PASSWORD_ARGON2I` / `PASSWORD_ARGON2ID` exist only when PHP was built with Argon2 (or sodium)
  support. OWASP ordering (per CONTENT_GUIDE §10): **Argon2id, then scrypt, bcrypt for legacy**.

### XSS / CSRF
- **`htmlspecialchars()`'s default flags are `ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401`** — the
  signature on php.net confirms it. Before PHP 8.1 the default was `ENT_COMPAT`, which did *not*
  escape single quotes, making single-quoted attributes injectable. This is the camp's sharpest
  version-dependent question, and the prompt names the versions explicitly.
- `hash_equals()` is the constant-time comparison intended for secrets such as CSRF tokens.
- `header('Location: …')` sends **302 unless a 201 or another 3xx was already set**, and does not
  stop the script. `header()`'s `replace` parameter defaults to `true`.
- `default_mimetype` is `text/html`, which is why an unlabelled JSON response is mislabelled.
