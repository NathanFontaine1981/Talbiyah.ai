#!/bin/bash

# Apply payment logging migration
export PROJECT_REF="boyrjgivpepjiboekwuu"
export ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"

echo "📋 Applying payment logging migration..."

SQL=$(cat supabase/migrations/20251112140000_add_payment_logging.sql)

curl -X POST "https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql" \
  -H "apikey: ${ACCESS_TOKEN}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL" | jq -Rs .)}"

echo ""
echo "✅ Migration applied!"
