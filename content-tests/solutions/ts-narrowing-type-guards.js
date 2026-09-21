/**
 * @typedef {"string" | "number" | "boolean" | "null"
 *   | { arrayOf: Schema }
 *   | { object: Record<string, Schema>, optional?: string[] }
 *   | { oneOf: (string | number | boolean | null)[] }} Schema
 */

/**
 * Validates untrusted data (e.g. the result of JSON.parse) against a schema.
 * @param {unknown} value
 * @param {Schema} schema
 * @returns {string[]} error messages; empty when value matches
 */
function validate(value, schema) {
  const errors = [];
  check(value, schema, "$", errors);
  return errors;
}

function check(value, schema, path, errors) {
  if (typeof schema === "string") {
    const ok =
      schema === "null"
        ? value === null
        : schema === "number"
          ? typeof value === "number" && Number.isFinite(value)
          : typeof value === schema;
    if (!ok) errors.push(`${path}: expected ${schema}`);
    return;
  }
  if ("oneOf" in schema) {
    if (!schema.oneOf.some((literal) => literal === value)) {
      errors.push(`${path}: expected one of ${schema.oneOf.map((v) => JSON.stringify(v)).join(" | ")}`);
    }
    return;
  }
  if ("arrayOf" in schema) {
    if (!Array.isArray(value)) {
      errors.push(`${path}: expected array`);
      return;
    }
    value.forEach((item, i) => check(item, schema.arrayOf, `${path}[${i}]`, errors));
    return;
  }
  // typeof null === "object" and arrays are objects too: rule both out explicitly.
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    errors.push(`${path}: expected object`);
    return;
  }
  const optional = schema.optional ?? [];
  for (const key of Object.keys(schema.object)) {
    const childPath = `${path}.${key}`;
    // Own properties only: `key in value` would find inherited keys like `constructor`.
    if (!Object.hasOwn(value, key)) {
      if (!optional.includes(key)) errors.push(`${childPath}: is required`);
      continue;
    }
    check(value[key], schema.object[key], childPath, errors);
  }
}
