#!/bin/bash

# Enable recording and transcription on 100ms template
# This script generates fresh tokens automatically - no more expiry issues!

set -e

echo "🎥 Enabling Recording & Transcription on 100ms Template..."
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
  exit 1
fi

# Generate fresh JWT token
echo "🔑 Generating fresh management token..."

HMS_TOKEN=$(node -e "
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

if [ -z "$HMS_TOKEN" ]; then
  echo "❌ Failed to generate token. Make sure Node.js is installed."
  exit 1
fi

echo "✅ Token generated"
echo ""

HMS_TEMPLATE_ID="${HMS_TEMPLATE_ID:-694e3cd62f99d9b901d90528}"
echo "Template ID: $HMS_TEMPLATE_ID"
echo ""

# Get current template settings
echo "📋 Fetching current template settings..."
CURRENT=$(curl -s "https://api.100ms.live/v2/templates/$HMS_TEMPLATE_ID" \
  -H "Authorization: Bearer $HMS_TOKEN")

echo "Current template name: $(echo "$CURRENT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('name', 'Unknown'))" 2>/dev/null || echo "Could not parse")"
echo ""

# Update template to enable recording with transcription
echo "🚀 Updating template settings..."
RESULT=$(curl -s -X POST "https://api.100ms.live/v2/templates/$HMS_TEMPLATE_ID" \
  -H "Authorization: Bearer $HMS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "recording": {
        "enabled": true,
        "upload": {
          "type": "s3",
          "location": "eu-central-1"
        }
      },
      "transcription": {
        "enabled": true,
        "modes": ["recorded"],
        "output_modes": ["json", "txt"],
        "custom_vocabulary": ["Quran", "Surah", "Ayah", "Tajweed", "Makharij", "Sifaat", "Allah", "Bismillah", "Alhamdulillah", "SubhanAllah", "Talbiyah", "Fatiha", "Baqarah", "Ikhlas", "Falaq", "Nas", "Rahman", "Mulk"]
      }
    }
  }')

echo "Response: $RESULT"
echo ""

if echo "$RESULT" | grep -q "id"; then
  echo "✅ Template updated successfully!"
else
  echo "⚠️  Check response above for any errors"
fi

echo ""
echo "📋 What this enables:"
echo "  • Automatic video recording for all lessons"
echo "  • Speech-to-text transcription (English + Arabic terms)"
echo "  • Custom vocabulary for Islamic terms"
echo "  • Webhook notification when recording is ready"
echo "  • AI insights generation from transcripts"
echo ""
echo "Verify at: https://dashboard.100ms.live/templates/$HMS_TEMPLATE_ID"
