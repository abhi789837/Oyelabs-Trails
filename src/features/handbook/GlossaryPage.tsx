import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ExternalLink, Layers, LoaderCircle, Scale, Search } from "lucide-react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";

import { ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/utils";
import {
  LEGAL_NOTE,
  PROJECT_TYPES,
  TERM_CATEGORIES,
  TERM_CATEGORY_LABELS,
  type GlossaryTerm,
  type ProjectType,
  type Term,
  type TermCategory,
} from "@shared/handbook";
import { handbookApi } from "./api";
import { filterTerms, groupByLetter, type GlossaryFilter } from "./glossaryFilter";
import { StatusChip } from "./StatusChip";
import { humaniseId, isPlaceholder, withoutMarker } from "./termLinks";
import { useGlossary } from "./useGlossary";

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = { custom: "Custom", whitelabel: "White-label" };

/** The filter lives in the URL, so opening a term (a new route) and coming back keeps it. */
function useGlossaryFilter(): [GlossaryFilter, (next: GlossaryFilter) => void] {
  const [params, setParams] = useSearchParams();
  const filter = useMemo<GlossaryFilter>(() => {
    const categories = (params.get("cat") ?? "").split(",").filter((c): c is TermCategory => (TERM_CATEGORIES as readonly string[]).includes(c));
    const type = params.get("type");
    return {
      query: params.get("q") ?? "",
      categories,
      projectType: type && (PROJECT_TYPES as readonly string[]).includes(type) ? (type as ProjectType) : null,
    };
  }, [params]);
  const update = (next: GlossaryFilter) => {
    const out = new URLSearchParams();
    if (next.query) out.set("q", next.query);
    if (next.categories.length) out.set("cat", next.categories.join(","));
    if (next.projectType) out.set("type", next.projectType);
    setParams(out, { replace: true });
  };
  return [filter, update];
}

/**
 * `/glossary` and `/glossary/:termId`: every handbook term, searchable and filterable, with the
 * full entry beside the list (or instead of it, on a phone).
 */
export default function GlossaryPage() {
  const { termId } = useParams();
  const glossary = useGlossary();
  const [filter, setFilter] = useGlossaryFilter();
  const { search } = useLocation();
  const selected = termId ? glossary.byId.get(termId) : undefined;
  useDocumentTitle(selected ? `${selected.name} · Glossary` : "Glossary");

  const results = useMemo(() => filterTerms(glossary.terms, filter), [glossary.terms, filter]);
  const groups = useMemo(() => (filter.query.trim() ? null : groupByLetter(results)), [results, filter.query]);

  const toggleCategory = (category: TermCategory) =>
    setFilter({
      ...filter,
      categories: filter.categories.includes(category) ? filter.categories.filter((c) => c !== category) : [...filter.categories, category],
    });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Glossary</h1>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            Every process term we use with clients, what it means at Oyelabs, and how to say it. Terms marked
            &ldquo;to confirm&rdquo; are the industry standard until Oyelabs confirms its own meaning.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/glossary/practice">
            <Layers aria-hidden="true" />
            Practise with flashcards
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className={cn(termId && "hidden lg:block")}>
          <label htmlFor="glossary-search" className="sr-only">
            Search the glossary
          </label>
          <Input
            id="glossary-search"
            type="search"
            value={filter.query}
            onChange={(e) => setFilter({ ...filter, query: e.target.value })}
            onClear={() => setFilter({ ...filter, query: "" })}
            placeholder="Search names, abbreviations, definitions"
            leading={<Search className="size-4 text-muted-foreground" aria-hidden="true" />}
          />

          <div role="group" aria-label="Category" className="mt-3 flex flex-wrap gap-1.5">
            {TERM_CATEGORIES.map((category) => (
              <Chip key={category} pressed={filter.categories.includes(category)} onClick={() => toggleCategory(category)}>
                {TERM_CATEGORY_LABELS[category]}
              </Chip>
            ))}
          </div>
          <div role="group" aria-label="Project type" className="mt-2 flex flex-wrap gap-1.5">
            {PROJECT_TYPES.map((type) => (
              <Chip
                key={type}
                pressed={filter.projectType === type}
                onClick={() => setFilter({ ...filter, projectType: filter.projectType === type ? null : type })}
              >
                {PROJECT_TYPE_LABELS[type]}
              </Chip>
            ))}
          </div>

          <p className="mt-4 font-mono text-xs text-muted-foreground" aria-live="polite">
            {glossary.status === "ready" ? `${results.length} of ${glossary.terms.length} terms` : ""}
          </p>

          {glossary.status === "error" && (
            <div className="mt-3">
              <FormAlert>{glossary.message}</FormAlert>
            </div>
          )}
          {(glossary.status === "loading" || glossary.status === "idle") && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              Loading the glossary…
            </p>
          )}
          {glossary.status === "ready" && results.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">No terms match. Try fewer words, or clear a filter.</p>
          )}

          <nav aria-label="Terms" className="mt-2">
            {groups
              ? groups.map((group) => (
                  <section key={group.letter} aria-labelledby={`glossary-letter-${group.letter}`} className="mt-4">
                    <h2 id={`glossary-letter-${group.letter}`} className="border-b pb-1 font-mono text-xs font-semibold text-muted-foreground">
                      {group.letter}
                    </h2>
                    <TermList terms={group.terms} current={termId} search={search} />
                  </section>
                ))
              : results.length > 0 && <TermList terms={results} current={termId} search={search} />}
          </nav>
        </div>

        <div className={cn(!termId && "hidden lg:block")}>
          {termId ? (
            <TermDetail key={termId} termId={termId} search={search} />
          ) : (
            <div className="rounded-md border border-dashed px-6 py-10 text-sm text-muted-foreground">
              Pick a term to see everything about it: the Oyelabs meaning, an example, what it does to time and billing, and
              the terms it is easily confused with.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
        pressed ? "border-primary bg-primary text-primary-foreground" : "bg-surface text-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function TermList({ terms, current, search }: { terms: GlossaryTerm[]; current?: string; search: string }) {
  return (
    <ul className="divide-y">
      {terms.map((term) => (
        <li key={term.id}>
          <Link
            to={`/glossary/${term.id}${search}`}
            aria-current={term.id === current ? "page" : undefined}
            className={cn(
              "-mx-2 block rounded-md px-2 py-2 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
              term.id === current && "bg-accent",
            )}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">
                {term.name}
                {term.aka.length > 0 && <span className="ml-1.5 font-mono text-xs font-normal text-muted-foreground">{term.aka.join(", ")}</span>}
              </span>
              {term.status === "confirmed" && <span className="sr-only">Confirmed by Oyelabs</span>}
            </span>
            <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{term.definition}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

type Loaded<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; value: T };

function TermDetail({ termId, search }: { termId: string; search: string }) {
  const glossary = useGlossary();
  const [entry, setEntry] = useState<Loaded<Term>>({ status: "loading" });
  const [confused, setConfused] = useState<Term[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    handbookApi
      .term(termId, controller.signal)
      .then(async ({ entry }) => {
        setEntry({ status: "ready", value: entry.data });
        // The comparison cards need each look-alike's example and impact, which the glossary omits.
        const others = await Promise.all(
          entry.data.confusedWith.map((id) =>
            handbookApi
              .term(id, controller.signal)
              .then((r) => r.entry.data)
              .catch(() => null),
          ),
        );
        setConfused(others.filter((t): t is Term => t !== null));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setEntry({
          status: "error",
          message: error instanceof ApiRequestError && error.status === 404 ? "This term isn't in the handbook (it may have been archived)." : "This term couldn't be loaded.",
        });
      });
    return () => controller.abort();
  }, [termId]);

  const backLink = (
    <Link to={`/glossary${search}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground lg:hidden">
      <ArrowLeft className="size-4" aria-hidden="true" />
      All terms
    </Link>
  );

  if (entry.status === "loading") {
    return (
      <div>
        {backLink}
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Loading…
        </p>
      </div>
    );
  }
  if (entry.status === "error") {
    return (
      <div>
        {backLink}
        <FormAlert>{entry.message}</FormAlert>
      </div>
    );
  }

  const term = entry.value;
  const nameOf = (id: string) => glossary.byId.get(id)?.name ?? humaniseId(id);
  const termHref = (id: string) => `/glossary/${id}${search}`;

  return (
    <article aria-labelledby="term-heading">
      {backLink}
      <header>
        <p className="font-mono text-xs text-muted-foreground">
          {TERM_CATEGORY_LABELS[term.category]} / {term.projectTypes.map((p) => PROJECT_TYPE_LABELS[p]).join(" and ")}
        </p>
        <h2 id="term-heading" className="mt-1 font-display text-2xl font-bold">
          {term.name}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusChip status={term.status} />
          {term.aka.length > 0 && <span className="font-mono text-xs text-muted-foreground">Also: {term.aka.join(", ")}</span>}
        </div>
      </header>

      <dl className="mt-6 space-y-5 text-[0.95rem] leading-relaxed">
        <Field label="Definition">{term.definition}</Field>
        <Field label="At Oyelabs">
          {isPlaceholder(term.oyelabsMeaning) ? (
            <span className="text-muted-foreground">
              <span className="font-medium text-trailmark-strong">To confirm. </span>
              {withoutMarker(term.oyelabsMeaning)}
            </span>
          ) : (
            term.oyelabsMeaning
          )}
        </Field>
        <Field label="Example">{term.example}</Field>
        <Field label="Say it to a client">
          <span className="italic">&ldquo;{term.clientSentence}&rdquo;</span>
        </Field>
        <Field label="Impact on time and billing">{term.impact}</Field>
        {term.related.length > 0 && (
          <Field label="Related">
            <TermLinks ids={term.related} nameOf={nameOf} href={termHref} />
          </Field>
        )}
        {term.confusedWith.length > 0 && (
          <Field label="Commonly confused with">
            <TermLinks ids={term.confusedWith} nameOf={nameOf} href={termHref} />
          </Field>
        )}
        {term.sources.length > 0 && (
          <Field label="Sources">
            <ul className="space-y-1">
              {term.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                  >
                    {source.label}
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </Field>
        )}
      </dl>

      {term.contractual && <p className="mt-6 rounded-md border px-3 py-2 text-xs text-muted-foreground">{LEGAL_NOTE}</p>}

      {confused.length > 0 && (
        <section aria-labelledby="compare-heading" className="mt-10 border-t pt-6">
          <h3 id="compare-heading" className="flex items-center gap-2 font-display text-lg font-semibold">
            <Scale className="size-5 text-muted-foreground" aria-hidden="true" />
            Side by side
          </h3>
          <div className="mt-4 space-y-6">
            {confused.map((other) => (
              <ComparisonCard key={other.id} left={term} right={other} href={termHref(other.id)} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

function TermLinks({ ids, nameOf, href }: { ids: string[]; nameOf: (id: string) => string; href: (id: string) => string }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <li key={id}>
          <Link
            to={href(id)}
            className="inline-block rounded-sm border bg-surface px-2 py-0.5 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
          >
            {nameOf(id)}
          </Link>
        </li>
      ))}
    </ul>
  );
}

const COMPARE_ROWS: { key: "definition" | "example" | "impact"; label: string }[] = [
  { key: "definition", label: "Definition" },
  { key: "example", label: "Example" },
  { key: "impact", label: "Time and billing" },
];

/** Two columns on a wide screen, one term after the other on a phone. */
export function ComparisonCard({ left, right, href }: { left: Term; right: Term; href: string }) {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="grid sm:grid-cols-2 sm:divide-x">
        {[left, right].map((term, i) => (
          <div key={term.id} className={cn("px-4 py-4", i === 1 && "border-t sm:border-t-0")}>
            <p className="font-display font-semibold">
              {i === 1 ? (
                <Link to={href} className="underline-offset-4 hover:underline">
                  {term.name}
                </Link>
              ) : (
                term.name
              )}
            </p>
            <dl className="mt-3 space-y-3 text-sm leading-relaxed">
              {COMPARE_ROWS.map((row) => (
                <div key={row.key}>
                  <dt className="text-xs font-semibold text-muted-foreground">{row.label}</dt>
                  <dd className="mt-0.5">{term[row.key]}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
