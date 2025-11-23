import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addCredits() {
  console.log('🔍 Finding most recent user...\n');

  // Get the most recent user from profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .order('created_at', { ascending: false })
    .limit(5);

  if (profileError || !profiles || profiles.length === 0) {
    console.error('❌ Could not find users:', profileError);
    return;
  }

  console.log('📋 Recent users:');
  profiles.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.full_name} (${p.email})`);
  });
  console.log('');

  // Use the most recent user
  const targetUser = profiles[0];
  const creditsToAdd = 8;

  console.log(`💳 Adding ${creditsToAdd} credits to: ${targetUser.full_name} (${targetUser.email})\n`);

  // Check if user already has credits
  const { data: existingCredits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', targetUser.id)
    .maybeSingle();

  if (existingCredits) {
    console.log('⚠️  User already has credits:');
    console.log('   Current balance:', existingCredits.credits_remaining);
    console.log(`   Adding ${creditsToAdd} more credits...\n`);
  } else {
    console.log('💳 Creating new credit account for user...\n');
  }

  // Call the add_user_credits RPC function
  console.log('📞 Calling add_user_credits RPC...');
  const { data: newBalance, error: rpcError } = await supabase
    .rpc('add_user_credits', {
      p_user_id: targetUser.id,
      p_credits: creditsToAdd,
      p_purchase_id: null,
      p_notes: 'Manual credit addition - fixing missing Stripe webhook credits'
    });

  if (rpcError) {
    console.error('❌ RPC call failed:');
    console.error('   Error code:', rpcError.code);
    console.error('   Error message:', rpcError.message);
    console.error('   Error details:', JSON.stringify(rpcError, null, 2));
    return;
  }

  console.log('✅ Credits added successfully!');
  console.log('   New balance:', newBalance);
  console.log(`\n🎉 Done! ${targetUser.full_name} now has ${newBalance} credits.`);

  // Verify by checking user_credits table
  console.log('\n🔍 Verifying in database...');
  const { data: verification } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', targetUser.id)
    .single();

  if (verification) {
    console.log('✅ Verified:');
    console.log('   Credits Remaining:', verification.credits_remaining);
    console.log('   Total Purchased:', verification.total_credits_purchased);
    console.log('   Total Used:', verification.total_credits_used);
  }
}

addCredits().catch(console.error);
