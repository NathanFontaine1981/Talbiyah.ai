import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
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
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const fromDate = url.searchParams.get('from') || new Date().toISOString().split('T')[0]
    const toDate = url.searchParams.get('to') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const subject = url.searchParams.get('subject')
    const teacherId = url.searchParams.get('teacher_id')

    // Build query for teacher availability using new table
    let availabilityQuery = supabaseClient
      .from('teacher_availability_slots')
      .select(`
        *,
        teacher:profiles!teacher_id(
          id,
          full_name,
          avatar_url,
          teacher_profile:teachers!inner(
            id,
            rating,
            hourly_rate
          )
        )
      `)
      .eq('is_active', true)

    // Filter by subject if provided
    if (subject) {
      availabilityQuery = availabilityQuery.eq('subject', subject)
    }

    // Filter by teacher if provided
    if (teacherId) {
      availabilityQuery = availabilityQuery.eq('teacher_id', teacherId)
    }

    const { data: rawSlots, error } = await availabilityQuery
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      throw error
    }

    // Get all teacher IDs that have availability
    const teacherIds = [...new Set(rawSlots.map(slot => slot.teacher_id))]

    const subjectSlugs = [...new Set(rawSlots.map(slot => slot.subject).filter(Boolean))]

    let subjectsData: any[] = []

    if (subjectSlugs.length > 0) {
      const { data: fetchedSubjects, error: subjectsError } = await supabaseClient
        .from('subjects')
        .select('*')
        .in('slug', subjectSlugs)

      if (subjectsError) {
        throw subjectsError
      }

      subjectsData = fetchedSubjects ?? []
    }

    const subjectMap = new Map<string, any>()
    const subjectIdMap = new Map<string, any>()

    subjectsData.forEach(subject => {
      if (subject?.slug) {
        subjectMap.set(subject.slug, subject)
      }
      if (subject?.id) {
        subjectIdMap.set(subject.id, subject)
      }
    })

    let rateMap = new Map<string, any>()

    if (teacherIds.length > 0 && subjectIdMap.size > 0) {
      const subjectIds = Array.from(subjectIdMap.keys())

      const { data: teacherSettings, error: settingsError } = await supabaseClient
        .from('teacher_subject_settings')
        .select('id, teacher_id, subject_id, hourly_rate, is_enabled')
        .in('teacher_id', teacherIds)
        .in('subject_id', subjectIds)

      if (settingsError) {
        throw settingsError
      }

      rateMap = new Map()

      ;(teacherSettings ?? []).forEach(setting => {
        const subject = subjectIdMap.get(setting.subject_id)
        const slugKey = subject?.slug ? `${setting.teacher_id}:${subject.slug}` : null
        const idKey = `${setting.teacher_id}:${setting.subject_id}`

        if (slugKey) {
          rateMap.set(slugKey, setting)
        }

        rateMap.set(idKey, setting)
      })
    }

    if (teacherIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, slots: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch all relevant bookings in a single query to check for conflicts
    const { data: allBookings, error: bookingsError } = await supabaseClient
      .from('bookings')
      .select('teacher_id, scheduled_date, scheduled_time, status')
      .in('teacher_id', teacherIds)
      .gte('scheduled_date', fromDate)
      .lte('scheduled_date', toDate)
      .in('status', ['confirmed', 'pending'])

    if (bookingsError) {
      throw bookingsError
    }

    // Fetch all public sessions that would block teacher availability
    const { data: publicSessions, error: publicSessionsError } = await supabaseClient
      .from('public_sessions')
      .select('teacher_id, scheduled_at, duration_minutes, status')
      .in('teacher_id', teacherIds)
      .gte('scheduled_at', `${fromDate}T00:00:00Z`)
      .lte('scheduled_at', `${toDate}T23:59:59Z`)
      .in('status', ['scheduled', 'live'])

    if (publicSessionsError) {
      throw publicSessionsError
    }

    // Create a lookup set for booked slots for efficient checking
    const bookedSlots = new Set(
      allBookings.map(booking => 
        `${booking.teacher_id}-${booking.scheduled_date}-${booking.scheduled_time}`
      )
    )

    // Create a lookup set for public session blocked time slots
    const blockedByPublicSessions = new Set()
    publicSessions.forEach(session => {
      const sessionStart = new Date(session.scheduled_at)
      const sessionEnd = new Date(sessionStart.getTime() + session.duration_minutes * 60 * 1000)
      
      // Generate all 30-minute and 60-minute time slots that overlap with this public session
      const sessionDate = sessionStart.toISOString().split('T')[0]
      
      // Block all time slots that would overlap with this public session
      for (let time = new Date(sessionStart); time < sessionEnd; time.setMinutes(time.getMinutes() + 30)) {
        const timeStr = time.toTimeString().substring(0, 5)
        const slotKey = `${session.teacher_id}-${sessionDate}-${timeStr}`
        blockedByPublicSessions.add(slotKey)
        
        // Also block 60-minute slots that would start within the session duration
        if (time >= sessionStart && time < sessionEnd) {
          const endTime = new Date(time.getTime() + 60 * 60 * 1000)
          if (endTime > sessionEnd) {
            // This 60-minute slot would extend beyond the public session, so block it
            blockedByPublicSessions.add(slotKey)
          }
        }
      }
    })

    // Convert availability slots to actual date/time slots for the date range
    const availableSlots: any[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start from beginning of today

    for (let date = new Date(fromDate); date <= new Date(toDate); date.setDate(date.getDate() + 1)) {
      // Skip past dates
      if (date < today) continue

      const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek]
      const dateStr = date.toISOString().split('T')[0]
      
      // Find availability for this day - both recurring and specific date
      const daySlots = rawSlots.filter(slot => {
        if (slot.is_recurring) {
          return slot.day_of_week === dayName
        } else {
          return slot.specific_date === dateStr
        }
      })
      
      for (const slot of daySlots) {
        // Skip if teacher data is missing
        if (!slot.teacher || !slot.teacher.teacher_profile) continue

        // Create time slots (1-hour sessions)
        const startTime = new Date(`${date.toISOString().split('T')[0]}T${slot.start_time}`)
        const endTime = new Date(`${date.toISOString().split('T')[0]}T${slot.end_time}`)
        
        // Generate slots (both 30-minute and 60-minute)
        const durations = [30, 60] // Support both 30 and 60 minute sessions
        
        for (const duration of durations) {
          const incrementMinutes = duration
          
          for (let slotTime = new Date(startTime); slotTime < endTime; slotTime.setMinutes(slotTime.getMinutes() + incrementMinutes)) {
            const slotEnd = new Date(slotTime.getTime() + duration * 60 * 1000)
            
            if (slotEnd > endTime) break // Don't create slots that extend beyond availability
            
            const slotDate = slotTime.toISOString().split('T')[0]
            const slotTimeStr = slotTime.toTimeString().substring(0, 5)
            
            // Skip slots in the past (including today if the time has passed)
            const now = new Date()
            const slotDateTime = new Date(`${slotDate}T${slotTimeStr}`)
            if (slotDateTime <= now) continue

            // Skip slots that are less than 2 hours from now
            const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
            if (slotDateTime < twoHoursFromNow) continue
            
            // Check if this slot is already booked or blocked by a public session
            const slotKey = `${slot.teacher_id}-${slotDate}-${slotTimeStr}`
            const isBooked = bookedSlots.has(slotKey)
            const isBlockedByPublicSession = blockedByPublicSessions.has(slotKey)
            
            // Only include if not booked, not blocked by public session, and in the future
            if (!isBooked && !isBlockedByPublicSession) {
              const subjectRecord = subjectMap.get(slot.subject)
              if (!subjectRecord) {
                continue
              }

              const rateKey = `${slot.teacher_id}:${slot.subject}`
              const rateSetting: any = rateMap.get(rateKey) ?? rateMap.get(`${slot.teacher_id}:${subjectRecord.id}`)

              if (rateSetting && rateSetting.is_enabled === false) {
                continue
              }

              const fallbackHourly = slot.teacher?.teacher_profile?.hourly_rate ?? subjectRecord?.minimum_rate ?? 1500
              let hourlyRate = rateSetting?.hourly_rate ?? fallbackHourly

              if (!hourlyRate || hourlyRate <= 0) {
                hourlyRate = subjectRecord?.minimum_rate ?? 1500
              }

              if (subjectRecord?.minimum_rate && hourlyRate < subjectRecord.minimum_rate) {
                hourlyRate = subjectRecord.minimum_rate
              }

              const sessionPrice = Math.max(1, Math.round(hourlyRate * (duration / 60)))

              let platformFee = 0
              if (subjectRecord) {
                if (subjectRecord.platform_fee_type === 'percentage') {
                  const percentage = Number(subjectRecord.platform_fee_percentage ?? 0)
                  platformFee = Math.round(sessionPrice * (percentage / 100))
                } else {
                  const baseFee = Number(subjectRecord.platform_fee_amount ?? 0)
                  platformFee = Math.round(baseFee * (duration / 60))
                }
              }

              if (platformFee > sessionPrice) {
                platformFee = sessionPrice
              }

              const teacherPayout = Math.max(sessionPrice - platformFee, 0)

              availableSlots.push({
                id: `${slot.id}-${slotDate}-${slotTimeStr}-${duration}`,
                teacher_id: slot.teacher_id,
                teacher_name: slot.teacher?.full_name ?? 'Teacher',
                teacher_avatar: slot.teacher?.avatar_url || '',
                teacher_rating: slot.teacher?.teacher_profile?.rating ?? 5,
                date: slotDate,
                time: slotTimeStr,
                duration: duration,
                subject: slot.subject,
                price: sessionPrice,
                teacher_subject_setting_id: rateSetting?.id ?? null,
                pricing: {
                  hourly_rate: hourlyRate,
                  platform_fee: platformFee,
                  teacher_payout: teacherPayout,
                  subject_minimum: subjectRecord?.minimum_rate ?? null,
                  platform_fee_type: subjectRecord?.platform_fee_type ?? null,
                  platform_fee_amount: subjectRecord?.platform_fee_amount ?? null,
                  platform_fee_percentage: subjectRecord?.platform_fee_percentage ?? null,
                },
                subject_details: subjectRecord
                  ? {
                      id: subjectRecord.id,
                      slug: subjectRecord.slug,
                      name: subjectRecord.name,
                      minimum_rate: subjectRecord.minimum_rate,
                      icon: subjectRecord.icon,
                    }
                  : null,
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

    return new Response(
      JSON.stringify({ success: true, slots: availableSlots }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error getting available slots:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to get available slots' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})