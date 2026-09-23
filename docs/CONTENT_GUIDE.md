# Content Authoring Guide (v2)

How to write a curriculum module for Oyelearn. The audience is Oyelabs engineers with
**1 to 10 years** of experience: every topic must teach a 10-year engineer something, not just
recap a tutorial. Read CLAUDE.md Sections 4–6 and the section for your module (Sections 7–10)
alongside this guide.

## 1. Files you write

| File | What |
| --- | --- |
| `src/content/<trackId>/<moduleId>.ts` | The module: `export default { ... } satisfies Module;` |
| `content-tests/solutions/<topicId>.js` | A reference solution for every **code** topic (see §7) |
| `docs/research-notes/<moduleId>.md` | Research notes (see §9) |

**If several camps are being written in parallel**, the scratchpad directory is *shared* between
them. Namespace every scratch file you create with your module id (`scratch/<moduleId>/part1.ts`,
not `part1.ts`) — two agents picking the same obvious filename has already caused one silent
overwrite mid-run. Your two output files are yours alone; the scratchpad is not.

Module ids, names and track ids come from `src/content/registry.ts`. Don't edit the registry,
app code, or other modules' files. Don't commit (the orchestrator commits per module).

Template:

```ts
import type { Module } from "@/types/curriculum";

export default {
  id: "fe-js-core",
  trackId: "frontend",
  name: "JavaScript Core",
  description: "One or two sentences on what this camp covers and who it's for.",
  refs: [
    { label: "MDN: JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", kind: "docs" },
  ],
  topics: [
    /* Topic objects, in the order learners should take them */
  ],
} satisfies Module;
```

Use `satisfies Module` (not a type annotation) so literal types stay checked. Keep the file
formatted like the exemplars below (2-space indent, double quotes, trailing commas).

## 2. Topic ids

- kebab-case, **unique across the whole curriculum**, stable forever (they're URL slugs and
  progress keys). Start them with your module's `idPrefix` from the registry, e.g. `ts-generics-constraints`.
- Where CLAUDE.md gives an id (e.g. `js-closures`, `react-capstone-ecommerce`), use it exactly.
- Quiz question ids: `<topicId>-q1`, `<topicId>-q2`, …

## 3. Videos — research protocol

Never invent or recall a video id from memory. Use the helper, which reads YouTube's own pages:

```bash
node scripts/research/yt.mjs search "react useEffect cleanup web dev simplified" --max 10
node scripts/research/yt.mjs info <videoId> --chapters
```

`search` prints `id  duration  views  age  channel | title`. `info` confirms the video exists
**and allows embedding** (`"embeddable": true`, from oEmbed), and gives the exact title, channel,
`durationLabel` and, with `--chapters`, chapter timestamps.

Rules:

1. If CLAUDE.md gives a verified URL for the topic, use it exactly (still run `info` to fill
   `title`, `channel` and `durationLabel` accurately).
2. Otherwise search with the concept plus a preferred channel (freeCodeCamp, Akshay Saini,
   Fireship, Traversy Media, Web Dev Simplified, The Net Ninja, Academind, Codevolution,
   JavaScript Mastery, Kevin Powell, TechWorld with Nana, Theo, Piyush Garg, Hitesh Choudhary /
   Chai aur Code, ByteByteGo, IBM Technology, Anthropic). Prefer a video that is **specifically about
   the topic**, not stale (check age and versions), and with real views. Then run `info` and confirm
   `embeddable: true` and that the title genuinely matches.
3. **Chapter-splitting:** when a long course covers the topic in one chapter, use that course with
   `startSeconds` (from `info --chapters`) and `chapterLabel` (the chapter title), instead of hunting
   for a weaker standalone video. Different topics may share one course at different `startSeconds`.
4. Prefer a dedicated, focused video over a 10-hour course with no chapters. Don't reuse the exact
   same video + start time for two topics in a module unless nothing better exists (note it).
5. `alternateVideos` is optional: use it for project walkthroughs (React Practice Projects) or when
   there's a clearly valuable second option (e.g. a short explainer plus a deep dive).
6. If nothing good and embeddable exists after a real search, use a fallback and flag it in your notes:
   `{ title: "Search: <query>", channel: "YouTube search", url: "https://www.youtube.com/results?search_query=<encoded>", videoId: "" }`.

Shape:

