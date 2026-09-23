# Oyelabs Learning Platform — Project Brief & Build Instructions (v2, exhaustive)

> **v3 is in progress. The spec is `docs/TRAILS_V3_BRIEF.md`. It overrides anything in this file
> that it contradicts.** Build state and the resume point live in `docs/V3_STATE.md`.

You are building this entire project, end to end, across as many sessions as it takes. This file is your complete spec. Read it fully before writing code. This is v2 — the curriculum is now deliberately exhaustive and hard, aimed at engineers anywhere from 1 to 10 years of experience, not a beginner bootcamp. Expect this to take a long time; that's intentional.

> Resuming? Also read `docs/PROGRESS.md` (the module-by-module todo list and decisions log) and `git log`, then continue from the next unfinished item. Don't restart.

## 0. How to work through this file

- Work through the **Build Order** (Section 14) in sequence. Don't stop for permission between steps — proceed automatically, use good judgment on ambiguity, note assumptions in your final summary.
- Given the scale here (~240 topics across four tracks), commit at the **module** level, not just the phase level: after finishing each module's data (e.g. "JavaScript Core" or "Node.js Core"), run `git add -A && git commit -m "content: <module name>"`. This is your real checkpoint system — you'll be at this for a while.
- Maintain your own todo list mirroring Sections 7–10's module lists so you can track exactly which of the ~240 topics are done and resume correctly after any interruption. Re-read this file plus `git log` on resume; don't restart.
- At the end of each major phase, give me a one-paragraph status update and keep going. At the very end, give a full summary: what's built, what you assumed, which video links you couldn't verify and left as search-query fallbacks, and how to run it.

## 1. What this is

An internal training platform for Oyelabs' dev team. It is **not** a beginner bootcamp — it's meant to be exhaustive enough that a 1-year engineer and a 10-year engineer both find real depth in it, and thorough enough that working through an entire track properly takes months, not a weekend. Four tracks: **Frontend**, **Backend**, **Full-Stack**, **AI-Driven Development**. Every track is organized into **Modules** (thematic groupings, e.g. "JavaScript Core", "Node.js Core"), and every module contains many granular **Topics** (one specific concept each — the way a good course breaks "JavaScript" into 40 individual episodes rather than 3 broad chapters). Every topic gives the learner **multiple** reading references, a **real, embedded, in-app-playable** video, a technically deep summary, and a hard graded challenge (quiz or coding exercise) written at genuine interview/senior-engineer depth. Passing gates topic completion; completing every topic in a track unlocks a certificate.

## 2. Tech stack

Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion + React Router + Zustand (persisted to localStorage) + @react-pdf/renderer (certificates). No backend — everything is client-side. Video plays via YouTube's iframe embed (`https://www.youtube.com/embed/{videoId}`), which YouTube explicitly supports for third-party embedding — this is the one kind of "preview in our page" that reliably works, unlike arbitrary doc sites (see Section 11 on reference previews, which need a fallback).

## 3. Design system

Same as before — ground it in the subject: a roadmap is a trail, topics are waypoints, **modules are stages/camps along the trail**, tracks are trails, finishing a track is reaching a summit. Avoid generic AI-app defaults (cream+terracotta, near-black+neon, identical shadowed cards everywhere, ALL-CAPS eyebrows, middle-dot meta text, arrows on buttons, arbitrary 01/02/03 numbering).

**Color tokens:** `paper` `#F5F6F2` (bg light) · `ink` `#1B1F27` (text light) · `slate-900` `#12151C` (bg dark) · `slate-50` `#EDEFF3` (text dark) · `trailmark` `#D98E2B` (in-progress) · `summit` `#2F6E5B` (completed) · `basalt` `#6B7280`/`#7B8496` (locked/muted) · `ridge` `#6C5CE7` (AI-Driven track accent).

**Typography:** Headings — "Space Grotesk". Body/UI — "Inter" or "IBM Plex Sans". Code/topic IDs/status tags — "IBM Plex Mono".

**Layout:** given ~240 topics total, the roadmap can't be one flat winding path per track (Section 11 covers the module-grouped structure that replaces the old flat version). One deliberate motion moment per page, not scattered per-element fades. Dark mode via `class` strategy. Respect `prefers-reduced-motion`. Visible `trailmark` focus rings everywhere.

## 4. Data model (v2 — modules, multi-refs, video start time, expert level)

```ts
// src/types/curriculum.ts
export type ChallengeType = "code" | "quiz";
export type TopicLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type TrackId = "frontend" | "backend" | "fullstack" | "ai-driven";

export interface TopicResource {
  label: string;     // e.g. "MDN: Closures" or "javascript.info: Closure"
  url: string;
  kind: "docs" | "article" | "interview-prep" | "spec" | "repo";
}

export interface VideoResource {
  title: string;
  channel: string;
  url: string;              // full https://www.youtube.com/watch?v=... URL
  videoId: string;          // just the id, derived, used to build the embed URL
  startSeconds?: number;    // optional deep-link into a specific chapter/timestamp
  durationLabel?: string;   // e.g. "19:11" or "7:44:20", for display only
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;      // for multi-select questions use correctIndices instead
  correctIndices?: number[]; // present only for multi-select questions
  explanation: string;
  isEdgeCaseOrInterviewQuestion?: boolean; // see Section 6, difficulty standard
}

export interface CodeChallenge {
  instructions: string;
  starterCode: string;
  functionName: string;
  testCases: { args: unknown[]; expected: unknown; description: string; isEdgeCase?: boolean }[];
}

export interface Topic {
  id: string;
  moduleId: string;
  trackId: TrackId;
  title: string;
  summary: string;          // technically deep, senior-level framing — see Section 6
  level: TopicLevel;
  estMinutes: number;
  isMilestone?: boolean;
  webRefs: TopicResource[]; // 2–4 references, not 1 — see Section 5
  video: VideoResource;
  alternateVideos?: VideoResource[]; // optional extra options (e.g. multiple project walkthroughs)
  challengeType: ChallengeType;
  quiz?: QuizQuestion[];       // 8–12 questions for intermediate+, see Section 6
  codeChallenge?: CodeChallenge; // 5+ test cases including edge cases, see Section 6
}

export interface Module {
  id: string;
  trackId: TrackId;
  name: string;
  description: string;
  topics: Topic[];
}

export interface Track {
  id: TrackId;
  name: string;
  tagline: string;
  accentToken: "trailmark" | "summit" | "ridge" | "basalt";
  modules: Module[];
}
```

