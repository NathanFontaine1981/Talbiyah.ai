#!/bin/bash

# Test Stripe Webhook Script
# This verifies the webhook is working correctly

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║          🧪 TESTING STRIPE WEBHOOK 🧪                        ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"

echo "Testing webhook endpoint..."
echo ""
echo "Webhook URL: https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhook"
echo ""

# Try to ping the webhook
echo "Sending test request..."
response=$(curl -s -o /dev/null -w "%{http_code}" https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhook)

if [ "$response" -eq 400 ]; then
    echo "✅ Webhook endpoint is responding (400 = needs valid Stripe signature)"
    echo "   This is expected! Webhook is working."
elif [ "$response" -eq 200 ]; then
    echo "⚠️  Webhook returned 200 (might not be validating signatures)"
else
    echo "❌ Webhook returned: $response"
    echo "   Expected 400. Something might be wrong."
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "CHECKING SUPABASE CONFIGURATION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "Listing Supabase secrets..."
if ./node_modules/supabase/bin/supabase secrets list 2>&1 | grep -q "STRIPE"; then
    echo "✅ Stripe secrets are set in Supabase"
else
    echo "⚠️  Could not verify Stripe secrets"
fi

echo ""
echo "Checking deployed functions..."
if ./node_modules/supabase/bin/supabase functions list 2>&1 | grep -q "stripe-webhook"; then
    echo "✅ stripe-webhook function is deployed"
else
    echo "❌ stripe-webhook function not found"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "NEXT STEPS"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "To fully test the webhook:"
echo ""
echo "1. Go to Stripe Dashboard → Webhooks:"
echo "   https://dashboard.stripe.com/test/webhooks"
echo ""
echo "2. Click on your webhook endpoint"
echo ""
echo "3. Click 'Send test webhook'"
echo ""
echo "4. Select event: payment_intent.succeeded"
echo ""
echo "5. Click 'Send test webhook'"
echo ""
echo "6. Check response - should be 200 OK"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
