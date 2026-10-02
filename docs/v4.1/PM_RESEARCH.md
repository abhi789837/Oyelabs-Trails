# v4.1 research: practical curriculum for Oyelabs project managers

Researched 2026-10-02. Machine-readable sources live in `docs/v4.1/sources-pm-agency.json`
(`area -> topics -> refs[] / videos[]`, every entry carrying `verifiedAt`).

Who this is for: Oyelabs' existing PMs. They run AI platforms, white-label apps and
Laravel/React builds for overseas clients. They already do the job, so the track should
refresh and tighten daily practice and teach the tools (Teams, Outlook, Excel, Word,
PowerPoint, Keka, GitHub). It should not teach PM theory from scratch. The topic slugs
below are kebab-case `pma-...` and match the JSON keys.

## How everything was verified

- **Reading links.** Every URL was fetched with curl (`-L`, follow redirects). It was kept
  only if all of these held: final status 200, the final URL was not a sign-in page, and
  the HTML `<title>` was the real page. Titles like "Just a moment", "Attention Required",
  "Sign in", "Not found" or "Service unavailable" were rejected.
  - Plain `-A "Mozilla/5.0"` was not enough. Cloudflare-fronted sites (help.keka.com/hc,
    cloudflare.com/learning, projectmanager.com, thedigitalprojectmanager.com, pmi.org,
    scrum.org) answer that with a 403 bot challenge, and support.microsoft.com rate-limits
    with 403 "Service unavailable".
  - The final check therefore used Git's curl with `--http2`, a full Chrome User-Agent and
    normal browser `Accept*` / `Sec-Fetch-Mode` headers. It ran 3 requests at a time and
    retried a failing URL up to 3 times with back-off. A URL counted only when one of those
    attempts returned 200 with the real page title.
  - WebFetch is blocked outright (403) on help.keka.com, so for Keka the curl title check
    is the content check.
- **Videos.** Every candidate id was scraped from YouTube's own search-results page
  (`youtube.com/results?search_query=...`, `ytInitialData`). Each one then had to pass
  `https://www.youtube.com/oembed?url=...&format=json` with a 200. `title` and `channel`
  in the JSON are copied from the oEmbed `title` and `author_name`. Two scraped ids
  (`9uFKAwIa3V0`, `kSU2MPeptpM`) returned oEmbed 401 (embedding disabled) and were dropped.
- **`verifiedAt`** is the UTC time of the last successful check of that URL or id.
- **`kind`** is `docs` for vendor product docs and help centres, `spec` for normative
  texts (Scrum Guide, SemVer, App Review Guidelines, plain-language guidelines, Twelve-Factor,
  NIST AI RMF), and `article` for everything else.

## Counts per area

| Area | Topics | Ref slots (unique URLs) | Video slots (unique ids) | Min refs / min videos per topic |
|---|---|---|---|---|
| `pma-daily-pm-work` Diagnostic refresh: daily PM work | 3 | 12 (12) | 5 (5) | 4 / 1 |
| `pma-client-management` Client management | 9 | 34 (29) | 22 (22) | 3 / 2 |
| `pma-client-meetings-presenting` Client update meetings and presenting | 9 | 35 (26) | 21 (19) | 3 / 2 |
| `pma-email-writing` Email etiquette and professional writing | 8 | 28 (21) | 15 (13) | 3 / 1 |
| `pma-microsoft-teams` Microsoft Teams for PMs | 7 | 25 (23) | 17 (17) | 3 / 2 |
| `pma-excel` Excel for PMs | 9 | 37 (34) | 24 (24) | 3 / 2 |
| `pma-word-powerpoint` Word and PowerPoint for PMs | 4 | 13 (12) | 10 (10) | 3 / 2 |
| `pma-keka` Keka for PMs | 7 | 33 (27) | 15 (8) | 3 / 1 |
| `pma-resource-management` Agency resource management | 7 | 28 (23) | 16 (15) | 3 / 2 |
| `pma-git-github` Git and GitHub for PMs (no coding) | 7 | 28 (26) | 15 (14) | 3 / 1 |
| `pma-sdlc-agency` SDLC in an agency | 8 | 29 (27) | 17 (17) | 3 / 1 |
| `pma-tech-terms` Tech terms in plain language | 8 | 36 (36) | 25 (25) | 3 / 3 |
| `pma-ai-for-pms` AI for PMs | 4 | 14 (13) | 10 (10) | 3 / 2 |
| **Total** | **90** | **352 (268)** | **212 (192)** | every topic has at least 3 refs and 1 video |

## Area summaries

