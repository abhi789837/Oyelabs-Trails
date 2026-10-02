# v4.2 research, part `ac`: Course A (custom lifecycle) and Course C (terminology)

Researched 2026-10-02. Sources are in `docs/v4.2/sources-ac.json` (`module -> topics -> refs[] / videos[]`).
Topic ids in the JSON are written in full as `pmp-a00-lifecycle-map`. That is the module id plus the slug from PLAN.md, following its "Topic id = `<module>-<slug>`" rule.

Coverage: 24 modules and 64 topics. There are 253 ref slots (180 unique URLs) and 180 video slots (169 unique ids). Every topic has 3–4 refs, at least one of them `docs` or `spec`. Every topic has 2–3 videos, except where noted under "Thin spots".

## How it was verified

The method is the same as v4.1 (see `docs/v4.1/PM_RESEARCH.md`).

### Refs

- **Fetching.** Every URL was fetched with Git's curl: `-L --http2 --compressed`, a full Chrome 140 User-Agent, `Accept`, `Accept-Language`, `Sec-Fetch-*` and `sec-ch-ua` headers. It ran 4 requests in parallel with up to 3 retries.
- **Kept only when** the final status was 200 and the `<title>` was the real page.
- **Redirects.** Where a URL redirected to a real page, the JSON stores the final canonical URL.
- **Rejected.** Each of these returned 200 but was not a real page:
  - Atlassian pages whose title came back as just " | Atlassian". These are soft 404s.
  - APM pages titled "404".
  - IBM `think/topics/*` URLs that redirect to the topic index.
  - A Figma help id that now points to a different article.
  - `gov.uk/copyright/commissioning-work`, which redirects to the copyright overview.
  - HubSpot's agency post, which redirects to the blog home.

### Videos

- **Candidates** came from YouTube's own search page, via `scripts/research/yt.mjs search`.
- **Check.** Each id then had to pass `oembed()` with a 200. `title` and `channel` are copied from oEmbed.
- **Dropped.** One id was dropped: `p-EtEFTRqgQ` (single vs multi-tenant) returned 401, which means embedding is disabled.

`verifiedAt` is the UTC time of the successful check.

### Sites that blocked or could not be verified

| Site | Result | Effect |
|---|---|---|
| `agilealliance.org` glossary and `scrum.org` resources | HTTP 202 bot challenge every time, even with Chrome headers | Not used. The Scrum Guide (scrumguides.org) and Atlassian cover the same ground. |
| `contractscounsel.com` | Connection refused (curl 000) | Not used. |
| `developer.android.com/studio/publish/versioning` | Redirected to a Google OAuth error page | Not used. Apple `CFBundleShortVersionString` and SemVer cover versioning. |
| `glossary.istqb.org` | Single-page app: every term URL returns the same shell titled "ISTQB Glossary", so deep links cannot be confirmed | Only the glossary home is used, labelled "search: severity, priority…". |
| `iso.org` | 200 with curl, but WebFetch gets a 403 | The standard pages are used as `spec` refs. Their abstracts could not be read in full. |
| `pmi.org` | Works with Chrome headers | Some library articles return a blank title and were dropped. |

## Key facts per topic (for writers)

Labels used below:

- **(official):** quoted from the source.
- **(typical):** a common industry value.
- **(varies):** agencies and contracts differ.

None of this describes Oyelabs' own process.

### pmp-a00 Lifecycle at a glance

- **(official) Phases.** A delivery runs through discovery, then alpha, beta and live, and the service is eventually retired. Discovery has "no set time period … but around 4 to 8 weeks is typical." https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works
- **(official) Choosing a method.** Microsoft's Dynamics 365 implementation guide frames method choice (waterfall, agile or hybrid) as a project decision, and runs Initiate → Implement → Prepare → Operate. https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/implementation-strategy-choose-methodology
- **(varies) Shape of the lifecycle.** Fixed-bid agencies usually run a gated, waterfall-like outer lifecycle around agile sprints: sign-off gates at requirements, design, UAT and go-live. T&M or dedicated-team clients often skip the formal gates.
- **RACI.** R = does the work, A = the single owner who signs off, C = consulted, I = informed. Use exactly one A per row. https://www.atlassian.com/work-management/project-management/raci-chart

### pmp-a01 BD handover

