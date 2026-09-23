# Modern PHP 8.x research notes (2026-09-23)

Third camp of the v3 PHP & Laravel track. Scope decision: this camp is "what changed since your
mental model of PHP froze around 7.x". Language basics, arrays, functions, exceptions and the
8.0 string↔number comparison change stay in `php-foundations`; enums, `readonly` *properties*,
traits and general OOP stay in `php-oop`; namespaces/autoloading/PSR go to `php-composer-psr`;
superglobals/PDO/sessions go to `php-web`.

Two deliberate boundary calls:

- **`readonly` classes** (8.2) are covered here rather than in `php-oop`, framed as "what 8.2 added
  on top of 8.1's readonly properties". `php-oop` owns the property-level feature.
- **Clone-with** (8.5) is covered here rather than with cloning in `php-oop`, because it only makes
  sense next to `readonly` and asymmetric visibility. It sits in the write-control topic.

12 topics, all `quiz`, 120 questions.

## Topics

1. `php-modern-release-cycle` — The PHP Release and Support Cycle (intermediate)
2. `php-modern-attributes` — Attributes and Reflection (advanced, **milestone**)
3. `php-modern-first-class-callables` — First-Class Callables and the Pipe Operator (advanced)
4. `php-modern-readonly-dnf` — readonly Classes and DNF Types, PHP 8.2 (advanced)
5. `php-modern-builtin-attributes` — `#[\Override]`, `#[\Deprecated]`, `#[\NoDiscard]` (advanced)
6. `php-modern-property-hooks` — Property Hooks, PHP 8.4 (advanced, **milestone**)
7. `php-modern-write-control` — Asymmetric Visibility and Clone-With (advanced)
8. `php-modern-lazy-objects` — Lazy Objects, PHP 8.4 (expert)
9. `php-modern-array-functions` — array_find/any/all and friends (intermediate)
10. `php-modern-fibers` — Fibers and the State of Async PHP (expert, **milestone**)
11. `php-modern-opcache-jit` — Opcache, Preloading and the JIT (expert)
12. `php-modern-upgrading` — Upgrading a Codebase Across PHP Versions (advanced)

## Videos

Every id came from `yt.mjs search` and was confirmed with `yt.mjs info --chapters`
(`embeddable: true` in every case). There is no single authoritative long-form "PHP 8.x features"
course worth chapter-splitting across the whole camp, so this is mostly dedicated videos plus two
chapter-split deep dives.

- `php-modern-release-cycle` → **`M1ksgzGbS60`** "PHP 8.5: Full Review – What's New & What Changed!"
  (nunomaduro, 16:00, 34k views). Pre-verified in the brief; used as the "where PHP actually is
  now" orientation. Alternate **`vmSiuI2tVQ4`** "PHP 8.6 First Look" (PHP Annotated, 4:59, 1 month
  old) so the topic points at the *next* release too. Neither has chapter markers.
- `php-modern-attributes` → **`I7WJa-he5oM`** "PHP Attributes - Simple Router With Attributes"
  (Program With Gio, 22:59, 34.7k). Best available: it builds an attribute-driven router with
  reflection and covers targets, `IS_REPEATABLE` and inheritance — the exact material the quiz
  tests. Fifteen chapter markers if a learner wants to jump.
- `php-modern-first-class-callables` → **`UG_yb_WOutE`** "An overview of PHP 8.5's pipe operator"
  (PHP Annotated, 11:56). Covers the RFC mechanics, the callable requirement and the performance
  question. Alternate **`mNWA0N2mCFM`** (nunomaduro, 9:20, 18.2k) for the shorter, more
  enthusiastic take. No dedicated first-class-callable video is worth using: the best candidate,
  `rgrQSmUiFJQ` (JetBrains, 8:28), spends ~20 seconds on it at 402s.
- `php-modern-readonly-dnf` → **`1c00s84VZjE`** "PHP Is Not Dead - Let's Review PHP 8.2 Changes"
  (Program With Gio, 14:19, 46k) at **224s "New Feature: Type System Improvements"**, which runs
  straight into "New Feature: Readonly Classes" at 385s — both halves of the topic in one pass.
  Alternate **`2cyJq08q6xE`** (PHP Annotated, 3:15).
- `php-modern-builtin-attributes` → **`nJFsD0bnlTI`** "Readonly clones, #[Override], and
  json_validate" (PHP Annotated, 5:22, 17.1k) for `#[\Override]`, with alternate **`Wmsy2O_WysA`**
  (PHP Architect, 8:22) at **218s "#[\NoDiscard] Attribute"**. `#[\Deprecated]` has no dedicated
  English video worth linking; the quiz and refs carry it.
