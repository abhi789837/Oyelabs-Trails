/**
 * Coding tasks whose checks need set-up code end their starter code with a test driver under this
 * marker. The learner's editor shows only their own part (UX review D1); the driver is kept and
 * joined back for Run, Check, the draft and "Send to laptop", so the old topic page reads the same
 * draft and the server grades the same code as before. Only this exact marker is hidden: the one
 * task whose driver also has helpers the learner may call keeps it in view.
 */
export const TEST_DRIVER_MARKER = "// ---- Test driver (leave as is) ----";

export function splitTestDriver(code: string): { own: string; driver: string } {
  const at = code.indexOf(TEST_DRIVER_MARKER);
  return at === -1 ? { own: code, driver: "" } : { own: code.slice(0, at), driver: code.slice(at) };
}

/** `joinTestDriver(splitTestDriver(c))` is `c`. An edit that loses the last newline gets one back. */
export function joinTestDriver(own: string, driver: string): string {
  if (!driver) return own;
  return own.endsWith("\n") || own === "" ? own + driver : `${own}\n${driver}`;
}
