import { useState } from 'react';
import { Coins, ArrowRight, CheckCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface PointsRedemptionProps {
  learnerId: string;
  currentPoints: number;
  onRedemption: () => void;
}

const POINTS_PER_CREDIT = 1000;

export default function PointsRedemption({ learnerId, currentPoints, onRedemption }: PointsRedemptionProps) {
  const [showModal, setShowModal] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const availableCredits = Math.floor(currentPoints / POINTS_PER_CREDIT);

  async function handleRedeem() {
    if (availableCredits < 1) return;

    setRedeeming(true);
    setError('');

    try {
      const { error: redeemError } = await supabase.rpc('redeem_points_for_credits', {
        learner_id_param: learnerId,
        points_to_redeem: POINTS_PER_CREDIT
      });

      if (redeemError) throw redeemError;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowModal(false);
        onRedemption();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to redeem points. Please try again.');
    } finally {
      setRedeeming(false);
    }
  }

  if (availableCredits < 1) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <Coins className="w-6 h-6 text-gray-500" />
          <h3 className="text-lg font-bold text-gray-900">Redeem Points</h3>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          Convert your earned points into free lesson credits
        </p>
        <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Your Points</p>
            <p className="text-3xl font-bold text-gray-900">{currentPoints.toLocaleString()}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Points needed for 1 credit:</span>
              <span className="font-semibold text-gray-900">{POINTS_PER_CREDIT.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((currentPoints / POINTS_PER_CREDIT) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              {POINTS_PER_CREDIT - currentPoints} more points needed
            </p>
          </div>
        </div>
        <button
          disabled
          className="w-full px-4 py-3 bg-gray-200 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
        >
          Not Enough Points
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Redeem Points</h3>
        </div>
        <p className="text-gray-700 text-sm mb-4">
          You have enough points to redeem for free lesson credits!
        </p>
        <div className="bg-white rounded-lg p-4 border border-amber-200 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Your Points</p>
              <p className="text-2xl font-bold text-amber-600">{currentPoints.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Available Credits</p>
              <p className="text-2xl font-bold text-emerald-600">{availableCredits}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-lg font-semibold transition shadow-lg flex items-center justify-center space-x-2"
        >
          <span>Redeem 1 Free Hour</span>
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-xs text-gray-600 mt-2 text-center">
          {POINTS_PER_CREDIT} points = 1 free lesson hour
        </p>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            {success ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
                <p className="text-gray-600 mb-6">
                  You've redeemed 1 free lesson hour
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Confirm Redemption</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-gray-500 hover:text-gray-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200 mb-6">
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">You'll Spend</p>
                      <p className="text-3xl font-bold text-amber-600">{POINTS_PER_CREDIT}</p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-gray-500" />
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">You'll Receive</p>
                      <p className="text-3xl font-bold text-emerald-600">1</p>
                      <p className="text-xs text-gray-500">free hour</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-amber-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Remaining Points</span>
                      <span className="font-semibold text-gray-900">
                        {(currentPoints - POINTS_PER_CREDIT).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={redeeming}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRedeem}
                    disabled={redeeming}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-lg font-semibold transition shadow-lg disabled:opacity-50"
                  >
                    {redeeming ? 'Redeeming...' : 'Confirm'}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Free hours never expire and can be used for any lesson
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
