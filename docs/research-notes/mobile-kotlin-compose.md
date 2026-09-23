# Kotlin & Jetpack Compose research notes (2026-09-23)

Fifth camp of the v3 Mobile track. **17 topics, 9 language + 8 Compose**, all `quiz`.

## Scope decisions

- The brief asked for 14–17 topics, "roughly half language and half Compose", and named 13 Compose
  sub-topics plus 10 language ones. Two merges were needed to land inside the cap:
  - **"Kotlin's shape / why Android moved to it" merged with "`val`/`var`, inference, data classes"**
    into `kt-language-shape`. Both are the first-contact material for someone who already knows
    another modern language, and neither carries a full topic on its own at this audience's level.
  - **Navigation and View interop merged** into `kt-compose-navigation-interop`. They are the same
    question asked twice — how Compose sits inside a real Android app rather than a sample — and
    both are thin on their own. Theming kept its own topic because Material 3's role-based colour
    slots are a genuine concept, not a styling chore.
- **Everything else in the brief has its own topic**, including delegation (`by`), scope functions,
  and the three effect APIs.
- Not covered here, by instruction: platform-neutral mobile concepts, React Native, Dart, Flutter,
  Swift/SwiftUI, CI/release. Also deliberately left out: Kotlin generics/variance, Kotlin
  Multiplatform, Hilt/DI, Room, Compose custom layouts and canvas — all defensible, none named,
  and the cap was already binding.
- **`kt-coroutines`** (advanced) and **`kt-compose-recomposition`** (expert) are the two milestones,
  as the brief specified.

## Assessment shape

All 17 topics are **quiz**, no code challenges — 174 questions total. The sandbox
(`scripts/content/check.mjs` and the in-app worker) runs JavaScript only, so a Kotlin exercise
cannot be graded. This follows the established `## v3 decisions` rule in `docs/PROGRESS.md` and the
PHP camps. Difficulty is carried by predict-the-output questions on real Kotlin snippets
(coroutine ordering, scope-function return values, `Flow` collection, extension dispatch,
delegation forwarding) and predict-the-recomposition questions on Compose snippets. Every topic has
at least two `isEdgeCaseOrInterviewQuestion` items and at least one multi-select.

The React bridge is used explicitly and then broken, as instructed: recomposition vs re-rendering,
`remember` vs `useMemo`, hoisting vs lifting state up, `LaunchedEffect` vs `useEffect` — and then
the mismatches (no virtual DOM to diff, per-scope read tracking instead of subtree re-render,
stability with no React analogue, `===` comparison under strong skipping). Several edge-case
questions are exactly those mismatches.

## Videos

Every id came from `scripts/research/yt.mjs search` and was confirmed with
`yt.mjs info <id>` (`embeddable: true` for all 15 distinct ids). Durations and titles below are
`info`'s, not the search listing's.

**Language spine — `dzUc9vrsldM`** "Full 2025 Kotlin Crash Course For Beginners" (**Philipp
Lackner**, 3:11:50, published 2025-03-19). Chaptered finely enough to deep-link, and recent enough
to be K2-era. Used at five different `startSeconds`, never the same one twice:

| topic | start | chapter |
| --- | --- | --- |
| `kt-language-shape` | 692 | val and var (alternate at 7653, "Normal class & data class") |
| `kt-null-safety` | 2201 | Nullability & null-safe operators |
| `kt-functions-extensions` | 6123 | Extension functions |
| `kt-lambdas-higher-order` | 6745 | Lambda functions |
| `kt-sealed-when` | 9324 | Sealed interface & sealed class |

Other markers from the same video, left unused: 90 Why is Kotlin cool?, 1100 Arithmetic operators,
1378 Comparison operators, 1639 Logical operators, 1960 Console input, 2847 if conditions, 3348
when expression, 3588 Exceptions & try/catch, 3930 Arrays, 4561 Loops, 5470 Normal functions, 6547
Function overloading, 8308 Interfaces, 8774 Abstract classes, 9454 Enum classes, 9859 Singletons,
10169 Visibility modifiers, 10386 Generics.

Dedicated videos where one beat a chapter:

- `kt-scope-functions` → **`Vy-dS2SVoHk`** "Let, Also, Apply, Run, With" (Philipp Lackner, 11:44,
  2020-11-29). Oldest pick in the camp; scope functions have not changed since Kotlin 1.x, so the
  age is not a correctness risk. Rock the JVM's `d0BYBs4JSsE` (24:51) was the runner-up.
- `kt-coroutines` → **`0Hv5LTxAutw`** "Threads vs. Kotlin Coroutines vs. Dispatchers" (Philipp
  Lackner, 27:13, 2025-09-24). Recent and unusually precise about dispatcher sizing. Alternate:
  **`Of6cqKjEBGw`** "What Really Is Structured Concurrency In Kotlin?" (11:07, 2026-02-11).
