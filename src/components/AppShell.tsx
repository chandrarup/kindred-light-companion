import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Sun,
  Image as ImageIcon,
  PlayCircle,
  Users,
  ClipboardList,
  Settings as SettingsIcon,
  Heart,
} from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import { useMode } from "@/lib/mode-context";
import { LanguageToggle } from "./LanguageToggle";
import { DemoBanner } from "./DemoBanner";
import { PinDialog } from "./PinDialog";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { verifyHouseholdPin } from "@/lib/household.functions";

const navItems = [
  { to: "/today", key: "nav.today", Icon: Sun },
  { to: "/photos", key: "nav.photos", Icon: ImageIcon },
  { to: "/learn", key: "nav.learn", Icon: PlayCircle },
  { to: "/circle", key: "nav.circle", Icon: Users },
  { to: "/summary", key: "nav.summary", Icon: ClipboardList },
  { to: "/settings", key: "nav.settings", Icon: SettingsIcon },
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
            <Heart aria-hidden size={22} strokeWidth={1.75} className="text-primary" />
            <span className="font-semibold tracking-tight">{t("app.name")}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <button
              type="button"
              onClick={handleModeButton}
              className="px-3 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-medium active:scale-[0.97] transition-transform"
              data-touch
              aria-label={mode === "caregiver" ? t("mode.switchToPatient") : t("mode.switchToCaregiver")}
            >
              {mode === "caregiver" ? "→ " + t("mode.patient") : "← " + t("mode.caregiver")}
            </button>
            <button
              type="button"
              onClick={signOut}
              className="px-3 py-2 rounded-xl border border-border bg-background text-sm font-medium"
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
            const { Icon } = item;
            return (
              <li key={item.to} className="relative">
                <Link
                  to={item.to}
                  data-touch
                  aria-current={active ? "page" : undefined}
                  className={
                    "flex flex-col items-center justify-center py-3 gap-1 text-xs transition-colors " +
                    (active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground")
                  }
                >
                  <Icon aria-hidden size={22} strokeWidth={1.75} />
                  <span>{t(item.key)}</span>
                </Link>
                {active && (
                  <motion.span
                    layoutId="nav-active-indicator"
                    aria-hidden
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
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