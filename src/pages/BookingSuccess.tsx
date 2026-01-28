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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <main id="main-content" className="max-w-2xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-500 rounded-full mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-500" />
            Booking Confirmed!
            <Sparkles className="w-8 h-8 text-amber-500" />
          </h1>
          <p className="text-xl text-gray-600">
            Your {lessons_created === 1 ? 'lesson has' : `${lessons_created} lessons have`} been successfully booked
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-emerald-50 border-b border-emerald-100 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Lesson Details</h2>
            <p className="text-gray-500">
              {lessons_created} {lessons_created === 1 ? 'lesson' : 'lessons'} scheduled
            </p>
          </div>

          {/* Lessons List */}
          <div className="p-6 space-y-4">
            {bookings && bookings.length > 0 ? (
              bookings.map((booking: BookingDetails, idx: number) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {booking.subject}
                      </h3>
                      <p className="text-gray-500">with {booking.teacher_name}</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-sm font-semibold rounded-full border border-emerald-200">
                      {booking.duration} min
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <span>{format(new Date(booking.date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      <span>{booking.time}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  {lessons_created} {lessons_created === 1 ? 'lesson' : 'lessons'} booked successfully
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        {payment_method === 'credits' && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Payment Summary</h3>
                <p className="text-gray-500 text-sm">Paid with Credits</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-gray-600">
                <span>Credits Used:</span>
                <span className="font-semibold text-amber-600">-{credits_used}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600 pt-2 border-t border-emerald-200">
                <span>New Balance:</span>
                <span className="font-bold text-emerald-600 text-xl">{new_balance} credits</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate('/teachers')}
            className="flex-1 px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-full font-semibold transition border border-gray-200 flex items-center justify-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            <span>Book Another Lesson</span>
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-gray-500 text-sm text-center">
            Your {lessons_created === 1 ? 'lesson is' : 'lessons are'} now visible in your dashboard.
            You'll receive a reminder before each session starts.
          </p>
        </div>
      </main>
    </div>
  );
}
