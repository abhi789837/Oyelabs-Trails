import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";

import CertificatePage from "@/pages/CertificatePage";
import DashboardPage from "@/pages/DashboardPage";
import NotFoundPage from "@/pages/NotFoundPage";
import TopicPage from "@/pages/TopicPage";
import TrackPage from "@/pages/TrackPage";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell() {
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
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
          <AnimatedRoutes />
        </main>
      </div>
    </div>
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
        <Routes location={location}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/track/:trackId" element={<TrackPage />} />
          <Route path="/track/:trackId/topic/:topicId" element={<TopicPage />} />
          <Route path="/report/:trackId" element={<CertificatePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
