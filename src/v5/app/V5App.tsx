import { lazy, Suspense, useEffect, type ReactNode } from "react";

import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";

import { RequireStaff, RequireSuperadmin } from "@/features/auth/guards";
// v5's fonts and tokens for every v5 route, old pages in the v5 shell included: since Phase 9 the
// previous design's fonts (Sora among them) are no longer loaded for everyone.
import "@/v5/design/styles";

import { AfterFirstScreen } from "./AfterFirstScreen";
import * as Old from "./legacyPages";
import { useAppMotionPref } from "./motionPref";
import { LazyToaster, OldDialogsOutlet, WithOldDialogs } from "./overlays";
import { startServiceWorker } from "./pwa/register";
import { UpdatePrompt } from "./pwa/UpdatePrompt";
import { RouteErrorBoundary, SilentBoundary } from "./RouteErrorBoundary";
import { RouteFallback } from "./RouteFallback";
import { lazyPreloaded } from "./preload";
import { ROUTE_MODULES } from "./routePrefetch";
import { LearnerShell } from "./shells";
import { V5CurriculumProvider as CurriculumProvider } from "./V5CurriculumProvider";
import { SkipLink } from "@/v5/design/components/SkipLink";
import { V5MotionProvider } from "@/v5/design/V5MotionProvider";
import { MotivationHost } from "@/v5/motivation/MotivationHost";

/**
 * The v5 route tree (docs/v5/PLAN.md, "v5 routes"). App.tsx renders this, lazily, when the ui_v5
 * flag is on, already inside `RequireAuth`; `/login`, `/change-password` and the public
 * `/verify/:certId` are App.tsx's own routes and never reach here.
 *
 * Every screen is lazy. Nothing in this file may import an old page eagerly: that would put it in
 * every v5 learner's first download. Old pages go through `./legacyPages`.
 */

// Learner
// The routes routePrefetch.ts starts at app start render at once when already loaded (lazyPreloaded).
const TodayPage = lazyPreloaded("today", ROUTE_MODULES.today);
const PlanPage = lazy(() => import("@/v5/learner/plan/PlanPage"));
const LibraryPage = lazy(() => import("@/v5/learner/library/LibraryPage"));
const CoursePage = lazy(() => import("@/v5/learner/library/CoursePage"));
const ReviewPage = lazyPreloaded("review", ROUTE_MODULES.review);
const MePage = lazy(() => import("@/v5/learner/me/MePage"));
const LessonPage = lazyPreloaded("lesson", ROUTE_MODULES.lesson);
const CertificatePage = lazy(
  () => import("@/v5/learner/certificate/CertificatePage"),
);
// Assessment
const AssessmentPage = lazy(() => import("@/v5/assessment/AssessmentPage"));
// Admin
const InboxPage = lazyPreloaded("inbox", ROUTE_MODULES.inbox);
const OverviewPage = lazy(() => import("@/v5/admin/overview/OverviewPage"));
const PeoplePage = lazy(() => import("@/v5/admin/people/PeoplePage"));
const LibraryAdminPage = lazy(
  () => import("@/v5/admin/library/LibraryAdminPage"),
);
const ReportsPage = lazy(() => import("@/v5/admin/reports/ReportsPage"));
// Admin (P7): the v5 admin frame and its screens. The frame is lazy too, so learners never load it.
const AdminShell = lazyPreloaded("admin", ROUTE_MODULES.admin);
const OnboardPage = lazy(() => import("@/v5/admin/onboard/OnboardPage"));
const CourseEditPage = lazy(
  () => import("@/v5/admin/library/editor/CourseEditPage"),
);
// v4.5: the one-page Oyelabs course editor (new, and editing a saved one).
const OyelabsEditorPage = lazy(
  () => import("@/v5/admin/library/oyelabs/OyelabsEditorPage"),
);
const AnnouncementsPage = lazy(
  () => import("@/v5/admin/feedback/AnnouncementsPage"),
);
const ProblemsPage = lazy(() => import("@/v5/admin/feedback/ProblemsPage"));
const TutorAnswersPage = lazy(
  () => import("@/v5/admin/feedback/TutorAnswersPage"),
);
// Living style guide (design system, P1)
const DesignPage = lazy(() => import("@/v5/design/DesignPage"));

