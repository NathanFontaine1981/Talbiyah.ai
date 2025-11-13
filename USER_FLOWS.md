# TALBIYAH.AI - USER FLOWS DOCUMENTATION

**Last Updated:** November 9, 2025

This document provides detailed step-by-step walkthroughs for each user role on the Talbiyah.ai platform.

**Legend:**
- ✅ Working as expected
- ⚠️ Working with minor issues
- ❌ Not working / Broken
- 🚧 In progress / Coming soon

---

## 1. STUDENT FLOW

### 1.1 Student Signup → First Lesson

#### Step 1: Sign Up
**Page:** `/signup`
**Status:** ✅ Working

**Actions:**
1. Navigate to home page
2. Click "Get Started" or "Sign Up"
3. Fill out signup form:
   - Full Name
   - Email
   - Password
   - Role selection: "Student"
4. Submit form

**What Happens:**
- ✅ Account created in Supabase Auth
- ✅ Profile created in `profiles` table with role="student"
- ✅ Learner profile auto-created in `learners` table
- ✅ User redirected to `/welcome`

**Verification:**
- Check email for confirmation (if enabled)
- Verify profile in database

---

#### Step 2: Welcome & Onboarding
**Page:** `/welcome`
**Status:** ✅ Working

**Actions:**
1. View welcome message
2. Optional: Upload avatar
3. Click "Go to Dashboard"

**What Happens:**
- ✅ Avatar uploaded to Supabase Storage
- ✅ Profile updated with avatar URL
- ✅ Redirected to `/dashboard`

---

#### Step 3: Student Dashboard
**Page:** `/dashboard`
**Status:** ✅ Working

**Features Visible:**
- ✅ Dashboard header with level/XP
- ✅ Prayer times widget
- ✅ Referral system banner (with unique code + URL)
- ✅ Upcoming sessions card (empty initially)
- ✅ Recent recordings card
- ✅ Learning stats widget
- ✅ My teachers widget
- ✅ Points redemption
- ✅ Recommended actions
- ✅ Announcements

**Actions Available:**
- View progress
- Browse teachers
- Manage assigned teachers
- View referral details
- Redeem points

---

#### Step 4: Browse Teachers
**Page:** `/teachers`
**Status:** ✅ Working

**Features:**
- ✅ List of approved teachers
- ✅ Filter by subject
- ✅ Search by name
- ✅ View hourly rates
- ✅ See teacher bios
- ✅ View specializations

**Actions:**
1. Browse teacher list
2. Click on teacher card
3. Navigate to teacher profile

**What Happens:**
- ✅ Teachers fetched from `teacher_profiles` table
- ✅ Only approved teachers shown
- ✅ Subjects loaded from `teacher_subjects`

---

#### Step 5: View Teacher Profile
**Page:** `/teacher/:id`
**Status:** ✅ Working

**Features:**
- ✅ Teacher name and bio
- ✅ Hourly rate
- ✅ Subjects taught
- ✅ Experience years
- ✅ Video introduction (if uploaded)
- ✅ "Book Free Trial" button
- ✅ "Book Lesson" button

**Actions:**
1. View teacher details
2. Click "Book Free Trial" or "Book Lesson"
3. Opens booking modal OR navigates to `/teacher/:id/book`

**What Happens:**
- ✅ Teacher profile loaded
- ✅ Subjects displayed
- ✅ Booking modal opens (for free trial)
- ✅ Navigation to booking page (for regular lessons)

---

#### Step 6: Book Session
**Page:** `/teacher/:id/book`
**Status:** ✅ Working

**Features:**
- ✅ Teacher info displayed
- ✅ Subject selection
- ✅ Duration selection (30 or 60 min)
- ✅ Date picker (next 14 days)
- ✅ Time slot selection (adjusts to duration)
- ✅ Available slots from API
- ✅ Add to cart button

**Recent Fixes:**
- ✅ Time slots now adjust based on duration (30 min intervals for 30 min sessions, 60 min intervals for 60 min sessions)

**Flow:**
1. Select subject
2. Select duration (30 or 60 min)
3. Select date
4. Select available time slot
5. Click "Add to Cart"

**What Happens:**
- ✅ Availability API called (`get-available-slots`)
- ✅ Available slots loaded based on teacher schedule
- ✅ Item added to cart context
- ✅ Cart item stored in localStorage
- ✅ Cart drawer opens
- ✅ Item added to `cart_items` table

---

#### Step 7: Review Cart
**Page:** `/cart` (or cart drawer)
**Status:** ✅ Working

