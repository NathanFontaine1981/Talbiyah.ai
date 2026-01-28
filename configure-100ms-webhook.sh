#!/bin/bash

# Configure 100ms webhook for recording events
# This script now generates fresh tokens automatically - no more expiry issues!

set -e

echo "🔧 Configuring 100ms Recording Webhook..."
echo ""

# Check for required environment variables
if [ -z "$HMS_APP_ACCESS_KEY" ] || [ -z "$HMS_APP_SECRET" ]; then
  echo "❌ Missing 100ms credentials!"
  echo ""
  echo "Please set these environment variables:"
  echo "  export HMS_APP_ACCESS_KEY='your_access_key'"
  echo "  export HMS_APP_SECRET='your_app_secret'"
  echo ""
  echo "Get them from: https://dashboard.100ms.live/developer"
  echo ""
  echo "Or call the edge function directly (uses Supabase secrets):"
  echo "  curl -X POST 'https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/check-100ms-config' \\"
  echo "    -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
  echo "    -H 'Content-Type: application/json' \\"
  echo "    -d '{\"fix\": true}'"
  exit 1
fi

# Generate fresh JWT token using Node.js
echo "🔑 Generating fresh management token..."

HMS_MANAGEMENT_TOKEN=$(node -e "
const crypto = require('crypto');

const header = { alg: 'HS256', typ: 'JWT' };
const now = Math.floor(Date.now() / 1000);
const payload = {
  access_key: process.env.HMS_APP_ACCESS_KEY,
  type: 'management',
  version: 2,
  iat: now,
  nbf: now,
  exp: now + 86400,
  jti: crypto.randomUUID()
};

const base64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
const headerB64 = base64url(header);
const payloadB64 = base64url(payload);
const signature = crypto.createHmac('sha256', process.env.HMS_APP_SECRET)
  .update(headerB64 + '.' + payloadB64)
  .digest('base64url');

console.log(headerB64 + '.' + payloadB64 + '.' + signature);
")

if [ -z "$HMS_MANAGEMENT_TOKEN" ]; then
  echo "❌ Failed to generate token. Make sure Node.js is installed."
  exit 1
fi

echo "✅ Token generated (expires in 24 hours)"
echo ""

WEBHOOK_URL="https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/handle-recording-webhook"
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# List existing webhooks first
echo "📋 Checking existing webhooks..."
EXISTING=$(curl -s "https://api.100ms.live/v2/webhooks" \
  -H "Authorization: Bearer $HMS_MANAGEMENT_TOKEN")
echo "$EXISTING" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Found {len(d.get(\"data\", d) if isinstance(d, dict) else d)} existing webhooks')" 2>/dev/null || echo "Could not parse response"
echo ""

# Create webhook configuration
echo "🚀 Creating webhook..."
RESULT=$(curl -s -X POST "https://api.100ms.live/v2/webhooks" \
  -H "Authorization: Bearer $HMS_MANAGEMENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$WEBHOOK_URL\",
    \"events\": [\"recording.success\", \"beam.recording.success\", \"transcription.success\", \"transcription.started.success\"],
    \"enabled\": true
  }")

echo "Response: $RESULT"
echo ""

# Check if successful
if echo "$RESULT" | grep -q "id"; then
  echo "✅ Webhook configured successfully!"
else
  echo "⚠️  Check response above for any errors"
fi

echo ""
echo "📋 Next steps:"
echo "  1. Verify at: https://dashboard.100ms.live/developer (Webhooks section)"
echo "  2. Make sure HMS_WEBHOOK_SECRET is set in Supabase secrets"
echo "  3. Test with a lesson recording"