- `php-modern-property-hooks` → **`NrpPs52OwBM`** "PHP 8.4 with Sabatino & Brent" (Sabatino
  Develops, 1:13:40) at **1090s "Property Hooks"**, running into "Interfaces and Hooks" at 1665s.
  Views are modest (1.4k) but Brent Roose is a primary source on 8.4 and this is by far the
  deepest English discussion of hooks on YouTube. Alternate **`Y4B9QK1rXSM`** (PHP Annotated,
  4:18) for a fast version.
- `php-modern-write-control` → the same **`NrpPs52OwBM`** at **2607s "Asymmetric Visibility"**
  (different start, per CONTENT_GUIDE §3.4), alternate **`Wmsy2O_WysA`** at **276s "Clone()"**.
  No dedicated clone-with video exists in English; that PHP Architect chapter is the only one
  found that explains it directly.
- `php-modern-lazy-objects` → **`rwp8_eWLDv8`** "Lazy objects in PHP 8.4" (PHP Annotated, 34:37,
  9.8k) — a genuine deep dive with chapters. Alternate **`7J6Z0F4vItw`** (nunomaduro, 5:07).
  Also considered: `CVn9fOS_eL4` and `HflZlZ-5zho` (Tideways) — both good, both narrower
  (DI container / Doctrine specific).
- `php-modern-array-functions` → **`yuCTnlEUJ4c`** "Array_find in PHP 8.4" (PHP Annotated, 13:41).
- `php-modern-fibers` → **`Db-GFBGyD4w`** "PHP Fibers & Asynchronous Under 11 Minutes" (Desk Nook,
  10:45, 17.5k) as the primary, because it makes the fibers-are-not-concurrency point clearly at
  a sensible length. Alternate **`HWD0Cl7PJxo`** "Unlock Parallel Processing in PHP with Fibers"
  (International PHP Conference, 38:55) as the conference-grade deep dive.
- `php-modern-opcache-jit` → **`LcIkUpcaXZc`** "Everything about OPcache to increase PHP
  performance (2026)" (Tideways, 25:20, published Feb 2026 — the most current PHP-performance
  video found anywhere). Two alternates: **`wkhpNd7aYV8`** (Tideways, 12:06) for preloading and
  **`eJHEpZZtc0c`** (Doug Bierer, 7:57) for the JIT itself.
- `php-modern-upgrading` → **`ldpNCNNm7i8`** "Modernizing Code with Rector" (Laravel News, 7:34,
  Nov 2025). Alternate **`15tsiv6AvnE`** (nunomaduro, 3:56, 15.3k).

**No search-URL fallbacks.** Two weak spots worth flagging for a future refresh:

- **The JIT has no good dedicated video.** Everything found is either five years old
  (`eJHEpZZtc0c`, `4dqWsxbGwbs`), non-English (`g3RPYtwP1jk` French, `dlvg_-_5lKc` Arabic) or
  generic JIT-in-general content (`KVvGVPc7QM8`). That is why opcache/preloading/JIT became one
  topic anchored on the current Tideways opcache video, with the JIT video as an alternate.
- **`#[\Deprecated]` and clone-with** are only covered inside multi-feature roundups.

Rejected for language: `uKt4_wifKzA`, `mqe_Br8LeKI`, `LsJUC34ONdE` (Dias de Dev, Portuguese),
`WtzV2ukuxhI` (Devscast, French), `OIFbU5oypig` (Пых, Russian). Rejected for being
low-signal/SEO-farm content: the `Online WebTutorials`, `e Learning`, `CodeTube` and `blogize`
results that dominate searches for 8.4/8.5 feature names.

## References

- `php.net` manual pages used and confirmed 200: `supported-versions`, `migration85`,
  `migration85.new-features`, `migration85.incompatible`, `migration84.new-features`,
  `migration84.new-functions`, `migration84.deprecated`, `migration83.new-features`,
  `migration82.new-features`, `language.attributes`, `language.attributes.syntax`,
  `language.attributes.reflection`, `language.attributes.classes`,
  `functions.first_class_callable_syntax`, `language.operators.functional`,
  `language.oop5.basic`, `language.oop5.properties`, `language.oop5.property-hooks`,
  `language.oop5.visibility`, `language.oop5.cloning`, `language.oop5.lazy-objects`,
  `reflectionclass.newlazyghost`, `class.override`, `class.deprecated`, `class.nodiscard`,
  `language.fibers`, `class.fiber`, `fiber.suspend`, `function.array-find`, `function.array-any`,
  `function.array-all`, `function.array-first`, `opcache.configuration`, `opcache.preloading`.
