# v5 heuristic UX review (Phase 9.2)

Reviewed 2026-10-06 against Nielsen's 10 heuristics (`RESEARCH.md` §3) and the 10 experience principles (P1–P10):

- P1 one next step
- P2 learn by doing
- P3 time left
- P4 feedback that teaches
- P5 progress that means something
- P6 calm
- P7 fast
- P8 WCAG 2.2 AA
- P9 plain language
- P10 admin inbox

**How the screenshots were made.** `scripts/e2e/v5-review-shots.ts` uses its own server (port 8842, or `E2E_PORT`), a throwaway DATA_DIR and the mock AI. It seeds these people:

- **Nina:** a new learner with a 6-topic plan and nothing done.
- **Asha:** mid-plan. She has passed one lesson, got one answer wrong on Closures (so Review has cards), has a note and a reminder, and stopped on Read in two lessons.
- **Dev and Dina:** two learners who each finish Closures.
- **Sam:** takes the placement test, written and marked by the mock AI.
- **Admin work:** four review requests, a stuck learner, a reported problem and a draft course.

Every screen was shot at 390 and 1440, light and dark. The theme is written before each load, and `<html>` is checked for `.dark`. Shots are JPEG at quality 72, named `<screen>-<width>-<theme>.jpg`, in two folders:

- **Before:** `docs/v5/shots/review/before/` (164 shots)
- **After:** `docs/v5/shots/review/after/` (166 shots, plus re-shoots)

**Severity:**

- **High:** blocks or misleads.
- **Medium:** slows or confuses.
- **Low:** polish.

Paths below are relative to `docs/v5/shots/review/`.

## Summary

| Severity | Found | Fixed | Backlog |
|---|---:|---:|---:|
| High | 4 | 4 | 0 |
| Medium | 13 | 13 | 0 |
| Low | 30 | 15 | 15 (deferred) |

**Click counts.** Measured through the real UI by `v5-review-shots.ts` (`E2E_ONLY=clicks`); typing is not counted.

| Journey | Target | Before (BASELINE.md, v4.4 UI) | v5 before this phase | After |
|---|---|---:|---:|---:|
| Learner: open the app (`/`) → inside the next step | ≤ 1 | 1 | 1 | **1** (Today's Continue) |
| Admin: onboard + send the test, after typing the description (from `/admin`) | ≤ 3 | 3 | 3 | **3** (Onboard → Suggest → "Looks good — send the test") |
| Admin: approve a review request (from `/admin`) | 1 | 2 | 1 | **1** ("Give full marks" in the inbox) |

All targets are met.

One note on the onboarding count: a vague description can make the plan card ask "We weren't sure what you meant by … Pick one" first. "Looks good — send the test" then stays disabled until it's answered, which is one more click. That is deliberate error prevention (H5), so it is kept. The count uses the baseline's description, as `v5-admin.ts` does.

---

## Learner

### Today
| # | Heuristic / principle | Sev | Evidence | Fix | Status |
|---|---|---|---|---|---|
| T1 | H1 visibility of system status, H4 consistency, P1 | **High** | `before/today-mid-1440-light.jpg`: Continue says "Pick up where you left off: Closures, Read, 8 min left", but Closures is already passed (the course page shows it ticked, `before/course-1440-light.jpg`). My plan says the first stop is Hoisting. The learner is sent back to a finished lesson. | `resumeFor` (`server/src/v5/lesson/repo.ts`) now skips topics whose `topic_progress` is completed, so Continue moves to the real unfinished lesson. Test: `lesson.test.ts` "resume skips a lesson whose topic is already completed". | fixed. `after/today-mid-1440-light.jpg`: Continue resumes "How JS Code is Executed & the Call Stack" (Read, 17 min left). |
| T2 | H4, P1 | Medium | `before/today-mid-1440-light.jpg`: the trail's "You are here" marks Hoisting, while Continue names a different lesson. | `buildWeek(week, hereTopicId)` (`server/src/v5/today/routes.ts`) puts Continue's lesson first among the stops left. Test: `today.test.ts`. | fixed (re-shot in `after/today-mid-*`) |
| T3 | H2 match with the real world, P9 | Medium | `before/today-mid-1440-light.jpg` shows raw Markdown on the trail and in Up next: "\`let\` & \`const\`: the Temporal Dead Zone". It also shows on My plan, the course page and the lesson header. | New `shared/plainTitle.ts`, used by Today (server), the library syllabus, Review card titles, My plan (card, trail, list), the lesson header and "Up next", and Me → Notes. | fixed. `after/today-mid-1440-light.jpg` shows "let & const: the Temporal Dead Zone". |
| T4 | H8 minimalist design | Low | XP shows twice: the top bar ("140 XP") and the page header ("140 XP, +140 this week"). | Backlog: keep only "+N this week" in the header. | fixed. Today's header shows only "+N XP this week" (`today-xp` test id kept); the all-time total stays on the top bar's XP button. |
| T5 | H4 | Low | The hero chip says "Low" (`after/today-mid-1440-light.jpg`), while Up next says "Extra for Frontend" for the same lane. | Backlog: one set of lane words. `HERO_LANE` follows `LANE_META` (tested), so change both together. | fixed, with P3. One set of lane words: Do it now, Must know, Good to know, Extra (Up next's `whyChip` words). `LANE_META` (`src/features/plan/laneMeta.ts`) and `HERO_LANE` now say "Good to know" and "Extra" for medium and low; `format.test.ts` checks the hero, `LANE_META` and `whyChip` agree. |
| T6 | P5 | Low | "0 of 4 done" when two lessons were finished before the week was built (seeded data). In normal use the week is built on the first visit. | Backlog: count lessons finished this ISO week even when they're not week items. | fixed. `server/src/v5/today/routes.ts` `doneOutsideWeek` counts curriculum topics and course lessons finished since Monday 00:00 UTC (the streak's ISO week) that aren't week items, and adds them to both `doneCount` and `totalCount` ("2 of 6 done"); the trail's stops are unchanged. Tested in `today.test.ts`. |
| T7 | H8 | Low | `before/today-new-1440-light.jpg`: about 100 px of empty space under "Week done" in the week card. | The compact `Trail` (`src/v5/design/components/Trail.tsx`) now ends 16 px under the lowest marker or label instead of the shared geometry's 96 px. The full-page trail is unchanged. | fixed (checked on the a11y run's `today-1440-light`) |

