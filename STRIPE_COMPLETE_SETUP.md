# 🔧 COMPLETE STRIPE SETUP - FRESH START

This guide will set up Stripe properly from scratch, no manual work needed.

## Current Problems

1. ❌ Using LIVE keys (charging real money in test mode)
2. ❌ Webhook secret is placeholder
3. ❌ Webhook not working
4. ❌ Payments succeed but lessons not created

## The Fix (Step-by-Step)

### STEP 1: Get Your Stripe TEST Keys (2 minutes)

**You need to do this part manually:**

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Make sure you're in **TEST MODE** (toggle in top right should say "Test mode")
3. Copy these 3 things:

   **a) Publishable key** (starts with `pk_test_...`)
   - Click "Reveal test key" if needed
   - Copy the full key

   **b) Secret key** (starts with `sk_test_...`)
   - Click "Reveal test key token"
   - Copy the full key

   **c) Webhook signing secret** - Set this up:
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhook`
   - Description: "Talbiyah.ai Payment Webhook"
   - Select these events:
     * `checkout.session.completed`
     * `payment_intent.succeeded`
     * `payment_intent.payment_failed`
     * `charge.refunded`
   - Click "Add endpoint"
   - **Copy the "Signing secret"** (starts with `whsec_...`)

### STEP 2: Run the Automated Setup Script

Once you have the 3 keys above, run this command:

```bash
./setup-stripe.sh
```

The script will ask you to paste:
1. Your test publishable key (`pk_test_...`)
2. Your test secret key (`sk_test_...`)
3. Your webhook signing secret (`whsec_...`)

It will automatically:
- Update your `.env` file with test keys
- Set Supabase secrets
- Redeploy the webhook function
- Test the webhook
- Verify everything works

### STEP 3: Test Payment Flow (5 minutes)

After setup completes:

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Open: http://localhost:5174

3. Book a lesson and use test card:
   - **Card**: `4242 4242 4242 4242`
   - **Expiry**: `12/25`
   - **CVC**: `123`
   - **Name**: Test Student
   - **Postcode**: `SW1A 1AA`

4. Complete payment

5. Should see:
   - ✅ Payment success page
   - ✅ Lesson appears immediately
   - ✅ No polling/waiting
   - ✅ Lesson shows in dashboard

## What the Script Does

The setup script (`setup-stripe.sh`) will:

1. ✅ Validate your Stripe keys
2. ✅ Update `.env` file with test keys
3. ✅ Set Supabase secrets:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
4. ✅ Redeploy `stripe-webhook` function
5. ✅ Test webhook endpoint
6. ✅ Verify webhook responds correctly
7. ✅ Show you a summary of what's configured

## Verification Checklist

After running the script, verify:

- [ ] `.env` has `pk_test_...` (not `pk_live_...`)
- [ ] Webhook function deployed successfully
- [ ] Test payment creates lesson
- [ ] Lesson appears in student dashboard
- [ ] No console errors
- [ ] No "Invalid API key" errors

## Testing Different Scenarios

Once basic flow works, test:

1. **Successful payment**: Card `4242 4242 4242 4242`
2. **Declined card**: Card `4000 0000 0000 0002`
3. **Insufficient funds**: Card `4000 0000 0000 9995`

## Going Live Later

When ready to accept real payments:

1. Get LIVE keys from Stripe dashboard
2. Create LIVE webhook endpoint
3. Run setup script again with live keys
4. Test with small real payment
5. Monitor closely

## Troubleshooting

If setup script fails:

1. **"Invalid Stripe key"**
   - Double-check you copied the full key
   - Make sure you're in TEST mode in Stripe dashboard

2. **"Webhook deployment failed"**
   - Check Supabase access token is valid
   - Check network connection

3. **"Test webhook returned 400"**
   - Webhook secret might be wrong
   - Check you copied the signing secret from the correct webhook endpoint

4. **Payment succeeds but lesson not created**
   - Check Supabase function logs
   - Check webhook events in Stripe dashboard
   - Verify webhook URL is correct

## Need Help?

If anything doesn't work after running the setup script, check:

1. **Supabase function logs**:
   ```bash
   SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff" \
   ./node_modules/supabase/bin/supabase functions list
   ```

2. **Stripe webhook events**:
   - Go to: https://dashboard.stripe.com/test/events
   - Check recent webhook deliveries

3. **Browser console** for errors

---

**Ready to start? Get your 3 Stripe keys and run `./setup-stripe.sh`**
