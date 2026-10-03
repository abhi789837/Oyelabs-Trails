import { useEffect, useState } from "react";

import type { ModuleVideoTotals } from "@shared/video";
import { formatSpan } from "@shared/video";

import { videosApi } from "./api";

/**
 * "4 h 10 min of video, 35 min watched" for a camp's header. Renders as one more entry of the
 * header's `<dl>`, and nothing at all until the totals load (or when the camp has no videos).
 */
export function ModuleVideoSummary({ trackId, moduleId }: { trackId: string; moduleId: string }) {
  const [totals, setTotals] = useState<ModuleVideoTotals | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setTotals(null);
    videosApi
      .moduleTotals(trackId, moduleId, controller.signal)
      .then(setTotals)
      .catch(() => undefined);
    return () => controller.abort();
  }, [trackId, moduleId]);

  if (!totals || totals.videos === 0) return null;

  const approx = totals.unknownDurations > 0 ? "at least " : "";
  return (
    <div>
      <dt className="sr-only">Video</dt>
      <dd>
        {approx}
        {formatSpan(totals.totalSeconds)} of video ({totals.videos} videos), {formatSpan(totals.watchedSeconds)} watched
      </dd>
    </div>
  );
}
