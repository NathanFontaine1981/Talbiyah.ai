# System Test Checklist — July 2026 Releases

Covers everything shipped in the `feat/welcome-intake` merges (booking rework, international payouts, teacher agreement, impersonation, recordings sweep, admin join room). Deployment finished **Jul 9 2026**; this file tracks what has actually been **tested**, not just deployed.

**Legend:** ✅ verified · 🟡 passively verified (logs/schema only, flow not exercised) · ⬜ not tested

---

## Part A — Deployment verification (done Jul 9, automated)

These confirm production matches main. They are *not* functional tests.

| Check | Result |
|---|---|
| DB: teacher agreement columns on `teacher_profiles` | ✅ present |
| DB: `insight_issue_reports`, `teacher_onboarding_completions`, `admin_impersonation_log` tables | ✅ present |
| DB: `lessons.insight_recovery_alerted` column | ✅ applied Jul 9 |
| DB: `revolut` in both payout-method constraints; `requested` in payout status | ✅ applied Jul 9 |
| DB: Qur'an teaching guide seeded in `onboarding_resources` | ✅ 1 row |
| Edge functions: all 10 stale/missing functions redeployed | ✅ Jul 9 07:20–07:24 UTC |
| `stripe-webhook` still public (`verify_jwt=false`) | ✅ confirmed post-deploy |
| pg_cron: sweep every 30 min, course reminders every 30 min, monthly payouts 1st @ 06:00 UTC | ✅ all active |
| Sweep ran on new version (v5) after deploy | ✅ 200 OK at 07:30 UTC Jul 9 |
| main pushed → Netlify frontend build | ✅ |

---

## Part B — Functional flows (NOT yet tested)

Ordered by risk. Items 1–2 touch money and were running **February code until Jul 9** — test these first.

### 1. ✅ Booking + payment end-to-end — TESTED LIVE Jul 10 (found & fixed 6 bugs)
`initiate-booking-checkout` and `stripe-webhook` jumped from Feb 11/15 code to July code on Jul 9.
- [x] **Card path** (Jul 10, £15 live payment, then refunded/comped): checkout session → Stripe payment → webhook created lesson with room + both codes, payment intent attached, marked completed/paid. Pending booking flipped to `paid`.
- [x] **Credits path** (Jul 10, inadvertent first test): booking + room worked; exposed bugs 1–3 below.
- [ ] Admin session booking (reworked in `f639dca`): Admin → book a session for a student → lesson created correctly, no duplicate emails. *(still untested)*
- [x] Webhook returned 200 and processed correctly for the live payment.

**Bugs found by this test — all fixed & deployed Jul 10:**
1. Credits-paid lessons stayed `pending` — update wrote non-existent `lessons.price` column (silent failure).
2. Same update wrote `payment_status: 'paid'` — constraint only allows `completed` etc.
3. `Checkout.tsx` didn't handle the `paid_with_credits` response → false "No checkout URL received" error (double-charge risk on retry).
4. `stripe-webhook` + `initiate-booking-checkout` selected non-existent `teacher_profiles.email` → student email said "Teacher" instead of the name and the **teacher notification email never sent**.
5. `PaymentSuccess.tsx` looked up the teacher name with the wrong ID → no name on the success page.
6. `stripe-webhook` wrote pending_bookings statuses `completed`/`failed`, both outside the check constraint → paid bookings stuck at `pending`.

### 2. ✅ Payouts — TESTED LIVE Jul 11 (found & fixed 4 pipeline-killing bugs)
- [x] Teacher → Payment Settings: saved TapTap/Revolut/bank details for Nathan Fontaine, persisted correctly.
- [x] Full pipeline dry-run with a real £3 test payout: lesson completed → trigger created earning → cleared → monthly run queued it (`requested`, taptap_send) → admin summary email arrived → admin Approve → payout `completed`, earning `paid` + linked.
- [x] Monthly run invoked manually and verified — Aug 1 cron will run the same code.
- [ ] Wise (optional): secrets not set; TapTap manual is primary. Skip unless enabling Wise.

