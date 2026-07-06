# Shelved: Teacher Referrals (admin)

The `src/pages/admin/TeacherReferrals.tsx` page is **kept in the repo but not routed**
(the route + lazy import are commented out in `src/App.tsx`). It was shelved on
2026-07-06 because it is not finished. To re-enable it, complete the following:

## 1. Missing DB columns (no migration exists yet)
The page queries these, and they don't exist — it errors and renders empty until added:

- `teacher_profiles.is_referrer boolean` (default false)
- `teacher_profiles.referral_hourly_rate numeric`
- `teacher_profiles.referred_by uuid` (FK → `teacher_profiles.id`, plus an index)
- `teacher_earnings.is_referral_commission boolean` (default false)

## 2. Commission-creation logic (does not exist anywhere)
The page only *reads* referral-commission earnings (`teacher_earnings` where
`is_referral_commission = true`). Nothing currently *creates* those rows, so totals
would always show £0. A trigger or job must populate referral commissions when a
referred teacher earns — the rule (rate, trigger event, source amount) is a product
decision still to be made.

## 3. Wiring
- Un-comment the route + lazy import in `src/App.tsx`.
- Add a "Referrals" entry to the admin sidebar in `src/pages/AdminDashboard.tsx`
  (currently the route would only be reachable by direct URL).
