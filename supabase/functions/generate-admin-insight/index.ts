import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateInsightRequest {
  template_type: 'quran' | 'arabic' | 'reverts' | 'khutba';
  title: string;
  teacher_name: string;
  student_name?: string;
  mosque_name?: string;
  lesson_date: string;
  duration_minutes?: number;
  subject_tags?: string[];
  transcript: string;
}

// ====================
// TEMPLATE PROMPTS
// ====================

const QURAN_TEMPLATE_PROMPT = `You are Talbiyah Insights – Qur'an Lesson Generator.
Transform the lesson transcript into a beautiful, structured study guide.

Generate a JSON response with the following EXACT structure (use camelCase keys):
{
  "lessonSummary": "2-3 sentence overview of the lesson",
  "versesCovered": {
    "surah": "Name of Surah",
    "ayahRange": "e.g. 1-5 or specific verses mentioned"
  },
  "tajweedPoints": [
    {"rule": "Rule name", "explanation": "Brief explanation", "examples": ["Arabic example"]}
  ],
  "vocabulary": [
    {"arabic": "Word in Arabic", "transliteration": "Transliterated", "meaning": "English meaning", "root": "Root letters if known"}
  ],
  "tafsirPoints": ["Key insight from tafsir discussion"],
  "memorizationProgress": {
    "versesReviewed": "What was reviewed",
    "newVerses": "What was memorized new",
    "notes": "Teacher's notes on progress"
  },
  "practiceRecommendations": [
    "Specific practice task 1",
    "Specific practice task 2"
  ],
  "nextLessonPreview": "What to expect next (if mentioned)"
}

IMPORTANT:
- Extract information ONLY from the transcript. Do not invent content.
- If a section has no relevant content, use empty array [] or null.
- Always include Arabic text with proper diacritics where mentioned.
- Use camelCase for all JSON keys (e.g., lessonSummary not lesson_summary).`;

const ARABIC_TEMPLATE_PROMPT = `You are Talbiyah Insights – Arabic Language Lesson Generator.
Transform the Arabic class transcript into a comprehensive study guide.

Generate a JSON response with the following EXACT structure (use camelCase keys):
{
  "lessonSummary": "2-3 sentence overview of grammar/vocabulary focus",
  "vocabulary": [
    {
      "arabic": "Arabic word with tashkeel",
      "transliteration": "Transliteration",
      "english": "English meaning",
      "wordType": "noun/verb/adjective/etc",
      "exampleSentence": "Example in Arabic"
    }
  ],
  "grammarPoints": [
    {
      "topic": "Grammar topic name",
      "explanation": "Clear explanation",
      "examples": [
        {"arabic": "Arabic example", "english": "English translation"}
      ],
      "commonMistakes": "What to avoid"
    }
  ],
  "conversationPhrases": [
    {
      "arabic": "Arabic phrase",
      "transliteration": "Transliteration",
      "english": "English meaning",
      "context": "When to use this"
    }
  ],
  "commonMistakes": [
    {"mistake": "Common error", "correction": "Correct form"}
  ],
  "homeworkExercises": [
    {"task": "Exercise description", "type": "writing/speaking/reading"}
  ],
  "recommendedResources": [
    {"title": "Resource name", "type": "book/video/app", "description": "Brief description"}
  ]
}

IMPORTANT:
- Extract information ONLY from the transcript. Include all Arabic with full tashkeel.
- If a section has no relevant content, use empty array [].
- Use camelCase for all JSON keys.`;

