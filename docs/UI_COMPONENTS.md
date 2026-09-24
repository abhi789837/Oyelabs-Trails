# UI inventory

Taken at **U0**, before any change, on branch `ui-overhaul`. This is the worklist the overhaul
works through, and the record of which registry component ended up where.

---

## 1. Native dialogs to replace (U3)

A grep for `alert(` / `confirm(` / `prompt(` returns **18** hits. **Only 9 are app code.** The
other 9 are inside `src/content/` — they are code snippets *inside quiz questions*, where
`alert("…")` is the subject being taught.

> **The `no-alert` lint rule must exempt `src/content/**`.** Rewriting those would corrupt
> curriculum content that 289 tests and a content quality gate are built to protect.

| File | Line | What it asks |
| --- | --- | --- |
| `components/challenge/CodeRunner.tsx` | 108 | discard a code submission |
| `features/admin/AdminAiPage.tsx` | 163 | delete a credential |
| `features/admin/AdminLivePage.tsx` | 93 | terminate a live assessment |
| `features/admin/AdminPeoplePage.tsx` | 61, 76 | disable / enable a learner |
| `features/admin/learner/AccountTab.tsx` | 43, 55, 65 | reset password, disable, revoke sessions |
| `features/assessment/AssessmentPage.tsx` | 170 | learner abandoning an assessment |

Three of these deserve **typed confirmation** (type the username), because they are destructive and
irreversible from the admin's point of view: delete a credential, disable a learner, revoke
sessions. Terminating a live assessment is destructive to the *learner's* hour and should say so.

---

## 2. Tables to migrate to the DataTable kit (U4)

| File | Rows of | Server-side needed |
| --- | --- | --- |
| `features/admin/AdminPeoplePage.tsx` | learners | when > 200 |
| `features/admin/AdminAuditPage.tsx` | audit entries | **yes** — unbounded |
| `features/admin/AdminAiPage.tsx` | AI calls | **yes** — unbounded |
| `features/admin/AdminOverviewPage.tsx` | recent integrity events | no (capped list) |
| `features/admin/learner/ProgressTab.tsx` | topic attempts | **yes** — grows per learner |

Not yet a table but should be one: global integrity events, notifications.

---

## 3. Screens

| Area | Files | Step |
| --- | --- | --- |
| `features/admin` | 14 | U7, U8, U9 |
| `features/admin/learner` | 8 | U8 |
| `features/auth` | 4 | U6 |
| `features/assessment` | 2 | U10 — **calm only** |
| `features/proctor` | 2 | U10 — **calm only** |
| `pages` | 7 | U10 |
| `components/layout` | 12 | U5 |
| `components/challenge` | 5 | U2 primitives only |
| `components/trail` | 8 | **do not restyle** — verify unchanged |
| `components/certificate` | 3 | U10 |

### Routes to screenshot (U0 / U12)

Learner: `/`, `/plan`, `/track/:trackId`, `/track/:trackId/module/:moduleId`,
`/track/:trackId/module/:moduleId/topic/:topicId`, `/report/:trackId`, `/assessment`
Auth: `/login`, `/change-password`
Admin: `/admin`, `/admin/people`, `/admin/people/:userId` (7 tabs), `/admin/onboard`,
`/admin/live`, `/admin/ai`, `/admin/audit`, `/admin/assessments/:id`,
`/admin/assessments/:id/integrity`

---

## 4. Existing `src/components/ui/` (10)

`badge` · `button` · `card` · `input` · `label` · `progress` · `radio-group` · `separator` ·
`sheet` · `tooltip`

All hand-written and small. Anything added from a registry must be adapted to the repo's tokens —
no hard-coded zinc/neutral/violet — and match this house style rather than arriving with its own.

---

## 5. Registry components installed

_Filled in as they are added. Each row: component, registry, where it is used, step._

| Component | Registry | Used in | Step |
| --- | --- | --- | --- |
| _(none yet)_ | | | |
