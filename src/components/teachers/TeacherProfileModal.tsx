import { useEffect, useState } from 'react';
import { X, User, Calendar, GraduationCap, Heart, Shield, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import TierBadge from './TierBadge';
import TeacherStatsDisplay from './TeacherStatsDisplay';
import SpecializationTags from './SpecializationTags';
import { GentlenessBadge } from './GentlenessGuarantee';
import GentlenessGuarantee from './GentlenessGuarantee';
import { TrustBanner } from './VettingBadges';
import VideoIntroPlayer, { VideoIntroPlaceholder } from './VideoIntroPlayer';
import { TestimonialsList } from './TestimonialCard';
import CareerLadder from './CareerLadder';
import FeaturedRibbon from './FeaturedRibbon';
import { getTierInfo, GENTLENESS_GUARANTEE } from '../../constants/teacherConstants';

interface TeacherProfileModalProps {
  teacherId: string;
  isOpen: boolean;
  onClose: () => void;
  onBookLesson: (teacherId: string) => void;
}

interface TeacherData {
  id: string;
  user_id: string;
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  tier: string;
  tier_name: string;
  student_hourly_price: number;
  hours_taught: number;
  average_rating: number;
  completed_lessons: number;
  rating_avg?: number;
  rating_count?: number;
  thumbs_up_percentage?: number;
  total_feedback?: number;
  retention_rate?: number;
  video_intro_url?: string | null;
  video_intro_thumbnail?: string | null;
  video_intro_duration?: number;
  is_talbiyah_certified?: boolean;
  is_featured?: boolean;
  specializations?: string[];
  vetting_badges?: string[];
  bio_extended?: string | null;
  teaching_philosophy?: string | null;
  qualifications?: string[];
  years_experience?: number;
  subjects_taught?: string[];
  age_groups?: string[];
  availability_preview?: { day: string; slots: string[] }[];
}

interface Testimonial {
  id: string;
  student_name: string;
  student_type: 'parent' | 'adult_student' | 'teenage_student';
  testimonial_text: string;
  rating?: number;
  lesson_count?: number;
  subject?: string;
  verified?: boolean;
}

export default function TeacherProfileModal({
  teacherId,
  isOpen,
  onClose,
  onBookLesson
}: TeacherProfileModalProps) {
  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && teacherId) {
      fetchTeacherData();
    }
  }, [isOpen, teacherId]);

  const fetchTeacherData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch teacher profile - only columns that exist on teacher_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('teacher_profiles')
        .select(`
          id,
          user_id,
          bio,
          tier,
          video_intro_url,
          is_talbiyah_certified,
          hourly_rate,
          hours_taught,
          average_rating,
          completed_lessons,
          retention_rate
        `)
        .eq('id', teacherId)
        .single();

      if (profileError) throw profileError;

      // Fetch user profile for name and avatar
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', profileData.user_id)
        .single();

      // Fetch tier stats for tier_name and student_hourly_price
      const { data: tierStats } = await supabase
        .from('teacher_tier_stats')
        .select('*')
        .eq('teacher_id', teacherId)
        .maybeSingle();

      // Fetch rating summary
      const { data: ratingData } = await supabase
        .from('teacher_rating_summary')
        .select('*')
        .eq('teacher_id', teacherId)
        .maybeSingle();

      // Fetch testimonials
      const { data: testimonialData } = await supabase
        .from('teacher_testimonials')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(5);

      // Combine data
      const fullTeacherData: TeacherData = {
        id: profileData.id,
        user_id: profileData.user_id,
        full_name: userProfile?.full_name || 'Teacher',
        bio: profileData.bio,
        avatar_url: userProfile?.avatar_url || null,
        tier: profileData.tier || 'newcomer',
        tier_name: tierStats?.tier_name || (profileData.tier ? profileData.tier.charAt(0).toUpperCase() + profileData.tier.slice(1) : 'Newcomer'),
        student_hourly_price: tierStats?.student_hourly_price || (profileData.hourly_rate ? profileData.hourly_rate * 2 : 15),
        video_intro_url: profileData.video_intro_url,
        is_talbiyah_certified: profileData.is_talbiyah_certified,
        hours_taught: tierStats?.hours_taught || profileData.hours_taught || 0,
        completed_lessons: tierStats?.completed_lessons || profileData.completed_lessons || 0,
        average_rating: tierStats?.average_rating || profileData.average_rating || 0,
        retention_rate: profileData.retention_rate || 0,
        rating_avg: ratingData?.rating_avg || tierStats?.average_rating || 0,
        rating_count: ratingData?.rating_count || 0,
        thumbs_up_percentage: ratingData?.thumbs_up_percentage,
        total_feedback: ratingData?.total_feedback
      };

      setTeacher(fullTeacherData);
      setTestimonials(testimonialData || []);
    } catch (err) {
      console.error('Error fetching teacher data:', err);
      setError('Unable to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tierInfo = teacher ? getTierInfo(teacher.tier) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 md:p-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/90 hover:bg-gray-100 rounded-full flex items-center justify-center shadow-md transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Loading state */}
        {loading && (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">😕</div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={fetchTeacherData}
              className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Content */}
        {teacher && !loading && !error && (
          <>
            {/* Featured banner */}
            {teacher.is_featured && (
              <FeaturedRibbon variant="banner" />
            )}

            {/* Header Section */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-100 to-cyan-100 border-4 border-white shadow-lg">
                    {teacher.avatar_url ? (
                      <img
                        src={teacher.avatar_url}
                        alt={teacher.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-12 h-12 text-emerald-600" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 truncate">
                      {teacher.full_name}
                    </h2>
                    <TierBadge tier={teacher.tier as any} size="md" />
                  </div>

                  {/* Specializations */}
                  {teacher.specializations && teacher.specializations.length > 0 && (
                    <div className="mb-3">
                      <SpecializationTags
                        specializations={teacher.specializations}
                        maxVisible={4}
                        size="sm"
                      />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <GentlenessBadge />
                    {teacher.is_talbiyah_certified && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        <Shield className="w-3 h-3" />
                        <span>Talbiyah Certified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="p-6 border-b border-gray-100">
              <TeacherStatsDisplay
                hoursTaught={teacher.hours_taught}
                averageRating={teacher.rating_avg || teacher.average_rating}
                ratingCount={teacher.rating_count || 0}
                completedLessons={teacher.completed_lessons}
                thumbsUpPercentage={teacher.thumbs_up_percentage}
                totalFeedback={teacher.total_feedback}
                variant="full"
              />
            </div>

            {/* Video Introduction */}
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>🎥</span> Video Introduction
              </h3>
              {teacher.video_intro_url ? (
                <VideoIntroPlayer
                  videoUrl={teacher.video_intro_url}
                  thumbnailUrl={teacher.video_intro_thumbnail}
                  teacherName={teacher.full_name}
                  duration={teacher.video_intro_duration}
                  variant="inline"
                />
              ) : (
                <VideoIntroPlaceholder
                  teacherName={teacher.full_name}
                  variant="inline"
                />
              )}
            </div>

            {/* About Section */}
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>📝</span> About {teacher.full_name.split(' ')[0]}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {teacher.bio_extended || teacher.bio || tierInfo?.description}
              </p>
            </div>

            {/* Teaching Philosophy */}
            {teacher.teaching_philosophy && (
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>💡</span> My Teaching Approach
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {teacher.teaching_philosophy}
                </p>
              </div>
            )}

            {/* Qualifications */}
            {teacher.qualifications && teacher.qualifications.length > 0 && (
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-gray-600" />
                  Qualifications & Training
                </h3>
                <ul className="space-y-2">
                  {teacher.qualifications.map((qual, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span>{qual}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Career Progress */}
            <div className="p-6 border-b border-gray-100">
              <CareerLadder
                currentTier={teacher.tier as any}
                totalHours={teacher.hours_taught}
                retentionRate={teacher.retention_rate || 75}
                variant="horizontal"
              />
            </div>

            {/* Testimonials */}
            {testimonials.length > 0 && (
              <div className="p-6 border-b border-gray-100">
                <TestimonialsList
                  testimonials={testimonials}
                  maxVisible={3}
                  layout="stack"
                />
              </div>
            )}

            {/* Gentleness Guarantee */}
            <div className="p-6 border-b border-gray-100">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 mb-1">
                      {GENTLENESS_GUARANTEE.title}
                    </h4>
                    <p className="text-sm text-emerald-800 mb-3">
                      {GENTLENESS_GUARANTEE.description}
                    </p>
                    <ul className="space-y-1">
                      {GENTLENESS_GUARANTEE.commitments.slice(0, 3).map((commitment, i) => (
                        <li key={i} className="text-sm text-emerald-700 flex items-center gap-2">
                          <span className="text-emerald-500">✓</span>
                          {commitment}
                        </li>
                      ))}
                    </ul>
                    <a
                      href="/teachers/vetting-process"
                      className="inline-flex items-center gap-1 mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Learn about our vetting process
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Banner */}
            {teacher.vetting_badges && teacher.vetting_badges.length > 0 && (
              <div className="p-6 border-b border-gray-100">
                <TrustBanner
                  badges={teacher.vetting_badges}
                  isTalbiyahCertified={teacher.is_talbiyah_certified}
                />
              </div>
            )}

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Starting from</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">
                      £{(teacher.student_hourly_price / 2).toFixed(2)}
                    </span>
                    <span className="text-gray-500">/ 30 min</span>
                  </div>
                </div>
                <button
                  onClick={() => onBookLesson(teacher.id)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25"
                >
                  Book with {teacher.full_name.split(' ')[0]}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
