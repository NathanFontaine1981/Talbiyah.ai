import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import WeeklyCalendar from '../../components/teacher/WeeklyCalendar';

export default function MySchedule() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teacherProfileId, setTeacherProfileId] = useState<string | null>(null);

  useEffect(() => {
    loadTeacherProfile();
  }, []);

  async function loadTeacherProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id, status')
        .eq('user_id', user.id)
        .single();

      if (!teacherProfile || teacherProfile.status !== 'approved') {
        navigate('/teacher/pending-approval');
        return;
      }

      setTeacherProfileId(teacherProfile.id);
    } catch (error) {
      console.error('Error loading teacher profile:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/teacher/hub')}
            className="mb-6 flex items-center gap-2 text-gray-500 hover:text-white transition group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition" />
            <span>Back to Teacher Hub</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Schedule</h1>
              <p className="text-gray-500">View and manage your weekly lesson schedule</p>
            </div>
          </div>
        </div>

        {/* Weekly Calendar */}
        {teacherProfileId && (
          <WeeklyCalendar teacherId={teacherProfileId} />
        )}
      </div>
    </div>
  );
}
