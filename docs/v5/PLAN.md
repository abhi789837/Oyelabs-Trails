# v5 plan and shared contracts

Read `PROGRESS.md`, `RESEARCH.md`, `CODEMAP.md` (front end) and `docs/v4.4/CODEMAP.md` (server) first. Record your own decisions in `DECISIONS.md`, appending under your phase heading.

## Rules for every agent
1. **Don't change the old UI.** While `ui_v5` is off, the old UI must look and behave exactly as it does now.
   - All v5 screens live under `src/v5/**`. Reuse the old features' API objects, stores and pure helpers by importing them. Don't edit them unless a bug needs fixing.
   - All existing e2e scripts must keep passing with the flag off.
2. **Code splitting.** Every v5 route is `lazy()`. Monaco, the PDF code, Recharts, Tiptap, canvas-confetti and MediaPipe load only where they're used. Budget: under 200 KB gzipped of initial JS for learner routes.
3. **Accessibility.** WCAG 2.2 AA:
   - visible focus, and targets of at least 24×24 px;
   - a button alternative to every drag;
   - `prefers-reduced-motion` respected;
   - an axe check passing on every route you build.
4. **Plain words.** Follow `docs/v4.4/COPY_GUIDE.md` on every screen, learner screens included. `copyGuide.test.ts` will be extended to cover `src/v5/admin/**`.
5. **Migrations.** The main session makes `0025_v5_*` from the schema below. Don't run `drizzle-kit generate`. Put requests for new columns under "Schema requests" in `DECISIONS.md`.
6. **AI.** New tasks go through `shared/aiRouting.ts` with a mock fixture and a fallback, as in v4.4.
7. **Tests.** Write vitest tests for pure logic and server routes. Each screen group adds a Playwright script `scripts/e2e/v5-<group>.ts` that runs with axe (`@axe-core/playwright`) at 390 and 1440 px. Lint, typecheck, test and build must stay green.
8. **Don't commit.** The main session commits per phase.

## The `ui_v5` flag
- **Global setting:** `app_meta` key `ui.v5_default`, `"on"` or `"off"`. It defaults to off until Phase 9.
- **Per user:** `user_prefs.data.uiV5`, which is true, false or null (null follows the global setting).
- **Where the client gets it:** `GET /api/auth/me` returns `ui: { v5: boolean }`, the effective value.
- **Changing it:**
  - `PUT /api/me/ui` with `{ v5: boolean|null }`. Each change is written to the audit log as `ui.v5_toggle`.
  - Superadmins use `PUT /api/admin/settings/ui`.
- **Client:** `App.tsx` renders `<V5App/>` (lazy, from `src/v5/app/V5App.tsx`) when `ui.v5` is true, and the old tree otherwise. `V5App` owns its own `Routes`.
- **Switching designs:**
  - The new UI has "Use previous design" under Me → Settings, and on the admin user menu.
  - The old UI gets a small "Try the new design" link in the user menu, shown only while the flag is off globally.
  - A `?ui=v5` or `?ui=old` query parameter is allowed for staff, for testing.

## v5 routes
- **Learner:**
  - `/learn` Today
  - `/learn/plan` My plan
  - `/learn/library` Library, and `/learn/library/:courseId` the course page
  - `/learn/review` Review
  - `/learn/me` Me
  - `/learn/lesson/:topicId` the lesson player, with `?step=watch|read|do|check`
  - `/learn/certificate/:certId` and public `/verify/:certId`
- **Old URLs** (`/`, `/plan`, `/track/...topic/...`, `/library`) redirect to their v5 equivalents when the flag is on.
- **Assessment:** `/assessment` gets the v5 calm UI, in `src/v5/assessment/**`, using the same API.
- **Admin:**
  - `/admin` is the inbox
  - `/admin/overview`, `/admin/people` (with a side sheet), `/admin/onboard` (the v4.4 flow, restyled), `/admin/library`, `/admin/library/:courseId/edit`, `/admin/reports`
  - every other old admin page is shown inside the v5 shell, unchanged, until it's replaced
- **`/design`** is the living style guide (staff only).

## Schema for migration 0025 (additive only)
- **`review_cards`** (FSRS):
  - id, user_id, source (`"quiz_item"|"glossary"|"mistake"|"topic_point"`), ref_id, topic_id (nullable), front (json), back (json)
  - fsrs (json: the full ts-fsrs Card), due (int ms), suspended (bool, default false), created_at, updated_at
  - unique (user_id, source, ref_id); index (user_id, due)
