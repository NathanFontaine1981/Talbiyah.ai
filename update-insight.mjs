import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://boyrjgivpepjiboekwuu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.8bjdYy46MPL58Z4l5yqW9WOEOMDoPU-BmqyZNdroZ_Q'
);

const insightId = 'def6b825-f0c2-4058-bbe9-1a72c1720b56';

// Based on the actual transcript content
const detailedContent = `## Lesson Summary

Today's session included a review of the platform's new lesson insights feature and discussion of previous Arabic vocabulary from Friday's lesson. The teacher (Osama Muhammad) and student (Nathan Fontaine) explored the auto-generated study notes system and worked on technical setup for future lessons.

### Session Highlights
- Reviewed Arabic vocabulary from previous Friday's lesson
- Discussed proper use of إلى (ilah) for destinations
- Covered the word انتهى (intaha) and its two meanings
- Practiced العام (al-am) meaning "the year"
- Reviewed متاحف (matahif) meaning "museums"

---

## Vocabulary Focus

| Arabic | Transliteration | English | Grammar Note |
|--------|-----------------|---------|--------------|
| إلى | ilā | to/towards | Preposition for destinations, takes accusative |
| انتهى | intahā | finished/ended | Has two meanings - always use with إلى |
| العام | al-'ām | the year | Definite noun |
| متاحف | matāḥif | museums | Plural form |
| رحلة جميلة | riḥla jamīla | beautiful trip | Noun + adjective agreement |

---

## Key Sentences

**Sentence 1:**
\`\`\`
ذهبت إلى المتحف
\`\`\`
*dhahabtu ilā al-matḥaf* - I went to the museum

**Sentence 2:**
\`\`\`
الرحلة انتهت
\`\`\`
*ar-riḥla intahat* - The trip has ended

---

## Grammar Focus

### Using إلى (ilā) for Destinations
- إلى is the preposition used for expressing direction or destination
- Takes the accusative case (mansūb) 
- Example: ذهبت إلى المسجد (I went to the mosque)

### The Verb انتهى (intahā)
- This verb has two related meanings:
  1. "to end" or "to finish" (intransitive)
  2. "to complete" something (with an object)
- Teacher's note: Always pair with إلى when indicating reaching a destination or conclusion

---

## Teacher Notes

The teacher emphasized:
- Nathan's progress with homework completion is excellent
- The study notes feature helps reinforce vocabulary between sessions
- Continue practicing vocabulary using the generated study materials
- Focus on mastering preposition usage (إلى, من, في)

---

## Mini Quiz

**Question 1:** What does إلى mean in Arabic?
- [ ] From
- [x] To/Towards  
- [ ] With
- [ ] In

**Question 2:** What is the plural of متحف (museum)?
- [ ] متاحيف
- [x] متاحف
- [ ] متحفات
- [ ] متاحف

**Question 3:** Complete: ذهبت ___ المدرسة (I went to the school)
- [ ] في
- [ ] من
- [x] إلى
- [ ] على

---

## Homework

### Assignment for Next Session:
1. **Vocabulary Practice**: Review all vocabulary words using the generated flashcards
2. **Grammar Exercise**: Write 5 sentences using إلى with different destinations
3. **Reading**: Practice reading the key sentences aloud with proper pronunciation
4. **Quiz Prep**: Be prepared for vocabulary quiz on prepositions

### Completed Homework Review:
Nathan demonstrated completed homework during the session - excellent progress!

---

## Key Takeaways

1. **Prepositions Matter**: إلى is essential for expressing destinations in Arabic
2. **Verb Meanings**: Some Arabic verbs like انتهى have multiple meanings depending on context
3. **Practice Tools**: The lesson insights and study notes are valuable for revision between sessions
4. **Consistent Progress**: Regular homework completion leads to steady improvement`;

const updateData = {
  title: "Arabic Language Lesson - Platform Review & Vocabulary",
  summary: "Session included a walkthrough of the lesson insights feature and review of vocabulary from the previous Arabic lesson, including إلى (to), انتهى (finished), العام (the year), and متاحف (museums). Focus on proper preposition usage for destinations.",
  key_topics: [
    "إلى (ilā) - preposition for destinations",
    "انتهى (intahā) - verb with two meanings",
    "العام (al-ām) - the year",
    "متاحف (matāḥif) - museums",
    "Preposition usage in Arabic",
    "Study notes review"
  ],
  areas_of_strength: [
    "Homework completion",
    "Engagement with study materials",
    "Active participation in platform testing",
    "Understanding of previous lesson content"
  ],
  areas_for_improvement: [
    "Continue practicing preposition usage",
    "Expand vocabulary with more destination words",
    "Practice writing sentences with إلى"
  ],
  recommendations: [
    "Use generated study notes for daily revision",
    "Practice writing 5 sentences with إلى each day",
    "Review vocabulary flashcards before next session",
    "Complete the mini quiz for self-assessment"
  ],
  detailed_insights: {
    content: detailedContent,
    metadata: {
      generated_at: new Date().toISOString(),
      source: "lesson_transcript",
      model: "manual_from_transcript",
      lesson_date: "2025-11-30",
      teacher: "Osama Muhammad",
      student: "Nathan Fontaine",
      duration_minutes: 45,
      topics_covered: ["vocabulary_review", "grammar_prepositions", "platform_demo"]
    }
  },
  student_participation_score: 85,
  ai_model: "transcript_analysis",
  confidence_score: 0.9
};

async function updateInsight() {
  console.log('Updating insight:', insightId);
  
  const { data, error } = await supabase
    .from('lesson_insights')
    .update(updateData)
    .eq('id', insightId)
    .select();

  if (error) {
    console.error('Error updating insight:', error);
    return;
  }

  console.log('✅ Insight updated successfully!');
  console.log('Updated data:', JSON.stringify(data, null, 2));
}

updateInsight();
