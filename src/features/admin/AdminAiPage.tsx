import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";

import type { AiStatusResponse, SelectableProvider } from "@shared/ai";
import { PROVIDER_COPY, requiresSharedUseAcknowledgement, SHARED_CREDENTIAL_NOTICE } from "@shared/ai";
import { selectableProviderIds } from "@shared/enums";

import { api, ApiRequestError } from "@/api/client";
import { Field, FormAlert, TextField } from "@/components/form/Field";
import { useConfirm } from "@/components/overlays";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShineBorder } from "@/components/ui/shine-border";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { transition } from "@/lib/motion";
import { notify } from "@/lib/toast";
import { cn, formatTimestamp } from "@/lib/utils";
import { AiCallsTable } from "./AiCallsTable";

/**
 * Admin → AI connection (brief §8.1).
 *
 * Two things this page must not soften: the provider policy warnings for subscription
 * credentials, and the fact that one credential is shared by everyone on the deployment. Both are
 * shown in full, from `shared/ai.ts`, so the server and the UI cannot drift apart on what was
 * agreed to.
 */
export default function AdminAiPage() {
  useDocumentTitle("AI connection");
  const confirm = useConfirm();

  const [status, setStatus] = useState<AiStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    try {
      setStatus(await api.get<AiStatusResponse>("/api/admin/ai"));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not load the AI settings.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  /**
   * Deleting a credential is irreversible from here: the secret is encrypted at rest and never
   * shown again, so there is nothing to paste back. Hence the typed confirmation, and hence the
   * work running inside the dialog — the admin watches the thing they had to type for finish.
   */
  const handleDelete = async (id: string, label: string) => {
    const deleted = await confirm({
      title: `Delete "${label}"?`,
      body: `Every AI feature using this credential stops the moment it goes — generating assessments, evaluating them, and the learning plans that come out of them. The secret itself is destroyed; re-adding it means fetching a fresh key from the provider.`,
      confirmLabel: "Delete credential",
      variant: "destructive",
      confirmPhrase: label,
      onConfirm: () => api.del(`/api/admin/ai/credentials/${id}`),
    });
    if (!deleted) return;
    notify.success(`Deleted "${label}".`);
    await load();
  };

  const act = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "That didn't work.");
    } finally {
      setBusy(null);
    }
  };

  if (!status) {
    return (
      <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground sm:px-6" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">AI connection</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Assessments, evaluations and learning plans are generated through this credential.
      </p>

      {status.usingMockProvider && (
        <div className="mt-6 flex gap-3 rounded-md border border-trailmark/50 bg-trailmark/[0.07] px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-trailmark-strong" aria-hidden="true" />
          <div>
            <p className="font-medium">A development mock is standing in for a real provider</p>
            <p className="mt-1 text-muted-foreground">
              Generated assessments and plans are structurally valid and semantically meaningless. This never happens
              in production, where a real credential is required.
            </p>
          </div>
        </div>
      )}

      {error && <div className="mt-6"><FormAlert>{error}</FormAlert></div>}

      <section className="mt-8" aria-labelledby="credentials-heading">
        <h2 id="credentials-heading" className="text-lg font-semibold">
          Credentials
        </h2>

        {status.credentials.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No credential yet. Add one below — an Anthropic API key is the recommended option.
          </p>
        ) : (
          <>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">{SHARED_CREDENTIAL_NOTICE}</p>
            <ul className="mt-4 space-y-3">
              {status.credentials.map((credential) => {
                const active = status.settings.activeCredentialId === credential.id;
                const copy = PROVIDER_COPY[credential.provider as SelectableProvider];
                const verifying = busy === `verify-${credential.id}`;
                /* Only the active credential gets the travelling border. It is the one every
                   generation actually runs through, and marking all of them would say nothing. */
                const Shell = active ? ShineBorder : "li";
                return (
                  <Shell
                    key={credential.id}
                    {...(active
                      ? { className: "rounded-md", innerClassName: "rounded-md bg-summit/5 px-4 py-3" }
                      : { className: "rounded-md border px-4 py-3" })}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 font-medium">
                          {credential.label}
                          {active && <Badge variant="success">Active</Badge>}
                          <StatusBadge kind="credential" status={credential.status} />
                        </p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {copy?.name ?? credential.provider} · {credential.secretHint}
                          {/* "verified <date>" beside a Failed badge reads as a success. The
                              timestamp is when it was last *checked*, so say that unless the
                              check actually passed. */}
                          {credential.lastVerifiedAt
                            ? ` · ${credential.status === "verified" ? "verified" : "last checked"} ${formatTimestamp(credential.lastVerifiedAt)}`
                            : ""}
                        </p>
                        {credential.lastError && (
                          <p className="mt-1.5 max-w-prose text-xs text-destructive">{credential.lastError}</p>
                        )}
                        {/* Verification is a queued job, not the response to this click, so the
                            line says "asked" rather than claiming a result it does not have yet. */}
                        <AnimatePresence initial={false}>
                          {verifying && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={transition.fast}
                              className="mt-1.5 flex items-center gap-1.5 overflow-hidden font-mono text-xs text-muted-foreground"
                            >
                              <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
                              Asking the provider…
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex shrink-0 gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={verifying}
                          disabled={busy !== null}
                          onClick={() =>
                            void act(`verify-${credential.id}`, () =>
                              api.post(`/api/admin/ai/credentials/${credential.id}/verify`),
                            )
                          }
                        >
                          <RefreshCw aria-hidden="true" />
                          Verify
                        </Button>
                        {!active && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy !== null}
                            onClick={() =>
                              void act(`activate-${credential.id}`, () =>
                                api.put("/api/admin/ai/settings", { activeCredentialId: credential.id }),
                              )
                            }
                          >
                            Set active
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy !== null}
                          onClick={() => void handleDelete(credential.id, credential.label)}
                        >
                          <Trash2 aria-hidden="true" />
                          <span className="sr-only">Delete {credential.label}</span>
                        </Button>
                      </div>
                    </div>
                  </Shell>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <AddCredentialForm onAdded={load} />

      <ModelSettings status={status} onSaved={load} />

      <section className="mt-12" aria-labelledby="usage-heading">
        <h2 id="usage-heading" className="text-lg font-semibold">
          Usage, last 7 days
        </h2>
        {status.usage7d.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No calls yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-md border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-surface-sunken/50 text-left">
                  <th scope="col" className="px-3 py-2 text-xs font-semibold text-muted-foreground">Purpose</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Calls</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Input tokens</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Output tokens</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Failures</th>
                </tr>
              </thead>
              <tbody>
                {status.usage7d.map((row) => (
                  <tr key={row.purpose} className="border-b last:border-0">
                    <td className="px-3 py-2">{row.purpose}</td>
                    <td className="px-3 py-2 text-right tabular">{row.calls}</td>
                    <td className="px-3 py-2 text-right tabular">{row.inputTokens.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular">{row.outputTokens.toLocaleString()}</td>
                    <td className={cn("px-3 py-2 text-right tabular", row.failures > 0 && "text-destructive")}>
                      {row.failures}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 max-w-prose text-xs text-muted-foreground">
          Counted from our own records. A shared credential cannot be attributed per person by the provider, so this
          table is the only per-learner view of usage.
        </p>
      </section>

      <AiCallsTable />
    </div>
  );
}

function AddCredentialForm({ onAdded }: { onAdded: () => Promise<void> }) {
  const [provider, setProvider] = useState<SelectableProvider>("anthropic-api");
  const [label, setLabel] = useState("");
  const [secret, setSecret] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const copy = PROVIDER_COPY[provider];
  const needsAck = requiresSharedUseAcknowledgement(provider);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFields({});
    try {
      await api.post("/api/admin/ai/credentials", { provider, label, secret, sharedUseAcknowledged: acknowledged });
      setLabel("");
      setSecret("");
      setAcknowledged(false);
      await onAdded();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        setFields(err.fields ?? {});
      } else {
        setError("Could not save that credential.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-12" aria-labelledby="add-heading">
      <h2 id="add-heading" className="text-lg font-semibold">
        Add a credential
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-5" noValidate>
        {error && <FormAlert>{error}</FormAlert>}

        <Field label="Provider">
          {({ id }) => (
            <div id={id} className="grid gap-2 sm:grid-cols-2">
              {selectableProviderIds.map((option) => {
                const optionCopy = PROVIDER_COPY[option];
                const selected = provider === option;
                return (
                  <label
                    key={option}
                    className={cn(
                      "cursor-pointer rounded-md border px-3 py-2.5 text-sm transition-colors",
                      selected ? "border-trailmark bg-trailmark/[0.07]" : "hover:bg-surface-sunken/60",
                    )}
                  >
                    <input
                      type="radio"
                      name="provider"
                      className="sr-only"
                      checked={selected}
                      onChange={() => {
                        setProvider(option);
                        setAcknowledged(false);
                      }}
                    />
                    <span className="flex items-center gap-2 font-medium">
                      {optionCopy.name}
                      {optionCopy.recommended && <Badge variant="success">Recommended</Badge>}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">{optionCopy.summary}</span>
                  </label>
                );
              })}
            </div>
          )}
        </Field>

        {copy.policyWarning && (
          <div className="flex gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            <p className="max-w-prose">{copy.policyWarning}</p>
          </div>
        )}

        <TextField
          label="Name"
          required
          value={label}
          error={fields.label}
          placeholder="Oyelabs Console key"
          hint="So you can tell credentials apart later."
          onChange={(e) => setLabel(e.target.value)}
        />

        <Field label={copy.secretLabel} error={fields.secret} hint={copy.secretHint} required>
          {({ id, describedBy, invalid }) =>
            provider === "codex-cli" ? (
              <textarea
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                rows={5}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className={cn(
                  "w-full rounded-md border border-input bg-surface px-3 py-2 font-mono text-xs",
                  invalid && "border-destructive",
                )}
                placeholder='{"OPENAI_API_KEY": null, "tokens": { … }}'
              />
            ) : (
              <Input
                id={id}
                type="password"
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className={cn("font-mono", invalid && "border-destructive")}
              />
            )
          }
        </Field>

        {needsAck && (
          <label className="flex items-start gap-3 rounded-md border px-4 py-3">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[rgb(var(--trailmark))]"
            />
            <span className="text-sm">
              <span className="font-medium">I understand and accept the risk.</span>
              <span className="mt-1 block text-muted-foreground">{SHARED_CREDENTIAL_NOTICE}</span>
              {fields.sharedUseAcknowledged && (
                <span className="mt-1 block text-xs font-medium text-destructive">{fields.sharedUseAcknowledged}</span>
              )}
            </span>
          </label>
        )}

        <Button type="submit" loading={submitting} disabled={!label || !secret || (needsAck && !acknowledged)}>
          Save credential
        </Button>
        <p className="text-xs text-muted-foreground">
          The credential is encrypted before it is stored and is never shown again — only its last four characters.
        </p>
      </form>
    </section>
  );
}

function ModelSettings({ status, onSaved }: { status: AiStatusResponse; onSaved: () => Promise<void> }) {
  const activeProvider = useMemo(() => {
    const active = status.credentials.find((c) => c.id === status.settings.activeCredentialId);
    return active?.provider ?? "anthropic-api";
  }, [status]);

  const suggested = status.suggestedModels[activeProvider] ?? status.suggestedModels["anthropic-api"];

  const [generation, setGeneration] = useState(status.settings.modelGeneration ?? "");
  const [critic, setCritic] = useState(status.settings.modelCritic ?? "");
  const [evaluation, setEvaluation] = useState(status.settings.modelEvaluation ?? "");
  const [note, setNote] = useState(status.settings.monthlyBudgetNote ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.put("/api/admin/ai/settings", {
        modelGeneration: generation || null,
        modelCritic: critic || null,
        modelEvaluation: evaluation || null,
        monthlyBudgetNote: note || null,
      });
      await onSaved();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-12" aria-labelledby="models-heading">
      <h2 id="models-heading" className="text-lg font-semibold">
        Models
      </h2>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Leave a field empty to use the suggested model. Evaluation is the one worth spending on: it reads the whole
        assessment and writes the plan.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label="Generation"
            value={generation}
            placeholder={suggested?.generation}
            onChange={(e) => setGeneration(e.target.value)}
          />
          <TextField label="Critic" value={critic} placeholder={suggested?.critic} onChange={(e) => setCritic(e.target.value)} />
          <TextField
            label="Evaluation"
            value={evaluation}
            placeholder={suggested?.evaluation}
            onChange={(e) => setEvaluation(e.target.value)}
          />
        </div>

        <TextField
          label="Budget note"
          value={note}
          placeholder="e.g. $200/month cap set in the Console"
          hint="A reminder for you. Nothing enforces it — set the real cap with your provider."
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex items-center gap-3">
          <Button type="submit" variant="outline" loading={saving}>
            Save models
          </Button>
          {saved && <span className="text-sm text-summit-strong">Saved</span>}
        </div>
      </form>
    </section>
  );
}
