# Security checklist (brief §15)

Each item, its status, and the evidence. "Done" means there is a test or a file you can read, not
that it was intended.

Last walked: at the end of phase P8.

---

## 1. No answer keys, hidden tests, rubrics or other learners' data reachable by a learner

**Done.**

The filtering has one choke point — `server/src/content/filter.ts` — which builds served objects
field by field rather than spreading the authored one and deleting keys. A new field on the
authoring type will not compile until someone decides whether a learner may see it.

Tests, all asserting against the **raw response body** so a key nested at any depth would be caught:

| Test | File |
| --- | --- |
| A quiz module response contains no `correctIndex`, `correctIndices`, `explanation` or `isEdgeCaseOrInterviewQuestion` | `server/src/routes/content.test.ts` |
| The real explanations exist in the source, so the check above is meaningful | same |
| A code challenge exposes only visible tests, and hidden tests' **descriptions** do not leak either | same |
| A submission that hard-codes every visible answer still fails | same |
| Assessment `/next` carries no `correctIndices`, `expectedOutput`, `hiddenTests`, `referenceSolution`, `rationale` or `rubric`; the item object has exactly four keys | `server/src/routes/assessment.test.ts` |
| Answering returns `{ accepted: true }` and nothing else | same |
| One learner's progress is never visible to another | `server/src/routes/content.test.ts` |
| Another learner's assessment is 404, not 403 | `server/src/routes/assessment.test.ts` |
| A learner gets 403 on **every route in `app.routeTable`** starting `/api/admin` | `server/src/routes/admin/users.test.ts` |

That last one is self-extending: `app.routeTable` is populated by an `onRoute` hook, so a new admin
route is covered the moment it is registered rather than when someone remembers to add it.

Unassigned content returns **404, not 403**, so a response cannot be used to enumerate what exists.

## 2. All inputs validated with zod. Body limits: 64 KB JSON, 200 KB snapshot

**Done.** `BODY_LIMIT_JSON` (64 KB) is the Fastify-wide `bodyLimit`; the events route raises its
own to `BODY_LIMIT_SNAPSHOT` (200 KB) and `@fastify/multipart` is configured with the same
`fileSize`, one file and four fields.

Every route parses its body, params and query through `parseOrThrow(schema, …)`, which turns zod
issues into per-field 400s rather than a 500. Both constants live in `shared/api.ts`, so the client
and the server cannot disagree about them.

Uploaded snapshots are additionally checked for the JPEG magic number before being written.

## 3. Helmet with a CSP

**Done.** `server/src/lib/csp.ts`. Every relaxation is there for a named feature and commented with
it:

- `'wasm-unsafe-eval'` — MediaPipe's detectors are WebAssembly. It permits WASM compilation only,
  not `eval` of JavaScript.
- `worker-src blob:` — the code-challenge runner builds its Worker from a Blob URL, and MediaPipe
  spawns its own.
- `style-src 'unsafe-inline'` — React and Framer Motion set element `style` attributes, which this
  directive governs and which cannot practically be hashed.
- The `index.html` theme bootstrap stays inline (it must run before first paint to avoid a
  light/dark flash) and is allowed by its **SHA-256 hash**, computed from the built file at boot —
  not by `'unsafe-inline'`.
