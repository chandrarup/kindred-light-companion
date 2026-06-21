import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Users, Music as MusicIcon, ChevronLeft, ChevronRight, Play, Pause, Moon, Smile, MessageCircle, Bell, ArrowRight, Check, X, Volume2, NotebookPen, Sparkles, ClipboardList, Stethoscope } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import { ROSA, DEMO_PHOTOS, DEMO_MUSIC, DEMO_PEOPLE, askCanned } from "@/lib/demo/data";
import { PhotoCard } from "@/components/demo/PhotoCard";
import { DemoReminder, DemoShowReminderButton } from "@/components/demo/DemoReminder";
import { DemoAsk } from "@/components/demo/DemoAsk";
import { DemoPatientLogForm } from "@/components/demo/DemoPatientLogForm";
import { DemoEpisodeForm } from "@/components/demo/DemoEpisodeForm";
import { useDemoEntries } from "@/lib/demo/log-store";
import { DemoComingSoon, type ComingSoonFeature } from "@/components/demo/DemoComingSoon";

export const Route = createFileRoute("/demo/patient")({
  component: DemoPatient,
});

type View = "menu" | "people" | "music" | "selfcare";
type SelfCare = null | "sleep" | "mood" | "bothering" | "reminders";

function DemoPatient() {
  const { t, lang } = useT();
  const L = (lang as "en" | "es") === "es" ? "es" : "en";
  const navigate = useNavigate();
  const [view, setView] = useState<View>("menu");
  const [selfCare, setSelfCare] = useState<SelfCare>(null);
  const [slide, setSlide] = useState(0);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [switchStep, setSwitchStep] = useState<0 | 1>(0);
  const [switchA1, setSwitchA1] = useState<boolean | null>(null);
  const [talkOpen, setTalkOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreView, setMoreView] = useState<null | "fullLog" | "reminders" | "visitPrep">(null);

  useEffect(() => {
    if (view !== "menu") return;
    const id = setInterval(() => setSlide((i) => (i + 1) % DEMO_PHOTOS.length), 7000);
    return () => clearInterval(id);
  }, [view]);

  const photo = DEMO_PHOTOS[slide];

  function ack(key: string) {
    setSavedKey(key);
    setTimeout(() => setSavedKey(null), 1800);
  }

  return (
    <div className="relative">
      <DemoReminder mode="patient" />
      <DemoAsk mode="patient" />

      {view === "menu" && (
        <div className="relative min-h-[calc(100dvh-110px)] overflow-hidden flex flex-col">
          {/* Background photo */}
          <div className={`absolute inset-0 bg-gradient-to-br ${photo.gradient}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[12rem] opacity-90" aria-hidden>{photo.emoji}</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>

          {/* Small top utility row: show reminder + switch link */}
          <div className="relative px-4 pt-3 flex justify-between items-center gap-2">
            <DemoShowReminderButton label={L === "es" ? "Mostrar recordatorio" : "Show reminder"} />
            <button
              type="button"
              onClick={() => { setSwitchStep(0); setSwitchA1(null); setSwitchOpen(true); }}
              className="text-xs text-white/85 hover:text-white underline-offset-2 hover:underline inline-flex items-center gap-1 rounded-full bg-black/25 px-3 py-1.5 backdrop-blur"
            >
              {t("demo.patient.switchSmall")} <ArrowRight size={12} />
            </button>
          </div>

          {/* Greeting */}
          <div className="relative px-6 pt-4 text-white">
            <h1 className="text-4xl sm:text-5xl font-semibold drop-shadow">{t("patient.greeting", { name: ROSA.preferredName })}</h1>
            <p className="mt-2 text-lg sm:text-xl drop-shadow text-white/90">{photo.caption[L]}</p>
            <DateTimeDisplay L={L} />
          </div>

          {/* Spacer so the photo stays visible in the middle */}
          <div className="relative flex-1" />

          {/* Actions pinned to the bottom */}
          <div className="relative px-4 pb-6 pt-4">
            <div className="grid grid-cols-3 gap-3 max-w-3xl mx-auto">
              <BigButton icon={<Mic />} label={t("patient.talk")} onClick={() => setTalkOpen(true)} />
              <BigButton icon={<Users />} label={t("patient.people")} onClick={() => setView("people")} />
              <BigButton icon={<MusicIcon />} label={t("patient.music")} onClick={() => setView("music")} />
            </div>

            <div className="mt-4 max-w-3xl mx-auto">
              <button
                type="button"
                onClick={() => setView("selfcare")}
                className="w-full rounded-2xl bg-white/90 text-stone-800 p-4 font-medium text-lg shadow-md inline-flex items-center justify-center gap-2"
              >
                <Smile size={22} /> {t("demo.patient.selfCareOpen")}
              </button>
            </div>

            <div className="mt-3 max-w-3xl mx-auto">
              <button
                type="button"
                onClick={() => setLogOpen(true)}
                className="w-full rounded-2xl bg-white/80 text-stone-800 p-3 font-medium shadow-md inline-flex items-center justify-center gap-2"
              >
                <NotebookPen size={20} /> {L === "es" ? "Apuntar cómo me siento" : "Note how I feel"}
              </button>
            </div>

            <div className="mt-3 max-w-3xl mx-auto flex justify-center">
              <button
                type="button"
                onClick={() => { setMoreView(null); setMoreOpen(true); }}
                className="text-sm text-white/95 inline-flex items-center gap-1.5 rounded-full bg-black/30 hover:bg-black/40 px-4 py-2 backdrop-blur"
              >
                <Sparkles size={14} /> {L === "es" ? "Más herramientas" : "More tools"}
              </button>
            </div>
          </div>

          {talkOpen && <TalkModal L={L} onClose={() => setTalkOpen(false)} />}
          {logOpen && <DemoPatientLogForm onClose={() => setLogOpen(false)} />}
          {moreOpen && (
            <MoreToolsModal
              L={L}
              view={moreView}
              setView={setMoreView}
              onClose={() => { setMoreOpen(false); setMoreView(null); }}
            />
          )}

          {switchOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm px-4" role="dialog" aria-modal="true">
              <div className="w-full max-w-md rounded-2xl bg-white text-stone-900 shadow-2xl p-5">
                <h3 className="text-lg font-semibold">{t("demo.patient.switchConfirm.title")}</h3>
                <p className="mt-1 text-sm text-stone-600">{t("demo.patient.switchConfirm.subtitle")}</p>

                {switchStep === 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-base">{t("demo.patient.switchConfirm.q1")}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => { setSwitchA1(false); setSwitchStep(1); }} className="rounded-xl border border-stone-200 py-2 font-medium hover:bg-stone-50">{t("common.no")}</button>
                      <button onClick={() => { setSwitchA1(true); setSwitchStep(1); }} className="rounded-xl bg-primary text-primary-foreground py-2 font-medium">{t("common.yes")}</button>
                    </div>
                  </div>
                )}
                {switchStep === 1 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-base">{t("demo.patient.switchConfirm.q2")}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setSwitchOpen(false)} className="rounded-xl border border-stone-200 py-2 font-medium hover:bg-stone-50">{t("demo.patient.switchConfirm.cancel")}</button>
                      <button
                        onClick={() => { setSwitchOpen(false); navigate({ to: "/demo/caregiver" }); }}
                        className="rounded-xl bg-primary text-primary-foreground py-2 font-medium inline-flex items-center justify-center gap-1"
                      >
                        <Check size={16} /> {t("demo.patient.switchConfirm.continue")}
                      </button>
                    </div>
                    <p className="text-xs text-stone-500 pt-1">{t("demo.patient.switchNote")}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {view === "people" && <PeopleView L={L} onBack={() => setView("menu")} />}
      {view === "music" && <MusicView L={L} onBack={() => setView("menu")} />}
      {view === "selfcare" && (
        <SelfCareView
          L={L} t={t}
          onBack={() => { setView("menu"); setSelfCare(null); }}
          selected={selfCare} setSelected={setSelfCare}
          ack={ack}
        />
      )}
    </div>
  );
}

function BigButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      type="button"
      onClick={onClick}
      className="rounded-2xl bg-white/95 text-stone-800 px-3 py-5 sm:py-6 flex flex-col items-center gap-2 shadow-lg font-semibold text-base sm:text-lg min-h-[88px]"
    >
      <span className="text-primary [&_svg]:h-7 [&_svg]:w-7">{icon}</span>
      {label}
    </motion.button>
  );
}

function PeopleView({ L, onBack }: { L: "en" | "es"; onBack: () => void }) {
  const { t } = useT();
  const [i, setI] = useState(0);
  const photo = DEMO_PHOTOS[i % DEMO_PHOTOS.length];
  const person = DEMO_PEOPLE[i % DEMO_PEOPLE.length];
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <BackBar onBack={onBack} label={t("patient.people")} />
      <PhotoCard photo={photo} lang={L} />
      <p className="mt-4 text-center text-2xl font-semibold">{person.name}</p>
      <p className="text-center text-muted-foreground">{person.relationship[L]}</p>
      <div className="mt-6 flex justify-between">
        <NavBtn icon={<ChevronLeft />} label={t("patient.prev")} onClick={() => setI((x) => (x - 1 + DEMO_PHOTOS.length) % DEMO_PHOTOS.length)} />
        <NavBtn icon={<ChevronRight />} label={t("patient.next")} onClick={() => setI((x) => (x + 1) % DEMO_PHOTOS.length)} />
      </div>
    </div>
  );
}

function MusicView({ L, onBack }: { L: "en" | "es"; onBack: () => void }) {
  const { t } = useT();
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function toggle(id: string, url: string) {
    const a = audioRef.current;
    if (!a) return;
    if (playing === id) {
      a.pause();
      setPlaying(null);
      return;
    }
    a.src = url;
    a.play().then(() => setPlaying(id)).catch(() => setPlaying(null));
  }

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <BackBar onBack={onBack} label={t("patient.music")} />
      <audio ref={audioRef} onEnded={() => setPlaying(null)} preload="none" />
      <ul className="space-y-3">
        {DEMO_MUSIC.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => toggle(m.id, m.url)}
              className={`w-full text-left rounded-2xl border p-4 flex items-center gap-4 ${playing === m.id ? "border-primary bg-primary/10" : "border-border bg-card"}`}
            >
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center">
                {playing === m.id ? <Pause size={22} /> : <Play size={22} />}
              </div>
              <div>
                <p className="text-lg font-semibold">{m.title}</p>
                <p className="text-muted-foreground">{m.artist}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
      {playing && (
        <p className="mt-4 text-center text-muted-foreground inline-flex items-center justify-center gap-2 w-full">
          <Volume2 size={16} /> {L === "es" ? "Reproduciendo música de muestra" : "Playing sample track"}…
        </p>
      )}
    </div>
  );
}

function NavBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-lg">
      {icon}{label}
    </button>
  );
}

function BackBar({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <button type="button" onClick={onBack} className="text-sm underline">← Back</button>
      <span className="font-semibold">{label}</span>
      <span />
    </div>
  );
}

function SelfCareView({ L, t, onBack, selected, setSelected, ack }: { L: "en" | "es"; t: (k: string, v?: any) => string; onBack: () => void; selected: SelfCare; setSelected: (s: SelfCare) => void; ack: (k: string) => void }) {
  const [bothering, setBothering] = useState("");
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <BackBar onBack={onBack} label={t("demo.patient.selfCare")} />
      {!selected && (
        <div className="grid grid-cols-2 gap-3">
          <Card onClick={() => setSelected("sleep")} icon={<Moon />} label={t("self.sleep")} />
          <Card onClick={() => setSelected("mood")} icon={<Smile />} label={t("self.mood")} />
          <Card onClick={() => setSelected("bothering")} icon={<MessageCircle />} label={t("self.bothering")} />
          <Card onClick={() => setSelected("reminders")} icon={<Bell />} label={t("self.reminders")} />
        </div>
      )}

      {selected === "sleep" && (
        <SelfChoice prompt={t("self.sleepPrompt")} options={[t("self.well"), t("self.okay"), t("self.poorly")]} onPick={() => { ack("sleep"); setSelected(null); }} />
      )}
      {selected === "mood" && (
        <SelfChoice prompt={t("self.moodPrompt")} options={[t("self.good"), t("self.okay"), t("self.notGreat")]} onPick={() => { ack("mood"); setSelected(null); }} />
      )}
      {selected === "bothering" && (
        <div className="space-y-3">
          <p className="text-xl">{t("self.botheringPrompt")}</p>
          <textarea value={bothering} onChange={(e) => setBothering(e.target.value)} placeholder={t("self.botheringPlaceholder")} className="w-full rounded-xl border border-input bg-background p-3 text-lg min-h-[140px]" />
          <button onClick={() => { ack("bothering"); setBothering(""); setSelected(null); }} className="w-full rounded-2xl bg-primary text-primary-foreground py-4 text-lg font-medium">{t("self.save")}</button>
        </div>
      )}
      {selected === "reminders" && (
        <ul className="space-y-3">
          {[{ time: "8:00 AM", label: L === "es" ? "Desayuno y pastilla matutina" : "Breakfast and morning pill" },
            { time: "2:45 PM", label: L === "es" ? "Música — Vicente Fernández" : "Music — Vicente Fernández" },
            { time: "8:30 PM", label: L === "es" ? "Hora tranquila antes de dormir" : "Quiet time before bed" }].map((r, i) => (
            <li key={i} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4">
              <span className="text-2xl font-semibold w-24">{r.time}</span>
              <span className="text-lg">{r.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Card({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} type="button" className="rounded-2xl border border-border bg-card p-5 flex flex-col items-center gap-2 shadow-sm hover:border-primary/40 min-h-[120px]">
      <span className="text-primary [&_svg]:h-8 [&_svg]:w-8">{icon}</span>
      <span className="text-lg font-semibold text-center">{label}</span>
    </button>
  );
}

function SelfChoice({ prompt, options, onPick }: { prompt: string; options: string[]; onPick: () => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xl">{prompt}</p>
      <div className="grid gap-3">
        {options.map((o, i) => (
          <button key={i} onClick={onPick} className="rounded-2xl border border-border bg-card py-4 text-lg font-medium hover:border-primary/40">{o}</button>
        ))}
      </div>
    </div>
  );
}

function TalkModal({ L, onClose }: { L: "en" | "es"; onClose: () => void }) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  const SR =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;
  const supported = !!SR;

  function speak(text: string) {
    try {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = L === "es" ? "es-ES" : "en-US";
      u.rate = 0.95;
      u.pitch = 1;
      window.speechSynthesis.speak(u);
    } catch {}
  }

  function handleTranscript(q: string) {
    setHeard(q);
    const r = askCanned(q, "patient");
    const text = r.text[L];
    setReply(text);
    speak(text);
  }

  function start() {
    setErr(null);
    setReply(null);
    setHeard("");
    if (!supported) {
      setErr(L === "es" ? "Tu navegador no permite la voz. Probaremos con texto." : "Voice isn't available in this browser.");
      return;
    }
    const rec = new SR();
    rec.lang = L === "es" ? "es-ES" : "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setHeard((finalText + interim).trim());
    };
    rec.onerror = () => { setListening(false); };
    rec.onend = () => {
      setListening(false);
      const q = finalText.trim();
      if (q) handleTranscript(q);
    };
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
  }

  function stop() {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  }

  useEffect(() => {
    return () => {
      try { recRef.current?.stop(); } catch {}
      try { window.speechSynthesis?.cancel(); } catch {}
    };
  }, []);

  const tapLabel = listening
    ? (L === "es" ? "Escuchando…" : "Listening…")
    : (L === "es" ? "Toca para hablar" : "Tap to talk");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white text-stone-900 shadow-2xl p-6 relative">
        <button onClick={() => { stop(); onClose(); }} aria-label="Close" className="absolute right-3 top-3 p-1 rounded hover:bg-stone-100">
          <X size={18} />
        </button>
        <h3 className="text-xl font-semibold text-center">
          {L === "es" ? "Hablar con COMPANION" : "Talk with COMPANION"}
        </h3>
        <p className="mt-1 text-center text-sm text-stone-500">
          {L === "es" ? "Habla en español o inglés." : "Speak in English or Spanish."}
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={listening ? stop : start}
            className={`h-24 w-24 rounded-full inline-flex items-center justify-center shadow-lg transition ${
              listening ? "bg-red-500 text-white animate-pulse" : "bg-primary text-primary-foreground hover:scale-105"
            }`}
            aria-pressed={listening}
          >
            {listening ? <MicOff size={36} /> : <Mic size={36} />}
          </button>
          <p className="text-sm text-stone-600">{tapLabel}</p>
        </div>

        {heard && (
          <div className="mt-5 rounded-xl bg-stone-100 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide font-semibold text-stone-500 mb-1">
              {L === "es" ? "Tú dijiste" : "You said"}
            </p>
            <p className="text-base">{heard}</p>
          </div>
        )}

        {reply && (
          <div className="mt-3 rounded-xl bg-violet-50 border border-violet-200 text-violet-900 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide font-semibold opacity-70 mb-1 inline-flex items-center gap-1">
              <Volume2 size={12} /> COMPANION
            </p>
            <p className="text-base">{reply}</p>
          </div>
        )}

        {err && <p className="mt-3 text-sm text-amber-700">{err}</p>}

        {!supported && (
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              placeholder={L === "es" ? "Escribe lo que quieras decir…" : "Type what you'd like to say…"}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v) { handleTranscript(v); (e.target as HTMLInputElement).value = ""; }
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
