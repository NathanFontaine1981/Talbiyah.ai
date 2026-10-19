/*
  # Create Arabic Syllabus Tables for Al-Arabiyyah Bayna Yadayk

  This migration creates the syllabus structure for tracking progress through
  Al-Arabiyyah Bayna Yadayk Book 1A and 1B (Beginner Arabic course)

  1. New Tables
    - `arabic_syllabus` - Reference table for all units/lessons in the books
    - `arabic_learner_progress` - Tracks individual learner progress through units

  2. Features
    - Predefined syllabus for Book 1A (Units 1-8) and Book 1B (Units 9-16)
    - 3-stage progress system: Understanding → Practice → Mastery
    - Teacher notes field for personalized feedback
    - Tracks vocabulary, grammar, and conversation skills per unit
*/

-- Create the Arabic syllabus reference table
CREATE TABLE IF NOT EXISTS arabic_syllabus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book TEXT NOT NULL CHECK (book IN ('1A', '1B', '2A', '2B', '3A', '3B')),
  unit_number INTEGER NOT NULL,
  unit_title_arabic TEXT NOT NULL,
  unit_title_english TEXT NOT NULL,
  unit_theme TEXT, -- Main theme of the unit
  key_vocabulary TEXT[], -- Main vocabulary words for the unit
  grammar_topics TEXT[], -- Grammar concepts covered
  conversation_topics TEXT[], -- Dialogue/conversation themes
  estimated_lessons INTEGER DEFAULT 3, -- Approximate lessons to complete
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (book, unit_number)
);

-- Create the learner progress table for Arabic
CREATE TABLE IF NOT EXISTS arabic_learner_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  syllabus_id UUID NOT NULL REFERENCES arabic_syllabus(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teacher_profiles(id),

  -- 3-Stage Progress System
  understanding_complete BOOLEAN DEFAULT FALSE, -- Can understand the vocabulary and concepts
  practice_complete BOOLEAN DEFAULT FALSE, -- Can use vocabulary in exercises
  mastery_complete BOOLEAN DEFAULT FALSE, -- Can use fluently in conversation

  -- Detailed tracking
  vocabulary_mastered INTEGER DEFAULT 0, -- Count of vocabulary words mastered
  grammar_mastered BOOLEAN DEFAULT FALSE,
  conversation_practiced BOOLEAN DEFAULT FALSE,

  -- Teacher feedback
  teacher_notes TEXT,
  last_lesson_date DATE,

  -- Status
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'needs_review')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (learner_id, syllabus_id)
);

-- Enable Row Level Security
ALTER TABLE arabic_syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE arabic_learner_progress ENABLE ROW LEVEL SECURITY;

-- Syllabus is readable by all authenticated users
CREATE POLICY "Authenticated users can read syllabus"
  ON arabic_syllabus
  FOR SELECT
  TO authenticated
  USING (true);

-- Parents can read their learners' progress
CREATE POLICY "Parents can read own learners Arabic progress"
  ON arabic_learner_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learners
      WHERE learners.id = arabic_learner_progress.learner_id
      AND learners.parent_id = auth.uid()
    )
  );

-- Teachers can read progress for their students
CREATE POLICY "Teachers can read Arabic progress"
  ON arabic_learner_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN teacher_profiles ON teacher_profiles.id = lessons.teacher_id
      WHERE lessons.learner_id = arabic_learner_progress.learner_id
      AND teacher_profiles.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = arabic_learner_progress.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Teachers can insert progress records
CREATE POLICY "Teachers can insert Arabic progress"
  ON arabic_learner_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN teacher_profiles ON teacher_profiles.id = lessons.teacher_id
      WHERE lessons.learner_id = arabic_learner_progress.learner_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Teachers can update progress records
CREATE POLICY "Teachers can update Arabic progress"
  ON arabic_learner_progress
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN teacher_profiles ON teacher_profiles.id = lessons.teacher_id
      WHERE lessons.learner_id = arabic_learner_progress.learner_id
      AND teacher_profiles.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = arabic_learner_progress.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Admin policies
CREATE POLICY "Admin can read all Arabic progress"
  ON arabic_learner_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

CREATE POLICY "Admin can manage all Arabic progress"
  ON arabic_learner_progress
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Create indexes
CREATE INDEX idx_arabic_syllabus_book ON arabic_syllabus(book);
CREATE INDEX idx_arabic_syllabus_order ON arabic_syllabus(display_order);
CREATE INDEX idx_arabic_progress_learner ON arabic_learner_progress(learner_id);
CREATE INDEX idx_arabic_progress_syllabus ON arabic_learner_progress(syllabus_id);
CREATE INDEX idx_arabic_progress_teacher ON arabic_learner_progress(teacher_id);
CREATE INDEX idx_arabic_progress_status ON arabic_learner_progress(status);

