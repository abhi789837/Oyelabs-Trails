import { useRef, useState, type ReactNode } from "react";
import { Download, Plus, RotateCcw, Trash2, Upload } from "lucide-react";

import {
  HANDBOOK_STATUS_LABELS,
  PROJECT_TYPES,
  TERM_CATEGORIES,
  TERM_CATEGORY_LABELS,
  type HandbookEntry,
  type HandbookKind,
  type HandbookStatus,
} from "@shared/handbook";

import { ApiRequestError } from "@/api/client";
import { Field, FormAlert } from "@/components/form/Field";
import { useConfirm } from "@/components/overlays";
import { DetailSheet } from "@/components/overlays/DetailSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, inputClasses } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { downloadUrl, handbookApi } from "./api";

export type Draft = Record<string, unknown>;

export const KIND_LABELS: Record<HandbookKind, { one: string; many: string }> = {
  term: { one: "term", many: "Terms" },
  stage: { one: "stage", many: "Stages" },
  rule: { one: "rule", many: "Rules" },
  template: { one: "template", many: "Templates" },
};

const PROJECT_TYPE_LABELS: Record<string, string> = { custom: "Custom", whitelabel: "White-label" };

/** A blank entry of each kind, with the schema's defaults, for "Add". */
export function blankDraft(kind: HandbookKind): Draft {
  const common = { id: "", name: "", status: "to-confirm" };
  switch (kind) {
    case "term":
      return { ...common, aka: [], category: "scope", projectTypes: ["custom"], definition: "", oyelabsMeaning: "", example: "", clientSentence: "", impact: "", related: [], confusedWith: [], sources: [], contractual: false };
    case "stage":
      return { ...common, projectType: "custom", order: 1, purpose: "", entryCriteria: [], exitCriteria: [], raci: [], clientTouchpoints: [], artifacts: [], typicalDuration: "", pitfalls: [], moduleId: null, sources: [] };
    case "rule":
      return { ...common, category: "scope", projectTypes: ["custom"], statement: "", terms: [], sources: [], contractual: false };
    case "template":
      return { ...common, purpose: "", format: "docx", stageIds: [], sections: [], example: [] };
  }
}

const textareaClass =
  "w-full rounded-md border border-input bg-surface px-3 py-2 text-base leading-relaxed placeholder:text-muted-foreground aria-[invalid=true]:border-destructive md:text-sm";

export interface SavedResult {
  entry: HandbookEntry;
  revalidating?: number;
  created?: boolean;
}

interface EntrySheetProps {
  kind: HandbookKind;
  /** Null when adding a new entry. */
  entry: HandbookEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (result: SavedResult) => void;
  /** A template file was uploaded or reverted; the sheet stays open. */
  onFileChanged: (entry: HandbookEntry) => void;
  /** Ids per kind, for the chip inputs' suggestions. */
  idsByKind: Record<HandbookKind, string[]>;
}

