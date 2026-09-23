# Mobile Foundations research notes (2026-09-23)

First camp of the v3 `mobile` track, and the first file in `src/content/mobile/`. Scope decision:
platform- and framework-neutral only. Everything here is the *model* a mobile engineer needs before
choosing a stack — release mechanics, the two platform contracts, lifecycle, navigation conventions,
touch and screen geometry, permissions, offline storage, flaky networking, push, store review,
performance budgets and accessibility. Implementation goes to `mobile-react-native`, `mobile-dart`,
`mobile-flutter`, `mobile-kotlin-compose` and `mobile-swift-swiftui`; CI/CD, crash reporting and
release management go to `mobile-cross-cutting`, so this camp deliberately stops at "halt the
rollout and flip a flag" rather than teaching a release pipeline.

**13 topics, 117 quiz questions, no code challenges.** The camp is platform-neutral concept material
with no JavaScript to grade, per the brief and the precedent set in `docs/research-notes/php-foundations.md`.
Every topic has at least two `isEdgeCaseOrInterviewQuestion` and at least one multi-select.

The brief listed 14 subjects for 10–13 topics, so one merge was needed: **touch/gesture/input** and
**device classes/safe areas/notches** became a single topic, `mob-touch-and-screen`. They are the
same concern (your UI runs on a hand-held slab of unknown shape behind a system gesture layer), and
keeping navigation separate preserved the conventions-vs-physics split.

Topic order: `mob-not-the-web` → `mob-platform-models` → `mob-app-lifecycle` →
`mob-native-vs-cross-platform` (milestone) → `mob-navigation-patterns` → `mob-touch-and-screen` →
`mob-permissions` → `mob-offline-storage` → `mob-networking` → `mob-push-notifications` →
`mob-store-review` (milestone) → `mob-performance-constraints` → `mob-accessibility`.

## Videos

All ids came from `scripts/research/yt.mjs search` and were confirmed with `info` — every one
returned `embeddable: true`. Because the camp covers both platforms, most topics carry a primary
video for one platform and an `alternateVideos` entry giving the other platform's view of the same
mechanism; that pairing is deliberate, not padding.

- `mob-not-the-web`: **`yr2Ccr7rUNM`** "iOS Dev Vs. Web Dev — My Thoughts After Building My First
  iOS App" (Your Average Tech Bro, 3:54). Short and not a roster channel, but it is the only video
  found that frames the topic exactly — a web developer's first encounter with the mobile model.
  Alternates carry the weight: **`z8j0nZDo8WQ`** "Mobile developer Roadmap" (Chai aur Code, 24:17,
  160k views — roster channel) and **`obwQC7WPkTs`** "We Need To Talk About Mobile Dev..."
  (CodeHead, 4:14, 69k). **Flagged below as the weakest primary in the camp.**
- `mob-platform-models`: **`UoywDs3YXOM`** "The Full Android 16 Migration Checklist — Your Todos For
  API Level 36" (Philipp Lackner, 8:26). Chosen because it *is* the Android contract in concrete
  form: the annual target-API treadmill, edge-to-edge enforcement, predictive back. Alternate
  **`OQMF4LDqscc`** "WWDC23: Get started with privacy manifests" (Apple Developer, 12:49) for the
  iOS side, where the contract is a declaration you sign rather than a behaviour change.
- `mob-app-lifecycle`: **`xGcZI4oDCtc`** "Learn Android Process Death in 6min" (Philipp Lackner,
  6:26) — process death is the precise thing web experience does not prepare you for. Alternate
  **`0aaan-dQN0g`** "WWDC25: Finish tasks in the background" (Apple Developer, 18:38).
- `mob-native-vs-cross-platform` (milestone): **`bdFVDId2rFs`** "I Built the Same App with 6
  Different Frameworks" (Tastemaker Design, 19:28, 121k views, Mar 2026). Recent, empirical and
  chaptered (SwiftUI 121s, Compose 369s, MAUI 532s, React Native 651s, Capacitor 842s, Flutter 944s,
  Tier List 1072s) — left unsplit because the comparison only works watched whole. Alternates
  **`OCwcedYTKDc`** (Mykola Harmash, 13:30) and **`N4h3K73TyZI`** "Is Kotlin Multiplatform Right for
  Your App?" (Philipp Lackner, 8:44).
