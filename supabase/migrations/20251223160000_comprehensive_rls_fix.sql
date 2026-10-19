-- Comprehensive RLS Fix Migration
-- This migration ensures all tables have RLS enabled and proper policies

-- ==========================================
-- ENABLE RLS ON ALL PUBLIC TABLES
-- ==========================================

-- Core user tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learners ENABLE ROW LEVEL SECURITY;

-- Lesson related tables
ALTER TABLE IF EXISTS lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_content_flags ENABLE ROW LEVEL SECURITY;

-- Booking and scheduling
ALTER TABLE IF EXISTS bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teacher_availability ENABLE ROW LEVEL SECURITY;

-- Referral system
ALTER TABLE IF EXISTS referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS referral_transactions ENABLE ROW LEVEL SECURITY;

-- Subjects and curriculum
ALTER TABLE IF EXISTS subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS curriculum_subjects ENABLE ROW LEVEL SECURITY;

-- Assessment and progress
ALTER TABLE IF EXISTS diagnostic_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quran_progress ENABLE ROW LEVEL SECURITY;

-- Reviews and feedback
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teacher_reviews ENABLE ROW LEVEL SECURITY;

-- Islamic content
ALTER TABLE IF EXISTS saved_khutbahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS khutba_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS imam_conversations ENABLE ROW LEVEL SECURITY;

-- Notifications and messages
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;

-- Credits and payments
ALTER TABLE IF EXISTS credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS credits ENABLE ROW LEVEL SECURITY;

-- Admin tables
ALTER TABLE IF EXISTS admin_alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS insight_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_generated_insights ENABLE ROW LEVEL SECURITY;

-- Rate limiting
ALTER TABLE IF EXISTS rate_limits ENABLE ROW LEVEL SECURITY;

-- Misc tables
ALTER TABLE IF EXISTS api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recordings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PROFILES TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can view other profiles" ON profiles;
CREATE POLICY "Users can view other profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ==========================================
-- TEACHER PROFILES POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Anyone can view approved teachers" ON teacher_profiles;
CREATE POLICY "Anyone can view approved teachers"
  ON teacher_profiles FOR SELECT
  TO authenticated
  USING (approval_status = 'approved' OR id = auth.uid());

DROP POLICY IF EXISTS "Teachers can update own profile" ON teacher_profiles;
CREATE POLICY "Teachers can update own profile"
  ON teacher_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Teachers can insert own profile" ON teacher_profiles;
CREATE POLICY "Teachers can insert own profile"
  ON teacher_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all teacher profiles" ON teacher_profiles;
CREATE POLICY "Admins can manage all teacher profiles"
  ON teacher_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND 'admin' = ANY(profiles.roles))
  );

-- ==========================================
-- LEARNERS TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Parents can view own learners" ON learners;
CREATE POLICY "Parents can view own learners"
  ON learners FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents can manage own learners" ON learners;
CREATE POLICY "Parents can manage own learners"
  ON learners FOR ALL
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all learners" ON learners;
CREATE POLICY "Admins can manage all learners"
  ON learners FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND 'admin' = ANY(profiles.roles))
  );

-- ==========================================
-- LESSONS TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can view own lessons" ON lessons;
CREATE POLICY "Users can view own lessons"
  ON lessons FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid()
    OR learner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM learners WHERE learners.id = lessons.learner_id AND learners.parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create lessons" ON lessons;
CREATE POLICY "Users can create lessons"
  ON lessons FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    OR learner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM learners WHERE learners.id = lessons.learner_id AND learners.parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own lessons" ON lessons;
CREATE POLICY "Users can update own lessons"
  ON lessons FOR UPDATE
  TO authenticated
  USING (
    teacher_id = auth.uid()
    OR learner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM learners WHERE learners.id = lessons.learner_id AND learners.parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage all lessons" ON lessons;
CREATE POLICY "Admins can manage all lessons"
  ON lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND 'admin' = ANY(profiles.roles))
  );

-- ==========================================
-- LESSON INSIGHTS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can view own lesson insights" ON lesson_insights;
CREATE POLICY "Users can view own lesson insights"
  ON lesson_insights FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid()
    OR learner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM lessons l
      JOIN learners lr ON l.learner_id = lr.id
      WHERE l.id = lesson_insights.lesson_id AND lr.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can manage insights" ON lesson_insights;
CREATE POLICY "Service role can manage insights"
  ON lesson_insights FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- LESSON DETAILS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can view own lesson details" ON lesson_details;
