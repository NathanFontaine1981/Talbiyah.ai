import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature, x-requested-with',
  'Access-Control-Max-Age': '86400',
}

// This function should be accessible without authentication for Stripe webhooks
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  console.log('🎫 STRIPE WEBHOOK RECEIVED:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    headers: {
      'stripe-signature': req.headers.get('stripe-signature') ? 'present' : 'missing',
      'content-type': req.headers.get('content-type'),
      'user-agent': req.headers.get('user-agent')
    }
  });

  try {
    // Get the raw body for webhook processing
    const body = await req.text()
    
    console.log('✅ Processing Stripe webhook (no auth required)');
    
    console.log('📨 Webhook body length:', body.length);
    
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
    console.log('🔑 Environment check:', {
      hasStripeKey: !!stripeKey,
      hasWebhookSecret: !!webhookSecret,
      supabaseUrl: Deno.env.get('SUPABASE_URL') ? 'present' : 'missing',
      serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'present' : 'missing'
    });
    
    if (!stripeKey) {
      console.error('❌ Missing Stripe secret key');
      throw new Error('Stripe secret key not found')
    }

    // Create Supabase client with service role for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Parse the webhook event
    const event = JSON.parse(body)
    
    console.log('📨 Webhook event:', {
      type: event.type,
      id: event.id,
      object: event.data?.object?.object,
      livemode: event.livemode,
      timestamp: new Date().toISOString()
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('💳 Payment succeeded for session:', {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          mode: session.mode,
          amountTotal: session.amount_total,
          currency: session.currency,
          customerEmail: session.customer_email,
          metadata: session.metadata
        });
        
        // Get the pending booking ID from metadata
        const pendingBookingId = session.metadata?.pending_booking_id
        const userId = session.metadata?.user_id
        const sessionCount = parseInt(session.metadata?.session_count || '1')
        
        if (!pendingBookingId) {
          console.error('❌ No pending_booking_id in session metadata:', {
            sessionId: session.id,
            metadata: session.metadata,
            allKeys: Object.keys(session.metadata || {})
          });
          break
        }

        console.log('🔍 Processing payment for:', {
          sessionId: session.id,
          pendingBookingId,
          userId,
          sessionCount,
          paymentIntent: session.payment_intent
        });

        // Fetch the pending booking details
        console.log('📋 Fetching pending booking...');
        
        const { data: pendingBooking, error: fetchError } = await supabaseClient
          .from('pending_bookings')
          .select('*')
          .eq('id', pendingBookingId)
          .single()

        if (fetchError || !pendingBooking) {
          console.error('❌ Failed to fetch pending booking:', {
            pendingBookingId,
            sessionId: session.id,
            error: fetchError,
            message: 'Could not find pending booking'
          });
          break
        }

        console.log('📋 Pending booking found:', {
          id: pendingBooking.id,
          userId: pendingBooking.user_id,
          totalAmount: pendingBooking.total_amount,
          bookingsCount: pendingBooking.bookings_data?.length || 0,
          status: pendingBooking.status,
          createdAt: pendingBooking.created_at
        });

        // Validate booking data
        if (!pendingBooking.bookings_data || !Array.isArray(pendingBooking.bookings_data)) {
          console.error('❌ Invalid bookings data in pending booking:', {
            pendingBookingId,
            bookingsData: pendingBooking.bookings_data
          });
          break
        }

        // Create bookings using the internal function that handles HMS room creation
        console.log(`🚀 Creating ${pendingBooking.bookings_data.length} bookings with HMS rooms...`);
        
        const createdBookings = []
        
        for (let i = 0; i < pendingBooking.bookings_data.length; i++) {
          const bookingData = pendingBooking.bookings_data[i]
          
          console.log(`🚀 Creating booking ${i + 1}/${pendingBooking.bookings_data.length} with HMS integration:`, {
            teacher: bookingData.teacher_id,
            date: bookingData.date,
            time: bookingData.time,
            subject: bookingData.subject,
            price: bookingData.price
          });
          
          try {
            // Validate required environment variables
            const supabaseUrl = Deno.env.get('SUPABASE_URL');
            const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
            
            if (!supabaseUrl || !serviceRoleKey) {
              console.error('❌ Missing required environment variables:', {
                hasSupabaseUrl: !!supabaseUrl,
                hasServiceRoleKey: !!serviceRoleKey
              });
              
              // Fallback: Try to process manually using SQL function
              console.log('🔄 Attempting fallback processing...');
              const fallbackResult = await supabaseClient.rpc('process_pending_booking', {
                p_pending_booking_id: pendingBookingId,
                p_stripe_payment_intent_id: session.payment_intent
              });
              
              if (fallbackResult.error) {
                console.error('❌ Fallback processing failed:', fallbackResult.error);
                continue;
              }
              
              console.log('✅ Fallback processing successful:', fallbackResult.data);
              createdBookings.push({ id: 'fallback_' + i, status: 'confirmed' });
              continue;
            }
            
            // Call the internal booking function that handles HMS room creation
            const internalResponse = await fetch(`${supabaseUrl}/functions/v1/create-single-booking-internal`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: pendingBooking.user_id,
                teacher_id: bookingData.teacher_id,
                date: bookingData.date,
                time: bookingData.time,
                subject: bookingData.subject,
                duration: bookingData.duration || 60,
                price: bookingData.price,
                payment_intent_id: session.payment_intent,
                use_free_session: bookingData.use_free_session || false
              })
            });

            console.log(`📡 Internal function response for booking ${i + 1}:`, {
              status: internalResponse.status,
              statusText: internalResponse.statusText,
              ok: internalResponse.ok,
              headers: Object.fromEntries(internalResponse.headers.entries())
            });

            if (!internalResponse.ok) {
              const errorText = await internalResponse.text()
              console.error(`❌ Internal booking creation failed for booking ${i + 1}:`, {
                status: internalResponse.status,
                statusText: internalResponse.statusText,
                error: errorText,
                url: `${supabaseUrl}/functions/v1/create-single-booking-internal`
              });
              
              // Try fallback processing
              console.log('🔄 Attempting fallback processing after internal function failure...');
              const fallbackResult = await supabaseClient.rpc('process_pending_booking', {
                p_pending_booking_id: pendingBookingId,
                p_stripe_payment_intent_id: session.payment_intent
              });
              
              if (fallbackResult.error) {
                console.error('❌ Fallback processing also failed:', fallbackResult.error);
                continue;
              }
              
              console.log('✅ Fallback processing successful after internal function failure');
              createdBookings.push({ id: 'fallback_' + i, status: 'confirmed' });
              continue;
            }

            const internalResult = await internalResponse.json()
            
            console.log(`📊 Internal function result for booking ${i + 1}:`, {
              success: internalResult.success,
              error: internalResult.error,
              booking: internalResult.booking ? {
                id: internalResult.booking.id,
                status: internalResult.booking.status,
                payment_status: internalResult.booking.payment_status
              } : null
            });
            
            if (!internalResult.success) {
              console.error(`❌ Internal booking creation returned error for booking ${i + 1}:`, internalResult.error);
              
              // Try fallback processing
              console.log('🔄 Attempting fallback processing after internal function error...');
              const fallbackResult = await supabaseClient.rpc('process_pending_booking', {
                p_pending_booking_id: pendingBookingId,
                p_stripe_payment_intent_id: session.payment_intent
              });
              
              if (fallbackResult.error) {
                console.error('❌ Fallback processing also failed:', fallbackResult.error);
                continue;
              }
              
              console.log('✅ Fallback processing successful after internal function error');
              createdBookings.push({ id: 'fallback_' + i, status: 'confirmed' });
              continue;
            }

            console.log(`✅ Booking ${i + 1} created successfully with HMS room:`, {
              bookingId: internalResult.booking?.id,
              roomId: internalResult.room?.id,
              teacherCode: internalResult.room?.codes?.teacher,
              studentCode: internalResult.room?.codes?.student,
              status: internalResult.booking?.status,
              paymentStatus: internalResult.booking?.payment_status
            });

            createdBookings.push(internalResult.booking);

            // ✨ ENHANCEMENT: Log payment event for audit trail
            try {
              console.log(`📝 Logging payment event for booking ${i + 1}...`);
              await supabaseClient.rpc('log_payment_event', {
                p_lesson_id: internalResult.booking.id,
                p_event_type: 'payment_succeeded',
                p_stripe_event_id: event.id,
                p_checkout_session_id: session.id,
                p_payment_intent_id: session.payment_intent,
                p_customer_id: session.customer,
                p_amount: bookingData.price,
                p_currency: 'gbp',
                p_payment_status: 'completed'
              });
              console.log(`   ✅ Payment logged for booking ${i + 1}`);
            } catch (logError) {
              console.log(`   ⚠️  Payment logging failed for booking ${i + 1}:`, logError);
            }

            // ✨ ENHANCEMENT: Create price lock for first booking with this teacher
            try {
              console.log(`🔐 Checking if price lock needed for booking ${i + 1}...`);
              const { count: existingBookings } = await supabaseClient
                .from('lessons')
                .select('id', { count: 'exact', head: true })
                .eq('student_id', pendingBooking.user_id)
                .eq('teacher_id', bookingData.teacher_id)
                .eq('payment_status', 'paid');

              if (existingBookings === 1) {
                console.log(`   📌 First booking with teacher - creating price lock...`);

                // Get the locked price from booking data or calculate hourly rate
                const duration = bookingData.duration || 60;
                const lockedHourlyPrice = (bookingData.price / (duration / 60));

                await supabaseClient
                  .from('student_teacher_pricing')
                  .insert({
                    student_id: pendingBooking.user_id,
                    teacher_id: bookingData.teacher_id,
                    initial_booking_date: new Date().toISOString(),
                    locked_hourly_price: lockedHourlyPrice,
                    price_locked_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 12 months
                    current_hourly_price: lockedHourlyPrice,
                    is_price_locked: true
                  })
                  .onConflict('student_id,teacher_id')
                  .ignoreDuplicates();

                console.log(`   ✅ Price lock created: £${lockedHourlyPrice.toFixed(2)}/hr for 12 months`);
              } else {
                console.log(`   ⏭️  Not first booking - price lock already exists or not needed`);
              }
            } catch (lockError) {
              console.log(`   ⚠️  Price lock creation failed for booking ${i + 1}:`, lockError);
            }

          } catch (error) {
            console.error(`💥 Error creating booking ${i + 1} with HMS:`, {
              error: error.message,
              stack: error.stack,
              bookingData
            });
            
            // Try fallback processing as last resort
            try {
              console.log('🔄 Final fallback attempt after exception...');
              const fallbackResult = await supabaseClient.rpc('process_pending_booking', {
                p_pending_booking_id: pendingBookingId,
                p_stripe_payment_intent_id: session.payment_intent
              });
              
              if (fallbackResult.error) {
                console.error('❌ Final fallback also failed:', fallbackResult.error);
              } else {
                console.log('✅ Final fallback successful');
                createdBookings.push({ id: 'fallback_' + i, status: 'confirmed' });
              }
            } catch (fallbackError) {
              console.error('💥 Final fallback threw exception:', fallbackError.message);
            }
          }
        }

        console.log(`🎉 Successfully created ${createdBookings.length}/${pendingBooking.bookings_data.length} bookings with HMS rooms`);

        if (createdBookings.length > 0) {
          // Update pending booking status to completed
          console.log('📝 Updating pending booking status to completed...');
          const { error: updateError } = await supabaseClient
            .from('pending_bookings')
            .update({ status: 'completed' })
            .eq('id', pendingBookingId)

          if (updateError) {
            console.error('⚠️ Failed to update pending booking status:', updateError);
          } else {
            console.log('✅ Pending booking marked as completed');
          }

          // Record the payment in payments table
          console.log('💰 Recording payment...');
          const { error: paymentError } = await supabaseClient
            .from('payments')
            .insert([{
              user_id: pendingBooking.user_id,
              stripe_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent,
              amount: pendingBooking.total_amount,
              currency: 'gbp',
              status: 'succeeded',
              payment_method: session.payment_method_types?.[0] || 'card'
            }])

          if (paymentError) {
            console.error('⚠️ Failed to record payment:', paymentError);
          } else {
            console.log('✅ Payment recorded successfully');
          }

          console.log(`💰 Payment processed successfully: ${createdBookings.length} sessions with HMS rooms totaling £${(pendingBooking.total_amount / 100).toFixed(2)}`);
        } else {
          // Mark pending booking as failed if no bookings were created
          console.log('❌ No bookings created, marking pending booking as failed...');
          await supabaseClient
            .from('pending_bookings')
            .update({ status: 'failed' })
            .eq('id', pendingBookingId)

          // Record the failed payment
          await supabaseClient
            .from('payments')
            .insert([{
              user_id: pendingBooking.user_id,
              stripe_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent,
              amount: pendingBooking.total_amount,
              currency: 'gbp',
              status: 'failed',
              payment_method: session.payment_method_types?.[0] || 'card'
            }])
        }
        
        break
      }
        
      case 'customer.subscription.created': {
        const subscription = event.data.object
        console.log('📅 Subscription created:', subscription.id)
        break
      }
        
      case 'customer.subscription.updated': {
        const updatedSubscription = event.data.object
        console.log('🔄 Subscription updated:', updatedSubscription.id)
        break
      }
        
      case 'customer.subscription.deleted': {
        const deletedSubscription = event.data.object
        console.log('❌ Subscription cancelled:', deletedSubscription.id)
        break
      }
        
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        console.log('💰 Invoice payment succeeded:', invoice.id)
        break
      }
        
      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object
        console.log('💸 Invoice payment failed:', failedInvoice.id)
        break
      }
        
      default:
        console.log('❓ Unhandled event type:', event.type)
    }

    console.log('✅ Webhook processed successfully');

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('💥 Webhook error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})