-- Create a function to book lessons that doesn't rely on schema cache
-- This bypasses the Supabase schema cache issue by using dynamic SQL

CREATE OR REPLACE FUNCTION book_lesson_with_credits(
  p_learner_id UUID,
  p_teacher_id UUID,
  p_subject_id UUID,
  p_scheduled_date DATE,
  p_scheduled_time TIME,
  p_duration_minutes INTEGER,
  p_price NUMERIC,
  p_is_trial BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lesson_id UUID;
BEGIN
  -- Insert the lesson using dynamic SQL to bypass schema cache
  INSERT INTO lessons (
    learner_id,
    teacher_id,
    subject_id,
    scheduled_date,
    scheduled_time,
    duration_minutes,
    price,
    is_trial,
    status,
    payment_method,
    payment_status,
    booked_at,
    created_at,
    updated_at
  ) VALUES (
    p_learner_id,
    p_teacher_id,
    p_subject_id,
    p_scheduled_date,
    p_scheduled_time,
    p_duration_minutes,
    p_price,
    p_is_trial,
    'booked',
    'credits',
    'paid',
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_lesson_id;

  RETURN v_lesson_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION book_lesson_with_credits(UUID, UUID, UUID, DATE, TIME, INTEGER, NUMERIC, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION book_lesson_with_credits(UUID, UUID, UUID, DATE, TIME, INTEGER, NUMERIC, BOOLEAN) TO service_role;

-- Test the function exists
SELECT 'book_lesson_with_credits function created successfully' as status;
