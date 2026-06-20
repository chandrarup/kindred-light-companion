import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { safeDbError } from "./safe-errors";

/** Create a throwaway demo auth user and return credentials so the client can sign in. */
export const createDemoSession = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const id = crypto.randomUUID().slice(0, 8);
  const email = `demo-${id}@demo.companion.app`;
  const password = crypto.randomUUID() + "Aa1!";
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { demo: true, display_name: "María Herrera" },
  });
  if (error || !data?.user) throw safeDbError(error, "createUser failed");
  await supabaseAdmin
    .from("users")
    .upsert({ id: data.user.id, email, display_name: "María Herrera" }, { onConflict: "id" });
  return { email, password };
});

/** Wipe any existing demo households and seed a fresh one owned by the current user. */
export const loadDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { wipeDemoHouseholds, seedDemoHousehold } = await import("./demo.server");

    // Remove the current user from any non-demo household membership? No — leave alone.
    // But the current user can only belong to one household at a time (UI enforces it).
    // Soft-delete any existing memberships for this user so seed can attach them.
    await supabaseAdmin
      .from("memberships")
      .delete()
      .eq("user_id", context.userId);

    await wipeDemoHouseholds(supabaseAdmin, context.userId);
    const out = await seedDemoHousehold(supabaseAdmin, context.userId);
    return { ok: true, householdId: out.householdId };
  });

export const resetDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { wipeDemoHouseholds } = await import("./demo.server");
    await supabaseAdmin.from("memberships").delete().eq("user_id", context.userId);
    const wiped = await wipeDemoHouseholds(supabaseAdmin, context.userId);
    return { ok: true, wiped };
  });

/** Ask COMPANION — checks the demo_responses cache first. */
const askSchema = z.object({
  question: z.string().min(1).max(2000),
  mode: z.enum(["caregiver", "patient"]).default("caregiver"),
});

/** Maps cached-response labels to Learn video symptom_tags so the chat can offer "Watch (2 min)". */
const LABEL_TO_VIDEO_TAG: Record<string, string> = {
  afternoon_insight: "agitation",
  what_to_do_now: "agitation",
  repetition: "repetition",
  appetite: "appetite_change",
  sleep: "sleep",
};

export const askCompanion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => askSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("demo_responses")
      .select("label, keywords, answer, tag, mode, priority")
      .order("priority", { ascending: true });

    const q = data.question.toLowerCase();
    const candidates = (rows ?? []).filter((r: any) => {
      if (data.mode === "patient") {
        // Patient Mode: only reminiscence-type entries
        if (r.tag !== "reminiscence") return false;
        if (r.mode === "caregiver") return false;
      } else {
        // Caregiver Mode: never serve reminiscence
        if (r.mode === "patient") return false;
      }
      return (r.keywords as string[]).some((kw) => q.includes(kw.toLowerCase()));
    });

    if (candidates.length > 0) {
      const hit = candidates[0];
      return {
        answer: hit.answer as string,
        tag: hit.tag as string,
        label: hit.label as string,
        video_tag: LABEL_TO_VIDEO_TAG[hit.label as string] ?? null,
        cached: true,
      };
    }

    // No live LLM configured for this prototype — return a safe fallback.
    return {
      answer:
        data.mode === "patient"
          ? "I'm here with you."
          : "I don't have an answer for that yet. For anything clinical, please ask Dr. Alvarez.",
      tag: "fallback",
      label: null,
      video_tag: null,
      cached: false,
    };
  });