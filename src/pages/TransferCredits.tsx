import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send, ArrowLeft, AlertCircle, CheckCircle, Loader2, Info, History, Clock, Heart, Users, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface TransferHistory {
  id: string;
  credits_amount: number;
  notes: string | null;
  created_at: string;
  direction: 'sent' | 'received';
  other_user_name: string;
  other_user_email: string;
}

interface SadaqahPool {
  total_donated: number;
  total_allocated: number;
  balance: number;
  total_donors: number;
  total_recipients: number;
  lessons_funded: number;
}

interface SadaqahDonation {
  id: string;
  credits_amount: number;
  notes: string | null;
  created_at: string;
}

export default function TransferCredits() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'sadaqah' ? 'sadaqah' : 'transfer';
  const [activeTab, setActiveTab] = useState<'transfer' | 'sadaqah'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [checkingRecipient, setCheckingRecipient] = useState(false);
  const [currentCredits, setCurrentCredits] = useState<number>(0);
  const [transferableCredits, setTransferableCredits] = useState<number>(0);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [credits, setCredits] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [transferHistory, setTransferHistory] = useState<TransferHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Sadaqah state
  const [sadaqahCredits, setSadaqahCredits] = useState<string>('');
  const [sadaqahNotes, setSadaqahNotes] = useState('');
  const [sadaqahPool, setSadaqahPool] = useState<SadaqahPool | null>(null);
  const [sadaqahDonations, setSadaqahDonations] = useState<SadaqahDonation[]>([]);
  const [sadaqahLoading, setSadaqahLoading] = useState(false);

  useEffect(() => {
    loadCreditsInfo();
    loadTransferHistory();
    loadSadaqahData();
  }, []);

  async function loadCreditsInfo() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signup');
        return;
      }

      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('credits_remaining')
        .eq('user_id', user.id)
        .maybeSingle();

      setCurrentCredits(creditsData?.credits_remaining || 0);

      const { data: transferableData, error: transferableError } = await supabase.rpc(
        'get_transferable_credits',
        { p_user_id: user.id }
      );

      if (!transferableError) {
        setTransferableCredits(transferableData || 0);
      }
    } catch (err) {
      console.error('Error loading credits:', err);
    }
  }

  async function loadTransferHistory() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: transfers, error } = await supabase
        .from('credit_transfers')
        .select(`
          id,
          credits_amount,
          notes,
          created_at,
          from_user_id,
          to_user_id,
          sender:profiles!credit_transfers_from_user_id_fkey(full_name, email),
          recipient:profiles!credit_transfers_to_user_id_fkey(full_name, email)
        `)
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading history:', error);
        return;
      }

      const history: TransferHistory[] = (transfers || []).map((t: any) => ({
        id: t.id,
        credits_amount: t.credits_amount,
        notes: t.notes,
        created_at: t.created_at,
        direction: t.from_user_id === user.id ? 'sent' : 'received',
        other_user_name: t.from_user_id === user.id ? t.recipient?.full_name : t.sender?.full_name,
        other_user_email: t.from_user_id === user.id ? t.recipient?.email : t.sender?.email,
      }));

      setTransferHistory(history);
    } catch (err) {
      console.error('Error:', err);
    }
  }

  async function loadSadaqahData() {
    try {
      // Load pool stats
      const { data: poolData } = await supabase
        .from('sadaqah_pool')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (poolData) setSadaqahPool(poolData);

      // Load user's donation history
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: donations } = await supabase
        .from('sadaqah_donations')
        .select('id, credits_amount, notes, created_at')
        .eq('donor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (donations) setSadaqahDonations(donations);
    } catch (err) {
      console.error('Error loading sadaqah data:', err);
    }
  }

  async function checkRecipient(email: string) {
    if (!email || !email.includes('@')) {
      setRecipientName(null);
      return;
    }

    setCheckingRecipient(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (error || !data) {
        setRecipientName(null);
      } else {
        setRecipientName(data.full_name);
      }
    } catch (err) {
      setRecipientName(null);
    } finally {
      setCheckingRecipient(false);
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(null);

    const creditsNum = parseFloat(credits);

    if (!recipientEmail || !recipientEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!credits || isNaN(creditsNum) || creditsNum <= 0) {
      setError('Please enter a valid credit amount');
      return;
    }

    if (creditsNum > transferableCredits) {
      setError(`You can only transfer up to ${transferableCredits} credits. Credits purchased within the last 14 days cannot be transferred.`);
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/signup');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transfer-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim().toLowerCase(),
          credits: creditsNum,
          notes: notes.trim() || null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Transfer failed');
        return;
      }

      setSuccess(result.message);
      setRecipientEmail('');
      setCredits('');
      setNotes('');
      setRecipientName(null);

      loadCreditsInfo();
      loadTransferHistory();
    } catch (err: any) {
      console.error('Transfer error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSadaqahDonation(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(null);

    const creditsNum = parseFloat(sadaqahCredits);

    if (!sadaqahCredits || isNaN(creditsNum) || creditsNum <= 0) {
      setError('Please enter a valid credit amount');
      return;
    }

    if (creditsNum > transferableCredits) {
      setError(`You can only donate up to ${transferableCredits} credits. Credits purchased within the last 14 days cannot be donated.`);
      return;
    }

    setSadaqahLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signup');
        return;
      }

      const { data, error: rpcError } = await supabase.rpc('donate_as_sadaqah', {
        p_user_id: user.id,
        p_credits: creditsNum,
        p_notes: sadaqahNotes.trim() || null,
      });

      if (rpcError) {
        setError(rpcError.message || 'Donation failed');
        return;
      }

      if (data && !data.success) {
        setError(data.error || 'Donation failed');
        return;
      }

      setSuccess(data?.message || `JazakAllahu Khayran! ${creditsNum} credit(s) donated as Sadaqah.`);
      setSadaqahCredits('');
      setSadaqahNotes('');

      loadCreditsInfo();
      loadSadaqahData();
    } catch (err: any) {
      console.error('Sadaqah error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSadaqahLoading(false);
    }
  }

  const nonTransferableCredits = currentCredits - transferableCredits;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Header with Balance */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transfer & Donate</h1>
              <p className="text-gray-500 dark:text-gray-400">Share credits or give as Sadaqah</p>
            </div>
          </div>

          {/* Credit Balance Info */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentCredits} credits</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
              <p className="text-sm text-emerald-600 dark:text-emerald-400">Available</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{transferableCredits} credits</p>
            </div>
          </div>

          {nonTransferableCredits > 0 && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <strong>{nonTransferableCredits} credits</strong> are from recent purchases (within 14 days) and cannot be transferred or donated yet.
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-1 mb-6 flex" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'transfer'}
            onClick={() => { setActiveTab('transfer'); setError(''); setSuccess(null); }}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === 'transfer'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Send className="w-4 h-4" />
            Transfer
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'sadaqah'}
            onClick={() => { setActiveTab('sadaqah'); setError(''); setSuccess(null); }}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === 'sadaqah'
                ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Heart className="w-4 h-4" />
            Sadaqah
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-800 dark:text-emerald-300">{success}</p>
          </div>
        )}

        {/* ────── Transfer Tab ────── */}
        {activeTab === 'transfer' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transfer Details</h2>

              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => { setRecipientEmail(e.target.value); setError(''); }}
                    onBlur={() => checkRecipient(recipientEmail)}
                    placeholder="friend@example.com"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                  {checkingRecipient && (
                    <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                    </p>
                  )}
                  {recipientName && !checkingRecipient && (
                    <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {recipientName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Credits to Transfer
                  </label>
                  <input
                    type="number"
                    value={credits}
                    onChange={(e) => { setCredits(e.target.value); setError(''); }}
                    placeholder="1"
                    min="0.5"
                    max={transferableCredits}
                    step="0.5"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Maximum: {transferableCredits} credits
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Note (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., For your Arabic lessons"
                    rows={2}
                    maxLength={200}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || transferableCredits === 0}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Transfer Credits
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Refund Policy:</strong> Credits can be refunded within 14 days of purchase. After 14 days,
                    credits cannot be refunded but can be transferred to other users or donated as Sadaqah.
                  </p>
                </div>
              </div>
            </div>

            {/* Transfer History */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transfer History</h2>
                </div>
                <span className="text-gray-400">{showHistory ? '▲' : '▼'}</span>
              </button>

              {showHistory && (
                <div className="mt-4 space-y-3">
                  {transferHistory.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">No transfers yet</p>
                  ) : (
                    transferHistory.map((transfer) => (
                      <div
                        key={transfer.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {transfer.direction === 'sent' ? (
                              <span className="text-red-600 dark:text-red-400">Sent to</span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400">Received from</span>
                            )}{' '}
                            {transfer.other_user_name || transfer.other_user_email}
                          </p>
                          {transfer.notes && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{transfer.notes}</p>
                          )}
                          <p className="text-xs text-gray-400">
                            {new Date(transfer.created_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            transfer.direction === 'sent'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {transfer.direction === 'sent' ? '-' : '+'}
                          {transfer.credits_amount}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ────── Sadaqah Tab ────── */}
        {activeTab === 'sadaqah' && (
          <>
            {/* Community Impact Card */}
            {sadaqahPool && (
              <div className="bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-900/20 dark:to-amber-900/20 rounded-2xl shadow-lg p-6 mb-6 border border-rose-200 dark:border-rose-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  Community Sadaqah Fund
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                  Helping new Muslims access Islamic education through the generosity of our community
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-3 text-center">
                    <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{sadaqahPool.total_donated}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Credits Donated</p>
                  </div>
                  <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-3 text-center">
                    <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{sadaqahPool.total_donors}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Donors</p>
                  </div>
                  <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-3 text-center">
                    <BookOpen className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{sadaqahPool.lessons_funded}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Lessons Funded</p>
                  </div>
                </div>
              </div>
            )}

            {/* Donation Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Donate as Sadaqah</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Your donated credits will be given to new Muslims who cannot afford lessons. Sadaqah is an ongoing charity — every lesson they take with your credits earns you reward, in sha Allah.
              </p>

              <form onSubmit={handleSadaqahDonation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Credits to Donate
                  </label>
                  <input
                    type="number"
                    value={sadaqahCredits}
                    onChange={(e) => { setSadaqahCredits(e.target.value); setError(''); }}
                    placeholder="1"
                    min="0.5"
                    max={transferableCredits}
                    step="0.5"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Available: {transferableCredits} credits
                  </p>
                </div>

                {/* Quick amount buttons */}
                <div className="flex gap-2">
                  {[1, 2, 4, 8].filter(n => n <= transferableCredits).map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setSadaqahCredits(amount.toString())}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition border ${
                        sadaqahCredits === amount.toString()
                          ? 'bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-400'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      {amount} credit{amount !== 1 ? 's' : ''}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message (Optional)
                  </label>
                  <textarea
                    value={sadaqahNotes}
                    onChange={(e) => setSadaqahNotes(e.target.value)}
                    placeholder="e.g., For the sake of Allah"
                    rows={2}
                    maxLength={200}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-700 dark:text-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sadaqahLoading || transferableCredits === 0}
                  className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {sadaqahLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5" />
                      Donate as Sadaqah
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    Donated credits go into the Sadaqah Fund. Our team allocates them to verified new Muslim students who need help accessing Islamic education.
                  </p>
                </div>
              </div>
            </div>

            {/* Donation History */}
            {sadaqahDonations.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Donations</h2>
                </div>
                <div className="space-y-3">
                  {sadaqahDonations.map((donation) => (
                    <div
                      key={donation.id}
                      className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-900/30"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-rose-500" />
                          Sadaqah Donation
                        </p>
                        {donation.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{donation.notes}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {new Date(donation.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                        {donation.credits_amount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
