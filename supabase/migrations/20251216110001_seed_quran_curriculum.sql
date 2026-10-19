-- Seed Data: Quran Reading Curriculum
-- Based on the Talbiyah Methodology: Understanding (Fahm) → Fluency (Itqan) → Memorization (Hifz)

-- =============================================
-- PART 1: Create Quran Reading Subject
-- =============================================

INSERT INTO curriculum_subjects (name, name_arabic, slug, description, icon, color, sort_order) VALUES
('Quran Reading', 'قراءة القرآن', 'quran-reading', 'Learn to read the Quran with proper Tajweed, develop fluency, and build your memorization', '📖', '#10B981', 1)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- PART 2: Create Phases for Quran Reading
-- =============================================

-- Get the subject ID
DO $$
DECLARE
  quran_subject_id uuid;
  foundation_phase_id uuid;
  development_phase_id uuid;
  proficiency_phase_id uuid;
  mastery_phase_id uuid;
BEGIN
  SELECT id INTO quran_subject_id FROM curriculum_subjects WHERE slug = 'quran-reading';

  -- Insert phases
  INSERT INTO curriculum_phases (subject_id, name, name_arabic, slug, description, sort_order, estimated_hours) VALUES
  (quran_subject_id, 'Foundation', 'الأساس', 'foundation', 'Master Arabic letters, basic Tajweed rules, and short surahs', 1, 50),
  (quran_subject_id, 'Development', 'التطوير', 'development', 'Build reading fluency and expand memorization', 2, 100),
  (quran_subject_id, 'Proficiency', 'الإتقان', 'proficiency', 'Achieve confident recitation with advanced Tajweed', 3, 150),
  (quran_subject_id, 'Mastery', 'التمكن', 'mastery', 'Complete Quran reading and significant memorization', 4, 200)
  ON CONFLICT (subject_id, slug) DO NOTHING;

  -- Get phase IDs
  SELECT id INTO foundation_phase_id FROM curriculum_phases WHERE subject_id = quran_subject_id AND slug = 'foundation';
  SELECT id INTO development_phase_id FROM curriculum_phases WHERE subject_id = quran_subject_id AND slug = 'development';
  SELECT id INTO proficiency_phase_id FROM curriculum_phases WHERE subject_id = quran_subject_id AND slug = 'proficiency';
  SELECT id INTO mastery_phase_id FROM curriculum_phases WHERE subject_id = quran_subject_id AND slug = 'mastery';

  -- =============================================
  -- PART 3: Create Stages within each Phase
  -- =============================================

  -- Foundation Phase Stages
  INSERT INTO curriculum_stages (phase_id, name, name_arabic, slug, description, sort_order, estimated_hours) VALUES
  (foundation_phase_id, 'Arabic Letters', 'الحروف العربية', 'arabic-letters', 'Learn to recognize and pronounce all Arabic letters', 1, 10),
  (foundation_phase_id, 'Basic Tajweed', 'التجويد الأساسي', 'basic-tajweed', 'Essential Tajweed rules for proper recitation', 2, 15),
  (foundation_phase_id, 'Short Surahs', 'قصار السور', 'short-surahs', 'Begin with Juz Amma short surahs', 3, 25)
  ON CONFLICT (phase_id, slug) DO NOTHING;

  -- Development Phase Stages
  INSERT INTO curriculum_stages (phase_id, name, name_arabic, slug, description, sort_order, estimated_hours) VALUES
  (development_phase_id, 'Fluency Building', 'بناء الطلاقة', 'fluency-building', 'Develop smooth, connected reading', 1, 30),
  (development_phase_id, 'Juz Amma Completion', 'إتمام جزء عم', 'juz-amma', 'Complete memorization of Juz Amma', 2, 40),
  (development_phase_id, 'Intermediate Tajweed', 'التجويد المتوسط', 'intermediate-tajweed', 'Advanced stopping rules and elongation', 3, 30)
  ON CONFLICT (phase_id, slug) DO NOTHING;

  -- Proficiency Phase Stages
  INSERT INTO curriculum_stages (phase_id, name, name_arabic, slug, description, sort_order, estimated_hours) VALUES
  (proficiency_phase_id, 'Advanced Recitation', 'القراءة المتقدمة', 'advanced-recitation', 'Read any surah with confidence', 1, 50),
  (proficiency_phase_id, 'Juz Tabarak', 'جزء تبارك', 'juz-tabarak', 'Memorize Juz Tabarak (29th Juz)', 2, 50),
  (proficiency_phase_id, 'Advanced Tajweed', 'التجويد المتقدم', 'advanced-tajweed', 'Master all Tajweed rules', 3, 50)
  ON CONFLICT (phase_id, slug) DO NOTHING;

  -- Mastery Phase Stages
  INSERT INTO curriculum_stages (phase_id, name, name_arabic, slug, description, sort_order, estimated_hours) VALUES
  (mastery_phase_id, 'Full Quran Reading', 'ختم القرآن', 'full-quran', 'Complete reading of the entire Quran', 1, 100),
  (mastery_phase_id, 'Extended Memorization', 'الحفظ الموسع', 'extended-hifz', 'Memorize additional Juz', 2, 100)
  ON CONFLICT (phase_id, slug) DO NOTHING;

