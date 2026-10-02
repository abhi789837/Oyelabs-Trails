# Research: Project Management & Business Development source catalogue (Oyelearn v4)

Generated 2026-10-02. Machine-readable version: `docs/v4/sources-pm-bd.json` (same slugs, every ref and video listed with its URL).

## Totals

| Department | Topics | Verified reading refs | Verified videos |
|---|---|---|---|
| Project Management | 35 | 128 | 86 |
| Business Development | 28 | 114 | 62 |

Every topic has at least 2 verified reading refs and at least 1 verified video. Thin topics are listed under **Gaps and weak spots** below.

## How things were verified

- **Reading refs:** every URL was fetched with `curl -L` and a browser user agent, and returned **HTTP 200** at the end of the redirect chain. Each page `<title>` was then checked against its topic, which caught soft-404s and redirects to unrelated pages. Some candidate URLs redirected to a different page (for example a ProjectManager "guide" that redirected to an unrelated template, or a ClickUp article that became "Formula Fields"); those were dropped. Two pages block curl with Cloudflare but returned the real content through WebFetch: `clutch.co/developers` and `loopio.com/ultimate-rfp-response-process/`. They are marked `"method": "webfetch ..."` in the JSON.
- **Videos:** every video ID came from YouTube's own search results (`ytInitialData`), never from aggregator sites. Each one passed `https://www.youtube.com/oembed?...` with **HTTP 200**, which also proves it can be embedded. `title` and `channel` in the JSON are copied verbatim from oEmbed `title` / `author_name`. Two candidates returned **401 (embedding disabled)** and were dropped: Alex Hormozi's margin video and a HubSpot CRM clean-up video.
- **Paywalls and login walls:** HBR's "The End of Solution Sales" is truncated behind the paywall, so it was excluded. The PMI Learning Library papers used here showed full article text without logging in.

## Key facts recorded (for the PMP / PMI-ACP topic)

- **PMP Exam Content Outline 2026:** People **33%**, Process **41%**, Business Environment **26%** (previously 42% / 50% / 8%). Confirmed on pmi.org (`/certifications/project-management-pmp`, `/certifications/project-management-pmp/new-exam`) and in the ECO PDF (`/-/media/pmi/documents/public/pdf/certifications/new-pmp-examination-content-outline-2026.pdf`, titled "July 2026 PMP Certification Exam Update").
- **Effective date:** PMI says "In July 2026, we updated the PMP exam". Third-party trainers (PM Training, Learning People) cite **9 July 2026** as the cutover. The exact day does not appear on the PMI pages fetched, so writers should say "July 2026" unless they cite the trainers.
- New content in the 2026 ECO: AI, sustainability, stakeholder engagement, and a stronger focus on value and business outcomes. Eligibility is widened (apprenticeships, a 10-year window for experience).
- **PMBOK Guide 8th edition:** published November 2025 (pmi.org/standards/pmbok).
- **Scrum Guide:** the November 2020 version is still current (scrumguides.org).
- **Kanban Guide:** kanbanguides.org "The Kanban Guide (May 2025, latest)". Kanban University also publishes its own "Official Guide to The Kanban Method". The two are different lineages, and both are cited.

## Coverage: Project Management

