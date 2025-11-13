# 🧪 Testing Guide - Stripe & 100ms Integration

## Quick Start Testing

Your app is running at: **http://localhost:5173/**

---

## Test 1: Stripe Payment Flow

### Prerequisites
Make sure you have:
- ✅ At least one teacher account with availability set
- ✅ A parent/student account to book with

### Steps to Test Payment:

1. **Open the app:** http://localhost:5173/

2. **Log in as a parent or student**

3. **Navigate to "Book a Session"** (or "Teachers" page)

4. **Select a teacher** and view their available time slots

5. **Choose a time slot** and click "Book Session"

6. **You should be redirected to Stripe Checkout**
   - URL should be: `https://checkout.stripe.com/...`
   - You should see a payment form

7. **Use Stripe test card:**
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

8. **Complete the payment**

9. **You should be redirected back** to your app
   - Check the URL for success parameters
   - Should redirect to `/payment-success` or similar

10. **Check your dashboard**
    - The booking should appear in your bookings list
    - Status should be "confirmed" or "scheduled"

### Expected Console Output:
Watch your browser console (F12) for these logs:
```
🔗 API Call: initiate-booking-checkout
📡 API Response: initiate-booking-checkout { status: 200 }
✅ API Success: initiate-booking-checkout
```

### Verify in Stripe Dashboard:
1. Go to: https://dashboard.stripe.com/test/payments
2. You should see your test payment
3. Click on it to see details
4. Go to: https://dashboard.stripe.com/test/webhooks
5. Click on your webhook endpoint
6. You should see recent webhook deliveries with ✅ green checkmarks

---

## Test 2: 100ms Video Conferencing

### Steps to Test Video:

1. **Book a session** using Test 1 above

2. **Note the session time** - you need to wait until 5 minutes before start

3. **For testing purposes**, you can modify the booking time:
   - Go to Supabase Dashboard
   - Open the `bookings` table
   - Find your booking
   - Edit `scheduled_time` to be ~2 minutes from now

4. **Refresh your dashboard** in the app

5. **Click "Join Session"** when the button becomes available

6. **You should enter a 100ms video room:**
   - Camera and microphone permissions will be requested
   - You should see yourself in the video
   - Room should have controls for mute, video, screen share

7. **Test with a second account** (teacher):
   - Log in with teacher account in incognito/different browser
   - Join the same session
   - Both users should see each other

### Expected Console Output:
```
🎥 Joining video session...
✅ HMS token retrieved
✅ Joining room with code: [room-code]
```

### Verify in 100ms Dashboard:
1. Go to: https://dashboard.100ms.live/sessions
2. You should see your active session
3. Click on it to see participants and session details

---

## Test 3: Monitor Edge Function Logs

While testing, you can monitor the Edge Functions in real-time:

### Option 1: Via Terminal
```bash
# Monitor all functions
export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"
npx supabase functions logs --project-ref boyrjgivpepjiboekwuu

# Monitor specific function
npx supabase functions logs initiate-booking-checkout --project-ref boyrjgivpepjiboekwuu
npx supabase functions logs stripe-webhooks --project-ref boyrjgivpepjiboekwuu
npx supabase functions logs create-hms-room --project-ref boyrjgivpepjiboekwuu
```

### Option 2: Via Dashboard
1. Go to: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/functions
2. Click on any function (e.g., `initiate-booking-checkout`)
3. View real-time logs as you test

---

## Common Test Scenarios

### Scenario 1: Single Session Booking
- Book one session
- Pay with test card
- Verify booking appears
- ✅ **Expected:** Payment successful, booking created

### Scenario 2: Multiple Sessions (Cart)
- Add multiple time slots to cart
- Checkout with total amount
- Verify all bookings created
- ✅ **Expected:** One payment for multiple sessions

### Scenario 3: Free Trial Session
If you have free sessions enabled:
- Book first session as new student
- Should skip payment
- ✅ **Expected:** Booking created without payment

### Scenario 4: Payment Failure
- Use test card: `4000 0000 0000 0002` (decline card)
- Payment should fail
- ✅ **Expected:** Error message, no booking created

---

## Troubleshooting

### Issue: "Failed to create checkout session"

**Check:**
1. Browser console for error messages
2. Edge function logs: `npx supabase functions logs initiate-booking-checkout`
3. Verify STRIPE_SECRET_KEY is set correctly

**Common causes:**
- Invalid Stripe key
- Network error
- Invalid booking data

### Issue: "Payment successful but no booking created"

**Check:**
1. Stripe webhook logs: https://dashboard.stripe.com/webhooks
2. Edge function logs: `npx supabase functions logs stripe-webhooks`
3. Check if webhook is receiving events

**Common causes:**
- Webhook not configured
- Webhook secret mismatch
- Database permission issues

### Issue: "Cannot join video session"

**Check:**
1. Session time (must be within 5 minutes of start)
2. Edge function logs: `npx supabase functions logs create-hms-room`
3. 100ms dashboard for room creation errors

**Common causes:**
- HMS credentials incorrect
- Template ID mismatch
- Room already expired

---

## Success Criteria

Your integration is working if:
- ✅ Stripe checkout page loads correctly
- ✅ Test payment completes successfully
- ✅ Webhook delivers successfully (check Stripe dashboard)
- ✅ Booking appears in your app after payment
- ✅ Video room loads when joining session
- ✅ Multiple users can join the same video room
- ✅ No errors in Edge Function logs

---

## Next Steps After Testing

Once everything works:

1. **Test edge cases:**
   - Canceling bookings
   - Refunds
   - Rescheduling
   - No-shows

2. **Performance testing:**
   - Multiple simultaneous bookings
   - High-traffic scenarios
   - Video room capacity

3. **Prepare for production:**
   - Switch to live Stripe keys
   - Update webhook endpoints
   - Configure production 100ms settings
   - Set up monitoring and alerts

---

## Quick Test Checklist

- [ ] Logged in as parent/student
- [ ] Can see teachers and availability
- [ ] Can select time slot and click book
- [ ] Redirected to Stripe Checkout
- [ ] Payment form loads correctly
- [ ] Test card payment succeeds
- [ ] Redirected back to app
- [ ] Booking appears in dashboard
- [ ] Webhook delivered successfully (Stripe dashboard)
- [ ] Can join video session (when time comes)
- [ ] Video and audio work
- [ ] Second user can join same session
- [ ] No errors in function logs

---

**Ready to test? Start at: http://localhost:5173/**

Good luck! 🚀
