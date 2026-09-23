# PHP Foundations research notes (2026-09-23)

First module of the v3 PHP & Laravel track. Scope decision: this camp is the language itself —
types, comparison, arrays, functions, control flow, error handling. Objects go to `php-oop`, the
8.x feature tour to `php-modern`, autoloading and PSR to `php-composer-psr`, superglobals/PDO/
sessions to `php-web`. That split is why there is no `$_POST` or `PDO` topic here despite both
being "foundations" in most PHP courses.

## Videos

Two spines, because no single free course covers this camp's topics at the right granularity.

- **`EX3qQqdm16I`** — "PHP Fundamentals [FULL COURSE]" (**Laravel**, 1:14:03). The official Laravel
  channel's own PHP primer; tight, modern, and chaptered exactly along this camp's lines. Chapter
  markers read off the watch page: 0s Why PHP?, 101s Setup, **230s Variables & Types**, **533s
  Arrays**, **948s Functions**, **1270s Loops**, 1875s Classes, 2615s Modern PHP, 3399s Composer,
  3750s Your First PHP Application. Used with `startSeconds` for `php-syntax-variables`,
  `php-arrays`, `php-functions` and `php-loops-iteration`. The 1875s/2615s/3399s chapters are
  deliberately left for `php-oop`, `php-modern` and `php-composer-psr`.
- **`l4_Vn-sTBL8`** — "PHP Full Course 2025" (**Dani Krossing**, 9:46:42). Long-form, but its
  chapter list is fine-grained enough to deep-link. Used at **5055s "Operators in PHP"** for
  `php-operators-comparison` and **10974s "Built-in functions in PHP"** for
  `php-strings-functions`. Other markers noted for later camps: 1250s syntax, 1672s variables,
  6472s control structures, 9611s arrays, 12186s user-defined functions, 13049s scopes, 13822s
  constants, 14195s loops.

Dedicated videos where one exists and beats a chapter:

- `php-control-flow-match` → **`jCUyvHUKSmE`** "PHP Match Expression - Match vs Switch" (Program
  With Gio, 5:08). Short and exactly on topic; the match-vs-switch framing is the whole point.
- `php-type-declarations` → **`Ig0NbYTStxo`** "PHP Type Declarations" (Dave Hollingworth, 10:53).
  Covers coercive vs strict properly rather than treating types as decoration. His
  **`a6qZfbL-upA`** "PHP Strict Type Checking" (7:17) is a narrower companion, not used.
- `php-errors-exceptions` → **`XQ5Pd-6Hnjk`** "OOP Error Handling In PHP — Exceptions & Try Catch
  Finally Blocks" (Program With Gio, 21:17). Covers the `Error`/`Exception` split, which is the
  topic's core. Gio's **`rQntgj7yink`** "PHP Error Handling & Error Handlers" (7:29) covers
  `set_error_handler` and is the better fit for a `php-web` topic later.
- `php-named-arguments` → **`ve9bKHZG47c`** "What's new in PHP 8.0" (Dave Hollingworth, 21:44) at
  **27s "Named Arguments"**. Other chapters for `php-modern`: 284s Union Types, 458s Nullsafe
  Operator, 589s Constructor Property Promotion, 687s Match Expression, 794s Attributes, 1084s
  Non-Capturing Catch, 1149s Throw From New Places, 1195s New String Functions.

