# Quiz 100% Reliability Plan

## Current Problems

1. **Quiz answers are incorrect** - AI marks wrong answers as correct
2. **Vocabulary meanings wrong** - AI uses generic meanings, not what teacher said
3. **Verses 1-5 missing** - Prompt simplification may have caused AI to skip verses

## Root Cause

The AI generates both questions AND answers, leading to hallucinated correct answers. The current verification system only catches known vocabulary patterns.

---

## Solution: Two-Phase Quiz Generation

### Phase 1: AI Generates Questions ONLY (No Answers Marked)

Change the prompt to:
```
**6. Mini Quiz**
Create 5-6 multiple-choice questions about THIS LESSON.

Format (DO NOT mark any answer as correct):
**Q1.** What does "النبأ" mean?
A) The story
B) The news
C) The warning
D) The message

DO NOT use ✅ - answers will be verified separately.
```

### Phase 2: Automatic Answer Verification

After AI generates content, run verification that:

1. **For vocabulary questions** ("What does X mean?"):
   - Look up the Arabic word in `surah_data.verses` JSONB
   - Find the word in the verse's word-by-word breakdown
   - Mark the option that matches the verified meaning

2. **For verse content questions** ("What is mentioned in ayah X?"):
   - Look up the verse translation in `surah_data`
   - Compare options against the actual translation
   - Mark the option with highest similarity

3. **For theme questions** ("What is the main theme?"):
   - These are subjective - keep AI's answer but flag as "unverified"
   - Or skip verification and trust the AI for theme questions

---

## Implementation Steps

### Step 1: Enhance surah_data with word-by-word data

```sql
-- Update surah_data verses JSONB to include word breakdown
-- Example structure:
{
  "1": {
    "arabic": "عَمَّ يَتَسَآءَلُونَ",
    "translation": "About what are they asking one another?",
    "words": [
      { "arabic": "عَمَّ", "transliteration": "'amma", "meaning": "about what" },
      { "arabic": "يَتَسَآءَلُونَ", "transliteration": "yatasā'alūn", "meaning": "they ask one another" }
    ]
  }
}
```

### Step 2: Create Quiz Verification Function

```typescript
async function verifyQuizAnswers(
  quizContent: string,
  surahNumber: number,
  supabase: SupabaseClient
): Promise<string> {
  // 1. Fetch surah_data for this surah
  const { data: surahData } = await supabase
    .from('surah_data')
    .select('verses')
    .eq('surah_number', surahNumber)
    .single();

  // 2. Parse quiz questions (no answers marked)
  const questions = parseQuizQuestions(quizContent);

  // 3. For each question, find correct answer
  for (const q of questions) {
    if (isVocabQuestion(q.text)) {
      const arabicWord = extractArabicWord(q.text);
      const correctMeaning = lookupWordMeaning(arabicWord, surahData.verses);
      q.correctIndex = findMatchingOption(q.options, correctMeaning);
    } else if (isVerseQuestion(q.text)) {
      const ayahNum = extractAyahNumber(q.text);
      const verseTranslation = surahData.verses[ayahNum].translation;
      q.correctIndex = findMatchingOption(q.options, verseTranslation);
    }
    // Theme questions: trust AI or mark as unverified
  }

  // 4. Return quiz with correct answers marked
  return formatQuizWithAnswers(questions);
}
```

### Step 3: Update generate-lesson-insights

```typescript
// After AI generates content...
if (isQuranLesson && metadata.surah_number) {
  // Verify quiz answers against surah_data
  generatedContent = await verifyQuizAnswers(
    generatedContent,
    metadata.surah_number,
    supabase
  );
}
```

---

## Fallback: Pre-defined Quiz Templates

If verification fails, use pre-made quiz templates for common surahs:

```typescript
const SURAH_QUIZ_TEMPLATES = {
  78: [ // An-Naba
    {
      question: "What does 'النبأ العظيم' refer to?",
      options: ["A story", "The Day of Judgment", "A prophet", "The Quran"],
      correct: 1 // The Day of Judgment
    },
    // ... more pre-made questions
  ]
};
```

---

## Fix Missing Verses

Restore comprehensive verse instructions in prompt:

```
**2. Verses Studied (Arabic & Translation)**
⚠️ IMPORTANT: List EVERY verse discussed in the lesson, starting from ayah 1.
Do NOT skip any verses. Include ALL verses from the range covered.

| Ayah | Arabic (with full tashkīl) | English Translation |
|------|---------------------------|---------------------|
| 1    | عَمَّ يَتَسَآءَلُونَ        | About what are they asking? |
| 2    | عَنِ ٱلنَّبَإِ ٱلْعَظِيمِ   | About the great news |
... continue for ALL verses discussed
```

---

## Expected Results

| Metric | Current | After |
|--------|---------|-------|
| Quiz Accuracy | ~50% | 95%+ |
| Vocab Accuracy | ~60% | 99% |
| Verse Coverage | Partial | Complete |
| Reliability | Inconsistent | Consistent |

---

## Quick Win (Immediate Fix)

Before implementing full solution, restore the comprehensive prompt:
1. Add back full vocabulary table with 15-20 words
2. Add explicit instruction to include ALL verses
3. Keep current quiz verification but improve patterns
