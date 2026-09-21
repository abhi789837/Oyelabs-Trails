const FIELDS = ["email", "password", "confirm", "age"];

function createInitialState() {
  return {
    values: { email: "", password: "", confirm: "", age: "" },
    touched: { email: false, password: false, confirm: false, age: false },
    serverErrors: {},
    submitCount: 0,
    status: "editing", // "editing" | "submitting" | "submitted"
  };
}

/**
 * @param {{ email: string, password: string, confirm: string, age: string }} values
 * @returns {Record<string, string>} a message for each invalid field only
 */
function validate(values) {
  const errors = {};
  const email = values.email.trim();
  if (email === "") errors.email = "Required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Invalid email";

  // Passwords are not trimmed: spaces are valid characters.
  if (values.password === "") errors.password = "Required";
  else if (values.password.length < 8) errors.password = "At least 8 characters";

  if (values.confirm !== values.password) errors.confirm = "Passwords do not match";

  const age = values.age.trim();
  if (age !== "") {
    if (!/^\d+$/.test(age)) errors.age = "Whole number only";
    else if (Number(age) < 13 || Number(age) > 120) errors.age = "Must be between 13 and 120";
  }
  return errors;
}

function formReducer(state, action) {
  switch (action.type) {
    case "change": {
      const { field } = action;
      if (!FIELDS.includes(field) || state.status === "submitting") return state;
      const value = String(action.value);
      if (state.values[field] === value) return state;
      const { [field]: _cleared, ...serverErrors } = state.serverErrors;
      return {
        ...state,
        values: { ...state.values, [field]: value },
        serverErrors,
        status: state.status === "submitted" ? "editing" : state.status,
      };
    }
    case "blur": {
      const { field } = action;
      if (!FIELDS.includes(field) || state.status === "submitting" || state.touched[field]) return state;
      return { ...state, touched: { ...state.touched, [field]: true } };
    }
    case "submit": {
      if (state.status === "submitting") return state;
      const valid = Object.keys(validate(state.values)).length === 0;
      return {
        ...state,
        touched: Object.fromEntries(FIELDS.map((field) => [field, true])),
        serverErrors: {},
        submitCount: state.submitCount + 1,
        status: valid ? "submitting" : "editing",
      };
    }
    case "submitSuccess":
      if (state.status !== "submitting") return state;
      return { ...createInitialState(), status: "submitted" };
    case "submitFailure":
      if (state.status !== "submitting") return state;
      return { ...state, status: "editing", serverErrors: { ...action.errors } };
    default:
      return state;
  }
}

function selectVisibleErrors(state) {
  // Derived on every call: errors can never go stale relative to the values.
  const errors = validate(state.values);
  const visible = {};
  for (const field of FIELDS) {
    if (!state.touched[field]) continue;
    const message = errors[field] ?? state.serverErrors[field];
    if (message) visible[field] = message;
  }
  return visible;
}

// ---- Test driver (leave as is) ----
function runForm(actions) {
  let state = deepFreeze(createInitialState());
  let renders = 0;
  for (const action of actions) {
    const next = formReducer(state, action);
    if (next !== state) renders++;
    state = deepFreeze(next);
  }
  return {
    values: state.values,
    status: state.status,
    submitCount: state.submitCount,
    errors: selectVisibleErrors(state),
    renders,
  };
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
