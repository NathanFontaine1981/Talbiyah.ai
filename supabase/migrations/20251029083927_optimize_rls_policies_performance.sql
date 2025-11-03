/*
  # Optimize RLS Policies Performance

  1. Overview
    - Fix performance issues in all RLS policies across the database
    - Replace `auth.uid()` with `(select auth.uid())` to prevent re-evaluation for each row
    - This optimization significantly improves query performance at scale

  2. Tables Updated
    - profiles: 3 policies optimized
    - learners: 4 policies optimized
    - subjects: 3 policies optimized
    - teacher_profiles: 6 policies optimized
    - teacher_subjects: 4 policies optimized
    - teacher_availability_recurring: 5 policies optimized
    - teacher_availability_one_off: 5 policies optimized
    - lessons: 9 policies optimized
    - talbiyah_insights: 6 policies optimized
    - lesson_progress_tracker: 8 policies optimized
    - lesson_messages: 7 policies optimized
    - matchmaking_profiles: 7 policies optimized

  3. Performance Impact
    - Prevents auth function re-evaluation for each row in result set
    - Dramatically improves query performance for large datasets
    - Recommended by Supabase best practices
*/

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- =====================================================
-- LEARNERS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Parents can read own learners" ON public.learners;
CREATE POLICY "Parents can read own learners"
  ON public.learners FOR SELECT
  TO authenticated
  USING (parent_id = (select auth.uid()));

DROP POLICY IF EXISTS "Parents can insert own learners" ON public.learners;
CREATE POLICY "Parents can insert own learners"
  ON public.learners FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = (select auth.uid()));

DROP POLICY IF EXISTS "Parents can update own learners" ON public.learners;
CREATE POLICY "Parents can update own learners"
  ON public.learners FOR UPDATE
  TO authenticated
  USING (parent_id = (select auth.uid()))
  WITH CHECK (parent_id = (select auth.uid()));

DROP POLICY IF EXISTS "Parents can delete own learners" ON public.learners;
CREATE POLICY "Parents can delete own learners"
  ON public.learners FOR DELETE
  TO authenticated
  USING (parent_id = (select auth.uid()));

-- =====================================================
-- SUBJECTS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admin users can insert subjects" ON public.subjects;
CREATE POLICY "Admin users can insert subjects"
  ON public.subjects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can update subjects" ON public.subjects;
CREATE POLICY "Admin users can update subjects"
  ON public.subjects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can delete subjects" ON public.subjects;
CREATE POLICY "Admin users can delete subjects"
  ON public.subjects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- =====================================================
-- TEACHER_PROFILES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can read own teacher profile" ON public.teacher_profiles;
CREATE POLICY "Users can read own teacher profile"
  ON public.teacher_profiles FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own teacher profile" ON public.teacher_profiles;
CREATE POLICY "Users can insert own teacher profile"
  ON public.teacher_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own teacher profile" ON public.teacher_profiles;
CREATE POLICY "Users can update own teacher profile"
  ON public.teacher_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admin users can read all teacher profiles" ON public.teacher_profiles;
CREATE POLICY "Admin users can read all teacher profiles"
  ON public.teacher_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can update teacher profiles" ON public.teacher_profiles;
CREATE POLICY "Admin users can update teacher profiles"
  ON public.teacher_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can delete teacher profiles" ON public.teacher_profiles;
CREATE POLICY "Admin users can delete teacher profiles"
  ON public.teacher_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- =====================================================
-- TEACHER_SUBJECTS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Teachers can read own subject assignments" ON public.teacher_subjects;
CREATE POLICY "Teachers can read own subject assignments"
  ON public.teacher_subjects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE teacher_profiles.id = teacher_subjects.teacher_id
      AND teacher_profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admin users can read all subject assignments" ON public.teacher_subjects;
CREATE POLICY "Admin users can read all subject assignments"
  ON public.teacher_subjects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can insert subject assignments" ON public.teacher_subjects;
CREATE POLICY "Admin users can insert subject assignments"
  ON public.teacher_subjects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can delete subject assignments" ON public.teacher_subjects;
CREATE POLICY "Admin users can delete subject assignments"
  ON public.teacher_subjects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- =====================================================
-- TEACHER_AVAILABILITY_RECURRING TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Teachers can read own recurring availability" ON public.teacher_availability_recurring;
CREATE POLICY "Teachers can read own recurring availability"
  ON public.teacher_availability_recurring FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_recurring.teacher_id
      AND teacher_profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers can insert own recurring availability" ON public.teacher_availability_recurring;
