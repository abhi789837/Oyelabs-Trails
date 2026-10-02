# Oyelearn v4.1: AI-personalised assessments and the Agency PM curriculum (run once, autonomous)

**How to run.** On your **Windows dev machine**, in Git Bash, from the Oyelearn project root:

```bash
git add -A && git commit -m "checkpoint before v4.1" ; git tag pre-v4.1
claude --permission-mode auto
```

Paste everything below the line. If the session stops, start it again the same way and paste the same prompt. It resumes from `docs/v4.1/PROGRESS.md`.

---

You are upgrading **Oyelearn** (live at https://learn.oyegen.com), building on v4 (departments, the simple Setup screen with priority sliders, the 25-question format, the code editor with 3 runs, the question bank, the AI router and the PM/BD curricula).

## 0. Operating rules

1. **Work fully autonomously.** Never ask me anything or stop between phases. Record each decision in `docs/v4.1/DECISIONS.md` and continue.
2. **Track progress so the work can resume.**
   - First, read `docs/v4/PROGRESS.md`. If any v4 phase is unfinished, finish it before starting v4.1.
   - Create `docs/v4.1/PROGRESS.md` with every step below as a checklist. Update it after every step. On every start, continue from the first unticked item.
3. **Use subagents** for research and content seeding, so the main context stays small.
4. **Each phase ends with:** lint, type check, tests and the build passing; one commit per phase (`feat(v4.1-pN): …`); and the phase ticked off. If something is blocked, make it degrade gracefully, log it under **"Needs Abhishek"**, and continue.
5. **Data safety:** migrations only, back up the production database before migrating, and never delete learner progress.
6. **Content truth:**
   - Every external link must be **fetched and verified** (HTTP 200, the real page). Every YouTube video must pass the oEmbed check (`https://www.youtube.com/oembed?url=<url>&format=json` returns 200).
   - Prefer official sources: Microsoft Learn and support, Keka Help Centre, Git and GitHub Docs, Atlassian, PMI, the Scrum Guide.
   - **Never invent Oyelabs-internal facts.** Where an internal process is needed (our Keka policies, meeting cadence, email templates), add a clearly marked `[Oyelabs SOP – admin to fill]` block that the admin can edit.
7. Keep the UI simple, keep the brand, keep the trail look, and support light and dark mode on mobile and desktop.

## Phase 1: AI-personalised assessment generation

Today assessments are assembled from the bank. Change this so **the AI writes each learner's assessment from what the admin set**: the selected skills and their priority sliders, the skip list, department, track, stack and tools, experience and level, **and the admin's free-text description or notes about the person**. The AI must **understand the admin's intent**, not just match keywords. It must also stay **token-lean**, and the test must be **finishable on time**.

### 1a. The admin's description field

- On the Setup screen, add (or reuse) one **"About this person and what you want"** text box, up to about 600 characters. For example: "Joined 2 weeks ago from a small agency. Handles 3 client projects. Weak on client calls and Excel trackers. Wants to own sprint planning by next month."
- Next to the summary card, show **"How the AI understood this"**: 3–5 bullet points of intent, plus the planned question split, for example:
  - Excel trackers: 4 hands-on items
  - Client update meetings: 3 items
  - …
  The admin can click **Regenerate understanding**, or edit the description, before pressing **Save & assign**.

### 1b. The generation pipeline (runs in the background at "Save & assign", so the learner never waits)

1. **Understand the intent.** Model: Haiku 4.5. The static system prompt is cached.
   - Input: a compact profile JSON (department, track, stack/tools, years, level, priorities with slider values, skips, the description).
   - Output (JSON, zod-validated): an intent summary (≤ 5 bullets), the context themes taken from the description (for example "international clients", "Laravel", "uses Keka timesheets"), and a **blueprint of exactly 25 slots**: 18 hands-on and 7 MCQ.
   - Each slot gives: skill, type (the coding/task subtype, or MCQ, with or without code), difficulty (1–5), target seconds, and a scenario hint.
   - The allocation rules are **enforced in code after the AI responds**: about 60% of slots on Critical and High skills (asked first), about 25% on Medium and Low, about 15% on track basics, never a skipped skill, and the difficulty start depends on level.
2. **Reuse what's already good.** For each slot, look in the question bank for a validated item with the same skill, type, language and difficulty, and matching context tags, that this learner hasn't seen. Reuse it if it fits the scenario hint. **Target: reuse up to about 40%** and generate the rest fresh, so every test feels personal while the cost stays low. The admin can set "Personalisation: High / Balanced (default) / Low" under Advanced.
3. **Generate the missing items.** Model: Sonnet 5.5.
   - Use **2–3 calls in total, not one per question**, each producing a batch of items as structured JSON.
   - The system prompt, schemas, style guide and examples are cached.
   - Each item **uses the learner's own context**: their stack, their tools, and the scenarios from the description. For example, a PM who handles international clients gets an email task to a client in another time zone about a delayed release.
4. **Validate automatically and fix.**
   - **Coding items:** run the reference solution against the hidden tests in the sandbox. It must pass, and the starter code must fail at least one test.
   - **MCQs with code:** run the snippet in the sandbox and check that the keyed answer matches the real output.
   - **Text MCQs:** a Haiku check that exactly one option is correct and the item isn't ambiguous.
   - **Task items** (PM/BD writing, Excel, ranking, calculation): check the rubric or answer key is complete, and for calculations, recompute the answer in code.
   - **Timing check:** see 1c.
   - Failed items are regenerated at most twice; after that, the slot is filled from the bank.
5. **Save and learn.**
   - The final 25 items are stored on the attempt.
   - New items that passed validation are added to the bank (tagged with skill, context and difficulty) as `active`, so future learners benefit.
   - Log the tokens and cost per stage through the AI router.
6. **Admin preview.** The admin sees "Assessment ready · 25 items · est. 29 min · AI cost $0.0x". They can open, swap or regenerate any single item before or after the learner starts. Regenerating one item makes one small call.

**Cost target:** at most about **$0.15 per personalised assessment** with Balanced personalisation. Measure the real figure and report it. Ways to stay under budget:
- caching,
- batch item generation,
- capped `max_tokens`,
- compact JSON,
- reuse from the bank,
- running nothing heavy while the learner is taking the test.

### 1c. Designed to finish on time (enforced, not hoped for)

- Time budget: **18 hands-on items at about 60–80 seconds each, and 7 MCQs at about 30–50 seconds each, for a total of 26–32 minutes.** The hard cap stays at 50 minutes, with free navigation and no per-question timer.
- **Size limits per item, checked in code:**
  - question text ≤ 60 words,
  - coding starter code ≤ 15 lines, and the fix or completion needed ≤ 5 lines,
  - MCQ code snippet ≤ 12 lines, with 4 options of ≤ 15 words each,
  - writing tasks ask for ≤ 80 words,
  - an Excel task touches ≤ 10 cells,
  - a ranking task has ≤ 6 items.
- **Time estimates** come from a deterministic formula: reading time (words at 200 wpm, code lines at 6 s each), plus the work (lines to write × 10 s, cells × 8 s, words to write at 25 wpm), plus 15 s of thinking.
  - Any item over its slot's target is shortened or regenerated.
  - The total must land within 26–32 minutes, or the assembler swaps items until it does.
- **Calibration from real data:**
  - Record the real time spent per item.
  - Items whose median time is above 1.5× their estimate get flagged and shortened.
  - Add a small admin chart showing estimated vs actual time per assessment.
  - Feed the measured averages back into the formula's constants every week, through an automatic job.
- Learner results and the admin view show "Finished in 31:40 (est. 29:00)".

### 1d. Tests

- The allocation rules hold even when the AI's blueprint breaks them.
- The skip list is never used.
- Validation catches a wrong answer key (seed a deliberately broken item).
- The timing check rejects items that are too long, and the total stays within 26–32 minutes.
- The reuse ratio respects the personalisation setting.
- A cost log is written.
- With the AI provider unavailable, the system falls back to bank-only assembly and tells the admin.

## Phase 2: Agency Project Manager curriculum, overhauled with Abhishek's priorities first

The current PM content is too generic. Our PMs are **existing project managers at a software agency**. They need **practical, tool-level, client-facing skills first**. Generic PM theory comes after and ranks lower.

### 2a. Research first

Use your web tools and subagents. Write `docs/v4.1/PM_RESEARCH.md` with verified sources for each area below. Use official documentation wherever it exists:

| Area | Sources |
|---|---|
| Keka | Keka Help Centre (help.keka.com): timesheets, leave and attendance, and **Keka PSA** for projects, clients, resource allocation, project billing types (Time & Material, Milestone, Non-Billable), timesheet approval, utilisation and reports, invoices |
| Microsoft Teams, Excel, Word, PowerPoint, Outlook | Microsoft Learn and Microsoft Support training |
| Git and GitHub | Git docs, GitHub Docs (repositories, branches, pull requests, reviews, releases, Issues and Projects) |
| Client management, status meetings, presenting, email etiquette | Reputable PM sources: PMI, Atlassian Team Playbook, The Digital Project Manager, TeamGantt and similar |
| Agency resource management | Capacity, allocation, utilisation and billable %, bench, forecasting from the sales pipeline: agency resource-management guides (for example Productive, Scoro) |
| SDLC and tech terms | Authoritative explanations of the SDLC, environments, APIs and deployment, rewritten in plain language |

### 2b. New PM skill catalog and courses, in this priority order

Seed these as skills and full courses, using the **standard course blueprint**:
- modules and topics,
- each topic with several verified reading references, a verified YouTube video, a short summary, **hands-on practice**, and a graded test,
- a certificate on completion.

Every course has Beginner → Intermediate → Advanced (and Super advanced where it makes sense) topic levels. Examples are always **agency life with clients**: a Laravel or React project for an overseas client, a delayed release, a change request, a demo.

1. **Improving your existing PM skills (diagnostic refresh).** Built from the assessment: short, targeted refreshers on the learner's real gaps in day-to-day PM work (planning, tracking, follow-ups, ownership). This always comes first in a PM's path when the assessment shows gaps.
2. **Client management:**
   - onboarding a client and kickoff,
   - setting expectations, owning the scope conversation and change requests,
   - saying "no" or "not now" professionally,
   - handling escalations and unhappy clients,
   - delivering bad news early,
   - working across time zones and cultures (international clients),
   - building trust and long-term relationships,
   - client satisfaction check-ins,
   - handing over to support or maintenance.
3. **Running client update meetings and presenting:**
   - the agenda,
   - RAG status,
   - what was done, what's next, risks and blockers, and the decisions needed,
   - demo flow and preparation,
   - presenting progress with slides or a live demo,
   - handling tough questions,
   - timeboxing,
   - capturing decisions and action items,
   - the **minutes of meeting (MoM) follow-up email within 24 hours**,
   - running it well in **Teams**: scheduling, screen sharing, recording and transcripts, chat etiquette.
4. **Email etiquette and professional writing:**
   - subject lines,
   - structure (purpose, details, ask, deadline),
   - tone with clients vs the internal team,
   - To vs CC vs BCC,
   - reply-all discipline and response times,
   - escalation emails,
   - status emails,
   - MoM emails,
   - chasing politely,
   - attachments and links,
   - signatures,
   - Outlook features (rules, templates, scheduling, flags),
   - writing well for non-native English readers.
5. **Microsoft Teams for PMs:**
   - teams vs channels vs chats,
   - meetings (scheduling, lobby, recording, transcripts, breakout rooms),
   - files and SharePoint basics,
   - tabs (Planner and Loop), @mentions,
   - presence and status etiquette,
   - running client calls on Teams,
   - Copilot in Teams if available.
6. **Excel for PMs, with heavy hands-on practice:**
   - tables, sort and filter, freeze panes, formatting,
   - formulas: SUM, AVERAGE, IF, COUNTIF, SUMIF and SUMIFS, XLOOKUP, dates and NETWORKDAYS,
   - conditional formatting for RAG status, data validation drop-downs,
   - pivot tables, charts,
   - **building real PM trackers**: a project tracker, a simple Gantt chart with conditional formatting, a resource allocation sheet, a budget vs actuals sheet, a RAID log,
   - protecting and sharing sheets,
   - Google Sheets equivalents.
7. **Word (and PowerPoint) for PMs:**
   - styles and headings, an automatic table of contents, templates,
   - **Track Changes and comments for reviewing SOWs and PRDs with clients**,
   - tables, headers and footers, exporting to PDF,
   - PowerPoint for status decks: a simple, clean layout and charts from Excel.
8. **Keka for PMs:**
   - logging and submitting timesheets,
   - **reviewing and approving the team's timesheets**,
   - leave and attendance and how they affect delivery plans,
   - **Keka PSA**: setting up projects and clients, project billing types (Time & Material, Milestone, Non-Billable), resource allocation and rate cards, utilisation and project reports, the invoice basics a PM should understand.
   - Include `[Oyelabs SOP – admin to fill]` blocks for our actual Keka policies.
9. **Resource management:**
   - capacity vs allocation vs utilisation,
   - billable % and why it matters to an agency,
   - the bench,
   - skill matrices,
   - allocating people across several projects,
   - spotting over- and under-allocation,
   - planning for leave and holidays,
   - forecasting from the BD pipeline,
   - re-planning when someone is pulled away,
   - weekly resource meetings,
   - doing all this in Excel and in Keka PSA.
10. **Git and GitHub for PMs (no coding):**
    - what a repo, branch, commit and pull request are,
    - reading a PR and its review status,
    - linking tickets to PRs,
    - releases and tags,
    - environments and which branch deploys where,
    - GitHub Issues and Projects,
    - questions a PM should ask the team about a release.
11. **The software development lifecycle in an agency:**
    - discovery, requirements, design, development, QA, UAT, release and maintenance,
    - dev, staging and production environments,
    - sprints in practice,
    - hotfixes vs releases,
    - app store and Play Store releases and review times,
    - what "done" means,
    - handover and support SLAs.
12. **Tech terminology in plain language:**
    - a glossary course where each term has a plain-English definition, an everyday analogy, "why a PM cares", and **"how to explain it to a client in one sentence"**,
    - terms include: frontend and backend, API, database, server, cloud and AWS, hosting, domain, DNS, SSL, deployment, CI/CD, staging, bug vs feature vs change request, technical debt, MVP, scalability, latency, caching, authentication, push notifications, integrations and webhooks, and AI terms (LLM, prompt, token, agent, hallucination),
    - include a **"translate this dev update for the client"** practice.
13. **AI for PMs:** Copilot or Claude for MoMs, status emails, PRDs, Excel formulas and risk lists, with the verification habits that go with it.
14. **Then the existing generic PM content** (Agile and Scrum, estimation, risk, EVM, governance, PMP alignment), re-labelled **"PM foundations and advanced theory"** and ranked **after** items 1–13 in default suggestions.

Set the **default suggested priorities** for a new PM learner on the Setup screen:
- Critical: client management, client update meetings and presenting, email etiquette.
- High: Excel for PMs, resource management, tech terms in plain language, SDLC.
- Medium: Teams, Word and PowerPoint, Keka, Git for PMs.
- Low: generic PM theory.

The admin can still move every slider.

### 2c. New hands-on task types for PMs (assessment and practice)

Build these as reusable components:

| Task type | What the learner does | How it's graded |
|---|---|---|
| **Excel task** | Work in a built-in spreadsheet grid with a real formula engine. For example, "add a SUMIF for billable hours per person", "apply RAG conditional formatting", "find the over-allocated person". | By cell values and formulas |
| **Email task** | Write or fix a client email: a delay notice, an MoM, an escalation reply. | Haiku rubric for structure, tone, clarity and a clear ask |
| **Meeting task** | Order a client update meeting agenda by dragging, or pick the right RAG status and decisions from a short scenario. | By code |
| **Explain-it task** | Explain a tech term or a dev update to a client in one or two sentences. | Haiku rubric: correct, simple, no jargon |
| **Keka or Teams scenario** | Use a lightweight simulated UI (for example a timesheet approval screen with problems to spot). No real logins. | By code |
| **Git-for-PMs task** | Read a mock PR page (status, reviews, checks) and answer what's blocking the release. | By code |
| **Resource task** | Allocate 5 people across 3 projects within capacity, in a small grid. | By code |

For the spreadsheet grid, use a **permissively licensed** spreadsheet or formula engine if one is suitable. If you choose a GPL or commercial-licensed engine, record the licence decision in `DECISIONS.md`. This is an internal tool, but the choice should be documented.

These tasks follow the same rules as everything else: 18 hands-on + 7 MCQs, 26–32 minutes by design, a 50-minute cap, "Check" up to 3 times before auto-submit, and the same timing size limits from 1c.

### 2d. Question bank and AI generation for PMs

- Seed the bank with validated PM items for each new skill and difficulty, using the task types above, so assessments are never empty.
- Phase 1's AI-personalised generation applies to PMs too, using the admin's description. For example, "weak on client calls" means more meeting, email and presenting tasks.

### 2e. Existing PM learners

- Map the existing PM learners and courses to the new catalog without losing their progress.
- Rebuild their paths with the new default priorities, unless an admin has already set sliders; admin settings always win.

## Phase 3: Tests, deploy and verify

1. **Tests:**
   - all of Phase 1d,
   - each PM task component and its grader,
   - every seeded course passes the course schema, and every link and video was verified (store the verification time),
   - the PM default priorities,
   - path order for a PM: diagnostic refresh, then client management, then the rest by slider.
2. **Playwright end-to-end tests:**
   - **PM:** onboard a PM with the description "handles 3 overseas clients, weak on client calls and Excel" and Critical sliders on client meetings and Excel. Check that the AI's understanding mentions both, and that the generated assessment has more meeting, email and Excel tasks with an estimated total of 26–32 minutes. Take it: one Excel task, one email task, one explain-it task. Then check the path: the diagnostic refresh, then client management and meetings, then Excel, before any generic theory.
   - **Engineering:** for a learner with a description, check that the generated coding items use their stack and scenario.
3. Deploy with the existing method. Back up the database first, and keep the shared Caddy setup working. Smoke-test on https://learn.oyegen.com. Check the AI usage page for the real cost per personalised assessment.
4. Write a report in `docs/v4.1/RESULTS.md` and summarise it in the chat. It should cover:
   - the cost per assessment (target vs actual),
   - the timing check numbers,
   - the PM curriculum counts (skills, courses, topics, verified links and videos, bank items),
   - the test results,
   - everything under **"Needs Abhishek"**, especially the `[Oyelabs SOP – admin to fill]` blocks for Keka, meeting and email templates.
5. Tag the release: `git tag v4.1.0`.

Start with step 0 (check the v4 progress), then Phase 1. Don't stop until Phase 3 is complete or only "Needs Abhishek" items remain.
