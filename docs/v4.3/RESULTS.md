# v4.3 results

Built and tested, Phases 1–7. The deploy is the one step left, because this machine has no SSH access to the server (see **Needs Abhishek**).

**Checks on the final commit:**
- lint: clean
- type check: clean
- `npm test`: **1,775 passed**, 6 skipped, 121 files
- `npm run build`: clean
- end-to-end tests, all passing:
  - `v43-worked-example`
  - `v43-video`
  - `v43-clicks`
  - `v43-trail-visual`
  - `v42-pm-processes`
  - `v4-departments`

## 1. Clicks to onboard and assign one learner

| Flow | Before (v4.2) | After (v4.3) |
|------|---------------|--------------|
| One learner, the example line, reviewed | **14** | **2**: Suggest, Save & assign |
| One learner, trusting the suggestion | 14 | **1** |
| One learner, another department | 14 | **3** |
| N learners (bulk paste) | N × 14 | **3**, or 4 with Copy all |

**Target ≤ 3 after typing: met.** The click-by-click detail is in `CLICKS.md`, and `scripts/e2e/v43-clicks.ts` measures it through the real UI.

## 2. Ordering examples

**The worked example from 2c.** The setup:
- Goals: Git Critical, Backend High, AI-driven development Medium.
- Measured: Git 2/5, AI 1/5, async JavaScript 1/5.

The unit test (`shared/pathOrder.test.ts`) gives exactly the brief's order:

> Git basics → Git branching and PRs → AI-driven development fundamentals (boosted to must-have) → async JS refresher (missing link) → Node/Express → databases → auth → deployment → advanced AI-driven workflows

The e2e test runs the same example through the real UI, mock AI and the real seeded graph. The worked-example skills come out in the brief's order. The graph adds real prerequisites around them, and no prerequisite edge is violated. The full order was:

> eng-javascript → eng-git → eng-github-flow → eng-ai-prompting-for-code → eng-js-execution-context → eng-js-event-loop → eng-js-async → eng-node-runtime → eng-http → eng-express → eng-sql → eng-auth-sessions-jwt → eng-paas-deploy → eng-js-functional → eng-typescript → eng-ai-context-files → eng-ai-reusable-skills → eng-php → eng-php-composer → eng-php-oop → eng-laravel-fundamentals

Why some skills land where they do:
- **JavaScript comes first.** It measured 0/5, and it is a prerequisite of everything after it.
- **Execution context and the event loop come before async JS.** Async JS needs them, so they are its missing links.
- **The PHP and Laravel chain comes last.** It comes from the Medium free-text goal "fix production bugs on our Laravel projects".

**Property tests over random graphs** cover the rest:
- prerequisites never come after the skills that need them;
- every needed skill appears exactly once, and mastered skills are skipped;
- must-have boosts raise a skill to at least High;
- ties go to the admin's order, then to the skill that unblocks the most, then to the id;
- when there is no gap, the path continues the progression;
- the result is deterministic.

## 3. Course test items: re-check, retire, regenerate

| | Count |
|---|---|
| Items to re-check | **8,772** static items across 1,005 topics |
| Re-checked against real AI | **0**, not run yet (Needs Abhishek) |
| Mock run in the e2e test (one topic) | 12 checked → 12 retired, 12 regenerated, 3 dropped, 0 withdrawn; the topic kept 12 active items, all cited |

- **Estimated cost of a full run:** about $23–57.
- **How it runs:** in steps of at most **$25**, and it can resume after each one.
- **Where:** Admin → Curriculum → **Test items** → Re-check. It shows the estimate first.
- **Until it runs:** static items show **"Source: awaiting re-check"** instead of a citation (decision D9). Generated items always cite their passage.

## 4. Transcript coverage

**0 of 1,868 videos** are used for questions. YouTube's caption download needs the video owner's permission, and scraping transcripts breaks the Terms of Service (RESEARCH.md §4). So every video is marked "not used for questions".

