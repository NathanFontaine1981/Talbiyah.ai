import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useBookingAPI } from '../hooks/useBookingAPI';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, CreditCard, Lock, CheckCircle, Loader2, ShoppingCart, User, Gift, Coins } from 'lucide-react';
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

        const childrenWithLearners = await Promise.all(
          (childrenData || []).map(async (child) => {
            let learnerId = child.learner_id;

            if (!learnerId) {
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

                await supabase
                  .from('parent_children')
                  .update({ learner_id: learnerId })
                  .eq('id', child.id);
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

      const { data: credits, error } = await supabase
        .from('user_credits')
        .select('credits_remaining')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading credit balance:', error);
        return;
      }

      if (credits) {
        setCreditBalance(credits.credits_remaining || 0);
        // Auto-select credits if user has enough
        const totalDurationHours = cartItems.reduce((acc, item) => acc + item.duration_minutes / 60, 0);
        if (credits.credits_remaining >= totalDurationHours) {
          setPaymentMethod('credits');
        }
      }
    } catch (error) {
      console.error('Error loading credit balance:', error);
      setCreditBalance(0);
    }
  }

  // Calculate credits needed for cart (1 credit = 1 lesson)
  const creditsNeeded = cartItems.length;
  const hasEnoughCredits = creditBalance >= creditsNeeded;

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

      // Handle credit payment
      if (paymentMethod === 'credits' && hasEnoughCredits) {
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
              payment_method: 'credits'
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create booking');
        }

        const result = await response.json();
        console.log('Booking created with credits:', result);

        // Deduct credits from user balance
        const newBalance = creditBalance - creditsNeeded;
        const { error: creditError } = await supabase
          .from('user_credits')
          .update({ credits_remaining: newBalance })
          .eq('user_id', session.user.id);

        if (creditError) {
          console.error('Error updating credit balance:', creditError);
        }

        // Record credit transaction (optional - table may not exist)
        try {
          await supabase
            .from('credit_transactions')
            .insert({
              user_id: session.user.id,
              type: 'debit',
              amount: -creditsNeeded,
              description: `Used ${creditsNeeded} ${creditsNeeded === 1 ? 'credit' : 'credits'} for lesson booking`,
              balance_after: newBalance
            });
        } catch (transactionError) {
          console.log('Credit transaction logging skipped:', transactionError);
        }

        // Clear cart
        await clearCart();

        // Redirect to dashboard
        navigate('/dashboard?booking_success=true&payment=credits');
        return;
      }

      const response = await initiateBookingCheckout(bookings, {
        referral_discount: referralDiscount
      });

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

            {!(promoApplied && promoDiscount >= finalPrice) && (
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Method</span>
                </h2>

                {/* Credit Balance Info */}
                {creditBalance > 0 && (
                  <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Coins className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-300">Your Credit Balance</span>
                      </div>
                      <span className="text-lg font-bold text-emerald-400">{creditBalance} {creditBalance === 1 ? 'credit' : 'credits'}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      This booking requires {creditsNeeded} {creditsNeeded === 1 ? 'credit' : 'credits'}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Credits Option */}
                  {creditBalance > 0 && (
                    <button
                      onClick={() => setPaymentMethod('credits')}
                      disabled={!hasEnoughCredits}
                      className={`w-full p-4 rounded-xl text-left transition border-2 ${
                        paymentMethod === 'credits'
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : hasEnoughCredits
                            ? 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                            : 'bg-slate-800/30 border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          paymentMethod === 'credits' ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}>
                          <Coins className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">Use Credits</p>
                          <p className="text-sm opacity-75">
                            {hasEnoughCredits
                              ? `Use ${creditsNeeded} ${creditsNeeded === 1 ? 'credit' : 'credits'} from your balance`
                              : `Need ${creditsNeeded - creditBalance} more ${(creditsNeeded - creditBalance) === 1 ? 'credit' : 'credits'}`
                            }
                          </p>
                        </div>
                        {paymentMethod === 'credits' && (
                          <CheckCircle className="w-6 h-6 text-emerald-400" />
                        )}
                      </div>
                    </button>
                  )}

                  {/* Stripe Option */}
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`w-full p-4 rounded-xl text-left transition border-2 ${
                      paymentMethod === 'stripe'
                        ? 'bg-cyan-500/20 border-cyan-500 text-white'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        paymentMethod === 'stripe' ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-slate-700'
                      }`}>
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Pay with Card</p>
                        <p className="text-sm opacity-75">Secure payment via Stripe</p>
                      </div>
                      {paymentMethod === 'stripe' && (
                        <CheckCircle className="w-6 h-6 text-cyan-400" />
                      )}
                    </div>
                  </button>
                </div>
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
                onClick={handleCheckout}
                disabled={processing || checkoutLoading || (isParent && !selectedChildId) || (paymentMethod === 'credits' && !hasEnoughCredits)}
                className={`w-full px-6 py-4 text-white rounded-xl text-lg font-bold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
                  paymentMethod === 'credits'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25'
                }`}
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
                    <Coins className="w-5 h-5" />
                    <span>Book with Credits</span>
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
                <p className="text-xs text-center text-emerald-400 mt-4">
                  {creditsNeeded} {creditsNeeded === 1 ? 'credit' : 'credits'} will be deducted from your balance
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
