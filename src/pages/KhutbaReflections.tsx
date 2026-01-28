import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Loader2,
  Sparkles,
  RefreshCw,
  Mic,
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
  Volume2,
  Pause,
  Play,
  X,
  Send,
  Mail,
  Users,
  Bell
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
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

  // Notification states (separate from saving)
  const [sendingToDashboards, setSendingToDashboards] = useState(false);
  const [sentToDashboards, setSentToDashboards] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailsSent, setEmailsSent] = useState(false);
  const [emailCount, setEmailCount] = useState<number | null>(null);

  // TTS playback states (using ElevenLabs)
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsSection, setTtsSection] = useState<string | null>(null);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

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
      toast.error('Could not access microphone. Please ensure you have granted microphone permissions.');
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
      toast.error(`Error: ${error.message}`);
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

  // Save insights to database via Edge Function (just saves, no notifications)
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
            user_id: userId,
            skip_notifications: true // Don't send emails automatically
          })
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to save');
      }

      setSavedInsightId(result.id);
      toast.success('Saved to Library! Now you can notify users via dashboard or email.');
    } catch (error: any) {
      console.error('Error saving insights:', error);
      toast.error(`Error saving: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Send notification to all user dashboards
  const sendToDashboards = async () => {
    if (!savedInsightId || !studyNotes) return;

    setSendingToDashboards(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-khutba-insights`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            insight_id: savedInsightId,
            title: studyNotes.title,
            speaker: speakerName || studyNotes.speaker,
            notification_type: 'dashboard'
          })
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to send notifications');
      }

      setSentToDashboards(true);
      toast.success(`Dashboard notification sent to ${result.user_count || 'all'} users!`);
    } catch (error: any) {
      console.error('Error sending dashboard notifications:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setSendingToDashboards(false);
    }
  };

  // Send email to all users who have email notifications enabled
  const sendEmailNotifications = async () => {
    if (!savedInsightId || !studyNotes) return;

    setSendingEmails(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-khutba-insights`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            insight_id: savedInsightId,
            title: studyNotes.title,
            speaker: speakerName || studyNotes.speaker,
            khutba_date: khutbaDate,
            main_points: studyNotes.main_points?.slice(0, 3),
            notification_type: 'email'
          })
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to send emails');
      }

      setEmailsSent(true);
      setEmailCount(result.email_count || 0);
      toast.success(`Reflection emails sent to ${result.email_count || 0} users who opted in!`);
    } catch (error: any) {
      console.error('Error sending email notifications:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setSendingEmails(false);
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
      toast.error('Error generating PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  // ElevenLabs Text-to-Speech
  const playTTS = async (text: string, sectionId: string) => {
    // If same section is playing, pause it
    if (ttsSection === sectionId && ttsPlaying && ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      setTtsPlaying(false);
      return;
    }

    // If same section is paused, resume
    if (ttsSection === sectionId && ttsAudioRef.current && ttsAudioRef.current.paused && ttsAudioUrl) {
      ttsAudioRef.current.play();
      setTtsPlaying(true);
      return;
    }

    // Stop any currently playing audio
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    if (ttsAudioUrl) {
      URL.revokeObjectURL(ttsAudioUrl);
      setTtsAudioUrl(null);
    }

    setTtsLoading(true);
    setTtsSection(sectionId);
    setTtsPlaying(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-dua-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            text,
            language: 'english'
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setTtsAudioUrl(url);

      // Create and play audio
      const audio = new Audio(url);
      ttsAudioRef.current = audio;

      audio.onplay = () => {
        setTtsPlaying(true);
        setTtsLoading(false);
      };

      audio.onended = () => {
        setTtsPlaying(false);
        setTtsSection(null);
      };

      audio.onerror = () => {
        console.error('Audio playback error');
        setTtsPlaying(false);
        setTtsSection(null);
        setTtsLoading(false);
        toast.error('Error playing audio. Please try again.');
      };

      audio.onpause = () => {
        setTtsPlaying(false);
      };

      await audio.play();

    } catch (error: any) {
      console.error('Error with TTS:', error);
      toast.error(`Error: ${error.message}`);
      setTtsSection(null);
      setTtsLoading(false);
    }
  };

  // Stop TTS function
  const stopTTS = () => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    if (ttsAudioUrl) {
      URL.revokeObjectURL(ttsAudioUrl);
      setTtsAudioUrl(null);
    }
    setTtsPlaying(false);
    setTtsSection(null);
  };

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
      }
      if (ttsAudioUrl) {
        URL.revokeObjectURL(ttsAudioUrl);
      }
    };
  }, [ttsAudioUrl]);

  // Show loading state while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-white focus:rounded-lg"
      >
        Skip to content
      </a>
      {/* Floating Audio Player */}
      {(ttsPlaying || ttsLoading) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-violet-500/40 flex items-center space-x-4 animate-in slide-in-from-bottom-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            {ttsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold">
              {ttsLoading ? 'Generating Audio...' : 'Now Playing'}
            </p>
            <p className="text-violet-200 text-sm">
              {ttsSection === 'summary' ? 'Summary' : ttsSection === 'transcript' ? 'Full Khutbah' : 'Audio'}
            </p>
          </div>
          <button
            onClick={() => {
              if (ttsAudioRef.current) {
                if (ttsPlaying) {
                  ttsAudioRef.current.pause();
                  setTtsPlaying(false);
                } else {
                  ttsAudioRef.current.play();
                  setTtsPlaying(true);
                }
              }
            }}
            disabled={ttsLoading}
            aria-label={ttsPlaying ? 'Pause audio' : 'Play audio'}
            className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition disabled:opacity-50"
          >
            {ttsPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <button
            onClick={stopTTS}
            aria-label="Stop and close audio player"
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Talbiyah Insights</h1>
                <p className="text-xs text-gray-500">Record, Transcribe, Study</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/insights-library')}
              className="flex items-center space-x-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition text-sm font-medium"
            >
              <BookOpen className="w-4 h-4" />
              <span>View Library</span>
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Turn Any Khutbah Into Talbiyah Insights
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Record the khutbah, transcribe it, and receive comprehensive study materials including
            Quranic vocabulary, hadith, quizzes, homework, and family discussion guides.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8">

          {/* Audio Recording Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Mic className="w-5 h-5 mr-2 text-amber-400" />
              Record Khutbah Audio
            </h3>

            <div className="bg-white/50 rounded-xl p-6 border border-gray-200">
              {!isRecording && !audioBlob && (
                <div className="text-center">
                  <button
                    onClick={startRecording}
                    aria-label="Start recording"
                    className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 rounded-full flex items-center justify-center mx-auto transition shadow-lg shadow-red-500/30"
                  >
                    <Mic className="w-10 h-10 text-gray-900" />
                  </button>
                  <p className="text-gray-500 mt-4">Click to start recording</p>
                  <p className="text-gray-500 text-sm mt-1">Make sure you're in a quiet environment</p>
                </div>
              )}

              {isRecording && (
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                    <button
                      onClick={stopRecording}
                      aria-label="Stop recording"
                      className="relative w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center transition"
                    >
                      <Square className="w-8 h-8 text-gray-900" />
                    </button>
                  </div>
                  <p className="text-2xl font-mono text-red-400 mb-2">{formatTime(recordingTime)}</p>
                  <p className="text-gray-500">Recording... Click to stop</p>
                </div>
              )}

              {audioBlob && !transcribing && (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-gray-900 font-medium">Recording Complete</p>
                      <p className="text-gray-500 text-sm">{formatTime(recordingTime)} recorded</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-3">
                    <button
                      onClick={transcribeAudio}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-gray-900 rounded-lg font-semibold transition flex items-center space-x-2"
                    >
                      <FileText className="w-5 h-5" />
                      <span>Transcribe Audio</span>
                    </button>
                    <button
                      onClick={() => {
                        setAudioBlob(null);
                        setRecordingTime(0);
                      }}
                      className="px-4 py-3 bg-gray-200 hover:bg-gray-200 text-gray-600 rounded-lg transition"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {transcribing && (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-900 font-medium mb-1">Transcribing Audio...</p>
                  <p className="text-gray-500 text-sm">This may take a minute for longer recordings</p>
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
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-gray-500 text-sm">OR paste text directly</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Metadata Fields */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-emerald-400" />
              Khutbah Details
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="khutba-date" className="block text-gray-500 text-sm mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date of Khutbah
                </label>
                <input
                  id="khutba-date"
                  type="date"
                  value={khutbaDate}
                  onChange={(e) => setKhutbaDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="speaker-name" className="block text-gray-500 text-sm mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Speaker / Imam
                </label>
                <input
                  id="speaker-name"
                  type="text"
                  value={speakerName}
                  onChange={(e) => setSpeakerName(e.target.value)}
                  placeholder="e.g., Sheikh Mustapha Shaybani"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="khutba-location" className="block text-gray-500 text-sm mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location / Mosque
                </label>
                <input
                  id="khutba-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Al-Azhar Mosque, Cairo"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Text Input */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-emerald-600" />
              Khutbah Text / Notes
            </h3>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste the khutbah transcription here, or type your notes from the khutbah. The more detail you provide, the better the study notes will be..."
              disabled={loading}
              rows={10}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-y disabled:opacity-50 font-mono text-sm"
            />
            <p className="text-gray-500 text-sm mt-2">
              {inputText.length} characters • {inputText.split(/\s+/).filter(Boolean).length} words
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateStudyNotes}
            disabled={!inputText.trim() || loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-gray-900 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg"
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
          <div className="bg-white border border-gray-200 rounded-2xl p-12 mb-8 text-center">
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Creating Your Talbiyah Insights</h3>
            <p className="text-gray-500">Extracting Quranic vocabulary, hadith, creating quizzes and homework...</p>
            <p className="text-gray-500 text-sm mt-2">This may take 30-60 seconds</p>
          </div>
        )}

        {/* Generated Study Notes */}
        {studyNotes && (
          <div ref={studyNotesRef} className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-8 py-6 border-b border-amber-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-amber-600 text-sm font-medium mb-1">Talbiyah Insights</p>
                  <h3 className="text-2xl font-bold text-gray-900">{studyNotes.title}</h3>
                  {studyNotes.speaker && (
                    <p className="text-emerald-700 text-sm mt-1">By {studyNotes.speaker}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">
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
                    onClick={() => {
                      // Build summary text for TTS
                      let summaryText = `${studyNotes.title}. `;
                      if (studyNotes.speaker) summaryText += `By ${studyNotes.speaker}. `;
                      if (studyNotes.main_points?.length > 0) {
                        summaryText += 'Main points: ';
                        studyNotes.main_points.forEach((p, i) => {
                          summaryText += `${i + 1}. ${p.point}. ${p.reflection}. `;
                        });
                      }
                      if (studyNotes.key_themes?.length > 0) {
                        summaryText += 'Key themes: ';
                        studyNotes.key_themes.forEach(t => {
                          summaryText += `${t.theme}: ${t.explanation}. `;
                        });
                      }
                      playTTS(summaryText, 'summary');
                    }}
                    disabled={ttsLoading && ttsSection === 'summary'}
                    className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white rounded-xl font-semibold transition disabled:opacity-50 shadow-lg shadow-violet-500/30"
                  >
                    {ttsLoading && ttsSection === 'summary' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : ttsPlaying && ttsSection === 'summary' ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                    <span>{ttsLoading && ttsSection === 'summary' ? 'Loading...' : ttsPlaying && ttsSection === 'summary' ? 'Pause Audio' : 'Listen to Summary'}</span>
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-gray-900 rounded-lg transition disabled:opacity-50"
                  >
                    {downloadingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>{downloadingPDF ? 'Generating...' : 'PDF'}</span>
                  </button>
                  <button
                    onClick={copyStudyNotes}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-200/80 hover:bg-gray-200/80 text-gray-900 rounded-lg transition"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => generateStudyNotes()}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-200/80 hover:bg-gray-200/80 text-gray-600 rounded-lg transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Save & Notify Section */}
            <div className="px-8 py-6 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Save className="w-5 h-5 mr-2 text-amber-600" />
                Save & Notify Users
              </h4>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Step 1: Save to Library */}
                <div className={`p-4 rounded-xl border-2 ${savedInsightId ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-amber-200'}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${savedInsightId ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                      {savedInsightId ? <Check className="w-4 h-4" /> : '1'}
                    </span>
                    <span className="font-semibold text-gray-900">Save to Library</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">Save insights for all users to access in the library</p>
                  <button
                    onClick={saveInsights}
                    disabled={saving || !!savedInsightId}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                      savedInsightId
                        ? 'bg-emerald-100 text-emerald-700 cursor-default'
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white'
                    } disabled:opacity-50`}
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : savedInsightId ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    <span>{savedInsightId ? 'Saved to Library!' : saving ? 'Saving...' : 'Save to Library'}</span>
                  </button>
                </div>

                {/* Step 2: Send to Dashboards */}
                <div className={`p-4 rounded-xl border-2 ${!savedInsightId ? 'opacity-50' : sentToDashboards ? 'bg-blue-50 border-blue-300' : 'bg-white border-blue-200'}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${sentToDashboards ? 'bg-blue-500 text-white' : 'bg-blue-400 text-white'}`}>
                      {sentToDashboards ? <Check className="w-4 h-4" /> : '2'}
                    </span>
                    <span className="font-semibold text-gray-900">Notify Dashboards</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">Show notification on every user's dashboard</p>
                  <button
                    onClick={sendToDashboards}
                    disabled={!savedInsightId || sendingToDashboards || sentToDashboards}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                      sentToDashboards
                        ? 'bg-blue-100 text-blue-700 cursor-default'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white'
                    } disabled:opacity-50`}
                  >
                    {sendingToDashboards ? <Loader2 className="w-5 h-5 animate-spin" /> : sentToDashboards ? <Check className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                    <span>{sentToDashboards ? 'Notification Sent!' : sendingToDashboards ? 'Sending...' : 'Send to Dashboards'}</span>
                  </button>
                </div>

                {/* Step 3: Send Email */}
                <div className={`p-4 rounded-xl border-2 ${!savedInsightId ? 'opacity-50' : emailsSent ? 'bg-violet-50 border-violet-300' : 'bg-white border-violet-200'}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${emailsSent ? 'bg-violet-500 text-white' : 'bg-violet-400 text-white'}`}>
                      {emailsSent ? <Check className="w-4 h-4" /> : '3'}
                    </span>
                    <span className="font-semibold text-gray-900">Send Reflection Email</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">Email users who opted in for reflections</p>
                  <button
                    onClick={sendEmailNotifications}
                    disabled={!savedInsightId || sendingEmails || emailsSent}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                      emailsSent
                        ? 'bg-violet-100 text-violet-700 cursor-default'
                        : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white'
                    } disabled:opacity-50`}
                  >
                    {sendingEmails ? <Loader2 className="w-5 h-5 animate-spin" /> : emailsSent ? <Check className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                    <span>{emailsSent ? `Sent to ${emailCount} users!` : sendingEmails ? 'Sending...' : 'Send Reflection Email'}</span>
                  </button>
                </div>
              </div>

              {savedInsightId && (
                <p className="text-center text-gray-500 text-sm mt-4">
                  <Check className="w-4 h-4 inline mr-1 text-emerald-500" />
                  Insights saved! Users can now find it in the <button onClick={() => navigate('/insights-library')} className="text-amber-600 hover:underline font-medium">Insights Library</button>
                </p>
              )}
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">

              {/* Cleaned Transcript */}
              {studyNotes.cleaned_transcript && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setTranscriptExpanded(!transcriptExpanded)}
                      aria-expanded={transcriptExpanded}
                      className="flex items-center text-left"
                    >
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <ScrollText className="w-5 h-5 mr-2 text-emerald-400" />
                        Full Khutbah (Cleaned Up)
                      </h4>
                      <div className="flex items-center space-x-2 ml-3">
                        <span className="text-gray-500 text-sm">
                          {transcriptExpanded ? 'Collapse' : 'Expand'}
                        </span>
                        {transcriptExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => playTTS(studyNotes.cleaned_transcript, 'transcript')}
                      disabled={ttsLoading && ttsSection === 'transcript'}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition text-sm disabled:opacity-50"
                    >
                      {ttsLoading && ttsSection === 'transcript' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : ttsPlaying && ttsSection === 'transcript' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                      <span>{ttsPlaying && ttsSection === 'transcript' ? 'Pause' : 'Listen'}</span>
                    </button>
                  </div>

                  {transcriptExpanded && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                      <div className="prose prose-emerald max-w-none">
                        {studyNotes.cleaned_transcript.split('\n\n').map((paragraph, idx) => (
                          <p key={idx} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="flex items-center my-8">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-4 text-gray-600 text-sm font-medium">STUDY NOTES</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                </div>
              )}

              {/* Main Points to Reflect Upon */}
              {studyNotes.main_points && studyNotes.main_points.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Bookmark className="w-5 h-5 mr-2 text-amber-600" />
                    Main Points to Reflect Upon
                  </h4>
                  <div className="space-y-3">
                    {studyNotes.main_points.map((item, idx) => (
                      <div key={idx} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <h5 className="text-amber-700 font-semibold mb-2 flex items-center">
                          <span className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mr-2 text-white text-sm">
                            {idx + 1}
                          </span>
                          {item.point}
                        </h5>
                        <p className="text-gray-600 text-sm ml-8">{item.reflection}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quranic Words & Phrases */}
              {studyNotes.quranic_words_phrases && studyNotes.quranic_words_phrases.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-emerald-600" />
                    Key Quranic Words & Phrases
                  </h4>
                  <div className="space-y-4">
                    {studyNotes.quranic_words_phrases.map((item, idx) => (
                      <div key={idx} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                          <p className="text-2xl md:text-3xl text-gray-900 font-arabic leading-relaxed" dir="rtl">
                            {item.arabic}
                          </p>
                          <span className="text-emerald-700 font-medium text-sm mt-2 md:mt-0">{item.transliteration}</span>
                        </div>
                        <p className="text-gray-700 font-medium mb-2">{item.meaning}</p>
                        <p className="text-gray-600 text-sm mb-2">
                          <span className="text-gray-500">Context:</span> {item.context}
                        </p>
                        {item.quran_reference && (
                          <p className="text-emerald-700 text-sm font-medium">{item.quran_reference}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Vocabulary */}
              {studyNotes.key_vocabulary && studyNotes.key_vocabulary.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Key className="w-5 h-5 mr-2 text-purple-600" />
                    Arabic Vocabulary
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {studyNotes.key_vocabulary.map((vocab, idx) => (
                      <div key={idx} className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-purple-700 font-semibold">{vocab.term}</span>
                          {vocab.arabic && (
                            <span className="text-xl text-gray-900 font-arabic">{vocab.arabic}</span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">{vocab.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Themes */}
              {studyNotes.key_themes && studyNotes.key_themes.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
                    Key Themes
                  </h4>
                  <div className="grid gap-3">
                    {studyNotes.key_themes.map((theme, idx) => (
                      <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <h5 className="text-yellow-700 font-semibold mb-1">{theme.theme}</h5>
                        <p className="text-gray-600 text-sm">{theme.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quran References */}
              {studyNotes.quran_references && studyNotes.quran_references.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-emerald-700 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Quran to Reflect Upon
                  </h4>
                  <div className="space-y-4">
                    {studyNotes.quran_references.map((ref, idx) => (
                      <div key={idx} className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                        {ref.arabic && (
                          <p className="text-2xl md:text-3xl text-gray-900 font-arabic text-right mb-4 leading-relaxed" dir="rtl">
                            {ref.arabic}
                          </p>
                        )}
                        <p className="text-gray-700 italic mb-3">"{ref.translation}"</p>
                        <p className="text-emerald-700 font-medium text-sm mb-3">{ref.reference}</p>
                        <div className="bg-emerald-100 rounded-lg p-3">
                          <p className="text-gray-600 text-sm">
                            <span className="text-emerald-700 font-medium">Reflection:</span> {ref.reflection}
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
                  <h4 className="text-lg font-semibold text-amber-700 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Hadith to Reflect Upon
                  </h4>
                  <div className="space-y-4">
                    {studyNotes.hadith_references.map((ref, idx) => (
                      <div key={idx} className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                        {ref.arabic && (
                          <p className="text-2xl md:text-3xl text-gray-900 font-arabic text-right mb-4 leading-relaxed" dir="rtl">
                            {ref.arabic}
                          </p>
                        )}
                        <p className="text-gray-700 italic mb-3">"{ref.translation}"</p>
                        <p className="text-amber-700 font-medium text-sm mb-3">{ref.reference}</p>
                        <div className="bg-amber-100 rounded-lg p-3">
                          <p className="text-gray-600 text-sm">
                            <span className="text-amber-700 font-medium">Reflection:</span> {ref.reflection}
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
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-red-600" />
                    Action Items
                  </h4>
                  <div className="space-y-3">
                    {studyNotes.action_items.map((item, idx) => (
                      <div key={idx} className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <h5 className="text-red-700 font-semibold mb-2 flex items-center">
                          <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-2 text-white text-sm">
                            {idx + 1}
                          </span>
                          {item.action}
                        </h5>
                        <p className="text-gray-600 text-sm ml-8">
                          <span className="text-gray-500">How:</span> {item.how_to}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Memory Aids */}
              {studyNotes.memory_aids && studyNotes.memory_aids.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-pink-600" />
                    Memory Aids
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {studyNotes.memory_aids.map((aid, idx) => (
                      <div key={idx} className="bg-pink-50 border border-pink-200 rounded-xl p-4">
                        <h5 className="text-pink-700 font-semibold mb-1">{aid.concept}</h5>
                        <p className="text-gray-600 text-sm">{aid.memory_tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comprehensive Quiz */}
              {studyNotes.quiz && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                      Comprehensive Quiz
                    </h4>
                    <button
                      onClick={() => setShowQuizAnswers(!showQuizAnswers)}
                      aria-expanded={showQuizAnswers}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition text-sm"
                    >
                      {showQuizAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{showQuizAnswers ? 'Hide Answers' : 'Show Answers'}</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Multiple Choice */}
                    {studyNotes.quiz.multiple_choice && studyNotes.quiz.multiple_choice.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <h5 className="text-blue-700 font-semibold mb-4 flex items-center">
                          <HelpCircle className="w-4 h-4 mr-2" />
                          Multiple Choice
                        </h5>
                        <div className="space-y-6">
                          {studyNotes.quiz.multiple_choice.map((q, idx) => (
                            <div key={idx} className="pb-4 border-b border-blue-200 last:border-0 last:pb-0">
                              <p className="text-gray-700 font-medium mb-3">
                                <span className="text-blue-600 mr-2">{idx + 1}.</span>
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
                                            ? 'bg-emerald-100 border border-emerald-300 text-emerald-700'
                                            : isSelected && !isCorrect
                                            ? 'bg-red-100 border border-red-300 text-red-700'
                                            : 'bg-gray-50 text-gray-500'
                                          : isSelected
                                          ? 'bg-blue-100 border border-blue-300 text-blue-700'
                                          : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
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
                                <div className="mt-3 ml-6 p-3 bg-emerald-100 rounded-lg">
                                  <p className="text-emerald-700 text-sm">
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
                      <div className="bg-violet-50 border border-violet-200 rounded-xl p-6">
                        <h5 className="text-violet-700 font-semibold mb-4 flex items-center">
                          <PenLine className="w-4 h-4 mr-2" />
                          Short Answer Questions
                        </h5>
                        <div className="space-y-4">
                          {studyNotes.quiz.short_answer.map((q, idx) => (
                            <div key={idx} className="pb-4 border-b border-violet-200 last:border-0 last:pb-0">
                              <p className="text-gray-700 font-medium mb-2">
                                <span className="text-violet-600 mr-2">{idx + 1}.</span>
                                {q.question}
                              </p>
                              <button
                                onClick={() => setShowShortAnswers({...showShortAnswers, [idx]: !showShortAnswers[idx]})}
                                className="text-violet-600 text-sm hover:text-violet-700 transition flex items-center"
                              >
                                {showShortAnswers[idx] ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                                {showShortAnswers[idx] ? 'Hide suggested answer' : 'Show suggested answer'}
                              </button>
                              {showShortAnswers[idx] && (
                                <div className="mt-2 p-3 bg-violet-100 rounded-lg">
                                  <p className="text-violet-700 text-sm">{q.suggested_answer}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reflection Questions */}
                    {studyNotes.quiz.reflection && studyNotes.quiz.reflection.length > 0 && (
                      <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
                        <h5 className="text-teal-700 font-semibold mb-4 flex items-center">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Deep Reflection Questions
                        </h5>
                        <ol className="space-y-3">
                          {studyNotes.quiz.reflection.map((q, idx) => (
                            <li key={idx} className="text-gray-700">
                              <span className="text-teal-700 font-medium mr-2">{idx + 1}.</span>
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
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ClipboardList className="w-5 h-5 mr-2 text-orange-600" />
                    Homework Assignments
                  </h4>
                  <div className="space-y-4">
                    {studyNotes.homework.map((hw, idx) => (
                      <div key={idx} className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="text-orange-700 font-semibold flex items-center">
                            <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-2 text-white text-sm">
                              {idx + 1}
                            </span>
                            {hw.task}
                          </h5>
                          <span className="text-orange-700 text-xs bg-orange-100 px-2 py-1 rounded">
                            {hw.duration}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm ml-8">{hw.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Age-Appropriate Summaries */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-emerald-700 mb-4">For Children (5-10)</h4>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-gray-700">{studyNotes.summary_for_children}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-violet-700 mb-4">For Teens (11-17)</h4>
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                    <p className="text-gray-700">{studyNotes.summary_for_teens}</p>
                  </div>
                </div>
              </div>

              {/* Family Discussion Guide */}
              {studyNotes.family_discussion_guide && studyNotes.family_discussion_guide.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-teal-600" />
                    Family Hour Discussion Guide
                  </h4>
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
                    <ol className="space-y-3">
                      {studyNotes.family_discussion_guide.map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mr-3 text-white text-sm font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-600 text-xs">
                  Always consult qualified scholars for religious rulings
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Links to other sections */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Link to Insights Library */}
          <div className="bg-white border border-amber-200 rounded-2xl p-6 text-center">
            <p className="text-gray-500 mb-3">View all saved Talbiyah Insights</p>
            <button
              onClick={() => navigate('/insights-library')}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-lg font-semibold transition"
            >
              View Insights Library
            </button>
          </div>

          {/* Link to Khutba Creator */}
          <div className="bg-white border border-emerald-200 rounded-2xl p-6 text-center">
            <p className="text-gray-500 mb-3">Need to create a khutbah from scratch?</p>
            <button
              onClick={() => navigate('/khutba-creator')}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white rounded-lg font-semibold transition"
            >
              Go to Khutbah Creator
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