### My plan
| # | Heuristic / principle | Sev | Evidence | Fix | Status |
|---|---|---|---|---|---|
| P1 | H4, P1 | Medium | `before/plan-trail-1440-light.jpg`: "Your first stop: Hoisting. Start", while Today's Continue resumes another lesson. That is two different "next" steps one click apart. | `nextStep(week, resumeTopicId)` (`planLogic.ts`, tested) prefers the lesson part-way through when it's open this week. My plan reads `/api/v5/lessons/resume`. The card then says "Pick up where you left off… Continue" (opening that step), and the trail's "You are here" marks it (`WeekTrail hereId`). | fixed (`after/plan-trail-*`) |
| P2 | H2, P9 | Medium | Backticks in trail and list titles (`before/plan-list-390-light.jpg`). | Same as T3. | fixed |
| P3 | P6 calm | Low | The list lane "Low · Nice to have. Skip these without guilt." "Low" reads as a judgement. | Backlog, with T5. | fixed, with T5. The old UI already reads its lane labels from the same `LANE_META` that v5's `LaneChip` and My plan use, so the rename (Medium → Good to know, Low → Extra) reaches both designs from that one source; the hints, icons and colours are unchanged. |

### Library and course page
| # | Heuristic / principle | Sev | Evidence | Fix | Status |
|---|---|---|---|---|---|
| L1 | H2, P9 | Medium | `before/library-1440-light.jpg`: "You'll be able to: … Use How JS Code is Executed & the Call Stack". This is broken grammar made from a question-shaped title. | `outcomeLine` (`shared/me.ts`, tested) turns how/what/why titles into "Explain how …" and drops code marks. | fixed. `after/library-390-light.jpg`: "Explain how JS Code is Executed & the Call Stack". |
| L2 | H1, P5 | Low | The card's progress bar has no number. | It now shows "Lessons done 2 of 6". | fixed (`after/library-390-light.jpg`) |
| C1 | P3 time left | Medium | `before/course-1440-light.jpg`: the side panel shows only the total "4 h 10 min" after 2 of 6 lessons are done. | A "Left to do" row (the sum of unfinished lessons), shown once started. | fixed. `after/course-1440-light.jpg`: "Left to do 2 h 55 min". |
| C2 | H4 | Low | The "← Library" link sits below the description instead of above the title. | `PageFrame` has a `back` slot above the title; the course page puts "← Library" there (loading, error and loaded states). | fixed |

