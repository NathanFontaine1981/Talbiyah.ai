import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔧 FIXING ORPHANED CREDIT LESSONS\n');

// Step 1: Find user who has the credits deducted (should have credit_balance)
const { data: usersWithCredits } = await supabase
  .from('profiles')
  .select('id, email, full_name, credit_balance')
  .gte('credit_balance', 0)
  .order('credit_balance', { ascending: false })
  .limit(20);

console.log('💰 Users with credit balances:');
if (usersWithCredits && usersWithCredits.length > 0) {
  usersWithCredits.forEach((user, i) => {
    console.log(`${i + 1}. ${user.full_name || 'Unnamed'} (${user.email})`);
    console.log(`   Balance: ${user.credit_balance} credits`);
    console.log(`   ID: ${user.id}\n`);
  });
} else {
  console.log('⚠️  No users found with credit balances');
}

// Step 2: Check transaction history to find who bought/used credits
const { data: transactions } = await supabase
  .from('credit_transactions')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);

console.log('\n💳 Recent credit transactions:');
if (transactions && transactions.length > 0) {
  for (const txn of transactions) {
    console.log(`Type: ${txn.transaction_type}`);
    console.log(`Amount: ${txn.amount}`);
    console.log(`User ID: ${txn.user_id}`);
    console.log(`Created: ${txn.created_at}`);
    console.log(`Description: ${txn.description || 'N/A'}\n`);

    // Get user info
    const { data: user } = await supabase
      .from('profiles')
      .select('email, full_name, credit_balance')
      .eq('id', txn.user_id)
      .single();

    if (user) {
      console.log(`  User: ${user.full_name} (${user.email})`);
      console.log(`  Current balance: ${user.credit_balance}\n`);
    }
  }
}

// Step 3: Get credit lessons again
const { data: creditLessons } = await supabase
  .from('lessons')
  .select('id, learner_id, teacher_id, scheduled_time, status, payment_method, created_at')
  .eq('payment_method', 'credits')
  .order('created_at', { ascending: false });

console.log(`\n📚 Found ${creditLessons?.length || 0} credit lessons`);

// Step 4: Identify the user who should own these lessons
// (User who has "deduct" transactions matching the lesson count)
const deductTransactions = transactions?.filter(t => t.transaction_type === 'deduct') || [];

if (deductTransactions.length > 0) {
  // Find the user with the most recent deduct transactions
  const mostRecentDeduct = deductTransactions[0];
  const parentId = mostRecentDeduct.user_id;

  console.log(`\n✅ Identified parent who used credits: ${parentId}`);

  const { data: parent } = await supabase
    .from('profiles')
    .select('email, full_name, credit_balance')
    .eq('id', parentId)
    .single();

  if (parent) {
    console.log(`   ${parent.full_name} (${parent.email})`);
    console.log(`   Current balance: ${parent.credit_balance} credits\n`);

    // Check if this parent has any learners
    const { data: existingLearners } = await supabase
      .from('learners')
      .select('id, name, parent_id')
      .eq('parent_id', parentId);

    console.log(`   Has ${existingLearners?.length || 0} existing learner(s)`);

    // Option A: Use existing learner
    if (existingLearners && existingLearners.length > 0) {
      const learnerId = existingLearners[0].id;
      console.log(`\n   📌 Will assign all credit lessons to learner: ${existingLearners[0].name} (${learnerId})`);

      // UPDATE all credit lessons to use this learner_id
      if (creditLessons && creditLessons.length > 0) {
        console.log(`\n   🔄 Updating ${creditLessons.length} lessons...`);

        const { error: updateError } = await supabase
          .from('lessons')
          .update({ learner_id: learnerId })
          .in('id', creditLessons.map(l => l.id));

        if (updateError) {
          console.error('   ❌ Update failed:', updateError);
        } else {
          console.log('   ✅ Successfully updated all credit lessons!');
        }
      }
    } else {
      // Option B: Create new learner
      console.log(`\n   📝 Creating new learner for parent...`);

      const { data: newLearner, error: learnerError } = await supabase
        .from('learners')
        .insert({
          parent_id: parentId,
          name: parent.full_name || 'Student',
          gamification_points: 0
        })
        .select('id, name')
        .single();

      if (learnerError || !newLearner) {
        console.error('   ❌ Failed to create learner:', learnerError);
      } else {
        console.log(`   ✅ Created learner: ${newLearner.name} (${newLearner.id})`);

        // UPDATE all credit lessons to use this new learner_id
        if (creditLessons && creditLessons.length > 0) {
          console.log(`\n   🔄 Updating ${creditLessons.length} lessons...`);

          const { error: updateError } = await supabase
            .from('lessons')
            .update({ learner_id: newLearner.id })
            .in('id', creditLessons.map(l => l.id));

          if (updateError) {
            console.error('   ❌ Update failed:', updateError);
          } else {
            console.log('   ✅ Successfully updated all credit lessons!');
          }
        }
      }
    }
  }
}

console.log('\n✅ Fix complete!');
