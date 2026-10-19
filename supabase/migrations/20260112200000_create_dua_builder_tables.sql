/*
  # Create Dua Builder Tables

  1. New Tables
    - `dua_categories` - Reference table for dua categories with suggested Allah names
    - `dua_library` - Pre-built duas for the library
    - `saved_duas` - User's saved/generated duas

  2. Security
    - Enable RLS on user data tables
    - Public read access to reference tables
    - Users can CRUD their own saved duas
*/

-- Create dua_categories reference table
CREATE TABLE IF NOT EXISTS public.dua_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  name_arabic text,
  icon text,
  description text,
  suggested_allah_names text[] DEFAULT '{}',
  is_core boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS but allow public read
ALTER TABLE public.dua_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read dua categories"
  ON public.dua_categories
  FOR SELECT
  TO public
  USING (true);

-- Insert dua categories with suggested Allah names
INSERT INTO public.dua_categories (id, name, name_arabic, icon, description, suggested_allah_names, is_core, sort_order) VALUES
  ('morning', 'Morning Adhkar', 'أذكار الصباح', '🌅', 'Daily morning remembrances', ARRAY['Ar-Rahman', 'Al-Malik', 'Al-Quddus'], true, 1),
  ('evening', 'Evening Adhkar', 'أذكار المساء', '🌙', 'Daily evening remembrances', ARRAY['Ar-Rahman', 'Al-Muhaymin', 'As-Salam'], true, 2),
  ('sleep', 'Before Sleep', 'أذكار النوم', '😴', 'Duas before sleeping', ARRAY['Al-Wakil', 'Al-Hafiz', 'Al-Muhaymin'], true, 3),
  ('waking', 'Upon Waking', 'أذكار الاستيقاظ', '☀️', 'Duas upon waking up', ARRAY['Al-Muhyi', 'Al-Hayy', 'Al-Qayyum'], true, 4),
  ('food', 'Food & Drink', 'الطعام والشراب', '🍽️', 'Before and after eating/drinking', ARRAY['Ar-Razzaq', 'Al-Karim', 'Ash-Shakur'], true, 5),
  ('travel', 'Travel', 'السفر', '✈️', 'Duas for journeys', ARRAY['Al-Hafiz', 'Al-Wali', 'As-Sami'], true, 6),
  ('forgiveness', 'Seeking Forgiveness', 'الاستغفار', '🤲', 'Duas for tawbah and istighfar', ARRAY['Al-Ghaffar', 'At-Tawwab', 'Al-Afuw', 'Ar-Rahman', 'Ar-Rahim'], false, 10),
  ('guidance', 'Seeking Guidance', 'طلب الهداية', '🌟', 'Duas for guidance and wisdom', ARRAY['Al-Hadi', 'An-Nur', 'Al-Hakim', 'Al-Alim', 'Al-Khabir'], false, 11),
  ('protection', 'Protection', 'الحماية', '🛡️', 'Duas for protection from harm', ARRAY['Al-Muhaymin', 'Al-Hafiz', 'Al-Wali', 'Al-Mani', 'As-Samad'], false, 12),
  ('gratitude', 'Gratitude', 'الشكر', '💚', 'Expressing thanks to Allah', ARRAY['Ash-Shakur', 'Al-Wahhab', 'Al-Karim', 'Al-Mun''im'], false, 13),
  ('hardship', 'Times of Hardship', 'وقت الشدة', '💪', 'Duas during difficult times', ARRAY['Al-Wakil', 'An-Nasir', 'Al-Fattah', 'Al-Latif', 'Al-Khabir'], false, 14),
  ('anxiety', 'Anxiety & Worry', 'القلق والهم', '🕊️', 'Duas for peace of mind', ARRAY['As-Salam', 'Al-Mu''min', 'Al-Latif', 'Ar-Rauf', 'Al-Halim'], false, 15),
  ('health', 'Health & Healing', 'الصحة والشفاء', '❤️‍🩹', 'Duas for wellness and recovery', ARRAY['Ash-Shafi', 'Al-Muhyi', 'Al-Mu''afi', 'Al-Qadir'], false, 16),
  ('provision', 'Sustenance & Provision', 'الرزق', '💰', 'Duas for halal provision', ARRAY['Ar-Razzaq', 'Al-Wahhab', 'Al-Fattah', 'Al-Ghani', 'Al-Mughni'], false, 17),
  ('family', 'Family & Children', 'الأهل والذرية', '👨‍👩‍👧‍👦', 'Duas for family blessings', ARRAY['Al-Wahhab', 'Al-Barr', 'Ar-Rauf', 'Al-Wadud', 'Al-Karim'], false, 18),
  ('knowledge', 'Knowledge & Understanding', 'العلم والفهم', '📚', 'Duas for beneficial knowledge', ARRAY['Al-Alim', 'Al-Hakim', 'Al-Fattah', 'Al-Khabir', 'Al-Muhsi'], false, 19),
  ('patience', 'Patience & Steadfastness', 'الصبر والثبات', '⚓', 'Duas for perseverance', ARRAY['As-Sabur', 'Al-Qadir', 'Al-Matin', 'Al-Qawiy', 'Ar-Rashid'], false, 20),
  ('success', 'Success & Achievement', 'النجاح والتوفيق', '🏆', 'Duas for tawfiq', ARRAY['Al-Fattah', 'An-Nasir', 'Al-Muwaffiq', 'Ar-Rashid', 'Al-Hadi'], false, 21)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  suggested_allah_names = EXCLUDED.suggested_allah_names;

