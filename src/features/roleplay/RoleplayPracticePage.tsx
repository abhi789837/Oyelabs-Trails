import { useEffect, useId, useState } from "react";
import { ArrowLeft, MessagesSquare } from "lucide-react";

import { ROLEPLAY_DEFAULT_TURNS, ROLEPLAY_MAX_TURNS, ROLEPLAY_MIN_TURNS, type RoleplayCatalog, type RoleplaySessionView } from "@shared/roleplay";

import { ApiRequestError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/utils";

import { roleplayApi } from "./api";
import { Avatar, RoleplayChat } from "./RoleplayChat";

/**
 * `/practice/roleplay`: pick a scenario and a client, then talk it through. Formative: the score is
 * feedback, nothing is recorded against the learner's plan.
 */
export default function RoleplayPracticePage() {
  useDocumentTitle("Client role-play");
  const idPrefix = useId().replace(/:/g, "");
  const [catalog, setCatalog] = useState<RoleplayCatalog | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [personaId, setPersonaId] = useState<string>("");
  const [maxTurns, setMaxTurns] = useState(ROLEPLAY_DEFAULT_TURNS);
  const [session, setSession] = useState<RoleplaySessionView | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    roleplayApi
      .catalog(controller.signal)
      .then((c) => {
        setCatalog(c);
        setScenarioId((current) => current ?? c.scenarios[0]?.id ?? null);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError(e instanceof ApiRequestError ? e.message : "The scenarios could not be loaded.");
      });
    return () => controller.abort();
  }, []);

  const scenario = catalog?.scenarios.find((s) => s.id === scenarioId) ?? null;
  const defaultPersona = catalog?.personas.find((p) => p.id === scenario?.defaultPersonaId);

  const start = async () => {
    if (!scenario) return;
    setStarting(true);
    setError(null);
    try {
      const { session: started } = await roleplayApi.start({ context: "practice", scenarioId: scenario.id, personaId: personaId || undefined, maxTurns });
      setSession(started);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "The conversation could not start. Try again.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-start gap-3">
        <MessagesSquare className="mt-1 size-6 shrink-0 text-ridge-strong" aria-hidden="true" />
        <div>
          <h1 className="font-display text-2xl font-bold">Client role-play</h1>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            Practise the conversations that decide a project: scope creep, a slipped date, a push-back on price. The client has
            their own worries; good questions bring them out. Then write the follow-up email and get feedback.
          </p>
        </div>
      </div>

      {session ? (
        <div className="mt-8 space-y-6">
          <Button variant="ghost" size="sm" onClick={() => setSession(null)}>
            <ArrowLeft aria-hidden="true" />
            Choose another scenario
          </Button>
          <RoleplayChat key={session.id} session={session} onSession={setSession} followUp idPrefix={idPrefix} />
        </div>
      ) : !catalog ? (
        error ? (
          <p role="alert" className="mt-8 text-sm text-destructive">
            {error}
          </p>
        ) : (
          <div className="mt-8 grid gap-3 sm:grid-cols-2" aria-busy="true">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        )
      ) : (
        <div className="mt-8 space-y-6">
          {!catalog.aiAvailable && (
            <p role="note" className="rounded-md border border-trailmark/40 bg-trailmark/[0.07] px-3 py-2 text-sm">
              <span className="font-medium">Practice mode — the AI client is not connected.</span> The client follows a script and there is
              no score; you get a self-check list instead.
            </p>
          )}
          {catalog.aiAvailable && !catalog.withinCap && (
            <p role="note" className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
              Role-play has used this month&rsquo;s AI budget. It opens again next month, or ask an admin to raise the cap.
            </p>
          )}

          <fieldset>
            <legend className="text-sm font-medium">Scenario</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Scenario">
              {catalog.scenarios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={s.id === scenarioId}
                  onClick={() => setScenarioId(s.id)}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-left transition-colors hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trailmark",
                    s.id === scenarioId ? "border-ridge bg-ridge/[0.06]" : "bg-card",
                  )}
                >
                  <span className="block font-medium">{s.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{s.summary}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {scenario && (
            <div className="rounded-md border bg-surface-sunken/60 px-4 py-3 text-sm">
              <p>
                <span className="font-medium">The project: </span>
                <span className="text-muted-foreground">{scenario.context}</span>
              </p>
              <p className="mt-2">
                <span className="font-medium">Your brief: </span>
                {scenario.objective}
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${idPrefix}-persona`} className="text-sm font-medium">
                Client
              </label>
              <select id={`${idPrefix}-persona`} value={personaId} onChange={(e) => setPersonaId(e.target.value)} className={cn(inputClasses, "mt-1.5")}>
                <option value="">{defaultPersona ? `${defaultPersona.name} (suggested)` : "Suggested for this scenario"}</option>
                {catalog.personas
                  .filter((p) => p.id !== defaultPersona?.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}, {p.role.toLowerCase()}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${idPrefix}-turns`} className="text-sm font-medium">
                Your messages
              </label>
              <select id={`${idPrefix}-turns`} value={maxTurns} onChange={(e) => setMaxTurns(Number(e.target.value))} className={cn(inputClasses, "mt-1.5")}>
                {Array.from({ length: ROLEPLAY_MAX_TURNS - ROLEPLAY_MIN_TURNS + 1 }, (_, i) => i + ROLEPLAY_MIN_TURNS).map((n) => (
                  <option key={n} value={n}>
                    Up to {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(() => {
            const persona = catalog.personas.find((p) => p.id === (personaId || scenario?.defaultPersonaId));
            return persona ? (
              <div className="flex items-start gap-3 text-sm">
                <Avatar initials={persona.initials} tone="client" />
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{persona.name}</span> — {persona.style}
                </p>
              </div>
            ) : null;
          })()}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void start()} loading={starting} disabled={!scenario || (catalog.aiAvailable && !catalog.withinCap)}>
              Start the conversation
            </Button>
            <span className="font-mono text-xs text-muted-foreground">Messages up to 600 characters</span>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div>
            <p className="text-sm font-medium">How it is judged</p>
            <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-2">
              {catalog.rubric.map((r) => (
                <li key={r.label}>
                  {r.label} <span className="font-mono text-xs">({r.points})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
