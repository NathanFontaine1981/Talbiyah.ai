import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔍 Finding users who own credit lessons...\n');

// 1. Get ALL credit lessons
const { data: creditLessons } = await supabase
  .from('lessons')
  .select('id, learner_id, scheduled_time, status, payment_method')
  .eq('payment_method', 'credits')
  .order('created_at', { ascending: false });

console.log(`💳 Found ${creditLessons?.length || 0} credit lessons\n`);

if (creditLessons && creditLessons.length > 0) {
  // Get unique learner IDs
  const learnerIds = [...new Set(creditLessons.map(l => l.learner_id))];
  console.log(`📚 Unique learner IDs: ${learnerIds.length}\n`);

  // Get learner info and their parents
  for (const learnerId of learnerIds) {
    console.log(`Looking up learner ID: ${learnerId}`);

    const { data: learner, error: learnerError } = await supabase
      .from('learners')
      .select('id, name, parent_id')
      .eq('id', learnerId)
      .maybeSingle();

    if (learnerError) {
      console.log(`  ❌ Error: ${learnerError.message}\n`);
      continue;
    }

    if (!learner) {
      console.log(`  ⚠️  Learner not found in learners table!\n`);

      // This is the problem! The lesson has a learner_id but that learner doesn't exist
      // Let's check what lessons reference this ID
      const orphanedLessons = creditLessons.filter(l => l.learner_id === learnerId);
      console.log(`  📖 ${orphanedLessons.length} lesson(s) reference this non-existent learner\n`);
      continue;
    }

    console.log(`✅ Learner: ${learner.name || 'Unnamed'} (${learner.id})`);
    console.log(`  parent_id: ${learner.parent_id || 'NULL'}`);

    // Get parent info
    if (learner.parent_id) {
      const { data: parent } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', learner.parent_id)
        .single();

      if (parent) {
        console.log(`  👤 Parent: ${parent.full_name || 'Unnamed'} (${parent.email})`);

        // Count lessons for this learner
        const lessonCount = creditLessons.filter(l => l.learner_id === learnerId).length;
        console.log(`  📖 Has ${lessonCount} credit lesson(s)\n`);
      }
    } else {
      console.log(`  ⚠️  No parent_id set!\n`);
    }
  }
}

// Also check who has bought credits
console.log('\n💰 Checking credit balances...\n');
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, email, full_name, credit_balance')
  .gt('credit_balance', 0)
  .order('credit_balance', { ascending: false });

if (profiles && profiles.length > 0) {
  console.log(`Found ${profiles.length} users with credits:\n`);
  profiles.forEach((profile, i) => {
    console.log(`${i + 1}. ${profile.full_name || 'Unnamed'} (${profile.email})`);
    console.log(`   Balance: ${profile.credit_balance} credits`);
    console.log(`   ID: ${profile.id}\n`);
  });
}
