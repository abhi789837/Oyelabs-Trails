/** The in-memory database. Treat it as immutable; you may change its shape. */
function createState() {
  return { notes: [], nextId: 1, idempotency: {} };
}

const TAG = /^[a-z0-9-]{1,20}$/;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{1,64}$/;

const reply = (state, status, body) => ({ state, response: { status, body } });
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const toIso = (seconds) => new Date(seconds * 1000).toISOString();
const publicNote = (n) => ({
  id: n.id,
  title: n.title,
  body: n.body,
  tags: n.tags,
  version: n.version,
  createdAt: n.createdAt,
  updatedAt: n.updatedAt,
});

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
}

function authenticate(headers, config) {
  const match = /^bearer\s+(\S+)$/i.exec(headers.authorization ?? "");
  if (!match) return { error: "unauthorized" };
  const parts = match[1].split(".");
  if (parts.length !== 3) return { error: "invalid_token" };
  let header;
  let claims;
  try {
    header = JSON.parse(base64UrlDecode(parts[0]));
    claims = JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return { error: "invalid_token" };
  }
  if (!isPlainObject(header) || !isPlainObject(claims)) return { error: "invalid_token" };
  if (header.alg !== "HS256") return { error: "invalid_token" };
  if (parts[2] !== sign(`${parts[0]}.${parts[1]}`, config.secret)) return { error: "invalid_token" };
  const { now, leewaySeconds: leeway } = config;
  const audOk = Array.isArray(claims.aud) ? claims.aud.includes(config.audience) : claims.aud === config.audience;
  if (claims.iss !== config.issuer || !audOk) return { error: "invalid_token" };
  if (typeof claims.sub !== "string" || claims.sub === "") return { error: "invalid_token" };
  if (typeof claims.exp !== "number" || now >= claims.exp + leeway) return { error: "invalid_token" };
  if (claims.nbf !== undefined && (typeof claims.nbf !== "number" || now + leeway < claims.nbf)) return { error: "invalid_token" };
  const scopes = typeof claims.scope === "string" ? claims.scope.split(" ").filter(Boolean) : [];
  return { sub: claims.sub, scopes };
}

/** Validates note fields; `partial` is true for PATCH. Returns { fieldErrors, formErrors, values }. */
function validateNote(body, partial) {
  const allowed = partial ? ["version", "title", "body", "tags"] : ["title", "body", "tags"];
  const fieldErrors = {};
  const formErrors = [];
  const values = {};
  for (const key of Object.keys(body)) if (!allowed.includes(key)) fieldErrors[key] = ["Unknown field"];

  if (partial) {
    if (body.version === undefined) fieldErrors.version = ["Required"];
    else if (!Number.isInteger(body.version) || body.version < 1) fieldErrors.version = ["Must be a positive integer"];
  }
  if (body.title === undefined) {
    if (!partial) fieldErrors.title = ["Required"];
  } else if (typeof body.title !== "string") fieldErrors.title = ["Must be a string"];
  else if (body.title.trim() === "") fieldErrors.title = ["Must not be empty"];
  else if (body.title.trim().length > 100) fieldErrors.title = ["Must be at most 100 characters"];
  else values.title = body.title.trim();

  if (body.body !== undefined) {
    if (typeof body.body !== "string") fieldErrors.body = ["Must be a string"];
    else if (body.body.length > 10000) fieldErrors.body = ["Must be at most 10000 characters"];
    else values.body = body.body;
  }
  if (body.tags !== undefined) {
    const ok =
      Array.isArray(body.tags) &&
      body.tags.length <= 5 &&
      body.tags.every((t) => typeof t === "string" && TAG.test(t)) &&
      new Set(body.tags).size === body.tags.length;
    if (ok) values.tags = [...body.tags];
    else fieldErrors.tags = ["Must be up to 5 unique lowercase tags"];
  }
  if (partial && body.title === undefined && body.body === undefined && body.tags === undefined) {
    formErrors.push("Provide at least one of title, body, tags");
  }
  return { fieldErrors, formErrors, values };
}

/**
 * @param {{ notes: object[], nextId: number, idempotency: object }} state
 * @param {{ method: string, path: string, headers: Record<string, string>, body?: unknown }} request
 * @param {{ issuer: string, audience: string, secret: string, leewaySeconds: number, now: number }} config
 * @returns {{ state: object, response: { status: number, body: unknown } }}
 */
