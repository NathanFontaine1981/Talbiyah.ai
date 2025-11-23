import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { data: lessons, error } = await supabaseClient
    .from('lessons')
    .select('id, created_at, "100ms_room_id", teacher_room_code, student_room_code, status')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }

  return new Response(JSON.stringify(lessons, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  })
})
