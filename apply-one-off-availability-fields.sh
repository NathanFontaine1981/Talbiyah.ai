#!/bin/bash

# Apply migration to add fields to teacher_availability_one_off table

PROJECT_REF="boyrjgivpepjiboekwuu"
ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"

SQL="
ALTER TABLE teacher_availability_one_off
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS subjects text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_teacher_availability_one_off_teacher_date
  ON teacher_availability_one_off(teacher_id, date);

COMMENT ON TABLE teacher_availability_one_off IS 'One-off availability for specific dates (not recurring weekly patterns)';
COMMENT ON COLUMN teacher_availability_one_off.subjects IS 'Array of subject IDs that teacher can teach during this slot';
"

echo "Applying migration to add fields to teacher_availability_one_off table..."

curl -X POST "https://${PROJECT_REF}.supabase.co/rest/v1/rpc/query" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL" | jq -Rs .)}"

echo ""
echo "Migration applied successfully!"
