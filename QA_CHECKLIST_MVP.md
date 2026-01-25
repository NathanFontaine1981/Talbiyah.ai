# Talbiyah.ai MVP QA Checklist

**Version:** 1.0
**Last Updated:** January 25, 2026
**Project:** Talbiyah.ai - Islamic Education Platform

---

## Quick Reference

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not tested |
| `[x]` | Passed |
| `[!]` | Failed - needs fix |
| `[~]` | Partial - works with issues |
| `N/A` | Not applicable for MVP |

---

## 1. Authentication & User Management

### 1.1 Sign Up Flow
- [ ] Email/password registration works
- [ ] Email verification sent successfully
- [ ] Verification link works and confirms account
- [ ] Google OAuth sign up works
- [ ] Apple OAuth sign up works (if enabled)
- [ ] Referral code applied during signup
- [ ] Error messages display correctly for invalid inputs
- [ ] Duplicate email prevention works

### 1.2 Sign In Flow
- [ ] Email/password login works
- [ ] Google OAuth login works
- [ ] "Forgot Password" sends reset email
- [ ] Password reset link works
- [ ] Session persists across browser refresh
- [ ] Session expires appropriately
- [ ] Redirect to intended page after login

### 1.3 User Roles
- [ ] Student role assigned correctly
- [ ] Teacher role assigned after approval
- [ ] Admin role restricted properly
- [ ] Parent role functions correctly
- [ ] Role-based route protection works

---

## 2. Student Features

### 2.1 Dashboard
- [ ] Dashboard loads without errors
- [ ] Upcoming lessons display correctly
- [ ] Credit balance shows accurately
- [ ] Token balance shows accurately
- [ ] Quick action buttons work
- [ ] Recent recordings accessible
- [ ] Progress widgets display correctly

### 2.2 Booking System
- [ ] Browse teachers page loads
- [ ] Teacher profiles display correctly
- [ ] Filter teachers by subject works
- [ ] Filter teachers by availability works
- [ ] Select time slot works
- [ ] Select subject works
- [ ] Book session with credits works
- [ ] Booking confirmation displays
- [ ] Booking appears in upcoming lessons
- [ ] Email confirmation sent

### 2.3 Credit System
- [ ] View credit balance
- [ ] Purchase credits via Stripe
- [ ] Stripe checkout completes
- [ ] Credits added after successful payment
- [ ] Payment history displays correctly
- [ ] Credit purchase success page works
- [ ] Failed payment handled gracefully

### 2.4 Token System (AI Features)
- [ ] View token balance
- [ ] Purchase tokens works
- [ ] Tokens deducted for AI features
- [ ] Token purchase success page works
- [ ] Insufficient tokens message displays

### 2.5 Live Lessons (100ms Integration)
- [ ] Join lesson button works
- [ ] Video/audio connects properly
- [ ] Screen sharing works
- [ ] Chat function works
- [ ] Leave lesson works
- [ ] Lesson ends properly
- [ ] Recording starts automatically
- [ ] Recording saved after lesson

### 2.6 Recordings & Insights
- [ ] Recording history page loads
- [ ] Recordings playback works
- [ ] Lesson insights generate automatically
- [ ] Insights display correctly (markdown rendering)
- [ ] Tafsir section shows scholarly commentary
- [ ] Verified verses display from Quran.com
- [ ] First Word Prompter section works
- [ ] Quiz section displays correctly
- [ ] Download/share insights works

### 2.7 Progress Tracking
- [ ] Quran progress page loads
- [ ] Surahs covered display correctly
- [ ] Ayah-level progress tracking works
- [ ] Arabic progress page loads
- [ ] Progress syncs with lesson insights

### 2.8 My Teachers
- [ ] View assigned teachers
- [ ] Teacher contact info visible
- [ ] Book with specific teacher works

### 2.9 Group Classes
- [ ] Browse group classes
- [ ] Join group class works
- [ ] Group class appears in schedule

---

## 3. Teacher Features

### 3.1 Teacher Application
- [ ] Apply to teach form submits
- [ ] Document upload works
- [ ] Application status displays
- [ ] Pending approval page shows correctly
- [ ] Email notification sent to admin