### 1. Diagnostic refresh of daily PM work (`pma-daily-pm-work`)
Topics: planning the week, tracking progress, follow-ups and ownership (RACI/DACI).
Best sources are Atlassian's project-planning guide and Team Playbook plays (DACI, roles
and responsibilities), the Asana RACI guide and TeamGantt's PM guide. The videos are short,
practical "week planning" and status-tracking explainers. This area should open the track
as a diagnostic: a short self-check quiz that routes the PM to weak areas.

### 2. Client management (`pma-client-management`)
Topics: onboarding and kickoff, expectations/scope/change requests, saying no or not now,
escalations and unhappy clients, delivering bad news early, time zones and cultures, trust,
satisfaction check-ins, handover to support.
Strong sources:
- The Digital Project Manager kickoff guide and the Atlassian kickoff play.
- TeamGantt on scope creep.
- ProjectManager.com on change requests, communication plans and project closure.
- The Atlassian stakeholder-communications-plan play.
- Asana on distributed and cross-cultural teams.

Videos include The Digital Project Manager's own kickoff video, ProjectManager's
change-control series and TeamGantt's "Breaking bad news to stakeholders". This area is
agency-specific, so write scenarios around fixed-bid vs T&M clients, a US/UK/AU client in
another time zone, and a white-label reseller sitting between Oyelabs and the end client.

### 3. Client update meetings and presenting (`pma-client-meetings-presenting`)
Topics: agenda, RAG status, done/next/risks/decisions, demo prep and flow, presenting
progress, tough questions, timeboxing and action items, MoM within 24h, running it in Teams.
- RAG is well covered: ProjectManager on RAG and Mike Clayton's RAG video.
- The Scrum Guide and Atlassian's sprint-review page cover demo flow (sprint review), with
  Mountain Goat and Scrum.org videos.
- Microsoft Support covers scheduling, screen sharing, recording and live transcription.
- MoM practice is covered by the Asana meeting-minutes template guide plus "how to write
  minutes" videos.

### 4. Email etiquette and professional writing (`pma-email-writing`)
Topics: subject and structure, client vs internal tone, To/CC/BCC and reply-all,
status/escalation/MoM emails, chasing politely, attachments/links/signatures, Outlook
features (rules, templates, schedule send, flags), writing for non-native readers.
- Sources: HBR "military precision" email, Purdue OWL, plainlanguage.gov, the Microsoft
  Writing Style Guide "global communications" section, the Google developer style guide
  "write for a global audience", and Microsoft Support for Outlook rules, delayed send,
  signatures and attachments.
- Videos: HBR's email-etiquette video, the British Council's CC/BCC explainer, and Kevin
  Stratvert and Leila Gharani on Outlook rules, Quick Parts and templates.

### 5. Microsoft Teams for PMs (`pma-microsoft-teams`)
Topics: teams vs channels vs chats, meeting features (lobby, recording, transcripts,
breakout rooms), files and SharePoint, Planner and Loop tabs, @mentions and presence, client
calls with external guests, Copilot in Teams.
- Sources: Microsoft Learn (teams/channels overview, SharePoint/OneDrive interaction, guest
  access, external meetings, lobby policy, presence) and Microsoft Support (breakout rooms,
  live transcription, @mentions, status, Loop, Copilot in meetings).
- Videos: the official Microsoft Teams channel (channels, Loop, file sharing, tags) and
  Kevin Stratvert (lobby, breakout rooms, full tutorial).

### 6. Excel for PMs (`pma-excel`)
Topics: tables/sort/filter/freeze; SUM/AVERAGE/IF/COUNTIF/SUMIF(S)/XLOOKUP; dates and
NETWORKDAYS; conditional formatting for RAG; data validation; pivots and charts; trackers
(project tracker, Gantt via conditional formatting, resource allocation, budget vs actuals,
RAID log); protect and share; Google Sheets equivalents.
- Every function has its own Microsoft Support page, and all were verified.
- Leila Gharani and Kevin Stratvert cover nearly every topic. Kenji Explains (Gantt chart)
  and Tactical Project Manager (RAID log, team capacity planner) cover the trackers.
- Google Docs Editors Help covers the Sheets equivalents (function list, XLOOKUP, SUMIFS,
  conditional formatting).
- This is the area that needs graded hands-on cells. See the formula-engine section below.

### 7. Word and PowerPoint for PMs (`pma-word-powerpoint`)
Topics: styles, headings, automatic TOC and templates; Track Changes and comments for
SOW/PRD review; tables, headers/footers and PDF export; PowerPoint status decks with charts
linked from Excel.
- Microsoft Support covers all of it.
- Videos: Kevin Stratvert (styles, TOC, headers/footers, PowerPoint basics, linking Excel
  to PowerPoint), GCFGlobal/LearnFree (Track Changes) and Stuart Taylor (status-report
  slide design).

