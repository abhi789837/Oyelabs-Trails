import type { Module } from "@/types/curriculum";

export default {
  id: "fs-t3",
  trackId: "fullstack",
  name: "The T3 Stack & End-to-End Type Safety",
  description:
    "How the T3 stack gets types from the database to the UI without code generation: tRPC procedures, middleware and batching, Prisma schema and migrations (including Prisma 7's breaking changes), the places where compile-time types stop protecting you at runtime, and when a TypeScript-only RPC layer is the wrong call. Written against tRPC 11, Prisma 7 and create-t3-app 7.40, for engineers who already ship TypeScript on both sides of the wire.",
  refs: [
    { label: "create.t3.gg: Create T3 App", url: "https://create.t3.gg/", kind: "docs" },
    { label: "tRPC: Documentation", url: "https://trpc.io/docs", kind: "docs" },
    { label: "Prisma ORM v7: Development and production", url: "https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production", kind: "docs" },
  ],
  topics: [
    {
      id: "t3-trpc-fundamentals",
      moduleId: "fs-t3",
      trackId: "fullstack",
      title: "tRPC Fundamentals (Why No Code Generation Is Needed)",
      summary:
        "tRPC exists because a TypeScript team that owns both ends of an API shouldn't have to describe that API twice. There's no schema file and no generator: the router is an ordinary TypeScript value, the server exports its type (`export type AppRouter = typeof appRouter`), and the client imports it with `import type`, which the compiler erases, so no server code reaches the bundle. A procedure is a `query` (sent as GET) or a `mutation` (POST) built from a chain of `.use()` middleware, `.input()` validators (Zod, Valibot or any Standard Schema parser) and a resolver. Validation is the runtime half of the contract: types vanish at build time, so bad input must be rejected before the resolver runs.\n\nContext is created per request (session, database handle) and middleware narrows it. create-t3-app's `protectedProcedure` throws `UNAUTHORIZED` when there's no session and calls `next({ ctx: { session } })`, so downstream code sees a non-null user. Order is semantics: `.input()` is itself a middleware, so an auth check placed before it runs before validation, and a middleware placed after it can check ownership with the parsed id. Builders are immutable, which is what makes deriving `adminProcedure` from `protectedProcedure` safe.\n\nOn the client, tRPC 11's recommended `@trpc/tanstack-react-query` integration hands you TanStack Query `queryOptions`, `mutationOptions` and query keys; create-t3-app 7.40 still scaffolds the classic `@trpc/react-query` hooks. `httpBatchLink` merges calls issued in the same event-loop tick into one request, and `httpBatchStreamLink` streams each result as it resolves, so one slow procedure doesn't hold the rest (but it can't set headers or cookies). Two gotchas: a batch with mixed outcomes returns HTTP 207, which naive monitoring counts as success, and the default error shape forwards an unexpected error's message (`connect ECONNREFUSED 10.0.0.5:5432`) to the client unless your `errorFormatter` masks it.",
      level: "advanced",
      estMinutes: 120,
      isMilestone: true,
      webRefs: [
        { label: "tRPC: Define Procedures", url: "https://trpc.io/docs/server/procedures", kind: "docs" },
        { label: "tRPC: Middlewares", url: "https://trpc.io/docs/server/middlewares", kind: "docs" },
        { label: "create.t3.gg: tRPC", url: "https://create.t3.gg/en/usage/trpc", kind: "docs" },
        { label: "TkDodo: Type-safe React Query", url: "https://tkdodo.eu/blog/type-safe-react-query", kind: "article" },
      ],
      video: {
        title: "Learn tRPC In 45 Minutes",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=UfUbBWIFdJs",
        videoId: "UfUbBWIFdJs",
        durationLabel: "45:35",
      },
      alternateVideos: [
        {
          title: "tRPC v11 with TanStack Query on TanStack Start! Part 1",
          channel: "Jack Herrington",
          url: "https://www.youtube.com/watch?v=dLUyPLbvdY0",
          videoId: "dLUyPLbvdY0",
          durationLabel: "16:29",
        },
        {
          title: "T3 Stack Tutorial - FROM 0 TO PROD FOR $0 (Next.js, tRPC, TypeScript, Tailwind, Prisma & More)",
          channel: "Theo - t3․gg",
          url: "https://www.youtube.com/watch?v=YkOSUVzOAA4",
          videoId: "YkOSUVzOAA4",
          durationLabel: "2:59:02",
          startSeconds: 4755,
          chapterLabel: "tRPC Context, auth state, and private procedures",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Build the core of tRPC in plain JavaScript: an immutable procedure builder, a caller that runs middleware and input validation in order, and a batch handler. The driver builds a small app router the way create-t3-app does (`protectedProcedure` derived from `publicProcedure`, `adminProcedure` from `protectedProcedure`) and sends scripted batches of calls.\n\n`createBuilder()` returns a builder with four methods:\n\n- `use(middleware)` and `input(parser)` return a **new** builder with that step appended. Never modify the original: `publicProcedure` must stay public after `protectedProcedure` is derived from it.\n- `query(resolver)` and `mutation(resolver)` return a procedure. Its shape is up to you, but `callProcedure` must be able to tell a procedure from a sub-router (a plain object of procedures).\n\n`callProcedure(router, { path, type, input }, ctx)` resolves to `{ ok: true, data }` or `{ ok: false, error }` and never rejects:\n\n- Find the procedure by walking the dot-separated `path` through nested router objects, using own properties only. If there's no procedure there (including a path that names a sub-router), fail with `NOT_FOUND` and the message `No procedure found on path \"<path>\"`.\n- If `type` isn't the procedure's type, fail with `METHOD_NOT_SUPPORTED` and the message `\"<path>\" is a <procedure type>, not a <requested type>`. Both checks happen before any middleware runs.\n- Otherwise run the steps in the order they were added, then the resolver. A middleware is called with `{ ctx, input, path, type, next }`, where `input` is `undefined` until an `input()` step has run. `next()` runs the rest of the chain and resolves to its result; `next({ ctx: extra })` does the same with `{ ...ctx, ...extra }` as the context downstream. Never modify `ctx` itself (the driver freezes it). A middleware returns the result it got from `next`.\n- An `input(parser)` step calls `parser(call.input)` with the raw input, which returns `{ success: true, data }` or `{ success: false, fieldErrors }`. On failure, fail with `BAD_REQUEST`, the message `Invalid input` and the parser's `fieldErrors`. On success, the input downstream is `data`, shallow-merged over the previous input when both are plain objects, so chained parsers combine and later keys win.\n- The resolver is called with `{ ctx, input, path, type }` and may be sync or async. Its return value is the `data`.\n- As in tRPC, an error thrown by a middleware, parser or resolver doesn't reject `next()`: it becomes a failed result, so outer middlewares still resume after `await next()`.\n- If the outermost step resolves to something that isn't a result (an object with a boolean `ok`), a middleware forgot to return `next()`: fail with `INTERNAL_SERVER_ERROR` and the message `No result from middlewares - did you forget to return next()?`.\n\nA failed call's `error` is `{ code, httpStatus, message, path }`, plus `fieldErrors` for input failures. `httpStatus` comes from `HTTP_STATUS` (500 for a code that isn't listed). A `TRPCError` keeps its code and message. Anything else that's thrown becomes `INTERNAL_SERVER_ERROR` with the message `Internal server error`: tRPC's default error shape forwards the original message, which is how database hostnames end up in API responses, so this caller masks it.\n\n`handleBatch(router, calls, ctx)` runs the calls one after another and returns `{ status, results }` with the results in call order. (Real tRPC runs a batch concurrently; running it sequentially keeps the test log deterministic.) `status` follows tRPC's rule: take 200 for each success and the error's `httpStatus` for each failure. If they're all the same, that's the status; otherwise it's `207` (Multi-Status). An empty batch is `200`.\n\nThe tests call `runTRPC({ session, batches })`, which builds the router, runs each batch against a shared in-memory database, and returns every batch's response plus the log written by the logging middleware. Leave the driver as it is.",
        starterCode: `class TRPCError extends Error {
  constructor({ code, message }) {
    super(message ?? code);
    this.name = "TRPCError";
    this.code = code;
  }
}

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_SUPPORTED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * Returns an immutable procedure builder with \`use(middleware)\`, \`input(parser)\`,
 * \`query(resolver)\` and \`mutation(resolver)\`.
 */
function createBuilder() {
  // Your code here
}

/**
 * @param {object} router nested plain objects whose leaves are procedures
 * @param {{ path: string, type: "query" | "mutation", input?: unknown }} call
 * @param {object} ctx
 * @returns {Promise<{ ok: true, data: unknown } | { ok: false, error: object }>}
 */
async function callProcedure(router, call, ctx) {
  // Your code here
}

/** Runs the calls one after another and returns { status, results }. */
async function handleBatch(router, calls, ctx) {
  // Your code here
}

// ---- Test driver (leave as is) ----
async function runTRPC(scenario) {
  const log = [];
  const router = buildAppRouter(log);
  const db = { posts: SEED_POSTS.map((post) => ({ ...post })) };
  const ctx = Object.freeze({ db, session: deepFreeze(scenario.session ?? null) });
  const responses = [];
  for (const calls of scenario.batches) {
    const response = await handleBatch(router, calls, ctx);
    responses.push(JSON.parse(JSON.stringify(response)));
  }
  return { responses, log };
}

const SEED_POSTS = [
  { id: 1, title: "Hello tRPC", body: "No codegen needed.", authorId: "u1", published: true },
  { id: 2, title: "Draft: Prisma 7 notes", body: "Driver adapters everywhere.", authorId: "u1", published: false },
  { id: 3, title: "Why superjson", body: "Dates survive the wire.", authorId: "u2", published: true },
];

function buildAppRouter(log) {
  const t = createBuilder();
  const publicProcedure = t.use(async ({ path, type, next }) => {
    log.push(\`\${type} \${path}\`);
    const result = await next();
    log.push(\`done \${path}\`);
    return result;
  });
  const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
    if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });
    return next({ ctx: { user: ctx.session.user } });
  });
  const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
    return next();
  });
  const summary = (post) => ({ id: post.id, title: post.title, published: post.published });

  return {
    health: publicProcedure.query(() => "ok"),
    post: {
      list: publicProcedure.query(({ ctx }) => ctx.db.posts.filter((p) => p.published).map(summary)),
      byId: publicProcedure.input(postIdInput).query(({ ctx, input }) => {
        const post = ctx.db.posts.find((p) => p.id === input.id && p.published);
        if (!post) throw new TRPCError({ code: "NOT_FOUND", message: \`Post \${input.id} not found\` });
        return { ...post };
      }),
      mine: protectedProcedure.query(({ ctx }) => ctx.db.posts.filter((p) => p.authorId === ctx.user.id).map(summary)),
      create: protectedProcedure.input(createPostInput).mutation(({ ctx, input }) => {
        const post = { id: ctx.db.posts.length + 1, ...input, authorId: ctx.user.id, published: false };
        ctx.db.posts.push(post);
        return { ...post };
      }),
      publish: protectedProcedure
        .input(postIdInput)
        .use(async ({ ctx, input, next }) => {
          const post = ctx.db.posts.find((p) => p.id === input.id);
          if (!post) throw new TRPCError({ code: "NOT_FOUND", message: \`Post \${input.id} not found\` });
          if (post.authorId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Not your post" });
          return next({ ctx: { post } });
        })
        .mutation(({ ctx }) => {
          ctx.post.published = true;
          return summary(ctx.post);
        }),
    },
    search: publicProcedure
      .input(pageInput)
      .input(searchInput)
      .query(({ ctx, input }) => ({
        input,
        ids: ctx.db.posts
          .filter((p) => p.published && p.title.toLowerCase().includes(input.q))
          .slice(0, input.limit)
          .map((p) => p.id),
      })),
    admin: {
      stats: adminProcedure.query(({ ctx }) => ({
        posts: ctx.db.posts.length,
        published: ctx.db.posts.filter((p) => p.published).length,
      })),
      crash: adminProcedure.query(() => {
        throw new Error("connect ECONNREFUSED 10.0.0.5:5432");
      }),
    },
    broken: publicProcedure
      .use(async ({ next }) => {
        next();
      })
      .query(() => "never returned"),
  };
}

function postIdInput(raw) {
  if (raw && typeof raw === "object" && Number.isInteger(raw.id) && raw.id > 0) {
    return { success: true, data: { id: raw.id } };
  }
  return { success: false, fieldErrors: { id: ["Expected a positive integer"] } };
}

function createPostInput(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const fieldErrors = {};
  const title = typeof src.title === "string" ? src.title.trim() : "";
  if (title.length < 3) fieldErrors.title = ["Must be at least 3 characters"];
  if (src.body !== undefined && typeof src.body !== "string") fieldErrors.body = ["Expected a string"];
  if (Object.keys(fieldErrors).length > 0) return { success: false, fieldErrors };
  return { success: true, data: { title, body: src.body ?? "" } };
}

function pageInput(raw) {
  const limit = raw && raw.limit !== undefined ? raw.limit : 10;
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return { success: false, fieldErrors: { limit: ["Must be an integer from 1 to 50"] } };
  }
  return { success: true, data: { limit } };
}

function searchInput(raw) {
  if (!raw || typeof raw.q !== "string" || raw.q.trim() === "") {
    return { success: false, fieldErrors: { q: ["Required"] } };
  }
  return { success: true, data: { q: raw.q.trim().toLowerCase() } };
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
`,
        functionName: "runTRPC",
        testCases: [
          {
            description: "a public query needs no session, so deriving protected procedures from it didn't change it",
            args: [{ session: null, batches: [[{ path: "health", type: "query" }]] }],
            expected: {
              responses: [{ status: 200, results: [{ ok: true, data: "ok" }] }],
              log: ["query health", "done health"],
            },
          },
          {
            description: "a batch of queries returns results in call order with status 200",
            args: [
              {
                session: null,
                batches: [[{ path: "post.list", type: "query" }, { path: "post.byId", type: "query", input: { id: 3 } }]],
              },
            ],
            expected: {
              responses: [
                {
                  status: 200,
                  results: [
                    {
                      ok: true,
                      data: [
                        { id: 1, title: "Hello tRPC", published: true },
                        { id: 3, title: "Why superjson", published: true },
                      ],
                    },
                    {
                      ok: true,
                      data: { id: 3, title: "Why superjson", body: "Dates survive the wire.", authorId: "u2", published: true },
                    },
                  ],
                },
              ],
              log: ["query post.list", "done post.list", "query post.byId", "done post.byId"],
            },
          },
          {
            description: "bad input is BAD_REQUEST with the parser's field errors, and the logging middleware still resumes",
            args: [{ session: null, batches: [[{ path: "post.byId", type: "query", input: { id: "3" } }]] }],
            expected: {
              responses: [
                {
                  status: 400,
                  results: [
                    {
                      ok: false,
                      error: {
                        code: "BAD_REQUEST",
                        httpStatus: 400,
                        message: "Invalid input",
                        path: "post.byId",
                        fieldErrors: { id: ["Expected a positive integer"] },
                      },
                    },
                  ],
                },
              ],
              log: ["query post.byId", "done post.byId"],
            },
          },
          {
            description: "a TRPCError thrown by a resolver keeps its code and message",
            args: [{ session: null, batches: [[{ path: "post.byId", type: "query", input: { id: 2 } }]] }],
            expected: {
              responses: [
                {
                  status: 404,
                  results: [
                    { ok: false, error: { code: "NOT_FOUND", httpStatus: 404, message: "Post 2 not found", path: "post.byId" } },
                  ],
                },
              ],
              log: ["query post.byId", "done post.byId"],
            },
          },
          {
            description: "a protected mutation sees the user that the auth middleware added to ctx",
            args: [
              {
                session: { user: { id: "u2", role: "member" } },
                batches: [
                  [{ path: "post.create", type: "mutation", input: { title: "  Edge caching  ", body: "CDN first" } }],
                  [{ path: "post.mine", type: "query" }],
                ],
              },
            ],
            expected: {
              responses: [
                {
                  status: 200,
                  results: [
                    { ok: true, data: { id: 4, title: "Edge caching", body: "CDN first", authorId: "u2", published: false } },
                  ],
                },
                {
                  status: 200,
                  results: [
                    {
                      ok: true,
                      data: [
                        { id: 3, title: "Why superjson", published: true },
                        { id: 4, title: "Edge caching", published: false },
                      ],
                    },
                  ],
                },
              ],
              log: ["mutation post.create", "done post.create", "query post.mine", "done post.mine"],
            },
          },
          {
            description: "a middleware after .input() sees the parsed input and can pass the loaded row downstream",
            args: [
              {
                session: { user: { id: "u1", role: "member" } },
                batches: [
                  [{ path: "post.publish", type: "mutation", input: { id: 2 } }],
                  [{ path: "post.list", type: "query" }],
                ],
              },
            ],
            expected: {
              responses: [
                { status: 200, results: [{ ok: true, data: { id: 2, title: "Draft: Prisma 7 notes", published: true } }] },
                {
                  status: 200,
                  results: [
                    {
                      ok: true,
                      data: [
                        { id: 1, title: "Hello tRPC", published: true },
                        { id: 2, title: "Draft: Prisma 7 notes", published: true },
                        { id: 3, title: "Why superjson", published: true },
                      ],
                    },
                  ],
                },
              ],
              log: ["mutation post.publish", "done post.publish", "query post.list", "done post.list"],
            },
          },
          {
            description: "different outcomes in one batch give 207 Multi-Status",
            args: [
              {
                session: { user: { id: "u2", role: "member" } },
                batches: [
                  [
                    { path: "post.publish", type: "mutation", input: { id: 2 } },
                    { path: "post.publish", type: "mutation", input: { id: 9 } },
                    { path: "post.publish", type: "mutation", input: { id: 3 } },
                  ],
                ],
              },
            ],
            expected: {
              responses: [
                {
                  status: 207,
                  results: [
                    { ok: false, error: { code: "FORBIDDEN", httpStatus: 403, message: "Not your post", path: "post.publish" } },
                    {
                      ok: false,
                      error: { code: "NOT_FOUND", httpStatus: 404, message: "Post 9 not found", path: "post.publish" },
                    },
                    { ok: true, data: { id: 3, title: "Why superjson", published: true } },
                  ],
                },
              ],
              log: [
                "mutation post.publish",
                "done post.publish",
                "mutation post.publish",
                "done post.publish",
                "mutation post.publish",
                "done post.publish",
              ],
            },
          },
          {
            description: "adminProcedure stacks on protectedProcedure: a member gets FORBIDDEN",
            args: [{ session: { user: { id: "u2", role: "member" } }, batches: [[{ path: "admin.stats", type: "query" }]] }],
            expected: {
              responses: [
                {
                  status: 403,
                  results: [
                    { ok: false, error: { code: "FORBIDDEN", httpStatus: 403, message: "Admins only", path: "admin.stats" } },
                  ],
                },
              ],
              log: ["query admin.stats", "done admin.stats"],
            },
          },
          {
            description: "without a session, protected procedures fail with UNAUTHORIZED before their input is validated",
            args: [
              {
                session: null,
                batches: [
                  [{ path: "post.create", type: "mutation", input: { title: "" } }, { path: "post.mine", type: "query" }],
                ],
              },
            ],
            expected: {
              responses: [
                {
                  status: 401,
                  results: [
                    {
                      ok: false,
                      error: { code: "UNAUTHORIZED", httpStatus: 401, message: "UNAUTHORIZED", path: "post.create" },
                    },
                    { ok: false, error: { code: "UNAUTHORIZED", httpStatus: 401, message: "UNAUTHORIZED", path: "post.mine" } },
                  ],
                },
              ],
              log: ["mutation post.create", "done post.create", "query post.mine", "done post.mine"],
            },
            isEdgeCase: true,
          },
          {
            description: "an unexpected error is masked as INTERNAL_SERVER_ERROR instead of leaking its message",
            args: [
              {
                session: { user: { id: "u9", role: "admin" } },
                batches: [[{ path: "admin.stats", type: "query" }, { path: "admin.crash", type: "query" }]],
              },
            ],
            expected: {
              responses: [
                {
                  status: 207,
                  results: [
                    { ok: true, data: { posts: 3, published: 2 } },
                    {
                      ok: false,
                      error: {
                        code: "INTERNAL_SERVER_ERROR",
                        httpStatus: 500,
                        message: "Internal server error",
                        path: "admin.crash",
                      },
                    },
                  ],
                },
              ],
              log: ["query admin.stats", "done admin.stats", "query admin.crash", "done admin.crash"],
            },
            isEdgeCase: true,
          },
          {
            description: "unknown paths, sub-router paths and inherited properties are NOT_FOUND",
            args: [
              {
                session: null,
                batches: [
                  [
                    { path: "post.delete", type: "query" },
                    { path: "post", type: "query" },
                    { path: "post.constructor", type: "query" },
                  ],
                ],
              },
            ],
            expected: {
              responses: [
                {
                  status: 404,
                  results: [
                    {
                      ok: false,
                      error: {
                        code: "NOT_FOUND",
                        httpStatus: 404,
                        message: "No procedure found on path \"post.delete\"",
                        path: "post.delete",
                      },
                    },
                    {
                      ok: false,
                      error: {
                        code: "NOT_FOUND",
                        httpStatus: 404,
                        message: "No procedure found on path \"post\"",
                        path: "post",
                      },
                    },
                    {
                      ok: false,
                      error: {
                        code: "NOT_FOUND",
                        httpStatus: 404,
                        message: "No procedure found on path \"post.constructor\"",
                        path: "post.constructor",
                      },
                    },
                  ],
                },
              ],
              log: [],
            },
            isEdgeCase: true,
          },
          {
            description: "calling a procedure with the wrong type is METHOD_NOT_SUPPORTED, before any middleware runs",
            args: [
              {
                session: { user: { id: "u1", role: "member" } },
                batches: [
                  [{ path: "health", type: "mutation" }, { path: "post.create", type: "query", input: { title: "abc" } }],
                ],
              },
            ],
            expected: {
              responses: [
                {
                  status: 405,
                  results: [
                    {
                      ok: false,
                      error: {
                        code: "METHOD_NOT_SUPPORTED",
                        httpStatus: 405,
                        message: "\"health\" is a query, not a mutation",
                        path: "health",
                      },
                    },
                    {
                      ok: false,
                      error: {
                        code: "METHOD_NOT_SUPPORTED",
                        httpStatus: 405,
                        message: "\"post.create\" is a mutation, not a query",
                        path: "post.create",
                      },
                    },
                  ],
                },
              ],
              log: [],
            },
            isEdgeCase: true,
          },
          {
            description: "a middleware that forgets to return next() is an INTERNAL_SERVER_ERROR with a hint",
            args: [{ session: null, batches: [[{ path: "broken", type: "query" }]] }],
            expected: {
              responses: [
                {
                  status: 500,
                  results: [
                    {
                      ok: false,
                      error: {
                        code: "INTERNAL_SERVER_ERROR",
                        httpStatus: 500,
                        message: "No result from middlewares - did you forget to return next()?",
                        path: "broken",
                      },
                    },
                  ],
                },
              ],
              log: ["query broken", "done broken"],
            },
            isEdgeCase: true,
          },
          {
            description: "chained .input() parsers merge their data, and the first failing parser stops the chain",
            args: [
              {
                session: null,
                batches: [
                  [{ path: "search", type: "query", input: { q: " WHY ", limit: 5 } }],
                  [{ path: "search", type: "query", input: { limit: 100 } }],
                ],
              },
            ],
            expected: {
              responses: [
                { status: 200, results: [{ ok: true, data: { input: { limit: 5, q: "why" }, ids: [3] } }] },
                {
                  status: 400,
                  results: [
                    {
                      ok: false,
                      error: {
                        code: "BAD_REQUEST",
                        httpStatus: 400,
                        message: "Invalid input",
                        path: "search",
                        fieldErrors: { limit: ["Must be an integer from 1 to 50"] },
                      },
                    },
                  ],
                },
              ],
              log: ["query search", "done search", "query search", "done search"],
            },
            isEdgeCase: true,
          },
          {
            description: "an empty batch is a 200 with no results",
            args: [{ session: null, batches: [[]] }],
            expected: { responses: [{ status: 200, results: [] }], log: [] },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "t3-prisma-schema-migrations",
      moduleId: "fs-t3",
      trackId: "fullstack",
      title: "Prisma Schema & Migrations",
      summary:
        "Prisma keeps two artifacts: `schema.prisma`, the model the client's types are generated from, and a folder of SQL migrations, the ordered, reviewable history of how production got its shape. The commands differ in which one they trust. `prisma migrate dev` is for development only: it replays the whole history into a temporary shadow database to detect drift, diffs that against your schema, writes a new migration, applies it, and offers to reset your database when history and database disagree. `prisma migrate deploy` is what CI runs against production: it applies pending migrations in order under an advisory lock and never resets, diffs or uses a shadow database, so it won't notice drift. `prisma db push` keeps no history; it makes the database match the schema directly, which suits prototyping only.\n\nOnly the side of a relation with `@relation(fields: [authorId], references: [id])` owns a column; the list side is virtual. The generated client turns `select` and `include` into exact result types, which is where T3's type safety starts. Renames are the trap: rename a field and `migrate dev` generates a DROP and an ADD COLUMN, deleting the data, unless you create the migration with `--create-only` and edit it to `RENAME COLUMN` (or keep the column name with `@map`). In production even a correct rename breaks the running code; use expand and contract.\n\nPrisma 7, the current stable line (create-t3-app 7.40 still scaffolds Prisma 6), replaced the Rust engine with a TypeScript client: the `prisma-client` generator needs an explicit `output`, every database needs a driver adapter such as `@prisma/adapter-pg`, connection URLs move to `prisma.config.ts`, `.env` isn't loaded for you, and `migrate dev` no longer runs `generate` or your seed. Since the Prisma 8 release candidates shipped, `npx prisma` fetches a CLI that doesn't read `schema.prisma` and has no `migrate dev`, so pin `prisma@7`.",
      level: "advanced",
      estMinutes: 65,
      webRefs: [
        {
          label: "Prisma ORM v7: Development and production",
          url: "https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production",
          kind: "docs",
        },
        { label: "Prisma ORM v7: Customizing migrations", url: "https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/customizing-migrations", kind: "docs" },
        { label: "Prisma: Upgrade to Prisma ORM 7", url: "https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7", kind: "docs" },
        {
          label: "Prisma Data Guide: Using the expand and contract pattern",
          url: "https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern",
          kind: "article",
        },
      ],
      video: {
        title: "Prisma Migrations: A Step-by-Step Guide",
        channel: "Prisma",
        url: "https://www.youtube.com/watch?v=ZaCFsFES5yQ",
        videoId: "ZaCFsFES5yQ",
        durationLabel: "12:13",
      },
      alternateVideos: [
        {
          title: "Prisma 7 is here.",
          channel: "Prisma",
          url: "https://www.youtube.com/watch?v=AmIXJHL-sBU",
          videoId: "AmIXJHL-sBU",
          durationLabel: "3:08",
        },
        {
          title: "Prisma essentials: from development to production (Prisma Migrate workflow)",
          channel: "Neon Postgres",
          url: "https://www.youtube.com/watch?v=PX881bVAPxM",
          videoId: "PX881bVAPxM",
          durationLabel: "8:47",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "t3-prisma-schema-migrations-q1",
          prompt: "Which of these does `prisma migrate dev` do that `prisma migrate deploy` doesn't? (Select all that apply.)",
          options: [
            "Replays the migration history into a shadow database to detect drift",
            "Generates a new migration from changes in `schema.prisma`",
            "Offers to reset the database when the history and the database disagree",
            "Applies pending migrations to the target database",
            "Runs `prisma generate` automatically in Prisma 7",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Drift detection, diffing and resets are development features, which is why `migrate dev` must never point at production. Both commands apply pending migrations, and in Prisma 7 neither runs `generate`.",
        },
        {
          id: "t3-prisma-schema-migrations-q2",
          prompt:
            "A team's production deploy runs `prisma db push --accept-data-loss` because \"it's simpler than migrations\". What's the most serious problem?",
          options: [
            "There's no migration history, so a rename can silently become a drop-and-add that deletes data",
            "`db push` can't connect to a production PostgreSQL database over TLS",
            "`db push` needs a shadow database, which production providers don't allow",
            "`db push` locks every table for the whole deploy, which causes downtime",
          ],
          correctIndex: 0,
          explanation:
            "`db push` writes no migration files and never touches `_prisma_migrations`, and `--accept-data-loss` silences the one warning it gives. It works with Postgres and needs no shadow database; the problem is the missing, reviewable history.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "t3-prisma-schema-migrations-q3",
          prompt:
            "In a Prisma 7 project you add `slug String @unique` to `Post` and run `npx prisma migrate dev --name add_slug`. The migration applies, but `post.slug` is still a TypeScript error. Why?",
          options: [
            "Prisma 7's `migrate dev` no longer runs `prisma generate`, so the client is stale",
            "Unique fields only appear in the generated types after `migrate deploy`",
            "The editor caches `node_modules/.prisma/client` and needs a restart",
            "`migrate dev` generated the types for the shadow database, not the real one",
          ],
          correctIndex: 0,
          explanation:
            "Prisma 7 removed the automatic `generate` (and seed) from `migrate dev` and `db push`, so run `prisma generate` yourself or in a script. The client no longer lives in `node_modules` at all: the `prisma-client` generator writes to the `output` path you set.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "t3-prisma-schema-migrations-q4",
          prompt:
            "It's September 2026. A new teammate clones a Prisma 7 project whose `package.json` doesn't list `prisma`, and runs `npx prisma migrate dev`. What happens?",
          options: [
            "npx fetches the Prisma 8 release-candidate CLI, which has no `migrate dev` command",
            "npx finds the newest 7.x release, because the generated client is from Prisma 7",
            "It works, but prints a warning that `migrate dev` is moving to Prisma 8",
            "It fails, because npx refuses to run a package that isn't in `package.json`",
          ],
          correctIndex: 0,
          explanation:
            "Prisma's release-status page warns that `npm install prisma` and `npx prisma` now give you the version 8 CLI, which has no `generate`, `migrate dev` or `db push`. That CLI doesn't even read `schema.prisma`. npx doesn't look at your generated client; it resolves the registry's current tag unless the project pins a version, so install `prisma@7` as a dev dependency.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "t3-prisma-schema-migrations-q5",
          prompt:
            "`prisma migrate dev` fails against a managed Postgres development database with a permission error while creating the shadow database. What's the right fix?",
          options: [
            "Create a separate, empty database and point `shadowDatabaseUrl` at it",
            "Set `shadowDatabaseUrl` to the same URL as the main database",
            "Switch both development and production over to `prisma db push`",
            "Grant the production application user the `SUPERUSER` role",
          ],
          correctIndex: 0,
          explanation:
            "By default the shadow database is created and dropped on every run, which needs the `CREATEDB` privilege that managed providers often withhold, so you supply a dedicated one in `prisma.config.ts`. Prisma's docs warn never to reuse the main URL: the shadow database is reset at the start of each run, which could delete all your data.",
        },
        {
          id: "t3-prisma-schema-migrations-q6",
          prompt:
            "Which fields become columns in the database? (Select all that apply.)\n\n```prisma\nmodel User {\n  id    Int    @id @default(autoincrement())\n  posts Post[]\n}\n\nmodel Post {\n  id       Int  @id @default(autoincrement())\n  author   User @relation(fields: [authorId], references: [id])\n  authorId Int\n}\n```",
          options: ["`User.id`", "`Post.id`", "`Post.authorId`", "`User.posts`", "`Post.author`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Relation fields (`posts`, `author`) exist only in the Prisma client for navigating and nesting. The foreign key is the scalar `authorId`, named in `@relation(fields: ...)`, and that's the column the constraint is created on.",
        },
        {
          id: "t3-prisma-schema-migrations-q7",
          prompt: "You rename `name` to `fullName` in the `User` model and run `prisma migrate dev`. What does Prisma generate, and how do you keep the data?",
          options: [
            "It drops `name` and adds `fullName`; edit a `--create-only` draft to use `RENAME COLUMN`",
            "It generates `RENAME COLUMN` automatically, because both fields have the same type",
            "It refuses to generate a migration until you run `prisma migrate reset` first",
            "It copies the data into the new column and then drops the old one",
          ],
          correctIndex: 0,
          explanation:
            "Prisma can't tell a rename from a drop plus an add, so the default migration deletes the column's data. Editing the draft migration (or mapping the new field name onto the old column with `@map(\"name\")`) preserves it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "t3-prisma-schema-migrations-q8",
          prompt:
            "Your pipeline runs `prisma migrate deploy` just before new instances start, and old instances keep serving traffic until the rollout finishes. Which changes are safe to ship in the same release as the code that uses them? (Select all that apply.)",
          options: [
            "Adding a nullable `bio` column that only the new code reads",
            "Adding a new `AuditLog` table",
            "Dropping the `legacyRole` column that the current code still selects",
            "Renaming `name` to `fullName` in a single migration",
            "Adding a required `tenantId` column with no default to a table that has rows",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Additive changes are invisible to the old code, so they're safe. The drop and the rename break the old instances for the length of the rollout, and a NOT NULL column without a default can't be added to a populated table at all.",
        },
        {
          id: "t3-prisma-schema-migrations-q9",
          prompt: "What's the safe way to rename a column in production without downtime?",
          options: [
            "Add the new column, dual-write, backfill, switch reads, then drop the old column in a later release",
            "Rename the column in a migration, then deploy the new code immediately afterwards",
            "Deploy code that reads the new column first, then run the rename migration",
            "Ship the rename and the code in one deploy, relying on the migration running first",
          ],
          correctIndex: 0,
          explanation:
            "Expand and contract keeps every schema state compatible with every version of the code that can be running against it. Any single-step rename leaves some window where running code references a column that doesn't exist.",
        },
        {
          id: "t3-prisma-schema-migrations-q10",
          prompt:
            "After upgrading to Prisma 7, `prisma migrate deploy` in CI reports that `DATABASE_URL` is missing, although the job writes a `.env` file containing it. What changed?",
          options: [
            "Prisma 7 no longer loads `.env` itself, so `prisma.config.ts` has to (for example via `dotenv/config`)",
            "Prisma 7 reads the URL only from the `datasource` block in `schema.prisma`",
            "`migrate deploy` in Prisma 7 requires `DIRECT_URL` instead of `DATABASE_URL`",
            "Prisma 7 reads `.env.production` in CI and ignores a plain `.env` file",
          ],
          correctIndex: 0,
          explanation:
            "Environment variables aren't loaded by default in Prisma 7, and the connection URL moves out of the schema into `prisma.config.ts` (`datasource: { url: env(\"DATABASE_URL\") }`). The schema's `url` field is deprecated. Load the file with `import \"dotenv/config\"` in the config, or export the variable in CI.",
        },
        {
          id: "t3-prisma-schema-migrations-q11",
          prompt:
            "`Post` has `id Int`, `title String`, `published Boolean`, `authorId Int` and an `author` relation to `User`, which has `name String`. What's the inferred element type of `posts`?\n\n```ts\nconst posts = await prisma.post.findMany({\n  select: { id: true, title: true, author: { select: { name: true } } },\n});\n```",
          options: [
            "`{ id: number; title: string; author: { name: string } }`",
            "`Post`, with every scalar field",
            "`Post & { author: User }`",
            "`any`, because nested selects aren't typed",
          ],
          correctIndex: 0,
          explanation:
            "The generated client computes the result type from the `select` tree, so unselected fields such as `published` don't exist on the result. `include` would add the relation on top of every scalar field instead.",
        },
        {
          id: "t3-prisma-schema-migrations-q12",
          prompt: "A migration fails halfway through in production. What does the next `prisma migrate deploy` do?",
          options: [
            "It stops until you mark the failed migration with `prisma migrate resolve`",
            "It retries the failed migration automatically before applying new ones",
            "It resets the database and replays the whole migration history",
            "It skips the failed migration and applies the ones after it",
          ],
          correctIndex: 0,
          explanation:
            "A failed migration is recorded in `_prisma_migrations`, and deploy refuses to go further (error P3009). You either revert the partial changes and mark it `--rolled-back` so it runs again, or finish it by hand and mark it `--applied`. Resets are a development-only tool.",
        },
      ],
    },
    {
      id: "t3-end-to-end-type-safety",
      moduleId: "fs-t3",
      trackId: "fullstack",
      title: "Achieving End-to-End Type Safety (DB → API → UI)",
      summary:
        "End-to-end type safety means a change to the database schema shows up as a compile error in every UI that depends on it. Prisma generates types from `schema.prisma`, tRPC infers each procedure's output from its resolver, and the client imports `AppRouter` as a type, so nothing is written twice and nothing drifts. The chain has three weak links.\n\nSerialization. Data crosses the wire as JSON, and tRPC's inferred types are honest about it: without a transformer a `Date` output is typed as `string` on the client, a `Map` as `object`, and a `BigInt` (which makes `JSON.stringify` throw) as `never`. create-t3-app configures superjson on `initTRPC.create()` and on the client link (tRPC 11 moved the transformer onto links), so `Date`, `BigInt`, `Map`, `Set` and `undefined` survive. Once a transformer is set, tRPC trusts it, so a Prisma `Decimal` arrives as a string while the type still says `Decimal` unless you register a custom serializer. React has the same limit for Server Component props: class instances can't cross to a Client Component.\n\nRuntime boundaries. Types are erased, so everything entering the process needs a validator: procedure inputs, webhooks, third-party `fetch` responses, `Json` columns, environment variables, `localStorage`. An `as` cast at any of those points turns a compile-time guarantee into a runtime lie. Version skew breaks the other assumption, that both sides compile together: a tab left open for two days runs yesterday's client against today's server. Vercel's Skew Protection pins framework-managed requests, but not the custom `fetch` calls tRPC makes, unless you send the deployment id yourself. Additive, backward-compatible procedure changes are the durable fix.\n\nThe quiet gotcha is over-exposure. `return ctx.db.user.findUnique(...)` is perfectly typed and ships `passwordHash` to the browser. Types describe the shape; `select`, or an `.output()` schema that strips unknown keys, decides what leaves the server.",
      level: "expert",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "tRPC: Data Transformers", url: "https://trpc.io/docs/server/data-transformers", kind: "docs" },
        { label: "Vercel: Skew Protection", url: "https://vercel.com/docs/skew-protection", kind: "docs" },
        { label: "Alexis King: Parse, don't validate", url: "https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/", kind: "article" },
        { label: "superjson (GitHub)", url: "https://github.com/ravionhq/superjson", kind: "repo" },
      ],
      video: {
        title: "T3 Stack Tutorial - FROM 0 TO PROD FOR $0 (Next.js, tRPC, TypeScript, Tailwind, Prisma & More)",
        channel: "Theo - t3․gg",
        url: "https://www.youtube.com/watch?v=YkOSUVzOAA4",
        videoId: "YkOSUVzOAA4",
        durationLabel: "2:59:02",
        startSeconds: 1275,
        chapterLabel: "From Prisma Schema to tRPC Procedure",
      },
      alternateVideos: [
        {
          title: "T3: TRPC, Prisma and NextAuth Done Right",
          channel: "Jack Herrington",
          url: "https://www.youtube.com/watch?v=J1gzN1SAhyM",
          videoId: "J1gzN1SAhyM",
          durationLabel: "43:13",
          startSeconds: 1213,
          chapterLabel: "Adding Tables To The Schema",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "t3-end-to-end-type-safety-q1",
          prompt:
            "No transformer is configured. Once the query has loaded, what is `data.createdAt` at runtime, and what type does tRPC infer for it?\n\n```ts\n// server\nconst t = initTRPC.create();\nexport const appRouter = t.router({\n  getPost: t.procedure.query(() => ({\n    id: 1,\n    createdAt: new Date(\"2026-09-21T10:00:00Z\"),\n  })),\n});\nexport type AppRouter = typeof appRouter;\n\n// client\nconst { data } = api.getPost.useQuery();\n```",
          options: [
            "The string `\"2026-09-21T10:00:00.000Z\"`, typed as `string`",
            "The same string, but typed as `Date`, so `data.createdAt.getTime()` compiles and then crashes",
            "A `Date` object, typed as `Date`",
            "`undefined`, because JSON drops dates",
          ],
          correctIndex: 0,
          explanation:
            "`JSON.stringify` calls `Date#toJSON`, and without a transformer tRPC runs outputs through a `Serialize` type that mirrors this, so the client type is `string`. The lying `Date` type is what you get from a hand-written `fetch` plus an `as` cast.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "t3-end-to-end-type-safety-q2",
          prompt:
            "superjson is configured on both sides. A procedure returns a Prisma row whose `price` column is `Decimal`. What does the client receive?",
          options: [
            "A string such as `\"19.99\"`, while the inferred type says `Decimal`",
            "A `Decimal` instance, because superjson understands Prisma types",
            "A JavaScript `number`",
            "An error, because superjson can't serialize class instances",
          ],
          correctIndex: 0,
          explanation:
            "superjson handles built-ins (`Date`, `BigInt`, `Map`, `Set`, `RegExp`, `URL`, `Error`, `undefined`); a `Decimal` falls back to its `toJSON()`, which is a string. With a transformer configured, tRPC skips its `Serialize` type and trusts the transformer, so the type is wrong until you add superjson's `registerCustom` recipe for `Decimal`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "t3-end-to-end-type-safety-q3",
          prompt: "Where must superjson be configured in a tRPC 11 app? (Select all that apply.)",
          options: [
            "`initTRPC.create({ transformer: superjson })` on the server",
            "The `transformer` option of the client's HTTP link, such as `httpBatchStreamLink`",
            "`createTRPCClient({ transformer })`, as in tRPC 10",
            "`next.config.ts`, so Next.js can serialize responses",
            "Only on the server, because the client detects it from the response",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Both ends must agree on the encoding, and tRPC 11 moved the client side from `createTRPCClient` into the links array. Nothing is detected from the response, and Next.js isn't involved.",
        },
        {
          id: "t3-end-to-end-type-safety-q4",
          prompt: "Why does the client import the router as `import type { AppRouter } from \"~/server/api/root\"`?",
          options: [
            "Type-only imports are erased, so no server code (such as the database client) is bundled",
            "It triggers tRPC's build step, which generates a typed client SDK",
            "Type imports are resolved at runtime by fetching the router's schema",
            "It lets the bundler tree-shake unused procedures out of the server build",
          ],
          correctIndex: 0,
          explanation:
            "There's no generated artifact: the compiler reads the server's types directly and emits nothing for the import. A value import could drag Prisma and secrets-bearing modules into the browser bundle.",
        },
        {
          id: "t3-end-to-end-type-safety-q5",
          prompt:
            "A procedure returns `ctx.db.user.findUnique({ where: { id: input.id } })`, and the UI only shows the user's name. What's wrong?",
          options: [
            "Every column, `passwordHash` included, is sent to the browser, and the types don't object",
            "Nothing: tRPC strips any fields that the client code never reads",
            "It causes an N+1 query, because `findUnique` runs once per field",
            "It doesn't compile, because Prisma model types can't cross the wire",
          ],
          correctIndex: 0,
          explanation:
            "End-to-end types make over-exposure invisible: the whole row is a valid output. Use `select`, or an `.output()` Zod object, which strips unknown keys by default.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "t3-end-to-end-type-safety-q6",
          prompt: "Which of these still need runtime validation in a fully typed T3 app? (Select all that apply.)",
          options: [
            "A Stripe webhook payload arriving at a Route Handler",
            "The JSON from a third-party weather API's `fetch` response",
            "A Prisma `Json` column you read back",
            "Values read from `localStorage` on page load",
            "The arguments a typed function receives from your own typed code",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Anything that crosses a process or storage boundary arrives as untyped data, whatever your types claim (a `Json` column is typed `JsonValue` for exactly that reason). Calls inside your own compiled code are what the type checker already guarantees.",
        },
        {
          id: "t3-end-to-end-type-safety-q7",
          prompt:
            "A user leaves a tab open for two days. Meanwhile you deploy a change that renames a required input field of `post.create` from `body` to `content`. The app runs on Vercel with Skew Protection enabled. What happens when the old tab submits a post?",
          options: [
            "It reaches the new server, since Skew Protection doesn't pin tRPC's `fetch`, and fails with `BAD_REQUEST`",
            "Skew Protection routes it to the old deployment, so the post is created",
            "TypeScript caught the mismatch at build time, so the old tab can't send it",
            "tRPC's client refetches the router's types and maps `body` onto `content`",
          ],
          correctIndex: 0,
          explanation:
            "Skew Protection pins framework-managed requests (assets, navigations, Server Actions), not your own `fetch` calls, and by default only for a day. Compile-time checks only cover code built together, so keep procedure changes backward compatible, or send the deployment id from the link's headers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "t3-end-to-end-type-safety-q8",
          prompt: "What does adding `.output(publicUserSchema)` (a Zod object) to a procedure give you? (Select all that apply.)",
          options: [
            "Unknown keys are stripped from the response, because Zod objects strip them by default",
            "A runtime check that the resolver's return value matches the schema",
            "A failed check becomes an `INTERNAL_SERVER_ERROR`, not a client error",
            "The client validates each response before rendering it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "tRPC's output middleware parses the resolver's result on the server and returns the parsed value, so extra fields are dropped. A mismatch is the server's bug, hence a 500 with `Output validation failed`. Nothing runs on the client.",
        },
        {
          id: "t3-end-to-end-type-safety-q9",
          prompt:
            "A Server Component loads a product with Prisma (including `price Decimal`) and passes the row to a Client Component as a prop. What happens?",
          options: [
            "React rejects it: class instances such as `Decimal` can't be passed to Client Components",
            "It works, because React's serializer handles every type Prisma returns",
            "The prop silently arrives as `undefined` in the Client Component",
            "It works only when superjson is registered as React's serializer",
          ],
          correctIndex: 0,
          explanation:
            "Server-to-client props support primitives (`bigint` included), `Date`, `Map`, `Set`, typed arrays, plain objects, promises and Server Functions, but not class instances. Convert the value to a string or number on the server first; superjson plays no part in React's serialization.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "t3-end-to-end-type-safety-q10",
          prompt:
            "In a TypeScript monorepo, which changes to a procedure make the client fail to compile, with no codegen step? (Select all that apply.)",
          options: [
            "Renaming a field in the resolver's return value",
            "Making an optional input field required",
            "Changing an input field from `z.string()` to `z.number()`",
            "Changing the database column's collation",
            "Changing which rows the query returns",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Shape changes flow through inference to every call site. Behavior that the types don't encode (collation, filtering, ordering) changes silently, which is why types don't replace tests.",
        },
        {
          id: "t3-end-to-end-type-safety-q11",
          prompt: "A create form and the matching tRPC input need the same validation rules. What's the idiomatic T3 approach?",
          options: [
            "Define one shared Zod schema for `.input()` and the form, and derive the type with `z.infer`",
            "Use Prisma's generated `Prisma.PostCreateInput` type as the input type and skip Zod",
            "Write a TypeScript interface and a separate Zod schema, and keep them in sync in code review",
            "Validate only in the form, because the server's input types are already enforced",
          ],
          correctIndex: 0,
          explanation:
            "One schema gives you runtime validation on both sides and a type with no chance of drift. Prisma's input types check nothing at runtime and describe the database, not your API contract.",
        },
      ],
    },
    {
      id: "t3-when-to-use",
      moduleId: "fs-t3",
      trackId: "fullstack",
      title: "When T3 Is (and Isn't) the Right Choice",
      summary:
        "T3 is a set of opinions, not a framework. create-t3-app scaffolds Next.js, TypeScript and Tailwind plus your choice of tRPC, Prisma or Drizzle, and NextAuth.js or Better Auth, then gets out of the way: there's no T3 runtime or upgrade command, so you own every dependency from day one. Version 7.40, the current CLI, still pins Prisma 6, the `next-auth` 5 beta and tRPC 11's classic React Query integration, so even a new project starts with upgrades to plan. Its axioms: solve problems, bleed responsibly, typesafety isn't optional.\n\nIt fits when one team owns the client and the server, both are TypeScript, and they ship together: SaaS dashboards, internal tools, or a Next.js app and an Expo app in one monorepo. The payoff is velocity: a renamed field fails the build wherever it's used, with no OpenAPI document to maintain.\n\nIt's the wrong tool when the API is a product. Partners can't import your `AppRouter`, and tRPC's wire format (procedure paths, batching, the superjson envelope) is an implementation detail rather than a contract you can version. Swift, Kotlin, Go or Python consumers gain nothing from inferred TypeScript types, so use OpenAPI with generated clients, GraphQL or gRPC (oRPC offers tRPC-like ergonomics plus OpenAPI). Mobile is the subtle case: installed binaries run old versions for months, so every procedure change must stay backward compatible, canceling much of tRPC's refactor-freely advantage. Public, cacheable reads suit REST better: a batched GET puts several procedures in one URL, fragmenting CDN cache keys.\n\nWeigh the platform too. With Server Components and Server Actions, many reads and mutations need no API layer at all (Theo's own 2024 tutorial ships without tRPC), but Next.js dispatches Server Actions one at a time per client. A common answer is a mix: Server Components for reads, tRPC for interactive client-side data, OpenAPI at the public edge.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "create.t3.gg: Why CT3A?", url: "https://create.t3.gg/en/why", kind: "docs" },
        { label: "Next.js: Server Actions and Mutations", url: "https://nextjs.org/docs/app/guides/server-actions", kind: "docs" },
        { label: "oRPC: Typesafe APIs Made Simple", url: "https://orpc.dev/", kind: "docs" },
        { label: "Malte Ubl: Version skew", url: "https://www.industrialempathy.com/posts/version-skew/", kind: "article" },
      ],
      video: {
        title: "tRPC, gRPC, GraphQL or REST: when to use what?",
        channel: "Software Developer Diaries",
        url: "https://www.youtube.com/watch?v=veAb1fSp1Lk",
        videoId: "veAb1fSp1Lk",
        durationLabel: "10:46",
      },
      alternateVideos: [
        {
          title: "The T3 Stack - How We Built It",
          channel: "Theo - t3․gg",
          url: "https://www.youtube.com/watch?v=H-FXwnEjSsI",
          videoId: "H-FXwnEjSsI",
          durationLabel: "7:23",
        },
        {
          title: "End to End Type Safety in a Monorepo",
          channel: "Nx - Smart Monorepos - Fast CI",
          url: "https://www.youtube.com/watch?v=XBUB2bZsDP0",
          videoId: "XBUB2bZsDP0",
          durationLabel: "19:47",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "t3-when-to-use-q1",
          prompt:
            "Your company wants to offer a public API to partners who write Python, Java and Go. The web app is built on T3. Why not just expose the existing tRPC router?",
          options: [
            "Its contract is TypeScript types, and its wire format is an internal detail, not a versioned API",
            "tRPC procedures can only be called from browsers running your bundle",
            "tRPC can't read `Authorization` headers, so partners can't authenticate",
            "tRPC endpoints are only reachable from inside Vercel's private network",
          ],
          correctIndex: 0,
          explanation:
            "Anything that speaks HTTP can call a tRPC endpoint, but partners get no schema to generate clients from, so each one reverse-engineers the format (procedure paths, batching, the transformer envelope). A public API needs a versioned contract such as OpenAPI.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "t3-when-to-use-q2",
          prompt: "Which projects are a good fit for tRPC? (Select all that apply.)",
          options: [
            "A SaaS dashboard where one team owns the Next.js client and the server, deployed together",
            "An internal admin tool in a TypeScript monorepo",
            "A Next.js web app and an Expo (React Native) app sharing one TypeScript monorepo",
            "A backend consumed by native Swift and Kotlin apps",
            "A platform API that third parties integrate with",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "tRPC pays off when every consumer is TypeScript code you compile together. Native mobile clients and third parties need a language-neutral contract.",
        },
        {
          id: "t3-when-to-use-q3",
          prompt: "A React Native app in your monorepo calls tRPC. Why is a breaking procedure change riskier there than in the web app?",
          options: [
            "Installed old versions keep calling for months, so the server must stay backward compatible",
            "React Native can't run superjson, so dates arrive as strings instead",
            "tRPC's inferred types aren't available to React Native projects",
            "Requests from mobile clients skip the server's input validation",
          ],
          correctIndex: 0,
          explanation:
            "Web clients refresh on the next page load; app-store binaries don't. The types tell you what breaks, but old clients in the wild still send the old shapes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "t3-when-to-use-q4",
          prompt: "What does create-t3-app give you, and how do you \"upgrade T3\" two years later?",
          options: [
            "A one-time scaffold you own; you upgrade each library yourself, since there's no T3 runtime",
            "A framework dependency; you bump the `create-t3-app` version in `package.json`",
            "A CLI with an upgrade command: `npx create-t3-app upgrade` migrates the project",
            "A hosted platform that keeps your stack's dependencies updated for you",
          ],
          correctIndex: 0,
          explanation:
            "The CLI only generates files. Each library then follows its own release notes and migration guides, such as tRPC 10 to 11 or Prisma 6 to 7.",
        },
        {
          id: "t3-when-to-use-q5",
          prompt:
            "In September 2026 you run `npm create t3-app@latest` (CLI 7.40) and choose Prisma and NextAuth.js. Which are true of the generated project? (Select all that apply.)",
          options: [
            "It depends on Prisma 6 (`^6.6.0`), not Prisma 7",
            "Auth uses `next-auth` 5, which is still a beta release",
            "The tRPC client uses tRPC 11's classic `@trpc/react-query` integration",
            "It includes a `prisma.config.ts` that sets up a driver adapter",
            "It uses tRPC 10's `createTRPCProxyClient`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The CLI's version map pins `prisma` `^6.6.0`, `next-auth` `5.0.0-beta.25` and `@trpc/react-query` `^11.0.0`. Prisma 7's config file and adapters arrive only when you upgrade, and `createTRPCProxyClient` was renamed `createTRPCClient` in tRPC 11.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "t3-when-to-use-q6",
          prompt: "You want tRPC-style inferred types in your TypeScript client and an OpenAPI document for partners from the same code. Which option fits?",
          options: [
            "oRPC, which infers types end to end and also generates OpenAPI documents",
            "GraphQL subscriptions, which push typed updates to every client",
            "tRPC's `httpBatchLink`, which publishes an OpenAPI file for each batch",
            "Prisma's generated client, shared with partners as an npm package",
          ],
          correctIndex: 0,
          explanation:
            "oRPC's pitch is exactly that: typesafe procedures plus generated OpenAPI 3.x documents and REST-style routes. GraphQL gives you SDL rather than OpenAPI, `httpBatchLink` is just a transport, and a Prisma client exposes your database, not an API.",
        },
        {
          id: "t3-when-to-use-q7",
          prompt: "A high-traffic public product page gets its data from tRPC queries through `httpBatchLink`. Why is CDN caching awkward?",
          options: [
            "A batched GET puts several procedures into one URL, which fragments cache keys",
            "tRPC sends queries as POST requests, which CDNs never cache",
            "tRPC always sends `Cache-Control: no-store`, and it can't be overridden",
            "CDNs can't cache JSON, only HTML, images and other static files",
          ],
          correctIndex: 0,
          explanation:
            "Queries are GETs, and you can set cache headers from `responseMeta`, but a URL such as `/api/trpc/product.byId,reviews.list?batch=1&input=...` is a poor cache key, since it varies with whatever happened to be batched together. Stable, resource-shaped REST URLs cache far better.",
        },
        {
          id: "t3-when-to-use-q8",
          prompt:
            "In a Next.js 16 App Router project, when is tRPC still worth adding alongside Server Components and Server Actions?",
          options: [
            "For interactive client-side data and parallel calls, since Server Actions run one at a time",
            "Always, because Server Actions aren't type-safe across the network boundary",
            "Never, because Server Actions are the recommended way to fetch client data",
            "Only when self-hosting, because Server Actions need Vercel's runtime",
          ],
          correctIndex: 0,
          explanation:
            "Server Actions are typed TypeScript functions, but Next.js queues them per client and they're built for mutations. Reads that live in the client (polling, infinite lists, optimistic updates) are where tRPC plus TanStack Query still earns its place. Server Actions also work self-hosted.",
        },
        {
          id: "t3-when-to-use-q9",
          prompt:
            "A separate team is rewriting the backend in Go, while the web client stays in TypeScript. What happens to T3's end-to-end type safety?",
          options: [
            "It no longer applies; you need a contract such as OpenAPI plus generated TypeScript types",
            "tRPC can still infer the types from Go structs through reflection",
            "Prisma keeps both sides in sync because they share one database",
            "Nothing changes as long as the Go server returns the same JSON shape",
          ],
          correctIndex: 0,
          explanation:
            "tRPC's types come from the TypeScript compiler reading the server's code. Across languages, a schema (OpenAPI, GraphQL SDL, protobuf) plus codegen is how you get the guarantee back.",
        },
        {
          id: "t3-when-to-use-q10",
          prompt:
            "Theo's 2023 \"T3 Stack Tutorial - FROM 0 TO PROD FOR $0\" is still a good walkthrough. Which of its choices would you change in a 2026 build? (Select all that apply.)",
          options: [
            "The Pages Router (Next.js 13), now that the App Router is the default",
            "PlanetScale's free Hobby plan, retired in April 2024",
            "Evolving the schema with `prisma db push` and no migrations",
            "Validating procedure inputs with Zod schemas on the server",
            "Writing both the server and the client in TypeScript",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The repo is Next 13 Pages Router with tRPC 10, Prisma 4 on PlanetScale (`relationMode = \"prisma\"`, no migrations) and Clerk, so the \"$0\" and the schema workflow have both aged. Zod validation and TypeScript are the parts that carried over unchanged.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "t3-when-to-use-q11",
          prompt:
            "An `auth.login` mutation sets a session cookie on the response headers. It works in a test with a plain HTTP link, but in the app, which uses create-t3-app's `httpBatchStreamLink`, the cookie never arrives. Why?",
          options: [
            "Streaming sends headers before procedures finish, so that call needs `httpBatchLink`",
            "tRPC mutations can't set cookies; only Route Handlers can",
            "superjson strips `Set-Cookie` from every response it serializes",
            "Browsers ignore cookies set on responses to batched requests",
          ],
          correctIndex: 0,
          explanation:
            "tRPC's docs say to use `httpBatchLink` if you need to set response headers, cookies included, from within procedures. `splitLink` can route just that call through it; streaming trades the ability for not waiting on the slowest call.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
  ],
} satisfies Module;