function handleRequest(state, request, config) {
  const { method, headers } = request;
  const [pathname, query = ""] = request.path.split("?");
  const segments = pathname.split("/");
  const isCollection = pathname === "/notes";
  const isItem = segments.length === 3 && segments[0] === "" && segments[1] === "notes" && segments[2] !== "";
  if (!isCollection && !isItem) return reply(state, 404, { error: "not_found" });
  const allow = isCollection ? ["GET", "POST"] : ["GET", "PATCH", "DELETE"];
  if (!allow.includes(method)) return reply(state, 405, { error: "method_not_allowed", allow });

  const auth = authenticate(headers, config);
  if (auth.error) return reply(state, 401, { error: auth.error });
  const needed = method === "GET" ? "notes:read" : "notes:write";
  if (!auth.scopes.includes(needed)) return reply(state, 403, { error: "insufficient_scope" });

  if (isCollection && method === "GET") {
    const params = new URLSearchParams(query);
    const fieldErrors = {};
    let limit = 20;
    if (params.has("limit")) {
      const raw = params.get("limit");
      limit = /^\d+$/.test(raw) ? Number(raw) : NaN;
      if (!(limit >= 1 && limit <= 100)) fieldErrors.limit = ["Must be an integer from 1 to 100"];
    }
    let before = Infinity;
    if (params.has("cursor")) {
      const m = /^c_([1-9]\d*)$/.exec(params.get("cursor"));
      if (m) before = Number(m[1]);
      else fieldErrors.cursor = ["Invalid cursor"];
    }
    if (Object.keys(fieldErrors).length > 0) {
      return reply(state, 422, { error: "validation_failed", fieldErrors, formErrors: [] });
    }
    const mine = state.notes.filter((n) => n.ownerId === auth.sub && n.id < before).sort((a, b) => b.id - a.id);
    const page = mine.slice(0, limit);
    const nextCursor = mine.length > limit ? `c_${page[page.length - 1].id}` : null;
    return reply(state, 200, { items: page.map(publicNote), nextCursor });
  }

  if (isCollection && method === "POST") {
    const body = request.body;
    if (!isPlainObject(body)) return reply(state, 400, { error: "invalid_body" });
    const key = headers["idempotency-key"];
    const slot = key === undefined ? null : `${auth.sub} ${key}`;
    if (key !== undefined) {
      if (typeof key !== "string" || !IDEMPOTENCY_KEY.test(key)) return reply(state, 400, { error: "invalid_idempotency_key" });
      const stored = state.idempotency[slot];
      if (stored) {
        if (deepEqual(stored.body, body)) return { state, response: stored.response };
        return reply(state, 422, { error: "idempotency_key_reused" });
      }
    }
    const { fieldErrors, values } = validateNote(body, false);
    if (Object.keys(fieldErrors).length > 0) return reply(state, 422, { error: "validation_failed", fieldErrors, formErrors: [] });
    const at = toIso(config.now);
    const note = { id: state.nextId, ownerId: auth.sub, title: values.title, body: values.body ?? "", tags: values.tags ?? [], version: 1, createdAt: at, updatedAt: at };
    const response = { status: 201, body: { note: publicNote(note) } };
    const idempotency = slot ? { ...state.idempotency, [slot]: { body, response } } : state.idempotency;
    return { state: { notes: [...state.notes, note], nextId: state.nextId + 1, idempotency }, response };
  }

  // /notes/:id — missing, malformed and other people's notes all look the same.
  const id = /^[1-9]\d*$/.test(segments[2]) ? Number(segments[2]) : null;
  const note = state.notes.find((n) => n.id === id && n.ownerId === auth.sub);
  if (!note) return reply(state, 404, { error: "not_found" });

  if (method === "GET") return reply(state, 200, { note: publicNote(note) });

  if (method === "DELETE") {
    return reply({ ...state, notes: state.notes.filter((n) => n !== note) }, 204, null);
  }

  // PATCH
  const body = request.body;
  if (!isPlainObject(body)) return reply(state, 400, { error: "invalid_body" });
  const { fieldErrors, formErrors, values } = validateNote(body, true);
  if (Object.keys(fieldErrors).length > 0 || formErrors.length > 0) {
    return reply(state, 422, { error: "validation_failed", fieldErrors, formErrors });
  }
  if (body.version !== note.version) return reply(state, 409, { error: "version_conflict", currentVersion: note.version });
  const updated = { ...note, ...values, version: note.version + 1, updatedAt: toIso(config.now) };
  return reply({ ...state, notes: state.notes.map((n) => (n === note ? updated : n)) }, 200, { note: publicNote(updated) });
}

// ---- Test driver and helpers (leave as is; you may call base64UrlDecode and sign) ----
function runNotesApi(scenario) {
  const config = { ...scenario.config };
  const tokens = {};
  for (const [name, spec] of Object.entries(scenario.tokens || {})) tokens[name] = mintToken(spec, config);
  let state = deepFreeze(createState());
  const responses = [];
  for (const req of scenario.requests) {
    const headers = { ...(req.headers || {}) };
    if (req.as) headers.authorization = `Bearer ${tokens[req.as]}`;
    const request = deepFreeze({ method: req.method, path: req.path, headers, body: structuredClone(req.body) });
    const result = handleRequest(state, request, { ...config, now: req.now ?? config.now });
    state = deepFreeze(result.state);
    responses.push(JSON.parse(JSON.stringify(result.response)));
  }
  return responses;
}

// Builds a JWT-shaped token. `sign` stands in for HMAC-SHA256 so the tests stay synchronous.
function mintToken(spec, config) {
  if (spec.raw !== undefined) return spec.raw;
  const claims = {
    iss: config.issuer,
    aud: config.audience,
    exp: config.now + 3600,
    scope: "notes:read notes:write",
    ...spec.claims,
  };
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT", ...spec.header }));
  const payload = base64UrlEncode(JSON.stringify(claims));
  const signature = spec.signature ?? sign(`${header}.${payload}`, config.secret);
  // A tampered token keeps the original signature but carries different claims.
  const sentPayload = spec.tamper ? base64UrlEncode(JSON.stringify({ ...claims, ...spec.tamper })) : payload;
  return `${header}.${sentPayload}.${signature}`;
}

function sign(data, secret) {
  let h = 0x811c9dc5;
  const input = `${secret}:${data}`;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function base64UrlEncode(text) {
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decodes base64url to a string; throws on anything that isn't base64url. */
function base64UrlDecode(input) {
  if (typeof input !== "string" || !/^[A-Za-z0-9_-]*$/.test(input)) throw new Error("invalid base64url");
  return atob(input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4));
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