Progress store stays the same shape as before but keys by topic id across the whole flattened set; add a derived `getModuleCompletionPct(moduleId, topicIds)` alongside the existing track-level one, since with ~240 topics the module is now the meaningful unit of "did I finish this part."

## 5. Content sourcing & research protocol — READ CAREFULLY

You have real `WebSearch` and `WebFetch` tools. Given the scale here, you cannot and should not fabricate video URLs or reference links from memory for ~240 topics — verify everything, and where I've given you an already-verified real link below, use it exactly as given rather than re-searching.

**Ground truth I've already verified for you** (use these exactly, don't second-guess them):
- Akshay Saini's "Namaste JavaScript" Season 1 playlist is real and maps cleanly one-episode-per-concept — episode list and URLs are given verbatim in Section 7's JavaScript Core module.
- The freeCodeCamp "Front End Developer Roadmap" playlist, the freeCodeCamp "React Tutorials" playlist, and the freeCodeCamp "Practical TypeScript" video are real — URLs given verbatim in Section 7.
- freeCodeCamp has published a real "SQL Tutorial - Full Database Course for Beginners" (Mike Dane), a real MongoDB "Tutorial for Beginners - Full Course", a real Node.js + Express full course (developed by John Smilga, ~8–10 hours, covers routing/middleware/REST/MongoDB/JWT), and TechWorld with Nana has a real, free, full-length Docker course plus a joint freeCodeCamp Docker+Kubernetes course with Nelson Jamal — these exist, but I do not have their exact current watch URLs verified, so you must find and verify the exact URL yourself (see protocol below) rather than me guessing an id.

