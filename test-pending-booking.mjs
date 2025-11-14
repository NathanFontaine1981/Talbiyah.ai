import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://boyrjgivpepjiboekwuu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY'  // service role
);

console.log('Testing pending_bookings insert...');

const testData = {
  user_id: 'c8a77dba-a666-4a30-87df-a4c26043b6a4',
  booking_data: [{ test: 'data' }],
  total_amount: 1500,
  session_count: 1,
  status: 'pending'
};

const { data, error } = await supabase
  .from('pending_bookings')
  .insert(testData)
  .select();

console.log('Result:', { data, error });

if (data) {
  console.log('✅ SUCCESS - Pending booking created:', data[0].id);

  // Clean up
  await supabase
    .from('pending_bookings')
    .delete()
    .eq('id', data[0].id);
  console.log('✅ Test record cleaned up');
} else {
  console.log('❌ FAILED:', error);
}
