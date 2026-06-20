import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Image as ImageIcon, PlayCircle, Users, ClipboardList, Settings as SettingsIcon, FileText, Phone, ChevronRight, Sparkles, AlertCircle, MessageCircle, Camera, BookOpen } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import { ROSA, DEMO_LOGS, DEMO_INSIGHTS, DEMO_CUES, DEMO_PHOTOS, DEMO_MUSIC, DEMO_PEOPLE } from "@/lib/demo/data";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
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

type TabKey = "today" | "photos" | "learn" | "circle" | "summary" | "settings";

function DemoCaregiver() {
  const { t, lang } = useT();
  const L = (lang as "en" | "es") === "es" ? "es" : "en";
  const [preview, setPreview] = useState<ComingSoonFeature | null>(null);
  const [tab, setTab] = useState<TabKey>("today");

  const tabs: { key: TabKey; label: string; Icon: any }[] = [
    { key: "today",    label: t("nav.today"),    Icon: Sun },
    { key: "photos",   label: t("nav.photos"),   Icon: ImageIcon },
    { key: "learn",    label: t("nav.learn"),    Icon: PlayCircle },
    { key: "circle",   label: t("nav.circle"),   Icon: Users },
    { key: "summary",  label: t("nav.summary"),  Icon: ClipboardList },
    { key: "settings", label: t("nav.settings"), Icon: SettingsIcon },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100dvh-90px)]">
      <DemoReminder mode="caregiver" />
      <DemoAsk mode="caregiver" />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 lg:border-r lg:border-border lg:bg-card">
        <div className="px-5 py-5 border-b border-border">
          <p className="text-xs text-muted-foreground">{t("demo.caregiver.today")}</p>
          <p className="font-semibold">{ROSA.name}</p>
        </div>
        <ul className="flex-1 px-3 py-4 space-y-1">
          {tabs.map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => setTab(key)}
                  aria-current={active ? "page" : undefined}
                  className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors " + (active ? "bg-accent/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
                >
                  <Icon aria-hidden size={20} strokeWidth={1.75} />
                  <span>{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="px-3 py-4 border-t border-border">
          <Link to="/demo/patient" className="block text-center rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium hover:border-primary/40">{t("demo.caregiver.openPatient")}</Link>
        </div>
      </aside>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 pb-28 lg:pb-10">
        {tab === "today" && <TodayTab L={L} t={t} setPreview={setPreview} />}
        {tab === "photos" && <PhotosTab L={L} setPreview={setPreview} />}
        {tab === "learn" && <LearnTab L={L} setPreview={setPreview} />}
        {tab === "circle" && <CircleTab L={L} setPreview={setPreview} />}
        {tab === "summary" && <SummaryTab L={L} setPreview={setPreview} />}
        {tab === "settings" && <SettingsTab L={L} />}
      </main>

      {/* Mobile bottom tab bar */}
      <nav aria-label="primary" className="fixed bottom-0 inset-x-0 z-20 border-t border-border bg-card lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <ul className="mx-auto max-w-3xl grid grid-cols-6 px-1">
          {tabs.map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <li key={key} className="relative">
                <button
                  type="button"
                  onClick={() => setTab(key)}
                  aria-current={active ? "page" : undefined}
                  className={"w-full flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] sm:text-xs leading-tight transition-colors min-w-0 " + (active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground")}
                >
                  <Icon aria-hidden size={22} strokeWidth={1.75} />
                  <span className="truncate max-w-full px-0.5">{label}</span>
                </button>
                {active && (
                  <motion.span layoutId="demo-nav-indicator" aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-primary" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {preview && <DemoComingSoon feature={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function TodayTab({ L, t, setPreview }: { L: "en" | "es"; t: (k: string) => string; setPreview: (f: ComingSoonFeature) => void }) {
  const today = DEMO_LOGS[0];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 lg:hidden">
        <div>
          <p className="text-sm text-muted-foreground">{t("demo.caregiver.today")}</p>
          <h1 className="text-3xl font-semibold">{ROSA.name}</h1>
          <p className="text-sm text-muted-foreground">{ROSA.diagnosis} · {L === "es" ? "diagnosticada hace" : "diagnosed"} {ROSA.diagnosedYears} {L === "es" ? "años" : "years ago"}</p>
        </div>
        <Link to="/demo/patient" className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40">{t("demo.caregiver.openPatient")}</Link>
      </div>

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

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">{t("demo.caregiver.actions")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ActionTile icon={<MessageCircle />} label={L === "es" ? "Anotación rápida" : "Quick note"} onClick={() => setPreview(COMING_SOON.voice)} />
          <ActionTile icon={<AlertCircle />} label={L === "es" ? "Momento difícil" : "Difficult moment"} onClick={() => setPreview(COMING_SOON.episode)} />
          <ActionTile icon={<Camera />} label={L === "es" ? "Fotos" : "Photos"} onClick={() => setPreview(COMING_SOON.photos)} />
          <ActionTile icon={<BookOpen />} label={L === "es" ? "Aprender" : "Learn"} onClick={() => setPreview(COMING_SOON.learn)} />
        </div>
      </section>

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
    </div>
  );
}

function PhotosTab({ L, setPreview }: { L: "en" | "es"; setPreview: (f: ComingSoonFeature) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{L === "es" ? "Galería" : "Photos"}</h2>
        <button onClick={() => setPreview(COMING_SOON.photos)} className="text-sm text-primary hover:underline">{L === "es" ? "Subir" : "Upload"}</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {DEMO_PHOTOS.map((p) => (
          <div key={p.id} className={`rounded-2xl bg-gradient-to-br ${p.gradient} aspect-square flex flex-col items-center justify-center p-3 text-center shadow-sm border border-border`}>
            <span className="text-5xl" aria-hidden>{p.emoji}</span>
            <p className="mt-2 text-sm font-medium text-stone-800">{p.caption[L]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LearnTab({ L, setPreview }: { L: "en" | "es"; setPreview: (f: ComingSoonFeature) => void }) {
  const cards = [
    { title: { en: "Sundowning: gentle hand-off", es: "Sundowning: transición suave" }, body: { en: "Why Rosa's 3 PM clock fires, and how music + dim light helps.", es: "Por qué se activa el reloj de las 3 PM y cómo música + luz tenue ayudan." } },
    { title: { en: "Responding to repeated questions", es: "Responder a preguntas repetidas" }, body: { en: "Answer calmly, then redirect — never correct.", es: "Responde con calma y redirige — nunca corrijas." } },
    { title: { en: "Bathing without battles", es: "Bañarse sin pelear" }, body: { en: "Predictable, warm, short. A familiar washcloth in hand.", es: "Predecible, cálido, breve. Una toallita familiar en la mano." } },
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{L === "es" ? "Biblioteca de aprendizaje" : "Learn library"}</h2>
      <ul className="space-y-3">
        {cards.map((c, i) => (
          <li key={i} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
            <span className="h-10 w-10 rounded-full bg-sky-100 text-sky-700 inline-flex items-center justify-center shrink-0"><PlayCircle size={20} /></span>
            <div className="flex-1">
              <p className="font-semibold">{c.title[L]}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{c.body[L]}</p>
              <button onClick={() => setPreview(COMING_SOON.learn)} className="mt-2 text-xs text-primary hover:underline">{L === "es" ? "Ver (2 min)" : "Watch (2 min)"}</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CircleTab({ L, setPreview }: { L: "en" | "es"; setPreview: (f: ComingSoonFeature) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{L === "es" ? "Círculo de cuidado" : "Care circle"}</h2>
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
    </div>
  );
}

function SummaryTab({ L, setPreview }: { L: "en" | "es"; setPreview: (f: ComingSoonFeature) => void }) {
  // Sort logs ascending by date for trend lines
  const sorted = [...DEMO_LOGS].sort((a, b) => a.date.localeCompare(b.date));
  const moodData = sorted.map((l) => ({
    date: l.date.slice(5),
    mood: l.mood,
    sleep: l.sleep === "well" ? 3 : l.sleep === "okay" ? 2 : 1,
  }));

  // Episodes by time of day
  const tod: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  for (const l of DEMO_LOGS) for (const s of l.symptoms) {
    const k = s.timeOfDay && tod[s.timeOfDay] !== undefined ? s.timeOfDay : "morning";
    tod[k] += 1;
  }
  const todLabels: Record<string, { en: string; es: string }> = {
    morning: { en: "Morning", es: "Mañana" }, afternoon: { en: "Afternoon", es: "Tarde" },
    evening: { en: "Evening", es: "Tarde-noche" }, night: { en: "Night", es: "Noche" },
  };
  const episodeData = Object.entries(tod).map(([k, v]) => ({ name: todLabels[k][L], count: v }));

  // Sleep distribution
  const sleepCounts = DEMO_LOGS.reduce((acc, l) => { acc[l.sleep] = (acc[l.sleep] || 0) + 1; return acc; }, {} as Record<string, number>);
  const sleepData = [
    { name: L === "es" ? "Bien" : "Well", value: sleepCounts.well || 0, color: "#10b981" },
    { name: L === "es" ? "Regular" : "Okay", value: sleepCounts.okay || 0, color: "#f59e0b" },
    { name: L === "es" ? "Mal" : "Poor", value: sleepCounts.poorly || 0, color: "#ef4444" },
  ];

  // Symptom counts
  const symCounts: Record<string, number> = {};
  for (const l of DEMO_LOGS) for (const s of l.symptoms) {
    const n = s.name[L]; symCounts[n] = (symCounts[n] || 0) + 1;
  }
  const symptomData = Object.entries(symCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  const avgMood = (DEMO_LOGS.reduce((n, l) => n + l.mood, 0) / DEMO_LOGS.length).toFixed(1);
  const totalEpisodes = DEMO_LOGS.reduce((n, l) => n + l.symptoms.length, 0);
  const poorSleepNights = sleepCounts.poorly || 0;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold inline-flex items-center gap-2"><FileText size={18} /> {L === "es" ? "Resumen médico" : "Physician summary"}</h2>
            <p className="text-xs text-muted-foreground mt-1">{L === "es" ? "Últimos 12 días · listo para imprimir o compartir" : "Last 12 days · ready to print or share"}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="text-sm rounded-lg border border-border px-3 py-1.5 hover:bg-muted">{L === "es" ? "Imprimir" : "Print"}</button>
            <button onClick={() => setPreview(COMING_SOON.summary)} className="text-sm rounded-lg bg-primary text-primary-foreground px-3 py-1.5">{L === "es" ? "Compartir" : "Share"}</button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Stat label={L === "es" ? "Registros" : "Logs"} value={String(DEMO_LOGS.length)} />
          <Stat label={L === "es" ? "Episodios" : "Episodes"} value={String(totalEpisodes)} />
          <Stat label={L === "es" ? "Ánimo promedio" : "Avg. mood"} value={avgMood} />
          <Stat label={L === "es" ? "Noches mal sueño" : "Poor sleep nights"} value={String(poorSleepNights)} />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold">{L === "es" ? "Ánimo y sueño en el tiempo" : "Mood & sleep over time"}</h3>
        <p className="text-xs text-muted-foreground">{L === "es" ? "Ánimo 1–5 · Sueño 1=mal, 2=regular, 3=bien" : "Mood 1–5 · Sleep 1=poor, 2=okay, 3=well"}</p>
        <div className="h-56 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <ReferenceLine y={3} stroke="#cbd5e1" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="mood" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3 }} name={L === "es" ? "Ánimo" : "Mood"} />
              <Line type="monotone" dataKey="sleep" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} name={L === "es" ? "Sueño" : "Sleep"} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold">{L === "es" ? "Episodios por hora del día" : "Episodes by time of day"}</h3>
          <p className="text-xs text-muted-foreground">{L === "es" ? "La tarde domina — coincide con su rutina de las 3 PM." : "Afternoon dominates — aligns with her 3 PM routine."}</p>
          <div className="h-52 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={episodeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold">{L === "es" ? "Calidad del sueño" : "Sleep quality"}</h3>
          <p className="text-xs text-muted-foreground">{L === "es" ? "Distribución de las noches registradas." : "Distribution of logged nights."}</p>
          <div className="h-52 mt-3 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sleepData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>
                  {sleepData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="text-xs space-y-1 pr-2">
              {sleepData.map((d) => (
                <li key={d.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} /> {d.name} · {d.value}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold">{L === "es" ? "Síntomas registrados" : "Symptoms logged"}</h3>
        <div className="h-52 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={symptomData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-violet-200 bg-violet-50 text-violet-900 p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"><Sparkles size={14} /> {L === "es" ? "Notas para el médico" : "Notes for the clinician"}</div>
        <ul className="mt-2 text-sm space-y-1.5 list-disc pl-5">
          <li>{L === "es" ? `${totalEpisodes} episodios en 12 días, concentrados entre 2:30–3:30 PM.` : `${totalEpisodes} episodes over 12 days, concentrated 2:30–3:30 PM.`}</li>
          <li>{L === "es" ? `${poorSleepNights} noches de mal sueño; ánimo promedio ${avgMood}/5.` : `${poorSleepNights} nights of poor sleep; average mood ${avgMood}/5.`}</li>
          <li>{L === "es" ? "Música + luz tenue ha resuelto 6 de 8 episodios." : "Music + dim light has resolved 6 of 8 episodes."}</li>
          <li>{L === "es" ? "Sin caídas. Sin cambios de medicación." : "No falls. No medication changes."}</li>
        </ul>
        <p className="mt-3 text-xs italic opacity-80">{L === "es" ? "Observaciones — no es un diagnóstico." : "Observations — not a diagnosis."}</p>
      </section>
    </div>
  );
}

function SettingsTab({ L }: { L: "en" | "es" }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{L === "es" ? "Configuración" : "Settings"}</h2>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-sm">
        <Row label={L === "es" ? "Idioma" : "Language"} value={L === "es" ? "Español (usa el botón arriba)" : "English (use toggle above)"} />
        <Row label={L === "es" ? "Paciente" : "Patient"} value={ROSA.name} />
        <Row label={L === "es" ? "Diagnóstico" : "Diagnosis"} value={ROSA.diagnosis} />
        <Row label={L === "es" ? "Música preferida" : "Preferred music"} value={DEMO_MUSIC.map((m) => m.title).join(", ")} />
        <p className="text-xs text-muted-foreground italic pt-2">{L === "es" ? "Demo — los cambios no se guardan." : "Demo — changes are not saved."}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
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
