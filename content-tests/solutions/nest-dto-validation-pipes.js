/**
 * A ValidationPipe-style validator.
 * @param {Record<string, { type: "string" | "number" | "boolean", rules: string[] }>} dto
 * @param {Record<string, unknown>} payload
 * @param {{ whitelist?: boolean, forbidNonWhitelisted?: boolean, transform?: boolean }} [options]
 */
function validatePayload(dto, payload, options = {}) {
  const messages = [];
  const value = {};

  for (const key of Object.keys(payload)) {
    const declared = Object.prototype.hasOwnProperty.call(dto, key);
    if (!declared && options.whitelist) {
      if (options.forbidNonWhitelisted) messages.push("property " + key + " should not exist");
      continue; // stripped
    }
    value[key] = declared && options.transform ? convert(payload[key], dto[key].type) : payload[key];
  }

  for (const [prop, spec] of Object.entries(dto)) {
    const v = value[prop];
    if (spec.rules.includes("isOptional") && (v === null || v === undefined)) continue;
    for (const rule of spec.rules) {
      if (rule === "isOptional") continue;
      const message = check(prop, rule, v);
      if (message) messages.push(message);
    }
  }

  if (messages.length) return { valid: false, error: { statusCode: 400, message: messages, error: "Bad Request" } };
  return { valid: true, value };
}

function convert(v, type) {
  if (v === null || v === undefined) return v;
  if (type === "number") return Number(v);
  if (type === "boolean") return Boolean(v);
  return String(v);
}

function check(prop, rule, v) {
  const [name, arg] = rule.split(":");
  const n = Number(arg);
  switch (name) {
    case "isString":
      return typeof v === "string" ? null : prop + " must be a string";
    case "isInt":
      return typeof v === "number" && Number.isInteger(v) ? null : prop + " must be an integer number";
    case "isNumber":
      return typeof v === "number" && Number.isFinite(v)
        ? null
        : prop + " must be a number conforming to the specified constraints";
    case "isBoolean":
      return typeof v === "boolean" ? null : prop + " must be a boolean value";
    case "isNotEmpty":
      return v !== "" && v !== null && v !== undefined ? null : prop + " should not be empty";
    case "min":
      return typeof v === "number" && v >= n ? null : prop + " must not be less than " + arg;
    case "max":
      return typeof v === "number" && v <= n ? null : prop + " must not be greater than " + arg;
    case "minLength":
      return typeof v === "string" && v.length >= n ? null : prop + " must be longer than or equal to " + arg + " characters";
    case "maxLength":
      return typeof v === "string" && v.length <= n ? null : prop + " must be shorter than or equal to " + arg + " characters";
    case "isIn": {
      const allowed = arg.split(",");
      return allowed.includes(v) ? null : prop + " must be one of the following values: " + allowed.join(", ");
    }
    default:
      throw new Error("Unknown rule: " + rule);
  }
}
