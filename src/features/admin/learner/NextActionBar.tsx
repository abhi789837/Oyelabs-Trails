import { useCallback, useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

import type { UserSummary } from "@shared/admin";

import { ApiRequestError } from "@/api/client";
import { useConfirm } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { adminWeekApi } from "@/features/plan/api";
import { adminApi } from "../api";
import { builderApi } from "../builder/api";
import { describeIssued } from "../setup/issued";
import { TemporaryPasswordNotice } from "../TemporaryPasswordNotice";
import { nextActionApi, POLLED_KINDS, TONE_CLASS, type NextAction } from "./nextAction";

const POLL_MS = 15_000;

/**
 * v4.3 Phase 6: the learner page's top bar. Their state, the next thing to do, and one button for
 * it. Each button reuses the call the tab it belongs to already makes; "open" buttons switch tabs.
 */
export function NextActionBar({
  user,
  refreshKey,
  onOpenTab,
  onChanged,
}: {
  user: UserSummary;
  /** Changes after anything a tab changed (and on a tab switch), so the bar re-reads. */
  refreshKey: string | number;
  onOpenTab: (tab: "setup" | "assessment" | "path", anchor?: string) => void;
  /** After the bar itself changed something: which parts of the page to reload. */
  onChanged: (what: "account" | "assessments" | "path" | "week") => void;
}) {
  const confirm = useConfirm();
  const [action, setAction] = useState<NextAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setAction((await nextActionApi.get(user.id, signal)).action);
      } catch {
        /* The bar is a convenience: the tabs still work without it. */
      }
    },
    [user.id],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, refreshKey, user.status, user.mustChangePassword]);

  const polled = action !== null && POLLED_KINDS.includes(action.kind);
  useEffect(() => {
    if (!polled) return;
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [polled, load]);

  if (!action || action.kind === "staff") return null;

  const run = async () => {
    const button = action.button;
    if (!button || busy) return;
    if (button.action === "open") {
      onOpenTab(button.tab, button.anchor);
      return;
    }
    if (button.action === "invite") {
      const ok = await confirm({
        title: `Make a new invite for ${user.displayName}?`,
        body: "Their temporary password is replaced and shown to you once.",
        confirmLabel: "New invite",
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      if (button.action === "enable") {
        await adminApi.setStatus(user.id, "active");
        notify.success(`${user.displayName} can sign in again.`);
        onChanged("account");
      } else if (button.action === "assign") {
        const issued = await adminApi.issueAssessment(user.id);
        const { message, notice } = describeIssued(issued);
        notify.success(message);
        if (notice) notify.info(notice);
        onChanged("assessments");
      } else if (button.action === "invite") {
        const result = await adminApi.resetPassword(user.id);
        if (result.temporaryPassword) setInvite(result.temporaryPassword);
        onChanged("account");
      } else if (button.action === "build") {
        await builderApi.buildPath(user.id);
        notify.success("Building their path. It takes a few minutes.");
        onChanged("path");
      } else if (button.action === "week" || button.action === "advance-week") {
        await adminWeekApi.regenerate(user.id, { advance: button.action === "advance-week" });
        notify.success(button.action === "week" ? "Their week is published." : "Their next week has started.");
        onChanged("week");
      }
      await load();
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const tone = TONE_CLASS[action.tone];
  return (
    <>
      <section
        aria-label="Next action"
        data-next-action={action.kind}
        className={cn("mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-md border border-l-4 bg-surface px-4 py-3", tone.bar)}
      >
        <p className="flex min-w-0 flex-1 items-center gap-2.5 text-sm" role="status" aria-live="polite">
          <span className={cn("size-2 shrink-0 rounded-full", tone.dot)} aria-hidden="true" />
          <span className="font-mono text-[11px] text-muted-foreground">{tone.label}</span>
          <span className="min-w-0 font-medium">{action.title}</span>
          {polled && <LoaderCircle className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />}
        </p>
        {action.button && (
          <Button size="sm" loading={busy} onClick={() => void run()}>
            {action.button.label}
          </Button>
        )}
      </section>
      {invite && (
        <TemporaryPasswordNotice
          className="mt-4"
          kind="new"
          username={user.username}
          displayName={user.displayName}
          password={invite}
          onDismiss={() => setInvite(null)}
        />
      )}
    </>
  );
}