/** The edit panel for one handbook entry, with proper fields per kind. */
export function EntrySheet({ kind, entry, open, onOpenChange, onSaved, onFileChanged, idsByKind }: EntrySheetProps) {
  const initial = () => (entry ? structuredClone(entry.data) : blankDraft(kind)) as Draft;
  const [draft, setDraft] = useState<Draft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Opening another entry (or "Add", or a newer version) resets the form. A file upload does not
  // change the version, so it keeps unsaved edits.
  const resetKey = `${kind}:${entry?.id ?? "new"}:${entry?.version ?? 0}:${open}`;
  const [seenKey, setSeenKey] = useState(resetKey);
  if (seenKey !== resetKey) {
    setSeenKey(resetKey);
    setDraft(initial());
    setErrors({});
    setFormError(null);
  }

  const set = (key: string, value: unknown) => setDraft((d) => ({ ...d, [key]: value }));
  const err = (key: string) => errors[key];
  const isNew = entry === null;
  const status = (entry?.data.status ?? "to-confirm") as HandbookStatus;

  const run = async (work: () => Promise<SavedResult>) => {
    setPending(true);
    setFormError(null);
    try {
      const result = await work();
      setErrors({});
      onSaved(result);
    } catch (e) {
      if (e instanceof ApiRequestError) {
        // "aka.0" → "aka": one message per field is enough.
        const fields: Record<string, string> = {};
        for (const [path, message] of Object.entries(e.fields ?? {})) {
          const key = path.split(".")[0]!;
          fields[key] ??= message;
        }
        setErrors(fields);
        setFormError(e.message);
      } else setFormError("That didn't save. Try again.");
    } finally {
      setPending(false);
    }
  };

  const save = (confirm: boolean) =>
    run(async () => {
      if (isNew) {
        const created = await handbookApi.create(kind, confirm ? { ...draft, status: "confirmed" } : draft);
        return { entry: created.entry, created: true };
      }
      return handbookApi.save(kind, entry.id, draft, confirm);
    });

  const setArchived = (archived: boolean) => run(async () => handbookApi.setArchived(kind, entry!.id, archived));

  const footer = (
    <>
      {!isNew && (
        <Button type="button" variant="ghost" className="mr-auto" disabled={pending} onClick={() => void setArchived(!entry.archived)}>
          {entry.archived ? "Unarchive" : "Archive"}
        </Button>
      )}
      <Button type="button" variant="outline" disabled={pending} onClick={() => void save(false)}>
        {isNew ? "Add" : "Save"}
      </Button>
      {status !== "confirmed" && (
        <Button type="button" disabled={pending} onClick={() => void save(true)}>
          {isNew ? "Add & confirm" : "Save & confirm"}
        </Button>
      )}
    </>
  );

  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={isNew ? `Add a ${KIND_LABELS[kind].one}` : String(entry.data.name)}
      subtitle={
        isNew ? undefined : (
          <span className="flex flex-wrap items-center gap-2">
            {kind}:{entry.id} · v{entry.version}
            <Badge variant={status === "confirmed" ? "success" : "progress"}>{HANDBOOK_STATUS_LABELS[status]}</Badge>
            {entry.archived && <Badge variant="outline">Archived</Badge>}
          </span>
        )
      }
      description={`Edit this handbook ${KIND_LABELS[kind].one}.`}
      footer={footer}
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void save(false);
        }}
      >
        {formError && <FormAlert>{formError}</FormAlert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required error={err("name")}>
            {(p) => <Input id={p.id} aria-describedby={p.describedBy} aria-invalid={p.invalid} value={String(draft.name ?? "")} onChange={(e) => set("name", e.target.value)} />}
          </Field>
          <Field label="Id" required error={err("id")} hint={isNew ? "kebab-case, never changes: courses and questions cite it" : "Fixed: courses and questions cite it"}>
            {(p) => (
              <Input
                id={p.id}
                aria-describedby={p.describedBy}
                aria-invalid={p.invalid}
                className="font-mono"
                readOnly={!isNew}
                value={String(draft.id ?? "")}
                onChange={(e) => set("id", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              />
            )}
          </Field>
        </div>

        {kind === "term" && <TermFields draft={draft} set={set} err={err} termIds={idsByKind.term} />}
        {kind === "stage" && <StageFields draft={draft} set={set} err={err} idsByKind={idsByKind} />}
        {kind === "rule" && <RuleFields draft={draft} set={set} err={err} termIds={idsByKind.term} />}
        {kind === "template" && <TemplateFields draft={draft} set={set} err={err} stageIds={idsByKind.stage} />}
        {kind === "template" && !isNew && <TemplateFiles entry={entry} onChanged={onFileChanged} />}
        {kind !== "template" && <SourcesField value={(draft.sources as Source[]) ?? []} onChange={(v) => set("sources", v)} error={err("sources")} />}
      </form>
    </DetailSheet>
  );
}

// ---------------------------------------------------------------------------
// Per-kind fields
// ---------------------------------------------------------------------------

interface FieldsProps {
  draft: Draft;
  set: (key: string, value: unknown) => void;
  err: (key: string) => string | undefined;
}

function TextArea({ label, name, rows = 3, hint, required, ...p }: FieldsProps & { label: string; name: string; rows?: number; hint?: ReactNode; required?: boolean }) {
  return (
    <Field label={label} required={required} error={p.err(name)} hint={hint}>
      {(f) => (
        <textarea
          id={f.id}
          aria-describedby={f.describedBy}
          aria-invalid={f.invalid}
          rows={rows}
          value={String(p.draft[name] ?? "")}
          onChange={(e) => p.set(name, e.target.value)}
          className={textareaClass}
        />
      )}
    </Field>
  );
}

function Chips({ label, name, hint, suggestions, ...p }: FieldsProps & { label: string; name: string; hint?: ReactNode; suggestions?: string[] }) {
  return (
    <Field label={label} error={p.err(name)} hint={hint}>
      {(f) => (
        <TagInput
          id={f.id}
          aria-describedby={f.describedBy}
          aria-invalid={f.invalid}
          value={(p.draft[name] as string[]) ?? []}
          onChange={(v) => p.set(name, v)}
          suggestions={suggestions}
          allowCustom={suggestions ? false : true}
          placeholder={suggestions ? "Type to pick" : "Type and press Enter"}
        />
      )}
    </Field>
  );
}

function Select({ label, name, options, ...p }: FieldsProps & { label: string; name: string; options: { value: string; label: string }[] }) {
  return (
    <Field label={label} error={p.err(name)}>
      {(f) => (
        <select id={f.id} aria-describedby={f.describedBy} aria-invalid={f.invalid} value={String(p.draft[name] ?? "")} onChange={(e) => p.set(name, e.target.value)} className={inputClasses}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

const categoryOptions = TERM_CATEGORIES.map((c) => ({ value: c, label: TERM_CATEGORY_LABELS[c] }));
const projectTypeOptions = PROJECT_TYPES.map((p) => ({ value: p, label: PROJECT_TYPE_LABELS[p] ?? p }));

function ProjectTypes(p: FieldsProps) {
  const value = (p.draft.projectTypes as string[]) ?? [];
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium">Project types</legend>
      <div className="flex flex-wrap gap-4 pt-1">
        {PROJECT_TYPES.map((t) => (
          <label key={t} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={value.includes(t)}
              onChange={(e) => p.set("projectTypes", e.target.checked ? [...value, t] : value.filter((v) => v !== t))}
            />
            {PROJECT_TYPE_LABELS[t]}
          </label>
        ))}
      </div>
      {p.err("projectTypes") && <p className="text-xs font-medium text-destructive">Pick at least one project type.</p>}
    </fieldset>
  );
}

function Contractual(p: FieldsProps) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={Boolean(p.draft.contractual)} onChange={(e) => p.set("contractual", e.target.checked)} />
      <span>
        Contractual
        <span className="block text-xs text-muted-foreground">Learners see a “not legal advice” line with it.</span>
      </span>
    </label>
  );
}

function TermFields({ termIds, ...p }: FieldsProps & { termIds: string[] }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select {...p} label="Category" name="category" options={categoryOptions} />
        <ProjectTypes {...p} />
      </div>
      <Chips {...p} label="Also known as" name="aka" hint="Abbreviations and other spellings, e.g. CR" />
      <TextArea {...p} label="Industry definition" name="definition" required rows={4} />
      <TextArea {...p} label="What it means at Oyelabs" name="oyelabsMeaning" required rows={4} hint="Replace the “admin to confirm” note with Oyelabs’ own meaning." />
      <TextArea {...p} label="Example" name="example" required />
      <TextArea {...p} label="How to say it to a client" name="clientSentence" required rows={2} />
      <TextArea {...p} label="Impact on time and billing" name="impact" required hint="Label industry values as “typical”." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Chips {...p} label="Related terms" name="related" suggestions={termIds} />
        <Chips {...p} label="Often confused with" name="confusedWith" suggestions={termIds} />
      </div>
      <Contractual {...p} />
    </>
  );
}

function RuleFields({ termIds, ...p }: FieldsProps & { termIds: string[] }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select {...p} label="Category" name="category" options={categoryOptions} />
        <ProjectTypes {...p} />
      </div>
      <TextArea {...p} label="The rule" name="statement" required rows={5} />
      <Chips {...p} label="Terms it uses" name="terms" suggestions={termIds} />
      <Contractual {...p} />
    </>
  );
}

