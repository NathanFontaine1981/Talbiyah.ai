import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Check, Plus, Clock, Sun } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import DashboardHeader from '../components/DashboardHeader';
import { DASHBOARD_WIDGETS, resolveEnabledWidgets, computeIsNewUser } from '../lib/dashboardWidgets';

export default function DashboardDiscover() {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('dashboard_widgets')
        .eq('id', user.id)
        .single();

      const isNewUser = await computeIsNewUser(supabase, user.id, user.created_at);

      setEnabled(resolveEnabledWidgets(profile?.dashboard_widgets, isNewUser));
      setLoading(false);
    })();
  }, []);

  async function toggleWidget(key: string) {
    const willEnable = !enabled.has(key);
    const next = new Set(enabled);
    if (willEnable) next.add(key); else next.delete(key);
    setEnabled(next);

    setSaving(key);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ dashboard_widgets: Array.from(next) })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving widget preference:', error);
      toast.error('Could not save your preference. Please try again.');
      // revert on failure
      const reverted = new Set(enabled);
      setEnabled(reverted);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-6 mb-6 shadow-lg">
          <h1 className="text-2xl font-bold text-white mb-1">Customise Your Dashboard</h1>
          <p className="text-white/80 text-sm">Add whatever's useful to you - remove it any time.</p>
        </div>

        {/* Fixed core - always shown, can't be removed */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Always on your dashboard</p>
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-300">
              <Sun className="w-4 h-4 text-amber-500" />
              Prayer Times
            </div>
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-300">
              <Clock className="w-4 h-4 text-emerald-500" />
              Upcoming Lessons
            </div>
          </div>
        </div>

        {/* Toggleable widgets */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
        ) : (
          <div className="space-y-3">
            {DASHBOARD_WIDGETS.map(widget => {
              const isEnabled = enabled.has(widget.key);
              return (
                <button
                  key={widget.key}
                  onClick={() => toggleWidget(widget.key)}
                  disabled={saving === widget.key}
                  className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border-2 transition disabled:opacity-60 ${
                    isEnabled
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-300'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isEnabled ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}
                  >
                    {isEnabled ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{widget.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{widget.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
