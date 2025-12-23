import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, MapPin, Calendar, Award, FileText, Save, CheckCircle, Loader2, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function TeacherProfileSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    gender: '',
    date_of_birth: '',
    location: '',
    timezone: 'UTC',
    bio: '',
    education_level: '',
  });
  const [hasAvailability, setHasAvailability] = useState(false);
  const [hasSubjects, setHasSubjects] = useState(false);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, gender, date_of_birth, location, timezone')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          full_name: profile.full_name || '',
          gender: profile.gender || '',
          date_of_birth: profile.date_of_birth || '',
          location: profile.location || '',
          timezone: profile.timezone || 'UTC',
        }));
      }

      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id, bio, education_level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (teacherProfile) {
        setFormData(prev => ({
          ...prev,
          bio: teacherProfile.bio || '',
          education_level: teacherProfile.education_level || '',
        }));

        // Check if teacher has set availability
        const { data: availability } = await supabase
          .from('teacher_availability')
          .select('id')
          .eq('teacher_id', teacherProfile.id)
          .limit(1);

        setHasAvailability((availability?.length || 0) > 0);

        // Check if teacher has set subjects
        const { data: subjects } = await supabase
          .from('teacher_subjects')
          .select('id')
          .eq('teacher_id', teacherProfile.id)
          .limit(1);

        setHasSubjects((subjects?.length || 0) > 0);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (!formData.full_name || !formData.gender || !formData.timezone) {
      setError('Please fill in all required fields');
      setSaving(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth || null,
          location: formData.location || null,
          timezone: formData.timezone,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { data: existingTeacher } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingTeacher) {
        const { error: teacherError } = await supabase
          .from('teacher_profiles')
          .update({
            bio: formData.bio || null,
            education_level: formData.education_level || null,
            status: 'pending_approval',
          })
          .eq('user_id', user.id);

        if (teacherError) throw teacherError;
      } else {
        // New teachers start at 'newcomer' tier - hourly_rate is determined by tier
        const { error: teacherError } = await supabase
          .from('teacher_profiles')
          .insert({
            user_id: user.id,
            bio: formData.bio || null,
            education_level: formData.education_level || null,
            current_tier: 'newcomer',
            status: 'pending_approval',
          });

        if (teacherError) throw teacherError;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 w-full bg-white backdrop-blur-lg z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-7 h-7 text-emerald-600" />
            <span className="text-2xl font-bold text-gray-900">Talbiyah.ai</span>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl mb-4">
              <User className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Complete Your Teacher Profile</h1>
            <p className="text-gray-500 text-lg">
              Please fill in the required information below. Your profile will be reviewed by our team before approval.
            </p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-emerald-400 font-semibold">Profile saved successfully!</p>
                <p className="text-emerald-300 text-sm">Redirecting to your dashboard...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-emerald-600" />
                <span>Basic Information</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Gender <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="e.g., London, UK"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Timezone <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="UTC">UTC (GMT+0)</option>
                    <option value="Europe/London">Europe/London (GMT+0/+1)</option>
                    <option value="America/New_York">America/New York (GMT-5/-4)</option>
                    <option value="America/Los_Angeles">America/Los Angeles (GMT-8/-7)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                    <option value="Asia/Karachi">Asia/Karachi (GMT+5)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                    <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                    <option value="Australia/Sydney">Australia/Sydney (GMT+10/+11)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <span>Teaching Information</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Tell students about your teaching experience and qualifications..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Education Level
                  </label>
                  <select
                    value={formData.education_level}
                    onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select education level</option>
                    <option value="High School">High School</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Graduate">Graduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Islamic Seminary">Islamic Seminary</option>
                    <option value="Ijazah">Ijazah</option>
                  </select>
                </div>

                {/* Note: Hourly rate is determined by teacher tier, not set manually */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold text-emerald-600">💡 Hourly Rate</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Your earnings rate is determined by your teacher tier. New teachers start at the Newcomer tier (£4/hour).
                    As you teach more hours and maintain good ratings, you'll automatically progress through tiers with higher rates (up to £8/hour).
                  </p>
                  <a
                    href="/teacher/tier-info"
                    className="text-xs text-emerald-600 hover:text-cyan-300 mt-2 inline-block"
                  >
                    Learn about teacher tiers →
                  </a>
                </div>
              </div>
            </div>

            {/* Visibility & Matching Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>Student Matching & Visibility</span>
              </h2>

              <p className="text-gray-600 text-sm mb-4">
                To appear in student searches and be matched with diagnostic assessments, you need to set your availability and subjects.
                Students are automatically matched with teachers based on schedule compatibility.
              </p>

              <div className="space-y-3">
                {/* Availability Status */}
                <div className={`flex items-center justify-between p-4 rounded-lg border ${
                  hasAvailability
                    ? 'bg-green-50 border-green-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    {hasAvailability ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    )}
                    <div>
                      <p className={`font-semibold ${hasAvailability ? 'text-green-700' : 'text-amber-700'}`}>
                        {hasAvailability ? 'Availability Set' : 'Availability Not Set'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {hasAvailability
                          ? 'Students can see when you\'re available'
                          : 'Set your availability to be matched with students'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/teacher/availability')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 transition ${
                      hasAvailability
                        ? 'bg-green-100 hover:bg-green-200 text-green-700'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    <span>{hasAvailability ? 'Edit' : 'Set Availability'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Subjects Status */}
                <div className={`flex items-center justify-between p-4 rounded-lg border ${
                  hasSubjects
                    ? 'bg-green-50 border-green-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    {hasSubjects ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    )}
                    <div>
                      <p className={`font-semibold ${hasSubjects ? 'text-green-700' : 'text-amber-700'}`}>
                        {hasSubjects ? 'Subjects Set' : 'Subjects Not Set'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {hasSubjects
                          ? 'Students can find you by subject'
                          : 'Add subjects you teach to appear in searches'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/teacher/edit-profile')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 transition ${
                      hasSubjects
                        ? 'bg-green-100 hover:bg-green-200 text-green-700'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    <span>{hasSubjects ? 'Edit' : 'Add Subjects'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {(!hasAvailability || !hasSubjects) && (
                <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Tip:</span> Teachers with complete profiles (availability + subjects)
                    are shown first to students during diagnostic assessment booking and receive more lesson requests.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-900 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-gray-900 rounded-lg font-semibold transition shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