/** Old URLs keep working: they land on the v5 screen that replaced them, keeping the query string. */
function RedirectKeepingSearch({ to }: { to: string }) {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
}

function TopicRedirect() {
  const { topicId } = useParams();
  return (
    <Navigate
      to={topicId ? `/learn/lesson/${encodeURIComponent(topicId)}` : "/learn"}
      replace
    />
  );
}

function CourseRedirect() {
  const { courseId } = useParams();
  return (
    <Navigate
      to={
        courseId
          ? `/learn/library/${encodeURIComponent(courseId)}`
          : "/learn/library"
      }
      replace
    />
  );
}

/** A screen inside a frame we don't own (admin): the boundary sits inside the frame's Outlet, so the frame stays. */
function B({ children }: { children: ReactNode }) {
  return <RouteErrorBoundary>{children}</RouteErrorBoundary>;
}

export default function V5App() {
  // The learner's reduced-motion setting, for every screen (MotionConfig + <html data-motion>).
  const motionPref = useAppMotionPref();
  // Offline Review and the install prompt (Phase 8). Production builds only.
  useEffect(() => startServiceWorker(), []);
  return (
    <V5MotionProvider reducedMotion={motionPref}>
      <Routes>
        {/* Learner */}
        <Route
          element={
            <RouteErrorBoundary fullPage>
              <CurriculumProvider>
                <LearnerShell />
              </CurriculumProvider>
            </RouteErrorBoundary>
          }
        >
          <Route path="learn" element={<TodayPage />} />
          <Route path="learn/plan" element={<PlanPage />} />
          <Route path="learn/library" element={<LibraryPage />} />
          <Route path="learn/library/:courseId" element={<CoursePage />} />
          <Route path="learn/review" element={<ReviewPage />} />
          <Route path="learn/me" element={<MePage />} />
          <Route path="learn/lesson/:topicId" element={<LessonPage />} />
          <Route
            path="learn/certificate/:certId"
            element={<CertificatePage />}
          />

          {/* Old learner pages with no v5 screen yet, shown unchanged inside the v5 shell. */}
          <Route element={<OldDialogsOutlet />}>
            <Route path="glossary" element={<Old.OldGlossaryPage />} />
            <Route
              path="glossary/practice"
              element={<Old.OldFlashcardsPage />}
            />
            <Route path="glossary/:termId" element={<Old.OldGlossaryPage />} />
            <Route path="tools/classify" element={<Old.OldClassifyPage />} />
            <Route
              path="practice/roleplay"
              element={<Old.OldRoleplayPracticePage />}
            />
            <Route
              path="report/:trackId"
              element={<Old.OldCertificatePage />}
            />
            <Route path="goals/:goalId" element={<Old.OldCapstonePage />} />
          </Route>
        </Route>

        {/* Old learner URLs */}
        <Route index element={<RedirectKeepingSearch to="/learn" />} />
        <Route
          path="plan"
          element={<RedirectKeepingSearch to="/learn/plan" />}
        />
        <Route
          path="library"
          element={<RedirectKeepingSearch to="/learn/library" />}
        />
        <Route
          path="courses"
          element={<RedirectKeepingSearch to="/learn/library" />}
        />
        <Route path="courses/:courseId" element={<CourseRedirect />} />
        <Route
          path="track/:trackId/module/:moduleId/topic/:topicId"
          element={<TopicRedirect />}
        />
        <Route
          path="track/:trackId/topic/:topicId"
          element={<TopicRedirect />}
        />
        <Route
          path="track/*"
          element={<RedirectKeepingSearch to="/learn/plan" />}
        />

        {/* Assessment: fullscreen, no shell. */}
        <Route
          path="assessment"
          element={
            <RouteErrorBoundary fullPage>
              {/* The assessment frame renders its own <main>; the link finds it. */}
              <SkipLink target="assessment-main" />
              <CurriculumProvider>
                <WithOldDialogs fallback={<RouteFallback />}>
                  <Suspense fallback={<RouteFallback />}>
                    <AssessmentPage />
                  </Suspense>
                </WithOldDialogs>
              </CurriculumProvider>
            </RouteErrorBoundary>
          }
        />

        {/* Admin */}
        <Route
          path="admin"
          element={
            <RequireStaff>
              <RouteErrorBoundary fullPage>
                <CurriculumProvider>
                  <WithOldDialogs fallback={<RouteFallback />}>
                    <Suspense fallback={<RouteFallback />}>
                      <AdminShell />
                    </Suspense>
                  </WithOldDialogs>
                </CurriculumProvider>
              </RouteErrorBoundary>
            </RequireStaff>
          }
        >
          <Route index element={<B><InboxPage /></B>} />
          <Route path="overview" element={<B><OverviewPage /></B>} />
          <Route path="people" element={<B><PeoplePage /></B>} />
          <Route path="library" element={<B><LibraryAdminPage /></B>} />
          <Route path="library/:courseId/edit" element={<B><CourseEditPage /></B>} />
          <Route path="library/oyelabs/new" element={<B><OyelabsEditorPage /></B>} />
          <Route path="library/:courseId/oyelabs" element={<B><OyelabsEditorPage /></B>} />
          <Route path="reports" element={<B><ReportsPage /></B>} />
          <Route path="onboard" element={<B><OnboardPage /></B>} />
          <Route path="announcements" element={<B><AnnouncementsPage /></B>} />
          <Route path="problems" element={<B><ProblemsPage /></B>} />
          <Route path="tutor-answers" element={<B><TutorAnswersPage /></B>} />

          {/* Old admin pages, unchanged, inside the v5 shell until each is replaced. */}
          <Route path="onboard/classic" element={<B><Old.OldAdminOnboardPage /></B>} />
          <Route path="people/:userId" element={<B><Old.OldAdminLearnerPage /></B>} />
          <Route path="departments" element={<B><Old.OldAdminDepartmentsPage /></B>} />
          <Route
            path="ai"
            element={
              <B>
                <RequireSuperadmin>
                  <Old.OldAdminAiPage />
                </RequireSuperadmin>
              </B>
            }
          />
          <Route path="question-bank" element={<B><Old.OldAdminBankPage /></B>} />
          <Route path="ai-usage" element={<B><Old.OldAdminAiUsagePage /></B>} />
          <Route path="live" element={<B><Old.OldAdminLivePage /></B>} />
          <Route path="audit" element={<B><Old.OldAdminAuditPage /></B>} />
          <Route path="reviews" element={<B><Old.OldAdminReviewsPage /></B>} />
          <Route path="sop" element={<B><Old.OldAdminSopPage /></B>} />
          <Route path="handbook" element={<B><Old.OldAdminHandbookPage /></B>} />
          <Route path="integrity" element={<B><Old.OldAdminIntegrityFeedPage /></B>} />
          <Route path="curriculum" element={<B><Old.OldAdminCurriculumPage /></B>} />
          <Route
            path="curriculum/test-items"
            element={<B><Old.OldAdminTestItemsPage /></B>}
          />
          <Route path="skill-graph" element={<B><Old.OldAdminSkillGraphPage /></B>} />
          <Route
            path="skill-groups"
            element={<B><Old.OldAdminSkillGroupsPage /></B>}
          />
          <Route path="courses" element={<B><Old.OldAdminCoursesPage /></B>} />
          <Route
            path="courses/:courseId"
            element={<B><Old.OldAdminCourseEditorPage /></B>}
          />
          <Route path="generated" element={<B><Old.OldAdminGeneratedPage /></B>} />
          <Route
            path="assessments/:assessmentId"
            element={<B><Old.OldAdminPoolPage /></B>}
          />
          <Route
            path="assessments/:assessmentId/integrity"
            element={<B><Old.OldAdminIntegrityPage /></B>}
          />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Living style guide, staff only. */}
        <Route
          path="design"
          element={
            <RequireStaff>
              <RouteErrorBoundary fullPage>
                <WithOldDialogs fallback={<RouteFallback />}>
                  <Suspense fallback={<RouteFallback />}>
                    <DesignPage />
                  </Suspense>
                </WithOldDialogs>
              </RouteErrorBoundary>
            </RequireStaff>
          }
        />

        <Route path="*" element={<Navigate to="/learn" replace />} />
      </Routes>
      {/* Not needed for any screen's first view: fetched once the page has loaded (Phase 9 performance). */}
      <AfterFirstScreen>
        <SilentBoundary>
          <MotivationHost />
        </SilentBoundary>
        <SilentBoundary>
          <LazyToaster />
        </SilentBoundary>
      </AfterFirstScreen>
      <UpdatePrompt />
    </V5MotionProvider>
  );
}
