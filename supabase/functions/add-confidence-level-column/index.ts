import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
    const client = new Client(dbUrl);
    await client.connect();

    const results: string[] = [];

    // Add confidence_level column to homework_submissions
    try {
      await client.queryArray(`
        ALTER TABLE homework_submissions
        ADD COLUMN IF NOT EXISTS confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5);
      `);
      results.push('Add confidence_level column: success');
    } catch (e) {
      results.push(`Add confidence_level column: ${e.message}`);
    }

    // Add comment for documentation
    try {
      await client.queryArray(`
        COMMENT ON COLUMN homework_submissions.confidence_level IS
        'Student self-assessment: 1=Need More Practice, 2=Getting There, 3=Fairly Confident, 4=Strong, 5=Mastered';
      `);
      results.push('Add column comment: success');
    } catch (e) {
      results.push(`Add column comment: ${e.message}`);
    }

    await client.end();

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