**Features:**
- ✅ List of cart items
- ✅ Teacher name, subject, date, time
- ✅ Price per item
- ✅ Remove item button
- ✅ Total price calculation
- ✅ Proceed to checkout button
- ✅ Cart expiration timer (24 hours)

**Actions:**
1. Review cart items
2. Remove items if needed
3. Click "Proceed to Checkout"

**What Happens:**
- ✅ Cart items fetched from database
- ✅ Prices calculated
- ✅ Navigation to `/checkout`

---

#### Step 8: Checkout
**Page:** `/checkout`
**Status:** ✅ Working

**Features:**
- ✅ Order summary
- ✅ Cart items list
- ✅ Promo code input
- ✅ Discount application (100OWNER = 100% off)
- ✅ Total price calculation
- ✅ Stripe checkout button
- ✅ Free booking flow (for 100% discount)

**Flow:**
1. Review order summary
2. Apply promo code (optional)
3. If promo = 100% discount:
   - ✅ Creates bookings directly via edge function
   - ✅ Creates 100ms rooms
   - ✅ Redirects to success page
4. If payment required:
   - ✅ Click "Proceed to Payment"
   - ✅ Stripe Checkout session created
   - ✅ Redirected to Stripe payment page

**What Happens:**
- ✅ Promo code validated
- ✅ For free: `create-booking-with-room` edge function called
- ✅ For paid: `initiate-booking-checkout` edge function called
- ✅ Stripe session created
- ✅ User redirected to Stripe

---

#### Step 9: Payment
**Page:** Stripe Checkout (external)
**Status:** ✅ Working - ⚠️ LIVE MODE

**Flow:**
1. Enter payment details on Stripe
2. Complete payment
3. Stripe redirects to success page

**Test Card:** 4242 4242 4242 4242

**What Happens:**
- ✅ Stripe processes payment
- ✅ Webhook sent to `stripe-webhooks` edge function
- ✅ Bookings created in database
- ✅ 100ms rooms created
- ✅ Cart cleared
- ✅ Payment record created

**⚠️ WARNING:** Live Stripe keys active - real charges will occur!

---

#### Step 10: Booking Confirmation
**Page:** `/payment-success`
**Status:** ✅ Working

**Features:**
- ✅ Success message
- ✅ Booking details
- ✅ Number of sessions booked
- ✅ Next steps instructions
- ✅ Link to dashboard
- ✅ Link to upcoming sessions

**Actions:**
1. View confirmation
2. Click "View My Sessions"
3. Navigate to dashboard

---

#### Step 11: View Upcoming Sessions
**Page:** `/dashboard` (Upcoming Sessions Card)
**Status:** ✅ Working

**Features:**
- ✅ List of booked sessions
- ✅ Teacher name and avatar
- ✅ Subject
- ✅ Date and time
- ✅ Duration
- ✅ Join button (time-based)
- ✅ "READY" badge (15 min before)

**Join Button Logic:**
- ✅ Disabled before 15-minute window
- ✅ Shows countdown timer
- ✅ Enabled 15 minutes before session
- ✅ Shows "READY" animated badge
- ✅ Disabled after session ends

**What Happens:**
- ✅ Sessions fetched from `bookings` table
- ✅ 100ms room ID retrieved
- ✅ Time calculations performed
- ✅ Button state updated

---

#### Step 12: Join Session
**Action:** Click "Join" button
**Status:** ✅ Working

**What Happens:**
- ✅ 100ms room ID retrieved
- ✅ Token generation API called (`get-hms-token`)
- ✅ User joins video room
- ✅ Recording started (if enabled)

---

### 1.2 Student Additional Features

#### Assign Teachers
**Page:** `/student/my-teachers`
**Status:** ✅ Working (Just Implemented)

**Flow:**
1. Navigate from dashboard widget
2. View assigned teachers list
3. Click "Add Teacher"
4. Browse all approved teachers
5. Click "Assign Teacher"
6. Teacher added to roster

**Features:**
- ✅ List assigned teachers
- ✅ Browse all approved teachers
- ✅ Assign/remove teachers
- ✅ View teacher profiles
- ✅ Track assignment date

---

#### View Quran Progress
**Page:** `/progress/quran`
**Status:** ✅ Working

**Features:**
- ✅ Surah list with progress
- ✅ Ayah-level tracking
- ✅ Visual progress bars
- ✅ Completion percentages
- ✅ Search surahs

---

#### Use Virtual Imam
**Page:** `/virtual-imam`
**Status:** ✅ Working

