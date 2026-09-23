/**
 * The code that actually executes a submission, as a source string.
 *
 * It is shared verbatim by both sandboxes: `isolated-vm` compiles it inside a fresh isolate, and
 * the worker_threads fallback evaluates it inside a worker. Keeping one copy means grading cannot
 * differ between development and production — a test that passes locally passes in production
 * for the same reasons.
 *
 * It defines `__runTests(payloadJson)` and returns a JSON string, so nothing but plain text
 * crosses the isolate boundary.
 */
export const RUNTIME_SOURCE = String.raw`
const MARK = "__oyelearn_raw__";

function format(value) {
  if (value === undefined) return "undefined";
  if (typeof value === "function") return "[Function]";
  if (typeof value === "bigint") return value + "n";
  try {
    const json = JSON.stringify(value, function (_key, v) {
      if (v === undefined) return MARK + "undefined";
      if (typeof v === "function") return MARK + "[Function]";
      if (typeof v === "number" && !Number.isFinite(v)) return MARK + String(v);
      return v;
    });
    if (json === undefined) return String(value);
    return json.replace(new RegExp('"' + MARK + '([^"]*)"', "g"), "$1");
  } catch (err) {
    return String(value);
  }
}

function deepEqual(a, b) {
  if (a === b || (a !== a && b !== b)) return true; // NaN equals NaN here
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!deepEqual(a[k], b[k])) return false;
  }
  return true;
}

function describeError(err) {
  if (err && typeof err === "object" && "message" in err) {
    return (err.name ? err.name + ": " : "") + err.message;
  }
  return String(err);
}

async function __runTests(payloadJson) {
  const payload = JSON.parse(payloadJson);
  const { code, functionName, testCases } = payload;

  let fn;
  try {
    fn = new Function(code + "\n;return typeof " + functionName + ' === "function" ? ' + functionName + " : undefined;")();
  } catch (err) {
    return JSON.stringify({ compileError: describeError(err), outcomes: [] });
  }
  if (typeof fn !== "function") {
    return JSON.stringify({
      compileError: "Couldn't find a function named " + functionName + ". Keep the function name from the starter code.",
      outcomes: [],
    });
  }

  const outcomes = [];
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      const actual = await fn.apply(null, tc.args);
      outcomes.push({
        index: i,
        passed: deepEqual(actual, tc.expected),
        expected: format(tc.expected),
        actual: format(actual),
      });
    } catch (err) {
      outcomes.push({ index: i, passed: false, expected: format(tc.expected), error: describeError(err) });
    }
  }
  return JSON.stringify({ outcomes });
}
`;
