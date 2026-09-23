# Oyelearn v3 — build report

Written at the end of the v3 build. Everything here is a statement about what the repository
actually does, checked against a command or a test, not against intent. Where something is
untested or unverified it says so.

**Last full verification:** 2026-09-23. Node v24.11.1, npm 11.6.2, Windows 11 + Git Bash.

---

## 1. What exists now

An internal training platform for the Oyelabs dev team, rebuilt from a client-only SPA into a
server-owned, assessed learning system.

A superadmin onboards a learner and records what they claim to know. The server generates a
**proctored adaptive assessment** from that profile, grades it, and turns the result into a
**published learning plan**. The learner sees only their plan — not the catalogue — and works
through it topic by topic, each with verified references, an embedded video and a graded
challenge. Finishing a track issues a certificate.

The important architectural change from v2: **the client is no longer trusted with anything.**
Content, answer keys, grading, timing and progress all live on the server. The client renders
what it is given.

---

## 2. Phases

| Phase | What landed | Commit |
| --- | --- | --- |
| P0 | Server + shared scaffold, Fastify, Drizzle + migrations, dev script, `/api/health`, Vite proxy | `17f087e` |
| P1 | Users, sessions, seeded superadmin, login and change-password, guards, admin onboarding, audit log | `85462c5` |
| P2 | Server content bundle, filtered manifest and content API, server-side quiz grading, sandboxed code verification, progress API, manual plan editor | `d822436` |
| P3 | AES-256-GCM credential box, credential CRUD and UI, four AI adapters, verification job, `ai_calls` audit, SQLite job queue | `a1a31e2` |
| P4 | Blueprint → per-area item pools → critic → code validation; Issue assessment; admin pool preview | `88e220a` |
| P5 | Pre-flight, item runner, adaptive selector, proctoring detectors, warnings and escalation, SSE live view, termination | `f741112` |
| P6 | Explain-grading, evaluation job, plan validation and publish, learner `/plan`, admin evaluation tab | `a3e9176` |
| P7 | Admin overview, people table, seven-tab learner detail, audit log page, retention and backups | `f732c5c`, `0487585` |
| P8 | Dockerfile, compose, `Caddyfile.example`, `.env.example`, README — **artifacts only, nothing deployed** | `f732c5c` |
| Wave 1 | 30 curriculum camps: the PHP & Laravel, Mobile and DevOps tracks in full, plus Angular and Svelte | 30 `content:` commits |

Work done outside the phase plan, at your request during the run: the **Oyelearn rebrand** and
colour system (`64538e0`, `e4d8912`), **deployment verification and fixes** (`4e40142`), and a
**dev password-reset script** (`45671da`).

---

## 3. The curriculum

| Track | Camps | Topics | Quiz questions | Code challenges |
| --- | ---: | ---: | ---: | ---: |
| Frontend | 16 | 179 | 1,310 | 51 |
| Backend | 12 | 92 | 675 | 28 |
| PHP & Laravel | 14 | 178 | 1,863 | 0 |
| Mobile Development | 7 | 107 | 991 | 7 |
| DevOps & Cloud | 7 | 107 | 1,081 | 3 |
| AI-Driven Development | 6 | 30 | 244 | 6 |
| Full-Stack | 5 | 22 | 163 | 8 |
| **Total** | **67** | **715** | **6,327** | **103** |

**1,313 unique videos. 2,441 unique reference URLs.**

Three tracks are quiz-only by design. The code sandbox is a V8 isolate, so PHP, Dart, Kotlin,
Swift, HCL, YAML and shell cannot be graded; those camps carry their difficulty in
predict-the-output questions on real snippets instead, which test the same reading comprehension.
That decision is recorded under `## v3 decisions` in `docs/PROGRESS.md`.

### How the content was sourced

Every video id came from `scripts/research/yt.mjs`, which reads YouTube's own pages, and every one
was confirmed with `yt.mjs info` before use — never written from memory. Every reference URL was
checked with `scripts/research/check-urls.mjs`. Each camp has a research note in
`docs/research-notes/` recording what was verified, from which source, and what was deliberately
**not** asserted.

That discipline caught things worth knowing:

- **`reactnative.dev`'s own architecture page is stale** — it still documents the
  `newArchEnabled=false` opt-out, removed at 0.82. The topic says so and cites the corrective.
- **NestJS restructured its docs.** Eight links in the existing Backend camp were dead and
  invisible, because `docs.nestjs.com` answers every path with 200. Found by checking the
  `nestjs/docs.nestjs.com` repository tree; all eight repaired.
- **`docs.flutter.dev/perf/shader` now redirects away**, so the SkSL warm-up advice in older
  tutorials is dated — one question tests recognising that.
- **Laravel 13's docs lead with attributes** (`#[Fillable]`, `#[Scope]`, `#[ObservedBy]`) rather
  than `$fillable` and `scopeFoo()`, and `app/Http/Kernel.php` has not existed since Laravel 11.
