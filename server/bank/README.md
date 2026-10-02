# Question bank seed files

One file per skill: `server/bank/<department>/<skillId>.json`, a JSON array of items matching
`bankItemSchema` in `shared/bank.ts`. `_examples.json` has one of every shape and is itself valid.

After writing or editing a file, validate it — only validated items go live:

```bash
npx tsx scripts/bank/validate.ts server/bank/engineering/eng-react-hooks.json
```

This writes `eng-react-hooks.validated.json` (ids + content hashes). Boot inserts absent items;
an item whose hash is not in the sidecar stays `draft`. **Never hand-edit a sidecar.** Piston must be
running for non-JS languages (`PISTON_URL`, default `http://127.0.0.1:2000`).

## The bar

- **Small and practical, never tricky.** A coding item takes 1–2 minutes: complete a function, fix
  one or two lines, or make the output match. No puzzles, no gotcha syntax.
- **Difficulty 1–4** (5 is reserved): 1 = first week on the job, 2 = junior, 3 = mid, 4 = senior.
- **`estMinutes`** 0.5–3; most items 1–2.
- **Ids:** `<skillId>-<type letter><difficulty><n>`, e.g. `eng-react-hooks-c2-3`, `eng-sql-joins-m1-1`,
  `eng-docker-t3-2`. Lowercase, unique across the bank, never renamed once shipped.
- **`stackId`** only when the item only makes sense on one stack (`stack-react`, `stack-laravel`…);
  otherwise `null`. Stack-tied items are only served to learners on that stack.
- Prompts are short Markdown: inline code, fenced blocks, `- ` bullets.

## Coding items

| mode | languages | tests |
| --- | --- | --- |
| `function` | javascript, typescript, python, php | `{ "args": [...], "expected": ... }` — JSON, key order ignored |
| `program` | java, dart (any language) | `{ "stdin": "...", "expected": "stdout" }` — trimmed stdout |
| `sql` | sql (SQLite) | `{ "setup": "CREATE…; INSERT…;", "expected": [ {row}, … ] }` |

- `starterCode` is what the learner sees and must **fail** at least one hidden test; the reference
  solution must pass **all** sample and hidden tests. The validator enforces both.
- 1–2 `sampleTests` (shown, used by Run), 3–6 `hiddenTests` including an edge case (empty input,
  zero, a boundary, a missing key).
- JS/TS: args must be plain JSON. For callbacks, timers or classes, put a small **test driver**
  function in the starter (see the closures example) and make `functionName` the driver.
- PHP: `function` mode calls a plain function; associative arrays compare as JSON objects.
- Java: the public class must be `Main`; read stdin in `main`, keep the part to fix in a small method.
- No randomness, clocks or network in any test.

## Multiple choice

3–6 options, one `correctIndex`, an `explanation`. Options are shuffled when served, so never write
"both A and C". When the question is about code, put the code in `snippet` with `snippetLanguage` —
the learner can run it (it shares the item's 3-run limit) before answering. Questions test reading
and understanding, not memorising trivia.

## Tasks (PM, BD — and engineering skills that cannot be run)

A `task` from `shared/tasks.ts`: `rank`, `calculate`, `scenario`, `spot` (graded by code) or `write`
(graded by a short rubric). Engineering uses `spot`/`rank`/`scenario` for things like a flawed
Dockerfile, the order of a deploy, or an AI-generated diff with a security hole.
