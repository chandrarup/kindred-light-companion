
# COMPANION — Slice 1

Build the foundation: PWA shell, magic-link auth, PIN-protected mode toggle, and onboarding that provisions a household + patient profile with photo uploads. Synthetic data only.

Stack note: this project is **TanStack Start + React + Vite + Lovable Cloud (Supabase under the hood)**. Server-side AI calls will use TanStack server functions (not Supabase Edge Functions) — they're the supported pattern here and keep keys server-only the same way. Confirm if you'd prefer literal Edge Functions instead.

## 1. Enable Lovable Cloud
Provision Supabase (DB, auth, storage) before any backend work.

## 2. Database (migration)
Tables, all with `id uuid pk`, `created_at`, `updated_at`, and `deleted_at` on user-facing ones:
- `households` — name, `preferred_language` (`en`/`es`), `edit_lock_days int default 3`, `pin_hash`
- `users` — mirrors `auth.users` (id, email, display_name, preferred_language)
- `memberships` — user_id, household_id, role enum (`primary_caregiver|family|friend|clinician`), `permissions jsonb`
- `patient_profile` — household_id, display_name, language, biography, daily_routines (text), music_preferences (text[]), known_triggers (text[])
- `media` — household_id, storage_path, kind (`photo`), caption, tags
- Stubs (created now, populated later slices): `daily_logs, log_symptoms, episodes, cues, cue_events, fingerprint_insights, training_content, physician_summaries, audit_log`
- `app_role` enum + `user_roles` table + `has_role()` SECURITY DEFINER fn (per platform rules — roles never on profiles)
- RLS on all tables; policies scoped via `memberships` (user can access rows for households they belong to). Explicit `GRANT`s for `authenticated` + `service_role`.
- Storage bucket `family-photos` (private) with RLS keyed to household membership.
- Trigger: on `auth.users` insert → create `users` row.

## 3. Auth
- `/auth` route: Supabase magic-link (`signInWithOtp`, `emailRedirectTo = origin`).
- Managed `_authenticated/route.tsx` gate (already provided by integration) protects app routes.
- After sign-in: if user has no membership → redirect to `/onboarding`, else `/today`.

## 4. i18n
- `src/i18n/en.json` + `src/i18n/es.json`. Lightweight `useT()` hook reading from a context seeded by `patient_profile.language` (or household preferred_language); language toggle in header. Zero hardcoded UI strings.

## 5. Design system (`src/styles.css`)
- Warm low-saturation palette + single accent token; AAA contrast pairs for light theme.
- Tokens: `--text-caregiver-min: 16pt`, `--text-patient-min: 22pt`, `--touch-patient-min: 120px`.
- Disable all transitions globally except a `.photo-crossfade` utility.
- Never encode state in color alone — pair with icon + label (enforced in shared components).

## 6. PWA shell
- `public/manifest.webmanifest` (name, short_name, theme/bg colors, standalone, icons).
- Manifest + theme-color tags in `__root.tsx` head. **No service worker** this slice (per PWA skill: installability ≠ offline).
- App layout under `_authenticated/`: top bar (language toggle + mode switch button) + bottom nav (Today, Photos, Profile, Settings — placeholders for now besides what this slice builds).

## 7. Mode toggle + PIN
- Zustand (or React context) `useMode()` → `'caregiver' | 'patient'`, persisted to localStorage.
- Switching **into Caregiver** requires PIN entry; verified via server function `verifyHouseholdPin` that compares against `households.pin_hash` (bcrypt). Set during onboarding.
- Patient mode: stub full-screen route `/patient` that just shows patient name + greeting at 22pt+ (full ambient UI later).

## 8. Onboarding flow (`/onboarding`)
Multi-step form, one server fn `completeOnboarding` writing atomically:
1. Household name + preferred language + 4-digit PIN (confirm).
2. Patient: display name, language, biography (textarea), daily routines (textarea).
3. Music preferences (chip input → text[]), known triggers (chip input → text[]).
4. Upload family photos → `family-photos/{household_id}/...` → insert `media` rows.
5. Review → submit. Creates `household`, `membership` (primary_caregiver), `patient_profile`, `media`.

Demo-data banner across the app: "Synthetic data only — do not enter real PHI."

## 9. Verification before declaring done
- Build passes.
- Sign-in via magic link → onboarding → lands on `/today` placeholder.
- Mode toggle prompts PIN; wrong PIN rejected, right PIN switches.
- Photos visible in storage; `patient_profile` row populated; RLS blocks other households (spot-check via SQL).
- Language toggle flips all visible strings between en/es.

## Technical details
- Server fns: `src/lib/onboarding.functions.ts`, `src/lib/auth.functions.ts` (PIN verify/set). Admin client imported inside handlers only.
- `attachSupabaseAuth` already wired in `src/start.ts`.
- Photo upload from client uses browser supabase client + signed paths under user's household.
- No AI calls this slice — server-fn AI pattern arrives with later slices.

Confirm and I'll build it.
