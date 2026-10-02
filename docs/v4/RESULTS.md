# Oyelearn v4 — results

## AI tokens and cost: before and after (Phase 6)

**Method.** No real-provider usage exists in any database available to this build (every recorded
call is the mock), so both columns are computed the same way: measured prompt templates plus typical
injected context, priced with the list prices fetched on 2026-10-02 (Haiku 4.5 $1/$5, Sonnet 5.5
$2/$10, Opus 5.5 $4/$20 per million tokens; batches −50%; cache reads 0.1× input). Every v4 call is
now logged with its task, tokens, cache tokens and cost, so **Admin → AI usage** will show real numbers
from the first day a credential is used. Before = `AUDIT.md` baseline.

| Operation | Before: calls · tokens in/out · model | Before $ | After: calls · model | After $ |
| --- | --- | --- | --- | --- |
| Assessment generated | 13 · 48k / 37k · Sonnet | **$0.47** | **0** — assembled from the question bank by code | **$0.00** |
| Thin skill topped up (once, for everyone) | — | — | 1 batch call · ~3k / ~8k · Sonnet 5.5 via Batch API | ~$0.04 per skill/type, amortised over every later sitting |
| Assessment graded — engineering | 2 · 21k / 5.6k · Opus | **$0.20** | **0** — hidden tests + answer key | **$0.00** |
| Assessment graded — PM/BD | (same as above) | $0.20 | only written tasks: ≤ 4 × (~700 / ~120) · Haiku 4.5 | **≈ $0.005** |
| Path build: gap analysis | 1 · 7k / 1.5k · Sonnet | $0.03 | **0** — read off the v4 report by skill | $0.00 |
| Path build: course matching | 3 · 1.2k / 0.2k · Sonnet | $0.01 | 0 when a catalog module or saved course fits (D7); else Haiku | ≤ $0.002 |
| Course actually generated | 14 · 25k / 33k · Sonnet (+ review on Sonnet) | **$0.38** | 14 · same shape · Sonnet 5.5 writing, Opus 5.5 review, capped outputs, cached system prompts | ≈ $0.39 |
| Weekly plan refine | 1 · 4.4k / 1.2k · Sonnet | $0.02 | 1 · Haiku 4.5, 2k output cap | **$0.01** |

**Typical onboarding** (one assessment, its grading, a path with three courses):

- **Before:** $0.47 + $0.20 + $0.04 + 3 × $0.38 ≈ **$1.85**, ~250k tokens, every time.
- **After, engineering learner whose priorities have catalog modules:** $0 + $0 + $0 + 0 generated
  courses ≈ **$0.00–$0.01**.
- **After, a priority with no module and no saved course:** + ≈ $0.39 for that one course, once —
  "Save to library" then makes it free for the next learner with the same skill.
- **After, PM/BD learner:** ≈ **$0.005** (written-task rubrics) — both departments now have full
  four-level curricula, so their paths attach modules rather than generating.

**What did not get cheaper, honestly:** the cost of a course that really has to be written is about
the same (~$0.39): output tokens dominate and Sonnet 5.5 at $10/M is only modestly cheaper than the
old Sonnet, while the final review moved to Opus as the brief asks. The saving on courses comes from
generating far fewer of them. Lesson writing is not yet on the Batch API (bank fills are); moving it
there would halve that figure and is the next lever (noted in PROGRESS).

**Controls now in place:** a model and output cap per task (Admin → AI connection → Model routing);
models checked against the account's live model list with a Sonnet 5.5 fallback; cached system
prompts; the Message Batches API for bank fills; a monthly budget with an 80% warning and a 100%
pause of non-urgent jobs (deferred, not failed); spend per day, task and learner, and average cost
per assessment and per generated course on Admin → AI usage.
