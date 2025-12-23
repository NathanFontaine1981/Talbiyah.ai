import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Matchmaking() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>

        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">Matchmaking</h1>
          <p className="text-xl text-gray-300">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}
