import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, User, ArrowLeft, Check, Bell, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import VideoRecorder from '../components/VideoRecorder';
import TalbiyahLogo from '../components/TalbiyahLogo';

export default function AccountSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingEducation, setSavingEducation] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    first_name: '',
    surname: '',
    email: '',
    avatar_url: ''
  });

  const [personalData, setPersonalData] = useState({
    date_of_birth: '',
    location: '',
    timezone: '',
    about_me: '',
    gender: '',
    phone_number: '',
    phone_country_code: '+44'
  });

  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [teacherData, setTeacherData] = useState({
    education_level: '',
    hourly_rate: ''
  });

  const islamicInterests = [
    'Quran Recitation',
    'Tajweed',
    'Quran Memorisation',
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
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        const nameParts = (profile.full_name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const surname = nameParts.slice(1).join(' ') || '';
        setProfileData({
          first_name: firstName,
          surname: surname,
          email: user.email || '',
          avatar_url: profile.avatar_url || ''
        });

        setPersonalData({
          date_of_birth: profile.date_of_birth || '',
          location: profile.location || '',
          timezone: profile.timezone || '',
          about_me: profile.bio || '',
          gender: profile.gender || '',
          phone_number: profile.phone_number || '',
          phone_country_code: profile.phone_country_code || '+44'
        });

        if (profile.avatar_url) {
          setAvatarPreview(profile.avatar_url);
        }

        // Load email notification preference (default to true if not set)
        setEmailNotifications(profile.email_notifications !== false);

        const userRoles = profile.roles || [];
        const teacherRole = userRoles.includes('teacher');
        setIsTeacher(teacherRole);

        if (teacherRole) {
          const { data: teacherProfile } = await supabase
            .from('teacher_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (teacherProfile) {
            // For independent teachers, show independent_rate as their hourly rate
            const displayRate = teacherProfile.teacher_type === 'independent' && teacherProfile.independent_rate
              ? teacherProfile.independent_rate.toString()
              : teacherProfile.hourly_rate?.toString() || '';
            setTeacherData({
              education_level: teacherProfile.education_level || '',
              hourly_rate: displayRate
            });

            setSelectedInterests(teacherProfile.islamic_teaching_interests || []);
            setExistingVideoUrl(teacherProfile.video_intro_url || null);
          }
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data.');
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

  function handleInterestToggle(interest: string) {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      } else {
        return [...prev, interest];
      }
    });
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      setSavingProfile(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      let avatarUrl = profileData.avatar_url;

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

      const fullName = [profileData.first_name.trim(), profileData.surname.trim()].filter(Boolean).join(' ');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // If email changed, update via Supabase Auth (sends confirmation to new email)
      const emailChanged = profileData.email.trim().toLowerCase() !== (user.email || '').toLowerCase();
      if (emailChanged) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileData.email.trim()
        });
        if (emailError) throw emailError;

        setSuccessMessage('Profile saved! A confirmation link has been sent to your new email address. Please check your inbox to complete the email change.');
        setTimeout(() => setSuccessMessage(''), 8000);
      } else {
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      setSavingDetails(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          date_of_birth: personalData.date_of_birth || null,
          location: personalData.location || null,
          timezone: personalData.timezone || null,
          gender: personalData.gender || null,
          phone_number: personalData.phone_number || null,
          phone_country_code: personalData.phone_country_code || null
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      if (isTeacher) {
        const { error: teacherUpdateError } = await supabase
          .from('teacher_profiles')
          .update({
            bio: personalData.about_me || null
          })
          .eq('user_id', user.id);

        if (teacherUpdateError) throw teacherUpdateError;
      }

      setSuccessMessage('Personal details updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving details:', err);
      setError(err.message || 'Failed to save details.');
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setSavingPassword(true);

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.new_password
      });

      if (updateError) throw updateError;

      setPasswordData({ new_password: '', confirm_password: '' });
      setSuccessMessage('Password updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  }

  function handleVideoRecorded(blob: Blob) {
    setVideoBlob(blob);
  }

  async function handleSaveEducation(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      setSavingEducation(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      let videoIntroUrl = existingVideoUrl;

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

      // Round hourly rate to 2 decimal places to avoid floating-point precision issues
      const hourlyRateRounded = teacherData.hourly_rate
        ? Math.round(parseFloat(teacherData.hourly_rate) * 100) / 100
        : null;

      // Check if independent teacher to also update independent_rate
      const { data: currentProfile } = await supabase
        .from('teacher_profiles')
        .select('teacher_type')
        .eq('user_id', user.id)
        .single();

      const updateData: Record<string, any> = {
        education_level: teacherData.education_level || null,
        islamic_teaching_interests: selectedInterests,
        hourly_rate: hourlyRateRounded,
        video_intro_url: videoIntroUrl
      };

      // For independent teachers, sync independent_rate with hourly_rate
      if (currentProfile?.teacher_type === 'independent') {
        updateData.independent_rate = hourlyRateRounded;
      }

      const { error: updateError } = await supabase
        .from('teacher_profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setExistingVideoUrl(videoIntroUrl);
      setVideoBlob(null);
      setSuccessMessage('Educational background and teaching offer updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving education:', err);
      setError(err.message || 'Failed to save educational details.');
    } finally {
      setSavingEducation(false);
    }
  }

  async function handleSaveNotifications() {
    setError('');
    setSuccessMessage('');

    try {
      setSavingNotifications(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email_notifications: emailNotifications
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccessMessage('Notification preferences updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving notification preferences:', err);
      setError(err.message || 'Failed to save notification preferences.');
    } finally {
      setSavingNotifications(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Skeleton Nav */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div>
                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-100 dark:bg-gray-600 rounded animate-pulse mt-1"></div>
              </div>
            </div>
            <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Skeleton Header */}
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-5 w-72 bg-gray-100 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
          {/* Skeleton Cards */}
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 animate-pulse">
                <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-6 pb-3 border-b border-gray-200 dark:border-gray-700"></div>
                <div className="space-y-4">
                  <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
      >
        Skip to settings
      </a>

      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TalbiyahLogo linkTo={null} />
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

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile Settings</h2>
          <p className="text-gray-600 dark:text-gray-300">Manage your account settings and preferences</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="assertive">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2" role="status" aria-live="polite">
            <Check className="w-5 h-5 text-green-600" aria-hidden="true" />
            <p className="text-green-800 text-sm font-medium">{successMessage}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              Profile Information
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Avatar
                </label>
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium cursor-pointer transition flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    <span>Change Photo</span>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="surname" className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                    Surname
                  </label>
                  <input
                    id="surname"
                    type="text"
                    value={profileData.surname}
                    onChange={(e) => setProfileData({ ...profileData, surname: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              Personal Details
            </h3>

            <form onSubmit={handleSaveDetails} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={personalData.phone_country_code}
                      onChange={(e) => setPersonalData({ ...personalData, phone_country_code: e.target.value })}
                      className="w-24 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="+44">+44</option>
                      <option value="+1">+1</option>
                      <option value="+91">+91</option>
                      <option value="+92">+92</option>
                      <option value="+966">+966</option>
                      <option value="+971">+971</option>
                      <option value="+20">+20</option>
                      <option value="+90">+90</option>
                      <option value="+60">+60</option>
                      <option value="+62">+62</option>
                      <option value="+33">+33</option>
                      <option value="+49">+49</option>
                    </select>
                    <input
                      id="phone_number"
                      type="tel"
                      value={personalData.phone_number}
                      onChange={(e) => setPersonalData({ ...personalData, phone_number: e.target.value })}
                      placeholder="7700 900000"
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                    Gender
                  </label>
                  <select
                    id="gender"
                    value={personalData.gender}
                    onChange={(e) => setPersonalData({ ...personalData, gender: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                    Date of Birth
                  </label>
                  <input
                    id="date_of_birth"
                    type="date"
                    value={personalData.date_of_birth}
                    onChange={(e) => setPersonalData({ ...personalData, date_of_birth: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={personalData.location}
                    onChange={(e) => setPersonalData({ ...personalData, location: e.target.value })}
                    placeholder="City, Country"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                    Timezone
                  </label>
                  <input
                    id="timezone"
                    type="text"
                    value={personalData.timezone}
                    onChange={(e) => setPersonalData({ ...personalData, timezone: e.target.value })}
                    placeholder="e.g. Europe/London, America/New_York"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="about_me" className="block text-sm font-medium text-gray-900 mb-2">
                  About Me
                </label>
                <textarea
                  id="about_me"
                  value={personalData.about_me}
                  onChange={(e) => setPersonalData({ ...personalData, about_me: e.target.value })}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={savingDetails}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingDetails ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              Change Password
            </h3>

            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="new_password" className="block text-sm font-medium text-gray-900 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new_password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-900 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm_password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Email Notification Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-amber-500" />
              Email Notifications
            </h3>

            <div className="space-y-6">
              <div className="flex items-start space-x-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex-shrink-0 mt-1">
                  <Mail className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">Khutbah Reflections Emails</h4>
                      <p className="text-gray-600 text-sm mt-1">
                        Receive weekly Talbiyah Insights emails with study notes from Friday khutbahs,
                        including Quranic vocabulary, hadith references, and family discussion guides.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="sr-only peer"
                        aria-label="Enable Khutbah Reflections email notifications"
                        role="switch"
                        aria-checked={emailNotifications}
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500" aria-hidden="true"></div>
                    </label>
                  </div>
                </div>
              </div>

              <p className="text-gray-500 text-sm">
                When enabled, you'll receive thoughtfully crafted reflection emails whenever new Talbiyah Insights are published.
                These are designed to help you and your family benefit from the khutbah throughout the week.
              </p>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveNotifications}
                  disabled={savingNotifications}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingNotifications ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>

          {isTeacher && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Educational Background
                </h3>

                <form onSubmit={handleSaveEducation} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Education Level
                    </label>
                    <select
                      value={teacherData.education_level}
                      onChange={(e) => setTeacherData({ ...teacherData, education_level: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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

                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={savingEducation}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingEducation ? 'Saving...' : 'Save Details'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  Your Teaching Offer
                </h3>

                <form onSubmit={handleSaveEducation} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Your Requested Hourly Rate (in GBP)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={teacherData.hourly_rate}
                      onChange={(e) => setTeacherData({ ...teacherData, hourly_rate: e.target.value })}
                      placeholder="e.g. 25.00"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Video Introduction (Optional)
                    </label>
                    <VideoRecorder
                      onVideoRecorded={handleVideoRecorded}
                      maxDurationSeconds={120}
                      existingVideoUrl={existingVideoUrl}
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={savingEducation}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingEducation ? 'Saving...' : 'Save Details'}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
