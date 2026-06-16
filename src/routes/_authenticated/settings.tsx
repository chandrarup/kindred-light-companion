import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useT } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — COMPANION" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useT();
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">{t("settings.title")}</h1>

      <section className="space-y-2 mb-6">
        <h2 className="font-medium">{t("settings.language")}</h2>
        <LanguageToggle />
      </section>

      <section className="space-y-2 mb-6">
        <h2 className="font-medium">{t("settings.patientProfile")}</h2>
        <p className="text-sm text-muted-foreground">{t("settings.editPatientProfile")}</p>
        <Link
          to="/onboarding"
          className="inline-block px-4 py-2 rounded-md border border-border bg-card min-h-12"
          data-touch
        >
          {t("intake.dashboard.edit")} →
        </Link>
      </section>

      <section className="space-y-1 opacity-70">
        <h2 className="font-medium">{t("settings.caregiverWellbeing")}</h2>
        <p className="text-sm text-muted-foreground">{t("settings.caregiverWellbeingHelp")}</p>
      </section>
    </AppShell>
  );
}
