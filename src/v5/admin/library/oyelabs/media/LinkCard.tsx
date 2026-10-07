import { useSortable } from "@dnd-kit/react/sortable";
import { ArrowDown, ArrowUp, CircleCheck, Cloud, FileText, FileVideoCamera, Globe, GripVertical, HardDrive, LoaderCircle, Package, RefreshCw, TriangleAlert, Trash2, Upload, Video } from "lucide-react";
import type { ReactNode } from "react";

import { Button, cn } from "@/v5/design";

import type { CardStatus } from "./fieldLogic";

/** v4.5 Phase 2: one video or doc in the editor, with its status, fix, and reorder controls. */

const ICONS: Record<string, typeof Video> = {
  youtube: Video,
  vimeo: Video,
  loom: Video,
  gdrive: HardDrive,
  gdoc: FileText,
  gsheet: FileText,
  gslides: FileText,
  onedrive: Cloud,
  sharepoint: Cloud,
  dropbox: Package,
  box: Package,
  direct: FileVideoCamera,
  upload: Upload,
  embed: Globe,
  web: Globe,
  notion: FileText,
  confluence: FileText,
};

export interface LinkCardProps {
  id: string;
  index: number;
  count: number;
  /** Provider name ("Google Drive"). */
  source: string;
  kind: string;
  title: string;
  /** What's under the title: the link, or the file's size. */
  sub: string;
  thumbnailUrl?: string | null;
  status: CardStatus;
  checking?: boolean;
  disabled?: boolean;
  onCheckAgain?: () => void;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
  /** The title box, the length box: whatever this kind of card edits. */
  children?: ReactNode;
}

export function LinkCard({ id, index, count, source, kind, title, sub, thumbnailUrl, status, checking, disabled, onCheckAgain, onMove, onRemove, children }: LinkCardProps) {
  const { ref, handleRef, isDragging } = useSortable({ id, index, disabled });
  const Icon = ICONS[kind] ?? Globe;
  const name = title || `Item ${index + 1}`;
  return (
    <li ref={ref} className={cn("list-none rounded-card border border-line-1 bg-surface-1 p-3", isDragging && "opacity-70")} data-testid="oyelabs-link-card" data-status={status.tone}>
      <div className="flex gap-3">
        <button
          ref={handleRef}
          type="button"
          disabled={disabled}
          className="inline-flex size-8 shrink-0 cursor-grab items-center justify-center rounded-control text-fg-2 hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          aria-label={`Drag to reorder ${name}`}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
        <div className="relative hidden aspect-video w-28 shrink-0 overflow-hidden rounded-control bg-sunken sm:block">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="absolute inset-0 size-full object-cover"
              onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
              }}
            />
          ) : null}
          <span className="absolute inset-0 grid place-items-center text-fg-2">{thumbnailUrl ? null : <Icon className="size-6" aria-hidden="true" />}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="flex items-center gap-1.5 text-caption text-fg-2">
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
            {source}
          </p>
          <p className="truncate font-medium text-fg-1">{name}</p>
          <p className="truncate text-caption text-fg-2">{sub}</p>
          <p
            role={status.tone === "problem" ? "alert" : undefined}
            className={cn("flex items-start gap-1.5 text-small font-medium", status.tone === "ok" ? "text-success-fg" : status.tone === "problem" ? "text-danger-fg" : "text-fg-2")}
          >
            {status.tone === "ok" ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : status.tone === "problem" ? <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            <span>{status.line}</span>
          </p>
          {status.fix ? <p className="text-small text-fg-1">{status.fix}</p> : null}
          {children}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex">
            <Button variant="ghost" size="icon" className="size-8" aria-label={`Move ${name} up`} disabled={disabled || index === 0} onClick={() => onMove(index, index - 1)}>
              <ArrowUp aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" aria-label={`Move ${name} down`} disabled={disabled || index === count - 1} onClick={() => onMove(index, index + 1)}>
              <ArrowDown aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8 text-danger-fg" aria-label={`Remove ${name}`} disabled={disabled} onClick={onRemove}>
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
          {onCheckAgain && status.tone !== "pending" ? (
            <Button variant="ghost" size="sm" onClick={onCheckAgain} disabled={disabled || checking}>
              <RefreshCw className={cn(checking && "animate-spin motion-reduce:animate-none")} aria-hidden="true" /> Check again
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
