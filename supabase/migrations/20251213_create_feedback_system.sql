-- Create feedback/suggestions table
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'suggestion',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Add check constraint for category
ALTER TABLE user_feedback ADD CONSTRAINT user_feedback_category_check
  CHECK (category IN ('suggestion', 'bug', 'feature_request', 'complaint', 'praise', 'other'));

-- Add check constraint for status
ALTER TABLE user_feedback ADD CONSTRAINT user_feedback_status_check
  CHECK (status IN ('pending', 'in_review', 'resolved', 'wont_fix', 'duplicate'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON user_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert feedback
CREATE POLICY "Users can submit feedback" ON user_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback" ON user_feedback
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
  );

-- Admins can update feedback (change status, add notes)
CREATE POLICY "Admins can update feedback" ON user_feedback
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
  );

-- Comment for documentation
COMMENT ON TABLE user_feedback IS 'Stores user feedback, suggestions, and bug reports';
