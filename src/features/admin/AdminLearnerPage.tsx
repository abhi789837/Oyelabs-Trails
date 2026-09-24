import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import type { LearnerDetail } from "@shared/admin";
import type { AssessmentSummary } from "@shared/assessment";
import type { TopicProgressValue } from "@shared/content";
import type { LearnerProfile } from "@shared/profile";
import type { PlanResponse } from "@shared/plans";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/utils";
import { adminApi } from "./api";
import { AccountTab } from "./learner/AccountTab";
import { AssessmentTab } from "./learner/AssessmentTab";
import { EvaluationTab } from "./learner/EvaluationTab";
import { IntegrityTab } from "./learner/IntegrityTab";
import { PlanTab } from "./learner/PlanTab";
import { ProfileTab } from "./learner/ProfileTab";
import { ProgressTab } from "./learner/ProgressTab";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "assessment", label: "Assessment" },
  { id: "integrity", label: "Integrity" },
  { id: "evaluation", label: "Evaluation" },
  { id: "plan", label: "Plan" },
  { id: "progress", label: "Progress" },
  { id: "account", label: "Account" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTabId(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

/**
 * One learner, for the admin (brief §13).
 *
 * Seven tabs rather than one long page: by P6 this had grown to a profile, an item-by-item
 * assessment review, an integrity timeline, an evaluation, a plan editor over ~300 topics, and a
 * progress table — which as a single scroll made the plan editor's sticky toolbar fight everything
 * above it. The tab lives in the query string so a link can point at the tab that matters.
 *
 * Panels mount on first visit and stay mounted: the plan editor holds unsaved edits, and losing
 * them by glancing at another tab would be its own bug.
 */
export default function AdminLearnerPage() {
  const { userId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const reduceMotion = useReducedMotion();

  const [detail, setDetail] = useState<LearnerDetail | null>(null);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [progress, setProgress] = useState<Record<string, TopicProgressValue>>({});
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const tabParam = searchParams.get("tab");
  const active: TabId = isTabId(tabParam) ? tabParam : "profile";
  const [visited, setVisited] = useState<Set<TabId>>(() => new Set<TabId>([active]));
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useDocumentTitle(detail ? detail.user.displayName : "Learner");

  useEffect(() => {
    setVisited((current) => (current.has(active) ? current : new Set(current).add(active)));
  }, [active]);

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
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load this person.");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const selectTab = useCallback(
    (id: TabId) => {
      const next = new URLSearchParams(searchParams);
      if (id === "profile") next.delete("tab");
      else next.set("tab", id);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const current = TABS.findIndex((tab) => tab.id === active);
    let next = -1;
    if (event.key === "ArrowRight") next = (current + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (current - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    event.preventDefault();
    selectTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  const reloadDetail = useCallback(async () => {
    setDetail(await adminApi.getUser(userId));
  }, [userId]);

  const reloadPlan = useCallback(async () => {
    setPlan(await api.get<PlanResponse>(`/api/admin/users/${userId}/plan`));
  }, [userId]);

  const reloadAssessments = useCallback(async () => {
    const result = await api.get<{ assessments: AssessmentSummary[] }>(`/api/admin/users/${userId}/assessments`);
    setAssessments(result.assessments);
  }, [userId]);

  const handleProfileSaved = useCallback(
    (profile: LearnerProfile) => setDetail((current) => (current ? { ...current, profile } : current)),
    [],
  );

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

  return (
    <div className="px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin/people">
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
          {detail.user.hardWarnings > 0 && (
            <Badge variant="outline" className="border-destructive/50 text-destructive">
              {detail.user.hardWarnings} hard warning{detail.user.hardWarnings === 1 ? "" : "s"}
            </Badge>
          )}
          <Badge variant="outline">{detail.user.assessmentStatus ?? "No assessment yet"}</Badge>
        </div>
      </header>

      {error && (
        <div className="mt-6">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      <div
        role="tablist"
        aria-label="Learner sections"
        onKeyDown={handleTabKeyDown}
        className="mt-8 flex gap-1 overflow-x-auto border-b"
      >
        {TABS.map((tab, index) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`learner-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`learner-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              className={cn(
                "relative whitespace-nowrap px-3 py-2 text-sm transition-colors",
                selected ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {selected &&
                (reduceMotion ? (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-trailmark" />
                ) : (
                  /* The page's one deliberate motion moment: the marker slides to the new camp. */
                  <motion.span
                    layoutId="learner-tab-marker"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-trailmark"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                ))}
            </button>
          );
        })}
      </div>

      {TABS.map((tab) => {
        if (!visited.has(tab.id)) return null;
        const selected = tab.id === active;
        return (
          <div
            key={tab.id}
            role="tabpanel"
            id={`learner-panel-${tab.id}`}
            aria-labelledby={`learner-tab-${tab.id}`}
            tabIndex={0}
            hidden={!selected}
            className={cn("mt-8 focus:outline-hidden", !selected && "hidden")}
          >
            {tab.id === "profile" && (
              <ProfileTab userId={userId} profile={detail.profile} onSaved={handleProfileSaved} />
            )}
            {tab.id === "assessment" && (
              <AssessmentTab userId={userId} assessments={assessments} onChanged={reloadAssessments} />
            )}
            {tab.id === "integrity" && <IntegrityTab assessments={assessments} />}
            {tab.id === "evaluation" && <EvaluationTab userId={userId} assessments={assessments} />}
            {tab.id === "plan" && (
              <PlanTab
                userId={userId}
                displayName={detail.user.displayName}
                plan={plan}
                progress={progress}
                onPublished={reloadPlan}
              />
            )}
            {tab.id === "progress" && <ProgressTab userId={userId} progress={progress} plan={plan} />}
            {tab.id === "account" && <AccountTab user={detail.user} onChanged={reloadDetail} />}
          </div>
        );
      })}
    </div>
  );
}
