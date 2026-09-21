# JavaScript Advanced & Interview-Level research notes (2026-09-21)

21 topics: 11 quizzes (115 questions, 41 edge-case/interview, 26 multi-select) and 10 code challenges
(reference solutions in `content-tests/solutions/`). Every video was confirmed with
`node scripts/research/yt.mjs info <id>` (exists, `embeddable: true`, exact title/channel/duration).
No search-URL fallbacks.

## Videos
- js-promises: Promises | Ep 02 Season 02 - Namaste JavaScript (Akshay Saini, 39:06); the brief's preferred series. Alternates: S2 Ep 03 "Creating a Promise, Chaining & Error Handling" (39:01) and S2 Ep 01 "Callback Hell" (15:28).
- js-promise-combinators: Promise APIs + Interview Questions, S.02 Ep.05 (Akshay Saini, 59:58); covers all/allSettled/race/any directly.
- js-async-await: async await, Season 02 Ep 04 (Akshay Saini, 1:09:21). Alternate: Lydia Hallie "JavaScript Visualized - Event Loop, Web APIs, (Micro)task Queue" (12:34) for the microtask-ordering questions.
- js-generators-iterators: Learn JavaScript Generators In 12 Minutes (Web Dev Simplified, 12:11); no Namaste S2 episode on generators exists.
- js-currying: Currying in Javascript (Akshay Saini, 8:13). Alternate: sum(1)(2)(3)…(n)() (Akshay Saini, 16:46).
- js-debounce-throttle: Debouncing vs Throttling (Akshay Saini, 26:37). Alternates: his separate Debouncing (16:19) and Throttling (22:21) videos.
- js-prototypes: Prototype and Prototypal Inheritance in Javascript (Akshay Saini, 20:22).
- js-this-call-apply-bind: this keyword in JavaScript, Ep.06 Namaste JavaScript Season 2 (Akshay Saini, 53:29). Alternate: call, apply and bind method (Akshay Saini, 10:50). His "Polyfill for bind method" (ke_y6z0xRpk) is NOT embeddable (oEmbed fails), so it wasn't used.
- js-classes-oop: JavaScript OOP Crash Course (ES5 & ES6) (Traversy Media, 40:21); covers constructors, prototypes and classes in one pass. Old (2018) but the ES2015 class material is still accurate; ES2022 fields/private members are covered by the summary and quiz.
- js-modules-cjs-esm: Import vs Require: The Biggest JavaScript Divide (Matt Pocock, 4:02). Alternate: JavaScript ES6 Modules (Web Dev Simplified, 7:38). Note: the same Matt Pocock video is also used by be-node-core and fe-typescript; nothing better and equally credible turned up (searched "esm vs cjs", "module systems history", "live bindings").
- js-fetch-ajax: Learn Fetch API In 6 Minutes (Web Dev Simplified, 6:35). Alternate: I Cannot Believe Abort Controller Can Do This (Web Dev Simplified, 14:24, 2025).
- js-json: Learn JSON in 10 Minutes (Web Dev Simplified, 12:00).
- js-event-delegation: Event Bubbling, Capturing aka Trickling (Akshay Saini, 27:41). Alternates: Event Delegation in Javascript (Akshay Saini, 27:45) and Learn Event Delegation In 10 Minutes (Web Dev Simplified, 9:56).
- js-web-storage: JavaScript Cookies vs Local Storage vs Session Storage (Web Dev Simplified, 14:27). Alternate: Local Storage & Session Storage (Akshay Saini, 14:52).
- js-error-handling: Javascript Custom Error Classes: When, Why, How (Vue School, 9:37); the only focused, reputable English video on custom error classes (low view count, ~700). Alternate: I'm Ditching Try/Catch for Good! (Web Dev Simplified, 10:29).
- js-weakmap-weakset: Only The Best Developers Understand How This Works (Web Dev Simplified, 18:31, 2024); garbage collection, memory leaks, then WeakMap/WeakSet (chapter at 13:55). Used whole because the GC part is the context WeakMap needs.
- js-symbols: The Complete Guide to JS Symbols ES6 (Colt Steele, 12:18).
- js-regex: Learn Regular Expressions In 20 Minutes (Web Dev Simplified, 20:51). Alternate: Regular Expressions (RegEx) in 100 Seconds (Fireship, 2:22).
- js-design-patterns: 10 Design Patterns Explained in 10 Minutes (Fireship, 11:04).
- js-lru-cache: LRU Cache - Twitch Interview Question - Leetcode 146 (NeetCode, 17:49; code in Python, design is language-agnostic). Alternate: Implement LRU cache in JavaScript (Learnersbucket, 17:50, JS-specific but low views).
- js-promise-all-from-scratch: RoadsideCoder "Javascript Interview Questions ( 12 Polyfills )", chapter "promise.all() polyfill" at 40:54 (startSeconds 2454). Alternate: RoadsideCoder "Javascript Interview Questions ( Promises )", chapter "Promise.all()" at 1:00:54 (startSeconds 3654).

