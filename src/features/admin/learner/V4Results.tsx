import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronDown, RefreshCw, Shuffle, X } from "lucide-react";

import type { AssessmentSummary } from "@shared/assessment";
import type { ItemResponseV4, V4Result } from "@shared/assessmentV4";

import { api, ApiRequestError } from "@/api/client";
import { SkillReport } from "@/components/assessment/SkillReport";
import { ListenAndMark } from "./ListenAndMark";
import { SpeakReview } from "./SpeakReview";
import { RichText } from "@/components/content/RichText";
import { useConfirm } from "@/components/overlays";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMinutes } from "@shared/timing";
import { finishedLine } from "@/lib/timing";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  assessmentHeadline,
  canReplace,
  designedSeconds,
  describeFeedback,
  ORIGIN_LABELS,
  personalisationCounts,
  describeShortfalls,
  expectedTaskAnswer,
  formatItemScore,
  summariseTaskResponse,
  type V4AdminItem,
  type V4Detail,
} from "./v4Helpers";

/** Per assessment: its v4 detail, `legacy` when the server says it is the older format, or an error. */
export type V4Probe = V4Detail | "legacy" | { error: string };

export function isV4Detail(probe: V4Probe | undefined): probe is V4Detail {
  return typeof probe === "object" && "result" in probe;
}

/**
 * Loads `GET /api/admin/assessments/:id/v4` for every attempt that could be v4.
 *
 * Only v4 sittings (the summary's `format`) are asked about; legacy ones keep the older view.
 * Refetched whenever a status changes.
 */
export function useV4Details(assessments: readonly AssessmentSummary[]): {
  probes: Record<string, V4Probe>;
  /** Refetches one assessment's detail (after a swap or a regenerate). */
  reload: (assessmentId: string) => Promise<void>;
} {
  const [probes, setProbes] = useState<Record<string, V4Probe>>({});
  const candidates = useMemo(
    () => assessments.filter((a) => a.format === "v4" && a.status !== "generating"),
    [assessments],
  );
  const signature = candidates.map((a) => `${a.id}:${a.status}:${a.submittedAt ?? ""}`).join("|");

  useEffect(() => {
    if (!signature) return;
    const controller = new AbortController();
    for (const entry of signature.split("|")) {
      const id = entry.split(":")[0]!;
      api
        .get<V4Detail>(`/api/admin/assessments/${id}/v4`, controller.signal)
        .then((detail) => setProbes((current) => ({ ...current, [id]: detail })))
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          const probe: V4Probe =
            err instanceof ApiRequestError && err.status === 409
              ? "legacy"
              : { error: err instanceof ApiRequestError ? err.message : "Could not load this result." };
          setProbes((current) => ({ ...current, [id]: probe }));
        });
    }
    return () => controller.abort();
  }, [signature]);

  const reload = useCallback(async (assessmentId: string) => {
    try {
      const detail = await api.get<V4Detail>(`/api/admin/assessments/${assessmentId}/v4`);
      setProbes((current) => ({ ...current, [assessmentId]: detail }));
    } catch (err) {
      if (err instanceof ApiRequestError) notify.error(err.message);
    }
  }, []);

  return { probes, reload };
}

/**
 * The one line above a v4 sitting: "Assessment ready · 25 items · est. 29 min · AI cost $0.03", or
 * "Writing the assessment…" while it is generated in the background.
 */
export function V4Headline({ status, detail }: { status: string; detail: V4Detail | null }) {
  const line = assessmentHeadline({
    status,
    items: detail?.items.length ?? 0,
    estSeconds: detail ? designedSeconds(detail) : 0,
    costMicros: detail?.config.personalisation?.costMicros,
  });
  return (
    <p className="text-sm font-medium" role={status === "generating" ? "status" : undefined}>
      {line}
      {status === "generating" && (
        <span className="ml-2 font-normal text-muted-foreground">usually about a minute; this checks every 5 s</span>
      )}
    </p>
  );
}

/**
 * A v4 sitting for the admin: the learner's report by priority skill, then what only staff see —
 * the raw score, written answers still waiting for a grade, bank shortfalls — and every question
 * behind an expander, because this view is the answer key.
 */
