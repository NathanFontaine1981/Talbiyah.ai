#!/bin/bash

export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"
export PROJECT_REF="boyrjgivpepjiboekwuu"

# Array of migrations that need to be marked as applied
migrations=(
  "20251108000000_create_cart_items_table"
  "20251108000000_create_referral_system"
  "20251108120000_create_group_sessions_tables"
  "20251108130000_create_lesson_recordings_table"
  "20251108140000_create_bookings_table"
  "20251108150000_add_unique_constraint_to_teacher_availability"
  "20251108160000_create_student_teachers"
  "20251108170000_create_imam_conversations"
  "20251109000000_add_missing_subjects_columns"
  "20251109000001_add_missing_learners_columns"
  "20251109000002_fix_profile_creation_trigger_and_missing_profiles"
  "20251109000003_create_get_users_with_emails_function"
  "20251109000004_fix_teacher_profiles_rls"
  "20251109000005_fix_missing_columns"
  "20251109000006_add_missing_profile_columns"
  "20251109200000_add_room_codes_to_lessons"
  "20251110000000_create_pending_bookings_table"
  "20251110000001_add_teacher_confirmed_to_lessons"
  "20251110000002_allow_teachers_to_view_student_learners"
  "20251110000003_allow_authenticated_users_to_read_profiles"
  "20251110000004_create_recordings_and_insights_tables"
  "20251110000005_create_lesson_insights_table"
  "20251110000006_add_student_interaction_to_insights"
)

echo "Marking migrations as applied..."
for migration in "${migrations[@]}"
do
  echo "Marking ${migration}.sql as applied..."
  ./node_modules/supabase/bin/supabase migration repair --status applied "${migration}.sql" --linked
done

echo "All migrations marked as applied!"
echo "Now pushing new gamified referral migration..."
./node_modules/supabase/bin/supabase db push --linked
