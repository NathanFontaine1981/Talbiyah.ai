# Environment Variables Configuration Guide

## Overview

Your Edge Functions have been successfully deployed to Supabase! However, you need to configure the following environment variables to enable Stripe payments and 100ms video conferencing.

## Status

✅ **Completed:**
- Supabase CLI installed
- Project linked (boyrjgivpepjiboekwuu)
- All Edge Functions deployed
- HMS_TEMPLATE_ID configured (684b54d6033903926e6127a1)

⚠️ **Pending Configuration:**
- Stripe Secret Key
- Stripe Webhook Secret
- 100ms (HMS) API Credentials

---

## Required Environment Variables

### 1. Stripe Configuration

#### STRIPE_SECRET_KEY
**Where to find it:**
1. Log in to your Stripe Dashboard at https://dashboard.stripe.com
2. Click on "Developers" in the left sidebar
3. Click on "API keys"
4. Copy your "Secret key" (starts with `sk_test_` for test mode or `sk_live_` for production)

**How to set it:**
```bash
export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"
npx supabase secrets set STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE" --project-ref boyrjgivpepjiboekwuu
```

#### STRIPE_WEBHOOK_SECRET
**Where to find it:**
1. In Stripe Dashboard, go to "Developers" > "Webhooks"
2. Click "Add endpoint" or select your existing webhook
3. Set the endpoint URL to: `https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhooks`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the "Signing secret" (starts with `whsec_`)

**How to set it:**
```bash
export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"
npx supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_YOUR_SECRET_HERE" --project-ref boyrjgivpepjiboekwuu
```

### 2. 100ms (HMS) Configuration

#### HMS_APP_ACCESS_KEY and HMS_APP_SECRET
**Where to find them:**
1. Log in to your 100ms Dashboard at https://dashboard.100ms.live
2. Select your "Azhari Academy" app (or the app you used in the old platform)
3. Go to "Developer" section
4. Copy your "App Access Key" and "App Secret"

**How to set them:**
```bash
export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"
npx supabase secrets set HMS_APP_ACCESS_KEY="YOUR_ACCESS_KEY_HERE" --project-ref boyrjgivpepjiboekwuu
npx supabase secrets set HMS_APP_SECRET="YOUR_SECRET_HERE" --project-ref boyrjgivpepjiboekwuu
```

---

## Quick Setup Script

Once you have all your credentials, you can set them all at once:

```bash
#!/bin/bash
export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"
PROJECT_REF="boyrjgivpepjiboekwuu"

# Set Stripe credentials
npx supabase secrets set STRIPE_SECRET_KEY="YOUR_STRIPE_SECRET_KEY" --project-ref $PROJECT_REF
npx supabase secrets set STRIPE_WEBHOOK_SECRET="YOUR_STRIPE_WEBHOOK_SECRET" --project-ref $PROJECT_REF

# Set 100ms credentials
npx supabase secrets set HMS_APP_ACCESS_KEY="YOUR_HMS_APP_ACCESS_KEY" --project-ref $PROJECT_REF
npx supabase secrets set HMS_APP_SECRET="YOUR_HMS_APP_SECRET" --project-ref $PROJECT_REF

echo "✅ All environment variables configured!"
```

---

## Verification

After setting all environment variables, verify they're configured:

```bash
export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"
npx supabase secrets list --project-ref boyrjgivpepjiboekwuu
```

You should see the following secrets:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- HMS_APP_ACCESS_KEY
- HMS_APP_SECRET
- HMS_TEMPLATE_ID (already configured)

---

## Testing Your Configuration

### Test Stripe Integration
1. Log in to your app as a parent/student
2. Go to "Book a Session"
3. Select a teacher and time slot
4. Click "Book Session"
5. You should be redirected to Stripe Checkout
6. Use Stripe test card: `4242 4242 4242 4242`

### Test 100ms Video Integration
1. Book a session (as above)
2. Wait until 5 minutes before the session start time
3. Click "Join Session"
4. You should enter a 100ms video room

---

## Troubleshooting

### "STRIPE_SECRET_KEY is not defined"
- Make sure you set the environment variable in Supabase (not just in your local .env)
- Verify with `supabase secrets list`

### "Invalid webhook signature"
- Make sure your webhook endpoint in Stripe is: `https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhooks`
- Verify you copied the correct webhook secret from Stripe

### "HMS credentials not found"
- Make sure you're using the same 100ms app that was used in the old platform
- Verify the credentials are from the correct environment (test vs production)

---

## Alternative: Set via Supabase Dashboard

If you prefer using the UI:

1. Go to https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/settings/functions
2. Scroll to "Secrets"
3. Click "Add secret"
4. Enter the name and value for each secret
5. Click "Save"

---

## Next Steps

Once all environment variables are configured:
1. ✅ Test Stripe payment flow
2. ✅ Test 100ms video rooms
3. ✅ Monitor Edge Function logs for any errors
4. ✅ Set up production Stripe webhook when ready to go live

---

## Support

If you encounter issues:
- Check Edge Function logs: `npx supabase functions logs [function-name]`
- View logs in Dashboard: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/functions
- Test functions using the "Invoke" feature in the Dashboard
