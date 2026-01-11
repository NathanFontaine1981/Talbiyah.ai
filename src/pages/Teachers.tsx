import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { BookOpen, LogOut, User, ShoppingCart, ChevronLeft, ChevronRight, Star, Clock, Award, ThumbsUp, UserPlus, X, Check, Shield } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../contexts/CartContext';
import CartDrawer from '../components/CartDrawer';
import { TeacherProfileModal, GentlenessBadge } from '../components/teachers';

interface Teacher {
  id: string;
  user_id: string;
  bio: string;
  hourly_rate: number;
  full_name: string;
  gender: string | null;
  avatar_url: string | null;
  tier: string;
  tier_name: string;
  tier_icon: string;
  student_hourly_price: number;
  hours_taught: number;
  average_rating: number;
  completed_lessons: number;
  rating_avg: number;
  rating_count: number;
  thumbs_up_percentage: number;
  total_feedback: number;
}

interface Subject {
  id: string;
  name: string;
}

export default function Teachers() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cartCount } = useCart();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Add to My Teachers state
  const [addTeacherModalOpen, setAddTeacherModalOpen] = useState(false);
  const [selectedTeacherForAdd, setSelectedTeacherForAdd] = useState<Teacher | null>(null);
  const [selectedSubjectForAdd, setSelectedSubjectForAdd] = useState<string>('');
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [myTeacherIds, setMyTeacherIds] = useState<Set<string>>(new Set());
  const [studentProfileId, setStudentProfileId] = useState<string | null>(null);

  // Profile modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedTeacherForProfile, setSelectedTeacherForProfile] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const TEACHERS_PER_PAGE = 9;

  // Calculate paginated teachers
  const paginatedTeachers = useMemo(() => {
    const startIndex = (currentPage - 1) * TEACHERS_PER_PAGE;
    return filteredTeachers.slice(startIndex, startIndex + TEACHERS_PER_PAGE);
  }, [filteredTeachers, currentPage]);

  const totalPages = Math.ceil(filteredTeachers.length / TEACHERS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSubjects, selectedGenders]);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        setUser(null);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, []);

  // Fetch student's existing teacher relationships
  useEffect(() => {
    async function fetchMyTeachers() {
      if (!user) {
        setMyTeacherIds(new Set());
        setStudentProfileId(null);
        return;
      }

      try {
        // First get the profile to check roles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, roles')
          .eq('id', user.id)
          .single();

        // Allow students and parents to add teachers
        // (anyone who is not a teacher-only user)
        const isTeacherOnly = profileData?.roles?.length === 1 && profileData.roles.includes('teacher');
        if (!profileData || isTeacherOnly) {
          return;
        }

        // Get the learner ID (student_teacher_relationships uses learner_id as student_id)
        const { data: learnerData } = await supabase
          .from('learners')
          .select('id')
          .eq('parent_id', user.id)
          .maybeSingle();

        if (learnerData) {
          setStudentProfileId(learnerData.id);

          // Get existing teacher relationships
          const { data: relationships } = await supabase
            .from('student_teacher_relationships')
            .select('teacher_id')
            .eq('student_id', learnerData.id);

          if (relationships) {
            setMyTeacherIds(new Set(relationships.map(r => r.teacher_id)));
          }
        } else {
          // No learner record yet - still allow adding teachers (will create learner on first add)
          setStudentProfileId(user.id);
        }
      } catch (error) {
        console.error('Error fetching my teachers:', error);
      }
    }

    fetchMyTeachers();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [teachers, selectedSubjects, selectedGenders]);

  // Auto-select subject from query parameter
  useEffect(() => {
    const subjectParam = searchParams.get('subject');
    if (subjectParam && subjects.length > 0 && selectedSubjects.length === 0) {
      // First check if it's a UUID (direct subject ID)
      const subjectById = subjects.find(s => s.id === subjectParam);
      if (subjectById) {
        setSelectedSubjects([subjectById.id]);
        return;
      }

      // Fall back to legacy subject filter names
      const subjectMap: Record<string, string> = {
        'quran': 'Quran with Understanding',
        'arabic': 'Arabic Language',
        'islamic': 'Islamic Studies'
      };

      const subjectName = subjectMap[subjectParam.toLowerCase()];
      if (subjectName) {
        const subject = subjects.find(s => s.name.toLowerCase().includes(subjectName.toLowerCase()));
        if (subject) {
          setSelectedSubjects([subject.id]);
        }
      }
    }
  }, [searchParams, subjects]);

  async function fetchTeachers() {
    setLoading(true);
    try {
      // Get teachers with tier stats from the view
      const { data, error } = await supabase
        .from('teacher_tier_stats')
        .select(`
          teacher_id,
          tier,
          tier_name,
          tier_icon,
          teacher_hourly_rate,
          student_hourly_price,
          hours_taught,
          average_rating,
          completed_lessons
        `);

      if (error) throw error;

      // Get rating summary for all teachers
      const { data: ratingData } = await supabase
        .from('teacher_rating_summary')
        .select(`
          teacher_id,
          avg_rating,
          total_detailed_ratings,
          thumbs_up_percentage,
          total_quick_feedback
        `);

      // Get teacher profile and user data
      const { data: profilesData } = await supabase
        .from('teacher_profiles')
        .select(`
          id,
          user_id,
          bio,
          status,
          profiles!teacher_profiles_user_id_fkey (
            full_name,
            gender,
            avatar_url
          )
        `)
        .eq('status', 'approved');

      // Get teachers who have availability set (with is_available = true)
      const { data: availabilityData } = await supabase
        .from('teacher_availability')
        .select('teacher_id')
        .eq('is_available', true);

      const teachersWithAvailability = new Set(availabilityData?.map(a => a.teacher_id) || []);

      // Merge the data
      const teachersMap = new Map(data?.map(t => [t.teacher_id, t]) || []);
      const ratingsMap = new Map(ratingData?.map(r => [r.teacher_id, r]) || []);

      const teachersData = profilesData
        ?.filter((teacher: any) => {
          const hasAvailability = teachersWithAvailability.has(teacher.id);
          return hasAvailability && teachersMap.has(teacher.id);
        })
        .map((teacher: any) => {
          const tierStats = teachersMap.get(teacher.id);
          const ratingStats = ratingsMap.get(teacher.id);
          return {
            id: teacher.id,
            user_id: teacher.user_id,
            bio: teacher.bio,
            hourly_rate: tierStats?.teacher_hourly_rate || 0,
            full_name: teacher.profiles?.full_name || 'Unknown Teacher',
            gender: teacher.profiles?.gender || null,
            avatar_url: teacher.profiles?.avatar_url || null,
            tier: tierStats?.tier || 'newcomer',
            tier_name: tierStats?.tier_name || 'Newcomer',
            tier_icon: tierStats?.tier_icon || '🥉',
            student_hourly_price: tierStats?.student_hourly_price || 15,
            hours_taught: tierStats?.hours_taught || 0,
            average_rating: tierStats?.average_rating || 0,
            completed_lessons: tierStats?.completed_lessons || 0,
            rating_avg: ratingStats?.avg_rating || 0,
            rating_count: ratingStats?.total_detailed_ratings || 0,
            thumbs_up_percentage: ratingStats?.thumbs_up_percentage || 0,
            total_feedback: ratingStats?.total_quick_feedback || 0
          };
        }) || [];

      setTeachers(teachersData);
      // Initialize filtered teachers with all teachers if no filters applied
      if (selectedSubjects.length === 0 && selectedGenders.length === 0) {
        setFilteredTeachers(teachersData);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');

      if (error) throw error;

      // Only show Quran and Arabic subjects for now
      const allowedSubjects = ['quran', 'arabic'];
      const filteredSubjects = (data || []).filter(subject =>
        allowedSubjects.some(allowed =>
          subject.name.toLowerCase().includes(allowed)
        )
      );

      setSubjects(filteredSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  }

  async function applyFilters() {
    let filtered = [...teachers];

    if (selectedSubjects.length > 0) {
      // Get all subjects for name/ID mapping
      const { data: allSubjectsData } = await supabase
        .from('subjects')
        .select('id, name');

      const subjectIdToName = new Map(allSubjectsData?.map(s => [s.id, s.name]) || []);

      const selectedSubjectNames = selectedSubjects.map(id => subjectIdToName.get(id)).filter(Boolean) as string[];

      // Get teachers who have availability with these subjects
      const { data: availabilityWithSubjects, error } = await supabase
        .from('teacher_availability')
        .select('teacher_id, subjects')
        .eq('is_available', true);

      if (!error && availabilityWithSubjects) {
        const teacherIdsWithSubjects = new Set<string>();

        availabilityWithSubjects.forEach(avail => {
          if (avail.subjects && Array.isArray(avail.subjects)) {
            // Check if any of the subjects match (handle both ID and name formats)
            const hasMatchingSubject = avail.subjects.some((subject: string) => {
              // Check if subject is an ID (UUID format)
              if (selectedSubjects.includes(subject)) {
                return true;
              }

              // Check if subject is a name and matches selected subject names
              return selectedSubjectNames.some(selectedName =>
                subject.toLowerCase().includes(selectedName.toLowerCase()) ||
                selectedName.toLowerCase().includes(subject.toLowerCase())
              );
            });

            if (hasMatchingSubject) {
              teacherIdsWithSubjects.add(avail.teacher_id);
            }
          }
        });

        filtered = filtered.filter(teacher => teacherIdsWithSubjects.has(teacher.id));
      }
    }

    if (selectedGenders.length > 0) {
      filtered = filtered.filter(teacher =>
        teacher.gender && selectedGenders.includes(teacher.gender)
      );
    }

    setFilteredTeachers(filtered);
  }

  function handleSubjectToggle(subjectId: string) {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  }

  function handleGenderToggle(gender: string) {
    setSelectedGenders(prev =>
      prev.includes(gender)
        ? prev.filter(g => g !== gender)
        : [...prev, gender]
    );
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  function openAddTeacherModal(teacher: Teacher) {
    setSelectedTeacherForAdd(teacher);
    setSelectedSubjectForAdd('');
    setAddTeacherModalOpen(true);
  }

  async function handleAddToMyTeachers() {
    if (!studentProfileId || !selectedTeacherForAdd || !selectedSubjectForAdd) {
      return;
    }

    setAddingTeacher(true);
    try {
      const { error } = await supabase.rpc('manually_add_teacher_relationship', {
        p_student_id: studentProfileId,
        p_teacher_id: selectedTeacherForAdd.id,
        p_subject_id: selectedSubjectForAdd
      });

      if (error) throw error;

      // Update local state
      setMyTeacherIds(prev => new Set([...prev, selectedTeacherForAdd.id]));
      setAddTeacherModalOpen(false);
      setSelectedTeacherForAdd(null);
      setSelectedSubjectForAdd('');

      // Show success - could navigate to messages
      toast.success(`${selectedTeacherForAdd.full_name} has been added to your teachers! You can now message them.`);
    } catch (error: any) {
      console.error('Error adding teacher:', error);
      toast.error(error.message || 'Failed to add teacher. Please try again.');
    } finally {
      setAddingTeacher(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="fixed top-0 w-full bg-white dark:bg-gray-800 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
            ) : searchParams.get('subject') ? (
              <button
                onClick={() => navigate('/subjects')}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back to Subjects</span>
              </button>
            ) : null}
            <button
              type="button"
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition"
              onClick={() => navigate('/')}
              aria-label="Go to home page"
            >
              <BookOpen className="w-7 h-7 text-emerald-500" />
              <span className="text-2xl font-semibold text-gray-900 dark:text-white">Talbiyah.ai</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center space-x-2"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
            {user ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            {searchParams.get('subject') && (
              <button
                onClick={() => navigate('/subjects')}
                className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition mb-4 font-medium group"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 group-hover:bg-emerald-100 flex items-center justify-center transition">
                  <ChevronLeft className="w-5 h-5" />
                </div>
                <span>Back to Subject Selection</span>
              </button>
            )}
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-100 border border-emerald-300 rounded-full">
                <span className="text-emerald-600 font-semibold text-sm">Step 2 of 3: Choose Your Teacher</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Find a Teacher</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Connect with experienced, approved teachers for personalised learning
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h2>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Subject</h3>
                  <div className="space-y-2">
                    {subjects.map((subject) => (
                      <label key={subject.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSubjects.includes(subject.id)}
                          onChange={() => handleSubjectToggle(subject.id)}
                          className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-200">{subject.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Gender</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGenders.includes('male')}
                        onChange={() => handleGenderToggle('male')}
                        className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">Male</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGenders.includes('female')}
                        onChange={() => handleGenderToggle('female')}
                        className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">Female</span>
                    </label>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-gray-500">Loading teachers...</div>
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-20">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    {teachers.length === 0
                      ? 'No approved teachers available yet'
                      : 'No teachers match the selected filters'}
                  </p>
                </div>
              ) : (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedTeachers.map((teacher) => {
                    // Helper function to get tier color
                    const getTierColor = (tier: string) => {
                      switch (tier) {
                        case 'master': return 'from-purple-500 to-pink-500';
                        case 'expert': return 'from-yellow-500 to-amber-500';
                        case 'skilled': return 'from-blue-500 to-emerald-500';
                        case 'apprentice': return 'from-gray-400 to-gray-500';
                        default: return 'from-amber-700 to-amber-800';
                      }
                    };

                    const getTierBg = (tier: string) => {
                      switch (tier) {
                        case 'master': return 'bg-purple-50 border-purple-200';
                        case 'expert': return 'bg-yellow-50 border-yellow-200';
                        case 'skilled': return 'bg-blue-50 border-blue-200';
                        case 'apprentice': return 'bg-gray-50 border-gray-200';
                        default: return 'bg-amber-50 border-amber-200';
                      }
                    };

                    return (
                      <div
                        key={teacher.id}
                        className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
                      >
                        {/* Tier Badge Header */}
                        <div className={`px-4 py-2 ${getTierBg(teacher.tier)} border-b`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{teacher.tier_icon}</span>
                              <span className="font-semibold text-sm text-gray-700">{teacher.tier_name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {teacher.rating_avg > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-semibold text-gray-700">
                                    {teacher.rating_avg.toFixed(1)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({teacher.rating_count})
                                  </span>
                                </div>
                              )}
                              {teacher.total_feedback > 0 && (
                                <div className="flex items-center space-x-1 bg-green-500 px-2 py-0.5 rounded-full">
                                  <ThumbsUp className="w-3 h-3 text-white" />
                                  <span className="text-xs font-bold text-white">
                                    {teacher.thumbs_up_percentage}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          {/* Teacher Info */}
                          <div className="flex items-start space-x-4 mb-4">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 to-cyan-100 flex-shrink-0 border-2 border-emerald-200">
                              {teacher.avatar_url ? (
                                <img
                                  src={teacher.avatar_url}
                                  alt={teacher.full_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-8 h-8 text-emerald-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
                                {teacher.full_name}
                              </h3>
                              <div className="flex items-center space-x-3 text-xs text-gray-600 dark:text-gray-300">
                                {teacher.hours_taught > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{teacher.hours_taught}h taught</span>
                                  </div>
                                )}
                                {teacher.completed_lessons > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <Award className="w-3 h-3" />
                                    <span>{teacher.completed_lessons} lessons</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Gentleness Badge */}
                          <div className="mb-3">
                            <GentlenessBadge />
                          </div>

                          {/* Bio */}
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                            {teacher.bio || 'Experienced teacher ready to help you learn.'}
                          </p>

                          {/* Pricing and Actions */}
                          <div className="pt-4 border-t border-gray-100">
                            <div className="mb-4">
                              <div className="text-xs text-gray-500 mb-1">Starting from</div>
                              <div className="flex items-baseline space-x-2">
                                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-600 bg-clip-text text-transparent">
                                  £{(teacher.student_hourly_price / 2).toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-500">/ 30 min</span>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                £{teacher.student_hourly_price.toFixed(2)}/hour
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedTeacherForProfile(teacher.id);
                                    setProfileModalOpen(true);
                                  }}
                                  className="px-4 py-2.5 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-lg font-semibold transition"
                                >
                                  Profile
                                </button>
                                <button
                                  onClick={() => {
                                    const subjectParam = searchParams.get('subject');
                                    navigate(`/teacher/${teacher.id}/book${subjectParam ? `?subject=${subjectParam}` : ''}`);
                                  }}
                                  className={`px-4 py-2.5 bg-gradient-to-r ${getTierColor(teacher.tier)} text-white rounded-lg font-semibold transition hover:opacity-90 shadow-md`}
                                >
                                  Book Now
                                </button>
                              </div>
                              {/* Add to My Teachers button - only for logged-in students who don't have this teacher yet */}
                              {user && studentProfileId && !myTeacherIds.has(teacher.id) && (
                                <button
                                  onClick={() => openAddTeacherModal(teacher)}
                                  className="w-full px-4 py-2.5 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
                                >
                                  <UserPlus className="w-4 h-4" />
                                  <span>Add to My Teachers</span>
                                </button>
                              )}
                              {user && studentProfileId && myTeacherIds.has(teacher.id) && (
                                <div className="w-full px-4 py-2.5 bg-green-50 border-2 border-green-300 text-green-700 rounded-lg font-semibold flex items-center justify-center space-x-2">
                                  <Check className="w-4 h-4" />
                                  <span>In My Teachers</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first, last, current, and pages around current
                        const shouldShow =
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1;

                        const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                        const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;

                        if (showEllipsisBefore || showEllipsisAfter) {
                          return <span key={page} className="px-2 text-gray-400">...</span>;
                        }

                        if (!shouldShow) return null;

                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg font-medium transition ${
                              currentPage === page
                                ? 'bg-emerald-500 text-white'
                                : 'border border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <span className="ml-4 text-sm text-gray-600">
                      Showing {((currentPage - 1) * TEACHERS_PER_PAGE) + 1}-{Math.min(currentPage * TEACHERS_PER_PAGE, filteredTeachers.length)} of {filteredTeachers.length} teachers
                    </span>
                  </div>
                )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add to My Teachers Modal */}
      {addTeacherModalOpen && selectedTeacherForAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add to My Teachers</h2>
                <button
                  onClick={() => {
                    setAddTeacherModalOpen(false);
                    setSelectedTeacherForAdd(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 to-cyan-100 flex-shrink-0 border-2 border-emerald-200">
                  {selectedTeacherForAdd.avatar_url ? (
                    <img
                      src={selectedTeacherForAdd.avatar_url}
                      alt={selectedTeacherForAdd.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-emerald-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedTeacherForAdd.full_name}</h3>
                  <p className="text-sm text-gray-600">{selectedTeacherForAdd.tier_icon} {selectedTeacherForAdd.tier_name}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which subject do you want to learn from this teacher?
                </label>
                <select
                  value={selectedSubjectForAdd}
                  onChange={(e) => setSelectedSubjectForAdd(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="">Select a subject...</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700">
                  <strong>What happens next?</strong><br />
                  After adding this teacher, you'll be able to message them directly to discuss your learning goals before booking any lessons.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setAddTeacherModalOpen(false);
                    setSelectedTeacherForAdd(null);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddToMyTeachers}
                  disabled={!selectedSubjectForAdd || addingTeacher}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-semibold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {addingTeacher ? (
                    <span>Adding...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Add Teacher</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          navigate('/checkout');
        }}
      />

      {/* Teacher Profile Modal */}
      {selectedTeacherForProfile && (
        <TeacherProfileModal
          teacherId={selectedTeacherForProfile}
          isOpen={profileModalOpen}
          onClose={() => {
            setProfileModalOpen(false);
            setSelectedTeacherForProfile(null);
          }}
          onBookLesson={(teacherId) => {
            setProfileModalOpen(false);
            const subjectParam = searchParams.get('subject');
            navigate(`/teacher/${teacherId}/book${subjectParam ? `?subject=${subjectParam}` : ''}`);
          }}
        />
      )}
    </div>
  );
}
