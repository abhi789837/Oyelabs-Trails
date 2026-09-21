import type { Module } from "@/types/curriculum";

export default {
  id: "be-express",
  trackId: "backend",
  name: "Express.js",
  description:
    "Express 5 from the router outward: how routes and path patterns really match, the middleware pipeline and why its order is your architecture, params versus query strings, HTTP method semantics, centralized async error handling, static files and templates, Multer uploads, and a CRUD API that gets status codes and optimistic concurrency right. Written for Express 5 (the npm `latest`), with the Express 4 habits that now break called out.",
  refs: [
    { label: "Express: Routing guide", url: "https://expressjs.com/en/guide/routing/", kind: "docs" },
    { label: "Express: Moving to Express 5", url: "https://expressjs.com/en/guide/migrating-5/", kind: "docs" },
    { label: "Express: 5.x API reference", url: "https://expressjs.com/en/5x/api/", kind: "docs" },
    { label: "goldbergyoni: Node.js Best Practices", url: "https://github.com/goldbergyoni/nodebestpractices", kind: "repo" },
  ],
  topics: [
    {
      id: "express-routing-fundamentals",
      moduleId: "be-express",
      trackId: "backend",
      title: "Routing Fundamentals & Express 5 Path Syntax",
      summary:
        "A route is a method, a path pattern and a stack of handlers. Express keeps every `app.get`, `app.post` and `app.use` call in an ordered stack and walks it top to bottom for each request, running the layers whose method and path match. There's no specificity ranking (Fastify's radix-tree router, by contrast, prefers static segments over params): declaration order is the priority, which is why `/users/new` must be registered before `/users/:id`. `express.Router()` exists to group routes by feature, mount them under a prefix and give each group its own middleware.\n\nExpress 5 moved to path-to-regexp v8 and dropped most regex-flavoured syntax. Wildcards need names (`/*splat`), arrive as an array of decoded segments, and don't match `/` (use `/{*splat}` for that). Optional parts use braces (`/:file{.:ext}`) instead of `?`. The characters `( ) [ ] ? + !` are reserved, so an Express 4 path like `/:id(\\d+)` now throws at startup, and unmatched optional params are left out of `req.params` instead of being set to `undefined`. Matching is still case-insensitive and tolerates one trailing slash unless you enable `caseSensitive` or `strict`.\n\nTwo details catch experienced people. Params are always decoded strings, never numbers, so `req.params.id === 42` is always false, and `%2F` decodes to a `/` inside a single segment value. And with regex constraints gone from paths, validation moves into a middleware or the handler; the router itself only rejects malformed percent-encoding, which reaches your error handler as a 400.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Express: Routing guide", url: "https://expressjs.com/en/guide/routing/", kind: "docs" },
        { label: "Express: Moving to Express 5 (path route matching syntax)", url: "https://expressjs.com/en/guide/migrating-5/", kind: "docs" },
        { label: "pillarjs: path-to-regexp", url: "https://github.com/pillarjs/path-to-regexp", kind: "repo" },
        { label: "MDN: Express tutorial, routes and controllers", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/routes", kind: "article" },
      ],
      video: {
        title: "Node.js and Express.js - Full Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
        videoId: "Oe421EPjeBE",
        durationLabel: "8:16:47",
        startSeconds: 17510,
        chapterLabel: "Express Basics",
      },
      alternateVideos: [
        {
          title: "Learn Express JS In 35 Minutes",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=SccSCuHhOw0",
          videoId: "SccSCuHhOw0",
          durationLabel: "36:03",
          startSeconds: 664,
          chapterLabel: "Routers",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `matchRoute(pattern, path)`: a matcher for the subset of Express 5 (path-to-regexp v8) syntax used by `app.get()` routes. Return `null` when the path doesn't match, or `{ params }` when it does.\n\n- A `:name` parameter matches one or more characters up to the next `/`. Names are JavaScript identifiers (`[A-Za-z_$][A-Za-z0-9_$]*`).\n- A `*name` wildcard matches one or more characters, including `/`. Its value is an **array**: the matched text split on `/`.\n- `{...}` marks an optional part (groups are never nested). Prefer the match that includes the group: try the pattern with the group's contents first, and only then without it. A param that didn't match is left out of `params`, not set to `undefined`.\n- Everything else is literal text. Matching is case-insensitive, must cover the whole path, and allows one extra trailing `/`. When a segment holds several params (`/:from-:to`), normal greedy regex backtracking decides the split.\n- Decode every param value with `decodeURIComponent` (each wildcard segment separately). If decoding fails, return `{ error: \"Failed to decode param '<raw value>'\" }`, the message Express puts on its 400.\n- Throw an `Error` for syntax Express 5 rejects: any of `( ) [ ] ? + !`, a `:` or `*` without a name, or an unbalanced `{` or `}`.\n\nCompiling the pattern into a `RegExp` (escaping the literal parts) is the simplest approach. The tests call `testRoute(pattern, paths)`, which returns your result for each path, or `\"invalid pattern\"` if `matchRoute` throws. Leave the driver as it is.",
        starterCode:
          "/**\n * @param {string} pattern  e.g. \"/users/:id\", \"/files/*path\", \"/docs{/:section}\"\n * @param {string} path     the request path, without a query string\n * @returns {null | { params: Record<string, string | string[]> } | { error: string }}\n */\nfunction matchRoute(pattern, path) {\n  // Your code here\n}\n\n// ---- Test driver (leave as is) ----\nfunction testRoute(pattern, paths) {\n  try {\n    return paths.map((p) => matchRoute(pattern, p));\n  } catch (e) {\n    return \"invalid pattern\";\n  }\n}\n",
        functionName: "testRoute",
        testCases: [
          {
            description: "a named parameter matches one segment, with or without one trailing slash",
            args: ["/users/:id", ["/users/42", "/users/42/", "/users", "/users/42/posts"]],
            expected: [{ params: { id: "42" } }, { params: { id: "42" } }, null, null],
          },
          {
            description: "several params, and literals match case-insensitively",
            args: ["/users/:userId/posts/:postId", ["/users/7/posts/99", "/USERS/Ab/POSTS/Cd", "/users/7/posts"]],
            expected: [{ params: { userId: "7", postId: "99" } }, { params: { userId: "Ab", postId: "Cd" } }, null],
          },
          {
            description: "a named wildcard captures one or more segments as an array",
            args: ["/files/*path", ["/files/a/b/c.txt", "/files/a", "/files", "/files/"]],
            expected: [{ params: { path: ["a", "b", "c.txt"] } }, { params: { path: ["a"] } }, null, null],
          },
          {
            description: "an optional group: captured when present, omitted when missing",
            args: ["/docs{/:section}", ["/docs", "/docs/", "/docs/intro", "/docs/intro/extra"]],
            expected: [{ params: {} }, { params: {} }, { params: { section: "intro" } }, null],
          },
          {
            description: "an optional extension prefers the match that includes the group",
            args: ["/:file{.:ext}", ["/image", "/image.png", "/archive.tar.gz", "/.env"]],
            expected: [
              { params: { file: "image" } },
              { params: { file: "image", ext: "png" } },
              { params: { file: "archive.tar", ext: "gz" } },
              { params: { file: ".env" } },
            ],
          },
          {
            description: "an optional group in the middle of the pattern",
            args: ["/shop{/:category}/items/:id", ["/shop/items/3", "/shop/shoes/items/3"]],
            expected: [{ params: { id: "3" } }, { params: { category: "shoes", id: "3" } }],
          },
          {
            description: "two params in one segment, and literal dots are not regex dots",
            args: ["/flights/:from-:to.json", ["/flights/LAX-SFO.json", "/flights/LAX-SFOxjson"]],
            expected: [{ params: { from: "LAX", to: "SFO" } }, null],
          },
          {
            description: "`/*splat` never matches the root; `/{*splat}` does",
            args: ["/{*splat}", ["/", "/a/b"]],
            expected: [{ params: {} }, { params: { splat: ["a", "b"] } }],
            isEdgeCase: true,
          },
          {
            description: "`/*splat` needs at least one character after the slash",
            args: ["/*splat", ["/", "/a"]],
            expected: [null, { params: { splat: ["a"] } }],
            isEdgeCase: true,
          },
          {
            description: "params are percent-decoded; a malformed escape reports Express's 400 message",
            args: ["/users/:id", ["/users/j%C3%B6rg", "/users/a%2Fb", "/users/%E0%A4%A"]],
            expected: [{ params: { id: "jörg" } }, { params: { id: "a/b" } }, { error: "Failed to decode param '%E0%A4%A'" }],
            isEdgeCase: true,
          },
          {
            description: "each wildcard segment is decoded separately",
            args: ["/files/*path", ["/files/a%20b/c%2Fd", "/files/%zz/x"]],
            expected: [{ params: { path: ["a b", "c/d"] } }, { error: "Failed to decode param '%zz'" }],
            isEdgeCase: true,
          },
          {
            description: "Express 4's `?` optional marker is rejected",
            args: ["/users/:id?", ["/users/1"]],
            expected: "invalid pattern",
            isEdgeCase: true,
          },
          {
            description: "an unnamed `*` wildcard is rejected",
            args: ["/assets/*", ["/assets/app.js"]],
            expected: "invalid pattern",
            isEdgeCase: true,
          },
          {
            description: "inline regex in a path string is rejected",
            args: ["/orders/:id(\\d+)", ["/orders/1"]],
            expected: "invalid pattern",
            isEdgeCase: true,
          },
          {
            description: "an unbalanced brace is rejected",
            args: ["/docs{/:section", ["/docs"]],
            expected: "invalid pattern",
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "express-middleware-pipeline",
      moduleId: "be-express",
      trackId: "backend",
      title: "Middleware & the Request-Response Cycle",
      summary:
        "Express is a thin layer over Node's `http` server whose real job is dispatch. Every request walks one ordered stack of functions, and each function must either end the response or call `next()` to hand over. That contract is the whole framework: body parsing, auth, logging, rate limiting and your route handlers all have the same shape, so they compose in whatever order you register them, which is both the appeal and the source of most Express bugs.\n\nThe dispatcher is a loop holding an index and a pending error. `next()` moves on to the next matching layer. `next(err)` with any truthy value except the strings `'route'` and `'router'` switches to error mode, where only four-parameter functions run; Express tells the two kinds apart by `fn.length`. A synchronous `throw` becomes `next(err)`. Express 5 also inspects the return value: a rejected promise is forwarded as `next(reason)`, with a falsy reason replaced by `new Error('Rejected promise')`. A promise that fulfils is ignored, so an async middleware that neither responds nor calls `next()` leaves the request hanging until a client or proxy times out.\n\nThe costly mistakes are control-flow ones. `res.send()` doesn't return from your function, so the code after it keeps running, and a second send throws `ERR_HTTP_HEADERS_SENT` (\"Cannot set headers after they are sent to the client\"); write `return res.send(...)` on early exits. Responding and then calling `next()`, or calling `next()` twice, lets a later handler try to respond again. Keep per-request data on `res.locals` or `req`, never in module-level variables, which leak between concurrent requests.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Express: Writing middleware", url: "https://expressjs.com/en/guide/writing-middleware/", kind: "docs" },
        { label: "Express: Using middleware", url: "https://expressjs.com/en/guide/using-middleware/", kind: "docs" },
        { label: "pillarjs/router: the Express 5 router source", url: "https://github.com/pillarjs/router", kind: "repo" },
      ],
      video: {
        title: "Node.js and Express.js - Full Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
        videoId: "Oe421EPjeBE",
        durationLabel: "8:16:47",
        startSeconds: 22246,
        chapterLabel: "Middleware - Setup",
      },
      alternateVideos: [
        {
          title: "Learn Express Middleware In 14 Minutes",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=lY6icfhap2o",
          videoId: "lY6icfhap2o",
          durationLabel: "14:48",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `runStack(stack, req, res, done)`, the dispatch loop at the heart of Express's router.\n\n- `stack` is an array of functions. A function declared with exactly four parameters (`fn.length === 4`) is an **error handler** `(err, req, res, next)`; everything else is regular middleware `(req, res, next)`.\n- Start with no error and run the first regular middleware. Each function gets its own `next`. `next()` continues with the following regular middleware. `next(err)` with any truthy value switches to error mode: regular middleware is skipped and the next error handler runs. An error handler that calls `next()` with no argument resumes the regular chain after it.\n- If a function throws synchronously, treat it as `next(thrownValue)`.\n- If a function returns a promise (anything with a `then` method) that rejects, treat it as `next(reason)`, using `new Error(\"Rejected promise\")` when the reason is falsy. A promise that fulfils does nothing.\n- Each `next` works once: ignore any later calls to the same `next`.\n- When no layers are left, call `done(err)` with the pending error, or `done()` if there isn't one. Call `done` at most once.\n\nThe tests call `runScenario(layers)`, which builds middleware from a small spec (each layer records its name when it runs), lets promises settle, and reports the trace, the response that was sent and what reached `done`. Leave the driver as it is.",
        starterCode:
          "/**\n * @param {Function[]} stack  regular middleware (req, res, next) and error handlers (err, req, res, next)\n * @param {object} req\n * @param {object} res\n * @param {(err?: unknown) => void} done  called once when the stack is exhausted\n */\nfunction runStack(stack, req, res, done) {\n  // Your code here\n}\n\n// ---- Test driver (leave as is) ----\n// Each layer is [name, kind, action]:\n//   kind \"mw\"    regular middleware (req, res, next)\n//   kind \"err\"   error handler (err, req, res, next)\n//   kind \"err3\"  a mistaken \"error handler\" declared as (err, req, res)\nasync function runScenario(layers) {\n  const trace = [];\n  const done = [];\n  const res = {\n    statusCode: 200,\n    sent: null,\n    status(code) {\n      this.statusCode = code;\n      return this;\n    },\n    send(body) {\n      if (!this.sent) this.sent = [this.statusCode, body];\n    },\n  };\n  const stack = layers.map(([name, kind, action]) => makeLayer(name, kind, action, trace));\n  runStack(stack, { url: \"/\" }, res, (err) => {\n    done.push(err ? \"error: \" + (err instanceof Error ? err.message : String(err)) : \"not found\");\n  });\n  for (let i = 0; i < 50; i++) await null; // let promise-based layers settle\n  return { trace, sent: res.sent, done };\n}\n\nfunction makeLayer(name, kind, action, trace) {\n  const fail = () => new Error(name + \" failed\");\n  if (kind === \"err\") {\n    return function (err, req, res, next) {\n      trace.push(name);\n      if (action === \"send\") res.status(500).send(err.message);\n      else if (action === \"next\") next(err);\n      else if (action === \"recover\") next();\n      else if (action === \"throw\") throw fail();\n    };\n  }\n  if (kind === \"err3\") {\n    return function (err, req, res) {\n      trace.push(name);\n    };\n  }\n  switch (action) {\n    case \"next\":\n      return function (req, res, next) { trace.push(name); next(); };\n    case \"send\":\n      return function (req, res, next) { trace.push(name); res.send(name); };\n    case \"throw\":\n      return function (req, res, next) { trace.push(name); throw fail(); };\n    case \"nextError\":\n      return function (req, res, next) { trace.push(name); next(fail()); };\n    case \"nextTwice\":\n      return function (req, res, next) { trace.push(name); next(); next(); };\n    case \"asyncNext\":\n      return async function (req, res, next) { trace.push(name); await null; next(); };\n    case \"reject\":\n      return async function (req, res, next) { trace.push(name); await null; throw fail(); };\n    case \"rejectEmpty\":\n      return function (req, res, next) { trace.push(name); return Promise.reject(); };\n    case \"resolve\":\n      return async function (req, res, next) { trace.push(name); await null; };\n    default:\n      throw new Error(\"unknown action \" + action);\n  }\n}\n",
        functionName: "runScenario",
        testCases: [
          {
            description: "runs middleware in order until one responds",
            args: [[["a", "mw", "next"], ["b", "mw", "next"], ["c", "mw", "send"], ["d", "mw", "send"]]],
            expected: { trace: ["a", "b", "c"], sent: [200, "c"], done: [] },
          },
          {
            description: "error handlers are skipped while there is no error",
            args: [[["a", "mw", "next"], ["E", "err", "send"], ["b", "mw", "send"]]],
            expected: { trace: ["a", "b"], sent: [200, "b"], done: [] },
          },
          {
            description: "a thrown error skips regular middleware until an error handler",
            args: [[["a", "mw", "throw"], ["b", "mw", "send"], ["E", "err", "send"]]],
            expected: { trace: ["a", "E"], sent: [500, "a failed"], done: [] },
          },
          {
            description: "next(err) flows through error handlers that pass it on",
            args: [[["a", "mw", "nextError"], ["b", "mw", "send"], ["E1", "err", "next"], ["E2", "err", "send"]]],
            expected: { trace: ["a", "E1", "E2"], sent: [500, "a failed"], done: [] },
          },
          {
            description: "a rejected promise from an async handler reaches the error handler",
            args: [[["a", "mw", "reject"], ["b", "mw", "send"], ["E", "err", "send"]]],
            expected: { trace: ["a", "E"], sent: [500, "a failed"], done: [] },
          },
          {
            description: "async middleware can call next() after awaiting",
            args: [[["a", "mw", "asyncNext"], ["b", "mw", "asyncNext"], ["c", "mw", "send"]]],
            expected: { trace: ["a", "b", "c"], sent: [200, "c"], done: [] },
          },
          {
            description: "an error handler that calls next() resumes the regular chain after it",
            args: [[["a", "mw", "throw"], ["b", "mw", "send"], ["E", "err", "recover"], ["c", "mw", "send"]]],
            expected: { trace: ["a", "E", "c"], sent: [200, "c"], done: [] },
          },
          {
            description: "falling off the end without an error reaches done as not found",
            args: [[["a", "mw", "next"], ["E", "err", "send"]]],
            expected: { trace: ["a"], sent: null, done: ["not found"] },
          },
          {
            description: "an error nobody handles reaches done",
            args: [[["a", "mw", "nextError"], ["b", "mw", "send"]]],
            expected: { trace: ["a"], sent: null, done: ["error: a failed"] },
            isEdgeCase: true,
          },
          {
            description: "an empty stack goes straight to done",
            args: [[]],
            expected: { trace: [], sent: null, done: ["not found"] },
            isEdgeCase: true,
          },
          {
            description: "calling next() twice only advances once",
            args: [[["a", "mw", "nextTwice"], ["b", "mw", "next"], ["c", "mw", "send"]]],
            expected: { trace: ["a", "b", "c"], sent: [200, "c"], done: [] },
            isEdgeCase: true,
          },
          {
            description: "a three-parameter 'error handler' is not an error handler",
            args: [[["a", "mw", "throw"], ["X", "err3", ""], ["E", "err", "send"]]],
            expected: { trace: ["a", "E"], sent: [500, "a failed"], done: [] },
            isEdgeCase: true,
          },
          {
            description: "an async handler that resolves without next() leaves the request hanging",
            args: [[["a", "mw", "resolve"], ["b", "mw", "send"]]],
            expected: { trace: ["a"], sent: null, done: [] },
            isEdgeCase: true,
          },
          {
            description: "a rejection with no reason becomes Error('Rejected promise')",
            args: [[["a", "mw", "rejectEmpty"], ["E", "err", "send"]]],
            expected: { trace: ["a", "E"], sent: [500, "Rejected promise"], done: [] },
            isEdgeCase: true,
          },
          {
            description: "an error thrown inside an error handler replaces the original",
            args: [[["a", "mw", "throw"], ["E1", "err", "throw"], ["E2", "err", "send"]]],
            expected: { trace: ["a", "E1", "E2"], sent: [500, "E1 failed"], done: [] },
            isEdgeCase: true,
          },
          {
            description: "1,000 pass-through layers before the responder",
            args: [[...Array.from({ length: 1000 }, (_, i) => [`m${i}`, "mw", "next"]), ["end", "mw", "send"]]],
            expected: { trace: [...Array.from({ length: 1000 }, (_, i) => `m${i}`), "end"], sent: [200, "end"], done: [] },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "express-app-use-ordering",
      moduleId: "be-express",
      trackId: "backend",
      title: "`app.use` & Middleware Ordering",
      summary:
        "`app.use(path, ...fns)` registers middleware for every HTTP method and every path that starts with `path` at a segment boundary (the default is `/`): `app.use('/api', fn)` runs for `/api` and `/api/users`, not for `/apiv2`. While that layer runs, Express strips the mount path: `req.url` and `req.path` become relative (`/users`), `req.baseUrl` holds the matched prefix and `req.originalUrl` keeps the full URL, which is what a request logger should record. That rewriting is what makes routers portable (the same router can be mounted at `/v1` and `/v2` without knowing its prefix). Params in a mount path such as `/orgs/:orgId` only reach the child router if it's created with `express.Router({ mergeParams: true })`.\n\nBecause the stack is ordered, registration order is architecture. Body parsers come before the handlers that read `req.body`. Request IDs and access logging go first so they see every request, including failures and 404s. Serving `express.static` early lets asset requests skip session loading and auth, which is fast but makes everything in that folder public. The 404 handler goes after every route and the error handlers go last. An auth middleware added with `app.use` after some routes silently leaves those earlier routes public.\n\nThe less obvious costs are scope and per-request work. Every global `app.use` runs for every request, health checks and assets included, so expensive middleware (a session-store lookup, a JSON parser with a 10 MB `limit`) belongs on the routers that need it. A router can also bail out of itself with `next('router')`, handing the request back to the app-level stack, which is handy for version switches and feature flags.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Express 5 API: app.use()", url: "https://expressjs.com/en/5x/api/application/", kind: "docs" },
        { label: "Express 5 API: req.baseUrl, req.path and req.originalUrl", url: "https://expressjs.com/en/5x/api/request/", kind: "docs" },
        { label: "Express: Production best practices, security", url: "https://expressjs.com/en/advanced/best-practice-security/", kind: "article" },
      ],
      video: {
        title: "Node.js and Express.js - Full Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
        videoId: "Oe421EPjeBE",
        durationLabel: "8:16:47",
        startSeconds: 22887,
        chapterLabel: "APP.USE",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "express-app-use-ordering-q1",
          prompt:
            "What does this log for `GET /api/users?limit=5`?\n\n```js\nconst router = express.Router();\nrouter.use((req, res, next) => {\n  console.log(req.baseUrl, req.path, req.originalUrl);\n  next();\n});\nrouter.get('/users', (req, res) => res.json([]));\napp.use('/api', router);\n```",
          options: [
            "`/api /users /api/users?limit=5`",
            "`/api/users /users /api/users`",
            "`'' /api/users /api/users?limit=5`",
            "`/api /users?limit=5 /api/users`",
          ],
          correctIndex: 0,
          explanation:
            "Inside a mounted router, `req.baseUrl` is the matched mount path, `req.path` is the path relative to it (never including the query string), and `req.originalUrl` is the untouched request URL. That's why loggers should use `originalUrl`: `req.url` is rewritten to `/users?limit=5` here.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-app-use-ordering-q2",
          prompt:
            "In Express 5, what happens when a client POSTs `{\"email\":\"a@b.c\"}` with `Content-Type: application/json`?\n\n```js\napp.post('/login', (req, res) => {\n  const { email } = req.body;\n  res.json({ email });\n});\napp.use(express.json());\n```",
          options: [
            "The handler throws a `TypeError` because `req.body` is `undefined`, so the request ends in a 500",
            "`email` is `undefined` because `req.body` defaults to `{}`",
            "Express runs built-in parsers first, so `email` is `\"a@b.c\"`",
            "The request hangs because nothing reads the body stream",
          ],
          correctIndex: 0,
          explanation:
            "Middleware runs in registration order, so the parser hasn't run when the route does. Express 5 leaves `req.body` as `undefined` until a parser sets it, so destructuring throws; in Express 4 it defaulted to `{}` and the bug hid as a silent `undefined`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-app-use-ordering-q3",
          prompt: "`app.use('/api', fn)` is registered with default settings. For which request paths does `fn` run? (Select all that apply.)",
          options: ["`/api`", "`/api/users/7`", "`/API/users`", "`/apiv2/users`", "`/v1/api`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`app.use` matches a path prefix at a segment boundary, case-insensitively by default. `/apiv2` doesn't match because the prefix must end at a `/` or the end of the path, and `/v1/api` doesn't start with `/api` at all.",
        },
        {
          id: "express-app-use-ordering-q4",
          prompt:
            "What does an anonymous user get for `GET /admin/stats`, where `requireAuth` responds 401 when there's no session?\n\n```js\napp.get('/admin/stats', getStats);\napp.use('/admin', requireAuth);\napp.get('/admin/users', listUsers);\n```",
          options: [
            "The stats, with a 200: that route was registered before the auth middleware",
            "A 401, because `app.use` middleware always runs before routes",
            "A 401, because `app.use('/admin', ...)` covers every `/admin` route wherever it's declared",
            "A 404, because `/admin` is registered twice",
          ],
          correctIndex: 0,
          explanation:
            "Express has one ordered stack, and `getStats` responds before the request ever reaches `requireAuth`. Only `/admin/users` is protected; this is a real and common way endpoints end up public.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-app-use-ordering-q5",
          prompt:
            "With `app.use('/orgs/:orgId/projects', projectsRouter)` and `projectsRouter.get('/:projectId', handler)`, which statements are true for `GET /orgs/acme/projects/7`? (Select all that apply.)",
          options: [
            "Without `mergeParams`, `req.params.orgId` is `undefined` inside `handler`",
            "With `express.Router({ mergeParams: true })`, `req.params` has both `orgId` and `projectId`",
            "`req.baseUrl` inside `handler` is `/orgs/acme/projects`",
            "`mergeParams` is passed to `app.use` as a third argument",
            "`req.params.projectId` is the number `7`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A router only sees its own params unless created with `mergeParams: true`, an option of `express.Router()`, not of `app.use`. `req.baseUrl` is the concrete matched prefix, not the pattern, and params are always strings.",
        },
        {
          id: "express-app-use-ordering-q6",
          prompt:
            "An app registers `app.use(session(...))`, then `app.use(requireAuth)`, then `app.use(express.static('public'))`. The login page loads `/css/app.css` from `public`. What happens?",
          options: [
            "Anonymous users get a 401 for the stylesheet, and every asset request pays for a session lookup",
            "Static files are always served before other middleware, so nothing changes",
            "`express.static` skips app-level middleware because it's built into Express",
            "Only the first asset request loads the session; Express caches it for the rest",
          ],
          correctIndex: 0,
          explanation:
            "`express.static` is ordinary middleware in the same stack, so everything registered before it runs first. Put public assets before session and auth middleware (or on their own path), and keep anything private out of the static folder.",
        },
        {
          id: "express-app-use-ordering-q7",
          prompt:
            "What does this app respond to `GET /api/users`?\n\n```js\napp.use((req, res) => res.status(404).json({ error: 'Not found' }));\napp.use('/api', apiRouter); // defines GET /users\n```",
          options: [
            "A 404 for every request, because the catch-all ends the response before the router runs",
            "The users, because routers take priority over plain middleware",
            "The users, because Express moves handlers that call `res.status(404)` to the end",
            "A 500, because the 404 handler must come after the error handler",
          ],
          correctIndex: 0,
          explanation:
            "A middleware without a path matches everything, and this one responds instead of calling `next()`. The 404 handler has to be registered after every route and router, just before the error handlers.",
        },
        {
          id: "express-app-use-ordering-q8",
          prompt:
            "Where should an access-log middleware that records status code and duration be registered?",
          options: [
            "First, recording the start time and writing the log line in `res.on('finish')`",
            "Last, after the error handler, so it sees the final status code",
            "Between the routes and the 404 handler",
            "Inside each route handler, just before `res.send()`",
          ],
          correctIndex: 0,
          explanation:
            "Registered first, it sees every request, and the `finish` event fires after the response is written, whoever wrote it (route, 404 or error handler). Middleware after the error handler never runs for requests that were already answered.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-app-use-ordering-q9",
          prompt:
            "What does `GET /v/items` with the header `x-api-version: 2` return?\n\n```js\nconst v1 = express.Router();\nv1.use((req, res, next) =>\n  req.get('x-api-version') === '2' ? next('router') : next()\n);\nv1.get('/items', (req, res) => res.send('v1'));\napp.use('/v', v1);\napp.get('/v/items', (req, res) => res.send('v2'));\n```",
          options: ["`v2`", "`v1`", "A 404, because `next('router')` aborts the request", "A 500, because `'router'` is treated as an error"],
          correctIndex: 0,
          explanation:
            "`next('router')` skips the rest of the current router and continues in the parent stack, where the app-level `/v/items` route matches. Like `'route'`, the string `'router'` is special and isn't treated as an error.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-app-use-ordering-q10",
          prompt: "Why mount `express.json({ limit: '10mb' })` only on the router that imports large documents, instead of globally?",
          options: [
            "Globally, any endpoint would buffer and parse up to 10 MB of JSON before its handler could reject the request",
            "`express.json()` can only be registered once per application",
            "A global parser disables streaming responses for every route",
            "The `limit` option is ignored unless the parser is mounted on a router",
          ],
          correctIndex: 0,
          explanation:
            "Parsers read the whole body before your route runs, so a generous global limit hands every endpoint (login included) a cheap memory and CPU amplifier. Keep the default 100 KB globally and raise it only where it's needed.",
        },
        {
          id: "express-app-use-ordering-q11",
          prompt: "Given `app.all('/reports', a)` and `app.use('/reports', b)`, which run for `GET /reports/2026`?",
          options: ["Only `b`", "Only `a`", "Both `a` and `b`", "Neither: both need a wildcard"],
          correctIndex: 0,
          explanation:
            "`app.all` registers a route, so its path must match the whole URL (apart from one trailing slash). `app.use` matches by prefix, so it also runs for `/reports/2026`.",
        },
      ],
    },
    {
      id: "express-params-query",
      moduleId: "be-express",
      trackId: "backend",
      title: "Route Params vs Query Strings",
      summary:
        "Route params and query strings answer different questions. Params identify the resource and are part of its address (`/orders/:orderId`); the query string refines a representation of it (filtering, sorting, pagination, sparse fieldsets) and should be optional, with sensible defaults. Getting that split right keeps URLs stable and cacheable: a required value hidden in the query, or a filter baked into the path, both make an API harder to evolve.\n\nThe types are the real trap. `req.params` values are always decoded strings, and `req.query` values are strings or arrays of strings: `?id=1&id=2` yields an array, which crashes code that calls `.toLowerCase()` and can slip past naive checks (HTTP parameter pollution). Express 5 switched the default `query parser` from `extended` (the `qs` library, which builds nested objects from `a[b]=1`) to `simple` (Node's `querystring`), so brackets are now literal characters. That closes the `?password[$ne]=x` operator-injection hole `extended` opened for MongoDB queries, but it silently breaks clients that send `filter[status]=open`; opt back in with `app.set('query parser', 'extended')` only if you validate the shape.\n\n`req.query` is also a getter in Express 5 that re-parses the URL on every access, so middleware doing `req.query.page = Number(req.query.page)` changes nothing, and assigning `req.query = ...` throws in strict-mode code such as ES modules. Validate and coerce once (zod, valibot, express-validator) and keep the typed result on `res.locals`. For shared lookups, `router.param('id', fn)` runs once per request for that param, before the matching route handlers.",
      level: "intermediate",
      estMinutes: 60,
      webRefs: [
        { label: "Express 5 API: req.params and req.query", url: "https://expressjs.com/en/5x/api/request/", kind: "docs" },
        { label: "Node.js: querystring.parse()", url: "https://nodejs.org/api/querystring.html", kind: "docs" },
        { label: "Express 5 API: router.param()", url: "https://expressjs.com/en/5x/api/router/", kind: "docs" },
        { label: "ljharb/qs: the 'extended' parser and its options", url: "https://github.com/ljharb/qs", kind: "repo" },
      ],
      video: {
        title: "Node.js and Express.js - Full Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
        videoId: "Oe421EPjeBE",
        durationLabel: "8:16:47",
        startSeconds: 20353,
        chapterLabel: "Route Params",
      },
      alternateVideos: [
        {
          title: "Express Crash Course",
          channel: "Traversy Media",
          url: "https://www.youtube.com/watch?v=CnH3kAXSrmU",
          videoId: "CnH3kAXSrmU",
          durationLabel: "1:46:10",
          startSeconds: 1590,
          chapterLabel: "Request Params (req.params)",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Express 5's default `query parser` is `\"simple\"`, which is Node's `querystring.parse`. Implement `parseQuery(queryString, options)` with the same behaviour. `queryString` is everything after the `?` and may be empty.\n\n- Split on `&`. Only the first `maxKeys` pieces are considered (`options.maxKeys`, default `1000`; `0` means no limit). Skip empty pieces.\n- Split each piece on its **first** `=`: the left side is the key and the rest is the value. A piece without `=` has the value `\"\"`.\n- Decode keys and values: replace every `+` with a space, then apply `decodeURIComponent`. If decoding throws, keep the text as it was after the `+` replacement.\n- The first occurrence of a key stores a string. Later occurrences turn it into an array of strings, in order.\n- Brackets get no special treatment: `a[b]=1` gives the key `\"a[b]\"`.\n- Keys that collide with `Object.prototype` members (`toString`, `constructor`, `__proto__`) are ordinary keys. Creating the result with `Object.create(null)`, as Node does, avoids false \"already seen\" hits and writes to the prototype.\n\nNode's real decoder is slightly more lenient when a broken escape sits between valid ones; the tests only use inputs where both behave the same.",
        starterCode:
          "/**\n * @param {string} queryString  everything after the \"?\", without the \"?\"\n * @param {{ maxKeys?: number }} [options]\n * @returns {Record<string, string | string[]>}\n */\nfunction parseQuery(queryString, options = {}) {\n  // Your code here\n}\n",
        functionName: "parseQuery",
        testCases: [
          {
            description: "simple pairs become string values",
            args: ["q=node&page=2&sort=-createdAt"],
            expected: { q: "node", page: "2", sort: "-createdAt" },
          },
          {
            description: "a repeated key becomes an array, in order",
            args: ["tag=a&tag=b&tag=c&page=1"],
            expected: { tag: ["a", "b", "c"], page: "1" },
          },
          {
            description: "`+` means space, then percent-decoding applies",
            args: ["name=John+Smith&city=S%C3%A3o%20Paulo&op=%2B1"],
            expected: { name: "John Smith", city: "São Paulo", op: "+1" },
          },
          {
            description: "brackets are literal characters with the simple parser",
            args: ["user[name]=ann&ids[]=1&ids[]=2"],
            expected: { "user[name]": "ann", "ids[]": ["1", "2"] },
          },
          {
            description: "a key without `=` and a key with an empty value both map to \"\"",
            args: ["flag&empty=&x=1"],
            expected: { flag: "", empty: "", x: "1" },
          },
          {
            description: "only the first `=` splits key from value",
            args: ["filter=status=open&expr=a=b=c"],
            expected: { filter: "status=open", expr: "a=b=c" },
          },
          {
            description: "keys are decoded too, and are case-sensitive",
            args: ["first%20name=Ann&A=1&a=2"],
            expected: { "first name": "Ann", A: "1", a: "2" },
          },
          {
            description: "an empty query string gives an empty object",
            args: [""],
            expected: {},
            isEdgeCase: true,
          },
          {
            description: "empty pieces between `&`s are skipped",
            args: ["&&a=1&&b=2&"],
            expected: { a: "1", b: "2" },
            isEdgeCase: true,
          },
          {
            description: "keys named like Object.prototype members are ordinary keys",
            args: ["toString=1&constructor=x&constructor=y&hasOwnProperty=z"],
            expected: { toString: "1", constructor: ["x", "y"], hasOwnProperty: "z" },
            isEdgeCase: true,
          },
          {
            description: "a key named `__proto__` is stored as data, not as the prototype",
            args: ["__proto__=x&a=1"],
            expected: { ["__proto__"]: "x", a: "1" },
            isEdgeCase: true,
          },
          {
            description: "malformed percent escapes are kept as raw text",
            args: ["a=%zz&b=100%&c=%41"],
            expected: { a: "%zz", b: "100%", c: "A" },
            isEdgeCase: true,
          },
          {
            description: "an empty key is allowed",
            args: ["=x&y="],
            expected: { "": "x", y: "" },
            isEdgeCase: true,
          },
          {
            description: "custom maxKeys keeps only the first pieces",
            args: ["a=1&b=2&c=3", { maxKeys: 2 }],
            expected: { a: "1", b: "2" },
            isEdgeCase: true,
          },
          {
            description: "the default maxKeys of 1000 drops everything after the 1,000th piece",
            args: [Array.from({ length: 1002 }, (_, i) => `k${i}=v`).join("&")],
            expected: Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`k${i}`, "v"])),
            isEdgeCase: true,
          },
          {
            description: "1,500 copies of one key are capped at 1,000 values",
            args: [Array.from({ length: 1500 }, () => "id=7").join("&")],
            expected: { id: Array.from({ length: 1000 }, () => "7") },
            isEdgeCase: true,
          },
          {
            description: "maxKeys: 0 means no limit",
            args: [Array.from({ length: 1500 }, () => "id=7").join("&"), { maxKeys: 0 }],
            expected: { id: Array.from({ length: 1500 }, () => "7") },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "express-http-methods",
      moduleId: "be-express",
      trackId: "backend",
      title: "HTTP Methods in Practice: GET, POST, PUT, PATCH, DELETE",
      summary:
        "HTTP methods are a contract with every cache, proxy, retry policy and client library between you and the caller, not a naming convention. RFC 9110 defines two properties that infrastructure relies on. Safe methods (GET, HEAD and OPTIONS among them) must not change state, so crawlers, link scanners and prefetchers may call them freely. Idempotent methods (the safe ones plus PUT and DELETE) have the same effect whether sent once or five times, which is what lets clients, load balancers and service meshes retry them after a timeout. POST and PATCH are neither by default, so a retried `POST /payments` can charge twice unless you accept an `Idempotency-Key`.\n\nPUT replaces the whole representation at a URL the client already knows; fields left out are reset or rejected, never silently kept. PATCH sends a description of changes: JSON Merge Patch (RFC 7396, where `null` deletes a field) or JSON Patch (RFC 6902, a list of operations). POST creates a subordinate resource whose id the server picks and answers `201 Created` with a `Location` header. DELETE is idempotent in effect but not in response: a repeat can return 404, and that's fine.\n\nIn Express these are just `app.get/post/put/patch/delete`, and nothing enforces the semantics. The classic failures are a GET with side effects that an email link scanner triggers, a \"PUT\" that merges like PATCH so clients can never clear a field, a missing `return` after an early `res.status(404).json(...)`, and a body that silently isn't parsed because the client didn't send `Content-Type: application/json` (in Express 5, `req.body` is then `undefined`). Express does answer `HEAD` with your GET handler and `OPTIONS` with an automatic `Allow` list, but an unsupported method gets a 404, not a 405.",
      level: "intermediate",
      estMinutes: 90,
      webRefs: [
        { label: "RFC 9110: Method definitions (safe and idempotent methods)", url: "https://www.rfc-editor.org/rfc/rfc9110.html#name-method-definitions", kind: "spec" },
        { label: "MDN: PATCH request method", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/PATCH", kind: "docs" },
        { label: "RFC 7396: JSON Merge Patch", url: "https://www.rfc-editor.org/rfc/rfc7396.html", kind: "spec" },
        { label: "Stripe: Designing robust and predictable APIs with idempotency", url: "https://stripe.com/blog/idempotency", kind: "article" },
      ],
      video: {
        title: "Node.js and Express.js - Full Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
        videoId: "Oe421EPjeBE",
        durationLabel: "8:16:47",
        startSeconds: 24206,
        chapterLabel: "Methods - GET",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "express-http-methods-q1",
          prompt: "Which of these methods are idempotent according to RFC 9110? (Select all that apply.)",
          options: ["GET", "PUT", "DELETE", "POST", "PATCH"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Safe methods are idempotent by definition, and PUT and DELETE are idempotent because repeating them leaves the same state. POST and PATCH aren't guaranteed to be; a PATCH like \"increment by 1\" clearly isn't.",
        },
        {
          id: "express-http-methods-q2",
          prompt:
            "A user is stored as `{ \"name\": \"Ann\", \"nickname\": \"Annie\", \"role\": \"admin\" }`. A client sends `PUT /users/7` with `{ \"name\": \"Ann B.\" }`. Under correct PUT semantics, what happens?",
          options: [
            "The body replaces the resource, so `nickname` and `role` are cleared or defaulted (or the server rejects the incomplete body)",
            "Only `name` changes, because PUT merges the fields it receives",
            "The server must answer 405, because PUT can't change a single field",
            "A new user is created, because PUT always creates",
          ],
          correctIndex: 0,
          explanation:
            "PUT means \"make the resource look like this\". A handler that merges instead is really a PATCH, and it leaves clients with no way to clear a field. Silently resetting `role` is also why many APIs reject an incomplete PUT with 422 rather than applying it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-http-methods-q3",
          prompt:
            "The stored document is `{ \"name\": \"Ann\", \"nickname\": \"Annie\", \"address\": { \"city\": \"Delhi\", \"zip\": \"110001\" } }`. The client sends a JSON Merge Patch (RFC 7396): `{ \"nickname\": null, \"address\": { \"city\": \"Pune\" } }`. What's the result?",
          options: [
            "`{ \"name\": \"Ann\", \"address\": { \"city\": \"Pune\", \"zip\": \"110001\" } }`",
            "`{ \"name\": \"Ann\", \"nickname\": null, \"address\": { \"city\": \"Pune\" } }`",
            "`{ \"name\": \"Ann\", \"nickname\": null, \"address\": { \"city\": \"Pune\", \"zip\": \"110001\" } }`",
            "`{ \"name\": \"Ann\", \"address\": { \"city\": \"Pune\" } }`",
          ],
          correctIndex: 0,
          explanation:
            "In a merge patch, `null` removes a member and nested objects are merged recursively, so `zip` survives. The catch is that you can't use merge patch to set a field to a literal `null`, and arrays are replaced wholesale.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-http-methods-q4",
          prompt:
            "A mobile client times out on `POST /payments` and retries automatically, but the first request had actually succeeded. What's the standard fix?",
          options: [
            "Clients send an `Idempotency-Key`; the server stores it with the first result and replays that response for repeats",
            "Switch the endpoint to PUT, which makes it idempotent automatically",
            "Reject any second POST from the same user within 60 seconds with 409",
            "Rely on TCP retransmission, which already removes duplicate requests",
          ],
          correctIndex: 0,
          explanation:
            "Idempotency is a property you implement, not one you get by renaming the method: the key lets the server recognise a retry and return the stored outcome. A time-window rule blocks legitimate repeat payments, and TCP knows nothing about HTTP-level retries.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-http-methods-q5",
          prompt:
            "`todos` is a `Map` keyed by id strings. What happens on `DELETE /todos/99` when there's no todo 99?\n\n```js\napp.delete('/todos/:id', (req, res) => {\n  if (!todos.has(req.params.id)) {\n    res.status(404).json({ error: 'Not found' });\n  }\n  todos.delete(req.params.id);\n  res.sendStatus(204);\n});\n```",
          options: [
            "The client gets the 404, then `res.sendStatus(204)` throws `ERR_HTTP_HEADERS_SENT`, which Express passes to the error handler",
            "The client gets a 204, because the last status set wins",
            "The client gets the 404 and nothing else happens: Express ignores the second response",
            "Express merges both into a 404 with an empty body",
          ],
          correctIndex: 0,
          explanation:
            "`res.json()` sends the response but doesn't return from the handler, so execution continues and the second attempt to set headers throws (\"Cannot set headers after they are sent to the client\"). Write `return res.status(404).json(...)`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-http-methods-q6",
          prompt:
            "What does `GET /todos/1` return?\n\n```js\nconst todos = new Map([[1, { id: 1, title: 'Ship it' }]]);\napp.get('/todos/:id', (req, res) => {\n  const todo = todos.get(req.params.id);\n  if (!todo) return res.status(404).json({ error: 'Not found' });\n  res.json(todo);\n});\n```",
          options: [
            "A 404, because `req.params.id` is the string `\"1\"` and the Map key is the number `1`",
            "The todo, because Express converts numeric params to numbers",
            "The todo, because `Map#get` compares keys loosely",
            "A 500, because `Map#get` throws for a missing key",
          ],
          correctIndex: 0,
          explanation:
            "Route params are always strings, and `Map` compares keys with SameValueZero, so `\"1\"` and `1` are different keys. Parse and validate ids once (for example `Number(req.params.id)` with an integer check) before using them.",
        },
        {
          id: "express-http-methods-q7",
          prompt: "Which responses are appropriate for a successful `DELETE /files/42`? (Select all that apply.)",
          options: [
            "`204 No Content` when the file is gone and there's nothing more to say",
            "`200 OK` with a body describing the outcome",
            "`202 Accepted` when the deletion has been queued but not yet performed",
            "`201 Created`, because a deletion record was created",
            "`304 Not Modified`, because the resource no longer changes",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "RFC 9110 lists exactly these three: 202 if the action is likely to succeed but hasn't been enacted, 204 if it's done with nothing to add, 200 if it's done and the response describes the status. 201 and 304 describe other situations.",
        },
        {
          id: "express-http-methods-q8",
          prompt:
            "Users report being unsubscribed from a newsletter without clicking anything. The email links to `GET /unsubscribe?token=...`, which unsubscribes immediately. What's the most likely cause, and the fix?",
          options: [
            "Email security scanners fetch links in messages; GET must be safe, so show a confirmation page and unsubscribe on a POST",
            "Browsers cache GET responses, so replay the request with a random query parameter",
            "The token is too short; use a longer token and keep the GET",
            "Express retries GET requests on timeout; disable retries with a header",
          ],
          correctIndex: 0,
          explanation:
            "Anything that treats GET as safe (link scanners, prefetchers, crawlers) will trigger a state change hidden behind a GET. Move the change to POST, which is also what RFC 8058 one-click unsubscribe uses.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-http-methods-q9",
          prompt:
            "An Express 5 app defines only `app.get('/items', ...)` and `app.post('/items', ...)`. Which statements are true? (Select all that apply.)",
          options: [
            "`HEAD /items` runs the GET handler, and the body isn't sent",
            "`OPTIONS /items` gets an automatic 200 with `Allow: GET, HEAD, POST`",
            "`DELETE /items` falls through to the 404 handler",
            "`PUT /items` gets an automatic `405 Method Not Allowed`",
            "`HEAD /items` returns 404 because no HEAD route exists",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The router serves HEAD with GET routes and answers OPTIONS from the methods it knows. It doesn't produce 405s, though: an unknown method on a known path is simply unmatched and ends in a 404 unless you add a handler that sets `Allow` and returns 405.",
        },
        {
          id: "express-http-methods-q10",
          prompt:
            "The frontend calls `fetch('/api/items', { method: 'POST', body: JSON.stringify(item) })` against an Express 5 app using `app.use(express.json())`. What does the handler see in `req.body`?",
          options: [
            "`undefined`, because a string body is sent as `text/plain;charset=UTF-8` and `express.json()` only parses JSON media types",
            "The parsed object, because `express.json()` sniffs the body",
            "The raw JSON string",
            "`{}`",
          ],
          correctIndex: 0,
          explanation:
            "`express.json()` checks `Content-Type` (by default `application/json`) and skips anything else. Without the header, fetch labels a string body `text/plain`, and Express 5 leaves `req.body` undefined instead of Express 4's `{}`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-http-methods-q11",
          prompt: "When is it correct for `PUT /users/7/avatar` to return `201 Created` rather than `200 OK`?",
          options: [
            "When no avatar existed at that URL and this PUT created it",
            "When the new image is larger than the old one",
            "Never: only POST may return 201",
            "When the client sends `If-None-Match: *` and an avatar already exists",
          ],
          correctIndex: 0,
          explanation:
            "PUT can create a resource at a client-chosen URL, and then 201 is the right answer; replacing an existing one is 200 or 204. `If-None-Match: *` on an existing resource should fail with 412, not succeed.",
        },
        {
          id: "express-http-methods-q12",
          prompt: "Which status code pairings follow common convention? (Select all that apply.)",
          options: [
            "Malformed JSON in the body: `400 Bad Request`",
            "Well-formed body that fails validation (`quantity: -3`): `422 Unprocessable Content`",
            "Creating a user whose email is already taken: `409 Conflict`",
            "Missing or invalid credentials: `403 Forbidden`",
            "A valid request for an order that doesn't exist: `403 Forbidden`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Missing or bad credentials are 401 (with `WWW-Authenticate`); 403 means authenticated but not allowed. A missing resource is 404, although some APIs return 404 for unauthorised resources too, to avoid leaking that they exist.",
        },
      ],
    },
    {
      id: "express-error-handling",
      moduleId: "be-express",
      trackId: "backend",
      title: "Centralized Error-Handling Middleware",
      summary:
        "Centralized error handling exists so that every failure, from a thrown `TypeError` to a rejected database call, becomes one consistent response and one log line, instead of dozens of hand-rolled `try/catch` blocks that each pick their own status and format. Handlers throw or call `next(err)`; a single error middleware registered after every route and the 404 handler maps errors to a status and a body (RFC 9457 `application/problem+json` is a good default) and logs them with the request id.\n\nExpress 5 finally makes this work for async code: a handler that returns a rejected promise is routed to `next(err)` for you, so `express-async-errors` and `asyncHandler` wrappers are obsolete. Express 4 ignored the returned promise, so a failed `await` inside a route became an unhandled rejection (which crashes the process on Node 15 and later) while the client never got a response. Errors thrown inside callbacks and timers still escape both versions, because they're neither on the handler's call stack nor part of its promise: promisify the API or catch and forward them yourself.\n\nThe details that bite: error middleware is recognised only by declaring exactly four parameters, so a lint autofix that deletes the \"unused\" `next` silently demotes it to regular middleware. If the response has already started (`res.headersSent`), delegate with `next(err)` and let Express close the connection. Express's default handler uses `err.status` or `err.statusCode` (anything outside 4xx and 5xx becomes 500) and includes the stack unless `NODE_ENV=production`. Never echo `err.message` from unexpected errors to clients; that's how hostnames, SQL and file paths leak. Map expected operational errors (validation, not found, conflict) to 4xx, and treat programmer errors as bugs to alert on.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Express: Error handling", url: "https://expressjs.com/en/guide/error-handling/", kind: "docs" },
        { label: "RFC 9457: Problem Details for HTTP APIs", url: "https://www.rfc-editor.org/rfc/rfc9457.html", kind: "spec" },
        {
          label: "Node.js Best Practices: operational vs programmer errors",
          url: "https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/operationalvsprogrammererror.md",
          kind: "article",
        },
      ],
      video: {
        title: "Express Crash Course",
        channel: "Traversy Media",
        url: "https://www.youtube.com/watch?v=CnH3kAXSrmU",
        videoId: "CnH3kAXSrmU",
        durationLabel: "1:46:10",
        startSeconds: 3624,
        chapterLabel: "Custom Error Handler",
      },
      alternateVideos: [
        {
          title: "🤯 Express.js 5 is here (since a month already, actually)",
          channel: "Academind",
          url: "https://www.youtube.com/watch?v=-MMjFX5UfN4",
          videoId: "-MMjFX5UfN4",
          durationLabel: "9:58",
          startSeconds: 287,
          chapterLabel: "Promise support",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "express-error-handling-q1",
          prompt:
            "`db.findUser` rejects with \"connection refused\". What happens in Express 4 and in Express 5?\n\n```js\napp.get('/users/:id', async (req, res) => {\n  const user = await db.findUser(req.params.id);\n  res.json(user);\n});\napp.use((err, req, res, next) => {\n  res.status(500).json({ error: 'Internal error' });\n});\n```",
          options: [
            "Express 5 sends the 500 from the error handler; Express 4 ignores the promise, so the rejection is unhandled and the client never gets the 500",
            "Both versions route the rejection to the error handler",
            "Express 5 leaves the request hanging; Express 4 sends the 500",
            "Both versions crash the process before any response",
          ],
          correctIndex: 0,
          explanation:
            "Express 5's router attaches a rejection handler to the promise a handler returns and calls `next(err)`. Express 4 dropped the promise on the floor, which is why wrappers like `express-async-errors` existed; on Node 15+ an unhandled rejection crashes the process by default.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-error-handling-q2",
          prompt:
            "In Express 5, what happens when `/etc/app.json` doesn't exist?\n\n```js\napp.get('/config', (req, res) => {\n  fs.readFile('/etc/app.json', 'utf8', (err, data) => {\n    res.json(JSON.parse(data));\n  });\n});\n```",
          options: [
            "`JSON.parse(undefined)` throws inside the callback, outside Express's reach, so it's an uncaught exception that crashes the process",
            "Express 5 catches it and the error handler sends a 500",
            "`fs.readFile` throws synchronously, so Express catches the error",
            "Express responds 404 because the file is missing",
          ],
          correctIndex: 0,
          explanation:
            "By the time the callback runs, the handler has returned, so its try/catch and returned value are gone. Use `fs.promises.readFile` with `await` (so a rejection reaches Express), or check `err` and call `next(err)`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-error-handling-q3",
          prompt:
            "A lint autofix removed the \"unused\" parameter from the last middleware:\n\n```js\napp.use((err, req, res) => {\n  res.status(err.status ?? 500).json({ error: err.message });\n});\n```\n\nWhat's the effect?",
          options: [
            "Express now treats it as regular middleware: errors skip it and reach the default HTML handler, and unmatched requests hit it with the wrong arguments",
            "Nothing changes, because Express recognises error handlers by the parameter name `err`",
            "Nothing changes, because the last middleware always receives errors",
            "Express throws at startup because error handlers need four parameters",
          ],
          correctIndex: 0,
          explanation:
            "Express decides by `fn.length === 4`. With three parameters it's called as `(req, res, next)` for unmatched requests (so `res.status` is really `next.status` and it throws) and skipped for errors. Keep `next`, with an eslint-disable comment if needed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-error-handling-q4",
          prompt: "Which statements describe Express's built-in default error handler? (Select all that apply.)",
          options: [
            "It sets the status from `err.status` or `err.statusCode`",
            "It uses 500 when that value is outside the 4xx–5xx range",
            "It includes the stack trace in the response unless `NODE_ENV` is `production`",
            "In production it logs nothing and sends an empty body",
            "It retries the failed handler once before responding",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "In production the body is just the status text (for example \"Service Unavailable\"), but the stack is still printed to stderr unless the app runs with `NODE_ENV=test`. Express never retries a handler.",
        },
        {
          id: "express-error-handling-q5",
          prompt:
            "A CSV export streams rows with `res.write()` and fails halfway through. The error handler does `res.status(500).json({ error: 'Export failed' })`. What should it do instead?",
          options: [
            "Check `res.headersSent` and call `next(err)`, so Express's default handler closes the connection",
            "Call `res.status(500).end()` to overwrite the status that was already sent",
            "Write a JSON error as the next chunk, which clients will parse",
            "Nothing: Express buffers streamed rows until the handler returns",
          ],
          correctIndex: 0,
          explanation:
            "Once headers are on the wire the status can't change, and trying throws `ERR_HTTP_HEADERS_SENT`. Delegating lets Express abort the connection, so the client sees a failed (truncated) download instead of a \"successful\" partial file.",
        },
        {
          id: "express-error-handling-q6",
          prompt:
            "With Express 5, what reaches the error handler for each route?\n\n```js\napp.get('/a', async () => { throw 'nope'; });\napp.get('/b', () => Promise.reject());\n```",
          options: [
            "For `/a` the string `'nope'` (no `message`, no stack); for `/b` an `Error` with the message \"Rejected promise\"",
            "An `Error` wrapping the value in both cases",
            "Nothing for `/b`: rejecting with no reason doesn't count as an error",
            "The string `'nope'` for `/a`, and `undefined` for `/b`",
          ],
          correctIndex: 0,
          explanation:
            "Express forwards whatever was thrown or rejected, so throwing non-Errors gives your handler no stack and no `message`. Only a falsy rejection reason is replaced, with `new Error('Rejected promise')`, so the request isn't treated as a success.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-error-handling-q7",
          prompt: "Which failures should normally become a 4xx response rather than a 500? (Select all that apply.)",
          options: [
            "A request body that fails schema validation",
            "A lookup for an order id that doesn't exist",
            "A unique-constraint violation when signing up with a taken email",
            "`TypeError: Cannot read properties of undefined` inside a handler",
            "The database connection pool being exhausted",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three are expected, operational outcomes the client can act on (422 or 400, 404, 409). A `TypeError` is a bug and pool exhaustion is a server-side capacity problem: both are 5xx and should alert someone.",
        },
        {
          id: "express-error-handling-q8",
          prompt: "The error handler responds with `{ error: err.message }` for every error. Why is that risky?",
          options: [
            "Messages from unexpected errors can leak internals, such as SQL fragments, hostnames or absolute file paths",
            "`err.message` is undefined for most errors, so clients receive `{}`",
            "It stops Express from logging the stack trace",
            "JSON can't encode multi-line messages",
          ],
          correctIndex: 0,
          explanation:
            "An `ENOENT` from the filesystem includes the full path, and driver errors often include hosts or query text. Send a generic message plus a correlation id for unknown errors and log the details server-side; only errors you created on purpose should have client-safe messages.",
        },
        {
          id: "express-error-handling-q9",
          prompt:
            "What does `GET /boom` return?\n\n```js\napp.use((err, req, res, next) => res.status(500).json({ error: 'oops' }));\napp.get('/boom', () => { throw new Error('x'); });\n```",
          options: [
            "Express's default HTML 500 page, because the custom handler sits before the route and the error never flows back to it",
            "`{ \"error\": \"oops\" }`, because error handlers apply wherever they're registered",
            "A 404, because the error handler swallows the route",
            "The request hangs, because nothing calls `next`",
          ],
          correctIndex: 0,
          explanation:
            "Errors only travel forward through the stack. An error handler placed before the routes can only catch errors from middleware above it, so it must be registered after all routes and the 404 handler.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-error-handling-q10",
          prompt:
            "With no custom error handler, what status does Express 5 send for `GET /orders/9`?\n\n```js\nclass HttpError extends Error {\n  constructor(status, message) {\n    super(message);\n    this.status = status;\n  }\n}\napp.get('/orders/:id', async () => {\n  throw new HttpError(404, 'Order not found');\n});\n```",
          options: ["404", "500", "200 with an empty body", "400"],
          correctIndex: 0,
          explanation:
            "The default handler reads `err.status` (or `err.statusCode`) and uses it when it's a 4xx or 5xx code. That convention is why libraries such as `http-errors` put the code on the error object.",
        },
        {
          id: "express-error-handling-q11",
          prompt: "Why do many teams make the error handler respond with `application/problem+json` (RFC 9457)?",
          options: [
            "It's a standard shape (`type`, `title`, `status`, `detail`, `instance`) that clients and gateways can parse the same way for every error",
            "Browsers display problem+json errors natively",
            "Express 5 requires it for errors with a status code",
            "It makes errors cacheable by CDNs",
          ],
          correctIndex: 0,
          explanation:
            "A consistent, documented error format means clients write one error parser, and you can extend it with fields such as validation details or a trace id. Nothing in Express or the browser requires it.",
        },
      ],
    },
    {
      id: "express-static-templating",
      moduleId: "be-express",
      trackId: "backend",
      title: "Serving Static Files & Templating",
      summary:
        "`express.static(root, options)` wraps `serve-static` and `send`: it maps URL paths onto a directory and gives you streaming, `ETag` and `Last-Modified` validators, `Range` requests and path-traversal protection for free. It's the right tool for a small app's assets or an SPA shell, but a CDN or reverse proxy serves files far more cheaply than your event loop, so bigger deployments put one in front. A relative root resolves against the process's working directory, not the source file, so `express.static('public')` breaks when a process manager starts the app from `/`; use `path.join(import.meta.dirname, 'public')` or `__dirname`.\n\nThe options decide production behaviour. `maxAge` defaults to 0, so browsers revalidate every asset; fingerprinted files (`app.3f9c1e.js`) deserve a long `maxAge` plus `immutable`, while `index.html` must stay short-lived or users get stuck on old builds. `fallthrough: true` (the default) calls `next()` on a miss so later routes can respond. Express 5 made `dotfiles` default to `'ignore'` and applies it to hidden directories too, so `/.well-known/...` (ACME challenges, app links) returns 404 until you mount it with `dotfiles: 'allow'`.\n\nServer-side templates (`app.set('view engine', 'ejs')` and `res.render(view, locals)`) still suit admin tools, emails and low-JavaScript pages. Express merges `app.locals`, `res.locals` and the render locals, and turns on `view cache` when `NODE_ENV=production`, which is why editing a template on a server \"does nothing\" until a restart. The security line is escaping: EJS `<%= %>` escapes HTML and `<%- %>` doesn't, so `<%-` around user data is stored XSS. And never pass `req.query` as the locals object: EJS 3.1.6 could be driven to run OS commands that way (CVE-2022-29078).",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Express: Serving static files", url: "https://expressjs.com/en/starter/static-files/", kind: "docs" },
        { label: "Express: serve-static options", url: "https://expressjs.com/en/resources/middleware/serve-static/", kind: "docs" },
        { label: "Express: Using template engines", url: "https://expressjs.com/en/guide/using-template-engines/", kind: "docs" },
        { label: "EJS: Embedded JavaScript templates", url: "https://ejs.co/", kind: "docs" },
      ],
      video: {
        title: "Node.js and Express.js - Full Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
        videoId: "Oe421EPjeBE",
        durationLabel: "8:16:47",
        startSeconds: 18871,
        chapterLabel: "Express - All Static",
      },
      alternateVideos: [
        {
          title: "Express Crash Course",
          channel: "Traversy Media",
          url: "https://www.youtube.com/watch?v=CnH3kAXSrmU",
          videoId: "CnH3kAXSrmU",
          durationLabel: "1:46:10",
          startSeconds: 5760,
          chapterLabel: "EJS Template Engine Setup",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "express-static-templating-q1",
          prompt:
            "`app.use(express.static('public'))` works locally, where you run `node server.js` from the project folder. In production, the process manager starts the same file with the working directory set to `/`. What happens?",
          options: [
            "Every asset 404s, because a relative root resolves against the working directory (`/public`), not the file",
            "It still works, because `express.static` resolves paths relative to the calling file",
            "Express throws at startup because the directory doesn't exist",
            "It serves files from the filesystem root, exposing `/etc`",
          ],
          correctIndex: 0,
          explanation:
            "`serve-static` resolves the root with `path.resolve`, which uses `process.cwd()`. Anchor it to the module instead: `path.join(import.meta.dirname, 'public')` in ES modules or `path.join(__dirname, 'public')` in CommonJS.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-static-templating-q2",
          prompt:
            "After upgrading to Express 5, Let's Encrypt renewals fail: `GET /.well-known/acme-challenge/<token>` returns 404, although the file exists in `public/.well-known/`. Why?",
          options: [
            "Express 5's `express.static` defaults `dotfiles` to `'ignore'` and applies it to hidden directories, so mount that folder with `dotfiles: 'allow'`",
            "Express 5's router blocks every path that starts with `/.`",
            "`express.static` no longer serves files without an extension",
            "ACME challenges must be served with `res.sendFile`, not static middleware",
          ],
          correctIndex: 0,
          explanation:
            "Express 4 served dot-directories by default; Express 5 pretends they don't exist. The migration guide suggests `app.use('/.well-known', express.static('public/.well-known', { dotfiles: 'allow' }))` so only that folder is opened up.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-static-templating-q3",
          prompt:
            "A Vite build emits fingerprinted files into `dist/assets` (for example `index-3f9c1e.js`) and an `index.html` that references them. Which caching choices are sound? (Select all that apply.)",
          options: [
            "Serve `/assets` with a long `maxAge` and `immutable: true`",
            "Keep `index.html` short-lived, so new deployments are picked up",
            "With the default `maxAge: 0`, browsers still revalidate with `ETag` or `Last-Modified` and can get a cheap 304",
            "Give `index.html` the same one-year `immutable` policy so it loads instantly",
            "Turn off `etag`, because `maxAge` makes validators pointless",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A fingerprinted name changes whenever the content does, so it can be cached forever. `index.html` is the entry point that points at the new names; caching it for a year would pin users to an old build. Validators are what make short-lived caching cheap.",
        },
        {
          id: "express-static-templating-q4",
          prompt: "What does `express.static('uploads', { fallthrough: false })` change?",
          options: [
            "A missing file calls `next(err)` with a 404 error, so later routes never see the request",
            "Missing files are passed on to the next route, as usual",
            "It generates a directory listing for folders without an `index.html`",
            "It stops the middleware from redirecting `/dir` to `/dir/`",
          ],
          correctIndex: 0,
          explanation:
            "With `fallthrough: false`, client errors (including 404s) go to your error handlers, which suits a prefix that's purely one directory. Be careful what the handler echoes: the error message contains the absolute path that wasn't found.",
        },
        {
          id: "express-static-templating-q5",
          prompt:
            "A profile page renders `<p>Welcome back, <%- user.displayName %></p>`, and users choose their own display name. What's wrong?",
          options: [
            "It's stored XSS: `<%-` outputs raw HTML, so use `<%=`, which escapes it",
            "Nothing: EJS escapes all output by default",
            "Nothing, as long as the page is served over HTTPS",
            "It only matters in development; the production view cache escapes output",
          ],
          correctIndex: 0,
          explanation:
            "A display name like `<img src=x onerror=...>` would run in every viewer's browser. Reserve `<%-` for trusted HTML such as included partials, and add a Content Security Policy as a second layer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-static-templating-q6",
          prompt:
            "Someone hot-fixes a typo by editing a `.ejs` file directly on a production server, but users still see the old text. Why?",
          options: [
            "Express enables `view cache` when `NODE_ENV=production`, so compiled templates stay in memory until the process restarts",
            "Browsers cache HTML pages indefinitely by default",
            "EJS compiles templates when `npm install` runs",
            "`express.static` is serving an old copy of the template",
          ],
          correctIndex: 0,
          explanation:
            "Caching compiled templates is a large speed-up and is on by default in production. Ship template changes like code, through a deploy and restart.",
        },
        {
          id: "express-static-templating-q7",
          prompt:
            "Which values can the template read when a handler calls `res.render('profile', { title: 'Profile' })`? (Select all that apply.)",
          options: [
            "`siteName`, set at startup with `app.locals.siteName = 'Trails'`",
            "`user`, set by an auth middleware with `res.locals.user = ...`",
            "`title`, passed to `res.render`",
            "Every `req.query` parameter, automatically",
            "Local variables declared in the route handler",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`res.render` merges `app.locals` (app-wide), `res.locals` (this request) and the object you pass, with the more specific one winning. Nothing from the request or the handler's scope is exposed unless you put it there.",
        },
        {
          id: "express-static-templating-q8",
          prompt: "Why is `res.render('search', req.query)` dangerous, even though it looks like a neat shortcut?",
          options: [
            "The client controls the whole locals object, including option-like keys the engine may honour; EJS 3.1.6 allowed remote code execution this way (CVE-2022-29078)",
            "It's slow, because `req.query` is re-parsed on every property access",
            "EJS can't render values that are arrays",
            "It disables the view cache for that template",
          ],
          correctIndex: 0,
          explanation:
            "Locals and render options travel in the same object, so passing raw input lets an attacker set options such as `settings['view options']`. Build the locals explicitly from validated values.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-static-templating-q9",
          prompt:
            "`app.use(express.static('public'))` is registered before `app.get('/health', ...)`, and someone accidentally commits a file named `public/health`. What does `GET /health` return?",
          options: [
            "The contents of the file, because the static middleware runs first and responds",
            "The health route's response, because routes take priority over middleware",
            "A 409, because two handlers match",
            "The route's response, because `express.static` only serves files with an extension",
          ],
          correctIndex: 0,
          explanation:
            "There's no priority beyond registration order: the static middleware finds a file and ends the response. Mounting assets under a prefix (`app.use('/static', ...)`) avoids this class of collision.",
        },
        {
          id: "express-static-templating-q10",
          prompt:
            "Which download handler is safe against `GET /download/..%2Fsecrets.json`?\n\n```js\n// A\napp.get('/download/:name', (req, res) =>\n  res.sendFile(path.join(FILES_DIR, req.params.name)));\n\n// B\napp.get('/download/:name', (req, res, next) =>\n  res.sendFile(req.params.name, { root: FILES_DIR }, (err) => err && next(err)));\n```",
          options: [
            "B: with `root`, `send` refuses paths containing `..` with a 403, while A happily joins the decoded `../secrets.json`",
            "A: `path.join` normalises away the `..`",
            "Both: Express rejects `%2F` inside a param",
            "Neither: the router has already decoded the path to `/secrets.json`",
          ],
          correctIndex: 0,
          explanation:
            "The param decodes to `../secrets.json`, and `path.join` resolves it outside `FILES_DIR`. Passing the user value as a path relative to `root` lets `send` enforce containment (it answers 403 for `..`).",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "express-file-uploads-multer",
      moduleId: "be-express",
      trackId: "backend",
      title: "File Uploads with Multer",
      summary:
        "`express.json()` and `express.urlencoded()` ignore `multipart/form-data`, the encoding browsers use for file inputs, so uploads need a streaming multipart parser. Multer, built on busboy and maintained by the Express team, is the usual choice: `upload.single('avatar')`, `.array('photos', 8)` or `.fields([...])` on a specific route puts files on `req.file` or `req.files` and text fields on `req.body`. Mount it per route, never globally with `.any()`, or every endpoint accepts files nobody planned to handle. Part order matters too: text fields sent after the file aren't in `req.body` yet when `fileFilter` or `diskStorage` callbacks run.\n\nStorage is a design decision. `memoryStorage()` hands you a `Buffer`, handy for piping to S3 or image processing, but a few concurrent large uploads can exhaust the heap. `diskStorage()` (or `dest`) streams to disk, using random, extension-less names by default. For big files, a presigned direct-to-bucket upload keeps the bytes off your servers entirely. Always set `limits` (`fileSize`, `files`, `fields`, `parts`); unlimited multipart parsing is an easy denial-of-service vector. Violations surface as a `MulterError` with a code such as `LIMIT_FILE_SIZE` or `LIMIT_UNEXPECTED_FILE`, which your error handler should map to 413 or 400.\n\nEverything the client describes is untrusted. `file.originalname` and `file.mimetype` come straight from the request, so a PHP script can arrive as `avatar.png` labelled `image/png`, and a `fileFilter` that checks `mimetype` accepts it. Generate your own storage names, check magic bytes or re-encode images, keep uploads out of your static folder, and serve them with `Content-Disposition` and `X-Content-Type-Options: nosniff`. A `fileFilter` rejection (`cb(null, false)`) isn't an error: `req.file` is just `undefined`, so the handler has to check.",
      level: "advanced",
      estMinutes: 65,
      webRefs: [
        { label: "Express: Multer middleware", url: "https://expressjs.com/en/resources/middleware/multer/", kind: "docs" },
        { label: "OWASP: File Upload Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html", kind: "article" },
        { label: "expressjs/multer", url: "https://github.com/expressjs/multer", kind: "repo" },
      ],
      video: {
        title: "How to upload file in backend | Multer",
        channel: "Chai aur Code",
        url: "https://www.youtube.com/watch?v=6KPXn2Ha0cM",
        videoId: "6KPXn2Ha0cM",
        durationLabel: "38:20",
      },
      alternateVideos: [
        {
          title: "Uploading Files with NodeJS and Multer",
          channel: "Piyush Garg",
          url: "https://www.youtube.com/watch?v=WqJ0P8JnftI",
          videoId: "WqJ0P8JnftI",
          durationLabel: "14:11",
        },
        {
          title: "How to Upload Files in Node.js Using Express and Multer",
          channel: "James Q Quick",
          url: "https://www.youtube.com/watch?v=i8yxx6V9UdM",
          videoId: "i8yxx6V9UdM",
          durationLabel: "6:51",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "express-file-uploads-multer-q1",
          prompt:
            "An attacker uploads `shell.php` (PHP source) and sets that part's `Content-Type` to `image/png`. What does this route do?\n\n```js\nconst upload = multer({\n  storage: multer.memoryStorage(),\n  fileFilter: (req, file, cb) => cb(null, file.mimetype === 'image/png'),\n});\napp.post('/avatar', upload.single('avatar'), saveAvatar);\n```",
          options: [
            "Accepts it: `file.mimetype` is the type the client declared for the part, not something Multer detected",
            "Rejects it: Multer sniffs the file's bytes to set `mimetype`",
            "Rejects it, because the `.php` extension doesn't match `image/png`",
            "Throws a `MulterError` for the mismatched type",
          ],
          correctIndex: 0,
          explanation:
            "Multer passes through the part headers the client sent. To know what a file really is, inspect its magic bytes (for example with the `file-type` package) or re-encode images with an image library, which also strips embedded payloads.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-file-uploads-multer-q2",
          prompt: "A user uploads a GIF to the same route, so `fileFilter` calls `cb(null, false)`. What does `saveAvatar` see?",
          options: [
            "`req.file` is `undefined` and no error is raised, so the handler has to check for it",
            "A `MulterError` with code `LIMIT_UNEXPECTED_FILE`",
            "Multer responds 415 before the handler runs",
            "`req.file` is set, with `rejected: true`",
          ],
          correctIndex: 0,
          explanation:
            "Returning `false` quietly skips the file. If you want the client to get a clear error, pass an error to the callback (`cb(new Error(...))`) or check `req.file` in the handler and respond 400 or 415.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-file-uploads-multer-q3",
          prompt: "Which statements about Multer's storage engines are true? (Select all that apply.)",
          options: [
            "`memoryStorage()` exposes the whole file as `req.file.buffer`",
            "Without `limits.fileSize`, a few concurrent large uploads to a `memoryStorage()` route can exhaust the heap",
            "`multer({ dest: 'uploads/' })` saves files under random names with no extension",
            "`diskStorage()` keeps the client's original filename unless you override `filename`",
            "With `memoryStorage()`, your handler starts running before the upload has finished",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Without a `filename` function, disk storage generates a random hex name and adds no extension, precisely so client names never touch your filesystem. Either way, the route handler only runs after Multer has consumed the whole multipart body.",
        },
        {
          id: "express-file-uploads-multer-q4",
          prompt: "A 30 MB file is posted to a route configured with `limits: { fileSize: 10 * 1024 * 1024 }`. What reaches your error handler?",
          options: [
            "A `MulterError` with `code: 'LIMIT_FILE_SIZE'`, which you'd map to 413",
            "Nothing: Multer truncates the file to 10 MB and carries on",
            "Nothing: Express automatically responds 413",
            "A body-parser error with type `entity.too.large`",
          ],
          correctIndex: 0,
          explanation:
            "Multer stops reading and forwards a `MulterError` (with `field` set) through `next(err)`. Check `err instanceof multer.MulterError` in the error handler to turn codes into proper statuses and messages.",
        },
        {
          id: "express-file-uploads-multer-q5",
          prompt: "The HTML form's file input is named `photo`, but the route uses `upload.single('avatar')`. What happens on submit?",
          options: [
            "Multer fails the request with a `MulterError` whose code is `LIMIT_UNEXPECTED_FILE`",
            "`req.file` is `undefined` and the handler runs normally",
            "Multer stores the file under `req.files.photo`",
            "Multer renames the field to `avatar` automatically",
          ],
          correctIndex: 0,
          explanation:
            "`.single(name)` accepts exactly that field and treats any other file field as unexpected (\"Unexpected file field\"). It's the most common reason a working upload \"suddenly\" breaks after a frontend refactor.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-file-uploads-multer-q6",
          prompt: "Why does Multer's documentation warn against `app.use(upload.any())`?",
          options: [
            "Every route would accept arbitrary files, including routes that never validate or clean them up",
            "`.any()` only works with disk storage",
            "It disables `express.json()` for every route",
            "`.any()` ignores the `limits` option",
          ],
          correctIndex: 0,
          explanation:
            "Global upload parsing lets anyone push files at endpoints that weren't designed for them, filling memory or disk. Attach the narrowest method (`.single`, `.array`, `.fields`) to the routes that handle uploads.",
        },
        {
          id: "express-file-uploads-multer-q7",
          prompt:
            "A multipart form posts to an Express 5 route that only has `express.json()` and `express.urlencoded()` in front of it. What's in `req.body`?",
          options: ["`undefined`", "The text fields, parsed by `express.urlencoded()`", "`{}`", "The raw multipart body as a string"],
          correctIndex: 0,
          explanation:
            "Neither built-in parser handles `multipart/form-data`, so nothing sets `req.body`, and Express 5 leaves it undefined. Even text-only multipart forms need `upload.none()`.",
        },
        {
          id: "express-file-uploads-multer-q8",
          prompt:
            "The client sends the file part first and a text field `albumId` after it. Inside `fileFilter`, what is `req.body.albumId`?",
          options: [
            "`undefined`, because Multer fills `req.body` in stream order and that field hasn't arrived yet",
            "The value, because Multer reads every text field before any file",
            "A promise that resolves to the value",
            "It throws, because `req.body` isn't available inside `fileFilter`",
          ],
          correctIndex: 0,
          explanation:
            "Multipart is a stream, and Multer processes parts as they come. If a decision depends on a text field, have the client send it first, or decide in the route handler after the upload completes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "express-file-uploads-multer-q9",
          prompt: "Which measures actually harden a user-upload feature? (Select all that apply.)",
          options: [
            "Store files under a name you generate (such as a UUID), never `originalname`",
            "Verify content by magic bytes, or re-encode images server-side",
            "Serve uploads from a separate domain, or with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`",
            "Trust `file.mimetype` once `fileFilter` has checked it",
            "Save uploads into `public/` so `express.static` can serve them directly",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Client-declared names and types are attacker input, and uploads served from your app's own origin can become stored XSS. Keeping them out of `public/` also means they're never served before they've been checked.",
        },
        {
          id: "express-file-uploads-multer-q10",
          prompt: "Browsers need to upload videos of up to 2 GB into S3. Which design is usually best?",
          options: [
            "The API issues a short-lived presigned URL (or multipart upload) and the browser uploads straight to the bucket",
            "`multer.memoryStorage()`, then `putObject` with the buffer",
            "`multer.diskStorage()` with a 2 GB `fileSize` limit, behind the load balancer",
            "Base64-encode the file into a JSON request body",
          ],
          correctIndex: 0,
          explanation:
            "Presigned uploads keep gigabytes off your servers, sidestep proxy timeouts and body-size limits, and scale with the storage service. Your API still controls who may upload, what key is used and, through policy conditions, how large the object can be.",
        },
        {
          id: "express-file-uploads-multer-q11",
          prompt: "With default options, a client sends a part whose filename is `../../etc/passwd.png`. What is `file.originalname`?",
          options: [
            "`passwd.png`: the client's path is stripped unless `preservePath: true`, but the name is still attacker-controlled",
            "`../../etc/passwd.png`, exactly as sent",
            "A random hex string",
            "Multer rejects the part with a `MulterError`",
          ],
          correctIndex: 0,
          explanation:
            "Multer keeps only the base name by default, which blunts the most obvious traversal. It's still arbitrary text chosen by the client, so don't build storage paths from it, and treat it as untrusted when you display it.",
        },
      ],
    },
    {
      id: "express-crud-rest-api",
      moduleId: "be-express",
      trackId: "backend",
      title: "Building a Full CRUD REST API",
      summary:
        "A CRUD API is where the earlier pieces meet (routing, parsing, validation, status codes, error handling) plus the concern tutorials skip: concurrent writers. The shape is standard. `POST /todos` creates and answers `201 Created` with a `Location` header, `GET /todos/:id` reads, `PUT` replaces, `PATCH` merges and `DELETE` removes (204). Status codes are the client's control flow: 400 for a body it can't parse, 422 for one that fails validation (listing every problem, not just the first), 404 for a missing resource, 409 for a clash with current state such as a duplicate unique field, and 405 with an `Allow` header for an unsupported method.\n\nWhat separates a production API from a tutorial is the lost update. Two people load version 1 of a record, both edit, both save, and the second save silently overwrites the first. HTTP's answer is optimistic concurrency with validators: every representation carries an `ETag`, clients send it back in `If-Match`, and the server answers `412 Precondition Failed` when it no longer matches, or `428 Precondition Required` (RFC 6585) when the client didn't send one. `If-Match` uses strong comparison, so weak `W/` tags never match, while `If-None-Match` on a GET uses weak comparison and turns repeat reads into cheap 304s.\n\nThe order of the checks matters as much as the checks. RFC 9110 evaluates preconditions after the checks that would fail anyway (a 404 beats a 412) but before the request content is processed (a 412 beats a 422). In a real Express app the version is a database column and the write is conditional (`UPDATE ... WHERE id = $1 AND version = $2`), so the check and the write are atomic; checking in JavaScript and writing afterwards reopens the race you meant to close.",
      level: "expert",
      estMinutes: 240,
      isMilestone: true,
      webRefs: [
        { label: "RFC 9110: Conditional requests (If-Match, If-None-Match, precedence)", url: "https://www.rfc-editor.org/rfc/rfc9110.html#name-conditional-requests", kind: "spec" },
        { label: "MDN: HTTP conditional requests", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Conditional_requests", kind: "docs" },
        { label: "RFC 6585: 428 Precondition Required", url: "https://www.rfc-editor.org/rfc/rfc6585.html", kind: "spec" },
        { label: "Zalando: RESTful API Guidelines", url: "https://opensource.zalando.com/restful-api-guidelines/", kind: "article" },
      ],
      video: {
        title: "Node.js / Express Course - Build 4 Projects",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=qwfE7fSVaZM",
        videoId: "qwfE7fSVaZM",
        durationLabel: "10:00:07",
        startSeconds: 179,
        chapterLabel: "Project 1: Task Manager",
      },
      alternateVideos: [
        {
          title: "Node.js and Express.js - Full Course",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
          videoId: "Oe421EPjeBE",
          durationLabel: "8:16:47",
          startSeconds: 28205,
          chapterLabel: "Express Router - Setup",
        },
        {
          title: "Building REST API's using Node and Express.js",
          channel: "Piyush Garg",
          url: "https://www.youtube.com/watch?v=uNCrMvkPUAE",
          videoId: "uNCrMvkPUAE",
          durationLabel: "20:27",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Build the core of a to-do REST API as a plain function: the logic your Express routes would call. `createTodoApi()` returns `handle(req)`, where `req` is `{ method, path, headers, body }` (header names are lowercase, and `body` is already-parsed JSON or `undefined`). `handle` returns `{ status, headers, body }`, leaving out `body` for 204 and 304.\n\nA todo is `{ id, title, done }`. Ids are integers counting from 1 and are never reused. Each todo also has a version that starts at 1 and goes up by one on every successful PUT or PATCH; its ETag is that number in double quotes (`\"1\"`, `\"2\"`). Every response that carries a single todo includes an `etag` header.\n\n**Routes.** Paths match exactly, and an id must match `^[1-9][0-9]*$` (anything else is an unknown path).\n\n- `GET /todos`: 200 with every todo, sorted by id.\n- `POST /todos`: 201 with the new todo, plus `location: /todos/<id>` and `etag` headers. Store the title trimmed; `done` defaults to `false`.\n- `GET /todos/:id`: 200 with the todo. If `if-none-match` matches the current ETag, return 304 with only the `etag` header. This uses weak comparison: ignore a `W/` prefix; the header can be `*` or a comma-separated list.\n- `PUT /todos/:id` replaces `title` and `done` (both required); `PATCH /todos/:id` changes only the fields sent. Both return 200 with the updated todo and its new `etag`.\n- `DELETE /todos/:id`: 204.\n- Any other method: 405 `{ error: \"Method Not Allowed\" }` with `allow: GET, POST` on `/todos`, or `allow: GET, PUT, PATCH, DELETE` on `/todos/:id`. Any other path: 404 `{ error: \"Not Found\" }`.\n\n**Checks, in this order** (the first failure wins):\n\n1. The method (405), then whether the todo exists (404 `{ error: \"Not Found\" }`).\n2. Preconditions. PUT and PATCH require `if-match`: 428 `{ error: \"Precondition Required\" }` when it's missing. For PUT, PATCH and DELETE, an `if-match` that doesn't match is 412 `{ error: \"Precondition Failed\" }`. This uses strong comparison: `*` matches any existing todo, a list matches if one entry equals the ETag exactly, and `W/` tags never match.\n3. The body must be a plain object (not an array, `null` or a primitive), otherwise 400 `{ error: \"Body must be a JSON object\" }`.\n4. Validation: 422 `{ error: \"Validation failed\", details }`, where `details` lists every problem in the order below.\n5. Uniqueness: titles are compared trimmed and case-insensitively, ignoring the todo being updated. A clash is 409 `{ error: \"Title already exists\" }`.\n\n**Validation messages**, in `details` order:\n\n- `title` (required for POST and PUT, checked for PATCH only when present): `\"title must be a non-empty string\"` if it isn't a string or is blank after trimming, otherwise `\"title must be at most 100 characters\"` if the trimmed title is longer than 100.\n- `done` (required for PUT, checked for POST and PATCH only when present): `\"done must be a boolean\"`.\n- Every other key, in order: `\"<key> is not allowed\"`.\n- A PATCH body with no keys at all gets exactly `[\"at least one field is required\"]`.\n\nThe tests call `runRequests(requests)`, which sends a sequence of requests to one API instance and normalises each response (header names lowercased, a missing body reported as `null`). Leave the driver as it is.",
        starterCode:
          "/**\n * @returns {(req: { method: string, path: string, headers: Record<string, string>, body?: unknown }) =>\n *   { status: number, headers?: Record<string, string>, body?: unknown }}\n */\nfunction createTodoApi() {\n  // State lives in this closure: the todos, the next id and each todo's version.\n  return function handle(req) {\n    // Your code here\n    return { status: 501, headers: {}, body: { error: \"Not Implemented\" } };\n  };\n}\n\n// ---- Test driver (leave as is) ----\nfunction runRequests(requests) {\n  const handle = createTodoApi();\n  return requests.map((r) => {\n    const res = handle({ method: r.method, path: r.path, headers: { ...(r.headers || {}) }, body: r.body }) || {};\n    const headers = {};\n    for (const [k, v] of Object.entries(res.headers || {})) headers[k.toLowerCase()] = String(v);\n    return { status: res.status, headers, body: res.body === undefined ? null : res.body };\n  });\n}\n",
        functionName: "runRequests",
        testCases: [
          {
            description: "POST creates with 201 + Location + ETag, and GET reads it back",
            args: [
              [
                { method: "POST", path: "/todos", body: { title: "  Write tests  " } },
                { method: "GET", path: "/todos/1" },
                { method: "GET", path: "/todos" },
              ],
            ],
            expected: [
              { status: 201, headers: { location: "/todos/1", etag: "\"1\"" }, body: { id: 1, title: "Write tests", done: false } },
              { status: 200, headers: { etag: "\"1\"" }, body: { id: 1, title: "Write tests", done: false } },
              { status: 200, headers: {}, body: [{ id: 1, title: "Write tests", done: false }] },
            ],
          },
          {
            description: "validation: 400 for a non-object body, 422 listing every problem",
            args: [
              [
                { method: "POST", path: "/todos", body: "just a string" },
                { method: "POST", path: "/todos", body: [1, 2] },
                { method: "POST", path: "/todos", body: { title: "", done: "yes", priority: 1 } },
                { method: "POST", path: "/todos", body: { title: "x".repeat(101) } },
                { method: "GET", path: "/todos" },
              ],
            ],
            expected: [
              { status: 400, headers: {}, body: { error: "Body must be a JSON object" } },
              { status: 400, headers: {}, body: { error: "Body must be a JSON object" } },
              { status: 422, headers: {}, body: { error: "Validation failed", details: ["title must be a non-empty string", "done must be a boolean", "priority is not allowed"] } },
              { status: 422, headers: {}, body: { error: "Validation failed", details: ["title must be at most 100 characters"] } },
              { status: 200, headers: {}, body: [] },
            ],
          },
          {
            description: "duplicate titles conflict, compared trimmed and case-insensitively",
            args: [
              [
                { method: "POST", path: "/todos", body: { title: "Ship it" } },
                { method: "POST", path: "/todos", body: { title: "  ship IT " } },
                { method: "POST", path: "/todos", body: { title: "Ship it later", done: true } },
              ],
            ],
            expected: [
              { status: 201, headers: { location: "/todos/1", etag: "\"1\"" }, body: { id: 1, title: "Ship it", done: false } },
              { status: 409, headers: {}, body: { error: "Title already exists" } },
              { status: 201, headers: { location: "/todos/2", etag: "\"1\"" }, body: { id: 2, title: "Ship it later", done: true } },
            ],
          },
          {
            description: "PUT replaces the whole representation, so every field is required",
            args: [
              [
                { method: "POST", path: "/todos", body: { title: "Draft" } },
                { method: "PUT", path: "/todos/1", headers: { "if-match": "\"1\"" }, body: { title: "Final" } },
                { method: "PUT", path: "/todos/1", headers: { "if-match": "\"1\"" }, body: { title: "Final", done: true } },
                { method: "GET", path: "/todos/1" },
              ],
            ],
            expected: [
              { status: 201, headers: { location: "/todos/1", etag: "\"1\"" }, body: { id: 1, title: "Draft", done: false } },
              { status: 422, headers: {}, body: { error: "Validation failed", details: ["done must be a boolean"] } },
              { status: 200, headers: { etag: "\"2\"" }, body: { id: 1, title: "Final", done: true } },
              { status: 200, headers: { etag: "\"2\"" }, body: { id: 1, title: "Final", done: true } },
            ],
          },
          {
            description: "PATCH merges only the fields sent; an empty patch is a 422",
            args: [
              [
                { method: "POST", path: "/todos", body: { title: "A" } },
                { method: "PATCH", path: "/todos/1", headers: { "if-match": "\"1\"" }, body: { done: true } },
                { method: "PATCH", path: "/todos/1", headers: { "if-match": "\"2\"" }, body: {} },
                { method: "PATCH", path: "/todos/1", headers: { "if-match": "\"2\"" }, body: { title: " ", colour: "red" } },
              ],
            ],
            expected: [
              { status: 201, headers: { location: "/todos/1", etag: "\"1\"" }, body: { id: 1, title: "A", done: false } },
              { status: 200, headers: { etag: "\"2\"" }, body: { id: 1, title: "A", done: true } },
              { status: 422, headers: {}, body: { error: "Validation failed", details: ["at least one field is required"] } },
              { status: 422, headers: {}, body: { error: "Validation failed", details: ["title must be a non-empty string", "colour is not allowed"] } },
            ],
          },
          {
            description: "lost-update protection: stale If-Match is 412, missing If-Match is 428",
            args: [
              [
                { method: "POST", path: "/todos", body: { title: "Plan" } },
                { method: "PATCH", path: "/todos/1", headers: { "if-match": "\"1\"" }, body: { title: "Plan v2" } },
                { method: "PATCH", path: "/todos/1", headers: { "if-match": "\"1\"" }, body: { title: "Plan v3" } },
                { method: "PUT", path: "/todos/1", body: { title: "Plan v4", done: false } },
                { method: "GET", path: "/todos/1" },
              ],
            ],
            expected: [
              { status: 201, headers: { location: "/todos/1", etag: "\"1\"" }, body: { id: 1, title: "Plan", done: false } },
              { status: 200, headers: { etag: "\"2\"" }, body: { id: 1, title: "Plan v2", done: false } },
              { status: 412, headers: {}, body: { error: "Precondition Failed" } },
              { status: 428, headers: {}, body: { error: "Precondition Required" } },
              { status: 200, headers: { etag: "\"2\"" }, body: { id: 1, title: "Plan v2", done: false } },
            ],
          },
          {
            description: "If-Match accepts * and lists, but a weak tag never matches",
            args: [
              [
                { method: "POST", path: "/todos", body: { title: "T" } },
                { method: "PATCH", path: "/todos/1", headers: { "if-match": "W/\"1\"" }, body: { done: true } },
                { method: "PATCH", path: "/todos/1", headers: { "if-match": "\"7\", \"1\"" }, body: { done: true } },
                { method: "PATCH", path: "/todos/1", headers: { "if-match": "*" }, body: { title: "T2" } },
              ],
            ],
            expected: [
              { status: 201, headers: { location: "/todos/1", etag: "\"1\"" }, body: { id: 1, title: "T", done: false } },
              { status: 412, headers: {}, body: { error: "Precondition Failed" } },
              { status: 200, headers: { etag: "\"2\"" }, body: { id: 1, title: "T", done: true } },
              { status: 200, headers: { etag: "\"3\"" }, body: { id: 1, title: "T2", done: true } },
            ],
            isEdgeCase: true,
          },
          {
            description: "conditional GET: If-None-Match uses weak comparison and returns 304",
            args: [
              [
                { method: "POST", path: "/todos", body: { title: "Cache me" } },
                { method: "GET", path: "/todos/1", headers: { "if-none-match": "\"1\"" } },
                { method: "GET", path: "/todos/1", headers: { "if-none-match": "W/\"1\"" } },
                { method: "GET", path: "/todos/1", headers: { "if-none-match": "\"2\"" } },
              ],
            ],
            expected: [
              { status: 201, headers: { location: "/todos/1", etag: "\"1\"" }, body: { id: 1, title: "Cache me", done: false } },
              { status: 304, headers: { etag: "\"1\"" }, body: null },
              { status: 304, headers: { etag: "\"1\"" }, body: null },
              { status: 200, headers: { etag: "\"1\"" }, body: { id: 1, title: "Cache me", done: false } },
            ],
            isEdgeCase: true,
          },
          {
            description: "DELETE is 204 then 404, and ids are never reused",
            args: [
              [
                { method: "POST", path: "/todos", body: { title: "A" } },
                { method: "POST", path: "/todos", body: { title: "B" } },
                { method: "DELETE", path: "/todos/1" },
                { method: "DELETE", path: "/todos/1" },
                { method: "GET", path: "/todos/1" },
                { method: "POST", path: "/todos", body: { title: "C" } },
                { method: "GET", path: "/todos" },
              ],
            ],
            expected: [
              { status: 201, headers: { location: "/todos/1", etag: "\"1\"" }, body: { id: 1, title: "A", done: false } },
              { status: 201, headers: { location: "/todos/2", etag: "\"1\"" }, body: { id: 2, title: "B", done: false } },
              { status: 204, headers: {}, body: null },
              { status: 404, headers: {}, body: { error: "Not Found" } },
              { status: 404, headers: {}, body: { error: "Not Found" } },
              { status: 201, headers: { location: "/todos/3", etag: "\"1\"" }, body: { id: 3, title: "C", done: false } },
              { status: 200, headers: {}, body: [{ id: 2, title: "B", done: false }, { id: 3, title: "C", done: false }] },
            ],
            isEdgeCase: true,
          },
          {
            description: "unknown paths are 404; unsupported methods are 405 with Allow",
            args: [
              [
                { method: "POST", path: "/todos", body: { title: "A" } },
                { method: "GET", path: "/todos/abc" },
                { method: "GET", path: "/todos/0" },
                { method: "GET", path: "/todos/1/comments" },
                { method: "GET", path: "/todo" },
                { method: "DELETE", path: "/todos" },
                { method: "POST", path: "/todos/1", body: { title: "x" } },
              ],
            ],
            expected: [
              { status: 201, headers: { location: "/todos/1", etag: "\"1\"" }, body: { id: 1, title: "A", done: false } },
              { status: 404, headers: {}, body: { error: "Not Found" } },
              { status: 404, headers: {}, body: { error: "Not Found" } },
              { status: 404, headers: {}, body: { error: "Not Found" } },
              { status: 404, headers: {}, body: { error: "Not Found" } },
              { status: 405, headers: { allow: "GET, POST" }, body: { error: "Method Not Allowed" } },
              { status: 405, headers: { allow: "GET, PUT, PATCH, DELETE" }, body: { error: "Method Not Allowed" } },
            ],
            isEdgeCase: true,
          },
          {
            description: "check order: 404 before preconditions, preconditions before body validation",
            args: [
              [
                { method: "POST", path: "/todos", body: { title: "A" } },
                { method: "PUT", path: "/todos/99", body: "garbage" },
                { method: "PATCH", path: "/todos/1", headers: { "if-match": "\"3\"" }, body: { title: "" } },
                { method: "PATCH", path: "/todos/1", body: "garbage" },
                { method: "PATCH", path: "/todos/1", headers: { "if-match": "\"1\"" }, body: null },
              ],
            ],
            expected: [
              { status: 201, headers: { location: "/todos/1", etag: "\"1\"" }, body: { id: 1, title: "A", done: false } },
              { status: 404, headers: {}, body: { error: "Not Found" } },
              { status: 412, headers: {}, body: { error: "Precondition Failed" } },
              { status: 428, headers: {}, body: { error: "Precondition Required" } },
              { status: 400, headers: {}, body: { error: "Body must be a JSON object" } },
            ],
            isEdgeCase: true,
          },
          {
            description: "renaming to your own title (any case) is fine; taking another todo's title is 409",
            args: [
              [
                { method: "POST", path: "/todos", body: { title: "Buy milk" } },
                { method: "POST", path: "/todos", body: { title: "Other" } },
                { method: "PATCH", path: "/todos/1", headers: { "if-match": "\"1\"" }, body: { title: "BUY MILK" } },
                { method: "PATCH", path: "/todos/2", headers: { "if-match": "\"1\"" }, body: { title: " buy milk " } },
              ],
            ],
            expected: [
              { status: 201, headers: { location: "/todos/1", etag: "\"1\"" }, body: { id: 1, title: "Buy milk", done: false } },
              { status: 201, headers: { location: "/todos/2", etag: "\"1\"" }, body: { id: 2, title: "Other", done: false } },
              { status: 200, headers: { etag: "\"2\"" }, body: { id: 1, title: "BUY MILK", done: false } },
              { status: 409, headers: {}, body: { error: "Title already exists" } },
            ],
            isEdgeCase: true,
          },
          {
            description: "DELETE honours If-Match when it is sent",
            args: [
              [
                { method: "POST", path: "/todos", body: { title: "A" } },
                { method: "DELETE", path: "/todos/1", headers: { "if-match": "\"5\"" } },
                { method: "DELETE", path: "/todos/1", headers: { "if-match": "\"1\"" } },
                { method: "GET", path: "/todos" },
              ],
            ],
            expected: [
              { status: 201, headers: { location: "/todos/1", etag: "\"1\"" }, body: { id: 1, title: "A", done: false } },
              { status: 412, headers: {}, body: { error: "Precondition Failed" } },
              { status: 204, headers: {}, body: null },
              { status: 200, headers: {}, body: [] },
            ],
            isEdgeCase: true,
          },
        ],
      },
    },
  ],
} satisfies Module;
