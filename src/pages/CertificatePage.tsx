import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";

import type { MyCertificatesResponse } from "@shared/certificates";

import { api } from "@/api/client";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { StatusDot } from "@/components/trail/StatusDot";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getTrack, modulePath, topicPath, trackTopics, type TrackMeta } from "@/content";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { summarizeModule, summarizeTrack } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/store/progressStore";

import { SectionHeading } from "./parts/Stats";
import NotFoundPage from "./NotFoundPage";

export default function CertificatePage() {
  const { trackId } = useParams();
  const track = getTrack(trackId);
  useDocumentTitle(track ? `${track.name} certificate` : "Off trail");

  if (!track) return <NotFoundPage />;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-8">
      <Breadcrumbs items={[{ label: "Dashboard", to: "/" }, { label: track.name, to: `/track/${track.id}` }, { label: "Certificate" }]} />
      <CertificateContent track={track} />
    </div>
  );
}

function CertificateContent({ track }: { track: TrackMeta }) {
  const progress = useProgressStore((s) => s.progress);
  const summary = summarizeTrack(track, progress);
  const accent = accentClasses[track.accentToken];

  if (!summary.isComplete) {
    const remaining = trackTopics(track).filter((t) => progress[t.id]?.status !== "completed");
    return (
      <div className="mt-8">
        <h1 className="text-2xl font-bold sm:text-3xl">{track.name} certificate</h1>
        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_1.1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-basalt text-muted-foreground">
                <Lock className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="font-display text-lg font-semibold">Not unlocked yet</p>
            </div>
            <p className="mt-4 max-w-prose text-muted-foreground">
              The certificate unlocks once every topic on the {track.name} trail is complete. You've finished{" "}
              {summary.completed} of {summary.total}, so there {remaining.length === 1 ? "is" : "are"} {remaining.length}{" "}
              {remaining.length === 1 ? "topic" : "topics"} to go.
            </p>
            <Progress
              value={summary.pct}
              className="mt-5 h-2 max-w-sm"
              indicatorClassName={accent.bg}
              aria-label={`${track.name} completion: ${summary.pct}%`}
            />
            <div className="mt-6 flex flex-wrap gap-3">
              {summary.nextTopic && (
                <Button asChild className={accent.solid}>
                  <Link to={topicPath(summary.nextTopic)}>
                    {summary.started ? "Continue trail" : "Start trail"}
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to={`/track/${track.id}`}>Open trail map</Link>
              </Button>
            </div>
          </div>

          <div>
            <SectionHeading as="h3">
              Camps still to finish
            </SectionHeading>
            <ul className="mt-3 divide-y border-y">
              {track.modules.map((module) => {
                const s = summarizeModule(module, progress);
                if (s.isComplete) return null;
                const status = s.started ? "in-progress" : "not-started";
                return (
                  <li key={module.id}>
                    {module.available ? (
                      <Link
                        to={modulePath(module)}
                        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-1 py-2.5 transition-colors hover:bg-accent"
                      >
                        <StatusDot status={status} className="rounded-[4px]" />
                        <span className="text-sm font-medium">{module.name}</span>
                        <span className="font-mono text-xs tabular text-muted-foreground">
                          {s.completed}/{s.total}
                        </span>
                      </Link>
                    ) : (
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-1 py-2.5 text-muted-foreground">
                        <StatusDot status="not-started" className="rounded-[4px] border-dashed" />
                        <span className="text-sm">{module.name}</span>
                        <span className="font-mono text-xs">being written</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // The certificate id is derived from an ISO timestamp, so the epoch milliseconds the server
  // sends are converted here rather than changing the id derivation.
  return (
    <UnlockedCertificate
      track={track}
      completedAt={summary.completedAt ? new Date(summary.completedAt).toISOString() : ""}
    />
  );
}

/**
 * Rebrand Phase 5: the certificate is the server's (issued once, with a public check link, drawn
 * from the kit's template). This page used to draw its own in the browser, with an id nobody could
 * check; now it finds the server's certificate for this track and opens it.
 */
function UnlockedCertificate({ track }: { track: TrackMeta; completedAt: string }) {
  const [state, setState] = useState<{ kind: "loading" } | { kind: "none" } | { kind: "failed" } | { kind: "found"; id: string }>({ kind: "loading" });
  const accent = accentClasses[track.accentToken];

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<MyCertificatesResponse>("/api/v5/certificates", controller.signal)
      .then(({ certificates }) => {
        const mine = certificates.find((c) => c.kind === "track" && c.refId === track.id && c.revokedAt === null);
        setState(mine ? { kind: "found", id: mine.id } : { kind: "none" });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ kind: "failed" });
      });
    return () => controller.abort();
  }, [track.id]);

  if (state.kind === "found") return <Navigate to={`/learn/certificate/${encodeURIComponent(state.id)}`} replace />;

  return (
    <div className="mt-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{track.name} certificate</h1>
      {state.kind === "loading" ? (
        <p role="status" className="mt-3 text-muted-foreground">
          Finding your certificate…
        </p>
      ) : (
        <>
          <p className="mt-3 max-w-prose text-muted-foreground" role={state.kind === "failed" ? "alert" : undefined}>
            {state.kind === "failed"
              ? "We couldn't load your certificate just now. Reload the page to try again."
              : `Summit reached. Your ${track.name} certificate is issued for the topics in your plan; it isn't ready yet. Your certificates are listed on your Me page.`}
          </p>
          <div className="mt-6">
            <Button asChild className={cn(accent.solid)}>
              <Link to="/learn/me#certificates">Your certificates</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