- **Dead link avoided:** the pipe operator is **not** at `language.operators.pipe.php` (404). The
  real page is **`language.operators.functional.php`** ("Functional Operators").
- **php.watch slugs are not guessable.** These four all 404: `/versions/8.4/property-hooks`,
  `/versions/8.4/asymmetric-property-visibility`, `/versions/8.4/lazy-objects`,
  `/versions/8.3/override-attribute`. php.watch has **no page at all** for property hooks,
  asymmetric visibility or lazy objects; the real Override slug is `/versions/8.3/override-attr`,
  and the array one is `/versions/8.4/array_find-array_find_key-array_any-array_all`. The full
  per-version slug list can be recovered with
  `curl -s https://php.watch/versions/8.4 | grep -oE "href='/versions/[^']+'"` — note the **single
  quotes**, which is why a double-quote grep returns nothing.
- Where php.watch has no page, the second reference is the RFC on `wiki.php.net` (`property-hooks`,
  `asymmetric-visibility-v2`, `lazy-objects`, `clone_with_v2`, `dnf_types`, `fibers`,
  `pipe-operator-v3`, `attributes_v2`, `releaseprocess`, `marking_return_value_as_important`) or
  `stitcher.io/blog/new-in-php-84`. All confirmed 200.
- **Iframe previews:** `php.net`, `php.watch`, `stitcher.io` and `phpstan.org` all send
  `X-Frame-Options: SAMEORIGIN`; `github.com` sends `CSP frame-ancestors 'none'`. So almost every
  reference card in this camp falls back to a link preview. The exceptions that *do* frame:
  **`wiki.php.net` (all RFCs), `revolt.run`, `amphp.org` and `getrector.com`** — no framing
  restrictions.

## Facts verified

Checked on 2026-09-23 against php.net and php.watch, not from memory.

### Version and support status — **CONTENT_GUIDE §10b needs two corrections**

`curl -s "https://www.php.net/supported-versions.php"` (the page prints "Today: 23 Sep 2026"):

| Branch | Released | Active support until | Security support until |
| --- | --- | --- | --- |
| 8.2 | 8 Dec 2022 | 31 Dec 2024 | **31 Dec 2026** |
| 8.3 | 23 Nov 2023 | 31 Dec 2025 | 31 Dec 2027 |
| 8.4 | 21 Nov 2024 | **31 Dec 2026** (in 3 months) | 31 Dec 2028 |
| 8.5 | 20 Nov 2025 | 31 Dec 2027 | 31 Dec 2029 |

1. **§10b says "8.2 and earlier are end of life". That is wrong.** PHP 8.2 is still in
   security-only support until 31 Dec 2026, and php.net's releases JSON lists
   `supported_versions: ["8.2","8.3","8.4","8.5"]`. 8.1 and earlier are EOL.
2. **§10b says the current stable is 8.5.9.** `https://www.php.net/releases/index.php?json&max=1`
   returns **8.5.10, dated 27 Aug 2026**; php.watch's `/versions/8.5/releases` already lists
   **8.5.11**. The two sources disagree by one patch, so the notes and quizzes avoid patch numbers
   entirely and only assert branch-level facts.
3. §10b's other PHP claims check out: 8.4 = property hooks, asymmetric visibility, lazy objects,
   `new` in initialisers without parentheses; 8.3 = typed class constants, `json_validate()`,
   `#[\Override]`.

Release policy, from `wiki.php.net/rfc/releaseprocess`: `x.y.z → x.y.z+1` and `x.y.z → x.y+1.z`
must keep backward compatibility; only `x → x+1` may break it. **Binary compatibility may be
broken between feature releases**, which is why every compiled extension must be rebuilt per minor
— the single most common upgrade surprise, and the basis of one quiz question.

### PHP 8.5 feature list (from `migration85.new-features.php`, not from memory)

Pipe operator `|>`; closures and first-class callables in constant expressions; `#[\NoDiscard]`
plus the `(void)` cast; attributes on compile-time constants (`Attribute::TARGET_CONSTANT`);
`#[\DelayedTargetValidation]`; `#[\Override]` on properties; **static** asymmetric visibility;
backtraces for fatal errors; constructor promotion for `final` properties; casts in constant
expressions; **`clone` as a function** with a `$withProperties` parameter. New functions:
`array_first`, `array_last`, `get_error_handler`, `get_exception_handler`,
`curl_multi_get_handles`, `locale_is_right_to_left`. New always-enabled `uri` extension,
`php --ini=diff`, `max_memory_limit` INI, `FILTER_THROW_ON_FAILURE`.