**Flow:**
1. Navigate to Virtual Imam
2. Type Islamic question
3. Send message
4. Receive AI response with citations

**Features:**
- ✅ Chat interface
- ✅ Conversation history
- ✅ Quran/Hadith references
- ✅ Islamic context

---

#### Manage Referrals
**Page:** `/refer`
**Status:** ✅ Working

**Features:**
- ✅ Unique referral code displayed
- ✅ Full referral URL shown
- ✅ Copy to clipboard
- ✅ WhatsApp share
- ✅ Email share
- ✅ Stats (referrals, credits earned)

**Dashboard Banner:**
- ✅ Referral code visible
- ✅ Full URL displayed
- ✅ Copy button
- ✅ Credits earned shown
- ✅ Link to details page

**Recent Fixes:**
- ✅ Fixed color contrast (dark text on white)
- ✅ Added visible URL
- ✅ Auto-generates code if missing

---

## 2. TEACHER FLOW

### 2.1 Teacher Application → First Session

#### Step 1: Sign Up as Teacher
**Page:** `/signup`
**Status:** ✅ Working

**Flow:**
1. Navigate to signup
2. Select role: "Teacher"
3. Fill out form
4. Submit

**What Happens:**
- ✅ Account created with role="teacher"
- ✅ Profile created
- ✅ Redirected to `/teacher/setup-profile`

---

#### Step 2: Set Up Teacher Profile
**Page:** `/teacher/setup-profile`
**Status:** ✅ Working

**Features:**
- ✅ Bio text area
- ✅ Hourly rate input
- ✅ Experience years
- ✅ Subject selection (multi-select)
- ✅ Video introduction upload
- ✅ Audio recording option
- ✅ Qualifications upload

**Flow:**
1. Fill out profile information
2. Select subjects to teach
3. Set hourly rate
4. Record or upload introduction video
5. Submit profile

**What Happens:**
- ✅ Teacher profile created in `teacher_profiles`
- ✅ Subjects linked in `teacher_subjects`
- ✅ Video uploaded to Supabase Storage
- ✅ Status set to "pending"
- ✅ Redirected to `/teacher/pending-approval`

---

#### Step 3: Pending Approval
**Page:** `/teacher/pending-approval`
**Status:** ✅ Working

**Features:**
- ✅ Pending status message
- ✅ Expected timeline
- ✅ Next steps information
- ✅ Contact support link

**What Happens:**
- ✅ Teacher waits for admin approval
- ✅ Can view but not edit profile
- ✅ Cannot set availability yet

---

#### Step 4: Admin Approval
**Page:** `/admin/teachers` (Admin side)
**Status:** ✅ Working

**Admin Actions:**
1. View pending teachers list
2. Review profile
3. Approve or reject
4. Send notification (manual)

**What Happens:**
- ✅ Admin views teacher details
- ✅ Admin clicks "Approve"
- ✅ Status changed to "approved"
- ✅ Teacher can now log in and set availability

---

#### Step 5: Set Availability
**Page:** `/teacher/availability`
**Status:** ✅ Working

**Features:**
- ✅ Weekly calendar view
- ✅ Select days of week
- ✅ Add time slots
- ✅ Set duration preference (30/60 min)
- ✅ Recurring schedule
- ✅ Block specific dates
- ✅ Visual feedback (transparent green for available)

**Recent Fixes:**
- ✅ Available slots shown with transparent green background
- ✅ Visual consistency with blocked dates

**Flow:**
1. Select day(s) of week
2. Click time slots to mark available
3. Set duration preference
4. Save schedule

**What Happens:**
- ✅ Availability saved to `teacher_availability`
- ✅ Recurring weekly schedule created
- ✅ API can now return available slots

---

#### Step 6: Teacher Dashboard
**Page:** `/dashboard`
**Status:** ✅ Working

**Features:**
- ✅ Teaching stats widget (hours, earnings)
- ✅ Upcoming sessions card
- ✅ My students card
- ✅ Prayer times
- ✅ Notifications

**Student Card Features:**
- ✅ Shows students with lessons
- ✅ Shows assigned students (with badge)
- ✅ Assignment date displayed
- ✅ Lesson count and hours
- ✅ Sorted (assigned first)

---

#### Step 7: View Assigned Students
**Component:** TeacherStudentsCard
**Status:** ✅ Working (Just Updated)