### 3.2 Teacher Onboarding
- [ ] Profile setup wizard works
- [ ] Upload profile photo works
- [ ] Set subjects taught
- [ ] Set hourly rate
- [ ] Bio and qualifications saved
- [ ] Video introduction upload (if applicable)

### 3.3 Availability Management
- [ ] Set weekly availability
- [ ] Block specific dates
- [ ] Timezone displays correctly
- [ ] Availability syncs with booking system
- [ ] Changes save successfully

### 3.4 Teacher Hub
- [ ] Dashboard loads correctly
- [ ] Upcoming lessons display
- [ ] Student list accessible
- [ ] Earnings summary visible
- [ ] Quick actions work

### 3.5 My Students
- [ ] View all students
- [ ] Student progress visible
- [ ] Book session with student works
- [ ] View student's lesson history

### 3.6 Live Teaching
- [ ] Start lesson works
- [ ] All video/audio features work
- [ ] End lesson properly saves recording
- [ ] Post-lesson summary option

### 3.7 Earnings & Payouts
- [ ] View earnings history
- [ ] Earnings calculated correctly
- [ ] Payout settings configurable
- [ ] Stripe Connect onboarding works
- [ ] Bank account verification works

### 3.8 Homework Review
- [ ] View submitted homework
- [ ] Grade/feedback submission works
- [ ] Student notified of feedback

---

## 4. Parent Features

### 4.1 Parent Onboarding
- [ ] Parent onboarding flow works
- [ ] Add child account works
- [ ] Link existing child account works

### 4.2 My Children
- [ ] View all children
- [ ] Switch between child dashboards
- [ ] Book lessons for children
- [ ] View child's progress
- [ ] View child's recordings

---

## 5. AI-Powered Features

### 5.1 Dua Builder
- [ ] Page loads correctly
- [ ] Browse dua library works
- [ ] Build custom dua (6-step process)
- [ ] Select blocks for each step
- [ ] Custom text input works
- [ ] Preview composed dua
- [ ] Save dua to My Duas
- [ ] Name custom dua works
- [ ] Rename dua works
- [ ] Generate audio works
- [ ] Token deduction for audio
- [ ] Names of Allah tab works

### 5.2 Qunut Practice
- [ ] Page loads correctly
- [ ] Full view mode works
- [ ] Line by line mode works
- [ ] Audio playback per line works
- [ ] Full dua audio playback works
- [ ] PDF download works
- [ ] PDF shows Arabic correctly
- [ ] PDF transliteration readable
- [ ] Toggle transliteration works
- [ ] Toggle translation works
- [ ] Include salawat toggle works

### 5.3 Khutba Creator
- [ ] Page loads correctly
- [ ] Topic selection works
- [ ] Generate khutba outline works
- [ ] Expand sections works
- [ ] Save khutba works
- [ ] Token deduction works

### 5.4 Lesson Insights Generator
- [ ] Insights auto-generate after lesson
- [ ] Correct surah/ayah detection
- [ ] Tafsir from Ibn Kathir displays
- [ ] Verified verses from Quran.com
- [ ] Quiz auto-verification works
- [ ] Manual regenerate works (admin)

### 5.5 Islamic Source Reference
- [ ] Search functionality works
- [ ] Quran verses display correctly
- [ ] Hadith references work
- [ ] Citation generation works

---

## 6. Admin Features

### 6.1 Admin Dashboard
- [ ] Dashboard loads for admin users
- [ ] Key metrics display
- [ ] Navigation to all admin sections

### 6.2 User Management
- [ ] View all users
- [ ] Search users works
- [ ] Filter by role works
- [ ] Edit user details
- [ ] Disable/enable user
- [ ] View user's lessons/payments

### 6.3 Teacher Management
- [ ] View all teachers
- [ ] Review pending applications
- [ ] Approve teacher works
- [ ] Reject teacher works
- [ ] Set teacher tier
- [ ] View teacher earnings

### 6.4 Session Management
- [ ] View all sessions
- [ ] Filter by status
- [ ] Cancel session works
- [ ] Reschedule session works

