-- Create bookings table for admin interface
-- This table is separate from the lessons table and is used for session bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    price INTEGER DEFAULT 0, -- Price in pence (£15.00 = 1500)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('scheduled', 'confirmed', 'pending', 'completed', 'cancelled')),
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'failed')),
    room_id TEXT,
    teacher_room_code TEXT,
    student_room_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_teacher ON bookings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_bookings_student ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_subject ON bookings(subject_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can view bookings (for admin dashboard)
CREATE POLICY "Anyone can view bookings"
    ON bookings FOR SELECT
    USING (true);

-- Authenticated users can create bookings
CREATE POLICY "Authenticated users can create bookings"
    ON bookings FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Users can update their own bookings (student or teacher)
CREATE POLICY "Users can update their bookings"
    ON bookings FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = teacher_id
        OR auth.uid() = student_id
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND roles @> ARRAY['admin']::text[]
        )
    );

-- Users can delete their own bookings or admins can delete
CREATE POLICY "Users can delete their bookings"
    ON bookings FOR DELETE
    TO authenticated
    USING (
        auth.uid() = teacher_id
        OR auth.uid() = student_id
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND roles @> ARRAY['admin']::text[]
        )
    );

-- Trigger to update updated_at
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
