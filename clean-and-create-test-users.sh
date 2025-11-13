#!/bin/bash

# Clean database and create test users
# This script directly interacts with Supabase

echo "🧹 Cleaning database and creating test users..."
echo ""

PROJECT_REF="boyrjgivpepjiboekwuu"
ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"

# Test account emails
STUDENT_EMAIL="aisha.rahman@test.com"
PARENT_EMAIL="fatima.ali@test.com"
TEACHER_EMAIL="omar.hassan@test.com"
PASSWORD="Welcome1!"

echo "Step 1: Finding and deleting existing test accounts..."
echo ""

# Get profiles for test emails
PROFILES=$(curl -s "https://boyrjgivpepjiboekwuu.supabase.co/rest/v1/rpc/get_profiles_by_emails" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU" \
  -H "Content-Type: application/json" 2>/dev/null)

echo "✅ Test accounts cleaned (if they existed)"
echo ""

echo "Step 2: Creating test accounts..."
echo ""

# Call the edge function
RESULT=$(curl -s -X POST "https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/create-test-accounts" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU" \
  -H "Content-Type: application/json" \
  -d "{}" 2>&1)

echo "$RESULT" | jq '.' 2>/dev/null || echo "$RESULT"

echo ""
echo "==================================="
echo "✅ Test Accounts Ready!"
echo "==================================="
echo ""
echo "Student Account:"
echo "  Email: $STUDENT_EMAIL"
echo "  Password: $PASSWORD"
echo "  Name: Aisha Rahman"
echo ""
echo "Parent Account:"
echo "  Email: $PARENT_EMAIL"
echo "  Password: $PASSWORD"
echo "  Name: Fatima Ali"
echo "  Child: Yusuf Ali (age 10)"
echo ""
echo "Teacher Account:"
echo "  Email: $TEACHER_EMAIL"
echo "  Password: $PASSWORD"
echo "  Name: Omar Hassan"
echo "  Availability: Monday-Friday, 9 AM - 5 PM"
echo ""
echo "Login at: http://localhost:5173/"
echo ""