CREATE POLICY "Teachers can insert own recurring availability"
  ON public.teacher_availability_recurring FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_recurring.teacher_id
      AND teacher_profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers can update own recurring availability" ON public.teacher_availability_recurring;
CREATE POLICY "Teachers can update own recurring availability"
  ON public.teacher_availability_recurring FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_recurring.teacher_id
      AND teacher_profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers can delete own recurring availability" ON public.teacher_availability_recurring;
CREATE POLICY "Teachers can delete own recurring availability"
  ON public.teacher_availability_recurring FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_recurring.teacher_id
      AND teacher_profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admin users can read all recurring availability" ON public.teacher_availability_recurring;
CREATE POLICY "Admin users can read all recurring availability"
  ON public.teacher_availability_recurring FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- =====================================================
-- TEACHER_AVAILABILITY_ONE_OFF TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Teachers can read own one-off availability" ON public.teacher_availability_one_off;
CREATE POLICY "Teachers can read own one-off availability"
  ON public.teacher_availability_one_off FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_one_off.teacher_id
      AND teacher_profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers can insert own one-off availability" ON public.teacher_availability_one_off;
CREATE POLICY "Teachers can insert own one-off availability"
  ON public.teacher_availability_one_off FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_one_off.teacher_id
      AND teacher_profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers can update own one-off availability" ON public.teacher_availability_one_off;
CREATE POLICY "Teachers can update own one-off availability"
  ON public.teacher_availability_one_off FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_one_off.teacher_id
      AND teacher_profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers can delete own one-off availability" ON public.teacher_availability_one_off;
CREATE POLICY "Teachers can delete own one-off availability"
  ON public.teacher_availability_one_off FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_one_off.teacher_id
      AND teacher_profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admin users can read all one-off availability" ON public.teacher_availability_one_off;
CREATE POLICY "Admin users can read all one-off availability"
  ON public.teacher_availability_one_off FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- =====================================================
-- LESSONS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Parents can read own learners lessons" ON public.lessons;
CREATE POLICY "Parents can read own learners lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.learners
      WHERE learners.id = lessons.learner_id
      AND learners.parent_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers can read their lessons" ON public.lessons;
CREATE POLICY "Teachers can read their lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE teacher_profiles.id = lessons.teacher_id
      AND teacher_profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Parents can insert own learners lessons" ON public.lessons;
CREATE POLICY "Parents can insert own learners lessons"
  ON public.lessons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.learners
      WHERE learners.id = lessons.learner_id
      AND learners.parent_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Parents can update own learners lessons" ON public.lessons;
CREATE POLICY "Parents can update own learners lessons"
  ON public.lessons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.learners
      WHERE learners.id = lessons.learner_id
      AND learners.parent_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers can update their lessons" ON public.lessons;
CREATE POLICY "Teachers can update their lessons"
  ON public.lessons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE teacher_profiles.id = lessons.teacher_id
      AND teacher_profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admin users can read all lessons" ON public.lessons;
CREATE POLICY "Admin users can read all lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can insert lessons" ON public.lessons;
CREATE POLICY "Admin users can insert lessons"
  ON public.lessons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can update all lessons" ON public.lessons;
CREATE POLICY "Admin users can update all lessons"
  ON public.lessons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can delete lessons" ON public.lessons;
CREATE POLICY "Admin users can delete lessons"
  ON public.lessons FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- =====================================================
-- TALBIYAH_INSIGHTS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Parents can read own learners lesson insights" ON public.talbiyah_insights;
CREATE POLICY "Parents can read own learners lesson insights"
  ON public.talbiyah_insights FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.learners ON learners.id = lessons.learner_id
      WHERE lessons.id = talbiyah_insights.lesson_id
      AND learners.parent_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers can read their lesson insights" ON public.talbiyah_insights;
CREATE POLICY "Teachers can read their lesson insights"
  ON public.talbiyah_insights FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.teacher_profiles ON teacher_profiles.id = lessons.teacher_id
      WHERE lessons.id = talbiyah_insights.lesson_id
      AND teacher_profiles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admin users can read all insights" ON public.talbiyah_insights;
CREATE POLICY "Admin users can read all insights"
  ON public.talbiyah_insights FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can insert insights" ON public.talbiyah_insights;
CREATE POLICY "Admin users can insert insights"
  ON public.talbiyah_insights FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can update insights" ON public.talbiyah_insights;
CREATE POLICY "Admin users can update insights"
  ON public.talbiyah_insights FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can delete insights" ON public.talbiyah_insights;
CREATE POLICY "Admin users can delete insights"
  ON public.talbiyah_insights FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- =====================================================
