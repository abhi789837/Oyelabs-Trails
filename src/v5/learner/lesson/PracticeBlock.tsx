import { useId, useState } from "react";
import { CheckCircle2, CircleDashed, ListChecks, RotateCcw, XCircle } from "lucide-react";

import { quizAnswerIsRight, type PracticeBlock, type PracticeQuiz, type PracticeTask } from "@/lib/practiceBlocks";
import { Button } from "@/v5/design/components/Button";
import { cn } from "@/v5/design/cn";

import { InlineMarkdown } from "./LessonRich";

/**
 * A quick check or a task written in the admin block editor (```quiz / ```task in the lesson text),
 * drawn inside the reading. Both are practice: nothing is graded on the server or saved. The
 * answer is checked here, with the author's explanation.
 */
export default function PracticeBlockView({ block }: { block: PracticeBlock }) {
  return block.kind === "quiz" ? <InlineQuickCheck quiz={block} /> : <TaskCard task={block} />;
}

function InlineQuickCheck({ quiz }: { quiz: PracticeQuiz }) {
  const id = useId();
  const multi = quiz.correct.length > 1;
  const [chosen, setChosen] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const right = checked && quizAnswerIsRight(quiz, chosen);

  const toggle = (i: number) => {
    if (checked) return;
    setChosen((c) => (multi ? (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]) : [i]));
  };

  return (
    <section aria-labelledby={`${id}-q`} className="not-prose my-2 rounded-card border border-line-1 bg-surface-1 p-4" data-testid="practice-quiz">
      <p className="flex items-center gap-2 text-small font-semibold text-brand-fg">
        <ListChecks className="size-4" aria-hidden="true" /> Quick check
      </p>
      <fieldset className="mt-2">
        <legend id={`${id}-q`} className="text-body font-medium text-fg-1">
          <InlineMarkdown text={quiz.question} />
        </legend>
        {multi ? <p className="mt-0.5 text-small text-fg-2">Choose all that apply.</p> : null}
        <div className="mt-3 flex flex-col gap-1.5">
          {quiz.options.map((option, i) => {
            const isChosen = chosen.includes(i);
            const isRight = quiz.correct.includes(i);
            return (
              <label
                key={i}
                className={cn(
                  "flex min-h-(--v5-row-h) cursor-pointer items-center gap-3 rounded-control border px-3 py-2 text-body has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                  checked && isRight ? "border-success/50 bg-success-soft" : checked && isChosen ? "border-danger/40 bg-danger-soft" : isChosen ? "border-brand bg-brand-soft" : "border-line-1 hover:bg-sunken",
                  checked && "cursor-default",
                )}
              >
                <input
                  type={multi ? "checkbox" : "radio"}
                  name={`${id}-options`}
                  className="size-4 accent-[rgb(var(--v5-brand))]"
                  checked={isChosen}
                  onChange={() => toggle(i)}
                  disabled={checked}
                />
                <span className="min-w-0 flex-1">
                  <InlineMarkdown text={option} />
                </span>
                {checked && isRight ? <span className="text-small font-medium text-success-fg">Right answer</span> : null}
              </label>
            );
          })}
        </div>
      </fieldset>
      {checked ? (
        <div role="status" className="mt-3 flex flex-col gap-2">
          <p className={cn("flex items-center gap-2 text-small font-semibold", right ? "text-success-fg" : "text-danger-fg")}>
            {right ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <XCircle className="size-4" aria-hidden="true" />}
            {right ? "That's right." : "Not quite."}
          </p>
          {quiz.why ? (
            <p className="text-small text-fg-1">
              <InlineMarkdown text={quiz.why} />
            </p>
          ) : null}
          <div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setChecked(false);
                setChosen([]);
              }}
            >
              <RotateCcw aria-hidden="true" /> Try again
            </Button>
          </div>
        </div>
      ) : (
        <Button className="mt-3" size="sm" variant="secondary" disabled={chosen.length === 0} onClick={() => setChecked(true)}>
          Check my answer
        </Button>
      )}
    </section>
  );
}

function TaskCard({ task }: { task: PracticeTask }) {
  const id = useId();
  const [done, setDone] = useState(false);
  return (
    <section aria-labelledby={`${id}-t`} className="not-prose my-2 rounded-card border border-line-1 bg-surface-1 p-4" data-testid="practice-task">
      <h3 id={`${id}-t`} className="flex items-center gap-2 text-small font-semibold text-brand-fg">
        {done ? <CheckCircle2 className="size-4 text-success-fg" aria-hidden="true" /> : <CircleDashed className="size-4" aria-hidden="true" />} Try this
      </h3>
      <p className="mt-2 text-body text-fg-1">
        <InlineMarkdown text={task.instructions} />
      </p>
      {task.doneWhen ? (
        <p className="mt-2 text-small text-fg-2">
          <span className="font-semibold text-fg-1">Done when: </span>
          <InlineMarkdown text={task.doneWhen} />
        </p>
      ) : null}
      <Button className="mt-3" size="sm" variant={done ? "ghost" : "secondary"} aria-pressed={done} onClick={() => setDone((d) => !d)}>
        <CheckCircle2 aria-hidden="true" /> {done ? "Done" : "I've done this"}
      </Button>
    </section>
  );
}
