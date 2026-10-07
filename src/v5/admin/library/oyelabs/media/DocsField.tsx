import { DragDropProvider } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { Plus } from "lucide-react";
import { useEffect, useId, useState } from "react";

import type { ModuleDocInput, OyelabsDocView, UploadView } from "@shared/oyelabsCourses";
import { DOC_LINK_LABELS, type ResolvedDocLink } from "@shared/videoSourcesCore";

import { Button, Input } from "@/v5/design";

import { errorText, mediaApi } from "./api";
import { cardStatus, formatBytes, moveItem, pastedLinks, type CardStatus } from "./fieldLogic";
import { LinkCard } from "./LinkCard";
import { UploadButton } from "./UploadButton";

/**
 * v4.5 Phase 2 (builder B; builder A places it in each module card).
 *
 * The module's documents: upload (PDF/DOCX/PPTX/XLSX/TXT/MD, up to 50 MB, with progress) or paste a
 * link (Google Docs/Sheets/Slides, Drive, OneDrive/SharePoint, Dropbox, public Notion/Confluence
 * pages, any URL), each with a status line and a plain fix when it can't be read. Controlled.
 */
export interface DocsFieldProps {
  value: ModuleDocInput[];
  onChange: (next: ModuleDocInput[]) => void;
  saved: Record<string, OyelabsDocView>;
  disabled?: boolean;
}

const DOC_ACCEPT = ".pdf,.docx,.pptx,.xlsx,.txt,.md";

function keyOf(d: ModuleDocInput, i: number): string {
  return d.id ?? (d.url ? `url:${d.url}` : d.uploadId ? `up:${d.uploadId}` : `i:${i}`);
}

export function DocsField({ value, onChange, saved, disabled }: DocsFieldProps) {
  const [link, setLink] = useState("");
  const linkId = useId();
  const add = () => {
    const links = pastedLinks(link, value.map((d) => d.url ?? ""));
    if (links.length) onChange([...value, ...links.map((url) => ({ url }))]);
    setLink("");
  };
  const move = (from: number, to: number) => onChange(moveItem(value, from, to));
  const addUpload = (up: UploadView) => {
    if (!value.some((d) => d.uploadId === up.id)) onChange([...value, { uploadId: up.id, title: up.name }]);
  };

  return (
    <div className="flex flex-col gap-3" data-testid="oyelabs-docs-field">
      {value.length ? (
        <DragDropProvider
          onDragEnd={(event) => {
            if (event.canceled) return;
            const { source } = event.operation;
            if (isSortable(source)) move(source.initialIndex, source.index);
          }}
        >
          <ol className="flex flex-col gap-2" aria-label="Documents in this module, in order">
            {value.map((d, i) => (
              <DocCard
                key={keyOf(d, i)}
                id={keyOf(d, i)}
                item={d}
                index={i}
                count={value.length}
                saved={d.id ? saved[d.id] : undefined}
                disabled={disabled}
                onMove={move}
                onRemove={() => onChange(value.filter((_, j) => j !== i))}
                onPatch={(patch) => onChange(value.map((x, j) => (j === i ? { ...x, ...patch } : x)))}
              />
            ))}
          </ol>
        </DragDropProvider>
      ) : null}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-56 flex-1 flex-col gap-1">
          <label htmlFor={linkId} className="text-small font-medium text-fg-1">
            Paste a document link
          </label>
          <Input
            id={linkId}
            value={link}
            disabled={disabled}
            placeholder="Google Docs, Sheets, Slides, Drive, OneDrive, Dropbox, Notion…"
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
        </div>
        <Button variant="secondary" size="sm" disabled={disabled || !link.trim()} onClick={add}>
          <Plus aria-hidden="true" /> Add link
        </Button>
      </div>
      <UploadButton kind="doc" label="Upload a document" accept={DOC_ACCEPT} disabled={disabled} onUploaded={addUpload} />
      <p className="text-caption text-fg-2">PDF, Word, PowerPoint, Excel, text or Markdown, up to 50 MB each.</p>
    </div>
  );
}

interface DocState {
  kind: string;
  source: string;
  title: string | null;
  status: CardStatus;
}

function fromLink(r: ResolvedDocLink | OyelabsDocView | { status: OyelabsDocView["status"]; problem: OyelabsDocView["problem"]; title: string; linkKind?: OyelabsDocView["linkKind"] }): DocState {
  const kind = "kind" in r ? r.kind : (r.linkKind ?? "web");
  return { kind, source: DOC_LINK_LABELS[kind], title: r.title || null, status: cardStatus(r.status, r.problem, "doc") };
}

function DocCard({
  id,
  item,
  index,
  count,
  saved,
  disabled,
  onMove,
  onRemove,
  onPatch,
}: {
  id: string;
  item: ModuleDocInput;
  index: number;
  count: number;
  saved: OyelabsDocView | undefined;
  disabled?: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
  onPatch: (patch: Partial<ModuleDocInput>) => void;
}) {
  const savedMatches = saved && (item.url ? saved.url === item.url : saved.uploadId === item.uploadId);
  const [state, setState] = useState<DocState | null>(() => {
    if (item.uploadId) return { kind: "upload", source: saved?.bytes ? `Uploaded file, ${formatBytes(saved.bytes)}` : "Uploaded file", title: saved?.title ?? null, status: { tone: "ok", line: "Uploaded ✓", fix: null } };
    return savedMatches && saved ? fromLink(saved) : null;
  });
  const [checking, setChecking] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (savedMatches || !item.url) return;
    let live = true;
    mediaApi.resolveDoc(item.url).then(
      (r) => live && setState(fromLink(r)),
      (e: unknown) => live && setState({ kind: "web", source: "Link", title: null, status: { tone: "problem", line: `Can't check: ${errorText(e)}`, fix: null } }),
    );
    return () => {
      live = false;
    };
  }, [item.url, savedMatches]);

  const checkAgain = async () => {
    setChecking(true);
    try {
      if (item.id && savedMatches) {
        const r = await mediaApi.checkDoc(item.id);
        setState((s) => ({ kind: s?.kind ?? "web", source: s?.source ?? "Link", title: r.title || s?.title || null, status: cardStatus(r.status, r.problem, "doc") }));
      } else if (item.url) setState(fromLink(await mediaApi.resolveDoc(item.url, true)));
    } catch (e) {
      setState((s) => (s ? { ...s, status: { tone: "problem", line: `Can't check: ${errorText(e)}`, fix: null } } : s));
    } finally {
      setChecking(false);
    }
  };

  return (
    <LinkCard
      id={id}
      index={index}
      count={count}
      source={state?.source ?? "Checking the link…"}
      kind={state?.kind ?? "web"}
      title={item.title || state?.title || "Document"}
      sub={item.url ?? ""}
      status={state?.status ?? { tone: "pending", line: "Checking…", fix: null }}
      checking={checking}
      disabled={disabled}
      onCheckAgain={item.url ? () => void checkAgain() : undefined}
      onMove={onMove}
      onRemove={onRemove}
    >
      <div className="mt-1 flex flex-col gap-1">
        <label htmlFor={titleId} className="text-caption text-fg-2">
          Title learners see
        </label>
        <Input id={titleId} value={item.title ?? ""} maxLength={200} placeholder={state?.title ?? "Document title"} disabled={disabled} onChange={(e) => onPatch({ title: e.target.value || undefined })} />
      </div>
    </LinkCard>
  );
}
