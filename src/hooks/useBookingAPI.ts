import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const isSupabaseConfigured = true; // Always configured in new platform

interface TeacherSlot {
  id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_avatar: string;
  teacher_rating: number;
  date: string;
  time: string;
  duration: number;
  subject: string;
  price: number;
}

interface Booking {
  id: string;
  student_id: string;
  teacher_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  subject: string;
  price: number;
  status: string;
  payment_status: string;
  room_id?: string;
  room_code?: string;
  teacher_room_code?: string;
  student_room_code?: string;
  teacher_name?: string;
  teacher_avatar?: string;
  student_name?: string;
  student_avatar?: string;
  datetime: string;
  is_upcoming: boolean;
  can_join: boolean;
}

interface AvailabilitySlot {
  id?: string;
  day_of_week?: string;
  specific_date?: string;
  start_time: string;
  end_time: string;
  subject: string;
  is_recurring?: boolean;
  is_active?: boolean;
  min_advance_hours?: number;
  max_advance_days?: number;
  notes?: string;
}

interface BulkBookingRequest {
  teacher_id: string;
  date: string;
  time: string;
  subject: string;
  duration?: number;
  price: number;
  use_free_session?: boolean;
}

interface CheckoutResponse {
  success: boolean;
  checkout_url: string;
  session_id: string;
  pending_booking_id: string;
  total_amount: number;
  session_count: number;
}

export function useBookingAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = async (endpoint: string, options: any = {}) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please set up your database connection.');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    // Get the current session to use the access token for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('User not authenticated. Please log in to continue.');
    }

    console.log(`🔗 API Call: ${endpoint}`, {
      method: options.method || 'GET',
      hasAuth: !!session.access_token,
      timestamp: new Date().toISOString()
    });

    const response = await fetch(`${supabaseUrl}/functions/v1/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    console.log(`📡 API Response: ${endpoint}`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      
      console.error(`❌ API Error: ${endpoint}`, {
        status: response.status,
        error: errorData
      });
      
      // Handle specific error cases with better messages
      if (response.status === 409) {
        throw new Error('This time slot is no longer available. Another student may have just booked it.');
      } else if (response.status === 401) {
        throw new Error('Your session has expired. Please refresh the page and try again.');
      } else if (response.status === 404) {
        throw new Error('The requested resource was not found.');
      } else if (response.status >= 500) {
        // For 500 errors, include the details if available
        const errorMsg = errorData.details || errorData.error || 'Server error. Please try again in a few moments.';
        console.error('💥 Server error details:', errorData);
        throw new Error(errorMsg);
      }

      throw new Error(errorData.error || 'Request failed. Please try again.');
    }

    const responseData = await response.json();
    
    console.log(`✅ API Success: ${endpoint}`, {
      hasData: !!responseData,
      dataKeys: Object.keys(responseData)
    });

    return responseData;
  };

  // Teacher Availability Management
  const getAvailability = async (): Promise<AvailabilitySlot[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiCall('manage-teacher-availability');
      return data.availability || [];
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addAvailability = async (slot: AvailabilitySlot): Promise<AvailabilitySlot> => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiCall('manage-teacher-availability', {
        method: 'POST',
        body: JSON.stringify(slot),
      });
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (slot: AvailabilitySlot & { id: string }): Promise<AvailabilitySlot> => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiCall('manage-teacher-availability', {
        method: 'PUT',
        body: JSON.stringify(slot),
      });
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAvailability = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await apiCall(`manage-teacher-availability?id=${id}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Student Booking
  const getAvailableSlots = async (filters: { from?: string; to?: string; subject?: string; teacher_id?: string } = {}): Promise<TeacherSlot[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.teacher_id) params.append('teacher_id', filters.teacher_id);

      const data = await apiCall(`get-available-slots?${params.toString()}`);
      
      // Filter out past slots and ensure we only show truly available slots
      const now = new Date();
      const availableSlots = (data.slots || []).filter((slot: TeacherSlot) => {
        const slotDateTime = new Date(`${slot.date}T${slot.time}`);
        return slotDateTime > now;
      });
      
      return availableSlots;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (bookingData: {
    teacher_id: string;
    date: string;
    time: string;
    subject: string;
    duration?: number;
    price: number;
  }): Promise<{ booking: Booking; room: any }> => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiCall('create-booking', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // New Stripe checkout function
  const initiateBookingCheckout = async (bookings: BulkBookingRequest[], metadata?: any): Promise<CheckoutResponse> => {
    setLoading(true);
    setError(null);

    console.log('💳 Initiating booking checkout:', {
      bookingsCount: bookings.length,
      totalAmount: bookings.reduce((sum, b) => sum + b.price, 0),
      metadata,
      bookings: bookings.map(b => ({
        teacher: b.teacher_id,
        date: b.date,
        time: b.time,
        subject: b.subject,
        price: b.price
      }))
    });

    try {
      const data = await apiCall('initiate-booking-checkout', {
        method: 'POST',
        body: JSON.stringify({ bookings, metadata }),
      });
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to initiate checkout');
      }
      
      console.log('✅ Checkout initiated successfully:', {
        sessionId: data.session_id,
        checkoutUrl: data.checkout_url,
        totalAmount: data.total_amount,
        paidWithCredits: data.paid_with_credits,
        lessonsCreated: data.lessons?.length || 0
      });

      // Return all response data to support both Stripe and credit payments
      return {
        success: data.success,
        checkout_url: data.checkout_url,
        session_id: data.session_id,
        pending_booking_id: data.pending_booking_id,
        total_amount: data.total_amount,
        session_count: data.session_count,
        // Credit payment fields
        paid_with_credits: data.paid_with_credits,
        lessons: data.lessons,
        credits_used: data.credits_used,
        new_credit_balance: data.new_credit_balance,
        message: data.message
      };
    } catch (err: any) {
      console.error('❌ Checkout initiation failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Booking Management
  const getUserBookings = async (filters: { role?: 'student' | 'teacher'; status?: string; upcoming?: boolean } = {}): Promise<Booking[]> => {
    setLoading(true);
    setError(null);
    
    console.log('📅 Fetching user bookings:', {
      filters,
      timestamp: new Date().toISOString()
    });
    
    try {
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.upcoming) params.append('upcoming', 'true');

      const data = await apiCall(`get-user-bookings?${params.toString()}`);
      
      console.log('📊 User bookings response:', {
        success: data.success,
        bookingsCount: data.bookings?.length || 0,
        bookings: data.bookings?.map((b: Booking) => ({
          id: b.id,
          date: b.scheduled_date,
          time: b.scheduled_time,
          subject: b.subject,
          status: b.status,
          teacher: b.teacher_name,
          canJoin: b.can_join
        }))
      });
      
      return data.bookings || [];
    } catch (err: any) {
      console.error('❌ Failed to fetch user bookings:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string, reason?: string): Promise<Booking> => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiCall('cancel-booking', {
        method: 'POST',
        body: JSON.stringify({ booking_id: bookingId, reason }),
      });
      return data.booking;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    clearError: () => setError(null),
    
    // Teacher availability
    getAvailability,
    addAvailability,
    updateAvailability,
    deleteAvailability,
    
    // Student booking
    getAvailableSlots,
    createBooking,
    initiateBookingCheckout, // New Stripe checkout method
    
    // Booking management
    getUserBookings,
    cancelBooking,
  };
}