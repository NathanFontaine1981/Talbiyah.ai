import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Mail, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function TeacherPendingApproval() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    checkApprovalStatus();
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
        .select('status')
        .eq('parent_id', user.id)
        .maybeSingle();

      if (teacherProfile) {
        if (teacherProfile.status === 'approved') {
          navigate('/dashboard');
        } else if (teacherProfile.status === 'rejected') {
          navigate('/teacher/rejected');
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

            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6 mb-8">
              <BookOpen className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <p className="text-sm text-slate-300">
                Once approved, you'll be able to set your availability, create your profile, and start teaching students around the world.
              </p>
            </div>

            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg font-semibold transition shadow-lg"
            >
              Return to Home
            </button>

            <div className="mt-8 pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-500">
                Questions? Contact us at <a href="mailto:support@talbiyah.com" className="text-blue-400 hover:text-blue-300">support@talbiyah.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
