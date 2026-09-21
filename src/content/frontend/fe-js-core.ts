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
    {
      id: "js-functions-variable-env",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "How Functions Work & the Variable Environment",
      summary:
        "Every call to a function creates a brand-new execution context with its own environment: parameters, the `arguments` object (for non-arrow functions), local `var`/`let`/`const` bindings and inner function declarations, all instantiated before the body runs. That's why two functions can each have a local `x` without interfering, why recursive calls each keep their own locals, and why a function's locals vanish when its context is popped off the call stack, unless an inner function still references them (a closure).\n\nArguments are passed by value, but for objects the value is a reference: mutating a parameter's properties is visible to the caller, reassigning the parameter isn't. Prefer rest parameters to `arguments`. In a sloppy function with a simple parameter list, `arguments` is mapped, so writing `arguments[0]` also changes the first parameter, but only for arguments that were actually passed. Strict mode, default values, rest or destructured parameters all make it an unmapped copy, and arrow functions have no `arguments` of their own (they see the enclosing function's).\n\nA subtle one: when a parameter list contains default values, the parameters get their own scope, separate from the body's `var`s, so a default closure such as `a = () => x` can't see a `var x` declared in the body. On the performance side, V8 keeps locals that no inner function captures in registers or the stack frame and moves only captured variables into a heap-allocated context. A direct `eval` could reference any name, so it forces every local into that context.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "MDN: Functions", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions", kind: "docs" },
        { label: "MDN: The arguments object", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments", kind: "docs" },
        { label: "javascript.info: Functions", url: "https://javascript.info/function-basics", kind: "article" },
        { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
      ],
      video: {
        title: "How functions work in JS ❤️ & Variable Environment | Namaste JavaScript Ep. 4",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=gSDncyuGw0s",
        videoId: "gSDncyuGw0s",
        durationLabel: "21:45",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-functions-variable-env-q1",
          prompt:
            "What does this log?\n\n```js\nvar x = 1;\na();\nb();\nconsole.log(x);\n\nfunction a() {\n  var x = 10;\n  console.log(x);\n}\nfunction b() {\n  var x = 100;\n  console.log(x);\n}\n```",
          options: ["`10`, `100`, `1`", "`10`, `100`, `100`", "`1`, `1`, `1`", "`10`, `10`, `1`"],
          correctIndex: 0,
          explanation:
            "Each call gets its own execution context with its own `x`, found before the global one. When `a` and `b` return, their contexts are popped and the global `x` was never touched.",
        },
        {
          id: "js-functions-variable-env-q2",
          prompt:
            "What does this log?\n\n```js\nfunction count(n) {\n  var label = \"n=\" + n;\n  if (n > 0) count(n - 1);\n  console.log(label);\n}\ncount(2);\n```",
          options: ["`n=0`, `n=1`, `n=2`", "`n=2`, `n=1`, `n=0`", "`n=0` three times", "`n=2` three times"],
          correctIndex: 0,
          explanation:
            "Each recursive call has its own `label`, so the inner calls can't overwrite the outer ones. The logs run as contexts pop off the stack, deepest first, which reverses the call order.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-functions-variable-env-q3",
          prompt:
            "In a classic (non-strict) script, which calls return `99`? (Select all that apply.)\n\n```js\nfunction f(a) { arguments[0] = 99; return a; }\nfunction g(a) { \"use strict\"; arguments[0] = 99; return a; }\nfunction h(a = 0) { arguments[0] = 99; return a; }\nfunction k(a, b) { arguments[1] = 99; return b; }\n```",
          options: ["`f(1)`", "`g(1)`", "`h(1)`", "`k(1)`", "`k(1, 2)`"],
          correctIndex: 0,
          correctIndices: [0, 4],
          explanation:
            "`arguments` is mapped to the parameters only in sloppy functions with a simple parameter list, and only for arguments actually passed, so `k(1)` returns `undefined`. Strict mode (`g`) and a default value (`h`) make `arguments` an unmapped copy, so they return 1.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-functions-variable-env-q4",
          prompt:
            "What does this log?\n\n```js\nvar x = 1;\nfunction f(a = () => x) {\n  var x = 2;\n  return a();\n}\nconsole.log(f());\n```",
          options: ["`1`", "`2`", "`undefined`", "A ReferenceError"],
          correctIndex: 0,
          explanation:
            "Because the parameter list has a default, the parameters live in their own scope and the body's `var x` gets a separate environment. The arrow closes over the parameter scope, whose parent is the global scope, so it finds `x = 1`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-functions-variable-env-q5",
          prompt:
            "What does this log?\n\n```js\nfunction outer() {\n  const inner = () => arguments[0];\n  return inner(\"inner\");\n}\nconsole.log(outer(\"outer\"));\n```",
          options: ["`\"outer\"`", "`\"inner\"`", "`undefined`", "A ReferenceError: `arguments` is not defined"],
          correctIndex: 0,
          explanation:
            "Arrow functions have no `arguments` binding of their own, so `arguments` resolves through the scope chain to `outer`'s. Use a rest parameter (`(...args) => args[0]`) when an arrow needs its own arguments.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-functions-variable-env-q6",
          prompt: "When a call to `a()` returns, what happens to its execution context and its local `x`?",
          options: [
            "The context is popped off the call stack, and `x` becomes collectable unless a closure still references it",
            "`x` is kept until the page reloads, in case `a` is called again",
            "The context stays on the stack until the global code finishes",
            "`x` is copied onto the global object so later calls can reuse it",
          ],
          correctIndex: 0,
          explanation:
            "Returning pops the context; the next call starts from scratch. `x` only outlives the call if an inner function that references it is still reachable, which is exactly what a closure is.",
        },
        {
          id: "js-functions-variable-env-q7",
          prompt: "What is `f.length`?\n\n```js\nfunction f(a, b = 2, ...rest) {}\n```",
          options: ["`1`", "`2`", "`3`", "`0`"],
          correctIndex: 0,
          explanation:
            "`length` counts only the parameters before the first one with a default value, and a rest parameter never counts. Auto-currying helpers that rely on `fn.length` quietly misbehave with signatures like this.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-functions-variable-env-q8",
          prompt:
            "What does this log?\n\n```js\nfunction update(obj, num) {\n  obj.count++;\n  num++;\n  obj = { count: 100 };\n}\nconst o = { count: 1 };\nlet n = 1;\nupdate(o, n);\nconsole.log(o.count, n);\n```",
          options: ["`2 1`", "`100 2`", "`2 2`", "`1 1`"],
          correctIndex: 0,
          explanation:
            "Arguments are passed by value, and the value of `o` is a reference, so `obj.count++` mutates the caller's object. Reassigning `obj` and incrementing `num` only change the local bindings in `update`'s context.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-functions-variable-env-q9",
          prompt:
            "In V8, which local variables are allocated in a heap context object rather than in the stack frame or registers? (Select all that apply.)",
          options: [
            "A local that an inner function (closure) references",
            "Every local of a function that contains a direct `eval(...)` call",
            "Every `const` that holds an object",
            "Any local whose value is larger than a machine word",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "V8 resolves scopes at parse time and context-allocates only variables that might be read outside the frame: captured ones, or all of them when a direct `eval` could reference any name. Objects always live on the heap; the question is where the binding itself lives.",
        },
      ],
    },
    {
      id: "js-window-this",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "Shortest JS Program: `window` & the `this` Keyword",
      summary:
        "Even an empty file creates a global execution context, a global object and a top-level `this`. In browsers the global object is `window` (strictly a WindowProxy, also reachable as `self` and `frames`), in Web Workers it's `self`, and in Node it's `global`. ES2020's `globalThis` is the portable name for all of them, and it's what library code should use.\n\nWhat `this` is at the top level depends on the kind of code, not the platform: in a classic browser script it's the global object, in any ES module it's `undefined`, and in a Node CommonJS file it's `module.exports`. In a plain function call it's the global object in sloppy mode and `undefined` in strict mode, while arrow functions inherit `this` from where they're defined. Top-level `var` and function declarations in classic scripts become properties of the global object (non-configurable ones, so `delete window.x` fails). Top-level `let`, `const` and `class` go into a separate declarative record, the \"Script\" scope in DevTools, which every classic script on the page can read but which isn't on `window`.\n\nThat difference matters because the global object is crowded. `window.name` is an accessor property, so `var name = 42` at the top level of a classic script calls its setter and leaves `name` as the string `\"42\"`, while `let name = 42` shadows it cleanly. Elements with an `id` also appear as named properties on `window`. Treat the global scope as shared territory, keep your code in modules, and reach for `globalThis` only when you really mean the global.",
      level: "beginner",
      estMinutes: 25,
      webRefs: [
        { label: "MDN: this", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this", kind: "docs" },
        { label: "MDN: globalThis", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis", kind: "docs" },
        { label: "javascript.info: Global object", url: "https://javascript.info/global-object", kind: "article" },
        { label: "sudheerj: JavaScript Interview Questions", url: "https://github.com/sudheerj/javascript-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "SHORTEST JS Program 🔥window & this keyword | Namaste JavaScript Ep. 5",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=QCRpVw2KXf8",
        videoId: "QCRpVw2KXf8",
        durationLabel: "8:33",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-window-this-q1",
          prompt:
            "In a classic browser `<script>`, what does this log?\n\n```js\nvar a = 10;\nlet b = 20;\nfunction c() {}\nconsole.log(window.a, window.b, typeof window.c);\n```",
          options: ["`10 undefined \"function\"`", "`10 20 \"function\"`", "`undefined undefined \"undefined\"`", "`10 20 \"undefined\"`"],
          correctIndex: 0,
          explanation:
            "Top-level `var` and function declarations in a classic script become properties of the global object. `let b` lives in the global declarative record: visible to every classic script as `b`, but not as `window.b`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-window-this-q2",
          prompt: "What does `console.log(this)` print at the top level of a `<script type=\"module\">`?",
          options: ["`undefined`", "The `window` object", "An empty object `{}`", "The module's namespace object"],
          correctIndex: 0,
          explanation:
            "Module code is always strict and top-level `this` in a module is `undefined`. It's only the global object at the top level of a classic script.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-window-this-q3",
          prompt:
            "What does this log at the top level of a Node.js CommonJS file (`app.cjs`)?\n\n```js\nconsole.log(this === module.exports, this === globalThis);\n```",
          options: ["`true false`", "`false true`", "`false false`", "`true true`"],
          correctIndex: 0,
          explanation:
            "Node wraps each CommonJS file in a function and calls it with `this` set to `module.exports`. The global object is `globalThis` (alias `global`), which is a different object.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-window-this-q4",
          prompt: "Which name refers to the global object in browsers, Web Workers and Node alike?",
          options: ["`globalThis`", "`window`", "`self`", "`global`"],
          correctIndex: 0,
          explanation:
            "`window` doesn't exist in workers or Node, `self` isn't defined in Node, and `global` is Node-only. `globalThis` was standardised in ES2020 to end exactly this guessing game.",
        },
        {
          id: "js-window-this-q5",
          prompt: "At the top level of a classic browser script, what does this log?\n\n```js\nvar name = 42;\nconsole.log(typeof name);\n```",
          options: ["`\"string\"`", "`\"number\"`", "`\"undefined\"`", "It throws, because `name` is read-only"],
          correctIndex: 0,
          explanation:
            "`window` already has an accessor property `name`, so the global `var` reuses it and the assignment calls its setter, which stores the string `\"42\"`. With `let name = 42` you'd get a separate binding that shadows `window.name`, and `typeof` would be `\"number\"`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-window-this-q6",
          prompt:
            "In a classic browser script, what does this log?\n\n```js\nfunction sloppy() { return this; }\nfunction strict() { \"use strict\"; return this; }\nconsole.log(sloppy() === window, strict());\n```",
          options: ["`true undefined`", "`true true`", "`false undefined`", "`true`, then a TypeError"],
          correctIndex: 0,
          explanation:
            "A plain call passes no `this`. Sloppy functions substitute the global object; strict functions keep it as `undefined`, which is why extracting a method and calling it bare throws in strict code instead of silently touching `window`.",
        },
      ],
    },
    {
      id: "js-undefined-vs-not-defined",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "`undefined` vs Not Defined",
      summary:
        "`undefined` and \"not defined\" sound alike but live at different layers. `undefined` is a real value, the only value of the Undefined type, which JavaScript hands out whenever something exists but has no value yet: a hoisted `var` before its assignment, a missing argument, a missing property, a function that returns nothing. \"Not defined\" is a ReferenceError: the engine walked the whole scope chain and found no binding with that name. A third case sits between them: a `let`/`const` in its temporal dead zone exists but throws \"Cannot access before initialization\".\n\nBecause JavaScript is dynamically typed, any variable can hold any value, so the convention is that the language produces `undefined` and your code uses `null` for intentional absence. The difference is observable: default parameters kick in for `undefined` but not for `null`, `JSON.stringify` drops `undefined` properties but keeps `null` ones, and `??` and `?.` treat both as missing. Don't assign `undefined` by hand, and remember that `obj.key === undefined` can't tell a missing property from one explicitly set to `undefined`; use `Object.hasOwn(obj, key)` or `in` for that.\n\nThe gotchas: `typeof undeclaredName` returns `\"undefined\"` without throwing (the classic feature-detection trick), but `typeof` on a TDZ binding does throw. Assigning to an undeclared name in sloppy mode silently creates a global property, while strict mode and modules throw a ReferenceError. And `undefined` is a read-only global property, not a keyword, so a local variable can still be named `undefined`, which is why older minified code writes `void 0`.",
      level: "beginner",
      estMinutes: 25,
      webRefs: [
        { label: "MDN: undefined", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined", kind: "docs" },
        { label: "MDN: ReferenceError: \"x\" is not defined", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Not_defined", kind: "docs" },
        { label: "javascript.info: Data types (null and undefined)", url: "https://javascript.info/types", kind: "article" },
        { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
      ],
      video: {
        title: "undefined vs not defined in JS 🤔 | Namaste JavaScript Ep. 6",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=B7iF6G3EyIk",
        videoId: "B7iF6G3EyIk",
        durationLabel: "11:01",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-undefined-vs-not-defined-q1",
          prompt: "What does this log?\n\n```js\nconsole.log(a);\nvar a = 7;\nconsole.log(b);\n```",
          options: [
            "`undefined`, then ReferenceError: b is not defined",
            "`7`, then `undefined`",
            "`undefined`, then `undefined`",
            "ReferenceError: a is not defined",
          ],
          correctIndex: 0,
          explanation:
            "`a` was hoisted and holds `undefined` until its assignment runs. `b` is declared nowhere, so resolving it fails the whole scope chain and throws.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-undefined-vs-not-defined-q2",
          prompt: "What does this log?\n\n```js\nconsole.log(typeof notDeclaredAnywhere);\nconsole.log(typeof tdz);\nlet tdz = 1;\n```",
          options: [
            "`\"undefined\"`, then a ReferenceError",
            "`\"undefined\"`, then `\"undefined\"`",
            "A ReferenceError on the first line",
            "`\"undefined\"`, then `\"number\"`",
          ],
          correctIndex: 0,
          explanation:
            "`typeof` is special-cased to return `\"undefined\"` for names that don't exist at all. `tdz` does exist, but it's in its temporal dead zone, and reading it throws even inside `typeof`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-undefined-vs-not-defined-q3",
          prompt:
            "What does this log?\n\n```js\nfunction greet(name = \"guest\") {\n  return name;\n}\nconsole.log(greet(undefined), greet(null));\n```",
          options: ["`\"guest\" null`", "`\"guest\" \"guest\"`", "`undefined null`", "`\"guest\" undefined`"],
          correctIndex: 0,
          explanation:
            "Default parameters apply only when the argument is `undefined` (passed explicitly or missing). `null` is a real value meaning \"intentionally empty\", so it's passed through.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-undefined-vs-not-defined-q4",
          prompt: "What does `JSON.stringify({ a: undefined, b: null })` return?",
          options: ["`{\"b\":null}`", "`{\"a\":undefined,\"b\":null}`", "`{\"a\":null,\"b\":null}`", "`{}`"],
          correctIndex: 0,
          explanation:
            "JSON has no `undefined`, so properties holding it are omitted, while `null` is a JSON value and survives. That's one practical reason APIs use `null` to mean \"cleared\".",
        },
        {
          id: "js-undefined-vs-not-defined-q5",
          prompt: "In a classic (non-strict) script, what does this log, and what changes in strict mode?\n\n```js\nfunction f() {\n  oops = 5;\n}\nf();\nconsole.log(oops);\n```",
          options: [
            "`5`; in strict mode the assignment throws a ReferenceError",
            "A ReferenceError in both modes",
            "`undefined`; in strict mode it logs `5`",
            "`5` in both modes",
          ],
          correctIndex: 0,
          explanation:
            "Sloppy mode turns an assignment to an undeclared name into a new global property, a notorious source of leaks and typos. Strict mode (and every module) throws `ReferenceError: oops is not defined` instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-undefined-vs-not-defined-q6",
          prompt: "Which expressions evaluate to the value `undefined`? (Select all that apply.)",
          options: ["`void 0`", "`[1, 2][5]`", "`(() => {})()`", "`typeof undefined`", "`null`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`void` always yields `undefined`, a missing index reads as `undefined`, and a function without `return` returns `undefined`. `typeof undefined` is the string `\"undefined\"`, and `null` is a separate value (even though `null == undefined` is true).",
        },
      ],
    },
    {
      id: "js-scope-chain",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "The Scope Chain, Scope & Lexical Environment",
      summary:
        "Scope answers \"where can this name be used?\", and in JavaScript it's decided lexically, by where the code is written, not by who calls it. Every execution context has a lexical environment: an environment record holding its own bindings plus a reference to the outer lexical environment. That outer reference is fixed when a function is created (the function's hidden `[[Environment]]` slot), so resolving an identifier means checking the current record, then its parent, and so on out to the global scope; if nothing matches, you get a ReferenceError. That chain of environments is the scope chain, and a closure is simply a function keeping its chain alive after the outer call has returned.\n\nStatic resolution is also what makes JavaScript fast. Because the chain is known at parse time, engines turn most variable accesses into fixed slots (a register, a stack slot or a context index) instead of name lookups. Two features break that promise: `with`, and a sloppy-mode direct `eval` that can inject new `var`s into the calling scope. Both force dynamic lookups and inhibit optimisation, which is one reason strict mode bans `with`.\n\nThree gotchas. `this` is not part of the scope chain: it's set per call, except in arrow functions, which resolve it lexically like any other variable. `new Function(...)` bodies close over the global scope only, not the scope that created them, and an indirect eval such as `(0, eval)(code)` runs in the global scope too. Finally, the chain holds bindings, not snapshots, so a function reads a variable's current value at the moment it runs.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "MDN: Scope", url: "https://developer.mozilla.org/en-US/docs/Glossary/Scope", kind: "docs" },
        { label: "You Don't Know JS Yet: The Scope Chain", url: "https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/ch3.md", kind: "article" },
        { label: "ECMAScript spec: Environment Records", url: "https://tc39.es/ecma262/#sec-environment-records", kind: "spec" },
        { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
      ],
      video: {
        title: "The Scope Chain, 🔥Scope & Lexical Environment | Namaste JavaScript Ep. 7",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=uH-tVP8MUs8",
        videoId: "uH-tVP8MUs8",
        durationLabel: "19:47",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-scope-chain-q1",
          prompt:
            "What does this log?\n\n```js\nfunction a() {\n  var b = 10;\n  c();\n  function c() {\n    console.log(b);\n  }\n}\na();\n```",
          options: ["`10`", "`undefined`", "A ReferenceError", "`null`"],
          correctIndex: 0,
          explanation:
            "`c` is written inside `a`, so its outer environment is `a`'s, where `b` is found. It's `10` rather than `undefined` because `c` runs after the assignment.",
        },
        {
          id: "js-scope-chain-q2",
          prompt:
            "What does this log?\n\n```js\nfunction a() {\n  console.log(b);\n}\nfunction outer() {\n  var b = 10;\n  a();\n}\nouter();\n```",
          options: ["ReferenceError: b is not defined", "`10`", "`undefined`", "TypeError: b is not a function"],
          correctIndex: 0,
          explanation:
            "`a` was defined at the top level, so its chain is its own scope plus the global scope. Being called from inside `outer` doesn't add `outer`'s variables; that would be dynamic scoping, which JavaScript doesn't use.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-scope-chain-q3",
          prompt:
            "What does this log?\n\n```js\nfunction make() {\n  const secret = 42;\n  return new Function(\"return typeof secret\");\n}\nconsole.log(make()());\n```",
          options: ["`\"undefined\"`", "`\"number\"`", "A ReferenceError", "`42`"],
          correctIndex: 0,
          explanation:
            "Functions built with `new Function` are always created in the global scope, so `secret` isn't on their chain and `typeof` reports `\"undefined\"`. A normal inner function or arrow would see it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-scope-chain-q4",
          prompt:
            "In a classic (non-strict) script, what does this log?\n\n```js\nvar x = \"global\";\nfunction f() {\n  var x = \"local\";\n  return [eval(\"x\"), (0, eval)(\"x\")];\n}\nconsole.log(f());\n```",
          options: [
            "`[\"local\", \"global\"]`",
            "`[\"local\", \"local\"]`",
            "`[\"global\", \"global\"]`",
            "A TypeError, because `(0, eval)` isn't callable",
          ],
          correctIndex: 0,
          explanation:
            "A direct `eval(...)` call evaluates in the caller's scope. Calling eval any other way, such as `(0, eval)(...)`, is an indirect eval that runs in the global scope, where `x` is `\"global\"`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-scope-chain-q5",
          prompt:
            "In a browser, what does this log?\n\n```js\nconst counter = {\n  count: 0,\n  start() {\n    setTimeout(function () {\n      console.log(this === counter);\n    }, 0);\n    setTimeout(() => {\n      console.log(this === counter);\n    }, 0);\n  },\n};\ncounter.start();\n```",
          options: ["`false`, then `true`", "`true`, then `true`", "`false`, then `false`", "`true`, then `false`"],
          correctIndex: 0,
          explanation:
            "The regular function is invoked by the timer with `this` set to `window`, so it isn't `counter`. The arrow has no `this` of its own and resolves it lexically from `start`, where `this` is `counter`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-scope-chain-q6",
          prompt:
            "Inside `deepest`, which identifiers resolve without a ReferenceError? (Select all that apply.)\n\n```js\nconst g = \"global\";\nfunction outer() {\n  const o = \"outer\";\n  function sibling() {\n    const s = \"sibling\";\n  }\n  function inner() {\n    const i = \"inner\";\n    return function deepest() {\n      // here\n    };\n  }\n  return inner();\n}\n```",
          options: ["`g`", "`o`", "`i`", "`s`", "`sibling`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation:
            "`deepest`'s chain is deepest → inner → outer → global, so it sees `i`, `o`, `g` and the name `sibling`, which is declared in `outer`. `s` lives in `sibling`'s own scope, which isn't on the chain.",
        },
        {
          id: "js-scope-chain-q7",
          prompt:
            "What does this log?\n\n```js\nlet x = \"before\";\nfunction show() {\n  return x;\n}\nx = \"after\";\nconsole.log(show());\n```",
          options: ["`\"after\"`", "`\"before\"`", "`undefined`", "A ReferenceError"],
          correctIndex: 0,
          explanation:
            "The scope chain links to bindings, not to copies of their values, so `show` reads whatever `x` holds when it runs. Nothing is captured at definition time except the environment itself.",
        },
        {
          id: "js-scope-chain-q8",
          prompt: "What does a lexical environment consist of?",
          options: [
            "An environment record of its own bindings plus a reference to the outer lexical environment",
            "A full copy of every variable from all enclosing scopes",
            "The list of stack frames currently on the call stack",
            "The current object's prototype chain plus its `this` value",
          ],
          correctIndex: 0,
          explanation:
            "Each environment stores only its own bindings and a pointer outward; lookups follow those pointers. Copies would break shared mutable state, and the call stack is a separate structure, which is exactly why scope is lexical rather than dynamic.",
        },
        {
          id: "js-scope-chain-q9",
          prompt: "Why do `with` statements and sloppy-mode direct `eval` hurt performance?",
          options: [
            "They make name resolution dynamic, so the engine can't map variables to fixed slots and has to fall back to slow lookups",
            "They run the enclosed code on a separate, slower thread",
            "They disable garbage collection for the enclosing function",
            "They force the whole script to be downloaded and parsed again",
          ],
          correctIndex: 0,
          explanation:
            "With `with`, whether `x` means a variable or a property depends on runtime data, and a sloppy direct eval can declare new variables in its caller. Either way the static scope chain can't be trusted, so the optimisations built on it are off.",
        },
      ],
    },
    {
      id: "js-let-const-tdz",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "`let` & `const`: the Temporal Dead Zone",
      summary:
        "`let` and `const` are hoisted, but unlike `var` they aren't initialised: from the start of their scope until the declaration is evaluated they sit in the temporal dead zone (TDZ), and any read or write throws a ReferenceError (\"Cannot access 'x' before initialization\"). The zone is temporal, not positional: a function defined above the declaration can read the variable safely as long as it's called after the declaration has run. At the top level of a classic script, `let` and `const` live in a separate declarative environment (the \"Script\" scope in DevTools) rather than on `window`, and a name can't be declared with both `var` and `let`.\n\nThe TDZ turns use-before-initialisation into a loud error instead of a silent `undefined`, and it gives `const` a sane meaning: a binding assigned exactly once. Use `const` by default, `let` when you genuinely reassign, and treat `var` as legacy. Know the three error types: ReferenceError for TDZ or undeclared access, TypeError for assigning to a `const`, and SyntaxError (an early error, so nothing in the script runs) for redeclaring a `let` or leaving a `const` without an initialiser.\n\n`const` freezes the binding, not the value: object properties and array items can still change, and `Object.freeze` is shallow. The TDZ also bites where people forget it: an initialiser that mentions its own name (`let x = x + 1` throws even if an outer `x` exists), default parameters that read later parameters, and `case` clauses, which share one block scope. When engines can't prove a binding is initialised, for example when a closure reads it, they emit a hole check, which is the TDZ's small runtime cost in hot code.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "MDN: let (temporal dead zone)", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let", kind: "docs" },
        {
          label: "MDN: ReferenceError: can't access lexical declaration before initialization",
          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cant_access_lexical_declaration_before_init",
          kind: "docs",
        },
        { label: "You Don't Know JS Yet: The (Not So) Secret Lifecycle of Variables", url: "https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/ch5.md", kind: "article" },
        { label: "sudheerj: JavaScript Interview Questions", url: "https://github.com/sudheerj/javascript-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "let & const in JS 🔥Temporal Dead Zone | | Namaste JavaScript Ep. 8",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=BNC6slYCj50",
        videoId: "BNC6slYCj50",
        durationLabel: "21:41",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-let-const-tdz-q1",
          prompt: "What happens?\n\n```js\nconsole.log(a);\nlet a = 10;\n```",
          options: [
            "ReferenceError: Cannot access 'a' before initialization",
            "ReferenceError: a is not defined",
            "It logs `undefined`",
            "It logs `10`",
          ],
          correctIndex: 0,
          explanation:
            "`a` is hoisted, so the engine knows it exists, but it's uninitialised until its declaration runs. \"is not defined\" is the message for a name that exists in no scope, and `undefined` would be `var` behaviour.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-let-const-tdz-q2",
          prompt:
            "What does this log?\n\n```js\nfunction read() {\n  return x;\n}\ntry {\n  read();\n} catch (e) {\n  console.log(e.name);\n}\nlet x = 5;\nconsole.log(read());\n```",
          options: ["`\"ReferenceError\"`, then `5`", "`undefined`, then `5`", "`\"ReferenceError\"` twice", "`5` twice"],
          correctIndex: 0,
          explanation:
            "The zone is about time, not position: the first call happens before `let x = 5` has run, the second after it. Where `read` is written relative to the declaration doesn't matter.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-let-const-tdz-q3",
          prompt: "What happens?\n\n```js\nlet x = 1;\n{\n  let x = x + 1;\n  console.log(x);\n}\n```",
          options: ["A ReferenceError is thrown", "It logs `2`", "It logs `NaN`", "It logs `1`"],
          correctIndex: 0,
          explanation:
            "The inner `let x` shadows the outer one from the start of the block, so the `x` on the right-hand side is the inner binding, still in its TDZ during its own initialiser. The outer `x` can't be reached by that name inside the block.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-let-const-tdz-q4",
          prompt: "What do `f()` and `f(1)` do?\n\n```js\nfunction f(a = b, b = 2) {\n  return a + b;\n}\n```",
          options: [
            "`f()` throws a ReferenceError; `f(1)` returns `3`",
            "`f()` returns `NaN`; `f(1)` returns `3`",
            "`f()` returns `4`; `f(1)` returns `3`",
            "Both throw a ReferenceError",
          ],
          correctIndex: 0,
          explanation:
            "Parameters are initialised left to right and each is in its TDZ until then, so the default for `a` can't read `b`. With `f(1)` the default for `a` is never evaluated, so nothing touches `b` early.",
        },
        {
          id: "js-let-const-tdz-q5",
          prompt: "What happens?\n\n```js\nconst cfg = { retries: 1 };\ncfg.retries = 3;\nconsole.log(cfg.retries);\ncfg = {};\n```",
          options: [
            "It logs `3`, then throws TypeError: Assignment to constant variable",
            "It throws a TypeError at `cfg.retries = 3`",
            "It logs `1`, because `const` objects are immutable",
            "It logs `3`, then silently ignores `cfg = {}`",
          ],
          correctIndex: 0,
          explanation:
            "`const` makes the binding immutable, not the object, so changing a property is fine. Reassigning the binding throws a TypeError at runtime, in sloppy mode as well as strict.",
        },
        {
          id: "js-let-const-tdz-q6",
          prompt: "Which of these make the whole script fail with a SyntaxError before any of it runs? (Select all that apply.)",
          options: [
            "`const a;`",
            "`let b = 1; let b = 2;`",
            "`const c = 1; c = 2;`",
            "`console.log(d); let d;`",
            "`var e = 1; let e = 2;`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 4],
          explanation:
            "A missing `const` initialiser and redeclarations involving `let`/`const` are early errors, reported at parse time, so not even the first line runs. Assigning to a `const` is a runtime TypeError, and the TDZ access is a runtime ReferenceError.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-let-const-tdz-q7",
          prompt:
            "A page loads two classic scripts. The first runs `let appName = \"trails\";` at its top level. Which is true in the second script?",
          options: [
            "`appName` is readable, but `window.appName` is `undefined`",
            "`appName` isn't visible, because each classic script has its own scope",
            "`window.appName` is `\"trails\"`, as it would be for a global `var`",
            "Declaring `var appName` in the second script quietly replaces it",
          ],
          correctIndex: 0,
          explanation:
            "Top-level `let`/`const` in classic scripts share one global declarative record: visible to later scripts but not stored on `window`. A `var appName` in the second script would throw a SyntaxError for redeclaring it.",
        },
        {
          id: "js-let-const-tdz-q8",
          prompt: "What happens?\n\n```js\nfor (const i = 0; i < 3; i++) {\n  console.log(i);\n}\n```",
          options: [
            "It logs `0`, then throws TypeError: Assignment to constant variable",
            "It logs `0 1 2`, because each iteration gets a new binding",
            "SyntaxError: `const` isn't allowed in a `for` header",
            "It throws a TypeError before logging anything",
          ],
          correctIndex: 0,
          explanation:
            "Each iteration copies the binding, but the `i++` update still assigns to a `const`, which fails after the first body run. `for (const x of list)` works because every iteration gets a fresh binding that's never reassigned.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-let-const-tdz-q9",
          prompt:
            "In a classic (non-strict) script, what does this log?\n\n```js\nconst settings = Object.freeze({ theme: \"dark\", flags: { beta: false } });\nsettings.theme = \"light\";\nsettings.flags.beta = true;\nconsole.log(settings.theme, settings.flags.beta);\n```",
          options: ["`\"dark\" true`", "`\"light\" true`", "`\"dark\" false`", "A TypeError at the first assignment"],
          correctIndex: 0,
          explanation:
            "`Object.freeze` freezes only the top-level properties, and in sloppy mode writes to them fail silently (strict mode throws a TypeError). The nested `flags` object isn't frozen, so its change sticks.",
        },
        {
          id: "js-let-const-tdz-q10",
          prompt:
            "What happens?\n\n```js\nswitch (1) {\n  case 0:\n    let msg = \"zero\";\n    break;\n  case 1:\n    msg = \"one\";\n    console.log(msg);\n    break;\n}\n```",
          options: [
            "A ReferenceError is thrown",
            "It logs `\"one\"`",
            "A SyntaxError before anything runs",
            "It logs `undefined`",
          ],
          correctIndex: 0,
          explanation:
            "All `case` clauses share the `switch` block's scope, so `let msg` is declared for the whole block but only initialised if `case 0` runs. Jumping to `case 1` leaves it in the TDZ; wrap each case body in braces to give it its own scope.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "js-block-scope-shadowing",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "Block Scope & Shadowing",
      summary:
        "A block (`{ ... }`, also called a compound statement) groups several statements where the grammar expects one, as in `if`, `for` and `while` bodies. Since ES2015 a block is also a scope: `let`, `const` and `class` declared inside it, and function declarations in strict code, live in a new lexical environment (the \"Block\" scope in DevTools) that goes away when the block finishes. `var` ignores blocks entirely and belongs to the enclosing function or script, which is why a `var` loop counter leaks out of its loop and a `let` one doesn't.\n\nShadowing means declaring a name in an inner scope that hides the same name outside. A `let` inside a block cleanly shadows an outer `let` or `var`. A `var` inside a block at the same function level doesn't shadow anything: it's the same variable as the outer `var`, so assigning it changes the outer value. And shadowing a `let`/`const` with a `var` in a nested block of the same function is illegal shadowing: the `var` would hoist to the function level and collide with the lexical binding, so it's a SyntaxError before any code runs. Put a function boundary in between and it's legal again, because `var` stops at functions.\n\nUse tight block scopes to limit variable lifetimes and to get per-iteration bindings in loops, but keep shadowing rare: lint rules like `no-shadow` exist because a shadowed name makes refactors dangerous. Two legacy corners still trip people up. A `var` that redeclares a parameter is allowed and keeps the argument's value, while a `let` with the parameter's name in the body's top-level scope is a SyntaxError. And Annex B allows `var e` inside `catch (e)`, where the assignment goes to the catch parameter, not to the outer variable.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "MDN: Block statement", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/block", kind: "docs" },
        { label: "You Don't Know JS Yet: Limiting Scope Exposure", url: "https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/ch6.md", kind: "article" },
        { label: "javascript.info: Variable scope, closure (code blocks)", url: "https://javascript.info/closure", kind: "article" },
        { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
      ],
      video: {
        title: "BLOCK SCOPE & Shadowing in JS 🔥| Namaste JavaScript 🙏 Ep. 9",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=lW_erSjyMeM",
        videoId: "lW_erSjyMeM",
        durationLabel: "19:57",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-block-scope-shadowing-q1",
          prompt:
            "What does this log?\n\n```js\nvar a = 100;\n{\n  var a = 10;\n  let b = 20;\n  const c = 30;\n}\nconsole.log(a);\nconsole.log(b);\n```",
          options: [
            "`10`, then ReferenceError: b is not defined",
            "`100`, then ReferenceError: b is not defined",
            "`10`, then `20`",
            "`100`, then `20`",
          ],
          correctIndex: 0,
          explanation:
            "The inner `var a` is the same global variable, so the block overwrites it with 10. `b` is block-scoped and gone once the block ends.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-block-scope-shadowing-q2",
          prompt: "What does this log?\n\n```js\nlet b = 100;\n{\n  let b = 20;\n  console.log(b);\n}\nconsole.log(b);\n```",
          options: ["`20`, then `100`", "`20`, then `20`", "A SyntaxError for redeclaring `b`", "`100`, then `100`"],
          correctIndex: 0,
          explanation:
            "The block creates a new scope, so its `let b` is a separate binding that shadows the outer one only inside the block. Redeclaration errors only apply within the same scope.",
        },
        {
          id: "js-block-scope-shadowing-q3",
          prompt: "What happens?\n\n```js\nlet a = 20;\n{\n  var a = 20;\n}\n```",
          options: [
            "SyntaxError: Identifier 'a' has already been declared",
            "It runs; the block's `a` shadows the outer one",
            "It runs; both refer to the same variable",
            "ReferenceError when the block runs",
          ],
          correctIndex: 0,
          explanation:
            "This is illegal shadowing: `var` ignores the block and tries to declare `a` at the top level, where a `let a` already exists. It's an early error, so nothing in the script runs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-block-scope-shadowing-q4",
          prompt: "Which snippets are valid (no SyntaxError)? (Select all that apply.)",
          options: [
            "`var a = 1; { let a = 2; }`",
            "`let a = 1; { var a = 2; }`",
            "`let a = 1; function f() { var a = 2; }`",
            "`function f(x) { let x = 1; }`",
            "`function f(x) { { let x = 1; } }`",
            "`try {} catch (e) { let e = 1; }`",
          ],
          correctIndex: 0,
          correctIndices: [0, 2, 4],
          explanation:
            "`let` may shadow `var`, and `var` may shadow `let` only across a function boundary. A `let` with a parameter's or catch parameter's name in the same top-level body scope collides; nesting it in its own block makes it legal.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-block-scope-shadowing-q5",
          prompt: "What does `f(5)` return?\n\n```js\nfunction f(x) {\n  var x;\n  return x;\n}\n```",
          options: ["`5`", "`undefined`", "A SyntaxError for redeclaring `x`", "`null`"],
          correctIndex: 0,
          explanation:
            "A `var` with a parameter's name refers to the same binding, and a `var` declaration without an initialiser never resets an existing value. With `let x` instead it would be a SyntaxError.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-block-scope-shadowing-q6",
          prompt:
            "What does this log?\n\n```js\n\"use strict\";\n{\n  function helper() {\n    return \"hi\";\n  }\n}\nconsole.log(typeof helper);\n```",
          options: ["`\"undefined\"`", "`\"function\"`", "A ReferenceError", "A SyntaxError"],
          correctIndex: 0,
          explanation:
            "In strict code, function declarations in blocks are block-scoped like `let`. Only sloppy mode's Annex B rules leak a function-scoped binding, which would make this log `\"function\"`.",
        },
        {
          id: "js-block-scope-shadowing-q7",
          prompt:
            "In a classic (non-strict) script, what does this log?\n\n```js\nvar e = \"outer\";\ntry {\n  throw \"thrown\";\n} catch (e) {\n  var e = \"caught\";\n}\nconsole.log(e);\n```",
          options: ["`\"outer\"`", "`\"caught\"`", "`\"thrown\"`", "A SyntaxError"],
          correctIndex: 0,
          explanation:
            "Annex B allows `var e` here: the declaration hoists to the outer scope, but the assignment runs inside the catch block, where `e` resolves to the catch parameter. So only the parameter changes, and the outer `e` stays `\"outer\"`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-block-scope-shadowing-q8",
          prompt:
            "What does this log?\n\n```js\nfor (var i = 0; i < 3; i++) {}\nfor (let j = 0; j < 3; j++) {}\nconsole.log(i);\nconsole.log(typeof j);\n```",
          options: ["`3`, then `\"undefined\"`", "`2`, then `\"undefined\"`", "`3`, then `\"number\"`", "A ReferenceError for `i`"],
          correctIndex: 0,
          explanation:
            "`var i` belongs to the enclosing scope and ends at 3, the value that failed the condition. `let j` is scoped to the loop, so outside it the name doesn't exist and `typeof` returns `\"undefined\"`.",
        },
        {
          id: "js-block-scope-shadowing-q9",
          prompt: "Which statement about shadowing is accurate?",
          options: [
            "A `var` inside a block at function level doesn't shadow an outer `var` of the same name; it's the same variable",
            "Any inner declaration with the same name creates a new, separate variable",
            "Shadowing is only possible across function boundaries, never with blocks",
            "An inner `let` changes the outer variable's value when the block ends",
          ],
          correctIndex: 0,
          explanation:
            "Only block-scoped declarations (`let`, `const`, `class`) create a new binding in a block; `var` merges with the function-level one. Block shadowing is common and legal, and an inner `let` never writes to the outer binding.",
        },
      ],
    },
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
    {
      id: "js-settimeout-closures-interview",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "setTimeout + Closures Interview Question",
      summary:
        "`setTimeout` doesn't pause anything. It hands the callback and a delay to the host's timer and returns immediately, so the rest of the function, including the rest of a loop, runs first. The callback runs later as its own task, reading whatever its closure can see at that moment. That's the whole trick behind the classic interview question: print 1 to 5, one per second, from a loop.\n\nWith `for (var i = 1; i <= 5; i++) setTimeout(() => console.log(i), i * 1000)`, all five callbacks close over the same function-scoped `i`, and by the time the first one fires the loop has finished and left it at 6, so you get 6 five times. Every timer was also scheduled up front, at 1 s, 2 s … 5 s from the loop, not chained. Fixes, in the order interviewers like to hear them: `let`, which creates a fresh binding per iteration; wrapping the timer in a function (or IIFE) that takes `i` as a parameter, so each call gets its own scope; or skipping the closure entirely by passing the value through, with `setTimeout(fn, ms, i)` or `fn.bind(null, i)`.\n\nThe details catch experienced engineers. An IIFE only helps if the value goes in as a parameter; one that still reads the outer `i` changes nothing. Writing `setTimeout(console.log(i), 1000)` calls `console.log` immediately and passes its return value: browsers convert the non-function into a code string (a no-op here), while Node throws a TypeError. And with `let`, the per-iteration copy happens before the increment, so mutating `i` inside the body changes both what that iteration's callback sees and where the next iteration starts.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "MDN: setTimeout()", url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout", kind: "docs" },
        {
          label: "MDN: Closures (creating closures in loops)",
          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures#creating_closures_in_loops_a_common_mistake",
          kind: "docs",
        },
        { label: "javascript.info: Scheduling: setTimeout and setInterval", url: "https://javascript.info/settimeout-setinterval", kind: "article" },
        { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
      ],
      video: {
        title: "setTimeout + Closures Interview Question 🔥 | Namaste 🙏 JavaScript Ep. 11",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=eBTBG4nda2A",
        videoId: "eBTBG4nda2A",
        durationLabel: "17:43",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-settimeout-closures-interview-q1",
          prompt:
            "What does this log?\n\n```js\nfunction x() {\n  for (var i = 1; i <= 5; i++) {\n    setTimeout(function () {\n      console.log(i);\n    }, i * 1000);\n  }\n  console.log(\"Namaste JavaScript\");\n}\nx();\n```",
          options: [
            "`Namaste JavaScript`, then `6` five times, one per second",
            "`1` to `5`, one per second, then `Namaste JavaScript`",
            "`Namaste JavaScript`, then `1` to `5`, one per second",
            "`6` five times, then `Namaste JavaScript`",
          ],
          correctIndex: 0,
          explanation:
            "`setTimeout` only schedules, so the loop and the final `console.log` run first. All five callbacks share the one function-scoped `i`, which is 6 by the time they fire.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-settimeout-closures-interview-q2",
          prompt: "The same function is written with `let i` instead of `var i`. What does it log now?",
          options: [
            "`Namaste JavaScript`, then `1` to `5`, one per second",
            "`Namaste JavaScript`, then `6` five times",
            "`1` to `5`, one per second, then `Namaste JavaScript`",
            "`Namaste JavaScript`, then `5` five times",
          ],
          correctIndex: 0,
          explanation:
            "`let` in a `for` header creates a new binding for every iteration, initialised from the previous one, so each callback closes over its own `i`. The synchronous log still comes first.",
        },
        {
          id: "js-settimeout-closures-interview-q3",
          prompt:
            "The `var` version logs `6` five times. Which changes make it log `1` to `5`, one per second? (Select all that apply.)",
          options: [
            "Make the loop body `close(i)`, with `function close(x) { setTimeout(() => console.log(x), x * 1000); }`",
            "Use `setTimeout((n) => console.log(n), i * 1000, i)`",
            "Use `setTimeout(console.log.bind(null, i), i * 1000)`",
            "Use `setTimeout(console.log(i), i * 1000)`",
            "Move `var i` above the loop and write `for (i = 1; i <= 5; i++)`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first creates a new scope per call; the next two capture the current value when the timer is scheduled (extra `setTimeout` arguments are passed to the callback, and `bind` stores its arguments). Calling `console.log(i)` directly logs everything immediately, and moving the `var` changes nothing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-settimeout-closures-interview-q4",
          prompt: "What's wrong with `setTimeout(console.log(i), 1000)` inside the loop?",
          options: [
            "`console.log(i)` runs immediately during the loop, and `setTimeout` receives its return value, `undefined`, instead of a function",
            "Nothing: it works, logging each value after 1 second",
            "It's a SyntaxError",
            "It logs `6` five times, like the `var` version",
          ],
          correctIndex: 0,
          explanation:
            "Arguments are evaluated before the call, so the log happens right away. Browsers then convert the non-function handler into a code string (a no-op here), while Node throws a TypeError; either way nothing is delayed.",
        },
        {
          id: "js-settimeout-closures-interview-q5",
          prompt:
            "What does this log?\n\n```js\nfor (var i = 0; i < 3; i++) {\n  let j = i;\n  setTimeout(() => console.log(j), 0);\n}\n```",
          options: ["`0 1 2`", "`3 3 3`", "`2 2 2`", "`undefined` three times"],
          correctIndex: 0,
          explanation:
            "The loop body is a block that gets a fresh scope each iteration, so each callback captures its own `j`. That the loop variable is a `var` doesn't matter, because the callbacks never read `i`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-settimeout-closures-interview-q6",
          prompt:
            "What does this log?\n\n```js\nfor (let i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n  i++;\n}\n```",
          options: ["`1 3`", "`0 1 2`", "`0 2`", "`1 2 3`"],
          correctIndex: 0,
          explanation:
            "Each callback closes over its iteration's binding, which the body's `i++` bumps (to 1, then 3) before the timers fire. The next iteration's binding is copied from that mutated value and then incremented, so the body only runs for `i` = 0 and 2.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-settimeout-closures-interview-q7",
          prompt: "In the `let` version with `i * 1000` delays, when do the five callbacks fire, measured from when the loop runs?",
          options: [
            "At about 1 s, 2 s, 3 s, 4 s and 5 s",
            "At about 1 s, 3 s, 6 s, 10 s and 15 s",
            "All at about 5 s",
            "Each one 1 s after the previous callback finishes",
          ],
          correctIndex: 0,
          explanation:
            "All five timers are registered during the same synchronous loop, each with its own delay from that moment. Nothing is chained, so the delays don't add up and the whole thing takes about 5 seconds.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-settimeout-closures-interview-q8",
          prompt:
            "What does this log?\n\n```js\nfor (var i = 1; i <= 3; i++) {\n  (function () {\n    setTimeout(() => console.log(i), 0);\n  })();\n}\n```",
          options: ["`4 4 4`", "`1 2 3`", "`3 3 3`", "`undefined` three times"],
          correctIndex: 0,
          explanation:
            "The IIFE creates a new scope but declares nothing in it, so the arrow still resolves `i` to the single function-scoped `var`. An IIFE only fixes the problem when `i` is passed in as a parameter.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "js-closures-crazy-interview",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "Crazy JS Interview ft. Closures",
      summary:
        "Episode 12 is a tour of the closure questions interviewers actually ask, and every answer comes back to one rule: a function keeps a live link to the environment it was created in. Closures nest (an inner function sees its parent's parameters and its grandparent's variables), they respect shadowing (the nearest binding wins), and each call to the outer function creates a fresh environment, which is what makes factories and the module pattern work. That's the classic data-privacy answer: a counter whose `count` can only be touched through the functions returned alongside it, whether built with a factory or a constructor function whose methods close over a local variable.\n\nModern alternatives change the tradeoff. Class private fields (`#count`) give real privacy with methods shared on the prototype, while the closure version allocates a new function object per method per instance; with thousands of instances that shows up in a heap snapshot. Closures still win for one-off encapsulation, partial application and wrappers such as `once`, `memoize` and `debounce`, where the private state belongs to a function rather than an object.\n\nThe disadvantage interviewers want you to name is memory. Anything a reachable closure references can't be collected, so long-lived listeners, timers and caches are the usual leak sources, and a memoize cache that's never bounded grows forever (use a `WeakMap` for object keys or an LRU for a bounded cache). V8 does prune what it can: variables that no inner function references aren't kept in the closure's context at all, which is why the debugger can't show an unreferenced outer variable while you're paused inside a closure. And a memoizer keyed with a plain object quietly treats `1` and `\"1\"` as the same key, where a `Map` compares with SameValueZero.",
      level: "advanced",
      estMinutes: 70,
      webRefs: [
        {
          label: "MDN: Closures (emulating private methods)",
          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures#emulating_private_methods_with_closures",
          kind: "docs",
        },
        { label: "You Don't Know JS Yet: Using Closures", url: "https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/ch7.md", kind: "article" },
        { label: "javascript.info: Decorators and forwarding, call/apply", url: "https://javascript.info/call-apply-decorators", kind: "article" },
        { label: "sudheerj: JavaScript Interview Questions", url: "https://github.com/sudheerj/javascript-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "CRAZY JS INTERVIEW 🤯ft. Closures | Namaste 🙏 JavaScript Ep. 12",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=t1nFAMws5FI",
        videoId: "t1nFAMws5FI",
        durationLabel: "32:44",
      },
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `memoize(fn, resolver)`. It returns a function that calls `fn` at most once per cache key and returns the cached result on later calls. The cache must live in a closure: private to each memoized function and unreachable from outside.\n\n- The cache key is `resolver(...args)` when a `resolver` is given, otherwise the first argument (as in lodash).\n- Keys are compared the way a `Map` compares them: `1` and `\"1\"` are different keys, `NaN` is a valid key, and objects match by identity.\n- Cache every result, including falsy ones such as `0`, `\"\"`, `null`, `false` and `undefined`.\n- Call `fn` (and `resolver`) with the same `this` and all the arguments the memoized function received.\n- If `fn` throws, cache nothing and let the error propagate, so the next call tries again.\n- Give the returned function a `clear()` method that empties its cache.\n- Two functions memoized separately never share a cache.\n\nThe tests call `runMemoScenario`, which wraps a small function to count how many times it really runs and reports each result (or thrown error message). Leave the driver as it is.",
        starterCode:
          "/**\n * @param {Function} fn\n * @param {Function} [resolver] builds the cache key from the call's arguments\n * @returns {Function} the memoized function, with a clear() method\n */\nfunction memoize(fn, resolver) {\n  // Your code here\n}\n\n// ---- Test driver (leave as is) ----\nfunction runMemoScenario(fnKind, resolverKind, steps) {\n  let calls = 0;\n  const failedOnce = new Set();\n  const impls = {\n    square: (x) => x * x,\n    identity: (x) => x,\n    typeOf: (x) => typeof x,\n    sum: (...nums) => nums.reduce((a, b) => a + b, 0),\n    withBase: function (x) {\n      return this.base + x;\n    },\n    flaky: (x) => {\n      if (!failedOnce.has(x)) {\n        failedOnce.add(x);\n        throw new Error(\"fail \" + x);\n      }\n      return x * 10;\n    },\n  };\n  const resolvers = { none: undefined, joinArgs: (...args) => args.join(\",\") };\n  const impl = impls[fnKind];\n  const counted = function (...args) {\n    calls++;\n    return impl.apply(this, args);\n  };\n  const memos = [memoize(counted, resolvers[resolverKind]), memoize(counted, resolvers[resolverKind])];\n  const results = [];\n  for (const step of steps) {\n    const memo = memos[step.instance || 0];\n    if (step.clear) {\n      memo.clear();\n      continue;\n    }\n    try {\n      if (step.base !== undefined) {\n        const owner = { base: step.base, memo };\n        results.push(owner.memo(...step.args));\n      } else {\n        results.push(memo(...step.args));\n      }\n    } catch (err) {\n      results.push({ error: err.message });\n    }\n  }\n  return { results, calls };\n}\n",
        functionName: "runMemoScenario",
        testCases: [
          {
            description: "caches by the first argument",
            args: ["square", "none", [{ args: [3] }, { args: [3] }, { args: [4] }]],
            expected: { results: [9, 9, 16], calls: 2 },
          },
          {
            description: "falsy results (0, \"\", null, false, undefined) are cached too",
            args: [
              "identity",
              "none",
              [
                { args: [0] },
                { args: [0] },
                { args: [""] },
                { args: [""] },
                { args: [null] },
                { args: [null] },
                { args: [false] },
                { args: [false] },
                { args: [undefined] },
                { args: [undefined] },
              ],
            ],
            expected: { results: [0, 0, "", "", null, null, false, false, undefined, undefined], calls: 5 },
            isEdgeCase: true,
          },
          {
            description: "`1` and `\"1\"` are different keys",
            args: ["typeOf", "none", [{ args: [1] }, { args: ["1"] }, { args: [1] }]],
            expected: { results: ["number", "string", "number"], calls: 2 },
            isEdgeCase: true,
          },
          {
            description: "`NaN` works as a key",
            args: ["identity", "none", [{ args: [NaN] }, { args: [NaN] }]],
            expected: { results: [NaN, NaN], calls: 1 },
            isEdgeCase: true,
          },
          {
            description: "a resolver builds the key from all arguments",
            args: ["sum", "joinArgs", [{ args: [1, 2] }, { args: [1, 2] }, { args: [2, 1] }]],
            expected: { results: [3, 3, 3], calls: 2 },
          },
          {
            description: "without a resolver only the first argument is the key",
            args: ["sum", "none", [{ args: [1, 2] }, { args: [1, 5] }]],
            expected: { results: [3, 3], calls: 1 },
          },
          {
            description: "`this` is passed through to `fn`",
            args: ["withBase", "none", [{ args: [1], base: 10 }, { args: [2], base: 20 }]],
            expected: { results: [11, 22], calls: 2 },
            isEdgeCase: true,
          },
          {
            description: "a call that throws isn't cached",
            args: ["flaky", "none", [{ args: [2] }, { args: [2] }, { args: [2] }]],
            expected: { results: [{ error: "fail 2" }, 20, 20], calls: 2 },
            isEdgeCase: true,
          },
          {
            description: "`clear()` empties the cache",
            args: ["square", "none", [{ args: [2] }, { clear: true }, { args: [2] }]],
            expected: { results: [4, 4], calls: 2 },
          },
          {
            description: "each memoized function has its own cache",
            args: ["square", "none", [{ args: [3] }, { args: [3], instance: 1 }, { args: [3] }]],
            expected: { results: [9, 9, 9], calls: 2 },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "js-first-class-functions",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "First-Class Functions ft. Anonymous Functions",
      summary:
        "Functions in JavaScript are first-class values: ordinary objects that happen to be callable. You can store them in variables, arrays and object properties, pass them as arguments, return them from other functions and hang properties on them (`name`, `length`, or your own). Callbacks, event handlers, higher-order functions, closures, decorators and middleware chains all rest on that one property.\n\nThe syntax forms differ in ways that matter. A function statement (declaration) is hoisted with its body; a function expression is created only when evaluated, so it can be defined conditionally and follows its variable's hoisting rules. An anonymous function is only legal where a value is expected: `function () {}` on its own line is a SyntaxError, which is why an IIFE needs parentheses (or a leading operator). A named function expression binds its name in a tiny scope visible only inside its own body, useful for recursion that survives reassignment of the outer variable and for readable stack traces; that binding is read-only (writes are ignored in sloppy mode and throw in strict mode). Even anonymous functions usually get a `name` inferred from the variable or property they're assigned to.\n\nArrow functions are the other big choice. They're compact and have no own `this`, `arguments`, `super` or `new.target`, which makes them ideal for callbacks and wrong for object methods that need their receiver; they also can't be called with `new` and have no `prototype`. The practical gotcha is identity: every evaluation of a function expression creates a new object, so an inline callback never equals the previous one. That's why `removeEventListener` with an inline arrow does nothing and why `React.memo` props keep changing unless you hoist or memoise the function.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "MDN: First-class function", url: "https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function", kind: "docs" },
        { label: "MDN: function expression", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function", kind: "docs" },
        { label: "javascript.info: Function expressions", url: "https://javascript.info/function-expressions", kind: "article" },
        { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
      ],
      video: {
        title: "FIRST CLASS FUNCTIONS 🔥ft. Anonymous Functions | Namaste JavaScript Ep. 13",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=SHINoHxvTso",
        videoId: "SHINoHxvTso",
        durationLabel: "22:30",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-first-class-functions-q1",
          prompt:
            "What does this log?\n\n```js\nvar b = function xyz() {\n  return typeof xyz;\n};\nconsole.log(b());\nconsole.log(typeof xyz);\n```",
          options: [
            "`\"function\"`, then `\"undefined\"`",
            "`\"function\"`, then `\"function\"`",
            "`\"undefined\"`, then `\"undefined\"`",
            "A ReferenceError inside `b()`",
          ],
          correctIndex: 0,
          explanation:
            "A named function expression binds its name in a scope visible only inside its own body, so `xyz` resolves there. Outside, only the variable `b` exists; calling `xyz()` at the top level would be a ReferenceError.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-first-class-functions-q2",
          prompt:
            "In a classic (non-strict) script, what does this log?\n\n```js\nconst fact = function f(n) {\n  f = null;\n  return n <= 1 ? 1 : n * f(n - 1);\n};\nconsole.log(fact(3));\n```",
          options: [
            "`6`",
            "TypeError: f is not a function",
            "TypeError: Assignment to constant variable",
            "`NaN`",
          ],
          correctIndex: 0,
          explanation:
            "The name of a named function expression is an immutable binding: in sloppy mode `f = null` is silently ignored, so the recursion still works. In strict mode the same line throws `TypeError: Assignment to constant variable`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-first-class-functions-q3",
          prompt: "Which of these is a SyntaxError?",
          options: [
            "`function () {}` on its own line",
            "`(function () {});`",
            "`const f = function () {};`",
            "`[function () {}];`",
          ],
          correctIndex: 0,
          explanation:
            "A statement that starts with the `function` keyword is parsed as a declaration, and declarations need a name. Parentheses, an assignment or an array literal put the function in expression position, where anonymous functions are fine.",
        },
        {
          id: "js-first-class-functions-q4",
          prompt:
            "What does this log?\n\n```js\nconst add = (a, b) => a + b;\nconst obj = {\n  run() {},\n  [\"dyn\" + 1]: function () {},\n};\nconsole.log(add.name, obj.run.name, obj.dyn1.name);\n```",
          options: ["`add run dyn1`", "`anonymous run anonymous`", "`add run anonymous`", "`undefined run undefined`"],
          correctIndex: 0,
          explanation:
            "Since ES2015, anonymous functions and arrows get a `name` inferred from the binding or property key they're assigned to, computed keys included. That inference is why stack traces show useful names for arrow functions.",
        },
        {
          id: "js-first-class-functions-q5",
          prompt: "Because functions are first-class values, which of these can you do? (Select all that apply.)",
          options: [
            "Pass a function as an argument to another function",
            "Return a function from another function",
            "Store a function in an array or object and attach properties to it",
            "Compare two separately created but identical function expressions with `===` and get `true`",
            "Call a `const` function expression on a line before its declaration",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Functions are ordinary objects, so they can be passed, returned, stored and given properties. Each evaluation creates a distinct object (`===` compares identity), and a `const` binding is in its TDZ until initialised.",
        },
        {
          id: "js-first-class-functions-q6",
          prompt:
            "What happens?\n\n```js\nconst Arrow = () => {};\nfunction Regular() {}\nconsole.log(typeof Regular.prototype, typeof Arrow.prototype);\nnew Arrow();\n```",
          options: [
            "It logs `object undefined`, then throws TypeError: Arrow is not a constructor",
            "It logs `object object`, and `new Arrow()` returns `{}`",
            "It logs `undefined undefined`, then throws a TypeError",
            "It logs `object undefined`, and `new Arrow()` returns `undefined`",
          ],
          correctIndex: 0,
          explanation:
            "Arrow functions have no `prototype` and can't be constructed, so `new` throws. That, plus having no own `this` or `arguments`, is why they suit callbacks rather than constructors or methods.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-first-class-functions-q7",
          prompt: "Which of these immediately invoke the function? (Select all that apply.)",
          options: [
            "`(function () {})();`",
            "`(function () {}());`",
            "`!function () {}();`",
            "`function () {}();`",
            "`function f() {}();`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything that puts the function in expression position works: parentheses (with the call inside or outside them) or a unary operator such as `!`. A statement starting with `function` is a declaration, so the unnamed one is a SyntaxError and the named one leaves an empty `()`, also a SyntaxError.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-first-class-functions-q8",
          prompt: "What does this log?\n\n```js\nconst make = () => () => 1;\nconsole.log(make() === make());\n```",
          options: ["`false`", "`true`", "A TypeError", "`undefined`"],
          correctIndex: 0,
          explanation:
            "Each call evaluates the inner arrow expression again, creating a new function object, and `===` compares identity. That's why inline callbacks can't be passed to `removeEventListener` and why they break memoised props.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "js-callbacks-event-listeners",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "Callback Functions ft. Event Listeners",
      summary:
        "A callback is a function you hand to other code so that code can call it later. Some callbacks run synchronously (`array.map`, `sort` comparators), others asynchronously, when a timer fires, a response arrives or a user clicks. Callbacks are how single-threaded JavaScript reaches the async world: you register interest, the host does the waiting, and your function is queued to run when the call stack is free. The flip side is that anything blocking the main thread delays every callback waiting behind it.\n\nEvent listeners are long-lived callbacks registered on an `EventTarget`. A listener that closes over state (a click counter, say) keeps that state private, and keeps it alive for as long as the listener is attached, which is why detached-but-still-listening components are a classic memory leak. Removal needs the exact same function reference and the same `capture` flag, so an inline arrow can never be removed. `{ once: true }` and an `AbortSignal` passed as `signal` are cleaner for most cases, and one `abort()` can detach dozens of listeners at once. Adding the same function twice with the same type and capture flag registers it only once.\n\nThe deeper tradeoff is inversion of control: when you pass a callback to someone else's code, you trust it to call you once, at the right time, with the right arguments. Callbacks can be called twice, never, or synchronously one time and asynchronously the next, the problem promises were designed to fix. Two event-specific gotchas: `dispatchEvent` runs listeners synchronously before it returns, and microtasks run between listeners for a real user click but not for `element.click()` from script, because the calling script is still on the stack.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "MDN: Callback function", url: "https://developer.mozilla.org/en-US/docs/Glossary/Callback_function", kind: "docs" },
        { label: "MDN: EventTarget.addEventListener()", url: "https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener", kind: "docs" },
        { label: "javascript.info: Introduction to browser events", url: "https://javascript.info/introduction-browser-events", kind: "article" },
        { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Callback Functions in JS ft. Event Listeners 🔥| Namaste JavaScript Ep. 14",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=btj35dh3_U8",
        videoId: "btj35dh3_U8",
        durationLabel: "23:26",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-callbacks-event-listeners-q1",
          prompt:
            "What does this log?\n\n```js\nconsole.log(\"A\");\n[1, 2].forEach((n) => console.log(n));\nsetTimeout(() => console.log(\"T\"), 0);\nconsole.log(\"B\");\n```",
          options: ["`A 1 2 B T`", "`A B 1 2 T`", "`A 1 2 T B`", "`A B T 1 2`"],
          correctIndex: 0,
          explanation:
            "`forEach` calls its callback synchronously, inside the loop, while the `setTimeout` callback is queued and runs only after the current script finishes. \"Callback\" says nothing about sync versus async; the API decides.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-callbacks-event-listeners-q2",
          prompt:
            "What happens when the button is clicked after this runs?\n\n```js\nbtn.addEventListener(\"click\", () => console.log(\"hi\"));\nbtn.removeEventListener(\"click\", () => console.log(\"hi\"));\n```",
          options: [
            "It still logs `hi`: the two arrows are different function objects, so nothing was removed",
            "Nothing logs: the listener was removed because the source code matches",
            "`removeEventListener` threw, because that function was never added",
            "It logs `hi` once, then the listener removes itself",
          ],
          correctIndex: 0,
          explanation:
            "Listeners are matched by function identity (plus type and capture flag), not by source text, and a non-matching remove silently does nothing. Keep a reference to the handler, or use `{ once: true }` or an `AbortSignal`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-callbacks-event-listeners-q3",
          prompt:
            "What's the state after this runs?\n\n```js\nfunction onClick() {\n  console.log(\"clicked\");\n}\nbtn.addEventListener(\"click\", onClick, { capture: true });\nbtn.removeEventListener(\"click\", onClick);\n```",
          options: [
            "The listener is still attached, because the capture flag doesn't match",
            "The listener is removed; the capture flag only matters when adding",
            "`removeEventListener` throws a TypeError for mismatched options",
            "Both the capturing and the bubbling versions are removed",
          ],
          correctIndex: 0,
          explanation:
            "The capture flag is part of a listener's identity, and it's the only option `removeEventListener` checks. Pass `{ capture: true }` (or `true`) to the remove call to match.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-callbacks-event-listeners-q4",
          prompt:
            "At the top level of a module, what do these log when `btn` is clicked?\n\n```js\nbtn.addEventListener(\"click\", function () {\n  console.log(this === btn);\n});\nbtn.addEventListener(\"click\", () => {\n  console.log(this === btn);\n});\n```",
          options: ["`true`, then `false`", "`true`, then `true`", "`false`, then `false`", "`false`, then `true`"],
          correctIndex: 0,
          explanation:
            "A regular function listener is called with `this` set to the element it's attached to (`event.currentTarget`). The arrow inherits `this` from the module's top level, where it's `undefined`.",
        },
        {
          id: "js-callbacks-event-listeners-q5",
          prompt:
            "How many times is `once?` logged per click?\n\n```js\nfunction log() {\n  console.log(\"once?\");\n}\nbtn.addEventListener(\"click\", log);\nbtn.addEventListener(\"click\", log);\n```",
          options: ["Once", "Twice", "Zero: the second call throws and nothing is registered", "Twice on the first click, then once"],
          correctIndex: 0,
          explanation:
            "Adding the same function with the same type and capture flag again is a no-op, so there's one listener. Two different function objects, such as two inline arrows, would both run.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-callbacks-event-listeners-q6",
          prompt:
            "What does this log?\n\n```js\nbtn.addEventListener(\"click\", () => console.log(\"listener\"));\nconsole.log(\"before\");\nbtn.dispatchEvent(new Event(\"click\"));\nconsole.log(\"after\");\n```",
          options: [
            "`before`, `listener`, `after`",
            "`before`, `after`, `listener`",
            "`listener`, `before`, `after`",
            "`before`, `after`, and the listener never runs for synthetic events",
          ],
          correctIndex: 0,
          explanation:
            "`dispatchEvent` runs every matching listener synchronously and only then returns. Events feel asynchronous because the browser dispatches real ones from separate tasks, not because dispatch itself is deferred.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-callbacks-event-listeners-q7",
          prompt: "Which of these stop a click listener from running on future clicks? (Select all that apply.)",
          options: [
            "Registering it with `{ once: true }` and letting it fire once",
            "Registering it with `{ signal: controller.signal }` and calling `controller.abort()`",
            "Calling `removeEventListener` with the same function reference and capture flag",
            "Setting the variable that held the handler to `null` after adding it",
            "Calling `event.stopPropagation()` inside the handler",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three detach the listener. Nulling your variable doesn't touch the reference the target holds, and `stopPropagation` only stops the current event from reaching other elements; the listener still runs next time.",
        },
        {
          id: "js-callbacks-event-listeners-q8",
          prompt:
            "`attach()` runs twice, then the button is clicked once. What's logged?\n\n```js\nfunction attach() {\n  let count = 0;\n  document.getElementById(\"btn\").addEventListener(\"click\", () => {\n    console.log(\"clicked\", ++count);\n  });\n}\n```",
          options: ["`clicked 1` twice", "`clicked 1`, then `clicked 2`", "`clicked 1` once", "`clicked 2` once"],
          correctIndex: 0,
          explanation:
            "Each call creates a new `count` and a new arrow, so two distinct listeners are added and each increments its own counter. Duplicate detection only applies to the same function object.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-callbacks-event-listeners-q9",
          prompt: "What's the core problem with passing callbacks to third-party code, often called inversion of control?",
          options: [
            "You no longer control whether it's called once, many times, never, or synchronously versus asynchronously",
            "Callbacks can't read variables from the scope where they were written",
            "Callbacks run on a separate thread, so they can't touch the DOM",
            "Callbacks can't receive arguments, so results have to go through globals",
          ],
          correctIndex: 0,
          explanation:
            "The callee decides when and how often your function runs. Promises fix this by handing you an object that settles exactly once and always notifies asynchronously; callbacks do close over their scope and can take arguments.",
        },
        {
          id: "js-callbacks-event-listeners-q10",
          prompt:
            "`inner` is nested inside `outer`. What's logged for a real user click on `inner`, and for `inner.click()` called from a script?\n\n```js\ninner.addEventListener(\"click\", () => {\n  Promise.resolve().then(() => console.log(\"micro\"));\n  console.log(\"inner\");\n});\nouter.addEventListener(\"click\", () => console.log(\"outer\"));\n```",
          options: [
            "User click: `inner micro outer`. Script `inner.click()`: `inner outer micro`",
            "Both: `inner outer micro`",
            "Both: `inner micro outer`",
            "User click: `inner outer micro`. Script `inner.click()`: `inner micro outer`",
          ],
          correctIndex: 0,
          explanation:
            "After each listener returns, the browser runs a microtask checkpoint if the JavaScript stack is empty. For a real click it is, so `micro` runs before the bubbling listener; with `.click()` the calling script is still on the stack, so the microtask waits until that script finishes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "js-event-loop",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "Asynchronous JavaScript & the Event Loop",
      summary:
        "The JavaScript engine has exactly one call stack and no notion of time, network or clicks. The host provides those: the browser's Web APIs (timers, `fetch`, DOM events, `postMessage`) or Node's libuv. When host work completes, its callback is queued as a task, and the event loop is the scheduler that decides what runs next. Its core rule: take one task, run it to completion, drain the microtask queue completely (including microtasks queued while draining), give the browser a chance to render (`requestAnimationFrame` callbacks, style, layout and paint, typically once per display frame), then pick the next task.\n\nMicrotasks are promise reactions (`then`/`catch`/`finally` and the continuation after every `await`), `queueMicrotask` and `MutationObserver` callbacks. Tasks (\"macrotasks\") include timers, UI events, `MessageChannel` messages and network callbacks. That split explains every ordering puzzle: synchronous code first, then all microtasks, then the next task. It also explains starvation: a microtask that keeps queueing microtasks blocks timers, input and rendering forever, whereas a `setTimeout` loop yields on every iteration.\n\nPick the queue deliberately. Use a microtask to run something right after the current code but before anything else can observe intermediate state; use a task (`setTimeout`, `MessageChannel`, or `scheduler.postTask`/`scheduler.yield()` where supported) to actually yield so the browser can render and handle input; use `requestAnimationFrame` for visual updates. Node has the same microtask semantics but different task phases (timers, poll, and check for `setImmediate`) plus `process.nextTick`, which runs before promise microtasks in CommonJS but after them in an ES module entry point, because that module is evaluated from inside a microtask.",
      level: "expert",
      estMinutes: 90,
      isMilestone: true,
      webRefs: [
        { label: "MDN: JavaScript execution model (job queue and event loop)", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model", kind: "docs" },
        { label: "Jake Archibald: Tasks, microtasks, queues and schedules", url: "https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/", kind: "article" },
        { label: "javascript.info: Event loop: microtasks and macrotasks", url: "https://javascript.info/event-loop", kind: "article" },
        { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Asynchronous JavaScript & EVENT LOOP from scratch 🔥 | Namaste JavaScript Ep.15",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=8zKuNo4ay8E",
        videoId: "8zKuNo4ay8E",
        durationLabel: "41:45",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-event-loop-q1",
          prompt:
            "What does this log?\n\n```js\nconsole.log(\"start\");\nsetTimeout(() => console.log(\"timeout\"), 0);\nPromise.resolve().then(() => console.log(\"promise\"));\nconsole.log(\"end\");\n```",
          options: ["`start end promise timeout`", "`start end timeout promise`", "`start promise end timeout`", "`start timeout promise end`"],
          correctIndex: 0,
          explanation:
            "Synchronous code runs to completion first. The microtask queue (the promise reaction) is then drained before the event loop picks the next task, the timer callback, even with a 0 ms delay.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-event-loop-q2",
          prompt:
            "What does this log?\n\n```js\nsetTimeout(() => console.log(\"t1\"), 0);\nPromise.resolve().then(() => {\n  console.log(\"p1\");\n  setTimeout(() => console.log(\"t2\"), 0);\n  Promise.resolve().then(() => console.log(\"p2\"));\n});\nconsole.log(\"sync\");\n```",
          options: ["`sync p1 p2 t1 t2`", "`sync p1 t1 p2 t2`", "`sync t1 p1 p2 t2`", "`sync p1 t1 t2 p2`"],
          correctIndex: 0,
          explanation:
            "Microtasks queued while the microtask queue is being drained run in the same drain, so `p2` runs before any task. `t2` was queued as a task after `t1`, so it runs after it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-event-loop-q3",
          prompt:
            "What does this log?\n\n```js\nasync function a() {\n  console.log(\"a1\");\n  await null;\n  console.log(\"a2\");\n}\nconsole.log(\"s1\");\na();\nPromise.resolve().then(() => console.log(\"p\"));\nconsole.log(\"s2\");\n```",
          options: ["`s1 a1 s2 a2 p`", "`s1 a1 a2 s2 p`", "`s1 s2 a1 a2 p`", "`s1 a1 s2 p a2`"],
          correctIndex: 0,
          explanation:
            "An `async` function runs synchronously up to its first `await`; the rest resumes as a microtask. That continuation was queued before the `.then` callback, so `a2` logs before `p`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-event-loop-q4",
          prompt:
            "What does this log?\n\n```js\nsetTimeout(() => {\n  console.log(\"t1\");\n  Promise.resolve().then(() => console.log(\"p-in-t1\"));\n}, 0);\nsetTimeout(() => console.log(\"t2\"), 0);\n```",
          options: ["`t1 p-in-t1 t2`", "`t1 t2 p-in-t1`", "`p-in-t1 t1 t2`", "It varies between browsers"],
          correctIndex: 0,
          explanation:
            "The microtask queue is drained after every task, not just after the whole script, so the promise queued inside the first timer runs before the second timer. Node has matched this since v11.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-event-loop-q5",
          prompt:
            "What does this log?\n\n```js\nconsole.log(1);\nnew Promise((resolve) => {\n  console.log(2);\n  resolve();\n  console.log(3);\n}).then(() => console.log(4));\nconsole.log(5);\n```",
          options: ["`1 2 3 5 4`", "`1 5 2 3 4`", "`1 2 5 3 4`", "`1 2 4 3 5`"],
          correctIndex: 0,
          explanation:
            "The executor passed to `new Promise` runs synchronously, and `resolve()` doesn't stop it, so 2 and 3 log immediately. Only the `.then` callback is deferred to a microtask.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-event-loop-q6",
          prompt: "Which of these schedule a microtask? (Select all that apply.)",
          options: [
            "`queueMicrotask(fn)`",
            "`Promise.resolve().then(fn)`",
            "A `MutationObserver` callback after a DOM change",
            "`setTimeout(fn, 0)`",
            "`requestAnimationFrame(fn)`",
            "`port.postMessage(data)` on a `MessageChannel`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Promise reactions, `queueMicrotask` and `MutationObserver` callbacks use the microtask queue. `setTimeout` and `MessageChannel` messages are tasks, and `requestAnimationFrame` callbacks run in the rendering step.",
        },
        {
          id: "js-event-loop-q7",
          prompt:
            "What happens?\n\n```js\nfunction loop() {\n  Promise.resolve().then(loop);\n}\nloop();\nsetTimeout(() => console.log(\"timer\"), 0);\n```",
          options: [
            "`timer` never logs, and the page stops rendering and responding",
            "`timer` logs after the first iteration of `loop`",
            "It throws RangeError: Maximum call stack size exceeded",
            "`timer` logs after about 4 ms, because timers eventually take priority",
          ],
          correctIndex: 0,
          explanation:
            "Each microtask queues another, so the microtask queue never empties and the loop never reaches the next task or a rendering opportunity. There's no stack overflow, because each callback returns before the next runs; the same loop built on `setTimeout` would stay responsive.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-event-loop-q8",
          prompt:
            "A click handler sets a progress bar's width 100 times in a synchronous loop, from 1% to 100%. What does the user see?",
          options: [
            "Only the final 100% state, because rendering happens after the task finishes",
            "A smooth animation through all 100 widths",
            "One frame per update, about 1.6 seconds of animation at 60 Hz",
            "Nothing until the next click",
          ],
          correctIndex: 0,
          explanation:
            "The browser renders between tasks, once the call stack is empty, so style changes made during a single task are coalesced into one frame. To show progress, split the work across tasks or animation frames.",
        },
        {
          id: "js-event-loop-q9",
          prompt:
            "What does this log?\n\n```js\nPromise.resolve()\n  .then(() => console.log(\"a1\"))\n  .then(() => console.log(\"a2\"));\nPromise.resolve()\n  .then(() => console.log(\"b1\"))\n  .then(() => console.log(\"b2\"));\n```",
          options: ["`a1 b1 a2 b2`", "`a1 a2 b1 b2`", "`b1 a1 b2 a2`", "`a1 b1 b2 a2`"],
          correctIndex: 0,
          explanation:
            "A `.then` callback is queued only when the promise it's attached to settles. Both first-level callbacks are queued up front, and each one queues its successor when it runs, so the two chains interleave.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-event-loop-q10",
          prompt:
            "In a Node.js CommonJS script, what's the order?\n\n```js\nsetTimeout(() => console.log(\"timeout\"), 0);\nPromise.resolve().then(() => console.log(\"promise\"));\nprocess.nextTick(() => console.log(\"nextTick\"));\n```",
          options: ["`nextTick promise timeout`", "`promise nextTick timeout`", "`timeout nextTick promise`", "`nextTick timeout promise`"],
          correctIndex: 0,
          explanation:
            "Node drains the `process.nextTick` queue before promise microtasks, and both before the timers phase. In an ES module entry point the first two swap, because that module is evaluated from inside a microtask, so the promise queue drains before Node reaches its nextTick queue.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-event-loop-q11",
          prompt: "Where do `requestAnimationFrame` callbacks run?",
          options: [
            "In the rendering step, before style and layout, whenever the browser renders a frame",
            "As microtasks, immediately after the current script",
            "As ordinary tasks, after every other queued task",
            "On the compositor thread, in parallel with other JavaScript",
          ],
          correctIndex: 0,
          explanation:
            "rAF callbacks run once per rendered frame (typically matching the display refresh rate), just before style, layout and paint, and they're paused in hidden tabs. They aren't part of the task or microtask queues, and they run on the main thread.",
        },
        {
          id: "js-event-loop-q12",
          prompt: "Which statement about the event loop is accurate?",
          options: [
            "It starts the next task only once the call stack is empty, and drains every microtask after each task",
            "It interrupts running JavaScript when a timer expires, so the callback fires on time",
            "It alternates strictly: one task, then one microtask, then one task",
            "It's implemented inside V8 itself, so browsers and Node schedule tasks identically",
          ],
          correctIndex: 0,
          explanation:
            "JavaScript is never preempted: a task runs to completion, then the whole microtask queue is drained. The loop is defined by the host (the HTML spec in browsers, libuv in Node), which is why their task phases differ.",
        },
      ],
    },
    {
      id: "js-engine-v8",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "JS Engine Exposed: Google's V8 Architecture",
      summary:
        "A JavaScript runtime is an engine plus a host. V8 (Chrome, Edge, Node, Deno), SpiderMonkey (Firefox) and JavaScriptCore (Safari) implement the language, its built-ins, the heap and the call stack; the host adds the event loop, timers, the DOM, `fetch` or `fs`. V8 parses source into an AST, but lazily: functions not needed at startup are only pre-parsed and get fully compiled on their first call (parenthesised IIFEs are compiled eagerly).\n\nExecution is tiered. Ignition compiles the AST to bytecode and interprets it, recording type feedback about the shapes and types each operation sees. Warm functions move to Sparkplug, a baseline compiler that turns bytecode into machine code in one pass, with no IR or optimisation. Hot functions go to Maglev (Chrome 117+), a fast SSA-based optimising compiler, and the hottest to TurboFan, whose backend now runs on the Turboshaft CFG IR instead of the Sea of Nodes. The optimising tiers speculate from feedback and guard their assumptions; when a guard fails, V8 deoptimises to a lower tier and may reoptimise later.\n\nSpeculation works because of hidden classes (maps, or shapes) and inline caches. Objects built with the same properties in the same order share a map, so an access site that has seen one map (monomorphic) is a compare and a load; with a few maps it's polymorphic, and past a small limit it goes megamorphic and uses a slower generic lookup. So initialise fields in the constructor in a consistent order, avoid `delete` on hot objects (it can push them into slow dictionary mode), and keep arrays' element kinds consistent, since transitions such as SMI to DOUBLE to generic only go one way. Memory is handled by Orinoco, a generational tracing collector: a scavenger for the young generation and a mostly concurrent mark-compact for the old.",
      level: "expert",
      estMinutes: 70,
      webRefs: [
        { label: "V8 blog: Maglev, V8's fastest optimizing JIT", url: "https://v8.dev/blog/maglev", kind: "docs" },
        { label: "V8 blog: Sparkplug, a non-optimizing JavaScript compiler", url: "https://v8.dev/blog/sparkplug", kind: "article" },
        { label: "Mathias Bynens: JavaScript engine fundamentals: Shapes and Inline Caches", url: "https://mathiasbynens.be/notes/shapes-ics", kind: "article" },
        { label: "V8 blog: Elements kinds in V8", url: "https://v8.dev/blog/elements-kinds", kind: "article" },
      ],
      video: {
        title: "JS Engine EXPOSED 🔥 Google's V8 Architecture 🚀 | Namaste JavaScript Ep. 16",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=2WJL19wDH68",
        videoId: "2WJL19wDH68",
        durationLabel: "28:29",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-engine-v8-q1",
          prompt: "Which of these are execution tiers in current V8 (Chrome and Node)? (Select all that apply.)",
          options: ["Ignition", "Sparkplug", "Maglev", "TurboFan", "Crankshaft", "Full-codegen"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Ignition (interpreter), Sparkplug (baseline compiler), Maglev (mid-tier optimiser) and TurboFan (top-tier optimiser) make up today's pipeline. Full-codegen and Crankshaft were the old baseline and optimising compilers, retired when Ignition and TurboFan launched in 2017.",
        },
        {
          id: "js-engine-v8-q2",
          prompt: "What does Ignition do?",
          options: [
            "Compiles the AST to bytecode, interprets it and records type feedback for the optimising tiers",
            "Compiles JavaScript straight to optimised machine code before the first run",
            "Converts JavaScript to WebAssembly and runs it in a sandbox",
            "Collects short-lived objects between tasks",
          ],
          correctIndex: 0,
          explanation:
            "All JavaScript starts as Ignition bytecode, which is compact and quick to produce. The feedback it records (object shapes, operand types) is what lets Maglev and TurboFan speculate later.",
        },
        {
          id: "js-engine-v8-q3",
          prompt: "What makes Sparkplug so fast to compile?",
          options: [
            "It translates bytecode to machine code in a single pass, with no intermediate representation and no optimisation",
            "It uses type feedback to specialise every operation aggressively",
            "It compiles source text directly, skipping the parser and bytecode",
            "It only compiles functions that have never been deoptimised",
          ],
          correctIndex: 0,
          explanation:
            "Sparkplug reuses the work the bytecode compiler already did and emits fixed machine code per bytecode, keeping interpreter-compatible stack frames. It removes interpreter dispatch overhead and leaves real optimisation to Maglev and TurboFan.",
        },
        {
          id: "js-engine-v8-q4",
          prompt:
            "Which of these objects share a hidden class (map) in V8?\n\n```js\nfunction P(x, y) {\n  this.x = x;\n  this.y = y;\n}\nconst a = new P(1, 2);\nconst b = new P(3, 4);\nconst c = { y: 4, x: 3 };\n```",
          options: [
            "`a` and `b` share one; `c` has a different one because its properties were added in a different order",
            "All three share one, because they have the same property names",
            "Each object gets its own hidden class",
            "`b` and `c` share one, because they hold the same values",
          ],
          correctIndex: 0,
          explanation:
            "Maps record property names and the order they were added (plus attributes), never values. Same constructor, same order means a shared map, while `{ y, x }` follows a different transition path.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-engine-v8-q5",
          prompt:
            "`function getX(o) { return o.x; }` runs in a hot loop with objects of dozens of different shapes. What happens at the `o.x` access?",
          options: [
            "The inline cache goes megamorphic and falls back to a slower, generic property lookup",
            "V8 creates a specialised copy of `getX` for each shape",
            "Nothing: property access cost doesn't depend on shapes",
            "V8 throws an internal error and permanently stops optimising the whole script",
          ],
          correctIndex: 0,
          explanation:
            "An inline cache handles one shape (monomorphic) or a handful (polymorphic); beyond V8's small limit the site becomes megamorphic and uses a generic lookup the optimisers can't do much with. Normalising objects to one shape fixes it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-engine-v8-q6",
          prompt:
            "TurboFan optimised `add(a, b)` after it had only ever seen small integers. Now it's called with two strings. What happens?",
          options: [
            "A type guard fails, V8 deoptimises back to unoptimised code, and it may reoptimise later with the broader feedback",
            "It throws a TypeError, because optimised code only accepts numbers",
            "The optimised code converts the strings to numbers and returns a numeric sum",
            "Nothing special: optimised code handles every type as efficiently as integers",
          ],
          correctIndex: 0,
          explanation:
            "Optimised code is speculative and guarded. A failed guard triggers a deopt, so behaviour stays correct (`\"a\" + \"b\"` is still `\"ab\"`), but repeated deopts in hot code are a real performance cliff.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-engine-v8-q7",
          prompt: "Why is `delete obj.prop` discouraged on hot objects in performance-sensitive code?",
          options: [
            "It can switch the object to dictionary (slow) mode, giving up fast shape-based property access",
            "It leaks the deleted value until the page reloads",
            "It always throws in strict mode",
            "It removes the property from every object that shares the hidden class",
          ],
          correctIndex: 0,
          explanation:
            "Deleting properties can move an object from its fast, map-described layout to a hash-table (dictionary) representation, and every access site that sees it slows down. Set the property to `undefined` instead, or use a `Map` for genuinely dynamic keys.",
        },
        {
          id: "js-engine-v8-q8",
          prompt:
            "What happens to this array's elements kind in V8?\n\n```js\nconst arr = [1, 2, 3];\narr.push(4.5);\narr.push(\"x\");\narr.pop();\n```",
          options: [
            "It goes from SMI to DOUBLE to generic elements, and stays generic after `pop()`",
            "It goes to generic elements, then back to DOUBLE when `pop()` removes the string",
            "It stays SMI, because V8 stores every number as a small integer",
            "Each `push` copies the array into a new backing store of the original kind",
          ],
          correctIndex: 0,
          explanation:
            "Elements-kind transitions only move toward more general kinds (PACKED_SMI to PACKED_DOUBLE to PACKED_ELEMENTS), never back. Mixing types, or creating holes, permanently downgrades the fast paths for that array.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-engine-v8-q9",
          prompt: "Which statements about V8's garbage collector are true? (Select all that apply.)",
          options: [
            "The heap is generational: most objects die young, and a scavenger copies survivors out of the young generation",
            "The old generation is collected by mark-compact, with much of the marking done concurrently or in parallel",
            "Two objects that only reference each other are collected once nothing else reaches them",
            "V8 uses reference counting, so a cycle of objects is never freed",
            "Garbage collection only runs when the page is idle, so it never pauses JavaScript",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Orinoco is a tracing, generational collector: reachability from roots decides liveness, so cycles aren't a problem. It still has short pauses, which it shrinks with parallel, incremental and concurrent work, and it uses idle time when it can.",
        },
        {
          id: "js-engine-v8-q10",
          prompt: "Which of these is implemented by V8 itself rather than by the browser or Node?",
          options: ["`Promise` and its microtask queue", "`setTimeout`", "`fetch`", "`document.querySelector`"],
          correctIndex: 0,
          explanation:
            "V8 implements ECMAScript: the syntax, built-ins such as `Promise`, `Array` and `JSON`, and the microtask queue. Timers, networking and the DOM are host APIs, which is why `setTimeout` behaves differently in Node and in browsers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-engine-v8-q11",
          prompt:
            "A large bundle defines hundreds of functions that aren't called during startup. What does V8 do with them when the script loads?",
          options: [
            "Pre-parses them (syntax check and variable scan) and compiles each one only when it's first called",
            "Fully compiles every function to bytecode and optimised machine code up front",
            "Skips them entirely, so a syntax error inside one only surfaces when it's called",
            "Compiles them on a Web Worker and discards the source text",
          ],
          correctIndex: 0,
          explanation:
            "Lazy compilation keeps startup cheap, but the preparser still validates syntax, so a SyntaxError anywhere fails the whole script. Parenthesised IIFEs and V8's explicit compile hints (`//# allFunctionsCalledOnLoad`) opt into eager compilation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-engine-v8-q12",
          prompt: "Why did V8 add Maglev between Sparkplug and TurboFan?",
          options: [
            "TurboFan makes the fastest code but compiles slowly, and many functions never get hot enough; Maglev produces good optimised code about 10x faster",
            "To replace TurboFan entirely with a simpler compiler",
            "To compile WebAssembly, which TurboFan can't handle",
            "To interpret code on platforms that forbid JIT compilation",
          ],
          correctIndex: 0,
          explanation:
            "Maglev is an SSA, CFG-based optimiser that uses the same feedback as TurboFan but compiles roughly 10x faster (and about 10x slower than Sparkplug), covering warm code on real pages. TurboFan remains the top tier for the hottest functions.",
        },
      ],
    },
    {
      id: "js-settimeout-trust-issues",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "Trust Issues with `setTimeout()`",
      summary:
        "`setTimeout(fn, 1000)` doesn't mean \"run in 1000 ms\"; it means \"don't run before 1000 ms\". When the delay elapses, the host queues a task, and that task waits until the call stack is empty and every task ahead of it (plus all pending microtasks) has run. A script that blocks the main thread for 3 seconds makes a 1-second timer fire at about 3 seconds, and `setTimeout(fn, 0)` never runs before the current code and its microtasks have finished. A zero delay is a request to yield, not a way to run immediately.\n\nThe host adds its own delays. Per the HTML spec, once timers are nested more than five levels deep (a timeout scheduled from a timeout, over and over), delays under 4 ms are clamped to 4 ms. Background tabs are throttled to roughly once per second, and Chrome's intensive throttling (since Chrome 88) checks chained timers only once per minute after a page has been hidden for five minutes and silent for 30 seconds. Delays are stored as a signed 32-bit integer, so anything above 2,147,483,647 ms (about 24.8 days) overflows: browsers fire it almost immediately, and Node clamps it to 1 ms with a `TimeoutOverflowWarning`.\n\nSo never build a clock by counting ticks. Compute elapsed time from a fixed start with `performance.now()` or `Date.now()`, correct drift when chaining timeouts, use `requestAnimationFrame` for visual updates, and move CPU-heavy work off the main thread so timers, input and rendering aren't stuck behind it. One more trap: browsers invoke a regular timer callback with `this` set to the global object even in strict code (in Node it's the `Timeout` object), so methods passed as bare callbacks lose their receiver.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        {
          label: "MDN: setTimeout() (reasons for longer delays)",
          url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#reasons_for_longer_delays_than_specified",
          kind: "docs",
        },
        { label: "HTML Standard: Timers", url: "https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers", kind: "spec" },
        { label: "Chrome for Developers: Heavy throttling of chained JS timers beginning in Chrome 88", url: "https://developer.chrome.com/blog/timer-throttling-in-chrome-88", kind: "article" },
        { label: "javascript.info: Scheduling: setTimeout and setInterval", url: "https://javascript.info/settimeout-setinterval", kind: "article" },
      ],
      video: {
        title: "TRUST ISSUES with setTimeout() | Namaste JavaScript Ep.17",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=nqsPmuicJJc",
        videoId: "nqsPmuicJJc",
        durationLabel: "26:10",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "js-settimeout-trust-issues-q1",
          prompt:
            "What happens?\n\n```js\nconsole.log(\"start\");\nsetTimeout(() => console.log(\"timer\"), 1000);\nconst end = Date.now() + 3000;\nwhile (Date.now() < end) {}\nconsole.log(\"end\");\n```",
          options: [
            "`start`, then `end` after about 3 s, then `timer` right after it (at about 3 s, not 1 s)",
            "`start`, `timer` at 1 s (interrupting the loop), then `end` at 3 s",
            "`start`, `end` at 3 s, then `timer` 1 s later, at about 4 s",
            "`start` and `end`; `timer` never fires because its deadline passed",
          ],
          correctIndex: 0,
          explanation:
            "The timer's task is queued at about 1 s but can't run until the loop finishes and the stack is empty. The delay is a minimum measured from scheduling time, not a countdown that starts once the stack frees up.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-settimeout-trust-issues-q2",
          prompt:
            "Both timers expire while the busy loop runs. What's logged after it ends?\n\n```js\nsetTimeout(() => console.log(\"A\"), 10);\nsetTimeout(() => console.log(\"B\"), 0);\nconst end = Date.now() + 50;\nwhile (Date.now() < end) {}\n```",
          options: ["`B`, then `A`", "`A`, then `B`", "Only `B`; `A` is dropped", "The order is random"],
          correctIndex: 0,
          explanation:
            "Expired timers run in the order they came due, and `B` (0 ms) was due before `A` (10 ms), regardless of which was scheduled first. Late timers are never dropped; they just run late.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-settimeout-trust-issues-q3",
          prompt: "According to the HTML spec, when is a `setTimeout(fn, 0)` delay raised to at least 4 ms?",
          options: [
            "When timers are nested more than five levels deep, each scheduled from a previous timer's callback",
            "Always: browsers never allow delays below 4 ms",
            "Only in background tabs",
            "Only after the page has been open for 30 seconds",
          ],
          correctIndex: 0,
          explanation:
            "The spec tracks a timer nesting level and clamps delays under 4 ms once it exceeds 5, so the first few chained zero-delay timeouts run with no clamp. Background-tab throttling is a separate, much larger delay.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-settimeout-trust-issues-q4",
          prompt: "What happens in a browser?\n\n```js\nsetTimeout(() => console.log(\"fired\"), 2 ** 31);\n```",
          options: [
            "It fires almost immediately, because the delay overflows a signed 32-bit integer",
            "It fires after about 24.8 days",
            "It throws a RangeError",
            "It never fires",
          ],
          correctIndex: 0,
          explanation:
            "The delay is converted to a signed 32-bit integer, so 2^31 wraps to a negative number, which is treated as 0. Node instead clamps out-of-range delays to 1 ms with a `TimeoutOverflowWarning`; for very long waits, store a deadline and chain shorter timers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-settimeout-trust-issues-q5",
          prompt:
            "You need a 10-minute countdown that stays accurate to the second, even if the tab is backgrounded for a while. What's the robust approach?",
          options: [
            "Store the deadline and, on each tick, compute the remaining time from `Date.now()` or `performance.now()`",
            "Use `setInterval(tick, 1000)` and decrement a counter on each tick",
            "Use `setTimeout(tick, 0)` in a loop so it updates as often as possible",
            "Use `setInterval(tick, 1)` to get millisecond precision",
          ],
          correctIndex: 0,
          explanation:
            "Ticks can be late, clamped or throttled, so a decremented counter drifts, badly in background tabs. Deriving the display from a fixed deadline corrects itself on every tick, however irregular the ticks are.",
        },
        {
          id: "js-settimeout-trust-issues-q6",
          prompt: "Which of these can make a `setTimeout(fn, 100)` callback run noticeably later than 100 ms? (Select all that apply.)",
          options: [
            "A long-running synchronous task on the main thread",
            "The tab being in the background",
            "A chain of microtasks that keeps the microtask queue busy",
            "Writing the callback as an arrow function instead of a regular function",
            "Calling `clearTimeout` on a different timer's id",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A timer callback needs an empty stack and a drained microtask queue, and background tabs are throttled. The kind of function and unrelated `clearTimeout` calls have no effect on timing.",
        },
        {
          id: "js-settimeout-trust-issues-q7",
          prompt: "What does `setTimeout(fn, 0)` actually guarantee?",
          options: [
            "`fn` runs in a later task, after the current code and its pending microtasks have finished",
            "`fn` runs immediately, before the next line of code",
            "`fn` runs before any pending promise callbacks",
            "`fn` runs within exactly one millisecond",
          ],
          correctIndex: 0,
          explanation:
            "A zero delay still means \"queue a task\", so `fn` waits for the current stack, the microtask queue and any tasks queued ahead of it. It's a way to yield, not a way to run sooner.",
        },
        {
          id: "js-settimeout-trust-issues-q8",
          prompt:
            "In a browser, what does this log?\n\n```js\n\"use strict\";\nsetTimeout(function () {\n  console.log(this === window);\n}, 0);\n```",
          options: [
            "`true`",
            "`false`, because `this` is `undefined` in strict mode",
            "A TypeError",
            "`false`, because `this` is the timer object",
          ],
          correctIndex: 0,
          explanation:
            "The HTML spec explicitly invokes timer callbacks with the global object (the WindowProxy) as `this`, so strict mode's `undefined` for plain calls doesn't apply. In Node the same callback gets the `Timeout` object as `this`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "js-settimeout-trust-issues-q9",
          prompt:
            "What problem does this pattern solve?\n\n```js\nconst start = performance.now();\nlet ticks = 0;\nfunction tick() {\n  ticks++;\n  const next = start + (ticks + 1) * 1000;\n  setTimeout(tick, Math.max(0, next - performance.now()));\n}\nsetTimeout(tick, 1000);\n```",
          options: [
            "It stops lateness from accumulating across chained timeouts, keeping ticks aligned to the original schedule",
            "It makes each timeout fire exactly on time",
            "It stops the browser from throttling the timer in background tabs",
            "It moves the timer off the main thread",
          ],
          correctIndex: 0,
          explanation:
            "Each tick schedules the next against the ideal timeline rather than \"1000 ms from now\", so a late tick shortens the following delay. Individual ticks can still be late; they just don't drift further and further behind.",
        },
        {
          id: "js-settimeout-trust-issues-q10",
          prompt:
            "Chrome's intensive throttling (timers checked only once per minute) applies only when several conditions hold at once. Which are among them? (Select all that apply.)",
          options: [
            "The page has been hidden for more than 5 minutes",
            "The timer belongs to a chain of 5 or more nested timer calls",
            "The page has been silent (no audio) for at least 30 seconds",
            "The page has called `requestAnimationFrame` recently",
            "The timer's delay is under 4 ms",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Intensive throttling (Chrome 88+) needs a chained timer, a page hidden for over 5 minutes, 30 seconds of silence and no active WebRTC. rAF is paused in hidden pages anyway, and the 4 ms clamp is a separate rule.",
        },
      ],
    },
    {
      id: "js-higher-order-functions",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "Higher-Order Functions ft. Functional Programming",
      summary:
        "A higher-order function takes a function as an argument, returns one, or both. The point isn't cleverness; it's separating what changes from what stays the same. Episode 18's example computes area, circumference and diameter for a list of radii: instead of three copies of the same loop, one `calculate(radii, logic)` owns the iteration and the formula is passed in. `map`, `filter`, `reduce`, `sort` comparators, `addEventListener`, `debounce`, `memoize`, `pipe`/`compose`, Express middleware and React's `useCallback` are all higher-order functions, and functional programming leans on them to build programs from small, pure, reusable pieces.\n\nThe tradeoffs are real but usually small. Each callback is an extra call and often an extra closure; engines inline monomorphic call sites well, but a generic helper that receives many different callbacks can go megamorphic, and deep compositions make stack traces harder to read. Composition has a stack cost too: building `pipe` by nesting wrappers (`fns.reduce((f, g) => (...a) => g(f(...a)))`) turns a long pipeline into equally deep nested calls, while a loop over the functions keeps the stack flat.\n\nTwo gotchas. The episode's polyfill attaches `calculate` to `Array.prototype`, fine for learning but dangerous in production: enumerable prototype properties leak into `for...in`, and names collide with future standards, which is exactly why TC39 renamed `Array.prototype.flatten` to `flat` and `contains` to `includes` after old libraries shipped their own versions. And callbacks receive more arguments than you might expect: `[\"1\", \"2\", \"3\"].map(parseInt)` returns `[1, NaN, NaN]`, because `map` passes the index as `parseInt`'s radix.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "MDN: Functions", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions", kind: "docs" },
        { label: "Eloquent JavaScript: Higher-Order Functions", url: "https://eloquentjavascript.net/05_higher_order.html", kind: "article" },
        { label: "javascript.info: Decorators and forwarding, call/apply", url: "https://javascript.info/call-apply-decorators", kind: "article" },
        { label: "sudheerj: JavaScript Interview Questions", url: "https://github.com/sudheerj/javascript-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Higher-Order Functions ft. Functional Programming | Namaste JavaScript Ep. 18",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=HkWxvB1RJq0",
        videoId: "HkWxvB1RJq0",
        durationLabel: "24:03",
      },
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `pipe(...fns)`. It returns a new function that passes its arguments to the first function, passes each result on to the next function, and returns the last result: `pipe(f, g, h)(x)` equals `h(g(f(x)))`.\n\n- The first function receives all the arguments; every later function receives the previous result.\n- `pipe()` with no functions returns a function that returns its first argument.\n- Validate eagerly: if any argument isn't a function, `pipe` itself throws a `TypeError` (not the piped function later).\n- Call every function with the `this` the piped function was called with, so a pipeline also works as a method.\n- The piped function is reusable, and nothing runs until it's called.\n- Pipelines can be 50,000 functions long. Composing nested wrappers, as in `fns.reduce((f, g) => (...a) => g(f(...a)))`, turns that into 50,000 nested calls and overflows the call stack, so loop over the functions instead.\n\nThe tests call `runPipe`, which builds the functions from small specs, counts how many times they run and reports errors by name and phase. Leave the driver as it is.",
        starterCode:
          "/**\n * pipe(f, g, h)(...args) === h(g(f(...args)))\n * @param {...Function} fns\n * @returns {Function}\n */\nfunction pipe(...fns) {\n  // Your code here\n}\n\n// ---- Test driver (leave as is) ----\nfunction runPipe(specs, calls) {\n  let count = 0;\n  const makers = {\n    add: (n) => (x) => x + n,\n    mul: (n) => (x) => x * n,\n    sum: () => (...xs) => xs.reduce((a, b) => a + b, 0),\n    toStr: () => (x) => String(x),\n    wrap: (tag) => (x) => \"<\" + tag + \">\" + x + \"</\" + tag + \">\",\n    offset: () =>\n      function (x) {\n        return this && typeof this.offset === \"number\" ? x + this.offset : \"no this\";\n      },\n  };\n  const fns = specs.map((spec) => {\n    if (!Array.isArray(spec)) return spec; // not a function: pipe should reject it\n    const fn = makers[spec[0]](spec[1]);\n    return function (...args) {\n      count++;\n      return fn.apply(this, args);\n    };\n  });\n  let piped;\n  try {\n    piped = pipe(...fns);\n  } catch (err) {\n    return { error: err.name, phase: \"pipe\" };\n  }\n  const results = [];\n  for (const call of calls) {\n    try {\n      results.push(call.offset !== undefined ? piped.call({ offset: call.offset }, ...call.args) : piped(...call.args));\n    } catch (err) {\n      return { error: err.name, phase: \"call\" };\n    }\n  }\n  return { results, calls: count };\n}\n",
        functionName: "runPipe",
        testCases: [
          {
            description: "runs left to right",
            args: [[["add", 1], ["mul", 2]], [{ args: [3] }]],
            expected: { results: [8], calls: 2 },
          },
          {
            description: "the first function's result feeds the second (nesting order)",
            args: [[["wrap", "b"], ["wrap", "i"]], [{ args: ["x"] }]],
            expected: { results: ["<i><b>x</b></i>"], calls: 2 },
          },
          {
            description: "the first function receives all the arguments",
            args: [[["sum"], ["mul", 10]], [{ args: [1, 2, 3] }]],
            expected: { results: [60], calls: 2 },
          },
          {
            description: "no functions returns the first argument",
            args: [[], [{ args: [5, 6] }]],
            expected: { results: [5], calls: 0 },
            isEdgeCase: true,
          },
          {
            description: "a non-function throws a TypeError from `pipe` itself",
            args: [[["add", 1], 42], [{ args: [1] }]],
            expected: { error: "TypeError", phase: "pipe" },
            isEdgeCase: true,
          },
          {
            description: "the piped function is reusable",
            args: [[["add", 1], ["toStr"]], [{ args: [1] }, { args: [2] }]],
            expected: { results: ["2", "3"], calls: 4 },
          },
          {
            description: "`this` reaches every function",
            args: [[["offset"], ["offset"]], [{ args: [1], offset: 10 }]],
            expected: { results: [21], calls: 2 },
            isEdgeCase: true,
          },
          {
            description: "a single function works",
            args: [[["mul", 3]], [{ args: [4] }]],
            expected: { results: [12], calls: 1 },
          },
          {
            description: "50,000 functions don't overflow the stack",
            args: [Array.from({ length: 50000 }, () => ["add", 1]), [{ args: [0] }]],
            expected: { results: [50000], calls: 50000 },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "js-array-methods-map-filter-reduce",
      moduleId: "fe-js-core",
      trackId: "frontend",
      title: "`map`, `filter` & `reduce`",
      summary:
        "`map`, `filter` and `reduce` are the workhorse higher-order functions for arrays. `map` transforms each element one-to-one into a new array of the same length, `filter` keeps the elements whose callback returns something truthy, and `reduce` folds the whole array into a single value of any shape: a sum, a maximum, an object keyed by id, a grouped index. None of them mutates the source array, which makes them a natural fit for React state and any code that relies on immutability.\n\nChaining (`users.filter(isActive).map(toRow)`) reads well, but every step allocates a new array and walks the data again. That rarely matters for hundreds of items; in hot paths over large arrays, a single loop or one `reduce` avoids the intermediate arrays, and ES2025 iterator helpers (`arr.values().filter(f).map(g)`) give lazy, single-pass chains. The classic `reduce` performance bug is spreading the accumulator on every iteration (`(acc, x) => ({ ...acc, [x.id]: x })`), which copies the object each time and turns a linear pass into O(n²); mutate a local accumulator instead, or use `Object.groupBy`/`Map.groupBy` (ES2024) for grouping.\n\n`reduce` also has sharp edges the spec defines precisely. With no initial value it seeds the accumulator from the first present element and starts at the next index, and on an empty array it throws a TypeError, so pass an initial value whenever the array might be empty. Whether one was provided is decided by argument count, so an explicit `undefined` counts. All three skip holes in sparse arrays and capture the length before iterating. And `async` callbacks don't do what people hope: `map` returns an array of promises that still needs `Promise.all`, and an `async` predicate makes `filter` keep everything, because a promise is always truthy.",
      level: "advanced",
      estMinutes: 70,
      webRefs: [
        { label: "MDN: Array.prototype.reduce()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce", kind: "docs" },
        { label: "MDN: Object.groupBy()", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy", kind: "docs" },
        { label: "javascript.info: Array methods", url: "https://javascript.info/array-methods", kind: "article" },
        { label: "sudheerj: JavaScript Interview Questions", url: "https://github.com/sudheerj/javascript-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "map, filter & reduce 🙏 Namaste JavaScript Ep. 19 🔥",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=zdp0zrpKzIE",
        videoId: "zdp0zrpKzIE",
        durationLabel: "37:42",
      },
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `myReduce(array, callback, initialValue)` with the same semantics as `array.reduce(callback, initialValue)`, without calling the built-in `reduce` or `reduceRight` (the driver replaces them with versions that throw while your code runs).\n\n- If `callback` isn't a function, throw a `TypeError`.\n- Call `callback(accumulator, element, index, array)` for each element, passing the original array, and return the final accumulator.\n- An initial value counts as provided whenever the third argument was passed, even if it's `undefined` (check `arguments.length`, not the value).\n- Without an initial value, the first present element becomes the accumulator and iteration starts at the element after it. If there's no present element at all, throw a `TypeError`.\n- Skip holes: indices that aren't in the array (`!(i in array)`) are never visited.\n- Read the length once, before iterating: elements appended during the reduce aren't visited.\n\nThe tests call `runReduce`, which builds the array (deleting indices to make holes), picks a reducer by name, records every `[index, element]` your callback receives and reports thrown errors by name. Leave the driver as it is.",
        starterCode:
          "/**\n * Behaves like array.reduce(callback, initialValue) without calling the built-in.\n * @param {Array} array\n * @param {Function} callback (accumulator, element, index, array) => newAccumulator\n * @param {*} [initialValue]\n */\nfunction myReduce(array, callback, initialValue) {\n  // Your code here\n}\n\n// ---- Test driver (leave as is) ----\nfunction runReduce(values, reducerName, initialMode, initialValue, holes) {\n  const array = values.slice();\n  for (const index of holes || []) delete array[index];\n  const visits = [];\n  const reducers = {\n    sum: (acc, x) => acc + x,\n    describe: (acc, x) => acc + \"+\" + x,\n    groupParity: (acc, x) => {\n      const key = x % 2 === 0 ? \"even\" : \"odd\";\n      if (!acc[key]) acc[key] = [];\n      acc[key].push(x);\n      return acc;\n    },\n    appendOnFirst: (acc, x, i, arr) => {\n      if (i === 0) arr.push(100);\n      return acc + x;\n    },\n  };\n  const reducer = reducers[reducerName];\n  const callback = reducer\n    ? function (acc, x, i, arr) {\n        visits.push(arr === array ? [i, x] : [\"wrong array\", i]);\n        return reducer(acc, x, i, arr);\n      }\n    : reducerName; // not a function: myReduce should throw a TypeError\n  const builtins = [Array.prototype.reduce, Array.prototype.reduceRight];\n  Array.prototype.reduce = Array.prototype.reduceRight = function () {\n    throw new Error(\"Don't call the built-in reduce\");\n  };\n  try {\n    const result =\n      initialMode === \"none\"\n        ? myReduce(array, callback)\n        : myReduce(array, callback, initialMode === \"undefined\" ? undefined : initialValue);\n    return { result, visits };\n  } catch (err) {\n    return { error: err.name, visits };\n  } finally {\n    Array.prototype.reduce = builtins[0];\n    Array.prototype.reduceRight = builtins[1];\n  }\n}\n",
        functionName: "runReduce",
        testCases: [
          {
            description: "sums with an initial value",
            args: [[1, 2, 3, 4], "sum", "value", 10],
            expected: { result: 20, visits: [[0, 1], [1, 2], [2, 3], [3, 4]] },
          },
          {
            description: "without an initial value the first element seeds the accumulator",
            args: [[1, 2, 3, 4], "sum", "none", null],
            expected: { result: 10, visits: [[1, 2], [2, 3], [3, 4]] },
          },
          {
            description: "builds an object (group by parity)",
            args: [[1, 2, 3, 4, 5], "groupParity", "value", {}],
            expected: { result: { odd: [1, 3, 5], even: [2, 4] }, visits: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] },
          },
          {
            description: "an explicit `undefined` initial value still counts as provided",
            args: [[1, 2], "describe", "undefined", null],
            expected: { result: "undefined+1+2", visits: [[0, 1], [1, 2]] },
            isEdgeCase: true,
          },
          {
            description: "an empty array without an initial value throws a TypeError",
            args: [[], "sum", "none", null],
            expected: { error: "TypeError", visits: [] },
            isEdgeCase: true,
          },
          {
            description: "an empty array with an initial value returns it without calling back",
            args: [[], "sum", "value", 0],
            expected: { result: 0, visits: [] },
            isEdgeCase: true,
          },
          {
            description: "holes are skipped, including a leading one when there's no initial value",
            args: [[9, 1, 9, 2, 9], "sum", "none", null, [0, 2]],
            expected: { result: 12, visits: [[3, 2], [4, 9]] },
            isEdgeCase: true,
          },
          {
            description: "an array of only holes with no initial value throws a TypeError",
            args: [[1, 2], "sum", "none", null, [0, 1]],
            expected: { error: "TypeError", visits: [] },
            isEdgeCase: true,
          },
          {
            description: "elements appended during the reduce aren't visited",
            args: [[1, 2, 3], "appendOnFirst", "value", 0],
            expected: { result: 6, visits: [[0, 1], [1, 2], [2, 3]] },
            isEdgeCase: true,
          },
          {
            description: "a callback that isn't a function throws a TypeError",
            args: [[1, 2], "notAFunction", "value", 0],
            expected: { error: "TypeError", visits: [] },
            isEdgeCase: true,
          },
        ],
      },
    },
  ],
} satisfies Module;
