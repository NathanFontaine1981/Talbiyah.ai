#!/bin/bash

# Deploy Lesson Confirmation System

echo "🚀 Deploying Lesson Confirmation System..."
echo ""

# Apply database migration
echo "📊 Applying database migration..."
SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff" npx supabase db push
if [ $? -eq 0 ]; then
  echo "✅ Migration applied successfully"
else
  echo "❌ Migration failed"
  exit 1
fi

echo ""

# Deploy Edge Functions
echo "🔧 Deploying Edge Functions..."

echo "  📦 Deploying acknowledge-lesson..."
SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff" npx supabase functions deploy acknowledge-lesson

echo "  📦 Deploying decline-lesson..."
SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff" npx supabase functions deploy decline-lesson

echo "  📦 Deploying auto-acknowledge-lessons..."
SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff" npx supabase functions deploy auto-acknowledge-lessons

echo ""
echo "✨ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Set up cron job to call auto-acknowledge-lessons every hour"
echo "  2. Test acknowledgment flow as teacher"
echo "  3. Test decline flow and credit refund"
echo "  4. Verify status badges show on student dashboard"
echo "  5. Test auto-acknowledge after 24 hours"
echo ""
