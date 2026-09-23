# Composer & PSR Standards research notes (2026-09-23)

Fourth camp of the v3 PHP & Laravel track. Scope: how PHP code is organised, shared and depended
on — namespaces, PSR-4 autoloading, Composer's resolution/lock model, publishing, and the FIG
interop standards. Deliberately excluded: language basics and error handling (`php-foundations`),
OOP constructs (`php-oop`), the 8.x feature tour (`php-modern`), superglobals/PDO/sessions
(`php-web`). Two scope calls are noted at the bottom.

12 topics, all `quiz`, 124 questions.

## Videos

Every id below came from `yt.mjs search` and was confirmed with `yt.mjs info <id> --chapters`
(embeddable: true in all cases). No search-URL fallbacks.

- `php-psr-namespaces` → **`Jni9c0-NjrY`** "PHP Namespace Tutorial - Full PHP 8 Tutorial"
  (Program With Gio, 20:14, 72k views). No chapters, but the whole video is the topic: declaring,
  importing, aliasing, and the global-fallback rules. Alternate: **`qPBcMEpcNpE`** "PHP For
  Beginners, Ep 31 - Namespacing" (Laracasts, 12:09) — newer (2023) and tighter, kept as the
  second option rather than the primary because it spends half its time on file restructuring.
- `php-psr-autoloading` → **`93pCiZT99Ks`** "Autoloading Classes in PHP: PSR-4 and Composer"
  (Dave Hollingworth, 17:49, Dec 2024) at **175s "spl_autoload_register"**. Chapters: 0 Intro,
  13 How NOT to do it, 58 Classes in separate files, **175 spl_autoload_register**, 264 PSR-1,
  454 PSR-4, 750 Composer, **859 dump-autoload**, 1022 Summary. Starting at the mechanism rather
  than at 454 because the topic is *how the autoloader works*, not just the mapping rule.
- `php-psr-optimised-autoload` → same video at **859s "dump-autoload"**. Deliberate chapter split
  of one video across two topics (CONTENT_GUIDE §3.3): this chapter covers what `dump-autoload`
  generates, which is the mechanism the `-o`/`-a` flags change. Searches for a dedicated
  production-optimisation video found nothing usable — `composer optimize autoloader production`
  returns Laravel/cPanel deployment walkthroughs and a Databricks "Autoloader" product, and the
  only on-topic result (`ERwV9xpXKc4`, 1:06, 99 views) is not worth shipping. The quiz carries
  this topic.
- `php-psr-composer-json` → **`1eH43qVMCOU`** "Use Composer to Easily Manage PHP Packages"
  (Dave Hollingworth, 15:39, 29.7k) at **426s "composer.json"**. Unusually fine-grained chapters:
  0 Intro, 13 What is a package?, 77 Packagist, 129 What is a dependency?, 169 What is Composer?,
  190 Installing Composer, 251 Installing packages, 311 Composer's autoloader, 370 Packages with
  dependencies, **426 composer.json**, 494 composer update, 513 Removing packages,
  546 Version constraints, 621 Updating packages, 697 composer.lock, 725 Ignoring the vendor
  folder, 779 update vs install, **842 Development packages**, 921 Summary.
- `php-psr-dev-dependencies` → same video at **842s "Development packages"**.
- `php-psr-versioning` → **`kebz0Y2apZ0`** "Composer Package Versions: Caret, Tilde, or Asterisk?"
  (Laravel Daily, 5:29). Short but exactly the topic. Alternate: **`jLEUZrbAUF4`** at **1334s
  "Semantic versioning"** for a longer treatment.
- `php-psr-packagist` → **`jLEUZrbAUF4`** "PHP Composer and Packagist Tutorial" (Gary Clarke,
  35:12, 11.2k) at **842s "Registering on Packagist"**. Chapters: 0 Project introduction,
  151 Git repository setup, 266 GitHub repository setup, 434 Composer initialization,
  677 Testing VCS installation, **842 Registering on Packagist**, 1033 Submitting to Packagist,
  1202 Installing from Packagist, **1334 Semantic versioning**, 1581 Updating package versions,
  1688 Managing version constraints, 1862 Conclusion.
