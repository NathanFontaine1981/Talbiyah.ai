import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useBookingAPI } from '../hooks/useBookingAPI';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, CreditCard, Lock, CheckCircle, Loader2, ShoppingCart, User, Gift } from 'lucide-react';
import { format } from 'date-fns';

interface Child {
  id: string;
  child_name: string;
  child_age: number | null;
  has_account: boolean;
  learner_id: string | null;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartCount, totalPrice, discount, finalPrice, loading: cartLoading, clearCart } = useCart();
  const { initiateBookingCheckout, loading: checkoutLoading } = useBookingAPI();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isParent, setIsParent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [referralBalance, setReferralBalance] = useState(0);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [creditBalance, setCreditBalance] = useState(0);
  const [creditsNeeded, setCreditsNeeded] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'credits'>('stripe');

  useEffect(() => {
    loadUserAndChildren();
    loadReferralBalance();
    loadCreditBalance();
  }, []);

  useEffect(() => {
    // Auto-calculate referral discount based on available balance
    if (referralBalance > 0 && finalPrice > 0) {
      const appliedAmount = Math.min(referralBalance, finalPrice - promoDiscount);
      setReferralDiscount(appliedAmount);
    } else {
      setReferralDiscount(0);
    }
  }, [referralBalance, finalPrice, promoDiscount]);

  useEffect(() => {
    // Calculate credits needed for cart
    // 1 credit = 60 minute lesson, 0.5 credits = 30 minute lesson
    const needed = cartItems.reduce((total, item) => {
      return total + (item.duration_minutes === 30 ? 0.5 : 1);
    }, 0);
    setCreditsNeeded(needed);

    // Auto-select payment method based on credit balance
    if (creditBalance >= needed && needed > 0) {
      setPaymentMethod('credits');
    } else {
      setPaymentMethod('stripe');
    }
  }, [cartItems, creditBalance]);

  async function loadUserAndChildren() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', user.id)
        .single();

      if (profile?.roles && profile.roles.includes('parent')) {
        setIsParent(true);

        const { data: childrenData } = await supabase
          .from('parent_children')
          .select('*')
          .eq('parent_id', user.id);

        // If parent has no children, treat them as booking for themselves
        if (!childrenData || childrenData.length === 0) {
          console.log('Parent has no children - treating as self-booking');
          setIsParent(false); // Treat as regular student
          setSelectedChildId('self');
        } else {
          const childrenWithLearners = await Promise.all(
            (childrenData || []).map(async (child) => {
              // Check if learner already exists for this child
              const { data: existingLearner } = await supabase
                .from('learners')
                .select('id')
                .eq('parent_id', user.id)
                .eq('name', child.child_name)
                .maybeSingle();

              let learnerId = existingLearner?.id;

              if (!learnerId) {
                // Create new learner for this child
                const { data: newLearner } = await supabase
                  .from('learners')
                  .insert({
                    parent_id: user.id,
                    name: child.child_name,
                    age: child.child_age
                  })
                  .select()
                  .single();

                if (newLearner) {
                  learnerId = newLearner.id;
                }
              }

              return {
                ...child,
                learner_id: learnerId
              };
            })
          );

          setChildren(childrenWithLearners);

          if (childrenWithLearners.length === 1) {
            setSelectedChildId(childrenWithLearners[0].id);
          }
        }
      } else {
        // Student booking for themselves
        setSelectedChildId('self');
      }
    } catch (err: any) {
      console.error('Error loading user/children:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadReferralBalance() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get or create referral credits
      let { data: credits } = await supabase
        .from('referral_credits')
        .select('available_balance')
        .eq('user_id', user.id)
        .single();

      if (!credits) {
        const { data: newCredits } = await supabase
          .from('referral_credits')
          .insert({ user_id: user.id })
          .select('available_balance')
          .single();
        credits = newCredits;
      }

      setReferralBalance(credits?.available_balance || 0);
    } catch (error) {
      console.error('Error loading referral balance:', error);
      setReferralBalance(0);
    }
  }

  async function loadCreditBalance() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_credits')
        .select('credits_remaining')
        .eq('user_id', user.id)
        .maybeSingle();

      setCreditBalance(data?.credits_remaining || 0);
    } catch (error) {
      console.error('Error loading credit balance:', error);
      setCreditBalance(0);
    }
  }

  async function applyPromoCode() {
    if (!promoCode.trim()) {
      setError('Please enter a promo code');
      return;
    }

    setApplyingPromo(true);
    setError('');

    try {
      // Handle special promo codes
      if (promoCode.toUpperCase() === '100HONOR' || promoCode.toUpperCase() === '100OWNER') {
        // Check if user has any completed lessons (must be first lesson)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { count } = await supabase
          .from('lessons')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .eq('status', 'completed');

        if (count && count > 0) {
          throw new Error('This promo code is only valid for your first lesson');
        }

        // Apply 100% discount
        setPromoDiscount(finalPrice);
        setPromoApplied(true);
        setError('');
      } else {
        throw new Error('Invalid promo code');
      }
    } catch (err: any) {
      console.error('Promo code error:', err);
      setError(err.message || 'Invalid promo code');
      setPromoDiscount(0);
      setPromoApplied(false);
    } finally {
      setApplyingPromo(false);
    }
  }

  async function handleCreditPayment(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setProcessing(true);

    try {
      if (isParent && !selectedChildId) {
        throw new Error('Please select which child these sessions are for');
      }

      if (creditBalance < creditsNeeded) {
        throw new Error(`Insufficient credits. You need ${creditsNeeded} credits but have ${creditBalance}.`);
      }

      console.log('💳 Processing credit-based booking via initiate-booking-checkout...');
      console.log('   Credits needed:', creditsNeeded);
      console.log('   Credits available:', creditBalance);

      // Prepare bookings array for initiate-booking-checkout
      const bookings = cartItems.map(item => {
        // Extract date and time from scheduled_time (ISO format)
        const date = item.scheduled_time.split('T')[0]; // "2025-11-20"
        const time = item.scheduled_time.split('T')[1].substring(0, 5); // "11:00"

        return {
          teacher_id: item.teacher_id,
          date: date,
          time: time,
          subject: item.subject_id,
          duration: item.duration_minutes,
          price: item.price,
          use_free_session: false
        };
      });

      console.log('📤 Sending bookings to API:', bookings.map(b => ({
        date: b.date,
        time: b.time,
        teacher: cartItems.find(item => item.teacher_id === b.teacher_id)?.teacher_name
      })));

      // Call initiate-booking-checkout which handles credit payment
      const response = await initiateBookingCheckout(bookings, {
        payment_with_credits: true // Flag to indicate intentional credit use
      });

      console.log('✅ Checkout response:', response);

      // Check if payment was made with credits
      if ((response as any).paid_with_credits) {
        console.log('✅ Booking paid with credits successfully!', {
          lessons_created: (response as any).lessons?.length || 0,
          credits_used: (response as any).credits_used,
          new_balance: (response as any).new_credit_balance
        });

        // Clear cart
        await clearCart();

        // Redirect to success page with booking details
        navigate('/booking-success', {
          state: {
            payment_method: 'credits',
            lessons_created: (response as any).lessons?.length || 1,
            credits_used: (response as any).credits_used || creditsNeeded,
            new_balance: (response as any).new_credit_balance || (creditBalance - creditsNeeded),
            bookings: cartItems.map(item => ({
              teacher_name: item.teacher_name,
              subject: item.subject_name,
              date: item.scheduled_time.split('T')[0],
              time: item.scheduled_time.split('T')[1].substring(0, 5),
              duration: item.duration_minutes
            }))
          }
        });
        return;
      }

      // Check for successful response with lessons created
      if ((response as any).success && (response as any).lessons && (response as any).lessons.length > 0) {
        console.log('✅ Lessons created successfully!', {
          lesson_count: (response as any).lessons.length,
          lesson_ids: (response as any).lessons.map((l: any) => l.id)
        });

        // Clear cart
        await clearCart();

        // Redirect to dashboard with success message
        navigate('/dashboard?booking_success=true&payment_method=credits');
        return;
      }

      // If we get here, something went wrong
      console.error('❌ Unexpected response format:', response);
      throw new Error('Unexpected response from checkout. Please check your dashboard to see if the booking was successful.');
    } catch (err: any) {
      console.error('Credit payment error:', err);
      setError(err.message || 'Failed to process credit payment');
    } finally {
      setProcessing(false);
    }
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setProcessing(true);

    try {
      if (isParent && !selectedChildId) {
        throw new Error('Please select which child these sessions are for');
      }

      // Get subject slugs from database
      const subjectIds = [...new Set(cartItems.map(item => item.subject_id))];
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, slug')
        .in('id', subjectIds);

      if (subjectsError) throw subjectsError;

      const subjectMap = new Map(subjects?.map(s => [s.id, s.slug]) || []);

      // Calculate total discount and price per item
      const totalDiscount = promoDiscount + referralDiscount;
      const discountRatio = totalDiscount / finalPrice;

      const bookings = cartItems.map(item => {
        let itemPrice = item.price;

        // Apply proportional discount if not 100% promo
        if (totalDiscount > 0 && totalDiscount < finalPrice) {
          itemPrice = Math.max(0, item.price * (1 - discountRatio));
        } else if (totalDiscount >= finalPrice) {
          itemPrice = 0;
        }

        return {
          teacher_id: item.teacher_id,
          subject_id: item.subject_id,
          scheduled_time: item.scheduled_time,
          date: item.scheduled_time.split('T')[0],
          time: item.scheduled_time.split('T')[1].substring(0, 5),
          subject: subjectMap.get(item.subject_id) || 'general',
          duration: item.duration_minutes,
          price: itemPrice,
          use_free_session: false
        };
      });

      // If 100% discount applied, create bookings directly without Stripe
      if (totalDiscount >= finalPrice) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        // Determine learner_id
        let learnerId: string;
        if (isParent && selectedChildId) {
          const selectedChild = children.find(c => c.id === selectedChildId);
          if (!selectedChild?.learner_id) {
            throw new Error('Selected child has no learner profile');
          }
          learnerId = selectedChild.learner_id;
        } else {
          // Student booking for themselves - get or create learner
          const { data: existingLearner } = await supabase
            .from('learners')
            .select('id')
            .eq('parent_id', session.user.id)
            .maybeSingle();

          if (existingLearner) {
            learnerId = existingLearner.id;
          } else {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', session.user.id)
              .single();

            const { data: newLearner } = await supabase
              .from('learners')
              .insert({
                parent_id: session.user.id,
                name: profile?.full_name || 'Student',
                gamification_points: 0
              })
              .select('id')
              .single();

            if (!newLearner) throw new Error('Failed to create learner profile');
            learnerId = newLearner.id;
          }
        }

        // Call edge function to create bookings with 100ms rooms
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-booking-with-room`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              cart_items: cartItems,
              learner_id: learnerId,
              promo_code: promoCode
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create booking');
        }

        const result = await response.json();
        console.log('Booking created:', result);

        // Deduct referral balance if used
        if (referralDiscount > 0) {
          const { data: credits } = await supabase
            .from('referral_credits')
            .select('available_balance, available_hours, total_used')
            .eq('user_id', session.user.id)
            .single();

          if (credits) {
            const hoursUsed = referralDiscount / 15; // £15 per hour
            await supabase
              .from('referral_credits')
              .update({
                available_balance: Math.max(0, credits.available_balance - referralDiscount),
                available_hours: Math.max(0, credits.available_hours - hoursUsed),
                total_used: credits.total_used + referralDiscount
              })
              .eq('user_id', session.user.id);

            // Record transaction
            await supabase
              .from('referral_transactions')
              .insert({
                user_id: session.user.id,
                type: 'used',
                credit_amount: -referralDiscount,
                hours_amount: -hoursUsed,
                description: `Used £${referralDiscount.toFixed(2)} referral balance for booking`
              });
          }
        }

        // Clear cart
        await clearCart();

        // Redirect to dashboard (no Stripe session for 100% discount)
        navigate('/dashboard?booking_success=true');
        return;
      }

      const response = await initiateBookingCheckout(bookings, {
        referral_discount: referralDiscount
      });

      // Check if payment was made with credits (no Stripe needed)
      if ((response as any).paid_with_credits) {
        console.log('✅ Booking paid with credits:', response);

        // Clear cart
        await clearCart();

        // Redirect to success page with booking details
        navigate('/booking-success', {
          state: {
            payment_method: 'credits',
            lessons_created: (response as any).lessons?.length || bookings.length,
            credits_used: (response as any).credits_used || creditsNeeded,
            new_balance: (response as any).new_credit_balance || (creditBalance - creditsNeeded),
            bookings: bookings.map(b => ({
              teacher_name: b.teacher_name,
              subject: b.subject_name,
              date: b.date,
              time: b.time,
              duration: b.duration_minutes
            }))
          }
        });
        return;
      }

      // Otherwise, redirect to Stripe checkout
      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to initiate checkout');
    } finally {
      setProcessing(false);
    }
  }

  if (loading || cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <ShoppingCart className="w-10 h-10 text-slate-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-slate-400 mb-6">Add lessons to your cart to checkout</p>
          <button
            onClick={() => navigate('/teachers')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-semibold transition"
          >
            Browse Teachers
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/teachers')}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Teachers</span>
        </button>

        <h1 className="text-4xl font-bold mb-8">
          <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Checkout
          </span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const scheduledDate = new Date(item.scheduled_time);
                  return (
                    <div
                      key={item.id}
                      className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-white">{item.teacher_name}</h4>
                          <p className="text-sm text-slate-400">{item.subject_name}</p>
                        </div>
                        <span className="font-bold text-white">£{item.price.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-slate-400">
                        {format(scheduledDate, 'EEE, MMM d, yyyy • h:mm a')} ({item.duration_minutes} min)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Credit Pack Savings Banner - Show to users who don't have enough credits */}
            {creditBalance < creditsNeeded && !(promoApplied && promoDiscount >= finalPrice) && (
              <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-2 border-emerald-500/30 rounded-2xl p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">💰 Save Money with Credit Packs!</h3>
                    <p className="text-slate-300 mb-4">
                      You need {creditsNeeded} credits for this booking. Instead of paying per lesson, buy a credit pack and save up to £40!
                    </p>

                    <div className="grid md:grid-cols-3 gap-3 mb-4">
                      {/* Light Pack */}
                      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                        <h4 className="font-bold text-cyan-400 mb-1">Light Pack</h4>
                        <p className="text-2xl font-bold text-white mb-1">£70</p>
                        <p className="text-sm text-slate-400 mb-2">5 credits</p>
                        <div className="text-xs text-emerald-400 font-semibold">Save £5 (7% off)</div>
                      </div>

                      {/* Standard Pack - BEST VALUE */}
                      <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-500 rounded-lg p-4 relative">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                          <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            BEST VALUE
                          </span>
                        </div>
                        <h4 className="font-bold text-emerald-400 mb-1 mt-2">Standard Pack</h4>
                        <p className="text-2xl font-bold text-white mb-1">£135</p>
                        <p className="text-sm text-slate-400 mb-2">10 credits</p>
                        <div className="text-xs text-emerald-400 font-semibold">Save £15 (10% off)</div>
                      </div>

                      {/* Intensive Pack */}
                      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                        <h4 className="font-bold text-cyan-400 mb-1">Intensive Pack</h4>
                        <p className="text-2xl font-bold text-white mb-1">£260</p>
                        <p className="text-sm text-slate-400 mb-2">20 credits</p>
                        <div className="text-xs text-emerald-400 font-semibold">Save £40 (13% off)</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        window.open('/buy-credits', '_blank');
                      }}
                      className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg font-bold transition shadow-lg flex items-center justify-center space-x-2"
                    >
                      <CreditCard className="w-5 h-5" />
                      <span>Buy Credit Pack & Save</span>
                    </button>

                    <p className="text-xs text-slate-400 mt-3 text-center">
                      Credits never expire • Use for 30 or 60-min lessons • 7-day refund policy
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <p className="text-sm text-slate-300">
                    <strong className="text-white">💡 Tip:</strong> Buy a pack now, then come back to complete this booking using your credits. No payment needed at checkout!
                  </p>
                </div>
              </div>
            )}

            {!(promoApplied && promoDiscount >= finalPrice) && (
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Method</span>
                </h2>

                {creditBalance >= creditsNeeded && creditsNeeded > 0 ? (
                  <div className="space-y-4">
                    <p className="text-slate-400 mb-4">
                      You have enough credits! Choose your payment method:
                    </p>

                    {/* Credit Balance Display */}
                    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 rounded-xl p-6 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Your Credit Balance</p>
                          <p className="text-3xl font-bold text-white">{creditBalance} credits</p>
                        </div>
                        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                          <CreditCard className="w-8 h-8 text-white" />
                        </div>
                      </div>

                      {paymentMethod === 'credits' && (
                        <div className="border-t border-cyan-500/20 pt-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-300">Credits to be used:</span>
                            <span className="font-semibold text-amber-400">-{creditsNeeded}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-300">Balance after purchase:</span>
                            <span className="font-bold text-emerald-400 text-lg">{creditBalance - creditsNeeded} credits</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Credit Payment Option */}
                    <button
                      onClick={() => setPaymentMethod('credits')}
                      className={`w-full p-4 rounded-lg border-2 transition ${
                        paymentMethod === 'credits'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          paymentMethod === 'credits'
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                            : 'bg-slate-700'
                        }`}>
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-white">Pay with Credits</p>
                          <p className="text-sm text-slate-400">
                            Use {creditsNeeded} of your {creditBalance} credits
                          </p>
                        </div>
                        {paymentMethod === 'credits' && (
                          <CheckCircle className="w-6 h-6 text-cyan-400" />
                        )}
                      </div>
                    </button>

                    {/* Stripe Payment Option */}
                    <button
                      onClick={() => setPaymentMethod('stripe')}
                      className={`w-full p-4 rounded-lg border-2 transition ${
                        paymentMethod === 'stripe'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          paymentMethod === 'stripe'
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                            : 'bg-slate-700'
                        }`}>
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-white">Pay with Card</p>
                          <p className="text-sm text-slate-400">
                            Secure payment via Stripe (£{Math.max(0, finalPrice - promoDiscount - referralDiscount).toFixed(2)})
                          </p>
                        </div>
                        {paymentMethod === 'stripe' && (
                          <CheckCircle className="w-6 h-6 text-cyan-400" />
                        )}
                      </div>
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-slate-400 mb-4">
                      You'll be redirected to Stripe for secure payment.
                    </p>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">Stripe Checkout</p>
                          <p className="text-sm text-slate-400">Secure payment processing</p>
                        </div>
                      </div>
                    </div>
                    {creditBalance > 0 && creditsNeeded > 0 && (
                      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="text-sm text-amber-300">
                          You have {creditBalance} credits, but need {creditsNeeded} credits for this booking.
                          <a href="/buy-credits" className="underline ml-1 hover:text-amber-200">Buy more credits</a>
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {promoApplied && promoDiscount >= finalPrice && (
              <div className="bg-emerald-900/20 rounded-2xl p-6 border border-emerald-500/30">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>Free Booking Confirmed</span>
                </h2>
                <p className="text-slate-300 mb-4">
                  Your promo code <span className="font-bold text-emerald-400">{promoCode.toUpperCase()}</span> has been applied! This booking is completely free.
                </p>
                <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-400">No payment required</p>
                      <p className="text-sm text-slate-300 mt-1">Click "Confirm Free Booking" to complete your booking.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Show notification when parent is booking for themselves */}
            {selectedChildId === 'self' && (
              <div className="bg-blue-500/10 rounded-2xl p-6 border border-blue-500/30">
                <div className="flex items-start space-x-3">
                  <User className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-bold text-blue-400 mb-2">Booking for Yourself</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      This booking is for you. As a parent, you can book lessons for yourself to learn alongside your children or for your own personal development.
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      💡 Want to add children to your account? Visit your dashboard settings to register your children and book lessons for them.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isParent && children.length > 0 && (
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Who is this for?</span>
                </h3>
                <div className="space-y-3">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChildId(child.id)}
                      className={`w-full p-4 rounded-xl text-left transition ${
                        selectedChildId === child.id
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5" />
                        <div>
                          <div className="font-semibold">{child.child_name}</div>
                          {child.child_age && (
                            <div className="text-sm opacity-75">Age {child.child_age}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 sticky top-6">
              {referralBalance > 0 && (
                <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Gift className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-bold text-amber-300">Referral Balance Available</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    You have £{referralBalance.toFixed(2)} in referral rewards. {referralDiscount > 0 ? `£${referralDiscount.toFixed(2)} will be automatically applied to this order!` : 'Will be applied automatically.'}
                  </p>
                </div>
              )}
              <h3 className="text-lg font-bold text-white mb-4">Price Breakdown</h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Lessons ({cartCount})</span>
                  <span>£{totalPrice.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-cyan-400">
                    <span>Block Discount</span>
                    <span>-£{discount.toFixed(2)}</span>
                  </div>
                )}
                {promoApplied && promoDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-400">
                    <span>Promo Code ({promoCode.toUpperCase()})</span>
                    <span>-£{promoDiscount.toFixed(2)}</span>
                  </div>
                )}
                {referralDiscount > 0 && (
                  <div className="flex items-center justify-between text-amber-400">
                    <span>Referral Balance (Auto-applied) 🎁</span>
                    <span>-£{referralDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-700 flex items-center justify-between text-xl font-bold text-white">
                  <span>Total</span>
                  <span>£{Math.max(0, finalPrice - promoDiscount - referralDiscount).toFixed(2)}</span>
                </div>
              </div>

              {/* Promo Code Section */}
              <div className="mb-6 pb-6 border-b border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Promo Code
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    disabled={promoApplied || applyingPromo}
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={applyPromoCode}
                    disabled={promoApplied || applyingPromo || !promoCode.trim()}
                    className="px-6 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 whitespace-nowrap"
                  >
                    {applyingPromo ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Applying...</span>
                      </>
                    ) : (
                      <span>Apply</span>
                    )}
                  </button>
                </div>
                {promoApplied && (
                  <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-400">Promo code applied!</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={paymentMethod === 'credits' ? handleCreditPayment : handleCheckout}
                disabled={processing || checkoutLoading || (isParent && !selectedChildId)}
                className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-lg font-bold transition shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {processing || checkoutLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : promoApplied && promoDiscount >= finalPrice ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Confirm Free Booking</span>
                  </>
                ) : paymentMethod === 'credits' ? (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Confirm Booking (Use {creditsNeeded} Credits)</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Proceed to Payment</span>
                  </>
                )}
              </button>

              {!(promoApplied && promoDiscount >= finalPrice) && paymentMethod === 'stripe' && (
                <p className="text-xs text-center text-slate-500 mt-4">
                  Secure payment powered by Stripe
                </p>
              )}
              {!(promoApplied && promoDiscount >= finalPrice) && paymentMethod === 'credits' && (
                <p className="text-xs text-center text-cyan-400 mt-4">
                  {creditsNeeded} credits will be deducted from your balance
                </p>
              )}
              {promoApplied && promoDiscount >= finalPrice && (
                <p className="text-xs text-center text-emerald-400 mt-4">
                  Your booking is completely free with promo code {promoCode.toUpperCase()}!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
