import { useState, useEffect } from 'react';
import { Heart, Users, BookOpen, Loader2, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface SadaqahPool {
  total_donated: number;
  total_allocated: number;
  balance: number;
  total_donors: number;
  total_recipients: number;
  lessons_funded: number;
}

interface Donation {
  id: string;
  credits_amount: number;
  notes: string | null;
  created_at: string;
  donor_name: string;
  donor_email: string;
}

interface Allocation {
  id: string;
  credits_amount: number;
  reason: string | null;
  created_at: string;
  recipient_name: string;
  recipient_email: string;
  allocated_by_name: string;
}

export default function SadaqahManagement() {
  const [pool, setPool] = useState<SadaqahPool | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Allocation form
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientResults, setRecipientResults] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; full_name: string; email: string } | null>(null);
  const [allocateCredits, setAllocateCredits] = useState('');
  const [allocateReason, setAllocateReason] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Load pool stats
      const { data: poolData } = await supabase
        .from('sadaqah_pool')
        .select('*')
        .eq('id', 1)
        .single();

      if (poolData) setPool(poolData);

      // Load recent donations (admin can see all via RLS policy)
      const { data: donationsData } = await supabase
        .from('sadaqah_donations')
        .select('id, credits_amount, notes, created_at, donor_id')
        .order('created_at', { ascending: false })
        .limit(20);

      if (donationsData) {
        // Fetch donor profiles
        const donorIds = [...new Set(donationsData.map(d => d.donor_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', donorIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        setDonations(donationsData.map(d => ({
          id: d.id,
          credits_amount: d.credits_amount,
          notes: d.notes,
          created_at: d.created_at,
          donor_name: profileMap.get(d.donor_id)?.full_name || 'Unknown',
          donor_email: profileMap.get(d.donor_id)?.email || '',
        })));
      }

      // Load recent allocations
      const { data: allocationsData } = await supabase
        .from('sadaqah_allocations')
        .select('id, credits_amount, reason, created_at, recipient_id, allocated_by')
        .order('created_at', { ascending: false })
        .limit(20);

      if (allocationsData) {
        const userIds = [...new Set([
          ...allocationsData.map(a => a.recipient_id),
          ...allocationsData.map(a => a.allocated_by),
        ])];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        setAllocations(allocationsData.map(a => ({
          id: a.id,
          credits_amount: a.credits_amount,
          reason: a.reason,
          created_at: a.created_at,
          recipient_name: profileMap.get(a.recipient_id)?.full_name || 'Unknown',
          recipient_email: profileMap.get(a.recipient_id)?.email || '',
          allocated_by_name: profileMap.get(a.allocated_by)?.full_name || 'Admin',
        })));
      }
    } catch (err) {
      console.error('Error loading sadaqah data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function searchRecipients(query: string) {
    setRecipientSearch(query);
    if (query.length < 2) {
      setRecipientResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5);

      setRecipientResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }

  async function handleAllocate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedRecipient) {
      setError('Please select a recipient');
      return;
    }

    const creditsNum = parseFloat(allocateCredits);
    if (!creditsNum || creditsNum <= 0) {
      setError('Please enter a valid credit amount');
      return;
    }

    if (pool && creditsNum > pool.balance) {
      setError(`Pool only has ${pool.balance} credits available`);
      return;
    }

    setAllocating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: rpcError } = await supabase.rpc('allocate_sadaqah', {
        p_admin_id: user.id,
        p_recipient_id: selectedRecipient.id,
        p_credits: creditsNum,
        p_reason: allocateReason.trim() || null,
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      if (data && !data.success) {
        setError(data.error);
        return;
      }

      setSuccess(`Allocated ${creditsNum} credits to ${selectedRecipient.full_name}`);
      setSelectedRecipient(null);
      setRecipientSearch('');
      setAllocateCredits('');
      setAllocateReason('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Allocation failed');
    } finally {
      setAllocating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sadaqah Fund Management</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage community donations and allocate credits to new Muslims</p>
      </div>

      {/* Pool Overview */}
      {pool && (
        <div className="bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-900/20 dark:to-amber-900/20 rounded-2xl p-6 border border-rose-200 dark:border-rose-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            Fund Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-rose-600">{pool.balance}</p>
              <p className="text-xs text-gray-500">Available Balance</p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pool.total_donated}</p>
              <p className="text-xs text-gray-500">Total Donated</p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{pool.total_allocated}</p>
              <p className="text-xs text-gray-500">Total Allocated</p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{pool.total_donors}</p>
              <p className="text-xs text-gray-500">Donors</p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{pool.total_recipients}</p>
              <p className="text-xs text-gray-500">Recipients</p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{pool.lessons_funded}</p>
              <p className="text-xs text-gray-500">Lessons Funded</p>
            </div>
          </div>
        </div>
      )}

      {/* Allocate Credits Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Allocate Credits to Student</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <p className="text-emerald-700 dark:text-emerald-300 text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleAllocate} className="space-y-4">
          {/* Recipient Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Recipient
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={selectedRecipient ? `${selectedRecipient.full_name} (${selectedRecipient.email})` : recipientSearch}
                onChange={(e) => {
                  setSelectedRecipient(null);
                  searchRecipients(e.target.value);
                }}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Search Results Dropdown */}
            {recipientResults.length > 0 && !selectedRecipient && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
                {recipientResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedRecipient(user);
                      setRecipientResults([]);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition first:rounded-t-lg last:rounded-b-lg"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </button>
                ))}
              </div>
            )}
            {searching && (
              <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Searching...
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Credits to Allocate
              </label>
              <input
                type="number"
                value={allocateCredits}
                onChange={(e) => setAllocateCredits(e.target.value)}
                placeholder="e.g., 4"
                min="0.5"
                max={pool?.balance || 0}
                step="0.5"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
              <p className="mt-1 text-xs text-gray-500">Pool balance: {pool?.balance || 0}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={allocateReason}
                onChange={(e) => setAllocateReason(e.target.value)}
                placeholder="e.g., New Muslim, needs Qur'an lessons"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={allocating || !selectedRecipient || !allocateCredits}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition flex items-center gap-2"
          >
            {allocating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Allocating...
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" />
                Allocate Credits
              </>
            )}
          </button>
        </form>
      </div>

      {/* Two-column: Donations & Allocations */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Donations */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            Recent Donations
          </h2>
          {donations.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-6">No donations yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {donations.map((d) => (
                <div key={d.id} className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-900/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{d.donor_name}</p>
                      <p className="text-xs text-gray-500">{d.donor_email}</p>
                      {d.notes && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">"{d.notes}"</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-rose-600">{d.credits_amount}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Allocations */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Recent Allocations
          </h2>
          {allocations.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-6">No allocations yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allocations.map((a) => (
                <div key={a.id} className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{a.recipient_name}</p>
                      <p className="text-xs text-gray-500">{a.recipient_email}</p>
                      {a.reason && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{a.reason}</p>}
                      <p className="text-xs text-gray-400 mt-1">by {a.allocated_by_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">+{a.credits_amount}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
