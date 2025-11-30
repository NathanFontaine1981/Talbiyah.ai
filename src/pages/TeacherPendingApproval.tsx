import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Mail, BookOpen, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface TierInfo {
  tier_name: string;
  hourly_rate: number;
}

const TIER_INFO = [
  { name: 'Master', rate: 8, emoji: '💎', description: 'Multiple Ijazahs + Islamic Degree + Native English' },
  { name: 'Expert', rate: 7, emoji: '🏆', description: 'Ijazah OR Degree + Fluent/Native English' },
  { name: 'Skilled', rate: 6, emoji: '🎯', description: '5+ years experience OR Teaching Certificate' },
  { name: 'Apprentice', rate: 5, emoji: '📚', description: '2-5 years teaching experience' },
  { name: 'Newcomer', rate: 4, emoji: '🌱', description: '0-2 years (default starting tier)' },
];

export default function TeacherPendingApproval() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [showTierDetails, setShowTierDetails] = useState(false);

  useEffect(() => {
    checkApprovalStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkApprovalStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/');
        return;
      }

      setUserEmail(user.email || '');

      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('status, tier, hourly_rate')
        .eq('user_id', user.id)
        .maybeSingle();

      if (teacherProfile) {
        if (teacherProfile.status === 'approved') {
          navigate('/dashboard');
        } else if (teacherProfile.status === 'rejected') {
          navigate('/teacher/rejected');
        }

        // Set tier info if available
        if (teacherProfile.tier && teacherProfile.hourly_rate) {
          // Capitalize the tier name for display
          const tierName = teacherProfile.tier.charAt(0).toUpperCase() + teacherProfile.tier.slice(1);
          setTierInfo({
            tier_name: tierName,
            hourly_rate: teacherProfile.hourly_rate
          });
        }
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-3xl p-12 border border-slate-700/50 backdrop-blur-sm shadow-2xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-8 relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                <Clock className="w-12 h-12 text-white animate-pulse" />
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Application Under Review
            </h1>

            <p className="text-xl text-slate-300 mb-8">
              Thank you for applying to teach with us!
            </p>

            <div className="space-y-6 mb-10">
              <div className="flex items-start space-x-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <p className="font-semibold text-white mb-1">Application Received</p>
                  <p className="text-sm text-slate-400">Your application has been submitted successfully and is being reviewed by our team.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                <Clock className="w-6 h-6 text-slate-400 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <p className="font-semibold text-white mb-1">Review Time</p>
                  <p className="text-sm text-slate-400">Applications are typically reviewed within 24-48 hours. We appreciate your patience!</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                <Mail className="w-6 h-6 text-slate-400 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <p className="font-semibold text-white mb-1">Email Notification</p>
                  <p className="text-sm text-slate-400">
                    You'll receive an email at <span className="text-blue-400 font-medium">{userEmail}</span> once your account is approved.
                  </p>
                </div>
              </div>
            </div>

            {/* Your Starting Tier Section */}
            {tierInfo && (
              <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-2 border-emerald-500/30 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <Award className="w-8 h-8 text-emerald-400" />
                  <h3 className="text-xl font-bold text-white">Your Starting Tier</h3>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-5 border border-emerald-500/20 mb-4">
                  <p className="text-sm text-slate-400 mb-2 text-center">Based on your qualifications:</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-emerald-400">
                        {TIER_INFO.find(t => t.name === tierInfo.tier_name)?.emoji} {tierInfo.tier_name} Tier
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Auto-approved after document verification
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-white">£{tierInfo.hourly_rate.toFixed(2)}</p>
                      <p className="text-sm text-slate-400">per hour</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-emerald-300 text-center mb-4">
                  💡 Your tier can increase as you teach more hours and receive higher ratings on our platform!
                </p>

                {/* Expandable Tier Details */}
                <button
                  onClick={() => setShowTierDetails(!showTierDetails)}
                  className="w-full flex items-center justify-center space-x-2 text-sm text-slate-400 hover:text-white transition py-2"
                >
                  <span>How tiers work</span>
                  {showTierDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showTierDetails && (
                  <div className="mt-4 bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                    <h4 className="font-semibold text-slate-300 mb-3 text-sm">All Teacher Tiers</h4>
                    <div className="space-y-2">
                      {TIER_INFO.map((tier) => (
                        <div
                          key={tier.name}
                          className={`flex items-center justify-between text-xs p-2 rounded ${
                            tier.name === tierInfo.tier_name
                              ? 'bg-emerald-500/20 border border-emerald-500/30'
                              : ''
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span>{tier.emoji}</span>
                            <span className={tier.name === tierInfo.tier_name ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                              {tier.name}
                            </span>
                          </div>
                          <span className={tier.name === tierInfo.tier_name ? 'text-emerald-300 font-semibold' : 'text-slate-500'}>
                            £{tier.rate.toFixed(2)}/hr
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                      After approval, your tier increases automatically as you teach and receive good ratings!
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6 mb-8">
              <BookOpen className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <p className="text-sm text-slate-300 mb-3">
                Once approved, you'll be able to set your availability, create your profile, and start teaching students around the world.
              </p>
              <p className="text-xs text-slate-400">
                You can safely close this page now. You'll receive an email notification when your application is approved.
              </p>
            </div>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate('/');
              }}
              className="px-8 py-3 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg font-semibold transition shadow-lg"
            >
              Return to Home
            </button>

            <div className="mt-8 pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-500">
                Questions? Contact us at <a href="mailto:contact@talbiyah.ai" className="text-blue-400 hover:text-blue-300">contact@talbiyah.ai</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
