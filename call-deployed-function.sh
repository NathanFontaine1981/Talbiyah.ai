#!/bin/bash

ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU"

echo "Trying generate-talbiyah-insight..."
curl -X POST "https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/generate-talbiyah-insight" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d @test-data/nathan-quran-lesson-payload.json 2>&1 | head -20

echo ""
echo "If that didn't work, trying process-lesson-transcript..."
curl -X POST "https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/process-lesson-transcript" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"lesson_id": "30a7dd02-7e85-4abb-a661-d5b25e5e157b", "transcript": "test"}' 2>&1 | head -20
