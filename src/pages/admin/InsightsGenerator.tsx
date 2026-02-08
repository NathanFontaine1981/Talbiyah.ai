import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  FileText,
  Upload,
  Calendar,
  Clock,
  User,
  GraduationCap,
  Download,
  History,
  Trash2,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  Languages,
  Heart,
  ChevronDown,
  X,
  ArrowLeft,
  Send,
  Search,
  Users
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

type TemplateType = 'quran' | 'arabic' | 'reverts';

interface GeneratedInsight {
  id: string;
  template_type: TemplateType;
  title: string;
  teacher_name: string;
  student_name: string | null;
  lesson_date: string;
  duration_minutes: number | null;
  transcript: string;
  generated_content: {
    markdown?: string;
    sections?: Record<string, unknown>;
  };
  pdf_url: string | null;
  created_at: string;
  created_by: string;
}

interface Teacher {
  id: string;
  user_id: string;
  profiles: {
    full_name: string;
  };
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
}

const TEMPLATE_INFO = {
  quran: {
    name: 'Quran Lesson',
    icon: BookOpen,
    color: 'emerald',
    description: 'Tajweed, Tafsir, Memorisation focus',
    sections: [
      'Lesson Summary',
      'Verses Covered',
      'Tajweed Points Learned',
      'New Vocabulary',
      'Key Tafsir Points',
      'Memorisation Progress',
      'Practice Recommendations',
      'Next Lesson Preview'
    ]
  },
  arabic: {
    name: 'Arabic Language',
    icon: Languages,
    color: 'blue',
    description: 'Vocabulary, Grammar, Conversation',
    sections: [
      'Lesson Summary',
      'New Vocabulary Table',
      'Grammar Points Covered',
      'Conversation Phrases',
      'Common Mistakes to Avoid',
      'Homework/Practice Exercises',
      'Recommended Resources'
    ]
  },
  reverts: {
    name: 'Reverts Class',
    icon: Heart,
    color: 'purple',
    description: 'Fiqh basics, Practical Islam, New Muslim guidance',
    sections: [
      'Topic Summary',
      'Key Islamic Concepts',
      'Practical Applications',
      'Common Questions Answered',
      'Quran/Hadith References',
      'Action Items for the Week',
      'Recommended Reading/Videos',
      'Support Resources'
    ]
  }
};

export default function InsightsGenerator() {
  // Form state
  const [templateType, setTemplateType] = useState<TemplateType>('quran');
  const [inputMethod, setInputMethod] = useState<'text' | 'audio'>('text');
  const [transcript, setTranscript] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('');
  const [tags, setTags] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Data state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [history, setHistory] = useState<GeneratedInsight[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // User selection state for sending insights
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [sendingToUser, setSendingToUser] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Modal state for viewing/sending from history
  const [viewingInsight, setViewingInsight] = useState<GeneratedInsight | null>(null);
  const [sendingInsight, setSendingInsight] = useState<GeneratedInsight | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTeachers();
    fetchUsers();
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchTeachers() {
    const { data } = await supabase
      .from('teacher_profiles')
      .select('id, user_id, profiles!inner(full_name)')
      .eq('status', 'approved');

    if (data) {
      setTeachers(data as unknown as Teacher[]);
    }
  }

  async function fetchUsers() {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('full_name');

    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data || []);
    }
    setLoadingUsers(false);
  }

  async function fetchHistory() {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('admin_generated_insights')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching history:', error);
    } else {
      setHistory(data || []);
    }
    setLoadingHistory(false);
  }

  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/wav', 'audio/x-m4a'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload an MP3, M4A, or WAV audio file');
      return;
    }

    // Validate file size (max 25MB for Whisper)
    if (file.size > 25 * 1024 * 1024) {
      setError('Audio file must be less than 25MB');
      return;
    }

    setAudioFile(file);
    setError('');
  }

  async function transcribeAudio() {
    if (!audioFile) return;

    setTranscribing(true);
    setError('');

    try {
      // Create form data for the audio file
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      // Call our Edge Function to transcribe
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transcribe audio');
      }

      const data = await response.json();
      setTranscript(data.transcript);
      setSuccess('Audio transcribed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to transcribe audio');
    } finally {
      setTranscribing(false);
    }
  }

  async function generateInsights() {
    if (!transcript.trim()) {
      setError('Please provide a transcript');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a lesson title');
      return;
    }
    if (!teacherName.trim()) {
      setError('Please provide a teacher name');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedContent(null);
    setHtmlContent(null);
    setPdfUrl(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-admin-insight`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_type: templateType,
            title,
            teacher_name: teacherName,
            student_name: studentName || null,
            lesson_date: lessonDate,
            duration_minutes: duration ? parseInt(duration) : null,
            transcript,
            subject_tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate insights');
      }

      const data = await response.json();
      setGeneratedContent(data.generated_content);
      setHtmlContent(data.html_content);
      setPdfUrl(data.pdf_url);
      setSuccess('Insights generated successfully!');

      // Refresh history
      if (showHistory) {
        fetchHistory();
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  }

  function previewInNewWindow() {
    if (!htmlContent) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  }

  async function deleteInsight(id: string) {
    if (!confirm('Are you sure you want to delete this insight?')) return;

    const { error } = await supabase
      .from('admin_generated_insights')
      .delete()
      .eq('id', id);

    if (error) {
      setError('Failed to delete insight');
    } else {
      setHistory(history.filter(h => h.id !== id));
      setSuccess('Insight deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    }
  }

  async function regenerateInsight(insight: GeneratedInsight) {
    setTemplateType(insight.template_type);
    setTitle(insight.title);
    setTeacherName(insight.teacher_name);
    setStudentName(insight.student_name || '');
    setLessonDate(insight.lesson_date);
    setDuration(insight.duration_minutes?.toString() || '');
    setTranscript(insight.transcript);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function sendInsightToUser() {
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    if (!pdfUrl && !generatedContent) {
      setError('Please generate an insight first');
      return;
    }

    setSendingToUser(true);
    setError('');

    try {
      // Create a notification for the user with the PDF link
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: selectedUser.id,
        title: `New Lesson Insight: ${title}`,
        message: `A new lesson insight has been shared with you for "${title}" by ${teacherName}.`,
        type: 'insight',
        data: {
          pdf_url: pdfUrl || null,
          lesson_title: title,
          teacher_name: teacherName,
          lesson_date: lessonDate,
          template_type: templateType,
          content: generatedContent?.markdown || null,
        },
      });

      if (notifError) throw notifError;

      setSuccess(`Insight sent successfully to ${selectedUser.full_name}!`);
      setSelectedUser(null);
      setUserSearchQuery('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error sending insight:', err);
      setError(err instanceof Error ? err.message : 'Failed to send insight');
    } finally {
      setSendingToUser(false);
    }
  }

  function resetForm() {
    setGeneratedContent(null);
    setHtmlContent(null);
    setPdfUrl(null);
    setSelectedUser(null);
    setUserSearchQuery('');
  }

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  async function sendHistoryInsightToUser() {
    if (!selectedUser || !sendingInsight) {
      setError('Please select a user');
      return;
    }

    setSendingToUser(true);
    setError('');

    try {
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: selectedUser.id,
        title: `New Lesson Insight: ${sendingInsight.title}`,
        message: `A new lesson insight has been shared with you for "${sendingInsight.title}" by ${sendingInsight.teacher_name}.`,
        type: 'insight',
        data: {
          pdf_url: sendingInsight.pdf_url || null,
          lesson_title: sendingInsight.title,
          teacher_name: sendingInsight.teacher_name,
          lesson_date: sendingInsight.lesson_date,
          template_type: sendingInsight.template_type,
          content: sendingInsight.generated_content?.markdown || null,
        },
      });

      if (notifError) throw notifError;

      setSuccess(`Insight sent successfully to ${selectedUser.full_name}!`);
      setSelectedUser(null);
      setUserSearchQuery('');
      setSendingInsight(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error sending insight:', err);
      setError(err instanceof Error ? err.message : 'Failed to send insight');
    } finally {
      setSendingToUser(false);
    }
  }

  function viewInsightInNewWindow(insight: GeneratedInsight) {
    if (insight.pdf_url) {
      window.open(insight.pdf_url, '_blank');
    } else if (insight.generated_content?.markdown) {
      // Create a simple HTML preview from markdown
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${insight.title} - Talbiyah Insight</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
              h1, h2, h3 { color: #10b981; }
              pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; }
            </style>
          </head>
          <body>
            <h1>${insight.title}</h1>
            <p><strong>Teacher:</strong> ${insight.teacher_name}</p>
            ${insight.student_name ? `<p><strong>Student:</strong> ${insight.student_name}</p>` : ''}
            <p><strong>Date:</strong> ${new Date(insight.lesson_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <hr />
            <pre>${insight.generated_content.markdown}</pre>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  }

  const templateInfo = TEMPLATE_INFO[templateType];
  const TemplateIcon = templateInfo.icon;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-emerald-600" />
            Talbiyah Insights Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create beautiful lesson insight PDFs from transcripts or audio
          </p>
        </div>
        <button
          onClick={() => {
            setShowHistory(!showHistory);
            if (!showHistory) fetchHistory();
          }}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
            showHistory
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <History className="w-5 h-5" />
          {showHistory ? 'Hide History' : 'View History'}
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {showHistory ? (
        /* History View */
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Generated Insights History</h2>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No insights generated yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((insight) => {
                const info = TEMPLATE_INFO[insight.template_type];
                const Icon = info.icon;
                return (
                  <div
                    key={insight.id}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-500 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-${info.color}-500/10`}>
                          <Icon className={`w-6 h-6 text-${info.color}-400`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{insight.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {info.name} • {insight.teacher_name}
                            {insight.student_name && ` • ${insight.student_name}`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {new Date(insight.lesson_date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                            {insight.duration_minutes && ` • ${insight.duration_minutes} mins`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewInsightInNewWindow(insight)}
                          className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition"
                          title="View Insight"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {insight.pdf_url && (
                          <a
                            href={insight.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition"
                            title="Download PDF"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setSendingInsight(insight);
                            setSelectedUser(null);
                            setUserSearchQuery('');
                          }}
                          className="p-2 text-cyan-500 hover:bg-cyan-500/10 rounded-lg transition"
                          title="Send to User"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => regenerateInsight(insight)}
                          className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                          title="Edit & Regenerate"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteInsight(insight.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Generator Form */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Selector */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">1. Choose Template</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.keys(TEMPLATE_INFO) as TemplateType[]).map((type) => {
                  const info = TEMPLATE_INFO[type];
                  const Icon = info.icon;
                  const isSelected = templateType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setTemplateType(type)}
                      className={`p-4 rounded-xl border-2 transition text-left ${
                        isSelected
                          ? `border-${info.color}-500 bg-${info.color}-500/10`
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mb-2 ${isSelected ? `text-${info.color}-400` : 'text-gray-500 dark:text-gray-400'}`} />
                      <h3 className={`font-semibold ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                        {info.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{info.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Method */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">2. Add Transcript</h2>

              {/* Input Method Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setInputMethod('text')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                    inputMethod === 'text'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Paste Text
                </button>
                <button
                  onClick={() => setInputMethod('audio')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                    inputMethod === 'audio'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload Audio
                </button>
              </div>

              {inputMethod === 'text' ? (
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste your lesson transcript here..."
                  className="w-full h-64 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-emerald-500 resize-none"
                />
              ) : (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/50 transition"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/mp3,audio/mpeg,audio/m4a,audio/wav,audio/x-m4a"
                      onChange={handleAudioUpload}
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                    {audioFile ? (
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">{audioFile.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Click to upload audio file</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">MP3, M4A, or WAV (max 25MB)</p>
                      </div>
                    )}
                  </div>

                  {audioFile && (
                    <button
                      onClick={transcribeAudio}
                      disabled={transcribing}
                      className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 disabled:text-gray-200 text-white rounded-xl transition flex items-center justify-center gap-2"
                    >
                      {transcribing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Transcribing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Transcribe with Whisper AI
                        </>
                      )}
                    </button>
                  )}

                  {transcript && inputMethod === 'audio' && (
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Transcription Result:</label>
                      <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        className="w-full h-48 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {transcript.length.toLocaleString()} characters
              </p>
            </div>

            {/* Metadata */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">3. Lesson Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Lesson Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Surah Al-Baqarah Verses 1-5"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Teacher Name */}
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <GraduationCap className="w-4 h-4 inline mr-1" />
                    Teacher Name *
                  </label>
                  <div className="relative">
                    <select
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white appearance-none focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select or type below...</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.profiles.full_name}>
                          {teacher.profiles.full_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none" />
                  </div>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="Or type teacher name..."
                    className="w-full mt-2 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Student Name */}
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Student Name (optional)
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="For personalised PDF"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Lesson Date *
                  </label>
                  <input
                    type="date"
                    value={lessonDate}
                    onChange={(e) => setLessonDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 60"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Tags */}
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Subject/Topic Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g., tajweed, surah al-baqarah, beginners"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateInsights}
              disabled={loading || !transcript.trim() || !title.trim() || !teacherName.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-xl transition flex items-center justify-center gap-3 text-lg font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generating Insights...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Generate Talbiyah Insights PDF
                </>
              )}
            </button>
          </div>

          {/* Right Column - Template Preview & Generated Content */}
          <div className="space-y-6">
            {/* Template Info Card */}
            <div className={`bg-${templateInfo.color}-500/10 border border-${templateInfo.color}-500/20 rounded-xl p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <TemplateIcon className={`w-8 h-8 text-${templateInfo.color}-400`} />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{templateInfo.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{templateInfo.description}</p>
                </div>
              </div>

              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PDF Sections:</h4>
              <ul className="space-y-1">
                {templateInfo.sections.map((section, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 text-${templateInfo.color}-400`} />
                    {section}
                  </li>
                ))}
              </ul>
            </div>

            {/* Generated Content Preview */}
            {(generatedContent || htmlContent) && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  Generation Complete!
                </h3>

                <div className="space-y-3">
                  {htmlContent && (
                    <button
                      onClick={previewInNewWindow}
                      className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl transition flex items-center justify-center gap-2 font-semibold"
                    >
                      <Eye className="w-5 h-5" />
                      Preview & Print PDF
                    </button>
                  )}

                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download Saved PDF
                    </a>
                  )}
                </div>

                {/* Send to User Section */}
                {(pdfUrl || generatedContent) && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Send to User
                    </h4>

                    <div className="relative" ref={userDropdownRef}>
                      <div
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center gap-2 cursor-pointer"
                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                      >
                        <Search className="w-4 h-4 text-gray-400" />
                        {selectedUser ? (
                          <div className="flex-1 flex items-center justify-between">
                            <div>
                              <span className="text-gray-900 dark:text-white">{selectedUser.full_name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({selectedUser.email})</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(null);
                                setUserSearchQuery('');
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={userSearchQuery}
                            onChange={(e) => {
                              setUserSearchQuery(e.target.value);
                              setShowUserDropdown(true);
                            }}
                            placeholder="Search users by name or email..."
                            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </div>

                      {showUserDropdown && !selectedUser && (
                        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {loadingUsers ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                            </div>
                          ) : filteredUsers.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                              No users found
                            </div>
                          ) : (
                            filteredUsers.slice(0, 10).map((user) => (
                              <button
                                key={user.id}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserDropdown(false);
                                  setUserSearchQuery('');
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                              >
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                  <Users className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name || 'No name'}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={sendInsightToUser}
                      disabled={!selectedUser || sendingToUser || (!pdfUrl && !generatedContent)}
                      className="w-full mt-3 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition flex items-center justify-center gap-2"
                    >
                      {sendingToUser ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Insight to User
                        </>
                      )}
                    </button>
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-500 mt-4 text-center">
                  Use browser print (Ctrl/Cmd + P) to save as PDF
                </p>

                {/* Back Button */}
                <button
                  onClick={resetForm}
                  className="w-full mt-4 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Generate New Insight
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Insight Modal */}
      {sendingInsight && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-cyan-500" />
                Send Insight
              </h3>
              <button
                onClick={() => {
                  setSendingInsight(null);
                  setSelectedUser(null);
                  setUserSearchQuery('');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white">{sendingInsight.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {sendingInsight.teacher_name} • {new Date(sendingInsight.lesson_date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select User
              </label>
              <div className="relative">
                <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  {selectedUser ? (
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <span className="text-gray-900 dark:text-white">{selectedUser.full_name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({selectedUser.email})</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser(null);
                          setUserSearchQuery('');
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search users by name or email..."
                      className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                    />
                  )}
                </div>

                {!selectedUser && userSearchQuery && (
                  <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No users found
                      </div>
                    ) : (
                      filteredUsers.slice(0, 8).map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user);
                            setUserSearchQuery('');
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Users className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name || 'No name'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSendingInsight(null);
                  setSelectedUser(null);
                  setUserSearchQuery('');
                }}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={sendHistoryInsightToUser}
                disabled={!selectedUser || sendingToUser}
                className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition flex items-center justify-center gap-2"
              >
                {sendingToUser ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
