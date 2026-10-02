import { ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/utils";
import { TERM_CATEGORIES, TERM_CATEGORY_LABELS, type TermCategory } from "@shared/handbook";
import { Flashcards } from "./Flashcards";

/** `/glossary/practice`: spaced repetition over the handbook, optionally one category at a time. */
export default function FlashcardsPage() {
  useDocumentTitle("Flashcards");
  const [params, setParams] = useSearchParams();
  const raw = params.get("category");
  const category = raw && (TERM_CATEGORIES as readonly string[]).includes(raw) ? (raw as TermCategory) : undefined;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <Link to="/glossary" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Glossary
      </Link>
      <h1 className="mt-3 font-display text-2xl font-bold">Flashcards</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Say the meaning out loud, then flip. Cards you find easy come back less often.
      </p>

      <div role="group" aria-label="Category" className="mt-5 flex flex-wrap gap-1.5">
        {[undefined, ...TERM_CATEGORIES].map((c) => {
          const pressed = c === category;
          return (
            <button
              key={c ?? "all"}
              type="button"
              aria-pressed={pressed}
              onClick={() => setParams(c ? { category: c } : {}, { replace: true })}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trailmark",
                pressed ? "border-primary bg-primary text-primary-foreground" : "bg-surface hover:bg-accent",
              )}
            >
              {c ? TERM_CATEGORY_LABELS[c] : "All terms"}
            </button>
          );
        })}
      </div>

      <Flashcards key={category ?? "all"} category={category} className="mt-6" />
    </div>
  );
}
