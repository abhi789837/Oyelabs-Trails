# Winning Deals research notes (2026-10-02)

Source catalogue: `docs/v4/sources-pm-bd.json` (key `bd`). All videos were re-checked on 2026-10-02 with YouTube
oEmbed (200, and the title and channel matched exactly). No `durationLabel` is set, because `yt.mjs info`
returned no length for these ids.

## Videos
- bd-i-spin-discovery: How to Structure The Perfect Discovery Call (30 Minutes to President's Club); alternate: SPIN Selling Explained (Salesman.com, with a one-dot-leader character in the channel name, copied verbatim from oEmbed).
- bd-i-qualification: Implementing MEDDIC - MEDDPICC Explained In 10 Minutes! (MEDDICC, the methodology's own channel); alternate: What is BANT? (Tech Sales With Higher Levels).
- bd-i-upwork-jobs-connects: I sent 3,255 Upwork Proposals (Oliver); alternate: Upwork Connects Explained (LobodaTech). There is no official Upwork video. These come from creators, so the summary sends readers to the Help Center for current Connects rules.
- bd-i-upwork-proposals-profile: Upwork Profile Optimization Masterclass (Nico Hessel).
- bd-i-proposals-sows: How to Write a Business Proposal Step-by-Step (HubSpot Marketing); alternate: Key Insights into MSA and SOW (247Digitize).
- bd-i-pricing-models: Best Outsourcing Model Explained: Dedicated Team vs Fixed Price vs Time & Material (Future Dev Lab); alternate: Fixed-Price vs T&M (Matt Brickwood).
- bd-i-objection-handling: 42.5 Minutes of Cold Call Objection Handling Tips & Roleplays (30MPC); alternate: How To Prevent Every Sales Objection (Jeremy Miner).
- bd-i-follow-up-cadences: Use This Cold Email Sequence to 3x Your Replies in 2026 (30MPC); alternate: Never Say "Just Following Up" (Jeremy Miner).
- bd-i-running-demos: The Demo Framework That Actually Closes Deals | Robert Friedland (30MPC); alternate: How to Present a MIND-BLOWING Software Demo (Sales Feed).

## References
- New `docs` refs verified by me (curl, 200, page title checked):
  - Trailhead: Customer-centric discovery (`/content/learn/modules/customer-centric-discovery-strategies/get-started-customer-centric-discovery`), used for SPIN because the publisher of SPIN (Huthwaite) was unreachable for the catalogue.
  - Trailhead: Objection handling strategies, "discover objections" and "handle common objections" units. The source for the "defuse, discover, deliver" framing.
  - Trailhead: Product Demos Quick Look, "How to create a product demo".
  - HubSpot Knowledge Base: Create and edit sequences.
  - Loom: sales use-case page (`https://www.loom.com/use-case/sales`), tagged as an article. A candidate support.loom.com article id redirected to the generic support home and was dropped.
  - GOV.UK Service Manual: Agile delivery (from the PM catalogue), used in proposals and SOWs as the docs ref for phased delivery.
  - Claude Docs: Pricing, the docs ref for pricing models (usage-based model cost).
- Upwork: support.upwork.com and upwork.com now return a Cloudflare 403 to curl and WebFetch, so new Upwork Help articles (fixed-price and hourly contract pages found by search) **could not be verified and were not used**. Only the catalogue's previously verified Upwork URLs are cited.
- Catalogue-only topics with thin readings: objection handling had two articles, now supplemented by the two Trailhead units.

## Facts verified
- MEDDPICC letters: Metrics, Economic buyer, Decision criteria, Decision process, Paper process, Identify pain, Champion, Competition (meddicc.com). BANT: Budget, Authority, Need, Timeline.
- SPIN order and the claim that implication questions matter most in large sales: HubSpot's SPIN guide (Rackham's research).
- Upwork: the content quotes no Connects prices, per-job Connect counts or refund rules, because these change and the Help Center could not be re-fetched. It states only stable mechanisms: Connects are spent to submit and boost proposals, badges come from track record and feedback, and taking work off-platform to avoid fees is generally prohibited.
- Practice arithmetic was hand-checked. Weighted pipeline: $176,000 plain and $130,000 qualification-adjusted. Pricing: $100,000 fixed, $80,000 and $95,000 for T&M (expected and capped), $153,000 for the dedicated team, and $50/h effective rate.

## Levels and milestones
- Milestones are SPIN discovery, proposals & SOWs and pricing models, all tagged `advanced`. The other six topics are `intermediate`. Every quiz has 9-10 questions, at least 2 edge-case or interview questions and at least one multi-select.
