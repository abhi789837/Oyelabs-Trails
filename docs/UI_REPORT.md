# UI overhaul — what changed, and what it cost

Branch `ui-overhaul`, cut from `main` at `2e402f6`. Thirteen steps, U0–U12. `main` still runs the
live deployment at `learn.oyegen.com`; nothing here reaches it until the branch is merged.

---

## 1. The short version

The admin console and the learner chrome were rebuilt on a shared kit: one set of primitives, one
overlay system, one table, one shell. The trail visuals and the topic learning screen were
deliberately left alone.

| | Before | After |
| --- | --- | --- |
| React | 18.3.1 | 19 |
| Tailwind | 3.4.19 | 4 |
| Motion | framer-motion 13 | `motion` |
| Native `confirm`/`alert` | 9 | 0 |
| Hand-rolled `<table>` blocks | 5 | 0 |
| Server-paged admin tables | 0 | 3 |
| Tests | 289 | 466 |
| Chart libraries | 0 | 0 — still none |

Eleven defects were found and fixed along the way. Seven of them existed before this work started;
four I introduced and caught. They are listed in §4, because a report that only lists features is
not a report.

---

## 2. What each step did

- **U0** Audit — inventory into `docs/UI_COMPONENTS.md`, screenshot harness written.
- **U1** Foundation — `framer-motion` → `motion`, React 18 → 19, Tailwind 3 → 4.
- **U2** Tokens and primitives — `src/lib/motion.ts`; `Button` gained `loading` (fixed width) and
  icon sizes; **one `StatusBadge`** typed against all eight status enums replaced a dozen ad-hoc
  pills across ten files; `Card` elevations and tones; `Input` addons; new `PasswordField`,
  `NumberField`, `TagInput`.
- **U3** Overlays — `useConfirm` / `useFormDialog` / `DetailSheet` / sonner. All nine native
  dialogs gone, and an eslint rule so they cannot come back.
- **U4** DataTable kit + the server query layer — six table specs, 46 SQL tests against real
  SQLite.
- **U5** Shell — notification centre, command palette, sidebar.
- **U6** Auth screens — plus two real fixes (a leaky error path, a client/server rule mismatch).
- **U7** Admin overview, people, onboarding.
- **U8** Admin learner detail, live board.
- **U9** Admin AI connection, audit, integrity, curriculum browser.
- **U10** Learner screens — pre-flight, runner, evaluating, plan filters, certificate.
- **U11** Quality pass.
- **U12** Screenshots and this report.

---

## 3. The decisions worth knowing about

**No chart library.** The sparklines and rings are hand-written SVG — a polyline, a fill and a
`stroke-dashoffset`. Recharts would have added ~90 KB, a second theming system and a palette that
does not re-theme with the rest of the app. Every colour in here is a design token, so dark mode
stays a variable swap.

**Sparklines are counted, never smoothed.** The overview needed seven-day trends the API did not
expose, so `/api/admin/overview` gained `trend7d`: seven daily buckets on **local** midnights,
counted from timestamp columns that already existed. `Date.setHours(0,0,0,0)` rather than
subtracting 86,400,000, which drifts by an hour twice a year and files two events under the wrong
day. An empty bucket is `0`, never absent — a gap in a sparkline reads as missing data, and a quiet
Sunday is not missing data.

**Three tables page on the server, three do not.** Audit, AI calls and the global integrity feed
grow without bound, so they go through the U4 whitelist: a string from the address bar decides what
SQL runs, and an unknown field is a 400 rather than a silently dropped condition. People, the
learner's progress and the curriculum browser stay client-side, because each arrives complete in one
response and client mode is the only one that can put counts next to the filter options.

**Faceted filters are only for closed sets.** The audit log's action vocabulary grows whenever new
code calls `writeAudit`, so a hardcoded facet list would quietly stop showing new actions. The chips
filter by *family* — `startsWith "assessment."` — which is the stable part.

**The live board is not a camera feed, and says so on the card.** Thumbnails are snapshots already
captured *with* an integrity event, each labelled with its event and time, served from the
auth-checked route. A grid that refreshed itself would read as surveillance-in-progress and imply a
freshness the data does not have.

