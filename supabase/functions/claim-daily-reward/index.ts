import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { learnerId } = await req.json()

    if (!learnerId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing learnerId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the learner and verify ownership
    const { data: learner, error: learnerError } = await supabase
      .from('learners')
      .select('id, parent_id, current_streak, last_login_date, total_xp, current_level')
      .eq('id', learnerId)
      .single()

    if (learnerError || !learner) {
      return new Response(
        JSON.stringify({ success: false, error: 'Learner not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user owns this learner
    if (learner.parent_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0] // YYYY-MM-DD format
    const lastLoginDate = learner.last_login_date

    // Check if already claimed today
    if (lastLoginDate === today) {
      return new Response(
        JSON.stringify({
          success: false,
          alreadyClaimed: true,
          message: 'Daily reward already claimed today',
          streak: learner.current_streak || 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate if streak continues or resets
    let newStreak = 1
    if (lastLoginDate) {
      const lastDate = new Date(lastLoginDate)
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      if (lastLoginDate === yesterdayStr) {
        // Consecutive day - increase streak
        newStreak = (learner.current_streak || 0) + 1
      }
      // Otherwise streak resets to 1
    }

    // Calculate XP reward based on streak
    const BASE_XP = 10
    const STREAK_BONUS_XP = 5 // Extra XP per streak day (capped)
    const MAX_STREAK_BONUS = 50 // Max bonus XP from streak

    const streakBonus = Math.min(newStreak * STREAK_BONUS_XP, MAX_STREAK_BONUS)
    const totalXPReward = BASE_XP + streakBonus

    // Calculate new total XP and level
    const newTotalXP = (learner.total_xp || 0) + totalXPReward
    const newLevel = Math.floor(newTotalXP / 500) + 1 // Level up every 500 XP

    // Update learner
    const { error: updateError } = await supabase
      .from('learners')
      .update({
        last_login_date: today,
        current_streak: newStreak,
        total_xp: newTotalXP,
        current_level: newLevel
      })
      .eq('id', learnerId)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update learner' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log the reward in xp_transactions (optional - table may not exist yet)
    try {
      await supabase
        .from('xp_transactions')
        .insert({
          learner_id: learnerId,
          amount: totalXPReward,
          reason: 'daily_login',
          description: `Daily login reward (${newStreak} day streak)`,
          created_at: now.toISOString()
        })
    } catch (txErr) {
      // Non-critical - table may not exist yet
      console.log('Could not log XP transaction:', txErr)
    }

    return new Response(
      JSON.stringify({
        success: true,
        xpAwarded: totalXPReward,
        baseXP: BASE_XP,
        streakBonus: streakBonus,
        newStreak: newStreak,
        totalXP: newTotalXP,
        level: newLevel,
        levelUp: newLevel > (learner.current_level || 1)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
