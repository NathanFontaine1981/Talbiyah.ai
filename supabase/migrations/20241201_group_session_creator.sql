-- Group Session Creator - Full Database Schema
-- This migration creates tables for managing group sessions with full customization

-- =====================================================
-- 1. AI INSIGHT TEMPLATES (reusable prompts)
-- =====================================================
CREATE TABLE IF NOT EXISTS insight_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT UNIQUE NOT NULL, -- 'quran-recitation', 'arabic-beginners'
    display_name TEXT NOT NULL, -- 'Quran Recitation & Tajweed'
    description TEXT,
    subject_category TEXT NOT NULL,

    -- The AI prompt
    system_prompt TEXT NOT NULL, -- Instructions for Claude
    output_format TEXT, -- Expected sections/structure

    -- Customization options
    include_vocabulary BOOLEAN DEFAULT TRUE,
    include_quiz BOOLEAN DEFAULT TRUE,
    include_homework BOOLEAN DEFAULT TRUE,
    vocabulary_limit INTEGER DEFAULT 15,
    quiz_questions INTEGER DEFAULT 5,

    is_default BOOLEAN DEFAULT FALSE, -- Default template for category

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. GROUP SESSION TEMPLATES (class definitions)
-- =====================================================
CREATE TABLE IF NOT EXISTS group_session_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    name TEXT NOT NULL, -- "Kids Quran Circle", "Sisters Arabic Beginners"
    slug TEXT UNIQUE NOT NULL, -- URL-friendly: "kids-quran-circle"
    description TEXT,
    subject_category TEXT NOT NULL, -- 'quran', 'arabic', 'islamic_studies', 'other'
    image_url TEXT, -- Cover image for the class

    -- Schedule
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    recurrence TEXT NOT NULL DEFAULT 'weekly', -- 'once', 'daily', 'weekly', 'biweekly', 'monthly'
    day_of_week INTEGER, -- 0=Sunday, 1=Monday, etc. (for recurring)
    start_time TIME NOT NULL, -- e.g., '18:00'
    timezone TEXT DEFAULT 'Europe/London',
    start_date DATE, -- When the class series begins
    end_date DATE, -- Optional: when the series ends

    -- Pricing
    is_free BOOLEAN DEFAULT FALSE,
    price_per_session DECIMAL(10,2), -- e.g., 5.00
    price_bundle_4 DECIMAL(10,2), -- Price for 4 sessions
    price_bundle_8 DECIMAL(10,2), -- Price for 8 sessions
    credits_per_session INTEGER, -- If using credit system

    -- Capacity
    min_participants INTEGER DEFAULT 3,
    max_participants INTEGER DEFAULT 20,

    -- People
    teacher_id UUID REFERENCES profiles(id),
    allow_guest_teachers BOOLEAN DEFAULT FALSE,
    guest_teacher_ids UUID[], -- Additional teachers who can cover

    -- Target Audience
    age_group TEXT DEFAULT 'all', -- 'children', 'teens', 'adults', 'all'
    age_min INTEGER,
    age_max INTEGER,
    gender TEXT DEFAULT 'all', -- 'male', 'female', 'all'
    skill_level TEXT DEFAULT 'all', -- 'beginner', 'intermediate', 'advanced', 'all'

    -- AI Insight Template
    insight_template_name TEXT, -- 'quran-recitation', 'arabic-language', 'islamic-studies'
    custom_insight_prompt TEXT, -- Custom AI prompt for this specific class

    -- Features
    recording_enabled BOOLEAN DEFAULT TRUE,
    homework_enabled BOOLEAN DEFAULT TRUE,
    chat_enabled BOOLEAN DEFAULT TRUE,

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    featured BOOLEAN DEFAULT FALSE, -- Show on homepage

    -- Metadata
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. GROUP SESSION INSTANCES (actual scheduled sessions)
-- =====================================================
CREATE TABLE IF NOT EXISTS group_session_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES group_session_templates(id) ON DELETE CASCADE,

    -- Session Details
    session_number INTEGER, -- e.g., Week 1, Week 2
    title TEXT, -- Can override template name: "Week 5: Surah Al-Fatiha Review"
    description TEXT, -- Session-specific description

    -- Schedule
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER,

    -- Teacher
    teacher_id UUID REFERENCES profiles(id),

    -- Room (100ms)
    room_id TEXT, -- 100ms room ID
    room_code TEXT, -- 100ms room code for joining
    teacher_room_code TEXT,
    student_room_code TEXT,

    -- Status
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),

    -- Recording
    recording_url TEXT,
    recording_available BOOLEAN DEFAULT FALSE,

    -- Counts
    registered_count INTEGER DEFAULT 0,
    attended_count INTEGER DEFAULT 0,

    -- AI Insights
    insight_id UUID, -- Reference to lesson_insights if generated

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. GROUP SESSION REGISTRATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS group_session_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Can register for template (all sessions) or single session
    template_id UUID REFERENCES group_session_templates(id),
    session_id UUID REFERENCES group_session_instances(id),

    learner_id UUID REFERENCES learners(id),
    parent_id UUID REFERENCES profiles(id),

    -- Payment
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'free', 'refunded')),
    payment_type TEXT, -- 'single', 'bundle_4', 'bundle_8', 'credits', 'free'
    amount_paid DECIMAL(10,2),
    sessions_remaining INTEGER, -- For bundles
    stripe_payment_intent_id TEXT,

    -- Attendance tracking
    attended BOOLEAN DEFAULT FALSE,
    attendance_time TIMESTAMP WITH TIME ZONE,

    -- Status
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'waitlist', 'cancelled')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_group_templates_status ON group_session_templates(status);
CREATE INDEX IF NOT EXISTS idx_group_templates_category ON group_session_templates(subject_category);
CREATE INDEX IF NOT EXISTS idx_group_templates_featured ON group_session_templates(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_group_instances_template ON group_session_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_group_instances_date ON group_session_instances(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_group_instances_status ON group_session_instances(status);
CREATE INDEX IF NOT EXISTS idx_group_registrations_learner ON group_session_registrations(learner_id);
CREATE INDEX IF NOT EXISTS idx_group_registrations_template ON group_session_registrations(template_id);
CREATE INDEX IF NOT EXISTS idx_group_registrations_session ON group_session_registrations(session_id);
CREATE INDEX IF NOT EXISTS idx_insight_templates_category ON insight_templates(subject_category);

-- =====================================================
-- 6. ENABLE RLS
-- =====================================================
ALTER TABLE insight_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_session_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_session_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_session_registrations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. RLS POLICIES - INSIGHT TEMPLATES
-- =====================================================
DROP POLICY IF EXISTS "Admin full access insight templates" ON insight_templates;
CREATE POLICY "Admin full access insight templates" ON insight_templates
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
    );

DROP POLICY IF EXISTS "Public read insight templates" ON insight_templates;
CREATE POLICY "Public read insight templates" ON insight_templates
    FOR SELECT USING (true);

-- =====================================================
-- 8. RLS POLICIES - GROUP SESSION TEMPLATES
-- =====================================================
DROP POLICY IF EXISTS "Admin full access templates" ON group_session_templates;
CREATE POLICY "Admin full access templates" ON group_session_templates
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
    );

