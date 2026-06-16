
# Rebuild COMPANION intake / onboarding flow

Patient-first, resumable, bilingual (en/es), 6th-grade reading level, all strings via `src/i18n/{en,es}.json`. Existing app logic (cues, episodes, daily log, summary, patient mode, auth) stays untouched.

## 1. Data model changes (one migration)

Extend `public.patient_profile` with the new fields (all nullable so partial save works):

- `preferred_name text`, `address_as text`
- `languages text[] default '{}'` (keeps existing single `language` for Patient Mode default)
- `likes text[] default '{}'`, `dislikes text[] default '{}'`, `calming_strategies text[] default '{}'`
- `key_people jsonb default '[]'` — `[{name, relationship, contact_method, contact_value}]`
- `culture_faith text`, `profession text`, `hometown text`, `life_events text[] default '{}'`
- `diagnosis_type text`, `diagnosis_date date`, `stage_self_select text` (enum-as-text: `good_days`, `mixed`, `mostly_hard`)
- `medication_names text[] default '{}'` (names only — never dosing; enforce via CHECK that values stay short)
- `conditions text[] default '{}'`
- `zip_code text`, `referral_consent boolean default false`

Extend `public.households` with intake progress:

- `intake_progress jsonb default '{"step1":false,"step2":false,"step3":false}'`
- `intake_capture_mode text default 'guided'` (`'guided' | 'form'`)

No new tables. No RLS changes (existing household-scoped policies already cover these columns). Add `GRANT`s only if new columns require nothing extra (they don't — column-level grants inherit table grants).

A separate `caregiver_wellbeing` placeholder table is **not** created now — only a TODO comment in the caregiver profile section in Settings, as requested.

## 2. Server functions

In `src/lib/household.functions.ts` (or a new `src/lib/intake.functions.ts` to keep diffs small):

- `startIntake({ householdName, preferredLanguage, pin, patient: { displayName, preferredName, addressAs, languages } })` — replaces the old monolithic `completeOnboarding`. Creates household + membership + patient_profile with **Step 1 fields only**, marks `intake_progress.step1 = true`. Returns `householdId`.
- `saveIntakeStep({ step: 1|2|3, patch })` — partial update; merges into `patient_profile` / `households`, flips the matching `intake_progress.stepN` flag. Validates each step's fields independently with Zod.
- `setCaptureMode({ mode })` — persists guided vs form.
- `getIntakeState()` — returns `{ progress, captureMode, patient, household }` for resume.
- Keep `getMyHousehold` so existing redirect logic works.

Step 1 minimum to unlock the app: household name, PIN, patient `displayName`. Everything else (photos, music, greeting audio, languages) is optional inside Step 1 too — they can be added later from Settings.

Photos and greeting-audio upload paths stay client-side via `supabase.storage` (same pattern as current onboarding), then a small server fn `attachMedia({ paths, captions })` inserts `media` rows / sets `patient_profile.greeting_audio_path`.

## 3. Routing & UX

Replace `src/routes/_authenticated/onboarding.tsx` with a resumable shell:

- On mount, call `getIntakeState`. If `step1=false` → start at Step 1. If `step1=true` → land on a **"Continue intake"** dashboard listing Step 2 and Step 3 as optional cards with "Resume" / "Skip for now" / "Done" states. App is fully usable from this point: a "Go to app" button routes to `/today`.
- The route guard in `src/routes/_authenticated/route.tsx` only redirects to `/onboarding` when **Step 1 is incomplete**. Once Step 1 is done, `/onboarding` is reachable but never forced.
- After Step 1 submit: navigate to `/patient` (Patient Mode) once, to show the photos+music payoff, then bounce back to the intake dashboard via a "Back to setup" button.

Each step screen offers a **mode toggle** at the top: *Guided conversation* (default) | *Form*.

### Guided conversation mode

- One question at a time, large type, with `Skip`, `Back`, `Next` controls and a voice-or-type input (reuse `VoiceLogger` for capture; transcript fills the field).
- Question script lives in `src/i18n/{en,es}.json` under `intake.guided.*`, keyed by field. Example prompts: "What did {name} do for work?", "What's a song {name} loves?", "What helps when {name} gets upset?".
- Answers map directly to `patient_profile` fields. Multi-value fields (music, likes, dislikes, calming, life events, key people) loop: "Anything else?" until user taps Skip.
- Every question has a visible **Skip** button. Skipping records nothing and moves on.

### Form mode

- Same fields rendered as a compact tap/select form per step (mirrors the existing Step 2/3 form pattern with `ChipInput`, `LanguagePicker`, textareas).
- Submit at bottom of each step calls `saveIntakeStep`.

### Step contents (recap)

- **Step 1 — Patient essentials (REQUIRED to start):** preferred name, address-as, languages (en/es multiselect), photos with optional captions (who/when/where), music preferences (chips), optional caregiver greeting audio.
- **Step 2 — Routines & preferences (resumable):** wake/meal/sleep routines (uses existing `daily_routines` text + new `life_events` array for historical patterns), likes, dislikes, calming strategies, key people (name/relationship/contact).
- **Step 3 — Background & care basics (resumable):** culture/faith, profession, hometown, life events, diagnosis type + date, stage self-select with plain-language options, medication names, conditions, ZIP + referral consent toggle.

Autosave: each step's form/guided answers debounce-save (1.5s) via `saveIntakeStep` so the user can close the tab any time.

## 4. Settings — post-onboarding edits

In `src/routes/_authenticated/settings.tsx`, add a **"Patient profile"** section that renders the same field groups (organized by Step 1/2/3 headings) reusing the form-mode components from intake, and binds to `saveIntakeStep`. Add an empty **"Caregiver wellbeing (coming soon)"** card as the placeholder for the future optional caregiver burden/depression questions — no fields, no DB.

## 5. i18n

Add to `src/i18n/en.json` and `src/i18n/es.json`:

- `intake.modeToggle.guided`, `intake.modeToggle.form`, `intake.skip`, `intake.resume`, `intake.continueLater`, `intake.step1.title`…`step3.title`, `intake.dashboard.*`
- `intake.fields.*` for every new field label + help text
- `intake.guided.*` prompt strings, written at ~6th-grade reading level, with `{name}` interpolation

Existing `onboarding.*` keys remain only where reused; obsolete ones removed.

## 6. Out of scope (explicit)

- No changes to cues, episodes, daily logs, summary charts, patient mode logic (only its data source now has more photos/music available).
- No caregiver wellbeing fields or table — placeholder only.
- No changes to auth, RLS, or storage bucket configuration.

## Technical notes

- Validation: per-step Zod schemas in the server fn; clients also validate before submit.
- Skipped guided answers are simply omitted from the patch — they do not write `null` over existing data.
- `intake_progress` is the single source of truth for "where can the user resume"; the gate in `_authenticated/route.tsx` only checks `step1`.
- Greeting audio: capture via `MediaRecorder` (webm/m4a), upload to `family-photos` bucket under `<householdId>/greeting-<uuid>.webm`, then set `patient_profile.greeting_audio_path`.
- Medication CHECK constraint: `char_length(unnest) <= 80` enforced via trigger (Postgres CHECK can't unnest arrays) to keep entries to names only.
