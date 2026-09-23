function isEmptyValue(value) {
  return (
    value === null ||
    value === undefined ||
    ((typeof value === "string" || Array.isArray(value)) && value.length === 0)
  );
}

function anchorPattern(pattern) {
  let source = "";
  if (pattern.charAt(0) !== "^") source += "^";
  source += pattern;
  if (pattern.charAt(pattern.length - 1) !== "$") source += "$";
  return source;
}

function runFieldValidator(spec, value) {
  switch (spec.kind) {
    case "required":
      return isEmptyValue(value) ? { required: true } : null;
    case "minLength": {
      if (isEmptyValue(value) || typeof value.length !== "number") return null;
      return value.length < spec.length
        ? { minlength: { requiredLength: spec.length, actualLength: value.length } }
        : null;
    }
    case "maxLength": {
      if (value === null || value === undefined || typeof value.length !== "number") return null;
      return value.length > spec.length
        ? { maxlength: { requiredLength: spec.length, actualLength: value.length } }
        : null;
    }
    case "min": {
      if (isEmptyValue(value)) return null;
      const actual = Number(value);
      if (Number.isNaN(actual)) return null;
      return actual < spec.value ? { min: { min: spec.value, actual } } : null;
    }
    case "max": {
      if (isEmptyValue(value)) return null;
      const actual = Number(value);
      if (Number.isNaN(actual)) return null;
      return actual > spec.value ? { max: { max: spec.value, actual } } : null;
    }
    case "pattern": {
      if (isEmptyValue(value)) return null;
      const requiredPattern = anchorPattern(spec.pattern);
      return new RegExp(requiredPattern).test(String(value))
        ? null
        : { pattern: { requiredPattern, actualValue: value } };
    }
    default:
      return null;
  }
}

function runGroupValidator(spec, value) {
  const names = spec.fields.filter((name) => Object.prototype.hasOwnProperty.call(value, name));
  switch (spec.kind) {
    case "matchFields": {
      if (names.length < 2) return null;
      const first = value[names[0]];
      return names.every((name) => value[name] === first)
        ? null
        : { fieldsMismatch: { fields: spec.fields } };
    }
    case "atLeastOne": {
      return names.some((name) => !isEmptyValue(value[name]))
        ? null
        : { atLeastOne: { fields: spec.fields } };
    }
    default:
      return null;
  }
}

function mergeErrors(list, run) {
  let errors = null;
  for (const spec of list) {
    const result = run(spec);
    if (result) errors = Object.assign(errors || {}, result);
  }
  return errors;
}

/**
 * @param {object} schema
 * @param {object} value
 */
function validateForm(schema, value) {
  const fields = schema.fields || {};
  const names = Object.keys(fields);
  const rawValue = {};
  const enabledValue = {};
  const fieldErrors = {};
  let enabledCount = 0;
  let hasFieldErrors = false;

  for (const name of names) {
    const field = fields[name] || {};
    const current = Object.prototype.hasOwnProperty.call(value, name) ? value[name] : null;
    rawValue[name] = current;
    if (field.disabled) continue;
    enabledCount++;
    enabledValue[name] = current;
    const errors = mergeErrors(field.validators || [], (spec) => runFieldValidator(spec, current));
    if (errors) {
      fieldErrors[name] = errors;
      hasFieldErrors = true;
    }
  }

  const errors = mergeErrors(schema.validators || [], (spec) => runGroupValidator(spec, enabledValue));
  let status;
  if (names.length > 0 && enabledCount === 0) status = "DISABLED";
  else if (hasFieldErrors || errors) status = "INVALID";
  else status = "VALID";

  return { status, value: enabledValue, rawValue, errors, fieldErrors };
}