const REVERTS_TEMPLATE_PROMPT = `You are Talbiyah Insights – Reverts Class Generator.
Transform the class transcript into a supportive, practical study guide for new Muslims.

Generate a JSON response with the following EXACT structure (use camelCase keys):
{
  "topicSummary": "2-3 sentence overview of topics covered",
  "keyConcepts": [
    {
      "concept": "Islamic concept name",
      "explanation": "Simple, clear explanation",
      "importance": "Why this matters in daily life",
      "arabicTerm": "Arabic term if applicable",
      "transliteration": "Transliteration"
    }
  ],
  "practicalApplications": [
    {
      "topic": "Practical aspect",
      "howTo": "Step-by-step if applicable",
      "tips": "Helpful tips for implementation"
    }
  ],
  "questionsAnswered": [
    {
      "question": "Question asked in class",
      "answer": "Summary of the answer given",
      "additionalNotes": "Any extra context"
    }
  ],
  "quranReferences": [
    {
      "surah": "Surah name",
      "ayah": "Verse number(s)",
      "arabic": "Arabic text",
      "translation": "English translation",
      "context": "Why this was mentioned"
    }
  ],
  "hadithReferences": [
    {
      "text": "Hadith text or summary",
      "source": "Bukhari/Muslim/etc",
      "context": "Why this was mentioned"
    }
  ],
  "actionItems": [
    {
      "action": "Specific action to take",
      "frequency": "daily/weekly/as needed",
      "tips": "How to implement"
    }
  ],
  "recommendedReading": [
    {
      "title": "Book/article title",
      "author": "Author if known",
      "description": "What it covers"
    }
  ],
  "encouragementNote": "A warm, supportive closing message"
}

IMPORTANT:
- This is for NEW MUSLIMS - be gentle, supportive, and avoid overwhelming with too much info.
- Extract information ONLY from the transcript. Be encouraging and welcoming in tone.
- If a section has no relevant content, use empty array [].
- Use camelCase for all JSON keys.`;

// ====================
// PDF GENERATION HTML TEMPLATE
// ====================

