# Oyelearn v4: master build prompt (run once, fully autonomous)

**How to run.** On your **Windows dev machine**, in Git Bash, from the Oyelearn project root:

```bash
git add -A && git commit -m "checkpoint before v4" ; git tag pre-v4
claude --permission-mode auto
```

Then paste everything below the line. If the session ever stops (limits, a crash or a closed window), start it again the same way and paste the same prompt. It resumes from `docs/v4/PROGRESS.md`.

---

You are building **Oyelearn v4**, a large multi-phase upgrade of Oyelabs' internal learning platform. It is live at https://learn.oyegen.com, on a server shared with the Octopus AI deployments behind a shared Caddy container.

## 0. Operating rules (read first, follow throughout)

1. **Work fully autonomously.** Do not ask me anything and do not stop for review between phases. When a decision is needed, choose the option that best fits this brief, write it down in `docs/v4/DECISIONS.md` (decision, the alternatives, and why), and continue.
2. **Track progress so the work can resume.** Before starting, create `docs/v4/PROGRESS.md` with every phase and step below as a checklist. Tick items off as you finish them, and add notes for anything partial.
   - **On every start, read `PROGRESS.md` first and continue from the first unticked item.** Never redo finished phases.
   - Update `PROGRESS.md` after every step, so a context compaction or restart loses nothing.
3. **Use subagents** for research and for large self-contained pieces of work (for example seeding the PM curriculum, or writing the question bank). This keeps the main context small. Give each subagent a precise brief and the files it owns.
4. **Each phase ends with a checkpoint:**
   1. lint, type check, tests and the build pass;
   2. one commit per phase, with the message `feat(v4-pN): <summary>`;
   3. tick the phase off in `PROGRESS.md`.
   If a check fails, fix it before moving on. If something is truly blocked (for example a missing API key), build everything around it, make it degrade gracefully with a clear admin-facing message, log it under **"Needs Abhishek"** in `PROGRESS.md`, and continue.
5. **Never lose data.**
   - Use migrations only, and make them additive or migrate data with a reversible path.
   - Back up the production SQLite database before any production migration.
   - Never delete learner progress, attempts or certificates.
6. **Reuse before you build.**
   - Many earlier features may already be partly built: proctoring consent, the weekly plan with lanes and trail view, the AI course builder and research pipeline, user suspend/archive/delete, the code editor, and saving courses to the library.
   - **Phase 1 audits what exists.** Extend those parts and don't duplicate them. Keep the stack (React, Tailwind, shadcn/ui, Framer Motion, the existing server and SQLite), the brand tokens (Oyelabs blue `#2067D3`, Sora) and the trail visual language.
7. **No invented facts or links in content.** Every external link you put into seeded courses must be **fetched and verified** with your web tools (HTTP 200, the real page, not paywalled). YouTube videos must pass a check of `https://www.youtube.com/oembed?url=<video-url>&format=json`, which returns 200 for a public, embeddable video. Prefer official sources.
8. **Keep the UI simple and calm.**
   - At most one line of help text per field; longer explanations go in ⓘ tooltips.
   - Every screen should be understandable in 10 seconds.
   - Light and dark mode, mobile-friendly, and accessible (contrast of 4.5:1 or better, real buttons and labels).

## Phase 1: Audit and plan

1. Read the codebase end to end. Document the current state in `docs/v4/AUDIT.md`:
   - routes and pages (admin and learner), the data model and tables, AI calls (where they happen, which model, prompt sizes), assessment generation and grading, course structure, proctoring, the weekly plan, the course builder, the deployment method, and the Caddy and Docker setup on the server.
