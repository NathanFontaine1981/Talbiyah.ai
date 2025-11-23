import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Execute the SQL to add the column
    const { data, error } = await supabaseClient.rpc('exec', {
      sql: `
        ALTER TABLE pending_bookings
        ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

        CREATE INDEX IF NOT EXISTS idx_pending_bookings_stripe_session
        ON pending_bookings(stripe_session_id);

        COMMENT ON COLUMN pending_bookings.stripe_session_id
        IS 'Stripe checkout session ID for linking payments to pending bookings';

        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'pending_bookings'
        AND column_name = 'stripe_session_id';
      `
    })

    if (error) {
      console.error('Error executing SQL:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Column added successfully',
      data
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
