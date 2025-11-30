import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Create the table using raw SQL via Postgres
    const { error } = await supabaseAdmin.from('khutba_insights').select('id').limit(1);

    if (error && error.code === '42P01') {
      // Table doesn't exist - return SQL to create it
      return new Response(
        JSON.stringify({
          message: "Table doesn't exist. Please create it via Supabase Dashboard SQL Editor",
          sql: `
CREATE TABLE khutba_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  speaker TEXT,
  location TEXT,
  khutba_date DATE,
  original_text TEXT,
  insights JSONB NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_khutba_insights_title ON khutba_insights USING gin(to_tsvector('english', title));
CREATE INDEX idx_khutba_insights_speaker ON khutba_insights(speaker);
CREATE INDEX idx_khutba_insights_date ON khutba_insights(khutba_date);
CREATE INDEX idx_khutba_insights_created_at ON khutba_insights(created_at);

ALTER TABLE khutba_insights ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY admin_all_khutba_insights ON khutba_insights
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Everyone can read
CREATE POLICY read_khutba_insights ON khutba_insights
  FOR SELECT TO authenticated
  USING (true);
          `
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Table already exists!", success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
