import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getHMSManagementToken } from '../_shared/hms.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature, x-requested-with',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    })
  }

  console.log('🎫 STRIPE WEBHOOK RECEIVED:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(req.headers.entries())
  });

  try {
    const body = await req.text()
    console.log('📦 Raw body length:', body.length);

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')

    if (!stripeKey) {
      console.error('❌ STRIPE_SECRET_KEY not found in environment');
      throw new Error('Stripe secret key not found')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const event = JSON.parse(body)

    console.log('📨 Webhook event:', {
      type: event.type,
      id: event.id,
      livemode: event.livemode,
      created: event.created
    });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('💳 Payment succeeded:', {
          sessionId: session.id,
          metadata: session.metadata,
          fullSession: JSON.stringify(session, null, 2)
        });

        // Check if this is a credit pack purchase
        const packType = session.metadata?.pack_type
        const pendingBookingId = session.metadata?.pending_booking_id

        if (packType) {
          // Handle credit pack purchase
          console.log('🎫 CREDIT PACK PURCHASE DETECTED');
          console.log('   Pack type:', packType);
          console.log('   Session ID:', session.id);
          console.log('   Payment status:', session.payment_status);
          console.log('   Metadata:', JSON.stringify(session.metadata, null, 2));

          const userId = session.metadata.user_id
          const credits = parseInt(session.metadata.credits)
          const amount = session.amount_total / 100 // Convert from pence to pounds

          console.log('   User ID:', userId);
          console.log('   Credits:', credits);
          console.log('   Amount:', amount);

          // Create purchase record
          console.log('📝 Inserting purchase record...');
          const { data: purchase, error: purchaseError } = await supabaseClient
            .from('credit_purchases')
            .insert({
              user_id: userId,
              pack_size: credits,
              pack_price: amount,
              credits_added: credits,
              stripe_payment_id: session.payment_intent,
              stripe_checkout_session_id: session.id,
              purchase_date: new Date().toISOString(),
              refund_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            })
            .select()
            .single()

          if (purchaseError) {
            console.error('❌ FAILED TO CREATE PURCHASE RECORD');
            console.error('   Error code:', purchaseError.code);
            console.error('   Error message:', purchaseError.message);
            console.error('   Error details:', JSON.stringify(purchaseError, null, 2));
            break
          }

          console.log('✅ Purchase record created successfully!');
          console.log('   Purchase ID:', purchase.id);

          // Add credits to user balance using the database function
          console.log('💳 Adding credits to user balance...');
          const { data: newBalance, error: creditsError } = await supabaseClient
            .rpc('add_user_credits', {
              p_user_id: userId,
              p_credits: credits,
              p_purchase_id: purchase.id,
              p_notes: `Purchased ${packType} pack (${credits} credits)`
            })

          if (creditsError) {
            console.error('❌ FAILED TO ADD CREDITS');
            console.error('   Error code:', creditsError.code);
            console.error('   Error message:', creditsError.message);
            console.error('   Error details:', JSON.stringify(creditsError, null, 2));
          } else {
            console.log('✅ Credits added successfully!');
            console.log('   New balance:', newBalance);
            console.log('🎉 CREDIT PACK PURCHASE COMPLETE!');
          }

          break
        }

        if (!pendingBookingId) {
          console.error('❌ No pending_booking_id in metadata!', {
            metadata: session.metadata,
            allKeys: Object.keys(session.metadata || {})
          });
          break
        }

        console.log('✅ Found pending_booking_id:', pendingBookingId);

        // Fetch pending booking
        const { data: pendingBooking, error: fetchError } = await supabaseClient
          .from('pending_bookings')
          .select('*')
          .eq('id', pendingBookingId)
          .single()

        if (fetchError || !pendingBooking) {
          console.error('❌ Failed to fetch pending booking:', fetchError);
          break
        }

        console.log('📋 Pending booking found:', {
          id: pendingBooking.id,
          bookingsCount: pendingBooking.booking_data?.length || 0
        });

        if (!pendingBooking.booking_data || !Array.isArray(pendingBooking.booking_data)) {
          console.error('❌ Invalid booking_data');
          break
        }

        // Generate fresh 100ms token automatically (no more manual renewal!)
        let HMS_MANAGEMENT_TOKEN: string | null = null
        try {
          HMS_MANAGEMENT_TOKEN = await getHMSManagementToken()
          console.log('✅ Generated fresh 100ms token automatically')
        } catch (error) {
          console.error('❌ Failed to generate HMS token:', error.message)
        }
        const HMS_TEMPLATE_ID = Deno.env.get('HMS_TEMPLATE_ID') || '6905fb03033903926e627d60'

        const createdLessons = []

        for (const bookingData of pendingBooking.booking_data) {
          console.log('🚀 Creating lesson:', {
            teacher: bookingData.teacher_id,
            date: bookingData.date,
            time: bookingData.time,
            subject: bookingData.subject
          });

          // Create 100ms room
          let roomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`
          let teacherRoomCode = null
          let studentRoomCode = null

          if (HMS_MANAGEMENT_TOKEN) {
            try {
              const roomResponse = await fetch('https://api.100ms.live/v2/rooms', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${HMS_MANAGEMENT_TOKEN}`,
                },
                body: JSON.stringify({
                  name: `Lesson-${bookingData.teacher_id}-${bookingData.subject}-${Date.now()}`,
                  description: `Paid lesson`,
                  template_id: HMS_TEMPLATE_ID,
                  region: 'in',
                }),
              })

              if (roomResponse.ok) {
                const roomData = await roomResponse.json()
                roomId = roomData.id
                console.log('✅ Room created:', roomId)

                await new Promise(resolve => setTimeout(resolve, 2000))

                const roomCodesResponse = await fetch(`https://api.100ms.live/v2/room-codes/room/${roomId}`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${HMS_MANAGEMENT_TOKEN}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ enabled: true })
                })

                if (roomCodesResponse.ok) {
                  const roomCodesData = await roomCodesResponse.json()
                  console.log('✅ Room codes API response:', JSON.stringify(roomCodesData, null, 2))

                  if (roomCodesData.data && Array.isArray(roomCodesData.data)) {
                    console.log('📋 Processing room codes:', roomCodesData.data.length)
                    roomCodesData.data.forEach(codeObj => {
                      console.log('  - Role:', codeObj.role, 'Code:', codeObj.code)
                      if (codeObj.role === 'host' || codeObj.role === 'teacher' || codeObj.role === 'moderator') {
                        teacherRoomCode = codeObj.code
                        console.log('  ✓ Assigned as teacher code')
                      } else if (codeObj.role === 'guest' || codeObj.role === 'student' || codeObj.role === 'participant') {
                        studentRoomCode = codeObj.code
                        console.log('  ✓ Assigned as student code')
                      }
                    })

                    const allCodes = roomCodesData.data
                    if (!teacherRoomCode && allCodes.length > 0) {
                      teacherRoomCode = allCodes[0].code
                      console.log('  ⚠️ No teacher role found, using first code:', teacherRoomCode)
                    }
                    if (!studentRoomCode && allCodes.length > 1) {
                      studentRoomCode = allCodes[1].code
                      console.log('  ⚠️ No student role found, using second code:', studentRoomCode)
                    }
                    if (!studentRoomCode && allCodes.length === 1) {
                      studentRoomCode = allCodes[0].code
                      console.log('  ⚠️ Only one code, using it for both:', studentRoomCode)
                    }
                  }
                  console.log('🎯 Final codes - Teacher:', teacherRoomCode, 'Student:', studentRoomCode)
                } else {
                  console.error('❌ Room codes response failed:', roomCodesResponse.status, await roomCodesResponse.text())
                }
              }
            } catch (error) {
              console.error('Error creating 100ms room:', error)
            }
          }

          // Combine date and time into scheduled_time
          const scheduledTime = `${bookingData.date}T${bookingData.time}:00`

          // Create lesson (exactly like free sessions do)
          const { data: lesson, error: lessonError} = await supabaseClient
            .from('lessons')
            .insert({
              learner_id: bookingData.learner_id,
              teacher_id: bookingData.teacher_id,
              subject_id: bookingData.subject_id || bookingData.subject,
              scheduled_time: scheduledTime,
              duration_minutes: bookingData.duration || 60,
              status: 'booked',
              is_free_trial: false,
              teacher_rate_at_booking: bookingData.price,
              platform_fee: 0,
              total_cost_paid: bookingData.price,
              payment_id: session.payment_intent,
              stripe_checkout_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent,
              payment_status: 'completed',
              payment_amount: bookingData.price,
              paid_at: new Date().toISOString(),
              '100ms_room_id': roomId,
              teacher_room_code: teacherRoomCode,
              student_room_code: studentRoomCode,
            })
            .select()
            .single()

          if (lessonError) {
            console.error('❌ Failed to create lesson:', lessonError)
          } else {
            createdLessons.push(lesson)
            console.log('✅ Lesson created:', lesson.id)
          }
        }

        console.log(`🎉 Successfully created ${createdLessons.length} lessons`)

        if (createdLessons.length > 0) {
          await supabaseClient
            .from('pending_bookings')
            .update({ status: 'completed' })
            .eq('id', pendingBookingId)

          console.log('✅ Pending booking marked as completed')
        } else {
          await supabaseClient
            .from('pending_bookings')
            .update({ status: 'failed' })
            .eq('id', pendingBookingId)
        }

        break
      }

      default:
        console.log('❓ Unhandled event type:', event.type)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('💥 Webhook error:', error.message);

    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
