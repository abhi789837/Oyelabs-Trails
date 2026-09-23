import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminLayout } from "@/features/admin/AdminLayout";
import AdminOnboardPage from "@/features/admin/AdminOnboardPage";
import AdminPeoplePage from "@/features/admin/AdminPeoplePage";
import { AuthProvider } from "@/features/auth/AuthProvider";
import ChangePasswordPage from "@/features/auth/ChangePasswordPage";
import { RequireAuth, RequireSuperadmin } from "@/features/auth/guards";
import LoginPage from "@/features/auth/LoginPage";
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
                    <AdminLayout />
                  </RequireSuperadmin>
                }
              >
                <Route index element={<AdminPeoplePage />} />
                <Route path="onboard" element={<AdminOnboardPage />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>

              {/* Everything else is the learner-facing app, which brings its own shell. */}
              <Route
                path="/*"
                element={
                  <RequireAuth>
                    <AppShell />
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
