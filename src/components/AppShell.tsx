import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useT } from "@/i18n/I18nProvider";
import { useMode } from "@/lib/mode-context";
import { LanguageToggle } from "./LanguageToggle";
import { DemoBanner } from "./DemoBanner";
import { PinDialog } from "./PinDialog";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { verifyHouseholdPin } from "@/lib/household.functions";

const navItems = [
  { to: "/today", key: "nav.today", icon: "☀" },
  { to: "/photos", key: "nav.photos", icon: "▢" },
  { to: "/learn", key: "nav.learn", icon: "▶" },
  { to: "/circle", key: "nav.circle", icon: "♣" },
  { to: "/summary", key: "nav.summary", icon: "📋" },
  { to: "/settings", key: "nav.settings", icon: "⚙" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useT();
  const { mode, setMode } = useMode();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [pinOpen, setPinOpen] = useState(false);
  const verifyPinFn = useServerFn(verifyHouseholdPin);
  const [night, setNight] = useState(false);

  useEffect(() => {
    const update = () => {
      const h = new Date().getHours();
      setNight(h >= 19 || h < 6);
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  async function handleModeButton() {
    if (mode === "caregiver") {
      // Going INTO patient mode: no PIN required.
      setMode("patient");
      router.navigate({ to: "/patient" });
    } else {
      // Going back to caregiver: require PIN.
      setPinOpen(true);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  }

  return (
    <div
      data-mode="caregiver"
      data-surface="caregiver"
      data-time={night ? "night" : "day"}
      className="min-h-screen flex flex-col"
    >
      <DemoBanner />
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-2xl">◐</span>
            <span className="font-semibold tracking-wide">{t("app.name")}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <button
              type="button"
              onClick={handleModeButton}
              className="px-3 py-2 rounded-md bg-accent text-accent-foreground"
              data-touch
              aria-label={mode === "caregiver" ? t("mode.switchToPatient") : t("mode.switchToCaregiver")}
            >
              {mode === "caregiver" ? "→ " + t("mode.patient") : "← " + t("mode.caregiver")}
            </button>
            <button
              type="button"
              onClick={signOut}
              className="px-3 py-2 rounded-md border border-border bg-background"
              data-touch
            >
              {t("auth.signOut")}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 pb-28">{children}</main>

      <nav
        aria-label="primary"
        className="fixed bottom-0 inset-x-0 border-t border-border bg-card"
      >
        <ul className="mx-auto max-w-3xl grid grid-cols-6">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  data-touch
                  aria-current={active ? "page" : undefined}
                  className={
                    "flex flex-col items-center justify-center py-3 gap-1 " +
                    (active ? "text-primary font-semibold" : "text-muted-foreground")
                  }
                >
                  <span aria-hidden className="text-xl">
                    {item.icon}
                  </span>
                  <span>{t(item.key)}</span>
                  {active && <span aria-hidden className="block h-0.5 w-8 bg-primary" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <PinDialog
        open={pinOpen}
        onCancel={() => setPinOpen(false)}
        onVerify={async (pin) => {
          const res = await verifyPinFn({ data: { pin } });
          if (res.ok) {
            setMode("caregiver");
            setPinOpen(false);
            router.navigate({ to: "/today" });
            return true;
          }
          return false;
        }}
      />
    </div>
  );
}