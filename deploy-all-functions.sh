#!/bin/bash

# Complete Booking/Payment/100ms Deployment Script
# Deploys all edge functions needed for the complete flow

echo "🚀 Complete Booking System Deployment"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found${NC}"
    echo "Installing Supabase CLI..."
    npm install -g supabase
fi

echo -e "${GREEN}✅ Supabase CLI is installed${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create a .env file with your API keys"
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"
echo ""

# Extract API keys from .env
STRIPE_SECRET_KEY=$(grep "^STRIPE_SECRET_KEY=" .env | cut -d '=' -f 2-)
HMS_MANAGEMENT_TOKEN=$(grep "^HMS_MANAGEMENT_TOKEN=" .env | cut -d '=' -f 2-)
HMS_APP_ACCESS_KEY=$(grep "^HMS_APP_ACCESS_KEY=" .env | cut -d '=' -f 2-)
HMS_APP_SECRET=$(grep "^HMS_APP_SECRET=" .env | cut -d '=' -f 2-)
STRIPE_WEBHOOK_SECRET=$(grep "^STRIPE_WEBHOOK_SECRET=" .env | cut -d '=' -f 2-)

# Validate Stripe keys
if [ -z "$STRIPE_SECRET_KEY" ] || [ "$STRIPE_SECRET_KEY" == "sk_test_YOUR_KEY_HERE" ]; then
    echo -e "${YELLOW}⚠️  Stripe secret key not configured${NC}"
    echo "Please update STRIPE_SECRET_KEY in .env file"
    echo "Get your key from: https://dashboard.stripe.com/test/apikeys"
    echo ""
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ Stripe secret key found${NC}"
fi

