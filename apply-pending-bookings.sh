#!/bin/bash

# Apply pending_bookings migration via Supabase API
SQL_FILE="supabase/migrations/20251110000000_create_pending_bookings_table.sql"

# Read SQL content
SQL_CONTENT=$(cat "$SQL_FILE")

# Execute via psql if available, otherwise show instructions
if command -v psql &> /dev/null; then
    echo "Executing migration..."
    psql "postgresql://postgres.boyrjgivpepjiboekwuu:Talbiyah2024!@aws-0-eu-west-1.pooler.supabase.com:6543/postgres" -f "$SQL_FILE"
else
    echo "psql not found. Please run this SQL manually in Supabase SQL Editor:"
    echo "https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/sql"
    echo ""
    echo "Or install PostgreSQL client: brew install postgresql"
    echo ""
    cat "$SQL_FILE"
fi