- `kt-flow` → **`M8YtV47kaqA`** "Hot Flows vs. Cold Flows In Kotlin" (14:35, 2024-08-28), which is
  the conceptual half the topic leads with. Alternate **`6Jc6-INantQ`** "StateFlow vs. Flow vs.
  SharedFlow vs. LiveData" (18:08, 2021) covers all four types but frames them against LiveData,
  which is why it is the alternate rather than the primary.
- `kt-delegation` → **`MfJB-JhRAoQ`** "Full Guide to Delegation in Kotlin" (18:10, 2022).
- `kt-compose-declarative` → **`4zf30a34OOA`** "Intuitive: Thinking in Compose — MAD Skills"
  (**Android Developers**, 7:09). Alternate **`0yK7KoruhSM`** "From data to UI: Compose phases"
  (6:56).
- `kt-compose-state` → **`PMMY23F0CFg`** "State in Jetpack Compose" (Android Developers, 43:45) at
  **117 "State"**, with the same video at **998 "State Hoisting"** as the alternate. Full chapter
  list: 0 Introduction, 53 Overview, 117 State, 250 Events, 628 State Driven UI, 998 State
  Hoisting, 1338 Wellness Tasks, 1374 Design, 1607 Wellness Screen, 1803/1970 Modify…, 2110
  Testing, 2315 ViewModel, 2450 Remove Method.
- `kt-compose-recomposition` → **`d8SXNwy6VDs`** "How You Get Your Compose UI From Hundreds of
  Recompositions to Almost Zero" (Philipp Lackner, 30:22, 2025-05-18) — post-strong-skipping, which
  matters for this topic. Alternate **`_FtKhWvHiTg`** "@Stable and @Immutable" (16:47, 2023);
  note that one predates strong skipping being the default, so the summary and quiz carry the
  current rules rather than the video.
- `kt-compose-effects` → **`gxWcfz3V2QE`** "Full Guide to Jetpack Compose Effect Handlers"
  (24:56, 2022). The effect APIs are stable and unchanged, so the age is fine.
- `kt-compose-layout` → **`xc8nAcVvpxY`** "Fundamentals of Compose Layouts and Modifiers — MAD
  Skills" (Android Developers, 11:55). Alternate **`OeC5jMV342A`** "Constraints and modifier order"
  (12:22), which is the source for the single-pass constraint direction in the summary.
- `kt-compose-lists` → **`1ANt65eoNhQ`** "Lazy layouts in Compose" (Android Developers, 24:32) at
  **11 "Lazy Lists"**; other chapters 321 Lazy Grids, 642 Lazy Layout, 788 Useful Tips, 992
  Multiple Elements in One Item, 1114 Custom Arrangements. Alternate **`s8h7GJTZa4E`** "Top 3 Hacks
  to Remove LazyColumn Lag" (13:56).
- `kt-compose-theming` → **`I3eT32LXAKc`** "Introduction to Material 3" (Philipp Lackner, 18:04).
  Alternate **`jrfuHyMlehc`** "Implementing Material You using Jetpack Compose" (Android
  Developers, 14:18).
- `kt-compose-navigation-interop` → **`AIC_OFQ1r3k`** "Type-Safe Navigation with the OFFICIAL
  Compose Navigation Library" (Philipp Lackner, 10:03, 2024-05-15) — i.e. Navigation 2.8's
  type-safe routes. Alternates **`y10I6Suhvtc`** "From Views to Compose: Where can I start?"
  (Android Developers, 5:31) and **`qYzhqFdUEQg`** "Let's Migrate an XML Project to Jetpack
  Compose!" (15:49) cover the interop half.
- `kt-language-shape` also carries **`xT8oP0wy-A0`** Fireship "Kotlin in 100 Seconds" (2:21) as a
  second alternate.

**No search-URL fallbacks.** All 15 ids verified embeddable.

