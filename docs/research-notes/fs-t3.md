# The T3 Stack & End-to-End Type Safety research notes (2026-09-21)

## Videos
YouTube watch pages returned HTTP 429 (Google "sorry" captcha) to `yt.mjs info`, so durations and chapter timestamps
came from YouTube's innertube `player` endpoint (the same `videoDetails.lengthSeconds` and description the watch page
embeds). Existence and embeddability come from `yt.mjs info` (oEmbed 200, `embeddable: true`) for every id below.

- t3-trpc-fundamentals: "Learn tRPC In 45 Minutes" (Web Dev Simplified, 45:35, Feb 2023). Chapters cover routers,
  procedures, context, middleware, the client and subscriptions; it's tRPC 10, so the summary states the v11 changes.
  Alternates: "tRPC v11 with TanStack Query on TanStack Start! Part 1" (Jack Herrington, 16:29, Mar 2025) for v11's
  `@trpc/tanstack-react-query`, and Theo's T3 tutorial from "tRPC Context, auth state, and private procedures" at
  1:19:15 (4755 s).
- t3-prisma-schema-migrations: "Prisma Migrations: A Step-by-Step Guide" (Prisma, 12:13, Jan 2025; Prisma 6 era:
  first migration, deploying, resolving a failed migration). Alternates: "Prisma 7 is here." (Prisma, 3:08, Nov 2025) and
  "Prisma essentials: from development to production (Prisma Migrate workflow)" (Neon Postgres, 8:47, Mar 2024, CI
  pipeline with `migrate deploy`).
- t3-end-to-end-type-safety: "T3 Stack Tutorial - FROM 0 TO PROD FOR $0 (Next.js, tRPC, TypeScript, Tailwind, Prisma &
  More)" (Theo - t3․gg, 2:59:02, Mar 2023), from "From Prisma Schema to tRPC Procedure" at 21:15 (1275 s). The brief's
  candidate `YkOSUVzOAA4` is real. What's outdated, checked in its repo (t3dotgg/chirp): Next 13.2 Pages Router, tRPC 10.9
  with React Query 4, Prisma 4 on PlanetScale MySQL with `relationMode = "prisma"` and no migrations folder (schema pushed
  with `db push`), Clerk 4 rather than NextAuth, superjson 1.9, `createProxySSGHelpers`. PlanetScale retired its free
  Hobby plan on 2024-04-08, so "$0" no longer holds. Alternate: "T3: TRPC, Prisma and NextAuth Done Right" (Jack
  Herrington, 43:13, Feb 2023) from "Adding Tables To The Schema" at 20:13 (1213 s).
- t3-when-to-use: "tRPC, gRPC, GraphQL or REST: when to use what?" (Software Developer Diaries, 10:46, Mar 2023).
  Alternates: "The T3 Stack - How We Built It" (Theo - t3․gg, 7:23, Jul 2022; the T3 axioms) and "End to End Type Safety
  in a Monorepo" (Nx, 19:47, Sep 2026; OpenAPI codegen between .NET and TypeScript, i.e. the polyglot alternative).
- Considered and not used: Theo "Flaws of the T3 Stack" (2022), "Is This The End Of T3 Stack? (JStack Breakdown)"
  (2025), "From 0 to Production - The Modern React Tutorial" (used in fs-capstone instead), Matt Pocock "Learn tRPC in 5
  minutes" (2023), Web Dev Simplified "Is tRPC The End Of REST/GraphQL?" (2023).
- The Theo 2023 tutorial appears twice in this module at different chapters (4755 s as an alternate, 1275 s as a primary).
- No search-URL fallbacks.

## References
- Prisma's docs were restructured for Prisma 8: unversioned `/docs/orm/prisma-migrate/...` URLs now redirect to Prisma 8
  pages (for example development-and-production → `/docs/orm/migrations/applying-a-migration`), so every Prisma link uses
  the explicit `/docs/orm/v7/...` pages. The upgrade guide is at `/docs/guides/upgrade-prisma-orm/v7`.
