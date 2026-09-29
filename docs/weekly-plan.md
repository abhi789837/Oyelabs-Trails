# The weekly plan

**"My plan" is one week. The library is everything else.**

Before this, `/plan` showed the whole unlocked set at once — *"0 of 204 lessons · 190 h 50 min"* under a
450-word paragraph covering the next several months. All of it was true and none of it was usable,
because the question somebody opens that page with is "what am I doing today".

So the two were separated. Nothing was removed from anybody's unlocked set.

| | What it answers | Where |
| --- | --- | --- |
| **Library** | "What do I have access to?" | `/library` — the old page, unchanged in scope |
| **My plan** | "What am I doing this week?" | `/plan` — one week, four lanes, built to their hours |

---

## What it looks like

Signed in as a learner with a 204-lesson library and priorities of Deployment (High), Laravel (High),
Testing (Medium), GraphQL (Low), skipping Vue, the week came out at **13 items and 14 h 50 min against a
15 h budget**:

```
My plan   Week 1 · 28 Sept – 4 Oct

This is your first week on the trail. This week is about deployment and hosting
and laravel — 3 things to clear first, then the rest as time allows. By Sunday
you should have 13 lessons and about 15 hours behind you.

[ This week 0 / 13 done ] [ Progress 0% ] [ Time 14 h 50 min ]
▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
🔖 204 lessons unlocked in your library →

┌─ Your first waypoint ─────────────────────────────────────────┐
│  Intro to Kubernetes (Pods, Services, Deployments)            │
│  ● Do it now · Docker & Containers · Backend · 1h 40m [Start] │
│  Admin: Deployment and hosting · High · not covered by the …  │
└───────────────────────────────────────────────────────────────┘

This week                                        [ Trail | List ]
● Do it now 3   ■ Must know 2   ● Medium 3   ● Low 5

Do it now   3 items · 3 h 10 min
  Intro to Kubernetes (Pods, Services, Deployments)     1h 40m
  Laravel's Shape and the Request Lifecycle               45m
  Roles and Permissions (and Why Laravel Ships None)      45m
      Needs: Enforcing Authorization, Authorization Gates

Must know   2 items · 1 h 25 min
  Enforcing Authorization: authorize(), can, @can …       45m
  Authorization Gates                                     40m

Medium      3 items · 4 h 5 min      Low  5 items · 6 h 10 min
```

Screenshots from that run — trail and lanes at 1440 and 390, light and dark, the waypoint popover and
bottom sheet, the summit, the admin tab — are under `docs/ui-audit/weekly-plan/`. That folder is
gitignored along with the rest of `docs/ui-audit`, so they are local to whoever produced them.

---

## The four lanes

Shown in this order. Must know sits **second**, above Medium, because its whole purpose is to unblock
the lane above it.

| Lane | Colour | What goes in it |
| --- | --- | --- |
| **Do it now** | `destructive` (red) | Admin **High** must-haves. 2–4 items, at most 50% of the week's minutes. |
| **Must know** | `primary` (brand navy) | Short prerequisites and baseline essentials. 15–45 min each. |
| **Medium** | `warning` (amber) | Admin **Medium** must-haves, and strong gaps the assessment found. |
| **Low** | `basalt` (grey) | Genuinely skippable. |

The brief offered "blue or grey" for Low and "brand navy/blue" for Must know, which would have been the
same colour twice. Low took the grey, Must know the navy — which also matches what they mean.

An item is in **exactly one** lane. Prerequisites go to Must know and the item that depends on them
stays where it is, showing a "Needs: …" line.

### Two exceptions worth knowing about

- **A gap only the assessment found never reaches the red lane.** "The model thinks this is urgent" is
  not the same claim as "the person who hired them says this is urgent", and the red lane is for the
  second one. AI-detected gaps land in Medium (severity ≥ 0.6) or Low.
- **The 50% red-lane cap does not apply to a lane holding one item.** The cap exists so red cannot
  crowd out the other three; with one lesson in it there is nothing to crowd out, and demoting
  somebody's one genuinely blocking task because their week is short would invert both lanes' meaning.

---

## How a week is built

