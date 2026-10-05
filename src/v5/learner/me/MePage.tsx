import { useState } from "react";

import { ScreenPlaceholder } from "@/v5/app/ScreenPlaceholder";
import { chooseDesign } from "@/v5/app/designFlag";

/**
 * Placeholder from v5 Phase 0. Replaced by the Me group (P4), which keeps "Use previous design"
 * under Me, Settings (docs/v5/PLAN.md).
 */
export default function MePage() {
  const [busy, setBusy] = useState(false);
  return (
    <ScreenPlaceholder title="Me">
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void chooseDesign(false, "/").catch(() => setBusy(false));
        }}
        className="min-h-6 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong disabled:opacity-60"
      >
        Use previous design
      </button>
    </ScreenPlaceholder>
  );
}
