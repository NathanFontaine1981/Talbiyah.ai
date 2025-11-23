# 🧪 DAY 1 TESTING GUIDE - Payment Flow

**Goal:** Test the complete booking → payment → lesson flow

**Time Estimate:** 2-3 hours

---

## 🎯 TEST 1: SUCCESSFUL PAYMENT FLOW (30 minutes)

### **Step 1: Setup (5 minutes)**

1. **Check dev server is running:**
   - Dev server should be at: http://localhost:5174
   - If not running: `npm run dev`

2. **Verify Stripe test mode:**
   - Check `.env` file has test keys (not live keys)
   - Keys should start with `pk_test_` and `sk_test_`

3. **Clear browser data:**
   - Open Chrome DevTools (Cmd+Option+I)
   - Application tab → Clear storage → Clear site data
   - This ensures clean test

### **Step 2: Create Test Student Account (5 minutes)**

1. **Sign up as new student:**
   - Go to: http://localhost:5174
   - Click "Sign Up" or "Get Started"
   - Use test email: `test-student-001@example.com`
   - Password: `TestPass123!`
   - Complete verification if required

2. **Expected result:**
   - ✅ Account created
   - ✅ Email verification sent (check Supabase Auth logs)
   - ✅ Redirected to dashboard
   - ✅ No errors in console

3. **If verification required:**
   - Go to Supabase Dashboard → Authentication → Users
   - Find your test user
   - Click "..." → "Confirm email"

### **Step 3: Browse Teachers (2 minutes)**

1. **Find available teacher:**
   - Navigate to "Browse Teachers" or "Find a Teacher"
   - Pick any approved teacher (preferably one with availability)
   - Note: If no teachers, you'll need to create one as admin

2. **Expected result:**
   - ✅ Teachers list shows
   - ✅ Can see teacher profiles
   - ✅ Prices display correctly
   - ✅ "Book Session" button visible

### **Step 4: Book a Lesson (5 minutes)**

1. **Start booking flow:**
   - Click "Book Session" on a teacher
   - Select a date (today or tomorrow)
   - Select a time slot
   - Select duration (30 or 60 minutes)
   - Select subject (e.g., Quran Reading)

2. **Expected result:**
   - ✅ Date picker works
   - ✅ Time slots show (filtered by teacher availability)
   - ✅ Duration options available
   - ✅ Price updates based on duration
   - ✅ "Proceed to Checkout" button enabled

3. **Common issues:**
   - No time slots? → Teacher has no availability set
   - Wrong price? → Teacher tier not set correctly
   - Booking disabled? → Check console for errors

### **Step 5: Checkout (3 minutes)**

1. **Review booking:**
   - Check booking summary is correct
   - Verify teacher name, date, time, duration
   - Check total price
   - Click "Proceed to Payment"

2. **Expected result:**
   - ✅ Booking summary correct
   - ✅ Price matches teacher tier
   - ✅ Redirects to Stripe Checkout
   - ✅ No console errors

3. **If Stripe doesn't open:**
   - Check browser console for errors
   - Check Network tab for failed API calls
   - Verify Stripe publishable key in `.env`

### **Step 6: Complete Payment (5 minutes)**

1. **Fill Stripe Checkout:**
   - **Card Number:** `4242 4242 4242 4242` (Stripe test card)
   - **Expiry:** Any future date (e.g., 12/25)
   - **CVC:** Any 3 digits (e.g., 123)
   - **Name:** Test Student
   - **Country:** United Kingdom
   - **Postal Code:** SW1A 1AA

2. **Click "Pay"**

3. **Expected result:**
   - ✅ Payment processes
   - ✅ Redirects to success page
   - ✅ Success message shows
   - ✅ Booking confirmation displayed

### **Step 7: Verify Backend (5 minutes)**

**Check Stripe Dashboard:**
1. Go to: https://dashboard.stripe.com/test/payments
2. You should see your test payment
3. Status should be "Succeeded"
4. Amount should match booking price

**Check Supabase Database:**
1. Go to Supabase Dashboard → Table Editor
2. Check `lessons` table:
   - New lesson record exists
   - `status` = 'booked' or 'confirmed'
   - `payment_status` = 'paid'
   - `stripe_payment_intent_id` is populated
   - `hms_room_id` or `room_code` is set
3. Check `teacher_earnings` table:
   - Earnings recorded for teacher
   - `net_amount` calculated (gross - platform fee)

**Check Stripe Webhook Logs:**
1. Terminal running `npm run dev` should show:
   ```
   Webhook received: checkout.session.completed
   Processing payment...
   Booking confirmed!
   ```
2. If no webhook logs, check Supabase Functions logs

### **Step 8: Verify Student Dashboard (3 minutes)**

