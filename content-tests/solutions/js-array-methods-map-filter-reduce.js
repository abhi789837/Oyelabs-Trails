/**
 * Behaves like array.reduce(callback, initialValue) without calling the built-in.
 * @param {Array} array
 * @param {Function} callback (accumulator, element, index, array) => newAccumulator
 * @param {*} [initialValue]
 */
function myReduce(array, callback, initialValue) {
  if (typeof callback !== "function") throw new TypeError(String(callback) + " is not a function");
  const length = array.length; // captured once: elements appended later aren't visited
  let k = 0;
  let accumulator;
  if (arguments.length >= 3) {
    accumulator = initialValue; // provided, even if it is undefined
  } else {
    while (k < length && !(k in array)) k++; // skip leading holes
    if (k >= length) throw new TypeError("Reduce of empty array with no initial value");
    accumulator = array[k++];
  }
  for (; k < length; k++) {
    if (k in array) accumulator = callback(accumulator, array[k], k, array);
  }
  return accumulator;
}

// ---- Test driver (leave as is) ----
function runReduce(values, reducerName, initialMode, initialValue, holes) {
  const array = values.slice();
  for (const index of holes || []) delete array[index];
  const visits = [];
  const reducers = {
    sum: (acc, x) => acc + x,
    describe: (acc, x) => acc + "+" + x,
    groupParity: (acc, x) => {
      const key = x % 2 === 0 ? "even" : "odd";
      if (!acc[key]) acc[key] = [];
      acc[key].push(x);
      return acc;
    },
    appendOnFirst: (acc, x, i, arr) => {
      if (i === 0) arr.push(100);
      return acc + x;
    },
  };
  const reducer = reducers[reducerName];
  const callback = reducer
    ? function (acc, x, i, arr) {
        visits.push(arr === array ? [i, x] : ["wrong array", i]);
        return reducer(acc, x, i, arr);
      }
    : reducerName; // not a function: myReduce should throw a TypeError
  const builtins = [Array.prototype.reduce, Array.prototype.reduceRight];
  Array.prototype.reduce = Array.prototype.reduceRight = function () {
    throw new Error("Don't call the built-in reduce");
  };
  try {
    const result =
      initialMode === "none"
        ? myReduce(array, callback)
        : myReduce(array, callback, initialMode === "undefined" ? undefined : initialValue);
    return { result, visits };
  } catch (err) {
    return { error: err.name, visits };
  } finally {
    Array.prototype.reduce = builtins[0];
    Array.prototype.reduceRight = builtins[1];
  }
}
