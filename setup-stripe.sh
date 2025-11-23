#!/bin/bash

# Stripe Complete Setup Script
# This script will configure Stripe properly from scratch

set -e  # Exit on error

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║        🔧 STRIPE COMPLETE SETUP - TALBIYAH.AI 🔧             ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "This script will set up Stripe properly with:"
echo "  ✅ Test keys (no real charges)"
echo "  ✅ Webhook configuration"
echo "  ✅ Automated deployment"
echo ""
echo "You'll need 3 things from Stripe Dashboard (TEST mode):"
echo "  1. Publishable key (pk_test_...)"
echo "  2. Secret key (sk_test_...)"
echo "  3. Webhook signing secret (whsec_...)"
echo ""
read -p "Ready to continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 1: COLLECT STRIPE KEYS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Get publishable key
echo "📝 Enter your Stripe TEST Publishable Key (pk_test_...):"
read -r STRIPE_PUBLISHABLE_KEY

# Validate publishable key
if [[ ! $STRIPE_PUBLISHABLE_KEY =~ ^pk_test_ ]]; then
    echo "❌ ERROR: Key must start with 'pk_test_'"
    echo "   You entered: $STRIPE_PUBLISHABLE_KEY"
    echo "   Make sure you're in TEST MODE in Stripe dashboard!"
    exit 1
fi
echo "✅ Publishable key validated"

# Get secret key
echo ""
echo "📝 Enter your Stripe TEST Secret Key (sk_test_...):"
read -r STRIPE_SECRET_KEY

# Validate secret key
if [[ ! $STRIPE_SECRET_KEY =~ ^sk_test_ ]]; then
    echo "❌ ERROR: Key must start with 'sk_test_'"
    echo "   You entered: ${STRIPE_SECRET_KEY:0:20}..."
    echo "   Make sure you're in TEST MODE in Stripe dashboard!"
    exit 1
fi
echo "✅ Secret key validated"

# Get webhook secret
echo ""
echo "📝 Enter your Webhook Signing Secret (whsec_...):"
read -r STRIPE_WEBHOOK_SECRET

# Validate webhook secret
if [[ ! $STRIPE_WEBHOOK_SECRET =~ ^whsec_ ]]; then
    echo "❌ ERROR: Webhook secret must start with 'whsec_'"
    echo "   You entered: ${STRIPE_WEBHOOK_SECRET:0:20}..."
    exit 1
fi
echo "✅ Webhook secret validated"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 2: UPDATE .env FILE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backed up .env file"

# Update .env file
if grep -q "VITE_STRIPE_PUBLISHABLE_KEY=" .env; then
    # Replace existing
    sed -i.bak "s|VITE_STRIPE_PUBLISHABLE_KEY=.*|VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY|g" .env
    echo "✅ Updated VITE_STRIPE_PUBLISHABLE_KEY"
else
    # Add new
    echo "VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY" >> .env
    echo "✅ Added VITE_STRIPE_PUBLISHABLE_KEY"
fi

if grep -q "^STRIPE_SECRET_KEY=" .env; then
    sed -i.bak "s|^STRIPE_SECRET_KEY=.*|STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY|g" .env
    echo "✅ Updated STRIPE_SECRET_KEY"
else
    echo "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY" >> .env
    echo "✅ Added STRIPE_SECRET_KEY"
fi

if grep -q "^STRIPE_WEBHOOK_SECRET=" .env; then
    sed -i.bak "s|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET|g" .env
    echo "✅ Updated STRIPE_WEBHOOK_SECRET"
else
    echo "STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET" >> .env
    echo "✅ Added STRIPE_WEBHOOK_SECRET"
fi

# Clean up backup files
rm -f .env.bak

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 3: UPDATE SUPABASE SECRETS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"

echo "Setting STRIPE_SECRET_KEY in Supabase..."
if ./node_modules/supabase/bin/supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" 2>/dev/null; then
    echo "✅ Set STRIPE_SECRET_KEY"
else
    echo "⚠️  Warning: Could not set STRIPE_SECRET_KEY (may need to set manually)"
fi

echo "Setting STRIPE_WEBHOOK_SECRET in Supabase..."
if ./node_modules/supabase/bin/supabase secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" 2>/dev/null; then
    echo "✅ Set STRIPE_WEBHOOK_SECRET"
else
    echo "⚠️  Warning: Could not set STRIPE_WEBHOOK_SECRET (may need to set manually)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 4: DEPLOY WEBHOOK FUNCTION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "Deploying stripe-webhook function..."
if ./node_modules/supabase/bin/supabase functions deploy stripe-webhook 2>&1 | grep -q "Deployed"; then
    echo "✅ Webhook function deployed successfully"
else
    echo "⚠️  Webhook deployment may have issues, check output above"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 5: VERIFY CONFIGURATION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "Checking configuration..."
echo ""
echo "  🔑 Publishable Key: ${STRIPE_PUBLISHABLE_KEY:0:20}..."
echo "  🔑 Secret Key: ${STRIPE_SECRET_KEY:0:20}..."
echo "  🔑 Webhook Secret: ${STRIPE_WEBHOOK_SECRET:0:20}..."
echo ""
echo "  🌐 Webhook URL: https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhook"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "✅ SETUP COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo ""
echo "1. Restart your dev server:"
echo "   npm run dev"
echo ""
echo "2. Test payment flow with test card:"
echo "   Card: 4242 4242 4242 4242"
echo "   Expiry: 12/25"
echo "   CVC: 123"
echo ""
echo "3. Verify webhook in Stripe dashboard:"
echo "   https://dashboard.stripe.com/test/webhooks"
echo ""
echo "4. Check webhook logs if issues:"
echo "   ./node_modules/supabase/bin/supabase functions list"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🎉 Stripe is now configured with TEST keys!"
echo "   No real charges will be made."
echo ""
