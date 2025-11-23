import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://boyrjgivpepjiboekwuu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY'
);

const userId = '46b4ace6-a4da-46b9-aa10-d01c1beefba0';
const sessionId = 'cs_live_b14LhJXonM0tZ00k0FMy7aVwlXGBTF4VBOQT1XTIEcybh3VShhv6IXcUgE';

console.log('🔍 Checking database for stuck payment...\n');

// Check lessons
const { data: lessons, error: lessonsError } = await supabase
  .from('lessons')
  .select('id, learner_id, scheduled_time, duration_minutes, payment_amount, payment_status, status, stripe_checkout_session_id, created_at')
  .eq('learner_id', userId)
  .order('created_at', { ascending: false })
  .limit(5);

console.log('📚 LESSONS:');
if (lessonsError) {
  console.log('  ❌ Error:', lessonsError.message);
} else if (!lessons || lessons.length === 0) {
  console.log('  ❌ No lessons found!');
} else {
  console.log(`  ✅ Found ${lessons.length} lesson(s):`);
  lessons.forEach((lesson, i) => {
    console.log(`\n  ${i + 1}. Lesson ID: ${lesson.id}`);
    console.log(`     Status: ${lesson.status}`);
    console.log(`     Payment Status: ${lesson.payment_status}`);
    console.log(`     Amount: £${lesson.payment_amount}`);
    console.log(`     Duration: ${lesson.duration_minutes} min`);
    console.log(`     Scheduled: ${lesson.scheduled_time}`);
    console.log(`     Stripe Session: ${lesson.stripe_checkout_session_id || 'none'}`);
    console.log(`     Created: ${lesson.created_at}`);
  });
}

console.log('\n\n📋 PENDING BOOKINGS:');

// Check pending_bookings
const { data: bookings, error: bookingsError } = await supabase
  .from('pending_bookings')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(3);

if (bookingsError) {
  console.log('  ❌ Error:', bookingsError.message);
} else if (!bookings || bookings.length === 0) {
  console.log('  ❌ No pending bookings found!');
} else {
  console.log(`  ✅ Found ${bookings.length} pending booking(s):`);
  bookings.forEach((booking, i) => {
    console.log(`\n  ${i + 1}. Booking ID: ${booking.id}`);
    console.log(`     Stripe Session: ${booking.stripe_session_id || 'none'}`);
    console.log(`     Created: ${booking.created_at}`);
  });
}

// Check if session matches
console.log('\n\n🎯 SESSION MATCH:');
const matchingLesson = lessons?.find(l => l.stripe_checkout_session_id === sessionId);
const matchingBooking = bookings?.find(b => b.stripe_session_id === sessionId);

if (matchingLesson) {
  console.log(`  ✅ Found matching lesson: ${matchingLesson.id}`);
  console.log(`     Status: ${matchingLesson.status}`);
  console.log(`     Payment Status: ${matchingLesson.payment_status}`);
} else if (matchingBooking) {
  console.log(`  ⚠️  Found matching pending_booking but NO lesson created!`);
  console.log(`     Booking ID: ${matchingBooking.id}`);
} else {
  console.log(`  ❌ No matching records found for session: ${sessionId}`);
}

console.log('\n\n📊 SUMMARY:');
console.log(`  User ID: ${userId}`);
console.log(`  Session ID: ${sessionId}`);
console.log(`  Lessons in DB: ${lessons?.length || 0}`);
console.log(`  Pending Bookings: ${bookings?.length || 0}`);
console.log(`  Matching Record: ${matchingLesson ? 'Lesson (needs update)' : matchingBooking ? 'Pending Booking (needs lesson)' : 'NONE (critical!)'}`);
