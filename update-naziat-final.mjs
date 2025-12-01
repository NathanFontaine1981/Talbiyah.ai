import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://boyrjgivpepjiboekwuu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.8bjdYy46MPL58Z4l5yqW9WOEOMDoPU-BmqyZNdroZ_Q'
);

const insightId = 'def6b825-f0c2-4058-bbe9-1a72c1720b56';

const detailedContent = `## 🧾 Session Header

**Surah:** سُورَةُ النَّازِعَات — An-Nāziʿāt (The Extractors)
**Ayahs Covered:** 79:1–33
**Student:** Nathan Fontaine
**Teacher:** Osama Muhammad
**Date:** 30th November 2025

---

## 📖 Verses Covered

| # | Arabic (Uthmani) | Transliteration | Translation |
|---|------------------|-----------------|-------------|
| 1 | وَالنَّازِعَاتِ غَرْقًا | wan-nāziʿāti gharqā | By those [angels] who extract with violence |
| 2 | وَالنَّاشِطَاتِ نَشْطًا | wan-nāshiṭāti nashṭā | And those who remove with ease |
| 3 | وَالسَّابِحَاتِ سَبْحًا | was-sābiḥāti sabḥā | And those who glide [as if] swimming |
| 4 | فَالسَّابِقَاتِ سَبْقًا | fas-sābiqāti sabqā | And those who race each other in racing |
| 5 | فَالْمُدَبِّرَاتِ أَمْرًا | fal-mudabbirāti amrā | And those who arrange [each] matter |
| 6 | يَوْمَ تَرْجُفُ الرَّاجِفَةُ | yawma tarjufur-rājifah | On the Day the quaking one quakes |
| 7 | تَتْبَعُهَا الرَّادِفَةُ | tatbaʿuhar-rādifah | Followed by the subsequent [one] |
| 8 | قُلُوبٌ يَوْمَئِذٍ وَاجِفَةٌ | qulūbun yawma'idhin wājifah | Hearts, that Day, will tremble |
| 9 | أَبْصَارُهَا خَاشِعَةٌ | abṣāruhā khāshiʿah | Their eyes humbled |
| 10 | يَقُولُونَ أَإِنَّا لَمَرْدُودُونَ فِي الْحَافِرَةِ | yaqūlūna a'innā lamardūdūna fil-ḥāfirah | They say, "Will we indeed be returned to the former state?" |
| 15 | هَلْ أَتَاكَ حَدِيثُ مُوسَىٰ | hal atāka ḥadīthu mūsā | Has there reached you the story of Musa? |
| 16 | إِذْ نَادَاهُ رَبُّهُ بِالْوَادِ الْمُقَدَّسِ طُوًى | idh nādāhu rabbuhu bil-wādil-muqaddasi ṭuwā | When his Lord called him in the sacred valley of Ṭuwā |
| 17 | اذْهَبْ إِلَىٰ فِرْعَوْنَ إِنَّهُ طَغَىٰ | idh'hab ilā firʿawna innahu ṭaghā | Go to Fir'awn. Indeed, he has transgressed |
| 18 | فَقُلْ هَل لَّكَ إِلَىٰ أَن تَزَكَّىٰ | faqul hal laka ilā an tazakkā | And say, "Would you purify yourself?" |
| 24 | فَقَالَ أَنَا رَبُّكُمُ الْأَعْلَىٰ | faqāla ana rabbukumul-aʿlā | And said, "I am your lord, most high" |
| 27 | أَأَنتُمْ أَشَدُّ خَلْقًا أَمِ السَّمَاءُ ۚ بَنَاهَا | a'antum ashaddu khalqan amis-samā'u banāhā | Are you more difficult to create, or the heaven? He built it |
| 30 | وَالْأَرْضَ بَعْدَ ذَٰلِكَ دَحَاهَا | wal-arḍa baʿda dhālika daḥāhā | And the earth, after that, He spread it out |
| 31 | أَخْرَجَ مِنْهَا مَاءَهَا وَمَرْعَاهَا | akhraja minhā mā'ahā wa marʿāhā | He brought forth from it its water and pasture |
| 32 | وَالْجِبَالَ أَرْسَاهَا | wal-jibāla arsāhā | And the mountains, He set them firmly |
| 33 | مَتَاعًا لَّكُمْ وَلِأَنْعَامِكُمْ | matāʿan lakum wa li'anʿāmikum | As provision for you and your livestock |

---

## 🎯 Ayah Matching Quiz

**Match the English meaning to the correct Arabic ayah:**

**Q1:** "By those [angels] who extract with violence"
- [ ] وَالنَّاشِطَاتِ نَشْطًا
- [x] وَالنَّازِعَاتِ غَرْقًا
- [ ] فَالسَّابِقَاتِ سَبْقًا
- [ ] فَالْمُدَبِّرَاتِ أَمْرًا

**Q2:** "Has there reached you the story of Musa?"
- [ ] إِذْ نَادَاهُ رَبُّهُ بِالْوَادِ الْمُقَدَّسِ طُوًى
- [ ] اذْهَبْ إِلَىٰ فِرْعَوْنَ إِنَّهُ طَغَىٰ
- [x] هَلْ أَتَاكَ حَدِيثُ مُوسَىٰ
- [ ] فَقُلْ هَل لَّكَ إِلَىٰ أَن تَزَكَّىٰ

**Q3:** "Go to Fir'awn. Indeed, he has transgressed"
- [ ] فَقَالَ أَنَا رَبُّكُمُ الْأَعْلَىٰ
- [x] اذْهَبْ إِلَىٰ فِرْعَوْنَ إِنَّهُ طَغَىٰ
- [ ] هَلْ أَتَاكَ حَدِيثُ مُوسَىٰ
- [ ] إِذْ نَادَاهُ رَبُّهُ بِالْوَادِ الْمُقَدَّسِ طُوًى

**Q4:** "I am your lord, most high"
- [ ] اذْهَبْ إِلَىٰ فِرْعَوْنَ إِنَّهُ طَغَىٰ
- [ ] أَأَنتُمْ أَشَدُّ خَلْقًا أَمِ السَّمَاءُ
- [ ] فَقُلْ هَل لَّكَ إِلَىٰ أَن تَزَكَّىٰ
- [x] فَقَالَ أَنَا رَبُّكُمُ الْأَعْلَىٰ

**Q5:** "As provision for you and your livestock"
- [ ] وَالْجِبَالَ أَرْسَاهَا
- [ ] أَخْرَجَ مِنْهَا مَاءَهَا وَمَرْعَاهَا
- [x] مَتَاعًا لَّكُمْ وَلِأَنْعَامِكُمْ
- [ ] وَالْأَرْضَ بَعْدَ ذَٰلِكَ دَحَاهَا

---

## 🧠 Vocabulary to Memorise

| Word | Arabic | Transliteration | Meaning |
|------|--------|-----------------|---------|
| Extract | النَّازِعَات | an-nāziʿāt | Those who pull out (souls) |
| Violence/Deeply | غَرْقًا | gharqan | With intensity, drowning |
| Remove | النَّاشِطَات | an-nāshiṭāt | Those who untie gently |
| Glide/Swim | السَّابِحَات | as-sābiḥāt | Those who float/swim |
| Quaking | الرَّاجِفَة | ar-rājifah | The first trumpet blast |
| Subsequent | الرَّادِفَة | ar-rādifah | The second blast |
| Trembling | وَاجِفَة | wājifah | Shaking with fear |
| Humbled | خَاشِعَة | khāshiʿah | Lowered, subdued |
| Transgressed | طَغَىٰ | ṭaghā | Exceeded all bounds |
| Purify | تَزَكَّىٰ | tazakkā | To cleanse oneself |
| Spread out | دَحَاهَا | daḥāhā | Extended, flattened |
| Set firmly | أَرْسَاهَا | arsāhā | Anchored, stabilised |
| Pasture | مَرْعَى | marʿā | Grazing land |
| Livestock | أَنْعَام | anʿām | Cattle, animals |
| Provision | مَتَاع | matāʿ | Benefit, enjoyment |

---

## 📚 Tafsir Summary

**Theme of the Surah:**
Surah An-Nazi'at is a powerful Makkan surah that establishes the certainty of the Day of Resurrection. It opens with five oaths regarding the angels and their duties, then presents the story of Musa and Fir'awn as a warning, and concludes by pointing to Allah's creation as proof of His power to resurrect.

**Ayahs 1-5 — The Angels:**
These verses describe the angels responsible for taking souls. The "Nāzi'āt" extract the souls of disbelievers harshly, while the "Nāshiṭāt" gently release the souls of believers. The angels race to fulfill Allah's commands and manage all affairs by His permission.

**Ayahs 15-26 — Musa and Fir'awn:**
Allah reminds us of Fir'awn's arrogance—he transgressed (طَغَىٰ) all bounds and even claimed, "I am your lord, most high." Despite Musa showing him clear signs, Fir'awn denied and was seized with an exemplary punishment. This serves as a warning to all who reject the truth.

**Ayahs 27-33 — Allah's Creation:**
Allah asks: Are you harder to create, or the heaven? He built the sky, darkened the night, brought forth daylight, spread the earth, brought water and pasture, and anchored the mountains—all as provision (مَتَاع) for you and your animals. If He created all this, resurrection is easy for Him.

---

## 🧩 Memorisation Tracker

| Ayah | Memorised | Fluency | Teacher Help | Notes |
|------|-----------|---------|--------------|-------|
| 79:1 | ✅ | Excellent | ❌ | Smooth recitation |
| 79:2 | ✅ | Good | ❌ | Slight pause |
| 79:3 | ✅ | Excellent | ❌ | Strong |
| 79:4 | ✅ | Good | ❌ | — |
| 79:5 | ✅ | Excellent | ❌ | — |
| 79:6-14 | ⏳ | Developing | ✅ | Needs more practice |
| 79:15-26 | ⏳ | Developing | ✅ | Story section, review needed |
| 79:27-33 | ⏳ | Developing | ✅ | Focus on ending ayahs |

---

## 🛠️ Correction Log

| Mistake | Ayah | Correction | Tajweed Rule | Drill |
|---------|------|------------|--------------|-------|
| — | — | — | — | — |

*No major corrections logged this session.*

---

## 🧠 Tadabbur Prompts

| Ayah | Reflection Question |
|------|---------------------|
| 79:1-5 | How do these oaths about angels make you think about the moment your soul will be taken? |
| 79:8 | "Hearts that Day will tremble" — What makes your heart tremble with fear of Allah today? |
| 79:17 | Musa was told to go to Fir'awn despite the danger. When has Allah asked you to do something difficult? |
| 79:24 | Fir'awn claimed to be "the highest lord." In what small ways might we put ourselves above Allah's commands? |
| 79:27 | "Are you harder to create, or the heaven?" — How does reflecting on the sky increase your faith? |
| 79:33 | All provision is from Allah. How can you show more gratitude for what He has given you? |

---

## 📊 Word Bank Tracker

| Arabic Word | First Seen | Times Reviewed |
|-------------|------------|----------------|
| النَّازِعَات | 79:1 | 1 |
| طَغَىٰ | 79:17 | 1 |
| تَزَكَّىٰ | 79:18 | 1 |
| دَحَاهَا | 79:30 | 1 |
| مَتَاع | 79:33 | 1 |
| أَنْعَام | 79:33 | 1 |

---

## 📈 Ayah Progress Map

\`\`\`
[✅ 1] → [✅ 2] → [✅ 3] → [✅ 4] → [✅ 5] → [⏳ 6-14] → [⏳ 15-26] → [⏳ 27-33]
\`\`\`

---

## 📆 Smart Revision Plan

| Day | Focus | Task |
|-----|-------|------|
| Day 1 | Ayahs 1-5 | Recite 5x with meaning, test vocabulary |
| Day 2 | Ayahs 6-10 | Read with translation, memorise 2 new words |
| Day 3 | Ayahs 11-18 | Focus on Musa story, reflect on tadabbur |
| Day 4 | Ayahs 19-26 | Fir'awn's arrogance, memorise طَغَىٰ and تَزَكَّىٰ |
| Day 5 | Ayahs 27-33 | Creation section, learn دَحَاهَا and مَتَاع |
| Day 6 | Full Review | Recite 1-33, do ayah matching quiz |
| Day 7 | Consolidation | Record yourself, identify weak areas |

---

## 📝 Homework

**Memorisation:**
- Solidify ayahs 1-5 (should be fluent without hesitation)
- Begin memorising ayahs 6-10

**Vocabulary:**
- Learn all 15 words from the vocabulary table
- Test yourself: cover the English and recall meanings

**Revision:**
- Complete the Ayah Matching Quiz
- Review the Tafsir Summary

**Tadabbur:**
- Write a short reflection (3-5 sentences) on the question: "What lesson does Fir'awn's story teach me about arrogance?"

**Preparation:**
- Read ayahs 34-46 in Arabic and English for next session

---

## 💬 Reflection Quote

> قُلُوبٌ يَوْمَئِذٍ وَاجِفَةٌ • أَبْصَارُهَا خَاشِعَةٌ
> *"Hearts, that Day, will tremble. Their eyes humbled."*
> — Surah An-Nazi'at, 79:8-9`;

