import { HelpCircle } from "lucide-react";

import type { Intent, Unsure, UnsureOption } from "@shared/intents";

import { Button } from "@/components/ui/button";

/**
 * v4.4: what Suggest understood from the description, one line per thing it said (with the words it
 * came from), and the phrases it could not place, each with 2-3 options to pick from. Save stays
 * off until every one is answered. Phase 6 turns this into the summary card.
 */
export function IntentList({ intents, unsure, onAnswer, disabled }: { intents: readonly Intent[]; unsure: readonly Unsure[]; onAnswer: (index: number, option: UnsureOption) => void; disabled?: boolean }) {
  if (intents.length === 0 && unsure.length === 0) return null;
  return (
    <div className="space-y-4">
      {intents.length > 0 && (
        <div>
          <p className="text-sm font-medium">We understood:</p>
          <ul className="mt-1.5 space-y-1 text-sm" aria-label="We understood">
            {intents.map((intent) => (
              <li key={intent.id} className="flex flex-wrap gap-x-2">
                <span className="text-muted-foreground">&ldquo;{intent.phrase}&rdquo;</span>
                <span aria-hidden="true">→</span>
                <span>{intent.status === "left_out" ? "Left out" : intent.statement}</span>
                {intent.autoMapped && <span className="text-xs text-muted-foreground">(closest match)</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {unsure.map((question, index) => (
        <div key={`${question.phrase}-${index}`} role="group" aria-label={`Not sure about ${question.phrase}`} className="rounded-md border border-trailmark/50 bg-trailmark/6 px-3 py-2.5">
          <p className="flex items-start gap-2 text-sm">
            <HelpCircle className="mt-0.5 size-4 shrink-0 text-trailmark-strong" aria-hidden="true" />
            <span>
              We weren&rsquo;t sure what you meant by &lsquo;{question.phrase}&rsquo;. Pick one:
            </span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2 pl-6">
            {question.options.map((option) => (
              <Button key={option.label} type="button" size="sm" variant={option.leaveOut ? "ghost" : "outline"} disabled={disabled} onClick={() => onAnswer(index, option)}>
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
