import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Search, Wand2 } from "lucide-react";

import { BANK_MIN_PER_SKILL, type BankItemType } from "@shared/bank";
import type { Department, Skill } from "@shared/catalog";

import { ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { InfoTip } from "../catalog/InfoTip";
import { bankApi, type CoverageCounts } from "./api";
import { BANK_TYPE_LABELS, coverageRows, typesForFormat } from "./helpers";

/** Active items per skill and type, with the thin spots first and a gap-fill button on each. */
export function CoverageTab({ department, skills }: { department: Department; skills: readonly Skill[] }) {
  const [coverage, setCoverage] = useState<Record<string, CoverageCounts> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queued, setQueued] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [thinOnly, setThinOnly] = useState(true);
  const [term, setTerm] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setCoverage(null);
    bankApi
      .coverage(department.id, controller.signal)
      .then((result) => {
        setCoverage(result.coverage);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiRequestError ? err.message : "Could not load coverage.");
      });
    return () => controller.abort();
  }, [department.id]);

  const types = typesForFormat(department.assessmentFormat);
  const rows = useMemo(
    () => (coverage ? coverageRows(skills, coverage, department.id, department.assessmentFormat) : []),
    [coverage, skills, department],
  );
  const thinCount = rows.filter((r) => r.thin.length > 0).length;
  const shown = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return rows.filter(
      (r) => (!thinOnly || r.thin.length > 0) && (!needle || r.skillName.toLowerCase().includes(needle) || r.area.toLowerCase().includes(needle)),
    );
  }, [rows, thinOnly, term]);

  const fill = async (skillId: string, type: BankItemType) => {
    const key = `${skillId}:${type}`;
    setBusy(key);
    try {
      await bankApi.fill(department.id, skillId, type);
      setQueued((current) => new Set(current).add(key));
      notify.success("Queued");
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "Could not queue a gap fill.");
    } finally {
      setBusy(null);
    }
  };

  if (error) return <FormAlert>{error}</FormAlert>;
  if (!coverage) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        Loading coverage…
      </p>
    );
  }
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">This department has no live skills yet.</p>;

  return (
    <div>
      <p className="flex items-center gap-1 text-sm text-muted-foreground">
        {thinCount === 0 ? "Every skill has enough active items." : `${thinCount} of ${rows.length} skills are thin.`}
        <InfoTip label="What thin means">
          Thin means fewer active items than the assembler wants ({types.map((t) => `${BANK_MIN_PER_SKILL[t]} ${BANK_TYPE_LABELS[t].toLowerCase()}`).join(", ")}).
          Fill gap asks the AI to write more; each one is validated before it goes live.
        </InfoTip>
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Input
          type="search"
          aria-label="Filter skills"
          placeholder="Filter skills"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onClear={() => setTerm("")}
          leading={<Search />}
          containerClassName="w-full sm:w-64"
          className="h-8 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={thinOnly}
            onChange={(e) => setThinOnly(e.target.checked)}
            className="size-4 accent-[rgb(var(--primary))]"
          />
          Thin skills only
        </label>
        <span className="text-xs text-muted-foreground">
          Showing {shown.length} of {rows.length}
        </span>
      </div>

      <div className="mt-3 overflow-x-auto rounded-md border">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <caption className="sr-only">Active items per skill and type</caption>
          <thead>
            <tr className="border-b bg-surface-sunken/50 text-left">
              <th scope="col" className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                Skill
              </th>
              {types.map((type) => (
                <th key={type} scope="col" className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                  {BANK_TYPE_LABELS[type]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={types.length + 1} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No skills match.
                </td>
              </tr>
            )}
            {shown.map((row) => (
              <tr key={row.skillId} className="border-b last:border-0">
                <th scope="row" className="px-3 py-2 text-left font-normal">
                  <span className="block font-medium">{row.skillName}</span>
                  <span className="text-xs text-muted-foreground">{row.area}</span>
                </th>
                {types.map((type) => {
                  const thin = row.thin.includes(type);
                  const key = `${row.skillId}:${type}`;
                  return (
                    <td key={type} className="px-3 py-2 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("tabular font-medium", thin && "text-destructive")}>
                          {row.counts[type]}
                          <span className="font-normal text-muted-foreground"> / {BANK_MIN_PER_SKILL[type]}</span>
                        </span>
                        {thin && <Badge variant="danger">thin</Badge>}
                        {thin &&
                          (queued.has(key) ? (
                            <span className="text-xs text-muted-foreground">Queued</span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7"
                              loading={busy === key}
                              disabled={busy !== null}
                              onClick={() => void fill(row.skillId, type)}
                            >
                              <Wand2 aria-hidden="true" />
                              Fill gap
                              <span className="sr-only">
                                {" "}
                                for {row.skillName}, {BANK_TYPE_LABELS[type]}
                              </span>
                            </Button>
                          ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
