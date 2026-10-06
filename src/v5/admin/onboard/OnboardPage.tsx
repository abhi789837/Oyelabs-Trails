import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import type { UserSummary } from "@shared/admin";
import type { SuggestedGoal } from "@shared/goals";
import { yearsFromBand, type SaveSetupRequest } from "@shared/setup";

import { ApiRequestError } from "@/api/client";
import { TextField } from "@/components/form/Field";
import { adminApi } from "@/features/admin/api";
import { useCatalog } from "@/features/admin/catalog/useCatalog";
import { setupApi } from "@/features/admin/setup/api";
import { BulkOnboard } from "@/features/admin/setup/BulkOnboard";
import type { SetupState } from "@/features/admin/setup/helpers";
import { describeIssued } from "@/features/admin/setup/issued";
import { QuickOnboard } from "@/features/admin/setup/QuickOnboard";
import { SetupForm } from "@/features/admin/setup/SetupForm";
import { TemporaryPasswordNotice } from "@/features/admin/TemporaryPasswordNotice";
import { useAuth } from "@/features/auth/AuthProvider";
import { Button, Card, ErrorState, SkeletonLayout, v5Toast } from "@/v5/design";

import { Page, PageHeader, Segmented } from "../parts/common";

const NO_USERNAMES: ReadonlySet<string> = new Set();

/**
 * `/admin/onboard`: the v4.4 plain flow (one line → Suggest → the plan card → "Looks good — send
 * the test") in the v5 frame. The flow itself is the v4.4 components (`QuickOnboard`,
 * `BulkOnboard`, `SetupForm`) and their APIs; this page only creates the account and saves the
 * setup in the same two calls, in the same order, as the older page.
 *
 * Creating an admin account stays on the older page (`/admin/onboard/classic`): it's rare, and
 * the super admin is the only one who can.
 */