**What deliberately did not move — stated precisely.** No screen in the trail or topic experience
was redesigned. `src/content` and `src/pages/TopicPage.tsx` are **byte-identical** to `2e402f6`.
`src/components/trail` and `src/components/challenge` are **not**, and it would be wrong to claim
otherwise: nine files there carry 55 added and 37 removed lines. Every one is a consequence of a
step that was in scope, not a redesign:

| Change | Files | Step |
| --- | --- | --- |
| `framer-motion` → `motion/react` import | `TrailMap`, `ElevationProfile` | U1 |
| React 19 `useRef<T>()` now requires an initial value | `ReferenceList` | U1 |
| Tailwind v4 class renames (`outline-none` → `outline-hidden`, `h-[26rem]` → `h-104`, `bg-x/[0.08]` → `bg-x/8`) | `CodeEditor`, `ChallengeResult`, `QuizRunner`, `ReferenceList` | U1 |
| `window.confirm` on "Reset to starter code" → `useConfirm` | `CodeRunner` | U3 |
| `Button`'s own `loading` replaces a hand-rolled spinner | `QuizRunner` | U2 |
| One `StatusBadge` replaces two local pills; class output unchanged | `TopicStatusBadge`, `StatusDot` | U2 |

The rendered output should be equivalent in all of them — the Tailwind renames are the v4 spellings
of the same utilities, and the `CodeRunner` change swaps a browser dialog for the app's own. Should
be, not proven to be: see §5 on the missing before-set.

The assessment runner and proctoring screens keep functional transitions only: no background
effects, no confetti, nothing competing with MediaPipe for the CPU.

---

## 4. Defects found

Seven of these pre-date this work. Four I introduced and caught before merging. Both kinds are
listed, because the ones I caused are the better evidence that the verification was real.

### Pre-existing

1. **The dev server had been broken-looking for two days, and was not.** The screenshot run failed
   with every page blank and Vite returning 500 for `src/index.css`: `@layer base is used but no
   matching @tailwind base directive is present`, naming a Tailwind **v3** PostCSS plugin. The whole
   dependency tree was v4, the error string existed nowhere in `node_modules`, and `npm run build`
   was green. The process holding port 5173 had been started **two days earlier**, before the
   v3 → v4 migration; every `npm run dev` since had failed to bind and left the zombie answering.
   Nothing was wrong with the migration. Check `Get-NetTCPConnection -LocalPort 5173` and compare
   `StartTime` before debugging a dev-only failure the production build does not reproduce.

2. **Every column of every table was clipped at 150px.** The kit styled each cell with
   `width: column.getSize()`, and TanStack fills `columnDef.size` with a default of 150 as soon as a
   column is built — so `getSize()` can never answer "did anyone ask for a width?". Combined with a
   blanket `truncate` on each cell, any title over about thirty characters was cut off with the
   table half empty. Fixed by reading the raw `columnDef.size` (undefined until a screen sets one)
   and dropping the blanket `truncate`: a cell with `overflow: hidden` can never ask for the width
   its content needs.

3. **The audit log's search silently answered a different question.** It loaded the newest 200
   entries and filtered them in the browser, so "no results" meant "not in the newest 200" and there
   was no way to tell those apart. Now server-paged.

4. **`getByLabel(/^new password$/)` could never match.** `Field` appends `*` to a required label, so
   the accessible name is `New password*`. The harness's anchored regex matched nothing — and an
   unanchored one would have matched "Confirm new password" instead.

5. **The screenshot harness refused every fresh database.** Each seeded account has
   `must_change_password` set, which is correct behaviour and exactly the state a development
   database is in the first time the harness meets it. The harness threw rather than proceeding —
   which is why the U0 baseline was never captured, and why defects 2 and 3 survived to U11. It now
   completes the change through the same form a person would.

6. **The onboarding track cards would have mis-coloured four of the seven trails.** A four-way
   accent fallback (`trailmark`/`summit`/`ridge`/`basalt`) defaulted everything else to orange, but
   the curriculum uses seven of the eight accent tokens. `accentClasses` already covers all eight
   and is keyed by the union, so a ninth token fails the build instead.

7. **The superadmin's role read "Learner".** A `roleTitle ?? "Learner"` fallback on the mobile card
   and the detail panel told the reader the opposite of the truth for the one account that has no
   role title.

### Introduced during this work, caught before merging

