# Oyelearn v4.1: results

Tag `v4.1.0`. Three commits: `feat(v4.1-p1)` personalised assessments, `feat(v4.1-p2)` agency PM
curriculum, `feat(v4.1-p3)` tests, end-to-end checks and fixes.

## 1. AI-personalised assessments

- The admin writes a short description on the Setup screen (600 characters). Haiku reads the
  description with the sliders and shows "How the AI understood this": the intent, the context
  themes and the planned split, with Regenerate.
- **The split comes from the sliders, and the description can lean it.** Up to 3 hands-on slots
  move toward the skills the description stresses. They come from the lowest-priority skills, and
  no skill drops to zero (`shiftTowardEmphasis`, decision D7).
- **Sonnet writes the items in the learner's own context**, then each item is checked:
  - size limits, timing ceiling and task answer keys;
  - coding items: starter fails and reference passes;
  - code MCQs are run;
  - text MCQs are re-answered by Haiku;
  - calculations are recomputed in code.

  Failures are retried twice, then the slot is filled from the bank. Valid generated items join the
  bank (`source = generated`, tagged with the themes).
- **Personalisation level** (High / Balanced / Low) caps bank reuse at 20 / 40 / 80%.
- **No AI key or budget paused:** the sheet comes from the bank alone and the admin is told so.
- **Admin controls:** Swap or Regenerate any item before it is unlocked.

### Designed to finish on time

| | Result |
|---|---|
| Per-item estimate | Deterministic formula (`shared/timing.ts`); size limits enforced on every item |
| Sheet total | Balanced to 26–32 min. E2E: PM 27.3 min, Engineering 28.0 min |
| Constants | Calibrated weekly from real answer times, damped to ±20% |
| Slow items | Items whose median is more than 1.5× their estimate are flagged and leave the active bank |
| Admin view | `/admin/ai-usage` shows estimated vs actual minutes per assessment |
| Learner view | Sees "About N minutes" before starting and "Finished in" after |

### Cost per personalised assessment

There is no API key on the build machine, so this is **estimated from the real prompt and item
sizes**: system prompts of 1.1k, 2.4k and 0.3k characters, and an average item of 794 characters.

| Call | Model | Tokens in / out | Cost |
|---|---|---|---|
| Understand | Haiku 4.5 | ~1.0k / 1.2k | $0.007 |
| Generate ~15 items (3 calls) | Sonnet 5.5 | ~5.1k / 3.8k | $0.048 |
| One retry round (typical) | Sonnet 5.5 | ~1.7k / 0.8k | $0.011 |
| Text-MCQ check | Haiku 4.5 | ~0.8k / 0.2k | $0.002 |
| **Total (Balanced)** | | | **≈ $0.07** (High ≈ $0.09) |

The target was ≤ $0.15. **Measure the real figure on `/admin/ai-usage` after the first few live
assessments** (Needs Abhishek).

## 2. Agency PM curriculum

| | Count |
|---|---|
| New PM skills (default sliders: Critical client/meetings/email, High Excel/resourcing/tech terms/SDLC, Medium Teams/Word-PPT/Keka/GitHub, Low theory) | 14 |
| New courses (modules), Beginner → Advanced | 13 |
| Topics | 90 |
| Quiz questions | 691 |
| Verified reading links (HTTP 200 + right title, each with `verifiedAt`) | 247 |
| Verified videos (oEmbed, each with `verifiedAt`; all 1,644 curriculum videos re-checked, 0 broken) | 183 |
| Hands-on practices: write (email/explain) 17, spot 16, excel 14, scenario 14, sim 13, rank 7, calculate 7, allocate 2 | 90 |
| Validated PM bank items for the new skills, difficulties 1–4 | 156 |
| `[Oyelabs SOP – admin to fill]` blocks | 56 |

- **Trail order:** the 13 agency courses come first. The generic content is relabelled "PM
  foundations and advanced theory" and placed last.
- **Path order:** the diagnostic refresh (when the assessment found gaps), then the Critical and High
  priorities, then AI, then the rest by slider, with the theory last. This was checked in the E2E
  pass.
- **New task types:**
  - Excel grid with a real formula engine. It uses fast-formula-parser (MIT) plus SUMIFS, COUNTIFS,
    AVERAGEIFS, XLOOKUP, MATCH, MAX, MIN and COUNTA, has RAG colouring, and allows 3 checks.
  - Resource allocation grid.
  - Simulated Keka timesheets, Keka PSA, Teams, GitHub PR and Outlook screens.
  - Email composer and explain-it writing.

  All are graded by code except the writing.
- **Existing PM learners:** no progress is lost, and old topics keep their ids. Learners with no
  sliders got the defaults once, and their paths were rebuilt.
- **Company SOPs:** admins fill these at **Admin → Company SOPs** (`/admin/sop`) or on the topic
  itself. Learners see the text in a "How we do it at Oyelabs" section on the topic.

## 3. Tests

- **Vitest:** 1,119 tests in 88 files. Lint, typecheck and build are clean.
  - The one Java sandbox test can time out under full-suite CPU load on the build machine. It passes
    on its own (9/9), and Piston caps run limits on its own side.
  - New tests cover the personalisation pipeline, timing balance and calibration, the emphasis
    shift, the PM task graders and spreadsheet engine, the agency course schema and verification
    timestamps, the PM defaults, the PM path order, and the SOP routes.
- **Playwright** `scripts/e2e/v41-personalise.ts`, run on the deterministic mock provider:
  - **PM pass:** the description is "handles 3 overseas clients, weak on client calls and Excel",
    with Critical meetings and Excel. The understanding mentions both. The split leans to client
    management and meetings, and 20 of 25 items are meeting, email or Excel items. The estimate is
    27.3 min. The learner answers an Excel formula, an email and an explain-it task. The path order
    is correct.
  - **Engineering pass:** a Laravel webhooks description. Its themes appear in the understanding,
    and 22 generated PHP items are set in that context.
- **Regression:** `scripts/e2e/v4-departments.ts` passes for Engineering, PM and BD.

## 4. Deploy

On the server, as before:

```bash
cd ~/oyelearn && git pull && docker compose up -d --build
```

The app backs up the database before running migrations 0018–0020, and seeds the new skills and
bank items on boot.

## 5. Needs Abhishek

1. **Fill the 56 SOP blocks** at Admin → Company SOPs: Keka timesheet, leave and PSA billing
   policies, rate cards, meeting cadence and MoM template, email templates and signature, support
   SLAs and tiers, time-zone overlap, AI tool rules.
2. **Check real AI cost and quality** on `/admin/ai-usage` after the first live personalised
   assessments. Cost is estimated at about $0.07; the target is ≤ $0.15. Review a few generated
   items in the question bank (filter source = generated).
3. **Keka PSA videos:** Keka has no public per-feature videos. Short screen recordings from our own
   Keka would improve those 7 topics.
4. **Agency-specific topics with no outside source** (fixed-bid vs T&M wording, white-label
   resellers) are covered only through SOP blocks.
