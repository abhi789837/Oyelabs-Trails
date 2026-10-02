# BD Foundations research notes (2026-10-02)

Source catalogue: `docs/v4/sources-pm-bd.json` (key `bd`) and `docs/v4/RESEARCH_PM_BD.md`. All videos were
re-checked against YouTube oEmbed on 2026-10-02 (34/34 across both BD modules returned 200, and the title and
channel matched the content files exactly). `yt.mjs info` returned `lengthSeconds: 0` for these ids, so no
`durationLabel` is set.

## Videos
- bd-b-agency-offerings: Get High Paying Clients As A Custom Software Agency? (Kieran Moloney); alternate: How to Sell Software to Businesses (Sales Scripter). Catalogue's picks; both are small agency-owner channels (thin topic, flagged in the catalogue).
- bd-b-icp-personas: How to Define Your Ideal Customer Profile (ICP) (HubSpot Marketing); alternate: How To Create a Buyer Persona (HubSpot Marketing). One for each half of the topic.
- bd-b-lead-sources: How to generate B2B leads from Clutch (Belkins) as the primary because it is the most practical; alternates: Meet Clutch (Clutch.co, official) and How to Get Your First 10 Customers (Y Combinator).
- bd-b-crm-hygiene: The Official HubSpot Sales Hub Tutorial (HubSpot Academy); alternate: What Is CRM? (Simplilearn). HubSpot's own CRM-cleanup videos block embedding (oEmbed 401), so this is a general Sales Hub tutorial rather than a hygiene-specific one. Thin.
- bd-b-cold-email: Steal This Cold Email Template That Gets 20% Reply Rate (30 Minutes to President's Club); alternate: Outbound Prospecting Masterclass (same channel).
- bd-b-linkedin-outreach: The Only LinkedIn Outreach Video You Will Ever Need (lemlist). Note lemlist sells outreach tooling; the summary and quiz state LinkedIn's own rules against automation.
- bd-b-business-writing: 8 Email Etiquette Tips (Harvard Business Review). Only one video in the catalogue.
- bd-b-tech-literacy: Web App Vs Mobile App (Mike Munroe); alternates: What Are APIs? (Simply Explained) and Michael Seibel - How to Plan an MVP (Y Combinator).
- bd-b-software-estimation: How To Estimate Software Development Time (Modern Software Engineering, Dave Farley's channel). The catalogue filed it under tech literacy; it fits estimation better.

## References
- New refs verified by me (curl -L with a browser UA, HTTP 200, page title checked):
  - Claude Docs Pricing `https://platform.claude.com/docs/en/about-claude/pricing` (agency offerings, estimation) and Token counting `https://platform.claude.com/docs/en/build-with-claude/token-counting` (estimation). Used as the `docs` ref for topics whose catalogue refs were all articles, and because AI running cost is central to both topics.
  - HubSpot Knowledge Base: Deduplicate records `https://knowledge.hubspot.com/records/deduplication-of-records`; Set up and manage object pipelines `https://knowledge.hubspot.com/object-settings/set-up-and-customize-pipelines` (the older `/deals/set-up-and-customize-pipelines` path is a 404).
  - Gmail Help: Email sender guidelines `https://support.google.com/a/answer/81126`.
  - LinkedIn Help: Connecting with other members, best practices (`/help/linkedin/answer/62928`), Prohibited software and extensions (`/help/linkedin/answer/a1341387`), Invitation limit reached (`/help/billing/answer/a550555`, which sits under "Corporate Billing Help" but is the general invitation-limit page).
- Catalogue refs used as given. Upwork Help Center and upwork.com URLs now return a Cloudflare 403 to curl and WebFetch. They are used only where the catalogue already verified them.
- bd-b-lead-sources has 5 catalogue refs; the Clutch directory page was dropped to stay within 4 (Clutch is still cited in bd-b-agency-offerings).

## Facts verified
- CAN-SPAM covers B2B commercial email, requires no prior consent, and does require accurate headers, a non-deceptive subject, a postal address and an honoured opt-out (FTC guide). No penalty figure is quoted, because the amount is inflation-adjusted.
- Gmail sender guidelines: all senders must authenticate with SPF or DKIM; bulk senders also need SPF, DKIM and DMARC, one-click unsubscribe and a low spam rate. The content gives no thresholds.
- LinkedIn: the help centre says invitation limits exist without publishing a number, that ignored or spam-marked invitations can restrict an account, and that automation and scraping tools are prohibited. No invitation count is quoted.
- PERT formula (O + 4M + P) / 6. The practice arithmetic was hand-checked: 315 h, $16,301.25 with contingency, $330/month model cost. Token prices in the practice are labelled illustrative and are not quoted as current prices.
- Oyelabs facts: none invented. bd-b-agency-offerings carries the "Oyelabs specifics (admin to fill in)" placeholder line.

## Levels and milestones
- bd-b-tech-literacy and bd-b-software-estimation are the milestones and are tagged `advanced`, so the checker does not warn about beginner milestones. They have 8-question quizzes with multi-select. The other seven topics are `beginner`, with 6-7 questions each.
