# Lesson Stage Detection System

## Overview

The Lesson Stage Detection system automatically analyzes Quran lesson transcripts to determine which of three learning stages the lesson focuses on:

1. **Understanding (Tadabbur)** - Focus on meaning, translation, context, and lessons
2. **Fluency (Tajweed)** - Focus on pronunciation, recitation, and proper articulation
3. **Memorization (Hifz)** - Focus on memorizing verses without looking

This system uses AI (Claude API) to analyze lesson transcripts and provides:
- Primary stage detection with confidence score
- Percentage breakdown across all three stages
- Evidence quotes from the transcript
- Mixed-stage identification when applicable

## Architecture

### Components

1. **Prompt Template** (`/src/prompts/detect-lesson-stage.md`)
   - Defines the three learning stages
   - Provides keywords and indicators for each stage
   - Specifies the JSON return format

2. **TypeScript Utility** (`/src/utils/lessonStageDetector.ts`)
   - Client-side functions for calling the Edge Function
   - Type definitions for stage detection results
   - Helper functions for displaying stage information

3. **Supabase Edge Function** (`/supabase/functions/detect-lesson-stage/index.ts`)
   - Serverless function that calls the Claude API
   - Handles prompt formatting and response parsing
   - Returns structured JSON results

4. **Demo Page** (`/stage-detection-demo.html`)
   - Interactive demo with sample transcripts
   - Live testing interface
   - Visual results display

## How It Works

### Stage Indicators

**Understanding (Tadabbur):**
- Teacher discusses English translation
- Explains meaning, context, and lessons
- References Tafsir scholars
- Keywords: "means", "lesson", "teaches us", "context", "why Allah said", "tafsir"

**Fluency (Tajweed):**
- Repeated recitation by student
- Pronunciation corrections
- Teacher says "read again", "faster", "focus on this letter"
- Keywords: "pronounce", "read", "again", "makhraj", "tajweed", "recite"

**Memorization (Hifz):**
- Student reciting from memory
- Forgetting what comes next
- Teacher prompting with first word
- Keywords: "from memory", "what comes next", "forgot", "without looking", "hifz"

### Analysis Process

1. Transcript is sent to the Edge Function
2. Edge Function formats the prompt with the transcript
3. Claude API analyzes the transcript for stage indicators
4. Response is parsed and validated
5. Structured result is returned with:
   - Detected primary stage
   - Confidence score (0.0-1.0)
   - Evidence quotes
   - Breakdown percentages
   - Secondary stage if mixed

### Confidence Scoring

- **0.9-1.0**: Very clear, one dominant stage throughout
- **0.7-0.89**: Clear primary stage with minor secondary elements
- **0.5-0.69**: Mixed lesson with identifiable primary focus
- **Below 0.5**: Unclear or evenly mixed stages

## Usage

### 1. Demo Page (Quickest Way to Test)

Open `/stage-detection-demo.html` in your browser:

```bash
open http://localhost:5173/stage-detection-demo.html
```

Features:
- Three sample transcripts (one for each stage)
- Live transcript input and analysis
- Visual results with color coding
- Stage breakdown charts

### 2. Programmatic Usage in React

```typescript
import { detectLessonStage, getStageName, getStageIcon } from '@/utils/lessonStageDetector';

async function analyzeLessonTranscript(transcript: string) {
  const result = await detectLessonStage(transcript);

  if (result) {
    console.log('Detected Stage:', result.detected_stage);
    console.log('Confidence:', result.confidence);
    console.log('Evidence:', result.evidence);
    console.log('Breakdown:', result.stage_breakdown);

    // Get friendly display name
    const stageName = getStageName(result.detected_stage);

    // Get icon for UI
    const icon = getStageIcon(result.detected_stage);

    // Display in your component
    return (
      <div>
        <h3>{icon} {stageName}</h3>
        <p>Confidence: {Math.round(result.confidence * 100)}%</p>
      </div>
    );
  }
}
```

### 3. Direct Edge Function Call

