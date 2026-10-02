# Running Delivery research notes (2026-10-02)

Source catalogue: `docs/v4/sources-pm-bd.json` (key `pm`) and `docs/v4/RESEARCH_PM_BD.md`. Every video id was
re-checked on 2026-10-02 with `node scripts/research/yt.mjs info <id>` (oEmbed 200, `embeddable: true`); titles,
channels and durations come from that output.

## Videos
- pm-i-sprint-planning: What is Sprint Planning in Scrum? (The Agile Shop, 2:45). Short; Simplilearn (5:43) as alternate.
- pm-i-estimation-story-points-velocity: What Are Story Points in Agile? (Mountain Goat Software, 6:18). Alternates: Planning Poker Explained (5:32), Ajeet SD velocity vs capacity (6:17).
- pm-i-backlog-prioritisation: What is MoSCoW Prioritization Method? (ProductPlan, 3:27). Alternates: ProductPlan RICE (4:03), Appfire WSJF in Jira (4:03) so each framework has a video.
- pm-i-change-requests-scope-control: Project Management Scope Creep: 7 Top Tips (ProjectManager, 7:27). Alternate: Adriana Girdler (4:36).
- pm-i-raid-risk-management: How to Use RAID Log in REAL-LIFE Project (Tactical Project Manager, 7:06). Alternates: Alvin the PM (18:01), Simplilearn 2026 risk management (42:22).
- pm-i-stakeholder-mapping-raci: Stakeholder Analysis: Power/Interest Grid (AssistKD, 4:58). Alternates: TeamGantt RACI (5:08), Mike Clayton (8:48).
- pm-i-agency-commercial-models: Fixed-Price VS Time-and-Materials (Matt Brickwood, 5:47; low views but on-topic for software agencies). Alternates: Brainhub (3:43), iZenBridge PMP contract types (4:36).
- pm-i-qa-uat-coordination: What is User Acceptance Testing - UAT? (Mike Clayton, 8:03). Alternate: Thomas Ryan QA vs UAT (2:48).
- pm-i-release-management: What is Release Management? (Mike Clayton, 3:34). Only video in the catalogue; generic.
- pm-i-retrospectives: How to Facilitate the Sprint Retrospective (Scrum.org, 7:56). Only video in the catalogue.
- pm-i-managing-client-expectations: Tips for Managing Client Expectations (GoDaddy Pro, 7:18). Alternate: The Futur (7:18). Both come from creative/web agencies, not software, but the lessons transfer.

## References
Catalogue refs are used throughout. Added and verified by me (curl -L, browser UA, HTTP 200, `<title>` checked):
- `https://support.atlassian.com/jira-software-cloud/docs/what-is-a-sprint/` (sprint planning: docs ref)
- `https://support.atlassian.com/jira-software-cloud/docs/view-and-understand-the-velocity-chart/` (estimation: docs ref; the catalogue had only articles)
- `https://support.atlassian.com/jira-software-cloud/docs/what-is-a-version/` (release management: docs ref)
- `https://www.acquisition.gov/far/16.601` (commercial models: spec ref; FAR text confirmed: T&M "may be used only when it is not possible ... to estimate accurately the extent or duration of the work", with a ceiling price the contractor exceeds at its own risk)
- `https://www.gov.uk/service-manual/technology/quality-assurance-testing-your-service-regularly` (QA & UAT: docs ref; the catalogue had only two articles)
- `https://www.atlassian.com/team-playbook/plays/retrospective` (retrospectives: tagged docs)
- PMBOK overview (`pmi.org/standards/pmbok`, from the catalogue) was reused as the spec ref for change control, stakeholders and client expectations, because their catalogue refs were all articles.
- Tried and 404: `support.atlassian.com/.../what-is-estimation/`, `.../manage-versions/`, `.../plan-your-sprint/`, `atlassian.com/team-playbook/plays/raci`, `.../stakeholder-communications`, GOV.UK `show-and-tells`.
- Dropped from the catalogue to stay at 4 refs: ProjectManager T&M contract, Teamwork agency pricing models.
- agilebusiness.org and framework.scaledagile.com serve a small bot page to curl; content checked with WebFetch.

## Facts verified
- MoSCoW (agilebusiness.org via WebFetch): W = "Won't have this time"; typically no more than 60% Must Have effort, around 20% Could Have.
- RICE (Intercom via WebFetch): (Reach × Impact × Confidence) / Effort; impact 3/2/1/0.5/0.25; confidence 100/80/50%; effort in person-months.
- WSJF (SAFe via WebFetch): relative cost of delay / relative job duration; cost of delay = user and business value, time criticality, risk reduction and/or opportunity enablement. The full detail page needs a login.
- Scrum Guide 2020: Sprint Planning topics why/what/how, 8-hour max for a one-month Sprint, Developers select items, scope negotiated without affecting the Sprint Goal; Retrospective inspects individuals, interactions, processes, tools and the DoD, 3-hour max, and improvements may go into the next Sprint Backlog.

## Notes
- Milestones: pm-i-change-requests-scope-control and pm-i-agency-commercial-models, both tagged `advanced` (one level up) with 10-question quizzes.
- Practice kinds: spot (2), calculate (2), rank (2), write (3), scenario (2).
- Thin spots: release management and retrospectives each have only one video; the time-tracking/utilisation part of commercial models has no dedicated reading (Harvest is the closest); client-expectation videos come from non-software agencies.
