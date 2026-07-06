# Deploy Checklist — Payouts & Teacher/Student Onboarding

Covers two PRs:
- **`feat/international-teacher-payouts`** — international/TapTap/Wise payouts, no-show tracking, hours fix, light-theme pages
- **`feat/teacher-onboarding-agreement`** — teacher agreement gate, beautiful resources + Qur'an method, student lesson intro

> Note: `supabase/migrations/` and `supabase/*.sql` are **gitignored** in this repo, so DB changes are applied **manually via the Supabase SQL editor** (not `supabase db push`). Apply idempotent SQL by hand and keep it in sync with the migration files on disk.

---

## ✅ Already completed

- **SQL applied:** international payout fields + TapTap method + method constraints; `teacher_onboarding_completions` table; migration #6 safe parts (admin teacher-approval RLS fix, one teacher approved, admin subject-management RLS).
- **Edge functions deployed:** `check-tier-progression` (hours-counter fix) and `process-wise-payout`.

---

## ⬜ Step 1 — Run remaining SQL (before deploying)

### 1a. Teacher agreement columns — REQUIRED before the onboarding PR deploys
If this column is missing when the new frontend goes live, the teacher-profile query in `ProtectedRoute` errors and **teachers get locked out**. Run this first:

```sql
ALTER TABLE teacher_profiles
  ADD COLUMN IF NOT EXISTS agreement_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS agreement_version text,
  ADD COLUMN IF NOT EXISTS agreement_signed_name text;
```

### 1b. Load the Qur'an teaching guide as a required resource
Run the contents of `supabase/seed_quran_teaching_guide.sql` in the SQL editor (a single `INSERT` into `onboarding_resources`).

All of the above is additive and safe to re-run.

---

## ⬜ Step 2 — Merge & deploy

Netlify auto-deploys production from `main`. The two PRs are independent and touch `Lesson.tsx` in different regions, so they merge cleanly in either order. **Ensure Step 1a is done before merging the onboarding PR.**

1. Merge **`feat/international-teacher-payouts`** → `main` (Netlify builds & deploys).
2. Merge **`feat/teacher-onboarding-agreement`** → `main` (Netlify builds & deploys).

---

## ⬜ Step 3 — Optional: enable automated Wise payouts

TapTap Send (manual) is the primary rail for international teachers, so this is optional. To enable automated Wise, set Supabase function secrets:

```
WISE_API_TOKEN=...
WISE_PROFILE_ID=...
# WISE_API_URL=https://api.sandbox.transferwise.tech   (while testing)
```

Keep a GBP balance in Wise (transfers are funded from balance). Test a small sandbox transfer to confirm Egypt/EGP recipient support before relying on it.

---

## ⬜ Step 4 — Post-deploy verification

- **Teacher agreement:** log in as an approved teacher → redirected to the agreement → tick all sections + type name + confirm → lands on the hub. Re-login does **not** re-prompt.
- **Resources:** Teacher → Resources → the "How to Teach Qur'an" guide renders as formatted markdown.
- **Student intro:** join a lesson as a student → "how lessons work" walkthrough appears once.
- **Payouts:** Teacher → Payment Settings shows TapTap/international options; Admin → Teacher Payouts shows recipient details and can process payouts.
- **No-show:** End Session → "student didn't show up" records a no-show (not counted as completed/paid).
- **Onboarding checklist:** circles are clickable and persist across devices.

---

## Notes

- Once live, **every existing approved teacher** is prompted to accept the agreement on next login (intended).
- To re-prompt all teachers after editing the wording, bump `AGREEMENT_VERSION` in `src/data/teacherAgreement.ts`.
- The teaching method taught throughout: **Understanding → Fluency → Memorisation**, taught **by theme** (a block of āyāt through all three layers before the next theme).
- Migration #6's pay-scale rescale + auto-promotion disable were **intentionally excluded**; only the safe admin RLS fixes were applied.