END $$;

-- =============================================
-- PART 4: Create Milestones (Three Pillars)
-- =============================================

DO $$
DECLARE
  stage_id uuid;
BEGIN
  -- Arabic Letters Stage Milestones
  SELECT id INTO stage_id FROM curriculum_stages WHERE slug = 'arabic-letters';
  IF stage_id IS NOT NULL THEN
    INSERT INTO curriculum_milestones (stage_id, name, name_arabic, slug, description, pillar, sort_order, estimated_lessons, verification_criteria) VALUES
    (stage_id, 'Letter Recognition', 'معرفة الحروف', 'letter-recognition', 'Identify all 28 Arabic letters in isolation', 'fahm', 1, 3, 'Student can identify all letters when shown flashcards'),
    (stage_id, 'Letter Pronunciation', 'نطق الحروف', 'letter-pronunciation', 'Correctly pronounce each letter with its makhraj', 'itqan', 2, 5, 'Student pronounces letters with correct articulation points'),
    (stage_id, 'Letter Forms', 'أشكال الحروف', 'letter-forms', 'Recognize letters in beginning, middle, and end positions', 'fahm', 3, 4, 'Student reads letters in all positions within words')
    ON CONFLICT (stage_id, slug) DO NOTHING;
  END IF;

  -- Basic Tajweed Stage Milestones
  SELECT id INTO stage_id FROM curriculum_stages WHERE slug = 'basic-tajweed';
  IF stage_id IS NOT NULL THEN
    INSERT INTO curriculum_milestones (stage_id, name, name_arabic, slug, description, pillar, sort_order, estimated_lessons, verification_criteria) VALUES
    (stage_id, 'Harakaat Mastery', 'إتقان الحركات', 'harakaat', 'Apply fatha, kasra, damma, and sukoon correctly', 'fahm', 1, 4, 'Student reads words with correct vowel marks'),
    (stage_id, 'Tanween', 'التنوين', 'tanween', 'Recognize and pronounce double vowels (nun sound)', 'fahm', 2, 3, 'Student reads tanween correctly in all three forms'),
    (stage_id, 'Madd Letters', 'حروف المد', 'madd-basic', 'Understand and apply basic elongation', 'itqan', 3, 4, 'Student holds madd letters for correct duration'),
    (stage_id, 'Noon Saakinah Basics', 'النون الساكنة', 'noon-sakinah-basic', 'Apply Idghaam and Ikhfaa rules', 'itqan', 4, 5, 'Student applies basic noon sakinah rules correctly')
    ON CONFLICT (stage_id, slug) DO NOTHING;
  END IF;

  -- Short Surahs Stage Milestones (Fahm → Itqan → Hifz for each)
  SELECT id INTO stage_id FROM curriculum_stages WHERE slug = 'short-surahs';
  IF stage_id IS NOT NULL THEN
    INSERT INTO curriculum_milestones (stage_id, name, name_arabic, slug, description, pillar, sort_order, estimated_lessons, verification_criteria) VALUES
    -- Surah Al-Fatiha
    (stage_id, 'Al-Fatiha Understanding', 'فهم الفاتحة', 'fatiha-fahm', 'Understand meanings and significance of Al-Fatiha', 'fahm', 1, 1, 'Student can explain basic meanings of Al-Fatiha'),
    (stage_id, 'Al-Fatiha Fluency', 'إتقان الفاتحة', 'fatiha-itqan', 'Recite Al-Fatiha fluently with Tajweed', 'itqan', 2, 2, 'Student recites Al-Fatiha with proper Tajweed'),
    (stage_id, 'Al-Fatiha Memorization', 'حفظ الفاتحة', 'fatiha-hifz', 'Memorize Al-Fatiha completely', 'hifz', 3, 1, 'Student recites Al-Fatiha from memory without errors'),
    -- Surah Al-Ikhlas
    (stage_id, 'Al-Ikhlas Understanding', 'فهم الإخلاص', 'ikhlas-fahm', 'Understand the message of Tawheed in Al-Ikhlas', 'fahm', 4, 1, 'Student explains the meaning of Al-Ikhlas'),
    (stage_id, 'Al-Ikhlas Fluency', 'إتقان الإخلاص', 'ikhlas-itqan', 'Recite Al-Ikhlas with proper Tajweed', 'itqan', 5, 1, 'Student recites with correct pronunciation'),
    (stage_id, 'Al-Ikhlas Memorization', 'حفظ الإخلاص', 'ikhlas-hifz', 'Memorize Surah Al-Ikhlas', 'hifz', 6, 1, 'Student recites from memory'),
    -- Surah Al-Falaq
    (stage_id, 'Al-Falaq Understanding', 'فهم الفلق', 'falaq-fahm', 'Understand seeking refuge in Allah', 'fahm', 7, 1, 'Student explains the theme of protection'),
    (stage_id, 'Al-Falaq Fluency', 'إتقان الفلق', 'falaq-itqan', 'Recite Al-Falaq fluently', 'itqan', 8, 1, 'Student recites with proper Tajweed'),
    (stage_id, 'Al-Falaq Memorization', 'حفظ الفلق', 'falaq-hifz', 'Memorize Surah Al-Falaq', 'hifz', 9, 1, 'Student recites from memory'),
    -- Surah An-Nas
    (stage_id, 'An-Nas Understanding', 'فهم الناس', 'nas-fahm', 'Understand protection from waswas', 'fahm', 10, 1, 'Student explains the meaning'),
    (stage_id, 'An-Nas Fluency', 'إتقان الناس', 'nas-itqan', 'Recite An-Nas with Tajweed', 'itqan', 11, 1, 'Student recites fluently'),
    (stage_id, 'An-Nas Memorization', 'حفظ الناس', 'nas-hifz', 'Memorize Surah An-Nas', 'hifz', 12, 1, 'Student recites from memory')
    ON CONFLICT (stage_id, slug) DO NOTHING;
  END IF;

  -- Fluency Building Stage
  SELECT id INTO stage_id FROM curriculum_stages WHERE slug = 'fluency-building';
  IF stage_id IS NOT NULL THEN
    INSERT INTO curriculum_milestones (stage_id, name, name_arabic, slug, description, pillar, sort_order, estimated_lessons, verification_criteria) VALUES
    (stage_id, 'Word Connection', 'وصل الكلمات', 'word-connection', 'Connect words smoothly in recitation', 'itqan', 1, 5, 'Student reads sentences without unnatural pauses'),
    (stage_id, 'Verse Flow', 'انسياب الآيات', 'verse-flow', 'Recite complete verses with proper rhythm', 'itqan', 2, 6, 'Student maintains consistent pace through verses'),
    (stage_id, 'Page Reading', 'قراءة الصفحة', 'page-reading', 'Read a full page with maintained fluency', 'itqan', 3, 8, 'Student reads a page with minimal errors')
    ON CONFLICT (stage_id, slug) DO NOTHING;
  END IF;

  -- Juz Amma Stage - Key Surahs
  SELECT id INTO stage_id FROM curriculum_stages WHERE slug = 'juz-amma';
  IF stage_id IS NOT NULL THEN
    INSERT INTO curriculum_milestones (stage_id, name, name_arabic, slug, description, pillar, sort_order, estimated_lessons, verification_criteria) VALUES
    -- Surah Al-Kawthar to Al-Kafirun
    (stage_id, 'Short Surahs Set 1', 'قصار السور ١', 'short-set-1', 'Memorize Al-Kawthar, Al-Maun, Quraysh, Al-Fil', 'hifz', 1, 4, 'Student recites all four surahs from memory'),
    (stage_id, 'Short Surahs Set 2', 'قصار السور ٢', 'short-set-2', 'Memorize Al-Humazah, Al-Asr, At-Takathur, Al-Qariah', 'hifz', 2, 4, 'Student recites all four surahs from memory'),
    (stage_id, 'Short Surahs Set 3', 'قصار السور ٣', 'short-set-3', 'Memorize Al-Adiyat, Az-Zalzalah, Al-Bayyinah', 'hifz', 3, 4, 'Student recites all three surahs from memory'),
    (stage_id, 'Medium Surahs Set 1', 'متوسط السور ١', 'medium-set-1', 'Memorize Al-Qadr, Al-Alaq, At-Tin, Ash-Sharh', 'hifz', 4, 5, 'Student recites all four surahs from memory'),
    (stage_id, 'Medium Surahs Set 2', 'متوسط السور ٢', 'medium-set-2', 'Memorize Ad-Duha, Al-Layl, Ash-Shams, Al-Balad', 'hifz', 5, 6, 'Student recites all four surahs from memory'),
    (stage_id, 'Longer Surahs', 'السور الطويلة', 'longer-surahs', 'Memorize Al-Fajr, Al-Ghashiyah, Al-Ala, At-Tariq', 'hifz', 6, 8, 'Student recites all four surahs from memory'),
    (stage_id, 'Juz Amma Complete', 'ختم جزء عم', 'juz-amma-complete', 'Complete memorization of remaining Juz Amma surahs', 'hifz', 7, 10, 'Student recites entire Juz Amma from memory')
    ON CONFLICT (stage_id, slug) DO NOTHING;
  END IF;

  -- Intermediate Tajweed Stage
  SELECT id INTO stage_id FROM curriculum_stages WHERE slug = 'intermediate-tajweed';
  IF stage_id IS NOT NULL THEN
    INSERT INTO curriculum_milestones (stage_id, name, name_arabic, slug, description, pillar, sort_order, estimated_lessons, verification_criteria) VALUES
    (stage_id, 'Waqf Rules', 'أحكام الوقف', 'waqf-rules', 'Master stopping and pausing rules', 'fahm', 1, 4, 'Student identifies and applies waqf marks correctly'),
    (stage_id, 'Madd Types', 'أنواع المد', 'madd-types', 'Apply all types of elongation correctly', 'itqan', 2, 5, 'Student distinguishes and applies different madd lengths'),
    (stage_id, 'Qalqalah', 'القلقلة', 'qalqalah', 'Apply echoing sound on qalqalah letters', 'itqan', 3, 3, 'Student produces clear qalqalah sounds'),
    (stage_id, 'Ghunnah Mastery', 'إتقان الغنة', 'ghunnah', 'Perfect the nasalization in applicable letters', 'itqan', 4, 4, 'Student produces correct ghunnah duration')
    ON CONFLICT (stage_id, slug) DO NOTHING;
  END IF;

  -- Advanced Recitation Stage
  SELECT id INTO stage_id FROM curriculum_stages WHERE slug = 'advanced-recitation';
  IF stage_id IS NOT NULL THEN
    INSERT INTO curriculum_milestones (stage_id, name, name_arabic, slug, description, pillar, sort_order, estimated_lessons, verification_criteria) VALUES
    (stage_id, 'Surah Al-Baqarah Reading', 'قراءة البقرة', 'baqarah-reading', 'Read Surah Al-Baqarah with Tajweed', 'itqan', 1, 15, 'Student reads entire surah with proper Tajweed'),
    (stage_id, 'Surah Al-Imran Reading', 'قراءة آل عمران', 'imran-reading', 'Read Surah Al-Imran with Tajweed', 'itqan', 2, 10, 'Student reads entire surah with proper Tajweed'),
    (stage_id, 'Surah An-Nisa Reading', 'قراءة النساء', 'nisa-reading', 'Read Surah An-Nisa with Tajweed', 'itqan', 3, 10, 'Student reads entire surah with proper Tajweed'),
    (stage_id, 'Long Surah Confidence', 'الثقة بالسور الطويلة', 'long-surah-confidence', 'Read any long surah without hesitation', 'itqan', 4, 15, 'Student demonstrates confident reading of unfamiliar passages')
    ON CONFLICT (stage_id, slug) DO NOTHING;
  END IF;

  -- Juz Tabarak Stage
  SELECT id INTO stage_id FROM curriculum_stages WHERE slug = 'juz-tabarak';
  IF stage_id IS NOT NULL THEN
    INSERT INTO curriculum_milestones (stage_id, name, name_arabic, slug, description, pillar, sort_order, estimated_lessons, verification_criteria) VALUES
    (stage_id, 'Surah Al-Mulk', 'سورة الملك', 'mulk-hifz', 'Memorize Surah Al-Mulk (30 verses)', 'hifz', 1, 8, 'Student recites entire surah from memory'),
    (stage_id, 'Surah Al-Qalam', 'سورة القلم', 'qalam-hifz', 'Memorize Surah Al-Qalam (52 verses)', 'hifz', 2, 10, 'Student recites entire surah from memory'),
    (stage_id, 'Surah Al-Haqqah', 'سورة الحاقة', 'haqqah-hifz', 'Memorize Surah Al-Haqqah (52 verses)', 'hifz', 3, 10, 'Student recites entire surah from memory'),
    (stage_id, 'Juz Tabarak Complete', 'ختم جزء تبارك', 'tabarak-complete', 'Complete memorization of Juz 29', 'hifz', 4, 20, 'Student recites entire juz from memory')
    ON CONFLICT (stage_id, slug) DO NOTHING;
  END IF;

  -- Advanced Tajweed Stage
  SELECT id INTO stage_id FROM curriculum_stages WHERE slug = 'advanced-tajweed';
  IF stage_id IS NOT NULL THEN
    INSERT INTO curriculum_milestones (stage_id, name, name_arabic, slug, description, pillar, sort_order, estimated_lessons, verification_criteria) VALUES
    (stage_id, 'Sifaat Al-Huroof', 'صفات الحروف', 'sifaat', 'Master letter characteristics (17 sifaat)', 'fahm', 1, 6, 'Student can explain and demonstrate all letter characteristics'),
    (stage_id, 'Makharij Mastery', 'إتقان المخارج', 'makharij', 'Perfect all articulation points', 'itqan', 2, 8, 'Student produces each letter from correct makhraj'),
    (stage_id, 'Rare Rules', 'الأحكام النادرة', 'rare-rules', 'Apply less common Tajweed rules', 'fahm', 3, 5, 'Student identifies and applies rules like Imalah, Ishmam'),
    (stage_id, 'Tajweed Certification Ready', 'جاهز للإجازة', 'ijazah-ready', 'Recite with Ijazah-level precision', 'itqan', 4, 10, 'Teacher certifies student is ready for Ijazah')
    ON CONFLICT (stage_id, slug) DO NOTHING;
  END IF;

  -- Full Quran Reading Stage
  SELECT id INTO stage_id FROM curriculum_stages WHERE slug = 'full-quran';
  IF stage_id IS NOT NULL THEN
    INSERT INTO curriculum_milestones (stage_id, name, name_arabic, slug, description, pillar, sort_order, estimated_lessons, verification_criteria) VALUES
    (stage_id, 'First 10 Juz', 'العشر الأولى', 'first-10-juz', 'Complete reading of Juz 1-10', 'itqan', 1, 30, 'Student reads all 10 juz with proper Tajweed'),
    (stage_id, 'Middle 10 Juz', 'العشر الوسطى', 'middle-10-juz', 'Complete reading of Juz 11-20', 'itqan', 2, 30, 'Student reads all 10 juz with proper Tajweed'),
    (stage_id, 'Final 10 Juz', 'العشر الأخيرة', 'final-10-juz', 'Complete reading of Juz 21-30', 'itqan', 3, 30, 'Student reads all 10 juz with proper Tajweed'),
    (stage_id, 'Khatm Al-Quran', 'ختم القرآن', 'khatm', 'Complete the entire Quran reading', 'itqan', 4, 5, 'Student has read the complete Quran with Tajweed')
    ON CONFLICT (stage_id, slug) DO NOTHING;
  END IF;

  -- Extended Hifz Stage
  SELECT id INTO stage_id FROM curriculum_stages WHERE slug = 'extended-hifz';
  IF stage_id IS NOT NULL THEN
    INSERT INTO curriculum_milestones (stage_id, name, name_arabic, slug, description, pillar, sort_order, estimated_lessons, verification_criteria) VALUES
    (stage_id, 'Juz 28 Memorization', 'حفظ الجزء ٢٨', 'juz-28-hifz', 'Memorize Juz 28', 'hifz', 1, 25, 'Student recites entire juz from memory'),
    (stage_id, 'Juz 27 Memorization', 'حفظ الجزء ٢٧', 'juz-27-hifz', 'Memorize Juz 27', 'hifz', 2, 25, 'Student recites entire juz from memory'),
    (stage_id, 'Selected Surahs', 'سور مختارة', 'selected-surahs', 'Memorize Al-Kahf, Yaseen, Ar-Rahman, Al-Waqiah', 'hifz', 3, 30, 'Student recites selected surahs from memory'),
    (stage_id, 'Personal Hifz Goals', 'أهداف الحفظ الشخصية', 'personal-goals', 'Work toward personal memorization goals', 'hifz', 4, 20, 'Student achieves their defined memorization target')
    ON CONFLICT (stage_id, slug) DO NOTHING;
  END IF;

END $$;

-- =============================================
-- PART 5: Create Other Subject Placeholders
-- =============================================

INSERT INTO curriculum_subjects (name, name_arabic, slug, description, icon, color, sort_order) VALUES
('Arabic Language', 'اللغة العربية', 'arabic-language', 'Learn to read, write, and speak Arabic from beginner to advanced', '🔤', '#8B5CF6', 2),
('Islamic Studies', 'الدراسات الإسلامية', 'islamic-studies', 'Comprehensive Islamic education including Aqeedah, Fiqh, and Seerah', '🕌', '#F59E0B', 3),
('Tajweed Theory', 'علم التجويد', 'tajweed-theory', 'Deep dive into the science of Quranic recitation', '📚', '#3B82F6', 4)
ON CONFLICT (slug) DO NOTHING;
