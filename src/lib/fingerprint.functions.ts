import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEFAULT_WINDOW_DAYS = 90;

type Row = {
  symptom: string | null;
  antecedent: string | null;
  intervention_tried: string | null;
  outcome: string | null;
};

async function getHouseholdContext(supabase: any, userId: string) {
  const { data: m } = await supabase
    .from("memberships")
    .select("household_id")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (!m) throw new Error("No household for user");
  const householdId = m.household_id as string;
  const { data: h } = await supabase
    .from("households")
    .select("min_evidence")
    .eq("id", householdId)
    .maybeSingle();
  return { householdId, minEvidence: (h?.min_evidence as number | undefined) ?? 4 };
}

async function collectRows(supabase: any, householdId: string): Promise<Row[]> {
  const since = new Date(Date.now() - DEFAULT_WINDOW_DAYS * 86400 * 1000).toISOString();

  const { data: logRows } = await supabase
    .from("log_symptoms")
    .select(
      "symptom, antecedent, intervention_tried, outcome, created_at, daily_logs!inner(household_id, log_date, deleted_at)",
    )
    .eq("daily_logs.household_id", householdId)
    .is("daily_logs.deleted_at", null)
    .gte("created_at", since);

  const { data: epRows } = await supabase
    .from("episodes")
    .select("symptom, antecedent, intervention_tried, outcome")
    .eq("household_id", householdId)
    .is("deleted_at", null)
    .gte("occurred_at", since);

  const a = (logRows ?? []) as Row[];
  const b = (epRows ?? []) as Row[];
  return [...a, ...b].filter((r) => r.symptom);
}

type AntSymKey = string; // `${antecedent}|${symptom}`

/**
 * Recompute the trigger fingerprint for the caller's household:
 * - Counts co-occurrences of (antecedent -> symptom) and (intervention -> outcome)
 *   across log_symptoms and episodes inside the rolling window.
 * - Surfaces any (antecedent -> symptom) pair seen at least `min_evidence` times.
 * - Stores each surfaced pattern as a fingerprint_insights row (upsert).
 * - Soft-deletes previously-surfaced patterns that no longer meet threshold.
 */
export const recomputeFingerprint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { householdId, minEvidence } = await getHouseholdContext(supabase, userId);
    const rows = await collectRows(supabase, householdId);

    // Total observations per symptom (denominator in the phrasing template)
    const symptomTotals = new Map<string, number>();
    for (const r of rows) {
      if (!r.symptom) continue;
      symptomTotals.set(r.symptom, (symptomTotals.get(r.symptom) ?? 0) + 1);
    }

    // (antecedent, symptom) co-occurrence counts
    const antSymCounts = new Map<AntSymKey, number>();
    // Per (antecedent,symptom) -> intervention -> outcome -> count (what helped)
    const interventionOutcome = new Map<AntSymKey, Map<string, Map<string, number>>>();

    for (const r of rows) {
      if (!r.antecedent || !r.symptom) continue;
      const key = `${r.antecedent}|${r.symptom}`;
      antSymCounts.set(key, (antSymCounts.get(key) ?? 0) + 1);
      if (r.intervention_tried && r.outcome) {
        if (!interventionOutcome.has(key)) interventionOutcome.set(key, new Map());
        const iv = interventionOutcome.get(key)!;
        if (!iv.has(r.intervention_tried)) iv.set(r.intervention_tried, new Map());
        const ov = iv.get(r.intervention_tried)!;
        ov.set(r.outcome, (ov.get(r.outcome) ?? 0) + 1);
      }
    }

    const surfaced: Array<{
      kind: "antecedent_symptom";
      antecedent: string;
      symptom: string;
      count: number;
      total: number;
      what_helped: Array<{ intervention: string; outcome: string; count: number }>;
      window_days: number;
      min_evidence: number;
      computed_at: string;
    }> = [];

    const computedAt = new Date().toISOString();
    for (const [key, count] of antSymCounts.entries()) {
      if (count < minEvidence) continue;
      const [antecedent, symptom] = key.split("|");
      const total = symptomTotals.get(symptom) ?? count;
      const whatHelped: Array<{ intervention: string; outcome: string; count: number }> = [];
      const iv = interventionOutcome.get(key);
      if (iv) {
        for (const [intervention, outcomes] of iv.entries()) {
          for (const [outcome, c] of outcomes.entries()) {
            if (outcome === "helped") whatHelped.push({ intervention, outcome, count: c });
          }
        }
        whatHelped.sort((a, b) => b.count - a.count);
      }
      surfaced.push({
        kind: "antecedent_symptom",
        antecedent,
        symptom,
        count,
        total,
        what_helped: whatHelped.slice(0, 5),
        window_days: DEFAULT_WINDOW_DAYS,
        min_evidence: minEvidence,
        computed_at: computedAt,
      });
    }

    // Preserve user dismissals: any (antecedent,symptom) pair previously
    // soft-deleted by the caregiver stays hidden until they explicitly reset.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: dismissed } = await supabaseAdmin
      .from("fingerprint_insights")
      .select("insight")
      .eq("household_id", householdId)
      .not("deleted_at", "is", null);
    const dismissedKeys = new Set(
      (dismissed ?? []).map((r: any) => `${r.insight?.antecedent}|${r.insight?.symptom}`),
    );

    // Fresh recompute: clear current active rows, then insert what's surfaced
    // and not dismissed. Avoids partial-unique-index upsert pitfalls.
    await supabaseAdmin
      .from("fingerprint_insights")
      .delete()
      .eq("household_id", householdId)
      .is("deleted_at", null);

    const toInsert = surfaced
      .filter((s) => !dismissedKeys.has(`${s.antecedent}|${s.symptom}`))
      .map((s) => ({ household_id: householdId, insight: s }));
    if (toInsert.length > 0) {
      const { error } = await supabaseAdmin.from("fingerprint_insights").insert(toInsert);
      if (error) throw new Error(error.message);
    }

    return { surfaced: surfaced.length, minEvidence, windowDays: DEFAULT_WINDOW_DAYS };
  });

export const listInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { householdId, minEvidence } = await getHouseholdContext(supabase, userId);
    const { data, error } = await supabase
      .from("fingerprint_insights")
      .select("id, insight, created_at, updated_at")
      .eq("household_id", householdId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { insights: data ?? [], minEvidence };
  });

const dismissSchema = z.object({ id: z.string().uuid() });

export const dismissInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => dismissSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("fingerprint_insights")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });