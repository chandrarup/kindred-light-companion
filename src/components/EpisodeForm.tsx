import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ANTECEDENT_OPTIONS,
  OUTCOME_OPTIONS,
  SYMPTOM_OPTIONS,
} from "@/lib/daily-log.functions";
import { RED_FLAGS, createEpisode } from "@/lib/episodes.functions";

function humanize(s: string) {
  return s.replace(/_/g, " ");
}

export function EpisodeForm({
  onSaved,
  onCancel,
}: {
  onSaved: (result: { id: string; red_flags: string[]; red_flag_prompt: string | null }) => void;
  onCancel?: () => void;
}) {
  const create = useServerFn(createEpisode);
  const [description, setDescription] = useState("");
  const [when, setWhen] = useState<string>(new Date().toISOString().slice(0, 16));
  const [duration, setDuration] = useState<string>("");
  const [symptom, setSymptom] = useState("");
  const [antecedent, setAntecedent] = useState("");
  const [intervention, setIntervention] = useState("");
  const [outcome, setOutcome] = useState("");
  const [flags, setFlags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleFlag(id: string) {
    setFlags((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await create({
        data: {
          description,
          occurred_at: when ? new Date(when).toISOString() : undefined,
          duration_minutes: duration ? Number(duration) : null,
          symptom: (symptom || null) as any,
          antecedent: (antecedent || null) as any,
          intervention_tried: intervention || null,
          outcome: (outcome || null) as any,
          red_flags: flags,
        },
      });
      onSaved(res);
    } catch (e: any) {
      setError(e?.message ?? "Could not save episode");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="font-medium">What happened?</span>
        <textarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded border px-2 py-2"
          placeholder="Describe in your own words"
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="font-medium">When</span>
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-2 min-h-10"
          />
        </label>
        <label className="block">
          <span className="font-medium">How long (minutes)</span>
          <input
            type="number"
            min={0}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-2 min-h-10"
          />
        </label>
        <label className="block">
          <span className="font-medium">Symptom</span>
          <select
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-2 min-h-10 bg-background"
          >
            <option value="">—</option>
            {SYMPTOM_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-medium">What preceded it</span>
          <select
            value={antecedent}
            onChange={(e) => setAntecedent(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-2 min-h-10 bg-background"
          >
            <option value="">—</option>
            {ANTECEDENT_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {humanize(a)}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="font-medium">What was tried</span>
          <input
            type="text"
            value={intervention}
            onChange={(e) => setIntervention(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-2 min-h-10"
          />
        </label>
        <label className="block">
          <span className="font-medium">Outcome</span>
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-2 min-h-10 bg-background"
          >
            <option value="">—</option>
            {OUTCOME_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {humanize(o)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="rounded-md border-2 border-border p-3">
        <legend className="font-medium px-1">Any of these signs?</legend>
        <div className="space-y-2 mt-2">
          {RED_FLAGS.map((f) => (
            <label key={f.id} className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={flags.includes(f.id)}
                onChange={() => toggleFlag(f.id)}
                className="h-5 w-5 mt-1"
              />
              <span>{f.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <div className="text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-3 font-medium min-h-12 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save episode"}
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