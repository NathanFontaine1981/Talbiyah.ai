/**
 * DuaPersonalInput Component
 * Guided personal text addition for duas
 */

import { useState } from 'react';
import { Heart, Info, AlertCircle } from 'lucide-react';

interface DuaPersonalInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export default function DuaPersonalInput({
  value,
  onChange,
  maxLength = 500
}: DuaPersonalInputProps) {
  const [showGuidance, setShowGuidance] = useState(false);

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.8;

  return (
    <div className="mt-6 p-4 bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Heart size={18} className="text-rose-500" />
          Add Your Personal Words (Optional)
        </h4>
        <button
          onClick={() => setShowGuidance(!showGuidance)}
          className="text-rose-600 hover:text-rose-700 text-sm flex items-center gap-1"
        >
          <Info size={14} />
          {showGuidance ? 'Hide tips' : 'View tips'}
        </button>
      </div>

      {showGuidance && (
        <div className="mb-4 p-3 bg-white rounded-lg text-sm space-y-2">
          <p className="text-gray-700">
            <strong>What to include:</strong> Your sincere, personal supplication to Allah.
            Speak from your heart in your own words.
          </p>
          <p className="text-gray-700">
            <strong>Examples:</strong>
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
            <li>Specific situations you're facing</li>
            <li>People you want to pray for by name</li>
            <li>Goals and aspirations you have</li>
            <li>Gratitude for specific blessings</li>
          </ul>
          <p className="text-gray-700">
            <strong>Remember:</strong> Allah knows what's in your heart. Speak sincerely
            and with hope in His mercy.
          </p>
          <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 rounded border border-amber-200">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 text-xs">
              Keep your dua appropriate and focused on what is halal and good.
              Avoid asking for anything harmful or prohibited.
            </p>
          </div>
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder="Type your personal dua here... (e.g., 'O Allah, grant me strength to...')"
        className="w-full p-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none text-gray-700"
        rows={4}
      />

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500">
          This will appear after your request blocks in the final dua.
        </p>
        <span className={`text-xs ${isNearLimit ? 'text-amber-600' : 'text-gray-400'}`}>
          {characterCount}/{maxLength}
        </span>
      </div>
    </div>
  );
}
