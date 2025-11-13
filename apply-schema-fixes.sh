#!/bin/bash

# Apply schema fixes for missing columns

export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"
PROJECT_REF="boyrjgivpepjiboekwuu"

echo "📋 Applying schema fixes..."
echo ""

# Apply subjects column migration
echo "1️⃣  Adding missing columns to subjects table..."
npx supabase db execute --file supabase/migrations/20251109000000_add_missing_subjects_columns.sql --linked

if [ $? -eq 0 ]; then
  echo "✅ Subjects table updated successfully"
else
  echo "❌ Failed to update subjects table"
  exit 1
fi

echo ""

# Apply learners column migration
echo "2️⃣  Adding missing columns to learners table..."
npx supabase db execute --file supabase/migrations/20251109000001_add_missing_learners_columns.sql --linked

if [ $? -eq 0 ]; then
  echo "✅ Learners table updated successfully"
else
  echo "❌ Failed to update learners table"
  exit 1
fi

echo ""
echo "🎉 Schema fixes applied successfully!"
echo ""
echo "You can now test the free booking flow."
