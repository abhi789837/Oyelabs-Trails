# v4.3 plan and shared contracts

The single map the phase agents share. Brief: the v4.3 prompt (practical priorities, progression, trail, playlist, fair tests, two-click onboarding).

## Database: one migration for the whole release
`server/drizzle/0023_v43_goals_graph_video_tests.sql` (D1). It only adds things. Tables:
- `practical_outcomes`
- `learner_goals`
- `goal_suggestions`
- `skill_edges`
- `video_progress`
- `video_meta`
- `user_prefs`
- `topic_grounding`
- `topic_test_items`
- plus the column `learner_priorities.auto_add_suggestions`

**Do not run `drizzle-kit generate` in a phase agent.** If a phase needs another column, it goes in a later migration made by the main session.

## Goals (`shared/goals.ts`)
- **Goal types:** `skill`, `case` or `text`, all on the same 1–5 slider.
- **Priorities are derived from goals.** The skill priorities (`learner_skill_priorities`) come from the goals: each linked skill takes the highest slider of any goal that links it, and the order is goal order, then skill order inside the goal. The assessment, path and week code keep reading priorities, so v4.1 and v4.2 behaviour is unchanged when a goal is a plain skill.
- **Existing learners:** each existing priority becomes a `skill` goal once, at boot, through the data migration `migrateV43Goals`.
- **Practical outcomes library:**
  - Seeds live in `server/src/goals/seed/{engineering,pm,bd}.ts`, each `export default [] satisfies PracticalOutcomeSeed[]`, with at least 40 per department.
  - Each seed's `skillIds` must exist in that department's catalog (`server/src/catalog/seed/*`).
  - Its `capstone` is either `{kind:"task", title, task}` (a valid `taskSchema` task, which `checkTask` accepts) or `{kind:"topic", title, topicId}` (an existing content topic id whose practice or code challenge proves the outcome).

## New task kind: `terminal` (simulated shell; added to `shared/tasks.ts`)

For Git, shell, Docker and deploy outcomes. There is no real shell: the learner types commands into a fake terminal, and optionally edits files in a small editor.

```ts
{
  kind: "terminal",
  title: string (≤120),
  prompt: string (≤1500),          // the situation, e.g. "You pulled main and got a conflict in src/cart.js…"
  cwd: string (≤80),               // shown in the prompt, e.g. "~/shop-api (feature/cart)"
  intro: string (≤2000),           // what the terminal shows first (e.g. `git status` output)
  files: { path: string, content: string (≤4000) }[] (≤3, default []),   // editable files, e.g. a file with conflict markers
  steps: {                         // the commands needed, in order
    id: string,
    goal: string (≤200),           // shown to the learner only as a hint after a wrong command
    accept: string[] (1–6),        // JS regex sources, tested against the command with whitespace collapsed and trimmed, case-sensitive
    output: string (≤1500),        // printed when the command is accepted
  }[] (1–10),
  fileChecks: { path: string, mustContain: string[], mustNotContain: string[] }[] (default []),
  explanation: string (≤1500),
}
```

- **Learner response:** `{ kind: "terminal", commands: string[] (≤40), files: Record<path, content> }`.
- **Grading, by code:**
  - Walk the commands in order. A step is met when any later command matches one of its `accept` patterns (wrong commands in between cost nothing but are shown).
  - Each file check adds one unit: every `mustContain` present and no `mustNotContain` present (for example `<<<<<<<`, `=======` and `>>>>>>>` must be gone).
  - Score = met units ÷ total units. The task passes at 0.8 or more.
- **Unknown commands** print "command not handled in this exercise".

## Skill graph (Phase 2)
- `skill_edges(from, to, type)`.
- It is seeded from the catalog's `prerequisites` arrays, which become `prerequisite` edges, plus the research progressions.
- It must stay acyclic; admin edits are validated too.
- The ordering algorithm lives in `shared/pathOrder.ts` as a pure function and is tested.

## Videos (Phase 4)
- Server: `video_progress`, `video_meta` and `user_prefs` (`autoplayNext`).
- The admin setting for locking topics is `app_meta` key `videos.lock_mode`, either `lock` (the default) or `warn`.

## Topic tests (Phase 5)
- `topic_grounding` holds each topic's teaching content.
- `topic_test_items` holds the topic's test items. The static quiz items are imported at boot, keyed by `sourceId`, and only `active` items are served.

## Agent split
- **P1 core:** goals, Suggest/interpret, quick onboarding, the goal box, suggestions, the `terminal` kind, capstones.
- **P1 seeds:** three agents, one per department.
- **P2:** first the graph, admin page and ordering algorithm, which can run in parallel; then the integration, after P1.
- **P3:** the trail (client only), in parallel.
- **P4:** the video playlist, in parallel.
- **P5:** after P4, because both touch the topic page.
- **P6, P7:** last.
