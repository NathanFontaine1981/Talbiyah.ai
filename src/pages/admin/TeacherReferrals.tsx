import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { Users, UserPlus, X, ArrowLeft, PoundSterling } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Referrer {
  id: string;
  name: string;
  email: string;
  referral_hourly_rate: number;
}
interface TeacherRow {
  id: string;
  name: string;
  referred_by: string | null;
}

const fmt = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n || 0);

export default function TeacherReferrals() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [commission, setCommission] = useState<Record<string, { cleared: number; held: number; paid: number }>>({});
  const [addingTo, setAddingTo] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      // Referrers (teacher_profiles flagged is_referrer)
      const { data: refs } = await supabase
        .from('teacher_profiles')
        .select('id, referral_hourly_rate, profiles!teacher_profiles_user_id_fkey(full_name, email)')
        .eq('is_referrer', true);
      setReferrers((refs || []).map((r: any) => ({
        id: r.id, name: r.profiles?.full_name || '—', email: r.profiles?.email || '',
        referral_hourly_rate: Number(r.referral_hourly_rate ?? 4),
      })));

      // All approved teachers (for assigning) + who referred them
      const { data: tch } = await supabase
        .from('teacher_profiles')
        .select('id, referred_by, is_referrer, profiles!teacher_profiles_user_id_fkey(full_name)')
        .eq('status', 'approved');
      setTeachers((tch || []).filter((t: any) => !t.is_referrer).map((t: any) => ({
        id: t.id, name: t.profiles?.full_name || '—', referred_by: t.referred_by,
      })));

      // Commission totals per referrer
      const { data: earn } = await supabase
        .from('teacher_earnings')
        .select('teacher_id, amount_earned, status')
        .eq('is_referral_commission', true);
      const map: Record<string, { cleared: number; held: number; paid: number }> = {};
      (earn || []).forEach((e: any) => {
        const m = map[e.teacher_id] || { cleared: 0, held: 0, paid: 0 };
        if (e.status === 'cleared') m.cleared += Number(e.amount_earned);
        else if (e.status === 'held') m.held += Number(e.amount_earned);
        else if (e.status === 'paid') m.paid += Number(e.amount_earned);
        map[e.teacher_id] = m;
      });
      setCommission(map);
    } catch (e) {
      console.error('Error loading referrals:', e);
    } finally {
      setLoading(false);
    }
  }

  async function assign(teacherId: string, referrerId: string | null) {
    const { error } = await supabase.from('teacher_profiles').update({ referred_by: referrerId }).eq('id', teacherId);
    if (error) { toast.error(error.message); return; }
    toast.success(referrerId ? 'Teacher added to referrer' : 'Teacher removed');
    setAddingTo(null);
    load();
  }

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const unassigned = teachers.filter(t => !t.referred_by);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Admin
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Teacher Referrals</h1>
        <p className="text-gray-500 mb-8">Referrers earn commission per hour taught by teachers they referred. Commission is paid via Teacher Payouts.</p>

        {referrers.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm mb-6">
            No referrers yet. A referrer needs a payout profile — ask an admin to set one up.
          </div>
        )}

        {referrers.map((r) => {
          const myTeachers = teachers.filter(t => t.referred_by === r.id);
          const c = commission[r.id] || { cleared: 0, held: 0, paid: 0 };
          return (
            <div key={r.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{r.name}</h2>
                  <p className="text-sm text-gray-500">{r.email} · {fmt(r.referral_hourly_rate)}/hr commission</p>
                </div>
                <div className="flex gap-3 text-sm">
                  <div className="text-center"><p className="font-bold text-emerald-600">{fmt(c.cleared)}</p><p className="text-gray-500 text-xs">Ready</p></div>
                  <div className="text-center"><p className="font-bold text-amber-600">{fmt(c.held)}</p><p className="text-gray-500 text-xs">On hold</p></div>
                  <div className="text-center"><p className="font-bold text-gray-700">{fmt(c.paid)}</p><p className="text-gray-500 text-xs">Paid</p></div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">Referred teachers ({myTeachers.length})</p>
                <button onClick={() => setAddingTo(addingTo === r.id ? null : r.id)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                  <UserPlus className="w-4 h-4" /> Add teacher
                </button>
              </div>

              {addingTo === r.id && (
                <select onChange={(e) => e.target.value && assign(e.target.value, r.id)} defaultValue=""
                  className="w-full mb-3 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900">
                  <option value="">Select a teacher to add…</option>
                  {unassigned.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}

              <div className="space-y-2">
                {myTeachers.length === 0 && <p className="text-sm text-gray-400">No teachers yet.</p>}
                {myTeachers.map(t => (
                  <div key={t.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-900 flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" />{t.name}</span>
                    <button onClick={() => assign(t.id, null)} className="text-gray-400 hover:text-red-500" title="Remove">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={() => navigate('/admin/teacher-payouts')}
                className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                <PoundSterling className="w-4 h-4" /> Pay this referrer in Teacher Payouts
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
