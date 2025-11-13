# Booking, Payment & 100ms Integration Status

## 🎯 Complete Flow Overview

```
1. User adds lessons to cart ✅
   ↓
2. User clicks "Proceed to Checkout" ✅
   ↓
3. Frontend calls: initiate-booking-checkout ⚠️ (needs deployment)
   ↓
4. Creates pending booking in database ✅
   ↓
5. Creates Stripe checkout session ⚠️ (needs Stripe keys)
   ↓
6. User redirected to Stripe ⚠️ (needs deployment)
   ↓
7. User enters payment details on Stripe ⚠️
   ↓
8. Stripe processes payment ⚠️
   ↓
9. Stripe webhook: checkout.session.completed ⚠️ (needs deployment)
   ↓
10. Webhook calls: create-single-booking-internal ✅ (just created!)
    ↓
11. Creates 100ms room with room codes ⚠️ (needs HMS token)
    ↓
12. Creates booking record in database ✅
    ↓
13. User can join lesson ⚠️
```

## 📊 Current Status

### ✅ What's Working

1. **Frontend Integration**
   - Cart system: `src/contexts/CartContext.tsx` ✅
   - Checkout page: `src/pages/Checkout.tsx` ✅
   - Booking API hook: `src/hooks/useBookingAPI.ts` ✅

2. **Database Schema**
   - `bookings` table ✅
   - `pending_bookings` table ✅
   - `cart_items` table ✅
   - `payments` table ✅

3. **Edge Functions Created**
   - `initiate-booking-checkout` ✅ (needs deployment)
   - `stripe-webhooks` ✅ (needs deployment)
   - `create-hms-room` ✅ (needs deployment)
   - `create-single-booking-internal` ✅ (just created, needs deployment)
   - `get-available-slots` ✅

### ⚠️ What Needs Configuration

1. **Stripe Keys** (CRITICAL)
   - `VITE_STRIPE_PUBLISHABLE_KEY` - Frontend
   - `STRIPE_SECRET_KEY` - Supabase Edge Functions
   - `STRIPE_WEBHOOK_SECRET` - Webhook verification

2. **100ms Keys** (CRITICAL)
   - `HMS_MANAGEMENT_TOKEN` - For creating rooms
   - `HMS_APP_ACCESS_KEY` - For generating auth tokens
   - `HMS_APP_SECRET` - For generating auth tokens

3. **Edge Function Deployment**
   - `initiate-booking-checkout` ❌ Not deployed
   - `stripe-webhooks` ❌ Not deployed
   - `create-hms-room` ❌ Not deployed
   - `create-single-booking-internal` ❌ Not deployed

## 🚀 Deployment Requirements

### Step 1: Set Environment Variables

**In `.env` file (for local development):**
```env
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 100ms
HMS_MANAGEMENT_TOKEN=...
HMS_APP_ACCESS_KEY=...
HMS_APP_SECRET=...
```

**In Supabase Dashboard (for production):**
```
https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/settings/functions

Add these secrets:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- HMS_MANAGEMENT_TOKEN
- HMS_APP_ACCESS_KEY
- HMS_APP_SECRET
```

### Step 2: Deploy Edge Functions

```bash
# Deploy all functions
npx supabase functions deploy initiate-booking-checkout
npx supabase functions deploy stripe-webhooks
npx supabase functions deploy create-hms-room
npx supabase functions deploy create-single-booking-internal
npx supabase functions deploy get-available-slots
```

