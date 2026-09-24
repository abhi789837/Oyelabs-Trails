import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Maximize, Monitor, ScanFace, ShieldAlert, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cardVariants } from "@/components/ui/card";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { onScreenChange, screenIsExtended } from "./browserSignals";
import { startCalibration, type CalibrationSample } from "./cameraDetectors";
import { CALIBRATION_HOLD_MS, MIN_VIEWPORT_PX, SNAPSHOT_RETENTION_DAYS, type CalibrationPose } from "./types";
import { playWarningTone } from "./warnings";

/**
 * The §10.1 pre-flight sequence: consent, camera, sound, environment, fullscreen.
 *
 * Consent comes first and is a real choice, not a formality — India's DPDP Act requires informed
 * consent for employee monitoring, and a learner who finds out mid-test what is being recorded has
 * been treated badly regardless of the law. So the copy says plainly what is watched, what leaves
 * the device, who sees it, how long it is kept, and what this cannot detect.
 *
 * Nothing here talks to the server. It hands the caller a live stream and a calibration pose; the
 * caller posts consent and calls `start`.
 */

type Step = "consent" | "camera" | "sound" | "environment" | "fullscreen";

const STEPS: { id: Step; label: string }[] = [
  { id: "consent", label: "What is monitored" },
  { id: "camera", label: "Camera" },
  { id: "sound", label: "Sound" },
  { id: "environment", label: "Your setup" },
  { id: "fullscreen", label: "Fullscreen" },
];

export interface PreFlightProps {
  assessmentId: string;
  /** Called once every check passes. The live stream is handed over rather than re-requested. */
  onReady: (calibration: CalibrationPose, stream: MediaStream) => void;
  onCancel: () => void;
}

export function PreFlight({ assessmentId, onReady, onCancel }: PreFlightProps) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>("consent");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [sample, setSample] = useState<CalibrationSample | null>(null);
  const [calibration, setCalibration] = useState<CalibrationPose | null>(null);
  const [tonePlayed, setTonePlayed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const handedOverRef = useRef(false);
  const environment = useEnvironment();

  // The stream stays alive only if it is handed to the test page; otherwise the camera light must
  // go out when this screen closes.
  useEffect(
    () => () => {
      if (!handedOverRef.current) stream?.getTracks().forEach((track) => track.stop());
    },
    [stream],
  );

  const requestCamera = useCallback(async () => {
    setRequesting(true);
    setCameraError(null);
    try {
      const granted = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      setStream(granted);
      setStep("camera");
    } catch (error) {
      setCameraError(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "The camera was blocked. Allow it in your browser's address bar, then try again."
          : "No camera was found. Connect one, close anything else using it, and try again.",
      );
    } finally {
      setRequesting(false);
    }
  }, []);

  // Preview + calibration, live for as long as the camera step is on screen.
  useEffect(() => {
    if (step !== "camera" || !stream) return;
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    void video.play().catch(() => undefined);

    let done = false;
    const stop = startCalibration(video, (next) => {
      setSample(next);
      if (next.ready && next.pose && !done) {
        done = true;
        setCalibration({ ...next.pose, capturedAt: Date.now() });
      }
    });
    return () => {
      stop();
      video.srcObject = null;
    };
  }, [step, stream]);

  const enterFullscreen = useCallback(async () => {
    if (!calibration || !stream) return;
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Some browsers refuse (an extension, a kiosk policy). The engine reports and re-prompts
      // rather than trapping the learner on this screen forever.
    }
    handedOverRef.current = true;
    onReady(calibration, stream);
  }, [calibration, onReady, stream]);

  const blocked = environment.coarsePointer || environment.narrowViewport;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold">Before you start</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Five quick checks. Nothing is recorded until the assessment itself begins.
        </p>
      </header>

      <ol className="mb-8 flex flex-wrap gap-x-5 gap-y-2" aria-label="Pre-flight checks">
        {STEPS.map((entry, index) => {
          const current = entry.id === step;
          const done = STEPS.findIndex((s) => s.id === step) > index;
          return (
            <li
              key={entry.id}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 font-mono text-xs",
                current ? "text-foreground" : done ? "text-summit-strong" : "text-basalt",
              )}
            >
              {done ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <span
                  className={cn("inline-block h-2 w-2 rounded-full", current ? "bg-trailmark" : "bg-basalt/50")}
                  aria-hidden="true"
                />
              )}
              {entry.label}
            </li>
          );
        })}
      </ol>

      {/* The one motion moment on this screen: the panel cross-fades as the sequence advances. */}
      <motion.div
        key={step}
        variants={fadeUp}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        className={cn(cardVariants({ density: "roomy" }), "sm:p-8")}
      >
        {step === "consent" && (
          <ConsentStep
            error={cameraError}
            busy={requesting}
            onAgree={() => void requestCamera()}
            onCancel={onCancel}
          />
        )}

        {step === "camera" && (
          <CameraStep
            videoRef={videoRef}
            sample={sample}
            ready={calibration !== null}
            onContinue={() => setStep("sound")}
            onCancel={onCancel}
          />
        )}

        {step === "sound" && (
          <SoundStep
            played={tonePlayed}
            onPlay={() => {
              playWarningTone();
              setTonePlayed(true);
            }}
            onConfirm={() => setStep("environment")}
            onBack={() => setStep("camera")}
          />
        )}

        {step === "environment" && (
          <EnvironmentStep
            environment={environment}
            blocked={blocked}
            onContinue={() => setStep("fullscreen")}
            onCancel={onCancel}
          />
        )}

        {step === "fullscreen" && (
          <FullscreenStep assessmentId={assessmentId} onStart={() => void enterFullscreen()} onCancel={onCancel} />
        )}
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — consent
// ---------------------------------------------------------------------------

