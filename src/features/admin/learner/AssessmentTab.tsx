import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Eye, LoaderCircle, Terminal, X } from "lucide-react";
import { Link } from "react-router-dom";

import { AUTO_APPROVE_AFTER_MS, type AssessmentSummary, type ItemKey, type ItemPayload } from "@shared/assessment";
import type { ItemKind } from "@shared/enums";

import { api, ApiRequestError } from "@/api/client";
import { RichText } from "@/components/content/RichText";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatTimestamp } from "@/lib/utils";
import { ApprovalBanner, approvalNote } from "../ApprovalGate";
import { GenerationLog } from "../GenerationLog";
import { AdaptivePath, type AdaptiveStep } from "./AdaptivePath";

/** One served item, as `/api/admin/assessments/:id/answers` returns it. */
interface AnsweredItem {
  id: string;
  area: string;
  kind: ItemKind;
  difficulty: number;
  status: string;
  topicIds: string[];
  payload: ItemPayload;
  key: ItemKey;
  response: { selected?: number[]; text?: string; code?: string } | null;
  /** 0..100, or null for an item the rubric grader handles. */
  autoScore: number | null;
  aiScore: number | null;
  aiFeedback: string | null;
  timeMs: number | null;
}

/** The selector's per-area staircase state, as stored on the assessment config. */
interface SelectorState {
  areas: { area: string; theta: number; served: string[]; outcomes: boolean[]; stopped: boolean }[];
}

interface AnswersResponse {
  items: AnsweredItem[];
  selector: SelectorState | null;
}

/** Statuses that mean an attempt is still in flight, so re-issuing would double-book the learner. */
const LIVE_STATUSES = ["generating", "awaiting_approval", "ready", "in_progress", "submitted", "evaluating"];

/**
 * The assessment tab (brief §13): every attempt, and for each one every item the learner was
 * actually served with their answer next to the key.
 *
 * Deliberately collapsed by default — this view *is* the answer key, so opening it should be a
 * decision rather than something that happens by scrolling past.
 */
