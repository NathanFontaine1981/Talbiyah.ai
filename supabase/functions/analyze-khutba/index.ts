import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BRITISH_ENGLISH_NOTE = `IMPORTANT: Write ALL English text using British English spelling and conventions (e.g., "colour" not "color", "recognise" not "recognize", "behaviour" not "behavior", "programme" not "program", "centre" not "center", "honour" not "honor", "favourite" not "favorite", "organised" not "organized", "analyse" not "analyze", "memorise" not "memorize", "practise" for verb, etc.). The target audience is primarily UK-based.`;

const TRANSCRIPT_SYSTEM_PROMPT = `You are an Islamic scholar and educator creating "Talbiyah Insights" - comprehensive study materials from khutbahs and Islamic lectures. Your role is to help Muslims deeply understand and internalize the teachings.

${BRITISH_ENGLISH_NOTE}

When analysing a khutbah/lecture, you must create:

1. A short descriptive title and the speaker's name if mentioned
2. MAIN POINTS TO REFLECT UPON: The core messages and lessons (AT MOST 5)
3. KEY THEMES: Central messages with explanations (AT MOST 4)

IMPORTANT GUIDELINES:
- Do NOT reproduce or quote the full khutbah text - only summarise
- Include reflection questions that encourage deep thinking
- Respect the maximum item counts above even for a long or rich khutbah

You must respond with a valid JSON object in this exact format:
{
  "title": "A descriptive title for the study notes",
  "speaker": "Name of the speaker if mentioned (e.g., Sheikh Mustapha Shaybani)",
  "main_points": [
    {
      "point": "Main point or lesson",
      "reflection": "Why this matters and how to reflect on it"
    }
  ],
  "key_themes": [
    {
      "theme": "Theme name",
      "explanation": "Brief explanation of this theme"
    }
  ]
}`;

const VOCAB_SYSTEM_PROMPT = `You are an Islamic scholar and educator creating "Talbiyah Insights" - comprehensive study materials from khutbahs and Islamic lectures. Your role is to help Muslims deeply understand and internalize the teachings.

${BRITISH_ENGLISH_NOTE}

When analysing a khutbah/lecture, you must create:

1. KEY QURANIC WORDS & PHRASES: Arabic terms from Quran mentioned, with full explanation (AT MOST 6)
2. ARABIC VOCABULARY: The most important Arabic words used and their meanings (AT MOST 8)
3. ACTION ITEMS: Practical steps to implement the teachings (AT MOST 5)
4. MEMORY AIDS: Creative ways to remember key concepts (AT MOST 4)
5. AGE-APPROPRIATE SUMMARIES: For children and teens
6. FAMILY DISCUSSION GUIDE: For family learning sessions (AT MOST 5 points)

IMPORTANT GUIDELINES:
- ALL Arabic words/phrases MUST include FULL HARAKAT (diacritical marks: fatha, kasra, damma, sukun, shadda, tanwin)
- Respect the maximum item counts above even for a long or rich khutbah

You must respond with a valid JSON object in this exact format:
{
  "quranic_words_phrases": [
    {
      "arabic": "Arabic word/phrase with full harakat",
      "transliteration": "How to pronounce it",
      "meaning": "What it means",
      "context": "How it was used in the khutbah",
      "quran_reference": "Where it appears in Quran if applicable"
    }
  ],
  "key_vocabulary": [
    {
      "term": "English term",
      "arabic": "Arabic term with full harakat",
      "definition": "Clear definition and explanation"
    }
  ],
  "action_items": [
    {
      "action": "Specific action to take",
      "how_to": "Practical steps to implement this action"
    }
  ],
  "memory_aids": [
    {
      "concept": "Key concept to remember",
      "memory_tip": "A memorable way to remember this concept"
    }
  ],
  "summary_for_children": "A simple, engaging summary appropriate for ages 5-10",
  "summary_for_teens": "A relatable summary for ages 11-17",
  "family_discussion_guide": ["Discussion point 1", "Activity suggestion", "Question for family"]
}`;

