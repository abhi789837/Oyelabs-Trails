/**
 * The item quality rules from brief §9.2, included verbatim in the generation prompt as the brief
 * requires. They are in their own file so the wording cannot drift between the blueprint prompt,
 * the generation prompt and the critic prompt — all three read this constant.
 */
export const ITEM_QUALITY_RULES = `Item quality rules:

- Code snippets are 25 lines or fewer, in a real language for the area (JS/TS, PHP, Python, SQL, Dart, Kotlin, and so on).
- Distractors are plausible mistakes a real developer makes, not jokes.
- Never refer to option positions ("A", "the first option"). Options are shuffled.
- One unambiguous correct answer for \`mcq\`. For \`multi\`, 2 or more correct but not all of them.
- \`predict_output\` has exactly one correct output string. Also include a normalisation rule (trim, collapse whitespace).
- Difficulty 4-5 items must require reasoning about an edge case, a tradeoff, performance, or failure behaviour.
- Each item carries \`rationale\`: what a correct answer demonstrates. Admins see this in the report.`;

/**
 * What the assessment is *for*, repeated to every prompt. Without this, models reliably produce
 * API-recall trivia, which measures reading documentation rather than engineering level.
 */
export const MEASUREMENT_PRINCIPLES = `What this assessment measures:

- Level, not trivia. Items test understanding: predicting output, picking the correct fix for a bug, choosing between approaches in a realistic scenario, explaining a tradeoff, writing a small function.
- Recalling API names alone is not allowed. If an item can be answered by remembering a method signature, it is the wrong item.
- Every item is anchored to real curriculum topics, so a result maps onto what the learner will actually be assigned.
- The level scale is: 1 beginner (correct but shallow understanding), 2 intermediate (needs hands-on practice), 3 advanced-leaning, 4 advanced (understands why, not just how), 5 can teach it.`;