Test questions come from each topic's written content:
- the summary;
- the sections, as numbered passages;
- the derived learning objectives.

## 5. What was built

1. **Onboarding:**
   - One-line quick onboarding with **Suggest**, plus bulk paste.
   - A **"What should they be able to do?"** box that takes skills, practical cases and free-text goals. The AI interprets free text into an outcome, skills and a level.
   - **254 practical outcomes**: Engineering 74, PM 108, BD 72. Each one has a capstone.
   - Suggested goals at onboarding, then after the assessment and every week as **"Suggested next"**.
2. **Skill graph:**
   - **512 edges** across the three departments, all checked to be acyclic.
   - An admin editor and a read-only graph view.
   - The assessment blueprint covers the goals, their immediate prerequisites and the role's core skills. The evaluation outputs mastery and missing links.
   - The path is ordered by priority without breaking prerequisites (the topological sort), and each step shows its reason in one line.
3. **Trail:**
   - Each week is one continuous `<path>`, from its start to its summit.
   - My plan shows the whole route as one milestone trail.
   - Tested at 390, 768, 1280 and 1440 px, with 1, 5, 12 and 20 items and with lanes collapsed.
4. **Video playlist:**
   - A thumbnail list with a state for each video.
   - Autoplay next after a 5-second countdown, which can be cancelled.
   - Only seconds actually watched count, and a video is watched at 90%. Learners resume where they stopped.
   - The topic and its test are locked until every video is watched. Admins can relax this to a warning.
5. **Course tests:**
   - Items are generated from the topic content and cite the passage they come from.
   - Quality gates: relevance, answerability blind with the content, not trivial without it, distractors, code checks and timing.
   - Calibration flags hard items and retires them automatically. Admins review flagged items under **Test items**.
6. **Admin:**
   - The learner page has a next-action bar with one button.
   - Rarely used settings sit under **Advanced**.
   - Lists have search and filters, and destructive actions offer Undo.

## 6. Deploy

The database changes are additive: migration `0023_v43_goals_graph_video_tests.sql` adds 9 tables and 1 column, and drops nothing. At boot, `migrateV43Goals` turns existing priorities into skill goals. Progress, certificates and the new watch history are never deleted. A path rebuild only replaces the path, not the record of what was done.

**From the dev machine.** Main is 9 commits ahead of origin: v4.2 and v4.3.

```bash
git push origin main --tags
```

**On the server:**

```bash
cd ~/oyelearn && ./scripts/deploy/deploy-v4.sh
```

The script does four things:
- backs up the database, to the volume and to the host;
- pulls and rebuilds;
- restarts, with migrations running at boot;
- checks the app's health.

It never touches the shared Caddyfile.

**Then:**
1. In Admin → People, press **Rebuild all paths** (`POST /api/admin/paths/rebuild-all`).
2. Smoke-test https://learn.oyegen.com:
   1. Open `/admin/onboard` and quick-onboard a test learner (Suggest, then Save).
   2. Open `/admin/skill-graph`.
   3. Open `/admin/curriculum/test-items`.
   4. On an existing learner's `/plan`, check the rebuilt path, the continuous week trail and that their progress is still there.
   5. Open a topic with several videos: check the playlist and the lock.

## Needs Abhishek

1. **Deploy v4.2 and v4.3** with the steps above. The v4.1 deploy was also listed as outstanding. Then rebuild all paths and run the smoke test.
2. **Run the test-item re-check** from Admin → Test items, in steps of $25 or less. Total estimate: $23–57.
3. **YouTube Data API key (optional): set `YOUTUBE_API_KEY` in the server env.** Video durations are filled in from the player on first play and cached. With a key, they are shown before anyone plays the video.
4. **v4.2 leftovers:**
   - confirm the 20 handbook billing items (v4.2 RESULTS.md);
   - check the role-play monthly cap once real usage data is in.
