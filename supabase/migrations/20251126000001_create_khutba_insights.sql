-- Create khutba_insights table for storing Khutbah Reflections
CREATE TABLE IF NOT EXISTS khutba_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  speaker TEXT,
  location TEXT,
  khutba_date DATE,
  original_text TEXT,
  insights JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_public BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE khutba_insights ENABLE ROW LEVEL SECURITY;

-- Policy for reading public insights
CREATE POLICY "Anyone can view public khutba insights"
  ON khutba_insights FOR SELECT
  USING (is_public = true);

-- Policy for creators to manage their own insights  
CREATE POLICY "Users can manage their own khutba insights"
  ON khutba_insights FOR ALL
  USING (created_by = auth.uid());

-- Policy for admins to manage all insights
CREATE POLICY "Admins can manage all khutba insights"
  ON khutba_insights FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_khutba_insights_khutba_date ON khutba_insights(khutba_date DESC);
CREATE INDEX IF NOT EXISTS idx_khutba_insights_created_by ON khutba_insights(created_by);
