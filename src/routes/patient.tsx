import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Mic, Users, Music, ChevronLeft, ChevronRight, Play, Check, Moon, Smile, MessageCircle, Bell } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import { useMode } from "@/lib/mode-context";
import { PinDialog } from "@/components/PinDialog";
import { verifyHouseholdPin } from "@/lib/household.functions";
import { getPatientBundle, getDueCues } from "@/lib/patient.functions";
import { buildProviderSearchUrl } from "@/lib/music.functions";
import { supabase } from "@/integrations/supabase/client";
import { createDailyLog } from "@/lib/daily-log.functions";
import { listCues } from "@/lib/cues.functions";
import { completePatientSelfOnboarding } from "@/lib/patient-self.functions";
import { getIntendedRole } from "@/lib/intended-role.functions";

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
  const createLog = useServerFn(createDailyLog);
  const listAllCues = useServerFn(listCues);
  const setupPatient = useServerFn(completePatientSelfOnboarding);
  const getIntent = useServerFn(getIntendedRole);

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [view, setView] = useState<"menu" | "people" | "music" | "selfcare">("menu");
  const [selfCare, setSelfCare] = useState<null | "sleep" | "mood" | "bothering" | "reminders">(null);
  const [isPatient, setIsPatient] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
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
      try {
        const intent: any = await getIntent();
        setIsPatient(intent?.role === "patient");
      } catch {}
      try {
        const b: any = await bundleFn();
        setBundle(b);
      } catch (e: any) {
        // Patient signed up but doesn't have a household yet → show setup.
        if (String(e?.message ?? "").toLowerCase().includes("no household")) {
          setNeedsSetup(true);
        } else {
          console.error(e);
        }
      }
    })();
  }, [bundleFn, navigate, getIntent]);

  // Slideshow
  useEffect(() => {
    if (view !== "menu" || !bundle || bundle.photos.length < 2) return;
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

  // Greet once when the bundle first loads (autoplay may be blocked until first interaction)
  useEffect(() => {
    if (!bundle || greetedRef.current) return;
    greetedRef.current = true;
    try {
      if (bundle.greeting_audio_url) {
        const a = new Audio(bundle.greeting_audio_url);
        a.play().catch(() => speak(t("patient.greeting", { name: bundle.name ?? "" }), lang));
      } else {
        speak(t("patient.greeting", { name: bundle.name ?? "" }), lang);
      }
    } catch {}
  }, [bundle, t, lang]);

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
    if (needsSetup) {
      return (
        <PatientSetup
          onDone={async (name, language) => {
            await setupPatient({ data: { displayName: name, language } });
            setNeedsSetup(false);
            try {
              const b: any = await bundleFn();
              setBundle(b);
            } catch (e) { console.error(e); }
          }}
        />
      );
    }
    return <div data-mode="patient" className="min-h-dvh bg-background" />;
  }

  if (view === "menu") {
    const photo = bundle.photos[slide];
    const hasMany = bundle.photos.length > 1;
    const prevPhoto = () => setSlide((i) => (i - 1 + bundle.photos.length) % bundle.photos.length);
    const nextPhoto = () => setSlide((i) => (i + 1) % bundle.photos.length);
    return (
      <div data-mode="patient" className="relative min-h-dvh overflow-hidden">
        {photo && (
          <div
            className="patient-photo-bg photo-crossfade"
            key={photo.id}
            style={{ backgroundImage: `url(${photo.url})` }}
            aria-hidden
          />
        )}
        <div className="patient-scrim" aria-hidden />
        {hasMany && (
          <>
            <button
              type="button"
              onClick={prevPhoto}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 rounded-full p-3 min-h-11 min-w-11 inline-flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.35)", color: "#fff", backdropFilter: "blur(6px)" }}
              data-touch
            >
              <ChevronLeft size={28} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={nextPhoto}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 rounded-full p-3 min-h-11 min-w-11 inline-flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.35)", color: "#fff", backdropFilter: "blur(6px)" }}
              data-touch
            >
              <ChevronRight size={28} strokeWidth={2} />
            </button>
          </>
        )}
        <div
          className="relative z-10 flex min-h-dvh flex-col p-4 sm:p-6"
          style={{
            paddingTop: "max(1rem, env(safe-area-inset-top, 0px))",
            paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
            paddingLeft: "max(1rem, env(safe-area-inset-left, 0px))",
            paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
          }}
        >
          <p className="patient-greeting" style={{ fontSize: "clamp(22pt, 5vw, 40pt)" }}>
            {t("patient.greeting", { name: bundle.name || "" })}
          </p>
          <div className="flex-1" />
          {photo?.caption && (
            <p className="patient-caption text-center mb-6" style={{ fontSize: "clamp(16pt, 3vw, 28pt)" }}>
              {photo.caption}
            </p>
          )}
          <div className="w-full max-w-md sm:max-w-lg lg:max-w-2xl mx-auto flex flex-col gap-4">
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => speak(t("patient.talkPrompt"), lang)}
              className="btn-neo-cream w-full"
              data-touch
            >
              <Mic className="icon" size={32} strokeWidth={1.75} aria-hidden />
              <span>{t("patient.talk")}</span>
            </motion.button>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setView("people")}
                className="btn-neo-cream"
                data-touch
              >
                <Users className="icon" size={32} strokeWidth={1.75} aria-hidden />
                <span>{t("patient.people")}</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => { setMusicIdx(0); setView("music"); }}
                className="btn-neo-cream"
                data-touch
              >
                <Music className="icon" size={32} strokeWidth={1.75} aria-hidden />
                <span>{t("patient.music")}</span>
              </motion.button>
            </div>
            {isPatient && (
              <div className="grid grid-cols-2 gap-4">
                <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => setSelfCare("sleep")} className="btn-neo-cream" data-touch>
                  <Moon className="icon" size={32} strokeWidth={1.75} aria-hidden />
                  <span>{t("self.sleep")}</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => setSelfCare("mood")} className="btn-neo-cream" data-touch>
                  <Smile className="icon" size={32} strokeWidth={1.75} aria-hidden />
                  <span>{t("self.mood")}</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => setSelfCare("bothering")} className="btn-neo-cream" data-touch>
                  <MessageCircle className="icon" size={32} strokeWidth={1.75} aria-hidden />
                  <span>{t("self.bothering")}</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => setSelfCare("reminders")} className="btn-neo-cream" data-touch>
                  <Bell className="icon" size={32} strokeWidth={1.75} aria-hidden />
                  <span>{t("self.reminders")}</span>
                </motion.button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setPinOpen(true)}
              className="mt-4 self-center rounded-2xl px-6 py-3 min-h-11"
              style={{ fontSize: "clamp(13pt, 1.6vw, 18pt)", background: "rgba(255,255,255,0.18)", color: "#fff", backdropFilter: "blur(8px)" }}
              data-touch
            >
              {t("patient.exit")}
            </button>
          </div>
        </div>
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
              className="rounded-2xl bg-primary text-primary-foreground px-8 py-6 text-center inline-flex items-center justify-center gap-3"
              style={{ fontSize: "26pt", minHeight: 120 }}
              data-touch
            >
              <Play size={28} strokeWidth={2} /> {t("patient.openInProvider")}
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
              <ChevronLeft size={28} strokeWidth={2} /> {t("patient.prev")}
            </BigButton>
            <BigButton onClick={() => setMusicIdx((i) => (i + 1) % bundle.music.length)}>
              {t("patient.next")} <ChevronRight size={28} strokeWidth={2} />
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
        className="px-6 py-4 rounded-xl border border-border min-h-11 inline-flex items-center"
        style={{ fontSize: "22pt" }}
        data-touch
      >
        <ChevronLeft size={28} strokeWidth={2} />
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
        className="rounded-2xl bg-primary text-primary-foreground inline-flex items-center justify-center gap-3"
        style={{ minHeight: 160, minWidth: 220, fontSize: "40pt", fontWeight: 700, padding: "1.5rem 2.5rem" }}
        data-touch
      >
        <Check size={40} strokeWidth={2} /> Done
      </button>
    </div>
  );
}