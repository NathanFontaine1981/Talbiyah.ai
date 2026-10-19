-- Additional Dua Blocks to expand the collection to 100+
-- Authentic content from Quran and Sunnah

-- ============================================
-- MORE HAMD (PRAISE) BLOCKS
-- ============================================
INSERT INTO dua_blocks (block_type, category_id, arabic_text, transliteration, english_translation, source, allah_names, is_core, display_order) VALUES
('hamd', NULL, 'الْحَمْدُ لِلَّهِ الَّذِي لَمْ يَتَّخِذْ وَلَدًا وَلَمْ يَكُن لَّهُ شَرِيكٌ فِي الْمُلْكِ', 'Al-hamdu lillahil-ladhi lam yattakhidh waladan wa lam yakun lahu sharikun fil-mulk', 'Praise is to Allah who has not taken a son and has no partner in dominion', 'Quran 17:111', ARRAY['Al-Wahid', 'Al-Ahad'], false, 15),
('hamd', NULL, 'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ', 'Subhanallahi wal-hamdu lillahi wa la ilaha illallahu wallahu akbar', 'Glory be to Allah, praise be to Allah, there is no god but Allah, and Allah is the Greatest', 'Sahih Muslim', ARRAY['Al-Kabir', 'Al-Azim'], false, 16),
('hamd', NULL, 'الْحَمْدُ لِلَّهِ الَّذِي خَلَقَ السَّمَاوَاتِ وَالْأَرْضَ', 'Al-hamdu lillahil-ladhi khalaqas-samawati wal-ard', 'Praise is to Allah who created the heavens and the earth', 'Quran 6:1', ARRAY['Al-Khaliq', 'Al-Bari'], false, 17),
('hamd', 'hardship', 'الْحَمْدُ لِلَّهِ عَلَىٰ كُلِّ حَالٍ وَأَعُوذُ بِاللَّهِ مِنْ حَالِ أَهْلِ النَّارِ', 'Al-hamdu lillahi ''ala kulli hal, wa a''udhu billahi min hali ahlin-nar', 'Praise is to Allah in all circumstances, and I seek refuge in Allah from the state of the people of the Fire', 'Ibn Majah', ARRAY['Al-Hamid', 'Al-Mujir'], false, 18),
('hamd', 'anxiety', 'سُبْحَانَ اللَّهِ الْعَظِيمِ وَبِحَمْدِهِ', 'Subhanallahil-''Azimi wa bihamdih', 'Glory be to Allah the Magnificent and praise be to Him', 'Sahih Bukhari', ARRAY['Al-Azim', 'Al-Hamid'], false, 19),

-- Category-specific Hamd
('hamd', 'guidance', 'الْحَمْدُ لِلَّهِ الَّذِي هَدَانَا لِلْإِسْلَامِ وَمَا كُنَّا لِنَهْتَدِيَ لَوْلَا أَنْ هَدَانَا اللَّهُ', 'Al-hamdu lillahil-ladhi hadana lil-islam wa ma kunna li-nahtadiya lawla an hadanallah', 'Praise is to Allah who guided us to Islam, and we would never have been guided if Allah had not guided us', 'Quran 7:43', ARRAY['Al-Hadi', 'An-Nur'], false, 20),
('hamd', 'protection', 'الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ', 'Al-hamdu lillahil-ladhi bi-ni''matihi tatimmus-salihat', 'Praise is to Allah, by whose grace good deeds are completed', 'Ibn Majah', ARRAY['Al-Muhsin', 'Al-Mun''im'], false, 21),
('hamd', 'knowledge', 'الْحَمْدُ لِلَّهِ الَّذِي عَلَّمَ بِالْقَلَمِ عَلَّمَ الْإِنسَانَ مَا لَمْ يَعْلَمْ', 'Al-hamdu lillahil-ladhi ''allama bil-qalam, ''allamal-insana ma lam ya''lam', 'Praise is to Allah who taught by the pen, taught man what he did not know', 'Quran 96:4-5', ARRAY['Al-Alim', 'Al-Hakim'], false, 22);

