import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Users, Music as MusicIcon, ChevronLeft, ChevronRight, Play, Pause, Moon, Smile, MessageCircle, Bell, ArrowRight, Check, X, Volume2, NotebookPen, Sparkles, ClipboardList, Stethoscope } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import { ROSA, DEMO_PHOTOS, DEMO_PEOPLE } from "@/lib/demo/data";
import { demoTalkReply } from "@/lib/demo-talk.functions";
import { PhotoCard } from "@/components/demo/PhotoCard";
import { DemoReminder, DemoShowReminderButton } from "@/components/demo/DemoReminder";
import { DemoAsk } from "@/components/demo/DemoAsk";
import { DemoPatientLogForm } from "@/components/demo/DemoPatientLogForm";
import { DemoEpisodeForm } from "@/components/demo/DemoEpisodeForm";
import { DemoMusicPlayer } from "@/components/demo/DemoMusicPlayer";
import { useDemoEntries } from "@/lib/demo/log-store";
import { DemoComingSoon, type ComingSoonFeature } from "@/components/demo/DemoComingSoon";
import { DemoEmergencyButton } from "@/components/demo/DemoSafety";

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
          {/* Background photo — the emotional centerpiece */}
          <div className={`absolute inset-0 bg-gradient-to-br ${photo.gradient}`}>
            <img
              key={photo.id}
              src={photo.image}
              alt={photo.caption[L]}
              className="absolute inset-0 h-full w-full object-cover motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700"
            />
            {/* Soft scrim only at top and bottom — middle stays clear */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-44 sm:h-56 bg-gradient-to-b from-black/55 via-black/20 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 sm:h-80 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
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
          <div className="relative px-6 pt-3 text-white max-w-3xl mx-auto w-full">
            <div className="inline-flex flex-col rounded-2xl bg-black/35 backdrop-blur px-5 py-3 shadow-md max-w-full">
              <h1 className="text-3xl sm:text-5xl font-semibold leading-tight">
                {t("patient.greeting", { name: ROSA.preferredName })}
              </h1>
              <p className="mt-1 text-base sm:text-xl text-white/90">
                {photo.caption[L]}
              </p>
            </div>
            <DateTimeDisplay L={L} />
          </div>

          {/* Spacer so the photo stays visible in the middle */}
          <div className="relative flex-1" />

          {/* Actions pinned to the bottom — just three primary buttons + one small link */}
          <div className="relative px-4 pb-6 pt-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-3xl mx-auto">
              <BigButton icon={<Mic />} label={t("patient.talk")} onClick={() => setTalkOpen(true)} />
              <BigButton icon={<Users />} label={t("patient.people")} onClick={() => setView("people")} />
              <BigButton icon={<MusicIcon />} label={t("patient.music")} onClick={() => setView("music")} />
            </div>

            <div className="mt-4 max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <button
                type="button"
                onClick={() => setLogOpen(true)}
                className="text-sm sm:text-base text-white/95 inline-flex items-center gap-1.5 rounded-full bg-black/30 hover:bg-black/45 px-4 py-2 backdrop-blur"
              >
                <NotebookPen size={15} /> {L === "es" ? "Apuntar cómo me siento" : "Note how I feel"}
              </button>
              <button
                type="button"
                onClick={() => { setMoreView(null); setMoreOpen(true); }}
                className="text-sm text-white/85 inline-flex items-center gap-1.5 rounded-full bg-black/25 hover:bg-black/40 px-3.5 py-1.5 backdrop-blur"
              >
                <Sparkles size={13} /> {L === "es" ? "Más herramientas" : "More tools"}
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
              openSelfCare={() => { setMoreOpen(false); setMoreView(null); setView("selfcare"); }}
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
      {view === "music" && <DemoMusicPlayer L={L} onBack={() => setView("menu")} />}
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

type TalkTurn = { role: "user" | "assistant"; content: string };

function TalkModal({ L, onClose }: { L: "en" | "es"; onClose: () => void }) {
  const greeting =
    L === "es"
      ? `Hola Rosa, qué bonito escuchar tu voz. ¿Qué tienes en el corazón hoy?`
      : `Hello Rosa, it's so good to hear your voice. What's on your mind today?`;

  const [turns, setTurns] = useState<TalkTurn[]>([{ role: "assistant", content: greeting }]);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [thinking, setThinking] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [draft, setDraft] = useState("");
  const recRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

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
      u.rate = 0.92;
      u.pitch = 1.02;
      window.speechSynthesis.speak(u);
    } catch {/*noop*/}
  }

  // Greet aloud on open (after a small delay so dialog animation is in).
  useEffect(() => {
    const id = setTimeout(() => speak(greeting), 350);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll on new turn
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, thinking, interim]);

  async function sendUserText(userText: string) {
    const trimmed = userText.trim();
    if (!trimmed) return;
    const history = turns.slice(-12); // keep context manageable
    const nextTurns = [...turns, { role: "user" as const, content: trimmed }];
    setTurns(nextTurns);
    setInterim("");
    setThinking(true);
    try {
      const r = await demoTalkReply({ data: { lang: L, history, userText: trimmed } });
      const reply = r.reply;
      setTurns((t) => [...t, { role: "assistant", content: reply }]);
      speak(reply);
    } catch {
      const fb = L === "es"
        ? "Qué bonito escucharte. Cuéntame más, querida."
        : "It's so nice to hear you. Tell me more, dear.";
      setTurns((t) => [...t, { role: "assistant", content: fb }]);
      speak(fb);
    } finally {
      setThinking(false);
    }
  }

  function startListening() {
    if (!supported) { setTextMode(true); return; }
    try { window.speechSynthesis?.cancel(); } catch {/*noop*/}
    const rec = new SR();
    rec.lang = L === "es" ? "es-ES" : "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e: any) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      setInterim((finalText + " " + interimText).trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      const q = finalText.trim();
      if (q) void sendUserText(q);
    };
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
  }

  function stopListening() {
    try { recRef.current?.stop(); } catch {/*noop*/}
    setListening(false);
  }

  useEffect(() => {
    return () => {
      try { recRef.current?.stop(); } catch {/*noop*/}
      try { window.speechSynthesis?.cancel(); } catch {/*noop*/}
    };
  }, []);

  const tapLabel = listening
    ? (L === "es" ? "Escuchando…" : "Listening…")
    : (L === "es" ? "Toca para hablar" : "Tap to talk");

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 flex flex-col" role="dialog" aria-modal="true">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <span className="text-sm text-stone-500">
          {L === "es" ? "Conversación con COMPANION" : "Conversation with COMPANION"}
        </span>
        <button
          onClick={() => { stopListening(); try { window.speechSynthesis?.cancel(); } catch {/*noop*/} onClose(); }}
          aria-label={L === "es" ? "Cerrar" : "Close"}
          className="p-2 rounded-full hover:bg-white/60 text-stone-600"
        >
          <X size={22} />
        </button>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-4 space-y-4 max-w-2xl w-full mx-auto">
        {turns.map((t, i) => (
          <div key={i} className={t.role === "assistant" ? "" : "flex justify-end"}>
            {t.role === "assistant" ? (
              <div className="rounded-3xl bg-white/85 shadow-sm px-5 py-4 max-w-[90%]">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-rose-500 mb-1 inline-flex items-center gap-1">
                  <Volume2 size={12} /> COMPANION
                </p>
                <p className="text-2xl leading-relaxed text-stone-800">{t.content}</p>
              </div>
            ) : (
              <div className="rounded-3xl bg-rose-500 text-white shadow-sm px-5 py-3 max-w-[85%]">
                <p className="text-xl leading-relaxed">{t.content}</p>
              </div>
            )}
          </div>
        ))}
        {interim && listening && (
          <div className="flex justify-end">
            <div className="rounded-3xl bg-rose-200 text-rose-900 px-5 py-3 max-w-[85%] italic">
              <p className="text-xl">{interim}…</p>
            </div>
          </div>
        )}
        {thinking && (
          <div>
            <div className="rounded-3xl bg-white/70 px-5 py-3 inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "0.15s" }} />
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Mic / input */}
      <div className="px-4 pb-6 pt-2 bg-white/40 backdrop-blur">
        {!textMode && (
          <div className="flex flex-col items-center gap-2 max-w-2xl mx-auto">
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              disabled={thinking}
              className={`h-24 w-24 rounded-full inline-flex items-center justify-center shadow-xl transition ${
                listening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-rose-500 text-white hover:scale-105 disabled:opacity-50"
              }`}
              aria-pressed={listening}
              aria-label={tapLabel}
            >
              {listening ? <MicOff size={40} /> : <Mic size={40} />}
            </button>
            <p className="text-base text-stone-600">{tapLabel}</p>
            {supported && (
              <button
                onClick={() => setTextMode(true)}
                className="text-xs text-stone-500 underline"
              >
                {L === "es" ? "Escribir en su lugar" : "Type instead"}
              </button>
            )}
          </div>
        )}
        {textMode && (
          <form
            onSubmit={(e) => { e.preventDefault(); const v = draft; setDraft(""); void sendUserText(v); }}
            className="flex gap-2 max-w-2xl mx-auto"
          >
            <input
              autoFocus
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={L === "es" ? "Escribe lo que quieras decir…" : "Type what you'd like to say…"}
              className="flex-1 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-lg"
            />
            <button
              type="submit"
              disabled={!draft.trim() || thinking}
              className="rounded-2xl bg-rose-500 text-white px-5 font-semibold disabled:opacity-50"
            >
              {L === "es" ? "Enviar" : "Send"}
            </button>
            {supported && (
              <button
                type="button"
                onClick={() => setTextMode(false)}
                aria-label={L === "es" ? "Usar micrófono" : "Use mic"}
                className="rounded-2xl border border-stone-300 px-3"
              >
                <Mic size={20} />
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

function DateTimeDisplay({ L }: { L: "en" | "es" }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const locale = L === "es" ? "es-ES" : "en-US";
  const dateStr = now.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  return (
    <div className="mt-4 inline-flex flex-col rounded-2xl bg-black/30 backdrop-blur px-5 py-3 shadow-md">
      <span className="text-2xl sm:text-3xl font-semibold leading-tight capitalize">{dateStr}</span>
      <span className="text-lg sm:text-xl text-white/90">{timeStr}</span>
    </div>
  );
}

function MoreToolsModal({
  L, view, setView, onClose, openSelfCare,
}: {
  L: "en" | "es";
  view: null | "fullLog" | "reminders" | "visitPrep";
  setView: (v: null | "fullLog" | "reminders" | "visitPrep") => void;
  onClose: () => void;
  openSelfCare: () => void;
}) {
  if (view === "fullLog") {
    return <DemoEpisodeForm source="patient" onClose={onClose} />;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white text-stone-900 shadow-2xl p-5 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {view === "reminders"
              ? (L === "es" ? "Mis recordatorios" : "My reminders")
              : view === "visitPrep"
                ? (L === "es" ? "Para mi cita médica" : "For my doctor visit")
                : (L === "es" ? "Más herramientas" : "More tools")}
          </h3>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-stone-100"><X size={18} /></button>
        </div>

        {view === null && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-stone-600">
              {L === "es"
                ? "Cosas que puedes hacer tú misma."
                : "Things you can do on your own."}
            </p>
            <ToolRow
              icon={<Smile size={20} />}
              title={L === "es" ? "¿Cómo estoy hoy?" : "How am I today"}
              desc={L === "es" ? "Sueño, ánimo, lo que me molesta." : "Sleep, mood, what's bothering me."}
              onClick={openSelfCare}
            />
            <ToolRow
              icon={<ClipboardList size={20} />}
              title={L === "es" ? "Apuntar un episodio (completo)" : "Add a full log entry"}
              desc={L === "es" ? "Paso a paso, como lo hace tu cuidador." : "Step-by-step, the way your caregiver does it."}
              onClick={() => setView("fullLog")}
            />
            <ToolRow
              icon={<Bell size={20} />}
              title={L === "es" ? "Ver mis recordatorios" : "View my reminders"}
              desc={L === "es" ? "Lo que viene hoy." : "What's coming up today."}
              onClick={() => setView("reminders")}
            />
            <ToolRow
              icon={<Stethoscope size={20} />}
              title={L === "es" ? "Prepararme para el médico" : "Prepare for doctor visit"}
              desc={L === "es" ? "Lo que debo llevar y contar." : "What to bring and share."}
              onClick={() => setView("visitPrep")}
            />
            <div className="pt-2 flex justify-center">
              <DemoEmergencyButton L={L} variant="pill" />
            </div>
          </div>
        )}

        {view === "reminders" && (
          <div className="mt-4 space-y-3">
            <button onClick={() => setView(null)} className="text-sm underline">← {L === "es" ? "Atrás" : "Back"}</button>
            <ul className="space-y-2">
              {[
                { time: "8:00 AM", label: L === "es" ? "Desayuno y pastilla matutina" : "Breakfast and morning pill" },
                { time: "12:30 PM", label: L === "es" ? "Agua y comida ligera" : "Water and a light meal" },
                { time: "2:45 PM", label: L === "es" ? "Música — Vicente Fernández" : "Music — Vicente Fernández" },
                { time: "6:00 PM", label: L === "es" ? "Pastilla de la tarde" : "Evening pill" },
                { time: "8:30 PM", label: L === "es" ? "Hora tranquila antes de dormir" : "Quiet time before bed" },
              ].map((r, i) => (
                <li key={i} className="rounded-xl border border-stone-200 bg-stone-50 p-3 flex items-center gap-3">
                  <span className="text-base font-semibold w-20 text-primary">{r.time}</span>
                  <span className="text-base">{r.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {view === "visitPrep" && <VisitPrep L={L} onBack={() => setView(null)} />}
      </div>
    </div>
  );
}

function ToolRow({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border border-stone-200 hover:border-primary/40 hover:bg-stone-50 p-3 flex items-start gap-3"
    >
      <span className="text-primary mt-0.5">{icon}</span>
      <span className="flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-stone-600">{desc}</span>
      </span>
      <ArrowRight size={16} className="text-stone-400 mt-1" />
    </button>
  );
}

function VisitPrep({ L, onBack }: { L: "en" | "es"; onBack: () => void }) {
  const entries = useDemoEntries();
  const dayMs = 7 * 24 * 60 * 60 * 1000;
  const recent = entries.filter((e) => Date.now() - e.createdAt < dayMs);
  const episodes = recent.filter((e) => e.kind === "episode");
  const notes = recent.filter((e) => e.kind === "note");

  return (
    <div className="mt-4 space-y-4">
      <button onClick={onBack} className="text-sm underline">← {L === "es" ? "Atrás" : "Back"}</button>

      <div className="rounded-xl bg-violet-50 border border-violet-200 p-3 text-sm text-violet-900">
        {L === "es"
          ? "Lleva esto a tu cita. COMPANION lo preparó por ti."
          : "Bring this to your appointment. COMPANION put it together for you."}
      </div>

      <section>
        <h4 className="font-semibold mb-2">{L === "es" ? "Lo que he registrado esta semana" : "What I've logged this week"}</h4>
        {recent.length === 0 ? (
          <p className="text-sm text-stone-600">
            {L === "es" ? "Aún no hay registros nuevos esta semana." : "No new entries yet this week."}
          </p>
        ) : (
          <ul className="space-y-2">
            {episodes.map((e) => (
              <li key={e.id} className="rounded-lg border border-stone-200 p-2 text-sm">
                <span className="font-medium">{e.symptom}</span>
                <span className="text-stone-600"> · {e.timeOfDay} · {L === "es" ? "ayudó:" : "helped:"} {e.intervention} → {e.outcome}</span>
              </li>
            ))}
            {notes.map((n) => (
              <li key={n.id} className="rounded-lg border border-stone-200 p-2 text-sm">
                <span className="font-medium">{L === "es" ? "Nota" : "Note"}:</span>{" "}
                <span className="text-stone-700">{n.note || (n.symptom ?? "")}</span>
                {n.sleep && <span className="text-stone-500"> · {L === "es" ? "dormí" : "slept"} {n.sleep}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h4 className="font-semibold mb-2">{L === "es" ? "Preguntas para el médico" : "Questions for the doctor"}</h4>
        <ul className="list-disc pl-5 text-sm space-y-1 text-stone-700">
          <li>{L === "es" ? "¿Es normal que me confunda por las tardes?" : "Is it normal that I get confused in the afternoons?"}</li>
          <li>{L === "es" ? "¿Mis pastillas están bien como están?" : "Are my pills okay the way they are?"}</li>
          <li>{L === "es" ? "¿Qué puedo hacer para dormir mejor?" : "What can I do to sleep better?"}</li>
        </ul>
      </section>

      <section>
        <h4 className="font-semibold mb-2">{L === "es" ? "Mis medicamentos" : "My medications"}</h4>
        <ul className="text-sm space-y-1 text-stone-700">
          <li>Donepezil 10 mg — 1× {L === "es" ? "por la noche" : "at night"}</li>
          <li>Memantine 10 mg — 2× {L === "es" ? "al día" : "daily"}</li>
          <li>Lisinopril 20 mg — 1× {L === "es" ? "por la mañana" : "in the morning"}</li>
        </ul>
      </section>
    </div>
  );
}
