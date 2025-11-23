#!/bin/bash

# Enable recording on 100ms template
# This ensures all lessons are automatically recorded with transcripts

HMS_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NjI1NjAwNTUsImV4cCI6MTc2MzE2NDg1NSwianRpIjoiNTcyZjgzYWMtNDQzMC00NDAzLWE5OTctYWJmNzc5NmE3YzQwIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJuYmYiOjE3NjI1NjAwNTUsImFjY2Vzc19rZXkiOiI2OTA1Zjc3ZWJkMGRhYjVmOWEwMTQ0OTgifQ.2zkr68GOvEQ2GqkEPdAQN6IM0C8guLbRhueGNDnn3Ng"
HMS_TEMPLATE_ID="${HMS_TEMPLATE_ID:-6905fb03033903926e627d60}"

echo "🎥 Enabling Recording on 100ms Template..."
echo ""
echo "Template ID: $HMS_TEMPLATE_ID"
echo ""

# Update template to enable recording with transcription
curl -X POST "https://api.100ms.live/v2/templates/$HMS_TEMPLATE_ID" \
  -H "Authorization: Bearer $HMS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recording": {
      "enabled": true,
      "upload_info": {
        "type": "s3",
        "location": "us-west-2"
      },
      "options": {
        "transcription_enabled": true,
        "transcription_language": "en-US"
      }
    }
  }'

echo ""
echo ""
echo "✅ Recording configuration sent!"
echo ""
echo "Verify at: https://dashboard.100ms.live/templates/$HMS_TEMPLATE_ID"
echo ""
echo "📋 What this enables:"
echo "  • Automatic video recording for all lessons"
echo "  • Speech-to-text transcription"
echo "  • Webhook notification when recording is ready"
echo "  • AI insights generation"
