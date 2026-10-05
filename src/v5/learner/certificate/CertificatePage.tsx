import { useParams } from "react-router-dom";

import { ScreenPlaceholder } from "@/v5/app/ScreenPlaceholder";

/** Placeholder from v5 Phase 0. Replaced by the certificates group (P5). */
export default function CertificatePage() {
  const { certId } = useParams();
  return (
    <ScreenPlaceholder title="Certificate">
      <p className="font-mono text-xs text-muted-foreground">{certId}</p>
    </ScreenPlaceholder>
  );
}
