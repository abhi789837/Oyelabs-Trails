import { useState } from "react";
import { KeyRound, LogOut, ShieldCheck, ShieldOff } from "lucide-react";

import type { UserSummary } from "@shared/admin";

import { ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { useConfirm } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { formatTimestamp } from "@/lib/utils";
import { adminApi } from "../api";
import { TemporaryPasswordNotice } from "../TemporaryPasswordNotice";

type Action = "password" | "status" | "sessions";

/**
 * Account actions (brief §13).
 *
 * Each one is destructive in its own way, so each says what it actually does to the person on the
 * other end before you press it — "they will be signed out everywhere" is the part that matters,
 * not the verb on the button.
 */
export function AccountTab({ user, onChanged }: { user: UserSummary; onChanged: () => Promise<void> }) {
  const confirm = useConfirm();
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ username: string; password: string } | null>(null);

  const run = async (action: Action, work: () => Promise<void>) => {
    setBusy(action);
    setError(null);
    setNotice(null);
    try {
      await work();
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "That didn't work. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: `Reset ${user.displayName}'s password?`,
      body: "Their current password stops working the moment you confirm. A temporary one is shown to you once, here, and you have to pass it on yourself — it is not emailed. They choose a new password at their next sign-in.",
      confirmLabel: "Reset password",
      variant: "destructive",
    });
    if (!ok) return;
    void run("password", async () => {
      const result = await adminApi.resetPassword(user.id);
      if (result.temporaryPassword) setIssued({ username: user.username, password: result.temporaryPassword });
      else setNotice("Password reset. They must choose a new one at their next sign-in.");
    });
  };

  /*
   * Disabling and revoking both ask for the username to be typed. Neither is undoable in the sense
   * that matters: the person on the other end is thrown out of whatever they were doing, and no
   * button here gives them that moment back. Both also run *inside* the dialog, so the admin waits
   * with the consequence still on screen and a failure lands where they are looking.
   */
  const handleStatus = async () => {
    const next = user.status === "active" ? "disabled" : "active";
    if (next === "active") {
      void run("status", async () => {
        await adminApi.setStatus(user.id, "active");
        setNotice("Account re-enabled.");
      });
      return;
    }

    const disabled = await confirm({
      title: `Disable ${user.displayName}?`,
      body: "They are signed out of every device immediately and cannot sign in again until you re-enable the account. An assessment in progress ends where it is. Their progress, plan and history are kept.",
      confirmLabel: "Disable account",
      variant: "destructive",
      confirmPhrase: user.username,
      onConfirm: () => adminApi.setStatus(user.id, "disabled"),
    });
    if (!disabled) return;
    setError(null);
    setNotice("Account disabled and sessions cleared.");
    await onChanged();
  };

  const handleRevoke = async () => {
    let removed = 0;
    const revoked = await confirm({
      title: `Sign ${user.displayName} out of every device?`,
      body: "Every session ends at once, including the one they may be using right now. Their password is unchanged, so they can sign straight back in — use this when a laptop goes missing, not to lock someone out.",
      confirmLabel: "Revoke sessions",
      variant: "destructive",
      confirmPhrase: user.username,
      onConfirm: async () => {
        removed = (await adminApi.revokeSessions(user.id)).removed;
      },
    });
    if (!revoked) return;
    setError(null);
    setNotice(
      removed === 0 ? "They had no active sessions." : `Signed out of ${removed} session${removed === 1 ? "" : "s"}.`,
    );
    await onChanged();
  };

  return (
    <section aria-label="Account" className="max-w-3xl">
      <div className="border-b pb-4">
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          {user.username} · created {formatTimestamp(user.createdAt)} ·{" "}
          {user.lastLoginAt ? `last signed in ${formatTimestamp(user.lastLoginAt)}` : "never signed in"}
        </p>
      </div>

      {issued && (
        <TemporaryPasswordNotice
          className="mt-6"
          username={issued.username}
          password={issued.password}
          onDismiss={() => setIssued(null)}
        />
      )}

      {notice && (
        <p className="mt-6 rounded-md border border-summit/40 bg-summit/[0.07] px-3 py-2 text-sm" role="status">
          {notice}
        </p>
      )}
      {error && (
        <div className="mt-6">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        <ActionRow
          icon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
          title="Reset password"
          description="Generates a temporary password, shown to you once. Their current one stops working straight away and they choose a new one at the next sign-in."
          action={
            <Button
              variant="outline"
              loading={busy === "password"}
              onClick={() => void handleReset()}
              disabled={busy !== null}
            >
              Reset password
            </Button>
          }
        />

        <ActionRow
          icon={
            user.status === "active" ? (
              <ShieldOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            )
          }
          title={user.status === "active" ? "Disable account" : "Re-enable account"}
          description={
            user.status === "active"
              ? "Signs them out everywhere and blocks sign-in. Their progress, plan and assessment history are kept."
              : "Lets them sign in again with their existing password."
          }
          action={
            <Button
              variant="outline"
              loading={busy === "status"}
              onClick={() => void handleStatus()}
              disabled={busy !== null}
            >
              {user.status === "active" ? "Disable" : "Re-enable"}
            </Button>
          }
        />

        <ActionRow
          icon={<LogOut className="h-4 w-4" aria-hidden="true" />}
          title="Revoke sessions"
          description="Signs them out of every device without changing their password. Use this when a laptop goes missing."
          action={
            <Button
              variant="outline"
              loading={busy === "sessions"}
              onClick={() => void handleRevoke()}
              disabled={busy !== null}
            >
              Revoke
            </Button>
          }
        />
      </ul>
    </section>
  );
}

function ActionRow({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-start gap-4 rounded-md border px-4 py-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-[16rem] flex-1">
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 max-w-prose text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="ml-auto">{action}</div>
    </li>
  );
}
