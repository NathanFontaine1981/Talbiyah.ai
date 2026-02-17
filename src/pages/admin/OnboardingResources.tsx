import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import {
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
  Upload,
  FileText,
  Video,
  BookOpen,
  ExternalLink,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

type ResourceType = 'pdf' | 'video' | 'article' | 'link';
type Language = 'english' | 'arabic' | 'both';
type Category =
  | 'platform_guide'
  | 'teaching_methodology'
  | 'safeguarding'
  | 'technology'
  | 'policy'
  | 'general';

interface OnboardingResource {
  id: string;
  title: string;
  title_arabic: string | null;
  description: string | null;
  description_arabic: string | null;
  resource_type: ResourceType;
  file_url: string | null;
  external_url: string | null;
  language: Language;
  category: Category;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface TeacherCompletion {
  teacher_id: string;
  teacher_name: string;
  required_read: number;
  total_required: number;
  total_read: number;
  last_activity: string | null;
}

const CATEGORY_LABELS: Record<Category, string> = {
  platform_guide: 'Platform Guide',
  teaching_methodology: 'Teaching Methodology',
  safeguarding: 'Safeguarding',
  technology: 'Technology',
  policy: 'Policy',
  general: 'General',
};

const CATEGORY_OPTIONS: Category[] = [
  'platform_guide',
  'teaching_methodology',
  'safeguarding',
  'technology',
  'policy',
  'general',
];

const LANGUAGE_OPTIONS: Language[] = ['english', 'arabic', 'both'];

const TYPE_OPTIONS: ResourceType[] = ['pdf', 'video', 'article', 'link'];

const TYPE_ICONS: Record<ResourceType, typeof FileText> = {
  pdf: FileText,
  video: Video,
  article: BookOpen,
  link: ExternalLink,
};

const EMPTY_FORM = {
  title: '',
  title_arabic: '',
  description: '',
  description_arabic: '',
  resource_type: 'article' as ResourceType,
  file_url: '',
  external_url: '',
  language: 'english' as Language,
  category: 'general' as Category,
  is_required: false,
  sort_order: 0,
  is_active: true,
};

export default function OnboardingResources() {
  const [activeTab, setActiveTab] = useState<'resources' | 'completion'>('resources');
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<OnboardingResource[]>([]);
  const [teacherCompletions, setTeacherCompletions] = useState<TeacherCompletion[]>([]);
  const [completionLoading, setCompletionLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<OnboardingResource | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    if (activeTab === 'completion' && teacherCompletions.length === 0) {
      fetchTeacherCompletions();
    }
  }, [activeTab]);

  async function fetchResources() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('onboarding_resources')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeacherCompletions() {
    try {
      setCompletionLoading(true);

      // Fetch required resources count
      const { data: requiredResources } = await supabase
        .from('onboarding_resources')
        .select('id')
        .eq('is_required', true)
        .eq('is_active', true);

      const requiredIds = new Set((requiredResources || []).map((r) => r.id));
      const totalRequired = requiredIds.size;

      // Fetch all approved teachers with profiles
      const { data: teachers, error: teachersError } = await supabase
        .from('teacher_profiles')
        .select('id, user_id')
        .eq('status', 'approved');

      if (teachersError) throw teachersError;

      if (!teachers || teachers.length === 0) {
        setTeacherCompletions([]);
        setCompletionLoading(false);
        return;
      }

      // Fetch profiles for names
      const userIds = teachers.map((t) => t.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p.full_name || 'Unknown'])
      );

      // Fetch all progress records
      const teacherIds = teachers.map((t) => t.id);
      const { data: allProgress } = await supabase
        .from('teacher_onboarding_progress')
        .select('teacher_id, resource_id, read_at')
        .in('teacher_id', teacherIds);

      // Build completion data
      const completions: TeacherCompletion[] = teachers.map((teacher) => {
        const teacherProgress = (allProgress || []).filter(
          (p) => p.teacher_id === teacher.id
        );
        const requiredRead = teacherProgress.filter((p) =>
          requiredIds.has(p.resource_id)
        ).length;
        const totalRead = teacherProgress.length;

        const readDates = teacherProgress
          .map((p) => p.read_at)
          .filter(Boolean)
          .sort()
          .reverse();

        return {
          teacher_id: teacher.id,
          teacher_name: profileMap.get(teacher.user_id) || 'Unknown',
          required_read: requiredRead,
          total_required: totalRequired,
          total_read: totalRead,
          last_activity: readDates.length > 0 ? readDates[0] : null,
        };
      });

      // Sort: incomplete first, then by name
      completions.sort((a, b) => {
        const aComplete = a.required_read >= a.total_required;
        const bComplete = b.required_read >= b.total_required;
        if (aComplete !== bComplete) return aComplete ? 1 : -1;
        return a.teacher_name.localeCompare(b.teacher_name);
      });

      setTeacherCompletions(completions);
    } catch (error) {
      console.error('Error fetching teacher completions:', error);
      toast.error('Failed to load teacher completion data.');
    } finally {
      setCompletionLoading(false);
    }
  }

  function openCreateModal() {
    setEditingResource(null);
    setFormData({
      ...EMPTY_FORM,
      sort_order:
        resources.length > 0
          ? Math.max(...resources.map((r) => r.sort_order)) + 1
          : 1,
    });
    setShowModal(true);
  }

  function openEditModal(resource: OnboardingResource) {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      title_arabic: resource.title_arabic || '',
      description: resource.description || '',
      description_arabic: resource.description_arabic || '',
      resource_type: resource.resource_type,
      file_url: resource.file_url || '',
      external_url: resource.external_url || '',
      language: resource.language,
      category: resource.category,
      is_required: resource.is_required,
      sort_order: resource.sort_order,
      is_active: resource.is_active,
    });
    setShowModal(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const filePath = `resources/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('onboarding-resources')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('onboarding-resources').getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, file_url: publicUrl }));
      toast.success('File uploaded successfully.');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!formData.title.trim()) {
      toast.error('Title is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        title_arabic: formData.title_arabic.trim() || null,
        description: formData.description.trim() || null,
        description_arabic: formData.description_arabic.trim() || null,
        resource_type: formData.resource_type,
        file_url: formData.file_url.trim() || null,
        external_url: formData.external_url.trim() || null,
        language: formData.language,
        category: formData.category,
        is_required: formData.is_required,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };

      if (editingResource) {
        const { error } = await supabase
          .from('onboarding_resources')
          .update(payload)
          .eq('id', editingResource.id);

        if (error) throw error;
        toast.success('Resource updated.');
      } else {
        const { error } = await supabase
          .from('onboarding_resources')
          .insert(payload);

        if (error) throw error;
        toast.success('Resource created.');
      }

      setShowModal(false);
      setEditingResource(null);
      fetchResources();
    } catch (error: any) {
      console.error('Error saving resource:', error);
      toast.error(error.message || 'Failed to save resource.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(resource: OnboardingResource) {
    try {
      const { error } = await supabase
        .from('onboarding_resources')
        .update({ is_active: !resource.is_active })
        .eq('id', resource.id);

      if (error) throw error;
      toast.success(
        resource.is_active ? 'Resource deactivated.' : 'Resource activated.'
      );
      fetchResources();
    } catch (error) {
      console.error('Error toggling resource:', error);
      toast.error('Failed to update resource.');
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      const { error } = await supabase
        .from('onboarding_resources')
        .delete()
        .eq('id', deletingId);

      if (error) throw error;
      toast.success('Resource deleted.');
      setDeletingId(null);
      setConfirmDelete(false);
      fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Onboarding Resources
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage teacher onboarding materials and track completion.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Add Resource
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('resources')}
          className={`pb-3 px-1 font-medium text-sm transition border-b-2 ${
            activeTab === 'resources'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Resources ({resources.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('completion')}
          className={`pb-3 px-1 font-medium text-sm transition border-b-2 ${
            activeTab === 'completion'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Teacher Completion
          </div>
        </button>
      </div>

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {resources.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No resources yet. Click "Add Resource" to create one.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Language
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Required
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Active
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {resources.map((resource) => {
                    const TypeIcon = TYPE_ICONS[resource.resource_type];
                    return (
                      <tr
                        key={resource.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                          !resource.is_active ? 'opacity-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                              <TypeIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[250px]">
                                {resource.title}
                              </p>
                              {resource.title_arabic && (
                                <p
                                  className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[250px]"
                                  dir="rtl"
                                >
                                  {resource.title_arabic}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {resource.resource_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {CATEGORY_LABELS[resource.category]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {resource.language}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {resource.is_required ? (
                            <span className="inline-flex bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs px-2 py-0.5 rounded-full">
                              Required
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleActive(resource)}
                            title={resource.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {resource.is_active ? (
                              <ToggleRight className="w-6 h-6 text-emerald-500 mx-auto" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-gray-400 mx-auto" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {resource.sort_order}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(resource)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingId(resource.id);
                                setConfirmDelete(true);
                              }}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Completion Tab */}
      {activeTab === 'completion' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {completionLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : teacherCompletions.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No approved teachers found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Required Read
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Read
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {teacherCompletions.map((teacher) => {
                    const allComplete =
                      teacher.total_required > 0 &&
                      teacher.required_read >= teacher.total_required;
                    const partial =
                      teacher.required_read > 0 && !allComplete;
                    const none = teacher.required_read === 0 && teacher.total_required > 0;

                    let rowBg = '';
                    if (allComplete) rowBg = 'bg-emerald-50/50 dark:bg-emerald-900/10';
                    else if (partial) rowBg = 'bg-yellow-50/50 dark:bg-yellow-900/10';
                    else if (none) rowBg = 'bg-red-50/50 dark:bg-red-900/10';

                    return (
                      <tr
                        key={teacher.teacher_id}
                        className={`${rowBg} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {teacher.teacher_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-sm font-medium ${
                              allComplete
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {teacher.required_read}/{teacher.total_required}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {teacher.total_read}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {teacher.last_activity
                              ? format(
                                  new Date(teacher.last_activity),
                                  'MMM d, yyyy'
                                )
                              : 'No activity'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {allComplete ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Complete
                            </span>
                          ) : partial ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-1 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              In Progress
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2.5 py-1 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              Not Started
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Resource Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingResource ? 'Edit Resource' : 'Add Resource'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingResource(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Title (English) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title (English) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="Resource title"
                />
              </div>

              {/* Title (Arabic) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title (Arabic)
                </label>
                <input
                  type="text"
                  value={formData.title_arabic}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      title_arabic: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="Arabic title (optional)"
                  dir="rtl"
                />
              </div>

              {/* Description (English) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (English)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                  placeholder="Resource description or article content"
                />
              </div>

              {/* Description (Arabic) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Arabic)
                </label>
                <textarea
                  value={formData.description_arabic}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description_arabic: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                  placeholder="Arabic description (optional)"
                  dir="rtl"
                />
              </div>

              {/* Row: Type + Language + Category */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.resource_type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        resource_type: e.target.value as ResourceType,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        language: e.target.value as Language,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    {LANGUAGE_OPTIONS.map((l) => (
                      <option key={l} value={l}>
                        {l.charAt(0).toUpperCase() + l.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value as Category,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PDF File Upload */}
              {formData.resource_type === 'pdf' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    PDF File
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-500 transition"
                  >
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Uploading...
                        </span>
                      </div>
                    ) : formData.file_url ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm text-emerald-600 dark:text-emerald-400">
                          File uploaded
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Click to upload PDF
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {formData.file_url && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {formData.file_url}
                    </p>
                  )}
                </div>
              )}

              {/* External URL (for video/link) */}
              {(formData.resource_type === 'video' ||
                formData.resource_type === 'link') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    External URL
                  </label>
                  <input
                    type="url"
                    value={formData.external_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        external_url: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              )}

              {/* Row: Sort Order + checkboxes */}
              <div className="grid grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sort_order: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    min={0}
                  />
                </div>

                <div className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="is_required"
                    checked={formData.is_required}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_required: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label
                    htmlFor="is_required"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Required
                  </label>
                </div>

                <div className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label
                    htmlFor="is_active"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Active
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingResource(null);
                }}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-lg transition"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingResource ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Delete Resource
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this resource? This action cannot
              be undone and will also remove all teacher progress records for this
              resource.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setConfirmDelete(false);
                  setDeletingId(null);
                }}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
