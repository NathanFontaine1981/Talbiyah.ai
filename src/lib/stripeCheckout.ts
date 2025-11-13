import { supabase } from './supabaseClient';

export interface CheckoutParams {
  teacher_id: string;
  duration: number; // in minutes
  scheduled_time: string; // ISO string
  subject_id?: string;
  discount_code?: string;
}

export interface CheckoutResponse {
  sessionId: string;
  sessionUrl: string;
  lessonId: string;
  amount: number;
}

/**
 * Create a Stripe checkout session for a lesson booking
 * @param params Lesson booking parameters
 * @returns Checkout session details including redirect URL
 */
export async function createStripeCheckout(params: CheckoutParams): Promise<CheckoutResponse> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-checkout`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(params)
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create checkout session');
  }

  const data = await response.json();
  return data;
}

/**
 * Redirect user to Stripe checkout
 * @param checkoutUrl The Stripe checkout URL
 */
export function redirectToStripeCheckout(checkoutUrl: string) {
  window.location.href = checkoutUrl;
}

/**
 * Complete checkout process: create session and redirect
 * @param params Lesson booking parameters
 */
export async function initiateStripeCheckout(params: CheckoutParams): Promise<void> {
  try {
    const checkout = await createStripeCheckout(params);
    redirectToStripeCheckout(checkout.sessionUrl);
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw error;
  }
}
