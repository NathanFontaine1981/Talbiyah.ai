# 🧪 Credit System End-to-End Testing Guide

## ✅ PRE-REQUISITES (Run These SQL Scripts First!)

### 1. Run Credit Booking Trigger (CRITICAL)
**File:** See above - credit payment defaults trigger
**Time:** 30 seconds

### 2. Run Console Error Fixes
**File:** `FIX_CONSOLE_ERRORS.sql`
**Time:** 1 minute

---

## 🎯 COMPLETE TESTING CHECKLIST

### Phase 1: Clean Slate Setup (10 minutes)

#### Step 1: Clear All Test Data
1. Log in as **Admin**
2. Go to **Admin → User Management**
3. Click **"Clear All Users"** button (red button)
4. Type `DELETE ALL USERS` when prompted
5. Wait for success message
6. Go to Supabase Auth and delete all non-admin users:
   - https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/auth/users

**Expected Result:** Only admin account remains

---

#### Step 2: Create Fresh Test Accounts

**Create Parent Account:**
1. Sign up with:
   - Name: Test Parent
   - Email: testparent@test.com
   - Password: TestPass123!
   - Role: Parent

**Create Teacher Account:**
1. Sign up with:
   - Name: Test Teacher
   - Email: testteacher@test.com
   - Password: TestPass123!
   - Role: Teacher

**Set Up Teacher:**
1. Log in as testteacher@test.com
2. Complete teacher application
3. Log in as Admin and approve teacher
4. As teacher, add availability slots (at least 3-4 slots)

---

### Phase 2: Credit Purchase Flow (15 minutes)

#### Test 1: Purchase Credit Pack

1. **Log in as Parent** (testparent@test.com)

2. **Navigate to Buy Credits**
   - Click "Buy Credits" in navigation
   - OR go to: `http://localhost:5173/buy-credits`

3. **Select a Credit Pack**
   - Choose "Standard Pack" (8 lessons for £104)
   - Click "Purchase" button

4. **Complete Stripe Checkout**
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
   - Click "Pay"

5. **Verify Success Page**
   - Should redirect to `/credit-purchase-success`
   - Should show: "Purchase successful!"
   - Should show: Credits purchased

6. **Check Credits in Dashboard**
   - Go to Dashboard
   - **CRITICAL CHECK:** Credit balance should show **8 credits**

