# Stripe Checkout Setup Guide

## Current Status
✅ Edge Function Created: `supabase/functions/initiate-booking-checkout/index.ts`
✅ Frontend Integration: Complete
❌ Stripe Keys: Need to be configured
❌ Edge Function: Needs to be deployed

## Step 1: Get Your Stripe Keys

1. Go to **Stripe Dashboard**: https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (click "Reveal test key", starts with `sk_test_`)

## Step 2: Configure Local Environment

Update your `.env` file with your Stripe keys:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

## Step 3: Deploy Edge Function to Supabase

### Option A: Using Supabase CLI (Recommended)

```bash
# 1. Install Supabase CLI (if not already installed)
npm install -g supabase

# 2. Login to Supabase
npx supabase login

# 3. Link your project
npx supabase link --project-ref boyrjgivpepjiboekwuu

# 4. Deploy the edge function
npx supabase functions deploy initiate-booking-checkout

# 5. Set environment secrets in Supabase
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
```

### Option B: Using Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/functions
2. Click "Deploy a new function"
3. Name: `initiate-booking-checkout`
4. Copy the entire content from `supabase/functions/initiate-booking-checkout/index.ts`
5. Paste into the editor
6. Click "Deploy function"

## Step 4: Set Stripe Secret in Supabase

**IMPORTANT:** The edge function runs on Supabase's servers, so you need to set the Stripe key there!

### Using Supabase CLI:
```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE --project-ref boyrjgivpepjiboekwuu
```

### Using Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/settings/functions
2. Click "Add new secret"
3. Name: `STRIPE_SECRET_KEY`
4. Value: Your Stripe secret key (sk_test_...)
5. Click "Save"

## Step 5: Test the Checkout

1. Restart your dev server:
```bash
npm run dev
```

2. Add lessons to cart
3. Click "Proceed to Checkout"
4. You should be redirected to Stripe's checkout page

## Step 6: Test with Stripe Test Cards

Once on the Stripe checkout page, use these test cards:

- **Success:** `4242 4242 4242 4242`
- **Requires authentication:** `4000 0025 0000 3155`
- **Declined:** `4000 0000 0000 9995`

Use:
- Any future expiry date (e.g., 12/25)
- Any 3-digit CVC (e.g., 123)
- Any 5-digit ZIP (e.g., 12345)

## Troubleshooting

### "Failed to fetch" error:
- ✅ Check Stripe secret key is set in Supabase
- ✅ Check edge function is deployed
- ✅ Check browser console for detailed error

### "Stripe secret key not found" error:
- The `STRIPE_SECRET_KEY` environment variable is not set in Supabase
- Run: `npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...`

### Edge function not found (404):
- The edge function hasn't been deployed yet
- Run: `npx supabase functions deploy initiate-booking-checkout`

### Check Edge Function Logs:
```bash
npx supabase functions logs initiate-booking-checkout
```

Or in Supabase Dashboard:
https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/functions/logs

## Success URLs

After successful payment, users will be redirected to:
- **Success:** `/success?session_id={CHECKOUT_SESSION_ID}`
- **Cancel:** `/booking`

Make sure these routes exist in your app!

## Webhook Setup (For Production)

The webhook endpoint already exists: `/stripe-webhooks`

To test webhooks locally:
```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhooks
```

## What Happens on Checkout:

1. User clicks "Proceed to Checkout"
2. Frontend calls `initiate-booking-checkout` edge function
3. Edge function:
   - Validates bookings
   - Checks for conflicts
   - Creates pending booking record
   - Creates Stripe checkout session
   - Returns checkout URL
4. User is redirected to Stripe
5. User enters payment details
6. Stripe processes payment
7. Webhook receives `checkout.session.completed` event
8. Lesson bookings are confirmed in database
9. User is redirected to success page

## Environment Variables Summary

### Local (.env file):
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...  # Only for local Supabase functions
```

### Supabase Dashboard (Edge Function Secrets):
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Both need to be set for the checkout to work!
