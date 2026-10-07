import { Check, ChevronDown, ChevronUp, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ModuleTestItemView, ModuleTestView } from "@shared/moduleTests";

import { ApiRequestError } from "@/api/client";
import { Badge, Button, Dialog, Field, Input, StatusLine, Textarea, cn, v5Toast } from "@/v5/design";

import { moduleTestApi } from "./api";
import { KIND_LABELS, draftFromItem, draftProblems, draftToInput, emptyDraft, isWorking, type ItemDraft } from "./itemDraft";

/**
 * v4.5 Phase 3 (builder C): the module's test, under each saved module in the Oyelabs editor.
 *
 * Questions are written and saved on their own when the course is saved ("8 questions created from
 * 3 docs and 2 videos"). The admin doesn't have to do anything; Preview, Edit, Remove, "Add my own
 * question" and Regenerate are there when they want to. Shows nothing for an unsaved module.
 */
export interface ModuleTestPanelProps {
  sectionId: string | null;
  /** The module's title, so each panel has its own name for screen readers. */
  moduleTitle?: string;
}

const POLL_MS = 4000;

const STATUS_BADGE: Record<ModuleTestView["status"], { tone: "neutral" | "success" | "warning" | "danger" | "info"; label: string }> = {
  empty: { tone: "neutral", label: "Not written yet" },
  gathering: { tone: "info", label: "Reading the material" },
  generating: { tone: "info", label: "Writing questions" },
  ready: { tone: "success", label: "Ready" },
  needs_content: { tone: "warning", label: "Needs more material" },
  failed: { tone: "danger", label: "Couldn't write" },
};

function errorText(error: unknown, fallback: string): string {
  return error instanceof ApiRequestError ? error.message : fallback;
}