```ts
video: {
  title: "Closures in JS 🔥 | Namaste JavaScript Episode 10", // exact title from `info`
  channel: "Akshay Saini",
  url: "https://www.youtube.com/watch?v=qikxEIxsXco",  // no &t= or other params
  videoId: "qikxEIxsXco",
  durationLabel: "22:44",
  // startSeconds: 5343, chapterLabel: "Chapter 7: Flexbox",   // only for chapter-split topics
},
```

## 4. Web references (`webRefs`: 2–4 per topic)

- **First:** the official docs or spec page for this exact concept (deep link, not a homepage),
  `kind: "docs"` or `"spec"`.
- **Second:** a genuinely deep article or advanced guide (`"article"`): javascript.info, web.dev,
  Josh Comeau, Kent C. Dodds, Overreacted, the framework's own blog, Use The Index Luke,
  Martin Fowler, the relevant RFC, Postgres wiki, etc.
- **Third, where relevant:** an interview-prep resource (`"interview-prep"`), specifically
  `https://github.com/lydiahallie/javascript-questions`, `https://github.com/sudheerj/javascript-interview-questions`,
  `https://github.com/sudheerj/reactjs-interview-questions`, or a deep link into one of them. Use `"repo"`
  for other source repositories (e.g. a reference implementation).
- Verify every URL: `node scripts/research/check-urls.mjs <url> [url...]` prints status and final URL.
  Use the **final URL** after redirects. Never ship a 404 or a generic landing page.
- Labels read "Source: Page title", e.g. `"MDN: Closures"`, `"javascript.info: Variable scope, closure"`.
- Whether a site allows iframe previews doesn't affect your choice (the app handles fallback), but the
  checker output tells you, and you should mention notable ones in your notes.

### Hosts the URL checker cannot verify

`scripts/research/check-urls.mjs` catches three failure shapes beyond a plain 404: `unverifiable`
(the host answers *every* path identically, so only a browser can confirm the page exists),
`metaRefreshTo` (a 200 stub that only a browser follows), and a redirect loop caused by sending a
browser User-Agent without cookies (retried automatically without one).

Some hosts still cannot be checked, and these are settled — don't spend time re-testing them:

| Host | Behaviour | What to do |
| --- | --- | --- |
| `www.cloudflare.com/learning/…` | **403 to any scripted client**, with or without a User-Agent | Use `blog.cloudflare.com`, which is 200 and frameable |
| `www.w3.org` | 403 to the checker and to curl, fine in a browser | Cite the spec elsewhere, or use a secondary source |
| `freedesktop.org` | **418** to scripted clients | Use man7.org's systemd mirror |
| `docs.nestjs.com`, `angular.dev`, `developer.hashicorp.com` | SPA: 200 for every path | Verify against the project's repo or sitemap, then ship |

**Embeddability is per video, not per channel.** Most PowerCert videos frame fine but
`s_Ntt6eTn94` does not; **every** Vandad Nahavandipoor video returns oEmbed 401. Always run
`yt.mjs info` on the exact id.

## 5. Summaries (senior-level framing)

120–300 words, 2–4 short paragraphs separated by a blank line (`\n\n`). Cover:

1. **Why it exists** / the problem it solves (not a dictionary definition).
2. **Tradeoffs** and **when you'd reach for it vs. an alternative**.
3. **A gotcha or performance implication** that catches experienced people.

No tutorial tone ("In this lesson we'll…"), no filler. State versions only when you verified
them (§10).

**The supported Markdown subset** (`src/components/content/RichText.tsx`, tested in
`richText.test.ts`) is: blank-line-separated paragraphs, `- ` / `* ` bullet lists, `1. ` numbered
lists, `` `inline code` ``, `**bold**`, `*emphasis*`, and fenced ```lang code blocks (highlighted
for the JS family). Anything else renders literally -- there are no links, headings or tables.
Emphasis follows CommonMark's spacing rule, so a literal asterisk with a space after it
(`SELECT * FROM`) is safe.

## 6. Quizzes

- **Size:** 8–12 questions for `intermediate`/`advanced`/`expert`; 4–6 is acceptable only for a
  genuinely simple `beginner` topic.
- **Edge cases / interview questions:** at least 2–3 per quiz marked `isEdgeCaseOrInterviewQuestion: true`:
  real gotchas ("what does this log", "which query has an N+1", "which ordering is printed").
- **Multi-select:** every non-beginner quiz has at least one question with two or more correct options:
  set `correctIndices: [..]`, set `correctIndex` to the first of them, and end the prompt with
  "(Select all that apply.)". Multi-select is graded all-or-nothing.
- **Formatting:** prompts support `inline code`, fenced code blocks and "- " bullet lists; options and
  explanations support `inline code`. Fenced blocks look like this inside a TS string:

  ```ts
  prompt: "What does this log?\n\n```js\nfor (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}\n```",
  ```

  Or use a template literal for multi-line prompts (escape backticks inside it as \\`).