## References
- All webRefs checked with `scripts/research/check-urls.mjs` (200, final URL used).
- Redirect: MDN `Classes/Private_properties` now resolves to `Classes/Private_elements` (final URL used).
- patterns.dev URLs redirect to a trailing-slash form (final URL used).
- `leetcode.com/problems/lru-cache/` returns 403 to scripted requests, so it wasn't used; Wikipedia "Cache replacement policies" and `isaacs/node-lru-cache` instead.
- Two old 2ality/exploringjs module URLs were 404 and were not used.
- Iframe previews: MDN (X-Frame-Options DENY), javascript.info (sameorigin), GitHub (frame-ancestors 'none'), web.dev, jakearchibald.com, css-tricks.com, hacks.mozilla.org and refactoring.guru block framing. v8.dev, nodejs.org, patterns.dev, tc39.es and wikipedia.org allow it.

## Facts verified
- Every "what does this log" snippet in the promises, async/await, prototypes, classes, modules, JSON, regex, symbols, WeakMap and error-handling quizzes was run in Node 24.11 (real `.mjs`/`.cjs` files for live bindings, hoisting, circular imports and `require(esm)`).
- Node 24 crashes on `Promise.reject(...)` with a handler attached in a later `setTimeout` (default `--unhandled-rejections=throw`); `Promise.all` marks later rejections as handled; the "start both, then await each" pattern triggers `unhandledRejection`.
- `return promise` from an async function settles two ticks later than `return value`; await of a native promise costs one tick: V8 blog "Faster async functions and promises" (V8 7.2 / Chrome 72, spec patch merged).
- `require(esm)`: unflagged in Node 22.12 / 20.19, no longer experimental in 25.4; `ERR_REQUIRE_ASYNC_MODULE` for graphs with top-level await (nodejs.org/api/modules.html, and reproduced locally). ESM import of CJS: default = `module.exports`, named exports via static analysis (nodejs.org/api/esm.html).
- fetch (Node 24 undici, local HTTP server): 404 fulfils with `ok: false`; a plain-object body is sent as `[object Object]` with `text/plain;charset=UTF-8`; reading the body twice throws `TypeError`; `AbortSignal.timeout` rejects with DOMException `TimeoutError`, `abort()` with `AbortError`.
- Web Storage quota 5 MiB localStorage + 5 MiB sessionStorage per origin, `QuotaExceededError` (MDN Storage quotas page). `storage` event not fired in the document that made the change (MDN storage_event). MDN: "Some browsers use Lax as the default value if SameSite is not specified"; `SameSite=None` requires `Secure`; `__Host-` requires Secure, no Domain, Path=/.
- WeakMap keys: objects and non-registered symbols (MDN WeakMap; `Symbol.for` key throws in Node 24).
- Baseline statuses from MDN: `Iterator.prototype.take` (iterator helpers) Baseline 2025 (March 2025); `Promise.try` Baseline 2025; `RegExp.escape` Baseline 2025; `Error.isError` not Baseline (not used). RegExp inline modifiers `(?i:...)` work in Node 24.
- V8 blog "Launching Ignition and TurboFan": Crankshaft couldn't optimise try/catch/finally; TurboFan can.
- `/^(a+)+$/` on 25 `a`s plus `!` took ~2.2 s in Node 24 (catastrophic backtracking demo).
- LRU performance finding (used in the summary): in V8, evicting with `map.keys().next().value` gets slower as capacity grows, because deleted entries stay in the table until a rehash and the iterator skips them. 100k puts at capacity 50k took ~0.5 s with the Map approach vs ~14 ms with a linked list, so the stress test uses recency refreshes (Map approach 23 ms, naive array approach ~4.9 s) rather than eviction-heavy input.
- Code challenges were also run against typical wrong implementations (take pulling an extra value, manual `next()` without `return()`, shared-state curry, leading-only throttle, arrow-function/ES5 bind polyfills, WeakSet-based cycle detection, live-list emitter, array-based LRU, `results.length` Promise.all, sequential-await Promise.all); each fails at least one test.
