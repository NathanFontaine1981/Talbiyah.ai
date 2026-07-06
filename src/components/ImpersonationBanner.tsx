import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, LogOut, Loader2 } from 'lucide-react';
import { useImpersonation } from '../contexts/ImpersonationContext';

const BANNER_HEIGHT = '44px';

/**
 * Always-visible banner shown while an admin is acting as a student. Fixed to the
 * top of the viewport so it appears on every route and survives reloads. Provides
 * a one-click exit that restores the admin session.
 */
export default function ImpersonationBanner() {
  const { isImpersonating, target, exit, exiting } = useImpersonation();
  const navigate = useNavigate();

  // Offset page content so the fixed banner doesn't cover the top of the page.
  useEffect(() => {
    if (isImpersonating) {
      const prev = document.body.style.paddingTop;
      document.body.style.paddingTop = BANNER_HEIGHT;
      return () => {
        document.body.style.paddingTop = prev;
      };
    }
  }, [isImpersonating]);

  if (!isImpersonating || !target) return null;

  const handleExit = async () => {
    try {
      await exit();
      navigate('/admin/users');
    } catch (err) {
      // exit() failed to restore the admin session (it will have signed the user
      // out). Surface it and send them somewhere sane to re-authenticate.
      toast.error(err instanceof Error ? err.message : 'Failed to exit impersonation — please sign in again.');
      navigate('/');
    }
  };

  return (
    <div
      role="status"
      className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-black shadow-md"
    >
      <div className="max-w-[1600px] mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold truncate">
            Admin mode — acting as {target.name}
          </span>
          <span className="hidden sm:inline text-xs opacity-80 truncate">({target.email})</span>
        </div>
        <button
          onClick={handleExit}
          disabled={exiting}
          className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-md bg-black/85 hover:bg-black text-white text-sm font-medium transition disabled:opacity-60"
        >
          {exiting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exiting…
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4" />
              Exit / return to admin
            </>
          )}
        </button>
      </div>
    </div>
  );
}
