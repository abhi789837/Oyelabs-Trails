import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { BookCheck, ExternalLink } from "lucide-react";

import type { ServedTopic } from "@shared/content";
import { extractTakeaways, glossaryPhrases, readingMinutes, verifiedLabel } from "@shared/lessonCore";
import type { SopBlock } from "@shared/sop";

import { api } from "@/api/client";
import { useGlossary } from "@/features/handbook/useGlossary";
import { Button } from "@/v5/design/components/Button";
import { Callout, ReadingView } from "@/v5/design/components/Learning";
import { Badge } from "@/v5/design/components/Primitives";
import { ProgressBar } from "@/v5/design/components/Progress";

import { buildArticle, passageDomId } from "../article";
import { BlocksView, LessonMarkdown, LessonTopicContext } from "../LessonRich";

const HandbookCards = lazy(() => import("@/features/handbook/HandbookCards").then((m) => ({ default: m.HandbookCards })));
const TopicInteractive = lazy(() => import("@/features/handbook/TopicInteractive").then((m) => ({ default: m.TopicInteractive })));

const KIND_LABEL = { docs: "Docs", article: "Article", "interview-prep": "Interview prep", spec: "Spec", repo: "Code" } as const;

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** How far through the article the reader is, 0–100, whatever element is scrolling. */
function useReadProgress(ref: React.RefObject<HTMLElement | null>): number {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const total = rect.height - vh * 0.6;
      const read = total <= 0 ? (rect.top < vh ? 100 : 0) : ((vh * 0.4 - rect.top) / total) * 100;
      setPct(Math.max(0, Math.min(100, Math.round(read))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);
  return pct;
}

export interface ReadStepProps {
  topic: ServedTopic;
  done: boolean;
  onReadToEnd: () => void;
  /** A passage to bring into view (from a tutor citation). */
  focusPassage: string | null;
}

/**
 * The Read step: the topic's summary and sections as an article at reading width, key takeaways
 * first, callouts, glossary terms with tooltips, runnable code, and the sources with the date each
 * was last checked. Reaching the end (or "Mark as read") completes the step.
 */
export function ReadStep({ topic, done, onReadToEnd, focusPassage }: ReadStepProps) {
  const glossary = useGlossary();
  const phrases = useMemo(() => glossaryPhrases(glossary.terms), [glossary.terms]);
  const sections = useMemo(() => buildArticle(topic.summary, topic.sections ?? [], phrases), [topic.summary, topic.sections, phrases]);
  const takeaways = useMemo(() => extractTakeaways(topic.summary, topic.sections ?? []), [topic.summary, topic.sections]);
  const minutes = useMemo(() => readingMinutes([topic.summary, ...(topic.sections ?? []).map((s) => s.body)].join("\n")), [topic.summary, topic.sections]);
  const latestCheck = useMemo(() => {
    const dates = topic.webRefs.map((r) => r.verifiedAt).filter((d): d is string => Boolean(d && Number.isFinite(Date.parse(d))));
    return dates.sort().at(-1) ?? null;
  }, [topic.webRefs]);
  const [sop, setSop] = useState<SopBlock[]>([]);

  const articleRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pct = useReadProgress(articleRef);

  useEffect(() => {
    if (!topic.sopCount) return;
    const controller = new AbortController();
    api
      .get<{ blocks: SopBlock[] }>(`/api/content/topics/${encodeURIComponent(topic.id)}/sop`, controller.signal)
      .then((res) => setSop(res.blocks.filter((b) => b.body)))
      .catch(() => undefined);
    return () => controller.abort();
  }, [topic.id, topic.sopCount]);

  // Reaching the end of the article counts as read.
  useEffect(() => {
    if (done) return;
    const el = endRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) onReadToEnd();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [done, onReadToEnd]);

  useEffect(() => {
    if (!focusPassage) return;
    const el = document.getElementById(passageDomId(focusPassage));
    if (!el) return;
    const reduce = document.documentElement.dataset.motion === "reduce" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    el.focus({ preventScroll: true });
  }, [focusPassage, sections]);

  const meta = (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span>{minutes} min read</span>
      {latestCheck ? <span>Sources last checked {verifiedLabel(latestCheck)}</span> : null}
    </span>
  );

  return (
    <LessonTopicContext.Provider value={topic.id}>
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 -mx-4 bg-surface-0/95 px-4 py-2 backdrop-blur">
        <ProgressBar value={pct} size="sm" label="How much of this article you've read" />
      </div>
      <div ref={articleRef}>
        <ReadingView title={topic.title} meta={meta} takeaways={takeaways}>
          {sections.map((section, s) => (
            <section key={s} aria-label={section.heading ?? "Summary"}>
              {section.heading ? <h2>{section.heading}</h2> : null}
              {section.passages.map((p) => (
                <div key={p.id} id={passageDomId(p.id)} tabIndex={-1} data-passage={p.id} className="scroll-mt-24 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-focus/40">
                  {p.callout ? (
                    <Callout kind={p.callout}>
                      <BlocksView blocks={p.blocks} />
                    </Callout>
                  ) : (
                    <BlocksView blocks={p.blocks} className="mb-4" />
                  )}
                </div>
              ))}
            </section>
          ))}

          {sop.map((block) => (
            <Callout key={block.index} kind="oyelabs" title={`At Oyelabs: ${block.title}`}>
              <LessonMarkdown text={block.body ?? ""} />
            </Callout>
          ))}

          {topic.handbook || topic.interactive ? (
            <Suspense fallback={null}>
              <div className="not-prose">
                {topic.handbook ? <HandbookCards refs={topic.handbook} /> : null}
                {topic.interactive ? <TopicInteractive interactive={topic.interactive} /> : null}
              </div>
            </Suspense>
          ) : null}

          {topic.webRefs.length ? (
            <section aria-labelledby="lesson-sources" className="not-prose mt-8">
              <h2 id="lesson-sources" className="font-display text-h4 font-semibold text-fg-1">
                Sources and further reading
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {topic.webRefs.map((ref) => {
                  const checked = verifiedLabel(ref.verifiedAt);
                  return (
                    <li key={ref.url} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-card border border-line-1 bg-surface-1 px-3 py-2">
                      <Badge tone="neutral">{KIND_LABEL[ref.kind]}</Badge>
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-6 items-center gap-1 font-medium text-brand-fg underline-offset-4 hover:underline">
                        {ref.label}
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                      <span className="text-caption text-fg-2">{domainOf(ref.url)}</span>
                      {checked ? <span className="text-caption text-fg-2">Last checked {checked}</span> : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </ReadingView>
      </div>

      <div ref={endRef} className="mx-auto flex w-full max-w-article flex-wrap items-center gap-3 border-t border-line-1 pt-4">
        {done ? (
          <p className="flex items-center gap-2 text-small text-success-fg" role="status">
            <BookCheck className="size-4" aria-hidden="true" /> Marked as read.
          </p>
        ) : (
          <>
            <Button onClick={onReadToEnd}>
              <BookCheck aria-hidden="true" /> Mark as read
            </Button>
            <span className="text-small text-fg-2">Or read to the end; we'll tick it for you.</span>
          </>
        )}
      </div>
    </div>
    </LessonTopicContext.Provider>
  );
}
