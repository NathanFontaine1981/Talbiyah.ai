import { supabase } from '@/lib/supabase';

export interface StageDetectionResult {
  detected_stage: 'understanding' | 'fluency' | 'memorization';
  confidence: number;
  evidence: string[];
  mixed_stage: boolean;
  secondary_stage: 'understanding' | 'fluency' | 'memorization' | null;
  stage_breakdown: {
    understanding: number;
    fluency: number;
    memorization: number;
  };
}

const STAGE_DETECTION_PROMPT = `You are analyzing a Quran lesson transcript to determine which learning stage it represents.

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

Return ONLY a valid JSON object with this exact structure:
{
  "detected_stage": "understanding" | "fluency" | "memorization",
  "confidence": 0.0-1.0,
  "evidence": ["direct quote from transcript", "another quote showing this stage"],
  "mixed_stage": false,
  "secondary_stage": null,
  "stage_breakdown": {
    "understanding": 0.7,
    "fluency": 0.2,
    "memorization": 0.1
  }
}

## Confidence Scoring:
- 0.9-1.0: Very clear, one dominant stage throughout
- 0.7-0.89: Clear primary stage with minor secondary elements
- 0.5-0.69: Mixed lesson with identifiable primary focus
- Below 0.5: Unclear or evenly mixed stages

## Now Analyze This Transcript:

{TRANSCRIPT}`;

/**
 * Detects the learning stage of a Quran lesson from its transcript
 * Uses Claude API via Supabase Edge Function
 */
export async function detectLessonStage(
  transcript: string
): Promise<StageDetectionResult | null> {
  try {
    if (!transcript || transcript.trim().length < 50) {
      console.warn('Transcript too short for stage detection');
      return null;
    }

    // Replace {TRANSCRIPT} placeholder with actual transcript
    const prompt = STAGE_DETECTION_PROMPT.replace('{TRANSCRIPT}', transcript);

    // Call the Supabase Edge Function that uses Claude API
    const { data, error } = await supabase.functions.invoke('detect-lesson-stage', {
      body: { prompt, transcript }
    });

    if (error) {
      console.error('Error detecting lesson stage:', error);
      return null;
    }

    // Parse and validate the response
    if (data && typeof data === 'object') {
      const result = data as StageDetectionResult;

      // Validate the result structure
      if (
        result.detected_stage &&
        ['understanding', 'fluency', 'memorization'].includes(result.detected_stage) &&
        typeof result.confidence === 'number' &&
        result.confidence >= 0 &&
        result.confidence <= 1 &&
        Array.isArray(result.evidence) &&
        result.stage_breakdown &&
        typeof result.stage_breakdown.understanding === 'number' &&
        typeof result.stage_breakdown.fluency === 'number' &&
        typeof result.stage_breakdown.memorization === 'number'
      ) {
        return result;
      }
    }

    console.warn('Invalid stage detection result format');
    return null;
  } catch (error) {
    console.error('Exception in detectLessonStage:', error);
    return null;
  }
}

/**
 * Gets a friendly display name for a learning stage
 */
export function getStageName(stage: string): string {
  const stageNames: Record<string, string> = {
    understanding: 'Understanding (Tadabbur)',
    fluency: 'Fluency (Tajweed)',
    memorization: 'Memorization (Hifz)'
  };
  return stageNames[stage] || stage;
}

/**
 * Gets a color theme for a learning stage (for UI display)
 */
export function getStageColor(stage: string): string {
  const stageColors: Record<string, string> = {
    understanding: 'blue',
    fluency: 'emerald',
    memorization: 'purple'
  };
  return stageColors[stage] || 'gray';
}

/**
 * Gets an icon/emoji for a learning stage
 */
export function getStageIcon(stage: string): string {
  const stageIcons: Record<string, string> = {
    understanding: '📖',
    fluency: '🎵',
    memorization: '🧠'
  };
  return stageIcons[stage] || '📚';
}

/**
 * Formats stage detection result as a readable summary
 */
export function formatStageDetectionSummary(result: StageDetectionResult): string {
  const stageName = getStageName(result.detected_stage);
  const icon = getStageIcon(result.detected_stage);
  const confidencePercent = Math.round(result.confidence * 100);

  let summary = `${icon} **Primary Stage: ${stageName}** (${confidencePercent}% confidence)\n\n`;

  if (result.mixed_stage && result.secondary_stage) {
    const secondaryStageName = getStageName(result.secondary_stage);
    summary += `This lesson also includes ${secondaryStageName} elements.\n\n`;
  }

  summary += `**Stage Breakdown:**\n`;
  summary += `- Understanding: ${Math.round(result.stage_breakdown.understanding * 100)}%\n`;
  summary += `- Fluency: ${Math.round(result.stage_breakdown.fluency * 100)}%\n`;
  summary += `- Memorization: ${Math.round(result.stage_breakdown.memorization * 100)}%\n`;

  if (result.evidence.length > 0) {
    summary += `\n**Evidence from transcript:**\n`;
    result.evidence.forEach((quote, idx) => {
      summary += `${idx + 1}. "${quote}"\n`;
    });
  }

  return summary;
}
