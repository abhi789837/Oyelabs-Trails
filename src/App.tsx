import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";

import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { RequireAuth } from "@/features/auth/guards";
import { pageTitle, pageTitledFor, routeTitle } from "@/lib/pageTitle";
import { useUiStore } from "@/store/uiStore";
import { RouteFallback } from "@/v5/app/RouteFallback";
import { effectiveDesignV5 } from "@/v5/app/designFlag";
import { lazyPreloaded } from "@/v5/app/preload";
import { rememberDesign, ROUTE_MODULES, routeCodeSettled, startRoutePrefetch, whenRouteCodeSettled } from "@/v5/app/routePrefetch";

/**
 * v5 Phase 0: the two designs are separate lazy trees, chosen by the ui_v5 flag (docs/v5/PLAN.md).
 * The old tree is unchanged, only moved to `LegacyRoutes` so a v5 learner does not download it.
 */
const LegacyRoutes = lazy(() => import("./LegacyRoutes"));
// Phase 9 performance: on the design this device last used, start the v5 tree, the page's code and
// its first queries now, in parallel with /api/auth/me (src/v5/app/routePrefetch.ts).
startRoutePrefetch();
// Renders at once when routePrefetch already fetched it (no Suspense pause); otherwise lazy as before.
const V5App = lazyPreloaded("v5app", ROUTE_MODULES.v5app);
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
      <RouteTitle />
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

/**
 * Rebrand Phase 2: every route has a "<Page> · Oyelearn" title. A page that names itself
 * (`useDocumentTitle`, v5 `PageHeader`) wins: its effect runs first and is remembered per path.
 */
function RouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!pageTitledFor(pathname)) document.title = pageTitle(routeTitle(pathname));
  }, [pathname]);
  return null;
}

/** Signed in: the effective flag (server value, or a staff `?ui=` override) picks the tree. */
function DesignSwitch() {
  const { user, uiV5 } = useAuth();
  const v5 = user ? effectiveDesignV5(user.role, uiV5) : false;
  useEffect(() => {
    if (user) rememberDesign(v5);
  }, [user, v5]);
  // v5 code already on its way (routePrefetch): wait for it here rather than in a Suspense fallback,
  // so the page renders as soon as it lands. Off when nothing was prefetched, and for the old UI.
  const [codeReady, setCodeReady] = useState(routeCodeSettled);
  useEffect(() => {
    if (codeReady || !v5) return;
    let live = true;
    void whenRouteCodeSettled().then(() => live && setCodeReady(true));
    return () => {
      live = false;
    };
  }, [codeReady, v5]);
  if (v5 && !codeReady) return <RouteFallback />;
  // Each tree wraps itself in MotionConfig, so motion loads with the tree that uses it.
  return (
    <Suspense fallback={<RouteFallback />}>
      {v5 ? <V5App /> : <LegacyRoutes />}
    </Suspense>
  );
}
