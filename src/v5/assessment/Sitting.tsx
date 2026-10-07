import { useState } from "react";
import { useNavigate } from "react-router-dom";

import type { MyAssessment } from "@shared/assessment";

import { ApiRequestError } from "@/api/client";
import { assessmentApi } from "@/features/assessment/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { PreFlight } from "@/features/proctor/PreFlight";
import type { CalibrationPose } from "@/features/proctor/types";
import { useProctor } from "@/features/proctor/useProctor";
import { BrandBand } from "@/components/brand/BrandBand";

import { TestSheet, type FinishReason } from "./Sheet";

/**
 * The sitting: pre-flight, then the sheet. Lazy, because the face check (MediaPipe) and the code
 * editor load only here, never on the results screen.
 *
 * The pre-flight is the v4 `PreFlight`, unchanged inside a v5 frame, so the flow stays exactly
 * consent → camera → (microphone when there is a Speak question) → setup → full screen, and the
 * same server calls follow it: consent first and awaited, then start (consentWiring.test.ts).
 */
export default function Sitting({
  assessment,
  startTaking,
  onStarted,
  onFinished,
  onTerminated,
}: {
  assessment: MyAssessment;
  /** True when the server already says in_progress (a reload mid-test): skip the pre-flight. */
  startTaking: boolean;
  onStarted: () => void;
  onFinished: (reason: FinishReason) => void;
  onTerminated: () => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [taking, setTaking] = useState(startTaking);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [calibration, setCalibration] = useState<CalibrationPose | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const proctor = useProctor({
    assessmentId: assessment.id,
    stream,
    calibration,
    enabled: taking,
    onTerminated,
  });

  if (!taking) {
    return (
      <div className="min-h-dvh bg-surface-0 text-fg-1">
        <BrandBand />
        <main>
          <PreFlight
            assessmentId={assessment.id}
            needsMicrophone={Boolean(assessment.hasSpeak)}
            noun="test"
            busy={starting}
            error={startError}
            onCancel={() => navigate("/learn")}
            onReady={async (pose, mediaStream, permissions) => {
              if (starting) return;
              setCalibration(pose);
              setStream(mediaStream);
              setStarting(true);
              setStartError(null);
              try {
                // Consent first, and awaited: `start` reads it back (docs/bugs/assessment-consent.md).
                await assessmentApi.consent(assessment.id, permissions);
                await assessmentApi.start(assessment.id, permissions);
                setTaking(true);
                onStarted();
              } catch (err) {
                // Stay on the pre-flight: the stream and calibration are still good, so a retry is one press.
                setStartError(
                  err instanceof ApiRequestError
                    ? err.message
                    : "The test couldn't start. Try again.",
                );
              } finally {
                setStarting(false);
              }
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <TestSheet
      assessment={assessment}
      proctor={proctor}
      user={
        user ? { displayName: user.displayName, username: user.username } : null
      }
      onFinished={onFinished}
    />
  );
}
