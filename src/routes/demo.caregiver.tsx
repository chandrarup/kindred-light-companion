import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Music, ListChecks, FileText, MessageCircle, Sparkles, Phone, ChevronRight, BookOpen, Activity, AlertCircle } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import { ROSA, DEMO_LOGS, DEMO_INSIGHTS, DEMO_CUES, DEMO_PHOTOS, DEMO_MUSIC, DEMO_PEOPLE } from "@/lib/demo/data";
import { DemoReminder } from "@/components/demo/DemoReminder";
import { DemoAsk } from "@/components/demo/DemoAsk";
import { DemoComingSoon, type ComingSoonFeature } from "@/components/demo/DemoComingSoon";

export const Route = createFileRoute("/demo/caregiver")({
  component: DemoCaregiver,
});

const COMING_SOON: Record<string, ComingSoonFeature> = {
  voice: {
    name: { en: "Voice log", es: "Registro por voz" },
    oneLiner: { en: "Speak your update — we transcribe and tag it.", es: "Habla tu actualización — transcribimos y etiquetamos." },
    steps: [
      { en: "Tap to record a sentence about today.", es: "Toca para grabar una frase sobre hoy." },
      { en: "We pick out mood, sleep, and any symptoms.", es: "Detectamos ánimo, sueño y síntomas." },
      { en: "Confirm or edit — saved to today's log.", es: "Confirma o edita — guardado al registro de hoy." },
    ],
  },
  episode: {
    name: { en: "Log a difficult moment", es: "Registrar un momento difícil" },
    oneLiner: { en: "Capture what happened, what triggered it, and what helped.", es: "Captura qué pasó, qué lo desencadenó y qué ayudó." },
    steps: [
      { en: "Pick the symptom (agitation, repetition, etc).", es: "Elige el síntoma (agitación, repetición, etc)." },
      { en: "Add the antecedent and outcome.", es: "Agrega el antecedente y el resultado." },
      { en: "We weave it into the pattern engine.", es: "Lo añadimos al motor de patrones." },
    ],
  },
  photos: {
    name: { en: "Photo library", es: "Galería de fotos" },
    oneLiner: { en: "Upload familiar faces. Captions become memory cues.", es: "Sube caras familiares. Las leyendas se vuelven pistas." },
    steps: [
      { en: "Drag in photos from your phone.", es: "Arrastra fotos desde tu teléfono." },
      { en: "Add who, when, where for each.", es: "Agrega quién, cuándo y dónde." },
      { en: "They appear in Patient Mode's slideshow.", es: "Aparecen en el carrusel del Modo Paciente." },
    ],
  },
  learn: {
    name: { en: "Learn library", es: "Biblioteca de aprendizaje" },
    oneLiner: { en: "Short videos and one-tip cards picked from the patterns we see.", es: "Videos cortos y consejos elegidos por los patrones que vemos." },
    steps: [
      { en: "We surface lessons that match this week's logs.", es: "Mostramos lecciones que coinciden con los registros de la semana." },
      { en: "2-minute videos with cited sources.", es: "Videos de 2 min con fuentes citadas." },
      { en: '"I tried this" closes the loop for better picks.', es: '"Lo probé" mejora futuras recomendaciones.' },
    ],
  },
  circle: {
    name: { en: "Care circle", es: "Círculo de cuidado" },
    oneLiner: { en: "Invite family, friends, and the clinician with the right level of access.", es: "Invita a familia, amigos y al médico con el acceso correcto." },
    steps: [
      { en: "Email invite with role: caregiver, family, or clinician.", es: "Invita por correo con un rol: cuidador, familia o médico." },
      { en: "Each role sees only what they need.", es: "Cada rol ve solo lo que necesita." },
      { en: "Clinician sees the read-only summary.", es: "El médico ve el resumen de solo lectura." },
    ],
  },
  summary: {
    name: { en: "Physician summary", es: "Resumen médico" },
    oneLiner: { en: "A one-page snapshot for the next visit.", es: "Un resumen de una página para la próxima visita." },
    steps: [
      { en: "Pick a date range.", es: "Elige un rango de fechas." },
      { en: "We turn logs into counts, trends, and a plain summary.", es: "Convertimos los registros en conteos, tendencias y un resumen claro." },
      { en: "Print or share with the clinician.", es: "Imprime o comparte con el médico." },
    ],
  },
};

