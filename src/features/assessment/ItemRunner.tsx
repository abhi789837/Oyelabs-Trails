import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Play } from "lucide-react";

import type { AnswerRequest, ServedItem } from "@shared/assessment";

import { CodeEditor } from "@/components/challenge/CodeEditor";
import { InlineText, RichText } from "@/components/content/RichText";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { runVisibleTests, type LocalRunOutcome } from "@/lib/codeRunner";
import { seededOrder } from "@/lib/shuffle";
import { cn } from "@/lib/utils";

/**
 * One assessment item, for every kind in §9.3.
 *
 * Three rules shape this component:
 *
 * - **No feedback.** Submitting moves on; nothing here can tell the learner whether they were
 *   right, because that would let them binary-search their own level.
 * - **No going back.** There is one item on screen and one button.
 * - **No paste, anywhere.** Including code items — brief §18 answer 3. The handler is here as
 *   well as in the proctor engine so the field itself refuses it even if the engine is starting up.
 */
export interface ItemRunnerProps {
  item: ServedItem;
  /** Seconds left on this item, from the server's `expiresAt`. */
  secondsLeft: number;
  submitting: boolean;
  onSubmit: (answer: AnswerRequest) => void;
}

export function ItemRunner({ item, secondsLeft, submitting, onSubmit }: ItemRunnerProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [text, setText] = useState("");
  const [code, setCode] = useState(item.payload.starterCode ?? "");
  const [localRun, setLocalRun] = useState<LocalRunOutcome | null>(null);
  const [running, setRunning] = useState(false);

  // Reset when the item changes: a stale answer must never carry across.
  useEffect(() => {
    setSelected([]);
    setText("");
    setCode(item.payload.starterCode ?? "");
    setLocalRun(null);
  }, [item.id, item.payload.starterCode]);

  const multi = item.kind === "multi";
  const options = item.payload.options ?? [];

  // Shuffled for display; the original indices are what gets sent, so the server never needs to
  // know about the shuffle.
  const order = useMemo(() => seededOrder(options.length, item.id), [options.length, item.id]);

  const blockPaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
  };

  const answered =
    item.kind === "code"
      ? code.trim().length > 0 && code !== item.payload.starterCode
      : options.length > 0
        ? selected.length > 0
        : text.trim().length > 0;

  const handleSubmit = () => {
    if (submitting) return;
    if (options.length > 0) onSubmit({ selected });
    else if (item.kind === "code") onSubmit({ code });
    else onSubmit({ text });
  };

  const handleRunTests = async () => {
    if (!item.payload.functionName) return;
    setRunning(true);
    try {
      setLocalRun(
        await runVisibleTests(code, {
          instructions: "",
          starterCode: item.payload.starterCode ?? "",
          functionName: item.payload.functionName,
          visibleTests: item.payload.visibleTests ?? [],
          hiddenTestCount: 0,
        }),
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="select-none">
      <RichText text={item.payload.prompt} size="base" className="max-w-prose text-[1.0625rem]" />

      {options.length > 0 && (
        <fieldset className="mt-6">
          <legend className="sr-only">Answer</legend>
          {multi ? (
            <div className="space-y-2" role="group">
              {order.map((index) => (
                <OptionRow key={index} checked={selected.includes(index)}>
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--trailmark))]"
                    checked={selected.includes(index)}
                    onChange={() =>
                      setSelected((current) =>
                        current.includes(index) ? current.filter((i) => i !== index) : [...current, index],
                      )
                    }
                  />
                  <InlineText text={options[index]} />
                </OptionRow>
              ))}
            </div>
          ) : (
            <RadioGroup
              value={selected[0] === undefined ? "" : String(selected[0])}
              onValueChange={(value) => setSelected([Number(value)])}
              className="space-y-2"
            >
              {order.map((index) => (
                <OptionRow key={index} checked={selected[0] === index}>
                  <RadioGroupItem value={String(index)} id={`${item.id}-${index}`} className="mt-0.5 shrink-0" />
                  <InlineText text={options[index]} />
                </OptionRow>
              ))}
            </RadioGroup>
          )}
        </fieldset>
      )}

      {item.kind === "predict_output" && (
        <div className="mt-6">
          <label htmlFor={`${item.id}-output`} className="text-sm font-medium">
            What does it print?
          </label>
          <textarea
            id={`${item.id}-output`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={blockPaste}
            rows={4}
            spellCheck={false}
            className="mt-2 w-full rounded-md border border-input bg-editor px-3 py-2 font-mono text-sm text-editor-foreground"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Extra spaces and trailing blank lines are ignored, so match the content, not the layout.
          </p>
        </div>
      )}

      {item.kind === "explain" && (
        <div className="mt-6">
          <label htmlFor={`${item.id}-explain`} className="text-sm font-medium">
            Your answer
          </label>
          <textarea
            id={`${item.id}-explain`}
            value={text}
            maxLength={item.payload.maxChars ?? 1200}
            onChange={(e) => setText(e.target.value)}
            onPaste={blockPaste}
            rows={10}
            className="mt-2 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm leading-relaxed"
          />
          <p className="mt-1.5 text-right font-mono text-xs text-muted-foreground tabular">
            {text.length} / {item.payload.maxChars ?? 1200}
          </p>
        </div>
      )}

      {item.kind === "code" && (
        <div className="mt-6" onPaste={blockPaste}>
          <CodeEditor value={code} onChange={setCode} fileName={`${item.payload.functionName}.js`} />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => void handleRunTests()} disabled={running}>
              {running ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Play aria-hidden="true" />}
              Run the example tests
            </Button>
            <span className="font-mono text-xs text-muted-foreground">
              {item.payload.visibleTests?.length ?? 0} examples. More are checked when you submit.
            </span>
          </div>

          {localRun && (
            <ul className="mt-3 divide-y rounded-md border text-sm">
              {localRun.results.map((result, index) => (
                <li key={index} className="flex items-start gap-2 px-3 py-2">
                  <span className={cn("font-mono text-xs", result.passed ? "text-summit-strong" : "text-destructive")}>
                    {result.passed ? "pass" : "fail"}
                  </span>
                  <span>{result.description}</span>
                </li>
              ))}
            </ul>
          )}
          {localRun?.compileError && (
            <p className="mt-2 font-mono text-xs text-destructive">{localRun.compileError}</p>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4 border-t pt-6">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          {submitting ? "Saving…" : answered ? "Submit and continue" : "Skip this question"}
        </Button>
        <p className="font-mono text-xs text-muted-foreground" aria-live="off">
          {secondsLeft > 0 ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")} on this question` : "Time is up"}
        </p>
        <p className="w-full text-xs text-muted-foreground">
          You cannot come back to a question once you move on, and you will not be told whether you were right.
        </p>
      </div>
    </div>
  );
}

function OptionRow({ checked, children }: { checked: boolean; children: React.ReactNode }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors",
        checked ? "border-trailmark bg-trailmark/[0.07]" : "hover:bg-surface-sunken/60",
      )}
    >
      {children}
    </label>
  );
}
