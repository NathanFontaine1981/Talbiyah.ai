import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

// You need to get an auth token first - use the one from your browser's network tab
const authToken = 'YOUR_AUTH_TOKEN_HERE'; // Get this from browser DevTools

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCreditBooking() {
  console.log('🧪 Testing credit-based booking...\n');

  // First, let's check the user's credits
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    console.log('❌ Not authenticated. Please sign in first.');
    console.log('   Run this in your browser console and paste the token:');
    console.log('   localStorage.getItem("sb-boyrjgivpepjiboekwuu-auth-token")');
    return;
  }

  const userId = session.user.id;
  console.log('👤 User ID:', userId);

  // Check credits
  const { data: credits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  console.log('💳 Current credits:', credits);

  // Test booking - find an available teacher
  const { data: teachers } = await supabase
    .from('teacher_profiles')
    .select('user_id')
    .eq('status', 'active')
    .limit(1);

  if (!teachers || teachers.length === 0) {
    console.log('❌ No active teachers found');
    return;
  }

  const testBooking = [{
    teacher_id: teachers[0].user_id,
    date: '2025-12-01',
    time: '10:00',
    subject: 'quran',
    duration: 60,
    price: 15,
    use_free_session: false
  }];

  console.log('\n📞 Calling initiate-booking-checkout with credits...\n');

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/initiate-booking-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({
        bookings: testBooking
      })
    });

    const result = await response.json();
    console.log('✅ Response:', JSON.stringify(result, null, 2));

    if (result.paid_with_credits) {
      console.log('\n🎉 SUCCESS! Booking was paid with credits!');
      console.log('   Credits used:', result.credits_used);
      console.log('   New balance:', result.new_credit_balance);
    } else if (result.checkout_url) {
      console.log('\n⚠️ Function returned Stripe checkout instead of using credits');
      console.log('   Checkout URL:', result.checkout_url);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCreditBooking().catch(console.error);
