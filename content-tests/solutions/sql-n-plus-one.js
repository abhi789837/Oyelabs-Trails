/**
 * @param {{ findByIds: (ids: number[]) => Promise<{ id: number }[]> }} db
 * @param {{ maxBatchSize?: number }} [options]
 * @returns {{ load: (id: number) => Promise<object | null> }}
 */
function createUserLoader(db, options) {
  const maxBatchSize = (options && options.maxBatchSize) || Infinity;
  const cache = new Map(); // id -> Promise<row | null>
  let pending = null; // [{ id, resolve, reject }] waiting for the next dispatch

  function dispatch(batch) {
    for (let i = 0; i < batch.length; i += maxBatchSize) {
      const chunk = batch.slice(i, i + maxBatchSize);
      let query;
      try {
        query = Promise.resolve(db.findByIds(chunk.map((entry) => entry.id)));
      } catch (e) {
        query = Promise.reject(e);
      }
      query.then(
        (rows) => {
          const byId = new Map(rows.map((row) => [row.id, row]));
          for (const entry of chunk) entry.resolve(byId.has(entry.id) ? byId.get(entry.id) : null);
        },
        (error) => {
          for (const entry of chunk) {
            cache.delete(entry.id); // don't cache failures
            entry.reject(error);
          }
        },
      );
    }
  }

  return {
    load(id) {
      if (id === null || id === undefined) {
        return Promise.reject(new TypeError("load() needs an id, got " + id));
      }
      if (cache.has(id)) return cache.get(id);
      if (!pending) {
        pending = [];
        queueMicrotask(() => {
          const batch = pending;
          pending = null;
          dispatch(batch);
        });
      }
      const queue = pending;
      const promise = new Promise((resolve, reject) => queue.push({ id, resolve, reject }));
      cache.set(id, promise);
      return promise;
    },
  };
}

// ---- Test driver (leave as is) ----
async function runLoaderScenario(users, waves, options) {
  const opts = options || {};
  const failQueries = opts.failQueries || [];
  const queries = [];
  const db = {
    findByIds(ids) {
      queries.push(ids.slice());
      const queryNumber = queries.length;
      const wanted = new Set(ids);
      return Promise.resolve().then(() => {
        if (failQueries.includes(queryNumber)) {
          const error = new Error("connection reset");
          error.name = "DbError";
          throw error;
        }
        // Like a real database: no particular order, missing ids simply absent.
        return users
          .filter((u) => wanted.has(u.id))
          .sort((a, b) => b.id - a.id)
          .map((u) => ({ ...u }));
      });
    },
  };
  const loader = createUserLoader(db, { maxBatchSize: opts.maxBatchSize });
  const results = [];
  for (const wave of waves) {
    const settled = await Promise.all(
      wave.map((id) => {
        let promise;
        try {
          promise = loader.load(id);
        } catch (e) {
          return { ok: false, error: "threw synchronously" };
        }
        return Promise.resolve(promise).then(
          (value) => ({ ok: true, value }),
          (e) => ({ ok: false, error: (e && e.name) || "Error" }),
        );
      }),
    );
    results.push(settled);
  }
  return { results, queries };
}
