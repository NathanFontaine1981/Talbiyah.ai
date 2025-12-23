import { Star, Quote, CheckCircle } from 'lucide-react';

interface Testimonial {
  id: string;
  student_name: string;
  student_type: 'parent' | 'adult_student' | 'teenage_student';
  testimonial_text: string;
  rating?: number;
  lesson_count?: number;
  subject?: string;
  verified?: boolean;
  created_at?: string;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export default function TestimonialCard({
  testimonial,
  variant = 'default',
  className = ''
}: TestimonialCardProps) {
  const {
    student_name,
    student_type,
    testimonial_text,
    rating,
    lesson_count,
    subject,
    verified
  } = testimonial;

  // Format student type for display
  const getStudentTypeLabel = () => {
    switch (student_type) {
      case 'parent':
        return 'Parent';
      case 'adult_student':
        return 'Adult student';
      case 'teenage_student':
        return 'Teenage student';
      default:
        return 'Student';
    }
  };

  // Compact variant for lists
  if (variant === 'compact') {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <p className="text-gray-700 text-sm italic line-clamp-3">"{testimonial_text}"</p>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>— {student_name}, {getStudentTypeLabel()}</span>
          {lesson_count && <span>{lesson_count} lessons</span>}
        </div>
      </div>
    );
  }

  // Featured variant - larger, more prominent
  if (variant === 'featured') {
    return (
      <div className={`bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 relative ${className}`}>
        {/* Quote icon */}
        <Quote className="absolute top-4 left-4 w-8 h-8 text-emerald-200" />

        {/* Content */}
        <div className="relative z-10 pt-6">
          {/* Rating */}
          {rating && (
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Testimonial text */}
          <p className="text-gray-800 text-lg leading-relaxed mb-4">
            "{testimonial_text}"
          </p>

          {/* Attribution */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar placeholder */}
              <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700 font-semibold">
                {student_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{student_name}</span>
                  {verified && (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <span className="text-sm text-gray-600">
                  {getStudentTypeLabel()}
                  {subject && ` • ${subject}`}
                </span>
              </div>
            </div>

            {/* Lesson count badge */}
            {lesson_count && (
              <div className="px-3 py-1 bg-white/80 rounded-full text-sm text-gray-700">
                {lesson_count} lessons
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors ${className}`}>
      {/* Quote icon */}
      <Quote className="w-6 h-6 text-gray-200 mb-3" />

      {/* Testimonial text */}
      <p className="text-gray-700 leading-relaxed mb-4">
        "{testimonial_text}"
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          {/* Avatar placeholder */}
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm">
            {student_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-gray-900 text-sm">{student_name}</span>
              {verified && (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              )}
            </div>
            <span className="text-xs text-gray-500">
              {getStudentTypeLabel()}
              {lesson_count && ` • ${lesson_count} lessons`}
            </span>
          </div>
        </div>

        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-200'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Testimonials list component
interface TestimonialsListProps {
  testimonials: Testimonial[];
  maxVisible?: number;
  layout?: 'grid' | 'stack' | 'carousel';
  className?: string;
}

export function TestimonialsList({
  testimonials,
  maxVisible = 3,
  layout = 'stack',
  className = ''
}: TestimonialsListProps) {
  if (testimonials.length === 0) {
    return null;
  }

  const visibleTestimonials = testimonials.slice(0, maxVisible);
  const hiddenCount = testimonials.length - maxVisible;

  if (layout === 'grid') {
    return (
      <div className={`space-y-4 ${className}`}>
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <span>💬</span> What Students Say
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleTestimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id || index}
              testimonial={testimonial}
              variant={index === 0 ? 'featured' : 'default'}
            />
          ))}
        </div>
        {hiddenCount > 0 && (
          <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            View {hiddenCount} more testimonials
          </button>
        )}
      </div>
    );
  }

  // Stack layout (default)
  return (
    <div className={`space-y-4 ${className}`}>
      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
        <span>💬</span> What Students Say
      </h4>
      <div className="space-y-3">
        {visibleTestimonials.map((testimonial, index) => (
          <TestimonialCard
            key={testimonial.id || index}
            testimonial={testimonial}
          />
        ))}
      </div>
      {hiddenCount > 0 && (
        <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          View {hiddenCount} more testimonials
        </button>
      )}
    </div>
  );
}

// Empty state when no testimonials
export function NoTestimonials({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center ${className}`}>
      <div className="text-3xl mb-2">💬</div>
      <p className="text-gray-600 font-medium">No testimonials yet</p>
      <p className="text-gray-500 text-sm mt-1">
        This teacher is building their reputation
      </p>
    </div>
  );
}
