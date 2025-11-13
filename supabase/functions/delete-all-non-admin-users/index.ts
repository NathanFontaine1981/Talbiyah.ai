import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('🧹 Starting cleanup - deleting all non-admin users...')

    // Get all admin users (preserve all admins)
    const { data: adminProfiles } = await supabaseClient
      .from('profiles')
      .select('id, full_name')
      .contains('roles', ['admin'])

    if (!adminProfiles || adminProfiles.length === 0) {
      throw new Error('No admin users found in database')
    }

    const adminIds = adminProfiles.map(p => p.id)
    console.log(`✅ Found ${adminIds.length} admin user(s) to preserve`)

    // Get all non-admin users
    const { data: usersToDelete, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, roles')
      .not('roles', 'cs', '{admin}')  // Not containing admin

    if (fetchError) {
      console.error('Error fetching users:', fetchError)
      throw fetchError
    }

    console.log(`Found ${usersToDelete?.length || 0} non-admin users to delete`)

    let deletedCount = 0

    // Delete related records for non-admin users
    for (const user of usersToDelete || []) {
      console.log(`Deleting user: ${user.full_name || user.id}`)

      try {
        // Delete bookings where user is student or teacher
        await supabaseClient
          .from('bookings')
          .delete()
          .or(`student_id.eq.${user.id},teacher_id.eq.${user.id}`)

        // Delete pending bookings
        await supabaseClient
          .from('pending_bookings')
          .delete()
          .eq('user_id', user.id)

        // Delete cart items
        await supabaseClient
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)

        // Delete payments
        await supabaseClient
          .from('payments')
          .delete()
          .eq('user_id', user.id)

        // Delete teacher profiles
        await supabaseClient
          .from('teacher_profiles')
          .delete()
          .eq('user_id', user.id)

        // Delete teacher availability
        const { data: teacherProfiles } = await supabaseClient
          .from('teacher_profiles')
          .select('id')
          .eq('user_id', user.id)

        if (teacherProfiles && teacherProfiles.length > 0) {
          for (const tp of teacherProfiles) {
            await supabaseClient
              .from('teacher_availability')
              .delete()
              .eq('teacher_id', tp.id)
          }
        }

        // Delete learners (children)
        await supabaseClient
          .from('learners')
          .delete()
          .eq('parent_id', user.id)

        // Delete profile
        await supabaseClient
          .from('profiles')
          .delete()
          .eq('id', user.id)

        // Delete from auth.users
        const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(user.id)

        if (authDeleteError) {
          console.error(`⚠️ Error deleting auth user ${user.id}:`, authDeleteError)
        }

        console.log(`✅ Deleted user: ${user.full_name || user.id}`)
        deletedCount++
      } catch (error) {
        console.error(`❌ Error deleting user ${user.id}:`, error)
      }
    }

    console.log(`🎉 Cleanup complete! Deleted ${deletedCount} users, preserved ${adminIds.length} admin(s)`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database cleanup complete',
        adminsPreserved: adminIds.length,
        usersDeleted: deletedCount
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('💥 Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
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
