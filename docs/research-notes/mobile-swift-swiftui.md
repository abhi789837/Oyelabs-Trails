# Swift & SwiftUI research notes (2026-09-23)

Camp 6 of the v3 Mobile track. 17 topics, all `quiz`, 170 questions. Written for an engineer who
already knows another modern language — the React bridges are used deliberately and then broken
where they mislead (a `View` is a value, identity is structural not key-based, `@Observable`
tracks property *reads* at runtime and React has no analogue for that).

## Scope decision

The brief listed 11 language items and 8 SwiftUI items and asked for 14–17 topics, so two merges
were needed to stay inside the range:

- **Modifier ordering folded into `swift-ui-layout`.** Modifier order *is* a layout question in
  SwiftUI — `.padding().background()` differs from `.background().padding()` because modifiers
  wrap — so teaching them apart would have duplicated the same wrapping model twice.
- **The declarative model and view identity merged into `swift-ui-views`.** They are one mental
  model ("a View is a description; SwiftUI matches descriptions to stored state by identity"), and
  WWDC21 *Demystify SwiftUI* covers exactly that pair, so the merge also got a better video than
  either half would have had alone.

That gives 11 language + 6 SwiftUI by topic count. By minutes it is closer to even (the SwiftUI
topics are 40–55 min each and `swift-property-wrappers` is deliberately positioned as the bridge
between the halves — it is the language feature that makes `@State` and `$binding` legible).

Not covered here, by instruction: platform-neutral mobile concepts, React Native, Dart, Flutter,
Kotlin/Compose, CI/release. SwiftData, Swift Testing, Combine and the Swift package manager are
also out — none were in the brief and each would need its own camp.

## Videos

Every id came from `yt.mjs search` and was confirmed with `yt.mjs info` (embeddable, channel,
language, duration). No search-URL fallbacks. Apple's official WWDC sessions carry eight of the
seventeen topics, which is the right call for Swift because Apple ships the language and the
framework and their sessions are the only source that is reliably current on Swift 6 concurrency
and Observation.

