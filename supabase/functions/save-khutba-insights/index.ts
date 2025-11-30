import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface KhutbaInsightRequest {
  title: string;
  speaker?: string;
  location?: string;
  khutba_date?: string;
  original_text?: string;
  insights: Record<string, unknown>;
  user_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, ensure the table exists by trying to create it
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS khutba_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        speaker TEXT,
        location TEXT,
        khutba_date DATE,
        original_text TEXT,
        insights JSONB NOT NULL,
        created_by UUID REFERENCES auth.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        is_public BOOLEAN DEFAULT true
      );

      -- Enable RLS if not already
      ALTER TABLE khutba_insights ENABLE ROW LEVEL SECURITY;

      -- Create policies if they don't exist
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khutba_insights' AND policyname = 'Anyone can view public khutba insights') THEN
          CREATE POLICY "Anyone can view public khutba insights"
            ON khutba_insights FOR SELECT
            USING (is_public = true);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khutba_insights' AND policyname = 'Users can insert their own khutba insights') THEN
          CREATE POLICY "Users can insert their own khutba insights"
            ON khutba_insights FOR INSERT
            WITH CHECK (created_by = auth.uid() OR created_by IS NULL);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khutba_insights' AND policyname = 'Users can update their own khutba insights') THEN
          CREATE POLICY "Users can update their own khutba insights"
            ON khutba_insights FOR UPDATE
            USING (created_by = auth.uid());
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khutba_insights' AND policyname = 'Admins can manage all khutba insights') THEN
          CREATE POLICY "Admins can manage all khutba insights"
            ON khutba_insights FOR ALL
            USING (
              EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND 'admin' = ANY(profiles.roles)
              )
            );
        END IF;
      END $$;

      -- Create indexes if they don't exist
      CREATE INDEX IF NOT EXISTS idx_khutba_insights_khutba_date ON khutba_insights(khutba_date DESC);
      CREATE INDEX IF NOT EXISTS idx_khutba_insights_created_by ON khutba_insights(created_by);
    `;

    // Try to execute the SQL to create/ensure table exists
    try {
      const { error: sqlError } = await supabase.rpc('exec_sql', { query: createTableSQL });
      if (sqlError) {
        console.log("Note: Could not run setup SQL (may already exist):", sqlError.message);
      }
    } catch (e) {
      console.log("Setup SQL skipped:", e);
    }

    // Parse the request body
    const body: KhutbaInsightRequest = await req.json();
    console.log("Received save request for:", body.title);

    // Insert the khutba insight
    const { data, error } = await supabase
      .from("khutba_insights")
      .insert({
        title: body.title,
        speaker: body.speaker || null,
        location: body.location || null,
        khutba_date: body.khutba_date || null,
        original_text: body.original_text || null,
        insights: body.insights,
        created_by: body.user_id || null,
        is_public: true,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error inserting khutba insight:", error);
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully saved khutba insight:", data.id);

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in save-khutba-insights:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
