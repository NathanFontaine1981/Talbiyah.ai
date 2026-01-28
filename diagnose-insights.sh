#!/bin/bash

# Diagnose why lesson insights are not being generated
# Run this after a test lesson to see what's happening

echo "🔍 Diagnosing Lesson Insights..."
echo ""

# Get the Supabase URL and key from .env or environment
SUPABASE_URL="${VITE_SUPABASE_URL:-https://boyrjgivpepjiboekwuu.supabase.co}"
# You'll need to set this - get it from Supabase dashboard > Settings > API
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-YOUR_SERVICE_ROLE_KEY}"

if [ "$SUPABASE_SERVICE_KEY" = "YOUR_SERVICE_ROLE_KEY" ]; then
  echo "❌ Please set SUPABASE_SERVICE_ROLE_KEY environment variable"
  echo "   Get it from: Supabase Dashboard > Settings > API > service_role key"
  exit 1
fi

echo "📋 Checking recent lessons..."
echo ""

# Call the find-and-generate-insights function to list lessons
curl -s -X POST "$SUPABASE_URL/functions/v1/find-and-generate-insights" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"list_all": true}' | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    lessons = data.get('lessons', [])

    print(f'Found {len(lessons)} recent lessons\\n')
    print('=' * 80)

    for lesson in lessons[:10]:
        print(f\"\\nLesson: {lesson.get('lesson_id', 'N/A')[:8]}...\")
        print(f\"  📅 {lesson.get('scheduled_time', 'N/A')}\")
        print(f\"  📚 Subject: {lesson.get('subject', 'N/A')}\")
        print(f\"  👨‍🎓 Learner: {lesson.get('learner', 'N/A')}\")
        print(f\"  👨‍🏫 Teacher: {lesson.get('teacher', 'N/A')}\")
        print(f\"  📊 Status: {lesson.get('status', 'N/A')}\")
        print(f\"  🎬 Has Room ID: {'✅' if lesson.get('room_id') else '❌'}\")
        print(f\"  🎯 Has Insights: {'✅' if lesson.get('has_insights') else '❌'}\")

        if not lesson.get('has_insights'):
            print(f\"  ⚠️  MISSING INSIGHTS\")

    # Summary
    missing = [l for l in lessons if not l.get('has_insights')]
    if missing:
        print(f'\\n\\n⚠️  {len(missing)} lessons without insights')
        print('\\nPossible causes:')
        print('  1. 100ms webhook not configured')
        print('  2. Recording not started during lesson')
        print('  3. Transcription not enabled')
        print('\\nRun: ./configure-100ms-webhook.sh (need fresh token)')
    else:
        print('\\n\\n✅ All recent lessons have insights!')

except json.JSONDecodeError:
    print('Failed to parse response')
    print(sys.stdin.read())
except Exception as e:
    print(f'Error: {e}')
"

echo ""
echo ""
echo "📝 Next Steps:"
echo "  1. Check 100ms Dashboard > Webhooks to verify webhook is configured"
echo "  2. Verify webhook URL: $SUPABASE_URL/functions/v1/handle-recording-webhook"
echo "  3. Check 100ms Dashboard > Templates > Recording settings"
echo "  4. Look at edge function logs: supabase functions logs handle-recording-webhook"
