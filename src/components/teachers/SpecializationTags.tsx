import { getSpecialization, TEACHER_SPECIALIZATIONS, type TeacherSpecialization } from '../../constants/teacherConstants';

interface SpecializationTagsProps {
  specializations: string[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcons?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export default function SpecializationTags({
  specializations,
  maxVisible = 3,
  size = 'md',
  showIcons = true,
  variant = 'default',
  className = ''
}: SpecializationTagsProps) {
  // Filter to only valid specializations
  const validSpecs = specializations
    .map(id => getSpecialization(id))
    .filter((spec): spec is TeacherSpecialization => spec !== undefined);

  if (validSpecs.length === 0) return null;

  const visibleSpecs = validSpecs.slice(0, maxVisible);
  const hiddenCount = validSpecs.length - maxVisible;

  const sizeClasses = {
    sm: {
      tag: 'px-2 py-0.5 text-xs',
      icon: 'text-xs',
      gap: 'gap-1'
    },
    md: {
      tag: 'px-2.5 py-1 text-sm',
      icon: 'text-sm',
      gap: 'gap-1.5'
    },
    lg: {
      tag: 'px-3 py-1.5 text-base',
      icon: 'text-base',
      gap: 'gap-2'
    }
  };

  const s = sizeClasses[size];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      amber: 'bg-amber-100 text-amber-700 border-amber-200'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Compact variant - just small pills
  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap ${s.gap} ${className}`}>
        {visibleSpecs.map((spec) => (
          <span
            key={spec.id}
            className={`${s.tag} ${getColorClasses(spec.color)} rounded-full font-medium border`}
          >
            {showIcons && <span className={s.icon}>{spec.icon}</span>}{' '}
            {spec.name}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className={`${s.tag} bg-gray-100 text-gray-600 rounded-full font-medium border border-gray-200`}>
            +{hiddenCount} more
          </span>
        )}
      </div>
    );
  }

  // Detailed variant - full descriptions
  if (variant === 'detailed') {
    return (
      <div className={`space-y-3 ${className}`}>
        <h4 className="text-sm font-semibold text-gray-700">Teaching Specializations</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {validSpecs.map((spec) => (
            <div
              key={spec.id}
              className={`${getColorClasses(spec.color)} rounded-lg p-3 border`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{spec.icon}</span>
                <span className="font-semibold">{spec.name}</span>
              </div>
              <p className="text-xs opacity-80">{spec.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex flex-wrap ${s.gap} ${className}`}>
      {visibleSpecs.map((spec) => (
        <span
          key={spec.id}
          className={`inline-flex items-center ${s.gap} ${s.tag} ${getColorClasses(spec.color)} rounded-full font-medium border`}
          title={spec.description}
        >
          {showIcons && <span>{spec.icon}</span>}
          <span>{spec.name}</span>
        </span>
      ))}
      {hiddenCount > 0 && (
        <span
          className={`${s.tag} bg-gray-100 text-gray-600 rounded-full font-medium border border-gray-200 cursor-help`}
          title={validSpecs.slice(maxVisible).map(s => s.name).join(', ')}
        >
          +{hiddenCount} more
        </span>
      )}
    </div>
  );
}

// Component to display all available specializations for selection
interface SpecializationSelectorProps {
  selected: string[];
  onChange: (specializations: string[]) => void;
  maxSelectable?: number;
  className?: string;
}

export function SpecializationSelector({
  selected,
  onChange,
  maxSelectable = 5,
  className = ''
}: SpecializationSelectorProps) {
  const toggleSpecialization = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else if (selected.length < maxSelectable) {
      onChange([...selected, id]);
    }
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100';
    }

    const colorMap: Record<string, string> = {
      emerald: 'bg-emerald-100 text-emerald-700 border-emerald-400 ring-2 ring-emerald-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-400 ring-2 ring-blue-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-400 ring-2 ring-purple-200',
      green: 'bg-green-100 text-green-700 border-green-400 ring-2 ring-green-200',
      amber: 'bg-amber-100 text-amber-700 border-amber-400 ring-2 ring-amber-200'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-700 border-gray-400 ring-2 ring-gray-200';
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-semibold text-gray-700">Select your specializations</h4>
        <span className="text-xs text-gray-500">{selected.length}/{maxSelectable} selected</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {TEACHER_SPECIALIZATIONS.map((spec) => {
          const isSelected = selected.includes(spec.id);
          const isDisabled = !isSelected && selected.length >= maxSelectable;

          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => toggleSpecialization(spec.id)}
              disabled={isDisabled}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                getColorClasses(spec.color, isSelected)
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span>{spec.icon}</span>
              <span>{spec.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
