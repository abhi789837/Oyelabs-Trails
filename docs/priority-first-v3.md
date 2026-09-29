# Priority-first — plan

Written from a read of `/admin/onboard`, the learner tabs, `builder/run.ts`, `builder/scoring.ts`,
`builder/parts.ts`, `jobs/handlers/buildPath.ts`, `assessment/selector.ts` and the weekly plan.

---

## The root cause, found

Rakesh's path listed seven AI-found gaps and neither of the admin's two High targets. That is not a
prompt problem or a ranking problem. It is one line:

```ts
// builder/scoring.ts
const match = priorities.mustHave.find((entry) => related(entry.skill, gap.skill));
```

**The path builder reads `learner_priorities.must_have`. The new admin screen writes
`learner_targets`.** I added that table two commits before the screen and never moved the builder
onto it, so every target an admin has set since is invisible to the thing that builds the path. The
builder falls back to "gaps the model found", which is exactly the list on screen.

The backfill in migration 0009 only went one way — old rows into the new table — so nothing in
`must_have` is being written any more either. Both halves are stale.

### The second bug, also confirmed

`PathTab.tsx:299` renders *"Nothing was added — no gap needed a course"* whenever `items.length ===
0`, and `PathTab.tsx:284` renders `path.failureReason` whenever the status is `failed`. When
generation fails with nothing matched, **both are true at once**, which is the contradiction on
screen. One says the provider is broken; the other says everything is fine and there was nothing to
do.

---

## 1. Admin targets become the spine

The change is structural, not a weighting. Today the pipeline is *gaps → score → parts*. It becomes
*targets → attach evidence → parts*, with detected gaps demoted to two jobs: setting a starting
level, and suggesting extras at the bottom.

```
learner_targets (admin's order)
        │
        ├─ every High target gets a course. Always. Even a target they scored 5/5 on —
        │  the assessment then only decides it starts Advanced and which modules to skip.
        │
        ├─ prerequisite refreshers attach *under* the target they unblock, capped at ~20%
        │  of the weekly budget, 15–45 min each
        │
        └─ detected gaps that match no target → "Also suggested", last, collapsed, optional
```

Enforced in `builder/priorityPath.ts` as a pure function with an `assertSpine()` check beside it —
the same split `planParts` and the weekly plan already use. The model never reorders targets and
never inserts above them; the only things it may decide are the starting level and the text.

**Migration.** `learner_targets` becomes the single source. `learner_priorities.must_have` and
`.skip` are backfilled *into* it in both directions this time, and the reader is switched. The old
columns stay until the reader has been in production for a release.

## 2. One setup screen

Two forms become one: Track & stack → targets → assign, with a sticky summary. The catalog-backed
skill picker with "+ Add '…'" replaces the free-text rows, and the weight percentages come out of
the UI and stay as constants. Advanced settings collapse.

## 3. The AI path tab

Grouped by target rather than by gap, with the assessed level as a 0–5 bar, the starting level, the
attached course and its status, and a reason capped at 20 words. Evidence moves behind an expander.

**Errors stop contradicting.** One status line, computed once, that can say exactly one of: built,
building, waiting for a research provider, or failed with a reason and a Retry. "Nothing was added"
can only render when there were genuinely no targets *and* no gaps.

A missing research provider no longer fails the run: catalog matches are still assigned, and the
targets that needed generation show "Waiting for research provider".

## 4. The assessment

~50% hands-on coding in the editor, ~30% plain practical multiple choice, ~20% target scenarios.
60% of questions on High targets and asked first. Track basics only in the learner's own stack — the
Vue question for a React learner is a prompt failing to be told the stack, which §1's spine fixes as
a side effect.

## 5–8

Courses per target (match → reuse → generate), tailored to the stack and starting level; the
existing verified-research pipeline already does the rest. Then tests, deploy, and a rebuild of
rakesh's path.

---

## Order of work

1. **The spine** (§1) — the bug on screen. Pure module, migration, reader switch, tests.
2. **The AI path tab** (§3) — what the admin is looking at when they see the bug.
3. **The setup screen** (§2).
4. **The assessment mix** (§4).

Anything not reached is recorded at the bottom of this file rather than left to be found.
