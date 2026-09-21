# JavaScript Core research notes (2026-09-21)

## Videos
All 19 are the verified Namaste JavaScript Season 1 URLs from CLAUDE.md §7 (Akshay Saini). Each was run through
`node scripts/research/yt.mjs info <id>`: all exist, all report `embeddable: true`, and title/channel/duration come
from that output. No fallbacks, no chapter splitting (one episode per topic).
- js-execution-context: How JavaScript Works 🔥& Execution Context | Namaste JavaScript Ep.1 (Akshay Saini, 4:54)
- js-call-stack: How JavaScript Code is executed? ❤️& Call Stack | Namaste JavaScript Ep. 2 (23:41; brief said 23:42)
- js-hoisting: Hoisting in JavaScript 🔥(variables & functions) | Namaste JavaScript Ep. 3 (19:10; brief said 19:11)
- js-functions-variable-env: How functions work in JS ❤️ & Variable Environment | Namaste JavaScript Ep. 4 (21:45)
- js-window-this: SHORTEST JS Program 🔥window & this keyword | Namaste JavaScript Ep. 5 (8:33)
- js-undefined-vs-not-defined: undefined vs not defined in JS 🤔 | Namaste JavaScript Ep. 6 (11:01)
- js-scope-chain: The Scope Chain, 🔥Scope & Lexical Environment | Namaste JavaScript Ep. 7 (19:47; brief said 19:48)
- js-let-const-tdz: let & const in JS 🔥Temporal Dead Zone | | Namaste JavaScript Ep. 8 (21:41)
- js-block-scope-shadowing: BLOCK SCOPE & Shadowing in JS 🔥| Namaste JavaScript 🙏 Ep. 9 (19:57)
- js-closures: Closures in JS 🔥 | Namaste JavaScript Episode 10 (22:44), topic copied verbatim from CONTENT_GUIDE §12
- js-settimeout-closures-interview: setTimeout + Closures Interview Question 🔥 | Namaste 🙏 JavaScript Ep. 11 (17:43)
- js-closures-crazy-interview: CRAZY JS INTERVIEW 🤯ft. Closures | Namaste 🙏 JavaScript Ep. 12 (32:44; brief said 32:45)
- js-first-class-functions: FIRST CLASS FUNCTIONS 🔥ft. Anonymous Functions | Namaste JavaScript Ep. 13 (22:30)
- js-callbacks-event-listeners: Callback Functions in JS ft. Event Listeners 🔥| Namaste JavaScript Ep. 14 (23:26)
- js-event-loop: Asynchronous JavaScript & EVENT LOOP from scratch 🔥 | Namaste JavaScript Ep.15 (41:45)
- js-engine-v8: JS Engine EXPOSED 🔥 Google's V8 Architecture 🚀 | Namaste JavaScript Ep. 16 (28:29; brief said 28:30)
- js-settimeout-trust-issues: TRUST ISSUES with setTimeout() | Namaste JavaScript Ep.17 (26:10; brief said 26:11)
- js-higher-order-functions: Higher-Order Functions ft. Functional Programming | Namaste JavaScript Ep. 18 (24:03)
- js-array-methods-map-filter-reduce: map, filter & reduce 🙏 Namaste JavaScript Ep. 19 🔥 (37:42)

Note: Ep. 16 (2021) presents V8 as Ignition + TurboFan only. The topic summary and quiz add Sparkplug and Maglev.

## References
- All webRefs checked with `scripts/research/check-urls.mjs`: all return 200. Only redirect seen:
  `MDN /Web/API/setTimeout` → `/Web/API/Window/setTimeout` (the final URL is used).
- Dead or replaced: `2ality.com/2015/02/es6-scoping.html`, `2ality.com/2015/10/why-tdz.html`, the exploringjs.com
  variables chapters (all 404), `MDN Glossary/Higher-order_function` (404), and `javascript.info/code-blocks` (404).
  Replaced with You Don't Know JS Yet (2nd ed.) chapters on GitHub, Eloquent JavaScript ch. 5 and MDN pages.
- Hash deep links: tc39.es spec anchors, MDN Closures (`#creating_closures_in_loops_a_common_mistake`,
  `#emulating_private_methods_with_closures`), MDN setTimeout (`#reasons_for_longer_delays_than_specified`) and
  html.spec.whatwg.org `#timers`. The anchors were confirmed in each page's HTML.
- javascript.info anchors are random ids, so plain chapter URLs are used.
- Block iframe previews: MDN (X-Frame-Options DENY), javascript.info (SAMEORIGIN), GitHub (CSP frame-ancestors
  'none'), jakearchibald.com and mathiasbynens.be (DENY), developer.chrome.com (CSP 'self').
