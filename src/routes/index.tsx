import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, User, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n/I18nProvider";
import { LanguageToggle } from "@/components/LanguageToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "COMPANION" },
      { name: "description", content: "A calm companion for people living with a diagnosis and the people who love them." },
      { property: "og:title", content: "COMPANION" },
      { property: "og:description", content: "A calm companion for people living with a diagnosis and the people who love them." },
    ],
  }),
  component: Welcome,
});

const ROLE_KEY = "companion.signupRole";

function Welcome() {
  const { t } = useT();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          // Already signed in → let the auth layout figure out where to land.
          navigate({ to: "/today", replace: true });
          return;
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  function choose(role: "caregiver" | "patient") {
    try { window.localStorage.setItem(ROLE_KEY, role); } catch {}
    navigate({ to: "/auth", search: { role } as any });
  }

  if (checking) {
    return <div className="min-h-dvh flex items-center justify-center bg-background text-foreground"><p>{t("common.loading")}</p></div>;
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <span className="font-semibold tracking-wide">{t("app.name")}</span>
          <LanguageToggle />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">{t("welcome.title")}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{t("welcome.tagline")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-1">
            <RoleCard
              icon={<Heart className="h-7 w-7" aria-hidden />}
              title={t("welcome.caregiverTitle")}
              desc={t("welcome.caregiverDesc")}
              onClick={() => choose("caregiver")}
            />
            <RoleCard
              icon={<User className="h-7 w-7" aria-hidden />}
              title={t("welcome.patientTitle")}
              desc={t("welcome.patientDesc")}
              onClick={() => choose("patient")}
            />
            <RoleCard
              icon={<Sparkles className="h-7 w-7" aria-hidden />}
              title={t("welcome.demoTitle")}
              desc={t("welcome.demoDesc")}
              onClick={() => alert(t("welcome.demoComingSoon"))}
              muted
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function RoleCard({ icon, title, desc, onClick, muted }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void; muted?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full text-left rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-md active:scale-[0.99] ${muted ? "opacity-80" : ""}`}
      data-touch
    >
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-primary/10 text-primary p-3">{icon}</div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-muted-foreground">{desc}</p>
        </div>
      </div>
    </button>
  );
}