### Review
| # | Heuristic / principle | Sev | Evidence | Fix | Status |
|---|---|---|---|---|---|
| R1 | H2, P9 | Low | `before/review-card-390-light.jpg`: the ratings show "1 min / 6 min / 10 min / 8 days" with no word for what the time is. | Backlog: "Again (back in 1 min)" or a one-line legend. | fixed. Each rating's time reads "Back in 1 min" / "Back in 8 days". The buttons' accessible names are unchanged (they already said "Back in …"). |
| R2 | P4 | Low | Key-point cards ask "What is the main idea of "<title>"?". It's generic, but the answer is good. | Backlog (content): use the section's own heading. | fixed. The summary key-point card asks with the lesson's own title (as section cards use their heading), with "The lesson in a sentence or two. Say it in your own words, then check." Cards already made keep their text. `review.test.ts` checks no new key point uses the stock question. |
| — | | | `before/review-empty-1440-light.jpg` ("Nothing to review yet", Go to my plan) and `before/review-offline-390-light.jpg` (offline banner and "Review on this device") are clear, each with one action. | | pass |

### Me
| # | Heuristic / principle | Sev | Evidence | Fix | Status |
|---|---|---|---|---|---|
| M1 | H1, H4, P5 | **High** | `before/me-settings-1440-light.jpg`: Weekly goal says "No hours goal (3 steps a week)", but Today's ring says "1.3 h of 15 h", from the plan's pace. The learner is told two different goals. | `/api/v5/motivation` now returns `defaultGoalMinutes` (`defaultGoalMinutesFor`, split from `goalMinutesFor`). The empty choice reads "Your plan's pace (15 hours a week)" in Settings and in the progress panel. Test: `motivation.test.ts`. | fixed (`after/me-settings-390-light.jpg`) |
| M2 | H8 | Low | The card heading "Weekly goal" repeats as the field label. | In Me → Settings the field label is screen-reader only (`WeeklyGoalField hideLabel`); the card heading is the visible label. The select's name is still "Weekly goal". The progress panel keeps its visible label. | fixed |
| M3 | H2 | Low | The XP chart's axis says "W34 … W41" (ISO week numbers). | New `shared/weekLabel.ts` (tested): the axis shows the week's Monday ("29 Sep"), and screen readers hear "Week of 29 Sep: N XP". | fixed |
| — | | | Progress empty lines ("Your levels appear after your first test", "None yet…") say what comes next. Notes link to their lesson. | | pass |

### Welcome, bell, error page
| # | Heuristic / principle | Sev | Evidence | Fix | Status |
|---|---|---|---|---|---|
| — | | | `before/welcome-1440-light.jpg`: 3 steps, Skip and Next, a clear step count. | | pass |
| B1 | H6 recognition | Low | `before/bell-390-light.jpg`: a linked notification looks the same as one with no link. | Linked notifications end with a chevron (`NotificationBell`); ones without a link don't. | fixed |
| E1 | H8 | Low | `before/error-boundary-1440-light.jpg`: the focused heading draws a heavy focus box. | `focus-visible:outline-none` on the tabindex=-1 heading. Focus still moves there for screen readers. | fixed (code; covered by the a11y run) |
| E2 | H3 user control | Low | On Today itself, the error page offers "Go to Today". | Backlog: offer "My plan" when the crash is on Today. | fixed. When the crash is on Today itself (`/learn`), the error page's second button is "Go to My plan"; elsewhere it's still "Go to Today" (staff: "Go to the inbox"). |

