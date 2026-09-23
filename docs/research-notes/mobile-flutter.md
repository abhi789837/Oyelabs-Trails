# Flutter UI & State research notes (2026-09-23)

16 topics, all `quiz` (160 questions, 48 edge-case/interview, 19 multi-select). Milestones:
`flutter-three-trees` (expert), `flutter-constraints` (advanced), `flutter-state-management`
(advanced). **No code challenges:** the sandbox runs JavaScript only, so Dart cannot be graded —
per the `## v3 decisions` entry in `docs/PROGRESS.md` and the PHP camps, the difficulty is carried
by predict-the-output and predict-the-layout questions on real Dart/Flutter snippets. Roughly a
third of the questions show code and ask what it renders, logs or throws.

Every video id came from `yt.mjs search` and was confirmed with `yt.mjs info` (exists,
`embeddable: true`, exact title/channel/duration), then re-confirmed in a second sweep after the
file was written — 47 unique ids, all embeddable, all durations matching what is in the file. No
search-URL fallbacks. All 57 reference URLs checked with `check-urls.mjs`: 200, and every one is
already its own final URL (no redirects shipped).

## Topics

| # | id | level | notes |
| --- | --- | --- | --- |
| 1 | `flutter-rendering-model` | advanced | engine/embedder split, Impeller vs Skia |
| 2 | `flutter-widgets-and-setstate` | intermediate | widget/State split, lifecycle order |
| 3 | `flutter-three-trees` | **expert, milestone** | `canUpdate`, `updateChild`, `const` |
| 4 | `flutter-build-context` | advanced | `of(context)`, InheritedWidget, `context.mounted` |
| 5 | `flutter-constraints` | **advanced, milestone** | one-pass layout, reading an overflow |
| 6 | `flutter-layout-widgets` | intermediate | Row/Column/Stack/Expanded/Flexible |
| 7 | `flutter-keys` | advanced | Value/Object/Unique/GlobalKey |
| 8 | `flutter-state-management` | **advanced, milestone** | setState → Provider → Riverpod → BLoC |
| 9 | `flutter-navigation` | intermediate | Navigator vs declarative, `go_router` |
| 10 | `flutter-async-ui` | intermediate | Future/StreamBuilder, AsyncSnapshot |
| 11 | `flutter-forms` | intermediate | Form/FormState/controllers/validators |
| 12 | `flutter-theming` | intermediate | M3 seeds, ThemeExtension, Cupertino |
| 13 | `flutter-animations` | advanced | implicit vs explicit, `AnimatedBuilder` child |
| 14 | `flutter-platform-channels` | advanced | MethodChannel, codec, Pigeon, FFI |
| 15 | `flutter-testing` | intermediate | widget tests, goldens |
| 16 | `flutter-devtools-performance` | advanced | profile mode, UI vs raster thread |

### Scope judgement

