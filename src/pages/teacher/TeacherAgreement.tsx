import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import {
  Heart, BookOpen, ShieldCheck, Clock, ClipboardCheck, BadgePoundSterling,
  Lock, CheckCircle, Loader, ScrollText, PenLine,
} from 'lucide-react';
import Markdown from '../../components/Markdown';
import { AGREEMENT_INTRO, AGREEMENT_SECTIONS, AGREEMENT_VERSION } from '../../data/teacherAgreement';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart, BookOpen, ShieldCheck, Clock, ClipboardCheck, BadgePoundSterling, Lock,
};

export default function TeacherAgreement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [signedName, setSignedName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/', { state: { showSignIn: true } }); return; }

        const { data: profile } = await supabase
          .from('teacher_profiles')
          .select('id, status, agreement_accepted_at, agreement_version, full_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profile) { navigate('/apply-to-teach'); return; }
        if (profile.status !== 'approved') { navigate('/teacher/pending-approval'); return; }

        // Already accepted the current version → straight to the hub.
        if (profile.agreement_accepted_at && profile.agreement_version === AGREEMENT_VERSION) {
          navigate('/teacher/hub');
          return;
        }

        setTeacherId(profile.id);
        if (profile.full_name) setSignedName(profile.full_name);
      } catch (e) {
        console.error('Error loading agreement:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const allChecked = checked.size === AGREEMENT_SECTIONS.length;
  const canSubmit = allChecked && signedName.trim().length >= 2 && !submitting;

  const remaining = useMemo(
    () => AGREEMENT_SECTIONS.length - checked.size,
    [checked]
  );

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleAccept() {
    if (!teacherId || !canSubmit) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('teacher_profiles')
        .update({
          agreement_accepted_at: new Date().toISOString(),
          agreement_version: AGREEMENT_VERSION,
          agreement_signed_name: signedName.trim(),
        })
        .eq('id', teacherId);
      if (error) throw error;
      toast.success('Thank you — welcome aboard!');
      navigate('/teacher/hub');
    } catch (e) {
      console.error('Error accepting agreement:', e);
      toast.error('Could not save your acceptance. Please try again.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 mb-4">
            <ScrollText className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Your Teaching Agreement</h1>
          <p className="text-gray-500 mt-2">Please read and confirm each section before you begin teaching.</p>
        </div>

        {/* Intro */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <Markdown>{AGREEMENT_INTRO}</Markdown>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {AGREEMENT_SECTIONS.map((section, i) => {
            const Icon = ICONS[section.icon] || ShieldCheck;
            const isChecked = checked.has(section.id);
            return (
              <div
                key={section.id}
                className={`rounded-2xl border shadow-sm transition-colors ${
                  isChecked ? 'border-emerald-300 bg-emerald-50/40' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${isChecked ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      <Icon className={`w-5 h-5 ${isChecked ? 'text-emerald-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-gray-900">
                        <span className="text-emerald-600">{i + 1}.</span> {section.title}
                      </h2>
                    </div>
                  </div>
                  <Markdown>{section.body}</Markdown>

                  <label className={`mt-2 flex items-center gap-3 cursor-pointer select-none rounded-lg p-3 border transition-colors ${
                    isChecked ? 'border-emerald-300 bg-white' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(section.id)}
                      className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className={`text-sm font-medium ${isChecked ? 'text-emerald-700' : 'text-gray-700'}`}>
                      I have read and agree to “{section.title}”.
                    </span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {/* Signature + confirm */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <PenLine className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900">Confirm & Sign</h2>
          </div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Type your full name as your signature
          </label>
          <input
            type="text"
            value={signedName}
            onChange={(e) => setSignedName(e.target.value)}
            placeholder="Your full name"
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
          />

          {!allChecked && (
            <p className="text-sm text-amber-600 mt-3">
              Please tick all {AGREEMENT_SECTIONS.length} sections to continue ({remaining} remaining).
            </p>
          )}

          <button
            onClick={handleAccept}
            disabled={!canSubmit}
            className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><Loader className="w-5 h-5 animate-spin" /> Saving…</>
            ) : (
              <><CheckCircle className="w-5 h-5" /> I agree — let me start teaching</>
            )}
          </button>
          <p className="text-xs text-gray-400 mt-3 text-center">
            By confirming, you agree to uphold this covenant (version {AGREEMENT_VERSION}) while teaching on Talbiyah.
          </p>
        </div>
      </div>
    </div>
  );
}
