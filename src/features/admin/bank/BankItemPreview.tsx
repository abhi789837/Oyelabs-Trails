import { useState, type ReactNode } from "react";
import { Check, Eye, EyeOff } from "lucide-react";

import type { BankItemRow } from "@shared/bank";
import { TASK_KIND_LABELS, toLearnerTask, type Task, type TaskResponse, type TerminalTask } from "@shared/tasks";

import { CodeBlock, RichText } from "@/components/content/RichText";
import { TaskView } from "@/components/tasks/TaskView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatTimestamp } from "@/lib/utils";
import { BANK_TYPE_LABELS, formatDiscrimination, formatMeanScore } from "./helpers";

/**
 * What a bank item looks like, for an admin deciding whether to keep it. The answer is behind a
 * toggle so the sheet can be shown on a shared screen without giving a key away.
 */
export function BankItemPreview({ item, skillName }: { item: BankItemRow; skillName: string }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="space-y-6 text-sm">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <Meta label="Skill">{skillName}</Meta>
        <Meta label="Type">{BANK_TYPE_LABELS[item.type]}</Meta>
        <Meta label="Difficulty">{item.difficulty} / 5</Meta>
        <Meta label="Times used">{item.timesUsed}</Meta>
        <Meta label="Mean score">{formatMeanScore(item.meanScore)}</Meta>
        <Meta label="Discrimination">{formatDiscrimination(item.discrimination)}</Meta>
        <Meta label="Estimated time">{item.estMinutes} min</Meta>
        <Meta label="Source">{item.source}</Meta>
        <Meta label="Validated">{item.validatedAt ? formatTimestamp(item.validatedAt) : "Not yet"}</Meta>
      </dl>

      {item.retiredReason && (
        <div
          className={cn(
            "rounded-md border px-3 py-2 text-sm",
            item.status === "draft" ? "border-destructive/40 bg-destructive/5" : "border-border bg-surface-sunken/50",
          )}
        >
          <p className="text-xs font-medium text-muted-foreground">{item.status === "draft" ? "Why it is a draft" : "Why it was retired"}</p>
          <p className="mt-1 break-words">{item.retiredReason}</p>
        </div>
      )}

      <section aria-label="Prompt">
        <h3 className="text-xs font-medium text-muted-foreground">Prompt</h3>
        <RichText text={item.prompt} className="mt-1.5" />
      </section>

      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <p className="text-xs text-muted-foreground">The answer is hidden until you ask for it.</p>
        <Button variant="outline" size="sm" onClick={() => setShowAnswer((v) => !v)} aria-pressed={showAnswer}>
          {showAnswer ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {showAnswer ? "Hide answer" : "Show answer"}
        </Button>
      </div>

      {item.coding && <CodingPreview coding={item.coding} showAnswer={showAnswer} />}
      {item.mcq && <McqPreview mcq={item.mcq} showAnswer={showAnswer} />}
      {item.task && <TaskPreview task={item.task} showAnswer={showAnswer} />}
    </div>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate">{children}</dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

function Json({ value }: { value: unknown }) {
  return (
    <pre className="max-h-64 overflow-auto rounded-md border bg-surface-sunken/50 px-3 py-2 font-mono text-xs whitespace-pre-wrap break-words">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function CodingPreview({ coding, showAnswer }: { coding: NonNullable<BankItemRow["coding"]>; showAnswer: boolean }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{coding.language}</Badge>
        <Badge variant="outline">{coding.mode} mode</Badge>
        {coding.functionName && <Badge variant="outline">{coding.functionName}()</Badge>}
        <Badge variant="outline">{coding.hiddenTests.length} hidden tests</Badge>
      </div>
      <Block title="Starter code">
        <CodeBlock code={coding.starterCode || "// (empty)"} lang={coding.language} />
      </Block>
      <Block title={`Sample tests (${coding.sampleTests.length})`}>
        <Json value={coding.sampleTests} />
      </Block>
      {showAnswer && (
        <>
          <Block title="Reference solution">
            <CodeBlock code={coding.referenceSolution} lang={coding.language} />
          </Block>
          <Block title={`Hidden tests (${coding.hiddenTests.length})`}>
            <Json value={coding.hiddenTests} />
          </Block>
        </>
      )}
    </div>
  );
}

function Choice({ text, correct, showAnswer, index }: { text: string; correct: boolean; showAnswer: boolean; index: number }) {
  const marked = showAnswer && correct;
  return (
    <li
      className={cn(
        "flex gap-2 rounded-md border px-3 py-2",
        marked ? "border-summit/50 bg-summit/[0.07]" : "border-border",
      )}
    >
      <span className="font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + index)}</span>
      <span className="min-w-0 flex-1 break-words">{text}</span>
      {marked && (
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-summit-strong">
          <Check className="size-3.5" aria-hidden="true" />
          Correct
        </span>
      )}
    </li>
  );
}

function McqPreview({ mcq, showAnswer }: { mcq: NonNullable<BankItemRow["mcq"]>; showAnswer: boolean }) {
  return (
    <div className="space-y-5">
      {mcq.snippet && (
        <Block title="Snippet">
          <CodeBlock code={mcq.snippet} lang={mcq.snippetLanguage ?? "text"} />
        </Block>
      )}
      <Block title="Options">
        <ol className="space-y-1.5">
          {mcq.options.map((option, index) => (
            <Choice key={index} index={index} text={option} correct={index === mcq.correctIndex} showAnswer={showAnswer} />
          ))}
        </ol>
      </Block>
      {showAnswer && (
        <Block title="Explanation">
          <RichText text={mcq.explanation} />
        </Block>
      )}
    </div>
  );
}

function TaskPreview({ task, showAnswer }: { task: Task; showAnswer: boolean }) {
  return (
    <div className="space-y-5">
      <Badge variant="outline">{TASK_KIND_LABELS[task.kind]}</Badge>
      <Block title="Task">
        <RichText text={task.prompt} />
      </Block>
      <TaskBody task={task} showAnswer={showAnswer} />
    </div>
  );
}

function TaskBody({ task, showAnswer }: { task: Task; showAnswer: boolean }) {
  switch (task.kind) {
    case "write":
      return (
        <>
          {task.context && (
            <Block title="Context">
              <p className="rounded-md border bg-surface-sunken/50 px-3 py-2 whitespace-pre-wrap">{task.context}</p>
            </Block>
          )}
          {task.sourceText && (
            <Block title="Message to rewrite">
              <p className="rounded-md border bg-surface-sunken/50 px-3 py-2 whitespace-pre-wrap">{task.sourceText}</p>
            </Block>
          )}
          <p className="text-muted-foreground">Word limit: {task.wordLimit}</p>
          <Block title="Marking guide">
            <ul className="space-y-1.5">
              {task.rubric.map((c) => (
                <li key={c.id} className="rounded-md border px-3 py-2">
                  <span className="font-medium">{c.label}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">×{c.weight}</span>
                  {showAnswer && <p className="mt-1 text-muted-foreground">{c.description}</p>}
                </li>
              ))}
            </ul>
          </Block>
          {showAnswer && task.sampleAnswer && (
            <Block title="Sample answer">
              <p className="whitespace-pre-wrap">{task.sampleAnswer}</p>
            </Block>
          )}
        </>
      );
    case "rank": {
      const byId = new Map(task.items.map((i) => [i.id, i.label]));
      return (
        <>
          <Block title={showAnswer ? "Correct order" : "Items"}>
            <ol className="list-decimal space-y-1 pl-5">
              {(showAnswer ? task.correctOrder.map((id) => ({ id, label: byId.get(id) ?? id })) : task.items).map((i) => (
                <li key={i.id}>{i.label}</li>
              ))}
            </ol>
          </Block>
          {showAnswer && task.explanation && (
            <Block title="Explanation">
              <p>{task.explanation}</p>
            </Block>
          )}
        </>
      );
    }
    case "calculate":
      return (
        <>
          {task.table && (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-surface-sunken/50 text-left">
                    {task.table.columns.map((c) => (
                      <th key={c} scope="col" className="px-2 py-1.5 font-semibold">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {task.table.rows.map((row, r) => (
                    <tr key={r} className="border-b last:border-0">
                      {row.map((cell, c) => (
                        <td key={c} className="px-2 py-1.5 tabular">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Block title="Fields">
            <ul className="space-y-1.5">
              {task.fields.map((f) => (
                <li key={f.id} className="flex flex-wrap justify-between gap-2 rounded-md border px-3 py-2">
                  <span>{f.label}</span>
                  {showAnswer && (
                    <span className="font-mono text-xs text-summit-strong">
                      {f.answer}
                      {f.unit ? ` ${f.unit}` : ""} ± {f.tolerance}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Block>
          {showAnswer && task.explanation && (
            <Block title="Explanation">
              <p>{task.explanation}</p>
            </Block>
          )}
        </>
      );
    case "scenario":
      return (
        <>
          {task.steps.map((step, s) => (
            <Block key={step.id} title={`Step ${s + 1}`}>
              <p className="mb-2">{step.question}</p>
              <ol className="space-y-1.5">
                {step.options.map((option, index) => (
                  <Choice key={index} index={index} text={option} correct={index === step.correctIndex} showAnswer={showAnswer} />
                ))}
              </ol>
              {showAnswer && step.explanation && <p className="mt-2 text-muted-foreground">{step.explanation}</p>}
            </Block>
          ))}
        </>
      );
    case "spot":
      return (
        <Block title={`Document (${task.segments.length} segments)`}>
          <ol className="space-y-1.5">
            {task.segments.map((seg) => {
              const flawed = showAnswer && seg.issue;
              return (
                <li
                  key={seg.id}
                  className={cn("rounded-md border px-3 py-2", flawed ? "border-destructive/40 bg-destructive/5" : "border-border")}
                >
                  <p>{seg.text}</p>
                  {flawed && <p className="mt-1 text-xs font-medium text-destructive">Issue: {seg.issue}</p>}
                </li>
              );
            })}
          </ol>
          {task.askExplanation && <p className="mt-2 text-xs text-muted-foreground">The learner also explains the worst issue in one line.</p>}
        </Block>
      );
    case "excel":
    case "allocate":
    case "sim":
    case "categorize":
    case "form":
      return <InteractivePreview task={task} showAnswer={showAnswer} />;
    case "terminal":
      return <TerminalPreview task={task} showAnswer={showAnswer} />;
    case "speak":
      return (
        <>
          <p className="font-mono text-xs text-muted-foreground">
            {task.title} · to {task.audience} · {task.prepSec} s to get ready, up to {task.maxSec} s speaking
          </p>
          <Block title="A good answer covers">
            <ul className="list-disc space-y-1 pl-5">
              {task.lookFor.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Block>
          <Block title="If there is no microphone">
            <p>{task.writtenFallback}</p>
          </Block>
          {showAnswer && (
            <Block title="What a strong answer does">
              <p>{task.explanation}</p>
            </Block>
          )}
        </>
      );
    case "roleplay":
      return (
        <>
          <Block title="Brief">
            <p>{task.brief}</p>
          </Block>
          <p className="font-mono text-xs text-muted-foreground">
            Scenario {task.scenarioId}, persona {task.personaId}, up to {task.maxTurns} turns{task.followUp ? ", then a follow-up email" : ""}
          </p>
          <Block title="Marking guide">
            <ul className="space-y-1.5">
              {task.rubric.map((r) => (
                <li key={r.label} className="rounded-md border px-3 py-2">
                  <span className="font-medium">{r.label}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{r.points} pt</span>
                  {showAnswer && r.description && <p className="mt-1 text-muted-foreground">{r.description}</p>}
                </li>
              ))}
            </ul>
          </Block>
        </>
      );
  }
}

/**
 * v4.3: the terminal, live, so the admin can type through it; with the answer shown, each step's
 * accepted patterns and the file checks.
 */
function TerminalPreview({ task, showAnswer }: { task: TerminalTask; showAnswer: boolean }) {
  const [value, setValue] = useState<TaskResponse | null>(null);
  return (
    <>
      <Block title="As the learner sees it">
        <TaskView task={toLearnerTask(task)} value={value} onChange={setValue} answer={showAnswer ? task : null} idPrefix="bank-preview-terminal" hidePrompt />
      </Block>
      {showAnswer && (
        <Block title="Accepted commands">
          <ol className="space-y-1.5">
            {task.steps.map((step, i) => (
              <li key={step.id} className="rounded-md border px-3 py-2">
                <span className="font-medium">
                  {i + 1}. {step.goal}
                </span>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{step.accept.map((a) => `/${a}/`).join("  or  ")}</p>
              </li>
            ))}
          </ol>
        </Block>
      )}
    </>
  );
}

/**
 * The spreadsheet, allocation grid and screen as the learner sees them, read-only. With the answer
 * shown: the solution's entries (Excel) or the right flags and answers (screen) filled in, with the
 * review panel under it.
 */
function InteractivePreview({ task, showAnswer }: { task: Extract<Task, { kind: "excel" | "allocate" | "sim" | "categorize" | "form" }>; showAnswer: boolean }) {
  const value =
    showAnswer && task.kind === "excel"
      ? { kind: "excel" as const, cells: task.solution }
      : showAnswer && task.kind === "sim"
        ? { kind: "sim" as const, flagged: task.rows.filter((r) => r.issue).map((r) => r.id), answers: Object.fromEntries(task.questions.map((q) => [q.id, q.correctIndex])) }
        : showAnswer && task.kind === "categorize"
          ? { kind: "categorize" as const, picks: task.answer }
          : showAnswer && task.kind === "form"
            ? { kind: "form" as const, values: task.sampleAnswer }
            : null;
  return (
    <Block title="As the learner sees it">
      <TaskView
        key={showAnswer ? "answer" : "plain"}
        task={toLearnerTask(task)}
        value={value}
        onChange={() => {}}
        readOnly
        // An allocation has no single answer key, only rules, so its review panel would grade an empty plan.
        answer={showAnswer && task.kind !== "allocate" ? task : null}
        idPrefix={`bank-preview-${task.kind}`}
        hidePrompt
      />
      {showAnswer && task.kind === "allocate" && task.explanation && <p className="mt-3 text-muted-foreground">{task.explanation}</p>}
    </Block>
  );
}