const REFERENCES_SYSTEM_PROMPT = `You are an Islamic scholar and educator creating "Talbiyah Insights" - comprehensive study materials from khutbahs and Islamic lectures. Your role is to help Muslims deeply understand and internalize the teachings.

${BRITISH_ENGLISH_NOTE}

When analysing a khutbah/lecture, you must create:

1. QURAN REFERENCES: Verses mentioned or relevant, with Arabic (full harakat), translation, and reflection points (AT MOST 5)
2. HADITH TO REFLECT UPON: Relevant authentic hadith with explanation (AT MOST 5)

IMPORTANT GUIDELINES:
- Only cite Sahih (authentic) hadith from Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah
- ALL Arabic text MUST include FULL HARAKAT (diacritical marks: fatha, kasra, damma, sukun, shadda, tanwin)
- Provide accurate Quran references with surah name and verse numbers
- Respect the maximum item counts above even for a long or rich khutbah

You must respond with a valid JSON object in this exact format:
{
  "quran_references": [
    {
      "arabic": "Arabic verse with FULL HARAKAT",
      "translation": "English translation",
      "reference": "Surah Name (Chapter:Verse)",
      "reflection": "Points to reflect upon from this verse"
    }
  ],
  "hadith_references": [
    {
      "arabic": "Arabic hadith with harakat if available",
      "translation": "English translation",
      "reference": "Source (e.g., Sahih Bukhari 1234)",
      "reflection": "Points to reflect upon from this hadith"
    }
  ]
}`;

const QUIZ_SYSTEM_PROMPT = `You are an Islamic scholar and educator creating a quiz and homework assignments from a khutbah or Islamic lecture, as part of "Talbiyah Insights" study materials.

${BRITISH_ENGLISH_NOTE}

You must create:
1. QUIZ: AT MOST 5 multiple choice questions, AT MOST 3 short answer questions, and AT MOST 3 reflection questions
2. HOMEWORK ASSIGNMENTS: Practical tasks to do during the week (AT MOST 3)

IMPORTANT GUIDELINES:
- Test understanding, not just memorisation
- Homework should be practical, achievable within a week
- Respect the maximum item counts above even for a long or rich khutbah

You must respond with a valid JSON object in this exact format:
{
  "quiz": {
    "multiple_choice": [
      {
        "question": "Question text?",
        "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
        "correct_answer": "A",
        "explanation": "Why this is correct"
      }
    ],
    "short_answer": [
      {
        "question": "Question requiring a written response?",
        "suggested_answer": "Key points that should be in the answer"
      }
    ],
    "reflection": [
      "Deep reflection question 1?",
      "Deep reflection question 2?"
    ]
  },
  "homework": [
    {
      "task": "Specific homework assignment",
      "description": "Detailed instructions on how to complete it",
      "duration": "How long it should take or when to do it"
    }
  ]
}`;

function cleanTranscript(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
}

function parseJsonResponse(content: string, label: string) {
  try {
    return JSON.parse(content);
  } catch (e1) {
    try {
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        return JSON.parse(codeBlockMatch[1].trim());
      }
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (e2) {
      console.error(`${label} JSON parse error:`, e2);
      console.error(`${label} raw content (first 500 chars):`, content.substring(0, 500));
      throw new Error(`Failed to parse ${label} AI response`);
    }
  }
}

