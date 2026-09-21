/**
 * @param {Function[]} stack  regular middleware (req, res, next) and error handlers (err, req, res, next)
 * @param {object} req
 * @param {object} res
 * @param {(err?: unknown) => void} done  called once when the stack is exhausted
 */
function runStack(stack, req, res, done) {
  let index = 0;

  function dispatch(err) {
    while (index < stack.length) {
      const fn = stack[index++];
      const isErrorHandler = fn.length === 4;
      if (err ? !isErrorHandler : isErrorHandler) continue;

      let called = false;
      const next = (nextErr) => {
        if (called) return;
        called = true;
        dispatch(nextErr);
      };

      try {
        const ret = err ? fn(err, req, res, next) : fn(req, res, next);
        if (ret && typeof ret.then === "function") {
          ret.then(undefined, (reason) => next(reason || new Error("Rejected promise")));
        }
      } catch (thrown) {
        next(thrown);
      }
      return;
    }
    if (err) done(err);
    else done();
  }

  dispatch();
}

// ---- Test driver (leave as is) ----
// Each layer is [name, kind, action]:
//   kind "mw"    regular middleware (req, res, next)
//   kind "err"   error handler (err, req, res, next)
//   kind "err3"  a mistaken "error handler" declared as (err, req, res)
async function runScenario(layers) {
  const trace = [];
  const done = [];
  const res = {
    statusCode: 200,
    sent: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      if (!this.sent) this.sent = [this.statusCode, body];
    },
  };
  const stack = layers.map(([name, kind, action]) => makeLayer(name, kind, action, trace));
  runStack(stack, { url: "/" }, res, (err) => {
    done.push(err ? "error: " + (err instanceof Error ? err.message : String(err)) : "not found");
  });
  for (let i = 0; i < 50; i++) await null; // let promise-based layers settle
  return { trace, sent: res.sent, done };
}

function makeLayer(name, kind, action, trace) {
  const fail = () => new Error(name + " failed");
  if (kind === "err") {
    return function (err, req, res, next) {
      trace.push(name);
      if (action === "send") res.status(500).send(err.message);
      else if (action === "next") next(err);
      else if (action === "recover") next();
      else if (action === "throw") throw fail();
    };
  }
  if (kind === "err3") {
    return function (err, req, res) {
      trace.push(name);
    };
  }
  switch (action) {
    case "next":
      return function (req, res, next) { trace.push(name); next(); };
    case "send":
      return function (req, res, next) { trace.push(name); res.send(name); };
    case "throw":
      return function (req, res, next) { trace.push(name); throw fail(); };
    case "nextError":
      return function (req, res, next) { trace.push(name); next(fail()); };
    case "nextTwice":
      return function (req, res, next) { trace.push(name); next(); next(); };
    case "asyncNext":
      return async function (req, res, next) { trace.push(name); await null; next(); };
    case "reject":
      return async function (req, res, next) { trace.push(name); await null; throw fail(); };
    case "rejectEmpty":
      return function (req, res, next) { trace.push(name); return Promise.reject(); };
    case "resolve":
      return async function (req, res, next) { trace.push(name); await null; };
    default:
      throw new Error("unknown action " + action);
  }
}
