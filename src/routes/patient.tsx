import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useT } from "@/i18n/I18nProvider";
import { useMode } from "@/lib/mode-context";
import { PinDialog } from "@/components/PinDialog";
import { verifyHouseholdPin } from "@/lib/household.functions";
import { getPatientBundle, getDueCues } from "@/lib/patient.functions";
import { buildProviderSearchUrl } from "@/lib/music.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/patient")({
  head: () => ({ meta: [{ title: "Patient — COMPANION" }] }),
  component: PatientPage,
});

type Photo = { id: string; caption: string | null; url: string; audio_url: string | null };
type Bundle = { name: string; language: string; music: string[]; music_provider: string | null; greeting_audio_url: string | null; photos: Photo[] };

function speak(text: string, lang = "en-US") {
  try {
    if (!("speechSynthesis" in window) || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

function PatientPage() {
  const { t } = useT();
  const { setMode } = useMode();
  const navigate = useNavigate();
  const bundleFn = useServerFn(getPatientBundle);
  const cuesFn = useServerFn(getDueCues);
  const verifyPinFn = useServerFn(verifyHouseholdPin);

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [view, setView] = useState<"idle" | "menu" | "people" | "music">("idle");
  const [slide, setSlide] = useState(0);
  const [pinOpen, setPinOpen] = useState(false);
  const [cue, setCue] = useState<{ id: string; label: string } | null>(null);
  const [musicIdx, setMusicIdx] = useState(0);
  const greetedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      const b: any = await bundleFn();
      setBundle(b);
    })();
  }, [bundleFn, navigate]);

  // Slideshow
  useEffect(() => {
    if (view !== "idle" || !bundle || bundle.photos.length < 2) return;
    const id = setInterval(() => setSlide((i) => (i + 1) % bundle.photos.length), 7000);
    return () => clearInterval(id);
  }, [view, bundle]);

  // Poll cues every minute
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const r: any = await cuesFn();
        if (cancelled) return;
        const now = new Date();
        const hhmm = now.toTimeString().slice(0, 5);
        const today = now.getDay();
        const due = (r.cues ?? []).find((c: any) => {
          const times: string[] = c.schedule_times ?? [];
          const days: number[] = c.days_of_week ?? [0, 1, 2, 3, 4, 5, 6];
          if (!days.includes(today)) return false;
          return times.some((tm) => tm.slice(0, 5) === hhmm);
        });
        if (due) setCue({ id: due.id, label: due.label });
      } catch {}
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [cuesFn]);

  const lang = bundle?.language === "es" ? "es-ES" : "en-US";

  const wake = useCallback(() => {
    if (view !== "idle") return;
    setView("menu");
    if (!greetedRef.current) {
      greetedRef.current = true;
      if (bundle?.greeting_audio_url) {
        const a = new Audio(bundle.greeting_audio_url);
        a.play().catch(() => speak(t("patient.greeting", { name: bundle?.name ?? "" }), lang));
      } else {
        speak(t("patient.greeting", { name: bundle?.name ?? "" }), lang);
      }
    }
  }, [view, bundle, t, lang]);

  // Wake on touch/voice (any keypress in this view)
  useEffect(() => {
    if (view !== "idle") return;
    const onAny = () => wake();
    window.addEventListener("keydown", onAny);
    return () => window.removeEventListener("keydown", onAny);
  }, [view, wake]);

  // CUE overlay (takes precedence)
  if (cue) {
    return (
      <FullScreenCue
        label={cue.label}
        lang={lang}
        onDone={() => setCue(null)}
      />
    );
  }

  if (!bundle) {
    return <div data-mode="patient" className="min-h-dvh bg-background" />;
  }

  if (view === "idle") {
    const photo = bundle.photos[slide];
    return (
      <button
        data-mode="patient"
        type="button"
        onClick={wake}
        aria-label={t("patient.wake")}
        className="min-h-dvh w-full bg-background text-foreground flex flex-col items-center justify-center p-6 text-center"
      >
        {photo ? (
          <>
            <img
              src={photo.url}
              alt={photo.caption ?? ""}
              className="max-h-[70vh] max-w-full rounded-2xl object-cover shadow-xl"
            />
            {photo.caption && (
              <p className="mt-6" style={{ fontSize: "32pt", fontWeight: 600 }}>
                {photo.caption}
              </p>
            )}
          </>
        ) : (
          <p style={{ fontSize: "32pt", fontWeight: 600 }}>
            {t("patient.greeting", { name: bundle.name || "…" })}
          </p>
        )}
      </button>
    );
  }

  if (view === "menu") {
    return (
      <div data-mode="patient" className="min-h-dvh bg-background text-foreground flex flex-col items-center justify-center p-6 gap-6">
        <p className="mb-2 text-center" style={{ fontSize: "32pt", fontWeight: 600 }}>
          {t("patient.greeting", { name: bundle.name || "" })}
        </p>
        <div className="grid gap-6 w-full max-w-md">
          <BigButton onClick={() => speak(t("patient.talkPrompt"), lang)}>{t("patient.talk")}</BigButton>
          <BigButton onClick={() => setView("people")}>{t("patient.people")}</BigButton>
          <BigButton onClick={() => { setMusicIdx(0); setView("music"); }}>{t("patient.music")}</BigButton>
        </div>
        <button
          type="button"
          onClick={() => setPinOpen(true)}
          className="mt-8 px-6 py-4 rounded-lg border border-border min-h-11"
          style={{ fontSize: "18pt" }}
          data-touch
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

  if (view === "people") {
    return (
      <div data-mode="patient" className="min-h-dvh bg-background text-foreground p-6">
        <BackBar onBack={() => setView("menu")} label={t("patient.people")} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
          {bundle.photos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                if (p.audio_url) {
                  const a = new Audio(p.audio_url);
                  a.play().catch(() => speak(p.caption ?? "", lang));
                } else {
                  speak(p.caption ?? "", lang);
                }
              }}
              className="flex flex-col items-center gap-2 rounded-2xl bg-card p-3 active:scale-95 transition min-h-32"
              data-touch
              aria-label={p.caption ?? "person"}
            >
              <img src={p.url} alt={p.caption ?? ""} className="w-full aspect-square rounded-xl object-cover" />
              <span style={{ fontSize: "22pt", fontWeight: 600 }} className="text-center">{p.caption ?? ""}</span>
            </button>
          ))}
          {bundle.photos.length === 0 && <p style={{ fontSize: "22pt" }}>{t("patient.noPeople")}</p>}
        </div>
      </div>
    );
  }

  // music
  const currentSong = bundle.music[musicIdx];
  const isUrl = currentSong && /^https?:\/\//i.test(currentSong);
  const providerUrl = !isUrl ? buildProviderSearchUrl(bundle.music_provider, currentSong ?? "") : null;
  return (
    <div data-mode="patient" className="min-h-dvh bg-background text-foreground p-6 flex flex-col">
      <BackBar onBack={() => setView("menu")} label={t("patient.music")} />
      {bundle.music.length === 0 ? (
        <p className="mt-12 text-center" style={{ fontSize: "26pt" }}>{t("patient.noMusic")}</p>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <p className="text-center" style={{ fontSize: "32pt", fontWeight: 600 }}>{currentSong}</p>
          {isUrl ? (
            <audio ref={audioRef} src={currentSong} controls autoPlay className="w-full max-w-md" />
          ) : providerUrl ? (
            <a
              href={providerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-primary text-primary-foreground px-8 py-6 text-center"
              style={{ fontSize: "26pt", minHeight: 120 }}
              data-touch
            >
              ▶ {t("patient.openInProvider")}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => speak(currentSong, lang)}
              className="rounded-2xl bg-primary text-primary-foreground px-8 py-6"
              style={{ fontSize: "26pt", minHeight: 120 }}
              data-touch
            >
              {t("patient.playTitle")}
            </button>
          )}
          <div className="flex gap-4">
            <BigButton onClick={() => setMusicIdx((i) => (i - 1 + bundle.music.length) % bundle.music.length)}>
              ‹ {t("patient.prev")}
            </BigButton>
            <BigButton onClick={() => setMusicIdx((i) => (i + 1) % bundle.music.length)}>
              {t("patient.next")} ›
            </BigButton>
          </div>
        </div>
      )}
    </div>
  );
}

function BigButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl bg-primary text-primary-foreground active:scale-95 transition flex items-center justify-center"
      style={{ minHeight: 120, fontSize: "32pt", fontWeight: 700 }}
      data-touch
    >
      {children}
    </button>
  );
}

function BackBar({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="px-6 py-4 rounded-lg border border-border min-h-11"
        style={{ fontSize: "22pt" }}
        data-touch
      >
        ‹
      </button>
      <h2 style={{ fontSize: "26pt", fontWeight: 600 }}>{label}</h2>
      <span className="w-12" aria-hidden />
    </div>
  );
}

function FullScreenCue({ label, lang, onDone }: { label: string; lang: string; onDone: () => void }) {
  useEffect(() => {
    speak(label, lang);
  }, [label, lang]);
  return (
    <div data-mode="patient" className="min-h-dvh bg-background text-foreground p-8 flex flex-col items-center justify-center gap-8 text-center" role="alertdialog" aria-label={label}>
      <p style={{ fontSize: "40pt", fontWeight: 700 }}>{label}</p>
      <button
        type="button"
        onClick={onDone}
        className="rounded-2xl bg-primary text-primary-foreground"
        style={{ minHeight: 160, minWidth: 220, fontSize: "40pt", fontWeight: 700, padding: "1.5rem 2.5rem" }}
        data-touch
      >
        ✓ Done
      </button>
    </div>
  );
}