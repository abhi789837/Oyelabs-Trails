import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";

import { ApiRequestError } from "@/api/client";
import { FormAlert, TextField } from "@/components/form/Field";
import { Logo } from "@/components/layout/Logo";
import { Contours } from "@/components/trail/Contours";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "./AuthProvider";
import { landingPathFor } from "./routing";

export default function LoginPage() {
  useDocumentTitle("Sign in");
  const { user, loading, signIn } = useAuth();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  if (!loading && user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from !== "/login" ? from : landingPathFor(user)} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setFields({});
    try {
      await signIn({ username, password });
      // The redirect happens on the next render, once `user` is set.
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        setFields(err.fields ?? {});
      } else {
        setError("Something went wrong. Try again.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <Contours className="text-basalt/[0.14] dark:text-basalt/10" seed={3} rings={14} />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-start">
          <Logo variant="stacked" height={72} />
          <p className="mt-3 font-mono text-xs text-muted-foreground">Internal training</p>
        </div>

        <h1 className="mt-8 text-2xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Accounts are created by your administrator. There is no sign-up.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {error && <FormAlert>{error}</FormAlert>}

          <TextField
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            required
            spellCheck={false}
            autoCapitalize="none"
            value={username}
            error={fields.username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            error={fields.password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" className="w-full" disabled={submitting || !username || !password}>
            {submitting && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-xs text-muted-foreground">
          Forgotten your password? Ask your administrator to reset it — there is no self-service reset.
        </p>
      </div>
    </div>
  );
}
