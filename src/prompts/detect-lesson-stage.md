# Quran Lesson Stage Detection Prompt

You are analyzing a Quran lesson transcript to determine which learning stage it represents.

## STAGE 1 - UNDERSTANDING (Tadabbur):
- Teacher discusses English translation
- Explains meaning, context, lessons
- References Tafsir scholars
- Focus on "what does this mean?"
- Keywords: "means", "lesson", "teaches us", "context", "why Allah said", "tafsir", "explanation", "understand"

## STAGE 2 - FLUENCY (Tajweed):
- Repeated recitation by student
- Pronunciation corrections
- Teacher says "read again", "faster", "focus on this letter"
- Minimal English, mostly Arabic
- Keywords: "pronounce", "read", "again", "makhraj", "tajweed", "faster", "recite", "elongate", "ghunnah"

## STAGE 3 - MEMORIZATION (Hifz):
- Student reciting from memory
- Forgetting what comes next
- Teacher prompting with first word
- Multiple attempts at same verse
- Keywords: "from memory", "what comes next", "forgot", "try again", "without looking", "hifz", "memorize"

## Analysis Instructions:

1. Read through the entire transcript
2. Identify which stage indicators appear most frequently
3. Look for explicit stage transitions (e.g., "Now let's work on memorizing")
4. Consider the flow of the lesson - what is the primary focus?
5. If multiple stages are present, determine which is primary (takes up most time/focus)

## Return Format:

Return a JSON object with:
```json
{
  "detected_stage": "understanding" | "fluency" | "memorization",
  "confidence": 0.0-1.0,
  "evidence": ["direct quote from transcript", "another quote showing this stage"],
  "mixed_stage": false,
  "secondary_stage": "fluency" | null,
  "stage_breakdown": {
    "understanding": 0.7,
    "fluency": 0.2,
    "memorization": 0.1
  }
}
```

## Confidence Scoring:
- 0.9-1.0: Very clear, one dominant stage throughout
- 0.7-0.89: Clear primary stage with minor secondary elements
- 0.5-0.69: Mixed lesson with identifiable primary focus
- Below 0.5: Unclear or evenly mixed stages

## Example Analysis:

**Transcript:** "Let's understand what this ayah means. Allah says 'Have they not seen...' This is a rhetorical question. The context is that the Quraysh were denying resurrection. The lesson here is that Allah uses examples from nature to prove His power."

**Analysis:**
```json
{
  "detected_stage": "understanding",
  "confidence": 0.95,
  "evidence": [
    "Let's understand what this ayah means",
    "The context is that the Quraysh were denying resurrection",
    "The lesson here is that Allah uses examples from nature"
  ],
  "mixed_stage": false,
  "secondary_stage": null,
  "stage_breakdown": {
    "understanding": 0.95,
    "fluency": 0.05,
    "memorization": 0.0
  }
}
```

---

## Now Analyze This Transcript:

{TRANSCRIPT_HERE}
