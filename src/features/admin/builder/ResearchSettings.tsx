import { useEffect, useId, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, LinkIcon, PlugZap, Search } from "lucide-react";

import type { ResearchCheck } from "@shared/connection";

import { Field, TextField } from "@/components/form/Field";
import { PlainError } from "@/components/form/PlainError";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { builderApi, type ResearchSettings as Settings } from "./api";

const PROVIDERS = [
  {
    id: "tavily" as const,
    name: "Tavily",
    blurb: "Built for exactly this. Simplest to set up, generous free tier.",
    href: "https://tavily.com",
    recommended: true,
  },
  { id: "brave" as const, name: "Brave Search", blurb: "Independent index, paid per query.", href: "https://brave.com/search/api/" },
  { id: "serper" as const, name: "Serper", blurb: "Google results through an API.", href: "https://serper.dev" },
];

/**
 * Where the facts come from.
 *
 * Lives on the AI page beside the model credential. v4.5.1: the AI credential alone is enough to
 * make new courses. Without a search service the builder uses the AI's own web search (Claude,
 * OpenAI), or writes from the AI's own knowledge and cites only links our server opened. A search
 * service below is an optional upgrade. Whatever finds a link, our server opens it before a lesson
 * may cite it, so a URL that looks right but doesn't resolve never reaches a learner.
 *
 * Superadmin-only, like the credential, and for the same reason — it is shared by every learner on
 * the deployment and it reaches outside it.
 */
