import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { HMSPrebuilt } from '@100mslive/roomkit-react';
import { supabase } from '../lib/supabaseClient';
import {
  Video,
  Loader2,
  XCircle,
  Calendar,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

interface InterviewInfo {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  room_code_candidate: string | null;
  status: string;
  candidate_name: string;
}

export default function CandidateInterviewRoom() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<InterviewInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (interviewId) loadInterview();
  }, [interviewId]);

  async function loadInterview() {
    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('recruitment_interviews')
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          room_code_candidate,
          status,
          recruitment_pipeline!candidate_id ( full_name )
        `)
        .eq('id', interviewId!)
        .single();

      if (fetchError || !data) {
        setError('Interview not found. Please check your link and try again.');
        return;
      }

      if (data.status === 'cancelled') {
        setError('This interview has been cancelled. Please contact us for a new booking.');
        return;
      }

      if (data.status === 'completed') {
        setError('This interview has already been completed.');
        return;
      }

      const candidate = Array.isArray(data.recruitment_pipeline)
        ? data.recruitment_pipeline[0]
        : data.recruitment_pipeline;

      setInterview({
        id: data.id,
        scheduled_date: data.scheduled_date,
        scheduled_time: data.scheduled_time,
        duration_minutes: data.duration_minutes,
        room_code_candidate: data.room_code_candidate,
        status: data.status,
        candidate_name: candidate?.full_name || 'Candidate',
      });
    } catch {
      setError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your interview...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Interview
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'Interview not found.'}
          </p>
          <a
            href="mailto:salams@talbiyah.ai"
            className="inline-block px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  if (!interview.room_code_candidate) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl text-center">
          <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Video Room Not Ready
          </h2>
          <p className="text-gray-600">
            The video room for your interview hasn't been set up yet. Please try again closer to your interview time.
          </p>
        </div>
      </div>
    );
  }

  // Pre-join lobby
  if (!joined) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-xl">
          {/* Logo */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Talbiyah.ai</h1>
            <p className="text-sm text-gray-500 mt-1">Teacher Interview</p>
          </div>

          {/* Welcome */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              As-salamu alaykum, {interview.candidate_name}
            </h2>
            <p className="text-gray-600 mt-2 text-sm">
              Your interview is ready. Please join when you're prepared.
            </p>
          </div>

          {/* Interview Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                {format(new Date(`${interview.scheduled_date}T${interview.scheduled_time}`), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                {format(new Date(`${interview.scheduled_date}T${interview.scheduled_time}`), 'h:mm a')} (London time) — {interview.duration_minutes} minutes
              </span>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-blue-900 mb-2">Before you join:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>- Ensure you're in a quiet, well-lit environment</li>
              <li>- Test your camera and microphone</li>
              <li>- Have a stable internet connection</li>
              <li>- Prepare to discuss your teaching experience</li>
            </ul>
          </div>

          <button
            onClick={() => setJoined(true)}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2"
          >
            <Video className="w-5 h-5" />
            Join Interview
          </button>
        </div>
      </div>
    );
  }

  // Active video call
  return (
    <div className="h-screen bg-black">
      <HMSPrebuilt
        roomCode={interview.room_code_candidate}
        options={{ userName: interview.candidate_name }}
      />
    </div>
  );
}
