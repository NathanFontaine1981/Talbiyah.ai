import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, BookOpen, Trophy, Calendar, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import StudentDashboardContent from '../components/StudentDashboardContent';

interface ChildData {
  id: string;
  parent_id: string;
  child_name: string;
  child_age: number | null;
  child_gender: string | null;
  has_account: boolean;
  account_id: string | null;
}

export default function ChildDashboardView() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [allChildren, setAllChildren] = useState<ChildData[]>([]);
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [showChildSwitcher, setShowChildSwitcher] = useState(false);

  useEffect(() => {
    checkAccessAndLoadChild();
  }, [childId]);

  async function checkAccessAndLoadChild() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Load all parent's children for the switcher
      const { data: allChildrenData } = await supabase
        .from('parent_children')
        .select('id, parent_id, child_name, child_age, child_gender, has_account, account_id')
        .eq('parent_id', user.id);

      setAllChildren(allChildrenData || []);

      // Load the specific child
      const { data: parentChild, error: linkError } = await supabase
        .from('parent_children')
        .select('id, parent_id, child_name, child_age, child_gender, has_account, account_id')
        .eq('id', childId)
        .eq('parent_id', user.id)
        .single();

      if (linkError || !parentChild) {
        toast.error('You do not have access to view this child\'s dashboard');
        navigate('/my-children');
        return;
      }

      setHasAccess(true);
      setChildData(parentChild);

      // If child has a full account, load their learner data
      if (parentChild.has_account && parentChild.account_id) {
        const { data: learnerData } = await supabase
          .from('learners')
          .select('id')
          .eq('parent_id', parentChild.account_id)
          .single();

        if (learnerData) {
          setLearnerId(learnerData.id);
        }
      } else {
        // For lightweight children, we'll create a temporary learner record if needed
        // or show a simplified dashboard
        const { data: existingLearner } = await supabase
          .from('learners')
          .select('id')
          .eq('parent_id', user.id)
          .eq('name', parentChild.child_name)
          .maybeSingle();

        if (existingLearner) {
          setLearnerId(existingLearner.id);
        } else {
          // Create a learner record for lightweight child
          const { data: newLearner } = await supabase
            .from('learners')
            .insert({
              parent_id: user.id,
              name: parentChild.child_name,
              age: parentChild.child_age,
              gender: parentChild.child_gender,
              gamification_points: 0
            })
            .select('id')
            .single();

          if (newLearner) {
            setLearnerId(newLearner.id);
          }
        }
      }

    } catch (err) {
      console.error('Error loading child dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess || !childData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Unable to load child dashboard</p>
          <button
            onClick={() => navigate('/my-children')}
            className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            Back to My Children
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Parent View Banner */}
      <div className="bg-purple-600 text-white py-4 px-6 shadow-md">
        <div className="max-w-[1600px] mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-3 opacity-90">
            <button
              onClick={() => navigate('/dashboard')}
              className="hover:underline"
            >
              Parent Dashboard
            </button>
            <span>›</span>
            <button
              onClick={() => navigate('/my-children')}
              className="hover:underline"
            >
              My Children
            </button>
            <span>›</span>
            <span className="font-semibold">{childData.child_name}'s Dashboard</span>
          </div>

          {/* Main Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-purple-700 rounded-lg transition"
                title="Back to Parent Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
                  {childData.child_name[0]}
                </div>
                <div>
                  <p className="text-sm opacity-90">Viewing as Parent</p>
                  <p className="font-semibold text-lg">{childData.child_name}'s Dashboard</p>
                </div>
              </div>

              {/* Child Switcher */}
              {allChildren.length > 1 && (
                <div className="relative ml-4">
                  <button
                    onClick={() => setShowChildSwitcher(!showChildSwitcher)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition flex items-center gap-2"
                  >
                    <span>Switch Child</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showChildSwitcher && (
                    <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl py-2 min-w-[200px] z-50">
                      {allChildren.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => {
                            setShowChildSwitcher(false);
                            navigate(`/child/${child.id}/dashboard`);
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-purple-50 transition flex items-center gap-3 ${
                            child.id === childId ? 'bg-purple-100 font-semibold' : ''
                          }`}
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {child.child_name[0]}
                          </div>
                          <div>
                            <p className="text-gray-900">{child.child_name}</p>
                            {child.child_age && (
                              <p className="text-xs text-gray-500">Age {child.child_age}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!childData.has_account && (
                <span className="px-3 py-1.5 bg-white/20 rounded-lg text-sm font-medium">
                  Lightweight Account
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Child's Dashboard Content */}
      {learnerId ? (
        <div className="p-6 lg:p-8">
          <StudentDashboardContent
            learnerId={learnerId}
            isParentView={true}
            onRefresh={checkAccessAndLoadChild}
          />
        </div>
      ) : (
        <div className="p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-200 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {childData.child_name}'s Learning Dashboard
              </h2>
              <p className="text-gray-600 mb-8">
                {childData.child_age && `Age ${childData.child_age} • `}
                Ready to start their learning journey
              </p>

              {/* Quick Stats Placeholder */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <BookOpen className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">Lessons</h3>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-600">completed</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">Progress</h3>
                  <p className="text-2xl font-bold text-gray-900">0%</p>
                  <p className="text-sm text-gray-600">complete</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">Upcoming</h3>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-600">sessions</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/subjects')}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition shadow-lg"
                >
                  Book First Lesson
                </button>
                {!childData.has_account && (
                  <button
                    onClick={() => navigate('/my-children')}
                    className="px-8 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-semibold transition"
                  >
                    Create Login Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
