import type { Module } from "@/types/curriculum";

// Shared fixtures for the join challenge's large-input test.
const bigJoinSide = Array.from({ length: 3000 }, (_, i) => ({ id: i, k: i % 1000 }));

// Shared fixture for the aggregation challenge.
const employees = [
  { name: "a", dept: "eng", level: 2, salary: 100, bonus: 10 },
  { name: "b", dept: "eng", level: 3, salary: 200, bonus: null },
  { name: "c", dept: "ops", level: 2, salary: 150 },
  { name: "d", dept: null, level: 1, salary: 50, bonus: 5 },
  { name: "e", dept: "eng", level: 2, salary: null, bonus: 20 },
  { name: "f", level: 1, salary: 70 },
];

// Shared fixtures for the N+1 / DataLoader challenge.
const users = [
  { id: 1, name: "Ada" },
  { id: 2, name: "Grace" },
  { id: 3, name: "Linus" },
  { id: 4, name: "Barbara" },
  { id: 5, name: "Ken" },
];
const manyUsers = Array.from({ length: 500 }, (_, i) => ({ id: i + 1, name: `user${i + 1}` }));

export default {
  id: "be-sql",
  trackId: "backend",
  name: "SQL & Relational Databases",
  description:
    "Relational databases for engineers who already write SQL and want to know what the database does with it: modeling and normalization, NULL-correct filtering, join and aggregation semantics, CTEs and window functions, index design and reading `EXPLAIN`, isolation anomalies and MVCC, PostgreSQL 18 features, ORMs, and the N+1 problem. Examples use PostgreSQL 18.",
  refs: [
    { label: "PostgreSQL: Documentation", url: "https://www.postgresql.org/docs/", kind: "docs" },
    { label: "Use The Index, Luke: SQL indexing and tuning", url: "https://use-the-index-luke.com/", kind: "article" },
  ],
  topics: [
    {
      id: "sql-normalization",
      moduleId: "be-sql",
      trackId: "backend",
      title: "Relational Modeling & Normalization (1NF to BCNF)",
      summary:
        "Normalization exists so that every fact lives in exactly one place and the database, not application code, keeps it consistent. A table that repeats a customer's address on every order row invites update anomalies (change it in one row but not the others), insertion anomalies (you can't record a customer until they order) and deletion anomalies (deleting the last order erases the customer). 1NF asks for atomic values and no repeating groups; 2NF removes columns that depend on only part of a composite key; 3NF removes columns that depend on other non-key columns (transitive dependencies); BCNF tightens 3NF so that every determinant is a candidate key.\n\nNormalize by default for transactional systems, then denormalize deliberately where a measured read path needs it: a maintained `order_count` on `customers`, or a reporting table rebuilt by a job. Each copy needs one owner and a mechanism that keeps it correct (the same transaction, a trigger, or an explicit tolerance for staleness). Not every copy is denormalization: the price stored on an order line is a different fact from today's catalogue price.\n\nThe gotchas live in the constraints. PostgreSQL requires a unique index on the referenced side of a foreign key but creates none on the referencing column, so deleting a parent row scans the child table unless you index it yourself. `UNIQUE` treats NULLs as distinct unless you declare `NULLS NOT DISTINCT` (PostgreSQL 15+). `CHECK` constraints can only see the current row. And random UUIDv4 keys scatter inserts across the B-tree, while PostgreSQL 18's `uuidv7()` is time-ordered and keeps new keys at the right edge of the index.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "PostgreSQL 18 docs: Constraints", url: "https://www.postgresql.org/docs/18/ddl-constraints.html", kind: "docs" },
        { label: "William Kent: A Simple Guide to Five Normal Forms in Relational Database Theory", url: "https://www.bkent.net/Doc/simple5.htm", kind: "article" },
        { label: "PostgreSQL 18 docs: Foreign Keys (tutorial)", url: "https://www.postgresql.org/docs/18/tutorial-fk.html", kind: "docs" },
      ],
      video: {
        title: "Learn Database Normalization - 1NF, 2NF, 3NF, 4NF, 5NF",
        channel: "Decomplexify",
        url: "https://www.youtube.com/watch?v=GFQaEYEc8_8",
        videoId: "GFQaEYEc8_8",
        durationLabel: "28:34",
      },
      alternateVideos: [
        {
          title: "Learn Database Denormalization",
          channel: "Decomplexify",
          url: "https://www.youtube.com/watch?v=4bTq0GdSeQs",
          videoId: "4bTq0GdSeQs",
          durationLabel: "19:07",
        },
        {
          title: "SQL Tutorial - Full Database Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
          videoId: "HXV3zeQKqGY",
          durationLabel: "4:20:39",
          startSeconds: 1390,
          chapterLabel: "Tables & Keys",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "sql-normalization-q1",
          prompt:
            "`order_items` has the primary key `(order_id, product_id)`:\n\n```sql\norder_items(order_id, product_id, quantity, product_name)\n```\n\nWhich normal form does `product_name` violate first?",
          options: [
            "2NF: it depends on `product_id` alone, which is only part of the composite key",
            "1NF: the table has more than one key column",
            "3NF: it depends on `quantity`",
            "Only BCNF; the table is already in 3NF",
          ],
          correctIndex: 0,
          explanation:
            "`product_name` is determined by `product_id`, a proper subset of the key: a partial dependency, which is exactly what 2NF forbids. It isn't a 3NF (transitive) problem because its determinant is part of the key, not a non-key column.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-normalization-q2",
          prompt:
            "`employees(id PRIMARY KEY, name, dept_id, dept_name)`: every employee in department 7 repeats `dept_name = 'Payments'`. What's the problem in normal-form terms?",
          options: [
            "A transitive dependency (`id → dept_id → dept_name`), which violates 3NF",
            "A partial dependency, which violates 2NF",
            "A repeating group, which violates 1NF",
            "None: a table with a single-column key can't violate any normal form",
          ],
          correctIndex: 0,
          explanation:
            "With a single-column key there can't be a partial dependency, so 2NF holds. The issue is a non-key column (`dept_name`) depending on another non-key column (`dept_id`); departments belong in their own table.",
        },
        {
          id: "sql-normalization-q3",
          prompt:
            "An `orders` table stores the customer's name and address on every order row. Which problems does that design invite? (Select all that apply.)",
          options: [
            "Changing a customer's address means updating many rows, and missing one leaves contradictory data",
            "A customer can't be recorded until they place an order",
            "Deleting a customer's last order also deletes the only copy of their address",
            "Showing an order together with its customer requires a JOIN",
            "The table can no longer have a primary key",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Those are the update, insertion and deletion anomalies that normalization removes. Needing a JOIN is the cost of the normalized design, not a symptom of this one, and the table can still have a key.",
        },
        {
          id: "sql-normalization-q4",
          prompt:
            "`orders.customer_id` has a foreign key to `customers(id)`. `DELETE FROM customers WHERE id = 42` takes seconds on a large `orders` table, even though no orders reference customer 42. What's the most likely cause?",
          options: [
            "PostgreSQL doesn't index the referencing column automatically, so the foreign key check scans `orders`",
            "Foreign keys force the delete to run at SERIALIZABLE isolation",
            "The primary key index on `customers` is rebuilt after each delete",
            "PostgreSQL locks every row of `orders` for each foreign key check",
          ],
          correctIndex: 0,
          explanation:
            "The referenced columns must have a unique index, but the referencing column gets none; deleting a parent has to look for child rows, which is a sequential scan without an index on `orders(customer_id)`. The check doesn't change the isolation level or lock the whole table.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-normalization-q5",
          prompt: "`users.email` has a `UNIQUE` constraint and is nullable. Can two rows both have `email = NULL`?",
          options: [
            "Yes: NULLs are not considered equal by default; `UNIQUE NULLS NOT DISTINCT` (PostgreSQL 15+) forbids it",
            "No: a unique constraint allows at most one NULL",
            "No: unique columns are implicitly `NOT NULL`",
            "Only if the constraint is declared `DEFERRABLE`",
          ],
          correctIndex: 0,
          explanation:
            "Following the SQL standard, NULL never equals NULL, so any number of NULLs pass a unique constraint. SQL Server behaves differently (a unique constraint allows one NULL), which surprises people moving between databases.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-normalization-q6",
          prompt:
            "`order_items.unit_price` is copied from `products.price` when the order is placed. Is that denormalization?",
          options: [
            "No: the price at purchase time is a different fact from today's price, so it has to be stored",
            "Yes, and it should be replaced with a JOIN to `products`",
            "Yes, but it's acceptable because prices rarely change",
            "No, because `products.price` should be removed instead",
          ],
          correctIndex: 0,
          explanation:
            "Normalization removes redundant copies of the same fact. The agreed price is its own fact; joining to the live price would silently rewrite historical invoices whenever the catalogue changes.",
        },
        {
          id: "sql-normalization-q7",
          prompt:
            "Students enroll in many courses and each course has many students. Which model lets the database enforce integrity?",
          options: [
            "A junction table `enrollments(student_id, course_id)` with a composite primary key and a foreign key on each column",
            "An `int[]` column of course ids on `students`",
            "A comma-separated `course_ids` text column on `students`",
            "One `students` row per course, repeating the student's details",
          ],
          correctIndex: 0,
          explanation:
            "Only the junction table can carry foreign keys and a uniqueness guarantee per pair. Array and CSV columns can't be referenced by foreign keys, and repeating student rows reintroduces update anomalies.",
        },
        {
          id: "sql-normalization-q8",
          prompt:
            "Which statements about using PostgreSQL 18's `uuidv7()` for primary keys, instead of `gen_random_uuid()` (a version 4 UUID), are true? (Select all that apply.)",
          options: [
            "New values are time-ordered, so inserts land near the right edge of the B-tree instead of on random pages",
            "The value embeds its creation time, which anyone holding the id can read",
            "It's still a 16-byte `uuid`, twice the size of a `bigint` key",
            "Values are gap-free and strictly sequential across all sessions",
            "It makes the primary key index unnecessary",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Version 7 puts a millisecond timestamp in the high bits, which keeps index inserts localized (better cache hit rates, fewer page splits) but leaks creation time. It isn't a gap-free sequence, and the key still needs its index.",
        },
        {
          id: "sql-normalization-q9",
          prompt:
            "A dashboard lists customers and runs `SELECT count(*) FROM orders WHERE customer_id = $1` for each one; it's now the slowest query in the system. Which denormalization is the most defensible?",
          options: [
            "An `order_count` column on `customers`, updated in the same transaction that inserts or deletes an order",
            "Copying every customer column onto each order row",
            "Dropping the foreign key so order inserts are faster",
            "Caching the counts in the browser's `localStorage`",
          ],
          correctIndex: 0,
          explanation:
            "A derived value with one owner, maintained atomically with the writes that change it, trades a little write cost (and row contention on very busy customers) for cheap reads. The other options duplicate far more data, give up integrity, or don't address the query.",
        },
        {
          id: "sql-normalization-q10",
          prompt: "Which statement correctly distinguishes BCNF from 3NF?",
          options: [
            "In BCNF every determinant of a non-trivial dependency is a candidate key; 3NF also allows a dependency whose right-hand side is part of some candidate key",
            "BCNF forbids NULLs, while 3NF allows them",
            "BCNF requires surrogate keys, while 3NF allows natural keys",
            "BCNF only applies to tables with a single-column key",
          ],
          correctIndex: 0,
          explanation:
            "3NF's exception for prime attributes is the gap BCNF closes. It only matters for tables with overlapping composite candidate keys, which is why most 3NF designs are already in BCNF.",
        },
        {
          id: "sql-normalization-q11",
          prompt:
            "You want to guarantee that `orders.discount` never exceeds the `max_discount` of the customer's tier, which lives in another table. Will a `CHECK` constraint do it?",
          options: [
            "No: PostgreSQL `CHECK` constraints may only depend on the row being checked; use a trigger or restructure the data",
            "Yes: `CHECK` constraints can contain subqueries against other tables",
            "Yes, as long as the other table has a primary key",
            "No: PostgreSQL parses `CHECK` constraints but never enforces them",
          ],
          correctIndex: 0,
          explanation:
            "PostgreSQL rejects subqueries in `CHECK` constraints and documents that constraints referencing other rows or tables aren't supported (hiding the lookup in a function gives wrong results after later changes). Cross-table rules need a trigger, a composite foreign key, or application logic with proper locking.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "sql-select-filtering",
      moduleId: "be-sql",
      trackId: "backend",
      title: "SELECT, Filtering & NULL Semantics",
      summary:
        "A `SELECT` is evaluated in a logical order that has little to do with how it's written: `FROM` and joins, then `WHERE`, `GROUP BY`, `HAVING`, the select list, `DISTINCT`, `ORDER BY`, and finally `LIMIT`/`OFFSET`. That order explains why a column alias can't be used in `WHERE`, why `WHERE` can't filter on an aggregate, and why rows have no guaranteed order without `ORDER BY`, however many times the same order has come back.\n\nSQL uses three-valued logic. Any comparison with NULL yields NULL (unknown), and `WHERE` keeps only rows where the predicate is TRUE. So `col = NULL` never matches, `col <> 'x'` silently drops the NULL rows (use `IS DISTINCT FROM` when NULL should count as different), and `x NOT IN (subquery)` returns nothing at all once the subquery yields a single NULL. `NOT EXISTS` is the null-safe anti-join.\n\nFiltering is also where index use is won or lost. A predicate is only index-friendly when the indexed column appears bare: `LIKE 'abc%'` can use a B-tree (in PostgreSQL only with a `text_pattern_ops` index or the C collation), `LIKE '%abc'` can't, and `created_at::date = '2026-09-01'` hides the column behind a cast. Two habits cause most of the pain in production. `SELECT *` drags unused and TOASTed columns over the wire and rules out index-only scans. Deep `OFFSET` pagination makes the database produce and discard every skipped row; keyset pagination (`WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 20`) stays fast at any depth, provided the ordering ends in a unique tie-breaker.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "PostgreSQL 18 docs: SELECT", url: "https://www.postgresql.org/docs/18/sql-select.html", kind: "docs" },
        { label: "PostgreSQL 18 docs: Comparison Functions and Operators", url: "https://www.postgresql.org/docs/18/functions-comparison.html", kind: "docs" },
        { label: "Use The Index, Luke: Indexing LIKE Filters", url: "https://use-the-index-luke.com/sql/where-clause/searching-for-ranges/like-performance-tuning", kind: "article" },
        { label: "Use The Index, Luke: We need tool support for keyset pagination (No Offset)", url: "https://use-the-index-luke.com/no-offset", kind: "article" },
      ],
      video: {
        title: "SQL Tutorial - Full Database Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
        videoId: "HXV3zeQKqGY",
        durationLabel: "4:20:39",
        startSeconds: 6971,
        chapterLabel: "Basic Queries",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "sql-select-filtering-q1",
          prompt:
            "`banned` has 3 rows, and one of them has `user_id = NULL`. What does this return?\n\n```sql\nSELECT count(*)\nFROM users\nWHERE id NOT IN (SELECT user_id FROM banned);\n```",
          options: [
            "`0`",
            "The number of users who aren't banned",
            "The total number of users",
            "An error, because the subquery returns a NULL",
          ],
          correctIndex: 0,
          explanation:
            "`id NOT IN (a, b, NULL)` means `id <> a AND id <> b AND id <> NULL`. The last term is NULL, so the predicate is FALSE or NULL for every row and never TRUE: everything is filtered out and `count(*)` returns 0 rather than raising an error.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-select-filtering-q2",
          prompt:
            "Which rewrites of that query return the users who aren't banned, even when `banned.user_id` contains NULLs? (Select all that apply.)",
          options: [
            "`WHERE NOT EXISTS (SELECT 1 FROM banned b WHERE b.user_id = users.id)`",
            "`LEFT JOIN banned b ON b.user_id = users.id WHERE b.user_id IS NULL`",
            "`WHERE id NOT IN (SELECT user_id FROM banned WHERE user_id IS NOT NULL)`",
            "`WHERE id <> ALL (SELECT user_id FROM banned)`",
            "`WHERE id NOT IN (SELECT DISTINCT user_id FROM banned)`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`NOT EXISTS` and the LEFT JOIN anti-join only look for matching rows, so NULLs in `banned` are irrelevant, and filtering the NULLs out repairs `NOT IN`. `<> ALL` is the same predicate as `NOT IN`, and `DISTINCT` keeps one NULL, so both still return nothing.",
        },
        {
          id: "sql-select-filtering-q3",
          prompt: "What does `SELECT * FROM tasks WHERE deleted_at = NULL` return?",
          options: [
            "No rows, ever: `= NULL` evaluates to NULL, which `WHERE` treats as not true",
            "The tasks that haven't been deleted",
            "Every row, because comparisons with NULL are ignored",
            "A syntax error, because NULL can only be compared with `IS`",
          ],
          correctIndex: 0,
          explanation:
            "Write `deleted_at IS NULL`. PostgreSQL has a `transform_null_equals` setting that rewrites `= NULL`, but it's off by default and exists only for compatibility with old clients.",
        },
        {
          id: "sql-select-filtering-q4",
          prompt:
            "`users(email)` has a default B-tree index, and the database uses the `en_US.UTF-8` collation. Which predicates can that index support? (Select all that apply.)",
          options: [
            "`email = 'ann@example.com'`",
            "`email > 'm'`",
            "`email LIKE 'ann%'`",
            "`lower(email) = 'ann@example.com'`",
            "`email LIKE '%@example.com'`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Equality and range comparisons use the index's own collation-aware order. Outside the C collation, a prefix `LIKE` needs an index built with `text_pattern_ops`; `lower(email)` needs an expression index; and a leading wildcard can't use a B-tree at all (a trigram GIN index can).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-select-filtering-q5",
          prompt:
            "Why does this query fail in PostgreSQL?\n\n```sql\nSELECT price * quantity AS total\nFROM order_items\nWHERE total > 100;\n```",
          options: [
            "`WHERE` is evaluated before the select list, so the alias `total` doesn't exist yet",
            "Arithmetic isn't allowed in the select list when there's a `WHERE` clause",
            "`total` is a reserved word",
            "Column aliases must be wrapped in double quotes",
          ],
          correctIndex: 0,
          explanation:
            "Repeat the expression or wrap the query in a subquery or CTE. `ORDER BY` runs after the select list, which is why `ORDER BY total` works.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-select-filtering-q6",
          prompt:
            "An admin page uses `ORDER BY created_at DESC LIMIT 50 OFFSET 200000` and gets slower the further users page. What's happening, and what's the usual fix?",
          options: [
            "The database produces and throws away 200,000 rows before returning 50; switch to keyset pagination on `(created_at, id)` with a matching index",
            "`OFFSET` disables index use; add an index hint",
            "`LIMIT` is applied before `ORDER BY`; swap the clauses",
            "`OFFSET` results can't be cached; enable a query cache",
          ],
          correctIndex: 0,
          explanation:
            "Even with an index on `created_at`, skipped rows still have to be walked. Keyset pagination seeks straight past the last row seen: `WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 50`. PostgreSQL has no index hints.",
        },
        {
          id: "sql-select-filtering-q7",
          prompt:
            "Pages are fetched with `ORDER BY created_at LIMIT 20 OFFSET n`, and thousands of rows share the same `created_at` from a bulk import. What can users see?",
          options: [
            "Rows repeated on two pages or skipped entirely, because the order of tied rows isn't deterministic between queries",
            "An error, because `ORDER BY` needs unique values",
            "Always the same order, because PostgreSQL returns ties in insertion order",
            "Only the first row of each group of ties",
          ],
          correctIndex: 0,
          explanation:
            "SQL only orders by what you list. Ties can come back in any order, and a different plan (or a parallel scan) can change it between requests. End the ordering with a unique tie-breaker such as `ORDER BY created_at, id`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-select-filtering-q8",
          prompt: "Which are real costs of `SELECT *` in application queries? (Select all that apply.)",
          options: [
            "It rules out index-only scans, because every column has to come from the table",
            "It fetches large TOASTed columns (JSON, text, bytea) that the code never reads and ships them over the network",
            "Code that depends on the column count or order breaks, or silently changes, when a column is added",
            "It stops the `WHERE` clause from using indexes",
            "It makes rows come back in a random order",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Fetching columns you don't need costs I/O, memory and bandwidth, and ties code to the table's current shape. It has no effect on whether the `WHERE` clause can use an index, or on row order.",
        },
        {
          id: "sql-select-filtering-q9",
          prompt: "In PostgreSQL, where do NULLs appear with `ORDER BY last_login DESC`?",
          options: [
            "First: NULLs sort as larger than every value by default, so `DESC` puts them first",
            "Last, whatever the direction",
            "They're left out of the result",
            "In an unpredictable position among the other rows",
          ],
          correctIndex: 0,
          explanation:
            "The default is `NULLS LAST` for `ASC` and `NULLS FIRST` for `DESC`. Write `ORDER BY last_login DESC NULLS LAST` to push never-logged-in users to the bottom, and declare the index the same way if you want it to supply that order.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-select-filtering-q10",
          prompt:
            "`status` is nullable. Which predicate returns the rows where `status` is NULL as well as the rows with any status other than `'active'`?",
          options: [
            "`status IS DISTINCT FROM 'active'`",
            "`status <> 'active'`",
            "`NOT (status = 'active')`",
            "`status != 'active'`",
          ],
          correctIndex: 0,
          explanation:
            "`<>`, `!=` and `NOT (... = ...)` all evaluate to NULL when `status` is NULL, so those rows are dropped. `IS DISTINCT FROM` treats NULL as an ordinary, comparable value.",
        },
        {
          id: "sql-select-filtering-q11",
          prompt:
            "`created_at` is a `timestamptz`. Why does this miss almost all of January 31?\n\n```sql\nWHERE created_at BETWEEN '2026-01-01' AND '2026-01-31'\n```",
          options: [
            "The upper bound means midnight at the start of January 31, so later timestamps that day are excluded; use `>= '2026-01-01' AND < '2026-02-01'`",
            "`BETWEEN` excludes both endpoints",
            "String literals can't be compared with timestamps",
            "`BETWEEN` only works on integer columns",
          ],
          correctIndex: 0,
          explanation:
            "`BETWEEN` is inclusive, but `'2026-01-31'` becomes `2026-01-31 00:00:00`. A half-open range is correct at any precision and still uses a B-tree index on `created_at`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "sql-joins",
      moduleId: "be-sql",
      trackId: "backend",
      title: "Joins Deep Dive: Semantics & Algorithms",
      summary:
        "A join is a filtered Cartesian product: conceptually every left row is paired with every right row, and pairs are kept when the `ON` condition is TRUE. Outer joins then add back unmatched rows padded with NULLs (`LEFT` keeps unmatched left rows, `RIGHT` unmatched right rows, `FULL` both). Because `ON` uses three-valued logic, a NULL key never matches anything, not even another NULL.\n\nTwo classic bugs come straight from those semantics. A condition on the right-hand table placed in `WHERE` instead of `ON` discards the NULL-padded rows and silently turns a `LEFT JOIN` into an inner join. And joining a parent to two independent one-to-many children multiplies rows (3 items × 4 payments = 12 rows per order), so a `SUM` over the result is inflated. Aggregate each child in its own subquery, or use `EXISTS` when you only need to know that a match exists.\n\nThe planner has three physical algorithms. A nested loop probes the inner side once per outer row: ideal when the outer side is small and the inner side has an index on the join key. A hash join builds a hash table on the smaller input and streams the other through it: linear time and no index needed, but equality conditions only, and it needs memory (`work_mem`, beyond which it spills in batches). A merge join walks two inputs sorted on the key, which pays off when an index already provides the order. A nested loop chosen because the outer side was estimated at 1 row but is really 50,000 is one of the most common reasons a query is fast in staging and takes minutes in production.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "PostgreSQL 18 docs: Table Expressions (joined tables)", url: "https://www.postgresql.org/docs/18/queries-table-expressions.html#QUERIES-JOIN", kind: "docs" },
        { label: "PostgreSQL 18 docs: Planner/Optimizer (join strategies)", url: "https://www.postgresql.org/docs/18/planner-optimizer.html", kind: "docs" },
        { label: "Use The Index, Luke: Hash Join", url: "https://use-the-index-luke.com/sql/join/hash-join-partial-objects", kind: "article" },
      ],
      video: {
        title: "SQL Tutorial - Full Database Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
        videoId: "HXV3zeQKqGY",
        durationLabel: "4:20:39",
        startSeconds: 10896,
        chapterLabel: "Joins",
      },
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `hashJoin(left, right, type, leftKey, rightKey)`: a hash equi-join over arrays of row objects, matching rows where `left[i][leftKey] === right[j][rightKey]`.\n\n- `type` is `\"inner\"`, `\"left\"`, `\"right\"` or `\"full\"`. Any other value throws an `Error`.\n- Return an array of `{ left, right }` pairs holding the original row objects. The missing side of an unmatched row is `null`.\n- A key that is `null`, `undefined` or missing never matches anything, not even another NULL key (SQL semantics). Such rows still appear, unmatched, in outer joins.\n- Keys compare with `===`, so `1` and `\"1\"` don't match.\n- A key that matches several rows produces one pair per match, so a many-to-many key produces every combination.\n- Order for `inner`, `left` and `full`: walk `left` in order; each left row is followed by its matches in `right` order, or by one `{ left, right: null }` pair if it's unmatched in a left or full join. A full join then appends the unmatched right rows, in `right` order, as `{ left: null, right }`.\n- Order for `right`: walk `right` in order; each right row is followed by its matches in `left` order, or by one `{ left: null, right }` pair.\n- Build a hash index (a `Map`) on one side and probe it with the other; don't compare every pair. The driver counts how often join keys are read: reading each row's key at most twice passes, while a nested loop over 3,000 × 3,000 rows doesn't.\n\nThe tests call `runJoin(type, left, right, leftKey, rightKey, mode)`. With `mode` `\"rows\"` it returns your pairs as plain data; with `\"budget\"` it returns `{ pairs, withinReadBudget }`. If `hashJoin` throws, it returns `{ threw: true }`. Leave the driver as it is.",
        starterCode: `/**
 * @param {object[]} left
 * @param {object[]} right
 * @param {"inner" | "left" | "right" | "full"} type
 * @param {string} leftKey
 * @param {string} rightKey
 * @returns {{ left: object | null, right: object | null }[]}
 */
function hashJoin(left, right, type, leftKey, rightKey) {
  // Your code here
}

// ---- Test driver (leave as is) ----
function runJoin(type, left, right, leftKey, rightKey, mode) {
  let reads = 0;
  let counting = true;
  const instrument = (rows, key) =>
    rows.map((row) => {
      const copy = {};
      for (const name of Object.keys(row)) {
        const value = row[name];
        if (name === key) {
          Object.defineProperty(copy, name, {
            enumerable: true,
            get() {
              if (counting) reads++;
              return value;
            },
          });
        } else {
          copy[name] = value;
        }
      }
      return copy;
    });
  const l = instrument(left, leftKey);
  const r = instrument(right, rightKey);
  let result;
  try {
    result = hashJoin(l, r, type, leftKey, rightKey);
  } catch (e) {
    return { threw: true };
  }
  counting = false;
  if (!Array.isArray(result)) return { notAnArray: true };
  if (mode === "budget") {
    return { pairs: result.length, withinReadBudget: reads <= 2 * (left.length + right.length) };
  }
  return JSON.parse(JSON.stringify(result));
}
`,
        functionName: "runJoin",
        testCases: [
          {
            description: "inner join keeps only matching pairs, left order then right order",
            args: [
              "inner",
              [{ id: 1, name: "Ada" }, { id: 2, name: "Grace" }, { id: 3, name: "Linus" }],
              [{ oid: 10, cid: 1 }, { oid: 11, cid: 1 }, { oid: 12, cid: 3 }, { oid: 13, cid: 4 }],
              "id",
              "cid",
              "rows",
            ],
            expected: [
              { left: { id: 1, name: "Ada" }, right: { oid: 10, cid: 1 } },
              { left: { id: 1, name: "Ada" }, right: { oid: 11, cid: 1 } },
              { left: { id: 3, name: "Linus" }, right: { oid: 12, cid: 3 } },
            ],
          },
          {
            description: "left join keeps an unmatched left row in place with right: null",
            args: [
              "left",
              [{ id: 1, name: "Ada" }, { id: 2, name: "Grace" }, { id: 3, name: "Linus" }],
              [{ oid: 10, cid: 1 }, { oid: 11, cid: 1 }, { oid: 12, cid: 3 }, { oid: 13, cid: 4 }],
              "id",
              "cid",
              "rows",
            ],
            expected: [
              { left: { id: 1, name: "Ada" }, right: { oid: 10, cid: 1 } },
              { left: { id: 1, name: "Ada" }, right: { oid: 11, cid: 1 } },
              { left: { id: 2, name: "Grace" }, right: null },
              { left: { id: 3, name: "Linus" }, right: { oid: 12, cid: 3 } },
            ],
          },
          {
            description: "right join walks the right side and pads unmatched rows with left: null",
            args: [
              "right",
              [{ id: 1, name: "Ada" }, { id: 2, name: "Grace" }, { id: 3, name: "Linus" }],
              [{ oid: 10, cid: 1 }, { oid: 11, cid: 1 }, { oid: 12, cid: 3 }, { oid: 13, cid: 4 }],
              "id",
              "cid",
              "rows",
            ],
            expected: [
              { left: { id: 1, name: "Ada" }, right: { oid: 10, cid: 1 } },
              { left: { id: 1, name: "Ada" }, right: { oid: 11, cid: 1 } },
              { left: { id: 3, name: "Linus" }, right: { oid: 12, cid: 3 } },
              { left: null, right: { oid: 13, cid: 4 } },
            ],
          },
          {
            description: "full join appends unmatched right rows after the left-driven rows",
            args: [
              "full",
              [{ id: 1, name: "Ada" }, { id: 2, name: "Grace" }, { id: 3, name: "Linus" }],
              [{ oid: 10, cid: 1 }, { oid: 11, cid: 1 }, { oid: 12, cid: 3 }, { oid: 13, cid: 4 }],
              "id",
              "cid",
              "rows",
            ],
            expected: [
              { left: { id: 1, name: "Ada" }, right: { oid: 10, cid: 1 } },
              { left: { id: 1, name: "Ada" }, right: { oid: 11, cid: 1 } },
              { left: { id: 2, name: "Grace" }, right: null },
              { left: { id: 3, name: "Linus" }, right: { oid: 12, cid: 3 } },
              { left: null, right: { oid: 13, cid: 4 } },
            ],
          },
          {
            description: "many-to-many keys produce every combination",
            args: [
              "inner",
              [{ k: "x", l: 1 }, { k: "x", l: 2 }],
              [{ k: "x", r: 1 }, { k: "x", r: 2 }, { k: "x", r: 3 }],
              "k",
              "k",
              "rows",
            ],
            expected: [
              { left: { k: "x", l: 1 }, right: { k: "x", r: 1 } },
              { left: { k: "x", l: 1 }, right: { k: "x", r: 2 } },
              { left: { k: "x", l: 1 }, right: { k: "x", r: 3 } },
              { left: { k: "x", l: 2 }, right: { k: "x", r: 1 } },
              { left: { k: "x", l: 2 }, right: { k: "x", r: 2 } },
              { left: { k: "x", l: 2 }, right: { k: "x", r: 3 } },
            ],
          },
          {
            description: "NULL and missing keys never match, not even each other (inner join)",
            args: [
              "inner",
              [{ id: null, n: "a" }, { n: "b" }, { id: 1, n: "c" }],
              [{ k: null, m: "x" }, { k: 1, m: "y" }, { m: "z" }],
              "id",
              "k",
              "rows",
            ],
            expected: [{ left: { id: 1, n: "c" }, right: { k: 1, m: "y" } }],
            isEdgeCase: true,
          },
          {
            description: "in a full join, NULL-keyed rows from both sides appear unmatched",
            args: [
              "full",
              [{ id: null, n: "a" }, { n: "b" }, { id: 1, n: "c" }],
              [{ k: null, m: "x" }, { k: 1, m: "y" }, { m: "z" }],
              "id",
              "k",
              "rows",
            ],
            expected: [
              { left: { id: null, n: "a" }, right: null },
              { left: { n: "b" }, right: null },
              { left: { id: 1, n: "c" }, right: { k: 1, m: "y" } },
              { left: null, right: { k: null, m: "x" } },
              { left: null, right: { m: "z" } },
            ],
            isEdgeCase: true,
          },
          {
            description: "keys compare strictly: 1 doesn't match \"1\"",
            args: ["inner", [{ id: 1 }], [{ id: "1" }], "id", "id", "rows"],
            expected: [],
            isEdgeCase: true,
          },
          {
            description: "left join against an empty right side keeps every left row",
            args: ["left", [{ id: 1 }, { id: 2 }], [], "id", "id", "rows"],
            expected: [
              { left: { id: 1 }, right: null },
              { left: { id: 2 }, right: null },
            ],
            isEdgeCase: true,
          },
          {
            description: "full join with an empty left side returns every right row",
            args: ["full", [], [{ id: 7 }], "id", "id", "rows"],
            expected: [{ left: null, right: { id: 7 } }],
            isEdgeCase: true,
          },
          {
            description: "3,000 × 3,000 rows: 9,000 pairs, each key read at most twice (no nested loop)",
            args: ["inner", bigJoinSide, bigJoinSide, "k", "k", "budget"],
            expected: { pairs: 9000, withinReadBudget: true },
            isEdgeCase: true,
          },
          {
            description: "an unsupported join type throws",
            args: ["cross", [{ id: 1 }], [{ id: 1 }], "id", "id", "rows"],
            expected: { threw: true },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "sql-aggregation-group-by",
      moduleId: "be-sql",
      trackId: "backend",
      title: "Aggregation, GROUP BY & HAVING",
      summary:
        "`GROUP BY` collapses each set of rows with equal grouping values into one output row, and aggregates summarize the rows that were collapsed. The rules that trip people up are about when things happen and what NULL means. `WHERE` filters rows before grouping; `HAVING` filters groups after aggregation, so `HAVING count(*) > 5` works and `WHERE count(*) > 5` doesn't. Every column in the select list must be grouped or aggregated, with one PostgreSQL convenience: group by a table's primary key and you may select that table's other columns, because they're functionally dependent on it.\n\nNULL handling is asymmetric. `count(*)` counts rows, while `count(col)` and every other aggregate skip NULLs. `sum` over zero non-NULL values is NULL, not 0 (wrap it in `COALESCE` for reports), and `avg` ignores NULLs instead of treating them as zero, which changes the answer. Grouping, unlike joining, puts all NULLs into one group. And an aggregate query without `GROUP BY` always returns exactly one row, even over an empty table (`count` 0, `sum` NULL), whereas the same query with `GROUP BY` over no rows returns nothing.\n\nPhysically, PostgreSQL either sorts and streams (GroupAggregate, which can use an index that already provides the order) or builds a hash table (HashAggregate, which spills to disk beyond its memory budget). Conditional aggregates read best with `FILTER`: `count(*) FILTER (WHERE status = 'failed')` computes several counts in one pass. And watch for join fan-out before aggregating: joining orders to both items and payments multiplies rows and inflates every sum.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "PostgreSQL 18 docs: Aggregate Functions", url: "https://www.postgresql.org/docs/18/functions-aggregate.html", kind: "docs" },
        { label: "PostgreSQL 18 docs: The GROUP BY and HAVING Clauses", url: "https://www.postgresql.org/docs/18/queries-table-expressions.html#QUERIES-GROUP", kind: "docs" },
        { label: "Modern SQL: FILTER (conditional aggregates)", url: "https://modern-sql.com/feature/filter", kind: "article" },
        { label: "Use The Index, Luke: Indexing GROUP BY", url: "https://use-the-index-luke.com/sql/sorting-grouping/indexed-group-by", kind: "article" },
      ],
      video: {
        title: "SQL Tutorial - Full Database Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
        videoId: "HXV3zeQKqGY",
        durationLabel: "4:20:39",
        startSeconds: 9384,
        chapterLabel: "Functions",
      },
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `groupAggregate(rows, spec)`: a small `GROUP BY` engine with SQL's NULL rules. `rows` is an array of plain objects; a value that is `null`, `undefined` or missing counts as NULL.\n\n`spec` has:\n\n- `groupBy`: an array of column names (possibly empty).\n- `aggregates`: an array of `{ fn, column, as }`, where `fn` is `\"count\"`, `\"sum\"`, `\"avg\"`, `\"min\"`, `\"max\"` or `\"countDistinct\"`. `count` without a `column` is `COUNT(*)`.\n- `having` (optional): an array of `{ column, op, value }` conditions that must all hold. `column` names a group column or an aggregate's `as`; `op` is `\"=\"`, `\"!=\"`, `\"<\"`, `\"<=\"`, `\">\"` or `\">=\"`.\n\nRules:\n\n- Return one object per group: the group columns (NULL as `null`), then each aggregate under its `as` name. Groups appear in order of first appearance.\n- All NULLs in a group column fall into one group.\n- `count(*)` counts rows; `count(column)` counts non-NULL values; `countDistinct(column)` counts distinct non-NULL values. `sum`, `avg`, `min` and `max` ignore NULLs and return `null` when a group has no non-NULL values.\n- With an empty `groupBy`, the whole input is one group and the result always has exactly one row, even for empty input. With a non-empty `groupBy`, empty input returns `[]`.\n- A `having` comparison involving NULL is unknown, so the group is dropped. That includes `!=`.\n- An unknown `fn` or `op` throws an `Error`.\n\nThe tests call `runGroupBy(rows, spec)`, which returns your rows, or `{ threw: true }` if `groupAggregate` throws. Leave the driver as it is.",
        starterCode: `/**
 * @param {object[]} rows
 * @param {{ groupBy: string[], aggregates: { fn: string, column?: string, as: string }[], having?: { column: string, op: string, value: unknown }[] }} spec
 * @returns {object[]}
 */
function groupAggregate(rows, spec) {
  // Your code here
}

// ---- Test driver (leave as is) ----
function runGroupBy(rows, spec) {
  try {
    return groupAggregate(rows, spec);
  } catch (e) {
    return { threw: true };
  }
}
`,
        functionName: "runGroupBy",
        testCases: [
          {
            description: "COUNT(*) counts rows, COUNT(bonus) skips NULL and missing bonuses",
            args: [
              employees,
              {
                groupBy: ["dept"],
                aggregates: [
                  { fn: "count", as: "n" },
                  { fn: "count", column: "bonus", as: "withBonus" },
                ],
              },
            ],
            expected: [
              { dept: "eng", n: 3, withBonus: 2 },
              { dept: "ops", n: 1, withBonus: 0 },
              { dept: null, n: 2, withBonus: 1 },
            ],
          },
          {
            description: "SUM, AVG, MIN and MAX ignore NULLs",
            args: [
              employees,
              {
                groupBy: ["dept"],
                aggregates: [
                  { fn: "sum", column: "salary", as: "total" },
                  { fn: "avg", column: "salary", as: "avgSalary" },
                  { fn: "min", column: "salary", as: "lo" },
                  { fn: "max", column: "salary", as: "hi" },
                ],
              },
            ],
            expected: [
              { dept: "eng", total: 300, avgSalary: 150, lo: 100, hi: 200 },
              { dept: "ops", total: 150, avgSalary: 150, lo: 150, hi: 150 },
              { dept: null, total: 120, avgSalary: 60, lo: 50, hi: 70 },
            ],
          },
          {
            description: "HAVING filters groups on an aggregate",
            args: [
              employees,
              {
                groupBy: ["dept"],
                aggregates: [{ fn: "count", as: "n" }],
                having: [{ column: "n", op: ">=", value: 2 }],
              },
            ],
            expected: [
              { dept: "eng", n: 3 },
              { dept: null, n: 2 },
            ],
          },
          {
            description: "grouping by two columns keeps first-appearance order",
            args: [
              employees,
              {
                groupBy: ["dept", "level"],
                aggregates: [
                  { fn: "count", as: "n" },
                  { fn: "sum", column: "salary", as: "total" },
                ],
              },
            ],
            expected: [
              { dept: "eng", level: 2, n: 2, total: 100 },
              { dept: "eng", level: 3, n: 1, total: 200 },
              { dept: "ops", level: 2, n: 1, total: 150 },
              { dept: null, level: 1, n: 2, total: 120 },
            ],
          },
          {
            description: "countDistinct skips NULLs",
            args: [employees, { groupBy: ["level"], aggregates: [{ fn: "countDistinct", column: "dept", as: "depts" }] }],
            expected: [
              { level: 2, depts: 2 },
              { level: 3, depts: 1 },
              { level: 1, depts: 0 },
            ],
          },
          {
            description: "null and missing group values form a single NULL group",
            args: [
              [{ k: null, v: 1 }, { v: 2 }, { k: "x", v: 3 }],
              { groupBy: ["k"], aggregates: [{ fn: "count", as: "n" }] },
            ],
            expected: [
              { k: null, n: 2 },
              { k: "x", n: 1 },
            ],
            isEdgeCase: true,
          },
          {
            description: "no GROUP BY over empty input still returns one row (count 0, sum NULL)",
            args: [
              [],
              {
                groupBy: [],
                aggregates: [
                  { fn: "count", as: "n" },
                  { fn: "sum", column: "salary", as: "total" },
                  { fn: "avg", column: "salary", as: "avgSalary" },
                  { fn: "max", column: "salary", as: "top" },
                  { fn: "countDistinct", column: "dept", as: "depts" },
                ],
              },
            ],
            expected: [{ n: 0, total: null, avgSalary: null, top: null, depts: 0 }],
            isEdgeCase: true,
          },
          {
            description: "GROUP BY over empty input returns no rows",
            args: [[], { groupBy: ["dept"], aggregates: [{ fn: "count", as: "n" }] }],
            expected: [],
            isEdgeCase: true,
          },
          {
            description: "a group whose column is entirely NULL: SUM/AVG/MIN are NULL, COUNT(col) is 0",
            args: [
              [{ g: "a", x: null }, { g: "a" }, { g: "b", x: 4 }],
              {
                groupBy: ["g"],
                aggregates: [
                  { fn: "count", as: "n" },
                  { fn: "count", column: "x", as: "cx" },
                  { fn: "sum", column: "x", as: "s" },
                  { fn: "avg", column: "x", as: "a" },
                  { fn: "min", column: "x", as: "mn" },
                ],
              },
            ],
            expected: [
              { g: "a", n: 2, cx: 0, s: null, a: null, mn: null },
              { g: "b", n: 1, cx: 1, s: 4, a: 4, mn: 4 },
            ],
            isEdgeCase: true,
          },
          {
            description: "HAVING against a NULL aggregate is unknown, even with !=",
            args: [
              employees,
              {
                groupBy: ["dept"],
                aggregates: [{ fn: "avg", column: "bonus", as: "avgBonus" }],
                having: [{ column: "avgBonus", op: "!=", value: 10 }],
              },
            ],
            expected: [
              { dept: "eng", avgBonus: 15 },
              { dept: null, avgBonus: 5 },
            ],
            isEdgeCase: true,
          },
          {
            description: "an unknown aggregate function throws",
            args: [employees, { groupBy: ["dept"], aggregates: [{ fn: "median", column: "salary", as: "m" }] }],
            expected: { threw: true },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "sql-subqueries-ctes",
      moduleId: "be-sql",
      trackId: "backend",
      title: "Subqueries, CTEs & Window Functions",
      summary:
        "Subqueries, CTEs and window functions are how SQL expresses multi-step logic without leaving the database. A scalar subquery returns one value, `IN` and `EXISTS` subqueries are semi-joins, and a correlated subquery references the outer row. The planner turns many subqueries into joins, but a correlated subquery in the select list usually runs once per outer row (a SubPlan in `EXPLAIN`): an N+1 inside the database, fine with an index and painful without one. `LATERAL` makes the per-row intent explicit and is the idiomatic way to fetch the top N rows per group.\n\nA CTE (`WITH`) names an intermediate result. Since PostgreSQL 12, a non-recursive, side-effect-free CTE referenced once is inlined into the main query, so outer predicates are pushed into it; one referenced more than once is computed once and materialized, which can hide indexes from outer filters. `AS MATERIALIZED` and `AS NOT MATERIALIZED` override the default. Data-modifying CTEs (`WITH moved AS (DELETE ... RETURNING *) INSERT ...`) run exactly once and share one snapshot, so they can't see each other's changes. Recursive CTEs walk trees and graphs; `UNION` instead of `UNION ALL`, or the `CYCLE` clause, stops them looping on cycles.\n\nWindow functions compute across related rows without collapsing them: rankings, running totals, `lag`/`lead` comparisons, moving averages. They're evaluated after `WHERE`, `GROUP BY` and `HAVING`, so filtering on one needs a subquery or CTE. The frame is the classic trap: with `ORDER BY` and no explicit frame, the default is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, which includes the current row's peers (ties) and makes `last_value` return the current row's value rather than the partition's last.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "PostgreSQL 18 docs: WITH Queries (Common Table Expressions)", url: "https://www.postgresql.org/docs/18/queries-with.html", kind: "docs" },
        { label: "PostgreSQL 18 docs: Window Functions (tutorial)", url: "https://www.postgresql.org/docs/18/tutorial-window.html", kind: "docs" },
        { label: "PostgreSQL 18 docs: Subquery Expressions", url: "https://www.postgresql.org/docs/18/functions-subquery.html", kind: "docs" },
        { label: "Modern SQL: WITH (common table expressions)", url: "https://modern-sql.com/feature/with", kind: "article" },
      ],
      video: {
        title: "SQL Tutorial - Full Database Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
        videoId: "HXV3zeQKqGY",
        durationLabel: "4:20:39",
        startSeconds: 11509,
        chapterLabel: "Nested Queries",
      },
      alternateVideos: [
        {
          title: "SQL WITH Clause | How to write SQL Queries using WITH Clause | SQL CTE (Common Table Expression)",
          channel: "techTFQ",
          url: "https://www.youtube.com/watch?v=QNfnuK-1YYY",
          videoId: "QNfnuK-1YYY",
          durationLabel: "24:47",
        },
        {
          title: "SQL Window Function | How to write SQL Query using RANK, DENSE RANK, LEAD/LAG | SQL Queries Tutorial",
          channel: "techTFQ",
          url: "https://www.youtube.com/watch?v=Ww71knvhQ-s",
          videoId: "Ww71knvhQ-s",
          durationLabel: "24:54",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "sql-subqueries-ctes-q1",
          prompt:
            "Scores are 90, 90 and 80. With `OVER (ORDER BY score DESC)`, what do `row_number()`, `rank()` and `dense_rank()` return for the 80?",
          options: ["`3`, `3`, `2`", "`3`, `2`, `2`", "`3`, `3`, `3`", "`2`, `3`, `2`"],
          correctIndex: 0,
          explanation:
            "`row_number` numbers rows 1, 2, 3 (the two 90s in an arbitrary order); `rank` gives ties the same rank and then skips (1, 1, 3); `dense_rank` doesn't skip (1, 1, 2).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-subqueries-ctes-q2",
          prompt:
            "Why does this fail?\n\n```sql\nSELECT id, customer_id,\n       row_number() OVER (PARTITION BY customer_id ORDER BY created_at DESC) AS rn\nFROM orders\nWHERE rn <= 3;\n```",
          options: [
            "Window functions are computed after `WHERE`, so `rn` doesn't exist there; filter in an outer query or CTE",
            "`row_number()` can't be combined with `PARTITION BY`",
            "`rn` is a reserved word",
            "Window functions require a `GROUP BY` clause",
          ],
          correctIndex: 0,
          explanation:
            "Window functions run after `WHERE`, `GROUP BY` and `HAVING` and can't appear in them. Wrap it: `SELECT * FROM (SELECT ..., row_number() OVER (...) AS rn FROM orders) t WHERE rn <= 3`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-subqueries-ctes-q3",
          prompt:
            "What does `max_in_dept` contain?\n\n```sql\nSELECT name, dept, salary,\n       last_value(salary) OVER (PARTITION BY dept ORDER BY salary) AS max_in_dept\nFROM employees;\n```",
          options: [
            "Each row's own salary (the last of its tied peers), not the department maximum",
            "The highest salary in each department",
            "The lowest salary in each department",
            "NULL, because `last_value` only works with a `ROWS` frame",
          ],
          correctIndex: 0,
          explanation:
            "With `ORDER BY` and no frame clause, the frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, so it ends at the current row's peer group. Add `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`, or use `max(salary) OVER (PARTITION BY dept)`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-subqueries-ctes-q4",
          prompt:
            "A running total uses `sum(amount) OVER (ORDER BY day)`, and two rows share the same `day`. What do those two rows show?",
          options: [
            "The same running total, already including both rows, because the default RANGE frame treats tied rows as peers",
            "Two different totals, increasing row by row",
            "NULL for the second row",
            "An error, because the window's `ORDER BY` must be unique",
          ],
          correctIndex: 0,
          explanation:
            "Peers enter the frame together. For a strictly row-by-row total, use `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` and add a unique tie-breaker (`ORDER BY day, id`) so the order is deterministic.",
        },
        {
          id: "sql-subqueries-ctes-q5",
          prompt:
            "On PostgreSQL 12 or later, can this use an index on `orders(customer_id)`?\n\n```sql\nWITH recent AS (\n  SELECT * FROM orders WHERE created_at > now() - interval '1 day'\n)\nSELECT * FROM recent WHERE customer_id = 42;\n```",
          options: [
            "Yes: a side-effect-free CTE referenced once is inlined, so `customer_id = 42` is pushed into the scan of `orders`",
            "No: CTEs are always materialized first and act as an optimization fence",
            "Only if the CTE is declared `RECURSIVE`",
            "Only if you add a `LIMIT` inside the CTE",
          ],
          correctIndex: 0,
          explanation:
            "Before PostgreSQL 12 every CTE was an optimization fence, which is why old advice says to avoid them. Since 12, a non-recursive, side-effect-free CTE referenced once is folded into the outer query unless you write `AS MATERIALIZED`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-subqueries-ctes-q6",
          prompt:
            "In PostgreSQL 18, which CTEs are evaluated separately (not folded into the main query) by default? (Select all that apply.)",
          options: [
            "A CTE referenced twice in the main query",
            "A `WITH RECURSIVE` CTE",
            "A CTE containing `UPDATE ... RETURNING`",
            "A CTE that calls a volatile function such as `random()`",
            "A plain `SELECT` CTE referenced once",
            "Any CTE with a `WHERE` clause",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Only non-recursive, side-effect-free CTEs referenced once are folded by default. Multiple references, recursion, data-modifying statements and volatile functions all keep the CTE as a separately evaluated step; `NOT MATERIALIZED` can force inlining in the multiple-reference case.",
        },
        {
          id: "sql-subqueries-ctes-q7",
          prompt:
            "What does the final `SELECT` return?\n\n```sql\nWITH t AS (\n  UPDATE products SET price = price * 1.1 RETURNING *\n)\nSELECT * FROM products;\n```",
          options: [
            "The old prices: the whole statement runs against one snapshot, so the main query can't see the CTE's update",
            "The new prices, because the CTE runs first",
            "Unchanged prices, because a CTE that isn't referenced is skipped and never runs",
            "An error: data-modifying statements aren't allowed in `WITH`",
          ],
          correctIndex: 0,
          explanation:
            "Data-modifying CTEs always run exactly once, even when unreferenced, but they share a snapshot with the main query. To see the new values, select from `t` (the `RETURNING` output). After the statement, the table does hold the new prices.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-subqueries-ctes-q8",
          prompt:
            "How is this likely to run on a large `customers` table, and what's the set-based alternative?\n\n```sql\nSELECT c.id,\n       (SELECT count(*) FROM orders o WHERE o.customer_id = c.id) AS n\nFROM customers c;\n```",
          options: [
            "As a SubPlan executed once per customer (fast only with an index on `orders.customer_id`); a `LEFT JOIN` with `GROUP BY`, or a `LATERAL` subquery, expresses it as one set operation",
            "As a single hash join, because PostgreSQL always rewrites scalar subqueries into joins",
            "It fails, because a scalar subquery can't reference the outer query",
            "As a Cartesian product of the two tables",
          ],
          correctIndex: 0,
          explanation:
            "The planner flattens many `IN`/`EXISTS` subqueries into semi-joins, but a correlated scalar subquery in the select list is evaluated per outer row. Either aggregate once and join, or make sure each probe is an index lookup.",
        },
        {
          id: "sql-subqueries-ctes-q9",
          prompt: "Which queries return the three most recent orders for each customer? (Select all that apply.)",
          options: [
            "A subquery computing `row_number() OVER (PARTITION BY customer_id ORDER BY created_at DESC)`, filtered to `rn <= 3`",
            "`FROM customers c CROSS JOIN LATERAL (SELECT * FROM orders o WHERE o.customer_id = c.id ORDER BY o.created_at DESC LIMIT 3) o`",
            "`SELECT DISTINCT ON (customer_id) * FROM orders ORDER BY customer_id, created_at DESC`",
            "`SELECT * FROM orders GROUP BY customer_id ORDER BY created_at DESC LIMIT 3`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Both the window and the LATERAL approaches work; with an index on `(customer_id, created_at)`, LATERAL does a tiny index probe per customer. `DISTINCT ON` keeps one row per customer, and the `GROUP BY` query is invalid (and its `LIMIT` would cap the whole result, not each group).",
        },
        {
          id: "sql-subqueries-ctes-q10",
          prompt:
            "A recursive CTE walks `edges(src, dst)`, producing only node ids, and the graph contains a cycle. What difference does `UNION` versus `UNION ALL` make?",
          options: [
            "`UNION` discards rows already produced, so revisiting a node adds nothing and the recursion ends; `UNION ALL` keeps looping until something stops it",
            "None: PostgreSQL detects cycles automatically either way",
            "`UNION ALL` stops at cycles and `UNION` doesn't",
            "Recursive CTEs can only use `UNION ALL`",
          ],
          correctIndex: 0,
          explanation:
            "With `UNION`, rows that duplicate earlier results are dropped from the working table, so it eventually empties. Once rows carry extra columns such as depth or path they're no longer duplicates; then use the `CYCLE` clause or track the path yourself.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-subqueries-ctes-q11",
          prompt: "Which query returns each customer once, even when they have several orders over 100?",
          options: [
            "`SELECT c.* FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.total > 100)`",
            "`SELECT c.* FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.total > 100`",
            "`SELECT c.* FROM customers c LEFT JOIN orders o ON o.customer_id = c.id AND o.total > 100`",
            "`SELECT c.* FROM customers c, orders o WHERE o.total > 100`",
          ],
          correctIndex: 0,
          explanation:
            "`EXISTS` is a semi-join: it stops at the first match and never duplicates the outer row. The inner join repeats a customer once per qualifying order, the LEFT JOIN also returns customers without one, and the last query is a Cartesian product.",
        },
      ],
    },
    {
      id: "sql-indexes-explain",
      moduleId: "be-sql",
      trackId: "backend",
      title: "Indexes & Query Plans: Reading EXPLAIN",
      summary:
        "A B-tree index is a sorted copy of some columns with pointers back to the table, so it helps exactly the queries that can exploit that order: equality and range predicates, `ORDER BY ... LIMIT`, and joins on the key. On a composite index `(a, b)`, equality on `a` plus a range on `b` narrows the scan; a condition on `b` alone traditionally can't. PostgreSQL 18 adds skip scan, which probes the index once per distinct value of `a`: effective when `a` has a handful of values, useless when it has millions. Put equality columns first, then the range or sort column. `INCLUDE` adds payload columns so an index-only scan can answer from the index alone, provided the visibility map marks the pages all-visible. Partial indexes (`WHERE status = 'pending'`) and expression indexes (`lower(email)`) index exactly what queries ask for, while wrapping an indexed column in a function or cast defeats a plain index. Beyond B-tree there are Hash (equality only), GIN (arrays, `jsonb`, full-text), GiST and SP-GiST (ranges, geometry, nearest-neighbour) and BRIN (tiny summaries for huge tables whose physical order tracks a column).\n\n`EXPLAIN` shows the chosen plan and its estimates; `EXPLAIN ANALYZE` actually executes the statement (wrap writes in `BEGIN ... ROLLBACK`) and adds real row counts, timings and, since PostgreSQL 18, buffer usage by default. Read it inside out and compare estimated with actual rows at each node, remembering that actuals are per-loop averages. A large mismatch means stale or insufficient statistics, and it's usually the real cause of a bad plan, such as a nested loop chosen for 1 estimated row that turns out to be 50,000.\n\nIndexes aren't free: every index is maintained on every write, and indexing a frequently updated column disables HOT updates for it.",
      level: "expert",
      estMinutes: 80,
      isMilestone: true,
      webRefs: [
        { label: "PostgreSQL 18 docs: Using EXPLAIN", url: "https://www.postgresql.org/docs/18/using-explain.html", kind: "docs" },
        { label: "PostgreSQL 18 docs: Index Types", url: "https://www.postgresql.org/docs/18/indexes-types.html", kind: "docs" },
        { label: "Use The Index, Luke: Concatenated Indexes", url: "https://use-the-index-luke.com/sql/where-clause/the-equals-operator/concatenated-keys", kind: "article" },
        { label: "Use The Index, Luke: Index-Only Scan (covering index)", url: "https://use-the-index-luke.com/sql/clustering/index-only-scan-covering-index", kind: "article" },
      ],
      video: {
        title: "Database Indexing Explained (with PostgreSQL)",
        channel: "Hussein Nasser",
        url: "https://www.youtube.com/watch?v=-qNSXK7s7_w",
        videoId: "-qNSXK7s7_w",
        durationLabel: "18:18",
      },
      alternateVideos: [
        {
          title: "A beginners guide to EXPLAIN ANALYZE – Michael Christofides",
          channel: "Tiger Data (creators of TimescaleDB)",
          url: "https://www.youtube.com/watch?v=31EmOKBP1PY",
          videoId: "31EmOKBP1PY",
          durationLabel: "30:05",
        },
        {
          title: "Postgres Explain Explained - How Databases Prepare Optimal Query Plans to Execute SQL",
          channel: "Hussein Nasser",
          url: "https://www.youtube.com/watch?v=P7EUFtjeAmI",
          videoId: "P7EUFtjeAmI",
          durationLabel: "10:17",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "sql-indexes-explain-q1",
          prompt:
            "`orders` has an index on `(tenant_id, created_at)`. Which queries can use it to narrow the part of the index they scan? (Select all that apply.)",
          options: [
            "`WHERE tenant_id = 5 AND created_at > now() - interval '1 day'`",
            "`WHERE tenant_id = 5 ORDER BY created_at DESC LIMIT 20`",
            "`WHERE tenant_id IN (5, 7) AND created_at >= '2026-09-01'`",
            "`WHERE tenant_id = 5 OR created_at > now() - interval '1 day'`",
            "`WHERE tenant_id + 0 = 5`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Equality (or `IN`) on the leading column plus a range on the next one bounds the scan, and the index order satisfies `ORDER BY created_at DESC LIMIT 20` without a sort. An `OR` across columns can't be a single index range (it needs a BitmapOr over separate indexes), and `tenant_id + 0` hides the column behind an expression.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-indexes-explain-q2",
          prompt:
            "On PostgreSQL 18, an index on `(status, created_at)` exists and `status` has four distinct values. The query is `WHERE created_at >= '2026-09-01'`. What can 18 do here that 17 couldn't do efficiently?",
          options: [
            "A skip scan: probe the index once per distinct `status` value, applying the `created_at` range within each",
            "Reorder the index columns on the fly",
            "Create a single-column index on `created_at` automatically",
            "Nothing: an index can never be used without a condition on its first column",
          ],
          correctIndex: 0,
          explanation:
            "Skip scan generates an internal equality condition for each `status` value and runs one short range scan per value. It's only worthwhile when the skipped column has few distinct values; with millions, a sequential scan or a dedicated index wins.",
        },
        {
          id: "sql-indexes-explain-q3",
          prompt:
            "To check the plan, you run `EXPLAIN ANALYZE DELETE FROM sessions WHERE expires_at < now();` in production. What happens?",
          options: [
            "The rows are really deleted: `ANALYZE` executes the statement, so wrap it in `BEGIN; ... ROLLBACK;`",
            "Only the plan is printed; nothing is executed",
            "The plan is printed and the delete waits for you to `COMMIT`",
            "PostgreSQL refuses to `EXPLAIN ANALYZE` data-modifying statements",
          ],
          correctIndex: 0,
          explanation:
            "`EXPLAIN ANALYZE` runs the statement to measure it and discards only its output, not its side effects. Plain `EXPLAIN` shows the estimated plan without executing anything.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-indexes-explain-q4",
          prompt:
            "What does this plan node tell you?\n\n```text\nIndex Scan using orders_customer_id_idx on orders\n  (cost=0.43..8.45 rows=1 width=64)\n  (actual time=0.020..45.110 rows=48210.00 loops=1)\n```",
          options: [
            "The planner expected 1 row and got 48,210: statistics are stale or can't describe this value, so run `ANALYZE` (or raise the statistics target) before trusting join choices built on it",
            "The index is bloated or corrupt, so `REINDEX` is the first thing to run",
            "The plan is fine: an index scan was chosen, so the row counts don't matter",
            "`cost` is in milliseconds, so the node ran five times slower than planned",
          ],
          correctIndex: 0,
          explanation:
            "Misestimates cascade: a node estimated at 1 row invites a nested loop above it that then runs 48,210 times. Costs are arbitrary planner units, not milliseconds, and using an index says nothing about whether it was the right plan.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-indexes-explain-q5",
          prompt:
            "Inside a nested loop you see:\n\n```text\n-> Index Scan using items_order_id_idx on items\n     (actual time=0.010..0.012 rows=3.00 loops=10000)\n```\n\nRoughly how many rows and how much time does this node account for in total?",
          options: [
            "About 30,000 rows and about 120 ms, because actual rows and times are per-loop averages",
            "3 rows and 0.012 ms",
            "10,000 rows and 0.012 ms",
            "3 rows and 120 ms",
          ],
          correctIndex: 0,
          explanation:
            "For nodes executed repeatedly, `EXPLAIN ANALYZE` reports averages per execution so they're comparable with the estimates; multiply by `loops`. PostgreSQL 18 prints actual rows with decimals, which makes fractional averages visible.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-indexes-explain-q6",
          prompt: "Why would the planner choose a Bitmap Index Scan feeding a Bitmap Heap Scan instead of a plain Index Scan?",
          options: [
            "Many rows match, scattered across the table: the bitmap sorts their locations into physical order so each page is read once, and bitmaps from several indexes can be combined with AND/OR",
            "The index is too large to fit in memory",
            "The query has no `WHERE` clause",
            "The table has no primary key, so rows can only be located through a bitmap",
          ],
          correctIndex: 0,
          explanation:
            "A plain index scan fetches rows in index order, which means random heap access: best for a handful of rows. For medium selectivity the bitmap approach is cheaper, and for most of the table a sequential scan is. `Recheck Cond` appears because a bitmap can become lossy (page-level) under memory pressure.",
        },
        {
          id: "sql-indexes-explain-q7",
          prompt:
            "What does PostgreSQL need to answer a query with an Index Only Scan and zero heap fetches? (Select all that apply.)",
          options: [
            "Every column the query references is in the index, as a key column or an `INCLUDE` column",
            "The table's pages are marked all-visible in the visibility map (recently vacuumed)",
            "An index type that supports index-only scans, such as B-tree (GIN never does)",
            "The table has been physically `CLUSTER`ed on the index",
            "The query has a `LIMIT` clause",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The index holds no visibility information, so for pages not marked all-visible PostgreSQL still checks the heap (`Heap Fetches` in `EXPLAIN ANALYZE`). Frequent updates and a lagging vacuum turn index-only scans back into ordinary ones. Clustering and `LIMIT` are irrelevant.",
        },
        {
          id: "sql-indexes-explain-q8",
          prompt:
            "The login query is `WHERE lower(email) = lower($1)`, and there's a B-tree index on `email`. What does the plan show, and what's the fix?",
          options: [
            "A sequential scan: the index stores `email`, not `lower(email)`; create an expression index `ON users (lower(email))` or store emails normalized",
            "An index scan, because PostgreSQL applies `lower` to the index automatically",
            "An error, because functions aren't allowed in `WHERE`",
            "An index scan, but only in the C collation",
          ],
          correctIndex: 0,
          explanation:
            "A predicate can only use an index built on the exact expression it compares. The expression index must use the same function, and a unique expression index also enforces case-insensitive uniqueness.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-indexes-explain-q9",
          prompt: "Given `CREATE INDEX ON jobs (run_at) WHERE status = 'pending';`, which query can use it?",
          options: [
            "`SELECT * FROM jobs WHERE status = 'pending' AND run_at <= now() ORDER BY run_at LIMIT 10`",
            "`SELECT * FROM jobs WHERE run_at <= now()`",
            "`SELECT * FROM jobs WHERE status IN ('pending', 'failed') AND run_at <= now()`",
            "`SELECT * FROM jobs WHERE status <> 'done'`",
          ],
          correctIndex: 0,
          explanation:
            "A partial index is usable only when the query's `WHERE` clause provably implies the index predicate. The payoff is an index covering just the small, hot subset of rows, which stays tiny as finished jobs pile up.",
        },
        {
          id: "sql-indexes-explain-q10",
          prompt: "Which index choices fit the workload? (Select all that apply.)",
          options: [
            "GIN for `WHERE tags @> ARRAY['urgent']` on a `text[]` column",
            "BRIN on `created_at` for a 2 TB append-only events table queried by time range",
            "GiST for an exclusion constraint that forbids overlapping `tstzrange` bookings",
            "Hash for `WHERE price BETWEEN 10 AND 20`",
            "BRIN on a random UUID column for point lookups",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "GIN indexes the elements inside composite values, BRIN stores tiny per-block-range summaries that work when physical order tracks the column, and GiST supports the overlap operators exclusion constraints need. Hash indexes support equality only, and BRIN is useless when values are scattered randomly across blocks.",
        },
        {
          id: "sql-indexes-explain-q11",
          prompt:
            "`UPDATE users SET last_seen_at = now() WHERE id = $1` runs thousands of times a second. After someone adds an index on `last_seen_at`, update throughput drops and the table bloats. Why?",
          options: [
            "Updating an indexed column prevents HOT (heap-only tuple) updates, so every update now writes new entries into every index on the table",
            "Indexes lock the whole table during updates",
            "The new index forces updates to run at SERIALIZABLE",
            "PostgreSQL rebuilds the index after each update",
          ],
          correctIndex: 0,
          explanation:
            "When no indexed column changes and the page has room, PostgreSQL can do a HOT update without touching any index. Indexing a constantly changing column removes that, multiplying WAL, index bloat and vacuum work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-indexes-explain-q12",
          prompt:
            "What's the difference between `CREATE INDEX ON orders (customer_id) INCLUDE (total)` and `CREATE INDEX ON orders (customer_id, total)`?",
          options: [
            "`INCLUDE` columns are stored only as payload in leaf entries: they can cover a query for an index-only scan but aren't part of the search key or its ordering",
            "They're identical; `INCLUDE` is alternative syntax",
            "`INCLUDE` columns can be used for range searches but not equality",
            "`INCLUDE` makes the index unique across both columns",
          ],
          correctIndex: 0,
          explanation:
            "Payload columns keep the key narrow (and on a `UNIQUE` index keep uniqueness on the key columns only) while still letting `SELECT total FROM orders WHERE customer_id = $1` skip the heap. Use a key column when you need to filter or sort by it.",
        },
      ],
    },
    {
      id: "sql-transactions-isolation",
      moduleId: "be-sql",
      trackId: "backend",
      title: "Transactions, ACID & Isolation Levels",
      summary:
        "A transaction groups statements so they commit or roll back together (atomicity), survive a crash once committed (durability, via the write-ahead log) and leave declared constraints satisfied (consistency, which only covers what the schema enforces). Isolation is the tunable part, and the defaults are weaker than most people assume.\n\nPostgreSQL's default, READ COMMITTED, gives each statement a fresh snapshot. Two reads in one transaction can disagree, and the classic lost update (two requests read a balance and each writes back a value computed in application code) happens freely. REPEATABLE READ gives the whole transaction one snapshot: snapshot isolation. In PostgreSQL it also prevents phantoms, which the SQL standard doesn't require at that level, and updating a row that changed after your snapshot fails with `could not serialize access due to concurrent update`. It still allows write skew: two transactions read the same condition, write different rows, and together break an invariant (two doctors both going off call). SERIALIZABLE uses Serializable Snapshot Isolation, tracking read/write dependencies and aborting one transaction with SQLSTATE `40001` rather than letting an anomaly commit. Above READ COMMITTED, retrying whole transactions is part of the contract.\n\nMVCC keeps old row versions so readers never block writers. The price is garbage: updates and deletes leave dead tuples for VACUUM, and a long-running or idle-in-transaction session holds back the cleanup horizon, bloating tables and indexes. The practical toolkit, roughly in order of preference: atomic statements (`UPDATE ... SET n = n - 1 WHERE n > 0`), unique constraints, `SELECT ... FOR UPDATE` (with `SKIP LOCKED` for job queues), optimistic version columns, and SERIALIZABLE with retries for invariants spanning rows. Keep transactions short and never wait on network calls inside them.",
      level: "expert",
      estMinutes: 85,
      isMilestone: true,
      webRefs: [
        { label: "PostgreSQL 18 docs: Transaction Isolation", url: "https://www.postgresql.org/docs/18/transaction-iso.html", kind: "docs" },
        { label: "PostgreSQL 18 docs: Routine Vacuuming", url: "https://www.postgresql.org/docs/18/routine-vacuuming.html", kind: "docs" },
        { label: "Martin Kleppmann: Hermitage (testing isolation levels across databases)", url: "https://github.com/ept/hermitage", kind: "repo" },
        { label: "Jepsen: Consistency Models", url: "https://jepsen.io/consistency", kind: "article" },
      ],
      video: {
        title: "Relational Database ACID Transactions (Explained by Example)",
        channel: "Hussein Nasser",
        url: "https://www.youtube.com/watch?v=pomxJOFVcQs",
        videoId: "pomxJOFVcQs",
        durationLabel: "42:43",
      },
      alternateVideos: [
        {
          title: "\"Transactions: myths, surprises and opportunities\" by Martin Kleppmann",
          channel: "Strange Loop Conference",
          url: "https://www.youtube.com/watch?v=5ZjhNTM8XU8",
          videoId: "5ZjhNTM8XU8",
          durationLabel: "41:08",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "sql-transactions-isolation-q1",
          prompt:
            "Two requests run this concurrently at READ COMMITTED, each withdrawing 100 from a balance of 500:\n\n```sql\nBEGIN;\nSELECT balance FROM accounts WHERE id = 1;  -- app computes 500 - 100\nUPDATE accounts SET balance = 400 WHERE id = 1;\nCOMMIT;\n```\n\nThe final balance is 400: one withdrawal was lost. Which changes prevent that? (Select all that apply.)",
          options: [
            "Do it in one statement: `UPDATE accounts SET balance = balance - 100 WHERE id = 1 AND balance >= 100`",
            "Lock the row first with `SELECT balance ... FOR UPDATE`",
            "Add a `version` column, update `WHERE id = 1 AND version = $v`, and retry when no row was updated",
            "Run at REPEATABLE READ and retry the transaction when it fails with a serialization error",
            "Keep READ COMMITTED but make the transaction shorter",
            "Add an index on `accounts(id)`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "The atomic update re-reads the row under its lock, `FOR UPDATE` serializes the read-modify-write, the version check detects the conflict, and REPEATABLE READ turns the second update into a serialization failure. A shorter transaction only narrows the race, and an index doesn't change concurrency.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-transactions-isolation-q2",
          prompt:
            "Alice and Bob are the two doctors on call. Each, in a separate REPEATABLE READ transaction, runs `SELECT count(*) FROM doctors WHERE on_call` (and sees 2), then sets their own row to `on_call = false` and commits. What happens?",
          options: [
            "Both commit and nobody is on call: write skew, which snapshot isolation allows; SERIALIZABLE would abort one of them with SQLSTATE 40001",
            "The second commit fails with `could not serialize access due to concurrent update`",
            "The second transaction blocks until the first commits, then sees 1 and stops",
            "PostgreSQL's REPEATABLE READ prevents this because it doesn't allow phantoms",
          ],
          correctIndex: 0,
          explanation:
            "They update different rows, so there's no write-write conflict for REPEATABLE READ to detect; each acted on a snapshot the other invalidated. SSI tracks those read/write dependencies and aborts one. Without SERIALIZABLE, lock the rows you read with `FOR UPDATE` or restructure the invariant into something a constraint can enforce.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-transactions-isolation-q3",
          prompt:
            "In a REPEATABLE READ transaction, `SELECT count(*) FROM orders WHERE status = 'new'` returns 10. Another session inserts 5 new orders and commits. You run the same count again in your transaction. What do you get?",
          options: [
            "10: the transaction keeps its snapshot, and PostgreSQL's REPEATABLE READ doesn't allow phantom reads",
            "15: phantoms are allowed at REPEATABLE READ",
            "An error, because your snapshot is out of date",
            "15, because aggregates always read the latest committed data",
          ],
          correctIndex: 0,
          explanation:
            "The SQL standard lets REPEATABLE READ show phantoms, but PostgreSQL implements it as snapshot isolation, which is stricter. At READ COMMITTED the second count would be 15, since each statement takes a new snapshot.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-transactions-isolation-q4",
          prompt:
            "At READ COMMITTED, transaction A has set job 7 to `status = 'done'` but hasn't committed. Transaction B runs `UPDATE jobs SET worker = 'b' WHERE id = 7 AND status = 'pending'` and blocks. What happens when A commits?",
          options: [
            "B re-evaluates its `WHERE` against the new row version, finds `status = 'done'`, and updates nothing",
            "B overwrites A's change because it saw `pending` first",
            "B fails with a serialization error",
            "B updates the row and the two changes are merged",
          ],
          correctIndex: 0,
          explanation:
            "PostgreSQL's READ COMMITTED rechecks the condition on the latest committed version of a row it had to wait for. That's why a single conditional `UPDATE` is a safe claim-a-job primitive even at the default level.",
        },
        {
          id: "sql-transactions-isolation-q5",
          prompt:
            "In a REPEATABLE READ transaction, you update a row that another transaction changed and committed after your snapshot was taken. What happens?",
          options: [
            "Your update fails with `could not serialize access due to concurrent update`, and the transaction has to be retried",
            "Your update silently overwrites theirs",
            "Your update is applied to the version in your snapshot and theirs is discarded",
            "PostgreSQL merges the two changes column by column",
          ],
          correctIndex: 0,
          explanation:
            "Snapshot isolation is first-updater-wins. Applications running above READ COMMITTED must treat serialization failures as a normal outcome and retry from the beginning.",
        },
        {
          id: "sql-transactions-isolation-q6",
          prompt: "A SERIALIZABLE transaction fails at `COMMIT` with SQLSTATE `40001`. What should the application do?",
          options: [
            "Retry the entire transaction from its first statement, re-reading its data, because anything it read may have been invalid",
            "Retry only the `COMMIT`",
            "Re-run only the last statement",
            "Treat it as a bug; correct code never gets serialization failures",
          ],
          correctIndex: 0,
          explanation:
            "The transaction's decisions were based on reads that turned out not to be serializable, so every read must be redone. Keep transactions short and free of external side effects so they're safe to replay, and declare read-only ones `READ ONLY`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-transactions-isolation-q7",
          prompt:
            "A console session has sat `idle in transaction` for six hours after someone forgot to commit a `BEGIN`. What's the database-wide effect?",
          options: [
            "VACUUM can't remove row versions that became dead after that transaction's snapshot, so busy tables and indexes bloat and queries slow down",
            "Nothing beyond one connection slot, because an idle transaction does no work",
            "All writes to every table are blocked",
            "PostgreSQL commits it automatically after an hour",
          ],
          correctIndex: 0,
          explanation:
            "MVCC keeps old versions for any snapshot that might still need them, and the oldest open transaction sets that horizon (it also keeps holding its locks). Set `idle_in_transaction_session_timeout` and watch `pg_stat_activity` for old transactions; abandoned replication slots hold the horizon back too.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-transactions-isolation-q8",
          prompt:
            "Several workers claim the next pending job with:\n\n```sql\nSELECT id FROM jobs\nWHERE status = 'pending'\nORDER BY run_at\nLIMIT 1\nFOR UPDATE SKIP LOCKED;\n```\n\nWhy `SKIP LOCKED`?",
          options: [
            "Each worker skips rows other workers have already locked and takes the next one, so workers don't queue behind each other",
            "It ignores row locks entirely, so two workers can claim the same job",
            "It raises an error immediately if the row is locked, so the worker can retry",
            "It locks the whole table so only one worker runs at a time",
          ],
          correctIndex: 0,
          explanation:
            "Plain `FOR UPDATE` makes every worker wait on the first worker's row, and `NOWAIT` errors instead of waiting. `SKIP LOCKED` hands each worker a different unlocked row, which is what makes a Postgres table a workable job queue.",
        },
        {
          id: "sql-transactions-isolation-q9",
          prompt:
            "Transaction A updates row 1 and then row 2; transaction B updates row 2 and then row 1, at the same time. What does PostgreSQL do?",
          options: [
            "Detects the deadlock (after `deadlock_timeout`) and aborts one transaction with an error; the fix is to take locks in a consistent order",
            "Waits forever unless `statement_timeout` is set",
            "Lets both commit and keeps the last write",
            "Aborts both transactions and leaves the retry order to the application",
          ],
          correctIndex: 0,
          explanation:
            "PostgreSQL checks for lock cycles once a wait exceeds `deadlock_timeout` (1 s by default) and cancels one participant so the other can proceed. Updating rows in sorted id order, or locking parents before children, removes the cycle.",
        },
        {
          id: "sql-transactions-isolation-q10",
          prompt: "Which statements about ACID in PostgreSQL are true? (Select all that apply.)",
          options: [
            "Atomicity: an aborted or crashed transaction leaves none of its changes behind",
            "Durability: once `COMMIT` returns (with the default `synchronous_commit = on`), the change survives a crash because it's in the flushed write-ahead log",
            "Consistency: the database guarantees only the constraints you declared (keys, foreign keys, `CHECK`); other invariants are the application's job",
            "The default isolation level guarantees serializable behaviour",
            "Durability means the change has been copied to a replica",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "READ COMMITTED allows non-repeatable reads, lost updates and write skew, so it's far from serializable. Durability is about the local WAL flush; synchronous replication is a separate setting.",
        },
        {
          id: "sql-transactions-isolation-q11",
          prompt:
            "A checkout handler opens a transaction, inserts the order, calls a payment provider's HTTP API, then commits. What's the main problem?",
          options: [
            "The transaction holds locks and an old snapshot for the whole network call, and if the commit fails after the charge succeeds, money was taken without an order being recorded",
            "HTTP calls can't be made while a transaction is open",
            "The payment provider will see the uncommitted order",
            "Nothing, as long as the transaction runs at SERIALIZABLE",
          ],
          correctIndex: 0,
          explanation:
            "External side effects can't be rolled back. Commit the order as pending first, call the provider with an idempotency key, and record the result in a second transaction (or hand the call to a worker through an outbox table).",
        },
        {
          id: "sql-transactions-isolation-q12",
          prompt:
            "At READ COMMITTED, you run `SELECT balance FROM accounts WHERE id = 1` twice in one transaction, and another session commits an update in between. What do you see?",
          options: [
            "Two different values: each statement takes a new snapshot (a non-repeatable read)",
            "The same value twice: a transaction always sees one snapshot",
            "The second query blocks until your transaction ends",
            "An error, because the row changed",
          ],
          correctIndex: 0,
          explanation:
            "READ COMMITTED guarantees no dirty reads and nothing more between statements. If a transaction's logic needs consistent data across statements, use REPEATABLE READ or lock what you read.",
        },
      ],
    },
    {
      id: "sql-postgres-features",
      moduleId: "be-sql",
      trackId: "backend",
      title: "PostgreSQL-Specific Features (PostgreSQL 18)",
      summary:
        "PostgreSQL's pitch is that one well-understood database can cover jobs that often get their own systems: `jsonb` documents with GIN indexes, full-text search, arrays and range types, queues (`FOR UPDATE SKIP LOCKED`), pub/sub (`LISTEN`/`NOTIFY`), and extensions such as `pg_trgm`, PostGIS and pgvector. For most teams that's the right default, since one backup story, one consistency model and one skill set beat five, until a workload outgrows what a single primary can do.\n\nThe everyday features worth knowing cold: upserts with `INSERT ... ON CONFLICT (key) DO UPDATE SET col = EXCLUDED.col`, atomic under concurrency but requiring a matching unique index or constraint and failing if one statement hits the same row twice; `RETURNING`, which hands back generated values without a second query (PostgreSQL 18 adds `OLD` and `NEW`, so an `UPDATE` can return before and after values); exclusion constraints (`EXCLUDE USING gist (room WITH =, during WITH &&)`), which forbid overlapping bookings in a way no unique index can; and `jsonb`, stored as parsed binary, which supports containment (`@>`) through GIN (`jsonb_path_ops` is smaller and faster but drops the key-existence operators) and doesn't help `data->>'status' = 'x'` without an expression index.\n\nPostgreSQL 18 (September 2025) brings an asynchronous I/O subsystem (`io_method`, default `worker`, or `io_uring` on Linux builds) that speeds up sequential scans, bitmap heap scans and vacuum; B-tree skip scan; `uuidv7()`; virtual generated columns as the default kind (computed on read; add `STORED` to persist); temporal `WITHOUT OVERLAPS` keys; buffer counts in `EXPLAIN ANALYZE` by default; data checksums enabled by default in `initdb`; and deprecated MD5 passwords. The standing caution with `jsonb`: the planner keeps no per-key statistics and updating one key rewrites the whole value, so hot, filtered fields belong in real columns.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "PostgreSQL 18 docs: Release Notes", url: "https://www.postgresql.org/docs/18/release-18.html", kind: "docs" },
        { label: "PostgreSQL 18 docs: JSON Types (jsonb indexing)", url: "https://www.postgresql.org/docs/18/datatype-json.html", kind: "docs" },
        { label: "PostgreSQL 18 docs: INSERT (ON CONFLICT)", url: "https://www.postgresql.org/docs/18/sql-insert.html", kind: "docs" },
        { label: "PostgreSQL: PostgreSQL 18 Released!", url: "https://www.postgresql.org/about/news/postgresql-18-released-3142/", kind: "article" },
      ],
      video: {
        title: "I replaced my entire tech stack with Postgres...",
        channel: "Fireship",
        url: "https://www.youtube.com/watch?v=3JW732GrMdg",
        videoId: "3JW732GrMdg",
        durationLabel: "8:12",
      },
      alternateVideos: [
        {
          title: "Webinar Recording: Hands on Postgres 18: Async I/O, B-tree Skip Scan, UUIDv7",
          channel: "pganalyze",
          url: "https://www.youtube.com/watch?v=RTXeA5svapg",
          videoId: "RTXeA5svapg",
          durationLabel: "1:10:50",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "sql-postgres-features-q1",
          prompt:
            "`orders.data` is `jsonb`, indexed with `CREATE INDEX ON orders USING gin (data);` (the default `jsonb_ops` class). Which predicates can use that index? (Select all that apply.)",
          options: [
            "`data @> '{\"status\": \"paid\"}'`",
            "`data ? 'coupon'`",
            "`data->>'status' = 'paid'`",
            "`(data->>'total')::numeric > 100`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "A GIN index on the column supports containment and key-existence operators applied directly to it. `->>` first extracts a text value, which the index doesn't cover; that needs a B-tree expression index on `(data->>'status')`, or a real column.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-postgres-features-q2",
          prompt: "When would you build the GIN index with `jsonb_path_ops` instead of the default `jsonb_ops`?",
          options: [
            "When queries are containment (`@>`) or jsonpath matches: the index is much smaller and faster, but it can't serve the key-existence operators `?`, `?|` and `?&`",
            "When you need to index the key-existence operators",
            "When the column is `json` rather than `jsonb`",
            "When the index should support `ORDER BY` on a JSON field",
          ],
          correctIndex: 0,
          explanation:
            "`jsonb_path_ops` indexes hashes of paths to values rather than every key and value separately. Neither class supports ordering; that's what B-tree expression indexes are for.",
        },
        {
          id: "sql-postgres-features-q3",
          prompt:
            "What happens?\n\n```sql\nINSERT INTO users (id, name) VALUES (1, 'a'), (1, 'b')\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;\n```",
          options: [
            "It fails: one `ON CONFLICT DO UPDATE` statement can't affect the same row twice (a cardinality violation)",
            "The row ends up with `name = 'b'`: the last value wins",
            "The row ends up with `name = 'a'`: the first value wins",
            "Both rows are inserted because they're in one statement",
          ],
          correctIndex: 0,
          explanation:
            "Upserts are deterministic statements, so PostgreSQL raises `ON CONFLICT DO UPDATE command cannot affect row a second time` instead of picking a winner. Deduplicate the input first, for example with `DISTINCT ON`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-postgres-features-q4",
          prompt:
            "`INSERT ... ON CONFLICT (email) DO UPDATE ...` fails with `there is no unique or exclusion constraint matching the ON CONFLICT specification`. The table has a plain B-tree index on `email`. What's missing?",
          options: [
            "A unique index or constraint on `email` to act as the conflict arbiter",
            "The `EXCLUDED` keyword",
            "A primary key on `email`",
            "Nothing: `ON CONFLICT` only works with primary keys",
          ],
          correctIndex: 0,
          explanation:
            "The conflict target must match a unique index or a non-deferrable unique constraint. A non-unique index can't define a conflict, and any unique index works, not just the primary key.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-postgres-features-q5",
          prompt: "Why prefer `INSERT ... ON CONFLICT DO UPDATE` over a `SELECT` to check, followed by an `INSERT` or `UPDATE`?",
          options: [
            "It's atomic: even under heavy concurrency one of insert or update is guaranteed, while check-then-insert lets two sessions both see no row and race to insert",
            "It works without any index",
            "It's the only way to update several columns at once",
            "It skips triggers, so it's faster",
          ],
          correctIndex: 0,
          explanation:
            "The check-then-act pattern has a window between the read and the write. With a unique constraint the loser gets a duplicate-key error to handle; without one you get duplicates. The upsert closes the window in the database.",
        },
        {
          id: "sql-postgres-features-q6",
          prompt:
            "In PostgreSQL 18, what kind of column does this create?\n\n```sql\nALTER TABLE order_items\n  ADD COLUMN line_total numeric GENERATED ALWAYS AS (price * quantity);\n```",
          options: [
            "A virtual generated column: computed when read and taking no storage (add `STORED` to compute on write and persist it)",
            "A stored generated column, computed on every insert and update",
            "A normal column with a default that can be overwritten",
            "An error: generated columns must say `STORED`",
          ],
          correctIndex: 0,
          explanation:
            "PostgreSQL 18 added virtual generated columns and made them the default kind; before 18, `STORED` was required. A virtual column's expression may only use built-in functions and types.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-postgres-features-q7",
          prompt: "Which of these arrived in PostgreSQL 18? (Select all that apply.)",
          options: [
            "A built-in `uuidv7()` function",
            "An asynchronous I/O subsystem controlled by `io_method` (default `worker`)",
            "B-tree skip scan for multicolumn indexes",
            "`OLD` and `NEW` in `RETURNING` clauses",
            "Removal of MD5 password authentication",
            "`EXPLAIN ANALYZE` no longer executing the query",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "MD5 passwords are deprecated in 18 (with warnings), not removed. `EXPLAIN ANALYZE` still executes the statement; what 18 changes is that buffer statistics are included by default.",
        },
        {
          id: "sql-postgres-features-q8",
          prompt:
            "A room-booking table must never hold two overlapping bookings for the same room. Which constraint enforces that?",
          options: [
            "`EXCLUDE USING gist (room_id WITH =, during WITH &&)`, with the `btree_gist` extension providing `=` on `room_id`",
            "`UNIQUE (room_id, during)`",
            "`CHECK (lower(during) < upper(during))`",
            "A B-tree index on `(room_id, during)`",
          ],
          correctIndex: 0,
          explanation:
            "A unique constraint only rejects identical values; overlap needs the `&&` operator, which exclusion constraints support through GiST. PostgreSQL 18 can also express this as a temporal key using `WITHOUT OVERLAPS`.",
        },
        {
          id: "sql-postgres-features-q9",
          prompt:
            "What does this return in PostgreSQL 18?\n\n```sql\nUPDATE accounts SET balance = balance - 50\nWHERE id = 1\nRETURNING old.balance, new.balance;\n```",
          options: [
            "The balance before and after the update, in one round trip",
            "An error: `RETURNING` can only return the new row",
            "The new balance twice",
            "Only the old balance; `new` is reserved for triggers",
          ],
          correctIndex: 0,
          explanation:
            "Before 18 you needed a CTE or a trigger to see the pre-update value. `old` and `new` work in `INSERT`, `UPDATE`, `DELETE` and `MERGE`, including upserts.",
        },
        {
          id: "sql-postgres-features-q10",
          prompt:
            "A team keeps `status` and `updated_at`, which every list query filters on and every request updates, inside a large `jsonb` column. What does that cost them? (Select all that apply.)",
          options: [
            "The planner keeps no per-key statistics inside `jsonb`, so estimates for `data->>'status' = 'x'` are guesses",
            "Changing one key writes a whole new copy of the value (large values are TOASTed), so frequent updates are expensive",
            "Each key they filter or sort on needs its own expression index, and types and constraints move into application code",
            "`jsonb` columns can't be indexed at all",
            "`jsonb` values can't be modified with SQL",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`jsonb` shines for sparse or variable attributes; hot, filtered, frequently updated fields belong in real columns. It can be indexed (GIN or expression indexes), and `jsonb_set` or `||` modify it in SQL, though each change still rewrites the row.",
        },
      ],
    },
    {
      id: "sql-orms",
      moduleId: "be-sql",
      trackId: "backend",
      title: "ORMs in Practice: Prisma, Drizzle, TypeORM & Sequelize",
      summary:
        "An ORM maps rows to objects and gives you migrations, typed queries, relation loading and transactions. That removes boilerplate and, in TypeScript, catches schema drift at compile time. The cost is that the SQL is generated for you, so the same abstraction that makes `user.posts` convenient also hides how many queries run and what they fetch. You still need to read the SQL it emits (every ORM can log it) and the `EXPLAIN` for anything hot.\n\nThe TypeScript options differ in philosophy. Prisma uses its own schema language and a generated client; Prisma ORM 7 (November 2025) replaced the Rust query-engine binary with a TypeScript and WebAssembly query compiler and requires a driver adapter for your database. It can load relations with one query per table, merged in the application, or with `relationLoadStrategy: \"join\"`, a single database join. Drizzle is a thin, SQL-shaped query builder whose schema is TypeScript. TypeORM uses decorators with Active Record or Data Mapper styles, and Sequelize is the older promise-based JavaScript ORM whose stable line is v6. Choose on how close to SQL your team wants to be and how you run migrations, not on benchmark charts.\n\nMost ORM incidents come from the same places: relation access in loops (the N+1 problem); fetching every column, including large JSON or binary ones; string-built raw SQL (Prisma's `$queryRaw` tagged template parameterizes, `$queryRawUnsafe` with interpolation is an injection hole); using the base client inside an interactive transaction callback, so queries escape the transaction; connection storms when every serverless instance opens its own pool; and migrations that rename or drop columns while old instances are still running. Use expand and contract: add, backfill, switch, then remove.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Prisma docs: Relations and joins", url: "https://www.prisma.io/docs/orm/fundamentals/relations-and-joins", kind: "docs" },
        { label: "Drizzle ORM docs: Overview", url: "https://orm.drizzle.team/docs/overview", kind: "docs" },
        { label: "Sequelize docs: Eager Loading", url: "https://sequelize.org/docs/v6/advanced-association-concepts/eager-loading/", kind: "docs" },
        { label: "Martin Fowler: OrmHate", url: "https://martinfowler.com/bliki/OrmHate.html", kind: "article" },
      ],
      video: {
        title: "I tried 8 different Postgres ORMs",
        channel: "Beyond Fireship",
        url: "https://www.youtube.com/watch?v=4QN1BzxF8wM",
        videoId: "4QN1BzxF8wM",
        durationLabel: "9:46",
      },
      alternateVideos: [
        {
          title: "They Finally Fixed Prisma",
          channel: "Josh tried coding",
          url: "https://www.youtube.com/watch?v=JuAauKOj1Kk",
          videoId: "JuAauKOj1Kk",
          durationLabel: "16:35",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "sql-orms-q1",
          prompt:
            "How many queries does this run for 100 posts?\n\n```js\nconst posts = await prisma.post.findMany();\nconst authors = [];\nfor (const post of posts) {\n  authors.push(await prisma.user.findUnique({ where: { id: post.authorId } }));\n}\n```",
          options: [
            "101: one for the posts, then one per post, because each `findUnique` is awaited before the next starts, so Prisma can't batch them",
            "2: Prisma batches `findUnique` calls automatically",
            "1: Prisma joins the tables for you",
            "100: one query per post, and the initial `findMany` is served from Prisma's cache",
          ],
          correctIndex: 0,
          explanation:
            "Prisma's automatic batching only merges `findUnique` calls issued in the same tick. A sequential `await` in a loop issues them one at a time: a textbook N+1. Use `include: { author: true }`, or collect the ids and run one `findMany` with `in`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-orms-q2",
          prompt:
            "Which snippets load 100 posts' authors in a constant number of queries, however many posts there are? (Select all that apply.)",
          options: [
            "`prisma.post.findMany({ include: { author: true } })`",
            "`Promise.all(posts.map((p) => prisma.user.findUnique({ where: { id: p.authorId } })))`",
            "`prisma.user.findMany({ where: { id: { in: posts.map((p) => p.authorId) } } })`, then matching authors to posts in memory",
            "`for (const p of posts) authors.push(await prisma.user.findUnique({ where: { id: p.authorId } }))`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`include` loads the relation with one extra query (or one join), the `in` query is a manual batch, and `findUnique` calls started in the same tick with the same shape are merged by Prisma's dataloader. The sequential loop issues one query per post.",
        },
        {
          id: "sql-orms-q3",
          prompt: "Which of these is vulnerable to SQL injection?",
          options: [
            "`$queryRawUnsafe` called with a string built by interpolating `email` into the SQL text",
            "`$queryRaw` used as a tagged template with `${email}` inside it",
            "`prisma.user.findMany({ where: { email } })`",
            "Drizzle's `db.select().from(users).where(eq(users.email, email))`",
          ],
          correctIndex: 0,
          explanation:
            "The tagged-template form sends `email` as a bind parameter, and the query builders do the same. `$queryRawUnsafe` with interpolation puts user input into the SQL text itself; it's only safe when values go through its positional parameter arguments.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-orms-q4",
          prompt:
            "A serverless API on PostgreSQL starts failing with `too many connections` during traffic spikes, even though each function instance uses a pool of 10. Why, and what's the usual fix?",
          options: [
            "Every concurrent instance opens its own pool (200 instances × 10 = 2,000 connections); put a pooler such as PgBouncer in transaction mode in front and keep per-instance pools tiny",
            "The pool is too small; raise it to 100 per instance",
            "Serverless functions can't use connection pools at all",
            "PostgreSQL has a fixed limit of 100 connections",
          ],
          correctIndex: 0,
          explanation:
            "Each PostgreSQL connection is a backend process with real memory cost, so `max_connections` can't grow indefinitely. An external pooler multiplexes many client connections onto a few server connections.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-orms-q5",
          prompt:
            "Behind PgBouncer in transaction pooling mode, which of these stop working reliably? (Select all that apply.)",
          options: [
            "Session-level `SET` statements, because the next transaction may run on a different server connection",
            "`LISTEN` for notifications",
            "Session-level advisory locks held across transactions",
            "Ordinary single-statement queries",
            "Multi-statement transactions wrapped in `BEGIN`/`COMMIT`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "In transaction mode a client only owns a server connection for the length of a transaction, so anything tied to the session leaks to other clients or disappears. Plain queries and explicit transactions are exactly what the mode is built for.",
        },
        {
          id: "sql-orms-q6",
          prompt:
            "You rename `users.name` to `users.full_name` in one ORM migration and deploy with a rolling update. What goes wrong, and what's the safe pattern?",
          options: [
            "Instances still running the old code query `name` and fail until they're replaced; expand and contract instead: add the new column, write both, backfill, switch reads, and drop the old column in a later release",
            "Nothing: ORMs rename columns transparently for old code",
            "The migration locks the table until every instance restarts",
            "Columns can't be renamed in PostgreSQL",
          ],
          correctIndex: 0,
          explanation:
            "During a rolling deploy two versions of the code run against one schema, so every migration must be compatible with both. The same applies to dropping columns and adding `NOT NULL` without a default.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-orms-q7",
          prompt:
            "A user list is rendered with `prisma.user.findMany()`, and `users` has a large `avatar` bytea column and a big `preferences` jsonb column. What's the cheapest fix for the slow endpoint?",
          options: [
            "Select only the fields the list needs (`select: { id: true, name: true }`), so the large columns are never read or sent",
            "Add an index on `avatar`",
            "Switch to `findFirst`",
            "Wrap the call in a transaction",
          ],
          correctIndex: 0,
          explanation:
            "ORMs fetch every scalar column by default, which is `SELECT *` by another name. Large values are stored out of line (TOAST) and only read when selected, so leaving them out saves I/O, memory and bandwidth.",
        },
        {
          id: "sql-orms-q8",
          prompt:
            "What's wrong with this interactive transaction?\n\n```js\nawait prisma.$transaction(async (tx) => {\n  await tx.account.update({ where: { id: from }, data: { balance: { decrement: 100 } } });\n  await prisma.account.update({ where: { id: to }, data: { balance: { increment: 100 } } });\n});\n```",
          options: [
            "The second update uses `prisma` instead of `tx`, so it runs outside the transaction and won't roll back if something fails",
            "An interactive transaction can't contain two updates",
            "`decrement` isn't atomic",
            "Nothing: every query inside the callback joins the transaction automatically",
          ],
          correctIndex: 0,
          explanation:
            "Only queries issued through the `tx` client belong to the transaction. The same trap exists wherever an ORM passes a transaction handle: Drizzle's `tx`, TypeORM's entity manager, Sequelize's `transaction` option.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "sql-orms-q9",
          prompt: "Which statements about the TypeScript ORMs are accurate? (Select all that apply.)",
          options: [
            "Drizzle is a thin, SQL-shaped query builder whose schema is written in TypeScript",
            "Prisma ORM 7 replaced the Rust query-engine binary with a TypeScript/WebAssembly query compiler and uses driver adapters",
            "TypeORM defines entities with decorators and supports both Active Record and Data Mapper styles",
            "Prisma can't run raw SQL",
            "Drizzle generates its SQL in a separate Rust engine process",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Prisma supports raw SQL (`$queryRaw`, TypedSQL), and Drizzle builds SQL in TypeScript with no separate engine. The honest decision criteria are ergonomics, migrations and how much SQL your team wants to see.",
        },
        {
          id: "sql-orms-q10",
          prompt:
            "An analytics endpoint needs a window function, a recursive CTE and `FILTER` aggregates. What's the pragmatic approach in an ORM-based codebase?",
          options: [
            "Write it as parameterized raw SQL (or with a query builder) behind a typed function, and keep the ORM for CRUD",
            "Fetch all the rows through the ORM and compute the result in JavaScript",
            "Move the logic into a nightly batch job",
            "Rewrite the whole service without an ORM",
          ],
          correctIndex: 0,
          explanation:
            "ORMs are strongest at CRUD and relation loading; reporting queries are where hand-written SQL pays off. Pulling every row into the app moves the work away from the data and multiplies transfer and memory.",
        },
      ],
    },
    {
      id: "sql-n-plus-one",
      moduleId: "be-sql",
      trackId: "backend",
      title: "The N+1 Query Problem & DataLoader Batching",
      summary:
        "The N+1 problem is one query to fetch a list, then one more per item to fetch something related: 1 query for 100 posts, then 100 for their authors. Each query may take well under a millisecond on the server; the damage is the round trips. At 1 ms of network latency that's 100 ms of pure waiting, growing linearly with page size, and it hides in development where the list has five rows and the database is on localhost. ORMs make it easy to write by accident because `post.author` looks like a property access, and GraphQL makes it structural because each field resolver runs independently per object.\n\nDetection is empirical: count queries per request (ORM query logs, APM spans, `pg_stat_statements` showing a cheap query with an enormous `calls` count) and fail tests that exceed a query budget. The fixes trade round trips for other costs. A `JOIN` returns everything in one query but repeats parent columns on every child row. Eager loading or a second batched query (`WHERE id = ANY($1)`) keeps it to two queries. A DataLoader collects every key requested during one tick of the event loop, deduplicates them, issues one batched query and hands each caller its row. Its cache must be per request, never shared across users, and the batch result must line up with the keys, with a hole (null or an error) for each missing row.\n\nBatching has limits too. PostgreSQL's wire protocol allows at most 65,535 bind parameters, so a giant `IN ($1, $2, ...)` list fails where a single array parameter (`= ANY($1)`) doesn't, and very large batches should be chunked. And N+1 is a latency problem, not a law: SQLite runs in-process, so many small queries there are cheap.",
      level: "advanced",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "Prisma docs: Query optimization (solving n+1)", url: "https://www.prisma.io/docs/orm/v7/prisma-client/queries/advanced/query-optimization-performance", kind: "docs" },
        { label: "graphql/dataloader (reference implementation)", url: "https://github.com/graphql/dataloader", kind: "repo" },
        { label: "SQLite: Many Small Queries Are Efficient In SQLite", url: "https://www.sqlite.org/np1queryprob.html", kind: "docs" },
        { label: "Use The Index, Luke: Nested Loops and the N+1 problem", url: "https://use-the-index-luke.com/sql/join/nested-loops-join-n1-problem", kind: "article" },
      ],
      video: {
        title: "GraphQL N+1 Problem",
        channel: "Ben Awad",
        url: "https://www.youtube.com/watch?v=uCbFMZYQbxE",
        videoId: "uCbFMZYQbxE",
        durationLabel: "16:14",
      },
      alternateVideos: [
        {
          title: "SQLite and the N+1 (no) problem",
          channel: "Mycelial",
          url: "https://www.youtube.com/watch?v=qPfAQY_RahA",
          videoId: "qPfAQY_RahA",
          durationLabel: "8:29",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `createUserLoader(db, options)`, a DataLoader-style batcher. It returns `{ load(id) }`, where `load` returns a Promise for the user row with that `id`, or `null` if there isn't one.\n\n`db.findByIds(ids)` is the only way to query. It runs `SELECT * FROM users WHERE id = ANY($1)`: it returns a Promise for the matching rows in no particular order, simply leaves out ids that don't exist, and may reject.\n\n- Batching: all `load` calls made in the same synchronous burst must go out as one `db.findByIds` call. Dispatch with `queueMicrotask`, `Promise.resolve().then(...)` or `setTimeout(..., 0)`.\n- Send each id at most once per batch, in the order it was first requested. Callers asking for the same id share the result.\n- Map the rows back to ids yourself: each caller gets its own row, or `null` for an id the database didn't return.\n- Cache per loader: an id that has been loaded (or is in flight) is never queried again, including ids that came back `null`.\n- `options.maxBatchSize` (unlimited when absent) splits a batch into consecutive chunks of at most that many ids, each sent as its own query.\n- If a query rejects, every `load` waiting on it rejects with that error, and those ids aren't cached, so a later `load` queries them again.\n- `load(null)` and `load(undefined)` return a rejected Promise with a `TypeError` (don't throw synchronously) and never reach the database.\n\nThe tests call `runLoaderScenario(users, waves, options)`, which issues each wave of `load` calls in one burst, waits for them to settle, and reports the results plus every query sent (`options.failQueries` lists 1-based query numbers that the fake database rejects). Leave the driver as it is.",
        starterCode: `/**
 * @param {{ findByIds: (ids: number[]) => Promise<{ id: number }[]> }} db
 * @param {{ maxBatchSize?: number }} [options]
 * @returns {{ load: (id: number) => Promise<object | null> }}
 */
function createUserLoader(db, options) {
  // Your code here
  return {
    load(id) {
      // Your code here
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
`,
        functionName: "runLoaderScenario",
        testCases: [
          {
            description: "a burst of loads becomes one query, and rows come back in request order",
            args: [users, [[3, 1, 2]]],
            expected: {
              results: [
                [
                  { ok: true, value: { id: 3, name: "Linus" } },
                  { ok: true, value: { id: 1, name: "Ada" } },
                  { ok: true, value: { id: 2, name: "Grace" } },
                ],
              ],
              queries: [[3, 1, 2]],
            },
          },
          {
            description: "duplicate ids are sent once and share the result",
            args: [users, [[2, 1, 2, 3, 1]]],
            expected: {
              results: [
                [
                  { ok: true, value: { id: 2, name: "Grace" } },
                  { ok: true, value: { id: 1, name: "Ada" } },
                  { ok: true, value: { id: 2, name: "Grace" } },
                  { ok: true, value: { id: 3, name: "Linus" } },
                  { ok: true, value: { id: 1, name: "Ada" } },
                ],
              ],
              queries: [[2, 1, 3]],
            },
          },
          {
            description: "ids the database doesn't return resolve to null",
            args: [users, [[1, 42, 2]]],
            expected: {
              results: [
                [
                  { ok: true, value: { id: 1, name: "Ada" } },
                  { ok: true, value: null },
                  { ok: true, value: { id: 2, name: "Grace" } },
                ],
              ],
              queries: [[1, 42, 2]],
            },
          },
          {
            description: "a later wave reuses cached ids and only queries new ones",
            args: [users, [[1, 2], [2, 3]]],
            expected: {
              results: [
                [
                  { ok: true, value: { id: 1, name: "Ada" } },
                  { ok: true, value: { id: 2, name: "Grace" } },
                ],
                [
                  { ok: true, value: { id: 2, name: "Grace" } },
                  { ok: true, value: { id: 3, name: "Linus" } },
                ],
              ],
              queries: [[1, 2], [3]],
            },
          },
          {
            description: "maxBatchSize splits one batch into consecutive chunks",
            args: [users, [[1, 2, 3, 4, 5]], { maxBatchSize: 2 }],
            expected: {
              results: [
                [
                  { ok: true, value: { id: 1, name: "Ada" } },
                  { ok: true, value: { id: 2, name: "Grace" } },
                  { ok: true, value: { id: 3, name: "Linus" } },
                  { ok: true, value: { id: 4, name: "Barbara" } },
                  { ok: true, value: { id: 5, name: "Ken" } },
                ],
              ],
              queries: [[1, 2], [3, 4], [5]],
            },
          },
          {
            description: "an empty wave sends no query",
            args: [users, [[]]],
            expected: { results: [[]], queries: [] },
            isEdgeCase: true,
          },
          {
            description: "null and undefined ids reject with a TypeError and never reach the database",
            args: [users, [[1, null, undefined, 2]]],
            expected: {
              results: [
                [
                  { ok: true, value: { id: 1, name: "Ada" } },
                  { ok: false, error: "TypeError" },
                  { ok: false, error: "TypeError" },
                  { ok: true, value: { id: 2, name: "Grace" } },
                ],
              ],
              queries: [[1, 2]],
            },
            isEdgeCase: true,
          },
          {
            description: "a failed query rejects every caller and isn't cached, so the next wave retries",
            args: [users, [[1, 2], [2, 1]], { failQueries: [1] }],
            expected: {
              results: [
                [
                  { ok: false, error: "DbError" },
                  { ok: false, error: "DbError" },
                ],
                [
                  { ok: true, value: { id: 2, name: "Grace" } },
                  { ok: true, value: { id: 1, name: "Ada" } },
                ],
              ],
              queries: [[1, 2], [2, 1]],
            },
            isEdgeCase: true,
          },
          {
            description: "a failed chunk only affects the callers in that chunk",
            args: [users, [[1, 2, 3, 4]], { maxBatchSize: 2, failQueries: [2] }],
            expected: {
              results: [
                [
                  { ok: true, value: { id: 1, name: "Ada" } },
                  { ok: true, value: { id: 2, name: "Grace" } },
                  { ok: false, error: "DbError" },
                  { ok: false, error: "DbError" },
                ],
              ],
              queries: [[1, 2], [3, 4]],
            },
            isEdgeCase: true,
          },
          {
            description: "missing rows are cached too: a second request for an unknown id doesn't query",
            args: [users, [[99], [99]]],
            expected: {
              results: [[{ ok: true, value: null }], [{ ok: true, value: null }]],
              queries: [[99]],
            },
            isEdgeCase: true,
          },
          {
            description: "1,000 loads of 500 distinct ids in one burst become a single query",
            args: [manyUsers, [[...manyUsers.map((u) => u.id), ...manyUsers.map((u) => u.id)]]],
            expected: {
              results: [[...manyUsers, ...manyUsers].map((u) => ({ ok: true, value: u }))],
              queries: [manyUsers.map((u) => u.id)],
            },
            isEdgeCase: true,
          },
        ],
      },
    },
  ],
} satisfies Module;
