import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRecentLessons() {
  console.log('🔍 Checking recent lessons...\n')

  // Get the 5 most recent lessons
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('id, scheduled_time, status, payment_method, payment_status, teacher_id, stripe_checkout_session_id, created_at, learner_id')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log('📚 Recent Lessons:')
  console.log('================\n')

  lessons.forEach((lesson, index) => {
    console.log(`${index + 1}. Lesson ID: ${lesson.id}`)
    console.log(`   Scheduled: ${lesson.scheduled_time}`)
    console.log(`   Status: ${lesson.status}`)
    console.log(`   Payment Method: ${lesson.payment_method || 'NULL'}`)
    console.log(`   Payment Status: ${lesson.payment_status || 'NULL'}`)
    console.log(`   Learner ID: ${lesson.learner_id}`)
    console.log(`   Teacher ID: ${lesson.teacher_id}`)
    console.log(`   Stripe Session: ${lesson.stripe_checkout_session_id ? lesson.stripe_checkout_session_id.substring(0, 20) + '...' : 'NULL'}`)
    console.log(`   Created: ${lesson.created_at}`)
    console.log('')
  })

  // Check pending bookings
  console.log('\n📋 Recent Pending Bookings:')
  console.log('==========================\n')

  const { data: pending, error: pendingError } = await supabase
    .from('pending_bookings')
    .select('id, status, session_count, total_amount, stripe_session_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (pendingError) {
    console.error('❌ Error:', pendingError)
    return
  }

  pending.forEach((booking, index) => {
    console.log(`${index + 1}. Pending ID: ${booking.id}`)
    console.log(`   Status: ${booking.status}`)
    console.log(`   Sessions: ${booking.session_count}`)
    console.log(`   Total: £${(booking.total_amount / 100).toFixed(2)}`)
    console.log(`   Stripe Session: ${booking.stripe_session_id ? booking.stripe_session_id.substring(0, 20) + '...' : 'NULL'}`)
    console.log(`   Created: ${booking.created_at}`)
    console.log('')
  })
}

checkRecentLessons()
