import SalahTutorial from '../components/salah/SalahTutorial';
import { useNavigate } from 'react-router-dom';

export default function SalahTutorialPage() {
  const navigate = useNavigate();

  return (
    <SalahTutorial
      standalone={true}
      onComplete={() => navigate('/dashboard')}
      onBack={() => navigate(-1)}
    />
  );
}
