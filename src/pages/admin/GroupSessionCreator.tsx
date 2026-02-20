import { useState, useEffect } from 'react';
import { Plus, Edit2, Copy, Trash2, Calendar, Users, DollarSign, Save, X, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';

interface SessionTemplate {
  id?: string;
  name: string;
  slug: string;
  description: string;
  subject_category: string;
  image_url: string;
  duration_minutes: number;
  recurrence: string;
  day_of_week: number | null;
  start_time: string;
  timezone: string;
  start_date: string;
  end_date: string;
  is_free: boolean;
  price_per_session: number | null;
  price_bundle_4: number | null;
  price_bundle_8: number | null;
  credits_per_session: number | null;
  min_participants: number;
  max_participants: number;
  teacher_id: string | null;
  age_group: string;
  age_min: number | null;
  age_max: number | null;
  gender: string;
  skill_level: string;
  insight_template_name: string;
  custom_insight_prompt: string;
  recording_enabled: boolean;
  homework_enabled: boolean;
  chat_enabled: boolean;
  status: string;
  featured: boolean;
  teacher?: { full_name: string };
  created_at?: string;
}

interface InsightTemplate {
  name: string;
  display_name: string;
  subject_category: string;
  is_default: boolean;
}

interface Teacher {
  id: string;
  user_id: string;
  profiles: { full_name: string };
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SUBJECT_CATEGORIES = [
  { value: 'quran', label: 'Quran', icon: '📖' },
  { value: 'arabic', label: 'Arabic Language', icon: '🌍' },
  { value: 'islamic_studies', label: 'Islamic Studies', icon: '🕌' },
  { value: 'other', label: 'Other', icon: '📚' },
];

const AGE_GROUPS = [
  { value: 'all', label: 'All Ages' },
  { value: 'children', label: 'Children (5-12)' },
  { value: 'teens', label: 'Teens (13-17)' },
  { value: 'adults', label: 'Adults (18+)' },
];

const SKILL_LEVELS = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const DEFAULT_FORM: SessionTemplate = {
  name: '',
  slug: '',
  description: '',
  subject_category: 'quran',
  image_url: '',
  duration_minutes: 60,
  recurrence: 'weekly',
  day_of_week: 0,
  start_time: '18:00',
  timezone: 'Europe/London',
  start_date: '',
  end_date: '',
  is_free: false,
  price_per_session: 5.00,
  price_bundle_4: 18.00,
  price_bundle_8: 32.00,
  credits_per_session: 1,
  min_participants: 3,
  max_participants: 20,
  teacher_id: null,
  age_group: 'all',
  age_min: null,
  age_max: null,
  gender: 'all',
  skill_level: 'beginner',
  insight_template_name: '',
  custom_insight_prompt: '',
  recording_enabled: true,
  homework_enabled: true,
  chat_enabled: true,
  status: 'draft',
  featured: false,
};

export default function GroupSessionCreator() {
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [insightTemplates, setInsightTemplates] = useState<InsightTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('basic');
  const [form, setForm] = useState<SessionTemplate>(DEFAULT_FORM);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchTemplates(),
      fetchTeachers(),
      fetchInsightTemplates(),
    ]);
    setLoading(false);
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('group_session_templates')
      .select(`
        *,
        teacher:profiles!teacher_id(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
    } else {
      setTemplates(data || []);
    }
  };

  const fetchTeachers = async () => {
    const { data } = await supabase
      .from('teacher_profiles')
      .select('id, user_id, profiles!teacher_profiles_user_id_fkey(full_name)')
      .eq('status', 'approved');
    setTeachers(data || []);
  };

  const fetchInsightTemplates = async () => {
    const { data } = await supabase
      .from('insight_templates')
      .select('name, display_name, subject_category, is_default')
      .order('subject_category');
    setInsightTemplates(data || []);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        ...form,
        slug: form.slug || generateSlug(form.name),
        price_per_session: form.is_free ? null : form.price_per_session,
        price_bundle_4: form.is_free ? null : form.price_bundle_4,
        price_bundle_8: form.is_free ? null : form.price_bundle_8,
        created_by: editingId ? undefined : user?.id,
      };

      // Remove fields that shouldn't be sent
      delete (payload as any).teacher;
      delete (payload as any).created_at;

      if (editingId) {
        delete (payload as any).id;
        const { error } = await supabase
          .from('group_session_templates')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('group_session_templates')
          .insert(payload);
        if (error) throw error;
      }

      setIsCreating(false);
      setEditingId(null);
      setForm(DEFAULT_FORM);
      await fetchTemplates();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error('Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const editTemplate = (template: SessionTemplate) => {
    setForm({
      ...DEFAULT_FORM,
      ...template,
    });
    setEditingId(template.id!);
    setIsCreating(true);
    setExpandedSection('basic');
  };

  const duplicateTemplate = async (template: SessionTemplate) => {
    const newTemplate = {
      ...template,
      name: `${template.name} (Copy)`,
      slug: `${template.slug}-copy-${Date.now()}`,
      status: 'draft',
    };
    delete (newTemplate as any).id;
    delete (newTemplate as any).teacher;
    delete (newTemplate as any).created_at;

    const { error } = await supabase
      .from('group_session_templates')
      .insert(newTemplate);

    if (error) {
      toast.error('Failed to duplicate: ' + error.message);
    } else {
      await fetchTemplates();
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class template? This cannot be undone.')) return;

    const { error } = await supabase
      .from('group_session_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete: ' + error.message);
    } else {
      await fetchTemplates();
    }
  };

  const generateSessions = async (templateId: string) => {
    const weeks = prompt('How many weeks of sessions to generate?', '12');
    if (!weeks) return;

    const { data, error } = await supabase.rpc('generate_group_sessions', {
      p_template_id: templateId,
      p_num_weeks: parseInt(weeks),
    });

    if (error) {
      toast.error('Failed to generate sessions: ' + error.message);
    } else {
      toast.success(`Generated ${data} sessions!`);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-500/20 text-gray-600 border-gray-300/30',
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      archived: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return styles[status] || styles.draft;
  };

  const getCategoryIcon = (category: string) => {
    return SUBJECT_CATEGORIES.find(c => c.value === category)?.icon || '📚';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Group Session Creator</h1>
          <p className="text-gray-500 dark:text-gray-400">Create and manage group class templates</p>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setEditingId(null);
            setForm(DEFAULT_FORM);
            setExpandedSection('basic');
          }}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create New Class
        </button>
      </div>

      {/* Creation/Edit Form */}
      {isCreating && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingId ? 'Edit Class Template' : 'Create New Class Template'}
            </h2>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingId(null);
                setForm(DEFAULT_FORM);
              }}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* BASIC INFO */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('basic')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>📋</span> Basic Information
                </span>
                {expandedSection === 'basic' ? <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
              </button>
              {expandedSection === 'basic' && (
                <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Class Name *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        placeholder="e.g., Kids Quran Circle"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">URL Slug</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400"
                        value={form.slug}
                        onChange={e => setForm({ ...form, slug: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                    <textarea
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      rows={3}
                      placeholder="Describe what students will learn..."
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Subject Category *</label>
                      <select
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        value={form.subject_category}
                        onChange={e => setForm({ ...form, subject_category: e.target.value })}
                      >
                        {SUBJECT_CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Cover Image URL</label>
                      <input
                        type="url"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        placeholder="https://..."
                        value={form.image_url}
                        onChange={e => setForm({ ...form, image_url: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SCHEDULE */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('schedule')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Schedule
                </span>
                {expandedSection === 'schedule' ? <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
              </button>
              {expandedSection === 'schedule' && (
                <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Duration</label>
                      <select
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        value={form.duration_minutes}
                        onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
                      >
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                        <option value={90}>90 minutes</option>
                        <option value={120}>2 hours</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Recurrence</label>
                      <select
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        value={form.recurrence}
                        onChange={e => setForm({ ...form, recurrence: e.target.value })}
                      >
                        <option value="once">One-time</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Every 2 Weeks</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    {form.recurrence !== 'once' && form.recurrence !== 'daily' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Day of Week</label>
                        <select
                          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          value={form.day_of_week ?? 0}
                          onChange={e => setForm({ ...form, day_of_week: parseInt(e.target.value) })}
                        >
                          {DAYS_OF_WEEK.map((day, i) => (
                            <option key={i} value={i}>{day}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Start Time *</label>
                      <input
                        type="time"
                        required
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        value={form.start_time}
                        onChange={e => setForm({ ...form, start_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        value={form.start_date}
                        onChange={e => setForm({ ...form, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">End Date (optional)</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        value={form.end_date}
                        onChange={e => setForm({ ...form, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PRICING */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('pricing')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5" /> Pricing
                </span>
                {expandedSection === 'pricing' ? <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
              </button>
              {expandedSection === 'pricing' && (
                <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-600">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-emerald-500 focus:ring-emerald-500"
                      checked={form.is_free}
                      onChange={e => setForm({ ...form, is_free: e.target.checked })}
                    />
                    <span className="text-gray-900 dark:text-white font-medium">This is a FREE class</span>
                  </label>
                  {!form.is_free && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Price per Session (£)</label>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          value={form.price_per_session || ''}
                          onChange={e => setForm({ ...form, price_per_session: parseFloat(e.target.value) || null })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">4-Session Bundle (£)</label>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          placeholder="e.g., 18.00"
                          value={form.price_bundle_4 || ''}
                          onChange={e => setForm({ ...form, price_bundle_4: parseFloat(e.target.value) || null })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">8-Session Bundle (£)</label>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          placeholder="e.g., 32.00"
                          value={form.price_bundle_8 || ''}
                          onChange={e => setForm({ ...form, price_bundle_8: parseFloat(e.target.value) || null })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CAPACITY & TEACHER */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('capacity')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5" /> Capacity & Teacher
                </span>
                {expandedSection === 'capacity' ? <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
              </button>
              {expandedSection === 'capacity' && (
                <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Minimum Participants</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        value={form.min_participants}
                        onChange={e => setForm({ ...form, min_participants: parseInt(e.target.value) })}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Class won't run with fewer</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Maximum Participants</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        value={form.max_participants}
                        onChange={e => setForm({ ...form, max_participants: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Assign Teacher</label>
                      <select
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        value={form.teacher_id || ''}
                        onChange={e => setForm({ ...form, teacher_id: e.target.value || null })}
                      >
                        <option value="">-- Select Teacher --</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.user_id}>
                            {t.profiles?.full_name || 'Unknown'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TARGET AUDIENCE */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('audience')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🎯</span> Target Audience
                </span>
                {expandedSection === 'audience' ? <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
              </button>
              {expandedSection === 'audience' && (
                <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Age Group</label>
                      <select
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        value={form.age_group}
                        onChange={e => setForm({ ...form, age_group: e.target.value })}
                      >
                        {AGE_GROUPS.map(ag => (
                          <option key={ag.value} value={ag.value}>{ag.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Gender</label>
                      <select
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        value={form.gender}
                        onChange={e => setForm({ ...form, gender: e.target.value })}
                      >
                        <option value="all">All</option>
                        <option value="male">Brothers Only</option>
                        <option value="female">Sisters Only</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Skill Level</label>
                      <select
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        value={form.skill_level}
                        onChange={e => setForm({ ...form, skill_level: e.target.value })}
                      >
                        {SKILL_LEVELS.map(sl => (
                          <option key={sl.value} value={sl.value}>{sl.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI INSIGHTS */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('insights')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🤖</span> AI Insight Template
                </span>
                {expandedSection === 'insights' ? <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
              </button>
              {expandedSection === 'insights' && (
                <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-600">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Select Template</label>
                    <select
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      value={form.insight_template_name}
                      onChange={e => setForm({ ...form, insight_template_name: e.target.value })}
                    >
                      <option value="">-- Use Default for Category --</option>
                      {insightTemplates.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.display_name} ({t.subject_category}){t.is_default ? ' ★' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Custom AI Prompt (Optional)
                    </label>
                    <textarea
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                      rows={5}
                      placeholder="Add custom instructions for AI insight generation... Leave blank to use the selected template."
                      value={form.custom_insight_prompt}
                      onChange={e => setForm({ ...form, custom_insight_prompt: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      This will be appended to the base template for class-specific instructions.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* FEATURES & STATUS */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('features')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>⚙️</span> Features & Status
                </span>
                {expandedSection === 'features' ? <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
              </button>
              {expandedSection === 'features' && (
                <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-emerald-500 focus:ring-emerald-500"
                        checked={form.recording_enabled}
                        onChange={e => setForm({ ...form, recording_enabled: e.target.checked })}
                      />
                      <span className="text-gray-900 dark:text-white">🎥 Recording</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-emerald-500 focus:ring-emerald-500"
                        checked={form.homework_enabled}
                        onChange={e => setForm({ ...form, homework_enabled: e.target.checked })}
                      />
                      <span className="text-gray-900 dark:text-white">📚 Homework</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-emerald-500 focus:ring-emerald-500"
                        checked={form.chat_enabled}
                        onChange={e => setForm({ ...form, chat_enabled: e.target.checked })}
                      />
                      <span className="text-gray-900 dark:text-white">💬 Chat</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-emerald-500 focus:ring-emerald-500"
                        checked={form.featured}
                        onChange={e => setForm({ ...form, featured: e.target.checked })}
                      />
                      <span className="text-gray-900 dark:text-white">⭐ Featured</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                    <select
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="draft">🔘 Draft (not visible)</option>
                      <option value="active">🟢 Active (visible & bookable)</option>
                      <option value="paused">🟡 Paused (visible but not bookable)</option>
                      <option value="archived">🔴 Archived (hidden)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : (editingId ? 'Update Class' : 'Create Class')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                  setForm(DEFAULT_FORM);
                }}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Class</th>
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Schedule</th>
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Price</th>
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Capacity</th>
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(template => (
                <tr key={template.id} className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCategoryIcon(template.subject_category)}</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{template.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {template.teacher?.full_name || 'No teacher assigned'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-gray-900 dark:text-white capitalize">{template.recurrence}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {template.day_of_week !== null && template.recurrence !== 'once' && template.recurrence !== 'daily'
                        ? `${DAYS_OF_WEEK[template.day_of_week]} `
                        : ''
                      }
                      {template.start_time}
                    </div>
                  </td>
                  <td className="p-4">
                    {template.is_free ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">FREE</span>
                    ) : (
                      <span className="text-gray-900 dark:text-white">£{template.price_per_session?.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-900 dark:text-white">
                    {template.min_participants}-{template.max_participants}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-sm border ${getStatusBadge(template.status)}`}>
                      {template.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => editTemplate(template)}
                        className="p-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => duplicateTemplate(template)}
                        className="p-2 bg-gray-500/10 hover:bg-gray-500/20 border border-gray-300/20 text-gray-500 rounded transition"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => generateSessions(template.id!)}
                        className="p-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded transition"
                        title="Generate Sessions"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id!)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 dark:text-gray-400">
                    No group class templates yet. Click "Create New Class" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
