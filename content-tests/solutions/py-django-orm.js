class BookQuerySet {
  /**
   * @param {{ tables: { authors: object[], books: object[], tags: object[], bookTags: number[][] }, query(label: string): void }} db
   */
  constructor(db, state = {}) {
    this.db = db;
    this.state = { filters: [], ordering: [], selectRelated: [], prefetch: [], ...state };
    this.cache = null;
  }

  clone(changes) {
    return new BookQuerySet(this.db, { ...this.state, ...changes });
  }

  filter(where) {
    return this.clone({ filters: [...this.state.filters, { where, negate: false }] });
  }

  exclude(where) {
    return this.clone({ filters: [...this.state.filters, { where, negate: true }] });
  }

  orderBy(...fields) {
    return this.clone({ ordering: fields });
  }

  selectRelated(...relations) {
    return this.clone({ selectRelated: [...this.state.selectRelated, ...relations] });
  }

  prefetchRelated(...relations) {
    return this.clone({ prefetch: [...this.state.prefetch, ...relations] });
  }

  all() {
    return this.clone({});
  }

  matchingRows() {
    const rows = this.db.tables.books.filter((book) =>
      this.state.filters.every(({ where, negate }) => {
        const matches = Object.entries(where).every(([key, value]) => book[key] === value);
        return negate ? !matches : matches;
      }),
    );
    const ordering = this.state.ordering.length ? this.state.ordering : ["id"];
    return rows.slice().sort((a, b) => {
      for (const field of ordering) {
        const desc = field.startsWith("-");
        const key = desc ? field.slice(1) : field;
        if (a[key] < b[key]) return desc ? 1 : -1;
        if (a[key] > b[key]) return desc ? -1 : 1;
      }
      return 0;
    });
  }

  count() {
    if (this.cache) return this.cache.length;
    this.db.query("count");
    return this.matchingRows().length;
  }

  toArray() {
    if (this.cache) return this.cache;
    this.db.query("books");
    const joinAuthor = this.state.selectRelated.includes("author");
    const rows = this.matchingRows().map((book) => makeBookRow(this.db, book, joinAuthor));
    if (this.state.prefetch.includes("tags") && rows.length > 0) {
      this.db.query("tags"); // one query for every row's tags
      for (const row of rows) row.prefetchedTags = tagNamesFor(this.db, row.id);
    }
    this.cache = rows;
    return rows;
  }
}

function findAuthor(db, id) {
  return db.tables.authors.find((a) => a.id === id) || null;
}

function tagNamesFor(db, bookId) {
  const ids = db.tables.bookTags.filter(([b]) => b === bookId).map(([, t]) => t);
  return db.tables.tags
    .filter((t) => ids.includes(t.id))
    .sort((x, y) => x.id - y.id)
    .map((t) => t.name);
}

function makeBookRow(db, book, joinAuthor) {
  const row = { ...book };
  let loaded = joinAuthor;
  let author = joinAuthor && book.authorId !== null ? findAuthor(db, book.authorId) : null;
  row.getAuthor = () => {
    if (book.authorId === null) return null;
    if (!loaded) {
      db.query("author");
      author = findAuthor(db, book.authorId);
      loaded = true;
    }
    return author;
  };
  row.getTags = () => {
    if (row.prefetchedTags) return row.prefetchedTags;
    db.query("tags"); // like book.tags.all(): a new query on every call
    return tagNamesFor(db, book.id);
  };
  return row;
}

// ---- Test driver (leave as is) ----
// steps: ["qs", name] creates a QuerySet; ["filter" | "exclude" | "orderBy" | "selectRelated" |
// "prefetchRelated" | "all", target, source, ...args] chains; ["titles" | "count" | "authors" |
// "authorsTwice" | "tags", name] evaluates. Each evaluating step logs the queries it ran in [brackets].
function runOrmScenario(data, steps) {
  const labels = [];
  const db = {
    tables: data,
    query(label) {
      labels.push(label);
    },
  };
  const nameOf = (author) => (author ? author.name : "-");
  const chainOps = new Set(["filter", "exclude", "orderBy", "selectRelated", "prefetchRelated", "all"]);
  const vars = {};
  const log = [];
  for (const [op, target, source, ...rest] of steps) {
    const before = labels.length;
    let line = null;
    if (op === "qs") vars[target] = new BookQuerySet(db);
    else if (chainOps.has(op)) vars[target] = vars[source][op](...rest);
    else {
      const qs = vars[target];
      if (op === "titles") line = "titles:" + qs.toArray().map((b) => b.title).join(",");
      else if (op === "count") line = "count:" + qs.count();
      else if (op === "authors") line = "authors:" + qs.toArray().map((b) => nameOf(b.getAuthor())).join(",");
      else if (op === "authorsTwice")
        line = "authorsTwice:" + qs.toArray().map((b) => nameOf(b.getAuthor()) + "/" + nameOf(b.getAuthor())).join(",");
      else if (op === "tags") line = "tags:" + qs.toArray().map((b) => b.title + "=" + b.getTags().join("|")).join(";");
    }
    const ran = labels.slice(before);
    if (line !== null) log.push(line + " [" + ran.join(",") + "]");
    else if (ran.length) log.push("unexpected queries during " + op + " [" + ran.join(",") + "]");
  }
  log.push("total queries: " + labels.length);
  return log;
}
