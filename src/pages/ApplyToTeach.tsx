import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, User, ArrowLeft, Award, FileText, Globe } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import VideoRecorder from '../components/VideoRecorder';
import { TEACHER_TYPES, type TeacherType } from '../constants/teacherConstants';
import { INSIGHTS_ADDON } from '../constants/insightsAddonPricing';
import TalbiyahLogo from '../components/TalbiyahLogo';

const UK_PATTERNS = [
  'manchester', 'london', 'birmingham', 'leeds', 'bradford', 'sheffield',
  'liverpool', 'leicester', 'nottingham', 'coventry', 'luton', 'bolton',
  'blackburn', 'glasgow', 'edinburgh', 'cardiff', 'bristol', 'newcastle',
  'uk', 'united kingdom', 'england', 'scotland', 'wales', 'northern ireland'
];

export default function ApplyToTeach() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);
  const [bioManuallyEdited, setBioManuallyEdited] = useState(false);

  // Qualifications state
  const [hasIjazah, setHasIjazah] = useState(false);
  const [hasDegree, setHasDegree] = useState(false);
  const [ijazahTypes, setIjazahTypes] = useState<string[]>([]);
  const [ijazahFiles, setIjazahFiles] = useState<File[]>([]);
  const [degreeFiles, setDegreeFiles] = useState<File[]>([]);
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    date_of_birth: '',
    location: '',
    timezone: '',
    gender: '',
    about_me: '',
    education_level: '',
    years_experience: '0',
    english_level: '',
    degree_type: '',
    teacher_type: 'platform' as TeacherType,
    independent_rate: ''
  });

  const islamicInterests = [
    'Quran Recitation',
    'Tajweed',
    'Quran Memorisation',
    'Arabic Grammar',
    'Fiqh',
    'Hadith Studies',
    'Islamic History',
    'Aqeedah',
    'New Muslims',
    'Dawah'
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

  function generateBioTemplates(interests: string[], yearsExp: string): string[] {
    const expMap: Record<string, string> = {
      '0': 'fresh enthusiasm',
      '1': 'over a year',
      '3': 'several years',
      '6': 'extensive experience',
      '11': 'over a decade',
    };
    const expText = expMap[yearsExp] || 'experience';

    const joinInterests = (items: string[]): string => {
      if (items.length === 0) return 'Islamic studies';
      if (items.length === 1) return items[0];
      if (items.length === 2) return `${items[0]} and ${items[1]}`;
      return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
    };
    const subjectText = joinInterests(interests);

    return [
      `I'm passionate about teaching ${subjectText}. With ${expText} in teaching, I focus on building a strong connection with each student and making learning enjoyable and accessible for all levels.`,
      `As an experienced educator specialising in ${subjectText}, I bring a structured and patient approach to my teaching. I believe in building strong foundations and helping students progress at their own pace.`,
      `My goal is to make ${subjectText} accessible and engaging for every learner. I tailor my teaching to each student's needs, whether they're complete beginners or looking to deepen their existing knowledge.`,
    ];
  }

  const bioTemplates = useMemo(
    () => generateBioTemplates(selectedInterests, formData.years_experience),
    [selectedInterests, formData.years_experience]
  );

  // Auto-update textarea when templates change (only if user hasn't manually edited)
  useEffect(() => {
    if (!bioManuallyEdited && selectedTemplateIndex !== null) {
      setFormData(prev => ({ ...prev, about_me: bioTemplates[selectedTemplateIndex] }));
    }
  }, [bioTemplates, bioManuallyEdited, selectedTemplateIndex]);

  useEffect(() => {
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Auto-suggest independent for UK-based locations
  const [teacherTypeManuallySet, setTeacherTypeManuallySet] = useState(false);

  useEffect(() => {
    if (teacherTypeManuallySet) return;
    const loc = formData.location.toLowerCase().trim();
    if (!loc) return;
    const isUK = UK_PATTERNS.some(p => loc.includes(p));
    if (isUK) {
      setFormData(prev => ({ ...prev, teacher_type: 'independent' }));
    }
  }, [formData.location, teacherTypeManuallySet]);

  // File validation constants
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
  const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

  // File validation function
  function validateFile(file: File, allowedTypes: string[], maxSize: number, fileType: string): void {
    if (!file) {
      throw new Error(`No ${fileType} selected`);
    }

    if (file.size > maxSize) {
      const sizeMB = (maxSize / 1024 / 1024).toFixed(0);
      throw new Error(`${fileType} too large. Maximum size: ${sizeMB}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      const typesList = allowedTypes.map(t => t.split('/')[1]).join(', ');
      throw new Error(`Invalid ${fileType} format. Allowed: ${typesList}`);
    }
  }

  // Blob validation function
  function validateBlob(blob: Blob, maxSize: number): void {
    if (!blob) {
      throw new Error('No video recorded');
    }

    if (blob.size > maxSize) {
      const sizeMB = (maxSize / 1024 / 1024).toFixed(0);
      throw new Error(`Video too large. Maximum size: ${sizeMB}MB`);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      try {
        validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, 'Avatar image');
        setAvatarFile(file);
        setError(''); // Clear any previous errors
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setError((err as Error).message);
        e.target.value = ''; // Reset file input
      }
    }
  }

  function handleVideoRecorded(blob: Blob) {
    try {
      validateBlob(blob, MAX_VIDEO_SIZE);
      setVideoBlob(blob);
      setError(''); // Clear any previous errors
    } catch (err) {
      setError((err as Error).message);
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

  function handleIjazahTypeToggle(type: string) {
    setIjazahTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File[]>>) {
    const files = e.target.files;
    if (files) {
      try {
        const fileArray = Array.from(files);

        // Validate each file
        fileArray.forEach((file, index) => {
          validateFile(file, ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE, `Document ${index + 1}`);
        });

        // If all files pass validation, set them
        setter(fileArray);
        setError(''); // Clear any previous errors
      } catch (err) {
        setError((err as Error).message);
        e.target.value = ''; // Reset file input
      }
    }
  }

  // Auto-assign tier based on qualifications
  function calculateTier(): { tier: string; tierName: string; rate: number; requiresInterview: boolean } {
    const yearsExp = parseInt(formData.years_experience) || 0;
    const hasMultipleIjazahs = ijazahTypes.length >= 2;
    const hasSingleIjazah = ijazahTypes.length >= 1;
    const isNativeEnglish = formData.english_level === 'native';
    const isFluentEnglish = formData.english_level === 'fluent';

    // Master tier: Multiple Ijazahs + Degree + Native English (requires interview)
    if (hasMultipleIjazahs && hasDegree && isNativeEnglish) {
      return { tier: 'master', tierName: 'Master', rate: 8.00, requiresInterview: true };
    }

    // Expert tier: (Ijazah OR Degree) + Fluent/Native English (requires interview)
    if ((hasSingleIjazah || hasDegree) && (isFluentEnglish || isNativeEnglish)) {
      return { tier: 'expert', tierName: 'Expert', rate: 7.00, requiresInterview: true };
    }

    // Skilled tier: 5+ years OR Teaching Certificate
    if (yearsExp >= 5 || formData.education_level.includes('Certificate')) {
      return { tier: 'skilled', tierName: 'Skilled', rate: 6.00, requiresInterview: false };
    }

    // Apprentice tier: 2-5 years experience
    if (yearsExp >= 2) {
      return { tier: 'apprentice', tierName: 'Apprentice', rate: 5.00, requiresInterview: false };
    }

    // Default: Newcomer tier
    return { tier: 'newcomer', tierName: 'Newcomer', rate: 4.00, requiresInterview: false };
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
      setError('Please select at least one Islamic teaching interest.');
      return;
    }

    if (formData.teacher_type === 'independent') {
      const rate = parseFloat(formData.independent_rate);
      if (!rate || rate <= 0) {
        setError('Please enter a valid hourly rate.');
        return;
      }
    }

    if (formData.teacher_type === 'platform' && !formData.education_level) {
      setError('Please select your education level.');
      return;
    }

    if (!formData.years_experience) {
      setError('Please select your years of teaching experience.');
      return;
    }

    if (!formData.english_level) {
      setError('Please select your English proficiency level.');
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

      // Upload certificate files
      const certificates = [];

      // Upload Ijazah certificates
      for (const file of ijazahFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-ijazah-${Date.now()}.${fileExt}`;
        const filePath = `certificates/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('teacher_audio')
          .upload(filePath, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('teacher_audio')
            .getPublicUrl(filePath);
          certificates.push({ type: 'ijazah', url: publicUrl, name: file.name });
        }
      }

      // Upload Degree certificates
      for (const file of degreeFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-degree-${Date.now()}.${fileExt}`;
        const filePath = `certificates/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('teacher_audio')
          .upload(filePath, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('teacher_audio')
            .getPublicUrl(filePath);
          certificates.push({ type: 'degree', url: publicUrl, name: file.name });
        }
      }

      // Upload other certificates
      for (const file of certificateFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-cert-${Date.now()}.${fileExt}`;
        const filePath = `certificates/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('teacher_audio')
          .upload(filePath, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('teacher_audio')
            .getPublicUrl(filePath);
          certificates.push({ type: 'other', url: publicUrl, name: file.name });
        }
      }

      // Build teacher profile fields based on type
      const isIndependent = formData.teacher_type === 'independent';
      const assignedTier = isIndependent ? null : calculateTier();

      const teacherProfileData: Record<string, unknown> = {
        user_id: user.id,
        bio: formData.about_me || null,
        video_intro_url: videoIntroUrl,
        status: 'pending_approval',
        teacher_type: formData.teacher_type,
        islamic_teaching_interests: selectedInterests,
      };

      if (isIndependent) {
        const rate = parseFloat(formData.independent_rate) || 0;
        teacherProfileData.independent_rate = rate;
        teacherProfileData.hourly_rate = rate;
        teacherProfileData.tier = null;
        teacherProfileData.payment_collection = 'platform';
      } else {
        teacherProfileData.hourly_rate = assignedTier!.rate;
        teacherProfileData.tier = assignedTier!.tier;
      }

      // Upsert teacher profile (may already exist from signup trigger)
      const { error: profileError } = await supabase
        .from('teacher_profiles')
        .upsert(teacherProfileData, { onConflict: 'user_id' });

      if (profileError) {
        console.error('Profile insertion error:', profileError);
        throw profileError;
      }

      // Pipeline-to-account bridge: check if this email matches a recruitment pipeline candidate
      try {
        const { data: pipelineCandidate } = await supabase
          .from('recruitment_pipeline')
          .select('id, assigned_tier, pay_region, expected_hourly_rate, pipeline_stage')
          .eq('email', user.email)
          .is('user_id', null)
          .single();

        if (pipelineCandidate) {
          // Get the teacher_profile id for linking
          const { data: tp } = await supabase
            .from('teacher_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          // Link the pipeline record to this user and teacher profile
          await supabase
            .from('recruitment_pipeline')
            .update({
              user_id: user.id,
              teacher_profile_id: tp?.id || null,
              pipeline_stage_updated_at: new Date().toISOString(),
            })
            .eq('id', pipelineCandidate.id);

          // Override tier/rate from pipeline data if set by admin
          const pipelineOverrides: Record<string, unknown> = {};
          if (pipelineCandidate.assigned_tier) {
            pipelineOverrides.tier = pipelineCandidate.assigned_tier;
          }
          if (pipelineCandidate.pay_region) {
            pipelineOverrides.pay_region = pipelineCandidate.pay_region;
          }
          if (pipelineCandidate.expected_hourly_rate) {
            pipelineOverrides.hourly_rate = pipelineCandidate.expected_hourly_rate;
          }

          if (Object.keys(pipelineOverrides).length > 0) {
            await supabase
              .from('teacher_profiles')
              .update(pipelineOverrides)
              .eq('user_id', user.id);
          }

          // Record the link in pipeline history
          await supabase
            .from('recruitment_pipeline_history')
            .insert({
              candidate_id: pipelineCandidate.id,
              from_stage: pipelineCandidate.pipeline_stage,
              to_stage: pipelineCandidate.pipeline_stage,
              notes: `Account created and linked (user_id: ${user.id})`,
            });
        }
      } catch (bridgeErr) {
        // Non-blocking — don't fail the application if bridge fails
        console.error('Pipeline bridge check error:', bridgeErr);
      }

      // Build success message
      let message = `Success! Your application has been submitted.\n\n`;

      if (isIndependent) {
        message += `📋 Next Steps:\nWe'll review your profile and be in touch to arrange a quick onboarding session where we'll:\n`;
        message += `• Set up your account and walk you through the platform\n`;
        message += `• Review the terms and conditions\n`;
        message += `• Answer any questions you may have\n\n`;
        message += `Please keep an eye on your email for our invitation!`;
      } else if (assignedTier!.requiresInterview) {
        message += `📞 Next Steps:\nWe will be in touch shortly to arrange an interview and induction. During this session, we'll:\n`;
        message += `• Verify your certificates and qualifications\n`;
        message += `• Go through our teaching methodology and platform\n`;
        message += `• Review the terms and conditions\n`;
        message += `• Answer any questions you may have\n\n`;
        message += `Please keep an eye on your email for our invitation!`;
      } else {
        message += `📋 Next Steps:\nYour documents are being reviewed. We will be in touch to arrange an induction where we'll:\n`;
        message += `• Go through our teaching methodology and platform\n`;
        message += `• Review the terms and conditions\n`;
        message += `• Answer any questions you may have\n\n`;
        message += `You'll receive an email once your application is approved.`;
      }

      setSuccessMessage(message);

      setTimeout(() => {
        navigate('/teacher/pending-approval');
      }, 3500);
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
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
      >
        Skip to application form
      </a>
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TalbiyahLogo linkTo={null} />
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2 text-gray-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </nav>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Apply to Teach at Talbiyah.ai</h2>
          <p className="text-gray-500">Complete your teacher profile and application</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          {error && (
            <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div role="alert" className="mb-6 p-6 bg-green-50 border-2 border-green-300 rounded-xl shadow-lg">
              <div className="text-green-800 text-sm font-medium whitespace-pre-line leading-relaxed">
                {successMessage}
              </div>
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
                    <div className="w-24 h-24 rounded-full bg-gray-200 border-2 border-gray-200 flex items-center justify-center overflow-hidden">
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
                    <label htmlFor="full-name" className="block text-sm font-medium text-gray-900 mb-2">
                      Full Name
                    </label>
                    <input
                      id="full-name"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
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
                    <label htmlFor="date-of-birth" className="block text-sm font-medium text-gray-900 mb-2">
                      Date of Birth
                    </label>
                    <input
                      id="date-of-birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-900 mb-2">
                      Location
                    </label>
                    <input
                      id="location"
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, Country"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-900 mb-2">
                      Timezone
                    </label>
                    <input
                      id="timezone"
                      type="text"
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      placeholder="e.g. UTC, EST"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <fieldset>
                  <legend className="block text-sm font-medium text-gray-900 mb-3">
                    Gender
                  </legend>
                  <div className="flex space-x-6" role="radiogroup" aria-label="Gender selection">
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
                </fieldset>

              </div>
            </section>

            {/* Teacher Type Selection */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                How would you like to teach?
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(TEACHER_TYPES) as TeacherType[]).map(type => {
                  const info = TEACHER_TYPES[type];
                  const isSelected = formData.teacher_type === type;
                  const borderColor = type === 'platform'
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-blue-500 bg-blue-50/50';

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setTeacherTypeManuallySet(true);
                        setFormData(prev => ({ ...prev, teacher_type: type }));
                      }}
                      className={`text-left p-5 rounded-xl border-2 transition hover:shadow-md ${
                        isSelected ? borderColor : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{info.icon}</span>
                        <span className="text-lg font-semibold text-gray-900">{info.name}</span>
                      </div>
                      <p className="text-sm text-gray-600">{info.description}</p>
                    </button>
                  );
                })}
              </div>

              {formData.teacher_type === 'independent' && (
                <div className="mt-5 p-5 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
                  <div>
                    <label htmlFor="independent-rate" className="block text-sm font-medium text-gray-900 mb-2">
                      Your hourly rate (&pound;) *
                    </label>
                    <input
                      id="independent-rate"
                      type="number"
                      min="1"
                      step="0.50"
                      value={formData.independent_rate}
                      onChange={(e) => setFormData({ ...formData, independent_rate: e.target.value })}
                      placeholder="e.g. 16"
                      className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Students can optionally add Talbiyah AI Insights (+&pound;{INSIGHTS_ADDON.pricePerLesson.toFixed(2)}/lesson) for recordings, AI-generated notes, and quizzes
                  </p>
                </div>
              )}
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                Educational Background
              </h3>

              <div className="space-y-6">
                <div>
                  <label htmlFor="education-level" className="block text-sm font-medium text-gray-900 mb-2">
                    Education Level
                  </label>
                  <select
                    id="education-level"
                    value={formData.education_level}
                    onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required={formData.teacher_type === 'platform'}
                  >
                    <option value="">Select your highest education level</option>
                    {educationLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Islamic Teaching Interests
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
                About You
              </h3>
              <p className="text-sm text-gray-500 mb-4 -mt-4">
                Choose a template based on your interests, then personalise it
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {bioTemplates.map((template, idx) => {
                    const labels = ['Warm & Personal', 'Credentials-Focused', 'Student-Centred'];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedTemplateIndex(idx);
                          setBioManuallyEdited(false);
                          setFormData(prev => ({ ...prev, about_me: template }));
                        }}
                        className={`text-left p-4 rounded-lg border-2 transition hover:shadow-sm ${
                          selectedTemplateIndex === idx
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="block text-sm font-semibold text-gray-900 mb-1">{labels[idx]}</span>
                        <span className="block text-xs text-gray-500 line-clamp-3">{template}</span>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <textarea
                    id="about-me"
                    value={formData.about_me}
                    onChange={(e) => {
                      setBioManuallyEdited(true);
                      setFormData({ ...formData, about_me: e.target.value });
                    }}
                    rows={5}
                    maxLength={500}
                    placeholder="Select a template above or write your own bio..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, about_me: '' }));
                        setSelectedTemplateIndex(null);
                        setBioManuallyEdited(true);
                      }}
                      className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      Or write your own
                    </button>
                    <span className="text-xs text-gray-400">
                      {formData.about_me.length} / 500
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center space-x-2">
                <Award className="w-6 h-6 text-emerald-500" />
                <span>Qualifications & Experience</span>
              </h3>

              <div className="space-y-6">
                {/* Years of Experience */}
                <div>
                  <label htmlFor="years-experience" className="block text-sm font-medium text-gray-900 mb-2">
                    Years of Teaching Experience *
                  </label>
                  <select
                    id="years-experience"
                    value={formData.years_experience}
                    onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  >
                    <option value="0">Less than 1 year</option>
                    <option value="1">1-2 years</option>
                    <option value="3">3-5 years</option>
                    <option value="6">5-10 years</option>
                    <option value="11">10+ years</option>
                  </select>
                </div>

                {/* English Proficiency */}
                <div>
                  <label htmlFor="english-level" className="block text-sm font-medium text-gray-900 mb-2 flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>English Proficiency Level *</span>
                  </label>
                  <select
                    id="english-level"
                    value={formData.english_level}
                    onChange={(e) => setFormData({ ...formData, english_level: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select your English level</option>
                    <option value="basic">Basic (A1-A2) - Can understand simple phrases</option>
                    <option value="intermediate">Intermediate (B1-B2) - Can hold conversations</option>
                    <option value="fluent">Fluent (C1-C2) - Advanced proficiency</option>
                    <option value="native">Native Speaker</option>
                  </select>
                </div>

                {/* Ijazah, Degree, Certificate sections — platform teachers only */}
                {formData.teacher_type === 'platform' && (
                  <>
                    {/* Ijazah Section */}
                    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <label className="flex items-center space-x-3 mb-4">
                        <input
                          type="checkbox"
                          checked={hasIjazah}
                          onChange={(e) => setHasIjazah(e.target.checked)}
                          className="w-5 h-5 text-emerald-500 focus:ring-emerald-500 rounded"
                        />
                        <span className="text-lg font-semibold text-gray-900">
                          I have Ijazah (Quranic certification)
                        </span>
                      </label>

                      {hasIjazah && (
                        <div className="ml-8 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-3">
                              Ijazah Type (select all that apply):
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {['Hafs', 'Warsh', 'Qalun', 'Other'].map(type => (
                                <label
                                  key={type}
                                  className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-white cursor-pointer transition"
                                >
                                  <input
                                    type="checkbox"
                                    checked={ijazahTypes.includes(type)}
                                    onChange={() => handleIjazahTypeToggle(type)}
                                    className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 rounded"
                                  />
                                  <span className="text-gray-700">{type}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center space-x-2">
                              <FileText className="w-4 h-4" />
                              <span>Upload Ijazah Certificate(s) *</span>
                            </label>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              multiple
                              onChange={(e) => handleFileUpload(e, setIjazahFiles)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Accepted formats: PDF, JPG, PNG (max 10MB per file)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Degree Section */}
                    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <label className="flex items-center space-x-3 mb-4">
                        <input
                          type="checkbox"
                          checked={hasDegree}
                          onChange={(e) => setHasDegree(e.target.checked)}
                          className="w-5 h-5 text-emerald-500 focus:ring-emerald-500 rounded"
                        />
                        <span className="text-lg font-semibold text-gray-900">
                          I have a degree in Islamic Studies or Arabic
                        </span>
                      </label>

                      {hasDegree && (
                        <div className="ml-8 space-y-4">
                          <div>
                            <label htmlFor="degree-type" className="block text-sm font-medium text-gray-900 mb-2">
                              Degree Type *
                            </label>
                            <select
                              id="degree-type"
                              value={formData.degree_type}
                              onChange={(e) => setFormData({ ...formData, degree_type: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              required
                            >
                              <option value="">Select degree type</option>
                              <option value="al-azhar">Al-Azhar University</option>
                              <option value="islamic_studies">Islamic Studies Degree</option>
                              <option value="arabic_language">Arabic Language Degree</option>
                              <option value="sharia">Sharia Law Degree</option>
                              <option value="quran_tafsir">Quran & Tafsir</option>
                              <option value="hadith">Hadith Studies</option>
                              <option value="other">Other Islamic Studies</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center space-x-2">
                              <FileText className="w-4 h-4" />
                              <span>Upload Degree Certificate *</span>
                            </label>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              multiple
                              onChange={(e) => handleFileUpload(e, setDegreeFiles)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Accepted formats: PDF, JPG, PNG (max 10MB per file)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Other Certificates */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Other Teaching Certificates (Optional)</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        onChange={(e) => handleFileUpload(e, setCertificateFiles)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Any additional certificates, diplomas, or training qualifications
                      </p>
                    </div>
                  </>
                )}

              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                Video Introduction
              </h3>

              <div className="space-y-6">
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
                className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-gray-900 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting Application...' : 'Save and Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
