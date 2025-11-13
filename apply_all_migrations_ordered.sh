#!/bin/bash
PROJECT_REF="boyrjgivpepjiboekwuu"
ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"

apply_migration() {
  local SQL_FILE=$1
  local NAME=$2
  
  echo "Applying $NAME..."
  
  SQL_CONTENT=$(cat "$SQL_FILE" | jq -Rs .)
  JSON_PAYLOAD="{\"query\": $SQL_CONTENT}"
  
  RESPONSE=$(curl -s -X POST \
    "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$JSON_PAYLOAD")
  
  if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo "❌ Error: $(echo "$RESPONSE" | jq -r '.error.message')"
    return 1
  else
    echo "✅ $NAME applied"
    return 0
  fi
}

echo "🚀 Applying migrations in correct order..."
echo ""

# 1. Bookings (no dependencies)
apply_migration "supabase/migrations/20251108140000_create_bookings_table.sql" "Bookings Table"
echo ""

# 2. Group Sessions (no dependencies on new tables)
apply_migration "supabase/migrations/20251108120000_create_group_sessions_tables.sql" "Group Sessions Tables"
echo ""

# 3. Lesson Recordings (depends on bookings)
apply_migration "supabase/migrations/20251108130000_create_lesson_recordings_table.sql" "Lesson Recordings Table"
echo ""

echo "✨ All migrations applied!"