-- ============================================
-- MORE SALAWAT BLOCKS
-- ============================================
INSERT INTO dua_blocks (block_type, category_id, arabic_text, transliteration, english_translation, source, allah_names, is_core, display_order) VALUES
('salawat', NULL, 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَبَارِكْ عَلَى مُحَمَّدٍ كَمَا صَلَّيْتَ وَبَارَكْتَ عَلَى إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ', 'Allahumma salli ''ala Muhammad wa barik ''ala Muhammad kama sallayta wa barakta ''ala Ibrahim innaka Hamidum Majid', 'O Allah, send blessings upon Muhammad and bless Muhammad as You sent blessings and blessed Ibrahim. Indeed, You are Praiseworthy, Glorious.', 'Sahih Bukhari', ARRAY['Al-Hamid', 'Al-Majid'], false, 5),
('salawat', NULL, 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ عَبْدِكَ وَرَسُولِكَ كَمَا صَلَّيْتَ عَلَى آلِ إِبْرَاهِيمَ', 'Allahumma salli ''ala Muhammad ''abdika wa rasulika kama sallayta ''ala ali Ibrahim', 'O Allah, send blessings upon Muhammad, Your servant and messenger, as You sent blessings upon the family of Ibrahim', 'Sahih Bukhari', NULL, false, 6),
('salawat', NULL, 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ وَارْزُقْنِي مَحَبَّتَهُ', 'Allahumma salli ''ala Muhammad wa ''ala ali Muhammad warzuqni mahabbatah', 'O Allah, send blessings upon Muhammad and the family of Muhammad, and grant me love for him', 'General', NULL, false, 7),
('salawat', NULL, 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ النَّبِيِّ الْأُمِّيِّ وَعَلَى آلِهِ وَصَحْبِهِ وَسَلِّمْ', 'Allahumma salli ''ala sayyidina Muhammadin-Nabiyyil-Ummi wa ''ala alihi wa sahbihi wa sallim', 'O Allah, send blessings upon our master Muhammad, the unlettered Prophet, and upon his family and companions, and grant them peace', 'General', NULL, false, 8);

-- ============================================
-- MORE ADMISSION BLOCKS
-- ============================================
INSERT INTO dua_blocks (block_type, category_id, arabic_text, transliteration, english_translation, source, allah_names, is_core, display_order) VALUES
('admission', NULL, 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ', 'Allahumma inni a''udhu bika minal-''ajzi wal-kasal', 'O Allah, I seek refuge in You from weakness and laziness', 'Sahih Bukhari', ARRAY['Al-Qawiy', 'Al-Matin'], false, 15),
('admission', NULL, 'اللَّهُمَّ أَعِنِّي وَلَا تُعِنْ عَلَيَّ', 'Allahumma a''inni wa la tu''in ''alayya', 'O Allah, help me and do not help others against me', 'Tirmidhi', ARRAY['An-Nasir', 'Al-Mu''in'], false, 16),
('admission', 'forgiveness', 'اللَّهُمَّ اغْفِرْ لِي ذَنبِي كُلَّهُ دِقَّهُ وَجِلَّهُ وَأَوَّلَهُ وَآخِرَهُ وَعَلَانِيَتَهُ وَسِرَّهُ', 'Allahumma-ghfir li dhanbi kullahu, diqqahu wa jillahu, wa awwalahu wa akhirahu, wa ''alaniyyatahu wa sirrahu', 'O Allah, forgive me all my sins, small and great, first and last, open and secret', 'Sahih Muslim', ARRAY['Al-Ghaffar', 'Al-Ghafur'], false, 17),
('admission', 'hardship', 'اللَّهُمَّ إِنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ', 'Allahumma inni massaniyad-durru wa anta arhamur-rahimin', 'O Allah, adversity has touched me, and You are the Most Merciful of those who show mercy', 'Quran 21:83', ARRAY['Ar-Rahman', 'Ar-Rahim'], false, 18),
('admission', 'anxiety', 'اللَّهُمَّ إِنِّي ضَعِيفٌ فَقَوِّنِي وَإِنِّي ذَلِيلٌ فَأَعِزَّنِي', 'Allahumma inni da''ifun fa-qawwini, wa inni dhalilun fa-a''izzani', 'O Allah, I am weak so strengthen me, and I am humiliated so honor me', 'General', ARRAY['Al-Qawiy', 'Al-Aziz'], false, 19),
('admission', NULL, 'سُبْحَانَكَ لَا عِلْمَ لَنَا إِلَّا مَا عَلَّمْتَنَا إِنَّكَ أَنتَ الْعَلِيمُ الْحَكِيمُ', 'Subhanaka la ''ilma lana illa ma ''allamtana innaka antal-''Alimul-Hakim', 'Glory be to You! We have no knowledge except what You have taught us. Indeed, You are the All-Knowing, the All-Wise', 'Quran 2:32', ARRAY['Al-Alim', 'Al-Hakim'], false, 20);

-- ============================================
-- MORE REQUEST BLOCKS BY CATEGORY
-- ============================================

-- More Forgiveness Requests
INSERT INTO dua_blocks (block_type, category_id, arabic_text, transliteration, english_translation, source, allah_names, is_core, display_order) VALUES
('request', 'forgiveness', 'رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ وَلَا تَجْعَلْ فِي قُلُوبِنَا غِلًّا لِّلَّذِينَ آمَنُوا', 'Rabbana-ghfir lana wa li-ikhwaninal-ladhina sabaquna bil-imani wa la taj''al fi qulubina ghillan lil-ladhina amanu', 'Our Lord, forgive us and our brothers who preceded us in faith, and do not put in our hearts any resentment toward those who have believed', 'Quran 59:10', ARRAY['Al-Ghaffar', 'Ar-Rauf'], false, 10),
('request', 'forgiveness', 'اللَّهُمَّ إِنِّي أَسْتَغْفِرُكَ لِمَا قَدَّمْتُ وَمَا أَخَّرْتُ', 'Allahumma inni astaghfiruka lima qaddamtu wa ma akhkhartu', 'O Allah, I seek Your forgiveness for what I have done in the past and what I will do in the future', 'Sahih Bukhari', ARRAY['Al-Ghaffar'], false, 11),
('request', 'forgiveness', 'رَبِّ اغْفِرْ لِي خَطِيئَتِي وَجَهْلِي', 'Rabbighfir li khati''ati wa jahli', 'My Lord, forgive me my sin and my ignorance', 'Sahih Bukhari', ARRAY['Al-Ghaffar', 'Al-Halim'], false, 12),

-- More Guidance Requests
('request', 'guidance', 'اللَّهُمَّ أَلْهِمْنِي رُشْدِي وَقِنِي شَرَّ نَفْسِي', 'Allahumma alhimni rushdi wa qini sharra nafsi', 'O Allah, inspire me with guidance and protect me from the evil of my soul', 'Tirmidhi', ARRAY['Al-Hadi', 'Al-Hafiz'], false, 10),
('request', 'guidance', 'اللَّهُمَّ أَرِنَا الْحَقَّ حَقًّا وَارْزُقْنَا اتِّبَاعَهُ وَأَرِنَا الْبَاطِلَ بَاطِلًا وَارْزُقْنَا اجْتِنَابَهُ', 'Allahumma arinal-haqqa haqqan warzuqnat-tiba''ah, wa arinal-batila batilan warzuqnaj-tinabah', 'O Allah, show us the truth as truth and grant us following it, and show us falsehood as falsehood and grant us avoiding it', 'General', ARRAY['Al-Hadi', 'Al-Haqq'], false, 11),
('request', 'guidance', 'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ', 'Allahumma-hdini fiman hadayt', 'O Allah, guide me among those whom You have guided', 'Abu Dawud', ARRAY['Al-Hadi'], false, 12),

-- More Protection Requests
('request', 'protection', 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ وَعَذَابِ الْقَبْرِ', 'Allahumma inni a''udhu bika minal-kufri wal-faqri wa ''adhabil-qabr', 'O Allah, I seek refuge in You from disbelief, poverty, and the punishment of the grave', 'Abu Dawud', ARRAY['Al-Muhaymin', 'Al-Ghani'], false, 10),
('request', 'protection', 'اللَّهُمَّ احْفَظْنِي بِالْإِسْلَامِ قَائِمًا وَاحْفَظْنِي بِالْإِسْلَامِ قَاعِدًا وَاحْفَظْنِي بِالْإِسْلَامِ رَاقِدًا', 'Allahummahfazni bil-islami qa''iman, wahfazni bil-islami qa''idan, wahfazni bil-islami raqidan', 'O Allah, protect me with Islam while standing, protect me with Islam while sitting, and protect me with Islam while sleeping', 'Nasai', ARRAY['Al-Hafiz', 'Al-Muhaymin'], false, 11),
('request', 'protection', 'اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي', 'Allahumma-stur ''awrati wa amin raw''ati', 'O Allah, conceal my faults and calm my fears', 'Abu Dawud', ARRAY['As-Sattar', 'Al-Mumin'], false, 12),

-- More Health Requests
('request', 'health', 'اللَّهُمَّ اشْفِنِي شِفَاءً لَا يُغَادِرُ سَقَمًا', 'Allahumma-shfini shifa''an la yughadiru saqaman', 'O Allah, heal me with a healing that leaves no illness', 'Sahih Bukhari', ARRAY['Ash-Shafi'], false, 10),
('request', 'health', 'أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَنِي', 'As''alullaha-l''Azima Rabbal-''Arshil-''Azimi an yashfiyani', 'I ask Allah the Magnificent, Lord of the Magnificent Throne, to heal me', 'Abu Dawud', ARRAY['Al-Azim', 'Ash-Shafi'], false, 11),
('request', 'health', 'اللَّهُمَّ اشْفِ عِبَادَكَ يَنْكَؤُوا لَكَ عَدُوًّا', 'Allahumma-shfi ''ibadaka yanka''u laka ''aduwwan', 'O Allah, heal Your servants so they may strike Your enemy', 'Abu Dawud', ARRAY['Ash-Shafi', 'An-Nasir'], false, 12),

-- More Anxiety Requests
('request', 'anxiety', 'اللَّهُمَّ اجْعَلْ فِي قَلْبِي نُورًا وَفِي بَصَرِي نُورًا وَفِي سَمْعِي نُورًا', 'Allahummaj''al fi qalbi nuran wa fi basari nuran wa fi sam''i nuran', 'O Allah, place light in my heart, light in my sight, and light in my hearing', 'Sahih Bukhari', ARRAY['An-Nur'], false, 10),
('request', 'anxiety', 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ زَوَالِ نِعْمَتِكَ وَتَحَوُّلِ عَافِيَتِكَ', 'Allahumma inni a''udhu bika min zawali ni''matika wa tahawwuli ''afiyatik', 'O Allah, I seek refuge in You from the removal of Your blessing and the change of Your protection', 'Sahih Muslim', ARRAY['Al-Muhaymin', 'Al-Mun''im'], false, 11),

-- More Hardship Requests
('request', 'hardship', 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ', 'Ya Hayyu ya Qayyum bi-rahmatika astaghith', 'O Ever-Living, O Self-Sustaining, by Your mercy I seek help', 'Tirmidhi', ARRAY['Al-Hayy', 'Al-Qayyum'], false, 10),
('request', 'hardship', 'اللَّهُمَّ اكْفِنِيهِمْ بِمَا شِئْتَ', 'Allahumma-kfinihim bima shi''t', 'O Allah, suffice me against them by whatever means You will', 'Sahih Muslim', ARRAY['Al-Kafi', 'Al-Wakil'], false, 11),

-- More Provision Requests
('request', 'provision', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ رِزْقًا طَيِّبًا وَعِلْمًا نَافِعًا وَعَمَلًا مُتَقَبَّلًا', 'Allahumma inni as''aluka rizqan tayyiban wa ''ilman nafi''an wa ''amalan mutaqabbalan', 'O Allah, I ask You for good provision, beneficial knowledge, and accepted deeds', 'Ibn Majah', ARRAY['Ar-Razzaq', 'Al-Alim'], false, 10),
('request', 'provision', 'اللَّهُمَّ ارْزُقْنِي حَلَالًا طَيِّبًا بِغَيْرِ كَدٍّ وَاسْتَجِبْ دُعَائِي بِغَيْرِ رَدٍّ', 'Allahumma-rzuqni halalan tayyiban bi-ghayri kaddin wasta-jib du''a''i bi-ghayri radd', 'O Allah, provide me with good lawful provision without hardship, and answer my dua without rejection', 'General', ARRAY['Ar-Razzaq', 'Al-Mujib'], false, 11),

-- More Family Requests
('request', 'family', 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ', 'Rabbij''alni muqimas-salati wa min dhurriyyati Rabbana wa taqabbal du''a', 'My Lord, make me an establisher of prayer, and my descendants. Our Lord, and accept my supplication', 'Quran 14:40', ARRAY['As-Sami', 'Al-Mujib'], false, 10),
('request', 'family', 'اللَّهُمَّ أَصْلِحْ لِي فِي ذُرِّيَّتِي', 'Allahumma aslih li fi dhurriyyati', 'O Allah, rectify for me my offspring', 'Quran 46:15', ARRAY['Al-Muslih'], false, 11),
('request', 'family', 'رَبِّ لَا تَذَرْنِي فَرْدًا وَأَنتَ خَيْرُ الْوَارِثِينَ', 'Rabbi la tadhirni fardan wa anta khayrul-warithin', 'My Lord, do not leave me alone, and You are the best of inheritors', 'Quran 21:89', ARRAY['Al-Warith', 'Al-Wahhab'], false, 12),

-- More Knowledge Requests
('request', 'knowledge', 'اللَّهُمَّ عَلِّمْنِي مَا يَنفَعُنِي وَانفَعْنِي بِمَا عَلَّمْتَنِي وَزِدْنِي عِلْمًا', 'Allahumma ''allimni ma yanfa''uni wanfa''ni bima ''allamtani wa zidni ''ilman', 'O Allah, teach me what benefits me, benefit me from what You have taught me, and increase me in knowledge', 'Tirmidhi', ARRAY['Al-Alim', 'Al-Hakim'], false, 10),
('request', 'knowledge', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ فَهْمَ النَّبِيِّينَ وَحِفْظَ الْمُرْسَلِينَ', 'Allahumma inni as''aluka fahmun-nabiyyina wa hifzal-mursalin', 'O Allah, I ask You for the understanding of the prophets and the memory of the messengers', 'General', ARRAY['Al-Alim', 'Al-Fattah'], false, 11),

-- More Patience Requests
('request', 'patience', 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَتَوَفَّنَا مُسْلِمِينَ', 'Rabbana afrigh ''alayna sabran wa tawaffana muslimin', 'Our Lord, pour upon us patience and let us die as Muslims', 'Quran 7:126', ARRAY['As-Sabur'], false, 10),
('request', 'patience', 'اللَّهُمَّ اجْعَلْنِي صَبُورًا وَاجْعَلْنِي شَكُورًا', 'Allahummaj''alni saburan waj''alni shakuran', 'O Allah, make me patient and make me grateful', 'Abu Dawud', ARRAY['As-Sabur', 'Ash-Shakur'], false, 11),

-- More Success Requests
('request', 'success', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ التَّوْفِيقَ وَالسَّدَادَ', 'Allahumma inni as''alukat-tawfiqa was-sadad', 'O Allah, I ask You for success and guidance', 'General', ARRAY['Al-Muwaffiq', 'Ar-Rashid'], false, 10),
('request', 'success', 'اللَّهُمَّ يَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي', 'Allahumma yassir li amri wahlul ''uqdatan min lisani', 'O Allah, ease my task for me and loosen the knot from my tongue', 'Quran 20:26-27', ARRAY['Al-Fattah', 'Al-Muyassir'], false, 11),
('request', 'success', 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', 'Rabbish-rahli sadri wa yassir li amri', 'My Lord, expand for me my chest and ease for me my task', 'Quran 20:25-26', ARRAY['Al-Fattah', 'Ash-Sharih'], false, 12),

-- More Gratitude Requests
('request', 'gratitude', 'رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ', 'Rabbi awzi''ni an ashkura ni''matakal-lati an''amta ''alayya wa ''ala walidayya', 'My Lord, enable me to be grateful for Your favor which You have bestowed upon me and upon my parents', 'Quran 27:19', ARRAY['Ash-Shakur', 'Al-Mun''im'], false, 10),
('request', 'gratitude', 'اللَّهُمَّ لَكَ الْحَمْدُ وَلَكَ الشُّكْرُ', 'Allahumma lakal-hamdu wa lakash-shukr', 'O Allah, to You is all praise and to You is all thanks', 'General', ARRAY['Al-Hamid', 'Ash-Shakur'], false, 11);

-- ============================================
-- MORE OTHERS (FOR PARENTS/UMMAH) BLOCKS
-- ============================================
INSERT INTO dua_blocks (block_type, category_id, arabic_text, transliteration, english_translation, source, allah_names, is_core, display_order) VALUES
('others', NULL, 'رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ', 'Rabbana-ghfir li wa li-walidayya wa lil-mu''minina yawma yaqumul-hisab', 'Our Lord, forgive me and my parents and the believers the Day the account is established', 'Quran 14:41', ARRAY['Al-Ghaffar'], false, 10),
('others', NULL, 'اللَّهُمَّ اغْفِرْ لِحَيِّنَا وَمَيِّتِنَا وَشَاهِدِنَا وَغَائِبِنَا', 'Allahumma-ghfir li-hayyina wa mayyitina wa shahidina wa gha''ibina', 'O Allah, forgive our living and our dead, those present and those absent', 'Ibn Majah', ARRAY['Al-Ghaffar'], false, 11),
('others', NULL, 'اللَّهُمَّ اغْفِرْ لِلْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ الْأَحْيَاءِ مِنْهُمْ وَالْأَمْوَاتِ', 'Allahumma-ghfir lil-mu''minina wal-mu''minat, al-ahya''i minhum wal-amwat', 'O Allah, forgive the believing men and believing women, the living and the dead among them', 'Tabarani', ARRAY['Al-Ghaffar', 'Ar-Rahim'], false, 12),
('others', NULL, 'اللَّهُمَّ أَصْلِحْ أُمَّةَ مُحَمَّدٍ اللَّهُمَّ فَرِّجْ عَنْ أُمَّةِ مُحَمَّدٍ اللَّهُمَّ ارْحَمْ أُمَّةَ مُحَمَّدٍ', 'Allahumma aslih ummata Muhammad, Allahumma farrij ''an ummati Muhammad, Allahumma-rham ummata Muhammad', 'O Allah, rectify the Ummah of Muhammad, O Allah, relieve the Ummah of Muhammad, O Allah, have mercy on the Ummah of Muhammad', 'Sahih Muslim', ARRAY['Al-Muslih', 'Ar-Rahman', 'Al-Mufarrij'], false, 13),
('others', NULL, 'اللَّهُمَّ انْصُرْ إِخْوَانَنَا الْمُسْتَضْعَفِينَ فِي كُلِّ مَكَانٍ', 'Allahumma-nsur ikhwananal-mustad''afina fi kulli makan', 'O Allah, grant victory to our oppressed brothers and sisters everywhere', 'General', ARRAY['An-Nasir', 'Al-Qadir'], false, 14),
('others', NULL, 'اللَّهُمَّ اهْدِ أَوْلَادَنَا وَأَوْلَادَ الْمُسْلِمِينَ', 'Allahumma-hdi awladana wa awladal-muslimin', 'O Allah, guide our children and the children of the Muslims', 'General', ARRAY['Al-Hadi'], false, 15);

-- ============================================
-- MORE CLOSING BLOCKS
-- ============================================
INSERT INTO dua_blocks (block_type, category_id, arabic_text, transliteration, english_translation, source, allah_names, is_core, display_order) VALUES
('closing', NULL, 'رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ', 'Rabbana taqabbal minna innaka antas-Sami''ul-''Alim', 'Our Lord, accept from us. Indeed, You are the All-Hearing, the All-Knowing', 'Quran 2:127', ARRAY['As-Sami', 'Al-Alim'], false, 10),
('closing', NULL, 'وَتُبْ عَلَيْنَا إِنَّكَ أَنتَ التَّوَّابُ الرَّحِيمُ', 'Wa tub ''alayna innaka antat-Tawwabur-Rahim', 'And turn to us in forgiveness. Indeed, You are the Accepting of repentance, the Merciful', 'Quran 2:128', ARRAY['At-Tawwab', 'Ar-Rahim'], false, 11),
('closing', NULL, 'اللَّهُمَّ إِنَّا نَسْأَلُكَ بِأَنَّا نَشْهَدُ أَنَّكَ أَنتَ اللَّهُ لَا إِلَٰهَ إِلَّا أَنتَ الْأَحَدُ الصَّمَدُ', 'Allahumma inna nas''aluka bi-anna nashhadu annaka antallahu la ilaha illa antal-Ahadus-Samad', 'O Allah, we ask You by testifying that You are Allah, there is no god but You, the One, the Self-Sufficient', 'Abu Dawud', ARRAY['Al-Ahad', 'As-Samad'], false, 12),
('closing', NULL, 'سُبْحَانَ رَبِّنَا إِن كَانَ وَعْدُ رَبِّنَا لَمَفْعُولًا', 'Subhana Rabbina in kana wa''du Rabbina la-maf''ulan', 'Glory be to our Lord! Indeed, the promise of our Lord will be fulfilled', 'Quran 17:108', ARRAY['Ar-Rabb', 'Al-Wafy'], false, 13),
('closing', NULL, 'سَمِعْنَا وَأَطَعْنَا غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ', 'Sami''na wa ata''na ghufranaka Rabbana wa ilaykal-masir', 'We hear and we obey. Your forgiveness, our Lord, and to You is the destination', 'Quran 2:285', ARRAY['Al-Ghaffar', 'Ar-Rabb'], false, 14);