export function ModuleTestPanel({ sectionId, moduleTitle }: ModuleTestPanelProps) {
  const [test, setTest] = useState<ModuleTestView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ item: ModuleTestItemView | null } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!sectionId) return;
      try {
        const next = await moduleTestApi.get(sectionId, signal);
        setTest(next);
        setError(null);
      } catch (err) {
        if (signal?.aborted) return;
        setError(errorText(err, "We couldn't load this module's test. Try again in a moment."));
      }
    },
    [sectionId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // While questions are being written, check back every few seconds.
  useEffect(() => {
    if (!test || !isWorking(test.status)) return;
    timer.current = setTimeout(() => void load(), POLL_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [test, load]);

  if (!sectionId) return null;

  const regenerate = async () => {
    setBusy(true);
    try {
      setTest(await moduleTestApi.regenerate(sectionId));
      v5Toast.info("Writing new questions for this module.", "Your own and edited questions stay. Learners' past results are kept.");
    } catch (err) {
      v5Toast.error(errorText(err, "We couldn't start that. Try again."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: ModuleTestItemView) => {
    try {
      const { test: next } = await moduleTestApi.remove(sectionId, item.id);
      setTest(next);
      v5Toast.success("Question removed.", "Learners won't see it any more. Past results that used it are kept.");
    } catch (err) {
      v5Toast.error(errorText(err, "We couldn't remove that question. Try again."));
    }
  };

  const badge = test ? STATUS_BADGE[test.status] : null;
  const working = test ? isWorking(test.status) : false;

  return (
    <section aria-label={moduleTitle?.trim() ? `Module test: ${moduleTitle.trim()}` : "Module test"} className="flex flex-col gap-3 rounded-card border border-line-1 bg-sunken/40 p-3" data-testid="module-test-panel">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-display text-small font-semibold text-fg-1">Module test</h4>
        {badge ? (
          <Badge tone={badge.tone}>
            {working ? <Loader2 className="animate-spin" aria-hidden="true" /> : test?.status === "ready" ? <Check aria-hidden="true" /> : null}
            {badge.label}
          </Badge>
        ) : null}
        {test?.stale && !working ? <Badge tone="warning">Material changed since</Badge> : null}
      </div>

      {error ? <StatusLine tone="danger">{error}</StatusLine> : null}
      {test ? (
        <p className="text-small text-fg-1" data-testid="module-test-summary" aria-live="polite">
          {test.summary}
        </p>
      ) : null}
      {test && test.sources.skipped.length > 0 ? (
        <ul className="flex flex-col gap-1 text-caption text-fg-2">
          {test.sources.skipped.map((s) => (
            <li key={`${s.title}:${s.reason}`}>
              <span className="font-medium text-fg-1">{s.title}</span>: {s.reason}
            </li>
          ))}
        </ul>
      ) : null}

      {test ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open} disabled={test.items.length === 0}>
            {open ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
            {open ? "Hide questions" : `Preview ${test.items.length} question${test.items.length === 1 ? "" : "s"}`}
          </Button>
          <Button size="sm" onClick={() => setEditing({ item: null })}>
            <Plus aria-hidden="true" /> Add my own question
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void regenerate()} loading={busy} disabled={working}>
            <RefreshCw aria-hidden="true" /> Regenerate
          </Button>
        </div>
      ) : null}

      {open && test ? (
        <ol className="flex flex-col gap-3">
          {test.items.map((item, n) => (
            <li key={item.id} className="rounded-control border border-line-1 bg-surface-1 p-3" data-testid="module-test-item">
              <div className="flex flex-wrap items-center gap-2 text-caption text-fg-2">
                <span>Question {n + 1}</span>
                <Badge tone="outline">{KIND_LABELS[item.kind]}</Badge>
                {item.origin === "admin" ? <Badge tone="brand">Yours</Badge> : null}
                {item.status === "flagged" ? <Badge tone="warning">Hidden from learners</Badge> : null}
              </div>
              <p className="mt-1 text-small font-medium text-fg-1">{item.prompt}</p>
              <ul className="mt-2 flex flex-col gap-1">
                {item.options.map((o, i) => (
                  <li key={i} className={cn("flex items-start gap-2 text-small", item.correctIndices.includes(i) ? "font-medium text-success-fg" : "text-fg-2")}>
                    {item.correctIndices.includes(i) ? <Check className="mt-0.5 size-4 shrink-0" aria-label="Right answer" /> : <span className="size-4 shrink-0" aria-hidden="true" />}
                    {o}
                  </li>
                ))}
              </ul>
              {item.citationLabel ? (
                <p className="mt-2 text-caption text-fg-2" data-testid="module-test-citation">
                  From: <span className="font-medium text-fg-1">{item.citationLabel}</span>
                  {item.citation ? <span className="block italic">"{item.citation.quote}"</span> : null}
                </p>
              ) : null}
              {item.gateNotes.length ? <p className="mt-1 text-caption text-warning-fg">{item.gateNotes.join(" · ")}</p> : null}
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing({ item })}>
                  <Pencil aria-hidden="true" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void remove(item)}>
                  <Trash2 aria-hidden="true" /> Remove
                </Button>
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      {editing ? (
        <ItemDialog
          sectionId={sectionId}
          item={editing.item}
          onClose={() => setEditing(null)}
          onSaved={(next) => {
            setTest(next);
            setOpen(true);
            setEditing(null);
          }}
        />
      ) : null}
    </section>
  );
}

function ItemDialog({ sectionId, item, onClose, onSaved }: { sectionId: string; item: ModuleTestItemView | null; onClose: () => void; onSaved: (test: ModuleTestView) => void }) {
  const [draft, setDraft] = useState<ItemDraft>(() => (item ? draftFromItem(item) : emptyDraft()));
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const problems = draftProblems(draft);
  const shown = tried ? problems : {};

  const save = async () => {
    setTried(true);
    if (Object.keys(problems).length) return;
    setSaving(true);
    setError(null);
    try {
      const input = draftToInput(draft, item?.citation ?? null);
      const result = item ? await moduleTestApi.edit(sectionId, item.id, input) : await moduleTestApi.add(sectionId, input);
      v5Toast.success(item ? "Question saved." : "Question added.", "Learners see it the next time they open the test.");
      onSaved(result.test);
    } catch (err) {
      setError(errorText(err, "We couldn't save that. Try again."));
    } finally {
      setSaving(false);
    }
  };

  const setOption = (i: number, value: string) => setDraft((d) => ({ ...d, options: d.options.map((o, k) => (k === i ? value : o)) }));
  const toggle = (i: number) => setDraft((d) => ({ ...d, correct: d.correct.includes(i) ? d.correct.filter((k) => k !== i) : [...d.correct, i] }));

  return (
    <Dialog
      open
      onOpenChange={(o) => (o ? undefined : onClose())}
      title={item ? "Edit question" : "Add my own question"}
      description="Tick every right answer. Learners need every right answer, and only those, to get it."
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => void save()} loading={saving}>
            {item ? "Save question" : "Add question"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kind of question">
          {(Object.keys(KIND_LABELS) as (keyof typeof KIND_LABELS)[]).map((k) => (
            <Button key={k} size="sm" variant={draft.kind === k ? "primary" : "secondary"} role="radio" aria-checked={draft.kind === k} onClick={() => setDraft((d) => ({ ...d, kind: k }))}>
              {KIND_LABELS[k]}
            </Button>
          ))}
        </div>
        <Field label="Question" hint='For example: "A client asks for a new screen mid-sprint. What do you do?"' error={shown.prompt}>
          <Textarea value={draft.prompt} rows={3} maxLength={2000} onChange={(e) => setDraft((d) => ({ ...d, prompt: e.target.value }))} />
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-small font-medium text-fg-1">Answers</legend>
          {draft.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="checkbox" className="size-4 accent-[rgb(var(--v5-brand))]" checked={draft.correct.includes(i)} onChange={() => toggle(i)} aria-label={`Answer ${i + 1} is right`} />
              <Input value={o} maxLength={400} onChange={(e) => setOption(i, e.target.value)} aria-label={`Answer ${i + 1}`} />
            </div>
          ))}
          {draft.options.length < 5 ? (
            <Button size="sm" variant="ghost" className="self-start" onClick={() => setDraft((d) => ({ ...d, options: [...d.options, ""] }))}>
              <Plus aria-hidden="true" /> Add an answer
            </Button>
          ) : null}
          {shown.options || shown.correct ? <p className="text-small text-danger-fg">{shown.options ?? shown.correct}</p> : null}
        </fieldset>
        <Field label="Why it's right" optional hint="Learners see this after they answer.">
          <Textarea value={draft.explanation} rows={2} maxLength={1500} onChange={(e) => setDraft((d) => ({ ...d, explanation: e.target.value }))} />
        </Field>
        {item?.citationLabel ? <p className="text-caption text-fg-2">Source kept: {item.citationLabel}</p> : null}
        {error ? <StatusLine tone="danger">{error}</StatusLine> : null}
      </div>
    </Dialog>
  );
}
