# 📧 Talbiyah.ai Email Configuration Guide

**Objective:** Configure professional, branded emails for user verification and notifications

---

## 🎯 WHAT WE'RE CONFIGURING

1. **Custom Email Templates** - Branded as Talbiyah.ai
2. **Email Verification** - Enforce real email confirmation
3. **Custom SMTP** (Optional) - Use your own email service
4. **Email Settings** - Rate limits, redirects, etc.

---

## STEP 1: ACCESS SUPABASE EMAIL SETTINGS

### Via Supabase Dashboard

1. Go to: **https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu**
2. Click **"Authentication"** in left sidebar
3. Click **"Email Templates"** tab
4. You'll see templates for:
   - Confirm signup
   - Invite user
   - Magic link
   - Change email address
   - Reset password

---

## STEP 2: CUSTOMIZE EMAIL TEMPLATES

### Template: Confirm Signup (Most Important)

**Current Default:**
```
Subject: Confirm Your Signup
From: noreply@mail.app.supabase.io

Click here to confirm: {{ .ConfirmationURL }}
```

**Replace With Branded Template:**

**Subject Line:**
```
Welcome to Talbiyah.ai - Confirm Your Email ☪️
```

**Email Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            background: #ffffff;
            padding: 30px 20px;
            border: 1px solid #e5e7eb;
            border-top: none;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
            color: white;
            padding: 14px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-radius: 0 0 10px 10px;
        }
        .divider {
            border-top: 2px solid #e5e7eb;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>☪️ Talbiyah.ai</h1>
        <p style="margin: 5px 0 0 0; font-size: 16px;">Islamic Learning Platform</p>
    </div>

    <div class="content">
        <h2 style="color: #1f2937; margin-top: 0;">As-salamu alaykum! 🌙</h2>

        <p>Thank you for joining <strong>Talbiyah.ai</strong> - your platform for authentic Islamic learning with qualified teachers.</p>

        <p>To complete your registration and start your learning journey, please confirm your email address:</p>

        <div style="text-align: center;">
            <a href="{{ .ConfirmationURL }}" class="button">
                ✅ Confirm My Email
            </a>
        </div>

        <div class="divider"></div>

        <p style="font-size: 14px; color: #6b7280;">
            If you didn't create an account with Talbiyah.ai, you can safely ignore this email.
        </p>

        <p style="font-size: 14px; color: #6b7280;">
            <strong>Link expires in 24 hours.</strong>
        </p>
    </div>

    <div class="footer">
        <p>© 2025 Talbiyah.ai - Islamic Learning Platform</p>
        <p>This email was sent to {{ .Email }}</p>
        <p style="margin-top: 10px;">
            <a href="https://talbiyah.ai" style="color: #06b6d4; text-decoration: none;">Visit Website</a> •
            <a href="https://talbiyah.ai/support" style="color: #06b6d4; text-decoration: none;">Support</a>
        </p>
    </div>
</body>
</html>
```

**Plain Text Version:**
```
As-salamu alaykum!

Welcome to Talbiyah.ai - Islamic Learning Platform

Thank you for joining Talbiyah.ai. To complete your registration, please confirm your email address by clicking the link below:

{{ .ConfirmationURL }}

If you didn't create an account, you can safely ignore this email.

This link expires in 24 hours.

---
Talbiyah.ai
Islamic Learning Platform
© 2025 Talbiyah.ai
```

### Other Important Templates

#### Reset Password Email

**Subject:**
```
Reset Your Talbiyah.ai Password 🔐
```

**Body:**
```html
<h2>Password Reset Request</h2>
<p>As-salamu alaykum,</p>
<p>We received a request to reset your Talbiyah.ai password.</p>
<a href="{{ .ConfirmationURL }}" class="button">Reset My Password</a>
<p>If you didn't request this, please ignore this email.</p>
<p><strong>This link expires in 1 hour.</strong></p>
```

#### Magic Link Email

**Subject:**
```
Your Talbiyah.ai Sign-In Link 🔗
```

**Body:**
```html
<h2>Sign In to Talbiyah.ai</h2>
<p>As-salamu alaykum,</p>
<p>Click the button below to sign in to your account:</p>
<a href="{{ .ConfirmationURL }}" class="button">Sign In</a>
<p><strong>This link expires in 1 hour.</strong></p>
```

---

## STEP 3: CONFIGURE EMAIL SETTINGS

### In Supabase Dashboard

1. **Authentication** → **Settings** → **Email Auth**

2. **Enable Email Confirmations:**
   - ✅ **"Enable email confirmations"** - MUST be checked
   - This forces users to verify email before accessing the app

3. **Confirmation URL:**
   - Set to: `https://yourdomain.com/auth/confirm` (or your actual domain)
   - For local testing: `http://localhost:5173/auth/confirm`

4. **Email Rate Limits:**
   - Default: 4 emails per hour (with Supabase SMTP)
   - With custom SMTP: Unlimited (depends on provider)

5. **Double Confirm Email Changes:**
   - ✅ Enable to require confirmation for email changes

6. **Secure Email Change:**
   - ✅ Enable for additional security

---

## STEP 4: CUSTOM SMTP CONFIGURATION (RECOMMENDED)

### Why Custom SMTP?

- ✅ Branded sender email (noreply@talbiyah.ai)
- ✅ No rate limits (send unlimited emails)
- ✅ Better deliverability (won't go to spam)
- ✅ Professional appearance

### Option A: Gmail SMTP (Easiest)

**Requirements:**
- Gmail account
- App Password (not your regular password)

**Setup:**
1. Go to **Google Account** → **Security**
2. Enable **2-Step Verification**
3. Generate **App Password** for "Mail"
4. Copy the 16-character password

**Supabase Configuration:**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Password: [Your App Password]
Sender Email: your-email@gmail.com
Sender Name: Talbiyah.ai
```

### Option B: SendGrid (Recommended for Production)

**Why SendGrid:**
- Free tier: 100 emails/day
- Excellent deliverability
- Email analytics
- Professional service

**Setup:**
1. Sign up at: https://signup.sendgrid.com
2. Verify your domain (optional but recommended)
3. Create API Key
4. Configure in Supabase:

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [Your SendGrid API Key]
Sender Email: noreply@talbiyah.ai (if domain verified)
Sender Name: Talbiyah.ai
```

### Option C: AWS SES (Best for Scale)

**Why AWS SES:**
- Very cheap ($0.10 per 1000 emails)
- Highly scalable
- AWS infrastructure

**Setup:**
1. Sign up for AWS
2. Go to SES Console
3. Verify email/domain
4. Get SMTP credentials
5. Configure in Supabase

### How to Configure in Supabase

1. Go to: **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Toggle **"Enable Custom SMTP"**
4. Enter your SMTP details
5. Click **"Save"**
6. Send a test email to verify

---

## STEP 5: ENFORCE EMAIL VERIFICATION

### Database Configuration

Run this to ensure email verification is required:

```sql
-- Disable users who haven't confirmed email
UPDATE auth.users
SET email_confirmed_at = NULL
WHERE email_confirmed_at IS NULL;

-- Prevent unverified users from logging in
-- This is handled by Supabase Auth settings
```

### Application-Level Enforcement

Add to your protected routes (already in ProtectedRoute.tsx):

```typescript
// Check if email is verified
const { data: { user } } = await supabase.auth.getUser();

if (!user?.email_confirmed_at) {
  // Redirect to email verification page
  navigate('/verify-email');
  return;
}
```

---

## STEP 6: CREATE EMAIL VERIFICATION PAGE

Create: `src/pages/VerifyEmail.tsx`

```typescript
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail, CheckCircle } from 'lucide-react';

export default function VerifyEmail() {
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);

  async function resendEmail() {
    setResending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: user.email,
        });

        if (error) throw error;
        setSent(true);
      }
    } catch (error) {
      console.error('Error resending email:', error);
      alert('Failed to resend email. Please try again.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-10 h-10 text-blue-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Verify Your Email
        </h1>

        <p className="text-gray-600 mb-6">
          We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
        </p>

        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Email sent! Check your inbox.</span>
            </div>
          </div>
        ) : (
          <button
            onClick={resendEmail}
            disabled={resending}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition"
          >
            {resending ? 'Sending...' : 'Resend Verification Email'}
          </button>
        )}

        <p className="text-sm text-gray-500 mt-6">
          Didn't receive the email? Check your spam folder or click the button above to resend.
        </p>
      </div>
    </div>
  );
}
```

Add route to App.tsx:
```typescript
import VerifyEmail from './pages/VerifyEmail';

// In your routes:
<Route path="/verify-email" element={<VerifyEmail />} />
```

---

## STEP 7: TEST EMAIL DELIVERY

### Testing Checklist

1. **Sign up with a real email**
   - [ ] Use your actual email address
   - [ ] Complete signup form
   - [ ] Check inbox for verification email

2. **Check Email Appearance**
   - [ ] Subject line is branded
   - [ ] Email is visually appealing
   - [ ] Links work correctly
   - [ ] No typos or errors

3. **Test Email Delivery**
   - [ ] Email arrives within 1 minute
   - [ ] Not in spam folder
   - [ ] Links redirect correctly

4. **Test Verification Flow**
   - [ ] Click verification link
   - [ ] Redirects to correct page
   - [ ] User can now log in
   - [ ] Dashboard loads correctly

### Test with Different Providers

- [ ] Gmail
- [ ] Outlook/Hotmail
- [ ] Yahoo Mail
- [ ] Custom domain email

---

## STEP 8: MONITORING & TROUBLESHOOTING

### Check Email Logs in Supabase

1. Go to **Logs** → **Auth Logs**
2. Filter by: `event = 'user_confirmation_requested'`
3. Verify emails are being sent

### Common Issues

**Problem:** Emails not arriving
- **Fix:** Check spam folder, verify SMTP settings, check rate limits

**Problem:** Links not working
- **Fix:** Verify confirmation URL is correct in settings

**Problem:** Emails going to spam
- **Fix:** Use custom SMTP, verify domain, add SPF/DKIM records

**Problem:** Rate limit exceeded
- **Fix:** Upgrade to custom SMTP (unlimited emails)

---

## QUICK SETUP CHECKLIST

### Essential (Do This Now):

- [ ] 1. Go to Supabase Dashboard → Authentication → Email Templates
- [ ] 2. Update "Confirm Signup" template with branded HTML
- [ ] 3. Enable "Email Confirmations" in Auth Settings
- [ ] 4. Set confirmation URL to your domain
- [ ] 5. Test with a real email address

### Recommended (Before Production):

- [ ] 6. Set up custom SMTP (Gmail, SendGrid, or AWS SES)
- [ ] 7. Verify domain for better deliverability
- [ ] 8. Create VerifyEmail.tsx page
- [ ] 9. Add email verification check to ProtectedRoute
- [ ] 10. Test with multiple email providers

### Advanced (For Scale):

- [ ] 11. Set up SPF and DKIM records for domain
- [ ] 12. Configure DMARC policy
- [ ] 13. Set up email analytics/tracking
- [ ] 14. Create email preference center
- [ ] 15. Add unsubscribe functionality

---

## IMMEDIATE ACTION ITEMS

**RIGHT NOW - Update These Templates:**

1. Open: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/auth/templates
2. Copy the branded HTML template above
3. Paste into "Confirm Signup" template
4. Save changes
5. Test by signing up with your email

**That's it!** Your emails will now be branded as Talbiyah.ai.

---

## 📞 NEED HELP?

**Supabase Email Docs:** https://supabase.com/docs/guides/auth/auth-smtp
**SendGrid Setup:** https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api
**Gmail App Passwords:** https://support.google.com/accounts/answer/185833

