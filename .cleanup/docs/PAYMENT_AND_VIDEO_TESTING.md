# PAYMENT & VIDEO SETUP TESTING GUIDE

**Last Updated:** November 9, 2025

This guide will help you test both Stripe payments and 100ms video integration.

---

## ✅ CURRENT STATUS

### Stripe Configuration
- **Frontend Keys:** ✅ Set in `.env` (LIVE mode)
- **Backend Secrets:** ✅ Set in Supabase:
  - `STRIPE_SECRET_KEY` ✅
  - `STRIPE_WEBHOOK_SECRET` ✅
- **Edge Functions:** ✅ Deployed:
  - `initiate-booking-checkout` (v8)
  - `stripe-webhooks` (v8)

### 100ms Configuration
- **Backend Secrets:** ✅ Set in Supabase:
  - `HMS_APP_ACCESS_KEY` ✅
  - `HMS_APP_SECRET` ✅
  - `HMS_TEMPLATE_ID` ✅
- **Edge Functions:** ✅ Deployed:
  - `create-hms-room` (v8)
  - `get-hms-token` (v7)

---

## 🔧 SETUP STEPS

### Step 1: Verify Stripe Dashboard

1. **Go to Stripe Dashboard:**
   - URL: https://dashboard.stripe.com/
   - Login with your credentials

2. **Check Webhook:**
   - Go to **Developers** → **Webhooks**
   - Look for webhook URL: `https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhooks`
   - **If it doesn't exist, create it:**

   ```
   Endpoint URL: https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhooks

   Events to listen for:
   - checkout.session.completed
   - payment_intent.succeeded
   ```