- **Typical handover contents.** Scope and deliverables, timeline and milestones, financial structure, documented assumptions and constraints. Add the "soft" context too: client sensitivities and what went wrong with past vendors. https://birdviewpsa.com/blog/sales-to-delivery-handoff-checklist-consulting/ and https://www.copper.com/resources/sales-delivery-playbook
- **MSA vs SOW.**
  - The MSA holds the standing legal terms: IP, liability, warranty, confidentiality, payment terms, governing law.
  - Each SOW holds one engagement's scope, deliverables, timeline, acceptance and fees.
  - If the two conflict, the order-of-precedence clause decides. That clause varies by contract.
  - Sources: https://ironcladapp.com/journal/contracts/msa-vs-sow and the UK government's Model Services Contract https://www.gov.uk/government/collections/model-services-contract
- **Risky assumptions.**
  - Log them in a RAID log, where an assumption is something believed true but not verified. https://asana.com/resources/raid-log
  - Run a pre-mortem to surface them. https://www.atlassian.com/team-playbook/plays/pre-mortem

### pmp-a02 Estimation and commercial models

- **(official, US FAR) Firm-fixed-price.** "Not subject to any adjustment on the basis of the contractor's cost experience". The contractor carries the cost risk. https://www.acquisition.gov/far/16.202-1
- **(official, US FAR) Time-and-materials.**
  - "May be used only when it is not possible … to estimate accurately the extent or duration of the work."
  - It must include "a ceiling price that the contractor exceeds at its own risk."
  - It "provides no positive profit incentive … for cost control", so the buyer must oversee it.
  - Source: https://www.acquisition.gov/far/16.601
- **(typical) Agency models.**
  - Fixed bid: the agency holds the scope risk, and change requests are the pressure valve.
  - T&M: the client holds the risk. Often paired with a not-to-exceed cap that mirrors the FAR ceiling.
  - Retainer: a recurring fee for reserved capacity, often use-it-or-lose-it. https://www.investopedia.com/terms/r/retainer-fee.asp
  - Dedicated team: monthly per-head billing.
  - Milestone billing: payments released on accepted deliverables.
- **(official) Milestone billing.** In Microsoft Project Operations, a fixed-price contract line bills on milestones, either on completion or on a progress percentage. A milestone becomes "ready to invoice" only when marked so. https://learn.microsoft.com/en-us/dynamics365/project-operations/pro/sales/invoice-schedules-contract-line-sales
- **(varies) Milestone splits.** A common pattern is an advance at signing, payments tied to design, UAT or go-live, and sometimes a holdback until warranty ends. There is no authoritative standard split. Writers should present it as an example, not a norm.
- **Estimation.**
  - Story points are relative sizes, often on a modified Fibonacci scale. https://www.atlassian.com/agile/project-management/estimation
  - Planning Poker: https://www.mountaingoatsoftware.com/agile/story-points/planning-poker
  - Cone of uncertainty: early estimates commonly range from 0.25x to 4x and narrow as decisions are made. https://www.construx.com/books/the-cone-of-uncertainty/

### pmp-a03/a04 Kickoffs and governance

- **Kickoff plays.** Atlassian's kickoff play covers agenda, roles, scope and success criteria. The working-agreements play captures team norms. https://www.atlassian.com/team-playbook/plays/project-kickoff
- **(official) Governance (GOV.UK).** Governance should be proportionate, lean on observation of the team over reports, and trust the team. https://www.gov.uk/service-manual/agile-delivery/governance-principles-for-agile-service-delivery
- **Accountable sponsor.** The UK senior responsible owner (SRO) role is the reference model for an accountable sponsor. https://www.gov.uk/government/publications/the-role-of-the-senior-responsible-owner
- **Environments.** The Twelve-Factor dev/prod parity factor says to keep the time, personnel and tools gaps between dev and production small. https://12factor.net/dev-prod-parity

### pmp-a05 Discovery and requirements

- **(official, GOV.UK) User stories.** Use the format "As a … I need/want … so that …" with acceptance criteria. https://www.gov.uk/service-manual/agile-delivery/writing-user-stories
- **Given-When-Then.** It comes from BDD (Fowler). https://martinfowler.com/bliki/GivenWhenThen.html
- **Freeze and sign-off.**
  - The approved scope becomes the scope baseline. After that, changes go through change control. https://www.apm.org.uk/resources/what-is-project-management/what-is-change-control/
  - The PMI Lexicon defines baseline, change control and scope creep. https://www.pmi.org/standards/lexicon

