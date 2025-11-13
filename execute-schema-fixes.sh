#!/bin/bash

# Execute schema fixes using psql

export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"
PROJECT_REF="boyrjgivpepjiboekwuu"

# Get database connection string
echo "📋 Getting database connection string..."
DB_URL=$(npx supabase db remote-url --linked 2>/dev/null | tail -1)

if [ -z "$DB_URL" ]; then
  echo "❌ Failed to get database URL"
  exit 1
fi

echo "✅ Connected to database"
echo ""

# Execute subjects migration
echo "1️⃣  Adding missing columns to subjects table..."
psql "$DB_URL" -f supabase/migrations/20251109000000_add_missing_subjects_columns.sql

if [ $? -eq 0 ]; then
  echo "✅ Subjects table updated successfully"
else
  echo "❌ Failed to update subjects table"
  exit 1
fi

echo ""

# Execute learners migration
echo "2️⃣  Adding missing columns to learners table..."
psql "$DB_URL" -f supabase/migrations/20251109000001_add_missing_learners_columns.sql

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
