-- "Talbiyah Recommends" - curated YouTube video recommendations picked by
-- admins (the founder or team) for reverts/users, shown in a dedicated
-- public section with dashboard/email notification like khutba_insights.
CREATE TABLE IF NOT EXISTS curated_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  note TEXT,
  recommended_by TEXT DEFAULT 'Nathan Fontaine',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notified_dashboard_at TIMESTAMP WITH TIME ZONE,
  notified_email_at TIMESTAMP WITH TIME ZONE,
  notified_email_count INTEGER
);

ALTER TABLE curated_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active recommendations"
  ON curated_recommendations FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all recommendations"
  ON curated_recommendations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

CREATE INDEX IF NOT EXISTS idx_curated_recommendations_created_at ON curated_recommendations(created_at DESC);
