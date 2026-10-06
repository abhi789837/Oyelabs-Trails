import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { BookOpen, Clock, Film, Search, Sparkles, SlidersHorizontal, Text } from "lucide-react";
import { m } from "motion/react";
import { Link } from "react-router-dom";

import { Button } from "@/v5/design/components/Button";
import { Input } from "@/v5/design/components/Field";
import { Badge } from "@/v5/design/components/Primitives";
import { ProgressBar } from "@/v5/design/components/Progress";
import { EmptyState, ErrorState } from "@/v5/design/components/States";
import { cn } from "@/v5/design/cn";
import { transitions } from "@/v5/design/motion";
import type { LengthBucket, LibraryItem, LibraryLevel, LibraryResponse } from "@shared/me";

import { LibrarySkeleton } from "../skeletons";
import { PageFrame, V5Screen, formatMinutes, useApiData, useDelayed } from "../me/page";
import { EMPTY_FILTERS, FORMAT_LABELS, LENGTH_LABELS, LEVEL_LABELS, activeFilterCount, searchLibrary, skillOptions, type LibraryFilters } from "./libraryLogic";

/**
 * `/learn/library`: every course and curriculum module the learner can open, searchable as they
 * type, filterable by department, skill, level, length and format. Cards lead with outcomes ("You'll
 * be able to…"), then time and level, and say "Recommended for you" when it's on their path or
 * helps a goal.
 */
export default function LibraryPage() {
  return (
    <V5Screen>
      <LibraryScreen />
    </V5Screen>
  );
}