- `php-psr-coding-style` → **`YLTuR9oz_S0`** "Development tips: PHP CS Fixer to format your code"
  (Amitav Roy, 10:31, 11.2k). Chosen over `tKih3UZuwXw` (CodeSniffer, 2017) because the tooling
  half of this topic is better served by the fixer-first workflow most teams actually run.
  Alternate: **`5khyIHIYIK4`** "New Laravel Pint" (Laravel Daily, 7:58, 39.9k), relevant since the
  rest of the track is Laravel.
- `php-psr-fig-process` → **`rqzYdHdyMH0`** "PHP Coding Standards, Autoloading (PSR-4) & Composer"
  (Program With Gio, 21:49, 87.6k) at **352s "PSR"** (chapters: 0 Autoloading, 352 PSR,
  627 Composer & dependency management, 991 Autoloading using composer). A 4.5-minute chapter is
  thin for the topic; it is the best free explanation of *what FIG is* that I found. The summary
  and quiz carry the process detail, all of it read off php-fig.org rather than the video.
- `php-psr-psr3-logging` → **`GLbeuxNAcn8`** "PHP Logging with Monolog" (Better Stack, 24:36,
  Feb 2024). Used whole; every chapter is on topic (72 setup, 177 installing, 270 logger and
  handler, 486 context, 647 formatters, 904 exceptions). Rejected `wcAivp4lZyg` (2019, PSR-3
  specific but dated) and `t2dB6TyuYGI` (535 views).
- `php-psr-http-messages` → **`dutrUmKcTng`** "DPC2021: HTTP Patterns: PSR 7 & 15 By Example"
  (Dutch PHP Conference, Tim Lytle, 51:38) at **1010s "Interfaces"** (chapters: 0 Intro,
  490 Parse Body, 707 Attribute, 805 Response, **1010 Interfaces**, 1327 Middleware,
  2627 Choosing the Right Library, 2947 Outro). A conference talk rather than a tutorial, which
  suits an advanced topic; the interfaces→middleware run from 1010 to ~2627 is the watchable part
  and `estMinutes` reflects that, not the full 51 minutes. This is the thinnest area of free PHP
  video content — almost everything else found was 2015–2017 user-group recordings.
- `php-psr-container` → **`TqMXzEK0nsA`** "Dependency Injection in PHP | Create a Service
  Container from Scratch | Use PHP-DI" (Dave Hollingworth, 16:02, 17.8k, Mar 2024). Builds a
  container then swaps in PHP-DI, which is the right arc for a PSR-11 topic. Alternate:
  **`78Vpg97rQwE`** (Program With Gio, 29:44, 41.3k) for the Reflection/autowiring deep dive.

Not used: `EX3qQqdm16I` @3399 "Composer" (Laravel, "PHP Fundamentals"), offered in the brief. It
is a 5-minute "install a package" segment inside a language primer; every topic here had a better
match, and the other three PHP camps already lean on that video.

## References

- **Official sources first in every topic:** `getcomposer.org/doc/...` for the Composer half,
  `php-fig.org/psr/...` (and `/per/`) for the standards half, `php.net/manual/...` for the
  language half. All checked with `check-urls.mjs`; every URL returned 200.
- **Redirects:** `https://www.rfc-editor.org/rfc/rfc5424` → `https://www.rfc-editor.org/info/rfc5424/`
  (the final URL is what is shipped). `laravel.com/docs/...` → `laravel.com/framework/docs/...`
  as noted in CONTENT_GUIDE §10b — no Laravel URL ended up in this module's refs, but the Laravel
  PSR-7 claim in `php-psr-http-messages-q10` was verified against `laravel.com/docs/13.x/requests`.
