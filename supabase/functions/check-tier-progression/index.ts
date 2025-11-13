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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { lesson_id } = await req.json()

    if (!lesson_id) {
      return new Response(
        JSON.stringify({ error: 'lesson_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Checking tier progression for lesson:', lesson_id)

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('teacher_id, duration, status')
      .eq('id', lesson_id)
      .single()

    if (lessonError) throw lessonError
    if (!lesson) throw new Error('Lesson not found')
    if (lesson.status !== 'completed') {
      return new Response(
        JSON.stringify({ message: 'Lesson not completed yet' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get teacher profile with stats
    const { data: teacher, error: teacherError } = await supabase
      .from('teacher_profiles')
      .select('*')
      .eq('id', lesson.teacher_id)
      .single()

    if (teacherError) throw teacherError
    if (!teacher) throw new Error('Teacher not found')

    // Skip if tier is locked
    if (teacher.tier_locked) {
      console.log('Teacher tier is locked, skipping progression check')
      return new Response(
        JSON.stringify({ message: 'Teacher tier is locked' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update teacher stats
    const lessonHours = lesson.duration / 60 // convert minutes to hours
    const { error: statsError } = await supabase
      .from('teacher_profiles')
      .update({
        total_hours_taught: (teacher.total_hours_taught || 0) + lessonHours,
        total_lessons_completed: (teacher.total_lessons_completed || 0) + 1,
        last_tier_check: new Date().toISOString()
      })
      .eq('id', teacher.id)

    if (statsError) throw statsError

    // Calculate updated stats
    const updatedHours = (teacher.total_hours_taught || 0) + lessonHours
    const updatedLessons = (teacher.total_lessons_completed || 0) + 1

    // Get current tier info
    const { data: currentTier, error: currentTierError } = await supabase
      .from('teacher_tiers')
      .select('*')
      .eq('tier', teacher.current_tier || 'newcomer')
      .single()

    if (currentTierError) throw currentTierError

    // Get next tier
    const { data: nextTier, error: nextTierError } = await supabase
      .from('teacher_tiers')
      .select('*')
      .eq('tier_order', currentTier.tier_order + 1)
      .maybeSingle()

    if (nextTierError) throw nextTierError
    if (!nextTier) {
      console.log('Teacher is at highest tier')
      return new Response(
        JSON.stringify({ message: 'Already at highest tier' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if next tier requires manual approval
    if (nextTier.requires_manual_approval) {
      // Check if eligible based on stats
      const meetsRequirements =
        updatedHours >= (nextTier.min_hours || 0) &&
        (teacher.average_rating || 0) >= (nextTier.min_rating || 0) &&
        (teacher.student_retention_rate || 0) >= (nextTier.min_retention_rate || 0) &&
        updatedLessons >= (nextTier.min_completed_lessons || 0)

      if (meetsRequirements) {
        // Mark as eligible but don't auto-promote
        await supabase
          .from('teacher_profiles')
          .update({
            eligible_for_promotion: true,
            promotion_blocked_reason: null
          })
          .eq('id', teacher.id)

        console.log(`Teacher eligible for manual promotion to ${nextTier.tier}`)

        // TODO: Send notification to admin and teacher

        return new Response(
          JSON.stringify({
            message: 'Eligible for manual promotion',
            next_tier: nextTier.tier,
            requires_review: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        return new Response(
          JSON.stringify({ message: 'Not yet eligible for next tier' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Check if meets auto-promotion requirements
    const meetsRequirements =
      updatedHours >= (nextTier.min_hours || 0) &&
      updatedHours <= (nextTier.max_hours || 999999) &&
      (teacher.average_rating || 0) >= (nextTier.min_rating || 0) &&
      (teacher.student_retention_rate || 0) >= (nextTier.min_retention_rate || 0) &&
      updatedLessons >= (nextTier.min_completed_lessons || 0)

    if (meetsRequirements) {
      console.log(`AUTO-PROMOTING teacher to ${nextTier.tier}`)

      // Update teacher tier
      await supabase
        .from('teacher_profiles')
        .update({
          current_tier: nextTier.tier,
          hourly_rate: nextTier.hourly_rate,
          tier_assigned_at: new Date().toISOString(),
          eligible_for_promotion: false,
          promotion_blocked_reason: null
        })
        .eq('id', teacher.id)

      // Record in tier history
      await supabase
        .from('teacher_tier_history')
        .insert({
          teacher_id: teacher.id,
          from_tier: currentTier.tier,
          to_tier: nextTier.tier,
          promotion_type: 'auto',
          reason: 'Met automatic progression requirements',
          stats_at_promotion: {
            hours: updatedHours,
            lessons: updatedLessons,
            rating: teacher.average_rating,
            retention: teacher.student_retention_rate
          }
        })

      // Check for milestone bonus
      const { data: bonus } = await supabase
        .from('tier_milestone_bonuses')
        .select('*')
        .eq('milestone_type', 'tier_unlock')
        .eq('tier', nextTier.tier)
        .maybeSingle()

      if (bonus) {
        console.log(`Awarding tier unlock bonus: £${bonus.bonus_amount}`)
        await supabase
          .from('teacher_bonus_payments')
          .insert({
            teacher_id: teacher.id,
            milestone_id: bonus.id,
            amount: bonus.bonus_amount,
            description: bonus.bonus_description
          })
      }

      // Check for hours milestone bonuses
      const hoursThresholds = [100, 500, 1000]
      for (const threshold of hoursThresholds) {
        if (updatedHours >= threshold && (teacher.total_hours_taught || 0) < threshold) {
          const { data: hoursBonus } = await supabase
            .from('tier_milestone_bonuses')
            .select('*')
            .eq('milestone_type', 'hours_milestone')
            .eq('hours_required', threshold)
            .maybeSingle()

          if (hoursBonus) {
            console.log(`Awarding ${threshold} hours milestone bonus: £${hoursBonus.bonus_amount}`)
            await supabase
              .from('teacher_bonus_payments')
              .insert({
                teacher_id: teacher.id,
                milestone_id: hoursBonus.id,
                amount: hoursBonus.bonus_amount,
                description: hoursBonus.bonus_description
              })
          }
        }
      }

      // Check for lessons milestone bonuses
      const lessonsThresholds = [100, 500]
      for (const threshold of lessonsThresholds) {
        if (updatedLessons >= threshold && (teacher.total_lessons_completed || 0) < threshold) {
          const { data: lessonsBonus } = await supabase
            .from('tier_milestone_bonuses')
            .select('*')
            .eq('milestone_type', 'lessons_milestone')
            .eq('lessons_required', threshold)
            .maybeSingle()

          if (lessonsBonus) {
            console.log(`Awarding ${threshold} lessons milestone bonus: £${lessonsBonus.bonus_amount}`)
            await supabase
              .from('teacher_bonus_payments')
              .insert({
                teacher_id: teacher.id,
                milestone_id: lessonsBonus.id,
                amount: lessonsBonus.bonus_amount,
                description: lessonsBonus.bonus_description
              })
          }
        }
      }

      // TODO: Send congratulations email/notification to teacher

      return new Response(
        JSON.stringify({
          success: true,
          promoted: true,
          new_tier: nextTier.tier,
          new_rate: nextTier.hourly_rate,
          bonus: bonus?.bonus_amount || 0,
          celebration_message: bonus?.celebration_message
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Not ready for promotion yet
    console.log('Teacher not yet ready for promotion')
    return new Response(
      JSON.stringify({
        message: 'Not yet eligible for promotion',
        current_tier: currentTier.tier,
        next_tier: nextTier.tier,
        progress: {
          hours: `${updatedHours.toFixed(1)} / ${nextTier.min_hours}`,
          lessons: `${updatedLessons} / ${nextTier.min_completed_lessons}`,
          rating: `${(teacher.average_rating || 0).toFixed(1)} / ${nextTier.min_rating}`,
          retention: `${teacher.student_retention_rate || 0}% / ${nextTier.min_retention_rate}%`
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in check-tier-progression:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
