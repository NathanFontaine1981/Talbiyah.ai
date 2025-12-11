// Input validation schemas using native TypeScript
// For Deno Edge Functions - lightweight validation without external dependencies

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

// Booking request validation
export interface BookingRequestInput {
  teacher_id: string;
  date: string;
  time: string;
  subject: string;
  duration?: number;
  price: number;
  use_free_session?: boolean;
  learner_id?: string;
  subject_id?: string;
}

export function validateBookingRequest(input: unknown): ValidationResult<BookingRequestInput> {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { success: false, errors: ['Invalid request body'] };
  }

  const data = input as Record<string, unknown>;

  // Required fields
  if (!data.teacher_id || typeof data.teacher_id !== 'string') {
    errors.push('teacher_id is required and must be a string');
  } else if (!isValidUUID(data.teacher_id)) {
    errors.push('teacher_id must be a valid UUID');
  }

  if (!data.date || typeof data.date !== 'string') {
    errors.push('date is required and must be a string');
  } else if (!isValidDate(data.date)) {
    errors.push('date must be in YYYY-MM-DD format');
  }

  if (!data.time || typeof data.time !== 'string') {
    errors.push('time is required and must be a string');
  } else if (!isValidTime(data.time)) {
    errors.push('time must be in HH:MM format');
  }

  if (!data.subject || typeof data.subject !== 'string') {
    errors.push('subject is required and must be a string');
  } else if (data.subject.length > 100) {
    errors.push('subject must be less than 100 characters');
  }

  if (typeof data.price !== 'number' || data.price < 0 || data.price > 10000) {
    errors.push('price must be a positive number less than 10000');
  }

  // Optional fields validation
  if (data.duration !== undefined) {
    if (typeof data.duration !== 'number' || data.duration < 15 || data.duration > 480) {
      errors.push('duration must be between 15 and 480 minutes');
    }
  }

  if (data.learner_id !== undefined) {
    if (typeof data.learner_id !== 'string' || !isValidUUID(data.learner_id)) {
      errors.push('learner_id must be a valid UUID');
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      teacher_id: data.teacher_id as string,
      date: data.date as string,
      time: data.time as string,
      subject: sanitizeString(data.subject as string),
      duration: data.duration as number | undefined,
      price: data.price as number,
      use_free_session: data.use_free_session === true,
      learner_id: data.learner_id as string | undefined,
      subject_id: data.subject_id as string | undefined,
    }
  };
}

// Validate array of booking requests
export function validateBookingRequestArray(input: unknown): ValidationResult<BookingRequestInput[]> {
  if (!Array.isArray(input)) {
    return { success: false, errors: ['Request must be an array of bookings'] };
  }

  if (input.length === 0) {
    return { success: false, errors: ['At least one booking is required'] };
  }

  if (input.length > 20) {
    return { success: false, errors: ['Maximum 20 bookings allowed per request'] };
  }

  const validatedBookings: BookingRequestInput[] = [];
  const allErrors: string[] = [];

  input.forEach((booking, index) => {
    const result = validateBookingRequest(booking);
    if (!result.success) {
      result.errors?.forEach(err => allErrors.push(`Booking ${index + 1}: ${err}`));
    } else if (result.data) {
      validatedBookings.push(result.data);
    }
  });

  if (allErrors.length > 0) {
    return { success: false, errors: allErrors };
  }

  return { success: true, data: validatedBookings };
}

// Email notification validation
export interface EmailNotificationInput {
  type: string;
  recipient_email: string;
  recipient_name: string;
  data: Record<string, unknown>;
}

export function validateEmailNotification(input: unknown): ValidationResult<EmailNotificationInput> {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { success: false, errors: ['Invalid request body'] };
  }

  const data = input as Record<string, unknown>;

  if (!data.type || typeof data.type !== 'string') {
    errors.push('type is required');
  }

  if (!data.recipient_email || typeof data.recipient_email !== 'string') {
    errors.push('recipient_email is required');
  } else if (!isValidEmail(data.recipient_email)) {
    errors.push('recipient_email must be a valid email address');
  }

  if (!data.recipient_name || typeof data.recipient_name !== 'string') {
    errors.push('recipient_name is required');
  } else if (data.recipient_name.length > 100) {
    errors.push('recipient_name must be less than 100 characters');
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      type: data.type as string,
      recipient_email: data.recipient_email as string,
      recipient_name: sanitizeString(data.recipient_name as string),
      data: (data.data as Record<string, unknown>) || {},
    }
  };
}

// Helper functions
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function isValidDate(str: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(str)) return false;

  const date = new Date(str);
  return date instanceof Date && !isNaN(date.getTime());
}

function isValidTime(str: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  return timeRegex.test(str);
}

function isValidEmail(str: string): boolean {
  // More robust email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(str) && str.length <= 254;
}

function sanitizeString(str: string): string {
  // Remove potential XSS characters but keep basic formatting
  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Generic error response helper
export function validationErrorResponse(errors: string[], headers: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      error: 'Validation failed',
      details: errors,
    }),
    {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    }
  );
}
