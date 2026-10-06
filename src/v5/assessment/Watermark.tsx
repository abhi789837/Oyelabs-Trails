import { useEffect, useMemo, useState } from "react";

import { cn } from "@/v5/design/cn";

function escapeXml(text: string): string {
  return text.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

/**
 * The deterrent stamp over the questions (same text as the v4 `Watermark`: name, @username, test id
 * and the time to the minute), drawn as a tiled SVG background rather than text nodes. It is
 * decoration, not content: as text it was read by assistive tech checks as low-contrast copy.
 */
export function Watermark({ name, username, assessmentId, className }: { name: string; username: string; assessmentId: string; className?: string }) {
  const [minute, setMinute] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setMinute(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const image = useMemo(() => {
    const time = new Date(minute).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    const label = escapeXml(`${name} @${username} — ${assessmentId} — ${time}`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="150"><text x="0" y="90" transform="rotate(-18 260 75)" font-family="monospace" font-size="11" fill="currentColor">${label}</text></svg>`;
    return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
  }, [name, username, assessmentId, minute]);

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 select-none overflow-hidden", className)}>
      {/* currentColor isn't inherited into a background image, so the colour is set by masking. */}
      <div className="absolute inset-0 bg-fg-1 opacity-[0.06]" style={{ maskImage: image, WebkitMaskImage: image, maskRepeat: "repeat", WebkitMaskRepeat: "repeat" }} />
    </div>
  );
}
