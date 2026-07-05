import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Max-Age': '86400',
}

// Admin-initiated single lesson booking.
//
// This is called from the admin "New Session" modal to book a 1:1 lesson on
// behalf of a student. It writes to the `lessons` table (the real 1:1 lesson
// table the rest of the app reads from), provisions a 100ms room, and settles
// payment one of two ways:
//   - payment_method: 'credits' -> deduct the student's lesson credits
//   - payment_method: 'gift'    -> free lesson, no credits charged
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
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

    // ---- Admin gate -----------------------------------------------------------
    // This runs on the service-role key and can create free ('gift') lessons and
    // charge any student's credits, so the caller MUST be an admin. Case-insensitive
    // to match the mixed 'admin'/'Admin' role values in the codebase.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { data: { user: caller }, error: callerError } =
      await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { data: callerProfile } = await supabaseClient
      .from('profiles').select('roles').eq('id', caller.id).single()
    const callerIsAdmin = Array.isArray(callerProfile?.roles) &&
      callerProfile!.roles.some((r: string) => (r ?? '').toLowerCase() === 'admin')
    if (!callerIsAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = await req.json()
    const {
      user_id,               // student profiles.id
      teacher_id,            // teacher_profiles.id
      date,                  // YYYY-MM-DD (used for room naming / emails)
      time,                  // full ISO timestamp -> stored as scheduled_time
      subject,               // subjects.id or slug
      duration = 60,
      // 'credits' charges the student's credit balance; 'gift' is a free lesson.
      // Legacy callers passing use_free_session: true are treated as a gift.
      payment_method: paymentMethodRaw,
      use_free_session = false,
    } = body

    const paymentMethod: 'credits' | 'gift' =
      paymentMethodRaw === 'credits' ? 'credits'
      : paymentMethodRaw === 'gift' ? 'gift'
      : (use_free_session ? 'gift' : 'credits')
    const isGift = paymentMethod === 'gift'

    console.log('📋 Booking details:', {
      user_id, teacher_id, date, time, subject, duration, paymentMethod
    });

    // Validate required fields
    if (!user_id || !teacher_id || !time || !subject) {
      throw new Error('Missing required booking fields (student, teacher, time, subject)')
    }

    // ---- Resolve subject ------------------------------------------------------
    const { data: subjectData, error: subjectError } = await supabaseClient
      .from('subjects')
      .select('id, name, slug')
      .or(`id.eq.${subject},slug.eq.${subject}`)
      .single()

    if (subjectError || !subjectData) {
      throw new Error(`Subject not found: ${subject}`)
    }

    // ---- Resolve teacher profile (for user_id + rate) -------------------------
    const { data: teacherProfile, error: teacherError } = await supabaseClient
      .from('teacher_profiles')
      .select('id, user_id, teacher_type, independent_rate, tier')
      .eq('id', teacher_id)
      .single()

    if (teacherError || !teacherProfile) {
      throw new Error(`Teacher profile not found: ${teacher_id}`)
    }

    // ---- Resolve the student's learner record ---------------------------------
    // `lessons.learner_id` is NOT NULL -> every lesson needs a learners row.
    // A student's "self-learner" is a learners row with parent_id = their profile.
    let learnerId: string | null = null
    const { data: existingLearners } = await supabaseClient
      .from('learners')
      .select('id')
      .eq('parent_id', user_id)
      .limit(1)

    if (existingLearners && existingLearners.length > 0) {
      learnerId = existingLearners[0].id
    } else {
      const { data: studentProfile } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', user_id)
        .maybeSingle()

      const { data: newLearner, error: newLearnerError } = await supabaseClient
        .from('learners')
        .insert({
          parent_id: user_id,
          name: studentProfile?.full_name || 'Student',
          gamification_points: 0,
        })
        .select('id')
        .single()

      if (newLearnerError || !newLearner) {
        throw new Error('Failed to resolve/create learner profile for student')
      }
      learnerId = newLearner.id
    }

    // ---- Credit pre-check (only when charging credits) ------------------------
    const durationHours = (Number(duration) || 60) / 60
    const creditsNeeded = durationHours // 1 credit = 60 min

    // Students with unlimited credits (Gold) never get charged.
    const { data: studentProfileFlags } = await supabaseClient
      .from('profiles')
      .select('unlimited_credits')
      .eq('id', user_id)
      .maybeSingle()
    const hasUnlimitedCredits = !!studentProfileFlags?.unlimited_credits

    const willChargeCredits = !isGift && !hasUnlimitedCredits

    if (willChargeCredits) {
      const { data: creditRow } = await supabaseClient
        .from('user_credits')
        .select('credits_remaining')
        .eq('user_id', user_id)
        .maybeSingle()

      const balance = Number(creditRow?.credits_remaining ?? 0)
      if (balance < creditsNeeded) {
        throw new Error(
          `Insufficient credits: student has ${balance}, needs ${creditsNeeded}. ` +
          `Add credits or gift the lesson instead.`
        )
      }
    }

    // ---- Compute teacher rate / platform fee (for teacher earnings) -----------
    const isIndependent = teacherProfile.teacher_type === 'independent'
    let teacherRate = 5      // hourly, platform default
    let studentPrice = 15    // hourly, platform default
    if (isIndependent) {
      teacherRate = parseFloat(teacherProfile.independent_rate) || teacherRate
      studentPrice = teacherRate
    } else {
      const { data: tierRow } = await supabaseClient
        .from('teacher_tiers')
        .select('teacher_hourly_rate, student_hourly_price')
        .eq('tier', teacherProfile.tier || 'newcomer')
        .maybeSingle()
      teacherRate = parseFloat(tierRow?.teacher_hourly_rate) || teacherRate
      studentPrice = parseFloat(tierRow?.student_hourly_price) || studentPrice
    }
    const platformFee = isGift ? 0 : Math.max(0, (studentPrice - teacherRate) * durationHours)
    const totalCostPaid = isGift ? 0 : studentPrice * durationHours

    // ---- Create 100ms room ----------------------------------------------------
    console.log('🎥 Creating 100ms room...');
    const roomName = `${subjectData.name}-${date || ''}-${Date.now()}`
    const description = `${subjectData.name} session on ${date || ''}`

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const roomResponse = await fetch(`${supabaseUrl}/functions/v1/create-hms-room`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomName, description, bookingId: null })
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

    const roomId = roomData.room.id
    const teacherRoomCode = roomData.room.codes?.teacher || roomData.room.roomCode || null
    const studentRoomCode = roomData.room.codes?.student || roomData.room.roomCode || null

    console.log('✅ 100ms room created:', { roomId });

    // ---- Create the lesson ----------------------------------------------------
    const paymentId = isGift
      ? `admin_gift_${Date.now()}_${Math.random().toString(36).substring(7)}`
      : `admin_credits_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const { data: lesson, error: lessonError } = await supabaseClient
      .from('lessons')
      .insert({
        learner_id: learnerId,
        student_id: user_id,
        teacher_id: teacherProfile.id,
        subject_id: subjectData.id,
        scheduled_time: time,
        duration_minutes: Number(duration) || 60,
        status: 'booked',
        is_free_trial: isGift,
        teacher_rate_at_booking: teacherRate,
        platform_fee: platformFee,
        total_cost_paid: totalCostPaid,
        payment_status: 'completed',
        payment_id: paymentId,
        '100ms_room_id': roomId,
        teacher_room_code: teacherRoomCode,
        student_room_code: studentRoomCode,
        lesson_tier: 'premium',
      })
      .select()
      .single()

    if (lessonError) {
      console.error('❌ Failed to create lesson:', lessonError)
      throw new Error(`Failed to create lesson: ${lessonError.message}`)
    }

    console.log('✅ Lesson created:', { id: lesson.id, isGift, willChargeCredits });

    // ---- Charge credits (after the lesson exists so we can log against it) -----
    let creditsCharged = 0
    if (willChargeCredits) {
      const { error: deductError } = await supabaseClient
        .rpc('deduct_user_credits', {
          p_user_id: user_id,
          p_credits: creditsNeeded,
          p_lesson_id: lesson.id,
          p_notes: `Admin-booked lesson (${creditsNeeded} credit${creditsNeeded === 1 ? '' : 's'})`,
        })

      if (deductError) {
        // Roll the lesson back so we never leave an unpaid lesson behind.
        console.error('❌ Failed to deduct credits, rolling back lesson:', deductError)
        await supabaseClient.from('lessons').delete().eq('id', lesson.id)
        throw new Error(`Failed to charge credits: ${deductError.message}`)
      }
      creditsCharged = creditsNeeded
      console.log(`✅ Charged ${creditsNeeded} credit(s) to student ${user_id}`)
    }

    // ---- Notify the teacher by email (non-blocking) ---------------------------
    try {
      const { data: { user: teacherUser } } = await supabaseClient.auth.admin.getUserById(teacherProfile.user_id);
      const { data: teacherProfileData } = await supabaseClient
        .from('profiles').select('full_name').eq('id', teacherProfile.user_id).single();
      const { data: studentData } = await supabaseClient
        .from('profiles').select('full_name').eq('id', user_id).single();

      if (teacherUser?.email) {
        await fetch(`${supabaseUrl}/functions/v1/send-booking-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teacher_email: teacherUser.email,
            teacher_name: teacherProfileData?.full_name || 'Teacher',
            student_name: studentData?.full_name || 'A student',
            subject_name: subjectData.name,
            scheduled_date: date,
            scheduled_time: time,
            duration_minutes: Number(duration) || 60,
            booking_id: lesson.id,
          })
        }).catch((e) => console.warn('⚠️ Teacher email failed:', e))
      }
    } catch (emailError) {
      console.error('⚠️ Error sending email notification:', emailError);
    }

    console.log('🎉 Admin booking created successfully');

    return new Response(
      JSON.stringify({
        success: true,
        lesson,
        room: roomData.room,
        payment_method: paymentMethod,
        credits_charged: creditsCharged,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Error creating booking:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