CREATE POLICY "Users can view own lesson details"
  ON lesson_details FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = lesson_details.lesson_id
      AND (lessons.teacher_id = auth.uid() OR lessons.learner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role can manage lesson details" ON lesson_details;
CREATE POLICY "Service role can manage lesson details"
  ON lesson_details FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- LESSON MESSAGES POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can view own lesson messages" ON lesson_messages;
CREATE POLICY "Users can view own lesson messages"
  ON lesson_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = lesson_messages.lesson_id
      AND (lessons.teacher_id = auth.uid() OR lessons.learner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send lesson messages" ON lesson_messages;
CREATE POLICY "Users can send lesson messages"
  ON lesson_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = lesson_messages.lesson_id
      AND (lessons.teacher_id = auth.uid() OR lessons.learner_id = auth.uid())
    )
  );

-- ==========================================
-- BOOKINGS TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR teacher_id = auth.uid()
    OR EXISTS (SELECT 1 FROM learners WHERE learners.id = bookings.student_id AND learners.parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid()
    OR teacher_id = auth.uid()
    OR EXISTS (SELECT 1 FROM learners WHERE learners.id = bookings.student_id AND learners.parent_id = auth.uid())
  );

-- ==========================================
-- AVAILABILITY POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Anyone can view teacher availability" ON availability;
CREATE POLICY "Anyone can view teacher availability"
  ON availability FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Teachers can manage own availability" ON availability;
CREATE POLICY "Teachers can manage own availability"
  ON availability FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view teacher availability slots" ON teacher_availability;
CREATE POLICY "Anyone can view teacher availability slots"
  ON teacher_availability FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Teachers can manage own availability slots" ON teacher_availability;
CREATE POLICY "Teachers can manage own availability slots"
  ON teacher_availability FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- ==========================================
-- REFERRALS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can view own referrals as referrer" ON referrals;
CREATE POLICY "Users can view own referrals as referrer"
  ON referrals FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create referrals" ON referrals;
CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage referrals" ON referrals;
CREATE POLICY "Service role can manage referrals"
  ON referrals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- REFERRAL TRANSACTIONS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can view own referral transactions" ON referral_transactions;
CREATE POLICY "Users can view own referral transactions"
  ON referral_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage referral transactions" ON referral_transactions;
CREATE POLICY "Service role can manage referral transactions"
  ON referral_transactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- SUBJECTS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Anyone can view subjects" ON subjects;
CREATE POLICY "Anyone can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;
CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND 'admin' = ANY(profiles.roles))
  );

DROP POLICY IF EXISTS "Anyone can view curriculum subjects" ON curriculum_subjects;
CREATE POLICY "Anyone can view curriculum subjects"
  ON curriculum_subjects FOR SELECT
  TO authenticated
  USING (true);

-- ==========================================
-- DIAGNOSTIC ASSESSMENTS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can view own assessments" ON diagnostic_assessments;
CREATE POLICY "Users can view own assessments"
  ON diagnostic_assessments FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR teacher_id = auth.uid()
    OR EXISTS (SELECT 1 FROM learners WHERE learners.id = diagnostic_assessments.student_id AND learners.parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create assessments" ON diagnostic_assessments;
CREATE POLICY "Users can create assessments"
  ON diagnostic_assessments FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid() OR teacher_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own assessments" ON diagnostic_assessments;
CREATE POLICY "Users can update own assessments"
  ON diagnostic_assessments FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid()
    OR teacher_id = auth.uid()
    OR EXISTS (SELECT 1 FROM learners WHERE learners.id = diagnostic_assessments.student_id AND learners.parent_id = auth.uid())
  );

-- ==========================================
-- QURAN PROGRESS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can view own quran progress" ON quran_progress;
CREATE POLICY "Users can view own quran progress"
  ON quran_progress FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own quran progress" ON quran_progress;
CREATE POLICY "Users can manage own quran progress"
  ON quran_progress FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ==========================================
-- REVIEWS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view teacher reviews" ON teacher_reviews;
CREATE POLICY "Anyone can view teacher reviews"
  ON teacher_reviews FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can manage own teacher reviews" ON teacher_reviews;
CREATE POLICY "Users can manage own teacher reviews"
  ON teacher_reviews FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ==========================================
-- KHUTBAH/ISLAMIC CONTENT POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can view own saved khutbahs" ON saved_khutbahs;
CREATE POLICY "Users can view own saved khutbahs"
  ON saved_khutbahs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own saved khutbahs" ON saved_khutbahs;
