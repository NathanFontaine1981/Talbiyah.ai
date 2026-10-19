-- Add 100ms room columns to group_sessions table
ALTER TABLE group_sessions
ADD COLUMN IF NOT EXISTS "100ms_room_id" TEXT,
ADD COLUMN IF NOT EXISTS teacher_room_code TEXT,
ADD COLUMN IF NOT EXISTS student_room_code TEXT;

-- Add comments for documentation
COMMENT ON COLUMN group_sessions."100ms_room_id" IS '100ms room ID for the group session';
COMMENT ON COLUMN group_sessions.teacher_room_code IS '100ms room code for teacher (host role)';
COMMENT ON COLUMN group_sessions.student_room_code IS '100ms room code for all students (guest role)';

-- Create group_session_payments table to track payments for paid sessions
CREATE TABLE IF NOT EXISTS group_session_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_session_id UUID NOT NULL REFERENCES group_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    stripe_payment_intent_id TEXT,
    stripe_session_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_session_id, student_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_group_session_payments_session ON group_session_payments(group_session_id);
CREATE INDEX IF NOT EXISTS idx_group_session_payments_student ON group_session_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_group_session_payments_status ON group_session_payments(status);

-- Enable RLS
ALTER TABLE group_session_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_session_payments

-- Users can view their own payments, teachers can view payments for their sessions, admins can view all
CREATE POLICY "Users can view relevant payments"
    ON group_session_payments FOR SELECT
    TO authenticated
    USING (
        auth.uid() = student_id
        OR EXISTS (
            SELECT 1 FROM group_sessions gs
            WHERE gs.id = group_session_id
            AND (gs.teacher_id = auth.uid() OR gs.created_by = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND roles @> ARRAY['admin']::text[]
        )
    );

-- Only system (via service role) or admins can insert payments
CREATE POLICY "System can insert payments"
    ON group_session_payments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND roles @> ARRAY['admin']::text[]
        )
    );

-- Only admins can update payments
CREATE POLICY "Admins can update payments"
    ON group_session_payments FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND roles @> ARRAY['admin']::text[]
        )
    );

-- Create a function to check if a student has paid for a group session
CREATE OR REPLACE FUNCTION has_paid_for_group_session(p_group_session_id UUID, p_student_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    session_is_free BOOLEAN;
    payment_completed BOOLEAN;
BEGIN
    -- Check if session is free
    SELECT is_free INTO session_is_free
    FROM group_sessions
    WHERE id = p_group_session_id;

    -- If free, return true
    IF session_is_free THEN
        RETURN TRUE;
    END IF;

    -- Check for completed payment
    SELECT EXISTS (
        SELECT 1 FROM group_session_payments
        WHERE group_session_id = p_group_session_id
        AND student_id = p_student_id
        AND status = 'completed'
    ) INTO payment_completed;

    RETURN payment_completed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for students to see their enrolled sessions with access info
CREATE OR REPLACE VIEW student_group_session_access AS
SELECT
    gs.id as group_session_id,
    gs.name,
    gs.subject_id,
    s.name as subject_name,
    gs.teacher_id,
    t.full_name as teacher_name,
    gs.level,
    gs.schedule_day,
    gs.schedule_time,
    gs.duration_minutes,
    gs.start_date,
    gs.end_date,
    gs.is_free,
    gs.price_per_session,
    gs.description,
    gs.status as session_status,
    gs."100ms_room_id",
    gs.student_room_code,
    gsp.student_id,
    gsp.enrolled_at,
    CASE
        WHEN gs.is_free THEN TRUE
        WHEN gspm.status = 'completed' THEN TRUE
        ELSE FALSE
    END as has_access,
    gspm.status as payment_status
FROM group_sessions gs
JOIN group_session_participants gsp ON gs.id = gsp.group_session_id
JOIN profiles t ON gs.teacher_id = t.id
LEFT JOIN subjects s ON gs.subject_id = s.id
LEFT JOIN group_session_payments gspm ON gs.id = gspm.group_session_id AND gsp.student_id = gspm.student_id
WHERE gs.status != 'cancelled';