**Features:**
- ✅ List of all students
- ✅ "Assigned" badge for students who chose this teacher
- ✅ Assignment date shown
- ✅ Lesson history (count, hours)
- ✅ Student avatars
- ✅ Sorted: assigned students first

---

#### Step 8: Receive Booking
**Trigger:** Student books session
**Status:** ✅ Working

**What Happens:**
- ✅ Booking appears in "Upcoming Sessions"
- ✅ Student info visible
- ✅ 100ms room created
- ✅ Teacher room code generated
- ✅ Join button available

---

#### Step 9: Join Session
**Action:** Click "Join" on session
**Status:** ✅ Working

**What Happens:**
- ✅ Token generated with teacher role
- ✅ Join 100ms room
- ✅ Recording started
- ✅ Meet with student

---

#### Step 10: Complete Session
**After session ends**
**Status:** ✅ Working

**What Happens:**
- ✅ Session marked as completed
- ✅ Recording saved (if enabled)
- ✅ Stats updated (hours taught, earnings)
- ✅ Student added to roster

---

### 2.2 Teacher Additional Features

#### Edit Profile
**Page:** `/teacher/edit-profile`
**Status:** ✅ Working

**Features:**
- ✅ Update bio
- ✅ Change hourly rate
- ✅ Update subjects
- ✅ Re-record introduction

---

#### View Teaching Stats
**Component:** TeacherStatsWidget
**Status:** ✅ Working

**Metrics:**
- ✅ Total hours taught
- ✅ Total earnings
- ✅ Number of students
- ✅ Average rating (placeholder)

---

## 3. PARENT FLOW

### 3.1 Parent Signup → Book for Child

#### Step 1: Sign Up as Parent
**Page:** `/signup`
**Status:** ✅ Working

**Flow:**
1. Select role: "Parent"
2. Fill out form
3. Submit

**What Happens:**
- ✅ Account created with role="parent"
- ✅ Redirected to `/parent/onboarding`

---

#### Step 2: Parent Onboarding
**Page:** `/parent/onboarding`
**Status:** ✅ Working

**Features:**
- ✅ Welcome message
- ✅ Add children form
- ✅ Multiple children support
- ✅ Age and gender tracking

**Flow:**
1. View onboarding
2. Add child information
3. Or link existing child account
4. Submit

**What Happens:**
- ✅ Learner profiles created for children
- ✅ Parent-child link created in `parent_children`
- ✅ Redirected to parent dashboard

---

#### Step 3: Parent Dashboard
**Page:** `/dashboard` or `/parent/dashboard`
**Status:** ✅ Working

**Features:**
- ✅ List of children
- ✅ Child selector dropdown
- ✅ View child dashboard
- ✅ Book sessions for children
- ✅ Track child progress

---

#### Step 4: Manage Children
**Page:** `/my-children`
**Status:** ✅ Working

**Features:**
- ✅ List all children
- ✅ Add new child
- ✅ Link existing account
- ✅ View child dashboard
- ✅ Edit child info

**Flow:**
1. View children list
2. Click "Add Child"
3. Fill out form
4. Submit

---

#### Step 5: View Child Dashboard
**Page:** `/child/:childId/dashboard`
**Status:** ✅ Working

**Features:**
- ✅ Child's progress
- ✅ Child's sessions
- ✅ Child's teachers
- ✅ Child's stats
- ✅ Book session for child

---

#### Step 6: Book Session for Child
**Flow:** Same as student booking flow
**Status:** ✅ Working

**Differences:**
- ✅ Child selector in checkout
- ✅ Learner ID from selected child
- ✅ Parent pays, child attends

---

## 4. ADMIN FLOW

### 4.1 Admin Login → Manage Platform

#### Step 1: Admin Login
**Page:** `/`
**Status:** ✅ Working

**Flow:**
1. Navigate to home
2. Click "Sign In"
3. Enter admin credentials
4. Auto-redirected to `/admin`

**Admin Account:**
- Email: contact@talbiyah.ai
- Role: Admin (set in database)

---

#### Step 2: Admin Dashboard
**Page:** `/admin`
**Status:** ✅ Working

**Features:**
- ✅ Real-time statistics
- ✅ Total students, teachers, parents
- ✅ Total sessions and revenue
- ✅ Today's sessions
- ✅ Database health metrics
- ✅ API service status
- ✅ Quick actions
- ✅ Recent activity feed
- ✅ System notifications

**Metrics Displayed:**
- ✅ User counts
- ✅ Session counts
- ✅ Revenue (total and today)
- ✅ Database response time
- ✅ API status checks

---

