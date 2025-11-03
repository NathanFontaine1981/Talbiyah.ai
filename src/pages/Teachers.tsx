import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, User, ShoppingCart } from 'lucide-react';
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

  async function fetchTeachers() {
    setLoading(true);
    try {
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

      const teachersData = data?.map((teacher: any) => ({
        id: teacher.id,
        user_id: teacher.user_id,
        bio: teacher.bio,
        hourly_rate: teacher.hourly_rate,
        full_name: teacher.profiles?.full_name || 'Unknown Teacher',
        gender: teacher.profiles?.gender || null
      })) || [];

      setTeachers(teachersData);
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
    let filtered = [...teachers];

    if (selectedSubjects.length > 0) {
      const { data: teacherSubjects, error } = await supabase
        .from('teacher_subjects')
        .select('teacher_id, subject_id')
        .in('subject_id', selectedSubjects);

      if (!error && teacherSubjects) {
        const teacherIdsWithSubjects = teacherSubjects.map(ts => ts.teacher_id);
        filtered = filtered.filter(teacher => teacherIdsWithSubjects.includes(teacher.id));
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 w-full bg-white backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <BookOpen className="w-7 h-7 text-emerald-500" />
            <span className="text-2xl font-semibold text-gray-900">Talbiyah.ai</span>
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
          <div className="mb-12">
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
                        checked={selectedGenders.includes('Male')}
                        onChange={() => handleGenderToggle('Male')}
                        className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Male</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGenders.includes('Female')}
                        onChange={() => handleGenderToggle('Female')}
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
                        <button
                          onClick={() => navigate(`/teacher/${teacher.id}`)}
                          className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition"
                        >
                          View Profile & Book
                        </button>
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
