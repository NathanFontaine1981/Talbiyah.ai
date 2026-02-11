import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  Clock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import DiagnosticQuestionnaire from '../../components/diagnostic/DiagnosticQuestionnaire';

export default function StartDiagnostic() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [existingAssessment, setExistingAssessment] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkExistingAssessment();
  }, []);

  async function checkExistingAssessment() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        navigate('/signup?redirect=/diagnostic/start');
        return;
      }

      setUser(currentUser);

      // Check for existing diagnostic assessment
      const { data, error } = await supabase
        .from('diagnostic_assessments')
        .select('id, status, lesson_id')
        .eq('student_id', currentUser.id)
        .not('status', 'eq', 'cancelled')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking assessment:', error);
      }

      if (data) {
        setExistingAssessment(data);
      }

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleQuestionnaireComplete = (assessmentId: string) => {
    navigate(`/diagnostic/book/${assessmentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // If user already has an assessment, show appropriate action
  if (existingAssessment) {
    let message = '';
    let actionLabel = '';
    let actionPath = '';

    switch (existingAssessment.status) {
      case 'questionnaire_pending':
      case 'questionnaire_complete':
      case 'ai_analyzed':
        message = 'You have an assessment in progress. Continue to book your session.';
        actionLabel = 'Continue Booking';
        actionPath = `/diagnostic/book/${existingAssessment.id}`;
        break;
      case 'lesson_scheduled':
        message = 'Your diagnostic session is scheduled. Check your dashboard for details.';
        actionLabel = 'Go to Dashboard';
        actionPath = '/dashboard';
        break;
      case 'lesson_complete':
      case 'report_complete':
        message = 'Your diagnostic assessment is complete. View your report.';
        actionLabel = 'View Report';
        actionPath = `/diagnostic/report/${existingAssessment.id}`;
        break;
      default:
        message = 'You already have a diagnostic assessment.';
        actionLabel = 'Go to Dashboard';
        actionPath = '/dashboard';
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment In Progress</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={() => navigate(actionPath)}
            className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition flex items-center justify-center gap-2"
          >
            {actionLabel}
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-gray-500 hover:text-gray-700 text-sm transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show questionnaire
  if (showQuestionnaire) {
    return (
      <DiagnosticQuestionnaire
        onComplete={handleQuestionnaireComplete}
        onClose={() => setShowQuestionnaire(false)}
      />
    );
  }

  // Landing page
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back to Dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-6 flex items-center gap-2 text-white/80 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">100% FREE - No Credit Card Required</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Free Diagnostic Assessment
          </h1>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Discover your current level and get a personalised learning plan.
            Our 20-minute assessment combines AI analysis with live teacher evaluation.
          </p>

          <button
            onClick={() => setShowQuestionnaire(true)}
            className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-full text-lg hover:bg-emerald-50 transition shadow-lg flex items-center gap-2 mx-auto"
          >
            Start Your Free Assessment
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                icon: BookOpen,
                title: 'Complete Questionnaire',
                description: 'Tell us about your goals, current level, and learning preferences (5 minutes)'
              },
              {
                step: 2,
                icon: Sparkles,
                title: 'AI Analysis',
                description: 'Our AI analyses your responses and creates a preliminary assessment'
              },
              {
                step: 3,
                icon: Clock,
                title: '20-Min Live Session',
                description: 'Meet with a certified teacher who evaluates you in a live video session'
              },
              {
                step: 4,
                icon: CheckCircle,
                title: 'Receive Your Report',
                description: 'Get a detailed assessment report with personalised recommendations'
              }
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <item.icon className="w-8 h-8 text-emerald-600" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The Talbiyah Approach */}
      <div className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            The Talbiyah Methodology
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Unlike traditional "memorization mills", we believe in building a deep, meaningful connection with the Quran.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: 'Understanding (Fahm)',
                subtitle: 'First, know what you\'re reading',
                description: 'Learn the meaning of words and ayat. Connect emotionally with the message. Build a foundation of comprehension.',
                color: 'bg-blue-100 text-blue-600'
              },
              {
                step: 2,
                title: 'Fluency (Itqan)',
                subtitle: 'Then, read it correctly',
                description: 'Master proper pronunciation and Tajweed rules. Recite smoothly and confidently without stumbling.',
                color: 'bg-purple-100 text-purple-600'
              },
              {
                step: 3,
                title: 'Memorization (Hifz)',
                subtitle: 'Finally, commit to memory',
                description: 'Built on understanding and fluency, memorization becomes stronger and more meaningful.',
                color: 'bg-amber-100 text-amber-600'
              }
            ].map(item => (
              <div key={item.step} className={`${item.color.split(' ')[0]} rounded-2xl p-6`}>
                <div className={`w-10 h-10 ${item.color.replace('bg-', 'bg-').replace('100', '500')} rounded-full flex items-center justify-center text-white font-bold mb-4`}>
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{item.subtitle}</p>
                <p className="text-sm text-gray-700">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What You'll Get */}
      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What You'll Receive
          </h2>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {[
                'Accurate assessment of current level',
                'Personalized starting point recommendation',
                'Methodology fit analysis',
                'Identified strengths and growth areas',
                'Recommended learning phase',
                'Teacher\'s professional evaluation',
                'Suggested lesson frequency',
                'Custom learning path recommendation'
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-emerald-100 mb-8 text-lg">
            Take the first step with a free diagnostic assessment.
            No commitment, no credit card required.
          </p>
          <button
            onClick={() => setShowQuestionnaire(true)}
            className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-full text-lg hover:bg-emerald-50 transition shadow-lg flex items-center gap-2 mx-auto"
          >
            Get Your Free Assessment
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
