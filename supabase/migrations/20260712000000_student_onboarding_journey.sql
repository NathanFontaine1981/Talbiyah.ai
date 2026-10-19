-- Student "Your Journey" onboarding checklist (Jul 2026).
-- DB-driven items (edit copy/order without a deploy — mirrors the teacher
-- onboarding_checklist_items pattern) + per-user progress synced across devices.
-- Completion is written automatically by the dashboard card when real usage is
-- detected (booked lesson, viewed study notes, etc.). Idempotent.

CREATE TABLE IF NOT EXISTS student_onboarding_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key text UNIQUE NOT NULL,
  title text NOT NULL,
  parent_title text,          -- wording variant shown to parents (falls back to title)
  hook text NOT NULL,
  parent_hook text,
  icon text NOT NULL DEFAULT 'Sparkles',
  route text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE student_onboarding_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone signed in can read journey items" ON student_onboarding_items;
CREATE POLICY "Anyone signed in can read journey items" ON student_onboarding_items
  FOR SELECT TO authenticated USING (is_active);
DROP POLICY IF EXISTS "Admins manage journey items" ON student_onboarding_items;
CREATE POLICY "Admins manage journey items" ON student_onboarding_items
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND 'admin' = ANY (profiles.roles))
  );

CREATE TABLE IF NOT EXISTS student_onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'auto' CHECK (source IN ('auto', 'manual')),
  UNIQUE (user_id, item_key)
);

ALTER TABLE student_onboarding_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own journey progress" ON student_onboarding_progress;
CREATE POLICY "Users manage own journey progress" ON student_onboarding_progress
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Admins read all journey progress" ON student_onboarding_progress;
CREATE POLICY "Admins read all journey progress" ON student_onboarding_progress
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND 'admin' = ANY (profiles.roles))
  );

-- Seed the 8 journey items (refresh copy on re-run)
INSERT INTO student_onboarding_items (item_key, title, parent_title, hook, parent_hook, icon, route, sort_order) VALUES
  ('quran_tracker', 'Set up your Qur''an tracker', 'Set up your child''s Qur''an tracker',
   'Tell your Daily Companion what you''ve memorised — it then plans every day: what to review, what to recite in prayer, what to learn next.',
   'Record what your child has memorised — their Daily Companion then plans reviews and prayer recitation every day.',
   'BookOpen', '/progress/quran', 1),
  ('diagnostic', 'Take your 5-minute diagnostic', 'Take your child''s 5-minute diagnostic',
   'So your teacher knows exactly where to start you — no wasted lessons.',
   'So their teacher knows exactly where to start — no wasted lessons.',
   'ClipboardCheck', '/diagnostic/start', 2),
  ('first_lesson', 'Book your first lesson', 'Book your child''s first lesson',
   '1-on-1 Qur''an & Arabic with hand-picked teachers. We teach for depth, not speed.',
   '1-on-1 Qur''an & Arabic with hand-picked teachers. We teach for depth, not speed.',
   'CalendarPlus', '/teachers', 3),
  ('study_notes', 'Meet your Study Notes', 'Meet the Study Notes',
   'About 15 minutes after every lesson, personalised notes and quizzes appear. Visit them 10 minutes a day — by next lesson it''s in your heart.',
   'About 15 minutes after every lesson, personalised notes and quizzes appear for your child — 10 minutes a day locks it in.',
   'FileText', '/insights-library', 4),
  ('salah', 'Learn to pray, step by step', 'The Salah tutorial, step by step',
   'The full Salah tutorial — every position, every word, at your own pace.',
   'Every position, every word, at their own pace — perfect for revising together.',
   'Moon', '/salah', 5),
  ('foundations', 'Build unshakable foundations', 'Explore Unshakable Foundations',
   'Why we believe what we believe — evidence, history, and certainty.',
   'Why we believe what we believe — brilliant for answering your child''s big questions.',
   'Landmark', '/new-muslim', 6),
  ('dua', 'Build your own du''ā', 'Build a du''ā together',
   'Craft a personal du''ā for anything you''re facing, built from authentic words.',
   'Craft a personal du''ā together for anything your family is facing.',
   'HeartHandshake', '/dua-builder', 7),
  ('daily_habit', 'Come back tomorrow', 'Make it a daily habit',
   'Daily streaks build hearts. A little every day beats a lot once a week.',
   'Daily streaks build hearts. A little every day beats a lot once a week.',
   'Flame', '/dashboard', 8)
ON CONFLICT (item_key) DO UPDATE SET
  title = EXCLUDED.title, parent_title = EXCLUDED.parent_title,
  hook = EXCLUDED.hook, parent_hook = EXCLUDED.parent_hook,
  icon = EXCLUDED.icon, route = EXCLUDED.route, sort_order = EXCLUDED.sort_order;
