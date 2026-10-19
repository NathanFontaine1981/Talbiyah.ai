-- Track notification status on khutba_insights so admins can see, and
-- re-send, notifications from the Insights Library after leaving the
-- creation page (previously this state only lived in transient React
-- state on KhutbaReflections.tsx and was lost as soon as the admin
-- navigated away or refreshed).
ALTER TABLE khutba_insights
  ADD COLUMN IF NOT EXISTS notified_dashboard_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS notified_email_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS notified_email_count INTEGER;