### 8. Keka for PMs (`pma-keka`)
Topics: timesheets (log, submit, approve the team's), leave and attendance and their
delivery impact, and Keka PSA:
- projects and clients;
- billing types (Time & Material, Milestone, Non-Billable);
- resource allocation and rate cards;
- utilisation and project reports;
- invoices.

Sources are the Keka Help Centre `help.keka.com/hc/en-us/articles/...` pages. Notable ones:
- "What is Keka PSA", which defines T&M, Milestone and Non-Billable.
- Getting started with Keka PSA.
- Submitting weekly and daily timesheets.
- Managing your team's timesheets.
- Bulk timesheet approval.
- Tailoring resource allocation (0-100% allocation per project).
- Tracking resource utilization across projects.
- Billing and invoicing overview.
- Billing entities and invoice settings.
- Milestone info report.
- Retainer billing.
- Proforma invoices.

Videos come from the official Keka HR channel ("Understanding employee timesheets ... Billing
& Invoices in Keka" (~50 min), "Manage timesheets better" parts 1 and 2, the Keka PSA
overview, and leave-policy management), plus one third-party Keka employee-app walkthrough.

**Important caveat:** the same Keka articles also exist at `help.keka.com/admin/...` paths,
which show up in search results. Those redirect to a Keka sign-in page (login wall) and were
excluded. Use only the `/hc/en-us/articles/` form.

### 9. Agency resource management (`pma-resource-management`)
Topics: capacity vs allocation vs utilisation and billable %; bench and skill matrix;
multi-project and over/under-allocation; leave and holiday planning; forecasting from the BD
pipeline and re-planning; the weekly resource meeting; doing it in Excel and Keka PSA.
- Sources: Productive (billable utilization, agency utilization rate, which puts healthy
  agency utilization at 85-90%), Float (resource guides, over-allocation, capacity-planning
  help article), Scoro, Asana resource-management and staffing templates, and Keka's
  allocation and utilization articles.
- Videos: Productive's own "Agency utilization rate", BigTime's "Billable utilization",
  ProjectManager's resource-planning series and ProSymmetry's forecasting clips.

### 10. Git and GitHub for PMs, no coding (`pma-git-github`)
Topics: repo, branch, commit, PR; reading a PR (reviews, required checks); linking tickets
to PRs; releases and tags; environments and which branch deploys where; GitHub Issues and
Projects; questions to ask before a release.
- docs.github.com covers every topic. Use git-scm.com (what is Git, tagging), semver.org and
  Atlassian's Gitflow page for hotfix and release branches.
- Videos: the official GitHub channel ("How to create a pull request in 4 min", "How to use
  GitHub issues and projects", "A brief introduction to Git") and Fireship ("Git explained
  in 100 seconds", "GitHub pull request in 100 seconds").

### 11. SDLC in an agency (`pma-sdlc-agency`)
Topics: phases from discovery to maintenance; dev/staging/prod; sprints in practice; QA
and UAT; hotfix vs release; App Store and Play Store review; definition of done; handover
and support SLAs.
- Sources: AWS "what is SDLC", the Atlassian SDLC page, the Scrum Guide, Scrum.org on the
  definition of done, Twelve-Factor dev/prod parity, Apple App Review plus its guidelines,
  Google Play Console help on publishing status and review times, Atlassian on SLAs,
  SLA/SLO/SLI and severity levels, and the Google SRE book chapters.
- Videos: Development That Pays (Scrum vs Kanban), freeCodeCamp (definition of done), Mike
  Clayton (UAT) and CodeWithHarry (dev/staging/prod).

### 12. Tech terms in plain language (`pma-tech-terms`)
Topics cover frontend/backend/API, database/server/cloud/hosting, domain/DNS/SSL,
deployment/CI/CD, bug vs feature vs change request, technical debt, MVP,
scalability/latency/caching, auth, push notifications, integrations and webhooks, and
LLM/prompt/token/agent/hallucination.
- Sources: MDN, AWS "what is" pages, the Cloudflare Learning Center, IBM Think topic
  pages, Martin Fowler on technical debt, the Firebase Cloud Messaging docs, GitHub and
  Stripe webhook docs, and the Anthropic docs (prompt-engineering overview, glossary).
- Videos: IBM Technology (API, database, LLMs, hallucinations, AI agents, continuous
  integration), Fireship (DNS, CI/CD, REST APIs), ByteByteGo (SSL/TLS, caching, webhooks),
  3Blue1Brown (LLMs) and Y Combinator (MVP).

### 13. AI for PMs (`pma-ai-for-pms`)
Topics: AI for MoMs and status emails, for PRDs and risk lists, for Excel formulas, and
verification habits.
- Sources: Microsoft Support (Copilot in Teams meetings, drafting and summarising in
  Outlook, Copilot in Excel and Word), the Anthropic prompt-engineering docs (be clear and
  direct, multishot, reduce hallucinations), the Microsoft 365 Copilot transparency note,
  and the NIST AI RMF.
- Videos: the official Microsoft Copilot channel (draft an email in Outlook), Scott Brant
  (Copilot meeting notes), Bulb Digital and PPM Works (Copilot for PMs), IBM Technology
  (prompting methods, hallucinations) and "Why do AI models hallucinate?" from Claude and
  Anthropic.

## Gaps and caveats

- **Keka PSA has no dedicated official videos.**
  - The Keka HR channel has long webinars and short promos, but no per-feature PSA clips
    (rate cards, allocation, invoices).
  - The PSA topics therefore reuse "Understanding Employee timesheets | Timesheets usage,
    Project Management, Billing & Invoices in Keka" (~50 min) and the PSA promo
    "Deliver Profitable Projects on Time, Every Time".
  - Recommendation: record short internal screen captures from Oyelabs' own Keka tenant
    for allocation, rate cards, the utilisation report and invoice creation.
  - The Keka leave topic includes two third-party employee walkthroughs
    ("Unstoppable Satya", "POS Internal Trainings").
- **Keka Help Centre URL trap.** Search engines index many Keka articles at
  `help.keka.com/admin/...`. Every one of those redirects to `help.keka.com/auth/v3/signin`
  (login wall), so 17 such links were rejected.
  - Only `help.keka.com/hc/en-us/articles/<id>-<slug>` URLs are in the JSON. They are
    Cloudflare-fronted and need browser-like headers to return 200.
  - Not found in the public `/hc/` form, so not included: dedicated pages for client rate
    cards, target billable utilization and the project resource billing report (those
    exist only behind `/admin/`). Rate cards are covered indirectly through "Using Bulk
    Imports in Keka PSA" and "Getting started with Keka PSA".
- **Bot-protected sites are flaky.**
  - cloudflare.com/learning, projectmanager.com, thedigitalprojectmanager.com and
    help.keka.com intermittently return a 403 "Just a moment" challenge. They were kept
    only after a real 200 with the right title.
  - scrum.org always returned 202 with an empty body ("What is a Sprint Review", "What is a
    Definition of Done"), so it was dropped. The Scrum Guide and Scrum.org's YouTube video
    cover those topics instead.
  - pmi.org learning-library pages returned 404 or a challenge and were dropped. Only PMI's
    "What is project management" page made it in.
  - A runtime that previews references in an iframe should assume these sites will not
    embed.
- **Thin but acceptable topics.** 27 of 90 topics sit exactly at the 3-ref minimum. The
  weakest of these:
  - `pma-to-cc-bcc-reply-all`. There is no official Microsoft page left on CC/BCC
    etiquette; the old "Show, hide, and view the Bcc box" and "Flag email messages" support
    URLs now 404.
  - `pma-writing-for-non-native-readers`
  - `pma-definition-of-done`
  - `pma-dev-staging-prod`
  - `pma-sdlc-phases`
  - `pma-word-tables-headers-pdf`
  - `pma-powerpoint-status-decks`
  - `pma-ai-excel-formulas`

  These topics have only 1 verified video:
  - `pma-follow-ups-ownership`
  - `pma-to-cc-bcc-reply-all`
  - `pma-writing-for-non-native-readers`
  - `pma-keka-psa-invoices`
  - `pma-linking-tickets-to-prs`
  - `pma-sdlc-phases`
- **Weaker videos to replace if better ones turn up:**
  - `pma-handover-support-sla`: Metroun Quantity Surveying's generic SLA explainer and
    Martisz on maintenance agreements.
  - `pma-bench-skill-matrix`: generic skill-matrix-in-Excel and an Indian-IT "bench" explainer.
  - `pma-pre-release-questions`: TutorialsPoint and Server Gyan release-management clips.
    Nothing PM-facing from GitHub or Atlassian was found.
  - `pma-app-store-play-review`: independent developers. Neither Apple nor Google has a
    short official "review times" video.
- **Agency-specific content has no external source.** Fixed-bid vs T&M change-request
  wording, white-label reseller dynamics, Oyelabs' own SLA tiers and India-to-US/UK/AU
  time-zone overlap rules have to be written in-house. The refs above give the generic
  frameworks only.
- **Sources found but dropped as off-target after review:**
  - Scoro "utilization rate" now redirects to Scoro's product homepage.
  - Microsoft Create "project tracker templates" redirects to the M365 Copilot create page.
  - IBM "scalability" redirects to the IBM Think topic index.
  - GOV.UK "Writing for GOV.UK" resolves to a JS redirect page.
  - The Atlassian scope-creep page returns 200 with an empty title.
- **Not used.** The Development That Pays, Atlassian and ProjectManager channels were
  used where they had a matching video. No suitable "Microsoft 365" official videos were
  found for Excel or Word basics; Kevin Stratvert, Leila Gharani and LearnFree cover those
  instead.

## Spreadsheet formula engine for grading cells (browser and Node)

Checked 2026-10-02 with `npm view <pkg> license version time.modified dist.unpackedSize`,
`api.npmjs.org/downloads/point/last-week`, GitHub repo metadata and LICENSE files. Each
package was then installed and run against the same 4-row PM sheet with
`IF, AVERAGE, COUNTIF, SUMIF, SUMIFS, XLOOKUP, NETWORKDAYS, SUM` and real `A2:A4` range
references.

| Package | Licence (npm / repo) | Latest / last publish | Weekly downloads | Unpacked / browser min (gzip) | Our function test | Notes |
|---|---|---|---|---|---|---|
| `fast-formula-parser` | MIT / MIT | 1.0.19, last publish 2020-11-26 (repo pushed 2025-09) | ~375k | 615 KB / 298 KB (85 KB gz) | IF, AVERAGE, COUNTIF, SUMIF, NETWORKDAYS, SUM pass. SUMIFS and XLOOKUP are "not implemented" | Real parser with `onCell` / `onRange` callbacks, so cell and range references work out of the box. Custom functions can be registered via the `functions` option. Deps: chevrotain, jstat, bessel, bahttext. |
| `hot-formula-parser` | MIT / MIT | 4.0.0, last publish 2021-01-11. **Repo archived** | ~176k | 837 KB / 181 KB (51 KB gz) | IF, AVERAGE, COUNTIF, NETWORKDAYS, SUM pass. SUMIF gave `#VALUE!`, SUMIFS gave 0, XLOOKUP gave `#NAME?` | Handsontable archived it in favour of HyperFormula. Avoid. |
| `@formulajs/formulajs` | MIT / MIT (LICENSE file; GitHub API shows NOASSERTION) | 4.6.1, published 2026-07-28 | ~474k | 2.4 MB / 143 KB (45 KB gz) | SUMIFS, COUNTIF, SUMIF, IF, AVERAGE, NETWORKDAYS pass (~400 functions). **No XLOOKUP** | A function library only: no parser and no cell references. You pass arrays yourself. |
| `hyperformula` | **GPL-3.0-only** (or commercial licence) | 3.4.0, published 2026-08-10 | ~439k | 12.9 MB / 778 KB (156 KB gz) | All 8 pass, including XLOOKUP (~420 functions) | Most complete and an actual spreadsheet engine with a dependency graph. The GPLv3 licence is the problem for an internal closed codebase unless Oyelabs buys a commercial key. |
| `formula-parser` | MIT | 2.0.1, last publish 2017-02 | ~420 | n/a | not tested | A different, unmaintained project (rkirsling). Not suitable. |

**Recommendation: `fast-formula-parser` (MIT), with `@formulajs/formulajs` (MIT) filling
the gaps.**

`fast-formula-parser` is the only permissively licensed option that parses real Excel
formula strings with A1 cell and range references. We need that to grade what the learner
typed into a cell, and it runs in both Node and the browser.

Its two gaps matter for this curriculum (SUMIFS, XLOOKUP), and both close cleanly through
its `functions` option:
- `SUMIFS: (...args) => formulajs.SUMIFS(...args.map(a => a.value.flat?.() ?? a.value))`
- A ~6-line XLOOKUP (exact match plus `if_not_found`).

Both were tested and returned correct results (`SUMIFS(...)=5`, `XLOOKUP("Raj",...)=20`,
not-found gives the fallback).

For grading, compare the computed value (with a numeric tolerance) and, optionally, check
that the formula text uses the intended function. Do not compare raw strings.

HyperFormula is the stronger engine and would be the pick if Oyelabs licenses it
commercially. Under GPLv3 it should not go into the app.
