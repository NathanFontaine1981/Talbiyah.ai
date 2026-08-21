import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DashboardHeader from '../../components/DashboardHeader';
import StudentJourneyCard from '../../components/student/StudentJourneyCard';

export default function JourneyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <StudentJourneyCard />
      </main>
    </div>
  );
}