- **`laravel.com/docs/13.x/ai` is not the AI SDK** (that is `/ai-sdk`); `/echo` and `/nightwatch`
  are 404s.

---

## 4. Quality gates

All run on 2026-09-23 at `2f8daec`.

| Gate | Command | Result |
| --- | --- | --- |
| Types | `npm run typecheck` | clean |
| Tests | `npx vitest run` | **229 passed**, 14 files |
| Content standards | `npm run content:check` | 67 modules, 715 topics, **0 errors, 0 warnings** |
| Reference solutions | (part of `content:check`) | **103 of 103 execute and pass** |
| Content types | `npm run content:types` | clean |
| Videos | `npm run content:videos` | **1,313 checked, 0 broken or not embeddable** |
| Reference embeddability | `npm run content:embeds` | 2,441 URLs classified across 365 domains — 235 allow framing, 124 block, 6 mixed. See the note below |
| Production build | `npm run build` | clean |
| Container | `docker build` + run | 286 MB, boots, health green |

### Two things the final gate run caught

**A latent fixture bug, triggered by content volume.** 35 tests began failing once the curriculum
passed 48 modules: the mock blueprint fixture spread every module across its areas — 11 per area
at 67 modules — while `blueprintAreaSchema` caps `moduleIds` at 8, so every blueprint failed
validation and the whole P4–P6 pipeline reported `failed`. Fixed in `2f8daec` by exporting
`MAX_AREA_MODULES` and consuming it in both places. It was test scaffolding, not the pipeline:
real provider output was always validated against the same schema.

**The served content bundle was stale.** `server/content/` held five tracks while the source had
seven, because the generator had not been re-run since the Mobile and DevOps camps were written.
The app would have served a curriculum missing 214 topics. Rebuilt; `npm run build` regenerates it
via `prebuild`, so a normal build cannot reproduce this — only a dev server started mid-authoring.

### The embed sweep's seven "unreachable" URLs

`content:embeds` exited non-zero on seven URLs. None is a dead link:

- **Five `laravel.com` URLs returned 429** — the sweep itself hammered that host with 157 URLs and
  got rate-limited. All five were confirmed 200 earlier in the run, individually.
- **Two were transient** (`cseweb.ucsd.edu`, `platform.claude.com`) and returned 200 on a
  single-URL retry.

The generated verdicts are still correct, because the fallback is the safe direction: an
unconfirmed URL is recorded as *not* embeddable, which renders a link-preview card. `laravel.com`
sends `X-Frame-Options: SAMEORIGIN` and would be a link card regardless, so nothing was lost.
**If you re-run the sweep, expect the same five if you have hit `laravel.com` recently.**

### Known flake

One `vitest` run died with `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file
src\win\async.c` — a libuv teardown crash on Windows involving `isolated-vm` and the worker pool,
not a test failure. It passed on re-run and has not recurred. If it appears in CI, it is a
teardown race, not a regression in the code under test.

---

## 5. Security checklist (brief §15)

Full evidence is in `docs/SECURITY_CHECKLIST.md`, walked item by item. Summary:

| # | Item | Status | Evidence |
| --- | --- | --- | --- |
| 1 | No answer keys, hidden tests or other learners' data reachable by a learner | Done | One choke point (`content/filter.ts`) builds served objects field by field, so a new authoring field will not compile until someone decides whether a learner may see it. Nine tests assert against the **raw response body**; one iterates `app.routeTable`, so a new admin route is covered the moment it is registered |
| 2 | All inputs validated with zod; 64 KB JSON / 200 KB snapshot limits | Done | `parseOrThrow` on every body, params and query; limits shared between client and server in `shared/api.ts`; uploads additionally checked for the JPEG magic number |
| 3 | Helmet with a CSP | Done | `lib/csp.ts`; every relaxation is named and commented. The inline theme script is allowed by its **SHA-256 hash**, computed from the built file at boot |
| 4 | Rate limits on login, events and answers | Done | Per-route via `@fastify/rate-limit`; a per-account lock (8 failures → 15 minutes) is what stops a targeted attack. Deliberately not global, which would throttle the heartbeat and the live feed |
| 5 | Secrets encrypted at rest; keys required in production | Done | AES-256-GCM with a fresh nonce; `env.ts` refuses to boot in production without `APP_MASTER_KEY`/`SESSION_SECRET`. Tests assert the secret appears in no response, row or audit entry |
| 6 | Child processes: minimal env, timeout, killed process trees | Done | `spawnJson.ts`; the server's own keys are not in the child env. **Never executed live** — see §6 |
| 7 | Snapshots served only through auth-checked routes | Done | Written outside any static root; path resolved and confined before reading; `../../oyelearn.db` is refused |
| 8 | Nightly `VACUUM INTO`, keeping 14 | Done | `maintenance/retention.ts`; tests restore a backup and read rows back |
| 9 | Sandbox under `isolated-vm` with memory limit and timeout | Done | Fresh isolate per run, 128 MB, 5 s. Tests assert `require`, `process`, `fetch`, `Buffer` and `setTimeout` are all undefined inside, and that one submission cannot poison the next |