```javascript
const { data, error } = await supabase.functions.invoke('detect-lesson-stage', {
  body: {
    transcript: 'Your lesson transcript here...',
    prompt: 'Analysis prompt (optional, will use default)'
  }
});

if (data) {
  console.log('Stage:', data.detected_stage);
  console.log('Confidence:', data.confidence);
}
```

## API Reference

### `detectLessonStage(transcript: string)`

Analyzes a transcript and returns stage detection result.

**Parameters:**
- `transcript` (string) - The lesson transcript (minimum 50 characters)

**Returns:**
```typescript
{
  detected_stage: 'understanding' | 'fluency' | 'memorization',
  confidence: number, // 0.0 to 1.0
  evidence: string[], // Quotes from transcript
  mixed_stage: boolean,
  secondary_stage: 'understanding' | 'fluency' | 'memorization' | null,
  stage_breakdown: {
    understanding: number, // 0.0 to 1.0
    fluency: number,
    memorization: number
  }
}
```

### Helper Functions

**`getStageName(stage: string): string`**
- Returns friendly display name (e.g., "Understanding (Tadabbur)")

**`getStageColor(stage: string): string`**
- Returns Tailwind color name for UI styling

**`getStageIcon(stage: string): string`**
- Returns emoji icon for the stage

**`formatStageDetectionSummary(result: StageDetectionResult): string`**
- Returns formatted markdown summary of the analysis

## Integration with Lesson Insights

### Step 1: Add to Insights Generation

When generating lesson insights, detect the stage first:

```typescript
// In your insights generation function
import { detectLessonStage } from '@/utils/lessonStageDetector';

async function generateLessonInsights(lessonId: string, transcript: string) {
  // Detect stage first
  const stageResult = await detectLessonStage(transcript);

  // Generate insights using Claude
  const insights = await generateInsights(transcript, stageResult?.detected_stage);

  // Save both to database
  await supabase.from('lesson_insights').insert({
    lesson_id: lessonId,
    detected_stage: stageResult?.detected_stage,
    stage_confidence: stageResult?.confidence,
    stage_breakdown: stageResult?.stage_breakdown,
    insights_content: insights
  });
}
```

### Step 2: Display in UI

Add stage badge to lesson insights page:

```tsx
import { getStageIcon, getStageName, getStageColor } from '@/utils/lessonStageDetector';

function LessonInsightsHeader({ insight }) {
  const icon = getStageIcon(insight.detected_stage);
  const name = getStageName(insight.detected_stage);
  const colorClass = `text-${getStageColor(insight.detected_stage)}-700`;

  return (
    <div className={`${colorClass} font-semibold`}>
      {icon} Primary Focus: {name}
      <span className="ml-2 text-sm">
        ({Math.round(insight.stage_confidence * 100)}% confidence)
      </span>
    </div>
  );
}
```

## Database Schema

Add these columns to your `lesson_insights` table:

```sql
ALTER TABLE lesson_insights
ADD COLUMN detected_stage TEXT CHECK (detected_stage IN ('understanding', 'fluency', 'memorization')),
ADD COLUMN stage_confidence DECIMAL(3,2) CHECK (stage_confidence >= 0 AND stage_confidence <= 1),
ADD COLUMN stage_breakdown JSONB,
ADD COLUMN stage_evidence TEXT[];
```

Example data:
```json
{
  "detected_stage": "understanding",
  "stage_confidence": 0.95,
  "stage_breakdown": {
    "understanding": 0.90,
    "fluency": 0.08,
    "memorization": 0.02
  },
  "stage_evidence": [
    "Let's understand what this ayah means",
    "The context is that the Quraysh were denying",
    "This teaches us about Allah's mercy"
  ]
}
```

## Environment Variables

Make sure your Supabase project has the Claude API key configured:

```bash
# Set in Supabase Dashboard under Project Settings > Edge Functions > Secrets
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Or deploy it:
```bash
SUPABASE_ACCESS_TOKEN="your-token" \
./node_modules/supabase/bin/supabase secrets set \
  ANTHROPIC_API_KEY="sk-ant-api03-..." \
  --project-ref boyrjgivpepjiboekwuu
