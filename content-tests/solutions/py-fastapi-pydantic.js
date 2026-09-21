/**
 * Validate `data` against a Pydantic-style field list.
 * @param {Array<{ name: string, type: "int" | "float" | "str" | "bool", default?: unknown, nullable?: boolean, strict?: boolean }>} fields
 * @param {unknown} data
 * @param {{ strict?: boolean, extra?: "ignore" | "forbid" | "allow" }} [config]
 * @returns {{ ok: true, value: object } | { ok: false, errors: { loc: string[], type: string }[] }}
 */
function validateModel(fields, data, config = {}) {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, errors: [{ loc: [], type: "model_type" }] };
  }
  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const errors = [];
  const value = {};

  for (const field of fields) {
    if (!has(data, field.name)) {
      if (has(field, "default")) value[field.name] = field.default; // defaults aren't validated
      else errors.push({ loc: [field.name], type: "missing" });
      continue;
    }
    const raw = data[field.name];
    if (raw === null && field.nullable) {
      value[field.name] = null;
      continue;
    }
    const strict = typeof field.strict === "boolean" ? field.strict : Boolean(config.strict);
    const result = (strict ? STRICT : LAX)[field.type](raw);
    if (result.error) errors.push({ loc: [field.name], type: result.error });
    else value[field.name] = result.value;
  }

  const names = new Set(fields.map((f) => f.name));
  for (const key of Object.keys(data)) {
    if (names.has(key)) continue;
    if (config.extra === "forbid") errors.push({ loc: [key], type: "extra_forbidden" });
    else if (config.extra === "allow") value[key] = data[key];
  }

  return errors.length ? { ok: false, errors } : { ok: true, value };
}

const ok = (value) => ({ value });
const fail = (error) => ({ error });
const INT_STRING = /^[+-]?\d+(_\d+)*(\.0+)?$/;
const FLOAT_STRING = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;
const TRUE_WORDS = ["true", "yes", "on", "1", "t", "y"];
const FALSE_WORDS = ["false", "no", "off", "0", "f", "n"];

const LAX = {
  int(v) {
    if (typeof v === "boolean") return ok(v ? 1 : 0);
    if (typeof v === "number") return Number.isInteger(v) ? ok(v) : fail("int_from_float");
    if (typeof v === "string") {
      const s = v.trim();
      if (!INT_STRING.test(s)) return fail("int_parsing");
      return ok(parseInt(s.split(".")[0].replace(/_/g, ""), 10));
    }
    return fail("int_type");
  },
  float(v) {
    if (typeof v === "boolean") return ok(v ? 1 : 0);
    if (typeof v === "number") return ok(v);
    if (typeof v === "string") {
      const s = v.trim();
      return FLOAT_STRING.test(s) ? ok(Number(s)) : fail("float_parsing");
    }
    return fail("float_type");
  },
  str(v) {
    return typeof v === "string" ? ok(v) : fail("string_type");
  },
  bool(v) {
    if (typeof v === "boolean") return ok(v);
    if (typeof v === "number") {
      if (v === 1) return ok(true);
      if (v === 0) return ok(false);
      return Number.isInteger(v) ? fail("bool_parsing") : fail("bool_type");
    }
    if (typeof v === "string") {
      const s = v.toLowerCase();
      if (TRUE_WORDS.includes(s)) return ok(true);
      if (FALSE_WORDS.includes(s)) return ok(false);
      return fail("bool_parsing");
    }
    return fail("bool_type");
  },
};

const STRICT = {
  int: (v) => (typeof v === "number" && Number.isInteger(v) ? ok(v) : fail("int_type")),
  float: (v) => (typeof v === "number" ? ok(v) : fail("float_type")),
  str: (v) => (typeof v === "string" ? ok(v) : fail("string_type")),
  bool: (v) => (typeof v === "boolean" ? ok(v) : fail("bool_type")),
};
