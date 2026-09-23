# React Native & Expo research notes (2026-09-23)

16 topics, prefix `rn-`. 12 quizzes (114 questions), 4 code challenges.

## Versions verified (not taken from CONTENT_GUIDE §10b on trust)

Checked against each project's own npm dist-tags and release pages on 2026-09-23.

| Package | Verified | Source |
| --- | --- | --- |
| `react-native` | **0.87.1** (`latest`); `next` 0.88.0-rc.2 | `registry.npmjs.org/react-native` dist-tags |
| `expo` | **57.0.24** (`latest` === `sdk-57`); `next` 58.0.0-preview.5 | `registry.npmjs.org/expo` dist-tags |
| `expo-router` | 57.0.22 (`latest`) | npm dist-tags |
| `expo-updates` | 57.0.23 | npm dist-tags |
| `eas-cli` | 24.7.0 | npm dist-tags |
| `react-native-reanimated` | **4.7.0** | npm dist-tags |
| `react-native-gesture-handler` | 3.3.0 (`legacy` 2.33.0) | npm dist-tags |
| `@shopify/flash-list` | 2.3.2 | npm dist-tags |
| `@react-navigation/native` | 7.4.1 (`next` 8.0.0-alpha.48 — **still alpha**) | npm dist-tags |

CONTENT_GUIDE §10b's claim (RN 0.87 + New Architecture default, Expo SDK 57, Expo Router,
EAS Build/Submit) is **confirmed**. One nuance worth recording: **Expo SDK 57 ships React Native
0.86, not 0.87** (per the SDK 57 changelog), and React 19.2. The module description says so
explicitly so the numbers don't read as contradictory.

Note that React Navigation **v8 is still alpha**, so the "React Navigation v8 Crash Course" video is
used only as an `alternateVideo`, never as the primary source for a claim.

## New Architecture timeline (the accuracy risk in this camp)

Taken from reactnative.dev's own blog index, which lists every release post with its date:

- **0.68** (2022) — New Architecture available as an experimental opt-in.
- **0.74** (2024) — "Bridgeless New Architecture".
- **0.76** (Oct 2024) — *New Architecture by default*; React Native DevTools introduced.
- **0.80** (Jun 2025) — React 19.1; deep-import deprecation + Strict TypeScript API introduced;
  "Freezing Legacy Arch".
- **0.82** (Oct 2025) — *"the first React Native that runs entirely on the New Architecture"*.
- **0.83** (Dec 2025) — React 19.2; DevTools Network + Performance panels; first release with no
  user-facing breaking changes.
- **0.84** (Feb 2026) — Hermes V1 by default; continued removal of the Legacy Architecture;
  precompiled iOS binaries by default.
- **0.85** (Apr 2026) — new animation backend; Jest preset moved to its own package.
- **0.86** (Jun 2026) — edge-to-edge on Android 15+; DevTools improvements.
- **0.87** (Aug 2026) — Strict TypeScript API becomes the default; Metro 0.87; experimental
  Swift Package Manager; minimum Node.js 22, AGP 9, Kotlin 2.0+.