### Lesson player (Watch, Read, Do, Check), quick check, lesson complete
| # | Heuristic / principle | Sev | Evidence | Fix | Status |
|---|---|---|---|---|---|
| LC1 | H1, P1 | **High** | `before/lesson-complete-celebration-1440-light.jpg`: "Lesson finished. Nice work." with "Back to my plan", and `before/lesson-check-1440-light.jpg` says "That's everything in this part of your plan". Both learners still had Hoisting in their plan. "Next lesson" followed the track's order, so when the plan's next topic came earlier in the track, the learner hit a dead end. | `useNextTopic` (`LessonPlayer.tsx`) follows `/api/me/plan`: the next undone topic after this one, then an earlier undone one. It falls back to the track order outside the plan. `planNextTopicId` is in `lessonLinks.ts` and tested. | fixed. `after/lesson-complete-celebration-1440-light.jpg`: "Next up: Hoisting (variables & functions)" with "Next lesson". |
| W1 | H8, P8 | Medium | `before/lesson-watch-1440-light.jpg` and `before/lesson-watch-390-dark.jpg`: the "Play the next video" switch knob sits on the first letter ("Ꮲlay"). | The knob is anchored (`left-0`) and the track doesn't shrink. | fixed (`after/lesson-watch-*`) |
| W2 | H6 recognition, P1 | Medium | `before/lesson-do-390-light.jpg` and `before/lesson-watch-390-light.jpg`: on a phone the steps that aren't current were a bare tick or pencil, so the learner had to guess Watch, Read or Do. | `LessonStepHeader` keeps every step's word at 390 (tighter padding; the four steps fit). | fixed. `after/lesson-do-390-light.jpg`: "✓ Watch ✓ Read ✎ Do". |
| W3 | H8 | Low | "Focus  mode" and "Report  a problem" show a double gap (sr-only word split). | Backlog. | fixed. The visible word and its `sr-only md:not-sr-only` tail sit in one inline span, so the button's flex gap no longer adds to the space. Names unchanged ("Focus mode", "Report a problem"). |
| W4 | H4 | Low | On desktop, Next is in the header and again at the page end. It's the same action, which is acceptable. | Backlog: keep and watch it in testing. | kept as is, as the review suggested: the header Next and the end-of-page Next are the same action, and the end one is what a reader who scrolled reaches. Nothing in testing argued for removing either. |
| RD1 | P4 | Low | Read's "Key takeaways" are each paragraph's first sentence, so some are empty ("The stack is finite."). | Backlog (content pipeline). | fixed. `extractTakeaways` (`shared/lessonCore.ts`) takes the next sentence too when a paragraph's first sentence is under six words ("The stack is finite. Each call adds a frame…"). Tested in `shared/lesson.test.ts`. No content change. |
| D1 | H8 | Low | The coding Do step shows the "Test driver (leave as is)" code in the learner's editor. | Backlog (content): move the driver out of the starter code. | fixed without a content change. `steps/testDriver.ts` splits the starter code at `// ---- Test driver (leave as is) ----`: the editor shows the learner's part, and the driver is joined back for Run, Check, the draft and Send to laptop, so the server grades the same code and the old topic page reads the same draft. The help line says the test code is added when it runs. The one task whose driver has helpers the learner may call (a different marker) keeps it in view. |
| K1 | H1 | Low | Reopening Check on a finished lesson shows an unanswered quiz under "Lesson finished". | Backlog: say "You passed this. Take it again?" | fixed. When the Check step was already passed, it opens on "You passed this. Take it again?" with a "Take it again" button that shows the questions; a fresh result still shows as before. |
| — | | | Quick check (`before/quick-check-*`, `quick-check-result-*`): "Right." or "Not quite." with a why on each answer, and "don't count towards finishing" said up front. Time left shows in the header on every step. Do says why Finish is disabled ("Pass the practice, or check 3 more times"). | | pass |

