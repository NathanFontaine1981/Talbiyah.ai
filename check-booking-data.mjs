import { createClient } from '@supabase/supabase-js';

const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(
  'https://boyrjgivpepjiboekwuu.supabase.co',
  SERVICE_ROLE
);

const pendingId = '433529c0-7e5f-4637-9d37-bbe41b8ab272';

console.log(`Checking pending_booking: ${pendingId}\n`);

const { data, error } = await supabase
  .from('pending_bookings')
  .select('*')
  .eq('id', pendingId)
  .single();

if (error) {
  console.log('❌ Error:', error);
} else if (data) {
  console.log('✅ Found pending_booking:');
  console.log('\nuser_id:', data.user_id);
  console.log('\nbooking_data:', JSON.stringify(data.booking_data, null, 2));

  const bookingData = Array.isArray(data.booking_data)
    ? data.booking_data[0]
    : data.booking_data;

  console.log('\nExtracted booking (first item):');
  console.log('- teacher_id:', bookingData.teacher_id);
  console.log('- subject_id:', bookingData.subject_id);
  console.log('- learner_id:', bookingData.learner_id);
  console.log('- scheduled_time:', bookingData.scheduled_time);
  console.log('- duration:', bookingData.duration);
  console.log('- price:', bookingData.price);
} else {
  console.log('❌ NOT FOUND');
}
