import { useRef, useState } from "react";
import { Mic, Square, Play, Trash2, Volume2, Check } from "lucide-react";
import { useFamiliarVoice, playFamiliarReminder, stopFamiliarVoice } from "@/lib/demo/familiar-voice";

type Lang = "en" | "es";

const T = {
  title: { en: "Reminders play in {name}'s voice", es: "Los recordatorios suenan con la voz de {name}" },
  sub: {
    en: "A familiar voice is more reassuring for Rosa than a generic alert.",
    es: "Una voz familiar tranquiliza más a Rosa que una alerta genérica.",
  },
  enabled: { en: "On", es: "Activado" },
  disabled: { en: "Off", es: "Desactivado" },
  record: { en: "Record voice", es: "Grabar voz" },
  recording: { en: "Recording… tap to stop", es: "Grabando… toca para detener" },
  preview: { en: "Preview", es: "Escuchar" },
  remove: { en: "Remove", es: "Quitar" },
  sample: { en: "Use sample voice", es: "Usar voz de ejemplo" },
  saved: { en: "Voice saved", es: "Voz guardada" },
  scriptHint: {
    en: 'Say something warm like: "Hi Rosa, it\'s María. Just a gentle reminder."',
    es: 'Di algo cálido como: "Hola Rosa, soy María. Solo un recordatorio suave."',
  },
  caregiverName: { en: "Voice name", es: "Nombre de la voz" },
  testReminder: { en: "Test a reminder", es: "Probar un recordatorio" },
  noMic: { en: "Microphone not available — sample voice loaded.", es: "Micrófono no disponible — voz de ejemplo cargada." },
};

// A tiny placeholder "sample voice" generated on the fly: a soft 0.5s tone
// labelled as the caregiver intro. Used only when the user can't record.
function makeSampleClipDataUrl(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const sr = 22050;
      const dur = 0.6;
      const len = Math.floor(sr * dur);
      const buf = new Float32Array(len);
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const env = Math.exp(-3 * t);
        buf[i] = env * (Math.sin(2 * Math.PI * 392 * t) + 0.6 * Math.sin(2 * Math.PI * 523 * t)) * 0.25;
      }
      // WAV header
      const wav = new ArrayBuffer(44 + len * 2);
      const view = new DataView(wav);
      const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
      writeStr(0, "RIFF"); view.setUint32(4, 36 + len * 2, true); writeStr(8, "WAVE");
      writeStr(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
      view.setUint32(24, sr, true); view.setUint32(28, sr * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
      writeStr(36, "data"); view.setUint32(40, len * 2, true);
      let off = 44;
      for (let i = 0; i < len; i++) { const s = Math.max(-1, Math.min(1, buf[i])); view.setInt16(off, s * 0x7fff, true); off += 2; }
      const blob = new Blob([wav], { type: "audio/wav" });
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    } catch { resolve(""); }
  });
}

export function DemoFamiliarVoiceCard({ L }: { L: Lang }) {
  const { clipUrl, setClipUrl, caregiverName, setCaregiverName, enabled, setEnabled } = useFamiliarVoice();
  const [recording, setRecording] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setClipUrl(reader.result as string);
          setJustSaved(true);
          window.setTimeout(() => setJustSaved(false), 2000);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecRef.current = mr;
      mr.start();
      setRecording(true);
      // auto-stop at 10s
      window.setTimeout(() => { if (mr.state === "recording") mr.stop(); setRecording(false); }, 10000);
    } catch {
      const sample = await makeSampleClipDataUrl();
      if (sample) setClipUrl(sample);
      alert(T.noMic[L]);
    }
  };

  const stopRec = () => {
    try { mediaRecRef.current?.stop(); } catch {}
    setRecording(false);
  };

  const loadSample = async () => {
    const sample = await makeSampleClipDataUrl();
    if (sample) {
      setClipUrl(sample);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2000);
    }
  };

  const preview = () => {
    stopFamiliarVoice();
    playFamiliarReminder({
      text: L === "es"
        ? `Hola Rosa, soy ${caregiverName}. Es hora de tomar agua.`
        : `Hi Rosa, it's ${caregiverName}. Time for a sip of water.`,
      lang: L,
      clipUrl,
      enabled,
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="h-10 w-10 rounded-full bg-rose-100 text-rose-700 inline-flex items-center justify-center shrink-0">
            <Volume2 size={20} />
          </span>
          <div>
            <p className="font-semibold leading-tight">{T.title[L].replace("{name}", caregiverName)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{T.sub[L]}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`shrink-0 text-xs rounded-full px-3 py-1 font-medium ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}
        >
          {enabled ? T.enabled[L] : T.disabled[L]}
        </button>
      </div>

      <label className="block text-xs">
        <span className="text-muted-foreground">{T.caregiverName[L]}</span>
        <input
          value={caregiverName}
          onChange={(e) => setCaregiverName(e.target.value || "María")}
          className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        />
      </label>

      <p className="text-xs text-muted-foreground italic">{T.scriptHint[L]}</p>

      <div className="flex flex-wrap gap-2">
        {!recording ? (
          <button
            type="button"
            onClick={startRec}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium"
          >
            <Mic size={16} /> {clipUrl ? (L === "es" ? "Regrabar" : "Re-record") : T.record[L]}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRec}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 text-white px-3 py-2 text-sm font-medium animate-pulse"
          >
            <Square size={16} /> {T.recording[L]}
          </button>
        )}
        {!clipUrl && (
          <button
            type="button"
            onClick={loadSample}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm"
          >
            {T.sample[L]}
          </button>
        )}
        {clipUrl && (
          <>
            <button
              type="button"
              onClick={preview}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <Play size={16} /> {T.testReminder[L]}
            </button>
            <button
              type="button"
              onClick={() => setClipUrl(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
            >
              <Trash2 size={16} /> {T.remove[L]}
            </button>
          </>
        )}
        {justSaved && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
            <Check size={14} /> {T.saved[L]}
          </span>
        )}
      </div>
    </div>
  );
}
