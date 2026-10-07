import { Link } from "react-router-dom";

import { Mark } from "@/components/brand/Mark";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** The previous design's 404, with the brand mark (rebrand Phase 3). */
export default function NotFoundPage() {
  useDocumentTitle("Page not found");

  return (
    <div className="mx-auto flex max-w-xl flex-col items-start px-4 py-20 sm:px-8">
      <Mark size={56} decorative />
      <p className="mt-6 font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-1 font-display text-2xl font-semibold">This page isn&apos;t here</h1>
      <p className="mt-3 max-w-prose text-muted-foreground">
        The link may be mistyped, or the page may have moved. Learning never closes, so let&apos;s get you back to your plan.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">Back to the dashboard</Link>
      </Button>
    </div>
  );
}
