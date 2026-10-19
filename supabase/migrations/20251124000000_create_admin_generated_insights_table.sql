-- Create admin_generated_insights table for storing manually generated PDF insights
CREATE TABLE IF NOT EXISTS admin_generated_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL CHECK (template_type IN ('quran', 'arabic', 'reverts')),
  title TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  student_name TEXT,
  lesson_date DATE NOT NULL,
  duration_minutes INTEGER,
  transcript TEXT NOT NULL,
  generated_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX idx_admin_generated_insights_template_type ON admin_generated_insights(template_type);
CREATE INDEX idx_admin_generated_insights_created_by ON admin_generated_insights(created_by);
CREATE INDEX idx_admin_generated_insights_created_at ON admin_generated_insights(created_at DESC);
CREATE INDEX idx_admin_generated_insights_lesson_date ON admin_generated_insights(lesson_date DESC);

-- Enable RLS
ALTER TABLE admin_generated_insights ENABLE ROW LEVEL SECURITY;

-- Only admins can access this table
CREATE POLICY "Admins can do everything on admin_generated_insights"
  ON admin_generated_insights
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_admin_generated_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_generated_insights_updated_at
  BEFORE UPDATE ON admin_generated_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_generated_insights_updated_at();

-- Create storage bucket for generated PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-insights-pdfs',
  'generated-insights-pdfs',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for generated PDFs bucket
CREATE POLICY "Admins can upload generated insight PDFs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'generated-insights-pdfs'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

CREATE POLICY "Anyone can read generated insight PDFs"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'generated-insights-pdfs');

CREATE POLICY "Admins can delete generated insight PDFs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'generated-insights-pdfs'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );
