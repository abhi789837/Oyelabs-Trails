import type { Module } from "@/types/curriculum";

// Starter code for the four code challenges, kept out of the topic objects for readability.
// Each one is the reference solution in content-tests/solutions/<topicId>.js with the
// learner's part blanked out; the drivers below are identical in both.

const STATE_STARTER = `/**
 * Wraps \`value\` in a deeply reactive proxy, the way Svelte 5's \`$state\` does.
 * @param {any} value
 * @param {(path: string[]) => void} onChange called with the property path on every real write
 * @returns {any} the proxy, or \`value\` itself if it isn't proxyable
 */
function deepState(value, onChange) {
  // Your code here (this placeholder proxies nothing)
  return value;
}

/**
 * Returns a plain, proxy-free deep clone of plain objects and arrays.
 * @param {any} value
 */
function snapshot(value) {
  // Your code here
  return value;
}

// ---- Test driver (leave as is) ----
class Counter {
  constructor() {
    this.n = 0;
  }
  bump() {
    this.n += 1;
  }
}

function runStateScenario(name) {
  const changes = [];
  const record = (path) => changes.push(path.join("."));

  const scenarios = {
    topLevel() {
      const s = deepState({ count: 0, label: "a" }, record);
      s.count = 1;
      s.count = 2;
      s.label = "a";
      return { changes, count: s.count };
    },
    nested() {
      const s = deepState({ user: { name: "Ada", tags: ["x"] } }, record);
      s.user.name = "Grace";
      s.user.tags.push("y");
      s.user.tags[0] = "z";
      return { changes, tags: snapshot(s.user.tags) };
    },
    sameValue() {
      const s = deepState({ count: 0 }, record);
      s.count = 0;
      s.count = 1;
      s.count = 1;
      return { changes, count: s.count };
    },
    notPlain() {
      const map = new Map([["k", 1]]);
      const date = new Date(0);
      const counter = new Counter();
      const s = deepState({ map, date, counter }, record);
      s.map.set("k", 2);
      s.counter.bump();
      s.date.setTime(5);
      return {
        changes,
        sameMap: s.map === map,
        sameCounter: s.counter === counter,
        isMap: s.map instanceof Map,
        n: s.counter.n,
        mapValue: s.map.get("k"),
      };
    },
    identity() {
      const raw = { user: { name: "Ada" } };
      const s = deepState(raw, record);
      return { stable: s.user === s.user, notRaw: s.user !== raw.user, rootNotRaw: s !== raw };
    },
    arrays() {
      const s = deepState([1, 2], record);
      const isArray = Array.isArray(s);
      s.push(3);
      s[0] = 9;
      return { changes, isArray, value: snapshot(s), length: s.length };
    },
    assignObject() {
      const s = deepState({ user: { name: "Ada" } }, record);
      s.user = { name: "Linus" };
      s.user.name = "Evan";
      return { changes, name: s.user.name };
    },
    deleteKey() {
      const s = deepState({ a: 1, b: 2 }, record);
      delete s.a;
      delete s.a;
      return { changes, keys: Object.keys(s) };
    },
    snapshotIsPlain() {
      const s = deepState({ user: { name: "Ada" }, list: [1, [2]] }, record);
      const snap = snapshot(s);
      snap.user.name = "Grace";
      snap.list[1].push(3);
      return { changes, snap, live: snapshot(s) };
    },
    many() {
      const s = deepState({ n: 0 }, record);
      for (let i = 1; i <= 1000; i++) s.n = i;
      return { count: changes.length, n: s.n };
    },
  };

  if (!scenarios[name]) throw new Error("Unknown scenario " + name);
  return scenarios[name]();
}
`;

const DERIVED_STARTER = `/**
 * Builds a push-pull reactive graph: sources push invalidation, deriveds are pulled.
 * @returns {{ state: Function, derived: Function, effect: Function }}
 */
function createGraph() {
  // Your code here. This placeholder is eager, uncached and never re-runs an effect.
  return {
    state(initial) {
      let value = initial;
      return {
        get: () => value,
        set: (next) => {
          value = next;
        },
      };
    },
    derived(fn) {
      return { get: () => fn() };
    },
    effect(fn) {
      fn();
      return function stop() {};
    },
  };
}

// ---- Test driver (leave as is) ----
function runGraphScenario(name) {
  const { state, derived, effect } = createGraph();
  const seen = [];
  let getterRuns = 0;
  let effectRuns = 0;

  const scenarios = {
    basic() {
      const count = state(0);
      const doubled = derived(() => count.get() * 2);
      effect(() => {
        effectRuns++;
        seen.push(doubled.get());
      });
      count.set(1);
      count.set(2);
      return { seen, effectRuns };
    },
    lazyNoRead() {
      const count = state(0);
      const doubled = derived(() => {
        getterRuns++;
        return count.get() * 2;
      });
      const before = getterRuns;
      for (let i = 1; i <= 100; i++) count.set(i);
      const during = getterRuns;
      const value = doubled.get();
      return { before, during, after: getterRuns, value };
    },
    cached() {
      const count = state(3);
      const doubled = derived(() => {
        getterRuns++;
        return count.get() * 2;
      });
      const reads = [doubled.get(), doubled.get(), doubled.get()];
      return { reads, getterRuns };
    },
    equalitySkip() {
      const count = state(0);
      const large = derived(() => {
        getterRuns++;
        return count.get() > 10;
      });
      effect(() => {
        effectRuns++;
        seen.push(large.get());
      });
      count.set(1);
      count.set(2);
      count.set(3);
      count.set(11);
      return { seen, effectRuns, getterRuns };
    },
    diamond() {
      const a = state(1);
      const b = derived(() => a.get() * 2);
      const c = derived(() => a.get() + 1);
      const d = derived(() => {
        getterRuns++;
        return b.get() + c.get();
      });
      effect(() => {
        effectRuns++;
        seen.push(d.get());
      });
      a.set(2);
      return { seen, effectRuns, getterRuns };
    },
    dynamicDeps() {
      const flag = state(true);
      const a = state("A");
      const b = state("B");
      const pick = derived(() => (flag.get() ? a.get() : b.get()));
      effect(() => {
        effectRuns++;
        seen.push(pick.get());
      });
      b.set("B2");
      const afterUnrelated = effectRuns;
      flag.set(false);
      a.set("A2");
      return { seen, afterUnrelated, effectRuns };
    },
    unrelated() {
      const a = state(0);
      const b = state(0);
      effect(() => {
        effectRuns++;
        seen.push(a.get());
      });
      b.set(1);
      b.set(2);
      a.set(1);
      return { seen, effectRuns };
    },
    chain() {
      const a = state(1);
      const b = derived(() => a.get() + 1);
      const c = derived(() => b.get() * 2);
      effect(() => {
        effectRuns++;
        seen.push(c.get());
      });
      a.set(2);
      a.set(3);
      return { seen, effectRuns };
    },
    stop() {
      const a = state(0);
      const stopIt = effect(() => {
        effectRuns++;
        seen.push(a.get());
      });
      a.set(1);
      stopIt();
      a.set(2);
      a.set(3);
      return { seen, effectRuns };
    },
    manyEffects() {
      const sources = [];
      for (let i = 0; i < 500; i++) sources.push(state(i));
      for (let i = 0; i < 500; i++) {
        const twice = derived(() => sources[i].get() * 2);
        effect(() => {
          effectRuns++;
          twice.get();
        });
      }
      const afterSetup = effectRuns;
      sources[250].set(-1);
      return { afterSetup, effectRuns };
    },
  };

  if (!scenarios[name]) throw new Error("Unknown scenario " + name);
  return scenarios[name]();
}
`;

const STORES_STARTER = `/**
 * Svelte's own "has this changed?" test.
 * @param {any} a
 * @param {any} b
 */
function safeNotEqual(a, b) {
  // Your code here (this placeholder treats every set as a change)
  return true;
}

/**
 * A store you can set from outside.
 * @param {any} value
 * @param {(set: Function, update: Function) => (void | Function)} [start]
 */
function writable(value, start) {
  // Your code here (this placeholder never notifies anyone after the first call)
  return {
    set(next) {
      value = next;
    },
    update(fn) {
      value = fn(value);
    },
    subscribe(run) {
      run(value);
      return () => {};
    },
  };
}

/**
 * A store that can only be updated from the inside.
 * @param {any} value
 * @param {(set: Function, update: Function) => (void | Function)} [start]
 */
function readable(value, start) {
  return { subscribe: writable(value, start).subscribe };
}

/**
 * A store derived from one store or an array of stores.
 * @param {any} stores
 * @param {Function} fn
 */
function derived(stores, fn) {
  // Your code here
  return {
    subscribe(run) {
      run(undefined);
      return () => {};
    },
  };
}

// ---- Test driver (leave as is) ----
function runStoreScenario(name) {
  const log = [];
  const show = (value) => (typeof value === "object" && value !== null ? JSON.stringify(value) : String(value));

  const scenarios = {
    immediate() {
      const store = writable("a");
      store.subscribe((v) => log.push("one:" + show(v)));
      store.set("b");
      return log;
    },
    order() {
      const store = writable(0);
      store.subscribe((v) => log.push("one:" + show(v)));
      store.subscribe((v) => log.push("two:" + show(v)));
      store.set(1);
      return log;
    },
    unsubscribe() {
      const store = writable(0);
      const off = store.subscribe((v) => log.push(show(v)));
      store.set(1);
      off();
      store.set(2);
      store.set(3);
      return log;
    },
    equality() {
      const object = { n: 1 };
      const store = writable(1);
      store.subscribe((v) => log.push(show(v)));
      store.set(1);
      store.set(2);
      store.set(object);
      store.set(object);
      store.set({ n: 1 });
      return log;
    },
    notANumber() {
      const store = writable(1);
      store.subscribe((v) => log.push(show(v)));
      store.set(NaN);
      store.set(NaN);
      store.set(0);
      return log;
    },
    startStop() {
      const store = writable(0, () => {
        log.push("start");
        return () => log.push("stop");
      });
      const first = store.subscribe(() => log.push("a"));
      const second = store.subscribe(() => log.push("b"));
      first();
      second();
      const third = store.subscribe(() => log.push("c"));
      third();
      return log;
    },
    updates() {
      const store = writable(1);
      store.subscribe((v) => log.push(show(v)));
      store.update((n) => n + 1);
      store.update((n) => n * 10);
      return log;
    },
    derivedPair() {
      const a = writable(1);
      const b = writable(2);
      const sum = derived([a, b], ([x, y]) => x + y);
      sum.subscribe((v) => log.push(show(v)));
      a.set(10);
      b.set(20);
      return log;
    },
    derivedSingle() {
      const a = writable(2);
      const doubled = derived(a, (v) => v * 2);
      doubled.subscribe((v) => log.push(show(v)));
      a.set(5);
      return log;
    },
    derivedLazy() {
      const source = writable(0, () => {
        log.push("source-start");
        return () => log.push("source-stop");
      });
      const doubled = derived(source, (v) => v * 2);
      log.push("created");
      const off = doubled.subscribe((v) => log.push("got:" + show(v)));
      off();
      return log;
    },
    derivedCleanup() {
      const source = writable(1, () => {
        log.push("start");
        return () => log.push("stop");
      });
      const doubled = derived(source, (v) => v * 2);
      const off = doubled.subscribe((v) => log.push("got:" + show(v)));
      source.set(2);
      off();
      source.set(3);
      return log;
    },
  };

  if (!scenarios[name]) throw new Error("Unknown scenario " + name);
  return scenarios[name]();
}
`;

const LOAD_STARTER = `/**
 * Runs a SvelteKit-style load chain, root layout first, page last.
 * @param {{ id: string, serverLoad?: Function, universalLoad?: Function }[]} nodes
 * @param {object} event
 * @returns {Promise<object>} the merged \`data\` prop for the page
 */
async function resolveLoadChain(nodes, event) {
  // Your code here (this placeholder ignores every load function)
  return {};
}

// ---- Test driver (leave as is) ----
// Each spec node is { id, server?: { returns?, useParent? }, universal?: { returns?, useParent?, spreadData? } }.
// The driver turns the spec into real load functions, records what each one saw, and
// returns plain data. \`null\` in \`parentSeen\`/\`dataSeen\` means "was not provided".
function runLoadChain(spec) {
  const log = [];
  const parentSeen = {};
  const dataSeen = {};

  const nodes = spec.nodes.map((n) => {
    const node = { id: n.id };
    if (n.server) {
      node.serverLoad = async (event) => {
        log.push("server:" + n.id);
        if (n.server.useParent) parentSeen["server:" + n.id] = { ...(await event.parent()) };
        return n.server.returns === undefined ? undefined : { ...n.server.returns };
      };
    }
    if (n.universal) {
      node.universalLoad = async (event) => {
        log.push("universal:" + n.id);
        dataSeen[n.id] = event.data === undefined ? null : { ...event.data };
        if (n.universal.useParent) parentSeen["universal:" + n.id] = { ...(await event.parent()) };
        const own = n.universal.returns;
        if (n.universal.spreadData) return { ...(event.data ?? {}), ...(own ?? {}) };
        return own === undefined ? undefined : { ...own };
      };
    }
    return node;
  });

  return resolveLoadChain(nodes, { url: spec.url ?? "/", params: spec.params ?? {} }).then((data) => ({
    data,
    log,
    parentSeen,
    dataSeen,
  }));
}
`;