### 6.5 Recordings Management
- [ ] View all recordings
- [ ] Delete recording works
- [ ] Generate insights manually

### 6.6 Insights Generator
- [ ] Manual insight generation works
- [ ] Select lesson and generate
- [ ] View generation status

### 6.7 Promo Codes
- [ ] Create promo code
- [ ] Set discount type (% or fixed)
- [ ] Set expiration date
- [ ] Deactivate promo code
- [ ] Usage tracking works

### 6.8 Analytics
- [ ] Page loads correctly
- [ ] Revenue charts display
- [ ] User growth charts
- [ ] Lesson completion rates
- [ ] Teacher performance metrics

### 6.9 Teacher Payouts
- [ ] View pending payouts
- [ ] Process payout works
- [ ] Payout confirmation

### 6.10 Feedback Management
- [ ] View all feedback
- [ ] Mark as reviewed
- [ ] Respond to feedback

---

## 7. Payments & Billing

### 7.1 Stripe Integration
- [ ] Credit purchase checkout works
- [ ] Token purchase checkout works
- [ ] Webhook receives events
- [ ] Payment success updates database
- [ ] Payment failure handled
- [ ] Refund processing works

### 7.2 Stripe Connect (Teachers)
- [ ] Onboarding flow works
- [ ] Account verification
- [ ] Payout to bank account

### 7.3 Cart System
- [ ] Add items to cart
- [ ] Remove items from cart
- [ ] Cart persists across sessions
- [ ] Cart expiry notifications work
- [ ] Checkout from cart works

---

## 8. Notifications & Communication

### 8.1 Email Notifications
- [ ] Booking confirmation email
- [ ] Lesson reminder email (24h before)
- [ ] Lesson reminder email (1h before)
- [ ] Payment receipt email
- [ ] Insights ready email
- [ ] Teacher application status email
- [ ] Password reset email

### 8.2 In-App Notifications
- [ ] Toast notifications display
- [ ] Notification bell updates
- [ ] Unread count accurate

### 8.3 Messages
- [ ] Send message to teacher works
- [ ] Receive message notification
- [ ] Message history displays

---

## 9. Diagnostic Assessments

### 9.1 Student Flow
- [ ] Start diagnostic assessment
- [ ] Select assessment type
- [ ] Book diagnostic session
- [ ] Complete diagnostic lesson
- [ ] View diagnostic report

### 9.2 Teacher Flow
- [ ] View diagnostic prep info
- [ ] Conduct diagnostic lesson
- [ ] Submit assessment results
- [ ] Generate recommendations

---

## 10. Public Pages

### 10.1 Landing Page
- [ ] Page loads correctly
- [ ] All sections render
- [ ] CTA buttons work
- [ ] Responsive on mobile
- [ ] Images load properly

### 10.2 Features Page
- [ ] All features listed
- [ ] Links work correctly

### 10.3 Teachers Page (Public)
- [ ] Browse teachers without login
- [ ] Teacher profiles viewable
- [ ] "Book Now" redirects to signup

### 10.4 Explore Page
- [ ] Content loads correctly
- [ ] Navigation works

### 10.5 New Muslim / Salah Tutorial
- [ ] Pages load correctly
- [ ] Content displays properly
- [ ] Videos play (if any)

---

## 11. Mobile Responsiveness

### 11.1 Critical Pages
- [ ] Landing page responsive
- [ ] Dashboard responsive
- [ ] Booking flow responsive
- [ ] Lesson page responsive
- [ ] Dua Builder responsive
- [ ] Qunut Practice responsive

### 11.2 Navigation
- [ ] Mobile menu works
- [ ] All links accessible
- [ ] Touch targets adequate size

---

## 12. Performance

### 12.1 Page Load Times
- [ ] Landing page < 3s
- [ ] Dashboard < 2s
- [ ] Teacher browse < 2s
- [ ] Lesson room < 3s

### 12.2 API Response Times
- [ ] Auth endpoints < 500ms
- [ ] Data fetch < 1s
- [ ] Insight generation < 30s

### 12.3 Error Handling
- [ ] 404 page displays correctly
- [ ] API errors show user-friendly message
- [ ] Network errors handled gracefully
- [ ] Loading states display properly

