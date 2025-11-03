import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, Play, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import BookingModal from '../components/BookingModal';

interface TeacherData {
  id: string;
  bio: string;
  hourly_rate: number;
  video_intro_url: string | null;
  profiles: {
    full_name: string;
  };
}

interface Subject {
  id: string;
  name: string;
}

export default function TeacherProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useEffect(() => {
    async function fetchTeacher() {
      if (!id) {
        setError('No teacher ID provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('teacher_profiles')
          .select(`
            id,
            bio,
            hourly_rate,
            video_intro_url,
            profiles!teacher_profiles_user_id_fkey (
              full_name
            )
          `)
          .eq('id', id)
          .eq('status', 'approved')
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('Teacher not found');
          setLoading(false);
          return;
        }

        setTeacher(data as TeacherData);

        const { data: subjectsData } = await supabase
          .from('teacher_subjects')
          .select(`
            subjects (
              id,
              name
            )
          `)
          .eq('teacher_id', id);

        if (subjectsData) {
          const subjectsList = subjectsData
            .map((ts: any) => ts.subjects)
            .filter(Boolean);
          setSubjects(subjectsList);
          if (subjectsList.length > 0) {
            setSelectedSubject(subjectsList[0].id);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load teacher profile');
      } finally {
        setLoading(false);
      }
    }

    fetchTeacher();
  }, [id]);

  const getVideoEmbedUrl = (url: string | null): string | null => {
    if (!url) return null;

    // YouTube URL handling
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo URL handling
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // Direct video URL
    return url;
  };

  const calculateTotalPrice = (hourlyRate: number): number => {
    return hourlyRate + 10;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teacher profile...</p>
        </div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center space-x-2 hover:opacity-80 transition">
              <BookOpen className="w-7 h-7 text-emerald-500" />
              <span className="text-2xl font-semibold text-gray-900">Talbiyah.ai</span>
            </button>
          </div>
        </nav>

        <div className="pt-32 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Teacher Not Found</h1>
              <p className="text-gray-600 text-lg mb-8">{error || 'The teacher profile you are looking for does not exist or is no longer available.'}</p>
              <button
                onClick={() => navigate('/teachers')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Teachers</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const videoUrl = getVideoEmbedUrl(teacher.video_intro_url);
  const isDirectVideo = videoUrl && !videoUrl.includes('youtube.com') && !videoUrl.includes('vimeo.com');
  const totalPrice = calculateTotalPrice(teacher.hourly_rate);

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center space-x-2 hover:opacity-80 transition">
            <BookOpen className="w-7 h-7 text-emerald-500" />
            <span className="text-2xl font-semibold text-gray-900">Talbiyah.ai</span>
          </button>

          <button
            onClick={() => navigate('/teachers')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Teachers</span>
          </button>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-2">{teacher.profiles.full_name}</h1>
            <p className="text-2xl text-emerald-600 font-semibold">£{totalPrice.toFixed(2)} / hour</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-12">
            <div>
              {videoUrl ? (
                <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg">
                  {isDirectVideo ? (
                    <video
                      controls
                      className="w-full aspect-video"
                      src={videoUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <iframe
                      src={videoUrl}
                      className="w-full aspect-video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Teacher Introduction Video"
                    />
                  )}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl aspect-video flex items-center justify-center border border-slate-600">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-emerald-500/10 rounded-full flex items-center justify-center">
                      <Play className="w-10 h-10 text-emerald-400" />
                    </div>
                    <p className="text-gray-400">No video available</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">About Me</h2>
              <div className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap mb-6">
                {teacher.bio || 'No biography available.'}
              </div>

              {subjects.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Subjects Taught</h3>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <span
                        key={subject.id}
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium"
                      >
                        {subject.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-3xl font-bold text-white mb-4">Ready to Start Learning?</h3>
              <p className="text-gray-300 text-lg mb-8">
                Book your first lesson with {teacher.profiles.full_name.split(' ')[0]} and experience personalized Islamic education with AI-powered insights.
              </p>
              <button
                onClick={() => setBookingModalOpen(true)}
                disabled={subjects.length === 0}
                className="px-12 py-5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-xl font-bold transition shadow-lg shadow-emerald-500/20 inline-flex items-center space-x-3"
              >
                <Calendar className="w-6 h-6" />
                <span>Book Your FREE 30-Min Trial</span>
              </button>
              <p className="text-gray-400 text-sm mt-4">No payment required for your first trial lesson</p>
            </div>
          </div>

          {selectedSubject && (
            <BookingModal
              isOpen={bookingModalOpen}
              onClose={() => setBookingModalOpen(false)}
              teacherId={teacher.id}
              teacherName={teacher.profiles.full_name}
              subjectId={selectedSubject}
              subjectName={subjects.find(s => s.id === selectedSubject)?.name || ''}
            />
          )}
        </div>
      </div>

      <footer className="border-t border-gray-200 py-8 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>© 2025 Talbiyah.ai</p>
        </div>
      </footer>
    </div>
  );
}
