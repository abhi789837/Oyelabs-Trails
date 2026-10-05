# v5 baseline: the current UI, before the rebuild

Captured 2026-10-05 18:46 UTC from the v4.4 build (commit `bb2da0a`) by `scripts/e2e/v5-baseline.ts`.
Seeded state: superadmin; one learner onboarded with the reference line (Engineering), test taken (MCQs right on frontend basics, wrong on backend and soft skills; spoken answers typed; one good email), path built, the next topic partly watched, one review requested and approved. Mock AI (NODE_ENV=development), Chromium, 1440×900 unless noted.

## Click counts

Every mouse click goes through one counter; typing and waiting are not counted.

### Admin: onboard one learner and send the test (from the admin home; typing not counted): **3 clicks**

Start `/admin` → end `/admin/onboard`

1. Sidebar "Onboard learner"
2. "Suggest"
3. "Looks good — send the test"

### Learner: open the app ("/") to inside the next step: **1 click**

Start `/` → end `/track/frontend/module/fe-js-core/topic/js-execution-context`

1. "How JavaScript Works & Execution Context" on the home page

### Admin: give full marks on a review request (from the admin home): **2 clicks**

Start `/admin` → end `/admin/reviews`

1. Sidebar "Review requests"
2. "Give full marks"

From the onboarding page itself (after typing) it is 2 clicks.

## Accessibility (axe-core, WCAG 2.0/2.1/2.2 A+AA + best practices, 1440 light)

Counts are affected elements (nodes), grouped by the rule's impact. Third-party iframes (the YouTube player) are removed before the scan: axe cannot inject into them and they are not this app's markup.

| Route | Total | Critical | Serious | Moderate | Minor | Rules |
|---|---:|---:|---:|---:|---:|---|
| `learner /` | 0 | 0 | 0 | 0 | 0 | — |
| `learner /plan` | 0 | 0 | 0 | 0 | 0 | — |
| `learner /library` | 0 | 0 | 0 | 0 | 0 | — |
| `learner /track/frontend/module/fe-js-core/topic/js-execution-context (topic)` | 1 | 0 | 0 | 1 | 0 | heading-order (moderate, 1) |
| `learner /track/frontend/module/fe-tooling/topic/tooling-git-fundamentals (code topic)` | 3 | 0 | 2 | 1 | 0 | color-contrast (serious, 2), heading-order (moderate, 1) |
| `learner /track/soft/module/soft-spoken-english/topic/soft-english-clear-at-work (quiz topic)` | 1 | 0 | 0 | 1 | 0 | heading-order (moderate, 1) |
| `learner /track/frontend/module/fe-js-core` | 0 | 0 | 0 | 0 | 0 | — |
| `learner /report/frontend` | 1 | 0 | 0 | 1 | 0 | heading-order (moderate, 1) |
| `learner /assessment (results)` | 4 | 0 | 0 | 4 | 0 | landmark-one-main (moderate, 1), region (moderate, 3) |
| `admin /admin` | 4 | 0 | 4 | 0 | 0 | color-contrast (serious, 4) |
| `admin /admin/people` | 2 | 0 | 2 | 0 | 0 | target-size (serious, 2) |
| `admin /admin/people/:id` | 0 | 0 | 0 | 0 | 0 | — |
| `admin /admin/people/:id?tab=assessment` | 0 | 0 | 0 | 0 | 0 | — |
| `admin /admin/people/:id?tab=path` | 0 | 0 | 0 | 0 | 0 | — |
| `admin /admin/people/:id?tab=progress` | 2 | 0 | 2 | 0 | 0 | target-size (serious, 2) |
| `admin /admin/onboard` | 0 | 0 | 0 | 0 | 0 | — |
| `admin /admin/reviews` | 0 | 0 | 0 | 0 | 0 | — |
| `admin /admin/generated` | 1 | 0 | 0 | 1 | 0 | heading-order (moderate, 1) |
| `admin /admin/ai` | 2 | 0 | 2 | 0 | 0 | target-size (serious, 2) |
| `admin /admin/skill-graph` | 0 | 0 | 0 | 0 | 0 | — |
| **All** | **21** | **0** | **12** | | | |