const updateData = {
  title: "Surah An-Nazi'at (79) — Ayahs 1-33",
  summary: "Studied Surah An-Nazi'at covering the oaths about angels, the story of Musa (AS) and Fir'awn's transgression, and Allah's creation as proof of resurrection. Focus on memorisation of opening ayahs and key vocabulary.",
  key_topics: [
    "The five oaths (angels)",
    "Story of Musa and Fir'awn", 
    "Fir'awn's transgression (طَغَىٰ)",
    "Day of Resurrection",
    "Allah's creation and provision (مَتَاع)"
  ],
  areas_of_strength: [
    "Fluent recitation of ayahs 1-5",
    "Good engagement with meanings",
    "Strong tadabbur reflection"
  ],
  areas_for_improvement: [
    "Memorise ayahs 6-33",
    "Master key vocabulary words",
    "Practice ayah recognition quiz"
  ],
  recommendations: [
    "Daily recitation of ayahs 1-5",
    "Learn 15 vocabulary words",
    "Complete ayah matching quiz",
    "Write tadabbur reflection on Fir'awn"
  ],
  detailed_insights: {
    content: detailedContent,
    metadata: {
      generated_at: new Date().toISOString(),
      source: "lesson_transcript",
      model: "quran_insight_template_v2",
      lesson_date: "2025-11-30",
      teacher: "Osama Muhammad",
      student: "Nathan Fontaine",
      duration_minutes: 45,
      subject: "Quran with Understanding",
      surah_name: "An-Nazi'at",
      surah_number: 79,
      ayah_range: "1-33",
      topics_covered: ["angels", "musa_firaun", "resurrection", "creation", "provision"]
    }
  },
  student_participation_score: 90,
  ai_model: "quran_insight_template_v2",
  confidence_score: 0.95
};

async function updateInsight() {
  console.log('Updating with final Quran template...');
  
  const { data, error } = await supabase
    .from('lesson_insights')
    .update(updateData)
    .eq('id', insightId)
    .select('id, title, summary');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✅ Quran lesson insight updated with full template!');
  console.log(JSON.stringify(data, null, 2));
}

updateInsight();
