-- Per-user dashboard widget visibility, so the dashboard can start minimal
-- for new users (just Prayer Times + Upcoming Lessons, which stay outside
-- this system as fixed core) and let anyone reveal/hide the rest from a
-- discovery page. NULL means "not customized yet" - the app falls back to
-- an empty set for brand-new users and the full legacy set for everyone
-- else, so existing users don't lose widgets they're used to seeing.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dashboard_widgets JSONB DEFAULT NULL;
