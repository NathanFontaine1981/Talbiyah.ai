import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import {
  FileText,
  Video,
  BookOpen,
  ExternalLink,
  CheckCircle,
  Circle,
  Loader2,
  ArrowLeft,
  X,
  Globe,
  Filter,
  Download,
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
}

interface ProgressRecord {
  resource_id: string;
  read_at: string;
}

const CATEGORY_LABELS: Record<Category, string> = {
  platform_guide: 'Platform Guide',
  teaching_methodology: 'Teaching Methodology',
  safeguarding: 'Safeguarding',
  technology: 'Technology',
  policy: 'Policy',
  general: 'General',
};

const CATEGORY_COLORS: Record<Category, string> = {
  platform_guide:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  teaching_methodology:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  safeguarding:
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  technology:
    'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  policy:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  general:
    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
};

const LANGUAGE_LABELS: Record<Language, string> = {
  english: 'English',
  arabic: 'Arabic',
  both: 'Bilingual',
};

const TYPE_ICONS: Record<ResourceType, typeof FileText> = {
  pdf: FileText,
  video: Video,
  article: BookOpen,
  link: ExternalLink,
};

export default function TeacherResources() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<OnboardingResource[]>([]);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [teacherProfileId, setTeacherProfileId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedResource, setSelectedResource] = useState<OnboardingResource | null>(null);
  const [markingRead, setMarkingRead] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Get teacher profile
      const { data: teacherProfile, error: tpError } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (tpError || !teacherProfile) {
        toast.error('Could not find your teacher profile.');
        navigate('/dashboard');
        return;
      }

      setTeacherProfileId(teacherProfile.id);

      // Fetch active resources
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('onboarding_resources')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (resourcesError) throw resourcesError;
      setResources(resourcesData || []);

      // Fetch progress
      const { data: progressData, error: progressError } = await supabase
        .from('teacher_onboarding_progress')
        .select('resource_id, read_at')
        .eq('teacher_id', teacherProfile.id);

      if (progressError) throw progressError;
      setProgress(progressData || []);
    } catch (error) {
      console.error('Error loading resources:', error);
      toast.error('Failed to load resources.');
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(resourceId: string) {
    if (!teacherProfileId) return;
    setMarkingRead(true);
    try {
      const { error } = await supabase
        .from('teacher_onboarding_progress')
        .insert({
          teacher_id: teacherProfileId,
          resource_id: resourceId,
        });

      if (error) {
        // Unique constraint violation means already read
        if (error.code === '23505') {
          toast.info('Already marked as read.');
        } else {
          throw error;
        }
      } else {
        toast.success('Marked as read!');
        setProgress((prev) => [
          ...prev,
          { resource_id: resourceId, read_at: new Date().toISOString() },
        ]);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read.');
    } finally {
      setMarkingRead(false);
    }
  }

  function isRead(resourceId: string): boolean {
    return progress.some((p) => p.resource_id === resourceId);
  }

  function getReadDate(resourceId: string): string | null {
    const record = progress.find((p) => p.resource_id === resourceId);
    return record ? record.read_at : null;
  }

  const requiredResources = resources.filter((r) => r.is_required);
  const requiredCompleted = requiredResources.filter((r) => isRead(r.id));
  const progressPercent =
    requiredResources.length > 0
      ? Math.round((requiredCompleted.length / requiredResources.length) * 100)
      : 100;

  const filteredResources =
    selectedCategory === 'all'
      ? resources
      : resources.filter((r) => r.category === selectedCategory);

  const categories: (Category | 'all')[] = [
    'all',
    'platform_guide',
    'teaching_methodology',
    'safeguarding',
    'technology',
    'policy',
    'general',
  ];

  // Only show categories that have resources
  const activeCategories = categories.filter(
    (c) => c === 'all' || resources.some((r) => r.category === c)
  );

  function openResource(resource: OnboardingResource) {
    if (resource.resource_type === 'link' && resource.external_url) {
      window.open(resource.external_url, '_blank', 'noopener,noreferrer');
      if (!isRead(resource.id)) {
        markAsRead(resource.id);
      }
      return;
    }
    setSelectedResource(resource);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/teacher')}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition" />
          <span>Back to Teacher Hub</span>
        </button>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Teacher Resources
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review onboarding materials and track your progress.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {requiredCompleted.length} of {requiredResources.length} required
              resources completed
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {progressPercent}%
            </span>
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-emerald-500 rounded-full h-3 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {progressPercent === 100 && requiredResources.length > 0 && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
              All required resources completed!
            </p>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          {activeCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Resource Grid */}
        {filteredResources.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No resources found in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((resource) => {
              const TypeIcon = TYPE_ICONS[resource.resource_type];
              const read = isRead(resource.id);
              const readDate = getReadDate(resource.id);

              return (
                <div
                  key={resource.id}
                  onClick={() => openResource(resource)}
                  className={`bg-white dark:bg-gray-800 rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer ${
                    read
                      ? 'border-emerald-200 dark:border-emerald-800'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {/* Top row: type icon + badges */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <TypeIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            CATEGORY_COLORS[resource.category]
                          }`}
                        >
                          {CATEGORY_LABELS[resource.category]}
                        </span>
                        {resource.is_required && (
                          <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs px-2 py-0.5 rounded-full">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Read status */}
                    {read ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {resource.title}
                  </h3>
                  {resource.title_arabic && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-arabic" dir="rtl">
                      {resource.title_arabic}
                    </p>
                  )}

                  {/* Description excerpt */}
                  {resource.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {resource.description}
                    </p>
                  )}

                  {/* Footer: language + read status */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Globe className="w-3 h-3" />
                      <span>{LANGUAGE_LABELS[resource.language]}</span>
                    </div>
                    {read && readDate && (
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                        Read {format(new Date(readDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resource Detail Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      CATEGORY_COLORS[selectedResource.category]
                    }`}
                  >
                    {CATEGORY_LABELS[selectedResource.category]}
                  </span>
                  {selectedResource.is_required && (
                    <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs px-2 py-0.5 rounded-full">
                      Required
                    </span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {selectedResource.resource_type}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedResource.title}
                </h2>
                {selectedResource.title_arabic && (
                  <p
                    className="text-base text-gray-500 dark:text-gray-400 mt-1 font-arabic"
                    dir="rtl"
                  >
                    {selectedResource.title_arabic}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedResource(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Description */}
              {selectedResource.description && (
                <div className="mb-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedResource.description}
                  </p>
                </div>
              )}
              {selectedResource.description_arabic && (
                <div className="mb-4" dir="rtl">
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap font-arabic">
                    {selectedResource.description_arabic}
                  </p>
                </div>
              )}

              {/* PDF embed */}
              {selectedResource.resource_type === 'pdf' &&
                selectedResource.file_url && (
                  <div className="mt-4">
                    <iframe
                      src={selectedResource.file_url}
                      className="w-full h-96 rounded-lg border border-gray-200 dark:border-gray-700"
                      title={selectedResource.title}
                    />
                    <a
                      href={selectedResource.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <Download className="w-4 h-4" />
                      Open PDF in new tab
                    </a>
                  </div>
                )}

              {/* Video embed */}
              {selectedResource.resource_type === 'video' &&
                selectedResource.external_url && (
                  <div className="mt-4">
                    {selectedResource.external_url.includes('youtube.com') ||
                    selectedResource.external_url.includes('youtu.be') ? (
                      <iframe
                        src={selectedResource.external_url
                          .replace('watch?v=', 'embed/')
                          .replace('youtu.be/', 'youtube.com/embed/')}
                        className="w-full aspect-video rounded-lg"
                        allowFullScreen
                        title={selectedResource.title}
                      />
                    ) : selectedResource.external_url.includes('vimeo.com') ? (
                      <iframe
                        src={selectedResource.external_url.replace(
                          'vimeo.com/',
                          'player.vimeo.com/video/'
                        )}
                        className="w-full aspect-video rounded-lg"
                        allowFullScreen
                        title={selectedResource.title}
                      />
                    ) : (
                      <a
                        href={selectedResource.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <Video className="w-5 h-5" />
                        Open video in new tab
                      </a>
                    )}
                  </div>
                )}

              {/* Link type (shouldn't normally reach here since we open in new tab, but just in case) */}
              {selectedResource.resource_type === 'link' &&
                selectedResource.external_url && (
                  <div className="mt-4">
                    <a
                      href={selectedResource.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Open link in new tab
                    </a>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Globe className="w-4 h-4" />
                {LANGUAGE_LABELS[selectedResource.language]}
              </div>

              {isRead(selectedResource.id) ? (
                <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    Read on{' '}
                    {format(
                      new Date(getReadDate(selectedResource.id)!),
                      'MMM d, yyyy'
                    )}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => markAsRead(selectedResource.id)}
                  disabled={markingRead}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
                >
                  {markingRead ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Mark as Read
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
