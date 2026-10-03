import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, X } from "lucide-react";

import { fileCheckPasses, runTerminal, TERMINAL_UNKNOWN } from "@shared/tasks";

import { cn } from "@/lib/utils";

import type { TaskComponentProps } from "./types";

/** The response schema's cap; the input stops there rather than failing the save. */
const MAX_COMMANDS = 40;

/**
 * v4.3: a scripted fake terminal. The learner types commands at a prompt; each one is played through
 * `runTerminal` (the grader's own function), which prints the step's output when it matches the next
 * step and "command not handled in this exercise" otherwise, followed by a hint: the goal of the step
 * they are on. Optional files open in tabs above the terminal and are edited in a plain textarea.
 *
 * Up and Down recall earlier commands, `clear` clears the screen (it is not sent). Review mode adds
 * each step's goal and output and the file checks.
 */
export function TerminalTask({ task, value, onChange, readOnly, answer, idPrefix }: TaskComponentProps<"terminal">) {
  const commands = useMemo(() => value?.commands ?? [], [value]);
  const edited = useMemo(() => value?.files ?? {}, [value]);
  const [input, setInput] = useState("");
  /** Commands before this index are hidden after `clear` (the screen only; they still count). */
  const [clearedAt, setClearedAt] = useState(0);
  const [recall, setRecall] = useState<number | null>(null);
  const [activeFile, setActiveFile] = useState(0);
  const screenRef = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, "");
  const inputId = `${idPrefix}-terminal-${uid}`;

  const run = useMemo(() => runTerminal(task, commands), [task, commands]);
  const done = run.nextStepId === null;
  const fileContent = (path: string) => edited[path] ?? task.files.find((f) => f.path === path)?.content ?? "";

  /* The step that was pending when each command ran, for the hint after a wrong one. */
  const lines = useMemo(() => {
    let at = 0;
    return run.lines.map((line) => {
      const pending = task.steps[at];
      if (line.stepId) at += 1;
      return { ...line, hint: line.stepId ? null : (pending?.goal ?? null) };
    });
  }, [run, task.steps]);

  useEffect(() => {
    const node = screenRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lines.length, clearedAt]);

  const emit = (next: { commands?: string[]; files?: Record<string, string> }) =>
    onChange({ kind: "terminal", commands: next.commands ?? commands, files: next.files ?? edited });

  const submit = () => {
    const command = input.trim();
    setInput("");
    setRecall(null);
    if (!command || readOnly) return;
    if (command === "clear") {
      setClearedAt(commands.length);
      return;
    }
    if (commands.length >= MAX_COMMANDS) return;
    emit({ commands: [...commands, command.slice(0, 300)] });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    } else if (event.key === "ArrowUp" && commands.length) {
      event.preventDefault();
      const next = recall === null ? commands.length - 1 : Math.max(0, recall - 1);
      setRecall(next);
      setInput(commands[next]);
    } else if (event.key === "ArrowDown" && recall !== null) {
      event.preventDefault();
      const next = recall + 1;
      if (next >= commands.length) {
        setRecall(null);
        setInput("");
      } else {
        setRecall(next);
        setInput(commands[next]);
      }
    }
  };

  const file = task.files[activeFile] ?? null;
  const tabId = (i: number) => `${idPrefix}-file-tab-${uid}-${i}`;
  const panelId = `${idPrefix}-file-panel-${uid}`;

  return (
    <div className="space-y-4">
      <p className="font-display text-sm font-semibold">{task.title}</p>

      {task.files.length > 0 && file && (
        <div className="overflow-hidden rounded-md border">
          <div role="tablist" aria-label="Files" className="flex flex-wrap gap-px border-b bg-surface-sunken/60">
            {task.files.map((f, i) => (
              <button
                key={f.path}
                id={tabId(i)}
                type="button"
                role="tab"
                aria-selected={i === activeFile}
                aria-controls={panelId}
                tabIndex={i === activeFile ? 0 : -1}
                onClick={() => setActiveFile(i)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                  e.preventDefault();
                  const next = (i + (e.key === "ArrowRight" ? 1 : -1) + task.files.length) % task.files.length;
                  setActiveFile(next);
                  document.getElementById(tabId(next))?.focus();
                }}
                className={cn(
                  "px-3 py-1.5 font-mono text-xs focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-trailmark",
                  i === activeFile ? "bg-surface font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.path}
              </button>
            ))}
          </div>
          <div id={panelId} role="tabpanel" aria-labelledby={tabId(activeFile)}>
            <label htmlFor={`${panelId}-editor`} className="sr-only">
              Edit {file.path}
            </label>
            <textarea
              id={`${panelId}-editor`}
              value={fileContent(file.path)}
              readOnly={readOnly}
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              rows={Math.min(18, Math.max(6, fileContent(file.path).split("\n").length + 1))}
              onChange={(e) => emit({ files: { ...edited, [file.path]: e.target.value.slice(0, 4000) } })}
              className="block w-full resize-y bg-editor px-3 py-2 font-mono text-[13px] leading-relaxed text-editor-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-trailmark"
            />
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-md border bg-editor text-editor-foreground">
        <div
          ref={screenRef}
          role="log"
          aria-live="polite"
          aria-label="Terminal output"
          className="max-h-80 min-h-32 overflow-y-auto px-3 py-2 font-mono text-[13px] leading-relaxed"
        >
          {clearedAt === 0 && task.intro && <pre className="whitespace-pre-wrap break-words opacity-80">{task.intro}</pre>}
          {lines.slice(clearedAt).map((line, i) => (
            <div key={clearedAt + i} className="mt-1">
              <p className="break-words">
                <span className="text-summit">{task.cwd}</span> <span aria-hidden="true">$</span>{" "}
                <span className="font-medium">{line.command}</span>
              </p>
              {line.output && (
                <pre className={cn("whitespace-pre-wrap break-words", line.stepId ? "opacity-90" : "text-trailmark")}>
                  {line.stepId ? line.output : TERMINAL_UNKNOWN}
                </pre>
              )}
              {line.hint && !readOnly && <p className="text-xs opacity-70">Hint: {line.hint}</p>}
            </div>
          ))}
          {done && commands.length > 0 && <p className="mt-2 text-summit">All steps done.</p>}
        </div>
        <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2 font-mono text-[13px]">
          <label htmlFor={inputId} className="shrink-0">
            <span className="text-summit">{task.cwd}</span> <span aria-hidden="true">$</span>
            <span className="sr-only"> Type a command and press Enter</span>
          </label>
          <input
            id={inputId}
            value={input}
            disabled={readOnly || commands.length >= MAX_COMMANDS}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-editor-foreground outline-none placeholder:opacity-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trailmark"
            placeholder={readOnly ? "" : "type a command"}
          />
        </div>
      </div>
      <p className="font-mono text-xs text-muted-foreground" aria-live="polite">
        {run.met.length} of {task.steps.length} steps done
        {task.fileChecks.length > 0 && ` · ${task.fileChecks.length} file${task.fileChecks.length === 1 ? "" : "s"} checked`}
        {commands.length >= MAX_COMMANDS && " · command limit reached"}
      </p>

      {answer && (
        <div className="space-y-3 rounded-md border bg-surface-sunken/50 px-4 py-3 text-sm">
          <ol className="space-y-2">
            {answer.steps.map((step, i) => {
              const met = run.met.includes(step.id);
              return (
                <li key={step.id}>
                  <p className={cn("flex items-center gap-1.5 font-medium", met ? "text-summit-strong" : "text-destructive")}>
                    {met ? <Check className="size-4" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
                    {i + 1}. {step.goal}
                  </p>
                  {step.output && <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">{step.output}</pre>}
                </li>
              );
            })}
          </ol>
          {answer.fileChecks.length > 0 && (
            <ul className="space-y-1">
              {answer.fileChecks.map((check) => {
                const ok = fileCheckPasses(check, fileContent(check.path));
                return (
                  <li key={check.path} className={cn("flex items-center gap-1.5", ok ? "text-summit-strong" : "text-destructive")}>
                    {ok ? <Check className="size-4" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
                    <span className="font-mono text-xs">{check.path}</span>
                    {!ok && check.mustNotContain.length > 0 && (
                      <span className="text-xs text-muted-foreground">must not contain {check.mustNotContain.join(" ")}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {answer.explanation && <p className="text-muted-foreground">{answer.explanation}</p>}
        </div>
      )}
    </div>
  );
}
