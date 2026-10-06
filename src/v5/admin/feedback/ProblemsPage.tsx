import { CheckCircle2, FileWarning } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { UNDO_MS } from "@shared/adminInbox";

import { Badge, Button, Card, EmptyState, ErrorState, SkeletonLayout, v5Toast } from "@/v5/design";

import { v5AdminApi } from "../api";
import { formatDateTime, isMissing, Page, PageHeader, plainMessage, Segmented, useLoad, useSlow } from "../parts/common";
import { createDeferredQueue } from "../parts/deferred";

const STEP: Record<string, string> = { watch: "Watch", read: "Read", do: "Do", check: "Check" };

/** `/admin/problems`: what learners reported with "Report a problem" in a lesson. */
export default function ProblemsPage() {
  const [status, setStatus] = useState<"open" | "resolved">("open");
  const list = useLoad((signal) => v5AdminApi.problems(status, signal), status);
  const slow = useSlow(list.loading && !list.data);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const queue = useRef(createDeferredQueue(UNDO_MS));
  useEffect(() => {
    const q = queue.current;
    return () => void q.flush();
  }, []);

  const unhide = (id: string) =>
    setHidden((h) => {
      const n = new Set(h);
      n.delete(id);
      return n;
    });

  const resolve = (id: string) => {
    setHidden((h) => new Set(h).add(id));
    queue.current.schedule(id, () => v5AdminApi.resolveProblem(id), (error) => {
      unhide(id);
      v5Toast.error("That didn't work", plainMessage(error));
    });
    v5Toast.undo("Marked fixed.", () => {
      if (queue.current.cancel(id)) unhide(id);
    });
  };

  const items = (list.data?.problems ?? []).filter((p) => !hidden.has(p.id));

  return (
    <Page>
      <PageHeader title="Problems reported" description="When a learner presses Report a problem in a lesson, it lands here and in your inbox." />
      <Segmented
        className="mb-4"
        label="Show"
        value={status}
        onChange={setStatus}
        options={[
          { value: "open", label: "Waiting" },
          { value: "resolved", label: "Fixed" },
        ]}
      />
      {list.error && !list.data ? (
        isMissing(list.error) ? (
          <EmptyState icon={<FileWarning />} title="Problem reports are coming soon" body="This part of Oyelearn isn't switched on here yet." />
        ) : (
          <ErrorState body={plainMessage(list.error)} onRetry={list.reload} />
        )
      ) : !list.data ? (
        slow ? <SkeletonLayout variant="list" rows={4} label="Loading problem reports" /> : null
      ) : items.length === 0 ? (
        <EmptyState icon={<CheckCircle2 />} title={status === "open" ? "No problems waiting" : "Nothing fixed yet"} body={status === "open" ? "When a learner reports one, it shows up here." : undefined} />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((p) => (
            <li key={p.id}>
              <Card className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <p className="text-small font-medium">
                    {p.reporter.displayName} in{" "}
                    <Link className="text-brand-fg underline-offset-4 hover:underline" to={`/learn/lesson/${encodeURIComponent(p.topicId)}`}>
                      {p.topicTitle}
                    </Link>
                    {p.step ? <Badge tone="outline" className="ml-2">{STEP[p.step] ?? p.step}</Badge> : null}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-small text-fg-1">"{p.message}"</p>
                  <p className="mt-1 text-caption text-fg-2">{formatDateTime(p.createdAt)}</p>
                </div>
                {p.status === "open" ? (
                  <Button variant="primary" size="sm" onClick={() => resolve(p.id)}>
                    Mark fixed
                  </Button>
                ) : (
                  <Badge tone="success">Fixed {formatDateTime(p.resolvedAt)}</Badge>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
