# TALBIYAH.AI - FIX PLAN

**Last Updated:** November 9, 2025

This document outlines fixes needed before production deployment and recommended improvements.

---

## CURRENT STATUS

**Overall:** ✅ PRODUCTION READY with minor cleanup needed

**Critical Issues:** 0
**High Priority Issues:** 3
**Medium Priority Issues:** 4
**Low Priority Issues:** 2

---

## CRITICAL ISSUES (MUST FIX BEFORE LAUNCH)

### None Identified

All critical functionality is working. The platform is production-ready.

---

## HIGH PRIORITY (Fix Before Production)

### ISSUE #1: Debug Statements in Production Code
**Priority:** HIGH
**Impact:** Performance, Security, Console noise
**Estimated Time:** 30 minutes

**What's Broken:**
Multiple `console.log()` and `console.error()` statements throughout the codebase that should be removed or conditional for production.

**Why It's Broken:**
- Debug statements left in during development
- Not removed before deployment preparation

**Files Affected:**
1. `/src/pages/Teachers.tsx:136`
2. `/src/pages/QuranProgress.tsx:46`
3. `/src/pages/TeacherProfile.tsx:131`
4. `/src/components/UpcomingSessionsCard.tsx` (multiple)
5. Various other components

**Root Cause:**
Development logging not wrapped in environment checks.

**Fix Steps:**

#### Option A: Remove Debug Logs
```bash
# Search for all console.log statements
grep -r "console.log" src/

# Remove manually or use sed (careful!)
# Review each one to determine if needed
```

#### Option B: Add Environment Check
```typescript
// Create utility function in src/lib/logger.ts
export const logger = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args); // Always log errors
  },
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  }
};

// Replace console.log with logger.log
import { logger } from '../lib/logger';
logger.log('Debug info');
```

**How to Test:**
1. Build production version: `npm run build`
2. Check console - should have no debug logs
3. Test error scenarios - should still log errors

**Acceptance Criteria:**
- [ ] No console.log in production build
- [ ] Error logging still works
- [ ] Development logging still available in dev mode

---

### ISSUE #2: Live Stripe Keys Active
**Priority:** HIGH (If not ready for real payments)
**Impact:** Real charges will occur
**Estimated Time:** 5 minutes

**What's the Issue:**
Stripe is configured with LIVE mode keys. Any payment will result in real charges.

**Files Affected:**
- `.env` (VITE_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY)
- Supabase secrets (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)

**Current Configuration:**
- Publishable Key: `pk_live_...`
- Secret Key: `sk_live_...`
- Webhook: Configured for live mode

**Fix Steps (If Not Ready for Live):**

1. **Switch to Test Mode:**
```bash
# Update .env file
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY
```

2. **Update Supabase Secrets:**
```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY --linked
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_TEST_WEBHOOK_SECRET --linked
```

3. **Update Stripe Webhook:**
- Go to Stripe Dashboard → Developers → Webhooks
- Update webhook URL or create test webhook
- Copy new webhook secret
- Update in Supabase

**How to Test:**
1. Create test booking
2. Use test card: 4242 4242 4242 4242
3. Verify payment in Stripe test dashboard
4. Verify booking created in database

**Acceptance Criteria:**
- [ ] Test mode keys active (if not ready for live)
- [ ] OR Live mode confirmed and documented
- [ ] Team aware of current mode
- [ ] Webhook configured correctly for current mode

---

### ISSUE #3: Frontend Not Deployed
**Priority:** HIGH (For Public Access)
**Impact:** Platform not accessible to public
**Estimated Time:** 1-2 hours

**What's Missing:**
Frontend is running locally on `localhost:5173` but not deployed to production hosting.

**Why It's Not Done:**
Still in development/testing phase.

**Recommended Hosting:**
- **Vercel** (Recommended - Easy React deployment)
- **Netlify** (Alternative)
- **AWS Amplify** (If using AWS)

**Fix Steps:**

#### Option A: Deploy to Vercel

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Initialize Vercel Project:**
```bash
cd /Users/nathanfontaine/Documents/Talbiyah.ai/Talbiyah.ai
vercel
```

3. **Follow Prompts:**
- Link to existing project or create new
- Set build command: `npm run build`
- Set output directory: `dist`
- Set install command: `npm install`