### Test: pre-flight, sheet, results, certificate, verify
| # | Heuristic / principle | Sev | Evidence | Fix | Status |
|---|---|---|---|---|---|
| A1 | H4, P9 | Medium | `before/assessment-preflight-1440-light.jpg`: "What this assessment monitors" and "the assessment" throughout, while every other v5 screen says "test". | `PreFlight` takes `noun` ("assessment" by default, so the older UI is unchanged). The v5 `Sitting` passes `"test"`. | fixed. `after/assessment-preflight-1440-light.jpg`: "What this test monitors". |
| A5 | H2, P9 | Medium | `before/assessment-results-1440-light.jpg`: "We'll start with JavaScript Core because critical goal JavaScript fundamentals: you're at 0/5 and it needs 3/5." Step 2: "Before Stand-ups … because Stand-ups … needs Spoken English…, which you're missing (0/5; it needs 3/5)". | `plainReason` and `plainReasonSentence` (`story.ts`, tested) rewrite the path's staff wording for learners. The path text the admin sees is unchanged. | fixed. `after/assessment-results-1440-light.jpg`: "…because your JavaScript fundamentals goal needs level 3, and you're at level 0 now." |
| A2 | H8 | Low | The 5-step rail wraps onto two lines at 1440 (the 42 rem column). | Backlog. | deferred: the rail is in the shared v4 `src/features/proctor/PreFlight.tsx`, outside this pass's files. A layout prop (like `noun`) would keep the old UI unchanged. |
| A3 | P9 | Low | The pre-flight consent text is long (8 paragraphs). | Backlog: collapse the limits note and the microphone details. | deferred: same file as A2 (`src/features/proctor/PreFlight.tsx`), outside this pass's files. |
| A4 | P6 | Low | The sheet shows "Just so you know: developer tools may be open" twice in the headless run (`after/assessment-sheet-390-light.jpg`). The viewport changes trip the check. | `uniqueNotices` (`navigator.ts`, tested) shows one soft notice per reason, the newest; closing it closes its copies. | fixed |
| A6 | P6 | Low | "You've made a solid start." with 0 full marks. It's kind, but generic. | `nothingScored` (`story.ts`, tested): no full marks and nothing still being marked (or, with the answers hidden, every level 0) opens with "You've taken the first step." | fixed |
| CT1 | H8 | Low | `before/certificate-1440-light.jpg`: the "GOAL CERTIFICATE" eyebrow is in all caps. | The eyebrow is sentence case ("Goal certificate", 17 px, no letter spacing) in the on-screen art and the PDF. | fixed |
| — | | | The sheet (`after/assessment-sheet-1440-light.jpg`) has one overall clock, autosave words and one primary (Finish). Verify (`before/verify-390-light.jpg`) is clear. | | pass |

---

## Admin

| # | Screen | Heuristic / principle | Sev | Evidence | Fix | Status |
|---|---|---|---|---|---|---|
| O1 | Overview | H1, H4 | **High** | `before/admin-overview-1440-light.jpg`: "Departments at a glance" shows Engineering 1 and "No department" 5. People lists all 6 as Engineering (`before/admin-people-sheet-1440-light.jpg`), so the numbers disagree. | `learnerSignals` (`server/src/v5/admin/activity.ts`) uses the same default as the People list: a learner with no department is in Engineering. | fixed. `after/admin-overview-1440-light.jpg`: Engineering 6, and there's no "No department" row. |
| I1 | Inbox | H4, P9 | Medium | `before/admin-inbox-1440-light.jpg`: "Assessment: …" in each review request. The rest of the admin UI says "test". | The inbox detail says "Test: …" (`server/src/v5/admin/inbox.ts`). | fixed (`after/admin-inbox-1440-light.jpg`) |
| I2 | Inbox, empty | P1, P10 | Medium | `before/admin-inbox-empty-1440-light.jpg`: "All caught up 🎉" with no next step. | The empty state offers "Onboard someone" (primary) and "See how everyone is doing". | fixed (`after/admin-inbox-empty-390-light.jpg`) |
| On1 | Onboard (after Suggest) | H2, P9 | Medium | `before/admin-onboard-suggested-1440-light.jpg`: "Get better at al-driven development" in the goals, the test list and the learning order. The first-letter lower-casing turned "AI" into "aI". | `rules.ts` and `suggest.ts` keep a leading acronym. Test: `goals.test.ts` "a skill group named with an acronym keeps it". | fixed (re-shot) |
| I3 | Inbox | H6 | Low | The top bar's last control is only a "↶" icon (Use previous design). | From 1280 px the button shows "Use previous design" next to the icon; below that it's the icon with the same name and tooltip. | fixed |
| Pe1 | People | H4 | Low | The filter group reads "Stuck  Either  Stuck  Moving": the label repeats an option. | The quick filter is labelled "Activity" (Either / Stuck / Moving). | fixed |
| On2 | Onboard | H4 | Low | "Change something" (in the card) and "Edit details" (under it) are two ways to edit. This is the older shared `QuickOnboard`. | Backlog (needs an old-UI sign-off under rule 1). | deferred: it's the older shared `QuickOnboard`, and changing it needs an old-UI sign-off (rule 1). |
| Ed1 | Course editor | P1 | Low | `before/admin-editor-1440-light.jpg`: "Make it live" is a secondary button on a draft, while the primary is a disabled "Saved". | On a draft, "Make it live" is the primary. While the open lesson has unsaved changes, Save is the primary and "Make it live" steps back; "Saved" (disabled) is secondary. | fixed |
| Rp1 | Reports | H8 | Low | The AI cost chart's axis runs to $4 with $0.00 spent. | With no AI cost on any day, the chart is replaced by "No AI cost in these dates." | fixed |
| Rp2 | Reports | H2 | Low | "Team boards: off" reads like a status, not a switch. | A real switch (`role="switch"`, `aria-checked`) with a knob, named "Team boards", with the visible on/off word next to it. | fixed (`LeaderboardSetting.tsx`) |
| — | People, the side sheet, Library, Reports | | | Each has one primary action. The sheet keeps the list visible at 1440 and is full screen on a phone (`after/admin-people-sheet-390-light.jpg`). The sheet's "Next" now matches the learner's Continue, thanks to T1. | | pass |

