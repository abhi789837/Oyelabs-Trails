# SQL & Relational Databases research notes (2026-09-21)

## Videos
- Course verified: "SQL Tutorial - Full Database Course for Beginners" (freeCodeCamp.org, Mike Dane), `HXV3zeQKqGY`, 4:20:39, 21M views, embeddable. Chapter-split onto four topics plus one alternate (below).
  - The description has a typo: it lists "More Basic Queries" at 2:30:27 before "Functions" at 2:26:24, so YouTube drops "Functions" from its chapter markers. The captions show 2:26:24 is still inside "Creating Company Database" and the "[Functions]" chapter starts at 2:36:24 (9384 s). `sql-aggregation-group-by` uses 9384. The other chapter starts (6971, 10896, 11509, 1390) were also checked against the captions.
- sql-normalization: Learn Database Normalization - 1NF, 2NF, 3NF, 4NF, 5NF (Decomplexify, 28:34); focused, 3.2M views. Alternates: Learn Database Denormalization (Decomplexify, 19:07) for the tradeoff side, and the Mike Dane course from "Tables & Keys" at 1390.
- sql-select-filtering: Mike Dane course, from "Basic Queries" at 6971 (about 12 min).
- sql-joins: Mike Dane course, from "Joins" at 10896 (about 10 min).
- sql-aggregation-group-by: Mike Dane course, from "Functions" at 9384 (COUNT/AVG/SUM and GROUP BY; about 9 min). See the timestamp note above.
- sql-subqueries-ctes: Mike Dane course, from "Nested Queries" at 11509. The course has no CTE or window-function coverage, so there are two alternates: techTFQ "SQL WITH Clause" (24:47) and "SQL Window Function" (24:54), both English, around 0.8M/1.6M views.
- sql-indexes-explain: Database Indexing Explained (with PostgreSQL) (Hussein Nasser, 18:18). Alternates: A beginners guide to EXPLAIN ANALYZE by Michael Christofides of pgMustard (Tiger Data channel, 30:05), and Postgres Explain Explained (Hussein Nasser, 10:17).
- sql-transactions-isolation: Relational Database ACID Transactions (Explained by Example) (Hussein Nasser, 42:43). Alternate: Martin Kleppmann, "Transactions: myths, surprises and opportunities" (Strange Loop, 41:08); it's from 2015, but its coverage of weak isolation and write skew is still current.
- sql-postgres-features: I replaced my entire tech stack with Postgres... (Fireship, 8:12, 2025). Alternate: pganalyze webinar "Hands on Postgres 18: Async I/O, B-tree Skip Scan, UUIDv7" (1:10:50). It has few views but covers exactly the PG 18 facts used here.
- sql-orms: I tried 8 different Postgres ORMs (Beyond Fireship, 9:46, 2023). Alternate: They Finally Fixed Prisma (Josh tried coding, 16:35, Nov 2025), which covers the Prisma 7 changes.
- sql-n-plus-one: GraphQL N+1 Problem (Ben Awad, 16:14); it builds the DataLoader fix that the challenge asks for. Alternate: SQLite and the N+1 (no) problem (Mycelial, 8:29), on why N+1 is a latency problem. I searched for an English ORM-focused N+1 video with real views and didn't find one; the other results were Hibernate/JPA-specific or in Hindi.
- No search-URL fallbacks.

## References
- The PostgreSQL docs are pinned to `/docs/18/`, as the brief asks, instead of `/docs/current/` (which will move to 19 when it's released). postgresql.org sends `frame-ancestors 'none'`, so every PG doc falls back to a link card.
- use-the-index-luke.com and modern-sql.com send `X-Frame-Options: SAMEORIGIN` (link cards).
- Prisma URLs redirect: `/docs/orm/prisma-client/queries/relation-queries` now ends at `/docs/orm/fundamentals/relations-and-joins`, and the query-optimization page ends at `/docs/orm/v7/prisma-client/queries/advanced/query-optimization-performance`. The final URLs are the ones used.
- Joined-tables and GROUP BY refs use fragment anchors on `queries-table-expressions.html` (the base page is 200).

## Facts verified
- PG 18 release notes (released 2025-09-25): AIO subsystem (`io_method`, default `worker`, `io_uring` needs a liburing build; runtime-config-resource), B-tree skip scan, `uuidv7()` (plus `uuidv4()` alias), virtual generated columns as the default, OLD/NEW in RETURNING, MD5 deprecated (not removed), OAuth auth, pg_upgrade keeps statistics, BUFFERS on by default with EXPLAIN ANALYZE, `WITHOUT OVERLAPS` temporal keys, data checksums on by default in initdb.
- transaction-iso (PG 18): READ COMMITTED is the default; RR doesn't allow phantoms in PG; error texts "could not serialize access due to concurrent update" and "... due to read/write dependencies among transactions"; SSI; SQLSTATE 40001; retry advice; READ COMMITTED re-evaluates WHERE on the updated row version.
- queries-with: folding rule (non-recursive, side-effect-free, referenced once), MATERIALIZED/NOT MATERIALIZED, data-modifying CTEs run exactly once and share one snapshot (products price example), CYCLE/SEARCH.
- indexes-multicolumn: leftmost-column rule and skip scan wording (effective only with few distinct leading values). using-explain: ANALYZE executes the statement (BEGIN/ROLLBACK advice), per-loop averages, bitmap scan rationale, rows shown with decimals in 18.
- ddl-constraints: FK referencing columns aren't indexed automatically; UNIQUE treats NULLs as distinct unless `NULLS NOT DISTINCT`. ddl-generated-columns: virtual is the default, and virtual columns may only use built-in functions and types. (The docs don't say whether virtual columns can be indexed, so no question relies on that.)
- datatype-json: `jsonb_ops` vs `jsonb_path_ops` operator support; a column GIN index doesn't serve `->>` comparisons. sql-insert: ON CONFLICT atomicity, an arbiter unique index is required for DO UPDATE, EXCLUDED, the cardinality-violation rule.
- Prisma: v7.0.0 (2025-11-19 changelog) makes the Rust-free client the default and requires driver adapters; findUnique calls in the same tick are batched by its dataloader; `relationLoadStrategy` join vs query. npm (2026-09-21): prisma stable 7.10.0 (8.0 in RC), typeorm 1.1.1, sequelize 6.37.8 (v7 still alpha), drizzle-orm 0.45.2 (1.0 beta). Quizzes avoid version numbers other than "Prisma ORM 7".
- DataLoader README: batch contract (same length and order), per-request cache, dedupe, errors from a rejected batch aren't cached.
- 65,535 bind parameters: the Bind message's parameter count is an Int16 (PostgreSQL protocol).
