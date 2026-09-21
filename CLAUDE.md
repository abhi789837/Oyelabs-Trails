# Oyelabs Learning Platform — Project Brief & Build Instructions

You are building this entire project, end to end, in this session. This file is your complete spec: mission, design system, data model, content-sourcing instructions, architecture, and build order. Read it fully before writing any code.

## 0. How to work through this file

- Work through the **Build Order** (Section 9) top to bottom, in one continuous session. Don't stop to ask permission between phases — proceed automatically unless you hit something genuinely ambiguous (missing credential, destructive action, conflicting requirement), in which case make the most reasonable assumption, note it in your final summary, and keep going.
- Maintain your own todo list (mirroring Section 9's phases) so you always know what's next and don't lose the thread across a long session.
- After each phase in Section 9: run the dev server (see Section 10), sanity-check it didn't break, and `git add -A && git commit -m "phase N: <name>"` before moving to the next phase. Commit early and often — this is your checkpoint system across a long session.
- If you get interrupted or the session restarts, re-read this file and your git log to see how far you got, then resume from the next uncommitted phase. Don't restart from scratch.
- At the very end, give me one summary: what you built, what you assumed, what's left as a manual step (e.g. picking specific videos, deploying), and how to run it.

## 1. What this is

An internal training platform for Oyelabs' dev team (a software agency). It teaches four tracks — **Frontend**, **Backend**, **Full-Stack**, and **AI-Driven Development** — as a roadmap of topics. Every topic gives the learner a real web reference, a real YouTube video reference, a short summary, and a graded practice challenge (quiz or coding exercise). Passing the challenge marks the topic complete. Completing every topic in a track unlocks a downloadable completion certificate.

## 2. Tech stack

Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion + React Router + Zustand (state, persisted to localStorage) + @react-pdf/renderer (certificates). No backend in this version — everything runs client-side. Section 9's final phase notes what to add later if Oyelabs wants shared team progress and server-verified certificates.

## 3. Design system — read this before writing any UI

Ground the visual identity in the actual subject matter: a **roadmap is a trail**. Topics are waypoints, tracks are trails, finishing a track is reaching a summit. Do NOT default to generic AI-app patterns: no cream background with a terracotta accent, no near-black background with a single neon accent, no identical rounded cards all sharing the same soft grey shadow, no ALL-CAPS eyebrow labels, no middle-dot-separated meta text, no arrows appended to button labels, no numbered 01/02/03 markers unless the content is genuinely a sequence.

**Color tokens** (define as CSS variables for light and dark mode, wire into `tailwind.config` as semantic names):
- `paper` (bg, light): `#F5F6F2` — cool off-white, not cream.
- `ink` (text, light): `#1B1F27` — deep slate-navy, not flat black.
- `slate-900` (bg, dark): `#12151C`
- `slate-50` (text, dark): `#EDEFF3`
- `trailmark` (primary/"in progress" accent): `#D98E2B` — warm amber/gold.
- `summit` (success/"completed" accent): `#2F6E5B` — deep pine green.
- `basalt` (muted/"locked" accent, borders): `#6B7280` light / `#7B8496` dark.
- `ridge` (used only for the AI-Driven track, to visually distinguish it): `#6C5CE7`.

**Typography:** Headings — "Space Grotesk" (technical, engineered character). Body/UI — "Inter" or "IBM Plex Sans" (pick one, stay consistent). Code, topic IDs, status tags — "IBM Plex Mono" (grounded in the subject: this is a coding platform, not decoration). Type scale roughly 12/14/16/18/24/32/48px, intentional line-height, body prose under ~75 characters per line.

**Layout:** The roadmap view (Section 9, Phase 6) is a winding trail with waypoint markers, not a grid of identical cards. Motion is used exactly once per page as a single deliberate moment (e.g. the path drawing itself on load), not scattered fade-ins on every element. Dark mode via Tailwind's `class` strategy. Respect `prefers-reduced-motion` everywhere. Visible keyboard focus rings in `trailmark`.

## 4. Data model

```ts
// src/types/curriculum.ts
export type ChallengeType = "code" | "quiz";
export type TopicLevel = "beginner" | "intermediate" | "advanced";
export type TrackId = "frontend" | "backend" | "fullstack" | "ai-driven";

export interface TopicResource {
  label: string;
  url: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CodeChallenge {
  instructions: string;
  starterCode: string;
  functionName: string;
  testCases: { args: unknown[]; expected: unknown; description: string }[];
}

export interface Topic {
  id: string;
  trackId: TrackId;
  title: string;
  summary: string;
  level: TopicLevel;
  estMinutes: number;
  isMilestone?: boolean;
  webRef: TopicResource;
  videoRef: TopicResource;
  challengeType: ChallengeType;
  quiz?: QuizQuestion[];
  codeChallenge?: CodeChallenge;
}

export interface Track {
  id: TrackId;
  name: string;
  tagline: string;
  accentToken: "trailmark" | "summit" | "ridge" | "basalt";
  topics: Topic[];
}
```

```ts
// src/store/progressStore.ts shape
type TopicProgress = {
  status: "not-started" | "in-progress" | "completed";
  bestScore?: number;
  completedAt?: string;
  attempts: number;
};
interface ProgressState {
  progress: Record<string, TopicProgress>;
  markInProgress: (topicId: string) => void;
  recordAttempt: (topicId: string, passed: boolean, score?: number) => void;
  resetTopic: (topicId: string) => void;
  getTrackCompletionPct: (topicIds: string[]) => number;
  isTrackComplete: (topicIds: string[]) => boolean;
}
```
Passing threshold for quizzes is 80%. Code challenges pass only if every test case passes (score = passed/total * 100 either way, for partial-credit display).

## 5. Content sourcing — YOU MUST DO REAL RESEARCH, DON'T INVENT LINKS

This is important: you have real `WebSearch` and `WebFetch` tools. Use them. Do not fabricate specific YouTube video URLs from memory — invented video IDs are almost always wrong or dead.

For **every topic** in Section 6's seed list:
1. Use `WebFetch` to confirm the given `webRef.url` is real and still resolves (all of them are official docs/roadmap.sh pages and should be stable, but verify). If a link is dead, `WebSearch` for the current official doc page on that exact subject and use that instead.
2. Use `WebSearch` to find one real, current, well-regarded YouTube tutorial on that exact topic. Prefer these channels, in no particular order: freeCodeCamp, Fireship, Traversy Media, Web Dev Simplified, The Net Ninja, Academind, Codevolution, JavaScript Mastery, Kevin Powell (CSS specifically), TechWorld with Nana (Docker/DevOps specifically). Prefer videos with substantial view counts and recent-enough content that it's not deprecated (e.g. not teaching class components as the primary way to write React in 2026).
3. Set `videoRef.url` to the **actual YouTube watch URL** you found (`https://www.youtube.com/watch?v=...`), not a search-results page — you can actually verify these, so do it properly. If you genuinely cannot find or verify a good match for some topic after a reasonable search, fall back to a YouTube search-query URL (`https://www.youtube.com/results?search_query=...`) for that one topic only, and note it in your final summary as something to manually pick later.
4. While you're on the official doc page for `webRef.url`, skim it and use it to sanity-check or tighten the topic's `summary` field so it reflects current, accurate terminology (e.g. confirm Next.js still calls it "App Router," confirm current React hook names) — small edits only, don't rewrite the curriculum structure.

Do this research inline as you build Section 6's data files in Phase 2 — don't defer it, and don't ship placeholder/search-only links for topics where a real one was findable.

## 6. Curriculum seed content

Build four files, `src/data/tracks/{frontend,backend,fullstack,ai-driven}.ts`, each exporting a `Track`. Populate with the topics below (research and fill in real `videoRef` URLs per Section 5; the `webRef` URLs given are real official sources — verify, don't replace unless dead). Write real `QuizQuestion[]` (4 options, one correct, one-sentence explanation each) or a real `CodeChallenge` (working starter code, 3 sensible test cases) for every topic — none should ship empty.

**FRONTEND** (`accentToken: "trailmark"`):
1. `html-css-foundations` — HTML & CSS Foundations — semantic markup, box model, Flexbox, Grid, responsive design — beginner, ~90min — webRef: MDN, `https://developer.mozilla.org/en-US/docs/Learn` — quiz (5 Q on semantic HTML, flexbox vs grid, responsive units).
2. `js-fundamentals` — JavaScript Fundamentals — variables, scope, control flow, functions, arrays/objects, DOM & events — beginner, ~120min — webRef: MDN JS Guide, `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide` — code (filter an array of objects by a property, 3 tests).
3. `js-advanced` — Closures, Async & the Event Loop — beginner→intermediate — ~120min — webRef: MDN Closures, `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures` — code (memoization via closures, 3 tests) — **milestone**.
4. `typescript-essentials` — TypeScript Essentials — types, interfaces, generics, narrowing, utility types — intermediate, ~90min — webRef: `https://www.typescriptlang.org/docs/handbook/intro.html` — quiz (5 Q).
5. `tailwind-css` — Tailwind CSS — utility-first workflow, variants, theming — beginner, ~60min — webRef: `https://tailwindcss.com/docs` — quiz (4 Q).
6. `react-fundamentals` — React Fundamentals — components, JSX, props, state, events, lists/keys — intermediate, ~120min — webRef: `https://react.dev/learn` — code (transform props into derived state shape, 3 tests).
7. `react-hooks` — React Hooks in Depth — useState/useEffect/useContext/useReducer/useMemo/useCallback/custom hooks — intermediate, ~120min — webRef: `https://react.dev/reference/react/hooks` — code (custom hook reducer logic as pure function, 3 tests) — **milestone**.
8. `react-router-state` — Routing & State Management — React Router, Context, Zustand vs Redux Toolkit — intermediate, ~90min — webRef: `https://reactrouter.com/en/main` — quiz (5 Q).
9. `nextjs-app-router` — Next.js & the App Router — file-based routing, Server vs Client Components, rendering strategies — advanced, ~150min — webRef: `https://nextjs.org/docs` — quiz (6 Q).
10. `vuejs-essentials` — Vue.js Essentials — reactivity, Composition API, Pinia — intermediate, ~120min — webRef: `https://vuejs.org/guide/introduction.html` — quiz (5 Q).
11. `frontend-testing` — Frontend Testing — Vitest, React Testing Library, Playwright basics — advanced, ~90min — webRef: `https://testing-library.com/docs/` — code (simple assertion-helper pure function, 3 tests) — **milestone**.

**BACKEND** (`accentToken: "summit"`):
1. `backend-foundations` — Backend Foundations — HTTP, client-server model — beginner, ~60min — webRef: `https://roadmap.sh/backend` — quiz (4 Q on HTTP methods/status codes).
2. `node-express` — Node.js & Express — event loop, middleware, routing, REST basics — intermediate, ~120min — webRef: `https://expressjs.com/en/guide/routing.html` — code (validate a request body shape, 3 tests).
3. `nestjs-architecture` — NestJS Architecture — modules, controllers, providers, DI, guards — advanced, ~120min — webRef: `https://docs.nestjs.com/` — quiz (6 Q) — **milestone**.
4. `python-apis` — Python APIs: FastAPI & Django — endpoints, Pydantic validation, ORMs — intermediate, ~120min — webRef: `https://fastapi.tiangolo.com/` — quiz (5 Q on FastAPI vs Django).
5. `databases` — Databases: SQL & NoSQL — relational modeling, indexes, Postgres, MongoDB, Redis — intermediate, ~120min — webRef: `https://www.postgresql.org/docs/` — quiz (6 Q).
6. `api-design` — API Design: REST & GraphQL — resource design, versioning, pagination — intermediate, ~90min — webRef: `https://roadmap.sh/api-design` — quiz (5 Q).
7. `auth-security` — Authentication & Security — sessions vs JWT, OAuth2, hashing, OWASP — advanced, ~90min — webRef: `https://owasp.org/www-project-top-ten/` — quiz (6 Q) — **milestone**.
8. `docker-devops` — Docker & DevOps Basics — images/containers, Dockerfiles, Compose, CI/CD intro — intermediate, ~120min — webRef: `https://docs.docker.com/get-started/` — quiz (6 Q).

**FULL-STACK** (`accentToken: "ridge"`):
1. `mern-stack` — The MERN Stack — advanced, ~150min — webRef: `https://www.mongodb.com/mern-stack` — quiz (6 Q).
2. `nextjs-fullstack` — Next.js Full-Stack — Server Actions, API routes, Prisma, NextAuth — advanced, ~150min — webRef: `https://nextjs.org/docs/app/building-your-application/data-fetching` — quiz (6 Q) — **milestone**.
3. `t3-stack` — The T3 Stack — end-to-end type safety, tRPC, Prisma — advanced, ~90min — webRef: `https://create.t3.gg/` — quiz (5 Q).
4. `fullstack-capstone` — Capstone: Deploy an End-to-End App — advanced, ~180min — webRef: `https://roadmap.sh/full-stack` — quiz (8 Q covering the full request lifecycle) — **milestone**.

**AI-DRIVEN DEVELOPMENT** (`accentToken: "ridge"`):
1. `ai-coding-tools` — The AI Coding Tools Landscape — Copilot, Cursor, Claude Code, AI app builders — beginner, ~60min — webRef: `https://roadmap.sh/ai/vibe-coding` — quiz (4 Q).
2. `prompt-engineering` — Prompt Engineering for Developers — zero/few-shot, chain-of-thought, scoped prompts — beginner, ~60min — webRef: `https://learn.microsoft.com/en-us/training/modules/introduction-prompt-engineering-with-github-copilot/` — quiz (5 Q) — **milestone**.
3. `context-engineering` — Context Engineering & AI Pair Programming — context files, scoped prompts, reviewing AI output — intermediate, ~90min — webRef: `https://roadmap.sh/ai/vibe-coding` — quiz (5 Q).
4. `llm-fundamentals` — LLM Fundamentals — tokens, context windows, structured output, function calling — intermediate, ~90min — webRef: `https://docs.claude.com/` — quiz (6 Q).
5. `rag-basics` — Retrieval-Augmented Generation — embeddings, vector DBs, chunking, retrieval — advanced, ~120min — webRef: `https://roadmap.sh/ai-engineer` — quiz (6 Q) — **milestone**.
6. `ai-agents` — AI Agents — tool calling, ReAct, orchestration, MCP — advanced, ~120min — webRef: `https://roadmap.sh/ai-agents` — quiz (6 Q) — **milestone**.

Also create `src/data/tracks/index.ts` exporting `allTracks: Track[]` and `getTopicById(id: string)`.

## 7. Architecture

**Routes** (React Router): `/` Dashboard · `/track/:trackId` Track Roadmap · `/track/:trackId/topic/:topicId` Topic Detail · `/report/:trackId` Certificate · catch-all 404.

**App shell:** collapsible left sidebar (Sheet on mobile) listing all four tracks with a live progress bar per track in its accent color; top bar with app name and dark/light toggle (persisted); one cross-fade transition between routes via Framer Motion `AnimatePresence` (~150ms) — no per-element fade-ins.

**Dashboard (`/`):** hero with app name, one-line pitch, and an aggregate stats strip (total topics, total completed, overall progress). Below it, one section per track showing name/tagline/topic count/time estimate/progress bar/Continue-or-Start button/preview of next 3-4 incomplete topics. Differentiate tracks by accent color and real content, not by repeating one identical card shape four times.

**Track Roadmap (`/track/:trackId`):** the signature view. Topics render as a winding vertical SVG path down the page, alternating waypoints left/right, styled as a topo trail. Waypoint states: not-started = outlined `basalt` circle; in-progress = filled `trailmark` circle with a subtle pulse; completed = filled `summit` circle with a checkmark; milestone topics get a larger marker regardless of status. Path draws itself once on load (stroke-dashoffset animation, ~800ms). Clicking a waypoint navigates to the topic; hovering shows title/level/time in a tooltip. Header shows track completion % and a "View Certificate" button, disabled until complete. Degrade gracefully to a straighter line on mobile — no horizontal scroll.

**Topic Detail:** breadcrumb, title, level badge, time estimate. Side-by-side "Read" (webRef) and "Watch" (videoRef) reference cards with distinct icons, visually lighter-weight than the challenge section. Summary text. The `ChallengeRunner` (Section 8). Status badge (not-started/in-progress/completed-with-date-and-score). Prev/Next topic navigation. Mark the topic `in-progress` on mount if it was `not-started`.

## 8. Challenge engine

One `ChallengeRunner` component switching on `challengeType`:

- **Quiz:** single-select radio questions, grade client-side (correct/total * 100), 80% to pass. Show per-question correct/incorrect + explanation after submit. Pass → `recordAttempt(id, true, score)` + restrained success state (single checkmark scale-in, no confetti). Fail → `recordAttempt(id, false, score)` + encouraging retry state.
- **Code:** a styled `<textarea>` (monospace, line-number gutter, editor-dark background even in light mode) is sufficient — don't pull in Monaco unless asked. "Run Tests" extracts the named function and runs it inside a sandboxed inline Web Worker (Blob URL) against each test case with deep-equal comparison, a 3-second timeout, and per-case pass/fail + actual-vs-expected on failure. All tests pass → 100%, complete. Some fail → partial score shown, same retry state as quiz. Note in a code comment that this sandboxing is appropriate for an internal trusted-team tool, not for executing untrusted public input.

Both paths share the same success/fail visual language and both write through `recordAttempt`.

## 9. Build order (work through these phases in one session)

1. **Scaffold** — Vite + React + TS, Tailwind, shadcn/ui (New York, neutral base), framer-motion, react-router-dom, zustand, lucide-react, @react-pdf/renderer, `@/` path alias. Apply Section 3's design tokens and fonts. Clear boilerplate; render a minimal styled placeholder to confirm tokens work.
2. **Data layer** — Section 4's types, Section 6's four track files with real researched content per Section 5, `index.ts`.
3. **App shell & routing** — Section 7's routes, sidebar, top bar, page transition, placeholder pages for each route.
4. **Progress store** — Section 4's Zustand store with persist middleware; wire real completion % into the sidebar.
5. **Dashboard** — real implementation per Section 7.
6. **Track Roadmap** — the trail-map view per Section 7, fully responsive.
7. **Topic Detail** — real implementation per Section 7 (challenge section can stub "coming next" until Phase 8).
8. **Challenge engine** — Section 8, wired into Topic Detail; verify at least one quiz topic and one code topic end-to-end.
9. **Certificate page** — `/report/:trackId`: honest in-progress state if incomplete; on-screen certificate + PDF download (name input persisted to localStorage, deterministic certificate ID hash, track accent color as seal color) once complete. Small-print note that there's no server-side verification yet (no backend).
10. **Polish pass** — responsive at 375/768/1440px, dark mode on every page, empty/edge-case states, keyboard accessibility + focus rings, `prefers-reduced-motion`, copy pass (buttons say exactly what they do, empty states say what to do next).
11. **Deploy prep** — confirm `npm run build` is clean, add `vercel.json` SPA rewrite if needed, write a README (what this is, stack, how to run, how to add new topics, how the challenge/progress/certificate system works), then actually tell me the exact steps to deploy to Vercel from this folder.

## 10. Managing the dev server / preview during the session

You're running in a terminal without a browser, so verify progress without relying on visually seeing the page:
- Start the dev server in the background (`npm run dev &` or equivalent) and confirm it's up with `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173` (expect `200`).
- After each phase, run `npm run build` (or `tsc --noEmit`) to catch type errors immediately rather than letting them accumulate.
- Use `curl` against each route path to at least confirm the server responds; for real visual/interaction verification, tell me at natural checkpoints (after Phase 6's roadmap view, after Phase 8's challenge engine, and at the end) that it's ready for me to check in the browser myself, and keep going with the next phase rather than waiting for my reply unless you're genuinely blocked.
- Kill and restart the dev server if you change Tailwind/Vite config; a stale dev server is a common source of confusing "it's not working" moments.

## 11. Definition of done

- All four tracks render as trail-map roadmaps with real, verified web + video references on every topic.
- Every topic has a working graded challenge (quiz or code) that updates progress on pass/fail.
- Progress persists across a page reload (localStorage).
- Completing every topic in a track unlocks an on-screen certificate and a downloadable PDF.
- Dark mode, mobile layout, keyboard access, and reduced-motion all work.
- `npm run build` is clean and you've told me the exact Vercel deploy steps.
