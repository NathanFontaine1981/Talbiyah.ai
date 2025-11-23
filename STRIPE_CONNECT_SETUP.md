# Stripe Connect Setup Guide

This guide covers the complete setup for Stripe Connect teacher payouts in Talbiyah.ai.

## Overview

The teacher earnings and payout system consists of:
- **Teacher Earnings Dashboard** (`/teacher/earnings`) - Teachers view their earnings, hold period, and payout history
- **Payment Settings** (`/teacher/payment-settings`) - Teachers configure Stripe Connect, bank details, or other payment methods
- **Admin Payouts** (`/admin/teacher-payouts`) - Admins process payouts (automatic via Stripe or manual)
- **Database Tables** - `teacher_earnings`, `teacher_payouts`, `teacher_payment_settings`
- **Edge Functions** - 3 functions for Stripe Connect integration

## Database Migration

The migration has already been applied:
- **File**: `supabase/migrations/20251114000000_create_teacher_earnings_system.sql`
- **Tables**: `teacher_payouts`, `teacher_earnings`, `teacher_payment_settings`
- **Functions**: `get_teacher_balance()`, `get_teacher_earnings_summary()`, `clear_held_earnings()`
- **Views**: `teacher_earnings_overview`
- **Triggers**: Auto-creates earnings when lesson status → `completed`

## Stripe Setup

### 1. Create Stripe Connect Platform Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Connect** → **Settings**
3. Configure your Connect platform:
   - Platform name: "Talbiyah.ai"
   - Support email: your support email
   - Branding: Upload logo and colors

### 2. Enable Connect in Stripe

1. In Stripe Dashboard, go to **Connect** → **Settings**
2. Under "Account types", enable **Express accounts** (recommended for teachers)
3. Set allowed countries: United Kingdom (GB)
4. Configure payout schedule (we handle this programmatically)

### 3. Get Stripe API Keys

1. Go to **Developers** → **API Keys**
2. Copy your **Secret key** (starts with `sk_live_` or `sk_test_`)
3. For testing, use **Test mode** keys

## Supabase Configuration

### 1. Set Secrets in Supabase

Go to your Supabase project → **Edge Functions** → **Secrets** and add:

```bash
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
FRONTEND_URL=https://your-domain.com (or http://localhost:5174 for dev)
```

You can also set these via CLI:

```bash
SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff" \
./node_modules/supabase/bin/supabase secrets set \
  --project-ref boyrjgivpepjiboekwuu \
  STRIPE_SECRET_KEY=sk_test_...

SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff" \
./node_modules/supabase/bin/supabase secrets set \
  --project-ref boyrjgivpepjiboekwuu \
  FRONTEND_URL=https://your-domain.com
```

### 2. Verify Edge Functions Are Deployed

All 3 functions have been deployed:
- ✅ `create-stripe-connect-account` - Creates Stripe Express account for teacher
- ✅ `stripe-connect-refresh` - Checks onboarding status
- ✅ `process-stripe-payout` - Processes automatic payout via Stripe

View them at: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/functions

## How It Works

### Teacher Onboarding Flow

1. Teacher navigates to `/teacher/payment-settings`
2. Clicks "Connect with Stripe"
3. Edge function creates Stripe Express account
4. Teacher is redirected to Stripe onboarding (fills in bank details, tax info, identity verification)
5. On completion, redirected back to `/teacher/payment-settings?success=true`
6. Frontend calls `stripe-connect-refresh` to verify onboarding complete
7. `stripe_onboarding_completed` set to `true` in database

### Earnings Flow

1. When lesson status → `completed`, trigger auto-creates `teacher_earnings` record:
   - Status: `held` (7-day hold period)
   - Amount: `teacher_rate * (duration_minutes / 60)`
   - Cleared date: `now() + 7 days`

2. After 7 days (can run manually or via cron):
   ```sql
   SELECT clear_held_earnings(); -- Returns count of cleared earnings
   ```
   This changes status from `held` → `cleared`

3. Teachers see breakdown in `/teacher/earnings`:
   - Pending (lesson not complete)
   - On Hold (7-day hold)
   - Ready for Payout (cleared)
   - Total Paid Out

### Payout Flow

#### Automatic (Stripe Connect)
1. Admin goes to `/admin/teacher-payouts`
2. Selects teachers with cleared balance
3. Clicks "Process Payouts"
4. For teachers with Stripe Connect:
   - Calls `process-stripe-payout` edge function
   - Creates Stripe transfer to teacher's connected account
   - Marks earnings as `paid`
   - Records payout in `teacher_payouts` table

#### Manual (Bank Transfer / PayPal)
1. Admin processes payout manually outside system
2. Clicks "Process Payouts" (marks as `completed` immediately)
3. Admin transfers money via bank/PayPal separately
4. Payout record created for tracking

## Testing

### Test Mode Setup

1. Use Stripe test keys (`sk_test_...`)
2. Set `FRONTEND_URL=http://localhost:5174`
3. Deploy functions with test keys

