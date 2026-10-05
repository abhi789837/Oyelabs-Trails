import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { RequireAuth } from "@/features/auth/guards";
import { useUiStore } from "@/store/uiStore";
import { RouteFallback } from "@/v5/app/RouteFallback";
import { effectiveDesignV5 } from "@/v5/app/designFlag";

/**
 * v5 Phase 0: the two designs are separate lazy trees, chosen by the ui_v5 flag (docs/v5/PLAN.md).
 * The old tree is unchanged, only moved to `LegacyRoutes` so a v5 learner does not download it.
 */
const LegacyRoutes = lazy(() => import("./LegacyRoutes"));
const V5App = lazy(() => import("./v5/app/V5App"));
const VerifyPage = lazy(() => import("./v5/learner/certificate/VerifyPage"));
/* Lazy too: their form code (zod, motion) would otherwise sit in every page's first download. */
const LoginPage = lazy(() =>
  import("./AuthPages").then((m) => ({ default: m.LoginRoute })),
);
const ChangePasswordPage = lazy(() =>
  import("./AuthPages").then((m) => ({ default: m.ChangePasswordRoute })),
);

export default function App() {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public. Both render their own full-page layout, without the app chrome. */}
          <Route
            path="/login"
            element={
              <Suspense fallback={<RouteFallback />}>
                <LoginPage />
              </Suspense>
            }
          />
          <Route
            path="/change-password"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ChangePasswordPage />
              </Suspense>
            }
          />
          {/* Public certificate check (v5). Needs no session, so it is outside the switch. */}
          <Route
            path="/verify/:certId"
            element={
              <Suspense fallback={<RouteFallback />}>
                <VerifyPage />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <RequireAuth>
                <DesignSwitch />
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

/** Signed in: the effective flag (server value, or a staff `?ui=` override) picks the tree. */
function DesignSwitch() {
  const { user, uiV5 } = useAuth();
  const v5 = user ? effectiveDesignV5(user.role, uiV5) : false;
  // Each tree wraps itself in MotionConfig, so motion loads with the tree that uses it.
  return (
    <Suspense fallback={<RouteFallback />}>
      {v5 ? <V5App /> : <LegacyRoutes />}
    </Suspense>
  );
}
