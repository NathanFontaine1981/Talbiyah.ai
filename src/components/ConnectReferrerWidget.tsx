import { useState, useEffect } from 'react';
import { UserPlus, Check, Loader2, X, Gift } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface ConnectReferrerWidgetProps {
  userId: string;
  onConnected?: () => void;
}

export default function ConnectReferrerWidget({ userId, onConnected }: ConnectReferrerWidgetProps) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [hasReferrer, setHasReferrer] = useState(false);
  const [hasCompletedLesson, setHasCompletedLesson] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkEligibility();
  }, [userId]);

  async function checkEligibility() {
    try {
      // Check if user already has a referrer
      const { data: profile } = await supabase
        .from('profiles')
        .select('referred_by')
        .eq('id', userId)
        .single();

      if (profile?.referred_by) {
        setHasReferrer(true);
        setShow(false);
        setLoading(false);
        return;
      }

      // Check if user has completed any lessons
      const { data: learner } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', userId)
        .maybeSingle();

      if (learner) {
        const { data: completedLessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('learner_id', learner.id)
          .eq('status', 'completed')
          .limit(1);

        if (completedLessons && completedLessons.length > 0) {
          setHasCompletedLesson(true);
          setShow(false);
          setLoading(false);
          return;
        }
      }

      // User is eligible - no referrer and no completed lessons
      setShow(true);
      setLoading(false);
    } catch (error) {
      console.error('Error checking referral eligibility:', error);
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!referralCode.trim()) return;

    setSubmitting(true);
    try {
      // Look up the referrer by their referral code (case-insensitive)
      const { data: referrer, error: lookupError } = await supabase
        .from('profiles')
        .select('id, full_name, referral_code')
        .ilike('referral_code', referralCode.trim())
        .maybeSingle();

      if (lookupError) {
        console.error('Error looking up referral code:', lookupError);
        toast.error('Unable to verify referral code. Please try again.');
        setSubmitting(false);
        return;
      }

      if (!referrer) {
        toast.error('Invalid referral code. Please check and try again.');
        setSubmitting(false);
        return;
      }

      // Make sure they're not referring themselves
      if (referrer.id === userId) {
        toast.error('You cannot use your own referral code.');
        setSubmitting(false);
        return;
      }

      // Update the user's profile with the referrer
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ referred_by: referrer.id })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Create a record in the referrals table to track rewards
      const { error: referralError } = await supabase
        .from('referrals')
        .upsert({
          referrer_id: referrer.id,
          referred_user_id: userId,
          status: 'pending',
          completed_lessons: 0,
          total_hours: 0,
          credits_earned: 0,
          conversion_paid: false
        }, {
          onConflict: 'referrer_id,referred_user_id',
          ignoreDuplicates: true
        });

      if (referralError) {
        console.error('Error creating referral record:', referralError);
        // Don't fail the whole operation, the profile is already updated
      }

      // Update the referrer's total_referrals count in referral_credits
      const { data: referrerCredits } = await supabase
        .from('referral_credits')
        .select('total_referrals')
        .eq('user_id', referrer.id)
        .maybeSingle();

      if (referrerCredits) {
        await supabase
          .from('referral_credits')
          .update({ total_referrals: (referrerCredits.total_referrals || 0) + 1 })
          .eq('user_id', referrer.id);
      } else {
        // Create referral_credits record if it doesn't exist
        await supabase
          .from('referral_credits')
          .insert({ user_id: referrer.id, total_referrals: 1 });
      }

      // Send notification to referrer (user is already verified since they're logged in)
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-referral-signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            referrer_id: referrer.id,
            referred_id: userId,
            referral_code: referrer.referral_code
          })
        });
      } catch (notifyError) {
        console.error('Error sending referral notification:', notifyError);
        // Don't block the connection if notification fails
      }

      toast.success(`Successfully connected! ${referrer.full_name || 'Your referrer'} will earn rewards when you complete lessons.`);
      setHasReferrer(true);
      setShow(false);
      onConnected?.();
    } catch (error) {
      console.error('Error connecting referrer:', error);
      toast.error('Failed to connect referrer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !show || hasReferrer || hasCompletedLesson || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700 rounded-2xl p-5 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
          <Gift className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">
            Were you referred by someone?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Enter their referral code to connect. They'll earn rewards when you complete lessons!
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Enter referral code"
              className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-sm font-mono"
              maxLength={25}
            />
            <button
              type="submit"
              disabled={submitting || !referralCode.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm whitespace-nowrap"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Connect</span>
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            This option is only available before your first lesson.
          </p>
        </div>
      </div>
    </div>
  );
}