### pmp-a06 Design approval

- **Prototype fidelity.** Low- and high-fidelity prototypes serve different review purposes. https://www.nngroup.com/articles/ux-prototype-hi-lo-fidelity/
- **Developer handoff.** Figma Dev Mode is the handoff surface. https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode
- **Platform conventions.** Clients often ask for things the iOS Human Interface Guidelines and Material Design advise against. Cite the platform guidelines in those discussions.
- **(varies) Review rounds.** The number of design revision rounds per screen set (commonly 2–3) is a contract term, not an industry standard.

### pmp-a07 Sprint 0 and ADRs

- **(official) Scrum Guide terms.** The Scrum Guide does not contain "Sprint 0", "Definition of Ready" or "acceptance criteria". They are common practice, not Scrum. https://scrumguides.org/scrum-guide.html
- **ADRs.** One record per significant decision, holding context, decision and consequences.
  - https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record
  - Nygard's original post: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions

### pmp-a08 Sprint execution

**(official) Scrum Guide timeboxes:**

| Event | Timebox |
|---|---|
| Sprint | One month or less |
| Sprint Planning | At most 8 hours for a one-month sprint |
| Daily Scrum | 15 minutes |
| Sprint Review | At most 4 hours for a one-month sprint |
| Retrospective | At most 3 hours for a one-month sprint |

Shorter sprints are usually given shorter timeboxes. Also from the Scrum Guide: "Work cannot be considered part of an Increment unless it meets the Definition of Done."

### pmp-a09 Scope control

- **(official, Azure Boards) Bug vs work item.** A bug is a defect against agreed behaviour and carries Severity and Priority fields. New behaviour is a story or feature. https://learn.microsoft.com/en-us/azure/devops/boards/backlogs/manage-bugs?view=azure-devops
- **ITIL change types.** Standard changes are low-risk and pre-approved. Normal changes are assessed. Emergency changes are expedited. https://www.atlassian.com/itsm/change-management/types
- **(varies) Enhancement vs CR.** Agencies differ on whether an "enhancement" to agreed behaviour is free inside a fixed bid or a billable CR. The SOW definition decides.
- **Re-baselining.** Re-baseline only after an approved change, never to hide a slip. Use a trade-off analysis (scope, time, cost) to choose. https://www.atlassian.com/team-playbook/plays/trade-offs

### pmp-a10 QA vs UAT

- **(official, Dynamics 365 guide) Before go-live.** UAT, SIT and performance testing must be completed and signed off. https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/prepare-go-live-checklist
- **Practise support during UAT.** Run the formal support process during UAT to rehearse the post-go-live flow. https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/transition-to-support-operations
- **(typical) Who owns which.** QA is run by the vendor against the requirements. UAT is run by the client's business users against their business needs, and ends in written acceptance.

### pmp-a11 Go-live

- **(official, Dynamics 365 cutover guide) The cutover window.** Often a "cutover weekend" because it's "usually less than 48 hours."
- **(official) The cutover plan** includes, per task, owner and backup owner, instructions, verification and sign-off, plus a rollback plan.
- **(official) Rehearse it.** Run a mock cutover (dress rehearsal) several times beforehand.
- **(official) Go/no-go.** Takes place at a meeting against agreed criteria, such as how many bugs are acceptable.
- Cutover source: https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/prepare-go-live-cutover-strategy
- **Rollback patterns.**
  - Blue-green: https://martinfowler.com/bliki/BlueGreenDeployment.html
  - Canary releases: https://sre.google/workbook/canarying-releases/
  - Safe deployment practices: https://learn.microsoft.com/en-us/azure/well-architected/operational-excellence/safe-deployments
- **(official, Apple) Store review.**
  - Review time: "On average, 90% of submissions are reviewed in less than 24 hours." Expedited review is available for critical bug fixes or events. https://developer.apple.com/distribute/app-review/
  - Guideline 2.1: include demo account info, and turn on the backend, if the app has a login. https://developer.apple.com/app-store/review/guidelines/
- **(official, Apple) Phased release.**
  - Runs over 7 days: 1%, 2%, 5%, 10%, 20%, 50%, then 100%.
  - It can be paused for up to 30 days in total.
  - Anyone can still download the update manually.
  - Source: https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases
- **(official, Google Play) Store review.**
  - Review takes "up to 7 days or longer in exceptional cases" for certain accounts and apps.
  - Managed publishing controls when an approved update goes live.
  - Source: https://support.google.com/googleplay/android-developer/answer/9859751
- **(official, Google Play) Testing requirement for new accounts.** Personal developer accounts created after 13 Nov 2023 must run a closed test with at least 12 testers, opted in continuously for 14 days, before applying for production. https://support.google.com/googleplay/android-developer/answer/14151465
- **(official, Google Play) Staged rollouts.** These apply only to updates, not to a first release. https://support.google.com/googleplay/android-developer/answer/6346149

### pmp-a12 Hypercare and warranty

- **(official, Dynamics 365 guide) Hypercare** is "a short period after go-live when you provide extra resources and attention." Define a clear exit strategy based on criteria, for example:
  - no critical issues,
  - SLAs met,
  - the support team resolving most issues without help.

  Source: https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/transition-to-support-operations
- **(typical, unsourced) Duration.** Hypercare commonly lasts 2–8 weeks. No official source gives a number.
- **Warranty.** A warranty is a contractual promise that the work conforms. In software service contracts it usually covers defects against the agreed spec for a fixed window after acceptance or go-live.
  - https://www.law.cornell.edu/wex/warranty
  - Warranty-clause videos: Kemp IT Law.
- **(varies) Warranty window.** Commonly 30–90 days. No authoritative source sets a standard. It is purely a contract term. Writers should say "the window your SOW defines".

### pmp-a13 Handover, KT and ownership

- **(official, Apple) App transfer.**
  - Only the Account Holder can initiate. The recipient must accept.
  - Before transfer: remove TestFlight builds and testers, and Xcode Cloud data.
  - What transfers: reviews and ratings, the bundle ID, and iCloud containers.
  - Afterwards the recipient must create a new Apple Pay merchant ID. Keychain sharing works only until the next update. Wallet passes become inactive.
  - Source: https://developer.apple.com/help/app-store-connect/transfer-an-app/overview-of-app-transfer
- **(official, Google Play) App transfer.**
  - The request needs registration transaction IDs for both accounts. Support replies "within 2 business days".
  - Users, ratings, reviews and subscriptions move with the app.
  - Test groups and Firebase/AdMob links do not move.
  - Source: https://support.google.com/googleplay/android-developer/answer/6230247
- **(official) Organisation accounts.** Apple organisation enrolment requires a D-U-N-S Number for the legal entity. Allow up to 2 business days after D&B issues it. https://developer.apple.com/help/account/membership/D-U-N-S/
- **(official) Play organisation accounts** also require a D-U-N-S number. https://support.google.com/googleplay/android-developer/answer/13628312
- **Credentials.** Rotate secrets on handover and never share them over chat or email. https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- **Repositories.** Repository transfer: https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository
- **(official, US Copyright Office) Work made for hire.** It covers employees, or commissioned works in nine listed categories with a written agreement. Contractor-built software usually falls outside those categories, so ownership passes to the client by written assignment. https://www.copyright.gov/circs/circ30.pdf
- **(varies) Ownership is jurisdiction-specific.** UK: https://www.gov.uk/intellectual-property-an-overview. Writers should not give legal advice beyond "check the IP clause".

### pmp-a14 Support, AMC and retainers

- **SLA metrics (Jira Service Management).** SLAs measure time to first response and time to resolution. SLA calendars pause the clock outside working hours. https://support.atlassian.com/jira-service-management-cloud/docs/what-are-slas/
- **Severity scales (PagerDuty).** SEV-1 is "critical … actively impacting a large number of customers". SEV-1 and SEV-2 are major incidents. https://response.pagerduty.com/before/severity_levels/
- **Maintenance standard.** Software maintenance is standardised in ISO/IEC/IEEE 14764. The usual taxonomy is corrective, adaptive, perfective and preventive.
  - The ISO abstract page could not be read to confirm the list. The Gate Smashers video teaches it.
  - https://www.iso.org/standard/80710.html
- **(varies) Support levels.** L1/L2/L3 tiers, P1–P4 response targets and AMC scope differ by agency and contract.

### pmp-a15 Closure

