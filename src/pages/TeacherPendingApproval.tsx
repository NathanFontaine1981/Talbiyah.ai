import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Mail, BookOpen, Award } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface TierInfo {
  tier_name: string;
  hourly_rate: number;
}

export default function TeacherPendingApproval() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl p-12 border border-gray-200 shadow-lg">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-8 relative">
              <div className="absolute inset-0 bg-blue-100 blur-2xl rounded-full animate-pulse"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                <Clock className="w-12 h-12 text-white animate-pulse" />
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4 text-gray-900">
              Application Under Review
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Thank you for applying to teach with us!
            </p>

            <div className="space-y-4 mb-10 text-left">
              <div className="flex items-start space-x-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Application Received</p>
                  <p className="text-sm text-gray-600">Your application has been submitted successfully and is being reviewed by our team.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Review Time</p>
                  <p className="text-sm text-gray-600">Applications are typically reviewed within 24-48 hours. We appreciate your patience!</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <Mail className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Email Notification</p>
                  <p className="text-sm text-gray-600">
                    You'll receive an email at <span className="text-blue-600 font-medium">{userEmail}</span> once your account is approved.
                  </p>
                </div>
              </div>
            </div>

            {/* Your Payout Rate */}
            {tierInfo && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 mb-8 text-left">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <Award className="w-8 h-8 text-emerald-600" />
                  <h3 className="text-xl font-bold text-gray-900">Your Payout Rate</h3>
                </div>

                <div className="bg-white rounded-lg p-5 border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">You'll be paid</p>
                      <p className="text-sm text-gray-500 mt-1">
                        for every hour you teach on Talbiyah
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">£{tierInfo.hourly_rate.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">per hour</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <p className="text-sm text-gray-700 mb-3">
                Once approved, you'll be able to set your availability, create your profile, and start teaching students around the world.
              </p>
              <p className="text-xs text-gray-500">
                You can safely close this page now. You'll receive an email notification when your application is approved.
              </p>
            </div>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate('/');
              }}
              className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition shadow-md"
            >
              Return to Home
            </button>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Questions? Contact us at <a href="mailto:support@talbiyah.ai" className="text-blue-600 hover:text-blue-500">support@talbiyah.ai</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
