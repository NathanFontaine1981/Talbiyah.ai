/**
 * DuaProgressStepper Component
 * Shows the 6-step progress indicator for building a dua
 */

import { Check } from 'lucide-react';
import { BLOCK_TYPE_INFO, BLOCK_TYPE_ORDER, type DuaBlockType, type ComposedDua } from '../../data/duaBlocks';

interface DuaProgressStepperProps {
  currentStep: DuaBlockType;
  composition: ComposedDua;
  onStepClick: (step: DuaBlockType) => void;
}

export default function DuaProgressStepper({
  currentStep,
  composition,
  onStepClick
}: DuaProgressStepperProps) {
  const isStepComplete = (step: DuaBlockType): boolean => {
    switch (step) {
      case 'hamd':
        return !!composition.hamdBlock || !!composition.customHamd?.text;
      case 'salawat':
        return !!composition.salawatBlock || !!composition.customSalawat?.text;
      case 'admission':
        return !!composition.admissionBlock || !!composition.customAdmission?.text;
      case 'request':
        return composition.requestBlocks.length > 0 || !!composition.customRequest?.text || !!composition.customText;
      case 'others':
        return !!composition.othersBlock || !!composition.customOthers?.text;
      case 'closing':
        return !!composition.closingBlock || !!composition.customClosing?.text;
      default:
        return false;
    }
  };

  const currentStepIndex = BLOCK_TYPE_ORDER.indexOf(currentStep);

  return (
    <div className="w-full">
      {/* Mobile view - simplified */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-emerald-700">
            Step {currentStepIndex + 1} of 6
          </span>
          <span className="text-sm text-gray-500">
            {BLOCK_TYPE_INFO[currentStep].name}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / 6) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {BLOCK_TYPE_ORDER.map((step, index) => (
            <button
              key={step}
              onClick={() => onStepClick(step)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                isStepComplete(step)
                  ? 'bg-emerald-600 text-white'
                  : step === currentStep
                  ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-600'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {isStepComplete(step) ? (
                <Check size={14} />
              ) : (
                index + 1
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop view - full stepper */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          {BLOCK_TYPE_ORDER.map((step, index) => {
            const info = BLOCK_TYPE_INFO[step];
            const isComplete = isStepComplete(step);
            const isCurrent = step === currentStep;
            const isPast = index < currentStepIndex;

            return (
              <div key={step} className="flex items-center flex-1">
                {/* Step circle and label */}
                <button
                  onClick={() => onStepClick(step)}
                  className="flex flex-col items-center group"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      isComplete
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-600 ring-offset-2'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                    }`}
                  >
                    {isComplete ? <Check size={18} /> : index + 1}
                  </div>
                  <div className="mt-2 text-center">
                    <p
                      className={`text-xs font-medium ${
                        isCurrent
                          ? 'text-emerald-700'
                          : isComplete
                          ? 'text-emerald-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {info.name.split(' ')[0]}
                    </p>
                    <p className="text-xs text-gray-400 font-arabic">
                      {info.nameArabic}
                    </p>
                  </div>
                </button>

                {/* Connector line */}
                {index < BLOCK_TYPE_ORDER.length - 1 && (
                  <div className="flex-1 mx-2">
                    <div
                      className={`h-0.5 transition-all ${
                        isPast || isComplete
                          ? 'bg-emerald-600'
                          : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
