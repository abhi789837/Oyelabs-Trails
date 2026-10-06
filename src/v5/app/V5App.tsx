import { lazy, Suspense } from "react";

import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";

import { RequireStaff, RequireSuperadmin } from "@/features/auth/guards";
import { CurriculumProvider } from "@/features/curriculum/CurriculumProvider";

import * as Old from "./legacyPages";
import { useAppMotionPref } from "./motionPref";
import { LazyToaster, OldDialogsOutlet, WithOldDialogs } from "./overlays";
import { RouteFallback } from "./RouteFallback";
import { LearnerShell } from "./shells";
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
const TodayPage = lazy(() => import("@/v5/learner/today/TodayPage"));
const PlanPage = lazy(() => import("@/v5/learner/plan/PlanPage"));
const LibraryPage = lazy(() => import("@/v5/learner/library/LibraryPage"));
const CoursePage = lazy(() => import("@/v5/learner/library/CoursePage"));
const ReviewPage = lazy(() => import("@/v5/learner/review/ReviewPage"));
const MePage = lazy(() => import("@/v5/learner/me/MePage"));
const LessonPage = lazy(() => import("@/v5/learner/lesson/LessonPage"));
const CertificatePage = lazy(
  () => import("@/v5/learner/certificate/CertificatePage"),
);
// Assessment
const AssessmentPage = lazy(() => import("@/v5/assessment/AssessmentPage"));
// Admin
const InboxPage = lazy(() => import("@/v5/admin/inbox/InboxPage"));
const OverviewPage = lazy(() => import("@/v5/admin/overview/OverviewPage"));
const PeoplePage = lazy(() => import("@/v5/admin/people/PeoplePage"));
const LibraryAdminPage = lazy(
  () => import("@/v5/admin/library/LibraryAdminPage"),
);
const ReportsPage = lazy(() => import("@/v5/admin/reports/ReportsPage"));
// Admin (P7): the v5 admin frame and its screens. The frame is lazy too, so learners never load it.
const AdminShell = lazy(() =>
  import("@/v5/admin/shell/AdminShell").then((m) => ({
    default: m.AdminShell,
  })),
);
const OnboardPage = lazy(() => import("@/v5/admin/onboard/OnboardPage"));
const CourseEditPage = lazy(
  () => import("@/v5/admin/library/editor/CourseEditPage"),
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

export default function V5App() {
  // The learner's reduced-motion setting, for every screen (MotionConfig + <html data-motion>).
  const motionPref = useAppMotionPref();
  return (
    <V5MotionProvider reducedMotion={motionPref}>
      <Routes>
        {/* Learner */}
        <Route
          element={
            <CurriculumProvider>
              <LearnerShell />
            </CurriculumProvider>
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
            <CurriculumProvider>
              <WithOldDialogs fallback={<RouteFallback />}>
                <Suspense fallback={<RouteFallback />}>
                  <AssessmentPage />
                </Suspense>
              </WithOldDialogs>
            </CurriculumProvider>
          }
        />

        {/* Admin */}
        <Route
          path="admin"
          element={
            <RequireStaff>
              <CurriculumProvider>
                <WithOldDialogs fallback={<RouteFallback />}>
                  <Suspense fallback={<RouteFallback />}>
                    <AdminShell />
                  </Suspense>
                </WithOldDialogs>
              </CurriculumProvider>
            </RequireStaff>
          }
        >
          <Route index element={<InboxPage />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="library" element={<LibraryAdminPage />} />
          <Route path="library/:courseId/edit" element={<CourseEditPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="onboard" element={<OnboardPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="problems" element={<ProblemsPage />} />
          <Route path="tutor-answers" element={<TutorAnswersPage />} />

          {/* Old admin pages, unchanged, inside the v5 shell until each is replaced. */}
          <Route path="onboard/classic" element={<Old.OldAdminOnboardPage />} />
          <Route path="people/:userId" element={<Old.OldAdminLearnerPage />} />
          <Route path="departments" element={<Old.OldAdminDepartmentsPage />} />
          <Route
            path="ai"
            element={
              <RequireSuperadmin>
                <Old.OldAdminAiPage />
              </RequireSuperadmin>
            }
          />
          <Route path="question-bank" element={<Old.OldAdminBankPage />} />
          <Route path="ai-usage" element={<Old.OldAdminAiUsagePage />} />
          <Route path="live" element={<Old.OldAdminLivePage />} />
          <Route path="audit" element={<Old.OldAdminAuditPage />} />
          <Route path="reviews" element={<Old.OldAdminReviewsPage />} />
          <Route path="sop" element={<Old.OldAdminSopPage />} />
          <Route path="handbook" element={<Old.OldAdminHandbookPage />} />
          <Route path="integrity" element={<Old.OldAdminIntegrityFeedPage />} />
          <Route path="curriculum" element={<Old.OldAdminCurriculumPage />} />
          <Route
            path="curriculum/test-items"
            element={<Old.OldAdminTestItemsPage />}
          />
          <Route path="skill-graph" element={<Old.OldAdminSkillGraphPage />} />
          <Route
            path="skill-groups"
            element={<Old.OldAdminSkillGroupsPage />}
          />
          <Route path="courses" element={<Old.OldAdminCoursesPage />} />
          <Route
            path="courses/:courseId"
            element={<Old.OldAdminCourseEditorPage />}
          />
          <Route path="generated" element={<Old.OldAdminGeneratedPage />} />
          <Route
            path="assessments/:assessmentId"
            element={<Old.OldAdminPoolPage />}
          />
          <Route
            path="assessments/:assessmentId/integrity"
            element={<Old.OldAdminIntegrityPage />}
          />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Living style guide, staff only. */}
        <Route
          path="design"
          element={
            <RequireStaff>
              <WithOldDialogs fallback={<RouteFallback />}>
                <Suspense fallback={<RouteFallback />}>
                  <DesignPage />
                </Suspense>
              </WithOldDialogs>
            </RequireStaff>
          }
        />

        <Route path="*" element={<Navigate to="/learn" replace />} />
      </Routes>
      <MotivationHost />
      <LazyToaster />
    </V5MotionProvider>
  );
}