- **Options:** 4 is typical (3–6 allowed). Make distractors plausible (the misconceptions people
  actually have), similar in length and tone to the correct answer, and never "all/none of the above".
  Options are shuffled at runtime, so don't refer to positions ("A and C").
- **Explanations:** 1–2 sentences on why the answer is right **and** why the tempting wrong answer is
  wrong.
- **Accuracy beats cleverness.** If you're not sure a behaviour is true for current versions, verify it
  in the docs or pick a different question. Code in questions must be runnable as written.

## 7. Code challenges

Use code challenges where writing code is the real test (implement `debounce`, `curry`, an LRU cache,
`Promise.all`, a reducer, a validator, a pagination helper, a DataLoader-style batcher…). Everything
else is a quiz. JavaScript only (it runs in a browser Web Worker).

- `functionName` is what the tests call as `functionName(...args)`; `starterCode` must declare it.
- `args` and `expected` must be plain data (JSON-like: no functions, Dates, Maps, class instances).
  Results are compared with deep equality (key order doesn't matter; `undefined` properties do).
- **5+ test cases, at least 2 with `isEdgeCase: true`** (empty input, huge input, malformed input,
  boundaries, error paths). Each has a short `description`.
- Need callbacks, timers or classes? Put a small **driver function** in the starter code, marked
  `// ---- Test driver (leave as is) ----`, and name the driver as `functionName`. The driver builds
  the scenario, calls the learner's function and returns plain data.
- **No real time.** Timer-based challenges (debounce, throttle, retry with backoff, rate limiters) use an
  injected fake clock in the driver, like the exemplar below. Async challenges may use real promises
  but must finish in well under a second (the in-app limit is 3 s for all tests).
- The whole run is deterministic: no `Math.random`, `Date.now` or network.
- **Reference solution:** `content-tests/solutions/<topicId>.js` contains the complete starter code with
  the learner's part solved (driver included). `npm run content:check` runs it against every test and
  also checks that the untouched starter fails at least one test.
- `instructions` use the Markdown subset (paragraphs, "- " bullets, `inline code`). State the exact
  contract: inputs, output shape, error behaviour, edge cases.

## 8. Levels, time, milestones

- `beginner`: correct but shallow understanding is enough. `intermediate`: needs hands-on practice.
  `advanced`: needs understanding *why*. `expert`: separates senior from mid-level (engine internals,
  reconciliation, query planning, distributed tradeoffs, LLM context economics).
- `estMinutes`: realistic total: the watchable part of the video (the chapter, for chapter-split
  topics), the reading, and the challenge. Round to 5 minutes.
- `isMilestone: true` for the module's capstone-worthy topics (usually 1–3 per module, generally
  `advanced`/`expert`), plus any the brief names.

## 9. Research notes (`docs/research-notes/<moduleId>.md`)

Short and factual:

```md
# <Module name> research notes (YYYY-MM-DD)

## Videos
- <topicId>: <title> (<channel>, <duration>[, from <chapter> at <start>]); why this one
- FALLBACK <topicId>: <why nothing suitable was found>

## References
- Notable redirects, dead links replaced, sites that block iframe previews (X-Frame-Options / CSP)

## Facts verified
- Version-sensitive facts used in quizzes and where they were checked
```

## 10. Current-facts sheet (verified around September 2026)

Use these instead of older assumptions, and verify anything you rely on that isn't here.

- **React 19.3** (Sep 2026). Hooks include `useActionState`, `useOptimistic`, `useEffectEvent` (stable);
  `use` is an API, not a Hook. React Compiler reduces manual `useMemo`/`useCallback`. Create React App is
  sunset (Feb 2025); new apps use a framework or Vite.
- **React Router v8** (Jun 2026, needs React 19.2.7+): declarative / data / framework modes;
  `react-router-dom` is gone in v8 (import from `react-router`). v7 content is still broadly valid.
