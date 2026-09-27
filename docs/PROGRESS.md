# v2 build progress

Resume here after an interruption: read CLAUDE.md, this file and `git log`, then continue with the
first unchecked item. `npm run content:check` lists which registry modules don't exist yet.

## Phase 2: content, module by module

Status: `[ ]` not started, `[~]` being written, `[x]` committed (`content: <module>`).

### Frontend (14 modules)
- [x] fe-tooling: Dev Environment & Tooling (6)
- [x] fe-html-css: HTML & CSS Foundations (13)
- [x] fe-js-core: JavaScript Core, Namaste JavaScript S1 (19)
- [x] fe-js-advanced: JavaScript Advanced & Interview-Level (21)
- [x] fe-typescript: TypeScript (16)
- [x] fe-tailwind: Tailwind CSS (7)
- [x] fe-react-fundamentals: React Fundamentals (9)
- [x] fe-react-hooks: React Hooks & Advanced Patterns (16)
- [x] fe-react-ecosystem: React Ecosystem (9)
- [x] fe-react-projects: React Practice Projects (3)
- [x] fe-nextjs: Next.js (11)
- [x] fe-vue: Vue.js (11)
- [x] fe-meta-mobile: Meta-Frameworks, Mobile & Bonus (3)
- [x] fe-security-perf: Frontend Security & Performance (5)

### Backend (12 modules)
- [x] be-foundations: Web & Backend Foundations (4)
- [x] be-node-core: Node.js Core (10)
- [x] be-express: Express.js (9)
- [x] be-sql: SQL & Relational Databases (10)
- [x] be-nosql: NoSQL & Caching (6)
- [x] be-auth-security: Authentication & Security (8)
- [x] be-api-design: API Design (8)
- [x] be-nestjs: NestJS (9)
- [x] be-python: Python Backend (8)
- [x] be-docker: Docker & Containers (8)
- [x] be-system-design: System Design Fundamentals (8)
- [x] be-testing-ops: Backend Testing & Ops (4)

### Full-Stack (5 modules)
- [x] fs-mern: MERN End-to-End (5)
- [x] fs-nextjs: Next.js Full-Stack (5)
- [x] fs-t3: The T3 Stack & End-to-End Type Safety (4)
- [x] fs-graphql: GraphQL Full-Stack (3)
- [x] fs-capstone: Full-Stack Capstone & Deployment (5)

### AI-Driven Development (6 modules)
- [x] ai-tools: The AI Coding Tools Landscape (5)
- [x] ai-prompting: Prompt Engineering (5)
- [x] ai-context: Context Engineering & AI Pair Programming (5)
- [x] ai-llm: LLM Fundamentals (5)
- [x] ai-rag: Retrieval-Augmented Generation (5)
- [x] ai-agents: AI Agents (5)

All 37 modules committed: 293 topics, 2,163 quiz questions, 86 code challenges (the brief estimates ~240; its module lists add up to 293). Full check: `npm run content:check` 0 errors/0 warnings; 547 videos re-verified via oEmbed; 1,091 reference URLs checked (0 broken); all 86 reference solutions pass in the in-browser runner.

## Phases 3–12: app

- [x] 3. App shell & routing (four-level routes, sidebar with track + module progress)
- [x] 4. Progress store (`getModuleCompletionPct`)
- [x] 5. Dashboard
- [x] 6. Track roadmap (module camps)
- [x] 7. Module view (waypoint path)
- [x] 8. Topic detail (reference previews with fallback, embedded video, alternate videos)
- [x] 9. Challenge engine (multi-select, Markdown code blocks, edge-case tags)
- [x] 10. Certificate + module-complete toasts
- [x] 11. Polish pass (375/768/1280/1440, dark mode, mobile overflow fix, focus rings, reduced motion)
- [x] 12. Deploy prep (clean build, vercel.json, README with module/topic authoring and deploy steps)

## Decisions log

- Full-Stack keeps the added `glacier` accent: the brief assigns `ridge` to both Full-Stack and
  AI-Driven while reserving `ridge` for AI-Driven only.
- Content lives in `src/content/<trackId>/<moduleId>.ts`; a generated manifest
  (`src/content/manifest.generated.ts`) holds light metadata and module content is lazy-loaded.
- Video research uses `scripts/research/yt.mjs`, which reads youtube.com itself (search results,
  watch page, oEmbed) rather than third-party aggregators; oEmbed success also proves embeddability.
- Reference previews: embeddability is precomputed from response headers
  (`npm run content:embeds` → `src/content/embeds.generated.ts`), because browsers fire `load` even for
  frames blocked by X-Frame-Options, so a runtime timeout alone can't detect blocking.
- The v1 app ran on `src/types/curriculum-v1.ts` during the migration; both are removed now.
- Levels skew toward advanced (8 beginner, 84 intermediate, 161 advanced, 40 expert): topics were
  levelled by the real difficulty of their challenge rather than by the module's nominal range.
- YouTube throttled watch-page scraping (HTTP 429 / captcha) late in the run. Video existence and
  embeddability were verified via oEmbed throughout (and re-verified for all 547 videos at the end);
  durations and chapter starts came from YouTube's player data where the watch page was blocked.
- Some videos the brief marks as verified have different real durations (e.g. OWASP course 1:27:00,
  GraphQL course 1:28:59, Redux Toolkit 14:11:42, React Native 4:40:39, Bootstrap/Sass 5:02:23); the
  content uses YouTube's real values.

## v3 decisions

Decisions the v3 brief (`docs/TRAILS_V3_BRIEF.md`) does not settle, made during the build.
Answers to the brief's §18 open questions were supplied by Abhishek up front and are recorded in
`docs/V3_STATE.md`.

