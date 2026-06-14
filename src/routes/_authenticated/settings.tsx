import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useT } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — COMPANION" }] }),
  component: () => {
    const { t } = useT();
    return (
      <AppShell>
        <h1 className="text-2xl font-semibold mb-4">{t("settings.title")}</h1>
        <section className="space-y-2">
          <h2 className="font-medium">{t("settings.language")}</h2>
          <LanguageToggle />
        </section>
      </AppShell>
    );
  },
});