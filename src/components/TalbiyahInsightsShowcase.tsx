import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, HelpCircle, Brain, ClipboardList, Lightbulb } from 'lucide-react';

interface InsightsShowcaseProps {
  courseType: 'quran' | 'arabic';
}

export default function TalbiyahInsightsShowcase({ courseType }: InsightsShowcaseProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('lessons');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const quranInsights = {
    lessons: {
      title: 'Key Lessons & Reflections',
      icon: FileText,
      color: 'emerald',
      content: [
        'The verse emphasizes divine mercy and compassion',
        'Context: Revealed during the early Meccan period',
        'Connection to previous verses about gratitude',
        'Practical application: Implementing patience in daily life'
      ]
    },
    questions: {
      title: 'Reflection Questions',
      icon: HelpCircle,
      color: 'blue',
      content: [
        'How does this verse relate to the concept of Tawakkul (reliance on Allah)?',
        'What are practical ways to embody the teachings in this passage?',
        'Can you identify similar themes in other surahs?',
        'How might this verse provide comfort during difficult times?'
      ]
    },
    quiz: {
      title: 'Interactive Quiz',
      icon: Brain,
      color: 'purple',
      content: [
        'Question 1: What is the main theme of this verse? (Multiple choice)',
        'Question 2: Which prophet is mentioned in the context?',
        'Question 3: Identify the grammatical structure (i\'rab)',
        'Question 4: What is the historical context of revelation?'
      ]
    },
    homework: {
      title: 'Homework & Practice Tasks',
      icon: ClipboardList,
      color: 'amber',
      content: [
        'Memorise verses 1-5 of the surah with proper Tajweed',
        'Practice recitation and record yourself for review',
        'Write a 200-word reflection on the main themes',
        'Research and document the tafsir from 3 different scholars',
        'Practice the vocabulary: Create flashcards for new Arabic words'
      ]
    },
    summary: {
      title: 'Summary Takeaway',
      icon: Lightbulb,
      color: 'cyan',
      content: [
        'This lesson covered the fundamental principles of divine mercy and human responsibility',
        'Key vocabulary: Rahman (Most Merciful), Sabr (Patience), Tawakkul (Trust)',
        'Tajweed focus: Proper pronunciation of heavy letters (ر، خ، غ)',
        'Next session preview: We will explore the continuation of this theme in the next verses'
      ]
    }
  };

  const arabicInsights = {
    lessons: {
      title: 'Key Lessons & Reflections',
      icon: FileText,
      color: 'blue',
      content: [
        'Mastered the present tense conjugation pattern (يَفْعَلُ)',
        'Learned 15 new verbs related to daily activities',
        'Practiced sentence construction with subject-verb agreement',
        'Connected grammar concepts to Quranic examples'
      ]
    },
    questions: {
      title: 'Reflection Questions',
      icon: HelpCircle,
      color: 'emerald',
      content: [
        'Can you identify the verb pattern (wazn) in these sentences?',
        'How does this grammatical structure appear in Quranic verses?',
        'What are the differences between classical and modern usage?',
        'How can you use these verbs in everyday conversation?'
      ]
    },
    quiz: {
      title: 'Interactive Quiz',
      icon: Brain,
      color: 'purple',
      content: [
        'Conjugate the verb "to write" (كتب) in present tense for all pronouns',
        'Translate: "The student reads the book" to Arabic',
        'Identify the root letters in: يَدْرُسُ، يَكْتُبُ، يَقْرَأُ',
        'Match vocabulary words with their English meanings (10 items)'
      ]
    },
    homework: {
      title: 'Homework & Practice Tasks',
      icon: ClipboardList,
      color: 'amber',
      content: [
        'Complete vocabulary worksheet: 20 new words with sentences',
        'Write 5 sentences using the verbs learned today',
        'Listen to the audio recording and repeat 10 times',
        'Create flashcards for new vocabulary (15 words)',
        'Practice writing Arabic script: 2 pages of handwriting exercises'
      ]
    },
    summary: {
      title: 'Summary Takeaway',
      icon: Lightbulb,
      color: 'cyan',
      content: [
        'Successfully covered present tense verb conjugation in Form I',
        'Vocabulary expansion: 15 new verbs, 20 new nouns',
        'Grammar milestone: Forming complete sentences with proper i\'rab',
        'Next session: We will learn past tense and continue building conversation skills'
      ]
    }
  };

  const insights = courseType === 'quran' ? quranInsights : arabicInsights;

  const colorClasses: Record<string, any> = {
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      icon: 'text-emerald-600',
      hover: 'hover:bg-emerald-100'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: 'text-blue-600',
      hover: 'hover:bg-blue-100'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      icon: 'text-purple-600',
      hover: 'hover:bg-purple-100'
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      icon: 'text-amber-600',
      hover: 'hover:bg-amber-100'
    },
    cyan: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      text: 'text-cyan-700',
      icon: 'text-emerald-600',
      hover: 'hover:bg-cyan-100'
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(insights).map(([key, section]) => {
        const Icon = section.icon;
        const colors = colorClasses[section.color];
        const isExpanded = expandedSection === key;

        return (
          <div
            key={key}
            className={`${colors.bg} border-2 ${colors.border} rounded-xl overflow-hidden transition-all duration-300`}
          >
            <button
              onClick={() => toggleSection(key)}
              className={`w-full px-6 py-4 flex items-center justify-between ${colors.hover} transition-colors`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${colors.bg} border ${colors.border} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <h3 className={`text-lg font-bold ${colors.text}`}>{section.title}</h3>
              </div>
              {isExpanded ? (
                <ChevronUp className={`w-5 h-5 ${colors.icon}`} />
              ) : (
                <ChevronDown className={`w-5 h-5 ${colors.icon}`} />
              )}
            </button>

            {isExpanded && (
              <div className="px-6 py-4 border-t-2 border-current" style={{ borderColor: colors.border.split('-')[1] }}>
                <ul className="space-y-3">
                  {section.content.map((item, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className={`${colors.text} font-bold text-sm mt-0.5`}>•</span>
                      <span className="text-gray-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