function generatePDFHTML(data: any, templateType: string, metadata: any): string {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  let contentHTML = '';

  if (templateType === 'quran') {
    contentHTML = generateQuranContent(data);
  } else if (templateType === 'arabic') {
    contentHTML = generateArabicContent(data);
  } else if (templateType === 'reverts') {
    contentHTML = generateRevertsContent(data);
  }

  return `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata.title} - Talbiyah Insights</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.6;
      padding: 40px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
      padding: 32px;
      color: white;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .logo-icon {
      width: 48px;
      height: 48px;
      background: rgba(255,255,255,0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .logo-text {
      font-size: 24px;
      font-weight: 700;
    }

    .title {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .subtitle {
      font-size: 14px;
      opacity: 0.9;
    }

    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      padding: 20px 32px;
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .meta-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .meta-value {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }

    .content {
      padding: 32px;
    }

    .section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #0891b2;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e0f2fe;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-icon {
      font-size: 20px;
    }

    .summary-box {
      background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%);
      padding: 20px;
      border-radius: 12px;
      border-left: 4px solid #0891b2;
      font-size: 15px;
      color: #134e4a;
    }

    .card-grid {
      display: grid;
      gap: 12px;
    }

    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
    }

    .card-title {
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 8px;
    }

    .card-content {
      font-size: 14px;
      color: #475569;
    }

    .arabic-text {
      font-family: 'Amiri', serif;
      font-size: 20px;
      direction: rtl;
      text-align: right;
      color: #0f172a;
      line-height: 2;
    }

    .transliteration {
      font-style: italic;
      color: #64748b;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }

    th {
      background: #0891b2;
      color: white;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    td {
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    .bullet-list {
      list-style: none;
      padding: 0;
    }

    .bullet-list li {
      padding: 8px 0 8px 28px;
      position: relative;
      font-size: 14px;
      color: #334155;
    }

    .bullet-list li::before {
      content: "\\2713";
      position: absolute;
      left: 0;
      color: #0891b2;
      font-weight: bold;
    }

    .quiz-box {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 12px;
    }

    .quiz-question {
      font-weight: 600;
      color: #92400e;
      margin-bottom: 8px;
    }

    .quiz-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .quiz-option {
      padding: 8px 12px;
      background: white;
      border-radius: 6px;
      font-size: 13px;
    }

    .quiz-option.correct {
      background: #dcfce7;
      border: 1px solid #22c55e;
      color: #166534;
    }

    .homework-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: #f0fdf4;
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .homework-icon {
      width: 24px;
      height: 24px;
      background: #22c55e;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      flex-shrink: 0;
    }

    .encouragement {
      background: linear-gradient(135deg, #fdf4ff 0%, #f0fdfa 100%);
      padding: 24px;
      border-radius: 12px;
      text-align: center;
      border: 1px solid #e9d5ff;
    }

    .encouragement-text {
      font-size: 16px;
      color: #581c87;
      font-style: italic;
    }

    .footer {
      background: #1e293b;
      color: white;
      padding: 24px 32px;
      text-align: center;
    }

    .footer-text {
      font-size: 12px;
      opacity: 0.7;
      margin-bottom: 8px;
    }

    .footer-brand {
      font-size: 14px;
      font-weight: 600;
    }

    @media print {
      body {
        padding: 0;
        background: white;
      }
      .container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">&#127770;</div>
        <div class="logo-text">Talbiyah.ai</div>
      </div>
      <h1 class="title">${metadata.title}</h1>
      <p class="subtitle">${getTemplateSubtitle(templateType)}</p>
    </div>

    <div class="meta-bar">
      <div class="meta-item">
        <span class="meta-label">Teacher</span>
        <span class="meta-value">${metadata.teacher_name}</span>
      </div>
      ${metadata.student_name ? `
      <div class="meta-item">
        <span class="meta-label">Student</span>
        <span class="meta-value">${metadata.student_name}</span>
      </div>` : ''}
      <div class="meta-item">
        <span class="meta-label">Date</span>
        <span class="meta-value">${formatDate(metadata.lesson_date)}</span>
      </div>
      ${metadata.duration_minutes ? `
      <div class="meta-item">
        <span class="meta-label">Duration</span>
        <span class="meta-value">${metadata.duration_minutes} minutes</span>
      </div>` : ''}
    </div>

    <div class="content">
      ${contentHTML}
    </div>

    <div class="footer">
      <p class="footer-text">Generated by Talbiyah.ai - Your Islamic Learning Companion</p>
      <p class="footer-brand">www.talbiyah.ai</p>
    </div>
  </div>
</body>
</html>
`;
}

function getTemplateSubtitle(type: string): string {
  switch (type) {
    case 'quran': return 'Qur\'an Lesson Insights - Tadabbur & Understanding';
    case 'arabic': return 'Arabic Language - Vocabulary, Grammar & Practice';
    case 'reverts': return 'New Muslim Class - Practical Islam & Guidance';
    default: return 'Lesson Insights';
  }
}

