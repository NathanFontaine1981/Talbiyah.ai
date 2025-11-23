import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCredits() {
  console.log('🔍 Checking user credits in database...\n');

  // Get all user credits
  const { data: allCredits, error } = await supabase
    .from('user_credits')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching credits:', error);
    return;
  }

  if (!allCredits || allCredits.length === 0) {
    console.log('⚠️  No user credits found in database!');
    return;
  }

  console.log(`✅ Found ${allCredits.length} user(s) with credits:\n`);

  for (const credit of allCredits) {
    // Get user profile info
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', credit.user_id)
      .single();

    console.log(`👤 User: ${profile?.full_name || 'Unknown'} (${profile?.email || 'No email'})`);
    console.log(`   User ID: ${credit.user_id}`);
    console.log(`   Credits Remaining: ${credit.credits_remaining}`);
    console.log(`   Total Purchased: ${credit.total_credits_purchased}`);
    console.log(`   Total Used: ${credit.total_credits_used}`);
    console.log(`   Created: ${new Date(credit.created_at).toLocaleString()}`);
    console.log(`   Updated: ${new Date(credit.updated_at).toLocaleString()}\n`);
  }

  // Get recent credit purchases
  console.log('\n💳 Recent credit purchases:\n');
  const { data: purchases } = await supabase
    .from('credit_purchases')
    .select('*')
    .order('purchase_date', { ascending: false })
    .limit(5);

  if (purchases && purchases.length > 0) {
    for (const purchase of purchases) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', purchase.user_id)
        .single();

      console.log(`   ${profile?.email || 'Unknown'}: ${purchase.credits_added} credits for £${purchase.pack_price}`);
      console.log(`   Purchase Date: ${new Date(purchase.purchase_date).toLocaleString()}`);
      console.log(`   Stripe Session: ${purchase.stripe_checkout_session_id}\n`);
    }
  } else {
    console.log('   No credit purchases found');
  }
}

checkCredits().catch(console.error);
