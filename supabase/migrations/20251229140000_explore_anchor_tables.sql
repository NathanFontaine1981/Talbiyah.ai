-- Migration: Create Explore and Anchor onboarding flow tables
-- For tracking user journeys through Islam exploration and new Muslim foundations

-- Add completion tracking columns to profiles (roles column already exists)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS explore_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS anchor_completed BOOLEAN DEFAULT FALSE;

-- Explore progress tracking (for Non-Muslims exploring Islam)
CREATE TABLE IF NOT EXISTS explore_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_step INTEGER DEFAULT 0,
  axioms_agreed JSONB DEFAULT '[]'::JSONB,  -- Array of axiom IDs user has agreed with
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Anchor progress tracking (for New Muslims building foundations)
CREATE TABLE IF NOT EXISTS anchor_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_step INTEGER DEFAULT 0,
  facts_verified JSONB DEFAULT '[]'::JSONB,  -- Array of fact IDs user has verified
  probability_score DECIMAL(5,4) DEFAULT 0,   -- Compounding probability (0-1)
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE explore_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE anchor_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for explore_progress
CREATE POLICY "Users can view own explore progress" ON explore_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own explore progress" ON explore_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own explore progress" ON explore_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for anchor_progress
CREATE POLICY "Users can view own anchor progress" ON anchor_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own anchor progress" ON anchor_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own anchor progress" ON anchor_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_explore_progress_user_id ON explore_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_anchor_progress_user_id ON anchor_progress(user_id);
