import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  CheckCircle,
  Circle,
  Loader2,
  X,
  ChevronRight,
  PartyPopper,
} from 'lucide-react';

interface OnboardingChecklistProps {
  teacherProfileId: string;
  userId: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string | null;
  check_type: string;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
}

interface CheckStatus {
  itemId: string;
  completed: boolean;
  actionLabel?: string;
  actionPath?: string;
}

const DISMISSED_KEY = 'talbiyah_onboarding_checklist_dismissed';

export default function OnboardingChecklist({
  teacherProfileId,
  userId,
}: OnboardingChecklistProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [statuses, setStatuses] = useState<Map<string, CheckStatus>>(new Map());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISSED_KEY);
    if (wasDismissed === 'true') {
      setDismissed(true);
      setLoading(false);
      return;
    }
    loadChecklist();
  }, [teacherProfileId, userId]);

  async function loadChecklist() {
    try {
      // Fetch active checklist items
      const { data: items, error: itemsError } = await supabase
        .from('onboarding_checklist_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (itemsError) throw itemsError;
      if (!items || items.length === 0) {
        setLoading(false);
        return;
      }

      setChecklistItems(items);

      // Now check each item's status based on check_type
      const statusMap = new Map<string, CheckStatus>();

      // Fetch teacher profile for profile_complete and video_intro_uploaded
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('bio, video_intro_url')
        .eq('id', teacherProfileId)
        .single();

      // Fetch availability count
      const { count: availabilityCount } = await supabase
        .from('teacher_availability_recurring')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', teacherProfileId);

      // Fetch required resources and progress
      const { data: requiredResources } = await supabase
        .from('onboarding_resources')
        .select('id')
        .eq('is_required', true)
        .eq('is_active', true);

      const { data: progressRecords } = await supabase
        .from('teacher_onboarding_progress')
        .select('resource_id')
        .eq('teacher_id', teacherProfileId);

      const readResourceIds = new Set(
        (progressRecords || []).map((p) => p.resource_id)
      );
      const allRequiredRead =
        (requiredResources || []).length > 0
          ? (requiredResources || []).every((r) => readResourceIds.has(r.id))
          : true;

      // Fetch payment settings
      const { data: paymentSettings } = await supabase
        .from('teacher_payment_settings')
        .select('id')
        .eq('teacher_id', teacherProfileId);

      for (const item of items) {
        let completed = false;
        let actionLabel: string | undefined;
        let actionPath: string | undefined;

        switch (item.check_type) {
          case 'profile_complete':
            completed =
              !!teacherProfile?.bio &&
              teacherProfile.bio.trim() !== '';
            actionLabel = 'Complete Profile';
            actionPath = '/teacher/edit-profile';
            break;

          case 'video_intro_uploaded':
            completed =
              !!teacherProfile?.video_intro_url &&
              teacherProfile.video_intro_url.trim() !== '';
            actionLabel = 'Upload Video';
            actionPath = '/teacher/edit-profile';
            break;

          case 'availability_set':
            completed = (availabilityCount || 0) > 0;
            actionLabel = 'Set Availability';
            actionPath = '/teacher/availability';
            break;

          case 'resources_read':
            completed = allRequiredRead;
            actionLabel = 'View Resources';
            actionPath = '/teacher/resources';
            break;

          case 'payment_setup':
            completed = (paymentSettings || []).length > 0;
            actionLabel = 'Setup Payment';
            actionPath = '/teacher/payment-settings';
            break;

          case 'trial_lesson_done':
            completed = false;
            actionLabel = 'View Schedule';
            actionPath = '/teacher/schedule';
            break;

          case 'manual':
          default:
            completed = false;
            break;
        }

        statusMap.set(item.id, {
          itemId: item.id,
          completed,
          actionLabel,
          actionPath,
        });
      }

      setStatuses(statusMap);
    } catch (error) {
      console.error('Error loading onboarding checklist:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  }

  if (dismissed || loading) {
    if (loading) {
      return null; // Don't show a loading spinner for a widget
    }
    return null;
  }

  if (checklistItems.length === 0) {
    return null;
  }

  const requiredItems = checklistItems.filter((item) => item.is_required);
  const completedCount = requiredItems.filter((item) => {
    const status = statuses.get(item.id);
    return status?.completed;
  }).length;
  const totalRequired = requiredItems.length;
  const allComplete = totalRequired > 0 && completedCount >= totalRequired;
  const progressPercent =
    totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 100;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6 mb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          {allComplete ? (
            <div className="flex items-center gap-2 mb-1">
              <PartyPopper className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                You're all set!
              </h3>
            </div>
          ) : (
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Complete Your Onboarding
            </h3>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {allComplete
              ? 'All required onboarding steps are complete. Welcome aboard!'
              : `${completedCount} of ${totalRequired} required steps complete`}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition"
          title="Dismiss"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <div className="bg-emerald-200 dark:bg-emerald-900/50 rounded-full h-2.5">
          <div
            className="bg-emerald-500 dark:bg-emerald-400 rounded-full h-2.5 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      {!allComplete && (
        <div className="space-y-2">
          {checklistItems.map((item) => {
            const status = statuses.get(item.id);
            const completed = status?.completed || false;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg transition ${
                  completed
                    ? 'bg-white/50 dark:bg-gray-800/30'
                    : 'bg-white dark:bg-gray-800/60'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {completed ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-sm ${
                        completed
                          ? 'text-gray-500 dark:text-gray-400 line-through'
                          : 'text-gray-900 dark:text-white font-medium'
                      }`}
                    >
                      {item.title}
                      {item.is_required && !completed && (
                        <span className="ml-1.5 text-xs text-red-500 dark:text-red-400">
                          *
                        </span>
                      )}
                    </p>
                    {item.description && !completed && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {!completed && status?.actionLabel && status?.actionPath && (
                  <button
                    onClick={() => navigate(status.actionPath!)}
                    className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm hover:underline flex-shrink-0 ml-3"
                  >
                    {status.actionLabel}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