```
priorities + gap map + library
        │
        ├─► buildWeek()      deterministic. Always runs. (plans/weekly/builder.ts)
        │
        ├─► revise()         optional. The model is handed the built week to improve. (generate.ts)
        │
        └─► enforce()        the rules, in code. Runs on both. (plans/weekly/enforce.ts)
                │
                └─► saveWeek()
```

### Why the model revises rather than chooses

The obvious design is to hand over the whole library and ask for a week back. It is also the wrong one.
Choosing twelve lessons out of two hundred *by id* is the task a language model is worst at — it drops
ids, invents plausible ones, and silently omits the admin's High priorities — and each of those costs a
learner a week.

So the builder chooses and the model **revises**: move an item between lanes, reorder within one, drop
something that does not belong, and write the two pieces of prose that genuinely need writing (the
60-word summary and the long-term roadmap). Its reply is validated against the same zod schema and run
through the same `enforce`. If the revision comes out worse — see `goodEnough()` — the built week is
kept and only its prose is taken. **Lane choices and sentences fail independently.**

With no AI credential configured at all, the page still works. The summary is templated.

### The rules, enforced in code

Every one of these is applied by `enforce()` to the builder's output *and* to the model's:

- the total stays within the weekly budget, +10% at most (`BUDGET_TOLERANCE`);
- the admin's must-haves sort above anything inferred, within each lane;
- the skip list holds — checked against **candidates**, not only against gaps, so a skipped skill cannot
  reappear as trail filler;
- no item appears in more than one lane (the more urgent copy survives);
- every item comes from the learner's unlocked set;
- durations are the library's, never the draft's;
- a Must-know item over 45 min moves to Medium rather than being dropped;
- `dependsOn` may only name something that is actually in Must know.

Nothing rejects a draft. A week with one illegal item loses the item, not the week. Every repair is
returned in `adjustments` and logged.

---

## Matching a skill to a lesson

The gap map talks in skills ("server deployment"); the library talks in lessons ("Multi-Stage Builds").
`plans/weekly/matching.ts` joins them with deliberately shallow text matching — not another model call,
because this runs for every learner every week and a wrong answer is a wasted week.

Two things there are worth knowing:

- **Qualifying** scores against the whole haystack (title + module + track + course), so a lesson called
  "Invalidation" inside a "Caching" module is found. **Ordering** scores the title alone. That
  distinction is not academic: a track named "PHP & Laravel" makes *every* lesson in it a full match for
  "Laravel", and ranking on the combined score filled a red lane with "Syntax, Variables and Data Types"
  while the Laravel lessons sat further down.
- Word forms are **generated, not stemmed**. Stemming got the interesting cases wrong in both directions
  ("indexes" → "indexe"; the rule that fixes it turns "databases" into "databas"). The `-ing` forms are
  in there because this vocabulary is full of them: an admin writes "cache invalidation" and the module
  is called "Caching".

---

## Rollover

A week covers seven days from the day it is generated — or from the Monday of that week, if the admin
turned on `weekStartsMonday`.

**Generation is lazy, on read.** There is no cron in this deployment, and adding one would mean
somebody's Monday depended on a worker having woken up. `GET /api/me/week` builds the week when there
isn't one and rolls it over when the seven days are up. That is also how the existing 204-lesson plans
become weekly ones — no migration script has to guess at anybody's priorities.

When a week rolls over:

- unfinished items come back **in the lane they had** (red stays red) with `skipCount` raised;
- an item carried `SKIP_ALERT_THRESHOLD` (2) weeks running notifies staff — an item nobody reaches twice
  usually means the plan is wrong, which is a conversation rather than a reminder;
- the rest is filled by admin priority, then gap severity.

A learner may press **"Plan my next week"** once Do-it-now and Must-know are clear. Medium and Low are
deliberately *not* gates: one is "as much as fits" and the other is "skip without guilt", and making
either block the next week would turn optional work into homework.

### `completed` vs `superseded`

Decided by the **week number**, not by how much got done:

- a new number means the learner moved on → the old week is `completed` and stays in history;
- the same number means it was reshaped mid-week → the replaced row is `superseded` and history skips it.

