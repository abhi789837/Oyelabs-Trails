import { Layers, Split } from "lucide-react";

import type { TopicInteractive as Interactive } from "@shared/content";
import { DecisionTool } from "./DecisionTool";
import { Flashcards } from "./Flashcards";

/** v4.2: the handbook tool a topic asks for, shown after its summary. */
export function TopicInteractive({ interactive }: { interactive: Interactive }) {
  const isDecision = interactive.kind === "decision-tool";
  const Icon = isDecision ? Split : Layers;
  return (
    <section aria-labelledby="interactive-heading" className="mt-10 max-w-3xl">
      <h2 id="interactive-heading" className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="size-5 text-primary" aria-hidden="true" />
        {isDecision ? "Try it: classify the request" : "Practise the terms"}
      </h2>
      <div className="mt-4">
        {interactive.kind === "decision-tool" ? (
          <DecisionTool request={interactive.request} />
        ) : (
          <Flashcards category={interactive.category} />
        )}
      </div>
    </section>
  );
}