- `mob-navigation-patterns`: **`Kd02qR_LyA0`** "WWDC22: Explore navigation design for iOS" (Apple
  Developer, 25:34) — official and exactly on topic. Alternate **`Elpqr5xpLxQ`** "Basics for System
  Back" (Android Developers, 14:10) for the half iOS does not have.
- `mob-touch-and-screen`: **`cjagE2Ivaro`** "Building adaptive apps for Android" (Android
  Developers, 12:05, Nov 2025). Alternate **`2ae-5TlKL8U`** "Fixing touch target size in PLR"
  (Android Developers, 4:45) for the touch half.
- `mob-permissions`: **`zCAx4WZ98rs`** "Permissions in Android" (Android Developers, 3:17, 93k) as
  the official concept primer; alternate **`D3JCtaK8LSU`** "The ULTIMATE Permission Handling Guide
  (Showing rationale + Permanently Declined)" (Philipp Lackner, 34:14, 64k), which is where the
  permanent-denial flow is actually demonstrated.
- `mob-offline-storage`: **`jaZ2gLMGUsM`** "Create offline-first apps" (Android Developers, 5:59,
  48k). Alternate **`kjOx-Le5gB8`** "Local-first vs Offline-first in 100 Seconds" (PowerSync, 2:23),
  used because the distinction it draws is the last quiz question.
- `mob-networking`: **`pBBKkppW9kw`** "WWDC23: Build robust and resumable file transfers" (Apple
  Developer, 20:39). Low view count (712) but it is official Apple material and the only video found
  that treats resumability and background transfer as the core problem rather than an aside.
  Alternate **`A2JetouoNSc`** "WorkManager - Android Basics 2023" (Philipp Lackner, 34:22, 89k).
- `mob-push-notifications`: **`4BFRAQuuEfc`** "How Push Notifications Work on iOS and Android"
  (Jimmy Cook, 7:08, 29k) — genuinely platform-neutral, which is rare for this topic. Alternate
  **`AKYebqOCAzY`** (Gerald Versluis, 8:41, 33k).
- `mob-store-review` (milestone): **`CGW3_eRM1G0`** "Why Apps Get Rejected from the App Store (2026)"
  (Noah Does Coding, 17:59, Jan 2026). Alternate **`wcexBIANCCk`** "How to Publish Your App to the
  Play Store (Step by Step, 2026)" (Code with Beto, 24:32, 43k, one month old) for the Play side.
- `mob-performance-constraints`: **`UiJXe5ipSYA`** "How Google made their Android app start faster"
  (Android Developers, 12:12, May 2026) — the most recent official startup material available.
  Alternate **`CQc-QDTmCoQ`** "App Performance Analysis with the Android Studio Profiler" (Philipp
  Lackner, 14:48, 75k).
- `mob-accessibility`: **`-4FD6zhHKKM`** "Prepare your app for Accessibility Nutrition Labels"
  (Apple Developer, 34:50, Apr 2026). Chaptered (Interaction methods 138s, Larger text 1084s, Color
  1587s) and left unsplit, since the topic covers all three. Alternates **`_1yRVwhEv5I`** "TalkBack
  - Accessibility on Android" (Android Developers, 4:11, 247k) and **`R2NftUX7rDM`** "Making Android
  accessibility easy" (Android Dev Summit '18, 31:52).

**No search-URL fallbacks.** No video is reused across two topics.

Considered and rejected: `ZikVtdopsfY` (Traversy Media, "Mobile Apps - Web vs. Native vs. Hybrid",
410k views) — the right topic for `mob-native-vs-cross-platform` but nine years old and predating
every current framework. `X8ipUgXH6jw` (Fireship, RN vs Flutter, 2.6M views) — 2021, and it omits
native and web entirely. `A889SLNAJkE` ("How Mobile Networks Really Work: RRC, Latency & Battery")
— thematically perfect for `mob-networking` but 38 views and an unverifiable channel.
`aNqhc9OAdMQ` / `HWxmv_feI4s` ("iOS/Android Lifecycle Explained 2026", Code Deck) — recent but a
channel with no track record.

## References

**Tooling note, important for whoever writes the rest of this track.** `scripts/research/check-urls.mjs`
cannot verify any Google devsite URL (`developer.android.com`, `source.android.com`,
`firebase.google.com`). Those hosts bounce a cookie-less client into a `prompt=none&auto_signin=True`
OAuth loop, so Node's `fetch` exhausts its redirect budget and the checker reports
`request failed: fetch failed` rather than a status. They are genuinely fine: every one was verified
200 with `curl -L -c cookiejar -b cookiejar`, which persists the cookie the redirect needs. Same
result in a browser. Everything not on a Google devsite host was checked with `check-urls.mjs`
directly.

