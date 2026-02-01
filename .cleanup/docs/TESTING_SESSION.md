# 🧪 LIVE TESTING SESSION - Talbiyah.ai
**Date:** November 9, 2025
**Time Started:** 7:50 PM UTC
**Tester:** System Administrator
**Environment:** http://localhost:5173

---

## TEST 1: STUDENT SIGNUP & PROFILE CREATION

### Objective
Verify that a new student can sign up and create a profile successfully.

### Prerequisites
- ✅ Development server running at http://localhost:5173
- ✅ Fresh browser session (incognito mode recommended)

### Test Steps

**Step 1.1: Navigate to Sign Up Page**
- [ ] Open browser to http://localhost:5173
- [ ] Click "Sign Up" button
- [ ] Verify signup form appears

**Step 1.2: Create Student Account**
- [ ] Email: `teststudent@testing.com` (use a real email you can access)
- [ ] Password: `TestPass123!`
- [ ] Click "Sign Up"
- [ ] **Expected:** Redirected to email verification page

**Step 1.3: Verify Email**
- [ ] Check email inbox for verification link
- [ ] Click verification link
- [ ] **Expected:** Account verified, redirected to dashboard

**Step 1.4: Complete Profile (if prompted)**
- [ ] Full Name: Enter name
- [ ] **Expected:** Profile created successfully

### Verification Commands
Run these after signup:

```bash
# Check if profile was created
./supabase-query.sh "SELECT id, email, full_name, roles FROM profiles WHERE email = 'teststudent@testing.com';"

# Check if learner record was created
./supabase-query.sh "SELECT l.id, l.name, l.parent_id, p.email FROM learners l JOIN profiles p ON l.parent_id = p.id WHERE p.email = 'teststudent@testing.com';"
```

### Success Criteria
- ✅ Profile record exists in database
- ✅ Learner record created automatically
- ✅ Can log in successfully
- ✅ Dashboard loads without errors

### Results
- Status: ⏳ PENDING
- Issues Found: None yet
- Notes:

---

## TEST 2: BROWSE AND FILTER TEACHERS

### Objective
Verify teacher discovery page shows only available teachers and filters work correctly.

### Prerequisites
- ✅ Logged in as student (from Test 1)

### Test Steps

**Step 2.1: Navigate to Teachers Page**
- [ ] Click "Book a Class" or "Find a Teacher" in menu
- [ ] OR navigate to http://localhost:5173/teachers
- [ ] **Expected:** Page loads showing teacher cards

**Step 2.2: Verify Teacher Count**
- [ ] Count how many teachers are displayed
- [ ] **Expected:** Should see 3 teachers (not 4)
  - Ayodeji Teacher
  - Nathan Teacher
  - Abdullah Abbass
- [ ] Should NOT see "Deji Teacher" (no availability)

**Step 2.3: Test Subject Filter - Quran**
- [ ] Click checkbox: "Quran with Understanding"
- [ ] **Expected:** All 3 teachers should still show (all teach Quran)
- [ ] Verify teacher cards remain visible

**Step 2.4: Test Subject Filter - Arabic**
- [ ] Uncheck Quran, check "Arabic Language"
- [ ] **Expected:** All 3 teachers should show (all teach Arabic)

**Step 2.5: Test Gender Filter**
- [ ] Uncheck all subjects
- [ ] Check "Male" under Gender
- [ ] **Expected:** Filters teachers by gender
- [ ] Check console for any errors

**Step 2.6: Clear All Filters**
- [ ] Uncheck all filters
- [ ] **Expected:** All 3 teachers show again

### Verification Commands

```bash
# Verify teachers with availability
./supabase-query.sh "SELECT p.full_name, COUNT(*) as slots FROM teacher_profiles tp JOIN profiles p ON tp.user_id = p.id JOIN teacher_availability ta ON ta.teacher_id = tp.id WHERE ta.is_available = true AND tp.status = 'approved' GROUP BY p.full_name ORDER BY p.full_name;"
```

### Success Criteria
- ✅ Only teachers WITH availability appear
- ✅ Subject filters work correctly
- ✅ Gender filters work correctly
- ✅ No console errors

### Results
- Status: ⏳ PENDING
- Teachers Shown:
- Issues Found:
- Notes:

---

## TEST 3: ADD LESSON TO CART

### Objective
Select a teacher, choose time slot, and add lesson to cart.

### Prerequisites
- ✅ Logged in as student
- ✅ On Teachers page

### Test Steps

