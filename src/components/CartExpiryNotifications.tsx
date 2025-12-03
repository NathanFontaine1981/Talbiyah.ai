import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { Clock, X, ShoppingCart, AlertTriangle } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';

export default function CartExpiryNotifications() {
  const { expiryNotifications, dismissExpiryNotification } = useCart();
  const navigate = useNavigate();

  if (expiryNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {expiryNotifications.map((notification) => {
        const expiresAt = new Date(notification.expiresAt);
        const minutesLeft = Math.max(0, differenceInMinutes(expiresAt, new Date()));
        const scheduledDate = new Date(notification.scheduledTime);

        return (
          <div
            key={notification.id}
            className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-4 shadow-2xl shadow-orange-500/30 animate-in slide-in-from-right-5 fade-in duration-300"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white text-sm">Cart Item Expiring!</h4>
                <p className="text-amber-100 text-xs mt-1 truncate">
                  Lesson with {notification.teacherName}
                </p>
                <p className="text-amber-100 text-xs">
                  {format(scheduledDate, 'MMM d, h:mm a')}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="w-3 h-3 text-white" />
                  <span className="text-white text-xs font-semibold">
                    {minutesLeft <= 1 ? 'Expires in less than a minute!' : `Expires in ${minutesLeft} minutes`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => dismissExpiryNotification(notification.id)}
                className="flex-shrink-0 text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="w-full mt-3 px-4 py-2 bg-white hover:bg-amber-50 text-amber-600 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Checkout Now
            </button>
          </div>
        );
      })}
    </div>
  );
}