- superjson's repository moved: `github.com/flightcontrolhq/superjson` redirects to `github.com/ravionhq/superjson`.
- `create.t3.gg/en/usage/better-auth` is a 404 (the docs lag the CLI's Better Auth option); not used. create.t3.gg's tRPC
  page still shows Pages Router examples.
- Block iframe previews: prisma.io (CSP `frame-ancestors 'self'`), vercel.com (CSP), nextjs.org (X-Frame-Options DENY),
  github.com (`frame-ancestors 'none'`), industrialempathy.com (SAMEORIGIN). Allow framing: create.t3.gg, trpc.io,
  tkdodo.eu, lexi-lambda.github.io, orpc.dev.

## Facts verified
- create-t3-app 7.40.0 is npm `latest` (published 2025-11-05; last commit on main 2025-12-13). `cli/src/cli/index.ts`
  prompts: auth None / NextAuth.js / BetterAuth; ORM None / Prisma / Drizzle; App Router yes/no; database SQLite (LibSQL) /
  MySQL / PostgreSQL / PlanetScale; ESLint/Prettier or Biome. `dependencyVersionMap.ts` pins `prisma` `^6.6.0`,
  `next-auth` `5.0.0-beta.25`, `better-auth` `^1.3`, `@trpc/*` `^11.0.0` with `@trpc/react-query` (classic),
  `@tanstack/react-query` `^5.69.0`, `superjson` `^2.2.1`. The app-router `trpc.ts` template sets the superjson
  transformer, an `errorFormatter` that flattens `ZodError`, a timing middleware and a `protectedProcedure` that throws
  `UNAUTHORIZED` and narrows `session`; `react.tsx` uses `httpBatchStreamLink` and `createTRPCReact`.
- npm on 2026-09-21: `@trpc/server` 11.19.0; `@prisma/client` 7.10.0; `prisma` dist-tag `latest` is 8.0.0-rc.15 (`prev`
  7.10.0); `next-auth` latest 4.24.15, beta 5.0.0-beta.32; `better-auth` 1.7.5; `zod` 4.6.5; `superjson` 2.2.6.
- Prisma release-status page: Prisma 7 is stable, Prisma 8 is a release candidate with GA expected October 2026, and
  "npm install prisma and npx prisma now give you the Prisma ORM 8 command-line tool, which does not read schema.prisma and
  has no generate, migrate dev, or db push commands"; it advises `npm install --save-dev prisma@7`.
- Prisma 7 upgrade guide: `prisma-client` generator with a required `output`; driver adapters required for all databases;
  `prisma.config.ts` holds the datasource URL (`url`, `directUrl`, `shadowDatabaseUrl` in the schema are deprecated); env
  vars aren't loaded by default; `migrate dev` and `db push` no longer run `generate`; automatic seeding removed;
  `--skip-generate`/`--skip-seed` removed; Rust engine removed; Node 20.19+ and TypeScript 5.4+.
- Prisma v7 docs: `migrate dev` replays history into the shadow database, detects drift and may prompt to reset;
  `migrate deploy` doesn't detect drift, reset, generate or use a shadow database, and uses advisory locking; the shadow
  database needs `CREATEDB` on Postgres, with an explicit warning not to reuse the main URL; renaming a field generates
  CREATE + DROP by default (`--create-only` then `RENAME COLUMN`); `db push` writes no migrations and needs
  `--accept-data-loss` for destructive changes. P3009 ("failed migrations in the target database, new migrations will not
  be applied") is the behaviour behind the failed-migration question; the v7 hotfixing page documents `migrate resolve
  --rolled-back` / `--applied`.
- tRPC source (main): `getErrorShape` uses `error.message` (an unknown thrown error keeps its message; only the stack is
  dev-only); `getHTTPStatusCode` returns 207 when statuses differ; `callRecursive` turns thrown errors into
  `{ ok: false }` results, and the "No result from middlewares" check happens once at the top; the input middleware merges
  object inputs; the output middleware returns the parsed data and throws `INTERNAL_SERVER_ERROR` "Output validation
  failed"; `inferTransformedProcedureOutput` applies `Serialize` only when no transformer is set (`Date` → `string`,
  `Map`/`Set` → `object`, `bigint` → `never`); the client's data loader batches with `setTimeout(dispatch)`.
- tRPC docs: RPC spec (GET for queries, POST for mutations, `batch=1`, comma-joined paths, 207 when one call errored and
  one succeeded); error-code table; `httpBatchStreamLink` can't set headers or cookies from procedures; v10 → v11 guide
  (transformer moves to links, React Query v5, `createTRPCProxyClient` → `createTRPCClient`, TypeScript ≥ 5.7.2);
  validators support Standard Schema; output validation failures are `INTERNAL_SERVER_ERROR`.
- superjson README: supported types (`undefined`, `bigint`, `Date`, `RegExp`, `Set`, `Map`, `Error`, `URL`) and the
  `registerCustom` recipe for `Decimal.js`/`Prisma.Decimal`. Tested in Node 24 with superjson 2.2.6 and decimal.js: a
  `Decimal` round-trips as the string `"19.99"`; `JSON.stringify({ a: 1n })` throws "Do not know how to serialize a
  BigInt". Zod 4: `z.object` strips unknown keys (tested).
- react.dev `'use client'` reference: serializable Server → Client props (primitives including `bigint`, `Date`, `Map`,
  `Set`, typed arrays, plain objects, promises, Server Functions; not class instances).
- Vercel Skew Protection docs: pins framework-managed requests (assets, client navigations, Server Actions, prefetches),
  not custom `fetch()` calls; default maximum age one day.
- Next.js 16.3 Server Actions guide: dispatched one at a time per client; stale clients hit "Failed to find Server Action".
- Theo's 2024 tutorial repo (t3dotgg/t3gallery) `package.json` has no tRPC dependency (Drizzle with `drizzle-kit push`,
  Clerk, Sentry, PostHog, Upstash, `@t3-oss/env-nextjs`).
- The tRPC challenge's expected values were generated from the reference solution and checked by hand (batch status
  rules, middleware and log order, masked 500s, input merging).