- **Next.js 16** (docs 16.3): App Router; Cache Components (`cacheComponents: true`, `"use cache"`,
  `cacheLife`, `cacheTag`), Partial Prerendering by default with Cache Components; `middleware.ts` renamed
  **Proxy** (`proxy.ts`); `params`/`searchParams` are Promises; `fetch` isn't cached by default;
  "Server Functions" (`"use server"`) are called Server Actions when used for mutations; Route Handlers.
  Auth.js (NextAuth) is now part of Better Auth; `next-auth` v5 is still beta.
- **TypeScript 7.0** (Jul 2026) is the native Go compiler. TS 6.0 changed defaults: `strict: true`,
  `module: esnext`, `target: es2025`; deprecated `baseUrl`, `moduleResolution: node10`, `target: es5`.
- **Tailwind CSS v4.3**: CSS-first config (`@import "tailwindcss"`, `@theme`), `@tailwindcss/vite`,
  automatic content detection, `@custom-variant dark (...)` for class-based dark mode, renamed
  utilities (`shadow-sm`→`shadow-xs`, `rounded-sm`→`rounded-xs`, `outline-none`→`outline-hidden`).
- **Vite 8** (Rolldown-based). **Vitest 5**. **Playwright ~1.63**. React Testing Library 16.
- **Vue 3.5** (3.6 in RC). **Pinia 4** (ESM-only; store API unchanged).
- **Node.js 24** is Active LTS; Node 26 is Current (LTS from Oct 2026).
- **Express 5** is `latest` (5.2.x): rejected promises in handlers go to the error handler; path-to-regexp
  v8 (named wildcards `/*splat`, `{}` for optional segments); `app.del`, `req.param()`, `res.sendfile()` removed.
- **NestJS 12** (Aug 2026): official packages are ESM; Node 20.19+/22.12+; Express default, Fastify optional.
- **FastAPI** needs Pydantic v2 (v1 support dropped Dec 2025) and Python 3.10+; official SQL tutorial uses
  SQLModel. **Django 6.1** (Python 3.12+).
- **PostgreSQL 18** (Sep 2025): async I/O, B-tree skip scan, `uuidv7()`, virtual generated columns by
  default, OLD/NEW in RETURNING, OAuth auth; md5 auth deprecated. PG 19 in beta.
- **MongoDB 8.x**. **Redis 8.x** (tri-licensed incl. AGPLv3 since 8.0; Valkey is the BSD fork).
- **OWASP Top 10:2025** (Nov 2025): A01 Broken Access Control (now includes SSRF), A02 Security
  Misconfiguration, A03 Software Supply Chain Failures, A04 Cryptographic Failures, A05 Injection,
  A06 Insecure Design, A07 Authentication Failures, A08 Software or Data Integrity Failures,
  A09 Security Logging and Alerting Failures, A10 Mishandling of Exceptional Conditions.
  OWASP password storage: Argon2id first, then scrypt, bcrypt for legacy (72-byte limit).
- **Docker**: use `docker compose` (v2+); `docker-compose` v1 is legacy; `compose.yaml`; the top-level
  `version:` key is obsolete.
- **OpenAPI 3.2** (Sep 2025). **GraphQL spec**: September 2025 edition (OneOf input objects).
- **Claude**: current models Claude Opus 5, Sonnet 5, Haiku 4.5 (and Fable 5.1); docs at
  `https://platform.claude.com/docs`. Structured outputs are GA (`output_config.format`), strict tool use.
  **MCP** spec 2026-07-28 describes the protocol as stateless and deprecates sampling/logging client
  primitives. Avoid hard-coding model names in quiz answers.
- **roadmap.sh**: `/ai/vibe-coding` is a 404; the page is `https://roadmap.sh/vibe-coding`.
- The old Next.js URL `/docs/app/building-your-application/data-fetching` redirects to
  `/docs/app/getting-started/fetching-data`. `docs.claude.com` redirects to `platform.claude.com/docs`.
- `https://reactrouter.com/en/main` ends in a 404; use `https://reactrouter.com/home` or a deep page.

## 10b. Current-facts sheet for the v3 tracks (verified 2026-09-23)

Checked against each project's own release endpoint, not from memory. The command used is given
where it is not obvious, so any of these can be re-checked in one line.

### PHP & Laravel

- **PHP 8.5** is the current stable release; **8.4** is in active support until 31 Dec 2026;
  **8.3 and 8.2** are in security-only maintenance (8.2 until 31 Dec 2026); **8.1 and earlier are
  end of life.** Write for 8.4/8.5 and say so when a feature is newer than 8.3.
  `curl -s "https://www.php.net/releases/index.php?json"` lists the current patch per branch --
  **do not quote a patch number in content**: php.net's feed and php.watch disagree by a patch at
  any given moment, and the number is stale within weeks either way.
