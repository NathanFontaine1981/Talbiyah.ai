import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    })
  }

  console.log('📝 CREATE SINGLE BOOKING INTERNAL:', {
    method: req.method,
    timestamp: new Date().toISOString()
  });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body = await req.json()
    const {
      user_id,
      teacher_id,
      date,
      time,
      subject,
      duration = 60,
      price,
      payment_intent_id,
      use_free_session = false
    } = body

    console.log('📋 Booking details:', {
      user_id,
      teacher_id,
      date,
      time,
      subject,
      duration,
      price,
      payment_intent_id,
      use_free_session
    });

    // Validate required fields
    if (!user_id || !teacher_id || !date || !time || !subject) {
      throw new Error('Missing required booking fields')
    }

    // Get subject details
    const { data: subjectData, error: subjectError } = await supabaseClient
      .from('subjects')
      .select('id, name, slug')
      .or(`id.eq.${subject},slug.eq.${subject}`)
      .single()

    if (subjectError || !subjectData) {
      throw new Error(`Subject not found: ${subject}`)
    }

    console.log('📚 Subject found:', {
      id: subjectData.id,
      name: subjectData.name,
      slug: subjectData.slug
    });

    // Get teacher profile to fetch user_id
    const { data: teacherProfile, error: teacherError } = await supabaseClient
      .from('teacher_profiles')
      .select('user_id')
      .eq('id', teacher_id)
      .single()

    if (teacherError || !teacherProfile) {
      throw new Error(`Teacher profile not found: ${teacher_id}`)
    }

    console.log('👨‍🏫 Teacher found:', {
      teacher_id,
      user_id: teacherProfile.user_id
    });

    // Create 100ms room
    console.log('🎥 Creating 100ms room...');

    const roomName = `${subjectData.name}-${date}-${time.replace(':', '')}-${Date.now()}`
    const description = `${subjectData.name} session on ${date} at ${time}`

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const roomResponse = await fetch(`${supabaseUrl}/functions/v1/create-hms-room`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomName,
        description,
        bookingId: null // Will be set after booking creation
      })
    })

    if (!roomResponse.ok) {
      const errorText = await roomResponse.text()
      console.error('❌ Failed to create 100ms room:', errorText)
      throw new Error(`Failed to create 100ms room: ${errorText}`)
    }

    const roomData = await roomResponse.json()

    if (!roomData.success || !roomData.room) {
      throw new Error('Invalid room creation response')
    }

    console.log('✅ 100ms room created:', {
      roomId: roomData.room.id,
      roomName: roomData.room.name,
      teacherCode: roomData.room.codes?.teacher,
      studentCode: roomData.room.codes?.student
    });

    // Create booking record
    console.log('💾 Creating booking record...');

    const bookingData = {
      student_id: user_id,
      teacher_id: teacherProfile.user_id,
      subject_id: subjectData.id,
      scheduled_date: date,
      scheduled_time: time,
      duration_minutes: duration,
      price: Math.round(price * 100), // Convert to cents
      status: 'confirmed',
      payment_status: payment_intent_id ? 'paid' : 'pending',
      payment_intent_id: payment_intent_id,
      room_id: roomData.room.id,
      room_code: roomData.room.codes?.teacher || roomData.room.roomCode,
      teacher_room_code: roomData.room.codes?.teacher || roomData.room.roomCode,
      student_room_code: roomData.room.codes?.student || roomData.room.roomCode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert([bookingData])
      .select()
      .single()

    if (bookingError) {
      console.error('❌ Failed to create booking:', bookingError)
      throw new Error(`Failed to create booking: ${bookingError.message}`)
    }

    console.log('✅ Booking created:', {
      id: booking.id,
      student_id: booking.student_id,
      teacher_id: booking.teacher_id,
      scheduled_date: booking.scheduled_date,
      scheduled_time: booking.scheduled_time,
      status: booking.status,
      payment_status: booking.payment_status,
      room_id: booking.room_id
    });

    // Send email notification to teacher using Resend
    try {
      console.log('📧 Sending email notification to teacher...');

      // Get teacher's email and name from auth.users
      const { data: { user: teacherUser }, error: teacherUserError } = await supabaseClient.auth.admin.getUserById(teacherProfile.user_id);

      // Get teacher's profile name
      const { data: teacherProfileData } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', teacherProfile.user_id)
        .single();

      // Get student's name
      const { data: studentData } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', user_id)
        .single();

      if (!teacherUserError && teacherUser?.email) {
        const teacherEmail = teacherUser.email;
        const teacherName = teacherProfileData?.full_name || 'Teacher';
        const studentName = studentData?.full_name || 'A student';

        // Call the Resend email function
        const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-booking-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teacher_email: teacherEmail,
            teacher_name: teacherName,
            student_name: studentName,
            subject_name: subjectData.name,
            scheduled_date: date,
            scheduled_time: time,
            duration_minutes: duration,
            booking_id: booking.id
          })
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error('⚠️ Failed to send email notification:', errorText);
          // Don't fail the booking creation if email fails
        } else {
          const emailResult = await emailResponse.json();
          console.log('✅ Email notification sent to teacher:', emailResult.email_id);
        }
      } else {
        console.warn('⚠️ Teacher email not found, skipping notification');
      }
    } catch (emailError) {
      console.error('⚠️ Error sending email notification:', emailError);
      // Don't fail the booking creation if email fails
    }

    // If using free session, decrement user's free session count
    if (use_free_session) {
      console.log('🎁 Decrementing free session count...');

      const { error: decrementError } = await supabaseClient
        .rpc('decrement_free_sessions', {
          user_id: user_id
        })

      if (decrementError) {
        console.error('⚠️ Failed to decrement free sessions:', decrementError)
        // Don't fail the booking, just log the error
      } else {
        console.log('✅ Free session count decremented')
      }
    }

    const result = {
      success: true,
      booking,
      room: roomData.room
    }

    console.log('🎉 Booking created successfully with 100ms room');

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('💥 Error creating booking:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