- **Retros.** The Scrum Guide retro and the Atlassian retrospective play: https://www.atlassian.com/team-playbook/plays/retrospective
- **Closing the service.** GOV.UK covers retiring a service. https://www.gov.uk/service-manual/agile-delivery/retiring-your-service
- **Upsell timing.** Upsell when there is data. Quarterly business reviews are a common moment. https://www.shopify.com/partners/blog/a-guide-to-growing-your-agency-by-upselling-clients

### Course C terminology anchors

- **PMI Lexicon of Project Management Terms (spec).** The single best reference for baseline, scope creep, assumption, constraint, risk vs issue, change control and the like. https://www.pmi.org/standards/lexicon
- **Severity vs priority (Azure Boards).**
  - Severity is the impact: 1 Critical, 2 High, 3 Medium (the default), 4 Low.
  - Priority is the order of fixing: 1 must fix before ship and soon, 2 must fix before ship, 3 optional.
  - Microsoft's own example: a rare crash is **Severity 2 and Priority 3**.
  - Source: https://learn.microsoft.com/en-us/azure/devops/boards/backlogs/manage-bugs?view=azure-devops
- **ITIL known error.** "A problem that has a documented root cause and a workaround". A workaround is "a temporary solution" that reduces impact. https://www.atlassian.com/itsm/problem-management
- **Response vs resolution.**
  - An SLA defines response and resolution times. https://www.atlassian.com/itsm/service-request-management/slas
  - MTTA = time to acknowledge, MTTR = time to restore or resolve. https://www.atlassian.com/incident-management/kpis/common-metrics
  - "TAT" (turnaround time) is informal agency or Indian-industry usage, with no standard definition. The writer should tie it to response or resolution explicitly.
- **SemVer.** MAJOR for incompatible changes, MINOR for backward-compatible features, PATCH for backward-compatible bug fixes. https://semver.org/
  - On iOS, `CFBundleShortVersionString` is the user-facing release version and the build number is separate.
  - Gitflow: hotfix branches come off `main` and merge back into both `main` and `develop`. https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow
- **Release vs deploy.** Deploy means the code is in an environment. Release means users can use it. Feature flags separate the two. https://martinfowler.com/articles/feature-toggles.html
- **Configuration vs customisation.** Microsoft guidance says to configure before you customise. App settings and configuration are "the safest and least disruptive". https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/extend-your-solution-scenarios
- **White-label (official Apple constraint, guideline 4.2.6).** Apps from a commercialised template or app-generation service "will be rejected unless they are submitted directly by the provider of the app's content". The alternative is a single "picker" app. This bears directly on reseller and client-owned store accounts. https://developer.apple.com/app-store/review/guidelines/
- **Tenancy.** Single-tenant vs multitenant, and the silo, pool and bridge models.
  - https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models
  - https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html
  - A fork is a separate copy of the codebase that diverges from upstream. https://docs.github.com/en/pull-requests/reference/forks
- **Scope creep vs gold plating.** Scope creep is client-driven and uncontrolled. Gold plating is team-driven and unrequested. https://pmstudycircle.com/gold-plating-vs-scope-creep/ and https://www.pmi.org/learning/library/top-five-causes-scope-creep-6675

## Thin spots

- **pmp-a02-milestone-billing.** Only 2 videos, both generic (a construction CPA, and RemotePass). There are no software-agency-specific milestone billing videos with real reach. The refs are solid (Microsoft Project Operations, GOV.UK invoicing, FAR).
- **pmp-a09-replanning.** Two of its videos are from "The Project Manager Toolkit", a low-view channel that may be AI-narrated. The third is an MS Project schedule-recovery tutorial. A better re-baselining video was not found.
- **pmp-c07-tenancy-instance-fork.** 2 videos after one embed-disabled id was dropped.
- **pmp-c02-cr-enh-bug-feature, pmp-a10-uat-signoff, pmp-a14-support-models, pmp-c08-fix-the-wrong-term, pmp-a15-retro-closure, pmp-a04-expectations-governance, pmp-a08-sprint-cadence, pmp-a01-reading-sow, pmp-a03-plan-risks-environments.** 2 videos each. All are on topic.
- **Warranty window and hypercare duration.** No authoritative "typical" number exists. Both are marked as contract or practitioner values above.
- **ISTQB deep links.** Not verifiable (single-page app). Only the glossary home is cited.