4. **Configure Environment Variables:**
```bash
# Add environment variables in Vercel dashboard
VITE_SUPABASE_URL=https://boyrjgivpepjiboekwuu.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)
VITE_CLAUDE_API_KEY=your_claude_key (if used client-side)
```

5. **Deploy:**
```bash
vercel --prod
```

6. **Configure Domain:**
- Go to Vercel dashboard
- Add custom domain (talbiyah.ai)
- Update DNS records as instructed
- SSL automatically configured

#### Option B: Deploy to Netlify

1. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Initialize:**
```bash
netlify init
```

3. **Configure:**
- Build command: `npm run build`
- Publish directory: `dist`

4. **Set Environment Variables:**
```bash
netlify env:set VITE_SUPABASE_URL https://boyrjgivpepjiboekwuu.supabase.co
netlify env:set VITE_SUPABASE_ANON_KEY your_anon_key
netlify env:set VITE_STRIPE_PUBLISHABLE_KEY pk_live_...
```

5. **Deploy:**
```bash
netlify deploy --prod
```

**How to Test:**
1. Visit deployed URL
2. Test signup flow
3. Test booking flow
4. Test payment flow
5. Verify all integrations work

**Acceptance Criteria:**
- [ ] Frontend accessible via public URL
- [ ] All environment variables configured
- [ ] SSL certificate active
- [ ] Custom domain connected (if applicable)
- [ ] All features working on production URL

---

## MEDIUM PRIORITY (Post-Launch Improvements)

### ISSUE #4: Duplicate Admin Pages
**Priority:** MEDIUM
**Impact:** Code maintenance, potential confusion
**Estimated Time:** 30 minutes

**What's the Issue:**
Multiple duplicate admin page files exist:
- `UserManagement.tsx` AND `UsersManagement.tsx`
- `Sessions.tsx` AND `SessionsManagement.tsx`
- `Analytics.tsx` AND `AnalyticsPage.tsx`

**Files Affected:**
- `/src/pages/admin/UserManagement.tsx`
- `/src/pages/admin/UsersManagement.tsx`
- `/src/pages/admin/Sessions.tsx`
- `/src/pages/admin/SessionsManagement.tsx`
- `/src/pages/admin/Analytics.tsx`
- `/src/pages/admin/AnalyticsPage.tsx`

**Root Cause:**
Files renamed during development but old versions not deleted.

**Fix Steps:**

1. **Identify Active Files:**
```bash
# Check App.tsx for which files are imported
grep -n "admin" src/App.tsx
```

2. **Compare Files:**
```bash
# Compare duplicate files to see if they're identical
diff src/pages/admin/UserManagement.tsx src/pages/admin/UsersManagement.tsx
```

3. **Remove Unused Files:**
```bash
# Remove the unused versions (after verifying)
rm src/pages/admin/UsersManagement.tsx
rm src/pages/admin/SessionsManagement.tsx
rm src/pages/admin/AnalyticsPage.tsx
```

4. **Verify Imports:**
```bash
# Make sure no imports reference deleted files
grep -r "UsersManagement" src/
grep -r "SessionsManagement" src/
grep -r "AnalyticsPage" src/
```

**How to Test:**
1. Navigate to all admin pages
2. Verify all pages load correctly
3. Test all admin functions

**Acceptance Criteria:**
- [ ] Only one version of each page exists
- [ ] All admin routes work
- [ ] No broken imports

---

### ISSUE #5: Email Notifications Not Configured
**Priority:** MEDIUM
**Impact:** No booking confirmations or reminders
**Estimated Time:** 2-3 hours

**What's Missing:**
No email service configured for sending transactional emails.

**Why It's Not Done:**
Email service integration not yet implemented.

**Recommended Services:**
- **Resend** (Recommended - Modern, developer-friendly)
- **SendGrid** (Robust, widely used)
- **AWS SES** (Cost-effective at scale)

**Fix Steps:**

#### Using Resend (Recommended)

1. **Sign Up:**
- Go to https://resend.com
- Create account
- Verify domain
- Get API key

2. **Create Edge Function:**
```bash
# Create new edge function
npx supabase functions new send-email
```

