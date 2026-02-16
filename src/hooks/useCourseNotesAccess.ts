import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface CourseNotesAccess {
  hasAccess: boolean;
  loading: boolean;
  totalSessions: number;
  notesPricePence: number;
  notesPricePounds: number;
  isTeacherOrAdmin: boolean;
  discountPercent: number;
  hasDiscountCode: boolean;
  refetch: () => void;
}

export function useCourseNotesAccess(groupSessionId: string | null): CourseNotesAccess {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalSessions, setTotalSessions] = useState(0);
  const [notesPricePence, setNotesPricePence] = useState(0);
  const [notesPricePounds, setNotesPricePounds] = useState(0);
  const [isTeacherOrAdmin, setIsTeacherOrAdmin] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [hasDiscountCode, setHasDiscountCode] = useState(false);

  const fetchAccess = useCallback(async () => {
    if (!groupSessionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Check if teacher or admin + get discount info
      const { data: course } = await supabase
        .from('group_sessions')
        .select('teacher_id, created_by, notes_discount_code, notes_discount_percent')
        .eq('id', groupSessionId)
        .single();

      if (course) {
        setDiscountPercent(course.notes_discount_percent || 0);
        setHasDiscountCode(!!course.notes_discount_code);

        const isOwner = user.id === course.teacher_id || user.id === course.created_by;
        if (isOwner) {
          setIsTeacherOrAdmin(true);
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // Check admin role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'admin') {
          setIsTeacherOrAdmin(true);
          setHasAccess(true);
          setLoading(false);
          return;
        }
      }

      // Count total sessions
      const { count } = await supabase
        .from('course_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('group_session_id', groupSessionId);

      const sessionCount = count || 0;
      setTotalSessions(sessionCount);

      // Flat £5 for all study notes
      const pence = 500;
      setNotesPricePence(pence);
      setNotesPricePounds(pence / 100);

      // If only 1 session, access is free (session 1 always free)
      if (sessionCount <= 1) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Check for completed payment
      const { data: access } = await supabase
        .from('course_notes_access')
        .select('id, status')
        .eq('group_session_id', groupSessionId)
        .eq('student_id', user.id)
        .eq('status', 'completed')
        .maybeSingle();

      setHasAccess(!!access);
    } catch (err) {
      console.error('Error checking course notes access:', err);
    } finally {
      setLoading(false);
    }
  }, [groupSessionId]);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  return {
    hasAccess,
    loading,
    totalSessions,
    notesPricePence,
    notesPricePounds,
    isTeacherOrAdmin,
    discountPercent,
    hasDiscountCode,
    refetch: fetchAccess,
  };
}
