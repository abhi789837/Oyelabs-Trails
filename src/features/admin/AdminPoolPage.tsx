import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, LoaderCircle, Search, TriangleAlert, Undo2, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import type { AssessmentSummary, PoolItem } from "@shared/assessment";

import { api, ApiRequestError } from "@/api/client";
import { RichText } from "@/components/content/RichText";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, statusMeta } from "@/components/ui/status-badge";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { adminApi } from "./api";
import { ApprovalBanner, approvalNote } from "./ApprovalGate";
import { GenerationLog } from "./GenerationLog";
import { InfoTip } from "./catalog/InfoTip";

/**
 * The one drop reason a person can author, mirrored from the server.
 *
 * Every other value in `dropReason` is written by the generator or the critic and quotes the item's
 * own content, so the column is rendered on the assumption it may be an answer key. This constant is
 * what tells the two apart.
 */
const ADMIN_DROP_REASON = "dropped_by_admin";

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
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [areaFilter, setAreaFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [search, setSearch] = useState("");

  /* The pool is only the admin's to change before anything has been served — the same rule the
     server enforces. Past that the items belong to a learner's attempt. */
  const editable = data !== null && ["awaiting_approval", "ready"].includes(data.assessment.status);
  const filtering = areaFilter !== "all" || kindFilter !== "all" || difficultyFilter !== "all" || search.trim() !== "";

  const toggleDropped = async (item: PoolItem) => {
    setBusyItemId(item.id);
    setError(null);
    try {
      await adminApi.setPoolItemDropped(assessmentId, item.id, item.status !== "dropped");
      await reload();
      notify.success(item.status === "dropped" ? "Put the item back in the pool." : "Dropped that item.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not change that item.");
    } finally {
      setBusyItemId(null);
    }
  };

  useDocumentTitle("Assessment pool");

  const reload = useCallback(async () => {
    try {
      setData(await api.get<PoolResponse>(`/api/admin/assessments/${assessmentId}/pool`));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not load the pool.");
    }
  }, [assessmentId]);

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

  /**
   * What each planned area actually produced.
   *
   * Driven by the blueprint rather than by the items, so an area that came back with nothing
   * still appears — generation no longer fails over a bad batch, which only stays safe if
   * "this area is missing" is as visible as the items that did survive.
   */
  const areaStats = useMemo(() => {
    const counts = new Map<string, { kept: number; dropped: number }>();
    for (const item of data?.pool ?? []) {
      const entry = counts.get(item.area) ?? { kept: 0, dropped: 0 };
      entry[item.status === "dropped" ? "dropped" : "kept"] += 1;
      counts.set(item.area, entry);
    }
    return (data?.assessment.blueprint?.areas ?? []).map((area) => ({
      name: area.name,
      ...(counts.get(area.name) ?? { kept: 0, dropped: 0 }),
    }));
  }, [data]);

  /* Filtering a pool of thirty-odd items across six areas is the difference between reading it and
     scrolling past it — and with the drop control now on each card, "show me every level-5 code
     item" is how an admin actually reviews one before approving. The prompt is searched, the key
     is not: the point is to find an item, not to grep the answers. */
  const filtered = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    return data.pool.filter((item) => {
      if (!showDropped && item.status === "dropped") return false;
      if (areaFilter !== "all" && item.area !== areaFilter) return false;
      if (kindFilter !== "all" && item.kind !== kindFilter) return false;
      if (difficultyFilter !== "all" && String(item.difficulty) !== difficultyFilter) return false;
      if (query && !item.payload.prompt.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [data, showDropped, areaFilter, kindFilter, difficultyFilter, search]);

  const byArea = useMemo(() => {
    const groups = new Map<string, PoolItem[]>();
    for (const item of filtered) {
      const list = groups.get(item.area) ?? [];
      list.push(item);
      groups.set(item.area, list);
    }
    return [...groups.entries()].map(([area, items]) => ({
      area,
      items: items.sort((a, b) => a.difficulty - b.difficulty),
    }));
  }, [filtered]);

  /** Options from the pool itself, so no control offers something the pool does not contain. */
  const areaOptions = useMemo(() => [...new Set((data?.pool ?? []).map((i) => i.area))].sort(), [data]);
  const kindOptions = useMemo(() => [...new Set((data?.pool ?? []).map((i) => i.kind))].sort(), [data]);

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
  // Items leave "pool" as the selector reaches for them, so anything not still sitting in the
  // pool is something the learner was actually put in front of.
  const servedSoFar = data.pool.filter(
    (i) => i.status === "served" || i.status === "answered" || i.status === "skipped",
  ).length;
  const emptyAreas = areaStats.filter((area) => area.kept === 0);
  const target = data.assessment.blueprint?.targetItemCount ?? 0;
  const thin = emptyAreas.length > 0 || (target > 0 && kept < target);

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
          Attempt {data.assessment.attemptNo} · {statusMeta("assessment", data.assessment.status).label} · {kept} kept,{" "}
          {dropped}{" "}
          dropped
          {approvalNote(data.assessment) && ` · ${approvalNote(data.assessment)}`}
        </p>

        {/*
         * The single most misread thing on this page. An admin who has just released an
         * assessment comes here to see "what was sent" and reasonably reads a list of questions
         * as the paper. It is not one, and saying so is cheaper than the confusion.
         */}
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">
          Not a fixed paper: the learner is served an adaptive subset of this <span className="font-medium text-foreground">pool</span>.{" "}
          <InfoTip label="About the pool">
            Everything the generator wrote and the critic kept. Each area climbs or drops in difficulty with their answers and
            stops once it has a reading, so two people given this pool are asked different questions.
          </InfoTip>
          {servedSoFar > 0 && (
            <>
              {" "}
              <span className="font-medium text-foreground">
                {servedSoFar} of the {kept} have been served so far
              </span>
              {" — the answers themselves are on the learner's assessment tab."}
            </>
          )}
        </p>
      </header>

      {/* Said before the gate, not after it: whether to approve a thinner assessment or re-issue
          is the decision being made on this page. */}
      {thin && (
        <div className="mt-4 rounded-md border border-trailmark/50 bg-trailmark/6 px-4 py-3">
          <p className="flex items-start gap-3 text-sm">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-trailmark-strong" aria-hidden="true" />
            <span>
              <span className="font-medium">This pool came out thinner than planned.</span>{" "}
              <span className="text-muted-foreground">
                {kept} items kept of {target} asked for
                {emptyAreas.length > 0 && (
                  <>
                    , and {emptyAreas.length} of {areaStats.length} areas produced nothing (
                    {emptyAreas.map((area) => area.name).join(", ")})
                  </>
                )}
                . It can still be approved and released — re-issue if you want a fuller one.
              </span>
            </span>
          </p>
        </div>
      )}

      {/* This page is where the gate belongs: approving should follow reading, not precede it. */}
      {data.assessment.status === "awaiting_approval" && (
        <div className="mt-4">
          <ApprovalBanner assessment={data.assessment} onApproved={reload} />
        </div>
      )}

      {/* Above the pool on purpose: how the pool was built is context for reading it, and while
          a run is still generating it is the only thing on this page worth watching. */}
      <section className="mt-8">
        <GenerationLog assessmentId={assessmentId} onFinished={reload} />
      </section>

      {data.assessment.blueprint && (
        <section className="mt-8" aria-labelledby="blueprint-heading">
          <h2 id="blueprint-heading" className="text-lg font-semibold">
            Test plan
          </h2>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">{data.assessment.blueprint.summary}</p>
          <ul className="mt-4 space-y-2">
            {data.assessment.blueprint.areas.map((area) => {
              const stat = areaStats.find((s) => s.name === area.name) ?? { kept: 0, dropped: 0 };
              return (
                <li key={area.name} className="rounded-md border px-4 py-3">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {area.name}
                    <Badge variant="outline">Expected level {area.hypothesisLevel}/5</Badge>
                    {stat.kept === 0 ? (
                      <Badge variant="danger">
                        Nothing usable — not covered
                      </Badge>
                    ) : (
                      <span className="font-mono text-xs font-normal text-muted-foreground">
                        {stat.kept + stat.dropped} generated · {stat.kept} kept · {stat.dropped} dropped
                      </span>
                    )}
                  </p>
                  <p className="mt-1 max-w-prose text-sm text-muted-foreground">{area.rationale}</p>
                  <p className="mt-1.5 font-mono text-xs text-muted-foreground">{area.moduleIds.join(" · ")}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch("")}
          leading={<Search aria-hidden="true" />}
          placeholder="Search the question"
          aria-label="Search the question text"
          containerClassName="max-w-xs"
        />

        {areaOptions.length > 1 && (
          <PoolSelect label="Area" value={areaFilter} onChange={setAreaFilter} options={areaOptions.map((a) => [a, a])} />
        )}
        {kindOptions.length > 1 && (
          <PoolSelect label="Kind" value={kindFilter} onChange={setKindFilter} options={kindOptions.map((k) => [k, k])} />
        )}
        <PoolSelect
          label="Difficulty"
          value={difficultyFilter}
          onChange={setDifficultyFilter}
          options={[1, 2, 3, 4, 5].map((d) => [String(d), `${d} of 5`])}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showDropped}
            onChange={(e) => setShowDropped(e.target.checked)}
            className="h-4 w-4 accent-[rgb(var(--trailmark))]"
          />
          Show dropped items
        </label>

        {filtering && (
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setAreaFilter("all");
              setKindFilter("all");
              setDifficultyFilter("all");
              setSearch("");
            }}
          >
            Clear filters
          </Button>
        )}

        <span className="text-xs text-muted-foreground" aria-live="polite">
          {filtered.length} of {data.pool.length} shown
        </span>

        {/* Says which mode the page is in, rather than leaving the absence of buttons to be
            interpreted. Once anything has been served the pool belongs to the attempt. */}
        <p className="ml-auto text-xs text-muted-foreground">
          {editable
            ? "You can drop anything that does not belong here before it reaches the learner."
            : "This pool is read-only — the assessment has been started."}
        </p>
      </div>

      {byArea.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          {filtering ? "Nothing in this pool matches those filters." : "This pool has no items in it."}
        </p>
      )}

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
                <ItemCard
                  key={item.id}
                  item={item}
                  editable={editable}
                  busy={busyItemId === item.id}
                  onToggleDropped={() => void toggleDropped(item)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function ItemCard({
  item,
  editable,
  busy,
  onToggleDropped,
}: {
  item: PoolItem;
  editable: boolean;
  busy: boolean;
  onToggleDropped: () => void;
}) {
  const droppedItem = item.status === "dropped";
  const byAdmin = item.dropReason === ADMIN_DROP_REASON;
  /* Only an admin's own drop is reversible here. Restoring one the critic rejected would override
     a different decision — the server refuses it, so the button is not offered either. */
  const canToggle = editable && (item.status === "pool" || (droppedItem && byAdmin));

  return (
    <li className={cn("rounded-md border px-4 py-3", droppedItem && "border-dashed opacity-70")}>
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
        <Badge variant="outline">{item.kind}</Badge>
        <span>difficulty {item.difficulty}/5</span>
        <span>·</span>
        <span>{item.topicIds.join(", ")}</span>
        {droppedItem && <StatusBadge kind="item" status="dropped" />}
        {canToggle && (
          <Button
            variant="ghost"
            size="sm"
            loading={busy}
            onClick={onToggleDropped}
            className={cn("ml-auto", !droppedItem && "text-destructive hover:text-destructive")}
          >
            {droppedItem ? (
              <>
                <Undo2 aria-hidden="true" />
                Put back
              </>
            ) : (
              <>
                <X aria-hidden="true" />
                Drop this
              </>
            )}
            <span className="sr-only"> — {item.kind} item, difficulty {item.difficulty}</span>
          </Button>
        )}
      </div>

      {droppedItem &&
        item.dropReason &&
        (byAdmin ? (
          <p className="mt-2 text-sm text-muted-foreground">You dropped this before release.</p>
        ) : (
          <p className="mt-2 text-sm text-destructive">{item.dropReason}</p>
        ))}

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

/** A labelled select with an "everything" option. Native — these are lists of plain strings. */
function PoolSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-input bg-surface px-2 py-1.5 text-xs"
      >
        <option value="all">Everything</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
