import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { OverlayProvider } from "@/components/overlays";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminLayout } from "@/features/admin/AdminLayout";
import AdminAiPage from "@/features/admin/AdminAiPage";
import AdminAuditPage from "@/features/admin/AdminAuditPage";
import AdminSopPage from "@/features/admin/AdminSopPage";
import AdminHandbookPage from "@/features/admin/handbook/AdminHandbookPage";
import AdminBankPage from "@/features/admin/bank/AdminBankPage";
import AdminAiUsagePage from "@/features/admin/usage/AdminAiUsagePage";
import AdminCourseEditorPage from "@/features/admin/courses/AdminCourseEditorPage";
import AdminCoursesPage from "@/features/admin/courses/AdminCoursesPage";
import AdminGeneratedPage from "@/features/admin/builder/AdminGeneratedPage";
import AdminCurriculumPage from "@/features/admin/AdminCurriculumPage";
import AdminTestItemsPage from "@/features/admin/testItems/AdminTestItemsPage";
import AdminDepartmentsPage from "@/features/admin/catalog/AdminDepartmentsPage";
import AdminSkillGraphPage from "@/features/admin/graph/AdminSkillGraphPage";
import AdminIntegrityFeedPage from "@/features/admin/AdminIntegrityFeedPage";
import AdminIntegrityPage from "@/features/admin/AdminIntegrityPage";
import AdminLivePage from "@/features/admin/AdminLivePage";
import AdminOnboardPage from "@/features/admin/AdminOnboardPage";
import AdminOverviewPage from "@/features/admin/AdminOverviewPage";
import AdminPeoplePage from "@/features/admin/AdminPeoplePage";
import AdminPoolPage from "@/features/admin/AdminPoolPage";
import { AuthProvider } from "@/features/auth/AuthProvider";
import ChangePasswordPage from "@/features/auth/ChangePasswordPage";
import { RequireAuth, RequireStaff, RequireSuperadmin } from "@/features/auth/guards";
import LoginPage from "@/features/auth/LoginPage";
import AssessmentPage from "@/features/assessment/AssessmentPage";
import { CurriculumProvider } from "@/features/curriculum/CurriculumProvider";
import AdminLearnerPage from "@/features/admin/AdminLearnerPage";
import { useUiStore } from "@/store/uiStore";

export default function App() {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <TooltipProvider delayDuration={150}>
          <OverlayProvider>
            <AuthProvider>
              <Routes>
                {/* Public. Both render their own full-page layout, without the app chrome. */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/change-password" element={<ChangePasswordPage />} />

                <Route
                  path="/admin"
                  element={
                    <RequireStaff>
                      <CurriculumProvider>
                        <AdminLayout />
                      </CurriculumProvider>
                    </RequireStaff>
                  }
                >
                  <Route index element={<AdminOverviewPage />} />
                  <Route path="people" element={<AdminPeoplePage />} />
                  <Route path="onboard" element={<AdminOnboardPage />} />
                  <Route path="departments" element={<AdminDepartmentsPage />} />
                  <Route path="people/:userId" element={<AdminLearnerPage />} />
                  {/* The one page inside the console that an admin does not get. */}
                  <Route
                    path="ai"
                    element={
                      <RequireSuperadmin>
                        <AdminAiPage />
                      </RequireSuperadmin>
                    }
                  />
                  <Route path="question-bank" element={<AdminBankPage />} />
                  <Route path="ai-usage" element={<AdminAiUsagePage />} />
                  <Route path="live" element={<AdminLivePage />} />
                  <Route path="audit" element={<AdminAuditPage />} />
                  <Route path="sop" element={<AdminSopPage />} />
                  <Route path="handbook" element={<AdminHandbookPage />} />
                  <Route path="integrity" element={<AdminIntegrityFeedPage />} />
                  <Route path="curriculum" element={<AdminCurriculumPage />} />
                  <Route path="curriculum/test-items" element={<AdminTestItemsPage />} />
                  <Route path="skill-graph" element={<AdminSkillGraphPage />} />
                  <Route path="courses" element={<AdminCoursesPage />} />
                  <Route path="courses/:courseId" element={<AdminCourseEditorPage />} />
                  <Route path="generated" element={<AdminGeneratedPage />} />
                  <Route path="assessments/:assessmentId" element={<AdminPoolPage />} />
                  <Route path="assessments/:assessmentId/integrity" element={<AdminIntegrityPage />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Route>

                {/* The assessment is fullscreen and proctored: no sidebar, no top bar, no way out. */}
                <Route
                  path="/assessment"
                  element={
                    <RequireAuth>
                      <CurriculumProvider>
                        <AssessmentPage />
                      </CurriculumProvider>
                    </RequireAuth>
                  }
                />

                {/* Everything else is the learner-facing app, which brings its own shell. */}
                <Route
                  path="/*"
                  element={
                    <RequireAuth>
                      <CurriculumProvider>
                        <AppShell />
                      </CurriculumProvider>
                    </RequireAuth>
                  }
                />
              </Routes>
            </AuthProvider>
          </OverlayProvider>
        </TooltipProvider>
      </MotionConfig>
    </BrowserRouter>
  );
}