| Topic slug | Level | Refs | Videos | Key sources |
|---|---|---|---|---|
| `pm-project-lifecycle-roles` | beginner | 4 | 3 | pmi.org, atlassian.com, gov.uk; video: ProjectManager, Adriana Girdler, Online PM Courses - Mike Clayton |
| `pm-scope-time-cost` | beginner | 3 | 2 | atlassian.com, pmi.org; video: ProjectManager, Online PM Courses - Mike Clayton |
| `pm-scrum-fundamentals` | beginner | 4 | 3 | scrumguides.org, atlassian.com, mountaingoatsoftware.com, agilemanifesto.org; video: David McLachlan, Axosoft, Scrum Alliance |
| `pm-kanban-basics` | beginner | 4 | 2 | kanbanguides.org, kanban.university, atlassian.com; video: Development That Pays |
| `pm-user-stories-acceptance-criteria` | beginner | 4 | 3 | mountaingoatsoftware.com, atlassian.com, gov.uk; video: Mountain Goat Software: Agile & Scrum Mastery |
| `pm-jira-clickup-basics` | beginner | 4 | 3 | atlassian.com, support.atlassian.com, help.clickup.com; video: Atlassian, Kevin Stratvert, Ravi Abuvala |
| `pm-running-standups` | beginner | 3 | 2 | atlassian.com, mountaingoatsoftware.com, scrumguides.org; video: Mountain Goat Software: Agile & Scrum Mastery, Online PM Courses - Mike Clayton |
| `pm-status-reporting-client-comms` | beginner | 3 | 2 | projectmanager.com, asana.com, teamwork.com; video: Adriana Girdler, Online PM Courses - Mike Clayton |
| `pm-requirements-gathering` | beginner | 3 | 2 | asana.com, projectmanager.com, gov.uk; video: Adriana Girdler, TeamGantt |
| `pm-software-basics-for-pms` | beginner | 6 | 3 | aws.amazon.com, atlassian.com, learn.microsoft.com, martinfowler.com, 12factor.net; video: Aced (formerly Exponent), TechWorld with Nana, ByteByteGo |
| `pm-sprint-planning` | intermediate | 4 | 2 | scrumguides.org, atlassian.com, mountaingoatsoftware.com; video: The Agile Shop, Simplilearn |
| `pm-estimation-story-points-velocity` | intermediate | 3 | 3 | mountaingoatsoftware.com, atlassian.com; video: Mountain Goat Software: Agile & Scrum Mastery, Ajeet SD |
| `pm-backlog-prioritisation` | intermediate | 4 | 3 | agilebusiness.org, intercom.com, framework.scaledagile.com, atlassian.com; video: ProductPlan, Monday Coffee by Appfire  |
| `pm-change-requests-scope-control` | intermediate | 3 | 2 | asana.com, projectmanager.com, atlassian.com; video: ProjectManager, Adriana Girdler |
| `pm-raid-risk-management` | intermediate | 3 | 3 | asana.com, projectmanager.com, pmi.org; video: Tactical Project Manager, Alvin the PM - Become a Certified Project Manager, Simplilearn |
| `pm-stakeholder-mapping-raci` | intermediate | 3 | 3 | atlassian.com, asana.com, projectmanager.com; video: AssistKD, TeamGantt, Online PM Courses - Mike Clayton |
| `pm-agency-commercial-models` | intermediate | 5 | 3 | projectmanager.com, getharvest.com, productive.io, teamwork.com; video: Matt Brickwood, iZenBridge Consultancy Pvt Ltd., Brainhub |
| `pm-qa-uat-coordination` | intermediate | 2 | 2 | atlassian.com, projectmanager.com; video: Online PM Courses - Mike Clayton, Thomas Ryan |
| `pm-release-management` | intermediate | 3 | 1 | atlassian.com, asana.com, martinfowler.com; video: Online PM Courses - Mike Clayton |
| `pm-retrospectives` | intermediate | 3 | 1 | scrumguides.org, atlassian.com, mountaingoatsoftware.com; video: Scrum.org |
| `pm-managing-client-expectations` | intermediate | 3 | 2 | pmi.org, projectmanager.com; video: The Futur, GoDaddy Pro |
| `pm-hybrid-delivery` | advanced | 4 | 2 | projectmanager.com, pmi.org, atlassian.com; video: Kandis Porter, Alvin the PM - Become a Certified Project Manager |
| `pm-capacity-planning` | advanced | 3 | 2 | asana.com, projectmanager.com; video: Acuity PPM, Ajeet SD |
| `pm-delivery-metrics` | advanced | 5 | 3 | atlassian.com, kanbanguides.org; video: Scrum Inc., Online PM Courses - Mike Clayton, Businessmap |
| `pm-evm-basics` | advanced | 5 | 2 | pmi.org, projectmanager.com, atlassian.com; video: Sunny Sensei, Andrew Ramdayal |
| `pm-sow-contract-management` | advanced | 4 | 2 | pmi.org, projectmanager.com, atlassian.com; video: Online PM Courses - Mike Clayton, PMPwithRay |
| `pm-escalations-difficult-conversations` | advanced | 3 | 3 | atlassian.com, pmi.org, projectmanager.com; video: Adriana Girdler, David McLachlan, Online PM Courses - Mike Clayton |
| `pm-project-recovery` | advanced | 2 | 3 | pmi.org; video: David McLachlan, ProjectManager, Adriana Girdler |
| `pm-vendor-management` | advanced | 3 | 2 | projectmanager.com, upwork.com; video: David McLachlan, Prabh Nair |
| `pm-programme-portfolio-governance` | expert | 5 | 3 | pmi.org, framework.scaledagile.com, atlassian.com; video: Online PM Courses - Mike Clayton, Psoda, iZenBridge Consultancy Pvt Ltd. |
| `pm-business-case-value-realisation` | expert | 3 | 2 | atlassian.com, asana.com, pmi.org; video: Online PM Courses - Mike Clayton, Project Management Institute (PMI) |
| `pm-ai-in-project-delivery` | expert | 5 | 3 | pmi.org, platform.claude.com, dora.dev, nist.gov; video: Project Management Institute (PMI), Claude |
| `pm-scaling-agile` | expert | 4 | 2 | framework.scaledagile.com, less.works, atlassian.com; video: Scaled Agile, Inc., LeSS for companies adapting in a fast moving world |
| `pm-pmp-acp-exam-alignment` | expert | 5 | 5 | pmi.org; video: Andrew Ramdayal, David McLachlan, Ricardo Vargas, Praizion (Leadership, Agile, PMP) |
| `pm-coaching-other-pms` | expert | 3 | 2 | pmi.org, salesforce.com; video: Online PM Courses - Mike Clayton, All Things Agile |

