import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDeductCredits() {
  console.log('🧪 Testing deduct_user_credits RPC function...\n');

  // Find the user with credits
  const { data: userCredits } = await supabase
    .from('user_credits')
    .select('user_id, credits_remaining')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!userCredits) {
    console.log('❌ No user credits found');
    return;
  }

  console.log('👤 Testing with user:', userCredits.user_id);
  console.log('💳 Current balance:', userCredits.credits_remaining);

  // Try to deduct 0.5 credits (30 minute lesson)
  console.log('\n📞 Calling deduct_user_credits RPC...');
  console.log('   Deducting: 0.5 credits');

  const { data: newBalance, error: deductError } = await supabase
    .rpc('deduct_user_credits', {
      p_user_id: userCredits.user_id,
      p_credits: 0.5,
      p_lesson_id: null,
      p_notes: 'Test deduction'
    });

  if (deductError) {
    console.error('❌ RPC call failed:');
    console.error('   Error code:', deductError.code);
    console.error('   Error message:', deductError.message);
    console.error('   Error details:', JSON.stringify(deductError, null, 2));
    return;
  }

  console.log('✅ Credits deducted successfully!');
  console.log('   New balance:', newBalance);

  // Add the credits back
  console.log('\n📞 Adding credits back...');
  const { data: restoredBalance, error: addError } = await supabase
    .rpc('add_user_credits', {
      p_user_id: userCredits.user_id,
      p_credits: 0.5,
      p_purchase_id: null,
      p_notes: 'Test credit restoration'
    });

  if (addError) {
    console.error('❌ Failed to restore credits:', addError);
    return;
  }

  console.log('✅ Credits restored!');
  console.log('   Final balance:', restoredBalance);
}

testDeductCredits().catch(console.error);