-- Trigger for updated_at
CREATE TRIGGER update_arabic_progress_updated_at
  BEFORE UPDATE ON arabic_learner_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert Al-Arabiyyah Bayna Yadayk Book 1A syllabus (Units 1-8)
INSERT INTO arabic_syllabus (book, unit_number, unit_title_arabic, unit_title_english, unit_theme, key_vocabulary, grammar_topics, conversation_topics, display_order) VALUES
-- Book 1A
('1A', 1, 'التحية والتعارف', 'Greetings and Introductions', 'Meeting people and basic greetings',
  ARRAY['السلام عليكم', 'مرحبا', 'أهلا وسهلا', 'اسمي', 'من أين أنت', 'أنا من'],
  ARRAY['Personal pronouns (أنا، أنت، أنتِ)', 'Question words (ما، من، أين)', 'Definite article (ال)'],
  ARRAY['Greeting someone', 'Introducing yourself', 'Asking about nationality'],
  1),

('1A', 2, 'الأسرة', 'The Family', 'Family members and relationships',
  ARRAY['أب', 'أم', 'أخ', 'أخت', 'ابن', 'بنت', 'جد', 'جدة', 'عم', 'خال'],
  ARRAY['Possessive pronouns', 'Demonstrative pronouns (هذا، هذه)', 'Nominal sentences'],
  ARRAY['Talking about family', 'Describing family members', 'Family relationships'],
  2),

('1A', 3, 'السكن', 'Housing', 'Home and living spaces',
  ARRAY['بيت', 'شقة', 'غرفة', 'مطبخ', 'حمام', 'صالة', 'سرير', 'كرسي', 'طاولة'],
  ARRAY['Prepositions (في، على، تحت، فوق)', 'There is/are (هناك)', 'Adjective agreement'],
  ARRAY['Describing your home', 'Rooms in the house', 'Furniture'],
  3),

('1A', 4, 'الحياة اليومية', 'Daily Life', 'Daily routines and activities',
  ARRAY['يستيقظ', 'يصلي', 'يأكل', 'يشرب', 'يذهب', 'يرجع', 'ينام', 'صباح', 'مساء'],
  ARRAY['Present tense verbs (المضارع)', 'Time expressions', 'Verb conjugation (هو، هي، أنا)'],
  ARRAY['Daily routine', 'Telling time', 'Morning and evening activities'],
  4),

('1A', 5, 'الطعام والشراب', 'Food and Drink', 'Eating and drinking',
  ARRAY['خبز', 'أرز', 'لحم', 'دجاج', 'سمك', 'خضروات', 'فواكه', 'ماء', 'شاي', 'قهوة'],
  ARRAY['Verb forms (أكل، شرب)', 'Countable/uncountable nouns', 'Want/like (أريد، أحب)'],
  ARRAY['Ordering food', 'Expressing preferences', 'Restaurant dialogue'],
  5),

('1A', 6, 'الصلاة', 'Prayer', 'Islamic prayer and worship',
  ARRAY['مسجد', 'وضوء', 'ركعة', 'سجود', 'قيام', 'قبلة', 'أذان', 'إقامة', 'فجر', 'ظهر', 'عصر', 'مغرب', 'عشاء'],
  ARRAY['Imperative verbs (الأمر)', 'Sequence words (أولا، ثم، بعد ذلك)', 'Time of prayers'],
  ARRAY['Prayer times', 'Steps of prayer', 'Going to the mosque'],
  6),

('1A', 7, 'التسوق', 'Shopping', 'Markets and buying things',
  ARRAY['سوق', 'محل', 'بائع', 'ثمن', 'رخيص', 'غالي', 'كم', 'ريال', 'دولار'],
  ARRAY['Numbers (1-100)', 'Currency and prices', 'Comparative adjectives (أرخص، أغلى)'],
  ARRAY['Asking prices', 'Bargaining', 'At the market'],
  7),

('1A', 8, 'الجامعة', 'University', 'Education and studying',
  ARRAY['طالب', 'طالبة', 'أستاذ', 'فصل', 'درس', 'كتاب', 'قلم', 'دفتر', 'يدرس', 'يكتب', 'يقرأ'],
  ARRAY['Dual form (المثنى)', 'Plural forms', 'Verbal sentences'],
  ARRAY['At school/university', 'Subjects and classes', 'Study activities'],
  8),

-- Book 1B
('1B', 9, 'الهوايات', 'Hobbies', 'Hobbies and free time',
  ARRAY['هواية', 'قراءة', 'كتابة', 'سباحة', 'كرة القدم', 'سفر', 'موسيقى', 'رسم'],
  ARRAY['Verbal nouns (المصدر)', 'Like/love/prefer (يحب، يفضل)', 'Present tense practice'],
  ARRAY['Talking about hobbies', 'Free time activities', 'Expressing preferences'],
  9),

