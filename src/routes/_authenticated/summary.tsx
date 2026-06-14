import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useT } from "@/i18n/I18nProvider";
import { generatePhysicianSummary, listPhysicianSummaries } from "@/lib/summary.functions";
import { SymptomBarChart, TrendLine, AdherenceBadge, TopPatterns } from "@/components/SummaryCharts";

export const Route = createFileRoute("/_authenticated/summary")({
  head: () => ({ meta: [{ title: "Physician summary — COMPANION" }] }),
  component: SummaryPage,
});

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

type Summary = {
  id: string;
  summary: string;
  stats: any;
  period_start: string;
  period_end: string;
  created_at: string;
};

function SummaryPage() {
  const { t } = useT();
  const genFn = useServerFn(generatePhysicianSummary);
  const listFn = useServerFn(listPhysicianSummaries);

  const [start, setStart] = useState(isoDaysAgo(30));
  const [end, setEnd] = useState(isoDaysAgo(0));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<Summary | null>(null);
  const [history, setHistory] = useState<Summary[]>([]);

  const refresh = useCallback(async () => {
    const r: any = await listFn();
    setHistory(r.summaries ?? []);
    if (!current && r.summaries?.[0]) setCurrent(r.summaries[0]);
  }, [listFn, current]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res: any = await genFn({ data: { period_start: start, period_end: end } });
      setCurrent(res);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Could not generate summary");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="print:hidden">
        <h1 className="text-2xl font-semibold mb-2">{t("summary.title")}</h1>
        <p className="text-muted-foreground mb-4">{t("summary.subtitle")}</p>

        <div className="rounded border border-border p-3 mb-6 flex flex-wrap gap-3 items-end">
          <label className="text-sm">
            <span className="block mb-1">{t("summary.from")}</span>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded border border-input bg-background px-2 py-1" data-touch />
          </label>
          <label className="text-sm">
            <span className="block mb-1">{t("summary.to")}</span>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded border border-input bg-background px-2 py-1" data-touch />
          </label>
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50 min-h-11"
            data-touch
          >
            {busy ? t("summary.generating") : t("summary.generate")}
          </button>
          {current && (
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded border border-border min-h-11"
              data-touch
            >
              {t("summary.print")}
            </button>
          )}
        </div>

        {error && <div className="mb-4 rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</div>}
      </div>

      {current && <PhysicianSummaryView s={current} />}

      {history.length > 1 && (
        <section className="mt-8 print:hidden">
          <h2 className="text-lg font-semibold mb-2">{t("summary.history")}</h2>
          <ul className="space-y-1">
            {history.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => setCurrent(h)}
                  className="text-sm underline"
                >
                  {h.period_start} → {h.period_end} ({new Date(h.created_at).toLocaleDateString()})
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}

export function PhysicianSummaryView({ s }: { s: Summary }) {
  const { t } = useT();
  const stats = s.stats ?? {};
  return (
    <article className="rounded border border-border p-4 print:border-0 print:p-0">
      <header className="mb-4">
        <h2 className="text-xl font-semibold">{t("summary.cardTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {s.period_start} → {s.period_end} · {stats.log_count ?? 0} {t("summary.logs")}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h3 className="font-medium mb-2">{t("summary.symptomFreq")}</h3>
          <SymptomBarChart counts={stats.symptom_counts ?? {}} />
        </section>
        <section>
          <h3 className="font-medium mb-2">{t("summary.trend")}</h3>
          <TrendLine current={stats.symptom_counts ?? {}} prior={stats.prior_symptom_counts ?? {}} />
        </section>
        <section>
          <h3 className="font-medium mb-2">{t("summary.topPatterns")}</h3>
          <TopPatterns patterns={stats.top_patterns ?? []} />
        </section>
        <section>
          <h3 className="font-medium mb-2">{t("summary.adherence")}</h3>
          <AdherenceBadge pct={stats.cue_adherence_pct ?? null} done={stats.cue_events_done ?? 0} total={stats.cue_events_total ?? 0} />
        </section>
      </div>

      <section className="mt-6">
        <h3 className="font-medium mb-2">{t("summary.narrative")}</h3>
        <p className="leading-relaxed whitespace-pre-wrap">{s.summary}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {t("summary.disclaimer")}
        </p>
      </section>
    </article>
  );
}