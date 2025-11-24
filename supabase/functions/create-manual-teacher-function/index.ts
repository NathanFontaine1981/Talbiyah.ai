import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const sql = `
-- Function to manually add a teacher-student relationship
CREATE OR REPLACE FUNCTION manually_add_teacher_relationship(
  p_student_id UUID,
  p_teacher_id UUID,
  p_subject_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_relationship_id UUID;
BEGIN
  -- Check if relationship already exists
  SELECT id INTO v_relationship_id
  FROM student_teacher_relationships
  WHERE student_id = p_student_id
    AND teacher_id = p_teacher_id
    AND subject_id = p_subject_id;

  -- If exists, return existing ID
  IF v_relationship_id IS NOT NULL THEN
    RETURN v_relationship_id;
  END IF;

  -- Create new relationship
  INSERT INTO student_teacher_relationships (
    student_id,
    teacher_id,
    subject_id,
    first_paid_lesson_date,
    status,
    total_lessons,
    total_hours
  )
  VALUES (
    p_student_id,
    p_teacher_id,
    p_subject_id,
    CURRENT_DATE,
    'active',
    0,
    0
  )
  RETURNING id INTO v_relationship_id;

  RETURN v_relationship_id;
END;
$$;

GRANT EXECUTE ON FUNCTION manually_add_teacher_relationship TO authenticated;
    `

    const { data, error } = await supabaseClient.rpc('exec_sql', { sql })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message, sql }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Function created' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