- `frame-src https:` — the brief explicitly allows this rather than deriving a ~130-host list from
  `embeds.generated.ts` on every build. **This is the one deliberately broad directive.** A framed
  document cannot reach into the page; the exposure is that a reference URL could load an
  unexpected site, which the content quality gate already checks.
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`.

## 4. Rate limits on login, events and answers

**Done**, via `@fastify/rate-limit` registered with `global: false` and applied per route:

| Route | Limit |
| --- | --- |
| `POST /api/auth/login` | 20 / minute per IP |
| `POST /api/auth/change-password` | 10 / 5 minutes |
| `POST /api/topics/:id/attempt` | 60 / minute |
| `POST /api/assessment/:id/events` | 120 / minute |
| `POST /api/assessment/:id/heartbeat` | 40 / minute |

The per-IP login limit is the outer bound; the per-account lock is what stops a targeted attack —
eight failures locks the account for fifteen minutes (`server/src/routes/auth.ts`, tested in
`auth.test.ts`).

A global limit is deliberately **not** applied: it would throttle the assessment heartbeat and the
admin's live feed.

## 5. Secrets encrypted at rest; APP_MASTER_KEY and the session secret required in production

**Done.** `server/src/crypto/secretBox.ts` — AES-256-GCM, a fresh 96-bit nonce per encryption,
authenticated so a tampered ciphertext fails to open rather than decrypting to garbage that would
then be sent to a provider as a key.

`server/src/env.ts` throws at boot in production without `APP_MASTER_KEY` or `SESSION_SECRET`, and
rejects a key that does not decode to exactly 32 bytes. Development generates and stores its own
under `DATA_DIR` so a fresh clone runs with no setup, using the same code path.

Tests in `server/src/ai/ai.test.ts`: the secret appears in no response body, no database row and no
audit entry; a tampered ciphertext and a wrong key both fail; the hint is only the last four
characters.

Passwords are argon2id at OWASP's recommended parameters (19 MiB, 2 passes, 1 thread), asserted by
checking the produced PHC string rather than the input.

The logger redacts `cookie`, `authorization`, `set-cookie`, and the password and secret body fields.

## 6. Child processes get a minimal env, a timeout, and killed process trees

**Done.** `server/src/ai/adapters/spawnJson.ts`. The child receives only `PATH`, `HOME`/
`USERPROFILE`, `SystemRoot`, `TEMP`/`TMP`, `NO_COLOR` and `CI`, plus whatever the caller passes —
the server's own `APP_MASTER_KEY` and `SESSION_SECRET` are not among them. On POSIX the child is
detached into its own process group and killed with `process.kill(-pid)`; on Windows with
`taskkill /t /f`. Output is capped, and `redact()` strips the credential and anything matching an
API-key shape from error text before it is stored or displayed.

The Codex adapter writes `auth.json` at mode 0600 inside a `mkdtemp` directory chmod'd to 0700, and
removes it in a `finally` block.

**Not verified live:** neither CLI is installed in the build environment, so these two adapters have
never actually been executed. Recorded in `docs/V3_STATE.md`.

## 7. Snapshots and uploads served only through auth-checked routes

**Done.** Snapshots are written under `DATA_DIR/snapshots/<assessmentId>/` — **not** under any
static root — and served only by `GET /api/admin/snapshots/*`, which is inside the superadmin
plugin. The handler resolves the path and confirms the result is still inside the snapshots
directory before reading, so `../` cannot walk out.

Tests in `server/src/routes/assessment.test.ts`: a learner gets 403; `../../oyelearn.db` is refused.
`server/src/maintenance/retention.test.ts` asserts the same check in the retention job, which
refuses to delete a path that escapes the directory.

## 8. SQLite backups: a nightly VACUUM INTO, keeping 14

**Done.** `server/src/maintenance/retention.ts`, started from `index.ts` on a daily timer with one
run 30 seconds after boot so a container that restarts daily still backs up.

`VACUUM INTO` writes a consistent copy without stopping writes, which a file copy of a WAL database
cannot promise. Tests restore a backup and read the rows back, and assert that the oldest are
pruned to 14.

**What this does not do:** the backups sit on the same volume as the database. Copying them off the
host is the operator's job, and the README says so.

## 9. The sandbox runs assessment code under isolated-vm with a memory limit and a timeout

**Done.** `server/src/sandbox/isolatedVmSandbox.ts` — a **fresh isolate per run** (pooling would let
one submission's poisoned prototype affect the next learner's grade), a 128 MB `memoryLimit`, and a
5-second timeout.

`server/src/sandbox/sandbox.test.ts` asserts that inside the isolate `require`, `process`, `fetch`,
`Buffer` and `setTimeout` are **all undefined**; that one submission cannot poison the next one's
globals; that an infinite loop is stopped; and that allocating far beyond the limit is stopped
without taking the process down.

`createSandbox` refuses to select the `worker_threads` fallback in production, and refuses to start
at all if `DEV_UNSAFE_RUNNER` is set there. The fallback exists only so the grading path can be
developed where `isolated-vm` will not build — in practice it built fine on Windows, so it is
unused.

Both implementations share one runtime source, so grading cannot differ between environments; the
same test suite runs against each.

---

## Beyond the checklist

- **Sessions.** An opaque 256-bit token in an `httpOnly`, `SameSite=Lax`, `Secure`-in-production
  cookie, stored as its SHA-256 — a leaked database backup contains no usable session. Rotated on
  login and on password change; revoked on reset, disable and admin request.
- **Login response uniformity.** An unknown username, a wrong password and a malformed body all
  return the same 401 body, and a verification always runs so timing does not leak which. Tested
  by comparing the two responses for equality.
- **The audit log** records every admin mutation, and a test asserts the onboarding entry contains
  neither the password nor the notes.
- **Consent** is recorded before any monitoring begins, in plain language covering what is watched,
  that video is processed on the device, what is uploaded and when, who sees it and for how long.

## Known gaps

1. **`frame-src https:`** is broad, as noted above and as the brief permits.
2. **The two CLI AI adapters have never been executed** — neither CLI is installed here.
3. **Proctoring camera signals have never run against a real camera and a real person.**
   `docs/PROCTORING_TEST.md` is the checklist for that.
4. **Backups are not copied off the host** by anything in this repository.
5. **No CSRF token.** The session cookie is `SameSite=Lax`, which browsers do not send on
   cross-site POST, and the API rejects anything that is not JSON or multipart — so the classic
   form-post CSRF does not apply. A token would still be a defence in depth worth adding if the
   cookie policy is ever loosened.