## Coverage: Business Development

| Topic slug | Level | Refs | Videos | Key sources |
|---|---|---|---|---|
| `bd-agency-services-offerings` | beginner | 4 | 2 | upwork.com, ibm.com, aws.amazon.com, clutch.co; video: Kieran Moloney, Sales Scripter |
| `bd-icp-personas` | beginner | 4 | 2 | gong.io, hubspot.com, blog.hubspot.com, nngroup.com; video: HubSpot Marketing |
| `bd-lead-sources` | beginner | 5 | 3 | blog.hubspot.com, gong.io, business.linkedin.com, support.upwork.com, clutch.co; video: Clutch.co, Y Combinator, Belkins |
| `bd-crm-hygiene` | beginner | 4 | 2 | salesforce.com, blog.hubspot.com, trailhead.salesforce.com; video: HubSpot Academy, Simplilearn |
| `bd-cold-email-linkedin-outreach` | beginner | 5 | 3 | blog.hubspot.com, salesforce.com, ftc.gov, ico.org.uk; video: 30 Minutes to President’s Club, lemlist |
| `bd-business-writing` | beginner | 3 | 1 | digital.gov, grammarly.com, blog.hubspot.com; video: Harvard Business Review |
| `bd-tech-literacy` | beginner | 5 | 4 | developer.mozilla.org, aws.amazon.com, atlassian.com, ibm.com; video: Y Combinator, Simply Explained, Modern Software Engineering, Mike Munroe |
| `bd-spin-discovery` | intermediate | 4 | 2 | blog.hubspot.com, gong.io, salesforce.com; video: 30 Minutes to President’s Club, Salesman․com |
| `bd-qualification-bant-meddpicc` | intermediate | 3 | 2 | meddicc.com, blog.hubspot.com; video: MEDDICC, Tech Sales With Higher Levels |
| `bd-upwork-mastery` | intermediate | 6 | 3 | support.upwork.com, upwork.com; video: Oliver, Nico Hessel, LobodaTech |
| `bd-proposals-sows` | intermediate | 4 | 2 | pmi.org, atlassian.com, blog.hubspot.com, upwork.com; video: HubSpot Marketing, 247Digitize |
| `bd-pricing-models` | intermediate | 5 | 2 | projectmanager.com, productive.io, upwork.com, investopedia.com; video: Future Dev Lab, Matt Brickwood |
| `bd-objection-handling` | intermediate | 2 | 2 | blog.hubspot.com, gong.io; video: 30 Minutes to President’s Club, Jeremy Miner |
| `bd-follow-up-cadences` | intermediate | 4 | 2 | blog.hubspot.com, gong.io, salesforce.com; video: 30 Minutes to President’s Club, Jeremy Miner |
| `bd-running-demos` | intermediate | 4 | 2 | blog.hubspot.com, gong.io; video: 30 Minutes to President’s Club, Sales Feed |
| `bd-consultative-challenger-selling` | advanced | 4 | 2 | challengerinc.com, blog.hubspot.com, salesforce.com; video: Pipedrive, Brian Tracy |
| `bd-negotiation-batna` | advanced | 4 | 3 | pon.harvard.edu; video: Erich Pommer Institut, 30 Minutes to President’s Club, Chris Voss & The Black Swan Group |
| `bd-rfp-responses` | advanced | 4 | 2 | salesforce.com, loopio.com, investopedia.com, blog.hubspot.com; video: The Futur, Visme |
| `bd-enterprise-deals-procurement` | advanced | 3 | 1 | blog.hubspot.com, meddicc.com; video: Y Combinator |
| `bd-account-management-upselling` | advanced | 3 | 2 | salesforce.com, blog.hubspot.com; video: 30 Minutes to President’s Club |
| `bd-pipeline-metrics-forecasting` | advanced | 4 | 3 | salesforce.com, blog.hubspot.com; video: 30 Minutes to President’s Club, HubSpot  |
| `bd-case-studies-social-proof` | advanced | 3 | 2 | blog.hubspot.com; video: Aaron Zakowski, Victor Antonio |
| `bd-white-label-partnerships` | advanced | 2 | 2 | investopedia.com, hubspot.com; video: 51Blocks, Conduit Digital | Scale Smarter, Not Harder |
| `bd-strategic-accounts-expansion` | expert | 4 | 2 | blog.hubspot.com; video: 30 Minutes to President’s Club, Willingness to Pay |
| `bd-pricing-strategy-margins` | expert | 6 | 2 | investopedia.com, corporatefinanceinstitute.com, blog.hubspot.com; video: Jason Swenk, Move At Pace |
| `bd-playbooks-team-leadership` | expert | 4 | 2 | salesforce.com, blog.hubspot.com, gong.io, hubspot.com; video: HubSpot Marketing, Y Combinator |
| `bd-ai-powered-bd` | expert | 5 | 2 | blog.hubspot.com, salesforce.com, platform.claude.com, nist.gov; video: 30 Minutes to President’s Club, Claude |
| `bd-contract-essentials` | expert | 6 | 3 | upcounsel.com, law.cornell.edu, copyright.gov, gov.uk; video: Malcolm Zoppi | Corporate and M&A Solicitor , Entertainment Lawyer, Rohit Pradhan - Attorney at Law |