- **Iframe previews.** Allow framing: `getcomposer.org`, `php-fig.org` (all PSR and PER pages),
  `semver.org`, `cs.symfony.com`, `php-di.org`, `slimframework.com`, `phptherightway.com`,
  `docs.laminas.dev`, `blog.packagist.com`. Block framing: `php.net` (`X-Frame-Options:
  SAMEORIGIN`, consistent with `php-foundations`), `packagist.org` (`DENY`), `github.com` (CSP
  `frame-ancestors 'none'`), `martinfowler.com` (`DENY`), `semver.madewithlove.com` (`SAMEORIGIN`),
  `php.watch` (`SAMEORIGIN`), `symfony.com` (`DENY`).
- **No interview-prep repo**, same conclusion as `php-foundations`: there is no PHP equivalent of
  `lydiahallie/javascript-questions` worth linking. The edge-case questions carry that weight.
- `github.com/squizlabs/PHP_CodeSniffer` is no longer the maintained home — it is
  `PHPCSStandards/PHP_CodeSniffer` (200). Not shipped in the end; `cs.symfony.com` covers the
  tooling ref for that topic.

## Facts verified

Checked against the projects' own sources on 2026-09-23, not from memory.

### Composer version (the flagged risk)

- **Composer 2.10.3 is the current stable release** (`curl -s https://getcomposer.org/versions`),
  minimum PHP 7.2.5. **2.2.30 is the LTS line** (minimum PHP 5.3.0, `critical-security`
  maintenance until 2026-12-31). **There is no Composer 3, and Composer 1 is not on the supported
  list at all.** Every claim in this module is a Composer 2.x claim, and the summaries say
  "Composer 2" where the behaviour is version-dependent rather than implying it is eternal.
- Composer 2.0.0 (2020-10-24) is what brought parallel downloads/installs, the `platform_check.php`
  autoloader bootstrap, `-w`/`-W` partial-update shorthands and the much faster solver
  (from the project CHANGELOG). Stated only in general terms in the content.
- `composer audit` was added in **2.4.0** (2022-08-16), along with an automatic audit after
  `update` (CHANGELOG #10798, #10898). **2.10.0** (2026-05-28) added the `config.policy` block:
  `policy.advisories.block` and `policy.malware.block` both **default to `true`**, so current
  Composer *blocks* installing a version with an active advisory during update/require/remove
  (and malware at `install` time) rather than merely reporting it. Used in the explanation for
  `php-psr-optimised-autoload-q10`, phrased as "current Composer 2.x" so it does not go stale on a
  patch release.

### Version constraints (all from `getcomposer.org/doc/articles/versions.md`)

- `^1.2.3` = `>=1.2.3 <2.0.0`. `^0.3` = `>=0.3.0 <0.4.0`. `^0.0.3` = `>=0.0.3 <0.0.4`.
- `~1.2` = `>=1.2 <2.0.0`; `~1.2.3` = `>=1.2.3 <1.3.0`; `~1` is treated as `~1.0` (the major
  never increases).
- `1.0.*` = `>=1.0 <1.1`. Hyphen range `1.0 - 2.0` = **`>=1.0.0 <2.1`** (a partial right-hand
  bound is completed with a wildcard) — the surprising one, used as an edge-case question.
- `~1.2` does **not** match `2.0-beta.1` even though it sorts before `2.0`; the docs call this out
  explicitly. Stabilities in order: dev, alpha, beta, RC, stable; `minimum-stability` defaults to
  `stable`; per-constraint flags like `^2.0@beta` are the narrow override.
- Composer strips a leading `v` from tag names. Branches use the `dev-` prefix, or the
  `v1.x-dev` suffix form when the branch name already looks like a version.
- Space/comma = AND, `||` = OR, AND binds tighter.

### Autoloading

- PSR-4 spec: FQCN must have a top-level vendor namespace; **underscores have no special meaning**
  (the whole difference from PSR-0, which turned them into directory separators); sub-namespace
  and file-name case MUST match; autoloaders **MUST NOT throw or raise errors** and SHOULD NOT
  return a value. The `Acme\Log\Writer\File_Writer` → `lib/File_Writer.php` row is taken verbatim
  from the spec's example table.
- Composer schema: PSR-4 prefixes **must end in `\\`** so `Foo\` and `FooBar\` stay distinct; a
  prefix may map to an **array** of directories; an empty prefix `""` is a catch-all fallback
  directory; the merged rules land in `vendor/composer/autoload_psr4.php`. `files` entries are
  required on every request because functions cannot be autoloaded.
- PSR-0 and PSR-2 are the only two PSRs marked **Deprecated** on the FIG index.
- Autoloader optimisation (`articles/autoloader-optimization.md`): **Level 1** `-o` converts
  PSR-0/4 rules to a classmap, cached by opcache, "no real trade-offs", but does not track misses.
  **Level 2/A** `-a` (`classmap-authoritative`) **implicitly enables `-o`** and makes misses free
  at the cost of breaking runtime-generated classes. **Level 2/B** `--apcu-autoloader` caches hits
  and misses in APCu and does **not** generate the classmap. 2/A and 2/B **cannot be combined**.
  The docs say not to enable any of them in development.
- `install --no-dev`: "The autoloader generation skips the autoload-dev rules" — verbatim from the
  CLI docs, and the basis of `php-psr-dev-dependencies-q2`.
- `install/update --strict-psr-autoloader` returns exit code **6** and requires `-o`;
  `dump-autoload --strict-psr` returns exit code **1**. Both names used correctly in the content.
- `config.platform-check` defaults to **`php-only`** and controls whether
  `vendor/composer/platform_check.php` is generated. `config.platform` fakes platform packages for
  the solver and the docs recommend pairing it with `composer check-platform-reqs` in deployment.
  `--ignore-platform-req=php+` ignores only the **upper** bound (the docs' own example).

### composer.json / lock / scripts

- `install` uses the lock's exact versions when one exists and writes one when it does not;
  `update` re-solves and rewrites the lock.
- **Only the root package's scripts are executed** — "If a dependency of the root package specifies
  its own scripts, Composer does not execute those additional scripts" (scripts article). The same
  root-only rule is why a dependency's `require-dev` is never installed.
- Composer's bin-dir is "temporarily pushed on top of the PATH environment variable" before scripts
  run, so `"test": "phpunit"` resolves `vendor/bin/phpunit`.
- `config.allow-plugins` exists **as of Composer 2.2.0**, defaults to `{}` (nothing allowed) and
  prompts interactively on first sight of a new plugin.
- `version` in `composer.json` "should be omitted" — Packagist infers versions from VCS tags and
  the docs warn that specifying it manually "will most likely end up creating problems".

### PSR specifics

- **PSR-1**: `<?php`/`<?=` only; UTF-8 without BOM; `StudlyCaps` classes; `camelCase` methods;
  class constants in upper case with underscores; a file SHOULD declare symbols *or* cause side
  effects but not both. It says **nothing** about property names — used as a distractor.
- **PSR-12**: 4 spaces, never tabs; "There MUST NOT be a hard limit on line length. The soft limit
  MUST be 120 characters"; lines SHOULD NOT exceed 80; visibility MUST be declared on all
  properties, methods and (PHP 7.1+) constants; class/method opening braces on their own line;
  `declare(strict_types=1)` in an exact form.
- **PER Coding Style 3.1** is the current release and the page states it "extends, expands and
  replaces PSR-12". PSR-12 itself is still listed as **Accepted**, not deprecated — the content
  says exactly that rather than claiming PSR-12 is dead.
- **FIG index statuses (read off `php-fig.org/psr/` today):** Accepted — 1, 3, 4, 6, 7, 11, 12, 13,
  14, 15, 16, 17, 18, 20. Draft — 5, 19, 21, 22. Abandoned — 8, 9, 10. Deprecated — 0, 2. The
  multi-select in `php-psr-fig-process-q4` depends on PSR-5 still being Draft and PSR-20 being
  Accepted; both confirmed.
- **PSR-3**: eight RFC 5424 levels; `log()` with an unknown level **MUST throw**
  `Psr\Log\InvalidArgumentException`; placeholders are `{name}` with no whitespace inside the
  braces; an exception **MUST** be passed under the context key `exception` and implementations
  MUST still verify the type; a context value **MUST NOT** cause the logger to throw or raise any
  error/warning/notice; users SHOULD NOT pre-escape placeholder values. Package ships
  `AbstractLogger`, `LoggerTrait`, `NullLogger`, `LoggerAwareInterface`, `LoggerAwareTrait`,
  `LogLevel`. The spec itself notes conditional logging may beat `NullLogger` when building
  context is expensive.
- **PSR-7**: `with*()` methods MUST return a new instance; the spec explicitly concedes that a
  wrapped stream body cannot be made immutable and recommends read-only streams server-side —
  both used as edge-case questions.
- **PSR-15**: `RequestHandlerInterface::handle(ServerRequestInterface): ResponseInterface` and
  `MiddlewareInterface::process(ServerRequestInterface, RequestHandlerInterface): ResponseInterface`;
  a middleware MAY return a response without delegating; the spec RECOMMENDS an exception-handling
  component that "SHOULD be the first component executed".
- **PSR-11**: only `get()` and `has()`; `has($id) === false` ⇒ `get($id)` MUST throw
  `NotFoundExceptionInterface`; `has($id) === true` guarantees only that `get()` will not throw a
  *not-found* error; two successive `get()` calls SHOULD return the same value but users SHOULD NOT
  rely on it; `NotFoundExceptionInterface extends ContainerExceptionInterface`; the spec itself
  says users SHOULD NOT inject the container into an object to fetch its own dependencies
  (Service Locator). `psr/container` 1.1 added argument type hints, 2.0 added a return type on
  `has()`.
- **Laravel and PSR-7**: `laravel.com/docs/13.x/requests` documents installing the *Symfony HTTP
  Message Bridge* (plus a PSR-7 implementation) to type-hint a PSR-7 request — the basis of
  `php-psr-http-messages-q10`, not an assumption.

### PHP language facts used

- Inside a namespace, unqualified **class** names always resolve against the current namespace with
  **no global fallback**; unqualified **function and constant** names do fall back to global
  (`language.namespaces.fallback.php`). This asymmetry is the topic's first edge-case question.
- A class name held in a string is always treated as fully qualified and ignores `use` aliases.
- `namespace` must be the first statement in the file apart from `declare()`.
- Double-quoted strings interpret `\r`, `\n`, `\t` etc., so `"App\repositories\X"` is silently
  mangled while `"App\Models\User"` is not (unknown escapes are left as-is, with no warning).

## Scope and assessment calls

- **All 12 topics are `quiz`, no code challenges.** The sandbox runs JavaScript in a V8 isolate and
  cannot grade PHP, and none of this camp's content is meaningfully expressible as a JS exercise.
  Consistent with `php-foundations` and the `## v3 decisions` entry in `docs/PROGRESS.md`. The
  difficulty is carried by scenario questions — what a constraint actually resolves to, why a class
  is not found, what `composer update` does on a teammate's machine, what `--classmap-authoritative`
  breaks.
- **Composer scripts were folded into `php-psr-dev-dependencies`** rather than given their own
  topic. There is no usable English video on Composer scripts (the one on-topic result,
  `2lEXM4C3IiY`, is Russian), and scripts, `require-dev`, `bin` and `allow-plugins` are all
  "things in `composer.json` that are not dependencies", so the merge reads naturally. The freed
  slot went to `php-psr-fig-process`, which the brief listed and which gives the six PSR topics a
  frame.
- **PSR-4 vs PSR-0 is inside `php-psr-autoloading`** (q3) rather than a topic of its own; PSR-0 is
  deprecated and the comparison is one rule long.
- `php-psr-autoloading`, `php-psr-optimised-autoload` and `php-psr-container` are the three
  milestones: the mechanism, the production payoff, and the concept the Laravel camps build on.
