-- Create group_sessions table
CREATE TABLE IF NOT EXISTS group_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    max_participants INTEGER NOT NULL DEFAULT 6,
    current_participants INTEGER NOT NULL DEFAULT 0,
    schedule_day TEXT NOT NULL,
    schedule_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    start_date DATE NOT NULL,
    end_date DATE,
    is_free BOOLEAN NOT NULL DEFAULT true,
    price_per_session INTEGER DEFAULT 0,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'closed', 'cancelled')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_session_participants table
CREATE TABLE IF NOT EXISTS group_session_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_session_id UUID NOT NULL REFERENCES group_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_session_id, student_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_sessions_teacher ON group_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_group_sessions_subject ON group_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_group_sessions_status ON group_sessions(status);
CREATE INDEX IF NOT EXISTS idx_group_sessions_created_by ON group_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_group_session_participants_session ON group_session_participants(group_session_id);
CREATE INDEX IF NOT EXISTS idx_group_session_participants_student ON group_session_participants(student_id);

-- Enable Row Level Security
ALTER TABLE group_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_session_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_sessions

-- Anyone can view group sessions
CREATE POLICY "Anyone can view group sessions"
    ON group_sessions FOR SELECT
    USING (true);

-- Only authenticated users can create group sessions
CREATE POLICY "Authenticated users can create group sessions"
    ON group_sessions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Users can update their own group sessions or if they're the teacher
CREATE POLICY "Users can update their own group sessions"
    ON group_sessions FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = created_by
        OR auth.uid() = teacher_id
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND roles @> ARRAY['admin']::text[]
        )
    );

-- Users can delete their own group sessions or admins can delete
CREATE POLICY "Users can delete their own group sessions"
    ON group_sessions FOR DELETE
    TO authenticated
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND roles @> ARRAY['admin']::text[]
        )
    );

-- RLS Policies for group_session_participants

-- Anyone can view participants
CREATE POLICY "Anyone can view participants"
    ON group_session_participants FOR SELECT
    USING (true);

-- Authenticated users can enroll themselves or admins can enroll anyone
CREATE POLICY "Users can enroll in sessions"
    ON group_session_participants FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = student_id
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND roles @> ARRAY['admin']::text[]
        )
        OR EXISTS (
            SELECT 1 FROM group_sessions
            WHERE id = group_session_id
            AND (teacher_id = auth.uid() OR created_by = auth.uid())
        )
    );

-- Users can remove themselves or admins/teachers can remove anyone
CREATE POLICY "Users can unenroll from sessions"
    ON group_session_participants FOR DELETE
    TO authenticated
    USING (
        auth.uid() = student_id
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND roles @> ARRAY['admin']::text[]
        )
        OR EXISTS (
            SELECT 1 FROM group_sessions
            WHERE id = group_session_id
            AND (teacher_id = auth.uid() OR created_by = auth.uid())
        )
    );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_sessions_updated_at
    BEFORE UPDATE ON group_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update current_participants count
CREATE OR REPLACE FUNCTION update_group_session_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE group_sessions
        SET current_participants = current_participants + 1
        WHERE id = NEW.group_session_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE group_sessions
        SET current_participants = current_participants - 1
        WHERE id = OLD.group_session_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_participant_count_on_insert
    AFTER INSERT ON group_session_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_group_session_participant_count();

CREATE TRIGGER update_participant_count_on_delete
    AFTER DELETE ON group_session_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_group_session_participant_count();

-- Auto-update status to 'full' when max_participants is reached
CREATE OR REPLACE FUNCTION update_group_session_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_participants >= NEW.max_participants AND NEW.status = 'open' THEN
        NEW.status = 'full';
    ELSIF NEW.current_participants < NEW.max_participants AND NEW.status = 'full' THEN
        NEW.status = 'open';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_session_status
    BEFORE UPDATE ON group_sessions
    FOR EACH ROW
    WHEN (OLD.current_participants IS DISTINCT FROM NEW.current_participants)
    EXECUTE FUNCTION update_group_session_status();
