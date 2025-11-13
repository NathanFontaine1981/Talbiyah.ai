# Fix Stripe Checkout - Quick Start

## The Problem
"Failed to fetch" error when clicking "Proceed to Checkout"

## The Solution (3 Steps)

### Step 1: Get Stripe Keys (2 minutes)

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your keys:
   - **Publishable key:** `pk_test_...`
   - **Secret key:** `sk_test_...` (click "Reveal test key")

### Step 2: Update .env File (1 minute)

Replace the placeholder values in `.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
```

### Step 3: Deploy to Supabase (2 minutes)

**Option A - Automated (Recommended):**
```bash
./deploy-stripe.sh
```

**Option B - Manual:**
```bash
# 1. Login to Supabase
npx supabase login

# 2. Link project
npx supabase link --project-ref boyrjgivpepjiboekwuu

# 3. Deploy edge function
npx supabase functions deploy initiate-booking-checkout

# 4. Set Stripe secret (replace with your actual key)
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY
```

## Test It!

1. Restart dev server: `npm run dev`
2. Add lessons to cart
3. Click "Proceed to Checkout"
4. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

## That's It!

You should now be redirected to Stripe's checkout page.

## Troubleshooting

### Still getting "failed to fetch"?

**Check edge function is deployed:**
```bash
npx supabase functions list
```
You should see `initiate-booking-checkout` in the list.

**Check Stripe secret is set:**
```bash
npx supabase secrets list
```
You should see `STRIPE_SECRET_KEY` in the list.

**View edge function logs:**
```bash
npx supabase functions logs initiate-booking-checkout
```

### Need more help?

Read the full guide: `STRIPE_SETUP_GUIDE.md`

Or check Supabase dashboard:
- Functions: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/functions
- Secrets: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/settings/functions
- Logs: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/functions/logs