| Topic | Video | Why |
| --- | --- | --- |
| `swift-tour-arc` | `boiLzazJ9j4` WWDC24 *A Swift Tour* (Apple, 27:36) | Orientation for someone arriving from another language: value types, optionals, classes, protocols, concurrency in one pass. Alternate `GFq6sV2jD_c` WWDC21 *ARC in Swift: Basics and beyond* (20:42) carries the ARC half properly, including lifetime shortening. |
| `swift-optionals` | `L3FuDHIv5Ws` Sean Allen, *Swift Optionals – How to Unwrap* (14:19) | Focused, still current; optionals have not changed. |
| `swift-structs-classes` | `LzBZjwEY9as` WWDC25 *Improve memory usage and performance with Swift* (31:31) at **497s "Allocations"** | Chapter-split. The 497→1792 span covers allocations, exclusivity, stack vs heap and reference counting — the actual cost model behind the struct/class decision. Alternate `LtlbB4-6k_U` Sean Allen *Class vs. Struct* (7:27) for the plain version. |
| `swift-enums-patterns` | `84HoS9W2tpw` Stewart Lynch, *Mastering Switch Statements* (37:22, **published 2026-01-18**) | Newest video in the camp and the only one that treats pattern matching as a topic in its own right rather than a `switch` tutorial. |
| `swift-errors` | `ss50RX7F7nE` Swiftful Thinking, *Do, Try, Catch, and Throws* (26:34) | Solid on the core. Predates typed throws, so alternate `N7a_hOqkhkY` AppStuff *Typed Throws – NEW Swift 6 Feature* (12:03) covers the Swift 6 addition and the summary says which is which. |
| `swift-protocols` | `0gM1wmW1Xvc` Swiftful Thinking, *How to use Protocols in Swift* (28:37) | Teaching-level. Alternate `5jkTI3Ojmqg` WWDC22 *Design protocol interfaces in Swift* (25:31) for associated types and primary associated types. |
| `swift-generics-opaque` | `AvRirfTKR9g` WWDC22 *Embrace Swift generics* (27:29) | The canonical `some` vs `any` explanation, from the team that designed it. Alternate `rx3uRICZr5I` Swiftful Thinking *Generics* (19:24). |
| `swift-closures-capture` (milestone) | `ND44vQ5iJyc` Sean Allen, *Swift Closures Explained* (14:23) | Two alternates because this is the milestone: `xiS5gJOIQxI` *@escaping Explained* (4:44) and `TPHp9kR0Go8` Swiftful Thinking *How to use weak self* (20:33). |
| `swift-property-wrappers` | `cCOHJkd3kBE` Swift and Tips, *Why property Wrappers are so important* (17:47) | Framing-first rather than syntax-first. Alternate `2wzq6SQkSJE` Swiftful Thinking (51:33) builds custom wrappers end to end. |
| `swift-async-await` | `u2rYp8AMuSg` WWDC25 *Embracing Swift concurrency* (28:01) at **360s "Asynchronous tasks"** | Alternate `nyuq9qc-2H8` WWDC21 *Explore structured concurrency* (27:54) is still the best explanation of child tasks, though it predates Swift 6. |
| `swift-actors-data-race` (milestone) | `u2rYp8AMuSg` at **898s "Sharing data"** | Same video, different chapter — see the note below. Alternate `75-c6jSE8kU` WWDC24 *Migrate your app to Swift 6* (41:48). |
| `swift-ui-views` (milestone) | `XwdVz0Ef1vU` WWDC21 *Demystify SwiftUI* (40:17) | Still the definitive session on identity, lifetime and dependencies; nothing since has replaced it. Alternate `HyQgpxX__-A` WWDC24 *SwiftUI essentials* (24:16). |
| `swift-ui-state` | `AiP7KGFvZ6Q` tundsdev, *When to Use @State, @Observable and @Environment* (38:26) | Deliberately chosen because it teaches `@Observable`, not `ObservableObject`. Alternate `EK7SthdWV2w` Sean Allen (7:56) is the short version of the same story. |
| `swift-ui-layout` | `ao0s5rMCIgc` WWDC22 *Compose custom layouts with SwiftUI* (27:01) | Opens with the proposal-and-choose negotiation before the `Layout` protocol, which is the part that fixes people's mental model. Alternates `BN8IEiM_3qI` *Frames and Alignments* (12:07) and `lMteVjlOIbM` *GeometryReader* (16:02) cover the day-to-day mechanics. |
| `swift-ui-lists-navigation` | `oxp8Qqwr4AY` Sean Allen, *NavigationStack – Programmatic Navigation* (20:19) | Alternates `GZ-hQWMjT0s` Swiftful Thinking *NavigationStack* (23:59) and `CKmsqRN-VM0` *ForEach loops* (13:29). |
| `swift-ui-animation` | `IuSuHJs5-KE` WWDC23 *Explore SwiftUI animation* (30:01) | Explains that SwiftUI animates *values*, not code, which is the whole topic. |
| `swift-ui-uikit-interop` | `1GYKyQHVDWw` Swiftful Thinking, *Use UIViewRepresentable* (28:25) | Covers coordinator and delegate wiring properly; the API has not changed since. |

**One video reused at two start times.** `u2rYp8AMuSg` serves `swift-async-await` (360s) and
`swift-actors-data-race` (898s). Its chapter list splits exactly along that line — 360–898s is
tasks/interleaving/concurrent functions, 898–1572s is Sendable/actor-isolated types/actors — and
no other free video is both current on Swift 6 and this well structured. Both topics carry a
different alternate video so the two never show the same pair.

**Rejected:** `u6cgk1W6EXE` Stanford CS193p 2025 L5 *Layout & Data Flow* was the best layout
lecture found (recent, authoritative) but `yt.mjs info` reports **`embeddable: false`** — the whole
Stanford Online CS193p 2025 playlist is unusable in-app. Worth recording because it will keep
coming up in searches. Also rejected: the many 5–9-year-old ARC/closure videos that still show
`DispatchQueue`-era patterns, and `2wzq6SQkSJE` as a primary (51 minutes for a 40-minute topic).

Sibling-camp warning about machine-translated titles was checked: every `info` result above
reported the expected English title and channel.

## References

- **`docs.swift.org/swift-book/…` now redirects to `docs.swift.org/latest/documentation/…`** —
  Swift 6.4 shipped a new documentation site and the old `swift-book` path 301s onto it. The final
  URL is used throughout. Anyone re-checking these should expect the redirect rather than assume a
  typo.