- **Docs layout.** `TRAILS_V3_BRIEF.md` and `CLAUDE_CODE_PROMPTS.md` moved into `docs/`, and the v2
  codebase briefing was renamed `docs/CODEBASE_CONTEXT.md`, because every prompt references those
  paths.
- **No AI credential in the build environment.** `ANTHROPIC_API_KEY` is unset, so a deterministic
  `MockProvider` backs P3–P6. It is registered only when `NODE_ENV !== "production"` and is never
  selectable in production. Real-AI verification is pending (tracked in `docs/V3_STATE.md`).
- **P3: AI library APIs verified from the installed packages, not from memory.**
  - `@anthropic-ai/sdk` 0.128.0 — structured output is `messages.create({ output_config: { format:
    { type: "json_schema", schema } } })`; `JSONOutputFormat` takes a bare JSON Schema object.
    Usage is `response.usage.input_tokens/output_tokens`. The `Model` union includes
    `claude-sonnet-5`, `claude-opus-5`, `claude-opus-5-5` and `claude-haiku-4-5`, which is where
    the suggested defaults come from.
  - `openai` 7.22.0 — `chat.completions.create({ response_format: { type: "json_schema",
    json_schema: { name, schema, strict } } })`. `strict: false` is used for generation because a
    zod-derived schema marks optional fields non-required, which strict mode rejects; validation
    and the repair turn cover the difference, and `verify()` uses `strict: true` on a schema
    written by hand.
  - `zod` 4.6.5 has `z.toJSONSchema`, so no separate converter dependency is needed. `$schema` is
    stripped because both providers reject unknown top-level keys.
  - `isolated-vm` 7.0.1 installs from prebuilt binaries and runs on Windows/Node 24 — the brief
    anticipated a native-build problem here and there isn't one.
  - The `claude` and `codex` CLIs are **not installed in this environment**, so those two adapters
    are written to the documented interface (`claude -p --output-format json` with
    `CLAUDE_CODE_OAUTH_TOKEN`; `codex exec --json` with a private `CODEX_HOME`) but could not be
    executed. Recorded in `docs/V3_STATE.md` as needing a live check.
- **`AiService.providerFor` returns the mock when one is configured.** Verification has to behave
  like every other call; building a real client there made the test suite issue live HTTPS
  requests with placeholder keys, which a test caught.

### P4 sample-profile runs

Three sample learner profiles live in `server/src/dev/sampleProfiles.ts` and are used by both the
dev seed (`npm run dev:seed -- --issue`) and `server/src/assessment/blueprint.test.ts`:

| Learner | Profile | Result |
| --- | --- | --- |
| Priya Sharma | Junior frontend, 1.5 yrs, strong UI, shaky async, no backend | `ready` · 6 areas · 78 items kept, 16 dropped |
| Arjun Mehta | Mid PHP/Laravel, 4 yrs, deep in one framework, unclear breadth | `ready` · 6 areas · 78 items kept, 16 dropped |
| Sofia Reyes | Senior Node/NestJS, 8 yrs, strong systems thinking, self-deprecating on frontend | `ready` · 6 areas · 78 items kept, 16 dropped |

**These runs used the deterministic `MockProvider`, so read them as a check of the pipeline, not
of content quality.** What they establish:

- the blueprint → per-area pool → critic → code-verification sequence completes,
- every kept item's topic tags are real ids from the manifest,
- kept code items' reference solutions genuinely pass in the sandbox and their starters genuinely
  fail (asserted by running both),
- the rejection paths fire on every run: an item tagged with a non-existent topic is dropped, and
  an item the critic disagrees with is dropped, each with a readable reason stored on the row,
- the per-assessment cap of three code items holds.

What they do **not** establish: the three results are identical because the mock's fixture does
not vary by profile. Whether a blueprint actually reflects *these* notes — whether Priya's
assessment really does probe async and Sofia's really does start higher — can only be judged with
a real credential. That is the first thing to check once one is added.
- **Non-JavaScript topics use quiz challenges** (brief §14.2). The code runner executes JavaScript
  only — `isolated-vm` is a V8 isolate. PHP, Dart, Kotlin, Swift, Java, Go and C# topics therefore
  use quizzes, including predict-the-output questions written as quiz items, which test the same
  reading comprehension a `predict_output` assessment item does. JavaScript and TypeScript topics
  keep their code challenges. A multi-language runner is a separate project.
- **Three new accent tokens for the v3 tracks**: `canyon` (PHP, hue ~18°), `alpenglow` (Mobile,
  ~338°) and `lichen` (DevOps, ~75°). Hues were chosen to sit clear of the existing five on the
  colour wheel, and every `-strong` variant was checked to clear 4.5:1 against its own theme's
  background rather than eyeballed — the numbers are in the commit that added them.
- **Wave 1's registry entries landed before their content.** `content:check` reports a registry
  module with no file as "not written yet" rather than as an error, and the manifest marks it
  `available: false`, so the ordering is visible in the codebase while the camps are filled in one
  at a time.
- **An approval gate between generation and the learner** (requested after v3 shipped). A
  generated assessment now lands in `awaiting_approval` rather than `ready`. The superadmin
  approves it, or the existing sweeper releases it automatically after
  `AUTO_APPROVE_AFTER_MS` (5 minutes, in `shared/assessment.ts`). Auto-release writes a
  *different* audit action from a human one — `assessment.auto_approved` with a null actor, not a
  flag on the same action — because "nobody looked at this" and "someone reviewed it" are
  different facts and a shared action name would blur them. `docs/TRAILS_V3_BRIEF.md`'s data model
  was amended to match.
- **The AI call timeout was 120s and is now 15 minutes** (`AI_TIMEOUT_MS`). One generation is a
  dozen-plus provider calls, and a CLI provider spawns a process per call, so two minutes failed
  on ordinary work rather than on a hang.

## UI overhaul decisions

