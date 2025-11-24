import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, BookOpen, CreditCard, ArrowRight, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface BookingDetails {
  teacher_name: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
}

export default function BookingSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookingData, setBookingData] = useState<any>(null);

  useEffect(() => {
    // Get booking data from navigation state
    const state = location.state as any;
    
    if (!state || !state.payment_method) {
      // No booking data, redirect to dashboard
      navigate('/dashboard');
      return;
    }

    setBookingData(state);
  }, [location, navigate]);

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  const { 
    payment_method, 
    lessons_created, 
    credits_used, 
    new_balance,
    bookings = []
  } = bookingData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            Booking Confirmed!
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </h1>
          <p className="text-xl text-slate-300">
            Your {lessons_created === 1 ? 'lesson has' : `${lessons_created} lessons have`} been successfully booked
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-slate-800 p-6">
            <h2 className="text-2xl font-bold text-white mb-2">Lesson Details</h2>
            <p className="text-slate-400">
              {lessons_created} {lessons_created === 1 ? 'lesson' : 'lessons'} scheduled
            </p>
          </div>

          {/* Lessons List */}
          <div className="p-6 space-y-4">
            {bookings && bookings.length > 0 ? (
              bookings.map((booking: BookingDetails, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {booking.subject}
                      </h3>
                      <p className="text-slate-400">with {booking.teacher_name}</p>
                    </div>
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm font-semibold rounded-full">
                      {booking.duration} min
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span>{format(new Date(booking.date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>{booking.time}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 text-center">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">
                  {lessons_created} {lessons_created === 1 ? 'lesson' : 'lessons'} booked successfully
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        {payment_method === 'credits' && (
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Payment Summary</h3>
                <p className="text-slate-400 text-sm">Paid with Credits</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span>Credits Used:</span>
                <span className="font-semibold text-amber-400">-{credits_used}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300 pt-2 border-t border-cyan-500/20">
                <span>New Balance:</span>
                <span className="font-bold text-emerald-400 text-xl">{new_balance} credits</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-bold transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate('/teachers')}
            className="flex-1 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-semibold transition border border-slate-700 flex items-center justify-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            <span>Book Another Lesson</span>
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm text-center">
            Your {lessons_created === 1 ? 'lesson is' : 'lessons are'} now visible in your dashboard. 
            You'll receive a reminder before each session starts.
          </p>
        </div>
      </div>
    </div>
  );
}
