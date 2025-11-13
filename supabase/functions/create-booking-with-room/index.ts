import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { cart_items, learner_id, promo_code } = await req.json()

    if (!cart_items || cart_items.length === 0) {
      throw new Error('No cart items provided')
    }

    if (!learner_id) {
      throw new Error('Learner ID is required')
    }

    // Check if promo code provides 100% discount
    let isFree = false
    if (promo_code && (promo_code.toUpperCase() === '100HONOR' || promo_code.toUpperCase() === '100OWNER')) {
      const { count } = await supabaseClient
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', user.id)
        .eq('status', 'completed')

      if (count === 0) {
        isFree = true
      }
    }

    // Create 100ms room for each booking
    const HMS_APP_ACCESS_KEY = Deno.env.get('HMS_APP_ACCESS_KEY')
    const HMS_APP_SECRET = Deno.env.get('HMS_APP_SECRET')

    if (!HMS_APP_ACCESS_KEY || !HMS_APP_SECRET) {
      console.error('100ms credentials not configured')
    }

    const createdLessons = []
    const HMS_MANAGEMENT_TOKEN = Deno.env.get('HMS_MANAGEMENT_TOKEN')
    const HMS_TEMPLATE_ID = '6905fb03033903926e627d60' // Your template ID

    for (const item of cart_items) {
      // Create 100ms room
      let roomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`
      let teacherRoomCode = null
      let studentRoomCode = null

      if (HMS_MANAGEMENT_TOKEN) {
        try {
          // Create room using management token
          const roomResponse = await fetch('https://api.100ms.live/v2/rooms', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${HMS_MANAGEMENT_TOKEN}`,
            },
            body: JSON.stringify({
              name: `Lesson-${item.teacher_id}-${item.subject_id}-${Date.now()}`,
              description: `${item.teacher_name} teaching ${item.subject_name}`,
              template_id: HMS_TEMPLATE_ID,
              region: 'in',
            }),
          })

          if (roomResponse.ok) {
            const roomData = await roomResponse.json()
            roomId = roomData.id
            console.log('✅ Room created:', roomId)

            // Wait for room initialization
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Create room codes
            const roomCodesResponse = await fetch(`https://api.100ms.live/v2/room-codes/room/${roomId}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${HMS_MANAGEMENT_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                enabled: true
              })
            })

            if (roomCodesResponse.ok) {
              const roomCodesData = await roomCodesResponse.json()
              console.log('✅ Room codes created:', roomCodesData)

              // Extract room codes
              if (roomCodesData.data && Array.isArray(roomCodesData.data)) {
                roomCodesData.data.forEach(codeObj => {
                  if (codeObj.role === 'host' || codeObj.role === 'teacher' || codeObj.role === 'moderator') {
                    teacherRoomCode = codeObj.code
                  } else if (codeObj.role === 'guest' || codeObj.role === 'student' || codeObj.role === 'participant') {
                    studentRoomCode = codeObj.code
                  }
                })

                // Fallback
                const allCodes = roomCodesData.data
                if (!teacherRoomCode && allCodes.length > 0) teacherRoomCode = allCodes[0].code
                if (!studentRoomCode && allCodes.length > 1) studentRoomCode = allCodes[1].code
                if (!studentRoomCode && allCodes.length === 1) studentRoomCode = allCodes[0].code
              }
            }
          }
        } catch (error) {
          console.error('Error creating 100ms room:', error)
        }
      }

      // Calculate price (0 if free promo code)
      const price = isFree ? 0 : item.price

      // Create lesson
      const { data: lesson, error: lessonError } = await supabaseClient
        .from('lessons')
        .insert({
          learner_id,
          teacher_id: item.teacher_id,
          subject_id: item.subject_id,
          scheduled_time: item.scheduled_time,
          duration_minutes: item.duration_minutes,
          status: 'booked',
          is_free_trial: isFree,
          teacher_rate_at_booking: price,
          platform_fee: 0,
          total_cost_paid: price,
          payment_id: isFree ? null : `payment_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          '100ms_room_id': roomId,
          teacher_room_code: teacherRoomCode,
          student_room_code: studentRoomCode,
        })
        .select()
        .single()

      if (lessonError) throw lessonError

      createdLessons.push(lesson)
    }

    // Clear cart items for this user
    await supabaseClient
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    return new Response(
      JSON.stringify({
        success: true,
        lessons: createdLessons,
        message: `${createdLessons.length} lesson(s) booked successfully`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