**Step 3.1: Select Teacher**
- [ ] Click "Book Now" on any teacher (recommend "Ayodeji Teacher")
- [ ] **Expected:** Redirected to booking page `/teacher/:id/book`

**Step 3.2: Select Date and Time**
- [ ] Choose a date (recommend today or tomorrow)
- [ ] Select available time slot (green slots)
- [ ] **Expected:** Time slot becomes selected

**Step 3.3: Select Subject**
- [ ] Choose subject (e.g., "Quran with Understanding")
- [ ] **Expected:** Subject selected

**Step 3.4: Select Duration**
- [ ] Choose duration (30 or 60 minutes)
- [ ] Verify price updates based on duration
- [ ] **Expected:** Price shown correctly

**Step 3.5: Add to Cart**
- [ ] Click "Add to Cart" button
- [ ] **Expected:** Success message appears
- [ ] **Expected:** Cart icon shows "1" badge

**Step 3.6: View Cart**
- [ ] Click shopping cart icon in header
- [ ] **Expected:** Cart drawer opens
- [ ] **Expected:** Shows lesson details:
  - Teacher name
  - Subject
  - Date and time
  - Duration
  - Price

### Verification Commands

```bash
# Check cart items
./supabase-query.sh "SELECT ci.*, p.email FROM cart_items ci JOIN profiles p ON ci.user_id = p.id WHERE p.email = 'teststudent@testing.com';"
```

### Success Criteria
- ✅ Lesson added to cart successfully
- ✅ Cart shows correct details
- ✅ Price calculated correctly
- ✅ Cart persists on page reload

### Results
- Status: ⏳ PENDING
- Cart Items Count:
- Price Shown:
- Issues Found:
- Notes:

---

## TEST 4: CHECKOUT WITH PROMO CODE

### Objective
Complete checkout using 100% discount promo code.

### Prerequisites
- ✅ Lesson in cart (from Test 3)

### Test Steps

**Step 4.1: Proceed to Checkout**
- [ ] In cart drawer, click "Proceed to Checkout"
- [ ] **Expected:** Redirected to `/checkout` page

**Step 4.2: Apply Promo Code**
- [ ] Find promo code input field
- [ ] Enter: `100HONOR`
- [ ] Click "Apply" or press Enter
- [ ] **Expected:** Discount applied
- [ ] **Expected:** Total shows £0.00 or $0.00