function generateQuranContent(data: any): string {
  let html = '';

  // Lesson Summary (handle both camelCase and snake_case)
  const lessonSummary = data.lessonSummary || data.lesson_summary;
  if (lessonSummary) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128218;</span> Lesson Summary</h2>
      <div class="summary-box">${lessonSummary}</div>
    </div>`;
  }

  // Verses Covered
  const versesCovered = data.versesCovered || data.verses_covered;
  if (versesCovered && (versesCovered.surah || versesCovered.ayahRange || versesCovered.ayah_range)) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128366;</span> Verses Covered</h2>
      <div class="card">
        <div class="card-title">Surah ${versesCovered.surah || 'N/A'}</div>
        <div class="card-content">Ayat: ${versesCovered.ayahRange || versesCovered.ayah_range || 'N/A'}</div>
      </div>
    </div>`;
  }

  // Tajweed Points
  const tajweedPoints = data.tajweedPoints || data.tajweed_points;
  if (tajweedPoints && tajweedPoints.length > 0) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#127908;</span> Tajweed Points</h2>
      <div class="card-grid">
        ${tajweedPoints.map((t: any) => `
          <div class="card">
            <div class="card-title">${t.rule}</div>
            <div class="card-content">${t.explanation}</div>
            ${t.examples && t.examples.length > 0 ? `
              <div class="arabic-text" style="margin-top: 8px; font-size: 24px;">${t.examples.join(' | ')}</div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  // Vocabulary
  if (data.vocabulary && data.vocabulary.length > 0) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128220;</span> Key Vocabulary</h2>
      <table>
        <tr>
          <th style="text-align: right;">Arabic</th>
          <th>Transliteration</th>
          <th>Meaning</th>
          <th>Root</th>
        </tr>
        ${data.vocabulary.map((v: any) => `
          <tr>
            <td class="arabic-text" style="font-size: 22px;">${v.arabic}</td>
            <td class="transliteration">${v.transliteration}</td>
            <td>${v.meaning}</td>
            <td>${v.root || '-'}</td>
          </tr>
        `).join('')}
      </table>
    </div>`;
  }

  // Tafsir Points
  const tafsirPoints = data.tafsirPoints || data.tafsir_points;
  if (tafsirPoints && tafsirPoints.length > 0) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128161;</span> Key Tafsir Points</h2>
      <ul class="bullet-list">
        ${tafsirPoints.map((t: any) => `<li>${typeof t === 'string' ? t : t.point || t}</li>`).join('')}
      </ul>
    </div>`;
  }

  // Memorisation Progress
  const memorizationProgress = data.memorizationProgress || data.memorization_progress;
  if (memorizationProgress) {
    const versesReviewed = memorizationProgress.versesReviewed || memorizationProgress.verses_reviewed;
    const newVerses = memorizationProgress.newVerses || memorizationProgress.new_verses;
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128200;</span> Memorisation Progress</h2>
      <div class="card-grid">
        <div class="card">
          <div class="card-title">Verses Reviewed</div>
          <div class="card-content">${versesReviewed || 'N/A'}</div>
        </div>
        <div class="card">
          <div class="card-title">New Verses</div>
          <div class="card-content">${newVerses || 'N/A'}</div>
        </div>
        ${memorizationProgress.notes ? `
        <div class="card">
          <div class="card-title">Teacher Notes</div>
          <div class="card-content">${memorizationProgress.notes}</div>
        </div>` : ''}
      </div>
    </div>`;
  }

  // Practice Recommendations
  const practiceRecommendations = data.practiceRecommendations || data.practice_recommendations;
  if (practiceRecommendations && practiceRecommendations.length > 0) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128221;</span> Practice Recommendations</h2>
      ${practiceRecommendations.map((p: string, i: number) => `
        <div class="homework-item">
          <div class="homework-icon">${i + 1}</div>
          <div>${p}</div>
        </div>
      `).join('')}
    </div>`;
  }

  // Next Lesson Preview
  const nextLessonPreview = data.nextLessonPreview || data.next_lesson_preview;
  if (nextLessonPreview) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#10145;</span> Next Lesson Preview</h2>
      <div class="summary-box">${nextLessonPreview}</div>
    </div>`;
  }

  return html;
}

function generateArabicContent(data: any): string {
  let html = '';

  // Lesson Summary (handle both camelCase and snake_case)
  const lessonSummary = data.lessonSummary || data.lesson_summary;
  if (lessonSummary) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128218;</span> Lesson Summary</h2>
      <div class="summary-box">${lessonSummary}</div>
    </div>`;
  }

  // Vocabulary Table (handle both formats)
  const vocabulary = data.vocabulary || data.vocabulary_table;
  if (vocabulary && vocabulary.length > 0) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128220;</span> Vocabulary</h2>
      <table>
        <tr>
          <th style="text-align: right;">Arabic</th>
          <th>Transliteration</th>
          <th>English</th>
          <th>Type</th>
        </tr>
        ${vocabulary.map((v: any) => `
          <tr>
            <td class="arabic-text" style="font-size: 22px;">${v.arabic}</td>
            <td class="transliteration">${v.transliteration}</td>
            <td>${v.english}</td>
            <td>${v.wordType || v.word_type || '-'}</td>
          </tr>
        `).join('')}
      </table>
      ${vocabulary.some((v: any) => v.exampleSentence || v.example_sentence) ? `
        <div style="margin-top: 16px;">
          <h4 style="color: #0891b2; margin-bottom: 8px;">Example Sentences:</h4>
          ${vocabulary.filter((v: any) => v.exampleSentence || v.example_sentence).map((v: any) => `
            <div style="margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 8px;">
              <div class="arabic-text" style="font-size: 20px; margin-bottom: 4px;">${v.exampleSentence || v.example_sentence}</div>
              <div style="font-size: 13px; color: #64748b;">${v.english}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>`;
  }

  // Grammar Points
  const grammarPoints = data.grammarPoints || data.grammar_points;
  if (grammarPoints && grammarPoints.length > 0) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128214;</span> Grammar Points</h2>
      <div class="card-grid">
        ${grammarPoints.map((g: any) => `
          <div class="card">
            <div class="card-title">${g.topic}</div>
            <div class="card-content">${g.explanation}</div>
            ${g.examples && g.examples.length > 0 ? `
              <div style="margin-top: 12px;">
                ${g.examples.map((ex: any) => `
                  <div style="margin-bottom: 8px;">
                    <div class="arabic-text" style="font-size: 20px;">${ex.arabic}</div>
                    <div style="font-size: 13px; color: #64748b;">${ex.english}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${g.commonMistakes || g.common_mistakes ? `<div style="margin-top: 8px; color: #dc2626; font-size: 13px;">⚠️ Common mistake: ${g.commonMistakes || g.common_mistakes}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  // Conversation Phrases
  const conversationPhrases = data.conversationPhrases || data.conversation_phrases;
  if (conversationPhrases && conversationPhrases.length > 0) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128172;</span> Conversation Phrases</h2>
      <div class="card-grid">
        ${conversationPhrases.map((c: any) => `
          <div class="card">
            <div class="arabic-text" style="font-size: 24px; margin-bottom: 8px;">${c.arabic}</div>
            <div class="transliteration" style="margin-bottom: 4px;">${c.transliteration}</div>
            <div class="card-content">${c.english}</div>
            ${c.context ? `<div style="font-size: 12px; color: #0891b2; margin-top: 8px;">💬 ${c.context}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  // Common Mistakes
  const commonMistakes = data.commonMistakes || data.common_mistakes;
  if (commonMistakes && commonMistakes.length > 0) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#9888;</span> Common Mistakes to Avoid</h2>
      <div class="card-grid">
        ${commonMistakes.map((m: any) => `
          <div class="card" style="border-left: 4px solid #ef4444;">
            <div style="color: #dc2626; font-weight: 600;">❌ ${m.mistake}</div>
            <div style="color: #16a34a; margin-top: 8px;">✅ ${m.correction}</div>
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  // Homework
  const homeworkExercises = data.homeworkExercises || data.homework_exercises;
  if (homeworkExercises && homeworkExercises.length > 0) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128221;</span> Homework Exercises</h2>
      ${homeworkExercises.map((h: any, i: number) => `
        <div class="homework-item">
          <div class="homework-icon">${i + 1}</div>
          <div>
            <div style="font-weight: 600;">${h.task}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Type: ${h.type}</div>
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  // Recommended Resources
  const recommendedResources = data.recommendedResources || data.recommended_resources;
  if (recommendedResources && recommendedResources.length > 0) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128279;</span> Recommended Resources</h2>
      <ul class="bullet-list">
        ${recommendedResources.map((r: any) => `<li><strong>${r.title}</strong> (${r.type})${r.description ? ` - ${r.description}` : ''}</li>`).join('')}
      </ul>
    </div>`;
  }

  return html;
}

function generateRevertsContent(data: any): string {
  let html = '';

  // Topic Summary (handle both camelCase and snake_case)
  const topicSummary = data.topicSummary || data.topic_summary;
  if (topicSummary) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128218;</span> Topic Summary</h2>
      <div class="summary-box">${topicSummary}</div>
    </div>`;
  }

  // Key Concepts
  const keyConcepts = data.keyConcepts || data.key_concepts;
  if (keyConcepts && keyConcepts.length > 0) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128161;</span> Key Islamic Concepts</h2>
      <div class="card-grid">
        ${keyConcepts.map((c: any) => `
          <div class="card">
            <div class="card-title">${c.concept}</div>
            ${c.arabicTerm || c.arabic_term ? `
              <div style="margin-bottom: 8px;">
                <span class="arabic-text" style="font-size: 22px;">${c.arabicTerm || c.arabic_term}</span>
                <span class="transliteration"> (${c.transliteration})</span>
              </div>
            ` : ''}
            <div class="card-content">${c.explanation}</div>
            ${c.importance ? `<div style="margin-top: 8px; font-size: 13px; color: #0891b2;"><strong>Why it matters:</strong> ${c.importance}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  // Practical Applications
  const practicalApplications = data.practicalApplications || data.practical_applications;
  if (practicalApplications && practicalApplications.length > 0) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128736;</span> Practical Applications</h2>
      <div class="card-grid">
        ${practicalApplications.map((p: any) => `
          <div class="card">
            <div class="card-title">${p.topic}</div>
            ${p.howTo || p.how_to ? `<div class="card-content"><strong>How to:</strong> ${p.howTo || p.how_to}</div>` : ''}
            ${p.tips ? `<div style="margin-top: 8px; font-size: 13px; color: #16a34a;">💡 ${p.tips}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  // Questions Answered
  const questionsAnswered = data.questionsAnswered || data.questions_answered;
  if (questionsAnswered && questionsAnswered.length > 0) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#10067;</span> Questions Answered</h2>
      <div class="card-grid">
        ${questionsAnswered.map((q: any) => `
          <div class="card">
            <div class="card-title" style="color: #7c3aed;">Q: ${q.question}</div>
            <div class="card-content" style="margin-top: 12px;"><strong>A:</strong> ${q.answer}</div>
            ${q.additionalNotes || q.additional_notes ? `<div style="margin-top: 8px; font-size: 13px; color: #64748b; font-style: italic;">${q.additionalNotes || q.additional_notes}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  // Quran References
  const quranReferences = data.quranReferences || data.quran_references;
  if (quranReferences && quranReferences.length > 0) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128366;</span> Qur'an References</h2>
      <div class="card-grid">
        ${quranReferences.map((r: any) => `
          <div class="card" style="border-left: 4px solid #0891b2;">
            <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">Surah ${r.surah}, Ayah ${r.ayah}</div>
            ${r.arabic ? `<div class="arabic-text" style="font-size: 24px; margin-bottom: 8px;">${r.arabic}</div>` : ''}
            <div class="card-content">"${r.translation}"</div>
            ${r.context ? `<div style="margin-top: 8px; font-size: 13px; color: #0891b2;">${r.context}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  // Hadith References
  const hadithReferences = data.hadithReferences || data.hadith_references;
  if (hadithReferences && hadithReferences.length > 0) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128216;</span> Hadith References</h2>
      <div class="card-grid">
        ${hadithReferences.map((h: any) => `
          <div class="card" style="border-left: 4px solid #22c55e;">
            <div class="card-content">"${h.text}"</div>
            <div style="margin-top: 8px; font-size: 12px; color: #64748b;">Source: ${h.source}</div>
            ${h.context ? `<div style="margin-top: 4px; font-size: 13px; color: #22c55e;">${h.context}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  // Action Items
  const actionItems = data.actionItems || data.action_items;
  if (actionItems && actionItems.length > 0) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#127919;</span> Action Items for This Week</h2>
      ${actionItems.map((a: any, i: number) => `
        <div class="homework-item">
          <div class="homework-icon">${i + 1}</div>
          <div>
            <div style="font-weight: 600;">${a.action}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${a.frequency}</div>
            ${a.tips ? `<div style="font-size: 13px; color: #16a34a; margin-top: 4px;">Tip: ${a.tips}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  // Recommended Reading
  const recommendedReading = data.recommendedReading || data.recommended_reading;
  if (recommendedReading && recommendedReading.length > 0) {
    html += `
    <div class="section">
      <h2 class="section-title"><span class="section-icon">&#128214;</span> Recommended Reading</h2>
      <ul class="bullet-list">
        ${recommendedReading.map((r: any) => `
          <li><strong>${r.title}</strong>${r.author ? ` by ${r.author}` : ''}${r.description ? ` - ${r.description}` : ''}</li>
        `).join('')}
      </ul>
    </div>`;
  }

  // Encouragement Note
  const encouragementNote = data.encouragementNote || data.encouragement_note;
  if (encouragementNote) {
    html += `
    <div class="section">
      <div class="encouragement">
        <div class="encouragement-text">"${encouragementNote}"</div>
      </div>
    </div>`;
  }

  return html;
}

// ====================
// MAIN HANDLER
// ====================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const startTime = Date.now();

  try {
    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (!profile?.roles?.includes('admin')) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const requestData: GenerateInsightRequest = await req.json();
    const {
      template_type,
      title,
      teacher_name,
      student_name,
      lesson_date,
      duration_minutes,
      subject_tags,
      transcript
    } = requestData;

    if (!template_type || !title || !teacher_name || !lesson_date || !transcript) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get appropriate prompt
    let systemPrompt: string;
    switch (template_type) {
      case 'quran':
        systemPrompt = QURAN_TEMPLATE_PROMPT;
        break;
      case 'arabic':
        systemPrompt = ARABIC_TEMPLATE_PROMPT;
        break;
      case 'reverts':
        systemPrompt = REVERTS_TEMPLATE_PROMPT;
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid template type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: "Anthropic API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build user prompt
    const userPrompt = `Generate insights for this ${template_type} lesson.

LESSON METADATA:
- Title: ${title}
- Teacher: ${teacher_name}
${student_name ? `- Student: ${student_name}` : ''}
- Date: ${lesson_date}
${duration_minutes ? `- Duration: ${duration_minutes} minutes` : ''}
${subject_tags && subject_tags.length > 0 ? `- Topics: ${subject_tags.join(', ')}` : ''}

TRANSCRIPT:
${transcript}

Generate a JSON response following the exact structure in the system prompt. Extract information ONLY from the transcript provided.`;

    console.log(`Calling Claude API for ${template_type} insights...`);

    const response = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8192,
          temperature: 0.3,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate insights", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const generatedText = data.content?.[0]?.text;

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: "No response generated from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse JSON from response
    let generatedContent: any;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : generatedText.trim();
      generatedContent = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // Try to salvage by returning raw text
      generatedContent = { raw_content: generatedText };
    }

    // Generate PDF HTML
    const pdfHTML = generatePDFHTML(generatedContent, template_type, {
      title,
      teacher_name,
      student_name,
      lesson_date,
      duration_minutes
    });

    // Save to database
    const processingTime = Date.now() - startTime;

    const { data: savedInsight, error: insertError } = await supabase
      .from('admin_generated_insights')
      .insert({
        template_type,
        title,
        teacher_name,
        student_name,
        lesson_date,
        duration_minutes,
        subject_tags,
        transcript,
        generated_content: generatedContent,
        created_by: user.id
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save insights", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Insights generated and saved:", savedInsight.id);

    return new Response(
      JSON.stringify({
        success: true,
        insight_id: savedInsight.id,
        generated_content: generatedContent,
        html_content: pdfHTML,
        processing_time_ms: processingTime
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating admin insight:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