function ConsentStep({
  error,
  busy,
  onAgree,
  onCancel,
}: {
  error: string | null;
  busy: boolean;
  onAgree: () => void;
  onCancel: () => void;
}) {
  return (
    <section aria-labelledby="preflight-consent">
      <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-trailmark/15 text-trailmark-strong" aria-hidden="true">
        <ShieldAlert className="h-5 w-5" />
      </span>
      <h2 id="preflight-consent" className="font-display text-xl font-semibold">
        What this assessment monitors
      </h2>

      <div className="mt-4 max-w-prose space-y-3 text-sm">
        <p>
          While the assessment is open, this page watches your camera, whether this tab is focused
          and in fullscreen, and whether you copy, paste or take a screenshot.
        </p>
        <p>
          <strong className="font-semibold">The video stays on this device.</strong> It is analysed
          here, in your browser, frame by frame, and thrown away. No video is streamed or stored
          anywhere.
        </p>
        <p>
          When a warning fires, and only then, a single still photo from your camera is uploaded
          with it, so the warning can be checked rather than taken on trust.
        </p>
        <p>
          Those photos and the warning log are visible to the super admin of this platform, nobody
          else, and they are deleted after {SNAPSHOT_RETENTION_DAYS} days.
        </p>
        <p className="rounded-md border border-basalt/40 bg-surface-sunken px-3 py-2 text-muted-foreground">
          Being straight with you about the limits: a web page cannot see your screen, cannot stop
          an operating-system screenshot or a screen-sharing tool, and cannot see a second device
          out of the camera&rsquo;s view. It records the traces it can, and a person reviews them. A
          warning is evidence for that person, never an automatic verdict.
        </p>
        <p>Three warnings end the assessment. Your answers up to that point are still evaluated.</p>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-md border border-destructive/40 bg-destructive/6 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-7 flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
        <Button onClick={onAgree} disabled={busy}>
          {busy ? "Asking for the camera…" : "I agree, check my camera"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — camera and calibration
// ---------------------------------------------------------------------------

function CameraStep({
  videoRef,
  sample,
  ready,
  onContinue,
  onCancel,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  sample: CalibrationSample | null;
  ready: boolean;
  onContinue: () => void;
  onCancel: () => void;
}) {
  const held = Math.min(sample?.heldMs ?? 0, CALIBRATION_HOLD_MS);
  const percent = Math.round((held / CALIBRATION_HOLD_MS) * 100);

  const guidance = ready
    ? "Got it. Your resting head position is recorded."
    : sample === null
      ? "Starting the camera…"
      : sample.faceCount === 0
        ? "No face yet. Make sure the room is lit from the front, not from behind you."
        : sample.faceCount > 1
          ? "More than one face is visible. The assessment needs you alone in frame."
          : !sample.centred
            ? "Move so your face is in the middle of the frame, about an arm's length away."
            : "Hold still, looking at the screen…";

  return (
    <section aria-labelledby="preflight-camera">
      <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-trailmark/15 text-trailmark-strong" aria-hidden="true">
        <ScanFace className="h-5 w-5" />
      </span>
      <h2 id="preflight-camera" className="font-display text-xl font-semibold">
        Camera check
      </h2>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Sit the way you plan to sit for the test and look at the screen. This records your resting
        head position, so glancing away is measured against how you actually sit, not against a
        fixed idea of it.
      </p>

      <div className="mt-5 overflow-hidden rounded-md border bg-editor">
        <video ref={videoRef} muted playsInline autoPlay aria-label="Your camera preview" className="h-64 w-full scale-x-[-1] object-cover" />
      </div>

      <p role="status" className="mt-4 text-sm">
        {guidance}
      </p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Hold steady"
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-200", ready ? "bg-summit" : "bg-trailmark")}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-7 flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
        <Button onClick={onContinue} disabled={!ready}>
          Continue
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — sound
// ---------------------------------------------------------------------------

function SoundStep({
  played,
  onPlay,
  onConfirm,
  onBack,
}: {
  played: boolean;
  onPlay: () => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <section aria-labelledby="preflight-sound">
      <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-trailmark/15 text-trailmark-strong" aria-hidden="true">
        <Volume2 className="h-5 w-5" />
      </span>
      <h2 id="preflight-sound" className="font-display text-xl font-semibold">
        Sound check
      </h2>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Warnings make a sound as well as appearing on screen, so you notice one even if you are
        looking at your keyboard. Play it once and make sure you can hear it.
      </p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button variant="outline" onClick={onPlay}>
          <Volume2 aria-hidden="true" />
          {played ? "Play it again" : "Play the warning tone"}
        </Button>
        {played && <span className="text-sm text-muted-foreground">Two beeps, high then low.</span>}
      </div>

      <div className="mt-7 flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
        <Button onClick={onConfirm} disabled={!played}>
          I heard it
        </Button>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — environment
// ---------------------------------------------------------------------------

interface EnvironmentReport {
  coarsePointer: boolean;
  narrowViewport: boolean;
  extendedDisplay: boolean;
  width: number;
}

/** Re-evaluated live, so shrinking the window on the way past this step still blocks. */
function useEnvironment(): EnvironmentReport {
  const read = (): EnvironmentReport => ({
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    narrowViewport: window.innerWidth < MIN_VIEWPORT_PX,
    extendedDisplay: screenIsExtended(),
    width: window.innerWidth,
  });
  const [report, setReport] = useState<EnvironmentReport>(read);

  useEffect(() => {
    const sync = () => setReport(read());
    const pointer = window.matchMedia("(pointer: coarse)");
    window.addEventListener("resize", sync);
    pointer.addEventListener("change", sync);
    const offScreenChange = onScreenChange(sync);
    return () => {
      window.removeEventListener("resize", sync);
      pointer.removeEventListener("change", sync);
      offScreenChange();
    };
  }, []);

  return report;
}

function EnvironmentStep({
  environment,
  blocked,
  onContinue,
  onCancel,
}: {
  environment: EnvironmentReport;
  blocked: boolean;
  onContinue: () => void;
  onCancel: () => void;
}) {
  return (
    <section aria-labelledby="preflight-environment">
      <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-trailmark/15 text-trailmark-strong" aria-hidden="true">
        <Monitor className="h-5 w-5" />
      </span>
      <h2 id="preflight-environment" className="font-display text-xl font-semibold">
        Your setup
      </h2>

      {blocked ? (
        <div role="alert" className="mt-4 max-w-prose space-y-3 rounded-md border border-destructive/40 bg-destructive/6 px-4 py-3 text-sm text-destructive">
          {environment.coarsePointer && (
            <p>
              This assessment needs a desktop or laptop with a keyboard and mouse. The coding items
              are not usable on a touch device.
            </p>
          )}
          {environment.narrowViewport && (
            <p>
              The window is {environment.width} px wide; the assessment needs at least{" "}
              {MIN_VIEWPORT_PX} px. Maximise the window, or move to a larger screen, and this will
              clear on its own.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Screen size and pointer look fine.
        </p>
      )}

      {environment.extendedDisplay && (
        <p className="mt-4 max-w-prose rounded-md border border-trailmark/40 bg-trailmark/[0.07] px-4 py-3 text-sm">
          A second display is connected. That is allowed, but it is logged as a note on your
          attempt, and the camera only sees the screen you are facing. If you can, disconnect it.
        </p>
      )}

      <div className="mt-7 flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
        <Button onClick={onContinue} disabled={blocked}>
          Continue
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — fullscreen
// ---------------------------------------------------------------------------

function FullscreenStep({
  assessmentId,
  onStart,
  onCancel,
}: {
  assessmentId: string;
  onStart: () => void;
  onCancel: () => void;
}) {
  return (
    <section aria-labelledby="preflight-fullscreen">
      <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-trailmark/15 text-trailmark-strong" aria-hidden="true">
        <Maximize className="h-5 w-5" />
      </span>
      <h2 id="preflight-fullscreen" className="font-display text-xl font-semibold">
        Ready to start
      </h2>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        The assessment runs in fullscreen. Leaving fullscreen, switching tabs or switching windows
        is a warning, so close anything that might pull focus — chat apps, calendar reminders,
        update prompts — before you begin.
      </p>
      <p className="mt-3 font-mono text-xs text-muted-foreground">Attempt {assessmentId}</p>

      <div className="mt-7 flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
        <Button onClick={onStart}>
          <Maximize aria-hidden="true" />
          Enter fullscreen and start
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </section>
  );
}