- **The Structures and Classes chapter slug is `classesandstructures`, not `structuresandclasses`.**
  The obvious-looking slug is a hard 404; this cost one round trip.
- `https://www.swift.org/documentation/concurrency/` is a **JavaScript** redirect to
  `swift.org/migration/documentation/swift-6-concurrency-migration-guide/enabledataracesafety/`, so
  `check-urls.mjs` reports a 200 with the title "Redirecting…". The migration guide root
  `…/swift-6-concurrency-migration-guide/` returns **403**; `…/migration/documentation/migrationguide/`
  is the one that resolves, and that is what the module and `swift-actors-data-race` use.
- **hackingwithswift.com serves `/articles/<n>/<slug>` by number, ignoring the slug.** A plausible
  slug with the wrong number returns 200 with someone else's article — `/articles/250/whats-new-in-swift-6-0`
  is actually "What's new in SwiftUI for iOS 16". Every hackingwithswift URL here was confirmed by
  its returned `<title>`, not just its status. Several guessed `quiet-start` slugs silently
  redirect to `/quick-start` (a generic index) and were dropped.
- Iframe previews: **`developer.apple.com/documentation/…` allows framing and previews inline** —
  unusual for a vendor docs site and a nice result for the SwiftUI half of the camp.
  **`docs.swift.org`, `swift.org`, `hackingwithswift.com`, `swiftbysundell.com`, `fatbobman.com`
  and `github.com` all block it**, so those cards fall back to link previews.
- No interview-prep repo. There is no Swift equivalent of `lydiahallie/javascript-questions` worth
  shipping; the edge-case questions carry that weight instead. `swift-evolution` proposals are used
  with `kind: "spec"` where the proposal *is* the authoritative description (SE-0244, SE-0258,
  SE-0306, SE-0413).

## Facts verified

**Swift 6.4 is current**, released **15 September 2026** — confirmed two ways rather than from the
facts sheet: `swiftlang/swift`'s latest release tag is `swift-6.4.0-RELEASE`, and
`swift.org/blog/swift-6.4-released/` carries that date. swift.org's install banner reads
"Install (6.4.0)". This matches `docs/CONTENT_GUIDE.md` §10b.

Everything version-sensitive below was read off the primary source on 2026-09-23, not recalled.

- **Swift 6 language mode makes data-race diagnostics errors**, where Swift 5 mode with strict
  concurrency checking emitted warnings. This is the breaking change the brief flagged, and it is
  why most published concurrency material shows code that no longer compiles. Stated explicitly in
  `swift-actors-data-race` and in that topic's summary.
- **Swift 6.2 "approachable concurrency"** (from `swift.org/blog/swift-6.2-released/`, 15 Sep 2025):
  a target can default all code to `@MainActor` isolation; `nonisolated` async functions can, under
  an upcoming feature, run in the **caller's execution context** instead of always hopping to the
  global pool; **`@concurrent`** is the new attribute for opting a function into the concurrent
  thread pool. Both are used in `swift-async-await` q9 and phrased as "when the upcoming feature is
  enabled", which is how the release post frames it.
- **Actor reentrancy** — actors guarantee mutual exclusion *between* suspension points, not across
  them, so state can change during an `await` inside an isolated method. Used as the expert
  predict-the-behaviour question in `swift-actors-data-race` q1. Actors are also explicitly **not
  FIFO**; SE-0306 leaves resumption order unspecified to permit priority escalation.
- **Typed throws is Swift 6.0** (SE-0413, "Implemented (Swift 6.0)"). Confirmed from the proposal
  text that plain `throws` is sugar for **`throws(any Error)`** and a non-throwing function is
  **`throws(Never)`** (proposal lines 329/341/1361). Used in `swift-errors` q4.
- **`try?` flattens** an already-optional result since Swift 5 (SE-0230), so
  `try? f()` where `f() throws -> T?` is `T?`, not `T??`. `swift-errors` q6.
- **SE-0365 (Swift 5.8)** permits implicit `self` in a `[weak self]` closure *after* `self` is
  unwrapped — confirmed from the proposal's status line and from hackingwithswift's Swift 5.8 page.
  An earlier draft of `swift-closures-capture` attributed the `guard let self` *shorthand* itself to
  5.8; that was not verifiable, so the claim was narrowed to what SE-0365 actually says.
- **SE-0414 region-based isolation** lets a non-`Sendable` value cross an isolation boundary when
  the compiler can prove nothing else still references it. `swift-actors-data-race` q8.