**Step 4.3: Complete Free Checkout**
- [ ] Click "Complete Booking" or similar button
- [ ] **Expected:** No Stripe payment required (it's free!)
- [ ] **Expected:** Redirected to success page

**Step 4.4: Verify Success Page**
- [ ] Check URL includes `/payment-success` or similar
- [ ] **Expected:** Confirmation message shown
- [ ] **Expected:** Booking details displayed

### Verification Commands

```bash
# Check if lesson was created
./supabase-query.sh "SELECT l.id, l.scheduled_time, l.status, l.is_free_trial, l.total_cost_paid, le.name as student FROM lessons l JOIN learners le ON l.learner_id = le.id JOIN profiles p ON le.parent_id = p.id WHERE p.email = 'teststudent@testing.com' ORDER BY l.created_at DESC LIMIT 3;"

# Check 100ms room details
./supabase-query.sh "SELECT id, \\\"100ms_room_id\\\", teacher_room_code, student_room_code FROM lessons WHERE id = (SELECT id FROM lessons l JOIN learners le ON l.learner_id = le.id JOIN profiles p ON le.parent_id = p.id WHERE p.email = 'teststudent@testing.com' ORDER BY l.created_at DESC LIMIT 1);"
```

### Success Criteria
- ✅ Promo code applies 100% discount
- ✅ Checkout completes without payment
- ✅ Lesson created in database
- ✅ is_free_trial = true
- ✅ total_cost_paid = 0
- ✅ 100ms room created with room codes

### Results
- Status: ⏳ PENDING
- Promo Code Worked:
- Lesson Created:
- Room ID:
- Room Codes Present:
- Issues Found:
- Notes:

---

## TEST 5: VERIFY LESSON IN DASHBOARD

### Objective
Confirm lesson appears in student dashboard.

### Prerequisites
- ✅ Lesson created (from Test 4)

### Test Steps

**Step 5.1: Navigate to Dashboard**
- [ ] Click "Dashboard" in menu
- [ ] OR navigate to http://localhost:5173/dashboard
- [ ] **Expected:** Dashboard loads

**Step 5.2: Check Upcoming Sessions**
- [ ] Scroll to "Upcoming Sessions" card
- [ ] **Expected:** Shows the lesson you just booked
- [ ] Verify details:
  - [ ] Teacher name correct
  - [ ] Subject correct
  - [ ] Date and time correct
  - [ ] Duration shown

**Step 5.3: Check Session Status**
- [ ] Verify lesson status badge (should be "Booked" or "Confirmed")
- [ ] **Expected:** Status is not "Cancelled" or "Error"

### Verification Commands

```bash
# Get lesson details with teacher info
./supabase-query.sh "SELECT l.id, l.scheduled_time, l.status, l.duration_minutes, s.name as subject, tp_prof.full_name as teacher FROM lessons l JOIN subjects s ON l.subject_id = s.id JOIN teacher_profiles tp ON l.teacher_id = tp.id JOIN profiles tp_prof ON tp.user_id = tp_prof.id JOIN learners le ON l.learner_id = le.id JOIN profiles p ON le.parent_id = p.id WHERE p.email = 'teststudent@testing.com' ORDER BY l.created_at DESC LIMIT 1;"
```

### Success Criteria
- ✅ Lesson appears in dashboard
- ✅ All details correct
- ✅ Status is "booked" or "confirmed"
- ✅ "Join Session" button visible (if time is near)

### Results
- Status: ⏳ PENDING
- Lesson Visible:
- Details Correct:
- Issues Found:
- Notes:

---

## TEST 6: JOIN VIDEO SESSION

### Objective
Test 100ms video room joining.

### Prerequisites
- ✅ Lesson booked with upcoming time
- ✅ 100ms room created

### Test Steps

**Step 6.1: Navigate to Lesson**
- [ ] In dashboard, find the booked lesson
- [ ] Click "Join Session" or "View Details"
- [ ] **Expected:** Redirected to `/lesson/:id` page

**Step 6.2: Verify Room Loads**
- [ ] Open browser console (F12)
- [ ] Look for 100ms initialization logs
- [ ] **Expected:** No "room code does not exist" errors
- [ ] **Expected:** Video component renders

**Step 6.3: Check Room Details**
- [ ] Verify room controls appear (mute, video, etc.)
- [ ] **Expected:** 100ms SDK initializes
- [ ] Check console for auth token request

**Step 6.4: Test Room Code (Advanced)**
- [ ] In console, check network tab
- [ ] Look for request to `get-hms-token` function
- [ ] **Expected:** Returns valid token
- [ ] **Expected:** No 400/500 errors

### Verification Commands

```bash
# Get room details for the lesson
./supabase-query.sh "SELECT l.id, l.\\\"100ms_room_id\\\", l.teacher_room_code, l.student_room_code, l.scheduled_time FROM lessons l JOIN learners le ON l.learner_id = le.id JOIN profiles p ON le.parent_id = p.id WHERE p.email = 'teststudent@testing.com' ORDER BY l.created_at DESC LIMIT 1;"

# Verify room code format
./supabase-query.sh "SELECT CASE WHEN student_room_code ~ '^[a-z]{3}-[a-z]{4}-[a-z]{3}$' THEN 'Valid format' ELSE 'Invalid format' END as room_code_check FROM lessons WHERE student_room_code IS NOT NULL LIMIT 1;"
```

### Success Criteria
- ✅ Lesson page loads without errors
- ✅ Room codes exist in database
- ✅ 100ms SDK initializes
- ✅ No "room does not exist" error
- ✅ Video controls appear

### Results
- Status: ⏳ PENDING
- Page Loaded:
- Room Code Valid:
- Console Errors:
- Issues Found:
- Notes:

---

## ISSUES LOG

### Issue #1
**Test:**
**Description:**
**Severity:**
**Status:**
**Fix:**

### Issue #2
**Test:**
**Description:**
**Severity:**
**Status:**
**Fix:**

---

## SUMMARY

### Tests Completed: 0/6

- [ ] Test 1: Student Signup
- [ ] Test 2: Browse Teachers
- [ ] Test 3: Add to Cart
- [ ] Test 4: Checkout with Promo
- [ ] Test 5: Dashboard Verification
- [ ] Test 6: Video Join

### Overall Status: 🟡 IN PROGRESS

### Critical Issues: 0
### Minor Issues: 0
### Tests Passed: 0
### Tests Failed: 0

### Next Steps:
1. Begin Test 1 - Student Signup
2. Document any errors in Issues Log
3. Fix issues before proceeding to next test

---

**Testing Notes:**
- Use incognito/private browsing for clean session
- Keep browser console open (F12) to catch errors
- Take screenshots of any errors
- Document ALL unexpected behavior

