import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update all lessons where teacher confirmed but confirmation_status is still pending
    const { data, error } = await supabase
      .from('lessons')
      .update({
        confirmation_status: 'acknowledged',
        acknowledged_at: new Date().toISOString()
      })
      .eq('teacher_confirmed', true)
      .or('confirmation_status.eq.pending,confirmation_status.is.null')
      .select('id, confirmation_status');

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        updated: data?.length || 0,
        lessons: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
