import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Video, Upload, PlayCircle, StopCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Subject {
  id: string;
  name: string;
}

interface TeacherProfile {
  id: string;
  bio: string | null;
  hourly_rate: number;
  video_intro_url: string | null;
  education_level: string | null;
  islamic_learning_interests: string[] | null;
}

export default function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [teacherProfileId, setTeacherProfileId] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [hourlyRate, setHourlyRate] = useState('10');
  const [videoUrl, setVideoUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);

  // Video recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [currentIntroUrl, setCurrentIntroUrl] = useState<string | null>(null);
  const [introType, setIntroType] = useState<'video' | 'youtube' | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Bio template state
  const [useTemplate, setUseTemplate] = useState(true);
  const [teachingStyle, setTeachingStyle] = useState('Patient and encouraging');
  const [bioSubjects, setBioSubjects] = useState<string[]>(['Quran recitation and memorization']);
  const [focusArea, setFocusArea] = useState('Helping students build confidence');
  const [ageGroups, setAgeGroups] = useState<string[]>(['Young children (5-10)']);
  const [yearsExperience, setYearsExperience] = useState('5');
  const [methodology, setMethodology] = useState('Interactive and conversational');
  const [customText, setCustomText] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const availableSpecializations = [
    'Quran Memorization (Hifz)',
    'Tajweed',
    'Tafseer (Quranic Interpretation)',
    'Arabic Language',
    'Islamic History',
    'Fiqh (Islamic Jurisprudence)',
    'Hadith Studies',
    'Islamic Ethics',
    'Seerah (Prophet\'s Biography)',
    'Aqeedah (Islamic Creed)'
  ];

  const teachingStyleOptions = [
    'Patient and encouraging',
    'Structured and disciplined',
    'Fun and engaging',
    'Traditional and rigorous',
    'Adaptive and flexible'
  ];

  const bioSubjectOptions = [
    'Quran recitation and memorization',
    'Arabic language',
    'Islamic studies',
    'Tajweed'
  ];

  const focusAreaOptions = [
    'Helping students build confidence',
    'Making learning enjoyable',
    'Achieving fast results',
    'Deep understanding of concepts',
    'Proper pronunciation and fluency'
  ];

  const ageGroupOptions = [
    'Young children (5-10)',
    'Teenagers (11-17)',
    'Adults (18+)',
    'Senior learners (60+)'
  ];

  const methodologyOptions = [
    'Interactive and conversational',
    'Focused on repetition and practice',
    'Technology-enhanced with visual aids',
    'Traditional one-on-one instruction',
    'Gamified learning'
  ];

  function generateBioFromTemplate(): string {
    const subjectsText = bioSubjects.length > 1
      ? bioSubjects.slice(0, -1).join(', ') + ' and ' + bioSubjects[bioSubjects.length - 1]
      : bioSubjects[0];

    const ageGroupsText = ageGroups.length > 1
      ? ageGroups.slice(0, -1).join(', ') + ' and ' + ageGroups[ageGroups.length - 1]
      : ageGroups[0];

    let generatedBio = `I am a ${teachingStyle.toLowerCase()} ${subjectsText} teacher with a passion for ${focusArea.toLowerCase()}. I specialize in teaching ${ageGroupsText} and have ${yearsExperience} years of experience. My approach is ${methodology.toLowerCase()}.`;

    if (customText.trim()) {
      generatedBio += ' ' + customText.trim();
    }

    return generatedBio;
  }

  function toggleBioSubject(subject: string) {
    setBioSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  }

  function toggleAgeGroup(group: string) {
    setAgeGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Clear timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
      };

      // Preview stream
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 30) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access camera/microphone. Please check permissions.');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Check file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/mp4'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid video or audio file (.mp4, .webm, .mov, .mp3, .m4a)');
      return;
    }

    // Check duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = function() {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > 30) {
        setError('Video/audio must be 30 seconds or less');
        return;
      }
      setRecordedBlob(file);
    };
    video.src = URL.createObjectURL(file);
  }

  async function uploadIntroVideo() {
    if (!recordedBlob || !teacherProfileId) return;

    try {
      setUploading(true);
      setError(null);

      const fileName = `intro-${Date.now()}.webm`;
      const filePath = `teacher-intros/${teacherProfileId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('teacher-intros')
        .upload(filePath, recordedBlob, {
          contentType: recordedBlob.type,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('teacher-intros')
        .getPublicUrl(filePath);

      setCurrentIntroUrl(publicUrl);
      setIntroType('video');
      setVideoUrl(publicUrl);
      setRecordedBlob(null);
      setRecordingTime(0);
      setSuccessMessage('Introduction video uploaded successfully!');
    } catch (err) {
      console.error('Error uploading video:', err);
      setError('Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function deleteRecording() {
    setRecordedBlob(null);
    setRecordingTime(0);
    if (videoPreviewRef.current) {
      videoPreviewRef.current.src = '';
    }
  }

  function validateYouTubeUrl(url: string): boolean {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
  }

  function handleYouTubeUrlSave() {
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeUrl(youtubeUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setCurrentIntroUrl(youtubeUrl);
    setIntroType('youtube');
    setSuccessMessage('YouTube URL saved successfully!');
  }

  useEffect(() => {
    loadTeacherProfile();
    loadSubjects();
  }, []);

  async function loadTeacherProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/');
        return;
      }

      // Get teacher profile
      const { data: teacherProfile, error: profileError } = await supabase
        .from('teacher_profiles')
        .select('id, bio, hourly_rate, video_intro_url, youtube_intro_url, education_level, islamic_learning_interests')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!teacherProfile) {
        setError('Teacher profile not found');
        return;
      }

      setTeacherProfileId(teacherProfile.id);
      setBio(teacherProfile.bio || '');
      setEducationLevel(teacherProfile.education_level || '');
      setHourlyRate(teacherProfile.hourly_rate?.toString() || '10');
      setVideoUrl(teacherProfile.video_intro_url || '');
      setYoutubeUrl(teacherProfile.youtube_intro_url || '');
      setSpecializations(teacherProfile.islamic_learning_interests || []);

      // Set current intro type and URL
      if (teacherProfile.video_intro_url) {
        setCurrentIntroUrl(teacherProfile.video_intro_url);
        setIntroType('video');
      } else if (teacherProfile.youtube_intro_url) {
        setCurrentIntroUrl(teacherProfile.youtube_intro_url);
        setIntroType('youtube');
      }

      // Get teacher subjects
      const { data: teacherSubjects, error: subjectsError } = await supabase
        .from('teacher_subjects')
        .select('subject_id')
        .eq('teacher_id', teacherProfile.id);

      if (subjectsError) throw subjectsError;

      setSelectedSubjects(teacherSubjects?.map(ts => ts.subject_id) || []);
    } catch (err) {
      console.error('Error loading teacher profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }

  async function loadSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (err) {
      console.error('Error loading subjects:', err);
    }
  }

  function toggleSubject(subjectId: string) {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  }

  function toggleSpecialization(spec: string) {
    setSpecializations(prev =>
      prev.includes(spec)
        ? prev.filter(s => s !== spec)
        : [...prev, spec]
    );
  }

  async function handleSave() {
    if (!teacherProfileId) {
      setError('Teacher profile not found');
      return;
    }

    const finalBio = useTemplate ? generateBioFromTemplate() : bio;

    if (!finalBio.trim()) {
      setError('Please provide a bio/description');
      return;
    }

    if (useTemplate) {
      if (bioSubjects.length === 0) {
        setError('Please select at least one subject for your bio');
        return;
      }
      if (ageGroups.length === 0) {
        setError('Please select at least one age group');
        return;
      }
    }

    if (selectedSubjects.length === 0) {
      setError('Please select at least one subject');
      return;
    }

    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate < 5) {
      setError('Hourly rate must be at least £5');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Update teacher profile
      const { error: updateError } = await supabase
        .from('teacher_profiles')
        .update({
          bio: finalBio.trim(),
          education_level: educationLevel.trim() || null,
          hourly_rate: rate,
          video_intro_url: introType === 'video' ? (videoUrl.trim() || currentIntroUrl) : null,
          youtube_intro_url: introType === 'youtube' ? (youtubeUrl.trim() || currentIntroUrl) : null,
          islamic_learning_interests: specializations.length > 0 ? specializations : null,
        })
        .eq('id', teacherProfileId);

      if (updateError) throw updateError;

      // Update teacher subjects
      // First, delete existing subjects
      const { error: deleteError } = await supabase
        .from('teacher_subjects')
        .delete()
        .eq('teacher_id', teacherProfileId);

      if (deleteError) throw deleteError;

      // Then insert new subjects
      if (selectedSubjects.length > 0) {
        const subjectsToInsert = selectedSubjects.map(subjectId => ({
          teacher_id: teacherProfileId,
          subject_id: subjectId
        }));

        const { error: insertError } = await supabase
          .from('teacher_subjects')
          .insert(subjectsToInsert);

        if (insertError) throw insertError;
      }

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Edit Teacher Profile</h1>
          <p className="text-gray-600 mt-2">Update your profile information to help students find and book you</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">{successMessage}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          {/* Bio Builder */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Bio / About Me <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Use Template:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useTemplate}
                    onChange={(e) => setUseTemplate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
            </div>

            {useTemplate ? (
              <div className="space-y-6">
                {/* Template Builder */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Build Your Professional Bio</h3>

                  {/* Teaching Style */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teaching Style
                    </label>
                    <select
                      value={teachingStyle}
                      onChange={(e) => setTeachingStyle(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {teachingStyleOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subjects (multi-select) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject(s) <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {bioSubjectOptions.map((subject) => (
                        <label key={subject} className="flex items-center space-x-2 p-2 border border-gray-200 rounded hover:bg-white cursor-pointer transition">
                          <input
                            type="checkbox"
                            checked={bioSubjects.includes(subject)}
                            onChange={() => toggleBioSubject(subject)}
                            className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{subject}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Focus Area */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Focus Area
                    </label>
                    <select
                      value={focusArea}
                      onChange={(e) => setFocusArea(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {focusAreaOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  {/* Age Groups (multi-select) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age Group(s) <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ageGroupOptions.map((group) => (
                        <label key={group} className="flex items-center space-x-2 p-2 border border-gray-200 rounded hover:bg-white cursor-pointer transition">
                          <input
                            type="checkbox"
                            checked={ageGroups.includes(group)}
                            onChange={() => toggleAgeGroup(group)}
                            className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{group}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Years of Experience */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      min="0"
                      max="50"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Methodology */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teaching Methodology
                    </label>
                    <select
                      value={methodology}
                      onChange={(e) => setMethodology(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {methodologyOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Addition */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Information (Optional)
                    </label>
                    <textarea
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any additional details about your teaching style or qualifications..."
                    />
                  </div>
                </div>

                {/* Preview Button */}
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
                >
                  {showPreview ? 'Hide Preview' : 'Show Bio Preview'}
                </button>

                {/* Preview */}
                {showPreview && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Bio Preview:</h4>
                    <p className="text-gray-700 leading-relaxed">{generateBioFromTemplate()}</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell students about yourself, your teaching experience, and your approach to Islamic education..."
                />
                <p className="text-xs text-gray-500 mt-1">This will be displayed on your public profile</p>
              </div>
            )}
          </div>

          {/* Education Level */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Education / Qualifications
            </label>
            <textarea
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your educational background, certifications, and Islamic qualifications (e.g., Ijazah, degrees, etc.)"
            />
          </div>

          {/* Subjects Taught */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Subjects You Teach <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subjects.map((subject) => (
                <label key={subject.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.id)}
                    onChange={() => toggleSubject(subject.id)}
                    className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 font-medium">{subject.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Specializations */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Specializations
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableSpecializations.map((spec) => (
                <label key={spec} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={specializations.includes(spec)}
                    onChange={() => toggleSpecialization(spec)}
                    className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 text-sm">{spec}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Hourly Rate */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Hourly Rate (£) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              min="5"
              step="0.50"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="10.00"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum rate is £5.00 per hour</p>
          </div>

          {/* Video/Audio Introduction */}
          <div className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Introduction Video/Audio (Optional)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Record or upload a 30-second introduction so students can hear your teaching style!
            </p>

            {/* Current Introduction */}
            {currentIntroUrl && (
              <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Current Introduction</h4>
                  <button
                    onClick={() => {
                      setCurrentIntroUrl(null);
                      setIntroType(null);
                      setVideoUrl('');
                      setYoutubeUrl('');
                    }}
                    className="text-red-500 hover:text-red-700 transition text-sm flex items-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                </div>
                {introType === 'video' ? (
                  <video src={currentIntroUrl} controls className="w-full rounded-lg" />
                ) : (
                  <div className="text-sm text-gray-600">
                    YouTube URL: <a href={currentIntroUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{currentIntroUrl}</a>
                  </div>
                )}
              </div>
            )}

            {/* Recording/Upload Options */}
            <div className="space-y-4">
              {/* Option 1: Record */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Video className="w-5 h-5 text-blue-500" />
                  <h4 className="font-medium text-gray-900">Option 1: Record Introduction</h4>
                </div>

                {!recordedBlob ? (
                  <>
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition flex items-center justify-center space-x-2"
                      >
                        <PlayCircle className="w-5 h-5" />
                        <span>Start Recording</span>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <video
                          ref={videoPreviewRef}
                          autoPlay
                          muted
                          className="w-full rounded-lg bg-black"
                        />
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-red-500">
                            {recordingTime}s / 30s
                          </div>
                          <button
                            onClick={stopRecording}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition flex items-center space-x-2"
                          >
                            <StopCircle className="w-5 h-5" />
                            <span>Stop Recording</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <video
                      src={URL.createObjectURL(recordedBlob)}
                      controls
                      className="w-full rounded-lg"
                    />
                    <div className="flex space-x-3">
                      <button
                        onClick={uploadIntroVideo}
                        disabled={uploading}
                        className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition flex items-center justify-center space-x-2"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            <span>Upload Recording</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={deleteRecording}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
                      >
                        Re-record
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 2: Upload File */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Upload className="w-5 h-5 text-green-500" />
                  <h4 className="font-medium text-gray-900">Option 2: Upload Video/Audio File</h4>
                </div>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4"
                  onChange={handleFileUpload}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Accepted formats: .mp4, .webm, .mov, .mp3, .m4a (Max 10MB, 30 seconds)
                </p>
              </div>

              {/* Option 3: YouTube Link */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Video className="w-5 h-5 text-red-500" />
                  <h4 className="font-medium text-gray-900">Option 3: YouTube Link</h4>
                </div>
                <div className="flex space-x-3">
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={handleYouTubeUrlSave}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
                  >
                    Save
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Paste a YouTube link to introduce yourself
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
