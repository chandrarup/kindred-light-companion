type Counts = Record<string, number>;

export function SymptomBarChart({ counts }: { counts: Counts }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">No symptoms logged in this period.</p>;
  const max = Math.max(...entries.map(([, v]) => v));
  return (
    <div role="img" aria-label="Symptom frequency bar chart" className="space-y-2">
      {entries.map(([label, v]) => (
        <div key={label} className="grid grid-cols-[10rem_1fr_2.5rem] items-center gap-2 text-sm">
          <span className="capitalize text-foreground">{label.replace(/_/g, " ")}</span>
          <div className="h-4 rounded bg-muted">
            <div
              className="h-4 rounded bg-primary"
              style={{ width: `${Math.max(4, (v / max) * 100)}%` }}
              aria-hidden
            />
          </div>
          <span className="text-foreground tabular-nums text-right">{v}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendLine({ current, prior }: { current: Counts; prior: Counts }) {
  const keys = Array.from(new Set([...Object.keys(current), ...Object.keys(prior)]));
  const series = keys.map((k) => ({ label: k, now: current[k] ?? 0, before: prior[k] ?? 0 }));
  series.sort((a, b) => b.now + b.before - (a.now + a.before));
  if (series.length === 0) return <p className="text-sm text-muted-foreground">Not enough data to compare.</p>;
  const max = Math.max(1, ...series.flatMap((s) => [s.now, s.before]));
  const w = 320;
  const h = 120;
  const step = series.length > 1 ? w / (series.length - 1) : w;
  const path = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / max) * h}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h + 24}`} className="w-full h-auto" role="img" aria-label="Trend vs prior period">
        <path d={path(series.map((s) => s.before))} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="4 3" />
        <path d={path(series.map((s) => s.now))} fill="none" stroke="hsl(var(--primary))" strokeWidth={2.5} />
        {series.map((s, i) => (
          <text key={s.label} x={i * step} y={h + 16} fontSize={9} textAnchor="middle" fill="currentColor">
            {s.label.slice(0, 5)}
          </text>
        ))}
      </svg>
      <p className="text-xs text-muted-foreground mt-1">Solid = this period. Dashed = prior period.</p>
    </div>
  );
}

export function AdherenceBadge({ pct, done, total }: { pct: number | null; done: number; total: number }) {
  if (pct == null) return <p className="text-sm text-muted-foreground">No scheduled cues this period.</p>;
  return (
    <div className="flex items-center gap-3">
      <div className="text-3xl font-semibold tabular-nums">{pct}%</div>
      <div className="text-sm text-muted-foreground">
        Cues completed ({done}/{total})
      </div>
    </div>
  );
}

export function TopPatterns({ patterns }: { patterns: Array<{ antecedent: string; symptom: string; count: number; total: number }> }) {
  if (patterns.length === 0) return <p className="text-sm text-muted-foreground">No recurring patterns this period.</p>;
  return (
    <ul className="space-y-1 text-sm">
      {patterns.map((p, i) => (
        <li key={i}>
          We noticed <strong>{p.antecedent.replace(/_/g, " ")}</strong> before{" "}
          <strong>{p.symptom.replace(/_/g, " ")}</strong>{" "}
          {p.count} of {p.total} times.
        </li>
      ))}
    </ul>
  );
}