### Test Flow

1. **Create test teacher**:
   - Sign up as teacher, get approved
   - Navigate to `/teacher/payment-settings`
   - Click "Connect with Stripe" (uses test mode)

2. **Complete test onboarding**:
   - Use Stripe test account (any details work in test mode)
   - Use test bank account: `000123456780` (UK test account)
   - Use test sort code: `108800`

3. **Create test lesson and earnings**:
   ```sql
   -- Create completed lesson
   INSERT INTO lessons (teacher_id, learner_id, subject_id, scheduled_time, duration_minutes, status, teacher_rate_at_booking, platform_fee)
   VALUES (
     '<teacher_profile_id>',
     '<learner_id>',
     '<subject_id>',
     NOW() - INTERVAL '1 hour',
     60,
     'completed',
     15.00,
     3.00
   );

   -- Manually clear the earning (skip 7-day wait)
   UPDATE teacher_earnings SET status = 'cleared' WHERE status = 'held';
   ```

4. **Test payout**:
   - Go to `/admin/teacher-payouts`
   - Select teacher
   - Process payout
   - Check Stripe Dashboard → Transfers to see test payout

### Stripe Test Cards

For testing payments (student side):
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires 3DS: `4000 0025 0000 3155`

## Production Checklist

Before going live:

- [ ] Switch to Stripe live keys in Supabase secrets
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Enable Stripe Connect in live mode
- [ ] Set up Stripe webhook (optional, for payout notifications)
- [ ] Test with real bank account in Stripe test mode first
- [ ] Configure minimum payout threshold (default £50)
- [ ] Set up monitoring for failed payouts
- [ ] Add payout notification emails to teachers
- [ ] Configure cron job to run `clear_held_earnings()` daily
- [ ] Review and set platform fee percentages
- [ ] Ensure proper tax handling (VAT, UTR tracking)

## Cron Job for Clearing Held Earnings

You can set up a daily cron job (via Supabase Edge Functions or external service):

```typescript
// supabase/functions/clear-held-earnings-cron/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data, error } = await supabase.rpc('clear_held_earnings')

  return new Response(
    JSON.stringify({ cleared_count: data, error }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

Then set up in Supabase Dashboard → Edge Functions → Cron Jobs

## Webhook Setup (Optional but Recommended)

To receive Stripe payout events (success/failure notifications):

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Add endpoint: `https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `transfer.created`
   - `transfer.updated`
   - `transfer.failed`
   - `account.updated`
4. Copy webhook signing secret
5. Add to Supabase secrets: `STRIPE_WEBHOOK_SECRET=whsec_...`

## Security Notes

- ✅ Bank details stored in database (should be encrypted at rest in production)
- ✅ RLS policies ensure teachers only see own data
- ✅ Admin-only access for payout processing
- ✅ 7-day hold period protects against chargebacks
- ✅ Stripe handles PCI compliance for bank details (via Connect)
- ⚠️ Consider encrypting `bank_account_number` and `bank_sort_code` fields
- ⚠️ Add rate limiting to edge functions
- ⚠️ Log all payout attempts for audit trail (already done via `payment_logs`)

## Troubleshooting

### Teacher can't connect Stripe account
- Check `FRONTEND_URL` is set correctly
- Verify Stripe keys are live/test matching your mode
- Check edge function logs: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/functions

### Payout fails
- Check teacher has completed Stripe onboarding (`stripe_onboarding_completed = true`)
- Verify Stripe account is active (not restricted)
- Check cleared balance is > 0
- View edge function logs for error details

### Earnings not auto-creating
- Verify trigger exists: `trigger_create_earning_on_lesson_complete`
- Check lesson has `teacher_rate_at_booking` set
- Ensure lesson status changed to exactly `'completed'`

### Held earnings not clearing
- Run manually: `SELECT clear_held_earnings();`
- Set up cron job (see above)
- Check `cleared_at` timestamp is in the past

## Support

For Stripe issues:
- Stripe Support: https://support.stripe.com
- Stripe Connect Docs: https://stripe.com/docs/connect

For edge function issues:
- View logs: `SUPABASE_ACCESS_TOKEN="sbp_..." ./node_modules/supabase/bin/supabase functions logs process-stripe-payout --project-ref boyrjgivpepjiboekwuu`

## Summary of URLs

- **Teacher Earnings**: `/teacher/earnings`
- **Payment Settings**: `/teacher/payment-settings`
- **Admin Payouts**: `/admin/teacher-payouts`
- **Supabase Functions**: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/functions
- **Stripe Dashboard**: https://dashboard.stripe.com/connect/accounts/overview

---

## What's Next

Optional enhancements:
1. Email notifications when payout is processed
2. PDF invoice generation for teachers
3. Automatic payout scheduling (weekly/monthly)
4. Multi-currency support
5. Wise/PayPal API integration for non-Stripe payouts
6. Real-time payout status updates via webhooks
7. Teacher payout request feature
8. Payout analytics and reporting
