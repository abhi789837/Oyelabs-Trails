# Advanced Delivery research notes (2026-10-02)

Sources come from `docs/v4/sources-pm-bd.json` (key `pm`), which was already verified (refs HTTP 200,
videos oEmbed 200, titles and channels copied from oEmbed). No URL outside that file is used in this
module. All 20 video ids were re-checked with YouTube oEmbed on 2026-10-02 (all 200).
`yt.mjs info` returned `lengthSeconds: 0` for these ids, so `durationLabel` is omitted.

## Videos
- pm-a-hybrid-delivery: "Project Management: Waterfall, Agile, & Hybrid Approaches" (Kandis Porter); first pick in the catalogue. Alt: Alvin the PM, "Waterfall vs Agile vs Hybrid Approaches Explained in 10 Minutes!".
- pm-a-capacity-planning: "Best Practices for Resource Capacity Planning" (Acuity PPM), portfolio-level capacity. Alt: Ajeet SD on velocity and capacity.
- pm-a-burndown-burnup: "What are a Burndown Chart, a Burnup Chart, and Velocity?" (Mike Clayton), which covers all three charts in this topic. Alt: Scrum Inc. burndown session.
- pm-a-flow-metrics: "Cumulative Flow Diagram (CFD) Explained in Two Minutes" (Businessmap). Short; the Kanban Guide and Atlassian cycle-time pages carry Little's Law and percentiles. THIN on video depth.
- pm-a-evm-fundamentals: Sunny Sensei, "What is Earned Value Management? | EVM | CV, SV, CPI, SPI, EAC, ETC, TCPI, VAC".
- pm-a-evm-forecasting: Andrew Ramdayal, "PMP Exam, Earned Value Management Full Course Part 6", the forecasting-heavy part. The two EVM topics use different videos on purpose.
- pm-a-contract-types: PMPwithRay, "TYPES OF CONTRACTS IN PROCUREMENT..." (PMP contract-type taxonomy). Alt: Matt Brickwood, fixed price vs T&M for software. Refs reuse the catalogue's procurement-contracting, fixed-price and retainer articles.
- pm-a-sow-management: Mike Clayton, "What is a Statement of Work (SOW)? And what are the different types?".
- pm-a-escalations: Adriana Girdler, "How to Manage Difficult Stakeholders". Alts: David McLachlan ("Never Escalate, Never Close") and Mike Clayton with Andy Kaufman.
- pm-a-project-recovery: David McLachlan, "Four Ways to Recover a Failing Project". Alts: ProjectManager, Adriana Girdler.
- pm-a-vendor-management: David McLachlan, "Project Procurement Management Overview". Alt: Prabh Nair on vendor risk. THIN: neither is about managing an outsourced dev vendor specifically (as the catalogue notes); the summary and quiz carry the agency-specific content.

## References
- Each topic has a `docs`/`spec` ref: PMI Disciplined Agile, Atlassian burndown tutorial and estimation guide (catalogue kind `docs`/`article`), the Kanban Guide (spec), the PMBOK 8 page (spec), the Atlassian clean-escalations play (docs), and the PMI SOW library paper, labelled `docs` as PMI's own published guidance.
- pm-a-project-recovery has only PMI library papers plus the PMBOK page (no second publisher resolved; see the catalogue's gaps).
- pmi.org started returning Cloudflare 403 to curl and WebFetch during this session. The URLs were verified 200 by the research pass earlier the same day and are used unchanged.

## Facts verified
- EVM formulas (CV, SV, CPI, SPI, EAC variants, ETC, VAC, TCPI) follow standard PMBOK definitions. SPI tending to 1.0 at completion is a property of the definition (EV = PV = BAC at the end).
- Kanban Guide (May 2025) flow measures: WIP, throughput, work item age, cycle time (kanbanguides.org, from the catalogue).
- The PMP 2026 approach mix (about 40% predictive and 60% agile/hybrid) is taken from the brief. Domain weights are in the expert module's notes.
- All calculate-task answers were worked by hand and are explained in each task's `explanation`.
- Contract and SOW topics carry a "not legal advice" note.
