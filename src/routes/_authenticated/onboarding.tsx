import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useT, type Lang } from "@/i18n/I18nProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { DemoBanner } from "@/components/DemoBanner";
import { completeOnboarding, getMyHousehold } from "@/lib/household.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up — COMPANION" },
      { name: "description", content: "Create your household and patient profile." },
    ],
  }),
  component: Onboarding,
});

type Step = 1 | 2 | 3 | 4 | 5;

function Onboarding() {
  const { t, lang, setLang } = useT();
  const navigate = useNavigate();
  const submitFn = useServerFn(completeOnboarding);
  const getHousehold = useServerFn(getMyHousehold);

  const [step, setStep] = useState<Step>(1);
  const [householdName, setHouseholdName] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<Lang>(lang);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

  const [patientName, setPatientName] = useState("");
  const [patientLanguage, setPatientLanguage] = useState<Lang>(lang);
  const [biography, setBiography] = useState("");
  const [routines, setRoutines] = useState("");

  const [music, setMusic] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [musicDraft, setMusicDraft] = useState("");
  const [triggerDraft, setTriggerDraft] = useState("");

  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if user already has a household.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getHousehold();
      if (!cancelled && res?.household) navigate({ to: "/today", replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [getHousehold, navigate]);

  function next() {
    setError(null);
    if (step === 1) {
      if (!householdName.trim()) return setError(t("onboarding.householdName"));
      if (!/^\d{4}$/.test(pin)) return setError(t("onboarding.pinFormat"));
      if (pin !== pinConfirm) return setError(t("onboarding.pinMismatch"));
    }
    if (step === 2 && !patientName.trim()) return setError(t("onboarding.patientName"));
    setStep((s) => Math.min(5, (s + 1) as Step));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(1, (s - 1) as Step));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      // First create the household so we know the id, then upload photos using that id as prefix.
      // Two-step: (1) call onboarding without photos to get id, (2) upload, (3) we'd insert media.
      // To keep one atomic write, we'll do photos AFTER createHousehold via two server calls:
      //   - Upload directly under family-photos/<household_id>/...
      //   - Then a follow-up insert by re-calling the server fn would double-create.
      // Simplest correct flow: do the household insert first (server fn), then upload from client,
      // then a tiny second server call attaches the media. We piggyback by inserting media client-side
      // since RLS now allows it for the household member.
      const result = await submitFn({
        data: {
          householdName,
          preferredLanguage,
          pin,
          patient: {
            displayName: patientName,
            language: patientLanguage,
            biography,
            dailyRoutines: routines,
            musicPreferences: music,
            knownTriggers: triggers,
          },
          photoPaths: [],
        },
      });

      const householdId = result.householdId;

      // Upload photos and insert media rows (RLS allows the new caregiver).
      const uploadedPaths: string[] = [];
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${householdId}/${crypto.randomUUID()}-${safeName}`;
        const { error: upErr } = await supabase.storage.from("family-photos").upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
        if (upErr) throw new Error(upErr.message);
        uploadedPaths.push(path);
      }
      if (uploadedPaths.length > 0) {
        const rows = uploadedPaths.map((p) => ({
          household_id: householdId,
          storage_path: p,
          kind: "photo",
        }));
        const { error: medErr } = await supabase.from("media").insert(rows);
        if (medErr) throw new Error(medErr.message);
      }

      setLang(preferredLanguage);
      navigate({ to: "/today", replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <DemoBanner />
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <span className="font-semibold">{t("app.name")}</span>
          <LanguageToggle />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-semibold mb-1">{t("onboarding.title")}</h1>
        <p className="text-muted-foreground mb-6">{t("onboarding.step", { n: step, total: 5 })}</p>

        <div className="bg-card border border-border rounded-lg p-6 space-y-5">
          {step === 1 && (
            <>
              <Field label={t("onboarding.householdName")} help={t("onboarding.householdNameHelp")}>
                <input className={inputCls} value={householdName} onChange={(e) => setHouseholdName(e.target.value)} />
              </Field>
              <Field label={t("onboarding.preferredLanguage")}>
                <LanguagePicker value={preferredLanguage} onChange={setPreferredLanguage} t={t} />
              </Field>
              <Field label={t("onboarding.pin")}>
                <input
                  inputMode="numeric"
                  maxLength={4}
                  className={inputCls + " tracking-[0.5em] text-center"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <Field label={t("onboarding.pinConfirm")}>
                <input
                  inputMode="numeric"
                  maxLength={4}
                  className={inputCls + " tracking-[0.5em] text-center"}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold">{t("onboarding.patientHeading")}</h2>
              <Field label={t("onboarding.patientName")}>
                <input className={inputCls} value={patientName} onChange={(e) => setPatientName(e.target.value)} />
              </Field>
              <Field label={t("onboarding.patientLanguage")}>
                <LanguagePicker value={patientLanguage} onChange={setPatientLanguage} t={t} />
              </Field>
              <Field label={t("onboarding.biography")} help={t("onboarding.biographyHelp")}>
                <textarea rows={4} className={inputCls} value={biography} onChange={(e) => setBiography(e.target.value)} />
              </Field>
              <Field label={t("onboarding.dailyRoutines")} help={t("onboarding.routinesHelp")}>
                <textarea rows={4} className={inputCls} value={routines} onChange={(e) => setRoutines(e.target.value)} />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-semibold">{t("onboarding.musicHeading")}</h2>
              <Field label={t("onboarding.music")} help={t("onboarding.musicHelp")}>
                <ChipInput items={music} setItems={setMusic} draft={musicDraft} setDraft={setMusicDraft} t={t} />
              </Field>
              <Field label={t("onboarding.triggers")} help={t("onboarding.triggersHelp")}>
                <ChipInput items={triggers} setItems={setTriggers} draft={triggerDraft} setDraft={setTriggerDraft} t={t} />
              </Field>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-xl font-semibold">{t("onboarding.photosHeading")}</h2>
              <p className="text-muted-foreground">{t("onboarding.photosHelp")}</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className="block"
              />
              {files.length > 0 && (
                <ul className="list-disc pl-5 text-muted-foreground">
                  {files.map((f) => (
                    <li key={f.name}>{f.name}</li>
                  ))}
                </ul>
              )}
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="text-xl font-semibold">{t("onboarding.review")}</h2>
              <ReviewRow label={t("onboarding.householdName")} value={householdName} />
              <ReviewRow
                label={t("onboarding.preferredLanguage")}
                value={preferredLanguage === "en" ? t("common.english") : t("common.spanish")}
              />
              <ReviewRow label={t("onboarding.patientName")} value={patientName} />
              <ReviewRow label={t("onboarding.biography")} value={biography || t("onboarding.noItems")} />
              <ReviewRow label={t("onboarding.dailyRoutines")} value={routines || t("onboarding.noItems")} />
              <ReviewRow label={t("onboarding.music")} value={music.join(", ") || t("onboarding.noItems")} />
              <ReviewRow label={t("onboarding.triggers")} value={triggers.join(", ") || t("onboarding.noItems")} />
              <ReviewRow label={t("onboarding.photosHeading")} value={String(files.length)} />
            </>
          )}

          {error && (
            <p role="alert" className="text-destructive">
              ✕ {error}
            </p>
          )}

          <div className="flex justify-between pt-2">
            <button type="button" onClick={back} disabled={step === 1 || busy} className={btnSecondary} data-touch>
              {t("common.back")}
            </button>
            {step < 5 ? (
              <button type="button" onClick={next} disabled={busy} className={btnPrimary} data-touch>
                {t("common.next")}
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={busy} className={btnPrimary} data-touch>
                {busy ? t("onboarding.submitting") : t("onboarding.submit")}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const inputCls = "w-full px-3 py-3 border border-input rounded-md bg-background";
const btnPrimary = "px-5 py-3 rounded-md bg-primary text-primary-foreground disabled:opacity-50";
const btnSecondary = "px-5 py-3 rounded-md border border-border bg-background disabled:opacity-50";

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-1 font-medium">{label}</span>
      {children}
      {help && <span className="block mt-1 text-muted-foreground">{help}</span>}
    </label>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between border-b border-border py-2 gap-1">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground sm:text-right sm:max-w-[60%]">{value}</span>
    </div>
  );
}

function LanguagePicker({
  value,
  onChange,
  t,
}: {
  value: Lang;
  onChange: (l: Lang) => void;
  t: (k: string) => string;
}) {
  return (
    <div role="radiogroup" className="inline-flex rounded-md border border-border overflow-hidden">
      {(["en", "es"] as Lang[]).map((l) => {
        const active = value === l;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(l)}
            className={"px-4 py-2 " + (active ? "bg-primary text-primary-foreground" : "bg-card")}
            data-touch
          >
            {active ? "● " : "○ "}
            {l === "en" ? t("common.english") : t("common.spanish")}
          </button>
        );
      })}
    </div>
  );
}

function ChipInput({
  items,
  setItems,
  draft,
  setDraft,
  t,
}: {
  items: string[];
  setItems: (v: string[]) => void;
  draft: string;
  setDraft: (v: string) => void;
  t: (k: string) => string;
}) {
  function add() {
    const v = draft.trim();
    if (!v) return;
    if (!items.includes(v)) setItems([...items, v]);
    setDraft("");
  }
  return (
    <div>
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" onClick={add} className={btnSecondary} data-touch>
          {t("onboarding.addItem")}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-muted-foreground">{t("onboarding.noItems")}</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((it) => (
            <li key={it} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
              <span>{it}</span>
              <button
                type="button"
                aria-label={`Remove ${it}`}
                onClick={() => setItems(items.filter((x) => x !== it))}
                className="text-foreground/70"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}