- **A dev server can outlive the session that started it, and lie about the current build.** The
  U12 screenshot run failed with every page blank and Vite returning 500 for `src/index.css`:
  `@layer base is used but no matching @tailwind base directive is present`, pointing at a v3
  Tailwind PostCSS plugin. The whole dependency tree was v4, the string was nowhere in
  `node_modules`, and `npm run build` was green — because the process holding port 5173 had been
  started **two days earlier**, before the v3 → v4 migration, and every `npm run dev` since had
  silently failed to bind and left the zombie answering. Nothing was wrong with the migration.
  Check `Get-NetTCPConnection -LocalPort 5173` and compare `StartTime` against the migration before
  debugging a dev-only failure that the production build does not reproduce.

- **The screenshot harness now completes the forced password change instead of refusing.** Every
  seeded account has `must_change_password` set — correct behaviour, and the exact state a fresh
  development database is in the first time the harness meets it. Refusing made the harness
  unusable on a fresh database, which is why the baseline went uncaptured through U0 and U2. It now
  goes through the same form a person would (the server still applies its own rules) and prints the
  new password so a re-run has a way in.

- **Sparklines are bucketed on the server from real timestamp columns, on local midnights.** The
  overview asked for seven-day trends the API did not expose. Rather than smooth or synthesise a
  series, `/api/admin/overview` gained `trend7d`, counted from `created_at` columns that already
  existed. Local midnight via `Date.setHours(0,0,0,0)` rather than subtracting 86,400,000, which
  drifts by an hour twice a year and files two events under the wrong day. An empty bucket is `0`,
  never absent: a gap in a sparkline reads as missing data, and a quiet Sunday is not missing data.

- **Faceted filters are only for closed sets.** The audit log's action vocabulary grows whenever
  new code calls `writeAudit`, so a hardcoded facet list would quietly stop showing new actions.
  The chips filter by *family* — `startsWith "assessment."` — which is the stable part. Same rule as
  the notification-kind fallback in U5: map what you know, fall back by family, never drop.

- **Two admin pages answer different questions about the same table, so they are two pages.** The
  per-assessment integrity timeline answers "what happened during this sitting" and needs sequence
  and spacing, so it is a timeline with gap labels. The global feed answers "is this happening" and
  needs counts across time, so it is a paged table. Merging them would have made one of the two
  questions harder to ask.

- **The live board is not a camera feed, and says so.** Thumbnails are snapshots already captured
  *with* an integrity event, each labelled with its event and time. A grid that refreshed itself
  would read as surveillance-in-progress and imply a freshness the data does not have.

- **The Tailwind v4 upgrade tool corrupted curriculum content, and was reverted there.** It
  renames the `shadow` utility to `shadow-sm` and applied that to every occurrence of the *word*
  in 19 content files: "a temporary shadow database" became "a temporary shadow-sm database", in
  summaries and quiz options. It made the same class of mistake in app code, rewriting Badge's
  `variant="outline"` prop to `"outline-solid"` in three places. Both are blind token replacement
  in strings that are not class names. `src/content/` was reverted wholesale and the three props
  restored by hand; only class strings were kept. **Never run a codemod across `src/content/`.**

- **Branch `ui-overhaul`, cut from `main` at `2e402f6`.** `main` is what the live deployment runs,
  so nothing reaches it until the branch is merged deliberately.
- **The `no-alert` lint rule must exempt `src/content/**`.** A grep for `alert(`/`confirm(`/
  `prompt(` finds 18 hits, but **9 are inside curriculum content** — code snippets in quiz
  questions where `alert("…")` is the subject being taught. Only 9 are app code. Rewriting the
  others would corrupt content that the quality gate and 289 tests exist to protect.
- **The trail visuals and the topic page do not get restyled.** They were built to the brief's
  design language and are the two screens the owner singled out as good. Only the shared primitives
  underneath them change, and the before/after screenshots exist to prove they did not move.
- **The assessment runner and proctoring screen stay calm.** Functional transitions only — no
  background effects, no confetti, no decorative motion. MediaPipe needs the CPU and the learner
  needs to concentrate.

### U2 — tokens and primitives

- **`src/lib/motion.ts` is the only place a duration is written.** Three durations (120/200/320ms),
  three easings, one spring (`stiffness: 380, damping: 30`), and the `fadeUp` / `scaleIn` /
  `fieldMessage` / `stagger()` variants. Every variant animates **transform and opacity only** —
  the two properties the compositor handles without a layout or paint pass, which is what keeps a
  long admin list smooth while it animates in. The one number written twice is the 120ms CSS
  transition on buttons and inputs, because CSS cannot import from TypeScript; it is commented as
  such at both ends.
- **One `StatusBadge`, keyed by enum, replaces a dozen ad-hoc pills.** The same enum was being
  drawn four different ways: `AssessmentStatus` appeared as a toned pill on the assessment tab, an
  untoned pill on the live page, raw `in_progress` text on the learner header and plain muted text
  in the people table. The registry in `ui/status-badge.tsx` is typed
  `Record<StatusKinds[K], Entry>`, so adding a value to `shared/enums.ts` without giving it a label
  and a tone **fails the build**, and `status-badge.test.ts` catches the reverse (a registry entry
  for a value that no longer exists).
- **Tones are the trail vocabulary, not new colours**: trailmark = in flight, summit = arrived,
  basalt/outline = quiet, destructive = went wrong. One addition — `brand` — carries `role`,
  because a role is an identity, not a state, and colouring "Super admin" as "in progress" would be
  a lie. `badgeVariants` gained `danger` and `brand`; `danger` alone collapsed eight copies of
  `className="border-destructive/50 text-destructive"`.
- **A hard-severity badge pulses only when the caller passes `live`.** The live integrity feed
  passes it while the assessment is `in_progress`; the integrity *tab*, which is a record of
  finished incidents, does not. A page of past events that blinks is noise, not a warning. The
  animation is `--animate-status-pulse` in `index.css` — opacity only, flattened by the global
  `prefers-reduced-motion` block, since CSS keyframes are outside Motion's reach.
