/**
 * @param {Array<(req: object, next: (req: object) => object) => object>} interceptors
 * @param {(req: object) => object} backend
 * @returns {(req: object) => object}
 */
function createHttpHandler(interceptors, backend) {
  return interceptors.reduceRight(
    (next, interceptor) => (req) => interceptor(req, next),
    (req) => backend(req),
  );
}

// ---- Test driver (leave as is) ----
function runInterceptorScenario(name) {
  const clone = (req, patch) => ({ ...req, ...patch, headers: { ...req.headers, ...(patch && patch.headers) } });
  const ok = (req, body) => ({ status: 200, body, url: req.url });

  const scenarios = {
    order() {
      const log = [];
      const tag = (id) => (req, next) => {
        log.push("req:" + id);
        const res = next(req);
        log.push("res:" + id);
        return res;
      };
      const handle = createHttpHandler([tag("a"), tag("b"), tag("c")], (req) => {
        log.push("backend");
        return ok(req, "hi");
      });
      const res = handle({ url: "/things", headers: {} });
      return { log, status: res.status, body: res.body };
    },
    immutableRequest() {
      const auth = (req, next) => next(clone(req, { headers: { authorization: "Bearer t" } }));
      const handle = createHttpHandler([auth], (req) => ok(req, req.headers));
      const original = { url: "/me", headers: { accept: "json" } };
      const res = handle(original);
      return { sent: res.body, original };
    },
    shortCircuit() {
      let backendCalls = 0;
      const cache = new Map([["/cached", "from-cache"]]);
      const caching = (req, next) => {
        if (cache.has(req.url)) return { status: 200, body: cache.get(req.url), url: req.url };
        return next(req);
      };
      const handle = createHttpHandler([caching], (req) => {
        backendCalls++;
        return ok(req, "from-network");
      });
      const cached = handle({ url: "/cached", headers: {} });
      const fresh = handle({ url: "/fresh", headers: {} });
      return { cached: cached.body, fresh: fresh.body, backendCalls };
    },
    retry() {
      let attempts = 0;
      const retrying = (req, next) => {
        let res = next(req);
        let tries = 1;
        while (res.status >= 500 && tries < 3) {
          res = next(clone(req, { headers: { "x-retry": String(tries) } }));
          tries++;
        }
        return { ...res, tries };
      };
      const handle = createHttpHandler([retrying], (req) => {
        attempts++;
        return attempts < 3 ? { status: 503, body: "busy", url: req.url } : ok(req, "done");
      });
      const res = handle({ url: "/flaky", headers: {} });
      return { attempts, status: res.status, body: res.body, tries: res.tries };
    },
    noInterceptors() {
      const handle = createHttpHandler([], (req) => ok(req, "direct"));
      const res = handle({ url: "/direct", headers: {} });
      return { status: res.status, body: res.body, url: res.url };
    },
    reusedHandler() {
      const seen = [];
      const record = (req, next) => {
        seen.push(req.url);
        return next(req);
      };
      const handle = createHttpHandler([record, record], (req) => ok(req, req.url));
      const first = handle({ url: "/one", headers: {} }).body;
      const second = handle({ url: "/two", headers: {} }).body;
      return { seen, first, second };
    },
    mutableContext() {
      const attemptsByRequest = [];
      const counting = (req, next) => {
        req.context.attempt = (req.context.attempt || 0) + 1;
        const res = next(req);
        if (res.status >= 500 && req.context.attempt < 3) return counting(req, next);
        attemptsByRequest.push(req.context.attempt);
        return res;
      };
      const handle = createHttpHandler([counting], (req) =>
        req.context.attempt < 3 ? { status: 500, body: "err", url: req.url } : ok(req, "ok"),
      );
      const res = handle({ url: "/ctx", headers: {}, context: {} });
      return { attemptsByRequest, status: res.status, body: res.body };
    },
    transformResponse() {
      const upper = (req, next) => {
        const res = next(req);
        return { ...res, body: String(res.body).toUpperCase() };
      };
      const exclaim = (req, next) => {
        const res = next(req);
        return { ...res, body: res.body + "!" };
      };
      const handle = createHttpHandler([upper, exclaim], (req) => ok(req, "hello"));
      return handle({ url: "/t", headers: {} }).body;
    },
    thrownError() {
      const boom = (req, next) => {
        if (req.url === "/boom") throw new Error("interceptor exploded");
        return next(req);
      };
      const handle = createHttpHandler([boom], (req) => ok(req, "fine"));
      let message = null;
      try {
        handle({ url: "/boom", headers: {} });
      } catch (e) {
        message = e.message;
      }
      const after = handle({ url: "/ok", headers: {} }).body;
      return { message, after };
    },
    longChain() {
      const marks = [];
      const chain = Array.from({ length: 500 }, (_, i) => (req, next) => {
        marks.push(i);
        return next(clone(req, { headers: { depth: String(i) } }));
      });
      const handle = createHttpHandler(chain, (req) => ok(req, req.headers.depth));
      const res = handle({ url: "/deep", headers: {} });
      return { first: marks[0], last: marks[marks.length - 1], calls: marks.length, body: res.body };
    },
  };
  if (!scenarios[name]) throw new Error("Unknown scenario " + name);
  return scenarios[name]();
}
