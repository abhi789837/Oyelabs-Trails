# v4.2 plan: Agency PM Processes Academy

The single map that research, writers and engineering share. Every id here is final.

## Catalog skills (department `pm`) → content modules

| Skill id | Name | Default slider | Modules |
|---|---|---|---|
| `pm-proc-custom` | Custom project lifecycle | 5 Critical | `pmp-a00` … `pmp-a15` |
| `pm-proc-whitelabel` | White-label project lifecycle | 5 Critical | `pmp-b01` … `pmp-b12` |
| `pm-proc-terms` | Project terminology mastery | 5 Critical | `pmp-c01` … `pmp-c08` |
| `pm-proc-meetings` | Handling every client meeting | 5 Critical | `pmp-d01` … `pmp-d05` |
| `pm-proc-templates` | Process templates in practice | 4 High | `pmp-e01` … `pmp-e03` |

The existing agency skills are re-slotted:

- **Critical → High:** client management (5→4).
- **Critical → Medium:** client meetings & presenting (5→3), and email (5→3). These are mostly covered by `pm-proc-meetings`.
- **Unchanged:** Excel 4, resourcing 4, SDLC 4, tech terms 4, Teams/Word/Keka/GitHub 3.
- **Medium now:** AI for PMs (3).
- **Unchanged:** theory 2.

## Levels

Each stage module has one topic per level band:

- **B/I:** what it is, entry and exit criteria, RACI.
- **A (the main focus):** a worked Oyelabs-style example of "what good looks like".
- **X (super advanced):** hard cases and recoveries.

Topic id = `<module>-<slug>`.

## Course A: Custom project lifecycle (`pmp-a…`)

| Module | Title | Topics |
|---|---|---|
| pmp-a00 | The custom lifecycle at a glance | a00-lifecycle-map (B), a00-raci-roles (I) |
| pmp-a01 | BD handover to delivery | a01-handover-checklist (I), a01-reading-sow (A), a01-risky-assumptions (X) |
| pmp-a02 | Estimation & commercial models | a02-commercial-models (I), a02-estimation-support (A), a02-milestone-billing (X) |
| pmp-a03 | Internal kickoff | a03-internal-kickoff (I), a03-plan-risks-environments (A) |
| pmp-a04 | Client kickoff | a04-client-kickoff (I), a04-expectations-governance (A) |
| pmp-a05 | Discovery & requirements | a05-discovery (I), a05-stories-acceptance (A), a05-freeze-signoff (X) |
| pmp-a06 | UI/UX & design approval | a06-design-process (I), a06-review-rounds (A) |
| pmp-a07 | Architecture & Sprint 0 | a07-sprint0 (I), a07-architecture-decisions (A) |
| pmp-a08 | Sprint execution | a08-sprint-cadence (I), a08-demos-feedback (A), a08-eod-updates (I) |
| pmp-a09 | Scope control: CR, enhancement, bug | a09-classifying-requests (I), a09-writing-crs (A), a09-replanning (X) |
| pmp-a10 | QA, UAT & sign-off | a10-qa-vs-uat (I), a10-uat-signoff (A) |
| pmp-a11 | Release & go-live | a11-go-no-go (A), a11-cutover-rollback (X), a11-store-submission (A) |
| pmp-a12 | Hypercare & warranty | a12-hypercare (A), a12-warranty-claims (X) |
| pmp-a13 | Handover & KT | a13-handover-checklist (A), a13-ownership-credentials (A) |
| pmp-a14 | Support, AMC & retainers | a14-support-models (I), a14-amc-retainer (A) |
| pmp-a15 | Closure | a15-retro-closure (I), a15-case-study-upsell (A) |

## Course B: White-label lifecycle (`pmp-b…`)

