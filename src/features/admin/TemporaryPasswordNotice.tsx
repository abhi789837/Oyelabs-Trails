import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, Mail, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { inviteMailto, inviteMessage, inviteSubject, signInUrl } from "./invite";

/**
 * Shows a generated temporary password once, with everything needed to pass it on.
 *
 * The server never returns the password again — it is hashed the moment it is created — so this is
 * deliberately loud and dismissible rather than a toast that could disappear before it is read.
 *
 * **Send it takes one click.** It used to copy the password alone, which left the admin to assemble
 * the rest by hand every time: the URL out of the address bar, the username out of the row, and
 * some wording about it being temporary. That is five actions per person, and the wording is the
 * part that got dropped when somebody was in a hurry. Now the primary button puts a complete,
 * pasteable message on the clipboard; Share hands it to WhatsApp or Slack directly on a phone; and
 * the password on its own is still one click for when that is genuinely all that is needed.
 */
export function TemporaryPasswordNotice({
  username,
  password,
  displayName,
  kind = "new",
  onDismiss,
  className,
}: {
  username: string;
  password: string;
  /** For the greeting. Without it the message simply has no greeting. */
  displayName?: string | null;
  /** `reset` changes the wording — a reset must not claim the account was just created. */
  kind?: "new" | "reset";
  onDismiss: () => void;
  className?: string;
}) {
  const [copied, setCopied] = useState<"invite" | "password" | null>(null);
  const [canShare, setCanShare] = useState(false);

  /* Feature-detected in an effect rather than at render: `navigator.share` is absent on most
     desktops and only usable in a secure context, and reading it during render would make the
     first paint differ between server-ish and client environments for no benefit. */
  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const input = { kind, username, password, displayName, origin: window.location.origin } as const;
  const message = inviteMessage(input);

  const copy = async (what: "invite" | "password") => {
    try {
      await navigator.clipboard.writeText(what === "invite" ? message : password);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard access can be denied. Everything is on screen and selectable either way, which
      // is why the message is rendered rather than only held in a variable.
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: inviteSubject(kind), text: message });
    } catch {
      // Includes the user simply dismissing the sheet, which is not an error worth reporting.
    }
  };

  return (
    <div className={cn("rounded-md border border-trailmark/50 bg-trailmark/[0.07] p-4", className)} role="status">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium">
            {kind === "new" ? "Account created for" : "Password reset for"} {displayName ?? username}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            The password is shown once and cannot be retrieved later, only reset. Send it now.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Dismiss">
          <X aria-hidden="true" />
        </Button>
      </div>

      {/* Exactly what will be sent. Shown rather than hidden behind the button, because an admin
          pasting a message into a colleague's chat should be able to read it first — and because
          it is the fallback when the clipboard is blocked. */}
      <pre className="mt-3 max-h-56 overflow-auto rounded-md border bg-surface px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap select-all">
        {message}
      </pre>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button onClick={() => void copy("invite")}>
          {copied === "invite" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied === "invite" ? "Copied — now paste it to them" : "Copy message"}
        </Button>

        {canShare && (
          <Button variant="outline" onClick={() => void share()}>
            <Send aria-hidden="true" />
            Share
          </Button>
        )}

        {/* No recipient: the platform stores usernames, not email addresses, so there is nothing
            truthful to put in the To field. It opens a draft the admin addresses themselves. */}
        <Button asChild variant="outline">
          <a href={inviteMailto(input)}>
            <Mail aria-hidden="true" />
            Email
          </a>
        </Button>

        <Button variant="ghost" onClick={() => void copy("password")}>
          {copied === "password" ? <Check aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
          {copied === "password" ? "Copied" : "Password only"}
        </Button>
      </div>

      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        {username} · {signInUrl(window.location.origin)}
      </p>
    </div>
  );
}
