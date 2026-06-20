import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { LanguageToggle } from "@/components/LanguageToggle";

export const Route = createFileRoute("/demo")({
  head: () => ({ meta: [{ title: "Demo — COMPANION" }] }),
  component: DemoLayout,
});

function DemoLayout() {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <DemoBanner />
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-2 flex items-center justify-between">
          <span className="font-semibold tracking-wide text-sm">COMPANION · Demo</span>
          <LanguageToggle />
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
