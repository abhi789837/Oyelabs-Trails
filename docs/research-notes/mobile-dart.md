# The Dart Language research notes (2026-09-23)

Third camp of the v3 Mobile track. Scope decision: **the language only**. Flutter widgets, state
management and tooling go to `mobile-flutter`; platform-neutral mobile concepts to
`mobile-foundations`. Where a Dart feature exists mainly to serve Flutter — `const` constructors
and canonicalisation above all — the topic explains *why* the framework needs it without teaching a
single widget. The `dart-const-constructors` summary frames it as "a framework that rebuilds a tree
of objects on every state change", which is true of Flutter and stays inside the language.

14 topics, all **quiz**, 146 questions. Written for someone fluent in JS/TS: the summaries and the
edge-case questions are built almost entirely from places where a JavaScript intuition gives the
wrong answer.

## Topic list

`dart-why-dart` · `dart-variables-types` · `dart-null-safety` ★ · `dart-collections` ·
`dart-functions-parameters` · `dart-classes-constructors` · `dart-const-constructors` ·
`dart-inheritance-mixins` · `dart-extension-methods` · `dart-generics` · `dart-records-patterns` ·
`dart-errors-exceptions` · `dart-async` ★ · `dart-isolates` ★ (★ = milestone)

Two merges were needed to fit the brief's 16 listed concepts into 11–14 topics:

- **"variables / `final` vs `const`" + "the type system and inference"** → `dart-variables-types`.
  They are the same lesson: what a declaration infers and what it freezes.
- **"sealed classes and exhaustive `switch`"** was split across two existing homes rather than
  given a topic. `sealed` is one of six class modifiers, so it lives in `dart-inheritance-mixins`
  alongside `base`/`interface`/`final`; exhaustiveness is a property of switch-over-sealed, so it
  lives in `dart-records-patterns` (which is titled "Records, Patterns and Exhaustive `switch`").
  Both get dedicated questions — `dart-inheritance-mixins-q5`/`q11` and
  `dart-records-patterns-q5`/`q6` — so nothing in the brief is dropped.

`async` stayed a single topic (Future + async/await + event loop + Stream + `async*`/`yield*`) per
the brief's own bullet, at 75 minutes with three alternate videos covering the sub-areas.

## Videos

Every id came from `yt.mjs search` and was confirmed with `yt.mjs info` (embeddable, exact title,
exact duration). **No search-URL fallbacks.**

Two spines, because no single current course covers this camp at the right granularity:

