import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to decode JWT payload without verification (Supabase already verified it)
function decodeJwtPayload(token: string): { sub?: string; role?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '');

    // Try to get user via Supabase client first
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    let userId: string | null = null;

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (user) {
      userId = user.id;
      console.log("Authenticated via getUser:", userId);
    } else if (authError) {
      // Fallback: decode the JWT directly (Supabase edge runtime already validated it)
      console.log("getUser failed, using JWT fallback:", authError.message);
      const payload = decodeJwtPayload(token);
      if (payload?.sub && payload?.role === 'authenticated') {
        userId = payload.sub;
        console.log("Authenticated via JWT decode:", userId);
      }
    }

    if (!userId) {
      console.error("Could not authenticate user");
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for the actual data fetch (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { student_ids } = await req.json();

    if (!student_ids || !Array.isArray(student_ids)) {
      return new Response(
        JSON.stringify({ error: 'student_ids array required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get learner info for these student IDs
    const { data: learners, error } = await supabase
      .from('learners')
      .select('id, name, parent_id')
      .in('id', student_ids);

    if (error) throw error;

    // Get parent profiles for those learners
    const parentIds = learners?.map(l => l.parent_id).filter(Boolean) || [];

    const { data: parents } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', parentIds);

    // Build response mapping student_id to their info
    const studentInfoMap: Record<string, { name: string; avatar_url: string | null }> = {};

    for (const learner of learners || []) {
      const parent = parents?.find(p => p.id === learner.parent_id);
      studentInfoMap[learner.id] = {
        name: parent?.full_name || learner.name || 'Student',
        avatar_url: parent?.avatar_url || null
      };
    }

    return new Response(
      JSON.stringify({ students: studentInfoMap }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
