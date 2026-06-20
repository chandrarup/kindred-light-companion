import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Play, ExternalLink, Phone, Mic, MicOff } from "lucide-react";
import { askCanned, type AskResponse } from "@/lib/demo/data";
import { useT } from "@/i18n/I18nProvider";

type Msg = { role: "user" | "assistant"; text?: string; response?: AskResponse };

const SUGGESTIONS_CAREGIVER = [
  { en: "Why does she get upset in the afternoon?", es: "¿Por qué se molesta por la tarde?" },
  { en: "What helps when she won't calm down?", es: "¿Qué ayuda cuando no se calma?" },
  { en: "She didn't sleep well — what can I do?", es: "No durmió bien — ¿qué puedo hacer?" },
  { en: "What should I tell the doctor?", es: "¿Qué debo decirle al médico?" },
];
const SUGGESTIONS_PATIENT = [
  { en: "Tell me about my music", es: "Cuéntame de mi música" },
  { en: "What was my work?", es: "¿Cuál era mi trabajo?" },
  { en: "Who is María?", es: "¿Quién es María?" },
];

export function DemoAsk({ mode }: { mode: "patient" | "caregiver" }) {
  const { t, lang } = useT();
  const L = (lang as "en" | "es") === "es" ? "es" : "en";
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceErr, setVoiceErr] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;
  const voiceSupported = !!SpeechRecognition;

  useEffect(() => {
    return () => { try { recognitionRef.current?.stop?.(); } catch {} };
  }, []);

  const suggestions = mode === "patient" ? SUGGESTIONS_PATIENT : SUGGESTIONS_CAREGIVER;

  function send(q: string) {
    const text = q.trim();
    if (!text) return;
    const response = askCanned(text, mode);
    setMsgs((m) => [...m, { role: "user", text }, { role: "assistant", response }]);
    setInput("");
  }

  function toggleVoice() {
    setVoiceErr(null);
    if (!voiceSupported) { setVoiceErr(t("demo.ask.micUnsupported")); return; }
    if (listening) { try { recognitionRef.current?.stop(); } catch {} return; }
    const rec = new SpeechRecognition();
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
      setInput((finalText + interim).trim());
    };
    rec.onerror = () => { setListening(false); };
    rec.onend = () => {
      setListening(false);
      const q = finalText.trim();
      if (q) send(q);
    };
    recognitionRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition"
        aria-label={t("demo.ask.open")}
      >
        <MessageCircle size={26} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 sm:inset-auto sm:bottom-24 sm:right-5 sm:w-[380px] sm:max-h-[70vh] sm:rounded-2xl bg-background border border-border shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <p className="font-semibold">{t("demo.ask.title")}</p>
              <p className="text-xs text-muted-foreground">{mode === "patient" ? t("demo.ask.patientMode") : t("demo.ask.caregiverMode")}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="p-1 rounded hover:bg-muted"><X size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {msgs.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t("demo.ask.tryAsking")}</p>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => send(s[L])}
                    className="block w-full text-left text-sm rounded-lg border border-border bg-muted/40 px-3 py-2 hover:bg-muted"
                  >
                    {s[L]}
                  </button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                {m.role === "user" ? (
                  <div className="rounded-2xl bg-primary text-primary-foreground px-3 py-2 max-w-[85%] text-sm">{m.text}</div>
                ) : (
                  <AssistantBubble r={m.response!} L={L} t={t} />
                )}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="border-t border-border p-3 flex flex-col gap-2"
          >
            <div className="flex gap-2">
              <button
                type="button"
                onClick={toggleVoice}
                aria-label={listening ? t("demo.ask.micStop") : t("demo.ask.micStart")}
                aria-pressed={listening}
                className={`shrink-0 rounded-lg px-3 py-2 border ${listening ? "bg-red-500 text-white border-red-500 animate-pulse" : "bg-background border-input hover:bg-muted"}`}
                title={voiceSupported ? (listening ? t("demo.ask.micStop") : t("demo.ask.micStart")) : t("demo.ask.micUnsupported")}
              >
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? t("demo.ask.micListening") : t("demo.ask.placeholder")}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-3 py-2" aria-label="Send"><Send size={16} /></button>
            </div>
            {voiceErr && <p className="text-xs text-muted-foreground">{voiceErr}</p>}
          </form>
        </div>
      )}
    </>
  );
}

function AssistantBubble({ r, L, t }: { r: AskResponse; L: "en" | "es"; t: (k: string) => string }) {
  const tone =
    r.kind === "emergency" ? "border-red-300 bg-red-50 text-red-900" :
    r.kind === "guardrail" ? "border-amber-300 bg-amber-50 text-amber-900" :
    r.kind === "personalized" ? "border-violet-300 bg-violet-50 text-violet-900" :
    r.kind === "educational" ? "border-sky-300 bg-sky-50 text-sky-900" :
    r.kind === "grounded" ? "border-emerald-300 bg-emerald-50 text-emerald-900" :
    "border-border bg-muted/40";

  const tag = t(`demo.ask.tag.${r.kind}`);

  return (
    <div className={`rounded-2xl border px-3 py-2 max-w-[90%] text-sm ${tone}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-1">{tag}</p>
      <p className="whitespace-pre-wrap">{r.text[L]}</p>
      {r.video && (
        <a href={r.video.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline">
          <Play size={12} /> {r.video.label[L]}
        </a>
      )}
      {r.source && (
        <a href={r.source.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline">
          <ExternalLink size={12} /> {r.source.label}
        </a>
      )}
      {r.actions && r.actions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {r.actions.map((a, i) => (
            <a key={i} href={a.phone ? `tel:${a.phone}` : "#"} className="inline-flex items-center gap-1 rounded-md bg-white/70 border border-current/30 px-2 py-1 text-xs font-medium">
              <Phone size={12} /> {a.label[L]}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
