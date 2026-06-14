import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useT } from "@/i18n/I18nProvider";
import { getMyHousehold } from "@/lib/household.functions";

export const Route = createFileRoute("/_authenticated/today")({
  head: () => ({ meta: [{ title: "Today — COMPANION" }] }),
  component: Today,
});

function Today() {
  const { t } = useT();
  const navigate = useNavigate();
  const fn = useServerFn(getMyHousehold);
  const [patientName, setPatientName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fn();
      if (cancelled) return;
      if (!res?.household) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
      setPatientName(res.patient?.display_name ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [fn, navigate]);

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-2">{t("today.title")}</h1>
      {patientName && <p className="text-muted-foreground mb-4">— {patientName}</p>}
      <p>{t("today.placeholder")}</p>
    </AppShell>
  );
}