**W3C blocks automated clients.** `https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html`
and `https://www.w3.org/WAI/standards-guidelines/mobile/` both return **403** to `check-urls.mjs`
*and* to curl, while loading fine in a browser. Rather than ship a reference that fails the project's
own verification step, the touch-target citation went to `lukew.com/ff/entry.asp?1085` ("Touch Target
Sizes") and the accessibility citation to Material 3's accessible-design overview.

Redirects taken (the **final** URL is what shipped):

| Requested | Final |
| --- | --- |
| `developer.android.com/guide/topics/large-screens/support-different-screen-sizes` | `…/develop/ui/compose/layouts/adaptive/support-different-display-sizes` |
| `developer.android.com/topic/libraries/architecture/workmanager` | `…/develop/background-work/background-tasks/persistent` |
| `developer.android.com/develop/ui/views/notifications/notification-permission` | `…/develop/ui/compose/notifications/notification-permission` |
| `developer.android.com/topic/performance/vitals/launch-time` | `…/topic/performance/issues/launch-time` |
| `developer.android.com/topic/security/data` | `…/privacy-and-security/security-tips` |
| `play.google.com/about/developer-content-policy/` | `play.google/developer-content-policy/` |
| `aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/` | `builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/…` |
| `developer.apple.com/app-store/review/` | `developer.apple.com/distribute/app-review/` (meta-refresh, not an HTTP redirect — `check-urls.mjs` reports 200 on a 406-byte stub, so it looks valid and is not) |

Dead ends replaced: `firebase.google.com/docs/cloud-messaging/concept-options` → **404**, replaced by
`…/understand-delivery`. `developer.apple.com/documentation/accessibility/accessibility-nutrition-labels`
→ **404**; the real page is the App Store Connect help topic
`…/help/app-store-connect/manage-app-accessibility/overview-of-accessibility-nutrition-labels`.
`developer.android.com/distribute/best-practices/launch/launch-checklist` → **404**.
`developer.android.com/topic/performance/power` redirects to `/develop/connectivity`, which is the
wrong page; `…/topic/performance/power/power-details` is the one that covers power management limits.

Iframe previews (from `check-urls.mjs` and, for the devsite hosts, `curl -D -`):

- **Embeddable:** `developer.apple.com/design/…` (HIG) and `developer.apple.com/documentation/…`,
  `reactnative.dev`, `docs.flutter.dev`, `m3.material.io`, `lukew.com`, `inkandswitch.com`,
  `play.google`.
- **Blocked:** every Google devsite host (`developer.android.com`, `source.android.com`,
  `firebase.google.com`) via `CSP frame-ancestors 'self' https://developers.google.com/_d/analytics-iframe`;
  `support.google.com` and all `developer.apple.com/app-store/…`, `/distribute/…` and `/help/…` pages
  via `X-Frame-Options: SAMEORIGIN`; `kotlinlang.org` (`XFO SAMEORIGIN`); `web.dev`
  (`CSP frame-ancestors 'self'`); `builder.aws.com` (`XFO DENY` plus `frame-ancestors 'none'`).

So the majority of this camp's reference cards will fall back to link previews. The one pleasant
surprise is that Apple's HIG and `/documentation` pages embed cleanly, which covers most of the iOS
citations.

## Facts verified

Everything below was read off the primary source on 2026-09-23, not recalled. Quiz answers were
written from these, and version-dependent claims are phrased as mechanisms wherever possible.

**Release mechanics**

- **Apple phased release** ramps automatic updates over **7 days** (day 1: 1%, day 2: 2%, day 3: 5%,
  … day 7: 100%), can be paused for **30 days in total** across any number of pauses, and "apps and
  app updates in phased release can be manually downloaded from the App Store by anyone at any
  time". There is no automatic crash-triggered rollback. Source: App Store Connect Help, *Release a
  version update in phases*.
- **Google Play in-app updates**: *flexible* downloads in the background with the app still usable;
  *immediate* is a full-screen blocking flow that restarts the app. Both prompt the user.

**Platform contracts**

- **Google Play target API level requirement** (as of this writing): "New apps and app updates must
  target Android 16 (API level 36) or higher to be submitted to Google Play", Wear OS must target
  API 35+, Android TV and XR API 34+; **existing apps must target API 35+ to remain available**, and
  apps below the floor are not available to users whose OS version is above their target. A
  form-based extension to **1 November 2026** exists. This is a yearly moving floor — the mechanism,
  not the numbers, is what the quiz tests.
- **Android app sandbox** is enforced by per-app Linux UIDs (AOSP, *Application Sandbox*), i.e. a
  kernel property, independent of where the app was installed from.
- **Edge-to-edge is enforced** on Android 15 (API 35) and higher **once the app targets SDK 35**;
  apps draw behind system bars and into display cutouts by default and must consume
  `WindowInsets` (types include system bars, display cutout and IME). Source: *Display content
  edge-to-edge*.
- **Apple privacy manifests** declare collected data types, tracking domains and required-reason API
  usage, including for bundled third-party SDKs.
- App Store Review Guidelines intro: "every app is reviewed by experts"; in some markets developers
  may also distribute **notarized** apps via alternative marketplaces and Web Distribution.

**Lifecycle**

- Apple, *Managing your app's life cycle*: "UIKit can disconnect a background or suspended scene at
  any time to reclaim its resources." Scenes each have their own lifecycle and can be in different
  states.
- Apple, `applicationWillTerminate(_:)`: "For apps that support background execution, this method is
  generally not called when the user quits the app because the app simply moves to the background…
  this method may be called in situations where the app is running in the background (not suspended)
  and the system needs to terminate it." Implementation gets **about five seconds**. So a *suspended*
  app killed for memory gets **no callback at all** — the basis of `mob-app-lifecycle-q1`.
- Android, *Save UI states*: ViewModel **survives configuration change** but **not** system-initiated
  process death; saved state survives both but is "only for primitive types and simple, small
  objects", is slow (serialisation), and is marshalled across a process boundary.

**Navigation**

- Android, *Principles of navigation*: "Within your app's task, the Up and Back buttons behave
  identically"; "the Up button never exits your app" and is not shown at the start destination, while
  Back is shown and does exit; "when deep linking to a destination within your app's task, any
  existing back stack for your app's task is removed and replaced with the deep-linked back stack"
  (a **synthetic** back stack).

**Touch and screen**

- Apple HIG *Accessibility* control-size table: **iOS/iPadOS default 44×44 pt, minimum 28×28 pt**
  (macOS 28/20, tvOS 66/56, visionOS 60/28, watchOS 44/28). Note this is more nuanced than the
  folklore "44 pt minimum" and the content states it that way.
- Apple HIG *Accessibility* on Dynamic Type: "give people the option to enlarge text by at least
  200 percent (or 140 percent in watchOS apps)".

**Permissions**

- Android, *Request runtime permissions*: "if the user taps Deny for a specific permission more than
  once during your app's lifetime of installation on a device, the user will no longer see the system
  permissions dialog… considered a permanent denial", flagged `USER_FIXED` (visible via
  `adb shell dumpsys package`). Also: a permission "might be denied automatically, without the user
  taking any action", so check status before every use.
