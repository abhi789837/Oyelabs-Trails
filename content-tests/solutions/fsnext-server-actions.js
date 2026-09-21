/** An error the handler throws on purpose. Its code and message are safe to show the user. */
class ActionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ActionError";
    this.code = code;
  }
}

/**
 * Wrap a Server Action body so every call is authenticated, authorized and validated, and
 * always resolves to a serializable result instead of throwing across the network.
 *
 * @param {{
 *   getSession: () => Promise<null | { userId: string, role: string }>,
 *   roles?: string[],
 *   schema: Record<string, { type: "string" | "number" | "enum", required?: boolean, min?: number, max?: number, int?: boolean, values?: string[] }>,
 *   log: (err: unknown) => void,
 * }} config
 * @param {(data: object, ctx: { userId: string, role: string }) => Promise<unknown>} handler
 * @returns {(input: object) => Promise<object>}
 */
function createAction(config, handler) {
  const { getSession, roles, schema, log } = config;
  return async function action(input) {
    try {
      const session = await getSession();
      if (!session) return { ok: false, error: { code: "UNAUTHENTICATED" } };
      if (roles && !roles.includes(session.role)) return { ok: false, error: { code: "FORBIDDEN" } };
      const { data, fieldErrors } = validateInput(schema, input ?? {});
      if (fieldErrors) return { ok: false, error: { code: "VALIDATION", fieldErrors } };
      const result = await handler(data, { userId: session.userId, role: session.role });
      return { ok: true, data: result === undefined ? null : result };
    } catch (err) {
      // redirect() and notFound() throw control-flow errors that Next.js must see.
      if (err !== null && typeof err === "object" && typeof err.digest === "string" && err.digest.startsWith("NEXT_")) throw err;
      if (err instanceof ActionError) return { ok: false, error: { code: err.code, message: err.message } };
      log(err);
      return { ok: false, error: { code: "INTERNAL", message: "Something went wrong" } };
    }
  };
}

function validateInput(schema, input) {
  const data = {};
  const fieldErrors = {};
  for (const [field, rule] of Object.entries(schema)) {
    let value = input[field];
    if (typeof value === "string") value = value.trim();
    if (value === undefined || value === null || value === "") {
      if (rule.required) fieldErrors[field] = "Required";
      continue;
    }
    const message = checkField(rule, value);
    if (message) fieldErrors[field] = message;
    else data[field] = rule.type === "number" ? Number(value) : value;
  }
  return Object.keys(fieldErrors).length > 0 ? { fieldErrors } : { data };
}

function checkField(rule, value) {
  if (rule.type === "string") {
    if (typeof value !== "string") return "Expected string";
    if (rule.min !== undefined && value.length < rule.min) return "Must be at least " + rule.min + " characters";
    if (rule.max !== undefined && value.length > rule.max) return "Must be at most " + rule.max + " characters";
    return null;
  }
  if (rule.type === "number") {
    const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
    if (!Number.isFinite(n)) return "Expected number";
    if (rule.int && !Number.isInteger(n)) return "Must be an integer";
    if (rule.min !== undefined && n < rule.min) return "Must be at least " + rule.min;
    if (rule.max !== undefined && n > rule.max) return "Must be at most " + rule.max;
    return null;
  }
  if (rule.type === "enum") {
    return rule.values.includes(value) ? null : "Must be one of: " + rule.values.join(", ");
  }
  return "Unknown rule type";
}

// ---- Test driver (leave as is) ----
// Builds a Server Action with createAction, calls it once and reports what happened.
// behavior: "echo" returns what the handler received, "void" returns nothing, "notFound" throws
// an ActionError, "crash" throws an Error with internals in its message, "throwString" throws a
// string, "redirect" throws what Next.js's redirect() throws.
async function runActionScenario({ session, roles, schema, input, behavior }) {
  const logged = [];
  let handlerCalls = 0;
  const handler = async (data, ctx) => {
    handlerCalls++;
    if (behavior === "echo") return { saved: data, by: ctx.userId };
    if (behavior === "void") return undefined;
    if (behavior === "notFound") throw new ActionError("NOT_FOUND", "Post not found");
    if (behavior === "crash") throw new Error("connect ECONNREFUSED 10.0.0.12:5432 user=app password=hunter2");
    if (behavior === "throwString") throw "boom";
    if (behavior === "redirect") throw Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;push;/posts/42;303;" });
    return null;
  };
  const action = createAction(
    {
      getSession: async () => session,
      roles,
      schema,
      log: (err) => logged.push(err instanceof Error ? err.message : String(err)),
    },
    handler,
  );
  try {
    const result = await action(input);
    return { result, handlerCalls, logged };
  } catch (err) {
    return { rethrown: err && err.digest ? err.digest : String(err), handlerCalls, logged };
  }
}
