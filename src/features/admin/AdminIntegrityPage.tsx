import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { IntegrityTimeline } from "./learner/IntegrityTab";

/**
 * The integrity timeline at its own route, for linking to from the live board and the evaluation.
 *
 * The timeline itself lives in `learner/IntegrityTab`, which the learner detail page also renders —
 * one implementation, two places to reach it.
 */
export default function AdminIntegrityPage() {
  const { assessmentId = "" } = useParams();
  useDocumentTitle("Integrity");

  return (
    <div className="max-w-4xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin">
          <ArrowLeft aria-hidden="true" />
          People
        </Link>
      </Button>

      <h1 className="mt-4 text-2xl font-bold">Integrity events</h1>

      <div className="mt-2">
        <IntegrityTimeline assessmentId={assessmentId} />
      </div>
    </div>
  );
}