---

## 13. Security

### 13.1 Authentication
- [ ] Protected routes require login
- [ ] Admin routes require admin role
- [ ] Teacher routes require teacher role
- [ ] JWT tokens expire appropriately
- [ ] Refresh tokens work

### 13.2 Data Protection
- [ ] User can only see own data
- [ ] Teacher can only see own students
- [ ] Admin has full access
- [ ] RLS policies enforced

### 13.3 Input Validation
- [ ] XSS prevention on user inputs
- [ ] SQL injection prevention
- [ ] File upload validation

---

## 14. Edge Functions Deployment

### 14.1 Functions to Deploy
- [ ] `generate-lesson-insights` (with Ibn Kathir tafsir)
- [ ] `generate-dua-audio`
- [ ] `create-booking-with-room`
- [ ] `handle-recording-webhook`
- [ ] `stripe-webhook`
- [ ] `find-and-generate-insights`
- [ ] `manual-generate-insights`
- [ ] `process-teacher-application`
- [ ] `send-admin-alert`

### 14.2 Function Verification
- [ ] All functions deploy without errors
- [ ] Environment variables configured
- [ ] CORS headers correct
- [ ] Rate limiting appropriate

---

## 15. Database & Migrations

### 15.1 Tables Verified
- [ ] `profiles` table structure correct
- [ ] `lessons` table structure correct
- [ ] `lesson_insights` table structure correct
- [ ] `quran_progress` table structure correct
- [ ] `teacher_profiles` table correct
- [ ] `bookings` table correct
- [ ] `recordings` table correct
- [ ] `dua_compositions` table correct

### 15.2 RLS Policies
- [ ] All tables have RLS enabled
- [ ] Policies tested and working
- [ ] No data leakage between users

---

## 16. Third-Party Integrations

### 16.1 100ms (Video)
- [ ] Room creation works
- [ ] Video quality acceptable
- [ ] Recording saves correctly
- [ ] Webhook receives events

### 16.2 Stripe
- [ ] Payment processing works
- [ ] Webhooks configured
- [ ] Connect onboarding works

### 16.3 Quran.com API
- [ ] Verse fetching works
- [ ] Tafsir fetching works
- [ ] Rate limits handled

### 16.4 OpenAI / Anthropic
- [ ] API keys configured
- [ ] Token usage tracked
- [ ] Rate limits handled

### 16.5 Sentry
- [ ] Error tracking configured
- [ ] Errors reported correctly

---

## 17. Pre-Launch Checklist

### 17.1 Environment
- [ ] Production environment variables set
- [ ] API keys are production keys (not test)
- [ ] Domain configured correctly
- [ ] SSL certificate valid
- [ ] CDN configured (if using)

### 17.2 Legal & Compliance
- [ ] Privacy Policy page exists
- [ ] Terms of Service page exists
- [ ] Cookie consent banner works
- [ ] GDPR compliance (if applicable)

### 17.3 Analytics
- [ ] Google Analytics configured
- [ ] Conversion tracking set up
- [ ] Error tracking active

### 17.4 Backups
- [ ] Database backup configured
- [ ] Backup tested and restorable

### 17.5 Monitoring
- [ ] Uptime monitoring configured
- [ ] Alert notifications set up
- [ ] Performance monitoring active

---

## Test Accounts

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Student | test-student@talbiyah.ai | [secure] | Has credits |
| Teacher | test-teacher@talbiyah.ai | [secure] | Approved |
| Admin | admin@talbiyah.ai | [secure] | Full access |
| Parent | test-parent@talbiyah.ai | [secure] | Has child account |

---

## Known Issues / To Fix

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| Example: Token purchase not working | High | Open | Stripe webhook issue |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Lead | | | |
| Product Owner | | | |

---

## Notes

- Test on Chrome, Safari, Firefox, and Edge
- Test on iOS Safari and Android Chrome
- Test with slow network (3G simulation)
- Test with VPN (different regions)
- Test accessibility with screen reader

---

*Generated by Claude Code for Talbiyah.ai MVP Release*