-- Create dua_library table for pre-built duas
CREATE TABLE IF NOT EXISTS public.dua_library (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id text REFERENCES public.dua_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  title_arabic text,
  arabic_text text NOT NULL,
  transliteration text,
  english_translation text NOT NULL,
  source text,
  source_arabic text,
  audio_url text,
  is_core boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS but allow public read
ALTER TABLE public.dua_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read dua library"
  ON public.dua_library
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for dua_library
CREATE INDEX IF NOT EXISTS idx_dua_library_category ON public.dua_library(category_id);
CREATE INDEX IF NOT EXISTS idx_dua_library_is_core ON public.dua_library(is_core);

-- Create saved_duas table for user's personal duas
CREATE TABLE IF NOT EXISTS public.saved_duas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id text REFERENCES public.dua_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  arabic_text text NOT NULL,
  transliteration text,
  english_text text NOT NULL,
  allah_names_used text[] DEFAULT '{}',
  audio_url_arabic text,
  audio_url_english text,
  source text DEFAULT 'generated',
  library_dua_id uuid REFERENCES public.dua_library(id) ON DELETE SET NULL,
  is_favorite boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.saved_duas ENABLE ROW LEVEL SECURITY;

-- Users can read their own saved duas
CREATE POLICY "Users can read own duas"
  ON public.saved_duas
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Users can insert their own duas
CREATE POLICY "Users can create own duas"
  ON public.saved_duas
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can update their own duas
CREATE POLICY "Users can update own duas"
  ON public.saved_duas
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can delete their own duas
CREATE POLICY "Users can delete own duas"
  ON public.saved_duas
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Create indexes for saved_duas
CREATE INDEX IF NOT EXISTS idx_saved_duas_user_id ON public.saved_duas(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_duas_category ON public.saved_duas(category_id);
CREATE INDEX IF NOT EXISTS idx_saved_duas_is_favorite ON public.saved_duas(is_favorite);
CREATE INDEX IF NOT EXISTS idx_saved_duas_created_at ON public.saved_duas(created_at DESC);

-- Add updated_at trigger for saved_duas
CREATE OR REPLACE FUNCTION update_saved_duas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_saved_duas_updated_at ON public.saved_duas;
CREATE TRIGGER update_saved_duas_updated_at
  BEFORE UPDATE ON public.saved_duas
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_duas_updated_at();