**Bugs found by this test — all fixed Jul 11 (see `supabase/migrations/20260711000000_payout_pipeline_fixes.sql`):**
1. Earnings trigger was **disabled** — no teacher earnings recorded for any completed lesson (54 lessons had none).
2. Even enabled it crashed: `ON CONFLICT (lesson_id)` had no matching unique constraint — this crash is why it was disabled. Constraint added.
3. The shelved referral-commission trigger beneath it had a broken `search_path` — every earnings insert exploded. Pinned.
4. Nothing ever ran `clear_held_earnings` — now a daily 03:00 UTC pg_cron job (Osama's Nov earnings had been stuck 7 months).

**Decisions & data fixes:** historical backfill skipped (teachers settled off-platform); Osama flagged `is_legacy_teacher` (imam-paid), his £8 held earnings cancelled, and the trigger now exempts legacy-billed teachers. **Data quality:** Mariam's TapTap phone lacks +20 country code — ask her to re-save.
**Watch-out:** admin Approve silently no-ops if done from a non-admin session (RLS 0-row update) — always approve from the admin account.

### 3. ✅ Teacher agreement gate — TESTED LIVE Jul 11
- [x] Approved teacher without acceptance → redirected to agreement → signed → recorded (name + version + timestamp verified in DB).
- [x] **Bug found & fixed:** after signing, client-side navigation bounced the teacher back to the agreement until a hard refresh (ProtectedRoute caches its verdict across routes) — now a full-page redirect.
- [ ] Passive check: next teacher login should NOT re-prompt (report if it ever does).
- Note: 5 teachers still unsigned (Aasiya, Ahmad, Hajar, Karim, Shumaila) — they'll be prompted on next login; admin can track via the new compliance badges.

### 4. ✅ Admin tools — impersonation Jul 11; Join Room Jul 12 (found & fixed 2 more bugs)
- [x] Impersonation: works for teachers too (label said "Act as Student" — misleading, now "Act as User"); all sessions logged to `admin_impersonation_log` with admin/target/start/end. Note: closing the tab instead of exiting leaves `ended_at` null.
- [x] Admin Join Room (from phone, Jul 12): admin entered the lesson room as visible host. Two stacked bugs found on the way:
  1. Expired phone session → bare gateway 401 shown as "non-2xx" (monitor now refreshes the session and says re-login plainly).
  2. **Join Room had NEVER worked**: the June payout work added a second teacher_profiles→profiles FK (`rate_override_by`), making the function's embed ambiguous (PGRST201) — every join 404'd as "Lesson not found". Embed pinned to `user_id` FK.
- [ ] Admin books a session FOR a student (carried over from Test 1): one lesson, no duplicate emails.

### 5. 🟡 Onboarding & student experience — mostly verified Jul 11
- [x] Teacher → Resources: guide opens and renders; method card now deep-links straight to it (`?open=` param — was dumping teachers at the resource list).
- [x] Mark-as-read persists (`teacher_onboarding_progress` row verified in DB).
- [ ] Sunday: student "how lessons work" walkthrough appears once, followed by the NEW Qur'an-journey welcome (method, hadith, ask-your-teacher, study-notes habit — added Jul 11).

### 6. ⬜ Lesson lifecycle edge cases
- [ ] End Session → "student didn't show up" → recorded as no-show, NOT counted as completed/paid hours.
- [ ] Teacher hours counter increments correctly after a completed lesson (`check-tier-progression` column fix, Jul 6).

### 7. 🟡 Recordings & insights pipeline
- Sweep runs every 30 min on new code (verified in logs). Recovery function redeployed.
- [ ] Optional active test: after the next real lesson, confirm recording + insights arrive; if a recording fails, confirm exactly ONE admin alert (the `insight_recovery_alerted` flag exists precisely for this).
- [ ] Student "notify us" button on missing insights → admin email arrives + row in `insight_issue_reports`.

---

## Sign-off

| Area | Tested by | Date | Result |
|---|---|---|---|
| Booking + Stripe | | | |
| Payouts | | | |
| Teacher agreement | | | |
| Admin tools | | | |
| Onboarding/student | | | |
| No-show / hours | | | |
| Recordings/insights | | | |
