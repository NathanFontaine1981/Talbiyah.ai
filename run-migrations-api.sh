#!/bin/bash

# Script to apply migrations via Supabase Management API
# Uses the access token to execute SQL directly

PROJECT_REF="boyrjgivpepjiboekwuu"
ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"

echo "🚀 Applying Admin Dashboard Migrations via API..."
echo ""

# Migration 1: Group Sessions
echo "1/3 Applying group_sessions migration..."
SQL_QUERY=$(cat supabase/migrations/20251108120000_create_group_sessions_tables.sql)
RESPONSE=$(curl -s -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_QUERY" | jq -Rs .)}")

if echo "$RESPONSE" | grep -q "error"; then
  echo "❌ Error: $RESPONSE"
else
  echo "✅ group_sessions migration applied"
fi
echo ""

# Migration 2: Lesson Recordings
echo "2/3 Applying lesson_recordings migration..."
SQL_QUERY=$(cat supabase/migrations/20251108130000_create_lesson_recordings_table.sql)
RESPONSE=$(curl -s -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_QUERY" | jq -Rs .)}")

if echo "$RESPONSE" | grep -q "error"; then
  echo "❌ Error: $RESPONSE"
else
  echo "✅ lesson_recordings migration applied"
fi
echo ""

# Migration 3: Bookings
echo "3/3 Applying bookings migration..."
SQL_QUERY=$(cat supabase/migrations/20251108140000_create_bookings_table.sql)
RESPONSE=$(curl -s -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_QUERY" | jq -Rs .)}")

if echo "$RESPONSE" | grep -q "error"; then
  echo "❌ Error: $RESPONSE"
else
  echo "✅ bookings migration applied"
fi
echo ""

echo "✨ Migration deployment complete!"
