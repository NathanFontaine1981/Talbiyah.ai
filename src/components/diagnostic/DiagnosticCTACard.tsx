import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface DiagnosticAssessment {
  id: string;
  status: string;
  lesson_id: string | null;
  created_at: string;
}

interface DiagnosticCTACardProps {
  userId: string;
}

export default function DiagnosticCTACard({ userId }: DiagnosticCTACardProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<DiagnosticAssessment | null>(null);
  const [lesson, setLesson] = useState<any>(null);

  useEffect(() => {
    loadDiagnosticStatus();
  }, [userId]);

  async function loadDiagnosticStatus() {
    try {
      // Check for existing diagnostic assessment
      const { data, error } = await supabase
        .from('diagnostic_assessments')
        .select('id, status, lesson_id, created_at')
        .eq('student_id', userId)
        .not('status', 'eq', 'cancelled')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading diagnostic:', error);
      }

      if (data) {
        setAssessment(data);

        // If lesson scheduled, get lesson details
        if (data.lesson_id) {
          const { data: lessonData } = await supabase
            .from('lessons')
            .select('scheduled_time, status')
            .eq('id', data.lesson_id)
            .single();

          setLesson(lessonData);
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

  // If assessment is complete, show report CTA
  if (assessment?.status === 'report_complete' || assessment?.status === 'lesson_complete') {
    return (
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Assessment Complete!</h3>
            <p className="text-emerald-100 text-sm mb-4">
              Your diagnostic assessment report is ready. View your personalised learning plan.
            </p>
            <button
              onClick={() => navigate(`/diagnostic/report/${assessment.id}`)}
              className="px-4 py-2 bg-white text-emerald-600 font-semibold rounded-full text-sm hover:bg-emerald-50 transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If lesson is scheduled, show upcoming session info
  if (assessment?.status === 'lesson_scheduled' && lesson) {
    const scheduledDate = new Date(lesson.scheduled_time);
    const isUpcoming = scheduledDate > new Date();

    return (
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">
              {isUpcoming ? 'Diagnostic Session Scheduled' : 'Diagnostic Session Today!'}
            </h3>
            <p className="text-blue-100 text-sm mb-4">
              {isUpcoming
                ? `Your FREE 20-minute assessment is on ${scheduledDate.toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' })} at ${scheduledDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                : 'Your assessment session is happening now or very soon!'}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-full text-sm hover:bg-blue-50 transition flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              View in Schedule
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If assessment is in progress, show continue CTA
  if (assessment) {
    let message = 'Continue your diagnostic assessment process.';
    let buttonLabel = 'Continue';
    let buttonPath = `/diagnostic/book/${assessment.id}`;

    if (assessment.status === 'questionnaire_pending') {
      message = 'Complete the questionnaire to continue.';
      buttonLabel = 'Complete Questionnaire';
      buttonPath = '/diagnostic/start';
    } else if (assessment.status === 'ai_analyzed' || assessment.status === 'questionnaire_complete') {
      message = 'Your questionnaire is complete! Book your FREE 20-minute session.';
      buttonLabel = 'Book Session';
    }

    // Use window.location for clean navigation to ensure component remounts
    const handleNavigate = () => {
      window.location.href = buttonPath;
    };

    return (
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Assessment In Progress</h3>
            <p className="text-purple-100 text-sm mb-4">{message}</p>
            <button
              onClick={handleNavigate}
              className="px-4 py-2 bg-white text-purple-600 font-semibold rounded-full text-sm hover:bg-purple-50 transition flex items-center gap-2"
            >
              {buttonLabel}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No assessment yet - show main CTA
  return (
    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-8 -mb-8" />

      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-2">
              100% FREE
            </div>
            <h3 className="font-bold text-xl mb-2">Get Your Free Diagnostic Assessment</h3>
            <p className="text-emerald-100 text-sm mb-4">
              Discover your current level with a 20-minute evaluation. Receive a personalised
              learning plan based on our Understanding → Fluency → Memorisation methodology.
            </p>
            <ul className="space-y-2 mb-5 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-200" />
                <span>AI-powered preliminary assessment</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-200" />
                <span>Live teacher evaluation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-200" />
                <span>Detailed report with recommendations</span>
              </li>
            </ul>
            <button
              onClick={() => navigate('/diagnostic/start')}
              className="px-6 py-3 bg-white text-emerald-600 font-bold rounded-full hover:bg-emerald-50 transition flex items-center gap-2 shadow-lg"
            >
              Start Free Assessment
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