async function callClaude(anthropicApiKey: string, systemPrompt: string, userPrompt: string, maxTokens: number) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ],
      system: systemPrompt
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Anthropic API error:', errorText);
    throw new Error(`AI analysis failed: ${response.status}`);
  }

  const result = await response.json();
  return result.content[0].text;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { khutba_text, user_id } = await req.json();

    if (!khutba_text || khutba_text.trim().length < 50) {
      throw new Error('Please provide more khutba text for analysis (at least 50 characters)');
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const closingInstructions = `
Remember to:
- Use British English spelling throughout (colour, organise, behaviour, etc.)
- Only cite authentic sources
- Make the content practical and actionable

Respond with a valid JSON object only, no other text.`;

    const transcriptUserPrompt = `Please analyse the following khutbah text and produce a title, speaker name, main points, and key themes. Do not reproduce the full text back - summarise only.

KHUTBAH TEXT:
${khutba_text}
${closingInstructions}`;

    const vocabUserPrompt = `Please analyse the following khutbah text and extract vocabulary, action items, memory aids, and age-appropriate summaries.

KHUTBAH TEXT:
${khutba_text}

Remember to:
- Use British English spelling throughout (colour, organise, behaviour, etc.)
- Include Arabic text with full harakat (diacritical marks) for all vocabulary
- Create age-appropriate summaries

Respond with a valid JSON object only, no other text.`;

    const referencesUserPrompt = `Please analyse the following khutbah text and extract relevant Quran verses and hadith references.

KHUTBAH TEXT:
${khutba_text}

Remember to:
- Use British English spelling throughout (colour, organise, behaviour, etc.)
- Include Arabic text with full harakat (diacritical marks) for all Quran verses and hadith
- Only cite authentic sources

Respond with a valid JSON object only, no other text.`;

    const quizUserPrompt = `Please create a quiz and homework assignments based on the following khutbah text.

KHUTBAH TEXT:
${khutba_text}

Remember to:
- Use British English spelling throughout (colour, organise, behaviour, etc.)
- Make the quiz test understanding, not just memorisation
- Make homework practical and achievable within a week

Respond with a valid JSON object only, no other text.`;

    // Run four smaller, capped generations in parallel instead of one giant
    // open-ended call, so each individual Claude request finishes well
    // within the edge function's ~150s execution limit regardless of how
    // long or rich the khutbah is (an open-ended combined call could
    // generate an unbounded amount of content and routinely exceeded the
    // limit, with the platform returning 504 before Claude finished).
    // Quran/hadith references are split out on their own because full
    // harakat on entire verses is the most token-dense content here. The
    // cleaned transcript is produced programmatically below rather than by
    // Claude, since asking it to reproduce the full khutbah text scales
    // output (and generation time) directly with input length.
    const [transcriptText, vocabText, referencesText, quizText] = await Promise.all([
      callClaude(anthropicApiKey, TRANSCRIPT_SYSTEM_PROMPT, transcriptUserPrompt, 3000),
      callClaude(anthropicApiKey, VOCAB_SYSTEM_PROMPT, vocabUserPrompt, 5000),
      callClaude(anthropicApiKey, REFERENCES_SYSTEM_PROMPT, referencesUserPrompt, 5000),
      callClaude(anthropicApiKey, QUIZ_SYSTEM_PROMPT, quizUserPrompt, 4000)
    ]);

    console.log('Transcript response length:', transcriptText.length);
    console.log('Vocab response length:', vocabText.length);
    console.log('References response length:', referencesText.length);
    console.log('Quiz response length:', quizText.length);

    const transcriptNotes = parseJsonResponse(transcriptText, 'transcript');
    const vocabNotes = parseJsonResponse(vocabText, 'vocab');
    const referencesNotes = parseJsonResponse(referencesText, 'references');
    const quizNotes = parseJsonResponse(quizText, 'quiz');

    const studyNotes: any = {
      ...transcriptNotes,
      ...vocabNotes,
      ...referencesNotes,
      ...quizNotes,
      cleaned_transcript: cleanTranscript(khutba_text)
    };

    // Ensure all fields exist with defaults
    studyNotes.main_points = studyNotes.main_points || [];
    studyNotes.quranic_words_phrases = studyNotes.quranic_words_phrases || [];
    studyNotes.key_vocabulary = studyNotes.key_vocabulary || [];
    studyNotes.key_themes = studyNotes.key_themes || [];
    studyNotes.quran_references = studyNotes.quran_references || [];
    studyNotes.hadith_references = studyNotes.hadith_references || [];
    studyNotes.action_items = studyNotes.action_items || [];
    studyNotes.memory_aids = studyNotes.memory_aids || [];
    studyNotes.quiz = studyNotes.quiz || { multiple_choice: [], short_answer: [], reflection: [] };
    studyNotes.homework = studyNotes.homework || [];
    studyNotes.summary_for_children = studyNotes.summary_for_children || '';
    studyNotes.summary_for_teens = studyNotes.summary_for_teens || '';
    studyNotes.family_discussion_guide = studyNotes.family_discussion_guide || [];

    return new Response(
      JSON.stringify(studyNotes),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Analysis error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Analysis failed',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
