/**
 * @param {Record<string, { rules: object[], deps?: string[] }>} schema
 * @param {"onSubmit" | "onBlur" | "onChange" | "onTouched" | "all"} mode
 * @param {object} defaultValues
 */
function createForm(schema, mode, defaultValues) {
  const values = JSON.parse(JSON.stringify(defaultValues || {}));
  const touched = new Set();
  let errors = {};
  let isSubmitted = false;

  const getPath = (obj, path) => path.split(".").reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
  const setPath = (obj, path, value) => {
    const keys = path.split(".");
    let cur = obj;
    keys.slice(0, -1).forEach((k) => {
      if (cur[k] == null || typeof cur[k] !== "object") cur[k] = {};
      cur = cur[k];
    });
    cur[keys[keys.length - 1]] = value;
  };
  const isEmpty = (v) =>
    v === undefined || v === null || v === false || (Array.isArray(v) && v.length === 0) || (typeof v === "string" && v.trim() === "");

  function validateField(name) {
    const v = getPath(values, name);
    for (const rule of (schema[name] && schema[name].rules) || []) {
      const other = rule.field !== undefined ? getPath(values, rule.field) : undefined;
      let failed = false;
      switch (rule.type) {
        case "required": failed = isEmpty(v); break;
        case "minLength": failed = !isEmpty(v) && String(v).length < rule.value; break;
        case "maxLength": failed = !isEmpty(v) && String(v).length > rule.value; break;
        case "pattern": failed = !isEmpty(v) && !new RegExp(rule.value).test(String(v)); break;
        case "min": failed = !isEmpty(v) && !(Number(v) >= rule.value); break;
        case "max": failed = !isEmpty(v) && !(Number(v) <= rule.value); break;
        case "sameAs": failed = v !== other; break;
        case "requiredIf": failed = other === rule.equals && isEmpty(v); break;
        case "after": failed = !isEmpty(v) && !isEmpty(other) && !(String(v) > String(other)); break;
      }
      if (failed) return rule.message;
    }
    return null;
  }

  function runValidation(name) {
    const names = [name].concat((schema[name] && schema[name].deps) || []);
    const next = { ...errors };
    for (const n of names) {
      const message = validateField(n);
      if (message) next[n] = message;
      else delete next[n];
    }
    errors = next;
  }

  function shouldValidate(isBlur, wasTouched) {
    if (mode === "all") return true;
    if (!isSubmitted && mode === "onTouched") return isBlur || wasTouched;
    if (isSubmitted) return !isBlur; // reValidateMode: "onChange"
    if (mode === "onBlur") return isBlur;
    if (mode === "onChange") return !isBlur;
    return false; // "onSubmit" before the first submit
  }

  return {
    change(name, value) {
      setPath(values, name, value);
      if (shouldValidate(false, touched.has(name))) runValidation(name);
    },
    blur(name) {
      const wasTouched = touched.has(name);
      touched.add(name);
      if (shouldValidate(true, wasTouched)) runValidation(name);
    },
    submit() {
      isSubmitted = true;
      const next = {};
      for (const name of Object.keys(schema)) {
        const message = validateField(name);
        if (message) next[name] = message;
      }
      errors = next;
      return Object.keys(errors).length === 0;
    },
    getErrors() {
      return { ...errors };
    },
  };
}

// ---- Test driver (leave as is) ----
// events: ["change", name, value] | ["blur", name] | ["submit"]
// Returns one snapshot per event: { errors } (plus { ok } for submits).
function runForm(schema, mode, defaultValues, events) {
  const form = createForm(schema, mode, defaultValues);
  return events.map(([type, name, value]) => {
    if (type === "change") form.change(name, value);
    else if (type === "blur") form.blur(name);
    else if (type === "submit") return { ok: form.submit(), errors: form.getErrors() };
    return { errors: form.getErrors() };
  });
}