**Caveat recorded for the app:** `https://reactnative.dev/architecture/landing-page` is stale — it
still documents `newArchEnabled=false` / `RCT_NEW_ARCH_ENABLED=0` opt-outs (page footer: "Last
updated on Mar 22, 2026"). Those opt-outs no longer exist on 0.82+. The topic summary and quiz say
so directly, and the 0.82 blog post is cited alongside the landing page as the corrective.

## Videos

All ids come from `yt.mjs search` and were confirmed with `yt.mjs info` (every one reports
`embeddable: true`). No fallback/search URLs were needed.

- `rn-vs-react-dom`: *From React to React Native in 12 Minutes* (Simon Grimm, 12:33, Jul 2024,
  65k views) — the only video framed exactly at "you already know web React". Alt: Fireship,
  *React Native in 100 Seconds*.
- `rn-new-architecture`: *The Bridge is Dead — React Native New Architecture Explained (2026)*
  (Akshat Paul, 12:10, **May 2026**). Low view count (~1k) but chosen deliberately: it is the only
  verified video dated after 0.82 that treats the bridge as removed rather than optional. Alts:
  Software Mansion *React Native under the hood* (App.js Conf 2024, 21:19) and Callstack
  *Getting React Native New Architecture to You* (RUC 2024, 24:48) — both good but pre-0.82, so the
  summary states which parts describe an architecture that was then still optional.
- `rn-expo-vs-bare`: *Expo Go & Development Builds: Which should you use?* (Expo, 21:36, Sep 2024,
  221k views) — Expo's own channel, and the Expo Go / development build split is exactly this
  topic's decision. Alt: Theo, *More proof you need to use Expo...*.
- `rn-styling-flexbox`: *React Native Flexbox Explained* (Hitesh Choudhary, 17:14, Feb 2023, 75k).
  Alt: same channel's *Fundamentals of Stylesheet* (17:51, 127k). Both are 2023 but Yoga's defaults
  and the `StyleSheet` API have not changed; nothing in either is architecture-dependent.
- `rn-navigation`: *Introduction to Expo Router Layout Files* (Expo, 12:54, Apr 2025, 73k).
  Alts: Simon Grimm *10 Tips You NEED For Expo Router in 2026!* (Feb 2026) and Code with Beto
  *React Navigation v8 Crash Course* (Mar 2026). **Caveat:** all three predate the SDK 56 import
  move, so the summary states the `expo-router/*` entry points explicitly.
- `rn-lists-performance`: *You've Been Building React Native Lists Wrong All Along* (Simon Grimm,
  13:42, Oct 2024, 23k). Alt: Code with Beto chapter-split at **533 s** ("Prefer FlatList over
  ScrollView for large lists"). The video predates FlashList v2, so the v2 changes are sourced from
  the FlashList docs instead and called out in the summary.
- `rn-images-assets`: *How to handle Images in React Native* (Hitesh Choudhary, 18:08, Mar 2023,
  35k). **Weakest video choice in the module.** Six searches (`expo-image caching`,
  `expo image blurhash placeholder`, `React Native image optimization 2025`, `Image component
  resizeMode`, …) turned up nothing current and substantial on `expo-image`; the field is dominated
  by image-*picker* tutorials. This one covers the core `Image` model correctly but predates
  `expo-image` entirely, so the first two `webRefs` carry that half and the summary is explicit
  about it. **Worth a manual re-pick if a better video appears.**
- `rn-platform-specific-code`: *Platform Specific Components, Layouts & Styling with React Native*
  (Simon Grimm, 17:20, Oct 2025, 6k). Alt: Code with Beto chapter-split at **239 s** ("Use platform
  file extensions, not runtime checks", Dec 2025) — short but exactly the topic's thesis.
- `rn-native-modules`: *How to create a native module with the Expo modules API* (Expo, 19:08,
  Sep 2024, 31k). Alt: Oskar Kwaśniewski, *Building React Native TurboModules with Swift*
  (17:47, Oct 2025) — covers the TurboModule half on a current version.
- `rn-animations-gestures`: *React Native Animations just got WAY EASIER (Reanimated v4)*
  (Simon Grimm, 11:01, Jan 2025, 37k). Alts: Software Mansion *Introducing React Native
  Reanimated 4* (5:53) and William Candillon *Swiping — React Native Gestures and Animations*
  (33:23, **Jun 2026**, the most current gesture material found).
- `rn-forms-keyboard`: *Keyboard Handling tutorial for React Native apps* (Expo, 32:51, Aug 2024,
  57k) — Expo's own, and the only long-form treatment of the per-platform avoidance problem.
- `rn-networking-offline`: *TanStack Query in Expo Apps* (Devlin Duldulao, App.js Conf 2025 via
  Software Mansion, 19:23, Jun 2025). Low views (~2k) but a conference talk aimed squarely at
  caching/offline in Expo apps; every offline-first alternative found was either sub-5-minute filler
  or vendor marketing (PowerSync, ElectricSQL).
- `rn-debugging-devtools`: *React Native Debugging: From JS to Native* (Simon Grimm, 14:24,
  Dec 2024, 37k). Predates the 0.83 Network/Performance panels, which the summary and quiz source
  from the docs instead.
- `rn-eas-build-submit`: *How to create a production build for Android | EAS Tutorial* (Expo, 19:25,
  Jan 2025, 40k). Alts: the matching iOS tutorial (9:55) and *EAS Workflows* (6:30).
- `rn-ota-updates`: *Sending Over-the-Air (OTA) Updates with EAS Update* (Code with Beto, 42:52,
  Nov 2024, 29k). Alt: Expo, *When to use over the air updates* (2:42, Aug 2025).
- `rn-performance-profiling`: *7 Tips to Make Your React Native App Blazing Fast!* (Simon Grimm,
  13:06, Nov 2025, 20k). Alts: React Conf *Profiling with React Performance tracks* (18:27,
  Jan 2026) and Amazon Developer *Performance Tracing and Observability in React Native and Native
  Code* (15:39, Apr 2026).

Two videos are reused at different `startSeconds` as alternates only (`zMM0d1d1_X4` at 239 s and
533 s); no primary video is used twice.

## References

Every URL checked with `check-urls.mjs`; all return 200 and the **final** URL is what ships.

Redirects / dead links found and handled:

- `https://reactnative.dev/docs/the-new-architecture/landing-page` → `/architecture/landing-page`
  (final URL used).
- `https://docs.expo.dev/router/basics/layout/` → `/router/basics/navigation-layouts/`.
- `https://docs.expo.dev/submit/introduction/` → `/deploy/submit-to-app-stores/` (final URL used).
- `https://docs.expo.dev/eas-update/faq/` redirects to `/eas-update/introduction/` — dropped in
  favour of `/eas-update/how-it-works/` and `/eas-update/deployment-patterns/`.
- `https://reactnative.dev/docs/view-flattening` → `/architecture/view-flattening` (final URL used).
- `https://shopify.engineering/instant-performance-with-flashlist` — **404**, replaced with
  `https://shopify.github.io/flash-list/docs/v2-changes/`.
- `https://shopify.github.io/flash-list/docs/migrating-from-flatlist` — **404**, not used.

Iframe-preview behaviour (from the checker's `embeddable` field):

- **Embeddable:** `reactnative.dev`, `docs.expo.dev`, `reactnavigation.org`,
  `docs.swmansion.com` (Reanimated + Gesture Handler), `shopify.github.io/flash-list`,
  `yogalayout.dev` — all send no framing restrictions, so in-app previews work.
- **Blocked:** `tanstack.com` (`X-Frame-Options: DENY`) and `github.com`
  (`CSP frame-ancestors 'none'`) — these three refs in `rn-networking-offline` will always hit the
  link-card fallback.

## Facts verified (things quiz answers depend on)

- **Flexbox defaults**, quoted from `reactnative.dev/docs/flexbox`: `flexDirection` defaults to
  `column` (not `row`), `alignContent` to `flex-start` (not `stretch`), **`flexShrink` to `0`**
  (not `1`), and `flex` takes a single number. From `/docs/layout-props`: a positive
  `flex: n` ≡ `flexGrow: n, flexShrink: 1, flexBasis: 0`; `flex: 0` sizes by `width`/`height`;
  `flex: -1` shrinks to `minWidth`/`minHeight`; **everything is `position: relative` by default**.
- **`StyleSheet.create`** is documented as *"an identity function"* — it no longer returns opaque
  numeric ids. Benefits listed: static type checking, moving styles out of render, reuse.
- **FlatList defaults** from `/docs/optimizing-flatlist-configuration`: `removeClippedSubviews`
  `true` on Android / `false` elsewhere, `maxToRenderPerBatch` 10, `updateCellsBatchingPeriod` 50,
  `initialNumToRender` 10, `windowSize` 21 (10 viewports above + 10 below + 1).
- **FlashList v2**: `estimatedItemSize`, `estimatedListSize` and `estimatedFirstItemOffset` are
  *"no longer used"*; `onBlankArea`, `disableHorizontalListHeightMeasurement`, `disableAutoLayout`
  and the `MasonryFlashList` component are gone (replaced by a `masonry` prop); new
  `useLayoutState` / `useRecyclingState` / `useMappingHelper` hooks and `LayoutCommitObserver`.
- **`Platform.select`** priority from `/docs/platform-specific-code`: exact platform key → `native`
  (native platforms only, not web) → `default`. `Platform.Version` is a **string** on iOS
  (`"10.3"`, needs `parseInt`) and a **number** on Android that is the **API level** (25 = Nougat),
  not the marketing version. File extensions: `.ios.js` / `.android.js` resolved by Metro,
  `.native.js` distinguishes native from a web bundler's `.js`.
- **Expo Router notation** from `/router/basics/notation/`: `index`, `_layout`, `[param]`,
  `(group)`, `+not-found`, `+html`, `+native-intent`, `+middleware`. The intro page describes it as
  *"Built on top of React Native Screens"*, and `/develop/app-navigation/` frames Expo Router and
  React Navigation as **a choice between two options**, not as layers. `/router/migrate/sdk-55-to-56/`
  states that from SDK 56, `@react-navigation/*` imports are no longer supported in application code:
  `@react-navigation/native` → `expo-router/react-navigation`, `/stack` → `expo-router/js-stack`,
  `/bottom-tabs` → `expo-router/js-tabs`, `/material-top-tabs` → `expo-router/js-top-tabs`; the
  runtime API is unchanged and Expo CLI rewrites third-party `@react-navigation/core` imports.
- **CNG** from `/workflow/continuous-native-generation/`: prebuild generates `ios/`+`android/` from
  the app config and config plugins; the docs explicitly say the **managed/bare workflow distinction
  is deprecated** and "all Expo projects now use Continuous Native Generation".
- **EAS profiles** from `/build/eas-json/`: `development` sets `developmentClient: true` +
  `distribution: "internal"` and is never store-submitted; `preview` is production-like without dev
  tooling, internally distributed; `production` goes to the stores/TestFlight; profiles compose with
  `extends`.
- **Runtime versions** from `/eas-update/runtime-versions/`: policies are `appVersion`,
  `sdkVersion`, `nativeVersion` and `fingerprint` (the most conservative). An update can change
  JavaScript and assets only; installing a native library, upgrading a native dependency or bumping
  the SDK requires a new build and a new runtime version, or the update fails to load / triggers
  error-recovery rollback.
- **React Native DevTools** from `/docs/react-native-devtools`: replaces Flipper and remote JS
  debugging; Chrome DevTools frontend over CDP against Hermes on device. Panels: Console, Sources &
  Breakpoints, **Network (since 0.83)**, **Performance (since 0.83)**, Memory, React Components,
  React Profiler. Limits: **no WebSocket support, no response mocking, no throttling**; 100 MB
  response-preview buffer with oldest-first eviction; Expo apps get a separate, narrower "Expo
  Network" panel; native-layer debugging belongs to Xcode / Android Studio.
- **Reanimated 4** from its own getting-started page: *"Reanimated 4.x works only with the React
  Native New Architecture (Fabric)"*; `react-native-worklets` is a **separate required package**;
  the Babel plugin is `react-native-worklets/plugin`.
- **`useNativeDriver`** is limited to properties that do not re-run layout (`transform`, `opacity`)
  — per `/docs/animations`.
- **Expo SDK 57** (changelog): React Native 0.86, React 19.2 (unchanged from SDK 56); `expo-image`
  gained `writeToCacheAsync` / `readFromCacheAsync`; Reanimated 4.5 / worklets 0.10 /
  gesture-handler 2.32 are the versions SDK 57 pins (newer standalone releases exist).

Deliberately **not** asserted, because it could not be confirmed from a primary source: the exact
keyboard shortcut for opening React Native DevTools (the docs page does not state it). The summary
says "from the terminal or the Dev Menu" instead, and no quiz answer depends on it.

## Code challenges (4 of 16)

Chosen where the logic is genuinely standalone JavaScript, not a proxy for native views or build
tooling:

- **`rn-lists-performance` → `createGetItemLayout(heights, separatorHeight)`** (driver
  `runGetItemLayout`). The real `getItemLayout` contract, including the separator-height mistake
  that is the actual bug people ship. Prefix sums, O(1) per call. 7 tests, 3 edge (empty list,
  out-of-range/negative index, 5,000 rows).
- **`rn-platform-specific-code` → `platformSelect(os, spec)`**. Exact `Platform.select` semantics,
  including that lookup is by **own property**, so `null`/`0` are selected rather than falling
  through. 8 tests, 3 edge.
- **`rn-networking-offline` → `coalesceOutbox(ops)`**. Collapsing a queued offline outbox per
  entity: merge updates into a create, cancel a create that was later deleted, discard updates
  behind a delete. This is the difference between replaying *history* and replaying *intent*.
  8 tests, 3 edge (empty queue, repeat/zombie deletes, 1,000 edits collapsing to one).
- **`rn-ota-updates` → `planRelease(changes, runtimeVersion)`**. Decides `update` vs `build` from a
  change set and computes the next runtime version (major bump for an SDK upgrade, minor otherwise),
  with an unrecognised change kind failing safe to `build`. 8 tests, 3 edge.

Deliberately left as quizzes: the New Architecture, Expo vs bare, styling/Flexbox, navigation,
images, native modules, animations/gestures, keyboard handling, DevTools, EAS Build and profiling —
all of them test judgement about native behaviour or tooling, where a JavaScript exercise would be
a costume rather than a test.

## Scope

Kept out (other agents own them): platform-neutral mobile concepts, Dart/Flutter, Kotlin/Compose,
Swift/SwiftUI, and cross-cutting CI / crash reporting / release process.

Merged to fit 13–16 topics while covering all 19 subjects the brief listed: Expo Router and
React Navigation into one **Navigation** topic (defensible — they are presented as one decision, and
the SDK 56 import change only makes sense told together); Reanimated and Gesture Handler into one
**Animations & Gestures** topic (they share the worklet/UI-thread model and are used together); and
core components + `StyleSheet` folded into **React Native vs React on the Web**, leaving styling and
Flexbox their own topic.

`fe-meta-mobile`'s `bonus-react-native` topic (Frontend track) covers the same ground in a single
overview topic; this camp deliberately goes deeper rather than repeating it, and does not re-teach
hooks, JSX or component composition, which `fe-react-*` already cover.
