/**
 * @param {Record<string, { type: "string" | "int" | "boolean" | "url" | "enum", optional?: boolean, default?: unknown,
 *   secret?: boolean, client?: boolean, min?: number, max?: number, minLength?: number, values?: string[], protocols?: string[] }>} schema
 * @param {Record<string, string | undefined>} env
 * @param {{ clientPrefix: string }} options
 * @returns {{ ok: true, env: object, client: object, redacted: object } | { ok: false, errors: string[] }}
 */
function parseEnv(schema, env, options) {
  const prefix = options.clientPrefix;
  const errors = [];
  const values = {};

  for (const [name, spec] of Object.entries(schema)) {
    const fail = (message, raw) => {
      errors.push(`${name}: ${message}${raw !== undefined && !spec.secret ? `, got ${JSON.stringify(raw)}` : ""}`);
    };
    if (spec.secret && spec.client) {
      fail("secrets can't be client variables");
      continue;
    }
    if (spec.client && !name.startsWith(prefix)) {
      fail(`client variables must start with ${prefix}`);
      continue;
    }
    if (!spec.client && name.startsWith(prefix)) {
      fail(`server variables can't start with ${prefix}`);
      continue;
    }

    const raw = typeof env[name] === "string" ? env[name].trim() : "";
    if (raw === "") {
      if (spec.default !== undefined) values[name] = spec.default;
      else if (!spec.optional) fail("is required");
      continue;
    }

    switch (spec.type) {
      case "string":
        if (spec.minLength !== undefined && raw.length < spec.minLength) fail(`must be at least ${spec.minLength} characters`);
        else values[name] = raw;
        break;
      case "int": {
        if (!/^-?\d+$/.test(raw)) {
          fail("expected an integer", raw);
          break;
        }
        const n = Number(raw);
        if (spec.min !== undefined && n < spec.min) fail(`must be at least ${spec.min}`);
        else if (spec.max !== undefined && n > spec.max) fail(`must be at most ${spec.max}`);
        else values[name] = n;
        break;
      }
      case "boolean": {
        const lower = raw.toLowerCase();
        if (lower === "true" || lower === "1") values[name] = true;
        else if (lower === "false" || lower === "0") values[name] = false;
        else fail("expected true, false, 1 or 0", raw);
        break;
      }
      case "url": {
        let url;
        try {
          url = new URL(raw);
        } catch {
          fail("expected a URL", raw);
          break;
        }
        const protocols = spec.protocols ?? ["http:", "https:"];
        if (!protocols.includes(url.protocol)) fail(`expected protocol ${protocols.join(" or ")}`, raw);
        else values[name] = raw;
        break;
      }
      case "enum":
        if (!spec.values.includes(raw)) fail(`expected one of ${spec.values.join(", ")}`, raw);
        else values[name] = raw;
        break;
    }
  }

  const undeclared = Object.keys(env)
    .filter((name) => name.startsWith(prefix) && !Object.prototype.hasOwnProperty.call(schema, name))
    .sort();
  for (const name of undeclared) errors.push(`${name}: not declared in the schema`);

  if (errors.length > 0) return { ok: false, errors };

  const client = {};
  const redacted = {};
  for (const [name, value] of Object.entries(values)) {
    if (schema[name].client) client[name] = value;
    redacted[name] = schema[name].secret ? "[redacted]" : value;
  }
  return { ok: true, env: values, client, redacted };
}