export function ResearchSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [testing, setTesting] = useState(false);
  const [check, setCheck] = useState<ResearchCheck | null>(null);

  const [provider, setProvider] = useState<Settings["provider"]>(null);
  const [searchKey, setSearchKey] = useState("");
  const [youtubeKey, setYoutubeKey] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    builderApi
      .research(controller.signal)
      .then((result) => {
        setSettings(result.settings);
        setProvider(result.settings.provider ?? result.settings.effectiveProvider ?? null);
        setCheck(result.settings.lastCheck ?? null);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err);
      });
    return () => controller.abort();
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      /* Only send a key that was actually typed. The form cannot show a stored one, so sending an
         empty string here would clear it — which is what an admin editing only the budget would
         accidentally do. */
      const result = await builderApi.saveResearch({
        provider,
        ...(searchKey.trim() ? { searchKey: searchKey.trim() } : {}),
        ...(youtubeKey.trim() ? { youtubeKey: youtubeKey.trim() } : {}),
      });
      setSettings(result.settings);
      const keyChanged = Boolean(searchKey.trim() || youtubeKey.trim());
      setSearchKey("");
      setYoutubeKey("");
      notify.success(result.settings.configured ? "Saved. Checking it with a real search now." : "Saved.");
      // v4.5: a saved key is tested at once, so the admin sees whether it really works.
      if (result.settings.configured && (keyChanged || !result.settings.lastCheck)) await test();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  /** v4.5: a real search from our server with the saved key; a pass starts every waiting course. */
  const test = async () => {
    setTesting(true);
    try {
      const result = await builderApi.testResearch();
      setCheck(result.check);
      setSettings(result.settings);
      if (result.check.state === "ready" && result.check.woken > 0) {
        notify.success(`${result.check.woken} waiting course${result.check.woken === 1 ? "" : "s"} started.`);
      }
    } catch (err) {
      setError(err);
    } finally {
      setTesting(false);
    }
  };

  const recheck = async () => {
    setChecking(true);
    try {
      await builderApi.checkLinks();
      notify.success("Checking every link in every generated course. It runs in the background.");
    } catch (err) {
      setError(err);
    } finally {
      setChecking(false);
    }
  };

  if (!settings) {
    return (
      <section className="mt-12">
        <h2 className="font-display text-lg font-semibold">Research</h2>
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          Loading…
        </p>
      </section>
    );
  }

  return (
    <section className="mt-12" aria-labelledby="research-heading">
      <h2 id="research-heading" className="font-display text-lg font-semibold">
        Research
      </h2>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Where the AI course builder finds its sources. Whatever finds a link, our server opens it
        before a lesson may cite it, so a generated course never cites a URL that doesn't work.
      </p>

      <AutoPublishSetting />

      <ResearchModeLine settings={settings} />

      {error != null && (
        <div className="mt-4">
          <PlainError error={error} />
        </div>
      )}

      <form onSubmit={save} className="mt-5 max-w-2xl space-y-5" noValidate>
        <p className="max-w-prose text-sm text-muted-foreground">
          Optional upgrade: a search service gives the course builder more results per search. New
          courses are made without one.
        </p>
        <Field label="Search provider (optional)">
          {({ id }) => (
            <div id={id} className="grid gap-2 sm:grid-cols-3">
              {PROVIDERS.map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    "cursor-pointer rounded-md border px-3 py-2.5 text-sm transition-colors",
                    provider === option.id ? "border-primary bg-primary/5" : "hover:bg-surface-sunken/60",
                  )}
                >
                  <input
                    type="radio"
                    name="research-provider"
                    className="sr-only"
                    checked={provider === option.id}
                    onChange={() => setProvider(option.id)}
                  />
                  <span className="flex items-center gap-2 font-medium">
                    {option.name}
                    {option.recommended && <Badge variant="success">Recommended</Badge>}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">{option.blurb}</span>
                  <a
                    href={option.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={(event) => event.stopPropagation()}
                    className="mt-1 inline-block font-mono text-[11px] text-muted-foreground underline underline-offset-2"
                  >
                    get a key
                  </a>
                </label>
              ))}
            </div>
          )}
        </Field>

        <Field
          label="Search API key"
          hint={
            settings.searchHint
              ? `One is stored (${settings.searchHint}). Leave this empty to keep it.`
              : "Stored encrypted. It is never shown again — only its last four characters."
          }
        >
          {({ id }) => (
            <Input
              id={id}
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={searchKey}
              leading={<Search />}
              onChange={(event) => setSearchKey(event.target.value)}
              className="font-mono"
            />
          )}
        </Field>

        <Field
          label="YouTube Data API v3 key"
          hint={
            settings.youtubeHint
              ? `One is stored (${settings.youtubeHint}). Leave this empty to keep it.`
              : "Optional. From the Google Cloud console, with the YouTube Data API enabled. Without it, new lessons are written without a video."
          }
        >
          {({ id }) => (
            <Input
              id={id}
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={youtubeKey}
              onChange={(event) => setYoutubeKey(event.target.value)}
              className="font-mono"
            />
          )}
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={saving}>
            Save research settings
          </Button>
          <Button type="button" variant="outline" loading={testing} disabled={!settings.configured} onClick={() => void test()}>
            <PlugZap aria-hidden="true" />
            Test
          </Button>
        </div>
        <TestResult check={check} testing={testing} />
      </form>

      <BudgetFields settings={settings} onSaved={setSettings} />

      <div className="mt-8 border-t pt-5">
        <h3 className="text-sm font-semibold">Link health</h3>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Every link a generated course cites is re-checked weekly. A dead one is flagged rather than
          removed — a 404 can be a deployment, and a lesson that silently loses its references is one
          nobody chose to weaken.
        </p>
        <Button variant="outline" size="sm" className="mt-3" loading={checking} onClick={() => void recheck()}>
          <LinkIcon aria-hidden="true" />
          Check every link now
        </Button>
      </div>
    </section>
  );
}

/**
 * v4.5.1: what new courses search with right now, in one plain line from the server. Amber only
 * when nothing works (no AI credential); every other mode needs no setup.
 */
function ResearchModeLine({ settings }: { settings: Settings }) {
  if (!settings.modeLine) return null;
  const blocked = settings.mode === "none";
  return (
    <div
      role="status"
      data-testid="research-mode"
      data-mode={settings.mode}
      className={cn(
        "mt-4 flex max-w-2xl gap-3 rounded-md border px-4 py-3 text-sm",
        blocked ? "border-trailmark/50 bg-trailmark/[0.07]" : "border-summit/40 bg-summit/[0.06]",
      )}
    >
      {blocked ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-strong" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-summit-strong" aria-hidden="true" />
      )}
      <p className="max-w-prose">{settings.modeLine}</p>
    </div>
  );
}

