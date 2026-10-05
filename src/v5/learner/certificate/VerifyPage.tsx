import { useParams } from "react-router-dom";

import { ScreenPlaceholder } from "@/v5/app/ScreenPlaceholder";

/**
 * Placeholder from v5 Phase 0. Replaced by the certificates group (P5).
 *
 * Public: App.tsx mounts this outside the sign-in gate and outside both designs' shells, so anyone
 * given a certificate link can check it. Keep it free of anything that needs a session.
 */
export default function VerifyPage() {
  const { certId } = useParams();
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <ScreenPlaceholder title="Check a certificate">
        <p className="font-mono text-xs text-muted-foreground">{certId}</p>
      </ScreenPlaceholder>
    </main>
  );
}