- **`@Observable` replaced `ObservableObject` for new code.** Apple's own
  `swiftui/migrating-from-the-observable-object-protocol-to-the-observable-macro` is the source, and
  it is the first reference on `swift-ui-state`. Two consequences are asserted in quizzes and both
  come from that page plus `swiftui/managing-model-data-in-your-app`: **`@State` is now the wrapper
  used to own a model object** (replacing `@StateObject`), and tracking is **per-property, recorded
  during `body` evaluation** — so a property read only in `onAppear` registers no dependency.
  `@Bindable` is how you project bindings from an observable reference type.
- **`@Observable` is a macro, not a property wrapper.** Called out directly in
  `swift-property-wrappers` q5 because the shared `@` spelling makes people assume otherwise.
- **Springs are SwiftUI's default animation family from iOS 17** (`.smooth`, `.snappy`, `.bouncy`,
  and `.spring(duration:bounce:)`), and the parameterless `.animation(_)` modifier is deprecated in
  favour of `.animation(_:value:)`. `swift-ui-animation` q4 and q8.
- **`sizeThatFits(_:uiView:context:)` is iOS 16** and is how a `UIViewRepresentable` participates in
  SwiftUI's proposal-and-choose layout rather than relying on UIKit intrinsic sizing.
- **`NavigationStack` is iOS 16** and replaced `NavigationView`; `NavigationLink(value:)` +
  `.navigationDestination(for:)` defers destination construction, where the older
  `NavigationLink(destination:)` builds every visible row's destination eagerly.
  `NavigationTransition.zoom` is iOS 18.
- **Protocol extension dispatch**: members that are protocol *requirements* go through the witness
  table and honour the conforming type's implementation; members that exist only in the extension
  are dispatched statically on the declared type. `swift-protocols` q1 is built on this and q10 is
  the fix (promote the member to a requirement).
- **`@retroactive`** (Swift 6) is the acknowledgement required when conforming a type you don't own
  to a protocol you don't own. `swift-protocols` q7.
- **`let` properties of `Sendable` type on an actor are readable without `await`**; `var` properties
  are not, and cannot be written from outside at all. `swift-actors-data-race` q5.
- **Global `var`s are a data-race error under Swift 6** unless isolated to a global actor, made a
  `Sendable` `let`, or marked `nonisolated(unsafe)`. q7 of the same topic.
- **Opaque return types resolve to one concrete type**, so branching returns of different types are
  rejected — which is why `@ViewBuilder` produces `_ConditionalContent<A, B>` and why flipping an
  `if` branch changes a view's structural identity. This single fact ties `swift-generics-opaque`
  q1/q2 to `swift-ui-views` q2.
- **`try!`, out-of-range subscripts, and arithmetic overflow trap; they do not throw.** Swift's line
  is programmer error vs. condition. `swift-errors` q3.
- Anchor `#Strong-Reference-Cycles-for-Closures` on the ARC page was verified against the page's
  DocC JSON, not assumed — the rendered HTML is an SPA shell and contains no headings.

## Assessment shape

All 17 topics are **quiz**, per the `## v3 decisions` entry in `docs/PROGRESS.md`: the sandbox is a
V8 isolate and cannot grade Swift. Difficulty is carried by predict-the-output questions on real
Swift snippets (capture-list vs default capture, struct-holding-a-class copy semantics, `defer`
ordering, actor reentrancy losing updates, double optionals from a dictionary of optionals) and
predict-the-render questions on SwiftUI snippets (modifier order, `if`/`else` destroying child
state, transitions that silently do nothing). 170 questions across 17 topics; every topic has at
least two `isEdgeCaseOrInterviewQuestion` and at least one multi-select.

Milestones: `swift-closures-capture` (advanced — the classic Swift memory bug),
`swift-actors-data-race` (expert — the largest recent change to the language), and
`swift-ui-views` (advanced — view identity is the SwiftUI concept that separates a senior from a
mid-level engineer).

## Validation

`npm run content:check -- --module mobile-swift-swiftui` → 17 topics, 170 questions, **0 errors,
0 warnings**. `npm run content:types` → clean. The module was additionally type-checked in
isolation against `src/types/curriculum.ts` alone, to rule out a failure inherited from a sibling
camp being written in parallel.