- **A loading button must not change width.** The old pattern swapped the label ("Save credential"
  → "Saving…") and prepended a spinner, so every button resized mid-action and the row reflowed.
  `loading` now keeps the label in the DOM at `opacity-0` — the width is unchanged and the
  accessible name survives — and overlays a spinner absolutely. It also disables the button but
  cancels the disabled fade (via twMerge, which resolves the override deterministically where
  stylesheet order would not), because a 50%-opacity spinner reads as broken rather than busy.
- **Press feedback is `whileTap` on `motion.button`, except under `asChild`.** Slot takes exactly
  one child and forwards props to it, so there is no element of ours to hang `whileTap` on and
  nowhere to overlay a spinner; that path falls back to `active:scale-[0.97]`, which the global
  reduced-motion rule already flattens. `loading` is not supported with `asChild`.
- **Every variant carries a 1px border, transparent where a fill draws the edge.** An outline
  button and a filled button are now the same size to the pixel, so swapping one for the other in a
  toolbar cannot shift the row.
- **Cards get two elevations and no more.** The brief calls out "identical shadowed cards
  everywhere" as the generic-AI-app look, so separation comes from `density`, the border and a
  semantic `tone` tint; `elevation` is `flat` (default) or `raised`, and there is deliberately no
  third step to reach for.
- **`density` has no default.** Several cards wrap a button or a link that owns its own padding —
  `PlanTab` does exactly this — and a default padding would double it.
- **The password meter is an estimate and says so.** The server owns the decision: length, not the
  username, and a 1500-entry common-password list with trailing digits and punctuation stripped.
  Shipping that list to the browser costs more than it is worth, so `lib/password-strength.ts`
  checks the two rules the client can verify exactly plus a variety heuristic, clamps obvious
  patterns (`aaaaaaaaaa`, `abcdefghij`, `9876543210`) to weak, and the hint text names the server's
  extra check rather than pretending it does not exist. It returns the *rules*, not just a score,
  so the screen can say which requirement is outstanding.
- **`TagInput` ships without a call site, on purpose.** The one plausible target — the target-trails
  picker in onboarding — shows seven chips with their names visible, and hiding them behind a
  filtered dropdown would be a downgrade. It waits for U4's table filters and U7's onboarding form.
- **`TopicStatusBadge` now renders `StatusBadge` with `dot={false}`.** The topic page is one of the
  two surfaces that must not move, and it predates the dot; the class output is identical to before.
  `ChallengeResult`'s spring (`380/22`) was left alone for the same reason — the checkmark's small
  overshoot *is* the topic page's one deliberate motion moment, and the house spring (`380/30`)
  would damp it out.

### U3 — overlays

- **`useConfirm()` is promise-based and lives at the app root, not per-screen.** A confirmation has
  to outlive the component that asked for it — a table row that disappears when the list reloads
  must not take its own "are you sure" with it — and the admin console, the learner app and the
  proctored assessment all need the same one rather than three that could stack.
- **`AnimatePresence` wraps Radix's `Root`; `forceMount` is not used.** The usual
  `forceMount` + `AnimatePresence` recipe keeps Radix's `FocusScope` mounted with
  `trapped: true` after close, so focus stays trapped in an invisible dialog. Wrapping the root
  instead lets Radix mount and unmount normally — which is what restores focus to the trigger —
  while the exit animation still runs, because Motion's exit feature registers through the
  presence context across the portal boundary.
- **Overlay motion comes from `src/lib/motion.ts`** (`transition.fast` for the backdrop and the
  calm variant, `spring` for the panel). It was written inline first, because U2 was creating that
  module concurrently, and reconciled to the real tokens once it landed.
- **Buttons in both dialogs use U2's `loading` prop** rather than their own spinner, so the confirm
  button does not change width the moment it is pressed.
- **The confirm dialog can run the action itself (`onConfirm`).** It shows a spinner, keeps focus,
  and on failure shows the message *inside the dialog* rather than behind it. Used for the three
  irreversible admin actions; everywhere else `confirm()` just resolves a boolean and the page
  keeps its own busy and error state.
- **Typed confirmation for three actions only**: delete an AI credential (type the label), disable
  a learner and revoke their sessions (type the username). The test is exact-match after trimming.
  Terminating a live assessment is destructive to the *learner*, so it says what it costs them —
  time left, answers in, no resume — rather than asking for a username the admin would type without
  reading.
- **The assessment's finish-now confirmation gets `calm: true`**: fade only, no spring, no slide. It
  is the one dialog in the app that must not perform.
- **sonner replaces the hand-rolled toast stack; the camp/summit logic was not touched.**
  `CompletionWatcher`'s detection — the two `Set`s diffed against the state it started with, so
  loading saved progress never fires a toast — is unchanged. `src/store/toastStore.ts` kept the
  payload shape and became the single entry point `pushCompletionToast`, which renders the same
  card through `toast.custom`. `src/components/layout/Toaster.tsx` was deleted.
- **Every toast is `unstyled`.** sonner injects its stylesheet into `<head>` at runtime, after the
  app's CSS, so its own `[data-sonner-toast][data-styled=true]` rules would win over Tailwind
  utilities of equal specificity. Switching styling off entirely and supplying `classNames` keeps
  the tokens authoritative — and keeps the inverted `popover` pair the completion toasts always had.
- **`eslint.config.js` runs two rules, not a ruleset.** A recommended config would bury the one
  signal this step added under hundreds of pre-existing warnings. `@typescript-eslint/eslint-plugin`
  is registered but switched off, purely so the `eslint-disable` comments already in `server/`
  resolve to a real rule name instead of erroring as unknown.

