import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get database connection string from environment
    const databaseUrl = Deno.env.get("SUPABASE_DB_URL");

    if (!databaseUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Database URL not available. Please run this SQL in Supabase Dashboard SQL Editor:",
          sql: `ALTER TABLE student_teacher_relationships ADD COLUMN IF NOT EXISTS teacher_general_notes TEXT;`
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Connect to database
    const sql = postgres(databaseUrl, { ssl: 'require' });

    // Add the column
    await sql`
      ALTER TABLE student_teacher_relationships
      ADD COLUMN IF NOT EXISTS teacher_general_notes TEXT
    `;

    // Close connection
    await sql.end();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Column teacher_general_notes added successfully!",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
        message: "Please run this SQL in Supabase Dashboard SQL Editor:",
        sql: `ALTER TABLE student_teacher_relationships ADD COLUMN IF NOT EXISTS teacher_general_notes TEXT;`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
