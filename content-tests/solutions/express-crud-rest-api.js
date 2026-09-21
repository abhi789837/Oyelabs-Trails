/**
 * @returns {(req: { method: string, path: string, headers: Record<string, string>, body?: unknown }) =>
 *   { status: number, headers?: Record<string, string>, body?: unknown }}
 */
function createTodoApi() {
  const todos = new Map(); // id -> { id, title, done, version }
  let nextId = 1;

  const etagOf = (todo) => `"${todo.version}"`;
  const view = (todo) => ({ id: todo.id, title: todo.title, done: todo.done });
  const json = (status, body, headers = {}) => ({ status, headers, body });
  const isPlainObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
  const tags = (header) => header.split(",").map((t) => t.trim()).filter(Boolean);

  function ifMatchPasses(header, todo) {
    if (header.trim() === "*") return true;
    // Strong comparison: weak tags never match.
    return tags(header).some((t) => !t.startsWith("W/") && t === etagOf(todo));
  }
  function ifNoneMatchHits(header, todo) {
    if (header.trim() === "*") return true;
    // Weak comparison: ignore a W/ prefix on either side.
    const strip = (t) => (t.startsWith("W/") ? t.slice(2) : t);
    return tags(header).some((t) => strip(t) === strip(etagOf(todo)));
  }

  function validate(body, mode) {
    const details = [];
    const has = (k) => Object.prototype.hasOwnProperty.call(body, k);
    if (mode === "patch" && Object.keys(body).length === 0) return ["at least one field is required"];
    if (mode !== "patch" || has("title")) {
      if (typeof body.title !== "string" || body.title.trim() === "") details.push("title must be a non-empty string");
      else if (body.title.trim().length > 100) details.push("title must be at most 100 characters");
    }
    if (mode === "put" || has("done")) {
      if (typeof body.done !== "boolean") details.push("done must be a boolean");
    }
    for (const key of Object.keys(body)) {
      if (key !== "title" && key !== "done") details.push(`${key} is not allowed`);
    }
    return details;
  }

  function titleTaken(title, exceptId) {
    const needle = title.trim().toLowerCase();
    for (const t of todos.values()) if (t.id !== exceptId && t.title.toLowerCase() === needle) return true;
    return false;
  }

  return function handle(req) {
    const { method, path, headers = {}, body } = req;
    if (path === "/todos") {
      if (method === "GET") return json(200, [...todos.values()].sort((a, b) => a.id - b.id).map(view));
      if (method === "POST") {
        if (!isPlainObject(body)) return json(400, { error: "Body must be a JSON object" });
        const details = validate(body, "post");
        if (details.length) return json(422, { error: "Validation failed", details });
        if (titleTaken(body.title)) return json(409, { error: "Title already exists" });
        const todo = { id: nextId++, title: body.title.trim(), done: body.done ?? false, version: 1 };
        todos.set(todo.id, todo);
        return json(201, view(todo), { location: `/todos/${todo.id}`, etag: etagOf(todo) });
      }
      return json(405, { error: "Method Not Allowed" }, { allow: "GET, POST" });
    }

    const m = /^\/todos\/([1-9]\d*)$/.exec(path);
    if (!m) return json(404, { error: "Not Found" });
    if (!["GET", "PUT", "PATCH", "DELETE"].includes(method)) {
      return json(405, { error: "Method Not Allowed" }, { allow: "GET, PUT, PATCH, DELETE" });
    }
    const todo = todos.get(Number(m[1]));
    if (!todo) return json(404, { error: "Not Found" });

    if (method === "GET") {
      const inm = headers["if-none-match"];
      if (inm !== undefined && ifNoneMatchHits(inm, todo)) return { status: 304, headers: { etag: etagOf(todo) } };
      return json(200, view(todo), { etag: etagOf(todo) });
    }

    const ifMatch = headers["if-match"];
    if (method === "DELETE") {
      if (ifMatch !== undefined && !ifMatchPasses(ifMatch, todo)) return json(412, { error: "Precondition Failed" });
      todos.delete(todo.id);
      return { status: 204, headers: {} };
    }

    // PUT / PATCH
    if (ifMatch === undefined) return json(428, { error: "Precondition Required" });
    if (!ifMatchPasses(ifMatch, todo)) return json(412, { error: "Precondition Failed" });
    if (!isPlainObject(body)) return json(400, { error: "Body must be a JSON object" });
    const details = validate(body, method === "PUT" ? "put" : "patch");
    if (details.length) return json(422, { error: "Validation failed", details });
    const nextTitle = method === "PUT" || Object.prototype.hasOwnProperty.call(body, "title") ? body.title.trim() : todo.title;
    if (titleTaken(nextTitle, todo.id)) return json(409, { error: "Title already exists" });
    todo.title = nextTitle;
    if (method === "PUT" || Object.prototype.hasOwnProperty.call(body, "done")) todo.done = body.done;
    todo.version += 1;
    return json(200, view(todo), { etag: etagOf(todo) });
  };
}

// ---- Test driver (leave as is) ----
function runRequests(requests) {
  const handle = createTodoApi();
  return requests.map((r) => {
    const res = handle({ method: r.method, path: r.path, headers: { ...(r.headers || {}) }, body: r.body }) || {};
    const headers = {};
    for (const [k, v] of Object.entries(res.headers || {})) headers[k.toLowerCase()] = String(v);
    return { status: res.status, headers, body: res.body === undefined ? null : res.body };
  });
}
