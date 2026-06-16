import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole } from "@/lib/role.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    // Clinicians may only see the physician summary view
    try {
      const r: any = await getMyRole();
      if (r?.role === "clinician" && !location.pathname.startsWith("/summary")) {
        throw redirect({ to: "/summary" });
      }
    } catch {
      // ignore role lookup failures so the user can still load the app
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});