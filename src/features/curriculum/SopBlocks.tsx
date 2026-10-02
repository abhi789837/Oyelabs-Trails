import { useEffect, useState } from "react";
import { ClipboardList, PencilLine } from "lucide-react";

import { api, ApiRequestError } from "@/api/client";
import { RichText } from "@/components/content/RichText";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { isStaff } from "@shared/enums";
import { SOP_BODY_MAX, SOP_MARKER, type SopBlock } from "@shared/sop";

/**
 * v4.1: the company's own procedure for this topic (our Keka policy, our MoM template). Until an
 * admin writes it, the learner sees a clearly marked "admin to fill" block instead of a guess.
 */
export function SopBlocks({ topicId }: { topicId: string }) {
  const { user } = useAuth();
  const staff = user ? isStaff(user.role) : false;
  const [blocks, setBlocks] = useState<SopBlock[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<{ blocks: SopBlock[] }>(`/api/content/topics/${encodeURIComponent(topicId)}/sop`, controller.signal)
      .then((res) => setBlocks(res.blocks))
      .catch(() => setBlocks([]));
    return () => controller.abort();
  }, [topicId]);

  if (!blocks?.length) return null;
  return (
    <section aria-labelledby="sop-heading" className="mt-10 max-w-3xl">
      <h2 id="sop-heading" className="flex items-center gap-2 text-lg font-semibold">
        <ClipboardList className="size-5 text-primary" aria-hidden />
        How we do it at Oyelabs
      </h2>
      <div className="mt-4 space-y-4">
        {blocks.map((block) => (
          <SopCard key={block.index} topicId={topicId} block={block} canEdit={staff} onSaved={(next) => setBlocks((all) => all?.map((b) => (b.index === next.index ? next : b)) ?? null)} />
        ))}
      </div>
    </section>
  );
}

export function SopCard({ topicId, block, canEdit, onSaved }: { topicId: string; block: SopBlock; canEdit: boolean; onSaved: (block: SopBlock) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(block.body ?? "");
  const [saving, setSaving] = useState(false);
  const empty = !block.body;
  const fieldId = `sop-${topicId}-${block.index}`;

  async function save() {
    setSaving(true);
    try {
      const res = await api.put<{ block: SopBlock }>(`/api/admin/sop/${encodeURIComponent(topicId)}/${block.index}`, { body: draft });
      onSaved(res.block);
      setEditing(false);
      notify.success(res.block.body ? "SOP saved. Learners see it now." : "SOP cleared.");
    } catch (error) {
      notify.error(error instanceof ApiRequestError ? error.message : "The SOP couldn't be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn("rounded-md border px-4 py-4", empty ? "border-dashed border-trailmark/70 bg-trailmark/5" : "bg-card")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-medium">{block.title}</h3>
        {canEdit && !editing && (
          <Button variant="outline" size="sm" onClick={() => { setDraft(block.body ?? ""); setEditing(true); }}>
            <PencilLine aria-hidden />
            {empty ? "Fill in" : "Edit"}
          </Button>
        )}
      </div>
      {editing ? (
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">{block.prompt.replace(SOP_MARKER, "").trim()}</p>
          <label htmlFor={fieldId} className="sr-only">{block.title}</label>
          <textarea
            id={fieldId}
            value={draft}
            maxLength={SOP_BODY_MAX}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{draft.length}/{SOP_BODY_MAX} · Markdown: **bold**, `code`, "- " bullets</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </div>
      ) : empty ? (
        <div className="mt-2 text-sm">
          <p className="font-mono text-xs font-semibold text-trailmark-foreground dark:text-trailmark">{SOP_MARKER}</p>
          <p className="mt-1 text-muted-foreground">{block.prompt.replace(SOP_MARKER, "").trim()}</p>
          {!canEdit && <p className="mt-2 text-muted-foreground">Until this is written, ask your lead how the team does it.</p>}
        </div>
      ) : (
        <RichText text={block.body!} size="sm" className="mt-2" />
      )}
    </div>
  );
}
