-- Add Spotify audio resources for Allah, Seerah and Lives of Prophets

-- First, get the pillar IDs
DO $$
DECLARE
  allah_pillar_id UUID;
  muhammad_pillar_id UUID;
  prophets_pillar_id UUID;
BEGIN
  -- Get Allah pillar ID
  SELECT id INTO allah_pillar_id FROM foundation_pillars WHERE slug = 'allah';

  -- Get Muhammad pillar ID
  SELECT id INTO muhammad_pillar_id FROM foundation_pillars WHERE slug = 'muhammad';

  -- Get Prophets pillar ID
  SELECT id INTO prophets_pillar_id FROM foundation_pillars WHERE slug = 'prophets';

  -- Insert Quran English (The Clear Quran) for Allah pillar
  INSERT INTO foundation_external_resources (
    pillar_id,
    title,
    description,
    resource_type,
    url,
    year,
    order_index,
    is_active
  )
  SELECT
    allah_pillar_id,
    'The Clear Quran - English Translation',
    'Listen to the Quran with Dr. Mustafa Khattab''s modern English translation. Clear, easy to understand, perfect for new Muslims.',
    'Podcast',
    'https://open.spotify.com/show/6F4LXsIqDHbH8YjJa2nvPK',
    2020,
    1,
    true
  WHERE allah_pillar_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM foundation_external_resources
    WHERE pillar_id = allah_pillar_id
    AND url = 'https://open.spotify.com/show/6F4LXsIqDHbH8YjJa2nvPK'
  );

  -- Insert Seerah podcast for Muhammad pillar (if not exists)
  INSERT INTO foundation_external_resources (
    pillar_id,
    title,
    description,
    resource_type,
    url,
    year,
    order_index,
    is_active
  )
  SELECT
    muhammad_pillar_id,
    'Seerah of Prophet Muhammad - Yasir Qadhi',
    'Complete audio series covering the life of Prophet Muhammad ﷺ from the Meccan to Medinan period. Over 100 episodes of detailed biography.',
    'Podcast',
    'https://open.spotify.com/show/3cHN4rbGsV0L2GNtieT99c',
    2013,
    1,
    true
  WHERE muhammad_pillar_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM foundation_external_resources
    WHERE pillar_id = muhammad_pillar_id
    AND url = 'https://open.spotify.com/show/3cHN4rbGsV0L2GNtieT99c'
  );

  -- Insert Lives of Prophets playlist for Prophets pillar (if not exists)
  INSERT INTO foundation_external_resources (
    pillar_id,
    title,
    description,
    resource_type,
    url,
    year,
    order_index,
    is_active
  )
  SELECT
    prophets_pillar_id,
    'Stories of The Prophets - Yasir Qadhi',
    'Audio series covering the inspiring stories of all the prophets from Adam to Jesus (peace be upon them all).',
    'Podcast',
    'https://open.spotify.com/playlist/53naeAXtGSAhTGSArju0qW',
    2015,
    1,
    true
  WHERE prophets_pillar_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM foundation_external_resources
    WHERE pillar_id = prophets_pillar_id
    AND url = 'https://open.spotify.com/playlist/53naeAXtGSAhTGSArju0qW'
  );
END $$;
