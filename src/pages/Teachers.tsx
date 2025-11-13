import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, LogOut, User, ShoppingCart, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../contexts/CartContext';
import CartDrawer from '../components/CartDrawer';
import TalbiyahBot from '../components/TalbiyahBot';

interface Teacher {
  id: string;
  user_id: string;
  bio: string;
  hourly_rate: number;
  full_name: string;
  gender: string | null;
}

interface Subject {
  id: string;
  name: string;
}

export default function Teachers() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cartCount } = useCart();
  const [user, setUser] = useState<any>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
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
        console.log(`🔍 Auto-selecting subject by ID: ${subjectById.name}`);
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
          console.log(`🔍 Auto-selecting subject filter: ${subject.name} (from URL parameter: ${subjectParam})`);
          setSelectedSubjects([subject.id]);
        }
      }
    }
  }, [searchParams, subjects]);

  async function fetchTeachers() {
    setLoading(true);
    try {
      // First get approved teachers
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select(`
          id,
          user_id,
          bio,
          hourly_rate,
          profiles!teacher_profiles_user_id_fkey (
            full_name,
            gender
          )
        `)
        .eq('status', 'approved');

      if (error) throw error;

      // Get teachers who have availability set (with is_available = true)
      const { data: availabilityData } = await supabase
        .from('teacher_availability')
        .select('teacher_id')
        .eq('is_available', true);

      const teachersWithAvailability = new Set(availabilityData?.map(a => a.teacher_id) || []);

      console.log('Teachers with availability:', Array.from(teachersWithAvailability));

      // Filter to only include teachers with availability (using teacher profile ID, not user_id)
      const teachersData = data
        ?.filter((teacher: any) => {
          const hasAvailability = teachersWithAvailability.has(teacher.id);
          console.log(`Teacher ${teacher.profiles?.full_name} (ID: ${teacher.id}): has availability = ${hasAvailability}`);
          return hasAvailability;
        })
        .map((teacher: any) => ({
          id: teacher.id,
          user_id: teacher.user_id,
          bio: teacher.bio,
          hourly_rate: teacher.hourly_rate,
          full_name: teacher.profiles?.full_name || 'Unknown Teacher',
          gender: teacher.profiles?.gender || null
        })) || [];

      console.log('Fetched teachers:', teachersData);
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

      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  }

  async function applyFilters() {
    console.log('=== TEACHERS FILTER DEBUG ===');
    console.log('Total teachers loaded:', teachers.length);
    console.log('Selected subjects:', selectedSubjects);
    console.log('Selected genders:', selectedGenders);

    let filtered = [...teachers];

    if (selectedSubjects.length > 0) {
      // Get all subjects for name/ID mapping
      const { data: allSubjectsData } = await supabase
        .from('subjects')
        .select('id, name');

      const subjectIdToName = new Map(allSubjectsData?.map(s => [s.id, s.name]) || []);
      const subjectNameToId = new Map(allSubjectsData?.map(s => [s.name.toLowerCase(), s.id]) || []);

      const selectedSubjectNames = selectedSubjects.map(id => subjectIdToName.get(id)).filter(Boolean) as string[];
      console.log('Selected subject IDs:', selectedSubjects);
      console.log('Selected subject names:', selectedSubjectNames);

      // Get teachers who have availability with these subjects
      const { data: availabilityWithSubjects, error } = await supabase
        .from('teacher_availability')
        .select('teacher_id, subjects')
        .eq('is_available', true);

      console.log('Availability with subjects query result:', availabilityWithSubjects);

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

        console.log('Teacher IDs with selected subjects:', Array.from(teacherIdsWithSubjects));
        filtered = filtered.filter(teacher => teacherIdsWithSubjects.has(teacher.id));
        console.log('Filtered teachers after subject filter:', filtered.length);
      }
    }

    if (selectedGenders.length > 0) {
      console.log('Teachers before gender filter:', filtered.map(t => ({ name: t.full_name, gender: t.gender })));
      filtered = filtered.filter(teacher =>
        teacher.gender && selectedGenders.includes(teacher.gender)
      );
      console.log('Filtered teachers after gender filter:', filtered.length);
      console.log('Teachers after gender filter:', filtered.map(t => ({ name: t.full_name, gender: t.gender })));
    }

    console.log('Final filtered teachers:', filtered);
    console.log('===========================');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 w-full bg-white backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {searchParams.get('subject') && (
              <button
                onClick={() => navigate('/subjects')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back to Subjects</span>
              </button>
            )}
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <BookOpen className="w-7 h-7 text-emerald-500" />
              <span className="text-2xl font-semibold text-gray-900">Talbiyah.ai</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2"
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Find a Teacher</h1>
            <p className="text-lg text-gray-600">
              Connect with experienced, approved teachers for personalized learning
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Subject</h3>
                  <div className="space-y-2">
                    {subjects.map((subject) => (
                      <label key={subject.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSubjects.includes(subject.id)}
                          onChange={() => handleSubjectToggle(subject.id)}
                          className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700">{subject.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Gender</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGenders.includes('male')}
                        onChange={() => handleGenderToggle('male')}
                        className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Male</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGenders.includes('female')}
                        onChange={() => handleGenderToggle('female')}
                        className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Female</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredTeachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {teacher.full_name}
                          </h3>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {teacher.bio || 'No bio available'}
                      </p>

                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">From</div>
                            <span className="text-emerald-600 font-semibold text-lg">
                              £7.50 / 30 min
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => navigate(`/teacher/${teacher.id}`)}
                            className="px-4 py-2 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium transition"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => {
                              const subjectParam = searchParams.get('subject');
                              navigate(`/teacher/${teacher.id}/book${subjectParam ? `?subject=${subjectParam}` : ''}`);
                            }}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          navigate('/checkout');
        }}
      />
      <TalbiyahBot />
    </div>
  );
}