The brief listed 17 separate bullets and asked for 13–16 topics. `const` constructors and rebuild
cost were folded into `flutter-three-trees` rather than given their own topic — the brief frames
that topic as "why rebuilding a widget is cheap", and `const` is the compile-time half of the same
mechanism (Dart canonicalisation → identical instance → `updateChild` short-circuit). It carries
four questions there. `setState` sits in topic 2 (it is `StatefulWidget`'s own API) and
`InheritedWidget` in topic 4 (it is what `of(context)` actually uses), leaving
`flutter-state-management` free to be the library *decision* the brief asked for rather than a tour.

## Videos

The official **Flutter** channel carries this camp: 15 of the 47 ids are theirs, including the
whole `How Flutter Works #DecodingFlutter` six-part series (Apr–May 2025), which maps almost
one-to-one onto topics 1–3. Nothing better exists for those, and it is current.

- flutter-rendering-model: `How Flutter Works: Architecture (1/6)` (Flutter, 6:19). Alternates
  `…Engine and Embedders (6/6)` (7:34) and `Introducing Impeller` (14:49, 2023 — the only
  full-length Impeller explainer; its "new renderer" framing is dated but the mechanism is right,
  and the summary and quiz state the current defaults).
- flutter-widgets-and-setstate: `How Flutter Works: The State class (3/6)` (7:40). Alternates
  `Stateful widgets in Flutter` (Flutter, 3:34, Apr 2026 — the most recent thing on the channel for
  this) and `Flutter Widgets 101 Ep. 2` (Google for Developers, 7:09, 2018; 350k views, still
  correct because the widget/State split has not changed).
- flutter-three-trees: `How Flutter Works: The Three Trees (2/6)` (7:40). Alternates
  `The RenderObjectWidget (4/6)` (4:19), `The RenderObject (5/6)` (9:47), Deven Joshi's
  `Flutter's Three Trees` (4:31, Jan 2025).
- flutter-build-context: `InheritedWidgets | Decoding Flutter` (8:39) as the main, because the
  topic covers the mechanism as well as the handle. Alternates `BuildContext?!` (2:40, 168k views —
  canonical but too short to lead a 55-minute topic) and `Synchronous BuildContexts` (6:15), which
  is the `context.mounted` gotcha in full.
- flutter-constraints: `Flutter layout and constraints` (Flutter, 4:49, **Mar 2026** — the newest
  official layout video). Alternates `Unbounded height / width | Decoding Flutter` (4:54, 158k) and
  Flutter Community's `Flutter's Multi-Child Layout Algorithm` (53:01) for the deep version.
- flutter-layout-widgets: chapter-split from Flutter Mapp's `The Ultimate Flutter Tutorial for
  Beginners - 2025 Full Course` (`3kaGC_DrUnw`, 5:16:54, Jan 2025) at **"Expanded & Flexible"
  (15460)**. No current, focused, high-view video covers Row/Column/Stack/Expanded together;
  everything found was 4–8 years old. Alternates: Andrea Bizzotto's `Flutter Layouts Walkthrough`
  (22:40, 2018 — old but the layout model is unchanged and it is still the clearest walkthrough)
  and RetroPortal's `Stack & Positioned` (7:44).
- flutter-keys: `When to Use Keys - Flutter Widgets 101 Ep. 4` (Google for Developers, 9:40,
  535k views). Eight years old and still the definitive treatment — `canUpdate` has not changed.
  Alternate HeyFlutter `Flutter Keys & Value Key` (8:52).
- flutter-state-management: Hungrimind's `The Definitive Guide to our MVVM Architecture in Flutter`
  (7:32, Mar 2025, 22k views) as the main, because it follows the current official architecture
  guidance rather than advocating a library. Alternates: `Flutter State Smackdown: Comparing BLoC,
  Provider, Riverpod` (Fluttercon India 2025, 21:42 — directly on-topic and recent, but only ~290
  views, so it is an alternate rather than the main), plus Flutter Mapp's Riverpod (8:16) and Bloc
  (8:24) explainers. **Flagged:** no current, well-viewed, even-handed comparison video exists. The
  main sources of truth for this topic are the four webRefs, not the video.
- flutter-navigation: Hussain Mustafa's `Flutter GoRouter Tutorial` (17:37, Mar 2024 — the most
  recent go_router tutorial with real views). Alternates: official `go_router (Package of the Week)`
  (1:48) and Build with Akshit's 33:48 deep dive (2022; predates `pathParameters`, noted below).
- flutter-async-ui: HeyFlutter `Futures and Streams` (13:09). Alternates: Build with Akshit's
  `Streams in Flutter in 1 Shot` (19:00) and the Flutter Mapp course at **"FutureBuilder" (17227)**.
- flutter-forms: HeyFlutter `How To Use Form and TextFormField` (11:18, 2020, 50k views).
  **Flagged as the weakest video in the camp** — forms is poorly served on YouTube and everything
  found was either 5+ years old or had a few dozen views. The `Form`/`FormField` API has not changed,
  so it is accurate, just dated in styling. Alternates: HeyFlutter `TextField - Deep Dive` (23:50)
  and the Flutter Mapp course at **"TextField" (5912)**.
- flutter-theming: `Material 3 from design to deployment` (Flutter, 16:10). Alternates
  `ThemeExtensions | Decoding Flutter` (6:13) and the 2026 `Everything you don't know about
  building great native apps with Flutter` at **"Decoupling design: Material & Cupertino
  evolution" (140)** — worth having because Flutter is actively decoupling the design libraries.
- flutter-animations: `Creating custom explicit animations with AnimatedBuilder & AnimatedWidget`
  (Flutter in Focus, 5:37) as the main, since `AnimatedBuilder`'s `child` argument is the performance
  point of the topic. Alternates `Animation Basics with Implicit Animations` (4:11) and
  `…Built-in Explicit Animations` (6:34). All three are 2019 Flutter-in-Focus; the animation API is
  unchanged, and no newer official material covers it as precisely.
- flutter-platform-channels: HeyFlutter `How To Call Android Native Code` (6:35) for the mechanics,
  with the **2026** official `Everything you don't know about building great native apps with
  Flutter` at **"Native interop solutions: JNI, NIGen, FFIGen, and SwiftGen" (497)** as the first
  alternate so the current direction (generated bindings, not hand-rolled channels) is represented.
  Also HeyFlutter's Pigeon (8:37) and iOS (4:48) videos.
- flutter-testing: `UI tests #DecodingFlutter` (Flutter, 6:15). Alternates Tadas Petra's
  `Widget Testing with Flutter` (8:16) and Flutter Community's `How to make premium Golden tests`
  (9:31).
- flutter-devtools-performance: `Dive into DevTools` (Flutter, 14:26, 161k views). Alternates
  `Debugging performance issues with the Flutter DevTools` (Flutter Heroes 2024, 35:51) and
  `Flutter performance tips` (4:29).

The Flutter Mapp course (`3kaGC_DrUnw`) is used three times at three different start times
(15460 / 17227 / 5912); no two topics share a start. Its own full chapter list was read with
`yt.mjs info --chapters`, not guessed. No other video is reused across topics except
`2z7U6GU7QwQ`, which appears as an alternate in two topics at two different chapters.

## References

- `docs.flutter.dev` and `api.flutter.dev` send **no framing restrictions**, so every Flutter docs
  and API reference in this camp renders in the in-app iframe preview. That is unusual and worth
  knowing — it makes this camp's reference cards much better than the frontend camps', where
  MDN and react.dev both block framing.
- Blocked from iframe preview (the app falls back to a link card): `pub.dev` (CSP
  `frame-ancestors 'none'`, so go_router / pigeon), `dart.dev` (`X-Frame-Options: DENY`), and
  `flutter.dev/blog` (`X-Frame-Options: DENY`). `riverpod.dev` and `bloclibrary.dev` both allow
  framing.
- Redirects found and resolved to their final URLs before shipping:
  - `medium.com/flutter/keys-what-are-they-good-for-…` → `https://flutter.dev/blog/keys-what-are-they-good-for` (the Medium publication has moved to flutter.dev).
  - `docs.flutter.dev/perf/shader` → `docs.flutter.dev/perf/rendering-performance`. **The shader
    warm-up page no longer exists as a destination**, which independently corroborates that the
    SkSL-caching workflow is gone post-Impeller. Used the rendering-performance page instead.
  - `docs.flutter.dev/platform-integration/android/c-interop` and `…/ios/c-interop` both →
    `docs.flutter.dev/platform-integration/legacy-ffi-plugin`. The FFI *plugin* path is now labelled
    legacy; not used as a ref for that reason, the platform-views page is used instead.
  - `docs.flutter.dev/platform-integration/platform-adaptations` → `docs.flutter.dev/ui/adaptive-responsive/platform-adaptations`.
- Dead / unusable, replaced: `docs.flutter.dev/get-started/fundamentals/state-management` and
  `…/fundamentals/widgets` both 200 but land on the generic `docs.flutter.dev/learn/pathway`
  landing page, so `data-and-backend/state-mgmt/options` is used instead.
  `riverpod.dev/docs/introduction/why_riverpod` is a 404 — the motivation page is now
  `riverpod.dev/docs/from_provider/motivation`. `api.flutter.dev/flutter/widgets/Theme-class.html`
  is a 404 (`Theme` lives in `material`, not `widgets`).
  `docs.flutter.dev/app-architecture/case-study/state-management` is a 404;
  `app-architecture/guide` and `app-architecture/concepts` both resolve.

## Facts verified

Everything version-sensitive was checked against the project's own endpoint on 2026-09-23, not
recalled.

- **Flutter 3.47.5 stable, Dart SDK 3.13.4, released 2026-09-18.** Resolved by reading
  `current_release.stable` from
  `https://storage.googleapis.com/flutter_infra_release/releases/releases_linux.json` and matching
  the hash back to its release entry. This confirms `CONTENT_GUIDE.md` §10b's "Dart 3.13, Flutter
  3.47". The 3.47.x line began 2026-08-12 (3.47.0 / Dart 3.13.0); 3.49.0 is in beta.
- **Impeller**, from `docs.flutter.dev/perf/impeller`, quoted precisely because this is the camp's
  biggest staleness risk:
  - iOS: "the **only supported** rendering engine … with no ability to switch to Skia".
  - Android: "available and enabled by default on Android API 29+"; below that, or without Vulkan,
    it "falls back to the legacy OpenGL renderer".
  - macOS, Linux, Windows: "available and enabled by default **as of Flutter 3.47**" — i.e. this is
    new in the current stable, and any material older than Aug 2026 will say otherwise.
  - Web: "currently uses Skia for rendering. It might use Impeller in the future."
  - Shaders: Impeller "precompiles a smaller, simpler set of shaders at engine-build time so they
    don't compile at runtime" and "builds all pipeline state objects upfront". This is why the
    quiz treats SkSL caching as obsolete advice.
- **`Widget.canUpdate`** source, quoted from the API docs:
  `oldWidget.runtimeType == newWidget.runtimeType && oldWidget.key == newWidget.key`. Nothing else.
- **`Element.updateChild`** short-circuits on an identical widget instance
  (`hasSameSuperclass && child.widget == newWidget` → update the slot if needed and return the
  existing child without rebuilding). This is the documented mechanism behind `const`, and the
  basis of `flutter-three-trees` q4.
- **`State.setState`** documented errors: "setState() called after dispose()",
  "setState() called in constructor", and "setState() callback argument returned a Future." The docs
  also explicitly prefer cancelling timers/listeners in `dispose` over guarding with `mounted`,
  which is what `flutter-widgets-and-setstate` q8 tests.
- **Constraints**, from `docs.flutter.dev/ui/layout/constraints`: "Constraints go down. Sizes go up.
  Parent sets position", plus the verbatim limitations (a widget "can't have any size it wants";
  it "can't know and doesn't decide its own position in the screen"). The worked examples used in
  the quiz are the docs' own: tight-constraint `Container` filling the screen; `Center` + 100×100;
  `ConstrainedBox(minWidth: 70)` clamping a 10px child to 70; `UnconstrainedBox` with
  `width: double.infinity` producing "BoxConstraints forces an infinite width"; `OverflowBox` as the
  silent variant of `UnconstrainedBox`.
