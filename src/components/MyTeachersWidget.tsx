import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface MyTeachersWidgetProps {
  learnerId?: string;
}

export default function MyTeachersWidget({ learnerId }: MyTeachersWidgetProps) {
  const navigate = useNavigate();
  const [teacherCount, setTeacherCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeacherCount();
  }, [learnerId]);

  async function loadTeacherCount() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get learner ID
      const { data: learnerData } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', user.id)
        .maybeSingle();

      if (!learnerData) return;

      const { count, error } = await supabase
        .from('student_teacher_relationships')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', learnerData.id)
        .eq('status', 'active');

      if (error) throw error;

      setTeacherCount(count || 0);
    } catch (error) {
      console.error('Error loading teacher count:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-emerald-300 transition">
      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">My Teachers</h3>
          </div>
          {!loading && (
            <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
              {teacherCount}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          {teacherCount === 0
            ? 'Assign teachers to track your progress'
            : `${teacherCount} teacher${teacherCount !== 1 ? 's' : ''} assigned`}
        </p>
      </div>

      <div className="p-4 space-y-2">
        {teacherCount === 0 ? (
          <button
            onClick={() => navigate('/my-teachers')}
            className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Teacher</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/my-teachers')}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold transition flex items-center justify-between group"
          >
            <span>View Teachers</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
}
