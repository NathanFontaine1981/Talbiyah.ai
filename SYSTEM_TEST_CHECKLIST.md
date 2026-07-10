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

### 1. ⬜ Booking + payment end-to-end — HIGHEST RISK
`initiate-booking-checkout` and `stripe-webhook` jumped from Feb 11/15 code to July code on Jul 9.
- [ ] As a student/parent: book a single lesson through checkout → Stripe payment succeeds → lesson appears with a room, teacher notified, booking-confirmation email arrives (July work changed booking emails).
- [ ] Book with a credit/hours balance (no Stripe) if applicable.
- [ ] Admin session booking (reworked in `f639dca`): Admin → book a session for a student → lesson created correctly, no duplicate emails.
- [ ] Check Stripe dashboard: webhook deliveries show 200s (no signature or handler errors) since Jul 9.

### 2. ⬜ Payouts
- [ ] Teacher → Payment Settings: TapTap Send / Revolut / international options appear and **save** (revolut_detail persists).
- [ ] Admin → Teacher Payouts: page loads, recipient details visible, can process a manual payout; `requested` status displays.
- [ ] **Monthly run fires Aug 1, 06:00 UTC — it will REALLY pay Stripe Connect teachers and email you a summary.** Either watch it live on Aug 1, or dry-run before then by invoking `monthly-teacher-payouts` with the service key *knowing it executes real transfers*. Recommend: review teacher payment settings + owed amounts before Aug 1.
- [ ] Wise (optional, Step 3 of DEPLOY_CHECKLIST): secrets not set; TapTap manual is primary. Skip unless enabling Wise.

### 3. ⬜ Teacher agreement gate
- [ ] Log in as an approved teacher → redirected to agreement → tick all sections + type name + confirm → lands on hub.
- [ ] Log out / back in → NOT re-prompted.
- [ ] Note: every existing approved teacher gets prompted on next login (intended) — expect questions from teachers.

### 4. ⬜ Admin tools (new)
- [ ] "Act as Student" impersonation: enter/exit cleanly, actions logged to `admin_impersonation_log`, comped bookings gated correctly (hardening in `6e8dc93`).
- [ ] Admin → Sessions → "Join Room": joins the live 100ms room as visible host "Admin (name)", can see/hear/talk. (Purely additive; safe to test on a real lesson.)

### 5. ⬜ Onboarding & student experience
- [ ] Teacher → Resources: "How to Teach Qur'an" guide renders as formatted markdown.
- [ ] Onboarding checklist circles clickable, persist across devices (`teacher_onboarding_completions`).
- [ ] Student joins a lesson → "how lessons work" walkthrough appears **once** (not again on next lesson).

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
