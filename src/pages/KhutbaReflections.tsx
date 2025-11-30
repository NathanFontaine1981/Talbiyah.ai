import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Loader2,
  Sparkles,
  RefreshCw,
  Mic,
  MicOff,
  Square,
  FileText,
  BookOpen,
  Target,
  Brain,
  MessageCircle,
  Copy,
  Check,
  Download,
  Lightbulb,
  Key,
  ListChecks,
  Clock,
  AlertCircle,
  ScrollText,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  ClipboardList,
  HelpCircle,
  Bookmark,
  PenLine,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Calendar,
  User,
  MapPin,
  Save,
  Library,
  Lock
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { generateTalbiyahInsightsPDF } from '../utils/generateInsightsPDF';

interface KhutbaStudyNotes {
  title: string;
  speaker?: string;
  cleaned_transcript: string;
  main_points: Array<{
    point: string;
    reflection: string;
  }>;
  quranic_words_phrases: Array<{
    arabic: string;
    transliteration: string;
    meaning: string;
    context: string;
    quran_reference?: string;
  }>;
  key_vocabulary: Array<{
    term: string;
    arabic?: string;
    definition: string;
  }>;
  key_themes: Array<{
    theme: string;
    explanation: string;
  }>;
  quran_references: Array<{
    arabic?: string;
    translation: string;
    reference: string;
    reflection: string;
  }>;
  hadith_references: Array<{
    arabic?: string;
    translation: string;
    reference: string;
    reflection: string;
  }>;
  action_items: Array<{
    action: string;
    how_to: string;
  }>;
  memory_aids: Array<{
    concept: string;
    memory_tip: string;
  }>;
  quiz: {
    multiple_choice: Array<{
      question: string;
      options: string[];
      correct_answer: string;
      explanation: string;
    }>;
    short_answer: Array<{
      question: string;
      suggested_answer: string;
    }>;
    reflection: string[];
  };
  homework: Array<{
    task: string;
    description: string;
    duration: string;
  }>;
  summary_for_children: string;
  summary_for_teens: string;
  family_discussion_guide: string[];
  timestamp: Date;
}