CREATE POLICY "Users can manage own saved khutbahs"
  ON saved_khutbahs FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own khutba insights" ON khutba_insights;
CREATE POLICY "Users can view own khutba insights"
  ON khutba_insights FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own khutba insights" ON khutba_insights;
CREATE POLICY "Users can manage own khutba insights"
  ON khutba_insights FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own imam conversations" ON imam_conversations;
CREATE POLICY "Users can view own imam conversations"
  ON imam_conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own imam conversations" ON imam_conversations;
CREATE POLICY "Users can manage own imam conversations"
  ON imam_conversations FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- NOTIFICATIONS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage notifications" ON notifications;
CREATE POLICY "Service role can manage notifications"
  ON notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- CREDITS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can view own credit purchases" ON credit_purchases;
CREATE POLICY "Users can view own credit purchases"
  ON credit_purchases FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage credit purchases" ON credit_purchases;
CREATE POLICY "Service role can manage credit purchases"
  ON credit_purchases FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- ADMIN TABLES POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Admins can view insight templates" ON insight_templates;
CREATE POLICY "Admins can view insight templates"
  ON insight_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND 'admin' = ANY(profiles.roles))
  );

DROP POLICY IF EXISTS "Admins can manage insight templates" ON insight_templates;
CREATE POLICY "Admins can manage insight templates"
  ON insight_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND 'admin' = ANY(profiles.roles))
  );

DROP POLICY IF EXISTS "Admins can view admin generated insights" ON admin_generated_insights;
CREATE POLICY "Admins can view admin generated insights"
  ON admin_generated_insights FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND 'admin' = ANY(profiles.roles))
  );

DROP POLICY IF EXISTS "Admins can manage admin generated insights" ON admin_generated_insights;
CREATE POLICY "Admins can manage admin generated insights"
  ON admin_generated_insights FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND 'admin' = ANY(profiles.roles))
  );

-- ==========================================
-- RATE LIMITS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Service role can manage rate limits" ON rate_limits;
CREATE POLICY "Service role can manage rate limits"
  ON rate_limits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- USER PREFERENCES POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- PUBLIC ACCESS FOR UNAUTHENTICATED USERS
-- ==========================================

-- Allow public to view approved teacher profiles (for browse page)
DROP POLICY IF EXISTS "Public can view approved teachers" ON teacher_profiles;
CREATE POLICY "Public can view approved teachers"
  ON teacher_profiles FOR SELECT
  TO anon
  USING (approval_status = 'approved');

-- Allow public to view subjects
DROP POLICY IF EXISTS "Public can view subjects" ON subjects;
CREATE POLICY "Public can view subjects"
  ON subjects FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Public can view curriculum subjects" ON curriculum_subjects;
CREATE POLICY "Public can view curriculum subjects"
  ON curriculum_subjects FOR SELECT
  TO anon
  USING (true);

-- ==========================================
-- SERVICE ROLE FULL ACCESS (for Edge Functions)
-- ==========================================

-- Ensure service role has full access to critical tables
DO $$
BEGIN
  -- These tables need service role access for Edge Functions
  EXECUTE 'DROP POLICY IF EXISTS "Service role full access profiles" ON profiles';
  EXECUTE 'CREATE POLICY "Service role full access profiles" ON profiles FOR ALL TO service_role USING (true) WITH CHECK (true)';

  EXECUTE 'DROP POLICY IF EXISTS "Service role full access lessons" ON lessons';
  EXECUTE 'CREATE POLICY "Service role full access lessons" ON lessons FOR ALL TO service_role USING (true) WITH CHECK (true)';

  EXECUTE 'DROP POLICY IF EXISTS "Service role full access teacher_profiles" ON teacher_profiles';
  EXECUTE 'CREATE POLICY "Service role full access teacher_profiles" ON teacher_profiles FOR ALL TO service_role USING (true) WITH CHECK (true)';

  EXECUTE 'DROP POLICY IF EXISTS "Service role full access learners" ON learners';
  EXECUTE 'CREATE POLICY "Service role full access learners" ON learners FOR ALL TO service_role USING (true) WITH CHECK (true)';

  EXECUTE 'DROP POLICY IF EXISTS "Service role full access bookings" ON bookings';
  EXECUTE 'CREATE POLICY "Service role full access bookings" ON bookings FOR ALL TO service_role USING (true) WITH CHECK (true)';

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Some service role policies may already exist or table does not exist';
END $$;
