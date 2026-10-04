# v4.3 Phase 6: clicks to onboard and assign

**What counts.** A click is one press of the mouse (or a tap) on a control. Typing does not count, and neither do keys like Tab, Enter or Escape. The count runs from the empty form until the assessment is issued. Handing over the password with Copy invite is one more click in every flow, so the counts below leave it out. Each count is listed click by click.

**The example learner** is the one from the quick-onboarding brief. Priya Sharma, Engineering: "Frontend dev, 2 yrs React, weak on Git, we want him doing backend + AI-driven work". The aim is a setup that reflects that line: a Backend track, React as the stack, 1–2 years, Git as Critical, and a backend goal and an AI goal.

## Before: the v4.2 flow (`pre-v4.3:src/features/admin/AdminOnboardPage.tsx` + `setup/SetupForm.tsx`)

The page was the account fields followed by the full Setup form.
- **Engineering had no default priorities in v4.2.** `defaultSlider` was seeded for PM skills only, so every priority had to be added by hand.
- **A newly picked skill started at Medium** (`DEFAULT_SLIDER = 3`), so each one also needed its slider moved.

**Typed:** Username, Full name, and "About this person and what you want".

| # | Click | Why |
|---|-------|-----|
| 1 | Track → **Backend** | Track had no default. |
| 2 | **Choose stacks** | Opens the stack picker. |
| 3 | **React** option | Escape closes the picker (a key). |
| 4 | Experience → **1–2** | The level follows from the experience. |
| 5 | **Add a priority skill** | Opens the skill picker; then type "git". |
| 6 | **Git fundamentals** option | |
| 7 | Git slider → **Critical** | It was added at Medium. |
| 8 | **Add a priority skill** | Then type "node". |
| 9 | **Express.js** option | |
| 10 | Slider → **High** | |
| 11 | **Add a priority skill** | Then type "claude". |
| 12 | **Claude Code agentic workflow** option | |
| 13 | Slider → **High** | |
| 14 | **Create & assign assessment** | |

**Total: 14 clicks** after typing. Pressing Create straight away was 1 click, but the result was a learner with no priorities at all, which is not the same outcome.

## After: quick onboarding (v4.3, the default on `/admin/onboard`)

**Typed:** Full name (the username fills itself: `priya.sharma`) and "Describe them in one line".

**Trusting the suggestion: 1 click.**

| # | Click |
|---|-------|
| 1 | **Save & assign assessment**: it runs Suggest, then saves and assigns. |

**Reviewing the suggestion first: 2 clicks.**

| # | Click |
|---|-------|
| 1 | **Suggest** (Enter in the line does the same with no click). |
| 2 | **Save & assign assessment** |

**A different department, reviewed: 3 clicks.**

| # | Click |
|---|-------|
| 1 | Department → **Project Management** |
| 2 | **Suggest** |
| 3 | **Save & assign assessment** |

**Result: 1 to 3 clicks after typing (target ≤ 3), down from 14.**

All of these come from the one line:
- the track, the stack, the experience and the level;
- the hours (smart default: 15 h);
- the ranked goals, with Git as Critical and backend and AI goals at High.

## Bulk: N learners (v4.3, `/admin/onboard` → Several people)

**Typed:** paste or type one line per person (`name, username, department, one line`).

| # | Click |
|---|-------|
| 1 | **Several people** |
| 2 | **Suggest all**: one request with every row, run four at a time. |
| 3 | **Create & assign all (N)** |
| 4 | **Copy all**: the credentials CSV, as the handover. |

- **Result: 3 clicks for any N, or 4 with the handover.**
- The same N in v4.2 took N × 14 clicks plus N handovers. For 10 people that was 140 + 10.
- Editing in the review table is optional and adds a click per change, for example removing a goal chip or changing a track.

## How it was measured

`scripts/e2e/v43-clicks.ts` drives the real UI against the built app and the mock AI. Every mouse click goes through one counting helper.

| Flow | Clicks |
|------|--------|
| Quick, default department, no review | 1 |
| Quick, PM department, reviewed | 3 |
| Bulk, 3 people, with Copy all | 4 |

The script also checks two more things:
- the credentials CSV has 3 rows;
- a bulk learner's page shows a next action with at most one button.

The v4.2 count was walked by hand from `pre-v4.3`.

## The worked example, end to end (`scripts/e2e/v43-worked-example.ts`)

**Typed:** the full name and the one line.

**Default path: 2 clicks**, which the script checks is no more than 3.
1. **Suggest**
2. **Save & assign assessment**

**Bringing the goals to the brief's worked example: 19 clicks, counted separately.**
- **What the mock Suggest proposes:** Git fundamentals at Critical, plus Node runtime, Node streams, Prompting for code and Context files at High.
- **What the worked example needs:** Git Critical, Backend High, AI-driven development Medium. Getting there takes these clicks:

| Change | Clicks |
|--------|--------|
| Remove Node streams | 1 |
| Add the GitHub PR workflow and set it to Critical | 3 (picker, option, slider) |
| Add Express, SQL, auth and deploy, each at High | 4 × 3 |
| Move Prompting for code to Medium | 1 |
| Move Context files to Medium | 1 |
| Add Reusable workflows from the suggested chip | 1 (it starts at Medium) |

A slider counts as one click on its thumb. The keys pressed after that click are not counted.

**A free-text goal: 3 clicks.**
1. The goal picker.
2. "Use … as a goal".
3. **Add goal**, after the interpretation chip shows.