export default function KhutbaReflections() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [studyNotes, setStudyNotes] = useState<KhutbaStudyNotes | null>(null);
  const [copied, setCopied] = useState(false);
  const [transcriptExpanded, setTranscriptExpanded] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [showQuizAnswers, setShowQuizAnswers] = useState(false);
  const [showShortAnswers, setShowShortAnswers] = useState<Record<number, boolean>>({});

  // Admin and user state
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Metadata fields
  const [khutbaDate, setKhutbaDate] = useState(new Date().toISOString().split('T')[0]);
  const [speakerName, setSpeakerName] = useState('');
  const [location, setLocation] = useState('');

  // Save state
  const [saving, setSaving] = useState(false);
  const [savedInsightId, setSavedInsightId] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const studyNotesRef = useRef<HTMLDivElement>(null);

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          setIsAdmin(profile?.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAdmin();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);
      setTranscriptionError(null);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please ensure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setTranscribing(true);
    setTranscriptionError(null);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      const { data: { user } } = await supabase.auth.getUser();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            audio: base64Audio,
            user_id: user?.id || null
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to transcribe audio');
      }

      const result = await response.json();
      setInputText(prev => prev ? `${prev}\n\n${result.transcription}` : result.transcription);
      setAudioBlob(null);

    } catch (error: any) {
      console.error('Error transcribing audio:', error);
      setTranscriptionError(error.message || 'Failed to transcribe audio');
    } finally {
      setTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  async function generateStudyNotes() {
    if (!inputText.trim() || loading) return;

    setLoading(true);
    setStudyNotes(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-khutba`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            khutba_text: inputText,
            user_id: user?.id || null
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze khutba');
      }

      const result = await response.json();

      setStudyNotes({
        ...result,
        timestamp: new Date()
      });

      setTimeout(() => {
        studyNotesRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error: any) {
      console.error('Error generating study notes:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  const copyStudyNotes = async () => {
    if (!studyNotes) return;

    let text = `# ${studyNotes.title}\n`;
    if (studyNotes.speaker) {
      text += `By ${studyNotes.speaker}\n`;
    }
    text += `\n`;

    if (studyNotes.cleaned_transcript) {
      text += `## Full Khutbah (Cleaned Up)\n${studyNotes.cleaned_transcript}\n\n`;
      text += `---\n\n`;
    }

    if (studyNotes.main_points?.length > 0) {
      text += `## Main Points to Reflect Upon\n`;
      studyNotes.main_points.forEach((p, i) => {
        text += `${i + 1}. **${p.point}**\n   ${p.reflection}\n`;
      });
      text += `\n`;
    }

    if (studyNotes.quranic_words_phrases?.length > 0) {
      text += `## Key Quranic Words & Phrases\n`;
      studyNotes.quranic_words_phrases.forEach(w => {
        text += `- **${w.arabic}** (${w.transliteration}): ${w.meaning}\n`;
        text += `  Context: ${w.context}\n`;
        if (w.quran_reference) text += `  Reference: ${w.quran_reference}\n`;
      });
      text += `\n`;
    }

    if (studyNotes.key_vocabulary?.length > 0) {
      text += `## Arabic Vocabulary\n`;
      studyNotes.key_vocabulary.forEach(v => {
        text += `- **${v.term}**${v.arabic ? ` (${v.arabic})` : ''}: ${v.definition}\n`;
      });
      text += `\n`;
    }

    if (studyNotes.key_themes?.length > 0) {
      text += `## Key Themes\n`;
      studyNotes.key_themes.forEach(t => {
        text += `- **${t.theme}**: ${t.explanation}\n`;
      });
      text += `\n`;
    }

    if (studyNotes.quran_references?.length > 0) {
      text += `## Quran to Reflect Upon\n`;
      studyNotes.quran_references.forEach(r => {
        if (r.arabic) text += `${r.arabic}\n`;
        text += `"${r.translation}" (${r.reference})\n`;
        text += `Reflection: ${r.reflection}\n\n`;
      });
    }

    if (studyNotes.hadith_references?.length > 0) {
      text += `## Hadith to Reflect Upon\n`;
      studyNotes.hadith_references.forEach(r => {
        if (r.arabic) text += `${r.arabic}\n`;
        text += `"${r.translation}" (${r.reference})\n`;
        text += `Reflection: ${r.reflection}\n\n`;
      });
    }

    if (studyNotes.action_items?.length > 0) {
      text += `## Action Items\n`;
      studyNotes.action_items.forEach((a, i) => {
        text += `${i + 1}. **${a.action}**\n   How: ${a.how_to}\n`;
      });
      text += `\n`;
    }

    if (studyNotes.memory_aids?.length > 0) {
      text += `## Memory Aids\n`;
      studyNotes.memory_aids.forEach(m => {
        text += `- **${m.concept}**: ${m.memory_tip}\n`;
      });
      text += `\n`;
    }

    if (studyNotes.quiz) {
      text += `## Comprehensive Quiz\n\n`;
      if (studyNotes.quiz.multiple_choice?.length > 0) {
        text += `### Multiple Choice\n`;
        studyNotes.quiz.multiple_choice.forEach((q, i) => {
          text += `${i + 1}. ${q.question}\n`;
          q.options.forEach(opt => text += `   ${opt}\n`);
          text += `   Answer: ${q.correct_answer} - ${q.explanation}\n\n`;
        });
      }
      if (studyNotes.quiz.short_answer?.length > 0) {
        text += `### Short Answer\n`;
        studyNotes.quiz.short_answer.forEach((q, i) => {
          text += `${i + 1}. ${q.question}\n`;
          text += `   Suggested answer: ${q.suggested_answer}\n\n`;
        });
      }
      if (studyNotes.quiz.reflection?.length > 0) {
        text += `### Reflection Questions\n`;
        studyNotes.quiz.reflection.forEach((q, i) => {
          text += `${i + 1}. ${q}\n`;
        });
        text += `\n`;
      }
    }

    if (studyNotes.homework?.length > 0) {
      text += `## Homework Assignments\n`;
      studyNotes.homework.forEach((hw, i) => {
        text += `${i + 1}. **${hw.task}** (${hw.duration})\n`;
        text += `   ${hw.description}\n`;
      });
      text += `\n`;
    }

    text += `## For Children (5-10)\n${studyNotes.summary_for_children}\n\n`;
    text += `## For Teens (11-17)\n${studyNotes.summary_for_teens}\n\n`;

    if (studyNotes.family_discussion_guide?.length > 0) {
      text += `## Family Discussion Guide\n`;
      studyNotes.family_discussion_guide.forEach((q, i) => {
        text += `${i + 1}. ${q}\n`;
      });
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save insights to database via Edge Function
  const saveInsights = async () => {
    if (!studyNotes || !isAdmin) return;

    setSaving(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-khutba-insights`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: studyNotes.title,
            speaker: speakerName || studyNotes.speaker || null,
            location: location || null,
            khutba_date: khutbaDate || null,
            original_text: inputText,
            insights: studyNotes,
            user_id: userId
          })
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to save');
      }

      setSavedInsightId(result.id);
      alert('Talbiyah Insights saved successfully! It is now available in the library for all users.');
    } catch (error: any) {
      console.error('Error saving insights:', error);
      alert(`Error saving: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Download as PDF
  const handleDownloadPDF = async () => {
    if (!studyNotes) return;

    setDownloadingPDF(true);
    try {
      await generateTalbiyahInsightsPDF({
        ...studyNotes,
        speaker: speakerName || studyNotes.speaker,
        khutba_date: khutbaDate,
        location: location
      });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Show loading state while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  // Redirect non-admins to the library page
  if (!isAdmin) {
    navigate('/insights-library');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Talbiyah Insights</h1>
                <p className="text-xs text-slate-400">Record, Transcribe, Study</p>
              </div>
            </div>

            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Turn Any Khutbah Into Talbiyah Insights
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Record the khutbah, transcribe it, and receive comprehensive study materials including
            Quranic vocabulary, hadith, quizzes, homework, and family discussion guides.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 mb-8">

          {/* Audio Recording Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Mic className="w-5 h-5 mr-2 text-amber-400" />
              Record Khutbah Audio
            </h3>

            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
              {!isRecording && !audioBlob && (
                <div className="text-center">
                  <button
                    onClick={startRecording}
                    className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 rounded-full flex items-center justify-center mx-auto transition shadow-lg shadow-red-500/30"
                  >
                    <Mic className="w-10 h-10 text-white" />
                  </button>
                  <p className="text-slate-400 mt-4">Click to start recording</p>
                  <p className="text-slate-500 text-sm mt-1">Make sure you're in a quiet environment</p>
                </div>
              )}

              {isRecording && (
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                    <button
                      onClick={stopRecording}
                      className="relative w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center transition"
                    >
                      <Square className="w-8 h-8 text-white" />
                    </button>
                  </div>
                  <p className="text-2xl font-mono text-red-400 mb-2">{formatTime(recordingTime)}</p>
                  <p className="text-slate-400">Recording... Click to stop</p>
                </div>
              )}

              {audioBlob && !transcribing && (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">Recording Complete</p>
                      <p className="text-slate-400 text-sm">{formatTime(recordingTime)} recorded</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-3">
                    <button
                      onClick={transcribeAudio}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-lg font-semibold transition flex items-center space-x-2"
                    >
                      <FileText className="w-5 h-5" />
                      <span>Transcribe Audio</span>
                    </button>
                    <button
                      onClick={() => {
                        setAudioBlob(null);
                        setRecordingTime(0);
                      }}
                      className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {transcribing && (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
                  <p className="text-white font-medium mb-1">Transcribing Audio...</p>
                  <p className="text-slate-400 text-sm">This may take a minute for longer recordings</p>
                </div>
              )}

              {transcriptionError && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-medium">Transcription Failed</p>
                    <p className="text-red-300/70 text-sm">{transcriptionError}</p>
                    <button
                      onClick={transcribeAudio}
                      className="mt-2 text-red-400 hover:text-red-300 text-sm underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center my-8">
            <div className="flex-1 border-t border-slate-700"></div>
            <span className="px-4 text-slate-500 text-sm">OR paste text directly</span>
            <div className="flex-1 border-t border-slate-700"></div>
          </div>

          {/* Metadata Fields */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-emerald-400" />
              Khutbah Details
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date of Khutbah
                </label>
                <input
                  type="date"
                  value={khutbaDate}
                  onChange={(e) => setKhutbaDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Speaker / Imam
                </label>
                <input
                  type="text"
                  value={speakerName}
                  onChange={(e) => setSpeakerName(e.target.value)}
                  placeholder="e.g., Sheikh Mustapha Shaybani"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location / Mosque
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Al-Azhar Mosque, Cairo"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Text Input */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-cyan-400" />
              Khutbah Text / Notes
            </h3>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste the khutbah transcription here, or type your notes from the khutbah. The more detail you provide, the better the study notes will be..."
              disabled={loading}
              rows={10}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-y disabled:opacity-50 font-mono text-sm"
            />
            <p className="text-slate-500 text-sm mt-2">
              {inputText.length} characters • {inputText.split(/\s+/).filter(Boolean).length} words
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateStudyNotes}
            disabled={!inputText.trim() || loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Creating Talbiyah Insights...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                <span>Generate Talbiyah Insights</span>
              </>
            )}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 mb-8 text-center">
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-white mb-2">Creating Your Talbiyah Insights</h3>
            <p className="text-slate-400">Extracting Quranic vocabulary, hadith, creating quizzes and homework...</p>
            <p className="text-slate-500 text-sm mt-2">This may take 30-60 seconds</p>
          </div>
        )}

        {/* Generated Study Notes */}
        {studyNotes && (
          <div ref={studyNotesRef} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-amber-500/30 rounded-2xl overflow-hidden mb-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-600/20 px-8 py-6 border-b border-amber-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-amber-400 text-sm font-medium mb-1">Talbiyah Insights</p>
                  <h3 className="text-2xl font-bold text-white">{studyNotes.title}</h3>
                  {studyNotes.speaker && (
                    <p className="text-cyan-400 text-sm mt-1">By {studyNotes.speaker}</p>
                  )}
                  <p className="text-slate-400 text-sm mt-1">
                    {studyNotes.timestamp.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-lg transition disabled:opacity-50"
                  >
                    {downloadingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>{downloadingPDF ? 'Generating...' : 'PDF'}</span>
                  </button>
                  <button
                    onClick={saveInsights}
                    disabled={saving || !!savedInsightId}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                      savedInsightId
                        ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white'
                    } disabled:opacity-50`}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedInsightId ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    <span>{savedInsightId ? 'Saved!' : saving ? 'Saving...' : 'Save to Library'}</span>
                  </button>
                  <button
                    onClick={copyStudyNotes}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-700/80 hover:bg-slate-600/80 text-white rounded-lg transition"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => generateStudyNotes()}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-700/80 hover:bg-slate-600/80 text-slate-300 rounded-lg transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">

              {/* Cleaned Transcript */}
              {studyNotes.cleaned_transcript && (
                <div>
                  <button
                    onClick={() => setTranscriptExpanded(!transcriptExpanded)}
                    className="w-full flex items-center justify-between text-left mb-4"
                  >
                    <h4 className="text-lg font-semibold text-white flex items-center">
                      <ScrollText className="w-5 h-5 mr-2 text-emerald-400" />
                      Full Khutbah (Cleaned Up)
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 text-sm">
                        {transcriptExpanded ? 'Collapse' : 'Expand'}
                      </span>
                      {transcriptExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {transcriptExpanded && (
                    <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 rounded-xl p-6">
                      <div className="prose prose-invert prose-emerald max-w-none">
                        {studyNotes.cleaned_transcript.split('\n\n').map((paragraph, idx) => (
                          <p key={idx} className="text-slate-200 leading-relaxed mb-4 last:mb-0">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="flex items-center my-8">
                    <div className="flex-1 border-t border-slate-700"></div>
                    <span className="px-4 text-slate-500 text-sm font-medium">STUDY NOTES</span>
                    <div className="flex-1 border-t border-slate-700"></div>
                  </div>
                </div>
              )}

              {/* Main Points to Reflect Upon */}
              {studyNotes.main_points && studyNotes.main_points.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Bookmark className="w-5 h-5 mr-2 text-amber-400" />
                    Main Points to Reflect Upon
                  </h4>
                  <div className="space-y-3">
                    {studyNotes.main_points.map((item, idx) => (
                      <div key={idx} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                        <h5 className="text-amber-400 font-semibold mb-2 flex items-center">
                          <span className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mr-2 text-white text-sm">
                            {idx + 1}
                          </span>
                          {item.point}
                        </h5>
                        <p className="text-slate-300 text-sm ml-8">{item.reflection}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quranic Words & Phrases */}
              {studyNotes.quranic_words_phrases && studyNotes.quranic_words_phrases.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-emerald-400" />
                    Key Quranic Words & Phrases
                  </h4>
                  <div className="space-y-4">
                    {studyNotes.quranic_words_phrases.map((item, idx) => (
                      <div key={idx} className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                          <p className="text-2xl md:text-3xl text-white font-arabic leading-relaxed" dir="rtl">
                            {item.arabic}
                          </p>
                          <span className="text-emerald-400 font-medium text-sm mt-2 md:mt-0">{item.transliteration}</span>
                        </div>
                        <p className="text-slate-200 font-medium mb-2">{item.meaning}</p>
                        <p className="text-slate-400 text-sm mb-2">
                          <span className="text-slate-500">Context:</span> {item.context}
                        </p>
                        {item.quran_reference && (
                          <p className="text-emerald-400 text-sm font-medium">{item.quran_reference}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Vocabulary */}
              {studyNotes.key_vocabulary && studyNotes.key_vocabulary.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Key className="w-5 h-5 mr-2 text-purple-400" />
                    Arabic Vocabulary
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {studyNotes.key_vocabulary.map((vocab, idx) => (
                      <div key={idx} className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-purple-400 font-semibold">{vocab.term}</span>
                          {vocab.arabic && (
                            <span className="text-xl text-white font-arabic">{vocab.arabic}</span>
                          )}
                        </div>
                        <p className="text-slate-300 text-sm">{vocab.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Themes */}
              {studyNotes.key_themes && studyNotes.key_themes.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                    Key Themes
                  </h4>
                  <div className="grid gap-3">
                    {studyNotes.key_themes.map((theme, idx) => (
                      <div key={idx} className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                        <h5 className="text-yellow-400 font-semibold mb-1">{theme.theme}</h5>
                        <p className="text-slate-300 text-sm">{theme.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quran References */}
              {studyNotes.quran_references && studyNotes.quran_references.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Quran to Reflect Upon
                  </h4>
                  <div className="space-y-4">
                    {studyNotes.quran_references.map((ref, idx) => (
                      <div key={idx} className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
                        {ref.arabic && (
                          <p className="text-2xl md:text-3xl text-white font-arabic text-right mb-4 leading-relaxed" dir="rtl">
                            {ref.arabic}
                          </p>
                        )}
                        <p className="text-slate-200 italic mb-3">"{ref.translation}"</p>
                        <p className="text-emerald-400 font-medium text-sm mb-3">{ref.reference}</p>
                        <div className="bg-emerald-500/10 rounded-lg p-3">
                          <p className="text-slate-300 text-sm">
                            <span className="text-emerald-400 font-medium">Reflection:</span> {ref.reflection}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hadith References */}
              {studyNotes.hadith_references && studyNotes.hadith_references.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-amber-400 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Hadith to Reflect Upon
                  </h4>
                  <div className="space-y-4">
                    {studyNotes.hadith_references.map((ref, idx) => (
                      <div key={idx} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
                        {ref.arabic && (
                          <p className="text-2xl md:text-3xl text-white font-arabic text-right mb-4 leading-relaxed" dir="rtl">
                            {ref.arabic}
                          </p>
                        )}
                        <p className="text-slate-200 italic mb-3">"{ref.translation}"</p>
                        <p className="text-amber-400 font-medium text-sm mb-3">{ref.reference}</p>
                        <div className="bg-amber-500/10 rounded-lg p-3">
                          <p className="text-slate-300 text-sm">
                            <span className="text-amber-400 font-medium">Reflection:</span> {ref.reflection}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Items */}
              {studyNotes.action_items && studyNotes.action_items.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-red-400" />
                    Action Items
                  </h4>
                  <div className="space-y-3">
                    {studyNotes.action_items.map((item, idx) => (
                      <div key={idx} className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                        <h5 className="text-red-400 font-semibold mb-2 flex items-center">
                          <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-2 text-white text-sm">
                            {idx + 1}
                          </span>
                          {item.action}
                        </h5>
                        <p className="text-slate-300 text-sm ml-8">
                          <span className="text-slate-500">How:</span> {item.how_to}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Memory Aids */}
              {studyNotes.memory_aids && studyNotes.memory_aids.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-pink-400" />
                    Memory Aids
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {studyNotes.memory_aids.map((aid, idx) => (
                      <div key={idx} className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4">
                        <h5 className="text-pink-400 font-semibold mb-1">{aid.concept}</h5>
                        <p className="text-slate-300 text-sm">{aid.memory_tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comprehensive Quiz */}
              {studyNotes.quiz && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white flex items-center">
                      <GraduationCap className="w-5 h-5 mr-2 text-blue-400" />
                      Comprehensive Quiz
                    </h4>
                    <button
                      onClick={() => setShowQuizAnswers(!showQuizAnswers)}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition text-sm"
                    >
                      {showQuizAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{showQuizAnswers ? 'Hide Answers' : 'Show Answers'}</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Multiple Choice */}
                    {studyNotes.quiz.multiple_choice && studyNotes.quiz.multiple_choice.length > 0 && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                        <h5 className="text-blue-400 font-semibold mb-4 flex items-center">
                          <HelpCircle className="w-4 h-4 mr-2" />
                          Multiple Choice
                        </h5>
                        <div className="space-y-6">
                          {studyNotes.quiz.multiple_choice.map((q, idx) => (
                            <div key={idx} className="pb-4 border-b border-blue-500/20 last:border-0 last:pb-0">
                              <p className="text-slate-200 font-medium mb-3">
                                <span className="text-blue-400 mr-2">{idx + 1}.</span>
                                {q.question}
                              </p>
                              <div className="space-y-2 ml-6">
                                {q.options.map((option, optIdx) => {
                                  const optionLetter = option.charAt(0);
                                  const isCorrect = optionLetter === q.correct_answer;
                                  const isSelected = quizAnswers[idx] === optionLetter;
                                  return (
                                    <button
                                      key={optIdx}
                                      onClick={() => setQuizAnswers({...quizAnswers, [idx]: optionLetter})}
                                      className={`w-full text-left px-4 py-2 rounded-lg transition flex items-center ${
                                        showQuizAnswers
                                          ? isCorrect
                                            ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                                            : isSelected && !isCorrect
                                            ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                                            : 'bg-slate-700/30 text-slate-400'
                                          : isSelected
                                          ? 'bg-blue-500/30 border border-blue-500/50 text-blue-300'
                                          : 'bg-slate-700/30 hover:bg-slate-700/50 text-slate-300'
                                      }`}
                                    >
                                      {showQuizAnswers && isCorrect && <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />}
                                      {showQuizAnswers && isSelected && !isCorrect && <XCircle className="w-4 h-4 mr-2 flex-shrink-0" />}
                                      <span>{option}</span>
                                    </button>
                                  );
                                })}
                              </div>
                              {showQuizAnswers && q.explanation && (
                                <div className="mt-3 ml-6 p-3 bg-emerald-500/10 rounded-lg">
                                  <p className="text-emerald-300 text-sm">
                                    <span className="font-medium">Explanation:</span> {q.explanation}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Short Answer */}
                    {studyNotes.quiz.short_answer && studyNotes.quiz.short_answer.length > 0 && (
                      <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-6">
                        <h5 className="text-violet-400 font-semibold mb-4 flex items-center">
                          <PenLine className="w-4 h-4 mr-2" />
                          Short Answer Questions
                        </h5>
                        <div className="space-y-4">
                          {studyNotes.quiz.short_answer.map((q, idx) => (
                            <div key={idx} className="pb-4 border-b border-violet-500/20 last:border-0 last:pb-0">
                              <p className="text-slate-200 font-medium mb-2">
                                <span className="text-violet-400 mr-2">{idx + 1}.</span>
                                {q.question}
                              </p>
                              <button
                                onClick={() => setShowShortAnswers({...showShortAnswers, [idx]: !showShortAnswers[idx]})}
                                className="text-violet-400 text-sm hover:text-violet-300 transition flex items-center"
                              >
                                {showShortAnswers[idx] ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                                {showShortAnswers[idx] ? 'Hide suggested answer' : 'Show suggested answer'}
                              </button>
                              {showShortAnswers[idx] && (
                                <div className="mt-2 p-3 bg-violet-500/10 rounded-lg">
                                  <p className="text-violet-300 text-sm">{q.suggested_answer}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reflection Questions */}
                    {studyNotes.quiz.reflection && studyNotes.quiz.reflection.length > 0 && (
                      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
                        <h5 className="text-cyan-400 font-semibold mb-4 flex items-center">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Deep Reflection Questions
                        </h5>
                        <ol className="space-y-3">
                          {studyNotes.quiz.reflection.map((q, idx) => (
                            <li key={idx} className="text-slate-200">
                              <span className="text-cyan-400 font-medium mr-2">{idx + 1}.</span>
                              {q}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Homework */}
              {studyNotes.homework && studyNotes.homework.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <ClipboardList className="w-5 h-5 mr-2 text-orange-400" />
                    Homework Assignments
                  </h4>
                  <div className="space-y-4">
                    {studyNotes.homework.map((hw, idx) => (
                      <div key={idx} className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="text-orange-400 font-semibold flex items-center">
                            <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-2 text-white text-sm">
                              {idx + 1}
                            </span>
                            {hw.task}
                          </h5>
                          <span className="text-orange-300/70 text-xs bg-orange-500/20 px-2 py-1 rounded">
                            {hw.duration}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm ml-8">{hw.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Age-Appropriate Summaries */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-cyan-400 mb-4">For Children (5-10)</h4>
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                    <p className="text-slate-200">{studyNotes.summary_for_children}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-violet-400 mb-4">For Teens (11-17)</h4>
                  <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
                    <p className="text-slate-200">{studyNotes.summary_for_teens}</p>
                  </div>
                </div>
              </div>

              {/* Family Discussion Guide */}
              {studyNotes.family_discussion_guide && studyNotes.family_discussion_guide.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-teal-400" />
                    Family Hour Discussion Guide
                  </h4>
                  <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-6">
                    <ol className="space-y-3">
                      {studyNotes.family_discussion_guide.map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mr-3 text-white text-sm font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-slate-200">{item}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-6 border-t border-slate-700/50 text-center">
                <p className="text-slate-600 text-xs">
                  Always consult qualified scholars for religious rulings
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Link to Khutba Creator */}
        <div className="bg-slate-800/30 border border-cyan-500/30 rounded-2xl p-6 text-center">
          <p className="text-slate-400 mb-3">Need to create a khutbah from scratch?</p>
          <button
            onClick={() => navigate('/khutba-creator')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-semibold transition"
          >
            Go to Khutbah Creator
          </button>
        </div>
      </main>
    </div>
  );
}
