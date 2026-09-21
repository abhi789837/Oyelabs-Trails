import type { Module } from "@/types/curriculum";

// Test fixture for the event-delegation challenge (plain data, shared by its test cases).
const DELEGATION_TREE = {
  id: "app",
  tag: "div",
  children: [
    {
      id: "list",
      tag: "ul",
      children: [
        { id: "i1", tag: "li", classes: ["item"], children: [{ id: "s1", tag: "span", classes: ["label"] }] },
        { id: "i2", tag: "li", classes: ["item", "active"], children: [{ id: "b2", tag: "button", classes: ["btn"] }] },
      ],
    },
    {
      id: "panel",
      tag: "div",
      classes: ["card"],
      children: [{ id: "inner", tag: "div", classes: ["card"], children: [{ id: "save", tag: "button", classes: ["btn", "primary"] }] }],
    },
  ],
};

export default {
  id: "fe-js-advanced",
  trackId: "frontend",
  name: "JavaScript Advanced & Interview-Level",
  description:
    "The half of JavaScript that senior interviews and production incidents are made of: promises and the microtask queue, async/await, generators, prototypes and `this`, modules, the browser platform APIs, and the classic implement-it-yourself questions (debounce, throttle, curry, `bind`, an LRU cache, `Promise.all`). Code-heavy: expect to write and test real implementations, not just answer trivia.",
  refs: [
    { label: "MDN: JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", kind: "docs" },
    { label: "javascript.info: The Modern JavaScript Tutorial", url: "https://javascript.info/", kind: "article" },
    { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
    { label: "sudheerj: JavaScript Interview Questions", url: "https://github.com/sudheerj/javascript-interview-questions", kind: "interview-prep" },
  ],
  topics: [
    {
      id: "js-promises",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "Promises Deep Dive: States, Chaining & Error Propagation",
      summary:
        "Promises exist to undo the inversion of control that callbacks cause. With a callback you hand your continuation to someone else's code and trust it to call you exactly once; a promise is a one-shot result container you attach reactions to, and the spec guarantees each handler runs at most once, asynchronously, in registration order. A promise is pending until it settles as fulfilled or rejected. \"Resolved\" is a different idea: `resolve(otherPromise)` locks the outer promise to follow the other one, so it can be resolved and still pending.\n\n`then` always returns a new promise, which is what makes chaining work: whatever a handler returns (a value, or a promise that gets adopted) becomes the next link's value, and whatever it throws becomes the next link's rejection. Rejections skip fulfilment handlers until something handles them, so one `catch` at the end covers the chain, and a `catch` that returns normally recovers it. `finally` passes the original outcome through unless its callback throws or returns a rejected promise.\n\nThe bugs that survive code review are structural. A handler that calls an async function without returning it creates a floating promise that the chain neither waits for nor catches. `then(onOk, onErr)` does not catch errors thrown by `onOk`. A rejection that still has no handler once the microtask queue drains fires `unhandledrejection` in browsers and, by default since Node 15, crashes the process. And promises can't be cancelled: stopping the underlying work needs an `AbortSignal` passed down to it.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "MDN: Using promises", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises", kind: "docs" },
        { label: "javascript.info: Promises chaining", url: "https://javascript.info/promise-chaining", kind: "article" },
        { label: "javascript.info: Error handling with promises", url: "https://javascript.info/promise-error-handling", kind: "article" },
        { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Promises | Ep 02  Season 02 - Namaste JavaScript",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=ap-6PPAuK1Y",
        videoId: "ap-6PPAuK1Y",
        durationLabel: "39:06",
      },
      alternateVideos: [
        {
          title: "Creating a Promise, Chaining & Error Handling | Ep 03 Season 02 Namaste JavaScript",
          channel: "Akshay Saini",
          url: "https://www.youtube.com/watch?v=U74BJcr8NeQ",
          videoId: "U74BJcr8NeQ",
          durationLabel: "39:01",
        },
        {
          title: "Callback Hell | Ep  01 Season 02 - Namaste JavaScript",
          channel: "Akshay Saini",
          url: "https://www.youtube.com/watch?v=yEKtJGha3yM",
          videoId: "yEKtJGha3yM",
          durationLabel: "15:28",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "js-promises-q1",
          prompt:
            "What does this log?\n\n```js\nconst p = new Promise((resolve, reject) => {\n  console.log(\"A\");\n  resolve(1);\n  reject(new Error(\"x\"));\n  resolve(2);\n  console.log(\"B\");\n});\np.then((v) => console.log(\"C\", v));\nconsole.log(\"D\");\n```",
          options: ["`A B D C 1`", "`A D B C 1`", "`A B C 1 D`", "`A B D`, then an unhandled rejection"],
          correctIndex: 0,
          explanation:
            "The executor runs synchronously, so `A` and `B` print first; only the first `resolve(1)` counts and the later `reject`/`resolve` calls are silently ignored. The `then` handler is always asynchronous, so `D` prints before `C 1`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-promises-q2",
          prompt:
            "What does this log?\n\n```js\nPromise.reject(new Error(\"boom\"))\n  .then(() => console.log(\"1\"))\n  .catch((e) => {\n    console.log(\"2\", e.message);\n    return \"ok\";\n  })\n  .then((v) => console.log(\"3\", v))\n  .finally(() => console.log(\"4\"));\n```",
          options: ["`2 boom`, `3 ok`, `4`", "`1`, `2 boom`, `3 ok`, `4`", "`2 boom`, `4`", "`2 boom`, `3 undefined`, `4`"],
          correctIndex: 0,
          explanation:
            "The rejection skips the first `then` (it has no rejection handler), is handled by `catch`, and the value `catch` returns fulfils the next link, so the chain is recovered and `3 ok` prints before `finally`.",
        },
        {
          id: "js-promises-q3",
          prompt:
            "Which two values end up being logged (in either order)?\n\n```js\nPromise.resolve(1)\n  .finally(() => 2)\n  .then((v) => console.log(v));\n\nPromise.reject(new Error(\"a\"))\n  .finally(() => {\n    throw new Error(\"b\");\n  })\n  .catch((e) => console.log(e.message));\n```",
          options: ["`1` and `b`", "`2` and `b`", "`1` and `a`", "`2` and `a`"],
          correctIndex: 0,
          explanation:
            "`finally` ignores its callback's return value and passes the original outcome through, so the first chain logs `1`. The exception is when the callback throws (or returns a rejected promise): that replaces the outcome, so the second chain logs `b`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-promises-q4",
          prompt:
            "`promise` fulfils with `1`. What happens?\n\n```js\npromise.then(\n  (v) => {\n    throw new Error(\"in success handler\");\n  },\n  (e) => console.log(\"handled:\", e.message)\n);\n```",
          options: [
            "It becomes an unhandled rejection of the promise that `then` returns",
            "`handled: in success handler` is logged by the second callback",
            "The error is swallowed silently because `promise` itself fulfilled",
            "It throws synchronously at the `.then(...)` call site",
          ],
          correctIndex: 0,
          explanation:
            "The second argument of `then` only handles rejections of `promise` itself, not errors thrown by the first argument. Those reject the new promise that `then` returns. `.then(ok).catch(err)` is the pattern that covers both.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-promises-q5",
          prompt:
            "Both functions return promises. Which statements are true? (Select all that apply.)\n\n```js\nfetchUser()\n  .then((user) => {\n    fetchPosts(user.id);\n  })\n  .then((posts) => console.log(posts))\n  .catch(handleError);\n```",
          options: [
            "`posts` is `undefined`",
            "If `fetchPosts` rejects, `handleError` is not called for it",
            "The second `then` waits for `fetchPosts` to finish",
            "`posts` is the value `fetchPosts` resolves to",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "The block body has no `return`, so the handler returns `undefined` and the chain moves on immediately. The `fetchPosts` promise floats outside the chain: nothing waits for it and its rejection bypasses the `catch`. Writing `return fetchPosts(user.id)` fixes both.",
        },
        {
          id: "js-promises-q6",
          prompt:
            "What does this log?\n\n```js\nsetTimeout(() => console.log(\"timeout\"), 0);\nPromise.resolve()\n  .then(() => console.log(\"micro 1\"))\n  .then(() => console.log(\"micro 2\"));\nqueueMicrotask(() => console.log(\"micro 3\"));\nconsole.log(\"sync\");\n```",
          options: [
            "`sync`, `micro 1`, `micro 3`, `micro 2`, `timeout`",
            "`sync`, `micro 1`, `micro 2`, `micro 3`, `timeout`",
            "`sync`, `timeout`, `micro 1`, `micro 3`, `micro 2`",
            "`sync`, `micro 3`, `micro 1`, `micro 2`, `timeout`",
          ],
          correctIndex: 0,
          explanation:
            "The first `then` job and the `queueMicrotask` job are queued during the synchronous run, in that order. `micro 2` is only queued when `micro 1` finishes and fulfils its promise, so it lands behind `micro 3`. The timer is a task, so it waits for the whole microtask queue to drain.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-promises-q7",
          prompt: "What state does `outer` end up in?\n\n```js\nconst outer = new Promise((resolve) => {\n  resolve(Promise.reject(new Error(\"x\")));\n});\n```",
          options: [
            "Rejected with the error `x`",
            "Fulfilled, with a rejected promise object as its value",
            "Pending forever, because `resolve` was given a promise",
            "It throws synchronously inside the constructor",
          ],
          correctIndex: 0,
          explanation:
            "Resolving with a thenable doesn't fulfil with that object; it makes `outer` adopt the other promise's eventual state. That's why a promise can never be fulfilled with another promise as its value, and why `resolve` is not the same as \"fulfil\".",
        },
        {
          id: "js-promises-q8",
          prompt: "Which of these expressions produce a promise that rejects? (Select all that apply.)",
          options: [
            "`new Promise(() => { throw new Error(\"x\"); })`",
            "`Promise.resolve().then(() => { throw new Error(\"x\"); })`",
            "`Promise.resolve(Promise.reject(new Error(\"x\")))`",
            "`new Promise((res) => { res(1); throw new Error(\"x\"); })`",
            "`new Promise(() => { setTimeout(() => { throw new Error(\"x\"); }); })`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The constructor converts a synchronous throw in the executor into a rejection, a throw inside a handler rejects the derived promise, and `Promise.resolve(p)` returns `p` itself when it's a native promise. A throw after `res(1)` is ignored because the promise is already resolved, and a throw inside a timer callback happens later on a different stack: it's an uncaught exception and that promise stays pending forever.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-promises-q9",
          prompt:
            "In Node.js 24 with default settings, what happens?\n\n```js\nconst p = Promise.reject(new Error(\"x\"));\nsetTimeout(() => p.catch(() => {}), 0);\n```",
          options: [
            "The process exits with the unhandled rejection before the timer attaches the handler",
            "Nothing: the rejection is handled once the timer fires",
            "A warning is printed and the program carries on, then the handler runs",
            "`p.catch` throws because `p` has already settled",
          ],
          correctIndex: 0,
          explanation:
            "Node checks for unhandled rejections once the microtask queue drains, which is before any timer runs, and since Node 15 the default `--unhandled-rejections=throw` mode turns that into an uncaught exception. Browsers fire `unhandledrejection` instead (then `rejectionhandled` when the late handler arrives) and keep running.",
        },
        {
          id: "js-promises-q10",
          prompt: "What does this log?\n\n```js\nconst p = Promise.resolve(1);\np.then((v) => v + 1);\np.then((v) => console.log(v));\n```",
          options: ["`1`", "`2`", "`undefined`", "Nothing, because the first `then` consumed the value"],
          correctIndex: 0,
          explanation:
            "Both handlers are attached to `p`, so this is branching, not chaining: each gets `p`'s value `1`. The `v + 1` result goes to the promise returned by the first `then`, which nobody reads.",
        },
        {
          id: "js-promises-q11",
          prompt: "Which statements about promise states are true? (Select all that apply.)",
          options: [
            "A promise settles at most once; later `resolve`/`reject` calls are ignored",
            "After `resolve(otherPromise)` a promise can still be pending",
            "Handlers attached after a promise has settled still run, asynchronously",
            "A fulfilled promise can be moved to rejected by calling `reject`",
            "`Promise.prototype.then` mutates the original promise to hold the handler's return value",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Settlement is final and late handlers are still queued as microtasks. A promise resolved with another promise follows it and stays pending until that one settles. `then` never mutates the original; it returns a new promise.",
        },
      ],
    },
    {
      id: "js-promise-combinators",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "Promise.all, allSettled, race & any",
      summary:
        "The four combinators answer different questions about a group of concurrent operations, and picking the wrong one is a correctness bug, not a style choice. `Promise.all` asks \"did everything succeed?\": it fulfils with the results in input order and rejects as soon as any input rejects. `allSettled` asks \"how did each one end?\" and never rejects, giving `{ status, value }` or `{ status, reason }` records. `any` asks \"did at least one succeed?\": the first fulfilment wins, and only if every input rejects does it reject with an `AggregateError` whose `errors` are in input order. `race` asks \"what happened first?\" and settles with the first settlement of either kind.\n\nNone of them cancel anything. When `all` rejects or `race` settles, the losing operations keep running and holding sockets, and their results are dropped (the combinator attached handlers, so their rejections don't surface as unhandled). If the losers should stop, pass an `AbortSignal` into them, and prefer `AbortSignal.timeout()` over racing against a `setTimeout` that is never cleared.\n\nEmpty input is the classic interview edge: `all([])` and `allSettled([])` fulfil with `[]`, `any([])` rejects with an `AggregateError`, and `race([])` stays pending forever. Non-promise values are wrapped with `Promise.resolve`, so thenables are adopted. For fan-out to hundreds of requests none of these is enough on its own: `all` over 500 URLs starts 500 requests at once, so put a small concurrency pool in front of it.",
      level: "advanced",
      estMinutes: 90,
      webRefs: [
        { label: "MDN: Promise.any()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any", kind: "docs" },
        { label: "MDN: Promise.allSettled()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled", kind: "docs" },
        { label: "javascript.info: Promise API", url: "https://javascript.info/promise-api", kind: "article" },
        { label: "sudheerj: JavaScript Interview Questions", url: "https://github.com/sudheerj/javascript-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Promise APIs + Interview Questions 🔥 | S.02 Ep.05 - Namaste JavaScript  | all, allSettled, race, any",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=DlTVt1rZjIo",
        videoId: "DlTVt1rZjIo",
        durationLabel: "59:58",
      },
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `promiseAny(iterable)` with the semantics of `Promise.any`, without calling `Promise.any` itself.\n\n- Return a promise.\n- Fulfil with the value of the first input to fulfil. Rejections are ignored while any input can still fulfil.\n- Treat non-promise values as already fulfilled (wrap every input with `Promise.resolve`).\n- If every input rejects, reject with an `AggregateError` whose `errors` array holds the rejection reasons in input order, not in the order they happened.\n- An empty iterable rejects with an `AggregateError` whose `errors` is `[]`.\n- Accept any iterable (arrays, Sets, generators) and iterate it only once.\n\nThe tests call `runAnyScenario`, which builds inputs that settle after a given number of microtask ticks and reports how your promise settled. Leave the driver as it is.",
        starterCode: `/**
 * @param {Iterable<any>} iterable
 * @returns {Promise<any>}
 */
function promiseAny(iterable) {
  // Your code here
}

// ---- Test driver (leave as is) ----
// Each spec becomes one input:
//   { ok: v, ticks: n }   a promise that fulfils with v after n microtask ticks
//   { err: r, ticks: n }  a promise that rejects with r after n microtask ticks
//   { value: v }          a plain, non-promise value
async function runAnyScenario(specs, asGenerator) {
  const inputs = specs.map(makeInput);
  const iterable = asGenerator ? (function* () { yield* inputs; })() : inputs;
  let result;
  try {
    result = promiseAny(iterable);
  } catch (e) {
    return { threwSynchronously: String((e && e.message) || e) };
  }
  if (!result || typeof result.then !== "function") return { notAPromise: true };
  try {
    return { status: "fulfilled", value: await result };
  } catch (e) {
    return { status: "rejected", isAggregateError: e instanceof AggregateError, errors: e && e.errors };
  }
}

function makeInput(spec) {
  if ("value" in spec) return spec.value;
  return new Promise((resolve, reject) => {
    let n = spec.ticks || 0;
    const step = () => {
      if (n-- > 0) {
        Promise.resolve().then(step);
        return;
      }
      if ("ok" in spec) resolve(spec.ok);
      else reject(spec.err);
    };
    step();
  });
}
`,
        functionName: "runAnyScenario",
        testCases: [
          {
            description: "the first input to fulfil wins, even if it's later in the list",
            args: [[{ ok: "slow", ticks: 8 }, { ok: "fast", ticks: 2 }]],
            expected: { status: "fulfilled", value: "fast" },
          },
          {
            description: "an early rejection is ignored while another input can still fulfil",
            args: [[{ err: "e1", ticks: 0 }, { ok: "late", ticks: 10 }]],
            expected: { status: "fulfilled", value: "late" },
          },
          {
            description: "when everything rejects, errors are listed in input order, not settle order",
            args: [[{ err: "a", ticks: 12 }, { err: "b", ticks: 1 }, { err: "c", ticks: 6 }]],
            expected: { status: "rejected", isAggregateError: true, errors: ["a", "b", "c"] },
            isEdgeCase: true,
          },
          {
            description: "a plain value counts as already fulfilled",
            args: [[{ err: "x", ticks: 0 }, { value: 42 }]],
            expected: { status: "fulfilled", value: 42 },
          },
          {
            description: "an empty iterable rejects with an empty AggregateError",
            args: [[]],
            expected: { status: "rejected", isAggregateError: true, errors: [] },
            isEdgeCase: true,
          },
          {
            description: "a later fulfilment can't replace the first one",
            args: [[{ ok: "first", ticks: 3 }, { ok: "second", ticks: 9 }]],
            expected: { status: "fulfilled", value: "first" },
          },
          {
            description: "falsy fulfilment values still win",
            args: [[{ err: "x", ticks: 0 }, { ok: 0, ticks: 4 }, { err: "y", ticks: 9 }]],
            expected: { status: "fulfilled", value: 0 },
            isEdgeCase: true,
          },
          {
            description: "accepts a one-shot iterable (a generator)",
            args: [[{ err: "a", ticks: 1 }, { ok: "b", ticks: 5 }], true],
            expected: { status: "fulfilled", value: "b" },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "js-async-await",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "Async/Await & Try-Catch Patterns",
      summary:
        "`async`/`await` is syntax over promises and the microtask queue, not a different concurrency model. An async function runs synchronously until its first `await`, then returns a pending promise; each `await` suspends the function and queues its continuation as a microtask once the awaited value settles. Since a 2019 spec change (shipped in V8 7.2 / Chrome 72), awaiting a native promise costs one microtask tick instead of three, which is why interview ordering puzzles now have a single answer across engines. `await` on a non-promise still yields: `await null` defers the rest of the function.\n\nThe readability win hides two costs. Sequential `await`s serialise independent work: two 300 ms requests awaited one after the other take 600 ms, while `Promise.all` takes 300. The \"start both, then await each\" workaround (`const a = getA(); const b = getB(); await a; await b;`) leaves `b` unobserved while you wait for `a`, so if `b` rejects first you get an unhandled rejection; `Promise.all` or `allSettled` attaches handlers to everything at once.\n\nError handling follows the promise, not the syntax. `try/catch` only sees rejections you `await` inside it, so `return fetchX()` inside `try` escapes the `catch` while `return await fetchX()` doesn't. Array callbacks don't await: `forEach(async …)` fires everything and returns at once, and `filter(async …)` keeps every element because a promise is truthy. Returning a promise from an async function also takes two more ticks to settle than returning a plain value, a detail that decides many microtask-ordering questions.",
      level: "expert",
      estMinutes: 100,
      isMilestone: true,
      webRefs: [
        { label: "MDN: async function", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function", kind: "docs" },
        { label: "V8 blog: Faster async functions and promises", url: "https://v8.dev/blog/fast-async", kind: "article" },
        { label: "Jake Archibald: Tasks, microtasks, queues and schedules", url: "https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/", kind: "article" },
        { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
      ],
      video: {
        title: "async await | Namaste JavaScript - Season 02 - Ep 04",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=6nv3qy3oNkc",
        videoId: "6nv3qy3oNkc",
        durationLabel: "1:09:21",
      },
      alternateVideos: [
        {
          title: "JavaScript Visualized - Event Loop, Web APIs, (Micro)task Queue",
          channel: "Lydia Hallie",
          url: "https://www.youtube.com/watch?v=eiC58R16hb8",
          videoId: "eiC58R16hb8",
          durationLabel: "12:34",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "js-async-await-q1",
          prompt:
            "What does this log?\n\n```js\nasync function a() {\n  console.log(\"a1\");\n  await b();\n  console.log(\"a2\");\n}\nasync function b() {\n  console.log(\"b\");\n}\n\nconsole.log(\"start\");\nsetTimeout(() => console.log(\"timeout\"), 0);\na();\nPromise.resolve().then(() => console.log(\"then\"));\nconsole.log(\"end\");\n```",
          options: [
            "`start a1 b end a2 then timeout`",
            "`start a1 end b a2 then timeout`",
            "`start a1 b end then a2 timeout`",
            "`start end a1 b a2 then timeout`",
          ],
          correctIndex: 0,
          explanation:
            "`a` and `b` run synchronously up to the `await`, so `a1` and `b` print before `end`. The `a2` continuation is queued before the `then` callback because `await b()` is reached first, and awaiting an already-resolved native promise costs one tick. The timer runs after all microtasks.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-async-await-q2",
          prompt:
            "What does this log?\n\n```js\nasync function f1() { return Promise.resolve(1); }\nasync function f2() { return await Promise.resolve(2); }\nasync function f3() { return 3; }\n\nf1().then(console.log);\nf2().then(console.log);\nf3().then(console.log);\n```",
          options: ["`3 2 1`", "`1 2 3`", "`3 1 2`", "`2 3 1`"],
          correctIndex: 0,
          explanation:
            "`f3`'s promise is fulfilled as soon as it returns, so its handler runs on the first tick. `f2` spends one tick on the `await`, then fulfils. `f1` resolves its promise with another promise, which queues a job that calls that promise's `then` and costs two extra ticks, so `1` prints last.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-async-await-q3",
          prompt:
            "`fetchConfig()` returns a promise that rejects. What does `load()` do?\n\n```js\nasync function load() {\n  try {\n    return fetchConfig();\n  } catch {\n    return \"fallback\";\n  }\n}\n```",
          options: [
            "Its promise rejects with `fetchConfig`'s error; the `catch` block never runs",
            "Its promise resolves to `\"fallback\"`",
            "Its promise resolves to the pending promise object from `fetchConfig`",
            "It throws synchronously when called",
          ],
          correctIndex: 0,
          explanation:
            "The `try` block finishes as soon as it returns the promise, before that promise rejects, so there's nothing for `catch` to catch; the async function's promise then adopts the rejection. `return await fetchConfig()` keeps the rejection inside the `try`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-async-await-q4",
          prompt:
            "Which statements are true? (Select all that apply.)\n\n```js\nconst sleep = (ms) => new Promise((r) => setTimeout(r, ms));\n\nasync function run() {\n  const out = [];\n  [3, 1, 2].forEach(async (n) => {\n    await sleep(n * 10);\n    out.push(n);\n  });\n  console.log(out);\n  return out;\n}\nrun();\n```",
          options: [
            "It logs `[]`",
            "About 30 ms later, `out` contains `[1, 2, 3]`",
            "It logs `[3, 1, 2]`",
            "`run()` resolves only after all three callbacks have finished",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`forEach` ignores the promises its callback returns, so `run` logs and resolves immediately with the still-empty array. The callbacks finish later in timer order, filling `out` with `[1, 2, 3]`. Use `for...of` with `await`, or `await Promise.all(arr.map(...))`.",
        },
        {
          id: "js-async-await-q5",
          prompt:
            "Which statements are true? (Select all that apply.)\n\n```js\nasync function load() {\n  const userP = fetchUser();         // fulfils after 300 ms\n  const settingsP = fetchSettings(); // rejects after 50 ms\n  try {\n    const user = await userP;\n    const settings = await settingsP;\n    return { user, settings };\n  } catch (err) {\n    return null;\n  }\n}\n```",
          options: [
            "The two requests run concurrently",
            "An unhandled rejection is reported for `settingsP` around the 50 ms mark (in Node's default mode that crashes the process)",
            "The `catch` block runs at the 50 ms mark",
            "`await Promise.all([userP, settingsP])` would reject at about 50 ms without any unhandled rejection",
            "Starting both calls before the first `await` guarantees every error reaches the `catch`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation:
            "Both calls start before any `await`, so they overlap. But while the function is suspended on `userP`, nothing has subscribed to `settingsP`, so its rejection at 50 ms is unhandled; the `catch` only runs after 300 ms. `Promise.all` subscribes to every input immediately and rejects with the first error.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-async-await-q6",
          prompt:
            "What does this log?\n\n```js\nasync function f() {\n  console.log(\"f1\");\n  await null;\n  console.log(\"f2\");\n  await null;\n  console.log(\"f3\");\n}\n\nf();\nPromise.resolve()\n  .then(() => console.log(\"p1\"))\n  .then(() => console.log(\"p2\"));\nconsole.log(\"sync\");\n```",
          options: ["`f1 sync f2 p1 f3 p2`", "`f1 f2 f3 sync p1 p2`", "`f1 sync p1 p2 f2 f3`", "`f1 sync f2 f3 p1 p2`"],
          correctIndex: 0,
          explanation:
            "`await null` still suspends for one microtask. After `sync`, the queue holds the `f2` continuation and `p1`; each of them queues the next step (`f3` and `p2`) when it runs, so the two chains interleave.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-async-await-q7",
          prompt:
            "What happens?\n\n```js\nasync function f() {\n  throw new Error(\"x\");\n}\n\ntry {\n  f();\n  console.log(\"after\");\n} catch {\n  console.log(\"caught\");\n}\n```",
          options: [
            "`after` is logged, then the rejection is reported as unhandled",
            "`caught` is logged, because `f()` throws inside the `try`",
            "`caught` then `after` are logged",
            "`after` is logged and the error is swallowed silently",
          ],
          correctIndex: 0,
          explanation:
            "An async function never throws at the call site: the error becomes a rejection of the promise it returns. Nothing awaits or catches that promise, so `after` prints and the rejection goes unhandled. `await f()` inside an async function would route it to `catch`.",
        },
        {
          id: "js-async-await-q8",
          prompt:
            "Inside an async function, which of these save the items one at a time, waiting for each `save(item)` promise before starting the next? (Select all that apply.)",
          options: [
            "`for (const item of items) await save(item);`",
            "`for (let i = 0; i < items.length; i++) await save(items[i]);`",
            "`await items.reduce((p, item) => p.then(() => save(item)), Promise.resolve());`",
            "`items.forEach(async (item) => { await save(item); });`",
            "`await Promise.all(items.map((item) => save(item)));`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Loops that `await` in their own body, and a `reduce` that chains each call onto the previous promise, are sequential. `forEach` starts every call at once and doesn't wait at all; `Promise.all` over `map` waits, but all calls run concurrently.",
        },
        {
          id: "js-async-await-q9",
          prompt:
            "`p1` rejects at 100 ms and `p2` rejects at 200 ms. What happens to `p2`'s rejection?\n\n```js\ntry {\n  await Promise.all([p1, p2]);\n} catch (e) {\n  console.log(e.message);\n}\n```",
          options: [
            "Nothing: `Promise.all` has already subscribed to `p2`, so it counts as handled",
            "It's reported as an unhandled rejection at the 200 ms mark",
            "It's delivered to the same `catch` block a second time",
            "It replaces `e` if it arrives before the `catch` block finishes",
          ],
          correctIndex: 0,
          explanation:
            "`Promise.all` subscribes to every input up front, so later rejections are handled (and ignored) by its internals. That also means they're silently lost; use `allSettled` when you need every failure.",
        },
        {
          id: "js-async-await-q10",
          prompt:
            "`isActive` resolves to `false` for every user. What does this log?\n\n```js\nconst users = [{ id: 1 }, { id: 2 }, { id: 3 }];\nconst active = users.filter(async (u) => await isActive(u.id));\nconsole.log(active.length);\n```",
          options: ["`3`", "`0`", "A pending promise", "It throws a `TypeError`"],
          correctIndex: 0,
          explanation:
            "An async callback always returns a promise, and any promise object is truthy, so `filter` keeps every element synchronously. Resolve the checks first (`const flags = await Promise.all(users.map(...))`), then filter by the flags.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-async-await-q11",
          prompt:
            "Why do microtask-ordering puzzles involving `await` now give the same output in current Chrome, Firefox, Safari and Node, when engines from 2017–2018 disagreed?",
          options: [
            "A 2019 spec change made `await` of a native promise take one microtask tick instead of three, and engines implemented it",
            "`await` continuations were moved to the macrotask queue in every engine",
            "Engines now run the rest of the function synchronously when the awaited promise is already resolved",
            "Node.js patched its event loop to copy the browsers' behaviour",
          ],
          correctIndex: 0,
          explanation:
            "The V8 team proposed the \"await optimization\" (V8 7.2 / Chrome 72) and the spec was patched to match, so `await p` no longer wraps a native promise in a throwaway promise. Continuations are still always asynchronous microtasks, even for resolved promises.",
        },
      ],
    },
    {
      id: "js-generators-iterators",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "Generators & Iterators",
      summary:
        "Generators exist because a hand-written iterator is a hand-written state machine: an object with `next()` that has to remember where it was. A `function*` lets the engine keep that state by suspending at each `yield` and resuming on the next `next()` call, which makes generators the natural way to implement the iteration protocol (`[Symbol.iterator]()` returning an object whose `next()` gives `{ value, done }`). Anything that speaks the protocol works with `for...of`, spread, destructuring, `Array.from`, the `Map`/`Set` constructors and `yield*`.\n\nThe payoff is laziness. A pipeline of generators pulls one value at a time through every stage, so you can walk infinite sequences, paginated APIs or huge files in constant memory and stop early without wasted work, whereas `arr.map().filter().slice()` materialises every intermediate array. ES2025 standardised this as iterator helpers (`Iterator.prototype.map`, `filter`, `take`, `drop`, `flatMap`, `toArray`…), Baseline since March 2025. The cost is per-item overhead: for small arrays already in memory, plain array methods are usually faster.\n\nThe senior-level details live in the protocol's return path. Leaving a `for...of` early (`break`, `return`, or an exception) calls the iterator's `return()`, which runs the generator's `finally` blocks, so cleanup like closing a file handle happens even on early exit; driving an iterator by hand with `next()` skips that unless you call `return()` yourself. Generator objects are single-use, so iterating one a second time yields nothing. And `next(value)` sends a value back in as the result of the paused `yield`, the mechanism libraries like co used to emulate async/await.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "MDN: Iteration protocols", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols", kind: "docs" },
        { label: "MDN: Iterator (iterator helpers)", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator", kind: "docs" },
        { label: "javascript.info: Generators", url: "https://javascript.info/generators", kind: "article" },
        { label: "TC39: Iterator helpers proposal", url: "https://github.com/tc39/proposal-iterator-helpers", kind: "repo" },
      ],
      video: {
        title: "Learn JavaScript Generators In 12 Minutes",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=IJ6EgdiI_wU",
        videoId: "IJ6EgdiI_wU",
        durationLabel: "12:11",
      },
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement three lazy helpers as generator functions. Each takes any iterable and returns an iterable that produces values on demand.\n\n- `lazyMap(iterable, fn)` yields `fn(value)` for each value.\n- `lazyFilter(iterable, predicate)` yields only the values for which `predicate(value)` is truthy.\n- `lazyTake(iterable, n)` yields at most the first `n` values, then stops.\n\nThe rules the tests check:\n\n- Stay lazy: never pull more values from the source than the consumer needs, and never copy the input into an array. The tests use an infinite source.\n- `lazyTake` must not pull an extra value after the `n`th one, and `lazyTake(source, 0)` must not pull anything.\n- When `lazyTake` stops early, the upstream iterators must be closed (their `return()` called) so their `finally` blocks run. `for...of` does this for you when you `return` from inside the loop.\n\nThe tests call `runPipeline(source, steps)`: `source` is `\"naturals\"` (1, 2, 3, … forever) or an array, and `steps` is a list like `[[\"map\", \"square\"], [\"take\", 3]]`. It returns the values produced, how many values were pulled from the source, and whether the source was left open. Leave the driver as it is.",
        starterCode: `function* lazyMap(iterable, fn) {
  // Your code here
}

function* lazyFilter(iterable, predicate) {
  // Your code here
}

function* lazyTake(iterable, n) {
  // Your code here
}

// ---- Test driver (leave as is) ----
const FNS = {
  square: (x) => x * x,
  double: (x) => x * 2,
  inc: (x) => x + 1,
  isEven: (x) => x % 2 === 0,
  isOdd: (x) => x % 2 === 1,
};

function runPipeline(source, steps) {
  const stats = { pulled: 0, started: false, finished: false };
  function* counted() {
    stats.started = true;
    try {
      if (source === "naturals") {
        for (let i = 1; ; i++) {
          if (++stats.pulled > 100000) throw new Error("Pulled over 100,000 values: the pipeline isn't lazy, or take never stops");
          yield i;
        }
      } else {
        for (const x of source) {
          stats.pulled++;
          yield x;
        }
      }
    } finally {
      stats.finished = true;
    }
  }
  let it = counted();
  for (const [op, arg] of steps) {
    if (op === "map") it = lazyMap(it, FNS[arg]);
    else if (op === "filter") it = lazyFilter(it, FNS[arg]);
    else if (op === "take") it = lazyTake(it, arg);
  }
  const values = [];
  for (const v of it) values.push(v);
  return { values, pulled: stats.pulled, leftOpen: stats.started && !stats.finished };
}
`,
        functionName: "runPipeline",
        testCases: [
          {
            description: "map then take on an infinite source pulls exactly five values",
            args: ["naturals", [["map", "square"], ["take", 5]]],
            expected: { values: [1, 4, 9, 16, 25], pulled: 5, leftOpen: false },
          },
          {
            description: "filter, map and take compose lazily",
            args: ["naturals", [["filter", "isEven"], ["map", "square"], ["take", 3]]],
            expected: { values: [4, 16, 36], pulled: 6, leftOpen: false },
          },
          {
            description: "a finite source without take is consumed to the end",
            args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [["filter", "isOdd"], ["map", "double"]]],
            expected: { values: [2, 6, 10, 14, 18], pulled: 10, leftOpen: false },
          },
          {
            description: "take more than is available just yields everything",
            args: [[5, 6, 7], [["take", 10]]],
            expected: { values: [5, 6, 7], pulled: 3, leftOpen: false },
            isEdgeCase: true,
          },
          {
            description: "take(0) never touches the source",
            args: ["naturals", [["take", 0]]],
            expected: { values: [], pulled: 0, leftOpen: false },
            isEdgeCase: true,
          },
          {
            description: "take in the middle of a pipeline closes everything upstream",
            args: ["naturals", [["map", "inc"], ["take", 2], ["map", "double"]]],
            expected: { values: [4, 6], pulled: 2, leftOpen: false },
            isEdgeCase: true,
          },
          {
            description: "an empty source produces nothing",
            args: [[], [["map", "square"], ["filter", "isEven"]]],
            expected: { values: [], pulled: 0, leftOpen: false },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "js-currying",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "Currying & Partial Application",
      summary:
        "Currying turns a function of n arguments into a chain of unary functions, `f(a, b, c)` into `f(a)(b)(c)`; partial application fixes some arguments now and takes the rest later, which is what `fn.bind(null, a)` does. JavaScript libraries (lodash `curry`, Ramda) implement a looser variadic version: keep collecting arguments across calls until `fn.length` of them have arrived, then call through. The point is reuse and composition: `const getJson = request(\"GET\")(headers)` builds specialised functions from general ones, and data-last curried functions slot into `pipe`/`compose` chains and point-free callbacks such as `users.map(prop(\"id\"))`.\n\nThe tradeoffs are readability and debuggability. Deeply curried code fills stack traces with anonymous wrapper frames, TypeScript struggles to type a variadic `curry` precisely, and hot paths pay for every intermediate closure and argument array. Most application code is clearer with a named helper or an arrow function (`(id) => fetchUser(api, id)`) than with generic currying.\n\nThe implementation gotchas are exactly what interviewers probe. `fn.length` ignores rest parameters and everything from the first default parameter on (`(a, b = 1) => {}` has length 1, `(...args) => {}` has 0), so `curry` can't know the arity of variadic functions; that's why the infinite `sum(1)(2)(3)()` puzzle needs an explicit terminating call. A curried function must not accumulate arguments in one shared array, or reusing a partial application (`const add5 = add(5)` called twice) corrupts later calls. And arguments beyond the arity should be forwarded, not dropped, so the curried function behaves like the original.",
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        { label: "MDN: Function.prototype.length", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length", kind: "docs" },
        { label: "javascript.info: Currying", url: "https://javascript.info/currying-partials", kind: "article" },
        { label: "sudheerj: JavaScript Interview Questions", url: "https://github.com/sudheerj/javascript-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Currying in Javascript | JS Interview Questions",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=vQcCNpuaJO8",
        videoId: "vQcCNpuaJO8",
        durationLabel: "8:13",
      },
      alternateVideos: [
        {
          title: "sum(1)(2)(3)(4)..( n)() | Amazon UI/Frontend Javascript Interview Question",
          channel: "Akshay Saini",
          url: "https://www.youtube.com/watch?v=D5ENjfSkHY4",
          videoId: "D5ENjfSkHY4",
          durationLabel: "16:46",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `curry(fn)`. It returns a function that collects arguments across calls until at least `fn.length` arguments have been supplied, then calls `fn` with all of them and returns the result.\n\n- Each call may pass any number of arguments: `c(1)(2)(3)`, `c(1, 2)(3)` and `c(1, 2, 3)` all work.\n- Until enough arguments have arrived, a call returns a new curried function. A call with no arguments doesn't add anything.\n- Partial applications are reusable: `const add1 = c(1)` can be continued many times with different arguments, and one continuation must not affect another.\n- Arguments beyond `fn.length` are passed through to `fn`, not dropped.\n- If `fn.length` is 0, calling the curried function calls `fn`.\n- Preserve `this` when calling `fn`.\n\nThe tests call `runCurry(fnName, prefix, branches)`, which curries a known function, applies the `prefix` calls once, then continues each branch from that shared partial application. Unfinished results are reported as `\"[function]\"`. Leave the driver as it is.",
        starterCode: `/**
 * @param {Function} fn
 * @returns {Function}
 */
function curry(fn) {
  // Your code here
}

// ---- Test driver (leave as is) ----
const FNS = {
  add3: (a, b, c) => a + b + c,
  join4: (a, b, c, d) => [a, b, c, d].join("-"),
  now: () => "called",
  sumAll: function (a, b) {
    return Array.prototype.reduce.call(arguments, (sum, x) => sum + x, 0);
  },
};

// Curries FNS[fnName], applies the \`prefix\` calls once, then runs each branch
// (a list of calls) starting from that shared partial application.
function runCurry(fnName, prefix, branches) {
  const apply = (f, calls) => calls.reduce((g, args) => g(...args), f);
  const shared = apply(curry(FNS[fnName]), prefix);
  return branches.map((calls) => {
    const out = apply(shared, calls);
    return typeof out === "function" ? "[function]" : out;
  });
}
`,
        functionName: "runCurry",
        testCases: [
          { description: "one argument per call", args: ["add3", [], [[[1], [2], [3]]]], expected: [6] },
          {
            description: "any grouping of arguments works",
            args: ["add3", [], [[[1, 2], [3]], [[1], [2, 3]], [[1, 2, 3]]]],
            expected: [6, 6, 6],
          },
          {
            description: "four-argument function, mixed groupings, and an unfinished chain",
            args: ["join4", [], [[["a"], ["b", "c"], ["d"]], [["a", "b", "c", "d"]], [["a"], ["b"], ["c"]]]],
            expected: ["a-b-c-d", "a-b-c-d", "[function]"],
          },
          {
            description: "a shared partial application can be reused without leaking arguments",
            args: ["add3", [[1]], [[[2], [3]], [[10], [20]], [[2, 3]]]],
            expected: [6, 31, 6],
            isEdgeCase: true,
          },
          {
            description: "extra arguments are forwarded to fn",
            args: ["sumAll", [], [[[1], [2, 3, 4]], [[5, 5, 5]]]],
            expected: [10, 15],
            isEdgeCase: true,
          },
          { description: "a zero-arity function runs on the first call", args: ["now", [], [[[]]]], expected: ["called"], isEdgeCase: true },
          {
            description: "calls with no arguments don't advance the chain",
            args: ["add3", [[]], [[[1], [], [2], [3]]]],
            expected: [6],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "js-debounce-throttle",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "Debounce vs Throttle",
      summary:
        "Debounce and throttle both decouple how often an event fires from how often you do expensive work in response, and they answer different product questions. Debounce waits for quiet: the function runs once, `wait` ms after the last call in a burst, which suits search-as-you-type, autosave and resize-then-relayout, where only the final state matters. Throttle guarantees a cadence: at most one run per `wait` ms while events keep coming, which suits scroll tracking, drag handlers and progress reporting, where intermediate states matter but 120 events a second is too many.\n\nThe variants are where bugs hide. A lodash-style throttle runs on the leading edge and again on the trailing edge with the latest arguments, so the final position is never lost; a leading-only throttle drops the last event. A trailing debounce adds its full delay before the first response, which feels sluggish for button clicks (debounce on the leading edge there), and it needs a `maxWait` if a never-ending stream must still produce updates. Both wrappers are closures holding timer state, so create them once per component or instance, never inside a render or handler, or every call gets a fresh wrapper and nothing is collapsed.\n\nFor visual updates, `requestAnimationFrame` is often the better throttle: it aligns work with the display refresh and pauses in background tabs. Timers are clamped in background tabs anyway, so a debounce is not a scheduling guarantee. And expose `cancel()` (ideally `flush()` too), so unmounting code can drop a pending call instead of letting it run against torn-down state.",
      level: "advanced",
      estMinutes: 65,
      webRefs: [
        { label: "MDN: Debounce (glossary)", url: "https://developer.mozilla.org/en-US/docs/Glossary/Debounce", kind: "docs" },
        { label: "MDN: Throttle (glossary)", url: "https://developer.mozilla.org/en-US/docs/Glossary/Throttle", kind: "docs" },
        { label: "CSS-Tricks: Debouncing and Throttling Explained Through Examples", url: "https://css-tricks.com/debouncing-throttling-explained-examples/", kind: "article" },
        { label: "sudheerj: JavaScript Interview Questions", url: "https://github.com/sudheerj/javascript-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Debouncing vs Throttling | Walmart UI Interview Question",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=tJhA0DrH5co",
        videoId: "tJhA0DrH5co",
        durationLabel: "26:37",
      },
      alternateVideos: [
        {
          title: "Debouncing in Javascript | Flipkart UI Interview Question",
          channel: "Akshay Saini",
          url: "https://www.youtube.com/watch?v=Zo-6_qx8uxg",
          videoId: "Zo-6_qx8uxg",
          durationLabel: "16:19",
        },
        {
          title: "Throttling in Javascript | Walmart Frontend Interview Question",
          channel: "Akshay Saini",
          url: "https://www.youtube.com/watch?v=81NGEXAaa3Y",
          videoId: "81NGEXAaa3Y",
          durationLabel: "22:21",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement both wrappers. Each receives a `timers` object with `setTimeout(callback, ms)` and `clearTimeout(id)`. Use only those (no global timers, no `Date.now()`): the tests run on a fake clock.\n\n`debounce(fn, wait, timers)` returns a function that delays calling `fn` until `wait` ms have passed without another call, then calls `fn` once with the latest arguments. Each new call cancels the pending timer and starts a new one.\n\n`throttle(fn, wait, timers)` returns a function that runs `fn` at most once per `wait` ms, on both edges:\n\n- If no cooldown is active, call `fn` immediately and start a `wait` ms cooldown.\n- A call during a cooldown only remembers its arguments (the latest call wins).\n- When a cooldown ends, if a call was remembered, call `fn` with those arguments and start a new cooldown; otherwise go idle.\n\nBoth wrappers preserve `this` and pass arguments through. The tests call `runTimingScenario(kind, wait, callTimes, endTime)` with `kind` set to `\"debounce\"` or `\"throttle\"`. It fires one call at each time in `callTimes` (the i-th call gets argument `i`), runs the clock to `endTime` and reports when `fn` ran and with which argument. Leave the driver as it is.",
        starterCode: `/**
 * @param {Function} fn
 * @param {number} wait
 * @param {{ setTimeout: Function, clearTimeout: Function }} timers
 */
function debounce(fn, wait, timers) {
  // Your code here
}

/**
 * @param {Function} fn
 * @param {number} wait
 * @param {{ setTimeout: Function, clearTimeout: Function }} timers
 */
function throttle(fn, wait, timers) {
  // Your code here
}

// ---- Test driver (leave as is) ----
function runTimingScenario(kind, wait, callTimes, endTime) {
  const clock = createFakeClock();
  const timers = { setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout };
  const runs = [];
  const record = (arg) => runs.push({ at: clock.now(), arg });
  const wrapped = kind === "throttle" ? throttle(record, wait, timers) : debounce(record, wait, timers);
  callTimes.forEach((t, i) => clock.at(t, () => wrapped(i)));
  clock.runUntil(endTime);
  return runs;
}

function createFakeClock() {
  let now = 0, nextId = 1, seq = 0, queue = [];
  const schedule = (time, cb) => {
    const id = nextId++;
    queue.push({ id, time, seq: seq++, cb });
    return id;
  };
  return {
    now: () => now,
    setTimeout: (cb, ms = 0) => schedule(now + Math.max(0, ms), cb),
    clearTimeout: (id) => { queue = queue.filter((t) => t.id !== id); },
    at: (time, cb) => schedule(time, cb),
    runUntil(end) {
      for (;;) {
        queue.sort((a, b) => a.time - b.time || a.seq - b.seq);
        const next = queue[0];
        if (!next || next.time > end) break;
        queue.shift();
        now = next.time;
        next.cb();
      }
      now = end;
    },
  };
}
`,
        functionName: "runTimingScenario",
        testCases: [
          { description: "debounce: a single call fires once after `wait`", args: ["debounce", 100, [0], 1000], expected: [{ at: 100, arg: 0 }] },
          {
            description: "debounce: a burst collapses into one call with the latest argument",
            args: ["debounce", 100, [0, 30, 60, 90], 1000],
            expected: [{ at: 190, arg: 3 }],
          },
          {
            description: "debounce: calls spaced further apart than `wait` each fire",
            args: ["debounce", 100, [0, 150, 400], 1000],
            expected: [{ at: 100, arg: 0 }, { at: 250, arg: 1 }, { at: 500, arg: 2 }],
          },
          { description: "debounce: no calls means no runs", args: ["debounce", 100, [], 1000], expected: [], isEdgeCase: true },
          {
            description: "debounce: a pending call hasn't fired yet when time stops",
            args: ["debounce", 100, [0, 50], 120],
            expected: [],
            isEdgeCase: true,
          },
          {
            description: "debounce: 1,000 calls 1 ms apart collapse into one",
            args: ["debounce", 100, Array.from({ length: 1000 }, (_, i) => i), 5000],
            expected: [{ at: 1099, arg: 999 }],
            isEdgeCase: true,
          },
          { description: "throttle: a single call runs immediately", args: ["throttle", 100, [0], 1000], expected: [{ at: 0, arg: 0 }] },
          {
            description: "throttle: a burst runs on the leading edge, then once on the trailing edge with the latest argument",
            args: ["throttle", 100, [0, 30, 60, 90], 1000],
            expected: [{ at: 0, arg: 0 }, { at: 100, arg: 3 }],
          },
          {
            description: "throttle: a steady stream runs once per window",
            args: ["throttle", 100, [0, 30, 60, 90, 120, 150, 180, 210, 240], 1000],
            expected: [{ at: 0, arg: 0 }, { at: 100, arg: 3 }, { at: 200, arg: 6 }, { at: 300, arg: 8 }],
          },
          {
            description: "throttle: calls spaced further apart than `wait` each run immediately",
            args: ["throttle", 100, [0, 150, 400], 1000],
            expected: [{ at: 0, arg: 0 }, { at: 150, arg: 1 }, { at: 400, arg: 2 }],
          },
          { description: "throttle: no calls means no runs", args: ["throttle", 100, [], 1000], expected: [], isEdgeCase: true },
          {
            description: "throttle: the trailing call hasn't fired yet when time stops",
            args: ["throttle", 100, [0, 50], 80],
            expected: [{ at: 0, arg: 0 }],
            isEdgeCase: true,
          },
          {
            description: "throttle: 1,000 calls at the same instant run twice (leading and trailing)",
            args: ["throttle", 100, Array.from({ length: 1000 }, () => 0), 5000],
            expected: [{ at: 0, arg: 0 }, { at: 100, arg: 999 }],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "js-prototypes",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "Prototypes & Prototypal Inheritance",
      summary:
        "JavaScript's object model is delegation, not copying: every object has an internal `[[Prototype]]` link, and a property read that misses on the object walks that chain until it finds the key or reaches `null`. Classes, `extends`, `super` and `instanceof` are all built on this. It gives you cheap shared behaviour (a method lives once on `Constructor.prototype`, not once per instance) and runtime flexibility (changing a prototype object changes every object that delegates to it), at the cost of lookups that depend on the chain's shape.\n\nKeep three things apart. `Object.getPrototypeOf(obj)` (the legacy `obj.__proto__`) is an object's link. `Fn.prototype` is the object that becomes the link for instances created by `new Fn()`. And `Object.getPrototypeOf(Fn)` is `Function.prototype`, because functions are objects too. Reads walk the chain but writes don't: `obj.x = 1` creates an own property that shadows the inherited one, unless the inherited property is a setter (which then runs with `this` set to `obj`) or is non-writable (the write fails). That's why a mutable array on a prototype is a classic bug: `this.items.push()` mutates the one shared array, while `this.items = []` shadows it.\n\nV8 optimises property access with hidden classes and inline caches keyed on object shape, so `Object.setPrototypeOf` on a live object, or patching built-in prototypes, can deoptimise hot code: set the prototype at creation with `Object.create(proto)`. Use `Object.create(null)` or a `Map` for dictionaries keyed by user input, since a `__proto__` key in an ordinary object is the root of prototype-pollution bugs. `instanceof` only asks whether `Fn.prototype` is on the chain, so it fails across realms (iframes) and changes if `prototype` is reassigned.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "MDN: Inheritance and the prototype chain", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain", kind: "docs" },
        { label: "javascript.info: Prototypal inheritance", url: "https://javascript.info/prototype-inheritance", kind: "article" },
        { label: "javascript.info: F.prototype", url: "https://javascript.info/function-prototype", kind: "article" },
        { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Prototype and Prototypal Inheritance in Javascript | Frontend Interview Question",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=wstwjQ1yqWQ",
        videoId: "wstwjQ1yqWQ",
        durationLabel: "20:22",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-prototypes-q1",
          prompt:
            "What does this log?\n\n```js\nfunction Dog(name) { this.name = name; }\nDog.prototype.speak = function () { return \"barks\"; };\nconst a = new Dog(\"A\");\n\nDog.prototype.speak = function () { return \"woofs\"; };\nDog.prototype = { speak() { return \"meows\"; } };\nconst b = new Dog(\"B\");\n\nconsole.log(a.speak(), b.speak(), a instanceof Dog);\n```",
          options: ["`woofs meows false`", "`barks meows true`", "`meows meows true`", "`woofs meows true`"],
          correctIndex: 0,
          explanation:
            "`a` is linked to the original prototype object, whose `speak` was replaced before the object itself was swapped out, so it finds `woofs`. `b` links to the new object. `instanceof` checks whether the current `Dog.prototype` is on `a`'s chain, and it isn't any more.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-prototypes-q2",
          prompt:
            "What does this log?\n\n```js\nfunction Cart() {}\nCart.prototype.items = [];\n\nconst c1 = new Cart();\nconst c2 = new Cart();\nc1.items.push(\"apple\");\nc2.items = [\"pear\"];\n\nconsole.log(c1.items, c2.items, new Cart().items);\n```",
          options: [
            "`[\"apple\"] [\"pear\"] [\"apple\"]`",
            "`[\"apple\"] [\"pear\"] []`",
            "`[\"apple\", \"pear\"] [\"apple\", \"pear\"] [\"apple\", \"pear\"]`",
            "`[\"apple\"] [\"apple\", \"pear\"] []`",
          ],
          correctIndex: 0,
          explanation:
            "`c1.items.push` reads the shared array through the chain and mutates it, so every instance without its own `items` sees `apple`. `c2.items = …` is a write, which creates an own property on `c2` and shadows the shared array without touching it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-prototypes-q3",
          prompt: "Given `class A {}` and `const a = new A()`, which expressions are `true`? (Select all that apply.)",
          options: [
            "`Object.getPrototypeOf(a) === A.prototype`",
            "`Object.getPrototypeOf(A) === Function.prototype`",
            "`A.prototype.constructor === A`",
            "`Object.getPrototypeOf(A.prototype) === Object.prototype`",
            "`a.prototype === A.prototype`",
            "`Object.getPrototypeOf(Object.prototype) === Object.prototype`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Instances link to `A.prototype`, which links to `Object.prototype`, while the class itself is a function linked to `Function.prototype`. Instances have no `prototype` property (so `a.prototype` is `undefined`), and the chain ends because `Object.prototype`'s prototype is `null`.",
        },
        {
          id: "js-prototypes-q4",
          prompt:
            "What does this log?\n\n```js\nconst dict = Object.create(null);\ndict.key = 1;\nconsole.log(\"toString\" in dict, typeof dict.hasOwnProperty, Object.hasOwn(dict, \"key\"));\n```",
          options: ["`false undefined true`", "`true function true`", "`false function true`", "It throws because `dict` has no prototype"],
          correctIndex: 0,
          explanation:
            "An object created with a `null` prototype inherits nothing, not even `toString` or `hasOwnProperty`, which is exactly why it's safe as a dictionary. The static `Object.hasOwn` works on it; `dict.hasOwnProperty(...)` would throw.",
        },
        {
          id: "js-prototypes-q5",
          prompt:
            "What does this log?\n\n```js\nconst proto = {\n  set name(v) { this._name = v.toUpperCase(); },\n  get name() { return this._name; },\n};\nconst obj = Object.create(proto);\nobj.name = \"ada\";\nconsole.log(obj.name, Object.keys(obj));\n```",
          options: ["`ADA [\"_name\"]`", "`ada [\"name\"]`", "`ADA [\"name\", \"_name\"]`", "`undefined []`"],
          correctIndex: 0,
          explanation:
            "Assignment finds the inherited accessor and calls its setter with `this` set to `obj`, so no own `name` is created; only `_name` is. This is the one case where a write through the chain doesn't simply shadow.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-prototypes-q6",
          prompt: "An array created inside an iframe is passed to the parent page as `x`. Which check reliably says it's an array?",
          options: ["`Array.isArray(x)`", "`x instanceof Array`", "`x.constructor === Array`", "`Object.getPrototypeOf(x) === Array.prototype`"],
          correctIndex: 0,
          explanation:
            "Each realm has its own `Array` and `Array.prototype`, so the prototype-based checks compare against the parent's copies and return `false`. `Array.isArray` checks the object's internal kind, which works across realms.",
        },
        {
          id: "js-prototypes-q7",
          prompt:
            "What does this log?\n\n```js\nconst base = { a: 1 };\nconst child = Object.create(base);\nchild.b = 2;\n\nconst keys = [];\nfor (const k in child) keys.push(k);\nconsole.log(keys, Object.keys(child));\n```",
          options: ["`[\"b\", \"a\"] [\"b\"]`", "`[\"b\"] [\"b\"]`", "`[\"a\", \"b\"] [\"a\", \"b\"]`", "`[\"b\", \"a\"] [\"b\", \"a\"]`"],
          correctIndex: 0,
          explanation:
            "`for...in` walks enumerable string keys along the whole prototype chain (own keys first), while `Object.keys` returns only own enumerable keys. That difference is why old code guarded `for...in` loops with `hasOwnProperty`.",
        },
        {
          id: "js-prototypes-q8",
          prompt: "Which practices are recommended? (Select all that apply.)",
          options: [
            "Set an object's prototype when you create it (`Object.create(proto)`) rather than calling `Object.setPrototypeOf` on it later",
            "When you create many instances, put methods on the prototype instead of creating a new closure per instance in the constructor",
            "Use `Object.create(null)` or a `Map` for dictionaries keyed by user input",
            "Add helper methods to `Array.prototype` in application code so every array gets them",
            "Swap an object's `__proto__` in hot paths to change its behaviour cheaply",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Changing a live object's prototype invalidates the engine's shape assumptions and can deoptimise code that touches it, and patching built-ins risks clashing with future standard methods (the reason `Array.prototype.flatten` had to be named `flat`). Shared prototype methods save memory; null-prototype objects and `Map`s avoid inherited and `__proto__` keys.",
        },
        {
          id: "js-prototypes-q9",
          prompt:
            "What does this log?\n\n```js\nfunction Animal(name) { this.name = name; }\nAnimal.prototype.hello = function () { return \"I am \" + this.name; };\n\nfunction Cat(name) { Animal.call(this, name); }\nCat.prototype = Object.create(Animal.prototype);\n\nconst c = new Cat(\"Tom\");\nconsole.log(c.hello(), c.constructor === Cat);\n```",
          options: ["`I am Tom false`", "`I am Tom true`", "`I am undefined false`", "It throws: `c.hello` is not a function"],
          correctIndex: 0,
          explanation:
            "Replacing `Cat.prototype` with `Object.create(Animal.prototype)` wires up the method lookup, but the new object has no own `constructor`, so `c.constructor` resolves to `Animal` further up the chain. Classic ES5 inheritance also sets `Cat.prototype.constructor = Cat`; `class ... extends` does all of this for you.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-prototypes-q10",
          prompt:
            "`const o = JSON.parse('{\"__proto__\": {\"admin\": true}}');` Which statements are true? (Select all that apply.)",
          options: [
            "`o.admin` is `undefined`, because `JSON.parse` creates an own property literally named `__proto__`",
            "`Object.assign({}, o).admin` is `true`, because assigning to `__proto__` invokes the prototype setter",
            "`({ ...o }).admin` is `true` as well",
            "`o.admin` is `true`, because `JSON.parse` sets the prototype",
            "Neither `Object.assign` nor spread can change the prototype of the object they produce",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`JSON.parse` and object spread define own data properties, so `__proto__` stays an ordinary key. `Object.assign` uses assignment, and assigning to `__proto__` on an ordinary object hits the inherited `Object.prototype.__proto__` setter, replacing the target's prototype: the core of prototype-pollution bugs in naive merge functions.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "js-this-call-apply-bind",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "this, call, apply & bind Deep Dive",
      summary:
        "`this` is not lexical scope: for ordinary functions it's decided at call time by how the function is called, which is why a method passed as a callback (`setTimeout(obj.method)`, `addEventListener(\"click\", this.handle)`) loses its object. The rules, from highest precedence: `new` binds a freshly created object; `bind` fixes `this` permanently (even `call` on a bound function can't override it); `call`/`apply` set it for one invocation; a method call `obj.fn()` sets it to `obj`; otherwise it's `undefined` in strict code (modules and class bodies are always strict) or `globalThis` in sloppy scripts. Arrow functions opt out: they have no own `this`, capture it from the enclosing scope, ignore `call`/`apply`/`bind`'s first argument and can't be used with `new`.\n\n`call(thisArg, ...args)` and `apply(thisArg, argsArray)` invoke immediately; `bind` returns a new function with `this` and leading arguments fixed, so it doubles as partial application. Since spread syntax arrived, `apply` is mostly legacy, though it's still handy for forwarding `arguments` wholesale.\n\nThe traps for experienced engineers: `el.addEventListener(\"click\", this.onClick.bind(this))` creates a new function each time, so a later `removeEventListener` with another `.bind` call can't find it; keep a reference to the bound function or use an arrow class field. A bound function called with `new` ignores its bound `this` but keeps the bound arguments, and it has no `prototype` of its own (instances link to the target's). And arrow class fields (`handle = () => {}`) fix `this` by creating one function per instance instead of one shared prototype method, which costs memory when you create thousands of objects.",
      level: "advanced",
      estMinutes: 95,
      webRefs: [
        { label: "MDN: this", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this", kind: "docs" },
        { label: "MDN: Function.prototype.bind()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind", kind: "docs" },
        { label: "You Don't Know JS (1st ed.): this All Makes Sense Now!", url: "https://github.com/getify/You-Dont-Know-JS/blob/1st-ed/this%20%26%20object%20prototypes/ch2.md", kind: "article" },
        { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
      ],
      video: {
        title: "this keyword in JavaScript  🔥 |  Ep.06 - Namaste JavaScript Season 2 🙏",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=9T4z98JcHR0",
        videoId: "9T4z98JcHR0",
        durationLabel: "53:29",
      },
      alternateVideos: [
        {
          title: "call, apply and bind method in JavaScript",
          channel: "Akshay Saini",
          url: "https://www.youtube.com/watch?v=75W8UPQ5l7k",
          videoId: "75W8UPQ5l7k",
          durationLabel: "10:50",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Write a polyfill for `Function.prototype.bind` as a plain function: `myBind(fn, thisArg, ...boundArgs)`. Don't use the built-in `bind` (the driver disables it while your code runs).\n\n- Return a new function that calls `fn` with `this` set to `thisArg` and with `boundArgs` followed by the call's own arguments, and returns `fn`'s result.\n- The bound `this` wins over every other way of calling it: as a method of another object, via `call`/`apply`, or by binding the bound function again.\n- When the bound function is called with `new`, ignore `thisArg` and construct `fn` instead (still with `boundArgs` first). The result must be an instance of `fn` that inherits from `fn.prototype`, and if `fn` returns its own object, that object is the result. `fn` may be a class.\n- Throw a `TypeError` if `fn` isn't callable.\n\nThe tests call `runBindScenario(name)`, which runs one named scenario against your `myBind` and returns plain data. Leave the driver as it is.",
        starterCode: `/**
 * @param {Function} fn
 * @param {any} thisArg
 * @param {...any} boundArgs
 * @returns {Function}
 */
function myBind(fn, thisArg, ...boundArgs) {
  // Your code here
}

// ---- Test driver (leave as is) ----
function runBindScenario(name) {
  const nativeBind = Function.prototype.bind;
  Function.prototype.bind = function () {
    throw new Error("Don't use the built-in bind inside myBind");
  };
  try {
    return scenario(name);
  } finally {
    Function.prototype.bind = nativeBind;
  }
}

function scenario(name) {
  const getName = function () {
    return this.name;
  };
  const Point = function (x, y) {
    this.x = x;
    this.y = y;
  };
  Point.prototype.sum = function () {
    return this.x + this.y;
  };
  if (name === "basic") {
    const greet = function (greeting, punct) {
      return greeting + ", " + this.name + punct;
    };
    return myBind(greet, { name: "Ada" }, "Hello")("!");
  }
  if (name === "partial") {
    const collect = function () {
      return [this.base].concat(Array.from(arguments));
    };
    return myBind(collect, { base: 10 }, 1, 2)(3, 4);
  }
  if (name === "explicit-beats-implicit") {
    const obj = { name: "B", bound: myBind(getName, { name: "A" }) };
    return obj.bound();
  }
  if (name === "rebind-ignored") {
    const first = myBind(getName, { name: "first" });
    const second = myBind(first, { name: "second" });
    return [second(), first.call({ name: "call" })];
  }
  if (name === "new-ignores-thisArg") {
    const ctx = { tag: "ctx" };
    const BoundPoint = myBind(Point, ctx, 1);
    const p = new BoundPoint(2);
    return { x: p.x, y: p.y, isPoint: p instanceof Point, ctxUntouched: !("x" in ctx) };
  }
  if (name === "new-inherits-prototype") {
    const BoundPoint = myBind(Point, null, 5);
    return new BoundPoint(1).sum();
  }
  if (name === "new-returns-object") {
    const Factory = function () {
      this.ignored = true;
      return { custom: true };
    };
    return new (myBind(Factory, {}))();
  }
  if (name === "new-class") {
    class Box {
      constructor(a, b) {
        this.value = a + b;
      }
    }
    const BoundBox = myBind(Box, { ignored: true }, 3);
    const box = new BoundBox(4);
    return { value: box.value, isBox: box instanceof Box };
  }
  if (name === "not-callable") {
    try {
      myBind({ not: "a function" }, {});
      return "no error";
    } catch (e) {
      return e instanceof TypeError ? "TypeError" : "other error";
    }
  }
  throw new Error("Unknown scenario: " + name);
}
`,
        functionName: "runBindScenario",
        testCases: [
          { description: "binds `this` and prepends bound arguments", args: ["basic"], expected: "Hello, Ada!" },
          { description: "bound and call-time arguments are combined in order", args: ["partial"], expected: [10, 1, 2, 3, 4] },
          { description: "calling it as a method of another object keeps the bound `this`", args: ["explicit-beats-implicit"], expected: "A" },
          {
            description: "rebinding or `call` can't change a bound `this`",
            args: ["rebind-ignored"],
            expected: ["first", "first"],
            isEdgeCase: true,
          },
          {
            description: "`new` ignores thisArg but keeps the bound arguments",
            args: ["new-ignores-thisArg"],
            expected: { x: 1, y: 2, isPoint: true, ctxUntouched: true },
            isEdgeCase: true,
          },
          { description: "instances created with `new` inherit from fn.prototype", args: ["new-inherits-prototype"], expected: 6 },
          {
            description: "`new` returns the object a constructor explicitly returns",
            args: ["new-returns-object"],
            expected: { custom: true },
            isEdgeCase: true,
          },
          { description: "a bound class can be constructed", args: ["new-class"], expected: { value: 7, isBox: true }, isEdgeCase: true },
          { description: "binding a non-function throws a TypeError", args: ["not-callable"], expected: "TypeError", isEdgeCase: true },
        ],
      },
    },
    {
      id: "js-classes-oop",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "ES6 Classes & OOP Patterns in JS",
      summary:
        "ES2015 classes are mostly syntax over constructor functions and prototypes (methods land on `Class.prototype`, `static` members on the constructor, and `extends` links both chains), but not entirely. Class bodies are always strict, class declarations sit in a temporal dead zone like `let`, calling a class without `new` throws, methods are non-enumerable, and a derived constructor must call `super()` before touching `this`, because in a derived class the base constructor allocates the object. That last rule is what makes subclassing built-ins such as `Array`, `Error` and `Map` work properly, which ES5 constructor functions couldn't do.\n\nES2022 filled the gaps: public fields (`count = 0`), true private members (`#secret`, `#helper()`), `static` blocks, and brand checks (`#secret in obj`). Private names are enforced by the engine, not by convention: they're invisible to `Object.keys`, `JSON.stringify` and subclasses, and reading one on an object that lacks it throws a `TypeError`, including on a `Proxy` wrapped around a real instance. Fields are created per instance, and a subclass's fields are only initialised after `super()` returns, so a base constructor that calls an overridden method sees the subclass's fields as `undefined`, or has its writes overwritten by the field initialisers.\n\nThe OOP design advice still applies: prefer composition to deep hierarchies, and remember that detaching a method (`const f = obj.method`) loses `this`, which in strict class code means `undefined` rather than the global object. Arrow-function fields fix that at the cost of one function per instance. Getters and setters keep a public API stable while the internal representation changes, but they run on every access, so don't hide expensive work behind them.",
      level: "advanced",
      estMinutes: 70,
      webRefs: [
        { label: "MDN: Classes", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes", kind: "docs" },
        { label: "MDN: Private elements", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements", kind: "docs" },
        { label: "javascript.info: Class inheritance", url: "https://javascript.info/class-inheritance", kind: "article" },
        { label: "sudheerj: JavaScript Interview Questions", url: "https://github.com/sudheerj/javascript-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "JavaScript OOP Crash Course (ES5 & ES6)",
        channel: "Traversy Media",
        url: "https://www.youtube.com/watch?v=vDJpGenyHaA",
        videoId: "vDJpGenyHaA",
        durationLabel: "40:21",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-classes-oop-q1",
          prompt:
            "What happens?\n\n```js\nclass Base {\n  constructor() { this.init(); }\n  init() {}\n}\nclass Child extends Base {\n  items = [];\n  init() { this.items.push(\"x\"); }\n}\nnew Child();\n```",
          options: [
            "It throws a `TypeError`: `items` is still `undefined` when `init` runs",
            "It creates a `Child` whose `items` is `[\"x\"]`",
            "It creates a `Child` whose `items` is `[]` (the push is lost)",
            "It throws a `ReferenceError` because `this` is used before `super()`",
          ],
          correctIndex: 0,
          explanation:
            "`Child`'s field initialisers run only after `super()` returns, but `Base`'s constructor already dispatches to the overridden `init`, which reads `this.items` while it's still `undefined`. Calling overridable methods from a base constructor is a known hazard in most OOP languages.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-classes-oop-q2",
          prompt:
            "What does this log?\n\n```js\nclass Base {\n  constructor() { this.setup(); }\n  setup() {}\n}\nclass Child extends Base {\n  mode = \"default\";\n  setup() { this.mode = \"custom\"; }\n}\nconsole.log(new Child().mode);\n```",
          options: ["`\"default\"`", "`\"custom\"`", "`undefined`", "It throws a `TypeError`"],
          correctIndex: 0,
          explanation:
            "`setup` does set `mode` to `\"custom\"` during `super()`, but the field initialiser runs afterwards and redefines `mode` as `\"default\"`. Initialise such state in the base class or pass it through the constructor instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-classes-oop-q3",
          prompt:
            "What happens?\n\n```js\nclass Counter {\n  count = 0;\n  inc() { this.count++; }\n}\nconst c = new Counter();\nconst inc = c.inc;\ninc();\n```",
          options: [
            "It throws a `TypeError`: `this` is `undefined` in strict class code",
            "`c.count` becomes `1`, because `inc` remembers its object",
            "It creates a global `count` set to `NaN` on `globalThis`",
            "Nothing happens: detached methods are ignored silently",
          ],
          correctIndex: 0,
          explanation:
            "A plain call sets `this` to `undefined` in strict code, and class bodies are always strict, so `this.count` throws. In a sloppy-mode constructor function the same code would quietly modify the global object instead.",
        },
        {
          id: "js-classes-oop-q4",
          prompt:
            "Which statements are true? (Select all that apply.)\n\n```js\nclass Account {\n  #balance = 0;\n  static isAccount(obj) { return #balance in obj; }\n  deposit(n) { this.#balance += n; return this.#balance; }\n}\nconst a = new Account();\n```",
          options: [
            "`Object.keys(a)` is `[]`",
            "`JSON.stringify(a)` is `\"{}\"`",
            "`Account.isAccount({})` returns `false`",
            "`a[\"#balance\"]` returns `0`",
            "`Account.prototype.deposit.call({}, 5)` returns `5`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Private fields aren't properties, so reflection and serialisation can't see them and a string key `\"#balance\"` is just an unrelated missing property. `#balance in obj` is the safe brand check; reading `this.#balance` on an object without the field throws a `TypeError`.",
        },
        {
          id: "js-classes-oop-q5",
          prompt: "What happens?\n\n```js\nconst p = new Point();\nclass Point {}\n```",
          options: [
            "A `ReferenceError`: the class is in its temporal dead zone",
            "It works: class declarations are hoisted like function declarations",
            "A `TypeError`: `Point` is `undefined` at that point",
            "A `SyntaxError` at parse time",
          ],
          correctIndex: 0,
          explanation:
            "Class declarations are hoisted, but like `let` and `const` they stay uninitialised until the declaration runs, so any earlier access throws. Function declarations are the only ones initialised during hoisting.",
        },
        {
          id: "js-classes-oop-q6",
          prompt:
            "What does this log?\n\n```js\nclass A {\n  static create() { return new this(); }\n}\nclass B extends A {}\nconsole.log(B.create() instanceof B, Object.getPrototypeOf(B) === A);\n```",
          options: ["`true true`", "`false true`", "`true false`", "`false false`"],
          correctIndex: 0,
          explanation:
            "`extends` links the constructors themselves (`B`'s prototype is `A`), so static methods are inherited, and inside a static method `this` is the constructor it was called on, here `B`. That's how static factory methods stay subclass-friendly.",
        },
        {
          id: "js-classes-oop-q7",
          prompt:
            "What does this log?\n\n```js\nclass A {\n  greet() { return \"A\"; }\n}\nclass B extends A {\n  greet = () => \"B-field\";\n  greet2() { return super.greet(); }\n}\nconst b = new B();\nconsole.log(b.greet(), b.greet2(), B.prototype.greet === A.prototype.greet);\n```",
          options: ["`B-field A true`", "`A A true`", "`B-field B-field false`", "`B-field A false`"],
          correctIndex: 0,
          explanation:
            "The arrow field is an own property of each instance, so it shadows the prototype method on lookup. `super.greet()` looks up `A.prototype.greet` directly, and `B.prototype` has no `greet` of its own, so it inherits `A`'s.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-classes-oop-q8",
          prompt: "Which are real differences between `class Foo { m() {} }` and `function Foo() {}` with `Foo.prototype.m = function () {}`? (Select all that apply.)",
          options: [
            "Calling `Foo()` without `new` throws for the class",
            "The class's `m` is non-enumerable, while the assigned `Foo.prototype.m` is enumerable",
            "The class body always runs in strict mode",
            "Class instances don't have a prototype chain",
            "Only the function version works with `instanceof`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Classes add guard rails (no call without `new`, strict mode, non-enumerable methods) on top of the same prototype mechanics, so instances have ordinary prototype chains and `instanceof` works for both.",
        },
        {
          id: "js-classes-oop-q9",
          prompt:
            "A `Bird` base class has `fly()`, and you now need `Penguin` and `Duck` (which also swims). Which design best follows \"composition over inheritance\"?",
          options: [
            "Model capabilities as small behaviours (`canFly`, `canSwim`) and compose the ones each class needs",
            "Have `Penguin extends Bird` and override `fly()` to throw an error",
            "Add `if (this instanceof Penguin)` checks inside `Bird.prototype.fly`",
            "Create a subclass for every combination, such as `FlyingSwimmingBird extends FlyingBird`",
          ],
          correctIndex: 0,
          explanation:
            "Composing capabilities avoids the combinatorial explosion of subclasses and never gives an object a method it can't honour. Overriding `fly` to throw breaks substitutability: code written for `Bird` now fails on a `Penguin`.",
        },
        {
          id: "js-classes-oop-q10",
          prompt: "A derived class's constructor starts with `this.ready = false;` before calling `super()`. What happens when you instantiate it?",
          options: [
            "A `ReferenceError`: there's no `this` until `super()` returns",
            "It works: the property is copied onto the object `super()` creates",
            "`this.ready` is set on the prototype instead of the instance",
            "It's allowed only if the base class has no constructor",
          ],
          correctIndex: 0,
          explanation:
            "In a derived class the object is created by the base constructor, so there's no `this` until `super()` returns. Engines report it as a `ReferenceError` (\"Must call super constructor… before accessing 'this'\").",
        },
      ],
    },
    {
      id: "js-modules-cjs-esm",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "Modules: CommonJS vs ESM",
      summary:
        "CommonJS and ES modules differ in when and how bindings are resolved, and that difference explains every interop headache. `require()` is a synchronous function call that runs the module and returns whatever `module.exports` is at that moment: a value snapshot resolved at runtime, so you can require conditionally or compute the path. ESM `import` declarations are static: the whole graph is parsed and linked before any code runs, imports are live read-only bindings to the exporter's variables, and loading may be asynchronous (top-level `await`). Static structure is what enables tree-shaking, early errors for missing named exports and parallel fetching in browsers.\n\nLive bindings and hoisting produce the classic surprises. If a module does `export let count = 0` and later increments it, every importer sees the new value, while a CommonJS consumer that destructured `const { count } = require(...)` keeps the old number. Imports are hoisted, so imported modules evaluate before the importing module's body. In a circular import, the module that the cycle reaches second runs first and sees the other module's `let`/`const`/class exports in their temporal dead zone (a `ReferenceError`), though hoisted function declarations already work; in CommonJS the same cycle hands you a partially filled `module.exports`.\n\nIn Node, the module type comes from the extension (`.mjs`/`.cjs`) or the nearest `package.json` `\"type\"` field. ESM can import CommonJS: the default export is `module.exports`, plus named exports Node detects by static analysis. Since Node 22.12 and 20.19, `require()` can load ES modules without a flag, as long as their graph has no top-level `await` (otherwise it throws `ERR_REQUIRE_ASYNC_MODULE`). Packages that ship both formats risk the dual package hazard: two copies of one module, each with its own state.",
      level: "expert",
      estMinutes: 45,
      webRefs: [
        { label: "Node.js docs: Modules: ECMAScript modules", url: "https://nodejs.org/api/esm.html", kind: "docs" },
        { label: "Node.js docs: Loading ECMAScript modules using require()", url: "https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require", kind: "docs" },
        { label: "MDN: JavaScript modules", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules", kind: "docs" },
        { label: "Mozilla Hacks: ES modules: A cartoon deep-dive", url: "https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/", kind: "article" },
      ],
      video: {
        title: "Import vs Require: The Biggest JavaScript Divide",
        channel: "Matt Pocock",
        url: "https://www.youtube.com/watch?v=6_JNPmjSevo",
        videoId: "6_JNPmjSevo",
        durationLabel: "4:02",
      },
      alternateVideos: [
        {
          title: "JavaScript ES6 Modules",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=cRHQNNcYf6s",
          videoId: "cRHQNNcYf6s",
          durationLabel: "7:38",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "js-modules-cjs-esm-q1",
          prompt:
            "What do the two programs log?\n\n```js\n// counter.mjs\nexport let count = 0;\nexport function inc() { count++; }\n\n// main.mjs\nimport { count, inc } from \"./counter.mjs\";\ninc();\nconsole.log(count);\n```\n\n```js\n// counter.cjs\nlet count = 0;\nmodule.exports = { count, inc() { count++; } };\n\n// main.cjs\nconst { count, inc } = require(\"./counter.cjs\");\ninc();\nconsole.log(count);\n```",
          options: ["ESM logs `1`, CommonJS logs `0`", "Both log `1`", "Both log `0`", "ESM logs `0`, CommonJS logs `1`"],
          correctIndex: 0,
          explanation:
            "An ES import is a live binding to the exporter's `count` variable, so it reflects the increment. `module.exports.count` was a copy of the number taken when the object was built, and destructuring copies it again; `inc` changes only the closed-over local variable.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-modules-cjs-esm-q2",
          prompt: "In `main.mjs` above, you add `count = 5;` after the import. What happens?",
          options: [
            "It throws a `TypeError` at runtime: imported bindings are read-only",
            "It updates `count` inside `counter.mjs` for every importer",
            "It creates a local copy of `count` in `main.mjs`",
            "Nothing: the assignment is silently ignored",
          ],
          correctIndex: 0,
          explanation:
            "Imports behave like `const` bindings you can read but not assign (V8 reports \"Assignment to constant variable\"). Only the exporting module can change the value, for example through an exported function like `inc`.",
        },
        {
          id: "js-modules-cjs-esm-q3",
          prompt:
            "Running `node a.mjs` logs what?\n\n```js\n// a.mjs\nconsole.log(\"a body\");\nimport \"./b.mjs\";\n\n// b.mjs\nconsole.log(\"b body\");\n```",
          options: ["`b body`, then `a body`", "`a body`, then `b body`", "Only `a body`", "A `SyntaxError`: imports must come first"],
          correctIndex: 0,
          explanation:
            "Import declarations are hoisted: the graph is linked and dependencies are evaluated before the importing module's body runs, wherever the `import` appears in the file. A `require()` in the same position would run in source order.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-modules-cjs-esm-q4",
          prompt:
            "What happens when you run `node a.mjs`?\n\n```js\n// a.mjs\nimport { b } from \"./b.mjs\";\nexport const a = \"A\";\nconsole.log(\"a sees\", b);\n\n// b.mjs\nimport { a } from \"./a.mjs\";\nexport const b = \"B\";\nconsole.log(\"b sees\", a);\n```",
          options: [
            "`b.mjs` runs first and throws a `ReferenceError` when it reads `a`",
            "`b sees undefined`, then `a sees B`",
            "`a sees B`, then `b sees A`",
            "Node refuses to load modules that import each other",
          ],
          correctIndex: 0,
          explanation:
            "Cycles are allowed. `a.mjs` imports `b.mjs`, so `b.mjs` evaluates first, while `a`'s `const` is still in its temporal dead zone. Had `a.mjs` exported a function declaration, `b.mjs` could already call it, because function declarations are initialised when the module is linked.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-modules-cjs-esm-q5",
          prompt:
            "What does `node a.cjs` log?\n\n```js\n// a.cjs\nexports.loaded = false;\nconst b = require(\"./b.cjs\");\nconsole.log(\"in a, b.loaded =\", b.loaded);\nexports.loaded = true;\n\n// b.cjs\nconst a = require(\"./a.cjs\");\nconsole.log(\"in b, a.loaded =\", a.loaded);\nexports.loaded = true;\n```",
          options: [
            "`in b, a.loaded = false`, then `in a, b.loaded = true`",
            "`in b, a.loaded = true`, then `in a, b.loaded = true`",
            "An infinite loop of `require` calls",
            "`in a, b.loaded = false`, then `in b, a.loaded = false`",
          ],
          correctIndex: 0,
          explanation:
            "When `b.cjs` requires `a.cjs` mid-cycle, Node returns `a`'s unfinished `exports` object from the cache instead of running it again, so `b` sees the partial state. That's why replacing `module.exports` late in a module breaks cyclic consumers.",
        },
        {
          id: "js-modules-cjs-esm-q6",
          prompt: "Which statements about Node.js 24 are true? (Select all that apply.)",
          options: [
            "`require()` can load an ES module whose module graph has no top-level `await`",
            "`import pkg from \"./lib.cjs\"` gives you `module.exports` as the default export",
            "A `.js` file is treated as ESM when the nearest `package.json` has `\"type\": \"module\"`",
            "`__dirname` is available inside ES modules",
            "`require()` of an ES module that uses top-level `await` returns a promise",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`require(esm)` has been unflagged since Node 22.12, but it's synchronous, so a graph with top-level `await` throws `ERR_REQUIRE_ASYNC_MODULE` (use `import()` instead). ES modules don't get the CommonJS wrapper variables; use `import.meta.dirname` or `import.meta.url`.",
        },
        {
          id: "js-modules-cjs-esm-q7",
          prompt: "Why can a bundler drop unused functions from `import { debounce } from \"lodash-es\"` but not reliably from `const { debounce } = require(\"lodash\")`?",
          options: [
            "ESM imports and exports are static, so unused exports can be proven dead",
            "CommonJS files can't be minified or concatenated by bundlers",
            "The ES module build of a library is always the smaller file",
            "`require` runs asynchronously, so the bundler can't follow it",
          ],
          correctIndex: 0,
          explanation:
            "`module.exports` is an ordinary object that can be built, mutated or read dynamically at runtime, so a bundler can't safely prove which properties are unused. ESM's syntax fixes the export names at parse time.",
        },
        {
          id: "js-modules-cjs-esm-q8",
          prompt:
            "What happens to `app.mjs`?\n\n```js\n// config.mjs\nexport const config = await fetch(\"/config.json\").then((r) => r.json());\n\n// app.mjs\nimport { config } from \"./config.mjs\";\nconsole.log(\"app starts\", config);\n```",
          options: [
            "Its body waits until `config.mjs` finishes evaluating, including the awaited fetch",
            "It runs immediately and `config` is `undefined` until the fetch completes",
            "`config` is a promise that `app.mjs` has to await itself",
            "It's a `SyntaxError`: `await` is only valid inside async functions",
          ],
          correctIndex: 0,
          explanation:
            "Top-level `await` makes `config.mjs` an async module, and every module that depends on it waits for it before evaluating. That's convenient, but a slow top-level fetch delays everything downstream, which is why it's best kept out of widely imported modules.",
        },
        {
          id: "js-modules-cjs-esm-q9",
          prompt: "What is `this` at the top level of an ES module, and at the top level of a CommonJS module in Node?",
          options: [
            "`undefined` in the ES module; `module.exports` in the CommonJS one",
            "`globalThis` in the ES module; `undefined` in the CommonJS module",
            "`undefined` in both, since both kinds of module are strict",
            "`module.exports` in both, via Node's module wrapper",
          ],
          correctIndex: 0,
          explanation:
            "ES modules are strict and have no receiver at the top level. CommonJS code runs inside a wrapper function that Node calls with `this` set to `module.exports`.",
        },
        {
          id: "js-modules-cjs-esm-q10",
          prompt: "Which statements about dynamic `import()` are true? (Select all that apply.)",
          options: [
            "It returns a promise for the module namespace object",
            "It can be used inside CommonJS modules to load ES modules",
            "Its specifier can be computed at runtime",
            "It's hoisted and evaluated before the module body, like a static `import`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`import()` is an expression evaluated when the code reaches it, which makes it the tool for code splitting, conditional loading and loading ESM from CommonJS. Only static `import` declarations are hoisted.",
        },
        {
          id: "js-modules-cjs-esm-q11",
          prompt:
            "A library publishes both a CommonJS and an ESM build. Your app `import`s it while one of your dependencies `require`s it. What's the risk?",
          options: [
            "Two separate instances load, duplicating module state such as singletons and caches",
            "Node picks one of the two formats at random on each start",
            "The two builds share state, so the CommonJS build overwrites the ESM exports",
            "Nothing: Node deduplicates both builds into one module instance",
          ],
          correctIndex: 0,
          explanation:
            "This is the dual package hazard: `import` and `require` resolve to different files, and each file is its own module instance. Libraries mitigate it by keeping state in one format and wrapping it from the other.",
        },
      ],
    },
    {
      id: "js-fetch-ajax",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "Fetch API & AJAX Patterns",
      summary:
        "`fetch` replaced `XMLHttpRequest` with a promise-based API built on `Request`, `Response`, `Headers` and streams, and its semantics trip up people who learned axios first. The promise rejects only for network-level failures (DNS, offline, a CORS block, an abort); HTTP 404 and 500 responses fulfil normally, so every call site needs an `if (!res.ok)` check. Reading the body is a second async step (`res.json()`, `text()`, `blob()`), and a body can be consumed only once, so logging `await res.text()` and then calling `res.json()` fails; use `res.clone()` if you need both.\n\nCancellation and timeouts go through `AbortSignal`: pass `signal` to `fetch` and call `controller.abort()` (the promise rejects with an `AbortError`), use `AbortSignal.timeout(ms)` (a `TimeoutError`), and `AbortSignal.any([...])` to combine a user cancel with a deadline. This is about correctness, not tidiness: in a search box, the response for an earlier keystroke can arrive after a later one, so abort stale requests or ignore responses older than the latest request id, otherwise you render results for the wrong query.\n\nDefaults matter too. `credentials` defaults to `\"same-origin\"`, so cross-origin cookies need `credentials: \"include\"` plus matching CORS headers from the server. A `Content-Type: application/json` or any custom header makes a cross-origin request non-simple and triggers a preflight `OPTIONS` round trip. A plain object passed as `body` is sent as the string `[object Object]`; you must `JSON.stringify` it. Retry automatically only idempotent requests (or ones carrying an idempotency key), with exponential backoff and jitter, and use `keepalive: true` so small analytics requests survive page unload.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "MDN: Using the Fetch API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch", kind: "docs" },
        { label: "MDN: AbortSignal.timeout()", url: "https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static", kind: "docs" },
        { label: "javascript.info: Fetch", url: "https://javascript.info/fetch", kind: "article" },
        { label: "javascript.info: Fetch: Abort", url: "https://javascript.info/fetch-abort", kind: "article" },
      ],
      video: {
        title: "Learn Fetch API In 6 Minutes",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=cuEtnrL9-H0",
        videoId: "cuEtnrL9-H0",
        durationLabel: "6:35",
      },
      alternateVideos: [
        {
          title: "I Cannot Believe Abort Controller Can Do This",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=BeZfiCPhZbI",
          videoId: "BeZfiCPhZbI",
          durationLabel: "14:24",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "js-fetch-ajax-q1",
          prompt:
            "The server answers `404 Not Found`. What does this log?\n\n```js\ntry {\n  const res = await fetch(\"/api/missing\");\n  console.log(\"ok?\", res.ok, res.status);\n} catch (e) {\n  console.log(\"caught\", e.name);\n}\n```",
          options: ["`ok? false 404`", "`caught TypeError`", "`caught HTTPError`", "`ok? true 404`"],
          correctIndex: 0,
          explanation:
            "An HTTP error status is still a successful fetch: the request completed and a response arrived. The promise fulfils and `res.ok` (true only for 200–299) is how you detect the error; axios-style rejection on 4xx/5xx has to be added yourself.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-fetch-ajax-q2",
          prompt: "Which of these make the promise returned by `fetch` reject? (Select all that apply.)",
          options: [
            "The DNS lookup fails or the device is offline",
            "The server doesn't send the CORS headers the browser needs for this cross-origin request",
            "`controller.abort()` is called before the response arrives",
            "The server responds with `500 Internal Server Error`",
            "The server responds `401` with a JSON error body",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Network failures, CORS failures and aborts reject (the first two as a `TypeError`, an abort as an `AbortError`). Any HTTP response, whatever its status, fulfils the promise.",
        },
        {
          id: "js-fetch-ajax-q3",
          prompt: "What happens?\n\n```js\nconst res = await fetch(\"/api/user\");\nconsole.log(await res.text());\nconst data = await res.json();\n```",
          options: [
            "`res.json()` rejects with a `TypeError`: the body was already read",
            "`data` is the parsed user object, read from a cached body",
            "`data` is `undefined` because the stream is now empty",
            "`res.json()` quietly downloads the body a second time",
          ],
          correctIndex: 0,
          explanation:
            "A response body is a stream that can be consumed once (`res.bodyUsed` becomes `true`). Read it once and reuse the result, or call `res.clone()` before the first read if two consumers need it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-fetch-ajax-q4",
          prompt: "What does the server receive?\n\n```js\nawait fetch(\"/api/items\", { method: \"POST\", body: { name: \"pen\" } });\n```",
          options: [
            "The text `[object Object]` with `Content-Type: text/plain;charset=UTF-8`",
            "The JSON `{\"name\":\"pen\"}` with `Content-Type: application/json`",
            "The form-encoded body `name=pen`",
            "Nothing: `fetch` throws a `TypeError` before sending",
          ],
          correctIndex: 0,
          explanation:
            "`fetch` doesn't serialise objects: anything that isn't a string, `Blob`, `FormData`, `URLSearchParams`, buffer or stream is converted with `String()`. Send `JSON.stringify(data)` and set the `Content-Type` header yourself.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-fetch-ajax-q5",
          prompt:
            "The user types `re` then `rea` quickly into this search box. Which problems can occur? (Select all that apply.)\n\n```js\ninput.addEventListener(\"input\", async () => {\n  const res = await fetch(\"/search?q=\" + encodeURIComponent(input.value));\n  render(await res.json());\n});\n```",
          options: [
            "Results for `re` can arrive last and overwrite the results for `rea`",
            "Every keystroke sends a request, wasting bandwidth and server capacity",
            "`fetch` automatically cancels the earlier request when a new one starts",
            "Browsers guarantee responses arrive in request order for the same origin",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Responses complete in whatever order the network and server produce them, and nothing cancels the older request. Debounce the input and abort the previous request with an `AbortController` (or ignore responses whose request id isn't the latest).",
        },
        {
          id: "js-fetch-ajax-q6",
          prompt: "What is the idiomatic way to give a request a 5-second timeout that also stops the underlying request?",
          options: [
            "`fetch(url, { signal: AbortSignal.timeout(5000) })`",
            "`Promise.race([fetch(url), new Promise((_, reject) => setTimeout(reject, 5000))])`",
            "`fetch(url, { timeout: 5000 })`",
            "`setTimeout(() => fetch(url), 5000)`",
          ],
          correctIndex: 0,
          explanation:
            "`AbortSignal.timeout` aborts the request itself, freeing the connection. Racing against a timer only stops you waiting: the request keeps running and the timer is never cleared. `fetch` has no `timeout` option.",
        },
        {
          id: "js-fetch-ajax-q7",
          prompt: "How can error handling tell a timeout from a manual cancel?",
          options: [
            "By `err.name`: `TimeoutError` for the timeout, `AbortError` for a manual abort",
            "By `err.message`: both are `TypeError`s whose text names the cause",
            "A timeout fulfils with a `Response` whose status code is `408`",
            "They can't be told apart: both reject with an `AbortError`",
          ],
          correctIndex: 0,
          explanation:
            "Checking `err.name` lets you show \"request timed out\" for `TimeoutError` while silently ignoring `AbortError`, which usually means your own code cancelled a stale request on purpose.",
        },
        {
          id: "js-fetch-ajax-q8",
          prompt:
            "An SPA on `https://app.example.com` calls `https://api.example.com` with `fetch`, and the API authenticates with a session cookie. What's required for the cookie to be sent and the response to be readable? (Select all that apply.)",
          options: [
            "`credentials: \"include\"` on the request",
            "The API responds with `Access-Control-Allow-Credentials: true`",
            "The API's `Access-Control-Allow-Origin` names `https://app.example.com` exactly rather than `*`",
            "Nothing: `fetch` sends cookies to every origin by default",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The default `credentials: \"same-origin\"` doesn't send cookies to another origin, and even a subdomain is another origin. Credentialed CORS requests also require the server to opt in explicitly, and a wildcard `Allow-Origin` is rejected for them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-fetch-ajax-q9",
          prompt: "Which cross-origin request triggers a CORS preflight (`OPTIONS`) before the real request?",
          options: [
            "`fetch(url, { method: \"POST\", headers: { \"Content-Type\": \"application/json\" }, body })`",
            "`fetch(url)` with no options",
            "`fetch(url, { method: \"POST\", body: new URLSearchParams({ a: \"1\" }) })`",
            "`fetch(url, { method: \"POST\", body: \"plain text\" })`",
          ],
          correctIndex: 0,
          explanation:
            "Only `application/x-www-form-urlencoded`, `multipart/form-data` and `text/plain` bodies (with GET, HEAD or POST and no custom headers) are \"simple\". A JSON content type makes the request non-simple, adding a round trip unless the server caches the preflight with `Access-Control-Max-Age`.",
        },
        {
          id: "js-fetch-ajax-q10",
          prompt: "Which requests are safe to retry automatically after a network timeout? (Select all that apply.)",
          options: [
            "`GET /products`",
            "`PUT /users/42` with the full new representation",
            "`DELETE /sessions/abc`",
            "`POST /payments` without an idempotency key",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "GET, PUT and DELETE are idempotent by HTTP semantics: repeating them leaves the server in the same state. A timed-out POST may already have succeeded, so retrying could charge the customer twice unless the server de-duplicates by an idempotency key.",
        },
        {
          id: "js-fetch-ajax-q11",
          prompt: "Which capability does `XMLHttpRequest` offer that `fetch` has no built-in event for?",
          options: [
            "Upload progress events (`xhr.upload.onprogress`)",
            "Sending cookies along with cross-origin requests",
            "Reading the response headers before the body",
            "Cancelling a request that's already in flight",
          ],
          correctIndex: 0,
          explanation:
            "`fetch` can report download progress by reading `res.body` as a stream, and it supports cookies, headers and cancellation (via `AbortSignal`), but it has no upload progress event, which is why file uploaders still reach for `XMLHttpRequest`.",
        },
      ],
    },
    {
      id: "js-json",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "JSON Deep Dive",
      summary:
        "JSON is a data interchange format, not a JavaScript serialiser, and `JSON.stringify` quietly drops anything that doesn't fit. Inside objects, properties whose values are `undefined`, functions or symbols are omitted; inside arrays the same values become `null` so indices don't shift. `NaN` and `Infinity` become `null`, `-0` becomes `0`, symbol-keyed and non-enumerable properties are ignored, `Map` and `Set` become `{}`, and a `BigInt` throws a `TypeError`. Dates survive only as ISO strings because `Date.prototype.toJSON` runs first, and `JSON.parse` won't turn them back into dates unless you pass a reviver.\n\nThe hooks run in a defined order: `toJSON()` first, then the `replacer` (as a function it receives `key` and `value` with `this` set to the containing object; as an array it's an allow-list of keys), then serialisation. A cyclic structure makes `stringify` throw `TypeError: Converting circular structure to JSON`. The popular fix, a `WeakSet` of already-seen objects, is subtly wrong: it also replaces legitimately shared references (the same object reachable by two sibling paths), so a correct cycle detector tracks the current ancestor path, not everything ever visited.\n\nFor deep copies, `JSON.parse(JSON.stringify(x))` is lossy; `structuredClone` handles cycles, `Map`, `Set`, `Date` and `BigInt`, but throws on functions and DOM nodes and drops class prototypes. For big static data, `JSON.parse` of a string can load faster than an equivalent object literal because JSON is simpler to parse. And although parsing untrusted JSON can't execute code, the own `__proto__` keys it can produce become dangerous once the result goes through `Object.assign` or a naive deep merge.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "MDN: JSON.stringify()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify", kind: "docs" },
        { label: "MDN: structuredClone()", url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone", kind: "docs" },
        { label: "javascript.info: JSON methods, toJSON", url: "https://javascript.info/json", kind: "article" },
        { label: "web.dev: Deep-copying in JavaScript using structuredClone", url: "https://web.dev/articles/structured-clone", kind: "article" },
      ],
      video: {
        title: "Learn JSON in 10 Minutes",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=iiADhChRriM",
        videoId: "iiADhChRriM",
        durationLabel: "12:00",
      },
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `safeStringify(value)`. It behaves exactly like `JSON.stringify(value)` for anything that can be serialised, except that a reference which would create a cycle is written as the string `\"[Circular]\"` instead of throwing.\n\n- A value is circular when it's an object or array that is already one of its own ancestors on the current path from the root.\n- A shared reference that isn't a cycle (the same object reachable through two different paths, such as two siblings) must be serialised in full every time.\n- Keep `JSON.stringify` semantics: `undefined`, functions and symbols are dropped from objects and become `null` in arrays, `NaN` becomes `null`, and `toJSON` (as on `Date`) is honoured.\n- Return the JSON string with no indentation.\n\nTip: a replacer function is called with `this` set to the object that holds the current key, which is enough to maintain the ancestor path. A hand-written recursive serialiser is fine too.\n\nThe tests call `runSafeStringify(data, links)`. Test data has to be plain JSON, so the driver adds cycles and special values first: each link `[fromPath, key, target]` sets `resolve(fromPath)[key]` to the object at path `target` (dot-separated, `\"\"` is the root) or to a special value (`\"@fn\"`, `\"@symbol\"`, `\"@nan\"`, `\"@date:<ISO string>\"`). Leave the driver as it is.",
        starterCode: `/**
 * Like JSON.stringify(value), but writes "[Circular]" instead of throwing on cycles.
 * @param {any} value
 * @returns {string}
 */
function safeStringify(value) {
  // Your code here
}

// ---- Test driver (leave as is) ----
function runSafeStringify(data, links) {
  const resolve = (path) => (path === "" ? data : path.split(".").reduce((obj, key) => obj[key], data));
  const special = (target) => {
    if (target === "@fn") return function () {};
    if (target === "@symbol") return Symbol("s");
    if (target === "@nan") return NaN;
    if (target.startsWith("@date:")) return new Date(target.slice(6));
    return resolve(target);
  };
  for (const [from, key, target] of links) resolve(from)[key] = special(target);
  return safeStringify(data);
}
`,
        functionName: "runSafeStringify",
        testCases: [
          {
            description: "acyclic data is serialised exactly like JSON.stringify",
            args: [{ a: 1, b: [1, 2, { c: "x" }] }, []],
            expected: "{\"a\":1,\"b\":[1,2,{\"c\":\"x\"}]}",
          },
          {
            description: "an object that references itself",
            args: [{ name: "root" }, [["", "self", ""]]],
            expected: "{\"name\":\"root\",\"self\":\"[Circular]\"}",
          },
          {
            description: "a cycle back to the root from deep inside",
            args: [{ a: { b: {} } }, [["a.b", "back", ""]]],
            expected: "{\"a\":{\"b\":{\"back\":\"[Circular]\"}}}",
          },
          {
            description: "a cycle through an array",
            args: [{ list: [1, {}] }, [["list.1", "parent", "list"]]],
            expected: "{\"list\":[1,{\"parent\":\"[Circular]\"}]}",
          },
          {
            description: "the same object under two siblings is not circular",
            args: [{ shared: { v: 1 }, left: {}, right: {} }, [["left", "x", "shared"], ["right", "x", "shared"]]],
            expected: "{\"shared\":{\"v\":1},\"left\":{\"x\":{\"v\":1}},\"right\":{\"x\":{\"v\":1}}}",
            isEdgeCase: true,
          },
          {
            description: "the same object twice in one array is not circular",
            args: [{ item: { id: 1 }, list: [] }, [["list", "0", "item"], ["list", "1", "item"]]],
            expected: "{\"item\":{\"id\":1},\"list\":[{\"id\":1},{\"id\":1}]}",
            isEdgeCase: true,
          },
          {
            description: "two objects pointing at each other",
            args: [{ a: {}, b: {} }, [["a", "b", "b"], ["b", "a", "a"]]],
            expected: "{\"a\":{\"b\":{\"a\":\"[Circular]\"}},\"b\":{\"a\":{\"b\":\"[Circular]\"}}}",
            isEdgeCase: true,
          },
          {
            description: "JSON.stringify semantics are kept: dropped values, null in arrays, NaN, toJSON",
            args: [
              { keep: 1, u: undefined, arr: [1] },
              [["", "fn", "@fn"], ["", "sym", "@symbol"], ["", "when", "@date:2020-01-02T03:04:05.000Z"], ["", "nan", "@nan"], ["arr", "1", "@fn"]],
            ],
            expected: "{\"keep\":1,\"arr\":[1,null],\"when\":\"2020-01-02T03:04:05.000Z\",\"nan\":null}",
            isEdgeCase: true,
          },
          {
            description: "an array that contains itself",
            args: [[1], [["", "1", ""]]],
            expected: "[1,\"[Circular]\"]",
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "js-event-delegation",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "Event Bubbling, Capturing & Delegation",
      summary:
        "Every DOM event travels a path: a capture phase from `window` down to the target, then a bubble phase back up. Listeners registered with `{ capture: true }` fire on the way down, ordinary ones on the way up, and at the target itself capture listeners run first. Delegation exploits bubbling: instead of attaching a listener to each of 1,000 rows, attach one to the container and use `event.target.closest(selector)` to work out which row was hit. That costs one listener instead of thousands, works automatically for rows added later, and survives re-rendering the list's contents.\n\nThe details decide whether delegation is correct. `event.target` is the innermost element clicked (often a `<span>` inside the button), `event.currentTarget` is the element whose listener is running, and `closest` can walk past your container, so check `container.contains(match)` before acting. `stopPropagation()` stops the event reaching further elements but lets other listeners on the current element finish; `stopImmediatePropagation()` stops those too. Neither prevents the default action; that's `preventDefault()`, a separate concern. Some events don't bubble (`focus`, `blur`, `mouseenter`, `mouseleave`), so delegate with `focusin`/`focusout` or `mouseover`/`mouseout` instead.\n\nThe gotchas at scale: `stopPropagation` in one component silently breaks delegated handlers elsewhere, including analytics and \"click outside to close\" logic that listens on `document` (one reason React 17 moved its own delegated listeners from `document` to the root container). Passive listeners (`{ passive: true }`) for `touchstart`/`wheel` let the browser scroll without waiting for your handler. And inside Shadow DOM, events are retargeted at the shadow boundary, so read `event.composedPath()` to see the real inner target.",
      level: "advanced",
      estMinutes: 75,
      webRefs: [
        { label: "MDN: Event bubbling", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling", kind: "docs" },
        { label: "MDN: Element.closest()", url: "https://developer.mozilla.org/en-US/docs/Web/API/Element/closest", kind: "docs" },
        { label: "javascript.info: Bubbling and capturing", url: "https://javascript.info/bubbling-and-capturing", kind: "article" },
        { label: "javascript.info: Event delegation", url: "https://javascript.info/event-delegation", kind: "article" },
      ],
      video: {
        title: "Event Bubbling, Capturing aka Trickling in Javascript | Oyo UI/Frontend Interview Question",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=aVSf0b1jVKk",
        videoId: "aVSf0b1jVKk",
        durationLabel: "27:41",
      },
      alternateVideos: [
        {
          title: "Event Delegation in Javascript | UI/Frontend Interview Question",
          channel: "Akshay Saini",
          url: "https://www.youtube.com/watch?v=3KJI1WZGDrg",
          videoId: "3KJI1WZGDrg",
          durationLabel: "27:45",
        },
        {
          title: "Learn Event Delegation In 10 Minutes",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=cOoP8-NPLSo",
          videoId: "cOoP8-NPLSo",
          durationLabel: "9:56",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Simulate how a click propagates through a DOM tree and which listeners run, including delegated ones. Implement `dispatchClick(tree, listeners, targetId)`.\n\n- `tree` is the root node. Each node is `{ id, tag, classes?, children? }`; tags are lowercase and ids are unique.\n- Each listener is `{ on, handler, selector?, capture?, stop? }`, where `on` is the id of the node it's attached to and `handler` is its name.\n- Return the listeners that run, in order, as `{ handler, currentTarget, matched }`: `currentTarget` is the `on` node's id and `matched` is the id of the delegated match, or `null` for a listener without a selector.\n- Order follows the DOM: first the capture phase from the root down to the target, running only `capture: true` listeners (the target's included), then the bubble phase from the target back up to the root, running only listeners without `capture`. On a node, listeners run in the order they appear in `listeners`.\n- A listener with a `selector` is delegated: it runs only if a node on the path from the target up to, but not including, the listener's own node matches the selector, and `matched` is the closest such node. A selector is a tag, `.class`, `#id` or a compound of them like `li.item.active` or `button#save`.\n- `stop: \"propagation\"` works like `stopPropagation()`: the remaining listeners on the same node and phase still run, but nothing after that does. `stop: \"immediate\"` works like `stopImmediatePropagation()`: nothing after this listener runs. A delegated listener that doesn't match doesn't run, so its `stop` has no effect.\n- If `targetId` isn't in the tree, return `[]`.",
        starterCode: `/**
 * @param {{ id: string, tag: string, classes?: string[], children?: object[] }} tree
 * @param {{ on: string, handler: string, selector?: string, capture?: boolean, stop?: "propagation" | "immediate" }[]} listeners
 * @param {string} targetId
 * @returns {{ handler: string, currentTarget: string, matched: string | null }[]}
 */
function dispatchClick(tree, listeners, targetId) {
  // Your code here
  return [];
}
`,
        functionName: "dispatchClick",
        testCases: [
          {
            description: "a delegated listener reports the closest matching node",
            args: [DELEGATION_TREE, [{ on: "list", handler: "pick", selector: "li" }], "s1"],
            expected: [{ handler: "pick", currentTarget: "list", matched: "i1" }],
          },
          {
            description: "a click on the container itself matches nothing",
            args: [DELEGATION_TREE, [{ on: "list", handler: "pick", selector: "li" }], "list"],
            expected: [],
            isEdgeCase: true,
          },
          {
            description: "bubbling runs from the target up to the root, whatever the registration order",
            args: [
              DELEGATION_TREE,
              [
                { on: "app", handler: "c" },
                { on: "s1", handler: "a" },
                { on: "i1", handler: "b" },
              ],
              "s1",
            ],
            expected: [
              { handler: "a", currentTarget: "s1", matched: null },
              { handler: "b", currentTarget: "i1", matched: null },
              { handler: "c", currentTarget: "app", matched: null },
            ],
          },
          {
            description: "capture listeners run top-down before any bubble listener",
            args: [
              DELEGATION_TREE,
              [
                { on: "app", handler: "appBubble" },
                { on: "s1", handler: "target" },
                { on: "i1", handler: "liCapture", capture: true },
                { on: "app", handler: "appCapture", capture: true },
              ],
              "s1",
            ],
            expected: [
              { handler: "appCapture", currentTarget: "app", matched: null },
              { handler: "liCapture", currentTarget: "i1", matched: null },
              { handler: "target", currentTarget: "s1", matched: null },
              { handler: "appBubble", currentTarget: "app", matched: null },
            ],
          },
          {
            description: "stopPropagation still lets the node's other listeners run",
            args: [
              DELEGATION_TREE,
              [
                { on: "i1", handler: "first", stop: "propagation" },
                { on: "i1", handler: "second" },
                { on: "app", handler: "never" },
              ],
              "s1",
            ],
            expected: [
              { handler: "first", currentTarget: "i1", matched: null },
              { handler: "second", currentTarget: "i1", matched: null },
            ],
            isEdgeCase: true,
          },
          {
            description: "stopImmediatePropagation stops everything after it",
            args: [
              DELEGATION_TREE,
              [
                { on: "i1", handler: "first", stop: "immediate" },
                { on: "i1", handler: "second" },
                { on: "app", handler: "never" },
              ],
              "s1",
            ],
            expected: [{ handler: "first", currentTarget: "i1", matched: null }],
            isEdgeCase: true,
          },
          {
            description: "with nested matches, the innermost one wins",
            args: [DELEGATION_TREE, [{ on: "app", handler: "card", selector: ".card" }], "save"],
            expected: [{ handler: "card", currentTarget: "app", matched: "inner" }],
          },
          {
            description: "a match above the listener's node doesn't count",
            args: [DELEGATION_TREE, [{ on: "list", handler: "pick", selector: "div" }], "s1"],
            expected: [],
            isEdgeCase: true,
          },
          {
            description: "compound selectors need every part to match",
            args: [
              DELEGATION_TREE,
              [
                { on: "list", handler: "active", selector: "li.item.active" },
                { on: "list", handler: "any", selector: "li.item" },
                { on: "list", handler: "labelled", selector: "li.label" },
              ],
              "b2",
            ],
            expected: [
              { handler: "active", currentTarget: "list", matched: "i2" },
              { handler: "any", currentTarget: "list", matched: "i2" },
            ],
          },
          {
            description: "a delegated listener that doesn't match can't stop propagation",
            args: [
              DELEGATION_TREE,
              [
                { on: "list", handler: "buttonsOnly", selector: "button", stop: "immediate" },
                { on: "list", handler: "rows", selector: "li" },
                { on: "app", handler: "root" },
              ],
              "s1",
            ],
            expected: [
              { handler: "rows", currentTarget: "list", matched: "i1" },
              { handler: "root", currentTarget: "app", matched: null },
            ],
            isEdgeCase: true,
          },
          {
            description: "the target itself can be the match, in both phases",
            args: [
              DELEGATION_TREE,
              [
                { on: "app", handler: "saveBubble", selector: "button#save" },
                { on: "app", handler: "saveCapture", selector: "button#save", capture: true },
              ],
              "save",
            ],
            expected: [
              { handler: "saveCapture", currentTarget: "app", matched: "save" },
              { handler: "saveBubble", currentTarget: "app", matched: "save" },
            ],
          },
          {
            description: "an unknown target produces no calls",
            args: [DELEGATION_TREE, [{ on: "app", handler: "root" }], "missing"],
            expected: [],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "js-web-storage",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "Web Storage: localStorage, sessionStorage & Cookies",
      summary:
        "The browser offers several client-side stores with very different contracts, and choosing by convenience is how tokens leak and data disappears. `localStorage` persists per origin across sessions; `sessionStorage` is scoped to one tab and origin, survives reloads but not closing the tab, and is copied when a tab is duplicated. Both are synchronous, string-only key/value APIs with about 5 MiB per origin each: every read and write blocks the main thread, values must be serialised (storing an object gives you `\"[object Object]\"`), writes throw `QuotaExceededError` when full, and access can throw when storage is blocked, so wrap it. For large or structured data, IndexedDB is the asynchronous alternative.\n\nCookies are different in kind: the browser attaches them to every matching request, which makes them the right carrier for session identifiers and the wrong place for bulk data (about 4 KB per cookie, added to every request). Their attributes are security controls. `HttpOnly` hides the cookie from `document.cookie`, so injected scripts can't read it; `Secure` limits it to HTTPS; `SameSite=Strict|Lax|None` decides whether it's sent on cross-site requests, a CSRF defence (`None` requires `Secure`, and browsers such as Chrome treat a missing `SameSite` as `Lax`); and the `__Host-` prefix pins a cookie to one host with `Path=/`.\n\nThe `storage` event lets tabs coordinate: when one document changes `localStorage`, every other same-origin document gets the event, but the document that made the change doesn't. The classic anti-pattern is keeping an access token in `localStorage`: any XSS or compromised third-party script can read and exfiltrate it, whereas an `HttpOnly`, `Secure`, `SameSite` cookie can't be read by script at all (it still needs CSRF protection).",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "MDN: Web Storage API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API", kind: "docs" },
        { label: "MDN: Using HTTP cookies", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies", kind: "docs" },
        { label: "web.dev: SameSite cookies explained", url: "https://web.dev/articles/samesite-cookies-explained", kind: "article" },
        { label: "javascript.info: localStorage, sessionStorage", url: "https://javascript.info/localstorage", kind: "article" },
      ],
      video: {
        title: "JavaScript Cookies vs Local Storage vs Session Storage",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=GihQAC1I39Q",
        videoId: "GihQAC1I39Q",
        durationLabel: "14:27",
      },
      alternateVideos: [
        {
          title: "Local Storage & Session Storage [ with Code Examples ]",
          channel: "Akshay Saini",
          url: "https://www.youtube.com/watch?v=MOd5cTJ6kaA",
          videoId: "MOd5cTJ6kaA",
          durationLabel: "14:52",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "js-web-storage-q1",
          prompt: "What does this log?\n\n```js\nlocalStorage.setItem(\"user\", { name: \"Ada\" });\nconsole.log(localStorage.getItem(\"user\"));\n```",
          options: ["`\"[object Object]\"`", "`{ name: \"Ada\" }`", "`'{\"name\":\"Ada\"}'`", "It throws a `TypeError`"],
          correctIndex: 0,
          explanation:
            "Web Storage converts every value to a string with `String()`, so the object becomes `\"[object Object]\"` and the data is lost. Store `JSON.stringify(value)` and parse it when reading.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-web-storage-q2",
          prompt: "What does this log?\n\n```js\nlocalStorage.setItem(\"count\", 1);\nconst next = localStorage.getItem(\"count\") + 1;\nconsole.log(next);\n```",
          options: ["`\"11\"`", "`2`", "`\"2\"`", "`NaN`"],
          correctIndex: 0,
          explanation:
            "The number is stored as the string `\"1\"`, and `\"1\" + 1` is string concatenation. Convert on the way out: `Number(localStorage.getItem(\"count\")) + 1`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-web-storage-q3",
          prompt:
            "Tabs A and B are open on the same origin. Tab A runs `localStorage.setItem(\"theme\", \"dark\")`, changing it from `\"light\"`. Which statements are true? (Select all that apply.)",
          options: [
            "Tab B receives a `storage` event with `key` `\"theme\"`, `oldValue` `\"light\"` and `newValue` `\"dark\"`",
            "Tab A doesn't receive a `storage` event for its own write",
            "A `sessionStorage.setItem` in tab A would also fire a `storage` event in tab B",
            "Tab B receives the event only if it's the focused tab",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "The `storage` event notifies other documents sharing the storage area, never the one that made the change, and background tabs get it too. Each tab has its own `sessionStorage`, so tab B's storage area didn't change.",
        },
        {
          id: "js-web-storage-q4",
          prompt: "Which statements about `sessionStorage` are true? (Select all that apply.)",
          options: [
            "It survives a page reload in the same tab",
            "Two tabs open on the same URL have separate `sessionStorage`",
            "It's cleared when the tab is closed",
            "It's shared by every tab of the origin until the browser quits",
            "It can store objects without serialisation",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`sessionStorage` is keyed by origin and by tab, lives as long as that tab's session, and, like `localStorage`, stores only strings.",
        },
        {
          id: "js-web-storage-q5",
          prompt: "Which `Set-Cookie` header is the best choice for a session identifier on an HTTPS site that is never embedded cross-site?",
          options: [
            "`Set-Cookie: __Host-sid=abc123; Path=/; Secure; HttpOnly; SameSite=Lax`",
            "`Set-Cookie: sid=abc123; Domain=example.com; SameSite=None`",
            "`Set-Cookie: sid=abc123; Path=/; SameSite=Strict`",
            "`Set-Cookie: sid=abc123; Secure; Max-Age=31536000`",
          ],
          correctIndex: 0,
          explanation:
            "It's unreadable by script (`HttpOnly`), HTTPS-only (`Secure`), not sent on cross-site subrequests (`Lax`) and host-locked (`__Host-`). `SameSite=None` without `Secure` is rejected, and the other two leave the cookie readable from JavaScript.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-web-storage-q6",
          prompt: "What does the `HttpOnly` cookie attribute protect against?",
          options: [
            "Scripts (including XSS payloads) reading it via `document.cookie`",
            "Cross-site request forgery that rides on the cookie",
            "The cookie being sent over plain HTTP",
            "The user editing the cookie in DevTools",
          ],
          correctIndex: 0,
          explanation:
            "`HttpOnly` only removes the cookie from JavaScript's view; the browser still sends it with requests, so CSRF defences (`SameSite`, tokens) are a separate job, and `Secure` is what restricts it to HTTPS.",
        },
        {
          id: "js-web-storage-q7",
          prompt: "A third-party widget embedded in iframes on other sites needs its own cookie on every request. What must the cookie have?",
          options: [
            "`SameSite=None; Secure`",
            "`SameSite=Lax`",
            "`SameSite=Strict; HttpOnly`",
            "No `SameSite` attribute, because a missing attribute means `None`",
          ],
          correctIndex: 0,
          explanation:
            "Cross-site sending requires `SameSite=None`, which is only accepted together with `Secure`. Chrome treats a missing attribute as `Lax`, so the cookie wouldn't be sent in the iframe; browsers that block or partition third-party cookies may still need the `Partitioned` (CHIPS) attribute.",
        },
        {
          id: "js-web-storage-q8",
          prompt: "Why do security reviews flag storing access tokens in `localStorage`?",
          options: [
            "Any script on the origin, including an XSS payload, can read and exfiltrate it",
            "`localStorage` is sent to the server with every single request",
            "Other origins can read your `localStorage` through an iframe",
            "Tokens stored there are wiped whenever the tab is closed",
          ],
          correctIndex: 0,
          explanation:
            "`localStorage` is partitioned by origin but fully readable by every script on that origin. An `HttpOnly` cookie keeps the credential out of JavaScript's reach entirely.",
        },
        {
          id: "js-web-storage-q9",
          prompt: "Why is `localStorage` a poor fit for caching a 3 MB API response that's read on every navigation?",
          options: [
            "Its API is synchronous, so each large read blocks the main thread",
            "It can't store more than 4 KB of data under a single key",
            "The browser clears it automatically on every navigation",
            "It's only accessible from code running in service workers",
          ],
          correctIndex: 0,
          explanation:
            "Every `getItem` blocks until the string is available, and a large `JSON.parse` blocks further. The quota is per origin (about 5 MiB), so one big entry also crowds out everything else.",
        },
        {
          id: "js-web-storage-q10",
          prompt: "Which approach handles storage failures robustly?",
          options: [
            "Wrap storage access in `try/catch` and fall back to memory when it throws",
            "Check `localStorage.length < 5000000` before every write",
            "Nothing is needed: writes fail silently once storage is full",
            "Switch to `sessionStorage`, which has no size quota at all",
          ],
          correctIndex: 0,
          explanation:
            "Writes throw when the quota is exceeded, and merely touching `localStorage` can throw when the user or an embedding context blocks storage. `length` counts keys, not bytes, and `sessionStorage` has its own quota.",
        },
        {
          id: "js-web-storage-q11",
          prompt: "What does this log on a page with no cookies yet?\n\n```js\ndocument.cookie = \"a=1\";\ndocument.cookie = \"b=2\";\nconsole.log(document.cookie);\n```",
          options: ["`a=1; b=2`", "`b=2`", "`a=1`", "`a=1b=2`"],
          correctIndex: 0,
          explanation:
            "`document.cookie` is an accessor, not a plain string: each assignment sets or updates one cookie, and reading returns every cookie visible to the page joined with `\"; \"`. Deleting a cookie means setting it again with an expiry in the past.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "js-error-handling",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "Error Handling & Custom Error Classes",
      summary:
        "Error handling is about deciding who can do something useful with a failure. `throw` unwinds the stack to the nearest `catch`; `finally` always runs, even after `return`, and a `return` inside `finally` overrides both the result and any exception, silently swallowing errors. Throw `Error` instances, never strings or plain objects: only real errors capture a stack trace, and code that reads `err.message` or checks `instanceof Error` expects one. That uncertainty is why strict TypeScript types the caught value as `unknown`.\n\nCustom error classes (`class ValidationError extends Error`) let callers branch on the kind of failure instead of parsing messages. Set `this.name`, add structured fields (`status`, `field`, `code`), and pass `{ cause }` (ES2022) when wrapping a lower-level error so the original isn't lost: `throw new DbError(\"save failed\", { cause: err })`. Subclassing `Error` with `class` gives correct `instanceof` checks and stack traces, which ES5-style subclassing and TypeScript compiled to ES5 got wrong. `instanceof` still fails across realms and duplicated packages, so a `name` or `code` check is often sturdier.\n\nAsync code changes where errors go. `try/catch` only sees rejections you `await` inside it; an error thrown in a `setTimeout` callback or an event listener escapes the surrounding `try` entirely and surfaces as a global `error` event, while unobserved rejections surface as `unhandledrejection`. Use those hooks for reporting, not recovery. The real design question is where to catch: close to the failure only when you can recover (retry, fallback, a message to the user), otherwise let it propagate to a boundary (a route handler, a React error boundary, a job runner) that logs once with context. Catching, logging and rethrowing at every layer duplicates logs and hides where the failure started.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "MDN: Error", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error", kind: "docs" },
        { label: "MDN: Error: cause", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause", kind: "docs" },
        { label: "javascript.info: Custom errors, extending Error", url: "https://javascript.info/custom-errors", kind: "article" },
        { label: "sudheerj: JavaScript Interview Questions", url: "https://github.com/sudheerj/javascript-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Javascript Custom Error Classes: When, Why, How (a Lesson from our JavaScript Error Handling Course)",
        channel: "Vue School",
        url: "https://www.youtube.com/watch?v=XHDvwxK3lGg",
        videoId: "XHDvwxK3lGg",
        durationLabel: "9:37",
      },
      alternateVideos: [
        {
          title: "I'm Ditching Try/Catch for Good!",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=AdmGHwvgaVs",
          videoId: "AdmGHwvgaVs",
          durationLabel: "10:29",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "js-error-handling-q1",
          prompt:
            "What does this log?\n\n```js\nfunction f() {\n  try {\n    throw new Error(\"boom\");\n  } finally {\n    return \"finally\";\n  }\n}\nconsole.log(f());\n```",
          options: ["`finally`", "It throws `Error: boom`", "`undefined`", "`boom`"],
          correctIndex: 0,
          explanation:
            "A `return` (or `throw`) in `finally` replaces whatever completion was in progress, including an exception, so the error vanishes without a trace. Linters flag this as `no-unsafe-finally` for that reason.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-error-handling-q2",
          prompt:
            "What does this log?\n\n```js\nfunction g() {\n  let x = 1;\n  try {\n    return x;\n  } finally {\n    x = 2;\n    console.log(\"finally\", x);\n  }\n}\nconsole.log(g());\n```",
          options: ["`finally 2`, then `1`", "`finally 2`, then `2`", "`1`, then `finally 2`", "Only `1`: `finally` is skipped after a `return`"],
          correctIndex: 0,
          explanation:
            "`return x` evaluates `x` (1) before `finally` runs, and changing the variable afterwards doesn't change the value already being returned. `finally` still runs before the function actually exits.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-error-handling-q3",
          prompt:
            "What happens?\n\n```js\ntry {\n  setTimeout(() => {\n    throw new Error(\"late\");\n  }, 0);\n} catch (e) {\n  console.log(\"caught\", e.message);\n}\nconsole.log(\"done\");\n```",
          options: [
            "`done`, then the error surfaces later as an uncaught exception",
            "`caught late`, then `done`",
            "`done`, then `caught late` once the timer fires",
            "Nothing is logged: the error stops the whole script",
          ],
          correctIndex: 0,
          explanation:
            "The `try` block finished long before the timer fires, and the callback runs on a fresh stack with no enclosing `try`. Put the `try/catch` inside the callback, or use promises and `await` so the error flows back to the caller.",
        },
        {
          id: "js-error-handling-q4",
          prompt:
            "Which statements are true? (Select all that apply.)\n\n```js\nclass HttpError extends Error {\n  constructor(status, message, options) {\n    super(message, options);\n    this.name = \"HttpError\";\n    this.status = status;\n  }\n}\nconst low = new TypeError(\"socket closed\");\nconst err = new HttpError(503, \"Service unavailable\", { cause: low });\n```",
          options: [
            "`err instanceof HttpError && err instanceof Error` is `true`",
            "`err.cause === low` is `true`",
            "`String(err)` is `\"HttpError: Service unavailable\"`",
            "`JSON.stringify(err)` includes the message",
            "`err.stack` has the same format in every JavaScript engine",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Class-based subclassing gets the prototype chain right, `super(message, { cause })` stores the cause, and `Error.prototype.toString` prints `name: message`. `message` and `cause` are non-enumerable, so `JSON.stringify` only emits `name` and `status`; the `stack` format isn't standardised.",
        },
        {
          id: "js-error-handling-q5",
          prompt:
            "What does this log?\n\n```js\ntry {\n  throw { message: \"bad input\" };\n} catch (e) {\n  console.log(e instanceof Error, e.message, e.stack);\n}\n```",
          options: ["`false bad input undefined`", "`true bad input` followed by a stack trace", "`false undefined undefined`", "It throws a `TypeError`: only errors can be thrown"],
          correctIndex: 0,
          explanation:
            "Any value can be thrown, but only `Error` objects record a stack trace, so a thrown plain object gives error reporters nothing to point at. It's also why `catch` bindings are `unknown` in strict TypeScript.",
        },
        {
          id: "js-error-handling-q6",
          prompt: "In a large app's data layer, which error-handling strategy is the most maintainable?",
          options: [
            "Catch locally only to recover; let the rest reach one boundary that logs it",
            "Wrap every function in `try/catch`, log the error, then rethrow it",
            "Catch everything low down and return `null` so callers never see errors",
            "Rely on a global `window.onerror` handler to recover from failures",
          ],
          correctIndex: 0,
          explanation:
            "Catching where you can't act either duplicates logs (catch-log-rethrow) or hides failures (return `null`), and global handlers are for reporting, not recovery. One boundary with context keeps the signal clean.",
        },
        {
          id: "js-error-handling-q7",
          prompt: "Which browser hook reports a rejected promise that no code ever handled?",
          options: [
            "`window.addEventListener(\"unhandledrejection\", …)`",
            "`window.onerror`",
            "`process.on(\"uncaughtException\", …)`",
            "`document.addEventListener(\"error\", …)`",
          ],
          correctIndex: 0,
          explanation:
            "Uncaught exceptions go to the `error` event (`window.onerror`), while unhandled promise rejections have their own `unhandledrejection` event. The `process` events are Node.js APIs.",
        },
        {
          id: "js-error-handling-q8",
          prompt:
            "`err instanceof ValidationError` is `false` for errors thrown by a library, even though `err.name` is `\"ValidationError\"`. What could cause it? (Select all that apply.)",
          options: [
            "Two copies of the library are installed, so there are two different `ValidationError` classes",
            "The error was created in another realm, such as an iframe",
            "The library was compiled to ES5 without restoring the prototype chain for `Error` subclasses",
            "`instanceof` only works with built-in error types",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`instanceof` compares against one specific class object, so duplicated packages and other realms break it, and ES5-compiled subclasses of `Error` historically lost their prototype. Checking `err.name` or a `code` property avoids all three.",
        },
        {
          id: "js-error-handling-q9",
          prompt:
            "What's the benefit of this over `throw new Error(\"Config file is invalid: \" + err.message)`?\n\n```js\ntry {\n  config = JSON.parse(text);\n} catch (err) {\n  throw new Error(\"Config file is invalid\", { cause: err });\n}\n```",
          options: [
            "The original error, with its type and stack, stays attached",
            "The new error can now be caught twice by callers",
            "`JSON.parse` is retried automatically on failure",
            "The original stack trace is hidden to reduce noise",
          ],
          correctIndex: 0,
          explanation:
            "`cause` chains errors without flattening them into a string, so you keep the `SyntaxError` and its stack while adding context. Node and browser consoles print the cause chain.",
        },
        {
          id: "js-error-handling-q10",
          prompt: "Is wrapping hot code in `try/catch` still a performance problem in modern V8?",
          options: [
            "No: that was an old Crankshaft limit; TurboFan optimises them",
            "Yes: functions containing `try/catch` are never optimised",
            "Yes: every `try` block copies the call stack on entry",
            "Only in strict mode, where `try` blocks disable inlining",
          ],
          correctIndex: 0,
          explanation:
            "The advice to move `try/catch` into a separate function dates from Crankshaft. Throwing is still relatively expensive (it captures a stack trace), so don't use exceptions for ordinary control flow, but a `try` block itself costs little.",
        },
      ],
    },
    {
      id: "js-weakmap-weakset",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "WeakMap & WeakSet",
      summary:
        "`WeakMap` and `WeakSet` hold their keys weakly: an entry doesn't keep its key alive, so once nothing else references the key object, the garbage collector may drop the entry together with its value. That makes them the tool for attaching data to objects whose lifetime you don't control, such as per-DOM-node metadata, memoisation keyed by object identity, or private per-instance state (the pre-`#private` pattern), without leaking memory when those objects go away. A `Map` keyed by DOM nodes is a classic leak: removed nodes stay reachable through the map forever.\n\nThe price of weakness is observability. Keys must be objects or non-registered symbols (not strings or numbers, which can be re-created and so never become unreachable), and there's no `size`, no iteration, no `keys()` and no `clear()`: if you could enumerate the entries, program behaviour would depend on when the collector happened to run. Lookups are by identity, so two structurally equal objects are different keys. Only the key is weak, not the value. WeakMaps are ephemeron tables, so a value that references its own key doesn't keep either alive, but as long as anything else holds the key, the value stays alive with it.\n\n`WeakRef` and `FinalizationRegistry` (ES2021) go further, giving you a reference that doesn't prevent collection and a callback after collection, but the spec deliberately promises no timing: callbacks may run late or never, so never rely on them for correctness-critical cleanup such as closing files or releasing locks. For caches, a `WeakMap` answers \"cache this while the key object is alive\"; \"keep the 100 most recent results\" is an LRU cache, not a weak collection.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "MDN: WeakMap", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap", kind: "docs" },
        { label: "MDN: WeakRef", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef", kind: "docs" },
        { label: "javascript.info: WeakMap and WeakSet", url: "https://javascript.info/weakmap-weakset", kind: "article" },
        { label: "MDN: Memory management", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management", kind: "article" },
      ],
      video: {
        title: "Only The Best Developers Understand How This Works",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=WqNqeMjd28I",
        videoId: "WqNqeMjd28I",
        durationLabel: "18:31",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-weakmap-weakset-q1",
          prompt: "What happens?\n\n```js\nconst wm = new WeakMap();\nwm.set(\"id\", 1);\n```",
          options: [
            "It throws a `TypeError`: a string can't be a weak key",
            "It stores the entry, and it's collected when the string is no longer used",
            "It silently ignores the call",
            "It wraps the key in a `String` object and stores that",
          ],
          correctIndex: 0,
          explanation:
            "Weak keys must be garbage-collectable, and a primitive like `\"id\"` can be re-created at any time, so it would never become unreachable. Use a `Map` for primitive keys.",
        },
        {
          id: "js-weakmap-weakset-q2",
          prompt: "What happens in a current engine?\n\n```js\nconst wm = new WeakMap();\nwm.set(Symbol(\"a\"), 1);     // A\nwm.set(Symbol.for(\"b\"), 2); // B\n```",
          options: [
            "A works; B throws a `TypeError` (registered symbols aren't allowed)",
            "Both throw a `TypeError`, since symbols are primitives",
            "Both work, since every symbol value is unique",
            "A throws; B works because registered symbols are global",
          ],
          correctIndex: 0,
          explanation:
            "Since ES2023, non-registered symbols are allowed as weak keys because they're unique and can't be re-created. `Symbol.for` symbols live in a global registry and can be looked up again by name, so they never become unreachable.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-weakmap-weakset-q3",
          prompt: "Given `const wm = new WeakMap()`, which of these exist? (Select all that apply.)",
          options: ["`wm.has(key)`", "`wm.delete(key)`", "`wm.size`", "`wm.keys()`", "`wm.clear()`", "`for (const [k, v] of wm)`"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "A `WeakMap` only offers `get`, `set`, `has` and `delete`, all of which need a key you already hold. Anything that reveals which keys are present would expose garbage-collection timing.",
        },
        {
          id: "js-weakmap-weakset-q4",
          prompt: "What does this log?\n\n```js\nconst cache = new WeakMap();\ncache.set({ id: 1 }, \"a\");\nconsole.log(cache.get({ id: 1 }));\n```",
          options: ["`undefined`", "`\"a\"`", "It throws a `TypeError`", "`null`"],
          correctIndex: 0,
          explanation:
            "Keys are compared by identity, and each object literal is a new object. The first object is unreachable right after `set`, so its entry can be collected at any time.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-weakmap-weakset-q5",
          prompt:
            "A component keeps per-element metadata in `const meta = new Map()` keyed by DOM elements. Elements get removed from the page but are never deleted from `meta`. What happens?",
          options: [
            "The removed elements stay in memory; a `WeakMap` would let them go",
            "Nothing: detached elements are garbage-collected anyway",
            "The browser throws when a detached element is a `Map` key",
            "Keying a plain object literal by the element would fix it",
          ],
          correctIndex: 0,
          explanation:
            "A `Map` holds strong references, so the detached subtrees remain reachable through it: a classic leak that shows up as \"Detached\" nodes in heap snapshots. An object literal would convert every element to a string key such as `\"[object HTMLDivElement]\"`, so different elements would collide.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-weakmap-weakset-q6",
          prompt:
            "Which statements are true? (Select all that apply.)\n\n```js\nconst memo = new WeakMap();\nfunction area(shape) {\n  if (!memo.has(shape)) memo.set(shape, expensiveArea(shape));\n  return memo.get(shape);\n}\n```",
          options: [
            "Results are cached per object identity",
            "When a shape object becomes unreachable, its cached result can be collected too",
            "Changing `shape.width` after the first call makes `area(shape)` return a stale result",
            "Two different objects with the same dimensions share one cache entry",
            "You can list all cached shapes for debugging",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Identity-keyed memoisation is only correct for objects you treat as immutable, since the cache can't see mutations. Equal-looking objects are different keys, and weak collections can't be enumerated.",
        },
        {
          id: "js-weakmap-weakset-q7",
          prompt: "Which use of `FinalizationRegistry` is appropriate?",
          options: [
            "Best-effort cleanup, such as removing a stale entry from a cache after its object is collected",
            "Closing a database connection exactly when its wrapper object is no longer used",
            "Flushing unsaved user data to the server",
            "Releasing a lock that another tab is waiting for",
          ],
          correctIndex: 0,
          explanation:
            "Finalisation callbacks may run long after collection or not at all (for example if the page closes first), so they suit optional housekeeping only. Resources that must be released need explicit `close()`/`dispose()` calls.",
        },
        {
          id: "js-weakmap-weakset-q8",
          prompt: "Which is a good use of a `WeakSet`?",
          options: [
            "Marking objects already processed, such as visited graph nodes",
            "Counting how many unique strings a user has typed",
            "Removing duplicate numbers from a large array",
            "Remembering the order in which objects were added",
          ],
          correctIndex: 0,
          explanation:
            "A `WeakSet` answers only \"have I seen this object?\", and it forgets objects once they're unreachable. Primitives can't be members, and there's no ordering or iteration.",
        },
        {
          id: "js-weakmap-weakset-q9",
          prompt:
            "Is `value` collectable here?\n\n```js\nconst wm = new WeakMap();\nlet key = {};\nconst value = { big: new Array(1e6).fill(0), owner: key };\nwm.set(key, value);\n```",
          options: [
            "Not while `key` is reachable; after `key = null`, both can be",
            "Yes: values in a WeakMap are always held weakly",
            "Never: `value` points at `key`, and that cycle keeps both alive",
            "Only after an explicit `wm.delete(key)` call",
          ],
          correctIndex: 0,
          explanation:
            "A WeakMap entry keeps its value alive only as long as its key is reachable from outside the entry (ephemeron semantics), so a value referring to its own key doesn't pin it. And the value, not the key, is what's big here.",
        },
        {
          id: "js-weakmap-weakset-q10",
          prompt: "Why don't `WeakMap` and `WeakSet` have `size` or iteration?",
          options: [
            "Their contents depend on GC timing, which must stay unobservable",
            "Computing the size would require copying every entry",
            "They're stored as linked lists without a length field",
            "The spec simply hasn't gotten around to adding them",
          ],
          correctIndex: 0,
          explanation:
            "The design goal is that weakness is unobservable: code gets the same answers regardless of GC timing. `WeakRef.prototype.deref` is the deliberate, explicitly non-deterministic exception.",
        },
      ],
    },
    {
      id: "js-symbols",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "Symbols",
      summary:
        "Symbols are unique, non-string property keys. `Symbol(\"desc\")` creates a new value on every call, so a symbol-keyed property can't collide with anyone else's keys; that's how the language added hooks to existing objects without breaking code that already used names like `iterator`. Symbol-keyed properties are skipped by `for...in`, `Object.keys` and `JSON.stringify`, but they aren't private: `Object.getOwnPropertySymbols` and `Reflect.ownKeys` list them. `Symbol.for(\"key\")` is different: it returns a shared symbol from a global, cross-realm registry, for when separate bundles or iframes must agree on one key.\n\nThe well-known symbols are the language's extension points, and the main reason senior engineers care. `Symbol.iterator` makes an object work with `for...of`, spread and destructuring; `Symbol.asyncIterator` does the same for `for await...of`; `Symbol.toPrimitive` controls conversion, receiving a hint of `\"number\"`, `\"string\"` or `\"default\"` (the last is used by `+` and `==`); `Symbol.toStringTag` customises `Object.prototype.toString`; `Symbol.hasInstance` overrides `instanceof`. Libraries rely on them too: React marks elements with a `$$typeof` symbol from `Symbol.for`, so an attacker's JSON can't pose as a React element.\n\nThe gotchas: symbols don't convert to strings implicitly (`\"\" + sym` and template literals throw a `TypeError`, while `String(sym)` and `sym.description` work); `new Symbol()` throws because `Symbol` isn't a constructor; and since ES2023 non-registered symbols can be `WeakMap` keys but registered ones can't. Use symbols for metadata and protocol hooks on objects you don't own; for real privacy use `#private` fields or closures.",
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        { label: "MDN: Symbol", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol", kind: "docs" },
        { label: "MDN: Symbol.toPrimitive", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive", kind: "docs" },
        { label: "javascript.info: Symbol type", url: "https://javascript.info/symbol", kind: "article" },
        { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
      ],
      video: {
        title: "The Complete Guide to JS Symbols ES6",
        channel: "Colt Steele",
        url: "https://www.youtube.com/watch?v=4J5hnOCj69w",
        videoId: "4J5hnOCj69w",
        durationLabel: "12:18",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-symbols-q1",
          prompt:
            "What does this log?\n\n```js\nconst id = Symbol(\"id\");\nconst user = { name: \"Ada\", [id]: 42 };\nconsole.log(Object.keys(user), JSON.stringify(user), user[id]);\n```",
          options: [
            "`[\"name\"] {\"name\":\"Ada\"} 42`",
            "`[\"name\", \"id\"] {\"name\":\"Ada\",\"id\":42} 42`",
            "`[\"name\"] {\"name\":\"Ada\"} undefined`",
            "`[\"name\", Symbol(id)] {\"name\":\"Ada\"} 42`",
          ],
          correctIndex: 0,
          explanation:
            "Symbol keys are skipped by `Object.keys` and `JSON.stringify`, but the property is there and readable with the symbol itself. `Reflect.ownKeys(user)` would list both keys.",
        },
        {
          id: "js-symbols-q2",
          prompt: "What does `console.log(Symbol(\"a\") === Symbol(\"a\"), Symbol.for(\"a\") === Symbol.for(\"a\"))` print?",
          options: ["`false true`", "`true true`", "`false false`", "`true false`"],
          correctIndex: 0,
          explanation:
            "Every `Symbol()` call creates a new unique value; the description is just a label. `Symbol.for` looks the key up in the global registry and returns the same symbol each time.",
        },
        {
          id: "js-symbols-q3",
          prompt:
            "What happens on each line?\n\n```js\nconst s = Symbol(\"tag\");\nconsole.log(String(s));     // A\nconsole.log(s.description); // B\nconsole.log(\"x\" + s);       // C\n```",
          options: [
            "A logs `Symbol(tag)`, B logs `tag`, C throws a `TypeError`",
            "A logs `tag`, B logs `tag`, C logs `xtag`",
            "A logs `Symbol(tag)`, B logs `undefined`, C logs `xSymbol(tag)`",
            "All three throw a `TypeError`",
          ],
          correctIndex: 0,
          explanation:
            "Explicit conversion with `String()` and reading `description` are allowed, but implicit conversion (concatenation, template literals) throws, so a symbol can't silently turn into a property name like `\"Symbol(tag)\"`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-symbols-q4",
          prompt:
            "What does this log?\n\n```js\nconst money = {\n  [Symbol.toPrimitive](hint) {\n    if (hint === \"number\") return 42;\n    if (hint === \"string\") return \"forty-two\";\n    return \"default\";\n  },\n};\nconsole.log(+money, `${money}`, money + \"\");\n```",
          options: ["`42 forty-two default`", "`42 forty-two forty-two`", "`42 default default`", "`NaN forty-two default`"],
          correctIndex: 0,
          explanation:
            "Unary `+` asks for a number, a template literal asks for a string, and binary `+` uses the `\"default\"` hint because it could mean addition or concatenation. `Date` is the built-in that treats `\"default\"` as `\"string\"`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-symbols-q5",
          prompt:
            "Given this object, which expressions work as expected? (Select all that apply.)\n\n```js\nconst range = {\n  from: 1,\n  to: 3,\n  *[Symbol.iterator]() {\n    for (let i = this.from; i <= this.to; i++) yield i;\n  },\n};\n```",
          options: [
            "`[...range]` gives `[1, 2, 3]`",
            "`const [first] = range` sets `first` to `1`",
            "`Array.from(range, (x) => x * 10)` gives `[10, 20, 30]`",
            "`range.map((x) => x * 2)` gives `[2, 4, 6]`",
            "`range.length` is `3`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Spread, destructuring and `Array.from` all consume the iteration protocol. Being iterable doesn't make an object an array: it has no `map` and no `length` unless you add them.",
        },
        {
          id: "js-symbols-q6",
          prompt: "Which of these reveal a symbol-keyed own property of `obj`? (Select all that apply.)",
          options: ["`Object.getOwnPropertySymbols(obj)`", "`Reflect.ownKeys(obj)`", "`Object.keys(obj)`", "`for (const k in obj)`", "`JSON.stringify(obj)`"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Symbol keys are hidden from the string-key APIs, not from reflection, so they prevent accidental collisions but provide no privacy. Use `#private` fields when data must be inaccessible.",
        },
        {
          id: "js-symbols-q7",
          prompt: "Why would a library use `Symbol.for(\"my-lib.marker\")` instead of `Symbol(\"my-lib.marker\")` to tag its objects?",
          options: [
            "So separate copies of the library (bundles, iframes) share one symbol",
            "Because `Symbol.for` symbols are hidden from `Reflect.ownKeys`",
            "Because plain `Symbol()` values get garbage-collected too early",
            "Because only registered symbols can be used as property keys",
          ],
          correctIndex: 0,
          explanation:
            "A plain `Symbol()` is unique to the copy of the code that created it; the registry is shared across the whole runtime, including other realms. The trade-off is that anyone can obtain a registered symbol by name.",
        },
        {
          id: "js-symbols-q8",
          prompt: "What does `new Symbol(\"x\")` do?",
          options: [
            "Throws a `TypeError`: `Symbol` is not a constructor",
            "Returns a `Symbol` wrapper object, like `new String` does",
            "Returns a new symbol, the same as calling `Symbol(\"x\")`",
            "Returns the registered symbol for the key `\"x\"`",
          ],
          correctIndex: 0,
          explanation:
            "Symbols are primitives, and blocking `new` prevents accidentally creating wrapper objects (which `new String` and `new Number` still allow). `Object(sym)` can still produce a wrapper if you really need one.",
        },
        {
          id: "js-symbols-q9",
          prompt:
            "What does this log?\n\n```js\nclass Temperature {\n  get [Symbol.toStringTag]() { return \"Temperature\"; }\n}\nconsole.log(Object.prototype.toString.call(new Temperature()));\n```",
          options: ["`[object Temperature]`", "`[object Object]`", "`[class Temperature]`", "`Temperature`"],
          correctIndex: 0,
          explanation:
            "`Object.prototype.toString` builds `[object <tag>]` from `Symbol.toStringTag` when present, which is how built-ins such as `Map` report `[object Map]`.",
        },
        {
          id: "js-symbols-q10",
          prompt:
            "What does this log?\n\n```js\nclass Even {\n  static [Symbol.hasInstance](n) {\n    return n % 2 === 0;\n  }\n}\nconsole.log(2 instanceof Even, 3 instanceof Even);\n```",
          options: ["`true false`", "`false false`", "`true true`", "It throws a `TypeError` because `2` is not an object"],
          correctIndex: 0,
          explanation:
            "`instanceof` first looks for a `Symbol.hasInstance` method on the right-hand side and calls it with the left-hand value, even a primitive. Without it, a primitive on the left is never an instance of anything.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "js-regex",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "Regular Expressions in JS",
      summary:
        "Regular expressions are a compact language for matching text, and in JavaScript they're also stateful objects, which is where most production bugs come from. A regex with the `g` or `y` flag keeps a `lastIndex` cursor: `test()` and `exec()` start from it and advance it, so reusing one global regex across calls gives alternating results (`re.test(\"a\")` is `true`, then `false`). `String.prototype.match` with `g` returns only the matched strings, without groups; `matchAll` returns an iterator of full match objects and requires `g`; `replaceAll` with a regex requires `g` too; and `split` with a capture group includes the captured separators in its result.\n\nModern syntax makes patterns maintainable: named groups (`(?<year>\\d{4})`, read through `match.groups.year` or `$<year>` in a replacement), lookbehind (`(?<=\\$)\\d+`), the `s` flag so `.` matches newlines, `d` for match indices, and the `u`/`v` flags for Unicode. Without `u`, `.` treats an emoji as two UTF-16 code units, and even with it `\\w` and `\\b` stay ASCII-based, so use `\\p{L}` for letters. ES2025 added `RegExp.escape()` for embedding user input safely, and inline modifiers such as `(?i:...)`.\n\nThe performance trap is catastrophic backtracking. V8's regex engine backtracks, so nested or overlapping quantifiers like `/^(a+)+$/` can take exponential time on a near-miss input: a denial-of-service vector (ReDoS) when user input meets a regex on a server's single thread. Prefer specific character classes, avoid nested quantifiers, cap input length, and don't validate whole grammars (email, HTML, URLs) with one heroic regex; use a parser or the platform (`new URL()`, `<input type=\"email\">`).",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "MDN: Regular expressions", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions", kind: "docs" },
        { label: "MDN: RegExp: lastIndex", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex", kind: "docs" },
        { label: "javascript.info: Catastrophic backtracking", url: "https://javascript.info/regexp-catastrophic-backtracking", kind: "article" },
        { label: "MDN: RegExp.escape()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape", kind: "docs" },
      ],
      video: {
        title: "Learn Regular Expressions In 20 Minutes",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=rhzKDrUiJVk",
        videoId: "rhzKDrUiJVk",
        durationLabel: "20:51",
      },
      alternateVideos: [
        {
          title: "Regular Expressions (RegEx) in 100 Seconds",
          channel: "Fireship",
          url: "https://www.youtube.com/watch?v=sXQxhojSdZM",
          videoId: "sXQxhojSdZM",
          durationLabel: "2:22",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "js-regex-q1",
          prompt: "What does this log?\n\n```js\nconst re = /a/g;\nconsole.log(re.test(\"a\"), re.test(\"a\"), re.test(\"a\"));\n```",
          options: ["`true false true`", "`true true true`", "`true false false`", "`false true false`"],
          correctIndex: 0,
          explanation:
            "With `g`, a successful `test` sets `lastIndex` to 1, so the second call searches from index 1, fails and resets `lastIndex` to 0, and the third succeeds again. Remove `g` for yes/no checks, or create the regex per call.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-regex-q2",
          prompt:
            "What does this log?\n\n```js\nconst words = [\"apple\", \"avocado\", \"banana\"];\nconst startsWithA = /^a/g;\nconsole.log(words.filter((w) => startsWithA.test(w)));\n```",
          options: ["`[\"apple\"]`", "`[\"apple\", \"avocado\"]`", "`[]`", "`[\"avocado\"]`"],
          correctIndex: 0,
          explanation:
            "After matching `apple`, `lastIndex` is 1, so the search in `avocado` starts at index 1, where `^` can't match; the failure resets `lastIndex` for `banana`, which doesn't start with `a` anyway. A shared global regex is a classic source of flaky filters.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-regex-q3",
          prompt:
            "What do the two lines log?\n\n```js\nconst s = \"2024-01-15 and 2025-12-31\";\nconsole.log(s.match(/(\\d{4})-\\d{2}/g));\nconsole.log(s.match(/(\\d{4})-\\d{2}/)[1]);\n```",
          options: [
            "`[\"2024-01\", \"2025-12\"]`, then `\"2024\"`",
            "`[\"2024\", \"2025\"]`, then `\"2024-01\"`",
            "`[\"2024-01\", \"2024\", \"2025-12\", \"2025\"]`, then `\"2024\"`",
            "`[\"2024-01\"]`, then `\"2024\"`",
          ],
          correctIndex: 0,
          explanation:
            "With `g`, `match` returns every full match and drops capture groups; without `g` it returns the first match with its groups at `[1]`, `[2]`… Use `matchAll` when you need groups for every match.",
        },
        {
          id: "js-regex-q4",
          prompt: "What does `\"a1b2c\".split(/(\\d)/)` return?",
          options: ["`[\"a\", \"1\", \"b\", \"2\", \"c\"]`", "`[\"a\", \"b\", \"c\"]`", "`[\"a\", \"\", \"b\", \"\", \"c\"]`", "`[\"a1\", \"b2\", \"c\"]`"],
          correctIndex: 0,
          explanation:
            "When the separator regex has capture groups, `split` splices the captured text into the result. Use a non-capturing group `(?:...)` or no group to drop the separators.",
        },
        {
          id: "js-regex-q5",
          prompt: "Which of these throw a `TypeError`? (Select all that apply.)",
          options: [
            "`\"aaa\".replaceAll(/a/, \"b\")`",
            "`[...\"a1b2\".matchAll(/\\d/)]`",
            "`\"aaa\".replace(/a/, \"b\")`",
            "`\"aaa\".replaceAll(\"a\", \"b\")`",
            "`new RegExp(\"[\")`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`replaceAll` and `matchAll` refuse a regex without `g`, to make sure you meant \"all\". `replace` with a non-global regex replaces the first match (`\"baa\"`), `replaceAll` with a string is fine, and an invalid pattern throws a `SyntaxError`, not a `TypeError`.",
        },
        {
          id: "js-regex-q6",
          prompt:
            "What does this log?\n\n```js\nconst re = /(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})/;\nconsole.log(\"2025-09-21\".replace(re, \"$<day>/$<month>/$<year>\"));\n```",
          options: ["`21/09/2025`", "`$<day>/$<month>/$<year>`", "`2025-09-21`", "`day/month/year`"],
          correctIndex: 0,
          explanation:
            "`$<name>` in a replacement string inserts a named group, just as `$1` inserts a numbered one. Named groups survive refactoring when you add or remove other groups.",
        },
        {
          id: "js-regex-q7",
          prompt: "Which regex can take exponential time to fail on an input like `\"aaaaaaaaaaaaaaaaaaaaaaaaa!\"`?",
          options: ["`/^(a+)+$/`", "`/^a+$/`", "`/^[a!]+$/`", "`/a+!/`"],
          correctIndex: 0,
          explanation:
            "The nested quantifier gives the engine exponentially many ways to split the run of `a`s between the inner and outer `+`, and it tries them all before concluding there's no match (about two seconds for 25 characters in V8). The others have a single way to match each character.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-regex-q8",
          prompt: "What does `console.log(\"😀\".length, /^.$/.test(\"😀\"), /^.$/u.test(\"😀\"))` print?",
          options: ["`2 false true`", "`1 true true`", "`2 true true`", "`1 false true`"],
          correctIndex: 0,
          explanation:
            "The emoji is outside the Basic Multilingual Plane, so it's stored as a surrogate pair: two UTF-16 code units. Without `u`, `.` matches one code unit; with `u` (or `v`) it matches a whole code point.",
        },
        {
          id: "js-regex-q9",
          prompt:
            "What do the two lines log?\n\n```js\nconst html = \"<b>one</b><b>two</b>\";\nconsole.log(html.match(/<b>.*<\\/b>/)[0]);\nconsole.log(html.match(/<b>.*?<\\/b>/)[0]);\n```",
          options: [
            "`<b>one</b><b>two</b>`, then `<b>one</b>`",
            "`<b>one</b>`, then `<b>one</b>`",
            "`<b>one</b>`, then `<b>one</b><b>two</b>`",
            "`<b>one</b><b>two</b>` twice",
          ],
          correctIndex: 0,
          explanation:
            "`.*` is greedy: it runs to the end and backtracks to the last `</b>`. `.*?` is lazy and stops at the first one. Neither makes regex a real HTML parser; use `DOMParser` for that.",
        },
        {
          id: "js-regex-q10",
          prompt: "You highlight search terms with `new RegExp(userInput, \"gi\")`, and a user searches for `c++`. What happens, and what's the fix?",
          options: [
            "A `SyntaxError`; escape the input first with `RegExp.escape(userInput)`",
            "It highlights every `c` in the text; add the `u` flag",
            "It works, because `+` is literal inside `new RegExp`",
            "It hangs on catastrophic backtracking; cap the input length",
          ],
          correctIndex: 0,
          explanation:
            "User input is interpreted as pattern syntax, so `c++` is an invalid pattern and `.` or `*` would silently change the meaning. `RegExp.escape` (ES2025, Baseline 2025) escapes every syntax character; older code uses a small escaping helper.",
        },
      ],
    },
    {
      id: "js-design-patterns",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "Common JS Design Patterns (Module, Singleton, Observer, Factory)",
      summary:
        "Design patterns are named solutions to recurring structural problems, and in JavaScript several classic Gang-of-Four patterns collapse into language features. The module pattern (an IIFE returning a public API over closure-private state) was how we got encapsulation before ES modules; today a module file is the module pattern, and its top-level state is a singleton by construction, because each module is evaluated once per module graph. A factory is just a function that returns objects: it hides which concrete type or configuration you build and sidesteps `new`/`this` pitfalls entirely.\n\nObserver (publish/subscribe) is the pattern you use most without noticing: DOM events, Node's `EventEmitter`, RxJS, store `subscribe` APIs and every framework's reactivity system. It decouples producers from consumers but has its own failure modes. Listeners that are never removed leak memory and fire on torn-down components, so always return an unsubscribe function. Emitting while the listener list changes needs a defined rule (Node's `EventEmitter` iterates over a snapshot). A `once` listener must be removed before it's invoked, or a re-entrant emit calls it twice. And an exception in one listener stops the rest unless you isolate them.\n\nSingletons deserve the most scepticism. A module-level instance is convenient for a config object or connection pool, but it's global mutable state: tests become order-dependent and dependencies become invisible. Prefer passing dependencies in (a factory that receives its collaborators), and remember that \"one per module graph\" breaks when two copies of a package are installed or when both a CommonJS and an ESM build get loaded. Treat patterns as vocabulary for design discussions, not a checklist: use one when it names a problem you actually have.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Node.js docs: Events (EventEmitter)", url: "https://nodejs.org/api/events.html", kind: "docs" },
        { label: "MDN: EventTarget", url: "https://developer.mozilla.org/en-US/docs/Web/API/EventTarget", kind: "docs" },
        { label: "patterns.dev: Observer Pattern", url: "https://www.patterns.dev/vanilla/observer-pattern/", kind: "article" },
        { label: "patterns.dev: Singleton Pattern", url: "https://www.patterns.dev/vanilla/singleton-pattern/", kind: "article" },
      ],
      video: {
        title: "10 Design Patterns Explained in 10 Minutes",
        channel: "Fireship",
        url: "https://www.youtube.com/watch?v=tv-_1er1mWI",
        videoId: "tv-_1er1mWI",
        durationLabel: "11:04",
      },
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `createEmitter()`, a minimal observer (publish/subscribe) hub in the spirit of Node's `EventEmitter`. It returns an object with:\n\n- `on(event, listener)`: subscribe, returning an `unsubscribe` function.\n- `once(event, listener)`: subscribe for a single call, also returning an `unsubscribe` function.\n- `off(event, listener)`: remove one subscription of that listener for that event, including one made with `once`.\n- `emit(event, ...args)`: call the event's listeners synchronously, in subscription order, with `args`, and return how many listeners were called.\n\nThe rules the tests check:\n\n- Events are independent, and emitting an event with no listeners returns `0`.\n- `emit` works on a snapshot taken when it starts: listeners added or removed during an emit only affect later emits.\n- A `once` listener is removed before it's called, so an emit triggered from inside it doesn't call it again.\n- Subscribing the same function twice means it runs twice; `off` removes one of those subscriptions.\n- An `unsubscribe` function removes exactly the subscription it was returned for, and calling it again does nothing.\n\nThe tests call `runEmitterScenario(steps)`, which drives your emitter through a list of steps (described in the driver's comments) and returns what the listeners logged and what each top-level `emit` returned. Leave the driver as it is.",
        starterCode: `/**
 * @returns {{ on: Function, once: Function, off: Function, emit: Function }}
 */
function createEmitter() {
  // Your code here
  return {
    on(event, listener) {},
    once(event, listener) {},
    off(event, listener) {},
    emit(event, ...args) {
      return 0;
    },
  };
}

// ---- Test driver (leave as is) ----
// Steps:
//   ["on", event, label]      subscribe listener \`label\` (keeps the returned unsubscribe function)
//   ["once", event, label]    subscribe listener \`label\` for a single call
//   ["off", event, label]     emitter.off(event, listener)
//   ["unsub", label]          call the unsubscribe function from the latest on/once for \`label\`
//   ["emit", event, arg]      emitter.emit(event, arg); the return value is recorded
//   ["react", label, step]    from now on, listener \`label\` also performs \`step\` whenever it runs
function runEmitterScenario(steps) {
  const emitter = createEmitter();
  const log = [];
  const returns = [];
  const listeners = {};
  const unsubscribers = {};
  const reactions = {};
  const listenerFor = (label) => {
    if (!listeners[label]) {
      listeners[label] = function (arg) {
        log.push(label + ":" + arg);
        if (reactions[label]) perform(reactions[label], false);
      };
    }
    return listeners[label];
  };
  const perform = (step, record) => {
    const [op, a, b] = step;
    if (op === "on") unsubscribers[b] = emitter.on(a, listenerFor(b));
    else if (op === "once") unsubscribers[b] = emitter.once(a, listenerFor(b));
    else if (op === "off") emitter.off(a, listenerFor(b));
    else if (op === "unsub") {
      if (typeof unsubscribers[a] === "function") unsubscribers[a]();
    } else if (op === "emit") {
      const result = emitter.emit(a, b);
      if (record) returns.push(result);
    } else if (op === "react") reactions[a] = b;
  };
  for (const step of steps) perform(step, true);
  return { log, returns };
}
`,
        functionName: "runEmitterScenario",
        testCases: [
          {
            description: "listeners run in subscription order with the emitted argument",
            args: [[["on", "a", "A"], ["on", "a", "B"], ["emit", "a", 1]]],
            expected: { log: ["A:1", "B:1"], returns: [2] },
          },
          {
            description: "a once listener runs a single time",
            args: [[["once", "a", "A"], ["on", "a", "B"], ["emit", "a", 1], ["emit", "a", 2]]],
            expected: { log: ["A:1", "B:1", "B:2"], returns: [2, 1] },
          },
          {
            description: "the function returned by on unsubscribes",
            args: [[["on", "a", "A"], ["on", "a", "B"], ["unsub", "A"], ["emit", "a", "x"]]],
            expected: { log: ["B:x"], returns: [1] },
          },
          {
            description: "events are independent, and an event without listeners returns 0",
            args: [[["on", "a", "A"], ["emit", "b", 1], ["emit", "a", 2]]],
            expected: { log: ["A:2"], returns: [0, 1] },
          },
          {
            description: "off also removes a once subscription",
            args: [[["once", "a", "A"], ["on", "a", "B"], ["off", "a", "A"], ["emit", "a", 1]]],
            expected: { log: ["B:1"], returns: [1] },
            isEdgeCase: true,
          },
          {
            description: "removing a listener during an emit only affects later emits",
            args: [[["react", "A", ["off", "a", "B"]], ["on", "a", "A"], ["on", "a", "B"], ["emit", "a", 1], ["emit", "a", 2]]],
            expected: { log: ["A:1", "B:1", "A:2"], returns: [2, 1] },
            isEdgeCase: true,
          },
          {
            description: "a listener added during an emit waits for the next emit",
            args: [[["react", "A", ["on", "a", "C"]], ["on", "a", "A"], ["emit", "a", 1], ["emit", "a", 2]]],
            expected: { log: ["A:1", "A:2", "C:2"], returns: [1, 2] },
            isEdgeCase: true,
          },
          {
            description: "a once listener that emits the same event isn't called again",
            args: [[["react", "A", ["emit", "a", "inner"]], ["once", "a", "A"], ["emit", "a", "outer"]]],
            expected: { log: ["A:outer"], returns: [1] },
            isEdgeCase: true,
          },
          {
            description: "the same function subscribed twice runs twice, and off removes one subscription",
            args: [[["on", "a", "A"], ["on", "a", "A"], ["emit", "a", 1], ["off", "a", "A"], ["emit", "a", 2]]],
            expected: { log: ["A:1", "A:1", "A:2"], returns: [2, 1] },
          },
          {
            description: "an unsubscribe function only removes its own subscription, even if called twice",
            args: [[["on", "a", "A"], ["on", "a", "A"], ["unsub", "A"], ["unsub", "A"], ["emit", "a", 1]]],
            expected: { log: ["A:1"], returns: [1] },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "js-lru-cache",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "Implementing a Simple LRU Cache",
      summary:
        "An LRU (least recently used) cache keeps a bounded number of entries and, when it's full, evicts the one that hasn't been read or written for the longest time. It's the default policy for memoisation, HTTP and CDN caches, database buffer pools and in-memory API caches, because recency is a cheap, decent predictor of reuse. The interview version asks for `get` and `put` in O(1), which classically means a hash map for lookup plus a doubly linked list for recency: move a node to the head on every access and drop the tail on overflow.\n\nIn JavaScript, `Map` gives you most of that for free. It iterates in insertion order, so deleting and re-inserting a key on each access moves it to the end, and `map.keys().next().value` is the least recently used key. Refreshing recency that way is O(1), but eviction has a V8-specific catch: a `Map` keeps deleted entries in place until it rehashes, so `keys().next()` skips everything deleted since then, and with heavy eviction at large capacities that step slows noticeably. The subtle bugs are the same in both: `get` must refresh recency, `put` on an existing key must update the value and recency without evicting anything, capacity 0 must store nothing, and a miss must be distinguishable from a stored falsy value (`0`, `\"\"`, `null`).\n\nIn production, bound caches by memory rather than entry count (one entry can be a 10 MB response), add TTLs so stale data expires, and watch for stampedes where many callers miss the same key at once (cache the in-flight promise, not just the result). Plain LRU is also vulnerable to scans: a one-off pass over many keys flushes the genuinely hot set, which is why databases and operating systems use variants such as LRU-K, 2Q or CLOCK.",
      level: "advanced",
      estMinutes: 65,
      isMilestone: true,
      webRefs: [
        { label: "MDN: Map", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map", kind: "docs" },
        { label: "Wikipedia: Cache replacement policies", url: "https://en.wikipedia.org/wiki/Cache_replacement_policies", kind: "article" },
        { label: "isaacs/node-lru-cache", url: "https://github.com/isaacs/node-lru-cache", kind: "repo" },
      ],
      video: {
        title: "LRU Cache - Twitch Interview Question - Leetcode 146",
        channel: "NeetCode",
        url: "https://www.youtube.com/watch?v=7ABFKPK2hD4",
        videoId: "7ABFKPK2hD4",
        durationLabel: "17:49",
      },
      alternateVideos: [
        {
          title: "Implement LRU cache in JavaScript | Flipkart's frontend interview question",
          channel: "Learnersbucket",
          url: "https://www.youtube.com/watch?v=NmhGrl5ge4A",
          videoId: "NmhGrl5ge4A",
          durationLabel: "17:50",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `class LRUCache` with a fixed capacity.\n\n- `constructor(capacity)`.\n- `get(key)` returns the stored value and marks the key as most recently used, or returns `-1` if the key isn't present.\n- `put(key, value)` inserts or updates the key and marks it as most recently used. If the cache now holds more than `capacity` keys, evict the least recently used one.\n- Both operations must be O(1) on average: one test performs over 100,000 operations on a cache holding 50,000 keys.\n- Keys are compared like `Map` keys (so `1` and `\"1\"` are different keys), and stored values may be falsy.\n- A capacity of `0` stores nothing.\n\nA `Map` (which remembers insertion order) or a hash map plus a doubly linked list both work. The tests call `runLRU(capacity, ops)` with operations like `[\"put\", \"a\", 1]` and `[\"get\", \"a\"]` (plus `[\"use\", key]`, a `get` whose result isn't recorded) and compare the results of the `get` calls. Leave the driver as it is.",
        starterCode: `class LRUCache {
  /** @param {number} capacity */
  constructor(capacity) {
    // Your code here
  }

  /** @returns {any} the value, or -1 if the key is missing */
  get(key) {
    // Your code here
    return -1;
  }

  put(key, value) {
    // Your code here
  }
}

// ---- Test driver (leave as is) ----
// ops: ["put", key, value], ["get", key] or ["use", key] (a get whose result isn't recorded).
// Returns the results of the "get" calls in order.
function runLRU(capacity, ops) {
  const cache = new LRUCache(capacity);
  const results = [];
  for (const [op, key, value] of ops) {
    if (op === "put") cache.put(key, value);
    else if (op === "use") cache.get(key);
    else results.push(cache.get(key));
  }
  return results;
}
`,
        functionName: "runLRU",
        testCases: [
          {
            description: "the classic example: gets, then evictions of the least recently used key",
            args: [
              2,
              [["put", 1, 1], ["put", 2, 2], ["get", 1], ["put", 3, 3], ["get", 2], ["put", 4, 4], ["get", 1], ["get", 3], ["get", 4]],
            ],
            expected: [1, -1, -1, 3, 4],
          },
          {
            description: "get refreshes recency, so the other key is evicted",
            args: [2, [["put", "a", 1], ["put", "b", 2], ["get", "a"], ["put", "c", 3], ["get", "b"], ["get", "a"], ["get", "c"]]],
            expected: [1, -1, 1, 3],
          },
          {
            description: "put on an existing key updates it and refreshes recency without evicting",
            args: [2, [["put", "a", 1], ["put", "b", 2], ["put", "a", 10], ["put", "c", 3], ["get", "a"], ["get", "b"], ["get", "c"]]],
            expected: [10, -1, 3],
          },
          {
            description: "capacity 1 keeps only the latest key",
            args: [1, [["put", "a", 1], ["put", "b", 2], ["get", "a"], ["get", "b"]]],
            expected: [-1, 2],
            isEdgeCase: true,
          },
          {
            description: "capacity 0 stores nothing",
            args: [0, [["put", "a", 1], ["get", "a"]]],
            expected: [-1],
            isEdgeCase: true,
          },
          {
            description: "falsy values are stored and returned, not treated as misses",
            args: [3, [["get", "x"], ["put", "zero", 0], ["put", "empty", ""], ["put", "nothing", null], ["get", "zero"], ["get", "empty"], ["get", "nothing"]]],
            expected: [-1, 0, "", null],
            isEdgeCase: true,
          },
          {
            description: "keys are compared like Map keys: 1 and \"1\" are different",
            args: [2, [["put", 1, "number"], ["put", "1", "string"], ["get", 1], ["get", "1"]]],
            expected: ["number", "string"],
            isEdgeCase: true,
          },
          {
            description: "50,000 puts then 50,000 recency refreshes run fast, and eviction follows the refresh order",
            args: [
              50000,
              [
                ...Array.from({ length: 50000 }, (_, i) => ["put", i, i]),
                ...Array.from({ length: 50000 }, (_, i) => ["use", (i * 7919) % 50000]),
                ["put", 50000, 50000],
                ["put", 50001, 50001],
                ["get", 0],
                ["get", 7919],
                ["get", 15838],
                ["get", 50001],
              ],
            ],
            expected: [-1, -1, 15838, 50001],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "js-promise-all-from-scratch",
      moduleId: "fe-js-advanced",
      trackId: "frontend",
      title: "Implementing Promise.all From Scratch",
      summary:
        "Implementing `Promise.all` separates people who use promises from people who understand them, because the specification has more edges than the one-line description. It takes any iterable, not just an array, and iterates it once; it passes every element through `Promise.resolve`, so plain values and thenables are adopted; it fulfils with an array in input order regardless of settle order; it rejects with the first rejection in time and ignores everything after; and an empty iterable fulfils with `[]`. It returns a promise even when it could answer immediately, and it never cancels the inputs that lose.\n\nThe classic bugs are all bookkeeping. `results.push(value)` orders results by settle time. Counting completion with `results.length === n` breaks because assigning `results[2]` first makes `length` 3 while slots 0 and 1 are still holes. Resolving only when a counter reaches `n` without handling the empty case leaves the promise pending forever. Checking `instanceof Promise` instead of calling `Promise.resolve` treats thenables from other libraries or realms as plain values. And an `async` function that `await`s each input in turn waits in input order: it reports whichever rejection it reaches first rather than the earliest one, and leaves the others as unhandled rejections.\n\nThe spec version adds details worth knowing: it calls `this.resolve` on the constructor so subclasses work, subscribes through each input's own `then`, and keeps a `remaining` counter that starts at 1 and is decremented once after the loop, a trick that makes the empty-iterable case fall out naturally. The same counter-plus-slots pattern underlies `allSettled`, `any`, a concurrency-limited `pMap` and a DataLoader-style batcher, so getting it right pays off well beyond interviews.",
      level: "expert",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "ECMAScript spec: Promise.all", url: "https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise.all", kind: "spec" },
        { label: "MDN: Promise.all()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all", kind: "docs" },
        { label: "javascript.info: Promise API", url: "https://javascript.info/promise-api", kind: "article" },
        { label: "core-js: Promise.all implementation", url: "https://github.com/zloirock/core-js/blob/master/packages/core-js/modules/es.promise.all.js", kind: "repo" },
      ],
      video: {
        title: "Javascript Interview Questions ( 12 Polyfills ) - Promise(), Memoize(), Bind(), Reduce(), Map() etc🔥",
        channel: "RoadsideCoder",
        url: "https://www.youtube.com/watch?v=Th3rZjfKKhI",
        videoId: "Th3rZjfKKhI",
        durationLabel: "53:16",
        startSeconds: 2454,
        chapterLabel: "promise.all() polyfill",
      },
      alternateVideos: [
        {
          title: "Javascript Interview Questions ( Promises ) - Polyfills, Callbacks, Async/await, Output Based, etc",
          channel: "RoadsideCoder",
          url: "https://www.youtube.com/watch?v=HaJdoFp2OEc",
          videoId: "HaJdoFp2OEc",
          durationLabel: "1:07:24",
          startSeconds: 3654,
          chapterLabel: "Promise.all()",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `promiseAll(iterable)` with the semantics of `Promise.all`, without calling `Promise.all`, `allSettled`, `any` or `race`.\n\n- Return a promise.\n- Pass every element through `Promise.resolve`, so plain values and thenables work.\n- Fulfil with an array of the results in input order, whatever order they settle in.\n- Reject with the reason of the first input to reject, as soon as it rejects, without waiting for the others.\n- An empty iterable fulfils with `[]`.\n- Accept any iterable (arrays, Sets, generators) and iterate it only once.\n\nThe tests call `runAllScenario`, which builds inputs that settle after a given number of microtask ticks and reports how your promise settled (and, on rejection, how many inputs were still pending). Leave the driver as it is.",
        starterCode: `/**
 * @param {Iterable<any>} iterable
 * @returns {Promise<any[]>}
 */
function promiseAll(iterable) {
  // Your code here
}

// ---- Test driver (leave as is) ----
// Each spec becomes one input:
//   { ok: v, ticks: n }   a promise that fulfils with v after n microtask ticks
//   { err: r, ticks: n }  a promise that rejects with r after n microtask ticks
//   { value: v }          a plain, non-promise value
//   { thenable: v }       a non-promise object with a then() method that fulfils with v
async function runAllScenario(specs, asGenerator) {
  let pending = 0;
  const inputs = specs.map((spec) => {
    if ("value" in spec) return spec.value;
    if ("thenable" in spec) return { then: (onFulfilled) => onFulfilled(spec.thenable) };
    pending++;
    return new Promise((resolve, reject) => {
      let n = spec.ticks || 0;
      const step = () => {
        if (n-- > 0) {
          Promise.resolve().then(step);
          return;
        }
        pending--;
        if ("ok" in spec) resolve(spec.ok);
        else reject(spec.err);
      };
      step();
    });
  });
  const iterable = asGenerator ? (function* () { yield* inputs; })() : inputs;
  let result;
  try {
    result = promiseAll(iterable);
  } catch (e) {
    return { threwSynchronously: String((e && e.message) || e) };
  }
  if (!result || typeof result.then !== "function") return { notAPromise: true };
  try {
    return { status: "fulfilled", value: await result };
  } catch (reason) {
    return { status: "rejected", reason, stillPending: pending };
  }
}
`,
        functionName: "runAllScenario",
        testCases: [
          {
            description: "results are in input order, not settle order",
            args: [[{ ok: "a", ticks: 30 }, { ok: "b", ticks: 1 }, { ok: "c", ticks: 15 }]],
            expected: { status: "fulfilled", value: ["a", "b", "c"] },
          },
          {
            description: "plain values pass straight through",
            args: [[{ value: 1 }, { ok: 2, ticks: 3 }, { value: "three" }]],
            expected: { status: "fulfilled", value: [1, 2, "three"] },
          },
          {
            description: "an empty iterable fulfils with []",
            args: [[]],
            expected: { status: "fulfilled", value: [] },
            isEdgeCase: true,
          },
          {
            description: "rejects with the first rejection in time, without waiting for the rest",
            args: [[{ ok: "slow", ticks: 60 }, { err: "late", ticks: 40 }, { err: "first", ticks: 5 }]],
            expected: { status: "rejected", reason: "first", stillPending: 2 },
            isEdgeCase: true,
          },
          {
            description: "a rejection after everything else has fulfilled still rejects",
            args: [[{ ok: 1, ticks: 1 }, { err: "boom", ticks: 10 }]],
            expected: { status: "rejected", reason: "boom", stillPending: 0 },
          },
          {
            description: "thenables are adopted, not returned as objects",
            args: [[{ thenable: "t" }, { ok: "p", ticks: 2 }]],
            expected: { status: "fulfilled", value: ["t", "p"] },
            isEdgeCase: true,
          },
          {
            description: "accepts a one-shot iterable (a generator)",
            args: [[{ ok: 1, ticks: 2 }, { value: 2 }], true],
            expected: { status: "fulfilled", value: [1, 2] },
            isEdgeCase: true,
          },
          {
            description: "falsy results keep their slots",
            args: [[{ ok: 0, ticks: 3 }, { value: null }, { ok: "", ticks: 1 }, { ok: false, ticks: 2 }]],
            expected: { status: "fulfilled", value: [0, null, "", false] },
            isEdgeCase: true,
          },
        ],
      },
    },
  ],
} satisfies Module;