**Per-topic protocol** (for every topic that doesn't already have a verified URL given directly in Sections 7–10):
1. `WebSearch` for the specific concept + a preferred channel name (roster below). Prefer results that are the actual YouTube watch page, not an aggregator/SEO site (avoid sites that just list "top videos about X" without being YouTube itself — several of those showed up in early research and are unreliable/spammy; if a search result domain isn't `youtube.com` or a channel's own site, don't trust its claimed video ID).
2. `WebFetch` the candidate `youtube.com/watch?v=...` URL to confirm it loads and its title genuinely matches the topic.
3. Set `video.url` to the verified watch URL, extract `video.videoId` from it, and fill `durationLabel` if visible.
4. If you truly can't verify a good match after a reasonable search, fall back to `https://www.youtube.com/results?search_query=...` for that one topic and flag it in your final summary as needing a manual pick.
5. For **webRefs** (2–4 per topic, not 1): always include the official docs/spec page as one reference. Add at least one deep-dive article or the language/framework's own advanced guide as a second. Where genuinely relevant (JavaScript, React, system design, algorithms), add a **real, well-known interview-question resource** as a third reference — specifically these two repos are real and excellent, use them where topically relevant: `https://github.com/lydiahallie/javascript-questions` (JS) and `https://github.com/sudheerj/reactjs-interview-questions` (React) and `https://github.com/sudheerj/javascript-interview-questions` (JS). Verify each link resolves via `WebFetch` before using it.

**Preferred video channel roster** (in no particular order — pick whoever has the best specific video for the topic): freeCodeCamp, Akshay Saini / Namaste (JS/React), Fireship, Traversy Media, Web Dev Simplified, The Net Ninja, Academind, Codevolution, JavaScript Mastery, Kevin Powell (CSS), TechWorld with Nana (Docker/K8s/DevOps), Theo (T3/Next.js), Piyush Garg (backend/Docker/system design), Hitesh Choudhary / Chai aur Code (full-stack, backend).

**Chapter-splitting technique** (explicitly requested — use it where it helps): several long-form courses given below cover many concepts in one video. Where a topic maps to a *specific chapter inside a long video* rather than needing its own dedicated video, `WebFetch` the video's watch page (or its description) to find chapter markers/timestamps, and set `video.startSeconds` so the embed deep-links straight to that concept via `https://www.youtube.com/embed/{id}?start={seconds}`. The freeCodeCamp "Practical TypeScript" video below explicitly has "10 chapters" — use this technique on it as the worked example, then apply the same approach anywhere else a long video's description has chapter markers.

## 6. Difficulty & depth standard — apply this to every one of the ~240 topics

This is what makes the platform hard enough that a 10-year engineer still learns something, not just a 1-year engineer:

- **Topic summaries** must be written at senior-engineer depth: not "what is X" but *why X exists, what tradeoffs it makes, when you'd reach for it vs. an alternative, and a common gotcha or performance implication*. Avoid tutorial-recap tone.
- **Quizzes**: 8–12 questions for `intermediate`/`advanced`/`expert` topics (4–6 is fine only for genuinely simple `beginner` topics like "what is a Docker image"). At least 2–3 questions per quiz must be marked `isEdgeCaseOrInterviewQuestion: true` — real gotchas (e.g. "what does this closure log after the loop runs with `var` vs `let`", "what's the actual output of this async/await + Promise.all ordering question", "which of these SQL queries has an N+1 problem"). Include at least one multi-select question per quiz where genuinely more than one option is correct (`correctIndices`), not just single-select — real understanding checks, not trivia.
- **Code challenges**: minimum 5 test cases, at least 2 marked `isEdgeCase: true` (empty input, large input, malformed input, boundary conditions, error paths) — not just the happy path. Where the concept supports it, prefer challenges that mirror real interview questions (e.g. implement `debounce`, implement a `curry` function, implement a simple LRU cache, implement `Promise.all` from scratch) over toy busywork.
- **Level tagging**: use the full range. `beginner` = correct but shallow understanding is enough. `intermediate` = requires hands-on practice to internalize. `advanced` = requires understanding *why*, not just *how*. `expert` = the kind of thing that separates a senior from a mid-level engineer (e.g. JS engine internals, React reconciliation internals, database query planning, distributed systems tradeoffs, LLM context-window economics). Milestone topics should generally be `advanced` or `expert`.
- Don't pad the topic *count* with trivial filler to hit a number — pad it with genuine granularity (this is why "JavaScript" becomes 30+ topics instead of 3: each one is a real, separately-testable concept, not an arbitrary slice).

## 7. Curriculum — FRONTEND (`accentToken: "trailmark"`)

### Module: Dev Environment & Tooling (beginner–intermediate)
Module refs: VS Code docs (`https://code.visualstudio.com/docs`), Git docs (`https://git-scm.com/doc`), Vite docs (`https://vitejs.dev/guide/`).
Topics: VS Code Setup & Productivity, Git Fundamentals (commits/branches/merges/rebasing), GitHub Collaboration (PRs/forks/Actions basics), npm & Package Management, Vite as a Build Tool, Browser DevTools Mastery.
Verified videos: "Visual Studio Code Crash Course" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=WPqXP_kLzpo` (1:32:35) for VS Code Setup. "Git and GitHub for Beginners - Crash Course" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=RGOj5yH7evk` (1:08:30) for Git Fundamentals + GitHub Collaboration. "Learn Vite – Frontend Build Tool Course" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=VAeRhmpcWEQ` (1:31:02) for Vite as a Build Tool.

### Module: HTML & CSS Foundations (beginner–intermediate)
Module refs: MDN Learn (`https://developer.mozilla.org/en-US/docs/Learn`), web.dev Learn CSS (`https://web.dev/learn/css`), Kevin Powell's channel for CSS specifically.
Topics: Semantic HTML & Document Structure, Forms & Client-Side Validation, Accessibility Fundamentals (ARIA, semantic landmarks, focus order), Tables & Media Elements, The CSS Box Model, Selectors & Specificity, Flexbox Deep Dive, CSS Grid Deep Dive, Responsive Design & Media Queries, CSS Custom Properties (Variables), Transitions & Keyframe Animations, CSS Architecture (BEM vs utility-first), Bootstrap & Sass Fundamentals (as a contrast to Tailwind).
Verified videos: "HTML Tutorial - Website Crash Course for Beginners" (freeCodeCamp.org & Beau Carnes) → `https://www.youtube.com/watch?v=916GWv2Qs08` (45:20). "CSS Tutorial – Full Course for Beginners" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=OXGznpKZ_sA` (11:08:10) — long-form, use chapter-splitting per Section 5 to map its chapters onto Flexbox/Grid/etc. topics individually. "Learn Bootstrap 5 and SASS by Building a Portfolio Website" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=iJKCj8uAHz8` (14:11:43) for the Bootstrap & Sass topic.

### Module: JavaScript Core — "Namaste JavaScript" Season 1 (beginner→advanced)
Module refs: MDN JavaScript Guide (`https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide`), javascript.info, `https://github.com/lydiahallie/javascript-questions`, `https://github.com/sudheerj/javascript-interview-questions`.
This entire module maps one topic per real episode — use these exact verified URLs, channel is Akshay Saini for all of them:
- **js-execution-context** — How JavaScript Works & Execution Context — `https://www.youtube.com/watch?v=ZvbzSrg0afE` (4:54)
- **js-call-stack** — How JS Code is Executed & the Call Stack — `https://www.youtube.com/watch?v=iLWTnMzWtj4` (23:42)
- **js-hoisting** — Hoisting (variables & functions) — `https://www.youtube.com/watch?v=Fnlnw8uY6jo` (19:11)
- **js-functions-variable-env** — How Functions Work & Variable Environment — `https://www.youtube.com/watch?v=gSDncyuGw0s` (21:45)
- **js-window-this** — Shortest JS Program: `window` & `this` keyword — `https://www.youtube.com/watch?v=QCRpVw2KXf8` (8:33)
- **js-undefined-vs-not-defined** — `undefined` vs not defined — `https://www.youtube.com/watch?v=B7iF6G3EyIk` (11:01)
- **js-scope-chain** — The Scope Chain, Scope & Lexical Environment — `https://www.youtube.com/watch?v=uH-tVP8MUs8` (19:48)
- **js-let-const-tdz** — `let` & `const`, the Temporal Dead Zone — `https://www.youtube.com/watch?v=BNC6slYCj50` (21:41)
- **js-block-scope-shadowing** — Block Scope & Shadowing — `https://www.youtube.com/watch?v=lW_erSjyMeM` (19:57)
- **js-closures** — Closures (milestone, advanced) — `https://www.youtube.com/watch?v=qikxEIxsXco` (22:44)
- **js-settimeout-closures-interview** — setTimeout + Closures Interview Question — `https://www.youtube.com/watch?v=eBTBG4nda2A` (17:43)
- **js-closures-crazy-interview** — "Crazy JS Interview" ft. Closures (advanced) — `https://www.youtube.com/watch?v=t1nFAMws5FI` (32:45)
- **js-first-class-functions** — First-Class Functions ft. Anonymous Functions — `https://www.youtube.com/watch?v=SHINoHxvTso` (22:30)
- **js-callbacks-event-listeners** — Callback Functions ft. Event Listeners — `https://www.youtube.com/watch?v=btj35dh3_U8` (23:26)
- **js-event-loop** — Asynchronous JS & the Event Loop from Scratch (milestone, expert) — `https://www.youtube.com/watch?v=8zKuNo4ay8E` (41:45)
- **js-engine-v8** — JS Engine Exposed: Google's V8 Architecture (expert) — `https://www.youtube.com/watch?v=2WJL19wDH68` (28:30)
- **js-settimeout-trust-issues** — Trust Issues with `setTimeout()` (advanced) — `https://www.youtube.com/watch?v=nqsPmuicJJc` (26:11)
- **js-higher-order-functions** — Higher-Order Functions ft. Functional Programming — `https://www.youtube.com/watch?v=HkWxvB1RJq0` (24:03)
- **js-array-methods-map-filter-reduce** — `map`, `filter` & `reduce` — `https://www.youtube.com/watch?v=zdp0zrpKzIE` (37:42)

### Module: JavaScript Advanced & Interview-Level (advanced–expert)
The user-provided series stops at episode 19 above; this module covers the rest of what a senior JS engineer needs. `WebSearch` "Namaste JavaScript Season 2" first — Akshay Saini's real continuation covers Promises, async/await, and DOM in the same episodic style; use those exact episodes if you verify them, and only fall back to another creator (Web Dev Simplified / Fireship for concise explainers) per topic if you can't verify a Season 2 episode.
Module refs: MDN, javascript.info, `https://github.com/lydiahallie/javascript-questions`.
Topics: Promises Deep Dive (states, chaining, error propagation), `Promise.all` / `allSettled` / `race` / `any`, Async/Await & Try-Catch Patterns, Generators & Iterators, Currying & Partial Application, Debounce vs Throttle (implement both — strong code-challenge candidate), Prototypes & Prototypal Inheritance, `this`, `call`, `apply`, `bind` Deep Dive, ES6 Classes & OOP Patterns in JS, Modules: CommonJS vs ESM, Fetch API & AJAX Patterns, JSON Deep Dive, Event Bubbling, Capturing & Delegation, Web Storage: localStorage/sessionStorage/cookies, Error Handling & Custom Error Classes, WeakMap & WeakSet, Symbols, Regular Expressions in JS, Common JS Design Patterns (module, singleton, observer, factory), Implementing a Simple LRU Cache (advanced code-challenge topic), Implementing `Promise.all` From Scratch (expert code-challenge topic).

### Module: TypeScript (beginner→advanced)
Module refs: TypeScript Handbook (`https://www.typescriptlang.org/docs/handbook/intro.html`), TypeScript Deep Dive (`https://basarat.gitbook.io/typescript/`).
Primary video, chapter-split per Section 5's worked example: "Practical TypeScript – Course for Beginners" (freeCodeCamp.org, 275k+ views) → `https://www.youtube.com/watch?v=JHEB7RhJG1Y` (9:34:51) — description explicitly states "10 chapters in this video"; `WebFetch` it to extract the real chapter timestamps and set each topic's `video.startSeconds` accordingly rather than guessing. Alternate full video if chapters can't be extracted cleanly: "Learn TypeScript – Full Tutorial" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=30LWjhZzg50` (1:29:00).
Topics: Basic Types & Type Annotations, Interfaces vs Type Aliases, Functions & Type Inference, Union & Intersection Types, Narrowing & Type Guards, Generics Fundamentals, Generic Constraints & Defaults, Utility Types (`Partial`, `Pick`, `Omit`, `Record`, etc.), Enums & Literal Types, Classes & Access Modifiers in TS, Modules & Namespaces, Advanced: Conditional Types, Advanced: Mapped Types, Advanced: Template Literal Types, Configuring `tsconfig.json` for Strictness, Typing React Components & Hooks (advanced, ties into the React module).

### Module: Tailwind CSS (beginner–intermediate)
Module refs: Tailwind docs (`https://tailwindcss.com/docs`).
Video: "Learn Tailwind CSS – Course for Beginners" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=ft30zcMlFao` (4:12:18).
Topics: Utility-First Fundamentals, Responsive Variants, State Variants (hover/focus/group), Dark Mode Strategies, Customizing the Theme/Config, Extracting Components with `@apply` vs Composition, Tailwind Plugins.

### Module: React Fundamentals (intermediate)
Module refs: react.dev (`https://react.dev/learn`), `https://github.com/sudheerj/reactjs-interview-questions`.
Primary video: "React Fundamentals - Full Course for Beginners" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=6Ied4aZxUzc` (1:03:47). Alternate: "Learn React JS - Full Course for Beginners - Tutorial 2019" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=DLX62G4lc44` (5:05:34). Also verify the single link `https://youtu.be/eILUmCJhl64` via `WebFetch` — confirm its actual title/content before slotting it into this module or the ecosystem module below.
Topics: JSX & How React Renders, Components & Props, State with `useState`, Event Handling in React, Conditional Rendering Patterns, Lists & Keys (and why keys matter for reconciliation), Controlled vs Uncontrolled Forms, Lifting State Up, Composition vs Inheritance in React.

### Module: React Hooks & Advanced Patterns (advanced–expert)
Module refs: react.dev Hooks Reference (`https://react.dev/reference/react/hooks`), `https://github.com/sudheerj/reactjs-interview-questions`.
Primary video: "Full React Course 2020 - Learn Fundamentals, Hooks, Context API, React Router, Custom Hooks" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=4UZrsTqkcW4` (10:07:53) — chapter-split per Section 5 across this module's topics.
Topics: `useEffect` Deep Dive (dependency arrays, cleanup, common bugs), `useContext` & Avoiding Prop Drilling, `useReducer` for Complex State, `useRef` & Imperative Escape Hatches, `useMemo` & `useCallback` (and when they're actually worth it), Building Custom Hooks, `React.memo` & Render Performance, Error Boundaries, Portals, Forward Ref & Ref Forwarding Patterns, Compound Components Pattern, Render Props & HOCs (and why hooks mostly replaced them), Code Splitting with `lazy` & `Suspense`, React 18/19 Concurrent Features (`useTransition`, `useDeferredValue`), React Server Components Conceptual Model, React Reconciliation & the Virtual DOM (expert — how diffing actually works).

### Module: React Ecosystem (intermediate–advanced)
Module refs: React Router docs (`https://reactrouter.com/en/main`), Redux Toolkit docs (`https://redux.js.org/`), TanStack Query docs (`https://tanstack.com/query/latest`).
Verified videos: "Learn React 18 with Redux Toolkit – Full Tutorial for Beginners" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=2-crBg6wpp0` (4:12:18) for Redux Toolkit. "Protected Routes in React using React Router" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=Y0-qdp-XBJg` (15:40) for Protected Routes. "Testing JavaScript with Cypress – Full Course" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=u8vMu7viCm8` (2:39:33) for E2E testing. "React Testing Course for Beginners – Code and Test 3 Apps" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=8vfQ6SWBZ-U` (2:04:21) for React Testing Library.
Topics: React Router Fundamentals (routes, params, nested routes), Protected Routes & Auth Guards, Data Loaders & Actions (React Router v6.4+), Redux Toolkit: Slices, Thunks & the Store, Zustand as a Lightweight Alternative (and when to pick it over Redux), TanStack Query: Caching, Invalidation & Mutations, Form Libraries (React Hook Form vs Formik), Unit & Component Testing with Vitest + React Testing Library, End-to-End Testing with Cypress or Playwright.

### Module: React Practice Projects (milestone, advanced) — build one, choose from real project walkthroughs
These are full project builds, not single-concept videos — use them as milestone capstones where the learner builds something real end-to-end, not as atomic topics. Present several as `alternateVideos` options on a small number of milestone topics rather than one-per-topic.
- "React Tutorial: Build an e-commerce site from scratch using React and Netlify" → `https://www.youtube.com/watch?v=wPQ1-33teR4` (6:18:15)
- "React Tutorial: Weather App with RESTful APIs" → `https://www.youtube.com/watch?v=cdBvSlVCOXw` (2:43:48)
- "Build a Chat Application using React, Redux, Redux-Saga, and Web Sockets" → `https://www.youtube.com/watch?v=x_fHXt9V3zQ` (1:24:54)
- "React / Typescript Tutorial - Build a Quiz App" → `https://www.youtube.com/watch?v=F2JCjVSZlG0` (1:20:01) — a great combined React+TypeScript milestone
- "How to Build Tetris in React - GameDev Tutorial (with React Hooks!)" → `https://www.youtube.com/watch?v=ZGOaCxX8HIU` (2:34:18) — strong advanced-hooks milestone
- "Intermediate React Tutorial - Todoist Clone (with Firebase, Custom Hooks, SCSS, React Testing)" → `https://www.youtube.com/watch?v=hT3j87FMR6M` (7:38:39) — strong custom-hooks + testing milestone
- "React Beginners Tutorial - Build an Autocomplete Text Box" → `https://www.youtube.com/watch?v=NnpISZANByg` (45:09) — good for a debouncing/controlled-input practice topic
Create milestone topics: **react-capstone-ecommerce**, **react-capstone-quiz-app-ts**, **react-capstone-todoist-clone** (pick 3; note the others as `alternateVideos` choices learners can pick between).

### Module: Next.js (advanced)
Module refs: Next.js docs (`https://nextjs.org/docs`).
Video: "Next.js React Framework Course – Build and Deploy a Full Stack App From Scratch" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=KjY94sAKLlw` (4:47:37).
Topics: File-Based Routing & the App Router, Server Components vs Client Components, Data Fetching & Caching Strategies, Server Actions & Form Mutations, Route Handlers as API Endpoints, Middleware & Edge Functions, Rendering Strategies: SSR vs SSG vs ISR, Metadata & SEO in Next.js, Image & Font Optimization, Authentication with NextAuth, Deploying to Vercel.

### Module: Vue.js (intermediate) — verify video yourself
Module refs: Vue.js Guide (`https://vuejs.org/guide/introduction.html`), Pinia docs (`https://pinia.vuejs.org/`).
No verified video given — `WebSearch`/`WebFetch` for a real, current "Vue 3 Composition API full course" from freeCodeCamp, Net Ninja, or Vue Mastery and verify before use.
Topics: Reactivity Fundamentals (`ref` vs `reactive`), Template Syntax & Directives, Computed Properties & Watchers, Component Lifecycle Hooks, Props & Emits, Slots, Provide/Inject, Building Composables, Vue Router, Pinia State Management, Vue + TypeScript.

### Module: Meta-Frameworks, Mobile & Bonus (advanced)
Verified videos: "Astro Web Framework Crash Course" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=e-hTm5VmofI` (1:16:48). "React Native Course – Android and iOS App Development" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=obH0Po_RdWk` (1:27:01).
Topics: Astro & Islands Architecture, React Native Fundamentals (bridging web React knowledge to mobile), Progressive Web Apps (service workers, manifest, offline support) — verify a video yourself for this last one.

### Module: Frontend Security & Performance (advanced–expert)
Verified video: "OWASP API Security Top 10 Course – Secure Your Web Apps" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=YYe0FdfdgDU` (1:42:43) — genuinely more of a backend/API topic but directly relevant to any frontend engineer building against APIs; also referenced from the Backend track's Auth & Security module.
Topics: XSS, CSRF & Content Security Policy for Frontend Engineers, Core Web Vitals (LCP, INP, CLS) & How to Improve Them, Code Splitting & Bundle Size Analysis, Lazy Loading Images & Components, Accessibility Auditing (axe, Lighthouse) — verify videos yourself for the performance/accessibility topics.

## 8. Curriculum — BACKEND (`accentToken: "summit"`)

### Module: Web & Backend Foundations (beginner)
Module refs: roadmap.sh Backend (`https://roadmap.sh/backend`), MDN "How the web works".
Verified video: "How does the internet work? (Full Course)" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=zN8YNNHcaZc` (1:27:01).
Topics: How the Internet Works (DNS, TCP/IP, routing), HTTP Methods, Status Codes & Headers, The Client-Server Model, REST vs RPC vs GraphQL at a Glance.

### Module: Node.js Core (intermediate–advanced)
Module refs: Node.js docs (`https://nodejs.org/en/docs`).
Video: verify a real, current "Node.js and Express.js - Full Course" (freeCodeCamp.org, developed by John Smilga, ~8–10 hours) via `WebSearch` + `WebFetch` — this course is confirmed to exist (covers Node fundamentals → Express → REST API → MERN project) but you need the exact current watch URL; chapter-split it across this module and the Express module below using its (very detailed) chapter list.
Topics: The Node.js Runtime & libuv, CommonJS vs ES Modules in Node, The `fs`, `path` & `os` Modules, npm, `package.json` & Semantic Versioning, The Node Event Loop (Node-specific, distinct from the browser event loop — link back to `js-event-loop`), Streams & Buffers, Building a Basic HTTP Server (no framework), Event Emitters, Child Processes & Worker Threads, Debugging Node with `--inspect`.

### Module: Express.js (intermediate)
Module refs: Express docs (`https://expressjs.com/en/guide/routing.html`).
Video: same source as Node.js Core module above (chapter-split).
Topics: Routing Fundamentals, Middleware & the Request-Response Cycle, `app.use` & Middleware Ordering, Route Params vs Query Strings, HTTP Methods in Practice (GET/POST/PUT/PATCH/DELETE), Centralized Error-Handling Middleware, Serving Static Files & Templating, File Uploads with Multer, Building a Full CRUD REST API (milestone).

### Module: SQL & Relational Databases (intermediate–advanced)
Module refs: PostgreSQL docs (`https://www.postgresql.org/docs/`), "Use The Index, Luke" (`https://use-the-index-luke.com/`) for query performance.
Video: verify a real, current "SQL Tutorial - Full Database Course for Beginners" by Mike Dane (freeCodeCamp.org, ~4.5 hours, confirmed to exist with tens of millions of views) via `WebSearch` + `WebFetch`.
Topics: Relational Modeling & Normalization (1NF/2NF/3NF), Writing SELECT Queries & Filtering, Joins (inner/left/right/full) Deep Dive, Aggregation & `GROUP BY`/`HAVING`, Subqueries & CTEs, Indexes & Query Performance (expert — reading an `EXPLAIN` plan), Transactions & ACID Guarantees, PostgreSQL-Specific Features, ORMs in Practice (Prisma vs TypeORM vs Sequelize), The N+1 Query Problem (advanced code-challenge candidate).

### Module: NoSQL & Caching (intermediate)
Module refs: MongoDB docs (`https://www.mongodb.com/docs/`), Redis docs (`https://redis.io/docs/`).
Video: verify a real, current "MongoDB Tutorial for Beginners - Full Course" (freeCodeCamp.org, confirmed to exist) via `WebSearch` + `WebFetch`.
Topics: Document Modeling in MongoDB, Mongoose Schemas & Validation, The Aggregation Pipeline, When to Use NoSQL vs SQL (a real architectural decision, not a trivia question), Redis for Caching & Session Storage, Cache Invalidation Strategies (expert — "there are only two hard things in computer science").

### Module: Authentication & Security (advanced–expert)
Module refs: OWASP Top Ten (`https://owasp.org/www-project-top-ten/`).
Verified video: "OWASP API Security Top 10 Course – Secure Your Web Apps" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=YYe0FdfdgDU` (1:42:43).
Topics: Password Hashing with bcrypt/argon2, Sessions vs JWTs (real tradeoffs, not just "JWT is modern"), OAuth2 & OpenID Connect Flows, Refresh Token Rotation, Role-Based & Attribute-Based Access Control, CORS Deep Dive, Rate Limiting & Brute-Force Protection, The OWASP API Security Top 10 In Depth (milestone).

### Module: API Design (intermediate–advanced)
Module refs: roadmap.sh API Design (`https://roadmap.sh/api-design`), GraphQL docs (`https://graphql.org/learn/`).
Verified video: "GraphQL Course for Beginners" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=5199E50O7SI` (4:47:37).
Topics: REST Resource Design & Versioning, Pagination, Filtering & Sorting Patterns, Idempotency & Safe Methods, GraphQL Schemas, Queries & Mutations, GraphQL Resolvers & the N+1 Problem (DataLoader), API Documentation with OpenAPI/Swagger, Webhooks & Event-Driven APIs, REST vs GraphQL: a Real Architectural Decision.

### Module: NestJS (advanced) — verify video yourself
Module refs: NestJS docs (`https://docs.nestjs.com/`).
`WebSearch`/`WebFetch` for a real, current, full-length NestJS course (freeCodeCamp or Academind both plausibly have one) and verify before use.
Topics: Modules & the Dependency Injection Container, Controllers & Routing Decorators, Providers & `@Injectable`, DTOs & Validation Pipes, Guards (Auth), Interceptors (Logging/Transform), Custom Exception Filters, NestJS + TypeORM/Prisma Integration, Microservices with NestJS (expert).

### Module: Python Backend (intermediate–advanced) — verify videos yourself
Module refs: FastAPI docs (`https://fastapi.tiangolo.com/`), Django docs (`https://docs.djangoproject.com/`), Django REST Framework docs.
`WebSearch`/`WebFetch` for real, current full courses on FastAPI and Django (freeCodeCamp has published both at various points) and verify exact URLs.
Topics: Python Essentials for Backend Engineers, FastAPI Basics & Pydantic Validation, FastAPI Dependency Injection & Async Routes, Django Models & the ORM, Django Views & Templates, Django REST Framework for APIs, Background Jobs with Celery & Redis, FastAPI vs Django: When to Use Which (a real architectural framing, not trivia).

### Module: Docker & Containers (intermediate–advanced)
Module refs: Docker docs (`https://docs.docker.com/get-started/`).
Verify the exact current URL for TechWorld with Nana's real, free, full-length Docker course, and/or the freeCodeCamp Docker+Kubernetes course (developed jointly by Nelson Jamal of Amigoscode and Nana Janashia of TechWorld with Nana) via `WebSearch`/`WebFetch` — both are confirmed to exist.
Topics: What Problem Containers Solve, Images vs Containers, Writing Dockerfiles, Multi-Stage Builds (advanced — smaller production images), Docker Compose for Multi-Container Apps, Volumes & Networking, Docker in CI/CD Pipelines, Intro to Kubernetes (Pods, Services, Deployments) — milestone.

### Module: System Design Fundamentals (advanced–expert) — verify videos yourself
Module refs: roadmap.sh System Design (`https://roadmap.sh/system-design`).
`WebSearch`/`WebFetch` for a real, current system design course/playlist (Gaurav Sen and freeCodeCamp both plausibly have relevant free content) and verify.
Topics: Vertical vs Horizontal Scaling, Load Balancing Strategies, Caching Strategies at Scale, Database Replication & Sharding, Message Queues & Async Processing, CDNs & Edge Caching, Designing a Rate Limiter (milestone, expert), Designing a URL Shortener (classic interview exercise, expert).

### Module: Backend Testing & Ops (intermediate)
Topics: Unit Testing Node/Express with Jest or Vitest, Integration Testing REST APIs, CI/CD with GitHub Actions, Logging & Monitoring Fundamentals (structured logs, basic observability) — verify videos yourself for all of these.

## 9. Curriculum — FULL-STACK (`accentToken: "ridge"`)

### Module: MERN End-to-End (advanced)
Module refs: MongoDB's own MERN guide (`https://www.mongodb.com/mern-stack`).
Verified real courses to verify-and-use exact URLs for: "Full Stack Web Development for Beginners (Full Course on HTML, CSS, JavaScript, Node.js, MongoDB)" (freeCodeCamp.org, confirmed to exist) and a real "Learn the MERN Stack" exercise-tracker course (freeCodeCamp.org, confirmed to exist, ~2 hours, teaches MongoDB Atlas hosting).
Topics: MERN Architecture Overview (how the four pieces actually talk to each other), Connecting a React Frontend to an Express API, MongoDB + Mongoose in a Full App, JWT Auth End-to-End (frontend token storage + backend verification), Deploying a MERN App (frontend + backend + DB hosting) — milestone.

### Module: Next.js Full-Stack (advanced–expert)
Module refs: Next.js data fetching docs (`https://nextjs.org/docs/app/building-your-application/data-fetching`).
Verified video: same as the Frontend track's Next.js module — `https://www.youtube.com/watch?v=KjY94sAKLlw` ("Build and Deploy a Full Stack App From Scratch").
Topics: Server Actions as the Full-Stack Glue, Route Handlers as a Backend Within Next.js, Prisma + Next.js Integration, NextAuth for Full-Stack Auth, Monolithic Deployment on Vercel (no separate backend to host) — milestone.

### Module: The T3 Stack & End-to-End Type Safety (advanced–expert) — verify video yourself
Module refs: create.t3.gg (`https://create.t3.gg/`).
`WebSearch`/`WebFetch` for a real T3 stack tutorial (Theo, the T3 creator, is the obvious source) and verify.
Topics: tRPC Fundamentals (why no code-gen is needed), Prisma Schema & Migrations, Achieving End-to-End Type Safety (DB → API → UI, no manual typing), When T3 Is (and Isn't) the Right Choice.

### Module: GraphQL Full-Stack (advanced)
Verified video: same GraphQL course as the Backend track — `https://www.youtube.com/watch?v=5199E50O7SI`.
Topics: Schema-First API Design, Apollo Server + Apollo Client Integration, GraphQL vs REST in a Real Full-Stack App (a real decision with real tradeoffs, revisited from the full-stack integration angle).

### Module: Full-Stack Capstone & Deployment (expert)
Topics: Environment Config & Secrets Management, CI/CD for a Full-Stack App, Monitoring a Live Full-Stack App, Scaling Considerations as Traffic Grows, **Capstone: Ship a Deployed, Authenticated, Full-Stack App** (milestone — ties together auth + DB + API + UI end to end; this is the hardest single topic in the whole platform, treat its assessment accordingly per Section 6).

## 10. Curriculum — AI-DRIVEN DEVELOPMENT (`accentToken: "ridge"`)

### Module: The AI Coding Tools Landscape (beginner–intermediate)
Module refs: roadmap.sh Vibe Coding (`https://roadmap.sh/ai/vibe-coding`).
Topics: Accelerator Tools vs Delegator Tools (Cursor/Copilot vs Claude Code), GitHub Copilot Fundamentals, Cursor's Workflow & Composer Mode, Claude Code's Agentic Workflow, AI App Builders (Lovable/Bolt/v0) & When They Fit — verify videos yourself for all of these.

### Module: Prompt Engineering (beginner–advanced)
Module refs: Microsoft Learn Prompt Engineering (`https://learn.microsoft.com/en-us/training/modules/introduction-prompt-engineering-with-github-copilot/`).
Verified video: "Prompt Engineering Tutorial – Master ChatGPT and LLM Responses" (freeCodeCamp.org) → `https://www.youtube.com/watch?v=_ZvnD73m40o` (41:36).
Topics: Zero-Shot vs Few-Shot Prompting, Chain-of-Thought Prompting, Role & Persona Prompting, Scoped/Constrained Prompts for Coding Tasks, Debugging a Bad Prompt (milestone — the actual skill that matters most in practice).

### Module: Context Engineering & AI Pair Programming (intermediate–advanced) — verify videos yourself
Module refs: roadmap.sh Vibe Coding Best Practices.
Topics: Context Files (`CLAUDE.md`, `.cursor/rules/`, `AGENTS.md`), Resetting Context Between Features, Reviewing AI-Generated Code Critically, Building Reusable Prompts/Skills, Common AI Pair-Programming Anti-Patterns (over-trusting output, context rot, scope creep).

### Module: LLM Fundamentals (intermediate–advanced)
Module refs: Anthropic docs (`https://docs.claude.com/`).
Topics: Tokens & Context Windows (and the economics of both), Structured Output & Function/Tool Calling, Temperature & Sampling Parameters, Comparing Model Families at a High Level, Calling an LLM API Directly (Anthropic/OpenAI) — verify videos yourself.

### Module: Retrieval-Augmented Generation (advanced–expert) — verify videos yourself
Module refs: roadmap.sh AI Engineer (`https://roadmap.sh/ai-engineer`).
Topics: Embeddings & Vector Similarity, Vector Databases in Practice, Chunking Strategies (and why naive chunking fails), Retrieval & Reranking, Building a Full RAG Pipeline (milestone, expert).

### Module: AI Agents (advanced–expert) — verify videos yourself
Module refs: roadmap.sh AI Agents (`https://roadmap.sh/ai-agents`).
Topics: Tool Calling Fundamentals, The ReAct Pattern, Multi-Agent Orchestration, The Model Context Protocol (MCP), Evaluating & Sandboxing Agent Behavior (milestone, expert).

## 11. Architecture (v2 — module-grouped roadmap, embedded video, reference previews)

**Routes:** `/` Dashboard · `/track/:trackId` Track Roadmap (now grouped by module) · `/track/:trackId/module/:moduleId` Module view (list of that module's waypoints, since a full track is too large for one screen) · `/track/:trackId/module/:moduleId/topic/:topicId` Topic Detail · `/report/:trackId` Certificate · catch-all 404.

**Track Roadmap page:** each module renders as a "camp" — a labeled stopping point along the trail — showing the module name, its own completion %, and how many topics it contains, rather than every single topic's waypoint rendering directly on the top-level trail (240 dots on one path would be unusable). Clicking a module camp navigates to its Module view, which *does* render that module's topics as the winding-path waypoint UI from the original design (Section 3's visual language), scoped to a manageable ~5–19 topics.

**Topic Detail page — references:** render `webRefs` (2–4 per topic) as a list of reference cards, each showing the resource's `kind` (docs/article/interview-prep/spec/repo) as a small icon-coded tag, not a generic identical card. For the "preview in our page" requirement: attempt to render each reference in an inline `<iframe>` preview by default, but **many documentation sites (MDN, react.dev, etc.) send `X-Frame-Options`/CSP headers that block iframe embedding by design** — you cannot make those load in an iframe, and shipping a silently-blank iframe would be worse than not trying. So: attempt the iframe, set a short load timeout, and if it doesn't fire a load event in time (or an error occurs), fall back automatically to a rich link-preview card (title, source domain, and an "Open in new tab" button) instead of leaving a blank box. Be upfront with me in your build summary about which reference sites you found do/don't allow embedding once you've tested a few.

**Topic Detail page — video:** render the video **inline and playable in the app** via a `<iframe src="https://www.youtube.com/embed/{videoId}?start={startSeconds ?? 0}" allow="autoplay; encrypted-media" allowfullscreen>` — this is the one embed type that reliably works, since YouTube's embed player is built for exactly this. If `alternateVideos` exist (the React practice-projects module), show a small selector (tabs or a dropdown) above the player to switch between them.

Everything else from the original spec (progress store shape, quiz/code challenge engine, certificate generation, dark mode, responsiveness, `prefers-reduced-motion`) carries over unchanged from the earlier design — see Sections 4, and the Challenge/Certificate sections below.

## 12. Challenge engine

Unchanged mechanically from the original design (quiz: single/multi-select, client-graded, 80% to pass, per-question explanations shown after submit; code: sandboxed inline Web Worker running the named function against test cases with deep-equal comparison and a timeout) — but every quiz and code challenge must now meet the **Difficulty & Depth Standard in Section 6**: 8–12 questions with edge-case/interview questions and at least one multi-select for non-beginner topics; 5+ test cases with 2+ edge cases for code challenges. Support `correctIndices` (multi-select) in the grading logic alongside the existing `correctIndex` (single-select).

## 13. Certificate & completion system

Same mechanics as before (on-screen certificate + PDF via @react-pdf/renderer once `isTrackComplete`, name input persisted locally, deterministic certificate ID hash, track accent color as seal color, honest note about no server-side verification since there's no backend) — plus, given the new module structure, add a lightweight **module-complete** moment: a small toast/badge when a learner finishes every topic in a module (not a full certificate, just positive reinforcement for finishing one of many camps along a long trail).

## 14. Build order

Given the scale, treat this as phases where Phase 2 (content) is itself broken into module-sized sub-steps — don't try to do all ~240 topics' research in one uninterrupted burst without committing progress.

1. **Scaffold** — Vite/React/TS/Tailwind/shadcn/Framer Motion/Router/Zustand/@react-pdf/renderer, design tokens from Section 3, minimal styled placeholder.
2. **Data layer, module by module** — build `src/types/curriculum.ts` (Section 4) once, then work through Sections 7–10 **one module at a time**, researching/verifying references and videos per Section 5's protocol as you go, writing real quiz/code content per Section 6's standard for every topic in that module, and committing after each module. This is the bulk of the work — there's no shortcut, and that's intentional.
3. **App shell & routing** — the four-level route structure from Section 11, sidebar with track+module progress, one page-transition animation.
4. **Progress store** — topic-level as before, plus `getModuleCompletionPct`.
5. **Dashboard** — track-level overview cards as before.
6. **Track Roadmap (module camps)** — per Section 11's new grouped structure.
7. **Module view (waypoint path)** — the original per-topic trail-map visual, scoped to one module's topics.
8. **Topic Detail** — reference cards with iframe-attempt+fallback, embedded YouTube player (with alternate-video selector where relevant).
9. **Challenge engine** — per Section 12, difficulty-checked against Section 6.
10. **Certificate page** — track certificate + module-complete toasts.
11. **Polish pass** — responsive at 375/768/1440px, dark mode everywhere, empty/edge states, keyboard accessibility, `prefers-reduced-motion`, copy pass.
12. **Deploy prep** — clean `npm run build`, `vercel.json` SPA rewrite if needed, README covering the module-based content structure and how to add a new module/topic, then the exact Vercel deploy steps.

## 15. Managing the dev server / preview during the session

Same as before: run the dev server in the background, verify with `curl` for a `200`, run `npm run build`/`tsc --noEmit` after each module or phase to catch type errors immediately, restart the dev server after any Tailwind/Vite config change, and tell me at natural checkpoints (end of Phase 2, end of Phase 8, end of Phase 11) that it's ready for me to check in the browser — then keep going rather than waiting, unless genuinely blocked.

## 16. Definition of done

- All four tracks render as module-grouped trail maps; every module opens into its own waypoint path of topics.
- Every one of the ~240 topics has 2–4 verified web references (with honest iframe-preview-or-fallback behavior) and one real, verified, in-app-playable YouTube video.
- Every topic's challenge meets the Section 6 difficulty standard — no trivial quizzes, no single-happy-path code challenges.
- Progress persists across reload; module-complete toasts and track certificates both work.
- Dark mode, responsive layout, keyboard access, and reduced-motion all work.
- `npm run build` is clean, and you've told me the exact Vercel deploy steps plus a final list of anything you flagged as "verify this link yourself" along the way.