| Module | Title | Topics |
|---|---|---|
| pmp-b01 | What white-label means | b01-core-vs-instance (B), b01-what-can-change (I) |
| pmp-b02 | Demo & requirement call | b02-demo-call (I), b02-requirement-capture (A) |
| pmp-b03 | Gap analysis | b03-ootb-config-custom (A), b03-estimating-billing-gaps (A), b03-avoiding-custom-creep (X) |
| pmp-b04 | Collecting the brand kit | b04-brand-kit (I) |
| pmp-b05 | Client-owned accounts | b05-accounts-ownership (A), b05-store-developer-accounts (A) |
| pmp-b06 | Configuration & custom modules | b06-configuration-setup (I), b06-custom-modules-as-crs (A) |
| pmp-b07 | Rebranded builds, QA & UAT | b07-rebranded-builds-qa (A) |
| pmp-b08 | Store listing preparation | b08-listing-assets (I), b08-privacy-review-guidelines (A) |
| pmp-b09 | Submission, rejection & resubmission | b09-submission (A), b09-rejections (X) |
| pmp-b10 | Go-live, licence & support plan | b10-golive-licence-support (A) |
| pmp-b11 | Core product upgrades | b11-version-sync (A), b11-customisation-debt (X) |
| pmp-b12 | Running many white-label clients | b12-portfolio-templates (A) |

## Course C: Terminology mastery (`pmp-c…`)

Comparison lessons are built from the handbook.

| Module | Title | Topics |
|---|---|---|
| pmp-c01 | Commercial & contract terms | c01-msa-sow-nda (B), c01-estimate-quote-po (I), c01-pricing-models (I), c01-ip-licence-handover (A) |
| pmp-c02 | Scope terms | c02-cr-enh-bug-feature (A), c02-assumption-dependency-constraint (I), c02-creep-goldplating (I), c02-config-vs-custom (A) |
| pmp-c03 | Delivery terms | c03-brd-prd-story (I), c03-dor-dod (I), c03-release-deploy-golive (A), c03-hotfix-patch-version (I) |
| pmp-c04 | Quality & support terms | c04-severity-priority (A), c04-qa-uat-smoke-regression (I), c04-response-resolution-tat (A), c04-rca-known-issues (A) |
| pmp-c05 | Warranty, support & maintenance | c05-warranty-support-amc (A) |
| pmp-c06 | Communication & governance | c06-raci-spoc-steerco (I), c06-risk-vs-issue-raid (I), c06-escalation-matrix (A) |
| pmp-c07 | White-label terms | c07-whitelabel-reseller-private (I), c07-tenancy-instance-fork (A), c07-client-owned-accounts (A) |
| pmp-c08 | Drills | c08-classification-drill (A), c08-fix-the-wrong-term (A), c08-flashcards (B) |

## Course D: Every client meeting (`pmp-d…`)

| Module | Title | Topics |
|---|---|---|
| pmp-d01 | Starting a project | d-internal-kickoff, d-client-kickoff, d-discovery-workshop, d-design-review |
| pmp-d02 | Running delivery | d-sprint-planning, d-daily-standup, d-weekly-status, d-sprint-demo |
| pmp-d03 | Hard conversations | d-cr-negotiation, d-bad-news-delay, d-unhappy-escalation, d-whitelabel-gap-call |
| pmp-d04 | Releasing & closing | d-uat-walkthrough, d-go-no-go, d-retrospective, d-closure-handover, d-account-review |
| pmp-d05 | Meeting craft | d-craft-demo-screenshare, d-craft-timebox-decisions, d-craft-non-native |

## Course E: Templates in practice (`pmp-e…`)

| Module | Title | Topics |
|---|---|---|
| pmp-e01 | Scope & sign-off templates | e-cr-form, e-requirement-signoff, e-uat-signoff, e-kickoff-agenda |
| pmp-e02 | Running-the-project templates | e-mom, e-status-report, e-raid-log, e-escalation-matrix |
| pmp-e03 | Release & close templates | e-golive-checklist, e-hypercare-log, e-handover-kt, e-whitelabel-onboarding, e-closure-report |

Total: 5 courses, 44 modules, about 125 topics.

## Handbook

- **Entries:** `server/handbook/{terms,stages,rules,templates}.json`, seeded into the DB. The admin edits them in the DB.
- **Term ids:** kebab-case slugs, for example `change-request`, `enhancement`, `bug`, `warranty`, `amc`.
- **Links from course content:** write `[[term:change-request]]` or `[[term:change-request|CR]]`. Every term referenced must exist in the handbook.
