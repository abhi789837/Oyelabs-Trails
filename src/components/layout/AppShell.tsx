import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Route, Routes, useLocation } from "react-router-dom";

import { isTransientAssessment } from "@/features/assessment/funnel";
import { useAuth } from "@/features/auth/AuthProvider";
import CertificatePage from "@/pages/CertificatePage";
import DashboardPage from "@/pages/DashboardPage";
import ModulePage from "@/pages/ModulePage";
import NotFoundPage from "@/pages/NotFoundPage";
import PlanPage from "@/pages/PlanPage";
import TopicPage, { LegacyTopicRedirect } from "@/pages/TopicPage";
import TrackPage from "@/pages/TrackPage";
import { useMyAssessmentStore } from "@/store/assessmentStore";
import { AssessmentBanner } from "./AssessmentBanner";
import { CompletionWatcher } from "./CompletionWatcher";
import { Logo } from "./Logo";
import { Sidebar } from "./Sidebar";
import { Toaster } from "./Toaster";
import { TopBar } from "./TopBar";

/** How often to re-check an assessment the server is still working on. */
const ASSESSMENT_POLL_MS = 30_000;

export function AppShell() {
  useMyAssessmentSync();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <TopBar />
      <div className="flex flex-1">
        <Sidebar />
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 focus:outline-hidden">
          {/* Above the routed content, and outside the route transition, so it neither re-animates
              nor re-announces every time the learner moves around. */}
          <AssessmentBanner />
          <AnimatedRoutes />
        </main>
      </div>
      <SiteFooter />
      <CompletionWatcher />
      <Toaster />
    </div>
  );
}

/**
 * One fetch of `/api/me/assessment` for the whole learner app.
 *
 * It belongs in the shell rather than on a page because the funnel is not a page: a learner who
 * already has a plan never opens `/plan`, which is exactly how an approved assessment came to sit
 * unseen while they worked through a trail it was about to replace. Every learner route renders
 * below this, so the banner and `/plan` read the same state and only one request is made.
 */
function useMyAssessmentSync() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const assessment = useMyAssessmentStore((s) => s.assessment);
  const load = useMyAssessmentStore((s) => s.load);
  const reset = useMyAssessmentStore((s) => s.reset);

  useEffect(() => {
    if (!userId) return;
    void load();
    // Per-person, like the manifest: dropped when the account changes so one learner's funnel is
    // never briefly shown to the next.
    return () => reset();
  }, [userId, load, reset]);

  // `generating`, `submitted` and friends move on the server's own time. Re-checking gently means
  // "being prepared" turns into "waiting for you" without the learner reloading the page.
  const working = isTransientAssessment(assessment);
  useEffect(() => {
    if (!working) return;
    const timer = setInterval(() => void load(), ASSESSMENT_POLL_MS);
    return () => clearInterval(timer);
  }, [working, load]);
}

/** Attribution, quietly. Oyelearn is an Oyelabs product and the footer is where that is said. */
function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-4 sm:px-6">
        <Logo variant="mark" height={18} decorative />
        <p className="font-mono text-xs text-muted-foreground">
          Oyelearn <span aria-hidden="true">&middot;</span> by Oyelabs
        </p>
      </div>
    </footer>
  );
}

/** The app's one route transition: a ~150ms cross-fade keyed on the path. */
function AnimatedRoutes() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.15, ease: "easeOut" }}
      >
        {/* Descendant routes: paths are relative to the `/*` this shell is mounted under. */}
        <Routes location={location}>
          <Route index element={<DashboardPage />} />
          <Route path="plan" element={<PlanPage />} />
          <Route path="track/:trackId" element={<TrackPage />} />
          <Route path="track/:trackId/module/:moduleId" element={<ModulePage />} />
          <Route path="track/:trackId/module/:moduleId/topic/:topicId" element={<TopicPage />} />
          {/* v1 links: /track/:trackId/topic/:topicId */}
          <Route path="track/:trackId/topic/:topicId" element={<LegacyTopicRedirect />} />
          <Route path="report/:trackId" element={<CertificatePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
