# Svelte & SvelteKit research notes (2026-09-23)

15 topics: 11 quizzes (111 questions, 36 edge-case/interview, 16 multi-select) and 4 code
challenges (41 tests, 20 edge cases; reference solutions in `content-tests/solutions/`).
Milestones: `svelte-state-deep-reactivity`, `svelte-effect`, `svelte-kit-load`,
`svelte-kit-rendering-deploy`. Every video was confirmed with
`node scripts/research/yt.mjs info <id>` (exists, `embeddable: true`, exact title/channel/duration);
all 56 non-YouTube URLs were checked with `scripts/research/check-urls.mjs` and returned **200 with
no redirects**. No search-URL fallbacks.

## Versions verified (do not quote from memory)

Read from the npm registry on 2026-09-23, which matches `docs/CONTENT_GUIDE.md` §10b:

- `svelte` — `latest` **5.57.1** (published 2026-09-18); `next` is `5.0.0-next.272`, i.e. there is
  **no Svelte 6**. Svelte 5.0.0 shipped 2024-10-19.
- `@sveltejs/kit` — `latest` **2.70.3** (published 2026-08-18); `next` is `3.0.0-next.27`, so a
  SvelteKit 3 exists only as a prerelease. Peer range for 2.70.3: `svelte ^4 || ^5`, `vite ^5–^8`,
  `typescript ^5.3.3 || ^6`.

Feature-introduction versions used in summaries and answers, all read from svelte.dev's own docs
(`https://svelte.dev/docs/svelte/llms.txt` and `.../kit/llms.txt`, the canonical plain-text builds):

| Claim | Version |
| --- | --- |
| Exported snippets from `<script module>` | Svelte 5.5.0 |
| `Tween` / `Spring` classes in `svelte/motion` (`tweened`/`spring` stores deprecated) | Svelte 5.8.0 |
| `class` attribute accepts objects/arrays (clsx) | Svelte 5.16 |
| `$props.id()` | Svelte 5.20 |
| Deriveds are writable (optimistic UI) | Svelte 5.25 |
| `createContext()` returning a `[get, set, has]` triplet | Svelte 5.40 |
| Context wrapper for `mount`/`hydrate`/`render` in tests | Svelte 5.49 |
| `PageProps` / `LayoutProps` | SvelteKit 2.16 |
| `$app/state` replacing `$app/stores` | SvelteKit 2.12 |
| `params` prop on pages | SvelteKit 2.24 |
| Remote functions (experimental) | SvelteKit 2.27 |

## The Svelte 4 vs Svelte 5 accuracy problem

This was the main risk in the camp, and the mitigations were:

- Every **primary** video is Svelte 5 / SvelteKit 2 era except the four SvelteKit ones noted below,
  and the module description says in one line that `export let`, `$:` and `on:click` are legacy.
- Quiz answers about the two dialects were checked against the compiler error list in the docs:
  `legacy_export_invalid` ("Cannot use `export let` in runes mode — use `$props()` instead"),
  `legacy_reactive_statement_invalid` ("`$:` is not allowed in runes mode"), `legacy_props_invalid`
  and `legacy_rest_props_invalid`. Runes mode is per component and is entered by using any rune
  (or `runes: true`); Svelte 3/4 syntax still compiles in legacy mode.
- The SvelteKit videos that predate Kit 2 are flagged in the topic summaries where it matters. The
  one behaviour change that would actively mislead is `throw redirect(...)` / `throw error(...)`,
  which became plain calls in SvelteKit 2 — called out explicitly in the `svelte-kit-form-actions`
  summary, and a quiz question tests the *current* semantics (they still throw internally, so
  calling them inside `try` is a bug).

## Videos

Two long, chaptered, current courses carry most of the camp, because no current, focused,
reputable single-concept videos exist for most Svelte 5 topics (searched per topic; almost
everything standalone is 2023-era Svelte 4, or a 2-minute low-view channel):

- **Joy of Code, "The Complete Svelte 5 Course…"** (`B2MhkPtBWs4`, 3:14:31, published 2025-09-06,
  ~72k views). Exceptionally fine-grained chapter list (~85 chapters). Used as the primary at six
  different start times and as an alternate at four more; no two topics share a start.
- **Syntax, "Modern Svelte Kit…"** (`vkXxFfGwPao`, 3:01:17, published 2025-12-18, ~53k views). The
  most recent full SvelteKit course from a roster-adjacent channel; note it teaches **remote
  functions** rather than form actions, which is why it's the primary for routing and hooks but not
  for form actions.
- **Syntax, "Svelte 5 Basics…"** (`8DQailPy3q8`, 1:49:48, 2024-10-19, ~158k views) — published on
  the day Svelte 5 shipped, so it is runes-first. Used at four start times.

Per topic:

