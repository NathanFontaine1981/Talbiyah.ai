import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCredits() {
  console.log('🔍 Finding recent purchase...\n');

  // Get the most recent purchase
  const { data: purchase, error: purchaseError } = await supabase
    .from('credit_purchases')
    .select('*')
    .order('purchase_date', { ascending: false })
    .limit(1)
    .single();

  if (purchaseError || !purchase) {
    console.error('❌ Could not find purchase:', purchaseError);
    return;
  }

  console.log('✅ Found purchase:');
  console.log('   Purchase ID:', purchase.id);
  console.log('   User ID:', purchase.user_id);
  console.log('   Credits:', purchase.credits_added);
  console.log('   Amount:', purchase.pack_price);
  console.log('');

  // Check if credits already exist
  const { data: existingCredits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', purchase.user_id)
    .maybeSingle();

  if (existingCredits) {
    console.log('⚠️  User already has credits:');
    console.log('   Current balance:', existingCredits.credits_remaining);
    console.log('   Adding', purchase.credits_added, 'more credits...\n');
  } else {
    console.log('💳 Creating new credit account for user...\n');
  }

  // Call the add_user_credits RPC function
  console.log('📞 Calling add_user_credits RPC...');
  const { data: newBalance, error: rpcError } = await supabase
    .rpc('add_user_credits', {
      p_user_id: purchase.user_id,
      p_credits: purchase.credits_added,
      p_purchase_id: purchase.id,
      p_notes: `Manual credit addition for purchase ${purchase.id}`
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
  console.log('\n🎉 Done! User now has', newBalance, 'credits.');
}

addCredits().catch(console.error);
