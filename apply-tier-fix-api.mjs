#!/usr/bin/env node

const PROJECT_REF = 'boyrjgivpepjiboekwuu';
const ACCESS_TOKEN = 'sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff';

const statements = [
  {
    name: 'Add current_tier column',
    sql: `ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS current_tier text DEFAULT 'newcomer';`
  },
  {
    name: 'Add tier_assigned_at column',
    sql: `ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS tier_assigned_at timestamptz DEFAULT now();`
  },
  {
    name: 'Add foreign key constraint',
    sql: `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'teacher_profiles_current_tier_fkey'
  ) THEN
    ALTER TABLE teacher_profiles
    ADD CONSTRAINT teacher_profiles_current_tier_fkey
    FOREIGN KEY (current_tier) REFERENCES teacher_tiers(tier);
  END IF;
END $$;`
  },
  {
    name: 'Update existing teachers',
    sql: `UPDATE teacher_profiles
SET current_tier = 'newcomer',
    tier_assigned_at = COALESCE(tier_assigned_at, now())
WHERE current_tier IS NULL;`
  },
  {
    name: 'Recreate teacher_tier_stats view',
    sql: `DROP VIEW IF EXISTS teacher_tier_stats;

CREATE OR REPLACE VIEW teacher_tier_stats AS
SELECT
  tp.id as teacher_profile_id,
  tp.user_id as teacher_user_id,
  p.full_name as teacher_name,
  p.email as teacher_email,
  COALESCE(tp.current_tier, 'newcomer') as tier,
  COALESCE(tt.tier_name, 'Newcomer') as tier_name,
  COALESCE(tt.tier_icon, '🌱') as tier_icon,
  COALESCE(tt.teacher_hourly_rate, 5.00) as teacher_hourly_rate,
  COALESCE(tt.student_hourly_price, 15.00) as student_hourly_price,
  COALESCE(tt.platform_margin, 10.00) as platform_margin,
  COALESCE(
    (SELECT SUM(duration_minutes) / 60.0
     FROM lessons
     WHERE teacher_id = tp.id AND status = 'completed'),
    0
  ) as hours_taught,
  COALESCE(
    (SELECT AVG(rating)::DECIMAL(3,2)
     FROM reviews
     WHERE teacher_id = tp.id),
    0
  ) as average_rating,
  COALESCE(
    (SELECT COUNT(*)
     FROM lessons
     WHERE teacher_id = tp.id),
    0
  ) as total_lessons,
  COALESCE(
    (SELECT COUNT(*)
     FROM lessons
     WHERE teacher_id = tp.id AND status = 'completed'),
    0
  ) as completed_lessons,
  tp.tier_assigned_at,
  NULL::text as next_auto_tier,
  NULL::integer as hours_to_next_tier,
  COALESCE(
    (SELECT COUNT(DISTINCT student_id)
     FROM lessons
     WHERE teacher_id = tp.id AND status = 'completed'),
    0
  ) as total_students,
  0 as grandfathered_students
FROM teacher_profiles tp
LEFT JOIN profiles p ON tp.user_id = p.id
LEFT JOIN teacher_tiers tt ON tp.current_tier = tt.tier
WHERE tp.approval_status = 'approved';

GRANT SELECT ON teacher_tier_stats TO authenticated, anon;`
  }
];

console.log('🔧 Applying tier system fix via Supabase Management API...\n');

for (const statement of statements) {
  console.log(`${statement.name}...`);

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          query: statement.sql
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`  ❌ Failed: ${error}`);
    } else {
      const result = await response.json();
      console.log(`  ✅ Success`);
    }
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
  }
}

console.log('\n✨ Migration complete! Please refresh your browser.');
