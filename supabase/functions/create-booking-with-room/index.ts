import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getHMSManagementToken } from '../_shared/hms.ts'
import { getCorsHeaders, securityHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const responseHeaders = {
    ...corsHeaders,
    ...securityHeaders,
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: responseHeaders })
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

    const { cart_items, learner_id, promo_code, promo_code_id, promo_discount, payment_method } = await req.json()

    if (!cart_items || cart_items.length === 0) {
      throw new Error('No cart items provided')
    }

    if (!learner_id) {
      throw new Error('Learner ID is required')
    }

    // Check if paying with credits
    const isCreditsPayment = payment_method === 'credits'

    // Check if promo code provides 100% discount
    let isFree = false
    let promoCodeUsed = null
    let promoCodeIdToUse = promo_code_id || null
    let promoDiscountAmount = promo_discount || 0

    if (promo_code) {
      // Check legacy codes first for backward compatibility
      if (promo_code.toUpperCase() === '100HONOR' || promo_code.toUpperCase() === '100OWNER') {
        // First get learner IDs for this parent/user
        const { data: learners } = await supabaseClient
          .from('learners')
          .select('id')
          .eq('parent_id', user.id)

        const learnerIds = learners?.map(l => l.id) || []

        // Check if any learner has completed lessons
        let hasCompletedLessons = false
        if (learnerIds.length > 0) {
          const { count } = await supabaseClient
            .from('lessons')
            .select('id', { count: 'exact', head: true })
            .in('learner_id', learnerIds)
            .eq('status', 'completed')

          hasCompletedLessons = (count || 0) > 0
        }

        if (!hasCompletedLessons) {
          isFree = true
          promoCodeUsed = promo_code.toUpperCase()
          console.log(`✅ Promo code ${promoCodeUsed} applied - FREE lesson`)
        }
      } else if (promoDiscountAmount > 0) {
        // Use the discount already calculated on the frontend
        isFree = promoDiscountAmount >= cart_items.reduce((sum: number, item: any) => sum + item.price, 0)
        promoCodeUsed = promo_code.toUpperCase()
        console.log(`✅ Promo code ${promoCodeUsed} applied - £${promoDiscountAmount} discount`)
      }
    }

    // Create 100ms room for each booking
    const createdLessons = []
    const HMS_TEMPLATE_ID = '6905fb03033903926e627d60' // Your template ID

    // Generate 100ms management token dynamically
    let HMS_MANAGEMENT_TOKEN: string | null = null
    try {
      HMS_MANAGEMENT_TOKEN = await getHMSManagementToken()
      console.log('✅ Generated fresh 100ms token automatically')
    } catch (tokenError) {
      console.error('❌ Failed to generate HMS token:', tokenError)
    }

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
              region: 'eu',  // EU region for UK users - lowest latency
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
      const price = isFree ? 0 : (isCreditsPayment ? 0 : item.price)
      const originalPrice = item.price

      // Determine payment status - use standard values that pass database check constraint
      // Valid values: 'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
      let paymentStatus = 'pending'
      let paymentMethod = 'stripe'
      if (isFree) {
        paymentStatus = 'completed'  // Free lessons are considered completed
        paymentMethod = 'promo_code'
      } else if (isCreditsPayment) {
        paymentStatus = 'completed'  // Credit payments are considered completed
        paymentMethod = 'credits'
      }

      // Create lesson with detailed payment tracking
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
          teacher_rate_at_booking: originalPrice,
          platform_fee: 0,
          total_cost_paid: price,
          payment_id: isFree ? `promo_${promoCodeUsed}_${Date.now()}` : (isCreditsPayment ? `credits_${Date.now()}_${Math.random().toString(36).substring(7)}` : null),
          payment_status: paymentStatus,
          '100ms_room_id': roomId,
          teacher_room_code: teacherRoomCode,
          student_room_code: studentRoomCode,
        })
        .select()
        .single()

      if (lessonError) throw lessonError

      // Log the booking for audit trail
      console.log(`📝 Lesson created: ${lesson.id}`, {
        payment_method: paymentMethod,
        original_price: originalPrice,
        paid: price,
        promo_code: promoCodeUsed,
        is_credits: isCreditsPayment
      })

      // Record promo code usage if applicable
      if (promoCodeIdToUse && promoDiscountAmount > 0) {
        try {
          await supabaseClient.rpc('use_promo_code', {
            p_promo_code_id: promoCodeIdToUse,
            p_user_id: user.id,
            p_lesson_id: lesson.id,
            p_discount_applied: promoDiscountAmount / cart_items.length // Split discount across items
          })
          console.log(`✅ Promo code usage recorded for lesson ${lesson.id}`)
        } catch (promoError) {
          // Don't fail the booking if promo tracking fails
          console.error('❌ Failed to record promo code usage:', promoError)
        }
      }

      createdLessons.push(lesson)

      // Send confirmation email to student/parent
      try {
        // Get learner info for name
        const { data: learnerData } = await supabaseClient
          .from('learners')
          .select('name, parent_id')
          .eq('id', learner_id)
          .single()

        // Use the authenticated user's email (from auth session, not profiles table)
        // profiles.email is often empty, but user.email is always available
        const studentEmail = user.email

        // Get student name from profiles
        const { data: parentProfile } = await supabaseClient
          .from('profiles')
          .select('full_name')
          .eq('id', learnerData?.parent_id || user.id)
          .single()

        const studentName = learnerData?.name || parentProfile?.full_name || 'Student'

        console.log(`📧 Sending booking confirmation to: ${studentEmail} (${studentName})`)

        if (studentEmail) {
          // Send using send-notification-email (more reliable)
          const emailResponse = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                type: 'student_booking_confirmation',
                recipient_email: studentEmail,
                recipient_name: studentName,
                data: {
                  teacher_name: item.teacher_name,
                  subject: item.subject_name,
                  scheduled_time: item.scheduled_time,
                  duration_minutes: item.duration_minutes
                }
              }),
            }
          )

          if (emailResponse.ok) {
            console.log('✅ Confirmation email sent to', studentEmail)
          } else {
            console.error('❌ Failed to send confirmation email:', await emailResponse.text())
          }
        } else {
          console.error('❌ No email found for user:', user.id)
        }

        // Also notify the teacher about the new booking
        const { data: teacherProfile } = await supabaseClient
          .from('teacher_profiles')
          .select('user_id')
          .eq('id', item.teacher_id)
          .single()

        if (teacherProfile?.user_id) {
          const { data: teacherUser } = await supabaseClient
            .from('profiles')
            .select('email, full_name')
            .eq('id', teacherProfile.user_id)
            .single()

          if (teacherUser?.email) {
            // Send teacher notification email
            const teacherEmailPayload = {
              type: 'teacher_new_booking',
              recipient_email: teacherUser.email,
              recipient_name: teacherUser.full_name || 'Teacher',
              data: {
                student_name: learnerData?.name || 'Student',
                subject: item.subject_name,
                scheduled_time: item.scheduled_time,
                duration_minutes: item.duration_minutes,
              }
            }

            const teacherEmailResponse = await fetch(
              `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification-email`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                },
                body: JSON.stringify(teacherEmailPayload),
              }
            )

            if (teacherEmailResponse.ok) {
              console.log('✅ Teacher notification email sent to', teacherUser.email)
            } else {
              console.error('❌ Failed to send teacher notification:', await teacherEmailResponse.text())
            }
          }
        }
      } catch (emailError) {
        // Don't fail the booking if email fails
        console.error('❌ Email notification error (non-blocking):', emailError)
      }
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
        headers: { ...responseHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
