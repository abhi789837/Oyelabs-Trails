import type { Module } from "@/types/curriculum";

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
            "The thrown error rejects the promise returned by `then`, which nothing handles, so it's reported as an unhandled rejection",
            "`handled: in success handler` is logged",
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
  ],
} satisfies Module;
