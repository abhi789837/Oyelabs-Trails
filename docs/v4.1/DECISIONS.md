# Oyelearn v4.1 — decisions

Each entry: the decision, the alternatives, and why.

## D1. Spreadsheet engine: fast-formula-parser (MIT), plus five functions of our own
- **Decision:** Excel tasks evaluate formulas with `fast-formula-parser` 1.0.19 (MIT licence, checked
  on npm). It covers SUM, AVERAGE, IF, COUNTIF, SUMIF, VLOOKUP, dates and NETWORKDAYS; SUMIFS,
  COUNTIFS, AVERAGEIFS, XLOOKUP and MATCH are implemented in `shared/sheet.ts`.
- **Alternatives:** HyperFormula (GPL-3.0 or a commercial licence, 12.9 MB), `hot-formula-parser`
  (MIT, older, fewer functions), `@formulajs/formulajs` (MIT functions only, no reference engine).
- **Why:** permissive licence, small, runs in the browser and in Node so the grid and the grader
  compute identically. No GPL obligations for an internal tool that may be shared later.

## D2. "Personalisation" is a reuse cap, and generated items join the bank
- **Decision:** High / Balanced / Low cap bank reuse at 20% / 40% / 80% of the 25 slots; the rest
  is written by the model. Validated generated items are added to the bank as `active`
  (`source = generated`, tagged with the learner's context themes) so later learners can reuse them.
- **Why:** the brief's ~40% default reuse, a lever for cost, and every paid-for item stays useful.

## D3. Generation is not urgent for the budget; planning and grading are
- **Decision:** `item_generate` and `item_check` pause when the monthly budget is used up (the
  assessment then comes from the bank, with a notice); `understand` and written-task grading do not.
- **Why:** an assessment must always be issued; a personalised one is a nice-to-have once over budget.
