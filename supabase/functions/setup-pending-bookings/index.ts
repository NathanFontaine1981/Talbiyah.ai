import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  try {
    console.log('Creating pending_bookings table...')

    // Create the table
    const { data: tableData, error: tableError } = await supabaseClient.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS pending_bookings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          booking_data JSONB NOT NULL,
          total_amount INTEGER NOT NULL,
          session_count INTEGER NOT NULL,
          status TEXT DEFAULT 'pending',
          stripe_session_id TEXT,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
      `
    })

    console.log('Table creation result:', { tableData, tableError })

    return new Response(
      JSON.stringify({
        success: !tableError,
        error: tableError?.message,
        message: 'Please create the table manually in Supabase SQL Editor'
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
