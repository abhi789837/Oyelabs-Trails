import type { Module } from "@/types/curriculum";

export default {
  id: "be-node-core",
  trackId: "backend",
  name: "Node.js Core",
  description:
    "The runtime underneath every Node framework: V8 and libuv, the module systems, the event loop's phases, emitters and streams, raw HTTP, parallelism and debugging. Written against Node 24 LTS for engineers who want to know why Node behaves the way it does.",
  refs: [
    { label: "Node.js: API documentation", url: "https://nodejs.org/docs/latest/api/", kind: "docs" },
    { label: "Node.js: Learn", url: "https://nodejs.org/learn", kind: "docs" },
    {
      label: "Node.js: Don't Block the Event Loop (or the Worker Pool)",
      url: "https://nodejs.org/learn/asynchronous-work/dont-block-the-event-loop",
      kind: "article",
    },
  ],
  topics: [
    {
      id: "node-runtime-libuv",
      moduleId: "be-node-core",
      trackId: "backend",
      title: "The Node.js Runtime & libuv",
      summary:
        "Node is V8, which compiles and runs your JavaScript on one main thread, plus libuv, a C library that provides the event loop and cross-platform async I/O, plus bindings and a standard library that join them. \"Single-threaded\" describes only where your JavaScript runs: there is one call stack, so a CPU-heavy loop, a `readFileSync` on a hot path or a catastrophic regex freezes every request the process is serving. The concurrency comes from not waiting. Sockets are registered with the kernel's readiness APIs (epoll on Linux, kqueue on macOS, IOCP on Windows), and the loop runs your callback when the OS reports activity, which is how one process holds thousands of idle connections.\n\nSome operations have no portable non-blocking OS API, so libuv also keeps a threadpool of 4 threads by default. It runs file system calls, `dns.lookup()` (a blocking `getaddrinfo` underneath), async crypto such as `pbkdf2`, `scrypt` and `randomBytes`, and `zlib`. Network sockets never use it, and neither does `dns.resolve()`. This explains a classic production mystery: a burst of password hashes saturates the four threads, and suddenly outbound HTTP calls stall before connecting, because resolving the hostname is queued behind the hashes. `UV_THREADPOOL_SIZE` raises the pool (up to 1024), but it must be set in the environment before Node starts; assigning `process.env.UV_THREADPOOL_SIZE` in your code isn't guaranteed to work.\n\nThe working rule is that the main thread orchestrates and never computes for long. Keep per-request work small, use async APIs, move CPU-bound work to worker threads or another service, and measure event-loop delay with `perf_hooks.monitorEventLoopDelay()` instead of guessing. Target Node 24, the Active LTS line.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        {
          label: "Node.js: Don't Block the Event Loop (or the Worker Pool)",
          url: "https://nodejs.org/learn/asynchronous-work/dont-block-the-event-loop",
          kind: "docs",
        },
        { label: "Node.js CLI: UV_THREADPOOL_SIZE", url: "https://nodejs.org/docs/latest/api/cli.html#uv_threadpool_sizesize", kind: "docs" },
        { label: "libuv: Design overview", url: "https://docs.libuv.org/en/v1.x/design.html", kind: "article" },
        { label: "libuv: Thread pool work scheduling", url: "https://docs.libuv.org/en/v1.x/threadpool.html", kind: "docs" },
      ],
      video: {
        title: "When is NodeJS Single-Threaded and when is it Multi-Threaded?",
        channel: "Hussein Nasser",
        url: "https://www.youtube.com/watch?v=gMtchRodC2I",
        videoId: "gMtchRodC2I",
        durationLabel: "18:42",
      },
      alternateVideos: [
        {
          title: "Node.js Tutorial - 39 - Thread Pool",
          channel: "Codevolution",
          url: "https://www.youtube.com/watch?v=I1sqnbJ1Fno",
          videoId: "I1sqnbJ1Fno",
          durationLabel: "8:41",
        },
        {
          title: "How NodeJS Works?",
          channel: "Piyush Garg",
          url: "https://www.youtube.com/watch?v=y0aTs56DJWk",
          videoId: "y0aTs56DJWk",
          durationLabel: "14:22",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "node-runtime-libuv-q1",
          prompt:
            "This runs with default settings on an 8-core machine, and one hash takes about 200 ms. Roughly when do the callbacks fire?\n\n```js\nconst crypto = require(\"node:crypto\");\nconst start = Date.now();\nfor (let i = 1; i <= 6; i++) {\n  crypto.pbkdf2(\"pw\", \"salt\", 300000, 64, \"sha512\", () => {\n    console.log(i, Date.now() - start);\n  });\n}\n```",
          options: [
            "Four finish around 200 ms and the other two around 400 ms",
            "All six finish around 200 ms because the machine has 8 cores",
            "They finish one at a time, about 200 ms apart, because JavaScript is single-threaded",
            "All six finish around 1,200 ms because `pbkdf2` blocks the event loop",
          ],
          correctIndex: 0,
          explanation:
            "Async `pbkdf2` runs on libuv's threadpool, which has 4 threads by default no matter how many cores you have, so hashes 5 and 6 wait for a free thread. Starting Node with `UV_THREADPOOL_SIZE=6` lets all six run at once.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-runtime-libuv-q2",
          prompt: "Which of these run on libuv's threadpool? (Select all that apply.)",
          options: [
            "`fs.readFile()`",
            "`dns.lookup()`, which Node uses by default when you connect to a hostname",
            "`zlib.gzip()`",
            "Reading data from a TCP socket",
            "`dns.resolve4()`",
            "Firing a `setTimeout()` callback",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "File system calls, `getaddrinfo`-based `dns.lookup()` and async zlib use the pool. Sockets use the kernel's readiness notifications, `dns.resolve*()` sends DNS queries over the network without the pool, and timers are managed by the loop itself.",
        },
        {
          id: "node-runtime-libuv-q3",
          prompt:
            "Why doesn't this reliably give you a 16-thread pool?\n\n```js\nprocess.env.UV_THREADPOOL_SIZE = \"16\";\nconst fs = require(\"node:fs\");\n```",
          options: [
            "The pool may already exist by the time user code runs, so the variable must be set in the environment before Node starts",
            "`UV_THREADPOOL_SIZE` can't exceed the number of CPU cores",
            "Environment variables must be numbers, and this assigns a string",
            "The pool size can only be changed with `--max-old-space-size`",
          ],
          correctIndex: 0,
          explanation:
            "Node's docs warn that setting it from inside the process isn't guaranteed to work because the threadpool can be created during startup. Set it outside (`UV_THREADPOOL_SIZE=16 node app.js`); the maximum is 1024 and has nothing to do with the core count.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-runtime-libuv-q4",
          prompt:
            "An API's p99 latency spikes whenever one endpoint runs `JSON.parse` on a 50 MB upload. The other endpoints are small and fast. Why do they slow down too?",
          options: [
            "`JSON.parse` runs synchronously on the main thread, so every other request waits until it finishes",
            "JSON parsing runs on the threadpool and exhausts its 4 threads",
            "V8's garbage collector runs on the threadpool and blocks file reads",
            "The HTTP server processes one route at a time by design",
          ],
          correctIndex: 0,
          explanation:
            "All JavaScript, including `JSON.parse`, runs on the one main thread, so a long parse blocks the event loop for everyone. Cap body sizes, parse in a worker thread, or stream-parse large documents.",
        },
        {
          id: "node-runtime-libuv-q5",
          prompt: "What exactly is single-threaded about Node?",
          options: [
            "Your JavaScript runs on one main thread with one call stack; libuv and V8 use extra threads internally",
            "The whole Node process uses exactly one OS thread",
            "Node can only ever use one CPU core, even with worker threads",
            "Only one network connection can be open at a time",
          ],
          correctIndex: 0,
          explanation:
            "A Node process has threadpool threads plus V8's garbage collection and compiler threads, and `worker_threads` or `cluster` can use every core. What's single is the thread running your event-loop callbacks.",
        },
        {
          id: "node-runtime-libuv-q6",
          prompt: "How does one Node process hold 10,000 idle WebSocket connections without 10,000 threads?",
          options: [
            "The sockets are registered with the OS's event notification mechanism (epoll, kqueue or IOCP), and the loop wakes only when one has activity",
            "Each socket borrows a threadpool thread, and the pool grows on demand",
            "V8 time-slices between sockets like an OS scheduler",
            "Connections wait in a queue and are served one at a time",
          ],
          correctIndex: 0,
          explanation:
            "Readiness-based I/O lets one thread watch many sockets and run callbacks only for those with data. Idle connections cost memory for their buffers and state, not a thread each.",
        },
        {
          id: "node-runtime-libuv-q7",
          prompt:
            "Under load, a service's `https.get(\"https://payments.internal/charge\")` calls stall before any TCP connection opens, while CPU stays low. The same process runs many `crypto.scrypt()` password hashes. What's a likely cause?",
          options: [
            "Hostname resolution through `dns.lookup()` is queued behind the hashes on the saturated threadpool",
            "TLS handshakes run on the threadpool and wait behind the hashes",
            "The poll phase is disabled while crypto work is running",
            "`https` limits each process to 4 concurrent sockets by default",
          ],
          correctIndex: 0,
          explanation:
            "`scrypt` and `dns.lookup()` share the same 4 threads, so lookups wait for hashes to finish even though the CPU looks idle to the main thread. Fixes: a larger pool set at startup, caching resolved addresses, or moving hashing elsewhere. The default agent has no 4-socket limit.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-runtime-libuv-q8",
          prompt: "Which gives you a direct signal that the event loop is being blocked in production?",
          options: [
            "An event-loop delay histogram from `perf_hooks.monitorEventLoopDelay()`",
            "`os.loadavg()`",
            "`process.memoryUsage()`",
            "The number of open file descriptors",
          ],
          correctIndex: 0,
          explanation:
            "Event-loop delay measures how late the loop runs scheduled work, which is exactly what blocking causes. Load average and memory are host- or heap-level signals that can look normal while one long callback stalls every request.",
        },
        {
          id: "node-runtime-libuv-q9",
          prompt: "Which component compiles and runs your JavaScript, and which provides the event loop?",
          options: [
            "V8 runs JavaScript; libuv provides the event loop and async I/O",
            "libuv runs JavaScript; V8 provides the event loop",
            "V8 does both; libuv is only used on Windows",
            "The OS kernel runs the event loop; V8 handles file I/O",
          ],
          correctIndex: 0,
          explanation:
            "V8 is a JavaScript engine with no I/O or event loop of its own; embedders supply those. In Node that's libuv, which is also why Node's loop differs from a browser's.",
        },
        {
          id: "node-runtime-libuv-q10",
          prompt: "What's the right way to handle a CPU-heavy image-resize endpoint written in pure JavaScript?",
          options: [
            "Run the resize in a pool of worker threads, or a separate service fed by a queue, so the main thread keeps serving requests",
            "Wrap the resize in `setImmediate` so it runs later",
            "Wrap the resize in a Promise so it runs in parallel",
            "Increase `UV_THREADPOOL_SIZE` so the resize gets more threads",
          ],
          correctIndex: 0,
          explanation:
            "`setImmediate` and Promises only change when the code runs; it still runs on the main thread. The threadpool runs libuv's native tasks, never your JavaScript, so resizing it doesn't help.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "node-modules-cjs-esm",
      moduleId: "be-node-core",
      trackId: "backend",
      title: "CommonJS vs ES Modules in Node",
      summary:
        "Node has two module systems. CommonJS (`require`, `module.exports`) wraps each file in a function, which is where `__dirname`, `__filename`, `require` and `module` come from; it loads synchronously, runs a file the first time it's required and caches `module.exports`, so every later `require` gets the same object. ES modules (`import`/`export`) are the language standard: imports are static and hoisted, bindings are live, the whole graph is linked before any code runs, top-level `await` works, and code is always in strict mode.\n\nNode decides per file. `.mjs` is ESM and `.cjs` is CommonJS; `.js` follows the nearest `package.json` `\"type\"` (`\"module\"` or `\"commonjs\"`). With no `type`, Node tries CommonJS and re-parses as ESM if it finds ESM syntax, which costs startup time, so set `type` explicitly. ESM has no `__dirname`, `require` or `module`: use `import.meta.dirname` and `import.meta.filename` (stable since Node 24) or `createRequire`. Relative imports need the extension (`./db.js`), and JSON needs `with { type: \"json\" }`.\n\nInterop is where teams get hurt. ESM can import CommonJS: the default import is `module.exports`, and named imports work only when Node's static analysis can detect them. Node 20.19+, 22.12+ and 24 can also `require()` an ES module synchronously, ending the old `ERR_REQUIRE_ESM` wall, except when its graph uses top-level await (`ERR_REQUIRE_ASYNC_MODULE`; use `import()`). Packages that ship both formats risk the dual-package hazard: two copies of module state, so singletons duplicate and `instanceof` fails across them. Import built-ins with the `node:` prefix: it can't be shadowed by an npm package, and newer modules like `node:test` and `node:sqlite` only exist under it.",
      level: "advanced",
      estMinutes: 70,
      webRefs: [
        { label: "Node.js: Modules: CommonJS modules", url: "https://nodejs.org/docs/latest/api/modules.html", kind: "docs" },
        { label: "Node.js: Modules: ECMAScript modules", url: "https://nodejs.org/docs/latest/api/esm.html", kind: "docs" },
        { label: "Node.js: Modules: Packages", url: "https://nodejs.org/docs/latest/api/packages.html", kind: "docs" },
        {
          label: "Joyee Cheung: require(esm) in Node.js, from experiment to stability",
          url: "https://joyeecheung.github.io/blog/2025/12/30/require-esm-in-node-js-from-experiment-to-stability/",
          kind: "article",
        },
      ],
      video: {
        title: "Node.js and Express.js - Full Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
        videoId: "Oe421EPjeBE",
        durationLabel: "8:16:47",
        startSeconds: 1774,
        chapterLabel: "Modules Setup",
      },
      alternateVideos: [
        {
          title: "Node.js Tutorial - 16 - ES Modules",
          channel: "Codevolution",
          url: "https://www.youtube.com/watch?v=g98XlFOiXz0",
          videoId: "g98XlFOiXz0",
          durationLabel: "9:45",
        },
        {
          title: "Import vs Require: The Biggest JavaScript Divide",
          channel: "Matt Pocock",
          url: "https://www.youtube.com/watch?v=6_JNPmjSevo",
          videoId: "6_JNPmjSevo",
          durationLabel: "4:02",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "node-modules-cjs-esm-q1",
          prompt: "What does `require(\"./config.cjs\")` return?\n\n```js\n// config.cjs\nexports = { port: 3000 };\n```",
          options: ["`{}`", "`{ port: 3000 }`", "`undefined`", "It throws a `TypeError`"],
          correctIndex: 0,
          explanation:
            "`exports` is a local variable that starts out pointing at `module.exports`. Reassigning it only rebinds the variable, so `module.exports` is still the original empty object. Use `module.exports = { port: 3000 }`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-modules-cjs-esm-q2",
          prompt:
            "This file lives in a package with `\"type\": \"module\"`. What happens when it runs?\n\n```js\nimport path from \"node:path\";\nconsole.log(path.join(__dirname, \"data.json\"));\n```",
          options: [
            "It throws `ReferenceError: __dirname is not defined`",
            "It logs the directory containing the file, then `data.json`",
            "It logs a path relative to the current working directory",
            "It logs `undefined/data.json`",
          ],
          correctIndex: 0,
          explanation:
            "`__dirname` comes from CommonJS's module wrapper, which ES modules don't have. Use `path.join(import.meta.dirname, \"data.json\")`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-modules-cjs-esm-q3",
          prompt: "Which statements about module interop in Node 24 are true? (Select all that apply.)",
          options: [
            "An ES module can `import` a CommonJS module, and its default import is `module.exports`",
            "CommonJS can `require()` an ES module that doesn't use top-level `await`",
            "`require()` of an ES module whose graph uses top-level `await` throws `ERR_REQUIRE_ASYNC_MODULE`",
            "CommonJS can only load ES modules through a bundler",
            "Dynamic `import()` isn't available inside CommonJS files",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`require(esm)` is unflagged in Node 20.19+, 22.12+ and 24 for synchronous module graphs; top-level await makes a graph asynchronous, so `require` refuses it. `import()` works in both module systems and is the escape hatch for async graphs.",
        },
        {
          id: "node-modules-cjs-esm-q4",
          prompt:
            "A `.js` file sits under a `package.json` with no `type` field and starts with `import fs from \"node:fs\";`. What does Node 24 do?",
          options: [
            "Tries it as CommonJS, detects ES module syntax and runs it as an ES module",
            "Throws `SyntaxError: Cannot use import statement outside a module`",
            "Runs it as CommonJS and ignores the import statement",
            "Treats every `.js` file as ESM, since that's the default from Node 22",
          ],
          correctIndex: 0,
          explanation:
            "Syntax detection has been on by default since Node 22.7 and 20.19, so ambiguous files that contain ESM syntax are re-run as ESM. It works, but costs startup time, which is why packages should always set `type`.",
        },
        {
          id: "node-modules-cjs-esm-q5",
          prompt:
            "What does `main.cjs` print?\n\n```js\n// counter.cjs\nlet count = 0;\nmodule.exports = { count, inc: () => ++count };\n\n// main.cjs\nconst c = require(\"./counter.cjs\");\nc.inc();\nc.inc();\nconsole.log(c.count);\n```",
          options: ["`0`", "`2`", "`1`", "`undefined`"],
          correctIndex: 0,
          explanation:
            "The object literal copied `count`'s value (0) into a property when the module ran. `inc` increments the module's local variable, which the property doesn't track. CommonJS exports values, not live bindings.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-modules-cjs-esm-q6",
          prompt:
            "The same counter as ES modules. What does `main.mjs` print?\n\n```js\n// counter.mjs\nexport let count = 0;\nexport const inc = () => ++count;\n\n// main.mjs\nimport { count, inc } from \"./counter.mjs\";\ninc();\ninc();\nconsole.log(count);\n```",
          options: ["`2`", "`0`", "It throws because imported bindings are read-only", "`undefined`"],
          correctIndex: 0,
          explanation:
            "ESM imports are live, read-only views of the exporter's bindings, so the importer sees `count` after `inc()` updates it. Only assigning to `count` in `main.mjs` would throw a `TypeError`.",
        },
        {
          id: "node-modules-cjs-esm-q7",
          prompt: "Which is a real benefit of importing built-ins with the `node:` prefix?",
          options: [
            "It always resolves to the built-in, can't be shadowed by a dependency with the same name, and is required for newer built-ins like `node:test`",
            "It loads the ES module version of the built-in, while the bare name loads CommonJS",
            "It makes the import lazy, so the module loads on first use",
            "It's required to get the promise-based APIs",
          ],
          correctIndex: 0,
          explanation:
            "Built-ins like `node:test`, `node:sqlite` and `node:sea` can only be loaded with the prefix; `require(\"test\")` looks for an npm package. The prefix doesn't change the module format or load timing.",
        },
        {
          id: "node-modules-cjs-esm-q8",
          prompt:
            "A library ships separate CommonJS and ESM builds through `exports` conditions. Your app `import`s it while one of your dependencies `require`s it. What can go wrong?",
          options: [
            "Two separate instances load, so module-level state (singletons, caches, class identity for `instanceof`) is duplicated",
            "Node throws a dual-package error at startup",
            "The ESM build is silently ignored",
            "Nothing: Node deduplicates packages by name",
          ],
          correctIndex: 0,
          explanation:
            "This is the dual-package hazard: the two builds are different files, so each gets its own module instance. An error class from one copy fails `instanceof` against the other. Shipping ESM only, now that `require(esm)` works, avoids it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-modules-cjs-esm-q9",
          prompt: "How do you load `config.json` from an ES module in Node 24?",
          options: [
            "`import config from \"./config.json\" with { type: \"json\" };`",
            "`import config from \"./config.json\";`, which works exactly like `require`",
            "`const config = require(\"./config.json\");`, because `require` is available in ESM",
            "`import config from \"./config\";`, with the extension resolved automatically",
          ],
          correctIndex: 0,
          explanation:
            "JSON modules require the import attribute; without it Node throws `ERR_IMPORT_ATTRIBUTE_MISSING`. ESM has no `require` (use `createRequire` if needed) and doesn't guess file extensions.",
        },
        {
          id: "node-modules-cjs-esm-q10",
          prompt:
            "What does running `main.cjs` print?\n\n```js\n// a.cjs\nconsole.log(\"a loaded\");\nmodule.exports = 1;\n\n// main.cjs\nrequire(\"./a.cjs\");\nrequire(\"./a.cjs\");\nconsole.log(\"done\");\n```",
          options: [
            "`a loaded` once, then `done`",
            "`a loaded` twice, then `done`",
            "Only `done`, because the results are unused",
            "`done`, then `a loaded`",
          ],
          correctIndex: 0,
          explanation:
            "A module runs on its first `require` and is cached by its resolved filename, so the second call returns the cached `module.exports` without running the file again.",
        },
      ],
    },
    {
      id: "node-fs-path-os",
      moduleId: "be-node-core",
      trackId: "backend",
      title: "The fs, path & os Modules",
      summary:
        "`fs`, `path` and `os` are where Node touches the machine, and most of their bugs come from assuming a particular machine or working directory. `path` exists because separators, roots and normalization rules differ: `path.join()` concatenates and normalizes, while `path.resolve()` works right to left until it has an absolute path and falls back to `process.cwd()`, so `path.resolve(\"/a\", \"/b\", \"c\")` is `/b/c`. Relative paths passed to `fs` resolve against the process's working directory, not the file's location, which is why a script that works from its own folder breaks under a process manager or in Docker; anchor paths to `import.meta.dirname` (or `__dirname`). And `path.join(uploadsDir, req.params.name)` is no security boundary: `../../etc/passwd` normalizes straight out of the folder, so resolve the result and check it still starts with the intended root.\n\n`fs` has three API styles. Synchronous calls such as `readFileSync` block the event loop and belong only in startup code and CLIs. Callback and `node:fs/promises` calls run on libuv's threadpool, so thousands of concurrent file operations queue behind four threads, and `readFile` loads the whole file into memory, so stream large files instead. Check-then-act (`existsSync`, then `writeFile`) is a race: open with the flag you mean (`wx` fails if the file exists) and handle error codes like `ENOENT` and `EEXIST`. `fs.watch` behaves differently across platforms, which is why watcher libraries exist.\n\n`os` describes the host: `os.availableParallelism()` for sizing worker pools, `os.tmpdir()`, `os.homedir()`, `os.EOL`, memory and network interfaces. Reach for `path.posix` when you need POSIX rules everywhere, such as URL paths or archive entries, even on Windows.",
      level: "intermediate",
      estMinutes: 80,
      webRefs: [
        { label: "Node.js: Path", url: "https://nodejs.org/docs/latest/api/path.html", kind: "docs" },
        { label: "Node.js: File system", url: "https://nodejs.org/docs/latest/api/fs.html", kind: "docs" },
        { label: "Node.js: OS", url: "https://nodejs.org/docs/latest/api/os.html", kind: "docs" },
        { label: "Node.js Learn: Node.js file paths", url: "https://nodejs.org/learn/manipulating-files/nodejs-file-paths", kind: "article" },
      ],
      video: {
        title: "Node.js and Express.js - Full Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
        videoId: "Oe421EPjeBE",
        durationLabel: "8:16:47",
        startSeconds: 3227,
        chapterLabel: "Built-In Module Intro",
      },
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `normalizePath(p)` so it returns exactly what Node's `path.posix.normalize(p)` returns, without using `node:path` (it isn't available in the browser sandbox). This is the logic behind `path.join` and behind every path-traversal check, so the edge cases matter.\n\n- Only `/` is a separator. Runs of slashes collapse into one; a backslash is an ordinary character.\n- `.` segments are removed. A `..` segment removes the previous segment, as long as there is one and it isn't itself `..`.\n- In an absolute path (starting with `/`), a `..` at the root is dropped: you can't climb above `/`. In a relative path, `..` segments that can't be resolved stay at the front, so `../../x/../y` becomes `../../y`.\n- Names like `...`, `.env` or `..c` are ordinary segments.\n- A trailing slash in the input is kept: `a/./b/` becomes `a/b/`.\n- If nothing is left, return `/` for an absolute path, or `.` for a relative one (`./` if the input ended with a slash). The empty string returns `.`.\n\n`p` is always a string; return a string.",
        starterCode:
          "/**\n * Normalize a POSIX path the way path.posix.normalize does.\n * @param {string} p\n * @returns {string}\n */\nfunction normalizePath(p) {\n  // Your code here\n}\n",
        functionName: "normalizePath",
        testCases: [
          {
            description: "Node's docs example: collapses `//` and resolves `..`",
            args: ["/foo/bar//baz/asdf/quux/.."],
            expected: "/foo/bar/baz/asdf",
          },
          { description: "removes `.` and resolves `..` in a relative path", args: ["src/./lib/../index.js"], expected: "src/index.js" },
          { description: "keeps a trailing slash", args: ["a/./b/"], expected: "a/b/" },
          { description: "collapses repeated slashes, including leading ones", args: ["///a//b"], expected: "/a/b" },
          { description: "the empty string becomes `.`", args: [""], expected: ".", isEdgeCase: true },
          { description: "`..` can't climb above the root of an absolute path", args: ["/../../x"], expected: "/x", isEdgeCase: true },
          { description: "climbing all the way up an absolute path leaves `/`", args: ["/a/b/../../.."], expected: "/", isEdgeCase: true },
          { description: "unresolvable `..` segments stay at the front of a relative path", args: ["../../x/../y"], expected: "../../y", isEdgeCase: true },
          { description: "climbing past the start of a relative path leaves `..`", args: ["a/b/c/../../../.."], expected: "..", isEdgeCase: true },
          { description: "a relative path that cancels out keeps its trailing slash as `./`", args: ["a/../"], expected: "./", isEdgeCase: true },
          { description: "`...`, `.b` and `..c` are ordinary names", args: ["a/.../.b/..c"], expected: "a/.../.b/..c", isEdgeCase: true },
          { description: "a backslash is an ordinary character, not a separator", args: ["foo\\bar/../baz"], expected: "baz", isEdgeCase: true },
          {
            description: "200 nested folders climbed back out",
            args: ["x/" + "a/".repeat(200) + "../".repeat(200) + "y"],
            expected: "x/y",
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "node-npm-semver",
      moduleId: "be-node-core",
      trackId: "backend",
      title: "npm, package.json & Semantic Versioning",
      summary:
        "`package.json` declares what your project needs as version ranges; `package-lock.json` records exactly what was installed, down to every transitive dependency's version, source URL and integrity hash. Ranges express trust in each publisher's semver promise: MAJOR for breaking changes, MINOR for compatible features, PATCH for fixes. `^1.4.2`, the prefix npm writes by default, accepts anything `>=1.4.2 <2.0.0`; `~1.4.2` accepts patches only, `>=1.4.2 <1.5.0`. The trap is 0.x. Semver says anything may change before 1.0, so npm's caret narrows to the left-most non-zero part: `^0.4.2` means `<0.5.0`, and `^0.0.3` matches only `0.0.3`. Prereleases such as `2.0.0-beta.1` are excluded from ranges unless the range names a prerelease on the same `major.minor.patch`.\n\nCommit the lockfile for applications and install with `npm ci` in CI and Docker builds: it installs exactly what the lockfile says, fails if `package.json` and the lock disagree, removes any existing `node_modules` first and never rewrites either file. `npm install` may update the lock, so builds drift. Libraries are different: a dependency's `package-lock.json` is never published and is ignored by consumers, so your declared ranges are what users actually get.\n\nRanges are also your supply-chain exposure, since every `^` auto-accepts code from someone else's npm account. Review lockfile diffs, run `npm audit`, use `overrides` to force a transitive version when a fix or a compromised release demands it, and keep `devDependencies` out of production images with `npm ci --omit=dev`. For plugins, `peerDependencies` says \"use the host's copy\", which is how you avoid two copies of React in one bundle.",
      level: "intermediate",
      estMinutes: 85,
      webRefs: [
        { label: "npm Docs: About semantic versioning", url: "https://docs.npmjs.com/about-semantic-versioning/", kind: "docs" },
        { label: "npm Docs: npm ci", url: "https://docs.npmjs.com/cli/v11/commands/npm-ci/", kind: "docs" },
        { label: "Semantic Versioning 2.0.0", url: "https://semver.org/", kind: "spec" },
        { label: "npm/node-semver: range syntax reference", url: "https://github.com/npm/node-semver", kind: "repo" },
      ],
      video: {
        title: "Node.js and Express.js - Full Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
        videoId: "Oe421EPjeBE",
        durationLabel: "8:16:47",
        startSeconds: 6357,
        chapterLabel: "NPM Info",
      },
      alternateVideos: [
        {
          title: "Node.js Tutorial - 54 - Versioning",
          channel: "Codevolution",
          url: "https://www.youtube.com/watch?v=LuV5upokyBY",
          videoId: "LuV5upokyBY",
          durationLabel: "5:49",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `satisfies(version, range)`: a subset of npm's semver matching that returns `true` or `false`.\n\n`version` is `MAJOR.MINOR.PATCH` (non-negative integers), optionally followed by a prerelease tag such as `-beta.1`. Anything else, such as `1.2` or `a.b.c`, is malformed: return `false`.\n\nSupported ranges:\n\n- Exact: `1.2.3` (or `1.3.0-beta.1`) matches only that version.\n- Caret `^MAJOR.MINOR.PATCH` allows changes that don't touch the left-most non-zero part: `^1.2.3` is `>=1.2.3 <2.0.0`, `^0.2.3` is `>=0.2.3 <0.3.0`, and `^0.0.3` is `>=0.0.3 <0.0.4`.\n- Tilde `~MAJOR.MINOR.PATCH` allows patch updates only: `~1.2.3` is `>=1.2.3 <1.3.0`.\n- X-ranges, where `x`, `X` and `*` are interchangeable wildcards and missing parts count as wildcards: `*` or `x` matches every version, `1` or `1.x` is `>=1.0.0 <2.0.0`, and `1.2` or `1.2.x` is `>=1.2.0 <1.3.0`.\n- Any other syntax (comparators like `>=1.2.0`, `||`, hyphen ranges, or garbage like `^banana`) returns `false`.\n\nCompare parts as numbers, not strings: `1.10.0` is greater than `1.9.0`. As in npm, a version with a prerelease tag satisfies only an exact range naming that same version; it never matches a caret, tilde or x-range.",
        starterCode:
          "/**\n * @param {string} version e.g. \"1.4.2\" or \"2.0.0-beta.1\"\n * @param {string} range e.g. \"^1.2.3\", \"~0.4.0\", \"1.x\", \"*\" or \"1.2.3\"\n * @returns {boolean}\n */\nfunction satisfies(version, range) {\n  // Your code here\n}\n",
        functionName: "satisfies",
        testCases: [
          { description: "caret allows newer minor and patch versions", args: ["1.9.0", "^1.2.3"], expected: true },
          { description: "caret stops before the next major", args: ["2.0.0", "^1.2.3"], expected: false },
          { description: "a version below the caret's lower bound fails", args: ["1.2.2", "^1.2.3"], expected: false },
          { description: "parts compare as numbers, so 1.10.0 is above 1.9.0", args: ["1.10.0", "^1.9.0"], expected: true, isEdgeCase: true },
          { description: "`^0.2.3` still allows patch updates", args: ["0.2.9", "^0.2.3"], expected: true },
          { description: "`^0.2.3` does not allow 0.3.0 (the 0.x special case)", args: ["0.3.0", "^0.2.3"], expected: false, isEdgeCase: true },
          { description: "`^0.0.3` allows nothing but 0.0.3", args: ["0.0.4", "^0.0.3"], expected: false, isEdgeCase: true },
          { description: "`^0.0.3` matches 0.0.3 itself", args: ["0.0.3", "^0.0.3"], expected: true },
          { description: "tilde allows patch updates", args: ["1.2.9", "~1.2.3"], expected: true },
          { description: "tilde rejects the next minor", args: ["1.3.0", "~1.2.3"], expected: false },
          { description: "`1.x` matches any 1.y.z", args: ["1.7.4", "1.x"], expected: true },
          { description: "`X` works as a wildcard too", args: ["1.2.7", "1.2.X"], expected: true },
          { description: "`1.2.*` rejects 1.3.0", args: ["1.3.0", "1.2.*"], expected: false },
          { description: "a partial version is an x-range", args: ["1.9.9", "1.9"], expected: true },
          { description: "`*` matches any release version", args: ["9.9.9", "*"], expected: true },
          { description: "an exact range matches only that version", args: ["1.2.4", "1.2.3"], expected: false },
          { description: "a prerelease never matches a caret range", args: ["1.3.0-beta.1", "^1.2.3"], expected: false, isEdgeCase: true },
          { description: "a prerelease matches an exact range naming it", args: ["1.3.0-beta.1", "1.3.0-beta.1"], expected: true, isEdgeCase: true },
          { description: "a malformed version returns false", args: ["1.2", "^1.2.3"], expected: false, isEdgeCase: true },
          { description: "a malformed range returns false", args: ["1.2.3", "^banana"], expected: false, isEdgeCase: true },
        ],
      },
    },
    {
      id: "node-event-loop",
      moduleId: "be-node-core",
      trackId: "backend",
      title: "The Node.js Event Loop",
      summary:
        "Node's event loop is libuv's loop, and it isn't the browser's. The browser loop (the frontend `js-event-loop` topic) runs one task, drains the microtask queue, then may render a frame. Node never renders; each iteration walks fixed phases instead: **timers** (due `setTimeout`/`setInterval` callbacks), **pending callbacks** (some I/O callbacks deferred from the previous iteration), **poll** (collect I/O events and run their callbacks, blocking here when nothing else is due), **check** (`setImmediate`) and **close callbacks** (`socket.on(\"close\")`). Since libuv 1.45 (Node 20) timers run after the poll phase in each iteration, plus once before the loop starts; the cyclic order is the same.\n\nTwo queues run between callbacks rather than in a phase. After each callback Node drains the `process.nextTick` queue completely, then the promise microtask queue, repeating until both are empty; since Node 11 this happens between individual timers and immediates too, as in browsers. So in CommonJS a `nextTick` beats a `Promise.then`. In an ES module the order flips: module evaluation is itself promise-driven, so microtasks queued by top-level code drain before Node reaches the tick queue. A recursive `nextTick` starves I/O completely.\n\n`setTimeout(fn, 0)` versus `setImmediate(fn)` in the main module is a race: a zero delay becomes 1 ms, which may or may not have elapsed when the loop first checks timers. Inside an I/O callback `setImmediate` always wins, because check directly follows poll. Use `setImmediate` to yield between batches of CPU work, and remember the process exits only when nothing keeps the loop alive: a forgotten interval or open socket holds it open unless you `unref()` it.",
      level: "expert",
      estMinutes: 65,
      isMilestone: true,
      webRefs: [
        {
          label: "Node.js Learn: The Node.js Event Loop",
          url: "https://nodejs.org/learn/asynchronous-work/event-loop-timers-and-nexttick",
          kind: "docs",
        },
        {
          label: "Node.js: When to use queueMicrotask() vs. process.nextTick()",
          url: "https://nodejs.org/docs/latest/api/process.html#when-to-use-queuemicrotask-vs-processnexttick",
          kind: "docs",
        },
        {
          label: "Node.js Learn: Understanding process.nextTick()",
          url: "https://nodejs.org/learn/asynchronous-work/understanding-processnexttick",
          kind: "article",
        },
        { label: "Lydia Hallie: JavaScript Questions", url: "https://github.com/lydiahallie/javascript-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Node.js Tutorial - 42 - Event Loop",
        channel: "Codevolution",
        url: "https://www.youtube.com/watch?v=L18RHG2DwwA",
        videoId: "L18RHG2DwwA",
        durationLabel: "14:21",
      },
      alternateVideos: [
        {
          title: "Node.js Tutorials - 43 - Microtask Queues",
          channel: "Codevolution",
          url: "https://www.youtube.com/watch?v=M3sbOSJvhxg",
          videoId: "M3sbOSJvhxg",
          durationLabel: "14:29",
        },
        {
          title: "Node.js Tutorial - 47 - Check Queue",
          channel: "Codevolution",
          url: "https://www.youtube.com/watch?v=6Mu_bhHmh2Q",
          videoId: "6Mu_bhHmh2Q",
          durationLabel: "12:44",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "node-event-loop-q1",
          prompt:
            "What does this print when run as CommonJS (`node order.cjs`)?\n\n```js\nconsole.log(\"A\");\nsetTimeout(() => console.log(\"timeout\"), 0);\nsetImmediate(() => console.log(\"immediate\"));\nPromise.resolve().then(() => console.log(\"promise\"));\nprocess.nextTick(() => console.log(\"nextTick\"));\nconsole.log(\"B\");\n```",
          options: [
            "`A B nextTick promise`, then `timeout` and `immediate` in either order",
            "`A B promise nextTick timeout immediate`, always",
            "`A B nextTick promise timeout immediate`, always",
            "`A nextTick promise B timeout immediate`",
          ],
          correctIndex: 0,
          explanation:
            "Synchronous code runs first, then the tick queue, then promise microtasks. From the main module, whether the 1 ms timer is due when the loop first checks timers depends on process timing, so `timeout` and `immediate` race.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-event-loop-q2",
          prompt: "The same code is saved as `order.mjs` and run as an ES module. What prints now?",
          options: [
            "`A B promise nextTick`, then `timeout` and `immediate` in either order",
            "`A B nextTick promise`, then `timeout` and `immediate` in either order",
            "The same as CommonJS, because the module system doesn't affect scheduling",
            "`A B immediate`, then `nextTick promise timeout`",
          ],
          correctIndex: 0,
          explanation:
            "An ES module is evaluated from within a promise job, so the microtask queue is already draining when the top-level code finishes and `promise` runs before Node processes the tick queue. It's a real difference when you port CommonJS code to ESM.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-event-loop-q3",
          prompt:
            "What does this print (CommonJS)?\n\n```js\nconst fs = require(\"node:fs\");\nfs.readFile(__filename, () => {\n  setTimeout(() => console.log(\"timeout\"), 0);\n  setImmediate(() => console.log(\"immediate\"));\n  process.nextTick(() => console.log(\"nextTick\"));\n});\n```",
          options: [
            "`nextTick immediate timeout`, every time",
            "`nextTick timeout immediate`, every time",
            "`immediate nextTick timeout`, every time",
            "`nextTick`, then `timeout` and `immediate` in either order",
          ],
          correctIndex: 0,
          explanation:
            "The callback runs in the poll phase. The tick queue drains as soon as it returns, then the loop moves to check (`setImmediate`) before it gets back to timers, so inside an I/O callback the order is deterministic.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-event-loop-q4",
          prompt:
            "What does this print (CommonJS)?\n\n```js\nPromise.resolve().then(() => {\n  console.log(\"p1\");\n  process.nextTick(() => console.log(\"tick from promise\"));\n  Promise.resolve().then(() => console.log(\"p2\"));\n});\nprocess.nextTick(() => {\n  console.log(\"t1\");\n  process.nextTick(() => console.log(\"t2\"));\n});\n```",
          options: [
            "`t1 t2 p1 p2 tick from promise`",
            "`t1 p1 t2 p2 tick from promise`",
            "`t1 t2 p1 tick from promise p2`",
            "`p1 p2 t1 t2 tick from promise`",
          ],
          correctIndex: 0,
          explanation:
            "Node drains the whole tick queue first, including ticks added while draining (`t2`). Then V8 drains the microtask queue, including microtasks added meanwhile (`p2`). Only after that does Node look at the tick queue again and find `tick from promise`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-event-loop-q5",
          prompt:
            "What does this print on a current Node version?\n\n```js\nsetTimeout(() => {\n  console.log(\"timeout 1\");\n  Promise.resolve().then(() => console.log(\"promise\"));\n}, 0);\nsetTimeout(() => console.log(\"timeout 2\"), 0);\n```",
          options: [
            "`timeout 1 promise timeout 2`",
            "`timeout 1 timeout 2 promise`",
            "`promise timeout 1 timeout 2`",
            "It depends on system load",
          ],
          correctIndex: 0,
          explanation:
            "Since Node 11, microtasks drain after each individual timer callback, matching browsers. Before Node 11 all due timers ran first, which printed `timeout 1 timeout 2 promise`; old blog posts still show that.",
        },
        {
          id: "node-event-loop-q6",
          prompt: "Which statements about Node's event-loop phases are true? (Select all that apply.)",
          options: [
            "`setImmediate` callbacks run in the check phase, right after poll",
            "The loop blocks in the poll phase waiting for I/O when no timers or immediates are due",
            "`socket.on(\"close\")` callbacks run in the close callbacks phase",
            "`process.nextTick` callbacks run in a dedicated phase between timers and poll",
            "A timer callback is guaranteed to run exactly when its delay expires",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The tick queue isn't a phase: it drains after every callback, whatever the phase. A timer's delay is a minimum; the callback runs on the first timers pass after the delay has elapsed, later if the loop is busy.",
        },
        {
          id: "node-event-loop-q7",
          prompt:
            "What happens when this runs (CommonJS)?\n\n```js\nfunction spin() {\n  process.nextTick(spin);\n}\nspin();\nsetTimeout(() => console.log(\"timeout\"), 0);\nrequire(\"node:fs\").readFile(__filename, () => console.log(\"read\"));\n```",
          options: [
            "Nothing is ever printed: the tick queue never empties, so the loop never advances to timers or I/O",
            "`timeout`, then `read`",
            "It throws `RangeError: Maximum call stack size exceeded`",
            "Node detects the recursion and moves on after 1,000 ticks",
          ],
          correctIndex: 0,
          explanation:
            "Each `spin` runs from the queue rather than nested on the stack, so there's no stack overflow, just starvation: Node keeps draining a queue that refills itself. An endlessly self-scheduling promise chain does the same.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-event-loop-q8",
          prompt:
            "Which statement correctly contrasts Node's event loop with the browser's (covered in the frontend `js-event-loop` topic)?",
          options: [
            "Browsers interleave rendering steps between tasks; Node has phases for timers, I/O polling, `setImmediate` and close callbacks, plus the Node-only `process.nextTick` queue",
            "Browsers have no microtask queue; only Node does",
            "Node runs promise callbacks only after all timers, while browsers run them first",
            "They're identical, because both are implemented inside V8",
          ],
          correctIndex: 0,
          explanation:
            "Both drain microtasks after every task or callback. The differences are what surrounds that: rendering and `requestAnimationFrame` in browsers; libuv phases, `setImmediate` and `nextTick` in Node. V8 has no event loop of its own; each embedder supplies one.",
        },
        {
          id: "node-event-loop-q9",
          prompt:
            "A request handler must process 1 million records without starving other requests. Which way of splitting the work actually lets pending I/O run between batches?",
          options: [
            "Process a batch, then schedule the next batch with `setImmediate`",
            "Process a batch, then schedule the next batch with `process.nextTick`",
            "Process a batch, then `await Promise.resolve()` before the next one",
            "Wrap each record's processing in its own Promise",
          ],
          correctIndex: 0,
          explanation:
            "Ticks and promise continuations run before the loop moves on, so they never yield to I/O. `setImmediate` puts the next batch in the check phase, after the poll phase has handled waiting sockets. For truly heavy work, use a worker thread.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-event-loop-q10",
          prompt:
            "Why does this script never exit?\n\n```js\nsetInterval(() => {\n  flushMetrics();\n}, 10_000);\nconsole.log(\"done\");\n```",
          options: [
            "The active interval keeps the loop alive; call `.unref()` on it (or clear it) if it shouldn't hold the process open",
            "`console.log` keeps flushing asynchronously forever",
            "Intervals create an infinite stream of microtasks that Node waits for",
            "It does exit after the first interval fires",
          ],
          correctIndex: 0,
          explanation:
            "Node exits when there's nothing left that keeps the loop alive. Referenced timers, servers and sockets all do; `timer.unref()` tells Node not to wait for it.",
        },
        {
          id: "node-event-loop-q11",
          prompt:
            "What does this print (CommonJS)?\n\n```js\nasync function f() {\n  console.log(\"f start\");\n  await null;\n  console.log(\"f after await\");\n}\nconsole.log(\"1\");\nsetTimeout(() => console.log(\"timeout\"), 0);\nf();\nqueueMicrotask(() => console.log(\"microtask\"));\nprocess.nextTick(() => console.log(\"tick\"));\nconsole.log(\"2\");\n```",
          options: [
            "`1 f start 2 tick f after await microtask timeout`",
            "`1 2 f start tick f after await microtask timeout`",
            "`1 f start 2 f after await microtask tick timeout`",
            "`1 f start f after await 2 tick microtask timeout`",
          ],
          correctIndex: 0,
          explanation:
            "An async function runs synchronously until its first `await`, whose continuation is queued as a microtask before `queueMicrotask`'s callback. In CommonJS the tick queue drains before microtasks, and the timer comes last. As an ES module, `tick` would print after `microtask`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-event-loop-q12",
          prompt: "What changed about timers in libuv 1.45, which shipped with Node 20?",
          options: [
            "Timers run after the poll phase in each iteration, plus once before the loop starts, instead of at the start of every iteration",
            "Timer callbacks moved onto the threadpool",
            "The minimum timeout became 4 ms, as in browsers",
            "`setImmediate` became an alias for `setTimeout(fn, 0)`",
          ],
          correctIndex: 0,
          explanation:
            "Node's own event-loop guide documents the change. Because the cycle is otherwise unchanged, `setImmediate` still beats a zero timeout inside I/O callbacks, and old phase diagrams remain a good mental model.",
        },
      ],
    },
    {
      id: "node-event-emitter",
      moduleId: "be-node-core",
      trackId: "backend",
      title: "Event Emitters",
      summary:
        "`EventEmitter` is Node's built-in observer pattern and the base class of streams, HTTP servers, sockets and child processes, so its quirks show up everywhere. `emit()` is synchronous: listeners run immediately, in registration order, on the caller's stack, and `emit` returns whether the event had any listeners. It's not a queue and it's not async, so a slow listener delays whoever called `emit`, and an exception thrown by a listener propagates out of `emit` into the emitting code. Each emit works from a snapshot of the listener list: a listener removed mid-emit still runs in that emit, and one added mid-emit waits for the next.\n\nThe `error` event is special. Emitting `error` with no listener makes Node throw the error (wrapping non-Error values in `ERR_UNHANDLED_ERROR`), which usually means a crashed process. Every stream, socket or child process you create needs an `error` handler, or must be wrapped in something like `stream.pipeline()` that handles errors for you. Listening with an `async` function is another trap: its rejected promise doesn't become an `error` event unless the emitter was created with `captureRejections`.\n\nListeners are strong references. Adding a listener per request to a long-lived emitter (a shared DB client, a WebSocket hub, `process`) leaks the listeners and everything their closures hold. Node prints `MaxListenersExceededWarning` when one event gets its 11th listener, since the default maximum is 10. Raising the limit with `setMaxListeners` silences the warning, not the leak: remove listeners with `off`, or use `once`. To await a single event, `events.once(emitter, \"ready\")` returns a promise, and `events.on()` gives an async iterator over repeated events.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Node.js: Events", url: "https://nodejs.org/docs/latest/api/events.html", kind: "docs" },
        {
          label: "Node.js Learn: The Node.js Event emitter",
          url: "https://nodejs.org/learn/asynchronous-work/the-nodejs-event-emitter",
          kind: "article",
        },
      ],
      video: {
        title: "Node.js and Express.js - Full Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
        videoId: "Oe421EPjeBE",
        durationLabel: "8:16:47",
        startSeconds: 11561,
        chapterLabel: "Events Info",
      },
      alternateVideos: [
        {
          title: "Node.js Tutorial - 22 - Extending from EventEmitter",
          channel: "Codevolution",
          url: "https://www.youtube.com/watch?v=UK2uQjgsoI4",
          videoId: "UK2uQjgsoI4",
          durationLabel: "8:01",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `MiniEmitter`, a small version of Node's `EventEmitter`, with Node's semantics:\n\n- `on(event, listener)` appends a listener and returns the emitter so calls chain. The same function can be registered more than once; each registration counts.\n- `emit(event, ...args)` calls the listeners synchronously, in registration order, with `this` set to the emitter and the arguments passed through. It returns `true` if the event had listeners and `false` otherwise.\n- `emit` works from a snapshot taken when it starts: a listener removed during an emit still runs in that emit, and a listener added during an emit first runs on the next one.\n- If a listener throws, the error propagates out of `emit` and the remaining listeners don't run.\n- `once(event, listener)` registers a listener that runs at most once. It's removed before it's called, so emitting the same event from inside it doesn't call it again. Calling `off` with the original function cancels a `once` that hasn't fired. Returns the emitter.\n- `off(event, listener)` removes only the most recently added registration of that listener for that event, does nothing if there isn't one, and returns the emitter.\n- `listenerCount(event)` returns the number of registrations, `once` ones included.\n- Emitting `\"error\"` with no `error` listener throws: rethrow the first argument if it's an `Error`, otherwise throw `new Error(\"Unhandled error. (\" + String(value) + \")\")`.\n\nThe tests call `runEmitterScript`, which replays a list of steps against your class and returns a log of what happened. Leave the driver as it is.",
        starterCode:
          "class MiniEmitter {\n  /** Register `listener` for `event`; return the emitter so calls chain. */\n  on(event, listener) {\n    // Your code here\n  }\n\n  /** Register a listener that runs at most once; return the emitter. */\n  once(event, listener) {\n    // Your code here\n  }\n\n  /** Remove the most recently added registration of `listener`; return the emitter. */\n  off(event, listener) {\n    // Your code here\n  }\n\n  /** Call the listeners synchronously; return true if there were any. */\n  emit(event, ...args) {\n    // Your code here\n  }\n\n  /** Number of registrations for `event`, once listeners included. */\n  listenerCount(event) {\n    // Your code here\n  }\n}\n\n// ---- Test driver (leave as is) ----\n// Runs a script of plain-data steps against a MiniEmitter and returns a log.\n// Steps: [\"on\" | \"once\" | \"off\", event, listenerName], [\"emit\", event, ...args],\n// [\"emitError\", message] (emits \"error\" with a real Error), [\"count\", event],\n// [\"chain\", event, nameA, nameB] (checks that on() returns the emitter).\n// The special listeners (removeB, addC, reemit) act on the event \"x\".\nfunction runEmitterScript(steps) {\n  const emitter = new MiniEmitter();\n  const log = [];\n  const record = (name, args) => log.push(name + \"(\" + args.join(\",\") + \")\");\n  const fns = {\n    a: (...args) => record(\"a\", args),\n    b: (...args) => record(\"b\", args),\n    c: (...args) => record(\"c\", args),\n    removeB: (...args) => {\n      record(\"removeB\", args);\n      emitter.off(\"x\", fns.b);\n    },\n    addC: (...args) => {\n      record(\"addC\", args);\n      emitter.on(\"x\", fns.c);\n    },\n    reemit: (...args) => {\n      record(\"reemit\", args);\n      log.push(\"nested:\" + emitter.emit(\"x\", \"again\"));\n    },\n    boom: (...args) => {\n      record(\"boom\", args);\n      throw new Error(\"listener failed\");\n    },\n    self: function () {\n      log.push(\"self:\" + (this === emitter));\n    },\n  };\n  const emit = (event, args) => {\n    try {\n      log.push(\"emit:\" + event + \":\" + emitter.emit(event, ...args));\n    } catch (err) {\n      log.push(\"threw:\" + (err instanceof Error ? err.message : String(err)));\n    }\n  };\n  for (const [op, event, ...rest] of steps) {\n    if (op === \"on\" || op === \"once\" || op === \"off\") emitter[op](event, fns[rest[0]]);\n    else if (op === \"emit\") emit(event, rest);\n    else if (op === \"emitError\") emit(\"error\", [new Error(event)]);\n    else if (op === \"count\") log.push(\"count:\" + event + \":\" + emitter.listenerCount(event));\n    else if (op === \"chain\") {\n      emitter.on(event, fns[rest[0]]).on(event, fns[rest[1]]);\n      log.push(\"chained\");\n    }\n  }\n  return log;\n}\n",
        functionName: "runEmitterScript",
        testCases: [
          {
            description: "listeners run synchronously, in registration order, with the emitted arguments",
            args: [[["on", "x", "a"], ["on", "x", "b"], ["emit", "x", 1, 2]]],
            expected: ["a(1,2)", "b(1,2)", "emit:x:true"],
          },
          {
            description: "`emit` returns false when nobody listens, and events are independent",
            args: [[["on", "x", "a"], ["emit", "y", 1], ["count", "x"], ["count", "y"]]],
            expected: ["emit:y:false", "count:x:1", "count:y:0"],
          },
          {
            description: "`once` fires a single time and is removed before it runs",
            args: [[["once", "x", "reemit"], ["emit", "x", 1], ["emit", "x", 2]]],
            expected: ["reemit(1)", "nested:false", "emit:x:true", "emit:x:false"],
          },
          {
            description: "`off` removes one registration: the most recently added",
            args: [[["on", "x", "a"], ["on", "x", "b"], ["on", "x", "a"], ["off", "x", "a"], ["emit", "x", 7], ["count", "x"]]],
            expected: ["a(7)", "b(7)", "emit:x:true", "count:x:2"],
          },
          {
            description: "a listener removed during an emit still runs in that emit",
            args: [[["on", "x", "removeB"], ["on", "x", "b"], ["emit", "x", 1], ["emit", "x", 2]]],
            expected: ["removeB(1)", "b(1)", "emit:x:true", "removeB(2)", "emit:x:true"],
            isEdgeCase: true,
          },
          {
            description: "a listener added during an emit waits for the next emit",
            args: [[["on", "x", "addC"], ["emit", "x", 1], ["emit", "x", 2], ["count", "x"]]],
            expected: ["addC(1)", "emit:x:true", "addC(2)", "c(2)", "emit:x:true", "count:x:3"],
            isEdgeCase: true,
          },
          {
            description: "an unhandled `error` event throws the Error; a handled one doesn't",
            args: [[["emitError", "disk full"], ["on", "error", "a"], ["emitError", "again"]]],
            expected: ["threw:disk full", "a(Error: again)", "emit:error:true"],
            isEdgeCase: true,
          },
          {
            description: "an unhandled `error` event with a non-Error value throws a wrapping Error",
            args: [[["emit", "error", "oops"]]],
            expected: ["threw:Unhandled error. (oops)"],
            isEdgeCase: true,
          },
          {
            description: "a throwing listener propagates out of `emit` and later listeners don't run",
            args: [[["on", "x", "boom"], ["on", "x", "a"], ["emit", "x", 1]]],
            expected: ["boom(1)", "threw:listener failed"],
            isEdgeCase: true,
          },
          {
            description: "`on` returns the emitter, and listeners see `this` as the emitter",
            args: [[["chain", "x", "self", "a"], ["emit", "x", 5]]],
            expected: ["chained", "self:true", "a(5)", "emit:x:true"],
          },
          {
            description: "`off` with the original function cancels a pending `once`",
            args: [[["once", "x", "a"], ["off", "x", "a"], ["emit", "x", 1], ["count", "x"]]],
            expected: ["emit:x:false", "count:x:0"],
            isEdgeCase: true,
          },
          {
            description: "`off` for an unknown event or listener is a no-op",
            args: [[["off", "z", "a"], ["on", "x", "a"], ["off", "x", "b"], ["emit", "x", 3]]],
            expected: ["a(3)", "emit:x:true"],
          },
          {
            description: "`listenerCount` includes `once` listeners and duplicate registrations",
            args: [[["on", "x", "a"], ["on", "x", "a"], ["once", "x", "b"], ["count", "x"], ["emit", "x", 0], ["count", "x"]]],
            expected: ["count:x:3", "a(0)", "a(0)", "b(0)", "emit:x:true", "count:x:2"],
          },
          {
            description: "500 registrations of one listener, then one `off`",
            args: [[...Array.from({ length: 500 }, () => ["on", "x", "a"]), ["off", "x", "a"], ["count", "x"]]],
            expected: ["count:x:499"],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "node-streams-buffers",
      moduleId: "be-node-core",
      trackId: "backend",
      title: "Streams & Buffers",
      summary:
        "Streams let Node move data that's bigger than memory, or that arrives over time, in bounded chunks: a 4 GB upload can be hashed, compressed and written to object storage using a few megabytes. The core idea is **backpressure**. Every stream buffers internally up to `highWaterMark` (bytes, or objects in object mode; 64 KiB by default for byte streams since Node 22, 16 KiB on Windows). When a writable's buffer reaches it, `write()` returns `false` and a correct producer stops until `'drain'`. Ignore that return value, as naive `readable.on(\"data\", (c) => writable.write(c))` code does, and a fast source feeding a slow destination grows memory without bound. `highWaterMark` is a threshold, not a hard limit.\n\nConnect streams with `stream.pipeline()`, or `await pipeline(...)` from `node:stream/promises`, rather than `.pipe()`. Both respect backpressure, but `.pipe()` doesn't forward errors or clean up: when the source fails, the destination isn't closed and file descriptors or sockets leak. `pipeline` destroys every stream on failure and reports a single error. `for await (const chunk of readable)` and async-generator transforms are the modern way to consume and reshape data.\n\nA `Buffer` is a fixed-size run of raw bytes (a `Uint8Array` subclass); a string is UTF-16 text, and converting between them always involves an encoding. Byte length isn't character length: `Buffer.byteLength(\"héllo\")` is 6, and `Content-Length` needs the byte count. Calling `chunk.toString()` on each chunk corrupts multi-byte characters split across chunk boundaries into U+FFFD; `setEncoding(\"utf8\")` or a `StringDecoder` carries partial characters over. `buf.subarray()` shares memory with the original, and `Buffer.allocUnsafe()` returns uninitialized memory that may hold old data, so fill it before it leaves the process.",
      level: "advanced",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "Node.js: Stream", url: "https://nodejs.org/docs/latest/api/stream.html", kind: "docs" },
        { label: "Node.js Learn: Backpressuring in Streams", url: "https://nodejs.org/learn/modules/backpressuring-in-streams", kind: "article" },
        { label: "Node.js: Buffer", url: "https://nodejs.org/docs/latest/api/buffer.html", kind: "docs" },
        { label: "Node.js Learn: How to use streams", url: "https://nodejs.org/learn/modules/how-to-use-streams", kind: "article" },
      ],
      video: {
        title: "Node.js and Express.js - Full Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
        videoId: "Oe421EPjeBE",
        durationLabel: "8:16:47",
        startSeconds: 12310,
        chapterLabel: "Streams Intro",
      },
      alternateVideos: [
        {
          title: "NodeJS Streams",
          channel: "Piyush Garg",
          url: "https://www.youtube.com/watch?v=64LJJhT6Ybo",
          videoId: "64LJJhT6Ybo",
          durationLabel: "15:25",
        },
        {
          title: "Node.js Tutorial - 24 - Streams and Buffers",
          channel: "Codevolution",
          url: "https://www.youtube.com/watch?v=br8VB99qPzE",
          videoId: "br8VB99qPzE",
          durationLabel: "9:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "node-streams-buffers-q1",
          prompt:
            "What's wrong with this code copying a 10 GB file to a slow network destination?\n\n```js\nsrc.on(\"data\", (chunk) => {\n  dest.write(chunk);\n});\nsrc.on(\"end\", () => dest.end());\n```",
          options: [
            "It ignores `write()` returning `false`, so chunks pile up in `dest`'s buffer and memory grows without bound",
            "`data` events deliver the whole file in a single chunk",
            "`dest.end()` runs before the last chunk has been written",
            "Nothing: streams apply backpressure automatically to `data` listeners",
          ],
          correctIndex: 0,
          explanation:
            "The source keeps reading at disk speed while the destination drains at network speed. You'd have to pause the source when `write()` returns `false` and resume on `'drain'`; `pipeline(src, dest, cb)` does that and handles errors.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-streams-buffers-q2",
          prompt: "`writable.write(chunk)` returns `false`. What does that mean?",
          options: [
            "The internal buffer has reached `highWaterMark`: the chunk was accepted, but the producer should wait for `'drain'` before writing more",
            "The chunk was rejected and must be written again later",
            "The stream has been closed",
            "An error occurred and an `error` event is about to follow",
          ],
          correctIndex: 0,
          explanation:
            "`false` is advice, not rejection: the data is buffered, and writing more just grows the buffer past the threshold. Writing after `end()` is what produces an error.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-streams-buffers-q3",
          prompt: "Why prefer `stream.pipeline()` over chained `.pipe()` calls? (Select all that apply.)",
          options: [
            "If any stream fails, `pipeline` destroys all of them, so file descriptors and sockets aren't leaked",
            "It reports a single error through its callback or returned promise",
            "`.pipe()` doesn't forward an error from the source to the destination",
            "`.pipe()` ignores backpressure, while `pipeline` respects it",
            "`pipeline` buffers the whole stream in memory so it can retry",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Both handle backpressure; the difference is failure. With `.pipe()`, a failing source leaves the destination open (Node's docs say you must close it manually), while `pipeline` tears everything down and gives you one place to handle the error.",
        },
        {
          id: "node-streams-buffers-q4",
          prompt:
            "What does this log?\n\n```js\nconst euro = Buffer.from(\"€\"); // 3 bytes in UTF-8\nconst a = euro.subarray(0, 1).toString();\nconst b = euro.subarray(1).toString();\nconsole.log(a + b === \"€\");\n```",
          options: [
            "`false`, because each partial byte sequence decodes to U+FFFD replacement characters",
            "`true`, because concatenating the strings rejoins the bytes",
            "It throws an invalid-character error",
            "`true`, because UTF-8 decoding remembers state between calls",
          ],
          correctIndex: 0,
          explanation:
            "Each `toString()` call decodes independently and replaces the incomplete sequence. This is exactly what happens when a multi-byte character straddles two stream chunks; `StringDecoder` or `setEncoding(\"utf8\")` fixes it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-streams-buffers-q5",
          prompt: "What are `Buffer.byteLength(\"héllo\")` and `\"héllo\".length`?",
          options: ["6 and 5", "5 and 5", "10 and 5", "5 and 6"],
          correctIndex: 0,
          explanation:
            "`é` takes 2 bytes in UTF-8, while `.length` counts UTF-16 code units. Setting `Content-Length` from `.length` truncates responses that contain non-ASCII text.",
        },
        {
          id: "node-streams-buffers-q6",
          prompt:
            "What does this log?\n\n```js\nconst orig = Buffer.from(\"abc\");\nconst part = orig.subarray(0, 2);\npart[0] = 0x7a; // \"z\"\nconsole.log(orig.toString());\n```",
          options: ["`zbc`", "`abc`", "`zb`", "It throws because Buffers are immutable"],
          correctIndex: 0,
          explanation:
            "`subarray` returns a view over the same memory, so writes show through to the original. Copy with `Buffer.from(part)` when you need independent bytes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-streams-buffers-q7",
          prompt: "When is `Buffer.allocUnsafe(size)` dangerous?",
          options: [
            "When the buffer is sent or logged before being fully overwritten, since it may contain leftover data from earlier allocations",
            "Always: it can crash the process",
            "Whenever `size` exceeds 64 KiB",
            "When it's used to store UTF-8 strings",
          ],
          correctIndex: 0,
          explanation:
            "`allocUnsafe` skips zero-filling for speed, so the bytes are whatever was in that memory before, possibly secrets from another request. Use `Buffer.alloc` unless you'll overwrite every byte.",
        },
        {
          id: "node-streams-buffers-q8",
          prompt: "A readable stream in object mode has `highWaterMark: 16`. What does 16 mean?",
          options: ["16 objects", "16 KiB", "16 bytes per object", "16 pending `read()` calls"],
          correctIndex: 0,
          explanation:
            "In object mode the threshold counts objects; for byte streams it counts bytes. Sixteen is also the default for object mode.",
        },
        {
          id: "node-streams-buffers-q9",
          prompt: "Which is a modern, backpressure-aware way to transform a large file chunk by chunk?",
          options: [
            "`await pipeline(fs.createReadStream(src), async function* (source) { for await (const chunk of source) yield transform(chunk); }, fs.createWriteStream(dst))`",
            "`fs.writeFileSync(dst, transform(fs.readFileSync(src)))`",
            "`src.on(\"data\", (c) => dst.write(transform(c)))`",
            "`fs.readFile(src, (err, data) => fs.writeFile(dst, transform(data), cb))`",
          ],
          correctIndex: 0,
          explanation:
            "`pipeline` accepts async generators as transforms, pulls only as fast as the destination drains and cleans up on errors. The `readFile` variants hold the whole file in memory, and the `data` listener ignores backpressure.",
        },
        {
          id: "node-streams-buffers-q10",
          prompt:
            "A handler serves downloads with `fs.createReadStream(filePath).pipe(res)`. A request arrives for a file that doesn't exist. What happens?",
          options: [
            "The read stream emits `error` with no listener, which throws and can crash the process, and the response is never finished",
            "Node automatically responds with 404",
            "`res` receives the error and ends with a 500",
            "`.pipe()` retries until the file appears",
          ],
          correctIndex: 0,
          explanation:
            "`.pipe()` doesn't forward the error to `res`, and an `error` event with no listener throws. Use `pipeline(stream, res, (err) => ...)` and send a proper status when the open fails.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "node-http-server",
      moduleId: "be-node-core",
      trackId: "backend",
      title: "Building a Basic HTTP Server (No Framework)",
      summary:
        "`node:http` is the layer every Node framework sits on: Express, Fastify and NestJS ultimately receive the same `(req, res)` pair from `http.createServer`. `req` is an `IncomingMessage`, a readable stream whose body isn't read or parsed until you consume it (`for await (const chunk of req)`), which is why frameworks need body-parsing middleware and why you must cap the size while reading. `res` is a `ServerResponse`, a writable stream: headers are held until the first `write()` or `end()`, after which `setHeader` throws `ERR_HTTP_HEADERS_SENT`, the classic \"Cannot set headers after they are sent\" bug from responding twice. Forget `res.end()` and the client just hangs until something times out.\n\nWriting a server by hand shows what frameworks hide. Routing means matching `req.method` and the path from `new URL(req.url, \"http://localhost\")`, because `req.url` is only the path and query. Header names arrive lowercased in `req.headers`. Without a `Content-Length`, HTTP/1.1 responses use chunked transfer encoding. Status codes, content types and errors are your job: `http` doesn't catch exceptions from your handler, and since Node 15 an unhandled promise rejection crashes the process, so wrap async handlers and turn failures into 500s.\n\nProduction behaviour lives in the defaults. Keep-alive is on and `server.keepAliveTimeout` is 5 seconds (set it above your load balancer's idle timeout), `headersTimeout` (60 s) and `requestTimeout` (300 s) bound slow clients, and request headers are capped at 16 KiB. On `SIGTERM`, call `server.close()`: it stops accepting connections, closes idle keep-alive sockets and lets in-flight requests finish, so deploys don't drop traffic. Use a framework for real APIs, but none of them remove these fundamentals.",
      level: "intermediate",
      estMinutes: 80,
      webRefs: [
        { label: "Node.js: HTTP", url: "https://nodejs.org/docs/latest/api/http.html", kind: "docs" },
        {
          label: "Node.js Learn: Anatomy of an HTTP Transaction",
          url: "https://nodejs.org/learn/http/anatomy-of-an-http-transaction",
          kind: "article",
        },
        { label: "MDN: HTTP messages", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages", kind: "docs" },
      ],
      video: {
        title: "Node.js and Express.js - Full Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
        videoId: "Oe421EPjeBE",
        durationLabel: "8:16:47",
        startSeconds: 14605,
        chapterLabel: "Http Basics",
      },
      alternateVideos: [
        {
          title: "The Lifecycle of an HTTP Request in NodeJS",
          channel: "Hussein Nasser",
          url: "https://www.youtube.com/watch?v=msmdMLK4BqI",
          videoId: "msmdMLK4BqI",
          durationLabel: "30:17",
        },
        {
          title: "Node.js Tutorial - 31 - Creating a Node Server",
          channel: "Codevolution",
          url: "https://www.youtube.com/watch?v=x1cEbRIrOu4",
          videoId: "x1cEbRIrOu4",
          durationLabel: "7:25",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "node-http-server-q1",
          prompt:
            "What does a client requesting `/health` experience?\n\n```js\nhttp.createServer((req, res) => {\n  if (req.url === \"/health\") {\n    res.writeHead(200);\n  }\n}).listen(3000);\n```",
          options: [
            "The request hangs until a timeout, because the response is never ended",
            "An empty `200` response, sent automatically when the handler returns",
            "A `500`, because no body was written",
            "An immediate `204 No Content`",
          ],
          correctIndex: 0,
          explanation:
            "Nothing is sent until you write or end, and Node doesn't end responses for you when the handler returns. Every code path needs a `res.end()`; frameworks paper over this with helpers like `res.json()`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-http-server-q2",
          prompt:
            "What goes wrong when `findUser` resolves to `null`?\n\n```js\nhttp.createServer(async (req, res) => {\n  const user = await findUser(req);\n  if (!user) res.end(\"not found\");\n  res.setHeader(\"content-type\", \"application/json\");\n  res.end(JSON.stringify(user));\n});\n```",
          options: [
            "It responds, falls through, and `setHeader` throws `ERR_HTTP_HEADERS_SENT`; the rejection is unhandled and, by default, crashes the process",
            "Nothing: the second `end()` is ignored and the headers are merged",
            "The client receives both bodies concatenated",
            "`res.end` throws a `TypeError` because it doesn't accept strings",
          ],
          correctIndex: 0,
          explanation:
            "The missing `return` means the handler keeps going after the response is finished. The client already got a `200` with \"not found\" (which should have been a 404), and the throw inside the async handler becomes an unhandled rejection.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-http-server-q3",
          prompt: "How do you read a JSON request body using only `node:http`?",
          options: [
            "Consume `req` as a stream (for example `for await (const chunk of req)`), stop past a size limit, concatenate, then `JSON.parse` inside `try`/`catch`",
            "Read `req.body`, which Node fills when the content type is JSON",
            "Call `await req.json()`, as with the Fetch API",
            "Listen for a `req.on(\"body\")` event",
          ],
          correctIndex: 0,
          explanation:
            "`IncomingMessage` is a plain readable stream: there's no `body` property or `json()` method. The size limit matters because otherwise a client can stream gigabytes into your process, and malformed JSON should become a 400, not a crash.",
        },
        {
          id: "node-http-server-q4",
          prompt: "Which statements about `node:http` defaults in Node 24 are true? (Select all that apply.)",
          options: [
            "`server.keepAliveTimeout` is 5 seconds",
            "An HTTP/1.1 response without `Content-Length` is sent with chunked transfer encoding",
            "Request headers are limited to 16 KiB by default",
            "Request bodies are limited to 1 MB by default",
            "Keep-alive is disabled unless you enable it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The 5-second keep-alive timeout, chunked encoding and the 16 KiB header limit are all Node defaults. Node imposes no body limit at all, which is why body parsers add one, and keep-alive is on by default.",
        },
        {
          id: "node-http-server-q5",
          prompt: "Why does `new URL(req.url, \"http://localhost\")` need a base argument?",
          options: [
            "`req.url` is only the request target, such as `/users?id=1`, not an absolute URL",
            "`req.url` includes the protocol but not the host",
            "Node strips the query string unless a base is given",
            "The base forces the request to be treated as HTTPS",
          ],
          correctIndex: 0,
          explanation:
            "The `URL` constructor needs an absolute URL, and the request line carries just the path and query. The base is only there to satisfy the parser; don't trust `req.headers.host` as a real origin without validating it.",
        },
        {
          id: "node-http-server-q6",
          prompt: "What should your server do when it receives `SIGTERM` during a rolling deploy?",
          options: [
            "Call `server.close()` so it stops accepting connections and lets in-flight requests finish, then exit, with a hard timeout as a backstop",
            "Call `process.exit(0)` immediately so the new version starts sooner",
            "Ignore it, because the orchestrator waits for requests to finish anyway",
            "Throw an error so the process manager restarts it",
          ],
          correctIndex: 0,
          explanation:
            "Exiting immediately drops every in-flight request. `server.close()` stops new connections and, since Node 19, also closes idle keep-alive sockets; the timeout covers requests that never finish.",
        },
        {
          id: "node-http-server-q7",
          prompt: "An `async` handler throws after an `await`, and nothing catches it. What happens with default settings?",
          options: [
            "The rejection is unhandled, so Node exits the process; this request and every other in-flight request fail",
            "`http` catches it and replies with a 500",
            "The error is logged and the server keeps running normally",
            "Node retries the request once",
          ],
          correctIndex: 0,
          explanation:
            "Since Node 15 the default for unhandled rejections is to throw, which terminates the process. Raw `http` has no error handling of its own; Express 5 and other frameworks catch rejected handlers and route them to error middleware.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-http-server-q8",
          prompt: "A route serves a 2 GB file. Which implementation is right?",
          options: [
            "Set the headers, then `pipeline(fs.createReadStream(file), res, callback)`",
            "`res.end(fs.readFileSync(file))`",
            "`res.end(await fs.promises.readFile(file))`",
            "Read the file into a string and call `res.write` once",
          ],
          correctIndex: 0,
          explanation:
            "Streaming keeps memory flat and respects backpressure from slow clients, and `pipeline` cleans up if the client disconnects. The other options load 2 GB into memory, and the sync version also blocks the event loop while reading.",
        },
        {
          id: "node-http-server-q9",
          prompt: "Why do you read `req.headers[\"content-type\"]` rather than `req.headers[\"Content-Type\"]`?",
          options: [
            "HTTP header names are case-insensitive, so Node normalizes the keys of `req.headers` to lowercase",
            "HTTP/1.1 requires lowercase header names on the wire",
            "Node rejects requests whose headers aren't lowercase",
            "Browsers always send header names in lowercase",
          ],
          correctIndex: 0,
          explanation:
            "Clients may send `Content-Type`, `content-type` or `CONTENT-TYPE`; Node lowercases the keys so lookups work consistently. The original casing is still available in `req.rawHeaders`.",
        },
      ],
    },
    {
      id: "node-child-worker",
      moduleId: "be-node-core",
      trackId: "backend",
      title: "Child Processes & Worker Threads",
      summary:
        "Node gives you three ways off the main thread, and they solve different problems. `child_process` runs another program as a separate OS process: `spawn` streams its stdout and stderr (right for long-running or chatty commands); `exec` runs a command line through a shell and buffers all output in memory, killing the child if it passes `maxBuffer` (1 MiB by default); `execFile` runs a binary without a shell; and `fork` starts another Node process with an IPC channel for `send()` and `on(\"message\")`. The shell is the security line: interpolating user input into an `exec` string is command injection, so pass arguments as an array to `spawn` or `execFile`.\n\n`worker_threads` runs JavaScript in parallel inside the same process. Each worker has its own V8 isolate, event loop and heap, and talks through `postMessage`, which copies data via structured clone, unless you transfer an `ArrayBuffer` (ownership moves, no copy) or share a `SharedArrayBuffer` with `Atomics`. Workers are for CPU-bound JavaScript such as parsing, image work or compression, not for I/O, which Node already does asynchronously. Starting one costs time and memory, so keep a fixed pool (Piscina is a common choice) instead of spawning a worker per request, and remember that cloning large messages can cost more than the work you offload.\n\n`cluster` forks N copies of your server that share one listening port; the primary hands out connections round-robin on every OS except Windows. It uses more cores but shares nothing, so in-memory caches, sessions and rate limits become per process. In containers, prefer one process per container and scale replicas. Whatever you start, handle its `error` and `exit` events, and make sure children don't outlive the parent.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Node.js: Child process", url: "https://nodejs.org/docs/latest/api/child_process.html", kind: "docs" },
        { label: "Node.js: Worker threads", url: "https://nodejs.org/docs/latest/api/worker_threads.html", kind: "docs" },
        { label: "Node.js: Cluster", url: "https://nodejs.org/docs/latest/api/cluster.html", kind: "docs" },
      ],
      video: {
        title: "All you need to know about \"child_process\" in Node.js",
        channel: "Software Developer Diaries",
        url: "https://www.youtube.com/watch?v=C1v4MXGhpcM",
        videoId: "C1v4MXGhpcM",
        durationLabel: "12:37",
      },
      alternateVideos: [
        {
          title: "Node.js Tutorial - 62 - Worker Threads Module",
          channel: "Codevolution",
          url: "https://www.youtube.com/watch?v=Wm4MZwfEZd4",
          videoId: "Wm4MZwfEZd4",
          durationLabel: "6:32",
        },
        {
          title: "How to scale NodeJs applications using the cluster module.",
          channel: "Piyush Garg",
          url: "https://www.youtube.com/watch?v=JoPZ9gEvpz8",
          videoId: "JoPZ9gEvpz8",
          durationLabel: "12:38",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "node-child-worker-q1",
          prompt:
            "What's the vulnerability?\n\n```js\nconst { exec } = require(\"node:child_process\");\napp.get(\"/thumb\", (req, res) => {\n  exec(`convert ${req.query.file} -resize 200 out.png`, (err) => {\n    res.sendStatus(err ? 500 : 200);\n  });\n});\n```",
          options: [
            "Command injection: `exec` runs the string through a shell, so `file=a.png; rm -rf ~` runs extra commands",
            "Only path traversal, because the shell escapes metacharacters automatically",
            "A memory leak, because `exec` never releases the child",
            "None, because query parameters are always strings",
          ],
          correctIndex: 0,
          explanation:
            "Shell metacharacters in user input become shell syntax. Use `execFile(\"convert\", [file, \"-resize\", \"200\", \"out.png\"])`, which passes arguments without a shell, and still validate `file`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-child-worker-q2",
          prompt: "A command prints 50 MB to stdout, and you run it with `exec` using default options. What happens?",
          options: [
            "Once output passes `maxBuffer` (1 MiB by default), Node kills the child and the callback gets an error with truncated output",
            "`exec` streams the output to the callback in chunks",
            "It works, just slowly",
            "Node spills the extra output to a temporary file",
          ],
          correctIndex: 0,
          explanation:
            "`exec` collects everything in memory and enforces `maxBuffer`. For large or unbounded output, use `spawn` and consume `child.stdout` as a stream.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-child-worker-q3",
          prompt: "Which workloads benefit from `worker_threads`? (Select all that apply.)",
          options: [
            "Resizing images with a pure-JavaScript library",
            "Parsing a 200 MB CSV file into objects",
            "Running CPU-heavy schema validation on large payloads",
            "Making 1,000 concurrent HTTP requests to other services",
            "Reading many files with `fs.promises`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Workers help when JavaScript itself is the bottleneck. Network and file I/O are already asynchronous; moving them to workers adds overhead without adding throughput.",
        },
        {
          id: "node-child-worker-q4",
          prompt: "How do worker threads differ from a child process created with `fork()`?",
          options: [
            "Workers live in the same process, each with its own V8 isolate and event loop, and can share memory via `SharedArrayBuffer`; `fork` creates a separate Node process with its own memory and an IPC channel",
            "Workers share the main thread's heap and global variables",
            "`fork` is meant for CPU work and workers for I/O",
            "They're the same thing; `fork` is just the older API",
          ],
          correctIndex: 0,
          explanation:
            "Workers are cheaper than processes and can share or transfer memory, but they don't share globals: each has its own heap. `fork` gives stronger isolation (a crash or leak stays in the child) at a higher cost.",
        },
        {
          id: "node-child-worker-q5",
          prompt:
            "You create a new `Worker` for every request to run a 5 ms computation. Under load, latency is worse than doing it on the main thread. Why?",
          options: [
            "Starting a worker (a new isolate and event loop) plus cloning messages costs more than the work; use a fixed-size worker pool",
            "Workers run on the same thread as the main event loop",
            "Only one worker can run at a time",
            "Workers block libuv's threadpool while they run",
          ],
          correctIndex: 0,
          explanation:
            "Worker startup takes milliseconds and allocates a whole JavaScript environment. A pool created at startup amortizes that cost, and it also caps how many CPU-heavy tasks run at once.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-child-worker-q6",
          prompt: "What does the `cluster` module give you, and what doesn't it?",
          options: [
            "Several processes sharing one listening port to use more cores, but no shared memory, so per-process caches and sessions diverge",
            "Threads that share memory so one process handles more requests",
            "Automatic scaling across multiple machines",
            "A shared in-memory cache across all workers",
          ],
          correctIndex: 0,
          explanation:
            "Cluster workers are separate processes. Anything that must be consistent across them, such as sessions, rate limits or caches, has to live in a shared store like Redis.",
        },
        {
          id: "node-child-worker-q7",
          prompt:
            "What's the most efficient way to hand a 100 MB `ArrayBuffer` of pixels to a worker when the main thread no longer needs it?",
          options: [
            "`worker.postMessage(buf, [buf])`, which transfers ownership without copying and leaves the main thread's buffer detached",
            "`worker.postMessage(buf)`, which always shares the memory",
            "`JSON.stringify` it and post the string",
            "Write it to a temporary file and post the path",
          ],
          correctIndex: 0,
          explanation:
            "By default `postMessage` structured-clones, which copies 100 MB. Listing the buffer in the transfer list moves it instead. Use a `SharedArrayBuffer` when both sides need access at the same time.",
        },
        {
          id: "node-child-worker-q8",
          prompt: "When should you choose `spawn` over `exec`?",
          options: [
            "For long-running commands or large output, since `spawn` exposes stdout and stderr as streams and doesn't use a shell by default",
            "When you need shell features like pipes and globbing",
            "When the output is tiny and you want it as a single string",
            "Only on Windows",
          ],
          correctIndex: 0,
          explanation:
            "`spawn` streams output and avoids a shell unless you pass `shell: true`. `exec` is convenient for short commands with small output where shell syntax is genuinely needed and the input is trusted.",
        },
        {
          id: "node-child-worker-q9",
          prompt:
            "In Kubernetes, your API forks one `cluster` worker per `os.cpus().length`. The pod has a 1-CPU limit on a 32-core node. What's the problem?",
          options: [
            "`os.cpus()` reports the node's cores, so ~32 processes compete for one CPU's quota, wasting memory and adding throttling; run one process per pod and scale replicas",
            "Kubernetes blocks the `cluster` module from forking",
            "The workers can't share the listening port inside a container",
            "`os.cpus()` returns 0 inside containers, so no workers start",
          ],
          correctIndex: 0,
          explanation:
            "A container's CPU limit doesn't change how many cores the machine reports. Let the orchestrator scale processes, and size any in-process pools deliberately rather than from the host's core count.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-child-worker-q10",
          prompt: "A forked child and its parent talk with `process.send()`. What travels over the IPC channel?",
          options: [
            "Serialized messages (JSON by default, or structured-clone-based with `serialization: \"advanced\"`), never shared objects",
            "References to the same objects in memory",
            "Pointers into the parent's heap",
            "Only strings; objects must be stringified by hand",
          ],
          correctIndex: 0,
          explanation:
            "The processes have separate heaps, so every message is serialized and deserialized. With JSON, values like `Map`, `Date` or `BigInt` don't survive intact, which is what the `advanced` option addresses.",
        },
      ],
    },
    {
      id: "node-debugging-inspect",
      moduleId: "be-node-core",
      trackId: "backend",
      title: "Debugging Node with --inspect",
      summary:
        "`console.log` debugging stops scaling when the bug is in a path you can't cheaply rerun, in a closure's state, or in a promise that never settles. `node --inspect app.js` starts the V8 inspector on `127.0.0.1:9229` speaking the Chrome DevTools Protocol, so Chrome (`chrome://inspect`), VS Code or any CDP client can attach, set breakpoints (including conditional breakpoints and logpoints that print without editing code), follow async stack traces and evaluate expressions in the paused frame. `--inspect-brk` pauses before the first line of user code, which you need when the bug is in startup; `--inspect-wait` waits for a debugger to attach first. `node inspect app.js` is the built-in terminal debugger for when all you have is SSH.\n\nThe inspector is remote code execution by design: whoever reaches the port can run arbitrary code in your process without authentication. Never bind it to `0.0.0.0` on a reachable host; tunnel with `ssh -L` or `kubectl port-forward` instead. On Linux and macOS, sending `SIGUSR1` to a running process turns the inspector on, which is useful during an incident and dangerous for the same reason.\n\nDebugging isn't only breakpoints. DevTools' Memory panel takes heap snapshots; compare two taken minutes apart under load to see what's growing (usually listeners, caches or closures holding request objects). `--cpu-prof` writes a CPU profile that shows which functions burn the event loop, and `--heapsnapshot-near-heap-limit` captures a snapshot just before an out-of-memory crash. Pair these with `node --watch` for fast edit-and-restart loops, the built-in `node --test` runner, and `--enable-source-maps` so stack traces point at your TypeScript rather than the compiled output.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Node.js Learn: Debugging Node.js", url: "https://nodejs.org/learn/getting-started/debugging", kind: "docs" },
        { label: "Node.js: Debugger", url: "https://nodejs.org/docs/latest/api/debugger.html", kind: "docs" },
        { label: "VS Code: Node.js debugging", url: "https://code.visualstudio.com/docs/nodejs/nodejs-debugging", kind: "docs" },
        {
          label: "Node.js Learn: Using Heap Snapshot",
          url: "https://nodejs.org/learn/diagnostics/memory/using-heap-snapshot",
          kind: "article",
        },
      ],
      video: {
        title: "How to debug Node.js in Visual Studio Code",
        channel: "JayMartMedia",
        url: "https://www.youtube.com/watch?v=4UGyzRo8Dsk",
        videoId: "4UGyzRo8Dsk",
        durationLabel: "9:53",
      },
      alternateVideos: [
        {
          title: "node js CPU profiling using chrome! Learn to attach the chrome debugger to profile the CPU usage.",
          channel: "High Voice Computing",
          url: "https://www.youtube.com/watch?v=Dr7kzOAO1U8",
          videoId: "Dr7kzOAO1U8",
          durationLabel: "13:19",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "node-debugging-inspect-q1",
          prompt: "Your service crashes during startup, before you can attach a debugger and set a breakpoint. Which flag helps?",
          options: [
            "`--inspect-brk`, which pauses before the first line of user code so you can attach and set breakpoints first",
            "`--inspect`, which pauses on every thrown exception",
            "`--watch`, which reruns the file on changes",
            "`--trace-warnings`, which prints stack traces for warnings",
          ],
          correctIndex: 0,
          explanation:
            "With plain `--inspect` the code starts running immediately, so a startup crash happens before you can attach. `--inspect-brk` holds execution until a debugger connects and resumes.",
        },
        {
          id: "node-debugging-inspect-q2",
          prompt:
            "A teammate starts production with `node --inspect=0.0.0.0:9229 server.js` \"so we can debug if needed\". What's the risk?",
          options: [
            "Anyone who can reach port 9229 can attach without authentication and run arbitrary code in the process",
            "Only performance: the inspector slows every request by about half",
            "None, because the inspector is read-only",
            "It exposes heap memory for reading, but can't execute code",
          ],
          correctIndex: 0,
          explanation:
            "The inspector can evaluate any expression in your process, read every secret in memory and call any API. Node's docs strongly advise keeping it on `127.0.0.1`, the default.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-debugging-inspect-q3",
          prompt: "How do you safely debug a Node process on a remote server?",
          options: [
            "Keep the inspector on `127.0.0.1` and forward the port over SSH (`ssh -L 9229:localhost:9229 host`), then attach locally",
            "Bind the inspector to `0.0.0.0` and open the firewall only during business hours",
            "Start it with `--inspect` and share the WebSocket URL in the team chat",
            "You can't; remote Node processes can only be debugged with logging",
          ],
          correctIndex: 0,
          explanation:
            "An SSH tunnel (or `kubectl port-forward`) reuses authentication you already have and exposes nothing publicly. Your local DevTools or VS Code then attach to `localhost:9229` as if the process were local.",
        },
        {
          id: "node-debugging-inspect-q4",
          prompt: "Which techniques help you find a memory leak in a Node service? (Select all that apply.)",
          options: [
            "Take two heap snapshots a few minutes apart under load and compare what grew",
            "Start with `--heapsnapshot-near-heap-limit` to capture a snapshot before an out-of-memory crash",
            "Watch for `MaxListenersExceededWarning`, which often means listeners are added per request",
            "Raise `--max-old-space-size` until the crashes stop",
            "Increase `UV_THREADPOOL_SIZE`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Comparing snapshots shows which objects accumulate and what retains them. A bigger heap only delays the crash, and the threadpool size has nothing to do with memory retention.",
        },
        {
          id: "node-debugging-inspect-q5",
          prompt:
            "A production process on Linux is misbehaving and wasn't started with `--inspect`. How can you attach a debugger without restarting it?",
          options: [
            "Send it `SIGUSR1` (`kill -USR1 <pid>`), which starts the inspector on 127.0.0.1:9229",
            "Send it `SIGTERM`, which starts the inspector before exiting",
            "You can't: the inspector can only be enabled at startup",
            "Run `node --inspect <pid>` from another terminal",
          ],
          correctIndex: 0,
          explanation:
            "Node reserves `SIGUSR1` to activate the inspector (not available on Windows). You still need access to the host or a port-forward to reach it, which is exactly why it's safe only on a locked-down port.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "node-debugging-inspect-q6",
          prompt: "What's a logpoint?",
          options: [
            "A breakpoint that logs an expression and keeps running, without pausing or editing the code",
            "A `console.log` that only runs in development builds",
            "A breakpoint that writes a heap snapshot when hit",
            "A marker that pauses on every `console.log` call",
          ],
          correctIndex: 0,
          explanation:
            "Logpoints give you print-debugging without a code change or restart, which is handy in a hot path where pausing would cause timeouts. VS Code and Chrome DevTools both support them.",
        },
        {
          id: "node-debugging-inspect-q7",
          prompt: "What's the quickest way to see which functions burn CPU in a script that runs to completion?",
          options: [
            "Run `node --cpu-prof script.js` and open the generated `.cpuprofile` in DevTools",
            "Wrap every function in `console.time` and `console.timeEnd`",
            "Run it with `--inspect-brk` and step through it line by line",
            "Log `process.memoryUsage()` at intervals",
          ],
          correctIndex: 0,
          explanation:
            "A sampling CPU profile shows where time goes, including in code you didn't think to time. Stepping through changes timing completely, and memory usage says nothing about CPU.",
        },
        {
          id: "node-debugging-inspect-q8",
          prompt: "Stack traces from your compiled TypeScript point at lines in `dist/*.js`. What fixes that at runtime?",
          options: [
            "Emit source maps and run Node with `--enable-source-maps`",
            "Run Node with `--inspect`",
            "Run Node with `--trace-warnings`",
            "Minify the compiled output",
          ],
          correctIndex: 0,
          explanation:
            "With `--enable-source-maps`, Node maps stack traces back to the original TypeScript files and lines. Debuggers use source maps too, but only this flag fixes the traces in your logs.",
        },
        {
          id: "node-debugging-inspect-q9",
          prompt: "What does `node --watch server.js` do?",
          options: [
            "Restarts the process whenever the entry file or any file it imports changes",
            "Hot-swaps changed modules in place without restarting",
            "Watches only the files in `node_modules`",
            "Enables the inspector and reloads DevTools on changes",
          ],
          correctIndex: 0,
          explanation:
            "Watch mode (stable since Node 22) tracks the module graph and restarts on changes, which replaces `nodemon` for most projects. Use `--watch-path` to watch other files too.",
        },
      ],
    },
  ],
} satisfies Module;
