import { useSortable } from "@dnd-kit/react/sortable";
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from "lucide-react";
import { useId } from "react";

import type { OyelabsDocView, OyelabsVideoView } from "@shared/oyelabsCourses";

import { Button, Card, Field, Input, cn } from "@/v5/design";

import type { EditorEdit, EditorModule } from "./editorState";
import { DocsField } from "./media/DocsField";
import { VideoLinksField } from "./media/VideoLinksField";
import { NotesEditor } from "./NotesEditor";
import { ModuleTestPanel } from "./test/ModuleTestPanel";

export interface ModuleCardProps {
  module: EditorModule;
  moduleKey: string;
  index: number;
  count: number;
  savedVideos: Record<string, OyelabsVideoView>;
  savedDocs: Record<string, OyelabsDocView>;
  /** Plain problems for this module from the last Save attempt, by field ("title", "videos", "docs"). */
  problems: { title?: string; videos?: string; docs?: string };
  disabled: boolean;
  onEdit: (edit: EditorEdit) => void;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}

/**
 * One module of an Oyelabs course: title, videos (B's field), documents (B's field), notes, and
 * the module test once it is saved (C's panel). Reordered by dragging the handle, or with the
 * Move up / Move down buttons (the keyboard and screen-reader way, WCAG 2.5.7).
 */
export function ModuleCard({ module: m, moduleKey: key, index, count, savedVideos, savedDocs, problems, disabled, onEdit, onMove, onRemove }: ModuleCardProps) {
  const { ref, handleRef, isDragging } = useSortable({ id: key, index });
  const notesLabelId = useId();
  const name = `Module ${index + 1}`;
  const titleShown = m.title.trim() || name;

  return (
    <li ref={ref} className={cn("list-none", isDragging && "opacity-70")} data-testid="oyelabs-module">
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-1">
          <button
            ref={handleRef}
            type="button"
            className="inline-flex size-8 cursor-grab items-center justify-center rounded-control text-fg-2 hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            aria-label={`Drag to reorder ${titleShown}`}
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
          <h3 className="min-w-0 flex-1 truncate font-display text-h4 font-semibold">{name}</h3>
          <Button variant="ghost" size="icon" className="size-8" aria-label={`Move ${titleShown} up`} disabled={disabled || index === 0} onClick={() => onMove(index, index - 1)}>
            <ArrowUp aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" aria-label={`Move ${titleShown} down`} disabled={disabled || index === count - 1} onClick={() => onMove(index, index + 1)}>
            <ArrowDown aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8 text-danger-fg" aria-label={`Remove ${titleShown}`} disabled={disabled || count === 1} onClick={onRemove}>
            <Trash2 aria-hidden="true" />
          </Button>
        </div>

        <Field label="Module title" error={problems.title}>
          <Input value={m.title} maxLength={120} placeholder="Kick-off with the client" disabled={disabled} onChange={(e) => onEdit({ type: "moduleTitle", key, value: e.target.value })} />
        </Field>

        <section aria-label={`${titleShown}: videos`} className="flex flex-col gap-1.5">
          <h4 className="text-small font-medium text-fg-1">Videos</h4>
          <VideoLinksField value={m.videos} onChange={(value) => onEdit({ type: "moduleVideos", key, value })} saved={savedVideos} disabled={disabled} />
          {problems.videos ? (
            <p role="alert" className="text-small font-medium text-danger-fg">
              {problems.videos}
            </p>
          ) : null}
        </section>

        <section aria-label={`${titleShown}: documents`} className="flex flex-col gap-1.5">
          <h4 className="text-small font-medium text-fg-1">Documents</h4>
          <DocsField value={m.docs} onChange={(value) => onEdit({ type: "moduleDocs", key, value })} saved={savedDocs} disabled={disabled} />
          {problems.docs ? (
            <p role="alert" className="text-small font-medium text-danger-fg">
              {problems.docs}
            </p>
          ) : null}
        </section>

        <div className="flex flex-col gap-1.5">
          <h4 id={notesLabelId} className="text-small font-medium text-fg-1">
            Notes <span className="font-normal text-fg-2">(optional)</span>
          </h4>
          <NotesEditor value={m.notes} onChange={(value) => onEdit({ type: "moduleNotes", key, value })} label={`${titleShown} notes`} labelId={notesLabelId} />
        </div>

        <ModuleTestPanel sectionId={m.id ?? null} moduleTitle={titleShown} />
      </Card>
    </li>
  );
}