#### Step 3: Manage Users
**Page:** `/admin/users`
**Status:** ✅ Working

**Features:**
- ✅ User list with search
- ✅ Filter by role
- ✅ View user details
- ✅ Edit user info
- ✅ Create new user
- ✅ Delete user
- ✅ Change user role

**Actions:**
1. Search for user
2. Filter by role
3. Click user to view details
4. Edit or delete

---

#### Step 4: Manage Teachers
**Page:** `/admin/teachers`
**Status:** ✅ Working

**Features:**
- ✅ Teacher list
- ✅ Filter by status (pending, approved, rejected)
- ✅ View teacher profile
- ✅ Approve teacher
- ✅ Reject teacher
- ✅ View subjects
- ✅ View availability

**Approval Flow:**
1. View pending teachers
2. Click on teacher
3. Review profile, bio, video
4. Click "Approve" or "Reject"
5. Status updated

---

#### Step 5: Manage Sessions
**Page:** `/admin/sessions`
**Status:** ✅ Working

**Features:**
- ✅ All sessions list
- ✅ Filter by status (booked, completed, cancelled)
- ✅ Search by student/teacher
- ✅ View session details
- ✅ Update session status
- ✅ View 100ms room info

---

#### Step 6: Manage Group Sessions
**Page:** `/admin/group-sessions`
**Status:** ✅ Working

**Features:**
- ✅ Group session list
- ✅ Create new group session
- ✅ View participants
- ✅ Edit session details
- ✅ Cancel session

---

#### Step 7: Manage Courses
**Page:** `/admin/courses`
**Status:** ✅ Working

**Features:**
- ✅ Subject list
- ✅ Add new subject
- ✅ Edit subject
- ✅ View teachers per subject

---

#### Step 8: View Recordings
**Page:** `/admin/recordings`
**Status:** ✅ Working

**Features:**
- ✅ All recordings list
- ✅ Filter by teacher/student
- ✅ Play recording
- ✅ Download recording
- ✅ Delete recording

---

#### Step 9: View Analytics
**Page:** `/admin/analytics`
**Status:** ✅ Working

**Features:**
- ✅ Revenue charts
- ✅ User growth
- ✅ Session stats
- ✅ Teacher performance
- ✅ Popular subjects
- ✅ Retention metrics

---

## 5. COMMON FLOWS

### 5.1 Update Profile
**Page:** `/account/settings`
**Status:** ✅ Working

**Features:**
- ✅ Update name
- ✅ Update email
- ✅ Change password
- ✅ Upload avatar
- ✅ Update timezone
- ✅ Notification preferences

---

### 5.2 Virtual Imam Chat
**Page:** `/virtual-imam`
**Status:** ✅ Working (All Roles)

**Flow:**
1. Navigate to Virtual Imam
2. Type Islamic question
3. Send
4. Receive AI response with citations
5. Continue conversation

**Features:**
- ✅ Claude AI integration
- ✅ Conversation history
- ✅ Islamic context
- ✅ Quran/Hadith references

---

### 5.3 Logout
**Action:** Click logout in header
**Status:** ✅ Working

**What Happens:**
- ✅ Session cleared
- ✅ Redirected to home page
- ✅ Cart persists (localStorage)

---

## 6. SUMMARY OF FLOWS

### Working Flows ✅
- [x] Student: Signup → Browse → Book → Pay → Join Session
- [x] Teacher: Signup → Profile → Approval → Availability → Teach
- [x] Parent: Signup → Add Children → Book for Child → Monitor Progress
- [x] Admin: Login → Approve Teachers → Manage Users → View Analytics
- [x] All: Virtual Imam, Profile Settings, Logout

### Partially Working ⚠️
- None identified

### Broken Flows ❌
- None identified

### Coming Soon 🚧
- Email notifications (booking confirmations)
- SMS reminders
- In-app notifications
- Push notifications

---

## 7. EDGE CASES TESTED

### Cart Expiration
- ✅ Cart items expire after 24 hours
- ✅ Expired items removed automatically

### Session Timing
- ✅ Join button disabled before window
- ✅ Join button enabled 15 min before
- ✅ Join button disabled after session

### Payment Failures
- ✅ Stripe handles payment failures
- ✅ User can retry payment
- ✅ Cart preserved on failure

### Discount Codes
- ✅ 100OWNER code works (100% off)
- ✅ Free bookings create sessions directly
- ✅ No Stripe charge for 100% off

---

**Documentation Complete**
**Last Updated:** November 9, 2025
**Status:** All major flows working and tested
