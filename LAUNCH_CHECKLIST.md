# 🚀 PRE-LAUNCH CHECKLIST
**Goal: Get to B- grade and launch safely**

## ✅ WHAT I'LL DO (Automated)
- [x] Kill that failing migration script
- [x] Install error tracking (Sentry) - **NEEDS YOUR SENTRY DSN**
- [x] Generate TypeScript types from database
- [ ] Clean up git (commit/delete files)
- [ ] Set up basic monitoring

## 🔴 WHAT YOU MUST DO (Manual - Critical)

### Priority 1: Test Real Payment (DO THIS TODAY)
- [ ] Book a lesson as a student using test card:
  - Card: `4242 4242 4242 4242`
  - Expiry: Any future date
  - CVC: Any 3 digits
- [ ] Complete full booking flow
- [ ] Check if lesson appears in dashboard
- [ ] Check if 100ms room code was created
- [ ] Join the lesson (test video)
- [ ] Check Stripe dashboard - did webhook arrive?

### Priority 2: Test Failed Payment
- [ ] Try booking with declined card: `4000000000000002`
- [ ] Verify app handles it gracefully (doesn't crash)
- [ ] Check if error message shows to user

### Priority 3: Test with Real Card
- [ ] Book £1 lesson with YOUR OWN CARD
- [ ] Complete full flow
- [ ] Verify money appears in Stripe dashboard
- [ ] Can you refund it from Stripe dashboard?

### Priority 4: Mobile Test
- [ ] Open app on your phone
- [ ] Try booking a lesson
- [ ] Does video work on mobile?

### Priority 5: Get Test User
- [ ] Ask friend/family to be test student
- [ ] Have them book lesson with you
- [ ] Complete full lesson
- [ ] Get their feedback

## 📊 MONITORING (After tests pass)
- [ ] Check Sentry daily for errors
- [ ] Monitor Stripe webhook logs
- [ ] Check 100ms dashboard for session quality

## 🎯 SUCCESS CRITERIA
**You can launch when:**
1. Real payment tested ✓
2. Failed payment handled ✓
3. Mobile works ✓
4. 1 test user completed full flow ✓
5. Error tracking installed ✓

## 🚫 IGNORE FOR NOW
- Migration cleanup (app works, don't break it)
- Writing tests (do after first 10 users)
- Documentation (do after validation)
- New features (NO NEW FEATURES until stable)
