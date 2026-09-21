/**
 * Flattens arbitrarily nested arrays without using the call stack for nesting.
 * @param {unknown[]} input
 * @returns {unknown[]}
 */
function flattenDeep(input) {
  if (!Array.isArray(input)) throw new TypeError("flattenDeep expects an array");
  const out = [];
  // Our own "call stack" of [array, nextIndex] frames. It lives on the heap, so its depth is
  // limited by memory rather than by the engine's stack size.
  const stack = [[input, 0]];
  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    const arr = frame[0];
    const i = frame[1];
    if (i >= arr.length) {
      stack.pop();
      continue;
    }
    frame[1] = i + 1;
    const value = arr[i];
    if (Array.isArray(value)) stack.push([value, 0]);
    else out.push(value);
  }
  return out;
}

// ---- Test driver (leave as is) ----
function checkFlatten(input) {
  try {
    if (input && input.deep) {
      let nested = [1];
      for (let i = 0; i < input.deep; i++) nested = [nested];
      return flattenDeep([0, nested, 2]);
    }
    if (input && input.wide) {
      const wide = Array.from({ length: input.wide }, (_, i) => [i, [i]]);
      const out = flattenDeep(wide);
      return { length: out.length, first: out[0], last: out[out.length - 1] };
    }
    if (input && input.mutationCheck) {
      const before = JSON.stringify(input.mutationCheck);
      const result = flattenDeep(input.mutationCheck);
      return { result, unchanged: JSON.stringify(input.mutationCheck) === before };
    }
    return flattenDeep(input);
  } catch (err) {
    return { error: err.name };
  }
}
