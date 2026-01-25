// Temporary function to run token system migration
// Delete after running once

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const results: string[] = [];

  try {
    // 1. Create processed_webhook_events table
    await supabase.from("processed_webhook_events").select("id").limit(1).catch(async () => {
      // Table doesn't exist, we'll create it via raw insert trick
    });

    // Since we can't run raw DDL, let's use the postgres extension
    // Actually we need to use database URL directly

    // For now, just verify what tables exist
    const { data: tables } = await supabase.rpc("get_tables_list").catch(() => ({ data: null }));

    results.push(`Checked tables: ${JSON.stringify(tables)}`);

    // Try to insert a test record to see if tables exist
    const testUserId = "00000000-0000-0000-0000-000000000000";

    const { error: tokenError } = await supabase
      .from("user_tokens")
      .select("id")
      .limit(1);

    if (tokenError?.code === "42P01") {
      results.push("user_tokens table does NOT exist - needs manual creation");
    } else {
      results.push("user_tokens table exists");
    }

    const { error: purchaseError } = await supabase
      .from("token_purchases")
      .select("id")
      .limit(1);

    if (purchaseError?.code === "42P01") {
      results.push("token_purchases table does NOT exist - needs manual creation");
    } else {
      results.push("token_purchases table exists");
    }

    const { error: webhookError } = await supabase
      .from("processed_webhook_events")
      .select("id")
      .limit(1);

    if (webhookError?.code === "42P01") {
      results.push("processed_webhook_events table does NOT exist - needs manual creation");
    } else {
      results.push("processed_webhook_events table exists");
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: "Check results above. If tables don't exist, run URGENT_RUN_THIS_SQL.sql manually."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        results
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
