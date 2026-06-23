import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n/I18nProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { DemoBanner } from "@/components/DemoBanner";
import { Logo } from "@/components/Logo";
import { setIntendedRole, getIntendedRole } from "@/lib/intended-role.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — COMPANION Care" },
      { name: "description", content: "Sign in to COMPANION Care." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const setRoleFn = useServerFn(setIntendedRole);
  const getRoleFn = useServerFn(getIntendedRole);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<"caregiver" | "patient" | null>(null);

  useEffect(() => {
    try {
      const r = window.localStorage.getItem("companion.signupRole");
      if (r === "caregiver" || r === "patient") setIntent(r);
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function routeAfterAuth() {
      try {
        // Persist intent (no-op if already set) and then resolve where to land.
        const stored = (() => { try { return window.localStorage.getItem("companion.signupRole"); } catch { return null; } })();
        if (stored === "caregiver" || stored === "patient") {
          try { await setRoleFn({ data: { role: stored } }); } catch {}
        }
        const r = await getRoleFn();
        if (cancelled) return;
        if (r?.role === "patient") navigate({ to: "/patient", replace: true });
        else navigate({ to: "/today", replace: true });
      } catch (e) {
        console.error(e);
        if (!cancelled) navigate({ to: "/today", replace: true });
      }
    }
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!cancelled && data.session) routeAfterAuth();
      } catch (error) {
        console.error(error);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") routeAfterAuth();
    });
    return () => {
      cancelled = true;
      try { sub.subscription.unsubscribe(); } catch {}
    };
  }, [navigate, setRoleFn, getRoleFn]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        setError(error.message);
        return;
      }
      setSent(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign in right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <DemoBanner />
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Logo size={24} />
            <span className="font-semibold truncate">{t("app.name")}</span>
          </div>
          <LanguageToggle />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-card border border-border rounded-lg p-6">
          <h1 className="text-2xl font-semibold mb-1">
            {intent === "patient" ? t("auth.patientTitle") : intent === "caregiver" ? t("auth.caregiverTitle") : t("auth.signInTitle")}
          </h1>
          <p className="text-muted-foreground mb-6">{t("auth.signInSubtitle")}</p>
          {intent && (
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="text-sm underline mb-4 inline-block"
            >
              ← {t("welcome.changeRole")}
            </button>
          )}
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