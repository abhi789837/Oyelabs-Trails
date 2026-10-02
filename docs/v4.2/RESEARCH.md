# v4.2 research: Agency PM Processes Academy

Industry-standard sources only. No Oyelabs process material was provided (DECISIONS D1). Verified links and videos per topic are in `sources-ac.json`, `sources-b.json` and `sources-de.json`; each item carries `verifiedAt`. Typical values are labelled typical.


---

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

---

## Course B: White-label lifecycle (`pmp-b01` … `pmp-b12`), research key `b`

Researched 2026-10-02. The machine-readable sources are in `docs/v4.2/sources-b.json`: 21 topics, 81 ref slots (78 unique URLs, 3 to 4 per topic) and 60 video slots (58 unique ids).
- **Extra cited URLs.** Some URLs cited below are not in the JSON, for example the Play App Signing, transfer-criteria and Account Holder pages. They passed the same check and can be swapped into the JSON if needed.

How it was verified:
- **Links.** Each link was fetched with curl using full Chrome headers, `--http2`, a cookie jar and up to 3 retries. A link was kept only if it returned a final 200 and its `<title>` was the real page.
  - developer.android.com 302-loops to an OAuth auto-sign-in unless cookies are kept, so the cookie jar is required.
- **Videos.** Every video passed YouTube oEmbed with a 200, and each id came from YouTube's own search page.
- **Facts.** The facts below were read from the official pages (WebFetch, or a curl text dump) on the same day.
- **No Oyelabs facts.** Nothing below is an Oyelabs fact. "Typical" marks industry norms, not company policy.

### pmp-b01: What white-label means

**b01-core-vs-instance**
- **Definition.** A white-label product is made by one company and rebranded by another, so it appears to be the rebrander's own. ([Wikipedia](https://en.wikipedia.org/wiki/White-label_product))
- **Private label vs white label.** "Private label" is the retail term: goods made by one party and sold under a retailer's brand. ([Wikipedia](https://en.wikipedia.org/wiki/Private_label))
  - In everyday agency usage, "white label" means one generic product sold to many brands, and "private label" means the product is made for one brand only.
  - This is a usage convention, not a standard. Agencies use the two terms loosely.
