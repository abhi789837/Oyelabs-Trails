# "Consent is required before starting" — learners cannot start their assessment

**Status:** fixed. **Severity:** total — no learner has ever been able to start a placement
assessment through the UI.

---

## Root cause

**The client never called the consent endpoint.**

`assessmentApi.consent()` was written in `src/features/assessment/api.ts` and never wired to a
caller. `PreFlight.tsx`'s own doc comment says *"the caller posts consent and calls `start`"* — but
`AssessmentPage.tsx`'s `onReady` only ever called `start`. The consent screen collected agreement
into component state, and that state went nowhere.

`git log -S "assessmentApi.consent"` returns **no commits**: the string has never existed in the
repository. This was not a regression. It has been broken since the proctoring phase shipped, and
every learner who reached the Start button hit it.

---

## Why the reported symptoms pointed elsewhere

The bug report noted that the start request had an empty body, which reads like the payload being
dropped. It is not: **`POST /start` is supposed to have an empty body.** Consent is stored
server-side by a previous call, and `start` only reads `assessments.consent_at`. The empty `{}` was
correct; the missing thing was the call before it.

The other candidates in the report were checked and are all fine:

| Suspected cause | Finding |
| --- | --- |
| JSON body parsing missing | Fastify parses `application/json` by default; the consent route's zod parse would fail loudly, not silently. |
| API client dropping the body | `api.post` defaults the body to `{}`, sets `content-type: application/json` and `JSON.stringify`s it. Verified in `src/api/client.ts`. |
| Cookies not sent / session changing | `credentials: "same-origin"`, one cookie, same session for both calls. |
| Wrong kind of ID | The URL id is the assessment id. `consent` and `start` both resolve it through the same `load()` helper, so they cannot disagree. |
| Consent expiring | No expiry existed to expire. |

---

## What the flow was, and what it is now

**Before**

```
PreFlight  ->  onReady()  ->  POST /start        ->  400 "Consent is required before starting."
                              (consent_at null)
```

**After**

```
PreFlight  ->  onReady(permissions)  ->  POST /consent  { agreed, permissions, policyVersion }
                                              |               writes assessment_consents + consent_at
                                              v
                                         POST /start   ->  200
```

Plus a belt-and-braces path: `POST /start` now *also* accepts a consent payload inline. If no stored
consent exists but a valid payload is present, it records it and proceeds. A future client that
forgets the first call cannot reproduce this bug.

---

## What is recorded

A consent record is evidence, not a flag, so it is a row rather than a timestamp:
`assessment_consents` holds the user, the assessment, which permissions were granted, the policy
version, the IP and the user agent. `assessments.consent_at` stays as the denormalised flag every
other query already reads.

`CONSENT_POLICY_VERSION` lives in `shared/assessment.ts`. A stored consent whose version is older
than the current one does not count, and the learner is asked again — which is the only honest
behaviour when the thing they agreed to has changed.

---

## Rules decided here, and why

**Consent is per attempt.** Each attempt is its own `assessments` row, so a retake asks again. A
placement assessment is a monitored, recorded event; consenting once in March should not silently
cover a re-test in September.

**A returning learner is not asked twice.** Coming back to the pre-flight screen with a valid,
current-version record shows "Consent recorded" and enables Start immediately. Re-consenting is
idempotent either way — calling it again updates the record rather than failing.

**These errors are distinct, and none of them says "consent":**

| Situation | Response |
| --- | --- |
| Not this learner's assessment | 404 (not 403 — whether it exists is not theirs to learn) |
| Still awaiting admin approval | 409 "not been released yet" |
| Already completed or terminated | 409 naming the status |
| Session expired | 401 from the auth guard |
| Genuinely no consent | 400 "Consent is required before starting." |

---

## Existing stuck learners

Nothing to reset. The fix is entirely in the request flow: a learner reloads the page, goes through
the pre-flight screen, and the consent call now happens. Assessment `01M3KHQX4ADHBM6FZVTEFBVV50`
needs no intervention.
