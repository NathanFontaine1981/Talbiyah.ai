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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-emerald-300 transition">
      <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">My Teachers</h3>
          </div>
          {!loading && (
            <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
              {teacherCount}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600">
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
            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-lg font-semibold transition flex items-center justify-between group"
          >
            <span>View Teachers</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
}
