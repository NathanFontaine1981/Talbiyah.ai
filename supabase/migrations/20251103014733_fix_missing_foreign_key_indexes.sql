/*
  # Fix Missing Foreign Key Indexes

  1. Performance Optimization
    - Add indexes for all foreign keys that are missing covering indexes
    - This improves JOIN performance and foreign key constraint checks
  
  2. Affected Tables
    - cart_items (subject_id)
    - learners (parent_id)
    - lesson_messages (lesson_id, receiver_id, sender_id)
    - lesson_progress_tracker (subject_id)
    - lessons (learner_id, subject_id, teacher_id)
    - profiles (referred_by)
    - teacher_availability_one_off (teacher_id)
    - teacher_availability_recurring (teacher_id)
    - teacher_subjects (subject_id)
  
  3. Notes
    - Each index is created with IF NOT EXISTS to prevent errors
    - Indexes follow naming convention: idx_tablename_columnname
*/

-- Cart Items
CREATE INDEX IF NOT EXISTS idx_cart_items_subject_id ON public.cart_items(subject_id);

-- Learners
CREATE INDEX IF NOT EXISTS idx_learners_parent_id ON public.learners(parent_id);

-- Lesson Messages
CREATE INDEX IF NOT EXISTS idx_lesson_messages_lesson_id ON public.lesson_messages(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_messages_receiver_id ON public.lesson_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_lesson_messages_sender_id ON public.lesson_messages(sender_id);

-- Lesson Progress Tracker
CREATE INDEX IF NOT EXISTS idx_lesson_progress_tracker_subject_id ON public.lesson_progress_tracker(subject_id);

-- Lessons
CREATE INDEX IF NOT EXISTS idx_lessons_learner_id ON public.lessons(learner_id);
CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON public.lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_id ON public.lessons(teacher_id);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- Teacher Availability One-Off
CREATE INDEX IF NOT EXISTS idx_teacher_availability_one_off_teacher_id ON public.teacher_availability_one_off(teacher_id);

-- Teacher Availability Recurring
CREATE INDEX IF NOT EXISTS idx_teacher_availability_recurring_teacher_id ON public.teacher_availability_recurring(teacher_id);

-- Teacher Subjects
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject_id ON public.teacher_subjects(subject_id);
