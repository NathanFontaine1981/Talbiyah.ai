import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { addRole } from '../utils/roleHelpers';
import { toast } from 'sonner';

interface PlanFeature {
  name: string;
  explorer: boolean;
  student: boolean;
}

interface FeatureCategory {
  title: string;
  features: PlanFeature[];
}

const categories: FeatureCategory[] = [
  {
    title: 'Courses & Content',
    features: [
      { name: 'Exploring Islam', explorer: true, student: true },
      { name: 'Unshakeable Foundations', explorer: true, student: true },
      { name: 'Learn Salah', explorer: true, student: true },
      { name: "Qur'an Tracker", explorer: false, student: true },
      { name: 'Daily Practice', explorer: false, student: true },
      { name: 'Structured Courses', explorer: false, student: true },
    ],
  },
  {
    title: 'Live Learning',
    features: [
      { name: '1-on-1 Lessons', explorer: false, student: true },
      { name: 'Group Classes', explorer: false, student: true },
      { name: 'Lesson Recordings', explorer: false, student: true },
      { name: 'Teacher Messages', explorer: false, student: true },
    ],
  },
  {
    title: 'AI Tools',
    features: [
      { name: 'Dua Builder', explorer: false, student: true },
      { name: 'Khutbah Creator', explorer: false, student: true },
      { name: 'Islamic Sources', explorer: false, student: true },
      { name: 'Lesson Insights', explorer: false, student: true },
    ],
  },
  {
    title: 'Community',
    features: [
      { name: 'Suggestions', explorer: true, student: true },
      { name: 'Referral Programme', explorer: false, student: true },
    ],
  },
];

export default function ComparePlans() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      setIsLoggedIn(true);
    }
  }

  async function handleUpgrade() {
    if (!isLoggedIn) {
      navigate('/signup');
      return;
    }

    if (!userId) return;

    setUpgrading(true);
    try {
      const success = await addRole(userId, 'student');
      if (success) {
        toast.success('Welcome! You now have full Student access.');
        // Update localStorage so dashboard picks up the new role
        localStorage.setItem('talbiyah_view_role', 'Student');
        navigate('/dashboard');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Explorer vs Student
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            See what each plan offers and choose the right one for your journey
          </p>
        </div>

        {/* Plan headers */}
        <div className="grid grid-cols-[1fr,100px,100px] sm:grid-cols-[1fr,140px,140px] gap-0 mb-2">
          <div></div>
          <div className="text-center">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-t-xl px-3 py-4">
              <p className="font-bold text-indigo-700 dark:text-indigo-300 text-sm sm:text-base">Explorer</p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">Free</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-t-xl px-3 py-4 border-2 border-emerald-500 border-b-0">
              <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm sm:text-base">Student</p>
              <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">Full Access</p>
            </div>
          </div>
        </div>

        {/* Feature categories */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {categories.map((category, catIdx) => (
            <div key={category.title}>
              {/* Category header */}
              <div className={`grid grid-cols-[1fr,100px,100px] sm:grid-cols-[1fr,140px,140px] gap-0 ${
                catIdx > 0 ? 'border-t-2 border-gray-100 dark:border-gray-700' : ''
              }`}>
                <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-750">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{category.title}</h3>
                </div>
                <div className="bg-indigo-50/50 dark:bg-indigo-900/10"></div>
                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border-x-2 border-emerald-500"></div>
              </div>

              {/* Features */}
              {category.features.map((feature, featIdx) => (
                <div
                  key={feature.name}
                  className={`grid grid-cols-[1fr,100px,100px] sm:grid-cols-[1fr,140px,140px] gap-0 ${
                    featIdx < category.features.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                  }`}
                >
                  <div className="px-4 sm:px-6 py-3 flex items-center">
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{feature.name}</span>
                  </div>
                  <div className="flex items-center justify-center bg-indigo-50/30 dark:bg-indigo-900/5">
                    {feature.explorer ? (
                      <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-center bg-emerald-50/30 dark:bg-emerald-900/5 border-x-2 border-emerald-500">
                    {feature.student ? (
                      <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-full font-bold text-lg transition shadow-lg shadow-emerald-500/30 flex items-center gap-3 mx-auto"
          >
            {upgrading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Upgrading...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>{isLoggedIn ? 'Upgrade to Student' : 'Sign Up as Student'}</span>
              </>
            )}
          </button>
          <p className="text-sm text-gray-400 mt-3">
            {isLoggedIn
              ? 'Your Explorer content will still be available'
              : 'Create an account to get started'}
          </p>
        </div>
      </div>
    </div>
  );
}
