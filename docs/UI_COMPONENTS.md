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

**Done in U3.** All nine now go through `useConfirm`:

| Site | Variant | Notes |
| --- | --- | --- |
| `CodeRunner` reset to starter code | destructive | the learner's own draft, and there is no way back to it |
| `AdminAiPage` delete credential | destructive + typed (label) | runs in-dialog with a spinner |
| `AdminLivePage` terminate | destructive | body names the time left and answers in, not "are you sure" |
| `AdminLivePage` extend | default | added on the way past; it was sharing the old confirm |
| `AdminPeoplePage` reset password | destructive | |
| `AdminPeoplePage` disable | destructive + typed (username) | rows look alike in a table |
| `AccountTab` reset password | destructive | |
| `AccountTab` disable | destructive + typed (username) | runs in-dialog with a spinner |
| `AccountTab` revoke sessions | destructive + typed (username) | runs in-dialog with a spinner |
| `AssessmentPage` finish now | default, **`calm`** | fade only — no spring, no slide |

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

## 4. `src/components/ui/`

At U0 (10): `badge` · `button` · `card` · `input` · `label` · `progress` · `radio-group` ·
`separator` · `sheet` · `tooltip`

Added since: `status-badge` · `password-input` · `number-input` · `tag-input` (U2) ·
`dialog` · `alert-dialog` (U3)

All hand-written and small. Anything added from a registry must be adapted to the repo's tokens —
no hard-coded zinc/neutral/violet — and match this house style rather than arriving with its own.

---

## 5. Registry components installed

_Filled in as they are added. Each row: component, registry, where it is used, step._

| Component | Registry | Used in | Step |
| --- | --- | --- | --- |
| `lib/motion` (motion tokens) | own | `ui/button`, `form/Field`, `PreFlight`, `PlanTab`, `warnings`, `AdminLearnerPage`, overlays | U2 |
| `ui/button` | existing — `loading`, `icon-sm`/`icon-lg`, press scale, `-strong` focus ring, 1px border on every variant | 10 files migrated off in-button spinners | U2 |
| `ui/badge` | existing — added `danger` and `brand` variants | 6 files migrated off ad-hoc destructive classes | U2 |
| `ui/status-badge` (`StatusBadge`, `statusMeta`) | own | 10 files; covers every status enum in `shared/enums.ts` | U2 |
| `ui/card` | existing — `elevation` (two only), `tone`, `density`; exports `cardVariants` | `PlanTab`, `PreFlight` | U2 |
| `ui/input` | existing — `leading`/`trailing` addons, clear button, `aria-invalid` border; exports `inputClasses` | `AdminPeoplePage`, `AdminAuditPage`, `PlanTab` | U2 |
| `ui/password-input` + `lib/password-strength` | own | `ChangePasswordPage`, via `PasswordField` | U2 |
| `ui/number-input` | own | `AdminOnboardPage`, `ProfileTab`, via `NumberField` | U2 |
| `ui/tag-input` | own | **no call site yet** — waiting on U4 table filters / U7 onboarding | U2 |
| `form/Field` | existing — animated error text, plus `PasswordField` and `NumberField` | every form | U2 |
| `ui/alert-dialog` | Radix `@radix-ui/react-alert-dialog`, hand-styled | `overlays/ConfirmProvider` | U3 |
| `ui/dialog` | Radix `@radix-ui/react-dialog`, hand-styled | `overlays/FormDialogProvider` | U3 |
| `ui/sheet` | existing — gained a `size` variant (`sm`/`md`/`lg`) and `closeLabel` | `DetailSheet`, `MobileNav` | U3 |
| `overlays/ConfirmProvider` (`useConfirm`) | own | 9 call sites, see §1 | U3 |
| `overlays/FormDialogProvider` (`useFormDialog`) | own | available; first consumers land in U7–U9 | U3 |
| `overlays/DetailSheet` | own, on `ui/sheet` | available; table rows open into it in U4/U7 | U3 |
| `overlays/Toaster` (`AppToaster`) | `sonner` 2.0 | mounted once in `OverlayProvider` | U3 |
| `overlays/CompletionToast` | own | `store/toastStore` → `CompletionWatcher` | U3 |
| `lib/toast` (`notify`) | thin wrapper over `sonner` | `AdminAiPage`, `AdminPeoplePage`, `AdminLivePage` | U3 |

