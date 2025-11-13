# Resend Email Setup Guide

## Quick Setup (5 minutes)

### 1. Get Your Resend API Key

1. Go to https://resend.com/api-keys
2. Click **"Create API Key"**
3. Name: `Talbiyah.ai Production`
4. Permission: **Sending access**
5. Click **Create**
6. **Copy the API key** (starts with `re_...`)

### 2. Verify Your Sender Email/Domain

**Option A - Quick (Single Email):**
1. Go to https://resend.com/domains
2. Click **"Verify Single Email"**
3. Enter: `noreply@gmail.com` (or your email)
4. Check email and verify

**Option B - Professional (Custom Domain):**
1. Go to https://resend.com/domains
2. Click **"Add Domain"**
3. Enter: `talbiyah.ai`
4. Add the DNS records to your domain registrar
5. Wait 5-10 minutes for verification

### 3. Deploy the Email Functions

Run this command with your API key:

```bash
./deploy-email-functions.sh re_your_api_key_here
```

**Example:**
```bash
./deploy-email-functions.sh re_abc123xyz456def789
```

This will:
- ✅ Set your Resend API key in Supabase
- ✅ Deploy the email notification function
- ✅ Update the booking function to use Resend

### 4. Test It!

1. Make a test booking on the platform
2. Check if the teacher receives an email
3. View email logs: https://resend.com/emails

## Email Template Features

The booking notification email includes:
- 📚 Beautiful, branded design
- 📧 Mobile-responsive layout
- ✅ All booking details (student, subject, date, time)
- 🔗 Direct link to dashboard
- 📊 Email tracking and analytics

## Troubleshooting

**"Email not received"**
1. Check spam/junk folder
2. Verify sender email in Resend dashboard
3. Check Resend logs: https://resend.com/emails
4. Ensure API key is set correctly

**"API key error"**
```bash
# Re-set the API key
npx supabase secrets set RESEND_API_KEY=re_your_key_here --project-ref boyrjgivpepjiboekwuu
```

**"Sender not verified"**
- Go to https://resend.com/domains
- Verify your email or add your domain
- Wait for verification before sending

## Resend Dashboard Links

- **API Keys:** https://resend.com/api-keys
- **Domains:** https://resend.com/domains
- **Email Logs:** https://resend.com/emails
- **Settings:** https://resend.com/settings

## Next Steps

After setup:
1. ✅ Create a booking to test
2. ✅ Check teacher dashboard for confirmation button
3. ✅ Monitor email deliverability
4. ✅ Customize email template if needed (edit: `supabase/functions/send-booking-notification/index.ts`)

## Support

- **Resend Docs:** https://resend.com/docs
- **Free Tier:** 100 emails/day, 3,000/month
- **Email:** support@resend.com