```

## Testing

### Test with Sample Transcripts

1. Open `stage-detection-demo.html`
2. Click on one of the three sample buttons
3. Click "Analyze Stage"
4. Review the results

Expected results:
- **Understanding sample**: Should detect "understanding" with 85-95% confidence
- **Fluency sample**: Should detect "fluency" with 85-95% confidence
- **Memorization sample**: Should detect "memorization" with 85-95% confidence

### Test with Your Own Transcripts

1. Paste a real lesson transcript into the demo
2. Check if the detected stage matches your expectation
3. Review the evidence quotes to see why it made that decision
4. Check the stage breakdown percentages

### Unit Testing

```typescript
import { detectLessonStage } from '@/utils/lessonStageDetector';

describe('Stage Detection', () => {
  it('should detect understanding stage', async () => {
    const transcript = `Teacher: Let's understand what this verse means...`;
    const result = await detectLessonStage(transcript);

    expect(result?.detected_stage).toBe('understanding');
    expect(result?.confidence).toBeGreaterThan(0.7);
  });

  it('should detect fluency stage', async () => {
    const transcript = `Teacher: Read again with better pronunciation...`;
    const result = await detectLessonStage(transcript);

    expect(result?.detected_stage).toBe('fluency');
    expect(result?.confidence).toBeGreaterThan(0.7);
  });

  it('should detect memorization stage', async () => {
    const transcript = `Teacher: Recite from memory without looking...`;
    const result = await detectLessonStage(transcript);

    expect(result?.detected_stage).toBe('memorization');
    expect(result?.confidence).toBeGreaterThan(0.7);
  });
});
```

## Troubleshooting

### Error: "ANTHROPIC_API_KEY not configured"

**Solution:** Set the API key in Supabase Edge Functions secrets:
```bash
SUPABASE_ACCESS_TOKEN="sbp_..." \
./node_modules/supabase/bin/supabase secrets set \
  ANTHROPIC_API_KEY="sk-ant-..." \
  --project-ref boyrjgivpepjiboekwuu
```

### Error: "Transcript too short"

**Solution:** Ensure the transcript is at least 50 characters long. Very short transcripts don't provide enough context for accurate detection.

### Low Confidence Scores

**Cause:** Mixed lessons that include multiple stages.

**Solution:** This is normal! The system will:
1. Identify the primary stage
2. Set `mixed_stage: true`
3. Identify the secondary stage
4. Provide breakdown percentages

### Incorrect Stage Detection

**Debugging steps:**
1. Check the evidence quotes - do they match the detected stage?
2. Review the stage breakdown - are percentages close?
3. Read through the transcript - is it truly a mixed lesson?
4. Add more explicit stage keywords to your lessons

**Improving accuracy:**
- Use clear stage-specific language in lessons
- Start with stage transition phrases ("Now let's focus on memorization...")
- Keep each lesson focused on primarily one stage

## Performance

- **Average latency**: 2-4 seconds per transcript
- **Cost**: ~$0.001-0.003 per analysis (Claude API)
- **Rate limits**: Depends on your Claude API tier

## Future Enhancements

Potential improvements:
1. **Caching**: Cache results to avoid re-analyzing the same transcript
2. **Batch Processing**: Analyze multiple transcripts in parallel
3. **Stage Transitions**: Detect when a lesson transitions between stages
4. **Custom Stages**: Allow admins to define custom learning stages
5. **Feedback Loop**: Let teachers confirm/correct stage detection to improve accuracy
6. **Analytics**: Track stage distribution across all lessons

## Related Files

- `/src/prompts/detect-lesson-stage.md` - Prompt template
- `/src/utils/lessonStageDetector.ts` - TypeScript utilities
- `/supabase/functions/detect-lesson-stage/index.ts` - Edge Function
- `/stage-detection-demo.html` - Interactive demo
- `/interactive-quiz-demo.html` - Quiz feature demo
- `/insight-preview.html` - Full insights preview

## Support

For issues or questions:
1. Check this documentation first
2. Test with the demo page at `/stage-detection-demo.html`
3. Review Edge Function logs in Supabase Dashboard
4. Check Claude API status and quotas

---

**Last Updated:** November 12, 2024
**Version:** 1.0.0
