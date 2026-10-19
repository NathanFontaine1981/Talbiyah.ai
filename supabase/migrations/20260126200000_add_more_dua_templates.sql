-- Additional Dua Block Sets (Templates)
-- More quick-start options for users

-- Create a function to set up additional templates
CREATE OR REPLACE FUNCTION setup_additional_dua_templates()
RETURNS void AS $$
DECLARE
  v_hamd_universal UUID;
  v_hamd_health UUID;
  v_hamd_provision UUID;
  v_hamd_knowledge UUID;
  v_salawat_full UUID;
  v_salawat_short UUID;
  v_admission_universal UUID;
  v_admission_hardship UUID;
  v_request_health_1 UUID;
  v_request_health_2 UUID;
  v_request_anxiety_1 UUID;
  v_request_anxiety_2 UUID;
  v_request_provision_1 UUID;
  v_request_provision_2 UUID;
  v_request_family_1 UUID;
  v_request_family_2 UUID;
  v_request_knowledge_1 UUID;
  v_request_knowledge_2 UUID;
  v_request_patience_1 UUID;
  v_others_parents UUID;
  v_others_ummah UUID;
  v_closing_acceptance UUID;
  v_closing_ameen UUID;
BEGIN
  -- Get block IDs for templates
  SELECT id INTO v_hamd_universal FROM dua_blocks WHERE block_type = 'hamd' AND category_id IS NULL AND is_core = true ORDER BY display_order LIMIT 1;
  SELECT id INTO v_hamd_health FROM dua_blocks WHERE block_type = 'hamd' AND category_id = 'health' LIMIT 1;
  SELECT id INTO v_hamd_provision FROM dua_blocks WHERE block_type = 'hamd' AND category_id = 'provision' LIMIT 1;
  SELECT id INTO v_hamd_knowledge FROM dua_blocks WHERE block_type = 'hamd' AND category_id = 'knowledge' LIMIT 1;

  SELECT id INTO v_salawat_full FROM dua_blocks WHERE block_type = 'salawat' AND is_core = true ORDER BY display_order LIMIT 1 OFFSET 1;
  SELECT id INTO v_salawat_short FROM dua_blocks WHERE block_type = 'salawat' AND is_core = true ORDER BY display_order LIMIT 1;

  SELECT id INTO v_admission_universal FROM dua_blocks WHERE block_type = 'admission' AND category_id IS NULL AND is_core = true ORDER BY display_order LIMIT 1;
  SELECT id INTO v_admission_hardship FROM dua_blocks WHERE block_type = 'admission' AND category_id = 'hardship' LIMIT 1;

  SELECT id INTO v_request_health_1 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'health' AND is_core = true LIMIT 1;
  SELECT id INTO v_request_health_2 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'health' ORDER BY display_order LIMIT 1 OFFSET 1;

  SELECT id INTO v_request_anxiety_1 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'anxiety' AND is_core = true LIMIT 1;
  SELECT id INTO v_request_anxiety_2 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'anxiety' ORDER BY display_order LIMIT 1 OFFSET 1;

  SELECT id INTO v_request_provision_1 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'provision' AND is_core = true LIMIT 1;
  SELECT id INTO v_request_provision_2 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'provision' ORDER BY display_order LIMIT 1 OFFSET 1;

  SELECT id INTO v_request_family_1 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'family' AND is_core = true LIMIT 1;
  SELECT id INTO v_request_family_2 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'family' ORDER BY display_order LIMIT 1 OFFSET 1;

  SELECT id INTO v_request_knowledge_1 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'knowledge' AND is_core = true LIMIT 1;
  SELECT id INTO v_request_knowledge_2 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'knowledge' ORDER BY display_order LIMIT 1 OFFSET 1;

  SELECT id INTO v_request_patience_1 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'patience' AND is_core = true LIMIT 1;

  SELECT id INTO v_others_parents FROM dua_blocks WHERE block_type = 'others' AND is_core = true ORDER BY display_order LIMIT 1 OFFSET 1;
  SELECT id INTO v_others_ummah FROM dua_blocks WHERE block_type = 'others' AND arabic_text LIKE '%أُمَّةَ مُحَمَّدٍ%' LIMIT 1;

  SELECT id INTO v_closing_acceptance FROM dua_blocks WHERE block_type = 'closing' AND arabic_text LIKE '%تَقَبَّلْ%' LIMIT 1;
  SELECT id INTO v_closing_ameen FROM dua_blocks WHERE block_type = 'closing' AND is_core = true ORDER BY display_order LIMIT 1 OFFSET 2;

  -- Insert new templates (only if not already existing)
  INSERT INTO dua_block_sets (name, name_arabic, category_id, description, hamd_block_id, salawat_block_id, admission_block_id, request_block_ids, others_block_id, closing_block_id, is_featured, display_order)
  SELECT
    'Health & Healing',
    'الصحة والشفاء',
    'health',
    'A comprehensive dua for physical and spiritual healing',
    COALESCE(v_hamd_health, v_hamd_universal),
    v_salawat_short,
    v_admission_universal,
    ARRAY[v_request_health_1, v_request_health_2],
    v_others_parents,
    v_closing_acceptance,
    true,
    5
  WHERE NOT EXISTS (SELECT 1 FROM dua_block_sets WHERE name = 'Health & Healing');

  INSERT INTO dua_block_sets (name, name_arabic, category_id, description, hamd_block_id, salawat_block_id, admission_block_id, request_block_ids, others_block_id, closing_block_id, is_featured, display_order)
  SELECT
    'Relief from Anxiety',
    'تفريج الهم والقلق',
    'anxiety',
    'A soothing dua for peace of mind and relief from worry',
    v_hamd_universal,
    v_salawat_full,
    COALESCE(v_admission_hardship, v_admission_universal),
    ARRAY[v_request_anxiety_1, v_request_anxiety_2],
    v_others_ummah,
    v_closing_ameen,
    true,
    6
  WHERE NOT EXISTS (SELECT 1 FROM dua_block_sets WHERE name = 'Relief from Anxiety');

  INSERT INTO dua_block_sets (name, name_arabic, category_id, description, hamd_block_id, salawat_block_id, admission_block_id, request_block_ids, others_block_id, closing_block_id, is_featured, display_order)
  SELECT
    'Seeking Provision',
    'طلب الرزق',
    'provision',
    'A dua for halal sustenance and barakah in provision',
    COALESCE(v_hamd_provision, v_hamd_universal),
    v_salawat_short,
    v_admission_universal,
    ARRAY[v_request_provision_1, v_request_provision_2],
    v_others_parents,
    v_closing_acceptance,
    false,
    7
  WHERE NOT EXISTS (SELECT 1 FROM dua_block_sets WHERE name = 'Seeking Provision');

  INSERT INTO dua_block_sets (name, name_arabic, category_id, description, hamd_block_id, salawat_block_id, admission_block_id, request_block_ids, others_block_id, closing_block_id, is_featured, display_order)
  SELECT
    'Family Blessings',
    'بركات الأسرة',
    'family',
    'A dua for righteous offspring and family harmony',
    v_hamd_universal,
    v_salawat_full,
    v_admission_universal,
    ARRAY[v_request_family_1, v_request_family_2],
    v_others_parents,
    v_closing_ameen,
    false,
    8
  WHERE NOT EXISTS (SELECT 1 FROM dua_block_sets WHERE name = 'Family Blessings');

  INSERT INTO dua_block_sets (name, name_arabic, category_id, description, hamd_block_id, salawat_block_id, admission_block_id, request_block_ids, others_block_id, closing_block_id, is_featured, display_order)
  SELECT
    'Seeking Knowledge',
    'طلب العلم',
    'knowledge',
    'A dua for beneficial knowledge and understanding',
    COALESCE(v_hamd_knowledge, v_hamd_universal),
    v_salawat_short,
    v_admission_universal,
    ARRAY[v_request_knowledge_1, v_request_knowledge_2],
    v_others_ummah,
    v_closing_acceptance,
    false,
    9
  WHERE NOT EXISTS (SELECT 1 FROM dua_block_sets WHERE name = 'Seeking Knowledge');

  INSERT INTO dua_block_sets (name, name_arabic, category_id, description, hamd_block_id, salawat_block_id, admission_block_id, request_block_ids, others_block_id, closing_block_id, is_featured, display_order)
  SELECT
    'Patience in Trial',
    'الصبر على البلاء',
    'patience',
    'A dua for patience and steadfastness during difficulties',
    v_hamd_universal,
    v_salawat_full,
    COALESCE(v_admission_hardship, v_admission_universal),
    ARRAY[v_request_patience_1],
    v_others_ummah,
    v_closing_ameen,
    false,
    10
  WHERE NOT EXISTS (SELECT 1 FROM dua_block_sets WHERE name = 'Patience in Trial');

END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT setup_additional_dua_templates();

-- Drop the function after use
DROP FUNCTION IF EXISTS setup_additional_dua_templates();
