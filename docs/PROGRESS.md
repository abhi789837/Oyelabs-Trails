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
