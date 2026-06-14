import { useState } from "react";
import {
  SYMPTOM_OPTIONS,
  ANTECEDENT_OPTIONS,
  OUTCOME_OPTIONS,
} from "@/lib/daily-log.functions";

export type SymptomEntry = {
  symptom: string;
  time_of_day: string | null;
  antecedent: string | null;
  intervention_tried: string | null;
  outcome: string | null;
};

export type DailyLogFormValue = {
  mood: number | null;
  sleep_quality: number | null;
  notes: string;
  symptoms: SymptomEntry[];
};

const MOOD_FACES = ["😖", "😕", "😐", "🙂", "😊"];

function Scale({
  value,
  onChange,
  labels,
  ariaLabel,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  labels: string[];
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex gap-2">
      {labels.map((l, i) => {
        const v = i + 1;
        const selected = value === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? null : v)}
            className={`flex-1 min-h-12 rounded-md border-2 text-2xl font-medium px-2 py-2 ${
              selected ? "border-primary bg-primary/10" : "border-border bg-background"
            }`}
          >
            <span aria-hidden>{l}</span>
            <span className="sr-only">{v}</span>
          </button>
        );
      })}
    </div>
  );
}

export function DailyLogForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
  submitLabel = "Save log",
}: {
  initial?: Partial<DailyLogFormValue>;
  submitting?: boolean;
  onSubmit: (v: DailyLogFormValue) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [mood, setMood] = useState<number | null>(initial?.mood ?? null);
  const [sleep, setSleep] = useState<number | null>(initial?.sleep_quality ?? null);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>(initial?.symptoms ?? []);

  function toggleSymptom(name: string) {
    setSymptoms((cur) => {
      const idx = cur.findIndex((s) => s.symptom === name);
      if (idx >= 0) return cur.filter((_, i) => i !== idx);
      return [
        ...cur,
        { symptom: name, time_of_day: null, antecedent: null, intervention_tried: null, outcome: null },
      ];
    });
  }

  function updateSymptom(name: string, patch: Partial<SymptomEntry>) {
    setSymptoms((cur) => cur.map((s) => (s.symptom === name ? { ...s, ...patch } : s)));
  }

  function fmtLabel(s: string) {
    return s.replace(/_/g, " ");
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ mood, sleep_quality: sleep, notes, symptoms });
      }}
    >
      <fieldset>
        <legend className="font-medium mb-2">Mood today</legend>
        <Scale value={mood} onChange={setMood} labels={MOOD_FACES} ariaLabel="Mood 1 to 5" />
      </fieldset>

      <fieldset>
        <legend className="font-medium mb-2">Sleep quality (optional)</legend>
        <Scale
          value={sleep}
          onChange={setSleep}
          labels={["1", "2", "3", "4", "5"]}
          ariaLabel="Sleep quality 1 to 5"
        />
      </fieldset>

      <fieldset>
        <legend className="font-medium mb-2">Symptoms observed</legend>
        <div className="grid grid-cols-2 gap-2">
          {SYMPTOM_OPTIONS.map((sym) => {
            const checked = symptoms.some((s) => s.symptom === sym);
            return (
              <label
                key={sym}
                className={`flex items-center gap-2 rounded-md border-2 p-3 cursor-pointer min-h-12 ${
                  checked ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={checked}
                  onChange={() => toggleSymptom(sym)}
                />
                <span className="capitalize">{fmtLabel(sym)}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {symptoms.length > 0 && (
        <fieldset className="space-y-4">
          <legend className="font-medium mb-2">Details for each symptom</legend>
          {symptoms.map((s) => (
            <div key={s.symptom} className="rounded-md border p-3 space-y-2">
              <div className="font-medium capitalize">{fmtLabel(s.symptom)}</div>
              <div className="grid sm:grid-cols-2 gap-2">
                <label className="text-sm">
                  Time of day
                  <input
                    type="text"
                    value={s.time_of_day ?? ""}
                    onChange={(e) => updateSymptom(s.symptom, { time_of_day: e.target.value || null })}
                    placeholder="e.g. morning, 6pm"
                    className="mt-1 w-full rounded border px-2 py-2 min-h-10"
                  />
                </label>
                <label className="text-sm">
                  Antecedent
                  <select
                    value={s.antecedent ?? ""}
                    onChange={(e) => updateSymptom(s.symptom, { antecedent: e.target.value || null })}
                    className="mt-1 w-full rounded border px-2 py-2 min-h-10 bg-background"
                  >
                    <option value="">—</option>
                    {ANTECEDENT_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {fmtLabel(a)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm sm:col-span-2">
                  Intervention tried
                  <input
                    type="text"
                    value={s.intervention_tried ?? ""}
                    onChange={(e) =>
                      updateSymptom(s.symptom, { intervention_tried: e.target.value || null })
                    }
                    placeholder="What did you try?"
                    className="mt-1 w-full rounded border px-2 py-2 min-h-10"
                  />
                </label>
                <label className="text-sm">
                  Outcome
                  <select
                    value={s.outcome ?? ""}
                    onChange={(e) => updateSymptom(s.symptom, { outcome: e.target.value || null })}
                    className="mt-1 w-full rounded border px-2 py-2 min-h-10 bg-background"
                  >
                    <option value="">—</option>
                    {OUTCOME_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {fmtLabel(o)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ))}
        </fieldset>
      )}

      <label className="block">
        <span className="font-medium">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded border px-2 py-2"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-3 font-medium min-h-12 disabled:opacity-50"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border-2 border-border px-4 py-3 font-medium min-h-12"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}