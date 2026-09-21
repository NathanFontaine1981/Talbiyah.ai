import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Radio, ArrowRight, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// "Revert Unshakeable Foundations" — the weekly Dawra course held at Cheadle Masjid
const CHEADLE_MASJID_COURSE_ID = 'a154368c-3bf1-495c-8c7f-069572c1f794';

interface RevertsClassWidgetProps {
  userId: string;
}

interface CourseInfo {
  name: string;
  slug: string;
  schedule_day: string;
  schedule_time: string;
  duration_minutes: number;
  location: string | null;
  delivery_mode: string | null;
}

interface NextSession {
  session_number: number;
  session_date: string | null;
  live_status: string | null;
}

export default function RevertsClassWidget({ userId }: RevertsClassWidgetProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [nextSession, setNextSession] = useState<NextSession | null>(null);

  useEffect(() => {
    load();
  }, [userId]);

  async function load() {
    try {
      const { data: course } = await supabase
        .from('group_sessions')
        .select('name, slug, schedule_day, schedule_time, duration_minutes, location, delivery_mode, teacher_id, created_by')
        .eq('id', CHEADLE_MASJID_COURSE_ID)
        .single();

      if (!course) {
        setLoading(false);
        return;
      }

      const isTeacherOrOwner = userId === course.teacher_id || userId === course.created_by;

      let isEnrolled = false;
      if (!isTeacherOrOwner) {
        const { data: enrollment } = await supabase
          .from('group_session_participants')
          .select('id')
          .eq('group_session_id', CHEADLE_MASJID_COURSE_ID)
          .eq('student_id', userId)
          .maybeSingle();
        isEnrolled = !!enrollment;
      }

      if (!isTeacherOrOwner && !isEnrolled) {
        setLoading(false);
        return;
      }

      setEligible(true);
      setCourse(course);

      const today = new Date().toISOString().split('T')[0];
      const { data: session } = await supabase
        .from('course_sessions')
        .select('session_number, session_date, live_status')
        .eq('group_session_id', CHEADLE_MASJID_COURSE_ID)
        .gte('session_date', today)
        .order('session_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      setNextSession(session);
    } catch (error) {
      console.error('Error loading Reverts class widget:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !eligible || !course) {
    return null;
  }

  const isLive = nextSession?.live_status === 'live';
  const nextDate = nextSession?.session_date
    ? new Date(nextSession.session_date).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : null;

  return (
    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-800/20 border border-teal-200 dark:border-teal-700 rounded-2xl p-5">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/20">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white">{course.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {course.schedule_day}s at {course.schedule_time?.slice(0, 5)}
            {course.location && (
              <span className="inline-flex items-center gap-1 ml-2">
                <MapPin className="w-3 h-3" /> {course.location}
              </span>
            )}
          </p>
        </div>
      </div>

      {isLive ? (
        <button
          onClick={() => navigate(`/course/${course.slug}/live/${nextSession!.session_number}`)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition mb-2"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          Class is live — Join now
        </button>
      ) : nextDate ? (
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-3 bg-white/60 dark:bg-gray-800/40 rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
          <span>Next session: {nextDate}</span>
        </div>
      ) : null}

      <button
        onClick={() => navigate(`/course/${course.slug}`)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition"
      >
        View course & study notes
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
