## Courses D and E: client meetings and process templates (research key `de`)

Researched 2026-10-02. The machine-readable sources are in `docs/v4.2/sources-de.json`. It covers 8 modules and 33 topics, with 128 ref slots (105 unique URLs) and 73 video slots (72 unique ids). Every topic has 3–4 refs, at least one of them `docs` or `spec`, and 2–3 videos.

**Topic keys.** Each topic is keyed `<module>-<slug>`, with the letter prefix dropped from the PLAN slug. For example, `d-internal-kickoff` in `pmp-d01` becomes `pmp-d01-internal-kickoff`, and `e-raid-log` in `pmp-e02` becomes `pmp-e02-raid-log`. Rename the keys if the merge settles on another rule.

**How sources were verified**

- **Links.** Each link was fetched with Git's curl, using `--http2`, a full Chrome User-Agent and the `Accept*`/`Sec-Fetch-*` headers. Up to 3 attempts were made.
  - A link was kept only if it returned 200, its final URL equalled the listed URL, and its `<title>` was the real page.
  - None of the 105 kept URLs redirect.
- **Videos.** Every video id came from YouTube's own search results, through `scripts/research/yt.mjs search`. Each id then had to pass oEmbed with a 200, and `title`/`channel` were copied from the oEmbed response.

**Rejected sources**

- scrum.org and agilealliance.org answered with 202 bot challenges, so neither is used. The Scrum Guide on scrumguides.org covers the same ground.
- mindtools.com redirects to members.mindtools.com, which is a login wall.
- These returned no title, so they were not used:
  - pmi.org learning-library pages;
  - some atlassian.com/agile pages (`/project-management/requirements`, `/raci-chart`, `/release-management`).
- These redirect to a generic page and were rejected:
  - Atlassian Team Playbook slugs that no longer exist;
  - asana.com/resources/design-review.
- success.atlassian.com (hypercare guide) timed out with code 000.
- Many guessed Smartsheet, Asana and ProjectManager slugs returned 404. Only verified slugs are used.
- The ISTQB glossary is a JavaScript single-page app, so curl cannot confirm a 200 from it. It was not used.
- Video `jjcM25w6S_A` returned oEmbed 401 (embedding disabled) and was dropped.

---

### pmp-d01: Starting a project

**internal-kickoff**

