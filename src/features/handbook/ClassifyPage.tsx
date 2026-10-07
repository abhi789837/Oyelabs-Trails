import { Link } from "react-router-dom";

import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { DecisionTool } from "./DecisionTool";

/** `/tools/classify`: the decision tool on its own, for a live client request. */
export default function ClassifyPage() {
  useDocumentTitle("Classify a request");
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold">Bug, enhancement, change request or new feature?</h1>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Answer a few questions about the client&rsquo;s request to see what it is, how it is usually billed, and what to do
        next. Unsure of a word? Look it up in the{" "}
        <Link to="/glossary" className="font-medium text-foreground underline decoration-primary decoration-2 underline-offset-4">
          glossary
        </Link>
        .
      </p>
      <DecisionTool className="mt-8" />
    </div>
  );
}
