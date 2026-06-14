import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askCompanion } from "@/lib/demo.functions";

type Answer = { answer: string; tag: string; cached: boolean };

export function AskCompanion({ mode = "caregiver" }: { mode?: "caregiver" | "patient" }) {
  const ask = useServerFn(askCompanion);
  const [q, setQ] = useState("");
  const [a, setA] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setA(null);
    try {
      const res = await ask({ data: { question: q, mode } });
      setA(res as Answer);
    } finally {
      setLoading(false);
    }
  }

  const demoMode = typeof window !== "undefined" && window.localStorage.getItem("companion.demo") === "1";

  return (
    <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <h2 className="text-lg font-semibold">Ask COMPANION</h2>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={mode === "patient" ? "Tell me about…" : "Ask a question about her care…"}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-base"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground font-medium"
        >
          {loading ? "…" : "Ask"}
        </button>
      </form>
      {a && (
        <div className="rounded-md bg-muted p-3 text-base leading-relaxed">
          {demoMode && a.cached && (
            <span className="mr-2 inline-block rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900">
              demo · {a.tag}
            </span>
          )}
          {a.answer}
        </div>
      )}
    </section>
  );
}