Considered and rejected: `zZ6vybT1HQs` (Bro Code, 4:00:00) — chapters are setup- and
syntax-heavy with no clean mapping to these topics. `M1ksgzGbS60` (nunomaduro, "PHP 8.5: Full
Review", 16:00) — excellent, but it belongs to `php-modern`.

No search-URL fallbacks. All eight video ids confirmed resolving and embeddable by
`npm run content:videos`.

## References

- `php.net` manual pages used: `language.types`, `language.variables.basics`,
  `language.types.type-juggling`, `types.comparisons`, `language.types.array`, `ref.array`,
  `control-structures.foreach`, `ref.strings`, `language.operators.string`, `language.functions`,
  `functions.arguments`, `functions.anonymous`, `language.types.declarations`,
  `control-structures.match`, `control-structures.switch`, `language.exceptions`,
  `language.errors.php7`, `class.throwable`, `language.generators.overview`,
  `class.iteratoraggregate`, `language.oop5.basic`. All 200.
- **No interview-prep repo.** There is no PHP equivalent of `lydiahallie/javascript-questions` at
  a quality worth shipping. Three plausible GitHub URLs were tried and all 404'd; guessing a
  fourth would be worse than leaving the slot empty. The edge-case quiz questions carry that
  weight instead.
- Iframe previews: **`php.net` and `php.watch` both block framing** (`X-Frame-Options:
  SAMEORIGIN`), so the reference cards fall back to link previews for most of this camp.
  `phptherightway.com` allows framing and does preview inline. Recorded in
  `src/content/embeds.generated.ts`.
- `php.watch/versions/8.0/non-strict-comparison-change` (the obvious-looking slug) is a 404; the
  real page is `/versions/8.0/string-number-comparison`.

## Facts verified

Checked against php.net and php.watch on 2026-09-23, not from memory. PHP 8.5.9 is current stable;
8.4 is in active support, 8.3 security-only.

- **PHP 8 string↔number comparison.** When comparing a number with a *non-numeric* string, the
  number is cast to string. `0 == "foo"` is now `false` (was `true` on PHP 7). Two numeric strings
  still compare numerically, so `"10" == "1e1"` and `"01" == "1"` remain `true`. `"abc" + 1` is a
  `TypeError` on PHP 8; a leading-numeric string like `"5 apples"` is still allowed with a warning.
- **`in_array(0, ['admin'])`** is `false` on PHP 8, `true` on PHP 7 — a real authorisation-bypass
  pattern, used as the edge-case question in `php-operators-comparison`.
- **Loose-comparison table.** `null == false`, `[] == false`, `"0" == false` are all true;
  `null == "0"` is **false** (null compares against a string as `""`); `"0.0"` is truthy.
- **Array key casting.** A string key that is a canonical decimal integer becomes an integer;
  `"01"` and `"1.0"` do not. `array_merge` renumbers integer keys, `+` keeps the left operand's.
- **All PHP sort functions are stable as of 8.0.** This changed the advice about sorting twice for
  a secondary ordering, so the quiz states it explicitly.
- **String-key array unpacking** arrived in **8.1**; before that `[...$assoc]` was fatal.
- **`strict_types` is per file and governs the call site**, not the declaration site. Int→float
  widening is the one coercion strict mode keeps. Verified on the type-declarations manual page.
- **Types by version:** union `int|string` 8.0; `never`, intersection `A&B`, `readonly`, and
  `final const` 8.1; DNF types and standalone `null`/`false`/`true` 8.2. No generics — array
  shapes are a PHPStan/Psalm docblock convention the engine ignores.
- **`Error` and `Exception` are siblings under `Throwable`**, so `catch (Exception)` does not catch
  a `TypeError`. `1 / 0` throws `DivisionByZeroError` from PHP 8 (was a warning returning `false`);
  `fdiv(1, 0)` returns `INF`. Non-capturing `catch (ValueError)` is 8.0.
- **`match`** is strict (`===`), has no fall-through, is an expression, and throws
  `\UnhandledMatchError` with no `default`. Comma-separated conditions share an arm.
- **`str_contains` / `str_starts_with` / `str_ends_with`** are 8.0. There is no `str_includes`.
- **`trim()`'s default character list** is `" \t\n\r\0\x0B"` — no non-breaking space, which is the
  reason "trim isn't working" on pasted input.
- **Parameter defaults with `new`** are allowed in initialisers from 8.1 and are evaluated per
  call, not once.
- **Named arguments make parameter names part of the public API**; `@no-named-arguments` is the
  annotation some libraries use to opt out. Unmatched named arguments collect into a variadic with
  string keys.
- **`?->`** short-circuits the remaining chain on a null receiver only; an exception thrown inside
  the called method still propagates, and there is no nullsafe array access.
- **Generators**: calling the function runs no body, returns a `Generator`; forward-only,
  single-use, not `Countable`; `getReturn()` after completion; `yield from` preserves inner keys.
- **`foreach` iterates a copy**, so appending inside the loop does not extend it — unlike a `for`
  loop over `count()`.

## Assessment shape

All ten topics are **quiz**, no code challenges. The sandbox (`server/src/sandbox/`) runs
JavaScript only, so a PHP code challenge cannot be graded. Rather than set PHP exercises that grade
nothing or fake them in JS, the difficulty is carried by `predict_output` style quiz questions —
almost every edge-case question here is a real snippet with a surprising result. 94 questions
across 10 topics; every topic has at least two `isEdgeCaseOrInterviewQuestion` and at least one
multi-select. This applies to the whole PHP track and to `mobile-dart`/`mobile-kotlin-compose`/
`mobile-swift-swiftui` later; logged under `## v3 decisions` in `docs/PROGRESS.md`.
