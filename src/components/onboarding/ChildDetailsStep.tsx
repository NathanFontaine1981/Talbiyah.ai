import { ChildData } from '../../pages/Onboarding';
import { Plus, X } from 'lucide-react';
import { calculateAge, calculateSchoolYear, validateDOB, getDateConstraints } from '../../utils/ageCalculations';

interface ChildDetailsStepProps {
  children: ChildData[];
  onChange: (children: ChildData[]) => void;
  onBack: () => void;
  onNext: () => void;
}

const LEARNING_GOALS = [
  { id: 'quran_reading', label: 'Quran Reading (Tajweed)', icon: '📖' },
  { id: 'quran_memorization', label: 'Quran Memorization (Hifz)', icon: '🧠' },
  { id: 'quran_understanding', label: 'Quran with Understanding (Tafsir)', icon: '💡' },
  { id: 'arabic_language', label: 'Arabic Language', icon: '🌍' },
  { id: 'islamic_studies', label: 'Islamic Studies', icon: '🕌' },
  { id: 'new_muslim', label: 'New Muslim Guidance', icon: '🌙' }
];

export default function ChildDetailsStep({ children, onChange, onBack, onNext }: ChildDetailsStepProps) {
  const updateChild = (index: number, field: keyof ChildData, value: any) => {
    const updated = [...children];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addChild = () => {
    onChange([...children, {
      firstName: '',
      dateOfBirth: '',
      gender: '',
      learningGoals: []
    }]);
  };

  const dateConstraints = getDateConstraints();

  const removeChild = (index: number) => {
    if (children.length > 1) {
      onChange(children.filter((_, i) => i !== index));
    }
  };

  const toggleGoal = (childIndex: number, goalId: string) => {
    const child = children[childIndex];
    const goals = child.learningGoals.includes(goalId)
      ? child.learningGoals.filter(g => g !== goalId)
      : [...child.learningGoals, goalId];
    updateChild(childIndex, 'learningGoals', goals);
  };

  const isValid = children.every(child =>
    child.firstName.trim().length >= 1 &&
    child.dateOfBirth !== '' &&
    !validateDOB(child.dateOfBirth) &&
    child.gender !== '' &&
    child.learningGoals.length > 0
  );

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your child 👨‍👩‍👧</h1>
          <p className="text-gray-600">This helps us match them with the right teacher.</p>
        </div>

        {children.map((child, index) => (
          <div key={index} className="mb-6 p-5 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-100">
            {children.length > 1 && (
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-gray-800">Child {index + 1}</span>
                <button
                  onClick={() => removeChild(index)}
                  className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1 transition"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              </div>
            )}

            {/* Child's Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Child's First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Yusuf"
                className="w-full p-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition bg-white"
                value={child.firstName}
                onChange={e => updateChild(index, 'firstName', e.target.value)}
              />
            </div>

            {/* Date of Birth */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full p-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition bg-white"
                value={child.dateOfBirth}
                onChange={e => updateChild(index, 'dateOfBirth', e.target.value)}
                max={dateConstraints.max}
                min={dateConstraints.min}
              />

              {/* Show calculated age and school year */}
              {child.dateOfBirth && !validateDOB(child.dateOfBirth) && (
                <div className="mt-2 p-3 bg-cyan-50 rounded-xl text-sm border border-cyan-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-semibold text-cyan-700">{calculateAge(child.dateOfBirth)} years old</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-600">School Year:</span>
                    <span className="font-semibold text-cyan-700">{calculateSchoolYear(child.dateOfBirth)}</span>
                  </div>
                </div>
              )}

              {/* Show validation error */}
              {child.dateOfBirth && validateDOB(child.dateOfBirth) && (
                <p className="text-sm text-red-500 mt-2">{validateDOB(child.dateOfBirth)}</p>
              )}
            </div>

            {/* Gender */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  className={`flex-1 p-3.5 border-2 rounded-xl font-medium transition-all ${
                    child.gender === 'male'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                  onClick={() => updateChild(index, 'gender', 'male')}
                >
                  👦 Male
                </button>
                <button
                  type="button"
                  className={`flex-1 p-3.5 border-2 rounded-xl font-medium transition-all ${
                    child.gender === 'female'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                  onClick={() => updateChild(index, 'gender', 'female')}
                >
                  👧 Female
                </button>
              </div>
            </div>

            {/* Learning Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What would you like them to learn? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {LEARNING_GOALS.map(goal => (
                  <label
                    key={goal.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      child.learningGoals.includes(goal.id)
                        ? 'bg-cyan-100 border-2 border-cyan-400'
                        : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={child.learningGoals.includes(goal.id)}
                      onChange={() => toggleGoal(index, goal.id)}
                      className="w-5 h-5 text-cyan-500 rounded border-gray-300 focus:ring-cyan-500"
                    />
                    <span className="text-lg">{goal.icon}</span>
                    <span className={`font-medium ${
                      child.learningGoals.includes(goal.id) ? 'text-cyan-700' : 'text-gray-700'
                    }`}>
                      {goal.label}
                    </span>
                  </label>
                ))}
              </div>
              {child.learningGoals.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">Please select at least one learning goal</p>
              )}
            </div>
          </div>
        ))}

        {/* Add Another Child */}
        <button
          type="button"
          onClick={addChild}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all mb-6 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Another Child
        </button>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 p-4 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            ← Back
          </button>
          <button
            onClick={onNext}
            disabled={!isValid}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white p-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