## Gaps and weak spots

- `pm-project-recovery`: Readings are both PMI library papers (no second publisher found that resolved). Videos are solid (McLachlan, ProjectManager, Girdler).
- `pm-release-management`: Only one video (Mike Clayton, 3:34). Short and generic; writers should lean on the Atlassian and Fowler readings.
- `pm-retrospectives`: One video (Scrum.org official channel). Enough, but no second option.
- `pm-vendor-management`: Videos are procurement-oriented (PMBOK procurement overview, a vendor-risk talk). No video is specific to managing an outsourced dev vendor.
- `pm-managing-client-expectations`: Videos come from creative-agency channels (The Futur, GoDaddy Pro). The lessons transfer, but the examples are design work, not software.
- `pm-ai-in-project-delivery`: PMI hub page is mostly a landing page for PMI's CPMAI and AI courses. The Claude docs and DORA research carry the substance. PMI's own videos are verified.
- `pm-coaching-other-pms`: Main video is a 1h34 Mike Clayton webinar. The Salesforce coaching ref is from sales, used as a transferable 1:1 coaching model.
- `pm-agency-commercial-models`: Time-tracking/utilisation has no strong reading or video. The Harvest pricing article is the closest match.
- `bd-agency-services-offerings`: Generic sources only. Videos are from small agency-owner channels. Oyelabs' own offerings must be placeholders, as instructed.
- `bd-business-writing`: One video (HBR email etiquette, official HBR channel). The HBR video is free; HBR articles were not used because of the paywall.
- `bd-enterprise-deals-procurement`: One video (YC Startup School, Enterprise Sales). No dedicated procurement or security-questionnaire reading resolved cleanly; MEDDPICC 'Paper Process' covers part of it.
- `bd-white-label-partnerships`: WEAK. Readings are a definition (Investopedia) and HubSpot's partner FAQ. Videos come from small channels. Writers should treat this as a thin topic.
- `bd-strategic-accounts-expansion`: No video specifically on expanding into new regions or verticals. The videos cover key accounts and land-and-expand.
- `bd-objection-handling`: Exactly two readings (HubSpot, Gong). Videos are strong (30MPC role-plays, Jeremy Miner).
- `bd-upwork-mastery`: No official Upwork YouTube video was found. Videos are from experienced freelancer creators. The Upwork Help Center and Resources pages are official.
- `bd-contract-essentials`: No NDA-specific reading resolved (Investopedia, Cornell and GOV.UK NDA URLs all 404). NDA is covered only by a video. Content must carry a 'not legal advice' note.
- `bd-crm-hygiene`: HubSpot's 'clean your CRM' how-to videos have embedding disabled (oEmbed 401) and were dropped. The videos are a HubSpot Academy Sales Hub tutorial and a Simplilearn CRM intro.
- `bd-pricing-strategy-margins`: Alex Hormozi's margin video has embedding disabled (401) and was dropped. The remaining videos are from small agency channels; the Investopedia and CFI readings are strong.