- svelte-compiler-model: Svelte Society, "Svienna, 09/2024 — Svelte 5: Why the hell did you do that"
  (Simon Holthausen, Svelte core team, 37:26). A maintainer explaining the design rationale is
  exactly the right register for this topic. Alternates: Svelte Society "Introducing Runes… with
  Rich Harris" (`RVnxF3j3N8U`, 12:34) and the Joy of Code chapter "What Is Svelte?" at 262.
  Caveat: both talks predate the 5.0 release, so they describe the design, not the final API.
- svelte-components-markup: Joy of Code from "Using Template Logic" at 4760. Alternates: Syntax
  "Template Conditionals and Logic" at 2287 and "How CSS Works In Svelte" at 3013.
- svelte-state-deep-reactivity: Joy of Code, "How Svelte Reactivity Works" (`M5oAYP6Rxkg`, 18:48,
  2025-09-19) — signals and the compiled output, with a from-scratch section. Alternates: the course
  chapter "Deeply Reactive State" at 1406, and "The Svelte 5 Reactivity Guide" (`tErKyuUTzsM`).
- svelte-derived: Joy of Code course from "Derived State" at 1690 (runs through "Derived Dependency
  Tracking" and `$derived.by`). Alternates: Rich Harris, "Svelte 5 runes: what's the deal with
  getters and setters?" (`NR8L5m73dtE`) and "Signals From Scratch" at 574 in `M5oAYP6Rxkg`.
- svelte-effect: Joy of Code course from "When Not To Use Effects" at 2595 (through "When To Use
  Effects" and `$effect.pre`). Alternates: "Svelte 5 Runes Demystified (3/4) — Why You Should Never
  Use $effects When You Can Use $deriveds" (`HFTxHu614OU`, 28:24) — low view count (~3.8k) and an
  unknown channel, but the only video that is *only* about this, so it is an alternate, not the
  primary — and the Syntax chapter "$effect & lifecycle" at 4891.
- svelte-props-bindable: Joy of Code course from "Svelte Components" at 6537 (the ~22-minute props
  and bindings section). Alternates: Syntax "Props" at 985 and "Binding Values" at 1472.
- svelte-events: Syntax from "Events" at 1637. Alternate: Joy of Code "Listening To Events" at 5685.
- svelte-snippets: Joy of Code, "Use Svelte 5 Snippets To Reuse Markup Without Creating Components"
  (`OlWWIbRz438`, 17:41). Alternates: course chapter "Snippets" at 8245, Syntax "Snippets aka Inline
  Components" at 3422.
- svelte-stores: Joy of Code, "Using Svelte Stores With Svelte 5 Runes To Create Runed Stores"
  (`GdZZGnAOwu0`, 18:58) — the only good video on the runes-era question of what stores are still
  for. Alternate: course chapter "Reactive Global State" at 3745.
- svelte-context: Joy of Code course, "The Context API" at 8395. **No alternate**: searches for
  "svelte 5 context api setContext" turned up nothing current and reputable (the best standalone is
  a 4-year-old Svelte 3 video), and `createContext` is newer than every video on the subject, so the
  summary and quiz carry that part.
- svelte-transitions: Joy of Code course from "Transitions" at 8850 (through custom transitions,
  crossfade, FLIP and springs — the single best ~24 minutes on this anywhere). Alternates:
  "Impossible FLIP Layout Animations With Svelte And GSAP" (`ecP8RwpkiQw`) and Syntax "Animations"
  at 5566.
- svelte-kit-routing: Syntax SvelteKit course, "Routing" at 938. Alternates: the same course's
  "Advanced Routing" at 8129, and Joy of Code's "Learn Everything About SvelteKit Routing"
  (`7hXHbGj6iE0`, 2022) — **SvelteKit 1 era**, but the file conventions it teaches are unchanged.
- svelte-kit-load: Codevolution, "Universal vs Server Load Function" (`jQXeLhR6Qe8`, 7:38, 2023) —
  precisely on-topic and the only focused video on the distinction. **SvelteKit 1 era**; the load
  API itself is unchanged, but it predates `redirect()` losing its `throw`. Alternates: Huntabyte
  "Why Your Load Functions are Slow" (waterfalls) and "New SvelteKit Feature - Defer" (streaming),
  both 2023, plus the Syntax chapter ".server.ts files" at 3410.
- svelte-kit-form-actions: Huntabyte, "Form Actions Made Simple" (`52nXUwQWeKI`, 29:03, 2022) —
  still the clearest treatment; **shows `throw redirect(...)`**, flagged in the summary. Alternates:
  Huntabyte "Better SvelteKit Forms via Progressive Enhancement" and Paolo Ricciuti (Svelte
  maintainer), "Progressively enhanced apps with Svelte" (`Ji4Y5vo-gOg`, 2025-10-22, low view count
  but current and authoritative).
- svelte-kit-rendering-deploy: Syntax SvelteKit course, "Hooks/Middleware" at 2882. Alternates: the
  same course's "Deploying" at 8362, and Joy of Code's "Learn SvelteKit Hooks Through 6 Examples"
  (2023, hooks API essentially unchanged).

Rejected: Fireship's "Svelte in 100 Seconds" (2020) and "Did runes just ruin Svelte?" (opinion
piece); Net Ninja's Svelte playlist (2019, Svelte 3); Svelte Mastery's adapter video (self-labelled
`[OUTDATED]`); every "Svelte 5 in N minutes" result with a four-figure view count.

## References

- All 56 URLs are 200 with no redirects. `svelte.dev` is first in every topic's list, as required.
- **Iframe previews: `svelte.dev` sends no framing restrictions at all**, so docs *and* the
  interactive tutorial render inline in the app — unusual and worth knowing; `vuejs.org` and
  `react.dev` (for the one cross-reference) behave differently. The only refs that fall back to a
  link card are `github.com/*` (`CSP frame-ancestors 'none'`) and MDN (`X-Frame-Options: DENY`).
- `https://github.com/Rich-Harris/devalue` redirects to `https://github.com/sveltejs/devalue`; the
  final URL is used.
- `https://svelte.dev/tutorial` redirects to `/tutorial/svelte/welcome-to-svelte` (final URL used).
  Two guessed tutorial slugs were 404s and were corrected from the tutorial's own sidebar:
  `/tutorial/svelte/snippets` → `/tutorial/svelte/snippets-and-render-tags`, and
  `/tutorial/svelte/writable-stores` → `/tutorial/svelte/stores`.
- Docs text was read from `https://svelte.dev/docs/svelte/llms.txt` and
  `https://svelte.dev/docs/kit/llms.txt` (svelte.dev publishes plain-text builds of the full docs),
  not from rendered HTML.

## Facts verified

Behavioural claims used in quizzes, each traced to a specific docs passage:

- **Deep state**: `$state` proxies recursively "until Svelte finds something other than an array or
  simple object (like a class or an object created with `Object.create`)". Class instances, `Map`,
  `Set`, `Date` and `URL` are not proxied — `svelte/reactivity` exports reactive replacements.
  Updating a proxy's properties does **not** mutate the original object. Destructuring a reactive
  value is evaluated once. `$state.raw` can only be reassigned, not mutated. `$state.snapshot`
  honours `toJSON`.
- **Push-pull**: "when state is updated, everything that depends on the state … is immediately
  notified (the 'push'), but derived values are not re-evaluated until they are actually read (the
  'pull')" and "if the new value of a derived is referentially identical to its previous value,
  downstream updates will be skipped" — the docs' own `large = $derived(count > 10)` example, which
  the code challenge's `equalitySkip` scenario reproduces.
- **`$derived` is not deeply proxied**, unlike `$state`; deriveds became writable in 5.25.
- **Effects**: run after mount and in a microtask after state changes, batched, after DOM updates;
  browser-only (no SSR); only synchronous reads are tracked; an effect reading `state` (never
  reassigned) doesn't re-run when `state.value` changes; the mutually-writing `spent`/`left` example
  is the docs' own "don't do this", and the recommended fix is a function binding.
- **Events**: the delegated-event list, `{ bubbles: true }` for manually dispatched events,
  `ontouchstart`/`ontouchmove` registered passive, `onclickcapture` as the only surviving modifier
  form, event attributes firing after bindings, and `on` from `svelte/events` preserving ordering —
  all from "Basic markup → Events" and the v5 migration guide.
- **Snippets**: no rest parameters; lexical scope (the docs' nested `x`/`y` example, where only the
  inner render tag is legal); `Snippet<[T]>` takes a **tuple**; exported snippets must not reference
  the instance `<script>`; slots are deprecated in Svelte 5.
- **Store contract**: subscribe fires immediately and synchronously, returns an unsubscribe, and set
  notifies synchronously. The change test is Svelte's `safe_not_equal`:
  `a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function'` — so an
  identical primitive is not a change, any object or function always is, and `NaN` → `NaN` is not.
  The "no notification from inside `start`" detail (because `stop` isn't assigned yet) is what stops
  a derived store double-firing on subscribe; all of this is reproduced in the code challenge and
  matches `packages/svelte/src/store/shared/index.js`.
- **Context**: `setContext`/`getContext`/`createContext` must run during component initialisation;
  the value is visible to the component itself *and* its descendants, but only to `getContext` calls
  that run after the `setContext`; the nearest provider wins on a duplicate key; reassigning instead
  of mutating breaks the link; and the cross-request-pollution argument is the docs' own
  ("Replacing global state" and SvelteKit's "State management").
- **Transitions**: driven by the Web Animations API, so a global
  `@media (prefers-reduced-motion: reduce)` CSS rule that zeroes durations has **no effect** — use
  `prefersReducedMotion` from `svelte/motion`. Transitions are local by default (`|global` opts
  out); an outroing block keeps its children until every transition finishes; `animate:flip` runs
  only on reorder of a **keyed** each block and must be an immediate child; events are
  `introstart`/`introend`/`outrostart`/`outroend`.
- **Routing**: the sort order (specificity → matchers → `[[optional]]`/`[...rest]` last →
  alphabetical) and the exact five-route example; rest params match zero segments; an optional param
  can't follow a rest param; matchers live in `src/params` and run on server *and* client;
  `[x+2e]well-known` for dotfiles; `(group)` and `+page@segment.svelte`.
- **Load**: universal vs server, `devalue` serialisation, last-key-wins merging ("If multiple `load`
  functions return data with the same key, the last one 'wins'"), the server load's return arriving
  as the universal load's `event.data`, `parent()` semantics (server-parent vs universal-parent are
  separate chains), search-param-level dependency tracking, streaming caveats (unhandled rejections,
  no `setHeaders`/redirect once streaming, buffering platforms, universal loads don't stream) and
  the auth implications of layout loads not rerunning.
- **Form actions**: `POST` only; no default alongside named actions (the persisted `?/name` reason);
  `fail` vs `error`; `handle` not rerunning before post-action loads (so update `event.locals` when
  you change a session cookie); the full documented `use:enhance` default behaviour and the
  override-by-returning-a-callback rule; `deserialize` rather than `JSON.parse`; remote functions
  described by the docs as where "new development is focused" while form actions are
  "feature-complete".
- **Page options / adapters**: `prerender` true/false/`'auto'`; pages with actions can't be
  prerendered; `url.searchParams` forbidden while prerendering; `ssr: false` = empty shell,
  `csr: false` = no JavaScript shipped, both false = nothing rendered; `entries()` for dynamic
  prerendered routes; static assets and prerendered pages bypass `handle`; `adapter-auto` "does not
  take any options"; `adapter-static` + `fallback` for an SPA.
- **`{#each}`** accepts arrays, array-likes (anything with `length`) and iterables, converted with
  `Array.from`; `null`/`undefined` behave as an empty array; the index binding is zero-based (there
  is no integer form like Vue's `v-for="n in 3"`).
- **`class`** accepts objects and arrays since 5.16 (clsx); `{@const}` is only valid as an immediate
  child of a block; `{@html}` content is invisible to scoped styles.

## Code challenges

Four, chosen where the logic genuinely stands alone as plain JavaScript; the other eleven topics are
about syntax, file conventions or judgement, so they are quizzes.

- **`svelte-state-deep-reactivity`** — build the `$state` proxy: what gets proxied, proxy identity
  caching, `Object.is`-guarded notification, delete, and a `$state.snapshot` equivalent. Verified
  behaviours: `arr.push(x)` produces exactly **one** notification (the index write extends the
  array, so the following `length` write is a no-op under the `Object.is` guard);
  `Array.isArray(proxy)` is `true`; `Object.keys` on a proxy forwards to the target.
- **`svelte-derived`** — the push-pull graph, with per-node version counters. Distinguishes a
  correct implementation from a naive one on five scenarios a naive one fails: laziness (100 writes,
  zero getter runs), the referential-equality skip, diamond glitch-freedom (one recompute, one
  effect run), dependency re-collection after a branch flips, and 500 independent effects where one
  write re-runs exactly one.
- **`svelte-stores`** — the documented store contract including `safe_not_equal`, the `start`/`stop`
  lifecycle, and `derived` subscribing to its sources only while subscribed.
- **`svelte-kit-load`** — the load chain: server-then-universal per node, `event.data` hand-off,
  last-key-wins merging, and the two separate `parent()` chains.

Simplifications stated in the instructions: effects flush synchronously in the derived challenge
(real Svelte batches into a microtask — the algorithm is otherwise the same); the load chain runs
nodes in order rather than concurrently (same resulting data; concurrency and `await parent()`
waterfalls are covered in the summary); the store challenge notifies synchronously, which is what
the contract requires anyway.

Each solution was also run against the untouched starter to confirm the starter fails (the
`content:check` gate enforces this), and the four scenarios sets were executed directly before being
turned into `expected` values, so no expectation is hand-computed.

## Scope judgement

The brief lists sixteen areas and asks for 12–15 topics, so one merge was needed. SSR/hydration,
prerendering, page options, adapters and deployment became one topic
(`svelte-kit-rendering-deploy`) alongside hooks, since in practice they are the same decision — how
this route is rendered and where it runs. Everything else in the brief got its own topic, and runes
got five (`$state`, `$derived`, `$effect`, `$props`/`$bindable`, plus the proxy model inside
`$state`), which is where the brief asked for the weight.
