import { useState } from "react";
import { Download, LoaderCircle, Lock } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { CertificateView } from "@/components/certificate/CertificateView";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { StatusDot } from "@/components/trail/StatusDot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { getTrack, modulePath, topicPath, trackTopics, type TrackMeta } from "@/content";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { summarizeModule, summarizeTrack } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { buildCertificateData, normalizeName } from "@/lib/certificate";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/store/profileStore";
import { useProgressStore } from "@/store/progressStore";
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
            <h2 className="text-sm font-semibold">Camps still to finish</h2>
            <ul className="mt-2 divide-y border-y">
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

  return <UnlockedCertificate track={track} completedAt={summary.completedAt ?? ""} />;
}

function UnlockedCertificate({ track, completedAt }: { track: TrackMeta; completedAt: string }) {
  const progress = useProgressStore((s) => s.progress);
  const learnerName = useProfileStore((s) => s.learnerName);
  const setLearnerName = useProfileStore((s) => s.setLearnerName);
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const accent = accentClasses[track.accentToken];
  const data = buildCertificateData(track, progress, learnerName, completedAt);
  const hasName = normalizeName(learnerName).length > 0;

  const handleDownload = async () => {
    setStatus("working");
    try {
      const { downloadCertificatePdf } = await import("@/components/certificate/generateCertificatePdf");
      await downloadCertificatePdf(data);
      setStatus("idle");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <div className="mt-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{track.name} certificate</h1>
      <p className="mt-3 max-w-prose text-muted-foreground">
        Summit reached. Add the name you'd like printed, check the preview, then download the PDF.
      </p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full max-w-sm">
          <Label htmlFor="learner-name">Name on the certificate</Label>
          <Input
            id="learner-name"
            className="mt-2"
            value={learnerName}
            maxLength={60}
            autoComplete="name"
            placeholder="Your full name"
            onChange={(e) => setLearnerName(e.target.value)}
            aria-describedby="learner-name-note"
          />
        </div>
        <Button onClick={handleDownload} disabled={!hasName || status === "working"} className={cn(accent.solid)}>
          {status === "working" ? <LoaderCircle className="animate-spin" /> : <Download />}
          {status === "working" ? "Preparing PDF" : "Download PDF"}
        </Button>
      </div>
      <p id="learner-name-note" className="mt-2 text-xs text-muted-foreground" aria-live="polite">
        {status === "error"
          ? "The PDF couldn't be generated. Try again, or reload the page."
          : hasName
            ? "Saved in this browser. The certificate ID changes if you change the name."
            : "Add your name to download the PDF."}
      </p>

      <div className="mt-8">
        <CertificateView data={data} />
      </div>

      <p className="mt-6 max-w-prose text-xs leading-relaxed text-muted-foreground">
        This certificate is generated in your browser from progress stored on this device. There's no server-side
        verification yet, so the certificate ID can't be checked by anyone else. It's a record for you and your lead, not
        a verifiable credential.
      </p>
    </div>
  );
}
