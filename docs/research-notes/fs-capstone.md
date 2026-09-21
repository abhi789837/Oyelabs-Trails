# Full-Stack Capstone & Deployment research notes (2026-09-21)

## Videos
As in fs-t3, watch pages returned HTTP 429 to `yt.mjs info`, so durations and chapters came from YouTube's innertube
`player` endpoint (same `lengthSeconds` and description), and every id was confirmed with `yt.mjs info` (oEmbed 200,
`embeddable: true`).

- fscap-env-secrets: "Secrets Management: Secure Credentials & Avoid Data Leaks" (IBM Technology, 9:40, Apr 2025; Jeff
  Crume on sprawl, plaintext storage, central managers and rotation). Alternates: "We Fixed Environment Variables" (Theo -
  t3․gg, 7:26, Apr 2023; t3-env's validated server/client split) and freeCodeCamp's "How to Deploy, Secure, and Automate
  Full-Stack Web Apps – Course for Beginners" (10:29:10, published 2026-09-15) from "Secrets & manual deployment reviews"
  at 8:11:05 (29465 s).
- fscap-cicd: "Top 5 Most-Used Deployment Strategies" (ByteByteGo, 10:00, Jun 2023). Alternates: "Every engineer should
  know this.. (Expand-Contract Pattern)" (Software Developer Diaries, 6:35, Aug 2026) and the same freeCodeCamp course from
  "Module 5: Automation pipeline" at 5:29:37 (19777 s: branch protection, pre-commit, GitHub Actions CI, SCA/SAST/DAST,
  Playwright, atomic swaps, rollbacks, rolling restarts).
- fscap-monitoring: "Observability Crash Course: Logs, Metrics, Traces Explained" (System Design Lab, 35:49, Aug 2026).
  A smaller channel, chosen because its chapters map one-to-one onto the topic: structured logs, counters/gauges/
  histograms, golden signals, traces and W3C Trace Context, OpenTelemetry, sampling, cardinality, SLI/SLO/SLA, error
  budgets, alerting on symptoms, burn-rate alerting, RUM and Core Web Vitals. Alternates: "Getting started with SLOs"
  (Google Cloud Tech, 8:12, May 2021) and "Adding Source Maps for JavaScript Projects (Video 6 of 9)" (Sentry, 12:22, Nov
  2022).
- fscap-scaling: "Scalability Simply Explained in 10 Minutes" (ByteByteGo, 9:20, Oct 2024). Alternates: "PostgreSQL
  connection management and per-client process model explained" (Arpit Bhayani, 8:34, Apr 2024) and "7 Must-know
  Strategies to Scale Your Database" (ByteByteGo, 8:41, Jul 2024).
- fscap-capstone: "From 0 to Production - The Modern React Tutorial (RSCs, Next.js, Shadui, Drizzle, TS and more)" (Theo -
  t3․gg, 3:03:11, Apr 2024): auth (Clerk), database (Drizzle on Vercel Postgres), deploy to Vercel, `server-only` and
  React Taint, Sentry, PostHog, Upstash rate limits, locked-down uploads. Alternates from other stacks: "T3 Stack Tutorial -
  FROM 0 TO PROD FOR $0" (Theo, 2:59:02, Mar 2023; tRPC + Prisma + Clerk + PlanetScale), "Full Stack Engineering Course |
  Build and Deploy a Full Stack PERN Admin Dashboard in 2026" (JavaScript Mastery, 7:53:22, Jan 2026; Express, Postgres,
  React/Refine, Better Auth, Arcjet, Site24x7 APM and RUM) and "MERN Stack Tutorial for Beginners with Deployment – 2025"
  (freeCodeCamp.org, 3:34:54, Jun 2025; a notes app, "ThinkBoard", with rate limiting and deployment but no auth).
- The freeCodeCamp deployment course is used at two different chapters (29465 s and 19777 s), both as alternates.
- Considered: TechWorld with Nana "GitHub Actions Tutorial" (2020), ByteByteGo "CI/CD In 5 Minutes" (2023), IBM "SRE
  Golden Signals Explained" (2022), Google Cloud Tech "The Art of SLOs" (2022), Hussein Nasser "Connection Pooling in
  PostgresSQL with NodeJS" (2019), JavaScript Mastery "Next.js 16 Full Course" (MongoDB, no auth).
