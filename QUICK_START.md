# 🚀 QUICK START - FIX STRIPE NOW

## What You Need (5 minutes)

Go to Stripe Dashboard in **TEST MODE**:
https://dashboard.stripe.com/test/apikeys

Copy these 3 keys:

### 1. Publishable Key
- Shows on API keys page
- Starts with `pk_test_...`

### 2. Secret Key
- Click "Reveal test key token"
- Starts with `sk_test_...`

### 3. Webhook Secret
- Go to: https://dashboard.stripe.com/test/webhooks
- Click "Add endpoint"
- URL: `https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhook`
- Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- Click "Add endpoint"
- Copy the "Signing secret" (starts with `whsec_...`)

## Run Setup (2 minutes)

```bash
./setup-stripe.sh
```

Paste your 3 keys when prompted.

The script does everything automatically:
- Updates .env
- Sets Supabase secrets
- Deploys webhook
- Tests configuration

## Test It Works (2 minutes)

```bash
npm run dev
```

Go to http://localhost:5174

Book a lesson, use test card:
- Card: `4242 4242 4242 4242`
- Expiry: `12/25`
- CVC: `123`

Payment should complete and lesson appear immediately.

## Done! 🎉

Your Stripe integration is now working properly with TEST keys.

No real money will be charged until you switch to live keys later.