7. **Verify in Database** (Optional but recommended)
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM user_credits
   WHERE user_id = (SELECT id FROM profiles WHERE email = 'testparent@test.com');

   -- Should show: credits_remaining = 8
   ```

8. **Check Webhook Logs**
   - Go to: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/functions/stripe-webhook/logs
   - Look for: "✅ Credits added successfully!"
   - Should see: New balance: 8

**🚨 If Credits Don't Appear:**
- Check webhook logs for errors
- Verify `add_user_credits` RPC was called
- Check `credit_purchases` table has record
- May need to debug webhook handler

---

#### Test 2: Credit Balance Display

1. **Check Credit Widget on Dashboard**
   - Should show: "8 credits" prominently
   - Should have credit card icon
   - Should be clearly visible

2. **Check Checkout Page**
   - Add a lesson to cart (see Phase 3)
   - Go to checkout
   - **CRITICAL:** Should see large credit balance box showing "8 credits"

**Expected Display:**
```
┌──────────────────────────────┐
│  Your Credit Balance         │
│  8 credits        [icon]     │
└──────────────────────────────┘
```

---

### Phase 3: Booking with Credits (20 minutes)

#### Test 3: Book Lesson Using Credits

1. **Navigate to Teachers**
   - Click "Find a Teacher" or go to `/teachers`

2. **Find Test Teacher**
   - You should see "Test Teacher" in the list
   - Should show availability slots

3. **Book a Lesson**
   - Click on Test Teacher's card
   - Select a subject (e.g., "Quran with Understanding")
   - Choose an available time slot
   - Click "Book Lesson" or "Add to Cart"

4. **Go to Checkout**
   - Cart icon should show (1)
   - Click cart to go to checkout
   - OR navigate to `/checkout`

5. **Verify Credit Payment Option**
   - Should see: "Your Credit Balance: 8 credits"
   - Should see: "Credits needed: 1"
   - Should see: "Pay with Credits" button (NOT darkened)
   - Should see: "Balance after purchase: 7 credits"

6. **Pay with Credits**
   - Click "Pay with Credits" button
   - Should change to selected state (cyan border)
   - Click "Complete Booking with Credits" button

7. **Verify Booking Success**
   - Should redirect to `/dashboard?booking_success=true&payment_method=credits`
   - Should show success message
   - Lesson should appear in "Upcoming Lessons"

8. **Verify Credit Deduction**
   - Credit balance should now show: **7 credits**
   - Credit widget should update automatically

9. **Verify in Database**
   ```sql
   -- Check credits were deducted
   SELECT * FROM user_credits
   WHERE user_id = (SELECT id FROM profiles WHERE email = 'testparent@test.com');
   -- Should show: credits_remaining = 7

   -- Check lesson was created with correct payment method
   SELECT id, status, payment_method, payment_status, booked_at, price
   FROM lessons
   WHERE learner_id IN (
     SELECT id FROM learners
     WHERE parent_id = (SELECT id FROM profiles WHERE email = 'testparent@test.com')
   )
   ORDER BY created_at DESC
   LIMIT 1;
   -- Should show:
   -- - payment_method = 'credits'
   -- - payment_status = 'paid'
   -- - booked_at = (current timestamp)
   -- - price = 15.00 (or lesson price)
   ```

10. **Check Credit Transaction Log**
    ```sql
    SELECT * FROM credit_transactions
    WHERE user_id = (SELECT id FROM profiles WHERE email = 'testparent@test.com')
    ORDER BY created_at DESC;
    -- Should show deduction transaction
    ```

---

#### Test 4: Multiple Lesson Booking

1. **Add 2-3 Lessons to Cart**
   - Book multiple time slots with same or different teachers
   - Cart should show multiple items

2. **Check Checkout**
   - Should show: "Credits needed: 2" (or 3)
   - Should show: "Balance after purchase: 5 credits" (or 4)

3. **Complete Booking**
   - Pay with credits
   - All lessons should be created
   - Credits should be deducted correctly

4. **Verify:**
   - All lessons appear in dashboard
   - Credit balance updated correctly
   - Each lesson has payment_method='credits'

---

#### Test 5: Insufficient Credits

1. **Try to Book More Lessons Than You Have Credits**
   - Add 10 lessons to cart (you only have 7 credits remaining)

2. **Check Checkout Behavior**
   - Should show: "Credits needed: 10"
   - Should show: "Insufficient credits" message
   - "Pay with Credits" button should be disabled OR show error

3. **Fallback to Stripe**
   - Should still show "Pay with Card" option
   - Should be able to complete booking with Stripe instead

---

### Phase 4: Edge Cases & Error Handling (15 minutes)

#### Test 6: Concurrent Booking Prevention

1. **Open Two Browser Tabs**
   - Both logged in as same parent
   - Both have lesson in cart

2. **Try to Book Simultaneously**
   - Click "Complete Booking" in both tabs at same time
   - Only one should succeed
   - Other should show error or insufficient credits

---

#### Test 7: Credit Refund (If Booking Fails)

1. **Simulate Booking Failure**
   - This is harder to test without breaking something
   - Check code to ensure refund logic exists:
   ```typescript
   // In initiate-booking-checkout/index.ts
   if (lessonsError) {
     // Refund the credits
     await supabaseClient.rpc('add_user_credits', {
       p_user_id: user.id,
       p_credits: totalCreditsNeeded,
       p_purchase_id: null,
       p_notes: 'Refund: Lesson creation failed'
     });
   }
   ```

2. **Verify Refund Logic**
   - Read code to confirm refunds happen on failure
   - Check logs if any failures occurred during testing

---

#### Test 8: Parent Without Children (Self-Booking)

1. **Create New Parent**
   - Sign up as parent
   - Do NOT add any children

2. **Try to Book Lesson**
   - Should treat parent as student
   - Should allow booking
   - Checkout should work normally

---

### Phase 5: Console Error Verification (10 minutes)

#### Test 9: Clean Console

1. **Open Browser Console**
   - Press F12
   - Go to Console tab

2. **Navigate Through Platform**
   - Visit dashboard
   - Visit teachers page
   - Visit checkout
   - Complete a booking

3. **Check for Errors**
   - Should NOT see:
     - ❌ "get_student_teachers" 400 errors
     - ❌ "parent_children" PATCH 400 errors
     - ❌ "Results contain 93 rows" errors

   - Acceptable warnings:
     - ⚠️ Development mode warnings
     - ⚠️ React DevTools suggestions

4. **If Errors Appear:**
   - Note the exact error message
   - Check if it's one we tried to fix
   - May need additional fixes

---

### Phase 6: Teacher & Admin Testing (10 minutes)

#### Test 10: Teacher View

1. **Log in as Teacher**

2. **Check Upcoming Lessons**
   - Should see lessons booked by parent
   - Should show correct student name
   - Should have "Join Lesson" link

3. **Check Earnings**
   - Should show earnings for booked lessons
   - Should reflect credit-based bookings

---

#### Test 11: Admin View

1. **Log in as Admin**

2. **Check User Management**
   - Should see test parent and teacher
   - Credit balances should be visible

3. **Check Lesson Records**
   - Should see all booked lessons
   - Should show payment methods correctly

---

## 📋 SUCCESS CRITERIA CHECKLIST

Mark each as ✅ when verified:

### Credit Purchase:
- [ ] Can buy credit pack via Stripe
- [ ] Credits appear in dashboard immediately
- [ ] Credits saved to database
- [ ] Purchase record created
- [ ] Webhook logs show success

### Credit Booking:
- [ ] Credit balance displays correctly
- [ ] "Pay with Credits" button works
- [ ] Credits deducted on booking
- [ ] Lesson created with payment_method='credits'
- [ ] Balance updates in UI immediately

### Error Handling:
- [ ] Insufficient credits shows error
- [ ] Can fallback to Stripe payment
- [ ] No console errors
- [ ] Loading states show properly
- [ ] Success messages display correctly

### Database Integrity:
- [ ] user_credits table correct
- [ ] credit_transactions logged
- [ ] lessons have correct payment_method
- [ ] No duplicate learners
- [ ] All foreign keys valid

### User Experience:
- [ ] Clear credit balance display
- [ ] Obvious payment method selection
- [ ] Success confirmation after booking
- [ ] Lessons appear in dashboard
- [ ] Mobile responsive

---

## 🚨 COMMON ISSUES & FIXES

### Issue 1: Credits Not Appearing After Purchase
**Symptom:** Purchase succeeds but balance stays 0

**Check:**
1. Webhook logs - was `add_user_credits` called?
2. Database - is there a record in `credit_purchases`?
3. RPC function - does `add_user_credits` exist?

**Fix:**
- Check Stripe webhook configuration
- Verify webhook URL is correct
- Check webhook secret is set

---

### Issue 2: "Pay with Credits" Button Disabled
**Symptom:** Button is grayed out even with credits

**Check:**
1. Is credit balance loading?
2. Console errors?
3. Is creditsNeeded calculated correctly?

**Fix:**
- Check Checkout.tsx credit balance fetch
- Verify calculation logic
- Check parent_children relationship

---

### Issue 3: Booking Fails with Schema Cache Error
**Symptom:** "Could not find column in schema cache"

**Check:**
1. Was SQL trigger created?
2. Was edge function redeployed?

**Fix:**
- Run the trigger SQL again
- Redeploy edge function:
  ```bash
  SUPABASE_ACCESS_TOKEN="xxx" npx supabase functions deploy initiate-booking-checkout
  ```

---

### Issue 4: Console Errors Still Appearing
**Symptom:** Red errors in console

**Fix:**
- Run FIX_CONSOLE_ERRORS.sql again
- Check if new errors (not the ones we fixed)
- May need additional fixes

---

## 📊 TESTING RESULTS TEMPLATE

Use this to document your testing:

```
CREDIT SYSTEM TESTING RESULTS
Date: [TODAY'S DATE]
Tester: [YOUR NAME]

PHASE 1: SETUP
[ ] Users cleared
[ ] Fresh accounts created
[ ] Teacher approved and configured

PHASE 2: PURCHASE
[ ] Credit pack purchased successfully
[ ] Credits appeared in dashboard: _____ credits
[ ] Database record verified
[ ] Webhook logs show success

PHASE 3: BOOKING
[ ] Lesson added to cart
[ ] Checkout shows credit balance
[ ] Paid with credits successfully
[ ] Credits deducted: New balance: _____
[ ] Lesson appears in dashboard

PHASE 4: EDGE CASES
[ ] Insufficient credits handled correctly
[ ] Multiple bookings work
[ ] Parent self-booking works

PHASE 5: CONSOLE
[ ] No critical errors
[ ] Warnings only (acceptable): _____

OVERALL STATUS: [PASS / FAIL / PARTIAL]

ISSUES FOUND:
1. _____
2. _____
3. _____

NOTES:
_____
```

---

## 🎉 COMPLETION

When ALL checkboxes are ✅, your credit system is:
- ✅ Fully functional
- ✅ Production ready
- ✅ Bug-free
- ✅ User-tested

**Congratulations! You can now launch the credit system! 🚀**
