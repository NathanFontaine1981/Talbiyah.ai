import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'sonner';

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  nationality?: string;
  country?: string;
  subjects: string[];
  expected_hourly_rate?: number;
  assigned_tier?: string;
  pipeline_stage: string;
  pipeline_stage_updated_at: string;
  admin_notes?: string;
  created_at: string;
  // Extended fields that may come from DB
  city?: string;
  languages?: string[];
  teacher_type?: string;
  years_experience?: number;
  education_level?: string;
  bio?: string;
}

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editCandidate?: Candidate | null;
}

const COUNTRIES = [
  'UK',
  'Egypt',
  'Saudi Arabia',
  'Pakistan',
  'India',
  'Morocco',
  'Tunisia',
  'Jordan',
  'Other',
];

const SUBJECT_OPTIONS = [
  'Quran',
  'Arabic',
  'Tajweed',
  'Islamic Studies',
  'Quran Memorisation',
];

const EDUCATION_LEVELS = [
  'High School',
  "Bachelor's",
  "Master's",
  'PhD',
  'Diploma',
  'Ijazah',
  'Other',
];

const PIPELINE_STAGES = [
  { key: 'initial_contact', name: 'Initial Contact' },
  { key: 'application', name: 'Application' },
  { key: 'interview_scheduled', name: 'Interview Scheduled' },
  { key: 'interview_completed', name: 'Interview Completed' },
  { key: 'document_verification', name: 'Document Verification' },
  { key: 'trial_lesson', name: 'Trial Lesson' },
  { key: 'approved', name: 'Approved' },
  { key: 'onboarding', name: 'Onboarding' },
  { key: 'active', name: 'Active' },
  { key: 'rejected', name: 'Rejected' },
];

export default function AddCandidateModal({
  isOpen,
  onClose,
  onSave,
  editCandidate,
}: AddCandidateModalProps) {
  const [saving, setSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [languagesInput, setLanguagesInput] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [expectedHourlyRate, setExpectedHourlyRate] = useState('');
  const [teacherType, setTeacherType] = useState<'platform' | 'independent'>('platform');
  const [yearsExperience, setYearsExperience] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [bio, setBio] = useState('');
  const [pipelineStage, setPipelineStage] = useState('initial_contact');

  // Pre-fill form when editing
  useEffect(() => {
    if (editCandidate) {
      setFullName(editCandidate.full_name || '');
      setEmail(editCandidate.email || '');
      setPhone(editCandidate.phone || '');
      setNationality(editCandidate.nationality || '');
      setCountry(editCandidate.country || '');
      setCity(editCandidate.city || '');
      setLanguagesInput(editCandidate.languages?.join(', ') || '');
      setSubjects(editCandidate.subjects || []);
      setExpectedHourlyRate(
        editCandidate.expected_hourly_rate != null
          ? String(editCandidate.expected_hourly_rate)
          : ''
      );
      setTeacherType((editCandidate.teacher_type as 'platform' | 'independent') || 'platform');
      setYearsExperience(
        editCandidate.years_experience != null ? String(editCandidate.years_experience) : ''
      );
      setEducationLevel(editCandidate.education_level || '');
      setBio(editCandidate.bio || editCandidate.admin_notes || '');
      setPipelineStage(editCandidate.pipeline_stage || 'initial_contact');
    } else {
      resetForm();
    }
  }, [editCandidate, isOpen]);

  function resetForm() {
    setFullName('');
    setEmail('');
    setPhone('');
    setNationality('');
    setCountry('');
    setCity('');
    setLanguagesInput('');
    setSubjects([]);
    setExpectedHourlyRate('');
    setTeacherType('platform');
    setYearsExperience('');
    setEducationLevel('');
    setBio('');
    setPipelineStage('initial_contact');
  }

  function handleSubjectToggle(subject: string) {
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName.trim() || !email.trim()) {
      toast.error('Full name and email are required.');
      return;
    }

    setSaving(true);

    const languages = languagesInput
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);

    const record: Record<string, unknown> = {
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      nationality: nationality.trim() || null,
      country: country || null,
      city: city.trim() || null,
      languages: languages.length > 0 ? languages : null,
      subjects: subjects.length > 0 ? subjects : null,
      expected_hourly_rate: expectedHourlyRate ? parseFloat(expectedHourlyRate) : null,
      teacher_type: teacherType,
      years_experience: yearsExperience ? parseInt(yearsExperience, 10) : null,
      education_level: educationLevel || null,
      admin_notes: bio.trim() || null,
      pipeline_stage: pipelineStage,
    };

    try {
      if (editCandidate) {
        // Update existing candidate
        const { error } = await supabase
          .from('recruitment_pipeline')
          .update(record)
          .eq('id', editCandidate.id);

        if (error) throw error;
        toast.success('Candidate updated successfully.');
      } else {
        // Insert new candidate
        record.pipeline_stage_updated_at = new Date().toISOString();
        const { error } = await supabase.from('recruitment_pipeline').insert(record);

        if (error) throw error;
        toast.success('Candidate added successfully.');
      }

      onSave();
      onClose();
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast.error(`Failed to save candidate: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editCandidate ? 'Edit Candidate' : 'Add New Candidate'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Row 1: Name, Email, Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g. Ahmad ibn Khalid"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="+44 7XXX XXX XXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nationality
              </label>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g. British"
              />
            </div>
          </div>

          {/* Row 2: Country, City */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Select country...</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g. London"
              />
            </div>
          </div>

          {/* Languages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Languages
            </label>
            <input
              type="text"
              value={languagesInput}
              onChange={(e) => setLanguagesInput(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Comma-separated, e.g. English, Arabic, Urdu"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Separate multiple languages with commas
            </p>
          </div>

          {/* Subjects */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subjects
            </label>
            <div className="flex flex-wrap gap-3">
              {SUBJECT_OPTIONS.map((subject) => (
                <label
                  key={subject}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={subjects.includes(subject)}
                    onChange={() => handleSubjectToggle(subject)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500 dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{subject}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rate, Teacher Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expected Hourly Rate
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                  £
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={expectedHourlyRate}
                  onChange={(e) => setExpectedHourlyRate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-7 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teacher Type
              </label>
              <div className="flex items-center gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="teacherType"
                    value="platform"
                    checked={teacherType === 'platform'}
                    onChange={() => setTeacherType('platform')}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Platform</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="teacherType"
                    value="independent"
                    checked={teacherType === 'independent'}
                    onChange={() => setTeacherType('independent')}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Independent</span>
                </label>
              </div>
            </div>
          </div>

          {/* Years Experience, Education Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                min="0"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g. 5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Education Level
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Select level...</option>
                {EDUCATION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bio / Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bio / Notes
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              placeholder="Additional notes about the candidate..."
            />
          </div>

          {/* Pipeline Stage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Initial Pipeline Stage
            </label>
            <select
              value={pipelineStage}
              onChange={(e) => setPipelineStage(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {PIPELINE_STAGES.map((stage) => (
                <option key={stage.key} value={stage.key}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : editCandidate ? 'Update Candidate' : 'Add Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
