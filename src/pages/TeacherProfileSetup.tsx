import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, MapPin, Calendar, Award, FileText, Save, CheckCircle, Loader2, Clock, AlertCircle, ArrowRight, Globe, Languages, X, PoundSterling, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { COUNTRIES, UK_CITIES, LANGUAGES, isUKCountry, getCitiesForCountry } from '../data/locationConstants';
import { TEACHER_TYPES, type TeacherType, type PaymentCollection } from '../constants/teacherConstants';

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
    country: '',
    city: '',
    languages: ['English'] as string[],
    timezone: 'UTC',
    bio: '',
    education_level: '',
    teacher_type: 'platform' as TeacherType,
    independent_rate: '',
    payment_collection: 'external' as PaymentCollection,
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
        .select('full_name, gender, date_of_birth, location, country, city, languages, timezone')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          full_name: profile.full_name || '',
          gender: profile.gender || '',
          date_of_birth: profile.date_of_birth || '',
          location: profile.location || '',
          country: profile.country || '',
          city: profile.city || '',
          languages: profile.languages || ['English'],
          timezone: profile.timezone || 'UTC',
        }));
      }

      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id, bio, education_level, teacher_type, independent_rate, payment_collection')
        .eq('user_id', user.id)
        .maybeSingle();

      if (teacherProfile) {
        setFormData(prev => ({
          ...prev,
          bio: teacherProfile.bio || '',
          education_level: teacherProfile.education_level || '',
          teacher_type: teacherProfile.teacher_type || 'platform',
          independent_rate: teacherProfile.independent_rate ? String(teacherProfile.independent_rate) : '',
          payment_collection: teacherProfile.payment_collection || 'external',
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

    if (!formData.full_name || !formData.gender || !formData.timezone || !formData.country || formData.languages.length === 0) {
      setError('Please fill in all required fields (name, gender, country, languages, timezone)');
      setSaving(false);
      return;
    }

    // UK teachers must select a city
    if (isUKCountry(formData.country) && !formData.city) {
      setError('Please select your city (required for UK teachers)');
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
          country: formData.country || null,
          city: formData.city || null,
          languages: formData.languages.length > 0 ? formData.languages : ['English'],
          timezone: formData.timezone,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { data: existingTeacher } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const teacherTypeFields = {
        teacher_type: formData.teacher_type,
        ...(formData.teacher_type === 'independent' ? {
          independent_rate: formData.independent_rate ? parseFloat(formData.independent_rate) : null,
          payment_collection: formData.payment_collection,
        } : {
          independent_rate: null,
          payment_collection: 'external',
        }),
      };

      if (existingTeacher) {
        const { error: teacherError } = await supabase
          .from('teacher_profiles')
          .update({
            bio: formData.bio || null,
            education_level: formData.education_level || null,
            status: 'pending_approval',
            ...teacherTypeFields,
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
            current_tier: formData.teacher_type === 'independent' ? undefined : 'newcomer',
            status: 'pending_approval',
            ...teacherTypeFields,
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

                {/* Country and City */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      <Globe className="w-4 h-4 inline mr-1" />
                      Country <span className="text-red-400">*</span>
                    </label>
                    <select
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value, city: '' })}
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Select your country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      City {isUKCountry(formData.country) && <span className="text-red-400">*</span>}
                    </label>
                    {isUKCountry(formData.country) ? (
                      <select
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Select your city</option>
                        {UK_CITIES.map((city) => (
                          <option key={city.name} value={city.name}>
                            {city.name} {city.region && `(${city.region})`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Enter your city"
                      />
                    )}
                  </div>
                </div>

                {/* UK Teacher Group Lesson Eligibility Note */}
                {isUKCountry(formData.country) && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <p className="text-sm text-emerald-800">
                      <span className="font-semibold">UK Teacher Benefits:</span> As a UK-based teacher, you may be eligible
                      to conduct group lessons (Islamic Studies, Quran Tadabbur, Seerah) earning £16-20/hour.
                      This is subject to admin approval.
                    </p>
                  </div>
                )}

                {/* Languages Multi-Select */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    <Languages className="w-4 h-4 inline mr-1" />
                    Languages Spoken <span className="text-red-400">*</span>
                  </label>
                  <div className="space-y-2">
                    <select
                      onChange={(e) => {
                        const lang = e.target.value;
                        if (lang && !formData.languages.includes(lang)) {
                          setFormData({ ...formData, languages: [...formData.languages, lang] });
                        }
                        e.target.value = '';
                      }}
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Add a language...</option>
                      {LANGUAGES.filter(lang => !formData.languages.includes(lang)).map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                    {formData.languages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.languages.map((lang) => (
                          <span
                            key={lang}
                            className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm"
                          >
                            {lang}
                            <button
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                languages: formData.languages.filter(l => l !== lang)
                              })}
                              className="ml-2 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {formData.languages.length === 0 && (
                      <p className="text-xs text-amber-600">Please add at least one language</p>
                    )}
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

            {/* Teacher Type Selection */}
            <div className="bg-white backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>How do you teach?</span>
              </h2>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {/* Platform Teacher */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, teacher_type: 'platform' })}
                  className={`p-5 rounded-xl text-left transition border-2 ${
                    formData.teacher_type === 'platform'
                      ? 'bg-emerald-50 border-emerald-500'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{TEACHER_TYPES.platform.icon}</span>
                    <span className="font-bold text-gray-900">{TEACHER_TYPES.platform.name}</span>
                  </div>
                  <p className="text-sm text-gray-500">{TEACHER_TYPES.platform.description}</p>
                  {formData.teacher_type === 'platform' && (
                    <div className="mt-3 flex items-center space-x-1 text-emerald-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}
                </button>

                {/* Independent Teacher */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, teacher_type: 'independent' })}
                  className={`p-5 rounded-xl text-left transition border-2 ${
                    formData.teacher_type === 'independent'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{TEACHER_TYPES.independent.icon}</span>
                    <span className="font-bold text-gray-900">{TEACHER_TYPES.independent.name}</span>
                  </div>
                  <p className="text-sm text-gray-500">{TEACHER_TYPES.independent.description}</p>
                  {formData.teacher_type === 'independent' && (
                    <div className="mt-3 flex items-center space-x-1 text-blue-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Independent Teacher Settings */}
              {formData.teacher_type === 'independent' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <PoundSterling className="w-4 h-4 inline mr-1" />
                      Your Hourly Rate (GBP) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                      <input
                        type="number"
                        step="0.50"
                        min="5"
                        max="100"
                        value={formData.independent_rate}
                        onChange={(e) => setFormData({ ...formData, independent_rate: e.target.value })}
                        className="w-full pl-8 pr-4 py-3 bg-white border border-blue-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="18.00"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This is what your students pay you per hour</p>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Payment collected via Talbiyah</p>
                    <p className="text-xs text-blue-600 mt-1">Students pay through our platform and we transfer earnings to you</p>
                  </div>
                </div>
              )}
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

                {/* Hourly rate info - only for platform teachers */}
                {formData.teacher_type === 'platform' && (
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
                      className="text-xs text-emerald-600 hover:text-emerald-700 mt-2 inline-block"
                    >
                      Learn about teacher tiers →
                    </a>
                  </div>
                )}
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
