import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TalbiyahBot() {
  const navigate = useNavigate();


  return (
    <button
      onClick={() => navigate('/islamic-source-reference')}
      className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-full shadow-2xl shadow-emerald-500/50 flex items-center justify-center transition-all hover:scale-110 z-50 group"
      aria-label="Open Islamic Sources"
    >
      <MessageCircle className="w-7 h-7" />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Islamic Sources
      </div>
    </button>
  );
}
