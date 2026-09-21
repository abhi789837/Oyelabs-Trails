import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NotFoundPage() {
  useDocumentTitle("Off trail");

  return (
    <div className="mx-auto flex max-w-xl flex-col items-start px-4 py-20 sm:px-8">
      <svg viewBox="0 0 160 60" className="h-16 w-auto text-basalt" aria-hidden="true">
        <path
          d="M4 50 C 40 50, 40 14, 76 14 S 110 40, 124 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="1 6"
          strokeLinecap="round"
        />
        <circle cx="4" cy="50" r="4" fill="rgb(var(--summit))" />
        <path d="M134 22 l12 12 M146 22 l-12 12" stroke="rgb(var(--trailmark))" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <p className="mt-6 font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-1 text-2xl font-bold">You've wandered off the trail</h1>
      <p className="mt-3 max-w-prose text-muted-foreground">
        This page doesn't exist. The link may be mistyped, or the topic may have moved.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">Back to the dashboard</Link>
      </Button>
    </div>
  );
}