- **`Flexible` vs `Expanded`**: `Flexible` "does not require the child to fill the available space"
  (`FlexFit.loose`); `Expanded` is `FlexFit.tight`. Flex factors divide *remaining* space, which is
  what `flutter-layout-widgets` q1 (300px → 60 / 160 / 80) checks.
- **`FutureBuilder`**: "It must not be created during the State.build or StatelessWidget.build
  method call"; if it is, "every time the FutureBuilder's parent is rebuilt, the asynchronous task
  will be restarted." Connection states `none`/`waiting`/`active`/`done`; a failed future is still
  `done` with `hasError` true and `hasData` false.
- **`matchesGoldenFile`**: updated with `flutter test --update-goldens`; "Custom fonts may render
  differently across different platforms, or between different versions of Flutter"; "a golden file
  generated on Windows with fonts will likely differ from the one produced by another operating
  system"; the default test font is Ahem (boxes) unless loaded via `FontLoader`.
- **Performance best practices** (`docs.flutter.dev/perf/best-practices`), used directly in
  `flutter-three-trees` and `flutter-devtools-performance`: "Use `const` constructors on widgets as
  much as possible"; "Avoid overriding `operator ==` on Widget objects, as it results in O(N²)
  behaviour"; localize `setState`; prefer `StatelessWidget` over helper functions; avoid the
  `Opacity` widget in animations; use lazy builder methods for large lists; avoid intrinsic passes;
  frame budget "built in 8ms or less, and rendered in 8ms or less, for a total of 16ms or less"; and
  "Avoid putting non-animation-dependent subtrees in `AnimatedBuilder` builder functions".