export function AssessmentTab({
  userId,
  assessments,
  onChanged,
}: {
  userId: string;
  assessments: AssessmentSummary[];
  onChanged: () => Promise<void>;
}) {
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [logId, setLogId] = useState<string | null>(null);
  const autoOpened = useRef(new Set<string>());

  /**
   * A run that is generating right now is the one log worth opening by itself: the admin clicked
   * "Issue assessment" seconds ago and would otherwise watch a status badge for several minutes.
   * Remembered per assessment, so closing it does not immediately reopen it on the next refresh.
   */
  const generatingId = assessments.find((a) => a.status === "generating")?.id ?? null;
  useEffect(() => {
    if (!generatingId || autoOpened.current.has(generatingId)) return;
    autoOpened.current.add(generatingId);
    setLogId(generatingId);
  }, [generatingId]);

  const handleIssue = async () => {
    setIssuing(true);
    setError(null);
    setNotice(null);
    try {
      await api.post(`/api/admin/users/${userId}/assessments`, {});
      await onChanged();
      setNotice(
        `Assessment queued. Generation runs in the background and usually takes a few minutes, then it waits ${Math.round(
          AUTO_APPROVE_AFTER_MS / 60_000,
        )} minutes for your approval before going out on its own.`,
      );
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not issue an assessment.");
    } finally {
      setIssuing(false);
    }
  };

  return (
    <section aria-label="Placement assessment">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-lg font-semibold">Placement assessment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {assessments.length === 0
              ? "None issued yet. Generating one reads the profile notes, so make sure they say what you know."
              : `${assessments.length} attempt${assessments.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        {!assessments.some((a) => LIVE_STATUSES.includes(a.status)) && (
          <Button variant="outline" onClick={() => void handleIssue()} disabled={issuing}>
            {issuing && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {assessments.length === 0 ? "Issue assessment" : "Re-issue assessment"}
          </Button>
        )}
      </div>

      {notice && (
        <p className="mt-4 rounded-md border border-summit/40 bg-summit/[0.07] px-3 py-2 text-sm" role="status">
          {notice}
        </p>
      )}
      {error && (
        <div className="mt-4">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      {assessments.length > 0 && (
        <ul className="mt-6 space-y-3">
          {assessments.map((assessment) => {
            const dropped = assessment.itemCounts.dropped ?? 0;
            // Items leave "pool" as they are served, so the generated total is everything but the
            // rejects — otherwise the count appears to shrink as someone works through the test.
            const generated = Object.entries(assessment.itemCounts).reduce(
              (total, [status, count]) => (status === "dropped" ? total : total + count),
              0,
            );
            const served =
              (assessment.itemCounts.served ?? 0) +
              (assessment.itemCounts.answered ?? 0) +
              (assessment.itemCounts.skipped ?? 0);
            const open = openId === assessment.id;
            const logOpen = logId === assessment.id;
            // Past the approval gate: the learner can see it, so the admin should be able to see
            // what the learner sees without hunting for it.
            const released = assessment.approvedAt !== null || assessment.status === "ready";

            return (
              <li key={assessment.id} className="rounded-md border">
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Badge
                    variant={
                      assessment.status === "ready"
                        ? "success"
                        : assessment.status === "awaiting_approval"
                          ? "progress"
                          : "outline"
                    }
                  >
                    {assessment.status.replace("_", " ")}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    Attempt {assessment.attemptNo} · {formatTimestamp(assessment.createdAt)}
                    {generated > 0 ? ` · ${generated} items` : ""}
                    {dropped > 0 ? `, ${dropped} dropped` : ""}
                    {served > 0 ? ` · ${served} served` : ""}
                    {assessment.blueprint ? ` · ${assessment.blueprint.areas.length} areas` : ""}
                  </span>
                  {assessment.terminatedReason && (
                    <span className="w-full text-sm text-destructive">{assessment.terminatedReason}</span>
                  )}
                  {approvalNote(assessment) && (
                    <span
                      className={cn(
                        "w-full font-mono text-xs",
                        assessment.approvedBy === null ? "text-trailmark-strong" : "text-muted-foreground",
                      )}
                    >
                      {approvalNote(assessment)}
                      {assessment.approvedAt !== null && ` · ${formatTimestamp(assessment.approvedAt)}`}
                    </span>
                  )}
                  {/* Where it is, in one line. Released is not the same as taken, and the gap
                      between the two is where "did it even reach them?" comes from. */}
                  {assessment.status === "ready" && (
                    <span className="w-full text-sm text-muted-foreground">
                      With the learner now — they are shown it on every page of their app until they
                      start. Review the pool to see what they can be asked.
                    </span>
                  )}

                  <div className="ml-auto flex flex-wrap gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLogId(logOpen ? null : assessment.id)}
                      aria-expanded={logOpen}
                    >
                      <Terminal aria-hidden="true" />
                      {logOpen ? "Hide log" : "Generation log"}
                    </Button>
                    {generated + dropped > 0 &&
                      (released ? (
                        // Once it is with the learner, "what did I actually send?" is the first
                        // question an admin has — and "View pool" did not read as its answer.
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/admin/assessments/${assessment.id}`}>
                            <Eye aria-hidden="true" />
                            {assessment.status === "ready"
                              ? "Review what they'll be asked"
                              : "Review what they were asked"}
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/admin/assessments/${assessment.id}`}>View pool</Link>
                        </Button>
                      ))}
                    {served > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpenId(open ? null : assessment.id)}
                        aria-expanded={open}
                      >
                        <ChevronDown className={cn("transition-transform", open && "rotate-180")} aria-hidden="true" />
                        {open ? "Hide answers" : "View answers"}
                      </Button>
                    )}
                  </div>

                  <ApprovalBanner
                    assessment={assessment}
                    onApproved={onChanged}
                    poolHref={`/admin/assessments/${assessment.id}`}
                  />
                </div>

                {logOpen && (
                  <div className="border-t px-4 py-5">
                    <GenerationLog assessmentId={assessment.id} onFinished={() => void onChanged()} />
                  </div>
                )}

                {open && (
                  <div className="border-t px-4 py-5">
                    <AttemptAnswers assessmentId={assessment.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function AttemptAnswers({ assessmentId }: { assessmentId: string }) {
  const [data, setData] = useState<AnswersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<AnswersResponse>(`/api/admin/assessments/${assessmentId}/answers`)
      .then((result) => !cancelled && setData(result))
      .catch(
        (err) => !cancelled && setError(err instanceof ApiRequestError ? err.message : "Could not load the answers."),
      );
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  if (error) return <FormAlert>{error}</FormAlert>;

  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading what they were asked…
      </div>
    );
  }

  if (data.items.length === 0) {
    return <p className="text-sm text-muted-foreground">No items were served in this attempt.</p>;
  }

  const byId = new Map(data.items.map((item) => [item.id, item]));
  const paths = (data.selector?.areas ?? []).map((area) => ({
    area: area.area,
    steps: area.served.map<AdaptiveStep>((itemId, index) => ({
      difficulty: byId.get(itemId)?.difficulty ?? 0,
      correct: index < area.outcomes.length ? area.outcomes[index] : null,
    })),
  }));

  return (
    <div className="space-y-8">
      {paths.length > 0 && (
        <section aria-labelledby={`path-${assessmentId}`}>
          <h3 id={`path-${assessmentId}`} className="text-sm font-semibold">
            The adaptive path
          </h3>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            Each area's difficulty over the items it served. A filled marker is a correct answer; a
            line that saws between two levels is an estimate the staircase kept reversing on.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {paths.map((path) => (
              <AdaptivePath key={path.area} area={path.area} steps={path.steps} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby={`served-${assessmentId}`}>
        <h3 id={`served-${assessmentId}`} className="text-sm font-semibold">
          Served items
          <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">{data.items.length}</span>
        </h3>
        <ol className="mt-3 space-y-3">
          {data.items.map((item, index) => (
            <ServedItemCard key={item.id} item={item} index={index + 1} />
          ))}
        </ol>
      </section>
    </div>
  );
}

function ServedItemCard({ item, index }: { item: AnsweredItem; index: number }) {
  const score = item.autoScore ?? item.aiScore;
  const skipped = item.status === "skipped";
  const chosen = new Set(item.response?.selected ?? []);
  const correctSet = new Set(item.key.correctIndices ?? []);

  return (
    <li className={cn("rounded-md border px-4 py-3", skipped && "border-dashed")}>
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
        <span className="tabular">#{index}</span>
        <Badge variant="outline">{item.kind}</Badge>
        <span>{item.area}</span>
        <span>difficulty {item.difficulty}/5</span>
        {item.timeMs !== null && <span>{Math.round(item.timeMs / 1000)}s</span>}
        {skipped && (
          <Badge variant="outline" className="border-destructive/50 text-destructive">
            Skipped
          </Badge>
        )}
        <span className="ml-auto">
          {score === null ? (
            "not scored yet"
          ) : (
            <span className={score >= 50 ? "text-summit-strong" : "text-destructive"}>{score}/100</span>
          )}
        </span>
      </div>

      <RichText text={item.payload.prompt} className="mt-3" />

      {item.payload.options && (
        <ol className="mt-3 space-y-1 text-sm">
          {item.payload.options.map((option, i) => {
            const isCorrect = correctSet.has(i);
            const picked = chosen.has(i);
            return (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-2 rounded-sm px-1.5 py-0.5",
                  isCorrect && "font-medium text-summit-strong",
                  picked && !isCorrect && "bg-destructive/[0.07] text-destructive",
                  picked && isCorrect && "bg-summit/[0.08]",
                )}
              >
                {isCorrect ? (
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-label="Correct answer" />
                ) : picked ? (
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-label="Chose this" />
                ) : (
                  <span className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {option}
                  {picked && <span className="ml-2 font-mono text-[11px] text-muted-foreground">they chose this</span>}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {item.response?.text !== undefined && item.response.text !== "" && (
        <div className="mt-3">
          <p className="font-mono text-[11px] text-muted-foreground">Their answer</p>
          <p className="mt-1 whitespace-pre-wrap rounded-md border bg-surface-sunken/30 px-3 py-2 text-sm leading-relaxed">
            {item.response.text}
          </p>
        </div>
      )}

      {item.response?.code !== undefined && item.response.code !== "" && (
        <div className="mt-3">
          <p className="font-mono text-[11px] text-muted-foreground">What they submitted</p>
          <pre className="mt-1 overflow-x-auto rounded-md border bg-editor px-3 py-2 font-mono text-xs leading-relaxed text-editor-foreground">
            <code>{item.response.code}</code>
          </pre>
        </div>
      )}

      {item.key.expectedOutput !== undefined && (
        <p className="mt-3 font-mono text-xs">
          <span className="text-muted-foreground">Expected output: </span>
          <span className="text-summit-strong">{item.key.expectedOutput}</span>
        </p>
      )}

      {item.key.rubric && (
        <ul className="mt-3 space-y-1 text-sm">
          {item.key.rubric.map((point, i) => (
            <li key={i} className="text-muted-foreground">
              <span className="font-mono text-xs">({point.weight})</span> {point.point}
            </li>
          ))}
        </ul>
      )}

      {item.aiFeedback && (
        <p className="mt-3 rounded-md border border-ridge/40 bg-ridge/[0.06] px-3 py-2 text-sm">
          <span className="font-medium">Rubric grader: </span>
          <span className="text-muted-foreground">{item.aiFeedback}</span>
        </p>
      )}

      <p className="mt-3 border-l-2 border-basalt/40 pl-3 text-sm text-muted-foreground">{item.key.rationale}</p>

      <p className="mt-2 font-mono text-[11px] text-muted-foreground">{item.topicIds.join(" · ")}</p>
    </li>
  );
}