- No search-URL fallbacks.

## References
- Redirects resolved to final URLs: OWASP API Security pages now live on `api-security.owasp.org`; Vercel's connection
  pooling guide moved to `vercel.com/kb/guide/...`; GitHub's "using environments for deployment" page is now
  `docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments`; `rfc-editor.org/rfc/rfcNNNN`
  redirects to an info page, so the `.html` URLs are used.
- The IETF Idempotency-Key header draft (`draft-ietf-httpapi-idempotency-key-header-07`) has expired, so Stripe's
  idempotency docs are the reference instead.
- Block iframe previews: 12factor.net (SAMEORIGIN), nextjs.org and martinfowler.com (DENY), docs.github.com, docs.stripe.com,
  opentelemetry.io, vercel.com (CSP), docs.sentry.io (sameorigin), github.com. Allow framing: sre.google,
  api-security.owasp.org, cheatsheetseries.owasp.org, env.t3.gg, pgbouncer.org, wiki.postgresql.org, rfc-editor.org.

## Facts verified
- Next.js 16.3 env docs: `NEXT_PUBLIC_` values are inlined at `next build` and frozen afterwards (a single image promoted
  across environments keeps build-time values); dynamic lookups aren't inlined; load order; `.env*.local` stays out of git.
- Vercel env docs: changes apply only to new deployments; 64 KB total per deployment.
- 12factor.net/config: the "open source at any moment without compromising credentials" litmus test.
- GitHub Actions: secrets aren't passed to workflows triggered from forks (except `GITHUB_TOKEN`).
- Google SRE workbook "Alerting on SLOs": burn-rate definition; for 99.9%, page at 2% of budget in 1 h (burn rate 14.4,
  5-minute short window) and 5% in 6 h (6, 30 min), ticket at 10% in 3 days (1, 6 h); budget consumed = burn rate ×
  window / period; short window = 1/12 of the long one. Quiz arithmetic: 0.0144 / 0.001 = 14.4; 720 h / 14.4 = 50 h;
  0.1% of 43,200 min = 43.2 min.
- web.dev Core Web Vitals: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at the 75th percentile; INP replaced FID in 2024; field
  data vs lab data.
- Sentry docs: source maps are linked by injecting Debug IDs; uploaded during production builds.
- PgBouncer features page: session/transaction/statement pooling; in transaction mode `SET`/`RESET`, `LISTEN`,
  `WITH HOLD` cursors, SQL `PREPARE`, `LOAD` and session-level advisory locks never work; protocol-level prepared
  statements work when `max_prepared_statements` is non-zero.
- PostgreSQL wiki: active connections ≈ `(core_count * 2) + effective_spindle_count`, and why more connections reduce
  throughput. Postgres forks one backend process per connection; the default `max_connections` is 100.
- RFC 9111 §3.5: a shared cache may reuse a response to a request with `Authorization` only if the response has
  `public`, `s-maxage` or `must-revalidate` (used in the CDN question).
- OWASP API Security Top 10 2023: API1 is Broken Object Level Authorization.
- `new URL("localhost:3000")` parses with protocol `localhost:` while `new URL("o123.ingest.sentry.io")` throws (Node 24,
  WHATWG parser; browsers behave the same). Used as an env-validator test case.
- `sign()` in the capstone driver is FNV-1a over `secret:data`, a deterministic stand-in for HMAC-SHA256 so the tests stay
  synchronous; the instructions say so. `base64UrlDecode` uses `atob`, available in browsers' workers and Node 16+.
- All three challenges' expected values were generated from the reference solutions and walked through by hand: every env
  error string and ordering, each release-plan step (including the NULL-tracking cases), and all 14 notes-API scenarios
  (token edge times: `exp = now - 30` is rejected and `now - 29` accepted with 30 s leeway; `now = exp + 30` is rejected).