### U5 — the shell

- **The notification centre reads real rows, so it needed a real endpoint.** `server/src/lib/notify.ts`
  has been writing notifications since v3 phase 2, and several of them are addressed to *learners*
  ("your placement assessment is ready", "your learning plan is ready", "your assessment was
  ended"). The only way to read one was `GET /api/admin/notifications`, which is `superadminOnly`,
  so a learner could never see a notification written to them. Rather than invent a feed or show
  the bell to admins alone, `GET /api/me/notifications` and `POST /api/me/notifications/read` were
  added to `server/src/routes/me.ts` — the same `listNotifications`/`unreadCount`/`markAllRead`
  helpers, scoped to whoever is asking. One bell, one endpoint, both roles. The types live in the
  new `shared/notifications.ts`.
- **`kind` stays a free-form string on the client.** The server adds kinds as features land
  (`assessment.ready`, `assessment.auto_approved`, `assessment.awaiting_approval`,
  `assessment.failed`, `assessment.terminated`, `plan.published`, `evaluation.ready`,
  `evaluation.failed` today). `notificationTone()` maps the known ones and falls back by family,
  so a kind shipped from the server before the client knows about it still renders rather than
  vanishing. There is a test for exactly that.
- **Read state is all-or-nothing, and the UI says so.** The API offers "mark all read" and nothing
  finer, so a row stays unread until someone presses the button — opening the panel does not clear
  it. Marking read on open would be a lie the first time a panel is opened by accident, and there
  is no per-row endpoint to do better honestly.
- **The bell polls; it does not open a second SSE stream.** `/api/admin/events` is the superadmin's
  live integrity feed and is superadmin-only. Holding an `EventSource` open for every learner to
  hear about a notification that is an hour away would cost a connection each for nothing. It
  refreshes on mount, on open, every 60s while the tab is visible, and on `visibilitychange` — a
  hidden tab polls not at all.
- **The theme toggle moved into the user menu, and `ThemeToggle.tsx` was deleted.** It was a
  permanent slot in the top bar for something most people set once. As a radio pair it now says
  which theme is *on* rather than only which one is next. `uiStore` was not touched: the menu calls
  the existing `toggleTheme()` when the chosen value differs from the current one.
- **There is no profile page to link to, so the menu's identity block is the profile.** Accounts
  are created and edited by a superadmin and a learner has nothing of their own to change but their
  password, so the menu shows name, username and role and leaves it there rather than linking to a
  screen that does not exist.
- **The palette caps results before React sees them; cmdk never filters.** The curriculum is **715
  topics**. cmdk's built-in filter scores every *mounted* item on every keystroke, so the palette
  passes `shouldFilter={false}` and hands it 8 topics, 4 camps, 3 trails, 5 people and 5 actions at
  most — 25 rows however big the curriculum gets. The empty state is recents plus actions plus
  trails, which is why nothing renders the whole curriculum at any point. Matching lives in
  `commandIndex.ts`, free of React and of `@/content`, so the ranking is tested directly (this
  repo's vitest is Node with no DOM).
- **Ranking is scored, not merely filtered.** Every query word must appear, then an exact topic id
  wins outright, an exact title next, then a title prefix, then a word-start, then a substring, with
  a small tiebreak for the bigger kind and the shorter title. That is what puts "Closures" above
  "setTimeout and closures" for `closures`, and what makes a pasted topic id land on its topic.
- **Groups are taken after ranking, not ranked within groups.** A query matching three hundred
  topics would otherwise bury the one camp that matches it.
- **"Go to learner…" is a mode, not a route.** Selecting it narrows the palette to people rather
  than navigating; the field grows a chip and Backspace on an empty field steps back out, the way a
  filter bar behaves. People are fetched once per session on the first open, and only for a
  superadmin — a learner has no route that could use them and no permission to ask.
- **Recents are per user id, in `localStorage`.** This machine is shared in the office and one
  person's recent waypoints are a small leak of what they are being taught. Keyed by id rather than
  username so a rename cannot hand someone else's list to the wrong account, and every read and
  write is wrapped: private mode and storage-disabled-by-policy both return an empty list rather
  than throwing.
- **One marker, not one highlight per item.** The sidebar's active waypoint is a single
  `layoutId` bar that slides between items. `TrackNav` computes exactly one current key — deepest
  match wins, so a module does not light up its track as well — and wraps itself in a `LayoutGroup`
  whose id the caller passes, because the desktop sidebar and the mobile sheet can be mounted at
  once and two elements sharing one `layoutId` fly the marker between the two navs.
- **The sidebar's width is the one animation in the shell that is not pure transform.** There is no
  transform that makes the main column give up space. It is one element for `duration.base`, and it
  is flattened outright (`duration: 0`) under `prefers-reduced-motion` — motion's
  `reducedMotion="user"` drops transform and layout animations but would happily keep animating a
  width.
- **The admin sections are grouped.** Seven flat rows gave no clue that "Onboard learner" is
  something you do to a person while "Audit log" is something you read about the system. They are
  now Overview / People / Assessments / System, with the same sliding marker as the learner
  sidebar. The under-`md` tab strip stays flat — it is derived by flattening the groups, so it
  cannot drift.
- **Nothing was added to the assessment.** `/assessment` renders outside `AppShell` (see
  `App.tsx`), so no bell, palette or marker reaches the proctored screen. `AssessmentBanner` was
  not touched: `ready` and `in_progress` stay non-dismissible, superadmins still never see it, and
  it is still suppressed on `/plan`, which renders the same prompt itself.

### U6 — the auth screens

- **Both screens share one `AuthLayout`.** They are the same screen with a different form in it,
  and having two of them drift apart is how a sign-in page and a password page end up looking like
  they belong to different products. It is a grid: one column below `lg`, two above it. The aside
  is *dropped* on a phone rather than reflowed — at 375px the form is the entire reason the screen
  exists, and a paragraph of brand copy above it is something to scroll past.
- **One background effect, and it is the cheapest of the three considered.** Spotlight, not
  Background Beams or Background Lines: two large radial-gradient `<div>`s drifting over 22 and 26
  seconds, with no blur filter (a `closest-side` gradient is already soft; `blur-3xl` on a 36rem box
  is a real paint cost on a phone) and no SVG paths animating per frame. The house `Contours` sits
  underneath it, so the effect did not cost the trail metaphor.
- **The backdrop is `lazy()`, with `Suspense fallback={null}`.** Sign-in is the first thing anyone
  downloads on this app; decoration does not belong in that chunk. On a slow connection the form
  renders without it and gains it a moment later, which is the right order.
- **Reduced motion is checked explicitly, not left to `MotionConfig`.** The root's
  `reducedMotion="user"` would in fact drop these, because the spotlight drift and the ShineBorder
  spin are both transforms — but a later change from `x`/`rotate` to `background-position` would
  slip past it silently. `useReducedMotion()` in both components makes the intent survive the
  refactor. What remains is static: the spotlights where they start, the border beam at its resting
  angle.
- **`ShineBorder` puts the beam on a 1px hairline, not behind the card.** The outer element is
  `bg-border` with `p-px`, the conic gradient spins inside it, and the surface covers everything
  else — so the beam can never wash over the text at any angle. Light mode runs it at a higher
  opacity than dark: the same beam over a pale hairline reads as almost nothing, while on dark it is
  already the brightest thing on the card's edge.
- **Login keeps its plain password input; it did not gain the reveal toggle.** `PasswordField`'s
  toggle has the accessible name "Show password", which is a second control matching "password" on
  a form with exactly one — and `scripts/ui/screens.mjs` signs in with `getByLabel(/password/i)`,
  strictly. Playwright caught it on the first screenshot run. The toggle earns its place on the
  change-password screen, where three boxes take a dictated temporary password; on login the Caps
  Lock warning covers what it would have been used for. **If `/change-password` is ever added to
  that harness, it will need name-based selectors.**
- **Login's error path stays deliberately blind.** `/api/auth/login` answers an unknown username,
  a wrong password and a malformed body with the identical "Invalid username or password.", so the
  endpoint cannot be used to enumerate accounts. The client relays that string and adds nothing: no
  branch on the status code, no per-field border. `ApiRequestError.fields` is now **ignored** on
  login — it was being spread into field errors, which would have painted one of the two inputs red
  the moment the server ever returned a field. Change-password is already authenticated, so it
  keeps `fields`.
- **The shake is keyed on an attempt counter, not the message.** Because the message is identical
  every time by design, React reconciles two consecutive failures into one unchanged node — no
  shake, and no re-announcement of the `role="alert"`. Counting rejections gives each one its own
  element. Six keyframes, ±7px, 0.4s; under reduced motion it still fades in, it just arrives where
  it belongs.
- **Caps Lock is per field, on keydown *and* keyup.** `FocusEvent` has no `getModifierState`, so
  the warning can only appear on the first keystroke. Both events are watched because pressing the
  key itself reports the new state on `keydown` on Windows and only on `keyup` on macOS. The `<p>`
  holding it is permanently mounted and permanently `aria-live`: announcing a message that appears
  together with its own live region is unreliable, and an empty paragraph generates no line box, so
  the reserved element costs no height.
- **`lib/password-strength.ts`'s username rule was wrong and is now a transcription.** It applied
  "contains the username" from three characters up; `checkPasswordPolicy` applies it from **four**,
  with an equality check at any length. A checklist stricter than the server is not the safe
  direction to be wrong in — it withholds a tick the server would have given, and the person
  rewrites a password that was already fine. The label now follows the threshold too ("Is not your
  username" below four characters).
- **The checklist gained the reuse rule (`differentFrom`).** The route rejects
  `newPassword === currentPassword` before the policy check even runs, and the client holds both,
  so spending a round trip to learn it was pointless. It is appended as a fourth line and scored
  separately: the score still describes the password itself, but a reused one is clamped to 0,
  because "Strong" is a true statement about a password the server is about to refuse.
- **The mismatch message waits for a blur; the match tick does not.** Shown from the first
  keystroke, "the two passwords do not match" is wrong far more often than it is right, and a red
  line that only becomes correct once you finish typing teaches people to ignore it. The positive
  half appears the instant they agree, in the same shape as the rule lines above it.
- **The aside's large line is a `<p>`, not an `<h2>`.** The card's title is the page's `h1` and the
  aside precedes it in the DOM; an `h2` there would put the outline out of order to buy nothing but
  a default font.

### U10 — learner screens: pre-flight, runner, evaluating, plan, dashboard, certificate

- **The trail and the topic screen were not touched, and that was the constraint the step was
  planned around.** `src/components/trail/**` has no diff at all. `TopicPage.tsx` and
  `ModulePage.tsx` have no diff. `src/components/challenge/**` has no diff — the topic page's
  video, summary, references and challenge layout are byte-identical, and the one change that
  would have reached them (the option-card restyle) was written into
  `features/assessment/ItemRunner` only, not into `QuizRunner`, even though the two render a
  visually similar list. Two components that look alike is the price of not moving a screen that
  was already right.
- **The plan page keeps its trail *and* gains a list.** The camps-and-waypoints markup is
  unchanged and is now the "Trail" half of a view toggle; the "List" half is a flat, filterable
  table of the same rows. **Filtering exists only in the list view**: a trail with waypoints
  missing from the middle is not a trail, and the order a plan prescribes is part of what it says.
- **Plan filters are a pure module** (`pages/planFilters.ts`), so the combination that returns
  nothing is unit-tested without a DOM — this repo's vitest is Node-only. The dropdown options are
  built from the learner's own rows rather than from the curriculum, so a filter list cannot hint
  at a camp they were not assigned (§12).
- **The evaluating screen shows the server's stages and invents nothing.** `stages.ts` maps an
  `AssessmentStatus` onto the three stages of whichever pipeline it belongs to — generation
  (`generating → awaiting_approval → ready`) or evaluation (`submitted → evaluating → completed`)
  — and that is the whole source of truth. There is no percentage, no elapsed-time bar and no
  sub-step, because the learner-facing status route publishes none of those. A bar that creeps to
  90% and sits there is a lie told to make waiting feel shorter, and it is told to the person with
  the least power to check it. The admin's `GenerationLog` remains the detailed view; the learner
  gets stages, not which provider call failed.
- **The waiting screen took over the polling.** It needs `/api/assessment/:id/status` for the
  stage and the server's own message anyway, so the page's separate five-second poll of
  `/api/me/assessment` was removed: one request now does both jobs, and the page reloads the
  assessment only when the status it is holding has actually changed. A failed status check falls
  back to reloading the assessment, so a flaky poll cannot strand someone on this screen.
- **The hard-warning modal moved onto the U3 `AlertDialog`, but not onto `useConfirm`.**
  `useConfirm` always renders a cancel and resolves `false` on Escape — right for an admin action,
  wrong for a warning. The dialog now takes the shared overlay's `alertdialog` semantics, backdrop
  and focus handling plus `calm` (fade only, no spring), carries severity in a destructive border
  and icon, and **still has no dismissal path**: Radix's alert dialog refuses outside interaction
  on its own and Escape is explicitly prevented.
- **Soft-warning toasts dropped from `z-60` to `z-40`, under the hard warning's scrim.** They were
  previously above it: the less important message on top of the more important one, and still
  clickable through a modal meant to hold everything.
- **Number keys 1–6 select options, and the number is printed on the card.** Over an hour, moving
  a mouse to a 16px radio and back is most of the physical work of the test. The listener ignores
  modifier chords and anything typed into an input, textarea, select or contenteditable, so typing
  "3" into a written answer cannot silently change a selection above it. A shortcut nobody can see
  is a shortcut nobody uses, so it is on the card rather than in a footnote.
- **The timer ring's denominator is the time left when the item was first rendered.** The server
  sends an absolute `expiresAt`, not a budget, and that first tick is the budget the learner
  actually has from the moment they see the question. After a mid-question refresh the ring starts
  full again; the number inside it is the truth either way, and it is not in a live region — a
  per-second announcement would make the page unusable with a screen reader.
- **The monitoring strip is sticky now.** Someone being watched should not have to scroll up to
  confirm it, and a camera that drops out is the one thing on that page worth noticing at once.
  Solid background, no blur: nothing for the compositor to redo on every scroll while MediaPipe
  has the CPU.
- **Every pre-flight check states its own verdict.** Passed / failed / not yet, in words and with
  a distinct glyph each, never colour alone. "Continue is disabled" is not a diagnosis; "it cannot
  see your face" is. The camera step reports its four conditions separately, and the environment
  step is `role="status"` rather than `alert` because it re-evaluates on every resize.
- **Confetti is hand-rolled, lazy and fires once per unlock.** A dependency for a hundred
  rectangles under gravity would cost more to audit than to write; the module is the default
  export of its own file so nobody who has not finished a trail ever fetches it. It renders
  nothing under `prefers-reduced-motion` (guarded in the page *and* in the component), freezes
  rather than runs while the tab is hidden, ends after ~2.6s, and records the summit in
  `localStorage` keyed by track **and completion time**, so a re-issued plan finished again is a
  new event and a reload is not.
- **Canvas is not CSS.** `fillStyle` resolves no custom properties: `rgb(var(--summit))` silently
  leaves the previous fill in place, which is black on a page with no black in it. The confetti
  reads the token's channels off `documentElement` and rebuilds a literal, which also means the
  burst follows the current theme.
- **The certificate's download is the only filled button on its page**, and the only `size="lg"`
  one. It is the single thing anyone opened that page to do.
- **Animated numbers freeze while the tab is hidden.** A background rAF counter is throttled to a
  crawl by the browser and then resumes mid-way, which looks broken; holding the frame and
  carrying on from it does not. Under reduced motion the value is set outright.

### U4 — the DataTable kit and the server query layer

- **One query language, `shared/table.ts`, and both halves speak it.** `?q=&filters=<json>&sort=field:dir&page=&pageSize=`
  parses into a `TableQuery` that the browser evaluates for small tables and
  `server/src/lib/tableQuery.ts` compiles to SQL for unbounded ones. Sharing the schema is what
  stops the two drifting: a filter the client can build is one the server can run, and a filter the
  server refuses is one the client could not have built.
- **The whitelist is the security boundary; the zod schema is not.** The schema only says "`field`
  looks like an identifier and `operator` is one of fifteen known words". What decides whether a
  field exists is the per-table spec in `server/src/lib/tableSpecs.ts`, which maps a *key* from the
  request to a Drizzle *column object*. Identifiers therefore never come from the request at all —
  SQLite cannot parameterise them, so they are looked up, never passed through. Values always do,
  as bound parameters.
- **Rejected, not ignored.** An unknown field, a disallowed operator, an enum value outside the
  list, a sort on a non-sortable column: each throws a `TableQueryError` (a 400 with a stable
  `reason`). Dropping them would show the caller *more* rows than they asked for, and on
  `audit_log` and `ai_calls` "more rows than you asked for" is the whole problem. The one
  deliberate exception is pagination, which is clamped — a stale bookmark to page 40 of a list that
  has shrunk to three pages is an everyday event with a correct answer.
- **`users.password_hash`, `failed_logins`, `locked_until`, `audit_log.details` and
  `assessments.blueprint` are absent from the specs, and that is the design.** The gate defaults to
  no, so a column added to `db/schema.ts` tomorrow is unqueryable until someone writes down what
  may be done with it. `failed_logins` is excluded even though it is harmless to read: it would let
  the People table be used to probe which accounts are locked out right now.
- **`sortable: false` where sorting would scan.** Every sortable column on the four unbounded specs
  is backed by an index in `db/schema.ts`. Otherwise one click on a column header is a full scan of
  a table that only grows.
- **Every sort gets a unique tiebreak appended** (`id`, which is a ULID and therefore
  chronological). Without it, `ORDER BY status` over rows sharing a status has no defined order and
  SQLite may return the same row on two consecutive pages while another never appears at all. There
  is a test that walks every page and asserts all eight rows appear exactly once.
- **Search always ANDs with the filter set, even an OR one.** Typing into the search box must
  narrow; if `q` were OR-ed into an OR set it would widen the result, which is the opposite of what
  a search box means.
- **`LIKE` gets an explicit `ESCAPE`.** Drizzle's `like()` emits none, so `%` and `_` in a search
  term would be wildcards: searching `%` would match every row. The pattern is escaped and still
  bound, so this is correctness rather than injection — but it looks like a security bug either way.
- **The client evaluator follows SQLite wherever JavaScript would differ.** `=` on text is
  case-sensitive and `LIKE` is not, so `eq` compares exactly while `contains` lowercases both sides.
  Every comparison against NULL is false — a row with no value fails even `ne`. NULLs sort first
  ascending. All three are tested on both sides against the same fixture.
- **Client mode and server mode are one component.** `mode="client"` gets every row and filters in
  the browser (People: a few hundred rows, and facet counts are only possible with the whole set in
  hand). `mode="server"` gets one page plus a `PageMeta`. Everything else — toolbar, URL sync,
  selection, detail panel, keyboard — is identical, so a table outgrowing the browser is a prop
  change, not a rewrite.
- **Table state lives in the URL; display preferences do not.** Filters, sort, page and page size
  are shareable, survive a refresh, and make the back button walk back through filters. Column
  visibility and density are how one person likes to read a table, not part of the question being
  asked, so they sit in `localStorage` — sending someone a link should not rearrange their columns.
- **Saved views are local, and the UI says so.** A view is a working habit, not shared state;
  putting it on the server would mean a table, an endpoint, a permissions question and a migration.
  The cost is stated rather than hidden: "Saved views stay in this browser" is printed in the panel.
  Everything read back out of `localStorage` is re-validated against the shared schema and dropped
  individually if it fails, because storage survives deploys and is editable from the console.
- **Built-in views are functions of `now`, not stored queries.** "Inactive 14d+" written down as a
  timestamp is correct on the day it is written and wrong every day after.
- **CSV export prefixes any cell starting with `=`, `+`, `-`, `@`, tab or CR with an apostrophe.**
  Excel, Sheets and Numbers all evaluate those, so a display name of `=HYPERLINK(...)` — or a
  `=cmd|...` DDE payload — becomes a live formula in the recipient's spreadsheet. That is the single
  most important line in `csv.ts`. The file is also written with CRLF and a UTF-8 BOM, without which
  Excel on Windows turns every non-ASCII name into mojibake.
- **`aria-live="polite"` on the result count, and nowhere else on the table.** It is the one piece
  of feedback a screen-reader user cannot otherwise get when a filter changes. Announcing rows as
  well would bury it.
- **Rows are a roving-tabindex list**: one Tab stop for the whole body, then Up/Down, Home/End,
  Enter to open and Space to tick. One tab stop instead of three hundred.
- **Column resize handles are real buttons that answer Left and Right.** Resizing is one of the
  most common places a data grid quietly becomes mouse-only, and it costs eight lines to avoid.
- **Boolean filters are three chips, not a switch.** The filter has three states — yes, no, and
  *not filtering at all* — and a two-position control cannot express the third without a second
  control beside it to turn the first one off.
- **The calendar is hand-written.** A date-picker dependency is around 40 kB and a second theming
  system to fight, for one control in one place. What it needed was keyboard operation — a real
  `role="grid"` with roving focus, arrows across month boundaries, PageUp/PageDown, Home/End —
  which is the part picker libraries are usually pulled in to avoid writing and still get wrong.
- **The mobile filter drawer is built on Radix Dialog, not on `ui/sheet`.** `sheet` only knows left
  and right; adding a `bottom` side for one screen would put a side effect into every other sheet in
  the app.
- **The stagger is capped at 12 rows by not staggering past it.** Row-by-row on a 100-row page means
  the last row lands four seconds after the first; past the cap the body fades in as one block.
  First render only — a page change is navigation, not an entrance.
- **No `react-hooks/exhaustive-deps` suppressions.** The three places that wanted one were
  restructured instead: the client pipeline depends on `defaultSort` directly (callers pass module
  constants; an inline literal costs a recompute, which is microseconds), the selection is derived
  against live rows on every render rather than pruned by a synchronising effect, and the search
  debounce reads the current query through a ref so its dependency list is honest.
- **`@tanstack/react-table` is pinned to v8.** v9 is a different, plugin-based API. The kit uses
  TanStack for the column model, visibility, sizing and selection only — filtering, sorting and
  paging are ours, because they have to match what the SQL does.
- **`ui/popover.tsx` was overwritten mid-flight and rewritten to the registry's defaults.** U5 had
  created it minutes earlier and this step wrote over it before the collision was visible. The
  replacement keeps the full API (`Popover`/`Trigger`/`Content`/`Anchor`/`Close`) and restores
  `align="center"`, `sideOffset={4}` so an existing call site that passes neither sits where its
  author expected; the table filters pass `align="start"` explicitly. Worth a look from whoever
  owns `NotificationCentre`.