# Validate 100ms keys
if [ -z "$HMS_MANAGEMENT_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  100ms Management Token not configured${NC}"
    echo "Please update HMS_MANAGEMENT_TOKEN in .env file"
    echo "Get your keys from: https://dashboard.100ms.live/"
    echo ""
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ 100ms keys found${NC}"
fi

echo ""

# Login to Supabase
echo -e "${BLUE}📝 Logging in to Supabase...${NC}"
npx supabase login

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to login to Supabase${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Logged in to Supabase${NC}"
echo ""

# Link project
echo -e "${BLUE}🔗 Linking to Supabase project...${NC}"
npx supabase link --project-ref boyrjgivpepjiboekwuu

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to link project${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project linked${NC}"
echo ""

# Deploy edge functions
echo -e "${BLUE}🚀 Deploying edge functions...${NC}"
echo ""

# Function 1: get-available-slots
echo "1️⃣  Deploying get-available-slots..."
npx supabase functions deploy get-available-slots --no-verify-jwt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ get-available-slots deployed${NC}"
else
    echo -e "${RED}   ❌ Failed to deploy get-available-slots${NC}"
fi
echo ""

# Function 2: initiate-booking-checkout
echo "2️⃣  Deploying initiate-booking-checkout..."
npx supabase functions deploy initiate-booking-checkout --no-verify-jwt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ initiate-booking-checkout deployed${NC}"
else
    echo -e "${RED}   ❌ Failed to deploy initiate-booking-checkout${NC}"
fi
echo ""

# Function 3: create-hms-room
echo "3️⃣  Deploying create-hms-room..."
npx supabase functions deploy create-hms-room --no-verify-jwt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ create-hms-room deployed${NC}"
else
    echo -e "${RED}   ❌ Failed to deploy create-hms-room${NC}"
fi
echo ""

# Function 4: create-single-booking-internal
echo "4️⃣  Deploying create-single-booking-internal..."
npx supabase functions deploy create-single-booking-internal --no-verify-jwt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ create-single-booking-internal deployed${NC}"
else
    echo -e "${RED}   ❌ Failed to deploy create-single-booking-internal${NC}"
fi
echo ""

# Function 5: stripe-webhooks
echo "5️⃣  Deploying stripe-webhooks..."
npx supabase functions deploy stripe-webhooks --no-verify-jwt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ stripe-webhooks deployed${NC}"
else
    echo -e "${RED}   ❌ Failed to deploy stripe-webhooks${NC}"
fi
echo ""

# Set environment secrets
echo -e "${BLUE}🔑 Setting environment secrets...${NC}"
echo ""

# Stripe secrets
if [ ! -z "$STRIPE_SECRET_KEY" ] && [ "$STRIPE_SECRET_KEY" != "sk_test_YOUR_KEY_HERE" ]; then
    echo "Setting STRIPE_SECRET_KEY..."
    npx supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" --project-ref boyrjgivpepjiboekwuu
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ STRIPE_SECRET_KEY set${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to set STRIPE_SECRET_KEY (set manually)${NC}"
    fi
fi

if [ ! -z "$STRIPE_WEBHOOK_SECRET" ] && [ "$STRIPE_WEBHOOK_SECRET" != "whsec_YOUR_WEBHOOK_SECRET_HERE" ]; then
    echo "Setting STRIPE_WEBHOOK_SECRET..."
    npx supabase secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" --project-ref boyrjgivpepjiboekwuu
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ STRIPE_WEBHOOK_SECRET set${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to set STRIPE_WEBHOOK_SECRET (set manually)${NC}"
    fi
fi

# 100ms secrets
if [ ! -z "$HMS_MANAGEMENT_TOKEN" ]; then
    echo "Setting HMS_MANAGEMENT_TOKEN..."
    npx supabase secrets set HMS_MANAGEMENT_TOKEN="$HMS_MANAGEMENT_TOKEN" --project-ref boyrjgivpepjiboekwuu
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ HMS_MANAGEMENT_TOKEN set${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to set HMS_MANAGEMENT_TOKEN (set manually)${NC}"
    fi
fi

if [ ! -z "$HMS_APP_ACCESS_KEY" ]; then
    echo "Setting HMS_APP_ACCESS_KEY..."
    npx supabase secrets set HMS_APP_ACCESS_KEY="$HMS_APP_ACCESS_KEY" --project-ref boyrjgivpepjiboekwuu
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ HMS_APP_ACCESS_KEY set${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to set HMS_APP_ACCESS_KEY (set manually)${NC}"
    fi
fi

if [ ! -z "$HMS_APP_SECRET" ]; then
    echo "Setting HMS_APP_SECRET..."
    npx supabase secrets set HMS_APP_SECRET="$HMS_APP_SECRET" --project-ref boyrjgivpepjiboekwuu
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ HMS_APP_SECRET set${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to set HMS_APP_SECRET (set manually)${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✨ Deployment Complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo "1. Configure Stripe Webhook:"
echo "   • Go to: https://dashboard.stripe.com/test/webhooks"
echo "   • Add endpoint: https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhooks"
echo "   • Select event: checkout.session.completed"
echo "   • Copy signing secret and add to .env as STRIPE_WEBHOOK_SECRET"
echo ""
echo "2. Test the complete flow:"
echo "   • Restart dev server: npm run dev"
echo "   • Add lessons to cart"
echo "   • Click 'Proceed to Checkout'"
echo "   • Use test card: 4242 4242 4242 4242"
echo "   • Expiry: 12/25, CVC: 123, ZIP: 12345"
echo ""
echo "3. View logs:"
echo "   • All functions: npx supabase functions logs"
echo "   • Specific function: npx supabase functions logs [function-name]"
echo "   • Dashboard: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/functions/logs"
echo ""
echo "4. Verify deployment:"
echo "   • List functions: npx supabase functions list"
echo "   • List secrets: npx supabase secrets list"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   • Complete status: BOOKING_PAYMENT_100MS_STATUS.md"
echo "   • Stripe setup: STRIPE_SETUP_GUIDE.md"
echo "   • Quick start: STRIPE_QUICKSTART.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
