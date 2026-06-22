import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Logo } from "@/components/Logo";

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
          <div className="flex items-center gap-2 min-w-0">
            <Logo size={24} />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Demo</span>
          </div>
          <LanguageToggle />
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