('1B', 10, 'الطقس', 'Weather', 'Weather and seasons',
  ARRAY['طقس', 'حار', 'بارد', 'ممطر', 'مشمس', 'غائم', 'ربيع', 'صيف', 'خريف', 'شتاء'],
  ARRAY['Weather expressions', 'Seasons of the year', 'Adjectives describing weather'],
  ARRAY['Describing weather', 'Seasons and climate', 'Weather forecast'],
  10),

('1B', 11, 'الجسم والصحة', 'Body and Health', 'Body parts and health',
  ARRAY['رأس', 'عين', 'أذن', 'أنف', 'فم', 'يد', 'رجل', 'مريض', 'طبيب', 'مستشفى'],
  ARRAY['Body parts vocabulary', 'Expressing illness', 'Dual and plural of body parts'],
  ARRAY['At the doctor', 'Describing symptoms', 'Health and wellness'],
  11),

('1B', 12, 'السفر', 'Travel', 'Traveling and transportation',
  ARRAY['مطار', 'طائرة', 'قطار', 'سيارة', 'تذكرة', 'جواز سفر', 'حقيبة', 'سافر', 'وصل'],
  ARRAY['Past tense (الماضي)', 'Travel vocabulary', 'Prepositions of movement (إلى، من)'],
  ARRAY['At the airport', 'Booking travel', 'Travel plans'],
  12),

('1B', 13, 'المدينة', 'The City', 'Places in the city',
  ARRAY['مدينة', 'شارع', 'مبنى', 'بنك', 'مستشفى', 'فندق', 'مطعم', 'يمين', 'يسار', 'أمام', 'خلف'],
  ARRAY['Directions and locations', 'More prepositions', 'Asking for directions'],
  ARRAY['Giving directions', 'City landmarks', 'Getting around'],
  13),

('1B', 14, 'العمل', 'Work', 'Jobs and professions',
  ARRAY['عمل', 'وظيفة', 'مهندس', 'طبيب', 'معلم', 'محاسب', 'مدير', 'موظف', 'شركة', 'مكتب'],
  ARRAY['Professions and occupations', 'Feminine forms of professions', 'Work-related verbs'],
  ARRAY['Talking about jobs', 'At the office', 'Job interview'],
  14),

('1B', 15, 'المناسبات', 'Occasions', 'Celebrations and events',
  ARRAY['عيد', 'زواج', 'حفلة', 'هدية', 'مبارك', 'تهنئة', 'رمضان', 'الفطر', 'الأضحى'],
  ARRAY['Congratulations and wishes', 'Islamic celebrations', 'Past tense practice'],
  ARRAY['Wedding celebrations', 'Islamic holidays', 'Giving congratulations'],
  15),

('1B', 16, 'العطلة الصيفية', 'Summer Vacation', 'Vacation and leisure',
  ARRAY['عطلة', 'إجازة', 'سفر', 'زيارة', 'صديق', 'قضى', 'استمتع', 'رحلة'],
  ARRAY['Future tense (سوف/س)', 'Past tense review', 'Time expressions'],
  ARRAY['Vacation plans', 'Describing past trips', 'Summer activities'],
  16);

-- Create a view for easy querying of learner progress with syllabus details
CREATE OR REPLACE VIEW arabic_progress_with_syllabus AS
SELECT
  alp.id,
  alp.learner_id,
  alp.teacher_id,
  alp.understanding_complete,
  alp.practice_complete,
  alp.mastery_complete,
  alp.vocabulary_mastered,
  alp.grammar_mastered,
  alp.conversation_practiced,
  alp.teacher_notes,
  alp.last_lesson_date,
  alp.status,
  alp.created_at,
  alp.updated_at,
  asyl.id as syllabus_id,
  asyl.book,
  asyl.unit_number,
  asyl.unit_title_arabic,
  asyl.unit_title_english,
  asyl.unit_theme,
  asyl.key_vocabulary,
  asyl.grammar_topics,
  asyl.conversation_topics,
  asyl.estimated_lessons,
  asyl.display_order
FROM arabic_learner_progress alp
JOIN arabic_syllabus asyl ON asyl.id = alp.syllabus_id;

-- Grant access to the view
GRANT SELECT ON arabic_progress_with_syllabus TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE arabic_syllabus IS 'Reference table containing the syllabus structure for Al-Arabiyyah Bayna Yadayk textbook series';
COMMENT ON TABLE arabic_learner_progress IS 'Tracks individual learner progress through the Arabic syllabus units';
