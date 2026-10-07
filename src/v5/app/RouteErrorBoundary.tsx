import { Component, useEffect, useRef, type ErrorInfo, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

import { Mark } from "@/components/brand/Mark";
import { useAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/v5/design/components/Button";
import { useV5Root } from "@/v5/design/useV5Root";
import { isStaffRole } from "@shared/uiFlag";

import { isChunkLoadError, reloadForChunkError } from "./chunkReload";
import { logClientError } from "./clientErrorLog";

/**
 * The v5 route-level error boundary (Phase 8). Every v5 route renders inside one, so a crash in a
 * screen shows a calm page with a way forward instead of a blank window, and the shell around it
 * keeps working.
 *
 * - "Try again" resets the boundary, which mounts the screen again, and the screen fetches again.
 * - Moving to another page resets it too.
 * - A lazy file that no longer exists after a deploy reloads the page once (`chunkReload.ts`).
 * - Errors go to the console with the route, and to the server log (`POST /api/client-errors`).
 */
export function RouteErrorBoundary({ children, fullPage = false }: { children: ReactNode; fullPage?: boolean }) {
  const { pathname } = useLocation();
  return (
    <Boundary resetKey={pathname} fullPage={fullPage}>
      {children}
    </Boundary>
  );
}

/** For surfaces that must never take a page down (the toaster, the motivation host): fail silently. */
export class SilentBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    if (!isChunkLoadError(error)) console.error("[oyelearn] a background part of the page failed", error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

interface BoundaryProps {
  resetKey: string;
  fullPage: boolean;
  children: ReactNode;
}

interface BoundaryState {
  error: unknown;
  attempt: number;
}

class Boundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: unknown): Partial<BoundaryState> {
    return { error: error ?? new Error("Unknown error") };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    if (reloadForChunkError(error)) return;
    console.error(`[oyelearn] ${window.location.pathname} crashed`, error, info.componentStack);
    logClientError(error, window.location.pathname);
  }

  componentDidUpdate(prev: BoundaryProps) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  reset = () => this.setState((s) => ({ error: null, attempt: s.attempt + 1 }));

  render() {
    if (this.state.error) return <ErrorScreen error={this.state.error} onRetry={this.reset} fullPage={this.props.fullPage} />;
    // The key remounts the screen on "Try again", so its data is fetched again.
    return <BoundaryChildren key={this.state.attempt}>{this.props.children}</BoundaryChildren>;
  }
}

function BoundaryChildren({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function ErrorScreen({ error, onRetry, fullPage }: { error: unknown; onRetry: () => void; fullPage: boolean }) {
  // The screen that crashed may have owned the v5 scope; keep the tokens on while this shows.
  useV5Root();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const staff = user ? isStaffRole(user.role) : false;
  // A way out that isn't the page that just crashed (UX review E2): from Today itself, My plan.
  const onToday = pathname.replace(/\/+$/, "") === "/learn";
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: false });
  }, []);
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  const missingFile = isChunkLoadError(error);

  const body = offline
    ? "You're offline, and this page isn't saved on this device yet. Review works offline. Everything else comes back when you're online."
    : missingFile
      ? "We've just updated Oyelearn, and this page needs a fresh copy. Reload the page to get it. Your progress is saved."
      : "It's not something you did. Your progress is saved. Try again, and if it keeps happening, tell your manager.";

  return (
    <div className={fullPage ? "flex min-h-dvh items-center justify-center bg-surface-0 px-4 text-fg-1" : "flex min-h-[50vh] items-center justify-center px-4 py-10 text-fg-1"}>
      <div role="alert" className="flex w-full max-w-md flex-col items-center rounded-card border border-line-1 bg-surface-1 px-6 py-10 text-center">
        <Mark size={48} decorative className="mb-5" />
        <h1 ref={heading} tabIndex={-1} className="font-display text-h3 font-semibold text-fg-1 outline-none focus-visible:outline-none">
          Something went wrong on this page.
        </h1>
        <p className="mt-2 text-body text-fg-2">{body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="primary" onClick={missingFile && !offline ? () => window.location.reload() : onRetry}>
            {missingFile && !offline ? "Reload the page" : "Try again"}
          </Button>
          <Button asChild variant="secondary">
            {staff ? <Link to="/admin">Go to the inbox</Link> : onToday ? <Link to="/learn/plan">Go to My plan</Link> : <Link to="/learn">Go to Today</Link>}
          </Button>
        </div>
        {error instanceof Error && error.message ? (
          <details className="mt-5 w-full text-left text-caption text-fg-2">
            <summary className="cursor-pointer select-none">Show details</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words font-mono">{error.message}</pre>
          </details>
        ) : null}
      </div>
    </div>
  );
}
