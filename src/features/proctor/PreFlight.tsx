import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, CircleDashed, Maximize, Monitor, ScanFace, ShieldAlert, TriangleAlert, Volume2, X } from "lucide-react";

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
 *
 * **Every check states its own verdict.** Someone about to sit an hour-long monitored test should
 * never have to infer from a greyed-out button which of five things is wrong: each check says
 * passed, failed or not yet, in those words, with the reason next to it. The screen stays calm
 * while it does that — one cross-fade as the sequence advances, and no other motion anywhere. A
 * confident screen is a legible one, not a lively one.
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
  const index = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold">Before you start</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Five quick checks. Nothing is recorded until the assessment itself begins.
        </p>
      </header>

      <Stepper current={index} />

      {/* The one motion moment on this screen: the panel cross-fades as the sequence advances. */}
      <motion.div
        key={step}
        variants={fadeUp}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        className={cn(cardVariants({ density: "roomy" }), "mt-6 sm:p-8")}
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
// Chrome: the stepper and the check rows
// ---------------------------------------------------------------------------

/**
 * Where they are in the sequence.
 *
 * A numbered rail rather than a progress bar: five named checks that each either passed or did
 * not is more useful than one bar at 60%, and it lets a finished step keep saying "passed"
 * instead of disappearing into a fill.
 */
