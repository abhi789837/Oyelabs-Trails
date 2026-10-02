# Strategic BD & AI-Powered Selling research notes (2026-10-02)

Module `bd-expert`, 10 topics (all `expert`), 91 quiz questions. Milestones: `bd-x-pricing-margins`,
`bd-x-ai-ethics-accuracy-confidentiality`, `bd-x-msa-sow-essentials`.

AI-powered BD is split into three topics: research and personalisation, proposal drafting with
Claude, and the accuracy, confidentiality and ethics checks. Contract essentials is split into two:
MSA/SOW (liability, acceptance, payment) and NDA/IP. Both contract summaries open with "This is not
legal advice; involve counsel", and the MSA spot task repeats it. No Oyelabs facts are used.

## Videos
All ids pass oEmbed with HTTP 200, and titles and channels are copied verbatim from oEmbed (trailing spaces in channel names trimmed).
- bd-x-strategic-accounts: How to Open & Close More Deals With Key Accounts | Maddy Jackson (30MPC), from the catalogue. The alternate is How to Create the Ultimate One Page Key Account Plan (The KAM Club, 22:39), a new pick that matches the account-plan content.
- bd-x-new-regions-verticals: Market Expansion and Localization Strategy | Ferdinand Goetzen (ProductLed, 14:43). This is a new pick, because the catalogue had no expansion-specific video. The alternate is Land and Expand (Willingness to Pay), from the catalogue. THIN: the main video is SaaS-oriented rather than agency-oriented; the lessons on localisation and beachhead markets still transfer.
- bd-x-pricing-margins: Digital Agency Profit Margin Guide (Jason Swenk), with How To Price Agency Services (Move At Pace) as the alternate. Both come from the catalogue. No video covers AI API costs on fixed bids specifically; the summary and the calculate task carry that part.
- bd-x-bd-playbooks: How to Create a Sales Playbook (HubSpot Marketing), with The Sales Playbook For Founders (Y Combinator) as the alternate. Both come from the catalogue.
- bd-x-leading-bd-team: Proven Methods for Coaching AEs to Master Discovery (30MPC, 27:44). This is a new pick, chosen because it is coaching-specific. The alternate is 8 Rules Sales Leaders Must Follow (30MPC, 21:13).
- bd-x-ai-research-personalisation: How I Use Claude to Book 4-6 Meetings Every Week (30MPC), with Claude Cowork for sales (Claude) as the alternate. Both come from the catalogue.
- bd-x-ai-proposal-drafting: AI for Sales Proposals: Sales Proposals with Claude in Seconds (AutoRFP, 10:48). This is a new pick. THIN: it comes from a vendor channel (AutoRFP sells RFP software), so treat it as a workflow demo rather than neutral guidance. The Claude docs refs carry the accuracy guidance.
- bd-x-ai-ethics-accuracy-confidentiality: Why do AI models hallucinate? (Claude, 5:14). This is a new pick from the official Anthropic channel. The alternate is Why Large Language Models Hallucinate (IBM Technology, 9:38).
- bd-x-msa-sow-essentials: Master Service Agreement (MSA) Explained in Simple Terms (Malcolm Zoppi), from the catalogue.
- bd-x-nda-ip-clauses: How to draft a NON-DISCLOSURE AGREEMENT [NDA] (Rohit Pradhan), with What Is Work for Hire? (Entertainment Lawyer) as the alternate. Both come from the catalogue.

## References
- Added refs, all of which returned HTTP 200 with a correct title:
  - Claude Docs: Pricing, Citations, and Prompting best practices. The old `use-xml-tags` and `multishot-prompting` URLs now redirect to `claude-prompting-best-practices`, and the final URL is used.
  - The Anthropic Privacy Center page "Is my data used for model training?" (`privacy.anthropic.com` redirects to `privacy.claude.com`, and the final URL is used).
  - ICO: AI guidance, International transfers, and Direct marketing and PECR.
  - trade.gov Export Solutions. The `/market-intelligence` URL returned 403 and was not used.
  - The HubSpot Knowledge Base pages "Use playbooks" and "Review call recordings and transcripts". The `/calling/review-calls` URL redirects to the latter.
  - Cornell LII: Indemnity.
- MEDDICC.com is the `spec` ref for strategic accounts. No official doc on key-account selection resolved; HubSpot's target-accounts knowledge-base URLs returned 404.
- The checker reports Investopedia (gross margin and markup) as 403 because of bot blocking. A browser-UA curl returns 200 with the correct titles.
- No NDA-specific primary reading exists, as the catalogue already noted. NDA content rests on the video, and the IP refs (Circular 30, Cornell, GOV.UK) cover ownership.
- Iframe previews are blocked by platform.claude.com, ico.org.uk, nist.gov and anthropic.com/privacy.claude.com (CSP or X-Frame-Options), so those show as link cards.

## Facts verified
- NIST AI RMF core functions are Govern, Map, Measure and Manage (nist.gov AI RMF page).
- Anthropic's hallucination-reduction guidance covers allowing "I don't know", grounding in direct quotes and verifying with citations (Claude Docs: Reduce hallucinations).
- Under US work made for hire rules, commissioned works qualify only in the statutory categories with a written agreement, so software normally relies on an assignment (Copyright Office Circular 30). In the UK, the author or contractor owns copyright unless it is assigned in writing, while employees' work belongs to the employer (GOV.UK IP overview).
- UK PECR treats individual and corporate subscribers differently for marketing email (ICO direct marketing guidance). The content stays general and does not quote thresholds.
- In the US, copyright in AI-generated material requires human authorship (US Copyright Office position). The content describes this as unsettled and does not go further.
- Model prices are deliberately not quoted; the calculate task uses an illustrative $0.03 per conversation. The checks: blended rate 198,000/2,700 = 73.33; cost 80,500 + 2,000 + 14,400 = 96,900; margin 46.17%; with AI usage tripled, 30.17%.