/**
 * v4.4: whether a new course that passes its quality check goes straight to the library (on by
 * default). A course that fails is never published; it waits under "Needs a look". A learner's own
 * setting (Setup → Advanced) can override this.
 */
function AutoPublishSetting() {
  const [on, setOn] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const id = useId();

  useEffect(() => {
    const controller = new AbortController();
    builderApi
      .builderSettings(controller.signal)
      .then((result) => setOn(result.autoPublish))
      .catch(() => setOn(null));
    return () => controller.abort();
  }, []);

  if (on === null) return null;

  const change = async (next: boolean) => {
    setSaving(true);
    try {
      const result = await builderApi.saveBuilderSettings({ autoPublish: next });
      setOn(result.autoPublish);
      notify.success(result.autoPublish ? "New courses that pass the quality check are published." : "New courses wait for your OK.");
    } catch {
      notify.error("Could not save that.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 flex max-w-2xl items-start gap-3 rounded-md border px-4 py-3">
      <Checkbox id={id} checked={on} disabled={saving} onCheckedChange={(value) => void change(value === true)} className="mt-0.5" />
      <label htmlFor={id} className="cursor-pointer text-sm">
        <span className="font-medium">Publish new courses that pass the quality check: {on ? "On" : "Off"}</span>
        <span className="mt-0.5 block text-muted-foreground">
          {on
            ? "They go to the library for everyone and to the learner who needed them. Courses that fail wait under Needs a look."
            : "Every new course waits for your OK on the Generated courses page."}
        </span>
      </label>
    </div>
  );
}

/**
 * The per-run ceiling.
 *
 * Per run rather than per month, because a runaway loop announces itself inside one run — and a
 * monthly cap would let a single bad run burn the month before anything noticed.
 */
function BudgetFields({ settings, onSaved }: { settings: Settings; onSaved: (settings: Settings) => void }) {
  const [tokens, setTokens] = useState(settings.budgetTokens);
  const [searches, setSearches] = useState(settings.budgetSearches);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const result = await builderApi.saveResearch({ budgetTokens: tokens, budgetSearches: searches });
      onSaved(result.settings);
      notify.success("Budget saved.");
    } catch {
      notify.error("Could not save that budget.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-8 max-w-2xl border-t pt-5">
      <h3 className="text-sm font-semibold">Budget per run</h3>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        A run stops when it reaches either of these and says so, rather than carrying on.
      </p>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <TextField
          label="AI usage limit"
          type="number"
          min={10_000}
          max={5_000_000}
          step={10_000}
          value={String(tokens)}
          onChange={(event) => setTokens(Number(event.target.value) || 400_000)}
        />
        <TextField
          label="Searches"
          type="number"
          min={5}
          max={500}
          value={String(searches)}
          onChange={(event) => setSearches(Number(event.target.value) || 60)}
        />
      </div>

      <Button variant="outline" size="sm" className="mt-3" loading={saving} onClick={() => void save()}>
        Save budget
      </Button>
    </div>
  );
}

const CHECK_TITLE: Record<ResearchCheck["state"], string> = {
  ready: "Connected",
  not_set_up: "Not set up",
  key_rejected: "Key rejected",
  quota: "Quota used up",
  unreachable: "Can't reach it from our server",
  temporary: "Temporary error, retrying",
};

/** v4.5: the last Test, in one plain line, with when it ran. */
function TestResult({ check, testing }: { check: ResearchCheck | null; testing: boolean }) {
  if (testing) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Running a test search from our server…
      </p>
    );
  }
  if (!check) return null;
  const ok = check.state === "ready";
  return (
    <div
      role="status"
      data-testid="research-test-result"
      data-state={check.state}
      className={cn(
        "flex gap-3 rounded-md border px-4 py-3 text-sm",
        ok ? "border-summit/40 bg-summit/[0.06]" : "border-trailmark/50 bg-trailmark/[0.07]",
      )}
    >
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-summit-strong" aria-hidden="true" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-strong" aria-hidden="true" />
      )}
      <p className="max-w-prose">
        {!ok && <span className="font-medium">{CHECK_TITLE[check.state]}. </span>}
        {check.message}
        <span className="ml-1 text-xs text-muted-foreground">
          (checked {new Date(check.checkedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })})
        </span>
      </p>
    </div>
  );
}
