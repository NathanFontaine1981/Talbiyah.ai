import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, securityHeaders } from "../_shared/cors.ts"

const responseHeaders = {
  ...responseHeaders,
  ...securityHeaders,
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: responseHeaders
    })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const fromDate = url.searchParams.get('from') || new Date().toISOString().split('T')[0]
    const toDate = url.searchParams.get('to') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const subjectFilter = url.searchParams.get('subject')
    const teacherIdFilter = url.searchParams.get('teacher_id')

    console.log('📅 Fetching availability from', fromDate, 'to', toDate)
    console.log('🎯 Teacher filter:', teacherIdFilter, 'Subject filter:', subjectFilter)

    // The teacherIdFilter might be a user_id (from profiles table) or teacher_profiles.id
    // We need to resolve it to teacher_profiles.id for querying availability
    let resolvedTeacherId = teacherIdFilter

    if (teacherIdFilter) {
      // First check if this is a user_id by looking up teacher_profiles
      const { data: teacherProfile } = await supabaseClient
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', teacherIdFilter)
        .maybeSingle()

      if (teacherProfile) {
        console.log('🔄 Resolved user_id to teacher_profiles.id:', teacherProfile.id)
        resolvedTeacherId = teacherProfile.id
      } else {
        console.log('ℹ️ teacherIdFilter is already a teacher_profiles.id or not found')
      }
    }

    // Fetch recurring availability from teacher_availability table
    let recurringQuery = supabaseClient
      .from('teacher_availability')
      .select('*')
      .eq('is_available', true)

    if (resolvedTeacherId) {
      recurringQuery = recurringQuery.eq('teacher_id', resolvedTeacherId)
    }

    const { data: recurringSlots, error: recurringError } = await recurringQuery

    if (recurringError) {
      console.error('Error fetching recurring availability:', recurringError)
      throw recurringError
    }

    console.log('📊 Found', recurringSlots?.length || 0, 'recurring availability records')

    // Fetch one-off availability from teacher_availability_one_off table
    let oneOffQuery = supabaseClient
      .from('teacher_availability_one_off')
      .select('*')
      .eq('is_available', true)
      .gte('date', fromDate)
      .lte('date', toDate)

    if (resolvedTeacherId) {
      oneOffQuery = oneOffQuery.eq('teacher_id', resolvedTeacherId)
    }

    const { data: oneOffSlots, error: oneOffError } = await oneOffQuery

    if (oneOffError) {
      console.error('Error fetching one-off availability:', oneOffError)
      throw oneOffError
    }

    console.log('📊 Found', oneOffSlots?.length || 0, 'one-off availability records')

    // Combine all availability records
    const allAvailability = [...(recurringSlots || []), ...(oneOffSlots || [])]

    if (allAvailability.length === 0) {
      console.log('⚠️ No availability records found')
      return new Response(
        JSON.stringify({ success: true, slots: [] }),
        { headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get unique teacher IDs
    const teacherIds = [...new Set(allAvailability.map(slot => slot.teacher_id))]
    console.log('👥 Teachers with availability:', teacherIds)

    // Fetch teacher profiles
    const { data: teacherProfiles, error: profilesError } = await supabaseClient
      .from('teacher_profiles')
      .select(`
        id,
        hourly_rate,
        profiles!teacher_profiles_user_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .in('id', teacherIds)
      .eq('status', 'approved')

    if (profilesError) {
      console.error('Error fetching teacher profiles:', profilesError)
    }

    const teacherMap = new Map()
    teacherProfiles?.forEach(tp => {
      teacherMap.set(tp.id, {
        id: tp.id,
        full_name: tp.profiles?.full_name || 'Teacher',
        avatar_url: tp.profiles?.avatar_url || '',
        hourly_rate: tp.hourly_rate || 15
      })
    })

    // Get subject IDs from availability records
    const subjectIds = new Set<string>()
    allAvailability.forEach(slot => {
      if (slot.subjects && Array.isArray(slot.subjects)) {
        slot.subjects.forEach((s: string) => subjectIds.add(s))
      }
    })

    // Fetch subject details
    let subjectsData: any[] = []
    if (subjectIds.size > 0) {
      const { data: fetchedSubjects, error: subjectsError } = await supabaseClient
        .from('subjects')
        .select('*')
        .in('id', Array.from(subjectIds))

      if (subjectsError) {
        console.error('Error fetching subjects:', subjectsError)
      }
      subjectsData = fetchedSubjects ?? []
    }

    const subjectMap = new Map<string, any>()
    subjectsData.forEach(subject => {
      if (subject?.id) {
        subjectMap.set(subject.id, subject)
      }
    })

    console.log('📚 Subjects loaded:', subjectsData.map(s => s.name))

    // Fetch existing bookings to check for conflicts
    const { data: existingBookings, error: bookingsError } = await supabaseClient
      .from('lessons')
      .select('teacher_id, scheduled_time, duration_minutes, status')
      .in('teacher_id', teacherIds)
      .gte('scheduled_time', `${fromDate}T00:00:00Z`)
      .lte('scheduled_time', `${toDate}T23:59:59Z`)
      .in('status', ['scheduled', 'confirmed', 'pending'])

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
    }

    // Create a set of booked slots
    const bookedSlots = new Set<string>()
    existingBookings?.forEach(booking => {
      const bookingTime = new Date(booking.scheduled_time)
      const dateStr = bookingTime.toISOString().split('T')[0]
      const timeStr = bookingTime.toTimeString().substring(0, 5)
      bookedSlots.add(`${booking.teacher_id}-${dateStr}-${timeStr}`)
    })

    // Generate available slots for the date range
    const availableSlots: any[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let date = new Date(fromDate); date <= new Date(toDate); date.setDate(date.getDate() + 1)) {
      // Skip past dates
      if (date < today) continue

      const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.
      const dateStr = date.toISOString().split('T')[0]

      // Find one-off availability for this specific date (takes precedence)
      const oneOffForDate = (oneOffSlots || []).filter(slot => slot.date === dateStr)

      // Find recurring availability for this day of week
      const recurringForDay = (recurringSlots || []).filter(slot => slot.day_of_week === dayOfWeek)

      // Combine: one-off takes precedence, but include both
      const slotsForDate = oneOffForDate.length > 0 ? oneOffForDate : recurringForDay

      for (const slot of slotsForDate) {
        const teacher = teacherMap.get(slot.teacher_id)
        if (!teacher) {
          console.log('⚠️ Teacher not found for slot:', slot.teacher_id)
          continue
        }

        // Get subjects for this slot
        const slotSubjects = slot.subjects || []

        // Filter by subject if provided
        if (subjectFilter && !slotSubjects.includes(subjectFilter)) {
          continue
        }

        // Parse start and end times
        const startTime = slot.start_time.substring(0, 5) // HH:MM
        const endTime = slot.end_time.substring(0, 5)

        const [startHour, startMin] = startTime.split(':').map(Number)
        const [endHour, endMin] = endTime.split(':').map(Number)

        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin

        // Generate slots for both 30 and 60 minute durations
        const durations = [30, 60]

        for (const duration of durations) {
          for (let mins = startMinutes; mins + duration <= endMinutes; mins += duration) {
            const slotHour = Math.floor(mins / 60)
            const slotMin = mins % 60
            const slotTimeStr = `${slotHour.toString().padStart(2, '0')}:${slotMin.toString().padStart(2, '0')}`

            // Skip slots in the past
            const now = new Date()
            const slotDateTime = new Date(`${dateStr}T${slotTimeStr}:00`)
            if (slotDateTime <= now) continue

            // Skip slots that are less than 2 hours from now
            const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
            if (slotDateTime < twoHoursFromNow) continue

            // Check if slot is already booked
            const slotKey = `${slot.teacher_id}-${dateStr}-${slotTimeStr}`
            if (bookedSlots.has(slotKey)) continue

            // Get subject details for each subject in the slot
            for (const subjectId of slotSubjects) {
              // Skip if filtering by subject and this isn't the one
              if (subjectFilter && subjectId !== subjectFilter) continue

              const subjectRecord = subjectMap.get(subjectId)
              if (!subjectRecord) continue

              const hourlyRate = teacher.hourly_rate || 15
              const sessionPrice = Math.round(hourlyRate * (duration / 60) * 100) / 100

              availableSlots.push({
                id: `${slot.id}-${dateStr}-${slotTimeStr}-${duration}-${subjectId}`,
                teacher_id: slot.teacher_id,
                teacher_name: teacher.full_name,
                teacher_avatar: teacher.avatar_url,
                teacher_rating: 5,
                date: dateStr,
                time: slotTimeStr,
                duration: duration,
                subject: subjectId,
                price: sessionPrice,
                pricing: {
                  hourly_rate: hourlyRate,
                  platform_fee: 0,
                  teacher_payout: sessionPrice,
                },
                subject_details: {
                  id: subjectRecord.id,
                  slug: subjectRecord.slug,
                  name: subjectRecord.name,
                  icon: subjectRecord.icon,
                },
                availability_id: slot.id
              })
            }
          }
        }
      }
    }

    // Sort slots by date and time
    availableSlots.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return a.time.localeCompare(b.time)
    })

    console.log('✅ Returning', availableSlots.length, 'available slots')

    return new Response(
      JSON.stringify({ success: true, slots: availableSlots }),
      { headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error getting available slots:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to get available slots' }),
      { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )
  }
})