- Android, *Permissions on Android*: three categories — **install-time** (normal/signature),
  **runtime** (protection level `dangerous`), **special** (protection level `appop`, defined only by
  the platform and OEMs, granted on a settings screen).
- Apple, *Requesting authorization to use location services*: "This authorization process involves a
  one-time interruption… After the initial interruption, the system stores your app's authorization
  status and doesn't prompt again."
- Apple HIG *Privacy* on pre-prompt screens: "Include only one button and make it clear that it opens
  the system alert", and do not title the custom button "Allow" — use "Continue" or "Next". Purpose
  strings must be active, specific sentences.
- Apple, *Requesting authorization to capture and save media*: the `Info.plist` key must be present
  "before it requests authorization or attempts to use a capture device. **Otherwise, the system
  terminates your app.**"
- Android, *Notification runtime permission*: on Android 13+ a fresh install has notifications
  **off** until `POST_NOTIFICATIONS` is granted; a denial blocks all notification channels (media
  sessions and self-managed calls are exempt); devices **upgrading** to 13+ pre-grant the permission
  to eligible existing apps, which is why clean-install testing matters.

**Networking and push**

- Android, *Optimize for Doze and App Standby*: Doze "suspends network access", ignores wake locks
  and defers jobs, syncs and standard alarms (including `setExact()`/`setWindow()`) to a recurring
  **maintenance window**, and "over time, the system schedules maintenance windows less frequently".
  Applies to all apps on Android 6.0+ regardless of target API level.