### Primitive API, in one place (U2)

```ts
// src/lib/motion.ts — no component writes its own duration
duration.fast | .base | .slow        // 0.12 / 0.2 / 0.32 s
easing.out | .in | .inOut
spring                               // { type: "spring", stiffness: 380, damping: 30 }
transition.fast | .base | .slow | .exit
press                                // { scale: 0.97 }, for whileTap
fadeUp | scaleIn | fieldMessage      // variants: "hidden" | "visible" | "exit"
stagger(children = 0.04, delayChildren = 0)   // keep `children` inside 0.03–0.05 s
```

Transform and opacity only. Reduced motion is handled by `<MotionConfig reducedMotion="user">` at
the root; a CSS keyframe animation needs the global `prefers-reduced-motion` block in `index.css`
(which is where `--animate-status-pulse` gets flattened).

```tsx
<Button variant="default|summit|destructive|outline|secondary|ghost|link"
        size="default|sm|lg|icon|icon-sm|icon-lg"
        loading={saving}        // spinner overlaid; the width does NOT change; sets aria-busy
        asChild />              // Slot path: CSS press scale, and `loading` is not supported

<StatusBadge kind="user|assessment|credential|job|item|severity|topic|role"
             status={value}     // typed against `kind` — a mismatch fails the build
             live={isRunning}   // ONLY a live thing; a hard-severity badge pulses only then
             dot={false} />     // the trail's badges stay dotless so they do not move
statusMeta(kind, status)        // { label, tone, pulse? } when you need the words without the pill

<Card elevation="flat|raised" tone="none|quiet|progress|success|danger"
      density="compact|cozy|roomy" asChild />   // density has no default — see PROGRESS.md

<Input leading={<Search />} trailing={…} onClear={() => setQuery("")} containerClassName="…" />
<PasswordField label meter username={user.username} />   // strength bar + rule checklist + toggle
<NumberField label value={n} onChange={(n) => …} min max step />   // value is `number | null`
<TagInput value={tags} onChange={setTags} suggestions={…} allowCustom max={…} />
```

**Conventions.** Focus rings use the `-strong` tokens (`outline-primary-strong`, or
`outline-destructive` on a destructive button) at `outline-offset-2`. No arrows on buttons, no
ALL-CAPS eyebrows, no 01/02/03 numbering. Every colour is a token — no zinc/neutral/violet, no
hexes — so dark mode is a variable swap and nothing else.

### Overlay API, in one place (U3)

```ts
const confirm = useConfirm();
// Resolves true only when confirmed — and, with onConfirm, only after it succeeded.
await confirm({
  title, body, confirmLabel, cancelLabel,
  variant: "default" | "destructive",
  confirmPhrase,        // typed confirmation: the exact string to type (usually a username)
  onConfirm,            // optional: runs in the dialog, with a spinner; throws show inside it
  calm,                 // fade only, no spring — the assessment runner
});

const formDialog = useFormDialog();
// Uncontrolled fields: give inputs a `name`, read them from FormData. Resolves null if dismissed.
await formDialog({ title, description, body: ({ pending }) => …, onSubmit: (data) => … });

<DetailSheet open onOpenChange title subtitle description footer size="md" side="right" />

notify.success / notify.error / notify.info / notify.undo / notify.promise   // @/lib/toast
```

`<OverlayProvider>` mounts the two providers and the toaster, once, at the app root in `App.tsx`.

**Conventions.** Dialogs use a 6px backdrop blur over `bg-ink/50` and a spring scale+slide, both
suppressed by `prefers-reduced-motion` (the root `<MotionConfig reducedMotion="user">` plus the
global rule in `index.css`). Offer `notify.undo` only where the undo genuinely restores the previous
state; where it cannot, ask up front with `useConfirm` instead.

---

## 6. Lint

`npm run lint` → `eslint .` with `eslint.config.js`: `no-alert` and `no-restricted-globals` for
`alert`/`confirm`/`prompt`, and nothing else. `src/content/**` is exempt — see §1 for why. The
TypeScript parser is there to read `.ts`/`.tsx`; no type-aware rules run.
