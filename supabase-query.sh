#!/bin/bash
# Supabase SQL Query Helper Script
# Usage: ./supabase-query.sh "YOUR SQL QUERY HERE"

PROJECT_REF="boyrjgivpepjiboekwuu"
ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"

if [ -z "$1" ]; then
  echo "Usage: $0 \"SQL QUERY\""
  exit 1
fi

SQL_QUERY="$1"

curl -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${SQL_QUERY}\"}" \
  2>/dev/null | jq '.' 2>/dev/null || cat

echo ""
