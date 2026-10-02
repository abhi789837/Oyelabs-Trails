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

## D4. Timed written answers stay short (about 20–30 words)
- **Decision:** assessment `write` items (email, explain-it, MoM actions) ask for about 20–30 words.
  Longer emails are practised in the courses, where there is no clock.
- **Why:** the timing formula counts 25 words a minute for composing. A 60-word email alone is
  about 2.5 minutes, which breaks the 80-second hands-on slot and the 26–32 minute total.

## D5. Oyelabs SOP blocks are stored in the database, and any staff member can fill them
- **Decision:** topics declare `sop: [{ title, prompt }]` in content. The text lives in `sop_entries`
  (migration 0020), and is edited on the topic page or at `/admin/sop` (Company SOPs). Writes are
  open to admins and the superadmin, and every save is audited (`sop.save`).
- **Why:** the content never invents internal facts. Department leads own these procedures, and
  editing text should not need a deploy.

## D6. The diagnostic refresh course is per department
- **Decision:** the "refresh" course that opens Part 1 is looked up within the learner's own
  department. It was found catalog-wide, so an engineer could have received the PM refresh.
