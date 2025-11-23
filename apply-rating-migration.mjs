#!/usr/bin/env node
import { readFileSync } from 'fs';

const PROJECT_REF = 'boyrjgivpepjiboekwuu';
const ACCESS_TOKEN = 'sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff';

console.log('🎯 Applying Teacher Rating System Migration...\n');

try {
  // Read the migration file
  const sql = readFileSync('./supabase/migrations/20251117180000_create_teacher_rating_system.sql', 'utf8');

  console.log('📤 Sending migration to database...');

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({ query: sql })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  console.log('✅ Migration applied successfully!\n');

  // Verify tables were created
  console.log('🔍 Verifying tables...');

  const verifyQuery = `
    SELECT
      table_name,
      (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
    FROM information_schema.tables t
    WHERE table_schema = 'public'
    AND table_name IN ('lesson_feedback', 'teacher_ratings')
    ORDER BY table_name;
  `;

  const verifyResponse = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({ query: verifyQuery })
    }
  );

  if (verifyResponse.ok) {
    const tables = await verifyResponse.json();
    console.log('\n📊 Created Tables:');
    tables.forEach(table => {
      console.log(`   ✓ ${table.table_name} (${table.column_count} columns)`);
    });
  }

  // Verify view was created
  const viewQuery = `
    SELECT COUNT(*) as count
    FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name = 'teacher_rating_summary';
  `;

  const viewResponse = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({ query: viewQuery })
    }
  );

  if (viewResponse.ok) {
    const result = await viewResponse.json();
    if (result[0]?.count > 0) {
      console.log('   ✓ teacher_rating_summary view');
    }
  }

  // Verify functions
  const funcQuery = `
    SELECT routine_name
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN ('should_request_detailed_rating', 'get_teacher_rating_display');
  `;

  const funcResponse = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({ query: funcQuery })
    }
  );

  if (funcResponse.ok) {
    const funcs = await funcResponse.json();
    console.log('\n🔧 Created Functions:');
    funcs.forEach(func => {
      console.log(`   ✓ ${func.routine_name}()`);
    });
  }

  console.log('\n✨ Teacher Rating System is ready to use!\n');
  console.log('📝 Next steps:');
  console.log('   1. Components are created in src/components/');
  console.log('   2. Integrate QuickLessonFeedback into lesson completion flow');
  console.log('   3. Integrate DetailedTeacherRating at milestones');
  console.log('   4. Add TeacherRatingDisplay to teacher profiles');
  console.log('   5. Update teacher listing cards with ratings\n');

} catch (error) {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
}
