import { useState } from "react";
import { Check, Copy, Laptop, Mail } from "lucide-react";

import { SEND_TO_EMAIL_COPY, continueLink, type SendToEmailResponse } from "@shared/sendToEmail";

import { Button } from "@/v5/design/components/Button";

import { lessonApi } from "./api";

type Outcome = { kind: "sent" | "already" | "not_set_up" | "failed"; message: string; link: string };

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * The coding Do step on a phone: a gentle "Best on a bigger screen" note and "Send to my email to
 * continue on laptop", which emails a deep link back to this step (and the code so far). When email
 * can't go out, the link is offered to copy instead.
 */
export function SendToLaptop({ topicId, courseId, getCode }: { topicId: string; courseId?: string | null; getCode: () => string | undefined }) {
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [copied, setCopied] = useState<"yes" | "no" | null>(null);

  const send = async () => {
    setBusy(true);
    setCopied(null);
    const fallback = continueLink(window.location.origin, topicId, courseId);
    try {
      const res: SendToEmailResponse = await lessonApi.sendToEmail(topicId, { courseId: courseId ?? undefined, code: getCode() });
      setOutcome(
        res.status === "sent"
          ? { kind: "sent", message: SEND_TO_EMAIL_COPY.sent, link: res.link }
          : res.status === "already_sent"
            ? { kind: "already", message: SEND_TO_EMAIL_COPY.alreadySent(res.retryInMinutes ?? 60), link: res.link }
            : { kind: "not_set_up", message: `${SEND_TO_EMAIL_COPY.notSetUp}.`, link: res.link },
      );
    } catch {
      setOutcome({ kind: "failed", message: SEND_TO_EMAIL_COPY.failed, link: fallback });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!outcome) return;
    setCopied((await copyText(outcome.link)) ? "yes" : "no");
  };

  return (
    <section aria-labelledby="do-bigger-screen" className="rounded-card border border-line-1 bg-surface-1 p-4" data-testid="send-to-laptop">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-info-soft text-info-fg" aria-hidden="true">
          <Laptop className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="do-bigger-screen" className="font-display text-body font-semibold text-fg-1">
            Best on a bigger screen
          </h2>
          <p className="mt-0.5 text-small text-fg-2">Coding is easier with a keyboard and a wide editor. You can keep going here, or pick it up on your laptop.</p>
        </div>
      </div>
      <Button className="mt-3 min-h-11 w-full" variant="secondary" onClick={() => void send()} loading={busy} disabled={busy || outcome?.kind === "sent"}>
        {busy ? null : outcome?.kind === "sent" ? <Check aria-hidden="true" /> : <Mail aria-hidden="true" />}
        Send to my email to continue on laptop
      </Button>
      <div role="status" aria-live="polite" className="mt-2 empty:hidden">
        {outcome ? (
          <p className={outcome.kind === "sent" ? "text-small font-medium text-success-fg" : "text-small text-fg-1"}>{outcome.message}</p>
        ) : null}
        {outcome && outcome.kind !== "sent" ? (
          <div className="mt-2 flex flex-col gap-2">
            <Button className="min-h-11 w-full" variant={outcome.kind === "not_set_up" ? "primary" : "secondary"} onClick={() => void copy()}>
              {copied === "yes" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied === "yes" ? "Link copied" : "Copy the link"}
            </Button>
            {copied === "no" ? (
              <>
                <p className="text-small text-fg-2">Your browser didn't let us copy it. Press and hold the link to copy it yourself.</p>
                <a href={outcome.link} className="break-all text-small text-brand-fg underline">
                  {outcome.link}
                </a>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
