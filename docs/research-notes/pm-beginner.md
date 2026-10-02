# PM Foundations research notes (2026-10-02)

Source catalogue: `docs/v4/sources-pm-bd.json` (key `pm`) and `docs/v4/RESEARCH_PM_BD.md`. Every video id below
was re-checked on 2026-10-02 with `node scripts/research/yt.mjs info <id>` (oEmbed 200, `embeddable: true`);
titles and channels are copied from that output, and `durationLabel` comes from it.

## Videos
- pm-b-project-lifecycle-roles: The Project Management Life Cycle (ProjectManager, 4:14); short and covers all phases. Alternates: Adriana Girdler (5:27), Mike Clayton (4:34).
- pm-b-scope-time-cost: The Project Management Triple Constraint (ProjectManager, 2:01); only 2 minutes, so Mike Clayton's Project Planning (11:41) is the alternate for depth.
- pm-b-scrum-fundamentals: Scrum Essentials in Under 10 Minutes (Scrum Alliance, 10:16, 2023); chosen over the 2012 Axosoft video because it postdates the 2020 Guide. Alternates: David McLachlan, The Scrum Guide: FULL COURSE (48:25, 2025), and Axosoft (8:52).
- pm-b-kanban-basics: What is Kanban? Kanban Explained with a Coffee Cup (Development That Pays, 13:23). Alternate: Scrum vs Kanban (5:07).
- pm-b-user-stories-acceptance-criteria: What Is a User Story in Agile? (Mountain Goat Software, 8:52, 2025). Alternates: SPIDR splitting (8:22) and the 52-minute User Stories Explained talk.
- pm-b-jira-clickup-basics: Jira Tutorial for Beginners (Kevin Stratvert, 19:34, 2025); current UI. Alternates: Atlassian Answered (5:28), Ravi Abuvala ClickUp tutorial (15:13).
- pm-b-running-standups: Daily Scrum Explained (Mountain Goat Software, 5:06). Alternate: Mike Clayton (4:53).
- pm-b-status-reporting-client-comms: Project Management Status Reports (Adriana Girdler, 12:35). Alternate: Mike Clayton progress report (6:30).
- pm-b-requirements-gathering: How to Gather Project Requirements (Adriana Girdler, 9:55). Alternate: TeamGantt (11:29).
- pm-b-software-basics-for-pms: APIs Explained (in 4 Minutes) (Aced, 3:57). Alternates: TechWorld with Nana on Git workflows (31:32, 2026) and ByteByteGo How Git Works (4:18). No single video covers environments + APIs + Git + deployment, so the alternates fill the Git half.

## References
- All refs come from the catalogue except one I added and verified (curl -L, browser UA, HTTP 200, title checked):
  - `https://www.gov.uk/service-manual/agile-delivery/governance-principles-for-agile-service-delivery` (status reporting needed an official `docs` ref; the catalogue had only articles).
- pm-b-software-basics-for-pms has 6 catalogue refs; I used 4 (MS Learn environments, Atlassian Gitflow, AWS API, Atlassian CI/CD). Dropped: Martin Fowler branching patterns and 12factor.net/config (the summary still mentions Twelve-Factor).
- help.clickup.com returns 403 to WebFetch but 200 to curl with a browser UA; the hierarchy (Workspace, Space, optional Folder, Subfolder, List, Task, Subtask) was confirmed from the curl body.

## Facts verified
- Scrum Guide November 2020 is current (catalogue). Quiz facts used: three accountabilities; Daily Scrum 15 minutes for Developers; Sprint of one month or less; only the PO can cancel a Sprint; refinement is an ongoing activity; Sprint Review is a working session and "should never be considered a gate to releasing value"; the three questions are no longer required.
- Kanban Guide May 2025 (fetched kanbanguides.org/the-kanban-guide/2025.5/): three practices; Definition of Workflow incl. SLE (time + probability, e.g. 85% in 8 days); four mandatory flow metrics WIP, Throughput, Work Item Age, Cycle Time; improvements need not wait for a meeting and need not be small (2025 text).
- Jira Cloud docs now call tickets "work items" (support.atlassian.com, Use your Scrum backlog, via WebFetch).
- GOV.UK discovery: do not start building the service in discovery (catalogue ref).

## Notes
- Milestones: pm-b-status-reporting-client-comms and pm-b-requirements-gathering, tagged `intermediate` (one level up) with 8-question quizzes. The checker warns that milestones are usually advanced/expert; that is expected in a beginner camp.
- Practice kinds: rank (2), calculate (2), scenario (2), write (2), spot (2).
- Thin spots: the triple-constraint primary video is only 2 minutes; the status-reporting reading list is mostly vendor blogs (ProjectManager, Asana, Teamwork) apart from GOV.UK.
