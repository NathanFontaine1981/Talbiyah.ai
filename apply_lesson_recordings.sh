#!/bin/bash
PROJECT_REF="boyrjgivpepjiboekwuu"
ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"

echo "Applying lesson_recordings migration..."

SQL_FILE="supabase/migrations/20251108130000_create_lesson_recordings_table.sql"

# Read the SQL file and escape for JSON
SQL_CONTENT=$(cat "$SQL_FILE" | jq -Rs .)

# Create JSON payload
JSON_PAYLOAD=$(cat << JSONEOF
{
  "query": $SQL_CONTENT
}
JSONEOF
)

# Execute via API
RESPONSE=$(curl -s -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD")

echo "Response:"
echo "$RESPONSE" | jq .
