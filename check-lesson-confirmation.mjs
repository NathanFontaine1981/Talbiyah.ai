import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.G3e_1zKCR-Mm_LQ__yJGIKZGHg62YNRiYGLlPWCVcxw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLessonStatus() {
  console.log('🔍 Checking lesson confirmation status...\n')

  // Get recent lessons
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('id, scheduled_time, status, confirmation_status, teacher_acknowledgment_message, acknowledged_at, teacher_id, learner_id')
    .eq('status', 'booked')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log('📚 Recent Booked Lessons:')
  console.log('========================\n')

  lessons.forEach((lesson, index) => {
    console.log(`${index + 1}. Lesson ID: ${lesson.id}`)
    console.log(`   Scheduled: ${lesson.scheduled_time}`)
    console.log(`   Status: ${lesson.status}`)
    console.log(`   Confirmation Status: ${lesson.confirmation_status || 'NULL'}`)
    console.log(`   Acknowledged At: ${lesson.acknowledged_at || 'NULL'}`)
    console.log(`   Teacher Message: ${lesson.teacher_acknowledgment_message || 'NULL'}`)
    console.log(`   Teacher ID: ${lesson.teacher_id}`)
    console.log(`   Learner ID: ${lesson.learner_id}`)
    console.log('')
  })
}

checkLessonStatus()
