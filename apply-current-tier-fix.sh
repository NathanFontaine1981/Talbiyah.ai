#!/bin/bash

# Apply the current_tier column fix directly to the database

echo "🔧 Applying current_tier column fix to teacher_profiles..."
echo ""

# Add the current_tier column
echo "1️⃣ Adding current_tier column..."
PGPASSWORD="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY" psql \
  -h aws-0-us-west-1.pooler.supabase.com \
  -p 6543 \
  -d postgres \
  -U postgres.boyrjgivpepjiboekwuu \
  -c "ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS current_tier text DEFAULT 'newcomer';"

echo ""
echo "2️⃣ Adding foreign key constraint..."
PGPASSWORD="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY" psql \
  -h aws-0-us-west-1.pooler.supabase.com \
  -p 6543 \
  -d postgres \
  -U postgres.boyrjgivpepjiboekwuu \
  -c "ALTER TABLE teacher_profiles DROP CONSTRAINT IF EXISTS teacher_profiles_current_tier_fkey; ALTER TABLE teacher_profiles ADD CONSTRAINT teacher_profiles_current_tier_fkey FOREIGN KEY (current_tier) REFERENCES teacher_tiers(tier);"

echo ""
echo "3️⃣ Adding tier_assigned_at column..."
PGPASSWORD="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY" psql \
  -h aws-0-us-west-1.pooler.supabase.com \
  -p 6543 \
  -d postgres \
  -U postgres.boyrjgivpepjiboekwuu \
  -c "ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS tier_assigned_at timestamptz DEFAULT now();"

echo ""
echo "4️⃣ Updating existing teachers..."
PGPASSWORD="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY" psql \
  -h aws-0-us-west-1.pooler.supabase.com \
  -p 6543 \
  -d postgres \
  -U postgres.boyrjgivpepjiboekwuu \
  -c "UPDATE teacher_profiles SET current_tier = 'newcomer', tier_assigned_at = COALESCE(tier_assigned_at, now()) WHERE current_tier IS NULL;"

echo ""
echo "5️⃣ Recreating teacher_tier_stats view..."
PGPASSWORD="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY" psql \
  -h aws-0-us-west-1.pooler.supabase.com \
  -p 6543 \
  -d postgres \
  -U postgres.boyrjgivpepjiboekwuu \
  -f ./supabase/migrations/20251117170000_add_current_tier_to_teacher_profiles.sql

echo ""
echo "✅ Migration complete! Refresh your browser to see tier information."
