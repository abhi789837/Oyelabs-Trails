import { useEffect, useState } from "react";
import { Download, Flag, ListChecks, Scale } from "lucide-react";

import { api } from "@/api/client";
import { RichText } from "@/components/content/RichText";
import type { TopicHandbookRefs } from "@shared/content";
import { LEGAL_NOTE, type HandbookEntry } from "@shared/handbook";

import { handbookApi, templateDownloadUrl } from "./api";
import { StatusChip } from "./StatusChip";

interface Loaded {
  stages: HandbookEntry<"stage">[];
  rules: HandbookEntry<"rule">[];
  templates: HandbookEntry<"template">[];
}

/**
 * v4.2: the handbook entries a topic is about — the lifecycle stage, the rules, the templates —
 * read live from the handbook, so an admin's edit or confirmation shows here at once.
 */
export function HandbookCards({ refs }: { refs: TopicHandbookRefs }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  // One string key, so a new `refs` object with the same ids does not refetch.
  const key = JSON.stringify([refs.stages ?? [], refs.rules ?? [], refs.templates ?? []]);

  useEffect(() => {
    const [stageIds, ruleIds, templateIds] = JSON.parse(key) as [string[], string[], string[]];
    const controller = new AbortController();
    const signal = controller.signal;
    Promise.all([
      stageIds.length ? api.get<{ stages: HandbookEntry<"stage">[] }>("/api/handbook/stages", signal).then((r) => r.stages) : Promise.resolve([]),
      ruleIds.length ? handbookApi.rules(ruleIds, signal).then((r) => r.rules) : Promise.resolve([]),
      templateIds.length ? handbookApi.templates(signal).then((r) => r.templates) : Promise.resolve([]),
    ])
      .then(([stages, rules, templates]) =>
        setLoaded({
          stages: stageIds.flatMap((id) => stages.filter((s) => s.id === id)),
          rules: ruleIds.flatMap((id) => rules.filter((r) => r.id === id)),
          templates: templateIds.flatMap((id) => templates.filter((t) => t.id === id)),
        }),
      )
      .catch(() => {
        if (!signal.aborted) setLoaded({ stages: [], rules: [], templates: [] });
      });
    return () => controller.abort();
  }, [key]);

  if (!loaded || loaded.stages.length + loaded.rules.length + loaded.templates.length === 0) return null;
  return (
    <section aria-labelledby="handbook-heading" className="mt-10 max-w-3xl space-y-4">
      <h2 id="handbook-heading" className="text-lg font-semibold">
        From the Oyelabs handbook
      </h2>
      {loaded.stages.map((s) => (
        <StageCard key={s.id} stage={s} />
      ))}
      {loaded.rules.map((r) => (
        <div key={r.id} className="rounded-md border bg-card px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-medium">
              <Scale className="size-4 text-primary" aria-hidden />
              {r.data.name}
            </h3>
            <StatusChip status={r.data.status} />
          </div>
          <RichText text={r.data.statement} size="sm" className="mt-2" />
          {r.data.contractual && <p className="mt-2 text-xs text-muted-foreground">{LEGAL_NOTE}</p>}
        </div>
      ))}
      {loaded.templates.length > 0 && (
        <div className="rounded-md border bg-card px-4 py-3">
          <h3 className="font-medium">Templates</h3>
          <ul className="mt-2 space-y-2">
            {loaded.templates.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {t.data.name} <span className="font-mono text-xs uppercase text-muted-foreground">{t.data.format}</span>
                </span>
                <span className="flex gap-3">
                  <a className="inline-flex items-center gap-1 underline underline-offset-4" href={templateDownloadUrl(t.id, "blank")}>
                    <Download className="size-3.5" aria-hidden />
                    Blank
                  </a>
                  <a className="inline-flex items-center gap-1 underline underline-offset-4" href={templateDownloadUrl(t.id, "filled")}>
                    <Download className="size-3.5" aria-hidden />
                    Filled example
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function StageCard({ stage }: { stage: HandbookEntry<"stage"> }) {
  const s = stage.data;
  return (
    <div className="rounded-md border bg-card px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-medium">
          <Flag className="size-4 text-primary" aria-hidden />
          Stage {s.order}: {s.name}
        </h3>
        <StatusChip status={s.status} />
      </div>
      <p className="mt-2 text-sm">{s.purpose}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <CheckList title="Entry criteria" items={s.entryCriteria} />
        <CheckList title="Exit criteria" items={s.exitCriteria} />
      </div>
      {s.raci.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="mb-1 text-left text-xs font-semibold text-muted-foreground">Who does what (RACI)</caption>
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="py-1 pr-3 font-medium">Activity</th>
                <th className="py-1 pr-3 font-medium">Responsible</th>
                <th className="py-1 pr-3 font-medium">Accountable</th>
                <th className="py-1 pr-3 font-medium">Consulted</th>
                <th className="py-1 font-medium">Informed</th>
              </tr>
            </thead>
            <tbody>
              {s.raci.map((row) => (
                <tr key={row.activity} className="border-b last:border-0">
                  <td className="py-1.5 pr-3">{row.activity}</td>
                  <td className="py-1.5 pr-3">{row.responsible}</td>
                  <td className="py-1.5 pr-3">{row.accountable}</td>
                  <td className="py-1.5 pr-3">{row.consulted || "—"}</td>
                  <td className="py-1.5">{row.informed || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <CheckList title="Client touchpoints" items={s.clientTouchpoints} />
        <CheckList title="Pitfalls" items={s.pitfalls} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{s.typicalDuration}. Typical industry value — Oyelabs' own may differ.</p>
    </div>
  );
}

function CheckList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <ListChecks className="size-3.5" aria-hidden />
        {title}
      </h4>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