3. **Implement Email Function:**
```typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { to, subject, html, type } = await req.json()

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'noreply@talbiyah.ai',
      to,
      subject,
      html
    })
  })

  const data = await response.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

4. **Set Resend API Key:**
```bash
npx supabase secrets set RESEND_API_KEY=re_YOUR_API_KEY --linked
```

5. **Deploy Function:**
```bash
npx supabase functions deploy send-email --linked
```

6. **Update Booking Flow:**
Modify `stripe-webhooks` and `create-booking-with-room` to call email function:

```typescript
// After booking created
await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
  },
  body: JSON.stringify({
    to: studentEmail,
    subject: 'Booking Confirmation - Talbiyah.ai',
    html: `<h1>Your session is confirmed!</h1>...`,
    type: 'booking_confirmation'
  })
})
```

**Email Types to Implement:**
1. Booking confirmation (student + teacher)
2. Session reminder (24h before, 1h before)
3. Teacher approval notification
4. Payment receipt
5. Referral reward notification

**How to Test:**
1. Create test booking
2. Check email inbox
3. Verify email content
4. Test all email types

**Acceptance Criteria:**
- [ ] Email service configured
- [ ] Booking confirmations sent
- [ ] Teacher notifications sent
- [ ] Domain verified
- [ ] Email templates created
- [ ] All email types tested

---

### ISSUE #6: No Error Tracking Service
**Priority:** MEDIUM
**Impact:** Unable to monitor production errors
**Estimated Time:** 1 hour

**What's Missing:**
No error tracking/monitoring service integrated (Sentry, Rollbar, etc.)

**Why It's Needed:**
- Catch production errors
- Monitor performance
- Track user issues
- Get notified of critical errors

**Recommended Service:**
**Sentry** (Industry standard, free tier available)

**Fix Steps:**

1. **Sign Up for Sentry:**
- Go to https://sentry.io
- Create account
- Create new project (React)
- Get DSN

2. **Install Sentry SDK:**
```bash
npm install @sentry/react
```

3. **Configure Sentry:**
```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enabled: import.meta.env.PROD // Only in production
});
```

4. **Wrap App:**
```typescript
// src/main.tsx
import { ErrorBoundary } from '@sentry/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<ErrorFallbackUI />}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
```

5. **Set Environment Variable:**
```bash
# In .env
VITE_SENTRY_DSN=your_sentry_dsn

# In Vercel/Netlify dashboard
VITE_SENTRY_DSN=your_sentry_dsn
```

**How to Test:**
1. Trigger test error
2. Check Sentry dashboard
3. Verify error captured
4. Test alerts

**Acceptance Criteria:**
- [ ] Sentry configured
- [ ] Errors captured in production
- [ ] Source maps uploaded
- [ ] Alerts configured
- [ ] Team notifications set up

---

### ISSUE #7: Missing Session Reminders
**Priority:** MEDIUM
**Impact:** Students/teachers may miss sessions
**Estimated Time:** 2 hours

**What's Missing:**
No automated reminder system for upcoming sessions.

**Why It's Needed:**
- Reduce no-shows
- Better user experience
- Increase session completion rate

**Fix Steps:**

1. **Create Scheduled Function:**
```typescript
// supabase/functions/send-session-reminders/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )

  // Get sessions in next 24 hours
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const now = new Date()

  const { data: sessions } = await supabase
    .from('bookings')
    .select(`
      *,
      student:profiles!student_id(email, full_name),
      teacher:profiles!teacher_id(email, full_name)
    `)
    .eq('status', 'booked')
    .gte('start_time', now.toISOString())
    .lte('start_time', tomorrow.toISOString())

  // Send reminders
  for (const session of sessions) {
    // Send to student
    await sendEmail({
      to: session.student.email,
      subject: 'Session Reminder - Tomorrow',
      template: 'session_reminder_24h',
      data: session
    })

    // Send to teacher
    await sendEmail({
      to: session.teacher.email,
      subject: 'Session Reminder - Tomorrow',
      template: 'session_reminder_24h',
      data: session
    })
  }

  return new Response(JSON.stringify({ sent: sessions.length * 2 }))
})
```

2. **Set Up Cron Job:**
```bash
# Use Supabase pg_cron extension
# Or use external service like Vercel Cron, Render Cron

