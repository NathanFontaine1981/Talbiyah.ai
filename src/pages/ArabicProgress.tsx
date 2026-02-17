import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Languages } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import ArabicProgressTracker from '../components/ArabicProgressTracker';

export default function ArabicProgress() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [learnerId, setLearnerId] = useState<string | null>(null);

  useEffect(() => {
    loadLearner();
  }, []);

  async function loadLearner() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Try to find learner record
      let learner = null;

      // 1. Check if current user is a parent with a learner record (student case)
      const { data: learnerAsParent } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', user.id)
        .maybeSingle();

      if (learnerAsParent) {
        learner = learnerAsParent;
      }

      // 2. If not found, check parent_children table
      if (!learner) {
        const { data: parentChild } = await supabase
          .from('parent_children')
          .select('id')
          .eq('account_id', user.id)
          .maybeSingle();

        if (parentChild) {
          const { data: existingLearner } = await supabase
            .from('learners')
            .select('id')
            .eq('parent_id', user.id)
            .maybeSingle();

          if (existingLearner) {
            learner = existingLearner;
          }
        }
      }

      if (learner) {
        setLearnerId(learner.id);
      }
    } catch (error) {
      console.error('Error loading learner:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-500 focus:text-white focus:rounded-lg"
      >
        Skip to progress tracker
      </a>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/courses-overview')}
            aria-label="Go back to courses"
            className="mb-6 flex items-center gap-2 text-gray-500 hover:text-white transition group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition" />
            <span>Back to Courses</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center">
              <Languages className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Arabic Language Progress</h1>
              <p className="text-gray-400">Track your journey to Arabic fluency</p>
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        {learnerId ? (
          <ArabicProgressTracker learnerId={learnerId} />
        ) : (
          <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
            <Languages className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-white mb-2">No Progress Yet</h2>
            <p className="text-gray-500 mb-6">
              Book your first Arabic lesson to start tracking your progress
            </p>
            <button
              onClick={() => navigate('/teachers')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition"
            >
              Find a Teacher
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
