import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, LoaderCircle, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import type { AssessmentSummary, PoolItem } from "@shared/assessment";

import { api, ApiRequestError } from "@/api/client";
import { RichText } from "@/components/content/RichText";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/utils";

interface PoolResponse {
  assessment: AssessmentSummary;
  pool: PoolItem[];
}

/**
 * The item pool, for the admin (brief §17 P4).
 *
 * Shows everything the generator produced, grouped by area and difficulty, including the items
 * that were rejected and why. Seeing the rejects is the point: it is the only way to tell a model
 * writing weak items from a critic that is too strict.
 *
 * Superadmin-only, obviously — this page *is* the answer key.
 */
export default function AdminPoolPage() {
  const { assessmentId = "" } = useParams();
  const [data, setData] = useState<PoolResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDropped, setShowDropped] = useState(true);

  useDocumentTitle("Assessment pool");

  useEffect(() => {
    let cancelled = false;
    api
      .get<PoolResponse>(`/api/admin/assessments/${assessmentId}/pool`)
      .then((result) => !cancelled && setData(result))
      .catch((err) => !cancelled && setError(err instanceof ApiRequestError ? err.message : "Could not load the pool."));
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  const byArea = useMemo(() => {
    if (!data) return [];
    const groups = new Map<string, PoolItem[]>();
    for (const item of data.pool) {
      if (!showDropped && item.status === "dropped") continue;
      const list = groups.get(item.area) ?? [];
      list.push(item);
      groups.set(item.area, list);
    }
    return [...groups.entries()].map(([area, items]) => ({
      area,
      items: items.sort((a, b) => a.difficulty - b.difficulty),
    }));
  }, [data, showDropped]);

  if (error) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <FormAlert>{error}</FormAlert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground sm:px-6" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading the pool…
      </div>
    );
  }

  const kept = data.pool.filter((i) => i.status !== "dropped").length;
  const dropped = data.pool.length - kept;

  return (
    <div className="px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to={`/admin/people/${data.assessment.userId}`}>
          <ArrowLeft aria-hidden="true" />
          Back to the learner
        </Link>
      </Button>

      <header className="mt-4">
        <h1 className="text-2xl font-bold">Assessment pool</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          Attempt {data.assessment.attemptNo} · {data.assessment.status} · {kept} kept, {dropped} dropped
        </p>
      </header>

      {data.assessment.blueprint && (
        <section className="mt-8" aria-labelledby="blueprint-heading">
          <h2 id="blueprint-heading" className="text-lg font-semibold">
            Blueprint
          </h2>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">{data.assessment.blueprint.summary}</p>
          <ul className="mt-4 space-y-2">
            {data.assessment.blueprint.areas.map((area) => (
              <li key={area.name} className="rounded-md border px-4 py-3">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {area.name}
                  <Badge variant="outline">Expected level {area.hypothesisLevel}/5</Badge>
                </p>
                <p className="mt-1 max-w-prose text-sm text-muted-foreground">{area.rationale}</p>
                <p className="mt-1.5 font-mono text-xs text-muted-foreground">{area.moduleIds.join(" · ")}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showDropped}
            onChange={(e) => setShowDropped(e.target.checked)}
            className="h-4 w-4 accent-[rgb(var(--trailmark))]"
          />
          Show dropped items
        </label>
      </div>

      <div className="mt-6 space-y-10">
        {byArea.map(({ area, items }) => (
          <section key={area} aria-label={area}>
            <h2 className="text-lg font-semibold">
              {area}
              <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                {items.filter((i) => i.status !== "dropped").length} kept
              </span>
            </h2>
            <ul className="mt-3 space-y-3">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function ItemCard({ item }: { item: PoolItem }) {
  const droppedItem = item.status === "dropped";

  return (
    <li className={cn("rounded-md border px-4 py-3", droppedItem && "border-dashed opacity-70")}>
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
        <Badge variant="outline">{item.kind}</Badge>
        <span>difficulty {item.difficulty}/5</span>
        <span>·</span>
        <span>{item.topicIds.join(", ")}</span>
        {droppedItem && <Badge variant="outline" className="border-destructive/50 text-destructive">Dropped</Badge>}
      </div>

      {droppedItem && item.dropReason && (
        <p className="mt-2 text-sm text-destructive">{item.dropReason}</p>
      )}

      <RichText text={item.payload.prompt} className="mt-3" />

      {item.payload.options && (
        <ol className="mt-3 space-y-1 text-sm">
          {item.payload.options.map((option, index) => {
            const correct = item.key.correctIndices?.includes(index);
            return (
              <li key={index} className={cn("flex items-start gap-2", correct && "font-medium text-summit-strong")}>
                {correct ? (
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-label="Correct" />
                ) : (
                  <span className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                {option}
              </li>
            );
          })}
        </ol>
      )}

      {item.key.expectedOutput !== undefined && (
        <p className="mt-3 font-mono text-xs">
          <span className="text-muted-foreground">Expected output: </span>
          <span className="text-summit-strong">{JSON.stringify(item.key.expectedOutput)}</span>
        </p>
      )}

      {item.key.rubric && (
        <ul className="mt-3 space-y-1 text-sm">
          {item.key.rubric.map((point, index) => (
            <li key={index} className="text-muted-foreground">
              <span className="font-mono text-xs">({point.weight})</span> {point.point}
            </li>
          ))}
        </ul>
      )}

      {item.payload.functionName && (
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          {item.payload.functionName}() · {item.payload.visibleTests?.length ?? 0} visible,{" "}
          {item.key.hiddenTests?.length ?? 0} hidden tests
        </p>
      )}

      <p className="mt-3 border-l-2 border-basalt/40 pl-3 text-sm text-muted-foreground">{item.key.rationale}</p>

      {item.criticVerdict && (
        <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
          {item.criticVerdict.agreesWithKey ? (
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-summit-strong" aria-hidden="true" />
          ) : (
            <X className="mt-0.5 h-3 w-3 shrink-0 text-destructive" aria-hidden="true" />
          )}
          <span>
            <span className="font-medium">Critic:</span> {item.criticVerdict.answer}
            {item.criticVerdict.issues.length > 0 && ` — ${item.criticVerdict.issues.join("; ")}`}
          </span>
        </p>
      )}
    </li>
  );
}