DROP POLICY IF EXISTS "Teachers can view their templates" ON group_session_templates;
CREATE POLICY "Teachers can view their templates" ON group_session_templates
    FOR SELECT USING (teacher_id = auth.uid() OR status = 'active');

DROP POLICY IF EXISTS "Public view active templates" ON group_session_templates;
CREATE POLICY "Public view active templates" ON group_session_templates
    FOR SELECT USING (status = 'active');

-- =====================================================
-- 9. RLS POLICIES - GROUP SESSION INSTANCES
-- =====================================================
DROP POLICY IF EXISTS "Admin full access instances" ON group_session_instances;
CREATE POLICY "Admin full access instances" ON group_session_instances
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
    );

DROP POLICY IF EXISTS "Teachers can manage their sessions" ON group_session_instances;
CREATE POLICY "Teachers can manage their sessions" ON group_session_instances
    FOR ALL USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Public view scheduled sessions" ON group_session_instances;
CREATE POLICY "Public view scheduled sessions" ON group_session_instances
    FOR SELECT USING (status IN ('scheduled', 'live', 'completed'));

-- =====================================================
-- 10. RLS POLICIES - REGISTRATIONS
-- =====================================================
DROP POLICY IF EXISTS "Admin full access registrations" ON group_session_registrations;
CREATE POLICY "Admin full access registrations" ON group_session_registrations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
    );

