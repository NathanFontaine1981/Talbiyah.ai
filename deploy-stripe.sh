#!/bin/bash

# Stripe Checkout Deployment Script
# This script helps deploy the Stripe checkout edge function to Supabase

echo "🚀 Stripe Checkout Deployment Script"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found${NC}"
    echo "Installing Supabase CLI..."
    npm install -g supabase
fi

echo "✅ Supabase CLI is installed"
echo ""

# Check if .env file exists and has Stripe keys
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create a .env file with your Stripe keys"
    exit 1
fi

# Check if Stripe keys are set
if ! grep -q "STRIPE_SECRET_KEY=" .env || grep -q "STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE" .env; then
    echo -e "${YELLOW}⚠️  Stripe secret key not configured in .env${NC}"
    echo ""
    echo "Please update your .env file with:"
    echo "  VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY"
    echo "  STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY"
    echo ""
    echo "Get your keys from: https://dashboard.stripe.com/test/apikeys"
    echo ""
    read -p "Have you updated your .env file? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ .env file found with Stripe keys"
echo ""

# Extract Stripe secret key from .env
STRIPE_SECRET_KEY=$(grep "^STRIPE_SECRET_KEY=" .env | cut -d '=' -f 2-)

if [ -z "$STRIPE_SECRET_KEY" ] || [ "$STRIPE_SECRET_KEY" == "sk_test_YOUR_KEY_HERE" ]; then
    echo -e "${RED}❌ Stripe secret key not set in .env file${NC}"
    exit 1
fi

echo "🔐 Stripe secret key found: ${STRIPE_SECRET_KEY:0:20}..."
echo ""

# Login to Supabase
echo "📝 Logging in to Supabase..."
npx supabase login

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to login to Supabase${NC}"
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# Link project
echo "🔗 Linking to Supabase project..."
npx supabase link --project-ref boyrjgivpepjiboekwuu

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to link project${NC}"
    exit 1
fi

echo "✅ Project linked"
echo ""

# Deploy edge function
echo "🚀 Deploying initiate-booking-checkout edge function..."
npx supabase functions deploy initiate-booking-checkout --no-verify-jwt

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to deploy edge function${NC}"
    exit 1
fi

echo "✅ Edge function deployed"
echo ""

# Set Stripe secret in Supabase
echo "🔑 Setting Stripe secret key in Supabase..."
npx supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" --project-ref boyrjgivpepjiboekwuu

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Failed to set Stripe secret (you may need to set it manually)${NC}"
    echo "Go to: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/settings/functions"
    echo "Add secret: STRIPE_SECRET_KEY = $STRIPE_SECRET_KEY"
else
    echo "✅ Stripe secret key set in Supabase"
fi

echo ""
echo -e "${GREEN}✨ Deployment Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Restart your dev server: npm run dev"
echo "2. Add lessons to cart and test checkout"
echo "3. Use test card: 4242 4242 4242 4242"
echo ""
echo "View edge function logs:"
echo "npx supabase functions logs initiate-booking-checkout"
echo ""
echo "Or in dashboard:"
echo "https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/functions/logs"
echo ""
