import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useT } from "@/i18n/I18nProvider";
import { useMode } from "@/lib/mode-context";
import { PinDialog } from "@/components/PinDialog";
import { getMyHousehold, verifyHouseholdPin } from "@/lib/household.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/patient")({
  head: () => ({ meta: [{ title: "Patient — COMPANION" }] }),
  component: PatientPage,
});

function PatientPage() {
  const { t } = useT();
  const { setMode } = useMode();
  const navigate = useNavigate();
  const getHousehold = useServerFn(getMyHousehold);
  const verifyPinFn = useServerFn(verifyHouseholdPin);
  const [name, setName] = useState<string>("");
  const [pinOpen, setPinOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      const res = await getHousehold();
      setName(res?.patient?.display_name ?? "");
    })();
  }, [getHousehold, navigate]);

  return (
    <div
      data-mode="patient"
      className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-8 text-center"
    >
      <p className="mb-6" style={{ fontSize: "32pt", fontWeight: 600 }}>
        {t("patient.greeting", { name: name || "…" })}
      </p>
      <p className="mb-12 text-muted-foreground" style={{ fontSize: "24pt", maxWidth: "32ch" }}>
        {t("patient.subtitle")}
      </p>
      <button
        type="button"
        onClick={() => setPinOpen(true)}
        data-touch
        className="px-8 py-6 rounded-lg bg-primary text-primary-foreground"
      >
        {t("patient.exit")}
      </button>
      <PinDialog
        open={pinOpen}
        onCancel={() => setPinOpen(false)}
        onVerify={async (pin) => {
          const res = await verifyPinFn({ data: { pin } });
          if (res.ok) {
            setMode("caregiver");
            setPinOpen(false);
            navigate({ to: "/today" });
            return true;
          }
          return false;
        }}
      />
    </div>
  );
}