### Per-feature details used in quizzes

- **Attributes.** Arguments must be constant expressions; `new` **is** allowed there since 8.1
  ("new in initializers"), which is what enables nested attributes — an earlier draft of this
  module got that wrong. Nothing is instantiated until `ReflectionAttribute::newInstance()`, which
  is also when target bitmasks and constructor types are enforced, so a misplaced attribute is a
  *runtime* failure. `getAttributes($name)` matches the class name exactly unless
  `ReflectionAttribute::IS_INSTANCEOF` is passed. Targets: CLASS, FUNCTION, METHOD, PROPERTY,
  CLASS_CONSTANT, PARAMETER, ALL (+ CONSTANT in 8.5); repeatability needs `Attribute::IS_REPEATABLE`.
- **First-class callables.** `CallableExpr(...)` produces a `Closure` with `Closure::fromCallable()`
  semantics and captures the scope where it was acquired. `new Foo(...)` is unsupported, and
  combining `(...)` with `?->` is a **compile-time** error. 8.5 allows them in constant expressions.
- **Pipe operator.** RHS must be a callable taking one parameter; more than one *required*
  parameter fails like any missing-argument call; **by-reference parameters are rejected**, so
  `sort(...)` can never be piped; arrow functions **must** be parenthesised or it is a fatal error;
  a non-callable RHS throws `Error`.
- **readonly classes (8.2).** Distributes `readonly` to all declared properties and hard-fails
  dynamic properties; `#[\AllowDynamicProperties]` on one is a compile error. Only typed,
  non-static properties allowed. Extendable only by another readonly class; `abstract readonly`
  and `final readonly` both legal; interfaces, traits and enums cannot be readonly (parse error).
  readonly writes are blocked "directly, by increment, by reference and by array operations"
  (php.watch 8.1), so `$this->arr['k'] = $v` throws. 8.3 added readonly anonymous classes and
  reinitialisation during `__clone()`; 8.4 forbade taking a reference to a readonly property inside
  `__clone()`.
- **DNF types (8.2).** Union on the outside, intersections as members: `(A&B)|null` is valid,
  `(A|B)&C` is not, redundant parentheses are rejected. 8.2 also added standalone `null`/`false`
  and the new `true` type.
- **`#[\Override]` (8.3).** Compile-time fatal error when no matching parent/interface member
  exists. **Cannot be used on `__construct()`.** 8.5 extended it to properties.
- **`#[\Deprecated]` (8.4).** Emits **`E_USER_DEPRECATED`**, not `E_DEPRECATED`; `message` and
  `since` are folded into the message and `since` is not validated. 8.5 added traits and
  compile-time constants as targets.
- **`#[\NoDiscard]` (8.5).** Warns on an unused return value; `(void)` suppresses. It is **not
  inherited** by overriding or implementing methods (the warning follows the declaration actually
  invoked), but a trait method keeps it. Safe to add on codebases supporting ≤8.4, since unknown
  attributes are inert.
- **Property hooks (8.4).** `get`/`set` on non-static properties only. **Incompatible with
  `readonly`.** Backed vs virtual depends on whether a hook references `$this->prop` by exact
  syntax. `set` parameter type must be the same or contravariant. With constructor promotion the
  constructor parameter takes the *property's* type, not the hook's. Hooks can be `final`; a child
  adding hooks drops the parent's default value; `parent::$prop::get()` reaches the parent hook.
  `&get` is required for element-wise writes to a backed array property, and `&get` + `set` on a
  backed property is disallowed. Serialisation split (straight from the manual): **get hook** —
  `var_export`, `json_encode`, `JsonSerializable`, `get_object_vars`, `__serialize`/`__unserialize`;
  **raw value** — `var_dump`, `serialize`, `unserialize`, `(array)` cast, `get_mangled_object_vars`.
- **Asymmetric visibility (8.4).** Typed properties only; set visibility same or narrower
  (`protected public(set)` is a syntax error); `public private(set)` ≡ `private(set)`;
  **`private(set)` is implicitly final**; taking a reference and writing an array element both
  follow the **set** visibility; no spaces allowed inside `private(set)`. 8.5 added static
  properties.
- **Clone-with (8.5).** `clone($obj, ['prop' => $v])`. Overrides are applied **after `__clone()`**
  runs, honour normal visibility, and **may reinitialise `readonly` properties on the copy** even
  when they were set on the original.
