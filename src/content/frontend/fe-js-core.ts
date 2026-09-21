import type { Module } from "@/types/curriculum";

export default {
  id: "fe-js-core",
  trackId: "frontend",
  name: "JavaScript Core",
  description:
    "The execution model behind every line of JavaScript, one Namaste JavaScript (Season 1) episode per concept: execution contexts, hoisting, scope, closures, the event loop and V8's compiler pipeline. Aimed at engineers who write JavaScript daily and want to predict exactly what it will do, including the interview gotchas.",
  refs: [
    { label: "MDN: JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", kind: "docs" },
    { label: "javascript.info: The Modern JavaScript Tutorial", url: "https://javascript.info/", kind: "article" },
    { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
    { label: "sudheerj: JavaScript Interview Questions", url: "https://github.com/sudheerj/javascript-interview-questions", kind: "interview-prep" },
  ],
  topics: [
    {
      id: "js-execution-context",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "How JavaScript Works & Execution Context",
      summary:
        "Every piece of JavaScript runs inside an execution context: the record of which code is running, which variables it can see and what `this` is. When a script starts, the engine creates the global execution context in two passes. The creation (memory) phase instantiates every declaration before a single line runs: `var` bindings start as `undefined`, function declarations get their complete function object, and `let`/`const`/`class` bindings are created but left uninitialised. Then the execution phase runs the code top to bottom, assigning values and creating a new context for every function call.\n\nThat two-phase model explains hoisting, the temporal dead zone, scope and closures, so it pays to think in it rather than in \"lines run in order\". In spec terms a context holds a LexicalEnvironment and a VariableEnvironment (plus its realm, the running function and the script or module), which is what Namaste's \"memory component\" and \"code component\" sketch.\n\nJavaScript is synchronous and single-threaded per agent: one call stack, one statement at a time. Timers, network I/O and events come from the host (browser or Node), which queues callbacks for later; the language never runs two pieces of your code in parallel on one thread. The upside is no data races on shared objects. The cost is that long synchronous work blocks input and rendering, which is why heavy computation belongs in a Web Worker, a separate agent with its own contexts that communicates by messages. One wrinkle: module code is always strict and has its own scope, so a top-level `var` doesn't create a global property and top-level `this` is `undefined`.",
      level: "beginner",
      estMinutes: 20,
      webRefs: [
        { label: "MDN: JavaScript execution model", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model", kind: "docs" },
        { label: "ECMAScript spec: Execution Contexts", url: "https://tc39.es/ecma262/#sec-execution-contexts", kind: "spec" },
        { label: "javascript.info: Recursion and stack (execution context)", url: "https://javascript.info/recursion", kind: "article" },
        { label: "sudheerj: JavaScript Interview Questions", url: "https://github.com/sudheerj/javascript-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "How JavaScript Works 🔥& Execution Context | Namaste JavaScript Ep.1",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=ZvbzSrg0afE",
        videoId: "ZvbzSrg0afE",
        durationLabel: "4:54",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-execution-context-q1",
          prompt: "What does this log?\n\n```js\nconsole.log(n);\nconsole.log(square);\nvar n = 2;\nfunction square(x) {\n  return x * x;\n}\n```",
          options: [
            "`undefined`, then the `square` function",
            "A ReferenceError on the first line",
            "`2`, then the `square` function",
            "`undefined`, then `undefined`",
          ],
          correctIndex: 0,
          explanation:
            "The creation phase stores `n` as `undefined` and `square` as the complete function before any line runs. Only the execution phase assigns `2`, so `n` isn't 2 yet, while function declarations (unlike `var`) are fully initialised up front.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-execution-context-q2",
          prompt: "JavaScript is described as synchronous and single-threaded. Which statement is accurate?",
          options: [
            "One call stack runs one piece of your code at a time; the host (browser or Node) handles timers and I/O and queues their callbacks",
            "The engine starts a new thread for each `setTimeout` so the callback can run in parallel",
            "`async` functions run on a background thread until they reach an `await`",
            "Promises run their `.then` callbacks in parallel with the code that created them",
          ],
          correctIndex: 0,
          explanation:
            "Your code runs on one thread per agent; concurrency comes from the host doing work outside the engine and queueing callbacks, which run only when the stack is free. Neither `async` functions nor promises add threads; that takes a Worker.",
        },
        {
          id: "js-execution-context-q3",
          prompt: "During the creation phase of an execution context, what gets set up for each declaration? (Select all that apply.)",
          options: [
            "`var x = 5` creates `x` holding `undefined`",
            "`function f() {}` creates `f` holding the complete function",
            "`let y = 1` creates `y` but leaves it uninitialised until its line runs",
            "`const z = compute()` calls `compute()` early so `z` is ready",
            "`var g = function () {}` stores the function in `g` straight away",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Declarations are instantiated but no expressions are evaluated: `var` gets `undefined`, function declarations get their function, and `let`/`const` stay uninitialised (the TDZ). Initialisers such as `compute()` or a function expression assigned to a `var` only run in the execution phase.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-execution-context-q4",
          prompt: "A click handler runs a synchronous loop that takes 2 seconds. What happens during those 2 seconds?",
          options: [
            "Main-thread work stops: the page doesn't re-render, and other clicks and timers wait until the loop ends",
            "The browser moves the loop to a background thread so the page stays responsive",
            "A second click interrupts the loop, runs its handler, then the loop resumes",
            "Timers keep firing on schedule because they run outside the call stack",
          ],
          correctIndex: 0,
          explanation:
            "The loop owns the only call stack, so the event loop can't start another task or render a frame until it returns; clicks and timer callbacks just queue up. (Compositor-driven scrolling or CSS transforms may keep moving, but no JavaScript runs.) Chunk the work or move it to a Worker.",
        },
        {
          id: "js-execution-context-q5",
          prompt: "What does this log?\n\n```js\nvar x = 1;\nfunction f() {\n  console.log(x);\n  var x = 2;\n}\nf();\n```",
          options: ["`undefined`", "`1`", "`2`", "A ReferenceError"],
          correctIndex: 0,
          explanation:
            "Calling `f` creates a new execution context whose creation phase declares a local `x` as `undefined`, shadowing the global one for the whole function body. It isn't `1` because lookup finds the local binding first, even though its assignment hasn't run yet.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-execution-context-q6",
          prompt: "Compared with a classic `<script>`, which is true of top-level code in `<script type=\"module\">`?",
          options: [
            "Top-level `this` is `undefined`, and a top-level `var` doesn't create a `window` property",
            "A top-level `var` becomes a `window` property, exactly as in a classic script",
            "Module code runs in sloppy mode unless it starts with `\"use strict\"`",
            "Each module gets its own thread and call stack",
          ],
          correctIndex: 0,
          explanation:
            "Modules are always strict and have their own module scope, so their top-level declarations aren't global-object properties and `this` is `undefined`. They still share the page's single thread and call stack.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "js-call-stack",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "How JS Code is Executed & the Call Stack",
      summary:
        "The call stack is how the engine keeps track of execution contexts: the global context is pushed first, every function call pushes a new context, and `return` pops it, handing control back to whatever is underneath. The same structure goes by execution context stack, program stack, control stack, runtime stack or machine stack. Because there's only one, whatever is on it runs to completion. The event loop can only dispatch a queued callback once the stack is empty, which is why a callback's stack trace doesn't include the code that scheduled it (DevTools stitches those \"async\" frames back together for you).\n\nThe stack is finite. In Node 24 (V8 13.6) a trivial recursive function gets about 12,500 frames before `RangeError: Maximum call stack size exceeded`, and bigger frames mean fewer. ES2015 specified proper tail calls in strict mode, but only Safari's JavaScriptCore ships them, so tail recursion is not a way around the limit in Chrome, Node or Firefox. When depth is controlled by data (a nested JSON payload, a DOM tree, a linked list), turn the recursion into a loop over an explicit array stack: the state moves to the heap, which is limited by memory rather than by stack size.\n\nTwo gotchas catch experienced engineers. Built-ins can recurse too: in V8, `Array.prototype.flat(Infinity)` throws a RangeError on arrays nested about ten thousand levels deep. And arguments live on the stack, so `arr.push(...huge)` or `Math.max(...huge)` with a few hundred thousand elements overflows it with no recursion at all.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "MDN: Call stack", url: "https://developer.mozilla.org/en-US/docs/Glossary/Call_stack", kind: "docs" },
        { label: "javascript.info: Recursion and stack", url: "https://javascript.info/recursion", kind: "article" },
        { label: "MDN: Too much recursion (RangeError)", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Too_much_recursion", kind: "docs" },
        { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
      ],
      video: {
        title: "How JavaScript Code is executed? ❤️& Call Stack | Namaste JavaScript Ep. 2",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=iLWTnMzWtj4",
        videoId: "iLWTnMzWtj4",
        durationLabel: "23:41",
      },
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `flattenDeep(input)`. It returns a new array containing every non-array value from `input`, at any depth, in left-to-right order.\n\n- Don't use recursion or `Array.prototype.flat`: one test nests 100,000 levels deep, which overflows the call stack (in V8 even `flat(Infinity)` throws a RangeError at around 10,000 levels). Keep your own stack in an array instead.\n- Another test has 200,000 top-level elements, so stay roughly linear, and don't spread a huge array into a call such as `push(...arr)`: every argument goes on the call stack.\n- Empty arrays contribute nothing. Everything else is kept as is, including `0`, `null`, `false` and objects (don't look inside objects for arrays).\n- Don't mutate `input`.\n- If `input` isn't an array, throw a `TypeError`.\n\nThe tests call `checkFlatten`, which builds the very deep and very wide inputs and reports thrown errors by name. Leave the driver as it is.",
        starterCode:
          "/**\n * Flattens arbitrarily nested arrays without using the call stack for nesting.\n * @param {unknown[]} input\n * @returns {unknown[]}\n */\nfunction flattenDeep(input) {\n  // Your code here\n}\n\n// ---- Test driver (leave as is) ----\nfunction checkFlatten(input) {\n  try {\n    if (input && input.deep) {\n      let nested = [1];\n      for (let i = 0; i < input.deep; i++) nested = [nested];\n      return flattenDeep([0, nested, 2]);\n    }\n    if (input && input.wide) {\n      const wide = Array.from({ length: input.wide }, (_, i) => [i, [i]]);\n      const out = flattenDeep(wide);\n      return { length: out.length, first: out[0], last: out[out.length - 1] };\n    }\n    if (input && input.mutationCheck) {\n      const before = JSON.stringify(input.mutationCheck);\n      const result = flattenDeep(input.mutationCheck);\n      return { result, unchanged: JSON.stringify(input.mutationCheck) === before };\n    }\n    return flattenDeep(input);\n  } catch (err) {\n    return { error: err.name };\n  }\n}\n",
        functionName: "checkFlatten",
        testCases: [
          { description: "an already flat array comes back as a copy", args: [[1, 2, 3]], expected: [1, 2, 3] },
          { description: "mixed nesting keeps left-to-right order", args: [[1, [2, [3, [4]], 5], 6]], expected: [1, 2, 3, 4, 5, 6] },
          { description: "empty arrays at any depth disappear", args: [[[], [[]], 1, [[], [2]]]], expected: [1, 2], isEdgeCase: true },
          {
            description: "falsy values and objects are kept, and objects aren't searched",
            args: [[0, [null, [false, ""]], { a: [1] }]],
            expected: [0, null, false, "", { a: [1] }],
          },
          { description: "the input array isn't mutated", args: [{ mutationCheck: [1, [2, [3]]] }], expected: { result: [1, 2, 3], unchanged: true } },
          { description: "100,000 levels of nesting don't overflow the stack", args: [{ deep: 100000 }], expected: [0, 1, 2], isEdgeCase: true },
          {
            description: "200,000 top-level elements stay fast and don't overflow the stack",
            args: [{ wide: 200000 }],
            expected: { length: 400000, first: 0, last: 199999 },
            isEdgeCase: true,
          },
          { description: "a non-array input throws a TypeError", args: ["oops"], expected: { error: "TypeError" }, isEdgeCase: true },
        ],
      },
    },
    {
      id: "js-hoisting",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "Hoisting (variables & functions)",
      summary:
        "Hoisting isn't the engine moving lines to the top. It's the visible effect of the creation phase: before any code in a scope runs, every declaration in it is instantiated. `var` bindings are initialised to `undefined`, function declarations are initialised with the whole function (so they can be called above the line that defines them), and `let`, `const` and `class` bindings are created but left uninitialised, so touching them early throws instead of quietly yielding `undefined`. A function expression or arrow function follows the rules of the variable holding it: `var f = function () {}` is `undefined` before its line, and calling it throws a TypeError, not a ReferenceError.\n\nFunction-declaration hoisting is genuinely useful: it lets you put the high-level flow at the top of a file with helpers below, and it makes mutual recursion trivial. `var` hoisting, by contrast, mostly produces silent bugs, which is why modern code uses `const`/`let` with lint rules such as `no-use-before-define`. Prefer `const fn = () => {}` when you want the TDZ to catch calls made before initialisation.\n\nThe gotchas are all about names. A local `var` or function declaration shadows the outer binding for the entire function body, including lines above it, even inside an `if (false)` block that never runs. When a function declaration and a `var` share a name, the function wins in the creation phase and a later assignment overwrites it; two function declarations with the same name mean the last one wins everywhere. And function declarations inside blocks depend on the mode: block-scoped in strict code, but in sloppy scripts Annex B also creates a function-scoped binding that's only assigned when the block runs.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "MDN: Hoisting", url: "https://developer.mozilla.org/en-US/docs/Glossary/Hoisting", kind: "docs" },
        { label: "MDN: var (hoisting)", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var", kind: "docs" },
        { label: "javascript.info: The old \"var\"", url: "https://javascript.info/var", kind: "article" },
        { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Hoisting in JavaScript 🔥(variables & functions) | Namaste JavaScript Ep. 3",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=Fnlnw8uY6jo",
        videoId: "Fnlnw8uY6jo",
        durationLabel: "19:10",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-hoisting-q1",
          prompt:
            "What does this log?\n\n```js\ngetName();\nconsole.log(x);\nconsole.log(getName);\nvar x = 7;\nfunction getName() {\n  console.log(\"Namaste\");\n}\n```",
          options: [
            "`Namaste`, `undefined`, then the `getName` function",
            "A TypeError, because `getName` is called before it's defined",
            "`Namaste`, `7`, then the `getName` function",
            "`Namaste`, then a ReferenceError for `x`",
          ],
          correctIndex: 0,
          explanation:
            "The creation phase stores the whole `getName` function and sets `x` to `undefined`, so the call works and `x` logs `undefined`. `7` is only assigned when the execution phase reaches that line.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-hoisting-q2",
          prompt: "What does this log?\n\n```js\nconsole.log(typeof foo);\nvar foo = 1;\nfunction foo() {}\nconsole.log(typeof foo);\n```",
          options: [
            "`\"function\"`, then `\"number\"`",
            "`\"undefined\"`, then `\"number\"`",
            "`\"number\"`, then `\"number\"`",
            "`\"function\"`, then `\"function\"`",
          ],
          correctIndex: 0,
          explanation:
            "In the creation phase the function declaration initialises `foo`, and the `var` declaration doesn't reset an existing binding, so it starts as a function. The assignment `foo = 1` runs in the execution phase and replaces it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-hoisting-q3",
          prompt:
            "What does this log?\n\n```js\nvar a = 1;\nfunction b() {\n  a = 10;\n  return;\n  function a() {}\n}\nb();\nconsole.log(a);\n```",
          options: ["`1`", "`10`", "`undefined`", "A TypeError"],
          correctIndex: 0,
          explanation:
            "The declaration `function a() {}` is hoisted to the top of `b`, creating a local `a`, so `a = 10` reassigns that local binding even though the declaration sits after the `return`. The global `a` is never touched.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-hoisting-q4",
          prompt: "What happens?\n\n```js\nsayHi();\nvar sayHi = function () {\n  console.log(\"hi\");\n};\n```",
          options: [
            "TypeError: `sayHi` is not a function",
            "ReferenceError: `sayHi` is not defined",
            "It logs `hi`",
            "Nothing: the call returns `undefined` silently",
          ],
          correctIndex: 0,
          explanation:
            "`sayHi` is hoisted as a `var`, so it exists but holds `undefined` until the assignment runs, and calling `undefined` is a TypeError. A ReferenceError would mean the name doesn't exist in any scope.",
        },
        {
          id: "js-hoisting-q5",
          prompt: "Which of these calls succeed? (Select all that apply.)",
          options: [
            "Calling a function declaration on a line above its definition",
            "Calling a function stored by `var f = function () {}` on a line above that assignment",
            "Calling a `const` arrow function on a line above its declaration",
            "Two function declarations that call each other, whichever is defined first",
            "Inside `function run() { helper(); }`, calling `const helper = () => {}` when `run()` is only invoked after the `const` line",
          ],
          correctIndex: 0,
          correctIndices: [0, 3, 4],
          explanation:
            "Function declarations are fully initialised up front, and for `let`/`const` what matters is when the access happens, not where the code sits: `run` reads `helper` after initialisation. The `var` version holds `undefined` (TypeError) and the early `const` access is in the TDZ (ReferenceError).",
        },
        {
          id: "js-hoisting-q6",
          prompt: "What happens?\n\n```js\nconst p = new Person();\nclass Person {}\n```",
          options: [
            "ReferenceError: Cannot access 'Person' before initialization",
            "TypeError: Person is not a constructor",
            "It works, because class declarations hoist like function declarations",
            "`p` is `undefined`",
          ],
          correctIndex: 0,
          explanation:
            "Class declarations are hoisted like `let`: the binding exists but stays uninitialised until the declaration runs. Only function declarations are initialised during the creation phase.",
        },
        {
          id: "js-hoisting-q7",
          prompt:
            "In a classic (non-strict) script, what does this log?\n\n```js\nconsole.log(typeof f);\nif (true) {\n  function f() {}\n}\nconsole.log(typeof f);\n```",
          options: [
            "`\"undefined\"`, then `\"function\"`",
            "`\"function\"`, then `\"function\"`",
            "`\"undefined\"`, then `\"undefined\"`",
            "A ReferenceError, then `\"function\"`",
          ],
          correctIndex: 0,
          explanation:
            "Under Annex B's web-compatibility rules, a function declaration in a block in sloppy code also creates an outer `var`-like `f`, initialised to `undefined` and assigned only when the block's declaration is evaluated. In strict mode `f` is block-scoped, so both lines log `\"undefined\"`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-hoisting-q8",
          prompt: "Which statement about `let` and `const` is accurate?",
          options: [
            "They're hoisted: the binding exists from the start of its scope but is uninitialised, so reading it early throws a ReferenceError",
            "They aren't hoisted at all; the engine only creates them when it reaches their line",
            "They're hoisted and initialised to `undefined`, just like `var`",
            "They're hoisted to the enclosing function, ignoring blocks",
          ],
          correctIndex: 0,
          explanation:
            "The early ReferenceError is itself the evidence: an inner `let x` shadows an outer `x` from the top of its block, even before its line runs. That uninitialised window is the temporal dead zone.",
        },
        {
          id: "js-hoisting-q9",
          prompt:
            "What does this log?\n\n```js\nvar x = \"global\";\nfunction show() {\n  console.log(x);\n  if (false) {\n    var x = \"local\";\n  }\n}\nshow();\n```",
          options: ["`undefined`", "`\"global\"`", "`\"local\"`", "A ReferenceError"],
          correctIndex: 0,
          explanation:
            "`var` ignores blocks and is hoisted to the top of `show` whether or not the `if` body ever runs, so a local `x` (still `undefined`) shadows the global. Declarations are found when the function is parsed, not when control reaches them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-hoisting-q10",
          prompt:
            "In a classic script, what does this log?\n\n```js\nfunction greet() {\n  return \"first\";\n}\nconsole.log(greet());\nfunction greet() {\n  return \"second\";\n}\n```",
          options: ["`\"second\"`", "`\"first\"`", "A SyntaxError for the duplicate declaration", "`undefined`"],
          correctIndex: 0,
          explanation:
            "Both declarations are processed in the creation phase, in order, so the second overwrites the first before `console.log` runs. Duplicates are allowed in scripts and function bodies; at a module's top level function declarations are lexical, and the duplicate would be a SyntaxError.",
        },
      ],
    },
  ],
} satisfies Module;
