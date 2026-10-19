-- Create enum for template types
CREATE TYPE insight_template_type AS ENUM ('quran', 'arabic', 'reverts');

-- Create admin_generated_insights table
CREATE TABLE IF NOT EXISTS admin_generated_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type insight_template_type NOT NULL,
  title TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  student_name TEXT, -- nullable for non-personalized PDFs
  lesson_date DATE NOT NULL,
  duration_minutes INTEGER,
  subject_tags TEXT[], -- array of tags like ['tajweed', 'memorization']
  transcript TEXT NOT NULL,
  generated_content JSONB NOT NULL, -- structured JSON from AI
  pdf_url TEXT, -- URL to PDF in Supabase Storage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for efficient querying
CREATE INDEX idx_admin_generated_insights_template ON admin_generated_insights(template_type);
CREATE INDEX idx_admin_generated_insights_created_at ON admin_generated_insights(created_at DESC);
CREATE INDEX idx_admin_generated_insights_created_by ON admin_generated_insights(created_by);

-- Create storage bucket for generated PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-insights',
  'generated-insights',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf']::text[]
) ON CONFLICT (id) DO NOTHING;

-- RLS policies
ALTER TABLE admin_generated_insights ENABLE ROW LEVEL SECURITY;

-- Only admins can view all insights
CREATE POLICY "Admins can view all insights"
  ON admin_generated_insights FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles @> ARRAY['admin']::text[]
    )
  );

-- Only admins can insert insights
CREATE POLICY "Admins can insert insights"
  ON admin_generated_insights FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles @> ARRAY['admin']::text[]
    )
  );

-- Only admins can update insights
CREATE POLICY "Admins can update insights"
  ON admin_generated_insights FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles @> ARRAY['admin']::text[]
    )
  );

-- Only admins can delete insights
CREATE POLICY "Admins can delete insights"
  ON admin_generated_insights FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles @> ARRAY['admin']::text[]
    )
  );

-- Storage policies for generated-insights bucket
CREATE POLICY "Admins can upload PDFs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'generated-insights'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles @> ARRAY['admin']::text[]
    )
  );

CREATE POLICY "Anyone can view generated PDFs"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'generated-insights');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_admin_generated_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_generated_insights_timestamp
  BEFORE UPDATE ON admin_generated_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_generated_insights_updated_at();

-- Comment for documentation
COMMENT ON TABLE admin_generated_insights IS 'Stores manually generated lesson insights/PDFs created by admins from transcripts';