-- LESSON_PROGRESS_TRACKER TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Parents can read own learners progress" ON public.lesson_progress_tracker;
CREATE POLICY "Parents can read own learners progress"
  ON public.lesson_progress_tracker FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.learners
      WHERE learners.id = lesson_progress_tracker.learner_id
      AND learners.parent_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers can read learner progress" ON public.lesson_progress_tracker;
CREATE POLICY "Teachers can read learner progress"
  ON public.lesson_progress_tracker FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      JOIN public.teacher_subjects ON teacher_subjects.teacher_id = teacher_profiles.id
      WHERE teacher_profiles.user_id = (select auth.uid())
      AND teacher_subjects.subject_id = lesson_progress_tracker.subject_id
    )
  );

DROP POLICY IF EXISTS "Teachers can insert learner progress" ON public.lesson_progress_tracker;
CREATE POLICY "Teachers can insert learner progress"
  ON public.lesson_progress_tracker FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      JOIN public.teacher_subjects ON teacher_subjects.teacher_id = teacher_profiles.id
      WHERE teacher_profiles.user_id = (select auth.uid())
      AND teacher_subjects.subject_id = lesson_progress_tracker.subject_id
    )
  );

DROP POLICY IF EXISTS "Teachers can update learner progress" ON public.lesson_progress_tracker;
CREATE POLICY "Teachers can update learner progress"
  ON public.lesson_progress_tracker FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      JOIN public.teacher_subjects ON teacher_subjects.teacher_id = teacher_profiles.id
      WHERE teacher_profiles.user_id = (select auth.uid())
      AND teacher_subjects.subject_id = lesson_progress_tracker.subject_id
    )
  );

DROP POLICY IF EXISTS "Admin users can read all progress" ON public.lesson_progress_tracker;
CREATE POLICY "Admin users can read all progress"
  ON public.lesson_progress_tracker FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can insert progress" ON public.lesson_progress_tracker;
CREATE POLICY "Admin users can insert progress"
  ON public.lesson_progress_tracker FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can update all progress" ON public.lesson_progress_tracker;
CREATE POLICY "Admin users can update all progress"
  ON public.lesson_progress_tracker FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can delete progress" ON public.lesson_progress_tracker;
CREATE POLICY "Admin users can delete progress"
  ON public.lesson_progress_tracker FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- =====================================================
-- LESSON_MESSAGES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can read own messages" ON public.lesson_messages;
CREATE POLICY "Users can read own messages"
  ON public.lesson_messages FOR SELECT
  TO authenticated
  USING (sender_id = (select auth.uid()) OR receiver_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can send messages for their lessons" ON public.lesson_messages;
CREATE POLICY "Users can send messages for their lessons"
  ON public.lesson_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can mark own messages as read" ON public.lesson_messages;
CREATE POLICY "Users can mark own messages as read"
  ON public.lesson_messages FOR UPDATE
  TO authenticated
  USING (receiver_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admin users can read all messages" ON public.lesson_messages;
CREATE POLICY "Admin users can read all messages"
  ON public.lesson_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can insert messages" ON public.lesson_messages;
CREATE POLICY "Admin users can insert messages"
  ON public.lesson_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can update all messages" ON public.lesson_messages;
CREATE POLICY "Admin users can update all messages"
  ON public.lesson_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can delete messages" ON public.lesson_messages;
CREATE POLICY "Admin users can delete messages"
  ON public.lesson_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- =====================================================
-- MATCHMAKING_PROFILES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can read own matchmaking profile" ON public.matchmaking_profiles;
CREATE POLICY "Users can read own matchmaking profile"
  ON public.matchmaking_profiles FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own matchmaking profile" ON public.matchmaking_profiles;
CREATE POLICY "Users can insert own matchmaking profile"
  ON public.matchmaking_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile data" ON public.matchmaking_profiles;
CREATE POLICY "Users can update own profile data"
  ON public.matchmaking_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admin users can read all matchmaking profiles" ON public.matchmaking_profiles;
CREATE POLICY "Admin users can read all matchmaking profiles"
  ON public.matchmaking_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can insert matchmaking profiles" ON public.matchmaking_profiles;
CREATE POLICY "Admin users can insert matchmaking profiles"
  ON public.matchmaking_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can update all matchmaking profiles" ON public.matchmaking_profiles;
CREATE POLICY "Admin users can update all matchmaking profiles"
  ON public.matchmaking_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Admin users can delete matchmaking profiles" ON public.matchmaking_profiles;
CREATE POLICY "Admin users can delete matchmaking profiles"
  ON public.matchmaking_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );
