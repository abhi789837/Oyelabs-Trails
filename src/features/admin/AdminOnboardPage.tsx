import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import type { UserSummary } from "@shared/admin";
import { yearsFromBand, type SaveSetupRequest } from "@shared/setup";

import { ApiRequestError } from "@/api/client";
import { Field, FormAlert, PasswordField, TextField } from "@/components/form/Field";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { adminApi } from "./api";
import { setupApi } from "./setup/api";
import { SetupForm, type SetupFormContext } from "./setup/SetupForm";
import { TemporaryPasswordNotice } from "./TemporaryPasswordNotice";

/**
 * Onboarding (v4 Phase 3): the account, then the same Setup form the learner page uses.
 *
 * Two calls, in an order that matters. The account is created with `issueAssessment: false`, then
 * the setup is saved with `assign` — so the assessment is built from the setup that was just saved,
 * never from an empty one (the race the old three-call flow had). If the second call fails, the
 * account already exists; the page remembers it, so pressing the button again saves the setup
 * rather than trying to create the account twice.
 *
 * The username check runs against the roster the admin can already list, as a hint: the 409 on
 * submit is the real answer, and a dedicated "is this taken" endpoint would be a username oracle.
 */
export default function AdminOnboardPage() {
  useDocumentTitle("Onboard a learner");
  const navigate = useNavigate();
  const me = useCurrentUser();
  /* Only the superadmin may create staff, and the server enforces it. */
  const mayCreateStaff = me.role === "superadmin";

  const [role, setRole] = useState<"learner" | "admin">("learner");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [passwordMode, setPasswordMode] = useState<"generate" | "set">("generate");
  const [password, setPassword] = useState("");
  const [takenUsernames, setTakenUsernames] = useState<Set<string> | null>(null);
  const [created, setCreated] = useState<{ username: string; displayName: string; password: string } | null>(null);
  /** The account from a submit whose setup save failed: retried without creating it again. */
  const [pendingUser, setPendingUser] = useState<UserSummary | null>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    adminApi
      .listUsers(controller.signal)
      .then((r) => setTakenUsernames(new Set(r.users.map((u) => u.username.toLowerCase()))))
      .catch(() => setTakenUsernames(null));
    return () => controller.abort();
  }, []);

  const trimmedUsername = username.trim().toLowerCase();
  const usernameTaken =
    pendingUser === null && takenUsernames !== null && trimmedUsername.length > 0 && takenUsernames.has(trimmedUsername);
  const canSubmit = trimmedUsername.length > 0 && displayName.trim().length > 0 && !usernameTaken;

  const reset = () => {
    setUsername("");
    setDisplayName("");
    setRoleTitle("");
    setNotes("");
    setPassword("");
    setPendingUser(null);
    setFormKey((k) => k + 1);
  };

  const createAccount = useCallback(
    async (experienceBand: SaveSetupRequest["experienceBand"]) => {
      const result = await adminApi.onboard({
        username: username.trim(),
        displayName,
        role,
        ...(passwordMode === "set" && password ? { password } : {}),
        profile: {
          roleTitle: roleTitle.trim() || null,
          yearsExperience: yearsFromBand(experienceBand),
          adminNotes: notes,
          claimedSkills: [],
          targetTracks: [],
        },
        // The setup save below issues it, after the setup exists.
        issueAssessment: false,
      });
      /* The server returns only a password it generated; a typed one still has to be handed over. */
      const toSend = result.temporaryPassword ?? (passwordMode === "set" ? password : null);
      if (toSend) setCreated({ username: result.user.username, displayName: result.user.displayName, password: toSend });
      setTakenUsernames((current) => (current ? new Set(current).add(result.user.username.toLowerCase()) : current));
      return { user: result.user, handedOver: Boolean(toSend) };
    },
    [username, displayName, role, passwordMode, password, roleTitle, notes],
  );

  const finish = (user: UserSummary, handedOver: boolean) => {
    if (handedOver) {
      reset();
      window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    } else {
      navigate(`/admin/people/${user.id}`);
    }
  };

  const saveLearner = async (request: SaveSetupRequest) => {
    let user = pendingUser;
    let handedOver = created !== null;
    if (!user) {
      const result = await createAccount(request.experienceBand);
      user = result.user;
      handedOver = result.handedOver;
    }
    try {
      await setupApi.save(user.id, request);
    } catch (err) {
      setPendingUser(user);
      const reason = err instanceof ApiRequestError ? err.message : "the server did not answer";
      throw Object.assign(
        new Error(`The account was created, but the setup did not save (${reason}). Fix it and press the button again.`),
        { fields: err instanceof ApiRequestError ? err.fields : undefined },
      );
    }
    notify.success(
      request.assign
        ? `${user.displayName} is set up. The assessment is being built and waits for your approval.`
        : `${user.displayName} is set up.`,
    );
    finish(user, handedOver);
  };

  const accountFields = ({ fields, pending }: SetupFormContext) => (
    <section aria-labelledby="account-heading" className="space-y-5">
      <h2 id="account-heading" className="font-display text-base font-semibold">
        Account
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Username"
          required
          value={username}
          disabled={pending || pendingUser !== null}
          error={fields.username ?? (usernameTaken ? "That username is already taken." : undefined)}
          spellCheck={false}
          autoCapitalize="none"
          autoFocus
          placeholder="priya.sharma"
          hint={usernameTaken ? undefined : "Lowercase letters, digits, dot, dash or underscore."}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          label="Full name"
          required
          value={displayName}
          disabled={pending || pendingUser !== null}
          error={fields.displayName}
          placeholder="Priya Sharma"
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <TextField
          label="Role title"
          value={roleTitle}
          disabled={pending || pendingUser !== null}
          error={fields["profile.roleTitle"]}
          placeholder="Frontend Engineer"
          onChange={(e) => setRoleTitle(e.target.value)}
        />
      </div>

      {mayCreateStaff && (
        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-sm font-medium">Account type</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <Choice
              name="account-role"
              checked={role === "learner"}
              disabled={pending || pendingUser !== null}
              onSelect={() => setRole("learner")}
              title="Learner"
              body="Takes assessments and works through a plan."
            />
            <Choice
              name="account-role"
              checked={role === "admin"}
              disabled={pending || pendingUser !== null}
              onSelect={() => setRole("admin")}
              title="Admin"
              body="Runs the console for learners. Cannot manage other admins."
            />
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm font-medium">First password</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <Choice
            name="password-mode"
            checked={passwordMode === "generate"}
            disabled={pending || pendingUser !== null}
            onSelect={() => setPasswordMode("generate")}
            title="Generate one"
            body="Shown to you once, then never again."
          />
          <Choice
            name="password-mode"
            checked={passwordMode === "set"}
            disabled={pending || pendingUser !== null}
            onSelect={() => setPasswordMode("set")}
            title="Set one now"
            body="For handing over in person."
          />
        </div>
        {passwordMode === "set" && (
          <PasswordField
            label="Password"
            value={password}
            error={fields.password}
            meter
            username={username}
            autoComplete="new-password"
            disabled={pending || pendingUser !== null}
            containerClassName="max-w-sm"
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
        <p className="text-xs text-muted-foreground">They choose their own password at first sign-in.</p>
      </fieldset>
    </section>
  );

  const notesField = ({ fields, pending }: SetupFormContext) => (
    <Field
      label="Notes"
      hint="What they have built, where they are strong or struggle. The assessment reads this."
      error={fields["profile.adminNotes"]}
    >
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          rows={5}
          value={notes}
          disabled={pending || pendingUser !== null}
          onChange={(e) => setNotes(e.target.value)}
          className={cn(
            "w-full rounded-md border border-input bg-surface px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
            invalid && "border-destructive",
          )}
          placeholder="Two years on our React dashboards. Comfortable with hooks; async error handling is shaky."
        />
      )}
    </Field>
  );

  return (
    <div className="max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Onboard a learner</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Creates the account and the setup their placement assessment is built from.
      </p>

      {created && (
        <TemporaryPasswordNotice
          className="mt-6"
          kind="new"
          username={created.username}
          displayName={created.displayName}
          password={created.password}
          onDismiss={() => {
            setCreated(null);
            navigate("/admin/people");
          }}
        />
      )}

      <div className="mt-8">
        {role === "learner" ? (
          <SetupForm
            key={formKey}
            initial={null}
            onSave={saveLearner}
            primaryLabel={pendingUser ? "Save setup & assign assessment" : "Create & assign assessment"}
            secondaryLabel={pendingUser ? "Save setup" : "Create"}
            canSubmit={canSubmit}
            leading={accountFields}
            trailing={notesField}
          />
        ) : (
          <StaffForm
            canSubmit={canSubmit}
            onCreate={async () => {
              const { user, handedOver } = await createAccount(null);
              notify.success(`${user.displayName} can now sign in as an admin.`);
              finish(user, handedOver);
            }}
          >
            {accountFields}
          </StaffForm>
        )}
      </div>
    </div>
  );
}

/** An admin account has no learning setup: just the account fields and one button. */
function StaffForm({
  canSubmit,
  onCreate,
  children,
}: {
  canSubmit: boolean;
  onCreate: () => Promise<void>;
  children: (context: SetupFormContext) => ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending || !canSubmit) return;
    setPending(true);
    setError(null);
    setFields({});
    try {
      await onCreate();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Try again.");
      if (err instanceof ApiRequestError) setFields(err.fields ?? {});
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-3xl space-y-8">
      {error && <FormAlert>{error}</FormAlert>}
      {children({ fields, pending })}
      <Button type="submit" loading={pending} disabled={!canSubmit}>
        Create admin
      </Button>
    </form>
  );
}

function Choice({
  name,
  checked,
  disabled,
  onSelect,
  title,
  body,
}: {
  name: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  title: string;
  body: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-strong",
        checked ? "border-primary bg-primary/5" : "hover:bg-surface-sunken/60",
        disabled && "cursor-default opacity-60",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="mt-1 size-4 accent-[rgb(var(--primary))]"
      />
      <span>
        <span className="text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{body}</span>
      </span>
    </label>
  );
}
