# Programme, Portfolio & AI-Era PM research notes (2026-10-02)

Most sources come from `docs/v4/sources-pm-bd.json` (key `pm`). Seven URLs and four video ids were
added and verified in this pass (listed below). All 20 video ids were re-checked with YouTube oEmbed
on 2026-10-02 (all 200).

## Videos
- pm-x-portfolio-governance: Psoda, "The Differences Between Portfolio, Programme and Project Management | Fundamentals". Alts: Mike Clayton "What is Program Management?", iZenBridge "SAFe Lean Portfolio Management: Defining Portfolio (1 of 4)".
- pm-x-business-case: Mike Clayton, "What is a Business Case? Project Management in Under 5". Short; the quiz and calculate task carry the ROI/NPV depth.
- pm-x-benefits-realisation: PMI, "Understand Benefits Realization".
- pm-x-ai-prds-meeting-notes: Claude channel, "How Anthropic uses Claude in Product Management".
- pm-x-ai-risk-estimates: PMI, "Tips for Using Generative AI Tools in Project Management".
- pm-x-ai-confidentiality: PMI, "AI Tools for Project Management: Top 10 Ways to Boost Results". THIN: general rather than confidentiality-specific. The NIST AI RMF and Anthropic's commercial terms carry the substance.
- pm-x-ai-assisted-teams (NEW): Modern Software Engineering, "Has This Report EXPOSED THE TRUTH About AI Assisted Software Development?" (19:09, 135k views, a discussion of the DORA findings). Alt (NEW): Thoughtworks, "AI-assisted software development in 2025: Inside this year's DORA report" (37:21). Found with `yt.mjs search`, and oEmbed 200 with the title and channel copied.
- pm-x-scaling-agile: Scaled Agile, Inc., "SAFe Explained in Five Minutes". Alt: "Introduction to LeSS - Dawson" (the LeSS channel).
- pm-x-pmp-acp-alignment: Andrew Ramdayal, "PMI just changed the PMP exam again". Alts: David McLachlan's 2026 cheat sheet and his PMBOK 8 overview, and Praizion's PMI-ACP ECO overview.
- pm-x-sustainability (NEW): PMI, "Sustainable Project Management: From Planning to Delivery" (18:08). Alt (NEW): PMI, "How to Turn Sustainability Goals Into Project Decisions" (26:45). Official PMI channel, oEmbed 200.
- pm-x-coaching-pms: Mike Clayton, "Coaching and Mentoring for Project Managers" (a long webinar). Alt: All Things Agile, coaching skills.

## References added and verified in this pass (curl -L with a browser UA: 200, title checked)
- https://dora.dev/research/2025/dora-report/ ("DORA | State of AI-assisted Software Development 2025"; the page says AI is "an amplifier").
- https://dora.dev/guides/dora-metrics/ (the final URL after the redirect from /guides/dora-metrics-four-keys/).
- https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/ (the page states "they take 19% longer").
- https://www.anthropic.com/legal/commercial-terms (contains "Anthropic may not train models on Customer Content from Services").
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- https://learn.greensoftware.foundation/ (the three actions: energy efficiency, hardware efficiency, carbon awareness).
- https://sci-guide.greensoftware.foundation/ (SCI = (E * I) + M per R).
- Tried and rejected: greenprojectmanagement.org P5 (redirects to the gpm.org homepage); PMI sustainability and benefits-realisation library slugs (403); learn.greensoftware.foundation/practitioner/ (404); framework.scaledagile.com/lean-budgets (Cloudflare 403).
- pmi.org returned Cloudflare 403 to curl and WebFetch during this session. The pmi.org URLs used were verified 200 by the research pass earlier the same day.

## Facts verified
- PMP 2026 ECO: People 33%, Process 41%, Business Environment 26% (previously 42/50/8); effective July 2026; adds AI, sustainability, stakeholder engagement and value focus. Source: the catalogue `_meta.pmp_eco` (pmi.org pages and the ECO PDF). The content says "July 2026" and doesn't quote the trainers' 9 July date as PMI's.
- PMBOK Guide 8th edition, published November 2025 (catalogue `_meta`).
- PMI-ACP domain percentages and PMP question counts could not be re-checked (pmi.org 403), so the content avoids quoting them and tells learners to check pmi.org.
- NIST AI RMF core functions: Govern, Map, Measure, Manage.
- LeSS: one PO, one backlog, one Sprint, feature teams; basic LeSS up to about eight teams. SAFe: ART, PI planning, RTE, Lean Portfolio Management, WSJF. These are framework-overview facts, kept at overview level.
- DORA metrics wording uses "failed deployment recovery time" (current DORA guide naming).
- All calculate and rank answers (WSJF, NPV, AI re-estimate, emissions) were worked by hand; the arithmetic is in each task's `explanation`.
