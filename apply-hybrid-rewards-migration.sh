#!/bin/bash

# Copy the migration SQL to clipboard
cat supabase/migrations/20251111120000_update_referral_hybrid_rewards.sql | pbcopy

echo "✅ Migration SQL copied to clipboard!"
echo ""
echo "📋 Next steps:"
echo "1. Opening Supabase Dashboard SQL Editor..."
echo "2. Paste the SQL (Cmd+V) and click 'Run'"
echo ""

# Open Supabase SQL Editor
open "https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/sql/new"

echo "✨ Migration is ready to paste and run!"
