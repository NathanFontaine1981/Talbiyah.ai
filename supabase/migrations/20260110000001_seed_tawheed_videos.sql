-- Seed Tawheed Videos for Unshakable Foundations
-- These are curated educational videos about understanding Allah (Tawheed)

-- First, get the Tawheed category ID
DO $$
DECLARE
  tawheed_id UUID;
BEGIN
  SELECT id INTO tawheed_id FROM foundation_categories WHERE slug = 'tawheed';

  IF tawheed_id IS NULL THEN
    RAISE EXCEPTION 'Tawheed category not found. Run the main migration first.';
  END IF;

  -- Insert videos
  INSERT INTO foundation_videos (category_id, title, description, video_url, video_id, duration_minutes, order_index, is_active)
  VALUES
    -- Video 1: Introduction to Tawheed
    (tawheed_id,
     'What is Tawheed?',
     'An introduction to the concept of Tawheed (monotheism) - the foundation of Islam and the first thing every Muslim must understand.',
     'https://www.youtube.com/watch?v=gHJ6zzjgWwE',
     'gHJ6zzjgWwE',
     15,
     1,
     true),

    -- Video 2: Categories of Tawheed
    (tawheed_id,
     'The Three Categories of Tawheed',
     'Understanding Tawheed ar-Rububiyyah (Lordship), Tawheed al-Uluhiyyah (Worship), and Tawheed al-Asma wa Sifat (Names & Attributes).',
     'https://www.youtube.com/watch?v=LF0YXyL4E7A',
     'LF0YXyL4E7A',
     20,
     2,
     true),

    -- Video 3: Tawheed ar-Rububiyyah
    (tawheed_id,
     'Tawheed ar-Rububiyyah (Lordship)',
     'Allah as the sole Creator, Sustainer, and Controller of all that exists. Understanding His lordship over creation.',
     'https://www.youtube.com/watch?v=KqKDX_xiwFg',
     'KqKDX_xiwFg',
     18,
     3,
     true),

    -- Video 4: Tawheed al-Uluhiyyah
    (tawheed_id,
     'Tawheed al-Uluhiyyah (Worship)',
     'Directing all worship to Allah alone - the practical application of believing in One God.',
     'https://www.youtube.com/watch?v=ZaYiPVSKJNY',
     'ZaYiPVSKJNY',
     22,
     4,
     true),

    -- Video 5: Shirk - What Nullifies Tawheed
    (tawheed_id,
     'Understanding Shirk',
     'What is shirk (associating partners with Allah)? Understanding the opposite of Tawheed to protect your faith.',
     'https://www.youtube.com/watch?v=v7qV_29lKsE',
     'v7qV_29lKsE',
     25,
     5,
     true),

    -- Video 6: The Testimony of Faith
    (tawheed_id,
     'La ilaha illAllah - The Shahada',
     'Deep dive into the meaning and conditions of the testimony of faith - the key to entering Islam.',
     'https://www.youtube.com/watch?v=G9YA5vUVLbU',
     'G9YA5vUVLbU',
     20,
     6,
     true),

    -- Video 7: Names and Attributes of Allah
    (tawheed_id,
     'Names and Attributes of Allah',
     'Introduction to understanding Allah through His beautiful names and attributes without distortion or denial.',
     'https://www.youtube.com/watch?v=Fs1K-WiG6Hc',
     'Fs1K-WiG6Hc',
     30,
     7,
     true),

    -- Video 8: Tawheed in Daily Life
    (tawheed_id,
     'Living Tawheed Daily',
     'How Tawheed transforms your daily life - from reliance on Allah to removing fear of creation.',
     'https://www.youtube.com/watch?v=77B9H0KLNF4',
     '77B9H0KLNF4',
     18,
     8,
     true)
  ON CONFLICT DO NOTHING;

END $$;
