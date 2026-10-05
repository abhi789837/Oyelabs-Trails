import { useEffect, useState } from "react";
import { AlertTriangle, LoaderCircle, RefreshCw } from "lucide-react";

import { HAIKU, OPUS, SONNET, type BudgetStatus, type TaskRoute } from "@shared/aiRouting";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { notify } from "@/lib/toast";
import { formatTimestamp } from "@/lib/utils";
import { InfoTip } from "./catalog/InfoTip";

interface RoutesResponse {
  routes: TaskRoute[];
  availableModels: string[];
  modelsFetchedAt: number | null;
  budget: BudgetStatus;
}

const OTHER = "__other";
const DEFAULT_MODELS = [HAIKU, SONNET, OPUS];

/** Every model the select offers: the live list when known, the three defaults, and the current one. */
function modelOptions(available: readonly string[], current: string): string[] {
  return [...new Set([...available, ...DEFAULT_MODELS, current])].filter(Boolean);
}

/**
 * Admin → AI connection → Model routing (v4 Phase 6). One row per task type; a change saves that
 * one row. Reset sends nulls, which puts the task back on its default.
 */
export function ModelRouting() {
  const [data, setData] = useState<RoutesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setData(await api.get<RoutesResponse>("/api/admin/ai/routes"));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not load which AI engine does what.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const result = await api.post<{ availableModels: string[]; refreshed: boolean }>("/api/admin/ai/models/refresh");
      if (result.refreshed) notify.success(`${result.availableModels.length} AI engines available with this key.`);
      else notify.info("The provider did not send a list of AI engines. The defaults are still offered.");
      await load();
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "Could not refresh the list of AI engines.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="mt-12" aria-labelledby="routing-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="routing-heading" className="text-lg font-semibold">
            Which AI engine does what
          </h2>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">Which AI engine each kind of AI work runs on.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button variant="outline" size="sm" loading={refreshing} onClick={() => void refresh()}>
            <RefreshCw aria-hidden="true" />
            Refresh AI engine list
          </Button>
          <span className="font-mono text-[11px] text-muted-foreground">
            {data?.modelsFetchedAt ? `Fetched ${formatTimestamp(data.modelsFetchedAt)}` : "Not fetched yet"}
          </span>
        </div>
      </div>

      {error && <div className="mt-4"><FormAlert>{error}</FormAlert></div>}

      {!data ? (
        !error && (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Loading…
          </p>
        )
      ) : (
        <ul className="mt-4 divide-y rounded-md border">
          {data.routes.map((route) => (
            <RouteRow
              key={route.task}
              route={route}
              available={data.availableModels}
              onSaved={(routes) => setData((current) => (current ? { ...current, routes } : current))}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function RouteRow({
  route,
  available,
  onSaved,
}: {
  route: TaskRoute;
  available: readonly string[];
  onSaved: (routes: TaskRoute[]) => void;
}) {
  const options = modelOptions(available, route.model);
  const [choice, setChoice] = useState(route.model);
  const [other, setOther] = useState("");
  const [maxTokens, setMaxTokens] = useState<number | null>(route.maxTokens);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setChoice(route.model);
    setOther("");
    setMaxTokens(route.maxTokens);
  }, [route.model, route.maxTokens]);

  const model = choice === OTHER ? other.trim() : choice;
  const dirty = model !== route.model || maxTokens !== route.maxTokens;
  const valid = model.length >= 3 && maxTokens !== null && maxTokens >= 16;

  const put = async (body: { model: string | null; maxTokens: number | null }, message: string) => {
    setSaving(true);
    try {
      const result = await api.put<{ routes: TaskRoute[] }>(`/api/admin/ai/routes/${route.task}`, body);
      onSaved(result.routes);
      notify.success(message);
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "Could not save the route.");
    } finally {
      setSaving(false);
    }
  };

  const id = `route-${route.task}`;
  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{route.label}</span>
        {route.urgent && (
          <span className="inline-flex items-center">
            <Badge variant="brand">urgent</Badge>
            <InfoTip label="What urgent means">A learner is waiting on it, so it still runs when the monthly budget is used up.</InfoTip>
          </span>
        )}
        {route.batch && (
          <span className="inline-flex items-center">
            <Badge variant="outline">batch</Badge>
            <InfoTip label="What batch means">Sent through the Message Batches API at half price; results can take longer.</InfoTip>
          </span>
        )}
        {route.custom && <Badge variant="default">custom</Badge>}
        {route.fallbackFrom && (
          <Badge variant="progress" title={route.fallbackFrom}>
            <AlertTriangle className="size-3" aria-hidden="true" />
            Not available on this key — using Sonnet 5.5
          </Badge>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-56">
          <label htmlFor={`${id}-model`} className="mb-1 block text-xs text-muted-foreground">
            AI engine
          </label>
          <select
            id={`${id}-model`}
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-surface px-2 font-mono text-xs"
          >
            {options.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value={OTHER}>Other…</option>
          </select>
        </div>
        {choice === OTHER && (
          <div className="min-w-0 flex-1 basis-48">
            <label htmlFor={`${id}-other`} className="mb-1 block text-xs text-muted-foreground">
              AI engine id
            </label>
            <Input
              id={`${id}-other`}
              value={other}
              onChange={(e) => setOther(e.target.value)}
              placeholder="claude-…"
              spellCheck={false}
              className="h-9 font-mono text-xs"
            />
          </div>
        )}
        <div className="w-32">
          <label htmlFor={`${id}-tokens`} className="mb-1 block text-xs text-muted-foreground">
            Max AI usage per call
          </label>
          <NumberInput id={`${id}-tokens`} value={maxTokens} onChange={setMaxTokens} min={16} max={64_000} step={100} className="h-9" />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            loading={saving}
            disabled={!dirty || !valid || saving}
            onClick={() => void put({ model, maxTokens }, `${route.label}: saved.`)}
          >
            Save
          </Button>
          {route.custom && (
            <Button
              size="sm"
              variant="ghost"
              disabled={saving}
              onClick={() => void put({ model: null, maxTokens: null }, `${route.label}: back to the default.`)}
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