- **Flutterly's numbered Dart series** (2021) is the main spine — long, careful, one episode per
  concept, and still accurate for everything that predates Dart 3. Used for `dart-why-dart`
  (`nQRW0_Q9RFI` #1, 16:56 — the JIT/AOT framing is in the title), `dart-null-safety`
  (`ZZ4VVlggIVk` #9, 27:21), `dart-variables-types` (`Efaq4LvS-es` #10, 32:04), `dart-collections`
  (`fXMX7frTKIA` #11, 39:53), `dart-functions-parameters` (`xL_uC8qm2L4` #12, 19:30),
  `dart-classes-constructors` (`7rfehxYBukk` "Classes Explained I", 37:15),
  `dart-inheritance-mixins` (`OThpFGSzV1g` "Classes Explained II", 31:57), `dart-generics`
  (`q2PMQPV7JRg` #17, 25:37), `dart-async` (`Ky8RxFF4kug` #22, 43:18) and `dart-isolates`
  (`ArbJhSsEwTk` #20, 24:39).
- **Net Ninja's "Dart Crash Course"** (Jan 2024, Dart 3 era) is the short, modern counterweight and
  is used as `alternateVideos` on five topics (`sYG8aTg2a9s` #3, `NsrlCADdWdw` #4, `OjX0lOCn-8Q`
  #5, `R5wAK_kgqjo` #8, `8MywaeBqFmI` #10).

Dedicated videos where one beats a series episode:

- `dart-const-constructors` → **`B1fIqdqwWw8`** Reso Coder, "Dart `const` Tutorial – All You Need
  to Know (Const Expressions, Constructors, Canonical Instances)" (21:26). Canonicalisation is
  literally in the title; nothing else found covers it.
- `dart-extension-methods` → **`LaSWpdXrQ54`** Andrea Bizzotto (13:10), with the official Flutter
  channel's `D3j0OSfT9ZI` (6:14) and Reso Coder's `GkEuRVkeLpw` (17:41) as alternates.
- `dart-records-patterns` → **`a0jNJg7VLUc`** Randal L. Schwartz, "Dart 3 Records and Patterns
  Codelab notes" (21:37) — he walks the official codelab, which is also this topic's fourth
  `webRef`. Alternates: Robert Brunhage `j3fzeDpd2ts` (7:14), Flutter Explained `IybAuSPDucY`
  (11:30).
- `dart-errors-exceptions` → **`b7NAW9jZ3Qk`** Randal L. Schwartz, "Dart/Flutter Exceptions best
  practices" (17:51, **April 2025** — the most recent video in the camp). Alternates: his
  Fluttercon USA 2025 talk `AKqaivvB3vg` (35:43) and Smartherd `JMEIO1RwZfU` (8:47) for syntax.
- `dart-inheritance-mixins` alternate → **`n5WuBICxv_8`** Coding With Flutter, "Class Modifiers in
  Dart 3" (May 2024) — the Dart 3 half the 2021 Flutterly episode predates.
- Official Flutter channel shorts used as alternates: `5F-6n_2XWR8` "Why Flutter uses Dart" (1:36),
  `iYhOU9AuaFs` "Null safety in Dart" (5:27), `SmTCmDMi4BY` "Async/Await" (9:11), `nQBpOIHE4eE`
  "Dart Streams" (8:00), `vl_AaCgudcY` "Isolates and Event Loops" (5:48), `5AxWC49ZMzs` "Async vs
  Isolates" (4:24). Plus Fireship `NrO0CJCbYLA` and CodeX `WFfaaLwLobA`.

### Rejected

- **Every Vandad Nahavandipoor video is `embeddable: false` (oEmbed 401).** His Dart course is
  excellent and would have been the first pick for `dart-async` (`-zNC2hWftho`, 1:28:22),
  `dart-isolates` (`efxJfoL9KyY`, 51:12), `dart-errors-exceptions` (`2uyMvzTr9xI`, 37:41) and
  `dart-generics` (`hjwFh_UOVu0`, 1:07:39) — all four had to be replaced. **Worth knowing for the
  other Mobile camps: do not plan around this channel.**
- `Ej_Pcr4uC2Q` (freeCodeCamp, "Dart Programming Tutorial – Full Course", 1:41:53, 990k views) —
  seven years old, predates null safety entirely. Dangerous, not merely dated.
- `yRlwOdCK7Ho` (Flutter, "What's new in Dart and Flutter", 39:04, Google I/O 2023) — real and
  embeddable, but `info --chapters` returns an empty chapter list, so it could not be deep-linked
  and a 39-minute keynote is a poor primary for one concept.
- `F3JuuYuOUK4` (Flutterly, 8:03:04) is the compilation of the numbered series; the individual
  episodes are used instead so each topic gets a focused video rather than a start offset.

No chapter-splitting was needed: every topic got a video that is *about* that topic, so no
`startSeconds` is set anywhere in this camp.

## References

- **`dart.dev` is first in all 14 topics.** Pages used, all 200: `overview`, `tools/dart-compile`,
  `resources/language/evolution`, `language/variables`, `language/type-system`, `null-safety`,
  `null-safety/understanding-null-safety`, `tools/non-promotion-reasons`, `language/collections`,
  `libraries/collections/iterables`, `language/functions`, `language/typedefs`,
  `effective-dart/usage`, `effective-dart/design`, `language/constructors`,
  `language/primary-constructors`, `language/classes`,
  `tools/linter-rules/prefer_const_constructors`, `language/extend`, `language/mixins`,
  `language/class-modifiers`, `language/class-modifiers-for-apis`, `language/extension-methods`,
  `language/extension-types`, `language/generics`, `language/records`, `language/patterns`,
  `language/pattern-types`, `language/error-handling`, `language/async`,
  `libraries/async/using-streams`, `language/concurrency`, `language/isolates`.
- Non-`dart.dev` refs, all 200: `api.dart.dev` (`Iterable-class`, `Error-class`),
  `codewithandrea.com` (`dart-primary-constructors`, `flutter-exception-handling-try-catch-result-type`,
  `parse-large-json-dart-isolates`), `medium.com/dartlang` (`extension-methods-2d466cd8b308`,
  `dart-asynchronous-programming-streams-2b229b1ce012`,
  `dart-asynchronous-programming-isolates-and-event-loops-bffc3e296a6a`),
  `codelabs.developers.google.com/codelabs/dart-patterns-records`.
- Redirects to be aware of: `dart.dev/guides/language/evolution` → **`dart.dev/resources/language/evolution`**
  and `dart.dev/codelabs/dart-cheatsheet` → `dart.dev/resources/dart-cheatsheet`. The final URLs
  are the ones shipped.
- **No interview-prep ref.** There is no Dart equivalent of `lydiahallie/javascript-questions`.
  `github.com/iampawan/Flutter-Interview-Questions` and `github.com/Temidtech/Dart-Interview-Questions`
  both 404. Same call as the PHP camps: leave the slot empty rather than ship a guess, and let the
  edge-case questions carry that weight.
- **Iframe previews:** `dart.dev` sends `X-Frame-Options: DENY` on every page, so the whole primary
  reference set falls back to link cards. `api.dart.dev` has **no framing restrictions** and does
  preview inline — the only source in this camp that does, apart from `codewithandrea.com`, which
  also allows framing. `medium.com` (`CSP frame-ancestors 'self' https://medium.com`), `github.com`
  (`frame-ancestors 'none'`) and `codelabs.developers.google.com` all block.

## Facts verified

Re-checked on 2026-09-23 against dart.dev and the Flutter release feed, not from memory.

- **Dart SDK 3.13.4, Flutter 3.47.5 stable**, released 2026-09-18
  (`curl -s https://storage.googleapis.com/flutter_infra_release/releases/releases_linux.json`,
  `current_release.stable` → `dart_sdk_version: "3.13.4"`). dart.dev states its docs reflect
  **Dart 3.13.3**. This matches `docs/CONTENT_GUIDE.md` §10b. No patch number is quoted in content.
- **Language changes by release** (from `dart.dev/resources/language/evolution`), used to keep the
  camp current and to flag what online content predates:
  - **3.13** (12 Aug 2026): **primary constructors** — `class Point(var int x, var int y);`; a
    parameter *without* `var`/`final` induces no field. Plus concise constructor syntax (`new` /
    `factory` in the class body instead of repeating the class name).
  - **3.12** (18 May 2026): **private named parameters** — `Point({required this._x})` is called
    as `Point(x: 1)`; the leading `_` is stripped to derive the public name.
  - **3.11** (9 Feb 2026): no new language features.
  - **3.10** (12 Nov 2025): **dot shorthands** — `Status s = .running;`.
  - **3.9** (13 Aug 2025): null safety assumed when computing promotion, reachability and definite
    assignment.
  - **3.8** (20 May 2025): **null-aware elements** — `['Ada', ?nickname]` omits a null.
  - **3.7** (12 Feb 2025): **wildcard variables** — `_` is non-binding, so `(_, _)` is legal.
  - **3.6** (11 Dec 2024): digit separators, `1_000_000`.
  - **3.3** (15 Feb 2024): **extension types** (zero-cost wrappers).
  - **3.2** (15 Nov 2023): **private final fields promote**, including from outside the class.
  - **3.0** (10 May 2023): patterns, records, class modifiers, switch expressions, if-case. Also
    breaking: a plain `class` can no longer be used as a mixin (needs `mixin class`), and `:` as
    the default-value separator for a named parameter is now a **compile-time error** (use `=`).
    Used as the "this snippet predates Dart 3" marker in `dart-functions-parameters-q5`.
- **`var` is not JS's `var`**: it infers once from the initialiser and fixes the type. `var x;` with
  no initialiser infers `dynamic`.
- **`final` vs `const`**: `final` is assigned once at runtime and is *not* deep — a `final List` can
  be mutated. A `const` object and its fields are deeply immutable; `const [1,2].add(3)` compiles
  and throws `UnsupportedError` at runtime. Instance variables can be `final` but never `const`.
  Top-level and `static` variables are **lazily initialised on first use**.
- **Canonicalisation**: `assert(identical(const P(1,1), const P(1,1)))` succeeds — dart.dev states
  "Constructing two identical compile-time constants results in a single, canonical instance."
  A const constructor requires all instance fields `final` and no body, and "constant constructors
  don't always create constants — they might be invoked in a non-`const` context."
- **Null safety**: `late` has two jobs (deferred non-null check; lazy initialiser that runs on
  first read). `late final` assigned twice throws at runtime. Type promotion does not apply to
  mutable fields; private final fields have promoted since 3.2. `?.` short-circuits the *entire*
  remaining chain, not just the next member.
- **Collections**: bare `{}` is a **`Map`**, not a `Set` ("map literals came first"); an empty set
  needs `<T>{}`. `Iterable.map` is **lazy** — the callback does not run until iterated, unlike
  `Array.prototype.map`. `List.filled` is **fixed-length** by default (`growable: false`) and puts
  the *same* object reference in every slot.
- **Functions**: named parameters are optional unless `required`; optional positional `[]` and
  named `{}` cannot be combined in one signature. **"Closures inside of Dart's `for` loops capture
  the value of the index"** (dart.dev/language/loops) — so the classic `var`-loop trap prints
  `0 1 2` in Dart where JavaScript's `var` prints `3 3 3`. This is the inverse of the usual JS
  gotcha and is used as `dart-functions-parameters-q3`.
- **Constructors**: the initialiser list runs before the body; its right-hand side, and arguments
  to a superclass constructor, **cannot access `this`**. Factory constructors cannot access `this`
  and cannot return null. **Named constructors are not inherited.** A redirecting generative
  constructor must have an empty body. Declaring any constructor removes the implicit default.
- **Class modifiers** (from `language/class-modifiers`): `base` disallows `implements` outside the
  library; `interface` disallows `extends` outside; `final` disallows both; `sealed` is implicitly
  abstract, cannot be extended or implemented outside its library, and enables statically-checked
  exhaustiveness — **its subclasses are *not* implicitly abstract**. Mixin application is left to
  right, so the rightmost mixin wins a name clash; the `on` clause exists to define what `super`
  resolves to.
- **Extension methods** are resolved against the **static** type: "You can't invoke extension
  methods on variables of type `dynamic`" and "because extension methods are resolved statically,
  they're as fast as calling a static function." An instance member always wins over an extension
  member. Extensions may declare methods, getters, setters, operators and **static** fields — never
  instance fields. Unnamed extensions are library-private.
- **Generics are reified** — dart.dev contrasts this explicitly with Java erasure. Bounds use
  `extends`; F-bounds (`T extends Comparable<T>`) are supported; the implicit bound is `Object?`.
  Generics are **covariant**: "a `List` of `Cat` is a subtype of a `List` of `Animal`", so the
  unsound assignment is allowed and the failure is a runtime check at insertion.
- **Records**: structurally typed; shape = the set of fields, their types and their names; named
  field **order is not part of the shape**, so `(x:1, y:2) == (y:2, x:1)`. `==`/`hashCode` are
  auto-derived. Positional getters are `$1`, `$2`… and they **skip named fields**, so in
  `('first', a: 2, b: true, 'last')`, `$2` is `'last'`. From the accepted feature specification:
  "a record with only a single positional field must have a trailing comma" — `(123)` is the
  number, `(123,)` is the record. (The spec's 1.4 changelog entry removing single-element records
  is historical; the current spec body reinstates them with the comma rule.)
- **Errors**: `Error` and `Exception` are siblings, so `on Exception` does **not** catch a
  `RangeError`. There are no checked exceptions. `rethrow` preserves the stack trace, `throw e`
  resets it. `throw` is an **expression** (static type `Never`), so it works in `=>` bodies and on
  the right of `??`. Any non-null object can be thrown.
- **`assert`**: "In production code, assertions are ignored, and the arguments to `assert` aren't
  evaluated." Flutter enables them in debug mode; the CLI flag is `--enable-asserts`. Used twice
  (`dart-why-dart-q9`, `dart-errors-exceptions-q9`) because it is the single most dangerous
  misunderstanding in the camp.
- **Async**: the body of an `async` function "executes synchronously until it encounters its first
  `await` expression"; `await` on a non-Future wraps the value. Microtasks "are guaranteed to run
  before other asynchronous events (like Timer events)". **`Future.wait` is not `Promise.all`**:
  with the default `eagerError: false` it waits for every future to settle and then completes with
  the *first* error, discarding the rest; `eagerError: true` gives `Promise.all` semantics.
  Streams are single-subscription ("can only be listened to once") or broadcast (no buffering,
  many listeners). `sync*` → `Iterable`, `async*` → `Stream`.
- **Isolates**: "each isolate has its own memory and a single thread running an event loop";
  messages are copied; `Isolate.run()` "transfers the memory holding the result to the main
  isolate — it does not copy the data". Isolate groups share executable code, which is what makes
  `Isolate.spawn` cheap, and `Isolate.exit()` only works within a group. **"The Dart web platform
  does not support isolates"** — web workers are the analogue and have a different API.
- **`dart compile` subcommands**: `exe`, `aot-snapshot`, `jit-snapshot`, `kernel`, `js`, `wasm`.
  No JVM target.

## Assessment shape

All 14 topics are **quiz**; no code challenges. The sandbox is a V8 isolate and runs JavaScript
only, so a Dart exercise cannot be graded — the established v3 decision for non-JS languages
(`## v3 decisions` in `docs/PROGRESS.md`, and the PHP camps). Difficulty is carried by
predict-the-output questions on real Dart snippets, which test the same reading comprehension.

146 questions across 14 topics (min 9, max 12 per topic). Every topic has at least two
`isEdgeCaseOrInterviewQuestion` and at least one multi-select. Roughly two thirds of the edge-case
questions are built from a specific JS/TS mismatch:

| Wrong JS intuition | Question |
| --- | --- |
| `map` runs immediately | `dart-collections-q2` (lazy `Iterable`) |
| `{}` is an empty set/object | `dart-collections-q1` (it's a `Map`) |
| `var` loop closures capture the last value | `dart-functions-parameters-q3` (Dart captures per iteration) |
| `const` means "cannot reassign" | `dart-const-constructors-q1`/`q2` (canonical identity) |
| `strictNullChecks` is the same guarantee | `dart-null-safety-q1`, `q11` |
| generics are erased | `dart-generics-q1`, `q2` (reified + covariant) |
| `Promise.all` semantics | `dart-async-q3` (`Future.wait` waits for all) |
| `Stream` is an `AsyncIterable` | `dart-async-q4`, `q9` (subscription kinds, backpressure) |
| workers can share memory | `dart-isolates-q9` (no `SharedArrayBuffer` equivalent) |
| `async` gives you a second thread | `dart-isolates-q3`, `dart-async-q11` |

## Validation

- `npm run content:check -- --module mobile-dart` → **1 module, 14 topics, 146 quiz questions,
  0 errors, 0 warnings.**
- `npm run content:types` → no errors in `src/content/mobile/mobile-dart.ts`. The run does report
  three pre-existing `TS6133` unused-variable errors in `src/content/frontend/fe-svelte.ts`
  (another camp's file, left untouched).
