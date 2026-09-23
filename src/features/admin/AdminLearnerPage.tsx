import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, LoaderCircle, Minus, Plus } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import type { LearnerDetail } from "@shared/admin";
import type { AssessmentSummary } from "@shared/assessment";
import type { TopicProgressValue } from "@shared/content";
import type { PlanResponse } from "@shared/plans";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useTracks, type ModuleMeta } from "@/content";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { levelLabels } from "@/lib/track-meta";
import { cn, formatMinutes, formatTimestamp } from "@/lib/utils";
import { AdminEvaluationView } from "./AdminEvaluationView";
import { adminApi } from "./api";

/**
 * One learner, for the admin.
 *
 * P2 needs the plan editor: content gating is only testable once someone can be given a plan, and
 * the AI that will normally produce one does not exist yet. The other tabs from brief §13
 * (assessment, integrity, evaluation) arrive with the phases that produce their data.
 */
export default function AdminLearnerPage() {
  const { userId = "" } = useParams();
  const tracks = useTracks();

  const [detail, setDetail] = useState<LearnerDetail | null>(null);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [progress, setProgress] = useState<Record<string, TopicProgressValue>>({});
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [issuing, setIssuing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useDocumentTitle(detail ? detail.user.displayName : "Learner");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [d, p, pr, a] = await Promise.all([
          adminApi.getUser(userId),
          api.get<PlanResponse>(`/api/admin/users/${userId}/plan`),
          api.get<{ progress: Record<string, TopicProgressValue> }>(`/api/admin/users/${userId}/progress`),
          api.get<{ assessments: AssessmentSummary[] }>(`/api/admin/users/${userId}/assessments`),
        ]);
        if (cancelled) return;
        setDetail(d);
        setPlan(p);
        setProgress(pr.progress);
        setAssessments(a.assessments);
        setSelected(new Set(p.plan?.topicIds ?? []));
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load this person.");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const published = useMemo(() => new Set(plan?.plan?.topicIds ?? []), [plan]);
  const dirty = useMemo(
    () => selected.size !== published.size || [...selected].some((id) => !published.has(id)),
    [selected, published],
  );

  const added = [...selected].filter((id) => !published.has(id)).length;
  const removed = [...published].filter((id) => !selected.has(id)).length;

  const estimatedMinutes = useMemo(() => {
    let total = 0;
    for (const track of tracks) {
      for (const module of track.modules) {
        for (const topic of module.topics) if (selected.has(topic.id)) total += topic.estMinutes;
      }
    }
    return total;
  }, [tracks, selected]);

  const toggleTopic = (topicId: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });

  const toggleModule = (module: ModuleMeta) =>
    setSelected((current) => {
      const next = new Set(current);
      const all = module.topics.every((t) => next.has(t.id));
      for (const topic of module.topics) {
        if (all) next.delete(topic.id);
        else next.add(topic.id);
      }
      return next;
    });

  const handleIssueAssessment = async () => {
    setIssuing(true);
    setError(null);
    setNotice(null);
    try {
      await api.post(`/api/admin/users/${userId}/assessments`, {});
      const refreshed = await api.get<{ assessments: AssessmentSummary[] }>(`/api/admin/users/${userId}/assessments`);
      setAssessments(refreshed.assessments);
      setNotice("Assessment queued. Generation runs in the background and usually takes a few minutes.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not issue an assessment.");
    } finally {
      setIssuing(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const result = await api.put<{ plan: PlanResponse["plan"] }>(`/api/admin/users/${userId}/plan`, {
        topicIds: [...selected],
      });
      const refreshed = await api.get<PlanResponse>(`/api/admin/users/${userId}/plan`);
      setPlan(refreshed);
      setSelected(new Set(result.plan?.topicIds ?? []));
      setNotice(`Published version ${result.plan?.version}. ${detail?.user.displayName} sees these topics now.`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not publish that plan.");
    } finally {
      setSaving(false);
    }
  };

  if (error && !detail) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <FormAlert>{error}</FormAlert>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground sm:px-6" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading…
      </div>
    );
  }

  const query = filter.trim().toLowerCase();
  const completedInPlan = [...selected].filter((id) => progress[id]?.status === "completed").length;

  return (
    <div className="px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin">
          <ArrowLeft aria-hidden="true" />
          People
        </Link>
      </Button>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{detail.user.displayName}</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {detail.user.username}
            {detail.profile.roleTitle ? ` · ${detail.profile.roleTitle}` : ""}
            {detail.profile.yearsExperience !== null ? ` · ${detail.profile.yearsExperience} yrs` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {detail.user.status === "disabled" && <Badge variant="outline">Disabled</Badge>}
          {detail.user.mustChangePassword && <Badge variant="outline">Awaiting first sign-in</Badge>}
          <Badge variant="outline">{detail.user.assessmentStatus ?? "No assessment yet"}</Badge>
        </div>
      </header>

      {detail.profile.adminNotes && (
        <section className="mt-8 max-w-prose">
          <h2 className="text-sm font-semibold">Onboarding notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {detail.profile.adminNotes}
          </p>
        </section>
      )}

      {detail.profile.claimedSkills.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold">Claimed skills</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {detail.profile.claimedSkills.map((skill) => (
              <li key={skill.area} className="rounded-md border px-2.5 py-1 text-sm">
                {skill.area} <span className="font-mono text-xs text-muted-foreground">{skill.level}/5</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10" aria-labelledby="assessment-heading">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
          <div>
            <h2 id="assessment-heading" className="text-lg font-semibold">
              Placement assessment
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {assessments.length === 0
                ? "None issued yet. Generating one reads the notes above, so make sure they say what you know."
                : `${assessments.length} attempt${assessments.length === 1 ? "" : "s"}.`}
            </p>
          </div>
          {!assessments.some((a) => ["generating", "ready", "in_progress", "submitted", "evaluating"].includes(a.status)) && (
            <Button variant="outline" onClick={() => void handleIssueAssessment()} disabled={issuing}>
              {issuing && <LoaderCircle className="animate-spin" aria-hidden="true" />}
              {assessments.length === 0 ? "Issue assessment" : "Re-issue assessment"}
            </Button>
          )}
        </div>

        {assessments.length > 0 && (
          <ul className="mt-4 space-y-2">
            {assessments.map((assessment) => {
              const kept = assessment.itemCounts.pool ?? 0;
              const dropped = assessment.itemCounts.dropped ?? 0;
              return (
                <li key={assessment.id} className="flex flex-wrap items-center gap-3 rounded-md border px-4 py-3">
                  <Badge variant={assessment.status === "ready" ? "success" : "outline"}>
                    {assessment.status.replace("_", " ")}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    Attempt {assessment.attemptNo} · {formatTimestamp(assessment.createdAt)}
                    {kept > 0 ? ` · ${kept} items` : ""}
                    {dropped > 0 ? `, ${dropped} dropped` : ""}
                    {assessment.blueprint ? ` · ${assessment.blueprint.areas.length} areas` : ""}
                  </span>
                  {assessment.terminatedReason && (
                    <span className="w-full text-sm text-destructive">{assessment.terminatedReason}</span>
                  )}
                  {kept > 0 && (
                    <Button asChild variant="ghost" size="sm" className="ml-auto">
                      <Link to={`/admin/assessments/${assessment.id}`}>View pool</Link>
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {(() => {
        const evaluated = assessments.find((a) => ["completed", "terminated", "evaluating"].includes(a.status));
        if (!evaluated) return null;
        return (
          <section className="mt-10" aria-labelledby="evaluation-heading">
            <h2 id="evaluation-heading" className="border-b pb-4 text-lg font-semibold">
              Evaluation
            </h2>
            <div className="mt-6">
              <AdminEvaluationView assessmentId={evaluated.id} userId={userId} />
            </div>
          </section>
        );
      })()}

      <section className="mt-10" aria-labelledby="plan-heading">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
          <div>
            <h2 id="plan-heading" className="text-lg font-semibold">
              Learning plan
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan?.plan
                ? `Version ${plan.plan.version}, ${plan.plan.source === "ai" ? "generated" : "set by an admin"} on ${formatTimestamp(plan.plan.publishedAt)}.`
                : "No plan published yet. This person currently sees nothing."}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm tabular">
              {selected.size} topic{selected.size === 1 ? "" : "s"} · {formatMinutes(estimatedMinutes)}
            </p>
            {plan?.plan && (
              <p className="mt-0.5 font-mono text-xs text-muted-foreground tabular">
                {completedInPlan} completed
              </p>
            )}
          </div>
        </div>

        {(() => {
          const aiVersion = plan?.history.find((p) => p.source === "ai");
          if (!aiVersion || !plan?.plan || plan.plan.id === aiVersion.id) return null;
          const aiSet = new Set(aiVersion.topicIds);
          const addedSinceAi = plan.plan.topicIds.filter((id) => !aiSet.has(id));
          const removedSinceAi = aiVersion.topicIds.filter((id) => !plan.plan!.topicIds.includes(id));
          if (addedSinceAi.length === 0 && removedSinceAi.length === 0) return null;
          return (
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              Against the AI's version {aiVersion.version}:{" "}
              {addedSinceAi.length > 0 && <span className="text-summit-strong">+{addedSinceAi.length} added</span>}
              {addedSinceAi.length > 0 && removedSinceAi.length > 0 && " · "}
              {removedSinceAi.length > 0 && <span className="text-destructive">−{removedSinceAi.length} removed</span>}
            </p>
          );
        })()}

        {plan?.plan && selected.size > 0 && (
          <Progress
            value={Math.round((completedInPlan / selected.size) * 100)}
            className="mt-3 h-1.5"
            indicatorClassName="bg-summit"
            aria-label="Plan progress"
          />
        )}

        {notice && (
          <p className="mt-4 rounded-md border border-summit/40 bg-summit/[0.07] px-3 py-2 text-sm" role="status">
            {notice}
          </p>
        )}
        {error && <div className="mt-4"><FormAlert>{error}</FormAlert></div>}

        <div className="sticky top-14 z-10 -mx-4 mt-4 flex flex-wrap items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <Input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter topics"
            aria-label="Filter topics"
            className="max-w-xs"
          />
          <Button onClick={() => void handlePublish()} disabled={!dirty || saving || selected.size === 0}>
            {saving && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {saving ? "Publishing…" : "Publish plan"}
          </Button>
          {dirty && (
            <>
              <span className="font-mono text-xs text-muted-foreground">
                {added > 0 && `+${added}`}
                {added > 0 && removed > 0 && " "}
                {removed > 0 && `−${removed}`} vs published
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set(published))}>
                Discard changes
              </Button>
            </>
          )}
        </div>

        <div className="mt-6 space-y-8">
          {tracks.map((track) => {
            const modules = track.modules
              .filter((m) => m.available)
              .map((module) => ({
                module,
                topics: query
                  ? module.topics.filter(
                      (t) => t.title.toLowerCase().includes(query) || t.id.includes(query) || module.name.toLowerCase().includes(query),
                    )
                  : module.topics,
              }))
              .filter((entry) => entry.topics.length > 0);
            if (modules.length === 0) return null;

            const trackSelected = track.modules.reduce(
              (n, m) => n + m.topics.filter((t) => selected.has(t.id)).length,
              0,
            );

            return (
              <section key={track.id} aria-label={track.name}>
                <h3 className="flex items-baseline gap-2 text-base font-semibold">
                  {track.name}
                  <span className="font-mono text-xs font-normal text-muted-foreground tabular">
                    {trackSelected} selected
                  </span>
                </h3>

                <div className="mt-3 space-y-3">
                  {modules.map(({ module, topics }) => {
                    const allSelected = module.topics.every((t) => selected.has(t.id));
                    const someSelected = module.topics.some((t) => selected.has(t.id));
                    return (
                      <div key={module.id} className="rounded-md border">
                        <div className="flex items-center gap-2 border-b bg-surface-sunken/40 px-3 py-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleModule(module)}
                            title={allSelected ? "Remove the whole camp" : "Add the whole camp"}
                          >
                            {allSelected ? <Minus aria-hidden="true" /> : <Plus aria-hidden="true" />}
                            <span className="sr-only">
                              {allSelected ? "Remove" : "Add"} every topic in {module.name}
                            </span>
                          </Button>
                          <span className="text-sm font-medium">{module.name}</span>
                          <span className="ml-auto font-mono text-xs text-muted-foreground tabular">
                            {module.topics.filter((t) => selected.has(t.id)).length}/{module.topics.length}
                          </span>
                          {someSelected && !allSelected && (
                            <span className="h-1.5 w-1.5 rounded-full bg-trailmark" aria-hidden="true" />
                          )}
                        </div>

                        <ul className="divide-y">
                          {topics.map((topic) => {
                            const isSelected = selected.has(topic.id);
                            const done = progress[topic.id]?.status === "completed";
                            return (
                              <li key={topic.id}>
                                <label
                                  className={cn(
                                    "flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-surface-sunken/40",
                                    isSelected && "bg-trailmark/[0.06]",
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleTopic(topic.id)}
                                    className="h-4 w-4 shrink-0 accent-[rgb(var(--trailmark))]"
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate">{topic.title}</span>
                                    <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                                      {topic.id} · {levelLabels[topic.level]} · {formatMinutes(topic.estMinutes)}
                                    </span>
                                  </span>
                                  {done && (
                                    <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-summit-strong">
                                      <Check className="h-3 w-3" aria-hidden="true" />
                                      done
                                    </span>
                                  )}
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