interface RaciRow {
  activity: string;
  responsible: string;
  accountable: string;
  consulted: string;
  informed: string;
}
const RACI_COLUMNS: { key: keyof RaciRow; label: string }[] = [
  { key: "activity", label: "Activity" },
  { key: "responsible", label: "Responsible" },
  { key: "accountable", label: "Accountable" },
  { key: "consulted", label: "Consulted" },
  { key: "informed", label: "Informed" },
];

function StageFields({ idsByKind, ...p }: FieldsProps & { idsByKind: Record<HandbookKind, string[]> }) {
  const raci = (p.draft.raci as RaciRow[]) ?? [];
  const setRaci = (next: RaciRow[]) => p.set("raci", next);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Select {...p} label="Project type" name="projectType" options={projectTypeOptions} />
        <Field label="Order" error={p.err("order")}>
          {(f) => <Input id={f.id} type="number" min={1} max={40} aria-invalid={f.invalid} value={String(p.draft.order ?? 1)} onChange={(e) => p.set("order", Number(e.target.value))} />}
        </Field>
        <Field label="Course module" error={p.err("moduleId")} hint="e.g. pmp-a05">
          {(f) => <Input id={f.id} aria-describedby={f.describedBy} className="font-mono" value={String(p.draft.moduleId ?? "")} onChange={(e) => p.set("moduleId", e.target.value.trim() || null)} />}
        </Field>
      </div>
      <TextArea {...p} label="Purpose" name="purpose" required />
      <Field label="Typical duration" error={p.err("typicalDuration")} hint="Always phrased as typical, e.g. “Typically 1–2 weeks”.">
        {(f) => <Input id={f.id} aria-describedby={f.describedBy} aria-invalid={f.invalid} value={String(p.draft.typicalDuration ?? "")} onChange={(e) => p.set("typicalDuration", e.target.value)} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Chips {...p} label="Entry criteria" name="entryCriteria" />
        <Chips {...p} label="Exit criteria" name="exitCriteria" />
        <Chips {...p} label="Client touchpoints" name="clientTouchpoints" />
        <Chips {...p} label="Pitfalls" name="pitfalls" />
      </div>
      <Chips {...p} label="Artifacts (templates and terms)" name="artifacts" suggestions={[...idsByKind.template, ...idsByKind.term]} />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">RACI</legend>
        {p.err("raci") && <p className="text-xs font-medium text-destructive">{p.err("raci")}</p>}
        {raci.length === 0 && <p className="text-sm text-muted-foreground">No RACI rows yet.</p>}
        <div className="space-y-3">
          {raci.map((row, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-md border border-border p-2 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] sm:border-0 sm:p-0">
              {RACI_COLUMNS.map((col) => (
                <Input
                  key={col.key}
                  aria-label={`${col.label}, row ${i + 1}`}
                  placeholder={col.label}
                  className={cn(col.key === "activity" && "col-span-2 sm:col-span-1")}
                  value={row[col.key] ?? ""}
                  onChange={(e) => setRaci(raci.map((r, j) => (j === i ? { ...r, [col.key]: e.target.value } : r)))}
                />
              ))}
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove RACI row ${i + 1}`} onClick={() => setRaci(raci.filter((_, j) => j !== i))}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        {raci.length < 10 && (
          <Button type="button" variant="outline" size="sm" onClick={() => setRaci([...raci, { activity: "", responsible: "", accountable: "", consulted: "", informed: "" }])}>
            <Plus className="size-4" /> Add RACI row
          </Button>
        )}
      </fieldset>
    </>
  );
}

function TemplateFields({ stageIds, ...p }: FieldsProps & { stageIds: string[] }) {
  const example = (p.draft.example as [string, string][]) ?? [];
  const setExample = (next: [string, string][]) => p.set("example", next);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select {...p} label="Format" name="format" options={[{ value: "docx", label: "Word (.docx)" }, { value: "xlsx", label: "Excel (.xlsx)" }]} />
        <Chips {...p} label="Stages" name="stageIds" suggestions={stageIds} />
      </div>
      <TextArea {...p} label="Purpose" name="purpose" required />
      <Chips {...p} label={p.draft.format === "xlsx" ? "Columns" : "Sections"} name="sections" hint="Headings (Word) or the header row (Excel) of the generated file." />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Filled example</legend>
        <p className="text-xs text-muted-foreground">Rows of field and value, used for the “filled” download. A field named like a section fills that section.</p>
        {p.err("example") && <p className="text-xs font-medium text-destructive">{p.err("example")}</p>}
        <div className="space-y-2">
          {example.map(([field, value], i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
              <Input aria-label={`Field, row ${i + 1}`} placeholder="Field" value={field} onChange={(e) => setExample(example.map((r, j) => (j === i ? [e.target.value, r[1]] : r)))} />
              <textarea
                aria-label={`Value, row ${i + 1}`}
                placeholder="Value"
                rows={2}
                className={textareaClass}
                value={value}
                onChange={(e) => setExample(example.map((r, j) => (j === i ? [r[0], e.target.value] : r)))}
              />
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove example row ${i + 1}`} onClick={() => setExample(example.filter((_, j) => j !== i))}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        {example.length < 30 && (
          <Button type="button" variant="outline" size="sm" onClick={() => setExample([...example, ["", ""]])}>
            <Plus className="size-4" /> Add example row
          </Button>
        )}
      </fieldset>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sources and template files
// ---------------------------------------------------------------------------

interface Source {
  label: string;
  url: string;
  verifiedAt?: string;
}

function SourcesField({ value, onChange, error }: { value: Source[]; onChange: (v: Source[]) => void; error?: string | undefined }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Sources</legend>
      {error && <p className="text-xs font-medium text-destructive">Each source needs a label and an https:// link.</p>}
      {value.map((s, i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
          <Input aria-label={`Source ${i + 1} label`} placeholder="Label" value={s.label} onChange={(e) => onChange(value.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))} />
          <Input aria-label={`Source ${i + 1} link`} placeholder="https://" type="url" value={s.url} onChange={(e) => onChange(value.map((r, j) => (j === i ? { ...r, url: e.target.value } : r)))} />
          <Button type="button" variant="ghost" size="icon" aria-label={`Remove source ${i + 1}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      {value.length < 4 && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { label: "", url: "" }])}>
          <Plus className="size-4" /> Add source
        </Button>
      )}
    </fieldset>
  );
}

function TemplateFiles({ entry, onChanged }: { entry: HandbookEntry; onChanged: (entry: HandbookEntry) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const confirmDialog = useConfirm();
  const [busy, setBusy] = useState(false);
  const format = String((entry.data as { format?: string }).format ?? "docx");

  const upload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      notify.error("That file is over 5 MB.");
      return;
    }
    setBusy(true);
    try {
      const res = await handbookApi.upload(entry.id, file);
      notify.success("Uploaded. Learners now download your file.");
      onChanged(res.entry);
    } catch (e) {
      notify.error(e instanceof ApiRequestError ? e.message : "The upload failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const revert = async () => {
    /* The uploaded file is deleted on the server, so there is nothing an Undo could put back. */
    const ok = await confirmDialog({
      title: `Remove your upload for ${String((entry.data as { name?: string }).name ?? entry.id)}?`,
      body: "Learners get the generated file again. Your uploaded file is deleted.",
      confirmLabel: "Remove upload",
      variant: "destructive",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await handbookApi.revertUpload(entry.id);
      notify.success("Reverted to the generated file.");
      onChanged(res.entry);
    } catch (e) {
      notify.error(e instanceof ApiRequestError ? e.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-md border border-border bg-surface-sunken p-4" aria-label="Template file">
      <h3 className="text-sm font-semibold">File</h3>
      <p className="text-sm text-muted-foreground">
        {entry.hasUpload ? "Learners download the file you uploaded." : `Learners download a generated .${format}. Upload Oyelabs’ own version to replace it.`}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={downloadUrl(entry.id, "blank")} download>
            <Download className="size-4" /> {entry.hasUpload ? "Download current" : "Download blank"}
          </a>
        </Button>
        {!entry.hasUpload && (
          <Button asChild variant="outline" size="sm">
            <a href={downloadUrl(entry.id, "filled")} download>
              <Download className="size-4" /> Download filled
            </a>
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" /> Upload replacement
        </Button>
        {entry.hasUpload && (
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void revert()}>
            <RotateCcw className="size-4" /> Revert to generated
          </Button>
        )}
        <input
          ref={fileRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          accept={format === "xlsx" ? ".xlsx" : ".docx"}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </div>
    </section>
  );
}
