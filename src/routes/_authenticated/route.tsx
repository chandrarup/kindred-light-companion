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

function hasStoredSession() {
  if (typeof window === "undefined") return false;
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key?.startsWith("sb-") || !key.endsWith("-auth-token")) continue;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? "null");
      if (parsed?.access_token || parsed?.currentSession?.access_token || parsed?.session?.access_token) {
        return true;
      }
    } catch {
      // Ignore malformed auth cache entries.
    }
  }
  return false;
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    let user;
    try {
      const { data, error } = await supabase.auth.getUser();
      if ((error || !data.user) && !hasStoredSession()) throw redirect({ to: "/auth" });
      user = data.user;
    } catch (e) {
      if (isRedirect(e)) throw e;
      // If the auth client hiccups but a browser session exists, allow the
      // server functions to validate the token instead of bouncing to /auth.
      if (!hasStoredSession()) throw redirect({ to: "/auth" });
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