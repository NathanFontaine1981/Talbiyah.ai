#!/bin/bash
# Quick Environment Variables Configuration Script
# Usage: ./configure-secrets.sh

set -e

echo "🔐 Talbiyah.ai Environment Configuration"
echo "========================================"
echo ""

# Supabase configuration
export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"
PROJECT_REF="boyrjgivpepjiboekwuu"

# Function to prompt for secret
prompt_secret() {
    local name=$1
    local description=$2
    echo ""
    echo "📝 $description"
    read -sp "Enter $name: " secret_value
    echo ""

    if [ -z "$secret_value" ]; then
        echo "❌ No value provided for $name. Skipping..."
        return 1
    fi

    echo "Setting $name..."
    npx supabase secrets set "$name=$secret_value" --project-ref $PROJECT_REF
    echo "✅ $name configured"
    return 0
}

echo "This script will help you configure the required environment variables."
echo "Press Enter to skip any value you don't have yet."
echo ""

# Configure Stripe
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔵 Stripe Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
prompt_secret "STRIPE_SECRET_KEY" "Get this from: Stripe Dashboard > Developers > API keys"
prompt_secret "STRIPE_WEBHOOK_SECRET" "Get this from: Stripe Dashboard > Developers > Webhooks"

# Configure 100ms
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📹 100ms (HMS) Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
prompt_secret "HMS_APP_ACCESS_KEY" "Get this from: 100ms Dashboard > Your App > Developer"
prompt_secret "HMS_APP_SECRET" "Get this from: 100ms Dashboard > Your App > Developer"

# Verify configuration
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Verifying Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
npx supabase secrets list --project-ref $PROJECT_REF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Configuration Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Set up Stripe webhook endpoint:"
echo "   URL: https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhooks"
echo "   Events: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed"
echo ""
echo "2. Test the payment flow in your application"
echo ""
echo "3. View function logs if you encounter issues:"
echo "   npx supabase functions logs --project-ref $PROJECT_REF"
echo ""
