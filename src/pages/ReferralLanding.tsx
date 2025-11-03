import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gift,
  Users,
  Copy,
  CheckCircle,
  TrendingUp,
  Clock,
  Award,
  Share2,
  BookOpen,
  ArrowRight,
  Zap,
  Target
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface ReferralData {
  referralCode: string;
  learningCredits: number;
  totalReferrals: number;
  totalHoursReferred: number;
}

export default function ReferralLanding() {
  const navigate = useNavigate();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, []);

  async function loadReferralData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: learner } = await supabase
        .from('learners')
        .select('id, referral_code, learning_credits')
        .eq('parent_id', user.id)
        .maybeSingle();

      if (!learner) {
        setLoading(false);
        return;
      }

      const { data: referrals } = await supabase
        .from('referrals')
        .select('hours_completed')
        .eq('referrer_id', learner.id);

      const totalHours = (referrals || []).reduce((sum, ref) => sum + parseFloat(ref.hours_completed), 0);

      setReferralData({
        referralCode: learner.referral_code,
        learningCredits: parseFloat(learner.learning_credits),
        totalReferrals: referrals?.length || 0,
        totalHoursReferred: totalHours
      });
    } catch (err) {
      console.error('Error loading referral data:', err);
    } finally {
      setLoading(false);
    }
  }

  function copyReferralLink() {
    if (!referralData) return;

    const referralLink = `${window.location.origin}/signup?ref=${referralData.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareViaWhatsApp() {
    if (!referralData) return;
    const referralLink = `${window.location.origin}/signup?ref=${referralData.referralCode}`;
    const message = `Join me on Talbiyah.ai for Islamic learning! Use my code ${referralData.referralCode} when you sign up: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }

  function shareViaEmail() {
    if (!referralData) return;
    const referralLink = `${window.location.origin}/signup?ref=${referralData.referralCode}`;
    const subject = 'Join me on Talbiyah.ai';
    const body = `I've been learning Quran and Arabic on Talbiyah.ai and thought you might be interested!\n\nUse my referral code ${referralData.referralCode} when you sign up: ${referralLink}\n\nLooking forward to learning together!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold text-slate-900 group-hover:text-cyan-500 transition">Talbiyah.ai</h1>
              <p className="text-xs text-slate-500">Islamic Learning</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-full mb-6">
            <Gift className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-600 font-semibold">Referral Rewards Program</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Earn Free Lessons by Sharing
          </h1>

          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-6">
            Introduce your friends and family to Talbiyah.ai and earn free learning hours. For every 10 hours they complete, you receive 1 free hour of lessons!
          </p>

          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-l-4 border-amber-500">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Sadaqah Jariyah - Ongoing Reward</h3>
                  <p className="text-slate-700 leading-relaxed">
                    By referring others to Islamic learning, you gain the rewards of every hour they learn.
                    This blessing continues even after you pass away, continuously filling your book of deeds
                    with ongoing rewards for facilitating Islamic education. May Allah accept this as a means
                    of maximizing your eternal rewards.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!loading && referralData && (
            <div className="inline-flex items-center space-x-6 bg-white rounded-2xl px-8 py-4 shadow-lg border border-slate-200">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-1">Free Credits Earned</p>
                <p className="text-3xl font-bold text-emerald-600">{referralData.learningCredits.toFixed(1)} hrs</p>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-1">Total Referrals</p>
                <p className="text-3xl font-bold text-cyan-600">{referralData.totalReferrals}</p>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-1">Hours Referred</p>
                <p className="text-3xl font-bold text-blue-600">{referralData.totalHoursReferred.toFixed(1)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Share Your Code</h3>
            <p className="text-slate-600">
              Share your unique referral code with friends, family, and your community through social media, email, or messaging apps.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">They Learn</h3>
            <p className="text-slate-600">
              When someone signs up using your code and completes their lessons, their learning hours count toward your rewards.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-4">
              <Award className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">You Earn Free Hours</h3>
            <p className="text-slate-600">
              For every 10 hours your referrals complete, you automatically receive 1 free hour to use for any course or teacher.
            </p>
          </div>
        </div>

        {!loading && referralData && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 mb-12 border border-slate-700 shadow-xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Your Referral Code</h2>
              <p className="text-slate-300">Share this code with anyone interested in Islamic learning</p>
            </div>

            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-1 px-6 py-4 bg-slate-800 border border-slate-700 rounded-xl font-mono text-3xl font-bold text-cyan-400 text-center">
                  {referralData.referralCode}
                </div>
                <button
                  onClick={copyReferralLink}
                  className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white rounded-xl transition flex items-center space-x-2 font-semibold shadow-lg"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center mb-6">
                <p className="text-slate-400 text-sm">
                  Your referral link: <span className="text-cyan-400">{window.location.origin}/signup?ref={referralData.referralCode}</span>
                </p>
              </div>

              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={shareViaWhatsApp}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition flex items-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={shareViaEmail}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition flex items-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Email</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm mb-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Unlimited Earning Potential</h2>
            <p className="text-slate-600 text-lg">The more you share, the more you earn</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl p-6 border border-emerald-200">
              <div className="flex items-center space-x-3 mb-4">
                <Target className="w-6 h-6 text-emerald-600" />
                <h3 className="text-xl font-bold text-slate-900">Refer 5 Friends</h3>
              </div>
              <p className="text-slate-700 mb-3">If each completes 10 hours of learning:</p>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <p className="text-2xl font-bold text-emerald-600">5 Free Hours</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-slate-900">Refer 20 Friends</h3>
              </div>
              <p className="text-slate-700 mb-3">If each completes 10 hours of learning:</p>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <p className="text-2xl font-bold text-blue-600">20 Free Hours</p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-600 text-lg">
              As your referrals continue learning, your free hours keep accumulating. There's no limit to how many free hours you can earn!
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 border border-slate-700 shadow-xl">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>

          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-2">How do I share my referral code?</h3>
              <p className="text-slate-300">
                Simply copy your unique referral link and share it through social media, email, WhatsApp, or any messaging platform. Your friends just need to sign up using your link.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-2">When do I receive my free hours?</h3>
              <p className="text-slate-300">
                Your free hours are credited automatically when your referrals complete 10 hours of lessons. You can track their progress in your dashboard.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-2">Is there a limit to how many people I can refer?</h3>
              <p className="text-slate-300">
                No! You can refer as many people as you like. The more people you refer and the more they learn, the more free hours you'll earn.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-2">Can I use my free hours for any course or teacher?</h3>
              <p className="text-slate-300">
                Yes! Your earned free hours can be used to book any course or teacher on Talbiyah.ai. They work just like regular lesson credits.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-2">Do my free hours expire?</h3>
              <p className="text-slate-300">
                No, your earned free hours never expire. You can use them whenever you're ready to book your next lesson.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold text-lg transition shadow-lg"
          >
            <span>Start Sharing Now</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-slate-600">
          <p>Terms & Conditions: Referral credits are awarded when referred users complete paid lessons. Credits cannot be transferred or exchanged for cash.</p>
        </div>
      </footer>
    </div>
  );
}
