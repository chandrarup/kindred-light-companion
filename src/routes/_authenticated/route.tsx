import { createFileRoute, Outlet, redirect, isRedirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole } from "@/lib/role.functions";

// Cache the role lookup per session so navigation between authenticated
// pages doesn't block on a server roundtrip every time.
let cachedRolePromise: Promise<{ role: string | null } | null> | null = null;
function getCachedRole() {
  if (!cachedRolePromise) {
    cachedRolePromise = (getMyRole() as Promise<{ role: string | null }>).catch(() => null);
  }
  return cachedRolePromise;
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    let user;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) throw redirect({ to: "/auth" });
      user = data.user;
    } catch (e) {
      if (isRedirect(e)) throw e;
      // Supabase client failed to initialize (e.g. missing env in a stale
      // build). Send the user to /auth rather than crashing the whole subtree.
      throw redirect({ to: "/auth" });
    }
    // Clinicians may only see the physician summary view. Use cached role so
    // we don't block every navigation on a server call.
    try {
      const r = await getCachedRole();
      if (r?.role === "clinician" && !location.pathname.startsWith("/summary")) {
        throw redirect({ to: "/summary" });
      }
    } catch (e) {
      if (isRedirect(e)) throw e;
      // ignore role lookup failures so the user can still load the app
    }
    return { user };
  },
  component: () => <Outlet />,
});