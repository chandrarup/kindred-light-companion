import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { supabase } from "@/integrations/supabase/client";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

function readStoredAccessToken() {
  if (typeof window === "undefined") return undefined;
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key?.startsWith("sb-") || !key.endsWith("-auth-token")) continue;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? "null");
      const token = parsed?.access_token ?? parsed?.currentSession?.access_token ?? parsed?.session?.access_token;
      if (typeof token === "string" && token.length > 0) return token;
    } catch {
      // Ignore malformed local storage entries and keep looking.
    }
  }
  return undefined;
}

const attachCompanionAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  let token: string | undefined;
  try {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
  } catch {
    token = readStoredAccessToken();
  }
  return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth, attachCompanionAuth],
  requestMiddleware: [errorMiddleware],
}));
