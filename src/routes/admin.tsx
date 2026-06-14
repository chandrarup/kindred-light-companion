import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { loadDemoData, resetDemoData } from "@/lib/demo.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — COMPANION" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const load = useServerFn(loadDemoData);
  const reset = useServerFn(resetDemoData);
  const navigate = useNavigate();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [demoFlag, setDemoFlag] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    setDemoFlag(window.localStorage.getItem("companion.demo") === "1");
  }, []);

  async function handleLoad() {
    setBusy(true);
    setStatus("Seeding Rosa Herrera demo household…");
    try {
      await load();
      window.localStorage.setItem("companion.demo", "1");
      setDemoFlag(true);
      setStatus("✓ Demo loaded. Redirecting to Today…");
      setTimeout(() => navigate({ to: "/today" }), 800);
    } catch (e: any) {
      setStatus("Error: " + (e?.message ?? String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setBusy(true);
    setStatus("Removing demo data…");
    try {
      const r = await reset();
      setStatus(`✓ Removed ${r.wiped} demo household(s).`);
    } catch (e: any) {
      setStatus("Error: " + (e?.message ?? String(e)));
    } finally {
      setBusy(false);
    }
  }

  function toggleDemoBadge() {
    const next = !demoFlag;
    setDemoFlag(next);
    window.localStorage.setItem("companion.demo", next ? "1" : "0");
  }

  return (
    <main className="mx-auto max-w-xl p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Admin / Demo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hidden prototype tools. Loads a complete synthetic patient (Rosa Herrera) with
          two weeks of logs, photos, family circle, cues, and pre-computed insights.
        </p>
      </header>

      {signedIn === false && (
        <div className="rounded-md bg-amber-100 p-3 text-sm text-amber-900">
          You must be signed in. The signed-in user becomes <b>María Herrera</b>, the
          primary caregiver in the demo.{" "}
          <a href="/auth" className="underline">
            Sign in
          </a>
          .
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleLoad}
          disabled={busy || signedIn === false}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground font-medium disabled:opacity-50"
        >
          Load Demo Data
        </button>
        <button
          onClick={handleReset}
          disabled={busy || signedIn === false}
          className="rounded-md border border-input px-4 py-2 font-medium disabled:opacity-50"
        >
          Reset Demo
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={demoFlag} onChange={toggleDemoBadge} />
        Show "demo" badge on cached AI answers
      </label>

      {status && <div className="rounded-md bg-muted p-3 text-sm">{status}</div>}

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">What gets seeded</summary>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Household "Rosa Herrera Demo" (Spanish, 3-day edit lock)</li>
          <li>Patient profile with bio, routines, music, triggers</li>
          <li>6 placeholder photos with captions</li>
          <li>Family circle: María (you), Daniel, Dr. Alvarez</li>
          <li>14 daily logs, including 5 afternoon-agitation entries</li>
          <li>Cues (hydration, medication, appointment) with done/missed history</li>
          <li>3 training cards (Alzheimer's Association)</li>
          <li>Fingerprint recomputed — afternoon insight surfaced</li>
        </ul>
      </details>
    </main>
  );
}