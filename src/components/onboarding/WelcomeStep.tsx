import { CheckCircle, Search, BookOpen, Clock } from 'lucide-react';

interface WelcomeStepProps {
  parentName: string;
  childName: string;
  onComplete: () => void;
  saving: boolean;
}

export default function WelcomeStep({ parentName, childName, onComplete, saving }: WelcomeStepProps) {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
        {/* Celebration */}
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {parentName}!
        </h1>
        <p className="text-gray-600 mb-8">
          You're all set! <span className="font-semibold text-cyan-600">{childName}</span> is about to start an amazing learning journey.
        </p>

        {/* What's Next Card */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-5 mb-8 text-left border border-cyan-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-cyan-500">✨</span>
            What's next?
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Search className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <span className="font-medium text-gray-800">Browse our qualified teachers</span>
                <p className="text-sm text-gray-600">All teachers are vetted and experienced</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <span className="font-medium text-gray-800">Book a trial lesson</span>
                <p className="text-sm text-gray-600">Start with a session to find the right fit</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <span className="font-medium text-gray-800">Learn at your own pace</span>
                <p className="text-sm text-gray-600">Flexible scheduling that works for you</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-2xl mb-1">🎓</div>
            <div className="text-xs font-medium text-gray-600">Qualified Teachers</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-2xl mb-1">📱</div>
            <div className="text-xs font-medium text-gray-600">Live Video Lessons</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-xs font-medium text-gray-600">Track Progress</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <button
          onClick={onComplete}
          disabled={saving}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white p-4 rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              Find a Teacher
              <Search className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-sm text-gray-500 mt-4">
          You can also explore from your dashboard anytime
        </p>
      </div>

      {/* Trust badges */}
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Secure Platform</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Vetted Teachers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