export default {
  id: "fe-svelte",
  trackId: "frontend",
  name: "Svelte & SvelteKit",
  description:
    "Svelte 5 and SvelteKit 2 for engineers who already ship React or Vue: why a compiler beats a runtime, the runes (`$state`, `$derived`, `$effect`, `$props`, `$bindable`), the state proxy and where deep reactivity stops, snippets instead of slots, events as plain properties, what's left of stores and context, transitions, and then SvelteKit's filesystem router, load functions, form actions, hooks and adapters. Four topics are code challenges: the state proxy, a push-pull derived graph, the store contract and a load chain. Everything here is Svelte 5 syntax — `export let`, `$:` and `on:click` are legacy and flagged where they appear.",
  refs: [
    { label: "Svelte: Docs overview", url: "https://svelte.dev/docs/svelte/overview", kind: "docs" },
    { label: "Svelte: Interactive tutorial", url: "https://svelte.dev/tutorial/svelte/welcome-to-svelte", kind: "docs" },
    { label: "SvelteKit: Routing", url: "https://svelte.dev/docs/kit/routing", kind: "docs" },
    { label: "Svelte: v5 migration guide", url: "https://svelte.dev/docs/svelte/v5-migration-guide", kind: "article" },
  ],
  topics: [
    {
      id: "svelte-compiler-model",
      moduleId: "fe-svelte",
      trackId: "frontend",
      title: "A Compiler, Not a Runtime",
      summary:
        "React and Vue ship a framework that reads your component at runtime and works out what to update. Svelte reads your component at build time instead. `<h1>{name}</h1>` compiles to imperative JavaScript that creates that one text node and a function that sets its `nodeValue` when `name` changes — there is no virtual DOM tree and no diff. The tradeoff is that the framework's cleverness has to fit inside what a compiler can see in one file, which is exactly why Svelte's API is syntax (`$state`, `{#each}`) rather than imported functions.\n\nThe common claim that Svelte has \"no runtime\" is marketing. It has one — `$state` compiles to `$.state(...)` and reads compile to `$.get(...)` — but it is small and, more importantly, you only pay for the parts you use, so the framework cost scales with your app rather than sitting as a fixed entry fee. Svelte 5 rebuilt that runtime on **signals**: every piece of state is a node in a graph, and only the effects that read a given node re-run. A component's `<script>` body runs exactly once, on creation, unlike a React function component which re-runs on every render — which is why stale closures and dependency arrays don't exist here, and why `console.log` in the script body fires once no matter how much state changes.\n\nThe compiler boundary is the thing that surprises people. It only sees one file at a time, so it can't follow state across a module boundary unless you export an object or functions rather than a reassignable `let`; it can't compile markup you build as a string at runtime; and mixing legacy Svelte 4 syntax with runes in one component is an error — using any rune puts the component in *runes mode*, where `export let`, `$:`, `$$props` and `$$restProps` are compiler errors. Svelte 4 components still compile in Svelte 5's legacy mode, so a codebase migrates file by file, but the two dialects read so differently that you should always know which one a snippet is written in.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Svelte: Docs overview", url: "https://svelte.dev/docs/svelte/overview", kind: "docs" },
        { label: "Svelte blog: Virtual DOM is pure overhead", url: "https://svelte.dev/blog/virtual-dom-is-pure-overhead", kind: "article" },
        { label: "Svelte blog: Introducing runes", url: "https://svelte.dev/blog/runes", kind: "article" },
        { label: "sveltejs/svelte: source", url: "https://github.com/sveltejs/svelte", kind: "repo" },
      ],
      video: {
        title: "Svienna, 09/2024 — Svelte 5: Why the hell did you do that (Simon Holthausen)",
        channel: "Svelte Society",
        url: "https://www.youtube.com/watch?v=iMUEZWaSzG8",
        videoId: "iMUEZWaSzG8",
        durationLabel: "37:26",
      },
      alternateVideos: [
        {
          title: "Svelte 5: Introducing Runes... with Rich Harris",
          channel: "Svelte Society",
          url: "https://www.youtube.com/watch?v=RVnxF3j3N8U",
          videoId: "RVnxF3j3N8U",
          durationLabel: "12:34",
        },
        {
          title: "The Complete Svelte 5 Course For The Most Loved JavaScript Framework",
          channel: "Joy of Code",
          url: "https://www.youtube.com/watch?v=B2MhkPtBWs4",
          videoId: "B2MhkPtBWs4",
          durationLabel: "3:14:31",
          startSeconds: 262,
          chapterLabel: "What Is Svelte?",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "svelte-compiler-model-q1",
          prompt: "What does the Svelte compiler emit for `<h1>Hello {name}!</h1>`?",
          options: [
            "JavaScript that creates that specific `<h1>` and text node, plus a function that updates the text node when `name` changes",
            "A virtual DOM description that a runtime diffs against the previous render",
            "An HTML `<template>` that a runtime library clones and patches by walking it",
            "A custom element definition registered with `customElements.define`",
          ],
          correctIndex: 0,
          explanation:
            "Compilation produces direct DOM instructions for the parts that can change; there is no tree to diff. A `<template>` is used for the static skeleton, but the updates are targeted, not discovered by walking.",
        },
        {
          id: "svelte-compiler-model-q2",
          prompt: "Which of these are true of runes such as `$state`? (Select all that apply.)",
          options: [
            "They are compiler syntax, so you never import them",
            "They can't be assigned to a variable or passed as an argument",
            "They are only valid in `.svelte`, `.svelte.js` and `.svelte.ts` files",
            "They are functions exported from the `svelte` package",
            "They work in any `.js` file as long as you import them first",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Runes are keywords the compiler rewrites, not values — `const s = $state;` is meaningless. That's also why they only work in files the Svelte compiler processes.",
        },
        {
          id: "svelte-compiler-model-q3",
          prompt:
            "How many times does this log, if the button is clicked five times?\n\n```svelte\n<script>\n  let count = $state(0);\n  console.log('script ran');\n</script>\n\n<button onclick={() => count++}>{count}</button>\n```",
          options: ["Once", "Six times", "Five times", "Once per DOM update, so five times after the first"],
          correctIndex: 0,
          explanation:
            "A component's `<script>` is setup code that runs once when the component is created. Only the render effect for `{count}` re-runs — the opposite of React, where the function body runs on every render.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-compiler-model-q4",
          prompt:
            "Why does this module fail to compile?\n\n```js\n// counter.svelte.js\nexport let count = $state(0);\n\nexport function increment() {\n  count += 1;\n}\n```",
          options: [
            "The compiler rewrites every reference to `count` into signal reads and writes, and it can't do that in files that merely import `count`",
            "Runes are not allowed outside `.svelte` components",
            "`$state` can only hold objects and arrays, never a number",
            "`export let` is reserved for props and can never appear in a module",
          ],
          correctIndex: 0,
          explanation:
            "`count` compiles to `$.get(count)` / `$.set(count, …)` inside this file only; an importing module would just read a stale binding, so the compiler rejects exporting reassignable state. Export an object, or export getter/setter functions.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-compiler-model-q5",
          prompt: "A component contains both `let count = $state(0)` and `$: doubled = count * 2`. What happens?",
          options: [
            "It's a compiler error: using a rune puts the component in runes mode, where `$:` is not allowed",
            "It compiles, and `doubled` updates as it did in Svelte 4",
            "It compiles with a deprecation warning and `doubled` never updates",
            "It compiles only if you also set `runes: false` in the component options",
          ],
          correctIndex: 0,
          explanation:
            "Svelte 5 supports the legacy dialect, but per component: any rune switches the file into runes mode, and then `$:`, `export let`, `$$props` and `$$restProps` all become compiler errors. Migration happens file by file, not statement by statement.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-compiler-model-q6",
          prompt: "Which statement about Svelte's runtime cost is accurate?",
          options: [
            "There is a runtime, but it's small and tree-shaken, so the framework code shipped grows with the features a component actually uses",
            "There is no runtime at all — compiled components are plain DOM calls with no imports",
            "The runtime is a fixed payload comparable to React's, and the win is only in render speed",
            "The runtime is only loaded during hydration and then discarded",
          ],
          correctIndex: 0,
          explanation:
            "Signals, effects and lifecycle all live in `svelte/internal`. The distinctive property is the shape of the curve — a small baseline that grows per feature — not the absence of a library.",
        },
        {
          id: "svelte-compiler-model-q7",
          prompt: "What does Svelte's compiler do with the CSS in a component's `<style>` block?",
          options: [
            "It scopes selectors by adding a generated class to the matching elements, and warns about selectors that match nothing in the markup",
            "It injects the CSS globally at runtime and relies on you to namespace it",
            "It converts the CSS into inline `style` attributes on each element",
            "It emits a CSS Module and rewrites your class names to hashed names",
          ],
          correctIndex: 0,
          explanation:
            "Scoping is a compile-time rewrite using a hash class, which is why Svelte can tell you a rule is unused — it can see both the markup and the CSS. Use `:global(...)` to opt out.",
        },
        {
          id: "svelte-compiler-model-q8",
          prompt: "Which of these are consequences of doing the work at compile time rather than at runtime? (Select all that apply.)",
          options: [
            "Markup can't be assembled from a string at runtime and then compiled in the browser",
            "Unused CSS selectors and some template mistakes are caught before the code ships",
            "The compiler can only reason about one file at a time",
            "Components can't be published to npm, because consumers would need the source",
            "Conditional logic in templates is evaluated at build time, so `{#if}` blocks are static",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Svelte packages ship compiled output (or source plus a `svelte` export condition) perfectly well, and `{#if}` is absolutely dynamic — the compiler emits the branch logic, it doesn't resolve it.",
        },
        {
          id: "svelte-compiler-model-q9",
          prompt: "Rich Harris's \"Virtual DOM is pure overhead\" argument is essentially that…",
          options: [
            "Diffing is work a framework does to discover what changed, and a compiler can know that in advance",
            "The virtual DOM is slower than the real DOM at creating elements",
            "Immutable data structures are too expensive for UI work",
            "`requestAnimationFrame` batching makes diffing unnecessary",
          ],
          correctIndex: 0,
          explanation:
            "The point isn't that diffing is slow in absolute terms; it's that it's avoidable information-gathering. A compiler that has read the template already knows which bindings can change.",
        },
        {
          id: "svelte-compiler-model-q10",
          prompt: "You want to share reactive state between several components in a Svelte 5 app. Which file extension lets you use runes outside a component?",
          options: ["`.svelte.js` or `.svelte.ts`", "`.js` or `.ts`, once you import from `svelte`", "`.store.js`", "`.svelte` only — runes are component-scoped"],
          correctIndex: 0,
          explanation:
            "The `.svelte.js`/`.svelte.ts` suffix tells the Svelte plugin to compile the file, which is what makes runes work there. Plain `.js` files are never processed, so `$state` in one is just a syntax error.",
        },
      ],
    },
    {
      id: "svelte-components-markup",
      moduleId: "fe-svelte",
      trackId: "frontend",
      title: "Components, Markup & Scoped Styles",
      summary:
        "A `.svelte` file is one component: an optional `<script>` (setup, runs once), optional `<script module>` (runs once per module, shared by every instance), markup, and a `<style>` block scoped to this component. There is no return statement and no JSX — the markup *is* the template, and the compiler reads it. That constrains expressions: `{expression}` must be a single expression, not a statement, and the block syntax covers the control flow JSX gets from plain JavaScript: `{#if}` / `{:else if}` / `{:else}`, `{#each list as item, i (item.id)}`, `{#key value}`, and `{#await promise}` with `{:then}` / `{:catch}`.\n\nThe details that bite: `{#each}` without a key patches rows **in place by index**, so deleting the first item of a list reuses the first DOM node for the second item and any uncontrolled state in it — a typed-in `<input>` value, a running animation — stays with the position rather than the item. Always key with something stable. `{#key expr}` is the opposite tool: it destroys and recreates its contents when `expr` changes, which is how you force a remount or restart a transition. `{@html value}` is an XSS hole for anything user-supplied, and its content is invisible to scoped styles because the compiler never saw those elements — you need `:global(...)` to reach inside it. `{@const}` is only valid as an immediate child of a block, not anywhere in the markup.\n\nStyles are scoped by the compiler adding a generated class to matching elements, which means a selector that matches nothing in *this* component's markup is reported as unused and removed — including selectors intended for a child component's internals. Reaching into a child is deliberate friction: use `:global(...)`, pass a class as a prop, or expose CSS custom properties, which pierce scoping because they inherit. Svelte also gives you `class:active={isActive}` and `style:color={c}` directives; since Svelte 5.16 the `class` attribute also accepts objects and arrays (clsx-style), so `class={{ active: isActive }}` works directly.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Svelte: Basic markup", url: "https://svelte.dev/docs/svelte/basic-markup", kind: "docs" },
        { label: "Svelte: {#each ...} and keyed blocks", url: "https://svelte.dev/docs/svelte/each", kind: "docs" },
        { label: "Svelte: Scoped styles", url: "https://svelte.dev/docs/svelte/scoped-styles", kind: "docs" },
        { label: "Svelte tutorial: Your first component", url: "https://svelte.dev/tutorial/svelte/your-first-component", kind: "docs" },
      ],
      video: {
        title: "The Complete Svelte 5 Course For The Most Loved JavaScript Framework",
        channel: "Joy of Code",
        url: "https://www.youtube.com/watch?v=B2MhkPtBWs4",
        videoId: "B2MhkPtBWs4",
        durationLabel: "3:14:31",
        startSeconds: 4760,
        chapterLabel: "Using Template Logic",
      },
      alternateVideos: [
        {
          title: "Svelte 5 Basics - Complete Svelte 5 Course for Beginners",
          channel: "Syntax",
          url: "https://www.youtube.com/watch?v=8DQailPy3q8",
          videoId: "8DQailPy3q8",
          durationLabel: "1:49:48",
          startSeconds: 2287,
          chapterLabel: "Template Conditionals and Logic",
        },
        {
          title: "Svelte 5 Basics - Complete Svelte 5 Course for Beginners",
          channel: "Syntax",
          url: "https://www.youtube.com/watch?v=8DQailPy3q8",
          videoId: "8DQailPy3q8",
          durationLabel: "1:49:48",
          startSeconds: 3013,
          chapterLabel: "How CSS Works In Svelte",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "svelte-components-markup-q1",
          prompt:
            "A user types into the first input, then the first item is removed with `items.shift()`. What do the two remaining rows show?\n\n```svelte\n{#each items as item}\n  <li><input /> {item}</li>\n{/each}\n```",
          options: [
            "`b` with the text typed for `a` still in its input, and `c` with an empty input",
            "`b` and `c`, both with empty inputs",
            "`a` with the typed text, then `b` — the list doesn't shrink until the next tick",
            "All three rows, because `shift()` isn't tracked",
          ],
          correctIndex: 0,
          explanation:
            "Without a key, Svelte patches each block in place by index: the first `<li>` is reused for `b`, so DOM state that Svelte doesn't own — the input's value — stays with the position. `{#each items as item (item)}` makes Svelte move and remove the right block.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-components-markup-q2",
          prompt: "What is `{#key value}...{/key}` for?",
          options: [
            "Destroying and recreating its contents whenever `value` changes",
            "Giving an `{#each}` block a key when the items have no id",
            "Memoizing its contents so they only render once per `value`",
            "Marking a block as a hydration boundary",
          ],
          correctIndex: 0,
          explanation:
            "It's the remount escape hatch: new component instances, fresh local state, transitions replayed. Keys for `{#each}` go in parentheses after the `as` clause instead.",
        },
        {
          id: "svelte-components-markup-q3",
          prompt:
            "Which of these are valid Svelte markup expressions? (Select all that apply.)",
          options: [
            "`{ok ? 'yes' : 'no'}`",
            "`{items.filter((i) => i.done).length}`",
            "`{const label = 'x'}`",
            "`{if (ok) { return message }}`",
            "`{#each items as { id, title } (id)}`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 4],
          explanation:
            "Each `{...}` holds one expression, so declarations and statements are rejected — inside a block, `{@const label = 'x'}` is the supported form. Destructuring in an `{#each}` head is fine.",
        },
        {
          id: "svelte-components-markup-q4",
          prompt:
            "Why do the `a` and `img` rules do nothing here?\n\n```svelte\n<article>{@html content}</article>\n\n<style>\n  article a { color: hotpink }\n  article img { width: 100% }\n</style>\n```",
          options: [
            "Scoped styles only apply to elements the compiler saw in the markup, and `{@html}` content is created at runtime",
            "`{@html}` renders into a shadow root, which blocks outside styles",
            "Descendant selectors are not supported inside a scoped `<style>` block",
            "The elements exist but the rules are overridden by the browser's user-agent stylesheet",
          ],
          correctIndex: 0,
          explanation:
            "Scoping works by putting a generated class on compiled elements; injected HTML never gets one, so the compiler also reports these selectors as unused. `article :global(a)` reaches inside.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-components-markup-q5",
          prompt: "What is the difference between `<script>` and `<script module>` in a component?",
          options: [
            "`<script>` runs once per component instance; `<script module>` runs once for the module, so its values are shared by every instance",
            "`<script module>` runs on the server only, `<script>` on the client only",
            "`<script module>` is the Svelte 5 name for `<script context=\"client\">`",
            "They are the same; `module` only changes how the bundler treats imports",
          ],
          correctIndex: 0,
          explanation:
            "`<script module>` is the replacement for Svelte 4's `<script context=\"module\">` — module-level constants, shared counters, exported helpers. It can't reference instance state, because there isn't one yet.",
        },
        {
          id: "svelte-components-markup-q6",
          prompt: "Which are correct ways to let a parent influence a child component's styling? (Select all that apply.)",
          options: [
            "Pass a class name as a prop and apply it inside the child",
            "Have the child read CSS custom properties that the parent sets",
            "Wrap the child selector in `:global(...)` in the parent's styles",
            "Write `.child-button { … }` in the parent's `<style>` and rely on scoping to reach the child",
            "Import the child's `.svelte` file into the parent's `<style>` block",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Scoping deliberately stops at the component boundary, so an unqualified selector for a child's internals matches nothing and gets removed. Custom properties are the cleanest option because they inherit through the boundary by design.",
        },
        {
          id: "svelte-components-markup-q7",
          prompt:
            "What does `{#await}` render before the promise settles?\n\n```svelte\n{#await getUser()}\n  <p>loading…</p>\n{:then user}\n  <p>{user.name}</p>\n{:catch error}\n  <p>{error.message}</p>\n{/await}\n```",
          options: [
            "The `loading…` paragraph, and during SSR it renders the pending branch too",
            "Nothing, because Svelte waits for the promise before rendering the block",
            "The `{:then}` branch with `user` as `undefined`",
            "The `{:catch}` branch until the promise resolves",
          ],
          correctIndex: 0,
          explanation:
            "The pending branch is what you get until the promise settles, on the server as well — which is why a page that streams its data usually shows a skeleton in the server-rendered HTML.",
        },
        {
          id: "svelte-components-markup-q8",
          prompt: "Which is true of `class:active={isActive}` compared with `class={isActive ? 'active' : ''}`?",
          options: [
            "The directive toggles just that one class and composes with a separate `class` attribute",
            "The directive is evaluated once at creation, the attribute on every update",
            "The attribute form is required when the class name contains a hyphen",
            "The directive only works on components, not on DOM elements",
          ],
          correctIndex: 0,
          explanation:
            "`class:` is additive, so you can keep a static `class` and toggle extras. Since 5.16 the plain `class` attribute also accepts objects and arrays, which covers most of the same ground.",
        },
        {
          id: "svelte-components-markup-q9",
          prompt:
            "What does this render?\n\n```svelte\n{#each { length: 3 } as _, i}\n  <span>{i}</span>\n{/each}\n```",
          options: [
            "`012` — `{#each}` accepts anything array-like and `i` is the zero-based index",
            "`123` — the index starts at 1",
            "Nothing, because the value isn't an array",
            "A compiler error: `{#each}` requires an iterable",
          ],
          correctIndex: 0,
          explanation:
            "`{#each}` takes arrays, array-likes (anything with a `length`) and iterables, and the second binding is always the zero-based index. Svelte has no `{#each n in 3}` integer form, unlike Vue's `v-for=\"n in 3\"`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-components-markup-q10",
          prompt: "Where is `{@const total = items.length}` allowed?",
          options: [
            "Only as an immediate child of a block such as `{#each}`, `{#if}`, `{#snippet}` or a component with children",
            "Anywhere in the markup, like a JavaScript `const`",
            "Only inside `<script>`",
            "Only inside `{#each}` blocks",
          ],
          correctIndex: 0,
          explanation:
            "`{@const}` declares a local for one block instance, which is how you compute per-iteration values without a helper function. At the top level of the markup it's a compiler error — put it in `<script>` instead.",
        },
      ],
    },
    {
      id: "svelte-state-deep-reactivity",
      moduleId: "fe-svelte",
      trackId: "frontend",
      title: "$state and the Proxy Model",
      summary:
        "`let count = $state(0)` looks like a plain variable and behaves like one — `count++` is the update API. Under the hood the compiler rewrites every read into a signal read and every write into a signal write, which is why there is no `.value`, no setter function and no stale-closure class of bug: code always reads the live value.\n\nWhen the initial value is an **array or a plain object**, `$state` returns a *state proxy* instead, and reactivity goes deep: `todos[0].done = true` and `todos.push(…)` both trigger exactly the subscribers that read those properties. Proxying is recursive but lazy — a nested object is wrapped the first time you read it, and the same raw object always maps to the same proxy — and it stops at anything that isn't a plain object or an array. Class instances, `Map`, `Set`, `Date`, `URL` and objects made with `Object.create(null)` are handed back untouched, so mutating them notifies nobody. That is the single most common Svelte 5 bug report. The fixes are to declare `$state` on class *fields* (the compiler turns them into get/set pairs backed by signals), or to use the reactive `SvelteMap`, `SvelteSet`, `SvelteDate` and `SvelteURL` from `svelte/reactivity`.\n\nThe other sharp edges are identity and cost. A state proxy is not the object you passed in, so holding on to the raw object and mutating that changes nothing; and writing state to an external library, `structuredClone` or a `fetch` body should go through `$state.snapshot(value)`, which returns a plain deep clone. Destructuring is evaluated once, like any JavaScript destructuring, so `const { done } = todos[0]` gives you a dead copy. For large payloads you never mutate in place, `$state.raw` skips proxying entirely — the value can only be *replaced*, not mutated, which is both cheaper and a useful constraint.",
      level: "advanced",
      estMinutes: 80,
      isMilestone: true,
      webRefs: [
        { label: "Svelte: $state", url: "https://svelte.dev/docs/svelte/$state", kind: "docs" },
        { label: "Svelte tutorial: Deep state", url: "https://svelte.dev/tutorial/svelte/deep-state", kind: "docs" },
        { label: "Svelte: svelte/reactivity (SvelteMap, SvelteSet, SvelteDate)", url: "https://svelte.dev/docs/svelte/svelte-reactivity", kind: "docs" },
        { label: "MDN: Proxy", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy", kind: "docs" },
      ],
      video: {
        title: "How Svelte Reactivity Works",
        channel: "Joy of Code",
        url: "https://www.youtube.com/watch?v=M5oAYP6Rxkg",
        videoId: "M5oAYP6Rxkg",
        durationLabel: "18:48",
      },
      alternateVideos: [
        {
          title: "The Complete Svelte 5 Course For The Most Loved JavaScript Framework",
          channel: "Joy of Code",
          url: "https://www.youtube.com/watch?v=B2MhkPtBWs4",
          videoId: "B2MhkPtBWs4",
          durationLabel: "3:14:31",
          startSeconds: 1406,
          chapterLabel: "Deeply Reactive State",
        },
        {
          title: "The Svelte 5 Reactivity Guide",
          channel: "Joy of Code",
          url: "https://www.youtube.com/watch?v=tErKyuUTzsM",
          videoId: "tErKyuUTzsM",
          durationLabel: "21:40",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Build the proxy half of `$state`: `deepState(value, onChange)` and `snapshot(value)`.\n\n`deepState(value, onChange)` returns a deeply reactive proxy of `value`, following Svelte's own rules:\n\n- Only **arrays** and **plain objects** (prototype exactly `Object.prototype`) are proxied. Anything else — primitives, `null`, class instances, `Map`, `Set`, `Date`, functions — is returned unchanged, so mutating it notifies nobody.\n- Nested values are wrapped **lazily, when they are read**, and one raw object always maps to one proxy: `s.user === s.user` must be `true`.\n- Writing a property calls `onChange(path)` with the property path from the root as an array of strings (`[\"user\", \"name\"]`). Array indices arrive as strings (`\"0\"`, `\"length\"`).\n- A write only notifies if it is a real change: adding a key that didn't exist notifies, and overwriting a value with one that is `Object.is`-equal does not. Deleting an existing key notifies once; deleting a key that isn't there doesn't.\n- Assigning a plain object or array into the proxy makes it reactive from then on.\n\n`snapshot(value)` returns a plain, proxy-free deep clone of arrays and plain objects, and returns anything else by reference. Assume the input has no cycles.\n\nTip: `arr.push(x)` reads `length`, writes the new index (which already extends the array) and then writes `length`. With the `Object.is` guard in place that produces exactly one notification.\n\nThe tests call `runStateScenario(name)`, which runs one of the scenarios in the driver and returns plain data. Leave the driver as it is.",
        starterCode: STATE_STARTER,
        functionName: "runStateScenario",
        testCases: [
          {
            description: "writing a top-level property notifies with its path; writing the same value doesn't",
            args: ["topLevel"],
            expected: { changes: ["count", "count"], count: 2 },
          },
          {
            description: "nested objects and arrays are reactive, with the full path",
            args: ["nested"],
            expected: { changes: ["user.name", "user.tags.1", "user.tags.0"], tags: ["z", "y"] },
          },
          {
            description: "an Object.is-equal write is not a change",
            args: ["sameValue"],
            expected: { changes: ["count"], count: 1 },
            isEdgeCase: true,
          },
          {
            description: "Map, Date and class instances are left alone, so mutating them notifies nothing",
            args: ["notPlain"],
            expected: { changes: [], sameMap: true, sameCounter: true, isMap: true, n: 1, mapValue: 2 },
            isEdgeCase: true,
          },
          {
            description: "one raw object maps to one proxy, and the proxy is never the raw object",
            args: ["identity"],
            expected: { stable: true, notRaw: true, rootNotRaw: true },
          },
          {
            description: "arrays stay arrays; push notifies once and index writes notify",
            args: ["arrays"],
            expected: { changes: ["2", "0"], isArray: true, value: [9, 2, 3], length: 3 },
            isEdgeCase: true,
          },
          {
            description: "an object assigned into the proxy becomes reactive too",
            args: ["assignObject"],
            expected: { changes: ["user", "user.name"], name: "Evan" },
          },
          {
            description: "deleting an existing key notifies once; deleting it again doesn't",
            args: ["deleteKey"],
            expected: { changes: ["a"], keys: ["b"] },
            isEdgeCase: true,
          },
          {
            description: "snapshot returns a detached plain clone, so mutating it notifies nothing",
            args: ["snapshotIsPlain"],
            expected: {
              changes: [],
              snap: { user: { name: "Grace" }, list: [1, [2, 3]] },
              live: { user: { name: "Ada" }, list: [1, [2]] },
            },
          },
          {
            description: "1,000 writes produce 1,000 notifications",
            args: ["many"],
            expected: { count: 1000, n: 1000 },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "svelte-derived",
      moduleId: "fe-svelte",
      trackId: "frontend",
      title: "$derived and the Dependency Graph",
      summary:
        "`$derived(expression)` is computed state: anything reactive the expression reads *synchronously* becomes a dependency, and the value is recalculated when one of them changes. `$derived.by(() => { … })` is the same thing with a function body when the expression won't fit on one line. Unlike React's `useMemo` there is no dependency array to forget, and unlike a `$effect` that assigns to another `$state` there is no extra render pass and no moment where the two values disagree.\n\nWhat makes it efficient is **push-pull**. A write pushes invalidation through the graph immediately, marking everything downstream as possibly stale, but a derived does not recompute until someone actually reads it. Reads are therefore lazy and cached: a derived nobody looks at costs nothing, and a diamond (`a → b, c → d`) recomputes `d` once per change, not once per path. On top of that, if a recomputed value is referentially identical to the previous one, downstream work is skipped entirely — `let large = $derived(count > 10)` does not disturb anything that reads `large` while `count` moves from 0 to 9. Dependencies are re-collected on every run, so a branch that is no longer taken stops triggering recomputation.\n\nTwo things surprise people. Deriveds are **not** deeply proxied the way `$state` is: `$derived(items[i])` hands back the underlying state proxy, so mutating it writes through to `items`, and deriving a fresh object literal produces a new reference every time, which defeats the referential-equality skip. And since 5.25 a derived is writable — you can assign to it for optimistic UI, and it reverts to the computed value the next time a dependency changes. Assignments inside the expression itself are still rejected: a derived must be a pure function of its inputs, because the runtime decides when, and whether, it runs.",
      level: "advanced",
      estMinutes: 80,
      webRefs: [
        { label: "Svelte: $derived", url: "https://svelte.dev/docs/svelte/$derived", kind: "docs" },
        { label: "Svelte tutorial: Derived state", url: "https://svelte.dev/tutorial/svelte/derived-state", kind: "docs" },
        { label: "Svelte blog: Introducing runes", url: "https://svelte.dev/blog/runes", kind: "article" },
        { label: "sveltejs/svelte: client reactivity internals", url: "https://github.com/sveltejs/svelte/tree/main/packages/svelte/src/internal/client/reactivity", kind: "repo" },
      ],
      video: {
        title: "The Complete Svelte 5 Course For The Most Loved JavaScript Framework",
        channel: "Joy of Code",
        url: "https://www.youtube.com/watch?v=B2MhkPtBWs4",
        videoId: "B2MhkPtBWs4",
        durationLabel: "3:14:31",
        startSeconds: 1690,
        chapterLabel: "Derived State",
      },
      alternateVideos: [
        {
          title: "Svelte 5 runes: what's the deal with getters and setters?",
          channel: "Rich Harris",
          url: "https://www.youtube.com/watch?v=NR8L5m73dtE",
          videoId: "NR8L5m73dtE",
          durationLabel: "11:22",
        },
        {
          title: "How Svelte Reactivity Works",
          channel: "Joy of Code",
          url: "https://www.youtube.com/watch?v=M5oAYP6Rxkg",
          videoId: "M5oAYP6Rxkg",
          durationLabel: "18:48",
          startSeconds: 574,
          chapterLabel: "Signals From Scratch",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `createGraph()`, which returns `{ state, derived, effect }` — the push-pull core behind `$state`, `$derived` and `$effect`.\n\n- `state(initial)` returns `{ get(), set(value) }`. `set` does nothing if the value is `Object.is`-equal to the current one.\n- `derived(fn)` returns `{ get() }`. It is **lazy** (the function doesn't run until `get()` is called), **cached** (repeated reads with no change run it once), and only recomputes on the first read *after* a dependency actually changed.\n- `effect(fn)` runs `fn` immediately, re-runs it when a dependency changes, and returns `stop()`, which unsubscribes it permanently.\n- Dependencies are whatever was read during the last run, so a branch that is no longer taken must stop triggering.\n- **Push-pull:** a `set` should mark dependents as possibly-stale and queue the affected effects, without recomputing any derived. Then, before running a queued effect, check whether its dependencies really changed — pulling any stale derived to find out. If a derived recomputes to a value that is `Object.is`-equal to its previous value, the effect must **not** run.\n- A diamond (`a` → `b` and `c` → `d`) must recompute `d` once per change to `a`, and run a reading effect once.\n\nEffects run synchronously here, at the end of `set`; the real Svelte batches them into a microtask, but everything else about the algorithm is the same. A version counter per node that only increments when the value changes makes the equality skip and the staleness check fall out naturally.\n\nThe tests call `runGraphScenario(name)`, which runs one scenario and returns plain data (values seen, run counts). Leave the driver as it is.",
        starterCode: DERIVED_STARTER,
        functionName: "runGraphScenario",
        testCases: [
          { description: "an effect re-runs with the derived value when the source changes", args: ["basic"], expected: { seen: [0, 2, 4], effectRuns: 3 } },
          {
            description: "a derived nobody reads never runs, however often the source changes",
            args: ["lazyNoRead"],
            expected: { before: 0, during: 0, after: 1, value: 200 },
            isEdgeCase: true,
          },
          { description: "repeated reads with no change compute once", args: ["cached"], expected: { reads: [6, 6, 6], getterRuns: 1 } },
          {
            description: "a derived whose value doesn't change doesn't re-run its readers",
            args: ["equalitySkip"],
            expected: { seen: [false, true], effectRuns: 2, getterRuns: 5 },
            isEdgeCase: true,
          },
          {
            description: "a diamond recomputes the shared derived once and runs the effect once",
            args: ["diamond"],
            expected: { seen: [4, 7], effectRuns: 2, getterRuns: 2 },
            isEdgeCase: true,
          },
          {
            description: "dependencies are re-collected, so an untaken branch stops triggering",
            args: ["dynamicDeps"],
            expected: { seen: ["A", "B2"], afterUnrelated: 1, effectRuns: 2 },
            isEdgeCase: true,
          },
          { description: "writing state the effect never read doesn't re-run it", args: ["unrelated"], expected: { seen: [0, 1], effectRuns: 2 } },
          { description: "changes propagate through a chain of deriveds", args: ["chain"], expected: { seen: [4, 6, 8], effectRuns: 3 } },
          { description: "stop() unsubscribes the effect for good", args: ["stop"], expected: { seen: [0, 1], effectRuns: 2 } },
          {
            description: "500 effects on 500 sources: one write re-runs exactly one of them",
            args: ["manyEffects"],
            expected: { afterSetup: 500, effectRuns: 501 },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "svelte-effect",
      moduleId: "fe-svelte",
      trackId: "frontend",
      title: "$effect, and Why It's Usually the Wrong Tool",
      summary:
        "`$effect` runs a function after the component mounts and again, in a microtask, whenever the reactive values it read last time change. Re-runs are batched and happen after the DOM has been updated, and an effect may return a teardown function that runs immediately before the next run and when the effect is destroyed. It exists for the things that genuinely live outside the reactive graph: drawing on a canvas, wiring up a third-party chart, analytics, a `MutationObserver`.\n\nThe official framing is that `$effect` is an escape hatch, not a workhorse. The moment you write `$effect(() => { doubled = count * 2 })` you have chosen the strictly worse tool: `$derived` is lazy, cached, glitch-free and runs during SSR, while the effect version only runs in the browser, needs an extra update pass, and briefly leaves `doubled` disagreeing with `count`. Two effects that write each other's state produce an infinite loop that Svelte aborts with `effect_update_depth_exceeded`. Keeping two inputs in sync is better served by an `oninput` handler or a **function binding**, `bind:value={() => left, updateLeft}`; work that must happen once on mount belongs in `onMount`; work that must happen in response to a click belongs in the click handler, where it is easier to read and can't loop.\n\nThe tracking rule catches everyone at least once: only values read **synchronously** during the effect body become dependencies. Anything read after an `await`, inside a `setTimeout`, or in a callback you hand to someone else is invisible. Equally, an effect depends on the exact signal it read — `$effect(() => { obj; })` never re-runs when `obj.value` changes, because `obj` is never reassigned, while `$effect(() => { obj.value; })` does. `untrack(() => …)` opts a read out of tracking, which is the normal fix when you must read one value and react only to another. The variants are worth knowing: `$effect.pre` runs before the DOM updates (autoscroll, measuring), `$effect.root` creates a scope that doesn't clean itself up so you can own the lifetime, and `$effect.tracking()` tells library code whether it is being read reactively. None of them run during server-side rendering.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Svelte: $effect", url: "https://svelte.dev/docs/svelte/$effect", kind: "docs" },
        { label: "Svelte tutorial: Effects", url: "https://svelte.dev/tutorial/svelte/effects", kind: "docs" },
        { label: "Svelte: Lifecycle hooks (onMount vs effects)", url: "https://svelte.dev/docs/svelte/lifecycle-hooks", kind: "docs" },
        { label: "React docs: You Might Not Need an Effect", url: "https://react.dev/learn/you-might-not-need-an-effect", kind: "article" },
      ],
      video: {
        title: "The Complete Svelte 5 Course For The Most Loved JavaScript Framework",
        channel: "Joy of Code",
        url: "https://www.youtube.com/watch?v=B2MhkPtBWs4",
        videoId: "B2MhkPtBWs4",
        durationLabel: "3:14:31",
        startSeconds: 2595,
        chapterLabel: "When Not To Use Effects",
      },
      alternateVideos: [
        {
          title: "Svelte 5 Runes Demystified (3/4) - Why You Should Never Use $effects When You Can Use $deriveds!",
          channel: "Peter Makes Websites Ltd",
          url: "https://www.youtube.com/watch?v=HFTxHu614OU",
          videoId: "HFTxHu614OU",
          durationLabel: "28:24",
        },
        {
          title: "Svelte 5 Basics - Complete Svelte 5 Course for Beginners",
          channel: "Syntax",
          url: "https://www.youtube.com/watch?v=8DQailPy3q8",
          videoId: "8DQailPy3q8",
          durationLabel: "1:49:48",
          startSeconds: 4891,
          chapterLabel: "$effect & lifecycle",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "svelte-effect-q1",
          prompt:
            "Which values does this effect depend on?\n\n```js\n$effect(() => {\n  const ctx = canvas.getContext('2d');\n  ctx.fillStyle = color;\n\n  setTimeout(() => {\n    ctx.fillRect(0, 0, size, size);\n  }, 0);\n});\n```",
          options: [
            "`canvas` and `color` only — `size` is read asynchronously, so it isn't tracked",
            "`canvas`, `color` and `size`",
            "`color` and `size` only",
            "None — reads inside a rune callback are never tracked",
          ],
          correctIndex: 0,
          explanation:
            "Only synchronous reads during the effect body register as dependencies. Anything read after an `await` or inside a timer or callback runs outside the tracking context, so changes to `size` never re-run this effect.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-effect-q2",
          prompt:
            "`state` is `$state({ value: 0 })` and the button does `state.value += 1`. Which of these effects re-run on a click? (Select all that apply.)",
          options: [
            "`$effect(() => { state.value; })`",
            "`$effect(() => { console.log('state changed'); })`",
            "`$effect(() => { console.log(JSON.stringify(state)); })`",
            "`$effect(() => { state; })`",
            "`$effect(() => { untrack(() => state.value); })`",
          ],
          correctIndex: 0,
          correctIndices: [0, 2],
          explanation:
            "An effect depends on the signals it read. Reading `state` alone reads a variable that is never reassigned, so nothing changes for it; reading `state.value` — directly or via `JSON.stringify`, which walks the proxy — does. `untrack` deliberately opts out.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-effect-q3",
          prompt: "When does an effect's returned teardown function run? (Select all that apply.)",
          options: [
            "Immediately before the effect re-runs",
            "When the component that owns the effect is destroyed",
            "When a parent effect re-runs and recreates it",
            "After every DOM update, whether or not the effect's dependencies changed",
            "Once on mount, before the first run",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Teardown is tied to the effect's own lifetime: before each re-run and at destruction, including when a parent effect tears down its children. It never runs before the first run, and unrelated DOM updates don't trigger it.",
        },
        {
          id: "svelte-effect-q4",
          prompt:
            "What is wrong with this, and what should replace it?\n\n```svelte\n<script>\n  let count = $state(0);\n  let doubled = $state();\n\n  $effect(() => {\n    doubled = count * 2;\n  });\n</script>\n```",
          options: [
            "It syncs state with an effect; `let doubled = $derived(count * 2)` is lazy, cached and works during SSR",
            "It needs `$effect.pre` so `doubled` is set before the DOM updates",
            "It needs `untrack(() => doubled)` to avoid an infinite loop",
            "Nothing — this is the idiomatic way to derive a value in Svelte 5",
          ],
          correctIndex: 0,
          explanation:
            "This is the canonical anti-pattern. The effect only runs in the browser and only after the DOM has already rendered the stale value, so the first paint shows `doubled` as `undefined`. `$derived` has none of those problems.",
        },
        {
          id: "svelte-effect-q5",
          prompt: "What happens during server-side rendering with `$effect`?",
          options: [
            "Effects don't run at all on the server",
            "Effects run once on the server, without their teardown functions",
            "Effects run on the server but writes to state are ignored",
            "Only `$effect.pre` runs on the server",
          ],
          correctIndex: 0,
          explanation:
            "Effects are browser-only, which is exactly why deriving data in one breaks server-rendered markup. `$derived` and template expressions do run during SSR.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-effect-q6",
          prompt: "What distinguishes `$effect.pre` from `$effect`?",
          options: [
            "It runs before the DOM updates that are scheduled after it, which suits measuring or autoscrolling",
            "It runs before the component mounts, so refs are not yet available",
            "It runs synchronously on every state write rather than in a microtask",
            "It runs during SSR as well as in the browser",
          ],
          correctIndex: 0,
          explanation:
            "Only the timing differs — tracking, teardown and batching are identical. Reading `scrollHeight` before the new messages land, then scrolling after `tick()`, is the textbook use.",
        },
        {
          id: "svelte-effect-q7",
          prompt:
            "Two range inputs are kept in sync like this. What happens?\n\n```js\nconst total = 100;\nlet spent = $state(0);\nlet left = $state(total);\n\n$effect(() => { left = total - spent; });\n$effect(() => { spent = total - left; });\n```",
          options: [
            "Svelte aborts with `effect_update_depth_exceeded` — the two effects keep invalidating each other",
            "It works, because Svelte deduplicates writes that produce the same value",
            "Only the first effect ever runs; the second is dead code",
            "It works in the browser but throws during hydration",
          ],
          correctIndex: 0,
          explanation:
            "Each effect writes state the other reads, so the flush never settles and Svelte bails out. Derive one from the other, or use a function binding: `bind:value={() => left, updateLeft}`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-effect-q8",
          prompt: "What is `$effect.root` for?",
          options: [
            "Creating an effect scope outside component initialisation that you destroy yourself",
            "Registering the single top-level effect that drives the whole app",
            "Running an effect before any other effect in the tree",
            "Making an effect survive hot module replacement",
          ],
          correctIndex: 0,
          explanation:
            "It returns a `destroy` function and doesn't auto-clean-up, which is how libraries create effects from a module or a class rather than from a component's setup.",
        },
        {
          id: "svelte-effect-q9",
          prompt: "Which of these are reasonable jobs for `$effect`? (Select all that apply.)",
          options: [
            "Redrawing a `<canvas>` when its inputs change",
            "Initialising and tearing down a third-party map library",
            "Logging an analytics event when a filter changes",
            "Computing a filtered list from a search term",
            "Copying a prop into local state so the child can edit it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The good cases all reach outside the reactive graph. A filtered list is `$derived`; an editable copy of a prop is a `$state` initialised once, or `$bindable` if the parent should see the edits.",
        },
        {
          id: "svelte-effect-q10",
          prompt: "You need a value on mount only — measuring an element's width once. What's the most appropriate tool?",
          options: [
            "`onMount`, which runs once after mount and doesn't track anything",
            "`$effect` with an empty dependency list",
            "`$effect.pre`, because the element exists earlier",
            "`$derived.by`, reading the element from `bind:this`",
          ],
          correctIndex: 0,
          explanation:
            "`$effect` has no dependency array — you can't pin it to \"run once\", and any reactive read inside will re-run it. `onMount` says what you mean. `$derived` must stay pure, so measuring the DOM in one is wrong.",
        },
      ],
    },
    {
      id: "svelte-props-bindable",
      moduleId: "fe-svelte",
      trackId: "frontend",
      title: "$props, $bindable and Two-Way Binding",
      summary:
        "`let { adjective = 'happy', ...rest } = $props()` is the whole props API in Svelte 5: one call, destructured like any object, with JavaScript's own syntax giving you fallbacks, renaming (`{ super: trouper }`) and rest props. It replaces `export let`, `$$props` and `$$restProps` in one stroke. The destructured bindings stay live — the compiler rewrites `adjective` back into a property read on the props object — so there is no need for `toRefs`-style ceremony, and a prop read inside a `$derived` or `$effect` tracks correctly.\n\nProps flow one way, and Svelte enforces that more firmly than it looks. You may *reassign* a prop locally (useful for ephemeral, unsaved edits, and it is overwritten the next time the parent changes it), but you should not *mutate* one. Mutating a plain object passed by the parent silently does nothing, because plain objects aren't reactive; mutating a state proxy the parent owns does work but logs an `ownership_invalid_mutation` warning, because the child is writing state it doesn't own. A fallback value is deliberately not turned into a state proxy either, so `let { options = { sort: 'asc' } } = $props()` gives you an object whose mutations update nothing when the prop is absent.\n\nWhen data genuinely needs to flow back up, opt the prop in with `$bindable()`: `let { value = $bindable(), ...props } = $props()`. In Svelte 4 every `export let` was implicitly bindable; in runes mode nothing is, which makes the contract visible at the declaration site. The parent may still pass a plain prop — `bind:` is the parent's choice — but if the prop has a fallback *and* the parent binds to it, the parent must pass a defined value, so there's no ambiguity about who owns the initial value. Two other things moved: `bind:` to a component's `export const` is an error in runes mode (use `bind:this` and read the export off the instance), and `$props.id()` gives you an id that's stable across server render and hydration, which is what `for`/`aria-labelledby` pairs need.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Svelte: $props", url: "https://svelte.dev/docs/svelte/$props", kind: "docs" },
        { label: "Svelte: $bindable", url: "https://svelte.dev/docs/svelte/$bindable", kind: "docs" },
        { label: "Svelte: bind:", url: "https://svelte.dev/docs/svelte/bind", kind: "docs" },
        { label: "Svelte: v5 migration guide (props and bindings)", url: "https://svelte.dev/docs/svelte/v5-migration-guide", kind: "article" },
      ],
      video: {
        title: "The Complete Svelte 5 Course For The Most Loved JavaScript Framework",
        channel: "Joy of Code",
        url: "https://www.youtube.com/watch?v=B2MhkPtBWs4",
        videoId: "B2MhkPtBWs4",
        durationLabel: "3:14:31",
        startSeconds: 6537,
        chapterLabel: "Svelte Components",
      },
      alternateVideos: [
        {
          title: "Svelte 5 Basics - Complete Svelte 5 Course for Beginners",
          channel: "Syntax",
          url: "https://www.youtube.com/watch?v=8DQailPy3q8",
          videoId: "8DQailPy3q8",
          durationLabel: "1:49:48",
          startSeconds: 985,
          chapterLabel: "Props",
        },
        {
          title: "Svelte 5 Basics - Complete Svelte 5 Course for Beginners",
          channel: "Syntax",
          url: "https://www.youtube.com/watch?v=8DQailPy3q8",
          videoId: "8DQailPy3q8",
          durationLabel: "1:49:48",
          startSeconds: 1472,
          chapterLabel: "Binding Values",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "svelte-props-bindable-q1",
          prompt:
            "What is `rest` here, given `<Button class=\"big\" type=\"submit\" onclick={go} label=\"Go\" />`?\n\n```js\nlet { label, ...rest } = $props();\n```",
          options: [
            "`{ class: 'big', type: 'submit', onclick: go }`",
            "`{ label: 'Go', class: 'big', type: 'submit', onclick: go }`",
            "`{}` — rest props need `$props.rest()`",
            "Only the attributes that aren't event handlers",
          ],
          correctIndex: 0,
          explanation:
            "`$props()` returns a plain object, so ordinary rest destructuring works and `label` is excluded. Spreading `{...rest}` onto the inner element is the standard wrapper-component pattern; event handlers are just properties and come along.",
        },
        {
          id: "svelte-props-bindable-q2",
          prompt:
            "The parent renders `<Child object={{ count: 0 }} />`. Clicking the button in the child does nothing. Why?\n\n```svelte\n<script>\n  let { object } = $props();\n</script>\n\n<button onclick={() => object.count += 1}>{object.count}</button>\n```",
          options: [
            "The object literal is a plain object, not state, so nothing tracks its properties",
            "Props are frozen, so the assignment throws in development",
            "The child needs `$bindable()` before it can read nested properties",
            "The parent re-creates the object on every render, discarding the change",
          ],
          correctIndex: 0,
          explanation:
            "Reactivity comes from `$state`, not from being a prop. Had the parent written `let object = $state({ count: 0 })`, the mutation would work — but with an `ownership_invalid_mutation` warning, since the child doesn't own it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-props-bindable-q3",
          prompt: "Which statements about `$bindable` are true? (Select all that apply.)",
          options: [
            "In runes mode a prop is not bindable unless it's declared with `$bindable()`",
            "The parent can pass the prop normally, without `bind:`",
            "If the bindable prop has a fallback value, a parent that uses `bind:` must pass a defined value",
            "`$bindable()` makes the prop two-way for every parent automatically",
            "`$bindable()` can only be used on props whose value is an object",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`$bindable` marks a prop as *bindable*; whether binding actually happens is the parent's decision. Requiring a defined value alongside a fallback avoids the parent and child disagreeing about the initial value.",
        },
        {
          id: "svelte-props-bindable-q4",
          prompt: "How did bindability change from Svelte 4 to Svelte 5's runes mode?",
          options: [
            "Every `export let` was bindable in Svelte 4; in runes mode you opt in per prop with `$bindable()`",
            "Binding was removed entirely in favour of callback props",
            "Bindings now require `bind:value|local` to avoid updating the parent",
            "Nothing changed; `$bindable()` is only a type-level annotation",
          ],
          correctIndex: 0,
          explanation:
            "Making it explicit means a reader of the child can see which props flow both ways, and lets Svelte skip the extra update cycle Svelte 4 needed to reflect default values back to the parent.",
        },
        {
          id: "svelte-props-bindable-q5",
          prompt:
            "Clicking the child's button shows `1`, then the parent's button is clicked. What does the child show?\n\n```svelte\n<!-- Child.svelte -->\n<script>\n  let { count } = $props();\n</script>\n<button onclick={() => count += 1}>child: {count}</button>\n```",
          options: [
            "The parent's new value — a locally reassigned prop is overwritten when the prop changes",
            "`1`, because the child now owns its copy",
            "`2`, because the two increments are added together",
            "It throws: props are read-only",
          ],
          correctIndex: 0,
          explanation:
            "Reassigning a prop is allowed and useful for ephemeral edits, but the prop remains the source of truth: the next update from the parent wins. For lasting local state, initialise a `$state` from the prop.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-props-bindable-q6",
          prompt:
            "The parent renders `<Child />` with no props. Clicking does nothing. Why?\n\n```svelte\n<script>\n  let { object = { count: 0 } } = $props();\n</script>\n<button onclick={() => object.count += 1}>{object.count}</button>\n```",
          options: [
            "A prop's fallback value isn't turned into a state proxy, so mutating it isn't reactive",
            "Fallback values are frozen at compile time",
            "The fallback is recreated on every read, discarding the mutation",
            "Fallbacks only apply when the prop is `null`, not when it is missing",
          ],
          correctIndex: 0,
          explanation:
            "Fallbacks are left as plain values on purpose. If the child needs mutable local state, declare it with `$state`, e.g. `let object = $state(props.object ?? { count: 0 })`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-props-bindable-q7",
          prompt: "What is `$props.id()` for?",
          options: [
            "Generating an id unique to the component instance that matches between server render and hydration",
            "Reading the `id` attribute the parent passed in",
            "Giving each item in an `{#each}` block a stable key",
            "Identifying the component in devtools",
          ],
          correctIndex: 0,
          explanation:
            "Added in 5.20, it solves the `<label for>` / `aria-labelledby` problem without a random id that would differ between server and client and break hydration.",
        },
        {
          id: "svelte-props-bindable-q8",
          prompt:
            "Given `things = { a: 'x', c: 'y' }`, what props does `<Widget a=\"b\" {...things} c=\"d\" />` receive?",
          options: [
            "`a: 'x'`, `c: 'd'` — later entries win, in source order",
            "`a: 'b'`, `c: 'y'` — explicit attributes always win over a spread",
            "`a: 'x'`, `c: 'y'` — the spread replaces everything",
            "It's a compile error: you can't mix a spread with explicit attributes",
          ],
          correctIndex: 0,
          explanation:
            "Spreads and explicit attributes are merged strictly left to right, exactly like object spread. Putting `{...props}` first means callers can override; putting it last means they can't.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-props-bindable-q9",
          prompt: "A child has `export const focus = () => input.focus()`. The parent writes `<Child bind:focus />` and gets an error. What's the fix?",
          options: [
            "`<Child bind:this={child} />`, then call `child.focus()`",
            "Declare it as `let { focus = $bindable() } = $props()`",
            "Export it from `<script module>` instead",
            "Wrap the child in `<svelte:component>`",
          ],
          correctIndex: 0,
          explanation:
            "Runes mode keeps props and exports separate: you can't `bind:` to an export. `bind:this` gives you the instance, and exports are read off it.",
        },
        {
          id: "svelte-props-bindable-q10",
          prompt: "How do you type props in a `<script lang=\"ts\">` component?",
          options: [
            "Annotate the destructuring: `let { adjective }: { adjective: string } = $props()`",
            "Pass a type argument: `$props<{ adjective: string }>()`",
            "Declare `export let adjective: string` as in Svelte 4",
            "Add a `Props` export that Svelte picks up automatically",
          ],
          correctIndex: 0,
          explanation:
            "`$props()` is typed by annotating the declaration, usually with a named `interface Props`. Snippet props are typed with the `Snippet` type imported from `svelte`.",
        },
      ],
    },
    {
      id: "svelte-events",
      moduleId: "fe-svelte",
      trackId: "frontend",
      title: "Events Are Just Properties",
      summary:
        "Svelte 5 deleted its event system. A DOM listener is an attribute — `<button onclick={handler}>` — which means it takes the shorthand (`{onclick}`), can be spread (`{...props}`), and can be passed down a component tree like any other value. A component \"event\" is now simply a function prop: the parent passes `onsave={…}` and the child calls `onsave(payload)`. `createEventDispatcher` and the `on:` directive still work for unmigrated Svelte 4 components but are deprecated, and the old `CustomEvent` round-trip — construct an event, dispatch it, unwrap `event.detail` on the other side — is gone along with the allocation it cost for events nobody was listening to.\n\nThe practical consequences are mostly pleasant and occasionally sharp. Event attributes are **case sensitive**: `onclick` listens for `click`, `onClick` listens for a `Click` event that almost certainly doesn't exist, and this is deliberate so custom events with capitals still work. Modifiers are gone, because `onclick|preventDefault` isn't valid attribute syntax — call `event.preventDefault()` in the handler. The three modifiers that can't be expressed as a wrapper, because they affect how the listener is *registered*, are handled differently: capture becomes a name suffix (`onclickcapture`), and `ontouchstart`/`ontouchmove` are registered passive automatically for scroll performance, so calling `preventDefault()` in one does nothing.\n\nThe subtlety worth internalising is **delegation**. For about two dozen common events — `click`, `input`, `keydown`, `pointermove` and friends — Svelte attaches a single listener at the application root and dispatches along the event's path, which keeps memory flat on large lists. That means an event you construct yourself needs `{ bubbles: true }` to reach the root at all, and a handler attached with raw `addEventListener` that calls `stopPropagation()` can stop the delegated handlers from ever running. Use the `on` function from `svelte/events` instead of `addEventListener` when you need an imperative listener: it preserves the ordering Svelte expects. One more ordering rule: event attributes always fire *after* bindings, so `bind:value` is already up to date by the time `oninput` runs.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Svelte: Basic markup — Events", url: "https://svelte.dev/docs/svelte/basic-markup", kind: "docs" },
        { label: "Svelte: svelte/events (the on function)", url: "https://svelte.dev/docs/svelte/svelte-events", kind: "docs" },
        { label: "Svelte: v5 migration guide — Event changes", url: "https://svelte.dev/docs/svelte/v5-migration-guide", kind: "article" },
        { label: "Svelte: legacy on: directive", url: "https://svelte.dev/docs/svelte/legacy-on", kind: "docs" },
      ],
      video: {
        title: "Svelte 5 Basics - Complete Svelte 5 Course for Beginners",
        channel: "Syntax",
        url: "https://www.youtube.com/watch?v=8DQailPy3q8",
        videoId: "8DQailPy3q8",
        durationLabel: "1:49:48",
        startSeconds: 1637,
        chapterLabel: "Events",
      },
      alternateVideos: [
        {
          title: "The Complete Svelte 5 Course For The Most Loved JavaScript Framework",
          channel: "Joy of Code",
          url: "https://www.youtube.com/watch?v=B2MhkPtBWs4",
          videoId: "B2MhkPtBWs4",
          durationLabel: "3:14:31",
          startSeconds: 5685,
          chapterLabel: "Listening To Events",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "svelte-events-q1",
          prompt: "A developer writes `<button onClick={handler}>` and the handler never fires. Why?",
          options: [
            "Event attributes are case sensitive: `onClick` listens for a `Click` event, not `click`",
            "Handlers must be wrapped in an arrow function",
            "Only lowercase DOM events can be used as attributes; components need `on:`",
            "`onClick` is reserved for the React compatibility layer",
          ],
          correctIndex: 0,
          explanation:
            "Svelte doesn't lowercase the name, so that custom events containing capitals stay addressable. The linter usually catches this one; the fix is simply `onclick`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-events-q2",
          prompt: "A Svelte 4 child used `createEventDispatcher()` and `dispatch('save', item)`. What is the Svelte 5 equivalent?",
          options: [
            "The parent passes `onsave={handleSave}` and the child calls `onsave(item)`",
            "The child dispatches a `CustomEvent` with `bubbles: true` and the parent uses `onsave`",
            "The child exports a `save` store the parent subscribes to",
            "The child calls `$host().dispatchEvent(new CustomEvent('save'))`",
          ],
          correctIndex: 0,
          explanation:
            "Component events are callback props now — no `CustomEvent`, no `.detail`, and the payload is whatever you pass. (`$host()` exists, but only for components compiled as custom elements.)",
        },
        {
          id: "svelte-events-q3",
          prompt: "Which of these work in Svelte 5 runes mode? (Select all that apply.)",
          options: [
            "`<button {onclick}>` as shorthand for `onclick={onclick}`",
            "`<button {...buttonProps}>` where `buttonProps` contains an `onclick`",
            "`<button onclickcapture={handler}>` to listen during the capture phase",
            "`<button onclick|once={handler}>` to run the handler once",
            "`<form onsubmit|preventDefault={handleSubmit}>`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Because handlers are attributes, shorthand and spreading come for free. Modifiers were directive syntax and are gone — call `event.preventDefault()` yourself, or track \"once\" in the handler; only `capture` survives, as a name suffix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-events-q4",
          prompt:
            "Code elsewhere does `el.dispatchEvent(new CustomEvent('click'))` on an element that has `onclick={handler}` in a Svelte 5 component. The handler doesn't run. Why?",
          options: [
            "`click` is a delegated event, so the listener lives at the app root and the event needs `{ bubbles: true }` to get there",
            "Synthetic events are ignored because `event.isTrusted` is `false`",
            "`CustomEvent` can't be used with a native event name",
            "The handler is only attached after the first real user interaction",
          ],
          correctIndex: 0,
          explanation:
            "Svelte delegates roughly two dozen common events to a single root listener to keep memory flat. A manually constructed event that doesn't bubble never reaches it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-events-q5",
          prompt: "Why does the `svelte/events` docs recommend its `on` function over `addEventListener` for imperative listeners?",
          options: [
            "It preserves ordering relative to Svelte's delegated handlers and handles `stopPropagation` correctly",
            "It automatically removes the listener when the component is destroyed",
            "`addEventListener` isn't available inside Svelte components",
            "It converts the listener into a passive one for performance",
          ],
          correctIndex: 0,
          explanation:
            "Listeners added directly inside the app root run before declaratively attached handlers deeper in the tree, in both phases, and a raw `stopPropagation` can stop delegated handlers running at all. `on` returns an unlisten function, but doesn't auto-clean-up.",
        },
        {
          id: "svelte-events-q6",
          prompt: "Calling `event.preventDefault()` inside an `ontouchmove` handler has no effect. Why?",
          options: [
            "Svelte registers `ontouchstart` and `ontouchmove` as passive listeners by default",
            "Touch events can never be cancelled on any platform",
            "The handler runs after the browser has already scrolled",
            "`preventDefault` only works on delegated events",
          ],
          correctIndex: 0,
          explanation:
            "Passive touch listeners let the browser scroll immediately instead of waiting to see whether you'll cancel. If you really need to cancel, attach the listener yourself with the `on` function from `svelte/events` and `{ passive: false }`.",
        },
        {
          id: "svelte-events-q7",
          prompt:
            "An `<input bind:value={text} oninput={log}>` — what does `text` hold inside `log`?",
          options: [
            "The new value: event attributes always fire after bindings have updated",
            "The previous value, because bindings flush after handlers",
            "It depends on whether the input is controlled",
            "`undefined` until the next microtask",
          ],
          correctIndex: 0,
          explanation:
            "Svelte guarantees that binding updates land before the corresponding event attribute runs, so you don't need `tick()` to read the value you just typed.",
        },
        {
          id: "svelte-events-q8",
          prompt: "How does a wrapper component forward all of a caller's event handlers to its inner `<button>` in Svelte 5?",
          options: [
            "Collect them with rest props and spread: `let { children, ...rest } = $props()` then `<button {...rest}>`",
            "Write `<button on:click on:focus on:blur>` to forward each one",
            "Call `createEventDispatcher()` and re-dispatch each event",
            "Use `<svelte:fragment forward>`",
          ],
          correctIndex: 0,
          explanation:
            "Since handlers are ordinary properties, forwarding is just spreading — one of the clearest wins from the change. Bare `on:click` forwarding was the Svelte 4 idiom and is legacy syntax now.",
        },
        {
          id: "svelte-events-q9",
          prompt: "What did the Svelte team gain by deprecating `createEventDispatcher`? (Select all that apply.)",
          options: [
            "No `CustomEvent` object is allocated for events that have no listener",
            "Component events can be typed as ordinary function props",
            "Handlers can be passed further down as values, like any other prop",
            "Component events now bubble through the DOM like native events",
            "Event handlers can be attached before the component mounts",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Callback props are cheaper, easier to type and composable. Component events never bubbled through the DOM in Svelte 4 either, and they still don't — they're function calls.",
        },
        {
          id: "svelte-events-q10",
          prompt: "You're migrating `<div on:click|stopPropagation|once={handle}>`. Which Svelte 5 version is closest?",
          options: [
            "`<div onclick={(e) => { e.stopPropagation(); if (!done) { done = true; handle(e); } }}>`",
            "`<div onclickonce={(e) => { e.stopPropagation(); handle(e); }}>`",
            "`<div onclick|stopPropagation|once={handle}>` — modifiers still work on attributes",
            "`<div use:modifiers={['stopPropagation', 'once']} onclick={handle}>`",
          ],
          correctIndex: 0,
          explanation:
            "Modifiers that only wrap the call become ordinary code in the handler; `svelte/legacy` exports helpers such as `preventDefault` as a migration crutch, but writing it out is clearer. Only `capture` has a name-suffix form.",
        },
      ],
    },
    {
      id: "svelte-snippets",
      moduleId: "fe-svelte",
      trackId: "frontend",
      title: "Snippets and {@render}",
      summary:
        "A snippet is a reusable chunk of markup declared with `{#snippet name(params)}…{/snippet}` and rendered with `{@render name(args)}`. It is the replacement for slots, which are deprecated in Svelte 5, and it is a strictly more powerful one: a snippet takes real parameters (with defaults and destructuring, though no rest parameters), obeys lexical scope, can call itself recursively, and — this is the part that matters — is an ordinary value in the template, so it can be passed to a component as a prop, chosen with a ternary (`{@render (wide ? a : b)()}`), or stored in a variable.\n\nThat single mechanism collapses several Svelte 4 concepts. Content written between a component's tags becomes the implicit `children` prop, so `{@render children()}` is what a default slot used to be; snippets declared directly inside a component's tags become props of that name, which covers named slots; and parameters replace `let:` directives, so a `<Table>` can hand each row's data to the caller's `row` snippet without any special syntax. The escape hatches are `{@render children?.()}` for a snippet that might not be passed, or an `{#if children}…{:else}` block when you want fallback content.\n\nScope is where people trip. A snippet is visible to its siblings and to their children, not to anything above or beside the block it was declared in, so a snippet defined inside an `{#each}` can't be rendered outside it. Snippets declared at the top level of a component can be exported from `<script module>` (5.5+) and reused elsewhere, but only if they touch nothing from the instance `<script>` — which is the compiler telling you a module-level snippet has no instance to close over. For TypeScript, a snippet's type is `Snippet` from `svelte`, with a tuple type argument for its parameters: `Snippet<[Row]>`.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Svelte: {#snippet ...}", url: "https://svelte.dev/docs/svelte/snippet", kind: "docs" },
        { label: "Svelte: {@render ...}", url: "https://svelte.dev/docs/svelte/@render", kind: "docs" },
        { label: "Svelte tutorial: Snippets and render tags", url: "https://svelte.dev/tutorial/svelte/snippets-and-render-tags", kind: "docs" },
        { label: "Svelte: legacy <slot> elements", url: "https://svelte.dev/docs/svelte/legacy-slots", kind: "docs" },
      ],
      video: {
        title: "Use Svelte 5 Snippets To Reuse Markup Without Creating Components",
        channel: "Joy of Code",
        url: "https://www.youtube.com/watch?v=OlWWIbRz438",
        videoId: "OlWWIbRz438",
        durationLabel: "17:41",
      },
      alternateVideos: [
        {
          title: "The Complete Svelte 5 Course For The Most Loved JavaScript Framework",
          channel: "Joy of Code",
          url: "https://www.youtube.com/watch?v=B2MhkPtBWs4",
          videoId: "B2MhkPtBWs4",
          durationLabel: "3:14:31",
          startSeconds: 8245,
          chapterLabel: "Snippets",
        },
        {
          title: "Svelte 5 Basics - Complete Svelte 5 Course for Beginners",
          channel: "Syntax",
          url: "https://www.youtube.com/watch?v=8DQailPy3q8",
          videoId: "8DQailPy3q8",
          durationLabel: "1:49:48",
          startSeconds: 3422,
          chapterLabel: "Snippets aka Inline Components",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "svelte-snippets-q1",
          prompt: "A component is used as `<Card>Hello</Card>`. How does `Card.svelte` render that content?",
          options: [
            "`let { children } = $props()` then `{@render children()}`",
            "`<slot />`, which is still the Svelte 5 default",
            "`{@render $$slots.default()}`",
            "`{@html children}`",
          ],
          correctIndex: 0,
          explanation:
            "Content between a component's tags becomes an implicit `children` snippet prop. `<slot>` still compiles for unmigrated components but is deprecated, and `$$slots` is legacy-mode only.",
        },
        {
          id: "svelte-snippets-q2",
          prompt: "Which of these are true of snippets but were not true of Svelte 4 slots? (Select all that apply.)",
          options: [
            "They take parameters as ordinary function arguments",
            "They are values, so one can be chosen with a ternary and rendered",
            "They can call themselves recursively",
            "They can be styled by the component that renders them without `:global`",
            "They render their content into a shadow DOM boundary",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Slots needed `let:` directives for data and couldn't be referenced as values at all. Styling still follows ordinary scoping — the markup belongs to the component that *declared* the snippet — and nothing involves shadow DOM.",
        },
        {
          id: "svelte-snippets-q3",
          prompt:
            "Which render tag is a compile error?\n\n```svelte\n<div>\n  {#snippet x()}\n    {#snippet y()}...{/snippet}\n    {@render y()}   <!-- A -->\n  {/snippet}\n  {@render y()}     <!-- B -->\n</div>\n{@render x()}       <!-- C -->\n```",
          options: [
            "B and C — `y` isn't visible outside the snippet that declares it, and `x` isn't visible outside the `<div>`",
            "B only — a snippet declared inside a `<div>` is visible anywhere in the component",
            "C only — a snippet can always be rendered by its siblings",
            "None of them; snippets are hoisted to the top of the component",
          ],
          correctIndex: 0,
          explanation:
            "Snippets follow lexical scope: visible to siblings and to their children, nothing else. `y` lives inside `x`, and `x` lives inside the `<div>`, so only the render tag marked A is legal.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-snippets-q4",
          prompt: "A component's `children` prop is optional. Which renders it safely, with nothing shown when it isn't passed?",
          options: [
            "`{@render children?.()}`",
            "`{@render children() ?? ''}`",
            "`{#if children}{children}{/if}`",
            "`{@render children ?? noop}`",
          ],
          correctIndex: 0,
          explanation:
            "Optional chaining on the call is the documented form. A snippet is not markup until it's rendered, so interpolating it with `{children}` prints nothing useful, and `{@render}` needs a call expression.",
        },
        {
          id: "svelte-snippets-q5",
          prompt: "How do you type a snippet prop that receives one row object?",
          options: [
            "`row: Snippet<[Row]>`, importing `Snippet` from `svelte`",
            "`row: Snippet<Row>`",
            "`row: (row: Row) => string`",
            "`row: SvelteComponent<Row>`",
          ],
          correctIndex: 0,
          explanation:
            "The type argument is a **tuple** of the parameters, because snippets can take more than one. Pairing it with `<script lang=\"ts\" generics=\"T\">` lets `data: T[]` and `row: Snippet<[T]>` refer to the same type.",
        },
        {
          id: "svelte-snippets-q6",
          prompt:
            "Why does this fail to compile?\n\n```svelte\n<script>\n  let { user } = $props();\n</script>\n\n<script module>\n  export { greeting };\n</script>\n\n{#snippet greeting()}\n  <p>Hello {user.name}</p>\n{/snippet}\n```",
          options: [
            "An exported snippet can't reference anything from the instance `<script>` — there's no instance when another component renders it",
            "Snippets can only be exported from a `.svelte.js` file",
            "`<script module>` must come before the instance `<script>`",
            "Exported snippets can't take zero parameters",
          ],
          correctIndex: 0,
          explanation:
            "Module-level exports are shared by every instance, so a snippet that closes over `user` has nothing to close over. Pass the data as a snippet parameter instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-snippets-q7",
          prompt: "What is the difference between passing `{header}` as an attribute and writing `{#snippet header()}…{/snippet}` between a component's tags?",
          options: [
            "Nothing functional — a snippet declared inside a component's tags implicitly becomes a prop of that name",
            "The attribute form is evaluated eagerly, the inline form lazily",
            "The inline form can access the component's internal state; the attribute form cannot",
            "Only the attribute form can be typed with `Snippet`",
          ],
          correctIndex: 0,
          explanation:
            "The inline form is an authoring convenience for the same thing, and it's what makes named slots unnecessary. Either way the snippet closes over the *parent's* scope, not the child's.",
        },
        {
          id: "svelte-snippets-q8",
          prompt: "Which of these is **not** valid in a snippet declaration?",
          options: [
            "`{#snippet row(...cells)}` — rest parameters",
            "`{#snippet row(item, index = 0)}` — a default value",
            "`{#snippet row({ name, qty })}` — a destructured parameter",
            "`{#snippet row(a, b, c)}` — several parameters",
          ],
          correctIndex: 0,
          explanation:
            "Defaults, destructuring and multiple parameters all work; rest parameters are explicitly not supported. That also keeps the `Snippet<[…]>` tuple type honest.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-snippets-q9",
          prompt: "When is a snippet a better choice than extracting a child component?",
          options: [
            "When the markup repeats within one component and needs that component's local scope",
            "When the markup needs its own state and lifecycle",
            "When the markup will be reused across several routes",
            "When the markup must be server-rendered",
          ],
          correctIndex: 0,
          explanation:
            "Snippets are markup reuse without the ceremony of props and a file — they read their surrounding scope directly. Anything that needs its own state, effects or a public prop contract is a component.",
        },
        {
          id: "svelte-snippets-q10",
          prompt: "What does `{@render (compact ? compactRow : fullRow)(item)}` demonstrate?",
          options: [
            "That a render tag accepts any expression that evaluates to a snippet, because snippets are values",
            "That render tags support the same modifiers as event attributes",
            "That snippets can be composed with `{@const}` only",
            "That the compiler inlines both branches and picks one at build time",
          ],
          correctIndex: 0,
          explanation:
            "Being first-class values is the structural difference from slots: you can select, pass and store them. Both branches exist at runtime; the choice is made when the render tag evaluates.",
        },
      ],
    },
    {
      id: "svelte-stores",
      moduleId: "fe-svelte",
      trackId: "frontend",
      title: "Stores Alongside Runes",
      summary:
        "Before Svelte 5, stores were how you shared state between components and how you extracted reactive logic. Runes took most of that work: shared state is now a `$state` object exported from a `.svelte.js` module, and reusable logic is a function that returns getters. The docs are explicit that these use cases have \"greatly diminished\", and `svelte/store` is not going anywhere but is no longer the default answer.\n\nWhat survives is the **store contract**, which is genuinely useful and refreshingly small: an object with a `subscribe(fn)` method that calls `fn` immediately and synchronously with the current value, calls it again synchronously on every change, and returns an unsubscribe function. Optionally a `set(value)`. That's it — no class, no import, no framework coupling, which is why any object implementing it (including an RxJS Observable, near enough) can be used with the `$store` prefix in a component. The `$` prefix is compiler magic: it declares the variable, subscribes at initialisation and unsubscribes on destroy, and assignments to `$store` compile to `store.set(...)`. It only works for a store declared at the top level of a component, not inside an `if` block or a function.\n\nReach for a store when the thing you're modelling really is a **stream** — a WebSocket feed, a geolocation watcher, a debounced query, anything with a subscription lifecycle — because `writable(value, start)` gives you exactly the hook runes don't: `start` runs when the first subscriber arrives and its return value runs when the last one leaves, so the socket is open only while something is watching. `derived` composes those streams and inherits the same laziness. The details worth knowing: `set` skips notification when the new value is `===` the old one *and* is a primitive, but always notifies for objects and functions (they may have been mutated in place), and `NaN` replacing `NaN` is not a change; `get(store)` works by subscribing, reading and unsubscribing, so it is not free in a hot path. Note also that SvelteKit moved its own `page`, `navigating` and `updated` from stores in `$app/stores` to rune-based objects in `$app/state` in 2.12 — the same shift, in the framework's own code.",
      level: "advanced",
      estMinutes: 75,
      webRefs: [
        { label: "Svelte: Stores and the store contract", url: "https://svelte.dev/docs/svelte/stores", kind: "docs" },
        { label: "Svelte: svelte/store API", url: "https://svelte.dev/docs/svelte/svelte-store", kind: "docs" },
        { label: "Svelte tutorial: Stores", url: "https://svelte.dev/tutorial/svelte/stores", kind: "docs" },
        { label: "sveltejs/svelte: the store implementation", url: "https://github.com/sveltejs/svelte/blob/main/packages/svelte/src/store/shared/index.js", kind: "repo" },
      ],
      video: {
        title: "Using Svelte Stores With Svelte 5 Runes To Create Runed Stores",
        channel: "Joy of Code",
        url: "https://www.youtube.com/watch?v=GdZZGnAOwu0",
        videoId: "GdZZGnAOwu0",
        durationLabel: "18:58",
      },
      alternateVideos: [
        {
          title: "The Complete Svelte 5 Course For The Most Loved JavaScript Framework",
          channel: "Joy of Code",
          url: "https://www.youtube.com/watch?v=B2MhkPtBWs4",
          videoId: "B2MhkPtBWs4",
          durationLabel: "3:14:31",
          startSeconds: 3745,
          chapterLabel: "Reactive Global State",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `svelte/store` from the contract: `safeNotEqual`, `writable`, `readable` and `derived`.\n\n**`safeNotEqual(a, b)`** decides whether replacing `a` with `b` counts as a change:\n\n- If `a` is `NaN`, it's a change only when `b` is not `NaN`.\n- Otherwise it's a change when `a !== b`, **or** when `a` is a non-null object, **or** when `a` is a function — those may have been mutated in place, so a store can't assume they're unchanged.\n\n**`writable(value, start)`** returns `{ set, update, subscribe }`:\n\n- `subscribe(run)` adds `run`, calls it immediately with the current value, and returns an unsubscribe function.\n- `set(next)` stores `next` when `safeNotEqual` says it changed, then calls every current subscriber synchronously, in subscription order. `update(fn)` is `set(fn(currentValue))`.\n- `start(set, update)` runs when the subscriber count goes from 0 to 1; whatever it returns is called when the count drops back to 0, and `start` runs again if a new subscriber arrives later.\n- While `start` is running there is no stop function yet, so a `set` from inside `start` updates the value **without** notifying — the initial value is then delivered once by the `run(value)` that follows. Getting this right is what keeps a derived store from firing twice on subscribe.\n\n**`readable(value, start)`** exposes only `subscribe`.\n\n**`derived(stores, fn)`** takes one store or an array of stores and returns a readable whose value is `fn(value)` or `fn([...values])`. It subscribes to its sources only while it has subscribers, and unsubscribes from all of them when its last subscriber leaves. Don't call `fn` until every source has produced its first value — subscribe to them all, then compute once.\n\nThe tests call `runStoreScenario(name)`, which runs one scenario and returns the log it produced. Leave the driver as it is.",
        starterCode: STORES_STARTER,
        functionName: "runStoreScenario",
        testCases: [
          { description: "subscribe calls back immediately with the current value", args: ["immediate"], expected: ["one:a", "one:b"] },
          { description: "every subscriber is notified, in subscription order", args: ["order"], expected: ["one:0", "two:0", "one:1", "two:1"] },
          { description: "unsubscribing stops the callbacks", args: ["unsubscribe"], expected: ["0", "1"] },
          {
            description: "an identical primitive is not a change, but any object is",
            args: ["equality"],
            expected: ["1", "2", '{"n":1}', '{"n":1}', '{"n":1}'],
            isEdgeCase: true,
          },
          { description: "NaN replacing NaN is not a change", args: ["notANumber"], expected: ["1", "NaN", "0"], isEdgeCase: true },
          {
            description: "start runs on the first subscriber, stop on the last, and start runs again afterwards",
            args: ["startStop"],
            expected: ["start", "a", "b", "stop", "start", "c", "stop"],
            isEdgeCase: true,
          },
          { description: "update applies a function to the current value", args: ["updates"], expected: ["1", "2", "20"] },
          { description: "a derived store recomputes when either source changes", args: ["derivedPair"], expected: ["3", "12", "30"] },
          { description: "derived also accepts a single store", args: ["derivedSingle"], expected: ["4", "10"] },
          {
            description: "a derived store touches its sources only once it has a subscriber, and delivers the initial value once",
            args: ["derivedLazy"],
            expected: ["created", "source-start", "got:0", "source-stop"],
            isEdgeCase: true,
          },
          {
            description: "unsubscribing from a derived store unsubscribes from its sources",
            args: ["derivedCleanup"],
            expected: ["start", "got:2", "got:4", "stop"],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "svelte-context",
      moduleId: "fe-svelte",
      trackId: "frontend",
      title: "Context and Cross-Request Safety",
      summary:
        "Context attaches a value to a component and makes it readable by that component and everything below it, without threading props through the middle. The modern form is `createContext<T>()`, added in 5.40, which returns a `[get, set, has]` triplet — you export it from a module, the parent calls `set(value)`, descendants call `get()`, and TypeScript knows the type without a key. The older `setContext(key, value)` / `getContext(key)` pair still works and accepts any value as a key; when two ancestors set the same key, the nearest one wins.\n\nLike lifecycle functions, both must run **during component initialisation** — synchronously in `<script>`, not inside a click handler, a `setTimeout` or after an `await`. That constraint is what lets the compiler resolve context from the component tree rather than from a runtime stack, and it's why a \"get the context lazily when the user opens the menu\" design has to be rewritten to read it up front and close over the result.\n\nThe reason context matters more on the server than people expect is **cross-request pollution**. A `$state` object exported from a module is a singleton in the server process: if a page writes the logged-in user into it during SSR, the next request — a different user — can read it. Context is created per component tree, and a tree is created per render, so it isn't shared between requests. That makes \"set it in the root layout, read it anywhere\" the standard SvelteKit pattern for request-scoped data, while module-level `$state` stays fine for genuinely global, non-user-specific things.\n\nThe gotcha when you put reactive state in context is that you pass the **object**, not the variable. Mutate `counter.count = 0` and every consumer sees it; reassign `counter = { count: 0 }` in the provider and you've swapped your local binding for a new object while consumers still hold the old one — Svelte warns when it can detect this. Primitives have the same problem in sharper form: put a getter function in context instead of a number, or wrap it in a small object or class.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Svelte: Context", url: "https://svelte.dev/docs/svelte/context", kind: "docs" },
        { label: "Svelte tutorial: Context API", url: "https://svelte.dev/tutorial/svelte/context-api", kind: "docs" },
        { label: "SvelteKit: State management (cross-request pollution)", url: "https://svelte.dev/docs/kit/state-management", kind: "article" },
      ],
      video: {
        title: "The Complete Svelte 5 Course For The Most Loved JavaScript Framework",
        channel: "Joy of Code",
        url: "https://www.youtube.com/watch?v=B2MhkPtBWs4",
        videoId: "B2MhkPtBWs4",
        durationLabel: "3:14:31",
        startSeconds: 8395,
        chapterLabel: "The Context API",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "svelte-context-q1",
          prompt:
            "Why does this throw?\n\n```svelte\n<script>\n  import { getContext } from 'svelte';\n\n  function openMenu() {\n    const theme = getContext('theme');\n  }\n</script>\n\n<button onclick={openMenu}>Menu</button>\n```",
          options: [
            "`getContext` must be called during component initialisation, not from a handler that runs later",
            "`getContext` can only be called in a component that also calls `setContext`",
            "The key must be a Symbol, not a string",
            "Context can only be read inside `$effect`",
          ],
          correctIndex: 0,
          explanation:
            "Context is resolved from the component tree while the component is being created; by the time a click handler runs there's no initialisation context to look it up in. Read it in `<script>` and close over the value.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-context-q2",
          prompt: "Who can read a value passed to `setContext('user', value)` in a layout component?",
          options: [
            "That component and every descendant, including content passed in as children",
            "Every component in the app, since context is global",
            "Only direct children, one level down",
            "Only components that also call `setContext` with the same key",
          ],
          correctIndex: 0,
          explanation:
            "Context flows down the component tree and includes slotted or snippet content rendered inside it. Siblings and ancestors can't see it, which is the point — it's scoped, not global.",
        },
        {
          id: "svelte-context-q3",
          prompt:
            "The provider sets `setCounter(counter)` where `counter = $state({ count: 0 })`. The reset button stops working after this change. Why?\n\n```svelte\n<button onclick={() => counter = { count: 0 }}>reset</button>\n```",
          options: [
            "Reassigning `counter` points the local variable at a new object; consumers still hold the original proxy",
            "Context values are frozen after initialisation",
            "`$state` objects can't be replaced, only mutated through `$state.raw`",
            "The button needs `bind:` to write back into context",
          ],
          correctIndex: 0,
          explanation:
            "Context passes the object by reference, so the shared thing is the proxy, not the binding. Mutate it — `counter.count = 0` — and every consumer updates. Svelte warns when it can detect the broken link.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-context-q4",
          prompt: "You want to share a reactive **number** through context. What actually works?",
          options: [
            "Put a getter function (or an object/class holding the value) in context, not the number itself",
            "Call `setContext('n', n)` — the compiler keeps the binding live",
            "Call `setContext('n', $state(n))`",
            "Wrap it with `$state.raw` before passing it",
          ],
          correctIndex: 0,
          explanation:
            "`setContext('n', n)` passes the number's current value, which is a snapshot — JavaScript is pass-by-value. A getter, an object or a class instance with a `$state` field keeps the link live.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-context-q5",
          prompt: "Which are genuine reasons to prefer context over a `$state` object exported from a `.svelte.js` module? (Select all that apply.)",
          options: [
            "Module state is a singleton in the server process, so writing user data to it during SSR can leak into the next request",
            "Two independent instances of the same widget need separate state",
            "A subtree needs to override the value for its own descendants",
            "Context values are automatically serialised into the server-rendered HTML",
            "Context is faster to read than a module import",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Context is per component tree, and a tree is per render — which gives request isolation, per-instance state and shadowing by the nearest provider. It has no serialisation behaviour of its own, and read cost isn't the argument.",
        },
        {
          id: "svelte-context-q6",
          prompt: "What does `createContext<T>()` return, and why is it preferred over `setContext`/`getContext`?",
          options: [
            "A `[get, set, has]` triplet, typed as `T`, so there's no string key to keep in sync and no cast on read",
            "A Svelte component that provides the value to its children",
            "A store whose value is the context",
            "A class you extend to create typed providers",
          ],
          correctIndex: 0,
          explanation:
            "Exporting the triplet from a module gives both sides the same typed handle. With raw `getContext(key)` the return type is whatever you assert it is, and the key is a string two files have to agree on.",
        },
        {
          id: "svelte-context-q7",
          prompt: "Two ancestors both call `setContext('theme', …)`. What does a deeply nested `getContext('theme')` return?",
          options: [
            "The value from the nearest ancestor that set it",
            "The value from the outermost ancestor",
            "An array of both values",
            "It throws: duplicate context keys are not allowed",
          ],
          correctIndex: 0,
          explanation:
            "Context shadows like lexical scope, which is how a nested section can override a theme for its own subtree. `getAllContexts()` returns the merged map if you ever need to inspect it.",
        },
        {
          id: "svelte-context-q8",
          prompt: "A component calls `setContext('a', 1)` and then, further down its own `<script>`, `getContext('a')`. What happens?",
          options: [
            "It returns `1` — a component can read the context it set, as long as the read comes after the set",
            "It returns `undefined` — context is only visible to descendants",
            "It throws, because a component can't read its own context",
            "It returns the ancestor's value for `'a'`, ignoring the local one",
          ],
          correctIndex: 0,
          explanation:
            "The value is associated with the current component, so the component itself sees it too — but only from `getContext` calls that run after the `setContext`, since both execute in source order during initialisation.",
        },
        {
          id: "svelte-context-q9",
          prompt: "A component test mounts a component that calls `getContext` and fails. What's the documented fix?",
          options: [
            "Mount a small wrapper function that calls the context setter and then renders the component",
            "Call `setContext` inside the test before `mount`",
            "Pass a `context` option to `mount`",
            "Stub the `svelte` module's `getContext` export",
          ],
          correctIndex: 0,
          explanation:
            "Since 5.49 you can pass a wrapper function to `mount`, `hydrate` or `render` that sets context and then calls the component. Each mount gets its own wrapper instance, so context doesn't leak between tests.",
        },
        {
          id: "svelte-context-q10",
          prompt: "Where should a SvelteKit app put the current user so every page can read it safely?",
          options: [
            "Set it from `data` in the root `+layout.svelte` via context, and read it with the context getter",
            "Export a `$state` object from `src/lib/user.svelte.js` and assign to it in the root layout",
            "Store it in `localStorage` and read it in `onMount`",
            "Re-fetch it in every page's `load` function",
          ],
          correctIndex: 0,
          explanation:
            "Context is created per render, so the value can't bleed into another user's request during SSR. Module-level `$state` assigned during SSR is exactly the cross-request pollution the SvelteKit docs warn about.",
        },
      ],
    },
    {
      id: "svelte-transitions",
      moduleId: "fe-svelte",
      trackId: "frontend",
      title: "Transitions and Animations",
      summary:
        "Animating elements in and out is one of the places Svelte is plainly ahead: `transition:fade` on an element inside an `{#if}` block is the whole API. `transition:` is **bidirectional** — interrupt a fade-in halfway and it reverses from where it is — while `in:` and `out:` are separate, one-way transitions that restart rather than reverse. `svelte/transition` ships `fade`, `fly`, `slide`, `scale`, `blur`, `draw` and `crossfade`, all parameterised (`transition:fly={{ y: 200, duration: 400 }}`). When a block is leaving, everything inside it stays in the DOM until every transition in it has finished, so you don't have to coordinate that yourself.\n\nA transition function is just a function returning `{ delay, duration, easing, css, tick }`, and the choice between `css` and `tick` is a real performance decision. `css(t, u)` is called ahead of time to build a keyframe animation, which the browser runs through the Web Animations API — off the main thread, so it stays smooth while JavaScript is busy. `tick(t, u)` runs on every frame on the main thread and is only worth it for things CSS can't express, such as typewriter text. `crossfade` returns a `[send, receive]` pair keyed by value, which is how an element appears to fly from one list to another when it's really two elements.\n\n`animate:flip` is a different mechanism and often confused with transitions. It runs only when items in a **keyed** `{#each}` block are reordered — not when they're added or removed — and the directive must be on an immediate child of that block. It works by measuring the element's `DOMRect` before and after (First, Last, Invert, Play) and animating the difference. For value-level motion rather than element motion, `svelte/motion` gives you the `Tween` and `Spring` classes (Svelte 5.8+; the older `tweened` and `spring` stores are deprecated), where you set `.target` and read `.current`.\n\nThe accessibility trap is specific and worth memorising: transitions are driven by the Web Animations API, not CSS, so the usual global `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms } }` rule does **not** affect them. Import `prefersReducedMotion` from `svelte/motion` and set the duration to 0 yourself.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Svelte: transition:", url: "https://svelte.dev/docs/svelte/transition", kind: "docs" },
        { label: "Svelte: animate:", url: "https://svelte.dev/docs/svelte/animate", kind: "docs" },
        { label: "Svelte: svelte/transition (fade, fly, crossfade…)", url: "https://svelte.dev/docs/svelte/svelte-transition", kind: "docs" },
        { label: "Svelte tutorial: Deferred transitions (crossfade)", url: "https://svelte.dev/tutorial/svelte/deferred-transitions", kind: "docs" },
      ],
      video: {
        title: "The Complete Svelte 5 Course For The Most Loved JavaScript Framework",
        channel: "Joy of Code",
        url: "https://www.youtube.com/watch?v=B2MhkPtBWs4",
        videoId: "B2MhkPtBWs4",
        durationLabel: "3:14:31",
        startSeconds: 8850,
        chapterLabel: "Transitions",
      },
      alternateVideos: [
        {
          title: "Impossible FLIP Layout Animations With Svelte And GSAP",
          channel: "Joy of Code",
          url: "https://www.youtube.com/watch?v=ecP8RwpkiQw",
          videoId: "ecP8RwpkiQw",
          durationLabel: "22:54",
        },
        {
          title: "Svelte 5 Basics - Complete Svelte 5 Course for Beginners",
          channel: "Syntax",
          url: "https://www.youtube.com/watch?v=8DQailPy3q8",
          videoId: "8DQailPy3q8",
          durationLabel: "1:49:48",
          startSeconds: 5566,
          chapterLabel: "Animations",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "svelte-transitions-q1",
          prompt: "What's the difference between `transition:fade` and `in:fade out:fade`?",
          options: [
            "`transition:` is bidirectional and reverses smoothly if interrupted; `in:`/`out:` are independent and restart",
            "`transition:` only runs on mount; `in:`/`out:` run on every state change",
            "`in:`/`out:` can take parameters, `transition:` cannot",
            "`transition:` is a Svelte 4 alias kept for compatibility",
          ],
          correctIndex: 0,
          explanation:
            "Interrupting a bidirectional transition reverses it from its current position. With `in:`/`out:` the outro plays alongside the intro rather than reversing it, which is what you want when the two directions look different.",
        },
        {
          id: "svelte-transitions-q2",
          prompt:
            "A team adds a global `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important } }` rule. Svelte's `fly` transitions still play at full length. Why?",
          options: [
            "Svelte transitions run through the Web Animations API, which that CSS rule doesn't touch",
            "The rule targets pseudo-elements only, and Svelte animates the host element",
            "`!important` is stripped from scoped Svelte styles",
            "The rule applies, but Svelte restarts the animation after the CSS finishes",
          ],
          correctIndex: 0,
          explanation:
            "This is called out explicitly in the docs. Import `prefersReducedMotion` from `svelte/motion` and pass `duration: prefersReducedMotion.current ? 0 : 400` — the CSS media query can't reach a WAAPI animation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-transitions-q3",
          prompt: "Which statements about `animate:flip` are true? (Select all that apply.)",
          options: [
            "It only runs when the index of an existing item in a keyed `{#each}` changes",
            "It must be on an element that is an immediate child of the keyed `{#each}` block",
            "It measures the element's position before and after the DOM update and animates the difference",
            "It also animates items being added to or removed from the list",
            "It works on any element, whether or not it's inside an `{#each}`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "FLIP is a reordering technique — First, Last, Invert, Play — so additions and removals are the job of `transition:`/`in:`/`out:`. Combining the two on the same element is the usual sortable-list recipe.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-transitions-q4",
          prompt: "When writing a custom transition, when should you return `tick` instead of `css`?",
          options: [
            "Only when the effect can't be expressed in CSS, such as revealing text character by character",
            "Whenever you need easing, since `css` ignores the easing function",
            "Whenever the transition has a delay",
            "For anything longer than 300ms, because `css` can't animate that long",
          ],
          correctIndex: 0,
          explanation:
            "`css` is called upfront to build keyframes the browser runs off the main thread; `tick` runs every frame on the main thread and will jank when JavaScript is busy. Prefer `css` and fall back to `tick` only when you must.",
        },
        {
          id: "svelte-transitions-q5",
          prompt:
            "What does `|global` change here?\n\n```svelte\n{#if x}\n  {#if y}\n    <p transition:fade|global>…</p>\n  {/if}\n{/if}\n```",
          options: [
            "The transition also plays when the outer `{#if x}` block is created or destroyed, not just the inner one",
            "It registers the transition globally so other components can use it",
            "It makes the transition run outside the component's scoped styles",
            "It applies the transition to every element in the block",
          ],
          correctIndex: 0,
          explanation:
            "Transitions are local by default, so an element doesn't replay its intro every time some ancestor block appears. `|global` opts back into the old Svelte 3 behaviour for that one directive.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-transitions-q6",
          prompt: "What does `crossfade` return, and what is it for?",
          options: [
            "A `[send, receive]` pair used as transitions on two elements sharing a key, so one appears to fly into the other's place",
            "A single transition that fades the old element out while fading the new one in, in the same block",
            "A store holding the current transition progress",
            "A CSS class you apply to both elements",
          ],
          correctIndex: 0,
          explanation:
            "The deferred-transition machinery matches a `send` in one block with a `receive` in another by key, measures both positions and animates between them — the trick behind a to-do moving between \"todo\" and \"done\" lists.",
        },
        {
          id: "svelte-transitions-q7",
          prompt: "An `{#if}` block containing a list of elements is removed, and only the wrapper has `transition:slide`. What happens to the children?",
          options: [
            "They stay in the DOM until the wrapper's outro finishes, then are removed with it",
            "They are removed immediately and the wrapper animates an empty box",
            "Each child needs its own transition or the whole block is removed instantly",
            "Svelte clones the subtree into a detached node and animates the clone",
          ],
          correctIndex: 0,
          explanation:
            "An outroing block keeps its contents alive until every transition inside has completed, so you can animate a container without annotating everything in it.",
        },
        {
          id: "svelte-transitions-q8",
          prompt: "Which events does an element with a transition dispatch?",
          options: [
            "`introstart`, `introend`, `outrostart`, `outroend`",
            "`transitionstart` and `transitionend` only",
            "`animationstart` and `animationend` only",
            "`enter`, `entered`, `leave`, `left`",
          ],
          correctIndex: 0,
          explanation:
            "They're ordinary event attributes — `onoutroend={…}` is how you run cleanup after an element has finished leaving, rather than guessing with a timeout.",
        },
        {
          id: "svelte-transitions-q9",
          prompt: "You want a number to animate smoothly toward a new value. What's the current API?",
          options: [
            "`new Tween(0)` or `new Spring(0)` from `svelte/motion`, setting `.target` and reading `.current`",
            "`tweened(0)` from `svelte/motion` with `$value` in the template",
            "`transition:tween` on the element displaying the number",
            "`animate:number` on the element displaying the number",
          ],
          correctIndex: 0,
          explanation:
            "Svelte 5.8 introduced the `Tween` and `Spring` classes, which are rune-based; the `tweened` and `spring` **stores** still work but are deprecated. Neither is a transition — they animate a value, not an element entering or leaving.",
        },
        {
          id: "svelte-transitions-q10",
          prompt: "A list item's intro transition replays every time any item in the list is updated. What's the most likely cause?",
          options: [
            "The `{#each}` block isn't keyed, so Svelte is destroying and recreating blocks instead of moving them",
            "The transition is missing `|global`",
            "`transition:` needs `in:` and `out:` to be stable",
            "The transition duration is shorter than the frame budget",
          ],
          correctIndex: 0,
          explanation:
            "Unkeyed each blocks patch by index, which can mean destroying and recreating an element — and destruction and creation are exactly what triggers transitions. Add a stable key.",
        },
      ],
    },
    {
      id: "svelte-kit-routing",
      moduleId: "fe-svelte",
      trackId: "frontend",
      title: "SvelteKit Routing & File Conventions",
      summary:
        "SvelteKit's router is the directory tree under `src/routes`, and the files that matter are the ones prefixed with `+`. `+page.svelte` is a page; `+page.js` adds a load function and page options that run on both server and client; `+page.server.js` is the server-only version, and also the home of form actions; `+layout.svelte` wraps everything in its directory and below, rendering the child through `{@render children()}`; `+error.svelte` catches errors from that subtree; `+server.js` is a standalone endpoint exporting `GET`, `POST` and friends. Two rules cover most confusion: everything can run on the server, and everything runs on the client too **except** `+server` files. Navigation is plain `<a href=\"/about\">` — there is no `<Link>` component, because the client router intercepts the click.\n\nDynamic segments are `[slug]`, with `[...rest]` for an unknown number of segments and `[[optional]]` for one that may be absent. A matcher in `src/params/fruit.js` exporting `match(param)` turns `[page=fruit]` into a validated segment, and matchers run on the server *and* in the browser, so keep them cheap and dependency-free. Rest parameters match **zero** segments as well as many, which is why `/a/[...rest]/z` also matches `/a/z` — validate the value rather than assuming it's non-empty. An optional parameter can't follow a rest parameter, because the rest is greedy and would always swallow it.\n\nWhen several routes match, SvelteKit sorts rather than guessing: more specific beats less specific, a parameter with a matcher beats a bare parameter, and `[[optional]]` and `[...rest]` sort last and are ignored entirely unless they're the final segment. Ties break alphabetically. That ordering is what makes a `[...catchall]` route a safe custom 404.\n\nLayout hierarchy usually mirrors the URL, and the two escape hatches are worth knowing before you start duplicating layouts. A `(group)` directory groups routes under a shared layout without appearing in the URL — `(app)` and `(marketing)` beside each other, each with its own `+layout.svelte`. And appending `@segment` to a file name resets its layout chain: `+page@(app).svelte` inherits from the `(app)` layout, and `+page@.svelte` goes all the way back to the root. Reach for those when a single route genuinely needs a different shell, not as the default way to organise an app.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "SvelteKit: Routing", url: "https://svelte.dev/docs/kit/routing", kind: "docs" },
        { label: "SvelteKit: Advanced routing (matchers, sorting, groups)", url: "https://svelte.dev/docs/kit/advanced-routing", kind: "docs" },
        { label: "SvelteKit tutorial: Pages", url: "https://svelte.dev/tutorial/kit/pages", kind: "docs" },
      ],
      video: {
        title: "Modern Svelte Kit - Complete Svelte Kit Course for Beginners",
        channel: "Syntax",
        url: "https://www.youtube.com/watch?v=vkXxFfGwPao",
        videoId: "vkXxFfGwPao",
        durationLabel: "3:01:17",
        startSeconds: 938,
        chapterLabel: "Routing",
      },
      alternateVideos: [
        {
          title: "Modern Svelte Kit - Complete Svelte Kit Course for Beginners",
          channel: "Syntax",
          url: "https://www.youtube.com/watch?v=vkXxFfGwPao",
          videoId: "vkXxFfGwPao",
          durationLabel: "3:01:17",
          startSeconds: 8129,
          chapterLabel: "Advanced Routing",
        },
        {
          title: "Learn Everything About SvelteKit Routing (Pages, Layout, Nested Routes)",
          channel: "Joy of Code",
          url: "https://www.youtube.com/watch?v=7hXHbGj6iE0",
          videoId: "7hXHbGj6iE0",
          durationLabel: "38:58",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "svelte-kit-routing-q1",
          prompt: "Which of these statements about `+` files are correct? (Select all that apply.)",
          options: [
            "`+page.js` runs on the server during SSR and in the browser afterwards",
            "`+page.server.js` never runs in the browser",
            "`+server.js` runs only on the server and has no client counterpart",
            "`+layout.svelte` applies only to the directory it's in, not to subdirectories",
            "`+error.svelte` must live at the root of `src/routes`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Layouts and error pages cascade to subdirectories — that's what makes them useful. The server/client split is the other half: `.server.` files and `+server.js` stay on the server, everything else runs in both places.",
        },
        {
          id: "svelte-kit-routing-q2",
          prompt:
            "All of these routes match `/foo-abc`. Which one handles it?\n\n```\nsrc/routes/[...catchall]/+page.svelte\nsrc/routes/[[a=x]]/+page.svelte\nsrc/routes/[b]/+page.svelte\nsrc/routes/foo-[c]/+page.svelte\nsrc/routes/foo-abc/+page.svelte\n```",
          options: [
            "`foo-abc` — the most specific route wins",
            "`[...catchall]` — rest parameters are checked first",
            "`[b]` — single dynamic segments take priority over partial matches",
            "Whichever appears first alphabetically",
          ],
          correctIndex: 0,
          explanation:
            "Specificity ranks first, then parameters with matchers over bare ones, then `[[optional]]` and `[...rest]` last; alphabetical order is only the tie-breaker. `/foo-def` would fall through to `foo-[c]`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-kit-routing-q3",
          prompt: "What does a directory named `(marketing)` do?",
          options: [
            "Groups routes under a shared layout without contributing a segment to the URL",
            "Marks the routes inside it as prerendered",
            "Creates an optional URL segment `/marketing`",
            "Excludes the routes inside it from the build",
          ],
          correctIndex: 0,
          explanation:
            "Route groups exist so that `/about` and `/dashboard` can have different shells without inventing URL prefixes. Nest them sparingly — composition or an `{#if}` in a layout is often simpler.",
        },
        {
          id: "svelte-kit-routing-q4",
          prompt:
            "Given `src/routes/(app)/item/[id]/embed/+page.svelte`, what does renaming it to `+page@.svelte` do?",
          options: [
            "It skips the `(app)`, `item` and `[id]` layouts and renders inside the root layout only",
            "It disables all layouts, including the root one",
            "It moves the route to `/embed`",
            "It makes the page render inside the `(app)` layout instead of `item`'s",
          ],
          correctIndex: 0,
          explanation:
            "`@segment` resets the layout chain to that segment; the empty string means the root layout. `+page@(app).svelte` would stop at the `(app)` layout instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-kit-routing-q5",
          prompt: "Does `src/routes/a/[...rest]/z/+page.svelte` match the URL `/a/z`?",
          options: [
            "Yes — a rest parameter matches zero segments as well as many, so `rest` is an empty string",
            "No — a rest parameter requires at least one segment",
            "Only if the route is also declared as `[[...rest]]`",
            "Only when a matcher is attached to it",
          ],
          correctIndex: 0,
          explanation:
            "This catches people writing file-browser routes: always validate the value (or attach a matcher) rather than assuming the rest segment is non-empty.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-kit-routing-q6",
          prompt: "Where do parameter matchers live, and where do they run?",
          options: [
            "In `src/params/*.js`, exporting `match(param)`, and they run on both the server and in the browser",
            "In `src/routes/*/+matcher.js`, and they run on the server only",
            "In `svelte.config.js` under `kit.matchers`, evaluated at build time",
            "In `src/hooks.server.js`, as part of `reroute`",
          ],
          correctIndex: 0,
          explanation:
            "Because the client router uses them too, a matcher that imports a database client or a heavy library will end up in the browser bundle. Keep them to string checks.",
        },
        {
          id: "svelte-kit-routing-q7",
          prompt: "How do you navigate to another route in a SvelteKit page?",
          options: [
            "A normal `<a href=\"/about\">`; the client router intercepts the click",
            "`<Link to=\"/about\">` imported from `@sveltejs/kit`",
            "`<a href=\"/about\" use:link>`",
            "`goto('/about')` in an `onclick` handler — links always trigger a full reload",
          ],
          correctIndex: 0,
          explanation:
            "Plain anchors keep the app working without JavaScript and keep middle-click and \"open in new tab\" behaving normally. `goto` from `$app/navigation` exists for programmatic navigation, and `data-sveltekit-reload` opts an individual link out.",
        },
        {
          id: "svelte-kit-routing-q8",
          prompt: "Why won't `src/routes/marx-brothers/+error.svelte` render for the URL `/marx-brothers/karl`?",
          options: [
            "No route matches that URL, so there's no subtree to render the nested error page in",
            "Error pages only handle errors thrown in `+page.server.js`",
            "404s always render the root `+error.svelte`, by design and with no way around it",
            "The error page must be named `+error@.svelte` to catch 404s",
          ],
          correctIndex: 0,
          explanation:
            "Nested error pages need a matched route. Adding `marx-brothers/[...path]/+page.js` that calls `error(404, …)` gives the 404 somewhere to render.",
        },
        {
          id: "svelte-kit-routing-q9",
          prompt: "Why is `src/routes/[...files]/[[lang]]/+page.svelte` rejected?",
          options: [
            "An optional parameter can't follow a rest parameter — the rest matches greedily, so the optional one could never be filled",
            "Rest and optional parameters can't appear in the same route at all",
            "Optional parameters must be the first segment of a route",
            "It isn't rejected; the optional parameter is simply always `undefined`",
          ],
          correctIndex: 0,
          explanation:
            "The rest segment would consume everything, leaving the optional parameter permanently unused, so SvelteKit treats it as a mistake rather than silently doing nothing.",
        },
        {
          id: "svelte-kit-routing-q10",
          prompt: "You need a route at the URL `/.well-known/security.txt`. What's the SvelteKit convention?",
          options: [
            "Encode the leading dot: `src/routes/[x+2e]well-known/security.txt/+server.js`",
            "Put the file in `static/.well-known/` — routes can't produce dotfiles",
            "Configure `kit.routes.wellKnown` in `svelte.config.js`",
            "Create `src/routes/_well-known/` and add a `reroute` hook",
          ],
          correctIndex: 0,
          explanation:
            "`[x+nn]` escapes characters that are awkward on the filesystem or meaningful to SvelteKit. A leading dot is specifically called out, because TypeScript struggles with dot-prefixed directories.",
        },
      ],
    },
    {
      id: "svelte-kit-load",
      moduleId: "fe-svelte",
      trackId: "frontend",
      title: "Load Functions: Universal, Server & Streaming",
      summary:
        "A `load` function runs before its page or layout renders and returns the `data` prop; where you put it decides where it runs. `+page.js` / `+layout.js` export a **universal** load, which runs on the server during SSR and then again in the browser on hydration and every client-side navigation. `+page.server.js` / `+layout.server.js` export a **server** load, which only ever runs on the server and gets `cookies`, `locals`, `request` and `platform`. Universal loads can return anything, including class instances; server loads must return something `devalue` can serialise — JSON plus `Date`, `Map`, `Set`, `BigInt`, `RegExp` and cyclical references — because it crosses the wire.\n\nThe page's data is the **merge of every load in the chain**, root layout first and page last, with the last writer of a key winning. When a route has both kinds, the server load runs first and its return value arrives as `event.data` in the universal one, which is then free to reshape or drop it — anything it doesn't pass through never reaches the page. `await parent()` gives a load its ancestors' merged data and is the one call that can create a waterfall, so do your independent work before awaiting it.\n\nSvelteKit avoids redundant work aggressively. Loads in a chain run concurrently and are grouped into one response during navigation, and a load reruns only when something it actually read changed: a `params` or `url` property (search params are tracked individually, so `?x=1 → ?x=2` reruns a load that read `x` while a `?y` change doesn't), a `fetch(url)` or `depends('app:thing')` you invalidated, or a parent that reran. Tracking stops when the function returns, so reading `params.x` inside a nested promise does nothing but earn a dev warning.\n\nReturning a promise from a **server** load streams it: the page renders with `{#await}` showing a skeleton and the value arrives later. Await the essential data, leave the slow optional data unawaited — but an unhandled rejection in a streamed promise can crash the server, headers and redirects can't change once streaming has begun, some platforms buffer the response anyway, and promises from a *universal* load are not streamed at all. Finally, layout loads don't rerun on every navigation between sibling pages, which is why auth checks belong in `hooks.server.js` or a page's own server load rather than in a layout.",
      level: "advanced",
      estMinutes: 85,
      isMilestone: true,
      webRefs: [
        { label: "SvelteKit: Loading data", url: "https://svelte.dev/docs/kit/load", kind: "docs" },
        { label: "SvelteKit tutorial: Universal load functions", url: "https://svelte.dev/tutorial/kit/universal-load-functions", kind: "docs" },
        { label: "SvelteKit tutorial: Awaiting parent data", url: "https://svelte.dev/tutorial/kit/await-parent", kind: "docs" },
        { label: "sveltejs/devalue: the serializer server loads must satisfy", url: "https://github.com/sveltejs/devalue", kind: "repo" },
      ],
      video: {
        title: "SvelteKit Tutorial - 28 - Universal vs Server Load Function",
        channel: "Codevolution",
        url: "https://www.youtube.com/watch?v=jQXeLhR6Qe8",
        videoId: "jQXeLhR6Qe8",
        durationLabel: "7:38",
      },
      alternateVideos: [
        {
          title: "Why Your Load Functions are Slow",
          channel: "Huntabyte",
          url: "https://www.youtube.com/watch?v=Ymk22rD8Lb4",
          videoId: "Ymk22rD8Lb4",
          durationLabel: "8:24",
        },
        {
          title: "New SvelteKit Feature - Defer",
          channel: "Huntabyte",
          url: "https://www.youtube.com/watch?v=wTF9uunxSvA",
          videoId: "wTF9uunxSvA",
          durationLabel: "4:00",
        },
        {
          title: "Modern Svelte Kit - Complete Svelte Kit Course for Beginners",
          channel: "Syntax",
          url: "https://www.youtube.com/watch?v=vkXxFfGwPao",
          videoId: "vkXxFfGwPao",
          durationLabel: "3:01:17",
          startSeconds: 3410,
          chapterLabel: ".server.ts files",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `resolveLoadChain(nodes, event)`, which runs a SvelteKit load chain and returns the page's `data`.\n\n`nodes` is ordered root layout first, page last. Each node is `{ id, serverLoad?, universalLoad? }`, where either function may be missing.\n\nFor each node, from the root down:\n\n1. If it has a `serverLoad`, call it with `{ ...event, parent }` and await the result. Treat a missing return value as `{}`.\n2. Then compute the node's **contribution**:\n   - with a `universalLoad`, call it with `{ ...event, data, parent }` — where `data` is this node's own server result (or `undefined` if it has no server load) — and use what it returns, treating a missing return value as `{}`;\n   - with no `universalLoad`, the contribution is the server result (or `{}`).\n3. The page's data is every contribution merged in order with `Object.assign`, so **a later node's key overwrites an earlier one's**.\n\n`parent` is an async function, and the two chains are separate, exactly as in SvelteKit:\n\n- inside a **server** load it resolves to the merged **server results** of the ancestor nodes only (nodes with no server load contribute nothing);\n- inside a **universal** load it resolves to the merged **contributions** of the ancestor nodes.\n\nIn both cases `parent()` covers ancestors only — never the node's own data, which arrives as `event.data`.\n\nReal SvelteKit runs the chain concurrently and lets `parent()` settle as ancestors finish; running the nodes in order is fine here and produces the same data.\n\nThe tests call `runLoadChain(spec)`, which builds load functions from a plain description and returns `{ data, log, parentSeen, dataSeen }`. Leave the driver as it is.",
        starterCode: LOAD_STARTER,
        functionName: "runLoadChain",
        testCases: [
          {
            description: "a layout's and a page's data are merged, root first",
            args: [{ nodes: [{ id: "root", universal: { returns: { a: 1 } } }, { id: "page", universal: { returns: { b: 2 } } }] }],
            expected: {
              data: { a: 1, b: 2 },
              log: ["universal:root", "universal:page"],
              parentSeen: {},
              dataSeen: { root: null, page: null },
            },
          },
          {
            description: "when two loads return the same key, the deeper one wins",
            args: [{ nodes: [{ id: "root", universal: { returns: { a: 1, b: 2 } } }, { id: "page", universal: { returns: { b: 3, c: 4 } } }] }],
            expected: {
              data: { a: 1, b: 3, c: 4 },
              log: ["universal:root", "universal:page"],
              parentSeen: {},
              dataSeen: { root: null, page: null },
            },
          },
          {
            description: "the server load runs first and its result arrives as the universal load's `data`",
            args: [{ nodes: [{ id: "page", server: { returns: { s: 1 } }, universal: { returns: { u: 2 }, spreadData: true } }] }],
            expected: {
              data: { s: 1, u: 2 },
              log: ["server:page", "universal:page"],
              parentSeen: {},
              dataSeen: { page: { s: 1 } },
            },
          },
          {
            description: "a node with only a server load contributes that data directly",
            args: [{ nodes: [{ id: "root", server: { returns: { a: 1 } } }, { id: "page", server: { returns: { b: 2 } } }] }],
            expected: { data: { a: 1, b: 2 }, log: ["server:root", "server:page"], parentSeen: {}, dataSeen: {} },
          },
          {
            description: "a universal load that ignores `data` drops the server load's keys",
            args: [{ nodes: [{ id: "page", server: { returns: { secret: 1 } }, universal: { returns: { safe: 2 } } }] }],
            expected: {
              data: { safe: 2 },
              log: ["server:page", "universal:page"],
              parentSeen: {},
              dataSeen: { page: { secret: 1 } },
            },
            isEdgeCase: true,
          },
          {
            description: "parent() in a page's universal load sees ancestors, not the page's own server data",
            args: [
              {
                nodes: [
                  { id: "root", universal: { returns: { a: 1 } } },
                  { id: "mid", universal: { returns: { b: 2 } } },
                  { id: "page", server: { returns: { s: 9 } }, universal: { returns: { c: 3 }, useParent: true } },
                ],
              },
            ],
            expected: {
              data: { a: 1, b: 2, c: 3 },
              log: ["universal:root", "universal:mid", "server:page", "universal:page"],
              parentSeen: { "universal:page": { a: 1, b: 2 } },
              dataSeen: { root: null, mid: null, page: { s: 9 } },
            },
            isEdgeCase: true,
          },
          {
            description: "parent() in a middle layout sees only what is above it",
            args: [
              {
                nodes: [
                  { id: "root", universal: { returns: { a: 1 } } },
                  { id: "mid", universal: { returns: { b: 2 }, useParent: true } },
                  { id: "page", universal: { returns: { c: 3 } } },
                ],
              },
            ],
            expected: {
              data: { a: 1, b: 2, c: 3 },
              log: ["universal:root", "universal:mid", "universal:page"],
              parentSeen: { "universal:mid": { a: 1 } },
              dataSeen: { root: null, mid: null, page: null },
            },
            isEdgeCase: true,
          },
          {
            description: "parent() in a server load sees only ancestors' server data",
            args: [
              {
                nodes: [
                  { id: "root", server: { returns: { a: 1 } } },
                  { id: "mid", universal: { returns: { b: 2 } } },
                  { id: "page", server: { returns: { c: 3 }, useParent: true }, universal: { returns: { d: 4 }, spreadData: true } },
                ],
              },
            ],
            expected: {
              data: { a: 1, b: 2, c: 3, d: 4 },
              log: ["server:root", "universal:mid", "server:page", "universal:page"],
              parentSeen: { "server:page": { a: 1 } },
              dataSeen: { mid: null, page: { c: 3 } },
            },
            isEdgeCase: true,
          },
          {
            description: "a load that returns nothing contributes an empty object",
            args: [{ nodes: [{ id: "root", universal: {} }, { id: "page", universal: { returns: { b: 2 } } }] }],
            expected: {
              data: { b: 2 },
              log: ["universal:root", "universal:page"],
              parentSeen: {},
              dataSeen: { root: null, page: null },
            },
            isEdgeCase: true,
          },
          {
            description: "a four-level chain mixing server and universal loads",
            args: [
              {
                nodes: [
                  { id: "root", server: { returns: { user: "ada" } } },
                  { id: "app", universal: { returns: { theme: "dark" }, useParent: true, spreadData: true } },
                  { id: "blog", server: { returns: { posts: 2 } } },
                  { id: "post", universal: { returns: { slug: "x" }, useParent: true } },
                ],
              },
            ],
            expected: {
              data: { user: "ada", theme: "dark", posts: 2, slug: "x" },
              log: ["server:root", "universal:app", "server:blog", "universal:post"],
              parentSeen: {
                "universal:app": { user: "ada" },
                "universal:post": { user: "ada", theme: "dark", posts: 2 },
              },
              dataSeen: { app: null, post: null },
            },
          },
        ],
      },
    },
    {
      id: "svelte-kit-form-actions",
      moduleId: "fe-svelte",
      trackId: "frontend",
      title: "Form Actions & Progressive Enhancement",
      summary:
        "A form action is a function exported from `+page.server.js` that handles a `POST` from a plain `<form>`. Write the HTML form, export `actions = { default: async (event) => … }`, and the feature works with JavaScript disabled, on a flaky connection, and before your bundle has finished loading. Actions are always `POST`, because `GET` must stay side-effect-free; a page can have one `default` action or several **named** ones invoked with `action=\"?/register\"` (or a `formaction` on a specific button), but never both, since a named POST leaves `?/name` in the URL and the next default submit would silently re-run the old action.\n\nThe return value lands on the page as the `form` prop and on `page.form`, and must be serialisable. For validation failures use `fail(400, { email, incorrect: true })` rather than throwing: `fail` sets `page.status` and gives the page what it needs to re-render the form with the submitted values, whereas `error()` renders the nearest `+error.svelte` and throws the user's input away. Echo back only what's safe — the email, not the password. `redirect(303, '/dashboard')` is the success path; both `redirect` and `error` work by throwing, so calling either inside a `try` block gets caught by your own `catch`. (SvelteKit 1 required `throw redirect(...)`; older tutorials still show it.)\n\nAfter an action completes, the page's `load` functions rerun — but `handle` does **not**. If your action sets or deletes a session cookie, `event.locals` still holds what `handle` computed at the start of the request, so update `event.locals` too or the page re-renders as the old user.\n\n`use:enhance` from `$app/forms` upgrades the form without changing any of that: it submits with `fetch`, updates `form` and `page.status`, resets the `<form>`, calls `invalidateAll()` on success, follows redirects with `goto`, renders the nearest error boundary on failure, and resets focus. Pass a `SubmitFunction` to show a spinner or `cancel()` the submit — but if you return a callback you have taken over the default behaviour, and need `update()` or `applyAction(result)` to get it back. It only works on `method=\"POST\"` forms pointing at a `+page.server.js` action; a `GET` form is treated like a link instead. Worth knowing where this is heading: form actions are feature-complete and supported, but new development is going into **remote functions** (experimental since 2.27).",
      level: "advanced",
      estMinutes: 70,
      webRefs: [
        { label: "SvelteKit: Form actions", url: "https://svelte.dev/docs/kit/form-actions", kind: "docs" },
        { label: "SvelteKit tutorial: The form element", url: "https://svelte.dev/tutorial/kit/the-form-element", kind: "docs" },
        { label: "SvelteKit: Remote functions (experimental)", url: "https://svelte.dev/docs/kit/remote-functions", kind: "docs" },
        { label: "Stuart Langridge: Everyone has JavaScript, right?", url: "https://www.kryogenix.org/code/browser/everyonehasjs.html", kind: "article" },
      ],
      video: {
        title: "Form Actions Made Simple",
        channel: "Huntabyte",
        url: "https://www.youtube.com/watch?v=52nXUwQWeKI",
        videoId: "52nXUwQWeKI",
        durationLabel: "29:03",
      },
      alternateVideos: [
        {
          title: "Better SvelteKit Forms via Progressive Enhancement",
          channel: "Huntabyte",
          url: "https://www.youtube.com/watch?v=jXtzWMhdI2U",
          videoId: "jXtzWMhdI2U",
          durationLabel: "19:17",
        },
        {
          title: "Paolo Ricciuti - Progressively enhanced apps with Svelte",
          channel: "Frontendisti",
          url: "https://www.youtube.com/watch?v=Ji4Y5vo-gOg",
          videoId: "Ji4Y5vo-gOg",
          durationLabel: "27:12",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "svelte-kit-form-actions-q1",
          prompt: "A page exports `actions = { login, register }`. How does a form invoke `register`?",
          options: [
            "`<form method=\"POST\" action=\"?/register\">`, or a `<button formaction=\"?/register\">` inside another form",
            "`<form method=\"POST\" action=\"/register\">`",
            "`<form method=\"POST\" data-action=\"register\">`",
            "`<form method=\"POST\">` plus `export const defaultAction = 'register'`",
          ],
          correctIndex: 0,
          explanation:
            "Named actions are addressed with a `?/name` query parameter, which is why `formaction` on a button can send the same fields to a different handler — one form, Log in and Register buttons.",
        },
        {
          id: "svelte-kit-form-actions-q2",
          prompt: "Why can't a page have a `default` action alongside named actions?",
          options: [
            "Posting to a named action leaves `?/name` in the URL, so a later default submit would run the named action again",
            "SvelteKit can only generate one action endpoint per route",
            "Named actions require `use:enhance`, which conflicts with the default action",
            "It's allowed; the default action simply takes precedence",
          ],
          correctIndex: 0,
          explanation:
            "Without a redirect the query parameter persists, so the ambiguity is real and SvelteKit rejects the combination outright rather than letting it surprise you in production.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-kit-form-actions-q3",
          prompt: "The email field is empty. Should the action call `fail(400, { email, missing: true })` or `error(400, 'missing email')`?",
          options: [
            "`fail` — it re-renders the same page with `form` populated so the user keeps their input",
            "`error` — validation problems are errors and belong in the error boundary",
            "Either; they produce identical results with a 400 status",
            "Neither; return `{ success: false }` and check it on the page",
          ],
          correctIndex: 0,
          explanation:
            "`error()` renders the nearest `+error.svelte` and discards everything the user typed. `fail()` is the validation path: `page.status` gets the code and the page re-renders with the values to put back in the inputs.",
        },
        {
          id: "svelte-kit-form-actions-q4",
          prompt: "What does a bare `use:enhance` do by default? (Select all that apply.)",
          options: [
            "Submits with `fetch` instead of a full page navigation",
            "Calls `invalidateAll()` on a successful response",
            "Resets the `<form>` element and moves focus appropriately",
            "Prevents double submits while a request is in flight",
            "Retries the submission automatically if the network fails",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The default is \"native behaviour without the reload\": submit, update `form`/`page.form`/`page.status`, reset the form, revalidate, follow redirects, reset focus. Double-submit guarding and retries are yours to add in a `SubmitFunction`.",
        },
        {
          id: "svelte-kit-form-actions-q5",
          prompt:
            "`handle` sets `event.locals.user` from a cookie. A `logout` action deletes the cookie, but the page still renders as logged in. Why?",
          options: [
            "`handle` runs before the action and doesn't run again before the `load` functions rerun, so `locals.user` is stale",
            "Cookie deletion only takes effect on the next request by design",
            "`load` functions don't rerun after an action unless you call `invalidateAll()`",
            "The `form` prop overrides `data` when both are present",
          ],
          correctIndex: 0,
          explanation:
            "This is called out explicitly in the docs: set `event.locals.user = null` in the action as well as deleting the cookie, because `load` will read `locals` from the same request.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-kit-form-actions-q6",
          prompt:
            "What does this do?\n\n```js\ntry {\n  const user = await db.getUser(email);\n  redirect(303, '/dashboard');\n} catch (e) {\n  return fail(500, { message: 'something went wrong' });\n}\n```",
          options: [
            "It returns the 500 failure instead of redirecting — `redirect()` works by throwing, so the `catch` swallows it",
            "It redirects, because SvelteKit redirects are not exceptions",
            "It throws an unhandled error, because `redirect` can't be used in an action",
            "It redirects and then also returns the failure",
          ],
          correctIndex: 0,
          explanation:
            "Both `redirect()` and `error()` throw internally, which is what lets them abort from inside a helper function. Keep them outside `try` blocks, or re-throw anything that `isRedirect`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-kit-form-actions-q7",
          prompt: "`use:enhance` throws an error on this form. Which fix is correct?\n\n```svelte\n<form use:enhance action=\"/api/search\">\n```",
          options: [
            "Give it `method=\"POST\"` and point it at an action in a `+page.server.js`, not a `+server.js` endpoint",
            "Add `data-sveltekit-reload` so the router doesn't intercept it",
            "Import `enhance` from `$app/navigation` instead of `$app/forms`",
            "Wrap it with `applyAction` in an `onsubmit` handler",
          ],
          correctIndex: 0,
          explanation:
            "`use:enhance` is specifically about form actions. A form with no method defaults to `GET`, which SvelteKit treats like a link — it navigates to `?q=…` and reruns `load` rather than invoking an action.",
        },
        {
          id: "svelte-kit-form-actions-q8",
          prompt: "You return a callback from your `SubmitFunction` to show a toast. The form stops resetting and the page data goes stale. Why?",
          options: [
            "Returning a callback replaces the default post-submission behaviour; call `update()` or `applyAction(result)` to restore it",
            "The callback runs before the response arrives, so `result` is undefined",
            "Toasts are rendered outside the form, which detaches the enhancement",
            "`use:enhance` disables itself after the first custom callback",
          ],
          correctIndex: 0,
          explanation:
            "The callback is your chance to override, so SvelteKit stops doing the default work. `update({ reset, invalidateAll })` runs the standard logic, and `applyAction(result)` applies just the result — regardless of which page you submitted from.",
        },
        {
          id: "svelte-kit-form-actions-q9",
          prompt: "Which of these can a form action's return value contain?",
          options: [
            "Anything JSON-serialisable, plus the extra types SvelteKit serialises such as `Date` and `BigInt`",
            "Any JavaScript value, including functions and class instances",
            "Only strings and numbers",
            "Only a `Response` object",
          ],
          correctIndex: 0,
          explanation:
            "The value crosses the wire to the page, so it goes through SvelteKit's serializer — which is also why hand-rolled progressive enhancement must use `deserialize` from `$app/forms` rather than `JSON.parse`.",
        },
        {
          id: "svelte-kit-form-actions-q10",
          prompt: "What is the current relationship between form actions and remote functions?",
          options: [
            "Form actions are feature-complete and supported; remote functions are experimental and where new development is focused",
            "Remote functions are stable and form actions are deprecated",
            "They're the same feature under two names",
            "Remote functions replace `load`, not form actions",
          ],
          correctIndex: 0,
          explanation:
            "Remote functions (2.27+, behind `kit.experimental.remoteFunctions`) add end-to-end type safety and single-flight mutations, and the `form` flavour covers the same ground. The API can still change, so weigh that before adopting them in production.",
        },
      ],
    },
    {
      id: "svelte-kit-rendering-deploy",
      moduleId: "fe-svelte",
      trackId: "frontend",
      title: "Hooks, Rendering Modes & Deployment",
      summary:
        "`src/hooks.server.js` is SvelteKit's middleware layer. `handle({ event, resolve })` runs for every request the server handles — including during prerendering — and `resolve(event)` is what actually renders the route, so code before it filters the request and code after it rewrites the response. This is where a session cookie becomes `event.locals.user` for server loads, actions and endpoints to read; an auth guard belongs here rather than in a layout load, because layout loads don't rerun on every client-side navigation. Compose several handles with `sequence` from `@sveltejs/kit/hooks`. The other hooks are `handleFetch` (rewrite server-side `event.fetch` — hit an internal API host, or forward a cookie across sibling subdomains), `handleError` (report unexpected errors, shape what the user sees) and `reroute` in the universal `src/hooks.js`. One surprise: requests for static assets and already-prerendered pages never reach `handle` at all.\n\nRendering is configured per route with page options, and child routes override parents — so one project can prerender the marketing pages, server-render the app and make the admin area an SPA. `prerender = true` builds HTML at compile time (`'auto'` also keeps the route server-renderable); `ssr = false` ships an empty shell rendered only in the browser; `csr = false` ships no JavaScript at all, which kills `use:enhance`, HMR and client-side routing but suits a static article. Both `false` renders nothing. The prerender rule is that any two visitors hitting the page directly must get the same HTML — hence no form actions and no `url.searchParams`. The crawler starts at your non-dynamic routes and follows links, so a dynamic route nothing links to needs an `entries()` function.\n\nHydration joins the halves: the server sends HTML plus the serialised `data` from your loads, components initialise from that data instead of refetching, and Svelte attaches listeners. That's the payoff for keeping components runnable in both environments.\n\nDeployment goes through an **adapter**: `adapter-node` for a standalone server, `adapter-static` for SSG (or an SPA, via a `fallback` page), and platform adapters for Vercel, Netlify and Cloudflare. New projects get `adapter-auto`, which detects the platform but takes no options — once you've settled on a target, install the real adapter so you can configure it and pin it in the lockfile.",
      level: "advanced",
      estMinutes: 75,
      isMilestone: true,
      webRefs: [
        { label: "SvelteKit: Hooks", url: "https://svelte.dev/docs/kit/hooks", kind: "docs" },
        { label: "SvelteKit: Page options (prerender, ssr, csr)", url: "https://svelte.dev/docs/kit/page-options", kind: "docs" },
        { label: "SvelteKit: Adapters", url: "https://svelte.dev/docs/kit/adapters", kind: "docs" },
        { label: "SvelteKit: Glossary (SSR, CSR, SSG, hydration)", url: "https://svelte.dev/docs/kit/glossary", kind: "docs" },
      ],
      video: {
        title: "Modern Svelte Kit - Complete Svelte Kit Course for Beginners",
        channel: "Syntax",
        url: "https://www.youtube.com/watch?v=vkXxFfGwPao",
        videoId: "vkXxFfGwPao",
        durationLabel: "3:01:17",
        startSeconds: 2882,
        chapterLabel: "Hooks/Middleware",
      },
      alternateVideos: [
        {
          title: "Modern Svelte Kit - Complete Svelte Kit Course for Beginners",
          channel: "Syntax",
          url: "https://www.youtube.com/watch?v=vkXxFfGwPao",
          videoId: "vkXxFfGwPao",
          durationLabel: "3:01:17",
          startSeconds: 8362,
          chapterLabel: "Deploying",
        },
        {
          title: "Learn SvelteKit Hooks Through 6 Examples",
          channel: "Joy of Code",
          url: "https://www.youtube.com/watch?v=Kzrz7GZ9pIg",
          videoId: "Kzrz7GZ9pIg",
          durationLabel: "23:54",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "svelte-kit-rendering-deploy-q1",
          prompt: "A `handle` hook logs every request, but nothing appears for `/favicon.png` or for a prerendered `/about`. Why?",
          options: [
            "Requests for static assets and already-prerendered pages don't go through SvelteKit's `handle`",
            "`handle` only runs for routes that have a `load` function",
            "Logging inside `handle` is stripped in production builds",
            "`handle` only runs after `resolve(event)` returns",
          ],
          correctIndex: 0,
          explanation:
            "Those responses are served as files by the platform, so there's nothing for SvelteKit to handle. It's also why you can't implement auth for static assets in `handle`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-kit-rendering-deploy-q2",
          prompt: "Where should an auth guard that protects many routes live, and why?",
          options: [
            "In `handle`, because it runs before any `load` function and on every request",
            "In the root `+layout.server.js` load, because it runs before child loads",
            "In each `+page.svelte` with an `$effect` that redirects",
            "In `hooks.client.js`, so the redirect happens without a round trip",
          ],
          correctIndex: 0,
          explanation:
            "Layout loads don't rerun on client-side navigation between sibling routes, and layout and page loads run concurrently unless the child awaits `parent()` — so a layout guard is both slower and easier to get wrong. Client-side checks aren't security at all.",
        },
        {
          id: "svelte-kit-rendering-deploy-q3",
          prompt: "Which statements about page options are correct? (Select all that apply.)",
          options: [
            "They can be exported from `+page.js`, `+page.server.js`, `+layout.js` or `+layout.server.js`",
            "A child route's value overrides the one it inherits from a layout",
            "`prerender` also applies to `+server.js` files",
            "Setting `ssr = false` and `csr = false` on the same page renders a static HTML version",
            "They must be declared in `svelte.config.js` to take effect",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Turning both off renders **nothing** — `ssr: false` means no server HTML and `csr: false` means no JavaScript to produce any. Endpoints honour `prerender` too, and inherit a default from the pages that fetch them.",
        },
        {
          id: "svelte-kit-rendering-deploy-q4",
          prompt: "A route exports `prerender = true` and also exports `actions`. What happens?",
          options: [
            "The build fails: a prerendered page has no server to receive the action's POST",
            "It works — actions are compiled into a serverless function alongside the static HTML",
            "It works, but the action silently returns a 405 at runtime",
            "The `prerender` flag is ignored and the route is server-rendered",
          ],
          correctIndex: 0,
          explanation:
            "Prerendering means the response is a file on disk; there is nothing to handle `POST`. This is the clearest instance of the general rule: prerender a page only if any two visitors hitting it directly get identical content.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-kit-rendering-deploy-q5",
          prompt: "What does `export const csr = false` actually do to a page?",
          options: [
            "No JavaScript is shipped: `<script>` blocks are removed, links do full navigations and `use:enhance` stops working",
            "The page is rendered only in the browser, with an empty shell from the server",
            "The page is prerendered at build time",
            "Hydration is deferred until the page becomes visible",
          ],
          correctIndex: 0,
          explanation:
            "`csr = false` is \"HTML and CSS only\" — perfect for an article, wrong for anything interactive. The empty-shell, browser-only behaviour is `ssr = false`, which is how you'd turn a section into an SPA.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-kit-rendering-deploy-q6",
          prompt: "What does hydration do in a SvelteKit app?",
          options: [
            "Initialises the components in the browser from the data the server serialised alongside the HTML, then attaches event listeners",
            "Replaces the server-rendered HTML with a fresh client render",
            "Refetches every `load` function's data in the browser to be sure it's current",
            "Streams the remaining HTML after the initial response",
          ],
          correctIndex: 0,
          explanation:
            "Sending the data with the HTML is what avoids a second round of API calls on first paint. It's also why server loads must return serialisable data and why components have to run in both environments.",
        },
        {
          id: "svelte-kit-rendering-deploy-q7",
          prompt: "You need three independent `handle` behaviours: auth, logging and a locale cookie. What's the intended approach?",
          options: [
            "Write three `Handle` functions and combine them with `sequence` from `@sveltejs/kit/hooks`",
            "Export an array of handles from `hooks.server.js`",
            "Create `hooks.server.js`, `hooks.auth.js` and `hooks.locale.js`; SvelteKit loads them all",
            "Chain them by calling `resolve` three times",
          ],
          correctIndex: 0,
          explanation:
            "`sequence(auth, logging, locale)` nests them so each one's `resolve` is the next in the chain. Calling `resolve` more than once in a single handle renders the route more than once.",
        },
        {
          id: "svelte-kit-rendering-deploy-q8",
          prompt: "During SSR, a load function should call your internal API host instead of the public one. Which hook does that?",
          options: [
            "`handleFetch`, which can rewrite or replace requests made with `event.fetch` on the server",
            "`handle`, by mutating `event.url` before calling `resolve`",
            "`reroute`, in `src/hooks.js`",
            "`handleError`, by retrying the failed request",
          ],
          correctIndex: 0,
          explanation:
            "`handleFetch` intercepts `event.fetch` from loads, actions, endpoints and other hooks. It's also the documented fix for forwarding a cookie between sibling subdomains, which SvelteKit won't do automatically.",
        },
        {
          id: "svelte-kit-rendering-deploy-q9",
          prompt: "A build fails with \"The following routes were marked as prerenderable, but were not prerendered\" for `/blog/[slug]`. What fixes it?",
          options: [
            "Export an `entries()` function listing the slugs, or make sure the crawler can reach them from a prerendered page's links",
            "Add `export const ssr = false` to the route",
            "Move the route under a `(group)` directory",
            "Set `trailingSlash = 'always'`",
          ],
          correctIndex: 0,
          explanation:
            "The prerenderer starts at your non-dynamic routes and follows `<a>` elements, so it can't invent parameter values. `entries()` (which may be async and read from a CMS) supplies them; `prerender = 'auto'` is the other way out, since it keeps the route server-renderable.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "svelte-kit-rendering-deploy-q10",
          prompt: "Your app is deployed on Vercel with `adapter-auto` and you now need `{ runtime: 'edge' }` for one route. What do you do?",
          options: [
            "Install `@sveltejs/adapter-vercel` and use it explicitly — `adapter-auto` takes no options",
            "Pass the option to `adapter-auto` in `svelte.config.js`",
            "Set `kit.config.runtime` at the top level of `svelte.config.js`",
            "Add a `vercel.json` file; SvelteKit merges it with the adapter config",
          ],
          correctIndex: 0,
          explanation:
            "`adapter-auto` exists to make the first deploy work with no decisions, and deliberately accepts no configuration. Installing the real adapter also pins it in the lockfile and speeds up CI installs.",
        },
        {
          id: "svelte-kit-rendering-deploy-q11",
          prompt: "You want a genuine single-page app served from a static host. What's the SvelteKit recipe?",
          options: [
            "`export const ssr = false` in the root layout and `adapter-static` with a `fallback` page",
            "`export const csr = false` in the root layout and `adapter-static`",
            "`adapter-node` with `prerender = true` everywhere",
            "`adapter-static` alone — it always produces an SPA",
          ],
          correctIndex: 0,
          explanation:
            "The fallback page is the shell the host serves for any unmatched path, which is what lets client-side routing take over. `adapter-static` without a fallback is SSG, and it will fail the build on any route it can't prerender.",
        },
      ],
    },
  ],
} satisfies Module;
