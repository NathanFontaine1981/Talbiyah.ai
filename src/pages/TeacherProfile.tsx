import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, Play, Calendar, Clock, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import BookingModal from '../components/BookingModal';
import TeacherRatingDisplay from '../components/TeacherRatingDisplay';
import {
  TierBadge,
  TeacherStatsDisplay,
  GentlenessGuarantee,
  TrustBanner
} from '../components/teachers';

interface AvailabilitySlot {
  date: string;
  time: string;
  duration: number;
}

interface ProfileData {
  full_name: string;
}

interface TeacherData {
  id: string;
  bio: string;
  hourly_rate: number;
  video_intro_url: string | null;
  education_level: string | null;
  islamic_learning_interests: string[] | null;
  is_talbiyah_certified: boolean | null;
  profiles: ProfileData | ProfileData[];
  // Tier stats (from view)
  tier?: string;
  tier_name?: string;
  tier_icon?: string;
  student_hourly_price?: number;
  hours_taught?: number;
  average_rating?: number;
  completed_lessons?: number;
  // Rating stats
  rating_avg?: number;
  rating_count?: number;
  thumbs_up_percentage?: number;
  total_feedback?: number;
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
  const [hasAvailability, setHasAvailability] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

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
            education_level,
            islamic_learning_interests,
            is_talbiyah_certified,
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

        // Get tier stats from the view
        const { data: tierStats } = await supabase
          .from('teacher_tier_stats')
          .select(`
            tier,
            tier_name,
            tier_icon,
            student_hourly_price,
            hours_taught,
            average_rating,
            completed_lessons
          `)
          .eq('teacher_id', id)
          .maybeSingle();

        // Get rating summary
        const { data: ratingStats } = await supabase
          .from('teacher_rating_summary')
          .select(`
            avg_rating,
            total_detailed_ratings,
            thumbs_up_percentage,
            total_quick_feedback
          `)
          .eq('teacher_id', id)
          .maybeSingle();

        const teacherData: TeacherData = {
          ...data,
          profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
          tier: tierStats?.tier || 'newcomer',
          tier_name: tierStats?.tier_name || 'Newcomer',
          tier_icon: tierStats?.tier_icon || '🌱',
          student_hourly_price: tierStats?.student_hourly_price || 15,
          hours_taught: tierStats?.hours_taught || 0,
          average_rating: tierStats?.average_rating || 0,
          completed_lessons: tierStats?.completed_lessons || 0,
          rating_avg: ratingStats?.avg_rating || 0,
          rating_count: ratingStats?.total_detailed_ratings || 0,
          thumbs_up_percentage: ratingStats?.thumbs_up_percentage || 0,
          total_feedback: ratingStats?.total_quick_feedback || 0
        };