**Era warning found in the wild, and how it is handled.** Searching almost any Android topic
returns a majority of pre-Compose material (XML layouts, `findViewById`, `LiveData`, data binding)
and a second layer of early-Compose material that predates strong skipping and Material 3. No
video was rejected purely for age where the concept is unchanged, but where a video's era differs
from current behaviour the summary and quiz carry the current rules —
`kt-compose-recomposition` (strong skipping, Kotlin 2.0.20+), `kt-compose-theming` (`colorScheme`
vs M2's `colors`) and `kt-compose-navigation-interop` (Navigation 3) are the three affected topics,
and each names the era explicitly. `kt-compose-navigation-interop-q8` is a direct
"how do you tell this tutorial predates Compose?" question.

## References

- **`developer.android.com` cannot be checked with `scripts/research/check-urls.mjs`.** With the
  checker's desktop-browser user agent, every page 302s into a Google `accounts.google.com`
  auto-signin chain and the fetch fails (`status: 0`). With curl's default user agent the same
  URLs return 200. All 24 Android doc URLs in this module were verified with
  `curl -s -o /dev/null -w '%{http_code} %{url_effective}' -L <url>` instead. Worth fixing in the
  checker, since the whole Android/Compose half of this track depends on that host.
- Redirect to record: **`developer.android.com/develop/ui/compose/navigation` →
  `developer.android.com/guide/navigation`**, and `…/compose/compiler` →
  `…/compose/setup-compose-dependencies-and-compiler`. The final URLs are used.
  `developer.android.com/guide/navigation/use-graph/type-safety` is a **404**; the real page is
  `/guide/navigation/design/type-safety`.
- **`kt.academy` soft-404s**: it returns HTTP 200 with a generic `kt.academy` title for any
  nonexistent article slug (verified against a deliberately invented slug). Only
  `kt.academy/article/ek-extensions` resolved to a real headline ("Effective Kotlin Item 45…") and
  is the only kt.academy link shipped. `ek-nullability`, `ek-sealed`, `ek-delegates`,
  `ek-data-classes`, `cc-structured-concurrency` and `kfde-scope-functions` all look like 200s and
  are not verifiable — none used.
- **`medium.com/androiddevelopers/…` is unverifiable** from the checker: it serves a JS shell with
  a generic `Medium` title, and `check-urls.mjs` correctly flags every such URL as a soft 404. Five
  plausible Android Developers posts were tried and all flagged; none shipped. `elizarov.medium.com`
  (a personal subdomain) *does* serve real titles and passes cleanly, so the two Roman Elizarov
  posts are used.
- **Iframe previews**: `kotlinlang.org` sends `X-Frame-Options: SAMEORIGIN`, `github.com` sends
  `CSP frame-ancestors 'none'`, and `*.medium.com` sends `frame-ancestors 'self' https://medium.com`
  — all three fall back to link cards. `chrisbanes.me`, `jorgecastillo.dev`,
  `intelligiblebabble.com`, `m3.material.io` and `kt.academy` have no framing restrictions and do
  preview inline. `developer.android.com` could not be tested for framing for the UA reason above.
- Every `webRefs` list leads with a `kotlinlang.org/docs/…` or `developer.android.com/…` page, per
  the brief. `github.com/amitshekhariitbhu/android-interview-questions` is the only
  `interview-prep` source used (twice: scope functions and Flow) — there is no Kotlin equivalent of
  `lydiahallie/javascript-questions`, and inventing one would be worse than leaving the slot to a
  docs page.

## Facts verified

Checked on 2026-09-23 against the projects' own docs and release endpoints, not from memory.

- **Kotlin 2.4.20 is the current stable release**, published 2026-09-07
  (`curl -s "https://api.github.com/repos/JetBrains/kotlin/releases?per_page=8"`, and
  `kotlinlang.org/docs/releases.html`). This confirms `CONTENT_GUIDE.md` §10b's "Kotlin 2.4"; the
  K2 compiler is the only compiler. 2.5.x appears on the releases page as EAP/preview only.
  **No topic's answer depends on 2.4 specifically** — the version-sensitive claims in the quizzes
  are all about *when a rule arrived* (1.5, 1.7, 1.9, 2.0.20), which is stable information.
- **`when` exhaustiveness.** A `when` **expression** must always be exhaustive. Kotlin 1.6 emitted
  a warning for non-exhaustive `when` **statements** on enum/sealed/Boolean subjects, saying
  outright they "will be prohibited in 1.7"; from 1.7 it is an error
  (`kotlinlang.org/docs/whatsnew16.html`). A subjectless `when` used as an expression always needs
  `else`. Used in `kt-sealed-when-q7` and `-q8`.
- **Sealed classes.** Direct subclasses must be in the same **package and module** (the same-file
  rule ended in 1.5); a sealed class is implicitly abstract; **its constructors are `protected` by
  default** (`kotlinlang.org/docs/sealed-classes.html`). **`data object` is stable since Kotlin
  1.9** and exists for `toString`/`equals` symmetry with `data class` in the same hierarchy
  (`whatsnew19.html`).
- **Data classes.** Generated members derive **only from primary-constructor properties**; a body
  property is excluded from `equals`, `hashCode`, `toString`, `copy` and `componentN`. `copy()` is
  explicitly documented as **shallow**, with a worked `MutableList` example. Data classes cannot be
  `abstract`, `open`, `sealed` or `inner`, and the primary constructor needs at least one `val`/`var`
  parameter. `componentN` follows declaration order (`kotlinlang.org/docs/data-classes.html`).
- **`Dispatchers.IO` defaults to 64 threads or the number of cores, whichever is larger**, is
  configurable via `kotlinx.coroutines.io.parallelism`, and **shares threads with
  `Dispatchers.Default`** — so `withContext(Dispatchers.IO)` from `Default` often does not switch
  threads at all (kotlinx.coroutines 1.11.0 API docs, `Dispatchers.IO`). Used in
  `kt-coroutines-q8`.
- **Coroutine exception propagation.** `launch` propagates automatically; `async` exposes the
  failure through `await()`. The docs' distinction is about **root** coroutines: the worked example
  uses `GlobalScope.async` to show the exception reaching only `await()`. A non-root `async` is
  still a child, so its failure also cancels the parent — which is what `kt-coroutines-q10` tests,
  and why the correct option names both effects.
- **`MutableSharedFlow` with `replay = 0` and no buffer drops emissions made while there are no
  subscribers**, and `emit` does not suspend in that case. Used in `kt-flow-q4`.
- **`StateFlow`** always has a value, replays it to new collectors, conflates, applies
  `distinctUntilChanged` by `equals`, and never completes
  (`developer.android.com/kotlin/flow/stateflow-and-sharedflow`).
- **Flow context preservation**: emitting from a different coroutine inside `flow { }` throws
  "Flow invariant is violated"; `flowOn` affects only the upstream (`kotlinlang.org/docs/flow.html`).
- **Compose stability.** The compiler classifies types stable / immutable / unstable; **collections
  are always unstable** ("Compose always considers collection classes unstable"), as is any class
  with a `var` property or any class from a module the compiler did not process
  (`developer.android.com/develop/ui/compose/performance/stability`).
- **Strong skipping is enabled by default in Kotlin 2.0.20.** It makes all restartable composables
  skippable, compares **unstable parameters with instance equality (`===`)** and stable ones with
  `Object.equals()`, and **automatically wraps every lambda declared inside a composable in
  `remember`, keyed by its captures** (keys compared by the same `===`/`equals` rule).
  `@NonSkippableComposable` opts out
  (`developer.android.com/develop/ui/compose/performance/stability/strongskipping`). This is the
  single most out-of-date-prone area in the camp — most blog posts about `@Stable` predate it.
- **Lazy list keys.** Item state is keyed by **position** by default. A `key` makes remembered item
  state follow the item, and enables item-move animation. **The key's type must be supported by
  `Bundle`** (primitives, enums, `Parcelable`) because `rememberSaveable` inside an item is
  restored through it (`developer.android.com/develop/ui/compose/lists`). The current animation
  modifier is **`Modifier.animateItem()`** — the docs page uses `animateItem` throughout, not the
  older `animateItemPlacement()`.
- **Effects.** `LaunchedEffect` cancels and relaunches when a key changes and cancels on leaving
  the composition; `rememberCoroutineScope` is for launching from event handlers and is cancelled
  when the call leaves the composition; `rememberUpdatedState` captures a value in a long-lived
  effect without restarting it; `SideEffect` runs after every **successful** composition
  (`developer.android.com/develop/ui/compose/side-effects`). `LaunchedEffect` compares keys with
  `equals()`, which is why `kt-compose-effects-q9` uses a plain (non-`data`) class rather than a
  `List` as the "restarts every time" example — `listOf(a, b)` compares structurally and would
  *not* restart.
- **`ViewCompositionStrategy`.** The **default is
  `DisposeOnDetachedFromWindowOrReleasedFromPool`**, correct for an Activity and for pooling
  containers like `RecyclerView`; a `ComposeView` in a Fragment should use
  `DisposeOnViewTreeLifecycleDestroyed` (or `DisposeOnLifecycleDestroyed`)
  (`developer.android.com/develop/ui/compose/migrate/interoperability-apis/compose-in-views`). The
  same page states the current recommendation that Compose-only apps use a single Activity with
  "latest navigation libraries, like Navigation 3" and no Fragments.
- **Navigation.** `androidx.navigation` is at **2.10.1**; `androidx.navigation3` reached
  **stable 1.1.7** (Sept 2026) with 1.2.0-rc01 in flight. Navigation 3's model is an app-owned
  back-stack `List` rendered by `NavDisplay`. Type-safe `@Serializable` routes are Navigation
  2.8+ (release pages + `developer.android.com/guide/navigation/navigation-3`).
- **Material 3 in Compose** exposes `colorScheme`, `typography` and `shapes` from `MaterialTheme`
  — **no spacing scale**. `MaterialTheme.colors` is the Material 2 spelling. Dynamic colour needs
  **Android 12 / API 31**
  (`developer.android.com/develop/ui/compose/designsystems/material3`, `m3.material.io`).