export default function OnboardPage() {
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [params, setParams] = useSearchParams();
  const mode = params.get("mode") === "bulk" ? "bulk" : params.get("mode") === "full" ? "full" : "quick";
  const setMode = (m: "quick" | "bulk" | "full") =>
    setParams(
      (cur) => {
        const next = new URLSearchParams(cur);
        if (m === "quick") next.delete("mode");
        else next.set("mode", m);
        return next;
      },
      { replace: true },
    );
  const { catalog, error: catalogError, refresh } = useCatalog();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [taken, setTaken] = useState<Set<string> | null>(null);
  const [created, setCreated] = useState<{ username: string; displayName: string; password: string } | null>(null);
  const [pendingUser, setPendingUser] = useState<UserSummary | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [seed, setSeed] = useState<{ state: SetupState; extras: SuggestedGoal[] } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    adminApi
      .listUsers(controller.signal)
      .then((r) => setTaken(new Set(r.users.map((u) => u.username.toLowerCase()))))
      .catch(() => setTaken(null));
    return () => controller.abort();
  }, []);

  const trimmed = username.trim().toLowerCase();
  const usernameTaken = pendingUser === null && taken !== null && trimmed.length > 0 && taken.has(trimmed);
  const canSubmit = trimmed.length > 0 && displayName.trim().length > 0 && !usernameTaken;

  const reset = () => {
    setUsername("");
    setDisplayName("");
    setPendingUser(null);
    setSeed(null);
    setFormKey((k) => k + 1);
    if (mode === "full") setMode("quick");
  };

  const createAccount = useCallback(
    async (band: SaveSetupRequest["experienceBand"], description: string) => {
      const result = await adminApi.onboard({
        username: username.trim(),
        displayName,
        role: "learner",
        profile: { roleTitle: null, yearsExperience: yearsFromBand(band), adminNotes: description, claimedSkills: [], targetTracks: [] },
        // The setup save below sends the test, after the setup exists.
        issueAssessment: false,
      });
      if (result.temporaryPassword) setCreated({ username: result.user.username, displayName: result.user.displayName, password: result.temporaryPassword });
      setTaken((cur) => (cur ? new Set(cur).add(result.user.username.toLowerCase()) : cur));
      return { user: result.user, handedOver: Boolean(result.temporaryPassword) };
    },
    [username, displayName],
  );

  const save = async (request: SaveSetupRequest) => {
    let user = pendingUser;
    let handedOver = created !== null;
    if (!user) {
      const result = await createAccount(request.experienceBand, request.description ?? "");
      user = result.user;
      handedOver = result.handedOver;
    }
    let saved;
    try {
      saved = await setupApi.save(user.id, request);
    } catch (err) {
      setPendingUser(user);
      const reason = err instanceof ApiRequestError ? err.message : "Oyelearn didn't answer.";
      throw Object.assign(new Error(`We made the account, but couldn't save the plan. ${reason} Fix it and press the button again.`), {
        fields: err instanceof ApiRequestError ? err.fields : undefined,
      });
    }
    const { message, notice } = describeIssued(saved.issued, user.displayName);
    v5Toast.success(message);
    if (notice) v5Toast.info(notice);
    if (handedOver) reset();
    else navigate(`/admin/people?person=${user.id}`);
  };

  return (
    <Page>
      <PageHeader
        title={mode === "bulk" ? "Onboard several people" : "Onboard someone"}
        description={
          mode === "bulk"
            ? "Paste a list and press Suggest all. Check each plan, then send the tests."
            : "Describe them in one line and press Suggest. Check the plan, then send the test."
        }
        actions={
          me?.role === "superadmin" ? (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/onboard/classic">Add an admin instead</Link>
            </Button>
          ) : null
        }
      />

      {mode !== "full" && pendingUser === null ? (
        <Segmented
          className="mb-5"
          label="How many people"
          value={mode}
          onChange={(v) => setMode(v)}
          options={[
            { value: "quick", label: "One person" },
            { value: "bulk", label: "Several people" },
          ]}
        />
      ) : null}

      {created ? (
        <TemporaryPasswordNotice
          className="mb-5"
          kind="new"
          username={created.username}
          displayName={created.displayName}
          password={created.password}
          onDismiss={() => setCreated(null)}
        />
      ) : null}

      {!catalog ? (
        catalogError ? (
          <ErrorState body={catalogError} onRetry={() => void refresh()} />
        ) : (
          <SkeletonLayout variant="card" label="Loading departments and skills" />
        )
      ) : mode === "bulk" ? (
        <Card>
          <BulkOnboard catalog={catalog} taken={taken ?? NO_USERNAMES} onCreated={(names) => setTaken((cur) => (cur ? new Set([...cur, ...names.map((n) => n.toLowerCase())]) : cur))} />
        </Card>
      ) : mode === "full" ? (
        <Card>
          <SetupForm
            key={formKey}
            initial={null}
            seed={seed?.state ?? null}
            extras={seed?.extras}
            extrasLabel="Suggested from your description"
            onSave={save}
            primaryLabel="Looks good — send the test"
            secondaryLabel="Save without a test"
            canSubmit={canSubmit}
            leading={({ fields, pending }) => (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Full name" required value={displayName} disabled={pending || pendingUser !== null} error={fields.displayName} onChange={(e) => setDisplayName(e.target.value)} />
                <TextField
                  label="Username"
                  required
                  value={username}
                  disabled={pending || pendingUser !== null}
                  error={fields.username ?? (usernameTaken ? "That username is already taken." : undefined)}
                  spellCheck={false}
                  autoCapitalize="none"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            )}
          />
          <Button variant="link" className="mt-4" onClick={() => setMode("quick")}>
            Back to the one-line version
          </Button>
        </Card>
      ) : (
        <Card>
          <QuickOnboard
            key={formKey}
            catalog={catalog}
            username={username}
            displayName={displayName}
            onUsername={setUsername}
            onDisplayName={setDisplayName}
            usernameError={usernameTaken ? "That username is already taken." : undefined}
            accountLocked={pendingUser !== null}
            canSubmit={canSubmit}
            onSave={save}
            onEditDetails={(state, extras) => {
              setSeed({ state, extras });
              setMode("full");
            }}
          />
        </Card>
      )}
    </Page>
  );
}
