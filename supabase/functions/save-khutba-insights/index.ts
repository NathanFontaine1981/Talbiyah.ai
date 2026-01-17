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
  skip_notifications?: boolean;
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

    // Skip email notifications if requested (admin will send separately)
    if (body.skip_notifications) {
      console.log("Skipping email notifications as requested");
      return new Response(
        JSON.stringify({ success: true, id: data.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email notification to all users about new khutba insights
    try {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY) {
        // Get all users with email notifications enabled
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .not('email', 'is', null);

        if (usersError) {
          console.error("Error fetching users for notification:", usersError);
        } else if (users && users.length > 0) {
          console.log(`Sending khutba notification to ${users.length} users`);

          // Format the date nicely
          const khutbaDateFormatted = body.khutba_date
            ? new Date(body.khutba_date).toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : 'Recent';

          // Get main points for email preview
          const mainPoints = body.insights?.main_points?.slice(0, 3) || [];
          const mainPointsHtml = mainPoints.length > 0
            ? `<ul style="margin: 16px 0; padding-left: 20px;">${mainPoints.map((p: any) => `<li style="margin: 8px 0;"><strong>${p.point}</strong></li>`).join('')}</ul>`
            : '';

          // Send batch email (Resend supports up to 100 recipients per batch)
          const emailAddresses = users
            .filter(u => u.email)
            .map(u => u.email as string);

          if (emailAddresses.length > 0) {
            // Send in batches of 50 to avoid rate limits
            const batches = [];
            for (let i = 0; i < emailAddresses.length; i += 50) {
              batches.push(emailAddresses.slice(i, i + 50));
            }

            for (const batch of batches) {
              const emailResponse = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${RESEND_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "Talbiyah <updates@talbiyah.ai>",
                  bcc: batch, // Use BCC to protect privacy
                  to: "updates@talbiyah.ai", // Required field
                  subject: `🕌 New Talbiyah Insights: ${body.title}`,
                  html: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #059669; margin: 0;">Talbiyah Insights</h1>
                        <p style="color: #6b7280; margin: 5px 0;">New Khutbah Study Materials Available</p>
                      </div>

                      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h2 style="color: #92400e; margin: 0 0 10px 0; font-size: 24px;">${body.title}</h2>
                        ${body.speaker ? `<p style="color: #b45309; margin: 5px 0;"><strong>Speaker:</strong> ${body.speaker}</p>` : ''}
                        ${body.location ? `<p style="color: #b45309; margin: 5px 0;"><strong>Location:</strong> ${body.location}</p>` : ''}
                        <p style="color: #b45309; margin: 5px 0;"><strong>Date:</strong> ${khutbaDateFormatted}</p>
                      </div>

                      ${mainPointsHtml ? `
                        <div style="margin-bottom: 24px;">
                          <h3 style="color: #374151; margin: 0 0 12px 0;">Key Points:</h3>
                          ${mainPointsHtml}
                        </div>
                      ` : ''}

                      <div style="text-align: center; margin: 30px 0;">
                        <a href="https://talbiyah.ai/insights-library" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                          View Full Insights
                        </a>
                      </div>

                      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                          Study notes include Quranic vocabulary, hadith references, quizzes, homework, and family discussion guides.
                        </p>
                      </div>

                      <div style="text-align: center; margin-top: 20px;">
                        <p style="color: #9ca3af; font-size: 11px;">
                          Talbiyah - Your Path to Islamic Knowledge<br>
                          <a href="https://talbiyah.ai" style="color: #059669;">talbiyah.ai</a>
                        </p>
                      </div>
                    </div>
                  `,
                }),
              });

              if (emailResponse.ok) {
                console.log(`Email batch sent successfully to ${batch.length} users`);
              } else {
                const emailError = await emailResponse.text();
                console.error("Email batch failed:", emailError);
              }
            }
          }
        }
      } else {
        console.log("RESEND_API_KEY not configured, skipping email notifications");
      }
    } catch (emailError) {
      console.error("Error sending email notifications:", emailError);
      // Don't fail the save if email fails
    }

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
