import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { checkRateLimitDB } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// Whitelist of allowed SQL operations - ONLY SELECT is permitted
const ALLOWED_OPERATIONS = ['SELECT'];

// Blacklisted keywords that could be dangerous even in SELECT
const BLACKLISTED_KEYWORDS = [
  'DROP', 'DELETE', 'TRUNCATE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE',
  'GRANT', 'REVOKE', 'EXECUTE', 'EXEC', 'INTO', 'COPY', 'pg_read_file',
  'pg_write_file', 'pg_ls_dir', 'lo_import', 'lo_export'
];

/**
 * Validate SQL query for safety
 * Only allows SELECT statements without dangerous keywords
 */
function validateSqlQuery(sql: string): { valid: boolean; error?: string } {
  const normalizedSql = sql.trim().toUpperCase();

  // Must start with SELECT
  if (!normalizedSql.startsWith('SELECT')) {
    return { valid: false, error: 'Only SELECT queries are allowed' };
  }

  // Check for blacklisted keywords
  for (const keyword of BLACKLISTED_KEYWORDS) {
    // Use word boundary regex to avoid false positives
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(sql)) {
      return { valid: false, error: `Query contains forbidden keyword: ${keyword}` };
    }
  }

  // Check for multiple statements (could be SQL injection attempt)
  if (sql.includes(';') && sql.indexOf(';') < sql.length - 1) {
    const afterSemicolon = sql.substring(sql.indexOf(';') + 1).trim();
    if (afterSemicolon.length > 0 && !afterSemicolon.startsWith('--')) {
      return { valid: false, error: 'Multiple statements not allowed' };
    }
  }

  // Limit query length to prevent DoS
  if (sql.length > 5000) {
    return { valid: false, error: 'Query too long (max 5000 characters)' };
  }

  return { valid: true };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Only allow from authenticated admin users
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (!profile?.roles?.includes('admin')) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: 10 queries per minute per admin user
    const rateLimitResult = await checkRateLimitDB(
      supabase,
      user.id,
      'execute_sql',
      10,
      1
    );

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait before trying again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { sql } = await req.json();

    if (!sql) {
      return new Response(
        JSON.stringify({ error: "SQL query required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the SQL query
    const validation = validateSqlQuery(sql);
    if (!validation.valid) {
      // Log blocked query attempt
      await supabase.from('security_audit_log').insert({
        event_type: 'blocked_sql_query',
        user_id: user.id,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        details: {
          reason: validation.error,
          query_preview: sql.substring(0, 100)
        }
      }).catch(() => {}); // Don't fail if audit log fails

      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the query execution for audit trail
    await supabase.from('security_audit_log').insert({
      event_type: 'admin_sql_query',
      user_id: user.id,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      details: {
        query_preview: sql.substring(0, 200)
      }
    }).catch(() => {}); // Don't fail if audit log fails

    // Execute SQL using postgres connection
    // Note: This uses the service role which has full database access
    const result = await supabase.rpc('execute_sql', { query: sql });

    if (result.error) {
      return new Response(
        JSON.stringify({ error: "Query execution failed", details: result.error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, result: result.data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
