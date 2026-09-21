# Backend Testing & Ops research notes (2026-09-21)

## Videos

The brief gives no video for this module, so every pick below came from `yt.mjs search` and was verified with `yt.mjs info`. YouTube rate-limited watch-page requests partway through (redirects to google.com/sorry), so I retried in the background until every video's duration and chapters came back. oEmbed confirmed that all of them allow embedding.

- ops-unit-testing: Programming with Mosh, "JavaScript Unit Testing Tutorial for Beginners" (48:31, Jan 2024, ~200k views). It uses Vitest. Alternates: Net Ninja, "Unit Testing (Vitest) Tutorial #11 - Mock Functions" (12:10, Dec 2025), for Vitest-specific mocking; and Web Dev Simplified, "How To Write Better Tests In 6 Easy Steps" (19:53), from "When To Mock" at 5:30 (330), for mocking judgement and avoiding flaky tests.
- ops-integration-testing: TomDoesTech, "Testing Express REST API With Jest & Supertest" (55:43, 2021, ~140k views). Alternate: Dreams of Code, "Testcontainers have forever changed the way I write tests" (12:11, 2024), which covers the concept of throwaway real dependencies (the demo isn't in Node).
- ops-ci-cd-github-actions: DevOps Directive, "Complete GitHub Actions Course - From BEGINNER to PRO" (3:42:35, Sep 2025, ~327k views), from "Core Features" at 23:59 (1439), which runs into "Advanced Features". Alternates: the same course from "Best Practices" at 1:57:31 (7051), and TechWorld with Nana, "GitHub Actions Tutorial - Basic Concepts and CI/CD Pipeline with Docker" (32:30, 2020, 2.3M views). Nana's video is older (the action versions shown are dated and OIDC isn't covered), so it's an alternate only.
- ops-logging-monitoring: Better Stack, "12 Logging BEST Practices in 12 minutes" (12:00, Nov 2024, ~276k views). Alternates: Grafana, "The RED Method: How To Instrument Your Services" (Tom Wilkie, 20:19; covers USE, RED and the golden signals), and OpenTelemetry, "What is OTel? | OTel for Beginners - The JavaScript Journey" (9:11, Feb 2025). Also considered: Better Stack's Pino video (fluDEkA1h6w, which has a "Redacting log data" chapter) and IBM Technology's "Observability vs. APM vs. Monitoring".
- No search-URL fallbacks.

## References

- These block iframe previews: docs.github.com (CSP `frame-ancestors` limited to github.com), opentelemetry.io (`frame-ancestors 'self'`), vitest.dev/config (`X-Frame-Options: DENY`; the `/guide` pages are frameable), martinfowler.com (DENY), kentcdodds.com (self), and GitHub repos. sre.google, prometheus.io, OWASP, node.testcontainers.org and securitylab.github.com allow framing.
- GitHub's Actions docs were reorganised (`/reference/...`, `/concepts/...`, `/how-tos/...`). The final URLs were checked. The old required-status-checks troubleshooting URL now redirects to `/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks`.
- www.w3.org/TR/trace-context returned 403 to scripted requests, so the traceparent format is backed by the OpenTelemetry docs instead.

## Facts verified

- Vitest 5.0 (blog post dated September 3, 2026, and the "Migrating to Vitest 5.0" guide): needs Node >= 22.12 and Vite >= 6.4 (now a peer dependency); `clearMocks` defaults to true; `vi.mock`, `vi.unmock` and `vi.hoisted` outside the top level now throw; un-awaited `resolves`/`rejects` fail the test; fake timers and `setSystemTime` also mock `Temporal`; new `vi.when`; new `--repeats`; reports go to `.vitest/`; inline projects inherit the root config; worker ids start at 1.
- Vitest config pages: `restoreMocks` and `mockReset` default to false, `isolate` to true, `pool` to 'forks', `fileParallelism` to true. `VITEST_POOL_ID` is documented for per-worker resources.
- Vitest vi API docs: `vi.mock` is hoisted and its factory can't use outer variables (use `vi.hoisted`); `runAllTimers` throws after 10,000 timers (`fakeTimers.loopLimit`); `advanceTimersByTimeAsync` also runs timers set asynchronously; `useFakeTimers` doesn't fake `nextTick` or `queueMicrotask` by default. `mockClear` keeps implementations; `mockReset` resets to the original `vi.fn(impl)`; `mockRestore` restores `spyOn` originals.
- Supertest README: an app that isn't listening is bound to an ephemeral port per request. Express 5 JSON parse errors carry `status: 400` and `type: 'entity.parse.failed'` (tested locally).
- GitHub Docs (workflow syntax, dependency caching, secure use, OIDC, events, environments, required status checks):
  - Listing any `permissions` sets every unlisted one to `none`, and `id-token: write` is needed for OIDC. `pull_request_target` gets a read/write token even from forks.
  - Matrix: `fail-fast` defaults to true, with at most 256 jobs per run.
  - Caching: the cache action doesn't save on an exact key hit ("Cache hit occurred on the primary key ..., not saving cache" in `saveImpl.ts`); `setup-node` doesn't cache `node_modules`. A PR's cache is scoped to its merge ref. Entries are evicted after 7 days without access, with a 10 GB default per repository. The new `cache-mode` gives low-trust triggers read-only cache access by default.
  - Secrets: redaction matches exact values, so don't use structured secrets and register derived values with `add-mask`. Pinning to a full commit SHA is the only immutable reference.
  - `GITHUB_TOKEN`-triggered events don't create workflow runs, except `workflow_dispatch` and `repository_dispatch`.
  - Environment protection rules gate a job before it reaches a runner, and environment secrets are only available after that.
  - Required checks: a workflow skipped by path, branch or commit-message filters stays "Pending" and blocks merging. A job skipped by an `if` reports success, and a dependent job skipped because a needed job failed may not block merging (`success`, `skipped` and `neutral` all count as passing).
- Google SRE Workbook, "Alerting on SLOs": burn rate 14.4 over 1 hour spends 2% of a 30-day budget. The recommended page and ticket thresholds are 2% in 1 h, 5% in 6 h and 10% in 3 days. 99.9% over 30 days is 43.2 minutes of full outage.
- The tj-actions/changed-files tag compromise was checked against the MITRE CVE API (CVE-2025-30066): tags v1 through v45.0.7 were repointed to a malicious commit on 2025-03-14 and 2025-03-15.