- **`review_logs`:** id, user_id, card_id, rating (1–4), review (json: the ts-fsrs ReviewLog), reviewed_at.
- **`xp_events`:** id, user_id, kind, ref_id, xp (int), created_at; unique (user_id, kind, ref_id), so awards can't repeat.
- **`weekly_streaks`:**
  - user_id (pk), current, best, last_met_week (`"YYYY-Www"`)
  - freezes_left, freeze_month (`"YYYY-MM"`), history (json of `{week, met, frozen}`), updated_at
- **`lesson_state`:** user_id + topic_id (pk), step, step_done (json: `{watch,read,do,check}` booleans), video_id, position_sec, updated_at.
- **`lesson_notes`:** id, user_id, topic_id, video_id (nullable), at_sec (nullable), body, created_at, updated_at.
- **`problem_reports`:** id, user_id, topic_id, step, message, status (`"open"|"resolved"`), created_at, resolved_by, resolved_at.
- **`tutor_messages`:** id, user_id, topic_id, step, question, answer, citations (json), rating (-1, 0 or 1), created_at; index (user_id, created_at).
- **`announcements`:** id, title, body, audience (json: `{all?: true, departmentIds?: [], userIds?: []}`), pinned (bool), created_by, created_at, expires_at.
- **`certificates`:**
  - id (pk, a short public code), user_id, kind (`"track"|"course"|"goal"`), ref_id, title, holder_name
  - issued_at, hash, revoked_at (nullable)
  - unique (user_id, kind, ref_id)
- **`content_versions`:** id, entity_type (`"course"|"topic"`), entity_id, version, data (json), created_by, created_at; unique (entity_type, entity_id, version).
- **`email_outbox`:** id, to_user_id, to_address, kind, subject, html, text, status (`"queued"|"sent"|"failed"|"skipped"`), error, created_at, sent_at.
- **Prefs keys** (`user_prefs.data`, no migration): uiV5, theme, captions, autoplayNext, reducedMotion (`"system"|"on"|"off"`), celebrations, reminderTime (`"HH:MM"`), quietHours (`{from,to}`), weeklyEmail, leaderboardOptIn, welcomeDoneAt, weeklyGoalHours.

## XP rules (`shared/xp.ts`)

| Action | XP |
|---|---|
| Step completed | 10 |
| Quick check passed | 15 |
| Lesson completed | 30 |
| Topic test passed | 50 |
| Review session (at least 5 cards) | 20 |
| Practical case passed | 150 |
| Skill level up | 75 |
| Certificate | 200 |

Every award is idempotent through `xp_events`.

**Weekly streak:** a week counts as "met" when the learner's logged hours reach their weekly goal (or ≥ 3 steps done when no goal). Each month brings 1 freeze, which is used automatically on a missed week. There are no leaderboards unless `app_meta` `motivation.leaderboards` = `"on"`; then they show opt-in learners only.

## Ownership (one agent per area)

| Area | Files |
|---|---|
| Foundation (P0) | `src/App.tsx` (flag switch only), `src/v5/app/**` (V5App, routes, shell placeholders), `shared/ui.ts`, `server/src/routes/ui.ts`, the auth `me` response, the old UserMenu "Try the new design" link, migration 0025 + schema |
| Design system (P1) | `src/v5/design/**` (tokens.css, components, motion, `/design` page), font and library dependencies in `package.json`, `size-limit` and `lighthouserc` config |
| Today (P2) | `src/v5/learner/today/**`; server `server/src/v5/{streak,xp,announcements}/**` |
| Lesson (P3) | `src/v5/learner/lesson/**`; server `server/src/v5/{lesson,notes,tutor,problems}/**` |
| Plan, Library, Review, Me (P4) | `src/v5/learner/{plan,library,review,me}/**`; server `server/src/v5/review/**` (FSRS) |
| Assessment, results, certificates (P5) | `src/v5/assessment/**`, `src/v5/learner/certificate/**`; server `server/src/v5/certificates/**` |
| Motivation (P6) | `src/v5/motivation/**`; server `server/src/v5/{notify,email}/**` |
| Admin (P7) | `src/v5/admin/**`; server `server/src/v5/admin/**` |

## Waves
1. P0 foundation and P1 design system, in parallel.
2. P2 Today, P3 Lesson, P4 Plan/Library/Review/Me and P7 Admin, in parallel. They only touch their own directories.
3. P5 Assessment and P6 Motivation.
4. P8 mobile, accessibility and PWA, as one pass over everything.
5. P9 quality gates, then switch the flag on by default.
