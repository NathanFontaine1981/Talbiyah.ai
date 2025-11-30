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
  X
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

const TEMPLATE_INFO = {
  quran: {
    name: 'Quran Lesson',
    icon: BookOpen,
    color: 'emerald',
    description: 'Tajweed, Tafsir, Memorization focus',
    sections: [
      'Lesson Summary',
      'Verses Covered',
      'Tajweed Points Learned',
      'New Vocabulary',
      'Key Tafsir Points',
      'Memorization Progress',
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTeachers();
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

  const templateInfo = TEMPLATE_INFO[templateType];
  const TemplateIcon = templateInfo.icon;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            Talbiyah Insights Generator
          </h1>
          <p className="text-slate-400 mt-1">
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
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Generated Insights History</h2>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
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
                    className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-${info.color}-500/10`}>
                          <Icon className={`w-6 h-6 text-${info.color}-400`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{insight.title}</h3>
                          <p className="text-sm text-slate-400 mt-1">
                            {info.name} • {insight.teacher_name}
                            {insight.student_name && ` • ${insight.student_name}`}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
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
                        {insight.pdf_url && (
                          <a
                            href={insight.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition"
                            title="Download PDF"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        )}
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
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">1. Choose Template</h2>
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
                          : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mb-2 ${isSelected ? `text-${info.color}-400` : 'text-slate-400'}`} />
                      <h3 className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {info.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{info.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Method */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">2. Add Transcript</h2>

              {/* Input Method Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setInputMethod('text')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                    inputMethod === 'text'
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Paste Text
                </button>
                <button
                  onClick={() => setInputMethod('audio')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                    inputMethod === 'audio'
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
                  className="w-full h-64 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              ) : (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500/50 transition"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/mp3,audio/mpeg,audio/m4a,audio/wav,audio/x-m4a"
                      onChange={handleAudioUpload}
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 mx-auto text-slate-500 mb-3" />
                    {audioFile ? (
                      <div>
                        <p className="text-white font-medium">{audioFile.name}</p>
                        <p className="text-sm text-slate-400 mt-1">
                          {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-slate-400">Click to upload audio file</p>
                        <p className="text-sm text-slate-500 mt-1">MP3, M4A, or WAV (max 25MB)</p>
                      </div>
                    )}
                  </div>

                  {audioFile && (
                    <button
                      onClick={transcribeAudio}
                      disabled={transcribing}
                      className="w-full px-4 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 text-white rounded-xl transition flex items-center justify-center gap-2"
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
                      <label className="block text-sm text-slate-400 mb-2">Transcription Result:</label>
                      <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        className="w-full h-48 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm text-slate-500 mt-2">
                {transcript.length.toLocaleString()} characters
              </p>
            </div>

            {/* Metadata */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">3. Lesson Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-400 mb-2">
                    Lesson Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Surah Al-Baqarah Verses 1-5"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Teacher Name */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    <GraduationCap className="w-4 h-4 inline mr-1" />
                    Teacher Name *
                  </label>
                  <div className="relative">
                    <select
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white appearance-none focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">Select or type below...</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.profiles.full_name}>
                          {teacher.profiles.full_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                  </div>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="Or type teacher name..."
                    className="w-full mt-2 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Student Name */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Student Name (optional)
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="For personalized PDF"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Lesson Date *
                  </label>
                  <input
                    type="date"
                    value={lessonDate}
                    onChange={(e) => setLessonDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 60"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Tags */}
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-400 mb-2">
                    Subject/Topic Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g., tajweed, surah al-baqarah, beginners"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateInsights}
              disabled={loading || !transcript.trim() || !title.trim() || !teacherName.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-xl transition flex items-center justify-center gap-3 text-lg font-semibold"
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
                  <h3 className="font-semibold text-white">{templateInfo.name}</h3>
                  <p className="text-sm text-slate-400">{templateInfo.description}</p>
                </div>
              </div>

              <h4 className="text-sm font-medium text-slate-300 mb-2">PDF Sections:</h4>
              <ul className="space-y-1">
                {templateInfo.sections.map((section, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 text-${templateInfo.color}-400`} />
                    {section}
                  </li>
                ))}
              </ul>
            </div>

            {/* Generated Content Preview */}
            {(generatedContent || htmlContent) && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  Generation Complete!
                </h3>

                <div className="space-y-3">
                  {htmlContent && (
                    <button
                      onClick={previewInNewWindow}
                      className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl transition flex items-center justify-center gap-2 font-semibold"
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

                <p className="text-xs text-slate-500 mt-4 text-center">
                  Use browser print (Ctrl/Cmd + P) to save as PDF
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
