# Complex Sales & Accounts research notes (2026-10-02)

Module `bd-advanced`, 11 topics, 102 quiz questions. Milestones: `bd-a-negotiation-batna-zopa`,
`bd-a-enterprise-procurement`, `bd-a-pipeline-metrics-forecasting`.

Most sources come from `docs/v4/sources-pm-bd.json` (key `bd`), which was already verified. Every
URL and video id that was added here was checked separately (see the end of this file). Every
video id passes YouTube oEmbed with HTTP 200, and each title and channel matches the oEmbed values
exactly. No facts about Oyelabs are used; all examples are generic agencies and clients.

## Videos
- bd-a-consultative-selling: What is the Difference Between Consultative Selling and Normal Selling? (Brian Tracy). This is the catalogue's consultative pick and is short and on-topic.
- bd-a-solution-selling: How To Ask Discovery Questions To Uncover Business Problems (30 Minutes to President’s Club, 34:37). The alternate is What is Solution Selling? (Marketing Business Network, 3:27). New pick: a search found no strong dedicated solution-selling video, so the main video covers the pain-uncovering mechanics the topic depends on. THIN: the alternate has a small channel and few views.
- bd-a-challenger-selling: Sales Methodologies | Challenger sales model (Pipedrive), from the catalogue.
- bd-a-negotiation-batna-zopa: The Harvard Principles of Negotiation (Erich Pommer Institut), from the catalogue. The alternate is Negotiating Using BATNA and ZOPA (Sales Training International, 2:15), a new pick that is short and specific to ZOPA.
- bd-a-concessions-anchoring: Making Sure Your Concessions are Rewarded, not Exploited (Deepak Malhotra, 2:23). This is a new pick: a short clip from an HBS negotiation professor that matches the topic exactly. The alternates are 29 Years of Sales Negotiation Lessons (30MPC) and Chris Voss's Tactical Empathy, both from the catalogue.
- bd-a-rfp-responses: How To Respond To A RFP (The Futur), with the Visme RFP video as the alternate. Both come from the catalogue.
- bd-a-enterprise-procurement: Enterprise Sales | Startup School (Y Combinator), from the catalogue. The alternate is 12 Years of Enterprise Sales Learnings In 29 Minutes (30MPC, 29:47), a new pick.
- bd-a-account-management-expansion: Upsell & Expansion Masterclass: 7 Levers (30MPC), from the catalogue.
- bd-a-pipeline-metrics-forecasting: How to Build a Bulletproof Sales Forecast w/ Taylor Wilding (30MPC), with How to Run a Lightning-Fast Pipeline Review as the alternate. Both come from the catalogue.
- bd-a-case-studies-social-proof: Creating Customer Success Stories that Drive B2B Sales with Joel Klettke (Aaron Zakowski), with the Victor Antonio social-proof tip as the alternate. Both come from the catalogue.
- bd-a-white-label-partnerships: What is a White Label Partnership? (51Blocks), with the Conduit Digital two-minute take as the alternate. Both come from the catalogue. THIN: both are small channels, as the catalogue already noted.

## References
- Added `docs`/`spec` refs, since several catalogue topics had articles only:
  - The FAR 15.203 Requests for proposals page on acquisition.gov (spec) for the RFP topic.
  - The GOV.UK Procurement Act 2023 guidance collection for enterprise procurement. The `/government/publications/...` URL redirects to `/government/collections/...`, and the final URL is used.
  - The FTC pages "Endorsements, Influencers, and Reviews" and "Endorsement Guides: What People Are Asking" for case studies.
  - The HubSpot Knowledge Base pages "Use the forecast tool" and "Set up and manage object pipelines" for pipeline. The old deals URL redirects to `/object-settings/set-up-and-customize-pipelines`, and the final URL is used.
  - The UpCounsel IP ownership clause page, reused from the contract-essentials catalogue entry, for white-label IP.
- MEDDICC.com serves as the `spec` ref for consultative selling, solution selling and account management, because it is the methodology's primary source. Harvard PON is marked `docs` for the negotiation topics, because it is the primary source for BATNA and ZOPA.
- Gainsight's "Essential guide to customer success" (200) was added as an article for account management.
- The checker reports Investopedia (`white-label-product.asp`) as 403 because of bot blocking. A browser-UA curl returns 200 with the correct title.
- Loopio's RFP page blocks curl through Cloudflare. The catalogue verified it with WebFetch.
- Iframe previews are blocked by acquisition.gov (CSP frame-ancestors) and ftc.gov (X-Frame-Options), so the app falls back to link cards for those. HubSpot Knowledge Base pages are frameable.
- Tried and rejected because they returned 404: the FTC endorsement guides legal-library URL, PON concession-strategy slugs, Trailhead forecasting module, GOV.UK public-procurement-policy.

## Facts verified
- MEDDPICC letters and the "Paper Process" definition, checked against meddicc.com.
- FAR 15.203 governs RFPs in negotiated acquisitions, checked against the page title and content on acquisition.gov.
- FTC Endorsement Guides: material connections must be disclosed, and results presented as typical need substantiation. This comes from the FTC business guidance pages.
- There is no official HIPAA certification (used in the expert module's proposal spot task). This is a widely documented HHS position; the content only says the claim is invalid.
- Every calculate task was checked by hand. ZOPA: 56,000/0.7 = 80,000, the client's reservation is 93,000, the width is 13,000 and the midpoint 86,500. Pipeline: weighted 131,000, win rate 6/25 = 24%, gap 110,000, coverage 1.19.