- Allow framing: v8.dev, tc39.es, html.spec.whatwg.org, eloquentjavascript.net.

## Facts verified
- Every "what does this log" snippet was run in Node 24.11 (V8 13.6), using `vm` sloppy-script contexts for classic-script
  semantics (hoisting, Annex B block functions, `arguments` mapping, default-parameter scope, catch-parameter `var`,
  illegal shadowing and the other early errors, TDZ in `switch`, `let` loop mutation printing `1 3`, and event-loop orderings).
- Browser-only claims come from specs and docs, not Node: timer callbacks get `this` = WindowProxy even in strict mode (HTML
  timer initialization steps: "callback this value set to thisArg"); nesting level > 5 clamps delays under 4 ms (HTML spec);
  2^31-1 max delay and background and intensive throttling conditions (MDN setTimeout: hidden > 5 min, silent > 30 s,
  chain count >= 5, WebRTC inactive, once per minute, Chrome 88); listener identity is type + callback + capture, and
  duplicate adds are ignored (MDN add/removeEventListener); microtasks between listeners for user clicks but not
  `.click()` (Jake Archibald's article, quoting HTML "clean up after running a callback").
- `var name = 42` at a classic script's top level yields a string (window.name is an own accessor on the global object;
  CreateGlobalVarBinding reuses it). This follows from WebIDL [Global] plus ECMA-262 and wasn't run in a browser.
- Node-specific: CJS top-level `this === module.exports`; `self` is undefined in Node 24; `process.nextTick` runs before
  promise microtasks in CJS and after them in an ESM entry point (both run); `setTimeout(fn, 2**31)` triggers a
  `TimeoutOverflowWarning` and fires after 1 ms; `setTimeout(undefined)` throws `ERR_INVALID_ARG_TYPE`; the timer callback's `this` is `Timeout`.
- Stack limits (Node 24): about 12,522 frames for a trivial recursive function; `Array.prototype.flat(Infinity)` throws a
  RangeError at 10,000 nesting levels (fine at 5,000); `push(...arrayOf200k)` throws a RangeError; nested reduce-composed
  pipelines overflow at 10,000 functions, and at 50,000 even with `--stack-size=4000`. That's why the pipe test uses 50,000.
- V8 tiers from v8.dev: Sparkplug (V8 9.1, one pass over bytecode, no IR); Maglev (Chrome M117, SSA and CFG, "roughly 10x
  slower than Sparkplug, and 10x faster than TurboFan"); TurboFan's JS backend is on Turboshaft and its frontend is being
  replaced by Maglev ("Land ahoy: leaving the Sea of Nodes", Mar 2025); Crankshaft and full-codegen were retired with the 2017
  Ignition/TurboFan launch. Elements-kind transitions only go one way (v8.dev/blog/elements-kinds). PIFE eager compilation
  (v8.dev/blog/preparser) and `//# allFunctionsCalledOnLoad` (v8.dev/blog/explicit-compile-hints) were also checked.
- Polymorphic IC limit: `DEFAULT_MAX_POLYMORPHIC_MAP_COUNT` is 4 in every V8 lkgr branch from 13.6 to 15.1, but V8 `main`
  (Sept 2026) defines it as 10. The content deliberately avoids a number ("a handful", "a small limit", "dozens of shapes").
- `delete` on an object literal's first or last property both leave the object in dictionary mode in Node 24
  (`%HasFastProperties` false), so the quiz says deleting "can" switch to dictionary mode and makes no "last property" claim.
- Duplicate function declarations are fine in scripts and a SyntaxError at a module's top level (run in Node ESM).
- Proper tail calls: specified in ES2015 strict mode, shipped only by Safari/JavaScriptCore. This is well-known compat-table
  data and wasn't re-fetched.

## Code challenges
- js-call-stack: iterative `flattenDeep` (100k-deep and 200k-wide inputs, mutation check). Naive recursion fails the deep test.
- js-closures-crazy-interview: closure-backed `memoize` (Map/SameValueZero keys, falsy results, `this`, errors not cached,
  `clear()`, per-instance caches). A plain-object `if (cache[key])` version fails 5 of 10 tests.
- js-higher-order-functions: `pipe` (identity, eager TypeError, `this`, 50k functions). Arrow-based and reduce-nested versions fail.
- js-array-methods-map-filter-reduce: spec-accurate `myReduce` (`arguments.length`, holes, captured length, TypeErrors). The
  driver swaps out the built-in `reduce`/`reduceRight` while the learner's code runs. A naive version fails 6 of 10 tests.
