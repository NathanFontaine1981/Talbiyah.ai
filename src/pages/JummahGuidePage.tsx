import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DashboardHeader from '../components/DashboardHeader';
import TTSProvider from '../components/shared/TTSProvider';
import JummahGuide from '../components/jummah/JummahGuide';

export default function JummahGuidePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <TTSProvider>
          <JummahGuide />
        </TTSProvider>
      </main>
    </div>
  );
}