function LibraryScreen() {
  const { data, error, loading, reload } = useApiData<LibraryResponse>("/api/v5/me/library");
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const query = useDeferredValue(filters.query);
  const showSkeleton = useDelayed(loading && !data);

  const items = data?.items ?? [];
  const results = useMemo(() => searchLibrary(items, { ...filters, query }), [items, filters, query]);
  const skills = useMemo(() => skillOptions(items), [items]);
  const set = <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => setFilters((f) => ({ ...f, [key]: value }));
  const filterCount = activeFilterCount(filters);

  return (
    <PageFrame title="Library" lead="Everything you can learn here. Search, filter, and start anything that helps." wide>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="library-search" className="sr-only">
              Search the library
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-3" aria-hidden="true" />
            <Input
              id="library-search"
              type="search"
              placeholder="Search courses, skills and topics"
              value={filters.query}
              onChange={(e) => set("query", e.target.value)}
              className="pl-9"
              autoComplete="off"
            />
          </div>
          <Button variant="secondary" aria-expanded={showFilters} aria-controls="library-filters" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal aria-hidden="true" /> Filters{filterCount ? ` (${filterCount})` : ""}
          </Button>
        </div>

        <div id="library-filters" hidden={!showFilters} className="grid gap-3 rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad) sm:grid-cols-2 lg:grid-cols-5">
          <Select label="Department" value={filters.department} onChange={(v) => set("department", v)} options={[["all", "All departments"], ...(data?.departments ?? []).map((d) => [d.id, d.name] as [string, string])]} />
          <Select label="Skill" value={filters.skill} onChange={(v) => set("skill", v)} options={[["all", "All skills"], ...skills.map((s) => [s.id, s.name] as [string, string])]} />
          <Select
            label="Level"
            value={filters.level}
            onChange={(v) => set("level", v as LibraryLevel | "all")}
            options={[["all", "Any level"], ...(Object.entries(LEVEL_LABELS) as [string, string][])]}
          />
          <Select
            label="Length"
            value={filters.length}
            onChange={(v) => set("length", v as LengthBucket | "all")}
            options={[["all", "Any length"], ...(Object.entries(LENGTH_LABELS) as [string, string][])]}
          />
          <Select
            label="Format"
            value={filters.format}
            onChange={(v) => set("format", v as LibraryFilters["format"])}
            options={[
              ["all", "Any format"],
              ["video", FORMAT_LABELS.video],
              ["reading", FORMAT_LABELS.reading],
            ]}
          />
          {filterCount ? (
            <Button variant="link" className="justify-self-start sm:col-span-2 lg:col-span-5" onClick={() => setFilters((f) => ({ ...EMPTY_FILTERS, query: f.query }))}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      <p className="text-small text-fg-2" role="status" aria-live="polite">
        {data ? `${results.length} ${results.length === 1 ? "result" : "results"}` : ""}
      </p>

      {error && !data ? (
        <ErrorState title="We couldn't load the library" onRetry={() => void reload()} retrying={loading} />
      ) : !data ? (
        showSkeleton ? <LibrarySkeleton /> : null
      ) : items.length === 0 ? (
        <EmptyState icon={<BookOpen />} title="Your library is empty for now" body="Courses appear here once your admin sets up your plan or adds courses for your team." />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="Nothing matches"
          body="Try fewer words, or clear the filters."
          action={
            <Button variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear search and filters
            </Button>
          }
        />
      ) : (
        <m.ul className="grid gap-(--v5-gap) sm:grid-cols-2 xl:grid-cols-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={transitions.calm} aria-label="Courses">
          {results.map((item) => (
            <li key={item.id} className="flex">
              <CourseCard item={item} />
            </li>
          ))}
        </m.ul>
      )}
    </PageFrame>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  const id = `library-filter-${label.toLowerCase()}`;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-small font-medium text-fg-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-(--v5-control-h) w-full rounded-control border border-line-2 bg-surface-1 px-2 text-body text-fg-1 focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/30"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

export function courseHref(id: string): string {
  return `/learn/library/${encodeURIComponent(id)}`;
}

export function FormatChip({ format }: { format: LibraryItem["format"] }) {
  const Icon = format === "video" ? Film : format === "reading" ? Text : BookOpen;
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="size-3.5" aria-hidden="true" />
      {FORMAT_LABELS[format]}
    </span>
  );
}

export function RecommendedBadge({ why }: { why: string | null }): ReactNode {
  return (
    <Badge tone="brand" title={why ?? undefined}>
      <Sparkles aria-hidden="true" /> Recommended for you
    </Badge>
  );
}

function CourseCard({ item }: { item: LibraryItem }) {
  const started = item.doneCount > 0;
  const finished = item.lessonCount > 0 && item.doneCount >= item.lessonCount;
  return (
    <article
      className={cn(
        "relative flex w-full flex-col gap-3 rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad) shadow-e1 transition-[box-shadow,transform] duration-200 ease-enter",
        "focus-within:shadow-e2 hover:-translate-y-0.5 hover:shadow-e2",
      )}
      data-testid="library-card"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {item.recommended ? <RecommendedBadge why={item.recommendedWhy} /> : null}
        {finished ? <Badge tone="success">Finished</Badge> : started ? <Badge tone="info">In progress</Badge> : null}
        <Badge tone="outline">{item.kind === "module" ? "Module" : "Course"}</Badge>
      </div>
      <h2 className="font-display text-h4 font-semibold leading-snug">
        <Link to={courseHref(item.id)} className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus">
          {item.title}
        </Link>
      </h2>
      {item.recommended && item.recommendedWhy ? <p className="-mt-2 text-small text-brand-fg">{item.recommendedWhy}</p> : null}
      {item.outcomes.length ? (
        <div>
          <p className="text-small font-medium text-fg-1">You'll be able to:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-small text-fg-2">
            {item.outcomes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-small text-fg-2">{item.summary}</p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-fg-2">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden="true" />
          {formatMinutes(item.minutes)}
        </span>
        {item.level ? <span>{LEVEL_LABELS[item.level]}</span> : null}
        <span>
          {item.lessonCount} {item.lessonCount === 1 ? "lesson" : "lessons"}
        </span>
        <FormatChip format={item.format} />
      </div>
      {started && !finished ? <ProgressBar value={item.doneCount} max={item.lessonCount} label="Lessons done" showValue={`${item.doneCount} of ${item.lessonCount}`} size="sm" /> : null}
    </article>
  );
}
