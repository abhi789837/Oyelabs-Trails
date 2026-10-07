import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { ApiRequestError } from "@/api/client";
import { TextField } from "@/components/form/Field";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "./AuthProvider";
import { AuthFormAlert, CapsLockWarning } from "./AuthFeedback";
import { AuthLayout } from "./AuthLayout";
import { landingPathFor } from "./routing";
import { useCapsLock } from "./useCapsLock";

export default function LoginPage() {
  useDocumentTitle("Sign in");
  const { user, loading, signIn } = useAuth();
  const location = useLocation();
  const caps = useCapsLock();
  /* Set by the account menu's "Sign out" (UserMenu). */
  const signedOut = Boolean((location.state as { signedOut?: boolean } | null)?.signedOut);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Counts rejections rather than storing them: see `AuthFormAlert` for why the count is the key. */
  const [attempt, setAttempt] = useState(0);

  if (!loading && user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from !== "/login" ? from : landingPathFor(user)} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await signIn({ username, password });
      // The redirect happens on the next render, once `user` is set.
    } catch (err) {
      /*
       * One message, whatever went wrong, and never attributed to a field.
       *
       * `/api/auth/login` answers an unknown username and a wrong password with the identical
       * "Invalid username or password." — a malformed body included — precisely so the endpoint
       * cannot be used to find out which usernames exist. The client's job is to relay that
       * string and add nothing: no "check your username", no red border on one of the two inputs,
       * and no branch on the status code. `ApiRequestError.fields` is deliberately ignored here
       * for the same reason, and login is the one screen where that is true.
       */
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Try again.");
      setAttempt((n) => n + 1);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to continue your plan."
      footer="Accounts are created by your administrator, and there is no sign-up. Forgotten your password? Ask your administrator to reset it."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {signedOut && !error ? (
          <p role="status" className="rounded-md border bg-surface px-3 py-2 text-sm text-muted-foreground">
            You&apos;re signed out. See you next time.
          </p>
        ) : null}
        <AuthFormAlert message={error} attempt={attempt} />

        <TextField
          label="Username"
          name="username"
          autoComplete="username"
          autoFocus
          required
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {/*
          A plain password input, not `PasswordField`. The reveal toggle it would bring has the
          accessible name "Show password", which is a second control matching "password" on a form
          that has exactly one — `scripts/ui/screens.mjs` signs in with `getByLabel(/password/i)`
          and resolves it strictly. The toggle earns its place on the change-password screen, where
          people are hand-typing a dictated temporary password into three boxes; here the Caps Lock
          warning below covers what it would have been used for.
        */}
        <div className="space-y-1.5">
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={caps.onKeyEvent}
            onKeyUp={caps.onKeyEvent}
            onBlur={caps.onBlur}
          />
          <CapsLockWarning show={caps.capsLock} />
        </div>

        <Button type="submit" className="w-full" loading={submitting} disabled={!username || !password}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