# Add to Supabase SQL editor:
SELECT cron.schedule(
  'session-reminders-24h',
  '0 9 * * *', -- Every day at 9am
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/send-session-reminders',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

3. **Deploy Function:**
```bash
npx supabase functions deploy send-session-reminders --linked
```

**Reminders to Send:**
- 24 hours before session
- 1 hour before session
- Session starting now (if not joined)

**How to Test:**
1. Create session for tomorrow
2. Wait for cron job or trigger manually
3. Check email received
4. Verify content

**Acceptance Criteria:**
- [ ] Cron job configured
- [ ] 24h reminders sent
- [ ] 1h reminders sent
- [ ] Both student and teacher notified
- [ ] Email templates created

---

## LOW PRIORITY (Nice to Have)

### ISSUE #8: TODO Comment in Code
**Priority:** LOW
**Impact:** Feature placeholder
**Estimated Time:** 5 minutes or N/A

**What's the Issue:**
TODO comment at `src/pages/Dashboard.tsx:465`:
```typescript
// TODO: Open upgrade modal
```

**Context:**
Placeholder for future upgrade/premium feature modal.

**Fix Steps:**
1. **Option A:** Implement upgrade modal (if needed)
2. **Option B:** Remove TODO if not needed yet
3. **Option C:** Create issue in project tracker for future work

**No Immediate Action Required** unless upgrade feature is being implemented.

---

### ISSUE #9: Missing Unit Tests
**Priority:** LOW (but recommended)
**Impact:** Harder to catch regressions
**Estimated Time:** Ongoing

**What's Missing:**
No automated unit or integration tests.

**Why It's Recommended:**
- Catch bugs early
- Prevent regressions
- Document expected behavior
- Speed up development

**Fix Steps:**

1. **Install Testing Libraries:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

2. **Configure Vitest:**
```typescript
// vite.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts'
  }
})
```

3. **Create Test Setup:**
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
```

4. **Write Tests:**
```typescript
// src/components/__tests__/BookingModal.test.tsx
import { render, screen } from '@testing-library/react'
import BookingModal from '../BookingModal'

describe('BookingModal', () => {
  it('renders booking modal', () => {
    render(<BookingModal isOpen={true} onClose={() => {}} />)
    expect(screen.getByText(/select student/i)).toBeInTheDocument()
  })
})
```

**Priority Areas to Test:**
1. Booking flow
2. Payment processing
3. Cart management
4. Availability checking
5. User authentication

**Acceptance Criteria:**
- [ ] Testing framework installed
- [ ] Critical flows tested
- [ ] CI runs tests
- [ ] Coverage > 70%

---

## DEPLOYMENT CHECKLIST

Before deploying to production, ensure:

### Pre-Deployment
- [ ] Remove/conditional console.log statements
- [ ] Verify Stripe mode (test vs live)
- [ ] Remove duplicate files
- [ ] Update environment variables
- [ ] Test all critical flows
- [ ] Database backup created

### Deployment
- [ ] Frontend deployed to Vercel/Netlify
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Environment variables set
- [ ] Edge functions deployed

### Post-Deployment
- [ ] Verify all pages load
- [ ] Test signup flow
- [ ] Test booking flow
- [ ] Test payment flow
- [ ] Test admin functions
- [ ] Monitor error logs
- [ ] Set up alerts

### Documentation
- [ ] Update README
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Update API documentation

---

## PRIORITY SUMMARY

### Must Fix Before Launch (1-2 days)
1. ✅ Remove debug statements
2. ✅ Verify Stripe mode
3. ✅ Deploy frontend

### Should Fix Within 1 Week
4. Remove duplicate admin pages
5. Configure email notifications
6. Set up error tracking

### Nice to Have (1-4 weeks)
7. Implement session reminders
8. Add unit tests
9. Resolve TODO comments

---

## ESTIMATED TIMELINE

**Phase 1: Production Ready (1-2 days)**
- Day 1: Clean code, verify Stripe, deploy frontend
- Day 2: Test production deployment, monitor errors

**Phase 2: Essential Features (1 week)**
- Email notifications
- Error tracking
- Clean up duplicates

**Phase 3: Enhancements (2-4 weeks)**
- Session reminders
- Testing infrastructure
- Additional features

---

**Last Updated:** November 9, 2025
**Status:** Platform is production-ready with minor cleanup needed
**Recommendation:** Deploy with current state, implement improvements post-launch
