-- User Suggestions & Feedback System
-- Allows users to submit ideas for improving the site

CREATE TABLE IF NOT EXISTS suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- Allow anonymous suggestions too
  name TEXT, -- For anonymous users
  email TEXT, -- For anonymous users or contact
  category TEXT NOT NULL CHECK (category IN (
    'feature_request',
    'bug_report',
    'content_suggestion',
    'ui_improvement',
    'teacher_feedback',
    'other'
  )),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'under_review',
    'planned',
    'in_progress',
    'completed',
    'declined'
  )),
  admin_notes TEXT,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a suggestion (including anonymous)
CREATE POLICY "Anyone can insert suggestions"
  ON suggestions FOR INSERT
  WITH CHECK (true);

-- Users can view their own suggestions
CREATE POLICY "Users can view own suggestions"
  ON suggestions FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all suggestions
CREATE POLICY "Admins can view all suggestions"
  ON suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'Admin' = ANY(profiles.roles)
    )
  );

-- Admins can update suggestions (status, notes, etc.)
CREATE POLICY "Admins can update suggestions"
  ON suggestions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'Admin' = ANY(profiles.roles)
    )
  );

-- Admins can delete suggestions
CREATE POLICY "Admins can delete suggestions"
  ON suggestions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'Admin' = ANY(profiles.roles)
    )
  );

-- Index for faster queries
CREATE INDEX idx_suggestions_user ON suggestions(user_id);
CREATE INDEX idx_suggestions_status ON suggestions(status);
CREATE INDEX idx_suggestions_category ON suggestions(category);
CREATE INDEX idx_suggestions_created ON suggestions(created_at DESC);
