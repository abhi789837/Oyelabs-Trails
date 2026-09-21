import { useState } from "react";
import { Download, LoaderCircle, Lock } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { CertificateView } from "@/components/certificate/CertificateView";
import { StatusDot } from "@/components/trail/StatusDot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { getTrackById } from "@/data/tracks";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { summarizeTrack } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { buildCertificateData, normalizeName } from "@/lib/certificate";
import { levelLabels } from "@/lib/track-meta";
import { cn, formatMinutesCompact } from "@/lib/utils";
import { useProfileStore } from "@/store/profileStore";
import { useProgressStore } from "@/store/progressStore";
import type { Track } from "@/types/curriculum-v1";
import NotFoundPage from "./NotFoundPage";

export default function CertificatePage() {
  const { trackId } = useParams();
  const track = getTrackById(trackId);
  useDocumentTitle(track ? `${track.name} certificate` : "Off trail");

  if (!track) return <NotFoundPage />;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-8">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="hover:text-foreground hover:underline">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to={`/track/${track.id}`} className="hover:text-foreground hover:underline">
              {track.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            Certificate
          </li>
        </ol>
      </nav>
      <CertificateContent track={track} />
    </div>
  );
}

function CertificateContent({ track }: { track: Track }) {
  const progress = useProgressStore((s) => s.progress);
  const summary = summarizeTrack(track, progress);
  const accent = accentClasses[track.accentToken];

  if (!summary.isComplete) {
    const remaining = track.topics.filter((t) => progress[t.id]?.status !== "completed");
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
                  <Link to={`/track/${track.id}/topic/${summary.nextTopic.id}`}>
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
            <h2 className="text-sm font-semibold">Still to complete</h2>
            <ul className="mt-2 divide-y border-y">
              {remaining.map((topic) => (
                <li key={topic.id}>
                  <Link
                    to={`/track/${track.id}/topic/${topic.id}`}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-1 py-2.5 transition-colors hover:bg-accent"
                  >
                    <StatusDot status={progress[topic.id]?.status ?? "not-started"} />
                    <span className="text-sm font-medium">{topic.title}</span>
                    <span className="flex gap-4 font-mono text-xs text-muted-foreground">
                      <span className="hidden sm:inline">{levelLabels[topic.level]}</span>
                      <span className="w-14 whitespace-nowrap text-right">{formatMinutesCompact(topic.estMinutes)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return <UnlockedCertificate track={track} completedAt={summary.completedAt ?? ""} />;
}

function UnlockedCertificate({ track, completedAt }: { track: Track; completedAt: string }) {
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
