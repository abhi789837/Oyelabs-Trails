# Mobile Cross-Cutting Concerns research notes (2026-09-23)

14 topics, `mob-x-` prefix. Deliberately framework-agnostic: nothing here depends on
Compose, SwiftUI, Flutter or React Native, and the RN 0.87 / Flutter 3.47 / Kotlin 2.4 /
Swift 6.4 versions are not asserted anywhere (no topic needed them).

## Scope decisions

- The brief listed 14 concerns. Certificate pinning was grouped with the networking layer, as
  the brief groups it, so the count lands at 14 rather than 15.
- `mobile-foundations` already covers offline storage ("why offline matters, what storage
  exists", including a first pass at conflict *policies*), flaky-network retries/jitter, and
  app size / cold start / battery. This camp deliberately goes one level down instead of
  repeating:
  - `mob-x-local-persistence` is **choosing between** key-value / SQLite / object store /
    file system, plus cache-vs-documents and migration, not "offline matters".
  - `mob-x-offline-sync` is **detecting and resolving** divergence — vector clocks, tombstones,
    outbox and idempotency keys — not "there are conflict policies".
  - `mob-x-networking-layer` is the **layer**: single-flight token refresh, what may be
    retried, operation deadlines vs socket timeouts, and pinning/pin rotation.
  - `mob-x-app-size-startup` is the **toolchain and the CI gate**: app bundles/thinning, R8
    keep rules, baseline profiles, TTID vs TTFD, macrobenchmarks in CI — not the "three
    budgets" framing foundations already gives.
- Three `code` topics (the camp's allowance), each chosen because the logic stands alone and
  a quiz could not test it: `mob-x-offline-sync` (vector-clock merge), `mob-x-release-management`
  (sticky/monotone/per-flag rollout bucketing) and `mob-x-deep-links` (specificity-ranked route
  matcher). A fourth candidate — backoff-with-jitter — was dropped because foundations already
  quizzes jitter and three is the cap; `mob-x-networking-layer` covers it as a quiz instead.
- Milestones: `mob-x-offline-sync` (expert) and `mob-x-cicd` (expert), as the brief named.

## Videos

Every id came from `yt.mjs search` and was confirmed with `yt.mjs info`; all are
`embeddable: true`. No fallbacks — every topic has a real video.

- `mob-x-architecture`: The Ultimate Beginner's Roadmap to Android App Architecture
  (Philipp Lackner, 14:57). Alternates: the two MAD Skills layer episodes (`r5AseKQh2ZE`
  data layer, `gIhjCh3U88I` domain layer) from Android Developers, which are the canonical
  statement of the layering.
- `mob-x-dependency-injection`: Dependency Injection, The Best Pattern (CodeAesthetic, 13:15).
  Chosen *because* it is language- and platform-neutral, which fits a framework-agnostic camp;
  Hilt MAD Skills is the Android-specific alternate.
- `mob-x-local-persistence`: Everything about storage on Android (Android Developers, 12:17) —
  the only video found that compares the storage options rather than teaching one of them.
  Alternate: Introduction to DataStore.
- `mob-x-offline-sync`: Angelique Nehmzow (Notion) — Conflict Resolution x Notion Blocks
  (Local-First Conf, 19:03). Low view count (~440) but it is a production conflict-resolution
  talk from a team that actually ships this, which beat every generic CRDT explainer.
  Alternates: Kleppmann's InfoQ CRDT talk (43:39, 2018 — still the best conceptual treatment)
  and Ditto's "CRDTS Solved Conflicts, Not Sync".
- `mob-x-networking-layer`: Certificate Pinning (Philipp Lackner, 21:23, published 2026-09-13,
  i.e. ten days before writing). Alternate: Guardsquare's SSL Pinning Explained (vendor, but
  the clearest short explanation of the threat model).
- `mob-x-secure-storage`: FULL Guide to Encryption & Decryption in Android (Philipp Lackner,
  27:53) for the mechanics; alternate "Demystifying attestation" (Android Developers, 14:06)
  for the rooted-device / attestation angle.
- `mob-x-auth`: DroidKaigi 2025 — "OAuth Done Right" (35:50, English, conference talk). Title
  is truncated on YouTube itself; recorded verbatim from `info`. Alternates: ByteMonk on PKCE
  and Philipp Lackner on BiometricPrompt.
- `mob-x-testing`: Android Testing Strategies (Android Developers, 8:24, 2025). Alternate:
  Lackner's 70-minute testing guide.
- `mob-x-cicd`: Provisioning Profiles and Certificates (iCode, 15:06) — signing is the part of
  mobile CI that has no web analogue, so the video covers that rather than YAML. Alternate:
  GitHub Actions + fastlane end-to-end.
- `mob-x-release-management`: Ship faster with feature flags using Firebase Remote Config
  (Firebase, 14:57). Alternate: the longer Remote Config + Analytics session.
- `mob-x-crash-observability`: Observability for Mobile with OpenTelemetry
  (OpenObservability Talks, 1:03:01) **chapter-split to 102 s**, chapter "the unique
  characteristics of mobile env" — the part that explains why mobile telemetry is structurally
  different. Alternates: Android vitals (5:05) and Sentry in Six Minutes.
- `mob-x-analytics-privacy`: WWDC22 Create your Privacy Nutrition Label (Apple Developer,
  12:14). Alternates: Play PolicyBytes data-safety walkthrough (Android Developers) and an
  AppsFlyer ATT explainer. Deliberately avoided `OQMF4LDqscc` (WWDC23 privacy manifests) — it
  is already used by `mobile-foundations`.
- `mob-x-app-size-startup`: Making apps blazing fast with Baseline Profiles
  (Android Developers, 19:55). Alternate: Lackner on measuring performance.
- `mob-x-deep-links`: iOS Universal Links and Android App Links with Expo Router (Expo, 11:49)
  — Expo-framed but it is the clearest walkthrough found that sets up **both** verification
  files. Alternate: a platform-neutral comparison of the three link types.

## References

All URLs checked with `check-urls.mjs`; final (post-redirect) URLs are what ships.

Replaced / corrected during research:

- `square.github.io/okhttp/features/https/` and `.../features/interceptors/` — both **404**.
  Dropped; the OWASP pinning page and the Google SRE cascading-failures chapter cover the same
  ground.
- `developer.apple.com/documentation/security/storing-keys-in-the-secure-enclave` — 404. The
  live page is `.../protecting-keys-with-the-secure-enclave`.
- `developer.apple.com/documentation/xcode/signing-and-capabilities` — 404. Used the
  Account Help page for provisioning profiles instead.
- `developer.apple.com/support/code-signing/` — returns 200 but redirects to a
  "Security Verification" interstitial. Not usable; avoided.
- `opentelemetry.io/docs/languages/android/` — 404; `.../docs/platforms/android/` redirects to
  `.../docs/platforms/client-apps/`, which is what ships.
- `firebase.google.com/docs/crashlytics/get-deobfuscated-reports` redirects to the **Apple**
  variant regardless of the `platform` query parameter; shipped the explicit Android path
  `.../crashlytics/android/get-deobfuscated-reports`.
- `owasp.org/www-community/controls/Certificate_and_Public_Key_Pinning` redirects to
  `community.owasp.org/controls/...` — final URL shipped.
- `developer.android.com/topic/performance/vitals/anr` → `/topic/performance/issues/anr`;
  `/training/app-links/verify-android-applinks` → `/training/app-links/verify-applinks`;
  `/identity/sign-in/credential-manager` → `/identity/credential-manager`. Final URLs shipped.
- `mas.owasp.org/MASVS/06-MASVS-NETWORK/` is a 404 (the storage one, `05-MASVS-STORAGE`, is
  fine). Used the MASTG network chapter only as a lead, not as a shipped ref.
- `developer.android.com/topic/architecture/domain-layer` returned a **transient 500** on the
  first check (it had been served a `?hl=pl` locale); a re-check returned 200. Worth knowing:
  developer.android.com's locale redirects make single checks flaky.

Iframe previews: essentially nothing Google or Apple publishes is frameable.
`developer.android.com`, `firebase.google.com` and `support.google.com` all send restrictive
`frame-ancestors`/`X-Frame-Options`; `developer.apple.com/help/...` and `/app-store/...` send
`SAMEORIGIN`. martinfowler.com sends `X-Frame-Options: DENY`; the IETF datatracker restricts
frame-ancestors to ietf.org. The ones that **do** frame cleanly: `developer.apple.com/documentation/*`,
`mas.owasp.org`, `community.owasp.org`, `sre.google`, `crdt.tech`, `sqlite.org`,
`docs.fastlane.tools`, `dagger.dev`.

## Facts verified

Checked against the vendor's own page on 2026-09-23, not from memory.

- **Android App Links**: `https://<host>/.well-known/assetlinks.json`, fetched for every host
  in an intent filter with `android:autoVerify="true"`. On **Android 11 and lower** the app
  becomes default handler only if a matching file is found for **all** hosts in the manifest;
  Android 12+ verifies per domain and adds manual verification
  (`adb shell pm verify-app-links`, `pm get-app-links`, states `verified` / `none` /
  `legacy_failure` / `approved` / `denied` / …). Only one app at a time can be associated with
  a given domain on a device.
  (developer.android.com/training/app-links/verify-applinks)
- **Universal Links**: file named `apple-app-site-association`, **no extension**, at
  `https://<fqdn>/.well-known/`, served over HTTPS with a valid certificate and **no
  redirects**. Each subdomain needs its own entitlement entry and its own file.
  (developer.apple.com/documentation/xcode/supporting-associated-domains)
- **Apple phased release**: 7 days at 1 / 2 / 5 / 10 / 20 / 50 / 100 %, only for users with
  **automatic updates** on; anyone may download manually at any time; pausable for a total of
  30 days; removing the app from sale ends phased release for that version permanently.
  (developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases/)
- **Play staged rollout**: updates only, never a first publish; percentage does **not**
  increase automatically; halting stops new users receiving it but **users who already have it
  keep it**; countries cannot be removed once a rollout has started; halt/resume affects the
  same user set. (support.google.com/googleplay/android-developer/answer/6346149)
- **Android Keystore**: key material never enters the app process — operations run in a system
  process; may be bound to the TEE or a Secure Element. If the app process is compromised an
  attacker "might be able to use the app's keys but can't extract their key material"; if the
  OS is compromised, the same holds device-wide. StrongBox KeyMint requires its own CPU, secure
  storage, TRNG and secure timer, and supports a restricted algorithm set (RSA 2048,
  AES 128/256, ECDSA/ECDH P-256, HMAC-SHA256, 3DES). Key use authorisations are fixed at
  generation/import and cannot be changed. (developer.android.com/privacy-and-security/keystore)
- **Key attestation**: validate the certificate chain **on a separate trusted server**, not on
  the device — Android's docs caution explicitly against self-validation. Root must be signed
  with the Google attestation root key; `attestationSecurityLevel` is `TrustedEnvironment` or
  `StrongBox`. (developer.android.com/privacy-and-security/security-key-attestation)
- **Secure Enclave**: your code never handles the plaintext private key; **NIST P-256 only**,
  usable for signing/verification and ECDH; preexisting keys **cannot be imported** ("not
  having a mechanism to transfer plain-text key data into or out of the Secure Enclave is
  fundamental to its security"). Ordinary Keychain use, by contrast, briefly copies a
  plain-text key into memory.
  (developer.apple.com/documentation/security/protecting-keys-with-the-secure-enclave)
- **ATT**: tracking = linking user/device data from your app with data from *other companies'*
  apps, websites or offline properties for targeted advertising or ad measurement, or sharing
  with a data broker. Explicitly **not** tracking: on-device-only linkage with nothing
  identifying sent off the device; a data broker using the data solely for fraud/security; a
  consumer reporting agency for creditworthiness. Needs `NSUserTrackingUsageDescription`; the
  IDFA is **all zeros** until permission is granted. IDFV needs no ATT for same-vendor
  analytics but may not be combined with other companies' data. EU-specific alternative prompt
  is arriving per Apple's page — deliberately not quizzed, since it is version-dated.
  (developer.apple.com/app-store/user-privacy-and-data-use/ and
  developer.apple.com/documentation/apptrackingtransparency)

Deliberately **not** quizzed on numbers that go stale: Android vitals bad-behaviour
thresholds, target-API-level deadlines, store fee percentages, and any iOS/Android version
number beyond the App Links 11-vs-12 split (which is a documented behavioural change, not a
moving target).

## Code challenges

- `mob-x-offline-sync` — `mergeRecord(local, remote)`: element-wise vector-clock comparison
  producing `identical` / `local` / `remote` / `merged`, element-wise max clock, per-field
  merge on `ts` with a lexicographic `replica` tiebreak, tombstone-wins on concurrent delete.
  9 tests, 4 `isEdgeCase` (ts tie, concurrent tombstone, missing clock entry treated as 0,
  two empty records).
- `mob-x-release-management` — `bucketOf` + `isEnabled`, driven by `runRollout`. A seeded FNV-1a
  is supplied in the driver so every expected count is exact and deterministic. Tests prove the
  three properties that matter: sticky (30 % asked three times), monotone (10→25→50→100 over
  200 users: counts 21/47/99/200 with nested samples) and per-flag independence (same users and
  percentage under two flag keys produce different samples). 8 tests, 2 `isEdgeCase`.
  Hashing only the user id, or re-randomising per call, fails at least one test.
- `mob-x-deep-links` — `matchDeepLink(patterns, url)`: literal / `:param` / trailing `*`
  segments, specificity ranked left-to-right (literal > param > wildcard, then more segments,
  then declaration order), percent-decoding, query parsing, fragment stripped, `null` on no
  match. 12 tests, 5 `isEdgeCase`. `parseUrl`/`splitPattern` are given in the driver so the
  exercise is about routing, not string surgery.

All three reference solutions pass under `content:check`, and each untouched starter fails at
least one test.