3. **Get Webhook Signing Secret:**
   - Click on your webhook
   - Copy the "Signing secret" (starts with `whsec_`)
   - Keep it for reference (it's already set in Supabase)

### Step 2: Verify 100ms Dashboard

1. **Go to 100ms Dashboard:**
   - URL: https://dashboard.100ms.live/
   - Login with your credentials

2. **Check Your App:**
   - Go to your app/project
   - Note your **App ID**
   - Note your **Template ID** (should be: 684b54d6033903926e6127a1)

3. **Get Credentials (if needed):**
   - Go to **Developer** → **Credentials**
   - Note your **Access Key** and **Secret**
   - These are already set in Supabase

---

## 🧪 TESTING WORKFLOW

### Test 1: Complete Booking Flow (FREE with Promo Code)

This tests the full flow without charging your card:

1. **Open the App:**
   ```
   http://localhost:5173
   ```

2. **Sign Up / Login:**
   - Create a test student account or login
   - Email: `teststudent@test.com`
   - Password: `Test123456!`

3. **Browse Teachers:**
   - Navigate to `/teachers`
   - Click on a teacher

4. **Book a Session:**
   - Click "Book Lesson"
   - Select subject
   - Select duration: 30 min
   - Select tomorrow's date
   - Select available time slot
   - Click "Add to Cart"

5. **Go to Checkout:**
   - Click cart icon
   - Click "Proceed to Checkout"

6. **Apply Promo Code:**
   - Enter: `100OWNER`
   - Click "Apply"
   - **VERIFY:** Total becomes £0.00

7. **Complete Free Booking:**
   - Click "Confirm Free Booking"
   - **VERIFY:** Loading indicator shows
   - **VERIFY:** Redirected to `/payment-success?promo=true`

8. **Check Results:**
   - Open browser console (F12)
   - Look for: "Booking created" log
   - Navigate to `/dashboard`
   - **VERIFY:** Session appears in "Upcoming Sessions"
   - **VERIFY:** Session has a join button (disabled if > 15 min away)

9. **Verify in Database:**
   ```sql
   -- Go to Supabase SQL Editor
   SELECT id, scheduled_time, status, "100ms_room_id"
   FROM lessons
   WHERE status = 'booked'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   - **VERIFY:** Your booking appears
   - **VERIFY:** `100ms_room_id` is populated

**Expected Result:** ✅ Booking created successfully with 100ms room, no payment charged

---

### Test 2: Stripe Payment Flow (TEST MODE ONLY!)

**⚠️ WARNING: You have LIVE Stripe keys. DO NOT test with real cards!**

**Option A: Switch to Test Mode (Recommended)**

1. **Update `.env` file:**
   ```env
   # Change from live to test keys
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY
   STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY
   ```

2. **Update Supabase Secrets:**
   ```bash
   export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"
   npx supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY --project-ref boyrjgivpepjiboekwuu
   ```

3. **Update Stripe Webhook:**
   - Go to Stripe Dashboard (Test mode)
   - Create test webhook with same URL
   - Update webhook secret in Supabase:
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_TEST_WEBHOOK_SECRET --project-ref boyrjgivpepjiboekwuu
   ```

4. **Restart Dev Server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

**Option B: Test in Live Mode (Use with Caution)**

If you want to test with live mode:
1. Use a small amount (£1)
2. Immediately refund via Stripe dashboard
3. Or use the test card that Stripe provides for live mode testing

**Payment Test Steps:**

1. **Add Session to Cart:**
   - Don't use promo code this time
   - Add a session with normal price

2. **Proceed to Checkout:**
   - Click "Proceed to Payment"
   - **VERIFY:** You see loading indicator
   - **VERIFY:** Browser redirects to Stripe Checkout page

3. **On Stripe Checkout Page:**
   - **VERIFY:** Correct amount shown
   - **VERIFY:** Session details visible
   - **Test Card (TEST MODE ONLY):**
     - Card: `4242 4242 4242 4242`
     - Expiry: Any future date
     - CVC: Any 3 digits
     - ZIP: Any 5 digits

4. **Complete Payment:**
   - Click "Pay"
   - **VERIFY:** Payment processes
   - **VERIFY:** Redirected back to your site
   - **VERIFY:** Shows `/payment-success` page

5. **Check Webhook:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click on your webhook
   - Check recent events
   - **VERIFY:** `checkout.session.completed` event received
   - **VERIFY:** Response code 200

6. **Verify Booking Created:**
   - Go to your dashboard
   - **VERIFY:** Session appears in upcoming sessions
   - Check database:
   ```sql
   SELECT * FROM lessons
   WHERE payment_id IS NOT NULL
   ORDER BY created_at DESC
   LIMIT 1;
   ```

**Expected Result:** ✅ Payment processed, booking created, webhook received

---

### Test 3: 100ms Video Join

**Important:** You need to wait until 15 minutes before the session to test joining.

**Option A: Book Session 10 Minutes in Future**

1. **Modify Available Slot:**
   - As a teacher, set availability for current time + 10 minutes
   - Or directly insert into database:
   ```sql
   -- Update a booking to be in 10 minutes
   UPDATE lessons
   SET scheduled_time = NOW() + INTERVAL '10 minutes'
   WHERE id = 'YOUR_BOOKING_ID';
   ```

2. **Wait Until 15 Min Window:**
   - The join button enables 15 min before session
   - Refresh dashboard after time passes

**Option B: Test Join Button Logic**

1. **Check Upcoming Sessions Card:**
   - Go to dashboard
   - Look at your booked session
   - **VERIFY:** Join button visible
   - **VERIFY:** Button shows "Not Ready" if too early
   - **VERIFY:** Countdown timer displays

2. **Inspect Console:**
   - Open browser console (F12)
   - Look for room ID logs when you try to join
   - Should see: `Joining room: YOUR_ROOM_ID`

3. **Test Token Generation:**
   - When join button is enabled, click it
   - **VERIFY:** Token generation API called
   - Check console for:
     ```
     🎥 Generating 100ms token for room: YOUR_ROOM_ID
     ✅ Token generated successfully
     ```

4. **Check Network Tab:**
   - Open DevTools → Network tab
   - Click join button
   - Look for request to: `get-hms-token`
   - **VERIFY:** Response includes token
   - **VERIFY:** Token is used to initialize 100ms SDK

**Expected Result:** ✅ Token generated, ready to join room

**Full Video Test:**

To fully test video, you need to:
1. Integrate 100ms React SDK in your frontend
2. Or test via 100ms dashboard preview

---

## 🐛 TROUBLESHOOTING

### Issue: "No checkout URL received"

**Cause:** Edge function error or Stripe configuration issue

**Fix:**
1. Check edge function logs:
   ```bash
   # In Supabase dashboard → Edge Functions → initiate-booking-checkout → Logs
   ```

2. Verify Stripe secret is set:
   ```bash
   export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"
   npx supabase secrets list --project-ref boyrjgivpepjiboekwuu | grep STRIPE
   ```

3. Check frontend console for errors

### Issue: Webhook Not Receiving Events

**Cause:** Webhook URL incorrect or secret mismatch

**Fix:**
1. Verify webhook URL in Stripe dashboard
2. Make sure it's: `https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhooks`
3. Verify webhook secret matches:
   ```bash
   # Get from Stripe dashboard → Developers → Webhooks → Your Webhook → Signing secret
   # Then set in Supabase:
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET --project-ref boyrjgivpepjiboekwuu
   ```

4. Check webhook logs in Stripe dashboard

### Issue: Booking Created But No 100ms Room

**Cause:** HMS credentials incorrect or edge function error

**Fix:**
1. Verify HMS secrets:
   ```bash
   export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"
   npx supabase secrets list --project-ref boyrjgivpepjiboekwuu | grep HMS
   ```

2. Check edge function logs for `create-booking-with-room`

3. Verify 100ms API key in dashboard

### Issue: Join Button Not Enabling

**Cause:** Time calculation or room ID missing

**Fix:**
1. Check booking time:
   ```sql
   SELECT id, scheduled_time, "100ms_room_id"
   FROM lessons
   WHERE id = 'YOUR_BOOKING_ID';
   ```

2. Verify room ID exists
3. Check time calculation in `UpcomingSessionsCard.tsx`
4. Try refreshing the page

### Issue: Payment Succeeds But Booking Not Created

**Cause:** Webhook not processing correctly

**Fix:**
1. Check Stripe webhook logs for errors
2. Check `stripe-webhooks` edge function logs
3. Verify booking data in webhook payload
4. Check database for pending bookings:
   ```sql
   SELECT * FROM pending_bookings
   WHERE created_at > NOW() - INTERVAL '1 hour';
   ```

---

## 📋 TEST CHECKLIST

### Stripe Payment Test
- [ ] Can add sessions to cart
- [ ] Can proceed to checkout
- [ ] Stripe checkout page loads
- [ ] Payment information correct
- [ ] Test payment succeeds
- [ ] Redirected to success page
- [ ] Webhook received in Stripe
- [ ] Booking created in database
- [ ] Session appears in dashboard

### Free Booking Test (100OWNER)
- [ ] Can apply promo code
- [ ] Total becomes £0.00
- [ ] Free booking succeeds
- [ ] No Stripe charge
- [ ] Booking created in database
- [ ] 100ms room created
- [ ] Session appears in dashboard

### 100ms Video Test
- [ ] Booking has room ID
- [ ] Join button appears
- [ ] Join button disabled when too early
- [ ] Countdown timer shows
- [ ] Join button enables 15 min before
- [ ] Token generation works
- [ ] Can join video room (if SDK integrated)

---

## 🎯 QUICK TEST SCRIPT

Run this complete flow in 5 minutes:

```bash
# 1. Ensure dev server is running
npm run dev

# 2. Open browser to http://localhost:5173

# 3. Login/Signup as student

# 4. Book a session with teacher

# 5. Use promo code: 100OWNER

# 6. Complete free booking

# 7. Check dashboard for session

# 8. Verify in database:
```

```sql
-- Check booking created
SELECT
  id,
  scheduled_time,
  status,
  "100ms_room_id",
  teacher_rate_at_booking,
  total_cost_paid
FROM lessons
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
```

**Expected:**
- ✅ Booking with `status='booked'`
- ✅ `100ms_room_id` populated
- ✅ `total_cost_paid=0` (for free booking)

---

## 🚀 NEXT STEPS

After successful testing:

1. **For Production:**
   - Keep LIVE Stripe keys if ready for real payments
   - Or switch to TEST keys for continued testing
   - Document which mode you're in

2. **100ms Integration:**
   - No additional dashboard setup needed
   - Rooms are created automatically on booking
   - Tokens are generated when user joins

3. **Monitoring:**
   - Set up Stripe webhook monitoring
   - Monitor edge function logs
   - Track failed payments

---

## 📞 SUPPORT

**Stripe Issues:**
- Dashboard: https://dashboard.stripe.com/
- Docs: https://stripe.com/docs/webhooks
- Webhook testing: https://stripe.com/docs/webhooks/test

**100ms Issues:**
- Dashboard: https://dashboard.100ms.live/
- Docs: https://www.100ms.live/docs
- Room API: https://www.100ms.live/docs/server-side/v2/api-reference/rooms/create-via-api

**Supabase Issues:**
- Dashboard: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu
- Edge Function Logs: Project → Edge Functions → Function → Logs
- Database: Project → SQL Editor

---

**Testing Complete!**
You're ready to accept payments and conduct video sessions! 🎉
