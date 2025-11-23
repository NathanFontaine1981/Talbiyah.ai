import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting to clear held earnings...')

    // Call the database function to clear held earnings
    const { data: clearedCount, error } = await supabaseClient
      .rpc('clear_held_earnings')

    if (error) {
      console.error('Error clearing held earnings:', error)
      throw error
    }

    console.log(`Successfully cleared ${clearedCount} earnings`)

    // If earnings were cleared, notify teachers
    if (clearedCount > 0) {
      // Get teachers who now have cleared earnings
      const { data: teachers, error: teachersError } = await supabaseClient
        .from('teacher_earnings')
        .select(`
          teacher_id,
          amount_earned,
          teacher_profiles!inner(
            user_id,
            profiles!inner(email, full_name)
          )
        `)
        .eq('status', 'cleared')

      if (!teachersError && teachers && teachers.length > 0) {
        // Group by teacher
        const teacherGroups = teachers.reduce((acc: any, earning: any) => {
          const teacherId = earning.teacher_id
          if (!acc[teacherId]) {
            acc[teacherId] = {
              email: earning.teacher_profiles.profiles.email,
              full_name: earning.teacher_profiles.profiles.full_name,
              total_cleared: 0,
              count: 0
            }
          }
          acc[teacherId].total_cleared += Number(earning.amount_earned)
          acc[teacherId].count += 1
          return acc
        }, {})

        // Send notification emails (optional - implement if you have email service)
        console.log('Teachers with newly cleared earnings:', teacherGroups)

        // You can add email notifications here
        // For each teacher in teacherGroups, send email
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        cleared_count: clearedCount,
        message: `Successfully cleared ${clearedCount} held earnings`,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in clear-held-earnings-cron:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
