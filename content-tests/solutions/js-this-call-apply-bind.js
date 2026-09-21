/**
 * @param {Function} fn
 * @param {any} thisArg
 * @param {...any} boundArgs
 * @returns {Function}
 */
function myBind(fn, thisArg, ...boundArgs) {
  if (typeof fn !== "function") throw new TypeError("myBind: target is not callable");
  // A regular function (not an arrow), so it can be called with `new`.
  return function bound(...args) {
    const allArgs = boundArgs.concat(args);
    if (new.target) return Reflect.construct(fn, allArgs);
    return fn.apply(thisArg, allArgs);
  };
}

// ---- Test driver (leave as is) ----
function runBindScenario(name) {
  const nativeBind = Function.prototype.bind;
  Function.prototype.bind = function () {
    throw new Error("Don't use the built-in bind inside myBind");
  };
  try {
    return scenario(name);
  } finally {
    Function.prototype.bind = nativeBind;
  }
}

function scenario(name) {
  const getName = function () {
    return this.name;
  };
  const Point = function (x, y) {
    this.x = x;
    this.y = y;
  };
  Point.prototype.sum = function () {
    return this.x + this.y;
  };
  if (name === "basic") {
    const greet = function (greeting, punct) {
      return greeting + ", " + this.name + punct;
    };
    return myBind(greet, { name: "Ada" }, "Hello")("!");
  }
  if (name === "partial") {
    const collect = function () {
      return [this.base].concat(Array.from(arguments));
    };
    return myBind(collect, { base: 10 }, 1, 2)(3, 4);
  }
  if (name === "explicit-beats-implicit") {
    const obj = { name: "B", bound: myBind(getName, { name: "A" }) };
    return obj.bound();
  }
  if (name === "rebind-ignored") {
    const first = myBind(getName, { name: "first" });
    const second = myBind(first, { name: "second" });
    return [second(), first.call({ name: "call" })];
  }
  if (name === "new-ignores-thisArg") {
    const ctx = { tag: "ctx" };
    const BoundPoint = myBind(Point, ctx, 1);
    const p = new BoundPoint(2);
    return { x: p.x, y: p.y, isPoint: p instanceof Point, ctxUntouched: !("x" in ctx) };
  }
  if (name === "new-inherits-prototype") {
    const BoundPoint = myBind(Point, null, 5);
    return new BoundPoint(1).sum();
  }
  if (name === "new-returns-object") {
    const Factory = function () {
      this.ignored = true;
      return { custom: true };
    };
    return new (myBind(Factory, {}))();
  }
  if (name === "new-class") {
    class Box {
      constructor(a, b) {
        this.value = a + b;
      }
    }
    const BoundBox = myBind(Box, { ignored: true }, 3);
    const box = new BoundBox(4);
    return { value: box.value, isBox: box instanceof Box };
  }
  if (name === "not-callable") {
    try {
      myBind({ not: "a function" }, {});
      return "no error";
    } catch (e) {
      return e instanceof TypeError ? "TypeError" : "other error";
    }
  }
  throw new Error("Unknown scenario: " + name);
}
