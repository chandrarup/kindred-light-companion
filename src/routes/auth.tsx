import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n/I18nProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { DemoBanner } from "@/components/DemoBanner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — COMPANION" },
      { name: "description", content: "Sign in to COMPANION." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancelled && data.session) navigate({ to: "/today", replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <DemoBanner />
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-xl px-4 py-3 flex items-center justify-between">
          <span className="font-semibold">{t("app.name")}</span>
          <LanguageToggle />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-card border border-border rounded-lg p-6">
          <h1 className="text-2xl font-semibold mb-1">{t("auth.signInTitle")}</h1>
          <p className="text-muted-foreground mb-6">{t("auth.signInSubtitle")}</p>
          {sent ? (
            <p role="status" className="text-foreground">
              ✓ {t("auth.linkSent")}
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="block mb-1">{t("auth.emailLabel")}</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-3 border border-input rounded-md bg-background"
                  autoComplete="email"
                />
              </label>
              {error && (
                <p role="alert" className="text-destructive">
                  ✕ {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                data-touch
              >
                {busy ? t("common.loading") : t("auth.sendLink")}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}