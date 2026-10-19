-- Modular Dua Builder System
-- Creates tables for block-based dua composition following classical Islamic dua architecture
-- Block types: hamd (praise), salawat, admission, request, others, closing

-- ============================================
-- 1. DUA BLOCKS TABLE
-- Building blocks for composing duas
-- ============================================
CREATE TABLE IF NOT EXISTS dua_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_type TEXT NOT NULL CHECK (block_type IN ('hamd', 'salawat', 'admission', 'request', 'others', 'closing')),
  category_id TEXT,  -- NULL for universal blocks, specific category ID for contextual blocks
  arabic_text TEXT NOT NULL,
  transliteration TEXT NOT NULL,
  english_translation TEXT NOT NULL,
  source TEXT,  -- 'Quran 3:8', 'Sahih Bukhari', etc.
  allah_names TEXT[],  -- Relevant Names of Allah for this block
  is_core BOOLEAN DEFAULT false,  -- Essential blocks that should appear first in selections
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_dua_blocks_type ON dua_blocks(block_type);
CREATE INDEX IF NOT EXISTS idx_dua_blocks_category ON dua_blocks(category_id);
CREATE INDEX IF NOT EXISTS idx_dua_blocks_type_category ON dua_blocks(block_type, category_id);
CREATE INDEX IF NOT EXISTS idx_dua_blocks_is_core ON dua_blocks(is_core);

-- ============================================
-- 2. USER DUA COMPOSITIONS TABLE
-- User-built duas from selected blocks
-- ============================================
CREATE TABLE IF NOT EXISTS user_dua_compositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  hamd_block_id UUID REFERENCES dua_blocks(id),
  salawat_block_id UUID REFERENCES dua_blocks(id),
  admission_block_id UUID REFERENCES dua_blocks(id),
  request_block_ids UUID[],  -- Can have multiple request blocks
  others_block_id UUID REFERENCES dua_blocks(id),
  closing_block_id UUID REFERENCES dua_blocks(id),
  custom_text TEXT,  -- Optional personal addition (guided)
  category_id TEXT,
  is_favorite BOOLEAN DEFAULT false,
  audio_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_dua_compositions_user ON user_dua_compositions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dua_compositions_category ON user_dua_compositions(category_id);
CREATE INDEX IF NOT EXISTS idx_user_dua_compositions_favorite ON user_dua_compositions(is_favorite);
CREATE INDEX IF NOT EXISTS idx_user_dua_compositions_created ON user_dua_compositions(created_at DESC);

-- ============================================
-- 3. DUA BLOCK SETS TABLE
-- Pre-composed sets for quick start templates
-- ============================================
CREATE TABLE IF NOT EXISTS dua_block_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_arabic TEXT,
  category_id TEXT,
  description TEXT,
  hamd_block_id UUID REFERENCES dua_blocks(id),
  salawat_block_id UUID REFERENCES dua_blocks(id),
  admission_block_id UUID REFERENCES dua_blocks(id),
  request_block_ids UUID[],
  others_block_id UUID REFERENCES dua_blocks(id),
  closing_block_id UUID REFERENCES dua_blocks(id),
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dua_block_sets_category ON dua_block_sets(category_id);
CREATE INDEX IF NOT EXISTS idx_dua_block_sets_featured ON dua_block_sets(is_featured);

-- ============================================
-- 4. RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE dua_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dua_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dua_block_sets ENABLE ROW LEVEL SECURITY;

-- dua_blocks: Public read access (reference data)
CREATE POLICY "Anyone can read dua blocks"
  ON dua_blocks FOR SELECT
  USING (true);

-- dua_block_sets: Public read access (reference data)
CREATE POLICY "Anyone can read dua block sets"
  ON dua_block_sets FOR SELECT
  USING (true);

-- user_dua_compositions: User-scoped access
CREATE POLICY "Users can read own compositions"
  ON user_dua_compositions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own compositions"
  ON user_dua_compositions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own compositions"
  ON user_dua_compositions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own compositions"
  ON user_dua_compositions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. SEED DATA: DUA BLOCKS
-- Authentic content from Quran and Sunnah
-- ============================================