- PHP 8.4 brought property hooks, asymmetric visibility, `new` in initialisers without parentheses,
  and lazy objects. PHP 8.3 brought typed class constants, `json_validate()`, and `#[\Override]`.
  PHP 8.1's enums, readonly properties, fibers and `never` are now baseline, not "new".
- **Laravel 13** is current: released 17 Mar 2026, requires **PHP 8.3-8.5**, bug fixes to Q3 2027
  and security fixes to 17 Mar 2028. Laravel 12 (PHP 8.2-8.5) is still supported; **Laravel 11 went
  end of life on 12 Mar 2026.** Docs live at `https://laravel.com/docs/13.x/…`, which redirects to
  `https://laravel.com/framework/docs/13.x/…` -- use the final URL in `webRefs`.
  Laravel 13 headline additions: the first-party **AI SDK**, **JSON:API resources**,
  `PreventRequestForgery` (replacing `VerifyCsrfToken` in the `web` group), queue routing via
  `Queue::route(...)`, expanded attributes (`#[Middleware]`, `#[Authorize]`, `#[Tries]`,
  `#[Backoff]`, `#[Timeout]`), `Cache::touch(...)`, and vector search via `whereVectorSimilarTo`.
  Since Laravel 11 there is no `app/Http/Kernel.php`: middleware, routing and exception handling
  are configured in `bootstrap/app.php` through `->withMiddleware()`, `->withRouting()` and
  `->withExceptions()`. Content that shows a Kernel file is out of date.
  Note the redirect: `laravel.com/docs/…` resolves to `laravel.com/framework/docs/…`, and
  `check-urls.mjs` reports the final URL — use that one.
  `curl -s https://repo.packagist.org/p2/laravel/framework.json` lists every released version.
- **Laravel 13's docs lead with PHP attributes for Eloquent configuration**, not the old
  properties: `#[Fillable]`, `#[Guarded]`, `#[Unguarded]`, `#[Hidden]`, `#[Visible]`,
  `#[Appends]`, `#[Scope]`, `#[ScopedBy]`, `#[ObservedBy]`, `#[CollectedBy]`, `#[UseFactory]`.
  `$fillable` and `scopeFoo()` still work, but content that shows only them reads as dated.
  Also new in 13: migration `->instant()` / `->lock(...)`, the `AsVector` cast alongside
  `whereVectorSimilarTo`, pivot `…OrFail` variants, and `getPrevious()`.
- Laravel's first-party testing framework in current docs is **Pest**, with PHPUnit still
  supported. Starter kits replaced Breeze/Jetstream as the scaffolding story. Sanctum is for API
  tokens and SPA auth; Passport is for full OAuth2.
- **WordPress**: block themes and `theme.json` are the current path; classic themes still work and
  are still common in client work, so cover both and say which is which.

### Mobile

- **React Native 0.87** with the New Architecture (Fabric + TurboModules) as the default; the old
  bridge is gone. **Expo SDK 57**. Expo Router is the file-based navigation story, and EAS Build /
  EAS Submit is the managed release path.
- **Dart 3.13**, **Flutter 3.47** (`curl -s https://storage.googleapis.com/flutter_infra_release/releases/releases_linux.json`
  and read `current_release.stable`). Sound null safety and records/patterns are baseline. Impeller
  is the default renderer on both platforms.
- **Kotlin 2.4** (K2 compiler is the only compiler now). Jetpack Compose is the recommended Android
  UI toolkit; Views are legacy but still ubiquitous in existing apps.
- **Swift 6.4** with strict concurrency checking. SwiftUI is the recommended UI framework; UIKit
  interop still matters for anything that predates it. Observation (`@Observable`) replaced
  `ObservableObject` for new code.

### Frontend additions

- **Angular 22**. Standalone components are the default (NgModules are legacy), signals are the
  recommended reactivity primitive, and the new control-flow syntax (`@if`, `@for`, `@switch`)
  replaces `*ngIf` / `*ngFor` in current docs.
- **Svelte 5** (5.57) with runes: `$state`, `$derived`, `$effect`, `$props`. The Svelte 4
  `export let` / `$:` style is legacy and reads very differently, so be explicit about which
  version a snippet is for. **SvelteKit 2.70**.

### DevOps & Cloud

