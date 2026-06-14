import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useT } from "@/i18n/I18nProvider";
import { getMyHousehold } from "@/lib/household.functions";
import { createDailyLog, hasLoggedToday, listRecentLogs } from "@/lib/daily-log.functions";
import { DailyLogForm, type DailyLogFormValue } from "@/components/DailyLogForm";
import { VoiceLogger } from "@/components/VoiceLogger";
import { InsightsList } from "@/components/InsightsList";
import { CuesPanel } from "@/components/CuesPanel";
import { TrainingCards } from "@/components/TrainingCards";
import { DailyLogReminder } from "@/components/DailyLogReminder";
import { EpisodeForm } from "@/components/EpisodeForm";
import { RedFlagCard } from "@/components/RedFlagCard";

export const Route = createFileRoute("/_authenticated/today")({
  head: () => ({ meta: [{ title: "Today — COMPANION" }] }),
  component: Today,
});

type RecentLog = {
  id: string;
  log_date: string;
  mood: string | null;
  sleep_quality: number | null;
  notes: string | null;
  created_at: string;
  log_symptoms: { symptom: string; time_of_day: string | null; antecedent: string | null; outcome: string | null }[];
};

function Today() {
  const { t } = useT();
  const navigate = useNavigate();
  const fn = useServerFn(getMyHousehold);
  const createFn = useServerFn(createDailyLog);
  const listFn = useServerFn(listRecentLogs);
  const loggedFn = useServerFn(hasLoggedToday);
  const [patientName, setPatientName] = useState<string | null>(null);
  const [mode, setMode] = useState<"idle" | "tap" | "voice" | "episode">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [insightsKey, setInsightsKey] = useState(0);
  const [notifyWindow, setNotifyWindow] = useState<{ start: string; end: string }>({
    start: "09:00",
    end: "20:00",
  });
  const [loggedToday, setLoggedToday] = useState(false);
  const [activeFlags, setActiveFlags] = useState<string[]>([]);

  const refreshLogs = useCallback(async () => {
    try {
      const res = await listFn();
      setLogs((res?.logs ?? []) as RecentLog[]);
      const l = await loggedFn();
      setLoggedToday(!!l?.logged);
    } catch (e: any) {
      setError(e?.message ?? "Could not load logs");
    }
  }, [listFn, loggedFn]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fn();
      if (cancelled) return;
      if (!res?.household) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
      setPatientName(res.patient?.display_name ?? null);
      const hh = res.household as any;
      if (hh?.notify_window_start && hh?.notify_window_end) {
        setNotifyWindow({
          start: String(hh.notify_window_start).slice(0, 5),
          end: String(hh.notify_window_end).slice(0, 5),
        });
      }
      refreshLogs();
    })();
    return () => {
      cancelled = true;
    };
  }, [fn, navigate, refreshLogs]);

  async function handleSave(v: DailyLogFormValue) {
    setSubmitting(true);
    setError(null);
    try {
      await createFn({ data: v });
      setMode("idle");
      await refreshLogs();
      setInsightsKey((k) => k + 1);
    } catch (e: any) {
      setError(e?.message ?? "Could not save log");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-2">{t("today.title")}</h1>
      {patientName && <p className="text-muted-foreground mb-4">— {patientName}</p>}

      <RedFlagCard flags={activeFlags} />

      {error && (
        <div className="mb-4 rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      {mode === "idle" && (
        <div className="space-y-6">
          <DailyLogReminder
            windowStart={notifyWindow.start}
            windowEnd={notifyWindow.end}
            alreadyLoggedToday={loggedToday}
          />

          <CuesPanel />

          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("tap")}
              className="rounded-lg bg-primary text-primary-foreground px-6 py-6 text-xl font-semibold min-h-20"
            >
              ＋ Log today
            </button>
            <button
              type="button"
              onClick={() => setMode("voice")}
              className="rounded-lg border-2 border-primary text-primary px-6 py-6 text-xl font-semibold min-h-20"
            >
              🎤 Voice log
            </button>
            <button
              type="button"
              onClick={() => setMode("episode")}
              className="rounded-lg border-2 border-destructive/40 text-destructive px-6 py-6 text-xl font-semibold min-h-20"
            >
              ⚠ Something new happened
            </button>
            <Link
              to="/cues"
              className="rounded-lg border-2 border-border px-6 py-6 text-xl font-semibold min-h-20 flex items-center justify-center text-center"
            >
              ⏰ Cues & reminders
            </Link>
          </div>

          <TrainingCards refreshKey={insightsKey} />

          <section aria-labelledby="recent-logs">
            <h2 id="recent-logs" className="text-lg font-semibold mb-2">
              Recent logs
            </h2>
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No logs yet today.</p>
            ) : (
              <ul className="space-y-2">
                {logs.map((l) => (
                  <li key={l.id} className="rounded border p-3">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{new Date(l.created_at).toLocaleString()}</span>
                      {l.mood && <span>Mood: {l.mood}/5</span>}
                    </div>
                    {l.notes && <p className="mt-1">{l.notes}</p>}
                    {l.log_symptoms?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {l.log_symptoms.map((s, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-muted px-2 py-1 text-xs capitalize"
                          >
                            {s.symptom.replace(/_/g, " ")}
                            {s.outcome ? ` · ${s.outcome.replace(/_/g, " ")}` : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="insights">
            <h2 id="insights" className="text-lg font-semibold mb-2">
              Insights
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              Patterns we've noticed from your family's logs. Counts only — never diagnoses.
            </p>
            <InsightsList refreshKey={insightsKey} />
          </section>
        </div>
      )}

      {mode === "tap" && (
        <DailyLogForm submitting={submitting} onSubmit={handleSave} onCancel={() => setMode("idle")} />
      )}

      {mode === "voice" && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="text-sm underline"
          >
            ← Back
          </button>
          <VoiceLogger submitting={submitting} onConfirm={handleSave} />
          <details className="text-sm">
            <summary className="cursor-pointer">Prefer to tap instead?</summary>
            <div className="mt-3">
              <DailyLogForm submitting={submitting} onSubmit={handleSave} />
            </div>
          </details>
        </div>
      )}

      {mode === "episode" && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="text-sm underline"
          >
            ← Back
          </button>
          <h2 className="text-xl font-semibold">Log a new episode</h2>
          <EpisodeForm
            onCancel={() => setMode("idle")}
            onSaved={(res) => {
              setMode("idle");
              setInsightsKey((k) => k + 1);
              if (res.red_flags.length > 0) setActiveFlags(res.red_flags);
            }}
          />
        </div>
      )}
    </AppShell>
  );
}