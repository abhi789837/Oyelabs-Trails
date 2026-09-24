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

**The kit is built (U4); none of these pages have been migrated yet** — that is U7–U9, and the
pages were owned by other agents while U4 ran. Each already has a whitelist waiting for it in
`server/src/lib/tableSpecs.ts`, which is the only thing a server-paged route needs to add:

| Page | Client field catalogue | Server spec | Mode |
| --- | --- | --- | --- |
| `AdminPeoplePage` | `data-table/presets/people.ts` (shipped, with three built-in views) | `usersTableSpec` | `client` |
| `AdminAuditPage` | — | `auditTableSpec` | `server` |
| `AdminAiPage` | — | `aiCallsTableSpec` | `server` |
| `AdminOverviewPage` | — | `integrityEventsTableSpec` | `client` (capped list) |
| `learner/ProgressTab` | — | `topicAttemptsTableSpec` | `server`, scoped to one learner |

`assessmentsTableSpec` is there too, for the assessments list.

---

## 3. Screens

| Area | Files | Step |
| --- | --- | --- |
| `features/admin` | 14 | U7, U8, U9 |
| `features/admin/learner` | 8 | U8 |
| `features/auth` | 4 → 8 | U6 — **done** |
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
`dialog` · `alert-dialog` (U3) · `table` · `checkbox` · `slider` · `skeleton` · `calendar` (U4) ·
`dropdown-menu` · `popover` · `command` · `kbd` · `avatar` · `scroll-area` (U5) ·
`shine-border` (U6)

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
| `ui/tag-input` | own | `data-table/filters/AdvancedFilter` — the value editor for `in` / `is none of` (U4); still unused on the onboarding form until U7 | U2 |
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
| `ui/dropdown-menu` | Radix `@radix-ui/react-dropdown-menu`, hand-styled; **controlled** (`open`/`onOpenChange`) so motion owns the unmount | `layout/UserMenu` | U5 |
| `ui/popover` | Radix `@radix-ui/react-popover`, hand-styled | `layout/NotificationCentre`, table filters | U5 |
| `ui/command` | `cmdk` 1.1, hand-styled; callers pass `shouldFilter={false}` and cap their own results | `layout/CommandPalette` | U5 |
| `ui/kbd` (`Kbd`, `modKeyLabel`) | own | palette trigger and its footer hints | U5 |
| `ui/avatar` (`Avatar`, `initialsOf`) | own — initials only, there are no profile photos anywhere | `UserMenu`, palette people rows | U5 |
| `ui/scroll-area` | own — native overflow with a themed scrollbar, not an overlay library | `NotificationCentre` | U5 |
| `layout/CommandPalette` | own, on `ui/command` | `TopBar`, `AdminLayout`; replaced `layout/SearchDialog` | U5 |
| `layout/NotificationCentre` (+ `notifications.ts`, `useNotifications.ts`) | own | `TopBar`, `AdminLayout`; reads `GET /api/me/notifications` | U5 |
| `layout/UserMenu` | own, on `ui/dropdown-menu` | `TopBar`, `AdminLayout`; absorbed the deleted `ThemeToggle` | U5 |
| `ui/shine-border` (`ShineBorder`) | own — conic-gradient beam on a 1px hairline, `useReducedMotion` drops the spin | `auth/AuthLayout` | U6 |
| `ui/table` (`Table`, `TableScroller`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`) | own — density is a `--row-py` variable on the table, not a class on 400 cells; `TableScroller` is what the sticky header sticks to | `data-table/DataTable` | U4 |
| `ui/checkbox` | Radix `@radix-ui/react-checkbox`, hand-styled — exists for `indeterminate`, which a native checkbox cannot announce | row selection, `ViewOptions` | U4 |
| `ui/slider` | Radix `@radix-ui/react-slider`, hand-styled — `thumbLabels` is **required**, one per thumb | `NumberRangeFilter` | U4 |
| `ui/skeleton` | own — `animate-pulse`, flattened by the global reduced-motion block | `DataTableStates` | U4 |
| `ui/calendar` (`Calendar`, `startOfDay`, `endOfDay`, `DateRange`) | own — hand-written month grid, `role="grid"` with roving focus; no date library | `DateRangeFilter` | U4 |
| `data-table/*` (the kit) | own, on `@tanstack/react-table` **v8** | available; `AdminPeoplePage`, `AdminAuditPage`, `AdminAiPage`, `ProgressTab` adopt it in U7–U9 | U4 |
| `shared/table` (`TableQuery`, `parseTableQuery`, `writeTableQuery`, `pageMetaOf`) | own | the kit **and** `server/src/lib/tableQuery.ts` | U4 |
| `server/lib/tableQuery` + `tableSpecs` | own, on Drizzle | the whitelist and SQL builder; 46 tests in `tableQuery.test.ts` | U4 |
| `ui/password-input` | existing — gained `differentFrom`, the server's reuse rule, as a fourth checklist line | `ChangePasswordPage`, via `PasswordField` | U6 |
| `auth/AuthLayout` | own — brand column + card, one grid, two columns from `lg` | `LoginPage`, `ChangePasswordPage` | U6 |
| `auth/AuthBackdrop` | own — two drifting radial spotlights over `trail/Contours`; `lazy()`, its own chunk | `auth/AuthLayout` | U6 |
| `auth/AuthFeedback` (`AuthFormAlert`, `CapsLockWarning`, `PasswordMatchLine`) | own | both auth screens | U6 |
| `auth/useCapsLock` | own — `getModifierState("CapsLock")` on keydown **and** keyup, per field | both auth screens | U6 |

| `pages/parts/Stats` (`AnimatedNumber`, `StatChip`, `StatCard`, `SectionHeading`, `useCountUp`) | own | `PlanPage`, `DashboardPage`, `TrackPage`, `CertificatePage` | U10 |
| `pages/parts/ViewToggle` (`ViewToggle`, `useStoredView`) | own — a radio group, not a row of toggles | `PlanPage` trail/list switch | U10 |
| `pages/parts/PlanFilterBar` + `pages/planFilters` (pure, tested) | own | `PlanPage` list view | U10 |
| `assessment/TimerRing` (+ `formatClock`) | own — one SVG circle, CSS transition only | `ItemRunner`, `AssessmentPage` | U10 |
| `assessment/JobStages` + `assessment/stages` (pure, tested) | own | `AssessmentPage` waiting screen | U10 |
| `certificate/Confetti` | own — `lazy()`-loaded default export, no dependency | `CertificatePage`, first unlock only | U10 |

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
<PasswordField label meter username={user.username} differentFrom={currentPassword} />
// strength bar + rule checklist + reveal toggle. Every exact rule mirrors
// server/src/auth/password.ts, thresholds included; `differentFrom` adds the reuse rule.
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

### DataTable API, in one place (U4)

The kit is one import. A screen supplies rows, columns and a **field catalogue**; the catalogue is
what the filters, the sorting, the search and the CSV all read from, so they cannot disagree.

```tsx
import { DataTable, useTableQueryState, peopleFields, peopleBuiltInViews } from "@/components/data-table";

const { query, setQuery } = useTableQueryState();   // filters/sort/page live in the URL

<DataTable
  data={users} columns={columns} fields={peopleFields} getRowId={(u) => u.id}
  query={query} onQueryChange={setQuery}
  mode="client"                    // or "server" + meta={pageMeta} for an unbounded table
  tableKey="admin.people"          // namespaces column/density prefs and saved views
  accountId={me.id}                // scopes saved views to this admin
  builtInViews={peopleBuiltInViews}
  noun="learner" exportName="people"
  loading={loading} error={error} onRetry={reload}
  emptyState={{ title: "No one here yet", body: "…", action: <Button…/> }}
  renderDetail={(u) => <LearnerSummary user={u} />}   // row → DetailSheet
  bulkActions={[{ id: "disable", label: "Disable", tone: "destructive", run: (rows) => … }]}
  mobileCard={(u) => <PersonCard user={u} />}          // below 768px rows become cards
/>
```

```ts
// A field is one entry in the catalogue. `quick` gives it a chip in the toolbar; the control is
// chosen by `type` and is not configurable, so dates filter the same way on every table.
interface TableFieldDef<TRow> {
  name; label; type: "string" | "number" | "boolean" | "date" | "enum";
  options?;            // enum: what the faceted list shows
  accessor?;           // derived columns — `planProgress` is computed, not a column anywhere
  searchable?;         // included in the `/`-focused search box
  quick?;              // enum → faceted · date → presets + calendar · number → slider · boolean → chips
  filterable?; sortable?; min?; max?; step?; unit?; trueLabel?; falseLabel?; toCsv?;
}
```

Column extras go through TanStack's `meta`: `{ field, align, headerClassName, cellClassName,
exportValue }`. `field` is the catalogue name the header sorts by, and defaults to the column id.

**Behaviour worth knowing before wiring one up.**

- **The URL owns filters, sort, page and page size.** Column visibility and density do not go in it
  — they are `localStorage`, per `tableKey`, because a shared link should not rearrange someone
  else's columns.
- **Two empty states, never one.** Nothing yet (with the screen's own CTA) versus nothing matching
  (with "Clear filters"), chosen by `isQueryEmpty(query)`.
- **`mode="client"` is the one that can count facets**, since counting needs every row. A
  server-paged faceted filter shows options without numbers rather than the numbers for page 3.
- **Export CSV writes the selection if there is one**, otherwise every matching row in client mode
  or the current page in server mode — where the button relabels itself "Export page" so it does
  not promise more than it delivers.
- **Selection is derived, not stored.** Ticked ids that a filter excludes stop counting and come
  back when the filter is undone.
- `/` focuses the search box, Up/Down/Home/End move between rows, Enter opens one, Space ticks it.

```ts
// The query language, shared with the server (shared/table.ts).
TableQuery = { q, filters: { combinator: "and"|"or", conditions: FilterCondition[] }, sort, page, pageSize }
FilterCondition = { field, operator, value }
//   scalar: eq ne lt lte gt gte contains notContains startsWith endsWith
//   list:   in notIn        range: between ([from, to], either end nullable)      none: isNull isNotNull
parseTableQuery(params) / writeTableQuery(query, into?)   // never throws; defaults are omitted from the URL
pageMetaOf(total, page, pageSize) / pageRange(meta)        // "Showing 21–40 of 312"
```

```ts
// Server side: the whitelist. An unknown field or operator is a 400, never a dropped condition.
const spec = defineTableSpec({ name, fields: { key: { column, type, values?, operators?, sortable?, searchable? } },
                               defaultSort, tiebreak?, maxPageSize? });
const built = buildTableQuery(spec, query);
const total = db.select({ n: count() }).from(t).where(built.where).get()!.n;
const meta  = pageMetaOf(total, built.page, built.pageSize);
const rows  = db.select().from(t).where(built.where).orderBy(...built.orderBy)
                .limit(meta.pageSize).offset((meta.page - 1) * meta.pageSize).all();
```

**Conventions.** A filter chip is dashed while empty and solid once it is doing something, so the
toolbar reads as a state at a glance. The result count is the table's only `aria-live` region.
Density and column choices are preferences; filters are the question — the two never mix.

### Shell API, in one place (U5)

```tsx
<CommandPalette context="learner" | "admin" />   // renders its own trigger button; Cmd/Ctrl-K
<NotificationCentre />                            // bell + unread count + "mark all read"
<UserMenu context="learner" | "admin" />          // identity, one destination, theme, sign out
<TrackNav collapsed group="sidebar" | "mobile-nav" onNavigate={close} />

<DropdownMenu open onOpenChange>                  // controlled, like Dialog — motion owns the exit
  <DropdownMenuTrigger asChild /> <DropdownMenuContent align="end">
    <DropdownMenuLabel /> <DropdownMenuItem tone="default|danger" />
    <DropdownMenuRadioGroup value onValueChange><DropdownMenuRadioItem value /></DropdownMenuRadioGroup>
    <DropdownMenuSeparator />
  </DropdownMenuContent>
</DropdownMenu>

<Command shouldFilter={false} loop label="…">     // NEVER let cmdk filter — see below
  <CommandInput leading={…} trailing={…} value onValueChange />
  <CommandList><CommandEmpty /><CommandGroup heading="Topics">
    <CommandItem value={stableId} onSelect={…}><CommandMeta /></CommandItem>
  </CommandGroup></CommandList>
</Command>

<Kbd>{modKeyLabel()} K</Kbd>                      // "⌘" on Apple hardware, "Ctrl" elsewhere
<Avatar name={user.displayName} size="sm|md" elevated={isSuperadmin} />
<ScrollArea className="max-h-[…]" />
```

**The 715-topic rule.** `cmdk` scores every *mounted* item on every keystroke, so the palette
never mounts the curriculum. `commandIndex.ts` builds the index once per manifest, ranks in one
pass, and `groupResults()` caps each group — 8 topics, 4 camps, 3 trails, 5 people, 5 actions.
The empty state is recents + actions + trails, not a list of everything. Anything new that renders
from the curriculum follows the same rule.

**Notifications** come from `GET /api/me/notifications` (both roles; `POST …/read` marks all read).
`kind` is a free-form dotted string the server extends at will — map the ones you know and fall
back by family, never drop an unknown one. Read state is whole-list: the panel does not mark on
open, because the API has nothing finer than "all".

**One marker per nav.** The active item is a single `layoutId` bar, inside a `LayoutGroup` whose
id the caller passes. Two navs mounted at once (desktop sidebar + mobile sheet) sharing one
`layoutId` fly the marker between them, so `group` is required in spirit even where it defaults.

---

### Learner-screen API, in one place (U10)

```tsx
// Numbers and headings — src/pages/parts/Stats.tsx
<AnimatedNumber value={42} format={(n) => `${n}%`} />   // counts up; frozen while the tab is hidden,
                                                        // set outright under prefers-reduced-motion.
                                                        // The animating text is aria-hidden and the
                                                        // final value sits beside it in a sr-only span.
<StatChip label="Topics" value={3} format={(n) => `${n} of 12`} icon={<Clock />} />
<StatCard label="Camps" value={7} hint="across four trails" />   // a `dl` child: renders dt + dd
<SectionHeading id mark={<blaze />} description actions={<ViewToggle … />} as="h2|h3" />

// Views — src/pages/parts/ViewToggle.tsx
const [view, setView] = useStoredView("oyelearn.plan.view", "trail", ["trail", "list"]);
<ViewToggle label="How to show your plan" value={view} onChange={setView} options={[…]} />

// Plan filters — src/pages/planFilters.ts (pure; no React, no stores, unit-tested)
filterPlanRows(rows, filters) · activeFilterCount · hasActiveFilters
planModuleOptions(rows) · planLevelOptions(rows)     // options built from the learner's own rows
<PlanFilterBar rows filters onChange shown />        // native selects; only the search uses `Input`

// Assessment — src/features/assessment/
waitStages(status)      // WaitStage[] | null — the server's own statuses; NEVER a percentage
waitHeading(status)
<JobStages stages={waitStages(status)!} />
<TimerRing secondsLeft={s} totalSeconds={budget} />  // stroke-dashoffset + CSS transition, no rAF
formatClock(seconds)                                 // "4:07" / "1:04:07"

// Certificate — src/components/certificate/Confetti.tsx
const Confetti = lazy(() => import("@/components/certificate/Confetti"));
<Confetti accentToken="summit" onDone={…} />         // a TOKEN NAME, not a colour: canvas fillStyle
                                                      // cannot resolve `rgb(var(--summit))`.
```

**Conventions for these screens.** The assessment runner and the proctoring screens take
functional transitions only — no background effect, no confetti, no decorative motion, no hover
flourish. Anything decorative elsewhere is lazy-loaded, ends by itself, freezes while the tab is
hidden and renders nothing under `prefers-reduced-motion`. Never show progress the server has not
reported: if there is no stage for it, there is no stage.

## 6. Lint

`npm run lint` → `eslint .` with `eslint.config.js`: `no-alert` and `no-restricted-globals` for
`alert`/`confirm`/`prompt`, and nothing else. `src/content/**` is exempt — see §1 for why. The
TypeScript parser is there to read `.ts`/`.tsx`; no type-aware rules run.