- **Kubernetes 1.37** (`curl -s https://dl.k8s.io/release/stable.txt`). Dockershim is long gone;
  containerd is the runtime. Gateway API is the successor to Ingress for new work, though Ingress
  is still what most clusters run.
- **Terraform 1.16**. Note the licence change at 1.6 (BUSL) and **OpenTofu** as the MPL fork —
  worth one honest sentence, because it affects what a team can adopt.
- **AWS**: IAM Identity Center replaced IAM users for human access; IMDSv2 is required on new
  instances; `gp3` is the default EBS type. Say "as of this writing" for anything pricing-related
  rather than quoting numbers.
- **Caddy 2** and **nginx 1.29** for the reverse-proxy camp. Caddy's automatic HTTPS is the
  headline difference and is worth teaching directly.

**Re-check before writing.** These were true on 2026-09-23. A quiz answer that depends on a version
is a quiz answer that goes stale, so prefer questions about mechanisms over questions about
version-specific syntax, and where a version genuinely matters, say which one in the prompt.

## 11. Validate before you finish

```bash
npm run content:check -- --module <moduleId>     # standards + reference solutions
npm run content:types                             # TypeScript check of all content files
```

Both must pass with zero errors. Fix every error; warnings are acceptable only for flagged fallbacks.

## 12. Exemplar: a quiz topic (the quality bar)