---

## Changes that affect tests

Accessible names and test ids that existing scripts use are unchanged. Visible changes that a script could notice:

- **Lesson step header on phones.** Every step now shows its word; before, only the current one did. Names are unchanged. `v5-mobile-learner.ts` checks the header's position, not its labels.
- **Library card progress bar.** The aria-label is now "Lessons done", with "2 of 6" shown. Before it was "<course>: 2 of 6 lessons done". No script used it.
- **Me → Settings weekly goal.** The empty choice reads "Your plan's pace (N hours a week)" when the plan or onboarding sets hours. Otherwise it is still "No hours goal (3 steps a week)".
- **v5 pre-flight wording.** It says "test" instead of "assessment". The heading "Before you start" and the buttons are unchanged.
- **Inbox.**
  - Review request details start "Test: …".
  - The empty inbox has two new links, "Onboard someone" and "See how everyone is doing". `v5-admin.ts` uses `getByRole("link", { name: "Onboard", exact: true })`, which still matches only the nav link.
- **Today and My plan** may name a different "next" lesson than before when a lesson was finished outside the player. The trail is reordered so Continue's lesson is "You are here".
- **Results copy.** The first steps and the "because" sentence are reworded. `v5-assessment.ts` matches `/We'll start with .+|Your plan builds on/`, which still holds.
- **Overview.** Learners without a department now count under Engineering.
- **Phase 9 low backlog.** Test ids are unchanged. Visible copy and names a script could notice:
  - **Reports → Team boards** (`data-testid="leaderboard-toggle"`) is now `role="switch"` named "Team boards", with `aria-checked`. Its text still includes "off"/"on" (`v5-motivation.ts` checks `innerText().includes("off")`, then `"on"`), but it's no longer a `button` with `aria-pressed`, and the name no longer carries the state.
  - **Reports → AI cost.** With no AI cost in the dates, the bar chart "AI cost (USD)" isn't drawn; `data-testid="ai-cost-empty"` says "No AI cost in these dates." The CSV is unchanged.
  - **Results story.** When nothing scored, the first sentence is "You've taken the first step." `v5-assessment.ts` line 470 matches `/^(You're strong at .+\.|You've made a solid start\.)/`; it passes today because its learner scores, but a run where nothing scores would need that regex to accept the new line.
  - **People.** The quick filter's radio group is named "Activity" (was "Stuck"); its choices are unchanged.
  - **Me → Settings.** The "Weekly goal" label is screen-reader only there; `getByLabel("Weekly goal")` still finds the select.
  - **Me → Progress.** The XP chart's axis shows dates ("29 Sep") and the hidden text says "Week of 29 Sep: N XP" (was "2026-W40: N XP").
  - **Certificate art and PDF.** The eyebrow is "Goal certificate" (was "GOAL CERTIFICATE"). The image's name is unchanged.
  - **Course page.** "← Library" sits above the title (same link name).
  - **Admin top bar.** From 1280 px "Use previous design" shows as text too; the button's name is unchanged.
  - **Course editor.** "Make it live" is the primary button on a saved draft; Save is secondary while saved. Names are unchanged.