- Atlassian's kickoff play takes 30 min of prep and a 90 min run, for 3–14 people. Atlassian says the meeting "establishes the project's purpose, roles, responsibilities, and success markers" ([Atlassian kickoff play](https://www.atlassian.com/team-playbook/plays/project-kickoff)).
- Before the meeting, Atlassian says to name the sponsor, the project lead, the facilitator, the core team and the stakeholders. Leadership should also draft a vision, a mission and "mission tests" (same source).
- An internal kickoff is where you run a pre-mortem. The team imagines the project has failed and lists the reasons why ([Atlassian pre-mortem play](https://www.atlassian.com/team-playbook/plays/pre-mortem)). The roles and responsibilities play makes ownership explicit ([Atlassian roles and responsibilities play](https://www.atlassian.com/team-playbook/plays/roles-and-responsibilities)).
- **Where agencies differ.** Some agencies fold the internal kickoff into the BD-to-delivery handover meeting. Others keep it separate, so the team can debate risks and estimates without the client in the room.

**client-kickoff**

- Templates share a common agenda:
  - introductions and roles;
  - goals and success criteria;
  - scope, plus what is out of scope;
  - timeline and milestones;
  - communication cadence and tools;
  - risks;
  - next steps.

  Sources: the [Confluence kickoff template](https://www.atlassian.com/software/confluence/templates/project-kickoff), [ProjectManager's kickoff agenda guide](https://www.projectmanager.com/blog/write-project-kickoff-meeting) and [Asana's kickoff guide](https://asana.com/resources/project-kickoff-meeting).
- **Typical:** 60–90 min, based on the 90 min Atlassian run time above.

**discovery-workshop**

- GOV.UK says "Around 4 to 8 weeks is typical" for discovery, and "You should not start building your service in discovery". It also says stopping after discovery is "not a failure" ([GOV.UK discovery phase](https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works)).
- Discovery outputs include a viable service idea, a view of cost-effectiveness, the wider context, testable ideas for the next phase, and the team and success metrics (same source).
- **Where agencies differ.** Agencies often sell a fixed-price paid discovery lasting 1–4 weeks, which is shorter than the GOV.UK range. A one-day requirements workshop, or JAD session, is the compressed version.

**design-review**

- NN/g recommends a facilitator role that rotates, a presenter, and an agreed scope and set of design objectives for each session ([NN/g design critiques](https://www.nngroup.com/articles/design-critiques/)).
- NN/g says feedback should be tied to user goals rather than personal taste. Its example is "How does this layout make it easier for the user to accomplish their task quickly?" in place of "Yikes… that layout!" (same source).
- NN/g warns that "commands, or directives" ruin a critique. It suggests starting with 30-minute weekly critiques (same source).
- For a client design review, a PM should record each decision as approve, revise or reject. Feedback that changes signed-off scope is a change request (CR).

### pmp-d02: Running delivery

**These Scrum Guide values are normative.** All quotes are from the [Scrum Guide](https://scrumguides.org/scrum-guide.html).

- **Sprints:** "fixed length events of one month or less".
- **Sprint Planning:** "a maximum of eight hours for a one-month Sprint". It answers three questions: "Why is this Sprint valuable?", "What can be Done this Sprint?" and "How will the chosen work get done?".
- **Daily Scrum:**
  - "a 15-minute event for the Developers of the Scrum Team", held at the same time and place every day.
  - "The Developers can select whatever structure and techniques they want". The 2020 Guide has no mandatory "three questions".
  - The PO and SM take part only if they are working on Sprint Backlog items. "The Daily Scrum is not the only time Developers are allowed to adjust their plan."
- **Sprint Review:**
  - Lasts at most 4 h for a one-month Sprint.
  - "The Scrum Team presents the results of their work to key stakeholders".
  - "a working session and the Scrum Team should avoid limiting it to a presentation".
- **Sprint Retrospective:** at most 3 h for a one-month Sprint.
- **Cancelling a Sprint:** "Only the Product Owner has the authority to cancel the Sprint."
- **Scaling the timeboxes:** shorter Sprints get proportionally shorter events. **Typical** for 2-week Sprints: about 2–4 h of planning, about 1–2 h of review and about 1–1.5 h of retro.

**Where agencies differ**

- Many agencies let the client's PO join the daily stand-up. The Guide says the stand-up is for the Developers.
- Agencies often run the client demo as a separate "sprint demo" call, rather than as the Scrum review.

**weekly-status**

- A weekly status call follows a stakeholder communications plan: who gets which update, through which channel, and how often ([Atlassian stakeholder communications play](https://www.atlassian.com/team-playbook/plays/stakeholder-communications-plan)).
- Typical content is RAG health, progress since the last update, next steps, risks and issues, and decisions needed ([Atlassian status report](https://www.atlassian.com/agile/project-management/status-report), [TeamGantt weekly status report](https://www.teamgantt.com/project-status-report-template)).
- **Typical:** 30 min, with the written report sent before or straight after the call.

**sprint-demo**

- Atlassian's Demo Trust play runs 60 min, with 30 min of prep, for 4–6 people. Its steps are to set the stage (5 min), "demo, discuss, decide" (50 min) and take a confidence vote on a 1–4 scale (5 min) ([Atlassian Demo Trust play](https://www.atlassian.com/team-playbook/plays/demo-trust)).

### pmp-d03: Hard conversations

**cr-negotiation**

- Asana gives change control 5 steps: initiation, assessment, analysis/decision, implementation and closure ([Asana change control](https://asana.com/resources/change-control-process)).
- Asana's form fields are project, date, description, requested by, change owner, priority, impact, deadline and comments (same source).
- Asana says approval sits with a change control board, but "a designated project lead can handle approvals" on smaller projects (same source). For the ITIL framing, see [Atlassian change management](https://www.atlassian.com/itsm/change-management) and [Atlassian CAB](https://www.atlassian.com/itsm/change-management/change-advisory-board).
- To negotiate, offer the client options instead of a flat "no":
  - descope something of equal size;
  - pay for the change and extend the date;
  - defer it to phase 2.

  These are the scope, time and cost trade-offs that Atlassian's play makes explicit ([Atlassian trade-offs play](https://www.atlassian.com/team-playbook/plays/trade-offs)).
- **Where agencies differ.** Some agencies allow small changes free up to a buffer, such as a set number of hours per sprint. Others raise a CR for every change.

**bad-news-delay**

- Guidance agrees on the approach:
  - tell the client early;
  - state the new date plainly;
  - give the cause without blame;
  - offer options (descope, extra resources or cost, a new date);
  - agree the next update time.

  Sources: [Hubstaff on project delays](https://hubstaff.com/blog/communicating-project-delays/), [ABA on bad news to clients](https://www.americanbar.org/groups/government_public/resources/practice-pointers/delivering-bad-news-clients/) and [HBR on stressful conversations](https://hbr.org/2001/07/taking-the-stress-out-of-stressful-conversations).
- No official standard sets a notice period for delays. Treat any number as an internal rule, not an industry fact.

**unhappy-escalation**

- An escalation policy defines levels, the people at each level, and the time before an issue moves up a level ([Atlassian escalation policies](https://www.atlassian.com/incident-management/on-call/escalation-policies)).
- ProjectManager's example matrix sets Level 1 (critical) at a 24 h resolution target and Level 2 (high) at 72 h. **Treat these as an example only** ([ProjectManager escalation matrix](https://www.projectmanager.com/blog/escalation-matrix)).
- Use [5 Whys](https://www.atlassian.com/team-playbook/plays/5-whys) for the root-cause follow-up.

**whitelabel-gap-call**

- Microsoft's "fit-to-standard / fit-gap" method has the client walk through the standard product first. Only the gaps are logged, and each gap is then marked as configure, customise, workaround or reject ([Microsoft Learn fit-gap analysis](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/process-focused-solution-fit-to-standard-fit-gap-analysis)).
- Microsoft warns that recreating legacy processes "can lead to costly and unnecessary customizations" ([Microsoft Learn fit-gap module](https://learn.microsoft.com/en-us/training/modules/fit-gap-analysis/)).
- This is the industry name for a white-label gap call. Each gap then becomes either estimated custom work (a CR) or an accepted product limitation.

### pmp-d04: Releasing & closing

**uat-walkthrough and uat-signoff**

- Microsoft's go-live checklist sets these UAT exit items ([Microsoft go-live checklist](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/prepare-go-live-checklist)):
  - "Test all requirements in scope, both 'happy path' and edge scenarios";
  - test with migrated data;
  - use the correct security roles;
  - test in an environment close to production;
  - "Get sign-off from business stakeholders on UAT".

  Any open item needs "an owner and a completion date".
- UAT acceptance is judged against acceptance criteria and the Definition of Done ([Atlassian acceptance criteria](https://www.atlassian.com/work-management/project-management/acceptance-criteria), [Atlassian Definition of Done](https://www.atlassian.com/agile/project-management/definition-of-done)).
- **Where agencies differ.**
  - The UAT window: **typical** contracts give 5–10 working days.
  - Deemed acceptance: some contracts treat silence after the window as acceptance.
  - Defect severity: some contracts let minor defects pass sign-off with a fix list.

  These are contract choices, not industry standards.

**go-no-go**

- Microsoft's cutover requires "sign-off from stakeholders at the cutover go/no-go checkpoint" ([Microsoft go-live checklist](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/prepare-go-live-checklist)).
- The Fedora meeting is a public worked example ([Fedora Go/No-Go meeting](https://fedoraproject.org/wiki/Go_No_Go_Meeting)):
  - Development, QA and Release Engineering attend.
  - The meeting is announced 3 days ahead.
  - QA approves only if validation is complete and no accepted blocker bugs remain open.
  - The decision must be unanimous. A no-go slips the release by one week.
- Other inputs are AWS Operational Readiness Reviews and the Google SRE launch checklist ([AWS ORR](https://docs.aws.amazon.com/wellarchitected/latest/operational-readiness-reviews/wa-operational-readiness-reviews.html), [Google SRE launches](https://sre.google/sre-book/reliable-product-launches/)).
  - The checklist covers capacity, failure modes and single points of failure, client behaviour, and a rollout plan with an owner for each item.

**retrospective**

- Atlassian's retrospective play is 15 min of prep and a 60 min run for 4–8 people ([Atlassian retrospective play](https://www.atlassian.com/team-playbook/plays/retrospective)). Its steps are:
  1. set the tone (5 min);
  2. gather feedback (15 min, for example with the 4 Ls: loved, loathed, learned, longed for);
  3. find insights (20 min);
  4. agree actions with owners and deadlines (15 min);
  5. close (5 min).
- An alternative format is Sad / Mad / Glad (same source).

**closure-handover**

- Microsoft says moving from project to support is "a gradual process". It should start in the Implement phase, with the support team practising on real issues during UAT ([Microsoft support operations](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/transition-to-support-operations)).
- For closure steps and checklists, see [Asana project closure](https://asana.com/resources/project-closure) and [ProjectManager project closure](https://www.projectmanager.com/blog/project-closure).

**account-review (QBR)**

- Gainsight's QBR structure is:
  - an executive summary;
  - KPIs;
  - ROI;
  - progress against previous goals;
  - benchmarking;
  - a health update;
  - actions with owners.

  It says: "try not to let the meeting go longer than an hour". Always schedule the next QBR before leaving, and avoid a templated deck that ignores the client's current goals ([Gainsight QBR guide](https://www.gainsight.com/essential-guide/quarterly-business-reviews-qbrs/)).
- A QBR fits a retained account or an AMC (annual maintenance contract) client, not a fixed-price build.

### pmp-d05: Meeting craft

**craft-demo-screenshare**

- Teams can share the whole screen, a single window, PowerPoint Live, Excel Live or Whiteboard. All quotes in this list are from [Microsoft's Teams present-content page](https://support.microsoft.com/en-us/teams/meetings/present-content-in-microsoft-teams-meetings).
- Sharing the whole screen shows notifications, so turn on Do Not Disturb or share a single window.
- To play video sound, turn on "Include sound" before sharing.
- "Give control" should go "only … to people you trust".
- Web users can share only from Chrome or the latest Edge. Linux is not supported.
- Presenter layouts are Content only, Standout, Side-by-side and Reporter.
- Teams meeting roles are organizer, co-organizer, presenter and attendee ([Microsoft Teams meeting roles](https://support.microsoft.com/en-us/teams/meetings/roles-in-microsoft-teams-meetings)).
  - Guests can be made presenters.
  - Anonymous users promoted to presenter cannot mute or remove people.
  - Attendees cannot record.

**craft-timebox-decisions**

- DACI needs exactly one Approver, "The one person (yes: one!) who makes the decision". The Driver gets the decision made by an agreed date. Contributors advise and the Informed are told afterwards ([Atlassian DACI play](https://www.atlassian.com/team-playbook/plays/daci)).
- Record each decision in a [DACI decision template](https://www.atlassian.com/software/confluence/templates/decision).
- Scrum timeboxes are maximums, not targets ([Scrum Guide](https://scrumguides.org/scrum-guide.html)).
- For the classic HBR source on chairing meetings, see [How to Run a Meeting](https://hbr.org/1976/03/how-to-run-a-meeting).

**craft-non-native**

- Microsoft's Style Guide writing tips ([Microsoft writing tips](https://learn.microsoft.com/en-us/style-guide/global-communications/writing-tips)):
  - write short, simple sentences;
  - include "that" and "who", and include articles;
  - avoid idioms, colloquial expressions and culture-specific references;
  - avoid modifier stacks;
  - use one word per concept, used consistently;
  - use only common abbreviations.
- Teams live captions ([Microsoft Teams live captions](https://support.microsoft.com/en-us/teams/meetings/use-live-captions-in-microsoft-teams-meetings)):
  - Translated captions need Teams Premium or Copilot. If the organizer has the licence, all participants can use them.
  - Teams lists 28 target languages.
  - Teams doesn't save captions, and caption data is deleted after the meeting, so captions are not a record. Send written minutes.
- Plain-language rules apply across the board ([digital.gov plain language](https://digital.gov/guides/plain-language)). [HBR's "Global Business Speaks English"](https://hbr.org/2012/05/global-business-speaks-english) covers the dynamics between native and non-native speakers.

### pmp-e01: Scope & sign-off templates

- **CR form:** use the Asana field list above, plus estimate, impact on timeline and cost, and the approver's signature and date ([Asana change control](https://asana.com/resources/change-control-process), [ProjectManager CR form](https://www.projectmanager.com/templates/change-request-form)).
- **Requirement sign-off:** the PRD, user stories and acceptance criteria are the artefacts being signed ([Confluence PRD template](https://www.atlassian.com/software/confluence/templates/product-requirements), [GOV.UK user stories](https://www.gov.uk/service-manual/agile-delivery/writing-user-stories)).
- **UAT sign-off:** see uat-walkthrough. Also see [Smartsheet sign-off templates](https://www.smartsheet.com/content/project-sign-off-templates).
- **Kickoff agenda:** see client-kickoff.

### pmp-e02: Running-the-project templates

**MoM**

- Typical minutes record attendees, decisions, and action items with an owner and a due date ([Confluence meeting notes](https://www.atlassian.com/software/confluence/templates/meeting-notes), [Asana meeting minutes](https://asana.com/templates/meeting-minutes)).
- Teams can hold meeting notes ([Microsoft Teams meeting notes](https://support.microsoft.com/en-us/teams/meetings/take-meeting-notes-in-microsoft-teams)).

**RAG status report**

- ProjectManager defines the colours this way ([ProjectManager RAG status](https://www.projectmanager.com/blog/rag-status)):
  - Green means at or above target.
  - Amber means "within 10 percent" of target and still deliverable within approved tolerances.
  - Red means worse than that.
- ProjectManager says the Amber band can be 5% or up to 20% (same source). **Typical: ±10%, but each agency sets its own thresholds.**
- Some reports add Blue for complete and Gray for not enough information (same source).

**RAID log**

- RAID stands for Risks, Assumptions or Actions, Issues, and Dependencies or Decisions. Agencies differ on what A and D stand for ([Asana RAID log](https://asana.com/resources/raid-log)).
- The columns are ID, description, category, date identified, owner, priority, status and action plan (same source).
- Asana says: "Review your RAID log during weekly status meetings" (same source).

**Escalation matrix**

- An escalation matrix sets out levels, triggers, contacts with backups, and time-to-escalate ([ProjectManager escalation matrix](https://www.projectmanager.com/blog/escalation-matrix), [PagerDuty escalation policies](https://support.pagerduty.com/main/docs/escalation-policies), [Smartsheet escalation templates](https://www.smartsheet.com/content/escalation-matrix-templates)).
- Smartsheet's examples run project contact, then PM, then account manager, then the next management level.
- All timings are examples, not standards.

### pmp-e03: Release & close templates

**Go-live checklist**

- Microsoft's checklist areas are ([Microsoft go-live checklist](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/prepare-go-live-checklist)):
  - go-live readiness;
  - cutover;
  - solution scope review;
  - solution acceptance;
  - UAT;
  - performance testing;
  - SIT;
  - data migration;
  - external dependencies;
  - change management;
  - operational support readiness.
- Every area ends in a stakeholder sign-off, and the cutover plan lists dependencies, timing, roles and verification steps (same source).
- For an app agency, add the store-specific items: store listing, review submission, production keys and analytics. These are not in the Microsoft list.

**Hypercare log**

- Microsoft defines hypercare as "a short period after go-live when you provide extra resources and attention" ([Microsoft support operations](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/transition-to-support-operations)).
- Microsoft says to define an exit strategy based on criteria. Examples are no critical issues, SLAs met, and the support team able to resolve most issues alone. Microsoft also says to set an end date and keep the project team available (same source).
- **No official length is given.** Typical industry practice is 2–6 weeks, but that figure comes from vendor blogs, not an official source. Agencies set it in the contract.
- Log entries use severity levels and SLA targets ([Atlassian severity levels](https://www.atlassian.com/incident-management/kpis/severity-levels), [Atlassian SLAs](https://www.atlassian.com/itsm/service-request-management/slas)).

**Handover/KT**

- The support team should be trained and given documentation, access and tools before hypercare ends ([Microsoft support operations](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/transition-to-support-operations)).
- Use a knowledge base for runbooks ([Atlassian knowledge base](https://www.atlassian.com/itsm/knowledge-management/what-is-a-knowledge-base)).

**White-label onboarding**

- Apple organization enrollment ([Apple Developer enrollment](https://developer.apple.com/programs/enroll/)):
  - The organization must be a legal entity. Apple does not accept DBAs or trade names.
  - The organization needs a D-U-N-S number.
  - The person enrolling needs legal binding authority.
  - The organization needs a work email on its own domain and a working public website.
  - The fee is 99 USD a year.
  - The organization's name becomes the seller name on the App Store.
- Google Play organization accounts need a D-U-N-S number, which can take up to 30 days from Dun & Bradstreet. They also need a website and contact details, plus identity verification before publishing. The fee is a one-time 25 USD ([Play Console requirements](https://support.google.com/googleplay/android-developer/answer/13628312)).
- Apple guideline 4.2.6: apps from a "commercialized template or app generation service will be rejected unless they are submitted directly by the provider of the app's content". Apple guideline 4.3 (spam) rejects multiple Bundle IDs of the same app ([Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)).
  - This is why white-label apps should be published from the client's own developer account.
- Grant the agency team access through user roles, not shared logins ([App Store Connect users](https://developer.apple.com/help/app-store-connect/manage-your-team/add-and-edit-users)).
- **Lead time:** a typical first item on the checklist is to start D-U-N-S and store enrollment in week 1.

**Closure report**

- A closure report covers outcomes against objectives, scope delivered and deferred, budget and schedule variance, lessons learned, handover status and sign-off ([Confluence lessons learned](https://www.atlassian.com/software/confluence/templates/lessons-learned), [Asana project closure](https://asana.com/resources/project-closure), [Asana lessons learned](https://asana.com/resources/lessons-learned)).

### Thin areas

- **Videos**
  - White-label onboarding has no white-label-specific video. The two used are general client onboarding videos: enterprise SaaS onboarding, and onboarding international clients.
  - The white-label gap call uses fit-gap and gap-analysis videos, one of them from an SAP context.
  - Hypercare videos are short and ERP-flavoured.
- **Refs**
  - Design review and account review have only 3 refs each.
  - Hypercare has 3 refs. No official source gives a hypercare duration.
