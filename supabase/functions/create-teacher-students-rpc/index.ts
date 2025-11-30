import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create the RPC function for get_teacher_students
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_teacher_students(p_teacher_id UUID)
        RETURNS TABLE (
          relationship_id UUID,
          student_id UUID,
          student_name TEXT,
          student_email TEXT,
          student_avatar TEXT,
          subject_name TEXT,
          total_lessons INTEGER,
          total_hours NUMERIC,
          first_lesson_date TIMESTAMP WITH TIME ZONE,
          last_lesson_date TIMESTAMP WITH TIME ZONE,
          status TEXT,
          next_lesson_time TIMESTAMP WITH TIME ZONE
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN QUERY
          SELECT
            str.id as relationship_id,
            str.student_id,
            COALESCE(p.full_name, l.name, 'Student')::TEXT as student_name,
            COALESCE(p.email, '')::TEXT as student_email,
            p.avatar_url::TEXT as student_avatar,
            s.name::TEXT as subject_name,
            COALESCE(str.total_lessons, 0)::INTEGER as total_lessons,
            COALESCE(str.total_hours, 0)::NUMERIC as total_hours,
            str.created_at as first_lesson_date,
            str.last_lesson_date,
            str.status::TEXT,
            (
              SELECT les.scheduled_time
              FROM lessons les
              WHERE les.teacher_id = str.teacher_id
                AND les.learner_id = str.student_id
                AND les.scheduled_time > NOW()
                AND les.status IN ('confirmed', 'pending')
              ORDER BY les.scheduled_time ASC
              LIMIT 1
            ) as next_lesson_time
          FROM student_teacher_relationships str
          LEFT JOIN learners l ON str.student_id = l.id
          LEFT JOIN profiles p ON l.parent_id = p.id
          LEFT JOIN subjects s ON str.subject_id = s.id
          WHERE str.teacher_id = p_teacher_id
          ORDER BY str.last_lesson_date DESC NULLS LAST, str.created_at DESC;
        END;
        $$;
      `
    });

    if (error) {
      // Try alternative approach - return the SQL to run manually
      return new Response(
        JSON.stringify({
          message: 'Please run this SQL in Supabase SQL Editor:',
          sql: `
CREATE OR REPLACE FUNCTION get_teacher_students(p_teacher_id UUID)
RETURNS TABLE (
  relationship_id UUID,
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  student_avatar TEXT,
  subject_name TEXT,
  total_lessons INTEGER,
  total_hours NUMERIC,
  first_lesson_date TIMESTAMP WITH TIME ZONE,
  last_lesson_date TIMESTAMP WITH TIME ZONE,
  status TEXT,
  next_lesson_time TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    str.id as relationship_id,
    str.student_id,
    COALESCE(p.full_name, l.name, 'Student')::TEXT as student_name,
    COALESCE(p.email, '')::TEXT as student_email,
    p.avatar_url::TEXT as student_avatar,
    s.name::TEXT as subject_name,
    COALESCE(str.total_lessons, 0)::INTEGER as total_lessons,
    COALESCE(str.total_hours, 0)::NUMERIC as total_hours,
    str.created_at as first_lesson_date,
    str.last_lesson_date,
    str.status::TEXT,
    (
      SELECT les.scheduled_time
      FROM lessons les
      WHERE les.teacher_id = str.teacher_id
        AND les.learner_id = str.student_id
        AND les.scheduled_time > NOW()
        AND les.status IN ('confirmed', 'pending')
      ORDER BY les.scheduled_time ASC
      LIMIT 1
    ) as next_lesson_time
  FROM student_teacher_relationships str
  LEFT JOIN learners l ON str.student_id = l.id
  LEFT JOIN profiles p ON l.parent_id = p.id
  LEFT JOIN subjects s ON str.subject_id = s.id
  WHERE str.teacher_id = p_teacher_id
  ORDER BY str.last_lesson_date DESC NULLS LAST, str.created_at DESC;
END;
$$;
          `,
          error: error.message
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
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
