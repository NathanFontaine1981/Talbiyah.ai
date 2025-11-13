#!/bin/bash

# Deploy Admin Dashboard Tables Script
# Run this to apply the 3 new admin table migrations

echo "🚀 Deploying Admin Dashboard Tables..."
echo ""

export PROJECT_REF="boyrjgivpepjiboekwuu"
export SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

# Check if we have the access token
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "⚠️  SUPABASE_ACCESS_TOKEN not set"
    echo "Run: export SUPABASE_ACCESS_TOKEN='sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff'"
    exit 1
fi

echo "📋 Applying 3 admin table migrations..."
echo ""

# Apply group_sessions migration
echo "1/3 Creating group_sessions tables..."
npx supabase db execute --db-url "postgresql://postgres.${PROJECT_REF}@aws-0-us-east-1.pooler.supabase.com:6543/postgres" < supabase/migrations/20251108120000_create_group_sessions_tables.sql
if [ $? -eq 0 ]; then
    echo "✅ group_sessions tables created"
else
    echo "❌ Failed to create group_sessions tables"
fi
echo ""

# Apply lesson_recordings migration
echo "2/3 Creating lesson_recordings table..."
npx supabase db execute --db-url "postgresql://postgres.${PROJECT_REF}@aws-0-us-east-1.pooler.supabase.com:6543/postgres" < supabase/migrations/20251108130000_create_lesson_recordings_table.sql
if [ $? -eq 0 ]; then
    echo "✅ lesson_recordings table created"
else
    echo "❌ Failed to create lesson_recordings table"
fi
echo ""

# Apply bookings migration
echo "3/3 Creating bookings table..."
npx supabase db execute --db-url "postgresql://postgres.${PROJECT_REF}@aws-0-us-east-1.pooler.supabase.com:6543/postgres" < supabase/migrations/20251108140000_create_bookings_table.sql
if [ $? -eq 0 ]; then
    echo "✅ bookings table created"
else
    echo "❌ Failed to create bookings table"
fi
echo ""

echo "✨ Admin dashboard tables deployment complete!"
echo ""
echo "Next steps:"
echo "1. Verify tables exist in Supabase dashboard"
echo "2. Open http://localhost:5173/admin to test"