DROP POLICY IF EXISTS "Parents manage their registrations" ON group_session_registrations;
CREATE POLICY "Parents manage their registrations" ON group_session_registrations
    FOR ALL USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Learners view their registrations" ON group_session_registrations;
-- Note: learners table uses parent_id not user_id - policy fixed to use parent auth
CREATE POLICY "Learners view their registrations" ON group_session_registrations
    FOR SELECT USING (
        learner_id IN (SELECT id FROM learners WHERE parent_id = auth.uid())
    );

DROP POLICY IF EXISTS "Teachers view session registrations" ON group_session_registrations;
CREATE POLICY "Teachers view session registrations" ON group_session_registrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_session_instances gsi
            WHERE gsi.id = session_id AND gsi.teacher_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM group_session_templates gst
            WHERE gst.id = template_id AND gst.teacher_id = auth.uid()
        )
    );

-- =====================================================
-- 11. INSERT DEFAULT INSIGHT TEMPLATES
-- =====================================================
INSERT INTO insight_templates (name, display_name, description, subject_category, system_prompt, is_default) VALUES
('quran-recitation', 'Quran Recitation & Tajweed', 'For Quran reading, fluency, and tajweed lessons', 'quran',
'You are Talbiyah Insights – Quran Recitation specialist.

Transform the class transcript into structured, detailed lesson notes covering:
1. **Verses Covered**: List the exact surahs and ayahs practiced
2. **Tajweed Rules Applied**: Identify all tajweed rules demonstrated (idghaam, ikhfa, madd, etc.)
3. **Pronunciation Corrections**: Document specific letters/words the teacher corrected
4. **Fluency Progress**: Note improvements in reading speed and smoothness
5. **Makharij Points**: Any articulation points discussed
6. **Key Vocabulary**: Arabic terms with meanings
7. **Practice Recommendations**: What to revise before next session
8. **Mini Quiz**: 5 questions testing understanding

Use clear headings, bullet points, and Arabic text with transliteration where helpful.', TRUE),

('quran-memorization', 'Quran Memorization (Hifz)', 'For Quran memorization lessons', 'quran',
'You are Talbiyah Insights – Hifz specialist.

Transform the class transcript into structured memorization progress notes:
1. **New Memorization**: Verses memorized this session (surah:ayah range)
2. **Revision Completed**: Previously memorized portions reviewed
3. **Accuracy Assessment**: Common mistakes and corrections made
4. **Memorization Techniques**: Methods discussed for retention
5. **Connections Made**: Links between verses or thematic connections
6. **Progress Tracker**: Visual representation of progress
7. **Homework Assignment**: What to memorize/revise
8. **Tips from Teacher**: Any advice given

Include Arabic text with English translation for new verses.', FALSE),

('quran-tafsir', 'Quran with Tafsir/Tadabbur', 'For understanding and reflection on Quran', 'quran',
'You are Talbiyah Insights – Quran Tafsir specialist.

Transform the class transcript into deep understanding notes:
1. **Verses Studied**: Surah name, ayah numbers, and Arabic text
2. **Flow of Meaning**: Clear translation and explanation
3. **Tafsir Points**: Key interpretations from scholars
4. **Word Study**: Important Arabic vocabulary with root analysis
5. **Historical Context**: When/why revealed (if discussed)
6. **Tadabbur Reflections**: Personal and practical applications
7. **Connections**: Links to other verses or hadith
8. **Discussion Points**: Questions raised in class
9. **Action Items**: How to apply these teachings
10. **Quiz**: Understanding check questions', FALSE),

('arabic-language', 'Arabic Language', 'For Arabic grammar, vocabulary, and conversation', 'arabic',
'You are Talbiyah Insights – Arabic Language specialist.

Transform the class transcript into comprehensive language notes:
1. **Lesson Summary**: Overview of topics covered
2. **New Vocabulary**: 10-20 words with:
   - Arabic (with tashkil)
   - Transliteration
   - English meaning
   - Word type
   - Example sentence
3. **Grammar Focus**: Rules explained with examples
4. **Key Sentences**: Useful phrases from class
5. **Pronunciation Notes**: Letters/sounds practiced
6. **Conversation Practice**: Dialogue examples
7. **Writing Exercises**: Any handwriting or composition work
8. **Common Mistakes**: Errors corrected
9. **Mini Quiz**: 10 mixed questions
10. **Homework**: Practice tasks

Use tables for vocabulary and clear formatting throughout.', TRUE),

('islamic-studies', 'Islamic Studies', 'For general Islamic knowledge lessons', 'islamic_studies',
'You are Talbiyah Insights – Islamic Studies specialist.

Transform the class transcript into structured knowledge notes:
1. **Topic Overview**: Main subject covered
2. **Key Concepts**: Important terms and definitions
3. **Evidence**: Quran verses and hadith cited
4. **Stories & Examples**: Any narratives shared
5. **Scholarly Views**: Different opinions mentioned
6. **Practical Application**: How to implement in daily life
7. **Common Misconceptions**: Clarifications made
8. **Discussion Points**: Questions and answers
9. **Reflection Questions**: For personal contemplation
10. **Quiz**: 5 comprehension questions
11. **Further Reading**: Suggested resources

Balance academic rigor with accessibility for all ages.', TRUE),

('seerah', 'Seerah (Prophetic Biography)', 'For lessons on the life of Prophet Muhammad (PBUH)', 'islamic_studies',
'You are Talbiyah Insights – Seerah specialist.

Transform the class transcript into engaging biographical notes:
1. **Event/Period Covered**: Timeline context
2. **Story Summary**: Narrative of what happened
3. **Key Figures**: People involved and their roles
4. **Lessons Learned**: Moral and spiritual takeaways
5. **Character Traits**: Qualities of the Prophet (PBUH) demonstrated
6. **Hadith Referenced**: Supporting narrations
7. **Historical Context**: Setting and circumstances
8. **Modern Applications**: Relevance today
9. **Reflection Questions**: For contemplation
10. **Timeline Visualization**: Where this fits in Seerah

Make it engaging and story-like while maintaining accuracy.', FALSE),

('fiqh', 'Fiqh (Islamic Jurisprudence)', 'For lessons on Islamic rulings and practices', 'islamic_studies',
'You are Talbiyah Insights – Fiqh specialist.

Transform the class transcript into practical jurisprudence notes:
1. **Topic**: The fiqh subject covered
2. **Ruling Summary**: The main ruling(s) discussed
3. **Evidence**: Quran, Hadith, and scholarly sources
4. **Scholarly Opinions**: Different madhhab views if mentioned
5. **Conditions & Requirements**: Prerequisites and details
6. **Common Mistakes**: What to avoid
7. **Practical Steps**: How to apply correctly
8. **FAQ**: Questions answered in class
9. **Quiz**: Scenario-based questions
10. **Summary Table**: Quick reference

Be precise with rulings while acknowledging valid differences.', FALSE),

('aqeedah', 'Aqeedah (Islamic Creed)', 'For lessons on Islamic beliefs and theology', 'islamic_studies',
'You are Talbiyah Insights – Aqeedah specialist.

Transform the class transcript into foundational belief notes:
1. **Topic**: The creedal subject covered
2. **Core Belief**: The main aqeedah point
3. **Evidence from Quran**: Supporting verses
4. **Evidence from Sunnah**: Supporting hadith
5. **Scholarly Explanation**: How scholars understand this
6. **Why It Matters**: Importance of this belief
7. **Common Misconceptions**: Errors to avoid
8. **Implications**: How this affects our worship/life
9. **Reflection Questions**: For strengthening faith
10. **Summary**: Key points to remember

Keep it clear, evidence-based, and spiritually uplifting.', FALSE)

ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    system_prompt = EXCLUDED.system_prompt,
    updated_at = NOW();

-- =====================================================
-- 12. HELPER FUNCTIONS
-- =====================================================

-- Function to generate sessions for a template
CREATE OR REPLACE FUNCTION generate_group_sessions(
    p_template_id UUID,
    p_num_weeks INTEGER DEFAULT 12
)
RETURNS INTEGER AS $$
DECLARE
    v_template group_session_templates%ROWTYPE;
    v_current_date DATE;
    v_session_num INTEGER := 1;
    v_created INTEGER := 0;
BEGIN
    -- Get template
    SELECT * INTO v_template FROM group_session_templates WHERE id = p_template_id;

    IF v_template.id IS NULL THEN
        RAISE EXCEPTION 'Template not found';
    END IF;

    -- Start from template start_date or today
    v_current_date := COALESCE(v_template.start_date, CURRENT_DATE);

    -- Adjust to correct day of week if weekly/biweekly
    IF v_template.recurrence IN ('weekly', 'biweekly') AND v_template.day_of_week IS NOT NULL THEN
        WHILE EXTRACT(DOW FROM v_current_date) != v_template.day_of_week LOOP
            v_current_date := v_current_date + INTERVAL '1 day';
        END LOOP;
    END IF;

    -- Generate sessions
    FOR i IN 1..p_num_weeks LOOP
        -- Check if session already exists for this date
        IF NOT EXISTS (
            SELECT 1 FROM group_session_instances
            WHERE template_id = p_template_id
            AND scheduled_date = v_current_date
        ) THEN
            INSERT INTO group_session_instances (
                template_id,
                session_number,
                scheduled_date,
                scheduled_time,
                duration_minutes,
                teacher_id,
                status
            ) VALUES (
                p_template_id,
                v_session_num,
                v_current_date,
                v_template.start_time,
                v_template.duration_minutes,
                v_template.teacher_id,
                'scheduled'
            );
            v_created := v_created + 1;
        END IF;

        v_session_num := v_session_num + 1;

        -- Advance date based on recurrence
        CASE v_template.recurrence
            WHEN 'daily' THEN v_current_date := v_current_date + INTERVAL '1 day';
            WHEN 'weekly' THEN v_current_date := v_current_date + INTERVAL '1 week';
            WHEN 'biweekly' THEN v_current_date := v_current_date + INTERVAL '2 weeks';
            WHEN 'monthly' THEN v_current_date := v_current_date + INTERVAL '1 month';
            ELSE EXIT; -- 'once' - only create one
        END CASE;

        -- Stop if past end_date
        IF v_template.end_date IS NOT NULL AND v_current_date > v_template.end_date THEN
            EXIT;
        END IF;
    END LOOP;

    RETURN v_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update registration counts
CREATE OR REPLACE FUNCTION update_session_registration_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.session_id IS NOT NULL THEN
            UPDATE group_session_instances
            SET registered_count = registered_count + 1
            WHERE id = NEW.session_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.session_id IS NOT NULL THEN
            UPDATE group_session_instances
            SET registered_count = GREATEST(0, registered_count - 1)
            WHERE id = OLD.session_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for registration count
DROP TRIGGER IF EXISTS update_registration_count ON group_session_registrations;
CREATE TRIGGER update_registration_count
    AFTER INSERT OR DELETE ON group_session_registrations
    FOR EACH ROW EXECUTE FUNCTION update_session_registration_count();

-- =====================================================
-- 13. UPDATED_AT TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_insight_templates_updated_at ON insight_templates;
CREATE TRIGGER update_insight_templates_updated_at
    BEFORE UPDATE ON insight_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_group_session_templates_updated_at ON group_session_templates;
CREATE TRIGGER update_group_session_templates_updated_at
    BEFORE UPDATE ON group_session_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_group_session_instances_updated_at ON group_session_instances;
CREATE TRIGGER update_group_session_instances_updated_at
    BEFORE UPDATE ON group_session_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_group_session_registrations_updated_at ON group_session_registrations;
CREATE TRIGGER update_group_session_registrations_updated_at
    BEFORE UPDATE ON group_session_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
