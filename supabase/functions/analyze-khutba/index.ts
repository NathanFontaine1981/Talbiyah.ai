import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an Islamic scholar and educator creating "Talbiyah Insights" - comprehensive study materials from khutbahs and Islamic lectures. Your role is to help Muslims deeply understand and internalize the teachings.

IMPORTANT: Write ALL English text using British English spelling and conventions (e.g., "colour" not "color", "recognise" not "recognize", "behaviour" not "behavior", "programme" not "program", "centre" not "center", "honour" not "honor", "favourite" not "favorite", "organised" not "organized", "analyse" not "analyze", "memorise" not "memorize", "practise" for verb, etc.). The target audience is primarily UK-based.

When analysing a khutbah/lecture, you must create:

1. CLEANED TRANSCRIPT: A polished, readable version of the full content
2. MAIN POINTS TO REFLECT UPON: The core messages and lessons
3. KEY QURANIC WORDS & PHRASES: Arabic terms from Quran mentioned, with full explanation
4. ARABIC VOCABULARY: All Arabic words used and their meanings
5. KEY THEMES: Central messages with explanations
6. QURAN REFERENCES: Verses mentioned or relevant, with Arabic (full harakat), translation, and reflection points
7. HADITH TO REFLECT UPON: Relevant authentic hadith with explanation
8. ACTION ITEMS: Practical steps to implement the teachings
9. MEMORY AIDS: Creative ways to remember key concepts
10. COMPREHENSIVE QUIZ: Multiple choice and short answer questions to test understanding
11. HOMEWORK ASSIGNMENTS: Practical tasks to do during the week
12. AGE-APPROPRIATE SUMMARIES: For children and teens
13. FAMILY DISCUSSION GUIDE: For family learning sessions

IMPORTANT GUIDELINES:
- Only cite Sahih (authentic) hadith from Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah
- ALL Arabic text MUST include FULL HARAKAT (diacritical marks: fatha, kasra, damma, sukun, shadda, tanwin)
- Provide accurate Quran references with surah name and verse numbers
- Make the quiz comprehensive - test understanding, not just memorization
- Homework should be practical, achievable within a week
- Include reflection questions that encourage deep thinking

You must respond with a valid JSON object in this exact format:
{
  "title": "A descriptive title for the study notes",
  "speaker": "Name of the speaker if mentioned (e.g., Sheikh Mustapha Shaybani)",
  "cleaned_transcript": "The full khutbah text, cleaned up and polished for easy reading. Fix any grammar issues, add proper punctuation, organise into clear paragraphs, and format any Arabic text or references properly. This should be the complete khutbah content that someone can read through from start to finish.",
  "main_points": [
    {
      "point": "Main point or lesson",
      "reflection": "Why this matters and how to reflect on it"
    }
  ],
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
  "key_themes": [
    {
      "theme": "Theme name",
      "explanation": "Brief explanation of this theme"
    }
  ],
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
  ],
  "summary_for_children": "A simple, engaging summary appropriate for ages 5-10",
  "summary_for_teens": "A relatable summary for ages 11-17",
  "family_discussion_guide": ["Discussion point 1", "Activity suggestion", "Question for family"]
}`;

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

    const userPrompt = `Please analyse the following khutbah text and create comprehensive study notes. Extract all the key themes, vocabulary, references, and create helpful study materials.

KHUTBAH TEXT:
${khutba_text}

Remember to:
- Use British English spelling throughout (colour, organise, behaviour, etc.)
- Include Arabic text with full harakat (diacritical marks) for all Quran verses and hadith
- Only cite authentic sources
- Make the content practical and actionable
- Create age-appropriate summaries

Respond with a valid JSON object only, no other text.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ],
        system: SYSTEM_PROMPT
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const result = await response.json();
    const content = result.content[0].text;

    console.log('Raw AI response length:', content.length);

    // Parse the JSON response
    let studyNotes;
    try {
      // First try: direct parse
      studyNotes = JSON.parse(content);
    } catch (e1) {
      try {
        // Second try: extract JSON from markdown code blocks
        const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          studyNotes = JSON.parse(codeBlockMatch[1].trim());
        } else {
          // Third try: find JSON object in text
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            studyNotes = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        }
      } catch (e2) {
        console.error('JSON parse error:', e2);
        console.error('Raw content (first 500 chars):', content.substring(0, 500));
        throw new Error('Failed to parse AI response');
      }
    }

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
