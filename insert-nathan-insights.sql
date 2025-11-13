-- Insert Talbiyah Insights for Nathan's Quran Lesson
INSERT INTO lesson_insights (
  lesson_id,
  learner_id,
  subject_id,
  teacher_id,
  insight_type,
  title,
  summary,
  detailed_insights,
  ai_model,
  confidence_score,
  processing_time_ms,
  viewed_by_student,
  student_rating
) VALUES (
  '30a7dd02-7e85-4abb-a661-d5b25e5e157b',
  '5bb6b97d-028b-4fa0-bc0c-2eb22fa64558',
  '12eef119-16e4-45ac-a7d9-1ec5291f83ed',
  '4c202a41-15a3-4d15-96b4-f763321c6133',
  'quran_tadabbur',
  'Qur''an Insights: An-Nazi''at (The Extractors) (79:15-26)',
  '🕌 TALBIYAH INSIGHTS – QUR''ĀN WITH TADABBUR (UNDERSTANDING & REFLECTION)

**1. Lesson Information**
- Surah: An-Nazi''at (The Extractors) (79)
- Verses Covered: 79:15-26
- Teacher: Ustadh Osama Muhammad
- Student(s): Nathan Fontaine
- Date: 2025-11-09
- Class Type: Qur''an with Tadabbur (Understanding & Reflection)

---

**2. Flow of Meaning (Tafsīr Summary)**
This section of Surah An-Nazi''at focuses on the story of Musa (peace be upon him) and his encounter with the tyrannical Pharaoh. Allah asks',
  jsonb_build_object(
    'content', '🕌 TALBIYAH INSIGHTS – QUR''ĀN WITH TADABBUR (UNDERSTANDING & REFLECTION)

**1. Lesson Information**
- Surah: An-Nazi''at (The Extractors) (79)
- Verses Covered: 79:15-26
- Teacher: Ustadh Osama Muhammad
- Student(s): Nathan Fontaine
- Date: 2025-11-09
- Class Type: Qur''an with Tadabbur (Understanding & Reflection)

---

**2. Flow of Meaning (Tafsīr Summary)**
This section of Surah An-Nazi''at focuses on the story of Musa (peace be upon him) and his encounter with the tyrannical Pharaoh. Allah asks if the story of Musa has reached the listener, recounting how Allah called Musa in the sacred valley of Tuwa and commanded him to go to Pharaoh, who had transgressed all bounds.

Musa was instructed to invite Pharaoh to purify himself and be guided to his Lord, so that he may fear Allah. Musa then showed Pharaoh the greatest sign, but Pharaoh denied it and disobeyed. He turned his back and gathered his people, arrogantly declaring himself to be the supreme lord.

However, Allah seized Pharaoh with exemplary punishment, both in this life and the Hereafter, as a lesson and warning for those who would defy Allah. The passage then transitions to rhetorical questions about the creation of the heavens, highlighting Allah''s power and the ease with which He can resurrect the dead, compared to the vastness of the universe He has created.

---

**3. Key Arabic Vocabulary**
- نَكَال (nakaal) - Exemplary punishment, a deterrent
- أَغْطَشَ (aghtasha) - He made dark, He covered with darkness
- دُحَاهَا (duhaha) - Its brightness, its daytime

---

**4. Lessons & Tadabbur Points**
1. Arrogance and rejection of truth leads to severe consequences from Allah.
2. Allah''s power is immense - He created the vast heavens with ease, so resurrection is simple for Him.
3. Purification of the soul and guidance to Allah should be the ultimate goal, not worldly power and pride.
4. The stories of the Prophets are a lesson and warning for all who would fear Allah.
5. Proper recitation and contemplation of the Qur''an strengthens one''s faith and relationship with Allah.

---

**5. Reflection Questions**
1. How can we guard against the temptation of arrogance and self-aggrandizement like Pharaoh?
2. What steps can we take to purify our souls and seek Allah''s guidance in our lives?
3. What lessons can we learn from the story of Musa and Pharaoh to strengthen our own faith and submission to Allah?

---

**6. Mini Quiz (Comprehension Check)**
**Q1.** Where did Allah call Musa (ʿalayhi as-salām)?
A) Mount Uhud B) Madīnah C) Sacred Valley of Ṭuwā ✅ D) Mount Sinai

**Q2.** What did Pharaoh claim about himself?
A) I am your guide B) I am your provider C) I am your lord, most high ✅ D) I am your messenger

**Q3.** What did Allah do to Pharaoh as an example and warning?
A) Forgave him B) Guided him to the truth C) Sent him wealth and prosperity D) Seized him with exemplary punishment ✅

---

**7. Homework & Weekly Reflection Task**
1. Memorize verses 79:15-26 firmly, especially the story of Musa and Pharaoh.
2. Reflect on the meaning of Pharaoh''s arrogance and Allah''s punishment of him.
3. Practice the pronunciation of "wa aghtasha laylaha" until it flows smoothly.
4. Contemplate the rhetorical question about the creation of the heavens and how it relates to belief in resurrection.

---

**8. Flashcard Challenge (Optional)**
To reinforce the key Arabic vocabulary, create flashcards with the following words:
- نَكَال (nakaal) - Exemplary punishment, a deterrent
- أَغْطَشَ (aghtasha) - He made dark, He covered with darkness
- دُحَاهَا (duhaha) - Its brightness, its daytime

Review each card three times before the next lesson.

---

**9. Summary Takeaway**
This passage of Surah An-Nazi''at powerfully illustrates the consequences of arrogance and rejection of truth, as seen in the story of Musa and Pharaoh. It serves as a profound reminder of Allah''s immense power in creating the heavens and earth, and the ease with which He can resurrect the dead. The lesson calls us to purify our souls, seek Allah''s guidance, and fear Him alone, lest we face a fate similar to that of the tyrant Pharaoh.',
    'subject', 'Quran with Tadabbur',
    'metadata', jsonb_build_object(
      'surah_name', 'An-Nazi''at (The Extractors)',
      'surah_number', 79,
      'ayah_range', '79:15-26',
      'teacher_name', 'Ustadh Osama Muhammad',
      'student_names', jsonb_build_array('Nathan Fontaine'),
      'lesson_date', '2025-11-09',
      'duration_minutes', 60
    ),
    'generated_at', '2025-11-10T20:01:26.954Z'
  ),
  'claude-3-haiku-20240307',
  0.90,
  8567,
  false,
  null
)
ON CONFLICT (lesson_id) DO UPDATE SET
  detailed_insights = EXCLUDED.detailed_insights,
  summary = EXCLUDED.summary,
  updated_at = NOW();
