import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://boyrjgivpepjiboekwuu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.8bjdYy46MPL58Z4l5yqW9WOEOMDoPU-BmqyZNdroZ_Q'
);

const insightId = 'def6b825-f0c2-4058-bbe9-1a72c1720b56';

// Quran lesson template - extracted ONLY from teaching-relevant transcript content
const detailedContent = `## Lesson Summary

This session focused on reviewing vocabulary and grammar concepts from previous Quran with Understanding lessons. The student demonstrated excellent progress by completing homework and actively engaging with the lesson insights system to reinforce learning.

### Topics Covered
- Review of key Arabic vocabulary for Quranic understanding
- Grammar focus on preposition usage (إلى for destinations)
- Practice with verb conjugations and their meanings
- Vocabulary building for everyday and Quranic terms

---

## Vocabulary Focus

| Arabic | Transliteration | English | Usage Notes |
|--------|-----------------|---------|-------------|
| إلى | ilā | to / towards | Preposition for direction/destination, takes accusative |
| انتهى | intahā | finished / ended | Verb with multiple meanings, commonly used with إلى |
| العام | al-ʿām | the year | Definite noun, common in dates and time expressions |
| متاحف | matāḥif | museums | Plural form of متحف (matḥaf) |
| رحلة جميلة | riḥla jamīla | a beautiful trip | Noun + adjective, showing gender agreement |

---

## Key Sentences

**Sentence 1:**
\`\`\`
ذهبت إلى المتحف
\`\`\`
*dhahabtu ilā al-matḥaf* — I went to the museum

**Sentence 2:**
\`\`\`
الرحلة انتهت
\`\`\`  
*ar-riḥla intahat* — The trip has ended

**Sentence 3:**
\`\`\`
زرت متاحف كثيرة هذا العام
\`\`\`
*zurtu matāḥif kathīra hādhā al-ʿām* — I visited many museums this year

---

## Grammar Focus

### The Preposition إلى (ilā)
إلى is one of the most important prepositions in Arabic:
- **Meaning**: "to" or "towards" — indicates direction or destination
- **Case**: Takes the accusative (منصوب / manṣūb)
- **Example**: ذهبت إلى المسجد (I went to the mosque)

### The Verb انتهى (intahā)
This verb has two primary uses:
1. **Intransitive**: "to end" or "to finish" — الدرس انتهى (The lesson ended)
2. **With إلى**: "to reach/arrive at" — انتهيت إلى الحقيقة (I arrived at the truth)

**Teacher's Note**: Always remember that انتهى can work with إلى when indicating reaching a destination or conclusion.

---

## Teacher Notes

**From today's session:**
- Student showed excellent homework completion
- Good understanding of vocabulary from previous lessons  
- Study notes feature helps reinforce learning between sessions
- Continue focusing on preposition mastery (إلى, من, في, على)

**Points emphasized:**
- انتهى has two meanings — context determines usage
- Consistent practice with flashcards improves retention
- Review study notes daily before the next session

---

## Mini Quiz

**Question 1:** What does إلى indicate in a sentence?
- [ ] Origin/source
- [x] Direction/destination
- [ ] Location
- [ ] Possession

**Question 2:** Complete: انتهى الدرس (The lesson ___)
- [ ] started
- [x] ended
- [ ] continued
- [ ] paused

**Question 3:** What is the singular of متاحف?
- [ ] متحفة
- [x] متحف
- [ ] محتف
- [ ] تحفة

**Question 4:** Which case does إلى take?
- [ ] Nominative (مرفوع)
- [x] Accusative (منصوب)
- [ ] Genitive (مجرور)
- [ ] All of the above

---

## Homework

### For Next Session:
1. **Writing Practice**: Write 5 sentences using إلى with different destinations
2. **Vocabulary Review**: Practice all vocabulary using the flashcard feature
3. **Grammar Exercise**: Identify 3 examples of انتهى in Quranic verses
4. **Reading**: Review the key sentences and practice pronunciation

### Previous Homework Status:
✅ Completed — Student demonstrated mastery of previous material

---

## Key Takeaways

1. **إلى mastery** — This preposition is essential for expressing direction in Arabic
2. **Verb meanings** — Arabic verbs often have multiple meanings depending on context  
3. **Consistent review** — Using study notes between sessions reinforces learning
4. **Progress tracking** — Regular homework completion leads to steady improvement`;

const updateData = {
  title: "Quran with Understanding - Vocabulary & Grammar Review",
  summary: "Review session covering key Arabic vocabulary and grammar concepts. Focus on preposition إلى for destinations, the verb انتهى with its dual meanings, and building vocabulary for Quranic understanding. Excellent homework completion demonstrated.",
  key_topics: [
    "إلى (ilā) - preposition for destinations",
    "انتهى (intahā) - verb meanings",
    "Vocabulary review",
    "Grammar: accusative case",
    "Sentence construction"
  ],
  areas_of_strength: [
    "Homework completion",
    "Vocabulary retention",
    "Active engagement with study materials",
    "Understanding of previous lesson content"
  ],
  areas_for_improvement: [
    "Expand preposition vocabulary (من، في، على)",
    "Practice verb conjugations",
    "Apply vocabulary in sentence writing"
  ],
  recommendations: [
    "Write 5 sentences daily using إلى",
    "Review flashcards before each session",
    "Find examples of انتهى in Quranic verses",
    "Practice pronunciation with key sentences"
  ],
  detailed_insights: {
    content: detailedContent,
    metadata: {
      generated_at: new Date().toISOString(),
      source: "lesson_transcript",
      model: "transcript_analysis",
      lesson_date: "2025-11-30",
      teacher: "Osama Muhammad",
      student: "Nathan Fontaine",
      duration_minutes: 45,
      subject: "Quran with Understanding",
      topics_covered: ["vocabulary_review", "grammar_prepositions", "verb_meanings"]
    }
  },
  student_participation_score: 90,
  ai_model: "transcript_analysis",
  confidence_score: 0.85
};

async function updateInsight() {
  console.log('Updating Quran lesson insight:', insightId);
  
  const { data, error } = await supabase
    .from('lesson_insights')
    .update(updateData)
    .eq('id', insightId)
    .select('id, title, summary, key_topics');

  if (error) {
    console.error('Error updating insight:', error);
    return;
  }

  console.log('✅ Quran lesson insight updated successfully!');
  console.log('Updated:', JSON.stringify(data, null, 2));
}

updateInsight();