8. **People never left its loading skeleton.** An `alive` ref set only in an effect's cleanup: React
   StrictMode mounts, cleans up and mounts again on the same instance, so the flag stayed false for
   the whole life of the second mount and every load returned early into a permanently empty table.
   Re-armed at the top of the effect.

9. **The active AI credential card rendered as a block of orange.** `ShineBorder` masks its conic
   gradient down to a 1px ring with an opaque inner surface; I passed `bg-summit/5` as
   `innerClassName`, which replaced that opaque background, and the whole gradient showed through.

10. **The table footer claimed "No results" while still loading.** An empty `meta` before the first
    response is indistinguishable from a genuinely empty one, and it is the table's only
    `aria-live` region — so a screen reader was told "no results" on every page load.

11. **`Promise.reject` in a bulk action broke type inference** and, more importantly, read wrong:
    the kit keeps the selection when an action rejects so it can be retried, which is what a
    cancelled confirmation should do. Throwing says that; returning a rejected promise obscured it.

---

## 5. Verification

Every commit on this branch passed five gates before it landed:

```
npm run typecheck · npm run lint · npm run build · npm run content:check · npx vitest run
```

`content:check`: 67 modules, 715 topics, 6,327 quiz questions, 103 code challenges, **0 warnings**.

**Tests: 289 → 466.** The additions worth naming are the 46 SQL tests in `tableQuery.test.ts`, which
run against a real migrated SQLite database rather than a mock — the thing worth proving is not
"the builder returns an object" but "after this request the `users` table still exists and still has
eight rows in it" — and the seven in `pagedRoute.test.ts` pinning the page-clamping behaviour that
makes an overshot page return the last page instead of an empty one.

**Screenshots: 72**, at 1440 and 375, light and dark, as both roles, with zero failures — every
admin route including all seven learner-detail tabs, plus the learner dashboard, plan and login.

They are **not committed**, and `docs/ui-audit` is gitignored. Two reasons: ~4 MB of PNGs that are
regenerated by one command, and the AI-connection shots carry the last four characters of whatever
credential the machine has configured. That hint is shown in the admin console deliberately, for an
audience of one superadmin; a git history is a wider audience than that. Run §7 to regenerate.

**There is no before-set.** The harness could not run on a fresh database until U11 fixed it (defect
5), by which time the primitives had already changed. So the claim about the trail and topic screens
rests on reading the diff, per the table in §3, not on comparing pixels — and two of the four
protected paths do have changes in them. A before-set can still be captured from `main`
(`node scripts/ui/screens.mjs before`) if a pixel comparison is ever wanted; that is the only thing
that would turn "should be equivalent" into "is".

---

## 6. Known limitations

- **Lighthouse was not run.** It needs a production server and a browser at the same time, and this
  machine had 3.3 GB free of 15.7 GB for the whole pass. The build output is unchanged in shape:
  the only chunk over 500 KB is still `@react-pdf/renderer` (~1.2 MB), loaded on demand when someone
  clicks "Download PDF", never on page load.
- **The People table scrolls horizontally below about 1250px of content width.** Column visibility
  is per-admin in `localStorage` via the "View" control, so the fix is one click, but there is no
  per-column "hidden by default" in the kit yet.
- **Contrast was checked at the token level in U2, not per screen.** The tokens carry measured
  ratios (`brand-600` on paper 4.91:1, `brand-400` on the dark background 5.89:1) and every colour
  on these screens is a token, but no automated per-screen audit ran.
- **`TagInput` still has no call site.** It was built in U2 for a use that the onboarding stepper
  ended up solving with a datalist instead.

---

## 7. How to run the audit yourself

```bash
npm run dev                                  # web on 5173, api on 8787
npm run dev:seed                             # prints three learner passwords, once
npm run dev:password -- admin --password "<something long>"

UI_ADMIN_PASSWORD="<that>" \
UI_LEARNER_USERNAME=priya.sharma UI_LEARNER_PASSWORD="<hers>" \
  node scripts/ui/screens.mjs after
```

The harness changes each account's password on first use (appending `-ui-audit`) and prints the new
one. Reuse that on the next run, or reset with `npm run dev:password` again.

**Before debugging a blank page: check nothing is already listening on 5173.** See defect 1.
