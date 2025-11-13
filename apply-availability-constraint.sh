#!/bin/bash
PROJECT_REF="boyrjgivpepjiboekwuu"
ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"

echo "📝 Applying teacher_availability unique constraint migration..."

SQL_FILE="supabase/migrations/20251108150000_add_unique_constraint_to_teacher_availability.sql"
SQL_CONTENT=$(cat "$SQL_FILE" | jq -Rs .)
JSON_PAYLOAD="{\"query\": $SQL_CONTENT}"

RESPONSE=$(curl -s -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD")

if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "❌ Error: $(echo "$RESPONSE" | jq -r '.error.message')"
  exit 1
else
  echo "✅ Unique constraint added successfully"
fi