- **Lazy objects (8.4).** Ghost (initialises in place, indistinguishable afterwards) vs proxy
  (forwards to a real instance with a **distinct identity**). User-defined classes plus `stdClass`
  only. Triggers: property read/write, `isset`/`unset`, `ReflectionProperty` get/set, listing
  properties, `get_object_vars`, `foreach` over a non-Iterator, `serialize`/`json_encode`, cloning.
  **Non-triggers: `var_dump`, `debug_zval_dump`, `get_mangled_object_vars`, `(array)` cast,
  `ReflectionObject::__toString()`**, and methods that never touch state. If the initializer throws,
  the object is reverted to lazy. A ghost's destructor only runs if it was initialised. Cloning a
  proxy clones both halves and calls `__clone()` on the real instance.
- **Array functions.** `array_find`/`array_find_key`/`array_any`/`array_all` are 8.4, callback
  signature `fn($value, $key): bool`, all short-circuit. `array_find` returns the **value** and
  `null` on miss, so it cannot distinguish a matched `null` — php.watch says so explicitly.
  **`array_all([])` is `true`** (php.watch states this directly); `array_any([])` is `false`.
  `array_first`/`array_last` are 8.5, return the first/last value in **insertion order** (the
  manual's own example is `[1=>'a', 0=>'b', 3=>'c', 2=>'d'] → 'a'`), and `null` on an empty array.
- **Fibers (8.1).** Stackful: `Fiber::suspend()` pauses the whole stack and works from inside
  VM-invoked callbacks such as an `array_map()` callback or an `Iterator` method. A suspending
  function keeps its ordinary return type. `suspend()` outside a fiber throws **`FiberError`**.
  `start()` returns the value given to `suspend()`, `suspend()` returns the value given to
  `resume()`, `throw()` raises inside the fiber, `getReturn()` only after termination. **Prior to
  8.4, switching fibers inside a destructor was not allowed.** No scheduler ships with PHP —
  Revolt/AMPHP/ReactPHP provide it in userland.
- **Opcache defaults** (from `opcache.configuration.php`): `opcache.enable=1`,
  `opcache.enable_cli=0`, `memory_consumption=128`, `interned_strings_buffer=8` (max 32767 on
  64-bit **as of 8.4**, 4095 before), `max_accelerated_files=10000` (rounded up to a prime from a
  fixed set, max 1000000), `validate_timestamps=1`, `revalidate_freq=2`, `save_comments=1`
  (disabling it breaks Doctrine annotations and PHPUnit). `opcache.enable` cannot be turned on at
  runtime, only off.
- **Preloading (7.4).** Loads functions/classes/interfaces/traits — **not constants**. Requires a
  persistent process, requires a restart to clear, and is **not supported on Windows**. `include`
  executes the file (so declaration order matters, conditional declarations work);
  `opcache_compile_file()` does not execute, so files can be loaded in any order.
- **JIT.** Implemented inside opcache, uses DynASM (x86/x86-64 only), buffer carved out of the same
  shared segment (`memory_consumption` + `jit_buffer_size`). `opcache.jit` accepts
  `disable`/`off`/`on`/`tracing`/`function` or a 4-digit `CRTO` value; `tracing` = `1254`,
  `function` = `1205`. **Default change in 8.4: `opcache.jit` went from `tracing` to `disable`, and
  `opcache.jit_buffer_size` from `0` to `64M`. JIT was and remains off by default** — before 8.4 it
  was the zero buffer that disabled it, which is why `phpinfo()` used to say "tracing" on servers
  where nothing was ever compiled. `opcache.jit_hot_loop` default changed from 64 to 61 in 8.5.
  8.4 added `opcache_jit_blacklist()`.
- **8.4 deprecations that matter for upgrades** (from `migration84.deprecated.php`): implicitly
  nullable parameters (`function f(T $a = null)` → `?T`; and when such a parameter precedes a
  required one, the `= null` must be dropped too, because optional-before-required is itself
  deprecated), `0 ** -n`, `class _ {}`, `trigger_error()` with `E_USER_ERROR`, and the `E_STRICT`
  constant (the error *level* was already gone).

## Assessment shape

All 12 topics are `quiz`, matching `php-foundations`: the sandbox is a V8 isolate and cannot grade
PHP, so difficulty is carried by predict-the-output questions on real snippets. 120 questions;
every topic has at least two `isEdgeCaseOrInterviewQuestion` and at least one multi-select.