2. **Measure AI token usage today.** Find every LLM call and estimate the input and output tokens per assessment generated, per assessment graded and per course generated. If logs exist, use real numbers. Record the baseline in `AUDIT.md`. It will be compared after Phase 6.
3. Research what you need (findings go in `docs/v4/RESEARCH.md`, with links):
   - Code execution sandboxes: **Piston** vs **Judge0**. Check maintenance status, languages, Docker requirements (privileged mode, cgroup v1 vs v2 on our server's kernel), and security advisories. Pick one, and test that it can actually run on our server.
   - Anthropic API cost controls: current model IDs and prices (fetch the models list from the API with our key rather than trusting memory), prompt caching, the Message Batches API (50% off), and structured outputs or tool-use JSON.
   - Curriculum sources for **Project Management** and **Business Development** (Phase 7).
4. Write `docs/v4/PLAN.md` with the concrete approach for each phase, then begin Phase 2.

## Phase 2: Departments foundation (Engineering, Project Management, Business Development)

Oyelearn currently assumes everyone is a developer. Make **department** a first-class concept so more can be added later (Design, QA, HR) **without code changes**.

- **Data model:**
  - `departments` (id, name, slug, icon, colour, assessment format).
  - `tracks` belong to a department:
    - Engineering: Frontend, Backend, Full-Stack, Mobile, DevOps, AI/ML.
    - Project Management: Agile Delivery PM, Technical PM, Program/Portfolio.
    - Business Development: Agency BD (Upwork/inbound), Outbound & Partnerships, Account Management.
  - `skills` belong to a department, and optionally to tracks, with tags, a level band and prerequisites.
  - Courses link to skills and carry a **level**: `beginner`, `intermediate`, `advanced` or `expert` (shown as "Super advanced").
- Every learner has a department and a track. Migrate all existing learners to **Engineering**, mapping their current track.
- The learner UI adapts its wording per department. For example, a BD learner's "Practice" uses the task workspace, not a code editor.
- Admin pages (People, Curriculum, Courses, Generated) get a **department filter**. Add `/admin/departments` to manage departments, tracks and skills (add, rename, reorder, archive).

## Phase 3: Admin learner setup, radically simplified

The current "AI path" tab mixes setup forms with results, and it is too complex. Replace it.

**New learner tabs** (merging the current ones): **Setup · Assessment · Path · Library · Progress · Account**.
- **Assessment** contains the results, the integrity events and the evaluation as sections.
- **Path** contains the AI path and this week's plan.
- Move existing content into the new tabs without losing anything.

**The Setup tab, also used by `/admin/onboard`, is one simple screen of select, slide and assign:**
1. **Department and track:** two segmented pickers. Picking a department filters everything below.
2. **Stack or tools:**
   - Engineering: a searchable multi-select of stacks and languages (React, Next.js, Vue, Angular, Node/Express, NestJS, PHP/Laravel, Python/Django/FastAPI, Java/Spring, React Native, Flutter, Swift, Kotlin, SQL, AWS, Docker, and so on).
   - PM: tools (Jira, ClickUp, Asana, Notion, Linear, MS Project, Miro, Confluence).
   - BD: tools (HubSpot, Zoho CRM, Pipedrive, Salesforce, LinkedIn Sales Navigator, Upwork, Apollo, Clutch).
3. **Experience:** chips for 0, 1–2, 3–5 and 6+ years. **Level:** chips for 1–5, pre-filled from experience.
4. **Priorities: select only, no typing needed.**
   - A single **searchable skill picker** listing **every skill in the department**, grouped by area. Search matches names, aliases and tags. Clicking a skill **selects** it. Pre-suggest the skills that are typical for the chosen track.
   - Each selected skill appears as a row with a **priority slider** of 5 stops: Optional · Low · Medium · High · Critical (default Medium). Rows **sort automatically** by slider value, and ties keep their selection order (drag to fine-tune).
   - Mapping used everywhere: Critical and High = "High" (Do it now), Medium = "Medium", Low and Optional = "Low".
   - Only at the very bottom of the search results, show a small "Can't find it? Request a skill" link. It creates a pending skill for the super admin to approve. This should almost never be needed, because the catalog is comprehensive (Phase 7).
   - Show a "Don't include" list using the same picker (the skip list).
5. **Hours per week:** a number field, default 15, with a "≈ 3 h/day" hint.
6. **Sticky summary card:**
   - "Assessment: 25 questions · ~30 min (max 50) · 18 hands-on · weighted to your Critical/High picks: AWS, …"
   - Buttons: **Save & assign assessment** (primary) and **Save**.
   - Advanced settings are collapsed: week start, deadline, the cap on AI-generated courses, and auto-publish.

Remove the duplicate "Course builder settings" form. Migrate its data (must-have skills, skip list, time, weights) into this single model, `learner_priorities(learner, skill, slider 1–5, order)` plus `learner_skip`.

**The Path tab is results only, short:**
- A status line, for example "Path built Oct 2 · 5 courses · 1 generating", plus **Rebuild** and **View as learner** buttons.
- One list grouped by priority skill, in priority order. Each row shows:
  - the skill and its priority,
  - the assessed level (a 0–5 bar),
  - the starting level,
  - the attached course with its status: matched, reused, generated, generating, needs review or failed with **Retry**,
  - any "Must know first" refreshers,
  - a reason of 20 words at most, with an "Evidence" expander.
- "Also suggested" extras at the bottom, collapsed, each with **Promote**.
- Never show contradictory or empty messages. **Every High or Critical priority has a course, or a visible reason why not, with an action button.**

**The priority rule, enforced in code and tested:**
- The admin's priorities, in slider order, are the spine of the path. Every High or Critical skill gets a course even if the learner scored well; the assessment only sets the starting level.
- AI-found gaps never rank above admin priorities. Prerequisite refreshers attach under the skill they unblock and take at most about 20% of weekly time.
- Skipped skills are never tested and never taught.

## Phase 4: The new assessment format

**Shape (for every department):**
- **At most 25 questions.**
- **Engineering: 18 coding problems + 7 multiple-choice questions.** Other departments: 18 hands-on tasks + 7 MCQs (Phase 7 defines their task types).
- **Time:** designed to be completed in **about 30 minutes**, with a **hard maximum of 50 minutes** for the whole test. At 50 minutes it auto-submits.
  - There is **no per-question timer**.
  - The learner can **move freely forward and backward**, using a question navigator showing answered, flagged and unanswered questions.
  - Show a calm overall clock: "28:10 elapsed · ends at 50:00".
  - Add an admin setting "Minimum time before Finish", **off by default**. When it's on, Finish is disabled until that many minutes have passed. Log this choice in `DECISIONS.md`.
- **Difficulty:** questions are **small and practical, never tricky**.
  - Coding problems take 1–2 minutes each: complete a function, fix one or two lines, or make the output match.
  - Level 1–2 and 0 years of experience start at easy; others start at easy-medium.
  - The selection weights the admin's priorities: about 60% of questions on Critical and High skills (asked first), about 25% on Medium and Low, and about 15% on track basics in the learner's **own stack only**.
- An **"I don't know yet"** option on every question, with no negative marking.

**Coding problems (18):**
- A **dedicated code editor under each problem** (Monaco, lazy-loaded), in the right language and format for the learner's stack, with the starter code filled in.
- It shows the expected output or sample tests, plus a **Run** button and an output panel.
- **Run limit: 3 runs per problem.** Show "Runs left: 2". After the **3rd run**, the problem **auto-submits** its current code and becomes read-only. The learner can also press **Submit** at any time before that.
  - Autosave code continuously. If the overall time runs out, every problem's current code is submitted.
- Grading is by **hidden tests**, with partial credit for each test that passes. **No LLM call is used to grade code.**
- Languages: JS, TS, Python, PHP and SQL at minimum, plus Java and Dart if the sandbox supports them, and HTML/CSS with a live preview where it fits.
- Execution:
  - JS and TS run in a sandboxed Web Worker with a timeout.
  - Everything else runs in the **self-hosted sandbox chosen in Phase 1** (Piston or Judge0), as its own container: no network, CPU, memory and time limits, never on the host, not exposed publicly, and only callable by our server.
  - Rate-limit runs on the server too. The 3-run limit must be enforced on the server, not only in the UI.

**Multiple-choice questions (7):**
- Each MCQ that involves code **also has a code editor** preloaded with the snippet from the question. The learner can **run it (3 runs max, the same counter) before picking an option**.
  - This is intentional: the questions test understanding and reading output, not memorising tricks.
  - Running does **not** submit the MCQ; the learner still chooses an option.
- MCQs without code have no editor.

**Proctoring compatibility (must be tested):**
- Typing, copying, pasting, undo and selecting **inside the editor**, clicking Run or Submit, and focus moving between the question and the editor **never** trigger warnings.
- Pasting content from **outside** the page is still flagged.
- The learner never needs to copy anything anywhere.
- Keep consent, tab-switch detection and the webcam checks as they are.

**Results:** a friendly report **by priority skill** for the learner and the admin: level per skill, strengths, and "what we'll focus on first". There's no single scary percentage, although admins can still see the raw score.

## Phase 5: Question bank (the main token saver)

Stop generating every assessment from scratch with an LLM.

- Build a **question bank** table. Each item has: department, skill, track, stack or language, type (`coding`, `mcq`, `task`), difficulty (1–5), the prompt, starter code, hidden tests and sample tests (for coding), options and the answer (for MCQs), a rubric (for tasks), estimated minutes, times used, a discrimination score, and a status (`draft`, `active`, `retired`).
- **Assembling an assessment is deterministic code with no LLM call.** It picks items by skill weight, difficulty band and language, randomises them, and avoids items the learner has seen before.
- **Seed the bank** with a script (a subagent per department):
  - Engineering: enough active items for every core skill and major stack, at difficulties 1–4, with at least 6 coding items and 3 MCQs per skill and level band. For example: JS, TS, React, Node, PHP, Laravel, Python, SQL, REST, Git, Linux, Docker, AWS basics, and AI-driven development (prompting, CLAUDE.md, reviewing AI diffs).
  - PM and BD: as in Phase 7.
  - **Run every coding item's reference solution against its hidden tests in the sandbox.** Only items that pass become `active`.
- **Filling gaps:** if an admin selects a skill whose bank is too small, queue a background job that generates the missing items **once**, validates them (by running the tests), and adds them to the bank for everyone.
- **Admin bank page:** `/admin/question-bank` to filter, preview, edit, retire and approve drafts, and to see each item's stats.
- Retire items automatically when their stats show them to be broken: almost everyone fails them, or almost everyone passes them.

## Phase 6: AI cost control and model routing

The goal: assessments cost close to **$0 in LLM tokens** once the bank is warm, and course generation costs far less than today.

- **AI router module** (`server/ai/router`): every LLM call goes through it, with a named **task type** and an admin-configurable model per task type. Default routing:

| Task | Default model | Notes |
|---|---|---|
| Assembling an assessment | **none** | deterministic, from the bank |
| Grading coding questions | **none** | hidden tests |
| Grading MCQs | **none** | answer key |
| Grading written tasks (PM/BD) | Claude Haiku 4.5 | short rubric, JSON output |
| Skill matching, tagging, short reasons, summaries | Claude Haiku 4.5 | |
| Filling gaps in the question bank (generating items) | Claude Sonnet 5.5 via the **Batch API** | validated by tests |
| Course outline and topic writing | Claude Sonnet 5.5 | |
| Final course quality review, and difficult planning | Claude Opus 5.5, used sparingly | |

  - **Read the available model IDs from the API at startup** and verify them. Don't hard-code them blindly; keep them as config with these defaults.
  - Admins can change the model for any task type on **Admin → AI connection**.
- **Cut tokens:**
  - Use **prompt caching** for every static system prompt, schema and rubric.
  - Send compact JSON-only outputs with a `max_tokens` cap for every task type.
  - Send only the context each step needs: no full transcripts, only the learner's priorities and an evidence summary.
  - Reuse cached research results, verified resources and generated courses (the existing resources library) before calling the LLM or search again.
  - Use the **Message Batches API** for any non-urgent bulk generation (bank seeding, course generation queues).
- **Budget and visibility:**
  - Log every call: task type, model, input, output and cached tokens, cost, and the learner or course it was for.
  - Add a page **Admin → AI usage**: spend per day, per task type and per learner, the average cost per assessment and per generated course, and a monthly budget with a warning at 80%. At 100%, non-urgent jobs pause.
- **Compare against the Phase 1 baseline** and write the before and after numbers in `docs/v4/RESULTS.md`.

## Phase 7: Project Management and Business Development curricula

Research first, using your web tools: official and reputable sources, verified links, and YouTube videos checked with oEmbed. Then seed **skills, courses, the question bank and tasks** for both departments. **Use exactly the same course blueprint as the engineering courses:** modules and topics, each topic with several verified reading references, an embedded YouTube video, a summary, practice, a graded test, and a certificate on completion. Each department needs four levels: **Beginner → Intermediate → Advanced → Super advanced (Expert)**. Tailor everything to **a software agency that delivers AI-powered platforms for clients**.

### Project Management

Align with the **PMI 2026 PMP Exam Content Outline**: People 33%, Process 41%, Business Environment 26%, with new emphasis on AI in project delivery, sustainability and value realisation, and about 40% predictive and 60% agile or hybrid. Also align with the PMBOK Guide 8th edition, the current **Scrum Guide**, and the Kanban guides.

- **Beginner:**
  - project lifecycle and roles,
  - scope, time and cost basics,
  - Agile and Scrum fundamentals (accountabilities, events, artifacts) and Kanban basics,
  - writing user stories and acceptance criteria,
  - Jira or ClickUp basics,
  - running stand-ups,
  - status reporting and client communication,
  - requirements gathering,
  - software basics for PMs (environments, APIs, Git flow, what "deployment" means).
- **Intermediate:**
  - sprint planning, estimation (story points, velocity) and backlog prioritisation (MoSCoW, RICE, WSJF),
  - change requests and scope control,
  - RAID logs and risk management,
  - stakeholder mapping, RACI,
  - agency commercial models (fixed bid, T&M, retainer) and time tracking,
  - QA and UAT coordination,
  - release management,
  - retrospectives,
  - managing client expectations.
- **Advanced:**
  - hybrid delivery,
  - multi-project and resource capacity planning,
  - metrics (burndown, cycle time, throughput) and basic EVM (CPI/SPI),
  - SOWs and contract management,
  - escalations and difficult conversations,
  - project recovery,
  - vendor management.
- **Super advanced:**
  - programme and portfolio governance,
  - business cases and value realisation,
  - **AI in project delivery**: using Claude for PRDs, meeting notes, risk analysis and estimates, and managing AI-assisted dev teams and estimating AI-dev work,
  - an overview of scaling agile,
  - PMP and PMI-ACP exam alignment,
  - coaching other PMs.

### Business Development (agency BD)

- **Beginner:**
  - Oyelabs' services and offerings (AI platforms, white-label apps); keep the facts as placeholders for the admin to fill in, and never invent them,
  - ICP and personas,
  - lead sources (Upwork, LinkedIn, Clutch, referrals, inbound),
  - CRM hygiene,
  - cold email and LinkedIn outreach basics,
  - professional business writing,
  - **tech literacy for BD**: web vs mobile vs AI, MVP, APIs, tech-stack vocabulary, how projects are estimated.
- **Intermediate:**
  - discovery calls (SPIN questioning),
  - qualification (BANT through to **MEDDIC/MEDDPICC**),
  - Upwork mastery: job selection, Connects strategy, tailored proposals, Loom videos, profile optimisation,
  - writing proposals and SOWs together with engineering,
  - pricing models (fixed, T&M, retainer, dedicated team),
  - objection handling, follow-up cadences, running demos.
- **Advanced:**
  - consultative, solution and Challenger-style selling,
  - negotiation (BATNA, concessions),
  - RFP responses,
  - enterprise deals and procurement,
  - account management and upselling,
  - pipeline metrics and forecasting (win rate, sales cycle, ACV),
  - case studies and social proof,
  - white-label partnerships.
- **Super advanced:**
  - strategic accounts and expansion into new regions and verticals,
  - pricing strategy and margins,
  - building BD playbooks and leading a team,
  - **AI-powered BD**: research and personalisation at scale with AI, drafting proposals with Claude, and the ethics and accuracy checks that go with it,
  - contract essentials (MSA, NDA, IP clauses), with a "not legal advice" note.

### Hands-on task types for PM and BD

These replace coding in their 18 hands-on assessment items and in course practice. Build them as reusable components:

- **Write**, in a rich-text box with a word limit, graded by a Haiku rubric:
  - PM: a user story with acceptance criteria, a status update, a change-request summary, a risk entry, a retro summary.
  - BD: a cold email, an Upwork proposal opening, an objection reply, a follow-up message, a discovery call recap.
- **Rank or sort, by drag and drop, graded by code:** prioritise a backlog, order sprint events, rank leads by fit, sort pipeline stages.
- **Calculate, with a small built-in calculator or table, graded by code:** velocity and sprint capacity, CPI/SPI, a project estimate from tasks × rates, a retainer vs fixed-bid comparison, the deal value pipeline weighted by stage.
- **Scenario:** a short case with 2–3 linked decisions (the PMP-style case or scenario sets), graded by code.
- **Spot the issue:** find the problems in a flawed status report, proposal or sprint plan by highlighting them, graded by code against marked spans, plus a Haiku check of the short explanation.

The same assessment rules apply to PM and BD: 25 items at most, 18 hands-on + 7 MCQs, about 30 minutes, a 50-minute maximum, free navigation, and no per-question timer. For calculation tasks, the "3 tries" concept becomes "Check" up to 3 times before auto-submit, mirroring Run.

### Seeding volume

- For every skill at every level, seed **at least one complete course** (or a topic within a level course) and **enough bank items for the assessment**.
- Put every verified source into the shared **resources library**.
- Write a seed report to `docs/v4/CURRICULUM.md`: departments, levels, skills, courses, item counts, and any skills still thin.

## Phase 8: Path, weekly plan and course generation for all departments

- The path builder, the weekly plan (Do it now · Must know · Medium · Low, with the trail view) and the AI course builder work for **every department**, following the Phase 3 priority rules and the department's level ladder.
- **After the assessment, the path always starts:**
  1. **with Part 1, "Strengthen your current role"**: the gaps in their own track,
  2. **then Part 2, "AI-driven work for your role"**:
     - Engineering: AI-driven development in their stack.
     - PM: AI in project delivery.
     - BD: AI-powered BD.
  3. **then everything else, by admin priority.**
- Generated courses (when no bank or catalog course fits) follow the **same blueprint**, with verified research only.
- The admin can **Save to library**, which saves the course and all its sources for other learners, as it works now for engineering.

## Phase 9: Admin user management (complete it if partly done)

- **Suspend and reactivate; archive and restore.**
- **Delete permanently:**
  - super admin only; the admin must type the username to confirm,
  - an optional data export first,
  - a full cleanup of the user's personal data in one transaction,
  - global saved courses are kept,
  - an anonymised audit entry is written.
- Bulk actions on the People page.
- Every action revokes the user's sessions.
- An admin can't delete themselves or the last super admin.

## Phase 10: Polish, tests, deploy and verify

1. **Tests:**
   - the priority rule (all cases),
   - assessment assembly: 25 items at most, 18+7, the priority weighting, own stack only, no repeated items,
   - the 3-run limit with server enforcement and auto-submit,
   - the 50-minute auto-submit and free navigation,
   - the editor and proctoring whitelist,
   - sandbox execution for each language (no network access, timeouts),
   - the PM and BD task graders,
   - the AI router (task type → model, caching headers, budget pause),
   - migrations on a copy of the production database,
   - user deletion cleanup.
2. **An end-to-end Playwright run for each department:**
   1. Onboard a learner through the new Setup screen: select 3 skills and set the sliders.
   2. Take the assessment: run code twice on one problem, use all 3 runs on another (it auto-submits), and answer an MCQ after running its snippet.
   3. Finish.
   4. Check the Path: admin priorities come first, then Part 1 and Part 2, and every High priority has a course.
3. **UI pass:**
   - every changed screen in light and dark mode at 390 px and at 1440 px,
   - the trail and animations respect `prefers-reduced-motion`,
   - no wall-of-text help copy anywhere.
4. **Deploy** using the existing method:
   - back up the database, run the migrations, and deploy the code-runner container without breaking the shared Caddy setup;
   - smoke-test on https://learn.oyegen.com with a test learner in each department;
   - check the server logs.
5. **Rebuild paths** for the existing learners (including "rakesh / Gupta" and "abhishek / Abhishek Singh") with the new priority rules. Keep their progress.
6. **Final report** in `docs/v4/RESULTS.md`, and a summary in the chat:
   - what was built, phase by phase,
   - the token and cost numbers before and after,
   - the curriculum counts,
   - the test results,
   - production verification,
   - everything under **"Needs Abhishek"** (API keys, budget value, any skill requests).
7. Tag the release: `git tag v4.0.0`.

Start now with Phase 1. Don't stop until Phase 10 is complete or only "Needs Abhishek" items remain.
