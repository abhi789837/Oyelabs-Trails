import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminLayout } from "@/features/admin/AdminLayout";
import AdminAiPage from "@/features/admin/AdminAiPage";
import AdminIntegrityPage from "@/features/admin/AdminIntegrityPage";
import AdminLivePage from "@/features/admin/AdminLivePage";
import AdminOnboardPage from "@/features/admin/AdminOnboardPage";
import AdminPeoplePage from "@/features/admin/AdminPeoplePage";
import AdminPoolPage from "@/features/admin/AdminPoolPage";
import { AuthProvider } from "@/features/auth/AuthProvider";
import ChangePasswordPage from "@/features/auth/ChangePasswordPage";
import { RequireAuth, RequireSuperadmin } from "@/features/auth/guards";
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
          <AuthProvider>
            <Routes>
              {/* Public. Both render their own full-page layout, without the app chrome. */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />

              <Route
                path="/admin"
                element={
                  <RequireSuperadmin>
                    <CurriculumProvider>
                      <AdminLayout />
                    </CurriculumProvider>
                  </RequireSuperadmin>
                }
              >
                <Route index element={<AdminPeoplePage />} />
                <Route path="onboard" element={<AdminOnboardPage />} />
                <Route path="people/:userId" element={<AdminLearnerPage />} />
                <Route path="ai" element={<AdminAiPage />} />
                <Route path="live" element={<AdminLivePage />} />
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
        </TooltipProvider>
      </MotionConfig>
    </BrowserRouter>
  );
}
