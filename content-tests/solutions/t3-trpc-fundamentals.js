class TRPCError extends Error {
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

const PROCEDURE = Symbol("procedure");

/**
 * Returns an immutable procedure builder with `use(middleware)`, `input(parser)`,
 * `query(resolver)` and `mutation(resolver)`.
 */
function createBuilder() {
  const make = (steps) =>
    Object.freeze({
      use: (fn) => make([...steps, { kind: "middleware", fn }]),
      input: (parser) => make([...steps, { kind: "input", parser }]),
      query: (resolver) => Object.freeze({ [PROCEDURE]: true, type: "query", steps, resolver }),
      mutation: (resolver) => Object.freeze({ [PROCEDURE]: true, type: "mutation", steps, resolver }),
    });
  return make([]);
}

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isResult = (value) => value !== null && typeof value === "object" && typeof value.ok === "boolean";

function findProcedure(router, path) {
  let node = router;
  for (const segment of String(path).split(".")) {
    if (node === null || typeof node !== "object" || !Object.prototype.hasOwnProperty.call(node, segment)) return null;
    node = node[segment];
  }
  return node && node[PROCEDURE] === true ? node : null;
}

function formatError(error, path) {
  const known = error instanceof TRPCError;
  const code = known ? error.code : "INTERNAL_SERVER_ERROR";
  const shaped = {
    code,
    httpStatus: HTTP_STATUS[code] ?? 500,
    message: known ? error.message : "Internal server error",
    path,
  };
  if (known && error.fieldErrors) shaped.fieldErrors = error.fieldErrors;
  return shaped;
}

/**
 * @param {object} router nested plain objects whose leaves are procedures
 * @param {{ path: string, type: "query" | "mutation", input?: unknown }} call
 * @param {object} ctx
 * @returns {Promise<{ ok: true, data: unknown } | { ok: false, error: object }>}
 */
async function callProcedure(router, call, ctx) {
  const { path, type } = call;
  const fail = (error) => ({ ok: false, error: formatError(error, path) });
  const procedure = findProcedure(router, path);
  if (!procedure) return fail(new TRPCError({ code: "NOT_FOUND", message: `No procedure found on path "${path}"` }));
  if (procedure.type !== type) {
    return fail(new TRPCError({ code: "METHOD_NOT_SUPPORTED", message: `"${path}" is a ${procedure.type}, not a ${type}` }));
  }

  // Never rejects: a thrown error becomes { ok: false, error }, as in tRPC.
  const run = async (index, currentCtx, input) => {
    try {
      const step = procedure.steps[index];
      if (!step) return { ok: true, data: await procedure.resolver({ ctx: currentCtx, input, path, type }) };
      if (step.kind === "input") {
        const parsed = step.parser(call.input);
        if (!parsed.success) {
          const error = new TRPCError({ code: "BAD_REQUEST", message: "Invalid input" });
          error.fieldErrors = parsed.fieldErrors;
          throw error;
        }
        const merged = isPlainObject(input) && isPlainObject(parsed.data) ? { ...input, ...parsed.data } : parsed.data;
        return await run(index + 1, currentCtx, merged);
      }
      return await step.fn({
        ctx: currentCtx,
        input,
        path,
        type,
        next: (opts) => run(index + 1, opts && opts.ctx ? { ...currentCtx, ...opts.ctx } : currentCtx, input),
      });
    } catch (error) {
      return { ok: false, error };
    }
  };

  const result = await run(0, ctx, undefined);
  if (!isResult(result)) {
    return fail(
      new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No result from middlewares - did you forget to return next()?" }),
    );
  }
  return result.ok ? { ok: true, data: result.data } : fail(result.error);
}

/** Runs the calls one after another and returns { status, results }. */
async function handleBatch(router, calls, ctx) {
  const results = [];
  for (const call of calls) results.push(await callProcedure(router, call, ctx));
  const statuses = new Set(results.map((result) => (result.ok ? 200 : result.error.httpStatus)));
  const status = statuses.size === 0 ? 200 : statuses.size === 1 ? [...statuses][0] : 207;
  return { status, results };
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
    log.push(`${type} ${path}`);
    const result = await next();
    log.push(`done ${path}`);
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
        if (!post) throw new TRPCError({ code: "NOT_FOUND", message: `Post ${input.id} not found` });
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
          if (!post) throw new TRPCError({ code: "NOT_FOUND", message: `Post ${input.id} not found` });
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
