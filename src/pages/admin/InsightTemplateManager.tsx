import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Star, StarOff, Eye, EyeOff, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';

interface InsightTemplate {
  id?: string;
  name: string;
  display_name: string;
  description: string;
  subject_category: string;
  system_prompt: string;
  output_format: string;
  include_vocabulary: boolean;
  include_quiz: boolean;
  include_homework: boolean;
  vocabulary_limit: number;
  quiz_questions: number;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

const SUBJECT_CATEGORIES = [
  { value: 'quran', label: 'Quran', icon: '📖' },
  { value: 'arabic', label: 'Arabic Language', icon: '🌍' },
  { value: 'islamic_studies', label: 'Islamic Studies', icon: '🕌' },
  { value: 'other', label: 'Other', icon: '📚' },
];

const DEFAULT_TEMPLATE: InsightTemplate = {
  name: '',
  display_name: '',
  description: '',
  subject_category: 'quran',
  system_prompt: `You are Talbiyah Insights – [Subject] specialist.

Transform the class transcript into structured, detailed lesson notes covering:

1. **Lesson Summary**: Overview of what was covered
2. **Key Concepts**: Important terms and definitions
3. **Main Points**: Detailed breakdown of topics discussed
4. **Practical Application**: How to apply this in daily life
5. **Quiz Questions**: 5 questions to test understanding
6. **Homework**: Tasks for the student to complete

Use clear headings, bullet points, and be thorough but accessible.`,
  output_format: '',
  include_vocabulary: true,
  include_quiz: true,
  include_homework: true,
  vocabulary_limit: 15,
  quiz_questions: 5,
  is_default: false,
};

export default function InsightTemplateManager() {
  const [templates, setTemplates] = useState<InsightTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState<string | null>(null);
  const [form, setForm] = useState<InsightTemplate>(DEFAULT_TEMPLATE);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('insight_templates')
      .select('*')
      .order('subject_category, name');

    if (error) {
      console.error('Error fetching templates:', error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
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
      const payload = {
        ...form,
        name: form.name || generateSlug(form.display_name),
      };

      // Remove fields that shouldn't be sent
      delete (payload as any).id;
      delete (payload as any).created_at;
      delete (payload as any).updated_at;

      if (editingId) {
        const { error } = await supabase
          .from('insight_templates')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('insight_templates')
          .insert(payload);
        if (error) throw error;
      }

      setIsCreating(false);
      setEditingId(null);
      setForm(DEFAULT_TEMPLATE);
      await fetchTemplates();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error('Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const editTemplate = (template: InsightTemplate) => {
    setForm({
      ...DEFAULT_TEMPLATE,
      ...template,
    });
    setEditingId(template.id!);
    setIsCreating(true);
  };

  const duplicateTemplate = async (template: InsightTemplate) => {
    const newTemplate = {
      ...template,
      name: `${template.name}-copy-${Date.now()}`,
      display_name: `${template.display_name} (Copy)`,
      is_default: false,
    };
    delete (newTemplate as any).id;
    delete (newTemplate as any).created_at;
    delete (newTemplate as any).updated_at;

    const { error } = await supabase
      .from('insight_templates')
      .insert(newTemplate);

    if (error) {
      toast.error('Failed to duplicate: ' + error.message);
    } else {
      await fetchTemplates();
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template? This cannot be undone.')) return;

    const { error } = await supabase
      .from('insight_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete: ' + error.message);
    } else {
      await fetchTemplates();
    }
  };

  const toggleDefault = async (template: InsightTemplate) => {
    // If making this default, remove default from others in same category
    if (!template.is_default) {
      await supabase
        .from('insight_templates')
        .update({ is_default: false })
        .eq('subject_category', template.subject_category);
    }

    const { error } = await supabase
      .from('insight_templates')
      .update({ is_default: !template.is_default })
      .eq('id', template.id);

    if (error) {
      toast.error('Failed to update: ' + error.message);
    } else {
      await fetchTemplates();
    }
  };

  const getCategoryIcon = (category: string) => {
    return SUBJECT_CATEGORIES.find(c => c.value === category)?.icon || '📚';
  };

  const getCategoryLabel = (category: string) => {
    return SUBJECT_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    const cat = template.subject_category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(template);
    return acc;
  }, {} as Record<string, InsightTemplate[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Insight Templates</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage AI prompts for generating lesson insights</p>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setEditingId(null);
            setForm(DEFAULT_TEMPLATE);
          }}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Template
        </button>
      </div>

      {/* Creation/Edit Form */}
      {isCreating && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingId ? 'Edit Template' : 'Create New Template'}
            </h2>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingId(null);
                setForm(DEFAULT_TEMPLATE);
              }}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Display Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g., Quran Recitation & Tajweed"
                  value={form.display_name}
                  onChange={e => setForm({
                    ...form,
                    display_name: e.target.value,
                    name: form.name || generateSlug(e.target.value)
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Identifier (slug)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400"
                  placeholder="auto-generated"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Subject Category *</label>
                <select
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  value={form.subject_category}
                  onChange={e => setForm({ ...form, subject_category: e.target.value })}
                >
                  {SUBJECT_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Brief description of when to use this template"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            {/* AI Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">AI System Prompt *</label>
              <textarea
                required
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                rows={12}
                placeholder="Enter the AI instructions for generating insights..."
                value={form.system_prompt}
                onChange={e => setForm({ ...form, system_prompt: e.target.value })}
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                This prompt tells the AI how to process the lesson transcript and what sections to generate.
              </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-700 text-emerald-500 focus:ring-emerald-500"
                  checked={form.include_vocabulary}
                  onChange={e => setForm({ ...form, include_vocabulary: e.target.checked })}
                />
                <span className="text-gray-900 dark:text-white text-sm">Include Vocabulary</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-700 text-emerald-500 focus:ring-emerald-500"
                  checked={form.include_quiz}
                  onChange={e => setForm({ ...form, include_quiz: e.target.checked })}
                />
                <span className="text-gray-900 dark:text-white text-sm">Include Quiz</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-700 text-emerald-500 focus:ring-emerald-500"
                  checked={form.include_homework}
                  onChange={e => setForm({ ...form, include_homework: e.target.checked })}
                />
                <span className="text-gray-900 dark:text-white text-sm">Include Homework</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-700 text-emerald-500 focus:ring-emerald-500"
                  checked={form.is_default}
                  onChange={e => setForm({ ...form, is_default: e.target.checked })}
                />
                <span className="text-gray-900 dark:text-white text-sm">Set as Default</span>
              </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Vocabulary Limit</label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  value={form.vocabulary_limit}
                  onChange={e => setForm({ ...form, vocabulary_limit: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Quiz Questions</label>
                <input
                  type="number"
                  min="3"
                  max="20"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  value={form.quiz_questions}
                  onChange={e => setForm({ ...form, quiz_questions: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : (editingId ? 'Update Template' : 'Create Template')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                  setForm(DEFAULT_TEMPLATE);
                }}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates by Category */}
      {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
        <div key={category} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">{getCategoryIcon(category)}</span>
            {getCategoryLabel(category)}
            <span className="text-gray-600 dark:text-gray-400 text-sm font-normal">({categoryTemplates.length} templates)</span>
          </h2>

          <div className="grid gap-4">
            {categoryTemplates.map(template => (
              <div
                key={template.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-600 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{template.display_name}</h3>
                      {template.is_default && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{template.description}</p>
                    <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                      <span>ID: {template.name}</span>
                      {template.include_vocabulary && <span>📝 Vocabulary: {template.vocabulary_limit}</span>}
                      {template.include_quiz && <span>❓ Quiz: {template.quiz_questions}q</span>}
                      {template.include_homework && <span>📚 Homework</span>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPrompt(showPrompt === template.id ? null : template.id!)}
                      className="p-2 bg-gray-500/10 hover:bg-gray-500/20 border border-gray-300/20 text-gray-500 rounded transition"
                      title={showPrompt === template.id ? 'Hide Prompt' : 'View Prompt'}
                    >
                      {showPrompt === template.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => toggleDefault(template)}
                      className={`p-2 ${template.is_default
                        ? 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/10 hover:bg-gray-500/20 border-gray-300/20 text-gray-500'
                        } border rounded transition`}
                      title={template.is_default ? 'Remove Default' : 'Set as Default'}
                    >
                      {template.is_default ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                    </button>
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
                      onClick={() => deleteTemplate(template.id!)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expandable Prompt View */}
                {showPrompt === template.id && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">AI System Prompt:</h4>
                    <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono overflow-x-auto">
                      {template.system_prompt}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {templates.length === 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No insight templates found</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Click "Create Template" to add your first AI insight template.</p>
        </div>
      )}
    </div>
  );
}
