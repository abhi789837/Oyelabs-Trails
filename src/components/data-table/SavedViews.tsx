import { useState } from "react";
import { Bookmark, BookmarkPlus, Check, Trash2 } from "lucide-react";

import { EMPTY_TABLE_QUERY, type TableQuery } from "@shared/table";

import { useConfirm } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { isSameView } from "./viewStorage";
import type { BuiltInView, SavedView } from "./types";

/**
 * Named filter presets: the ones the app ships, and the ones the admin saves.
 *
 * Both appear in one list, because from the reader's side there is no difference — they are both
 * "the question I ask this table most often". Only the built-ins are marked, and only the saved
 * ones can be deleted.
 *
 * The list says plainly that saved views live in this browser. That is a real limitation of
 * storing them locally (see `viewStorage.ts` for why), and the honest thing is to put it where
 * someone reads it before they rely on it, not in a support ticket afterwards.
 */

export interface SavedViewsProps {
  builtIn: readonly BuiltInView[];
  saved: readonly SavedView[];
  query: TableQuery;
  onApply: (query: TableQuery) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
}

export function SavedViews({ builtIn, saved, query, onApply, onSave, onDelete }: SavedViewsProps) {
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const now = Date.now();

  const active =
    builtIn.find((view) => isSameView(view.build(now), query))?.name ??
    saved.find((view) => isSameView(view.query, query))?.name;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setName("");
    setOpen(false);
    notify.success(`Saved “${trimmed}”.`, { description: "It is stored in this browser." });
  };

  const handleDelete = async (view: SavedView) => {
    const ok = await confirm({
      title: `Delete “${view.name}”?`,
      body: "The view is removed from this browser. The rows it showed are untouched, and you can rebuild it from the filters at any time.",
      confirmLabel: "Delete view",
      variant: "destructive",
    });
    if (ok) onDelete(view.id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Bookmark aria-hidden="true" />
          <span className="max-w-32 truncate">{active ?? "Views"}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-2">
        <ul className="max-h-64 space-y-0.5 overflow-y-auto" aria-label="Saved views">
          <li>
            <ViewRow
              label="All records"
              selected={isSameView(query, EMPTY_TABLE_QUERY)}
              onSelect={() => {
                onApply({ ...EMPTY_TABLE_QUERY, pageSize: query.pageSize });
                setOpen(false);
              }}
            />
          </li>

          {builtIn.map((view) => (
            <li key={view.id}>
              <ViewRow
                label={view.name}
                hint={view.description}
                selected={active === view.name}
                onSelect={() => {
                  onApply({ ...view.build(Date.now()), pageSize: query.pageSize });
                  setOpen(false);
                }}
              />
            </li>
          ))}

          {saved.length > 0 && (
            <li className="px-2 pb-1 pt-2 font-mono text-xs text-muted-foreground" role="presentation">
              Yours
            </li>
          )}

          {saved.map((view) => (
            <li key={view.id} className="group/view flex items-center gap-1">
              <ViewRow
                label={view.name}
                selected={active === view.name}
                onSelect={() => {
                  onApply({ ...view.query, pageSize: query.pageSize });
                  setOpen(false);
                }}
              />
              <button
                type="button"
                onClick={() => void handleDelete(view)}
                aria-label={`Delete view ${view.name}`}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-[opacity,color] duration-[120ms] hover:text-destructive focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong group-hover/view:opacity-100"
              >
                <Trash2 aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-2 border-t pt-2">
          <label htmlFor="saved-view-name" className="sr-only">
            Name for this view
          </label>
          <div className="flex items-center gap-1.5">
            <Input
              id="saved-view-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSave();
                }
              }}
              placeholder="Save these filters as…"
              className="h-8 text-sm"
              containerClassName="flex-1"
            />
            <Button size="icon-sm" variant="outline" onClick={handleSave} disabled={!name.trim()} aria-label="Save view">
              <BookmarkPlus aria-hidden="true" />
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Saved views stay in this browser.</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ViewRow({
  label,
  hint,
  selected,
  onSelect,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-[120ms] hover:bg-accent",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-strong",
        selected && "font-medium text-primary-strong",
      )}
    >
      <Check aria-hidden="true" className={cn("size-3.5 shrink-0", selected ? "opacity-100" : "opacity-0")} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint && <span className="shrink-0 text-xs text-muted-foreground">{hint}</span>}
    </button>
  );
}
