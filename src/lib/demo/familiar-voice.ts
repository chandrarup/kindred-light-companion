import { useEffect, useState, useCallback } from "react";

const CLIP_KEY = "demo.familiarVoice.clip";
const NAME_KEY = "demo.familiarVoice.name";
const ENABLED_KEY = "demo.familiarVoice.enabled";

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => { for (const fn of listeners) fn(); };

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key);
    if (v == null) return fallback;
    return JSON.parse(v) as T;
  } catch { return fallback; }
}
function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  emit();
}

export function useFamiliarVoice() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const clipUrl = read<string | null>(CLIP_KEY, null);
  const caregiverName = read<string>(NAME_KEY, "María");
  const enabled = read<boolean>(ENABLED_KEY, true);

  return {
    clipUrl,
    caregiverName,
    enabled,
    setClipUrl: useCallback((v: string | null) => write(CLIP_KEY, v), []),
    setCaregiverName: useCallback((v: string) => write(NAME_KEY, v), []),
    setEnabled: useCallback((v: boolean) => write(ENABLED_KEY, v), []),
  };
}

let currentAudio: HTMLAudioElement | null = null;
let currentUtter: SpeechSynthesisUtterance | null = null;

export function stopFamiliarVoice() {
  try { currentAudio?.pause(); currentAudio = null; } catch {}
  try { window.speechSynthesis?.cancel(); currentUtter = null; } catch {}
}

function speakWithTTS(text: string, lang: "en" | "es") {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "es" ? "es-ES" : "en-US";
    u.rate = 0.92;
    u.pitch = 1.05;
    const voices = synth.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith(u.lang.slice(0, 2)) && /female|maria|mónica|monica|paulina|samantha/i.test(v.name)
    ) || voices.find((v) => v.lang.startsWith(u.lang.slice(0, 2)));
    if (preferred) u.voice = preferred;
    currentUtter = u;
    synth.cancel();
    synth.speak(u);
  } catch {}
}

export function playFamiliarReminder(opts: {
  text: string;
  lang: "en" | "es";
  clipUrl?: string | null;
  enabled?: boolean;
}) {
  const { text, lang, clipUrl, enabled = true } = opts;
  if (!enabled) { speakWithTTS(text, lang); return; }
  stopFamiliarVoice();
  if (clipUrl) {
    try {
      const audio = new Audio(clipUrl);
      currentAudio = audio;
      audio.onended = () => speakWithTTS(text, lang);
      audio.onerror = () => speakWithTTS(text, lang);
      audio.play().catch(() => speakWithTTS(text, lang));
      return;
    } catch {
      speakWithTTS(text, lang);
      return;
    }
  }
  speakWithTTS(text, lang);
}
