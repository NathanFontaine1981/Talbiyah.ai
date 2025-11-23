#!/bin/bash

# Configure 100ms webhook for recording events
# This tells 100ms to call our Supabase function when recordings are ready

HMS_MANAGEMENT_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NjI1NjAwNTUsImV4cCI6MTc2MzE2NDg1NSwianRpIjoiNTcyZjgzYWMtNDQzMC00NDAzLWE5OTctYWJmNzc5NmE3YzQwIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJuYmYiOjE3NjI1NjAwNTUsImFjY2Vzc19rZXkiOiI2OTA1Zjc3ZWJkMGRhYjVmOWEwMTQ0OTgifQ.2zkr68GOvEQ2GqkEPdAQN6IM0C8guLbRhueGNDnn3Ng"
WEBHOOK_URL="https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/handle-recording-webhook"

echo "🔧 Configuring 100ms Recording Webhook..."
echo ""
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# Create webhook configuration
curl -X POST "https://api.100ms.live/v2/webhooks" \
  -H "Authorization: Bearer $HMS_MANAGEMENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$WEBHOOK_URL\",
    \"events\": [\"recording.success\"],
    \"enabled\": true
  }"

echo ""
echo ""
echo "✅ Webhook configuration sent!"
echo ""
echo "To verify, check: https://dashboard.100ms.live/settings/webhooks"
