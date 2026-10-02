# v4.2 results: Agency PM Processes Academy

Built across two sessions on 2026-10-02. The first session built most of it but stopped before committing. The second audited the work, finished the missing pieces, and ran every gate.

## Oyelabs documents used

**None.** `docs/oyelabs-process/` does not exist (DECISIONS D1).

- Every handbook entry is seeded with its industry-standard meaning, carries the status "industry standard – to confirm", and has an Oyelabs-meaning field that says what to confirm.
- No Oyelabs policy, price, percentage, duration or client name is invented. Typical values are labelled "typical".
- Contractual topics carry "Not legal advice: the signed contract always wins."

## Content counts

| What | Count |
|---|---|
| Handbook terms | 151, every field filled (asserted by `server/src/routes/handbook.test.ts`) |
| Stages / rules / templates | 25 / 22 / 13 |
| Courses (catalog skills `pm-proc-*`) | 5: A custom lifecycle, B white-label, C terminology, D client meetings, E templates |
| Modules (camps) / topics | 44 / 118 |
| Meeting tutorials (Course D) | 20, covering all 17 meeting types plus 3 meeting-craft topics |
| Template library | 13 templates, each downloadable as DOCX or XLSX in filled and blank versions; generated from the handbook until an admin uploads Oyelabs' own (D3) |
| Unique verified reading links / videos in the courses | 287 / 260. Each one carries `verifiedAt`; links returned HTTP 200 and were the real page; videos passed the oEmbed check |
| Quiz questions in the academy | about 1,070 |
| Seeded bank items | 70 (14 per skill), each citing handbook entries; 3 are mini role-plays |
| Decision-tool test table | 33 cases (`shared/decision.test.ts`), labelled typical rules |
| Classification drill | 20 requests (`pmp-c08-classification-drill`), each checked against `classify()` |

Whole platform after v4.2: 134 modules and 1,005 topics, and the content gate passes.

## Role-play cost per session

These figures are estimates from the caps and Haiku 4.5 list pricing ($1 per million input tokens, $5 per million output). They are not measured: every run so far used the deterministic mock.

- **Caps:**
  - at most 8 PM messages per session, each at most 600 characters
  - the client reply is capped at 300 output tokens
  - the scoring call is capped at 900 output tokens
  - the persona prompt is cached
- **Worst case for a full 8-turn session with scoring:** about **$0.05**.
- **Typical with caching:** about **$0.02–0.03**.
- **Assessment role-plays** (2–3 turns): under $0.02.
- **Monthly cap:** $25 by default (`roleplay.monthly_cap_micros`), which can be changed in Admin → AI usage. That covers roughly 500 or more full practice sessions. Over the cap, new practice sessions are refused, but assessment items never are.
- Each session's cost is logged.

## Test results

- **Lint:** `eslint .` is clean.
- **Typecheck and build:** `tsc -b` and `npm run build` are clean.
- **Content gate:** `npm run content:check` passes with 0 errors. It reports 2 warnings, both older ones in `pm-beginner`.
- **Unit and integration tests:** `npm test` passed 1,260 of 1,261.
  - The one failure is `polyglot.test.ts › java program mode`. It times out only under full-suite load on the local Piston container, passes on its own (9/9), and is not a v4.2 change.
- **What the tests cover for v4.2:**
  - **The handbook end to end:** editing a term re-validates the bank items that cite it, and there are at least 150 complete terms.
  - The 33-case decision table.
  - Every task grader: categorize, form, rank, spot and role-play.
  - **Role-play limits:** the turn and token caps, the monthly cap and per-session cost logging.
  - Grounded generation: citations are required, and unknown or archived entries are rejected.
  - The PM default priorities, the path order and the Advanced unlock.
  - **The assessment** for a PM described as "handles white-label clients, confuses CRs and enhancements" (`pmV42.test.ts`): it includes classification and white-label items and lands within 26–32 minutes.
- **Playwright end-to-end** `scripts/e2e/v42-pm-processes.ts`: **PASS** on the full content.
  - **Onboarding:** the PM's v4.2 default sliders are prefilled. The sheet runs 27.3 minutes and includes classify-request, white-label gap-analysis and role-play items.
  - **The learner** classifies requests (one through the decision tool), holds a 2-reply role-play and hands in.
  - **The path** starts with the diagnostic refresh, then the custom lifecycle, white-label lifecycle, terminology and meetings.
  - **The admin** confirms `change-request`. The tooltip on the course page (in the same tab, and again after a reload) and the glossary both show "Confirmed by Oyelabs" with the new text.
- **Regression:** `scripts/e2e/v41-personalise.ts` still passes its PM and Engineering runs. Its PM defaults were updated to v4.2.

**Bugs found and fixed in session 2:**
- The glossary went stale in the same tab after an admin edit.
- The hands-on questions were moved from the highest-priority skills instead of the lowest when the sheet had to be trimmed.
- 16 form fields were missing `required`.
- Two tests were out of date.

## Deploy

Not done from this session. Abhishek runs the usual one command on the server (back up the database first; migrations `0021_v42_handbook` and `0022_v42_roleplay` only add tables). Then smoke-test https://learn.oyegen.com:

1. `/glossary`
2. `/tools/classify`
3. `/practice/roleplay`
4. `/admin/handbook`
5. one `pmp-*` topic

## Needs Abhishek

1. **Add Oyelabs' process documents** to `docs/oyelabs-process/` (SOW/MSA templates, the CR policy, warranty/AMC terms, white-label onboarding checklists, the escalation matrix) and re-run Phase 1.1. Or confirm the entries directly at `/admin/handbook`, where unconfirmed items are listed first.
2. **Deploy and smoke-test** (above), then push the `v4.2.0` tag.
3. **Confirm or edit these 20 handbook items first.** They drive billing and the decision tool:
   1. `change-request` (term) and `cr-when-needed`, `cr-approval` (rules)
   2. `enhancement` (term)
   3. `bug` (term)
   4. `new-feature` (term)
   5. `warranty` (term) and `warranty-coverage` (rule): the window length and when it starts
   6. `support` (term)
   7. `maintenance` (term)
   8. `amc` (term)
   9. `customisation` and `configuration` (terms) and `configuration-vs-customisation` (rule): white-label customisation billing
   10. `billing-bug-in-delivery` (rule)
   11. `billing-bug-warranty` (rule)
   12. `billing-bug-after-warranty` (rule)
   13. `billing-enhancement` (rule)
   14. `billing-change-request` (rule)
   15. `billing-new-feature` (rule)
   16. `billing-clarification` (rule)
   17. `hypercare` (term)
   18. `sla` and `p1-p4` (terms) and `escalation-levels` (rule)
   19. `client-owned-store-accounts` and `store-rejection-fixes` (rules)
   20. `setup-fee` and `subscription-plan` (terms): white-label commercial terms
4. **Check the role-play monthly cap** ($25 by default) in Admin → AI usage once real usage data is in.