Conflating the two made a reshape collide with the one-week-per-number unique index, and would have
dropped an honestly-unfinished week out of history. The index is partial (`WHERE status <> 'superseded'`)
for the same reason.

---

## Completion is never stored twice

`weekly_plan_items.status` exists, but `topic_progress` and `course_progress` are the truth. A learner
who finishes a lesson from the library has finished it, and the week has to agree without being told —
so `reconcile()` runs on every read, in both directions (a course lesson can be un-ticked).

What the table genuinely owns is what progress cannot know: which lane, why, what it waits on, how many
weeks it has been carried, and whether an admin pinned it.

On the client the same idea: `PlanPage` watches the progress store and re-fetches when the completed
count changes. The challenge engine knows nothing about weekly plans, and does not need to.

---

## The admin's side

**Learner → This week** shows the lanes and the history, and offers:

- **Pin to Do it now** — survives regeneration, which is the whole point of a pin as opposed to a lane
  change;
- **Move** between lanes;
- **Rebuild this week** (in place, keeping the number and dates);
- **Start their next week** (new number, carries unfinished work).

Every one is written to the audit log (`week.item.moved`, `week.regenerated`). The useful signal is
repetition: an admin dragging the same item into red every Monday is saying the **priorities** need
editing, not that the item needs pinning again — so the tab says where to go.

Saving priorities does **not** silently rebuild the week. The response carries
`weekNeedsRegeneration`, and the AI-path tab offers the rebuild. Reshaping somebody's Tuesday because a
weight was adjusted is a surprise, and the admin may be mid-edit.

Hours and days per week are set at onboarding, under **Time available each week**.

---

## Files

| Path | What it is |
| --- | --- |
| `shared/weeklyPlan.ts` | Lanes, budgets, the draft schema, the view types, date helpers |
| `server/src/plans/weekly/builder.ts` | The deterministic builder. Pure |
| `server/src/plans/weekly/enforce.ts` | The rules. Pure |
| `server/src/plans/weekly/matching.ts` | Skill → lesson text matching. Pure |
| `server/src/plans/weekly/candidates.ts` | The library, from both places lessons live |
| `server/src/plans/weekly/generate.ts` | Orchestration, the AI revision, the quality gate |
| `server/src/plans/weekly/repo.ts` | Persistence, reconciliation, rollover, history |
| `server/src/ai/prompts/weekPlan.ts` | The revise prompt |
| `server/src/routes/admin/week.ts` | The admin's overrides |
| `src/features/plan/` | Trail, lanes, item card, celebration, skeleton |
| `src/pages/PlanPage.tsx` · `LibraryPage.tsx` | The two pages |
| `server/drizzle/0008_weekly_plan.sql` | `weekly_plans`, `weekly_plan_items`, three columns on `learner_priorities` |

Tests: `server/src/plans/weekly/builder.test.ts` (36, the rules) and `server/src/routes/week.test.ts`
(28, over the wire).

---

## Motion

The trail draws itself once (`pathLength` 0→1, 1.2 s), markers pop in on a 50 ms stagger, stats count
up, the progress bar springs, lane cards rise in on scroll, and the summit plays a flag raise with
eighteen brand-coloured dots.

Only `transform`, `opacity` and SVG `pathLength` are animated — nothing that triggers layout.

The summit burst is **not** `components/certificate/Confetti`. That one is 110 particles under gravity
across the whole viewport and belongs to finishing a *track*. Throwing the same burst at a week would
make the certificate feel like a Tuesday.

`prefers-reduced-motion` skips the drawing and the bursts and renders the final state.

**One thing worth not repeating.** The summit burst first shipped with a single `ease: [0.2, 0.8, 0.2, 1]`
covering a four-stop `opacity: [0, 1, 1, 0]` array. An ease-out curve races through its keyframes early,
so the dots spent nearly the whole 1.5 s past the last stop and rendered at about **3% opacity** — the
right colours, the right sizes, the right positions, and nothing visible on screen. It was only caught
by screenshotting the card and reading the computed styles back. Position still eases; opacity now has
its own `ease: "linear"` with explicit `times`.
