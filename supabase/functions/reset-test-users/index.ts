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
    // ADMIN AUTH CHECK - This is a destructive operation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify the user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (!profile?.roles?.includes('admin')) {
      return new Response(
        JSON.stringify({ error: 'Admin access required for this destructive operation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🧹 Starting database cleanup...')

    // Get all admin users (preserve all admins)
    const { data: adminProfiles } = await supabaseClient
      .from('profiles')
      .select('id, full_name')
      .contains('roles', ['admin'])

    if (!adminProfiles || adminProfiles.length === 0) {
      throw new Error('No admin users found in database')
    }

    const adminIds = adminProfiles.map(p => p.id)
    console.log(`✅ Found ${adminIds.length} admin user(s) to preserve:`, adminProfiles.map(p => p.full_name || p.id))

    // Get all non-admin users
    const { data: usersToDelete } = await supabaseClient
      .from('profiles')
      .select('id, full_name, roles')
      .not('id', 'in', `(${adminIds.join(',')})`)

    console.log(`Found ${usersToDelete?.length || 0} users to delete`)

    // Delete related records for non-admin users
    for (const user of usersToDelete || []) {
      console.log(`Deleting user: ${user.full_name || user.id}`)

      // Delete bookings
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

      // Delete from auth.users (using admin API)
      await supabaseClient.auth.admin.deleteUser(user.id)

      console.log(`✅ Deleted user: ${user.full_name || user.id}`)
    }

    console.log('🎉 Database cleanup complete!')

    // Now create test accounts
    console.log('👤 Creating test accounts...')

    const password = 'Welcome1!'
    const testAccounts = []

    // 1. Create Student Account
    console.log('Creating student account...')
    const { data: studentAuth, error: studentAuthError } = await supabaseClient.auth.admin.createUser({
      email: 'aisha.rahman@test.com',
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Aisha Rahman'
      }
    })

    if (studentAuthError) {
      console.error('Error creating student:', studentAuthError)
    } else {
      await supabaseClient
        .from('profiles')
        .update({
          full_name: 'Aisha Rahman',
          roles: ['student'],
          phone_number: '+44 7700 900123',
          timezone: 'Europe/London',
          has_used_free_trial: false
        })
        .eq('id', studentAuth.user.id)

      testAccounts.push({
        role: 'student',
        email: 'aisha.rahman@test.com',
        password: password,
        name: 'Aisha Rahman',
        id: studentAuth.user.id
      })
      console.log('✅ Student account created: aisha.rahman@test.com')
    }

    // 2. Create Parent Account with Child
    console.log('Creating parent account...')
    const { data: parentAuth, error: parentAuthError } = await supabaseClient.auth.admin.createUser({
      email: 'fatima.ali@test.com',
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Fatima Ali'
      }
    })

    if (parentAuthError) {
      console.error('Error creating parent:', parentAuthError)
    } else {
      await supabaseClient
        .from('profiles')
        .update({
          full_name: 'Fatima Ali',
          roles: ['parent'],
          phone_number: '+44 7700 900456',
          timezone: 'Europe/London',
          has_used_free_trial: false
        })
        .eq('id', parentAuth.user.id)

      // Create a child for the parent
      const { data: child } = await supabaseClient
        .from('learners')
        .insert([{
          parent_id: parentAuth.user.id,
          name: 'Yusuf Ali',
          age: 10,
          gender: 'male',
          learning_level: 'beginner'
        }])
        .select()
        .single()

      testAccounts.push({
        role: 'parent',
        email: 'fatima.ali@test.com',
        password: password,
        name: 'Fatima Ali',
        id: parentAuth.user.id,
        child: {
          name: 'Yusuf Ali',
          age: 10,
          id: child?.id
        }
      })
      console.log('✅ Parent account created: fatima.ali@test.com')
      console.log('✅ Child created: Yusuf Ali (age 10)')
    }

    // 3. Create Teacher Account
    console.log('Creating teacher account...')
    const { data: teacherAuth, error: teacherAuthError } = await supabaseClient.auth.admin.createUser({
      email: 'omar.hassan@test.com',
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Omar Hassan'
      }
    })

    if (teacherAuthError) {
      console.error('Error creating teacher:', teacherAuthError)
    } else {
      await supabaseClient
        .from('profiles')
        .update({
          full_name: 'Omar Hassan',
          roles: ['teacher'],
          phone_number: '+44 7700 900789',
          timezone: 'Europe/London'
        })
        .eq('id', teacherAuth.user.id)

      // Create teacher profile
      const { data: teacherProfile } = await supabaseClient
        .from('teacher_profiles')
        .insert([{
          user_id: teacherAuth.user.id,
          bio: 'Experienced Quran teacher with 5 years of experience teaching students of all ages.',
          qualifications: ['Ijazah in Quran Recitation', 'Bachelor in Islamic Studies'],
          specializations: ['Quran Recitation', 'Tajweed', 'Arabic Language'],
          years_of_experience: 5,
          hourly_rate: 15.00,
          status: 'approved',
          verified: true
        }])
        .select()
        .single()

      // Add default availability (Monday-Friday, 9 AM - 5 PM)
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      for (const day of days) {
        await supabaseClient
          .from('teacher_availability')
          .insert([{
            teacher_id: teacherProfile.id,
            day_of_week: day,
            start_time: '09:00',
            end_time: '17:00',
            is_available: true
          }])
      }

      testAccounts.push({
        role: 'teacher',
        email: 'omar.hassan@test.com',
        password: password,
        name: 'Omar Hassan',
        id: teacherAuth.user.id,
        hourlyRate: 15.00,
        availability: 'Monday-Friday, 9 AM - 5 PM'
      })
      console.log('✅ Teacher account created: omar.hassan@test.com')
      console.log('✅ Teacher profile created with availability')
    }

    console.log('🎊 All test accounts created successfully!')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database reset complete',
        adminsPreserved: adminProfiles.length,
        usersDeleted: usersToDelete?.length || 0,
        testAccounts: testAccounts
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