export function V4Results({
  detail,
  assessmentId,
  status,
  onChanged,
}: {
  detail: V4Detail;
  assessmentId: string;
  /** The assessment's status: Swap and Regenerate only while it is ready or running. */
  status: string;
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const { result, items } = detail;
  const report = detail.config.personalisation;
  const finished = finishedLine(result.finishedSeconds, result.estSeconds ?? designedSeconds(detail));
  const shortfalls = describeShortfalls(detail.config.shortfalls ?? [], result);
  const sorted = useMemo(() => [...items].sort((a, b) => a.position - b.position), [items]);
  const listId = `v4-questions-${assessmentId}`;
  const started = result.answered > 0 || items.some((i) => i.state !== "unanswered");

  return (
    <div className="space-y-4">
      <V4Headline status={status} detail={detail} />
      {finished && !started && <p className="font-mono text-xs text-muted-foreground tabular">{finished}</p>}
      {report && <PersonalisationSummary report={report} />}

      {started && (
        <SkillReport
          report={result}
          title="Skill by skill"
          subtitle="What the learner sees: levels 0 to 5 by priority skill, with no overall percentage."
        />
      )}
      {started && <PathFindings result={result} />}

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Staff-only figures">
        <Stat label="Raw score" value={started ? `${result.rawScore}%` : "—"} />
        <Stat label="Answered" value={`${result.answered}/${result.total}`} />
        <Stat label="Written, pending" value={String(result.pendingWritten)} warn={result.pendingWritten > 0} />
        <Stat label="Questions missing" value={String(shortfalls.length)} warn={shortfalls.length > 0} />
      </dl>

      {shortfalls.length > 0 && (
        <div className="rounded-md border border-trailmark/40 bg-trailmark/[0.06] px-3 py-2 text-sm">
          <p className="font-medium">We didn't have enough ready questions for every part of the test</p>
          <ul className="mt-1 space-y-0.5 font-mono text-xs text-muted-foreground">
            {shortfalls.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <ListenAndMark assessmentId={assessmentId} items={sorted} onChanged={onChanged} />

      {sorted.length > 0 && (
        <div className="rounded-md border">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={listId}
            className="flex w-full items-center gap-2 rounded-md px-4 py-3 text-left text-sm font-medium hover:bg-surface-sunken/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-strong"
          >
            {open ? "Hide questions and answers" : `Show all ${sorted.length} questions and answers`}
            <ChevronDown className={cn("ml-auto size-4 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden="true" />
          </button>
          {open && (
            <ol id={listId} className="space-y-3 border-t p-3 sm:p-4">
              {sorted.map((item) => (
                <QuestionCard key={item.id} item={item} assessmentId={assessmentId} status={status} onChanged={onChanged} />
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

/** What the AI took from the setup and where the 25 came from. Compact; the fallback in amber. */
function PersonalisationSummary({ report }: { report: NonNullable<V4Detail["config"]["personalisation"]> }) {
  return (
    <div className="rounded-md border px-3 py-2.5 text-sm">
      <p className="text-xs text-muted-foreground">
        Personalisation: {report.level}
        {report.understandingSource === "rules" ? " · rules only" : ""}
      </p>
      {report.intent.length > 0 && (
        <ul className="mt-1.5 list-disc space-y-0.5 pl-4 marker:text-muted-foreground">
          {report.intent.slice(0, 5).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      <p className="mt-1.5 font-mono text-xs text-muted-foreground tabular">{personalisationCounts(report)}</p>
      {report.fallbackReason && (
        <p className="mt-2 flex items-start gap-1.5 rounded-sm border border-warning/40 bg-warning/[0.07] px-2 py-1.5 text-xs text-warning-strong">
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {report.fallbackReason}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("font-display text-lg leading-tight font-semibold tabular", warn && "text-warning-strong")}>{value}</dd>
    </div>
  );
}

const TYPE_LABELS: Record<V4AdminItem["type"], string> = { coding: "coding", mcq: "multiple choice", task: "task" };

function QuestionCard({
  item,
  assessmentId,
  status,
  onChanged,
}: {
  item: V4AdminItem;
  assessmentId: string;
  status: string;
  onChanged: () => Promise<void>;
}) {
  const confirm = useConfirm();
  const [busy, setBusy] = useState<"swap" | "regenerate" | null>(null);
  const submitted = item.state === "submitted";
  const replaceable = canReplace(status, item);

  const replace = async (action: "swap" | "regenerate") => {
    const ok = await confirm({
      title: action === "swap" ? `Swap question ${item.position + 1}?` : `Regenerate question ${item.position + 1}?`,
      body:
        action === "swap"
          ? "It is replaced with another question from the library for the same skill and type. Any draft the learner has on it is cleared."
          : "The AI writes a new one for the same skill and type (one small call). If it fails its checks, the old one is kept. Any draft the learner has on it is cleared.",
      confirmLabel: action === "swap" ? "Swap it" : "Regenerate it",
    });
    if (!ok) return;
    setBusy(action);
    try {
      await api.post(`/api/admin/assessments/${assessmentId}/items/${item.id}/${action}`);
      notify.success(action === "swap" ? "Question swapped." : "Question regenerated.");
      await onChanged();
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "That did not work. Try again.");
    } finally {
      setBusy(null);
    }
  };
  const response: ItemResponseV4 | null = item.response ?? item.draft;
  const score = formatItemScore(item.score, item.state, item.verdict);
  const feedback = [
    ...describeFeedback(item.feedback),
    ...(item.verdictNote && !(item.feedback ?? "").includes(item.verdictNote) ? [item.verdictNote] : []),
    ...(item.reviewStatus === "overridden" ? ["Full marks given after a review."] : item.reviewStatus === "requested" ? ["The learner asked for a review."] : []),
  ];
  const tone =
    item.score === null ? "text-muted-foreground" : item.score >= 0.5 ? "text-summit-strong" : "text-destructive";

  return (
    <li className={cn("rounded-md border px-3 py-3 sm:px-4", !submitted && "border-dashed")}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground">
        <span className="tabular">#{item.position + 1}</span>
        <Badge variant="outline">{TYPE_LABELS[item.type]}</Badge>
        <span>{item.skillName}</span>
        <span>difficulty {item.difficulty}/5</span>
        {item.origin && (
          <span
            className={cn(
              "rounded-sm border px-1.5 py-px text-[11px]",
              item.origin === "generated" && "border-ridge/50 text-ridge-strong",
              item.origin === "fallback" && "border-trailmark/50 text-trailmark-strong",
            )}
          >
            {ORIGIN_LABELS[item.origin]}
          </span>
        )}
        {item.estSeconds ? (
          <span className="tabular" title="Designed time, and the time they actually spent when known">
            est. {formatMinutes(item.estSeconds)}
            {item.activeMs ? ` · took ${formatMinutes(Math.round(item.activeMs / 1000))}` : ""}
          </span>
        ) : null}
        {!submitted && response && <span>draft, not submitted</span>}
        <span className={cn("ml-auto tabular", tone)}>{score}</span>
      </div>

      <RichText text={item.prompt} className="mt-3" />

      {replaceable && (
        <div className="mt-2 flex flex-wrap gap-1">
          <Button variant="ghost" size="sm" loading={busy === "swap"} disabled={busy !== null} onClick={() => void replace("swap")}>
            <Shuffle aria-hidden="true" />
            Swap
          </Button>
          <Button variant="ghost" size="sm" loading={busy === "regenerate"} disabled={busy !== null} onClick={() => void replace("regenerate")}>
            <RefreshCw aria-hidden="true" />
            Regenerate
          </Button>
        </div>
      )}

      <div className="mt-3">
        <Response item={item} response={response} />
      </div>

      {feedback.length > 0 && (
        <div className="mt-3 rounded-md border border-ridge/40 bg-ridge/6 px-3 py-2 text-sm">
          <p className="font-medium">Feedback</p>
          <ul className="mt-1 space-y-0.5 text-muted-foreground">
            {feedback.map((line, i) => (
              <li key={i} className="break-words">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] text-muted-foreground">{children}</p>;
}

function Lines({ lines }: { lines: string[] }) {
  return (
    <ul className="mt-1 space-y-0.5 text-sm">
      {lines.map((line, i) => (
        <li key={i} className="break-words">
          {line}
        </li>
      ))}
    </ul>
  );
}

function Response({ item, response }: { item: V4AdminItem; response: ItemResponseV4 | null }) {
  if (!response) return <p className="text-sm text-muted-foreground">No answer.</p>;
  if ("unknown" in response) return <p className="text-sm text-muted-foreground">Answered “I don't know yet”.</p>;

  if (item.type === "mcq") {
    const chosen = "choice" in response ? response.choice : null;
    const correct = item.answer && "correctIndex" in item.answer ? item.answer.correctIndex : null;
    return (
      <>
        {item.snippet && (
          <pre className="mb-3 overflow-x-auto rounded-md border bg-editor px-3 py-2 font-mono text-xs leading-relaxed text-editor-foreground">
            <code>{item.snippet}</code>
          </pre>
        )}
        <ol className="space-y-1 text-sm">
          {item.options.map((option, i) => {
            const isCorrect = i === correct;
            const picked = i === chosen;
            return (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-2 rounded-sm px-1.5 py-0.5",
                  isCorrect && "font-medium text-summit-strong",
                  picked && !isCorrect && "bg-destructive/[0.07] text-destructive",
                  picked && isCorrect && "bg-summit/8",
                )}
              >
                {isCorrect ? (
                  <Check className="mt-0.5 size-3.5 shrink-0" aria-label="Correct answer" />
                ) : picked ? (
                  <X className="mt-0.5 size-3.5 shrink-0" aria-label="Chose this" />
                ) : (
                  <span className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {option}
                  {picked && <span className="ml-2 font-mono text-[11px] text-muted-foreground">they chose this</span>}
                </span>
              </li>
            );
          })}
        </ol>
        {item.answer && "explanation" in item.answer && item.answer.explanation && (
          <p className="mt-3 border-l-2 border-basalt/40 pl-3 text-sm text-muted-foreground">{item.answer.explanation}</p>
        )}
      </>
    );
  }

  if ("code" in response) {
    return (
      <>
        <Label>
          What they submitted{item.type === "coding" ? ` (${item.language})` : ""}
        </Label>
        <pre
          className="mt-1 max-h-96 overflow-auto rounded-md border bg-editor px-3 py-2 font-mono text-xs leading-relaxed text-editor-foreground"
          aria-label="Submitted code, read only"
        >
          <code>{response.code || "(empty)"}</code>
        </pre>
      </>
    );
  }

  if ("task" in response && item.type === "task" && response.task.kind === "speak") {
    return <SpeakReview response={response.task} feedback={item.feedback} />;
  }

  if ("task" in response && item.type === "task") {
    const expected = item.answer && "task" in item.answer ? expectedTaskAnswer(item.answer.task) : [];
    return (
      <div className="space-y-3">
        <div>
          <Label>Their response</Label>
          {response.task.kind === "write" && response.task.text.trim() && (
            <p className="mt-1 whitespace-pre-wrap rounded-md border bg-surface-sunken/30 px-3 py-2 text-sm leading-relaxed">
              {response.task.text}
            </p>
          )}
          <Lines lines={summariseTaskResponse(item.task, response.task)} />
        </div>
        {expected.length > 0 && (
          <div>
            <Label>{item.task.kind === "write" || item.task.kind === "roleplay" ? "Marking guide" : item.task.kind === "form" ? "Exact checks and marking guide" : "Expected"}</Label>
            <div className="text-summit-strong">
              <Lines lines={expected} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">The answer does not match this question type.</p>;
}

/**
 * v4.3: what the evaluation means for the path. Missing links are prerequisites below the level
 * their goals need ("Promises & async/await 1/5 → needed 3/5 for Backend"); met goals are skipped.
 */
function PathFindings({ result }: { result: V4Result }) {
  const links = result.missingLinks ?? [];
  const met = result.metGoals ?? [];
  if (links.length === 0 && met.length === 0) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {links.length > 0 && (
        <section aria-labelledby="missing-links-heading" className="rounded-md border border-trailmark/40 bg-trailmark/[0.05] px-3 py-2">
          <h4 id="missing-links-heading" className="text-sm font-medium">
            Missing links
          </h4>
          <ul className="mt-1 space-y-0.5 font-mono text-xs">
            {links.map((link) => (
              <li key={link.skillId}>
                {link.skillName} {link.mastery == null ? "not measured" : `${link.mastery}/5`} → needed {link.neededLevel}/5 for {link.forGoal}
              </li>
            ))}
          </ul>
        </section>
      )}
      {met.length > 0 && (
        <section aria-labelledby="met-goals-heading" className="rounded-md border px-3 py-2">
          <h4 id="met-goals-heading" className="text-sm font-medium">
            Already at the goal level
          </h4>
          <ul className="mt-1 space-y-0.5 font-mono text-xs text-muted-foreground">
            {met.map((m) => (
              <li key={m.skillId}>
                {m.skillName} {m.mastery}/5 (goal {m.neededLevel}/5){m.optionalAdvanced ? " · advanced course optional" : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
