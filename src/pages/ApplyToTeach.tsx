import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Upload, User, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import VideoRecorder from '../components/VideoRecorder';

interface Subject {
  id: string;
  name: string;
}

export default function ApplyToTeach() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    date_of_birth: '',
    location: '',
    timezone: '',
    gender: '',
    about_me: '',
    education_level: '',
    hourly_rate: ''
  });

  const islamicInterests = [
    'Quran Recitation',
    'Tajweed',
    'Quran Memorization',
    'Arabic Grammar',
    'Fiqh',
    'Hadith Studies',
    'Islamic History',
    'Aqeedah'
  ];

  const educationLevels = [
    'High School',
    'Bachelor\'s Degree',
    'Master\'s Degree',
    'PhD',
    'Islamic Seminary (Madrasah)',
    'Ijazah Certification',
    'Other'
  ];

  useEffect(() => {
    loadUserProfile();
  }, []);

  async function loadUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, timezone')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          full_name: profile.full_name || '',
          email: user.email || '',
          timezone: profile.timezone || ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          email: user.email || ''
        }));
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleVideoRecorded(blob: Blob) {
    setVideoBlob(blob);
  }

  function handleInterestToggle(interest: string) {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      } else {
        return [...prev, interest];
      }
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.gender) {
      setError('Please select your gender.');
      return;
    }

    if (selectedInterests.length === 0) {
      setError('Please select at least one Islamic learning interest.');
      return;
    }

    if (!formData.education_level) {
      setError('Please select your education level.');
      return;
    }

    if (!formData.hourly_rate || parseFloat(formData.hourly_rate) <= 0) {
      setError('Please enter a valid hourly rate.');
      return;
    }

    try {
      setSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      let avatarUrl = null;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) {
          console.error('Avatar upload error:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          avatarUrl = publicUrl;
        }
      }

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          gender: formData.gender,
          full_name: formData.full_name,
          timezone: formData.timezone,
          date_of_birth: formData.date_of_birth || null,
          location: formData.location || null,
          ...(avatarUrl && { avatar_url: avatarUrl })
        })
        .eq('id', user.id);

      if (profileUpdateError) throw profileUpdateError;

      let videoIntroUrl = null;

      if (videoBlob) {
        const videoFileName = `${user.id}-${Date.now()}.webm`;
        const videoFilePath = `${videoFileName}`;

        const { error: videoUploadError } = await supabase.storage
          .from('teacher_audio')
          .upload(videoFilePath, videoBlob);

        if (videoUploadError) {
          console.error('Video upload error:', videoUploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('teacher_audio')
            .getPublicUrl(videoFilePath);
          videoIntroUrl = publicUrl;
        }
      }

      const { error: profileError } = await supabase
        .from('teacher_profiles')
        .insert({
          user_id: user.id,
          bio: formData.about_me || null,
          hourly_rate: parseFloat(formData.hourly_rate),
          video_intro_url: videoIntroUrl,
          education_level: formData.education_level,
          islamic_learning_interests: selectedInterests,
          status: 'pending_approval'
        });

      if (profileError) throw profileError;

      setSuccessMessage('Success! Your application has been submitted. Please complete your profile.');

      setTimeout(() => {
        navigate('/teacher/setup-profile');
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Talbiyah.ai</h1>
              <p className="text-sm text-gray-600">Teacher Application</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2 text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Apply to Teach at Talbiyah.ai</h2>
          <p className="text-gray-600">Complete your teacher profile and application</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm font-medium">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                Profile Information
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Upload Photo
                  </label>
                  <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium cursor-pointer transition flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Choose Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                Personal Details
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, Country"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Timezone
                    </label>
                    <input
                      type="text"
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      placeholder="e.g. UTC, EST"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Gender
                  </label>
                  <div className="flex space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === 'male'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-gray-700">Male</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === 'female'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-gray-700">Female</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    About Me
                  </label>
                  <textarea
                    value={formData.about_me}
                    onChange={(e) => setFormData({ ...formData, about_me: e.target.value })}
                    rows={5}
                    placeholder="Tell us about yourself, your teaching experience, and what makes you passionate about teaching Islamic studies..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                Educational Background
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Education Level
                  </label>
                  <select
                    value={formData.education_level}
                    onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select your highest education level</option>
                    {educationLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Islamic Learning Interests
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {islamicInterests.map(interest => (
                      <label
                        key={interest}
                        className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedInterests.includes(interest)}
                          onChange={() => handleInterestToggle(interest)}
                          className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 rounded"
                        />
                        <span className="text-gray-700">{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                Your Teaching Offer
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Your Requested Hourly Rate (in GBP)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    placeholder="e.g. 25.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Video Introduction (Optional)
                  </label>
                  <VideoRecorder
                    onVideoRecorded={handleVideoRecorded}
                    maxDurationSeconds={120}
                  />
                </div>
              </div>
            </section>

            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting Application...' : 'Save and Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