function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3" aria-label="Pre-flight checks">
      {STEPS.map((entry, index) => {
        const isCurrent = index === current;
        const isDone = index < current;
        return (
          <li key={entry.id} className="flex items-center gap-2">
            <span
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full border py-1 pl-1 pr-3",
                isDone && "border-summit/40 bg-summit/[0.08]",
                isCurrent && "border-trailmark bg-trailmark/[0.09]",
                !isDone && !isCurrent && "border-border bg-surface",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] tabular",
                  isDone && "bg-summit text-summit-foreground",
                  isCurrent && "bg-trailmark text-trailmark-foreground",
                  !isDone && !isCurrent && "bg-surface-sunken text-muted-foreground",
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  isCurrent ? "text-foreground" : isDone ? "text-summit-strong" : "text-muted-foreground",
                )}
              >
                {entry.label}
              </span>
              <span className="sr-only">
                {isDone ? " — passed" : isCurrent ? " — in progress" : " — not started"}
              </span>
            </span>
            {index < STEPS.length - 1 && (
              <span aria-hidden="true" className={cn("hidden h-px w-4 sm:block", isDone ? "bg-summit/50" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

type CheckState = "pass" | "fail" | "pending" | "note";

/**
 * One check, with its verdict in words as well as in colour.
 *
 * Colour alone would fail anyone who cannot separate the green from the red, so every row carries
 * a distinct glyph and a screen-reader-only verdict. "Not yet" is its own state, deliberately
 * distinct from "failed": a check that has not run is not a problem to fix.
 */
function CheckRow({ state, label, detail }: { state: CheckState; label: ReactNode; detail?: ReactNode }) {
  const Icon = state === "pass" ? Check : state === "fail" ? X : state === "note" ? TriangleAlert : CircleDashed;
  const verdict = state === "pass" ? "Passed" : state === "fail" ? "Failed" : state === "note" ? "Note" : "Not yet";

  return (
    <li className="flex items-start gap-2.5 py-1.5">
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
          state === "pass" && "bg-summit/15 text-summit-strong",
          state === "fail" && "bg-destructive/12 text-destructive",
          state === "note" && "bg-trailmark/15 text-trailmark-strong",
          state === "pending" && "bg-surface-sunken text-muted-foreground",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 text-sm">
        <span className="sr-only">{verdict}: </span>
        <span className={cn(state === "fail" && "text-destructive", state === "pending" && "text-muted-foreground")}>
          {label}
        </span>
        {detail && <span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span>}
      </span>
    </li>
  );
}

function StepIcon({ children }: { children: ReactNode }) {
  return (
    <span
      className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-trailmark/15 text-trailmark-strong [&_svg]:h-5 [&_svg]:w-5"
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

/** The same two buttons, in the same order, on every step. Predictability is the whole point. */
function StepActions({
  primary,
  secondary,
}: {
  primary: ReactNode;
  secondary: ReactNode;
}) {
  return (
    <div className="mt-7 flex flex-col gap-2 border-t pt-5 sm:flex-row-reverse sm:justify-start">
      {primary}
      {secondary}
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
      <StepIcon>
        <ShieldAlert />
      </StepIcon>
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

      {/* The label does not change under `loading` — the spinner already says "working", and a
          label that swaps would resize the button while someone is reaching for it. */}
      <StepActions
        primary={
          <Button onClick={onAgree} loading={busy}>
            I agree, check my camera
          </Button>
        }
        secondary={
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        }
      />
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

  // Each of the four conditions the calibrator is actually waiting on, reported separately: "it
  // will not continue" is far less useful than "it cannot see your face".
  const faceState: CheckState = sample === null ? "pending" : sample.faceCount >= 1 ? "pass" : "fail";
  const aloneState: CheckState = sample === null ? "pending" : sample.faceCount > 1 ? "fail" : sample.faceCount === 1 ? "pass" : "pending";
  const centredState: CheckState = sample === null || sample.faceCount !== 1 ? "pending" : sample.centred ? "pass" : "fail";
  const holdState: CheckState = ready ? "pass" : "pending";

  return (
    <section aria-labelledby="preflight-camera">
      <StepIcon>
        <ScanFace />
      </StepIcon>
      <h2 id="preflight-camera" className="font-display text-xl font-semibold">
        Camera check
      </h2>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Sit the way you plan to sit for the test and look at the screen. This records your resting
        head position, so glancing away is measured against how you actually sit, not against a
        fixed idea of it.
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]">
        <div className="overflow-hidden rounded-md border bg-editor">
          <video ref={videoRef} muted playsInline autoPlay aria-label="Your camera preview" className="h-64 w-full scale-x-[-1] object-cover" />
        </div>

        <ul className="text-sm">
          <CheckRow state={faceState} label="A face is visible" />
          <CheckRow state={aloneState} label="Only you in frame" />
          <CheckRow state={centredState} label="Centred and close enough" />
          <CheckRow
            state={holdState}
            label="Resting position recorded"
            detail={ready ? undefined : `Holding steady — ${percent}%`}
          />
        </ul>
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

      <StepActions
        primary={
          <Button onClick={onContinue} disabled={!ready}>
            Continue
          </Button>
        }
        secondary={
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        }
      />
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
      <StepIcon>
        <Volume2 />
      </StepIcon>
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

      <ul className="mt-5 text-sm">
        <CheckRow
          state={played ? "pass" : "pending"}
          label={played ? "Tone played" : "Play the tone to continue"}
          detail={played ? "If you did not hear it, turn the volume up and play it again." : undefined}
        />
      </ul>

      <StepActions
        primary={
          <Button onClick={onConfirm} disabled={!played}>
            I heard it
          </Button>
        }
        secondary={
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
        }
      />
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
      <StepIcon>
        <Monitor />
      </StepIcon>
      <h2 id="preflight-environment" className="font-display text-xl font-semibold">
        Your setup
      </h2>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        These are checked live. Fixing one clears it here without going back a step.
      </p>

      {/* `role="status"` rather than `alert`: it updates as the window is resized, and an alert
          that fires on every drag would be unusable with a screen reader. */}
      <ul className="mt-5" role="status">
        <CheckRow
          state={environment.coarsePointer ? "fail" : "pass"}
          label={environment.coarsePointer ? "A keyboard and mouse are needed" : "Keyboard and pointer"}
          detail={
            environment.coarsePointer
              ? "This is a touch device. The coding items are not usable without a real keyboard — move to a desktop or laptop."
              : undefined
          }
        />
        <CheckRow
          state={environment.narrowViewport ? "fail" : "pass"}
          label={
            environment.narrowViewport
              ? `Window is too narrow — ${environment.width} px of ${MIN_VIEWPORT_PX} px`
              : `Window is wide enough — ${environment.width} px`
          }
          detail={
            environment.narrowViewport
              ? "Maximise the window or move to a larger screen. This clears on its own the moment it is wide enough."
              : undefined
          }
        />
        <CheckRow
          state={environment.extendedDisplay ? "note" : "pass"}
          label={environment.extendedDisplay ? "A second display is connected" : "One display"}
          detail={
            environment.extendedDisplay
              ? "Allowed, but logged as a note on your attempt, and the camera only sees the screen you are facing. Disconnect it if you can."
              : undefined
          }
        />
      </ul>

      <StepActions
        primary={
          <Button onClick={onContinue} disabled={blocked}>
            Continue
          </Button>
        }
        secondary={
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        }
      />
      {blocked && (
        <p className="mt-3 text-xs text-muted-foreground">
          Continue unlocks once the failed checks above are green.
        </p>
      )}
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
      <StepIcon>
        <Maximize />
      </StepIcon>
      <h2 id="preflight-fullscreen" className="font-display text-xl font-semibold">
        Ready to start
      </h2>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        The assessment runs in fullscreen. Leaving fullscreen, switching tabs or switching windows
        is a warning, so close anything that might pull focus — chat apps, calendar reminders,
        update prompts — before you begin.
      </p>

      <ul className="mt-5 text-sm">
        <CheckRow state="pass" label="Consent recorded" />
        <CheckRow state="pass" label="Camera and resting position" />
        <CheckRow state="pass" label="Warning sound" />
        <CheckRow state="pass" label="Screen and pointer" />
        <CheckRow state="pending" label="Fullscreen" detail="Entered when you press start." />
      </ul>

      <p className="mt-5 font-mono text-xs text-muted-foreground">Attempt {assessmentId}</p>

      <StepActions
        primary={
          <Button onClick={onStart}>
            <Maximize aria-hidden="true" />
            Enter fullscreen and start
          </Button>
        }
        secondary={
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        }
      />
    </section>
  );
}