- APNs payload limits (Apple, *Generating a remote notification*): **4 KB (4096 bytes)** for ordinary
  remote notifications, **5 KB (5120 bytes)** for VoIP; APNs *refuses* anything larger.
- FCM `collapse_key`: "When a device is not connected, only the last message with a given collapse
  key is delivered." FCM delivery diagnostics expose `droppedTtlExpired`,
  `droppedDeviceInactive`, `droppedTooManyPendingMessages` and `delayedMessageThrottled`, and
  registrations go **stale** for inactive devices — the basis for the token-hygiene question.

**Store review**

- 2.1 App Completeness: final builds, working URLs, "include demo account info (and turn on your
  back-end service!)", or an approved built-in demo mode.
- 2.3.1: no hidden, dormant or undocumented features; new features must be described **specifically**
  in Notes for Review ("generic descriptions will be rejected").
- 2.5.1: public APIs only. **2.5.2**: "Apps should be self-contained in their bundles… nor may they
  download, install, or execute code which introduces or changes features or functionality of the
  app" — the exact wording behind the OTA-update question. (The JavaScriptCore carve-out lives in the
  Developer Program License Agreement, not the guidelines, so the content does not assert it.)
- 3.1.1: unlocking features/content in the app **must** use in-app purchase. **3.1.3(e)**: physical
  goods or services consumed outside the app **must** use a method *other than* in-app purchase. The
  rule runs in both directions, which is why it is an edge-case question.
- 4.2 Minimum Functionality: an app must "elevate it beyond a repackaged website".
- 5.1.1: a privacy policy link is required in both App Store Connect metadata and inside the app.
- Appeals exist, and **Bug Fix Submissions**: "for apps that are already on the App Store or
  alternative distribution, bug fixes will not be delayed over guideline violations except for those
  related to legal or safety issues."
- Developers are responsible for bundled third-party SDKs, ad networks and analytics.

**Performance**

- Android, *App startup time*: three states — **cold** (system creates the process), **warm**
  (process may still run but the activity is recreated, benefiting from the saved instance state
  bundle), **hot** (UI still resident). Two metrics: **TTID** (first frame) and **TTFD** (actually
  usable). "We recommend that you always optimize based on an assumption of a cold start."

**Accessibility**

- Apple's **Accessibility Nutrition Labels** have published per-feature evaluation criteria for
  VoiceOver, Voice Control, Larger Text, Dark Interface, Differentiate Without Color Alone,
  Sufficient Contrast, Reduced Motion, Captions and Audio Descriptions — declared in App Store
  Connect and shown on the product page.

## Deliberately not asserted

- **Review turnaround times, store fees and OS-adoption percentages.** All three go stale within
  weeks and Apple's `/distribute/app-review/` page is client-rendered, so no number was extractable
  from the primary source anyway. The content describes review as a human gate with an appeal path
  and a bug-fix carve-out, and tells learners to plan by decoupling approval from release.
- **FCM payload byte limits.** The page that used to state them 404s; the shipped questions use
  collapse keys, TTL and stale tokens instead, all of which were verified.
- **The React Native OTA / JavaScriptCore carve-out.** Real, but it lives in the PLA rather than in
  a page that could be verified here, so the quiz stops at guideline 2.5.2's literal text.
- **Google Play app-bundle download size ceilings.** Not verified from the primary source; the app
  size question is about *why* bundles shrink downloads (per-device artefact generation), not about a
  number.

## Flagged for a human

- **`mob-not-the-web` primary video.** `yr2Ccr7rUNM` is 3:54, three years old, and from a channel
  outside the roster. It is on-topic in a way nothing else found was, and two stronger alternates sit
  beside it, but if someone finds a good 2026 "web engineer's first mobile app" talk it should
  replace this.
- **`mob-networking` primary video.** `pBBKkppW9kw` is official Apple content with only 712 views,
  and it is narrower (file transfers) than the topic. The Android alternate covers scheduling; a
  future dedicated video on mobile network resilience would be a straight upgrade.
- **Google devsite verification.** Until `check-urls.mjs` carries a cookie jar, every
  `developer.android.com` reference in this track will report `fetch failed`. Worth a one-line fix in
  the script.