1. **Go to student dashboard:**
   - Navigate to /dashboard or /my-classes
   - Should see your booked lesson

2. **Expected to see:**
   - ✅ Lesson card with teacher name
   - ✅ Correct date and time
   - ✅ "Join Lesson" button (if lesson is today/soon)
   - ✅ Lesson status (Upcoming/Confirmed)

3. **Click "Join Lesson" (if available):**
   - Should redirect to lesson page
   - 100ms video room should load
   - May need to wait until lesson time

### **Step 9: Verify Teacher Dashboard (2 minutes)**

1. **Log out and log in as teacher:**
   - Or open incognito window
   - Login with teacher account

2. **Check teacher dashboard:**
   - Should see the booked lesson
   - Should see earnings updated
   - Lesson should appear in "Upcoming Lessons"

3. **Expected result:**
   - ✅ Lesson visible in teacher's dashboard
   - ✅ Earnings increased
   - ✅ "Join Lesson" button available

---

## ✅ SUCCESS CRITERIA

**Payment Flow Test PASSES if:**

- [x] Student can create account
- [x] Student can browse teachers
- [x] Student can select date/time
- [x] Stripe Checkout opens
- [x] Test payment succeeds
- [x] Redirects to success page
- [x] Lesson appears in Stripe dashboard
- [x] Lesson saved to database
- [x] HMS room created
- [x] Teacher earnings recorded
- [x] Lesson shows in student dashboard
- [x] Lesson shows in teacher dashboard

---

## ❌ COMMON ISSUES & FIXES

### **Issue: Stripe Checkout doesn't open**

**Symptoms:**
- Clicking "Pay Now" does nothing
- Console error: "Stripe is not defined"

**Fix:**
```bash
# Check .env file has Stripe keys
grep STRIPE .env

# Should see:
# VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_SECRET_KEY=sk_test_... (in Supabase secrets)
```

---

### **Issue: Webhook not processing**

**Symptoms:**
- Payment succeeds but lesson not created
- Stripe shows payment but database empty

**Fix:**
1. Check Supabase Functions logs:
   ```bash
   npx supabase functions logs stripe-webhook --linked
   ```
2. Check webhook endpoint is correct in Stripe:
   - Should be: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
3. Check webhook secret in Supabase secrets:
   ```bash
   npx supabase secrets list --linked
   ```

---

### **Issue: No teacher availability**

**Symptoms:**
- Time slots don't show
- "No availability" message

**Fix:**
1. Login as admin
2. Go to Teacher Management
3. Select a teacher
4. Add availability slots:
   - Day: Monday-Friday
   - Start: 09:00
   - End: 17:00
5. Save and try booking again

---

### **Issue: Wrong pricing**

**Symptoms:**
- Price doesn't match teacher tier
- All teachers show same price

**Fix:**
1. Check teacher has tier assigned:
   ```sql
   SELECT id, current_tier FROM teacher_profiles;
   ```
2. Check tier pricing in `teacher_tiers` table
3. Verify `get_student_price_for_teacher` RPC function exists

---

## 🎯 NEXT STEPS

Once payment flow test PASSES:

1. **Test Failed Payment** (see TEST_2_FAILED_PAYMENT.md)
2. **Test Video Call** (see TEST_3_VIDEO_CALL.md)
3. **Test Insights** (see TEST_4_INSIGHTS.md)

---

## 📸 SCREENSHOTS TO TAKE

For your records, screenshot:
1. Stripe Checkout page (with test card filled)
2. Payment success page
3. Stripe dashboard showing payment
4. Supabase database `lessons` table
5. Student dashboard with booked lesson
6. Teacher dashboard with booked lesson

These prove the system works end-to-end!

---

## 💡 PRO TIPS

**Speed up testing:**
- Create test accounts ahead of time
- Use same teacher for all tests
- Keep Stripe dashboard open in another tab
- Keep Supabase dashboard open
- Use browser DevTools to monitor network requests

**Debugging:**
- Check browser console FIRST
- Check Network tab for failed requests
- Check Supabase Functions logs
- Check Stripe webhook logs
- Check database directly

**Best practices:**
- Test in incognito window (clean state)
- Clear localStorage between tests
- Test on different browsers
- Test on mobile too (later)

---

## 📝 NOTES SECTION

**Use this space to note any issues found:**

```
Date: ___________

Test Run #1:
- Issue: _______________________
- Fix: ________________________
- Result: ______________________

Test Run #2:
- Issue: _______________________
- Fix: ________________________
- Result: ______________________
```

---

**Ready to start testing?**

1. Open http://localhost:5174
2. Follow steps 1-9 above
3. Mark items as complete
4. Note any issues
5. Move to next test!

**LET'S DO THIS! 🚀**