-- HAMD (Praise) Blocks - Universal
INSERT INTO dua_blocks (block_type, category_id, arabic_text, transliteration, english_translation, source, allah_names, is_core, display_order) VALUES
-- Core Hamd blocks
('hamd', NULL, 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'Al-hamdu lillahi Rabbil ''alamin', 'All praise is due to Allah, Lord of the worlds', 'Quran 1:2', ARRAY['Ar-Rabb', 'Al-Hamid'], true, 1),
('hamd', NULL, 'الْحَمْدُ لِلَّهِ الَّذِي هَدَانَا لِهَٰذَا وَمَا كُنَّا لِنَهْتَدِيَ لَوْلَا أَنْ هَدَانَا اللَّهُ', 'Al-hamdu lillahil-ladhi hadana li-hadha wa ma kunna li-nahtadiya lawla an hadanallah', 'Praise is to Allah who guided us to this. We would never have been guided if Allah had not guided us.', 'Quran 7:43', ARRAY['Al-Hadi', 'Al-Hamid'], true, 2),
('hamd', NULL, 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ', 'Subhanaka Allahumma wa bihamdik', 'Glory be to You, O Allah, and praise be to You', 'Sahih Muslim', ARRAY['Al-Quddus', 'Al-Hamid'], true, 3),
('hamd', NULL, 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ', 'Subhanallahi wa bihamdih, Subhanallahil-''Azim', 'Glory be to Allah and praise be to Him. Glory be to Allah, the Magnificent.', 'Sahih Bukhari', ARRAY['Al-Quddus', 'Al-Azim', 'Al-Hamid'], true, 4),
('hamd', NULL, 'تَبَارَكَ اسْمُكَ وَتَعَالَىٰ جَدُّكَ وَلَا إِلَٰهَ غَيْرُكَ', 'Tabaraka ismuka wa ta''ala jadduk, wa la ilaha ghayruk', 'Blessed is Your Name and exalted is Your Majesty, and there is no god but You', 'Abu Dawud', ARRAY['Al-Mutakabbir', 'Al-Aziz'], true, 5),

-- Category-specific Hamd blocks
('hamd', 'forgiveness', 'الْحَمْدُ لِلَّهِ الَّذِي يَقْبَلُ التَّوْبَةَ عَنْ عِبَادِهِ وَيَعْفُو عَنِ السَّيِّئَاتِ', 'Al-hamdu lillahil-ladhi yaqbalut-tawbata ''an ''ibadihi wa ya''fu ''anis-sayyi''at', 'Praise is to Allah who accepts repentance from His servants and pardons sins', 'Quran 42:25', ARRAY['At-Tawwab', 'Al-Afuw', 'Al-Ghaffar'], false, 10),
('hamd', 'gratitude', 'الْحَمْدُ لِلَّهِ عَلَىٰ كُلِّ حَالٍ', 'Al-hamdu lillahi ''ala kulli hal', 'Praise is to Allah in all circumstances', 'Ibn Majah', ARRAY['Ash-Shakur', 'Al-Hamid'], false, 11),
('hamd', 'health', 'الْحَمْدُ لِلَّهِ الَّذِي عَافَانِي مِمَّا ابْتَلَاكَ بِهِ', 'Al-hamdu lillahil-ladhi ''afani mimma-btalaka bih', 'Praise is to Allah who has kept me safe from what He has afflicted you with', 'Tirmidhi', ARRAY['Ash-Shafi', 'Al-Mu''afi'], false, 12),
('hamd', 'provision', 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ', 'Al-hamdu lillahil-ladhi at''amana wa saqana wa ja''alana muslimin', 'Praise is to Allah who fed us, gave us drink, and made us Muslims', 'Abu Dawud', ARRAY['Ar-Razzaq', 'Al-Karim'], false, 13);

-- SALAWAT Blocks
INSERT INTO dua_blocks (block_type, category_id, arabic_text, transliteration, english_translation, source, allah_names, is_core, display_order) VALUES
('salawat', NULL, 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ', 'Allahumma salli ''ala Muhammad wa ''ala ali Muhammad', 'O Allah, send blessings upon Muhammad and the family of Muhammad', 'Sahih Bukhari', NULL, true, 1),
('salawat', NULL, 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ', 'Allahumma salli ''ala Muhammad wa ''ala ali Muhammad, kama sallayta ''ala Ibrahim wa ''ala ali Ibrahim, innaka Hamidum Majid', 'O Allah, send blessings upon Muhammad and the family of Muhammad, as You sent blessings upon Ibrahim and the family of Ibrahim. Indeed, You are Praiseworthy, Glorious.', 'Sahih Bukhari', ARRAY['Al-Hamid', 'Al-Majid'], true, 2),
('salawat', NULL, 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ', 'Allahumma salli wa sallim wa barik ''ala sayyidina Muhammad', 'O Allah, send blessings, peace, and blessings upon our master Muhammad', 'Tirmidhi', NULL, true, 3),
('salawat', NULL, 'صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ', 'Sallallahu ''alayhi wa sallam', 'May Allah send blessings and peace upon him', 'General', NULL, false, 4);

-- ADMISSION (Humility/Weakness) Blocks
INSERT INTO dua_blocks (block_type, category_id, arabic_text, transliteration, english_translation, source, allah_names, is_core, display_order) VALUES
('admission', NULL, 'رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ', 'Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna la-nakunanna minal-khasirin', 'Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy on us, we will surely be among the losers', 'Quran 7:23', ARRAY['Al-Ghaffar', 'Ar-Rahman'], true, 1),
('admission', NULL, 'لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ', 'La ilaha illa anta subhanaka inni kuntu minaz-zalimin', 'There is no god but You, glory be to You, indeed I have been among the wrongdoers', 'Quran 21:87', ARRAY['Al-Quddus'], true, 2),
('admission', NULL, 'اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنتَ', 'Allahumma inni zalamtu nafsi zulman kathiran wa la yaghfirudh-dhunuba illa anta', 'O Allah, I have wronged myself greatly, and none forgives sins but You', 'Sahih Bukhari', ARRAY['Al-Ghaffar'], true, 3),
('admission', NULL, 'رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ', 'Rabbi inni lima anzalta ilayya min khayrin faqir', 'My Lord, indeed I am, for whatever good You would send down to me, in need', 'Quran 28:24', ARRAY['Al-Ghani', 'Al-Karim'], true, 4),
('admission', NULL, 'اللَّهُمَّ أَنتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ', 'Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana ''abduk', 'O Allah, You are my Lord, there is no god but You. You created me and I am Your servant', 'Sahih Bukhari', ARRAY['Ar-Rabb', 'Al-Khaliq'], true, 5),

-- Category-specific admission blocks
('admission', 'forgiveness', 'أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنبِي', 'Abu''u laka bi-ni''matika ''alayya, wa abu''u bi-dhanbi', 'I acknowledge Your blessings upon me and I acknowledge my sin', 'Sahih Bukhari', ARRAY['Al-Ghaffar', 'Al-Afuw'], false, 10),
('admission', 'hardship', 'اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَىٰ نَفْسِي طَرْفَةَ عَيْنٍ', 'Allahumma rahmataka arju fala takilni ila nafsi tarfata ''ayn', 'O Allah, it is Your mercy that I hope for, so do not leave me to myself even for the blink of an eye', 'Abu Dawud', ARRAY['Ar-Rahman', 'Ar-Rahim'], false, 11);

-- REQUEST Blocks (organized by category)
INSERT INTO dua_blocks (block_type, category_id, arabic_text, transliteration, english_translation, source, allah_names, is_core, display_order) VALUES
-- Forgiveness requests
('request', 'forgiveness', 'فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنتَ', 'Faghfir li fa-innahu la yaghfirudh-dhunuba illa anta', 'So forgive me, for none forgives sins but You', 'Sahih Bukhari', ARRAY['Al-Ghaffar', 'At-Tawwab'], true, 1),
('request', 'forgiveness', 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي', 'Allahumma innaka ''Afuwwun tuhibbul-''afwa fa''fu ''anni', 'O Allah, You are the Pardoner, You love to pardon, so pardon me', 'Tirmidhi', ARRAY['Al-Afuw'], true, 2),
('request', 'forgiveness', 'رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا', 'Rabbana-ghfir lana dhunubana wa israfana fi amrina', 'Our Lord, forgive us our sins and our excess in our affairs', 'Quran 3:147', ARRAY['Al-Ghaffar', 'Al-Ghafur'], false, 3),
('request', 'forgiveness', 'رَبِّ اغْفِرْ وَارْحَمْ وَأَنتَ خَيْرُ الرَّاحِمِينَ', 'Rabbighfir warham wa anta khayrur-rahimin', 'My Lord, forgive and have mercy, and You are the best of the merciful', 'Quran 23:118', ARRAY['Al-Ghaffar', 'Ar-Rahim'], false, 4),

-- Guidance requests
('request', 'guidance', 'اللَّهُمَّ اهْدِنِي وَسَدِّدْنِي', 'Allahumma-hdini wa saddidni', 'O Allah, guide me and keep me steadfast', 'Sahih Muslim', ARRAY['Al-Hadi'], true, 1),
('request', 'guidance', 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً إِنَّكَ أَنتَ الْوَهَّابُ', 'Rabbana la tuzigh qulubana ba''da idh hadaytana wa hab lana min ladunka rahmatan innaka antal-Wahhab', 'Our Lord, do not let our hearts deviate after You have guided us, and grant us mercy from Yourself. Indeed, You are the Bestower.', 'Quran 3:8', ARRAY['Al-Hadi', 'Al-Wahhab'], true, 2),
('request', 'guidance', 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', 'Ihdinas-siratal-mustaqim', 'Guide us to the straight path', 'Quran 1:6', ARRAY['Al-Hadi'], true, 3),
('request', 'guidance', 'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ', 'Allahumma inni astakhiruka bi-''ilmika wa astaqdiruka bi-qudratika', 'O Allah, I seek Your guidance by virtue of Your knowledge, and I seek ability by virtue of Your power', 'Sahih Bukhari', ARRAY['Al-Alim', 'Al-Qadir'], false, 4),

-- Protection requests
('request', 'protection', 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِن شَرِّ مَا خَلَقَ', 'A''udhu bi-kalimatillahit-tammat min sharri ma khalaq', 'I seek refuge in the perfect words of Allah from the evil of what He has created', 'Sahih Muslim', ARRAY['Al-Hafiz', 'Al-Muhaymin'], true, 1),
('request', 'protection', 'اللَّهُمَّ احْفَظْنِي مِن بَيْنِ يَدَيَّ وَمِنْ خَلْفِي وَعَن يَمِينِي وَعَن شِمَالِي وَمِن فَوْقِي', 'Allahummahfazni min bayni yadayya wa min khalfi wa ''an yamini wa ''an shimali wa min fawqi', 'O Allah, protect me from in front of me, from behind me, from my right, from my left, and from above me', 'Abu Dawud', ARRAY['Al-Hafiz', 'Al-Muhaymin'], true, 2),
('request', 'protection', 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ', 'Bismillahil-ladhi la yadurru ma''asmihi shay''un fil-ardi wa la fis-sama''i wa huwas-Sami''ul-''Alim', 'In the Name of Allah, with Whose Name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing', 'Abu Dawud', ARRAY['As-Sami', 'Al-Alim'], true, 3),

-- Health requests
('request', 'health', 'اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ اشْفِ أَنتَ الشَّافِي لَا شِفَاءَ إِلَّا شِفَاؤُكَ شِفَاءً لَا يُغَادِرُ سَقَمًا', 'Allahumma Rabban-nas, adhhibil-ba''s, ishfi antash-Shafi, la shifa''a illa shifa''uka, shifa''an la yughadiru saqama', 'O Allah, Lord of mankind, remove the harm, heal, for You are the Healer. There is no healing except Your healing, a healing that leaves no illness behind.', 'Sahih Bukhari', ARRAY['Ash-Shafi', 'Ar-Rabb'], true, 1),
('request', 'health', 'اللَّهُمَّ عَافِنِي فِي بَدَنِي اللَّهُمَّ عَافِنِي فِي سَمْعِي اللَّهُمَّ عَافِنِي فِي بَصَرِي', 'Allahumma ''afini fi badani, Allahumma ''afini fi sam''i, Allahumma ''afini fi basari', 'O Allah, grant me health in my body. O Allah, grant me health in my hearing. O Allah, grant me health in my sight.', 'Abu Dawud', ARRAY['Ash-Shafi', 'Al-Mu''afi'], true, 2),

-- Anxiety & Relief requests
('request', 'anxiety', 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ وَالْبُخْلِ وَالْجُبْنِ وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ', 'Allahumma inni a''udhu bika minal-hammi wal-hazan, wal-''ajzi wal-kasal, wal-bukhli wal-jubn, wa dala''id-dayni wa ghalabatir-rijal', 'O Allah, I seek refuge in You from anxiety and grief, from weakness and laziness, from miserliness and cowardice, from being overcome by debt and overpowered by men', 'Sahih Bukhari', ARRAY['As-Salam', 'Al-Latif'], true, 1),
('request', 'anxiety', 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ', 'Hasbiyallahu la ilaha illa huwa ''alayhi tawakkaltu wa huwa Rabbul-''Arshil-''Azim', 'Allah is sufficient for me. There is no god but He. In Him I put my trust, and He is the Lord of the Magnificent Throne.', 'Quran 9:129', ARRAY['Al-Wakil', 'Al-Azim'], true, 2),
('request', 'anxiety', 'أَنْ تَجْعَلَ الْقُرْآنَ رَبِيعَ قَلْبِي وَنُورَ صَدْرِي وَجَلَاءَ حُزْنِي وَذَهَابَ هَمِّي', 'An taj''alal-Qur''ana rabi''a qalbi, wa nura sadri, wa jala''a huzni, wa dhahaba hammi', 'Make the Quran the spring of my heart, the light of my chest, the banisher of my sadness, and the reliever of my distress', 'Ahmad', ARRAY['An-Nur', 'Al-Latif'], false, 3),

-- Hardship requests
('request', 'hardship', 'لَا إِلَٰهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ', 'La ilaha illallahul-''Azimul-Halim, la ilaha illallahu Rabbul-''Arshil-''Azim', 'There is no god but Allah, the Magnificent, the Forbearing. There is no god but Allah, Lord of the Magnificent Throne.', 'Sahih Bukhari', ARRAY['Al-Azim', 'Al-Halim'], true, 1),
('request', 'hardship', 'وَأُفَوِّضُ أَمْرِي إِلَى اللَّهِ إِنَّ اللَّهَ بَصِيرٌ بِالْعِبَادِ', 'Wa ufawwidu amri ilallah, innallaha Basirun bil-''ibad', 'And I entrust my affair to Allah. Indeed, Allah is Seeing of His servants.', 'Quran 40:44', ARRAY['Al-Basir', 'Al-Wakil'], true, 2),

-- Provision requests
('request', 'provision', 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ', 'Allahummak-fini bi-halalika ''an haramik, wa aghnini bi-fadlika ''amman siwak', 'O Allah, suffice me with what is lawful against what is unlawful, and make me independent of all besides You by Your grace', 'Tirmidhi', ARRAY['Ar-Razzaq', 'Al-Ghani'], true, 1),
('request', 'provision', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا', 'Allahumma inni as''aluka ''ilman nafi''a, wa rizqan tayyiba, wa ''amalan mutaqabbala', 'O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds', 'Ibn Majah', ARRAY['Ar-Razzaq', 'Al-Alim'], true, 2),

-- Family requests
('request', 'family', 'رَبِّ هَبْ لِي مِن لَّدُنكَ ذُرِّيَّةً طَيِّبَةً إِنَّكَ سَمِيعُ الدُّعَاءِ', 'Rabbi hab li min ladunka dhurriyyatan tayyibatan innaka Sami''ud-du''a', 'My Lord, grant me from Yourself a good offspring. Indeed, You are the Hearer of supplication.', 'Quran 3:38', ARRAY['Al-Wahhab', 'As-Sami'], true, 1),
('request', 'family', 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا', 'Rabbana hab lana min azwajina wa dhurriyyatina qurrata a''yunin waj''alna lil-muttaqina imama', 'Our Lord, grant us from our spouses and offspring comfort to our eyes, and make us leaders of the righteous', 'Quran 25:74', ARRAY['Al-Wahhab', 'Al-Barr'], true, 2),

-- Knowledge requests
('request', 'knowledge', 'رَبِّ زِدْنِي عِلْمًا', 'Rabbi zidni ''ilma', 'My Lord, increase me in knowledge', 'Quran 20:114', ARRAY['Al-Alim'], true, 1),
('request', 'knowledge', 'اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي وَعَلِّمْنِي مَا يَنفَعُنِي وَزِدْنِي عِلْمًا', 'Allahumma-nfa''ni bima ''allamtani wa ''allimni ma yanfa''uni wa zidni ''ilma', 'O Allah, benefit me with what You have taught me, teach me what will benefit me, and increase me in knowledge', 'Tirmidhi', ARRAY['Al-Alim', 'Al-Hakim'], true, 2),

-- Patience requests
('request', 'patience', 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا', 'Rabbana afrigh ''alayna sabran wa thabbit aqdamana', 'Our Lord, pour upon us patience and make our feet firm', 'Quran 2:250', ARRAY['As-Sabur'], true, 1),
('request', 'patience', 'رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ', 'Rabbi awzi''ni an ashkura ni''matakal-lati an''amta ''alayya', 'My Lord, enable me to be grateful for Your favor which You have bestowed upon me', 'Quran 27:19', ARRAY['Ash-Shakur'], false, 2),

-- Success requests
('request', 'success', 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina ''adhaban-nar', 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire', 'Quran 2:201', ARRAY['Al-Karim', 'Al-Wahhab'], true, 1),
('request', 'success', 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا وَأَنتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا', 'Allahumma la sahla illa ma ja''altahu sahla, wa anta taj''alul-hazna idha shi''ta sahla', 'O Allah, nothing is easy except what You make easy. And You make difficulty easy if You wish.', 'Ibn Hibban', ARRAY['Al-Fattah', 'Al-Qadir'], true, 2),

-- Gratitude requests
('request', 'gratitude', 'اللَّهُمَّ أَعِنِّي عَلَىٰ ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ', 'Allahumma a''inni ''ala dhikrika wa shukrika wa husni ''ibadatik', 'O Allah, help me to remember You, to be grateful to You, and to worship You in the best manner', 'Abu Dawud', ARRAY['Ash-Shakur'], true, 1);

-- OTHERS (Dua for Parents, Ummah, Deceased) Blocks
INSERT INTO dua_blocks (block_type, category_id, arabic_text, transliteration, english_translation, source, allah_names, is_core, display_order) VALUES
('others', NULL, 'رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ', 'Rabbighfir li wa li-walidayya wa lil-mu''minina yawma yaqumul-hisab', 'My Lord, forgive me and my parents and the believers on the Day the account is established', 'Quran 14:41', ARRAY['Al-Ghaffar'], true, 1),
('others', NULL, 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', 'Rabbir-hamhuma kama rabbayanee saghira', 'My Lord, have mercy upon them as they brought me up when I was small', 'Quran 17:24', ARRAY['Ar-Rahman', 'Ar-Rahim'], true, 2),
('others', NULL, 'اللَّهُمَّ اغْفِرْ لِلْمُسْلِمِينَ وَالْمُسْلِمَاتِ', 'Allahumma-ghfir lil-muslimina wal-muslimat', 'O Allah, forgive the Muslim men and Muslim women', 'Tabarani', ARRAY['Al-Ghaffar'], true, 3),
('others', NULL, 'رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ', 'Rabbana-ghfir lana wa li-ikhwaninal-ladhina sabaquna bil-iman', 'Our Lord, forgive us and our brothers who preceded us in faith', 'Quran 59:10', ARRAY['Al-Ghaffar'], true, 4),
('others', NULL, 'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ', 'Allahumma-ghfir lahu warhamhu wa ''afihi wa''fu ''anh', 'O Allah, forgive them, have mercy on them, give them health, and pardon them', 'Sahih Muslim', ARRAY['Al-Ghaffar', 'Ar-Rahim', 'Al-Afuw'], false, 5),
('others', NULL, 'اللَّهُمَّ أَصْلِحْ أُمَّةَ مُحَمَّدٍ', 'Allahumma aslih ummata Muhammad', 'O Allah, rectify the Ummah of Muhammad', 'General', NULL, false, 6);

-- CLOSING Blocks
INSERT INTO dua_blocks (block_type, category_id, arabic_text, transliteration, english_translation, source, allah_names, is_core, display_order) VALUES
('closing', NULL, 'وَصَلَّى اللَّهُ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ وَعَلَىٰ آلِهِ وَصَحْبِهِ وَسَلَّمَ', 'Wa sallallahu ''ala sayyidina Muhammad wa ''ala alihi wa sahbihi wa sallam', 'And may Allah send blessings and peace upon our master Muhammad and upon his family and companions', 'General', NULL, true, 1),
('closing', NULL, 'سُبْحَانَ رَبِّكَ رَبِّ الْعِزَّةِ عَمَّا يَصِفُونَ وَسَلَامٌ عَلَى الْمُرْسَلِينَ وَالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'Subhana Rabbika Rabbil-''izzati ''amma yasifun, wa salamun ''alal-mursalin, wal-hamdu lillahi Rabbil-''alamin', 'Glory be to your Lord, the Lord of Honor, above what they describe. And peace be upon the messengers. And praise is to Allah, Lord of the worlds.', 'Quran 37:180-182', ARRAY['Ar-Rabb', 'Al-Aziz'], true, 2),
('closing', NULL, 'آمِينَ يَا رَبَّ الْعَالَمِينَ', 'Amin, ya Rabbal-''alamin', 'Amin, O Lord of the worlds', 'General', ARRAY['Ar-Rabb'], true, 3),
('closing', NULL, 'إِنَّكَ سَمِيعٌ قَرِيبٌ مُجِيبُ الدُّعَاءِ', 'Innaka Sami''un Qaribun Mujibud-du''a', 'Indeed, You are All-Hearing, Near, the Answerer of prayers', 'Quran 11:61', ARRAY['As-Sami', 'Al-Qarib', 'Al-Mujib'], false, 4),
('closing', NULL, 'وَآخِرُ دَعْوَانَا أَنِ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'Wa akhiru da''wana anil-hamdu lillahi Rabbil-''alamin', 'And our last call is: Praise is to Allah, Lord of the worlds', 'Quran 10:10', ARRAY['Ar-Rabb', 'Al-Hamid'], false, 5);

-- ============================================
-- 6. SEED DATA: DUA BLOCK SETS (Templates)
-- Pre-composed sets for quick start
-- ============================================

-- We'll add the template sets after getting the block IDs
-- This requires a function or separate migration

-- Create a function to set up templates after blocks are created
CREATE OR REPLACE FUNCTION setup_dua_block_sets()
RETURNS void AS $$
DECLARE
  v_hamd_1 UUID;
  v_hamd_forgiveness UUID;
  v_salawat_1 UUID;
  v_salawat_2 UUID;
  v_admission_1 UUID;
  v_admission_2 UUID;
  v_request_forgiveness_1 UUID;
  v_request_forgiveness_2 UUID;
  v_request_guidance_1 UUID;
  v_request_guidance_2 UUID;
  v_request_protection_1 UUID;
  v_request_gratitude_1 UUID;
  v_request_success_1 UUID;
  v_others_1 UUID;
  v_others_2 UUID;
  v_closing_1 UUID;
  v_closing_2 UUID;
BEGIN
  -- Get block IDs
  SELECT id INTO v_hamd_1 FROM dua_blocks WHERE block_type = 'hamd' AND is_core = true ORDER BY display_order LIMIT 1;
  SELECT id INTO v_hamd_forgiveness FROM dua_blocks WHERE block_type = 'hamd' AND category_id = 'forgiveness' LIMIT 1;
  SELECT id INTO v_salawat_1 FROM dua_blocks WHERE block_type = 'salawat' AND is_core = true ORDER BY display_order LIMIT 1;
  SELECT id INTO v_salawat_2 FROM dua_blocks WHERE block_type = 'salawat' AND is_core = true ORDER BY display_order LIMIT 1 OFFSET 1;
  SELECT id INTO v_admission_1 FROM dua_blocks WHERE block_type = 'admission' AND is_core = true ORDER BY display_order LIMIT 1;
  SELECT id INTO v_admission_2 FROM dua_blocks WHERE block_type = 'admission' AND is_core = true ORDER BY display_order LIMIT 1 OFFSET 1;
  SELECT id INTO v_request_forgiveness_1 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'forgiveness' AND is_core = true ORDER BY display_order LIMIT 1;
  SELECT id INTO v_request_forgiveness_2 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'forgiveness' AND is_core = true ORDER BY display_order LIMIT 1 OFFSET 1;
  SELECT id INTO v_request_guidance_1 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'guidance' AND is_core = true ORDER BY display_order LIMIT 1;
  SELECT id INTO v_request_guidance_2 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'guidance' AND is_core = true ORDER BY display_order LIMIT 1 OFFSET 1;
  SELECT id INTO v_request_protection_1 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'protection' AND is_core = true ORDER BY display_order LIMIT 1;
  SELECT id INTO v_request_gratitude_1 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'gratitude' AND is_core = true LIMIT 1;
  SELECT id INTO v_request_success_1 FROM dua_blocks WHERE block_type = 'request' AND category_id = 'success' AND is_core = true ORDER BY display_order LIMIT 1;
  SELECT id INTO v_others_1 FROM dua_blocks WHERE block_type = 'others' AND is_core = true ORDER BY display_order LIMIT 1;
  SELECT id INTO v_others_2 FROM dua_blocks WHERE block_type = 'others' AND is_core = true ORDER BY display_order LIMIT 1 OFFSET 1;
  SELECT id INTO v_closing_1 FROM dua_blocks WHERE block_type = 'closing' AND is_core = true ORDER BY display_order LIMIT 1;
  SELECT id INTO v_closing_2 FROM dua_blocks WHERE block_type = 'closing' AND is_core = true ORDER BY display_order LIMIT 1 OFFSET 1;

  -- Create template sets
  INSERT INTO dua_block_sets (name, name_arabic, category_id, description, hamd_block_id, salawat_block_id, admission_block_id, request_block_ids, others_block_id, closing_block_id, is_featured, display_order) VALUES
  (
    'Seeking Forgiveness',
    'طلب المغفرة',
    'forgiveness',
    'A complete dua for seeking Allah''s forgiveness and mercy',
    COALESCE(v_hamd_forgiveness, v_hamd_1),
    v_salawat_1,
    v_admission_1,
    ARRAY[v_request_forgiveness_1, v_request_forgiveness_2],
    v_others_1,
    v_closing_1,
    true,
    1
  ),
  (
    'Seeking Guidance',
    'طلب الهداية',
    'guidance',
    'A dua for guidance, clarity, and steadfastness on the straight path',
    v_hamd_1,
    v_salawat_2,
    v_admission_2,
    ARRAY[v_request_guidance_1, v_request_guidance_2],
    v_others_1,
    v_closing_2,
    true,
    2
  ),
  (
    'Morning Protection',
    'حماية الصباح',
    'protection',
    'A protective dua for starting your day with Allah''s safeguarding',
    v_hamd_1,
    v_salawat_1,
    v_admission_1,
    ARRAY[v_request_protection_1],
    v_others_2,
    v_closing_1,
    true,
    3
  ),
  (
    'Gratitude & Success',
    'الشكر والنجاح',
    'gratitude',
    'A dua expressing gratitude and seeking success in both worlds',
    v_hamd_1,
    v_salawat_1,
    v_admission_1,
    ARRAY[v_request_gratitude_1, v_request_success_1],
    v_others_1,
    v_closing_1,
    true,
    4
  );
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create templates
SELECT setup_dua_block_sets();

-- Drop the function after use (cleanup)
DROP FUNCTION IF EXISTS setup_dua_block_sets();

-- ============================================
-- 7. UPDATE TRIGGER FOR TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_dua_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dua_blocks_updated_at
  BEFORE UPDATE ON dua_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_dua_updated_at();

CREATE TRIGGER update_user_dua_compositions_updated_at
  BEFORE UPDATE ON user_dua_compositions
  FOR EACH ROW
  EXECUTE FUNCTION update_dua_updated_at();