        setTeacher(teacherData);

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
          interface TeacherSubjectRow {
            subjects: Subject | Subject[] | null;
          }
          const subjectsList = subjectsData
            .map((ts: TeacherSubjectRow) => {
              const subjects = ts.subjects;
              if (Array.isArray(subjects)) {
                return subjects[0] || null;
              }
              return subjects;
            })
            .filter((subject): subject is Subject => subject !== null);
          setSubjects(subjectsList);
          if (subjectsList.length > 0) {
            setSelectedSubject(subjectsList[0].id);
          }
        }

        // Check teacher availability
        const { data: availabilityData, error: availError } = await supabase
          .from('teacher_availability')
          .select('id')
          .eq('teacher_id', id)
          .eq('is_available', true)
          .limit(1);

        if (availError) {
          console.error('Error checking availability:', availError);
        }

        const hasAvailableSlots = (availabilityData?.length || 0) > 0;
        setHasAvailability(hasAvailableSlots);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load teacher profile';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchTeacher();
  }, [id]);

  // Fetch availability slots for the week view
  useEffect(() => {
    async function fetchAvailability() {
      if (!id || !hasAvailability) return;

      setLoadingAvailability(true);
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + (weekOffset * 7));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);

        const fromDate = startDate.toISOString().split('T')[0];
        const toDate = endDate.toISOString().split('T')[0];

        const { data: session } = await supabase.auth.getSession();

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-available-slots?teacher_id=${id}&from=${fromDate}&to=${toDate}`,
          {
            headers: {
              'Authorization': `Bearer ${session?.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();

        if (result.success && result.slots) {
          // Group unique date/time combinations (ignore duration variations)
          const uniqueSlots = new Map<string, AvailabilitySlot>();
          result.slots.forEach((slot: { date: string; time: string; duration: number }) => {
            const key = `${slot.date}-${slot.time}`;
            if (!uniqueSlots.has(key)) {
              uniqueSlots.set(key, { date: slot.date, time: slot.time, duration: slot.duration });
            }
          });
          setAvailabilitySlots(Array.from(uniqueSlots.values()));
        }
      } catch (err) {
        console.error('Error fetching availability:', err);
      } finally {
        setLoadingAvailability(false);
      }
    }

    fetchAvailability();
  }, [id, hasAvailability, weekOffset]);

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

  // Get the week's dates for display
  const getWeekDates = () => {
    const dates = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (weekOffset * 7));

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDateShort = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }),
      dateStr: date.toISOString().split('T')[0]
    };
  };

  const getSlotsForDate = (dateStr: string) => {
    return availabilitySlots
      .filter(slot => slot.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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
  const teacherProfile = Array.isArray(teacher.profiles) ? teacher.profiles[0] : teacher.profiles;
  const teacherName = teacherProfile.full_name;

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
          {/* Enhanced Header with Tier Badge and Stats */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">{teacherName}</h1>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <TierBadge tier={teacher.tier || 'newcomer'} size="md" showDescription />
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-emerald-600">
                  £{(teacher.student_hourly_price || totalPrice).toFixed(2)}
                </p>
                <p className="text-gray-500 text-sm">per hour</p>
              </div>
            </div>

            {/* Stats Row */}
            <TeacherStatsDisplay
              hoursTaught={teacher.hours_taught || 0}
              averageRating={teacher.rating_avg || teacher.average_rating || 0}
              ratingCount={teacher.rating_count || 0}
              completedLessons={teacher.completed_lessons || 0}
              thumbsUpPercentage={teacher.thumbs_up_percentage}
              totalFeedback={teacher.total_feedback}
              variant="full"
              className="mb-6"
            />
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
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl aspect-video flex items-center justify-center border border-gray-300">
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

              {teacher.education_level && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Education</h3>
                  <p className="text-gray-700">{teacher.education_level}</p>
                </div>
              )}

              {subjects.length > 0 && (
                <div className="mb-6">
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

              {teacher.islamic_learning_interests && teacher.islamic_learning_interests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {teacher.islamic_learning_interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Availability Calendar Section */}
          {hasAvailability && (
            <div className="mb-12 bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Availability</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                    disabled={weekOffset === 0}
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700">
                    {weekOffset === 0 ? 'This Week' : `Week ${weekOffset + 1}`}
                  </span>
                  <button
                    onClick={() => setWeekOffset(weekOffset + 1)}
                    disabled={weekOffset >= 3}
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {loadingAvailability ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {getWeekDates().map((date) => {
                    const { day, date: dateNum, month, dateStr } = formatDateShort(date);
                    const slots = getSlotsForDate(dateStr);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];

                    return (
                      <div
                        key={dateStr}
                        className={`bg-white rounded-xl p-3 border ${isToday ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-200'}`}
                      >
                        <div className="text-center mb-2">
                          <p className={`text-xs font-medium ${isToday ? 'text-emerald-600' : 'text-gray-500'}`}>
                            {day}
                          </p>
                          <p className={`text-lg font-bold ${isToday ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {dateNum}
                          </p>
                          <p className="text-xs text-gray-400">{month}</p>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {slots.length > 0 ? (
                            slots.slice(0, 4).map((slot, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium"
                              >
                                <Clock className="w-3 h-3" />
                                {formatTime(slot.time)}
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400 text-center py-2">No slots</p>
                          )}
                          {slots.length > 4 && (
                            <p className="text-xs text-emerald-600 text-center font-medium">
                              +{slots.length - 4} more
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-sm text-gray-500 mt-4 text-center">
                Click "Book Your FREE First Lesson" below to see all available time slots
              </p>
            </div>
          )}

          {/* Teacher Ratings Section */}
          <div className="mb-12">
            <TeacherRatingDisplay teacherId={teacher.id} />
          </div>

          {/* Trust & Safety Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <GentlenessGuarantee variant="compact" />
            <TrustBanner
              badges={teacher.is_talbiyah_certified ? ['identity_verified', 'talbiyah_certified'] : ['identity_verified']}
              isTalbiyahCertified={teacher.is_talbiyah_certified || false}
            />
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-3xl font-bold text-white mb-4">Ready to Start Learning?</h3>
              <p className="text-gray-300 text-lg mb-8">
                Book your first lesson with {teacherName.split(' ')[0]} and experience personalised Islamic education with AI-powered insights.
              </p>
              <button
                onClick={() => setBookingModalOpen(true)}
                disabled={!hasAvailability || subjects.length === 0}
                className="px-12 py-5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-xl font-bold transition shadow-lg shadow-emerald-500/20 inline-flex items-center space-x-3"
              >
                <Calendar className="w-6 h-6" />
                <span>Book Your FREE First Lesson</span>
              </button>
              {(!hasAvailability || subjects.length === 0) ? (
                <p className="text-red-400 text-sm mt-4">
                  {!hasAvailability ? 'This teacher has no available time slots at the moment.' : 'This teacher is not teaching any subjects yet.'}
                </p>
              ) : (
                <p className="text-gray-400 text-sm mt-4">No payment required for your first lesson</p>
              )}
            </div>
          </div>

          {selectedSubject && (
            <BookingModal
              isOpen={bookingModalOpen}
              onClose={() => setBookingModalOpen(false)}
              teacherId={teacher.id}
              teacherName={teacherName}
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