function DemoCaregiver() {
  const { t, lang } = useT();
  const L = (lang as "en" | "es") === "es" ? "es" : "en";
  const [preview, setPreview] = useState<ComingSoonFeature | null>(null);

  const today = DEMO_LOGS[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <DemoReminder mode="caregiver" />
      <DemoAsk mode="caregiver" />

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{t("demo.caregiver.today")}</p>
          <h1 className="text-3xl font-semibold">{ROSA.name}</h1>
          <p className="text-sm text-muted-foreground">{ROSA.diagnosis} · {L === "es" ? "diagnosticada hace" : "diagnosed"} {ROSA.diagnosedYears} {L === "es" ? "años" : "years ago"}</p>
        </div>
        <Link to="/demo/patient" className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40">{t("demo.caregiver.openPatient")}</Link>
      </div>

      {/* Today snapshot */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t("demo.caregiver.todayTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{today.notes[L]}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Tag>{L === "es" ? "Ánimo" : "Mood"} {today.mood}/5</Tag>
              <Tag>{L === "es" ? "Sueño" : "Sleep"}: {today.sleep}</Tag>
              {today.symptoms.map((s, i) => <Tag key={i}>{s.name[L]}</Tag>)}
            </div>
          </div>
          <Link to="/demo/logs" className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {t("demo.caregiver.viewPast")} <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* Quick actions (clean, four tiles) */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">{t("demo.caregiver.actions")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ActionTile icon={<MessageCircle />} label={L === "es" ? "Anotación rápida" : "Quick note"} onClick={() => setPreview(COMING_SOON.voice)} />
          <ActionTile icon={<AlertCircle />} label={L === "es" ? "Momento difícil" : "Difficult moment"} onClick={() => setPreview(COMING_SOON.episode)} />
          <ActionTile icon={<Camera />} label={L === "es" ? "Fotos" : "Photos"} onClick={() => setPreview(COMING_SOON.photos)} />
          <ActionTile icon={<BookOpen />} label={L === "es" ? "Aprender" : "Learn"} onClick={() => setPreview(COMING_SOON.learn)} />
        </div>
      </section>

      {/* Surfaced insight */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">{t("demo.caregiver.insights")}</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {DEMO_INSIGHTS.map((ins) => (
            <motion.div key={ins.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-violet-200 bg-violet-50 text-violet-900 p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"><Sparkles size={14} /> {L === "es" ? "Patrón detectado" : "Pattern detected"}</div>
              <h3 className="mt-2 text-lg font-semibold">{ins.title[L]}</h3>
              <p className="mt-1 text-sm">{ins.body[L]}</p>
              <p className="mt-3 text-sm font-medium">{ins.suggestion[L]}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Cues */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">{t("demo.caregiver.cues")}</h2>
        <ul className="grid sm:grid-cols-3 gap-3">
          {DEMO_CUES.map((c) => (
            <li key={c.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-2xl font-semibold">{c.time}</p>
              <p className="mt-1 font-medium">{c.label[L]}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.why[L]}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Care circle */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("demo.caregiver.circle")}</h2>
          <button onClick={() => setPreview(COMING_SOON.circle)} className="text-sm text-primary hover:underline">{L === "es" ? "Invitar" : "Invite"}</button>
        </div>
        <ul className="grid sm:grid-cols-2 gap-2">
          {DEMO_PEOPLE.map((p) => (
            <li key={p.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.relationship[L]}</p>
              </div>
              <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1 text-sm text-primary"><Phone size={14} /> {p.phone}</a>
            </li>
          ))}
        </ul>
      </section>

      {/* Physician summary preview */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold inline-flex items-center gap-2"><FileText size={18} /> {t("demo.caregiver.summaryTitle")}</h2>
          <button onClick={() => setPreview(COMING_SOON.summary)} className="text-sm text-primary hover:underline">{L === "es" ? "Abrir" : "Open"}</button>
        </div>
        <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
          <Stat label={L === "es" ? "Registros" : "Logs"} value={String(DEMO_LOGS.length)} />
          <Stat label={L === "es" ? "Episodios" : "Episodes"} value={String(DEMO_LOGS.reduce((n, l) => n + l.symptoms.length, 0))} />
          <Stat label={L === "es" ? "Sueño promedio" : "Avg. mood"} value={(DEMO_LOGS.reduce((n, l) => n + l.mood, 0) / DEMO_LOGS.length).toFixed(1)} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground italic">{L === "es" ? "Conteos y observaciones — no es un diagnóstico." : "Counts and observations — not a diagnosis."}</p>
      </section>

      {preview && <DemoComingSoon feature={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function ActionTile({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center gap-2 hover:border-primary/40 min-h-[100px]">
      <span className="text-primary [&_svg]:h-6 [&_svg]:w-6">{icon}</span>
      <span className="text-sm font-medium text-center">{label}</span>
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-muted px-2 py-1 text-xs">{children}</span>;
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3 text-center">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
