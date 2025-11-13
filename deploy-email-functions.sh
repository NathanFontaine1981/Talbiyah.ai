#!/bin/bash

# Deploy Email Functions Script
# This script deploys the Resend email integration

echo "🚀 Deploying Email Functions"
echo ""

PROJECT_REF="boyrjgivpepjiboekwuu"

# Check if RESEND_API_KEY is provided as an argument
if [ -z "$1" ]; then
  echo "❌ Error: RESEND_API_KEY required"
  echo ""
  echo "Usage: ./deploy-email-functions.sh <your-resend-api-key>"
  echo ""
  echo "Example: ./deploy-email-functions.sh re_abc123xyz..."
  echo ""
  exit 1
fi

RESEND_API_KEY="$1"

echo "Step 1: Setting Resend API Key in Supabase..."
export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"
npx supabase secrets set RESEND_API_KEY="$RESEND_API_KEY" --project-ref "$PROJECT_REF"

if [ $? -eq 0 ]; then
  echo "✅ Resend API Key set successfully"
else
  echo "❌ Failed to set Resend API Key"
  exit 1
fi

echo ""
echo "Step 2: Deploying send-booking-notification function..."
npx supabase functions deploy send-booking-notification --project-ref "$PROJECT_REF"

if [ $? -eq 0 ]; then
  echo "✅ send-booking-notification deployed successfully"
else
  echo "❌ Failed to deploy send-booking-notification"
  exit 1
fi

echo ""
echo "Step 3: Deploying updated create-single-booking-internal function..."
npx supabase functions deploy create-single-booking-internal --project-ref "$PROJECT_REF"

if [ $? -eq 0 ]; then
  echo "✅ create-single-booking-internal deployed successfully"
else
  echo "❌ Failed to deploy create-single-booking-internal"
  exit 1
fi

echo ""
echo "🎉 All email functions deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Verify your sender email/domain in Resend: https://resend.com/domains"
echo "2. Test the email by creating a booking"
echo "3. Check email delivery in Resend dashboard: https://resend.com/emails"
echo ""