- **Resellers and VARs.** A reseller resells without changing the product. A value-added reseller (VAR) adds features or services and resells it as a bundle. ([Wikipedia VAR](https://en.wikipedia.org/wiki/Value-added_reseller))
- **Tenancy models.** Microsoft describes three:
  - fully multitenant, where everything is shared;
  - vertically partitioned;
  - and single-tenant, with automated deployment of a separate stack per tenant.
  - The trade-offs are isolation, cost per tenant, operational load and how easily you can update. ([MS Learn tenancy models](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models))
  - AWS calls these "silo" (dedicated) and "pool" (shared). ([AWS SaaS Fundamentals](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/full-stack-silo-and-pool.html))
- **Mapping to client apps.** In a white-label mobile app business, the shared **core product** (one codebase) produces a separate **client instance** for each customer: its own branded binary, store listing, backend config and often its own database or tenant.
- **Where agencies differ.**
  - Some run one multitenant backend with a branded app per client.
  - Others deploy a full single-tenant stack per client. Isolation is higher, but so is the per-client update cost.

**b01-what-can-change**
- **Typical layers of change.**
  - Branding (name, icon, colours, fonts, splash screen).
  - Configuration (feature toggles, content, languages, currencies, payment gateway keys, domains).
  - Customisation (new code). This one changes the scope.
- **Feature toggles.** Martin Fowler classifies them as release, ops, experiment and permission toggles.
  - Per-client feature enablement is a "permission toggle", and those are long-lived.
  - Every toggle adds code paths that must be tested, so toggles are inventory with a carrying cost. ([Fowler](https://martinfowler.com/articles/feature-toggles.html))
- **Per-tenant configuration.** Microsoft's guidance covers per-tenant configuration and deployment approaches: resource-based vs config-based, and the automation each needs. ([MS Learn deployment and configuration](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/approaches/deployment-configuration))

### pmp-b02: Demo & requirement call

**b02-demo-call**
- **Discovery.** Microsoft's solution-architect training frames discovery as understanding the customer's business needs, current processes and success criteria before proposing a solution. ([MS Learn](https://learn.microsoft.com/en-us/training/modules/discover-customer-needs/))
- **GOV.UK on discovery.** It is about understanding the problem and the users, not about committing to a solution. ([GOV.UK](https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works))
- **Typical white-label demo.**
  - The PM shows the existing core product as it is.
  - They then note every request as fits out of the box, configurable, or a gap.
  - They promise nothing in the call that is not out of the box.

**b02-requirement-capture**
- **Requirements gathering.** Asana's six steps are: identify stakeholders, elicit, document, confirm, prioritise and monitor. ([Asana](https://asana.com/resources/requirements-gathering))
- **Format.** Write requirements as user stories with acceptance criteria. ([GOV.UK user stories](https://www.gov.uk/service-manual/agile-delivery/writing-user-stories), [Atlassian PRD](https://www.atlassian.com/agile/product-management/requirements))
- **White-label specifics to capture.** Writers should frame these as a checklist, not as a standard:
  - brand assets;
  - legal entity name and store accounts;
  - domains;
  - languages and currencies;
  - payment gateway and its keys;
  - SMS and email providers;
  - map API keys;
  - feature toggles on or off;
  - the gap list.

### pmp-b03: Gap analysis

**b03-ootb-config-custom**
- **Microsoft's two methods.** ([MS Learn fit-to-standard and fit-gap](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/process-focused-solution-fit-to-standard-fit-gap-analysis))
  - **Fit-to-standard** comes first. It maps the client's processes onto the standard product and meets needs "through configuration rather than creating detailed requirements based on your legacy system". Its motto is "adopt wherever possible, adapt only where justified".
  - **Fit-gap** comes second. It identifies the remaining gaps and decides how to fill each one: customise or extend, buy a partner or ISV solution, or change the process.
- **Costs of customising.** Before customising, weigh:
  - the cost of development and maintenance;
  - the impact on usability and performance;
  - the risk that a future standard release makes the customisation **redundant**.
- **Three tiers.**
  - **OOTB:** used as is.
  - **Configuration:** settings, toggles and content, with no code. It survives upgrades.
  - **Customisation:** code changes or new modules. It carries upgrade cost.
- **Where agencies differ.** The labels vary (configuration vs extension vs customisation), but the three-tier idea is universal.

**b03-estimating-billing-gaps**
- **Course outcomes.** Microsoft's "Perform fit gap analysis" module covers:
  - determining the feasibility of requirements;
  - categorising requirements;
  - refining them from proof-of-concept insights. ([MS Learn training](https://learn.microsoft.com/en-us/training/modules/fit-gap-analysis/))
- **Typical agency practice.**
  - Each gap gets its own line item: estimate, price, and whether it goes into the core roadmap or stays client-only.
  - Gaps are billed as a fixed-price change request or as time and materials, on top of the licence or setup fee.
  - Some agencies give the gap away free if it goes into the core product and other clients will benefit. This is a commercial choice, so writers must not state an Oyelabs rule.

**b03-avoiding-custom-creep**
- **Microsoft's pitfalls list.**
  - Recreating legacy processes "leads to costly and unnecessary customizations that require more design, coding, testing, training, and documentation".
  - Heavy customisation also reduces your access to standard documentation and support. (Same MS Learn page as above.)
- **Scope creep.** Uncontrolled growth in scope after the project starts. ([Atlassian](https://www.atlassian.com/work-management/project-management/scope-creep), [Wikipedia](https://en.wikipedia.org/wiki/Scope_creep))

### pmp-b04: Collecting the brand kit

The official asset specs are below. The full listing specs are in b08.
- **Apple app icon.** Apple's HIG covers the icon, including the 1024×1024 App Store icon and layered or dark/tinted variants. ([Apple HIG app icons](https://developer.apple.com/design/human-interface-guidelines/app-icons))
- **Google Play icon.** 512×512, 32-bit PNG with alpha, 1024 KB maximum. ([Play preview assets](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en), [Google Play icon spec](https://developer.android.com/distribute/google-play/resources/icon-design-specifications))
- **Android launcher icon.** Uses adaptive icons, built from foreground and background layers. ([Adaptive icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive))
- **Feature graphic.** 1024×500, JPEG or 24-bit PNG with no alpha. ([Play](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en))
- **Colour.** Material 3 builds colour roles from source colours, so ask for primary, secondary and neutral, with hex values. ([M3 colour](https://m3.material.io/styles/color/system/overview))
- **Brand Kit tools.** Canva's Brand Kit holds logos, colours and fonts in one place. ([Canva help](https://www.canva.com/help/brand-kit/))
- **Typical brand-kit checklist.** This is agency practice, not a standard:
  - the logo as vector (SVG, AI or PDF) plus a PNG on a transparent background;
  - the app icon master at 1024 px;
  - hex colours;
  - font files and proof the client holds the font licence;
  - splash screen;
  - the app name and its short name;
  - the tone of voice;
  - any existing brand guidelines PDF.

### pmp-b05: Client-owned accounts

**b05-accounts-ownership**
- **Apple organisation enrolment.** ([Apple enrol](https://developer.apple.com/programs/enroll/))
  - The applicant must be a legal entity. DBAs, trade names and branches are not accepted.
  - The enrolling person needs legal binding authority.
  - You need a work email on the organisation's domain and a public, working website on that domain.
  - The **organisation's legal name becomes the seller name on the App Store**.
  - The fee is US$99 a year (local prices vary). Waivers are possible for nonprofits, education and government.
- **Domains (ICANN).**
  - The **Registered Name Holder** (the registrant) and the admin contact are the only parties who can approve a transfer. The registrant's authority wins.
  - Registrars must hand over the AuthInfo code within 5 calendar days of the registrant's request.
  - A 60-day transfer lock applies after a change of registrant, unless the registrant opted out beforehand.
  - Registrars may deny a transfer within 60 days of creation.
  - ([ICANN Transfer Policy](https://www.icann.org/resources/pages/transfer-policy-2016-06-01-en), [Registrant benefits](https://www.icann.org/resources/pages/benefits-2013-09-16-en))
  - **Teaching point.** Registering the client's domain in the agency's name creates a dispute and lock risk later.
- **Signing keys (Play App Signing).** ([Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756?hl=en))
  - Google holds the **app signing key**. The developer holds the **upload key**.
  - A lost upload key can be reset through Play Console.
  - A *self-managed* app signing key that is lost cannot be recovered.
  - Play App Signing has been required for new apps (AAB) since August 2021.

**b05-store-developer-accounts**
- **Apple D-U-N-S.** ([Apple D-U-N-S](https://developer.apple.com/help/account/membership/D-U-N-S/))
  - Required for companies. Optional for government. Not used for individuals.
  - It is free from Dun & Bradstreet.
  - D&B takes **up to 5 business days**, then Apple takes **up to 2 business days** to receive it. Typically about a week before the client can enrol.
- **Apple roles.** ([Role permissions](https://developer.apple.com/help/app-store-connect/reference/role-permissions))
  - Account Holder is the only role that can sign agreements, renew the membership or request API access.
  - Admin manages users and, on organisation teams, certificates.
  - App Manager runs app metadata, pricing and submission.
  - Other roles are Developer, Marketing, Sales, Finance and Customer Support.
  - **Typical agency setup:** the client is Account Holder, and the agency is invited as Admin or App Manager.
  - Writers should check the role table for exactly which roles may submit for review.
- **Apple Account Holder transfer.** Only the current Account Holder can transfer the role. It goes to an existing team member with legal authority, who must have 2FA and pass ID verification. ([Apple](https://developer.apple.com/help/account/access/transfer-the-account-holder-role/))
- **Google Play accounts.** ([Play account info](https://support.google.com/googleplay/android-developer/answer/13628312?hl=en))
  - Organisation accounts need a D-U-N-S number, which Google says "can take up to 30 days" to get.
  - They also need an organisation website, a verified email and a verified phone number.
  - Personal accounts created after 13 Nov 2023 must run a closed test with **at least 12 testers opted in for 14 consecutive days** before they can apply for production access. ([Play testing requirement](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en))
  - **Teaching point:** clients should open an *organisation* account.
- **Play users and permissions.** ([Play users and permissions](https://support.google.com/googleplay/android-developer/answer/9844686?hl=en))
  - The account owner is the first registered account, and only the owner controls the Payments settings.
  - Admin has all permissions.
  - Permissions can be set for the whole account or per app, for example "Release to production", "Manage store presence" and "View financial data".
- **App transfer, Apple.** ([criteria](https://developer.apple.com/help/app-store-connect/transfer-an-app/app-transfer-criteria))
  - At least one version must have been released.
  - The app must not be in review or in pending states, and must not be on pre-order.
  - Both parties must have accepted the latest agreements.
  - In-app purchase product IDs must not clash with any in the recipient's account.
- **App transfer, Google Play.** ([Play transfer](https://support.google.com/googleplay/android-developer/answer/6230247?hl=en))
  - You need the registration transaction IDs of both accounts.
  - Users, ratings, reviews, subscriptions and the store listing all move across.
  - Test groups, promotions and reports do not move. Download the reports first.
  - Google support replies within 2 business days.
- **Typical recommendation.** Publish under the client's own accounts from day one. That avoids a transfer later, and it is also what Apple's guideline 4.2.6 expects (see b09).

### pmp-b06: Configuration & custom modules

**b06-configuration-setup**
- **Config outside the code.** Twelve-Factor says to store config in the environment, kept strictly apart from code. ([12factor](https://12factor.net/config))
- **Android product flavors.** ([Build variants](https://developer.android.com/build/build-variants))
  - Flavors build different versions of one app.
  - Each flavor can set its own `applicationId`, plus source sets for its own resources: logos, strings, colours.
  - The flavor's source set overrides `main`.
- **iOS.** Use `.xcconfig` build configuration files and separate targets or schemes. ([Apple xcconfig](https://developer.apple.com/documentation/xcode/adding-a-build-configuration-file-to-your-project), [Apple targets](https://developer.apple.com/documentation/xcode/configuring-a-new-target-in-your-project))
- **Feature flags.** OpenFeature is a vendor-neutral standard for feature flag APIs. ([OpenFeature](https://openfeature.dev/docs/reference/intro))

**b06-custom-modules-as-crs**
- **Change control.** A change request goes through: submission, impact assessment (scope, time, cost), approval or rejection, then implementation and records. ([Asana change control](https://asana.com/resources/change-control-process), [Wikipedia Change request](https://en.wikipedia.org/wiki/Change_request))
- **Teaching point.** In a white-label project, each custom module should be a separately estimated and approved CR. The CR should state:
  - whether the module merges into the core;
  - who owns the code;
  - its upgrade cost.
  Microsoft's "extend without compromising performance" guidance supports this. ([MS Learn](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/extend-your-solution))

### pmp-b07: Rebranded builds, QA & UAT

- **TestFlight.** ([TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview))
  - Up to **100 internal testers**, who must be App Store Connect users.
  - Up to **10,000 external testers**.
  - Builds are testable for **90 days**.
  - The first build sent to external testers goes through **beta app review**.
- **Google Play testing tracks.** Internal, closed and open testing are set up in Play Console. ([Play testing](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en))
- **UAT.** ISTQB defines user acceptance testing as acceptance testing by the intended users, to decide whether to accept the system. ([ISTQB](https://glossary.istqb.org/en_US/term/user-acceptance-testing))
- **Typical rebrand QA checklist.**
  - App name, icon and splash.
  - Colours on every screen.
  - Bundle ID or applicationId.
  - Deep links and associated domains.
  - Push credentials per client.
  - Payment keys in live mode.
  - Legal URLs (privacy policy and terms).
  - The support email.
  - No other client's or the demo brand's strings or assets left in.

### pmp-b08: Store listing preparation

**b08-listing-assets**
- **Apple screenshots.** ([Screenshot specs](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications))
  - 1 to 10 per device size, in JPEG or PNG with no alpha.
  - The **6.9" iPhone size is required**, for example 1320×2868 portrait. 6.5" screenshots are the fallback, for example 1284×2778.
  - **13" iPad** screenshots are required if the app runs on iPad, for example 2064×2752.
- **Apple text fields.**
  - Name is 2 to 30 characters. Subtitle is up to 30.
  - **Bundle ID cannot change after a build is uploaded.**
  - SKU cannot change after the app is added.
  - ([App information](https://developer.apple.com/help/app-store-connect/reference/app-information))
  - Description is up to 4000 characters. Keywords are 100 bytes. Promotional text is up to 170 characters.
  - App previews: up to 3 per localisation per device size.
  - App Review notes are up to 4000 bytes.
  - A sign-in demo account is required if the app has a login.
  - ([Platform version info](https://developer.apple.com/help/app-store-connect/reference/platform-version-information))
- **Google Play listing.** ([Play preview assets](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en))
  - App name up to 30 characters, short description up to 80, full description up to 4000. ([Play create app](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en))
  - Screenshots: at least 2, between 320 and 3840 px, with the long side no more than 2× the short side.
  - For "high-quality" eligibility you need 4 or more at 1080 px or above.
  - Feature graphic 1024×500. Icon 512×512.
  - The preview video is a YouTube URL.
- **Package names are permanent.** "Package names can't be deleted or re-used." (Same Play create-app page.)
- **Changing the applicationId.** Google says to never change it after publishing. "Google Play Store treats the upload as a completely different app." ([Configure app module](https://developer.android.com/build/configure-app-module))
- **Teaching point.** Fix each client's bundle ID and package name, using the client's reverse domain (`com.clientbrand.app`), *before* the first upload.

**b08-privacy-review-guidelines**
- **Apple 5.1.1(i).** Every app must link its privacy policy both in App Store Connect and inside the app. The policy must:
  - list the data collected and how it is used;
  - confirm that third parties give equal protection;
  - explain retention, deletion and how users revoke consent.
  ([Guidelines](https://developer.apple.com/app-store/review/guidelines/))
- **Apple App Privacy details.** ([App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/))
  - Required for new apps and updates.
  - They must include data collected by **third-party SDKs**.
  - Disclosure is optional only if all four of Apple's optional-disclosure criteria are met.
  - They can be updated without a new build, and the developer is responsible for keeping them accurate.
- **Apple privacy manifests.** These declare required-reason APIs and SDK data use. ([Privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files))
- **Google Data safety form.** ([Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en))
  - Required for *all* published apps, including those on closed and open tracks, and even apps that collect no data.
  - A privacy policy is mandatory.
  - The developer is responsible for third-party SDK data.
  - Google's review "is not designed to verify" the declarations. Inaccuracy can lead to blocked updates or removal.
  - Related: the [User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en).
- **White-label point.** The client is the data controller and publisher, so each client needs its own privacy policy URL and its own declarations. Copying another client's declarations is risky if the SDKs differ.

### pmp-b09: Submission, rejection & resubmission

**b09-submission**
- **Apple review time.** "On average, 90% of submissions are reviewed in less than 24 hours." ([Apple App Review](https://developer.apple.com/distribute/app-review/))
  - Complex apps or repeat violations take longer.
  - An **expedited review** can be requested for critical bug fixes or event-tied launches.
  - Once released, an app can take **up to 24 hours** to appear on all storefronts. (Guidelines, "After You Submit".)
  - **Typical:** plan for 1 to 3 days, including one possible rejection cycle.
- **Google review time.** "For certain developer accounts… review times of up to seven days or longer in exceptional cases." ([Publish your app](https://support.google.com/googleplay/android-developer/answer/9859751?hl=en))
  - Managed publishing lets you control when approved changes go live.
  - Provide app access instructions (up to 5 sets) for any login-gated parts. ([Prepare for review](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en))
  - **Typical:** a few days. New accounts and first releases take longer.
- **Guideline 2.1(a).** Submit final builds with no placeholder content. Include demo account details and "turn on your back-end service". (Guidelines.)

**b09-rejections** (this matters a lot for white-label)
- **Apple 4.2.6, quoted.** "Apps created from a commercialized template or app generation service will be rejected unless they are submitted directly by the provider of the app's content. These services should not submit apps on behalf of their clients and should offer tools that let their clients create customized, innovative apps that provide unique customer experiences. Another acceptable option for template providers is to create a single binary to host all client content in an aggregated or 'picker' model…" ([Guidelines](https://developer.apple.com/app-store/review/guidelines/))
  - **Practical consequence:** each white-label app should be submitted from the *client's own* developer account, as the content provider, and should be meaningfully customised.
- **Apple 4.3(a) Spam.** Don't create multiple Bundle IDs of the same app. Consider a single app with variations instead.
- **Apple 4.3(b) Spam.** Don't submit apps that are indistinguishable from apps already widely available. (Guidelines.)
  - These are the usual rejections for near-identical white-label clones.
- **Apple 5.2.** Apps must be submitted by the person or legal entity that owns or has licensed the IP. (Guidelines.)
- **Google Play Spam policy, Repetitive Content.** It disallows "creating multiple apps with highly similar functionality, content, and user experience". It suggests aggregating small apps into one. Webview apps of a site are not allowed without the site owner's permission. ([Play Spam](https://support.google.com/googleplay/android-developer/answer/9899034?hl=en))
- **Handling a rejection, Apple.** ("After You Submit" in the guidelines, plus [Reply to App Review messages](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/reply-to-app-review-messages) and [statuses](https://developer.apple.com/help/app-store-connect/reference/app-and-submission-statuses))
  - Reply to App Review in App Store Connect. This is the old "Resolution Center".
  - If you disagree, submit an appeal.
  - **Bug-fix submissions** for apps already live are not delayed over guideline issues, except legal or safety issues. Ask for this in your reply and fix the issue in the next submission.
  - Repeated rejections for the same guideline make later reviews longer.
- **Google policy status.** Check it in Play Console. ([Policy status](https://support.google.com/googleplay/android-developer/answer/9842754?hl=en))

### pmp-b10: Go-live, licence & support plan

- **Apple phased release (updates only).**
  - The schedule is day 1 1%, day 2 2%, day 3 5%, day 4 10%, day 5 20%, day 6 50%, day 7 100%.
  - You can pause for up to 30 days in total.
  - Anyone can still download the update manually. ([Phased release](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases))
- **Google staged rollout.**
  - You set a percentage, and it does not increase on its own.
  - You can increase or halt the rollout.
  - It is **not available for the first release**. ([Staged rollouts](https://support.google.com/googleplay/android-developer/answer/6346149?hl=en))
- **Pricing models.** Microsoft lists:
  - consumption;
  - per-user;
  - per-active-user (MAU);
  - per-unit (for example per store or device);
  - feature or service-level tiers, where tiers can carry different SLAs such as 99.9% vs 99.99%;
  - freemium;
  - cost of goods sold;
  - flat-rate, which is easy to sell but becomes unprofitable with heavy users.
  - It also recommends usage limits and discounted non-production environments, and warns about "bill shock" when changing models. ([MS Learn pricing models](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/pricing-models), [Stripe](https://stripe.com/resources/more/saas-pricing-models-101))
- **Typical white-label commercial shapes.** Agencies differ widely here. Writers should present these as options, not as Oyelabs policy:
  - a one-time setup or licence fee plus an annual or monthly licence or subscription;
  - a perpetual licence plus an annual maintenance contract (AMC);
  - a revenue share;
  - or source-code purchase, where a source-code escrow may protect a client on a non-source licence. ([Escrow](https://en.wikipedia.org/wiki/Source_code_escrow))
- **SLAs** define response and resolution targets per severity. ([Atlassian SLA](https://www.atlassian.com/itsm/service-request-management/slas))

### pmp-b11: Core product upgrades

**b11-version-sync**
- **Microsoft on updating tenants.** ([MS Learn updates](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/updates))
  - Decide "how many versions… can you reasonably maintain". A hotfix may have to be applied to every version in use.
  - If tenants may defer updates, allow a temporary opt-out but not a permanent one, with a deadline.
  - Roll out with deployment stamps, feature flags and **deployment rings** (canary, early adopter, users).
  - Support teams must know which version each tenant is running.
- **Forks.** GitHub's fork-sync docs show the mechanics of pulling upstream changes into a fork. ([Syncing a fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork))
- **SemVer.** MAJOR means breaking, MINOR means compatible features, PATCH means fixes. Use it to tell clients what an upgrade means. ([semver.org](https://semver.org/))

**b11-customisation-debt**
- **How conflicts arise.** Merge conflicts happen when the same lines, or a deleted file, are changed on both sides. ([GitHub](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/about-merge-conflicts))
  - The longer a client fork diverges from the core, the more conflicts each core release brings.
- **Mitigations.**
  - Branch by Abstraction, to keep changes behind interfaces. ([Fowler](https://martinfowler.com/bliki/BranchByAbstraction.html))
  - `git rerere`, to reuse recorded conflict resolutions. ([git-rerere](https://git-scm.com/docs/git-rerere))
  - Configuration and flags instead of forks.
  - ([Fowler branching patterns](https://martinfowler.com/articles/branching-patterns.html), [Technical Debt](https://martinfowler.com/bliki/TechnicalDebt.html))
- **Microsoft's warning.** Customisations can become redundant once a standard release covers the need. (MS Learn fit-gap page.)
- **Teaching point.** Every per-client code fork multiplies the cost of each core upgrade, so it is a debt to be priced in the CR.

### pmp-b12: Running many white-label clients

- **fastlane.**
  - `match` shares code-signing certificates and profiles across a team through a private repo or storage.
  - `deliver` uploads App Store metadata and screenshots.
  - `supply` uploads Google Play metadata, binaries and screenshots.
  - Together they make per-client listings repeatable. ([match](https://docs.fastlane.tools/actions/match/), [deliver](https://docs.fastlane.tools/actions/deliver/), [supply](https://docs.fastlane.tools/actions/supply/))
- **CI matrix builds.** One workflow can build every client flavor. ([GitHub Actions matrix](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations))
- **Tenant life cycle.** Covers onboarding, updates, moving between tiers and offboarding, including data retention when a client leaves. ([MS Learn tenant life cycle](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenant-life-cycle))
- **Typical portfolio artefacts.** These are agency practice:
  - a client register: accounts and owners, bundle IDs, versions, licence renewal dates, flags on or off, and custom modules;
  - a per-client config repo or folder;
  - standard listing and privacy templates;
  - a release calendar using rings.

### Thin spots and blockers
- **Thin topics.**
  - b03-estimating-billing-gaps has 2 videos, and both are ERP fit-gap videos.
  - b05-accounts-ownership has 2 videos.
  - b06-configuration-setup has 2 videos.
- **Gaps in official coverage.**
  - No official source on "demo call" technique was found. That topic uses MS Learn discovery, GOV.UK discovery and Gong.
  - No video specifically on guideline 4.2.6 was found. b09 uses 4.3 spam-rejection videos.
- **Blocked sites.**
  - w3.org WAI and indeed.com were behind a Cloudflare challenge (403).
  - pmi.org returned an empty or challenge title, so it was dropped.
  - ServiceNow docs is an SPA where every path returns 200, so it was unverifiable and dropped.
  - developer.android.com needs a cookie jar to get past an OAuth redirect loop.
  - Two video ids had embedding disabled (oEmbed 401) and were dropped: `p-EtEFTRqgQ`, `VsyTdasKINE`.

---

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