---

## 6. Blocked / needs Abhishek

1. **No real AI credential.** `ANTHROPIC_API_KEY` was never set in this environment, so every AI
   path was built and verified against a deterministic `MockProvider`. The pipeline is proven —
   blueprint → pools → critic → code verification → evaluation → plan, with the rejection paths
   firing — but **whether a real model writes good items is untested.** Add a credential in
   Admin → AI connection and re-run P4/P6 before trusting live output. The mock is never
   constructible in production and the admin page shows a banner while it is in use.
2. **The two CLI AI adapters have never been executed.** Neither the `claude` nor the `codex` CLI
   is installed here. Error handling and redaction are covered; the actual invocation, JSON
   envelope shape and token-usage fields need one live run each. The API adapters are the
   recommended path and carry no such caveat.
3. **Proctoring has never run against a real camera and a real person.**
   `docs/PROCTORING_TEST.md` is the checklist. This is the largest untested surface in the build.
4. **Disconnect the Vercel project.** v3 cannot run on Vercel — SQLite on a persistent disk, a
   background worker, an SSE feed and a native module all need a long-lived process. `vercel.json`
   now fails the build with an explanation rather than a confusing `vite: command not found`, but
   the project should simply be removed.
5. **The GitHub repository is still named `Oyelabs-Trails`.** Renaming it is yours to do; I did
   not touch it. `docs/TRAILS_V3_BRIEF.md` also keeps its filename deliberately, because the build
   instructions point at it by name.
6. **Backups sit on the same volume as the database.** Copying them off the host is the operator's
   job; the README says so.
7. **No CSRF token.** The session cookie is `SameSite=Lax` and the API accepts only JSON or
   multipart, so classic form-post CSRF does not apply. A token is worth adding if that cookie
   policy is ever loosened.
8. **`frame-src https:`** is the one deliberately broad CSP directive, as the brief allows.

### Videos worth a manual re-pick

Every video is live and embeddable, but five topics settled for the best available rather than a
good match, and say so in their research notes:

- `rn-images-assets` — nothing current exists on `expo-image`; the space is all image-*picker*
  tutorials.
- `lv-api-exceptions` — every full treatment of Laravel exception handling predates
  `bootstrap/app.php`.
- `lv-auth-csrf` — no video anywhere covers `PreventRequestForgery` or its `Sec-Fetch-Site` layer.
- `lin-debug-wont-start` and `net-debugging-toolkit` — no credible dedicated video exists; every
  hit was under ~800 views.
- `flutter-state-management` — no current, well-viewed, even-handed comparison exists.

---

## 7. Running it locally

```bash
npm install                 # postinstall fetches ~46 MB of MediaPipe assets
npm run dev                 # builds content, then web (5173) + api (8787)
```

Open **http://localhost:5173**. Vite proxies `/api` to the server, so that is the only URL needed.

The superadmin password is generated on first boot and printed to the log **once**. If you lose
it:

```bash
npm run dev:password -- admin       # sets a temporary one, clears any lockout, revokes sessions
```

Sample learners, with profiles and printed passwords:

```bash
npm run dev:seed                    # three learners
npm run dev:seed -- --issue         # and an assessment for each
```

---

## 8. Deploying

**Not Vercel.** A small Linux VPS with Docker and Caddy — two vCPU and 2 GB is comfortable,
because grading a submission spins up a V8 isolate.

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin caddy

git clone <your-remote> oyelearn && cd oyelearn
cp .env.example .env
openssl rand -base64 32     # → APP_MASTER_KEY
openssl rand -base64 32     # → SESSION_SECRET
$EDITOR .env                # leave SUPERADMIN_PASSWORD empty

docker compose up -d --build
docker compose logs -f oyelearn     # the generated superadmin password prints here, once

sudo cp Caddyfile.example /etc/caddy/Caddyfile
sudo $EDITOR /etc/caddy/Caddyfile   # set the domain and the email
sudo systemctl reload caddy

curl -fsS https://your-domain/api/health
```

**Back up `APP_MASTER_KEY` off the server.** If it changes, every stored AI credential becomes
unreadable and has to be re-entered.

This path is verified, not assumed: the image was built and run during this session — 286 MB,
`isolated-vm` loads, 715 topics served, health green, login works, CSP applied, and the
must-change-password gate correctly locks a freshly seeded superadmin out of every route.

---

## 9. Adding to the curriculum

1. Add the camp to `src/content/registry.ts` with an `idPrefix`.
2. Write `src/content/<trackId>/<moduleId>.ts` following `docs/CONTENT_GUIDE.md` — which is the
   authoring spec, including the research protocol, the difficulty standard, and a table of hosts
   the URL checker cannot verify.
3. Write `docs/research-notes/<moduleId>.md`.
4. `npm run content:check -- --module <moduleId>` until it is 0 errors.

Topic ids are URL slugs and progress keys. **Never rename one.**