## Sources tried and excluded

- **Agile Alliance glossary** (INVEST, velocity, Three Amigos, DoD, MVP, daily meeting). The first check returned 200, but later checks returned 202 or 403 (a bot challenge) and WebFetch got an empty body. The pages were excluded because they don't verify consistently. They are still good content if a human opens them in a browser.
- **scrum.org resource pages** return 202 (a JS challenge) to curl, and WebFetch gets an empty body. Excluded. The scrumguides.org guide and Scrum.org's official YouTube channel are used instead.
- **HBR**: paywalled. **American Bar Association** MSA article: 403. **PandaDoc**: 429 rate-limited. **Huthwaite** (SPIN publisher): connection failed. All excluded.
- Many guessed slugs returned 404: Investopedia (EVM, SOW, BATNA, NDA, MSA, ACV, MVP), HubSpot (cold-email, meddic, rfp, pipeline-metrics), Gong (meddic, meddpicc, sales-forecasting), Asana (several), CFI (EVM, SOW, BATNA). None of these were used; only URLs that were checked are in the JSON.
- **Clutch** is still in the catalogue as a lead-source and agency-directory reference (WebFetch verified), and the official Clutch.co YouTube channel video is verified.

## Notes for course writers

- Oyelabs-specific facts (services, rates, case studies, Upwork agency profile) were not researched. Use placeholders.
- Contract topics (`bd-contract-essentials`, `pm-sow-contract-management`) must say they are not legal advice. The readings cover US sources (Copyright Office Circular 30, Cornell LII) and the UK (GOV.UK IP overview); point out where the law differs by jurisdiction.
- Some refs are reused across topics on purpose: the Scrum Guide, the Atlassian Agile Coach, the PMI PMBOK page, MEDDICC.com, and the Upwork outsourcing guide.
- Videos are listed in the order they were picked, so the first video in each topic is the recommended default.
