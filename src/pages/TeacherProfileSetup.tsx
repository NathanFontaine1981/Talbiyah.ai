import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, MapPin, Calendar, Award, FileText, Save, CheckCircle, Loader2 } from 'lucide-react';
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
    hourly_rate: '15.00',
  });

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
        .select('bio, education_level, hourly_rate')
        .eq('user_id', user.id)
        .maybeSingle();

      if (teacherProfile) {
        setFormData(prev => ({
          ...prev,
          bio: teacherProfile.bio || '',
          education_level: teacherProfile.education_level || '',
          hourly_rate: teacherProfile.hourly_rate || '15.00',
        }));
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

      // Round hourly rate to 2 decimal places to avoid floating-point precision issues
      const hourlyRateRounded = Math.round(parseFloat(formData.hourly_rate) * 100) / 100;

      if (existingTeacher) {
        const { error: teacherError } = await supabase
          .from('teacher_profiles')
          .update({
            bio: formData.bio || null,
            education_level: formData.education_level || null,
            hourly_rate: hourlyRateRounded,
            status: 'pending_approval',
          })
          .eq('user_id', user.id);

        if (teacherError) throw teacherError;
      } else {
        const { error: teacherError } = await supabase
          .from('teacher_profiles')
          .insert({
            user_id: user.id,
            bio: formData.bio || null,
            education_level: formData.education_level || null,
            hourly_rate: hourlyRateRounded,
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-lg z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-7 h-7 text-cyan-400" />
            <span className="text-2xl font-bold text-white">Talbiyah.ai</span>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl mb-4">
              <User className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Complete Your Teacher Profile</h1>
            <p className="text-slate-400 text-lg">
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
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-cyan-400" />
                <span>Basic Information</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Gender <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="e.g., London, UK"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Timezone <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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

            <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <Award className="w-5 h-5 text-cyan-400" />
                <span>Teaching Information</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Tell students about your teaching experience and qualifications..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Education Level
                  </label>
                  <select
                    value={formData.education_level}
                    onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Hourly Rate (GBP)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="5"
                    max="100"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="15.00"
                  />
                  <p className="text-xs text-slate-500 mt-1">Platform fee of £10 applies to all lessons</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-semibold transition shadow-lg shadow-cyan-500/25 disabled:opacity-50 flex items-center space-x-2"
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
