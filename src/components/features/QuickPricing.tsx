import { Coins, Video, Sparkles } from 'lucide-react';

export function QuickPricing() {
  return (
    <div className="space-y-6">
      {/* Live Lessons Pricing */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Live 1-on-1 Lessons</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Price set by your teacher</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Each teacher sets their own hourly rate. You'll see the exact price on their profile before booking.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Platform Teachers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/50">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase mb-2">Platform Teachers</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">From £15<span className="text-sm font-normal text-gray-500">/hour</span></p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">£7.50 / 30 min</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Buy credit packs for savings (from £12/hr)</p>
          </div>
          {/* Independent Teachers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/50">
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase mb-2">Independent Teachers</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">From £16<span className="text-sm font-normal text-gray-500">/hour</span></p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">£8.00 / 30 min</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rate set by teacher — book & pay on platform</p>
          </div>
        </div>

        {/* Insights Addon */}
        <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-700">
          <div className="flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                AI Insights addon — £2.50/lesson
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Study notes, quizzes & revision materials generated from your lesson. First lesson with insights is <strong className="text-emerald-600 dark:text-emerald-400">free</strong> — added on top of the teacher's rate after that.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-4 font-medium">
          No subscription — book and pay per lesson. Credits never expire.
        </p>
      </div>

      {/* AI Tokens */}
      <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">AI Tokens</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">For standalone AI features (outside lessons)</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">100 tokens</span>
            <span className="font-semibold text-gray-900 dark:text-white">£5</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">250 tokens</span>
            <span className="font-semibold text-gray-900 dark:text-white">£10</span>
          </div>
          <div className="flex justify-between text-sm bg-violet-100 dark:bg-violet-800/30 rounded-lg px-2 py-1">
            <span className="text-violet-700 dark:text-violet-300">500 tokens</span>
            <div className="text-right">
              <span className="line-through text-gray-400 mr-1 text-xs">£25</span>
              <span className="font-semibold text-violet-700 dark:text-violet-300">£18</span>
              <span className="text-xs bg-violet-500 text-white px-1.5 py-0.5 rounded ml-1">SAVE 28%</span>
            </div>
          </div>
        </div>
        {/* Value breakdown */}
        <div className="mt-4 pt-4 border-t border-violet-200 dark:border-violet-700">
          <p className="text-xs text-violet-600 dark:text-violet-400">
            <strong>What tokens get you:</strong>
            <br />• 1 dua audio = 10 tokens (£0.50)
            <br />• 1 khutbah = 20 tokens (£1.00)
            <br />• 500 tokens = 50 duas or 25 khutbahs
          </p>
          <p className="text-xs text-violet-600 dark:text-violet-400 mt-2 font-medium">
            One-time purchase — tokens never expire.
          </p>
        </div>
      </div>
    </div>
  );
}
