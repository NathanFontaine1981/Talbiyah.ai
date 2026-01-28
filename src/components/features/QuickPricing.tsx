import { Coins, Video } from 'lucide-react';

export function QuickPricing() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Tokens */}
      <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Tokens</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">For AI features</p>
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
        </div>
      </div>

      {/* Credits */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Credits</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">For live lessons</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">4 credits</span>
            <span className="font-semibold text-gray-900 dark:text-white">£56 <span className="text-xs text-gray-500">(£14/lesson)</span></span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">8 credits</span>
            <span className="font-semibold text-gray-900 dark:text-white">£104 <span className="text-xs text-gray-500">(£13/lesson)</span></span>
          </div>
          <div className="flex justify-between text-sm bg-emerald-100 dark:bg-emerald-800/30 rounded-lg px-2 py-1">
            <span className="text-emerald-700 dark:text-emerald-300">16 credits</span>
            <div className="text-right">
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">£192</span>
              <span className="text-xs text-emerald-600 ml-1">(£12/lesson + bonus)</span>
            </div>
          </div>
        </div>
        {/* Value breakdown */}
        <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-700">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            <strong>What you get per credit:</strong>
            <br />• 1 hour live lesson with qualified teacher
            <br />• AI-generated study notes
            <br />• Lesson recording for review
          </p>
        </div>
      </div>
    </div>
  );
}