### Step 3: Configure Stripe Webhook

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhooks`
4. Events to send:
   - `checkout.session.completed`
5. Copy the signing secret
6. Set as `STRIPE_WEBHOOK_SECRET` in Supabase

## 📋 Function Details

### 1. `initiate-booking-checkout`
**Purpose:** Creates Stripe checkout session for cart items
**Status:** ✅ Code complete, ❌ Not deployed
**Requires:**
- `STRIPE_SECRET_KEY`
- Access to `pending_bookings` table
**What it does:**
- Validates booking data
- Checks for time slot conflicts
- Calculates pricing
- Creates pending booking record
- Creates Stripe checkout session
- Returns checkout URL

### 2. `stripe-webhooks`
**Purpose:** Handles payment completion from Stripe
**Status:** ✅ Code complete, ❌ Not deployed
**Requires:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
**What it does:**
- Receives `checkout.session.completed` event
- Fetches pending booking
- Calls `create-single-booking-internal` for each lesson
- Updates pending booking status
- Records payment

### 3. `create-single-booking-internal`
**Purpose:** Creates individual booking with 100ms room
**Status:** ✅ Code complete, ❌ Not deployed
**Requires:**
- All 100ms environment variables
- Access to database
**What it does:**
- Calls `create-hms-room` to create 100ms room
- Creates booking record in database
- Links room codes to booking
- Handles free session logic

### 4. `create-hms-room`
**Purpose:** Creates 100ms video room with codes
**Status:** ✅ Code complete, ❌ Not deployed
**Requires:**
- `HMS_MANAGEMENT_TOKEN`
**What it does:**
- Creates room via 100ms API
- Generates room codes for teacher/student
- Validates codes are working
- Returns room ID and codes

### 5. `get-available-slots`
**Purpose:** Gets teacher availability
**Status:** ✅ Code complete, ✅ Working
**Already deployed and functional**

## 🔑 Where to Get Keys

### Stripe Keys
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy:
   - **Publishable key:** `pk_test_...`
   - **Secret key:** Click "Reveal test key" → `sk_test_...`
3. For webhook secret:
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Create endpoint
   - Copy signing secret

### 100ms Keys
1. Go to: https://dashboard.100ms.live/
2. Select your project
3. Go to "Developer" section
4. Copy:
   - **Management Token**
   - **App Access Key**
   - **App Secret**
5. Note your template ID: `684b54d6033903926e6127a1`

## ⚡ Quick Deploy Script

I've created `deploy-all-functions.sh` to deploy everything at once:

```bash
chmod +x deploy-all-functions.sh
./deploy-all-functions.sh
```

## 🧪 Testing Flow

### After Deployment:

1. **Test Checkout:**
```
1. Add lessons to cart
2. Click "Proceed to Checkout"
3. Should redirect to Stripe
```

2. **Test Payment:**
```
Use test card: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
ZIP: 12345
```

3. **Test Webhook:**
```
Check Supabase logs:
npx supabase functions logs stripe-webhooks

Should see:
✅ Payment succeeded
✅ Creating bookings with HMS rooms
✅ Room created
✅ Booking created
```

4. **Test Booking Creation:**
```
Check database:
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 1;

Should have:
- room_id
- teacher_room_code
- student_room_code
- status = 'confirmed'
- payment_status = 'paid'
```

## 🐛 Troubleshooting

### "Failed to fetch" error:
- ✅ Edge function not deployed
- ✅ Stripe keys not set
- Check: `npx supabase functions list`

### Payment succeeds but no booking created:
- ✅ Webhook not configured
- ✅ `create-single-booking-internal` not deployed
- Check: `npx supabase functions logs stripe-webhooks`

### Booking created but no room codes:
- ✅ HMS keys not set
- ✅ `create-hms-room` not deployed
- Check: `npx supabase functions logs create-hms-room`

### Room codes don't work:
- ✅ HMS template not configured
- ✅ Template ID incorrect
- Check: https://dashboard.100ms.live/templates

## 📈 Success Metrics

After everything is deployed and configured, you should see:

1. ✅ User can complete checkout
2. ✅ Payment appears in Stripe dashboard
3. ✅ Booking appears in database
4. ✅ 100ms room is created
5. ✅ Room codes are generated
6. ✅ Teacher and student can join lesson

## 🎓 Complete Integration Checklist

- [ ] Get Stripe test keys
- [ ] Get 100ms keys
- [ ] Update `.env` file
- [ ] Deploy `initiate-booking-checkout`
- [ ] Deploy `stripe-webhooks`
- [ ] Deploy `create-hms-room`
- [ ] Deploy `create-single-booking-internal`
- [ ] Set Stripe secrets in Supabase
- [ ] Set 100ms secrets in Supabase
- [ ] Configure Stripe webhook endpoint
- [ ] Test checkout flow
- [ ] Test payment with test card
- [ ] Verify booking created
- [ ] Verify 100ms room created
- [ ] Test joining lesson

## 📞 Next Steps

Run this command to deploy everything:
```bash
./deploy-all-functions.sh
```

Or follow the manual steps in `STRIPE_SETUP_GUIDE.md`
