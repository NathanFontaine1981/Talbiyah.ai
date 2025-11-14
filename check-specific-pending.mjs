import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://boyrjgivpepjiboekwuu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY' // Service role
);

const pendingId = '433529c0-7e5f-4637-9d37-bbe41b8ab272';

console.log(`Checking for pending_booking: ${pendingId}\n`);

const { data, error } = await supabase
  .from('pending_bookings')
  .select('*')
  .eq('id', pendingId)
  .single();

if (error) {
  console.log('❌ Error:', error);
} else if (data) {
  console.log('✅ Found pending_booking:');
  console.log(JSON.stringify(data, null, 2));
} else {
  console.log('❌ NOT FOUND - pending_booking does not exist');
}