- **`MediaQuery.sizeOf`**: "using this function will only rebuild the `context` when this specific
  attribute changes, not when *any* attribute changes." Used for the keyboard/`viewInsets` question.
- **`useMaterial3`** is `true` by default and is **not** deprecated, though the docs say "in the
  long run this flag will be deprecated and eventually only Material 3 will be supported." The quiz
  deliberately tests that M3 is the default rather than the flag's version history.
- **Flutter's app-architecture guidance is library-neutral** — it prescribes layering, a repository
  as single source of truth and unidirectional data flow, and names no state-management package.
  `flutter-state-management` q8 rests on this.
- **Package versions from pub.dev's API (2026-09-23)**, used to keep the state-management and
  navigation topics honest: `flutter_riverpod` **3.4.3** (Riverpod 3 is current; the docs lead with
  `@riverpod` codegen and `Notifier`/`AsyncNotifier`, with a 2.0→3.0 migration guide), `go_router`
  **18.0.1** (requires Flutter ≥ 3.44; `GoRoute`, `ShellRoute`, `StatefulShellRoute`,
  `state.pathParameters`, `state.uri`, and `context.go/push/pushReplacement/goNamed` all confirmed
  present in the current API docs), `provider` **6.1.5+1**, `flutter_bloc` **9.1.1** / `bloc`
  **9.2.1**, `pigeon` **29.0.2**.
  Because Riverpod in particular moves fast, no quiz answer depends on Riverpod syntax — the one
  Riverpod-specific question (`flutter-state-management` q9) is *about* the churn: it asks the
  learner to recognise that `StateNotifierProvider` + `ref.watch(provider.state)` signals an older
  major version that should be version-checked before copying.

## Deliberately dated sources, and why

Several videos are 5–8 years old. Each was kept only where the underlying API is genuinely
unchanged, and none of them is the sole source for a version-sensitive claim:

- `Flutter Widgets 101` (2018) — the widget/State split and key semantics are identical today.
- Bizzotto's layout walkthrough (2018) — the constraint algorithm has not changed.
- Flutter in Focus animations (2019) — `AnimationController`/`Tween`/`AnimatedBuilder` unchanged.
- HeyFlutter forms and channels (2020–21) — `Form`/`FormState` and `MethodChannel` unchanged;
  the *recommended* interop path has changed, which is why the 2026 official video is an alternate.

Where currency matters — Impeller, Material 3, interop direction, state management, go_router —
the main or first alternate video is from 2025 or 2026.
