/**
 * Shallow equality with React's semantics (the default comparison React.memo uses).
 * @param {any} a
 * @param {any} b
 * @returns {boolean}
 */
function shallowEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key) || !Object.is(a[key], b[key])) return false;
  }
  return true;
}

/**
 * A miniature React.memo for plain render functions.
 * @param {(props: object) => any} component
 * @param {(prevProps: object, nextProps: object) => boolean} [arePropsEqual]
 * @returns {(props: object) => any}
 */
function memo(component, arePropsEqual = shallowEqual) {
  let hasRendered = false;
  let lastProps;
  let lastResult;
  return function Memoized(props) {
    if (hasRendered && arePropsEqual(lastProps, props)) return lastResult;
    hasRendered = true;
    lastProps = props;
    lastResult = component(props);
    return lastResult;
  };
}

// ---- Test driver (leave as is) ----
// Test data can't hold functions, shared references, NaN or -0 directly, so values are
// described with tags that the driver turns into real values:
//   { $ref: "s" }  the same object instance everywhere "s" appears in one test
//   { $fn: "f" }   the same function instance everywhere "f" appears in one test
//   { $new: {...} } a fresh copy of the object every time it appears
//   { $nan: true } NaN      { $negzero: true } -0      { $proto: {...} } an object whose
//   properties are inherited (Object.create), so it has no own keys
function runMemo(scenario) {
  const refs = new Map();
  const fns = new Map();
  const decode = (v) => {
    if (Array.isArray(v)) return v.map(decode);
    if (v === null || typeof v !== "object") return v;
    if ("$ref" in v) {
      if (!refs.has(v.$ref)) refs.set(v.$ref, { id: v.$ref });
      return refs.get(v.$ref);
    }
    if ("$fn" in v) {
      if (!fns.has(v.$fn)) fns.set(v.$fn, () => v.$fn);
      return fns.get(v.$fn);
    }
    if ("$new" in v) return decode(v.$new);
    if ("$nan" in v) return NaN;
    if ("$negzero" in v) return -0;
    if ("$proto" in v) return Object.create(decode(v.$proto));
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = decode(x);
    return out;
  };
  if (scenario.compare) {
    const [a, b] = scenario.compare.map(decode);
    return shallowEqual(a, b);
  }
  // scenario.renders: the props a parent passes on each of its renders.
  // scenario.comparator: "default" | "sameId" (custom arePropsEqual comparing props.id only)
  let calls = 0;
  const Row = (props) => "Row#" + ++calls + (props.label ? ":" + props.label : "");
  const comparators = { sameId: (prev, next) => prev.id === next.id };
  const Memo = scenario.comparator && scenario.comparator !== "default"
    ? memo(Row, comparators[scenario.comparator])
    : memo(Row);
  const outputs = scenario.renders.map((p) => Memo(decode(p)));
  return { outputs, renders: calls };
}