## Performance (cold load, cache disabled, local server)

JS transferred = encoded bytes of every script response as served (incl. headers). LCP from a PerformanceObserver on a cold load; local loopback, so it shows render cost, not network.

The local server sends the app's JS uncompressed (`identity`), so the gzip column is `gzip -9` of the same files from `dist/` — what a compressing proxy would send.

| Page | Route | Scripts | JS transferred | JS decoded | JS gzipped (est.) | Encoding | LCP |
|---|---|---:|---:|---:|---:|---|---:|
| learner home | `/` | 6 | 2531 KB | 2524 KB | 696 KB | identity | 408 ms |
| My plan | `/plan` | 6 | 2531 KB | 2524 KB | 696 KB | identity | 444 ms |
| topic page | `/track/frontend/module/fe-js-core/topic/js-execution-context` | 8 | 2543 KB | 2551 KB | 696 KB | identity, br | 480 ms |

## Screenshots (132 files, 12.1 MB)

In `docs/v5/shots/before/`, named `<screen>-<width>-<theme>.jpg` (JPEG, full page unless the screen is one section; large ones downscaled).

- **admin-onboarding-card**: `admin-onboarding-card-390-light.jpg`, `admin-onboarding-card-390-dark.jpg`, `admin-onboarding-card-1440-light.jpg`, `admin-onboarding-card-1440-dark.jpg`
- **admin-onboarded**: `admin-onboarded-390-light.jpg`, `admin-onboarded-390-dark.jpg`, `admin-onboarded-1440-light.jpg`, `admin-onboarded-1440-dark.jpg`
- **learner-assessment-preflight**: `learner-assessment-preflight-390-light.jpg`, `learner-assessment-preflight-390-dark.jpg`, `learner-assessment-preflight-1440-light.jpg`, `learner-assessment-preflight-1440-dark.jpg`
- **learner-assessment-sheet**: `learner-assessment-sheet-390-light.jpg`, `learner-assessment-sheet-390-dark.jpg`, `learner-assessment-sheet-1440-light.jpg`, `learner-assessment-sheet-1440-dark.jpg`
- **learner-assessment-coding**: `learner-assessment-coding-390-light.jpg`, `learner-assessment-coding-390-dark.jpg`, `learner-assessment-coding-1440-light.jpg`, `learner-assessment-coding-1440-dark.jpg`
- **learner-home**: `learner-home-390-light.jpg`, `learner-home-390-dark.jpg`, `learner-home-1440-light.jpg`, `learner-home-1440-dark.jpg`
- **learner-plan**: `learner-plan-390-light.jpg`, `learner-plan-390-dark.jpg`, `learner-plan-1440-light.jpg`, `learner-plan-1440-dark.jpg`
- **learner-plan-overview**: `learner-plan-overview-390-light.jpg`, `learner-plan-overview-390-dark.jpg`, `learner-plan-overview-1440-light.jpg`, `learner-plan-overview-1440-dark.jpg`
- **learner-plan-week-trail**: `learner-plan-week-trail-390-light.jpg`, `learner-plan-week-trail-390-dark.jpg`, `learner-plan-week-trail-1440-light.jpg`, `learner-plan-week-trail-1440-dark.jpg`
- **learner-library**: `learner-library-390-light.jpg`, `learner-library-390-dark.jpg`, `learner-library-1440-light.jpg`, `learner-library-1440-dark.jpg`
- **learner-topic**: `learner-topic-390-light.jpg`, `learner-topic-390-dark.jpg`, `learner-topic-1440-light.jpg`, `learner-topic-1440-dark.jpg`
- **learner-topic-code**: `learner-topic-code-390-light.jpg`, `learner-topic-code-390-dark.jpg`, `learner-topic-code-1440-light.jpg`, `learner-topic-code-1440-dark.jpg`
- **learner-module**: `learner-module-390-light.jpg`, `learner-module-390-dark.jpg`, `learner-module-1440-light.jpg`, `learner-module-1440-dark.jpg`
- **learner-certificate**: `learner-certificate-390-light.jpg`, `learner-certificate-390-dark.jpg`, `learner-certificate-1440-light.jpg`, `learner-certificate-1440-dark.jpg`
- **learner-results**: `learner-results-390-light.jpg`, `learner-results-390-dark.jpg`, `learner-results-1440-light.jpg`, `learner-results-1440-dark.jpg`
- **learner-profile-menu**: `learner-profile-menu-390-light.jpg`, `learner-profile-menu-390-dark.jpg`, `learner-profile-menu-1440-light.jpg`, `learner-profile-menu-1440-dark.jpg`
- **learner-topic-quiz**: `learner-topic-quiz-390-light.jpg`, `learner-topic-quiz-390-dark.jpg`, `learner-topic-quiz-1440-light.jpg`, `learner-topic-quiz-1440-dark.jpg`
- **learner-topic-quiz-result**: `learner-topic-quiz-result-390-light.jpg`, `learner-topic-quiz-result-390-dark.jpg`, `learner-topic-quiz-result-1440-light.jpg`, `learner-topic-quiz-result-1440-dark.jpg`
- **admin-reviews**: `admin-reviews-390-light.jpg`, `admin-reviews-390-dark.jpg`, `admin-reviews-1440-light.jpg`, `admin-reviews-1440-dark.jpg`
- **learner-notifications**: `learner-notifications-390-light.jpg`, `learner-notifications-390-dark.jpg`, `learner-notifications-1440-light.jpg`, `learner-notifications-1440-dark.jpg`
- **admin-overview**: `admin-overview-390-light.jpg`, `admin-overview-390-dark.jpg`, `admin-overview-1440-light.jpg`, `admin-overview-1440-dark.jpg`
- **admin-people**: `admin-people-390-light.jpg`, `admin-people-390-dark.jpg`, `admin-people-1440-light.jpg`, `admin-people-1440-dark.jpg`
- **admin-generated**: `admin-generated-390-light.jpg`, `admin-generated-390-dark.jpg`, `admin-generated-1440-light.jpg`, `admin-generated-1440-dark.jpg`
- **admin-ai-settings**: `admin-ai-settings-390-light.jpg`, `admin-ai-settings-390-dark.jpg`, `admin-ai-settings-1440-light.jpg`, `admin-ai-settings-1440-dark.jpg`
- **admin-skill-graph**: `admin-skill-graph-390-light.jpg`, `admin-skill-graph-390-dark.jpg`, `admin-skill-graph-1440-light.jpg`, `admin-skill-graph-1440-dark.jpg`
- **admin-courses**: `admin-courses-390-light.jpg`, `admin-courses-390-dark.jpg`, `admin-courses-1440-light.jpg`, `admin-courses-1440-dark.jpg`
- **admin-learner-setup**: `admin-learner-setup-390-light.jpg`, `admin-learner-setup-390-dark.jpg`, `admin-learner-setup-1440-light.jpg`, `admin-learner-setup-1440-dark.jpg`
- **admin-learner-assessment**: `admin-learner-assessment-390-light.jpg`, `admin-learner-assessment-390-dark.jpg`, `admin-learner-assessment-1440-light.jpg`, `admin-learner-assessment-1440-dark.jpg`
- **admin-learner-path**: `admin-learner-path-390-light.jpg`, `admin-learner-path-390-dark.jpg`, `admin-learner-path-1440-light.jpg`, `admin-learner-path-1440-dark.jpg`
- **admin-learner-library**: `admin-learner-library-390-light.jpg`, `admin-learner-library-390-dark.jpg`, `admin-learner-library-1440-light.jpg`, `admin-learner-library-1440-dark.jpg`
- **admin-learner-progress**: `admin-learner-progress-390-light.jpg`, `admin-learner-progress-390-dark.jpg`, `admin-learner-progress-1440-light.jpg`, `admin-learner-progress-1440-dark.jpg`
- **admin-learner-account**: `admin-learner-account-390-light.jpg`, `admin-learner-account-390-dark.jpg`, `admin-learner-account-1440-light.jpg`, `admin-learner-account-1440-dark.jpg`
- **admin-bulk**: `admin-bulk-390-light.jpg`, `admin-bulk-390-dark.jpg`, `admin-bulk-1440-light.jpg`, `admin-bulk-1440-dark.jpg`
