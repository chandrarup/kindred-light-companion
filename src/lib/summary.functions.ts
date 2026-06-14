import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireSection } from "./permissions";

const inputSchema = z.object({
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type Counts = Record<string, number>;

function tally(rows: { symptom?: string | null }[]): Counts {
  const c: Counts = {};
  for (const r of rows) {
    if (!r.symptom) continue;
    c[r.symptom] = (c[r.symptom] ?? 0) + 1;
  }
  return c;
}

async function gatherStats(supabase: any, householdId: string, start: string, end: string) {
  // Symptoms from daily logs within the period
  const { data: logs } = await supabase
    .from("daily_logs")
    .select("id, log_date, log_symptoms(symptom, time_of_day, antecedent, outcome, intervention_tried)")
    .eq("household_id", householdId)
    .gte("log_date", start)
    .lte("log_date", end)
    .is("deleted_at", null);

  const allSymptoms: any[] = [];
  for (const l of logs ?? []) for (const s of l.log_symptoms ?? []) allSymptoms.push({ ...s, log_date: l.log_date });

  const symptomCounts = tally(allSymptoms);

  // Top antecedent -> symptom pairs (transparent counts)
  const pairCounts: Record<string, { antecedent: string; symptom: string; count: number; total: number; helped: number }> = {};
  for (const s of allSymptoms) {
    if (!s.antecedent) continue;
    const key = `${s.antecedent}::${s.symptom}`;
    if (!pairCounts[key]) pairCounts[key] = { antecedent: s.antecedent, symptom: s.symptom, count: 0, total: 0, helped: 0 };
    pairCounts[key].count++;
  }
  for (const s of allSymptoms) {
    for (const key of Object.keys(pairCounts)) {
      const [, sym] = key.split("::");
      if (sym === s.symptom) pairCounts[key].total++;
    }
    if (s.outcome === "helped") {
      for (const key of Object.keys(pairCounts)) {
        if (key.endsWith(`::${s.symptom}`)) pairCounts[key].helped++;
      }
    }
  }
  const topPatterns = Object.values(pairCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Prior period (same length) trend baseline
  const ms = Date.parse(end) - Date.parse(start);
  const prevEnd = new Date(Date.parse(start) - 86400000).toISOString().slice(0, 10);
  const prevStart = new Date(Date.parse(start) - 86400000 - ms).toISOString().slice(0, 10);
  const { data: prevLogs } = await supabase
    .from("daily_logs")
    .select("id, log_symptoms(symptom)")
    .eq("household_id", householdId)
    .gte("log_date", prevStart)
    .lte("log_date", prevEnd)
    .is("deleted_at", null);
  const prevSymptoms: any[] = [];
  for (const l of prevLogs ?? []) for (const s of l.log_symptoms ?? []) prevSymptoms.push(s);
  const prevCounts = tally(prevSymptoms);

  // Cue adherence
  const { data: cueEvents } = await supabase
    .from("cue_events")
    .select("status, cues!inner(household_id)")
    .eq("cues.household_id", householdId)
    .gte("created_at", `${start}T00:00:00Z`)
    .lte("created_at", `${end}T23:59:59Z`);
  const total = cueEvents?.length ?? 0;
  const done = (cueEvents ?? []).filter((e: any) => e.status === "done").length;
  const adherence = total > 0 ? Math.round((done / total) * 100) : null;

  return {
    period_start: start,
    period_end: end,
    prior_period: { start: prevStart, end: prevEnd },
    log_count: (logs ?? []).length,
    symptom_counts: symptomCounts,
    prior_symptom_counts: prevCounts,
    top_patterns: topPatterns,
    cue_adherence_pct: adherence,
    cue_events_total: total,
    cue_events_done: done,
    samples: allSymptoms.slice(0, 80).map((s) => ({
      symptom: s.symptom,
      time_of_day: s.time_of_day,
      antecedent: s.antecedent,
      outcome: s.outcome,
      intervention_tried: s.intervention_tried,
      log_date: s.log_date,
    })),
  };
}

async function narrate(stats: any): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return "AI narrative unavailable: missing gateway key.";

  const system = `You write a plain-language clinician-friendly paragraph describing what the family logged.
STRICT RULES:
- Use ONLY the counts and dates supplied. Do not invent symptoms, dates, or interventions.
- Never diagnose, prognose, or recommend treatment.
- Never imply causation. Use phrases like "logged" or "noted", not "caused" or "due to".
- Keep it under 180 words, one paragraph, no lists.
- Round percentages and counts as given. If a count is 0, say so plainly.`;

  const user = `Stats (transparent counts only):\n${JSON.stringify(stats, null, 2)}`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (resp.status === 429) return "AI narrative unavailable: rate limit. Charts above are accurate; please retry shortly.";
  if (resp.status === 402) return "AI narrative unavailable: workspace credits exhausted.";
  if (!resp.ok) return "AI narrative unavailable.";
  const j = await resp.json();
  return j?.choices?.[0]?.message?.content?.trim() ?? "AI narrative unavailable.";
}

export const generatePhysicianSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { householdId } = await requireSection(context.supabase, context.userId, "physician_summary", "write");
    const stats = await gatherStats(context.supabase, householdId, data.period_start, data.period_end);
    const narrative = await narrate(stats);
    const { data: row, error } = await context.supabase
      .from("physician_summaries")
      .insert({
        household_id: householdId,
        summary: narrative,
        stats,
        period_start: data.period_start,
        period_end: data.period_end,
        generated_by: context.userId,
      })
      .select("id, summary, stats, period_start, period_end, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listPhysicianSummaries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { householdId } = await requireSection(context.supabase, context.userId, "physician_summary", "read");
    const { data } = await context.supabase
      .from("physician_summaries")
      .select("id, summary, stats, period_start, period_end, created_at")
      .eq("household_id", householdId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20);
    return { summaries: data ?? [] };
  });