```ts
{
  id: "js-closures",
  moduleId: "fe-js-core",
  trackId: "frontend",
  title: "Closures",
  summary:
    "A closure is a function bundled with references to the variables of the scope it was created in, so it can keep reading and writing them after that outer function has returned. JavaScript creates one every time a function is created; what matters is what it captures and for how long.\n\nClosures are how JavaScript does encapsulation without classes (the module pattern, private counters), how callbacks remember context, and how `once`, `memoize`, `debounce` and React Hooks work. The price is retention: anything a closure can reach stays alive as long as the closure does, so a long-lived listener or cache that closes over a large object keeps it in memory. V8 only context-allocates variables that some closure references, but all closures created in one scope share a single context object, so a variable captured by one closure can be kept alive by another.\n\nThe classic gotcha is that closures capture bindings, not values: callbacks created in a `for (var i …)` loop all see the final `i`, while `let` creates a fresh binding per iteration.",
  level: "advanced",
  estMinutes: 55,
  isMilestone: true,
  webRefs: [
    { label: "MDN: Closures", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures", kind: "docs" },
    { label: "javascript.info: Variable scope, closure", url: "https://javascript.info/closure", kind: "article" },
    { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
  ],
  video: {
    title: "Closures in JS 🔥 | Namaste JavaScript Episode 10",
    channel: "Akshay Saini",
    url: "https://www.youtube.com/watch?v=qikxEIxsXco",
    videoId: "qikxEIxsXco",
    durationLabel: "22:44",
  },
  challengeType: "quiz",
  quiz: [
    {
      id: "js-closures-q1",
      prompt: "What does this log?\n\n```js\nfor (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}\n```",
      options: ["`0 1 2`", "`3 3 3`", "`undefined` three times", "`2 2 2`"],
      correctIndex: 1,
      explanation:
        "`var` is function-scoped, so all three callbacks close over one shared `i`, and they only run after the loop has finished and left it at 3. It isn't `2 2 2` because the loop increments once more before the condition fails.",
      isEdgeCaseOrInterviewQuestion: true,
    },
    {
      id: "js-closures-q2",
      prompt: "The same loop is written with `let i` instead of `var i`. What does it log now?",
      options: ["`0 1 2`", "`3 3 3`", "`0 0 0`", "It throws a ReferenceError"],
      correctIndex: 0,
      explanation:
        "A `for` loop with `let` creates a fresh binding for each iteration (initialised from the previous one), so each callback closes over its own `i`.",
      isEdgeCaseOrInterviewQuestion: true,
    },
    {
      id: "js-closures-q3",
      prompt:
        "Which statements are true after this runs? (Select all that apply.)\n\n```js\nfunction makeCounter() {\n  let count = 0;\n  return { inc: () => ++count, get: () => count };\n}\nconst a = makeCounter();\nconst b = makeCounter();\na.inc(); a.inc(); b.inc();\n```",
      options: [
        "`a.get()` returns `2`",
        "`b.get()` returns `1`",
        "`a.inc` and `a.get` share the same `count`",
        "`a` and `b` share the same `count`",
        "`count` is garbage-collected as soon as `makeCounter` returns",
      ],
      correctIndex: 0,
      correctIndices: [0, 1, 2],
      explanation:
        "Each call to `makeCounter` creates a new scope, shared by the two functions returned from that call. It stays alive because those functions reference it, so `a` and `b` each have their own `count`.",
    },
    {
      id: "js-closures-q4",
      prompt:
        "What does this log?\n\n```js\nlet x = 10;\nfunction logX() {\n  console.log(x);\n}\nfunction run() {\n  let x = 20;\n  logX();\n}\nrun();\n```",
      options: ["`10`", "`20`", "`undefined`", "It throws a ReferenceError"],
      correctIndex: 0,
      explanation:
        "Scope is lexical: `logX` resolves `x` where it was defined (the outer scope), not where it's called. Dynamic scoping, which would print 20, isn't how JavaScript works.",
      isEdgeCaseOrInterviewQuestion: true,
    },
    {
      id: "js-closures-q5",
      prompt:
        "A click handler created inside `init()` references a 50 MB `cache` object declared in `init`. The handler stays attached for the page's lifetime. What happens to `cache`?",
      options: [
        "It stays in memory as long as the handler is reachable",
        "It's garbage-collected when `init` returns",
        "It's copied into the handler, doubling memory use",
        "It's freed after the handler first runs",
      ],
      correctIndex: 0,
      explanation:
        "The closure holds a reference to `init`'s scope, so `cache` is reachable until the listener is removed. Nothing is copied; the handler shares the original binding.",
    },
    {
      id: "js-closures-q6",
      prompt:
        "In V8, can `big` stay in memory while `keep` is referenced, even though `keep` never mentions it?\n\n```js\nfunction setup() {\n  const big = new Array(1e6).fill(\"x\");\n  const small = 1;\n  const useBig = () => big.length;\n  return () => small;\n}\nconst keep = setup();\n```",
      options: [
        "Yes: closures created in one scope share a context object, and `big` is in it because `useBig` references it",
        "No: each closure only retains the variables it references itself",
        "No: `big` is collected because `useBig` is never returned",
        "Only in strict mode",
      ],
      correctIndex: 0,
      explanation:
        "V8 context-allocates any variable referenced by some inner function, and every closure from that scope points at the same context. `keep` keeps the context alive, and with it `big`: a classic, hard-to-spot leak.",
      isEdgeCaseOrInterviewQuestion: true,
    },
    {
      id: "js-closures-q7",
      prompt: "Which of these uses a closure to make state genuinely private?",
      options: [
        "An IIFE that declares variables and returns functions that use them",
        "An object literal whose private properties are prefixed with `_`",
        "Storing the values on `window` under an obscure name",
        "A function that returns a plain object copy of its local variables",
      ],
      correctIndex: 0,
      explanation:
        "Only the returned functions can reach the IIFE's variables. An underscore is a naming convention anyone can read, and returning a copy doesn't keep live state at all.",
    },
    {
      id: "js-closures-q8",
      prompt:
        "What does calling `init()` twice return?\n\n```js\nfunction once(fn) {\n  let called = false, result;\n  return (...args) => {\n    if (!called) { called = true; result = fn(...args); }\n    return result;\n  };\n}\nconst init = once(() => Math.random());\n```",
      options: [
        "The same number both times",
        "Two different random numbers",
        "A number, then `undefined`",
        "`undefined` both times",
      ],
      correctIndex: 0,
      explanation:
        "`called` and `result` live in the closure created by `once`, so the second call skips `fn` and returns the cached `result`.",
    },
    {
      id: "js-closures-q9",
      prompt: "Which of these depend on closures to work? (Select all that apply.)",
      options: [
        "A `debounce(fn, 300)` wrapper that remembers its pending timer between calls",
        "A function returned from another function that reads the outer function's parameter",
        "An event handler in a React component that reads state from the render that created it",
        "`Array.prototype.push`",
        "`JSON.parse`",
      ],
      correctIndex: 0,
      correctIndices: [0, 1, 2],
      explanation:
        "The first three all read variables from an enclosing scope after it has finished executing. `push` and `JSON.parse` are plain built-ins that only use their arguments and receiver.",
    },
    {
      id: "js-closures-q10",
      prompt:
        "What does this component display after about 5 seconds?\n\n```jsx\nfunction Timer() {\n  const [count, setCount] = useState(0);\n  useEffect(() => {\n    const id = setInterval(() => setCount(count + 1), 1000);\n    return () => clearInterval(id);\n  }, []);\n  return <p>{count}</p>;\n}\n```",
      options: ["`1`", "`5`", "`0`", "It throws because `count` is stale"],
      correctIndex: 0,
      explanation:
        "The effect runs once, so the interval callback closed over `count` from the first render (0) and keeps setting 1. A functional update, `setCount(c => c + 1)`, avoids the stale closure.",
      isEdgeCaseOrInterviewQuestion: true,
    },
  ],
},
```

## 13. Exemplar: a code topic with a fake clock

```ts
{
  id: "js-debounce-throttle",
  moduleId: "fe-js-advanced",
  trackId: "frontend",
  title: "Debounce vs Throttle",
  summary: "…senior-level summary as in §5…",
  level: "advanced",
  estMinutes: 50,
  webRefs: [ /* docs + article + interview-prep */ ],
  video: { /* verified */ },
  challengeType: "code",
  codeChallenge: {
    instructions:
      "Implement `debounce(fn, wait, timers)`. It returns a function that delays calling `fn` until `wait` ms have passed without another call, then calls `fn` once with the latest arguments.\n\n- Schedule with `timers.setTimeout(callback, ms)` and cancel with `timers.clearTimeout(id)`. Don't use the global timers: the tests use a fake clock.\n- Each new call cancels the pending timer and starts a new one.\n- Preserve `this` and pass the latest arguments through.\n\nThe tests call `runDebounceScenario`, which fires calls at given times on the fake clock and reports when `fn` actually ran. Leave the driver as it is.",
    starterCode:
      "/**\n * @param {Function} fn\n * @param {number} wait\n * @param {{ setTimeout: Function, clearTimeout: Function }} timers\n */\nfunction debounce(fn, wait, timers) {\n  // Your code here\n}\n\n// ---- Test driver (leave as is) ----\nfunction runDebounceScenario(wait, callTimes, endTime) {\n  const clock = createFakeClock();\n  const runs = [];\n  const debounced = debounce((arg) => runs.push({ at: clock.now(), arg }), wait, clock);\n  callTimes.forEach((t, i) => clock.at(t, () => debounced(i)));\n  clock.runUntil(endTime);\n  return runs;\n}\n\nfunction createFakeClock() {\n  let now = 0, nextId = 1, seq = 0, queue = [];\n  const schedule = (time, cb) => {\n    const id = nextId++;\n    queue.push({ id, time, seq: seq++, cb });\n    return id;\n  };\n  return {\n    now: () => now,\n    setTimeout: (cb, ms = 0) => schedule(now + Math.max(0, ms), cb),\n    clearTimeout: (id) => { queue = queue.filter((t) => t.id !== id); },\n    at: (time, cb) => schedule(time, cb),\n    runUntil(end) {\n      for (;;) {\n        queue.sort((a, b) => a.time - b.time || a.seq - b.seq);\n        const next = queue[0];\n        if (!next || next.time > end) break;\n        queue.shift();\n        now = next.time;\n        next.cb();\n      }\n      now = end;\n    },\n  };\n}\n",
    functionName: "runDebounceScenario",
    testCases: [
      { description: "a single call fires once after `wait`", args: [100, [0], 1000], expected: [{ at: 100, arg: 0 }] },
      { description: "a burst collapses into one call with the latest argument", args: [100, [0, 30, 60, 90], 1000], expected: [{ at: 190, arg: 3 }] },
      { description: "calls spaced further apart than `wait` each fire", args: [100, [0, 150, 400], 1000], expected: [{ at: 100, arg: 0 }, { at: 250, arg: 1 }, { at: 500, arg: 2 }] },
      { description: "no calls means no runs", args: [100, [], 1000], expected: [], isEdgeCase: true },
      { description: "a pending call hasn't fired yet when time stops", args: [100, [0, 50], 120], expected: [], isEdgeCase: true },
      { description: "1,000 calls 1 ms apart collapse into one", args: [100, Array.from({ length: 1000 }, (_, i) => i), 5000], expected: [{ at: 1099, arg: 999 }], isEdgeCase: true },
    ],
  },
},
```

And `content-tests/solutions/js-debounce-throttle.js` is the same starter code with `debounce` solved:

```js
function debounce(fn, wait, timers) {
  let id = null;
  return function (...args) {
    if (id !== null) timers.clearTimeout(id);
    id = timers.setTimeout(() => {
      id = null;
      fn.apply(this, args);
    }, wait);
  };
}
// ...followed by the unchanged driver and createFakeClock
```
