import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTMxNDUxNiwiZXhwIjoyMDQ0ODkwNTE2fQ.CrjnhKHVJJNaUIXmZnHJTe6LZP_cKW4yQEa1JHY0Kak'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🧪 Testing Google Workspace Email...\n')

try {
  const { data, error } = await supabase.functions.invoke('send-booking-notification', {
    body: {
      teacher_email: 'nathanlfontaine@gmail.com',
      teacher_name: 'Nathan Fontaine',
      student_name: 'Ahmed Ali',
      subject_name: 'Quran Recitation',
      scheduled_date: '2025-11-15',
      scheduled_time: '10:00 AM',
      duration_minutes: 60,
      booking_id: 'test-google-workspace-123'
    }
  })

  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }

  console.log('✅ Success:', data)
  console.log('\n📧 Check nathanlfontaine@gmail.com inbox for the test email!')

} catch (err) {
  console.error('❌ Exception:', err.message)
  process.exit(1)
}
